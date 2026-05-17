/**
 * Unit tests for computeCreatorRecurrence (Phase 5.2.2).
 *
 * Coverage: 14 cases from the Phase 5.2.1 discovery report —
 * empty/malformed input handling, platform filter, excludeScanId,
 * window size, sparse history, null-handle exclusion, case-
 * insensitive grouping, display-name resolution, malformed-scan
 * tolerance, firstSeenIndex correctness, totalPosts correctness.
 */

import type { ScanDetail } from '../../../../hooks/useDashboard';
import { computeCreatorRecurrence } from '../creatorRecurrence';

// ============================================
// Fixture helpers
// ============================================

interface PostSpec {
  handle: string | null;
  displayName?: string | null;
}

function post(handle: string | null, displayName: string | null = null): unknown {
  return {
    creator_handle: handle,
    creator_display_name: displayName,
    is_ad: false,
    is_suggested: null,
    content_type: 'video',
    hashtags: [],
    position_in_feed: 1,
    ad_label_text: null,
  };
}

/**
 * Make a ScanDetail with the given list of posts. The posts are
 * specified as PostSpec entries (handle + optional displayName);
 * defaults for other fields produce a minimal valid post object.
 */
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
    ad_count: 0,
    ad_percentage: 0,
    suggested_count: 0,
    suggested_percentage: 0,
    raw_data: {
      posts: posts.map((p) => post(p.handle, p.displayName ?? null)),
    },
    user_id: 'user-test',
    ...overrides,
  };
}

describe('computeCreatorRecurrence', () => {
  // ============================================
  // Empty / no-creator inputs
  // ============================================

  describe('empty inputs', () => {
    test('returns empty result for empty scans array', () => {
      const result = computeCreatorRecurrence([], 'youtube');
      expect(result.records).toEqual([]);
      expect(result.windowScanCount).toBe(0);
    });

    test('returns empty records but real windowScanCount when all posts have null creators', () => {
      const scans = [
        makeScan('s1', '2026-05-01T12:00:00Z', [
          { handle: null, displayName: null },
          { handle: null, displayName: null },
        ]),
        makeScan('s2', '2026-04-30T12:00:00Z', [
          { handle: null, displayName: null },
        ]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.records).toEqual([]);
      expect(result.windowScanCount).toBe(2);
    });
  });

  // ============================================
  // Basic aggregation
  // ============================================

  describe('aggregation', () => {
    test('single creator across 5 of 5 scans', () => {
      const scans = Array.from({ length: 5 }).map((_, i) =>
        makeScan(`s${i}`, `2026-05-${(10 - i).toString().padStart(2, '0')}T12:00:00Z`, [
          { handle: '@foo', displayName: 'Foo' },
        ]),
      );
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(5);
      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        handle: '@foo',
        displayName: 'Foo',
        scanCount: 5,
        totalPosts: 5,
        firstSeenIndex: 4,
      });
    });

    test('multi-creator mixed recurrence sorted by scanCount desc then totalPosts desc', () => {
      // Foo: in 3 scans, 4 posts total (2 posts in newest)
      // Bar: in 3 scans, 3 posts total
      // Baz: in 2 scans, 5 posts total
      // Expected order: Foo > Bar (tie on scanCount=3, Foo has more posts), then Baz (lower scanCount).
      const scans = [
        // newest
        makeScan('s0', '2026-05-10T12:00:00Z', [
          { handle: '@foo' },
          { handle: '@foo' },
          { handle: '@bar' },
          { handle: '@baz' },
          { handle: '@baz' },
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          { handle: '@foo' },
          { handle: '@bar' },
          { handle: '@baz' },
          { handle: '@baz' },
          { handle: '@baz' },
        ]),
        makeScan('s2', '2026-05-08T12:00:00Z', [
          { handle: '@foo' },
          { handle: '@bar' },
        ]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(3);
      expect(result.records.map((r) => r.handle)).toEqual([
        '@foo',
        '@bar',
        '@baz',
      ]);
      expect(result.records[0]).toMatchObject({ scanCount: 3, totalPosts: 4 });
      expect(result.records[1]).toMatchObject({ scanCount: 3, totalPosts: 3 });
      expect(result.records[2]).toMatchObject({ scanCount: 2, totalPosts: 5 });
    });

    test('totalPosts correctly sums multiple posts per scan', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          { handle: '@foo' },
          { handle: '@foo' },
          { handle: '@foo' },
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          { handle: '@foo' },
          { handle: '@foo' },
        ]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.records[0]!.totalPosts).toBe(5);
      expect(result.records[0]!.scanCount).toBe(2);
    });
  });

  // ============================================
  // Filters
  // ============================================

  describe('filters', () => {
    test('platform filter excludes cross-platform scans (case-insensitive)', () => {
      const scans = [
        makeScan(
          's-yt',
          '2026-05-10T12:00:00Z',
          [{ handle: '@foo' }],
          { platform: 'YouTube' },
        ),
        makeScan(
          's-ig',
          '2026-05-09T12:00:00Z',
          [{ handle: '@foo' }],
          { platform: 'instagram' },
        ),
      ];
      const result = computeCreatorRecurrence(scans, 'YOUTUBE');
      expect(result.windowScanCount).toBe(1);
      expect(result.records[0]!.scanCount).toBe(1);
    });

    test('excludeScanId removes the active scan from the window', () => {
      const scans = [
        makeScan('active', '2026-05-10T12:00:00Z', [{ handle: '@foo' }]),
        makeScan('prior-1', '2026-05-09T12:00:00Z', [{ handle: '@foo' }]),
        makeScan('prior-2', '2026-05-08T12:00:00Z', [{ handle: '@foo' }]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube', {
        excludeScanId: 'active',
      });
      expect(result.windowScanCount).toBe(2);
      expect(result.records[0]!.scanCount).toBe(2);
    });
  });

  // ============================================
  // Window size
  // ============================================

  describe('window size', () => {
    test('defaults to 6 most-recent scans when more are passed', () => {
      // 8 scans, all with @foo. Default window of 6.
      const scans = Array.from({ length: 8 }).map((_, i) =>
        makeScan(`s${i}`, `2026-05-${(20 - i).toString().padStart(2, '0')}T12:00:00Z`, [
          { handle: '@foo' },
        ]),
      );
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(6);
      expect(result.records[0]!.scanCount).toBe(6);
    });

    test('honors custom windowSize option', () => {
      const scans = Array.from({ length: 8 }).map((_, i) =>
        makeScan(`s${i}`, `2026-05-${(20 - i).toString().padStart(2, '0')}T12:00:00Z`, [
          { handle: '@foo' },
        ]),
      );
      const result = computeCreatorRecurrence(scans, 'youtube', {
        windowSize: 3,
      });
      expect(result.windowScanCount).toBe(3);
      expect(result.records[0]!.scanCount).toBe(3);
    });
  });

  // ============================================
  // Sparse history
  // ============================================

  describe('sparse history', () => {
    test('2 scans both featuring same creator returns sensible 2-of-2 record', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [{ handle: '@foo' }]),
        makeScan('s1', '2026-05-09T12:00:00Z', [{ handle: '@foo' }]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(2);
      expect(result.records[0]).toMatchObject({
        handle: '@foo',
        scanCount: 2,
        totalPosts: 2,
        firstSeenIndex: 1,
      });
    });

    test('single scan with one creator returns scanCount 1, windowScanCount 1', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [{ handle: '@foo' }]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(1);
      expect(result.records[0]).toMatchObject({
        scanCount: 1,
        firstSeenIndex: 0,
      });
    });
  });

  // ============================================
  // Null-handle handling
  // ============================================

  describe('null handles', () => {
    test('posts with null handles excluded from counts but scan still in denominator', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          { handle: '@foo' },
          { handle: null, displayName: null },
          { handle: null, displayName: null },
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          { handle: null, displayName: null },
          { handle: null, displayName: null },
        ]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(2);
      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        handle: '@foo',
        scanCount: 1,
        totalPosts: 1,
      });
    });
  });

  // ============================================
  // Case-insensitive grouping
  // ============================================

  describe('case-insensitive grouping', () => {
    test('"@MarquesBrownlee" and "@marquesbrownlee" collapse to one record', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          { handle: '@MarquesBrownlee', displayName: 'Marques Brownlee' },
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          { handle: '@marquesbrownlee', displayName: 'MKBHD' },
        ]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.records).toHaveLength(1);
      expect(result.records[0]!.scanCount).toBe(2);
      expect(result.records[0]!.handle).toBe('@marquesbrownlee');
      // displayName comes from the most recent scan with a non-empty
      // display name — newest-first walk captures s0's "Marques Brownlee".
      expect(result.records[0]!.displayName).toBe('Marques Brownlee');
    });
  });

  // ============================================
  // Display-name resolution
  // ============================================

  describe('display-name resolution', () => {
    test('falls back to handle when display_name is null', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          { handle: '@foo', displayName: null },
        ]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.records[0]!.displayName).toBe('@foo');
    });

    test('uses display_name as canonical key when handle is null', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          { handle: null, displayName: 'Some Creator' },
        ]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.records).toHaveLength(1);
      expect(result.records[0]!.handle).toBe('some creator');
      expect(result.records[0]!.displayName).toBe('Some Creator');
    });
  });

  // ============================================
  // firstSeenIndex
  // ============================================

  describe('firstSeenIndex', () => {
    test('first-seen on oldest scan in 4-scan window yields highest index', () => {
      // @foo appears in oldest scan (index 3) and newest (index 0).
      // firstSeenIndex should be 3 (the highest = earliest in time).
      const scans = [
        makeScan('s0', '2026-05-13T12:00:00Z', [{ handle: '@foo' }]),
        makeScan('s1', '2026-05-12T12:00:00Z', [{ handle: '@bar' }]),
        makeScan('s2', '2026-05-11T12:00:00Z', [{ handle: '@bar' }]),
        makeScan('s3', '2026-05-10T12:00:00Z', [{ handle: '@foo' }]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      const foo = result.records.find((r) => r.handle === '@foo');
      expect(foo).toBeDefined();
      expect(foo!.firstSeenIndex).toBe(3);
      expect(foo!.scanCount).toBe(2);
    });

    test('creator only in newest scan has firstSeenIndex 0 (new this scan)', () => {
      const scans = [
        makeScan('s0', '2026-05-13T12:00:00Z', [{ handle: '@newby' }]),
        makeScan('s1', '2026-05-12T12:00:00Z', [{ handle: '@regular' }]),
        makeScan('s2', '2026-05-11T12:00:00Z', [{ handle: '@regular' }]),
      ];
      const result = computeCreatorRecurrence(scans, 'youtube');
      const newby = result.records.find((r) => r.handle === '@newby');
      expect(newby).toBeDefined();
      expect(newby!.firstSeenIndex).toBe(0);
      expect(newby!.scanCount).toBe(1);
    });
  });

  // ============================================
  // Failure tolerance
  // ============================================

  describe('failure tolerance', () => {
    test('malformed scan in middle of window does not crash; record reflects available data', () => {
      const scans: ScanDetail[] = [
        makeScan('s0', '2026-05-10T12:00:00Z', [{ handle: '@foo' }]),
        // Intentionally malformed: raw_data exists but posts is a string,
        // not an array. The derivation should skip without crashing.
        makeScan('s1', '2026-05-09T12:00:00Z', [], {
          raw_data: { posts: 'not an array' } as unknown as Record<
            string,
            unknown
          >,
        }),
        makeScan('s2', '2026-05-08T12:00:00Z', [{ handle: '@foo' }]),
      ];

      expect(() =>
        computeCreatorRecurrence(scans, 'youtube'),
      ).not.toThrow();

      const result = computeCreatorRecurrence(scans, 'youtube');
      // The malformed scan still counts in windowScanCount (it WAS a
      // valid scan structurally, just with bad posts content). @foo
      // appears in 2 of 3 scans (skipping the malformed middle one).
      expect(result.windowScanCount).toBe(3);
      expect(result.records[0]!.handle).toBe('@foo');
      expect(result.records[0]!.scanCount).toBe(2);
    });

    test('scan with missing raw_data is tolerated', () => {
      const scans: ScanDetail[] = [
        makeScan('s0', '2026-05-10T12:00:00Z', [{ handle: '@foo' }]),
        makeScan('s1', '2026-05-09T12:00:00Z', [], {
          // null raw_data — extractor should bail without crashing.
          raw_data: null as unknown as Record<string, unknown>,
        }),
      ];
      expect(() =>
        computeCreatorRecurrence(scans, 'youtube'),
      ).not.toThrow();
      const result = computeCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(2);
      expect(result.records[0]!.scanCount).toBe(1);
    });
  });
});
