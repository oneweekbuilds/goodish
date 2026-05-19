/**
 * Unit tests for computeMetricTrajectory (Phase 6.4.0b).
 *
 * The derivation shares its scan-filtering + per-scan-extraction
 * logic with computeRollingAverage via the internal
 * `extractMetricAcrossWindow` helper. These tests exercise the
 * trajectory-specific behavior — chronological ordering, rich
 * per-entry shape, null filtering — and confirm the failure-tolerance
 * thresholds match rollingAverage's.
 */

import type { ScanDetail } from '../../../../hooks/useDashboard';
import { computeMetricTrajectory } from '../rollingAverage';

// ============================================
// Test fixture helpers
// ============================================

let scanCounter = 0;
function nextId(): string {
  scanCounter += 1;
  return `scan-${scanCounter}`;
}

function makeScan(overrides: Partial<ScanDetail> = {}): ScanDetail {
  return {
    id: nextId(),
    created_at: '2026-05-01T12:00:00Z',
    platform: 'youtube',
    post_count: 50,
    ad_count: 10,
    ad_percentage: 20,
    suggested_count: 30,
    suggested_percentage: 60,
    raw_data: {},
    user_id: 'user-test',
    ...overrides,
  };
}

/** Build a scan with raw_data.analysis.political_content_summary
 *  populated so the political_pct extractor can read it. */
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

/** Build a scan with raw_data.posts populated for top_creator_share. */
function makeScanWithPosts(
  posts: Array<{ handle: string | null; isAd?: boolean }>,
  overrides: Partial<ScanDetail> = {},
): ScanDetail {
  return makeScan({
    raw_data: {
      posts: posts.map((p, idx) => ({
        creator_handle: p.handle,
        creator_display_name: null,
        is_ad: p.isAd ?? false,
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

/** Build a scan with feed_items carrying tone valences. */
function makeScanWithToneValences(
  valences: Array<'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>,
  overrides: Partial<ScanDetail> = {},
): ScanDetail {
  return makeScan({
    raw_data: {
      analysis: {
        feed_items: valences.map((v) => ({
          political: { is_political: false },
          emotions: { valence: v },
        })),
      },
    },
    ...overrides,
  });
}

describe('computeMetricTrajectory', () => {
  // ============================================
  // Null returns — insufficient input
  // ============================================

  describe('null returns', () => {
    test('returns null for empty scans array', () => {
      expect(computeMetricTrajectory([], 'youtube', 'ad_pct')).toBeNull();
    });

    test('returns null for single-scan history (below MIN_VALID_SCANS)', () => {
      const scans = [makeScan({ ad_percentage: 15 })];
      expect(computeMetricTrajectory(scans, 'youtube', 'ad_pct')).toBeNull();
    });

    test('returns null when > 50% of scans have failed extraction', () => {
      // 4 scans, only 1 has political data — 3 failures of 4 > 50%.
      const scans = [
        makeScanWithPoliticalPct(10, {
          id: 'with-data',
          created_at: '2026-05-10T12:00:00Z',
        }),
        makeScan({ id: 'no-data-1', created_at: '2026-05-09T12:00:00Z' }),
        makeScan({ id: 'no-data-2', created_at: '2026-05-08T12:00:00Z' }),
        makeScan({ id: 'no-data-3', created_at: '2026-05-07T12:00:00Z' }),
      ];
      expect(
        computeMetricTrajectory(scans, 'youtube', 'political_pct'),
      ).toBeNull();
    });

    test('returns null when extraction succeeds on fewer than MIN_VALID_SCANS', () => {
      // 2 scans, 1 with data, 1 without. failures (1) is not > entries.length/2 (1),
      // so the failure threshold doesn't trip. But values.length (1) < 2, so still null.
      const scans = [
        makeScanWithPoliticalPct(10, {
          id: 's1',
          created_at: '2026-05-10T12:00:00Z',
        }),
        makeScan({ id: 's2', created_at: '2026-05-09T12:00:00Z' }),
      ];
      expect(
        computeMetricTrajectory(scans, 'youtube', 'political_pct'),
      ).toBeNull();
    });
  });

  // ============================================
  // Dense chronological output on well-formed window
  // ============================================

  describe('dense chronological output', () => {
    test('returns chronological array (oldest first) for ad_pct over 3 scans', () => {
      const scans = [
        makeScan({
          id: 'newest',
          created_at: '2026-05-12T12:00:00Z',
          ad_percentage: 11,
        }),
        makeScan({
          id: 'middle',
          created_at: '2026-05-11T12:00:00Z',
          ad_percentage: 7,
        }),
        makeScan({
          id: 'oldest',
          created_at: '2026-05-10T12:00:00Z',
          ad_percentage: 4,
        }),
      ];
      const result = computeMetricTrajectory(scans, 'youtube', 'ad_pct');
      expect(result).not.toBeNull();
      expect(result).toHaveLength(3);
      // entries[0] is oldest, last is newest.
      expect(result![0]).toMatchObject({
        scanId: 'oldest',
        createdAt: '2026-05-10T12:00:00Z',
        value: 4,
      });
      expect(result![1]).toMatchObject({ scanId: 'middle', value: 7 });
      expect(result![2]).toMatchObject({ scanId: 'newest', value: 11 });
    });

    test('design-canonical "4%, then 7%, now 11%" trajectory reads cleanly from result', () => {
      const scans = [
        makeScanWithPoliticalPct(11, {
          id: 'newest',
          created_at: '2026-05-12T12:00:00Z',
        }),
        makeScanWithPoliticalPct(7, {
          id: 'middle',
          created_at: '2026-05-11T12:00:00Z',
        }),
        makeScanWithPoliticalPct(4, {
          id: 'oldest',
          created_at: '2026-05-10T12:00:00Z',
        }),
      ];
      const result = computeMetricTrajectory(
        scans,
        'youtube',
        'political_pct',
      );
      expect(result).not.toBeNull();
      // Template interpolation: `${first}%, then ${middle}%, now ${last}%`
      const first = result![0]!.value;
      const last = result![result!.length - 1]!.value;
      expect(`${first}%, then 7%, now ${last}%`).toBe(
        '4%, then 7%, now 11%',
      );
    });
  });

  // ============================================
  // Null filtering
  // ============================================

  describe('null entry filtering', () => {
    test('skips scans where extraction returns null (tone enrichment missing)', () => {
      // 4 scans: 3 with tone valences, 1 without. The trajectory should
      // contain 3 entries, dense, chronological.
      const scans = [
        makeScanWithToneValences(['POSITIVE', 'POSITIVE', 'NEGATIVE'], {
          id: 'with-tone-1',
          created_at: '2026-05-12T12:00:00Z',
        }),
        makeScan({
          // no tone enrichment
          id: 'no-tone',
          created_at: '2026-05-11T12:00:00Z',
        }),
        makeScanWithToneValences(['NEGATIVE', 'NEGATIVE', 'POSITIVE'], {
          id: 'with-tone-2',
          created_at: '2026-05-10T12:00:00Z',
        }),
        makeScanWithToneValences(['NEUTRAL', 'NEUTRAL', 'NEUTRAL'], {
          id: 'with-tone-3',
          created_at: '2026-05-09T12:00:00Z',
        }),
      ];
      const result = computeMetricTrajectory(
        scans,
        'youtube',
        'tone_negative_pct',
      );
      expect(result).not.toBeNull();
      // 3 entries (the no-tone scan is filtered out).
      expect(result).toHaveLength(3);
      // Order is chronological — oldest first.
      expect(result!.map((e) => e.scanId)).toEqual([
        'with-tone-3',
        'with-tone-2',
        'with-tone-1',
      ]);
    });
  });

  // ============================================
  // Filters
  // ============================================

  describe('filters', () => {
    test('platform filter excludes cross-platform scans (case-insensitive)', () => {
      const scans = [
        makeScan({
          id: 's-yt',
          platform: 'YouTube',
          ad_percentage: 10,
          created_at: '2026-05-10T12:00:00Z',
        }),
        makeScan({
          id: 's-ig',
          platform: 'instagram',
          ad_percentage: 20,
          created_at: '2026-05-09T12:00:00Z',
        }),
        makeScan({
          id: 's-yt2',
          platform: 'youtube',
          ad_percentage: 15,
          created_at: '2026-05-08T12:00:00Z',
        }),
      ];
      const result = computeMetricTrajectory(scans, 'YOUTUBE', 'ad_pct');
      expect(result).not.toBeNull();
      expect(result).toHaveLength(2);
      expect(result!.map((e) => e.scanId)).toEqual(['s-yt2', 's-yt']);
    });

    test('excludeScanId removes the active scan from the window', () => {
      const scans = [
        makeScan({
          id: 'active',
          ad_percentage: 11,
          created_at: '2026-05-12T12:00:00Z',
        }),
        makeScan({
          id: 'prior-1',
          ad_percentage: 7,
          created_at: '2026-05-11T12:00:00Z',
        }),
        makeScan({
          id: 'prior-2',
          ad_percentage: 4,
          created_at: '2026-05-10T12:00:00Z',
        }),
      ];
      const result = computeMetricTrajectory(scans, 'youtube', 'ad_pct', {
        excludeScanId: 'active',
      });
      expect(result).not.toBeNull();
      expect(result).toHaveLength(2);
      // Active scan is excluded; remaining 2 in chronological order.
      expect(result!.map((e) => e.scanId)).toEqual(['prior-2', 'prior-1']);
      expect(result!.map((e) => e.value)).toEqual([4, 7]);
    });

    test('honors custom windowSize option', () => {
      const scans = Array.from({ length: 8 }).map((_, i) =>
        makeScan({
          id: `s${i}`,
          ad_percentage: 10 + i,
          created_at: `2026-05-${(20 - i).toString().padStart(2, '0')}T12:00:00Z`,
        }),
      );
      const result = computeMetricTrajectory(scans, 'youtube', 'ad_pct', {
        windowSize: 3,
      });
      expect(result).not.toBeNull();
      expect(result).toHaveLength(3);
      // Should contain the 3 most-recent scans (s0, s1, s2), oldest first.
      expect(result!.map((e) => e.scanId)).toEqual(['s2', 's1', 's0']);
    });
  });

  // ============================================
  // Per-entry shape verification
  // ============================================

  describe('per-entry shape', () => {
    test('each entry carries scanId, createdAt, and value matching the source scan', () => {
      const scans = [
        makeScan({
          id: 'first-scan',
          created_at: '2026-05-10T12:00:00.123Z',
          ad_percentage: 11,
        }),
        makeScan({
          id: 'second-scan',
          created_at: '2026-05-09T08:30:00.456Z',
          ad_percentage: 7,
        }),
      ];
      const result = computeMetricTrajectory(scans, 'youtube', 'ad_pct');
      expect(result).not.toBeNull();
      // Chronological order: second-scan is older.
      const oldest = result![0]!;
      expect(oldest.scanId).toBe('second-scan');
      expect(oldest.createdAt).toBe('2026-05-09T08:30:00.456Z');
      expect(oldest.value).toBe(7);

      const newest = result![1]!;
      expect(newest.scanId).toBe('first-scan');
      expect(newest.createdAt).toBe('2026-05-10T12:00:00.123Z');
      expect(newest.value).toBe(11);
    });
  });

  // ============================================
  // All MetricKey values exercised
  // ============================================

  describe('all MetricKey values are extractable', () => {
    test('ad_pct trajectory', () => {
      const scans = [
        makeScan({
          id: 'a',
          ad_percentage: 5,
          created_at: '2026-05-10T12:00:00Z',
        }),
        makeScan({
          id: 'b',
          ad_percentage: 10,
          created_at: '2026-05-09T12:00:00Z',
        }),
      ];
      const result = computeMetricTrajectory(scans, 'youtube', 'ad_pct');
      expect(result?.map((e) => e.value)).toEqual([10, 5]);
    });

    test('suggested_pct trajectory', () => {
      const scans = [
        makeScan({
          id: 'a',
          suggested_percentage: 50,
          created_at: '2026-05-10T12:00:00Z',
        }),
        makeScan({
          id: 'b',
          suggested_percentage: 80,
          created_at: '2026-05-09T12:00:00Z',
        }),
      ];
      const result = computeMetricTrajectory(scans, 'youtube', 'suggested_pct');
      expect(result?.map((e) => e.value)).toEqual([80, 50]);
    });

    test('political_pct trajectory', () => {
      const scans = [
        makeScanWithPoliticalPct(8, {
          id: 'a',
          created_at: '2026-05-10T12:00:00Z',
        }),
        makeScanWithPoliticalPct(3, {
          id: 'b',
          created_at: '2026-05-09T12:00:00Z',
        }),
      ];
      const result = computeMetricTrajectory(scans, 'youtube', 'political_pct');
      expect(result?.map((e) => e.value)).toEqual([3, 8]);
    });

    test('top_creator_share trajectory', () => {
      // 10 posts, 5 from @foo → 50% top_creator_share.
      const scanA = makeScanWithPosts(
        Array.from({ length: 10 }).map((_, i) => ({
          handle: i < 5 ? '@foo' : `@other-${i}`,
        })),
        { id: 'a', created_at: '2026-05-10T12:00:00Z' },
      );
      // 10 posts, 3 from @foo → 30%.
      const scanB = makeScanWithPosts(
        Array.from({ length: 10 }).map((_, i) => ({
          handle: i < 3 ? '@foo' : `@other-${i}`,
        })),
        { id: 'b', created_at: '2026-05-09T12:00:00Z' },
      );
      const result = computeMetricTrajectory(
        [scanA, scanB],
        'youtube',
        'top_creator_share',
      );
      expect(result).not.toBeNull();
      expect(result![0]!.value).toBe(30);
      expect(result![1]!.value).toBe(50);
    });

    test('tone_positive_pct + tone_neutral_pct + tone_negative_pct trajectories', () => {
      // Both scans have 10 items each: 4 positive, 3 neutral, 3 negative.
      // positivePct = 40, neutralPct = 30, negativePct = 30.
      const valences: Array<'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'> = [
        'POSITIVE',
        'POSITIVE',
        'POSITIVE',
        'POSITIVE',
        'NEUTRAL',
        'NEUTRAL',
        'NEUTRAL',
        'NEGATIVE',
        'NEGATIVE',
        'NEGATIVE',
      ];
      const scans = [
        makeScanWithToneValences(valences, {
          id: 'a',
          created_at: '2026-05-10T12:00:00Z',
        }),
        makeScanWithToneValences(valences, {
          id: 'b',
          created_at: '2026-05-09T12:00:00Z',
        }),
      ];
      expect(
        computeMetricTrajectory(scans, 'youtube', 'tone_positive_pct')?.map(
          (e) => e.value,
        ),
      ).toEqual([40, 40]);
      expect(
        computeMetricTrajectory(scans, 'youtube', 'tone_neutral_pct')?.map(
          (e) => e.value,
        ),
      ).toEqual([30, 30]);
      expect(
        computeMetricTrajectory(scans, 'youtube', 'tone_negative_pct')?.map(
          (e) => e.value,
        ),
      ).toEqual([30, 30]);
    });
  });
});
