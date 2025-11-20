/**
 * Utility functions for logging and error handling
 */

const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

export function log(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    console.log(`[${new Date().toISOString()}] ${message}`, ...args);
  }
}

export function logError(message: string, error: unknown): void {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
}

export function logInfo(message: string, ...args: unknown[]): void {
  console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
}

/**
 * Extract type from event payload
 */
export function extractEventType(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (typeof p.platformGuess === 'string' && p.platformGuess.trim().length > 0) {
      return p.platformGuess.trim();
    }
  }
  return 'event';
}





