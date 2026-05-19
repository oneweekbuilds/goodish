/**
 * Dashboard Politics ("Political Exposure") interpretation templates.
 *
 * Tab 4's design-canonical verdict is the concentration claim
 * "Your political exposure isn't varied — it's coming from one place."
 * (decisions.md L174). Trajectory framing — climbing political share
 * — is the headline of Tab 1 Overview's `political_shift` template,
 * not Tab 4's. Here, trajectory serves as the *fallback* headline
 * (priority 60) and a future TrajectoryRow primitive will surface it
 * in the supporting card.
 *
 * Three templates in priority order:
 *
 *   1. politicalCreatorDominance (priority 70) — the canonical Tab 4
 *      verdict. Fires when one political-content creator owns >= 50%
 *      of this scan's political slice AND has only appeared across a
 *      small number of recent scans (recency-of-arrival edge). Uses
 *      `topPoliticalSource` from single-scan analysis (single-scan
 *      dominance) PLUS computePoliticalCreatorRecurrence (cross-scan
 *      recency). The design-spec LIKELY phrase "narrowed in on that
 *      source as a reliable engagement-driver" is pre-cleared per
 *      decisions.md:249 — used near-verbatim with the tail rewritten
 *      to keep the line firmly on the mechanism side rather than
 *      prescription side of the voice rule.
 *
 *   2. politicalTrajectory (priority 60) — fallback headline when no
 *      single source dominates but politicalPct has been growing as
 *      a share of the feed across the trajectory window. Requires
 *      >= 3 chronological entries, monotonic non-decreasing values,
 *      AND last-minus-first delta >= 3 points. Verdict frame uses
 *      "growing share" (proportion-emphasis) deliberately distinct
 *      from Overview's "climbing" (rate-emphasis) — same data axis,
 *      different surface framing.
 *
 *   3. calmCase (priority 10) — catch-all with four variants:
 *        - enrichment-not-available: politicalAnalysis === null
 *          (Gemini classification didn't complete).
 *        - no-political-content: AI ran, politicalCount === 0.
 *        - low-political-share: hasPoliticsData true, politicalPct < 5.
 *          Reserved range; the 5-8% zone falls through to fallback or
 *          trajectory (whichever predicate triggers).
 *        - fallback: politics present, no dominance, no growth, not low.
 *
 * Voice rule (locked + Tab 4-specific clearance notes):
 *   - No anthropomorphism — "the algorithm wants you angry" / "decides"
 *     / "feels" / "confident". The design spec's "narrowed in on" is
 *     cleared per decisions.md:249 as describing model outcome state,
 *     not algorithm desire.
 *   - No moralizing about user state or political content itself.
 *   - No prescriptive language ("you should diversify") — COACHING
 *     territory. The design spec's "unless you actively skip or
 *     downvote" tail (decisions.md:178) was rewritten here to
 *     "unless engagement signals shift away from it" — pure
 *     mechanism, no directive to the reader.
 *
 * Enrichment-gap guard: every template predicate that reads
 * `politicalAnalysis` fields checks `politicalAnalysis !== null` AND
 * `politicalCount > 0` first. When political enrichment is absent,
 * ONLY the calm-case enrichment-not-available variant fires —
 * dominance and trajectory templates must NOT misfire on a
 * missing-data state.
 *
 * Threshold-floor note: the dominance predicate combines the
 * user-specified `politicalCount >= 5` floor with the data-layer
 * constraint that `topPoliticalSource` is null below `politicalCount
 * >= 10` (see extractPoliticalAnalysis in computeDashboardData). In
 * practice the effective floor is 10. The explicit `politicalCount
 * >= 5` check is retained to document intent.
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md Tab 4
 */

import { computePoliticalCreatorRecurrence } from '../derivations/politicalCreatorRecurrence';
import {
  computeMetricTrajectory,
  type TrajectoryEntry,
} from '../derivations/rollingAverage';
import type {
  InterpretationContext,
  Subline,
} from '../interpretation-types';
import { capitalizePlatform } from '../utils/platformDisplay';
import type { ResultsTemplate } from './results';
import { buildStandardSupportingRows } from './supportingRows';

// ============================================
// Thresholds
// ============================================

/** Dominance template: minimum political-post floor before the
 *  verdict's editorial framing reads as a real pattern. The data
 *  layer further constrains topPoliticalSource to null below
 *  politicalCount >= 10, so the effective floor is 10. */
const DOMINANCE_MIN_POLITICAL_COUNT = 5;

/** Dominance template: single source must own at least this share
 *  of the scan's political content for "coming from one place" to
 *  read truthfully. Design-canonical example: 73%. */
const DOMINANCE_TOP_SOURCE_PCT = 50;

/** Dominance template: matching political-creator recurrence record's
 *  scanCount must be at or below this ceiling. Captures the
 *  recency-of-arrival edge — "only appeared in your last N scans."
 *  Design-canonical example: 2 of recent scans. */
const DOMINANCE_RECENCY_MAX_SCAN_COUNT = 3;

/** Above this scanCount, the design-canonical "only appeared in your
 *  last N scans" phrasing degrades into "recent scans" — preserves
 *  the recency framing without making mathematically uncomfortable
 *  claims for higher counts. */
const PRECISE_RECENCY_CEILING = 3;

/** Trajectory template: minimum current political share for "growing
 *  share" to register as editorially meaningful. Below this, low
 *  share calm variant owns the framing. */
const TRAJECTORY_MIN_CURRENT_PCT = 8;

/** Trajectory template: minimum first-to-last delta across the
 *  chronological window. Combined with the monotonic non-decreasing
 *  check, this filters noisy series that happen to end higher than
 *  they started. */
const TRAJECTORY_MIN_DELTA_PCT = 3;

/** Calm-case low-political-share variant trigger. The 5-8% zone
 *  falls through to fallback (or trajectory if it fires); below 5%
 *  the "quiet sliver" framing is honest. */
const LOW_POLITICAL_SHARE_MAX_PCT = 5;

// ============================================
// Helpers
// ============================================

/**
 * Locate the political-creator-recurrence record that matches a given
 * single-scan top-source handle. The recurrence wrapper canonicalizes
 * handles to lowercase; topPoliticalSource carries the handle in its
 * original casing.
 */
function findRecurrenceRecordFor(
  ctx: InterpretationContext,
  topSourceHandle: string,
) {
  const recurrence = computePoliticalCreatorRecurrence(ctx.scans, ctx.platform);
  const key = (topSourceHandle ?? '').toLowerCase();
  return recurrence.records.find((r) => r.handle === key) ?? null;
}

/**
 * Render the recency-of-arrival phrase based on the recurrence
 * record's scanCount. Per Phase 6.4.1 approval:
 *   1            → "this scan only"
 *   2            → "your last two scans"
 *   3            → "your last three scans"
 *   above 3      → "recent scans" (precision degrades editorially)
 */
function recencyPhrase(scanCount: number): string {
  if (scanCount <= 1) return 'this scan only';
  if (scanCount === 2) return 'your last two scans';
  if (scanCount === 3) return 'your last three scans';
  if (scanCount <= PRECISE_RECENCY_CEILING) {
    // Defensive — current PRECISE_RECENCY_CEILING === 3 so this
    // branch is unreachable. Kept so a future tuning to ceiling=4
    // produces correct copy.
    return `your last ${scanCount} scans`;
  }
  return 'recent scans';
}

/** Check that a TrajectoryEntry[] is monotonic non-decreasing. */
function isMonotonicNonDecreasing(entries: TrajectoryEntry[]): boolean {
  for (let i = 1; i < entries.length; i++) {
    if (entries[i]!.value < entries[i - 1]!.value) return false;
  }
  return true;
}

/**
 * Render the chronological reading sequence for trajectory OBSERVED.
 * Design-canonical for 6-entry window: "4%, then 4%, then 4%, then
 * 5%, then 7%, now 11%." Compresses gracefully for shorter windows
 * down to the 3-entry minimum: "4%, then 7%, now 11%."
 */
function trajectoryReadingSequence(entries: TrajectoryEntry[]): string {
  if (entries.length === 0) return '';
  if (entries.length === 1) return `${Math.round(entries[0]!.value)}%`;
  const rounded = entries.map((e) => Math.round(e.value));
  const last = rounded[rounded.length - 1]!;
  const head = rounded.slice(0, -1);
  const headPhrase = head
    .map((v, i) => (i === 0 ? `${v}%` : `then ${v}%`))
    .join(', ');
  return `${headPhrase}, now ${last}%`;
}

// ============================================
// Template: Political Creator Dominance (priority 70)
// ============================================
//
// Design-canonical Tab 4 headline. Concentration-dominance + recency-
// of-arrival pattern.

const politicalCreatorDominanceTemplate: ResultsTemplate = {
  id: 'dashboard.politics.political_creator_dominance',
  priority: 70,
  when: (ctx) => {
    const pol = ctx.dashboardData.politicalAnalysis;
    // Enrichment-gap guard.
    if (!pol || pol.politicalCount === 0) return false;
    if (pol.politicalCount < DOMINANCE_MIN_POLITICAL_COUNT) return false;
    const top = pol.topPoliticalSource;
    if (!top) return false;
    if (top.pctOfPolitical < DOMINANCE_TOP_SOURCE_PCT) return false;
    const record = findRecurrenceRecordFor(ctx, top.handle);
    if (!record) return false;
    return record.scanCount <= DOMINANCE_RECENCY_MAX_SCAN_COUNT;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const pol = dashboardData.politicalAnalysis!;
    const top = pol.topPoliticalSource!;
    const record = findRecurrenceRecordFor(ctx, top.handle)!;

    const politicalPct = Math.round(pol.politicalPct);
    const topSharePct = Math.round(top.pctOfPolitical);
    const displayName = record.displayName || top.handle;
    const recency = recencyPhrase(record.scanCount);

    const verdict = `Your political exposure isn’t varied — it’s coming from one place.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `${politicalPct}% of your feed was political this scan. Of that, ${topSharePct}% came from ${displayName} alone. They’ve appeared in ${recency}.`,
      },
      {
        mode: 'LIKELY',
        text:
          'When a single source dominates a content category like this, the algorithm has narrowed in on that source as a reliable engagement-driver for political content. The share of that source usually keeps growing across sessions unless engagement signals shift away from it.',
      },
    ];

    return {
      verdict,
      sublines,
      supportingRows: buildStandardSupportingRows(
        activeScan,
        scans,
        dashboardData,
        platform,
      ),
      findingDot: true,
      meta: {
        surface: 'dashboard.politics',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Political Trajectory (priority 60)
// ============================================
//
// Fallback headline when dominance doesn't fire. Surface-differentiated
// from Overview's political_shift via "growing share" (proportion-
// emphasis) framing.

const politicalTrajectoryTemplate: ResultsTemplate = {
  id: 'dashboard.politics.political_trajectory',
  priority: 60,
  when: (ctx) => {
    const pol = ctx.dashboardData.politicalAnalysis;
    // Enrichment-gap guard.
    if (!pol || pol.politicalCount === 0) return false;
    if (pol.politicalPct < TRAJECTORY_MIN_CURRENT_PCT) return false;
    const trajectory = computeMetricTrajectory(
      ctx.scans,
      ctx.platform,
      'political_pct',
    );
    if (trajectory === null || trajectory.length < 3) return false;
    if (!isMonotonicNonDecreasing(trajectory)) return false;
    const first = trajectory[0]!.value;
    const last = trajectory[trajectory.length - 1]!.value;
    return last - first >= TRAJECTORY_MIN_DELTA_PCT;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const trajectory = computeMetricTrajectory(scans, platform, 'political_pct')!;

    const reading = trajectoryReadingSequence(trajectory);

    const verdict = `Politics has been a growing share of your ${platformLabel} feed.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `Political content has climbed across your last ${trajectory.length} scans — ${reading}.`,
      },
      {
        mode: 'LIKELY',
        text:
          'As one content category steadily takes a larger share of the feed, recent engagement signals tend to keep weighting toward more of the same. Proportional growth usually persists across multiple sessions before the mix rotates back.',
      },
    ];

    return {
      verdict,
      sublines,
      supportingRows: buildStandardSupportingRows(
        activeScan,
        scans,
        dashboardData,
        platform,
      ),
      findingDot: true,
      meta: {
        surface: 'dashboard.politics',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Calm Case (priority 10, catch-all)
// ============================================

type CalmVariant =
  | 'enrichment-not-available'
  | 'no-political-content'
  | 'low-political-share'
  | 'fallback';

const calmCaseTemplate: ResultsTemplate = {
  id: 'dashboard.politics.calm_case',
  priority: 10,
  when: () => true,
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const variant = determineCalmVariant(dashboardData);
    const { verdict, sublines } = buildCalmVerdictAndSublines(
      variant,
      dashboardData,
      platformLabel,
    );

    return {
      verdict,
      sublines,
      supportingRows: buildStandardSupportingRows(
        activeScan,
        scans,
        dashboardData,
        platform,
      ),
      findingDot: false,
      meta: {
        surface: 'dashboard.politics',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

function determineCalmVariant(
  dashboardData: InterpretationContext['dashboardData'],
): CalmVariant {
  const pol = dashboardData.politicalAnalysis;
  if (!pol) {
    return 'enrichment-not-available';
  }
  if (pol.politicalCount === 0) {
    return 'no-political-content';
  }
  if (pol.politicalPct < LOW_POLITICAL_SHARE_MAX_PCT) {
    return 'low-political-share';
  }
  return 'fallback';
}

function buildCalmVerdictAndSublines(
  variant: CalmVariant,
  dashboardData: InterpretationContext['dashboardData'],
  platformLabel: string,
): { verdict: string; sublines: Subline[] } {
  if (variant === 'enrichment-not-available') {
    return {
      verdict: `Political classification isn’t available for this ${platformLabel} scan.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text:
            'Political content detection requires backend enrichment that didn’t complete for this scan.',
        },
        {
          mode: 'LIKELY',
          text:
            'Political classification is asynchronous and depends on backend processing finishing before the scan data is interpreted. When enrichment is unavailable, the political breakdown sections below stay empty.',
        },
      ],
    };
  }

  if (variant === 'no-political-content') {
    const pol = dashboardData.politicalAnalysis!;
    const totalAnalyzed = pol.totalAnalyzed;
    return {
      verdict: `Your ${platformLabel} scan didn’t include political content.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `Of ${totalAnalyzed} posts analyzed in this scan, none registered as political.`,
        },
        {
          mode: 'LIKELY',
          text:
            'Feeds vary scan-to-scan in whether political content surfaces. When recent engagement doesn’t weight political categories, the recommendation pool tends to skew toward other topics — entertainment, tech, lifestyle, depending on the broader interest profile.',
        },
      ],
    };
  }

  if (variant === 'low-political-share') {
    const pol = dashboardData.politicalAnalysis!;
    const politicalPct = Math.round(pol.politicalPct);
    const politicalCount = pol.politicalCount;
    const totalAnalyzed = pol.totalAnalyzed;
    return {
      verdict: `Politics was a quiet sliver of your ${platformLabel} feed today.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `Political content was ${politicalPct}% of your feed this scan — ${politicalCount} of ${totalAnalyzed} posts.`,
        },
        {
          mode: 'LIKELY',
          text:
            'A low political share usually reflects an interest profile weighted toward non-political categories. Small shares like this tend to fluctuate scan-to-scan with which creators happen to post.',
        },
      ],
    };
  }

  // Fallback — politics present, not dominant, not growing, not low.
  const pol = dashboardData.politicalAnalysis!;
  const politicalPct = Math.round(pol.politicalPct);
  const politicalCount = pol.politicalCount;
  const totalAnalyzed = pol.totalAnalyzed;

  return {
    verdict: `Politics held steady at about ${politicalPct}% of your ${platformLabel} feed.`,
    sublines: [
      {
        mode: 'OBSERVED',
        text: `Political content made up ${politicalPct}% of this scan — ${politicalCount} of ${totalAnalyzed} posts.`,
      },
      {
        mode: 'LIKELY',
        text:
          'Stable political share usually means the categories you engage with aren’t shifting much. The percentage often holds within a narrow band across consecutive scans when nothing in the engagement profile is changing.',
      },
    ],
  };
}

// ============================================
// Template registry
// ============================================

export const DASHBOARD_POLITICS_TEMPLATES: ResultsTemplate[] = [
  politicalCreatorDominanceTemplate,
  politicalTrajectoryTemplate,
  calmCaseTemplate,
];
