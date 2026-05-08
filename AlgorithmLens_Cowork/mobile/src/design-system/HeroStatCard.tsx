/**
 * HeroStatCard — single-number hero with plain-language label.
 *
 * Per SKILL.md / README.md:
 *   - One hero per screen. Two competing heroes break restraint.
 *   - Big number is brand-primary, 64/72/600/-0.02em with tabular-nums.
 *   - Optional unit (e.g. "%") sits to the right at display weight.
 *   - Plain-language label sits beneath; description below that.
 *   - Optional caution badge (low sample size) at the bottom.
 *
 * Voice: caller supplies copy. This component renders only.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './Card';
import { CautionBadge } from './CautionBadge';
import { colors, type, spacing } from '../design-tokens/tokens';

export interface HeroStatCardProps {
  /** The big number itself. Pre-formatted by the caller. */
  value: string;
  /** Optional unit ("%", "min", etc). Smaller and top-aligned. */
  unit?: string;
  /** Plain-language interpretation. Sentence case. */
  label: string;
  /** Secondary clarification. Sentence case. Optional. */
  description?: string;
  /** Caution copy. Renders the caution badge when present. */
  caution?: string;
}

export function HeroStatCard({
  value,
  unit,
  label,
  description,
  caution,
}: HeroStatCardProps) {
  return (
    <Card padding={22}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s1 }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: type.hero.fontSize,
            lineHeight: type.hero.lineHeight,
            fontWeight: type.hero.fontWeight,
            letterSpacing: type.hero.letterSpacing,
            color: colors.brandPrimary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {value}
        </Text>
        {unit ? (
          <Text
            allowFontScaling={false}
            style={{
              fontSize: type.display.fontSize,
              lineHeight: type.display.lineHeight,
              fontWeight: type.display.fontWeight,
              color: colors.textPrimary,
              fontVariant: ['tabular-nums'],
              marginTop: spacing.s2,
            }}
          >
            {unit}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          fontSize: type.subheading.fontSize,
          lineHeight: type.subheading.lineHeight,
          fontWeight: type.subheading.fontWeight,
          color: colors.textPrimary,
          marginTop: spacing.s2,
        }}
      >
        {label}
      </Text>
      {description ? (
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
            marginTop: spacing.s1,
          }}
        >
          {description}
        </Text>
      ) : null}
      {caution ? (
        <View style={{ marginTop: spacing.s3 + 2 }}>
          <CautionBadge>{caution}</CautionBadge>
        </View>
      ) : null}
    </Card>
  );
}
