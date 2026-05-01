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

// Build #34 diagnostic export. Read by DebugCheckpointTrail in app/_layout.tsx
// to render auth-lifecycle counters in the on-screen footer. Mutable singleton.
// Counters are monotonically increasing so the trail can show "auth started but
// never finished" patterns even if the resolution happens after a re-render.
export const __authDiag: {
  gsResolved: number;     // supabase.auth.getSession() resolved
  gsRejected: number;     // supabase.auth.getSession() rejected
  gsTimedOut: number;     // 5s race won the getSession race
  fpStarted: number;      // fetchOrCreateProfile invocation started
  fpResolved: number;     // fetchOrCreateProfile completed cleanly
  fpTimedOut: number;     // fetchOrCreateProfile race-timeout hit
  fpFailed: number;       // fetchOrCreateProfile threw
  authChanges: number;    // onAuthStateChange events
  hardFailsafe: number;   // 7s hard-failsafe forced loading=false
  lastError: string;      // last captured error text (truncated to 64 chars)
} = {
  gsResolved: 0,
  gsRejected: 0,
  gsTimedOut: 0,
  fpStarted: 0,
  fpResolved: 0,
  fpTimedOut: 0,
  fpFailed: 0,
  authChanges: 0,
  hardFailsafe: 0,
  lastError: '',
};

const recordAuthError = (where: string, err: unknown) => {
  __authDiag.lastError = `${where}: ${String(err).slice(0, 48)}`;
};

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
    // Guard against `supabase.auth.getSession()` rejecting OR hanging during
    // app launch. Both modes have hit production iOS builds (stale Keychain
    // session forcing a refresh on a slow network, sandboxed Keychain at cold
    // launch). With no protection, `setLoading(false)` is never reached and
    // the splash stays up forever. Race against a 5s timeout AND catch
    // rejections; whichever path wins, fail open to "no session" so the
    // splash dismisses and the user can hit /(auth)/login.
    //
    // `settled` prevents double-settling if the race timer fires first and
    // the real getSession resolves later. `cancelled` prevents setState
    // after unmount.
    const SESSION_TIMEOUT_MS = 5000;
    const HARD_FAILSAFE_MS = 7000;
    let settled = false;
    let cancelled = false;

    const handleSession = (session: Session | null) => {
      if (cancelled || settled) return;
      settled = true;
      setSession(session);
      if (session?.user) {
        setSentryUser(session.user.id, 'free');
        addBreadcrumb('auth', 'Session restored on init');
        fetchOrCreateProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        __authDiag.gsResolved += 1;
        handleSession(session);
      })
      .catch((err) => {
        __authDiag.gsRejected += 1;
        recordAuthError('getSession', err);
        if (cancelled || settled) return;
        settled = true;
        addBreadcrumb('auth', 'getSession failed — defaulting to logged-out', { error: String(err) });
        setLoading(false);
      });

    setTimeout(() => {
      if (cancelled || settled) return;
      settled = true;
      __authDiag.gsTimedOut += 1;
      addBreadcrumb('auth', 'getSession timed out after 5s — defaulting to logged-out');
      setLoading(false);
    }, SESSION_TIMEOUT_MS);

    // Build #34 hard-failsafe: belt-and-suspenders. If, despite all the inner
    // races (getSession 5s timeout, fetchOrCreateProfile 5s timeout), `loading`
    // is somehow still true at 7s, force it false. This guarantees the splash
    // dismisses to the login screen even if a future regression introduces a
    // new hang path. The functional setLoading lets us read the latest value
    // without putting `loading` in this effect's dep list (which would cause
    // the effect to re-run and re-bind the auth listener on every change).
    setTimeout(() => {
      if (cancelled) return;
      setLoading((current) => {
        if (current) {
          __authDiag.hardFailsafe += 1;
          addBreadcrumb('auth', 'hard failsafe at 7s forced loading=false');
          return false;
        }
        return current;
      });
    }, HARD_FAILSAFE_MS);

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      __authDiag.authChanges += 1;
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

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Fetch user profile from Supabase, creating one if it doesn't exist.
   * H-07 FIX: Also checks AsyncStorage for onboarding completion flag
   * as a belt-and-suspenders backup in case Supabase write failed.
   *
   * Build #34: races the entire body against a 5s timeout. If Supabase hangs
   * (sandboxed Keychain at cold launch, slow network, RLS deadlock), the
   * timeout wins, we fall back to defaults + local AsyncStorage flag, and
   * setLoading(false) still runs. Without this, a hung profile fetch left
   * `loading` true forever and the splash never dismissed.
   */
  const fetchOrCreateProfile = async (userId: string) => {
    __authDiag.fpStarted += 1;
    const PROFILE_TIMEOUT_MS = 5000;
    let profileSettled = false;

    // H-07 FIX: Check AsyncStorage for local onboarding completion flag
    let localOnboardingCompleted = false;
    try {
      const localFlag = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      localOnboardingCompleted = localFlag === 'true';
    } catch {
      // Non-blocking — fallback to Supabase only
    }

    const work = (async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('has_completed_onboarding, ai_analysis_consent, is_user_plus')
          .eq('user_id', userId)
          .single();

        if (profileSettled) return;

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

          if (profileSettled) return;

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

        __authDiag.fpResolved += 1;
      } catch (err) {
        if (profileSettled) return;
        __authDiag.fpFailed += 1;
        recordAuthError('fetchProfile', err);
        setUserProfile({ ...defaultProfile, has_completed_onboarding: localOnboardingCompleted });
      } finally {
        if (!profileSettled) {
          profileSettled = true;
          setLoading(false);
        }
      }
    })();

    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => {
        if (profileSettled) {
          resolve();
          return;
        }
        profileSettled = true;
        __authDiag.fpTimedOut += 1;
        addBreadcrumb('auth', 'fetchOrCreateProfile timed out after 5s — defaulting to local flag');
        setUserProfile({ ...defaultProfile, has_completed_onboarding: localOnboardingCompleted });
        setLoading(false);
        resolve();
      }, PROFILE_TIMEOUT_MS),
    );

    await Promise.race([work, timeout]);
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
