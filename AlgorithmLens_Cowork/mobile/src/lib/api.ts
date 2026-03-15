/**
 * Authenticated API client for AlgorithmLens backend.
 * Mirrors the web app's authenticatedFetch.js pattern.
 * Includes retry logic with exponential backoff for transient failures.
 */

import { supabase } from './supabase';
import { captureError } from './sentry';
import { getUserFriendlyNetworkError } from './networkUtils';

// Production backend: https://api.algorithmlens.com (Python FastAPI)
// Set via EXPO_PUBLIC_API_BASE_URL in eas.json env section (baked at build time).
// Do NOT point this at https://algorithmlens.com — that is the Vite SPA frontend
// and does not serve any /api/* routes the mobile app needs.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

// Log loudly in production if URL is wrong, but do NOT throw.
// A module-level throw here propagates up through useEntitlements.ts →
// AuthContext.tsx → _layout.tsx, crashing the entire import chain before
// React mounts — SplashScreen.preventAutoHideAsync() is never called and
// the splash hangs forever. Individual API calls will fail with clear
// error messages if the URL is misconfigured.
if (__DEV__ === false && API_BASE_URL.includes('127.0.0.1')) {
  console.error(
    '[api] CRITICAL: API_BASE_URL points to localhost in a production build. ' +
    'Set EXPO_PUBLIC_API_BASE_URL in eas.json or as an EAS Secret.'
  );
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * HTTP status codes that are safe to retry.
 */
const RETRYABLE_STATUSES = [429, 500, 502, 503];

/** Default request timeout in milliseconds (30 seconds). */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Fetch wrapper that automatically injects Supabase JWT.
 * All backend requests go through this function.
 * Includes a 30-second timeout to prevent hanging on dead connections.
 */
export async function authenticatedFetch(
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (!skipAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  }

  if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: fetchOptions.signal ?? controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry logic and exponential backoff for transient failures.
 */
async function fetchWithRetry(
  path: string,
  options: FetchOptions = {},
  maxRetries: number = 2,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await authenticatedFetch(path, options);
      // Don't retry client errors (4xx except 429) — they won't change
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return response;
      }
      if (attempt < maxRetries && RETRYABLE_STATUSES.includes(response.status)) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      captureError(lastError, 'api:fetchWithRetry', { path, attempt });
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  const friendlyMessage = getUserFriendlyNetworkError(lastError);
  throw lastError || new Error(friendlyMessage);
}

/**
 * Convenience wrappers for common HTTP methods.
 * Uses fetchWithRetry for automatic backoff on transient errors.
 */
export const api = {
  async get<T = unknown>(path: string): Promise<T> {
    const response = await fetchWithRetry(path);
    if (!response.ok) {
      throw new Error(`API GET ${path} failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  },

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const response = await fetchWithRetry(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API POST ${path} failed: ${response.status} — ${errorText.substring(0, 200)}`);
    }
    // Read body as text first — prevents silent JSON.parse failures when
    // the server returns HTML (e.g. "coming soon" page at API_BASE_URL).
    const rawText = await response.text();
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || rawText.trimStart().startsWith('<')) {
      throw new Error(
        `API POST ${path} returned HTML instead of JSON. ` +
        'The API server may not be deployed. Check EXPO_PUBLIC_API_BASE_URL in .env.'
      );
    }
    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error(
        `API POST ${path} returned invalid JSON: ${rawText.substring(0, 120)}…`
      );
    }
  },

  async delete<T = unknown>(path: string): Promise<T> {
    const response = await fetchWithRetry(path, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`API DELETE ${path} failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  },
};
