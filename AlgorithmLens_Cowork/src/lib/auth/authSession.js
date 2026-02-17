import { supabase } from './supabaseClient';

/**
 * Auth session helpers
 * Wrappers around Supabase auth methods
 */

/**
 * Get current session
 * @returns {Promise<{data: {session}, error}>}
 */
export async function getSession() {
  return await supabase.auth.getSession();
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called when auth state changes
 * @returns {Object} Subscription object with unsubscribe method
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Send magic link email
 * @param {string} email
 * @param {string} redirectTo - Full URL to redirect after verification
 * @returns {Promise<{data, error}>}
 */
export async function sendMagicLink(email, redirectTo) {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
}

/**
 * Sign out current user
 * @returns {Promise<{error}>}
 */
export async function signOut() {
  return await supabase.auth.signOut();
}

/**
 * Exchange code for session (for callback page)
 * @returns {Promise<{data: {session}, error}>}
 */
export async function exchangeCodeForSession() {
  // In Supabase v2, the session is automatically set after redirect
  // We just need to get it
  return await getSession();
}
