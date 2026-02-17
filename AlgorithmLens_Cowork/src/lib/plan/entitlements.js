/**
 * Entitlements API Client
 *
 * Provides functions to fetch and sync user subscription entitlements.
 */

import { authenticatedFetch, isUnauthorized } from '../api/authenticatedFetch';
import { getApiBaseUrl } from '../apiConfig';
import { setStoredPlanTier, setStoredSubscriptionStatus, PLAN_TIERS } from './planTier';
import { logError } from '../errorLogger.js';

/**
 * Fetch user's subscription entitlements from backend.
 *
 * Returns:
 *   { is_plus: boolean, subscription: {...} } - User entitlements
 *   null - If user is not authenticated (401)
 *
 * Throws:
 *   string - User-safe error message if fetch fails
 */
export async function fetchEntitlements() {
  const apiBase = getApiBaseUrl();

  try {
    const response = await authenticatedFetch(`${apiBase}/api/user/entitlements`);

    // Handle 401 Unauthorized (not logged in)
    if (isUnauthorized(response)) {
      return null;
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData.detail || 'Failed to fetch subscription status. Please refresh and try again.';
    }

    // Parse and return entitlements
    const data = await response.json();
    return data;

  } catch (err) {
    // If error is already a string (thrown above), wrap it in Error object
    if (typeof err === 'string') {
      throw new Error(err);
    }

    // Network or other errors
    logError('entitlements', err);
    throw new Error('Unable to check subscription status. Please check your connection and try again.');
  }
}

/**
 * Sync plan tier from backend entitlements (backend is source of truth).
 *
 * @param {Object} params - Sync parameters
 * @param {boolean} params.isDemoMode - Whether demo mode is active
 * @param {boolean} params.authReady - Whether auth initialization is complete
 * @param {boolean} params.hasSession - Whether user has an active session
 *
 * @returns {Object} Sync result:
 *   { synced: false, reason: 'demo' | 'auth_not_ready' }
 *   { synced: true, tier: 'anon' | 'free' | 'plus' }
 *   { synced: false, reason: 'entitlements_error', error: string }
 */
export async function syncPlanTierFromEntitlements({ isDemoMode, authReady, hasSession }) {
  // Skip in demo mode
  if (isDemoMode) {
    return { synced: false, reason: 'demo' };
  }

  // Wait for auth to be ready
  if (!authReady) {
    return { synced: false, reason: 'auth_not_ready' };
  }

  // No session: set to anon
  if (!hasSession) {
    setStoredPlanTier(PLAN_TIERS.ANON);
    return { synced: true, tier: 'anon' };
  }

  // Session exists: fetch entitlements from backend
  try {
    const entitlements = await fetchEntitlements();

    if (entitlements === null) {
      // 401 Unauthorized (should not happen if hasSession is true, but handle it)
      setStoredPlanTier(PLAN_TIERS.ANON);
      return { synced: true, tier: 'anon' };
    }

    // B6 fix: Store subscription status so the frontend can show a past_due banner
    const subscriptionStatus = entitlements.subscription?.status || null;
    setStoredSubscriptionStatus(subscriptionStatus);

    // Set tier based on is_plus
    if (entitlements.is_plus) {
      setStoredPlanTier(PLAN_TIERS.PLUS);
      return { synced: true, tier: 'plus', subscriptionStatus };
    } else {
      setStoredPlanTier(PLAN_TIERS.FREE);
      return { synced: true, tier: 'free', subscriptionStatus };
    }

  } catch (err) {
    // Fail closed: if entitlements cannot be verified, set to FREE (not PLUS)
    // User is logged in but we cannot confirm Plus status
    setStoredPlanTier(PLAN_TIERS.FREE);
    return {
      synced: false,
      reason: 'entitlements_error',
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
