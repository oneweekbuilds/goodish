/**
 * localState.ts — Per-user local state cleanup.
 *
 * Build #44: when a user signs out, AsyncStorage keys that hold
 * user-specific state (onboarding flag, streak history, walkthrough flag,
 * mocked subscription state, scan backups) must be cleared. Otherwise the
 * next user to sign in on the same device inherits the previous user's
 * state — old streak counts, no onboarding, etc.
 *
 * NOT cleared: device-level / preference keys that should persist across
 * sign-outs (notification preferences are owned by the device, not the
 * user account).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Fixed-name AsyncStorage keys that hold per-user state. */
export const LOCAL_STATE_KEYS = [
  // Auth / onboarding
  '@algorithmlens_onboarding_completed',
  // Streak / habit tracking
  '@algorithmlens/streak_data',
  // First-use walkthrough flag
  '@algorithmlens_has_seen_walkthrough',
  // Mock RevenueCat state (until real RC ships)
  '@algorithmlens_mock_plus_status',
  '@algorithmlens_mock_sub_source',
];

/** Wildcard prefixes for dynamic keys (e.g. one per scan backup). */
const LOCAL_STATE_KEY_PREFIXES = [
  '@alg_scan_backup_',
];

/**
 * Clears all per-user local state. Call BEFORE supabase.auth.signOut().
 * Wraps in try/catch so a failure here never blocks sign-out.
 */
export async function clearLocalUserState(): Promise<void> {
  try {
    // 1. Clear known fixed-name keys.
    await AsyncStorage.multiRemove(LOCAL_STATE_KEYS);

    // 2. Clear any keys matching wildcard prefixes (e.g. @alg_scan_backup_*).
    const allKeys = await AsyncStorage.getAllKeys();
    const wildcardKeys = allKeys.filter((k) =>
      LOCAL_STATE_KEY_PREFIXES.some((prefix) => k.startsWith(prefix))
    );
    if (wildcardKeys.length > 0) {
      await AsyncStorage.multiRemove(wildcardKeys);
    }
  } catch (err) {
    // Non-fatal — sign-out must proceed even if cleanup fails. The next
    // user will inherit some state, but they can clear it manually.
    if (__DEV__) {
      console.warn('[clearLocalUserState] Failed to clear local state (non-fatal):', err);
    }
  }
}
