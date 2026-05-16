/**
 * Results screen interpretation templates.
 *
 * Each template is a ResultsTemplate record with:
 *   - id: stable identifier (e.g. 'results.concentrated_feed').
 *   - when: predicate that decides if the template fires for a given
 *     scan context.
 *   - priority: higher number = checked first when multiple could
 *     match. Used for tie-breaking when several templates' predicates
 *     return true.
 *   - render: produces the InterpretationResult when the template
 *     fires. Receives the same InterpretationContext as `when` and
 *     emits a complete result with verdict, sub-lines, supporting
 *     rows, and metadata.
 *
 * The interpretation engine (interpretationEngine.ts) iterates the
 * RESULTS_TEMPLATES array in descending priority order and picks the
 * first matching template. If no template fires, a default calm-case
 * result is returned by the orchestrator.
 *
 * Phase 3.1 ships one template: the Concentrated Feed pattern from
 * Outcome A of the Results design spec. Additional outcomes (Broadly
 * sourced, Heavy ad load, Political shift) ship in subsequent phases.
 *
 * Reference: mobile/audits/2x-results-design/decisions.md
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import { computeRollingAverage } from '../derivations/rollingAverage';
import type {
  FactRow,
  InterpretationContext,
  InterpretationResult,
  Subline,
  SupportingRow,
} from '../interpretation-types';
import { capitalizePlatform } from '../utils/platformDisplay';
import { getComparativeAnchor } from '../utils/comparativeAnchor';

// Concentration threshold: when the top creator's share of feed
// reaches this percent or higher, the Concentrated Feed verdict fires.
const CONCENTRATION_THRESHOLD_PCT = 25;

// Tone-bucket dominance threshold: when one tone bucket holds at
// least this share of known-valence items, the supporting row labels
// the feed as "Mostly <tone>". Below this threshold, "Mixed tone".
const TONE_DOMINANCE_THRESHOLD_PCT = 50;

export interface ResultsTemplate {
  id: string;
  when: (ctx: InterpretationContext) => boolean;
  priority: number;
  render: (ctx: InterpretationContext) => InterpretationResult;
}

// ============================================
// Template: Concentrated Feed (Outcome A)
// ============================================

const concentratedFeedTemplate: ResultsTemplate = {
  id: 'results.concentrated_feed',
  priority: 50,
  when: (ctx) => {
    const top = ctx.dashboardData.topCreators[0];
    const totalPosts = ctx.dashboardData.totalPosts;
    if (!top || totalPosts <= 0) return false;
    const share = (top.count / totalPosts) * 100;
    return share >= CONCENTRATION_THRESHOLD_PCT;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const totalPosts = dashboardData.totalPosts;

    // Top creator share and top-three share.
    const top = dashboardData.topCreators[0];
    const topShare =
      top && totalPosts > 0
        ? Math.round((top.count / totalPosts) * 100)
        : 0;
    const top3Count = dashboardData.topCreators
      .slice(0, 3)
      .reduce((sum, c) => sum + c.count, 0);
    const top3Share =
      totalPosts > 0 ? Math.round((top3Count / totalPosts) * 100) : 0;

    const verdict = `A few voices are shaping your ${platformLabel} feed.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `Your top creator made up ${topShare}% of what you saw, and the top three made up ${top3Share}%.`,
      },
      {
        mode: 'LIKELY',
        text:
          'Sustained engagement signals strong interest, and the algorithm responds to that strongly.',
      },
    ];

    const supportingRows: SupportingRow[] = [
      buildAdsRow(activeScan, scans, dashboardData, platform),
      buildPatternsRow(dashboardData),
      buildPoliticalRow(activeScan, scans, dashboardData, platform),
      buildToneRow(dashboardData),
    ];

    return {
      verdict,
      sublines,
      supportingRows,
      findingDot: true,
      meta: {
        surface: 'results',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Supporting-row builders
// ============================================
//
// Each row builder produces one FactRow for the supporting card.
// Anchors come from getComparativeAnchor when a rolling average is
// available; otherwise the anchor is omitted (per the design spec's
// first-scan calm-case behavior).

function buildAdsRow(
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

function buildPatternsRow(
  dashboardData: InterpretationContext['dashboardData'],
): FactRow {
  // For Phase 3.1 the Patterns row surfaces the top content type
  // (Video / Photo / etc.) rather than the top topic category. Topic
  // categories live on Gemini's per-item topics field but aren't
  // pre-aggregated into a top-overall field on DashboardData yet, so
  // this is a faithful-but-partial implementation. Recurrence anchor
  // ("same as last 4 scans") deferred until cross-scan recurrence
  // detection lands in a later phase.
  const top = dashboardData.contentTypes[0];
  return {
    variant: 'fact',
    label: 'Patterns',
    value: top ? `Top: ${top.label}` : 'No pattern data',
  };
}

function buildPoliticalRow(
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

function buildToneRow(
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
// Template registry
// ============================================

export const RESULTS_TEMPLATES: ResultsTemplate[] = [concentratedFeedTemplate];
