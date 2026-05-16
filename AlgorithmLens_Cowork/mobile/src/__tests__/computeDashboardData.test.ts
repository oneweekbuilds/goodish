/**
 * Exhaustive tests for computeDashboardData.ts
 * — The single source of truth for mobile dashboard metrics.
 */
import { computeDashboardData, ScanRecord, DashboardData } from '../lib/computeDashboardData';

// ─── Helpers ────────────────────────────────────────

function makePost(overrides: Partial<{
  creator_handle: string | null;
  creator_display_name: string | null;
  post_text: string;
  is_ad: boolean;
  is_suggested: boolean;
  content_type: string;
  hashtags: string[];
  position_in_feed: number;
  ad_label_text: string | null;
}> = {}) {
  const result = {
    creator_handle: 'user1' as string | null,
    creator_display_name: 'User One' as string | null,
    post_text: 'Hello world',
    is_ad: false,
    is_suggested: false,
    content_type: 'photo',
    hashtags: [] as string[],
    position_in_feed: 0,
    ad_label_text: null as string | null,
  };
  if ('creator_handle' in overrides) result.creator_handle = overrides.creator_handle!;
  if ('creator_display_name' in overrides) result.creator_display_name = overrides.creator_display_name!;
  if (overrides.post_text !== undefined) result.post_text = overrides.post_text;
  if (overrides.is_ad !== undefined) result.is_ad = overrides.is_ad;
  if (overrides.is_suggested !== undefined) result.is_suggested = overrides.is_suggested;
  if (overrides.content_type !== undefined) result.content_type = overrides.content_type;
  if (overrides.hashtags !== undefined) result.hashtags = overrides.hashtags;
  if (overrides.position_in_feed !== undefined) result.position_in_feed = overrides.position_in_feed;
  if ('ad_label_text' in overrides) result.ad_label_text = overrides.ad_label_text!;
  return result;
}

function makeScan(posts: ReturnType<typeof makePost>[], overrides: Partial<ScanRecord> = {}): ScanRecord {
  return {
    platform: 'instagram',
    raw_data: {
      posts,
      top_creators: [],
      scanned_at: new Date().toISOString(),
      duration_seconds: 60,
    },
    ...overrides,
  };
}

function makeAnalyzedFeedItem(overrides: {
  is_political?: boolean;
  stance?: string;
  valence?: string;
  handle?: string;
} = {}) {
  return {
    political: {
      is_political: overrides.is_political ?? false,
      stance_or_alignment: overrides.stance ?? undefined,
    },
    emotions: {
      valence: overrides.valence ?? 'NEUTRAL',
    },
    creator: {
      handle: overrides.handle ?? 'user1',
    },
  };
}

// ─── SECTION 1: Empty & Edge Cases ──────────────────

describe('computeDashboardData', () => {
  describe('empty and minimal inputs', () => {
    test('null scan returns safe defaults', () => {
      const result = computeDashboardData(null as unknown as ScanRecord);
      expect(result.totalPosts).toBe(0);
      expect(result.adCount).toBe(0);
      expect(result.adPct).toBe(0);
      expect(result.suggestedCount).toBe(0);
      expect(result.followedCount).toBe(0);
      expect(result.topCreators).toEqual([]);
      expect(result.contentTypes).toEqual([]);
      expect(result.hasData).toBe(false);
      expect(result.hasPoliticsData).toBe(false);
      expect(result.hasToneData).toBe(false);
    });

    test('undefined scan returns safe defaults', () => {
      const result = computeDashboardData(undefined as unknown as ScanRecord);
      expect(result.totalPosts).toBe(0);
      expect(result.hasData).toBe(false);
    });

    test('empty object scan returns safe defaults', () => {
      const result = computeDashboardData({});
      expect(result.totalPosts).toBe(0);
      expect(result.hasData).toBe(false);
      expect(result.topCreators).toEqual([]);
    });

    test('scan with no raw_data but has top-level counts uses fallback', () => {
      const result = computeDashboardData({
        post_count: 50,
        ad_count: 10,
        ad_percentage: 20,
        suggested_count: 30,
        suggested_percentage: 60,
        platform: 'twitter',
      });
      expect(result.totalPosts).toBe(50);
      expect(result.adCount).toBe(10);
      expect(result.adPct).toBe(20);
      expect(result.suggestedCount).toBe(30);
      expect(result.followedCount).toBe(20);
      expect(result.suggestedPct).toBe(60);
      expect(result.followedPct).toBe(40);
      expect(result.hasData).toBe(true);
    });

    test('scan with empty posts array uses fallback to top-level counts', () => {
      const result = computeDashboardData({
        post_count: 20,
        ad_count: 5,
        ad_percentage: 25,
        raw_data: { posts: [] },
        platform: 'youtube',
      });
      expect(result.totalPosts).toBe(20);
      expect(result.adCount).toBe(5);
      expect(result.hasData).toBe(true);
    });

    test('zero posts returns zero percentages without division errors', () => {
      const result = computeDashboardData({ raw_data: { posts: [] } });
      expect(result.adPct).toBe(0);
      expect(result.suggestedPct).toBe(0);
      expect(result.followedPct).toBe(100);
      expect(result.top5Pct).toBe(0);
      expect(Number.isFinite(result.adPct)).toBe(true);
      expect(Number.isFinite(result.suggestedPct)).toBe(true);
    });
  });

  // ─── SECTION 2: Single Scan with Complete Data ───

  describe('single scan with complete data', () => {
    test('computes all core metrics correctly', () => {
      const posts = [
        makePost({ creator_handle: 'alice', is_ad: true, is_suggested: true, content_type: 'photo' }),
        makePost({ creator_handle: 'bob', is_ad: false, is_suggested: false, content_type: 'video' }),
        makePost({ creator_handle: 'alice', is_ad: false, is_suggested: true, content_type: 'reel' }),
        makePost({ creator_handle: 'charlie', is_ad: true, is_suggested: false, content_type: 'photo' }),
        makePost({ creator_handle: 'alice', is_ad: false, is_suggested: true, content_type: 'photo' }),
      ];
      const result = computeDashboardData(makeScan(posts));

      expect(result.totalPosts).toBe(5);
      expect(result.adCount).toBe(2);
      expect(result.adPct).toBe(40);
      expect(result.suggestedCount).toBe(3);
      expect(result.followedCount).toBe(2);
      expect(result.suggestedPct).toBe(60);
      expect(result.followedPct).toBe(40);
      expect(result.hasData).toBe(true);
    });

    test('top creators sorted by frequency', () => {
      const posts = [
        makePost({ creator_handle: 'alice' }),
        makePost({ creator_handle: 'alice' }),
        makePost({ creator_handle: 'alice' }),
        makePost({ creator_handle: 'bob' }),
        makePost({ creator_handle: 'bob' }),
        makePost({ creator_handle: 'charlie' }),
      ];
      const result = computeDashboardData(makeScan(posts));

      expect(result.topCreators[0]?.name).toBe('alice');
      expect(result.topCreators[0]?.count).toBe(3);
      expect(result.topCreators[0]?.percentage).toBe(50);
      expect(result.topCreators[1]?.name).toBe('bob');
      expect(result.topCreators[1]?.count).toBe(2);
      expect(result.topCreators[2]?.name).toBe('charlie');
    });

    test('top5Pct computed correctly', () => {
      // 10 posts: 5 from alice, 2 from bob, 1 each from charlie, dave, eve
      const posts = [
        ...Array(5).fill(null).map(() => makePost({ creator_handle: 'alice' })),
        ...Array(2).fill(null).map(() => makePost({ creator_handle: 'bob' })),
        makePost({ creator_handle: 'charlie' }),
        makePost({ creator_handle: 'dave' }),
        makePost({ creator_handle: 'eve' }),
      ];
      const result = computeDashboardData(makeScan(posts));
      // top 5 = alice(5) + bob(2) + charlie(1) + dave(1) + eve(1) = 10/10 = 100%
      expect(result.top5Pct).toBe(100);
    });

    test('content types computed with sorted percentages', () => {
      const posts = [
        makePost({ content_type: 'photo' }),
        makePost({ content_type: 'photo' }),
        makePost({ content_type: 'video' }),
        makePost({ content_type: 'reel' }),
      ];
      const result = computeDashboardData(makeScan(posts));

      expect(result.contentTypes[0]?.label).toBe('Photo');
      expect(result.contentTypes[0]?.count).toBe(2);
      expect(result.contentTypes[0]?.percentage).toBe(50);
      expect(result.contentTypes.length).toBe(3);
    });

    test('content type percentages sum to 100', () => {
      // 3 posts: 33.3% each without rounding correction
      const posts = [
        makePost({ content_type: 'photo' }),
        makePost({ content_type: 'video' }),
        makePost({ content_type: 'reel' }),
      ];
      const result = computeDashboardData(makeScan(posts));
      const sum = result.contentTypes.reduce((s, ct) => s + ct.percentage, 0);
      expect(sum).toBe(100);
    });

    test('platform name capitalized in insights', () => {
      const result = computeDashboardData(makeScan([makePost()], { platform: 'twitter' }));
      expect(result.overviewInsight.meta).toContain('Twitter');
    });
  });

  // ─── SECTION 3: Insight Builders ──────────────────

  describe('overview insight', () => {
    test('fewer than 10 posts returns "not enough data"', () => {
      const posts = Array(5).fill(null).map(() => makePost());
      const result = computeDashboardData(makeScan(posts));
      expect(result.overviewInsight.title).toContain('Not enough data');
    });

    test('top5Pct >= 60 returns concentrated message', () => {
      // 10 posts all from one creator → top5Pct = 100
      const posts = Array(10).fill(null).map(() => makePost({ creator_handle: 'mega' }));
      const result = computeDashboardData(makeScan(posts));
      expect(result.overviewInsight.title).toContain('just 5 accounts');
    });

    test('top5Pct 40-59 returns moderate message', () => {
      // 20 posts: 10 from one, 1 each from 10 others → top5 = (10+1+1+1+1)/20 = 70% - too high
      // Need: 20 posts, 5 from top, rest spread = 5/20 = 25% - too low
      // Targeting 50%: 10 posts, top5 = 5 posts
      const posts = [
        ...Array(3).fill(null).map(() => makePost({ creator_handle: 'a' })),
        makePost({ creator_handle: 'b' }),
        makePost({ creator_handle: 'c' }),
        ...Array(5).fill(null).map((_, i) => makePost({ creator_handle: `other${i}` })),
      ];
      const result = computeDashboardData(makeScan(posts));
      // top5: a(3)+b(1)+c(1)+other0(1)+other1(1) = 7/10 = 70% - still too high
      // Need more unique creators to dilute
      const posts2 = Array(20).fill(null).map((_, i) =>
        makePost({ creator_handle: i < 4 ? 'topA' : `unique${i}` })
      );
      const result2 = computeDashboardData(makeScan(posts2));
      // top5: topA(4) + unique4(1) + unique5(1) + unique6(1) + unique7(1) = 8/20 = 40%
      expect(result2.overviewInsight.title).toContain('top 5 sources');
    });

    test('top5Pct < 40 returns diverse message', () => {
      const posts = Array(20).fill(null).map((_, i) =>
        makePost({ creator_handle: `creator${i}` })
      );
      const result = computeDashboardData(makeScan(posts));
      // All unique: top5 = 5/20 = 25%
      expect(result.overviewInsight.title).toContain('many voices');
    });
  });

  describe('ads insight', () => {
    test('adPct >= 40 returns high ad message', () => {
      const posts = [
        ...Array(5).fill(null).map(() => makePost({ is_ad: true })),
        ...Array(5).fill(null).map(() => makePost({ is_ad: false })),
      ];
      const result = computeDashboardData(makeScan(posts));
      // Build #53 copy update: high-ad branch title now reads
      // "X% of your feed was ads" (previously "...commercial content").
      expect(result.adsInsight.title).toContain('of your feed was ads');
    });

    test('adPct 20-39 returns "1 in X" message', () => {
      const posts = [
        ...Array(3).fill(null).map(() => makePost({ is_ad: true })),
        ...Array(12).fill(null).map(() => makePost({ is_ad: false })),
      ];
      const result = computeDashboardData(makeScan(posts));
      expect(result.adsInsight.title).toContain('1 in');
    });

    test('adPct 5-19 returns moderate message', () => {
      const posts = [
        makePost({ is_ad: true }),
        ...Array(9).fill(null).map(() => makePost({ is_ad: false })),
      ];
      const result = computeDashboardData(makeScan(posts));
      expect(result.adsInsight.title).toContain('contained ads');
    });

    test('adPct < 5 returns minimal message', () => {
      const posts = [
        makePost({ is_ad: true }),
        ...Array(99).fill(null).map(() => makePost({ is_ad: false })),
      ];
      const result = computeDashboardData(makeScan(posts));
      expect(result.adsInsight.title).toContain('minimal');
    });
  });

  describe('suggested insight', () => {
    test('suggestedPct >= 80 returns high suggested message', () => {
      const posts = [
        ...Array(9).fill(null).map(() => makePost({ is_suggested: true })),
        makePost({ is_suggested: false }),
      ];
      const result = computeDashboardData(makeScan(posts));
      expect(result.suggestedInsight.title).toContain("don't follow");
    });

    test('suggestedPct 50-79 returns majority suggested message', () => {
      const posts = [
        ...Array(6).fill(null).map(() => makePost({ is_suggested: true })),
        ...Array(4).fill(null).map(() => makePost({ is_suggested: false })),
      ];
      const result = computeDashboardData(makeScan(posts));
      expect(result.suggestedInsight.title).toContain('More than half');
    });

    test('suggestedPct < 20 returns mostly followed message', () => {
      const posts = [
        makePost({ is_suggested: true }),
        ...Array(9).fill(null).map(() => makePost({ is_suggested: false })),
      ];
      const result = computeDashboardData(makeScan(posts));
      expect(result.suggestedInsight.title).toContain('mostly from accounts you follow');
    });
  });

  // ─── SECTION 4: Political Analysis ────────────────

  describe('political analysis extraction', () => {
    test('returns null when no AI analysis', () => {
      const posts = Array(20).fill(null).map(() => makePost());
      const result = computeDashboardData(makeScan(posts));
      expect(result.politicalAnalysis).toBeNull();
      expect(result.hasPoliticsData).toBe(false);
    });

    test('returns null when ai_analyzed is false', () => {
      const result = computeDashboardData(makeScan([], {
        raw_data: {
          posts: Array(10).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: false, feed_items: [] },
        },
      }));
      expect(result.politicalAnalysis).toBeNull();
    });

    test('extracts political counts correctly', () => {
      const feedItems = [
        ...Array(15).fill(null).map(() => makeAnalyzedFeedItem({ is_political: true, stance: 'left' })),
        ...Array(5).fill(null).map(() => makeAnalyzedFeedItem({ is_political: true, stance: 'right' })),
        ...Array(30).fill(null).map(() => makeAnalyzedFeedItem({ is_political: false })),
      ];
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(50).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });

      expect(result.politicalAnalysis).not.toBeNull();
      expect(result.politicalAnalysis!.politicalCount).toBe(20);
      expect(result.politicalAnalysis!.totalAnalyzed).toBe(50);
      expect(result.politicalAnalysis!.politicalPct).toBe(40);
      expect(result.hasPoliticsData).toBe(true);
    });

    test('ideology distribution with >= 10 known stances', () => {
      const feedItems = [
        ...Array(6).fill(null).map(() => makeAnalyzedFeedItem({ is_political: true, stance: 'left' })),
        ...Array(3).fill(null).map(() => makeAnalyzedFeedItem({ is_political: true, stance: 'center' })),
        ...Array(1).fill(null).map(() => makeAnalyzedFeedItem({ is_political: true, stance: 'right' })),
      ];
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(10).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });

      expect(result.politicalAnalysis!.ideology).not.toBeNull();
      expect(result.politicalAnalysis!.ideology!.left).toBe(60);
      expect(result.politicalAnalysis!.ideology!.center).toBe(30);
      expect(result.politicalAnalysis!.ideology!.right).toBe(10);
      // Sum should be exactly 100
      const sum = result.politicalAnalysis!.ideology!.left +
        result.politicalAnalysis!.ideology!.center +
        result.politicalAnalysis!.ideology!.right;
      expect(sum).toBe(100);
    });

    test('ideology null when fewer than 10 known stances', () => {
      const feedItems = [
        ...Array(5).fill(null).map(() => makeAnalyzedFeedItem({ is_political: true, stance: 'left' })),
        ...Array(3).fill(null).map(() => makeAnalyzedFeedItem({ is_political: true, stance: 'right' })),
      ];
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(8).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.politicalAnalysis!.ideology).toBeNull();
    });

    test('topPoliticalSource only when >= 10 political posts', () => {
      const feedItems = Array(9).fill(null).map(() =>
        makeAnalyzedFeedItem({ is_political: true, stance: 'left', handle: 'politician' })
      );
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(9).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.politicalAnalysis!.topPoliticalSource).toBeNull();

      // Now with 10+
      feedItems.push(makeAnalyzedFeedItem({ is_political: true, stance: 'left', handle: 'politician' }));
      const result2 = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(10).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result2.politicalAnalysis!.topPoliticalSource).not.toBeNull();
      expect(result2.politicalAnalysis!.topPoliticalSource!.handle).toBe('politician');
    });

    test('lowSample flag when < 10 political posts', () => {
      const feedItems = Array(9).fill(null).map(() =>
        makeAnalyzedFeedItem({ is_political: true })
      );
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(9).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.politicalAnalysis!.lowSample).toBe(true);
    });
  });

  // ─── SECTION 5: Tone Analysis ─────────────────────

  describe('tone analysis extraction', () => {
    test('returns null when no AI analysis', () => {
      const result = computeDashboardData(makeScan(Array(10).fill(null).map(() => makePost())));
      expect(result.toneAnalysis).toBeNull();
      expect(result.hasToneData).toBe(false);
    });

    test('extracts tone counts correctly', () => {
      const feedItems = [
        ...Array(4).fill(null).map(() => makeAnalyzedFeedItem({ valence: 'POSITIVE' })),
        ...Array(3).fill(null).map(() => makeAnalyzedFeedItem({ valence: 'NEUTRAL' })),
        ...Array(3).fill(null).map(() => makeAnalyzedFeedItem({ valence: 'NEGATIVE' })),
      ];
      const result = computeDashboardData({
        platform: 'instagram',
        raw_data: {
          posts: Array(10).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });

      expect(result.toneAnalysis).not.toBeNull();
      expect(result.toneAnalysis!.positiveCount).toBe(4);
      expect(result.toneAnalysis!.neutralCount).toBe(3);
      expect(result.toneAnalysis!.negativeCount).toBe(3);
      expect(result.toneAnalysis!.positivePct).toBe(40);
      expect(result.hasToneData).toBe(true);
    });

    test('MIXED valence maps to neutral', () => {
      const feedItems = [
        makeAnalyzedFeedItem({ valence: 'MIXED' }),
        makeAnalyzedFeedItem({ valence: 'POSITIVE' }),
      ];
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: [makePost(), makePost()],
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });

      expect(result.toneAnalysis!.neutralCount).toBe(1);
      expect(result.toneAnalysis!.positiveCount).toBe(1);
    });

    test('tone percentages sum to 100', () => {
      const feedItems = Array(7).fill(null).map((_, i) =>
        makeAnalyzedFeedItem({ valence: i < 3 ? 'POSITIVE' : i < 5 ? 'NEUTRAL' : 'NEGATIVE' })
      );
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(7).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });

      const sum = result.toneAnalysis!.positivePct + result.toneAnalysis!.neutralPct + result.toneAnalysis!.negativePct;
      expect(sum).toBe(100);
    });

    test('lowSample flag when < 10 known valence', () => {
      const feedItems = Array(5).fill(null).map(() =>
        makeAnalyzedFeedItem({ valence: 'POSITIVE' })
      );
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(5).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.toneAnalysis!.lowSample).toBe(true);
    });

    test('returns null when all valence unknown', () => {
      const feedItems = Array(10).fill(null).map(() =>
        makeAnalyzedFeedItem({ valence: 'NOT_ANALYZED' })
      );
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(10).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.toneAnalysis).toBeNull();
    });
  });

  // ─── SECTION 6: Tone Insight Edge Cases ───────────

  describe('tone insight edge cases', () => {
    test('balanced tone insight (spread < 15)', () => {
      const feedItems = [
        ...Array(5).fill(null).map(() => makeAnalyzedFeedItem({ valence: 'POSITIVE' })),
        ...Array(5).fill(null).map(() => makeAnalyzedFeedItem({ valence: 'NEUTRAL' })),
        ...Array(5).fill(null).map(() => makeAnalyzedFeedItem({ valence: 'NEGATIVE' })),
      ];
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(15).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.toneInsight.title).toContain('balanced');
    });

    test('high negative tone insight', () => {
      const feedItems = [
        ...Array(7).fill(null).map(() => makeAnalyzedFeedItem({ valence: 'NEGATIVE' })),
        ...Array(3).fill(null).map(() => makeAnalyzedFeedItem({ valence: 'POSITIVE' })),
      ];
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(10).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.toneInsight.title).toContain('negative');
    });

    test('no AI analysis shows consent prompt', () => {
      const result = computeDashboardData(makeScan(Array(20).fill(null).map(() => makePost())));
      expect(result.toneInsight.title).toContain('requires AI');
    });
  });

  // ─── SECTION 7: Politics Insight Paths ────────────

  describe('politics insight paths', () => {
    test('no analysis shows consent prompt', () => {
      const result = computeDashboardData(makeScan(Array(20).fill(null).map(() => makePost())));
      expect(result.politicsInsight.title).toContain('requires AI');
    });

    test('low sample shows cautious message', () => {
      const feedItems = Array(5).fill(null).map(() =>
        makeAnalyzedFeedItem({ is_political: true })
      );
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(5).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.politicsInsight.title).toContain('Limited');
    });

    test('high political (>= 30%) shows strong presence message', () => {
      const feedItems = [
        ...Array(5).fill(null).map(() => makeAnalyzedFeedItem({ is_political: true })),
        ...Array(5).fill(null).map(() => makeAnalyzedFeedItem({ is_political: false })),
      ];
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(10).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.politicsInsight.title).toContain('political content');
    });

    test('moderate political (10-29%) shows "1 in X" message', () => {
      const feedItems = [
        ...Array(15).fill(null).map(() => makeAnalyzedFeedItem({ is_political: true })),
        ...Array(85).fill(null).map(() => makeAnalyzedFeedItem({ is_political: false })),
      ];
      const result = computeDashboardData({
        platform: 'twitter',
        raw_data: {
          posts: Array(100).fill(null).map(() => makePost()),
          analysis: { ai_analyzed: true, feed_items: feedItems },
        },
      });
      expect(result.politicsInsight.title).toContain('1 in');
    });
  });

  // ─── SECTION 8: Edge Cases ────────────────────────

  describe('edge cases', () => {
    test('all posts from one creator', () => {
      const posts = Array(20).fill(null).map(() => makePost({ creator_handle: 'monopoly' }));
      const result = computeDashboardData(makeScan(posts));
      expect(result.topCreators.length).toBe(1);
      expect(result.topCreators[0]?.name).toBe('monopoly');
      expect(result.topCreators[0]?.percentage).toBe(100);
      expect(result.top5Pct).toBe(100);
    });

    test('all posts are ads', () => {
      const posts = Array(15).fill(null).map(() => makePost({ is_ad: true }));
      const result = computeDashboardData(makeScan(posts));
      expect(result.adCount).toBe(15);
      expect(result.adPct).toBe(100);
    });

    test('no posts are ads', () => {
      const posts = Array(15).fill(null).map(() => makePost({ is_ad: false }));
      const result = computeDashboardData(makeScan(posts));
      expect(result.adCount).toBe(0);
      expect(result.adPct).toBe(0);
    });

    test('all posts are suggested', () => {
      const posts = Array(15).fill(null).map(() => makePost({ is_suggested: true }));
      const result = computeDashboardData(makeScan(posts));
      expect(result.suggestedCount).toBe(15);
      expect(result.suggestedPct).toBe(100);
      expect(result.followedCount).toBe(0);
      expect(result.followedPct).toBe(0);
    });

    test('no posts are suggested', () => {
      const posts = Array(15).fill(null).map(() => makePost({ is_suggested: false }));
      const result = computeDashboardData(makeScan(posts));
      expect(result.suggestedCount).toBe(0);
      expect(result.suggestedPct).toBe(0);
      expect(result.followedCount).toBe(15);
      expect(result.followedPct).toBe(100);
    });

    test('null creator_handle defaults to Unknown', () => {
      const posts = [
        makePost({ creator_handle: null }),
        makePost({ creator_handle: null }),
      ];
      const result = computeDashboardData(makeScan(posts));
      expect(result.topCreators[0]?.name).toBe('Unknown');
    });

    test('topCreators limited to 10 entries', () => {
      const posts = Array(20).fill(null).map((_, i) =>
        makePost({ creator_handle: `creator${i}` })
      );
      const result = computeDashboardData(makeScan(posts));
      expect(result.topCreators.length).toBe(10);
    });

    test('missing content_type defaults to unknown', () => {
      const posts = [makePost({ content_type: '' })];
      const result = computeDashboardData(makeScan(posts));
      expect(result.contentTypes[0]?.label).toBe('Unknown');
    });

    test('platform defaults to "your platform" when missing', () => {
      const result = computeDashboardData({ raw_data: { posts: [makePost()] } });
      expect(result.overviewInsight.meta).toContain('Your platform');
    });
  });

  // ─── SECTION 9: DashboardData shape ───────────────

  describe('DashboardData shape completeness', () => {
    test('all fields present in result', () => {
      const posts = Array(20).fill(null).map((_, i) =>
        makePost({
          creator_handle: `user${i % 5}`,
          is_ad: i < 3,
          is_suggested: i < 10,
          content_type: i % 2 === 0 ? 'photo' : 'video',
        })
      );
      const result = computeDashboardData(makeScan(posts));

      // All required fields exist
      expect(typeof result.totalPosts).toBe('number');
      expect(typeof result.adCount).toBe('number');
      expect(typeof result.adPct).toBe('number');
      expect(typeof result.suggestedCount).toBe('number');
      expect(typeof result.followedCount).toBe('number');
      expect(typeof result.suggestedPct).toBe('number');
      expect(typeof result.followedPct).toBe('number');
      expect(Array.isArray(result.topCreators)).toBe(true);
      expect(typeof result.top5Pct).toBe('number');
      expect(Array.isArray(result.contentTypes)).toBe(true);
      expect(typeof result.overviewInsight).toBe('object');
      expect(typeof result.sourcesInsight).toBe('object');
      expect(typeof result.adsInsight).toBe('object');
      expect(typeof result.suggestedInsight).toBe('object');
      expect(typeof result.politicsInsight).toBe('object');
      expect(typeof result.toneInsight).toBe('object');
      expect(typeof result.hasData).toBe('boolean');
      expect(typeof result.hasPoliticsData).toBe('boolean');
      expect(typeof result.hasToneData).toBe('boolean');

      // Insight shape
      expect(typeof result.overviewInsight.title).toBe('string');
      expect(typeof result.overviewInsight.meaning).toBe('string');
      expect(typeof result.overviewInsight.meta).toBe('string');
    });
  });

  // ─── SECTION 10: Large Dataset Performance ────────

  describe('large dataset', () => {
    test('1000+ posts computes without errors', () => {
      const posts = Array(1000).fill(null).map((_, i) =>
        makePost({
          creator_handle: `user${i % 50}`,
          is_ad: i % 7 === 0,
          is_suggested: i % 3 === 0,
          content_type: ['photo', 'video', 'reel', 'text'][i % 4] ?? 'photo',
        })
      );
      const start = Date.now();
      const result = computeDashboardData(makeScan(posts));
      const elapsed = Date.now() - start;

      expect(result.totalPosts).toBe(1000);
      expect(result.hasData).toBe(true);
      expect(result.topCreators.length).toBe(10);
      expect(elapsed).toBeLessThan(500); // Should complete in < 500ms
    });
  });

  // ─── SECTION 11: Epistemic Restraint in Insights ──

  describe('epistemic restraint', () => {
    const BANNED = [
      'manipulate', 'trick', 'targeting you', 'the algorithm wants',
      'designed to', 'tries to', 'pushes you', 'forces you',
    ];

    test('no insight text contains banned phrases', () => {
      const posts = Array(50).fill(null).map((_, i) =>
        makePost({
          creator_handle: `user${i % 5}`,
          is_ad: i < 25,
          is_suggested: i < 40,
        })
      );
      const result = computeDashboardData(makeScan(posts));

      const allText = [
        result.overviewInsight.title,
        result.overviewInsight.meaning,
        result.overviewInsight.whyCare,
        result.sourcesInsight.title,
        result.sourcesInsight.meaning,
        result.sourcesInsight.whyCare,
        result.adsInsight.title,
        result.adsInsight.meaning,
        result.adsInsight.whyCare,
        result.suggestedInsight.title,
        result.suggestedInsight.meaning,
        result.suggestedInsight.whyCare,
        result.politicsInsight.title,
        result.politicsInsight.meaning,
        result.politicsInsight.whyCare,
        result.toneInsight.title,
        result.toneInsight.meaning,
        result.toneInsight.whyCare,
      ].filter(Boolean).join(' ').toLowerCase();

      for (const banned of BANNED) {
        expect(allText).not.toContain(banned);
      }
    });
  });
});
