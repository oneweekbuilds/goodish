/**
 * PlatformTile: full-width selectable row for the new platform picker.
 *
 * Layout: [40x40 neutral monogram avatar] [platform display name, body
 * weight] [flex spacer] [chevron-right]. Card-like: 12-radius, 1px
 * border in the neutral border token, white background, internal
 * padding.
 *
 * The monogram is a 2-letter abbreviation derived from the platform key
 * via lib/platformLabels (same shape as Home's ConditionalLastScanRow
 * avatar). Decorative platform colors are not used; DESIGN.md forbids
 * decorative color.
 */
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, radius, spacing, tap, type } from '../design-tokens/tokens';
import { platformAbbrev, platformName } from '../lib/platformLabels';

export interface PlatformTileProps {
  /** Platform key, e.g. "instagram". Case-insensitive. */
  platform: string;
  /** When true, renders the brand-tinted selected state. */
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function PlatformTile({
  platform,
  selected = false,
  onPress,
  accessibilityLabel,
}: PlatformTileProps) {
  const abbrev = platformAbbrev(platform);
  const name = platformName(platform) || platform;
  const a11y = accessibilityLabel ?? `Scan ${name}`;

  const body = (
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
        borderRadius: radius.card,
        backgroundColor: selected ? colors.brandPrimary12 : colors.bgPrimary,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.tap,
          backgroundColor: colors.bgSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: type.caption.fontSize,
            lineHeight: type.caption.lineHeight,
            fontWeight: '600',
            color: colors.textPrimary,
          }}
        >
          {abbrev}
        </Text>
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: type.subheading.fontSize,
          lineHeight: type.subheading.lineHeight,
          fontWeight: type.subheading.fontWeight,
          color: colors.textPrimary,
        }}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Icon
        name="chevron-right"
        size={14}
        color={colors.textTertiary}
        strokeWidth={2.25}
      />
    </View>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={a11y}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {body}
    </Pressable>
  );
}
