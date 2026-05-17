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

import type {
  InterpretationContext,
  InterpretationResult,
  Subline,
  SupportingRow,
} from '../interpretation-types';
import { capitalizePlatform } from '../utils/platformDisplay';
import { buildStandardSupportingRows } from './supportingRows';

// Concentration threshold: when the top creator's share of feed
// reaches this percent or higher, the Concentrated Feed verdict fires.
const CONCENTRATION_THRESHOLD_PCT = 25;

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

    const supportingRows: SupportingRow[] = buildStandardSupportingRows(
      activeScan,
      scans,
      dashboardData,
      platform,
    );

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

// Supporting-row builders moved to ./supportingRows in Phase 5.1.2 so
// the Dashboard Overview templates can share them. The four builders
// produce the same FactRow output regardless of surface; what varies
// per-surface is the verdict and sublines copy, not the row content.

// ============================================
// Template: Calm Case (catch-all, Phase 4.5.2.2)
// ============================================
//
// Fires when no higher-priority template matches. Replaces the
// placeholder fallback that used to live inline in the orchestrator.
//
// The calm case isn't "nothing to say" — it's "nothing dramatic to
// say." The design spec voice guidance: "the verdict can be specific
// without being eventful." So this template branches on what's most
// notable about the scan in the absence of a strong concentration:
//
//   Variant 1 — high suggested ratio (suggestedPct >= 80):
//     "Almost everything in your YouTube feed came from suggestions."
//     A feed dominated by suggestions, even without creator
//     concentration, is itself a real characteristic worth surfacing.
//
//   Variant 2 — single content type dominates (>= 50%):
//     "Your YouTube feed was mostly shorts this session."
//     Useful on YouTube specifically where the format mix tells you
//     something about what's being weighted.
//
//   Variant 3 — genuine fallback:
//     "37 posts captured on your YouTube feed, nothing unusual flagged."
//     Specific by giving the post count rather than the generic
//     "your feed is in its usual shape" boilerplate that shipped in
//     the Phase 3.2 placeholder.
//
// All three variants emit two sublines (OBSERVED + LIKELY) and the
// standard four-row supporting card (Ads, Patterns, Political, Tone).
// Mechanism language in LIKELY copy per the locked voice rule:
// "weights", "fills", "reflects" — never "the algorithm wants" or
// other anthropomorphism.
//
// findingDot stays false: calm case isn't a finding worth dotting
// the Dashboard tab strip for.

type CalmVariant = 'high-suggested' | 'content-type-dominant' | 'fallback';

const CALM_HIGH_SUGGESTED_THRESHOLD_PCT = 80;
const CALM_CONTENT_TYPE_DOMINANCE_PCT = 50;

const calmCaseTemplate: ResultsTemplate = {
  id: 'results.calm_case',
  // Below concentratedFeedTemplate (50) so concentration always wins
  // when both could match. Above any hypothetical future "diagnostic"
  // template that we'd want to short-circuit calm output.
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

    const supportingRows: SupportingRow[] = buildStandardSupportingRows(
      activeScan,
      scans,
      dashboardData,
      platform,
    );

    return {
      verdict,
      sublines,
      supportingRows,
      findingDot: false,
      meta: {
        surface: 'results',
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
      verdict: `Almost everything in your ${platformLabel} feed came from suggestions.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${suggestedPct}% of what you saw was suggested, with ${followedPct}% from accounts you follow.`,
        },
        {
          mode: 'LIKELY',
          text:
            'Suggestion weights fill the feed when activity from followed accounts is sparse.',
        },
      ],
    };
  }

  if (variant === 'content-type-dominant') {
    const top = dashboardData.contentTypes[0]!;
    const typePlural = pluralizeContentType(top.label);
    const pct = Math.round(top.percentage);
    return {
      verdict: `Your ${platformLabel} feed was mostly ${typePlural} this session.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${pct}% of posts were ${typePlural}, the dominant format in this scan.`,
        },
        {
          mode: 'LIKELY',
          text:
            'Recent watch time on this format keeps it weighted higher in what gets surfaced next.',
        },
      ],
    };
  }

  // Fallback variant.
  const totalPosts = dashboardData.totalPosts;
  const adPct = Math.round(dashboardData.adPct);
  // Edge case: totalPosts === 0 produces "0 posts captured ..." which
  // is technically correct but reads oddly. Acceptable because a
  // zero-post scan implies upstream pipeline issues that take
  // precedence over verdict polish.
  return {
    verdict: `${totalPosts} posts captured on your ${platformLabel} feed, nothing unusual flagged.`,
    sublines: [
      {
        mode: 'OBSERVED',
        text: `${totalPosts} posts captured, with ads at ${adPct}%.`,
      },
      {
        mode: 'LIKELY',
        text:
          'Without a strong concentration in any direction, the feed reflects your usual engagement history.',
      },
    ],
  };
}

/**
 * Lowercase + naive English pluralization for content-type labels.
 * countContentTypes capitalizes the first letter ("Video", "Short",
 * "Photo"); we want "videos", "shorts", "photos" in verdict copy.
 * Bare append-'s' rule is sufficient for the known set; if labels
 * ever include irregular plurals this will need a lookup table.
 */
function pluralizeContentType(label: string): string {
  const lower = label.toLowerCase();
  return lower.endsWith('s') ? lower : `${lower}s`;
}

// ============================================
// Template registry
// ============================================

export const RESULTS_TEMPLATES: ResultsTemplate[] = [
  concentratedFeedTemplate,
  calmCaseTemplate,
];
