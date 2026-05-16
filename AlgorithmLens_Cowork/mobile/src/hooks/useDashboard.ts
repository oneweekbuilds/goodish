/**
 * useDashboard — fetches scan data from Supabase for the current user.
 *
 * Replaces the old hardcoded API URL approach with direct Supabase queries.
 * Returns scan history and details for the dashboard and history screens.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { captureError, captureMessage } from '../lib/sentry';

// Supabase PostgreSQL error code for table not found
const SUPABASE_RELATION_NOT_FOUND = '42P01';

// Timeout for Supabase queries (ms)
const SUPABASE_QUERY_TIMEOUT_MS = 10000;

export interface ScanDetail {
  id: string;
  scan_id?: string;
  created_at: string;
  platform: string;
  post_count: number;
  ad_count: number;
  ad_percentage: number;
  suggested_count: number;
  suggested_percentage: number;
  raw_data: Record<string, unknown>;
  user_id: string;
  /**
   * @deprecated Build #44: this column does not exist on the live Supabase
   * 'scans' table — broadcast scans previously failed to persist because
   * the insert included this top-level key. Read sites now derive the
   * source type from `raw_data.source_type` (or infer it from
   * `raw_data.broadcast_capture` being present). Field kept on the type
   * for backward compatibility with any historical rows.
   */
  source_type?: string;
  /**
   * @deprecated Build #44: not a real column on the 'scans' table. Read
   * sites should pull duration from `raw_data.duration_seconds` (scanner
   * scans) or `raw_data.broadcast_capture.duration_seconds` (broadcast
   * scans). Field kept on the type for backward compatibility.
   */
  duration_seconds?: number;
}

interface UseDashboardReturn {
  scans: ScanDetail[];
  latestScan: ScanDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDashboard = (): UseDashboardReturn => {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchScans = useCallback(async () => {
    if (!user?.id) {
      setScans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryPromise = supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase query timed out')), SUPABASE_QUERY_TIMEOUT_MS)
      );

      const { data, error: fetchError } = await Promise.race([queryPromise, timeoutPromise]);

      if (fetchError) {
        // If the table doesn't exist yet, just show empty state
        if (fetchError.code === SUPABASE_RELATION_NOT_FOUND || fetchError.message?.includes('relation')) {
          setScans([]);
          setError(null);
        } else {
          throw fetchError;
        }
      } else {
        setScans(data || []);
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Unknown error');
      captureMessage('useDashboard fetch error', 'warning', { error: rawMessage, userId: user.id });
      captureError(
        err instanceof Error ? err : new Error(rawMessage),
        'useDashboard:fetchScans',
        { userId: user.id }
      );
      // User-friendly error — never show technical details
      setError('We couldn\'t load your scan history right now. Pull down to try again.');
      setScans([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    await fetchScans();
  }, [fetchScans]); // refresh is already wrapped in useCallback

  // Fetch on mount (once) and when user changes
  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const latestScan = scans.length > 0 ? (scans[0] ?? null) : null;

  return {
    scans,
    latestScan,
    loading,
    error,
    refresh,
  };
};
