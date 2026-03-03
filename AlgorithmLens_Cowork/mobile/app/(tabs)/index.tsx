/**
 * Home Tab — Calm Home Screen (broadcast-first architecture)
 *
 * This is the default landing screen. It renders the CalmHomeScreen
 * component which provides:
 * - Time-of-day greeting with streak
 * - Weekly Feed Score + 7-day trend sparkline
 * - Primary "Scan Your Feed" CTA → bottom sheet platform picker
 * - Weekly summary card
 * - Achievement badges
 * - Smart scan suggestions
 * - Recent scan preview card
 * - Daily rotating tip
 *
 * Integrates the useHabitFeatures hook for all habit-forming features.
 */

import React, { useCallback, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { CalmHomeScreen } from '../../src/components/home/CalmHomeScreen';
import { ContentFadeIn } from '../../src/components/glue';
import { FirstUseWalkthrough } from '../../src/components/home/FirstUseWalkthrough';
import { useDashboard } from '../../src/hooks/useDashboard';
import { useStreak } from '../../src/hooks/useStreak';
import { useHabitFeatures } from '../../src/hooks/useHabitFeatures';
import type { ScanMode, SupportedPlatform } from '../../src/types/broadcast';
import type { FeedScore } from '../../src/types/streak';

export default function HomeScreen() {
  const { scans, latestScan, loading: dashboardLoading, refresh: refreshDashboard } = useDashboard();
  const { streakData, refresh: refreshStreak } = useStreak();

  // Habit-forming features
  const {
    earnedAchievements,
    newlyEarnedId,
    weeklySummary,
    scoreTrendPoints,
    scoreTrendDirection,
    scoreTrendChangePercent,
    suggestion,
    freezeAvailable,
    streakAtRisk,
  } = useHabitFeatures(streakData);

  // M-18 FIX: Refresh dashboard AND streak data when this tab gains focus.
  // This ensures the home screen shows fresh data after completing a scan
  // on another screen and navigating back.
  // C-04/H-08 FIX: Also refresh streak so it reflects scans recorded
  // by analysis/[sessionId].tsx which writes directly to AsyncStorage.
  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
      refreshStreak();
    }, [refreshDashboard, refreshStreak])
  );

  // L-02 FIX: Dynamic Feed Score that factors in source diversity, ad percentage,
  // suggested vs followed ratio, and platform variety. No longer returns a static "80 — Balanced".
  // H-02 FIX: Return undefined (not null) while dashboard is still loading.
  const feedScore = useMemo((): FeedScore | null | undefined => {
    if (dashboardLoading && scans.length === 0) return undefined;
    if (scans.length < 2) return null;

    // Try 7-day window first; fall back to all scans if too few recent ones
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let scoringScans = scans.filter(
      (s) => new Date(s.created_at).getTime() > oneWeekAgo
    );
    if (scoringScans.length < 2) {
      scoringScans = scans.slice(0, 10);
    }

    // ── Factor 1: Ad density (lower ads = higher score) ──
    const avgAdPct =
      scoringScans.reduce((sum, s) => sum + s.ad_percentage, 0) /
      scoringScans.length;
    // Lose up to 20 points for high ad density (>30% = max penalty)
    const adPenalty = Math.min(20, Math.max(0, avgAdPct - 5) * 0.8);

    // ── Factor 2: Suggested vs followed ratio (more followed = higher score) ──
    const avgSuggestedPct =
      scoringScans.reduce((sum, s) => sum + (s.suggested_percentage || 0), 0) /
      scoringScans.length;
    // Lose up to 15 points for high suggested ratio (>70% = max penalty)
    const suggestedPenalty = Math.min(15, Math.max(0, avgSuggestedPct - 30) * 0.375);

    // ── Factor 3: Source diversity (unique platforms scanned) ──
    const uniquePlatforms = new Set(scoringScans.map((s) => s.platform?.toLowerCase())).size;
    // Bonus up to 10 points for scanning multiple platforms
    const diversityBonus = Math.min(10, (uniquePlatforms - 1) * 5);

    // ── Factor 4: Sample quality (more posts = better data) ──
    const avgItems =
      scoringScans.reduce((sum, s) => sum + (s.post_count || 0), 0) /
      scoringScans.length;
    const sampleBonus = Math.min(5, avgItems / 10);

    // ── Factor 5: Scan frequency bonus ──
    const frequencyBonus = Math.min(5, scoringScans.length);

    // Compute final score: start at 80, apply adjustments
    let score = 80 - adPenalty - suggestedPenalty + diversityBonus + sampleBonus + frequencyBonus;
    score = Math.round(Math.max(0, Math.min(100, score)));

    const label =
      score >= 70
        ? 'Balanced'
        : score >= 50
        ? 'Mostly balanced'
        : 'Worth watching';

    const summary =
      score >= 70
        ? avgAdPct <= 10
          ? 'Your feed has low ad density and a good content mix across sources.'
          : 'Your feed shows a healthy balance overall. Ad density is moderate.'
        : score >= 50
        ? avgSuggestedPct >= 50
          ? 'Much of your feed comes from suggestions rather than accounts you follow.'
          : 'Your feed is fairly balanced. Consider scanning different platforms to compare.'
        : avgAdPct >= 25
        ? 'Ad density is high across your recent scans. Check the dashboard for details.'
        : 'Some areas of your feed could use attention. Check the dashboard for details.';

    const scansThisWeek = scans.filter(
      (s) => new Date(s.created_at).getTime() > oneWeekAgo
    ).length;

    return {
      score,
      label: label as FeedScore['label'],
      scans_this_week: scansThisWeek,
      summary,
      computed_at: new Date().toISOString(),
    };
  }, [scans, dashboardLoading]);

  // Build recent scan preview data from the latest scan
  const recentScan = useMemo(() => {
    if (!latestScan) return null;
    return {
      platform: latestScan.platform,
      created_at: latestScan.created_at,
      post_count: latestScan.post_count,
      ad_percentage: latestScan.ad_percentage,
    };
  }, [latestScan]);

  const handleScanStart = useCallback(
    (platform: SupportedPlatform, mode: ScanMode) => {
      if (mode === 'broadcast') {
        router.push({
          pathname: '/broadcast/[platform]',
          params: { platform },
        });
      } else {
        router.push({
          pathname: '/scanner/[platform]',
          params: { platform },
        });
      }
    },
    []
  );

  const handleRecentScanPress = useCallback(() => {
    router.push({ pathname: '/(tabs)/dashboard' });
  }, []);

  return (
    <ContentFadeIn ready={!dashboardLoading || scans.length > 0} style={{ flex: 1 }}>
    {/* M-22 FIX: First-use walkthrough for new users */}
    <FirstUseWalkthrough />
    <CalmHomeScreen
      feedScore={feedScore}
      recentScan={recentScan}
      onScanStart={handleScanStart}
      onRecentScanPress={handleRecentScanPress}
      weeklySummary={weeklySummary}
      scoreTrendPoints={scoreTrendPoints}
      scoreTrendDirection={scoreTrendDirection}
      scoreTrendChangePercent={scoreTrendChangePercent}
      earnedAchievements={earnedAchievements}
      newlyEarnedId={newlyEarnedId}
      suggestion={suggestion}
      freezeAvailable={freezeAvailable}
      streakAtRisk={streakAtRisk}
      dbScanCount={scans.length}
      onRefreshDashboard={refreshDashboard}
    />
    </ContentFadeIn>
  );
}
