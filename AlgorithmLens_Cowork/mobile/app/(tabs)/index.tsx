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
import { router } from 'expo-router';
import { CalmHomeScreen } from '../../src/components/home/CalmHomeScreen';
import { useDashboard } from '../../src/hooks/useDashboard';
import { useStreak } from '../../src/hooks/useStreak';
import { useHabitFeatures } from '../../src/hooks/useHabitFeatures';
import type { ScanMode, SupportedPlatform } from '../../src/types/broadcast';
import type { FeedScore } from '../../src/types/streak';

export default function HomeScreen() {
  const { scans, latestScan } = useDashboard();
  const { streakData } = useStreak();

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

  // Compute a simple Feed Score from recent scans
  const feedScore = useMemo((): FeedScore | null => {
    if (scans.length < 2) return null;

    // Get scans from the last 7 days
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentScans = scans.filter(
      (s) => new Date(s.created_at).getTime() > oneWeekAgo
    );

    if (recentScans.length < 2) return null;

    const avgAdPct =
      recentScans.reduce((sum, s) => sum + s.ad_percentage, 0) /
      recentScans.length;
    const avgItems =
      recentScans.reduce((sum, s) => sum + (s.post_count || 0), 0) /
      recentScans.length;

    let score = 75;
    score -= Math.max(0, avgAdPct - 10) * 0.5;
    score += Math.min(10, recentScans.length * 2);
    score += Math.min(5, avgItems / 10);
    score = Math.round(Math.max(0, Math.min(100, score)));

    const label =
      score >= 70
        ? 'Balanced'
        : score >= 50
        ? 'Mostly balanced'
        : 'Worth watching';

    const summary =
      score >= 70
        ? 'Your feed shows a healthy mix of content. Ad density is moderate and sources are varied.'
        : score >= 50
        ? 'Your feed is fairly balanced. Consider scanning different platforms to compare.'
        : 'Some areas of your feed could use attention. Check the dashboard for details.';

    return {
      score,
      label: label as FeedScore['label'],
      scans_this_week: recentScans.length,
      summary,
      computed_at: new Date().toISOString(),
    };
  }, [scans]);

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
    />
  );
}
