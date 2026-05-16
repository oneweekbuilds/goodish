/**
 * CautionPill: status pill for low-data / threshold warnings.
 *
 * Pill (border-radius full), caution12 background tint, 12px
 * alert-triangle icon in textPrimary, caption text in textPrimary,
 * roughly 32px tall. Self-aligning to its content so consumers can
 * place it inline.
 *
 * Distinct from CautionBadge: CautionBadge is the dashboard's
 * sample-size disclosure pattern (also caution-tinted, also pill-shaped)
 * but defined with its own padding for that surface. CautionPill is
 * tuned for the Recording card's "keep scrolling" affordance.
 *
 * Announces via accessibilityLiveRegion="polite" so VoiceOver picks up
 * the appearance when frame count crosses below the threshold.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, radius, spacing, type } from '../design-tokens/tokens';

export interface CautionPillProps {
  text: string;
}

export function CautionPill({ text }: CautionPillProps) {
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      accessibilityLabel={text}
      style={{
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s2,
        paddingVertical: spacing.s2,
        paddingHorizontal: spacing.s3,
        backgroundColor: colors.caution12,
        borderRadius: radius.pill,
      }}
    >
      <Icon
        name="alert-triangle"
        size={12}
        color={colors.textPrimary}
        strokeWidth={2}
      />
      <Text
        style={{
          fontSize: type.caption.fontSize,
          lineHeight: type.caption.lineHeight,
          fontWeight: type.caption.fontWeight,
          color: colors.textPrimary,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
