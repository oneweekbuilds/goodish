/**
 * VerdictText: hero verdict at the top of the Results screen.
 *
 * Renders the verdict sentence in large near-black weight. Uses
 * type.display (32/38/600) as the base; letterSpacing is overridden
 * to -0.64 (the -0.02em the design spec calls for at this scale).
 * The 32 vs spec-32-vs-spec-30 difference is visually indistinguishable
 * and avoids introducing a new type token for a single consumer.
 *
 * Platform note: the design spec calls for `text-wrap: balance` so
 * two-line verdicts wrap with roughly balanced line widths. React
 * Native does not support text-wrap: balance and offers no functional
 * equivalent — default greedy word-wrap applies. Two-line verdicts
 * will wrap based on container width with the longest sequence on
 * the first line. Worked around at the copy level by writing verdicts
 * that fit in one line or naturally split well.
 *
 * Reference: mobile/audits/2x-results-design/decisions.md
 */
import React from 'react';
import { Text } from 'react-native';
import { colors, type } from '../design-tokens/tokens';

// -0.02em at the type.display base size of 32px = -0.64px.
const LETTER_SPACING = -0.64;

export interface VerdictTextProps {
  /** The verdict sentence to render. */
  children: React.ReactNode;
  testID?: string;
}

export function VerdictText({ children, testID }: VerdictTextProps) {
  return (
    <Text
      accessibilityRole="header"
      testID={testID}
      style={{
        fontSize: type.display.fontSize,
        lineHeight: type.display.lineHeight,
        fontWeight: type.display.fontWeight,
        letterSpacing: LETTER_SPACING,
        color: colors.textPrimary,
      }}
    >
      {children}
    </Text>
  );
}
