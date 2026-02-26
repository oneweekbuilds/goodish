/**
 * ComparisonView — Side-by-side delta comparison between two scans.
 *
 * Shows key metrics (total posts, ad %, source diversity, suggested vs.
 * followed ratio) with up/down arrows and percentage change.
 *
 * Follows epistemic restraint rules:
 * - Uses observational language: "Your feed showed…" not "The algorithm pushed…"
 * - Includes methodology note about scan variability
 * - Describes composition differences, never infers intent
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ArrowUp, ArrowDown, Minus, Info, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../lib/theme';
import { computeDashboardData, type ScanRecord, type DashboardData } from '../../lib/computeDashboardData';
import { getPlatformDisplayName } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────

interface ComparisonMetric {
  label: string;
  olderValue: number;
  newerValue: number;
  unit: string; // '%', ' posts', etc.
  /** Number of decimal places for display. */
  decimals?: number;
}

interface ComparisonViewProps {
  olderScan: ScanRecord;
  newerScan: ScanRecord;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────

function computeSourceDiversityScore(data: DashboardData): number {
  // Source diversity = inverse of top-5 concentration
  // Score 0–100: 100 = perfectly diverse, 0 = one source dominates
  return Math.max(0, 100 - data.top5Pct);
}

function formatDelta(delta: number, unit: string, decimals = 0): string {
  const sign = delta > 0 ? '+' : '';
  const formatted = decimals > 0 ? delta.toFixed(decimals) : Math.round(delta).toString();
  return `${sign}${formatted}${unit}`;
}

function formatValue(value: number, unit: string, decimals = 0): string {
  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return `${formatted}${unit}`;
}

// ─── Delta Row ────────────────────────────────────────────

function DeltaRow({
  metric,
  colors,
}: {
  metric: ComparisonMetric;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const delta = metric.newerValue - metric.olderValue;
  const absDelta = Math.abs(delta);
  const decimals = metric.decimals ?? 0;
  const threshold = decimals > 0 ? 0.05 : 0.5;

  const isUp = delta > threshold;
  const isDown = delta < -threshold;
  const isFlat = !isUp && !isDown;

  // Percentage change (avoid division by zero)
  const pctChange = metric.olderValue !== 0
    ? Math.round(Math.abs(delta / metric.olderValue) * 100)
    : delta !== 0 ? 100 : 0;

  // CT-004 FIX: Use same neutral color for both up and down —
  // differentiate by arrow direction only, not color, to stay purely informational.
  const deltaColor = isFlat
    ? colors.textSecondary
    : colors.primaryBlue;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      {/* Label */}
      <View style={{ flex: 1 }}>
        <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain }}>
          {metric.label}
        </Text>
        <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: 4 }}>
          <Text style={{ ...TYPOGRAPHY.small, color: colors.textSecondary }}>
            {formatValue(metric.olderValue, metric.unit, decimals)}
          </Text>
          <Text style={{ ...TYPOGRAPHY.small, color: colors.textMuted }}>→</Text>
          <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain }}>
            {formatValue(metric.newerValue, metric.unit, decimals)}
          </Text>
        </View>
      </View>

      {/* Delta indicator */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: isFlat
            ? colors.borderLight
            : colors.blue50,
          paddingHorizontal: SPACING.md,
          paddingVertical: 6,
          borderRadius: RADIUS.sm,
        }}
      >
        {isUp && <ArrowUp size={14} color={deltaColor} strokeWidth={2.5} />}
        {isDown && <ArrowDown size={14} color={deltaColor} strokeWidth={2.5} />}
        {isFlat && <Minus size={14} color={deltaColor} strokeWidth={2.5} />}
        <Text
          style={{
            ...TYPOGRAPHY.labelBold,
            color: deltaColor,
          }}
        >
          {isFlat
            ? 'No change'
            : `${formatDelta(delta, metric.unit, decimals)}${pctChange > 0 ? ` (${pctChange}%)` : ''}`}
        </Text>
      </View>
    </View>
  );
}

// ─── Summary Narrative ────────────────────────────────────

function buildSummaryNarrative(
  metrics: ComparisonMetric[],
): string {
  const changes: string[] = [];

  for (const m of metrics) {
    const delta = m.newerValue - m.olderValue;
    const threshold = (m.decimals ?? 0) > 0 ? 0.05 : 0.5;
    if (Math.abs(delta) <= threshold) continue;

    const direction = delta > 0 ? 'more' : 'fewer';
    const absDelta = Math.abs(Math.round(delta));

    if (m.label === 'Total Posts') {
      changes.push(`Your newer scan captured ${absDelta} ${direction} posts`);
    } else if (m.label === 'Ad Percentage') {
      changes.push(
        delta > 0
          ? `Your feed showed ${absDelta}% more ad content`
          : `Your feed showed ${absDelta}% less ad content`
      );
    } else if (m.label === 'Suggested Content') {
      changes.push(
        delta > 0
          ? `Suggested content increased by ${absDelta}%`
          : `Suggested content decreased by ${absDelta}%`
      );
    } else if (m.label === 'Source Diversity') {
      changes.push(
        delta > 0
          ? `Source diversity improved by ${absDelta} points`
          : `Source diversity decreased by ${absDelta} points`
      );
    }
  }

  if (changes.length === 0) {
    return 'Your feed composition appeared similar across both scans.';
  }

  return changes.join('. ') + '.';
}

// ─── Main Component ───────────────────────────────────────

function ComparisonViewComponent({
  olderScan,
  newerScan,
  onClose,
}: ComparisonViewProps) {
  const { colors, shadows } = useTheme();

  const olderData = computeDashboardData(olderScan);
  const newerData = computeDashboardData(newerScan);

  const formatScanDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const olderDate = formatScanDate(olderScan.created_at) || 'Older scan';
  const newerDate = formatScanDate(newerScan.created_at) || 'Newer scan';

  const platformStr = newerScan.platform || olderScan.platform || '';
  const platform = getPlatformDisplayName(platformStr);

  // ── Build comparison metrics ──
  const metrics: ComparisonMetric[] = [
    {
      label: 'Total Posts',
      olderValue: olderData.totalPosts,
      newerValue: newerData.totalPosts,
      unit: ' posts',
    },
    {
      label: 'Ad Percentage',
      olderValue: olderData.adPct,
      newerValue: newerData.adPct,
      unit: '%',
    },
    {
      label: 'Source Diversity',
      olderValue: computeSourceDiversityScore(olderData),
      newerValue: computeSourceDiversityScore(newerData),
      unit: ' pts',
    },
    {
      label: 'Suggested Content',
      olderValue: olderData.suggestedPct,
      newerValue: newerData.suggestedPct,
      unit: '%',
    },
    {
      label: 'Followed Content',
      olderValue: olderData.followedPct,
      newerValue: newerData.followedPct,
      unit: '%',
    },
  ];

  // Add political comparison if both scans have data
  if (olderData.politicalAnalysis && newerData.politicalAnalysis) {
    metrics.push({
      label: 'Political Content',
      olderValue: olderData.politicalAnalysis.politicalPct,
      newerValue: newerData.politicalAnalysis.politicalPct,
      unit: '%',
    });
  }

  // Add tone comparison if both scans have data
  if (olderData.toneAnalysis && newerData.toneAnalysis) {
    metrics.push(
      {
        label: 'Positive Tone',
        olderValue: olderData.toneAnalysis.positivePct,
        newerValue: newerData.toneAnalysis.positivePct,
        unit: '%',
      },
      {
        label: 'Negative Tone',
        olderValue: olderData.toneAnalysis.negativePct,
        newerValue: newerData.toneAnalysis.negativePct,
        unit: '%',
      },
    );
  }

  const summaryNarrative = buildSummaryNarrative(metrics);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING['4xl'] }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: SPACING.xl,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{ ...TYPOGRAPHY.heroTitle, fontSize: 22, color: colors.textMain }}
            accessibilityRole="header"
          >
            Scan Comparison
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textSecondary, marginTop: 4 }}>
            {platform}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          accessibilityLabel="Close comparison"
          accessibilityRole="button"
          style={{
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: RADIUS.sm,
            backgroundColor: colors.cancelButtonBg,
          }}
        >
          <X size={18} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Date labels */}
      <View
        style={{
          flexDirection: 'row',
          gap: SPACING.md,
          marginBottom: SPACING.xl,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <Text style={{ ...TYPOGRAPHY.small, color: colors.textSecondary }}>
            Older Scan
          </Text>
          <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain, marginTop: 2 }}>
            {olderDate}
          </Text>
          <Text style={{ ...TYPOGRAPHY.small, color: colors.textMuted, marginTop: 2 }}>
            {olderData.totalPosts} posts
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.brandTintBorder,
          }}
        >
          <Text style={{ ...TYPOGRAPHY.small, color: colors.primaryBlue }}>
            Newer Scan
          </Text>
          <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain, marginTop: 2 }}>
            {newerDate}
          </Text>
          <Text style={{ ...TYPOGRAPHY.small, color: colors.textMuted, marginTop: 2 }}>
            {newerData.totalPosts} posts
          </Text>
        </View>
      </View>

      {/* Summary narrative */}
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          marginBottom: SPACING.xl,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...shadows.card,
        }}
      >
        <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain, marginBottom: SPACING.sm }}>
          Summary
        </Text>
        <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted }}>
          {summaryNarrative}
        </Text>
      </View>

      {/* Metric comparisons */}
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...shadows.card,
          marginBottom: SPACING.xl,
        }}
      >
        <Text style={{ ...TYPOGRAPHY.label, color: colors.textMain, marginBottom: SPACING.sm }}>
          Detailed Metrics
        </Text>
        {metrics.map((metric, index) => (
          <DeltaRow
            key={metric.label}
            metric={metric}
            colors={colors}
          />
        ))}
      </View>

      {/* Methodology note */}
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          flexDirection: 'row',
          gap: SPACING.md,
        }}
      >
        <Info size={16} color={colors.textSecondary} strokeWidth={1.5} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...TYPOGRAPHY.label, color: colors.textSecondary, marginBottom: 4 }}>
            About these comparisons
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted }}>
            Comparisons reflect differences in what appeared during each scan session. Variations can result from different scroll depth, time of day, or platform changes.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default React.memo(ComparisonViewComponent);
