/**
 * compareDerivation: shared logic for the Compare picker and result
 * screens.
 *
 * Both screens need to resolve the three named comparison options
 * ("Your last [platform] scan", "Your average", "14 days ago") from the
 * full scan history plus the anchor scan. Centralizing the resolution
 * keeps the picker's row availability and the result's data fetch in
 * sync without forking the rules.
 */

import type { ScanDetail } from '../hooks/useDashboard';
import { computeDashboardData } from './computeDashboardData';
import { scoreOfScan } from './scanScore';

export type ComparisonSource = 'last-platform' | 'average' | 'fourteen-days';

/**
 * Synthetic "average" comparison record, built from the last N (max 6,
 * min 2) prior same-platform scans. Each metric is the arithmetic mean
 * of the per-scan derivation. `politicalPct` is null if none of the
 * averaged scans had Gemini political analysis.
 */
export interface AverageComparison {
  count: number;
  sourceDiversity: number;
  adPct: number;
  suggestedPct: number;
  politicalPct: number | null;
  score: number;
}

/**
 * Three resolved options for the picker. A `null` field means that
 * option is not available for the current anchor + scan history.
 */
export interface ComparisonAvailability {
  lastPlatform: ScanDetail | null;
  average: AverageComparison | null;
  fourteenDays: ScanDetail | null;
}

/**
 * Computes what's available to compare against for a given anchor.
 * Same-platform-only across all three options. Anchor is excluded from
 * its own comparison set.
 */
export function computeAvailability(
  scans: ScanDetail[],
  anchorScan: ScanDetail,
): ComparisonAvailability {
  const anchorKey = anchorScan.platform.toLowerCase();
  const samePlatformPrior = scans.filter(
    (s) =>
      s.platform.toLowerCase() === anchorKey && s.id !== anchorScan.id,
  );

  const lastPlatform = samePlatformPrior[0] ?? null;

  const window = samePlatformPrior.slice(0, 6);
  let average: AverageComparison | null = null;
  if (window.length >= 2) {
    const datas = window.map(computeDashboardData);
    const avgScore =
      window.reduce((s, scan) => s + scoreOfScan(scan), 0) / window.length;
    const avgSourceDiversity =
      datas.reduce((s, d) => s + (100 - d.top5Pct), 0) / datas.length;
    const avgAdPct =
      datas.reduce((s, d) => s + d.adPct, 0) / datas.length;
    const avgSuggestedPct =
      datas.reduce((s, d) => s + d.suggestedPct, 0) / datas.length;
    const politicalDatas = datas.filter((d) => d.politicalAnalysis);
    const avgPoliticalPct =
      politicalDatas.length > 0
        ? politicalDatas.reduce(
            (s, d) => s + (d.politicalAnalysis?.politicalPct ?? 0),
            0,
          ) / politicalDatas.length
        : null;
    average = {
      count: window.length,
      sourceDiversity: avgSourceDiversity,
      adPct: avgAdPct,
      suggestedPct: avgSuggestedPct,
      politicalPct: avgPoliticalPct,
      score: avgScore,
    };
  }

  const anchorDate = new Date(anchorScan.created_at);
  let fourteenDays: ScanDetail | null = null;
  if (!isNaN(anchorDate.getTime())) {
    const candidates = samePlatformPrior
      .map((scan) => {
        const d = new Date(scan.created_at);
        if (isNaN(d.getTime())) return null;
        const days = daysBetween(d, anchorDate);
        if (days === null || days < 12 || days > 16) return null;
        return { scan, days };
      })
      .filter((x): x is { scan: ScanDetail; days: number } => x !== null);
    candidates.sort(
      (a, b) => Math.abs(a.days - 14) - Math.abs(b.days - 14),
    );
    fourteenDays = candidates[0]?.scan ?? null;
  }

  return { lastPlatform, average, fourteenDays };
}

/**
 * Calendar-day distance between two Date objects, in local time. Returns
 * null on invalid input.
 */
function daysBetween(earlier: Date, later: Date): number | null {
  if (isNaN(earlier.getTime()) || isNaN(later.getTime())) return null;
  const a = new Date(
    earlier.getFullYear(),
    earlier.getMonth(),
    earlier.getDate(),
  ).getTime();
  const b = new Date(
    later.getFullYear(),
    later.getMonth(),
    later.getDate(),
  ).getTime();
  return Math.round((b - a) / 86400000);
}
