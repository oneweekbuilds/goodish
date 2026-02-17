/**
 * Centralized error logging utility.
 *
 * In development, logs to console. In production, this is where
 * you'd integrate Sentry, LogRocket, or similar error tracking.
 *
 * Replaces scattered console.error() calls with a single point of control.
 */

const isDev = import.meta.env.DEV;

/**
 * Log an error with context.
 * @param {string} context - Where the error occurred (e.g., 'ErrorBoundary', 'PaywallProvider')
 * @param {Error|string} error - The error object or message
 * @param {Object} [extra] - Additional context data
 */
export function logError(context, error, extra = null) {
  // Always log errors - in production, this should be replaced with
  // Sentry.captureException() or similar error tracking service.
  // Until then, console.error is better than silent failure.
  console.error(`[${context}]`, error, extra || '');
}

/**
 * Log a warning with context.
 * @param {string} context - Where the warning occurred
 * @param {string} message - Warning message
 * @param {Object} [extra] - Additional context data
 */
export function logWarning(context, message, extra = null) {
  if (isDev) {
    console.warn(`[${context}]`, message, extra || '');
  }
}
