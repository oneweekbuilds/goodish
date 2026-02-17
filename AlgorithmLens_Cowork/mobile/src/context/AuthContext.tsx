/**
 * Authentication context provider.
 * Manages Supabase session state and user profile across the app.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

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
  signOut: async () => {},
  signInWithOAuth: async () => {},
  completeOnboarding: async () => {},
  updateAiConsent: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
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
        fetchOrCreateProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetch user profile from Supabase, creating one if it doesn't exist.
   */
  const fetchOrCreateProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding, ai_analysis_consent, is_user_plus')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setUserProfile({
          has_completed_onboarding: data.has_completed_onboarding ?? false,
          ai_analysis_consent: data.ai_analysis_consent ?? true,
          is_user_plus: data.is_user_plus ?? false,
        });
      } else if (error?.code === 'PGRST116') {
        // No profile row exists — create one
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            has_completed_onboarding: false,
            ai_analysis_consent: true,
            is_user_plus: false,
          })
          .select('has_completed_onboarding, ai_analysis_consent, is_user_plus')
          .single();

        if (newProfile && !insertError) {
          setUserProfile({
            has_completed_onboarding: newProfile.has_completed_onboarding,
            ai_analysis_consent: newProfile.ai_analysis_consent,
            is_user_plus: newProfile.is_user_plus,
          });
        } else {
          // Fallback if insert fails (e.g. table doesn't exist yet)
          setUserProfile({ ...defaultProfile });
        }
      } else {
        // Some other error — use defaults
        setUserProfile({ ...defaultProfile });
      }
    } catch {
      setUserProfile({ ...defaultProfile });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark onboarding as complete — persists to Supabase and updates local state.
   */
  const completeOnboarding = async (aiConsent?: boolean) => {
    const consent = aiConsent ?? true;

    // Update local state immediately so navigation works
    setUserProfile((prev) => ({
      ...(prev || defaultProfile),
      has_completed_onboarding: true,
      ai_analysis_consent: consent,
    }));

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
        console.warn('Could not persist onboarding status:', err);
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
        console.warn('Could not persist AI consent:', err);
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

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isLoading: loading,
        userProfile,
        signOut,
        signInWithOAuth,
        completeOnboarding,
        updateAiConsent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
