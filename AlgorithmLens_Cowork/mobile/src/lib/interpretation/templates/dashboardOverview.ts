/**
 * Dashboard Overview interpretation templates.
 *
 * The Overview tab is the "lead with the strongest finding" surface
 * of the Dashboard. Where the Results screen interprets one scan in
 * isolation, the Overview tab interprets the same scan in the context
 * of the user's history: trajectories, shifts, and drift patterns
 * across the prior scans are what the Overview hero should surface
 * first.
 *
 * Four templates in priority order:
 *
 *   1. politicalShift  (priority 70) — political content has climbed
 *      meaningfully vs the user's rolling average. The strongest
 *      candidate when one exists, given the design spec's canonical
 *      Overview worked example ("Your feed has been shifting toward
 *      news for two weeks.").
 *
 *   2. heavyAdLoad     (priority 60) — ad density is unusually high
 *      vs the user's rolling average. Less common than political
 *      shift in real data but a real signal when it fires.
 *
 *   3. concentratedFeed (priority 50) — same predicate as the Results
 *      template (top creator >= 25%) but with Overview-context
 *      verdict copy. Duplicated per-surface deliberately: the
 *      predicate is identical (~10 lines) but the framing differs.
 *      If a third surface needs this predicate we extract the test
 *      into a shared helper.
 *
 *   4. calmCase        (priority 10) — catch-all with `when: () => true`.
 *      Three variants (high-suggested, content-type-dominant, fallback).
 *      Copy is Overview-specific, NOT a clone of the Results calm-case
 *      strings — the design spec explicitly forbids templates that
 *      re-emit unchanged across surfaces.
 *
 * Voice rule (locked): "Algorithms respond to signals; they don't
 * decide, feel, want, or read as confident." All LIKELY copy uses
 * mechanism language ("weights", "fills", "responds", "concentrates")
 * and avoids agentive verbs.
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md (Tab 1
 * worked example), mobile/audits/2x-interpretation-engine-scoping/decisions.md
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import { computeRollingAverage } from '../derivations/rollingAverage';
import type {
  InterpretationContext,
  InterpretationResult,
  Subline,
  SupportingRow,
} from '../interpretation-types';
import { capitalizePlatform } from '../utils/platformDisplay';
import type { ResultsTemplate } from './results';
import {
  buildAdsRow,
  buildPatternsRow,
  buildPoliticalRow,
  buildToneRow,
} from './supportingRows';

// ============================================
// Thresholds
// ============================================
//
// Starting calibrations. Will tune against real data once we have
// fixtures that exercise the dramatic-finding branches (the smoke
// fixture is 100% suggested with 0% political, so it lands in calm-
// case; political-shift and heavy-ads thresholds don't get smoke-test
// signal until we have a fixture that fires them).

/** Political content absolute floor: below this share, no shift. */
const POLITICAL_SHIFT_ABS_PCT = 7;
/** Political content rise multiplier vs rolling average. */
const POLITICAL_SHIFT_RATIO = 1.5;

/** Ad density absolute floor: below this share, no heavy-ads finding. */
const HEAVY_ADS_ABS_PCT = 15;
/** Ad density rise multiplier vs rolling average. */
const HEAVY_ADS_RATIO = 1.5;

/** Top-creator share threshold for the concentrated-feed verdict. */
const CONCENTRATION_THRESHOLD_PCT = 25;

/** Suggested-ratio threshold for the calm-case high-suggested variant. */
const CALM_HIGH_SUGGESTED_THRESHOLD_PCT = 80;

/** Single-content-type dominance threshold for calm-case variant 2. */
const CALM_CONTENT_TYPE_DOMINANCE_PCT = 50;

// ============================================
// Template: Political Shift (priority 70)
// ============================================

const politicalShiftTemplate: ResultsTemplate = {
  id: 'dashboard.overview.political_shift',
  priority: 70,
  when: (ctx) => {
    const pol = ctx.dashboardData.politicalAnalysis;
    if (!pol || pol.politicalCount === 0) return false;
    const currentPct = pol.politicalPct;
    if (currentPct < POLITICAL_SHIFT_ABS_PCT) return false;
    const rollingAvg = computeRollingAverage(
      ctx.scans,
      ctx.platform,
      'political_pct',
      { excludeScanId: ctx.activeScan.id },
    );
    // Require non-null rolling average — "climbing" implies a
    // comparison against history. First-scan users fall through to
    // calm-case rather than getting a trajectory verdict that has
    // nothing to anchor.
    if (rollingAvg === null) return false;
    return currentPct >= POLITICAL_SHIFT_RATIO * rollingAvg;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const pol = dashboardData.politicalAnalysis!;
    const currentPct = Math.round(pol.politicalPct);
    const rollingAvg = computeRollingAverage(scans, platform, 'political_pct', {
      excludeScanId: activeScan.id,
    });
    const rollAvgPct = rollingAvg !== null ? Math.round(rollingAvg) : 0;

    const verdict = `Politics has been climbing in your ${platformLabel} feed.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `Political content is at ${currentPct}% this scan, up from your ${rollAvgPct}% average across prior scans.`,
      },
      {
        mode: 'LIKELY',
        text: 'When a content category produces engagement signals, recent activity gets weighted more heavily in what surfaces next, and the share tends to grow across sessions until something interrupts the pattern.',
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
        surface: 'dashboard.overview',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Heavy Ad Load (priority 60)
// ============================================

const heavyAdLoadTemplate: ResultsTemplate = {
  id: 'dashboard.overview.heavy_ad_load',
  priority: 60,
  when: (ctx) => {
    const currentPct = ctx.dashboardData.adPct;
    if (currentPct < HEAVY_ADS_ABS_PCT) return false;
    const rollingAvg = computeRollingAverage(
      ctx.scans,
      ctx.platform,
      'ad_pct',
      { excludeScanId: ctx.activeScan.id },
    );
    if (rollingAvg === null) return false;
    return currentPct >= HEAVY_ADS_RATIO * rollingAvg;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const currentPct = Math.round(dashboardData.adPct);
    const rollingAvg = computeRollingAverage(scans, platform, 'ad_pct', {
      excludeScanId: activeScan.id,
    });
    const rollAvgPct = rollingAvg !== null ? Math.round(rollingAvg) : 0;

    const verdict = `Unusually ad-heavy ${platformLabel} today.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `Ads made up ${currentPct}% of this scan, well above your ${rollAvgPct}% average.`,
      },
      {
        mode: 'LIKELY',
        text: 'Ad density swings with platform inventory and what targeting reads from recent activity. Spikes usually flatten as the mix rotates back to its typical range.',
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
        surface: 'dashboard.overview',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Concentrated Feed (priority 50)
// ============================================
//
// Same predicate as the Results-screen concentrated-feed template.
// Different verdict copy: the Results screen says "A few voices are
// shaping..." which works for a scan-summary frame; the Overview tab
// emphasizes "today" because Overview reads as a daily-state surface
// where the user is scanning for what's changed.

const concentratedFeedTemplate: ResultsTemplate = {
  id: 'dashboard.overview.concentrated_feed',
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
    const top = dashboardData.topCreators[0];
    const topShare =
      top && totalPosts > 0 ? Math.round((top.count / totalPosts) * 100) : 0;
    const top3Count = dashboardData.topCreators
      .slice(0, 3)
      .reduce((sum, c) => sum + c.count, 0);
    const top3Share =
      totalPosts > 0 ? Math.round((top3Count / totalPosts) * 100) : 0;

    const verdict = `One voice is doing most of the talking in your ${platformLabel} feed today.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `Your top creator accounted for ${topShare}% of what you saw, and the top three made up ${top3Share}%.`,
      },
      {
        mode: 'LIKELY',
        text: 'Engagement patterns concentrate the feed around accounts that reliably hold attention. The narrower the concentration, the more recent activity reinforces it.',
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
        surface: 'dashboard.overview',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Calm Case (priority 10, catch-all)
// ============================================
//
// Fires when none of the higher-priority templates match. Three
// variants based on the most notable characteristic of the scan in
// the absence of a dramatic finding:
//
//   - high-suggested:        suggestedPct >= 80
//   - content-type-dominant: top content type >= 50% (skipping Unknown)
//   - fallback:              genuine "nothing distinct" path
//
// Copy is deliberately distinct from the Results calm-case copy. The
// Results surface frames the scan in isolation; Overview frames the
// scan in the context of "today's mix" — a daily-state read rather
// than a session summary.

type CalmVariant = 'high-suggested' | 'content-type-dominant' | 'fallback';

const calmCaseTemplate: ResultsTemplate = {
  id: 'dashboard.overview.calm_case',
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
        surface: 'dashboard.overview',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

function determineCalmVariant(
  dashboardData: InterpretationContext['dashboardData'],
): CalmVariant {
  if (dashboardData.suggestedPct >= CALM_HIGH_SUGGESTED_THRESHOLD_PCT) {
    return 'high-suggested';
  }
  const topType = dashboardData.contentTypes[0];
  if (
    topType &&
    topType.label !== 'Unknown' &&
    topType.percentage >= CALM_CONTENT_TYPE_DOMINANCE_PCT
  ) {
    return 'content-type-dominant';
  }
  return 'fallback';
}

function buildCalmVerdictAndSublines(
  variant: CalmVariant,
  dashboardData: InterpretationContext['dashboardData'],
  platformLabel: string,
): { verdict: string; sublines: Subline[] } {
  if (variant === 'high-suggested') {
    const suggestedPct = Math.round(dashboardData.suggestedPct);
    const followedPct = Math.round(dashboardData.followedPct);
    return {
      verdict: `Most of your ${platformLabel} feed today came from suggestions, not accounts you follow.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${suggestedPct}% of posts were suggested, with ${followedPct}% from accounts you follow.`,
        },
        {
          mode: 'LIKELY',
          text: 'Suggestion weights fill more of the feed when activity from followed accounts is sparse. The mix depends on what your recent engagement signals you have been interested in.',
        },
      ],
    };
  }

  if (variant === 'content-type-dominant') {
    const top = dashboardData.contentTypes[0]!;
    const typePlural = pluralizeContentType(top.label);
    const pct = Math.round(top.percentage);
    return {
      verdict: `Your ${platformLabel} session was dominated by ${typePlural} today.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${pct}% of posts were ${typePlural}, the dominant format in this scan.`,
        },
        {
          mode: 'LIKELY',
          text: 'Watch-time on a single format compounds. The more you watch, the more that format weights in upcoming suggestions until your engagement broadens.',
        },
      ],
    };
  }

  // Fallback variant. Specific by giving the post count and ad density;
  // avoids the boilerplate "your feed is normal" pattern the design
  // spec explicitly forbids.
  const totalPosts = dashboardData.totalPosts;
  const adPct = Math.round(dashboardData.adPct);
  const pol = dashboardData.politicalAnalysis;
  const politicalPct = pol ? Math.round(pol.politicalPct) : 0;
  return {
    verdict: `${totalPosts} posts captured today, with the usual mix.`,
    sublines: [
      {
        mode: 'OBSERVED',
        text: `${totalPosts} posts this session. Ads at ${adPct}%, political content at ${politicalPct}%.`,
      },
      {
        mode: 'LIKELY',
        text: 'Without a strong concentration in any direction, the feed reflects your steady engagement patterns. No single category is pulling the mix today.',
      },
    ],
  };
}

/**
 * Lowercase + naive English pluralization for content-type labels.
 * countContentTypes capitalizes the first letter ("Video", "Short",
 * "Photo"); verdict copy reads more naturally with lowercase plurals.
 * Same helper as the Results calm-case template — small enough to
 * duplicate rather than export from a shared utility.
 */
function pluralizeContentType(label: string): string {
  const lower = label.toLowerCase();
  return lower.endsWith('s') ? lower : `${lower}s`;
}

// ============================================
// Standard supporting rows
// ============================================

function buildStandardSupportingRows(
  activeScan: ScanDetail,
  scans: ScanDetail[],
  dashboardData: InterpretationContext['dashboardData'],
  platform: string,
): SupportingRow[] {
  return [
    buildAdsRow(activeScan, scans, dashboardData, platform),
    buildPatternsRow(dashboardData),
    buildPoliticalRow(activeScan, scans, dashboardData, platform),
    buildToneRow(dashboardData),
  ];
}

// ============================================
// Template registry
// ============================================

export const DASHBOARD_OVERVIEW_TEMPLATES: ResultsTemplate[] = [
  politicalShiftTemplate,
  heavyAdLoadTemplate,
  concentratedFeedTemplate,
  calmCaseTemplate,
];

// Re-export InterpretationResult so consumers don't need a separate
// import for the engine output type when working with these templates.
export type { InterpretationResult };
