/**
 * Authenticated API client for AlgorithmLens backend.
 * Mirrors the web app's authenticatedFetch.js pattern.
 */

import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

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
 * Convenience wrappers for common HTTP methods.
 */
export const api = {
  async get<T = any>(path: string): Promise<T> {
    const response = await authenticatedFetch(path);
    if (!response.ok) {
      throw new Error(`API GET ${path} failed: ${response.status}`);
    }
    return response.json();
  },

  async post<T = any>(path: string, body: any): Promise<T> {
    const response = await authenticatedFetch(path, {
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
    const response = await authenticatedFetch(path, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`API DELETE ${path} failed: ${response.status}`);
    }
    return response.json();
  },
};
