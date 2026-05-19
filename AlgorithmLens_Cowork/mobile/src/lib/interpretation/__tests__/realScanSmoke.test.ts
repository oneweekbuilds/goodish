/**
 * realScanSmoke: non-runtime smoke test for the 2.x interpretation
 * engine against real Supabase scan rows.
 *
 * Why: the engine has 26 passing unit tests with synthetic ScanDetail
 * fixtures, but synthetic data rarely captures the shape quirks of
 * real Gemini output (null creator_handle on shorts, MIXED valence,
 * sparse political summaries, etc.). This test exercises the full
 * engine path against two real YouTube scans (redacted) so we surface
 * shape gotchas before the device-build test in Phase 4.5.2+.
 *
 * The test does NOT assert specific output strings — those would be
 * brittle against template iteration. It asserts type-shape
 * correctness (verdict non-empty, modes valid, variants valid,
 * meta.scanId resolved) and logs the full result so a human can read
 * what the engine produced.
 *
 * The smoke test bypasses unifiedResultToScanDetail (Phase 4.4.2)
 * deliberately — that adapter has its own 12-test suite. This file
 * focuses on the engine layer.
 *
 * Reference: Phase 4.5.1a in the 2.x engine MVP plan.
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import { computeDashboardData } from '../../computeDashboardData';
import { computeAdvertiserRecurrence } from '../derivations/advertiserRecurrence';
import { computeCreatorRecurrence } from '../derivations/creatorRecurrence';
import { interpretScan, type EngineSurface } from '../interpretationEngine';
import type {
  InterpretationContext,
  InterpretationResult,
  SublineMode,
  SupportingRowVariant,
} from '../interpretation-types';
import { REAL_ACTIVE_SCAN, REAL_PRIOR_SCAN } from './fixtures/realScans';

const VALID_SUBLINE_MODES: ReadonlyArray<SublineMode> = [
  'OBSERVED',
  'LIKELY',
  'COACHING',
  'QUESTION',
];

const VALID_ROW_VARIANTS: ReadonlyArray<SupportingRowVariant> = [
  'fact',
  'creator',
  'trajectory',
  'bar',
  'caveat',
  'methodology',
];

/**
 * Loose shape assertions: enough to catch wiring crashes and type
 * regressions, deliberately not asserting specific verdict strings
 * (those would be brittle against template iteration).
 */
function assertResultShape(
  result: InterpretationResult,
  surface: EngineSurface,
): void {
  expect(typeof result.verdict).toBe('string');
  expect(result.verdict.length).toBeGreaterThan(0);

  expect(Array.isArray(result.sublines)).toBe(true);
  for (const sub of result.sublines) {
    expect(VALID_SUBLINE_MODES).toContain(sub.mode);
    expect(typeof sub.text).toBe('string');
    expect(sub.text.length).toBeGreaterThan(0);
  }

  expect(Array.isArray(result.supportingRows)).toBe(true);
  for (const row of result.supportingRows) {
    expect(VALID_ROW_VARIANTS).toContain(row.variant);
  }

  expect(result.meta).not.toBeNull();
  expect(result.meta!.surface).toBe(surface);
  expect(result.meta!.scanId).toBe(
    REAL_ACTIVE_SCAN.scan_id ?? REAL_ACTIVE_SCAN.id,
  );
}

function makeRealScanContext(): InterpretationContext {
  // Mirror production wiring: useDashboard returns ALL scans for the
  // user (active + history). Rolling-average extractors in the row
  // builders pass excludeScanId to skip the active scan when
  // comparing against history. Recurrence (buildTopVoiceRow) does
  // NOT exclude the active scan — "in 5 of last 6 scans" includes
  // today, per the design spec.
  return {
    activeScan: REAL_ACTIVE_SCAN,
    scans: [REAL_ACTIVE_SCAN, REAL_PRIOR_SCAN],
    dashboardData: computeDashboardData(REAL_ACTIVE_SCAN),
    platform: 'youtube',
  };
}

describe('interpretationEngine — real-scan smoke', () => {
  test('engine produces a sensible result for a real YouTube scan on the results surface', () => {
    const context = makeRealScanContext();

    // The engine should not throw on real data. If it does, the
    // failure surfaces immediately and we stop to diagnose.
    const result = interpretScan(context, 'results');

    // Log the full output so a human can read what the engine
    // produced. This is the load-bearing observation of Phase 4.5.1a.
    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke results] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'results');
  });

  test('engine produces a sensible result for a real YouTube scan on the dashboard.overview surface', () => {
    const context = makeRealScanContext();

    const result = interpretScan(context, 'dashboard.overview');

    // Log the dashboard.overview output verbatim — load-bearing
    // observation of Phase 5.1.5. The smoke fixture is 100% suggested
    // and 0% political, so the political_shift template won't fire
    // (no historical comparison reaches the 1.5× threshold against
    // zero), heavy_ad_load won't fire (3% ads), and concentrated_feed
    // won't fire (YouTube shorts have null creator_handle — known
    // issue #10). We expect the calm-case high-suggested variant.
    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke dashboard.overview] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.overview');
  });

  test('engine produces a sensible result for a real YouTube scan on the dashboard.sources surface', () => {
    const context = makeRealScanContext();

    const result = interpretScan(context, 'dashboard.sources');

    // Phase 6.1.5 observation: the 2-scan real fixture has
    // windowScanCount === 2, below the persistent_creator threshold
    // (windowScanCount >= 4). The fixture also has 100% suggested,
    // so the calm-case high-suggested variant should fire with
    // Sources-specific copy ("sources in your feed were almost all
    // suggestions").
    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke dashboard.sources] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.sources');
  });

  test('engine produces a sensible result for a real YouTube scan on the dashboard.ads surface', () => {
    const context = makeRealScanContext();

    const result = interpretScan(context, 'dashboard.ads');

    // Phase 6.2.5 observation: 2-scan fixture has windowScanCount=2,
    // below advertiser_persistence threshold (>= 4). The fixture has
    // 3% adPct — below heavy-ad-load's 15% absolute floor. So the
    // calm-case low-ad-density variant should fire (adPct < 5).
    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke dashboard.ads] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.ads');
  });

  test('engine produces a sensible result for a real YouTube scan on the dashboard.tone surface', () => {
    const context = makeRealScanContext();

    const result = interpretScan(context, 'dashboard.tone');

    // Phase 6.3.5 observation: the real fixture lacks Gemini tone
    // enrichment (toneAnalysis === null in computeDashboardData
    // output). The dashboard.tone calm-case enrichment-not-available
    // variant should fire with honest framing ("Tone analysis isn't
    // available for this scan"). This is the design-intended
    // behavior for missing-data state — the dramatic templates must
    // NOT misfire when toneAnalysis is null.
    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke dashboard.tone] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.tone');
  });

  test('engine produces a sensible result for a real YouTube scan on the dashboard.politics surface', () => {
    const context = makeRealScanContext();

    const result = interpretScan(context, 'dashboard.politics');

    // Phase 6.4.5 observation: same shape as the tone smoke — the
    // real fixtures lack Gemini political enrichment
    // (raw_data.analysis.ai_analyzed is undefined, so
    // extractPoliticalAnalysis returns null and politicalAnalysis is
    // null on dashboardData). The dashboard.politics calm-case
    // enrichment-not-available variant should fire with honest
    // framing ("Political classification isn't available for this
    // YouTube scan"). This is the design-intended behavior for
    // missing-data state — the dramatic templates must NOT misfire
    // when politicalAnalysis is null.
    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke dashboard.politics] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.politics');
  });

  test('engine produces a sensible result for a real YouTube scan on the dashboard.suggested surface', () => {
    const context = makeRealScanContext();

    const result = interpretScan(context, 'dashboard.suggested');

    // Phase 6.5.5 observation: the real fixtures have 96% null
    // is_suggested values (83 of 86 posts; the remaining 3 are
    // is_suggested=true, zero are is_suggested=false). That puts
    // extractCreatorNovelty's approximate flag at true
    // (unknownCount/totalPosts > 0.3). The dashboard.suggested
    // enrichment-gap guard short-circuits the dramatic templates;
    // calm-case approximate-follow-detection variant fires with
    // honest framing ("Follow detection isn't fully reliable for
    // this YouTube scan").
    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke dashboard.suggested] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.suggested');
  });
});

// ============================================
// Persistent-creator smoke (Phase 5.3.3)
// ============================================
//
// The smoke fixture has windowScanCount === 2, which is below the
// persistent-creator template's threshold (scanCount >= 3 AND
// windowScanCount >= 4). To validate the template on real-shape
// data we synthesize 2 additional prior scans by deep-cloning
// REAL_PRIOR_SCAN, mutating ids and timestamps backwards.
//
// This is test-local synthesis, not real data — the originals are
// already redacted, and the clones inherit that redaction. We don't
// promote these to fixtures/realScans.ts because they're test
// scaffolding, not observed scans.
//
// Creator distribution is preserved by deep cloning: whatever
// @creator-N appeared in REAL_PRIOR_SCAN appears in both clones too.
// Per Phase 5.2.3, @creator-13 is the top recurrer (scanCount=2 on
// the original 2-fixture window); with two more cloned-prior scans
// added, @creator-13's scanCount climbs to 4-of-4, well above the
// threshold.

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Inject synthetic Gemini tone enrichment into a deep-cloned
 * ScanDetail. Replaces `raw_data.analysis.feed_items` with a
 * sequence of items whose `emotions.valence` matches the supplied
 * valences array. Other raw_data fields (posts, top_creators, etc.)
 * are preserved from the base. Used for Phase 6.3.5 to test
 * negative-tone-shift on real-shape data — the real fixtures lack
 * tone enrichment, so we synthesize plausible distributions.
 */
function withSyntheticToneEnrichment(
  base: ScanDetail,
  valences: Array<'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>,
  overrides: { id?: string; created_at?: string } = {},
): ScanDetail {
  const clone = deepClone(base);
  if (overrides.id) clone.id = overrides.id;
  if (overrides.created_at) clone.created_at = overrides.created_at;
  const raw = clone.raw_data as Record<string, unknown>;
  const analysis =
    (raw.analysis as Record<string, unknown> | undefined) ?? {};
  // ai_analyzed: true is the gate computeDashboardData.extractToneAnalysis
  // checks before reading feed_items. Without this flag, toneAnalysis
  // returns null even when feed_items has valences. The rolling-average
  // tone_negative_pct extractor doesn't check this gate, so priors work
  // either way — but the active scan's dashboardData.toneAnalysis
  // requires it.
  analysis.ai_analyzed = true;
  analysis.feed_items = valences.map((v) => ({
    political: { is_political: false },
    emotions: { valence: v },
  }));
  raw.analysis = analysis;
  return clone;
}

/**
 * Inject synthetic Gemini political enrichment into a deep-cloned
 * ScanDetail. Replaces `raw_data.analysis.feed_items` with a sequence
 * of political-creator items and optionally locks the rolling-average
 * / trajectory extractor's per-scan value via
 * `political_content_summary.political_percentage`.
 *
 * Each item is `{ creator: { handle, name }, political: { is_political },
 * emotions: { valence: NEUTRAL } }`. The valence default is benign —
 * tone-related tests use their own helper, and tone-positive/negative
 * data here would just add noise.
 *
 * ai_analyzed: true is set so computeDashboardData.extractPoliticalAnalysis
 * runs (the gate at L748 requires `analysis.ai_analyzed`). Without
 * this flag, dashboardData.politicalAnalysis stays null and the engine
 * falls through to calm-case enrichment-not-available regardless of
 * what feed_items contains. Same enrichment-gate pattern as the
 * tone helper above.
 *
 * Used by Phase 6.4.5 to test political_creator_dominance,
 * political_trajectory, and calm-case no-political-content variants
 * against real-shape data.
 */
function withSyntheticPoliticalEnrichment(
  base: ScanDetail,
  items: Array<{ handle: string; name: string; isPolitical: boolean }>,
  options: {
    politicalPct?: number;
    id?: string;
    created_at?: string;
  } = {},
): ScanDetail {
  const clone = deepClone(base);
  if (options.id) clone.id = options.id;
  if (options.created_at) clone.created_at = options.created_at;
  const raw = clone.raw_data as Record<string, unknown>;
  const analysis =
    (raw.analysis as Record<string, unknown> | undefined) ?? {};
  analysis.ai_analyzed = true;
  if (options.politicalPct !== undefined) {
    analysis.political_content_summary = {
      political_percentage: options.politicalPct,
    };
  }
  analysis.feed_items = items.map((it) => ({
    creator: { handle: it.handle, name: it.name },
    political: { is_political: it.isPolitical },
    emotions: { valence: 'NEUTRAL' },
  }));
  raw.analysis = analysis;
  return clone;
}

/**
 * Inject synthetic suggested/followed posts into a deep-cloned
 * ScanDetail. Replaces `raw_data.posts` with the given list and
 * optionally locks `scan.suggested_percentage` for rolling-average
 * extraction.
 *
 * Each item is `{ creator_handle, creator_display_name, is_ad: false,
 * is_suggested, ...defaults }`. Other raw_data fields (analysis,
 * top_creators, etc.) are preserved from the base.
 *
 * Used by Phase 6.5.5 to test followed_creator_absence and
 * calm-case variants against real-shape data. The real fixtures
 * have 96% null is_suggested values which forces creatorNovelty.
 * approximate=true; this helper produces all-known is_suggested
 * values so the dramatic templates can fire.
 *
 * The `suggested_percentage` override is read by the engine's
 * rolling-average extractor at scan.suggested_percentage (top-level
 * column, not derived from posts). Computed-from-posts metrics on
 * dashboardData.suggestedPct still come from the post array.
 */
function withSyntheticFollowedSuggestedPosts(
  base: ScanDetail,
  items: Array<{
    handle: string;
    name?: string;
    isSuggested: boolean | null;
  }>,
  options: {
    id?: string;
    created_at?: string;
    suggested_percentage?: number;
  } = {},
): ScanDetail {
  const clone = deepClone(base);
  if (options.id) clone.id = options.id;
  if (options.created_at) clone.created_at = options.created_at;
  if (options.suggested_percentage !== undefined) {
    clone.suggested_percentage = options.suggested_percentage;
  }
  const raw = clone.raw_data as Record<string, unknown>;
  raw.posts = items.map((it, idx) => ({
    creator_handle: it.handle,
    creator_display_name: it.name ?? null,
    is_ad: false,
    is_suggested: it.isSuggested,
    content_type: 'video',
    hashtags: [],
    position_in_feed: idx + 1,
    ad_label_text: null,
  }));
  return clone;
}

/**
 * Build a 4-scan depth-padded window for persistent-creator smoke
 * testing. Returns scans newest-first:
 *   [REAL_ACTIVE_SCAN, REAL_PRIOR_SCAN, clone-1week-back, clone-2weeks-back]
 *
 * The clones preserve REAL_PRIOR_SCAN's posts (and thus its creator
 * distribution) verbatim; only the id and created_at are mutated so
 * the engine's desc-sort by date orders them after the original prior.
 */
function buildDepthPaddedScans(): [ScanDetail, ScanDetail[]] {
  const clone1 = deepClone(REAL_PRIOR_SCAN);
  clone1.id = 'synth-prior-1week';
  clone1.created_at = '2026-02-19T15:03:29.709+00:00';

  const clone2 = deepClone(REAL_PRIOR_SCAN);
  clone2.id = 'synth-prior-2weeks';
  clone2.created_at = '2026-02-12T15:03:29.709+00:00';

  const scans = [REAL_ACTIVE_SCAN, REAL_PRIOR_SCAN, clone1, clone2];
  return [REAL_ACTIVE_SCAN, scans];
}

describe('persistent-creator template — real-scan smoke (depth-padded)', () => {
  test('Results: persistent-creator template fires on a 4-scan synthesized window', () => {
    const [activeScan, scans] = buildDepthPaddedScans();
    const context: InterpretationContext = {
      activeScan,
      scans,
      dashboardData: computeDashboardData(activeScan),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'results');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke persistent-creator results] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'results');
    expect(result.verdict).toContain('steady presence');
    expect(result.findingDot).toBe(true);
    // Supporting card leads with Top voice (Phase 5.2.5 prepend).
    expect(result.supportingRows[0]).toMatchObject({
      variant: 'fact',
      label: 'Top voice',
    });
  });

  test('Overview: persistent-creator template fires on the same window with surface-specific copy', () => {
    const [activeScan, scans] = buildDepthPaddedScans();
    const context: InterpretationContext = {
      activeScan,
      scans,
      dashboardData: computeDashboardData(activeScan),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'dashboard.overview');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke persistent-creator dashboard.overview] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.overview');
    expect(result.verdict).toContain('keeps showing up');
    expect(result.findingDot).toBe(true);
    expect(result.supportingRows[0]).toMatchObject({
      variant: 'fact',
      label: 'Top voice',
    });
  });

  test('Sources: persistent-creator template fires with design-canonical "quietly become your most-seen voice" copy', () => {
    const [activeScan, scans] = buildDepthPaddedScans();
    const context: InterpretationContext = {
      activeScan,
      scans,
      dashboardData: computeDashboardData(activeScan),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'dashboard.sources');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke persistent-creator dashboard.sources] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.sources');
    // Sources verdict is design-canonical — distinct from Results
    // ("steady presence") and Overview ("keeps showing up").
    expect(result.verdict).toContain('quietly become your most-seen voice');
    expect(result.findingDot).toBe(true);
    expect(result.supportingRows[0]).toMatchObject({
      variant: 'fact',
      label: 'Top voice',
    });
  });

  test('Ads: advertiser-persistence template fires with design-canonical "sitting on your feed" copy', () => {
    const [activeScan, scans] = buildDepthPaddedScans();
    const context: InterpretationContext = {
      activeScan,
      scans,
      dashboardData: computeDashboardData(activeScan),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'dashboard.ads');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke advertiser-persistence dashboard.ads] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.ads');
    // The redacted Google ad (@creator-1) recurs across all 4 scans
    // in the depth-padded window — scanCount=4 well above the
    // persistence threshold (>= 3). Design-canonical verbatim verdict.
    expect(result.verdict).toBe(
      'One advertiser is sitting on your feed more than the others.',
    );
    expect(result.findingDot).toBe(true);
  });

  test('Tone: negative-tone-shift template fires when synthetic tone enrichment shows climbing negative', () => {
    // Synthesis approach: deep-clone REAL_ACTIVE_SCAN + REAL_PRIOR_SCAN
    // and inject Gemini-style tone enrichment into each. Active scan
    // gets 50% negative (5 NEGATIVE + 3 POSITIVE + 2 NEUTRAL out of 10
    // items); prior scans each get 20% negative (2 NEGATIVE + 4
    // POSITIVE + 4 NEUTRAL). Rolling-average extractor reads the
    // valences from raw_data.analysis.feed_items; ratio is 50/20 =
    // 2.5, above the 1.5× threshold AND above the 30% absolute floor.
    //
    // Documented as synthesis (not real fixture data) — Gemini tone
    // classification was incomplete on the captured production scans
    // (Phase 5.4.3 observation). The synthesis preserves the
    // surrounding raw_data shape (posts, top_creators, advertisers)
    // so other engine paths still see real-shape data; only the
    // valence sequence is synthetic.
    const activeWithTone = withSyntheticToneEnrichment(REAL_ACTIVE_SCAN, [
      'NEGATIVE',
      'NEGATIVE',
      'NEGATIVE',
      'NEGATIVE',
      'NEGATIVE',
      'POSITIVE',
      'POSITIVE',
      'POSITIVE',
      'NEUTRAL',
      'NEUTRAL',
    ]);
    const lowNegativeValences: Array<'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'> = [
      'NEGATIVE',
      'NEGATIVE',
      'POSITIVE',
      'POSITIVE',
      'POSITIVE',
      'POSITIVE',
      'NEUTRAL',
      'NEUTRAL',
      'NEUTRAL',
      'NEUTRAL',
    ];
    const priors = [
      withSyntheticToneEnrichment(REAL_PRIOR_SCAN, lowNegativeValences),
      withSyntheticToneEnrichment(REAL_PRIOR_SCAN, lowNegativeValences, {
        id: 'synth-tone-prior-1week',
        created_at: '2026-02-19T15:03:29.709+00:00',
      }),
      withSyntheticToneEnrichment(REAL_PRIOR_SCAN, lowNegativeValences, {
        id: 'synth-tone-prior-2weeks',
        created_at: '2026-02-12T15:03:29.709+00:00',
      }),
    ];

    const context: InterpretationContext = {
      activeScan: activeWithTone,
      scans: [activeWithTone, ...priors],
      dashboardData: computeDashboardData(activeWithTone),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'dashboard.tone');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke negative-tone-shift dashboard.tone] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.tone');
    expect(result.verdict).toContain('Negative tone has been climbing');
    expect(result.findingDot).toBe(true);
  });

  // ── Phase 6.4.5: Politics on depth-padded window ─────────────
  //
  // The 2-scan baseline (above, in the main describe block) exercises
  // the calm-case enrichment-not-available variant — the real
  // fixtures lack ai_analyzed. These tests synthesize Gemini political
  // enrichment on top of the depth-padded window to exercise the
  // dominance, no-political-content, and trajectory paths.

  test('Politics: calm-case no-political-content fires when AI ran but no political feed_items match', () => {
    // Synthesis: ai_analyzed: true on every scan, feed_items present
    // but ALL items have political.is_political === false. This is the
    // "AI scanned, nothing classified as political" path —
    // computeDashboardData returns politicalAnalysis with
    // politicalCount === 0, and the engine emits the
    // no-political-content calm variant.
    const benignItems = Array.from({ length: 8 }, (_, i) => ({
      handle: `@nonpolitical-${i}`,
      name: `Non-political ${i}`,
      isPolitical: false,
    }));
    const activeWithPolitics = withSyntheticPoliticalEnrichment(
      REAL_ACTIVE_SCAN,
      benignItems,
    );
    const priors = [
      withSyntheticPoliticalEnrichment(REAL_PRIOR_SCAN, benignItems),
      withSyntheticPoliticalEnrichment(REAL_PRIOR_SCAN, benignItems, {
        id: 'synth-politics-prior-1week',
        created_at: '2026-02-19T15:03:29.709+00:00',
      }),
      withSyntheticPoliticalEnrichment(REAL_PRIOR_SCAN, benignItems, {
        id: 'synth-politics-prior-2weeks',
        created_at: '2026-02-12T15:03:29.709+00:00',
      }),
    ];

    const context: InterpretationContext = {
      activeScan: activeWithPolitics,
      scans: [activeWithPolitics, ...priors],
      dashboardData: computeDashboardData(activeWithPolitics),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'dashboard.politics');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke calm-case no-political-content dashboard.politics] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.politics');
    expect(result.verdict).toContain('didn’t include political content');
    expect(result.findingDot).toBe(false);
  });

  test('Politics: political_creator_dominance template fires with design-canonical "isn\'t varied" verdict', () => {
    // Synthesis design:
    //   - Active scan: 8 political posts from @PoliticalNewsChannel + 3
    //     political posts from 3 distinct other creators + 9 non-political
    //     = 20 feed_items, 11 political, topPoliticalSource.pctOfPolitical
    //     = round(8/11 * 100) = 73 (design-canonical 73%).
    //   - REAL_PRIOR_SCAN: also contains @PoliticalNewsChannel political
    //     posts (so political-creator-recurrence scanCount = 2 → recency
    //     phrase "your last two scans", design-canonical).
    //   - Two older clones: no @PoliticalNewsChannel political content
    //     → recurrence stays at 2, well below the ceiling of 3.
    //
    // This combination puts every threshold above its floor:
    //   politicalCount = 11 >= 5 (>= 10 floor for topPoliticalSource)
    //   topPoliticalSource.pctOfPolitical = 73 >= 50
    //   recurrence.scanCount = 2 <= 3
    const activePoliticalItems = [
      // 8 @PoliticalNewsChannel political posts
      ...Array.from({ length: 8 }, () => ({
        handle: '@PoliticalNewsChannel',
        name: 'Political News Channel',
        isPolitical: true,
      })),
      // 3 other political creators (1 post each)
      {
        handle: '@OtherPol1',
        name: 'Other Political 1',
        isPolitical: true,
      },
      {
        handle: '@OtherPol2',
        name: 'Other Political 2',
        isPolitical: true,
      },
      {
        handle: '@OtherPol3',
        name: 'Other Political 3',
        isPolitical: true,
      },
      // 9 non-political fillers
      ...Array.from({ length: 9 }, (_, i) => ({
        handle: `@nonpolitical-${i}`,
        name: `Non-political ${i}`,
        isPolitical: false,
      })),
    ];

    const priorPoliticalItems = [
      // Prior scan also has @PoliticalNewsChannel so scanCount climbs to 2
      ...Array.from({ length: 5 }, () => ({
        handle: '@PoliticalNewsChannel',
        name: 'Political News Channel',
        isPolitical: true,
      })),
      ...Array.from({ length: 15 }, (_, i) => ({
        handle: `@nonpolitical-prior-${i}`,
        name: `Non-political Prior ${i}`,
        isPolitical: false,
      })),
    ];

    const olderItems = Array.from({ length: 20 }, (_, i) => ({
      handle: `@nonpolitical-older-${i}`,
      name: `Non-political Older ${i}`,
      isPolitical: false,
    }));

    const activeWithPolitics = withSyntheticPoliticalEnrichment(
      REAL_ACTIVE_SCAN,
      activePoliticalItems,
    );
    const priors = [
      withSyntheticPoliticalEnrichment(REAL_PRIOR_SCAN, priorPoliticalItems),
      withSyntheticPoliticalEnrichment(REAL_PRIOR_SCAN, olderItems, {
        id: 'synth-politics-prior-1week',
        created_at: '2026-02-19T15:03:29.709+00:00',
      }),
      withSyntheticPoliticalEnrichment(REAL_PRIOR_SCAN, olderItems, {
        id: 'synth-politics-prior-2weeks',
        created_at: '2026-02-12T15:03:29.709+00:00',
      }),
    ];

    const context: InterpretationContext = {
      activeScan: activeWithPolitics,
      scans: [activeWithPolitics, ...priors],
      dashboardData: computeDashboardData(activeWithPolitics),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'dashboard.politics');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke political_creator_dominance dashboard.politics] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.politics');
    // Design-canonical verbatim verdict.
    expect(result.verdict).toBe(
      'Your political exposure isn’t varied — it’s coming from one place.',
    );
    expect(result.findingDot).toBe(true);
    const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
    expect(observed?.text).toContain('your last two scans');
  });

  test('Politics: political_trajectory template fires when political_pct climbs across the window', () => {
    // Synthesis design:
    //   - Trajectory chronological order (oldest → newest): 4%, 7%, 11%.
    //     Active scan is the freshest at 11%; clones precede it.
    //   - REAL_PRIOR_SCAN gets pct 7% (middle of trajectory).
    //   - 1-week clone gets pct 4% (oldest in trajectory).
    //   - The 2-week clone falls outside the rolling-average's
    //     MIN_VALID_SCANS=3 floor calculation if we left it out, but
    //     trajectory uses windowSize=6 (default) so 4 entries works
    //     fine. We give the 2-week clone a benign 0% so it can
    //     still contribute without skewing the trajectory shape.
    //
    // Dominance must NOT fire — spread political content across many
    // distinct creators so topPoliticalSource.pctOfPolitical stays
    // below 50%. With 11 unique political creators contributing 1
    // post each on the active scan, top source = 9%.
    const activePoliticalItems = [
      // 11 unique political creators (1 post each) → no dominance.
      ...Array.from({ length: 11 }, (_, i) => ({
        handle: `@PolCreator-${i}`,
        name: `Political Creator ${i}`,
        isPolitical: true,
      })),
      // 9 non-political fillers → totalAnalyzed = 20, politicalPct = 55
      // by feed-items math. We override via political_content_summary
      // so the rolling-average / trajectory extractor reads 11%.
      ...Array.from({ length: 9 }, (_, i) => ({
        handle: `@nonpolitical-${i}`,
        name: `Non-political ${i}`,
        isPolitical: false,
      })),
    ];

    const benignSpread = Array.from({ length: 20 }, (_, i) => ({
      handle: `@spread-${i}`,
      name: `Spread ${i}`,
      isPolitical: false,
    }));

    const activeWithPolitics = withSyntheticPoliticalEnrichment(
      REAL_ACTIVE_SCAN,
      activePoliticalItems,
      { politicalPct: 11 },
    );
    const priors = [
      withSyntheticPoliticalEnrichment(REAL_PRIOR_SCAN, benignSpread, {
        politicalPct: 7,
      }),
      withSyntheticPoliticalEnrichment(REAL_PRIOR_SCAN, benignSpread, {
        id: 'synth-politics-traj-1week',
        created_at: '2026-02-19T15:03:29.709+00:00',
        politicalPct: 4,
      }),
      withSyntheticPoliticalEnrichment(REAL_PRIOR_SCAN, benignSpread, {
        id: 'synth-politics-traj-2weeks',
        created_at: '2026-02-12T15:03:29.709+00:00',
        politicalPct: 4,
      }),
    ];

    const context: InterpretationContext = {
      activeScan: activeWithPolitics,
      scans: [activeWithPolitics, ...priors],
      dashboardData: computeDashboardData(activeWithPolitics),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'dashboard.politics');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke political_trajectory dashboard.politics] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.politics');
    expect(result.verdict).toContain('growing share');
    // Surface-differentiation: must NOT use Overview's "climbing" frame.
    expect(result.verdict).not.toContain('Politics has been climbing');
    expect(result.findingDot).toBe(true);
  });

  // ── Phase 6.5.5: Suggested vs Followed on depth-padded window ─
  //
  // The 2-scan baseline (above, in the main describe block) exercises
  // the calm-case approximate-follow-detection variant — the real
  // fixtures have 96% null is_suggested. These tests synthesize
  // post-level is_suggested values on top of the depth-padded window
  // to exercise the all-suggested-leaning and followed-absence paths.

  test('Suggested: calm-case suggested-leaning fires on an all-suggested 4-scan window', () => {
    // Synthesis: every scan has 100% is_suggested=true posts from a
    // mix of suggested creators. creatorNovelty exists (suggested
    // creators > 0) and is non-approximate (no null is_suggested).
    // followed_creator_absence has no records (no is_suggested=false
    // posts), suggested_dominance has no elevation (rolling avg also
    // 100), so calm-case suggested-leaning fires (suggestedPct=100 >=
    // 60).
    const allSuggestedItems = Array.from({ length: 5 }, (_, i) => ({
      handle: `@news-${i}`,
      name: `News Source ${i}`,
      isSuggested: true,
    }));

    const activeWithMix = withSyntheticFollowedSuggestedPosts(
      REAL_ACTIVE_SCAN,
      allSuggestedItems,
      { suggested_percentage: 100 },
    );
    const priors = [
      withSyntheticFollowedSuggestedPosts(REAL_PRIOR_SCAN, allSuggestedItems, {
        suggested_percentage: 100,
      }),
      withSyntheticFollowedSuggestedPosts(REAL_PRIOR_SCAN, allSuggestedItems, {
        id: 'synth-sug-prior-1week',
        created_at: '2026-02-19T15:03:29.709+00:00',
        suggested_percentage: 100,
      }),
      withSyntheticFollowedSuggestedPosts(REAL_PRIOR_SCAN, allSuggestedItems, {
        id: 'synth-sug-prior-2weeks',
        created_at: '2026-02-12T15:03:29.709+00:00',
        suggested_percentage: 100,
      }),
    ];

    const context: InterpretationContext = {
      activeScan: activeWithMix,
      scans: [activeWithMix, ...priors],
      dashboardData: computeDashboardData(activeWithMix),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'dashboard.suggested');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke calm-case suggested-leaning dashboard.suggested] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.suggested');
    expect(result.verdict).toContain('Suggestions made up most');
    expect(result.findingDot).toBe(false);
  });

  test('Suggested: followed_creator_absence template fires with design-canonical "gone quiet" verdict', () => {
    // Synthesis design:
    //   - Active scan: 5 suggested + 3 followed posts from @other1
    //     (suggestedPct ≈ 62, mirrors design-canonical 62%).
    //     creatorNovelty: 5 suggested creators, 1 followed creator,
    //     approximate=false. Active does NOT include @MKBHD.
    //   - REAL_PRIOR_SCAN (8 days before active): 3 @MKBHD followed
    //     posts + 5 suggested = 8 posts total.
    //   - Two older clones: 3 @MKBHD followed + 5 suggested each.
    //   - All priors carry suggested_percentage=60 so rolling avg
    //     reads 60 (design-canonical).
    //
    // Expected: @MKBHD has scanCount=3, totalPosts=9, top followed
    // creator, lastSeenAt ≈ 8 days before active → daysSinceLastSeen=8.
    // followed_creator_absence template predicate matches; verdict
    // ships design-canonical verbatim.
    const activeItems = [
      ...Array.from({ length: 5 }, (_, i) => ({
        handle: `@news-${i}`,
        name: `News Source ${i}`,
        isSuggested: true,
      })),
      ...Array.from({ length: 3 }, () => ({
        handle: '@other1',
        name: 'Other Creator',
        isSuggested: false,
      })),
    ];

    const priorItems = [
      ...Array.from({ length: 3 }, () => ({
        handle: '@mkbhd',
        name: 'MKBHD',
        isSuggested: false,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        handle: `@news-${i}`,
        name: `News Source ${i}`,
        isSuggested: true,
      })),
    ];

    // Active scan: REAL_ACTIVE_SCAN's created_at (2026-02-27).
    // Prior dates set 8/12/14 days before active to produce
    // daysSinceLastSeen=8 for @MKBHD's most recent appearance.
    // The active scan's id and created_at are preserved (no
    // override) so assertResultShape's meta.scanId check passes
    // against the real fixture's id.
    const activeWithMix = withSyntheticFollowedSuggestedPosts(
      REAL_ACTIVE_SCAN,
      activeItems,
      { suggested_percentage: 62 },
    );
    const priors = [
      withSyntheticFollowedSuggestedPosts(REAL_PRIOR_SCAN, priorItems, {
        id: 'synth-sug-prior-8d',
        created_at: '2026-02-19T12:52:44.187+00:00',
        suggested_percentage: 60,
      }),
      withSyntheticFollowedSuggestedPosts(REAL_PRIOR_SCAN, priorItems, {
        id: 'synth-sug-prior-12d',
        created_at: '2026-02-15T12:52:44.187+00:00',
        suggested_percentage: 60,
      }),
      withSyntheticFollowedSuggestedPosts(REAL_PRIOR_SCAN, priorItems, {
        id: 'synth-sug-prior-14d',
        created_at: '2026-02-13T12:52:44.187+00:00',
        suggested_percentage: 60,
      }),
    ];

    const context: InterpretationContext = {
      activeScan: activeWithMix,
      scans: [activeWithMix, ...priors],
      dashboardData: computeDashboardData(activeWithMix),
      platform: 'youtube',
    };

    const result = interpretScan(context, 'dashboard.suggested');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke followed_creator_absence dashboard.suggested] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    assertResultShape(result, 'dashboard.suggested');
    // Design-canonical verbatim verdict.
    expect(result.verdict).toBe(
      'Your followed creators have gone quiet, so suggestions are filling the gap.',
    );
    expect(result.findingDot).toBe(true);
    const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
    expect(observed?.text).toContain('MKBHD');
    expect(observed?.text).toContain('top followed creator');
    expect(observed?.text).toMatch(/hasn't posted in \d+ days/);
  });
});

describe('computeCreatorRecurrence — real-scan smoke', () => {
  test('derivation produces a sensible result for two real YouTube scans', () => {
    // Pass both fixtures as the scan history. No excludeScanId — we
    // want recurrence COUNTING the active scan, since the design
    // spec's worked examples ("in 5 of last 6 scans") count today.
    const result = computeCreatorRecurrence(
      [REAL_ACTIVE_SCAN, REAL_PRIOR_SCAN],
      'youtube',
    );

    // Load-bearing observation: log the full derivation output on
    // the real fixture. The YouTube shorts null-handle gap (Issue
    // #10) will dominate — most posts in both scans have null
    // creator_handle. We expect to see only the ad-source creators
    // (which DO have handles) in the records, and whether any of
    // them appear in both scans.
    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke creatorRecurrence] CreatorRecurrenceResult:\n' +
        JSON.stringify(result, null, 2),
    );

    // Shape assertions — deliberately loose.
    expect(Array.isArray(result.records)).toBe(true);
    // Both fixtures are YouTube, neither excluded → window of 2.
    expect(result.windowScanCount).toBe(2);

    // Records are sorted by scanCount desc, then totalPosts desc.
    // Verify monotonic non-increasing on the composite key.
    for (let i = 1; i < result.records.length; i++) {
      const prev = result.records[i - 1]!;
      const curr = result.records[i]!;
      if (prev.scanCount === curr.scanCount) {
        expect(curr.totalPosts).toBeLessThanOrEqual(prev.totalPosts);
      } else {
        expect(curr.scanCount).toBeLessThan(prev.scanCount);
      }
    }

    // Per-record shape sanity. Don't assert specific creators (Issue
    // #10 makes the population thin and unstable).
    for (const r of result.records) {
      expect(typeof r.handle).toBe('string');
      expect(r.handle.length).toBeGreaterThan(0);
      expect(typeof r.displayName).toBe('string');
      expect(r.scanCount).toBeGreaterThanOrEqual(1);
      expect(r.scanCount).toBeLessThanOrEqual(result.windowScanCount);
      expect(r.totalPosts).toBeGreaterThanOrEqual(r.scanCount);
      expect(r.firstSeenIndex).toBeGreaterThanOrEqual(0);
      expect(r.firstSeenIndex).toBeLessThan(result.windowScanCount);
    }
  });
});

// ============================================
// Advertiser-recurrence smoke (Phase 5.4.3)
// ============================================
//
// Two cases: real 2-scan fixture, and depth-padded 4-scan window
// (reusing buildDepthPaddedScans from Phase 5.3.3 — the synth-prior
// clones include the prior's ad posts verbatim, so they naturally
// produce recurring advertisers).

describe('computeAdvertiserRecurrence — real-scan smoke', () => {
  test('derivation produces sensible output on the 2-scan real fixture', () => {
    const result = computeAdvertiserRecurrence(
      [REAL_ACTIVE_SCAN, REAL_PRIOR_SCAN],
      'youtube',
    );

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke advertiserRecurrence 2-scan] AdvertiserRecurrenceResult:\n' +
        JSON.stringify(result, null, 2),
    );

    expect(Array.isArray(result.records)).toBe(true);
    expect(result.windowScanCount).toBe(2);

    // Sort order: scanCount desc, then totalPosts desc.
    for (let i = 1; i < result.records.length; i++) {
      const prev = result.records[i - 1]!;
      const curr = result.records[i]!;
      if (prev.scanCount === curr.scanCount) {
        expect(curr.totalPosts).toBeLessThanOrEqual(prev.totalPosts);
      } else {
        expect(curr.scanCount).toBeLessThan(prev.scanCount);
      }
    }

    // Per-record shape sanity.
    for (const r of result.records) {
      expect(typeof r.handle).toBe('string');
      expect(r.handle.length).toBeGreaterThan(0);
      expect(typeof r.displayName).toBe('string');
      expect(r.scanCount).toBeGreaterThanOrEqual(1);
      expect(r.scanCount).toBeLessThanOrEqual(result.windowScanCount);
      expect(r.totalPosts).toBeGreaterThanOrEqual(r.scanCount);
    }
  });

  test('derivation produces meaningful recurrence on the depth-padded 4-scan window', () => {
    const [, scans] = buildDepthPaddedScans();
    const result = computeAdvertiserRecurrence(scans, 'youtube');

    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke advertiserRecurrence 4-scan padded] AdvertiserRecurrenceResult:\n' +
        JSON.stringify(result, null, 2),
    );

    expect(result.windowScanCount).toBe(4);
    // The synth-prior clones include the prior's ad posts verbatim,
    // so at least one advertiser should recur across the window.
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.records[0]!.scanCount).toBeGreaterThanOrEqual(2);
  });
});
