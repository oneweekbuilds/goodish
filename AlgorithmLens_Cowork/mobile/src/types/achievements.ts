/**
 * AlgorithmLens Mobile App — Achievement System Type Definitions
 *
 * Achievements reward consistent, curious scanning behavior without
 * creating pressure. They celebrate milestones in a way that's warm
 * and informative — never competitive or anxiety-inducing.
 *
 * Design principles:
 * 1. Celebrate curiosity, not obsession
 * 2. No leaderboards or social comparison
 * 3. Badges earned once, displayed quietly in a collection
 * 4. Copy follows epistemic restraint — factual and warm
 */

// ============================================
// Achievement Definition
// ============================================

export interface AchievementDefinition {
  /** Unique identifier for this achievement. */
  id: string;
  /** Display title shown on the badge. */
  title: string;
  /** Short description of how to earn it. */
  description: string;
  /** Icon name from lucide-react-native. */
  icon: string;
  /** Category for grouping in the badge collection. */
  category: 'scanning' | 'streak' | 'exploration' | 'timing';
  /** Whether this can be checked purely from local data. */
  checkable: boolean;
}

// ============================================
// Earned Achievement (persisted)
// ============================================

export interface EarnedAchievement {
  /** Achievement ID matching a definition. */
  id: string;
  /** ISO 8601 timestamp when earned. */
  earned_at: string;
  /** Whether the user has seen the earn animation. */
  seen: boolean;
}

// ============================================
// Achievement Check Context
// ============================================

/** Data provided to achievement checkers to determine eligibility. */
export interface AchievementCheckContext {
  totalScans: number;
  currentStreak: number;
  longestStreak: number;
  platformsScanned: string[];
  scanHour: number;
  /** Historical score data for trend detection. */
  scoreHistory: Array<{ score: number; date: string }>;
  /** All scan timestamps for pattern detection. */
  scanDates: string[];
}

// ============================================
// Achievement Definitions
// ============================================

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_scan',
    title: 'First Scan',
    description: 'Completed your first feed scan',
    icon: 'sparkles',
    category: 'scanning',
    checkable: true,
  },
  {
    id: 'multi_platform',
    title: 'Multi-Platform',
    description: 'Scanned 3 or more different platforms',
    icon: 'layers',
    category: 'exploration',
    checkable: true,
  },
  {
    id: 'streak_starter',
    title: 'Streak Starter',
    description: 'Maintained a 3-day scanning streak',
    icon: 'flame',
    category: 'streak',
    checkable: true,
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintained a 7-day scanning streak',
    icon: 'shield',
    category: 'streak',
    checkable: true,
  },
  {
    id: 'feed_detective',
    title: 'Feed Detective',
    description: 'Scanned 50 or more total posts across all sessions',
    icon: 'search',
    category: 'scanning',
    checkable: true,
  },
  {
    id: 'pattern_spotter',
    title: 'Pattern Spotter',
    description: 'Your feed health score improved week over week',
    icon: 'trending-up',
    category: 'scanning',
    checkable: true,
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Completed a scan after 10 PM',
    icon: 'moon',
    category: 'timing',
    checkable: true,
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Completed a scan before 8 AM',
    icon: 'sunrise',
    category: 'timing',
    checkable: true,
  },
];

// ============================================
// Persistence Keys
// ============================================

export const ACHIEVEMENT_STORAGE_KEYS = {
  EARNED_ACHIEVEMENTS: '@algorithmlens/earned_achievements',
  SCAN_HISTORY: '@algorithmlens/scan_history',
  SCORE_HISTORY: '@algorithmlens/score_history',
  PLATFORM_HISTORY: '@algorithmlens/platform_history',
  STREAK_FREEZE: '@algorithmlens/streak_freeze',
  WEEKLY_SUMMARY: '@algorithmlens/weekly_summary',
} as const;

// ============================================
// Scan History Entry (for trending + achievements)
// ============================================

export interface ScanHistoryEntry {
  /** ISO 8601 date of the scan. */
  date: string;
  /** Platform scanned. */
  platform: string;
  /** Number of posts in this scan. */
  postCount: number;
  /** Ad percentage in this scan. */
  adPercentage: number;
  /** Feed health score at time of scan. */
  feedScore: number;
  /** Hour of day (0–23) when scan was taken. */
  hourOfDay: number;
}

// ============================================
// Weekly Summary Data
// ============================================

export interface WeeklySummaryData {
  /** ISO week identifier (e.g., "2026-W08"). */
  weekId: string;
  /** Number of scans completed this week. */
  scanCount: number;
  /** Platforms scanned with counts. */
  platformBreakdown: Record<string, number>;
  /** Average ad percentage across scans. */
  avgAdPercentage: number;
  /** Previous week's average ad percentage (for comparison). */
  prevWeekAvgAdPercentage: number | null;
  /** Top platform by scan count. */
  topPlatform: string | null;
  /** Top platform scan count. */
  topPlatformCount: number;
  /** Average feed score this week. */
  avgFeedScore: number;
  /** Previous week's avg feed score. */
  prevWeekAvgFeedScore: number | null;
  /** Total posts scanned this week. */
  totalPosts: number;
}

// ============================================
// Streak Freeze Data
// ============================================

export interface StreakFreezeData {
  /** Whether a freeze is currently available. */
  available: boolean;
  /** ISO date when the freeze was last used. */
  lastUsedDate: string | null;
  /** ISO date when the freeze was last granted (Monday of the week). */
  lastGrantedWeek: string | null;
  /** Whether the freeze was auto-applied to save the streak. */
  autoApplied: boolean;
}

// ============================================
// Feed Score Trend Data
// ============================================

export interface FeedScoreTrendPoint {
  /** ISO 8601 date. */
  date: string;
  /** Score value (0–100). */
  score: number;
}

export type TrendDirection = 'improving' | 'declining' | 'stable';
