/**
 * BroadcastResultsSummary — Post-analysis summary card.
 *
 * Shown on the analysis screen after Gemini processing completes.
 * Displays key findings (ad %, topic breakdown, political %, tone)
 * to give users an immediate sense of what was found before
 * navigating to the full dashboard.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  CheckCircle,
  ShoppingBag,
  BarChart3,
  Flag,
  Smile,
  ArrowRight,
  Radio,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS, ICON_SIZES, MIN_TOUCH_TARGET } from '../../lib/theme';
import type { UnifiedScanResult } from '../../types';

interface BroadcastResultsSummaryProps {
  result: UnifiedScanResult;
  onViewDashboard: () => void;
}

export const BroadcastResultsSummary = React.memo(function BroadcastResultsSummary({
  result,
  onViewDashboard,
}: BroadcastResultsSummaryProps) {
  const { colors } = useTheme();

  const totalItems = result.aggregates.total_feed_items;
  const adPct = result.aggregates.ad_percentage;
  const adCount = result.aggregates.total_ads;
  const politicalPct = result.aggregates.political_content_summary?.political_percentage || 0;
  const topTopics = (result.aggregates.topic_distribution || []).slice(0, 3);
  const duration = result.environment.broadcast_capture?.duration_seconds || 0;
  const framesUsed = result.environment.broadcast_capture?.frames_unique || 0;

  // Compute tone summary
  let posCount = 0;
  let negCount = 0;
  let neuCount = 0;
  result.feed_items.forEach((item) => {
    const v = item.emotions?.valence;
    if (v === 'POSITIVE') posCount++;
    else if (v === 'NEGATIVE') negCount++;
    else if (v === 'NEUTRAL') neuCount++;
  });
  const toneTotal = posCount + negCount + neuCount;
  const dominantTone =
    posCount >= negCount && posCount >= neuCount
      ? 'positive'
      : negCount >= posCount && negCount >= neuCount
        ? 'negative'
        : 'neutral';
  const dominantPct = toneTotal > 0
    ? Math.round(
        ((dominantTone === 'positive' ? posCount : dominantTone === 'negative' ? negCount : neuCount) /
          toneTotal) *
          100,
      )
    : 0;

  return (
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: colors.successBright,
        overflow: 'hidden',
      }}
    >
      {/* Success Header */}
      <View
        style={{
          backgroundColor: colors.successBgLight,
          padding: SPACING.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
        }}
      >
        <View
          style={{
            width: ICON_SIZES['2xl'],
            height: ICON_SIZES['2xl'],
            borderRadius: RADIUS.lg,
            backgroundColor: colors.successBgMedium,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CheckCircle size={22} color={colors.successBright} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...TYPOGRAPHY.h3, color: colors.textMain }}>
            Scan Complete
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textSecondary, marginTop: SPACING.xxs }}>
            {totalItems} feed items found from {framesUsed} frames
          </Text>
        </View>
      </View>

      {/* Key Findings */}
      <View style={{ padding: SPACING.lg }}>
        {/* Session info */}
        <View
          style={{
            flexDirection: 'row',
            gap: SPACING.md,
            marginBottom: SPACING.lg,
          }}
        >
          <MiniStat
            icon={<Radio size={14} color={colors.primaryBlue} strokeWidth={2} />}
            label="Broadcast"
            value={`${framesUsed} frames`}
            colors={colors}
          />
          <MiniStat
            icon={<Clock size={14} color={colors.primaryBlue} strokeWidth={2} />}
            label="Duration"
            value={formatDuration(duration)}
            colors={colors}
          />
        </View>

        {/* Findings grid */}
        <Text
          style={{
            ...TYPOGRAPHY.overline,
            color: colors.textMuted,
            marginBottom: SPACING.sm,
          }}
        >
          Key findings
        </Text>

        <View style={{ gap: SPACING.sm }}>
          {/* Ads */}
          <FindingRow
            icon={<ShoppingBag size={16} color={colors.iconAds} strokeWidth={2} />}
            label="Ads detected"
            value={`${adPct}% (${adCount} of ${totalItems})`}
            colors={colors}
          />

          {/* Top Topics */}
          {topTopics.length > 0 && (
            <FindingRow
              icon={<BarChart3 size={16} color={colors.primaryBlue} strokeWidth={2} />}
              label="Top topics"
              value={topTopics.map((t) => t.category).join(', ')}
              colors={colors}
            />
          )}

          {/* Political */}
          {politicalPct > 0 && (
            <FindingRow
              icon={<Flag size={16} color={colors.iconPolitics} strokeWidth={2} />}
              label="Political content"
              value={`${politicalPct}%`}
              colors={colors}
            />
          )}

          {/* Tone */}
          {toneTotal > 0 && (
            <FindingRow
              icon={<Smile size={16} color={colors.iconTone} strokeWidth={2} />}
              label="Dominant tone"
              value={`${dominantTone.charAt(0).toUpperCase() + dominantTone.slice(1)} (${dominantPct}%)`}
              colors={colors}
            />
          )}
        </View>

        {/* View Dashboard CTA */}
        <TouchableOpacity
          onPress={onViewDashboard}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="View full dashboard with detailed analysis"
          style={{
            backgroundColor: colors.primaryBlue,
            borderRadius: RADIUS.md,
            paddingVertical: SPACING.lg,
            marginTop: SPACING.lg,
            minHeight: MIN_TOUCH_TARGET,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: SPACING.sm,
          }}
        >
          <Text style={{ ...TYPOGRAPHY.buttonMd, color: colors.textInverse }}>
            View Full Dashboard
          </Text>
          <ArrowRight size={16} color={colors.textInverse} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

BroadcastResultsSummary.displayName = 'BroadcastResultsSummary';

// ============================================
// Sub-components
// ============================================

function MiniStat({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        backgroundColor: colors.bgPage,
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
      }}
    >
      {icon}
      <View>
        <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textMuted }}>{label}</Text>
        <Text style={{ ...TYPOGRAPHY.labelBold, color: colors.textMain }}>{value}</Text>
      </View>
    </View>
  );
}

function FindingRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.sm,
      }}
    >
      {icon}
      <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textSecondary, width: 120 }}>{label}</Text>
      <Text style={{ ...TYPOGRAPHY.bodySmall, fontWeight: '600', color: colors.textMain, flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

// ============================================
// Helpers
// ============================================

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}
