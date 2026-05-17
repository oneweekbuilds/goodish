/**
 * Unit tests for the supporting-row builders that aren't covered by
 * the template-level tests in interpretationEngine.test.ts. Phase
 * 5.2.5 adds buildTopVoiceRow + recurrenceAnchor; the other four
 * row builders (Ads / Patterns / Political / Tone) are exercised
 * indirectly through every template's supportingRows assertions.
 */

import type { ScanDetail } from '../../../../hooks/useDashboard';
import {
  buildTopVoiceRow,
  recurrenceAnchor,
} from '../supportingRows';

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
    ad_count: 0,
    ad_percentage: 0,
    suggested_count: 0,
    suggested_percentage: 0,
    raw_data: {
      posts: posts.map((p) => post(p.handle, p.displayName ?? null)),
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
