/**
 * useEntitlements — Syncs subscription entitlements with RevenueCat → backend fallback.
 *
 * Phase 4 update: Now checks RevenueCat (native IAP) FIRST for Plus status.
 * If RevenueCat confirms "plus" entitlement, the user is Plus — no backend call needed.
 * If RevenueCat fails, is in mock mode, or returns false, falls back to the backend
 * /api/user/entitlements endpoint (which checks Stripe subscription status).
 *
 * This preserves backward compatibility: existing Stripe web subscribers still get
 * their entitlements via the backend API. New mobile subscribers will be handled
 * by RevenueCat (or the mock service in development).
 *
 * Priority chain:
 * 1. RevenueCat checkPlusStatus() → if true, user is Plus
 * 2. Backend /api/user/entitlements → Stripe source of truth
 * 3. Fail closed to free tier if both fail
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { checkPlusStatus as rcCheckPlusStatus, IS_MOCK_MODE } from '../services/revenueCat';
import type { EntitlementsResponse } from '../types';
import { setSentryUser } from '../lib/sentry';

interface EntitlementsState {
  /** Whether the user has an active Plus subscription. Defaults to false (fail closed). */
  isPlus: boolean;
  /** Source of the Plus entitlement: 'revenuecat', 'backend', or null. */
  source: 'revenuecat' | 'backend' | null;
  /** Full subscription details from the backend, or null if not fetched yet. */
  subscription: EntitlementsResponse['subscription'] | null;
  /** Whether the entitlements are currently being fetched. */
  loading: boolean;
  /** Error message if the last fetch failed. */
  error: string | null;
}

const FREE_TIER_DEFAULT: EntitlementsState = {
  isPlus: false,
  source: null,
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

    // Step 1: Check RevenueCat for Plus status (native IAP)
    let rcPlus = false;
    try {
      rcPlus = await rcCheckPlusStatus();
    } catch {
      // RevenueCat check failed — will fall back to backend
      if (__DEV__) {
        console.warn('RevenueCat check failed — falling back to backend');
      }
    }

    if (rcPlus) {
      // RevenueCat confirms Plus — no need to call backend
      setSentryUser(undefined, 'plus');
      setState({
        isPlus: true,
        source: 'revenuecat',
        subscription: null, // RevenueCat manages the subscription details natively
        loading: false,
        error: null,
      });
      return;
    }

    // Step 2: Fall back to backend API (Stripe source of truth)
    try {
      const data: EntitlementsResponse = await api.get('/api/user/entitlements');

      const isPlus = data.is_plus === true;
      setSentryUser(undefined, isPlus ? 'plus' : 'free');
      setState({
        isPlus,
        source: isPlus ? 'backend' : null,
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
        source: null,
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
    /** Source of the Plus entitlement: 'revenuecat', 'backend', or null */
    source: state.source,
    subscription: state.subscription,
    loading: state.loading,
    error: state.error,
    /** Re-fetch entitlements (e.g. after returning from checkout or completing a purchase). */
    refresh: fetchEntitlements,
  };
}
