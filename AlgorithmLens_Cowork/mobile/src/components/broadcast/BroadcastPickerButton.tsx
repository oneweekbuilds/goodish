/**
 * BroadcastPickerButton — Cross-platform screen recording trigger.
 *
 * iOS behavior:
 * Renders a styled button that, when tapped, signals the parent to
 * show the RPSystemBroadcastPickerView. The native picker is the ONLY
 * way to programmatically trigger a broadcast upload extension on iOS.
 *
 * Android behavior:
 * Renders the same styled button, but when tapped, calls
 * requestScreenCapture() on the native module which triggers the
 * system MediaProjection permission dialog. On approval, the
 * foreground service starts automatically.
 *
 * On web/unsupported platforms, renders a disabled placeholder.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { Radio, Smartphone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../lib/theme';

interface BroadcastPickerButtonProps {
  /** Called when the user taps the broadcast picker button. */
  onPress?: () => void;
  /** Whether the button should be disabled. */
  disabled?: boolean;
  /** Custom label text. */
  label?: string;
}

export const BroadcastPickerButton = React.memo(function BroadcastPickerButton({
  onPress,
  disabled = false,
  label,
}: BroadcastPickerButtonProps) {
  const { colors, shadows } = useTheme();

  // Unsupported platform
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return (
      <View style={[styles.container, { opacity: 0.5 }]}>
        <Text style={[styles.unavailableText, { color: colors.textMuted }]}>
          Broadcast recording requires iOS or Android
        </Text>
      </View>
    );
  }

  const isIOS = Platform.OS === 'ios';
  const buttonLabel = label || (isIOS ? 'Start Screen Recording' : 'Start Screen Capture');
  const hintText = isIOS
    ? 'Tap to begin capture'
    : 'Grant permission to capture your screen';
  const IconComponent = isIOS ? Radio : Smartphone;

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.bgPage : colors.primaryBlue,
          opacity: disabled ? 0.5 : 1,
          minHeight: 44,
          ...shadows.soft,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Start screen recording"
      accessibilityHint="Records your screen to capture your social media feed"
      accessibilityState={{ disabled }}
    >
      <View style={styles.iconCircle}>
        <IconComponent
          size={20}
          color={disabled ? colors.textMuted : colors.textInverse}
          strokeWidth={2}
        />
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.buttonLabel,
            { color: disabled ? colors.textMuted : colors.textInverse },
          ]}
        >
          {buttonLabel}
        </Text>
        <Text
          style={[
            styles.buttonHint,
            { color: disabled ? colors.textSecondary : 'rgba(255,255,255,0.7)' },
          ]}
        >
          {hintText}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

BroadcastPickerButton.displayName = 'BroadcastPickerButton';

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  unavailableText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  buttonLabel: {
    ...TYPOGRAPHY.h3,
  },
  buttonHint: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    marginTop: SPACING.xxs,
  },
});
