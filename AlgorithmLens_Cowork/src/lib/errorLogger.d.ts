/**
 * Centralized error logging utility - Type declarations
 */

export function logError(context: string, error: Error | string, extra?: Record<string, unknown> | null): void;
export function logWarning(context: string, message: string, extra?: Record<string, unknown> | null): void;
export function logInfo(context: string, message: string, extra?: Record<string, unknown> | null): void;
