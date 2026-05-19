/**
 * Unit tests for computeFollowedCreatorRecurrence and
 * computeCreatorAbsence (Phase 6.5.0).
 *
 * Coverage:
 *   - Followed-creator wrapper: empty, only-suggested, only-followed,
 *     null-suggested exclusion, mixed-state collapse, new lastSeen
 *     fields populated.
 *   - Absence helper: empty input, present-in-active (daysSinceLastSeen
 *     = 0), 8-day gap (design-canonical), sort-by-absence-desc,
 *     malformed-date tolerance, minDays filter, minDays passes nulls,
 *     negative-delta clamp.
 *
 * Tests fixture is mock ScanDetail constructed inline — same pattern
 * as creatorRecurrence.test.ts. We deliberately do NOT route through
 * the production data pipeline; the wrapper is small enough to test
 * directly against synthetic input.
 */

import type { ScanDetail } from '../../../../hooks/useDashboard';
import {
  computeCreatorAbsence,
  computeFollowedCreatorRecurrence,
} from '../creatorAbsence';
import type { RecurrenceResult } from '../recurrenceCore';

// ============================================
// Fixture helpers
// ============================================

interface PostSpec {
  handle: string;
  displayName?: string;
  isSuggested: boolean | null;
}

function makePost(spec: PostSpec): unknown {
  return {
    creator_handle: spec.handle,
    creator_display_name: spec.displayName ?? null,
    is_ad: false,
    is_suggested: spec.isSuggested,
    content_type: 'video',
    hashtags: [],
    position_in_feed: 1,
    ad_label_text: null,
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
    ad_count: 0,
    ad_percentage: 0,
    suggested_count: 0,
    suggested_percentage: 0,
    raw_data: {
      posts: posts.map(makePost),
    },
    user_id: 'user-test',
    ...overrides,
  } as ScanDetail;
}

// ============================================
// computeFollowedCreatorRecurrence
// ============================================

describe('computeFollowedCreatorRecurrence', () => {
  test('returns empty result for empty scans array', () => {
    const result = computeFollowedCreatorRecurrence([], 'youtube');
    expect(result.records).toEqual([]);
    expect(result.windowScanCount).toBe(0);
  });

  test('returns empty records when all posts are is_suggested: true', () => {
    const scans = [
      makeScan('s1', '2026-05-13T12:00:00Z', [
        { handle: '@alice', isSuggested: true },
        { handle: '@bob', isSuggested: true },
      ]),
    ];
    const result = computeFollowedCreatorRecurrence(scans, 'youtube');
    expect(result.records).toEqual([]);
    // windowScanCount counts the scan itself; only the records list is empty.
    expect(result.windowScanCount).toBe(1);
  });

  test('aggregates is_suggested: false posts by creator across scans', () => {
    const scans = [
      makeScan('s1', '2026-05-13T12:00:00Z', [
        { handle: '@alice', displayName: 'Alice', isSuggested: false },
        { handle: '@alice', displayName: 'Alice', isSuggested: false },
      ]),
      makeScan('s2', '2026-05-12T12:00:00Z', [
        { handle: '@alice', displayName: 'Alice', isSuggested: false },
        { handle: '@bob', displayName: 'Bob', isSuggested: false },
      ]),
    ];
    const result = computeFollowedCreatorRecurrence(scans, 'youtube');
    expect(result.records).toHaveLength(2);
    const alice = result.records.find((r) => r.handle === '@alice')!;
    expect(alice.scanCount).toBe(2);
    expect(alice.totalPosts).toBe(3);
    const bob = result.records.find((r) => r.handle === '@bob')!;
    expect(bob.scanCount).toBe(1);
    expect(bob.totalPosts).toBe(1);
  });

  test('excludes is_suggested: null posts', () => {
    const scans = [
      makeScan('s1', '2026-05-13T12:00:00Z', [
        { handle: '@alice', isSuggested: null },
        { handle: '@bob', isSuggested: false },
      ]),
    ];
    const result = computeFollowedCreatorRecurrence(scans, 'youtube');
    expect(result.records).toHaveLength(1);
    expect(result.records[0]!.handle).toBe('@bob');
  });

  test('mixed-state creator: only is_suggested: false posts contribute to count', () => {
    // @alice has 2 followed posts in s1 and 1 suggested post in s2.
    // Only the followed posts count: scanCount=1, totalPosts=2.
    const scans = [
      makeScan('s1', '2026-05-13T12:00:00Z', [
        { handle: '@alice', isSuggested: false },
        { handle: '@alice', isSuggested: false },
      ]),
      makeScan('s2', '2026-05-12T12:00:00Z', [
        { handle: '@alice', isSuggested: true },
      ]),
    ];
    const result = computeFollowedCreatorRecurrence(scans, 'youtube');
    expect(result.records).toHaveLength(1);
    const alice = result.records[0]!;
    expect(alice.scanCount).toBe(1);
    expect(alice.totalPosts).toBe(2);
  });

  test('records carry the new lastSeen fields populated from the source scan', () => {
    // @alice appears in s1 (most recent) and s2. lastSeenIndex=0,
    // lastSeenScanId='s1', lastSeenAt matches s1's created_at.
    const scans = [
      makeScan('s1', '2026-05-13T12:00:00Z', [
        { handle: '@alice', isSuggested: false },
      ]),
      makeScan('s2', '2026-05-12T12:00:00Z', [
        { handle: '@alice', isSuggested: false },
      ]),
    ];
    const result = computeFollowedCreatorRecurrence(scans, 'youtube');
    const alice = result.records[0]!;
    expect(alice.lastSeenIndex).toBe(0);
    expect(alice.lastSeenScanId).toBe('s1');
    expect(alice.lastSeenAt).toBe('2026-05-13T12:00:00Z');
    // firstSeenIndex (oldest) should be 1 — alice appears in s2 too.
    expect(alice.firstSeenIndex).toBe(1);
  });

  test('lastSeenIndex captures absence: creator in older scans only', () => {
    // @alice appears in s2 only; s1 has @bob alone. In the desc-sorted
    // window [s1@0, s2@1], alice's lastSeenIndex is 1 (she's NOT in
    // the most recent scan).
    const scans = [
      makeScan('s1', '2026-05-13T12:00:00Z', [
        { handle: '@bob', isSuggested: false },
      ]),
      makeScan('s2', '2026-05-12T12:00:00Z', [
        { handle: '@alice', isSuggested: false },
      ]),
    ];
    const result = computeFollowedCreatorRecurrence(scans, 'youtube');
    const alice = result.records.find((r) => r.handle === '@alice')!;
    expect(alice.lastSeenIndex).toBe(1);
    expect(alice.firstSeenIndex).toBe(1);
    expect(alice.lastSeenScanId).toBe('s2');
  });
});

// ============================================
// computeCreatorAbsence
// ============================================

describe('computeCreatorAbsence', () => {
  function makeRecurrence(
    records: RecurrenceResult['records'],
    windowScanCount = records.length,
  ): RecurrenceResult {
    return { records, windowScanCount };
  }

  test('returns empty records when input recurrence is empty', () => {
    const result = computeCreatorAbsence(
      makeRecurrence([]),
      '2026-05-13T12:00:00Z',
    );
    expect(result.records).toEqual([]);
  });

  test('daysSinceLastSeen = 0 when lastSeenAt matches activeScanCreatedAt', () => {
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@alice',
          displayName: 'Alice',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's-active',
          lastSeenAt: '2026-05-13T12:00:00Z',
        },
      ]),
      '2026-05-13T12:00:00Z',
    );
    expect(result.records[0]!.daysSinceLastSeen).toBe(0);
  });

  test('daysSinceLastSeen = 8 for design-canonical 8-day gap', () => {
    // Active scan 2026-05-13, last seen 2026-05-05 → 8 days exactly.
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@colinandsamir',
          displayName: 'Colin and Samir',
          scanCount: 1,
          totalPosts: 3,
          firstSeenIndex: 4,
          lastSeenIndex: 4,
          lastSeenScanId: 's-old',
          lastSeenAt: '2026-05-05T12:00:00Z',
        },
      ]),
      '2026-05-13T12:00:00Z',
    );
    expect(result.records[0]!.daysSinceLastSeen).toBe(8);
  });

  test('floor semantics: 7.6-day gap rounds down to 7 days', () => {
    // 7 days 14 hours apart → floor → 7 days.
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@alice',
          displayName: 'Alice',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's-old',
          lastSeenAt: '2026-05-05T22:00:00Z',
        },
      ]),
      '2026-05-13T12:00:00Z',
    );
    expect(result.records[0]!.daysSinceLastSeen).toBe(7);
  });

  test('sorts records by daysSinceLastSeen desc (longest absence first)', () => {
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@recent',
          displayName: 'Recent',
          scanCount: 1,
          totalPosts: 5,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's-active',
          lastSeenAt: '2026-05-13T00:00:00Z',
        },
        {
          handle: '@longgone',
          displayName: 'Long Gone',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 5,
          lastSeenIndex: 5,
          lastSeenScanId: 's-old',
          lastSeenAt: '2026-04-25T00:00:00Z',
        },
        {
          handle: '@mid',
          displayName: 'Mid',
          scanCount: 1,
          totalPosts: 2,
          firstSeenIndex: 2,
          lastSeenIndex: 2,
          lastSeenScanId: 's-mid',
          lastSeenAt: '2026-05-09T00:00:00Z',
        },
      ]),
      '2026-05-13T00:00:00Z',
    );
    expect(result.records.map((r) => r.handle)).toEqual([
      '@longgone',
      '@mid',
      '@recent',
    ]);
  });

  test('malformed lastSeenAt → daysSinceLastSeen is null, record still present', () => {
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@alice',
          displayName: 'Alice',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's1',
          lastSeenAt: 'not-a-real-date',
        },
      ]),
      '2026-05-13T00:00:00Z',
    );
    expect(result.records).toHaveLength(1);
    expect(result.records[0]!.daysSinceLastSeen).toBeNull();
  });

  test('null daysSinceLastSeen records sort to the end', () => {
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@broken',
          displayName: 'Broken',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's1',
          lastSeenAt: 'broken-date',
        },
        {
          handle: '@gone',
          displayName: 'Gone',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's2',
          lastSeenAt: '2026-05-05T00:00:00Z',
        },
      ]),
      '2026-05-13T00:00:00Z',
    );
    expect(result.records.map((r) => r.handle)).toEqual(['@gone', '@broken']);
  });

  test('minDays option filters records below threshold', () => {
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@in-active',
          displayName: 'In Active',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's-active',
          lastSeenAt: '2026-05-13T00:00:00Z',
        },
        {
          handle: '@3days',
          displayName: 'Three Days',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's3',
          lastSeenAt: '2026-05-10T00:00:00Z',
        },
        {
          handle: '@8days',
          displayName: 'Eight Days',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's8',
          lastSeenAt: '2026-05-05T00:00:00Z',
        },
      ]),
      '2026-05-13T00:00:00Z',
      { minDays: 5 },
    );
    // Only @8days clears the 5-day threshold.
    expect(result.records).toHaveLength(1);
    expect(result.records[0]!.handle).toBe('@8days');
  });

  test('minDays does not filter records with null daysSinceLastSeen', () => {
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@broken',
          displayName: 'Broken',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's1',
          lastSeenAt: 'not-a-real-date',
        },
        {
          handle: '@too-recent',
          displayName: 'Too Recent',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's2',
          lastSeenAt: '2026-05-13T00:00:00Z',
        },
      ]),
      '2026-05-13T00:00:00Z',
      { minDays: 5 },
    );
    // @broken (null) passes through; @too-recent (0 days) is filtered.
    expect(result.records).toHaveLength(1);
    expect(result.records[0]!.handle).toBe('@broken');
    expect(result.records[0]!.daysSinceLastSeen).toBeNull();
  });

  test('negative-delta (lastSeen after active) clamps to 0', () => {
    // Last seen tomorrow, active today — defensive: clamp to 0.
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@time-traveler',
          displayName: 'Time Traveler',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's-future',
          lastSeenAt: '2026-05-14T00:00:00Z',
        },
      ]),
      '2026-05-13T00:00:00Z',
    );
    expect(result.records[0]!.daysSinceLastSeen).toBe(0);
  });

  test('malformed activeScanCreatedAt → all records get null daysSinceLastSeen', () => {
    const result = computeCreatorAbsence(
      makeRecurrence([
        {
          handle: '@alice',
          displayName: 'Alice',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's1',
          lastSeenAt: '2026-05-05T00:00:00Z',
        },
        {
          handle: '@bob',
          displayName: 'Bob',
          scanCount: 1,
          totalPosts: 1,
          firstSeenIndex: 0,
          lastSeenIndex: 0,
          lastSeenScanId: 's2',
          lastSeenAt: '2026-05-10T00:00:00Z',
        },
      ]),
      'broken-active-date',
    );
    expect(result.records).toHaveLength(2);
    for (const r of result.records) {
      expect(r.daysSinceLastSeen).toBeNull();
    }
  });
});

// ============================================
// Integration: end-to-end set discovery
// ============================================

describe('followed-creator absence — integration', () => {
  test('design-canonical 8-day-gone followed creator surfaces as records[0]', () => {
    // Build a 5-scan window. @colinandsamir is followed and appears
    // only in the oldest scan (8 days before active). @mkbhd is
    // followed and appears in every scan. @news is suggested (excluded).
    //
    // Expected: absence.records[0] = @colinandsamir, daysSinceLastSeen=8.
    const scans = [
      // s1: active
      makeScan('s1', '2026-05-13T12:00:00Z', [
        { handle: '@mkbhd', displayName: 'MKBHD', isSuggested: false },
        { handle: '@news', isSuggested: true },
      ]),
      makeScan('s2', '2026-05-12T12:00:00Z', [
        { handle: '@mkbhd', displayName: 'MKBHD', isSuggested: false },
      ]),
      makeScan('s3', '2026-05-10T12:00:00Z', [
        { handle: '@mkbhd', displayName: 'MKBHD', isSuggested: false },
      ]),
      makeScan('s4', '2026-05-08T12:00:00Z', [
        { handle: '@mkbhd', displayName: 'MKBHD', isSuggested: false },
      ]),
      makeScan('s5', '2026-05-05T12:00:00Z', [
        { handle: '@mkbhd', displayName: 'MKBHD', isSuggested: false },
        {
          handle: '@colinandsamir',
          displayName: 'Colin and Samir',
          isSuggested: false,
        },
      ]),
    ];

    const recurrence = computeFollowedCreatorRecurrence(scans, 'youtube');
    const absence = computeCreatorAbsence(
      recurrence,
      '2026-05-13T12:00:00Z',
    );

    expect(absence.records[0]!.handle).toBe('@colinandsamir');
    expect(absence.records[0]!.daysSinceLastSeen).toBe(8);
    expect(absence.records[0]!.displayName).toBe('Colin and Samir');
    // @mkbhd present in active scan → 0 days.
    const mkbhd = absence.records.find((r) => r.handle === '@mkbhd')!;
    expect(mkbhd.daysSinceLastSeen).toBe(0);
    // @news (suggested) is correctly excluded by the followed predicate.
    expect(absence.records.find((r) => r.handle === '@news')).toBeUndefined();
  });
});
