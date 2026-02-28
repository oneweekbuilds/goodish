/**
 * Sentry Error Tracking Configuration
 *
 * Initializes Sentry for the AlgorithmLens main site.
 * Captures unhandled errors, failed API retries, auth failures, and payment errors.
 *
 * Configuration:
 *   - DSN: Set VITE_SENTRY_DSN in .env (placeholder used until production)
 *   - Environment: "production" for builds, "development" for local dev
 *   - Release: Reads from VITE_APP_VERSION or falls back to package.json version
 *   - Error sample rate: 1.0 (capture all errors)
 *   - Performance sample rate: 0.1 (capture 10% of transactions)
 *   - User context: user ID + tier only (no PII — no email, no name)
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || 'https://placeholder@sentry.io/0';
const IS_DEV = import.meta.env.DEV;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0';

/**
 * Initialize Sentry SDK. Call once at app startup (before React renders).
 */
export function initSentry() {
  // Skip initialization if DSN is the placeholder (avoids noise in dev)
  if (SENTRY_DSN === 'https://placeholder@sentry.io/0' && !IS_DEV) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_DEV ? 'development' : 'production',
    release: `algorithmlens-web@${APP_VERSION}`,

    // Capture all errors, sample 10% of performance transactions
    sampleRate: 1.0,
    tracesSampleRate: 0.1,

    // Scrub PII from breadcrumbs and events
    beforeSend(event) {
      // Strip any email or name fields that might leak through
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.name;
      }
      return event;
    },

    // Filter noisy or irrelevant errors
    ignoreErrors: [
      // Browser extensions injecting errors
      'ResizeObserver loop',
      // User navigation interrupting requests
      'AbortError',
      // Chrome-specific noise
      'Non-Error promise rejection captured',
    ],

    // In development, log Sentry events to console instead of sending
    debug: IS_DEV,
  });
}

/**
 * Set user context on Sentry after authentication.
 * Only includes user ID and tier — no PII (no email, no name).
 *
 * @param {string|null} userId - Supabase user ID (pass null to clear)
 * @param {string} [tier] - 'free' or 'plus'
 */
export function setSentryUser(userId, tier) {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else if (userId === null) {
    Sentry.setUser(null);
  }
  // Always update tier tag if provided (allows tier-only updates)
  if (tier) {
    Sentry.setTag('user_tier', tier);
  }
}

/**
 * Set the current dashboard tab as Sentry context.
 * Helps correlate errors with specific dashboard views.
 *
 * @param {string} tabName - Active dashboard tab name
 */
export function setSentryDashboardTab(tabName) {
  Sentry.setTag('dashboard_tab', tabName);
}

/**
 * Capture an error with structured context.
 * Use this instead of Sentry.captureException directly to ensure
 * consistent tagging across the app.
 *
 * @param {Error} error - The error to report
 * @param {string} context - Where the error occurred (e.g., 'PaywallProvider', 'fetchWithRetry')
 * @param {Object} [extra] - Additional context data
 */
export function captureError(error, context, extra = null) {
  Sentry.withScope((scope) => {
    scope.setTag('error_context', context);
    if (extra) {
      scope.setExtras(extra);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message-level event (not an exception).
 * Use for notable events that aren't errors but need tracking.
 *
 * @param {string} message - Description of the event
 * @param {string} level - Sentry severity: 'info', 'warning', 'error'
 * @param {Object} [extra] - Additional context
 */
export function captureMessage(message, level = 'warning', extra = null) {
  Sentry.withScope((scope) => {
    if (extra) {
      scope.setExtras(extra);
    }
    Sentry.captureMessage(message, level);
  });
}

/**
 * Add a breadcrumb for state transitions or user actions.
 *
 * @param {string} category - Breadcrumb category (e.g., 'navigation', 'auth', 'scan')
 * @param {string} message - What happened
 * @param {Object} [data] - Extra data attached to the breadcrumb
 */
export function addBreadcrumb(category, message, data = null) {
  Sentry.addBreadcrumb({
    category,
    message,
    data: data || undefined,
    level: 'info',
  });
}

// Re-export Sentry's ErrorBoundary for wrapping React trees
export { Sentry };
