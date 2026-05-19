/**
 * Unit tests for computePoliticalCreatorRecurrence (Phase 6.4.0a).
 *
 * The derivation is a thin wrapper over the shared
 * `aggregateAcrossScans` core with a custom `postsExtractor` that
 * pulls from `raw_data.analysis.feed_items` (where political
 * classification lives) instead of the default `raw_data.posts`.
 *
 * These tests cover the same axes as the advertiser-recurrence
 * suite (Phase 5.4.2) but with political-feed-item fixtures, plus
 * an extra test for the data-shape remap that distinguishes this
 * wrapper from the other two.
 */

import type { ScanDetail } from '../../../../hooks/useDashboard';
import { computePoliticalCreatorRecurrence } from '../politicalCreatorRecurrence';

// ============================================
// Fixture helpers
// ============================================

interface PoliticalItemSpec {
  handle: string | null;
  displayName?: string | null;
  isPolitical?: boolean;
}

function feedItem(spec: PoliticalItemSpec): unknown {
  return {
    creator: {
      handle: spec.handle,
      name: spec.displayName ?? null,
    },
    political: {
      is_political: spec.isPolitical ?? false,
    },
    emotions: { valence: 'NEUTRAL' },
  };
}

function makeScan(
  id: string,
  createdAt: string,
  items: PoliticalItemSpec[],
  overrides: Partial<ScanDetail> = {},
): ScanDetail {
  return {
    id,
    created_at: createdAt,
    platform: 'youtube',
    post_count: items.length,
    ad_count: 0,
    ad_percentage: 0,
    suggested_count: 0,
    suggested_percentage: 0,
    raw_data: {
      analysis: {
        feed_items: items.map((spec) => feedItem(spec)),
      },
    },
    user_id: 'user-test',
    ...overrides,
  };
}

/** Shorthand: a political post for `handle` (with optional display name). */
function political(handle: string, displayName: string | null = null): PoliticalItemSpec {
  return { handle, displayName, isPolitical: true };
}

/** Shorthand: a non-political post for `handle`. */
function nonPolitical(handle: string): PoliticalItemSpec {
  return { handle, isPolitical: false };
}

describe('computePoliticalCreatorRecurrence', () => {
  describe('empty inputs', () => {
    test('returns empty result for empty scans array', () => {
      const result = computePoliticalCreatorRecurrence([], 'youtube');
      expect(result.records).toEqual([]);
      expect(result.windowScanCount).toBe(0);
    });

    test('returns empty records but real windowScanCount when no political posts in window', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [nonPolitical('@foo'), nonPolitical('@bar')]),
        makeScan('s1', '2026-05-09T12:00:00Z', [nonPolitical('@baz')]),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.records).toEqual([]);
      expect(result.windowScanCount).toBe(2);
    });

    test('returns empty records when raw_data.analysis is absent entirely', () => {
      // The political-creator extractor reads raw_data.analysis.feed_items.
      // Scans with no analysis key get an empty extracted post list.
      const scans: ScanDetail[] = [
        makeScan('s0', '2026-05-10T12:00:00Z', [political('@foo')], {
          raw_data: {}, // override: no analysis
        }),
        makeScan('s1', '2026-05-09T12:00:00Z', [political('@foo')], {
          raw_data: {}, // override: no analysis
        }),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.records).toEqual([]);
      expect(result.windowScanCount).toBe(2);
    });
  });

  describe('aggregation', () => {
    test('single political creator across N of M scans', () => {
      const scans = Array.from({ length: 5 }).map((_, i) =>
        makeScan(`s${i}`, `2026-05-${(10 - i).toString().padStart(2, '0')}T12:00:00Z`, [
          political('@news-1', 'News One'),
        ]),
      );
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(5);
      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        handle: '@news-1',
        displayName: 'News One',
        scanCount: 5,
        totalPosts: 5,
        firstSeenIndex: 4,
      });
    });

    test('multi political creator mixed recurrence sorted by scanCount desc then totalPosts desc', () => {
      // News-A: in 3 scans, 4 posts total
      // News-B: in 3 scans, 3 posts total
      // News-C: in 2 scans, 5 posts total
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          political('@news-A'),
          political('@news-A'),
          political('@news-B'),
          political('@news-C'),
          political('@news-C'),
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          political('@news-A'),
          political('@news-B'),
          political('@news-C'),
          political('@news-C'),
          political('@news-C'),
        ]),
        makeScan('s2', '2026-05-08T12:00:00Z', [
          political('@news-A'),
          political('@news-B'),
        ]),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.records.map((r) => r.handle)).toEqual([
        '@news-a',
        '@news-b',
        '@news-c',
      ]);
      expect(result.records[0]).toMatchObject({ scanCount: 3, totalPosts: 4 });
      expect(result.records[1]).toMatchObject({ scanCount: 3, totalPosts: 3 });
      expect(result.records[2]).toMatchObject({ scanCount: 2, totalPosts: 5 });
    });
  });

  describe('political-only filter', () => {
    test('non-political posts are excluded from aggregation', () => {
      // @foo appears as a political creator in 1 scan and a non-political
      // creator in 2 scans. The non-political appearances should NOT
      // count toward @foo's record.
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [political('@foo', 'Foo')]),
        makeScan('s1', '2026-05-09T12:00:00Z', [nonPolitical('@foo')]),
        makeScan('s2', '2026-05-08T12:00:00Z', [nonPolitical('@foo')]),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(3);
      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        handle: '@foo',
        scanCount: 1,
        totalPosts: 1,
      });
    });

    test('mixed political and non-political posts in same scan: only political counted', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          political('@news-source'),
          nonPolitical('@creator-1'),
          nonPolitical('@creator-2'),
          political('@news-source'),
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          nonPolitical('@creator-1'),
          political('@news-source'),
        ]),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        handle: '@news-source',
        scanCount: 2,
        totalPosts: 3,
      });
    });

    test('political post with null creator handle and null display name excluded', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          { handle: null, displayName: null, isPolitical: true },
          political('@news-1'),
        ]),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.records).toHaveLength(1);
      expect(result.records[0]!.handle).toBe('@news-1');
    });
  });

  describe('filters', () => {
    test('platform filter excludes cross-platform scans (case-insensitive)', () => {
      const scans = [
        makeScan('s-yt', '2026-05-10T12:00:00Z', [political('@news-1')], {
          platform: 'YouTube',
        }),
        makeScan('s-ig', '2026-05-09T12:00:00Z', [political('@news-1')], {
          platform: 'instagram',
        }),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'YOUTUBE');
      expect(result.windowScanCount).toBe(1);
      expect(result.records[0]!.scanCount).toBe(1);
    });

    test('excludeScanId removes the active scan from the window', () => {
      const scans = [
        makeScan('active', '2026-05-10T12:00:00Z', [political('@foo')]),
        makeScan('prior-1', '2026-05-09T12:00:00Z', [political('@foo')]),
        makeScan('prior-2', '2026-05-08T12:00:00Z', [political('@foo')]),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube', {
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
          political('@news-1'),
        ]),
      );
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(6);
      expect(result.records[0]!.scanCount).toBe(6);
    });

    test('honors custom windowSize option', () => {
      const scans = Array.from({ length: 8 }).map((_, i) =>
        makeScan(`s${i}`, `2026-05-${(20 - i).toString().padStart(2, '0')}T12:00:00Z`, [
          political('@news-1'),
        ]),
      );
      const result = computePoliticalCreatorRecurrence(scans, 'youtube', {
        windowSize: 3,
      });
      expect(result.windowScanCount).toBe(3);
      expect(result.records[0]!.scanCount).toBe(3);
    });
  });

  describe('sparse history', () => {
    test('2 scans both featuring same political creator returns sensible 2-of-2 record', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [political('@news-1')]),
        makeScan('s1', '2026-05-09T12:00:00Z', [political('@news-1')]),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.windowScanCount).toBe(2);
      expect(result.records[0]).toMatchObject({
        handle: '@news-1',
        scanCount: 2,
        totalPosts: 2,
        firstSeenIndex: 1,
      });
    });
  });

  describe('case-insensitive grouping', () => {
    test('"@PoliticalNewsChannel" and "@politicalnewschannel" collapse to one creator', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [
          political('@PoliticalNewsChannel', 'Political News Channel'),
        ]),
        makeScan('s1', '2026-05-09T12:00:00Z', [
          political('@politicalnewschannel', 'Political News Updated'),
        ]),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.records).toHaveLength(1);
      expect(result.records[0]!.scanCount).toBe(2);
      expect(result.records[0]!.handle).toBe('@politicalnewschannel');
      // displayName from the most-recent scan (newest-first walk).
      expect(result.records[0]!.displayName).toBe('Political News Channel');
    });
  });

  describe('display-name resolution', () => {
    test('falls back to handle when creator.name is null', () => {
      const scans = [
        makeScan('s0', '2026-05-10T12:00:00Z', [political('@news-1', null)]),
      ];
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      expect(result.records[0]!.displayName).toBe('@news-1');
    });
  });

  describe('failure tolerance', () => {
    test('malformed feed_items in middle of window does not crash', () => {
      const scans: ScanDetail[] = [
        makeScan('s0', '2026-05-10T12:00:00Z', [political('@news-1')]),
        makeScan('s1', '2026-05-09T12:00:00Z', [], {
          raw_data: {
            analysis: { feed_items: 'not an array' },
          } as unknown as Record<string, unknown>,
        }),
        makeScan('s2', '2026-05-08T12:00:00Z', [political('@news-1')]),
      ];
      expect(() =>
        computePoliticalCreatorRecurrence(scans, 'youtube'),
      ).not.toThrow();
      const result = computePoliticalCreatorRecurrence(scans, 'youtube');
      // Malformed feed_items skips aggregation for that scan but the
      // scan still counts toward windowScanCount.
      expect(result.windowScanCount).toBe(3);
      expect(result.records[0]!.scanCount).toBe(2);
    });
  });
});
