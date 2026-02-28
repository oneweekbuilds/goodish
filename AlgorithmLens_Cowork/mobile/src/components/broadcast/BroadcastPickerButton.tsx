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

import { triggerImpactMedium } from '../../lib/haptics';
import React from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { Radio, Smartphone } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { SPACING, RADIUS, ICON_SIZES, MIN_TOUCH_TARGET } from '../../lib/theme';
import { Text } from '../glue';

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
      <View style={Platform.OS === 'web' ? { ...styles.container, opacity: 0.5 } : [styles.container, { opacity: 0.5 }]}>
        <Text
          variant="bodySmall"
          color={colors.textMuted}
          align="center"
          style={{ fontWeight: '500' }}
        >
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
    triggerImpactMedium();
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={Platform.OS === 'web' ? {
        ...styles.button,
        backgroundColor: disabled ? colors.bgPage : colors.primaryBlue,
        opacity: disabled ? 0.5 : 1,
        minHeight: MIN_TOUCH_TARGET,
        ...shadows.soft,
      } : [
        styles.button,
        {
          backgroundColor: disabled ? colors.bgPage : colors.primaryBlue,
          opacity: disabled ? 0.5 : 1,
          minHeight: MIN_TOUCH_TARGET,
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
          variant="h3"
          color={disabled ? colors.textMuted : colors.textInverse}
        >
          {buttonLabel}
        </Text>
        <Text
          variant="caption"
          color={disabled ? colors.textSecondary : 'rgba(255,255,255,0.7)'}
          style={{ marginTop: SPACING.xxs }}
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: ICON_SIZES['2xl'],
    height: ICON_SIZES['2xl'],
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
});
