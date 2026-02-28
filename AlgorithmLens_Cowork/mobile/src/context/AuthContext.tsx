/**
 * Authentication context provider.
 * Manages Supabase session state, user profile, and entitlements across the app.
 *
 * Entitlements are synced from the backend via /api/user/entitlements.
 * This is the backend source of truth for Plus status — the Supabase
 * is_user_plus column is a cache that may be stale. The entitlements
 * endpoint checks Stripe subscription status in real time.
 *
 * Fail-closed: if the entitlements call fails, isPlus defaults to false.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useEntitlements } from '../hooks/useEntitlements';
import { setSentryUser, addBreadcrumb } from '../lib/sentry';
import type { Session, User } from '@supabase/supabase-js';
import type { EntitlementsResponse } from '../types';

// H-07 FIX: AsyncStorage key for onboarding completion — belt-and-suspenders backup
// in case Supabase profile write fails silently.
const ONBOARDING_COMPLETED_KEY = '@algorithmlens_onboarding_completed';

interface UserProfile {
  has_completed_onboarding: boolean;
  ai_analysis_consent: boolean;
  is_user_plus: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** @deprecated Use `loading` instead. This property will be removed in a future version. */
  isLoading: boolean;
  userProfile: UserProfile | null;
  /** Whether the user has active Plus entitlements (RevenueCat → backend fallback). */
  isPlus: boolean;
  /** Source of Plus entitlement: 'revenuecat', 'backend', or null. */
  entitlementSource: 'revenuecat' | 'backend' | null;
  /** Subscription details from backend entitlements. */
  subscription: EntitlementsResponse['subscription'] | null;
  /** Re-fetch entitlements (e.g. after purchase or Stripe checkout return). */
  refreshEntitlements: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  completeOnboarding: (aiConsent?: boolean) => Promise<void>;
  updateAiConsent: (consent: boolean) => Promise<void>;
}

const defaultProfile: UserProfile = {
  has_completed_onboarding: false,
  ai_analysis_consent: true,
  is_user_plus: false,
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isLoading: true,
  userProfile: null,
  isPlus: false,
  entitlementSource: null,
  subscription: null,
  refreshEntitlements: async () => {},
  signOut: async () => {},
  signInWithOAuth: async () => {},
  completeOnboarding: async () => {},
  updateAiConsent: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Entitlements hook: syncs Plus status from backend.
  // Fails closed to free tier if the call fails.
  const hasSession = session !== null;
  const entitlements = useEntitlements(hasSession);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setSentryUser(session.user.id, 'free');
        addBreadcrumb('auth', 'Session restored on init');
        fetchOrCreateProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setSentryUser(session.user.id, 'free');
        addBreadcrumb('auth', `Auth state changed: ${_event}`, { userId: session.user.id });
        fetchOrCreateProfile(session.user.id);
      } else {
        setSentryUser(null);
        addBreadcrumb('auth', 'User signed out');
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetch user profile from Supabase, creating one if it doesn't exist.
   * H-07 FIX: Also checks AsyncStorage for onboarding completion flag
   * as a belt-and-suspenders backup in case Supabase write failed.
   */
  const fetchOrCreateProfile = async (userId: string) => {
    // H-07 FIX: Check AsyncStorage for local onboarding completion flag
    let localOnboardingCompleted = false;
    try {
      const localFlag = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      localOnboardingCompleted = localFlag === 'true';
    } catch {
      // Non-blocking — fallback to Supabase only
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding, ai_analysis_consent, is_user_plus')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        // H-07 FIX: If Supabase says not completed but local says completed,
        // trust local (the Supabase write may have failed silently)
        const onboardingCompleted = data.has_completed_onboarding || localOnboardingCompleted;
        setUserProfile({
          has_completed_onboarding: onboardingCompleted,
          ai_analysis_consent: data.ai_analysis_consent ?? true,
          is_user_plus: data.is_user_plus ?? false,
        });
      } else if (error?.code === 'PGRST116') {
        // No profile row exists — create one
        // H-07 FIX: If local says onboarding completed, set that in the new profile too
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            has_completed_onboarding: localOnboardingCompleted,
            ai_analysis_consent: true,
            is_user_plus: false,
          })
          .select('has_completed_onboarding, ai_analysis_consent, is_user_plus')
          .single();

        if (newProfile && !insertError) {
          setUserProfile({
            has_completed_onboarding: newProfile.has_completed_onboarding || localOnboardingCompleted,
            ai_analysis_consent: newProfile.ai_analysis_consent,
            is_user_plus: newProfile.is_user_plus,
          });
        } else {
          // Fallback if insert fails (e.g. table doesn't exist yet)
          setUserProfile({ ...defaultProfile, has_completed_onboarding: localOnboardingCompleted });
        }
      } else {
        // Some other error — use defaults but respect local onboarding flag
        setUserProfile({ ...defaultProfile, has_completed_onboarding: localOnboardingCompleted });
      }
    } catch {
      setUserProfile({ ...defaultProfile, has_completed_onboarding: localOnboardingCompleted });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark onboarding as complete — persists to Supabase, AsyncStorage, and updates local state.
   * H-07 FIX: Write to AsyncStorage as a belt-and-suspenders backup so onboarding
   * never re-shows even if Supabase write fails.
   */
  const completeOnboarding = async (aiConsent?: boolean) => {
    const consent = aiConsent ?? true;

    // Update local state immediately so navigation works
    setUserProfile((prev) => ({
      ...(prev || defaultProfile),
      has_completed_onboarding: true,
      ai_analysis_consent: consent,
    }));

    // H-07 FIX: Persist to AsyncStorage immediately — this is the belt-and-suspenders backup
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch {
      // Non-blocking
    }

    // Persist to Supabase in the background
    if (session?.user?.id) {
      try {
        await supabase
          .from('user_profiles')
          .upsert(
            {
              user_id: session.user.id,
              has_completed_onboarding: true,
              ai_analysis_consent: consent,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      } catch (err) {
        if (__DEV__) {
          console.warn('Could not persist onboarding status:', err);
        }
      }
    }
  };

  /**
   * Update AI analysis consent setting.
   */
  const updateAiConsent = async (consent: boolean) => {
    setUserProfile((prev) => ({
      ...(prev || defaultProfile),
      ai_analysis_consent: consent,
    }));

    if (session?.user?.id) {
      try {
        await supabase
          .from('user_profiles')
          .update({
            ai_analysis_consent: consent,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', session.user.id);
      } catch (err) {
        if (__DEV__) {
          console.warn('Could not persist AI consent:', err);
        }
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'algorithmLens://auth/callback',
      },
    });
    if (error) throw error;
  };

  const contextValue = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    isLoading: loading,
    userProfile,
    isPlus: entitlements.isPlus,
    entitlementSource: entitlements.source,
    subscription: entitlements.subscription,
    refreshEntitlements: entitlements.refresh,
    signOut,
    signInWithOAuth,
    completeOnboarding,
    updateAiConsent,
  }), [session, loading, userProfile, entitlements.isPlus, entitlements.source, entitlements.subscription, entitlements.refresh, signOut, signInWithOAuth, completeOnboarding, updateAiConsent]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
