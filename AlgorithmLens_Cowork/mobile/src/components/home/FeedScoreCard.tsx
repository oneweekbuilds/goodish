/**
 * FeedScoreCard — Weekly feed health summary card.
 *
 * Shows a composite score (0–100) representing feed diversity and balance.
 * The score is computed from recent scans and gives the user a quick
 * sense of their feed health without needing to dive into the dashboard.
 *
 * Design: Subtle, informational card. The score uses a muted color scale
 * (not traffic-light red/yellow/green) to match the calm, non-judgmental tone.
 *
 * When there aren't enough scans for a meaningful score, shows an encouraging
 * empty state inviting the user to scan more.
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, Info } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, ICON_SIZES } from '../../lib/theme';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { Text, Skeleton } from '../glue';
import { ALScoreGauge } from '../charts';

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
import type { FeedScore } from '../../types/streak';

interface FeedScoreCardProps {
  /** FeedScore data, null if not enough scans, or undefined if still loading. */
  feedScore: FeedScore | null | undefined;
}

/**
 * useCountUp — Animates a number from 0 to target on first display only.
 * Returns the current displayed value as a string.
 */
function useCountUp(target: number, duration: number = 600): string {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);
  const animRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasAnimated.current || target <= 0) {
      setDisplayValue(target);
      return;
    }
    hasAnimated.current = true;

    const listenerId = animRef.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    Animated.timing(animRef, {
      toValue: target,
      duration,
      useNativeDriver: false, // Cannot use native driver for listener-based updates
    }).start();

    return () => {
      animRef.removeListener(listenerId);
    };
  }, [target, duration, animRef]);

  return String(displayValue);
}

function FeedScoreCardComponent({ feedScore }: FeedScoreCardProps) {
  const { colors, shadows } = useTheme();

  // H-02 FIX: While data is loading (undefined), show a skeleton loading card
  // instead of flashing the "Complete 2 scans" empty state.
  if (feedScore === undefined) {
    return (
      <GradientWrapper
        colors={[colors.bgCard, colors.bgCardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
        }}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading Feed Score"
      >
        {/* Header skeleton: icon placeholder + title placeholder */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
          <Skeleton width={ICON_SIZES.lg} height={ICON_SIZES.lg} borderRadius={RADIUS.lg} />
          <Skeleton width={80} height={14} borderRadius={RADIUS.xs} />
        </View>
        {/* Score skeleton */}
        <Skeleton width={64} height={32} borderRadius={RADIUS.sm} style={{ marginBottom: SPACING.sm }} />
        {/* Summary text skeleton */}
        <Skeleton width={120} height={12} borderRadius={RADIUS.xs} />
      </GradientWrapper>
    );
  }

  // Not enough data — tinted empty state with encouraging prompt
  if (!feedScore || feedScore.label === 'Not enough data') {
    return (
      <GradientWrapper
        colors={[colors.bgCard, colors.bgCardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
        }}
        accessible
        accessibilityRole="summary"
        accessibilityLabel="Feed Score: Complete 2 scans to see your Feed Score"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
          <View
            style={{
              width: ICON_SIZES.lg,
              height: ICON_SIZES.lg,
              borderRadius: RADIUS.lg,
              backgroundColor: colors.blue50,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <BarChart3 size={16} color={colors.primaryBlue} strokeWidth={1.8} />
          </View>
          <Text
            style={{
              ...GL_TYPOGRAPHY.labelBold,
              color: colors.textMain,
            }}
          >
            Feed Score
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.brandTintBg,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
          }}
        >
          <Text
            style={{
              ...GL_TYPOGRAPHY.bodySmall,
              color: colors.textSecondary,
            }}
          >
            Complete 2 scans to see your Feed Score.
          </Text>
        </View>
      </GradientWrapper>
    );
  }

  // Score-tinted gradient for visual emphasis
  const scoreTintBg = feedScore.score >= 70
    ? colors.green50
    : feedScore.score >= 50
      ? colors.blue50
      : colors.bgCard;

  return (
    <GradientWrapper
      colors={[scoreTintBg, colors.bgCardGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        // B-20 FIX: Extra bottom padding prevents ALScoreGauge from being clipped
        // by LinearGradient's borderRadius on iOS — the PieChart can render slightly
        // outside its declared radius*2 bounds during animation.
        paddingBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: colors.brandTintBorder,
        ...shadows.hero,
      }}
      accessibilityRole="summary"
      accessibilityLabel={`Feed score: ${feedScore.score} - ${feedScore.label}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
        <View
          style={{
            width: ICON_SIZES.lg,
            height: ICON_SIZES.lg,
            borderRadius: RADIUS.lg,
            backgroundColor: colors.blue50,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <BarChart3 size={16} color={colors.primaryBlue} strokeWidth={1.8} />
        </View>
        <Text
          style={{
            ...GL_TYPOGRAPHY.labelBold,
            color: colors.textMain,
            flex: 1,
          }}
        >
          Feed Score
        </Text>
        <Text
          style={{
            ...GL_TYPOGRAPHY.captionSmall,
            color: colors.textSecondary,
          }}
        >
          {feedScore.scans_this_week} scan{feedScore.scans_this_week !== 1 ? 's' : ''} this week
        </Text>
      </View>

      {/* Score gauge ring + label */}
      <View style={{ alignItems: 'center', marginVertical: SPACING.sm }}>
        <ALScoreGauge
          score={feedScore.score}
          label={feedScore.label}
          radius={60}
          strokeWidth={8}
          animated={true}
        />
      </View>

      {/* Summary */}
      <Text
        style={{
          ...GL_TYPOGRAPHY.caption,
          color: colors.textSecondary,
          marginTop: SPACING.sm,
        }}
      >
        {feedScore.summary}
      </Text>

      {/* Methodology note */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
          marginTop: SPACING.md,
          paddingTop: SPACING.sm,
          borderTopWidth: 1,
          borderTopColor: colors.borderSoft,
        }}
      >
        <Info size={10} color={colors.textSecondary} strokeWidth={2} />
        <Text
          style={{
            ...GL_TYPOGRAPHY.captionSmall,
            color: colors.textSecondary,
            fontStyle: 'italic',
          }}
        >
          Based on source diversity, ad density, and content balance across recent scans
        </Text>
      </View>
    </GradientWrapper>
  );
}

export const FeedScoreCard = React.memo(FeedScoreCardComponent);
