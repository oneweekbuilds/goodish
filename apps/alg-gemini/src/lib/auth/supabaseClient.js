import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration
 * Hardcoded credentials for now (will be moved to env in production)
 */

const supabaseUrl = 'https://czrehjybsqzmudtgneqy.supabase.co';
// gitleaks:allow - This is the public anon key, safe for client-side use
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cmVoanlic3F6bXVkdGduZXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODM5OTIsImV4cCI6MjA4NTk1OTk5Mn0.3kM6wCcpTPPJdcFHCF1aUrPI0teRdsQtE3Dtug6wqVs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
