/**
 * Unit tests for computeRollingAverage (Phase 2 of MVP implementation).
 *
 * Covers edge cases, platform filtering, current-scan exclusion,
 * window sizing, per-metric extraction, malformed-data tolerance,
 * and the >50% failure threshold.
 */

import type { ScanDetail } from '../../../../hooks/useDashboard';
import { computeRollingAverage } from '../rollingAverage';

// ============================================
// Test fixture helpers
// ============================================

let scanCounter = 0;
function nextId(): string {
  scanCounter += 1;
  return `scan-${scanCounter}`;
}

/**
 * Build a ScanDetail with sensible defaults. Override only the fields
 * a test cares about. The cast at the end lets individual tests pass
 * intentionally malformed values (null raw_data, etc.) to verify
 * defensive handling.
 */
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

describe('computeRollingAverage', () => {
  // ============================================
  // Edge cases
  // ============================================

  describe('edge cases', () => {
    test('returns null for empty scan array', () => {
      expect(computeRollingAverage([], 'youtube', 'ad_pct')).toBeNull();
    });

    test('returns null for single scan (need at least 2 for average)', () => {
      const scans = [makeScan({ ad_percentage: 12 })];
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBeNull();
    });

    test('returns null when all scans filtered out by platform', () => {
      const scans = [
        makeScan({ platform: 'instagram', ad_percentage: 10 }),
        makeScan({ platform: 'instagram', ad_percentage: 12 }),
      ];
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBeNull();
    });

    test('returns null when only one scan after platform filter', () => {
      const scans = [
        makeScan({ platform: 'youtube', ad_percentage: 10 }),
        makeScan({ platform: 'instagram', ad_percentage: 12 }),
        makeScan({ platform: 'instagram', ad_percentage: 14 }),
      ];
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBeNull();
    });
  });

  // ============================================
  // Platform filtering
  // ============================================

  describe('platform filtering', () => {
    test('matches platform case-insensitively', () => {
      const scans = [
        makeScan({ platform: 'YouTube', ad_percentage: 10 }),
        makeScan({ platform: 'YOUTUBE', ad_percentage: 20 }),
      ];
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBe(15);
    });

    test('excludes scans from other platforms', () => {
      const scans = [
        makeScan({ platform: 'youtube', ad_percentage: 10 }),
        makeScan({ platform: 'youtube', ad_percentage: 20 }),
        makeScan({ platform: 'instagram', ad_percentage: 100 }),
        makeScan({ platform: 'tiktok', ad_percentage: 100 }),
      ];
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBe(15);
    });
  });

  // ============================================
  // excludeScanId
  // ============================================

  describe('excludeScanId option', () => {
    test('excludes the current scan when its id matches', () => {
      const current = makeScan({ id: 'current-scan', ad_percentage: 50 });
      const scans = [
        current,
        makeScan({ ad_percentage: 10 }),
        makeScan({ ad_percentage: 20 }),
      ];
      const result = computeRollingAverage(scans, 'youtube', 'ad_pct', {
        excludeScanId: 'current-scan',
      });
      // Average of 10 and 20 only — 50 from the excluded scan is dropped.
      expect(result).toBe(15);
    });

    test('does not exclude when excludeScanId does not match', () => {
      const scans = [
        makeScan({ ad_percentage: 10 }),
        makeScan({ ad_percentage: 20 }),
      ];
      const result = computeRollingAverage(scans, 'youtube', 'ad_pct', {
        excludeScanId: 'nonexistent',
      });
      expect(result).toBe(15);
    });
  });

  // ============================================
  // Window size
  // ============================================

  describe('window size', () => {
    test('respects default windowSize of 5', () => {
      // 7 scans on youtube; window 5 = 5 most-recent.
      const scans = [
        makeScan({ created_at: '2026-05-07T12:00:00Z', ad_percentage: 10 }),
        makeScan({ created_at: '2026-05-06T12:00:00Z', ad_percentage: 20 }),
        makeScan({ created_at: '2026-05-05T12:00:00Z', ad_percentage: 30 }),
        makeScan({ created_at: '2026-05-04T12:00:00Z', ad_percentage: 40 }),
        makeScan({ created_at: '2026-05-03T12:00:00Z', ad_percentage: 50 }),
        makeScan({ created_at: '2026-05-02T12:00:00Z', ad_percentage: 100 }),
        makeScan({ created_at: '2026-05-01T12:00:00Z', ad_percentage: 200 }),
      ];
      // Top 5 by date: 10, 20, 30, 40, 50. Avg 30. The 100 and 200 are excluded.
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBe(30);
    });

    test('respects custom windowSize', () => {
      const scans = [
        makeScan({ created_at: '2026-05-04T12:00:00Z', ad_percentage: 10 }),
        makeScan({ created_at: '2026-05-03T12:00:00Z', ad_percentage: 20 }),
        makeScan({ created_at: '2026-05-02T12:00:00Z', ad_percentage: 30 }),
        makeScan({ created_at: '2026-05-01T12:00:00Z', ad_percentage: 40 }),
      ];
      // Window 2: only the two most-recent (10 and 20). Avg 15.
      expect(
        computeRollingAverage(scans, 'youtube', 'ad_pct', { windowSize: 2 }),
      ).toBe(15);
    });
  });

  // ============================================
  // Direct-field metrics
  // ============================================

  describe('metric: ad_pct (direct field)', () => {
    test('computes the arithmetic mean', () => {
      const scans = [
        makeScan({ ad_percentage: 12 }),
        makeScan({ ad_percentage: 14 }),
        makeScan({ ad_percentage: 16 }),
      ];
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBe(14);
    });

    test('rounds to 1 decimal place', () => {
      const scans = [
        makeScan({ ad_percentage: 10 }),
        makeScan({ ad_percentage: 11 }),
        makeScan({ ad_percentage: 11 }),
      ];
      // 32 / 3 = 10.666... should round to 10.7.
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBe(10.7);
    });
  });

  describe('metric: suggested_pct (direct field)', () => {
    test('computes the average from direct field', () => {
      const scans = [
        makeScan({ suggested_percentage: 60 }),
        makeScan({ suggested_percentage: 70 }),
      ];
      expect(computeRollingAverage(scans, 'youtube', 'suggested_pct')).toBe(65);
    });
  });

  // ============================================
  // Derived metrics
  // ============================================

  describe('metric: top_creator_share (derived from raw_data.posts)', () => {
    test('computes max-creator-share per scan, then averages', () => {
      // Scan 1: alice posted 3 of 10 → 30%
      const scan1 = makeScan({
        raw_data: {
          posts: [
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: 'bob' },
            { creator_handle: 'carol' },
            { creator_handle: 'dave' },
            { creator_handle: 'eve' },
            { creator_handle: 'frank' },
            { creator_handle: 'gina' },
            { creator_handle: 'hal' },
          ],
        },
      });
      // Scan 2: alice posted 4 of 10 → 40%
      const scan2 = makeScan({
        raw_data: {
          posts: [
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: 'bob' },
            { creator_handle: 'carol' },
            { creator_handle: 'dave' },
            { creator_handle: 'eve' },
            { creator_handle: 'frank' },
            { creator_handle: 'gina' },
          ],
        },
      });
      // Average 30 and 40 → 35.
      expect(
        computeRollingAverage([scan1, scan2], 'youtube', 'top_creator_share'),
      ).toBe(35);
    });

    test('falls back to creator_display_name when handle is missing', () => {
      const scan1 = makeScan({
        raw_data: {
          posts: [
            { creator_handle: null, creator_display_name: 'Alice Name' },
            { creator_handle: null, creator_display_name: 'Alice Name' },
            { creator_handle: 'bob' },
            { creator_handle: 'carol' },
          ],
        },
      });
      const scan2 = makeScan({
        raw_data: {
          posts: [
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: 'bob' },
            { creator_handle: 'carol' },
          ],
        },
      });
      // Scan 1: 'Alice Name' has 2/4 = 50%. Scan 2: 'alice' has 2/4 = 50%. Avg 50.
      expect(
        computeRollingAverage([scan1, scan2], 'youtube', 'top_creator_share'),
      ).toBe(50);
    });

    test('skips posts with no identifiable creator', () => {
      const scan1 = makeScan({
        raw_data: {
          posts: [
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: null, creator_display_name: null },
            { creator_handle: '', creator_display_name: '' },
          ],
        },
      });
      const scan2 = makeScan({
        raw_data: {
          posts: [
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: 'bob' },
            { creator_handle: 'carol' },
          ],
        },
      });
      // Scan 1: alice has 2 identified; 4 total posts → 2/4 = 50%
      // Scan 2: alice has 2/4 = 50%
      // Avg 50.
      expect(
        computeRollingAverage([scan1, scan2], 'youtube', 'top_creator_share'),
      ).toBe(50);
    });
  });

  describe('metric: political_pct (derived)', () => {
    test('uses pre-computed political_content_summary when available', () => {
      const scans = [
        makeScan({
          raw_data: {
            analysis: {
              political_content_summary: { political_percentage: 11 },
            },
          },
        }),
        makeScan({
          raw_data: {
            analysis: {
              political_content_summary: { political_percentage: 7 },
            },
          },
        }),
      ];
      expect(computeRollingAverage(scans, 'youtube', 'political_pct')).toBe(9);
    });

    test('falls back to feed_items derivation when summary is absent', () => {
      const buildItems = (politicalCount: number, total: number) =>
        Array.from({ length: total }, (_, i) => ({
          political: { is_political: i < politicalCount },
        }));
      const scans = [
        makeScan({
          raw_data: { analysis: { feed_items: buildItems(2, 10) } },
        }),
        makeScan({
          raw_data: { analysis: { feed_items: buildItems(4, 10) } },
        }),
      ];
      // 20% and 40% → avg 30%.
      expect(computeRollingAverage(scans, 'youtube', 'political_pct')).toBe(30);
    });
  });

  describe('metric: tone (POSITIVE/NEUTRAL/NEGATIVE)', () => {
    function toneScan(valences: string[]): ScanDetail {
      return makeScan({
        raw_data: {
          analysis: {
            feed_items: valences.map((v) => ({ emotions: { valence: v } })),
          },
        },
      });
    }

    test('computes tone_negative_pct excluding MIXED from denominator', () => {
      const scan1 = toneScan([
        'NEGATIVE',
        'NEGATIVE',
        'POSITIVE',
        'NEUTRAL',
        'MIXED', // excluded from both numerator and denominator
      ]);
      const scan2 = toneScan([
        'NEGATIVE',
        'POSITIVE',
        'NEUTRAL',
        'NEUTRAL',
      ]);
      // Scan 1: 2 negative / 4 known = 50%.
      // Scan 2: 1 negative / 4 known = 25%.
      // Average 37.5.
      expect(
        computeRollingAverage([scan1, scan2], 'youtube', 'tone_negative_pct'),
      ).toBe(37.5);
    });

    test('computes tone_positive_pct independently of other valences', () => {
      const scan1 = toneScan(['POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE']);
      const scan2 = toneScan(['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'NEUTRAL']);
      // Scan 1: 2/4 = 50%. Scan 2: 1/4 = 25%. Avg 37.5.
      expect(
        computeRollingAverage([scan1, scan2], 'youtube', 'tone_positive_pct'),
      ).toBe(37.5);
    });

    test('returns null when no scan has any known-valence items', () => {
      const scans = [
        toneScan(['MIXED', 'MIXED']),
        toneScan(['MIXED', 'MIXED']),
        toneScan(['MIXED', 'MIXED']),
      ];
      // Every extractor returns null; all three fail → result is null.
      expect(
        computeRollingAverage(scans, 'youtube', 'tone_negative_pct'),
      ).toBeNull();
    });
  });

  // ============================================
  // Failure threshold (>50% rule)
  // ============================================

  describe('extraction failure threshold', () => {
    test('returns null when more than half of scans fail extraction', () => {
      const scans = [
        makeScan({ ad_percentage: 10 }),
        { ...makeScan(), ad_percentage: null as unknown as number },
        { ...makeScan(), ad_percentage: undefined as unknown as number },
      ];
      // 2 of 3 fail → > 50% → null.
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBeNull();
    });

    test('returns average when extraction succeeds on at least half', () => {
      const scans = [
        makeScan({ ad_percentage: 10 }),
        makeScan({ ad_percentage: 20 }),
        { ...makeScan(), ad_percentage: null as unknown as number },
      ];
      // 2 of 3 succeed; 1 of 3 fails (33% < 50%). Avg of 10 and 20 = 15.
      expect(computeRollingAverage(scans, 'youtube', 'ad_pct')).toBe(15);
    });
  });

  // ============================================
  // Malformed raw_data tolerance
  // ============================================

  describe('malformed raw_data tolerance', () => {
    test('handles null raw_data without crashing', () => {
      const bad = { ...makeScan(), raw_data: null as unknown as Record<string, unknown> };
      const good1 = makeScan({
        raw_data: {
          posts: [
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: 'bob' },
            { creator_handle: 'carol' },
          ],
        },
      });
      const good2 = makeScan({
        raw_data: {
          posts: [
            { creator_handle: 'alice' },
            { creator_handle: 'alice' },
            { creator_handle: 'bob' },
            { creator_handle: 'carol' },
          ],
        },
      });
      // 1 of 3 fails (the bad one); both goods = 50% → avg 50.
      expect(
        computeRollingAverage([bad, good1, good2], 'youtube', 'top_creator_share'),
      ).toBe(50);
    });

    test('handles non-array posts gracefully', () => {
      const scans = [
        makeScan({ raw_data: { posts: 'not-an-array' as unknown as object[] } }),
        makeScan({ raw_data: { posts: { not: 'an-array' } as unknown as object[] } }),
        makeScan({ raw_data: { posts: 42 as unknown as object[] } }),
      ];
      // All extractions fail → null.
      expect(
        computeRollingAverage(scans, 'youtube', 'top_creator_share'),
      ).toBeNull();
    });

    test('handles missing analysis field for tone metrics', () => {
      const scans = [
        makeScan({ raw_data: {} }),
        makeScan({ raw_data: {} }),
        makeScan({ raw_data: {} }),
      ];
      expect(
        computeRollingAverage(scans, 'youtube', 'tone_positive_pct'),
      ).toBeNull();
    });
  });
});
