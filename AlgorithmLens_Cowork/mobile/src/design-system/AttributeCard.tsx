/**
 * AttributeCard — small bg-secondary sub-card with label + value.
 *
 * Used inside the "Content patterns" expanded body. 2-up grid, six cells,
 * each cell shows a label (caption / gray) above a value (subheading /
 * near-black, or brand-accent green when `accent` is true).
 *
 * Inner radius is 10px per the design's nested-sub-card convention.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors, type, spacing } from '../design-tokens/tokens';

export interface AttributeCardProps {
  label: string;
  value: string;
  /** Render value in brand-accent (green) for "interpreted positive". */
  accent?: boolean;
}

export function AttributeCard({ label, value, accent }: AttributeCardProps) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: colors.bgSecondary,
        borderRadius: 10,
        padding: spacing.s4 - 2, // 14
      }}
    >
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
      <Text
        style={{
          fontSize: type.subheading.fontSize,
          lineHeight: type.subheading.lineHeight,
          fontWeight: type.subheading.fontWeight,
          color: accent ? colors.brandAccent : colors.textPrimary,
          marginTop: spacing.s1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
