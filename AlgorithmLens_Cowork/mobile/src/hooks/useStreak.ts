/**
 * useStreak — React hook for streak state management.
 *
 * Provides the current streak data, display state, and actions
 * to the Calm Home Screen and StreakBadge components.
 *
 * Loads streak data on mount and refreshes when the app returns
 * to the foreground (in case the user scanned from a notification).
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { StreakData, StreakDisplayState } from '../types/streak';
import { STREAK_MILESTONES } from '../types/streak';
import {
  loadStreakData,
  recordScan,
  computeStreakState,
  getPendingMilestone,
  markMilestoneCelebrated,
  getWelcomeBackMessage,
  getTimeBasedGreeting,
} from '../lib/streakManager';

interface UseStreakReturn {
  /** Current streak data from persistence. */
  streakData: StreakData;
  /** Computed display state for UI rendering. */
  displayState: StreakDisplayState;
  /** Whether streak data is currently loading. */
  loading: boolean;
  /** Time-of-day greeting string (e.g., "Good morning, Justin"). */
  greeting: string;
  /** Welcome back message for paused streaks. */
  welcomeMessage: string;
  /** Pending milestone to celebrate, if any. */
  pendingMilestone: (typeof STREAK_MILESTONES)[number] | null;
  /** Call after a scan completes to update the streak. Returns any milestone to celebrate. */
  onScanComplete: () => Promise<(typeof STREAK_MILESTONES)[number] | null>;
  /** Dismiss a milestone celebration. */
  dismissMilestone: (days: number) => Promise<void>;
  /** Force refresh streak data from storage. */
  refresh: () => Promise<void>;
}

export function useStreak(userName?: string): UseStreakReturn {
  const [streakData, setStreakData] = useState<StreakData>({
    current_streak: 0,
    longest_streak: 0,
    last_scan_date: null,
    grace_days_used: 0,
    max_grace_days: 1,
    in_grace_period: false,
    is_paused: false,
    total_scans: 0,
    first_scan_date: null,
  });
  const [loading, setLoading] = useState(true);
  const [pendingMilestone, setPendingMilestone] = useState<
    (typeof STREAK_MILESTONES)[number] | null
  >(null);

  const displayState = computeStreakState(streakData);
  const greeting = getTimeBasedGreeting(userName);
  const welcomeMessage = getWelcomeBackMessage(streakData);

  // Load streak data from AsyncStorage
  const loadData = useCallback(async () => {
    try {
      const data = await loadStreakData();
      setStreakData(data);

      // Check for uncelebrated milestone
      const milestone = await getPendingMilestone(data);
      setPendingMilestone(milestone);
    } catch (error) {
      if (__DEV__) {
        console.warn('[useStreak] Failed to load streak data:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh when app returns to foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        loadData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [loadData]);

  // Record a scan completion
  const onScanComplete = useCallback(async () => {
    try {
      const { streak, milestone } = await recordScan();
      setStreakData(streak);
      if (milestone) {
        setPendingMilestone(milestone);
      }
      return milestone;
    } catch (error) {
      if (__DEV__) {
        console.warn('[useStreak] Failed to record scan completion:', error);
      }
      return null;
    }
  }, []);

  // Dismiss a milestone celebration
  const dismissMilestone = useCallback(async (days: number) => {
    await markMilestoneCelebrated(days);
    setPendingMilestone(null);
  }, []);

  return {
    streakData,
    displayState,
    loading,
    greeting,
    welcomeMessage,
    pendingMilestone,
    onScanComplete,
    dismissMilestone,
    refresh: loadData,
  };
}
