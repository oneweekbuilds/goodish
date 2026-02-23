/**
 * CalmHomeScreen — The heart of AlgorithmLens.
 *
 * Redesigned for clarity, delight, and daily engagement.
 * Users should know what this app does and what to do next
 * within 5 seconds of seeing this screen.
 *
 * Layout (top to bottom):
 * 1. Greeting with contextual subheading
 * 2. Streak badge (progressive flame, freeze indicator, at-risk)
 * 3. Feed Score card (or inviting prompt for new users)
 * 4. Feed Score Trend sparkline (7-day)
 * 5. Primary CTA: "Scan Your Feed" — big, beautiful, unmissable
 * 6. Weekly Summary card (when available)
 * 7. Achievement badges (earned collection)
 * 8. Smart scan suggestion (contextual)
 * 9. Recent scan preview (if they have history)
 * 10. Daily tip card (rotating insight)
 *
 * On CTA tap → PlatformBottomSheet slides up for platform selection.
 *
 * Design principles:
 * - Progressive disclosure (headline first, detail on demand)
 * - One clear action per screen
 * - Calm, sophisticated, never busy
 * - Generous white space
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Scan } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useStreak } from '../../hooks/useStreak';
import { useHabitFeatures } from '../../hooks/useHabitFeatures';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../lib/theme';
import { StreakBadge } from './StreakBadge';
import { FeedScoreCard } from './FeedScoreCard';
import { FeedScoreTrend } from './FeedScoreTrend';
import { MilestoneModal } from './MilestoneModal';
import { PlatformBottomSheet } from './PlatformBottomSheet';
import { RecentScanCard } from './RecentScanCard';
import { DailyTipCard } from './DailyTipCard';
import { WeeklySummaryCard } from './WeeklySummaryCard';
import { AchievementBadges } from './AchievementBadges';
import { SmartSuggestion } from './SmartSuggestion';
import type { ScanMode, SupportedPlatform } from '../../types/broadcast';
import type { FeedScore } from '../../types/streak';
import type { WeeklySummaryData, FeedScoreTrendPoint, TrendDirection, EarnedAchievement } from '../../types/achievements';
import type { ScanSuggestion } from '../../lib/achievements';

interface RecentScan {
  platform: string;
  created_at: string;
  post_count: number;
  ad_percentage: number;
}

interface CalmHomeScreenProps {
  /** Feed score data from recent scans, if available. */
  feedScore: FeedScore | null;
  /** Most recent scan for the preview card. */
  recentScan?: RecentScan | null;
  /** Callback when the user starts a scan. */
  onScanStart?: (platform: SupportedPlatform, mode: ScanMode) => void;
  /** Callback when the user taps the recent scan card. */
  onRecentScanPress?: () => void;
  /** Weekly summary data. */
  weeklySummary?: WeeklySummaryData | null;
  /** Feed score trend data. */
  scoreTrendPoints?: FeedScoreTrendPoint[];
  /** Score trend direction. */
  scoreTrendDirection?: TrendDirection;
  /** Score trend change percent. */
  scoreTrendChangePercent?: number;
  /** Earned achievements. */
  earnedAchievements?: EarnedAchievement[];
  /** Newly earned achievement ID for animation. */
  newlyEarnedId?: string | null;
  /** Smart scan suggestion. */
  suggestion?: ScanSuggestion | null;
  /** Whether streak freeze is available. */
  freezeAvailable?: boolean;
  /** Whether streak is at risk. */
  streakAtRisk?: boolean;
}

function CalmHomeScreenComponent({
  feedScore,
  recentScan,
  onScanStart,
  onRecentScanPress,
  weeklySummary,
  scoreTrendPoints = [],
  scoreTrendDirection = 'stable',
  scoreTrendChangePercent = 0,
  earnedAchievements = [],
  newlyEarnedId,
  suggestion,
  freezeAvailable = false,
  streakAtRisk = false,
}: CalmHomeScreenProps) {
  const { colors, shadows } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Extract first name — prefer metadata, fall back to cleaned email prefix
  const userName = React.useMemo(() => {
    if (!user) return undefined;
    const meta = user.user_metadata;
    if (meta?.full_name) return (String(meta.full_name ?? '').split(' ')[0]) || undefined;
    if (meta?.name) return (String(meta.name ?? '').split(' ')[0]) || undefined;
    if (user.email) {
      // Strip Gmail-style +alias suffixes (e.g., "user+app1@gmail.com" → "user")
      const localPart = user.email.split('@')[0];
      const cleaned = localPart.split('+')[0];
      // Only use if the cleaned name looks reasonable (not just numbers/symbols)
      if (cleaned && /[a-zA-Z]/.test(cleaned)) return cleaned;
    }
    return undefined;
  }, [user]);

  const {
    streakData,
    displayState,
    loading: streakLoading,
    greeting,
    pendingMilestone,
    dismissMilestone,
    refresh: refreshStreak,
  } = useStreak(userName);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshStreak();
    } catch {
      // Silently fail — streak data is not critical
    } finally {
      setRefreshing(false);
    }
  }, [refreshStreak]);

  const handleCtaPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetVisible(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handleScanStart = useCallback(
    (platform: SupportedPlatform, mode: ScanMode) => {
      setSheetVisible(false);
      onScanStart?.(platform, mode);
    },
    [onScanStart]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      {/* Milestone celebration modal */}
      {pendingMilestone && (
        <MilestoneModal
          milestone={pendingMilestone}
          onDismiss={() => dismissMilestone(pendingMilestone.days)}
        />
      )}

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: SPACING.xl,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING['5xl'],
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View style={{ marginBottom: SPACING['2xl'] }}>
          <Text
            style={{
              ...TYPOGRAPHY.heroTitle,
              color: colors.textMain,
              marginBottom: SPACING.xs,
            }}
            accessibilityRole="header"
          >
            {greeting}
          </Text>
          <Text
            style={{
              ...TYPOGRAPHY.body,
              color: colors.textMuted,
            }}
          >
            {getSubheading(displayState, streakData.total_scans)}
          </Text>
        </View>

        {/* ── Streak Badge (enhanced) ── */}
        {!streakLoading && (
          <View style={{ marginBottom: SPACING.xl }}>
            <StreakBadge
              streakData={streakData}
              displayState={displayState}
              freezeAvailable={freezeAvailable}
              atRisk={streakAtRisk}
            />
          </View>
        )}

        {/* ── Feed Score Card ── */}
        <View style={{ marginBottom: SPACING.xl }}>
          <FeedScoreCard feedScore={feedScore} />
        </View>

        {/* ── Feed Score Trend (sparkline) ── */}
        {scoreTrendPoints.length >= 2 && (
          <View style={{ marginBottom: SPACING.xl }}>
            <FeedScoreTrend
              points={scoreTrendPoints}
              direction={scoreTrendDirection}
              changePercent={scoreTrendChangePercent}
            />
          </View>
        )}

        {/* ── Primary CTA: Scan Your Feed ── */}
        <TouchableOpacity
          onPress={handleCtaPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Scan your feed"
          accessibilityHint="Opens platform selection to start a new scan"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            backgroundColor: colors.primary,
            borderRadius: RADIUS.xl,
            paddingVertical: SPACING.xl,
            paddingHorizontal: SPACING['2xl'],
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: SPACING.md,
            marginBottom: SPACING['3xl'],
            minHeight: 60,
            ...shadows.hero,
          }}
        >
          <Scan size={22} color={colors.textInverse} strokeWidth={2} />
          <Text
            style={{
              ...TYPOGRAPHY.buttonLg,
              color: colors.textInverse,
              fontSize: TYPOGRAPHY.h2.fontSize,
            }}
          >
            Scan Your Feed
          </Text>
        </TouchableOpacity>

        {/* ── Weekly Summary ── */}
        {weeklySummary && weeklySummary.scanCount > 0 && (
          <View style={{ marginBottom: SPACING.xl }}>
            <WeeklySummaryCard summary={weeklySummary} />
          </View>
        )}

        {/* ── Achievement Badges (shows teaser even with 0 earned) ── */}
        {streakData.total_scans > 0 && (
          <View style={{ marginBottom: SPACING.xl }}>
            <AchievementBadges
              earnedAchievements={earnedAchievements}
              newlyEarnedId={newlyEarnedId}
            />
          </View>
        )}

        {/* ── Smart Suggestion ── */}
        {suggestion && (
          <View style={{ marginBottom: SPACING.xl }}>
            <SmartSuggestion
              suggestion={suggestion}
              onAction={handleCtaPress}
            />
          </View>
        )}

        {/* ── Recent Scan Preview ── */}
        {recentScan && (
          <View style={{ marginBottom: SPACING.xl }}>
            <RecentScanCard
              scan={recentScan}
              onPress={onRecentScanPress}
            />
          </View>
        )}

        {/* ── Daily Tip ── */}
        <View style={{ marginBottom: SPACING.lg }}>
          <DailyTipCard />
        </View>
      </ScrollView>

      {/* Platform selection bottom sheet */}
      <PlatformBottomSheet
        visible={sheetVisible}
        onClose={handleSheetClose}
        onScanStart={handleScanStart}
      />
    </SafeAreaView>
  );
}

export const CalmHomeScreen = React.memo(CalmHomeScreenComponent);

/**
 * Contextual subheading based on streak state.
 * Epistemically restrained — describes, never accuses.
 */
function getSubheading(displayState: string, totalScans: number): string {
  switch (displayState) {
    case 'NEW':
      return 'See what appears in your social media feed';
    case 'ACTIVE':
      return totalScans > 5
        ? 'Your feed awareness is growing'
        : 'Keep scanning to build your picture';
    case 'GRACE':
      return 'Scan today to keep your streak';
    case 'PAUSED':
      return 'Welcome back — ready for a fresh scan?';
    default:
      return 'See what appears in your social media feed';
  }
}
