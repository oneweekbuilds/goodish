/**
 * ALBarChart — Animated vertical bar chart wrapper around react-native-gifted-charts.
 *
 * Replaces the old custom SVG BarChart.tsx with a polished, interactive chart
 * supporting rounded bars, animated entrance, touch tooltips, and full theme integration.
 */

import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { ICON_SIZES } from '../../lib/theme';
import { Text, Skeleton, EmptyState } from '../glue';

// ─── Types ──────────────────────────────────────────────

export interface ALBarChartItem {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
  category?: string;
}

export interface ALBarChartProps {
  /** Data items to display */
  data: ALBarChartItem[];
  /** Whether data is still loading */
  loading?: boolean;
  /** Message when data is empty */
  emptyMessage?: string;
  /** Show horizontal bars instead of vertical */
  horizontal?: boolean;
  /** Maximum number of bars to display */
  maxBars?: number;
  /** Optional summary label for screen readers */
  accessibilitySummary?: string;
  /** Show a legend */
  showLegend?: boolean;
  /** Height of the chart area */
  height?: number;
  /** Bar width */
  barWidth?: number;
}

// ─── Component ──────────────────────────────────────────

function ALBarChartComponent({
  data,
  loading = false,
  emptyMessage = 'No data available yet. Complete a scan to see results.',
  horizontal = false,
  maxBars = 8,
  accessibilitySummary,
  showLegend = false,
  height = 200,
  barWidth,
}: ALBarChartProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // Graduated blue scale — ranked from darkest to lightest
  const barColors: string[] = useMemo(() => [
    colors.barDarkest,
    colors.barDark,
    colors.barMedium,
    colors.barLight,
    colors.barLightest,
  ], [colors]);

  const getBarColor = (index: number, itemColor?: string): string => {
    if (itemColor) return itemColor;
    if (index < barColors.length) return barColors[index]!;
    return colors.textTertiary as string;
  };

  // ─── Loading State ──────────────────────────────────
  if (loading) {
    return (
      <View style={{ gap: SPACING.md }}>
        <Skeleton width="100%" height={height} borderRadius={RADIUS.md} />
      </View>
    );
  }

  // ─── Empty State ────────────────────────────────────
  if (!data || data.length === 0) {
    return <EmptyState icon="bar-chart-3" message={emptyMessage} />;
  }

  // ─── Prepare Data ───────────────────────────────────
  const items = data.slice(0, maxBars);
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  const computedBarWidth = barWidth ?? Math.max(16, Math.min(36, (screenWidth - 120) / items.length - 12));

  const chartData = items.map((item, index) => {
    const itemPct = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
    return {
      value: item.value,
      label: item.label.length > 8 ? item.label.slice(0, 7) + '…' : item.label,
      frontColor: getBarColor(index, item.color),
      topLabelComponent: () => (
        <Text
          style={{
            ...GL_TYPOGRAPHY.captionSmall,
            color: colors.textSecondary as string,
            marginBottom: 2,
          }}
        >
          {itemPct}%
        </Text>
      ),
    };
  });

  // ─── Legend Entries ──────────────────────────────────
  const legendEntries = showLegend
    ? items.reduce<Array<{ label: string; color: string }>>((acc, item, index) => {
        const color = getBarColor(index, item.color);
        const label = item.category || item.label;
        if (!acc.some((e) => e.label === label && e.color === color)) {
          acc.push({ label, color });
        }
        return acc;
      }, [])
    : [];

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilitySummary
          ? `Bar chart showing ${accessibilitySummary}`
          : `Bar chart showing ${items.length} items`
      }
    >
      <BarChart
        data={chartData}
        width={screenWidth - 80}
        height={height}
        barWidth={computedBarWidth}
        barBorderTopLeftRadius={4}
        barBorderTopRightRadius={4}
        spacing={Math.max(8, (screenWidth - 80 - items.length * computedBarWidth) / (items.length + 1))}
        noOfSections={4}
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisColor={colors.borderSubtle as string}
        yAxisTextStyle={{
          ...GL_TYPOGRAPHY.captionSmall,
          color: colors.textTertiary as string,
        }}
        xAxisLabelTextStyle={{
          ...GL_TYPOGRAPHY.captionSmall,
          color: colors.textSecondary as string,
          width: computedBarWidth + 8,
          textAlign: 'center',
        }}
        hideRules={false}
        rulesColor={colors.borderSubtle as string}
        rulesType="dashed"
        dashWidth={4}
        dashGap={4}
        isAnimated={true}
        animationDuration={600}
        horizontal={horizontal}
        disablePress={false}
        renderTooltip={(item: any, index: number) => (
          <View
            style={{
              backgroundColor: '#1E293B',
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xs,
              borderRadius: RADIUS.sm,
              marginBottom: SPACING.xs,
            }}
          >
            <Text
              style={{
                ...GL_TYPOGRAPHY.captionSmall,
                color: '#F1F5F9',
                fontWeight: '600',
              }}
            >
              {items[index]?.label}: {item.value}
            </Text>
          </View>
        )}
      />

      {/* Legend */}
      {showLegend && legendEntries.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING.md,
            marginTop: SPACING.md,
            paddingTop: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: colors.borderSoft as string,
          }}
        >
          {legendEntries.map((entry, idx) => (
            <View
              key={`al-bar-legend-${idx}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.sm,
              }}
            >
              <View
                style={{
                  width: ICON_SIZES.dot,
                  height: ICON_SIZES.dot,
                  borderRadius: ICON_SIZES.dot / 2,
                  backgroundColor: entry.color,
                }}
              />
              <Text variant="label" color={colors.textMuted as string}>
                {entry.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export const ALBarChart = React.memo(ALBarChartComponent);
