/**
 * Authenticated API client for AlgorithmLens backend.
 * Mirrors the web app's authenticatedFetch.js pattern.
 * Includes retry logic with exponential backoff for transient failures.
 */

import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

/** Warn in production if API_BASE_URL still points at localhost. */
if (__DEV__ === false && API_BASE_URL.includes('127.0.0.1')) {
  console.warn(
    '[api] API_BASE_URL points to localhost in a production build. Set EXPO_PUBLIC_API_BASE_URL in your .env file.'
  );
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * HTTP status codes that are safe to retry.
 */
const RETRYABLE_STATUSES = [429, 500, 502, 503];

/**
 * Fetch wrapper that automatically injects Supabase JWT.
 * All backend requests go through this function.
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

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  return response;
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
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError || new Error(`Request to ${path} failed after ${maxRetries + 1} attempts`);
}

/**
 * Convenience wrappers for common HTTP methods.
 * Uses fetchWithRetry for automatic backoff on transient errors.
 */
export const api = {
  async get<T = any>(path: string): Promise<T> {
    const response = await fetchWithRetry(path);
    if (!response.ok) {
      throw new Error(`API GET ${path} failed: ${response.status}`);
    }
    return response.json();
  },

  async post<T = any>(path: string, body: any): Promise<T> {
    const response = await fetchWithRetry(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API POST ${path} failed: ${response.status} — ${errorText}`);
    }
    return response.json();
  },

  async delete<T = any>(path: string): Promise<T> {
    const response = await fetchWithRetry(path, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`API DELETE ${path} failed: ${response.status}`);
    }
    return response.json();
  },
};
