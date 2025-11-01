/**
 * Parsing Tests - Verify platform-specific parsers work correctly
 *
 * To run these tests:
 * 1. Install vitest: pnpm add -D vitest
 * 2. Add script to package.json: "test": "vitest"
 * 3. Run: pnpm test
 */

import { describe, it, expect } from 'vitest';
import { parseTikTokJSON } from '../lib/platforms/tiktok';
import { parseInstagramJSON } from '../lib/platforms/instagram';
import { parseYouTubeWatchHistory } from '../lib/platforms/youtube';
import { parseXArchiveJS } from '../lib/platforms/x_twitter';
import { parseFacebookJSON } from '../lib/platforms/facebook';
import { parseRedditJSON } from '../lib/platforms/reddit';
import { classify } from '../lib/classify';
import { echoScoreFromShares } from '../lib/summarize';

describe('TikTok Parser', () => {
  it('should parse TikTok JSON with Activity structure', () => {
    const sample = JSON.stringify({
      Activity: {
        "Video Browsing History": [
          { Date: "2025-01-15T09:00:00Z", Link: "https://tiktok.com/@user/video/1111", Title: "Test video" }
        ]
      }
    });
    const result = parseTikTokJSON(sample);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe('tiktok');
    expect(result[0].contentId).toBe('1111');
  });
});

describe('Instagram Parser', () => {
  it('should parse Instagram JSON array', () => {
    const sample = JSON.stringify([
      { timestamp: "2025-01-15T14:30:00.000Z", permalink: "https://instagram.com/p/abc123", caption: "Test post" }
    ]);
    const result = parseInstagramJSON(sample);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe('instagram');
    expect(result[0].text).toBe('Test post');
  });
});

describe('YouTube Parser', () => {
  it('should parse YouTube watch history', () => {
    const sample = JSON.stringify([
      { time: "2025-01-15T10:30:00Z", title: "Test Video", titleUrl: "https://www.youtube.com/watch?v=abc123", subtitles: [{ name: "Channel Name" }] }
    ]);
    const result = parseYouTubeWatchHistory(sample);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe('youtube');
    expect(result[0].contentId).toBe('abc123');
    expect(result[0].creatorId).toBe('Channel Name');
  });
});

describe('X (Twitter) Parser', () => {
  it('should parse X/Twitter archive JS', () => {
    const sample = `window.YTD.tweets.part0 = [{ "tweet": { "created_at": "2025-01-15T12:00:00.000Z", "id": "123", "full_text": "Test tweet" }}];`;
    const result = parseXArchiveJS(sample);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe('x');
    expect(result[0].text).toBe('Test tweet');
  });
});

describe('Facebook Parser', () => {
  it('should parse Facebook videos_watched', () => {
    const sample = JSON.stringify({ videos_watched: [{ timestamp: 1736942400, title: "Test video", url: "https://facebook.com/watch/123" }] });
    const result = parseFacebookJSON(sample);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe('facebook');
  });
});

describe('Reddit Parser', () => {
  it('should parse Reddit posts array', () => {
    const sample = JSON.stringify({ posts: [{ id: "abc123", created_utc: 1736942400, title: "Test post", selftext: "Content", subreddit: "r/test", author: "user" }] });
    const result = parseRedditJSON(sample);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe('reddit');
    expect(result[0].creatorId).toBe('user');
  });
});

describe('Classification', () => {
  it('should detect topics from text', () => {
    const items = [{ id: "1", platform: "x" as const, timestamp: Date.now(), contentId: "1", text: "Great workout at the gym today!", topics: [] }];
    const result = classify(items);
    expect(result[0].topics).toContain('fitness');
  });

  it('should detect positive sentiment', () => {
    const items = [{ id: "1", platform: "x" as const, timestamp: Date.now(), contentId: "1", text: "This is amazing and awesome!", topics: [] }];
    const result = classify(items);
    expect(result[0].sentiment).toBe('pos');
  });

  it('should detect negative sentiment', () => {
    const items = [{ id: "1", platform: "x" as const, timestamp: Date.now(), contentId: "1", text: "This is terrible and awful!", topics: [] }];
    const result = classify(items);
    expect(result[0].sentiment).toBe('neg');
  });

  it('should flag ads', () => {
    const items = [{ id: "1", platform: "x" as const, timestamp: Date.now(), contentId: "1", text: "Check this out! Use code SAVE20 #ad", topics: [] }];
    const result = classify(items);
    expect(result[0].isAd).toBe(true);
  });
});

describe('Summarization', () => {
  it('should calculate echo score (0-100)', () => {
    const shares = [{ topic: "fitness", pct: 50, n: 50 }, { topic: "tech", pct: 50, n: 50 }];
    const score = echoScoreFromShares(shares);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should return high echo score for concentrated topics', () => {
    const shares = [{ topic: "fitness", pct: 100, n: 100 }];
    const score = echoScoreFromShares(shares);
    expect(score).toBe(100); // Maximum concentration
  });
});
