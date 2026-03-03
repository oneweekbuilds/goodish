/**
 * FeedScoreTrend — 7-day sparkline showing feed health score over time.
 *
 * Shows a compact trend visualization on the home screen with:
 * - ALLineChart smooth curve with gradient area fill
 * - Color-coded direction arrow (green up, orange down, gray dash)
 * - Contextual summary text
 * - Gradient card surface with brand-tint border
 *
 * Phase 3 upgrade: Replaced custom SVG bar sparkline with ALLineChart
 * (react-native-gifted-charts) for smooth bezier curves and area fill.
 */

import React from 'react';
import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, ICON_SIZES } from '../../lib/theme';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { Text } from '../glue';
import { ALLineChart } from '../charts';
import type { FeedScoreTrendPoint, TrendDirection } from '../../types/achievements';

// Web-safe gradient wrapper for LinearGradient
const GradientWrapper = Platform.OS === 'web'
  ? ({ colors: gradientColors, start, end, style, children, ...props }: any) => {
      const flatStyle = style ? (Array.isArray(style) ? Object.assign({}, ...style) : style) : {};
      return (
        <View
          style={{
            ...flatStyle,
            background: `linear-gradient(to bottom, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
          }}
          {...props}
        >
          {children}
        </View>
      );
    }
  : LinearGradient;

interface FeedScoreTrendProps {
  points: FeedScoreTrendPoint[];
  direction: TrendDirection;
  changePercent: number;
}

function FeedScoreTrendComponent({ points, direction, changePercent }: FeedScoreTrendProps) {
  const { colors, shadows } = useTheme();

  // Need at least 2 points for a meaningful trend
  if (points.length < 2) {
    return (
      <GradientWrapper
        colors={[colors.bgCard, colors.bgCardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.brandTintBorder,
          ...shadows.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View
            style={{
              width: ICON_SIZES.md,
              height: ICON_SIZES.md,
              borderRadius: RADIUS.md,
              backgroundColor: colors.blue50,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Activity size={14} color={colors.primaryBlue} strokeWidth={2} />
          </View>
          <Text style={{ ...GL_TYPOGRAPHY.caption, color: colors.textSecondary, flex: 1 }}>
            Your score trend will appear here after a few scans on different days.
          </Text>
        </View>
      </GradientWrapper>
    );
  }

  const directionColor = getDirectionColor(direction, colors);
  const DirectionIcon = getDirectionIcon(direction);
  const summaryText = getSummaryText(direction, changePercent);

  // Prepare data for ALLineChart
  const lineData = points.map((point) => ({
    value: point.score,
    label: formatDayLabel(point.date),
  }));

  return (
    <GradientWrapper
      colors={[colors.bgCard, colors.bgCardGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.brandTintBorder,
        ...shadows.card,
      }}
      accessibilityRole="image"
      accessibilityLabel={`Feed score trend: ${direction === 'improving' ? 'improving' : direction === 'declining' ? 'declining' : 'stable'} over 7 days`}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          marginBottom: SPACING.md,
        }}
      >
        <View
          style={{
            width: ICON_SIZES.md,
            height: ICON_SIZES.md,
            borderRadius: RADIUS.md,
            backgroundColor: colors.blue50,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Activity size={14} color={colors.primaryBlue} strokeWidth={2} />
        </View>
        <Text
          style={{
            ...GL_TYPOGRAPHY.labelBold,
            color: colors.textMain,
            flex: 1,
          }}
        >
          7-Day Trend
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
          <DirectionIcon size={14} color={directionColor} strokeWidth={2} />
          {changePercent !== 0 && (
            <Text
              style={{
                ...GL_TYPOGRAPHY.captionSmall,
                color: directionColor,
                fontWeight: '600',
              }}
            >
              {changePercent > 0 ? '+' : ''}{changePercent}%
            </Text>
          )}
        </View>
      </View>

      {/* Line Chart — replaces old bar sparkline */}
      <ALLineChart
        data={lineData}
        height={48}
        color={directionColor}
        areaChart={true}
        hideAxes={true}
        showDots={true}
        accessibilitySummary="7-day feed score trend"
      />

      {/* Summary text */}
      <Text
        style={{
          ...GL_TYPOGRAPHY.caption,
          color: colors.textSecondary,
          marginTop: SPACING.sm,
        }}
      >
        {summaryText}
      </Text>
    </GradientWrapper>
  );
}

export const FeedScoreTrend = React.memo(FeedScoreTrendComponent);

function getDirectionColor(direction: TrendDirection, colors: Record<string, string | readonly string[]>): string {
  switch (direction) {
    case 'improving': return colors.success as string;
    case 'declining': return colors.error as string;
    default: return colors.textSecondary as string;
  }
}

function getDirectionIcon(direction: TrendDirection) {
  switch (direction) {
    case 'improving': return TrendingUp;
    case 'declining': return TrendingDown;
    default: return Minus;
  }
}

function getSummaryText(direction: TrendDirection, changePercent: number): string {
  const absChange = Math.abs(changePercent);
  switch (direction) {
    case 'improving':
      return `Your feed health improved ${absChange}% this week. Keep scanning to track your progress.`;
    case 'declining':
      return `Your feed health shifted ${absChange}% this week. Feed composition naturally varies over time.`;
    default:
      return 'Your feed health has been steady this week. Regular scanning helps you notice changes over time.';
  }
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()] ?? '';
}
