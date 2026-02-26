/**
 * Tests for src/scanners/utils.js — shared extraction utilities.
 *
 * Covers: hashString, ID extraction for all platforms, extractHashtags,
 * containsAdIndicator, isValidCreator, isValidCaption, parseEngagementCount,
 * generateStableId.
 */
import { jest } from '@jest/globals';

// Mock the debug module before importing utils
jest.unstable_mockModule('../src/shared/debug.js', () => ({
  CAPTURE_DEBUG: false,
  debugLog: jest.fn(),
}));

const {
  hashString,
  extractInstagramPostId,
  extractTwitterStatusId,
  extractTikTokVideoId,
  extractRedditPostId,
  extractYouTubeVideoId,
  extractHashtags,
  containsAdIndicator,
  isValidCreator,
  isValidCaption,
  parseEngagementCount,
  generateStableId,
  safeText,
  safeQuery,
  safeQueryAll,
} = await import('../src/scanners/utils.js');

// ─── hashString ──────────────────────────────────────

describe('hashString', () => {
  test('returns a string', () => {
    expect(typeof hashString('hello')).toBe('string');
  });

  test('returns consistent hash for same input', () => {
    expect(hashString('foo')).toBe(hashString('foo'));
  });

  test('returns different hash for different inputs', () => {
    expect(hashString('foo')).not.toBe(hashString('bar'));
  });

  test('handles empty string', () => {
    expect(hashString('')).toBe('0');
  });
});

// ─── ID Extraction ──────────────────────────────────────

describe('extractInstagramPostId', () => {
  test('extracts from /p/ URL', () => {
    expect(extractInstagramPostId('/p/Abc123_-/')).toBe('Abc123_-');
  });

  test('extracts from /reel/ URL', () => {
    expect(extractInstagramPostId('/reel/XYZ789/')).toBe('XYZ789');
  });

  test('extracts from /tv/ URL', () => {
    expect(extractInstagramPostId('/tv/TestId/')).toBe('TestId');
  });

  test('returns null for invalid URL', () => {
    expect(extractInstagramPostId('/explore/')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(extractInstagramPostId(null)).toBeNull();
  });
});

describe('extractTwitterStatusId', () => {
  test('extracts status ID', () => {
    expect(extractTwitterStatusId('/user/status/1234567890')).toBe('1234567890');
  });

  test('returns null for non-status URL', () => {
    expect(extractTwitterStatusId('/user/likes')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(extractTwitterStatusId(null)).toBeNull();
  });
});

describe('extractTikTokVideoId', () => {
  test('extracts video ID', () => {
    expect(extractTikTokVideoId('/video/7123456789012345678')).toBe('7123456789012345678');
  });

  test('returns null for non-video URL', () => {
    expect(extractTikTokVideoId('/foryou')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(extractTikTokVideoId(null)).toBeNull();
  });
});

describe('extractRedditPostId', () => {
  test('extracts post ID from comments URL', () => {
    expect(extractRedditPostId('/r/test/comments/abc123/title_here')).toBe('abc123');
  });

  test('returns null for non-comments URL', () => {
    expect(extractRedditPostId('/r/test/')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(extractRedditPostId(null)).toBeNull();
  });
});

describe('extractYouTubeVideoId', () => {
  test('extracts from ?v= parameter', () => {
    expect(extractYouTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  test('extracts from /shorts/ URL', () => {
    expect(extractYouTubeVideoId('https://youtube.com/shorts/abc123')).toBe('abc123');
  });

  test('extracts from youtu.be URL', () => {
    expect(extractYouTubeVideoId('https://youtu.be/xyz789')).toBe('xyz789');
  });

  test('returns null for channel URL', () => {
    expect(extractYouTubeVideoId('https://youtube.com/channel/UCtest')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(extractYouTubeVideoId(null)).toBeNull();
  });
});

// ─── extractHashtags ──────────────────────────────────────

describe('extractHashtags', () => {
  test('extracts hashtags from text', () => {
    expect(extractHashtags('Hello #world #test')).toEqual(['#world', '#test']);
  });

  test('deduplicates hashtags', () => {
    expect(extractHashtags('#foo #foo #bar')).toEqual(['#foo', '#bar']);
  });

  test('returns empty array for text without hashtags', () => {
    expect(extractHashtags('No hashtags here')).toEqual([]);
  });

  test('returns empty array for null', () => {
    expect(extractHashtags(null)).toEqual([]);
  });

  test('handles unicode hashtags', () => {
    const result = extractHashtags('#café #Москва');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── containsAdIndicator ──────────────────────────────────────

describe('containsAdIndicator', () => {
  test('detects "Sponsored" text', () => {
    expect(containsAdIndicator('This is Sponsored content')).toBe(true);
  });

  test('detects "Promoted" text', () => {
    expect(containsAdIndicator('Promoted tweet')).toBe(true);
  });

  test('detects "Paid partnership" text', () => {
    expect(containsAdIndicator('Paid partnership with Brand')).toBe(true);
  });

  test('detects "ad" with separators', () => {
    expect(containsAdIndicator('Brand · Ad')).toBe(true);
  });

  test('detects standalone "ad"', () => {
    expect(containsAdIndicator('  ad  ')).toBe(true);
  });

  test('detects [Ad] in brackets', () => {
    expect(containsAdIndicator('Some text [Ad]')).toBe(true);
  });

  test('returns false for normal text', () => {
    expect(containsAdIndicator('Just a regular post')).toBe(false);
  });

  test('returns false for null', () => {
    expect(containsAdIndicator(null)).toBe(false);
  });
});

// ─── isValidCreator ──────────────────────────────────────

describe('isValidCreator', () => {
  test('accepts normal username', () => {
    expect(isValidCreator('john_doe')).toBe(true);
  });

  test('accepts username with @', () => {
    expect(isValidCreator('@username')).toBe(true);
  });

  test('rejects null', () => {
    expect(isValidCreator(null)).toBe(false);
  });

  test('rejects empty string', () => {
    expect(isValidCreator('')).toBe(false);
  });

  test('rejects timestamp text like "2h ago"', () => {
    expect(isValidCreator('2h ago')).toBe(false);
  });

  test('rejects "3 hours ago"', () => {
    expect(isValidCreator('3 hours ago')).toBe(false);
  });

  test('rejects "just now"', () => {
    expect(isValidCreator('just now')).toBe(false);
  });

  test('rejects "Sponsored"', () => {
    expect(isValidCreator('Sponsored')).toBe(false);
  });

  test('rejects "Follow"', () => {
    expect(isValidCreator('Follow')).toBe(false);
  });

  test('rejects pure number', () => {
    expect(isValidCreator('12345')).toBe(false);
  });

  test('rejects very long string (100+ chars)', () => {
    expect(isValidCreator('a'.repeat(100))).toBe(false);
  });

  test('rejects UI words like "view all"', () => {
    expect(isValidCreator('view all comments')).toBe(false);
  });

  test('rejects text with separator dot', () => {
    expect(isValidCreator('user · 2h')).toBe(false);
  });

  test('rejects "yesterday"', () => {
    expect(isValidCreator('yesterday')).toBe(false);
  });

  test('rejects "x" (platform name)', () => {
    expect(isValidCreator('x')).toBe(false);
  });
});

// ─── isValidCaption ──────────────────────────────────────

describe('isValidCaption', () => {
  test('accepts normal caption', () => {
    expect(isValidCaption('This is a great post about my day!')).toBe(true);
  });

  test('rejects null', () => {
    expect(isValidCaption(null)).toBe(false);
  });

  test('rejects very short text (10 or fewer chars)', () => {
    expect(isValidCaption('short')).toBe(false);
  });

  test('rejects timestamp text', () => {
    expect(isValidCaption('2 hours ago')).toBe(false);
  });

  test('rejects "just now"', () => {
    expect(isValidCaption('just now')).toBe(false);
  });

  test('rejects engagement counts', () => {
    expect(isValidCaption('500 likes')).toBe(false);
  });

  test('rejects "all reactions:" prefix', () => {
    expect(isValidCaption('All Reactions: 100')).toBe(false);
  });

  test('rejects Reels UI text', () => {
    expect(isValidCaption('original audio - creator')).toBe(false);
  });

  test('rejects "suggested for you"', () => {
    expect(isValidCaption('suggested for you')).toBe(false);
  });

  test('rejects text with too many UI words in short text', () => {
    expect(isValidCaption('like comment share')).toBe(false);
  });

  test('accepts long text with a UI word', () => {
    expect(isValidCaption('I really like this new restaurant I found downtown yesterday. Amazing food!')).toBe(true);
  });
});

// ─── parseEngagementCount ──────────────────────────────────────

describe('parseEngagementCount', () => {
  test('parses plain number', () => {
    expect(parseEngagementCount('500')).toBe(500);
  });

  test('parses number with K suffix', () => {
    expect(parseEngagementCount('1.5K')).toBe(1500);
  });

  test('parses number with M suffix', () => {
    expect(parseEngagementCount('2M')).toBe(2000000);
  });

  test('parses number with B suffix', () => {
    expect(parseEngagementCount('1B')).toBe(1000000000);
  });

  test('handles lowercase suffix', () => {
    expect(parseEngagementCount('3.2k')).toBe(3200);
  });

  test('handles commas in number', () => {
    expect(parseEngagementCount('1,500')).toBe(1500);
  });

  test('returns null for null', () => {
    expect(parseEngagementCount(null)).toBeNull();
  });

  test('returns null for non-numeric text', () => {
    expect(parseEngagementCount('hello')).toBeNull();
  });

  test('returns 0 for "0"', () => {
    expect(parseEngagementCount('0')).toBe(0);
  });
});

// ─── generateStableId ──────────────────────────────────────

describe('generateStableId', () => {
  test('uses Instagram post ID when available', () => {
    expect(generateStableId('instagram', 'user', 'caption', null, 0, '/p/ABC123/')).toBe('instagram-ABC123');
  });

  test('uses Twitter status ID when available', () => {
    expect(generateStableId('twitter', 'user', 'caption', null, 0, '/user/status/99999')).toBe('twitter-99999');
  });

  test('uses TikTok video ID when available', () => {
    expect(generateStableId('tiktok', 'user', 'caption', null, 0, '/video/12345')).toBe('tiktok-12345');
  });

  test('uses YouTube video ID when available', () => {
    expect(generateStableId('youtube', 'user', 'caption', null, 0, '?v=dQw4w9')).toBe('youtube-dQw4w9');
  });

  test('uses Reddit post ID when available', () => {
    expect(generateStableId('reddit', 'user', 'caption', null, 0, '/comments/abc123/title')).toBe('reddit-abc123');
  });

  test('falls back to content hash when no permalink', () => {
    const id = generateStableId('instagram', 'creator_name', 'some caption text here', null, 5, null);
    expect(id).toMatch(/^instagram-/);
    expect(id).not.toContain('idx');
  });

  test('falls back to index when no content', () => {
    const id = generateStableId('twitter', '', '', null, 7, null);
    expect(id).toBe('twitter-idx7');
  });

  test('uses element data-id when no permalink', () => {
    const mockElement = {
      getAttribute: (attr) => {
        if (attr === 'data-id') return 'element-data-id-123';
        return null;
      },
      id: '',
    };
    const id = generateStableId('facebook', 'user', 'text', mockElement, 0, null);
    expect(id).toBe('facebook-element-data-id-123');
  });
});

// ─── safeText, safeQuery, safeQueryAll ──────────────────────────────────────

describe('DOM utility safety', () => {
  test('safeText returns null for null element', () => {
    expect(safeText(null)).toBeNull();
  });

  test('safeText returns null for element with empty text', () => {
    expect(safeText({ innerText: '', textContent: '' })).toBeNull();
  });

  test('safeText returns trimmed text', () => {
    expect(safeText({ innerText: '  hello  ' })).toBe('hello');
  });

  test('safeQuery returns null for null parent', () => {
    expect(safeQuery(null, 'div')).toBeNull();
  });

  test('safeQueryAll returns empty array for null parent', () => {
    expect(safeQueryAll(null, 'div')).toEqual([]);
  });
});
