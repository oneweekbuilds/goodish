/**
 * WeeklySummaryCard — Weekly recap card shown on the home screen.
 *
 * Displays a warm, encouraging summary of the user's scanning activity
 * for the past week. This card makes scanning feel rewarding by
 * showing progress in a digestible format.
 *
 * Design: Card with a subtle calendar accent. Shows key metrics
 * with comparison arrows where previous week data is available.
 *
 * Tone: Celebratory and warm — this is a reward for their effort.
 * Follows epistemic restraint: describes what happened, never judges.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY, ICON_SIZES } from '../../lib/theme';
import { PLATFORMS } from '../../lib/theme';
import type { WeeklySummaryData } from '../../types/achievements';

interface WeeklySummaryCardProps {
  summary: WeeklySummaryData;
}

function WeeklySummaryCardComponent({ summary }: WeeklySummaryCardProps) {
  const { colors, shadows } = useTheme();

  // Build the ad change text
  const adChangeText = getAdChangeText(summary);
  const scoreChangeText = getScoreChangeText(summary);

  // Format top platform name
  const topPlatformName = summary.topPlatform
    ? (PLATFORMS[summary.topPlatform as keyof typeof PLATFORMS]?.name || summary.topPlatform)
    : null;

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
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Weekly summary: ${summary.scanCount} scans this week`}
    >
      {/* Header */}
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
            width: ICON_SIZES.lg,
            height: ICON_SIZES.lg,
            borderRadius: RADIUS.lg,
            backgroundColor: colors.green50,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Calendar size={16} color={colors.accentGreen} strokeWidth={2} />
        </View>
        <Text
          style={{
            ...TYPOGRAPHY.labelBold,
            color: colors.textMain,
            flex: 1,
          }}
        >
          Your Week in Review
        </Text>
        <Text
          style={{
            ...TYPOGRAPHY.captionSmall,
            color: colors.textTertiary,
          }}
        >
          {summary.weekId}
        </Text>
      </View>

      {/* Scan count — headline metric */}
      <View style={{ marginBottom: SPACING.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs }}>
          <Text style={{ ...TYPOGRAPHY.scoreLarge, color: colors.primaryBlue }}>
            {summary.scanCount}
          </Text>
          <Text style={{ ...TYPOGRAPHY.label, color: colors.textMuted }}>
            {summary.scanCount === 1 ? 'scan' : 'scans'} this week
          </Text>
        </View>
      </View>

      {/* Metrics grid */}
      <View style={{ gap: SPACING.sm }}>
        {/* Ad exposure change */}
        {adChangeText && (
          <MetricRow
            icon={getAdIcon(summary)}
            iconColor={getAdIconColor(summary, colors)}
            text={adChangeText}
            colors={colors}
          />
        )}

        {/* Score change */}
        {scoreChangeText && (
          <MetricRow
            icon={getScoreIcon(summary)}
            iconColor={getScoreIconColor(summary, colors)}
            text={scoreChangeText}
            colors={colors}
          />
        )}

        {/* Top platform */}
        {topPlatformName && summary.topPlatformCount > 1 && (
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary }}>
            Most scanned: {topPlatformName} ({summary.topPlatformCount} scans)
          </Text>
        )}

        {/* Total posts */}
        {summary.totalPosts > 0 && (
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textTertiary, marginTop: SPACING.xs }}>
            {summary.totalPosts} total posts analyzed across {summary.scanCount} sessions
          </Text>
        )}
      </View>
    </View>
  );
}

export const WeeklySummaryCard = React.memo(WeeklySummaryCardComponent);

// ─── Helper Components ──────────────────────────────────

function MetricRow({
  icon: Icon,
  iconColor,
  text,
  colors,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  iconColor: string;
  text: string;
  colors: Record<string, string | readonly string[]>;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: RADIUS.md,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon size={12} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary as string }}>
        {text}
      </Text>
    </View>
  );
}

// ─── Text Generators ────────────────────────────────────

function getAdChangeText(summary: WeeklySummaryData): string | null {
  if (summary.prevWeekAvgAdPercentage === null) {
    return `Average ad density: ${summary.avgAdPercentage.toFixed(1)}% across your scans`;
  }

  const change = summary.avgAdPercentage - summary.prevWeekAvgAdPercentage;
  const absChange = Math.abs(Math.round(change * 10) / 10);

  if (absChange < 0.5) {
    return `Ad density held steady at ${summary.avgAdPercentage.toFixed(1)}%`;
  }

  if (change < 0) {
    return `Ad density decreased by ${absChange.toFixed(1)} percentage points from last week`;
  }

  return `Ad density increased by ${absChange.toFixed(1)} percentage points from last week`;
}

function getScoreChangeText(summary: WeeklySummaryData): string | null {
  if (summary.avgFeedScore <= 0) return null;

  if (summary.prevWeekAvgFeedScore === null) {
    return `Average Feed Score: ${summary.avgFeedScore}`;
  }

  const change = summary.avgFeedScore - summary.prevWeekAvgFeedScore;
  const absChange = Math.abs(change);

  if (absChange < 2) {
    return `Feed Score stable at ${summary.avgFeedScore}`;
  }

  if (change > 0) {
    return `Feed Score improved ${absChange} points from last week`;
  }

  return `Feed Score shifted ${absChange} points from last week`;
}

// ─── Icon Selectors ─────────────────────────────────────

function getAdIcon(summary: WeeklySummaryData) {
  if (summary.prevWeekAvgAdPercentage === null) return Minus;
  const change = summary.avgAdPercentage - summary.prevWeekAvgAdPercentage;
  if (Math.abs(change) < 0.5) return Minus;
  return change < 0 ? TrendingDown : TrendingUp;
}

function getAdIconColor(summary: WeeklySummaryData, colors: Record<string, string | readonly string[]>): string {
  if (summary.prevWeekAvgAdPercentage === null) return colors.textSecondary as string;
  const change = summary.avgAdPercentage - summary.prevWeekAvgAdPercentage;
  if (Math.abs(change) < 0.5) return colors.textSecondary as string;
  // Lower ad density is positive, higher is negative
  return change < 0 ? (colors.success as string) : (colors.error as string);
}

function getScoreIcon(summary: WeeklySummaryData) {
  if (summary.prevWeekAvgFeedScore === null) return Minus;
  const change = summary.avgFeedScore - summary.prevWeekAvgFeedScore;
  if (Math.abs(change) < 2) return Minus;
  return change > 0 ? TrendingUp : TrendingDown;
}

function getScoreIconColor(summary: WeeklySummaryData, colors: Record<string, string | readonly string[]>): string {
  if (summary.prevWeekAvgFeedScore === null) return colors.textSecondary as string;
  const change = summary.avgFeedScore - summary.prevWeekAvgFeedScore;
  if (Math.abs(change) < 2) return colors.textSecondary as string;
  return change > 0 ? (colors.success as string) : (colors.error as string);
}

