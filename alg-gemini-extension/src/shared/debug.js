/**
 * Centralized debug configuration for AlgorithmLens extension.
 * CAPTURE_DEBUG is the SINGLE toggle controlling ALL debug output across all files.
 * Set to false for production builds.
 */

export const CAPTURE_DEBUG = false;
export const CONTENT_SCRIPT_VERSION = '1.1.0';

/**
 * Structured debug logger — only outputs when CAPTURE_DEBUG is true.
 * @param {'log'|'warn'|'error'|'debug'} level
 * @param {string} message
 * @param {*} [data]
 */
export function debugLog(level, message, data = null) {
  if (!CAPTURE_DEBUG) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}]`;
  const fn = console[level] || console.log;
  if (data !== null) {
    fn(prefix, message, data);
  } else {
    fn(prefix, message);
  }
}
