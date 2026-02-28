/**
 * ALPieChart — Donut-style pie chart with center metric and touch highlights.
 *
 * Uses react-native-gifted-charts PieChart in donut mode. Supports touch
 * to highlight individual segments with a tooltip, and an optional center label.
 */

import React, { useState, useMemo } from 'react';
import { View, useWindowDimensions, Pressable } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { Text, Skeleton, EmptyState } from '../glue';

// ─── Types ──────────────────────────────────────────────

export interface ALPieChartSegment {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface ALPieChartProps {
  /** Segments to display */
  data: ALPieChartSegment[];
  /** Whether data is still loading */
  loading?: boolean;
  /** Message when data is empty */
  emptyMessage?: string;
  /** Center label text (e.g., "68%") */
  centerLabel?: string;
  /** Center sublabel text (e.g., "Organic") */
  centerSubLabel?: string;
  /** Donut radius - outer */
  radius?: number;
  /** Inner radius for donut hole */
  innerRadius?: number;
  /** Show legend below chart */
  showLegend?: boolean;
  /** Accessibility summary */
  accessibilitySummary?: string;
}

// ─── Legend Shape ────────────────────────────────────────

function LegendShape({ index, color }: { index: number; color: string }) {
  const shape = index % 4;
  switch (shape) {
    case 0:
      return <View style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: color }} />;
    case 1:
      return <View style={{ width: 10, height: 10, borderRadius: 1, backgroundColor: color }} />;
    case 2:
      return (
        <View style={{ width: 12, height: 12, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
        </View>
      );
    case 3:
      return (
        <View
          style={{
            width: 0, height: 0,
            borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 10,
            borderLeftColor: 'transparent', borderRightColor: 'transparent',
            borderBottomColor: color,
          }}
        />
      );
    default:
      return <View style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: color }} />;
  }
}

// ─── Component ──────────────────────────────────────────

function ALPieChartComponent({
  data,
  loading = false,
  emptyMessage = 'No data available yet.',
  centerLabel,
  centerSubLabel,
  radius: propRadius,
  innerRadius: propInnerRadius,
  showLegend = true,
  accessibilitySummary,
}: ALPieChartProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const radius = propRadius ?? Math.min(screenWidth * 0.3, 100);
  const innerRadius = propInnerRadius ?? radius * 0.6;

  // ─── Loading State ──────────────────────────────────
  if (loading) {
    return (
      <View style={{ alignItems: 'center', gap: SPACING.lg }}>
        <Skeleton width={radius * 2} height={radius * 2} borderRadius={radius} />
        <View style={{ flexDirection: 'row', gap: SPACING.lg }}>
          <Skeleton width={60} height={14} borderRadius={RADIUS.xs} />
          <Skeleton width={60} height={14} borderRadius={RADIUS.xs} />
        </View>
      </View>
    );
  }

  // ─── Empty State ────────────────────────────────────
  if (!data || data.length === 0) {
    return <EmptyState icon="pie-chart" message={emptyMessage} />;
  }

  // ─── Prepare Data ───────────────────────────────────
  const total = data.reduce((sum, s) => sum + s.value, 0);

  const chartData = data.map((segment, index) => ({
    value: segment.value,
    color: segment.color,
    focused: focusedIndex === index,
    onPress: () => setFocusedIndex(focusedIndex === index ? null : index),
  }));

  // Determine center display
  const displayLabel = focusedIndex !== null && data[focusedIndex]
    ? `${data[focusedIndex]!.percentage ?? (total > 0 ? Math.round((data[focusedIndex]!.value / total) * 100) : 0)}%`
    : centerLabel ?? '';
  const displaySubLabel = focusedIndex !== null && data[focusedIndex]
    ? data[focusedIndex]!.label
    : centerSubLabel ?? '';

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilitySummary
          ? `Donut chart showing ${accessibilitySummary}`
          : `Donut chart with ${data.length} segments`
      }
    >
      {/* Chart */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
        <PieChart
          data={chartData}
          donut
          radius={radius}
          innerRadius={innerRadius}
          innerCircleColor={colors.bgCard as string}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {displayLabel ? (
                <Text
                  style={{
                    ...GL_TYPOGRAPHY.scoreLarge,
                    color: colors.textMain as string,
                  }}
                >
                  {displayLabel}
                </Text>
              ) : null}
              {displaySubLabel ? (
                <Text
                  style={{
                    ...GL_TYPOGRAPHY.captionSmall,
                    color: colors.textSecondary as string,
                  }}
                >
                  {displaySubLabel}
                </Text>
              ) : null}
            </View>
          )}
          focusOnPress
          sectionAutoFocus
          isAnimated
          animationDuration={600}
        />
      </View>

      {/* Legend */}
      {showLegend && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: SPACING.md,
          }}
        >
          {data.map((segment, index) => {
            const pct = segment.percentage ?? (total > 0 ? Math.round((segment.value / total) * 100) : 0);
            const isActive = focusedIndex === index;
            return (
              <Pressable
                key={`pie-legend-${segment.label}-${index}`}
                onPress={() => setFocusedIndex(focusedIndex === index ? null : index)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  opacity: focusedIndex !== null && !isActive ? 0.4 : 1,
                }}
                accessible={true}
                accessibilityLabel={`${segment.label}: ${pct}%`}
              >
                <LegendShape index={index} color={segment.color} />
                <Text variant="label" color={colors.textMuted as string}>
                  {segment.label}
                </Text>
                <Text variant="bodySmall" color={colors.textSecondary as string}>
                  {pct}%
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export const ALPieChart = React.memo(ALPieChartComponent);
