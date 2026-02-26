import { supabase } from './supabaseClient';
import type { Session, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

/**
 * Auth session helpers
 * Wrappers around Supabase auth methods
 */

export interface SessionResponse {
  data: { session: Session | null };
  error: Error | null;
}

export interface AuthSubscription {
  data: { subscription: Subscription };
}

/**
 * Get current session
 */
export async function getSession(): Promise<SessionResponse> {
  return await supabase.auth.getSession() as SessionResponse;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): AuthSubscription {
  return supabase.auth.onAuthStateChange(callback) as AuthSubscription;
}

/**
 * Send magic link email
 */
export async function sendMagicLink(
  email: string,
  redirectTo: string
): Promise<{ data: unknown; error: Error | null }> {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  return await supabase.auth.signOut();
}

/**
 * Exchange code for session (for callback page)
 */
export async function exchangeCodeForSession(): Promise<SessionResponse> {
  return await getSession();
}
