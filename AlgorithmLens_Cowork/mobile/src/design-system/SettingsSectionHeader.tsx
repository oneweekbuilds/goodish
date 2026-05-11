/**
 * SettingsSectionHeader: micro-type uppercase eyebrow above a Settings card.
 *
 * Per DESIGN.md §4 (type-micro: 11/14/500/0.5px ls, uppercase) and the
 * Home prompt carve-out: uppercase is permitted in the eyebrow pattern.
 * Callers pass the title in sentence case; the component uppercases it
 * via textTransform so the source code stays sentence-case.
 *
 *   <SettingsSectionHeader title="Scans" />   // renders "SCANS"
 *
 * The horizontal padding inside this component matches SettingsRow's
 * horizontal inset, so eyebrow text and row labels align on the left
 * when both sit inside a parent with the same outer screen padding.
 */
import React from 'react';
import { Text } from 'react-native';
import { colors, type, spacing } from '../design-tokens/tokens';

export interface SettingsSectionHeaderProps {
  title: string;
}

export function SettingsSectionHeader({ title }: SettingsSectionHeaderProps) {
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
