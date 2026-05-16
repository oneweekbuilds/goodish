/**
 * PickerRow: full-width selectable row for the Compare picker. Each row
 * is its own bordered container (12-radius, 1px border) rather than
 * sitting inside a parent Card, so the selected state can express itself
 * via a brand-blue border plus a brand-blue 12-tint background.
 *
 * Layout: [label/subtitle stack (flex 1)] [optional DEFAULT pill] [chevron]
 *
 * Variants:
 *   selected           brand-blue border, brand-blue 12-tint background
 *   showDefaultPill    small uppercase "DEFAULT" pill before the chevron
 *   disabled           textSecondary label, no chevron, no onPress, a11y
 *                      reports disabled
 */
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, type, spacing, radius, tap } from '../design-tokens/tokens';

export interface PickerRowProps {
  label: string;
  subtitle?: string;
  showDefaultPill?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function PickerRow({
  label,
  subtitle,
  showDefaultPill = false,
  selected = false,
  disabled = false,
  onPress,
  accessibilityLabel,
}: PickerRowProps) {
  const labelTone = disabled ? colors.textSecondary : colors.textPrimary;
  const renderChevron = !disabled;

  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s3,
        minHeight: tap.min + spacing.s3,
        paddingHorizontal: spacing.s4,
        paddingVertical: spacing.s3,
        borderWidth: 1,
        borderColor: selected ? colors.brandPrimary : colors.border,
        backgroundColor: selected ? colors.brandPrimary12 : colors.bgPrimary,
        borderRadius: radius.card,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.bodyStrong.fontWeight,
            color: labelTone,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: type.caption.fontSize,
              lineHeight: type.caption.lineHeight,
              fontWeight: type.caption.fontWeight,
              color: colors.textSecondary,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showDefaultPill ? <DefaultPill /> : null}
      {renderChevron ? (
        <Icon
          name="chevron-right"
          size={14}
          color={colors.textTertiary}
          strokeWidth={2.25}
        />
      ) : null}
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
        {inner}
      </View>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ selected }}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? label}>
      {inner}
    </View>
  );
}

function DefaultPill() {
  return (
    <View
      style={{
        height: 24,
        paddingHorizontal: spacing.s2,
        borderWidth: 1,
        borderColor: colors.brandPrimary,
        borderRadius: radius.pill,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: type.micro.fontSize,
          lineHeight: type.micro.lineHeight,
          fontWeight: type.micro.fontWeight,
          letterSpacing: type.micro.letterSpacing,
          textTransform: 'uppercase',
          color: colors.brandPrimary,
        }}
      >
        Default
      </Text>
    </View>
  );
}
