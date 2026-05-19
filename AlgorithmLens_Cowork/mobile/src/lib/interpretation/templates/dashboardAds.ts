/**
 * Dashboard Ads ("Ads & Promotions") interpretation templates.
 *
 * The Ads tab is the design-canonical home for the standalone
 * advertiser-persistence verdict. The 2.x Dashboard design spec's
 * Tab 3 worked example leads with "One advertiser is sitting on
 * your feed more than the others" — the verbal interpretation
 * deferred from Phase 5.4.4 Decision 2 (Option 7B). It lands here.
 *
 * Three templates in priority order:
 *
 *   1. advertiserPersistence (priority 60) — fires when one
 *      advertiser dominates ad recurrence across the window.
 *      Design-canonical verdict copy ("sitting on your feed more
 *      than the others"). Distinct from creator-recurrence (Phase
 *      5.3 persistent-creator templates surface that on
 *      Results/Overview); advertiser-recurrence has its own home.
 *
 *   2. heavyAdLoad (priority 50) — same predicate as Overview's
 *      heavy-ad-load (`adPct >= 15 AND adPct >= 1.5 × rollingAvg`)
 *      but with Ads-surface verdict copy. Where Overview frames
 *      the spike as a day-state anomaly ("Unusually ad-heavy
 *      YouTube today"), Ads frames it as ad-density experience
 *      ("Ad density is running high...").
 *
 *   3. calmCase (priority 10) — catch-all with three variants:
 *        - no-ads:           "No labeled ads in this YouTube scan."
 *        - low-ad-density:   "Ads were a minor presence..."
 *        - fallback:         Design-canonical "Ads sat at X%, your
 *                            usual range." (with anchor-aware copy
 *                            when rollingAvg is available).
 *
 * Voice rule (locked): all LIKELY copy uses mechanism language
 * describing model state (not algorithm intent). The advertiser-
 * persistence LIKELY uses a single-mechanism framing — cross-metric
 * reasoning ("more likely given your top creator is also tech-
 * focused" from the design spec example) is deferred to Phase 7+
 * when political-creator-recurrence + cross-metric correlation
 * ship together.
 *
 * Two design-spec features deferred (Phase 6.2.1 noted):
 *   - Brand-category rollup ("tech-retail brand" rolling up multiple
 *     specific advertisers) — requires brand inference we don't
 *     have. Use creator_handle/creator_display_name from advertiser-
 *     recurrence as the entity identity.
 *   - Cross-metric reasoning in LIKELY — Phase 7+.
 *
 * Priority hierarchy: 60 → 50 → 10. No ties on Ads surface (no
 * persistent-creator equivalent here; creators and advertisers are
 * distinct signals tracked by separate derivations).
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md Tab 3
 */

import { computeAdvertiserRecurrence } from '../derivations/advertiserRecurrence';
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

/** Advertiser-persistence thresholds, mirror persistent-creator (Phase 5.3). */
const ADVERTISER_PERSISTENCE_MIN_SCAN_COUNT = 3;
const ADVERTISER_PERSISTENCE_MIN_WINDOW = 4;

/** Heavy-ad-load thresholds (same as Overview's heavy-ad-load). */
const HEAVY_ADS_ABS_PCT = 15;
const HEAVY_ADS_RATIO = 1.5;

/** Low-ad-density floor for calm-case variant 2. Below this share,
 *  ads were a minor presence and the calm-case copy reflects that
 *  rather than the "your usual range" fallback. */
const CALM_LOW_AD_PCT = 5;

// ============================================
// Template: Advertiser Persistence (priority 60)
// ============================================

const advertiserPersistenceTemplate: ResultsTemplate = {
  id: 'dashboard.ads.advertiser_persistence',
  priority: 60,
  when: (ctx) => {
    const recurrence = computeAdvertiserRecurrence(ctx.scans, ctx.platform);
    const top = recurrence.records[0];
    if (!top) return false;
    if (top.scanCount < ADVERTISER_PERSISTENCE_MIN_SCAN_COUNT) return false;
    if (recurrence.windowScanCount < ADVERTISER_PERSISTENCE_MIN_WINDOW) {
      return false;
    }
    return true;
  },
  render: (ctx) => {
    const { activeScan, scans, dashboardData, platform } = ctx;
    const recurrence = computeAdvertiserRecurrence(scans, platform);
    const top = recurrence.records[0]!;
    const { displayName, scanCount, totalPosts } = top;
    const windowScanCount = recurrence.windowScanCount;

    // Share of identified ads across the window. Sum totalPosts across
    // all advertiser records (excluding unidentified-handle ads per
    // the null-handle rule) to get the denominator. The metric mirrors
    // the design spec's "36% of all ads you've seen across these
    // sessions" — but specifically scoped to identifiable advertisers,
    // since unidentified ads can't be attributed.
    const totalIdentifiedAds = recurrence.records.reduce(
      (sum, r) => sum + r.totalPosts,
      0,
    );
    const shareOfAdsPct =
      totalIdentifiedAds > 0
        ? Math.round((totalPosts / totalIdentifiedAds) * 100)
        : 0;

    const verdict = 'One advertiser is sitting on your feed more than the others.';

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `${displayName} has appeared in ${scanCount} of your last ${windowScanCount} scans, with ${totalPosts} ad ${totalPosts === 1 ? 'post' : 'posts'} across them — about ${shareOfAdsPct}% of all identified ads in this window.`,
      },
      {
        mode: 'LIKELY',
        text:
          'This typically reflects either a sustained ad campaign overlapping with your viewing windows, or the platform treating your recent activity as a strong signal for this advertiser’s category. Either way, the advertiser surfaces repeatedly because the targeting math keeps finding a match.',
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
        surface: 'dashboard.ads',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Heavy Ad Load (priority 50, Ads-variant)
// ============================================

const heavyAdLoadTemplate: ResultsTemplate = {
  id: 'dashboard.ads.heavy_ad_load',
  priority: 50,
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

    // Ads-surface framing: center on the user's experience of ad
    // density, not day-state anomaly. Distinct from Overview's
    // "Unusually ad-heavy YouTube today."
    const verdict = `Ad density is running high in your ${platformLabel} feed today.`;

    const sublines: Subline[] = [
      {
        mode: 'OBSERVED',
        text: `${currentPct}% of your feed was ads this scan, well above your ${rollAvgPct}% average across prior scans.`,
      },
      {
        mode: 'LIKELY',
        text:
          'Ad density fluctuates with platform inventory and how your recent activity reads as commercial-intent for certain categories. Spikes usually flatten as the mix rotates back toward your typical range.',
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
        surface: 'dashboard.ads',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

// ============================================
// Template: Calm Case (priority 10, catch-all)
// ============================================

type CalmVariant = 'no-ads' | 'low-ad-density' | 'fallback';

const calmCaseTemplate: ResultsTemplate = {
  id: 'dashboard.ads.calm_case',
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
        surface: 'dashboard.ads',
        scanId: activeScan.scan_id ?? activeScan.id,
      },
    };
  },
};

function determineCalmVariant(
  dashboardData: InterpretationContext['dashboardData'],
): CalmVariant {
  if (dashboardData.adCount === 0) return 'no-ads';
  if (dashboardData.adPct < CALM_LOW_AD_PCT) return 'low-ad-density';
  return 'fallback';
}

function buildCalmVerdictAndSublines(
  variant: CalmVariant,
  ctx: InterpretationContext,
  platformLabel: string,
): { verdict: string; sublines: Subline[] } {
  const { activeScan, scans, dashboardData, platform } = ctx;
  const adPct = Math.round(dashboardData.adPct);
  const adCount = dashboardData.adCount;
  const totalPosts = dashboardData.totalPosts;

  if (variant === 'no-ads') {
    return {
      verdict: `No labeled ads in this ${platformLabel} scan.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `0 labeled ads in ${totalPosts} posts captured.`,
        },
        {
          mode: 'LIKELY',
          text:
            'Ad-free scans are uncommon but happen — usually when the feed is dominated by suggested content or when ad inventory for your interest profile is sparse in this session.',
        },
      ],
    };
  }

  if (variant === 'low-ad-density') {
    return {
      verdict: `Ads were a minor presence in your ${platformLabel} feed today.`,
      sublines: [
        {
          mode: 'OBSERVED',
          text: `${adPct}% of your feed was ads (${adCount} ad ${adCount === 1 ? 'post' : 'posts'} in ${totalPosts} total).`,
        },
        {
          mode: 'LIKELY',
          text:
            'Light ad density usually means either suggestion-heavy sessions, or your engagement profile is reading as less commercial-intent than the platform’s average for now.',
        },
      ],
    };
  }

  // Fallback variant — design-canonical "Ads sat at X%, your usual range."
  // Wording adapts to the rolling-average anchor when available.
  const rollingAvg = computeRollingAverage(scans, platform, 'ad_pct', {
    excludeScanId: activeScan.id,
  });
  const anchor = getComparativeAnchor(adPct, rollingAvg);

  // When ratio is "typical" or no history exists, use the design-
  // canonical "your usual range" wording. When higher/lower than
  // typical (but not high enough to trigger heavy-ad-load), reflect
  // the comparison honestly.
  let verdict: string;
  if (anchor === null) {
    verdict = `Ads sat at ${adPct}% of your feed today.`;
  } else if (anchor === 'typical') {
    verdict = `Ads sat at ${adPct}% of your feed today, your usual range.`;
  } else {
    verdict = `Ads sat at ${adPct}% of your feed today, ${anchor}.`;
  }

  const observedText = rollingAvg !== null
    ? `${adCount} labeled ads in ${totalPosts} posts. Your prior-scan average is ${Math.round(rollingAvg)}%.`
    : `${adCount} labeled ads in ${totalPosts} posts.`;

  return {
    verdict,
    sublines: [
      {
        mode: 'OBSERVED',
        text: observedText,
      },
      {
        mode: 'LIKELY',
        text:
          'Ad density that tracks with your typical range usually means the platform’s targeting model has stable signals from your activity. Significant shifts in ad mix usually follow significant shifts in what you’re watching.',
      },
    ],
  };
}

// ============================================
// Template registry
// ============================================

export const DASHBOARD_ADS_TEMPLATES: ResultsTemplate[] = [
  advertiserPersistenceTemplate,
  heavyAdLoadTemplate,
  calmCaseTemplate,
];
