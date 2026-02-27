/**
 * AchievementBadges — Rewarding badge collection for the home screen.
 *
 * Shows earned achievement badges in a compact horizontal scroll.
 * Earned badges feel "alive" with category-tinted backgrounds and
 * medium shadows. Unearned badges are clearly locked with muted styling.
 *
 * Design: Small, refined badges. Earned badges have category color;
 * unearned are ghosted. No counts, no leaderboard, no social comparison.
 *
 * The newly earned badge gets a brief scale-up animation with hero glow.
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
import { SPACING, RADIUS, TYPOGRAPHY, ICON_SIZES } from '../../lib/theme';
import type { AchievementDefinition, EarnedAchievement } from '../../types/achievements';
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

/**
 * Maps badge categories to tourAccent color keys.
 * scanning  → tourOverview (blue)
 * streak    → tourAds (amber)
 * exploration → tourSources (indigo)
 * timing    → tourTone (teal)
 */
const CATEGORY_COLOR_KEY: Record<AchievementDefinition['category'], string> = {
  scanning: 'tourOverview',
  streak: 'tourAds',
  exploration: 'tourSources',
  timing: 'tourTone',
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
          gap: SPACING.md,
          paddingHorizontal: SPACING.sm,
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
              category={def.category}
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
  category,
  earned,
  isNew,
}: {
  iconName: string;
  title: string;
  category: AchievementDefinition['category'];
  earned: boolean;
  isNew: boolean;
}) {
  const { colors, shadows } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = React.useState(false);

  useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        const enabled = await AccessibilityInfo?.isReduceMotionEnabled?.() || false;
        setIsReducedMotionEnabled(enabled);
      } catch {
        setIsReducedMotionEnabled(false);
      }
    };
    checkReducedMotion();
  }, []);

  // Newly earned: single scale-up bounce (1.0 → 1.1 → 1.0 over 400ms)
  useEffect(() => {
    if (isNew && !isReducedMotionEnabled) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isNew, scaleAnim, isReducedMotionEnabled]);

  const IconComponent = ICON_MAP[iconName] || Sparkles;

  // Category-based accent color for earned badges
  const categoryColorKey = CATEGORY_COLOR_KEY[category] as keyof typeof colors;
  const accentColor = (colors[categoryColorKey] as string) || colors.primaryBlue;

  // Earned badge: tinted background at 20% opacity, accent border, medium shadow
  // Unearned badge: bgSecondary, no shadow, muted everything
  const iconColor = earned ? accentColor : colors.textTertiary;
  const bgColor = earned ? `${accentColor}1A` : colors.bgSecondary; // 1A = ~10% opacity hex suffix
  const borderColor = earned ? `${accentColor}33` : 'transparent'; // 33 = ~20% opacity hex suffix

  return (
    <Animated.View
      style={{
        opacity: earned ? 1 : 0.5,
        alignItems: 'center',
        width: ICON_SIZES['5xl'],
        transform: [{ scale: isNew ? scaleAnim : 1 }],
      }}
      accessibilityLabel={`${title}: ${earned ? 'earned' : 'not yet earned'}`}
    >
      <View
        style={{
          width: ICON_SIZES.touch,
          height: ICON_SIZES.touch,
          borderRadius: ICON_SIZES.touch / 2,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: SPACING.xs,
          borderWidth: 1.5,
          borderColor: borderColor,
          ...(isNew ? shadows.hero : earned ? shadows.md : {}),
        }}
      >
        <IconComponent size={26} color={iconColor} strokeWidth={1.8} />
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
