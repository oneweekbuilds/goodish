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

    test('does not throw on dashboard.ads surface (Phase 6.2.3)', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.ads')).not.toThrow();
    });

    test('does not throw on dashboard.tone surface (Phase 6.3.3)', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.tone')).not.toThrow();
    });

    test('does not throw on dashboard.politics surface (Phase 6.4.3)', () => {
      const ctx = makeContext();
      expect(() => interpretScan(ctx, 'dashboard.politics')).not.toThrow();
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

  /**
   * Sibling of makeScanWithCreator that produces ad posts. Same
   * shape but `is_ad: true` so advertiser-recurrence can aggregate.
   */
  function makeScanWithAdvertiser(
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
          is_ad: true,
          is_suggested: true,
          content_type: 'video',
          hashtags: [],
          position_in_feed: idx + 1,
          ad_label_text: 'Ad',
        })),
      },
      ...overrides,
    });
  }

  /**
   * Make a ScanDetail with raw_data.analysis.feed_items populated
   * with the given valence sequence. Each entry produces one feed
   * item with the specified emotions.valence. The rolling-average
   * tone_negative_pct extractor reads from this structure, so this
   * helper produces history for negative-tone-shift tests.
   */
  function makeScanWithToneValences(
    id: string,
    createdAt: string,
    valences: Array<'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>,
    overrides: Partial<ScanDetail> = {},
  ): ScanDetail {
    return makeScan({
      id,
      created_at: createdAt,
      raw_data: {
        analysis: {
          feed_items: valences.map((valence) => ({
            political: { is_political: false },
            emotions: { valence },
          })),
        },
      },
      ...overrides,
    });
  }

  /**
   * Build a 4-scan window with @ad-1 as a recurring advertiser in
   * `scanCount` of them. Older scans (beyond scanCount) include a
   * different unique advertiser so they don't contribute to @ad-1's
   * recurrence count.
   */
  function buildFourScanWindowWithRecurringAdvertiser(
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
        return makeScanWithAdvertiser(
          `s${idx}`,
          createdAt,
          '@ad-1',
          'Ad One',
          1,
        );
      }
      return makeScanWithAdvertiser(
        `s${idx}`,
        createdAt,
        `@ad-other-${idx}`,
        `Other Ad ${idx}`,
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

  // ============================================
  // Dashboard Ads surface (Phase 6.2.3)
  // ============================================

  describe('dashboard.ads surface', () => {
    test('advertiser_persistence fires at threshold with design-canonical verdict', () => {
      const scans = buildFourScanWindowWithRecurringAdvertiser(3);
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData(),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.ads');
      // Design-canonical verbatim verdict copy.
      expect(result.verdict).toBe(
        'One advertiser is sitting on your feed more than the others.',
      );
      expect(result.findingDot).toBe(true);
      // OBSERVED includes the share-of-identified-ads metric.
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('Ad One');
      expect(observed?.text).toContain('3 of your last 4 scans');
      expect(observed?.text).toContain('% of all identified ads');
    });

    test('heavy_ad_load fires with Ads-surface verbal distinction (not Overview copy)', () => {
      // adPct=20, rollingAvg ~8 → ratio 2.5, well above 1.5× threshold.
      const activeScan = makeScan({ id: 'active', ad_percentage: 20 });
      const priorScans = [
        makeScan({ id: 'p1', ad_percentage: 8 }),
        makeScan({ id: 'p2', ad_percentage: 8 }),
        makeScan({ id: 'p3', ad_percentage: 8 }),
      ];
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan, ...priorScans],
        dashboardData: makeDashboardData({ adPct: 20 }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.ads');
      // Ads-surface framing: ad-density experience, NOT day-state anomaly.
      expect(result.verdict).toContain('Ad density is running high');
      expect(result.verdict).toContain('YouTube');
      // Verbally distinct from Overview's "Unusually ad-heavy YouTube today."
      expect(result.verdict).not.toContain('Unusually ad-heavy');
      expect(result.findingDot).toBe(true);
    });

    test('advertiser_persistence wins over heavy_ad_load when both could match (60 > 50)', () => {
      // Recurring advertiser AND high ad density.
      const scans = [
        makeScanWithAdvertiser('active', '2026-05-13T12:00:00Z', '@ad-1', 'Ad One', 1, {
          ad_percentage: 20,
        }),
        makeScanWithAdvertiser('p1', '2026-05-12T12:00:00Z', '@ad-1', 'Ad One', 1, {
          ad_percentage: 8,
        }),
        makeScanWithAdvertiser('p2', '2026-05-11T12:00:00Z', '@ad-1', 'Ad One', 1, {
          ad_percentage: 8,
        }),
        makeScanWithAdvertiser('p3', '2026-05-10T12:00:00Z', '@ad-other', 'Other', 1, {
          ad_percentage: 8,
        }),
      ];
      const ctx: InterpretationContext = {
        activeScan: scans[0]!,
        scans,
        dashboardData: makeDashboardData({ adPct: 20 }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.ads');
      // Advertiser-persistence (60) beats heavy-ad-load (50).
      expect(result.verdict).toBe(
        'One advertiser is sitting on your feed more than the others.',
      );
      expect(result.verdict).not.toContain('Ad density is running high');
    });

    test('calm-case no-ads variant fires when adCount === 0', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 30,
          adCount: 0,
          adPct: 0,
        }),
      });
      const result = interpretScan(ctx, 'dashboard.ads');
      expect(result.verdict).toContain('No labeled ads');
      expect(result.findingDot).toBe(false);
    });

    test('calm-case low-ad-density variant fires when adPct < 5', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          totalPosts: 33,
          adCount: 1,
          adPct: 3,
        }),
      });
      const result = interpretScan(ctx, 'dashboard.ads');
      expect(result.verdict).toContain('minor presence');
      expect(result.verdict).toContain('YouTube');
    });

    test('calm-case fallback uses "your usual range" when anchor is typical', () => {
      // adPct=10, rollingAvg=11 → ratio 0.9, anchor "typical"
      const activeScan = makeScan({ id: 'active', ad_percentage: 10 });
      const priorScans = [
        makeScan({ id: 'p1', ad_percentage: 11 }),
        makeScan({ id: 'p2', ad_percentage: 11 }),
        makeScan({ id: 'p3', ad_percentage: 11 }),
      ];
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan, ...priorScans],
        dashboardData: makeDashboardData({ adPct: 10, adCount: 5, totalPosts: 50 }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.ads');
      // Design-canonical fallback wording.
      expect(result.verdict).toContain('Ads sat at 10%');
      expect(result.verdict).toContain('your usual range');
    });

    test('calm-case fallback uses "higher than typical" when anchor reflects elevated share (below heavy threshold)', () => {
      // adPct=13, rollingAvg=8 → ratio 1.625. Above 1.3 (so "higher
      // than typical") but below 15% absolute, so heavy-ad-load
      // doesn't fire (requires adPct >= 15).
      const activeScan = makeScan({ id: 'active', ad_percentage: 13 });
      const priorScans = [
        makeScan({ id: 'p1', ad_percentage: 8 }),
        makeScan({ id: 'p2', ad_percentage: 8 }),
        makeScan({ id: 'p3', ad_percentage: 8 }),
      ];
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan, ...priorScans],
        dashboardData: makeDashboardData({ adPct: 13, adCount: 7, totalPosts: 50 }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.ads');
      expect(result.verdict).toContain('Ads sat at 13%');
      expect(result.verdict).toContain('higher than typical');
      expect(result.verdict).not.toContain('your usual range');
    });

    test('calm-case fallback drops the comparative claim when no rolling average exists', () => {
      // Only one scan in history → rollingAverage returns null.
      const activeScan = makeScan({ id: 'active', ad_percentage: 10 });
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan], // window of 1 — no history
        dashboardData: makeDashboardData({ adPct: 10, adCount: 5, totalPosts: 50 }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.ads');
      // Verdict should NOT make a comparative claim when no history.
      expect(result.verdict).toBe(
        'Ads sat at 10% of your feed today.',
      );
      expect(result.verdict).not.toContain('your usual range');
      expect(result.verdict).not.toContain('typical');
    });

    test('meta.surface is "dashboard.ads"', () => {
      const ctx = makeContext();
      const result = interpretScan(ctx, 'dashboard.ads');
      expect(result.meta?.surface).toBe('dashboard.ads');
    });
  });

  // ============================================
  // Dashboard Tone surface (Phase 6.3.3)
  // ============================================

  describe('dashboard.tone surface', () => {
    test('negative_tone_shift fires at threshold with Tone-specific verdict (not Overview copy)', () => {
      // Active scan: 45% negative; prior scans: ~20% negative avg.
      // Ratio 2.25, well above 1.5×.
      const activeScan = makeScan({ id: 'active' });
      const priorScans = [
        makeScanWithToneValences(
          'p1',
          '2026-05-09T12:00:00Z',
          ['NEGATIVE', 'NEGATIVE', 'POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL'],
        ),
        makeScanWithToneValences(
          'p2',
          '2026-05-08T12:00:00Z',
          ['NEGATIVE', 'NEGATIVE', 'POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL'],
        ),
      ];
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan, ...priorScans],
        dashboardData: makeDashboardData({
          toneAnalysis: {
            positivePct: 20,
            neutralPct: 35,
            negativePct: 45,
            knownValenceTotal: 20,
          } as unknown as DashboardData['toneAnalysis'],
        }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.tone');
      expect(result.verdict).toContain('Negative tone has been climbing');
      expect(result.verdict).toContain('YouTube');
      // Surface differentiation: parallel structure to Overview's
      // political_shift, but distinct signal subject.
      expect(result.verdict).not.toContain('Politics has been climbing');
      expect(result.findingDot).toBe(true);
    });

    test('dominant_tone positive sub-variant fires when positivePct >= 50%', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          toneAnalysis: {
            positivePct: 60,
            neutralPct: 25,
            negativePct: 15,
            knownValenceTotal: 20,
          } as unknown as DashboardData['toneAnalysis'],
        }),
      });
      const result = interpretScan(ctx, 'dashboard.tone');
      expect(result.verdict).toContain('leaned positive today');
      expect(result.findingDot).toBe(true);
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('60%');
      expect(observed?.text).toContain('positive');
    });

    test('dominant_tone negative sub-variant fires when negativePct >= 50% (and shift threshold not met)', () => {
      // Active 55% negative, but no rolling-average history → shift
      // can't fire (rollingAvg null). Falls through to dominant_tone.
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          toneAnalysis: {
            positivePct: 25,
            neutralPct: 20,
            negativePct: 55,
            knownValenceTotal: 20,
          } as unknown as DashboardData['toneAnalysis'],
        }),
      });
      const result = interpretScan(ctx, 'dashboard.tone');
      expect(result.verdict).toContain('leaned negative today');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('critical or negative');
    });

    test('dominant_tone neutral sub-variant fires when neutralPct >= 50%', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          toneAnalysis: {
            positivePct: 20,
            neutralPct: 60,
            negativePct: 20,
            knownValenceTotal: 20,
          } as unknown as DashboardData['toneAnalysis'],
        }),
      });
      const result = interpretScan(ctx, 'dashboard.tone');
      expect(result.verdict).toContain('leaned neutral today');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('factual or balanced');
    });

    test('calm-case enrichment-not-available fires when toneAnalysis is null', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          toneAnalysis: null,
        }),
      });
      const result = interpretScan(ctx, 'dashboard.tone');
      expect(result.verdict).toContain("isn’t available");
      // Negative assertion: dominant_tone MUST NOT misfire on
      // missing-data state (the enrichment-gap guard must hold).
      expect(result.verdict).not.toContain('leaned');
      expect(result.findingDot).toBe(false);
    });

    test('calm-case enrichment-not-available also fires when knownValenceTotal === 0', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          toneAnalysis: {
            positivePct: 0,
            neutralPct: 0,
            negativePct: 0,
            knownValenceTotal: 0,
          } as unknown as DashboardData['toneAnalysis'],
        }),
      });
      const result = interpretScan(ctx, 'dashboard.tone');
      expect(result.verdict).toContain("isn’t available");
      expect(result.verdict).not.toContain('leaned');
    });

    test('calm-case balanced-tone fires when no bucket reaches 40%', () => {
      const ctx = makeContext({
        dashboardData: makeDashboardData({
          toneAnalysis: {
            positivePct: 35,
            neutralPct: 35,
            negativePct: 30,
            knownValenceTotal: 20,
          } as unknown as DashboardData['toneAnalysis'],
        }),
      });
      const result = interpretScan(ctx, 'dashboard.tone');
      expect(result.verdict).toContain('balanced emotional mix');
      const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
      expect(observed?.text).toContain('no single tone dominated');
    });

    test('calm-case fallback uses "your usual range" when anchor is typical', () => {
      // Active negative 42%; priors ~40% negative → ratio ~1.05 (typical).
      // Below dominance (50%), above balanced max (40%) → fallback.
      const activeScan = makeScan({ id: 'active' });
      const priorScans = [
        makeScanWithToneValences(
          'p1',
          '2026-05-09T12:00:00Z',
          ['NEGATIVE', 'NEGATIVE', 'NEGATIVE', 'NEGATIVE', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL'],
        ),
        makeScanWithToneValences(
          'p2',
          '2026-05-08T12:00:00Z',
          ['NEGATIVE', 'NEGATIVE', 'NEGATIVE', 'NEGATIVE', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL'],
        ),
      ];
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan, ...priorScans],
        dashboardData: makeDashboardData({
          toneAnalysis: {
            positivePct: 28,
            neutralPct: 30,
            negativePct: 42,
            knownValenceTotal: 20,
          } as unknown as DashboardData['toneAnalysis'],
        }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.tone');
      expect(result.verdict).toContain('Tone sat at 42% negative today');
      expect(result.verdict).toContain('your usual range');
    });

    test('negative_tone_shift wins over dominant_tone when both could match (priority 70 > 50)', () => {
      // Active 55% negative AND ratio above 1.5× rolling average.
      const activeScan = makeScan({ id: 'active' });
      const priorScans = [
        makeScanWithToneValences(
          'p1',
          '2026-05-09T12:00:00Z',
          ['NEGATIVE', 'NEGATIVE', 'POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL'],
        ),
        makeScanWithToneValences(
          'p2',
          '2026-05-08T12:00:00Z',
          ['NEGATIVE', 'NEGATIVE', 'POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL', 'NEUTRAL'],
        ),
      ];
      const ctx: InterpretationContext = {
        activeScan,
        scans: [activeScan, ...priorScans],
        dashboardData: makeDashboardData({
          toneAnalysis: {
            positivePct: 25,
            neutralPct: 20,
            negativePct: 55,
            knownValenceTotal: 20,
          } as unknown as DashboardData['toneAnalysis'],
        }),
        platform: 'youtube',
      };
      const result = interpretScan(ctx, 'dashboard.tone');
      // Shift (70) beats dominant (50).
      expect(result.verdict).toContain('Negative tone has been climbing');
      expect(result.verdict).not.toContain('leaned negative');
    });

    test('meta.surface is "dashboard.tone"', () => {
      const ctx = makeContext();
      const result = interpretScan(ctx, 'dashboard.tone');
      expect(result.meta?.surface).toBe('dashboard.tone');
    });
  });

  // ============================================
  // Dashboard Politics surface (Phase 6.4.3)
  // ============================================

  describe('dashboard.politics surface', () => {
    /**
     * Build a ScanDetail with raw_data.analysis.feed_items populated
     * from a list of political-creator items. The political-creator
     * recurrence wrapper reads from analysis.feed_items (not
     * raw_data.posts), so this is the right injection point for
     * dominance tests that need scanCount control. Pass `politicalPct`
     * to lock the rolling-average / trajectory extractor's per-scan
     * value via political_content_summary.
     */
    function makeScanWithPoliticalFeedItems(
      id: string,
      createdAt: string,
      items: Array<{ handle: string; name: string; isPolitical: boolean }>,
      options: { politicalPct?: number } = {},
      overrides: Partial<ScanDetail> = {},
    ): ScanDetail {
      return makeScan({
        id,
        created_at: createdAt,
        raw_data: {
          analysis: {
            ai_analyzed: true,
            ...(options.politicalPct !== undefined && {
              political_content_summary: {
                political_percentage: options.politicalPct,
              },
            }),
            feed_items: items.map((it) => ({
              creator: { handle: it.handle, name: it.name },
              political: { is_political: it.isPolitical },
            })),
          },
        },
        ...overrides,
      });
    }

    /**
     * Default dashboardData fixture for dominance tests. Sets
     * topPoliticalSource at 73% (design-canonical share) with a
     * politicalCount/totalAnalyzed pair that clears the >=5 floor
     * AND the data-layer's hidden >=10 constraint on
     * topPoliticalSource emission.
     */
    function makeDominanceDashboardData(
      handle: string,
      pctOfPolitical: number = 73,
      politicalCount: number = 11,
    ): DashboardData {
      return makeDashboardData({
        politicalAnalysis: {
          politicalPct: 11,
          politicalCount,
          totalAnalyzed: 100,
          ideology: null,
          topPoliticalSource: {
            handle,
            count: Math.round((pctOfPolitical / 100) * politicalCount),
            pctOfPolitical,
          },
          lowSample: false,
        } as unknown as DashboardData['politicalAnalysis'],
      });
    }

    describe('political_creator_dominance template', () => {
      test('fires at threshold with design-canonical verdict', () => {
        // Active scan plus one prior scan both contain a political post
        // from @newschan → political-creator-recurrence scanCount = 2.
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [{ handle: '@newschan', name: 'News Channel', isPolitical: true }],
        );
        const priorScans = [
          makeScanWithPoliticalFeedItems('p1', '2026-05-12T12:00:00Z', [
            { handle: '@newschan', name: 'News Channel', isPolitical: true },
          ]),
          makeScanWithPoliticalFeedItems('p2', '2026-05-11T12:00:00Z', [
            { handle: '@other', name: 'Other', isPolitical: true },
          ]),
        ];
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan, ...priorScans],
          dashboardData: makeDominanceDashboardData('@newschan'),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).toContain("isn’t varied");
        expect(result.verdict).toContain('coming from one place');
        expect(result.findingDot).toBe(true);
        const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
        expect(observed?.text).toContain('11%');
        expect(observed?.text).toContain('73%');
        expect(observed?.text).toContain('News Channel');
        expect(observed?.text).toContain('your last two scans');
        const likely = result.sublines.find((s) => s.mode === 'LIKELY');
        expect(likely?.text).toContain('narrowed in on');
      });

      test('does NOT fire when politicalCount === 4 (below 5-post floor)', () => {
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [{ handle: '@newschan', name: 'News Channel', isPolitical: true }],
        );
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan],
          dashboardData: makeDominanceDashboardData('@newschan', 73, 4),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).not.toContain("isn’t varied");
      });

      test('does NOT fire when topPoliticalSource.pctOfPolitical === 49 (just below 50%)', () => {
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [{ handle: '@newschan', name: 'News Channel', isPolitical: true }],
        );
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan],
          dashboardData: makeDominanceDashboardData('@newschan', 49, 11),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).not.toContain("isn’t varied");
      });

      test('does NOT fire when matching recurrence scanCount === 4 (just above ceiling)', () => {
        // @newschan appears in 4 of 4 scans → scanCount = 4, above the
        // recency ceiling of 3. Dominance must fall through.
        const dates = [
          '2026-05-13T12:00:00Z',
          '2026-05-12T12:00:00Z',
          '2026-05-11T12:00:00Z',
          '2026-05-10T12:00:00Z',
        ];
        const scans = dates.map((createdAt, idx) =>
          makeScanWithPoliticalFeedItems(`s${idx}`, createdAt, [
            { handle: '@newschan', name: 'News Channel', isPolitical: true },
          ]),
        );
        const ctx: InterpretationContext = {
          activeScan: scans[0]!,
          scans,
          dashboardData: makeDominanceDashboardData('@newschan'),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).not.toContain("isn’t varied");
      });

      test('OBSERVED recency phrase: scanCount=1 → "this scan only"', () => {
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [{ handle: '@newschan', name: 'News Channel', isPolitical: true }],
        );
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan],
          dashboardData: makeDominanceDashboardData('@newschan'),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
        expect(observed?.text).toContain('this scan only');
      });

      test('OBSERVED recency phrase: scanCount=2 → "your last two scans"', () => {
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [{ handle: '@newschan', name: 'News Channel', isPolitical: true }],
        );
        const priorScans = [
          makeScanWithPoliticalFeedItems('p1', '2026-05-12T12:00:00Z', [
            { handle: '@newschan', name: 'News Channel', isPolitical: true },
          ]),
        ];
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan, ...priorScans],
          dashboardData: makeDominanceDashboardData('@newschan'),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
        expect(observed?.text).toContain('your last two scans');
      });

      test('OBSERVED recency phrase: scanCount=3 → "your last three scans"', () => {
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [{ handle: '@newschan', name: 'News Channel', isPolitical: true }],
        );
        const priorScans = [
          makeScanWithPoliticalFeedItems('p1', '2026-05-12T12:00:00Z', [
            { handle: '@newschan', name: 'News Channel', isPolitical: true },
          ]),
          makeScanWithPoliticalFeedItems('p2', '2026-05-11T12:00:00Z', [
            { handle: '@newschan', name: 'News Channel', isPolitical: true },
          ]),
        ];
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan, ...priorScans],
          dashboardData: makeDominanceDashboardData('@newschan'),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
        expect(observed?.text).toContain('your last three scans');
      });
    });

    describe('political_trajectory template', () => {
      test('fires on monotonic upward 4→7→11 with politicalPct >= 8', () => {
        // No dominant single source → dominance template falls through.
        // Topical-creator distribution is spread so dominance can't fire.
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [],
          { politicalPct: 11 },
        );
        const priorScans = [
          makeScanWithPoliticalFeedItems(
            'p1',
            '2026-05-12T12:00:00Z',
            [],
            { politicalPct: 7 },
          ),
          makeScanWithPoliticalFeedItems(
            'p2',
            '2026-05-11T12:00:00Z',
            [],
            { politicalPct: 4 },
          ),
        ];
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan, ...priorScans],
          dashboardData: makeDashboardData({
            politicalAnalysis: {
              politicalPct: 11,
              politicalCount: 11,
              totalAnalyzed: 100,
              ideology: null,
              topPoliticalSource: null,
              lowSample: false,
            } as unknown as DashboardData['politicalAnalysis'],
          }),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).toContain('growing share');
        expect(result.verdict).toContain('YouTube');
        const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
        expect(observed?.text).toContain('4%');
        expect(observed?.text).toContain('7%');
        expect(observed?.text).toContain('11%');
        expect(result.findingDot).toBe(true);
      });

      test('does NOT fire when first-to-last delta < 3 (5→6→7, delta=2)', () => {
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [],
          { politicalPct: 7 },
        );
        const priorScans = [
          makeScanWithPoliticalFeedItems(
            'p1',
            '2026-05-12T12:00:00Z',
            [],
            { politicalPct: 6 },
          ),
          makeScanWithPoliticalFeedItems(
            'p2',
            '2026-05-11T12:00:00Z',
            [],
            { politicalPct: 5 },
          ),
        ];
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan, ...priorScans],
          dashboardData: makeDashboardData({
            politicalAnalysis: {
              politicalPct: 7,
              politicalCount: 7,
              totalAnalyzed: 100,
              ideology: null,
              topPoliticalSource: null,
              lowSample: false,
            } as unknown as DashboardData['politicalAnalysis'],
          }),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).not.toContain('growing share');
      });

      test('does NOT fire when trajectory non-monotonic (4→11→7)', () => {
        // Chronological: 4, 11, 7. Monotonic check fails on the 11→7 drop.
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [],
          { politicalPct: 7 },
        );
        const priorScans = [
          makeScanWithPoliticalFeedItems(
            'p1',
            '2026-05-12T12:00:00Z',
            [],
            { politicalPct: 11 },
          ),
          makeScanWithPoliticalFeedItems(
            'p2',
            '2026-05-11T12:00:00Z',
            [],
            { politicalPct: 4 },
          ),
        ];
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan, ...priorScans],
          dashboardData: makeDashboardData({
            politicalAnalysis: {
              politicalPct: 7,
              politicalCount: 7,
              totalAnalyzed: 100,
              ideology: null,
              topPoliticalSource: null,
              lowSample: false,
            } as unknown as DashboardData['politicalAnalysis'],
          }),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).not.toContain('growing share');
      });

      test('verdict is verbally distinct from Overview political_shift', () => {
        // Same trajectory data fires the Tab 4 trajectory template
        // with "growing share" framing — must NOT use Overview's
        // "climbing" framing.
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [],
          { politicalPct: 11 },
        );
        const priorScans = [
          makeScanWithPoliticalFeedItems(
            'p1',
            '2026-05-12T12:00:00Z',
            [],
            { politicalPct: 7 },
          ),
          makeScanWithPoliticalFeedItems(
            'p2',
            '2026-05-11T12:00:00Z',
            [],
            { politicalPct: 4 },
          ),
        ];
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan, ...priorScans],
          dashboardData: makeDashboardData({
            politicalAnalysis: {
              politicalPct: 11,
              politicalCount: 11,
              totalAnalyzed: 100,
              ideology: null,
              topPoliticalSource: null,
              lowSample: false,
            } as unknown as DashboardData['politicalAnalysis'],
          }),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).toContain('growing share');
        // Negative assertion: surface-differentiation discipline.
        expect(result.verdict).not.toContain('Politics has been climbing');
      });
    });

    describe('priority and dispatch', () => {
      test('political_creator_dominance wins over political_trajectory (70 > 60)', () => {
        // Both predicates true: trajectory 4→7→11 AND dominant single
        // source @newschan with scanCount=2.
        const activeScan = makeScanWithPoliticalFeedItems(
          'active',
          '2026-05-13T12:00:00Z',
          [{ handle: '@newschan', name: 'News Channel', isPolitical: true }],
          { politicalPct: 11 },
        );
        const priorScans = [
          makeScanWithPoliticalFeedItems(
            'p1',
            '2026-05-12T12:00:00Z',
            [{ handle: '@newschan', name: 'News Channel', isPolitical: true }],
            { politicalPct: 7 },
          ),
          makeScanWithPoliticalFeedItems(
            'p2',
            '2026-05-11T12:00:00Z',
            [{ handle: '@other', name: 'Other', isPolitical: true }],
            { politicalPct: 4 },
          ),
        ];
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan, ...priorScans],
          dashboardData: makeDominanceDashboardData('@newschan'),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        // Dominance (70) beats trajectory (60).
        expect(result.verdict).toContain("isn’t varied");
        expect(result.verdict).not.toContain('growing share');
      });
    });

    describe('calm-case template', () => {
      test('enrichment-not-available fires when politicalAnalysis === null, with negative assertions on dramatic copy', () => {
        const ctx = makeContext({
          dashboardData: makeDashboardData({
            politicalAnalysis: null,
          }),
        });
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).toContain("isn’t available");
        // Enrichment-gap guard: dominance/trajectory MUST NOT misfire.
        expect(result.verdict).not.toContain("isn’t varied");
        expect(result.verdict).not.toContain('growing share');
        expect(result.findingDot).toBe(false);
      });

      test('no-political-content fires when politicalCount === 0', () => {
        const ctx = makeContext({
          dashboardData: makeDashboardData({
            politicalAnalysis: {
              politicalPct: 0,
              politicalCount: 0,
              totalAnalyzed: 50,
              ideology: null,
              topPoliticalSource: null,
              lowSample: false,
            } as unknown as DashboardData['politicalAnalysis'],
          }),
        });
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).toContain("didn’t include political content");
        const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
        expect(observed?.text).toContain('50 posts analyzed');
        expect(result.findingDot).toBe(false);
      });

      test('low-political-share fires when 0 < politicalPct < 5', () => {
        const ctx = makeContext({
          dashboardData: makeDashboardData({
            politicalAnalysis: {
              politicalPct: 3,
              politicalCount: 3,
              totalAnalyzed: 100,
              ideology: null,
              topPoliticalSource: null,
              lowSample: false,
            } as unknown as DashboardData['politicalAnalysis'],
          }),
        });
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).toContain('quiet sliver');
        const observed = result.sublines.find((s) => s.mode === 'OBSERVED');
        expect(observed?.text).toContain('3%');
        expect(result.findingDot).toBe(false);
      });

      test('fallback fires when politicalPct >= 5 but not dominant, not growing', () => {
        // No history (single scan) → trajectory predicate fails on
        // length < 3. politicalPct = 7 puts us in the 5-8 zone with
        // no dominance and no trajectory → fallback.
        const activeScan = makeScan({ id: 'active' });
        const ctx: InterpretationContext = {
          activeScan,
          scans: [activeScan],
          dashboardData: makeDashboardData({
            politicalAnalysis: {
              politicalPct: 7,
              politicalCount: 7,
              totalAnalyzed: 100,
              ideology: null,
              topPoliticalSource: null,
              lowSample: false,
            } as unknown as DashboardData['politicalAnalysis'],
          }),
          platform: 'youtube',
        };
        const result = interpretScan(ctx, 'dashboard.politics');
        expect(result.verdict).toContain('held steady');
        expect(result.verdict).toContain('7%');
        expect(result.findingDot).toBe(false);
      });
    });

    test('meta.surface is "dashboard.politics"', () => {
      const ctx = makeContext();
      const result = interpretScan(ctx, 'dashboard.politics');
      expect(result.meta?.surface).toBe('dashboard.politics');
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
