/**
 * SettingsRow: iOS-grouped-list row supporting the four patterns Settings
 * needs:
 *
 *   1. Single-line label + chevron, no value
 *      <SettingsRow label="How AlgorithmLens works" />
 *
 *   2. Single-line label + value + chevron
 *      <SettingsRow label="Default platform" value="Facebook" />
 *
 *   3. Two-line label/subtitle + value + chevron
 *      <SettingsRow
 *        label="Diagnostics"
 *        subtitle="Anonymous error reports only"
 *        value="On"
 *      />
 *
 *   4. Single-line label + value, no chevron (e.g. Version)
 *      <SettingsRow label="Version" value="1.0.0 (1)" showChevron={false} />
 *
 * The row renders no internal separator; the parent (typically a Card with
 * padding=0 wrapping multiple rows) draws hairlines between rows.
 *
 * Variants:
 *   - `labelColor="brand"` paints the label in brandPrimary. Reserved for
 *     the Sign Out treatment (the one interactive-affordance use of brand
 *     blue in Settings).
 *   - `disabled` renders label in textSecondary, drops the chevron, ignores
 *     onPress, and exposes accessibilityState={disabled:true}. Used for
 *     rows whose picker sub-pages have not shipped yet.
 */
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, type, spacing, tap } from '../design-tokens/tokens';

export interface SettingsRowProps {
  label: string;
  subtitle?: string;
  value?: string;
  /** Defaults to true. Drops the chevron when false (Version row pattern). */
  showChevron?: boolean;
  /**
   * Defaults to false. When true: label uses textSecondary, no chevron,
   * no press handling, accessibilityState reports disabled.
   */
  disabled?: boolean;
  /** Defaults to 'primary'. 'brand' paints the label brand-blue (Sign Out). */
  labelColor?: 'primary' | 'brand';
  onPress?: () => void;
  accessibilityLabel?: string;
}

const ROW_PADDING_X = spacing.s4;
const ROW_PADDING_Y = spacing.s3;
const CHEVRON_SIZE = 14;
const CHEVRON_STROKE = 2.25;

export function SettingsRow({
  label,
  subtitle,
  value,
  showChevron = true,
  disabled = false,
  labelColor = 'primary',
  onPress,
  accessibilityLabel,
}: SettingsRowProps) {
  const renderChevron = !disabled && showChevron;
  const labelTone = disabled
    ? colors.textSecondary
    : labelColor === 'brand'
    ? colors.brandPrimary
    : colors.textPrimary;

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: tap.min,
        paddingHorizontal: ROW_PADDING_X,
        paddingVertical: ROW_PADDING_Y,
        gap: spacing.s3,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
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
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {renderChevron ? (
        <Icon
          name="chevron-right"
          size={CHEVRON_SIZE}
          color={colors.textTertiary}
          strokeWidth={CHEVRON_STROKE}
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
        {body}
      </View>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.bgSecondary : 'transparent',
        })}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {body}
    </View>
  );
}
