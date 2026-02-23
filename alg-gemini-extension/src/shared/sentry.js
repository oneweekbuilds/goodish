/**
 * Sentry Error Tracking for AlgorithmLens Chrome Extension
 *
 * Provides centralized error tracking across background, popup, and content scripts.
 * Captures failed scan uploads, auth bridge failures, retry exhaustion, and content script errors.
 *
 * Configuration:
 *   - DSN: Placeholder until production deployment
 *   - Environment: "production" for builds, "development" for dev mode
 *   - Release: Reads from manifest version
 *   - Error sample rate: 1.0 (capture all errors)
 *   - Performance sample rate: 0.1 (capture 10% of transactions)
 *   - User context: user ID + tier only (no PII)
 */

import * as Sentry from '@sentry/browser';

const SENTRY_DSN = 'https://placeholder@sentry.io/0';

let initialized = false;

/**
 * Initialize Sentry for the extension.
 * Safe to call multiple times — only initializes once.
 *
 * @param {string} scriptContext - Which script is initializing ('background', 'popup', 'content')
 */
export function initSentry(scriptContext = 'unknown') {
  if (initialized) return;
  initialized = true;

  // Get extension version from manifest
  let version = '0.0.0';
  try {
    version = chrome.runtime.getManifest().version;
  } catch {
    // May fail in content script contexts
  }

  // Detect environment from build mode
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isDev ? 'development' : 'production',
    release: `algorithmlens-extension@${version}`,

    // Capture all errors, sample 10% of performance transactions
    sampleRate: 1.0,
    tracesSampleRate: 0.1,

    // Tag events with script origin
    initialScope: {
      tags: {
        script_context: scriptContext,
        extension_version: version,
      },
    },

    // Scrub PII from events
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.name;
      }
      return event;
    },

    // Filter noisy errors
    ignoreErrors: [
      'ResizeObserver loop',
      // Extension messaging noise when popup closes
      'Could not establish connection',
      'Receiving end does not exist',
      'message port closed',
    ],

    debug: isDev,
  });
}

/**
 * Set user context on Sentry.
 * Only includes user ID and tier — no PII.
 *
 * @param {string|null} userId - User ID from auth
 * @param {string} [tier] - 'free' or 'plus'
 */
export function setSentryUser(userId, tier) {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else if (userId === null) {
    Sentry.setUser(null);
  }
  if (tier) {
    Sentry.setTag('user_tier', tier);
  }
}

/**
 * Capture an error with structured context.
 *
 * @param {Error|string} error - The error to report
 * @param {string} context - Where the error occurred
 * @param {Object} [extra] - Additional context data
 */
export function captureError(error, context, extra = null) {
  Sentry.withScope((scope) => {
    scope.setTag('error_context', context);
    if (extra) {
      scope.setExtras(extra);
    }
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureException(new Error(String(error)));
    }
  });
}

/**
 * Capture a message-level event.
 *
 * @param {string} message - Description
 * @param {string} level - 'info', 'warning', 'error'
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
 * Add a breadcrumb for state transitions.
 *
 * @param {string} category - Breadcrumb category ('scan', 'auth', 'state')
 * @param {string} message - What happened
 * @param {Object} [data] - Extra data
 */
export function addBreadcrumb(category, message, data = null) {
  Sentry.addBreadcrumb({
    category,
    message,
    data: data || undefined,
    level: 'info',
  });
}
