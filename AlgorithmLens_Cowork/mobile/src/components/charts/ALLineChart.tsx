/**
 * ALLineChart — Smooth line chart with gradient fill and touch interactions.
 *
 * Uses react-native-gifted-charts LineChart with bezier curves, gradient
 * area fill, animated drawing, and touch-to-show-value tooltips.
 */

import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { Text, Skeleton, EmptyState } from '../glue';

// ─── Types ──────────────────────────────────────────────

export interface ALLineChartPoint {
  value: number;
  label?: string;
  date?: string;
}

export interface ALLineChartProps {
  /** Data points */
  data: ALLineChartPoint[];
  /** Second line for comparison */
  data2?: ALLineChartPoint[];
  /** Whether data is still loading */
  loading?: boolean;
  /** Message when data is empty */
  emptyMessage?: string;
  /** Line color */
  color?: string;
  /** Second line color */
  color2?: string;
  /** Height of the chart */
  height?: number;
  /** Show area gradient fill */
  areaChart?: boolean;
  /** Hide axes and rules (for sparkline mode) */
  hideAxes?: boolean;
  /** Accessibility summary */
  accessibilitySummary?: string;
  /** Show data point dots */
  showDots?: boolean;
}

// ─── Component ──────────────────────────────────────────

function ALLineChartComponent({
  data,
  data2,
  loading = false,
  emptyMessage = 'Not enough data points yet.',
  color,
  color2,
  height = 200,
  areaChart = true,
  hideAxes = false,
  accessibilitySummary,
  showDots = true,
}: ALLineChartProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const lineColor = color ?? (colors.primary as string);
  const lineColor2 = color2 ?? (colors.secondary as string);

  // ─── Loading State ──────────────────────────────────
  if (loading) {
    return <Skeleton width="100%" height={height} borderRadius={RADIUS.md} />;
  }

  // ─── Empty State ────────────────────────────────────
  if (!data || data.length < 2) {
    return <EmptyState icon="trending-up" message={emptyMessage} />;
  }

  // ─── Prepare Data ───────────────────────────────────
  const chartData = data.map((point) => ({
    value: point.value,
    label: point.label ?? '',
    dataPointText: String(point.value),
  }));

  const chartData2 = data2?.map((point) => ({
    value: point.value,
    label: point.label ?? '',
    dataPointText: String(point.value),
  }));

  const spacing = Math.max(20, (screenWidth - 100) / Math.max(data.length - 1, 1));

  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const defaultAccessibilityLabel = `Line chart with data ranging from ${Math.round(minValue)} to ${Math.round(maxValue)} across ${data.length} data points`;

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilitySummary
          ? `Line chart showing ${accessibilitySummary}`
          : defaultAccessibilityLabel
      }
    >
      <LineChart
        data={chartData}
        data2={chartData2}
        width={screenWidth - 80}
        height={height}
        spacing={spacing}
        color={lineColor}
        color2={lineColor2}
        thickness={2}
        thickness2={2}
        curved
        curvature={0.2}
        isAnimated
        animationDuration={800}
        areaChart={areaChart}
        startFillColor={lineColor}
        endFillColor={lineColor}
        startOpacity={0.15}
        endOpacity={0.01}
        startFillColor2={lineColor2}
        endFillColor2={lineColor2}
        startOpacity2={0.15}
        endOpacity2={0.01}
        dataPointsColor={lineColor}
        dataPointsColor2={lineColor2}
        dataPointsRadius={showDots ? 4 : 0}
        dataPointsRadius2={showDots ? 4 : 0}
        hideDataPoints={!showDots}
        hideDataPoints2={!showDots}
        noOfSections={hideAxes ? 0 : 4}
        yAxisThickness={hideAxes ? 0 : 0}
        xAxisThickness={hideAxes ? 0 : 1}
        xAxisColor={colors.borderSubtle as string}
        hideRules={hideAxes}
        rulesColor={colors.borderSubtle as string}
        rulesType="dashed"
        dashWidth={4}
        dashGap={4}
        yAxisTextStyle={hideAxes ? { fontSize: 0 } : {
          ...GL_TYPOGRAPHY.captionSmall,
          color: colors.textTertiary as string,
        }}
        xAxisLabelTextStyle={hideAxes ? { fontSize: 0 } : {
          ...GL_TYPOGRAPHY.captionSmall,
          color: colors.textSecondary as string,
        }}
        hideYAxisText={hideAxes}
        pointerConfig={hideAxes ? undefined : {
          pointerStripColor: colors.borderDefault as string,
          pointerStripWidth: 1,
          pointerColor: lineColor,
          radius: 5,
          pointerLabelWidth: 100,
          pointerLabelHeight: 40,
          pointerLabelComponent: (items: any[]) => {
            const item = items?.[0];
            if (!item) return null;
            return (
              <View
                style={{
                  backgroundColor: colors.textPrimary as string,
                  paddingHorizontal: SPACING.sm,
                  paddingVertical: SPACING.xs,
                  borderRadius: RADIUS.sm,
                }}
              >
                <Text
                  style={{
                    ...GL_TYPOGRAPHY.captionSmall,
                    color: colors.bgCard as string,
                    fontWeight: '600',
                  }}
                >
                  {item.value}
                </Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
}

export const ALLineChart = React.memo(ALLineChartComponent);
