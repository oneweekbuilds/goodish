/**
 * useHabitFeatures — React hook for all habit-forming features.
 *
 * Aggregates data for:
 * - Achievement badges
 * - Weekly summary
 * - Feed score trending
 * - Smart scan suggestions
 * - Streak freeze status
 * - Streak at-risk detection
 *
 * Loads all data from AsyncStorage on mount and refreshes
 * when the app returns to the foreground.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { EarnedAchievement, WeeklySummaryData, FeedScoreTrendPoint, TrendDirection, StreakFreezeData, ScanHistoryEntry, AchievementCheckContext } from '../types/achievements';
import type { StreakData } from '../types/streak';
import type { ScanSuggestion } from '../lib/achievements';
import {
  loadEarnedAchievements,
  markAchievementSeen,
  checkAchievements,
  loadScanHistory,
  recordScanHistory,
  getScannedPlatforms,
  loadScoreHistory,
  recordScoreHistory,
  getRecentScoreTrend,
  computeWeeklySummary,
  getSmartSuggestions,
} from '../lib/achievements';
import { loadStreakFreeze, isStreakAtRisk } from '../lib/streakManager';

interface UseHabitFeaturesReturn {
  /** All earned achievement badges. */
  earnedAchievements: EarnedAchievement[];
  /** ID of a newly earned achievement (for animation). */
  newlyEarnedId: string | null;
  /** Weekly summary data, if available. */
  weeklySummary: WeeklySummaryData | null;
  /** Score trend points for sparkline. */
  scoreTrendPoints: FeedScoreTrendPoint[];
  /** Score trend direction. */
  scoreTrendDirection: TrendDirection;
  /** Score trend change percent. */
  scoreTrendChangePercent: number;
  /** Smart scan suggestion, if any. */
  suggestion: ScanSuggestion | null;
  /** Whether a streak freeze is available. */
  freezeAvailable: boolean;
  /** Whether the streak is at risk. */
  streakAtRisk: boolean;
  /** Loading state. */
  loading: boolean;
  /** Record a completed scan for habit tracking. */
  recordHabitScan: (entry: ScanHistoryEntry, feedScore: number, streakData: StreakData) => Promise<void>;
  /** Dismiss a newly earned achievement. */
  dismissNewAchievement: () => Promise<void>;
  /** Force refresh all data. */
  refresh: () => Promise<void>;
}

export function useHabitFeatures(streakData: StreakData): UseHabitFeaturesReturn {
  const [earnedAchievements, setEarnedAchievements] = useState<EarnedAchievement[]>([]);
  const [newlyEarnedId, setNewlyEarnedId] = useState<string | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryData | null>(null);
  const [scoreTrendPoints, setScoreTrendPoints] = useState<FeedScoreTrendPoint[]>([]);
  const [scoreTrendDirection, setScoreTrendDirection] = useState<TrendDirection>('stable');
  const [scoreTrendChangePercent, setScoreTrendChangePercent] = useState(0);
  const [suggestion, setSuggestion] = useState<ScanSuggestion | null>(null);
  const [freezeAvailable, setFreezeAvailable] = useState(false);
  const [streakAtRisk, setStreakAtRisk] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    try {
      // Load all data in parallel
      const [achievements, summary, trend, freeze, platforms, scanHistory] = await Promise.all([
        loadEarnedAchievements(),
        computeWeeklySummary(),
        getRecentScoreTrend(),
        loadStreakFreeze(),
        getScannedPlatforms(),
        loadScanHistory(),
      ]);

      setEarnedAchievements(achievements);
      setWeeklySummary(summary);
      setScoreTrendPoints(trend.points);
      setScoreTrendDirection(trend.direction);
      setScoreTrendChangePercent(trend.changePercent);
      setFreezeAvailable(freeze.available);
      setStreakAtRisk(isStreakAtRisk(streakData));

      // Load smart suggestion
      const sug = await getSmartSuggestions(streakData.last_scan_date);
      setSuggestion(sug);

      // Check for unseen achievements
      const unseen = achievements.find((a) => !a.seen);
      if (unseen) {
        setNewlyEarnedId(unseen.id);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[useHabitFeatures] Failed to load data:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [streakData]);

  // Load on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Re-check at-risk status when app becomes active
        setStreakAtRisk(isStreakAtRisk(streakData));
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [streakData]);

  // Record a scan for habit tracking
  const recordHabitScan = useCallback(async (
    entry: ScanHistoryEntry,
    feedScore: number,
    currentStreakData: StreakData
  ) => {
    try {
      // Record scan history and score
      await Promise.all([
        recordScanHistory(entry),
        recordScoreHistory(feedScore),
      ]);

      // Check achievements
      const platforms = await getScannedPlatforms();
      const scoreHistory = await loadScoreHistory();
      const scanHistory = await loadScanHistory();

      // Memoize context creation with useMemo would require moving this, so use inline memoization
      const ctx: AchievementCheckContext = {
        totalScans: currentStreakData.total_scans,
        currentStreak: currentStreakData.current_streak,
        longestStreak: currentStreakData.longest_streak,
        platformsScanned: platforms,
        scanHour: new Date().getHours(),
        scoreHistory: scoreHistory.map((s) => ({ score: s.score, date: s.date })),
        scanDates: scanHistory.map((s) => s.date),
      };

      const newAchievements = await checkAchievements(ctx);
      if (newAchievements.length > 0) {
        setNewlyEarnedId(newAchievements[0].id);
        setEarnedAchievements((prev) => [...prev, ...newAchievements]);
      }

      // Refresh all data
      await loadAllData();
    } catch (error) {
      if (__DEV__) {
        console.warn('[useHabitFeatures] Failed to record habit scan:', error);
      }
    }
  }, [loadAllData]);

  // Dismiss newly earned achievement
  const dismissNewAchievement = useCallback(async () => {
    if (newlyEarnedId) {
      await markAchievementSeen(newlyEarnedId);
      setNewlyEarnedId(null);
    }
  }, [newlyEarnedId]);

  // Memoize the return value to prevent unnecessary re-renders of components using this hook
  const returnValue = useMemo(() => ({
    earnedAchievements,
    newlyEarnedId,
    weeklySummary,
    scoreTrendPoints,
    scoreTrendDirection,
    scoreTrendChangePercent,
    suggestion,
    freezeAvailable,
    streakAtRisk,
    loading,
    recordHabitScan,
    dismissNewAchievement,
    refresh: loadAllData,
  }), [
    earnedAchievements,
    newlyEarnedId,
    weeklySummary,
    scoreTrendPoints,
    scoreTrendDirection,
    scoreTrendChangePercent,
    suggestion,
    freezeAvailable,
    streakAtRisk,
    loading,
    recordHabitScan,
    dismissNewAchievement,
    loadAllData,
  ]);

  return returnValue;
}
