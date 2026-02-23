/**
 * useEntitlements — Syncs subscription entitlements from the backend.
 *
 * Mirrors the main site's entitlements.js pattern:
 * - Calls /api/user/entitlements to get the backend source of truth
 * - Fails closed to "free" tier if the call fails (security default)
 * - Provides is_plus, subscription details, and trial info
 * - Exposes a refresh function for post-checkout re-sync
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { EntitlementsResponse } from '../types';
import { setSentryUser } from '../lib/sentry';

interface EntitlementsState {
  /** Whether the user has an active Plus subscription. Defaults to false (fail closed). */
  isPlus: boolean;
  /** Full subscription details from the backend, or null if not fetched yet. */
  subscription: EntitlementsResponse['subscription'] | null;
  /** Whether the entitlements are currently being fetched. */
  loading: boolean;
  /** Error message if the last fetch failed. */
  error: string | null;
}

const FREE_TIER_DEFAULT: EntitlementsState = {
  isPlus: false,
  subscription: null,
  loading: false,
  error: null,
};

export function useEntitlements(hasSession: boolean) {
  const [state, setState] = useState<EntitlementsState>({
    ...FREE_TIER_DEFAULT,
    loading: hasSession,
  });

  const fetchEntitlements = useCallback(async () => {
    if (!hasSession) {
      setState(FREE_TIER_DEFAULT);
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data: EntitlementsResponse = await api.get('/api/user/entitlements');

      const isPlus = data.is_plus === true;
      setSentryUser(undefined, isPlus ? 'plus' : 'free');
      setState({
        isPlus,
        subscription: data.subscription,
        loading: false,
        error: null,
      });
    } catch (err) {
      // Fail closed: if entitlements cannot be verified, treat as free tier.
      // This matches the main site's security default.
      if (__DEV__) {
        console.warn('Entitlements fetch failed — defaulting to free tier:', err);
      }
      setState({
        isPlus: false,
        subscription: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to check subscription status',
      });
    }
  }, [hasSession]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  return {
    isPlus: state.isPlus,
    subscription: state.subscription,
    loading: state.loading,
    error: state.error,
    /** Re-fetch entitlements (e.g. after returning from Stripe checkout). */
    refresh: fetchEntitlements,
  };
}
