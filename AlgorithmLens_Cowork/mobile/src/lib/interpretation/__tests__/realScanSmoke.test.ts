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

import { computeDashboardData } from '../../computeDashboardData';
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
  return {
    activeScan: REAL_ACTIVE_SCAN,
    scans: [REAL_PRIOR_SCAN],
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
