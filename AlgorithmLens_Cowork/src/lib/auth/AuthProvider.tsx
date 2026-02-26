import React, { createContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { getSession, onAuthStateChange, sendMagicLink as sendMagicLinkHelper, signOut as signOutHelper } from './authSession';
import { PLAN_TIERS } from '../plan';
import { track, EVENTS } from '../analytics';
import { syncPlanTierFromEntitlements } from '../plan/entitlements';
import { sendAuthTokenToExtension } from '../extension/extensionBridge';
import { setSentryUser, addBreadcrumb } from '../sentry.js';
import type { Session } from '@supabase/supabase-js';

/**
 * Auth context value shape
 */
export interface AuthContextValue {
  session: Session | null;
  user: Session['user'] | null;
  authReady: boolean;
  sendMagicLink: (email: string) => Promise<{ data?: unknown; error?: Error | null }>;
  signOut: () => Promise<{ error?: Error | null }>;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  authReady: false,
  sendMagicLink: async () => ({}),
  signOut: async () => ({}),
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session['user'] | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const prevSessionRef = useRef<Session | null>(null);
  const syncInProgressRef = useRef(false);

  const syncPlanTier = useCallback(async (currentSession: Session | null, authReadyOverride?: boolean) => {
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      setAuthReady(true);
      return;
    }

    getSession().then(({ data: { session: initialSession } = { session: null } }) => {
      setSession(initialSession || null);
      setUser(initialSession?.user || null);

      if (initialSession?.user) {
        setSentryUser(initialSession.user.id, 'free');
        addBreadcrumb('auth', 'Session restored on init');
      }

      syncPlanTier(initialSession || null, true);

      if (initialSession?.access_token) {
        sendAuthTokenToExtension(initialSession.access_token).catch((err: Error) => {
          console.warn('[AlgorithmLens] Failed to push auth token to extension on init:', err.message || err);
        });
      }

      setAuthReady(true);
    });

    const { data: { subscription } } = onAuthStateChange((event, newSession) => {
      const prevSession = prevSessionRef.current;

      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        setSentryUser(newSession.user.id, 'free');
        addBreadcrumb('auth', `Auth state changed: ${event}`, { userId: newSession.user.id });
      } else {
        setSentryUser(null);
        addBreadcrumb('auth', 'User signed out');
      }

      if (!prevSession && newSession) {
        track(EVENTS.LOGIN_SUCCESS);
      }

      prevSessionRef.current = newSession;

      syncPlanTier(newSession, true);

      sendAuthTokenToExtension(newSession?.access_token || null).catch((err: Error) => {
        console.warn('[AlgorithmLens] Failed to push auth token to extension on auth change:', err.message || err);
      });
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [syncPlanTier]);

  const handleSendMagicLink = async (email: string) => {
    if (typeof window === 'undefined') {
      return { error: new Error('Not available server-side') };
    }

    const redirectTo = `${window.location.origin}/auth/callback`;
    return await sendMagicLinkHelper(email, redirectTo);
  };

  const handleSignOut = async () => {
    const result = await signOutHelper();
    if (!result.error) {
      setSession(null);
      setUser(null);
      sendAuthTokenToExtension(null).catch((err: Error) => {
        console.warn('[AlgorithmLens] Failed to clear auth token in extension on sign-out:', err.message || err);
      });
    }
    return result;
  };

  const value: AuthContextValue = {
    session,
    user,
    authReady,
    sendMagicLink: handleSendMagicLink,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
