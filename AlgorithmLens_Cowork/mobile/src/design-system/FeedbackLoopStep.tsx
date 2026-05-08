/**
 * FeedbackLoopStep — numbered step row, used inside the
 * "How the feedback loop works" expandable card.
 *
 * Layout: a 28×28 brand-primary circle with the step number (white,
 * tabular-nums) on the left, then a stacked title + body on the right.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors, type, spacing, radius } from '../design-tokens/tokens';

export interface FeedbackLoopStepProps {
  /** Step number (1-based). */
  n: number;
  title: string;
  body: string;
  /** Suppress the bottom padding on the last step in a stack. */
  last?: boolean;
}

export function FeedbackLoopStep({ n, title, body, last }: FeedbackLoopStepProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.s4 - 2, // 14
        paddingBottom: last ? 0 : spacing.s5 - 2, // 18
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: radius.pill,
          backgroundColor: colors.brandPrimary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 15,
            lineHeight: 28,
            fontWeight: '600',
            color: colors.textOnBrand,
            fontVariant: ['tabular-nums'],
            textAlign: 'center',
          }}
        >
          {n}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.bodyStrong.fontWeight,
            color: colors.textPrimary,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
            marginTop: 2,
          }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}
