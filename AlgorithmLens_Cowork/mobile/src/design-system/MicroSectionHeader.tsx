/**
 * MicroSectionHeader: micro-type uppercase eyebrow used to label sections.
 *
 * Per DESIGN.md section 4 (type-micro: 11/14/500/0.5px ls, uppercase) and
 * the Home prompt carve-out: uppercase is permitted in the eyebrow
 * pattern. Callers pass the title in sentence case; the component
 * uppercases via textTransform so source code stays sentence-case.
 *
 *   <MicroSectionHeader title="What changed" />   renders "WHAT CHANGED"
 *
 * Horizontal padding aligns with the design system's standard row inset,
 * so the eyebrow text and any rows beneath it align on the left when
 * both sit inside a parent at the same outer screen padding.
 */
import React from 'react';
import { Text } from 'react-native';
import { colors, type, spacing } from '../design-tokens/tokens';

export interface MicroSectionHeaderProps {
  title: string;
}

export function MicroSectionHeader({ title }: MicroSectionHeaderProps) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontSize: type.micro.fontSize,
        lineHeight: type.micro.lineHeight,
        fontWeight: type.micro.fontWeight,
        letterSpacing: type.micro.letterSpacing,
        textTransform: 'uppercase',
        color: colors.textTertiary,
        paddingHorizontal: spacing.s4,
        marginBottom: spacing.s2,
      }}
    >
      {title}
    </Text>
  );
}
