/**
 * Shared extraction utilities for all platform scanners.
 * Every function here is used by 2+ scanner modules.
 */

import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';

// ============================================================================
// DOM UTILITIES
// ============================================================================

export function safeText(el) {
  if (!el) return null;
  try {
    const text = (el.innerText || el.textContent || '').trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

export function safeQuery(parent, selector) {
  if (!parent) return null;
  try {
    return parent.querySelector(selector);
  } catch {
    return null;
  }
}

export function safeQueryAll(parent, selector) {
  if (!parent) return [];
  try {
    return Array.from(parent.querySelectorAll(selector));
  } catch {
    return [];
  }
}

// ============================================================================
// HASHING & ID EXTRACTION
// ============================================================================

export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function extractInstagramPostId(permalink) {
  if (!permalink) return null;
  try {
    const match = permalink.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (match && match[2]) return match[2];
    return null;
  } catch { return null; }
}

export function extractTwitterStatusId(permalink) {
  if (!permalink) return null;
  try {
    const match = permalink.match(/\/status\/(\d+)/);
    if (match && match[1]) return match[1];
    return null;
  } catch { return null; }
}

export function extractTikTokVideoId(url) {
  if (!url) return null;
  try {
    const match = url.match(/\/video\/(\d+)/);
    if (match && match[1]) return match[1];
    return null;
  } catch { return null; }
}

export function extractRedditPostId(permalink) {
  if (!permalink) return null;
  try {
    const match = permalink.match(/\/comments\/([a-zA-Z0-9]+)/);
    if (match && match[1]) return match[1];
    return null;
  } catch { return null; }
}

export function extractYouTubeVideoId(url) {
  if (!url) return null;
  try {
    let match = url.match(/[?&]v=([^&]+)/);
    if (match && match[1]) return match[1];
    match = url.match(/\/shorts\/([^/?]+)/);
    if (match && match[1]) return match[1];
    match = url.match(/youtu\.be\/([^/?]+)/);
    if (match && match[1]) return match[1];
    return null;
  } catch { return null; }
}

// ============================================================================
// INSTAGRAM UTILITIES
// ============================================================================

export function isInstagramReels() {
  try {
    const path = window.location.pathname;
    return path.startsWith('/reels') || path.startsWith('/reel/');
  } catch {
    return false;
  }
}

// ============================================================================
// STABLE ID GENERATION
// ============================================================================

export function generateStableId(platform, creator, caption, element, index, permalink = null) {
  if (platform === 'instagram' && permalink) {
    const id = extractInstagramPostId(permalink);
    if (id) return `instagram-${id}`;
  }
  if (platform === 'twitter' && permalink) {
    const id = extractTwitterStatusId(permalink);
    if (id) return `twitter-${id}`;
  }
  if (platform === 'tiktok' && permalink) {
    const id = extractTikTokVideoId(permalink);
    if (id) return `tiktok-${id}`;
  }
  if (platform === 'youtube' && permalink) {
    const id = extractYouTubeVideoId(permalink);
    if (id) return `youtube-${id}`;
  }
  if (platform === 'reddit' && permalink) {
    const id = extractRedditPostId(permalink);
    if (id) return `reddit-${id}`;
  }

  const nativeId = element?.getAttribute('data-id') ||
                   element?.getAttribute('data-video-id') ||
                   element?.getAttribute('data-post-id') ||
                   element?.getAttribute('data-pagelet') ||
                   element?.id || '';
  if (nativeId && nativeId.length > 5) {
    return `${platform}-${nativeId}`;
  }

  const creatorPart = (creator || '').trim().slice(0, 50);
  const captionPart = (caption || '').trim().slice(0, 200);
  const contentKey = `${creatorPart}|${captionPart}`;
  if (contentKey.length > 5) {
    return `${platform}-${hashString(contentKey)}`;
  }

  return `${platform}-idx${index}`;
}

// ============================================================================
// TEXT EXTRACTION & VALIDATION
// ============================================================================

export function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[\w\u00C0-\u017F\u0400-\u04FF]+/g);
  return matches ? [...new Set(matches)] : [];
}

export function containsAdIndicator(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const patterns = [
    /\bsponsored\b/, /\bpromoted\b/, /\badvertisement\b/,
    /\bpaid partnership\b/, /\bpaid promotion\b/,
    /\bad\s*[•·|]/, /[•·|]\s*ad\b/, /^\s*ad\s*$/, /\[ad\]/i, /\(ad\)/i,
  ];
  return patterns.some(p => p.test(lower));
}

export function extractCTA(container) {
  if (!container) return null;
  const ctaPatterns = [
    /shop\s*now/i, /learn\s*more/i, /sign\s*up/i, /get\s*started/i,
    /download/i, /install/i, /buy\s*now/i, /order\s*now/i,
    /subscribe/i, /watch\s*more/i, /see\s*more/i, /visit\s*site/i,
    /book\s*now/i, /apply\s*now/i, /contact\s*us/i, /get\s*app/i,
    /play\s*now/i, /try\s*free/i, /start\s*free/i
  ];
  const buttons = safeQueryAll(container, 'button, [role="button"], a[href]');
  for (const btn of buttons) {
    const text = safeText(btn);
    if (text && ctaPatterns.some(p => p.test(text))) return text.slice(0, 50);
  }
  return null;
}

export function extractLink(container) {
  if (!container) return null;
  const links = safeQueryAll(container, 'a[href]');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:') &&
        !href.includes('/login') && !href.includes('/signup') &&
        (href.startsWith('http') || href.startsWith('//'))) {
      return href;
    }
  }
  return null;
}

export function isValidCreator(text) {
  if (!text) return false;
  const t = text.trim();
  const tLower = t.toLowerCase();
  if (t.length === 0 || t.length >= 100) return false;
  if (t.includes('·') || t.includes(' hr') || t.includes(' min')) return false;
  if (/^\d+[hmd]?\s*(ago)?$/i.test(t)) return false;
  if (/^(just now|yesterday|today)$/i.test(t)) return false;
  if (/^\d+ (hour|minute|second|day|week|month|year)s? ago$/i.test(t)) return false;
  if (/^\d+\s*$/.test(t)) return false;
  if (/^(like|comment|share|reply|see more|sponsored|ad|suggested for you|follow|following|message)$/i.test(t)) return false;

  const invalidPrefixes = [
    'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'x ',
    'meta', 'reels', 'stories', 'explore', 'home', 'search',
    'notifications', 'messages', 'profile', 'settings',
    'original audio', 'original sound', 'audio',
    'see translation', 'translate', 'more',
    'verified', 'public figure', 'creator',
    'follow', 'suggested', 'sponsored'
  ];
  for (const prefix of invalidPrefixes) {
    if (tLower === prefix || tLower.startsWith(prefix + ' ') || tLower.startsWith(prefix + '•')) return false;
  }
  if (tLower === 'x') return false;
  if (/^(view|show|hide|load|open|close|expand|collapse)\s/i.test(t)) return false;
  return true;
}

export function isValidCaption(text) {
  if (!text) return false;
  const t = text.trim();
  const tLower = t.toLowerCase();
  if (t.length <= 10) return false;
  if (/^(\d+[hmd]?\s*(ago)?|just now|yesterday|today)$/i.test(t)) return false;
  if (/^\d+ (hour|minute|second|day|week|month|year)s? ago$/i.test(t)) return false;
  if (/^(like|comment|share|reply|see more|sponsored|ad|follow|message)$/i.test(t)) return false;
  if (/^(all reactions|comments|shares):/i.test(t)) return false;
  if (/^\d+\s*(likes?|comments?|shares?|views?)$/i.test(t)) return false;

  const reelsUI = [
    'audio is muted', 'click to unmute', 'tap to unmute', 'muted',
    'original audio', 'original sound', 'reels', 'send message',
    'view more comments', 'add a comment', 'view all', 'more posts from',
    'suggested for you', 'based on your activity', 'because you watched',
    'similar to posts you', 'posts you may like', 'show fewer posts like this',
    'not interested', 'why am i seeing this', 'save to collection', 'copy link', 'share to'
  ];
  for (const pattern of reelsUI) {
    if (tLower === pattern || tLower.startsWith(pattern + ' ')) return false;
  }

  const uiWords = ['follow', 'like', 'comment', 'share', 'save', 'mute', 'unmute', 'audio'];
  const uiCount = uiWords.filter(w => tLower.includes(w)).length;
  if (t.split(/\s+/).length <= 5 && uiCount >= 2) return false;
  return true;
}

// ============================================================================
// MODULE FILTERING
// ============================================================================

export function isNonPostModule(container, platform) {
  const text = (container.textContent || '').toLowerCase();
  if (!text) return false;

  if (text.includes('people you may know') || text.includes('add friend') ||
      text.includes('mutual friends') ||
      (text.includes('suggested') && container.querySelector('button'))) {
    return true;
  }

  if (platform === 'instagram') {
    const hasPostPermalink = !!container.querySelector('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]');
    const hasCreatorLink = !!container.querySelector('header a[href^="/"]');
    const hasTimeElement = !!container.querySelector('time[datetime]');
    if (hasPostPermalink || (hasCreatorLink && hasTimeElement)) return false;

    const headerEl = container.querySelector('header, nav, div[role="navigation"]');
    const headerText = headerEl ? (headerEl.textContent || '').toLowerCase() : '';
    if (headerText.includes('suggested for you') || headerText.includes('accounts you might like') ||
        text.includes('try these reels') || text.includes('top reels') ||
        text.includes('new for you') || text.includes("posts you've liked") ||
        text.includes('based on your activity') ||
        (container.querySelectorAll('button').length >= 3 && text.includes('follow'))) {
      return true;
    }
  }

  if (platform === 'twitter') {
    if (text.includes('who to follow') || text.includes('topics to follow') ||
        text.includes('you might like') || text.includes('users to follow') ||
        text.includes('subscribe to') || text.includes('get verified') ||
        text.includes('trending now') || text.includes("what's happening") ||
        (text.includes('follow') && container.querySelectorAll('button').length >= 3 &&
         !container.querySelector('[data-testid="tweetText"]'))) {
      return true;
    }
    if (container.querySelectorAll('img[src*="profile_images"]').length >= 2 &&
        !container.querySelector('[data-testid="tweetText"]')) {
      return true;
    }
  }

  return false;
}

export function hasBeenViewed(element) {
  if (!element) return false;
  try {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < viewportHeight;
  } catch {
    return true;
  }
}

// ============================================================================
// ENGAGEMENT COUNT PARSING
// ============================================================================

/**
 * Parse engagement count text like "1.5K", "2M", "500" into a number.
 * @returns {number|null} Parsed count (0 is valid), or null if text is unparseable
 */
export function parseEngagementCount(text) {
  if (!text) return null;
  const cleaned = text.replace(/,/g, '').replace(/\s+/g, '').trim();
  const match = cleaned.match(/^([\d.]+)\s*([KMBkmb])?$/);
  if (!match) return null;
  let num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') num *= 1000;
  else if (suffix === 'M') num *= 1000000;
  else if (suffix === 'B') num *= 1000000000;
  return Math.round(num);
}
