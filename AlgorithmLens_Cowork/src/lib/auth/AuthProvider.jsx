import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { getSession, onAuthStateChange, sendMagicLink as sendMagicLinkHelper, signOut as signOutHelper } from './authSession';
import { PLAN_TIERS } from '../plan';
import { track, EVENTS } from '../analytics';
import { syncPlanTierFromEntitlements } from '../plan/entitlements';

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
 * - Syncs plan tier from backend entitlements (backend is source of truth)
 * - If session exists: fetches entitlements and sets tier (free/plus)
 * - If no session: set to "anon"
 * - Fails closed: if entitlements fetch fails, sets to "free" (not "plus")
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
  const syncInProgressRef = useRef(false);

  // Sync plan tier from backend entitlements
  // authReadyOverride allows the caller to assert auth is ready (e.g. right after getSession resolves)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Note: authReady is NOT in dependency array because authReadyOverride parameter takes precedence;
  // dependency on authReady would create unnecessary effect triggers
  const syncPlanTier = useCallback(async (currentSession, authReadyOverride) => {
    if (syncInProgressRef.current) {
      return;
    }

    syncInProgressRef.current = true;

    try {
      const isDemoMode = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('demo') === '1'
        : false;

      const hasSession = Boolean(currentSession);
      const effectiveAuthReady = authReadyOverride !== undefined ? authReadyOverride : authReady;

      await syncPlanTierFromEntitlements({
        isDemoMode,
        authReady: effectiveAuthReady,
        hasSession
      });
    } finally {
      syncInProgressRef.current = false;
    }
  }, []);

  // Initialize session and subscribe to auth changes
  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') {
      setAuthReady(true);
      return;
    }

    // Get initial session
    getSession().then((initialSession) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);

      // Sync plan tier based on session (fire and forget — DashboardPage does its own sync)
      syncPlanTier(initialSession, true);

      setAuthReady(true);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange((event, newSession) => {
      const prevSession = prevSessionRef.current;

      setSession(newSession);
      setUser(newSession?.user || null);

      // Track login success (only when transitioning from no session to session)
      if (!prevSession && newSession) {
        track(EVENTS.LOGIN_SUCCESS);
      }

      // Update ref for next comparison
      prevSessionRef.current = newSession;

      // Sync plan tier when auth state changes
      syncPlanTier(newSession, true);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [syncPlanTier]);

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
