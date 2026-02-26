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

// ─── Minimum Scan Requirements ───────────────────────────
// Both must be met before a scan can be saved.

/** Minimum posts required to save a scan. */
export const MIN_POSTS_REQUIRED = 20;

/** Minimum scan duration in seconds required to save a scan. */
export const MIN_SCAN_DURATION_SECS = 60;

/** Minimum frames required for broadcast mode. */
export const MIN_FRAMES_REQUIRED = 20;

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
 *
 * Five-tier system:
 *   50+  → Excellent sample (green)
 *   30-49 → Good sample (green)
 *   20-29 → Fair sample (warning/yellow)
 *   10-19 → Low sample (warning/orange)
 *   <10  → Very low sample (error/red)
 */
export function getQualityLevel(postCount: number): { label: string; labelWithHint: string; colorKey: 'accentGreen' | 'warning' | 'error' } {
  if (postCount >= 50) {
    return { label: 'Excellent sample', labelWithHint: 'Excellent sample (50+ posts)', colorKey: 'accentGreen' };
  } else if (postCount >= 30) {
    return { label: 'Good sample', labelWithHint: 'Good sample (30+ posts)', colorKey: 'accentGreen' };
  } else if (postCount >= MIN_POSTS_GOOD) {
    return { label: 'Fair sample', labelWithHint: `Fair sample (${MIN_POSTS_GOOD}+ posts)`, colorKey: 'warning' };
  } else if (postCount >= MIN_POSTS_OK) {
    return { label: 'Low sample', labelWithHint: `Low sample (aim for ${MIN_POSTS_GOOD}+)`, colorKey: 'warning' };
  } else {
    return { label: 'Very low sample', labelWithHint: `Very low sample (aim for ${MIN_POSTS_OK}+)`, colorKey: 'error' };
  }
}
