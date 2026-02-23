/**
 * AchievementBadges — Subtle badge collection for the home screen.
 *
 * Shows earned achievement badges in a compact horizontal scroll.
 * Unearned badges are shown as muted placeholders to create a
 * sense of progression without pressure.
 *
 * Design: Small, refined badges. Earned badges have color;
 * unearned are ghosted. No counts, no leaderboard, no social comparison.
 *
 * The newly earned badge gets a brief glow animation.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated, AccessibilityInfo } from 'react-native';
import {
  Sparkles,
  Layers,
  Flame,
  Shield,
  Search,
  TrendingUp,
  Moon,
  Sunrise,
  Award,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../lib/theme';
import type { EarnedAchievement } from '../../types/achievements';
import { ACHIEVEMENT_DEFINITIONS } from '../../types/achievements';

interface AchievementBadgesProps {
  earnedAchievements: EarnedAchievement[];
  /** ID of a newly earned achievement to animate. */
  newlyEarnedId?: string | null;
}

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth: number }>> = {
  sparkles: Sparkles,
  layers: Layers,
  flame: Flame,
  shield: Shield,
  search: Search,
  'trending-up': TrendingUp,
  moon: Moon,
  sunrise: Sunrise,
};

function AchievementBadgesComponent({ earnedAchievements, newlyEarnedId }: AchievementBadgesProps) {
  const { colors } = useTheme();
  const earnedIds = new Set(earnedAchievements.map((a) => a.id));

  // Show a teaser with first 4 ghosted badges when nothing earned yet
  const showTeaser = earnedAchievements.length === 0;
  const visibleDefs = showTeaser
    ? ACHIEVEMENT_DEFINITIONS.slice(0, 4)
    : ACHIEVEMENT_DEFINITIONS;

  return (
    <View
      accessibilityRole="list"
      accessible={true}
    >
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          marginBottom: SPACING.md,
        }}
      >
        <Award size={14} color={colors.primaryBlue} strokeWidth={2} />
        <Text
          style={{
            ...TYPOGRAPHY.overline,
            color: colors.textTertiary,
          }}
        >
          {showTeaser ? 'Badges to earn' : 'Achievements'}
        </Text>
        {!showTeaser && (
          <Text
            style={{
              ...TYPOGRAPHY.captionSmall,
              color: colors.textTertiary,
            }}
          >
            {earnedAchievements.length}/{ACHIEVEMENT_DEFINITIONS.length}
          </Text>
        )}
      </View>

      {/* Badge scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: SPACING.sm,
          paddingRight: SPACING.lg,
        }}
      >
        {visibleDefs.map((def) => {
          const isEarned = earnedIds.has(def.id);
          const isNew = def.id === newlyEarnedId;

          return (
            <BadgeItem
              key={def.id}
              iconName={def.icon}
              title={def.title}
              earned={isEarned}
              isNew={isNew}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export const AchievementBadges = React.memo(AchievementBadgesComponent);

// ─── Individual Badge ───────────────────────────────────

function BadgeItem({
  iconName,
  title,
  earned,
  isNew,
}: {
  iconName: string;
  title: string;
  earned: boolean;
  isNew: boolean;
}) {
  const { colors, shadows } = useTheme();
  const glowAnim = useRef(new Animated.Value(isNew ? 0.3 : 1)).current;
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = React.useState(false);

  useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        const enabled = await AccessibilityInfo?.isScreenReaderEnabled?.() || false;
        setIsReducedMotionEnabled(enabled);
      } catch {
        setIsReducedMotionEnabled(false);
      }
    };
    checkReducedMotion();
  }, []);

  useEffect(() => {
    if (isNew && !isReducedMotionEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start(() => {
        glowAnim.setValue(1);
      });
    }
  }, [isNew, glowAnim, isReducedMotionEnabled]);

  const IconComponent = ICON_MAP[iconName] || Sparkles;
  const iconColor = earned ? colors.primaryBlue : colors.textTertiary;
  const bgColor = earned ? colors.blue50 : colors.bgSecondary;

  return (
    <Animated.View
      style={{
        opacity: earned ? glowAnim : 0.4,
        alignItems: 'center',
        width: 64,
      }}
      accessibilityLabel={`${title}: ${earned ? 'earned' : 'not yet earned'}`}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: SPACING.xs,
          ...(earned ? shadows.soft : {}),
          borderWidth: isNew ? 2 : 0,
          borderColor: isNew ? colors.primaryBlue : 'transparent',
        }}
      >
        <IconComponent size={18} color={iconColor} strokeWidth={1.8} />
      </View>
      <Text
        style={{
          ...TYPOGRAPHY.captionSmall,
          color: earned ? colors.textSecondary : colors.textTertiary,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {title}
      </Text>
    </Animated.View>
  );
}
