/**
 * Analytics - Type declarations
 */

export function track(event: string, properties?: Record<string, unknown>): void;
export const EVENTS: Record<string, string>;
