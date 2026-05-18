/**
 * Dashboard Sources ("Who Shapes Your Feed") interpretation templates.
 *
 * The Sources tab is the design-canonical home for creator-recurrence
 * verdicts. The 2.x Dashboard design spec's Tab 2 worked example
 * leads with "One creator has quietly become your most-seen voice"
 * — recurrence as the headline, not a supporting-row signal. Where
 * the Results and Overview persistent-creator templates (Phase 5.3)
 * surface recurrence on more general surfaces, Sources is where the
 * verbal interpretation was authored for.
 *
 * Three templates in priority order:
 *
 *   1. persistentCreator (priority 60) — fires when one creator
 *      dominates recurrence across the window. Surface-aligned
 *      verdict copy uses the design spec's "quietly become your
 *      most-seen voice" framing, distinct from the Results
 *      ("steady presence") and Overview ("keeps showing up")
 *      variants of the same predicate.
 *
 *   2. concentratedFeed (priority 50) — fires at the same
 *      top-creator-share >= 25% predicate as the other surfaces,
 *      but framed around source narrowness ("built from a narrow
 *      set of sources") rather than dramatic concentration ("a few
 *      voices are shaping..."). Adds the unique-creator-count
 *      detail Sources users care about.
 *
 *   3. calmCase (priority 10) — catch-all with three variants
 *      tuned for the Sources framing:
 *        - high-suggested:    "The sources in your feed were almost
 *                              all suggestions today."
 *        - source-spread:     Sources-unique. Fires when top-creator
 *                              share is low AND uniqueCreatorCount
 *                              is high — broad-mix pattern is its
 *                              own observation.
 *        - fallback:          "[N] unique creators contributed to
 *                              your feed today."
 *
 * Voice rule (locked): no anthropomorphism. All LIKELY copy uses
 * mechanism language. The persistent-creator LIKELY uses the
 * design spec's pre-cleared rewrite ("the algorithm has narrowed in
 * on them as a reliable signal for what to show next" — "narrowed
 * in" describes model state, not algorithm desire).
 *
 * Two design-spec features deferred (Phase 6.1.1 noted):
 *   - "always in your top 5" sub-claim — requires per-scan top-N
 *     tracking the recurrence derivation doesn't yet produce.
 *   - Multiple CreatorRow rows in the supporting card — CreatorRow
 *     primitive ships in Phase 7+ supporting-row variants. For now,
 *     Top voice (Phase 5.2.5 FactRow prepend) surfaces the lead
 *     creator and the full ranked list lives in the 1.1.x "Top
 *     Creators" section beneath the engine output.
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md Tab 2
 */

import { computeCreatorRecurrence } from '../derivations/creatorRecurrence';
import type {
  InterpretationContext,
  InterpretationResult,
  Subline,
} from '../interpretation-types';
import { capitalizePlatform } from '../utils/platformDisplay';
import type { ResultsTemplate } from './results';
import { buildStandardSupportingRows } from './supportingRows';

// ============================================
// Thresholds
// ============================================

/** Persistent-creator thresholds, mirrors Phase 5.3 templates. */
const PERSISTENT_CREATOR_MIN_SCAN_COUNT = 3;
const PERSISTENT_CREATOR_MIN_WINDOW = 4;

/** Top-creator-share threshold for the concentrated-feed verdict. */
const CONCENTRATION_THRESHOLD_PCT = 25;

/** Suggested-ratio threshold for the calm-case high-suggested variant. */
const CALM_HIGH_SUGGESTED_THRESHOLD_PCT = 80;

/** Source-spread variant thresholds. Top creator must be below this
 *  share AND unique-creator count must be at or above the floor for
 *  the broad-mix pattern to fire. */
const CALM_SOURCE_SPREAD_TOP_SHARE_PCT = 15;
const CALM_SOURCE_SPREAD_MIN_UNIQUE = 8;

// ============================================
// Template: Persistent Creator (priority 60)
// ============================================

const persistentCreatorTemplate: ResultsTemplate = {
  id: 'dashboard.sources.persistent_creator',
  priority: 60,
  when: (ctx) => {
    const recurrence = computeCreatorRecurrence(ctx.scans, ctx.platform);
    const top = recurrence.records[0];
    if (!top) return false;
    if (top.scanCount < PERSISTENT_CREATOR_MIN_SCAN_COUNT) return false;
    if (recurrence.windowScanCount < PERSISTENT_CREATOR_MIN_WINDOW) {
      return false;
    }
    return true;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const recurrence = computeCreatorRecurrence(scans, platform);
    const top = recurrence.records[0]!;
    const { displayName, scanCount, totalPosts } = top;
    const windowScanCount = recurrence.windowScanCount;

    // Look up the recurrer's current-scan share by matching the
    // canonical (lowercased) handle to dashboardData.topCreators.
    // The top recurrer might or might not be present in the active
    // scan — they could be a creator whose last appearance was in a
    // prior scan within the window. Frame OBSERVED differently in
    // each case so we don't claim "made up 0% of this scan."
    const inThisScan = dashboardData.topCreators.find(
      (c) => (c.name?.toLowerCase() ?? '') === top.handle,
    );
    const currentSharePct = inThisScan
      ? Math.round(inThisScan.percentage ?? 0)
      : 0;

    const verdict = `One creator has quietly become your most-seen voice on ${platformLabel}.`;

    const observedText =
      currentSharePct > 0
        ? `${displayName} has appeared in ${scanCount} of your last ${windowScanCount} scans and made up ${currentSharePct}% of this scan.`
        : `${displayName} has appeared in ${scanCount} of your last ${windowScanCount} scans, with ${totalPosts} posts across them.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: observedText,
      },
      {
        mode: 'LIKELY',
        text:
          'Their content consistently triggers your engagement enough that the algorithm has narrowed in on them as a reliable signal for what to show next. This pattern typically forms when a user watches 3 or more videos from the same creator in a short window.',
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
        surface: 'dashboard.sources',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Concentrated Feed (priority 50)
// ============================================

const concentratedFeedTemplate: ResultsTemplate = {
  id: 'dashboard.sources.concentrated_feed',
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
    const uniqueCount = dashboardData.uniqueCreatorCount;

    const verdict = `Your ${platformLabel} feed is built from a narrow set of sources today.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `Your top creator made up ${topShare}% of what you saw, the top three made up ${top3Share}%, and ${uniqueCount} unique creators contributed in total.`,
      },
      {
        mode: 'LIKELY',
        text:
          'When the same handful of accounts produce most of what gets engagement, the algorithm reads that as a reliable pattern and narrows recommendations toward them. Broadening usually requires intentional engagement with new sources.',
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
        surface: 'dashboard.sources',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Calm Case (priority 10, catch-all)
// ============================================

type CalmVariant = 'high-suggested' | 'source-spread' | 'fallback';

const calmCaseTemplate: ResultsTemplate = {
  id: 'dashboard.sources.calm_case',
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
        surface: 'dashboard.sources',
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
  const top = dashboardData.topCreators[0];
  const totalPosts = dashboardData.totalPosts;
  const topShare =
    top && totalPosts > 0 ? (top.count / totalPosts) * 100 : 0;
  if (
    topShare < CALM_SOURCE_SPREAD_TOP_SHARE_PCT &&
    dashboardData.uniqueCreatorCount >= CALM_SOURCE_SPREAD_MIN_UNIQUE
  ) {
    return 'source-spread';
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
      verdict: `The sources in your ${platformLabel} feed were almost all suggestions today.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${suggestedPct}% of your ${platformLabel} feed was suggested, with ${followedPct}% from accounts you follow.`,
        },
        {
          mode: 'LIKELY',
          text:
            'When followed-account activity is sparse, suggestion weights fill more of the source mix. The specific sources depend on what your recent engagement has signaled.',
        },
      ],
    };
  }

  if (variant === 'source-spread') {
    const top = dashboardData.topCreators[0];
    const totalPosts = dashboardData.totalPosts;
    const topShare =
      top && totalPosts > 0 ? Math.round((top.count / totalPosts) * 100) : 0;
    const uniqueCount = dashboardData.uniqueCreatorCount;
    return {
      verdict: `Your ${platformLabel} sources were spread broadly today — no single creator dominated.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${uniqueCount} unique creators contributed posts to this scan. Your top creator made up ${topShare}% — a broad mix.`,
        },
        {
          mode: 'LIKELY',
          text:
            'Broad source diversity is its own pattern: it reflects either an interest profile that touches many topics, or active variety-seeking in your engagement.',
        },
      ],
    };
  }

  // Fallback variant. Specific by giving the unique-creator count
  // and the top-creator share; honest about "no source dominated"
  // without claiming the broader source-spread pattern that needs
  // a unique-creator floor to fire.
  const top = dashboardData.topCreators[0];
  const totalPosts = dashboardData.totalPosts;
  const topShare =
    top && totalPosts > 0 ? Math.round((top.count / totalPosts) * 100) : 0;
  const uniqueCount = dashboardData.uniqueCreatorCount;
  return {
    verdict: `${uniqueCount} unique creators contributed to your ${platformLabel} feed today.`,
    sublines: [
      {
        mode: 'OBSERVED',
        text: `${uniqueCount} unique creators contributed to this scan, with your top creator at ${topShare}%. No source dominated.`,
      },
      {
        mode: 'LIKELY',
        text:
          'Without a strong concentration or unusual spread, your sources reflect your steady engagement patterns.',
      },
    ],
  };
}

// ============================================
// Template registry
// ============================================
//
// Priority order: 60 → 50 → 10. No ties (Sources has no equivalent
// of heavy-ad-load at priority 60, unlike DASHBOARD_OVERVIEW_TEMPLATES).

export const DASHBOARD_SOURCES_TEMPLATES: ResultsTemplate[] = [
  persistentCreatorTemplate,
  concentratedFeedTemplate,
  calmCaseTemplate,
];
