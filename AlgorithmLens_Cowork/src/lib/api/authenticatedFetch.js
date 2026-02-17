/**
 * Authenticated Fetch Wrapper
 *
 * Automatically attaches Supabase JWT token to API requests.
 * Falls back to regular fetch if no session exists (allows backend to return 401).
 */

import { supabase } from '../auth/supabaseClient';

/**
 * Fetch wrapper that includes Supabase auth token if available.
 *
 * Supports AbortController for request cancellation and includes a default 30s timeout.
 *
 * Usage:
 *   const response = await authenticatedFetch('/api/scans');
 *   const response = await authenticatedFetch('/api/scans', { method: 'POST', body: formData });
 *   const controller = new AbortController();
 *   const response = await authenticatedFetch('/api/scans', { signal: controller.signal });
 *
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options (method, headers, body, signal, etc.)
 * @returns {Promise<Response>} Fetch response
 */
export async function authenticatedFetch(url, options = {}) {
  // If no abort signal provided, create a default timeout
  const controller = options.signal ? null : new AbortController();
  const signal = options.signal || controller?.signal;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 30000) : null;

  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    // Prepare headers
    const headers = new Headers(options.headers || {});

    // Attach Authorization header if we have a token
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    // Make the request with auth header and signal
    return fetch(url, {
      ...options,
      headers,
      signal,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Check if an error response is a 401 Unauthorized.
 *
 * Useful for handling auth errors in UI.
 *
 * @param {Response} response - Fetch response
 * @returns {boolean} True if 401 Unauthorized
 */
export function isUnauthorized(response) {
  return response.status === 401;
}
