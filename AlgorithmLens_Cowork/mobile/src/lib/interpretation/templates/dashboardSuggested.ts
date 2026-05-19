/**
 * Dashboard Suggested vs Followed interpretation templates.
 *
 * Tab 6's design-canonical headline is the absence-driven verdict
 * "Your followed creators have gone quiet, so suggestions are filling
 * the gap" (decisions.md L208). The OBSERVED knits two observations
 * together — elevated suggested share AND a top followed creator
 * absent for days — without claiming causation. The LIKELY (also
 * design-canonical, voice-cleared at decisions.md:248) explains the
 * mechanism abstractly.
 *
 * Three templates in priority order:
 *
 *   1. followedCreatorAbsence (priority 70) — fires when the user's
 *      top followed creator (most prominent by scanCount, then
 *      totalPosts) has been absent for >= 7 days. Uses
 *      computeFollowedCreatorRecurrence + computeCreatorAbsence
 *      (shipped Phase 6.5.0).
 *
 *   2. suggestedDominance (priority 50) — fires when suggestedPct
 *      is both absolutely high (>= 80%) AND elevated vs rolling
 *      average (>= 1.3× the user's typical). Distinct from Sources'
 *      / Results' high-suggested variants (which fire on absolute
 *      level alone) — Tab 6's distinctive contribution is the
 *      COMPARATIVE elevation claim.
 *
 *   3. calmCase (priority 10) — catch-all with four variants:
 *        - approximate-follow-detection: creatorNovelty === null OR
 *          creatorNovelty.approximate === true (follow signal isn't
 *          reliable on this scan; dramatic claims would be
 *          epistemically wrong).
 *        - followed-dominant: followedPct >= 70 — the user's feed is
 *          mostly their own follow list.
 *        - suggested-leaning: suggestedPct >= 60 (but below the
 *          dominance threshold and no absence pattern) — suggestions
 *          made up most of the feed without breaking out.
 *        - fallback: balanced split (typical user state). Anchor-
 *          aware when rolling avg exists.
 *
 * Cross-metric reasoning note: the design verdict's "so suggestions
 * are filling the gap" reads as causal but is editorial composition,
 * not statistical attribution. Phase 6.5.1 discovery concluded that
 * the OBSERVED merely lists co-occurring observations and the LIKELY
 * explains a general mechanism — no cross-metric correlation
 * infrastructure required. This contrasts with Tab 5's deferred
 * "tone got worse because politics got bigger" which DOES require
 * attributable variance.
 *
 * Enrichment-gap guard: every dramatic template predicate that reads
 * creator-novelty / follow-signal-dependent fields checks
 * `creatorNovelty !== null && !creatorNovelty.approximate` first.
 * When follow detection is unreliable, ONLY the calm-case
 * approximate-follow-detection variant fires — absence and
 * dominance templates must NOT misfire on uncertain data. Mirrors
 * the politicalAnalysis === null guard from Tab 4 and the
 * toneAnalysis === null guard from Tab 5.
 *
 * Voice rule (locked):
 *   - No anthropomorphism. "Reaches into recommendations" was an
 *     original draft phrasing (decisions.md:248) and was rewritten to
 *     "the recommendation pool fills more of the feed" — passive
 *     mechanism description. The cleared text is design-canonical.
 *   - No moralizing about followed-vs-suggested ratios as good or bad.
 *   - No prescriptive language ("you should follow more creators") —
 *     COACHING territory, deferred.
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md Tab 6
 */

import {
  computeCreatorAbsence,
  computeFollowedCreatorRecurrence,
} from '../derivations/creatorAbsence';
import { computeRollingAverage } from '../derivations/rollingAverage';
import type {
  InterpretationContext,
  Subline,
} from '../interpretation-types';
import { toSentenceCase } from '../../string-utils';
import { capitalizePlatform } from '../utils/platformDisplay';
import { getComparativeAnchor } from '../utils/comparativeAnchor';
import type { ResultsTemplate } from './results';
import { buildStandardSupportingRows } from './supportingRows';

// ============================================
// Thresholds
// ============================================

/** Absence template: minimum daysSinceLastSeen before the "gone quiet"
 *  framing reads truthfully. Design example uses 8 days; 7 is the
 *  natural editorial floor — "a week" reads as a meaningful cadence
 *  break across the major platforms' posting rhythms. Tighter than 8
 *  ensures the design example fires; looser than ~4 days avoids
 *  triggering on normal weekend gaps. */
const ABSENCE_MIN_DAYS = 7;

/** Absence template: minimum windowScanCount before "your top followed
 *  creator" has editorial meaning. Mirrors Phase 5.3's persistent-
 *  creator MIN_WINDOW. Without enough history we don't know who's
 *  "top" with confidence. */
const ABSENCE_MIN_WINDOW = 4;

/** Absence template: the top followed creator needs to have appeared
 *  in at least this many scans before "top" is defensible. A creator
 *  who appeared in just one scan and then went absent isn't a
 *  meaningful "top followed" — they're a one-time appearance. */
const ABSENCE_TOP_MIN_SCAN_COUNT = 2;

/** Suggested-dominance template: absolute floor for "filled more of
 *  your feed than usual" to read truthfully. Below 80% the absolute
 *  claim doesn't hold. */
const DOMINANCE_SUGGESTED_PCT_FLOOR = 80;

/** Suggested-dominance template: elevation ratio vs rolling average.
 *  Without elevation, high-suggested is owned by other surfaces
 *  (Sources, Results) at their absolute-only predicates. Tab 6's
 *  distinctive variant requires the comparative claim. */
const DOMINANCE_RATIO_FLOOR = 1.3;

/** Calm-case followed-dominant variant: when followed share clears
 *  this floor, the feed reads as predominantly the user's follow
 *  list. */
const CALM_FOLLOWED_DOMINANT_PCT = 70;

/** Calm-case suggested-leaning variant: high-but-not-dominant
 *  suggested share without elevation. Distinct from the dominance
 *  template's predicate, which requires both >= 80% AND elevation. */
const CALM_SUGGESTED_LEANING_PCT = 60;

/** Topic suffix on Template 1 OBSERVED only renders when the top
 *  topic clears this percentage floor — below it, single-topic
 *  claims read as overconfident on thin data. */
const TOPIC_SUFFIX_MIN_PCT = 25;

// ============================================
// Helpers
// ============================================

/**
 * Build the optional "Most of the gap is being filled by {topic}
 * content." suffix. Returns null when topic data is sparse or below
 * the floor (caller appends conditionally).
 *
 * The topic field from Gemini comes through unnormalized (could be
 * "NEWS" or "news" or "News" or "news content"); toSentenceCase
 * lands it in the brand voice.
 */
function buildTopicSuffix(
  dashboardData: InterpretationContext['dashboardData'],
): string | null {
  const top = dashboardData.topTopicsBySuggested[0];
  if (!top) return null;
  if (top.percentage < TOPIC_SUFFIX_MIN_PCT) return null;
  const topicLabel = toSentenceCase(top.topic);
  return ` Most of the gap is being filled by ${topicLabel} content.`;
}

/**
 * Render days-absent phrase. Always returns a plural form unless
 * exactly 1 — copy reads "8 days" not "8 day."
 */
function renderDaysAbsent(days: number): string {
  return days === 1 ? '1 day' : `${days} days`;
}

/** Resolve the displayName for a recurrence record. Falls back to the
 *  canonical handle when displayName is missing or empty. */
function resolveDisplayName(displayName: string, handle: string): string {
  if (typeof displayName === 'string' && displayName.length > 0) {
    return displayName;
  }
  return handle;
}

// ============================================
// Template: Followed Creator Absence (priority 70)
// ============================================
//
// Design-canonical Tab 6 headline. Composes three observations into
// one editorial verdict without making causal claims:
//   1. Top followed creator is absent for >= 7 days
//   2. Suggested share is at its current value (compared to rolling
//      average when available)
//   3. (Conditional) The gap-filling topic is one specific category

const followedCreatorAbsenceTemplate: ResultsTemplate = {
  id: 'dashboard.suggested.followed_creator_absence',
  priority: 70,
  when: (ctx) => {
    // Enrichment-gap guard.
    const novelty = ctx.dashboardData.creatorNovelty;
    if (!novelty || novelty.approximate) return false;

    const recurrence = computeFollowedCreatorRecurrence(
      ctx.scans,
      ctx.platform,
    );
    if (recurrence.windowScanCount < ABSENCE_MIN_WINDOW) return false;
    const top = recurrence.records[0];
    if (!top) return false;
    if (top.scanCount < ABSENCE_TOP_MIN_SCAN_COUNT) return false;

    const absence = computeCreatorAbsence(
      recurrence,
      ctx.activeScan.created_at,
    );
    const record = absence.records.find((r) => r.handle === top.handle);
    if (!record) return false;
    if (record.daysSinceLastSeen === null) return false;
    return record.daysSinceLastSeen >= ABSENCE_MIN_DAYS;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const suggestedPct = Math.round(dashboardData.suggestedPct);

    const recurrence = computeFollowedCreatorRecurrence(scans, platform);
    const top = recurrence.records[0]!;
    const absence = computeCreatorAbsence(recurrence, activeScan.created_at);
    const record = absence.records.find((r) => r.handle === top.handle)!;
    const days = record.daysSinceLastSeen!;
    const displayName = resolveDisplayName(top.displayName, top.handle);

    const rollingAvg = computeRollingAverage(
      scans,
      platform,
      'suggested_pct',
      { excludeScanId: activeScan.id },
    );
    const rollAvgPct = rollingAvg !== null ? Math.round(rollingAvg) : null;
    const topicSuffix = buildTopicSuffix(dashboardData);

    // OBSERVED text: three states, composed from the same fragments.
    //   - With rolling avg: design-canonical "close to your N% average" framing.
    //   - Without rolling avg (thin history): drop the comparative clause.
    //   - With topic suffix appended conditionally to either base.
    const baseClause =
      rollAvgPct !== null
        ? `${suggestedPct}% of your feed was suggested content this scan, close to your ${rollAvgPct}% average.`
        : `${suggestedPct}% of your feed was suggested content this scan.`;

    const absenceClause = ` But ${displayName}, your top followed creator, hasn't posted in ${renderDaysAbsent(
      days,
    )}.`;

    const observedText =
      baseClause + absenceClause + (topicSuffix !== null ? topicSuffix : '');

    // Verdict and LIKELY both ship design-canonical verbatim
    // (decisions.md L208 verdict, L212/L248 LIKELY).
    const verdict =
      'Your followed creators have gone quiet, so suggestions are filling the gap.';

    const sublines: Subline[] = [
      { mode: 'OBSERVED', text: observedText },
      {
        mode: 'LIKELY',
        text:
          'When followed creators slow down, the recommendation pool fills more of the feed. The category that fills depends on what you’ve been engaging with.',
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
        surface: 'dashboard.suggested',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Suggested Dominance (priority 50)
// ============================================
//
// Fires when suggested share is BOTH absolutely high (>= 80%) AND
// elevated vs the user's rolling average (>= 1.3×). Distinct from
// other surfaces' high-suggested variants which fire on absolute
// level alone.

const suggestedDominanceTemplate: ResultsTemplate = {
  id: 'dashboard.suggested.suggested_dominance',
  priority: 50,
  when: (ctx) => {
    // Enrichment-gap guard.
    const novelty = ctx.dashboardData.creatorNovelty;
    if (!novelty || novelty.approximate) return false;

    const suggestedPct = ctx.dashboardData.suggestedPct;
    if (suggestedPct < DOMINANCE_SUGGESTED_PCT_FLOOR) return false;
    const rollingAvg = computeRollingAverage(
      ctx.scans,
      ctx.platform,
      'suggested_pct',
      { excludeScanId: ctx.activeScan.id },
    );
    // Require comparative claim — without rolling avg, can't claim
    // "more than usual." Falls through to calm-case suggested-leaning
    // (or to absence if that fires).
    if (rollingAvg === null) return false;
    return suggestedPct >= DOMINANCE_RATIO_FLOOR * rollingAvg;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const currentPct = Math.round(dashboardData.suggestedPct);
    const rollingAvg = computeRollingAverage(
      scans,
      platform,
      'suggested_pct',
      { excludeScanId: activeScan.id },
    );
    const rollAvgPct = rollingAvg !== null ? Math.round(rollingAvg) : 0;

    const verdict = `Suggestions filled more of your ${platformLabel} feed than usual.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `${currentPct}% of your feed was suggested this scan, up from your ${rollAvgPct}% average.`,
      },
      {
        mode: 'LIKELY',
        text:
          'When suggested content climbs above its usual share, the recommendation pool is finding fewer matches with the accounts you follow — either because they’re posting less or because recent engagement is weighting toward unfamiliar sources. The mix usually rebalances over the next few scans.',
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
        surface: 'dashboard.suggested',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Calm Case (priority 10, catch-all)
// ============================================

type CalmVariant =
  | 'approximate-follow-detection'
  | 'followed-dominant'
  | 'suggested-leaning'
  | 'fallback';

const calmCaseTemplate: ResultsTemplate = {
  id: 'dashboard.suggested.calm_case',
  priority: 10,
  when: () => true,
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const variant = determineCalmVariant(dashboardData);
    const { verdict, sublines } = buildCalmVerdictAndSublines(
      variant,
      ctx,
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
        surface: 'dashboard.suggested',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

function determineCalmVariant(
  dashboardData: InterpretationContext['dashboardData'],
): CalmVariant {
  const novelty = dashboardData.creatorNovelty;
  if (!novelty || novelty.approximate) {
    return 'approximate-follow-detection';
  }
  if (dashboardData.followedPct >= CALM_FOLLOWED_DOMINANT_PCT) {
    return 'followed-dominant';
  }
  if (dashboardData.suggestedPct >= CALM_SUGGESTED_LEANING_PCT) {
    return 'suggested-leaning';
  }
  return 'fallback';
}

function buildCalmVerdictAndSublines(
  variant: CalmVariant,
  ctx: InterpretationContext,
  platformLabel: string,
): { verdict: string; sublines: Subline[] } {
  const { activeScan, scans, dashboardData, platform } = ctx;
  const suggestedPct = Math.round(dashboardData.suggestedPct);
  const followedPct = Math.round(dashboardData.followedPct);

  if (variant === 'approximate-follow-detection') {
    return {
      verdict: `Follow detection isn’t fully reliable for this ${platformLabel} scan.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text:
            'Some platforms don’t clearly mark which posts came from accounts you follow versus recommendations. When that signal is incomplete, the suggested-versus-followed split is approximate.',
        },
        {
          mode: 'LIKELY',
          text:
            'Detection accuracy depends on the platform exposing follow state in the page DOM at capture time. When labels are missing or ambiguous, the data layer falls back to inference and flags the result. The sections below still surface counts; treat the split as directional rather than exact.',
        },
      ],
    };
  }

  if (variant === 'followed-dominant') {
    return {
      verdict: `Most of your ${platformLabel} feed came from accounts you follow today.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${followedPct}% of your feed came from followed accounts this scan, with ${suggestedPct}% from suggestions.`,
        },
        {
          mode: 'LIKELY',
          text:
            'A followed-dominant feed usually means your follow list is producing enough fresh posts that the recommendation pool isn’t being pulled in to fill space. The share tends to hold across consecutive scans when your follow list stays active.',
        },
      ],
    };
  }

  if (variant === 'suggested-leaning') {
    return {
      verdict: `Suggestions made up most of your ${platformLabel} feed today.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${suggestedPct}% of your feed came from suggestions this scan, with ${followedPct}% from accounts you follow.`,
        },
        {
          mode: 'LIKELY',
          text:
            'A suggestion-leaning split usually means the followed-side post supply is lighter than the slots available, so the recommendation pool fills the rest. Whether this reflects a slow week from your follow list or a structural pattern depends on how the split moves across scans.',
        },
      ],
    };
  }

  // Fallback: balanced split. Anchor-aware on suggestedPct when
  // rolling avg is available — matches Tone's fallback discipline.
  const rollingAvg = computeRollingAverage(scans, platform, 'suggested_pct', {
    excludeScanId: activeScan.id,
  });
  const anchor = getComparativeAnchor(suggestedPct, rollingAvg);

  let verdict: string;
  if (anchor === null) {
    verdict = `Your ${platformLabel} feed mixed followed and suggested content today.`;
  } else if (anchor === 'typical') {
    verdict = `Your ${platformLabel} feed mixed followed and suggested content today, your usual split.`;
  } else {
    verdict = `Your ${platformLabel} feed mixed followed and suggested content today, ${anchor}.`;
  }

  return {
    verdict,
    sublines: [
      {
        mode: 'OBSERVED',
        text: `${followedPct}% followed, ${suggestedPct}% suggested across ${dashboardData.totalPosts} posts.`,
      },
      {
        mode: 'LIKELY',
        text:
          'A balanced followed/suggested split usually means your follow list and the recommendation pool are contributing in similar proportions. Significant shifts in the split usually follow changes in how often the accounts you follow are posting, or shifts in what recent engagement weights for recommendations.',
      },
    ],
  };
}

// ============================================
// Template registry
// ============================================

export const DASHBOARD_SUGGESTED_TEMPLATES: ResultsTemplate[] = [
  followedCreatorAbsenceTemplate,
  suggestedDominanceTemplate,
  calmCaseTemplate,
];
