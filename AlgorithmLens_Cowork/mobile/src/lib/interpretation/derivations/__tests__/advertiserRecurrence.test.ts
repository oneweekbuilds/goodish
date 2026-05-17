/**
 * Unit tests for computeAdvertiserRecurrence (Phase 5.4.2).
 *
 * The derivation is a thin wrapper over the shared
 * `aggregateAcrossScans` core with an `is_ad === true` post predicate.
 * These tests focus on the wrapper's distinguishing behavior — the
 * ad-only filter — and cover the same edge cases as creator-recurrence
 * to confirm the shared core works correctly through the wrapper.
 */

import type { ScanDetail } from '../../../../hooks/useDashboard';
import { computeAdvertiserRecurrence } from '../advertiserRecurrence';

// ============================================
// Fixture helpers
// ============================================

interface PostSpec {
  handle: string | null;
  displayName?: string | null;
  isAd?: boolean;
}

function post(spec: PostSpec): unknown {
  return {
    creator_handle: spec.handle,
    creator_display_name: spec.displayName ?? null,
    is_ad: spec.isAd ?? false,
    is_suggested: spec.isAd ? true : null,
    content_type: 'video',
    hashtags: [],
    position_in_feed: 1,
    ad_label_text: spec.isAd ? 'Ad' : null,
  };
}

function makeScan(
  id: string,
  createdAt: string,
  posts: PostSpec[],
  overrides: Partial<ScanDetail> = {},
): ScanDetail {
  return {
    id,
    created_at: createdAt,
    platform: 'youtube',
    post_count: posts.length,
    ad_count: posts.filter((p) => p.isAd === true).length,
    ad_percentage: 0,
    suggested_count: 0,
    suggested_percentage: 0,
    raw_data: {
      posts: posts.map((p) => post(p)),
    },
    user_id: 'user-test',
    ...overrides,
  };
}

/** Shorthand: an ad post for `handle` (with optional display name). */
function ad(handle: string, displayName: string | null = null): PostSpec {
  return { handle, displayName, isAd: true };
}

/** Shorthand: a non-ad post for `handle`. */
function nonAd(handle: string): PostSpec {
  return { handle, isAd: false };
}

describe('computeAdvertiserRecurrence', () => {
  describe('empty inputs', () => {
    test('returns empty result for empty scans array', () => {
      const result = computeAdvertiserRecurrence([], 'youtube');
      expect(result.records).toEqual([]);
      expect(result.windowScanCount).toBe(0);
    });

    test('returns empty records but real windowScanCount when no ads in window', () => {
      // Multiple scans, posts present, but none are ads.
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [nonAd('@foo'), nonAd('@bar')]),
        makeScan('s1', '2026-05-09T12:00:00Z', [nonAd('@baz')]),
      ];
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.records).toEqual([]);
      expect(result.windowScanCount).toBe(2);
    });
  });

  describe('aggregation', () => {
    test('single advertiser across N of M scans', () => {
      const scans = Array.from({ length: 5 }).map((_, i) =>
        makeScan(`s${i}`, `2026-05-${(10 - i).toString().padStart(2, '0')}T12:00:00Z`, [
          ad('@advertiser-1', 'Advertiser One'),
        ]),
      );
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(5);
      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        handle: '@advertiser-1',
        displayName: 'Advertiser One',
        scanCount: 5,
        totalPosts: 5,
        firstSeenIndex: 4,
      });
    });

    test('multi-advertiser mixed recurrence sorted by scanCount desc then totalPosts desc', () => {
      // Ad-A: in 3 scans, 4 posts total
      // Ad-B: in 3 scans, 3 posts total
      // Ad-C: in 2 scans, 5 posts total
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          ad('@ad-A'),
          ad('@ad-A'),
          ad('@ad-B'),
          ad('@ad-C'),
          ad('@ad-C'),
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          ad('@ad-A'),
          ad('@ad-B'),
          ad('@ad-C'),
          ad('@ad-C'),
          ad('@ad-C'),
        ]),
        makeScan('s2', '2026-05-08T12:00:00Z', [ad('@ad-A'), ad('@ad-B')]),
      ];
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.records.map((r) => r.handle)).toEqual([
        '@ad-a',
        '@ad-b',
        '@ad-c',
      ]);
      expect(result.records[0]).toMatchObject({ scanCount: 3, totalPosts: 4 });
      expect(result.records[1]).toMatchObject({ scanCount: 3, totalPosts: 3 });
      expect(result.records[2]).toMatchObject({ scanCount: 2, totalPosts: 5 });
    });
  });

  describe('ad-only filter', () => {
    test('non-ad posts are excluded from aggregation', () => {
      // @foo appears as an ad in 1 scan and a non-ad in 2 scans.
      // The non-ad appearances should NOT count toward @foo's record.
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [ad('@foo', 'Foo')]),
        makeScan('s1', '2026-05-09T12:00:00Z', [nonAd('@foo')]),
        makeScan('s2', '2026-05-08T12:00:00Z', [nonAd('@foo')]),
      ];
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(3);
      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        handle: '@foo',
        scanCount: 1,
        totalPosts: 1,
      });
    });

    test('mixed ad and non-ad posts in same scan: only ads counted', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          ad('@ad-source'),
          nonAd('@creator-1'),
          nonAd('@creator-2'),
          ad('@ad-source'),
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          nonAd('@creator-1'),
          ad('@ad-source'),
        ]),
      ];
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        handle: '@ad-source',
        scanCount: 2,
        totalPosts: 3,
      });
    });

    test('is_ad true with null creator_handle and null display_name excluded', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          { handle: null, displayName: null, isAd: true },
          ad('@advertiser-1'),
        ]),
      ];
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.records).toHaveLength(1);
      expect(result.records[0]!.handle).toBe('@advertiser-1');
    });
  });

  describe('filters', () => {
    test('platform filter excludes cross-platform scans (case-insensitive)', () => {
      const scans = [
        makeScan('s-yt', '2026-05-10T12:00:00Z', [ad('@advertiser-1')], {
          platform: 'YouTube',
        }),
        makeScan('s-ig', '2026-05-09T12:00:00Z', [ad('@advertiser-1')], {
          platform: 'instagram',
        }),
      ];
      const result = computeAdvertiserRecurrence(scans, 'YOUTUBE');
      expect(result.windowScanCount).toBe(1);
      expect(result.records[0]!.scanCount).toBe(1);
    });

    test('excludeScanId removes the active scan from the window', () => {
      const scans = [
        makeScan('active', '2026-05-10T12:00:00Z', [ad('@foo')]),
        makeScan('prior-1', '2026-05-09T12:00:00Z', [ad('@foo')]),
        makeScan('prior-2', '2026-05-08T12:00:00Z', [ad('@foo')]),
      ];
      const result = computeAdvertiserRecurrence(scans, 'youtube', {
        excludeScanId: 'active',
      });
      expect(result.windowScanCount).toBe(2);
      expect(result.records[0]!.scanCount).toBe(2);
    });
  });

  describe('window size', () => {
    test('defaults to 6 most-recent scans when more are passed', () => {
      const scans = Array.from({ length: 8 }).map((_, i) =>
        makeScan(`s${i}`, `2026-05-${(20 - i).toString().padStart(2, '0')}T12:00:00Z`, [
          ad('@foo'),
        ]),
      );
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(6);
      expect(result.records[0]!.scanCount).toBe(6);
    });

    test('honors custom windowSize option', () => {
      const scans = Array.from({ length: 8 }).map((_, i) =>
        makeScan(`s${i}`, `2026-05-${(20 - i).toString().padStart(2, '0')}T12:00:00Z`, [
          ad('@foo'),
        ]),
      );
      const result = computeAdvertiserRecurrence(scans, 'youtube', {
        windowSize: 3,
      });
      expect(result.windowScanCount).toBe(3);
      expect(result.records[0]!.scanCount).toBe(3);
    });
  });

  describe('sparse history', () => {
    test('2 scans both featuring same advertiser returns sensible 2-of-2 record', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [ad('@foo')]),
        makeScan('s1', '2026-05-09T12:00:00Z', [ad('@foo')]),
      ];
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(2);
      expect(result.records[0]).toMatchObject({
        handle: '@foo',
        scanCount: 2,
        totalPosts: 2,
        firstSeenIndex: 1,
      });
    });
  });

  describe('case-insensitive grouping', () => {
    test('"@TechRetailer" and "@techretailer" collapse to one advertiser', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          ad('@TechRetailer', 'Tech Retailer'),
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          ad('@techretailer', 'Tech Retailer Updated'),
        ]),
      ];
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.records).toHaveLength(1);
      expect(result.records[0]!.scanCount).toBe(2);
      expect(result.records[0]!.handle).toBe('@techretailer');
      // displayName from the most-recent scan (newest-first walk).
      expect(result.records[0]!.displayName).toBe('Tech Retailer');
    });
  });

  describe('display-name resolution', () => {
    test('falls back to handle when display_name is null', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [ad('@foo', null)]),
      ];
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.records[0]!.displayName).toBe('@foo');
    });
  });

  describe('failure tolerance', () => {
    test('malformed scan in middle of window does not crash', () => {
      const scans: ScanDetail[] = [
        makeScan('s0', '2026-05-10T12:00:00Z', [ad('@foo')]),
        makeScan('s1', '2026-05-09T12:00:00Z', [], {
          raw_data: { posts: 'not an array' } as unknown as Record<
            string,
            unknown
          >,
        }),
        makeScan('s2', '2026-05-08T12:00:00Z', [ad('@foo')]),
      ];
      expect(() =>
        computeAdvertiserRecurrence(scans, 'youtube'),
      ).not.toThrow();
      const result = computeAdvertiserRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(3);
      expect(result.records[0]!.scanCount).toBe(2);
    });
  });
});
