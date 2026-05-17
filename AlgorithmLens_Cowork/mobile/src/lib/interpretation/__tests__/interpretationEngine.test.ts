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

  describe('calm-case template', () => {
    // Phase 4.5.2.2 replaced the inline orchestrator fallback with a
    // real template that emits two sublines + the four-row supporting
    // card. These tests verify the three variant branches and the
    // shape contract.

    test('fallback variant fires when no other condition matches', () => {
      // suggestedPct < 80, no content-type dominance, concentrated
      // feed's top-creator predicate fails (5/50 = 10%). Landing in
      // the calm-case template's fallback variant.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          adPct: 11,
          suggestedPct: 60,
          followedPct: 40,
          topCreators: [
            { name: 'alice', count: 5 },
          ] as unknown as DashboardData['topCreators'],
          contentTypes: [],
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('50 posts captured');
      expect(result.verdict).toContain('nothing unusual flagged');
      expect(result.findingDot).toBe(false);
      // Two sublines (OBSERVED + LIKELY) and the four-row supporting card.
      expect(result.sublines).toHaveLength(2);
      expect(result.sublines.map((s) => s.mode)).toEqual([
        'OBSERVED',
        'LIKELY',
      ]);
      expect(result.supportingRows).toHaveLength(4);
      expect(result.supportingRows.map((r) => r.variant)).toEqual([
        'fact',
        'fact',
        'fact',
        'fact',
      ]);
    });

    test('high-suggested variant fires when suggestedPct >= 80', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 37,
          adPct: 3,
          suggestedPct: 100,
          followedPct: 0,
          topCreators: [],
          contentTypes: [
            { label: 'Short', count: 30, percentage: 81 },
          ] as DashboardData['contentTypes'],
        }),
      });
      const result = interpretScan(ctx, 'results');
      // High-suggested takes precedence over content-type-dominant
      // when both could fire.
      expect(result.verdict).toContain('came from suggestions');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('100%');
      expect(observed?.text).toContain('suggested');
      const likely = result.sublines.find((s) => s.mode === 'LIKELY');
      // No anthropomorphism — mechanism language only.
      expect(likely?.text).toContain('weights');
    });

    test('content-type-dominant variant fires when one type >= 50%', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 40,
          adPct: 8,
          suggestedPct: 50, // below high-suggested threshold
          followedPct: 50,
          topCreators: [],
          contentTypes: [
            { label: 'Photo', count: 28, percentage: 70 },
            { label: 'Video', count: 12, percentage: 30 },
          ] as DashboardData['contentTypes'],
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('mostly photos');
      expect(result.verdict).toContain('this session');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('70%');
      expect(observed?.text).toContain('photos');
    });

    test('content-type-dominant skips Unknown label', () => {
      // "Unknown" is a real bucket from countContentTypes when posts
      // lack content_type. Promoting it to the verdict would read as
      // "Mostly unknowns this session" — unhelpful. Should fall
      // through to the fallback variant.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          adPct: 10,
          suggestedPct: 60,
          followedPct: 40,
          topCreators: [],
          contentTypes: [
            { label: 'Unknown', count: 40, percentage: 80 },
          ] as DashboardData['contentTypes'],
        }),
      });
      const result = interpretScan(ctx, 'results');
      // Verdict should be the fallback, not a "mostly unknowns" string.
      expect(result.verdict).toContain('nothing unusual flagged');
      expect(result.verdict).not.toContain('unknown');
    });

    test('concentrated-feed template still wins when both could match', () => {
      // High suggestedPct AND high top-creator share. Concentrated
      // feed has higher priority (50 > 10), so its template wins.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          adPct: 10,
          suggestedPct: 100,
          followedPct: 0,
          topCreators: [
            { name: 'alice', count: 20 },
          ] as unknown as DashboardData['topCreators'],
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('A few voices are shaping');
      expect(result.verdict).not.toContain('came from suggestions');
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

    test('calm-case template interpolates platform name', () => {
      // Forces the high-suggested variant so we get a verdict with
      // "your <Platform> feed" interpolation rather than the
      // fallback-variant wording that leads with the post count.
      const ctx = makeContext({
        platform: 'tiktok',
        activeScan: makeScan({ platform: 'tiktok' }),
        dashboardData: makeDashboardData({
          totalPosts: 50,
          suggestedPct: 95,
          followedPct: 5,
          topCreators: [
            { name: 'alice', count: 5 },
          ] as unknown as DashboardData['topCreators'],
          platform: 'tiktok',
        }),
      });
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toBe(
        'Almost everything in your TikTok feed came from suggestions.',
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
