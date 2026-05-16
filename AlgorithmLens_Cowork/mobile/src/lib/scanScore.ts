/**
 * scanScore: shared per-scan score model used by Home's Feed Score card
 * and Compare's anchored result interpretation. Mirrors the factor logic
 * the Home redesign committed to: a 0 to 100 score derived from ad
 * density, suggested ratio, and sample size, with three qualitative bands.
 */

/**
 * Minimal structural shape a scan must satisfy to be scored. Both the
 * useDashboard `ScanDetail` (all fields required) and the
 * computeDashboardData `ScanRecord` (all fields optional) satisfy this.
 */
export interface ScoreableScan {
  ad_percentage?: number;
  suggested_percentage?: number;
  post_count?: number;
}

/**
 * Returns a 0 to 100 score for a single scan, clamped. Factors:
 *   1. Ad density beyond a 5% baseline incurs up to 20 points of penalty.
 *   2. Suggested ratio beyond a 30% baseline incurs up to 15 points.
 *   3. Larger samples earn up to 5 points of bonus.
 */
export function scoreOfScan(scan: ScoreableScan): number {
  const adPenalty = Math.min(
    20,
    Math.max(0, (scan.ad_percentage ?? 0) - 5) * 0.8,
  );
  const suggestedPenalty = Math.min(
    15,
    Math.max(0, (scan.suggested_percentage ?? 0) - 30) * 0.375,
  );
  const sampleBonus = Math.min(5, (scan.post_count ?? 0) / 10);
  const score = 80 - adPenalty - suggestedPenalty + sampleBonus;
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Qualitative band for a score in [0, 100]:
 *   >= 70 returns "Balanced"
 *   >= 50 returns "Mostly balanced"
 *   otherwise returns "Worth watching"
 */
export function labelForScore(score: number): string {
  if (score >= 70) return 'Balanced';
  if (score >= 50) return 'Mostly balanced';
  return 'Worth watching';
}
