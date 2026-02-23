/**
 * Sentry integration - Type declarations
 */

export function captureError(error: Error, context?: string, extra?: Record<string, unknown> | null): void;
export function captureMessage(message: string, level?: string, extra?: Record<string, unknown> | null): void;
export function setSentryUser(userId?: string | null, tier?: string): void;
export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void;
