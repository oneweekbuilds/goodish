/**
 * ToneComparisonCard — Side-by-side stacked bar comparison.
 *
 * Reusable component showing two ALStackedBar charts side by side
 * with labels, denominators, and an optional delta insight.
 * Used in Ads tab (Tone: Selling vs Not Selling) and Suggested tab
 * (Commercial Content Comparison).
 *
 * Stacks vertically on narrow screens for readability.
 */

import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ALStackedBar, ALStackedBarSegment } from '../charts/ALStackedBar';
import { Text } from '../glue';
import { SPACING, RADIUS, GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { Info } from 'lucide-react-native';

export interface ToneComparisonCardProps {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftSegments: ALStackedBarSegment[];
  rightSegments: ALStackedBarSegment[];
  leftDenominator: string;
  rightDenominator: string;
  deltaInsight: string | null;
}

export function ToneComparisonCard({
  title,
  leftLabel,
  rightLabel,
  leftSegments,
  rightSegments,
  leftDenominator,
  rightDenominator,
  deltaInsight,
}: ToneComparisonCardProps) {
  const { colors, shadows } = useTheme();
  const { width } = useWindowDimensions();

  // Stack vertically on narrow screens (< 360pt usable width)
  const isNarrow = width < 380;

  return (
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        ...shadows.card,
        gap: SPACING.md,
      }}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${deltaInsight || ''}`}
    >
      {/* Title */}
      <Text
        variant="labelBold"
        color={colors.textMain}
        style={{ marginBottom: SPACING.xxs }}
      >
        {title}
      </Text>

      {/* Two-column (or stacked) comparison */}
      <View
        style={{
          flexDirection: isNarrow ? 'column' : 'row',
          gap: SPACING.md,
        }}
      >
        {/* Left group */}
        <View style={{ flex: 1, gap: SPACING.xs }}>
          <Text
            variant="label"
            color={colors.textSecondary}
          >
            {leftLabel}
          </Text>
          <ALStackedBar segments={leftSegments} barHeight={12} />
          <Text
            style={{
              ...GL_TYPOGRAPHY.captionSmall,
              color: colors.textTertiary,
            }}
          >
            {leftDenominator}
          </Text>
        </View>

        {/* Right group */}
        <View style={{ flex: 1, gap: SPACING.xs }}>
          <Text
            variant="label"
            color={colors.textSecondary}
          >
            {rightLabel}
          </Text>
          <ALStackedBar segments={rightSegments} barHeight={12} />
          <Text
            style={{
              ...GL_TYPOGRAPHY.captionSmall,
              color: colors.textTertiary,
            }}
          >
            {rightDenominator}
          </Text>
        </View>
      </View>

      {/* Delta insight */}
      {deltaInsight && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: SPACING.xs,
            paddingTop: SPACING.xxs,
          }}
        >
          <Info size={13} color={colors.textSecondary} strokeWidth={2} style={{ marginTop: 2 }} />
          <Text
            style={{
              ...GL_TYPOGRAPHY.captionSmall,
              color: colors.textSecondary,
              fontStyle: 'italic',
              flex: 1,
              lineHeight: 17,
            }}
          >
            {deltaInsight}
          </Text>
        </View>
      )}
    </View>
  );
}
