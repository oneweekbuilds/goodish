/**
 * API Configuration
 *
 * Single source of truth for AlgorithmLens API base URL.
 *
 * Configuration:
 * - Set VITE_ALG_API_BASE_URL in .env or .env.local
 * - Defaults to http://127.0.0.1:8000 in development
 * - In production, either:
 *   - Use relative paths (/api) if backend is proxied
 *   - Set VITE_ALG_API_BASE_URL to the backend URL
 */

/**
 * Get the API base URL from environment or default
 * @returns {string} The API base URL (no trailing slash)
 */
export function getApiBaseUrl() {
  // Check for explicit env var first
  if (import.meta.env.VITE_ALG_API_BASE_URL) {
    return import.meta.env.VITE_ALG_API_BASE_URL.replace(/\/$/, '');
  }

  // Development: use empty string so requests go through the Vite dev proxy
  // (configured in vite.config.js → /api proxied to http://127.0.0.1:8000)
  // This avoids cross-origin (CORS) issues with authenticated requests.
  if (import.meta.env.DEV) {
    return '';
  }

  // Production: prefer relative paths (assumes backend is proxied)
  // If not proxied, VITE_ALG_API_BASE_URL must be set at build time
  return '';
}

/**
 * Check if we're in demo mode
 * Demo mode bypasses all API calls
 * @returns {boolean} True if demo mode is active
 */
export function isDemoMode() {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === '1';
  } catch (error) {
    // If URLSearchParams fails, assume not in demo mode
    return false;
  }
}
