/**
 * ScanHeader: chrome for the broadcast and analysis routes.
 *
 * Layout: [BackButton (44x44)] [title + optional subtitle, centered, flex] [44x44 spacer]
 *
 * The trailing spacer balances the BackButton so the centered title sits
 * at the screen's optical center, matching iOS navigation conventions.
 * The platform-tinted leading icon used in the legacy scanner/broadcast
 * headers is intentionally dropped; text carries the screen identity.
 *
 * The Compare picker and result screens use a slightly different inline
 * header (with a "Cancel" button on the right). Not subsumed here.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { BackButton } from './BackButton';
import { colors, layout, spacing, tap, type } from '../design-tokens/tokens';

export interface ScanHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** Override for the back button's accessibility label. */
  accessibilityBackLabel?: string;
}

export function ScanHeader({
  title,
  subtitle,
  onBack,
  accessibilityBackLabel,
}: ScanHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.screenPaddingX,
        paddingVertical: spacing.s3,
        gap: spacing.s3,
      }}
    >
      <BackButton onPress={onBack} accessibilityLabel={accessibilityBackLabel} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={{
            fontSize: type.subheading.fontSize,
            lineHeight: type.subheading.lineHeight,
            fontWeight: type.subheading.fontWeight,
            color: colors.textPrimary,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
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
      <View style={{ width: tap.min, height: tap.min }} />
    </View>
  );
}
