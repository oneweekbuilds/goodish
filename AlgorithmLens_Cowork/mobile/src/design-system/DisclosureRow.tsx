/**
 * DisclosureRow — a 44pt-tall info row, used at the bottom of the
 * Overview screen as "About this analysis".
 *
 * Layout: info icon · caption · chevron-right. Hairline border, 12 radius.
 */
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, type, spacing, radius, tap } from '../design-tokens/tokens';

export interface DisclosureRowProps {
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function DisclosureRow({ label, onPress, accessibilityLabel }: DisclosureRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => ({
        height: tap.min,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s3 - 2, // 10
        // spacing.s5 (20) to match ExpandableCard's header horizontal padding.
        paddingHorizontal: spacing.s5,
        backgroundColor: pressed ? colors.brandPrimary12 : colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
      })}
    >
      <Icon name="info" size={16} color={colors.textSecondary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: type.caption.fontSize,
            lineHeight: type.caption.lineHeight,
            fontWeight: type.caption.fontWeight,
            color: colors.textSecondary,
          }}
        >
          {label}
        </Text>
      </View>
      <Icon
        name="chevron-right"
        size={14}
        color={colors.textTertiary}
        strokeWidth={2.25}
      />
    </Pressable>
  );
}
