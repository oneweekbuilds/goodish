/**
 * CaptureFooter: persistent disclosure footer for the broadcast and
 * analysis routes.
 *
 * Layout: small shield icon centered above caption-weight tertiary text,
 * with bottom padding accounting for the device safe-area inset. Renders
 * the disclosure copy supplied by the caller; the primitive itself does
 * not bake in copy so the disclosure string lives at the consumer site
 * (broadcast and analysis routes will pass the same string).
 *
 * Persistent across card-state transitions within a route.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors, layout, spacing, type } from '../design-tokens/tokens';

export interface CaptureFooterProps {
  text: string;
}

export function CaptureFooter({ text }: CaptureFooterProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={{
        alignItems: 'center',
        paddingHorizontal: layout.screenPaddingX,
        paddingTop: spacing.s3,
        paddingBottom: spacing.s3 + insets.bottom,
        gap: spacing.s2,
      }}
    >
      <Icon name="shield" size={14} color={colors.textTertiary} strokeWidth={1.5} />
      <Text
        style={{
          fontSize: type.caption.fontSize,
          lineHeight: type.caption.lineHeight,
          fontWeight: type.caption.fontWeight,
          color: colors.textTertiary,
          textAlign: 'center',
        }}
      >
        {text}
      </Text>
    </View>
  );
}
