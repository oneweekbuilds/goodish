/**
 * SupportingCard: the bg-secondary card that wraps the supporting
 * rows (FactRow, plus CreatorRow / TrajectoryRow / etc. in later
 * phases) beneath the sub-line zone on the Results screen.
 *
 * Distinct from the canonical `Card` primitive (white bg, hairline
 * border). The supporting card uses a bg-secondary fill with no
 * border: the fill defines the shape, and the absence of a border
 * lets the card read as a quiet "data shelf" rather than a primary
 * content surface. This is a deliberate departure from the canonical
 * card style, not a token override; the supporting card is a different
 * visual treatment in the design system.
 *
 * The eyebrow (uppercase micro text, tertiary gray) sits at the top
 * of the card with a 12px gap before the first child. Defaults to
 * "FROM THIS SCAN" per the design spec; callers may override (the
 * spec allows surface-specific variants like "WHAT WE SAW").
 *
 * Phase 4.2.1 ships the shell. FactRow lands in 4.2.2. The other five
 * row variants (CreatorRow, TrajectoryRow, BarRow, CaveatNote,
 * MethodologyRow) ship in Phase 5+.
 *
 * Reference: mobile/audits/2x-results-design/decisions.md
 */
import React from 'react';
import { View, Text } from 'react-native';
import {
  colors,
  layout,
  radius,
  spacing,
  type,
} from '../design-tokens/tokens';

export interface SupportingCardProps {
  /** The supporting-row children (FactRow etc.). */
  children: React.ReactNode;
  /** Top-of-card eyebrow. Defaults to "FROM THIS SCAN". */
  eyebrow?: string;
  testID?: string;
}

export function SupportingCard({
  children,
  eyebrow = 'FROM THIS SCAN',
  testID,
}: SupportingCardProps) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: colors.bgSecondary,
        borderRadius: radius.card,
        padding: layout.cardPadding,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{
          fontSize: type.micro.fontSize,
          lineHeight: type.micro.lineHeight,
          fontWeight: type.micro.fontWeight,
          letterSpacing: type.micro.letterSpacing,
          textTransform: 'uppercase',
          color: colors.textTertiary,
          marginBottom: spacing.s3,
        }}
      >
        {eyebrow}
      </Text>
      {children}
    </View>
  );
}
