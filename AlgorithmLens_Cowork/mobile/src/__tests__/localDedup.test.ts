/**
 * Unit tests for localDedup — the deterministic first-pass dedup added in
 * build #47 (audit #20) to compensate for the LLM dedup's imperfect recall
 * on UI-text-drift cases (timestamps, view counts, time-ago strings).
 */

import { localDedup, __test } from '../lib/analysis/localDedup';
import type { GeminiExtractedItem } from '../lib/analysis/analysisPrompts';

// ─── Fixture helper ──────────────────────────────────────

function makeItem(overrides: Partial<GeminiExtractedItem> = {}): GeminiExtractedItem {
  return {
    estimated_position: 1,
    content_type: 'video',
    creator_handle: 'testchannel',
    creator_display_name: 'Test Channel',
    is_ad: false,
    ad_detection_reason: null,
    is_suggested: false,
    suggestion_detection_reason: null,
    post_text: 'A reasonably long video title about something',
    hashtags: [],
    is_partial: false,
    topics: { primary_category: 'Entertainment', secondary_categories: [], freeform_tags: [] },
    political: { is_political: false, stance_or_alignment_guess: null, policy_area: null },
    wellbeing: { wellbeing_relevance: 'NONE', themes: [], potential_risk_flags: [] },
    emotions: { valence: 'NEUTRAL' },
    source_origin: null,
    ai_disclosure: null,
    ...overrides,
  };
}

// ─── Internal normalization helpers ──────────────────────────────────────

describe('localDedup — internal normalizers', () => {
  describe('normalizeHandle', () => {
    test('strips leading @ and lowercases', () => {
      expect(__test.normalizeHandle('@MrBeast')).toBe('mrbeast');
      expect(__test.normalizeHandle('@@MrBeast')).toBe('mrbeast');
      expect(__test.normalizeHandle('  @courtcodeyt  ')).toBe('courtcodeyt');
    });
    test('returns empty string for null / undefined / empty', () => {
      expect(__test.normalizeHandle(null)).toBe('');
      expect(__test.normalizeHandle(undefined)).toBe('');
      expect(__test.normalizeHandle('')).toBe('');
    });
  });

  describe('normalizeText — strips dynamic UI tokens', () => {
    test('strips video-player timestamps', () => {
      expect(__test.normalizeText('Story #47 0:32')).toBe('story #47');
      expect(__test.normalizeText('Tutorial 12:45 watch now')).toBe('tutorial watch now');
      expect(__test.normalizeText('Live show 1:23:45 ongoing')).toBe('live show ongoing');
    });
    test('strips view counts', () => {
      expect(__test.normalizeText('Cool video 1.2M views')).toBe('cool video');
      expect(__test.normalizeText('My short 4K views')).toBe('my short');
      expect(__test.normalizeText('Stream 1,234 views')).toBe('stream');
      expect(__test.normalizeText('Clip 12 views ago')).toBe('clip ago');
    });
    test('strips time-ago durations', () => {
      expect(__test.normalizeText('Title 5 minutes ago')).toBe('title');
      expect(__test.normalizeText('Title 1 hour ago caption')).toBe('title caption');
      expect(__test.normalizeText('Title 2 days ago')).toBe('title');
      expect(__test.normalizeText('Title 3 weeks ago')).toBe('title');
    });
    test('does not match unrelated tokens', () => {
      // "preview" should not match the views regex
      expect(__test.normalizeText('preview of upcoming show')).toBe('preview of upcoming show');
      // "view" without leading digits should not match
      expect(__test.normalizeText('great view from the top')).toBe('great view from the top');
    });
    test('handles null/undefined/empty', () => {
      expect(__test.normalizeText(null)).toBe('');
      expect(__test.normalizeText(undefined)).toBe('');
      expect(__test.normalizeText('')).toBe('');
    });
  });

  describe('buildDedupKey — three modes', () => {
    test('handle present → handlePlusText with sliced text', () => {
      const result = __test.buildDedupKey('mrbeast', 'short title', 0);
      expect(result.kind).toBe('handlePlusText');
      expect(result.key).toContain('H:mrbeast');
      expect(result.key).toContain('T:short title');
    });
    test('no handle, long text → noHandleLongText with full text', () => {
      const longText = 'a'.repeat(50);
      const result = __test.buildDedupKey('', longText, 5);
      expect(result.kind).toBe('noHandleLongText');
      expect(result.key).toContain(longText);
    });
    test('no handle, short text → uniqueShortText keyed by index', () => {
      const result1 = __test.buildDedupKey('', 'short', 3);
      const result2 = __test.buildDedupKey('', 'short', 7);
      expect(result1.kind).toBe('uniqueShortText');
      expect(result2.kind).toBe('uniqueShortText');
      expect(result1.key).not.toBe(result2.key);
    });
  });
});

// ─── localDedup behavioral tests ──────────────────────────────────────

describe('localDedup — behavioral', () => {
  test('empty input → empty output', () => {
    const result = localDedup([]);
    expect(result.items).toEqual([]);
    expect(result.stats.inputCount).toBe(0);
    expect(result.stats.outputCount).toBe(0);
    expect(result.stats.mergedCount).toBe(0);
  });

  test('10 copies of the same video (same handle, same title) → 1 item', () => {
    const items = Array.from({ length: 10 }, () =>
      makeItem({
        creator_handle: 'resurgestories',
        post_text: 'The Long Forgotten Tale of Saturday',
      }),
    );
    const result = localDedup(items);
    expect(result.items).toHaveLength(1);
    expect(result.stats.inputCount).toBe(10);
    expect(result.stats.outputCount).toBe(1);
    expect(result.stats.mergedCount).toBe(9);
    expect(result.stats.keyBreakdown.handlePlusText).toBe(1);
  });

  test('10 copies of same video with shifting timestamps → 1 item', () => {
    // Same video, but each frame has a different player-timestamp suffix.
    // The normalizer strips timestamps, so they all collapse.
    const items = [
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 0:00' }),
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 0:32' }),
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 1:23' }),
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 2:15' }),
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 3:01' }),
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 4:48' }),
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 5:30' }),
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 6:12' }),
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 7:00' }),
      makeItem({ creator_handle: 'resurgestories', post_text: 'Story #47 8:25' }),
    ];
    const result = localDedup(items);
    expect(result.items).toHaveLength(1);
    expect(result.stats.mergedCount).toBe(9);
  });

  test('shifting view counts and time-ago strings also merge', () => {
    const items = [
      makeItem({ creator_handle: 'mrbeast', post_text: 'Last to leave wins 1M views 2 days ago' }),
      makeItem({ creator_handle: 'mrbeast', post_text: 'Last to leave wins 1.2M views 3 days ago' }),
      makeItem({ creator_handle: 'mrbeast', post_text: 'Last to leave wins 1.5M views 4 days ago' }),
    ];
    const result = localDedup(items);
    expect(result.items).toHaveLength(1);
    expect(result.stats.mergedCount).toBe(2);
  });

  test('10 different videos from same creator → 10 items', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem({
        creator_handle: 'resurgestories',
        post_text: `Story Episode Number ${i} Different Plotline Each One`,
      }),
    );
    const result = localDedup(items);
    expect(result.items).toHaveLength(10);
    expect(result.stats.mergedCount).toBe(0);
    expect(result.stats.keyBreakdown.handlePlusText).toBe(10);
  });

  test('10 items with null handle and unique long titles → 10 items', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem({
        creator_handle: null,
        post_text: `An entirely distinct sidebar recommendation thumbnail title number ${i} for testing`,
      }),
    );
    const result = localDedup(items);
    expect(result.items).toHaveLength(10);
    expect(result.stats.mergedCount).toBe(0);
    expect(result.stats.keyBreakdown.noHandleLongText).toBe(10);
  });

  test('10 items with null handle and identical short titles → 10 items (over-merge protection)', () => {
    // Without protection, all 10 would collapse into one. With protection,
    // the key includes the array index so each item gets its own bucket.
    const items = Array.from({ length: 10 }, () =>
      makeItem({
        creator_handle: null,
        post_text: 'Watch later',
      }),
    );
    const result = localDedup(items);
    expect(result.items).toHaveLength(10);
    expect(result.stats.mergedCount).toBe(0);
    expect(result.stats.keyBreakdown.uniqueShortText).toBe(10);
  });

  test('preserves first-occurrence order', () => {
    // Three distinct items in order [A, B, C], plus a duplicate of A at the
    // end. Expect output [A, B, C] in that order, not [B, C, A].
    const a = makeItem({ creator_handle: 'alpha', post_text: 'first creator first video' });
    const b = makeItem({ creator_handle: 'bravo', post_text: 'second creator second video' });
    const c = makeItem({ creator_handle: 'charlie', post_text: 'third creator third video' });
    const aDup = makeItem({ creator_handle: 'alpha', post_text: 'first creator first video' });

    const result = localDedup([a, b, c, aDup]);
    expect(result.items).toHaveLength(3);
    expect(result.items[0]?.creator_handle).toBe('alpha');
    expect(result.items[1]?.creator_handle).toBe('bravo');
    expect(result.items[2]?.creator_handle).toBe('charlie');
  });

  test('handle case and @-prefix variations all collapse to the same bucket', () => {
    const items = [
      makeItem({ creator_handle: '@MrBeast', post_text: 'I gave away my entire factory' }),
      makeItem({ creator_handle: 'mrbeast', post_text: 'I gave away my entire factory' }),
      makeItem({ creator_handle: '  MrBeast ', post_text: 'I gave away my entire factory' }),
    ];
    const result = localDedup(items);
    expect(result.items).toHaveLength(1);
  });

  test('different creators with the same text are kept separate', () => {
    const items = [
      makeItem({ creator_handle: 'channel_a', post_text: 'Common phrase that everyone uses' }),
      makeItem({ creator_handle: 'channel_b', post_text: 'Common phrase that everyone uses' }),
    ];
    const result = localDedup(items);
    expect(result.items).toHaveLength(2);
  });

  test('stats output count equals returned array length', () => {
    const items = [
      makeItem({ creator_handle: 'a', post_text: 'Long enough text to dedup on AAA' }),
      makeItem({ creator_handle: 'a', post_text: 'Long enough text to dedup on AAA' }),
      makeItem({ creator_handle: 'b', post_text: 'Long enough text to dedup on BBB' }),
    ];
    const result = localDedup(items);
    expect(result.stats.outputCount).toBe(result.items.length);
    expect(result.stats.outputCount).toBe(2);
  });
});
