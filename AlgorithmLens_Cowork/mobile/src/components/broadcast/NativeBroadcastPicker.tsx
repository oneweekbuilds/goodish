/**
 * NativeBroadcastPicker — React Native wrapper for the iOS RPSystemBroadcastPickerView.
 *
 * This renders an invisible native view that wraps Apple's RPSystemBroadcastPickerView.
 * When `triggerPicker()` is called (exported from this module), the native view
 * programmatically taps the system broadcast button, which presents the system
 * dialog for the user to start broadcasting.
 *
 * Usage:
 * ```tsx
 * import { NativeBroadcastPicker, triggerBroadcastPicker } from './NativeBroadcastPicker';
 *
 * // Render the invisible picker somewhere in your component tree:
 * <NativeBroadcastPicker />
 *
 * // When user taps your styled button:
 * triggerBroadcastPicker();
 * ```
 *
 * The visual button is rendered separately by BroadcastPickerButton.tsx.
 * This component only provides the native system integration.
 */

import React from 'react';
import { Platform, View } from 'react-native';
import { ICON_SIZES } from '../../lib/theme';

let NativePickerView: React.ComponentType<{
  preferredExtension?: string;
  style?: object;
}> | null = null;

let triggerPickerFn: (() => void) | null = null;

// Only load native module on iOS (not available on Android, web, or Expo Go without dev client)
if (Platform.OS === 'ios') {
  try {
    const { requireNativeViewManager, requireNativeModule } = require('expo-modules-core');
    NativePickerView = requireNativeViewManager('BroadcastPickerView');
    const pickerModule = requireNativeModule('BroadcastPickerView');
    triggerPickerFn = () => pickerModule.triggerPicker();
  } catch {
    // Native module not available — development build required
    NativePickerView = null;
    triggerPickerFn = null;
  }
}

/**
 * Triggers the native iOS broadcast picker dialog.
 * No-op on platforms where the native module isn't available.
 */
export function triggerBroadcastPicker(): void {
  if (triggerPickerFn) {
    triggerPickerFn();
  }
}

/**
 * Returns true if the native broadcast picker is available.
 */
export function isBroadcastPickerAvailable(): boolean {
  return NativePickerView !== null && triggerPickerFn !== null;
}

interface NativeBroadcastPickerProps {
  /** Bundle ID of the broadcast extension. Defaults to com.algorithmlens.app.BroadcastExtension */
  preferredExtension?: string;
}

/**
 * Invisible native view that hosts the RPSystemBroadcastPickerView.
 * Must be rendered in the component tree for triggerBroadcastPicker() to work.
 *
 * Renders as a zero-height view so it doesn't affect layout.
 */
export function NativeBroadcastPicker({
  preferredExtension = 'com.algorithmlens.app.BroadcastExtension',
}: NativeBroadcastPickerProps) {
  if (!NativePickerView) {
    // Not available — render nothing
    return null;
  }

  return (
    <View
      style={{ width: 1, height: 1, overflow: 'hidden', opacity: 0, position: 'absolute' }}
      pointerEvents="none"
    >
      <NativePickerView
        preferredExtension={preferredExtension}
        style={{ width: ICON_SIZES['4xl'], height: ICON_SIZES['4xl'] }}
      />
    </View>
  );
}
