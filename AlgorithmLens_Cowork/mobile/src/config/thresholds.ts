/**
 * Centralized threshold constants for AlgorithmLens Mobile App.
 *
 * These constants are used across multiple screens (scanner, history,
 * comparison) to determine scan quality levels. Keeping them in one
 * place avoids drift and makes tuning straightforward.
 */

// ─── Scan Quality Thresholds ──────────────────────────────

/** Minimum post count for a "Good sample" quality rating. */
export const MIN_POSTS_GOOD = 20;

/** Minimum post count for a "Fair / Okay sample" quality rating. */
export const MIN_POSTS_OK = 10;

/** Minimum post count for any meaningful analysis. */
export const MIN_POSTS_FOR_ANALYSIS = 10;

// ─── Political & Tone Analysis Thresholds ─────────────────

/** Minimum political posts before ideology distribution is shown. */
export const MIN_POLITICAL_FOR_IDEOLOGY = 10;

/** Minimum political posts before top political source is shown. */
export const MIN_POLITICAL_FOR_SOURCE = 10;

/** Minimum posts with known valence for tone analysis. */
export const MIN_VALENCE_FOR_TONE = 10;

// ─── Streak System Thresholds ────────────────────────────
// Grace days and milestone days are defined in src/types/streak.ts (DEFAULT_STREAK_CONFIG).

/** Minimum scans in a week to compute a Feed Score. */
export const MIN_SCANS_FOR_FEED_SCORE = 2;

/** Feed Score thresholds for label assignment. */
export const FEED_SCORE_THRESHOLDS = {
  BALANCED: 70,
  MOSTLY_BALANCED: 50,
  WORTH_WATCHING: 0,
} as const;

// ─── Notification Defaults ────────────────────────────────

/** Default scan reminder frequency in days. */
export const DEFAULT_REMINDER_FREQUENCY_DAYS = 7;

/** Available reminder frequency options (in days). */
export const REMINDER_FREQUENCY_OPTIONS = ['3', '5', '7'] as const;

export type ReminderFrequency = typeof REMINDER_FREQUENCY_OPTIONS[number];

// ─── Quality Chip Helper ──────────────────────────────────

export interface QualityChip {
  label: string;
  color: string;
}

/**
 * Returns a quality chip label and color key based on post count.
 * The caller must resolve the color key against the current theme.
 */
export function getQualityLevel(postCount: number): { label: string; colorKey: 'accentGreen' | 'warning' | 'error' } {
  if (postCount >= MIN_POSTS_GOOD) {
    return { label: 'Good sample', colorKey: 'accentGreen' };
  } else if (postCount >= MIN_POSTS_OK) {
    return { label: 'Fair sample', colorKey: 'warning' };
  } else {
    return { label: 'Low sample', colorKey: 'error' };
  }
}
