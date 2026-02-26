/**
 * errorHandler.ts — Centralized error display for AlgorithmLens mobile.
 *
 * Prevents duplicate/cascading error alerts (H-15). One error = one user-facing
 * message. Uses a simple active-error guard so the same error ID cannot trigger
 * multiple overlapping alerts.
 */

import { Alert } from 'react-native';

/** Currently visible error ID — prevents duplicate alerts. */
let activeErrorId: string | null = null;

/** Timestamp of last dismissed error — prevents rapid re-trigger. */
let lastDismissedAt = 0;

/** Minimum gap between error dismissal and re-show (ms). */
const DEBOUNCE_MS = 1500;

/**
 * Show an app-level error alert. If an alert with the same `id` is already
 * visible, the call is silently ignored.
 *
 * @param title  - Alert title (keep short)
 * @param message - User-friendly explanation
 * @param id     - Unique key for dedup (e.g. 'checkout', 'broadcast_start')
 */
export function showAppError(title: string, message: string, id: string): void {
  // Guard: same error already showing
  if (activeErrorId === id) return;

  // Guard: recently dismissed — prevent rapid re-trigger
  if (Date.now() - lastDismissedAt < DEBOUNCE_MS) return;

  activeErrorId = id;

  Alert.alert(title, message, [
    {
      text: 'OK',
      onPress: () => {
        activeErrorId = null;
        lastDismissedAt = Date.now();
      },
    },
  ]);
}

/**
 * Clear the active error state without user interaction.
 * Useful when navigating away from the error context.
 */
export function clearActiveError(): void {
  activeErrorId = null;
}

/**
 * Check whether an error alert is currently visible.
 */
export function isErrorVisible(): boolean {
  return activeErrorId !== null;
}
