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

import { triggerImpactMedium } from '../../lib/haptics';
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Scan } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useStreak } from '../../hooks/useStreak';
import { useHabitFeatures } from '../../hooks/useHabitFeatures';
import { SPACING, RADIUS } from '../../lib/theme';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { Text } from '../../components/glue';
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
import { StaggeredList } from '../glue';
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
  /** Feed score data from recent scans. null = not enough data, undefined = still loading. */
  feedScore: FeedScore | null | undefined;
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
  /** Actual scan count from database (Supabase), for correcting stale local streak state. */
  dbScanCount?: number;
  /** Callback to refresh dashboard data (scans from Supabase). */
  onRefreshDashboard?: () => Promise<void>;
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
  dbScanCount = 0,
  onRefreshDashboard,
}: CalmHomeScreenProps) {
  const { colors, shadows } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  // H-01 FIX: Extract display name from auth profile.
  // Priority: display_name → full_name → name → omit entirely.
  // NEVER parse the email address to extract a "name" — email handles
  // like "jwjwin0" are not names and look broken in the greeting.
  const userName = React.useMemo(() => {
    if (!user) return undefined;
    const meta = user.user_metadata;

    // Try explicit display name fields first
    const displayName = meta?.display_name ?? meta?.full_name ?? meta?.name;
    if (displayName) {
      const firstName = String(displayName).trim().split(/\s+/)[0];
      if (firstName) return firstName;
    }

    // No usable name — greeting will just say "Good morning" / "Good evening" (no name)
    return undefined;
  }, [user]);

  const {
    streakData,
    displayState: rawDisplayState,
    loading: streakLoading,
    greeting,
    pendingMilestone,
    dismissMilestone,
    refresh: refreshStreak,
  } = useStreak(userName);

  // H-03 FIX: Override display state when local streak data is stale.
  // If the database has scans but AsyncStorage thinks total_scans is 0,
  // show PAUSED (not NEW) so the user doesn't see "Start your streak" when
  // they already have scan history.
  const displayState = React.useMemo(() => {
    if (rawDisplayState === 'NEW' && dbScanCount > 0) {
      return 'PAUSED' as const;
    }
    return rawDisplayState;
  }, [rawDisplayState, dbScanCount]);

  // H-09 FIX: Lock the subtitle to the first non-loading value within a session.
  // This prevents the subtitle from flickering between states (e.g., "Welcome back"
  // → "See what's in your feed" → "Your feed awareness is growing") as data loads.
  const lockedSubheadingRef = useRef<string | null>(null);
  const subheading = React.useMemo(() => {
    // Only lock once streak has loaded (not in loading state)
    if (!streakLoading && lockedSubheadingRef.current === null) {
      lockedSubheadingRef.current = getSubheading(displayState, streakData.total_scans, dbScanCount);
    }
    return lockedSubheadingRef.current ?? getSubheading(displayState, streakData.total_scans, dbScanCount);
  }, [streakLoading, displayState, streakData.total_scans, dbScanCount]);

  // M-19 FIX: Pull-to-refresh now refreshes both streak AND dashboard data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshStreak(),
        onRefreshDashboard?.(),
      ]);
    } catch {
      // Silently fail — data refresh is not critical
    } finally {
      setRefreshing(false);
    }
  }, [refreshStreak, onRefreshDashboard]);

  const ctaScale = useRef(new Animated.Value(1)).current;

  const handleCtaPress = useCallback(() => {
    triggerImpactMedium();
    setSheetVisible(true);
  }, []);

  const handleCtaPressIn = useCallback(() => {
    Animated.timing(ctaScale, { toValue: 0.97, duration: 80, useNativeDriver: true }).start();
  }, [ctaScale]);

  const handleCtaPressOut = useCallback(() => {
    Animated.timing(ctaScale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, [ctaScale]);

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
          paddingTop: SPACING['2xl'],
          paddingBottom: SPACING['6xl'],
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
        <View style={{ marginBottom: SPACING['2xl'] }} accessibilityLiveRegion="polite">
          <Text
            style={{
              ...GL_TYPOGRAPHY.heroTitle,
              color: colors.textMain,
              marginBottom: SPACING.xs,
            }}
            accessibilityRole="header"
          >
            {greeting}
          </Text>
          <Text
            style={{
              ...GL_TYPOGRAPHY.body,
              color: colors.textSecondary,
              marginBottom: SPACING.xl,
            }}
          >
            {subheading}
          </Text>
        </View>

        {/* ── Staggered card entrance animations ── */}
        <StaggeredList staggerDelay={50} duration={300}>
          {/* ── Streak Badge (delay=0) ── */}
          {!streakLoading && (
            <View style={{ marginBottom: SPACING['2xl'] }}>
              <StreakBadge
                streakData={streakData}
                displayState={displayState}
                freezeAvailable={freezeAvailable}
                atRisk={streakAtRisk}
              />
            </View>
          )}

          {/* ── Feed Score Card (delay=50) ── */}
          <View style={{ marginBottom: SPACING['2xl'] }}>
            <FeedScoreCard feedScore={feedScore} />
          </View>

          {/* ── Feed Score Trend (delay=100) ── */}
          {scoreTrendPoints.length >= 2 && (
            <View style={{ marginBottom: SPACING['3xl'] }}>
              <FeedScoreTrend
                points={scoreTrendPoints}
                direction={scoreTrendDirection}
                changePercent={scoreTrendChangePercent}
              />
            </View>
          )}

          {/* ── Primary CTA (delay=150) ── */}
          <Animated.View style={{ transform: [{ scale: ctaScale }], marginBottom: SPACING['3xl'] }}>
            <Pressable
              onPress={handleCtaPress}
              onPressIn={handleCtaPressIn}
              onPressOut={handleCtaPressOut}
              accessibilityRole="button"
              accessibilityLabel="Scan your feed"
              accessibilityHint="Opens platform selection to start a new scan"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <LinearGradient
                colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: RADIUS.lg,
                  paddingVertical: SPACING.xl,
                  paddingHorizontal: SPACING['2xl'],
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: SPACING.md,
                  minHeight: 60,
                  ...shadows.hero,
                }}
              >
                {/* H-2 FIX: Updated CTA text to indicate platform selection step */}
                {/* H-7 FIX: Increased icon size for better visual balance */}
                <Scan size={26} color={colors.textInverse} strokeWidth={2} />
                <Text
                  style={{
                    ...GL_TYPOGRAPHY.buttonLg,
                    color: colors.textInverse,
                    fontSize: GL_TYPOGRAPHY.h2.fontSize,
                  }}
                >
                  Choose a Platform to Scan
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Weekly Summary (delay=200) ── */}
          {weeklySummary && weeklySummary.scanCount > 0 && (
            <View style={{ marginBottom: SPACING['2xl'] }}>
              <WeeklySummaryCard summary={weeklySummary} />
            </View>
          )}

          {/* ── Achievement Badges (delay=250) ── */}
          {streakData.total_scans > 0 && (
            <View style={{ marginBottom: SPACING['2xl'] }}>
              <AchievementBadges
                earnedAchievements={earnedAchievements}
                newlyEarnedId={newlyEarnedId}
              />
            </View>
          )}

          {/* ── Smart Suggestion (delay=300) ── */}
          {suggestion && (
            <View style={{ marginBottom: SPACING.xl }}>
              <SmartSuggestion
                suggestion={suggestion}
                onAction={handleCtaPress}
              />
            </View>
          )}

          {/* ── Recent Scan Preview (delay=350) ── */}
          {recentScan && (
            <View style={{ marginBottom: SPACING.xl }}>
              <RecentScanCard
                scan={recentScan}
                onPress={onRecentScanPress}
              />
            </View>
          )}

          {/* ── Daily Tip (delay=400) ── */}
          <View style={{ marginBottom: SPACING['3xl'] }}>
            <DailyTipCard />
          </View>
        </StaggeredList>
      </ScrollView>

      {/* Platform selection bottom sheet — M-24 FIX: pass last platform for default selection */}
      <PlatformBottomSheet
        visible={sheetVisible}
        onClose={handleSheetClose}
        onScanStart={handleScanStart}
        lastPlatform={recentScan?.platform as import('../../types/broadcast').SupportedPlatform | undefined}
      />
    </SafeAreaView>
  );
}

export const CalmHomeScreen = React.memo(CalmHomeScreenComponent);

/**
 * Contextual subheading based on scan history.
 * H-09 FIX: Uses deterministic logic based on whether user has scanned before,
 * not streak display state which can change within a session.
 * Epistemically restrained — describes, never accuses.
 */
function getSubheading(_displayState: string, totalScans: number, dbScanCount: number): string {
  // Deterministic: has the user ever scanned?
  const hasHistory = totalScans > 0 || dbScanCount > 0;
  if (hasHistory) {
    return 'Welcome back \u2014 ready for a fresh scan?';
  }
  return 'See what\u2019s in your social media feed';
}
