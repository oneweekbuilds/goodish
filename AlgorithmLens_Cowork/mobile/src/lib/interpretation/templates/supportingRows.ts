/**
 * Shared supporting-row builders for the standard four-row FactRow
 * supporting card (Ads, Patterns, Political, Tone).
 *
 * Used by both Results templates and Dashboard Overview templates.
 * Extracted from results.ts in Phase 5.1.2 so the Overview surface
 * doesn't duplicate the same FactRow logic. The builders themselves
 * are surface-agnostic — they only read DashboardData + scan history.
 *
 * Comparative anchors come from getComparativeAnchor when a rolling
 * average is available; when not (sparse history), the anchor field
 * is omitted entirely (per the design spec's first-scan calm-case
 * behavior — no placeholder anchors).
 *
 * Reference: mobile/audits/2x-results-design/decisions.md,
 *            mobile/audits/2x-dashboard-design/decisions.md
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import { computeRollingAverage } from '../derivations/rollingAverage';
import type { FactRow, InterpretationContext } from '../interpretation-types';
import { getComparativeAnchor } from '../utils/comparativeAnchor';

/**
 * Tone-bucket dominance threshold: when one tone bucket holds at
 * least this share of known-valence items, the Tone row labels the
 * feed as "Mostly <tone>". Below this threshold, "Mixed tone".
 */
export const TONE_DOMINANCE_THRESHOLD_PCT = 50;

export function buildAdsRow(
  activeScan: ScanDetail,
  scans: ScanDetail[],
  dashboardData: InterpretationContext['dashboardData'],
  platform: string,
): FactRow {
  const adPct = Math.round(dashboardData.adPct);
  const rollingAvg = computeRollingAverage(scans, platform, 'ad_pct', {
    excludeScanId: activeScan.id,
  });
  const anchor = getComparativeAnchor(adPct, rollingAvg);
  return {
    variant: 'fact',
    label: 'Ads',
    value: `${adPct}% of feed`,
    ...(anchor ? { anchor } : {}),
  };
}

export function buildPatternsRow(
  dashboardData: InterpretationContext['dashboardData'],
): FactRow {
  // The Patterns row surfaces the top content type (Video / Photo /
  // etc.) rather than the top topic category. Topic categories live
  // on Gemini's per-item topics field but aren't pre-aggregated into
  // a top-overall field on DashboardData yet, so this is a
  // faithful-but-partial implementation. Recurrence anchor ("same as
  // last 4 scans") deferred until cross-scan recurrence detection
  // lands.
  const top = dashboardData.contentTypes[0];
  return {
    variant: 'fact',
    label: 'Patterns',
    value: top ? `Top: ${top.label}` : 'No pattern data',
  };
}

export function buildPoliticalRow(
  activeScan: ScanDetail,
  scans: ScanDetail[],
  dashboardData: InterpretationContext['dashboardData'],
  platform: string,
): FactRow {
  const pol = dashboardData.politicalAnalysis;
  if (!pol) {
    return { variant: 'fact', label: 'Political', value: 'No analysis' };
  }
  if (pol.politicalCount === 0) {
    return { variant: 'fact', label: 'Political', value: 'None detected' };
  }
  const rollingAvg = computeRollingAverage(scans, platform, 'political_pct', {
    excludeScanId: activeScan.id,
  });
  const anchor = getComparativeAnchor(pol.politicalPct, rollingAvg);
  return {
    variant: 'fact',
    label: 'Political',
    value: `${pol.politicalPct}% detected`,
    ...(anchor ? { anchor } : {}),
  };
}

export function buildToneRow(
  dashboardData: InterpretationContext['dashboardData'],
): FactRow {
  const tone = dashboardData.toneAnalysis;
  if (!tone) {
    return { variant: 'fact', label: 'Tone', value: 'No analysis' };
  }
  const { positivePct, neutralPct, negativePct } = tone;
  const max = Math.max(positivePct, neutralPct, negativePct);
  let label: string;
  if (max < TONE_DOMINANCE_THRESHOLD_PCT) {
    label = 'Mixed tone';
  } else if (max === positivePct) {
    label = 'Mostly positive';
  } else if (max === negativePct) {
    label = 'Mostly negative';
  } else {
    label = 'Mostly neutral';
  }
  return { variant: 'fact', label: 'Tone', value: label };
}
