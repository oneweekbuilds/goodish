/**
 * useDashboard — fetches scan data from Supabase for the current user.
 *
 * Replaces the old hardcoded API URL approach with direct Supabase queries.
 * Returns scan history and details for the dashboard and history screens.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
  raw_data: any;
  user_id: string;
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
      const { data, error: fetchError } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        // If the table doesn't exist yet, just show empty state
        if (fetchError.code === '42P01' || fetchError.message?.includes('relation')) {
          setScans([]);
          setError(null);
        } else {
          throw fetchError;
        }
      } else {
        setScans(data || []);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Could not load scan history';
      console.warn('useDashboard fetch error:', errorMessage);
      setError(errorMessage);
      setScans([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    await fetchScans();
  }, [fetchScans]);

  // Fetch on mount (once) and when user changes
  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const latestScan = scans.length > 0 ? scans[0] : null;

  return {
    scans,
    latestScan,
    loading,
    error,
    refresh,
  };
};
