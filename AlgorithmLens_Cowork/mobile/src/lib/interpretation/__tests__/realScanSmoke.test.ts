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
