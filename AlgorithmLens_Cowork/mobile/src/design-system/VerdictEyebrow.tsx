/**
 * VerdictEyebrow: small uppercase "VERDICT" label with a 2px brand-blue
 * rule above it. Introduces the hero verdict at the top of the Results
 * screen (and will be reused on Dashboard surfaces in later phases).
 *
 * Layout: a 28px brand-blue rule, then the uppercase label beneath.
 * Both left-aligned within the parent. Caller controls horizontal
 * positioning; horizontal padding lives in the parent, not the
 * component (matches HeroStatCard's convention).
 *
 * Reference: mobile/audits/2x-results-design/decisions.md
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, type } from '../design-tokens/tokens';

// Rule dimensions live as component-local constants since they're
// specific to this primitive and not part of the token system.
const RULE_WIDTH = 28;
const RULE_HEIGHT = 2;

export interface VerdictEyebrowProps {
  /**
   * Defaults to "VERDICT". Caller may pass a custom label such as
   * "VERDICT · TODAY" for the Results surface, or surface-specific
   * eyebrows in later phases.
   */
  label?: string;
}

export function VerdictEyebrow({ label = 'VERDICT' }: VerdictEyebrowProps) {
  return (
    <View>
      <View
        style={{
          width: RULE_WIDTH,
          height: RULE_HEIGHT,
          backgroundColor: colors.brandPrimary,
          marginBottom: spacing.s2,
        }}
      />
      <Text
        accessibilityRole="header"
        style={{
          fontSize: type.micro.fontSize,
          lineHeight: type.micro.lineHeight,
          fontWeight: type.micro.fontWeight,
          letterSpacing: type.micro.letterSpacing,
          textTransform: 'uppercase',
          color: colors.brandPrimary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
