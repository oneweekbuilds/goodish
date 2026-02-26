/**
 * Auth module
 * Supabase authentication and session management
 */

export { supabase } from './supabaseClient';
export * from './authSession';
export { AuthProvider } from './AuthProvider';
export type { AuthContextValue } from './AuthProvider';
export { useAuth } from './useAuth';
