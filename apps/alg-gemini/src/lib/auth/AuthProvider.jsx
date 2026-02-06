import React, { createContext, useState, useEffect, useRef } from 'react';
import { getSession, onAuthStateChange, sendMagicLink as sendMagicLinkHelper, signOut as signOutHelper } from './authSession';
import { setStoredPlanTier, getStoredPlanTier, PLAN_TIERS } from '../plan';
import { track, EVENTS } from '../analytics';

/**
 * AuthProvider - Manages auth session and syncs plan tier
 *
 * Provides:
 * - session: current Supabase session
 * - user: current user object
 * - authReady: boolean indicating initial auth check is complete
 * - sendMagicLink(email): send magic link email
 * - signOut(): sign out current user
 *
 * Plan tier sync rules (non-demo only):
 * - If session exists: set to "free" (unless already "plus")
 * - If no session: set to "anon"
 * - Never set "plus" here (comes later via Stripe)
 */

export const AuthContext = createContext({
  session: null,
  user: null,
  authReady: false,
  sendMagicLink: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const prevSessionRef = useRef(null);

  // Initialize session and subscribe to auth changes
  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') {
      setAuthReady(true);
      return;
    }

    // Get initial session
    getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);

      // Sync plan tier based on session
      syncPlanTier(initialSession);

      setAuthReady(true);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange((_event, newSession) => {
      const prevSession = prevSessionRef.current;

      setSession(newSession);
      setUser(newSession?.user || null);

      // Track login success (only when transitioning from no session to session)
      if (!prevSession && newSession) {
        // Check if not in demo mode
        const isDemoMode = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('demo') === '1'
          : false;

        if (!isDemoMode) {
          track(EVENTS.LOGIN_SUCCESS, {
            userId: newSession.user?.id || null,
          });
        }
      }

      // Update ref for next comparison
      prevSessionRef.current = newSession;

      // Sync plan tier when auth state changes
      syncPlanTier(newSession);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sync plan tier based on session state
  const syncPlanTier = (currentSession) => {
    // Skip if in demo mode (check URL)
    if (typeof window !== 'undefined') {
      const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
      if (isDemoMode) {
        return; // Don't sync in demo mode
      }
    }

    const currentTier = getStoredPlanTier();

    if (currentSession) {
      // User is logged in
      // Set to "free" unless already "plus"
      if (currentTier !== PLAN_TIERS.PLUS) {
        setStoredPlanTier(PLAN_TIERS.FREE);
      }
    } else {
      // User is not logged in
      // Set to "anon"
      setStoredPlanTier(PLAN_TIERS.ANON);
    }
  };

  // Send magic link wrapper
  const handleSendMagicLink = async (email) => {
    if (typeof window === 'undefined') {
      return { error: new Error('Not available server-side') };
    }

    const redirectTo = `${window.location.origin}/auth/callback`;
    return await sendMagicLinkHelper(email, redirectTo);
  };

  // Sign out wrapper
  const handleSignOut = async () => {
    const result = await signOutHelper();
    if (!result.error) {
      // Clear session state
      setSession(null);
      setUser(null);
      // Plan tier will be synced to "anon" via onAuthStateChange
    }
    return result;
  };

  const value = {
    session,
    user,
    authReady,
    sendMagicLink: handleSendMagicLink,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
