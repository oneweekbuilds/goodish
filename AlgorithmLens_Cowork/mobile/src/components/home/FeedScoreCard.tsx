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
import { View, Text, Animated } from 'react-native';
import { BarChart3, Info } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../lib/theme';
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

  // H-02 FIX: While data is loading (undefined), show a neutral loading card
  // instead of flashing the "Complete 2 scans" empty state.
  if (feedScore === undefined) {
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: RADIUS.lg,
              backgroundColor: colors.blue50,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <BarChart3 size={14} color={colors.primaryBlue} strokeWidth={2} />
          </View>
          <Text
            style={{
              ...TYPOGRAPHY.labelBold,
              color: colors.textMain,
            }}
          >
            Feed Score
          </Text>
        </View>
        <Text
          style={{
            ...TYPOGRAPHY.caption,
            color: colors.textSecondary,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  // Not enough data state
  if (!feedScore || feedScore.label === 'Not enough data') {
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: RADIUS.lg,
              backgroundColor: colors.blue50,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <BarChart3 size={14} color={colors.primaryBlue} strokeWidth={2} />
          </View>
          <Text
            style={{
              ...TYPOGRAPHY.labelBold,
              color: colors.textMain,
            }}
          >
            Feed Score
          </Text>
        </View>
        <Text
          style={{
            ...TYPOGRAPHY.caption,
            color: colors.textSecondary,
          }}
        >
          {/* H-4 FIX: Shortened empty state text */}
          {'Complete 2 scans to see your Feed Score.'}
        </Text>
      </View>
    );
  }

  // Score color — muted scale, never alarming
  const getScoreColor = (score: number): string => {
    if (score >= 50) return colors.primaryBlue;
    return colors.textMuted;
  };

  const scoreColor = getScoreColor(feedScore.score);
  const animatedScore = useCountUp(feedScore.score);

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
      accessibilityRole="summary"
      accessibilityLabel={`Feed score: ${feedScore.score} - ${feedScore.label}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: RADIUS.lg,
            backgroundColor: colors.blue50,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <BarChart3 size={14} color={colors.primaryBlue} strokeWidth={2} />
        </View>
        <Text
          style={{
            ...TYPOGRAPHY.labelBold,
            color: colors.textMain,
            flex: 1,
          }}
        >
          Feed Score
        </Text>
        <Text
          style={{
            fontSize: TYPOGRAPHY.captionSmall.fontSize,
            color: colors.textSecondary,
          }}
        >
          {feedScore.scans_this_week} scan{feedScore.scans_this_week !== 1 ? 's' : ''} this week
        </Text>
      </View>

      {/* Score display */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm }}>
        <Text
          style={{
            ...TYPOGRAPHY.scoreLarge,
            color: scoreColor,
          }}
        >
          {animatedScore}
        </Text>
        <Text
          style={{
            ...TYPOGRAPHY.label,
            color: colors.textMuted,
          }}
        >
          {feedScore.label}
        </Text>
      </View>

      {/* Summary */}
      <Text
        style={{
          ...TYPOGRAPHY.caption,
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
            fontSize: TYPOGRAPHY.captionSmall.fontSize,
            color: colors.textSecondary,
            fontStyle: 'italic',
          }}
        >
          Based on source diversity, ad density, and content balance across recent scans
        </Text>
      </View>
    </View>
  );
}

export const FeedScoreCard = React.memo(FeedScoreCardComponent);
