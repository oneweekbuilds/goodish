/**
 * Tests for src/desktop_mapper.js — UnifiedScanResult schema mapping.
 *
 * Covers: empty input, single post mapping, ad detection, suggested vs followed,
 * topic classification, aggregates computation, privacy defaults, schema shape.
 */
import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../src/shared/debug.js', () => ({
  CAPTURE_DEBUG: false,
  debugLog: jest.fn(),
}));

jest.unstable_mockModule('../src/shared/generate-scan-id.js', () => ({
  generateScanId: jest.fn(() => 'test-scan-id-123'),
}));

const { mapDesktopPostsToUnifiedResult } = await import('../src/desktop_mapper.js');

// ─── Helpers ──────────────────────────────────────

function makePost(overrides = {}) {
  return {
    id: 'post-001',
    platform: 'instagram',
    creator: 'testuser',
    caption: 'Hello world! This is a test post about life.',
    hashtags: ['#test', '#hello'],
    isSponsored: false,
    sourceType: 'followed',
    mediaType: 'POST',
    link: null,
    ctaText: null,
    engagement: null,
    sponsoredEvidence: null,
    isAlgorithmic: false,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────

describe('mapDesktopPostsToUnifiedResult', () => {
  describe('empty/missing input', () => {
    test('handles empty posts array', () => {
      const result = mapDesktopPostsToUnifiedResult([], 'instagram');
      expect(result.feed_items).toEqual([]);
      expect(result.aggregates.total_feed_items).toBe(0);
      expect(result.aggregates.total_ads).toBe(0);
      expect(result.aggregates.ad_percentage).toBe(0);
    });

    test('handles no arguments', () => {
      const result = mapDesktopPostsToUnifiedResult();
      expect(result.feed_items).toEqual([]);
      expect(result.scan_metadata.platform).toBe('UNKNOWN');
    });

    test('handles non-array posts input', () => {
      const result = mapDesktopPostsToUnifiedResult('not an array', 'twitter');
      expect(result.feed_items).toEqual([]);
    });

    test('handles null posts', () => {
      const result = mapDesktopPostsToUnifiedResult(null, 'twitter');
      expect(result.feed_items).toEqual([]);
    });
  });

  describe('schema shape', () => {
    test('returns all required top-level keys', () => {
      const result = mapDesktopPostsToUnifiedResult([makePost()], 'instagram');
      expect(result.schema_version).toBe('1.0.0');
      expect(result.scan_metadata).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.feed_items).toBeDefined();
      expect(result.aggregates).toBeDefined();
      expect(result.privacy).toBeDefined();
      expect(result.debug).toBeDefined();
    });

    test('scan_metadata has correct source_type', () => {
      const result = mapDesktopPostsToUnifiedResult([], 'instagram');
      expect(result.scan_metadata.source_type).toBe('DESKTOP_EXTENSION');
    });

    test('platform is uppercased', () => {
      const result = mapDesktopPostsToUnifiedResult([], 'instagram');
      expect(result.scan_metadata.platform).toBe('INSTAGRAM');
    });

    test('uses provided scanId from options', () => {
      const result = mapDesktopPostsToUnifiedResult([], 'twitter', { scanId: 'my-custom-id' });
      expect(result.scan_metadata.scan_id).toBe('my-custom-id');
    });

    test('uses provided createdAt from options', () => {
      const ts = '2026-01-01T00:00:00Z';
      const result = mapDesktopPostsToUnifiedResult([], 'twitter', { createdAt: ts });
      expect(result.scan_metadata.created_at).toBe(ts);
    });

    test('environment device_type is DESKTOP', () => {
      const result = mapDesktopPostsToUnifiedResult([], 'instagram');
      expect(result.environment.device_type).toBe('DESKTOP');
    });

    test('privacy defaults are correct', () => {
      const result = mapDesktopPostsToUnifiedResult([], 'instagram');
      expect(result.privacy.user_identifiers_stored).toBe(false);
      expect(result.privacy.profile_photos_stored).toBe(false);
      expect(result.privacy.raw_text_stored).toBe(true);
      expect(result.privacy.retention_policy_key).toBe('SHORT');
    });
  });

  describe('single post mapping', () => {
    test('maps post to feed_item with correct structure', () => {
      const result = mapDesktopPostsToUnifiedResult([makePost()], 'instagram');
      expect(result.feed_items).toHaveLength(1);
      const item = result.feed_items[0];
      expect(item.position_in_feed).toBe(1);
      expect(item.content_type).toBe('POST');
      expect(item.is_ad).toBe(false);
      expect(item.account.account_handle).toBe('testuser');
    });

    test('maps caption to content_text', () => {
      const result = mapDesktopPostsToUnifiedResult([makePost()], 'instagram');
      const item = result.feed_items[0];
      expect(item.content_text.captions).toContain('Hello world! This is a test post about life.');
      expect(item.content_text.hashtags).toEqual(['#test', '#hello']);
    });

    test('maps position_in_feed sequentially', () => {
      const posts = [makePost({ id: '1' }), makePost({ id: '2' }), makePost({ id: '3' })];
      const result = mapDesktopPostsToUnifiedResult(posts, 'instagram');
      expect(result.feed_items[0].position_in_feed).toBe(1);
      expect(result.feed_items[1].position_in_feed).toBe(2);
      expect(result.feed_items[2].position_in_feed).toBe(3);
    });
  });

  describe('ad detection', () => {
    test('maps sponsored post to ad', () => {
      const post = makePost({ isSponsored: true, creator: 'BrandName' });
      const result = mapDesktopPostsToUnifiedResult([post], 'instagram');
      const item = result.feed_items[0];
      expect(item.is_ad).toBe(true);
      expect(item.ad_metadata).toBeDefined();
      expect(item.ad_metadata.ad_detected_reason).toBe('sponsored_label');
    });

    test('non-sponsored post has null ad_metadata', () => {
      const result = mapDesktopPostsToUnifiedResult([makePost()], 'instagram');
      expect(result.feed_items[0].ad_metadata).toBeNull();
    });

    test('aggregates count ads correctly', () => {
      const posts = [
        makePost({ isSponsored: true }),
        makePost({ isSponsored: false }),
        makePost({ isSponsored: true }),
      ];
      const result = mapDesktopPostsToUnifiedResult(posts, 'instagram');
      expect(result.aggregates.total_ads).toBe(2);
      expect(result.aggregates.ad_percentage).toBeCloseTo(2 / 3, 5);
    });
  });

  describe('suggested vs followed', () => {
    test('counts suggested and followed posts', () => {
      const posts = [
        makePost({ sourceType: 'suggested' }),
        makePost({ sourceType: 'followed' }),
        makePost({ sourceType: 'followed' }),
        makePost({ sourceType: 'ad' }),
      ];
      const result = mapDesktopPostsToUnifiedResult(posts, 'twitter');
      const svf = result.aggregates.suggested_vs_followed;
      expect(svf.suggested_count).toBe(1);
      expect(svf.followed_count).toBe(2);
      expect(svf.ad_count).toBe(1);
      expect(svf.suggested_percentage).toBeCloseTo(0.25, 5);
      expect(svf.followed_percentage).toBeCloseTo(0.5, 5);
    });

    test('handles all unknown source types', () => {
      const posts = [makePost({ sourceType: 'unknown' }), makePost({ sourceType: undefined })];
      const result = mapDesktopPostsToUnifiedResult(posts, 'twitter');
      expect(result.aggregates.suggested_vs_followed.unknown_count).toBe(2);
    });
  });

  describe('topic classification', () => {
    test('classifies topics into categories', () => {
      const result = mapDesktopPostsToUnifiedResult([makePost()], 'instagram');
      const topics = result.aggregates.topic_distribution;
      expect(topics.length).toBeGreaterThan(0);
      expect(topics[0].category).toBeTruthy();
      expect(topics[0].count).toBe(1);
    });

    test('topic distribution sums to 100% of posts', () => {
      const posts = Array.from({ length: 5 }, (_, i) => makePost({ id: `p${i}` }));
      const result = mapDesktopPostsToUnifiedResult(posts, 'instagram');
      const totalCount = result.aggregates.topic_distribution.reduce((sum, t) => sum + t.count, 0);
      expect(totalCount).toBe(5);
    });
  });

  describe('engagement aggregation', () => {
    test('sums engagement across posts', () => {
      const posts = [
        makePost({ engagement: { likes: 100, comments: 10, shares: 5, views: 1000 } }),
        makePost({ engagement: { likes: 200, comments: 20, shares: 10, views: 2000 } }),
      ];
      const result = mapDesktopPostsToUnifiedResult(posts, 'instagram');
      expect(result.aggregates.engagement_summary.total_likes).toBe(300);
      expect(result.aggregates.engagement_summary.total_comments).toBe(30);
      expect(result.aggregates.engagement_summary.total_shares).toBe(15);
      expect(result.aggregates.engagement_summary.total_views).toBe(3000);
    });

    test('handles posts with no engagement', () => {
      const result = mapDesktopPostsToUnifiedResult([makePost()], 'instagram');
      expect(result.aggregates.engagement_summary.total_likes).toBe(0);
    });
  });

  describe('_computed insights', () => {
    test('computes unique creators', () => {
      const posts = [
        makePost({ creator: 'alice' }),
        makePost({ creator: 'bob' }),
        makePost({ creator: 'alice' }),
      ];
      const result = mapDesktopPostsToUnifiedResult(posts, 'instagram');
      expect(result._computed.uniqueCreators).toEqual(['alice', 'bob']);
    });

    test('computes suggested/followed percentages', () => {
      const posts = [
        makePost({ sourceType: 'suggested' }),
        makePost({ sourceType: 'followed' }),
        makePost({ sourceType: 'followed' }),
        makePost({ sourceType: 'followed' }),
      ];
      const result = mapDesktopPostsToUnifiedResult(posts, 'instagram');
      expect(result._computed.suggestedPercent).toBe(25);
      expect(result._computed.followedPercent).toBe(75);
    });
  });

  describe('political/wellbeing fields are NOT_ANALYZED', () => {
    test('political fields are null (not analyzed)', () => {
      const result = mapDesktopPostsToUnifiedResult([makePost()], 'instagram');
      expect(result.feed_items[0].political.is_political).toBeNull();
      expect(result.aggregates.political_content_summary.political_items).toBeNull();
    });

    test('wellbeing fields are NOT_ANALYZED', () => {
      const result = mapDesktopPostsToUnifiedResult([makePost()], 'instagram');
      expect(result.feed_items[0].wellbeing.wellbeing_relevance).toBe('NOT_ANALYZED');
      expect(result.feed_items[0].wellbeing.valence).toBeNull();
    });
  });

  describe('YouTube defaults', () => {
    test('defaults content_type to VIDEO for YouTube', () => {
      const post = makePost({ mediaType: undefined });
      delete post.mediaType;
      const result = mapDesktopPostsToUnifiedResult([post], 'youtube');
      expect(result.feed_items[0].content_type).toBe('VIDEO');
    });
  });
});
