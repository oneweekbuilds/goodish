/**
 * CautionBadge — pill with caution-12 tint, alert-triangle icon, near-black text.
 *
 * Per SKILL.md / README.md: the caution color appears ONLY here, in
 * sample-size disclosures. Never in titles, never in body, never as a
 * decorative tint. Pill border-radius is 9999.
 *
 * Text color is text-primary (near-black), per `.fg-caution { color:
 * var(--text-primary) }` in colors_and_type.css — the caution color
 * is for the tint, not the text.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, type, spacing, radius } from '../design-tokens/tokens';

export interface CautionBadgeProps {
  children: React.ReactNode;
}

export function CautionBadge({ children }: CautionBadgeProps) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s2,
        paddingVertical: spacing.s2,
        paddingHorizontal: spacing.s3,
        backgroundColor: colors.caution12,
        borderRadius: radius.pill,
      }}
    >
      <Icon name="alert-triangle" size={12} color={colors.textPrimary} strokeWidth={2} />
      <Text
        style={{
          fontSize: type.caption.fontSize,
          lineHeight: type.caption.lineHeight,
          fontWeight: type.caption.fontWeight,
          color: colors.textPrimary,
          // Tabular figures so the embedded post count ("Based on N posts")
          // doesn't shift width when N changes scan-to-scan.
          fontVariant: ['tabular-nums'],
        }}
      >
        {children}
      </Text>
    </View>
  );
}
