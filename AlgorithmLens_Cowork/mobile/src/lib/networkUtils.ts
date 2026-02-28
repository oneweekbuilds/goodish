/**
 * networkUtils.ts — Network connectivity helpers.
 * Provides a simple check for internet connectivity and
 * user-friendly error messages for network failures.
 */

/**
 * Checks if the device currently has internet connectivity.
 * Uses a lightweight HEAD request to a reliable endpoint.
 * Returns true if connected, false otherwise.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok || response.status === 204;
  } catch {
    // If the check itself fails, assume offline
    return false;
  }
}

/**
 * Wraps a fetch call with a timeout.
 * @param promise - The fetch promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param label - Human-readable label for error messages (e.g., "analysis service")
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string = 'request',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(`The ${label} took too long to respond. Please try again.`, timeoutMs));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Returns a user-friendly error message for common network failures.
 */
export function getUserFriendlyNetworkError(error: unknown): string {
  if (error instanceof TimeoutError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : String(error);

  // Network connectivity issues
  if (
    message.includes('Network request failed') ||
    message.includes('Failed to fetch') ||
    message.includes('network') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND')
  ) {
    return 'We couldn\'t connect to the internet. Check your connection and try again.';
  }

  // Gemini API specific
  if (message.includes('generativelanguage.googleapis.com') || message.includes('Gemini')) {
    return 'We couldn\'t reach the analysis service right now. Check your internet connection and try again.';
  }

  // Supabase specific
  if (message.includes('supabase') || message.includes('postgrest')) {
    return 'We\'re having trouble saving your data right now. Your results are still available — they just won\'t appear in your history until we can reconnect.';
  }

  // Abort/cancel
  if (message.includes('aborted') || message.includes('AbortError')) {
    return 'The request was cancelled.';
  }

  // Generic fallback
  return 'Something unexpected happened. Please try again, and if this keeps happening, restart the app.';
}

/**
 * Custom timeout error class.
 */
export class TimeoutError extends Error {
  timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}
