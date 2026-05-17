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
import { computeAdvertiserRecurrence } from '../derivations/advertiserRecurrence';
import { computeCreatorRecurrence } from '../derivations/creatorRecurrence';
import { computeRollingAverage } from '../derivations/rollingAverage';
import type {
  FactRow,
  InterpretationContext,
  SupportingRow,
} from '../interpretation-types';
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

// ============================================
// Top voice row (Phase 5.2.5)
// ============================================
//
// Surfaces the most-recurring creator across the user's scan history
// as the first row of the supporting card. Per the 2.x Dashboard
// design spec's "visual evidence rule" — the supporting card leads
// with its strongest evidence — recurrence outranks the standard
// 4-row composition when one creator has appeared in two or more
// scans within the window.
//
// Returns null when:
//   - no scan history (windowScanCount === 0)
//   - no identifiable creators in the window
//   - no creator has scanCount >= 2 (no recurrence to surface)
//
// Anchor copy scales with window depth, per Phase 5.2.4 thresholds:
//   - "in both your scans"           — scanCount === windowScanCount === 2
//   - "in all N of your scans"       — scanCount === windowScanCount, N >= 3
//   - "in M of your last 3 scans"    — windowScanCount === 3, scanCount < 3
//   - "in M of last N scans"         — windowScanCount >= 4 (design canonical)
//
// The "your last 3" / "last N" split at windowScanCount=4 is editorial:
// the 3-scan case feels too thin without the personal frame; at 4+ the
// design spec's canonical "in 5 of last 6 scans" wording reads more
// naturally without the possessive.

/**
 * Produce the recurrence anchor copy for a Top voice FactRow.
 * Exported separately so unit tests can exercise it independently of
 * the row builder.
 */
export function recurrenceAnchor(
  scanCount: number,
  windowScanCount: number,
): string {
  if (scanCount === windowScanCount) {
    if (windowScanCount === 2) return 'in both your scans';
    return `in all ${windowScanCount} of your scans`;
  }
  if (windowScanCount === 3) {
    return `in ${scanCount} of your last 3 scans`;
  }
  return `in ${scanCount} of last ${windowScanCount} scans`;
}

/**
 * Build the Top voice FactRow when recurrence data justifies it.
 * Returns null when no creator has appeared in at least two scans
 * within the window — the supporting card stays at its standard
 * four rows in that case.
 *
 * `value` carries the display name; `anchor` carries the recurrence
 * phrase. This matches FactRow's per-field styling (value renders in
 * body-strong weight, anchor in caption-gray after a middot) — both
 * appear together as "Display Name · in N of M scans" in the
 * rendered card.
 */
export function buildTopVoiceRow(
  scans: ScanDetail[],
  platform: string,
): FactRow | null {
  const recurrence = computeCreatorRecurrence(scans, platform);
  const top = recurrence.records[0];
  if (!top || top.scanCount < 2) return null;
  return {
    variant: 'fact',
    label: 'Top voice',
    value: top.displayName,
    anchor: recurrenceAnchor(top.scanCount, recurrence.windowScanCount),
  };
}

/**
 * Build the Recurring advertiser FactRow when ad-source recurrence
 * data justifies it (Phase 5.4.4). Returns null when no advertiser
 * has appeared in at least two scans within the window — the
 * supporting card omits this row in that case.
 *
 * Mirrors `buildTopVoiceRow`'s shape and threshold. The two rows
 * surface independent signals (organic creator dominance vs.
 * advertiser persistence) and can both fire on the same card.
 * Visual hierarchy: Top voice leads, Recurring advertiser follows.
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md Tab 3
 */
export function buildRecurringAdvertiserRow(
  scans: ScanDetail[],
  platform: string,
): FactRow | null {
  const recurrence = computeAdvertiserRecurrence(scans, platform);
  const top = recurrence.records[0];
  if (!top || top.scanCount < 2) return null;
  return {
    variant: 'fact',
    label: 'Recurring advertiser',
    value: top.displayName,
    anchor: recurrenceAnchor(top.scanCount, recurrence.windowScanCount),
  };
}

// ============================================
// Composed supporting card (Phase 5.2.5)
// ============================================

/**
 * The standard supporting card: Top voice + Recurring advertiser
 * (when their respective recurrences justify) + Ads + Patterns +
 * Political + Tone. Shared between Results and Dashboard Overview
 * surfaces because the card composition is identical even though
 * the verdict and sublines above it vary per-surface.
 *
 * Prepend order when both fire: Top voice → Recurring advertiser.
 * Visual hierarchy follows entity specificity (organic creator
 * dominance first, advertiser persistence second), then aggregate
 * metrics (Ads density, format, political, tone). Both recurrence
 * rows can fire independently — they surface distinct signals (Top
 * voice = organic feed concentration; Recurring advertiser = ad-
 * source persistence). The card scales to 6 rows when both fire,
 * which is within design-spec norms (Tab 2 has 7 rows, Tab 5 has 6).
 */
export function buildStandardSupportingRows(
  activeScan: ScanDetail,
  scans: ScanDetail[],
  dashboardData: InterpretationContext['dashboardData'],
  platform: string,
): SupportingRow[] {
  const topVoice = buildTopVoiceRow(scans, platform);
  const recurringAdvertiser = buildRecurringAdvertiserRow(scans, platform);
  const prepends: SupportingRow[] = [];
  if (topVoice) prepends.push(topVoice);
  if (recurringAdvertiser) prepends.push(recurringAdvertiser);
  const standardRows: SupportingRow[] = [
    buildAdsRow(activeScan, scans, dashboardData, platform),
    buildPatternsRow(dashboardData),
    buildPoliticalRow(activeScan, scans, dashboardData, platform),
    buildToneRow(dashboardData),
  ];
  return [...prepends, ...standardRows];
}
