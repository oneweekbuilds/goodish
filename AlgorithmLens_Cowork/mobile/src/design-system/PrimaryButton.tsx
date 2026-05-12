/**
 * PrimaryButton: full-width primary action button.
 *
 * Extracted from four prior inline copies (Home, scan picker, broadcast,
 * analysis) and now consumed by onboarding as the fifth caller. Each
 * call site supplies a static `label` string; dynamic labels (e.g.,
 * Home's three-state "Run your first scan" / "Scan again" / "Scan your
 * feed") are computed at the call site and passed in.
 *
 * Variant types are declared for future extension. Only 'primary' is
 * implemented in this commit; 'secondary' and 'destructive' fall back
 * to 'primary' rendering until a future consumer needs them. Existing
 * inline secondary-text buttons (e.g., broadcast's "Stop recording")
 * remain inline since their pattern differs from a filled-pill primary.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, radius, type } from '../design-tokens/tokens';

export type PrimaryButtonVariant = 'primary' | 'secondary' | 'destructive';

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  /** Defaults to false. Renders the button as a non-pressable View with reduced opacity. */
  disabled?: boolean;
  /** Defaults to 'primary'. Only 'primary' is implemented; others fall back. */
  variant?: PrimaryButtonVariant;
  accessibilityLabel?: string;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  accessibilityLabel,
}: PrimaryButtonProps) {
  // Variants reserved for future implementation; primary is the only
  // rendering path today. Referenced to satisfy the linter.
  void variant;

  if (disabled) {
    return (
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: true }}
        style={[BASE, { opacity: 0.4 }]}
      >
        <Text style={LABEL}>{label}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [BASE, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={LABEL}>{label}</Text>
    </Pressable>
  );
}

const BASE = {
  backgroundColor: colors.brandPrimary,
  borderRadius: radius.button,
  paddingVertical: 14,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const LABEL = {
  fontSize: type.subheading.fontSize,
  lineHeight: type.subheading.lineHeight,
  fontWeight: type.subheading.fontWeight,
  color: colors.textOnBrand,
} as const;
