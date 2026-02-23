/**
 * Authenticated Fetch Wrapper (TypeScript)
 *
 * Automatically attaches Supabase JWT token to API requests.
 * Integrates with fetchWithRetry for exponential backoff retry logic.
 */

import { supabase } from '../auth/supabaseClient';
import { fetchWithRetry, RetryConfig } from './fetchWithRetry';

/**
 * Fetch wrapper that includes Supabase auth token if available.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(options.headers || {});

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const context = retryConfig.context || deriveContext(url);

  return fetchWithRetry(
    url,
    { ...options, headers },
    { ...retryConfig, context }
  );
}

/**
 * Derive a human-readable logging context from an API URL.
 */
function deriveContext(url: string): string {
  try {
    const path = new URL(url, window.location.origin).pathname;
    const clean = path
      .replace(/^\/api\//, '')
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/{id}')
      .replace(/\/[0-9a-f]{24,}/gi, '/{id}');
    return `API:${clean}`;
  } catch {
    return 'API';
  }
}

/**
 * Check if an error response is a 401 Unauthorized.
 */
export function isUnauthorized(response: Response): boolean {
  return response.status === 401;
}
