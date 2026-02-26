/**
 * Push Notification Service — Scan Reminders
 *
 * Connects expo-notifications to the settings frequency picker so
 * users can receive local reminders to scan their social media feeds.
 *
 * This is purely local scheduling — no backend push infrastructure needed.
 * Permissions are requested once; if denied, we respect the decision.
 */

import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_REMINDER_FREQUENCY_DAYS, type ReminderFrequency } from '../config/thresholds';
import { captureError, addBreadcrumb } from '../lib/sentry';

// Import platform-specific modules only on native
let Notifications: typeof import('expo-notifications') | null = null;
let SecureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  SecureStore = require('expo-secure-store');

  // Configure notification behavior (show alert even when app is foregrounded).
  // This handler is set once at module load time and properly cleaned up by expo-notifications.
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
}

// ─── Storage Keys ─────────────────────────────────────────

const STORE_KEY_NOTIFICATIONS_ENABLED = 'notifications_enabled';
const STORE_KEY_NOTIFICATION_FREQUENCY = 'notification_frequency_days';
const STORE_KEY_PERMISSION_ASKED = 'notification_permission_asked';
const STORE_KEY_LAST_SCAN_DATE = 'last_scan_date';

// ─── Permission Management ────────────────────────────────

/**
 * Requests notification permission from the user.
 * Returns true if granted, false otherwise.
 * Will not re-prompt if already denied — instead guides user to Settings.
 * Returns false on web (not supported).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    if (!Notifications) return false;

    // Check current status first
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
    }

    // Check if we already asked and were denied
    const alreadyAsked = SecureStore
      ? await SecureStore.getItemAsync(STORE_KEY_PERMISSION_ASKED)
      : null;

    if (alreadyAsked === 'true' && existingStatus === 'denied') {
      // Don't re-prompt; guide user to system settings
      Alert.alert(
        'Notifications Disabled',
        'To receive scan reminders, enable notifications for AlgorithmLens in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      return false;
    }

    // First time asking — request permission
    const { status } = await Notifications.requestPermissionsAsync();
    if (SecureStore) {
      await SecureStore.setItemAsync(STORE_KEY_PERMISSION_ASKED, 'true');
    }

    return status === 'granted';
  } catch (error) {
    captureError(
      error instanceof Error ? error : new Error(String(error)),
      'notifications:request_permission'
    );
    return false;
  }
}

// ─── Schedule Management ──────────────────────────────────

/**
 * Computes the notification body based on last scan date.
 */
function getNotificationBody(): string {
  // We'll compute days since last scan at notification time via the trigger,
  // but for the scheduled content we use a generic message.
  return 'Tap to start a new scan and see how your feed looks today.';
}

/**
 * Cancels all existing scan reminder notifications.
 * No-op on web.
 */
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    addBreadcrumb('notifications', 'Error cancelling reminders', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Schedules a repeating scan reminder notification.
 * Returns false on web (not supported).
 *
 * @param frequencyDays - How often to remind (3, 5, or 7 days)
 */
export async function scheduleReminder(frequencyDays: number): Promise<boolean> {
  if (Platform.OS === 'web' || !Notifications) {
    return false;
  }

  try {
    // Cancel any existing reminders first
    await cancelAllReminders();

    // Schedule a repeating notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to check your feed!',
        body: getNotificationBody(),
        data: { type: 'scan_reminder' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: frequencyDays * 24 * 60 * 60, // Convert days to seconds
        repeats: true,
      },
    });

    return true;
  } catch (error) {
    captureError(
      error instanceof Error ? error : new Error(String(error)),
      'notifications:schedule_reminder'
    );
    return false;
  }
}

/**
 * Builds a dynamic notification body using the last scan date.
 */
async function getDaysSinceLastScan(): Promise<number | null> {
  try {
    let lastScanStr: string | null = null;
    if (Platform.OS === 'web') {
      lastScanStr = await AsyncStorage.getItem(STORE_KEY_LAST_SCAN_DATE);
    } else if (SecureStore) {
      lastScanStr = await SecureStore.getItemAsync(STORE_KEY_LAST_SCAN_DATE);
    }

    if (!lastScanStr) return null;
    const lastScan = new Date(lastScanStr);
    const now = new Date();
    return Math.floor((now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

/**
 * Records the current date as the last scan date (call after a scan completes).
 */
export async function recordScanDate(): Promise<void> {
  try {
    const dateStr = new Date().toISOString();
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(STORE_KEY_LAST_SCAN_DATE, dateStr);
    } else if (SecureStore) {
      await SecureStore.setItemAsync(STORE_KEY_LAST_SCAN_DATE, dateStr);
    }
  } catch (error) {
    addBreadcrumb('notifications', 'Error recording scan date', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ─── Persistence Helpers ──────────────────────────────────

/** Save notification enabled state to secure storage. */
export async function saveNotificationEnabled(enabled: boolean): Promise<void> {
  try {
    const value = enabled ? 'true' : 'false';
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(STORE_KEY_NOTIFICATIONS_ENABLED, value);
    } else if (SecureStore) {
      await SecureStore.setItemAsync(STORE_KEY_NOTIFICATIONS_ENABLED, value);
    }
  } catch (error) {
    addBreadcrumb('notifications', 'Error saving notification state', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Load notification enabled state from secure storage. */
export async function loadNotificationEnabled(): Promise<boolean> {
  try {
    let value: string | null = null;
    if (Platform.OS === 'web') {
      value = await AsyncStorage.getItem(STORE_KEY_NOTIFICATIONS_ENABLED);
    } else if (SecureStore) {
      value = await SecureStore.getItemAsync(STORE_KEY_NOTIFICATIONS_ENABLED);
    }
    return value === 'true';
  } catch {
    return false;
  }
}

/** Save notification frequency to secure storage. */
export async function saveNotificationFrequency(frequency: ReminderFrequency): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(STORE_KEY_NOTIFICATION_FREQUENCY, frequency);
    } else if (SecureStore) {
      await SecureStore.setItemAsync(STORE_KEY_NOTIFICATION_FREQUENCY, frequency);
    }
  } catch (error) {
    addBreadcrumb('notifications', 'Error saving notification frequency', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Load notification frequency from secure storage. */
export async function loadNotificationFrequency(): Promise<ReminderFrequency> {
  try {
    let value: string | null = null;
    if (Platform.OS === 'web') {
      value = await AsyncStorage.getItem(STORE_KEY_NOTIFICATION_FREQUENCY);
    } else if (SecureStore) {
      value = await SecureStore.getItemAsync(STORE_KEY_NOTIFICATION_FREQUENCY);
    }
    if (value === '3' || value === '5' || value === '7') {
      return value;
    }
  } catch {
    // Fall through to default
  }
  return String(DEFAULT_REMINDER_FREQUENCY_DAYS) as ReminderFrequency;
}

/**
 * Full enable flow: request permission → schedule → persist state.
 * Returns true if notifications were successfully enabled.
 */
export async function enableNotifications(frequencyDays: ReminderFrequency): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    return false;
  }

  const scheduled = await scheduleReminder(parseInt(frequencyDays, 10));
  if (!scheduled) {
    return false;
  }

  await saveNotificationEnabled(true);
  await saveNotificationFrequency(frequencyDays);
  return true;
}

/**
 * Full disable flow: cancel reminders → persist state.
 */
export async function disableNotifications(): Promise<void> {
  await cancelAllReminders();
  await saveNotificationEnabled(false);
}
