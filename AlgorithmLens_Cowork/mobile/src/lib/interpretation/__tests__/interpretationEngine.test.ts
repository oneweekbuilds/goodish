/**
 * Unit tests for the interpretation engine orchestrator.
 *
 * Phase 3.2 of MVP implementation. Tests cover:
 *   - Template dispatch (concentrated feed fires when top creator >= 25%)
 *   - Calm-case fallback when no template matches
 *   - Surface gating (unimplemented surfaces throw)
 *   - Platform interpolation in both rendered and fallback verdicts
 *
 * DashboardData and ScanDetail are mocked inline with `as unknown as`
 * casts: the templates only read a small subset of these types, so
 * exhaustively constructing every nullable field would obscure the
 * test intent.
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import type { DashboardData } from '../../computeDashboardData';
import type { InterpretationContext } from '../interpretation-types';
import { interpretScan } from '../interpretationEngine';

// ============================================
// Test fixture helpers
// ============================================

function makeScan(overrides: Partial<ScanDetail> = {}): ScanDetail {
  return {
    id: 'scan-test',
    scan_id: 'scan-test-uuid',
    created_at: '2026-05-01T12:00:00Z',
    platform: 'youtube',
    post_count: 50,
    ad_count: 5,
    ad_percentage: 10,
    suggested_count: 30,
    suggested_percentage: 60,
    raw_data: {},
    user_id: 'user-test',
    ...overrides,
  };
}

/**
 * Minimal DashboardData mock covering only the fields the templates
 * read. The cast lets tests skip the long tail of nullable/optional
 * fields the concentrated-feed template doesn't touch.
 */
function makeDashboardData(
  overrides: Partial<DashboardData> = {},
): DashboardData {
  return {
    totalPosts: 50,
    adPct: 10,
    topCreators: [],
    contentTypes: [],
    politicalAnalysis: null,
    toneAnalysis: null,
    platform: 'youtube',
    ...overrides,
  } as unknown as DashboardData;
}

function makeContext(
  overrides: Partial<InterpretationContext> = {},
): InterpretationContext {
  const activeScan = overrides.activeScan ?? makeScan();
  return {
    activeScan,
    scans: [activeScan],
    dashboardData: makeDashboardData({ platform: activeScan.platform }),
    platform: activeScan.platform,
    ...overrides,
  };
}

// ============================================
// Tests
// ============================================

describe('interpretScan orchestrator', () => {
  describe('template dispatch', () => {
    test('returns concentrated feed output when top creator >= 25%', () => {
      // 14 of 50 posts = 28% > 25% threshold.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 14 },
            { name: 'bob', count: 5 },
          ] as unknown as DashboardData['topCreators'],
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('A few voices are shaping');
      expect(result.findingDot).toBe(true);
      expect(result.sublines.length).toBeGreaterThanOrEqual(2);
      // Confirm we got OBSERVED + LIKELY (the concentrated template's pair).
      expect(result.sublines.map((s) => s.mode)).toEqual(
        expect.arrayContaining(['OBSERVED', 'LIKELY']),
      );
    });

    test('OBSERVED sub-line carries the actual percentage', () => {
      // 14 of 50 = 28%; top-three (14+5+3) of 50 = 44%.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 14 },
            { name: 'bob', count: 5 },
            { name: 'carol', count: 3 },
          ] as unknown as DashboardData['topCreators'],
        }),
      });
      const result = interpretScan(ctx, 'results');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('28%');
      expect(observed?.text).toContain('44%');
    });
  });

  describe('calm-case fallback', () => {
    test('returns calm-case verdict when top creator < 25%', () => {
      // 5 of 50 = 10%, below threshold.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 5 },
          ] as unknown as DashboardData['topCreators'],
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('usual shape');
      expect(result.findingDot).toBe(false);
      expect(result.supportingRows).toEqual([]);
      expect(result.sublines).toHaveLength(1);
      expect(result.sublines[0]?.mode).toBe('OBSERVED');
    });

    test('returns calm-case when topCreators array is empty', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [],
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('usual shape');
      expect(result.findingDot).toBe(false);
    });

    test('returns calm-case when totalPosts is zero', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 0,
          topCreators: [
            { name: 'alice', count: 10 },
          ] as unknown as DashboardData['topCreators'],
        }),
      });
      const result = interpretScan(ctx, 'results');
      // Top-creator-share predicate guards against totalPosts<=0,
      // so the template doesn't fire and we land in calm-case.
      expect(result.verdict).toContain('usual shape');
    });
  });

  describe('surface gating', () => {
    test('throws on dashboard.overview surface (not yet implemented)', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.overview')).toThrow(
        /dashboard\.overview not yet implemented/,
      );
    });

    test('throws on dashboard.sources surface', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.sources')).toThrow(
        /dashboard\.sources not yet implemented/,
      );
    });

    test('throws on dashboard.ads surface', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.ads')).toThrow(
        /dashboard\.ads not yet implemented/,
      );
    });

    test('does not throw on results surface', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'results')).not.toThrow();
    });
  });

  describe('platform interpolation', () => {
    test('template verdict capitalizes youtube as YouTube', () => {
      const ctx = makeContext({
        platform: 'youtube',
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 14 },
          ] as unknown as DashboardData['topCreators'],
          platform: 'youtube',
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('YouTube');
    });

    test('template verdict capitalizes instagram as Instagram', () => {
      const ctx = makeContext({
        platform: 'instagram',
        activeScan: makeScan({ platform: 'instagram' }),
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 14 },
          ] as unknown as DashboardData['topCreators'],
          platform: 'instagram',
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('Instagram');
    });

    test('template verdict converts twitter to X (brand convention)', () => {
      const ctx = makeContext({
        platform: 'twitter',
        activeScan: makeScan({ platform: 'twitter' }),
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 14 },
          ] as unknown as DashboardData['topCreators'],
          platform: 'twitter',
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('X');
      expect(result.verdict).not.toContain('Twitter');
    });

    test('calm-case verdict also interpolates platform name', () => {
      const ctx = makeContext({
        platform: 'tiktok',
        activeScan: makeScan({ platform: 'tiktok' }),
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 5 },
          ] as unknown as DashboardData['topCreators'],
          platform: 'tiktok',
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toBe(
        'Your TikTok feed is in its usual shape.',
      );
    });
  });

  describe('result meta', () => {
    test('meta surface is always "results" for Phase 3.2', () => {
      const ctx = makeContext();
      const result = interpretScan(ctx, 'results');
      expect(result.meta?.surface).toBe('results');
    });

    test('meta scanId prefers scan_id, falls back to id', () => {
      const ctx = makeContext({
        activeScan: makeScan({ id: 'row-uuid', scan_id: 'logical-id' }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.meta?.scanId).toBe('logical-id');
    });

    test('meta scanId falls back to id when scan_id is undefined', () => {
      const ctx = makeContext({
        activeScan: makeScan({ id: 'row-uuid', scan_id: undefined }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.meta?.scanId).toBe('row-uuid');
    });
  });
});
