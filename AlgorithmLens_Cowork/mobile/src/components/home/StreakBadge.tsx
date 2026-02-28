/**
 * StreakBadge — Visual streak counter with progressive flame and freeze indicator.
 *
 * Design: The flame grows and intensifies as the streak lengthens.
 * - Days 1–2: Small, default orange flame ("Spark")
 * - Days 3–6: Slightly larger, warmer tone ("Glow")
 * - Days 7–13: Larger, vivid orange ("Flame")
 * - Days 14–29: Large, deep orange-red ("Fire")
 * - Days 30+: Full-size, blazing ("Blaze")
 *
 * Also shows:
 * - Streak freeze availability (small snowflake badge)
 * - At-risk indicator when it's evening and user hasn't scanned
 *
 * Reference: Duolingo's progressive streak flame — but calmer, more Oura-like.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Pause, Sparkles, Snowflake, Clock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, ICON_SIZES } from '../../lib/theme';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { Text } from '../glue';

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
import type { StreakData, StreakDisplayState } from '../../types/streak';
import { getStreakVisualTier } from '../../types/streak';

interface StreakBadgeProps {
  streakData: StreakData;
  displayState: StreakDisplayState;
  /** Whether a streak freeze is available this week. */
  freezeAvailable?: boolean;
  /** Whether the streak is at risk (evening + no scan today). */
  atRisk?: boolean;
}

function StreakBadgeComponent({
  streakData,
  displayState,
  freezeAvailable = false,
  atRisk = false,
}: StreakBadgeProps) {
  const { colors, shadows } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = React.useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const checkReducedMotion = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled?.() || false;
      setIsReducedMotionEnabled(enabled);
    };
    checkReducedMotion();
  }, []);

  // Gentle pulse when at risk (respects reduced motion)
  useEffect(() => {
    if (atRisk && !isReducedMotionEnabled) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [atRisk, pulseAnim, isReducedMotionEnabled]);

  if (displayState === 'NEW') {
    return (
      <GradientWrapper
        colors={[colors.bgCard, colors.bgCardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          borderRadius: RADIUS.lg,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.card,
        }}
      >
        <View
          style={{
            width: ICON_SIZES.xl,
            height: ICON_SIZES.xl,
            borderRadius: RADIUS.lg,
            backgroundColor: colors.streakOrangeBg,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* H-3 FIX: Use Flame icon instead of Sparkles — more recognizable for streaks */}
          <Flame size={20} color={colors.streakOrange} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...GL_TYPOGRAPHY.labelBold,
              color: colors.textMain,
            }}
          >
            Start your streak
          </Text>
          <Text
            style={{
              ...GL_TYPOGRAPHY.caption,
              color: colors.textSecondary,
              marginTop: SPACING.xxs,
            }}
          >
            Scan once to begin tracking your feed awareness
          </Text>
        </View>
      </GradientWrapper>
    );
  }

  if (displayState === 'PAUSED') {
    return (
      <GradientWrapper
        colors={[colors.bgSecondary, colors.bgCardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          borderRadius: RADIUS.lg,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          ...shadows.sm,
        }}
      >
        <View
          style={{
            width: ICON_SIZES.xl,
            height: ICON_SIZES.xl,
            borderRadius: RADIUS.lg,
            backgroundColor: colors.blue50,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Pause size={20} color={colors.primaryBlue} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...GL_TYPOGRAPHY.labelBold,
              color: colors.textMain,
            }}
          >
            Streak paused
          </Text>
          <Text
            style={{
              ...GL_TYPOGRAPHY.caption,
              color: colors.textSecondary,
              marginTop: SPACING.xxs,
            }}
          >
            {streakData.longest_streak > 0
              ? `Your best: ${streakData.longest_streak} days. Scan today to start a new one.`
              : 'Scan today to start a new streak.'}
          </Text>
        </View>
      </GradientWrapper>
    );
  }

  // ACTIVE or GRACE state — progressive flame
  const isGrace = displayState === 'GRACE';
  const tier = getStreakVisualTier(streakData.current_streak);

  const getFlameColor = (): string => {
    if (isGrace) return colors.warning;
    switch (tier.flameColor) {
      case 'warm': return colors.streakOrange;
      case 'hot': return colors.streakDeepOrange;
      case 'blazing': return colors.streakBlaze;
      default: return colors.streakOrange;
    }
  };

  const getBackgroundColor = (): string => {
    if (isGrace) return colors.lowSampleBg;
    switch (tier.flameColor) {
      case 'warm': return colors.streakOrangeBg;
      case 'hot': return colors.streakDeepOrangeBg;
      case 'blazing': return colors.streakBlazeBg;
      default: return colors.streakOrangeBg;
    }
  };

  const flameColor = getFlameColor();
  const flameBgColor = getBackgroundColor();
  const iconSize = Math.round(18 * tier.iconScale);
  const containerSize = Math.round(32 * Math.min(tier.iconScale, 1.3));

  return (
    <Animated.View
      style={Platform.OS === 'web'
        ? {
            transform: `scale(${pulseAnim.__getValue ? pulseAnim.__getValue() : 1})`,
          }
        : {
            transform: [{ scale: pulseAnim }],
          }
      }
    >
      <GradientWrapper
        colors={[colors.bgCard, colors.bgCardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          borderRadius: RADIUS.lg,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderWidth: 1,
          borderColor: atRisk ? colors.warningBorder : isGrace ? colors.lowSampleBorder : colors.brandTintBorder,
          ...shadows.lg,
        }}
      >
        {/* Progressive flame icon */}
        <View
          style={{
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: flameBgColor,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Flame size={iconSize} color={flameColor} strokeWidth={2} />
        </View>

        {/* Streak count and context */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs }}>
            <Text
              style={{
                ...(streakData.current_streak >= 7 ? GL_TYPOGRAPHY.scoreLarge : GL_TYPOGRAPHY.scoreSmall),
                color: colors.textMain,
              }}
            >
              {streakData.current_streak}
            </Text>
            <Text
              style={{
                ...GL_TYPOGRAPHY.label,
                color: colors.textMuted,
              }}
            >
              {streakData.current_streak === 1 ? 'day' : 'days'}
            </Text>
            {tier.minDays >= 3 && (
              <Text
                style={{
                  ...GL_TYPOGRAPHY.captionSmall,
                  color: colors.textTertiary,
                }}
              >
                {tier.label}
              </Text>
            )}
          </View>
          {isGrace && (
            <Text
              style={{
                ...GL_TYPOGRAPHY.captionSmall,
                color: colors.warning,
                marginTop: SPACING.xxs,
              }}
            >
              Scan today to keep your streak going
            </Text>
          )}
          {atRisk && !isGrace && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xxs }}>
              <Clock size={10} color={colors.warning} strokeWidth={2} />
              <Text
                style={{
                  ...GL_TYPOGRAPHY.captionSmall,
                  color: colors.warning,
                }}
              >
                Scan before midnight to keep your streak
              </Text>
            </View>
          )}
        </View>

        {/* Freeze indicator */}
        {freezeAvailable && (
          <View
            style={{
              width: ICON_SIZES.md,
              height: ICON_SIZES.md,
              borderRadius: RADIUS.lg,
              backgroundColor: colors.blue50,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            accessibilityLabel={`Scan streak: ${streakData.current_streak} days`}
            accessible
          >
            <Snowflake size={14} color={colors.primaryBlue} strokeWidth={1.8} />
          </View>
        )}
      </GradientWrapper>
    </Animated.View>
  );
}

export const StreakBadge = React.memo(StreakBadgeComponent);
