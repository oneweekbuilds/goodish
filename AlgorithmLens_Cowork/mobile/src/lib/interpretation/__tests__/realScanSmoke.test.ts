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
import { interpretScan } from '../interpretationEngine';
import type {
  InterpretationContext,
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

describe('interpretationEngine — real-scan smoke', () => {
  test('engine produces a sensible result for a real YouTube scan', () => {
    const dashboardData = computeDashboardData(REAL_ACTIVE_SCAN);

    const context: InterpretationContext = {
      activeScan: REAL_ACTIVE_SCAN,
      scans: [REAL_PRIOR_SCAN],
      dashboardData,
      platform: 'youtube',
    };

    // The engine should not throw on real data. If it does, the
    // failure surfaces immediately and we stop to diagnose.
    const result = interpretScan(context, 'results');

    // Log the full output so a human can read what the engine
    // produced. This is the load-bearing observation of Phase 4.5.1a.
    // eslint-disable-next-line no-console
    console.log(
      '[realScanSmoke] InterpretationResult:\n' +
        JSON.stringify(result, null, 2),
    );

    // Shape assertions — deliberately loose, just enough to confirm
    // the engine produced a well-formed result.
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
    expect(result.meta!.surface).toBe('results');
    expect(result.meta!.scanId).toBe(
      REAL_ACTIVE_SCAN.scan_id ?? REAL_ACTIVE_SCAN.id,
    );
  });
});
