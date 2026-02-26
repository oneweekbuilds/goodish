/**
 * Centralized error logging utility.
 *
 * Routes errors to both console (for development) and Sentry (for production).
 * All existing callsites (ErrorBoundary, fetchWithRetry, PaywallProvider, etc.)
 * automatically gain Sentry reporting without code changes.
 */

import { captureError, captureMessage } from './sentry.js';

const isDev = import.meta.env.DEV;

/**
 * Log an error with context.
 * Reports to Sentry in all environments; also logs to console.
 *
 * @param {string} context - Where the error occurred (e.g., 'ErrorBoundary', 'PaywallProvider')
 * @param {Error|string} error - The error object or message
 * @param {Object} [extra] - Additional context data
 */
export function logError(context, error, extra = null) {
  // Always log to console for local debugging
  console.error(`[${context}]`, error, extra || '');

  // Report to Sentry
  if (error instanceof Error) {
    captureError(error, context, extra);
  } else {
    // String errors: wrap in a real Error for proper stack trace
    captureError(new Error(String(error)), context, extra);
  }
}

/**
 * Log a warning with context.
 * Reports to Sentry as a warning-level message in all environments.
 *
 * @param {string} context - Where the warning occurred
 * @param {string} message - Warning message
 * @param {Object} [extra] - Additional context data
 */
export function logWarning(context, message, extra = null) {
  if (isDev) {
    console.warn(`[${context}]`, message, extra || '');
  }

  // Send warnings to Sentry so we can track retry patterns and degraded states
  captureMessage(`[${context}] ${message}`, 'warning', extra);
}
