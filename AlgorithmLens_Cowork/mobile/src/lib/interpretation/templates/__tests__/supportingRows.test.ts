/**
 * Unit tests for the supporting-row builders that aren't covered by
 * the template-level tests in interpretationEngine.test.ts. Phase
 * 5.2.5 adds buildTopVoiceRow + recurrenceAnchor; the other four
 * row builders (Ads / Patterns / Political / Tone) are exercised
 * indirectly through every template's supportingRows assertions.
 */

import type { ScanDetail } from '../../../../hooks/useDashboard';
import {
  buildRecurringAdvertiserRow,
  buildTopVoiceRow,
  recurrenceAnchor,
} from '../supportingRows';

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
  };
}

// ============================================
// recurrenceAnchor
// ============================================

describe('recurrenceAnchor', () => {
  test('"in both your scans" when scanCount === windowScanCount === 2', () => {
    expect(recurrenceAnchor(2, 2)).toBe('in both your scans');
  });

  test('"in all N of your scans" when scanCount === windowScanCount >= 3', () => {
    expect(recurrenceAnchor(3, 3)).toBe('in all 3 of your scans');
    expect(recurrenceAnchor(5, 5)).toBe('in all 5 of your scans');
    expect(recurrenceAnchor(6, 6)).toBe('in all 6 of your scans');
  });

  test('"in M of your last 3 scans" when windowScanCount === 3 and scanCount < 3', () => {
    expect(recurrenceAnchor(2, 3)).toBe('in 2 of your last 3 scans');
  });

  test('"in M of last N scans" when windowScanCount >= 4 and scanCount < windowScanCount', () => {
    expect(recurrenceAnchor(3, 4)).toBe('in 3 of last 4 scans');
    expect(recurrenceAnchor(5, 6)).toBe('in 5 of last 6 scans'); // design-spec canonical
    expect(recurrenceAnchor(4, 6)).toBe('in 4 of last 6 scans');
  });
});

// ============================================
// buildTopVoiceRow
// ============================================

describe('buildTopVoiceRow', () => {
  test('returns null on empty scans', () => {
    expect(buildTopVoiceRow([], 'youtube')).toBeNull();
  });

  test('returns null when no creator has scanCount >= 2', () => {
    // Each creator appears in exactly one scan.
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [{ handle: '@alice' }]),
      makeScan('s1', '2026-05-09T12:00:00Z', [{ handle: '@bob' }]),
      makeScan('s2', '2026-05-08T12:00:00Z', [{ handle: '@carol' }]),
    ];
    expect(buildTopVoiceRow(scans, 'youtube')).toBeNull();
  });

  test('returns null when no identifiable creators exist', () => {
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: null, displayName: null },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [
        { handle: null, displayName: null },
      ]),
    ];
    expect(buildTopVoiceRow(scans, 'youtube')).toBeNull();
  });

  test('returns FactRow with "in both your scans" at 2-of-2', () => {
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: '@foo', displayName: 'Foo' },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [
        { handle: '@foo', displayName: 'Foo' },
      ]),
    ];
    expect(buildTopVoiceRow(scans, 'youtube')).toEqual({
      variant: 'fact',
      label: 'Top voice',
      value: 'Foo',
      anchor: 'in both your scans',
    });
  });

  test('returns FactRow with "in all N of your scans" when scanCount === windowScanCount >= 3', () => {
    const scans = Array.from({ length: 3 }).map((_, i) =>
      makeScan(`s${i}`, `2026-05-${(10 - i).toString().padStart(2, '0')}T12:00:00Z`, [
        { handle: '@foo', displayName: 'Foo' },
      ]),
    );
    const row = buildTopVoiceRow(scans, 'youtube');
    expect(row?.anchor).toBe('in all 3 of your scans');
  });

  test('returns FactRow with "in M of last N scans" when windowScanCount >= 4', () => {
    const scans = [
      makeScan('s0', '2026-05-13T12:00:00Z', [{ handle: '@foo' }]),
      makeScan('s1', '2026-05-12T12:00:00Z', [{ handle: '@bar' }]),
      makeScan('s2', '2026-05-11T12:00:00Z', [{ handle: '@foo' }]),
      makeScan('s3', '2026-05-10T12:00:00Z', [{ handle: '@foo' }]),
    ];
    const row = buildTopVoiceRow(scans, 'youtube');
    expect(row?.value).toBe('@foo');
    expect(row?.anchor).toBe('in 3 of last 4 scans');
  });

  test('picks top recurrer by scanCount, then totalPosts tiebreaker', () => {
    // Two creators tied at scanCount = 2. @bar has more totalPosts.
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: '@foo', displayName: 'Foo' },
        { handle: '@bar', displayName: 'Bar' },
        { handle: '@bar', displayName: 'Bar' },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [
        { handle: '@foo', displayName: 'Foo' },
        { handle: '@bar', displayName: 'Bar' },
        { handle: '@bar', displayName: 'Bar' },
      ]),
    ];
    const row = buildTopVoiceRow(scans, 'youtube');
    expect(row?.value).toBe('Bar');
  });

  test('displayName falls back to handle when display_name is null', () => {
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: '@foo', displayName: null },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [
        { handle: '@foo', displayName: null },
      ]),
    ];
    const row = buildTopVoiceRow(scans, 'youtube');
    expect(row?.value).toBe('@foo');
  });
});

// ============================================
// buildRecurringAdvertiserRow (Phase 5.4.4)
// ============================================

describe('buildRecurringAdvertiserRow', () => {
  test('returns null on empty scans', () => {
    expect(buildRecurringAdvertiserRow([], 'youtube')).toBeNull();
  });

  test('returns null when no advertiser has scanCount >= 2', () => {
    // Each ad-source appears in exactly one scan.
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: '@advertiser-1', isAd: true },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [
        { handle: '@advertiser-2', isAd: true },
      ]),
    ];
    expect(buildRecurringAdvertiserRow(scans, 'youtube')).toBeNull();
  });

  test('returns null when no ad posts exist (only non-ad creators)', () => {
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: '@foo' },
        { handle: '@foo' },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [{ handle: '@foo' }]),
    ];
    expect(buildRecurringAdvertiserRow(scans, 'youtube')).toBeNull();
  });

  test('returns FactRow with "in both your scans" at 2-of-2 advertiser recurrence', () => {
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: '@google-ads', displayName: 'Google', isAd: true },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [
        { handle: '@google-ads', displayName: 'Google', isAd: true },
      ]),
    ];
    expect(buildRecurringAdvertiserRow(scans, 'youtube')).toEqual({
      variant: 'fact',
      label: 'Recurring advertiser',
      value: 'Google',
      anchor: 'in both your scans',
    });
  });

  test('non-ad recurrence does NOT trigger the row (only ad posts count)', () => {
    // @foo appears as a non-ad creator in both scans — but never as
    // an advertiser. The Recurring advertiser row must NOT fire on
    // this signal; that's Top voice territory.
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: '@foo', isAd: false },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [
        { handle: '@foo', isAd: false },
      ]),
    ];
    expect(buildRecurringAdvertiserRow(scans, 'youtube')).toBeNull();
  });

  test('picks top recurring advertiser by scanCount, then totalPosts tiebreaker', () => {
    // Two ad sources tied at scanCount = 2; @brand-b has more totalPosts.
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: '@brand-a', displayName: 'Brand A', isAd: true },
        { handle: '@brand-b', displayName: 'Brand B', isAd: true },
        { handle: '@brand-b', displayName: 'Brand B', isAd: true },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [
        { handle: '@brand-a', displayName: 'Brand A', isAd: true },
        { handle: '@brand-b', displayName: 'Brand B', isAd: true },
        { handle: '@brand-b', displayName: 'Brand B', isAd: true },
      ]),
    ];
    expect(buildRecurringAdvertiserRow(scans, 'youtube')?.value).toBe('Brand B');
  });

  test('Top voice and Recurring advertiser fire independently when both creators and advertisers recur', () => {
    // @creator recurs as a regular post; @advertiser recurs as an ad.
    // Both rows should fire independently — distinct signals on the
    // same supporting card.
    const scans = [
      makeScan('s0', '2026-05-10T12:00:00Z', [
        { handle: '@creator', displayName: 'Creator', isAd: false },
        { handle: '@advertiser', displayName: 'Advertiser', isAd: true },
      ]),
      makeScan('s1', '2026-05-09T12:00:00Z', [
        { handle: '@creator', displayName: 'Creator', isAd: false },
        { handle: '@advertiser', displayName: 'Advertiser', isAd: true },
      ]),
    ];
    const topVoice = buildTopVoiceRow(scans, 'youtube');
    const recurringAdvertiser = buildRecurringAdvertiserRow(scans, 'youtube');
    expect(topVoice?.value).toBe('Creator');
    expect(recurringAdvertiser?.value).toBe('Advertiser');
  });
});
