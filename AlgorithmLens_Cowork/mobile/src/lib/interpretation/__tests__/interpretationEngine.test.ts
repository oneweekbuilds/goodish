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
    test('does not throw on results surface', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'results')).not.toThrow();
    });

    test('does not throw on dashboard.overview surface (Phase 5.1.3)', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.overview')).not.toThrow();
    });

    test('does not throw on dashboard.sources surface (Phase 6.1.3)', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.sources')).not.toThrow();
    });

    test('throws on dashboard.ads surface', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.ads')).toThrow(
        /dashboard\.ads not yet implemented/,
      );
    });

    test('throws on dashboard.politics surface', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.politics')).toThrow(
        /dashboard\.politics not yet implemented/,
      );
    });

    test('throws on dashboard.tone surface', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.tone')).toThrow(
        /dashboard\.tone not yet implemented/,
      );
    });

    test('throws on dashboard.suggested surface', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.suggested')).toThrow(
        /dashboard\.suggested not yet implemented/,
      );
    });
  });

  // ============================================
  // Dashboard Overview surface (Phase 5.1.3)
  // ============================================

  describe('dashboard.overview surface', () => {
    /**
     * Build a ScanDetail with a political_percentage embedded in
     * raw_data.analysis.political_content_summary, so
     * computeRollingAverage can read it for prior-scan averaging.
     */
    function makeScanWithPoliticalPct(
      politicalPct: number,
      overrides: Partial<ScanDetail> = {},
    ): ScanDetail {
      return makeScan({
        raw_data: {
          analysis: {
            political_content_summary: {
              political_percentage: politicalPct,
            },
          },
        },
        ...overrides,
      });
    }

    test('political_shift template fires when political content climbs vs rolling average', () => {
      // Prior scans average 3.5% political; current is 11% — well above
      // both the 7% absolute floor and 1.5× the rolling average (5.25%).
      const activeScan = makeScan({ id: 'active' });
      const priorScans = [
        makeScanWithPoliticalPct(3, { id: 'prior-1' }),
        makeScanWithPoliticalPct(4, { id: 'prior-2' }),
        makeScanWithPoliticalPct(4, { id: 'prior-3' }),
      ];
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan, ...priorScans],
        dashboardData: makeDashboardData({
          politicalAnalysis: {
            politicalPct: 11,
            politicalCount: 5,
          } as unknown as DashboardData['politicalAnalysis'],
        }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.verdict).toContain('climbing');
      expect(result.verdict).toContain('YouTube');
      expect(result.findingDot).toBe(true);
      expect(result.sublines.map((s) => s.mode)).toEqual([
        'OBSERVED',
        'LIKELY',
      ]);
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('11%');
    });

    test('heavy_ad_load template fires when ad density unusually high vs history', () => {
      // Prior scans average 8% ads; current is 20% — above the 15%
      // absolute floor and above 1.5× the rolling avg (12%).
      const activeScan = makeScan({ id: 'active', ad_percentage: 20 });
      const priorScans = [
        makeScan({ id: 'prior-1', ad_percentage: 8 }),
        makeScan({ id: 'prior-2', ad_percentage: 8 }),
        makeScan({ id: 'prior-3', ad_percentage: 8 }),
      ];
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan, ...priorScans],
        dashboardData: makeDashboardData({ adPct: 20 }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.verdict).toContain('ad-heavy');
      expect(result.findingDot).toBe(true);
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('20%');
    });

    test('concentrated_feed fires on Overview with surface-specific copy (not Results copy)', () => {
      // 14 of 50 = 28%, above the 25% threshold.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 14 },
            { name: 'bob', count: 5 },
          ] as unknown as DashboardData['topCreators'],
        }),
      });
      const result = interpretScan(ctx, 'dashboard.overview');
      // Overview-specific wording.
      expect(result.verdict).toContain('doing most of the talking');
      // The Results verdict for the same predicate uses different wording.
      expect(result.verdict).not.toContain('shaping');
      expect(result.findingDot).toBe(true);
    });

    test('political_shift wins over heavy_ad_load when both could match (priority order)', () => {
      // Both predicates true: ad spike AND political climb.
      const activeScan = makeScan({ id: 'active', ad_percentage: 20 });
      const priorScans = [
        makeScanWithPoliticalPct(3, { id: 'prior-1', ad_percentage: 8 }),
        makeScanWithPoliticalPct(4, { id: 'prior-2', ad_percentage: 8 }),
        makeScanWithPoliticalPct(4, { id: 'prior-3', ad_percentage: 8 }),
      ];
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan, ...priorScans],
        dashboardData: makeDashboardData({
          adPct: 20,
          politicalAnalysis: {
            politicalPct: 11,
            politicalCount: 5,
          } as unknown as DashboardData['politicalAnalysis'],
        }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      // Political shift (priority 70) beats heavy ads (priority 60).
      expect(result.verdict).toContain('climbing');
      expect(result.verdict).not.toContain('ad-heavy');
    });

    test('calm-case fallback variant fires when no dramatic template matches', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 40,
          adPct: 8,
          suggestedPct: 50,
          followedPct: 50,
          topCreators: [],
          contentTypes: [],
          politicalAnalysis: null,
        }),
      });
      const result = interpretScan(ctx, 'dashboard.overview');
      // Overview fallback verdict, distinct from Results' "nothing unusual flagged".
      expect(result.verdict).toContain('40 posts captured today');
      expect(result.verdict).toContain('usual mix');
      expect(result.findingDot).toBe(false);
      // Four-row supporting card still emitted.
      expect(result.supportingRows).toHaveLength(4);
    });

    test('calm-case high-suggested variant fires when suggestedPct >= 80', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 37,
          adPct: 3,
          suggestedPct: 100,
          followedPct: 0,
          topCreators: [],
          contentTypes: [],
        }),
      });
      const result = interpretScan(ctx, 'dashboard.overview');
      // Overview's high-suggested copy says "today", "not accounts you follow".
      // Distinct from Results' "Almost everything in your YouTube feed came from suggestions."
      expect(result.verdict).toContain('came from suggestions');
      expect(result.verdict).toContain('not accounts you follow');
      expect(result.findingDot).toBe(false);
    });

    test('calm-case content-type-dominant variant fires when one type >= 50%', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 40,
          adPct: 8,
          suggestedPct: 50, // below high-suggested threshold
          followedPct: 50,
          topCreators: [],
          contentTypes: [
            { label: 'Short', count: 28, percentage: 70 },
            { label: 'Video', count: 12, percentage: 30 },
          ] as DashboardData['contentTypes'],
        }),
      });
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.verdict).toContain('dominated by shorts');
      expect(result.verdict).toContain('today');
    });

    test('meta.surface is "dashboard.overview"', () => {
      const ctx = makeContext();
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.meta?.surface).toBe('dashboard.overview');
    });
  });

  // ============================================
  // Persistent-creator template (Phase 5.3.1)
  // ============================================
  //
  // Shared helpers for both surfaces. The persistent-creator
  // template's predicate reads cross-scan recurrence, so fixtures
  // need raw_data.posts populated with creator handles across
  // multiple scans.

  /**
   * Make a ScanDetail whose raw_data.posts attribute every post to
   * the same creator. Use to construct a window where one creator
   * recurs across N of M scans.
   */
  function makeScanWithCreator(
    id: string,
    createdAt: string,
    handle: string,
    displayName: string,
    postCount = 1,
    overrides: Partial<ScanDetail> = {},
  ): ScanDetail {
    return makeScan({
      id,
      created_at: createdAt,
      raw_data: {
        posts: Array.from({ length: postCount }).map((_, idx) => ({
          creator_handle: handle,
          creator_display_name: displayName,
          is_ad: false,
          is_suggested: null,
          content_type: 'video',
          hashtags: [],
          position_in_feed: idx + 1,
          ad_label_text: null,
        })),
      },
      ...overrides,
    });
  }

  /**
   * Make a ScanDetail with both a recurring creator AND a political
   * percentage embedded in raw_data.analysis. Used for precedence
   * tests where political_shift and persistent_creator both fire.
   */
  function makeScanWithCreatorAndPolitical(
    id: string,
    createdAt: string,
    handle: string,
    displayName: string,
    politicalPct: number,
    overrides: Partial<ScanDetail> = {},
  ): ScanDetail {
    return makeScan({
      id,
      created_at: createdAt,
      raw_data: {
        analysis: {
          political_content_summary: {
            political_percentage: politicalPct,
          },
        },
        posts: [
          {
            creator_handle: handle,
            creator_display_name: displayName,
            is_ad: false,
            is_suggested: null,
            content_type: 'video',
            hashtags: [],
            position_in_feed: 1,
            ad_label_text: null,
          },
        ],
      },
      ...overrides,
    });
  }

  /**
   * Build a 4-scan window with @foo as a recurring creator in
   * `scanCount` of them. Older scans (beyond scanCount) don't include
   * @foo. Returns the array sorted newest-first (active scan at
   * index 0) so the engine's desc-sort lands it as windowScanCount=4
   * after filtering.
   */
  function buildFourScanWindowWithRecurringFoo(
    scanCount: number,
  ): ScanDetail[] {
    const dates = [
      '2026-05-13T12:00:00Z',
      '2026-05-12T12:00:00Z',
      '2026-05-11T12:00:00Z',
      '2026-05-10T12:00:00Z',
    ];
    return dates.map((createdAt, idx) => {
      if (idx < scanCount) {
        return makeScanWithCreator(
          `s${idx}`,
          createdAt,
          '@foo',
          'Foo',
          1,
        );
      }
      // Use a different unique creator so the scan isn't empty but
      // doesn't contribute to @foo's recurrence count.
      return makeScanWithCreator(
        `s${idx}`,
        createdAt,
        `@other-${idx}`,
        `Other ${idx}`,
        1,
      );
    });
  }

  describe('persistent-creator template — Results surface', () => {
    test('fires at minimum threshold (3 of 4)', () => {
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).toContain('steady presence');
      expect(result.verdict).toContain('YouTube');
    });

    test('fires at design-canonical depth (5 of 6) with verbatim "5 of last 6 scans" copy', () => {
      const dates = [
        '2026-05-15T12:00:00Z',
        '2026-05-14T12:00:00Z',
        '2026-05-13T12:00:00Z',
        '2026-05-12T12:00:00Z',
        '2026-05-11T12:00:00Z',
        '2026-05-10T12:00:00Z',
      ];
      const scans = dates.map((createdAt, idx) =>
        idx < 5
          ? makeScanWithCreator(`s${idx}`, createdAt, '@foo', 'Foo')
          : makeScanWithCreator(`s${idx}`, createdAt, '@other', 'Other'),
      );
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'results');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      // Design-canonical copy: "in 5 of your last 6 scans"
      expect(observed?.text).toContain('5 of your last 6 scans');
    });

    test('does not fire below scanCount threshold (2 of 4 → calm-case)', () => {
      const scans = buildFourScanWindowWithRecurringFoo(2);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'results');
      // Calm-case fallback verdict — not persistent-creator.
      expect(result.verdict).not.toContain('steady presence');
      expect(result.verdict).toContain('nothing unusual flagged');
    });

    test('does not fire on shallow window (3 of 3 → calm-case)', () => {
      // 3 scans, all with @foo. scanCount=3 meets the count threshold
      // but windowScanCount=3 fails the >= 4 threshold.
      const scans = [
        makeScanWithCreator('s0', '2026-05-12T12:00:00Z', '@foo', 'Foo'),
        makeScanWithCreator('s1', '2026-05-11T12:00:00Z', '@foo', 'Foo'),
        makeScanWithCreator('s2', '2026-05-10T12:00:00Z', '@foo', 'Foo'),
      ];
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'results');
      expect(result.verdict).not.toContain('steady presence');
    });

    test('wins over concentrated_feed when both could match', () => {
      // Persistent creator + high single-scan top-creator share.
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 20 },
          ] as unknown as DashboardData['topCreators'],
        }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'results');
      // Persistent-creator (priority 60) beats concentrated-feed (50).
      expect(result.verdict).toContain('steady presence');
      expect(result.verdict).not.toContain('A few voices are shaping');
    });

    test('OBSERVED interpolates displayName, scanCount, windowScanCount, totalPosts', () => {
      // Use 2 posts per scan to test totalPosts correctly sums.
      const scans = [
        makeScanWithCreator('s0', '2026-05-13T12:00:00Z', '@mkbhd', 'MKBHD', 2),
        makeScanWithCreator('s1', '2026-05-12T12:00:00Z', '@mkbhd', 'MKBHD', 2),
        makeScanWithCreator('s2', '2026-05-11T12:00:00Z', '@mkbhd', 'MKBHD', 2),
        makeScanWithCreator('s3', '2026-05-10T12:00:00Z', '@other', 'Other'),
      ];
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'results');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('MKBHD');
      expect(observed?.text).toContain('3 of your last 4 scans');
      expect(observed?.text).toContain('6 posts');
    });

    test('supporting rows include Top voice as the first row', () => {
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'results');
      // Top voice prepended (Phase 5.2.5) when recurrence justifies.
      expect(result.supportingRows[0]).toMatchObject({
        variant: 'fact',
        label: 'Top voice',
      });
    });

    test('findingDot is true', () => {
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'results');
      expect(result.findingDot).toBe(true);
    });
  });

  describe('persistent-creator template — Overview surface', () => {
    test('fires at minimum threshold (3 of 4)', () => {
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      // Overview-specific verdict copy.
      expect(result.verdict).toContain('keeps showing up');
      expect(result.verdict).toContain('YouTube history');
    });

    test('fires at design-canonical depth (5 of 6) with verbatim copy', () => {
      const dates = [
        '2026-05-15T12:00:00Z',
        '2026-05-14T12:00:00Z',
        '2026-05-13T12:00:00Z',
        '2026-05-12T12:00:00Z',
        '2026-05-11T12:00:00Z',
        '2026-05-10T12:00:00Z',
      ];
      const scans = dates.map((createdAt, idx) =>
        idx < 5
          ? makeScanWithCreator(`s${idx}`, createdAt, '@foo', 'Foo')
          : makeScanWithCreator(`s${idx}`, createdAt, '@other', 'Other'),
      );
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      // Overview frame: "been in N of your recent M scans"
      expect(observed?.text).toContain('5 of your recent 6 scans');
    });

    test('does not fire below scanCount threshold (2 of 4 → calm-case)', () => {
      const scans = buildFourScanWindowWithRecurringFoo(2);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.verdict).not.toContain('keeps showing up');
    });

    test('does not fire on shallow window (3 of 3 → calm-case)', () => {
      const scans = [
        makeScanWithCreator('s0', '2026-05-12T12:00:00Z', '@foo', 'Foo'),
        makeScanWithCreator('s1', '2026-05-11T12:00:00Z', '@foo', 'Foo'),
        makeScanWithCreator('s2', '2026-05-10T12:00:00Z', '@foo', 'Foo'),
      ];
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.verdict).not.toContain('keeps showing up');
    });

    test('political_shift (priority 70) wins over persistent_creator (60) when both could match', () => {
      // 4 scans with @foo in 3 of them, AND political content
      // climbing: active scan at 11%, priors averaging ~3.5%.
      const scans = [
        makeScanWithCreatorAndPolitical(
          'active',
          '2026-05-13T12:00:00Z',
          '@foo',
          'Foo',
          11,
        ),
        makeScanWithCreatorAndPolitical(
          'p1',
          '2026-05-12T12:00:00Z',
          '@foo',
          'Foo',
          3,
        ),
        makeScanWithCreatorAndPolitical(
          'p2',
          '2026-05-11T12:00:00Z',
          '@foo',
          'Foo',
          4,
        ),
        makeScanWithCreatorAndPolitical(
          'p3',
          '2026-05-10T12:00:00Z',
          '@other',
          'Other',
          4,
        ),
      ];
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData({
          politicalAnalysis: {
            politicalPct: 11,
            politicalCount: 5,
          } as unknown as DashboardData['politicalAnalysis'],
        }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.verdict).toContain('climbing');
      expect(result.verdict).not.toContain('keeps showing up');
    });

    test('persistent_creator (60) wins over concentrated_feed (50) when both could match', () => {
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 20 },
          ] as unknown as DashboardData['topCreators'],
        }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.verdict).toContain('keeps showing up');
      expect(result.verdict).not.toContain('doing most of the talking');
    });

    test('persistent_creator wins over heavy_ad_load on priority-60 tie', () => {
      // Both predicates true: persistent creator + ad spike.
      // Priority 60 ties; persistent-creator is registered first
      // in DASHBOARD_OVERVIEW_TEMPLATES so it wins.
      const scans = [
        makeScanWithCreator(
          'active',
          '2026-05-13T12:00:00Z',
          '@foo',
          'Foo',
          1,
          { ad_percentage: 20 },
        ),
        makeScanWithCreator(
          'p1',
          '2026-05-12T12:00:00Z',
          '@foo',
          'Foo',
          1,
          { ad_percentage: 8 },
        ),
        makeScanWithCreator(
          'p2',
          '2026-05-11T12:00:00Z',
          '@foo',
          'Foo',
          1,
          { ad_percentage: 8 },
        ),
        makeScanWithCreator(
          'p3',
          '2026-05-10T12:00:00Z',
          '@other',
          'Other',
          1,
          { ad_percentage: 8 },
        ),
      ];
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData({ adPct: 20 }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.verdict).toContain('keeps showing up');
      expect(result.verdict).not.toContain('ad-heavy');
    });

    test('OBSERVED interpolates displayName, scanCount, windowScanCount, totalPosts', () => {
      const scans = [
        makeScanWithCreator('s0', '2026-05-13T12:00:00Z', '@mkbhd', 'MKBHD', 2),
        makeScanWithCreator('s1', '2026-05-12T12:00:00Z', '@mkbhd', 'MKBHD', 2),
        makeScanWithCreator('s2', '2026-05-11T12:00:00Z', '@mkbhd', 'MKBHD', 2),
        makeScanWithCreator('s3', '2026-05-10T12:00:00Z', '@other', 'Other'),
      ];
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('MKBHD');
      expect(observed?.text).toContain('3 of your recent 4 scans');
      expect(observed?.text).toContain('6 posts');
    });

    test('supporting rows include Top voice as the first row', () => {
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.supportingRows[0]).toMatchObject({
        variant: 'fact',
        label: 'Top voice',
      });
    });

    test('findingDot is true', () => {
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.overview');
      expect(result.findingDot).toBe(true);
    });
  });

  // ============================================
  // Dashboard Sources surface (Phase 6.1.3)
  // ============================================

  describe('dashboard.sources surface', () => {
    test('persistent_creator template fires at threshold with Sources-specific copy', () => {
      // 4-scan window with @foo as recurring creator in 3 of them.
      // Reuses the buildFourScanWindowWithRecurringFoo helper from
      // the persistent-creator describe blocks above.
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.sources');
      // Sources verdict is distinct from Results ("steady presence")
      // and Overview ("keeps showing up") — uses the design-canonical
      // "quietly become your most-seen voice" framing.
      expect(result.verdict).toContain('quietly become your most-seen voice');
      expect(result.verdict).toContain('YouTube');
      expect(result.verdict).not.toContain('steady presence');
      expect(result.verdict).not.toContain('keeps showing up');
      expect(result.findingDot).toBe(true);
    });

    test('concentrated_feed fires on Sources with source-cardinality framing', () => {
      // 14 of 50 = 28%, above 25% threshold.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 14 },
            { name: 'bob', count: 5 },
            { name: 'carol', count: 3 },
          ] as unknown as DashboardData['topCreators'],
          uniqueCreatorCount: 18,
        }),
      });
      const result = interpretScan(ctx, 'dashboard.sources');
      expect(result.verdict).toContain('built from a narrow set of sources');
      // Sources OBSERVED includes the unique-creator count detail —
      // Results/Overview concentrated verdicts don't.
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('18 unique creators');
      expect(result.findingDot).toBe(true);
    });

    test('persistent_creator wins over concentrated_feed when both could match', () => {
      // 4-scan window with @foo recurring (triggers persistent-creator)
      // AND high single-scan top-creator share (would trigger concentrated).
      const scans = buildFourScanWindowWithRecurringFoo(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData({
          totalPosts: 50,
          topCreators: [
            { name: 'alice', count: 20 },
          ] as unknown as DashboardData['topCreators'],
        }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.sources');
      // Persistent-creator (60) beats concentrated-feed (50).
      expect(result.verdict).toContain('quietly become your most-seen voice');
      expect(result.verdict).not.toContain('narrow set of sources');
    });

    test('calm-case fallback fires when no dramatic template matches', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 30,
          adPct: 5,
          suggestedPct: 50, // below high-suggested threshold
          followedPct: 50,
          topCreators: [
            { name: 'alice', count: 5 },
          ] as unknown as DashboardData['topCreators'],
          uniqueCreatorCount: 4, // below source-spread min (8)
        }),
      });
      const result = interpretScan(ctx, 'dashboard.sources');
      // Fallback variant: "[N] unique creators contributed..."
      expect(result.verdict).toContain('4 unique creators contributed');
      expect(result.findingDot).toBe(false);
    });

    test('calm-case high-suggested variant fires at suggestedPct >= 80', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 37,
          suggestedPct: 100,
          followedPct: 0,
          topCreators: [],
          uniqueCreatorCount: 12,
        }),
      });
      const result = interpretScan(ctx, 'dashboard.sources');
      // Sources-specific framing: "sources in your feed were almost all suggestions"
      expect(result.verdict).toContain(
        'sources in your YouTube feed were almost all suggestions',
      );
      expect(result.findingDot).toBe(false);
    });

    test('calm-case source-spread variant fires when top share < 15% and unique creators >= 8', () => {
      // Sources-unique calm-case variant: broad mix detection.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 50,
          suggestedPct: 50,
          followedPct: 50,
          topCreators: [
            { name: 'alice', count: 5 }, // 5/50 = 10%, below 15% threshold
          ] as unknown as DashboardData['topCreators'],
          uniqueCreatorCount: 23,
        }),
      });
      const result = interpretScan(ctx, 'dashboard.sources');
      expect(result.verdict).toContain('spread broadly today');
      expect(result.verdict).toContain('no single creator dominated');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('23 unique creators');
    });

    test('meta.surface is "dashboard.sources"', () => {
      const ctx = makeContext();
      const result = interpretScan(ctx, 'dashboard.sources');
      expect(result.meta?.surface).toBe('dashboard.sources');
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
