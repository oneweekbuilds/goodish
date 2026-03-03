/**
 * Retry Utility with Exponential Backoff (TypeScript)
 *
 * Ports the Chrome extension's retry pattern (3 attempts, exponential backoff)
 * to the main site's API layer.
 */

import { logError, logWarning } from '../errorLogger.js';

/** Configuration options for retry behavior */
export interface RetryConfig {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  context?: string;
}

/** Details attached to ApiRetryError for UI consumption */
export interface ApiRetryErrorDetails {
  attempts: number;
  lastStatus?: number | null;
  isTimeout?: boolean;
  isAuthError?: boolean;
  cause?: Error | null;
}

/**
 * Custom error class for API failures after all retries are exhausted.
 */
export class ApiRetryError extends Error {
  readonly name = 'ApiRetryError';
  readonly attempts: number;
  readonly lastStatus: number | null;
  readonly isTimeout: boolean;
  readonly isAuthError: boolean;
  readonly cause: Error | null;

  constructor(message: string, details: ApiRetryErrorDetails = { attempts: 0 }) {
    super(message);
    this.attempts = details.attempts || 0;
    this.lastStatus = details.lastStatus ?? null;
    this.isTimeout = details.isTimeout ?? false;
    this.isAuthError = details.isAuthError ?? false;
    this.cause = details.cause ?? null;
  }
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'context'>> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 4000,
  timeoutMs: 30000,
};

function getBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  return Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
}

function isNonRetryableStatus(status: number): boolean {
  return status === 400 || status === 401 || status === 403 || status === 422;
}

/**
 * Execute a fetch request with retry logic and exponential backoff.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<Response> {
  const config = { ...DEFAULT_CONFIG, ...retryConfig };
  const context = config.context || 'API';
  let lastError: Error | null = null;
  let lastStatus: number | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), config.timeoutMs);

    const callerSignal = options.signal as AbortSignal | undefined;
    if (callerSignal?.aborted) {
      clearTimeout(timeoutId);
      throw new ApiRetryError('Request was cancelled.', {
        attempts: attempt,
        isTimeout: false,
        cause: new DOMException('The operation was aborted.', 'AbortError'),
      });
    }

    const onCallerAbort = callerSignal
      ? () => timeoutController.abort()
      : null;
    if (onCallerAbort && callerSignal) {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: timeoutController.signal,
      });

      clearTimeout(timeoutId);
      if (onCallerAbort && callerSignal) {
        callerSignal.removeEventListener('abort', onCallerAbort);
      }

      if (!response.ok) {
        lastStatus = response.status;

        if (isNonRetryableStatus(response.status)) {
          return response;
        }

        if (attempt < config.maxAttempts) {
          const delay = getBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs);
          logWarning(context, `Request failed (${response.status}), retrying in ${delay}ms (attempt ${attempt}/${config.maxAttempts})`, { url });
          await new Promise<void>(resolve => setTimeout(resolve, delay));
          continue;
        }

        logError(context, `Request failed after ${config.maxAttempts} attempts`, { url, status: response.status });
        return response;
      }

      return response;

    } catch (err) {
      clearTimeout(timeoutId);
      if (onCallerAbort && callerSignal) {
        callerSignal.removeEventListener('abort', onCallerAbort);
      }

      lastError = err instanceof Error ? err : new Error(String(err));

      if (callerSignal?.aborted) {
        throw new ApiRetryError('Request was cancelled.', {
          attempts: attempt,
          isTimeout: false,
          cause: lastError,
        });
      }

      const isTimeout = lastError.name === 'AbortError';
      const errorType = isTimeout ? 'timed out' : 'failed';

      if (attempt < config.maxAttempts) {
        const delay = getBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs);
        logWarning(context, `Request ${errorType}, retrying in ${delay}ms (attempt ${attempt}/${config.maxAttempts})`, { url, error: lastError.message });
        await new Promise<void>(resolve => setTimeout(resolve, delay));
        continue;
      }

      logError(context, `Request ${errorType} after ${config.maxAttempts} attempts`, { url, error: lastError.message });

      throw new ApiRetryError(
        isTimeout
          ? 'The request timed out. Please check your connection and try again.'
          : 'Unable to reach the server. Please check your connection and try again.',
        {
          attempts: config.maxAttempts,
          lastStatus,
          isTimeout,
          cause: lastError,
        }
      );
    }
  }

  // TypeScript requires a return; this is unreachable given the loop logic
  throw new ApiRetryError('Unexpected retry loop exit', { attempts: config.maxAttempts, lastStatus });
}
