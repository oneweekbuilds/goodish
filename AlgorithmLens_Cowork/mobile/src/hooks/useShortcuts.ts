/**
 * useShortcuts — React hook for iOS Shortcuts integration.
 *
 * Bridges the native ExpoShortcuts module to React Native.
 * On app foreground, checks if a shortcut invocation is pending
 * and returns the target platform + autoStart flag so the app
 * can navigate to the broadcast screen automatically.
 *
 * On Android or older iOS, returns { available: false } gracefully.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

// ── Native module import (fails gracefully on Android) ──
let ShortcutsModule: {
  isAvailable: () => Promise<boolean>;
  getPendingShortcut: () => Promise<{
    platform: string;
    autoStart: boolean;
    timestamp: number;
  } | null>;
  clearPendingShortcut: () => Promise<void>;
  setLastPlatform: (platform: string) => Promise<void>;
  getLastPlatform: () => Promise<string>;
  donateInteraction: (platform: string) => Promise<void>;
} | null = null;

if (Platform.OS === 'ios') {
  try {
    // Use Expo Modules Core to resolve the compiled native module
    const { requireNativeModule } = require('expo-modules-core');
    ShortcutsModule = requireNativeModule('ExpoShortcuts');
  } catch {
    // Module not available — expected on Android or older iOS
    ShortcutsModule = null;
  }
}

export interface PendingShortcut {
  platform: string;
  autoStart: boolean;
}

export interface UseShortcutsReturn {
  /** Whether iOS Shortcuts are available on this device */
  available: boolean;
  /** Pending shortcut invocation, if any */
  pendingShortcut: PendingShortcut | null;
  /** Consume (clear) the pending shortcut after handling it */
  consumeShortcut: () => Promise<void>;
  /** Record the last-used platform for Quick Scan */
  setLastPlatform: (platform: string) => Promise<void>;
  /** Donate a shortcut interaction for Siri/Spotlight suggestions */
  donateInteraction: (platform: string) => Promise<void>;
}

export function useShortcuts(): UseShortcutsReturn {
  const [available, setAvailable] = useState(false);
  const [pendingShortcut, setPendingShortcut] = useState<PendingShortcut | null>(null);
  const checkedRef = useRef(false);

  // Check availability on mount
  useEffect(() => {
    if (Platform.OS !== 'ios' || !ShortcutsModule) {
      setAvailable(false);
      return;
    }

    ShortcutsModule.isAvailable()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  // Check for pending shortcut on mount and when app returns to foreground
  const checkPending = useCallback(async () => {
    if (!ShortcutsModule || !available) return;

    try {
      const pending = await ShortcutsModule.getPendingShortcut();
      if (pending) {
        setPendingShortcut({
          platform: pending.platform,
          autoStart: pending.autoStart,
        });
      }
    } catch (error: unknown) {
      if (__DEV__) console.warn('[useShortcuts] getPendingShortcut failed:', error);
    }
  }, [available]);

  // Check on mount
  useEffect(() => {
    if (!checkedRef.current && available) {
      checkedRef.current = true;
      checkPending();
    }
  }, [available, checkPending]);

  // Check when app comes to foreground (Shortcut may have triggered while backgrounded)
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkPending();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [checkPending]);

  const consumeShortcut = useCallback(async () => {
    setPendingShortcut(null);
    if (ShortcutsModule) {
      try {
        await ShortcutsModule.clearPendingShortcut();
      } catch (error: unknown) {
        if (__DEV__) console.warn('[useShortcuts] clearPendingShortcut failed:', error);
      }
    }
  }, []);

  const setLastPlatform = useCallback(async (platform: string) => {
    if (ShortcutsModule) {
      try {
        await ShortcutsModule.setLastPlatform(platform);
      } catch (error: unknown) {
        if (__DEV__) console.warn('[useShortcuts] setLastPlatform failed:', error);
      }
    }
  }, []);

  const donateInteraction = useCallback(async (platform: string) => {
    if (ShortcutsModule) {
      try {
        await ShortcutsModule.donateInteraction(platform);
      } catch (error: unknown) {
        if (__DEV__) console.warn('[useShortcuts] donateInteraction failed:', error);
      }
    }
  }, []);

  return {
    available,
    pendingShortcut,
    consumeShortcut,
    setLastPlatform,
    donateInteraction,
  };
}
