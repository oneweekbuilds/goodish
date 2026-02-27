/**
 * FeedScoreTrend — 7-day sparkline showing feed health score over time.
 *
 * Shows a compact trend visualization on the home screen with:
 * - A small SVG-like sparkline (drawn with View elements)
 * - Color-coded direction arrow (green up, orange down, gray dash)
 * - Contextual summary text
 *
 * Design: Compact, informational. Fits below or beside the FeedScoreCard.
 * Uses the design system's color tokens. Never alarming.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY, ICON_SIZES } from '../../lib/theme';
import type { FeedScoreTrendPoint, TrendDirection } from '../../types/achievements';

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
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
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
            <Activity size={12} color={colors.primaryBlue} strokeWidth={2} />
          </View>
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary, flex: 1 }}>
            Your score trend will appear here after a few scans on different days.
          </Text>
        </View>
      </View>
    );
  }

  const directionColor = getDirectionColor(direction, colors);
  const DirectionIcon = getDirectionIcon(direction);
  const summaryText = getSummaryText(direction, changePercent);

  return (
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
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
            width: 24,
            height: 24,
            borderRadius: RADIUS.md,
            backgroundColor: colors.blue50,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Activity size={12} color={colors.primaryBlue} strokeWidth={2} />
        </View>
        <Text
          style={{
            ...TYPOGRAPHY.labelBold,
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
                ...TYPOGRAPHY.captionSmall,
                color: directionColor,
                fontWeight: '600',
              }}
            >
              {changePercent > 0 ? '+' : ''}{changePercent}%
            </Text>
          )}
        </View>
      </View>

      {/* Sparkline */}
      <Sparkline points={points} color={directionColor} colors={colors} />

      {/* Summary text */}
      <Text
        style={{
          ...TYPOGRAPHY.caption,
          color: colors.textSecondary,
          marginTop: SPACING.sm,
        }}
      >
        {summaryText}
      </Text>
    </View>
  );
}

export const FeedScoreTrend = React.memo(FeedScoreTrendComponent);

// ─── Sparkline Component ────────────────────────────────

const Sparkline = React.memo(function Sparkline({
  points,
  color,
  colors,
}: {
  points: FeedScoreTrendPoint[];
  color: string;
  colors: Record<string, string | readonly string[]>;
}) {
  const scores = points.map((p) => p.score);
  const min = Math.max(0, Math.min(...scores) - 5);
  const max = Math.min(100, Math.max(...scores) + 5);
  const range = Math.max(max - min, 10); // Minimum range prevents exaggerated visualization

  const CHART_HEIGHT = 40;
  const CHART_WIDTH_PER_POINT = 36;
  const chartWidth = Math.max(points.length * CHART_WIDTH_PER_POINT, 100);

  return (
    <View
      style={{
        height: CHART_HEIGHT + SPACING.sm,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: SPACING.xxs,
      }}
    >
      {scores.map((score, index) => {
        const normalized = (score - min) / range;
        const barHeight = Math.max(4, normalized * CHART_HEIGHT);
        const isLast = index === scores.length - 1;

        return (
          <View
            key={points[index]?.date ?? index}
            style={{
              flex: 1,
              alignItems: 'center',
              maxWidth: CHART_WIDTH_PER_POINT,
            }}
          >
            {/* Score label on top of last bar */}
            {isLast && (
              <Text
                style={{
                  ...TYPOGRAPHY.captionSmall,
                  color: color,
                  fontWeight: '600',
                  marginBottom: SPACING.xxs,
                }}
              >
                {score}
              </Text>
            )}

            {/* Bar */}
            <View
              style={{
                width: '70%',
                height: barHeight,
                borderRadius: RADIUS.xs,
                backgroundColor: isLast ? color : (colors.blue100 as string),
                minWidth: 8,
              }}
            />

            {/* Day label — TS-001 FIX: was ~9px, now uses captionSmall (11px) minimum */}
            <Text
              style={{
                fontSize: TYPOGRAPHY.captionSmall.fontSize,
                color: colors.textTertiary as string,
                marginTop: SPACING.xxs,
              }}
            >
              {formatDayLabel(points[index]?.date ?? '')}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

function getDirectionColor(direction: TrendDirection, colors: Record<string, string | readonly string[]>): string {
  switch (direction) {
    case 'improving': return colors.accentGreen as string;
    case 'declining': return colors.warning as string;
    default: return colors.textTertiary as string;
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
