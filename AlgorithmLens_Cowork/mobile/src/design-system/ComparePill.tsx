/**
 * ComparePill: outline pill for the History header's compare entry. 32px
 * tall, brand-blue 1px border, brand-blue label, arrow-left-right glyph
 * on the left. Designed to recur on the Result screen as a "Compare with
 * another" affordance.
 *
 * Disabled state: textSecondary border and label, no press handling,
 * accessibilityState reports disabled. Matches the disabled treatment
 * used in SettingsRow.
 */
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, type, spacing, radius } from '../design-tokens/tokens';

export interface ComparePillProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function ComparePill({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
}: ComparePillProps) {
  const tone = disabled ? colors.textSecondary : colors.brandPrimary;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s2 - 2,
        height: 32,
        paddingHorizontal: spacing.s3,
        borderWidth: 1,
        borderColor: tone,
        borderRadius: radius.pill,
      }}
    >
      <Icon
        name="arrow-left-right"
        size={14}
        color={tone}
        strokeWidth={2}
      />
      <Text
        style={{
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          fontWeight: type.bodyStrong.fontWeight,
          color: tone,
        }}
      >
        {label}
      </Text>
    </View>
  );

  if (disabled) {
    return (
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: true }}
      >
        {content}
      </View>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? label}>
      {content}
    </View>
  );
}
