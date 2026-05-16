/**
 * CategoryRow — label on the left, tabular-nums value on the right,
 * hairline divider beneath. Used inside expanded ExpandableCard bodies
 * (e.g. "Photo … 40%", "Video … 29%").
 *
 * Pass `last` on the final row to drop the bottom border so the divider
 * doesn't double-render against the card's bottom edge.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors, type, spacing } from '../design-tokens/tokens';

export interface CategoryRowProps {
  label: string;
  value: string;
  /** Suppress the bottom hairline when this is the last row. */
  last?: boolean;
  /** Render value in brand-accent (green) for "positive" interpretive cells. */
  accent?: boolean;
}

export function CategoryRow({ label, value, last, accent }: CategoryRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.s3,
        paddingVertical: spacing.s3 - 2, // 10
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          fontWeight: type.body.fontWeight,
          color: colors.textPrimary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: type.subheading.fontSize,
          lineHeight: type.subheading.lineHeight,
          fontWeight: type.subheading.fontWeight,
          color: accent ? colors.brandAccent : colors.textPrimary,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}
