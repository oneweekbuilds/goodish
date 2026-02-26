/**
 * Haptics utility — Platform-safe haptic feedback
 *
 * Provides haptic feedback on native platforms (iOS, Android).
 * No-op on web (Platform.OS === 'web').
 */

import { Platform } from 'react-native';

// Import haptics only on native platforms
let Haptics: typeof import('expo-haptics') | null = null;
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics');
}

/**
 * Trigger selection haptic feedback.
 * Safe on all platforms — no-op on web.
 */
export async function triggerSelection(): Promise<void> {
  if (Platform.OS === 'web' || !Haptics) {
    return;
  }
  try {
    await Haptics.selectionAsync();
  } catch {
    // Silently fail if haptics not available
  }
}

/**
 * Trigger impact haptic feedback (light).
 * Safe on all platforms — no-op on web.
 */
export async function triggerImpactLight(): Promise<void> {
  if (Platform.OS === 'web' || !Haptics) {
    return;
  }
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently fail if haptics not available
  }
}

/**
 * Trigger impact haptic feedback (medium).
 * Safe on all platforms — no-op on web.
 */
export async function triggerImpactMedium(): Promise<void> {
  if (Platform.OS === 'web' || !Haptics) {
    return;
  }
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silently fail if haptics not available
  }
}

/**
 * Trigger impact haptic feedback (heavy).
 * Safe on all platforms — no-op on web.
 */
export async function triggerImpactHeavy(): Promise<void> {
  if (Platform.OS === 'web' || !Haptics) {
    return;
  }
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Silently fail if haptics not available
  }
}

/**
 * Trigger notification haptic feedback (success).
 * Safe on all platforms — no-op on web.
 */
export async function triggerNotificationSuccess(): Promise<void> {
  if (Platform.OS === 'web' || !Haptics) {
    return;
  }
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silently fail if haptics not available
  }
}

/**
 * Trigger notification haptic feedback (warning).
 * Safe on all platforms — no-op on web.
 */
export async function triggerNotificationWarning(): Promise<void> {
  if (Platform.OS === 'web' || !Haptics) {
    return;
  }
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Silently fail if haptics not available
  }
}

/**
 * Trigger notification haptic feedback (error).
 * Safe on all platforms — no-op on web.
 */
export async function triggerNotificationError(): Promise<void> {
  if (Platform.OS === 'web' || !Haptics) {
    return;
  }
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Silently fail if haptics not available
  }
}
