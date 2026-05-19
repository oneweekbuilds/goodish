/**
 * Dashboard Tone ("Emotional Tone") interpretation templates.
 *
 * Tab 5's design-canonical verdict is the engine's most ambitious —
 * "Your feed got more negative because politics got bigger" does
 * cross-metric causal reasoning (tone shift ATTRIBUTED to political
 * shift). That verdict requires cross-metric correlation
 * infrastructure (the explained-variance / category-attribution
 * derivation) the engine doesn't have yet. Filed as a Phase 7+
 * deliverable.
 *
 * Phase 6.3.2 ships the simpler non-cross-metric templates: a
 * negative-tone-shift template that observes the rolling-average
 * comparison without claiming political content is the cause, and
 * dominant-tone + calm-case variants. The supporting card's
 * deeper-drill comparison rows (tone-of-political vs tone-of-non-
 * political) live on the 1.1.x kept sections beneath the engine
 * output, not in the engine's verdict.
 *
 * Three templates in priority order:
 *
 *   1. negativeToneShift (priority 70) — fires when negative tone
 *      climbs vs the user's rolling average. Editorial-sensitive
 *      copy: observation + mechanism, never moralizing.
 *
 *   2. dominantTone (priority 50) — fires when one tone bucket
 *      reaches >= 50% of identifiable-tone posts. Three sub-variants
 *      (positive / negative / neutral) with bucket-appropriate
 *      framing — neutral is factual, positive is lighter, negative
 *      is cautious-but-non-moralizing.
 *
 *   3. calmCase (priority 10) — catch-all with three variants:
 *        - enrichment-not-available: honest framing when tone
 *          classification isn't available for the scan (Gemini
 *          backend enrichment is asynchronous and may not be
 *          complete when the scan is interpreted).
 *        - balanced-tone: no bucket close to dominance (max < 40%).
 *        - fallback: one bucket leaning (40-49%) without hitting
 *          either dominance or shift thresholds. Anchor-aware copy
 *          when rollingAvg is available.
 *
 * Voice rule (locked + Tone-specific anti-moralizing rule):
 *   - No anthropomorphism ("the algorithm wants you angry") — locked rule.
 *   - No moralizing claims about user state ("making you feel worse").
 *   - No judgmental claims about content ("this is unhealthy").
 *   - No prescriptive language ("you should diversify") — COACHING territory.
 *   - DO: observation + mechanism. "Negative tone has been climbing,"
 *     "engagement signals around emotionally charged content tend to
 *     weight more heavily," "the share grows across sessions until
 *     something interrupts the pattern."
 *
 * Enrichment-gap guard: every template predicate that reads
 * toneAnalysis fields checks `toneAnalysis !== null` AND
 * `knownValenceTotal > 0` first. When tone enrichment is absent
 * (Gemini classification didn't complete), ONLY the calm-case
 * enrichment-not-available variant fires — dominant-tone and
 * negative-tone-shift must NOT misfire on a missing-data state.
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md Tab 5
 */

import { computeRollingAverage } from '../derivations/rollingAverage';
import type {
  InterpretationContext,
  InterpretationResult,
  Subline,
} from '../interpretation-types';
import { capitalizePlatform } from '../utils/platformDisplay';
import { getComparativeAnchor } from '../utils/comparativeAnchor';
import type { ResultsTemplate } from './results';
import { buildStandardSupportingRows } from './supportingRows';

// ============================================
// Thresholds
// ============================================

/** Negative-tone shift: absolute floor + ratio vs rolling average.
 *  Below the floor, even a high ratio doesn't justify the
 *  "climbing" verdict editorially. */
const NEGATIVE_TONE_SHIFT_ABS_PCT = 30;
const NEGATIVE_TONE_SHIFT_RATIO = 1.5;

/** Dominant-tone threshold: one bucket reaches >= 50% of
 *  identifiable-tone posts. The denominator excludes MIXED and
 *  unclassified items, mirroring computeDashboardData's
 *  knownValenceTotal convention. */
const DOMINANT_TONE_THRESHOLD_PCT = 50;

/** Balanced-tone threshold: when no bucket reaches this share,
 *  the mix reads as genuinely balanced rather than slightly leaning. */
const BALANCED_TONE_MAX_BUCKET_PCT = 40;

// ============================================
// Template: Negative Tone Shift (priority 70)
// ============================================

const negativeToneShiftTemplate: ResultsTemplate = {
  id: 'dashboard.tone.negative_tone_shift',
  priority: 70,
  when: (ctx) => {
    const tone = ctx.dashboardData.toneAnalysis;
    // Enrichment-gap guard: don't fire on missing-data state.
    if (!tone || tone.knownValenceTotal === 0) return false;
    if (tone.negativePct < NEGATIVE_TONE_SHIFT_ABS_PCT) return false;
    const rollingAvg = computeRollingAverage(
      ctx.scans,
      ctx.platform,
      'tone_negative_pct',
      { excludeScanId: ctx.activeScan.id },
    );
    // Require non-null rolling average — "climbing" implies a
    // comparison against history. Thin-history users fall through
    // to calm-case.
    if (rollingAvg === null) return false;
    return tone.negativePct >= NEGATIVE_TONE_SHIFT_RATIO * rollingAvg;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const tone = dashboardData.toneAnalysis!;
    const currentPct = Math.round(tone.negativePct);
    const rollingAvg = computeRollingAverage(scans, platform, 'tone_negative_pct', {
      excludeScanId: activeScan.id,
    });
    const rollAvgPct = rollingAvg !== null ? Math.round(rollingAvg) : 0;

    const verdict = `Negative tone has been climbing in your ${platformLabel} feed.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `Negative tone is at ${currentPct}% of posts with identifiable tone this scan, up from your ${rollAvgPct}% average across prior scans.`,
      },
      {
        mode: 'LIKELY',
        text:
          'Emotionally charged content tends to drive higher engagement signals — more watch time, more reactions — and engagement reads as a strong recommendation signal for the platform. When negative content starts producing more engagement, the share usually grows across sessions until something interrupts the pattern.',
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
        surface: 'dashboard.tone',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Dominant Tone (priority 50)
// ============================================

type DominantBucket = 'positive' | 'negative' | 'neutral';

const dominantToneTemplate: ResultsTemplate = {
  id: 'dashboard.tone.dominant_tone',
  priority: 50,
  when: (ctx) => {
    const tone = ctx.dashboardData.toneAnalysis;
    if (!tone || tone.knownValenceTotal === 0) return false;
    const maxPct = Math.max(tone.positivePct, tone.neutralPct, tone.negativePct);
    return maxPct >= DOMINANT_TONE_THRESHOLD_PCT;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const platformLabel = capitalizePlatform(platform);
    const tone = dashboardData.toneAnalysis!;
    const maxPct = Math.max(tone.positivePct, tone.neutralPct, tone.negativePct);
    // Sub-variant selection: positive > negative > neutral on ties
    // (rare; exact 50/50 splits are statistical edge cases).
    let bucket: DominantBucket;
    if (maxPct === tone.positivePct) bucket = 'positive';
    else if (maxPct === tone.negativePct) bucket = 'negative';
    else bucket = 'neutral';

    const { verdict, sublines } = buildDominantToneVerdictAndSublines(
      bucket,
      tone,
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
      findingDot: true,
      meta: {
        surface: 'dashboard.tone',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

function buildDominantToneVerdictAndSublines(
  bucket: DominantBucket,
  tone: NonNullable<InterpretationContext['dashboardData']['toneAnalysis']>,
  platformLabel: string,
): { verdict: string; sublines: Subline[] } {
  if (bucket === 'positive') {
    const pct = Math.round(tone.positivePct);
    return {
      verdict: `Your ${platformLabel} feed leaned positive today.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${pct}% of posts with identifiable tone read as positive.`,
        },
        {
          mode: 'LIKELY',
          text:
            'Positive tone often aligns with creator categories that prioritize upbeat framing — tech reviews, tutorials, comedy, entertainment. When your engagement profile favors those categories, positive tone tracks with that profile.',
        },
      ],
    };
  }

  if (bucket === 'negative') {
    const pct = Math.round(tone.negativePct);
    return {
      verdict: `Your ${platformLabel} feed leaned negative today.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${pct}% of posts with identifiable tone read as critical or negative.`,
        },
        {
          mode: 'LIKELY',
          text:
            'Negative tone often clusters in specific content categories — news, commentary, certain entertainment formats. When recent engagement signals strong interest in those categories, the share of negative-tone posts tracks with that interest.',
        },
      ],
    };
  }

  // Neutral. Factual framing — informational/analytical content.
  const pct = Math.round(tone.neutralPct);
  return {
    verdict: `Your ${platformLabel} feed leaned neutral today.`,
    sublines: [
      {
        mode: 'OBSERVED',
        text: `${pct}% of posts with identifiable tone read as factual or balanced.`,
      },
      {
        mode: 'LIKELY',
        text:
          'Neutral tone is typical for informational and analytical content — documentaries, explainers, news that prioritizes facts over framing. A neutral-heavy feed usually means recent engagement has favored that style of content.',
      },
    ],
  };
}

// ============================================
// Template: Calm Case (priority 10, catch-all)
// ============================================

type CalmVariant = 'enrichment-not-available' | 'balanced-tone' | 'fallback';

const calmCaseTemplate: ResultsTemplate = {
  id: 'dashboard.tone.calm_case',
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
        surface: 'dashboard.tone',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

function determineCalmVariant(
  dashboardData: InterpretationContext['dashboardData'],
): CalmVariant {
  const tone = dashboardData.toneAnalysis;
  if (!tone || tone.knownValenceTotal === 0) {
    return 'enrichment-not-available';
  }
  const maxPct = Math.max(tone.positivePct, tone.neutralPct, tone.negativePct);
  if (maxPct < BALANCED_TONE_MAX_BUCKET_PCT) {
    return 'balanced-tone';
  }
  return 'fallback';
}

function buildCalmVerdictAndSublines(
  variant: CalmVariant,
  ctx: InterpretationContext,
  platformLabel: string,
): { verdict: string; sublines: Subline[] } {
  const { activeScan, scans, dashboardData, platform } = ctx;

  if (variant === 'enrichment-not-available') {
    return {
      verdict: `Tone analysis isn’t available for this ${platformLabel} scan.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text:
            'Tone classification requires backend enrichment that didn’t complete for this scan.',
        },
        {
          mode: 'LIKELY',
          text:
            'Tone classification is asynchronous and depends on backend processing finishing before the scan data is interpreted. When enrichment is unavailable, the tone breakdown sections below stay empty.',
        },
      ],
    };
  }

  // The remaining variants both have non-null toneAnalysis with
  // knownValenceTotal > 0. Safe to dereference.
  const tone = dashboardData.toneAnalysis!;
  const positivePct = Math.round(tone.positivePct);
  const neutralPct = Math.round(tone.neutralPct);
  const negativePct = Math.round(tone.negativePct);

  if (variant === 'balanced-tone') {
    return {
      verdict: `Your ${platformLabel} feed had a balanced emotional mix today.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${positivePct}% positive, ${neutralPct}% neutral, ${negativePct}% negative — no single tone dominated.`,
        },
        {
          mode: 'LIKELY',
          text:
            'Balanced tone mixes often reflect varied content categories or active variety-seeking in engagement. When no single tone bucket pulls strongly, the feed sits closer to the platform’s overall content distribution.',
        },
      ],
    };
  }

  // Fallback variant — one bucket leaning (40-49%) without hitting
  // dominance (50%) or shift (1.5× rolling avg). Anchor-aware
  // wording when rollingAvg is available.
  const rollingAvg = computeRollingAverage(scans, platform, 'tone_negative_pct', {
    excludeScanId: activeScan.id,
  });
  const anchor = getComparativeAnchor(negativePct, rollingAvg);

  let verdict: string;
  if (anchor === null) {
    verdict = `Tone sat at ${negativePct}% negative today.`;
  } else if (anchor === 'typical') {
    verdict = `Tone sat at ${negativePct}% negative today, your usual range.`;
  } else {
    verdict = `Tone sat at ${negativePct}% negative today, ${anchor}.`;
  }

  return {
    verdict,
    sublines: [
      {
        mode: 'OBSERVED',
        text: `${positivePct}% positive, ${neutralPct}% neutral, ${negativePct}% negative across ${tone.knownValenceTotal} posts with identifiable tone.`,
      },
      {
        mode: 'LIKELY',
        text:
          'Tone that tracks within your typical range usually means the content categories you engage with are stable. Significant shifts in tone mix usually follow shifts in which categories your activity weights.',
      },
    ],
  };
}

// ============================================
// Template registry
// ============================================

export const DASHBOARD_TONE_TEMPLATES: ResultsTemplate[] = [
  negativeToneShiftTemplate,
  dominantToneTemplate,
  calmCaseTemplate,
];
