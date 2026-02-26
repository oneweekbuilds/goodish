/**
 * AlgorithmLens Mobile App — Streak System Type Definitions
 *
 * The streak system tracks consistent scanning habits without inducing
 * guilt or anxiety. Key design principles from research:
 *
 * 1. Sessions not minutes — scanning once = streak maintained
 * 2. 1 grace day — miss one day, streak pauses but doesn't break
 * 3. Milestone celebrations at 3, 7, 14, 30 days (not every day)
 * 4. Recovery mechanic — "Welcome back" not "You lost your streak"
 * 5. No guilt — never show "streak lost" language, frame as "streak paused"
 */

// ============================================
// Core Streak Data
// ============================================

export interface StreakData {
  /** Current consecutive-day scan count (including grace days). */
  current_streak: number;
  /** Longest streak the user has ever achieved. */
  longest_streak: number;
  /** ISO 8601 date string (YYYY-MM-DD) of the last completed scan. */
  last_scan_date: string | null;
  /** Number of grace days used in the current streak. */
  grace_days_used: number;
  /** Maximum grace days allowed per streak. */
  max_grace_days: number;
  /** Whether the streak is currently in a grace period (missed yesterday, still recoverable). */
  in_grace_period: boolean;
  /** Whether the streak has been paused (missed too many days, needs recovery). */
  is_paused: boolean;
  /** Total number of scans the user has completed (all time). */
  total_scans: number;
  /** ISO 8601 date string of the first-ever scan. */
  first_scan_date: string | null;
}

// ============================================
// Streak State (computed from StreakData)
// ============================================

/**
 * Streak display state determines the UI treatment:
 * - ACTIVE: User scanned today or is within the grace window. Show flame.
 * - GRACE: User missed yesterday but grace day saves the streak. Show subtle indicator.
 * - PAUSED: Streak is broken but we frame it as "paused." Show welcome-back messaging.
 * - NEW: User has never scanned or has no streak history. Show encouragement.
 */
export type StreakDisplayState = 'ACTIVE' | 'GRACE' | 'PAUSED' | 'NEW';

// ============================================
// Milestones
// ============================================

export interface StreakMilestone {
  /** The day count for this milestone. */
  days: number;
  /** Display title for the celebration. */
  title: string;
  /** Encouraging message shown when the milestone is reached. */
  message: string;
  /** Whether this milestone has been celebrated (prevents re-showing). */
  celebrated: boolean;
}

/**
 * Milestone definitions. Celebrations happen at meaningful intervals,
 * not every day, to avoid notification fatigue.
 */
export const STREAK_MILESTONES: Omit<StreakMilestone, 'celebrated'>[] = [
  {
    days: 3,
    title: 'Getting started',
    message: 'Three days of awareness. You\'re building a habit.',
  },
  {
    days: 7,
    title: 'One week',
    message: 'A full week of understanding your feed. That\'s meaningful.',
  },
  {
    days: 14,
    title: 'Two weeks',
    message: 'Two weeks of consistent reflection. Your feed awareness is growing.',
  },
  {
    days: 30,
    title: 'One month',
    message: 'A month of intentional social media use. You\'re in the top tier of digital awareness.',
  },
];

// ============================================
// Grace Day
// ============================================

export interface GraceDay {
  /** ISO 8601 date string (YYYY-MM-DD) of the day that was "graced." */
  date: string;
  /** Whether this grace day was auto-applied (vs. user explicitly choosing). */
  auto_applied: boolean;
}

// ============================================
// Streak Configuration
// ============================================

export interface StreakConfig {
  /** Number of grace days allowed before a streak pauses. */
  grace_days: number;
  /** Day counts at which milestone celebrations trigger. */
  milestone_days: number[];
  /** Whether to show the streak on the home screen. */
  show_on_home: boolean;
  /** Whether to send streak reminder notifications. */
  send_reminders: boolean;
}

export const DEFAULT_STREAK_CONFIG: StreakConfig = {
  grace_days: 1,
  milestone_days: [3, 7, 14, 30],
  show_on_home: true,
  send_reminders: false,
};

// ============================================
// Streak Persistence Keys
// ============================================

/**
 * AsyncStorage keys used by the streak manager.
 * Centralized here to prevent key collision and ensure consistency.
 */
export const STREAK_STORAGE_KEYS = {
  STREAK_DATA: '@algorithmlens/streak_data',
  CELEBRATED_MILESTONES: '@algorithmlens/celebrated_milestones',
  STREAK_CONFIG: '@algorithmlens/streak_config',
  STREAK_FREEZE: '@algorithmlens/streak_freeze',
} as const;

// ============================================
// Streak Visual Progression
// ============================================

/**
 * Maps streak length to a visual tier for progressive flame rendering.
 * The flame grows in size and warmth as the streak lengthens.
 */
export interface StreakVisualTier {
  /** Minimum streak length for this tier. */
  minDays: number;
  /** Display label for the tier. */
  label: string;
  /** Flame icon scale multiplier (1.0 = default). */
  iconScale: number;
  /** Primary color for the flame at this tier. */
  flameColor: 'default' | 'warm' | 'hot' | 'blazing';
}

export const STREAK_VISUAL_TIERS: StreakVisualTier[] = [
  { minDays: 1, label: 'Spark', iconScale: 1.0, flameColor: 'default' },
  { minDays: 3, label: 'Glow', iconScale: 1.15, flameColor: 'warm' },
  { minDays: 7, label: 'Flame', iconScale: 1.3, flameColor: 'hot' },
  { minDays: 14, label: 'Fire', iconScale: 1.45, flameColor: 'blazing' },
  { minDays: 30, label: 'Blaze', iconScale: 1.6, flameColor: 'blazing' },
];

/**
 * Returns the visual tier for a given streak length.
 */
export function getStreakVisualTier(streakDays: number): StreakVisualTier {
  let tier: StreakVisualTier = STREAK_VISUAL_TIERS[0]!;
  for (const t of STREAK_VISUAL_TIERS) {
    if (streakDays >= t.minDays) tier = t;
  }
  return tier;
}

// ============================================
// Feed Score (Weekly Summary)
// ============================================

export interface FeedScore {
  /** Composite score representing feed health (0–100). */
  score: number;
  /** Human-readable label for the score range. */
  label: 'Balanced' | 'Mostly balanced' | 'Worth watching' | 'Not enough data';
  /** Number of scans in the scoring period. */
  scans_this_week: number;
  /** Brief explanation of what drove the score. */
  summary: string;
  /** ISO 8601 date string of when this score was last computed. */
  computed_at: string;
}
