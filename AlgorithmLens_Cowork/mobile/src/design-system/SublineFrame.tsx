/**
 * SublineFrame: shared layout for the OBSERVED / LIKELY sub-line
 * components. Renders the marker + uppercase label on a single
 * horizontal row, then the body text beneath.
 *
 * Private to the design system: this file is NOT exported from
 * design-system/index.ts. ObservedSubline and LikelySubline import
 * it directly. Privacy is enforced by barrel exclusion (the same
 * pattern the rest of the design system uses to mark internals).
 *
 * Inter-sub-line spacing (12/22/24px gaps depending on adjacent
 * mode transitions per the Results design spec) is the parent
 * layout's responsibility, not this component's. SublineFrame
 * renders only one sub-line.
 *
 * Reference: mobile/audits/2x-results-design/decisions.md
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, type } from '../design-tokens/tokens';

export interface SublineFrameProps {
  /** Element rendered to the left of the label. The marker geometry is
   *  the consumer's responsibility (filled square vs hollow ring). */
  marker: React.ReactNode;
  /** Uppercase label such as "OBSERVED" or "LIKELY". Sentence-case
   *  input gets uppercased via textTransform. */
  label: string;
  /** Sub-line body text. */
  children: React.ReactNode;
  testID?: string;
}

export function SublineFrame({
  marker,
  label,
  children,
  testID,
}: SublineFrameProps) {
  return (
    <View testID={testID}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.s2,
        }}
      >
        {marker}
        <Text
          style={{
            fontSize: type.micro.fontSize,
            lineHeight: type.micro.lineHeight,
            fontWeight: type.micro.fontWeight,
            letterSpacing: type.micro.letterSpacing,
            textTransform: 'uppercase',
            color: colors.textSecondary,
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          fontWeight: type.body.fontWeight,
          color: colors.textPrimary,
          marginTop: spacing.s1,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
