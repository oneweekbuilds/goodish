/**
 * Entitlements API Client
 *
 * Provides functions to fetch and sync user subscription entitlements.
 */

import { authenticatedFetch, isUnauthorized } from '../api/authenticatedFetch';
import { getApiBaseUrl } from '../apiConfig';

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
    // If error is already a string (thrown above), re-throw it
    if (typeof err === 'string') {
      throw err;
    }

    // Network or other errors
    console.error('Entitlements fetch error:', err);
    throw 'Unable to check subscription status. Please check your connection and try again.';
  }
}
