/**
 * AlgorithmLens Content Script - DOM Feed Scanner
 * 
 * A robust, accurate DOM scanning engine for extracting feed posts from:
 * - TikTok
 * - Instagram  
 * - YouTube (including Shorts)
 * - Facebook
 * - Twitter/X
 * - Reddit
 * 
 * Supports two modes:
 * - One-shot scan (SCAN_FEED): Snapshot of currently visible posts
 * - Session scan: Continuous collection as user scrolls
 * 
 * Output Schema (DesktopPostItem):
 * {
 *   id: string,
 *   platform: "tiktok" | "instagram" | "youtube" | "facebook" | "twitter" | "reddit",
 *   creator: string | null,
 *   caption: string | null,
 *   hashtags: string[],
 *   isSponsored: boolean,
 *   ctaText: string | null,
 *   link: string | null
 * }
 */

// ============================================================================
// DEBUG FLAG (temporary - remove after fixing capture issues)
// ============================================================================
const CAPTURE_DEBUG = true; // Set to false to disable all [CaptureDebug] logs

// ============================================================================
// DEBUG LOGGING RELAY (forwards logs to background service worker)
// ============================================================================

/**
 * Unified debug logging helper that logs locally and forwards to background
 * @param {string} level - 'log', 'warn', or 'error'
 * @param {string} message - Log message
 * @param {any} data - Optional data object
 */
function debugLog(level, message, data = null) {
  if (!CAPTURE_DEBUG) return;
  
  // Log locally first
  const consoleMethod = console[level] || console.log;
  if (data !== null) {
    consoleMethod(message, data);
  } else {
    consoleMethod(message);
  }
  
  // Forward to background service worker
  try {
    chrome.runtime.sendMessage({
      type: 'CAPTURE_DEBUG_LOG',
      source: 'content',
      level: level,
      message: message,
      data: data
    }).catch(() => {
      // Silently ignore if background isn't ready (non-blocking)
    });
  } catch (e) {
    // Silently ignore messaging errors (non-blocking)
  }
}

// ============================================================================
// SESSION STATE
// ============================================================================

let sessionActive = false;
let sessionPosts = new Map(); // key: stable post ID, value: DesktopPostItem
let sessionObservers = [];    // MutationObservers to disconnect on stop
let sessionPlatform = null;
let sessionStartTime = null;

// Instagram-specific: IntersectionObserver to capture posts when they enter viewport
// This is critical because Instagram pre-loads posts below viewport that user may never see
let platformViewportObserver = null; // IntersectionObserver for capturing posts when they enter viewport

// Facebook-specific per-session container tracking (using content hashes for stability)
let facebookProcessedContainerHashes = new Set();

/**
 * Generate a stable hash for a Facebook container based on content, not DOM reference
 * This allows proper deduplication even when DOM elements are recycled during scroll
 * @param {Element} container 
 * @returns {string}
 */
function generateContainerHash(container) {
  // Use a combination of text content snippet + structural signature
  const textSnippet = (container.innerText || '').slice(0, 200).replace(/\s+/g, ' ').trim();
  const linkCount = container.querySelectorAll('a[href]').length;
  const imgCount = container.querySelectorAll('img').length;
  const hasVideo = container.querySelector('video') ? 1 : 0;
  
  // Create structural signature
  const signature = `${textSnippet}|links:${linkCount}|imgs:${imgCount}|video:${hasVideo}`;
  return hashString(signature);
}

// ============================================================================
// RATE LIMITING CONFIGURATION (SOFT DELAY-BASED)
// ============================================================================

// New soft rate-limiter parameters
const MAX_POSTS_PER_SECOND = 30;        // Stable throughput (increased from 5)
const BURST_POSTS_PER_SECOND = 50;      // Allow short bursts
const RATE_DELAY_MS = 180;              // Instead of skipping, delay next cycle

// Delay tracking for soft rate limiting
let lastCollectionDelayedUntil = 0;

// Scroll-based scan activation
let lastScrollY = 0;
let forceNextScan = false;

// Rate limiting state (reset on session start)
let sessionRateState = {
  totalNewPostsThisSession: 0,
  sessionStartTimeMs: null,
  consecutiveRateExceeds: 0,
  rateLimitTriggered: false  // Kept for backward compat but never triggered now
};

// Legacy batch limit (kept for backward compatibility, but no longer the primary limit)
const MAX_FACEBOOK_POSTS_PER_BATCH = 50; // Increased from 5 to allow more posts per batch

// ============================================================================
// FACEBOOK QUERY CACHE (Performance optimization)
// ============================================================================

// Short-lived cache for expensive DOM queries during a single scan cycle
const fbQueryCache = new Map();

/**
 * Cached DOM query for Facebook selectors
 * Cache is cleared once per scan cycle to avoid stale results
 * @param {string} selector 
 * @returns {Element[]}
 */
function cachedQuery(selector) {
  if (fbQueryCache.has(selector)) {
    return fbQueryCache.get(selector);
  }
  const result = Array.from(document.querySelectorAll(selector));
  fbQueryCache.set(selector, result);
  return result;
}

/**
 * Clear the Facebook query cache - call at start of each scan cycle
 */
function clearFbQueryCache() {
  fbQueryCache.clear();
}

// ============================================================================
// SCAN INTERVAL CONFIGURATION (Variable based on activity)
// ============================================================================

// Scan interval when feed is stable (no scrolling)
const SCAN_INTERVAL_STABLE_MS = 500;

// Scan interval when actively scrolling
const SCAN_INTERVAL_SCROLLING_MS = 300;

// Track last scroll time for interval adjustment
let lastScrollTime = 0;

/**
 * Get current scan interval based on scroll activity
 * @returns {number} milliseconds
 */
function getCurrentScanInterval() {
  const timeSinceScroll = Date.now() - lastScrollTime;
  // If scrolled within last 2 seconds, use faster interval
  return timeSinceScroll < 2000 ? SCAN_INTERVAL_SCROLLING_MS : SCAN_INTERVAL_STABLE_MS;
}

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

/**
 * Detect the current social media platform from URL
 * Supports all common hostname variants for each platform
 * @returns {'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'reddit' | 'unknown'}
 */
function detectPlatform() {
  const hostname = window.location.hostname.toLowerCase();
  
  // TikTok detection
  if (hostname.includes('tiktok.com')) {
    return 'tiktok';
  }
  
  // Instagram detection
  if (hostname.includes('instagram.com')) {
    return 'instagram';
  }
  
  // YouTube detection (including mobile and short URL variants)
  if (hostname.includes('youtube.com') || 
      hostname.includes('youtu.be') ||
      hostname === 'm.youtube.com') {
    return 'youtube';
  }
  
  // Facebook detection (all known variants)
  if (hostname.includes('facebook.com') ||
      hostname === 'www.facebook.com' ||
      hostname === 'web.facebook.com' ||
      hostname === 'm.facebook.com' ||
      hostname.includes('fb.com') ||
      hostname.includes('fb.watch')) {
    return 'facebook';
  }
  
  // Twitter/X detection (all known variants)
  if (hostname === 'x.com' ||
      hostname === 'www.x.com' ||
      hostname === 'twitter.com' ||
      hostname === 'www.twitter.com' ||
      hostname === 'mobile.twitter.com') {
    return 'twitter';
  }
  
  // Reddit detection (all known variants)
  if (hostname === 'www.reddit.com' ||
      hostname === 'reddit.com' ||
      hostname === 'old.reddit.com' ||
      hostname === 'new.reddit.com' ||
      hostname === 'sh.reddit.com') {
    return 'reddit';
  }
  
  return 'unknown';
}

// ============================================================================
// UNIVERSAL NON-POST MODULE CLASSIFIER
// ============================================================================

/**
 * Detect non-post modules that should NOT be counted as real posts
 * This is a universal filter that works across all platforms
 * @param {Element} container - The container element to check
 * @param {string} platform - The current platform ('facebook', 'instagram', 'tiktok', 'youtube')
 * @returns {boolean} - true if this is a non-post module that should be skipped
 */
function isNonPostModule(container, platform) {
  const text = (container.innerText || "").toLowerCase();
  if (!text) return false;

  // ============================================================================
  // YOUTUBE EARLY EXIT: Check if this is a YouTube video BEFORE generic checks
  // YouTube videos (including ads) should never be rejected by generic patterns
  // ============================================================================
  if (platform === "youtube") {
    const isShorts = window.location.pathname.includes('/shorts');
    if (isShorts) {
      return false; // Shorts are always valid
    }

    // If container has video indicators, it's a video post (including ads)
    const hasVideoLink = !!container.querySelector('a[href*="/watch"], a#thumbnail, ytd-thumbnail, #thumbnail');
    const hasVideoTitle = !!container.querySelector('#video-title, h3');
    if (hasVideoLink || hasVideoTitle) {
      return false; // This is a video, don't reject
    }
  }

  // PLATFORM-AGNOSTIC EXCLUSIONS
  // Applies to ALL platforms
  if (
    text.includes("people you may know") ||
    text.includes("add friend") ||
    text.includes("mutual friends") ||
    text.includes("suggested for you") ||
    (text.includes("suggested") && container.querySelector("button"))
  ) {
    return true;
  }

  // Marketplace or shopping modules
  if (
    text.includes("marketplace") ||
    text.includes("buy and sell") ||
    /\$\d+/.test(text)
  ) {
    return true;
  }

  // Memories / anniversaries / events
  if (
    text.includes("on this day") ||
    text.includes("memory") ||
    text.includes("memories") ||
    (text.includes("event") && container.querySelector("button"))
  ) {
    return true;
  }

  // Side ads, irrelevant ads, recommendation units
  if (
    text.includes("sponsored ·") ||
    text.includes("ad ·") ||
    text.includes("recommendations") ||
    text.includes("trending") ||
    text.includes("channels you may like")
  ) {
    return true;
  }

  // MULTI-CARD CAROUSELS THAT ARE NOT POSTS (e.g., PYMK carousels)
  if (
    container.querySelectorAll("img").length >= 3 &&
    text.includes("add friend")
  ) {
    return true;
  }

  // PLATFORM-SPECIFIC EXCLUSIONS
  // ------------------------------------

  if (platform === "facebook") {
    if (
      text.includes("people you may know") ||
      text.includes("intro") ||
      text.includes("create room") ||
      text.includes("find friends") ||
      text.includes("groups you may like") ||
      (text.includes("events") && container.querySelector("button"))
    ) {
      return true;
    }
  }

  if (platform === "instagram") {
    // IMPORTANT: Only reject containers that are clearly non-post UI modules
    // Be VERY conservative - posts can mention these phrases in captions!
    // Check ONLY header/nav areas for UI module indicators, NOT the entire container text

    // First, check if this looks like a real post (has post-like structure)
    const hasPostPermalink = !!container.querySelector('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]');
    const hasCreatorLink = !!container.querySelector('header a[href^="/"]');
    const hasTimeElement = !!container.querySelector('time[datetime]');
    const looksLikePost = hasPostPermalink || (hasCreatorLink && hasTimeElement);

    // If it looks like a post, DON'T reject it based on text content
    // (posts can mention "suggested for you" etc. in their captions)
    if (looksLikePost) {
      return false; // This is likely a real post, don't reject
    }

    // For containers that DON'T look like posts, check for non-post module indicators
    // Only check HEADER text, not the entire container
    const headerEl = container.querySelector('header, nav, div[role="navigation"]');
    const headerText = headerEl ? (headerEl.innerText || '').toLowerCase() : '';

    // Also check for module-specific class patterns that indicate suggestions
    const containerClasses = container.className || '';
    const isSuggestionModule = containerClasses.includes('suggestion') ||
                               containerClasses.includes('recommended');

    if (
      isSuggestionModule ||
      headerText.includes("suggested for you") ||
      headerText.includes("accounts you might like") ||
      text.includes("try these reels") ||
      text.includes("top reels") ||
      text.includes("new for you") ||
      text.includes("posts you've liked") ||
      text.includes("based on your activity") ||
      // Multi-account carousel with "follow" buttons (not posts)
      (container.querySelectorAll('button').length >= 3 && text.includes("follow"))
    ) {
      return true;
    }
  }

  if (platform === "twitter") {
    // Twitter/X-specific non-post modules
    // These use article elements but aren't actual tweets
    if (
      text.includes("who to follow") ||
      text.includes("topics to follow") ||
      text.includes("you might like") ||
      text.includes("users to follow") ||
      text.includes("subscribe to") ||
      text.includes("get verified") ||
      text.includes("trending now") ||
      text.includes("what's happening") ||
      // Profile cards with follow buttons
      (text.includes("follow") && container.querySelectorAll('button').length >= 3 && !container.querySelector('[data-testid="tweetText"]'))
    ) {
      return true;
    }

    // Reject if this is clearly a suggestion module (has multiple profile images but no tweet text)
    const hasMultipleAvatars = container.querySelectorAll('img[src*="profile_images"]').length >= 2;
    const hasTweetText = !!container.querySelector('[data-testid="tweetText"]');
    if (hasMultipleAvatars && !hasTweetText) {
      return true;
    }
  }

  if (platform === "tiktok") {
    if (
      text.includes("people you may know") ||
      text.includes("discover more") ||
      text.includes("trending now") ||
      text.includes("for you suggestions")
    ) {
      return true;
    }
  }

  // YouTube is handled at the top of the function with early exit for videos

  return false;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an element has been scrolled into view (at least partially visible)
 * Used to filter out pre-loaded posts that haven't been seen by the user yet
 * @param {Element} element - DOM element to check
 * @returns {boolean} - true if element is at least partially in viewport
 */
function hasBeenViewed(element) {
  if (!element) return false;
  try {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    // Element is considered "viewed" if it is NOT entirely below the viewport
    // - Posts ABOVE viewport (rect.top < 0, rect.bottom <= 0) WERE viewed - user scrolled past them
    // - Posts IN viewport (rect.top < windowHeight && rect.bottom > 0) are currently visible
    // - Posts BELOW viewport (rect.top >= windowHeight) have NOT been viewed yet - reject these
    const isEntirelyBelowViewport = rect.top >= windowHeight;
    const hasBeenInViewport = !isEntirelyBelowViewport;

    // Also check if element has non-zero dimensions (not hidden)
    const hasSize = rect.width > 0 && rect.height > 0;

    return hasBeenInViewport && hasSize;
  } catch (e) {
    return true; // Default to true on error to avoid missing posts
  }
}

/**
 * Simple string hash for generating stable IDs
 * @param {string} str - Input string
 * @returns {string} Short hash
 */
function hashString(str) {
  if (!str) return '0';
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 500); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract Instagram post ID from a permalink URL
 * @param {string|null} permalink - URL like /p/ABC123/ or /reel/XYZ789/
 * @returns {string|null}
 */
function extractInstagramPostId(permalink) {
  if (!permalink) return null;
  // Match /p/ID/, /reel/ID/, /tv/ID/
  const match = permalink.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[2] : null;
}

/**
 * Extract Twitter status ID from a permalink URL
 * @param {string|null} permalink - URL like /username/status/12345
 * @returns {string|null}
 */
function extractTwitterStatusId(permalink) {
  if (!permalink) return null;
  // Match /status/ID or /i/web/status/ID
  const match = permalink.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract TikTok video ID from a URL
 * @param {string|null} url - URL like tiktok.com/@user/video/123456 or /video/123456
 * @returns {string|null}
 */
function extractTikTokVideoId(url) {
  if (!url) return null;
  // Match /video/ID pattern
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract Reddit post ID from a permalink URL
 * @param {string|null} permalink - URL like /r/sub/comments/ABC123/title/
 * @returns {string|null}
 */
function extractRedditPostId(permalink) {
  if (!permalink) return null;
  // Match /comments/ID/ pattern
  const match = permalink.match(/\/comments\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Extract YouTube video ID from a URL
 * @param {string|null} url - URL like youtube.com/watch?v=ID or /shorts/ID
 * @returns {string|null}
 */
function extractYouTubeVideoId(url) {
  if (!url) return null;
  // Match ?v=ID or /shorts/ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  const shortsMatch = url.match(/\/shorts\/([^?/]+)/);
  if (shortsMatch) return shortsMatch[1];
  return null;
}

/**
 * Check if we're on Instagram Reels page
 * @returns {boolean}
 */
function isInstagramReels() {
  return window.location.pathname.startsWith('/reels');
}

// ============================================================================
// REELS CONFIG: Last resort toggle - do NOT enable by default
// If true, Reels acceptance can become hasMedia only (weak deduplication)
// ============================================================================
const ALLOW_REELS_MEDIA_ONLY_FALLBACK = false;

/**
 * Extract Reel ID (shortcode) and permalink from container or page context
 * @param {Element} container
 * @returns {{ shortcode: string|null, permalink: string|null, source: string|null }}
 */
function extractInstagramReelIdAndPermalink(container) {
  let shortcode = null;
  let permalink = null;
  let source = null;

  try {
    // A) From container: Look for a[href*="/reel/"] or a[href*="/reels/"]
    const reelLinkSelectors = [
      'a[href*="/reel/"]',
      'a[href*="/reels/"]',
    ];

    for (const sel of reelLinkSelectors) {
      const el = safeQuery(container, sel);
      if (el) {
        const href = el.getAttribute('href') || '';
        try {
          const url = new URL(href, window.location.origin);
          const match = url.pathname.match(/\/reels?\/([^/?#]+)/);
          if (match && match[1]) {
            shortcode = match[1];
            permalink = url.href;
            source = 'container-link';
            break;
          }
        } catch (e) {
          // Invalid URL, continue
        }
      }
    }

    // B) From location.pathname if no container link found
    if (!shortcode) {
      const pathMatch = window.location.pathname.match(/\/reels?\/([^/?#]+)/);
      if (pathMatch && pathMatch[1]) {
        shortcode = pathMatch[1];
        permalink = window.location.href;
        source = 'location-pathname';
      }
    }

    // C) From canonical or og:url meta tags
    if (!shortcode) {
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      const ogUrlEl = document.querySelector('meta[property="og:url"]');

      const metaUrl = canonicalEl?.getAttribute('href') || ogUrlEl?.getAttribute('content') || '';
      if (metaUrl) {
        try {
          const url = new URL(metaUrl);
          const match = url.pathname.match(/\/reels?\/([^/?#]+)/);
          if (match && match[1]) {
            shortcode = match[1];
            permalink = url.href;
            source = 'meta-tag';
          }
        } catch (e) {
          // Invalid URL, continue
        }
      }
    }
  } catch (e) {
    // Defensive: return nulls
  }

  if (CAPTURE_DEBUG && isInstagramReels()) {
    debugLog('log', `[CaptureDebug][Instagram][Reels] ReelId lookup: source=${source || 'none'}, shortcode=${shortcode || 'null'}, permalinkFound=${!!permalink}`);
  }

  return { shortcode, permalink, source };
}

/**
 * Generate a stable unique ID for deduplication
 * ENHANCED: Platform-specific ID extraction for better stability
 * @param {string} platform
 * @param {string|null} creator
 * @param {string|null} caption
 * @param {Element} element
 * @param {number} index
 * @param {string|null} permalink - Optional permalink for ID extraction
 * @returns {string}
 */
function generateStableId(platform, creator, caption, element, index, permalink = null) {
  // ============================================================================
  // PLATFORM-SPECIFIC ID EXTRACTION (most stable)
  // ============================================================================

  // Instagram: Extract from permalink /p/ID/ or /reel/ID/
  if (platform === 'instagram' && permalink) {
    const igPostId = extractInstagramPostId(permalink);
    if (igPostId) {
      return `instagram-${igPostId}`;
    }
  }

  // Twitter: Extract from permalink /status/ID
  if (platform === 'twitter' && permalink) {
    const tweetId = extractTwitterStatusId(permalink);
    if (tweetId) {
      return `twitter-${tweetId}`;
    }
  }

  // TikTok: Extract from permalink /video/ID
  if (platform === 'tiktok' && permalink) {
    const videoId = extractTikTokVideoId(permalink);
    if (videoId) {
      return `tiktok-${videoId}`;
    }
  }

  // YouTube: Extract from watch?v=ID or /shorts/ID
  if (platform === 'youtube' && permalink) {
    const videoId = extractYouTubeVideoId(permalink);
    if (videoId) {
      return `youtube-${videoId}`;
    }
  }

  // Reddit: Extract from /comments/ID/
  if (platform === 'reddit' && permalink) {
    const postId = extractRedditPostId(permalink);
    if (postId) {
      return `reddit-${postId}`;
    }
  }

  // Try to find a native ID from the DOM
  const nativeId = element?.getAttribute('data-id') ||
                   element?.getAttribute('data-video-id') ||
                   element?.getAttribute('data-post-id') ||
                   element?.getAttribute('data-pagelet') ||
                   element?.id || '';

  if (nativeId && nativeId.length > 5) {
    return `${platform}-${nativeId}`;
  }

  // Build content-based hash
  const creatorPart = (creator || '').trim().slice(0, 50);
  const captionPart = (caption || '').trim().slice(0, 200);
  const contentKey = `${creatorPart}|${captionPart}`;

  if (contentKey.length > 5) {
    return `${platform}-${hashString(contentKey)}`;
  }

  // Fallback: index-based only (NO timestamp - for deterministic deduplication)
  return `${platform}-idx${index}`;
}

/**
 * Safely get text content from an element
 * @param {Element|null} el 
 * @returns {string|null}
 */
function safeText(el) {
  if (!el) return null;
  try {
    const text = (el.innerText || el.textContent || '').trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

/**
 * Safely query a selector
 * @param {Element|Document} parent 
 * @param {string} selector 
 * @returns {Element|null}
 */
function safeQuery(parent, selector) {
  if (!parent) return null;
  try {
    return parent.querySelector(selector);
  } catch {
    return null;
  }
}

/**
 * Safely query all matching elements
 * @param {Element|Document} parent 
 * @param {string} selector 
 * @returns {Element[]}
 */
function safeQueryAll(parent, selector) {
  if (!parent) return [];
  try {
    return Array.from(parent.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/**
 * Extract hashtags from text
 * @param {string|null} text 
 * @returns {string[]}
 */
function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[\w\u00C0-\u017F\u0400-\u04FF]+/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Check if text contains sponsored/ad indicators
 * Uses strict word boundary matching to avoid false positives
 * @param {string|null} text 
 * @returns {boolean}
 */
function containsAdIndicator(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  // Strict patterns with word boundaries
  const patterns = [
    /\bsponsored\b/,
    /\bpromoted\b/,
    /\badvertisement\b/,
    /\bpaid partnership\b/,
    /\bpaid promotion\b/,
    /\bad\s*[•·|]/,          // "Ad •" or "Ad |"
    /[•·|]\s*ad\b/,          // "• Ad"
    /^\s*ad\s*$/,            // Just "Ad"
    /\[ad\]/i,
    /\(ad\)/i,
  ];
  
  return patterns.some(p => p.test(lower));
}

/**
 * Extract CTA button text from element
 * @param {Element} container 
 * @returns {string|null}
 */
function extractCTA(container) {
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
    if (text && ctaPatterns.some(p => p.test(text))) {
      return text.slice(0, 50);
    }
  }
  
  return null;
}

/**
 * Extract the first meaningful link from container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractLink(container) {
  if (!container) return null;
  
  const links = safeQueryAll(container, 'a[href]');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href && 
        !href.startsWith('#') && 
        !href.startsWith('javascript:') &&
        !href.includes('/login') &&
        !href.includes('/signup') &&
        (href.startsWith('http') || href.startsWith('//'))) {
      return href;
    }
  }
  return null;
}

/**
 * Validate if text looks like a real creator name (not a timestamp, UI element, or brand name)
 * @param {string|null} text
 * @returns {boolean}
 */
function isValidCreator(text) {
  if (!text) return false;
  const t = text.trim();
  const tLower = t.toLowerCase();

  // Length checks
  if (t.length === 0 || t.length >= 100) return false;

  // Reject if contains timestamp separators
  if (t.includes('·') || t.includes(' hr') || t.includes(' min')) return false;

  // Reject timestamp patterns
  if (/^\d+[hmd]?\s*(ago)?$/i.test(t)) return false;
  if (/^(just now|yesterday|today)$/i.test(t)) return false;
  if (/^\d+ (hour|minute|second|day|week|month|year)s? ago$/i.test(t)) return false;

  // Reject pure numeric
  if (/^\d+\s*$/.test(t)) return false;

  // Reject common UI/action text
  if (/^(like|comment|share|reply|see more|sponsored|ad|suggested for you|follow|following|message)$/i.test(t)) return false;

  // Reject platform/brand names that shouldn't be creators
  // Use startsWith/includes matching to catch variations like "Instagram Reels", "Instagram • Follow"
  const invalidCreatorPrefixes = [
    'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'x ',
    'meta', 'reels', 'stories', 'explore', 'home', 'search',
    'notifications', 'messages', 'profile', 'settings',
    'original audio', 'original sound', 'audio',
    'see translation', 'translate', 'more',
    'verified', 'public figure', 'creator',
    'follow', 'suggested', 'sponsored'
  ];
  // Check exact match OR prefix match for platform names
  for (const prefix of invalidCreatorPrefixes) {
    if (tLower === prefix || tLower.startsWith(prefix + ' ') || tLower.startsWith(prefix + '•')) {
      return false;
    }
  }
  // Also reject if it's just "x" (Twitter's rebrand) - must be exact match
  if (tLower === 'x') return false;

  // Reject if text is just a common UI label
  if (/^(view|show|hide|load|open|close|expand|collapse)\s/i.test(t)) return false;

  return true;
}

/**
 * Validate if text looks like a real caption (not UI chrome or metadata)
 * @param {string|null} text
 * @returns {boolean}
 */
function isValidCaption(text) {
  if (!text) return false;
  const t = text.trim();
  const tLower = t.toLowerCase();

  // Must be long enough to be real content
  if (t.length <= 10) return false;

  // Reject timestamp patterns
  if (/^(\d+[hmd]?\s*(ago)?|just now|yesterday|today)$/i.test(t)) return false;
  if (/^\d+ (hour|minute|second|day|week|month|year)s? ago$/i.test(t)) return false;

  // Reject common button/action text
  if (/^(like|comment|share|reply|see more|sponsored|ad|follow|message)$/i.test(t)) return false;

  // Reject metadata patterns
  if (/^(all reactions|comments|shares):/i.test(t)) return false;
  if (/^\d+\s*(likes?|comments?|shares?|views?)$/i.test(t)) return false;

  // Reject Instagram Reels UI text patterns
  const reelsUIPatterns = [
    'audio is muted',
    'click to unmute',
    'tap to unmute',
    'muted',
    'original audio',
    'original sound',
    'reels',
    'send message',
    'view more comments',
    'add a comment',
    'view all',
    'more posts from',
    'suggested for you',
    'based on your activity',
    'because you watched',
    'similar to posts you',
    'posts you may like',
    'show fewer posts like this',
    'not interested',
    'why am i seeing this',
    'save to collection',
    'copy link',
    'share to'
  ];
  for (const pattern of reelsUIPatterns) {
    if (tLower === pattern || tLower.startsWith(pattern + ' ')) return false;
  }

  // Reject if text contains mostly UI indicators (high ratio of UI words)
  const uiIndicators = ['follow', 'like', 'comment', 'share', 'save', 'mute', 'unmute', 'audio'];
  const uiWordCount = uiIndicators.filter(word => tLower.includes(word)).length;
  const wordCount = t.split(/\s+/).length;
  // If more than half the text is UI words and text is short, reject
  if (wordCount <= 5 && uiWordCount >= 2) return false;

  return true;
}

// ============================================================================
// TIKTOK SCANNER
// ============================================================================

/**
 * Extract creator name from a TikTok post container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractTikTokCreator(container) {
  const creatorSelectors = [
    '[data-e2e="video-author-uniqueid"]',
    '[data-e2e="search-card-user-unique-id"]',
    '[class*="AuthorTitle"] a',
    '[class*="StyledAuthorAnchor"]',
    '[class*="SpanUniqueId"]',
    'a[href*="/@"]'
  ];
  
  for (const sel of creatorSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      let creator = safeText(el);
      // Try to extract from href if text is empty
      if (!creator) {
        const href = el.getAttribute('href') || '';
        const match = href.match(/\/@([^/?]+)/);
        if (match) creator = match[1];
      }
      if (creator && isValidCreator(creator)) {
        return creator.replace(/^@/, ''); // Remove leading @
      }
    }
  }
  
  return null;
}

/**
 * Extract caption/description from a TikTok post container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractTikTokCaption(container) {
  const captionSelectors = [
    '[data-e2e="video-desc"]',
    '[data-e2e="search-card-video-caption"]',
    '[class*="DivContainer"][class*="desc"]',
    '[class*="SpanText"]',
    '[class*="DivTextInfoContainer"]'
  ];
  
  for (const sel of captionSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const caption = safeText(el);
      if (caption && caption.length > 5 && isValidCaption(caption)) {
        return caption;
      }
    }
  }
  
  return null;
}

/**
 * Detect if a TikTok post is sponsored/an ad
 * @param {Element} container
 * @returns {boolean}
 */
function isTikTokSponsored(container) {
  // Check for ad-specific elements (expanded based on TikTok ad formats)
  const adSelectors = [
    '[class*="SpanAdBadge"]',
    '[class*="ad-badge"]',
    '[data-e2e*="ad-"]',
    '[class*="AdContainer"]',
    '[class*="DivPromotedBadge"]',
    '[class*="Promoted"]',
    // Additional TikTok ad selectors
    '[class*="SparkAd"]',
    '[class*="TopViewAd"]',
    '[class*="InFeedAd"]',
    '[class*="BrandedContent"]',
    '[class*="DivAdBadge"]',
    '[class*="ad_badge"]',
    '[data-e2e="ad-badge"]',
    '[data-e2e="sponsored-badge"]',
    // Check for "Sponsored" label in specific locations
    '[class*="DivLabelContainer"] [class*="Sponsored"]',
    '[class*="SpanSponsoredLabel"]'
  ];

  for (const sel of adSelectors) {
    if (safeQuery(container, sel)) {
      console.log('[AlgorithmLens][TikTok] AD DETECTED via selector:', sel);
      return true;
    }
  }

  // Check container and ancestor class names for ad indicators
  const elementsToCheck = [container, container.parentElement, container.parentElement?.parentElement].filter(Boolean);
  for (const el of elementsToCheck) {
    const className = el.className || '';
    if (className.toLowerCase().includes('ad') && (className.includes('Container') || className.includes('Badge') || className.includes('Spark'))) {
      console.log('[AlgorithmLens][TikTok] AD DETECTED via class pattern:', className);
      return true;
    }
  }

  // Check text content in meta areas - look for specific ad indicators
  const metaText = safeText(container)?.slice(0, 500) || '';
  if (containsAdIndicator(metaText)) {
    console.log('[AlgorithmLens][TikTok] AD DETECTED via text indicator');
    return true;
  }

  // Scan for standalone "Sponsored" or "Ad" text labels (like YouTube fix)
  const allSpans = safeQueryAll(container, 'span, div[class*="Label"], div[class*="Badge"]');
  for (const span of allSpans) {
    const directText = span.textContent?.trim().toLowerCase() || '';
    if (directText === 'sponsored' || directText === 'ad' || directText === 'promoted' || directText === 'iklan') {
      console.log('[AlgorithmLens][TikTok] AD DETECTED via label text:', directText);
      return true;
    }
  }

  return false;
}

/**
 * Extract a single TikTok post from its container element
 * @param {Element} container 
 * @param {number} index 
 * @returns {DesktopPostItem|null}
 */
function extractTikTokPost(container, index) {
  const platform = 'tiktok';

  // Skip non-post modules (PYMK, suggestions, etc.)
  if (isNonPostModule(container, platform)) {
    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][TikTok] Container ${index}: REJECTED (non-post module)`);
    }
    return { rejected: true, code: 'NON_POST_MODULE' };
  }

  const creator = extractTikTokCreator(container);
  const caption = extractTikTokCaption(container);
  const isSponsored = isTikTokSponsored(container);

  // Extract hashtags
  const hashtags = extractHashtags(caption);

  // Extract CTA
  const ctaText = extractCTA(container);

  // Extract link - first try generic, then look for video permalink
  let link = extractLink(container);

  // TikTok-specific: Look for video permalink for stable ID
  let tiktokPermalink = null;
  const videoLinkSelectors = [
    'a[href*="/video/"]',
    'a[href*="/@"][href*="/video"]',
  ];
  for (const sel of videoLinkSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const href = el.getAttribute('href') || '';
      if (href.includes('/video/')) {
        tiktokPermalink = href.startsWith('http') ? href : 'https://www.tiktok.com' + href;
        if (!link) link = tiktokPermalink;
        break;
      }
    }
  }

  // Also check window.location for fullscreen video page
  if (!tiktokPermalink && window.location.pathname.includes('/video/')) {
    tiktokPermalink = window.location.href;
    if (!link) link = tiktokPermalink;
  }

  // For ads, try additional link selectors (ads may have different link structure)
  if (!link && isSponsored) {
    const adLinkSelectors = [
      'a[href*="tiktok.com/redirect"]',
      'a[class*="StyledLink"]',
      'a[class*="AdLink"]',
      'a[class*="SparkAd"]',
      'a[href*="click."]',
      // Fallback: any link in the ad container
      'a[href]'
    ];
    for (const sel of adLinkSelectors) {
      const linkEl = safeQuery(container, sel);
      if (linkEl) {
        const href = linkEl.getAttribute('href');
        if (href) {
          link = href.startsWith('http') ? href : 'https://www.tiktok.com' + href;
          if (CAPTURE_DEBUG) {
            debugLog('log', `[CaptureDebug][TikTok] Ad link found via: ${sel}`);
          }
          break;
        }
      }
    }
  }

  // Check for media presence (video or image)
  // Include ad-specific media selectors
  const hasMedia = !!(container.querySelector('video') || container.querySelector('img[src]') || container.querySelector('[class*="AdImage"]'));

  // Generate stable ID - pass tiktokPermalink for video ID extraction
  const postId = generateStableId(platform, creator, caption, container, index, tiktokPermalink);

  // ============================================================================
  // UNIFIED ACCEPTANCE CRITERIA:
  // HARD requirements: stable post identifier (link OR postId with content)
  // SOFT requirements: at least one of (creator, caption, media)
  // EXCEPTION: Ads are accepted with just an identifier (they may use different DOM)
  // ============================================================================
  const hasCreator = !!creator;
  const hasCaption = !!(caption && caption.length > 0);
  const hasLink = !!link;
  const hasStableId = postId && !postId.includes('-idx');

  // Accept if we have:
  // 1. (creator OR caption OR media) AND (link OR stable ID)
  // 2. OR: isSponsored AND (link OR stableId) - ads are valuable even without full content
  const hasIdentity = hasCreator || hasCaption;
  const hasIdentifier = hasLink || hasStableId;
  const isValidPost = ((hasIdentity || hasMedia) && hasIdentifier) || (isSponsored && hasIdentifier);

  // Determine rejection code if invalid
  let rejectionCode = null;
  if (!isValidPost) {
    if (!hasMedia && !hasIdentity) {
      rejectionCode = 'NO_CONTENT';
    } else if (!hasIdentifier) {
      rejectionCode = 'NO_IDENTIFIER';
    } else {
      rejectionCode = 'UNKNOWN';
    }
  }

  if (CAPTURE_DEBUG) {
    const rejectInfo = rejectionCode ? ` [${rejectionCode}]` : '';
    const sponsoredInfo = isSponsored ? ', isSponsored=true' : '';
    debugLog('log', `[CaptureDebug][TikTok] Container ${index}: hasCreator=${hasCreator}, hasCaption=${hasCaption}, hasMedia=${hasMedia}, hasLink=${hasLink}, hasStableId=${hasStableId}${sponsoredInfo} => ${isValidPost ? 'ACCEPTED' : 'REJECTED'}${rejectInfo}`);
  }

  if (isValidPost) {
    return {
      id: postId,
      platform,
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null, // TikTok sponsored detection returns boolean only
      ctaText: ctaText || null,
      link: link || null
    };
  }

  return { rejected: true, code: rejectionCode };
}

/**
 * Scan TikTok feed for posts
 * @returns {DesktopPostItem[]}
 */
function scanTikTokFeed() {
  const platform = 'tiktok';
  const posts = [];
  const issues = [];
  
  console.log('[AlgorithmLens][TikTok] 🔍 Starting scan...');
  console.log(`[AlgorithmLens][TikTok] URL: ${window.location.href}`);
  
  // Primary selectors for TikTok feed items
  // IMPORTANT: Collect from ALL selectors (not just first match) to capture both regular videos AND ads
  const containerSelectors = [
    '[data-e2e="recommend-list-item-container"]',
    '[data-e2e="search-card-video-card"]',
    '[class*="DivItemContainerV2"]',
    '[class*="DivItemContainerForSearch"]',
    '[class*="DivContentContainer"]',
    'div[class*="video-feed-item"]',
    '[class*="DivBrowserModeContainer"]',
    // Ad-specific selectors - TikTok ads may use different containers
    '[data-e2e*="ad-"]',
    '[class*="AdContainer"]',
    '[class*="DivAdContainer"]',
    '[class*="SparkAd"]',
    '[class*="TopViewAd"]',
    '[class*="InFeedAd"]',
    '[class*="DivPromoted"]'
  ];

  let containers = [];
  const usedSelectors = [];

  // Collect containers from ALL selectors (like YouTube fix)
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    if (found.length > 0) {
      containers.push(...found);
      usedSelectors.push(`${selector}(${found.length})`);
    }
  }
  
  // Fallback: find elements containing a video
  if (containers.length === 0) {
    const allVideos = safeQueryAll(document, 'video');
    const videoContainers = new Set();
    for (const video of allVideos) {
      let parent = video.parentElement;
      for (let i = 0; i < 5 && parent; i++) {
        if (parent.innerText?.length > 50) {
          videoContainers.add(parent);
          break;
        }
        parent = parent.parentElement;
      }
    }
    containers = Array.from(videoContainers);
    usedSelectors.push('video-parent-fallback');
  }

  console.log(`[AlgorithmLens][TikTok] Found raw containers: ${containers.length} [${usedSelectors.join(', ')}]`);

  // Filter out navigation/header/empty containers
  // IMPORTANT: Preserve ad containers even if they don't meet standard criteria
  containers = containers.filter(el => {
    const text = el.innerText || '';
    const hasVideo = !!el.querySelector('video');
    const hasContent = text.length > 30 || hasVideo;
    const notHeader = !el.closest('header') && !el.closest('nav');

    // Check if this is an ad container (preserve ads even without standard content)
    const className = el.className || '';
    const dataE2e = el.getAttribute('data-e2e') || '';
    const isAdContainer = className.toLowerCase().includes('ad') ||
                          className.includes('Promoted') ||
                          className.includes('SparkAd') ||
                          dataE2e.includes('ad');

    return (hasContent && notHeader) || isAdContainer;
  });

  console.log(`[AlgorithmLens][TikTok] After empty filter: ${containers.length} containers`);
  
  // Deduplicate nested containers
  const uniqueContainers = [];
  const seen = new WeakSet();
  
  for (const container of containers) {
    let isDuplicate = false;
    let parent = container.parentElement;
    while (parent) {
      if (seen.has(parent)) {
        isDuplicate = true;
        break;
      }
      parent = parent.parentElement;
    }
    
    if (!isDuplicate) {
      uniqueContainers.push(container);
      seen.add(container);
    }
  }
  
  containers = uniqueContainers;
  console.log(`[AlgorithmLens][TikTok] After deduplication: ${containers.length} containers`);

  // Track rejection code histogram
  const rejectionCounts = {};

  containers.forEach((container, index) => {
    try {
      const result = extractTikTokPost(container, index);

      // Check if result is a rejection object
      if (result && result.rejected) {
        const code = result.code || 'UNKNOWN';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code, error: result.error || null });
      } else if (result) {
        posts.push(result);
      } else {
        const code = 'NULL_RESULT';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code });
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][TikTok] Error parsing container ${index}:`, err.message);
      const code = 'PARSE_ERROR';
      rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
      issues.push({ index, issue: code, error: err.message });
    }
  });

  // === DETAILED LOGGING ===
  console.log(`[AlgorithmLens][TikTok] Final posts extracted: ${posts.length}`);

  if (posts.length > 0) {
    console.table(posts.slice(0, 20).map(p => ({
      id: (p.id || '').slice(0, 25),
      creator: (p.creator || '—').slice(0, 20),
      captionSample: p.caption ? p.caption.slice(0, 60) + '...' : '—',
      isSponsored: p.isSponsored ? '✓ AD' : '',
      hasCTA: p.ctaText ? '✓' : '',
      link: p.link ? '✓' : ''
    })));
  }

  logScanResults('TikTok', posts, issues, containers.length, rejectionCounts);

  return posts;
}

// ============================================================================
// INSTAGRAM SCANNER
// ============================================================================

/**
 * Extract creator name from an Instagram post container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractInstagramCreator(container) {
  // Note: Instagram no longer uses semantic <header> elements (as of Jan 2026)
  // Prioritize class-based selectors over header-based ones
  const creatorSelectors = [
    'a[class*="notranslate"]',        // Primary: Creator links have notranslate class
    'a[class*="_a6hd"]',              // Alternative Instagram link class
    'span[class*="_aap6"] a',         // Legacy selector
    'a[role="link"][tabindex="0"]',   // Generic role-based selector
    'header a[href^="/"]',            // Legacy: header-based (if header exists)
    'header a[href*="/"]'             // Legacy: header-based fallback
  ];
  
  for (const sel of creatorSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      let creator = safeText(el);
      if (!creator) {
        const href = el.getAttribute('href') || '';
        if (href.startsWith('/')) {
          creator = href.replace(/\//g, '').split('?')[0];
        }
      }
      // Valid creator: no spaces, reasonable length
      if (creator && !creator.includes(' ') && creator.length > 0 && creator.length < 50) {
        if (isValidCreator(creator)) {
          return creator;
        }
      }
    }
  }
  
  // Fallback: Check aria-labels
  const ariaLinks = safeQueryAll(container, 'a[aria-label]');
  for (const link of ariaLinks) {
    const label = link.getAttribute('aria-label') || '';
    const match = label.match(/^([^']+)'s? profile/i);
    if (match && match[1]) {
      const name = match[1].trim();
      if (isValidCreator(name)) {
        return name;
      }
    }
  }

  // ============================================================================
  // REELS FALLBACK: Fullscreen Reels have creator in floating overlay
  // ============================================================================
  if (isInstagramReels()) {
    const REELS_EXCLUDED_PATHS = [
      '/reel/', '/reels/', '/explore/', '/p/', '/accounts/',
      '/stories/', '/direct/', '/audio/', '/tv/'
    ];

    // Find all anchor elements with href starting with /
    const allAnchors = safeQueryAll(container, 'a[href^="/"]');
    const candidates = [];

    for (const anchor of allAnchors) {
      try {
        const href = anchor.getAttribute('href') || '';
        // Match pattern: starts with /, has username segment, optionally ends with /
        const usernameMatch = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
        if (usernameMatch && usernameMatch[1]) {
          const username = usernameMatch[1];
          // Exclude reserved paths
          const isExcluded = REELS_EXCLUDED_PATHS.some(p => href.startsWith(p));
          if (!isExcluded && isValidCreator(username)) {
            candidates.push({ username, source: 'href', selector: anchor.tagName });
          }
        }
      } catch (e) {
        // Defensive: skip this anchor
      }
    }

    // Choose first valid candidate
    const chosen = candidates.length > 0 ? candidates[0] : null;

    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Instagram][Reels] Creator fallback candidates: ${candidates.length}, chosen: ${chosen?.username || 'null'}, source: ${chosen?.source || 'none'}`);
    }

    if (chosen) {
      return chosen.username;
    }
  }

  return null;
}

/**
 * Extract caption from an Instagram post container
 * @param {Element} container
 * @returns {string|null}
 */
function extractInstagramCaption(container) {
  const onReelsPage = isInstagramReels();

  // Reels-specific caption selectors (different DOM structure)
  if (onReelsPage) {
    // Reels captions are in an overlay area, often NOT inside the video container
    // Try multiple strategies to find the caption

    // Strategy 1: Look in the container itself
    const reelsCaptionSelectors = [
      // Primary: Caption spans with specific Instagram classes
      'span[class*="_ap3a"]',
      'span[class*="_aaco"]',
      // Caption text area (usually near bottom, with hashtags)
      'div[class*="x1n2onr6"] > span[dir="auto"]',
      // Caption in overlay area
      'div[class*="x78zum5"] span[dir="auto"]',
      'div[class*="xdt5ytf"] span[dir="auto"]',
    ];

    // Strategy 2: If container search fails, try page-level search for visible caption
    // This helps when caption overlay is outside the video container
    const pageLevelCaptionSelectors = [
      // Bottom overlay caption area
      'div[class*="x1n2onr6"][class*="x78zum5"] span[dir="auto"]',
      'div[class*="xjbqb8w"] span[dir="auto"]',
      // Caption near creator info
      'div[class*="x6s0dn4"] > span[dir="auto"]:not([class*="notranslate"])',
    ];

    // Elements to EXCLUDE from caption search (other creator cards, suggestions, etc.)
    const excludeSelectors = [
      'a[href^="/"]', // Creator name links
      'header', // Header area
      'nav', // Navigation
      'button', // Buttons
      '[role="button"]',
      // Specific Instagram UI elements
      'div[class*="suggested"]',
      // Username/creator elements
      'span[class*="notranslate"]',
      'span[class*="_aap6"]',
    ];

    // Collect all candidates and score them
    const candidates = [];
    for (const sel of reelsCaptionSelectors) {
      const els = safeQueryAll(container, sel);
      for (const el of els) {
        // Skip if element is inside excluded areas
        const isExcluded = excludeSelectors.some(excl => el.closest(excl));
        if (isExcluded) continue;

        const text = safeText(el);
        if (text && text.length > 10 && isValidCaption(text)) {
          // Score based on content quality indicators
          let score = 0;

          // Strong positive: Has hashtags (very indicative of real caption)
          if (text.includes('#')) score += 100;
          // Positive: Has mentions
          if (text.includes('@')) score += 30;
          // Positive: Has punctuation (real sentences)
          if (/[.!?]/.test(text)) score += 20;
          // Positive: Moderate length (not too short, not too long)
          if (text.length >= 20 && text.length <= 300) score += 50;
          if (text.length > 300) score += 30; // Still good but penalize very long
          // Negative: Looks like username or short handle
          if (text.match(/^@?\w+$/) && text.length < 20) score -= 200;
          // Negative: Contains other creator handles (likely wrong element)
          if (text.match(/@[a-z0-9._]+\s*@[a-z0-9._]+/i)) score -= 100;
          // Negative: Starts with common non-caption patterns
          if (text.toLowerCase().startsWith('instagram')) score -= 200;
          if (text.toLowerCase().startsWith('suggested')) score -= 200;
          if (text.toLowerCase().startsWith('original audio')) score -= 200;

          candidates.push({ text, score, selector: sel });
        }
      }
    }

    // Return the highest-scoring candidate (must have positive score)
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      if (CAPTURE_DEBUG) {
        debugLog('log', `[CaptureDebug][Instagram][Reels] Caption candidates from container: ${candidates.length}, top: score=${candidates[0].score}, text="${candidates[0].text.slice(0, 50)}..."`);
      }
      if (candidates[0].score > 0) {
        return candidates[0].text;
      }
    }

    // Strategy 2: Try page-level search if container search failed
    // Reels caption overlay might be outside the video container
    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Instagram][Reels] Container search failed, trying page-level search...`);
    }

    for (const sel of pageLevelCaptionSelectors) {
      const els = safeQueryAll(document, sel);
      for (const el of els) {
        const isExcluded = excludeSelectors.some(excl => el.closest(excl));
        if (isExcluded) continue;

        const text = safeText(el);
        if (text && text.length > 15 && isValidCaption(text)) {
          // Must have clear caption indicators (hashtag, punctuation, or good length)
          const hasHashtag = text.includes('#');
          const hasPunctuation = /[.!?]/.test(text);
          const isGoodLength = text.length >= 30;
          const looksLikeUsername = text.match(/^@?\w+$/) && text.length < 25;

          if (!looksLikeUsername && (hasHashtag || hasPunctuation || isGoodLength)) {
            if (CAPTURE_DEBUG) {
              debugLog('log', `[CaptureDebug][Instagram][Reels] Page-level caption found: "${text.slice(0, 50)}..."`);
            }
            return text;
          }
        }
      }
    }

    // IMPORTANT: For Reels, if no valid caption found, return null
    // Do NOT fall through to feed selectors which will incorrectly pick up usernames
    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Instagram][Reels] No valid caption found, returning null (avoiding feed selector fallback)`);
    }
    return null;
  }

  // Regular feed selectors (NOT used for Reels - see early return above)
  // Note: Instagram frequently changes class names. _ap3a is current (Jan 2026), _a9zs/_aacl are legacy.
  const captionSelectors = [
    'span[class*="_ap3a"]',           // Current Instagram caption class (Jan 2026)
    'div[class*="_a9zs"]',            // Legacy caption class
    'span[class*="_aacl"]',           // Legacy caption class
    'span[class*="_aade"]',           // Alternative caption class pattern
    'ul li span[dir="auto"]',         // Caption in comment-style list
    'div[class*="x1vvkbs"]',          // Generic content class
    'span[dir="auto"]'                // Fallback for any auto-direction text
  ];

  for (const sel of captionSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const caption = safeText(el);
      if (caption && caption.length > 10 && isValidCaption(caption)) {
        return caption;
      }
    }
  }

  // Fallback: Find divs with substantial text that aren't inside links
  const textDivs = safeQueryAll(container, 'div[dir="auto"], span[dir="auto"]');
  for (const div of textDivs) {
    if (div.closest('a')) continue; // Skip if inside a link
    // Skip if inside a button (likely UI element)
    if (div.closest('button')) continue;
    // Skip if it's in the header area (usually username, not caption)
    if (div.closest('header')) continue;
    const text = safeText(div);
    if (text && text.length > 20 && isValidCaption(text)) {
      return text;
    }
  }

  return null;
}

/**
 * Detect if an Instagram post is sponsored/an ad
 * @param {Element} container 
 * @returns {{isSponsored: boolean, evidence: object|null}}
 */
function isInstagramSponsored(container) {
  try {
    // Get full container text for pattern matching
    // Note: Instagram no longer uses semantic <header> elements (as of Jan 2026)
    const fullText = (container.innerText || container.textContent || '').toLowerCase();
    const textSlice = fullText.slice(0, 2000); // Check first 2000 chars

    // PRIMARY CHECK: Look for "Paid partnership with" anywhere in the post
    // This is the most reliable indicator on modern Instagram
    if (/paid partnership with\b/.test(textSlice)) {
      console.debug('[AlgorithmLens][Instagram] Sponsored detected via paid partnership text');
      return {
        isSponsored: true,
        evidence: { strategy: 'paidPartnership', matchedPattern: 'paid partnership with' }
      };
    }

    // Check for "Sponsored" label text
    if (/\bsponsored\b/.test(textSlice) && !/show fewer posts like this/.test(textSlice)) {
      // Make sure "sponsored" isn't part of the "show fewer posts" menu
      console.debug('[AlgorithmLens][Instagram] Sponsored detected via sponsored text');
      return {
        isSponsored: true,
        evidence: { strategy: 'sponsoredText', matchedPattern: 'sponsored' }
      };
    }

    // Check for sponsored badge via aria-label selectors
    const sponsoredSelectors = [
      '[aria-label*="Sponsored"]',
      '[aria-label*="sponsored"]',
      '[aria-label*="Paid partnership"]'
    ];

    for (const sel of sponsoredSelectors) {
      if (safeQuery(container, sel)) {
        console.debug('[AlgorithmLens][Instagram] Sponsored detected via selector:', sel);
        return {
          isSponsored: true,
          evidence: { strategy: 'selector', selector: sel }
        };
      }
    }

    // Legacy: Check header if it exists (older Instagram layouts)
    const headerEl = safeQuery(container, 'header');
    if (headerEl) {
      const headerText = safeText(headerEl) || '';
      if (containsAdIndicator(headerText) ||
          headerText.toLowerCase().includes('paid partnership')) {
        console.debug('[AlgorithmLens][Instagram] Sponsored detected via header text');
        return {
          isSponsored: true,
          evidence: { strategy: 'headerText', matchedText: headerText.slice(0, 100) }
        };
      }
    }

    return { isSponsored: false, evidence: null };
  } catch (error) {
    // Defensive: if ad detection fails, assume not sponsored
    console.warn('[AlgorithmLens][Instagram] Error in isInstagramSponsored:', error);
    return { isSponsored: false, evidence: null };
  }
}

/**
 * Extract a single Instagram post from its container element
 * @param {Element} container 
 * @param {number} index 
 * @returns {DesktopPostItem|null}
 */
function extractInstagramPost(container, index) {
  const platform = 'instagram';

  try {
    // Skip non-post modules (suggestions, explore, etc.)
    if (isNonPostModule(container, platform)) {
      if (CAPTURE_DEBUG) {
        debugLog('log', `[CaptureDebug][Instagram] Container ${index}: REJECTED (non-post module)`);
      }
      return { rejected: true, code: 'NON_POST_MODULE' };
    }

    // Skip posts that haven't been viewed yet (pre-loaded below viewport)
    // This prevents capturing posts the user hasn't actually seen
    // EXCEPTION: Skip this check for observer-detected posts (index === -1)
    // because these have already been verified as in-viewport by either:
    // - IntersectionObserver (captures when post enters viewport)
    // - MutationObserver viewport check (captures immediately if already visible)
    const isObserverDetected = index === -1;
    if (!isObserverDetected && !hasBeenViewed(container)) {
      if (CAPTURE_DEBUG) {
        debugLog('log', `[CaptureDebug][Instagram] Container ${index}: REJECTED (not yet viewed - below viewport)`);
      }
      return { rejected: true, code: 'NOT_YET_VIEWED' };
    }

    // Extract fields with fallback selectors
    let creator = extractInstagramCreator(container);
    let caption = extractInstagramCaption(container);
    let link = extractLink(container);

    // Fallback: Try to extract permalink if link not found
    if (!link) {
      // Try multiple permalink patterns - comprehensive list for Instagram's changing DOM
      const permalinkSelectors = [
        'a[href*="/p/"]',
        'a[href*="/reel/"]',
        'a[href*="/tv/"]',
        'time[datetime]', // Often has parent link
        'a[href*="instagram.com/p/"]',
        'a[href*="instagram.com/reel/"]',
        // Timestamp links (usually lead to post)
        'header time',
        'header a time',
        // Comment count links often point to post
        'a[href*="/comments/"]',
        // Like button area sometimes has post link
        'section a[href*="/p/"]',
        'section a[href*="/reel/"]',
      ];
      for (const sel of permalinkSelectors) {
        const el = safeQuery(container, sel);
        if (el) {
          // Check if element itself is a link or has parent link
          const linkEl = el.tagName === 'A' ? el : el.closest('a');
          if (linkEl) {
            const href = linkEl.getAttribute('href') || '';
            if (href && (href.includes('/p/') || href.includes('/reel/') || href.includes('/tv/'))) {
              link = href.startsWith('http') ? href : `https://www.instagram.com${href}`;
              break;
            }
          }
        }
      }

      // Additional fallback: scan ALL links in container for Instagram post patterns
      if (!link) {
        const allLinks = safeQueryAll(container, 'a[href]');
        for (const linkEl of allLinks) {
          const href = linkEl.getAttribute('href') || '';
          // Match Instagram post URL patterns
          if (href.match(/\/(p|reel|tv)\/[A-Za-z0-9_-]+/)) {
            link = href.startsWith('http') ? href : `https://www.instagram.com${href}`;
            break;
          }
        }
      }
    }

    // Fallback: Try additional creator selectors
    if (!creator) {
      const creatorFallbacks = [
        'header a[href^="/"]',
        'a[href*="/"][href*="instagram.com"]',
        'span[dir="auto"] a[href^="/"]',
        'a[role="link"] span', // Username spans inside links
      ];
      for (const sel of creatorFallbacks) {
        const el = safeQuery(container, sel);
        if (el) {
          // Try text first
          let candidate = safeText(el);
          // If no text, try extracting from href
          if (!candidate) {
            const href = (el.getAttribute('href') || el.closest('a')?.getAttribute('href')) || '';
            const match = href.match(/^\/([^/?]+)/);
            if (match && match[1] && !match[1].includes('p') && !match[1].includes('reel')) {
              candidate = match[1];
            }
          }
          if (candidate && isValidCreator(candidate)) {
            creator = candidate;
            break;
          }
        }
      }
    }

    // Safe ad detection with try/catch
    let sponsoredResult;
    try {
      sponsoredResult = isInstagramSponsored(container);
    } catch (error) {
      console.warn('[AlgorithmLens][Instagram] Error detecting sponsored status:', error);
      sponsoredResult = { isSponsored: false, evidence: null };
    }
    const isSponsored = sponsoredResult.isSponsored;
    const sponsoredEvidence = sponsoredResult.evidence;

    // Extract hashtags using multiple methods
    // Instagram uses /explore/tags/foo for hashtag links
    let hashtags = [];

    // Method 1: Links with /explore/tags/ or /tags/ in href
    const hashtagSelectors = [
      'a[href*="/explore/tags/"]',
      'a[href*="/tags/"]'
    ];
    for (const sel of hashtagSelectors) {
      const els = safeQueryAll(container, sel);
      for (const el of els) {
        // First try text content
        let tag = safeText(el);
        if (tag && tag.startsWith('#')) {
          hashtags.push(tag);
          continue;
        }
        // Extract from href if text doesn't have #
        const href = el.getAttribute('href') || '';
        const match = href.match(/\/(?:explore\/)?tags\/([^/?]+)/);
        if (match && match[1]) {
          hashtags.push('#' + decodeURIComponent(match[1]));
          continue;
        }
        // Return text even without # prefix if it looks like a hashtag
        if (tag && !tag.includes(' ') && tag.length > 0 && tag.length < 50) {
          hashtags.push('#' + tag);
        }
      }
    }

    // Method 2: Find links whose text content starts with # (visual hashtag detection)
    if (hashtags.length === 0) {
      const allLinks = safeQueryAll(container, 'a');
      for (const el of allLinks) {
        const text = safeText(el) || '';
        // Match hashtag pattern: starts with #, alphanumeric, no spaces
        if (text.startsWith('#') && text.length > 1 && text.length < 50 && /^#[a-zA-Z0-9_]+$/.test(text)) {
          hashtags.push(text);
        }
      }
    }

    // Method 3: Fall back to caption text extraction (regex-based)
    if (hashtags.length === 0) {
      hashtags = extractHashtags(caption);
    }

    // Deduplicate hashtags
    hashtags = [...new Set(hashtags)];

    if (CAPTURE_DEBUG && hashtags.length > 0) {
      debugLog('log', `[CaptureDebug][Instagram] Hashtags found: ${hashtags.length} - ${hashtags.slice(0, 3).join(', ')}`);
    }

    // Extract CTA
    const ctaText = extractCTA(container);

    // Check for media (video or image, excluding small avatars/icons)
    const hasMedia = (() => {
      // Check for videos first
      const videos = safeQueryAll(container, 'video, video[src], source[src]');
      if (videos.length > 0) return true;

      // Check for images with reasonable size
      const images = safeQueryAll(container, 'img[srcset], img[src]');
      for (const img of images) {
        // Check computed size or natural size or attribute size
        const width = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
        const height = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
        // Exclude small images (likely avatars/icons) - lowered threshold from 100 to 50
        if (width > 50 && height > 50) {
          return true;
        }
        // Also accept if image has srcset (indicates content image)
        if (img.srcset || img.getAttribute('srcset')) {
          return true;
        }
      }
      return false;
    })();

    // Detect if this is a Reels context
    const onReelsPage = isInstagramReels();

    // ============================================================================
    // REELS: Extract Reel ID and permalink from page/container context
    // ============================================================================
    let reelShortcode = null;
    let reelPermalink = null;

    if (onReelsPage) {
      const reelData = extractInstagramReelIdAndPermalink(container);
      reelShortcode = reelData.shortcode;
      reelPermalink = reelData.permalink;

      // Override link with reel permalink if found
      if (reelPermalink && !link) {
        link = reelPermalink;
      }
    }

    // Generate stable ID - for Reels, prefer shortcode; otherwise use permalink extraction
    let postId;
    if (onReelsPage && reelShortcode) {
      postId = `instagram-${reelShortcode}`;
    } else {
      postId = generateStableId(platform, creator, caption, container, index, link);
    }

    // ============================================================================
    // UNIFIED ACCEPTANCE CRITERIA
    // For Reels: Accept with media + any identity signal (including stableId/permalink)
    // For Feed: Require (creator OR caption OR media) AND (permalink OR stable ID)
    // ============================================================================
    const hasCreator = !!creator;
    const hasCaption = !!(caption && caption.length > 0);
    const hasPermalink = !!link;
    const hasStableId = postId && !postId.includes('-idx');

    // Extract timestamp for Reels (as alternative identity signal)
    const hasTimestamp = !!safeQuery(container, 'time[datetime]');

    // Determine validity based on context
    let isValidPost = false;

    if (onReelsPage) {
      // REELS: Accept with media AND (stableId OR creator OR caption OR timestamp OR permalink)
      const hasAnyIdentity = hasStableId || hasCreator || hasCaption || hasTimestamp || hasPermalink;
      isValidPost = hasMedia && hasAnyIdentity;

      // LAST RESORT: If ALLOW_REELS_MEDIA_ONLY_FALLBACK is enabled, accept media-only
      if (!isValidPost && ALLOW_REELS_MEDIA_ONLY_FALLBACK && hasMedia) {
        isValidPost = true;
        if (CAPTURE_DEBUG) {
          debugLog('warn', `[CaptureDebug][Instagram][Reels] Container ${index}: ACCEPTED via MEDIA_ONLY_FALLBACK`);
        }
      }
    } else {
      // FEED: Standard validation - (creator OR caption OR media) AND (permalink OR stable ID)
      const hasIdentity = hasCreator || hasCaption || hasMedia;
      const hasIdentifier = hasPermalink || hasStableId;
      isValidPost = hasIdentity && hasIdentifier;
    }

    // ============================================================================
    // STAGE 1 DIAGNOSTICS: Determine rejection code if not valid
    // ============================================================================
    let rejectionCode = null;
    if (!isValidPost) {
      if (onReelsPage) {
        // Reels rejection codes
        if (!hasMedia) {
          rejectionCode = 'REELS_NO_MEDIA';
        } else {
          // Has media but no identity
          rejectionCode = 'REELS_NO_IDENTITY';
        }
      } else {
        // Feed rejection codes
        if (!hasCreator && !hasCaption && !hasMedia) {
          rejectionCode = 'FEED_NO_CONTENT';
        } else if (!hasPermalink && !hasStableId) {
          rejectionCode = 'FEED_NO_IDENTIFIER';
        } else {
          rejectionCode = 'FEED_UNKNOWN';
        }
      }
    }

    if (CAPTURE_DEBUG) {
      const context = onReelsPage ? 'Reels' : 'Feed';
      const idPreview = postId ? postId.slice(0, 30) : 'NO_ID';
      const rejectInfo = rejectionCode ? ` [${rejectionCode}]` : '';
      debugLog('log', `[CaptureDebug][Instagram][${context}] Container ${index}: hasMedia=${hasMedia}, hasCreator=${hasCreator}, hasCaption=${hasCaption}, hasPermalink=${hasPermalink}, hasStableId=${hasStableId}, hasTimestamp=${hasTimestamp}, id="${idPreview}" => ${isValidPost ? 'ACCEPTED' : 'REJECTED'}${rejectInfo}`);
    }

    if (isValidPost) {
      // Log accepted post details for Reels
      if (CAPTURE_DEBUG && onReelsPage) {
        const permalinkSource = reelPermalink ? (reelPermalink.includes(window.location.pathname.split('/')[2] || '') ? 'location' : 'container') : (link ? 'link' : 'none');
        debugLog('log', `[CaptureDebug][Instagram][Reels] ACCEPTED idx=${index}: id="${postId}", creator="${creator || 'missing'}", permalinkSrc=${permalinkSource}, shortcode=${reelShortcode || 'none'}`);
      }
      return {
        id: postId,
        platform,
        platformSubtype: onReelsPage ? 'reels' : 'feed',
        creator: creator || null,
        caption: caption || null,
        hashtags,
        isSponsored: Boolean(isSponsored),
        sponsoredEvidence: sponsoredEvidence || null,
        ctaText: ctaText || null,
        link: link || null
      };
    }

    return { rejected: true, code: rejectionCode };
  } catch (error) {
    // Defensive: log error but don't crash
    console.error(`[AlgorithmLens][Instagram] Error extracting post from container ${index}:`, error);
    if (CAPTURE_DEBUG) {
      debugLog('error', `[CaptureDebug][Instagram] Container ${index}: EXTRACTION ERROR - ${error.message}`);
    }
    return { rejected: true, code: 'PARSE_ERROR', error: error.message };
  }
}

/**
 * Scan Instagram feed for posts
 * @returns {DesktopPostItem[]}
 */
function scanInstagramFeed() {
  const platform = 'instagram';
  const posts = [];
  const issues = [];
  const onReelsPage = isInstagramReels();
  const subtype = onReelsPage ? 'reels' : 'feed';

  console.log('[AlgorithmLens][Instagram] 🔍 Starting scan...');
  console.log(`[AlgorithmLens][Instagram] URL: ${window.location.href}, subtype: ${subtype}`);

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Instagram] Starting scan - URL: ${window.location.href}, subtype: ${subtype}`);
  }

  // ============================================================================
  // STAGE 1 DIAGNOSTICS: Reels-specific container selection
  // ============================================================================
  // Primary selectors - different for Reels vs Feed
  const containerSelectors = onReelsPage ? [
    // Reels-specific selectors (fullscreen video containers)
    'div[class*="x1ned7t2"]', // Reels video wrapper
    'div[class*="xh8yej3"]',  // Reels container
    'section[class*="_aap0"]', // Reels section
    'div[style*="translateX"]', // Carousel-style reels
    'article[role="presentation"]',
    'article',
  ] : [
    // Feed selectors - prioritize article elements which contain complete posts
    'article[role="presentation"]',
    'article',
    // Div fallbacks - only used if articles aren't found
    'div[class*="_aagv"]',
    'div[class*="x1lliihq"][class*="x1n2onr6"]'
  ];

  // Aggregate containers from ALL selectors (don't break early)
  // Then deduplicate to handle overlapping selector results
  const allContainers = [];
  const usedSelectors = [];

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Instagram] Testing ${containerSelectors.length} selector variants...`);
  }

  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    // Filter to only actual posts (containing media)
    let filtered = found.filter(el => el.querySelector('img, video'));

    // For div selectors (fallbacks), escalate to parent article if available
    // This ensures we get complete post containers, not just media wrappers
    if (selector.startsWith('div[')) {
      filtered = filtered.map(el => {
        // Try to find parent article - that's the complete post container
        const parentArticle = el.closest('article');
        if (parentArticle && parentArticle.querySelector('img, video')) {
          return parentArticle;
        }
        // If no parent article, only keep this div if it has header/creator info
        // (indicating it's a complete post container, not just a media wrapper)
        if (el.querySelector('header, a[href^="/"][href$="/"]')) {
          return el;
        }
        return null; // Discard media-only wrappers
      }).filter(Boolean);
    }

    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Instagram] Selector "${selector}": ${found.length} found, ${filtered.length} valid containers`);
    }
    if (filtered.length > 0) {
      allContainers.push(...filtered);
      usedSelectors.push(`${selector}(${filtered.length})`);
    }
  }

  console.log(`[AlgorithmLens][Instagram] Found raw containers: ${allContainers.length} from selectors: [${usedSelectors.join(', ')}]`);

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Instagram] Total containers from all selectors: ${allContainers.length}, Used: [${usedSelectors.join(', ')}]`);
  }

  // Deduplicate: remove exact duplicates and nested containers
  // Use a combination of WeakSet (for nested check) and Set (for exact dedup)
  const uniqueContainers = [];
  const seenElements = new WeakSet();

  for (const container of allContainers) {
    // Skip if we've already added this exact element
    if (seenElements.has(container)) {
      continue;
    }

    // Check if this container is inside another we've already seen
    let isNested = false;
    let parent = container.parentElement;
    while (parent) {
      if (seenElements.has(parent)) {
        isNested = true;
        break;
      }
      parent = parent.parentElement;
    }

    // Also check if any element we've seen is INSIDE this container (reverse nesting)
    // If so, prefer the larger container and remove the smaller one
    if (!isNested) {
      // Check if this container contains any previously seen containers
      const containedPrevious = uniqueContainers.filter(prev => container.contains(prev));
      if (containedPrevious.length > 0) {
        // This container is a parent of previous containers - remove the children, keep the parent
        for (const child of containedPrevious) {
          const idx = uniqueContainers.indexOf(child);
          if (idx !== -1) {
            uniqueContainers.splice(idx, 1);
          }
        }
      }

      uniqueContainers.push(container);
      seenElements.add(container);
    }
  }

  let containers = uniqueContainers;
  console.log(`[AlgorithmLens][Instagram] After deduplication: ${containers.length} containers`);
  
  // Track rejection code histogram
  const rejectionCounts = {};

  containers.forEach((container, index) => {
    try {
      const result = extractInstagramPost(container, index);

      // Check if result is a rejection object
      if (result && result.rejected) {
        const code = result.code || 'UNKNOWN';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code, error: result.error || null });
      } else if (result) {
        // Valid post
        posts.push(result);
      } else {
        // Null result (shouldn't happen with new code, but handle gracefully)
        const code = 'NULL_RESULT';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code });
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][Instagram] Error parsing container ${index}:`, err.message);
      const code = 'OUTER_PARSE_ERROR';
      rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
      issues.push({ index, issue: code, error: err.message });
      if (CAPTURE_DEBUG) {
        debugLog('error', `[CaptureDebug][Instagram] Container ${index}: OUTER ERROR - ${err.message}`);
      }
    }
  });
  
  // === DETAILED LOGGING ===
  console.log(`[AlgorithmLens][Instagram] Final posts extracted: ${posts.length}`);
  
  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Instagram] Scan complete - Total posts extracted: ${posts.length}, Issues: ${issues.length}`);
    debugLog('log', `[CaptureDebug][Instagram] Posts successfully extracted: ${posts.length} out of ${containers.length} containers`);
  }
  
  if (posts.length > 0) {
    console.table(posts.slice(0, 20).map(p => ({
      id: (p.id || '').slice(0, 25),
      creator: (p.creator || '—').slice(0, 20),
      captionSample: p.caption ? p.caption.slice(0, 60) + '...' : '—',
      isSponsored: p.isSponsored ? '✓ AD' : '',
      hasCTA: p.ctaText ? '✓' : '',
      link: p.link ? '✓' : ''
    })));
  }

  logScanResults('Instagram', posts, issues, containers.length, rejectionCounts, subtype);

  return posts;
}

// ============================================================================
// YOUTUBE SCANNER
// ============================================================================

/**
 * Extract creator/channel name from a YouTube video container
 * @param {Element} container
 * @param {boolean} isShorts - Whether this is a Shorts video
 * @returns {string|null}
 */
function extractYouTubeCreator(container, isShorts = false) {
  // Shorts-specific selectors first (different DOM structure)
  const shortsCreatorSelectors = [
    'ytd-reel-video-renderer #channel-name',
    'ytd-reel-video-renderer .ytd-channel-name',
    '#channel-name yt-formatted-string',
    '.reel-header-endpoint',
    '[class*="channel-name"]',
    // Shorts often have the channel in the overlay
    'ytd-reel-player-overlay-renderer #channel-name',
    '.ReelPlayerHeaderRenderer a[href*="/@"]'
  ];

  // Regular feed selectors
  const regularCreatorSelectors = [
    '#channel-name a',
    'ytd-channel-name a',
    '#text.ytd-channel-name',
    '#owner-text a',
    'a[href*="/@"]',
    'ytd-channel-name #text',
    '#channel-info a',
    '.ytd-channel-name a'
  ];

  const creatorSelectors = isShorts
    ? [...shortsCreatorSelectors, ...regularCreatorSelectors]
    : regularCreatorSelectors;

  for (const sel of creatorSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      let creator = safeText(el);
      if (!creator) {
        // Try extracting from href
        const href = el.getAttribute('href') || '';
        const match = href.match(/\/@([^/?]+)/);
        if (match) creator = match[1];
      }
      if (creator && creator.length > 0 && isValidCreator(creator)) {
        return creator;
      }
    }
  }

  // For Shorts, also try to find any link to a channel
  if (isShorts) {
    const allLinks = safeQueryAll(container, 'a[href*="/@"]');
    for (const link of allLinks) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\/@([^/?]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Extract title/caption from a YouTube video container
 * @param {Element} container
 * @param {boolean} isShorts - Whether this is a Shorts video
 * @returns {string|null}
 */
function extractYouTubeCaption(container, isShorts = false) {
  // Shorts-specific caption selectors (Shorts have title in overlay or metadata)
  const shortsCaptionSelectors = [
    'h2.title',
    'yt-formatted-string.title',
    '#title yt-formatted-string',
    '.reel-title-text',
    'ytd-reel-video-renderer h2',
    '[class*="reel-title"]',
    // Shorts description/title is often in the overlay
    'ytd-reel-player-overlay-renderer #title',
    '.ReelTitleContainer yt-formatted-string',
    '#short-title',
    // Sometimes the title is in accessibility elements
    '[aria-label]'
  ];

  // Regular feed title selectors
  const regularTitleSelectors = [
    '#video-title',
    'h3 a',
    '[id="video-title"]',
    'ytd-video-meta-block h3',
    '.title',
    'h3#video-title',
    'yt-formatted-string#video-title'
  ];

  const titleSelectors = isShorts
    ? [...shortsCaptionSelectors, ...regularTitleSelectors]
    : regularTitleSelectors;

  for (const sel of titleSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      // For aria-label, get the attribute value
      if (sel === '[aria-label]') {
        const ariaLabel = el.getAttribute('aria-label') || '';
        if (ariaLabel && ariaLabel.length > 10 && isValidCaption(ariaLabel)) {
          return ariaLabel;
        }
        continue;
      }

      const caption = safeText(el);
      if (caption && caption.length > 3 && isValidCaption(caption)) {
        return caption;
      }
    }
  }

  // For Shorts, try to get title from the page title or URL context
  if (isShorts) {
    // Check for any yt-formatted-string with substantial text
    const formattedStrings = safeQueryAll(container, 'yt-formatted-string');
    for (const fs of formattedStrings) {
      const text = safeText(fs);
      // Skip channel names (usually short) and look for longer titles
      if (text && text.length > 15 && isValidCaption(text)) {
        // Make sure it's not a channel name (doesn't start with @)
        if (!text.startsWith('@')) {
          return text;
        }
      }
    }
  }

  return null;
}

/**
 * Detect if a YouTube video is a promoted/ad video
 * @param {Element} container
 * @param {boolean} isShorts - Whether this is a Shorts video
 * @returns {boolean}
 */
function isYouTubeSponsored(container, isShorts = false) {
  // Check for ad renderer wrappers (various YouTube ad formats)
  const adSelectors = [
    'ytd-ad-slot-renderer',
    '.ytd-ad-slot-renderer',
    'ytd-display-ad-renderer',
    'ytd-promoted-sparkles-text-search-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-video-renderer',
    '[class*="ad-badge"]',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-action-companion-ad-renderer',
    'ytd-banner-promo-renderer',
    'ytd-video-masthead-ad-v3-renderer',
    '[is-search-promoted]',
    '[data-ad]',
    // Shorts-specific ad containers
    'ytd-reel-player-overlay-renderer[is-ad]',
    '[is-ad-video]'
  ];

  for (const sel of adSelectors) {
    if (container.closest(sel) || safeQuery(container, sel)) {
      console.log('[AlgorithmLens][YouTube] AD DETECTED via selector:', sel);
      return true;
    }
  }

  // Check if container itself IS an ad renderer element
  const tagName = container.tagName?.toLowerCase() || '';
  if (tagName.includes('ad-') || tagName.includes('-ad')) {
    console.log('[AlgorithmLens][YouTube] AD DETECTED via tag name:', tagName);
    return true;
  }

  // Check badge text - search for various ad indicators
  const badgeSelectors = [
    'span.ytd-badge-supported-renderer',
    '[class*="badge"]',
    '#badge',
    'ytd-badge-supported-renderer',
    '.badge-style-type-ad',
    // Additional badge selectors for search results
    '#byline-container [class*="badge"]',
    '#metadata [class*="badge"]',
    '#meta [class*="badge"]',
    '.ytd-badge-supported-renderer span'
  ];

  for (const badgeSel of badgeSelectors) {
    const badges = safeQueryAll(container, badgeSel);
    for (const badgeEl of badges) {
      const badgeText = (safeText(badgeEl) || '').toLowerCase().trim();
      if (badgeText === 'ad' || badgeText === 'sponsored' || badgeText.includes('promoted')) {
        console.log('[AlgorithmLens][YouTube] AD DETECTED via badge text:', badgeText);
        return true;
      }
    }
  }

  // CRITICAL: Scan all text nodes in the container for standalone "Ad" or "Sponsored" labels
  // YouTube often puts these in small spans that are hard to target with selectors
  const allSpans = safeQueryAll(container, 'span');
  for (const span of allSpans) {
    // Only check direct text content (not nested elements)
    const directText = Array.from(span.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent.trim())
      .join('');

    if (directText.toLowerCase() === 'ad' || directText.toLowerCase() === 'sponsored') {
      console.log('[AlgorithmLens][YouTube] AD DETECTED via span text:', directText);
      return true;
    }
  }

  // Check for "Sponsored" text in metadata area (common in search results)
  const metadataSelectors = ['#metadata', '#meta', '#byline-container', '.ytd-video-meta-block'];
  for (const metaSel of metadataSelectors) {
    const metaEl = safeQuery(container, metaSel);
    if (metaEl) {
      const metaText = (metaEl.innerText || '').toLowerCase();
      if (metaText.includes('sponsored') || /\bad\b/.test(metaText)) {
        console.log('[AlgorithmLens][YouTube] AD DETECTED via metadata text in:', metaSel);
        return true;
      }
    }
  }

  // Check for ad metadata attributes on container and ancestors
  const elementsToCheck = [container, container.parentElement, container.parentElement?.parentElement].filter(Boolean);
  for (const el of elementsToCheck) {
    if (el.hasAttribute('is-promoted') || el.hasAttribute('data-promoted') ||
        el.hasAttribute('is-ad') || el.getAttribute('class')?.includes('promoted')) {
      console.log('[AlgorithmLens][YouTube] AD DETECTED via attribute on element');
      return true;
    }
  }

  // Shorts-specific: Check for ad overlay or indicators
  if (isShorts) {
    const adOverlay = safeQuery(container, '[class*="ad-overlay"], [class*="promoted"]');
    if (adOverlay) {
      console.log('[AlgorithmLens][YouTube] AD DETECTED via Shorts overlay');
      return true;
    }
  }

  return false;
}

/**
 * Extract a single YouTube video from its container element
 * @param {Element} container 
 * @param {number} index 
 * @param {boolean} isShorts 
 * @returns {DesktopPostItem|null}
 */
function extractYouTubePost(container, index, isShorts) {
  const platform = 'youtube';

  // ============================================================================
  // AD WRAPPER UNWRAPPING: ytd-ad-slot-renderer is a wrapper element
  // The actual video content (title, channel, thumbnail) is nested inside
  // We need to find the inner renderer to extract content properly
  // ============================================================================
  const tagName = container.tagName?.toLowerCase() || '';
  if (tagName === 'ytd-ad-slot-renderer' || tagName.includes('ad-slot') || tagName.includes('-ad-')) {
    // Look for nested video renderer elements that contain the actual content
    const nestedVideoSelectors = [
      'ytd-promoted-video-renderer',
      'ytd-promoted-sparkles-web-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-video-renderer',
      'ytd-rich-item-renderer',
      '[id="dismissible"]' // Common inner wrapper that contains video info
    ];

    for (const sel of nestedVideoSelectors) {
      const nested = safeQuery(container, sel);
      if (nested) {
        if (CAPTURE_DEBUG) {
          debugLog('log', `[CaptureDebug][YouTube] Container ${index}: Ad wrapper ${tagName} -> unwrapped to ${sel}`);
        }
        container = nested; // Use the nested element instead
        break;
      }
    }
  }

  // Skip non-post modules (playlists, mixes, channel suggestions, etc.)
  if (isNonPostModule(container, platform)) {
    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][YouTube] Container ${index}: REJECTED (non-post module)`);
    }
    return { rejected: true, code: 'NON_POST_MODULE' };
  }

  const creator = extractYouTubeCreator(container, isShorts);
  const caption = extractYouTubeCaption(container, isShorts);
  const isSponsored = isYouTubeSponsored(container, isShorts);

  // Extract hashtags
  const hashtags = extractHashtags(caption);

  // Extract CTA
  const ctaText = extractCTA(container);

  // Extract link and video ID
  // Try standard video selectors first
  let linkEl = safeQuery(container, 'a#thumbnail, a[href*="/watch"], a[href*="/shorts"]');
  let link = linkEl?.getAttribute('href') || null;

  // For ads, try additional link selectors (ads have different DOM structure)
  if (!link && isSponsored) {
    // Try ad-specific link selectors
    const adLinkSelectors = [
      'a[href*="googleadservices"]',
      'a[href*="youtube.com/redirect"]',
      'a.ytd-display-ad-renderer',
      '#website-text a',
      '#action-button a',
      'a[aria-label]',
      // Fallback: any link in the ad container
      'a[href]'
    ];
    for (const sel of adLinkSelectors) {
      linkEl = safeQuery(container, sel);
      if (linkEl) {
        link = linkEl.getAttribute('href');
        if (link) {
          if (CAPTURE_DEBUG) {
            debugLog('log', `[CaptureDebug][YouTube] Ad link found via: ${sel}`);
          }
          break;
        }
      }
    }
  }

  if (link && !link.startsWith('http')) {
    link = 'https://www.youtube.com' + link;
  }

  // For Shorts, also check current URL for video ID
  if (isShorts && !link && window.location.pathname.includes('/shorts/')) {
    link = window.location.href;
  }

  // Extract video ID for stable ID (use helper function)
  const videoId = extractYouTubeVideoId(link);

  // Check for media presence (thumbnail or video)
  // Include ad-specific media selectors
  const hasMedia = !!(container.querySelector('img#img, ytd-thumbnail img, video, img[src*="ytimg"], img[src*="ggpht"], .ytd-display-ad-renderer img'));

  // Generate stable ID - pass link for video ID extraction
  const postId = videoId ? `${platform}-${videoId}` : generateStableId(platform, creator, caption, container, index, link);

  // ============================================================================
  // UNIFIED ACCEPTANCE CRITERIA:
  // HARD requirements: stable post identifier (videoId OR link)
  // SOFT requirements: at least one of (creator, caption, media)
  // EXCEPTION: Ads are accepted with just an identifier (they use different DOM)
  // ============================================================================
  const hasCreator = !!creator;
  const hasCaption = !!caption;
  const hasLink = !!link;
  const hasVideoId = !!videoId;
  const hasStableId = postId && !postId.includes('-idx');

  // Accept if we have:
  // 1. (creator OR caption OR media) AND (videoId OR link OR stableId)
  // 2. OR: isSponsored AND (videoId OR link) - ads are valuable even without full content
  //    (YouTube in-feed ads use different DOM structure, so content extraction often fails)
  const hasIdentity = hasCreator || hasCaption || hasMedia;
  const hasIdentifier = hasVideoId || hasLink || hasStableId;
  const isValidPost = (hasIdentity && hasIdentifier) || (isSponsored && (hasVideoId || hasLink));

  // Determine rejection code if invalid
  let rejectionCode = null;
  if (!isValidPost) {
    if (!hasIdentity) {
      rejectionCode = 'NO_CONTENT';
    } else if (!hasIdentifier) {
      rejectionCode = 'NO_IDENTIFIER';
    } else {
      rejectionCode = 'UNKNOWN';
    }
  }

  if (CAPTURE_DEBUG) {
    const rejectInfo = rejectionCode ? ` [${rejectionCode}]` : '';
    const sponsoredInfo = isSponsored ? ', isSponsored=true' : '';
    const linkInfo = hasLink ? ', hasLink=true' : '';
    debugLog('log', `[CaptureDebug][YouTube] Container ${index}: hasCreator=${hasCreator}, hasCaption=${hasCaption}, hasMedia=${hasMedia}, hasVideoId=${hasVideoId}, hasStableId=${hasStableId}${sponsoredInfo}${linkInfo} => ${isValidPost ? 'ACCEPTED' : 'REJECTED'}${rejectInfo}`);
  }

  if (isValidPost) {
    return {
      id: postId,
      platform,
      platformSubtype: isShorts ? 'shorts' : 'feed',
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null, // YouTube sponsored detection returns boolean only
      ctaText: ctaText || null,
      link: link || null
    };
  }

  return { rejected: true, code: rejectionCode };
}

/**
 * Scan YouTube feed for videos
 * @returns {DesktopPostItem[]}
 */
function scanYouTubeFeed() {
  const platform = 'youtube';
  const posts = [];
  const issues = [];
  
  const isShorts = window.location.pathname.includes('/shorts');
  console.log(`[AlgorithmLens][YouTube] 🔍 Starting scan... (isShorts: ${isShorts})`);
  console.log(`[AlgorithmLens][YouTube] URL: ${window.location.href}`);
  
  // Selectors based on page type
  // IMPORTANT: For regular feed, we need BOTH video selectors AND ad selectors
  const containerSelectors = isShorts ? [
    'ytd-reel-video-renderer',
    'ytd-shorts',
    '[class*="reel-video"]'
  ] : [
    'ytd-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer',
    // Ad-specific selectors - these contain promoted/sponsored videos
    'ytd-ad-slot-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-video-renderer',
    'ytd-in-feed-ad-layout-renderer'
  ];

  let containers = [];
  const usedSelectors = [];

  // Collect containers from ALL selectors (not just the first match)
  // This ensures we capture both regular videos AND ads
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    if (found.length > 0) {
      containers.push(...found);
      usedSelectors.push(`${selector}(${found.length})`);
    }
  }

  console.log(`[AlgorithmLens][YouTube] Found raw containers: ${containers.length} [${usedSelectors.join(', ')}]`);
  
  // Filter out empty containers (different criteria for Shorts vs regular)
  if (isShorts) {
    // For Shorts, look for video element or any visual content
    containers = containers.filter(el => {
      return el.querySelector('video, #player, [class*="player"], img');
    });
  } else {
    // Check for regular video elements OR ad-specific elements
    // Display/banner ads use different DOM structure than video ads
    const beforeEmptyFilter = containers.length;
    containers = containers.filter(el => {
      const tagName = el.tagName?.toLowerCase() || '';
      const hasVideoContent = el.querySelector('#video-title, h3, img, video, #thumbnail');
      // Ad-specific elements (display ads, banner ads, sponsored content)
      const hasAdContent = el.querySelector(
        '#ad-text, #website-text, .ytd-display-ad-renderer, ' +
        '#action-button, [class*="ad-badge"], #advertiser-name, ' +
        'ytd-action-companion-ad-renderer, #ad-info, ' +
        '.ytp-ad-text, [aria-label*="Sponsored"], ' +
        'a[href*="googleadservices"], a[href*="youtube.com/redirect"]'
      );
      // If this is an ad container, always keep it (we'll try to extract content later)
      const isAdContainer = tagName.includes('ad-slot') || tagName.includes('-ad-') || tagName === 'ytd-ad-slot-renderer';

      const keep = hasVideoContent || hasAdContent || isAdContainer;
      if (CAPTURE_DEBUG && isAdContainer && !keep) {
        debugLog('log', `[CaptureDebug][YouTube] Ad container ${tagName} filtered out (no video or ad content found)`);
      }
      return keep;
    });
    if (CAPTURE_DEBUG && beforeEmptyFilter !== containers.length) {
      debugLog('log', `[CaptureDebug][YouTube] Empty filter removed ${beforeEmptyFilter - containers.length} containers`);
    }
  }

  console.log(`[AlgorithmLens][YouTube] After empty filter: ${containers.length} containers`);

  // Deduplicate nested containers
  const uniqueContainers = [];
  const seen = new WeakSet();

  for (const container of containers) {
    let isDuplicate = false;
    let parent = container.parentElement;
    while (parent) {
      if (seen.has(parent)) {
        isDuplicate = true;
        break;
      }
      parent = parent.parentElement;
    }

    if (!isDuplicate) {
      uniqueContainers.push(container);
      seen.add(container);
    }
  }

  containers = uniqueContainers;
  console.log(`[AlgorithmLens][YouTube] After deduplication: ${containers.length} containers`);

  // Viewport filtering - different logic for Shorts vs regular feed
  const viewportHeight = window.innerHeight;
  const beforeViewportFilter = containers.length;

  if (isShorts) {
    // For Shorts, users scroll through full-screen videos one at a time
    // We want to count videos that have been viewed (above viewport) or currently visible
    // A Short is "viewed" if its center has passed the viewport center
    const viewportCenter = viewportHeight / 2;

    containers = containers.filter(el => {
      const rect = el.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      // Keep Shorts that are visible (center is on screen) or already scrolled past (center is above viewport)
      const hasBeenViewed = elementCenter < viewportHeight;
      return hasBeenViewed;
    });

    console.log(`[AlgorithmLens][YouTube][Shorts] Viewport filter: ${beforeViewportFilter} -> ${containers.length} (removed ${beforeViewportFilter - containers.length} not yet viewed)`);
  } else {
    // For regular feed, filter out pre-loaded videos below viewport
    containers = containers.filter(el => {
      const rect = el.getBoundingClientRect();
      // Keep videos that are visible OR above the viewport (already scrolled past)
      const isVisibleOrScrolledPast = rect.top < viewportHeight;
      return isVisibleOrScrolledPast;
    });

    console.log(`[AlgorithmLens][YouTube] Viewport filter: ${beforeViewportFilter} -> ${containers.length} (removed ${beforeViewportFilter - containers.length} below viewport)`);
  }

  // Track rejection code histogram
  const rejectionCounts = {};
  const subtype = isShorts ? 'shorts' : 'feed';

  containers.forEach((container, index) => {
    try {
      const result = extractYouTubePost(container, index, isShorts);

      // Check if result is a rejection object
      if (result && result.rejected) {
        const code = result.code || 'UNKNOWN';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code, error: result.error || null });
      } else if (result) {
        posts.push(result);
      } else {
        const code = 'NULL_RESULT';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code });
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][YouTube] Error parsing container ${index}:`, err.message);
      const code = 'PARSE_ERROR';
      rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
      issues.push({ index, issue: code, error: err.message });
    }
  });

  // === DETAILED LOGGING ===
  console.log(`[AlgorithmLens][YouTube] Final posts extracted: ${posts.length}`);

  if (posts.length > 0) {
    console.table(posts.slice(0, 20).map(p => ({
      id: (p.id || '').slice(0, 25),
      creator: (p.creator || '—').slice(0, 20),
      captionSample: p.caption ? p.caption.slice(0, 60) + '...' : '—',
      isSponsored: p.isSponsored ? '✓ AD' : '',
      hasCTA: p.ctaText ? '✓' : '',
      link: p.link ? '✓' : ''
    })));
  }

  logScanResults('YouTube', posts, issues, containers.length, rejectionCounts, subtype);

  return posts;
}

// ============================================================================
// FACEBOOK SCANNER
// ============================================================================

/**
 * Extract creator name from a Facebook post container
 * Uses multiple selector strategies based on actual Facebook DOM structure
 * @param {Element} container 
 * @returns {string|null}
 */
function extractFacebookCreator(container) {
  // Strategy 1: Header-based selectors (nested spans inside header links are reliable)
  const headerSelectors = [
    'h2 span span a span',
    'h3 span span a span', 
    'h4 span span a span',
    'h2 a span',
    'h3 a span',
    'h4 a span',
    'h2 a strong',
    'h3 a strong',
    'h4 a strong',
    'h2 a',
    'h3 a',
    'h4 a',
  ];

  for (const sel of headerSelectors) {
    try {
      const el = container.querySelector(sel);
      if (el) {
        const text = (el.innerText || el.textContent || '').trim();
        if (isValidCreator(text)) {
          return text;
        }
      }
    } catch (e) {}
  }

  // Strategy 2: Class-based selectors from Facebook's DOM reference
  // These use the obfuscated class names that appear in creator elements
  const classSelectors = [
    'span.html-span.xdj266r.x14z9mp',
    'span.xdj266r.x14z9mp.xat24cr',
    'span.xdj266r.x14z9mp',
    'span[class*="xdj266r"][class*="x14z9mp"]',
    'span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6',
  ];

  for (const sel of classSelectors) {
    try {
      const els = container.querySelectorAll(sel);
      for (const el of els) {
        const text = (el.innerText || el.textContent || '').trim();
        if (isValidCreator(text)) {
          return text;
        }
      }
    } catch (e) {}
  }

  // Strategy 3: Look for links with aria-label containing profile info
  const ariaLinks = container.querySelectorAll('a[aria-label]');
  for (const link of ariaLinks) {
    const label = link.getAttribute('aria-label') || '';
    // Match patterns like "Billy Floyd, profile picture" or "Profile picture of Billy Floyd"
    const patterns = [
      /^([^,]+),?\s*profile/i,
      /profile\s*(?:picture\s*)?(?:of\s*)?(.+)/i,
      /^(.+?)\s*shared/i,
      /^(.+?)\s*posted/i,
    ];
    for (const pattern of patterns) {
      const match = label.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (isValidCreator(name)) {
          return name;
        }
      }
    }
  }

  // Strategy 4: Links in the top portion of the container
  // Find the first meaningful link that looks like a profile link
  const topArea = container.querySelector('div > div > div > div') || container;
  const topLinks = topArea.querySelectorAll('a[href]');
  
  for (const link of topLinks) {
    const href = link.getAttribute('href') || '';
    // Skip non-profile links
    if (href.includes('/ads/') || 
        href.includes('/hashtag/') || 
        href.includes('?__cft__') ||
        href === '#' ||
        href.includes('/photo') ||
        href.includes('/video')) continue;
    
    // Profile-like links: /username, /profile.php?id=, or start with /
    const isProfileLink = href.match(/^\/[a-zA-Z0-9.]+\/?(\?|$)/) ||
                          href.includes('/profile.php') ||
                          href.includes('facebook.com/');
    
    if (isProfileLink) {
      const text = (link.innerText || link.textContent || '').trim();
      if (isValidCreator(text)) {
        return text;
      }
    }
  }

  // Strategy 5: Find strong tags (Facebook often bolds creator names)
  const strongTags = container.querySelectorAll('strong');
  for (const strong of strongTags) {
    const text = (strong.innerText || strong.textContent || '').trim();
    if (isValidCreator(text) && text.length < 50) {
      return text;
    }
  }

  return null;
}

/**
 * Extract caption/post text from a Facebook post container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractFacebookCaption(container) {
  // Strategy 1: Primary selectors based on DOM reference
  const captionSelectors = [
    // Style-based selector from reference (most specific)
    'div[dir="auto"][style*="text-align: start"]',
    'div[dir="auto"][style*="text-align:start"]',
    // Data attribute selectors for ads and regular posts
    'div[data-ad-comet-preview="message"]',
    'div[data-ad-preview="message"]',
    '[data-testid="post_message"]',
    // Common caption container classes
    'div[class*="x1iorvi4"][dir="auto"]',
    'span[dir="auto"][class*="x193iq5w"]',
  ];

  for (const sel of captionSelectors) {
    try {
      const els = container.querySelectorAll(sel);
      for (const el of els) {
        const text = (el.innerText || el.textContent || '').trim();
        if (isValidCaption(text)) {
          return text;
        }
      }
    } catch (e) {}
  }

  // Strategy 2: Find all dir="auto" divs and pick the best caption candidate
  const dirAutoDivs = Array.from(container.querySelectorAll('div[dir="auto"]'));
  
  // Score and filter candidates
  const candidates = dirAutoDivs
    .map(el => {
      const text = (el.innerText || el.textContent || '').trim();
      // Calculate a relevance score
      let score = text.length;
      // Boost if it has multiple words
      const wordCount = text.split(/\s+/).length;
      if (wordCount > 3) score += 50;
      if (wordCount > 10) score += 100;
      // Boost if it contains typical post content markers
      if (text.includes('#')) score += 30;
      if (text.includes('@')) score += 20;
      if (text.match(/[.!?]/)) score += 40; // Has punctuation
      // Penalize if it looks like metadata
      if (text.match(/^\d+\s*(K|M)?\s*(likes?|views?|comments?|shares?)/i)) score -= 500;
      if (text.match(/^(All|Top)\s+comments/i)) score -= 500;
      
      return { el, text, score };
    })
    .filter(({ text }) => isValidCaption(text))
    .sort((a, b) => b.score - a.score);

  if (candidates.length > 0 && candidates[0].text.length > 10) {
    return candidates[0].text;
  }

  // Strategy 3: Look for spans with substantial text content
  const textSpans = container.querySelectorAll('span[dir="auto"]');
  for (const span of textSpans) {
    // Skip if this span is inside a link (likely a name, not caption)
    if (span.closest('a')) continue;
    
    const text = (span.innerText || span.textContent || '').trim();
    if (isValidCaption(text) && text.length > 30) {
      return text;
    }
  }

  // Strategy 4: Fall back to any div with substantial text
  const allDivs = container.querySelectorAll('div');
  for (const div of allDivs) {
    // Skip if has too many child divs (likely a container, not text)
    if (div.querySelectorAll('div').length > 5) continue;
    
    const text = (div.innerText || div.textContent || '').trim();
    if (text.length > 50 && text.length < 5000 && isValidCaption(text)) {
      return text;
    }
  }

  return null;
}

/**
 * Detect if a Facebook post is sponsored/an ad
 * Facebook obfuscates "Sponsored" text by splitting it across elements
 * IMPROVED: Added header text extraction from top DOM elements
 * @param {Element} container 
 * @returns {boolean}
 */
function isFacebookSponsored(container) {
  // ============================================================================
  // STRATEGY 0 (NEW): Extract header text from top elements for analysis
  // This catches Facebook's obfuscated "Sponsored" text more reliably
  // ============================================================================
  const headerTextFromElements = Array.from(
    container.querySelectorAll('div[role="button"], span, a, div[dir="auto"]')
  )
    .slice(0, 40) // Only check top portion of DOM
    .map(el => (el.innerText || '').trim())
    .filter(text => text && text.length < 100) // Skip long content blocks
    .join(' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  
  if (headerTextFromElements.includes('sponsored') || 
      headerTextFromElements.includes('paid partnership') ||
      headerTextFromElements.includes('paid promotion')) {
    console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via header element text:', 
      headerTextFromElements.slice(0, 150));
    return true;
  }

  // Strategy 1: Check for ads/about link (most reliable indicator)
  if (container.querySelector('a[href*="ads/about"]') ||
      container.querySelector('a[href*="/ads/"]') ||
      container.querySelector('a[href*="facebook.com/ads"]')) {
    console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via ads/about link');
    return true;
  }

  // Strategy 2: Check for aria-label containing "Sponsored"
  const ariaElements = container.querySelectorAll('[aria-label]');
  for (const el of ariaElements) {
    const label = (el.getAttribute('aria-label') || '').toLowerCase();
    if (label.includes('sponsored') || 
        label.includes('paid partnership') ||
        label.includes('advertisement')) {
      console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via aria-label:', label);
      return true;
    }
  }

  // Strategy 3: Check for ad-specific data attributes
  const adSelectors = [
    '[data-testid*="ad"]',
    '[data-testid*="sponsored"]',
    '[data-ad-preview]',
    '[data-ad-comet-preview]',
    '[data-pagelet*="AdUnit"]',
    '[data-pagelet*="Sponsored"]',
  ];
  
  for (const sel of adSelectors) {
    try {
      if (container.querySelector(sel) || container.matches(sel)) {
        console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via ad data attribute:', sel);
        return true;
      }
    } catch (e) {}
  }

  // Strategy 4: Look for obfuscated "Sponsored" text in header area
  const headerArea = container.querySelector('div > div > div > div > div') ||
                     container.querySelector('h2, h3, h4')?.parentElement?.parentElement ||
                     container;
  
  if (headerArea) {
    const headerText = (headerArea.innerText || headerArea.textContent || '').slice(0, 800);
    const headerTextLower = headerText.toLowerCase();
    
    // Check for explicit "sponsored" word
    if (/\bsponsored\b/i.test(headerTextLower)) {
      console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via header area text pattern');
      return true;
    }
    
    // Check for spaced-out "s p o n s o r e d" pattern (Facebook obfuscation)
    if (/s\s*p\s*o\s*n\s*s\s*o\s*r\s*e\s*d/i.test(headerText)) {
      console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via spaced-out text pattern');
      return true;
    }
  }

  // Strategy 5: Look for small spans that might spell out "Sponsored"
  // Facebook splits letters across spans with obfuscated class names
  const suspiciousSpans = container.querySelectorAll(
    'span.x1r8a4m5, span.x1n2onr6, span[class*="x17ihmo5"], span[class*="x13rv6gb"], ' +
    'span[class*="xt0psk2"], span[class*="x1fvot60"], span[class*="x1s688f"]'
  );
  
  if (suspiciousSpans.length >= 3) {
    // Collect text from short spans (character-by-character obfuscation)
    let collectedText = '';
    for (const span of suspiciousSpans) {
      const text = (span.textContent || '').trim();
      if (text.length <= 3) {
        collectedText += text;
      }
    }
    const collectedLower = collectedText.toLowerCase();
    if (collectedLower.includes('sponsored') ||
        collectedLower.includes('sponored') ||
        collectedLower.includes('ponsore') ||
        collectedLower.includes('sponsore')) {
      console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via reconstructed span text:', collectedText);
      return true;
    }
  }

  // Strategy 6: Check full container text for ad indicators
  const fullText = (container.innerText || '').toLowerCase().slice(0, 2000);
  if (/\bpaid partnership\b/.test(fullText) || 
      /\bpaid promotion\b/.test(fullText) ||
      /\badvertisement\b/.test(fullText)) {
    console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via full text ad indicator');
    return true;
  }

  // Strategy 7: Look for CTA buttons combined with external links (strong ad signal)
  const ctaPatterns = /^(shop\s*now|learn\s*more|sign\s*up|get\s*started|download|install|buy\s*now|order\s*now|book\s*now|apply\s*now|get\s*app|try\s*free|start\s*free|get\s*offer|claim\s*offer)$/i;
  
  const buttons = container.querySelectorAll('a[role="button"], div[role="button"], button');
  for (const btn of buttons) {
    const btnText = (btn.innerText || btn.textContent || '').trim();
    if (ctaPatterns.test(btnText)) {
      // Has a strong CTA - check if there's also an external link
      const hasExternalLink = Array.from(container.querySelectorAll('a[href]'))
        .some(a => {
          const href = a.getAttribute('href') || '';
          return href.startsWith('http') && 
                 !href.includes('facebook.com') && 
                 !href.includes('fb.com');
        });
      
      if (hasExternalLink) {
        console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via CTA + external link:', btnText);
        return true;
      }
    }
  }

  // Strategy 8: Check link text/href for "Sponsored"
  const links = container.querySelectorAll('a[href]');
  for (const link of links) {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href.includes('/ads/about') || href.includes('ad_id=')) {
      console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via link href pattern');
      return true;
    }
    
    const linkText = (link.innerText || '').toLowerCase().trim();
    if (linkText === 'sponsored' || linkText === 'ad') {
      console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via link text:', linkText);
      return true;
    }
  }
  
  // Strategy 9: Look for "Sponsored" in any small text element near the top
  const allSmallText = container.querySelectorAll('span, div');
  for (let i = 0; i < Math.min(allSmallText.length, 50); i++) {
    const el = allSmallText[i];
    const text = (el.innerText || '').trim().toLowerCase();
    // Match exactly "sponsored" or similar short ad labels
    if (text === 'sponsored' || text === 'ad' || text === 'advertisement') {
      console.debug('[AlgorithmLens][Facebook][Sponsored] Detected via exact text match in element');
      return true;
    }
  }

  // Strategy 10: Look for "Sponsored" button/label elements near timestamp
  // These are often in dir="auto" spans or button-like elements
  const possibleSponsoredLabels = Array.from(
    container.querySelectorAll('span, div[dir="auto"], a[role="link"]')
  )
    .map((el) => (el.innerText || "").trim().toLowerCase())
    .filter((text) => text && text.length <= 40);

  if (possibleSponsoredLabels.some((text) => text === "sponsored")) {
    console.debug(
      "[AlgorithmLens][Facebook][Sponsored] Detected via exact 'Sponsored' label"
    );
    return true;
  }

  return false;
}

/**
 * Normalize Facebook text by collapsing whitespace/newlines
 * This fixes the "one character per line" artifacts in Facebook captions
 * @param {string|null|undefined} raw 
 * @returns {string}
 */
function normalizeFacebookText(raw) {
  if (!raw) return '';
  return raw
    .replace(/\s+/g, ' ') // collapse whitespace/newlines
    .trim()
    .toLowerCase();
}

/**
 * Build a STABLE Facebook post ID that doesn't change across batches
 * Uses DOM attributes and content fingerprinting (NO timestamps)
 * SIMPLIFIED: Prioritizes caption-based ID for stable deduplication
 * @param {Element} container 
 * @param {string|null} caption 
 * @param {number} index 
 * @returns {string}
 */
function buildFacebookPostId(container, caption, index) {
  // Priority 1: Caption-based ID (most stable for deduplication)
  const normalizedCaption = normalizeFacebookText(caption || '');
  if (normalizedCaption.length > 0) {
    const key = normalizedCaption.slice(0, 160); // first 160 chars
    return 'facebook:caption:' + hashString(key);
  }
  
  // Priority 2: DOM-based ID
  const domId =
    container.getAttribute('data-pagelet') ||
    container.getAttribute('data-testid') ||
    container.id ||
    '';
  
  if (domId) {
    return 'facebook:dom:' + hashString(domId);
  }
  
  // Very last resort: deterministic index-based ID for this scan pass
  return 'facebook:idx:' + index;
}

/**
 * Extract a single Facebook post from its container element
 * LOOSENED version - extracts posts much more permissively
 * UPDATED: Uses stable content-based IDs for proper deduplication
 * @param {Element} container 
 * @param {number} index 
 * @returns {DesktopPostItem|null}
 */
function extractFacebookPost(container, index) {
  const platform = 'facebook';

  // Skip non-post modules (PYMK, groups, events, etc.) BEFORE any fallback logic
  if (isNonPostModule(container, platform)) {
    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Facebook] Container ${index}: REJECTED (non-post module)`);
    }
    return { rejected: true, code: 'NON_POST_MODULE' };
  }

  // Get raw container text for fallback extraction
  const rawContainerText = (container.innerText || '').trim();
  
  // Try standard extraction first
  let creator = extractFacebookCreator(container);
  let caption = extractFacebookCaption(container);
  const isSponsored = isFacebookSponsored(container);
  
  // ============================================================================
  // AGGRESSIVE FALLBACK: If no caption found via normal means, try raw text
  // ============================================================================
  if (!caption && rawContainerText.length > 20) {
    // Normalize the raw text
    const normalized = rawContainerText
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Filter out very short lines (likely UI elements)
        if (line.length < 5) return false;
        // Filter out obvious UI elements
        if (/^(like|comment|share|reply|see more|hide|follow|message|write a comment)$/i.test(line)) return false;
        if (/^\d+\s*(K|M)?\s*$/.test(line)) return false; // Pure numbers
        if (/^\d+\s*(likes?|comments?|shares?|views?)$/i.test(line)) return false;
        return true;
      })
      .slice(0, 20) // Take first 20 meaningful lines
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (normalized.length > 20) {
      caption = normalized.slice(0, 500);
      console.debug(`[AlgorithmLens][Facebook] Post ${index}: Using fallback caption extraction (${caption.length} chars)`);
    }
  }
  
  // ============================================================================
  // AGGRESSIVE FALLBACK: If no creator found, try to extract from first line
  // ============================================================================
  if (!creator && rawContainerText.length > 10) {
    const lines = rawContainerText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      if (line.length > 2 && line.length < 60 && isValidCreator(line)) {
        creator = line;
        console.debug(`[AlgorithmLens][Facebook] Post ${index}: Using fallback creator extraction: "${creator}"`);
        break;
      }
    }
  }
  
  // ============================================================================
  // NORMALIZE CAPTION: Remove "one character per line" artifacts
  // ============================================================================
  if (caption) {
    // Apply normalization to fix vertical text artifacts
    caption = caption.replace(/\s+/g, ' ').trim();
    // Truncate to reasonable length for dashboard
    if (caption.length > 400) {
      caption = caption.slice(0, 400);
    }
  }
  
  // Extract hashtags
  const hashtagEls = safeQueryAll(container, 'a[href*="/hashtag/"]');
  let hashtags = hashtagEls.map(el => safeText(el)).filter(Boolean);
  if (hashtags.length === 0 && caption) {
    hashtags = extractHashtags(caption);
  }
  
  // Extract CTA
  const ctaText = extractCTA(container);
  
  // Extract link (prefer external links, then video/photo links)
  let link = null;
  const externalLinks = Array.from(container.querySelectorAll('a[href]'))
    .filter(a => {
      const href = a.getAttribute('href') || '';
      return href.startsWith('http') && 
             !href.includes('facebook.com') &&
             !href.includes('fb.com') &&
             !href.includes('/ads/about');
    });
  
  if (externalLinks.length > 0) {
    link = externalLinks[0].getAttribute('href');
  } else {
    // Fall back to Facebook video/photo/post links
    const fbLink = container.querySelector('a[href*="/videos/"], a[href*="/photo"], a[href*="/posts/"], a[href*="/watch"], a[href*="/reel"]');
    if (fbLink) {
      link = fbLink.getAttribute('href');
    }
  }
  
  // ============================================================================
  // DEEP FACEBOOK EXTRACTION: Comments, Shares, Reactions, Outbound Links
  // ============================================================================
  
  // Extract comment count
  const commentMatch = rawContainerText.match(/([0-9,.]+)\s+comments?/i);
  const commentCount = commentMatch ? parseInt(commentMatch[1].replace(/,/g, ''), 10) : 0;
  
  // Extract share count
  const shareMatch = rawContainerText.match(/([0-9,.]+)\s+shares?/i);
  const shareCount = shareMatch ? parseInt(shareMatch[1].replace(/,/g, ''), 10) : 0;
  
  // Extract reaction count from aria-label
  let reactionCount = 0;
  const reactionsEl = container.querySelector('[aria-label*="reaction" i]');
  if (reactionsEl) {
    const ariaLabel = reactionsEl.getAttribute('aria-label') || '';
    const numeric = ariaLabel.match(/([0-9,.]+)/);
    reactionCount = numeric ? parseInt(numeric[1].replace(/,/g, ''), 10) : 0;
  }
  
  // Extract outbound link (non-Facebook external URL)
  const candidateLink = container.querySelector('a[href^="http"]:not([href*="facebook.com"]):not([href*="fb.com"])');
  const outboundLink = candidateLink ? candidateLink.href : null;
  
  // Build fbMeta object
  const fbMeta = {
    reactionCount,
    commentCount,
    shareCount,
    outboundLink
  };
  
  // Generate STABLE ID using content fingerprinting (no timestamps!)
  const postId = buildFacebookPostId(container, caption, index);
  
  // ============================================================================
  // VERY RELAXED VALIDATION: Accept if we have ANY meaningful content
  // Only skip when ALL of these are missing: creator, caption, link
  // ============================================================================
  const hasCreator = !!(creator && creator.trim());
  const hasCaption = !!(caption && caption.trim().length > 5); // Lowered from 10 to 5
  const hasLink = !!(link && link.trim());
  const hasCTA = !!(ctaText && ctaText.trim());
  const hasHashtags = hashtags.length > 0;
  const hasSubstantialText = rawContainerText.length > 50;
  
  // Keep the post if ANY of these conditions are true
  if (hasCreator || hasCaption || hasLink || isSponsored || hasCTA || hasHashtags) {
    const post = {
      id: postId,
      platform,
      creator: creator || "Unknown creator",
      caption: caption || "(No caption)",
      hashtags,
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null, // Facebook sponsored detection returns boolean only
      ctaText: ctaText || null,
      link: link || null,
      uiLabel: isSponsored ? "Sponsored Ad" : "Post",
      isFallback: false,
      fbMeta
    };
    // Log successful extraction for debugging
    if (index < 10) {
      console.debug(`[AlgorithmLens][Facebook] ✅ Post ${index} ACCEPTED:`, {
        creator: post.creator.slice(0, 30),
        captionLength: post.caption.length,
        isSponsored,
        hasLink,
        hasCTA,
        hashtagCount: hashtags.length,
        fbMeta
      });
    }
    return post;
  }
  
  // ============================================================================
  // LAST RESORT: If container has substantial text but nothing else worked,
  // create a minimal post with just the raw text as caption
  // ============================================================================
  if (hasSubstantialText && rawContainerText.length > 50) {
    const minimalCaption = rawContainerText.slice(0, 400).replace(/\s+/g, ' ').trim();
    
    // Build a STABLE ID even for last-resort posts (use caption hash, NOT timestamp)
    const lastResortId = `facebook:lastresort:${hashString(minimalCaption.slice(0, 200))}`;
    
    console.debug(`[AlgorithmLens][Facebook] 🆘 Post ${index} LAST-RESORT extraction: using raw text as caption (${minimalCaption.length} chars), id=${lastResortId}`);
    
    return {
      id: lastResortId,
      platform,
      creator: "Unknown creator",
      caption: minimalCaption || "(No caption)",
      hashtags: extractHashtags(minimalCaption),
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null, // Facebook sponsored detection returns boolean only
      ctaText: null,
      link: null,
      uiLabel: isSponsored ? "Sponsored Ad" : "Post",
      isFallback: true,
      fbMeta
    };
  }
  
  // ============================================================================
  // FALLBACK EXTRACTION: If containerHasContent() is true, accept the post
  // even without confident creator/caption/link signals
  // ============================================================================
  const hasMedia = !!(container.querySelector(
    'img[src]:not([src=""]), video, canvas, [role="img"], [data-visualcompletion="media-vc-image"]'
  ));
  
  // Check if container has meaningful content (media, FB attributes, links, etc.)
  if (containerHasContent(container)) {
    const trimmedTextOrNull = rawContainerText.length > 0 
      ? rawContainerText.slice(0, 400).replace(/\s+/g, ' ').trim() 
      : null;
    
    // Build stable fallback ID (NO timestamp - use index + content hash for determinism)
    const fallbackIdBase = trimmedTextOrNull
      ? hashString(trimmedTextOrNull.slice(0, 160))
      : `media-idx${index}`;
    const fallbackId = `facebook:fallback:${fallbackIdBase}`;
    
    console.log(`[AlgorithmLens][Facebook] Fallback post accepted for container ${index} (text length: ${rawContainerText.length}, hasMedia: ${hasMedia})`);
    
    return {
      id: fallbackId,
      platform,
      type: 'feed_item_fallback',
      creator: creator || "Unknown creator",
      caption: trimmedTextOrNull || "(No caption)",
      hashtags: trimmedTextOrNull ? extractHashtags(trimmedTextOrNull) : [],
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null, // Facebook sponsored detection returns boolean only
      ctaText: ctaText || null,
      link: link || null,
      uiLabel: isSponsored ? "Sponsored Ad" : "Post",
      isFallback: true,
      fbMeta,
      debug: {
        fallback: true,
        reason: 'insufficient-signals',
        original_flags: {
          hasCreator,
          hasCaption,
          hasLink,
          isSponsored,
          hasCTA,
          hasHashtags,
          hasMedia,
          rawTextLength: rawContainerText.length
        }
      }
    };
  }
  
  // ============================================================================
  // FINAL SKIP: Only skip if containerHasContent is false AND no text AND no media
  // ============================================================================
  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Facebook] Container ${index}: REJECTED [NO_CONTENT] - hasMedia=${hasMedia}, textLen=${rawContainerText.length}`);
  }

  return { rejected: true, code: 'NO_CONTENT' };
}

/**
 * Determine if a Facebook container element has meaningful content
 * More permissive than simple text length check - also considers media and interactive elements
 * @param {Element} container 
 * @returns {boolean}
 */
function containerHasContent(container) {
  const text = (container.innerText || '').trim();
  
  // Accept if text is substantial (lowered from 20 to 10)
  if (text.length > 10) {
    return true;
  }
  
  // Accept if has media elements (images, videos, canvas for video players)
  const hasMedia = container.querySelector(
    'img[src]:not([src=""]), ' +
    'video, ' +
    'canvas, ' +
    '[role="img"], ' +
    '[data-visualcompletion="media-vc-image"]'
  );
  if (hasMedia) {
    console.debug('[AlgorithmLens][Facebook] containerHasContent: accepted via media element');
    return true;
  }
  
  // Accept if has aria-label indicating content (reactions, comments, share buttons)
  const hasAriaContent = container.querySelector(
    '[aria-label*="reaction"], ' +
    '[aria-label*="comment"], ' +
    '[aria-label*="share"], ' +
    '[aria-label*="Like"], ' +
    '[aria-label*="love"], ' +
    '[aria-label*="haha"], ' +
    '[aria-label*="wow"], ' +
    '[aria-label*="sad"], ' +
    '[aria-label*="angry"]'
  );
  if (hasAriaContent) {
    console.debug('[AlgorithmLens][Facebook] containerHasContent: accepted via aria-label content');
    return true;
  }
  
  // Accept if has Facebook-specific data attributes indicating a post
  const hasFbPostIndicators = container.querySelector(
    '[data-testid], ' +
    '[data-ad-preview], ' +
    '[data-pagelet*="FeedUnit"], ' +
    '[data-visualcompletion]'
  );
  if (hasFbPostIndicators) {
    console.debug('[AlgorithmLens][Facebook] containerHasContent: accepted via FB data attributes');
    return true;
  }
  
  // Accept if has links (posts typically have profile links, share links, etc.)
  const linkCount = container.querySelectorAll('a[href]').length;
  if (linkCount >= 2) {
    console.debug('[AlgorithmLens][Facebook] containerHasContent: accepted via link count:', linkCount);
    return true;
  }
  
  // Reject if truly empty
  console.debug('[AlgorithmLens][Facebook] containerHasContent: rejected, textLen=' + text.length);
  return false;
}

/**
 * Scan Facebook feed for posts
 * HARDENED version with layered selectors and aggressive fallback extraction
 * @returns {DesktopPostItem[]}
 */
function scanFacebookFeed() {
  const platform = 'facebook';
  let posts = [];
  const issues = [];
  
  // Clear query cache at start of each scan cycle
  clearFbQueryCache();
  
  console.log('\n');
  console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  console.log('[AlgorithmLens][Facebook] 🔍 STARTING FACEBOOK FEED SCAN');
  console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  console.log('[AlgorithmLens][Facebook] URL:', window.location.href);
  console.log('[AlgorithmLens][Facebook] Pathname:', window.location.pathname);
  console.log('[AlgorithmLens][Facebook] Timestamp:', new Date().toISOString());
  
  // ============================================================================
  // SINGLE SELECTOR: Only process TRUE top-level FeedUnit containers
  // This prevents inflated counts from nested role="article" elements
  // ============================================================================
  const rawContainers = Array.from(document.querySelectorAll('div[data-pagelet^="FeedUnit_"]'));
  
  console.log(`[AlgorithmLens][Facebook] 📦 FeedUnit containers found: ${rawContainers.length}`);
  
  // ============================================================================
  // VALIDITY CHECK: Filter out non-post FeedUnits
  // ============================================================================
  let containers = [];
  
  for (const container of rawContainers) {
    const hasTimestamp = !!container.querySelector('abbr, a[aria-label*="day"], a[aria-label*="hour"], a[aria-label*="minute"]');
    const hasCreator = !!container.querySelector('strong, h3, span');
    const hasMedia = !!container.querySelector('img, video');
    const hasSponsored = !!container.innerText.toLowerCase().includes('sponsored');
    
    if (!hasTimestamp && !hasCreator && !hasMedia && !hasSponsored) {
      console.debug('[AlgorithmLens][Facebook] Skipping non-post FeedUnit (no timestamp/creator/media/sponsored)');
      continue; // skip non-post units
    }
    
    // Filter out sidebar/nav containers
    const isNotNav = !container.closest('nav') && 
                     !container.closest('header[role="banner"]') &&
                     !container.closest('[data-pagelet="RightRail"]') &&
                     !container.closest('[data-pagelet="LeftRail"]');
    
    if (isNotNav) {
      containers.push(container);
    }
  }
  
  console.log(`[AlgorithmLens][Facebook] 📦 After validity check: ${containers.length} valid containers`);
  
  // ============================================================================
  // PHASE 2.5: Per-session container tracking using CONTENT HASH (not DOM reference)
  // This ensures new posts discovered during scroll are properly tracked even if
  // Facebook recycles/virtualizes DOM elements
  // ============================================================================
  const allContainers = containers;
  const newContainers = [];
  let alreadyProcessedCount = 0;
  
  for (const el of allContainers) {
    // Generate a stable hash based on container content, not DOM reference
    const containerHash = generateContainerHash(el);
    
    if (facebookProcessedContainerHashes.has(containerHash)) {
      alreadyProcessedCount++;
      continue;
    }
    
    // Mark as processed and add to new containers
    facebookProcessedContainerHashes.add(containerHash);
    newContainers.push(el);
  }
  
  console.debug(
    '[AlgorithmLens][Facebook][Session] scanFacebookFeed() containers: total=%d, new=%d, alreadyProcessed=%d, hashSetSize=%d',
    allContainers.length,
    newContainers.length,
    alreadyProcessedCount,
    facebookProcessedContainerHashes.size
  );
  
  if (newContainers.length === 0) {
    console.debug('[AlgorithmLens][Facebook][Session] scanFacebookFeed(): no new containers, returning empty batch');
    return [];
  }
  
  // Use only new containers for further processing
  containers = newContainers;
  
  // ============================================================================
  // DIAGNOSTIC: If no FeedUnit containers found, log debug info
  // ============================================================================
  if (allContainers.length === 0) {
    console.warn('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
    console.warn('[AlgorithmLens][Facebook] ⚠️ NO FEEDUNIT CONTAINERS FOUND - DIAGNOSTIC INFO:');
    console.warn('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
    console.warn(`[AlgorithmLens][Facebook]   → div[data-pagelet^="FeedUnit_"] count: ${document.querySelectorAll('div[data-pagelet^="FeedUnit_"]').length}`);
    console.warn(`[AlgorithmLens][Facebook]   → role="feed" count: ${document.querySelectorAll('[role="feed"]').length}`);
    console.warn(`[AlgorithmLens][Facebook]   → role="main" count: ${document.querySelectorAll('[role="main"]').length}`);
    
    // Log first few data-pagelet values to help debug
    const pagelets = Array.from(document.querySelectorAll('[data-pagelet]')).slice(0, 10);
    const pageletValues = pagelets.map(el => el.getAttribute('data-pagelet'));
    console.warn('[AlgorithmLens][Facebook]   → Sample data-pagelet values:', pageletValues);
    
    // Check if we're actually on the feed
    const isFeedPage = window.location.pathname === '/' || 
                       window.location.pathname === '' ||
                       window.location.pathname.includes('/home');
    console.warn(`[AlgorithmLens][Facebook]   → Appears to be feed page: ${isFeedPage}`);
    console.warn('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  }
  
  // ============================================================================
  // PHASE 3: PRIMARY EXTRACTION - Extract posts using extractFacebookPost
  // Rate-limited to MAX_FACEBOOK_POSTS_PER_BATCH posts per scan
  // ============================================================================
  let totalContainers = containers.length;
  let validPosts = 0;
  let skippedPosts = 0;
  let batchLimitReached = false;

  // Track rejection code histogram
  const rejectionCounts = {};

  console.debug('[AlgorithmLens][Facebook] 🔄 Starting primary extraction pass...');

  for (let index = 0; index < containers.length; index++) {
    const container = containers[index];

    // Check batch limit before processing each container
    if (posts.length >= MAX_FACEBOOK_POSTS_PER_BATCH) {
      console.debug(
        '[AlgorithmLens][Facebook][Session] scanFacebookFeed(): reached MAX_FACEBOOK_POSTS_PER_BATCH (%d), stopping batch',
        MAX_FACEBOOK_POSTS_PER_BATCH
      );
      batchLimitReached = true;
      break;
    }

    try {
      const result = extractFacebookPost(container, index);

      // Check if result is a rejection object
      if (result && result.rejected) {
        const code = result.code || 'UNKNOWN';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code });
        skippedPosts++;
      } else if (result) {
        posts.push(result);
        validPosts++;
      } else {
        // Capture diagnostic info for null result
        const code = 'NULL_RESULT';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code });
        skippedPosts++;
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][Facebook] ❌ Error parsing container ${index}:`, err.message);
      const code = 'PARSE_ERROR';
      rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
      issues.push({ index, issue: code, error: err.message });
      skippedPosts++;
    }
  }
  
  // Batch summary with sponsored count
  const sponsoredCount = posts.filter(p => p.platform === 'facebook' && p.isSponsored).length;
  console.debug(
    '[AlgorithmLens][Facebook][Session] Batch summary: posts=%d, sponsored=%d',
    posts.length,
    sponsoredCount
  );
  
  console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  console.log('[AlgorithmLens][Facebook] 📊 PRIMARY EXTRACTION RESULTS:');
  console.log(`[AlgorithmLens][Facebook]   → Containers scanned: ${totalContainers}`);
  console.log(`[AlgorithmLens][Facebook]   → Valid posts: ${validPosts}`);
  console.log(`[AlgorithmLens][Facebook]   → Skipped posts: ${skippedPosts}`);
  console.log(`[AlgorithmLens][Facebook]   → Batch limit reached: ${batchLimitReached}`);
  console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  
  if (issues.length > 0) {
    console.debug('[AlgorithmLens][Facebook] 🔍 Issues sample (first 5):', issues.slice(0, 5));
  }
  
  // NOTE: Fallback extraction removed - only FeedUnit containers are processed
  
  // ============================================================================
  // FINAL LOGGING
  // ============================================================================
  console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  console.log(`[AlgorithmLens][Facebook] 📊 FINAL POSTS EXTRACTED: ${posts.length}`);
  console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  
  if (posts.length > 0) {
    console.debug('[AlgorithmLens][Facebook] Sample captions (first 5):', 
      posts.slice(0, 5).map(p => (p.caption || '').slice(0, 80)));
    console.debug('[AlgorithmLens][Facebook] Sample creators (first 5):',
      posts.slice(0, 5).map(p => p.creator || '(none)'));
    
    const sponsoredCount = posts.filter(p => p.isSponsored).length;
    console.log(`[AlgorithmLens][Facebook] 📊 Sponsored/Ads: ${sponsoredCount} / ${posts.length} (${posts.length > 0 ? Math.round(sponsoredCount / posts.length * 100) : 0}%)`);
    
    console.table(posts.slice(0, 20).map(p => ({
      id: (p.id || '').slice(0, 30),
      creator: (p.creator || '—').slice(0, 20),
      captionSample: p.caption ? p.caption.slice(0, 50) + '...' : '—',
      isSponsored: p.isSponsored ? '✓ AD' : '',
      hasCTA: p.ctaText ? '✓' : '',
      link: p.link ? '✓' : ''
    })));
  } else {
    console.error('[AlgorithmLens][Facebook] ❌ NO POSTS EXTRACTED');
    console.error('[AlgorithmLens][Facebook] This may indicate:');
    console.error('[AlgorithmLens][Facebook]   - No FeedUnit_ containers on this page');
    console.error('[AlgorithmLens][Facebook]   - Not on the main Facebook feed');
    console.error('[AlgorithmLens][Facebook]   - Facebook DOM structure has changed');
    console.error('[AlgorithmLens][Facebook] Issues encountered:', issues.length);
    if (issues.length > 0) {
      console.table(issues.slice(0, 15));
    }
  }
  
  logScanResults('Facebook', posts, issues, totalContainers, rejectionCounts);

  console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  console.log('[AlgorithmLens][Facebook] 🔍 FACEBOOK FEED SCAN COMPLETE');
  console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  console.log('\n');

  return posts;
}

// ============================================================================
// TWITTER/X SCANNER
// ============================================================================

/**
 * Extract creator name from a Twitter/X tweet container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractTwitterCreator(container) {
  // Strategy 1: User-Name data-testid (most reliable)
  const userNameEl = safeQuery(container, 'div[data-testid="User-Name"]');
  if (userNameEl) {
    // The display name is typically the first link's text (not the @handle)
    const links = safeQueryAll(userNameEl, 'a');
    for (const link of links) {
      const text = safeText(link);
      // Skip @handles - they start with @
      if (text && !text.startsWith('@') && isValidCreator(text)) {
        return text.trim();
      }
    }
    // Fallback: get first non-@ text content
    const spans = safeQueryAll(userNameEl, 'span');
    for (const span of spans) {
      const text = safeText(span);
      if (text && !text.startsWith('@') && !text.includes('·') && isValidCreator(text)) {
        return text.trim();
      }
    }
  }
  
  // Strategy 2: Avatar link aria-label
  const avatarLinks = safeQueryAll(container, 'a[aria-label]');
  for (const link of avatarLinks) {
    const label = link.getAttribute('aria-label') || '';
    // Pattern: "Username's avatar" or "Username (@handle)"
    const match = label.match(/^([^'@(]+)/);
    if (match && match[1]) {
      const name = match[1].trim();
      if (isValidCreator(name) && name.length > 0 && name.length < 50) {
        return name;
      }
    }
  }
  
  // Strategy 3: Header area links
  const headerLinks = safeQueryAll(container, 'div[data-testid="User-Name"] a[href^="/"]');
  for (const link of headerLinks) {
    const href = link.getAttribute('href') || '';
    // Extract username from profile link
    const match = href.match(/^\/([^/?]+)/);
    if (match && match[1] && !match[1].includes('status')) {
      const username = match[1];
      if (isValidCreator(username)) {
        return username;
      }
    }
  }
  
  return null;
}

/**
 * Extract caption/tweet text from a Twitter/X tweet container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractTwitterCaption(container) {
  // Strategy 1: tweetText data-testid (most reliable)
  const tweetTextEl = safeQuery(container, 'div[data-testid="tweetText"]');
  if (tweetTextEl) {
    const text = safeText(tweetTextEl);
    if (text && text.length > 0 && isValidCaption(text)) {
      return text;
    }
  }
  
  // Strategy 2: div with lang attribute (tweet content typically has language)
  const langDivs = safeQueryAll(container, 'div[lang]');
  const candidates = [];
  
  for (const div of langDivs) {
    const text = safeText(div);
    if (text && text.length > 10 && isValidCaption(text)) {
      candidates.push({ text, length: text.length });
    }
  }
  
  // Pick the longest valid caption
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.length - a.length);
    return candidates[0].text;
  }
  
  // Strategy 3: Any substantial text in the tweet body
  const textDivs = safeQueryAll(container, 'div[dir="auto"]');
  for (const div of textDivs) {
    // Skip if inside header (user name area)
    if (div.closest('div[data-testid="User-Name"]')) continue;
    
    const text = safeText(div);
    if (text && text.length > 15 && isValidCaption(text)) {
      return text;
    }
  }
  
  return null;
}

/**
 * Detect if a Twitter/X tweet is sponsored/promoted
 * @param {Element} container
 * @returns {{isSponsored: boolean, evidence: object|null}}
 */
function isTwitterSponsored(container) {
  // Strategy 1: Check for ad-specific data-testid attributes (not placementTracking - now on all tweets)
  const adTestIdSelectors = [
    '[data-testid*="promoted"]',
    '[data-testid*="Promoted"]'
  ];

  for (const sel of adTestIdSelectors) {
    if (safeQuery(container, sel)) {
      console.debug('[AlgorithmLens][Twitter][Sponsored] Detected via selector:', sel);
      return {
        isSponsored: true,
        evidence: { strategy: 'adTestId', selector: sel }
      };
    }
  }

  // Strategy 2: Look for visible "Promoted" label in tweet HEADER area only
  // Twitter's Promoted label appears near the username/timestamp, not in tweet body
  const headerArea = safeQuery(container, 'div[data-testid="User-Name"]');
  if (headerArea) {
    const headerParent = headerArea.parentElement?.parentElement;
    if (headerParent) {
      const headerSpans = safeQueryAll(headerParent, 'span');
      for (const span of headerSpans) {
        // Skip hidden/sr-only elements
        const style = window.getComputedStyle(span);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (span.offsetWidth === 0 && span.offsetHeight === 0) continue;

        const text = (safeText(span) || '').trim();
        if (text.toLowerCase() === 'promoted' || text.toLowerCase() === 'ad') {
          console.debug('[AlgorithmLens][Twitter][Sponsored] Detected via header label:', text);
          return {
            isSponsored: true,
            evidence: { strategy: 'headerLabel', matchedText: text, selector: 'header span' }
          };
        }
      }
    }
  }

  // Strategy 3: Fallback - check for Promoted label anywhere but ONLY if it's a dedicated small element
  const allSpans = safeQueryAll(container, 'span');
  for (const span of allSpans) {
    // Skip if inside tweet text area (caption)
    if (span.closest('[data-testid="tweetText"]')) continue;
    if (span.closest('div[lang]')) continue;

    // Skip hidden elements
    const style = window.getComputedStyle(span);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    if (span.offsetWidth === 0 && span.offsetHeight === 0) continue;

    const text = (safeText(span) || '').trim();
    // Must be exactly "Promoted" or "Ad" - not part of longer text
    if ((text.toLowerCase() === 'promoted' || text.toLowerCase() === 'ad') && text.length < 15) {
      console.debug('[AlgorithmLens][Twitter][Sponsored] Detected via dedicated label span:', text);
      return {
        isSponsored: true,
        evidence: { strategy: 'labelSpan', matchedText: text, selector: 'span' }
      };
    }
  }

  return { isSponsored: false, evidence: null };
}
/**
 * Extract a single Twitter/X post from its container element
 * @param {Element} container 
 * @param {number} index 
 * @returns {DesktopPostItem|null}
 */
function extractTwitterPost(container, index) {
  const platform = 'twitter';

  // Skip non-post modules (Who to follow, Topics, etc.)
  if (isNonPostModule(container, platform)) {
    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Twitter] Container ${index}: REJECTED (non-post module)`);
    }
    return { rejected: true, code: 'NON_POST_MODULE' };
  }

  const creator = extractTwitterCreator(container);
  const caption = extractTwitterCaption(container);
  const sponsoredResult = isTwitterSponsored(container);
  const isSponsored = sponsoredResult.isSponsored;
  const sponsoredEvidence = sponsoredResult.evidence;

  // Extract hashtags - try multiple methods
  // Twitter/X renders hashtags as links, but URL patterns may vary
  let hashtags = [];

  // Method 1: Links with /hashtag/ in href (traditional Twitter format)
  const hashtagLinks = safeQueryAll(container, 'a[href*="/hashtag/"]');
  for (const el of hashtagLinks) {
    const href = el.getAttribute('href') || '';
    const match = href.match(/\/hashtag\/([^?/]+)/);
    if (match && match[1]) {
      hashtags.push('#' + decodeURIComponent(match[1]));
    } else {
      const text = safeText(el) || '';
      if (text.startsWith('#')) {
        hashtags.push(text);
      }
    }
  }

  // Method 2: Links with /search?q=%23 (search URL format for hashtags)
  if (hashtags.length === 0) {
    const searchLinks = safeQueryAll(container, 'a[href*="/search?"]');
    for (const el of searchLinks) {
      const href = el.getAttribute('href') || '';
      // Match %23 (encoded #) in search query
      const match = href.match(/[?&]q=%23([^&]+)/);
      if (match && match[1]) {
        hashtags.push('#' + decodeURIComponent(match[1]));
      }
    }
  }

  // Method 3: Find links whose text content starts with # (visual hashtag detection)
  if (hashtags.length === 0) {
    const allLinks = safeQueryAll(container, 'a');
    for (const el of allLinks) {
      const text = safeText(el) || '';
      if (text.startsWith('#') && text.length > 1 && text.length < 50 && !text.includes(' ')) {
        hashtags.push(text);
      }
    }
  }

  // Method 4: Fall back to caption text extraction (regex-based)
  if (hashtags.length === 0) {
    hashtags = extractHashtags(caption);
  }

  // Deduplicate hashtags
  hashtags = [...new Set(hashtags)];

  if (CAPTURE_DEBUG && hashtags.length > 0) {
    debugLog('log', `[CaptureDebug][Twitter] Hashtags found: ${hashtags.length} - ${hashtags.slice(0, 3).join(', ')}`);
  }

  // Extract CTA
  const ctaText = extractCTA(container);

  // Extract link - prefer external links over profile links
  let link = null;
  const allLinks = safeQueryAll(container, 'a[role="link"][href^="http"]');
  for (const linkEl of allLinks) {
    const href = linkEl.getAttribute('href') || '';
    // Skip Twitter internal links
    if (!href.includes('twitter.com') && !href.includes('x.com') && !href.includes('t.co')) {
      link = href;
      break;
    }
  }

  // ============================================================================
  // ALWAYS extract tweet permalink for stable ID (even if we have external link)
  // ============================================================================
  let tweetPermalink = null;
  const permalinkSelectors = [
    'a[href*="/status/"]',
    'time[datetime]', // Often has parent link to tweet
  ];
  for (const sel of permalinkSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const linkEl = el.tagName === 'A' ? el : el.closest('a');
      if (linkEl) {
        const href = linkEl.getAttribute('href') || '';
        if (href.includes('/status/')) {
          tweetPermalink = href.startsWith('http') ? href : 'https://x.com' + href;
          break;
        }
      }
    }
  }

  // Use tweet permalink as the link if no external link was found
  if (!link && tweetPermalink) {
    link = tweetPermalink;
  }

  // Check for media presence (images, videos, cards)
  const hasMedia = !!(
    container.querySelector('img[src*="pbs.twimg.com/media"]') ||
    container.querySelector('video') ||
    container.querySelector('[data-testid="card.wrapper"]') ||
    container.querySelector('[data-testid="tweetPhoto"]')
  );

  // Generate stable ID - pass tweet permalink for proper status ID extraction
  const postId = generateStableId(platform, creator, caption, container, index, tweetPermalink);

  // ============================================================================
  // UNIFIED ACCEPTANCE CRITERIA:
  // HARD requirements: stable post identifier (permalink OR content-based ID)
  // SOFT requirements: at least one of (creator, caption, media)
  // ============================================================================
  const hasCreator = !!creator;
  const hasCaption = !!(caption && caption.length > 0);
  const hasPermalink = !!(link && link.includes('/status/'));
  const hasStableId = postId && !postId.includes('-idx');

  // Accept if we have: (creator OR caption OR media) AND (permalink OR stable ID)
  const hasIdentity = hasCreator || hasCaption || hasMedia;
  const hasIdentifier = hasPermalink || hasStableId;
  const isValidPost = hasIdentity && hasIdentifier;

  // Determine rejection code if invalid
  let rejectionCode = null;
  if (!isValidPost) {
    if (!hasIdentity) {
      rejectionCode = 'NO_CONTENT';
    } else if (!hasIdentifier) {
      rejectionCode = 'NO_IDENTIFIER';
    } else {
      rejectionCode = 'UNKNOWN';
    }
  }

  if (CAPTURE_DEBUG) {
    const rejectInfo = rejectionCode ? ` [${rejectionCode}]` : '';
    debugLog('log', `[CaptureDebug][Twitter] Container ${index}: hasCreator=${hasCreator}, hasCaption=${hasCaption}, hasMedia=${hasMedia}, hasPermalink=${hasPermalink}, hasStableId=${hasStableId} => ${isValidPost ? 'ACCEPTED' : 'REJECTED'}${rejectInfo}`);
  }

  if (isValidPost) {
    return {
      id: postId,
      platform,
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: sponsoredEvidence || null,
      ctaText: ctaText || null,
      link: link || null
    };
  }

  return { rejected: true, code: rejectionCode };
}

/**
 * Scan Twitter/X feed for tweets
 * @returns {DesktopPostItem[]}
 */
function scanTwitterFeed() {
  const platform = 'twitter';
  const posts = [];
  const issues = [];
  
  console.log('[AlgorithmLens][Twitter] 🔍 Starting scan...');
  console.log(`[AlgorithmLens][Twitter] URL: ${window.location.href}`);
  
  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Twitter] Starting scan - URL: ${window.location.href}`);
  }
  
  // NEW APPROACH: Select cellInnerDiv containers first, then get FIRST article from each
  // This ensures we only count top-level feed items, not quote tweets or embedded content
  const cellDivs = safeQueryAll(document, 'div[data-testid="cellInnerDiv"]');

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Twitter] Found ${cellDivs.length} cellInnerDiv containers`);
  }

  let containers = [];
  let usedSelector = 'cellInnerDiv->first article';

  // For each feed row, get only the FIRST article (the main tweet, not quote tweets)
  for (const cell of cellDivs) {
    const firstArticle = cell.querySelector('article[data-testid="tweet"]') || cell.querySelector('article');
    if (firstArticle) {
      containers.push(firstArticle);
    }
  }

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Twitter] Extracted ${containers.length} first-articles from cells`);
  }

  // Fallback: if no cellInnerDiv found, try direct article selector
  if (containers.length === 0) {
    const fallbackSelectors = [
      'article[data-testid="tweet"]',
      'article[role="article"]'
    ];

    for (const selector of fallbackSelectors) {
      const found = safeQueryAll(document, selector);
      if (found.length > 0) {
        containers = found;
        usedSelector = selector + ' (fallback)';
        break;
      }
    }
  }
  
  console.log(`[AlgorithmLens][Twitter] Found raw containers: ${containers.length} (${usedSelector})`);
  
  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Twitter] Selected selector: ${usedSelector || 'NONE'}, Containers: ${containers.length}`);
  }
  
  // Filter out empty or non-tweet containers
  containers = containers.filter(el => {
    const text = el.innerText || '';
    const hasContent = text.length > 20;
    const notHeader = !el.closest('header') && !el.closest('nav');
    return hasContent && notHeader;
  });

  // Filter out tweets below viewport (pre-loaded by Twitter but not yet seen by user)
  const viewportHeight = window.innerHeight;
  const beforeViewportFilter = containers.length;

  containers = containers.filter(el => {
    const rect = el.getBoundingClientRect();
    // Keep tweets that are visible OR above the viewport (already scrolled past)
    // rect.top < viewportHeight means top edge is within or above viewport
    // rect.bottom > 0 means bottom edge hasn't scrolled completely off top
    const isVisibleOrScrolledPast = rect.top < viewportHeight;
    return isVisibleOrScrolledPast;
  });

  console.log(`[AlgorithmLens][Twitter] Viewport filter: ${beforeViewportFilter} -> ${containers.length} (removed ${beforeViewportFilter - containers.length} below viewport)`);

  // Log each container's creator for debugging
  console.log(`[AlgorithmLens][Twitter] Analyzing ${containers.length} containers:`);
  containers.forEach((el, i) => {
    // Try to find creator name
    const userNameEl = el.querySelector('div[data-testid="User-Name"] a[href^="/"]');
    const creatorHandle = userNameEl ? userNameEl.getAttribute('href')?.replace('/', '') : 'unknown';
    const statusLink = el.querySelector('a[href*="/status/"]');
    const tweetId = statusLink?.href.match(/\/status\/(\d+)/)?.[1] || 'no-id';
    const rect = el.getBoundingClientRect();
    console.log(`  [${i}] @${creatorHandle} - tweet ID: ${tweetId} (top: ${Math.round(rect.top)}px)`);
  });

  // Deduplicate by tweet status ID - each tweet has a unique /status/ID URL
  // This prevents counting the same tweet multiple times (e.g., if it appears as a quote tweet AND main tweet)
  const seenTweetIds = new Set();
  const uniqueContainers = [];

  for (const container of containers) {
    // Find the tweet's status link to extract unique ID
    const statusLink = container.querySelector('a[href*="/status/"]');
    let tweetId = null;

    if (statusLink) {
      const match = statusLink.href.match(/\/status\/(\d+)/);
      if (match) {
        tweetId = match[1];
      }
    }

    // If we can extract a tweet ID, use it for deduplication
    if (tweetId) {
      if (seenTweetIds.has(tweetId)) {
        if (CAPTURE_DEBUG) {
          debugLog('log', `[CaptureDebug][Twitter] Skipping duplicate tweet ID: ${tweetId}`);
        }
        continue; // Skip duplicate
      }
      seenTweetIds.add(tweetId);
    }

    uniqueContainers.push(container);
  }

  containers = uniqueContainers;
  console.log(`[AlgorithmLens][Twitter] After tweet ID deduplication: ${containers.length} containers (${seenTweetIds.size} unique IDs)`);

  // Track rejection code histogram
  const rejectionCounts = {};

  containers.forEach((container, index) => {
    try {
      if (CAPTURE_DEBUG && index < 5) {
        const textNodes = container.querySelectorAll('div[data-testid="tweetText"], span[lang]');
        const captionText = Array.from(textNodes).map(n => n.textContent).filter(Boolean).join(' ').slice(0, 100);
        debugLog('log', `[CaptureDebug][Twitter] Container ${index}: checking extraction, text preview: "${captionText}..."`);
      }

      const result = extractTwitterPost(container, index);

      // Check if result is a rejection object
      if (result && result.rejected) {
        const code = result.code || 'UNKNOWN';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code });
      } else if (result) {
        posts.push(result);
        if (CAPTURE_DEBUG && index < 5) {
          debugLog('log', `[CaptureDebug][Twitter] Container ${index}: EXTRACTED - creator: ${result.creator || 'null'}, caption length: ${result.caption?.length || 0}`);
        }
      } else {
        const code = 'NULL_RESULT';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code });
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][Twitter] Error parsing container ${index}:`, err.message);
      const code = 'PARSE_ERROR';
      rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
      issues.push({ index, issue: code, error: err.message });
      if (CAPTURE_DEBUG) {
        debugLog('error', `[CaptureDebug][Twitter] Container ${index}: EXTRACTION ERROR - ${err.message}`);
      }
    }
  });

  // === DETAILED LOGGING ===
  console.log(`[AlgorithmLens][Twitter] Final posts extracted: ${posts.length}`);

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Twitter] Scan complete - Total posts: ${posts.length}, Issues: ${issues.length}`);
  }

  if (posts.length > 0) {
    console.table(posts.slice(0, 20).map(p => ({
      id: (p.id || '').slice(0, 25),
      creator: (p.creator || '—').slice(0, 20),
      captionSample: p.caption ? p.caption.slice(0, 60) + '...' : '—',
      isSponsored: p.isSponsored ? '✓ AD' : '',
      hasCTA: p.ctaText ? '✓' : '',
      link: p.link ? '✓' : ''
    })));
  }

  logScanResults('Twitter', posts, issues, containers.length, rejectionCounts);

  return posts;
}

// ============================================================================
// REDDIT SCANNER
// ============================================================================

/**
 * Extract creator name from a Reddit post container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractRedditCreator(container) {
  // Strategy 1: Shreddit-post attribute (most reliable for new Reddit)
  // shreddit-post elements have an "author" attribute directly
  const authorAttr = container.getAttribute?.('author');
  if (authorAttr && isValidCreator(authorAttr)) {
    return 'u/' + authorAttr;
  }
  
  // Strategy 2: Author link with data-click-id="user"
  const userLink = safeQuery(container, 'a[data-click-id="user"]');
  if (userLink) {
    const text = safeText(userLink);
    if (text && isValidCreator(text)) {
      return text.startsWith('u/') ? text : 'u/' + text.trim();
    }
    // Try href extraction
    const href = userLink.getAttribute('href') || '';
    const match = href.match(/\/user\/([^/?]+)/);
    if (match && match[1]) {
      return 'u/' + match[1];
    }
  }
  
  // Strategy 3: Look for author in faceplate-tracker or other shreddit components
  const faceplateAuthor = safeQuery(container, 'faceplate-tracker[noun="author_name"] a, a[slot="authorName"]');
  if (faceplateAuthor) {
    const text = safeText(faceplateAuthor);
    if (text && isValidCreator(text)) {
      return text.startsWith('u/') ? text : 'u/' + text.trim();
    }
  }
  
  // Strategy 4: Look for u/username pattern in links
  const allLinks = safeQueryAll(container, 'a[href*="/user/"]');
  for (const link of allLinks) {
    const text = safeText(link);
    if (text && text.startsWith('u/')) {
      const username = text.slice(2);
      if (isValidCreator(username)) {
        return text; // Keep the u/ prefix for Reddit
      }
    }
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/user\/([^/?]+)/);
    if (match && match[1] && isValidCreator(match[1])) {
      return 'u/' + match[1];
    }
  }
  
  // Strategy 5: Look for author span/text with various selectors
  const authorSelectors = [
    '[data-testid="post_author_link"]',
    'a[data-testid="author-name"]',
    'span[data-testid="author_link"]',
    'a.author',
    'a[class*="author"]',
    'span[class*="author"]',
    // Shreddit specific
    'shreddit-post-author-byline a',
    '[slot="author"] a'
  ];
  
  for (const sel of authorSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const text = safeText(el);
      if (text && isValidCreator(text)) {
        return text.startsWith('u/') ? text : 'u/' + text.trim();
      }
    }
  }
  
  // Strategy 6: Subreddit as fallback creator
  // Try subreddit-name attribute first (shreddit)
  const subredditAttr = container.getAttribute?.('subreddit-prefixed-name');
  if (subredditAttr) {
    return subredditAttr; // Already has r/ prefix
  }
  
  const subredditLink = safeQuery(container, 'a[href*="/r/"]');
  if (subredditLink) {
    const href = subredditLink.getAttribute('href') || '';
    const match = href.match(/\/r\/([^/?]+)/);
    if (match && match[1]) {
      return 'r/' + match[1];
    }
  }
  
  return null;
}

/**
 * Check if text looks like a valid Reddit title/caption
 * Less strict than the general isValidCaption since Reddit titles can be short
 * @param {string|null} text 
 * @returns {boolean}
 */
function isValidRedditCaption(text) {
  if (!text) return false;
  const t = text.trim();
  // Reddit titles can be short (e.g., "lol", "AITA?", etc.) - just require non-empty
  // and filter out obvious UI/metadata patterns
  return t.length > 0 &&
         !/^(\d+[hmd]?\s*(ago)?|just now|yesterday|today)$/i.test(t) &&
         !/^(like|comment|share|reply|see more|sponsored|ad|follow|message)$/i.test(t) &&
         !/^\d+ (hour|minute|second|day|week|month|year)s? ago$/i.test(t) &&
         !/^(all reactions|comments|shares):/i.test(t) &&
         !t.match(/^\d+\s*(likes?|comments?|shares?|views?|upvotes?|awards?)$/i) &&
         !t.match(/^(Share|Save|Hide|Report|Crosspost)$/i);
}

/**
 * Extract caption/title from a Reddit post container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractRedditCaption(container) {
  // Strategy 1: Shreddit-post attribute (most reliable for new Reddit)
  // shreddit-post elements have a "post-title" attribute directly
  const titleAttr = container.getAttribute?.('post-title');
  if (titleAttr && isValidRedditCaption(titleAttr)) {
    return titleAttr.trim();
  }
  
  // Strategy 2: Post title in heading elements
  const headingSelectors = [
    'h1[slot="title"]',       // Shreddit slot
    'h3[slot="title"]',       // Shreddit slot alternative
    '[slot="title"]',         // Any element in title slot
    'a[slot="full-post-link"]', // Shreddit full post link
    'h3',                     // Generic h3
    'h1',                     // Generic h1
  ];
  
  for (const sel of headingSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const text = safeText(el);
      if (text && isValidRedditCaption(text)) {
        return text;
      }
    }
  }
  
  // Strategy 3: Post title link selectors
  const titleLinkSelectors = [
    'a[data-click-id="body"] h3',
    'a[data-click-id="body"]',
    '[data-testid="post-title"]',
    'a[data-testid="post-title"]',
    'a.title',                // Old Reddit
    'p.title a',              // Old Reddit alternative
  ];
  
  for (const sel of titleLinkSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const text = safeText(el);
      if (text && isValidRedditCaption(text)) {
        return text;
      }
    }
  }
  
  // Strategy 4: Post body text (for text/self posts)
  const bodySelectors = [
    'div[data-click-id="text"]',
    '[data-testid="post-content"]',
    'div[slot="text-body"]',     // Shreddit text body slot
    'div[class*="RichTextJSON"]',
    'div.md',                    // Old Reddit markdown
    'div.usertext-body',         // Old Reddit usertext
  ];
  
  for (const sel of bodySelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const text = safeText(el);
      if (text && text.length > 10 && isValidRedditCaption(text)) {
        // Prefer title over body, but use body if no title found
        return text.slice(0, 500); // Limit body length
      }
    }
  }
  
  // Strategy 5: Fallback - search for any substantial text in the container
  // that looks like a title (not metadata)
  const allText = safeText(container);
  if (allText && allText.length > 20) {
    // Try to extract first meaningful line that's not metadata
    const lines = allText.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 5 && 
             trimmed.length < 300 &&
             !trimmed.match(/^\d+\s*(upvotes?|comments?|awards?)$/i) &&
             !trimmed.match(/^(posted by|submitted|u\/|r\/)/i) &&
             !trimmed.match(/^Share|^Save|^Hide|^Report/i);
    });
    
    if (lines.length > 0 && isValidRedditCaption(lines[0])) {
      return lines[0].trim();
    }
  }
  
  return null;
}

/**
 * Detect if a Reddit post is sponsored/promoted
 * @param {Element} container 
 * @returns {boolean}
 */
function isRedditSponsored(container) {
  // Strategy 1: Check shreddit-post attribute (most reliable for new Reddit)
  // Promoted posts have is-promoted="true" or is-ad="true" attribute
  const isPromotedAttr = container.getAttribute?.('is-promoted');
  const isAdAttr = container.getAttribute?.('is-ad');
  if (isPromotedAttr === 'true' || isAdAttr === 'true' || isPromotedAttr === '' || isAdAttr === '') {
    console.debug('[AlgorithmLens][Reddit][Sponsored] Detected via shreddit is-promoted/is-ad attribute');
    return true;
  }
  
  // Strategy 2: Check for shreddit-ad-post element (ad-specific component)
  if (container.tagName?.toLowerCase() === 'shreddit-ad-post' || 
      safeQuery(container, 'shreddit-ad-post')) {
    console.debug('[AlgorithmLens][Reddit][Sponsored] Detected via shreddit-ad-post element');
    return true;
  }
  
  // Strategy 3: Check for "Promoted" badge/label in text
  const allText = (container.innerText || '').toLowerCase();
  if (/\bpromoted\b/.test(allText)) {
    console.debug('[AlgorithmLens][Reddit][Sponsored] Detected via Promoted label');
    return true;
  }
  
  // Strategy 4: Check data-click-id for sponsored
  if (container.getAttribute('data-click-id') === 'sponsored' ||
      safeQuery(container, '[data-click-id="sponsored"]')) {
    console.debug('[AlgorithmLens][Reddit][Sponsored] Detected via data-click-id="sponsored"');
    return true;
  }
  
  // Strategy 5: Check for ad-specific classes or attributes
  const adSelectors = [
    '[class*="promoted"]',
    '[class*="Promoted"]',
    '[data-testid*="promoted"]',
    '[data-ad-id]',
    '[ad-id]',
    '[is-promoted]',
    '[is-ad]',
  ];
  
  for (const sel of adSelectors) {
    try {
      if (safeQuery(container, sel) || container.matches?.(sel)) {
        console.debug('[AlgorithmLens][Reddit][Sponsored] Detected via selector:', sel);
        return true;
      }
    } catch (e) {}
  }
  
  // Strategy 6: Check flair for "Ad" or "Promoted"
  const flairElements = safeQueryAll(container, '[class*="flair"], [class*="Flair"], [slot="flair"]');
  for (const flair of flairElements) {
    const text = (safeText(flair) || '').toLowerCase();
    if (text === 'promoted' || text === 'ad' || text === 'advertisement') {
      console.debug('[AlgorithmLens][Reddit][Sponsored] Detected via flair:', text);
      return true;
    }
  }
  
  // Strategy 7: Check for sponsored span/badge
  const spans = safeQueryAll(container, 'span');
  for (const span of spans) {
    const text = (safeText(span) || '').toLowerCase().trim();
    if (text === 'promoted' || text === 'sponsored') {
      console.debug('[AlgorithmLens][Reddit][Sponsored] Detected via span text:', text);
      return true;
    }
  }
  
  return false;
}

/**
 * Extract a single Reddit post from its container element
 * Simplified, permissive implementation for shreddit-post elements
 * @param {Element} container 
 * @param {number} index 
 * @param {Array} issues - mutable array to collect extraction issues
 * @returns {DesktopPostItem|null}
 */
function extractRedditPost(container, index, issues = []) {
  const platform = 'reddit';
  const tag = container.tagName?.toLowerCase() || 'unknown';
  const isShreddit = tag === 'shreddit-post';
  
  let creator = null;
  let caption = null;
  let link = null;
  
  // =========================================================================
  // SHREDDIT-POST: Simple attribute-based extraction (no complex helpers)
  // =========================================================================
  if (isShreddit) {
    const titleAttr = container.getAttribute('post-title');
    const authorAttr = container.getAttribute('author');
    const contentHrefAttr = container.getAttribute('content-href');
    const permalinkAttr = container.getAttribute('permalink');
    const subredditPrefixed = container.getAttribute('subreddit-prefixed-name');
    
    // Extract caption from post-title attribute
    if (titleAttr && typeof titleAttr === 'string') {
      caption = titleAttr.trim() || null;
    }
    
    // Extract creator from author attribute
    if (authorAttr && typeof authorAttr === 'string') {
      const trimmedAuthor = authorAttr.trim();
      if (trimmedAuthor.length > 0) {
        creator = 'u/' + trimmedAuthor;
      }
    }
    
    // Fallback: if no author but we have a subreddit name, use that
    if (!creator && subredditPrefixed && typeof subredditPrefixed === 'string') {
      const trimmedSub = subredditPrefixed.trim();
      if (trimmedSub.length > 0) {
        creator = trimmedSub;
      }
    }
    
    // Extract link from content-href or permalink
    link = contentHrefAttr || permalinkAttr || null;
    if (link && !link.startsWith('http')) {
      link = 'https://www.reddit.com' + link;
    }
    
    // For shreddit-post with at least one non-empty field, build the post directly
    if (caption || creator) {
      // Generate stable ID using permalink (comment ID) - not index-based
      const postId = generateStableId(platform, creator, caption, container, index, link);

      return {
        id: postId,
        platform,
        creator: creator || null,
        caption: caption || null,
        hashtags: extractHashtags(caption),
        isSponsored: isRedditSponsored(container),
        sponsoredEvidence: null, // Reddit sponsored detection returns boolean only
        ctaText: null,
        link: link || null
      };
    }

    // Shreddit-post with no creator AND no caption - return rejection code
    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Reddit] Container ${index}: REJECTED [NO_CONTENT] - shreddit-post with no title/author`);
    }
    return { rejected: true, code: 'NO_CONTENT' };
  }
  
  // =========================================================================
  // NON-SHREDDIT (old Reddit, fallback): Use existing helpers
  // =========================================================================
  creator = extractRedditCreator(container);
  caption = extractRedditCaption(container);
  
  const isSponsored = isRedditSponsored(container);
  
  // Extract hashtags from caption (less common on Reddit, but possible)
  const hashtags = extractHashtags(caption);
  
  // Extract CTA (for promoted posts)
  const ctaText = isSponsored ? extractCTA(container) : null;
  
  // Extract link
  // Strategy 1: Check for external link (link posts)
  const externalLinks = safeQueryAll(container, 'a[href^="http"]');
  for (const linkEl of externalLinks) {
    const href = linkEl.getAttribute('href') || '';
    // Skip Reddit internal links
    if (!href.includes('reddit.com') && !href.includes('redd.it')) {
      link = href;
      break;
    }
  }
  
  // Strategy 2: Fallback - get permalink to the post from link element
  if (!link) {
    const permalinkSelectors = [
      'a[href*="/comments/"]',
      'a[slot="full-post-link"]',
      'a[data-click-id="body"]'
    ];
    
    for (const sel of permalinkSelectors) {
      const permalinkEl = safeQuery(container, sel);
      if (permalinkEl) {
        link = permalinkEl.getAttribute('href');
        if (link && !link.startsWith('http')) {
          link = 'https://www.reddit.com' + link;
        }
        break;
      }
    }
  }
  
  // Generate stable ID using permalink (comment ID) - not index-based
  const postId = generateStableId(platform, creator, caption, container, index, link);

  // Only skip when BOTH creator and caption are missing
  if (!creator && !caption) {
    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Reddit] Container ${index}: REJECTED [NO_CONTENT] - no creator and no caption`);
    }
    return { rejected: true, code: 'NO_CONTENT' };
  }

  return {
    id: postId,
    platform,
    creator: creator || null,
    caption: caption || null,
    hashtags,
    isSponsored: Boolean(isSponsored),
    sponsoredEvidence: null, // Reddit sponsored detection returns boolean only
    ctaText: ctaText || null,
    link: link || null
  };
}

/**
 * Scan Reddit feed for posts
 * @returns {DesktopPostItem[]}
 */
function scanRedditFeed() {
  const platform = 'reddit';
  const posts = [];
  const issues = [];
  
  console.log('[AlgorithmLens][Reddit] 🔍 Starting scan...');
  console.log('[AlgorithmLens][Reddit] URL:', window.location.href);
  
  // Primary selectors for Reddit posts - ordered by reliability
  // Modern Reddit (2024+) uses shreddit-post web components
  // Newer Reddit uses article elements with specific attributes
  // Classic Reddit uses div[data-testid="post-container"]
  const containerSelectors = [
    // Shreddit (newest Reddit) - web component
    'shreddit-post',
    // New Reddit - article with post attributes
    'article[data-testid="post-container"]',
    // New Reddit - div with post container testid
    'div[data-testid="post-container"]',
    // New Reddit alternative selectors
    'div[data-adclicklocation="background"]',
    'faceplate-tracker[source="post"]',
    // Classic new Reddit
    'article.Post',
    'div[class*="_1oQyIsiPHYt6nx7VOmd1sz"]', // Reddit's obfuscated post class
  ];
  
  let containers = [];
  let usedSelector = null;
  
  // Try each selector until we find posts
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    if (found.length > 0) {
      containers = found;
      usedSelector = selector;
      console.log(`[AlgorithmLens][Reddit] Using selector: ${selector}, found: ${found.length}`);
      break;
    }
  }
  
  // Fallback for old Reddit (old.reddit.com)
  if (containers.length === 0) {
    const oldRedditContainers = safeQueryAll(document, 'div.thing.link');
    if (oldRedditContainers.length > 0) {
      containers = oldRedditContainers;
      usedSelector = 'old-reddit: div.thing.link';
    }
  }
  
  // Additional fallback: look for any element with content-href attribute (shreddit posts)
  if (containers.length === 0) {
    const shredditByAttr = safeQueryAll(document, '[content-href*="/comments/"]');
    if (shredditByAttr.length > 0) {
      containers = shredditByAttr;
      usedSelector = 'shreddit-by-content-href';
    }
  }
  
  console.log('[AlgorithmLens][Reddit] Found raw containers:', containers.length, `(${usedSelector})`);
  
  // Debug: If no containers, log what we can find
  if (containers.length === 0) {
    console.log('[AlgorithmLens][Reddit] ⚠️ No containers found. Debug info:');
    console.log('[AlgorithmLens][Reddit]   - shreddit-post count:', document.querySelectorAll('shreddit-post').length);
    console.log('[AlgorithmLens][Reddit]   - article count:', document.querySelectorAll('article').length);
    console.log('[AlgorithmLens][Reddit]   - [data-testid] count:', document.querySelectorAll('[data-testid]').length);
    console.log('[AlgorithmLens][Reddit]   - div.thing.link count:', document.querySelectorAll('div.thing.link').length);
  }
  
  // Filter out non-post containers
  // For shreddit-post elements, check attributes instead of innerText (web components may use shadow DOM)
  containers = containers.filter(el => {
    const isShreddit = el.tagName?.toLowerCase() === 'shreddit-post';
    const notSidebar = !el.closest('[class*="sidebar"]') && !el.closest('[class*="Sidebar"]');
    
    if (!notSidebar) {
      return false;
    }
    
    // For shreddit-post, check for post-title or author attributes
    if (isShreddit) {
      const hasPostTitle = el.getAttribute('post-title');
      const hasAuthor = el.getAttribute('author');
      const hasPermalink = el.getAttribute('permalink') || el.getAttribute('content-href');
      // Accept if it has any of these attributes
      return hasPostTitle || hasAuthor || hasPermalink;
    }
    
    // For other elements, use traditional innerText check
    const text = el.innerText || '';
    const hasContent = text.length > 20;
    return hasContent;
  });
  
  console.log('[AlgorithmLens][Reddit] After filtering: ', containers.length, 'containers');
  
  // Deduplicate nested containers
  const uniqueContainers = [];
  const seen = new WeakSet();
  
  for (const container of containers) {
    let isDuplicate = false;
    let parent = container.parentElement;
    while (parent) {
      if (seen.has(parent)) {
        isDuplicate = true;
        break;
      }
      parent = parent.parentElement;
    }
    
    if (!isDuplicate) {
      uniqueContainers.push(container);
      seen.add(container);
    }
  }
  
  containers = uniqueContainers;
  console.log(`[AlgorithmLens][Reddit] After deduplication: ${containers.length} containers`);

  // Track rejection code histogram
  const rejectionCounts = {};

  // Map containers to posts, handling rejection objects
  containers.forEach((container, index) => {
    try {
      const result = extractRedditPost(container, index, issues);

      // Check if result is a rejection object
      if (result && result.rejected) {
        const code = result.code || 'UNKNOWN';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code });
      } else if (result) {
        posts.push(result);
      } else {
        const code = 'NULL_RESULT';
        rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
        issues.push({ index, issue: code });
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][Reddit] Error parsing container ${index}:`, err.message);
      const code = 'PARSE_ERROR';
      rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
      issues.push({ index, issue: code, error: err.message });
    }
  });
  
  // =========================================================================
  // FALLBACK: If normal extraction yields 0 posts but we have containers,
  // use a simple, bulletproof extraction that ALWAYS produces posts.
  // Reliability > clever filtering. Some noise is OK; 0 items is NOT OK.
  // =========================================================================
  if (posts.length === 0 && containers.length > 0) {
    console.warn('[AlgorithmLens][Reddit] No posts extracted from', containers.length, 'containers; using fallback extraction.');
    
    const fallbackPosts = containers.map((container, index) => {
      const tag = container.tagName?.toLowerCase() || 'unknown';
      const isShreddit = tag === 'shreddit-post';
      
      let caption = null;
      let creator = null;
      let link = null;
      
      if (isShreddit) {
        const titleAttr = container.getAttribute('post-title');
        const authorAttr = container.getAttribute('author');
        const contentHrefAttr = container.getAttribute('content-href');
        const permalinkAttr = container.getAttribute('permalink');
        const subredditPrefixed = container.getAttribute('subreddit-prefixed-name');
        
        if (titleAttr) caption = String(titleAttr).trim();
        if (authorAttr) creator = String(authorAttr).trim();
        if (!creator && subredditPrefixed) creator = String(subredditPrefixed).trim();
        link = contentHrefAttr || permalinkAttr || null;
        if (link && !link.startsWith('http')) {
          link = 'https://www.reddit.com' + link;
        }
      }
      
      // If we still don't have caption from attributes, fall back to innerText
      if (!caption) {
        const text = (container.innerText || '').trim();
        caption = text ? text.slice(0, 280) : null;
      }
      
      // If we still don't have ANY data, skip this one
      if (!caption && !creator) {
        return null;
      }

      // Generate stable ID - use permalink if available, otherwise content hash
      const id = generateStableId('reddit', creator, caption, container, index, link);
      
      return {
        id,
        platform: 'reddit',
        creator: creator || null,
        caption: caption || null,
        hashtags: [],
        isSponsored: isRedditSponsored(container),
        ctaText: null,
        link: link || null,
      };
    }).filter(Boolean);
    
    console.debug('[AlgorithmLens][Reddit] Fallback posts extracted:', fallbackPosts.length);
    
    if (fallbackPosts.length > 0) {
      console.table(
        fallbackPosts.slice(0, 10).map((p) => ({
          id: p.id,
          creator: p.creator,
          captionSample: p.caption ? p.caption.slice(0, 80) : null,
          isSponsored: p.isSponsored,
          link: p.link,
        }))
      );
    }
    
    logScanResults('Reddit', fallbackPosts, issues, containers.length, rejectionCounts);

    // ===== INSTRUMENTATION: Final return value from scanRedditFeed (fallback path) =====
    console.debug('[AlgorithmLens][Reddit] 🔄 scanRedditFeed() RETURNING (fallback):', fallbackPosts.length, 'posts');
    if (fallbackPosts.length > 0) {
      console.table(
        fallbackPosts.slice(0, 5).map((p) => ({
          id: p.id,
          creator: p.creator,
          captionSample: p.caption ? p.caption.slice(0, 80) : null,
          isSponsored: p.isSponsored,
          link: p.link,
        }))
      );
    }
    
    return fallbackPosts;
  }
  
  // === DETAILED LOGGING ===
  console.debug('[AlgorithmLens][Reddit] Final posts extracted:', posts.length);
  
  if (posts.length > 0) {
    console.table(
      posts.slice(0, 10).map((p) => ({
        id: p.id,
        creator: p.creator,
        captionSample: p.caption ? p.caption.slice(0, 80) : null,
        isSponsored: p.isSponsored,
        link: p.link,
      }))
    );
  }
  
  if (posts.length === 0) {
    console.warn('[AlgorithmLens][Reddit] ⚠️ No posts extracted. Issues:', issues);
  }

  logScanResults('Reddit', posts, issues, containers.length, rejectionCounts);

  // ===== INSTRUMENTATION: Final return value from scanRedditFeed (normal path) =====
  console.debug('[AlgorithmLens][Reddit] 🔄 scanRedditFeed() RETURNING (normal):', posts.length, 'posts');
  if (posts.length > 0) {
    console.table(
      posts.slice(0, 5).map((p) => ({
        id: p.id,
        creator: p.creator,
        captionSample: p.caption ? p.caption.slice(0, 80) : null,
        isSponsored: p.isSponsored,
        link: p.link,
      }))
    );
  }
  
  return posts;
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Log scan results in a developer-friendly format with structured diagnostics
 * @param {string} platformName
 * @param {DesktopPostItem[]} posts
 * @param {Array} issues
 */
function logScanResults(platformName, posts, issues, containersSeen = 0, rejectionHistogram = null, explicitSubtype = null) {
  // Build structured issue histogram (fallback if not provided)
  const issueCounts = rejectionHistogram || {};
  if (!rejectionHistogram) {
    issues.forEach(i => {
      issueCounts[i.issue] = (issueCounts[i.issue] || 0) + 1;
    });
  }

  // ============================================================================
  // SCAN_SUMMARY: Always logged (not gated) - ONE summary line per scan
  // ============================================================================
  const containersCount = containersSeen || (posts.length + issues.length);

  // Determine subtype for Instagram (use explicit if provided, otherwise detect)
  let subtype = explicitSubtype;
  if (!subtype && platformName.toLowerCase() === 'instagram') {
    subtype = isInstagramReels() ? 'reels' : 'feed';
  }

  // Build summary line with optional subtype and rejection histogram
  const subtypePart = subtype ? `, subtype: "${subtype}"` : '';
  const histogramStr = Object.keys(issueCounts).length > 0
    ? `, rejectionCodes: ${JSON.stringify(issueCounts)}`
    : '';
  console.log(`[AlgorithmLens] SCAN_SUMMARY { platform: "${platformName}"${subtypePart}, containersSeen: ${containersCount}, extracted: ${posts.length}, rejected: ${issues.length}${histogramStr} }`);

  // Detailed breakdown (for verbose logging)
  console.log(`[AlgorithmLens][${platformName}] ========================================`);
  console.log(`[AlgorithmLens][${platformName}] SCAN COMPLETE`);
  console.log(`[AlgorithmLens][${platformName}]    Total posts extracted: ${posts.length}`);

  const sponsored = posts.filter(p => p.isSponsored).length;
  const withCreator = posts.filter(p => p.creator).length;
  const withCaption = posts.filter(p => p.caption).length;
  const withHashtags = posts.filter(p => p.hashtags && p.hashtags.length > 0).length;
  const withCTA = posts.filter(p => p.ctaText).length;
  const withLink = posts.filter(p => p.link).length;

  console.log(`[AlgorithmLens][${platformName}]    Sponsored/Ads: ${sponsored} (${posts.length > 0 ? Math.round(sponsored/posts.length*100) : 0}%)`);
  console.log(`[AlgorithmLens][${platformName}]    With creator: ${withCreator}`);
  console.log(`[AlgorithmLens][${platformName}]    With caption: ${withCaption}`);
  console.log(`[AlgorithmLens][${platformName}]    With hashtags: ${withHashtags}`);
  console.log(`[AlgorithmLens][${platformName}]    With CTA: ${withCTA}`);
  console.log(`[AlgorithmLens][${platformName}]    With link: ${withLink}`);

  // Log extraction issues
  if (issues.length > 0) {
    console.log(`[AlgorithmLens][${platformName}] Rejections: ${issues.length}`, issueCounts);
  }

  console.log(`[AlgorithmLens][${platformName}] ========================================`);

  // ============================================================================
  // STRUCTURED DIAGNOSTICS (gated behind CAPTURE_DEBUG for verbose details)
  // ============================================================================
  if (CAPTURE_DEBUG) {
    const summary = {
      platform: platformName.toLowerCase(),
      timestamp: new Date().toISOString(),
      containersSeen: containersCount,
      postsAccepted: posts.length,
      postsRejected: issues.length,
      rejectionReasons: issueCounts,
      metrics: {
        withCreator,
        withCaption,
        withLink,
        sponsored,
      }
    };
    debugLog('log', `[CaptureDebug][${platformName}] Full summary:`, summary);
  }
}

// ============================================================================
// MAIN SCAN FUNCTION
// ============================================================================

/**
 * Main entry point: scan the current feed based on detected platform
 * @returns {DesktopPostItem[]}
 */
function scanFeed() {
  const platform = detectPlatform();
  
  console.log('\n');
  console.log('[AlgorithmLens] ╔════════════════════════════════════════╗');
  console.log('[AlgorithmLens] ║         FEED SCAN INITIATED            ║');
  console.log('[AlgorithmLens] ╚════════════════════════════════════════╝');
  console.log(`[AlgorithmLens] Platform: ${platform}`);
  console.log(`[AlgorithmLens] URL: ${window.location.href}`);
  console.log(`[AlgorithmLens] Time: ${new Date().toISOString()}`);
  
  let posts = [];
  
  try {
    switch (platform) {
      case 'tiktok':
        posts = scanTikTokFeed();
        break;
      case 'instagram':
        posts = scanInstagramFeed();
        break;
      case 'youtube':
        posts = scanYouTubeFeed();
        break;
      case 'facebook':
        posts = scanFacebookFeed();
        break;
      case 'twitter':
        posts = scanTwitterFeed();
        break;
      case 'reddit':
        posts = scanRedditFeed();
        break;
      default:
        console.warn('[AlgorithmLens] ❌ Unknown platform - cannot scan');
        return [];
    }
  } catch (error) {
    console.error('[AlgorithmLens] ❌ Scan failed with error:', error);
    return [];
  }
  
  console.log('[AlgorithmLens] ╔════════════════════════════════════════╗');
  console.log(`[AlgorithmLens] ║  SCAN COMPLETE: ${String(posts.length).padStart(3)} posts extracted    ║`);
  console.log('[AlgorithmLens] ╚════════════════════════════════════════╝');
  console.log('\n');
  
  return posts;
}

// ============================================================================
// SESSION MODE FUNCTIONS
// ============================================================================

/**
 * Get feed container selector for MutationObserver
 * @param {string} platform 
 * @returns {string[]}
 */
function getFeedContainerSelectors(platform) {
  switch (platform) {
    case 'tiktok':
      return [
        '[class*="DivItemContainer"]',
        'main',
        '#main-content-video_detail'
      ];
    case 'instagram':
      return [
        'main[role="main"]',
        'article',
        'section main'
      ];
    case 'youtube':
      return [
        'ytd-rich-grid-renderer',
        'ytd-watch-flexy',
        '#contents'
      ];
    case 'facebook':
      // Facebook uses role="feed" for the main feed container
      // Also watch role="main" as fallback
      return [
        'div[role="feed"]',
        'div[role="main"]',
        '[data-pagelet="Feed"]',
        '[data-pagelet*="FeedUnit"]'
      ];
    case 'twitter':
      // Twitter/X uses main role and primaryColumn for the main feed
      return [
        'main[role="main"]',
        'div[data-testid="primaryColumn"]',
        'div[data-testid="cellInnerDiv"]'
      ];
    case 'reddit':
      // Reddit uses main and various post list containers
      // Shreddit (new Reddit) uses shreddit-feed and shreddit-post
      return [
        'main',
        'shreddit-feed',                      // Shreddit feed container
        'div[data-testid="posts-list"]',      // Classic new Reddit
        'div[data-scroller-first]',           // Virtualized scroller
        '#siteTable',                         // Old Reddit
      ];
    default:
      return ['body'];
  }
}

/**
 * Get individual post container selectors for each platform
 * These are used by IntersectionObserver to detect when posts enter viewport
 * @param {string} platform
 * @param {object} context - Optional context (e.g., isShorts for YouTube, isReels for Instagram)
 * @returns {string[]}
 */
function getPostContainerSelectors(platform, context = {}) {
  switch (platform) {
    case 'tiktok':
      return [
        '[data-e2e="recommend-list-item-container"]',
        '[data-e2e="search-card-video-card"]',
        '[class*="DivItemContainerV2"]',
        '[class*="DivItemContainerForSearch"]',
        '[class*="DivContentContainer"]',
        'div[class*="video-feed-item"]',
        '[class*="DivBrowserModeContainer"]'
      ];
    case 'instagram':
      // Instagram Reels uses different containers than regular feed
      if (context.isReels) {
        return [
          'div[class*="x1ned7t2"]',  // Reels video wrapper
          'div[class*="xh8yej3"]',   // Reels container
          'section[class*="_aap0"]', // Reels section
          'div[style*="translateX"]', // Carousel-style reels
          'article[role="presentation"]',
          'article'
        ];
      }
      return [
        'article[role="presentation"]',
        'article'
      ];
    case 'youtube':
      // YouTube Shorts uses different containers than regular feed
      if (context.isShorts) {
        return [
          'ytd-reel-video-renderer',
          'ytd-shorts',
          '[class*="reel-video"]'
        ];
      }
      return [
        'ytd-rich-item-renderer',
        'ytd-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-grid-video-renderer'
      ];
    case 'facebook':
      return [
        'div[data-pagelet^="FeedUnit_"]'
      ];
    case 'twitter':
      return [
        'article[data-testid="tweet"]',
        'article[role="article"]',
        'div[data-testid="cellInnerDiv"] article'
      ];
    case 'reddit':
      return [
        'shreddit-post',
        'article[data-testid="post-container"]',
        'div[data-testid="post-container"]',
        'div[data-adclicklocation="background"]',
        'faceplate-tracker[source="post"]',
        'article.Post',
        'div.thing.link' // Old Reddit
      ];
    default:
      return [];
  }
}

/**
 * Check if a container element has media content (post validity check)
 * @param {Element} container
 * @param {string} platform
 * @returns {boolean}
 */
function containerHasMedia(container, platform) {
  // Reddit's shreddit-post uses shadow DOM and attributes, not child elements
  if (platform === 'reddit' && container.tagName?.toLowerCase() === 'shreddit-post') {
    const hasPostTitle = container.getAttribute('post-title');
    const hasAuthor = container.getAttribute('author');
    const hasPermalink = container.getAttribute('permalink') || container.getAttribute('content-href');
    return hasPostTitle || hasAuthor || hasPermalink;
  }

  // Instagram-specific: Accept articles even without visible media
  // Instagram lazy-loads images, so posts below viewport may have placeholder elements
  // We rely on article structure rather than media presence
  if (platform === 'instagram') {
    // For regular feed: article tags are posts
    if (container.tagName?.toLowerCase() === 'article') {
      return true;
    }
    // For Reels: sections with specific classes, divs with video-like attributes
    if (container.tagName?.toLowerCase() === 'section') {
      return true;
    }
    // Accept divs with common Reels container patterns
    if (container.getAttribute('role') === 'presentation') {
      return true;
    }
    // Check for any structural indicators of a post
    const hasHeader = !!container.querySelector('header');
    const hasTimeElement = !!container.querySelector('time');
    const hasProfileLink = !!container.querySelector('a[href^="/"][href$="/"]');
    if (hasHeader || hasTimeElement || hasProfileLink) {
      return true;
    }
    // Fallback to media check
    return !!container.querySelector('img, video, canvas');
  }

  // Twitter-specific: Accept tweet containers based on structure
  if (platform === 'twitter') {
    // Check for tweet-specific structure
    const hasTweetText = !!container.querySelector('[data-testid="tweetText"]');
    const hasUserName = !!container.querySelector('[data-testid="User-Name"]');
    const hasTimestamp = !!container.querySelector('time[datetime]');
    if (hasTweetText || hasUserName || hasTimestamp) {
      return true;
    }
    // Fallback to media check
    return !!container.querySelector('img, video');
  }

  // For other platforms, check for media elements
  return !!container.querySelector('img, video, #video-title, #thumbnail, h3');
}

/**
 * Extract a post from a container using the appropriate platform-specific function
 * @param {Element} container
 * @param {string} platform
 * @param {object} context - Platform-specific context (isShorts, isReels, etc.)
 * @returns {object|null}
 */
function extractPostForPlatform(container, platform, context = {}) {
  try {
    switch (platform) {
      case 'tiktok':
        return extractTikTokPost(container, -1);
      case 'instagram':
        return extractInstagramPost(container, -1);
      case 'youtube':
        return extractYouTubePost(container, -1, context.isShorts || false);
      case 'facebook':
        return extractFacebookPost(container, -1);
      case 'twitter':
        return extractTwitterPost(container, -1);
      case 'reddit':
        return extractRedditPost(container, -1);
      default:
        return null;
    }
  } catch (e) {
    // Extraction errors are expected for some container types
    return null;
  }
}

/**
 * Get platform-specific context for the current page
 * @param {string} platform
 * @returns {object}
 */
function getPlatformContext(platform) {
  switch (platform) {
    case 'instagram':
      return { isReels: isInstagramReels() };
    case 'youtube':
      return { isShorts: window.location.pathname.includes('/shorts') };
    default:
      return {};
  }
}

/**
 * Collect visible posts and add new ones to session
 * Includes rate limiting to protect browser performance
 */
function collectVisiblePosts() {
  if (!sessionActive || !sessionPlatform) return;
  
  if (CAPTURE_DEBUG) {
    const elapsed = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
    debugLog('log', `[CaptureDebug][${sessionPlatform}] collectVisiblePosts() called - Elapsed: ${elapsed}s, Current total: ${sessionPosts.size}`);
  }
  
  // Check scroll-based activation - force scan if user scrolled significantly
  const currentScrollY = window.scrollY || window.pageYOffset || 0;
  const scrollDelta = Math.abs(currentScrollY - lastScrollY);
  if (scrollDelta > 100) {
    forceNextScan = true;
  }
  lastScrollY = currentScrollY;
  
  // Override rate delay if forced (e.g., by scroll)
  if (forceNextScan) {
    forceNextScan = false;
    lastCollectionDelayedUntil = 0;
  }
  
  // Soft rate limiting - delay instead of skip (quiet, no logging)
  if (Date.now() < lastCollectionDelayedUntil) {
    return; // Quiet delay, no noisy warnings
  }
  
  let posts = [];
  
  switch (sessionPlatform) {
    case 'tiktok':
      posts = scanTikTokFeed();
      break;
    case 'instagram':
      posts = scanInstagramFeed();
      break;
    case 'youtube':
      posts = scanYouTubeFeed();
      break;
    case 'facebook':
      posts = scanFacebookFeed();
      // ===== ENHANCED INSTRUMENTATION: Facebook-specific logging in collectVisiblePosts =====
      console.debug('[AlgorithmLens][Facebook][Session] ════════════════════════════════════════════');
      console.debug('[AlgorithmLens][Facebook][Session] 📥 collectVisiblePosts() completed');
      console.debug('[AlgorithmLens][Facebook][Session]   → Posts returned from scanFacebookFeed():', posts.length);
      if (posts.length === 0) {
        console.warn('[AlgorithmLens][Facebook][Session] ⚠️ ZERO POSTS RETURNED!');
        console.warn('[AlgorithmLens][Facebook][Session]   → Check console logs above for selector/extraction diagnostics');
        console.warn('[AlgorithmLens][Facebook][Session]   → Ensure you are on the main Facebook feed');
        console.warn('[AlgorithmLens][Facebook][Session]   → Try scrolling to load more content');
      } else {
        const sponsored = posts.filter(p => p.isSponsored).length;
        console.debug('[AlgorithmLens][Facebook][Session]   → Sponsored posts in batch:', sponsored);
        console.debug('[AlgorithmLens][Facebook][Session]   → Sample creators:', posts.slice(0, 3).map(p => p.creator || '(none)'));
      }
      console.debug('[AlgorithmLens][Facebook][Session] ════════════════════════════════════════════');
      break;
    case 'twitter':
      posts = scanTwitterFeed();
      break;
    case 'reddit':
      posts = scanRedditFeed();
      // ===== INSTRUMENTATION: Reddit-specific logging in collectVisiblePosts =====
      console.debug('[AlgorithmLens][Reddit] 📥 collectVisiblePosts() got', posts.length, 'posts from scanRedditFeed()');
      break;
  }
  
  let newCount = 0;
  let duplicateCount = 0;
  
  for (const post of posts) {
    if (!post.id) {
      console.warn('[AlgorithmLens][Session] Post missing ID, skipping');
      continue;
    }
    
    if (sessionPosts.has(post.id)) {
      // Already seen this post - this is EXPECTED behavior with stable IDs
      duplicateCount++;
      // Only log first few duplicates to avoid spam
      if (duplicateCount <= 3 && sessionPlatform === 'facebook') {
        console.debug('[AlgorithmLens][Facebook][Session] Skipping duplicate post:', post.id.slice(0, 50));
      }
    } else {
      sessionPosts.set(post.id, post);
      newCount++;
    }
  }
  
  if (newCount > 0 || duplicateCount > 0) {
    console.log(`[AlgorithmLens][Session] ➕ Batch: ${posts.length} scanned, ${newCount} new, ${duplicateCount} duplicates. Total unique: ${sessionPosts.size}`);
  }
  
  if (CAPTURE_DEBUG) {
    const elapsed = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
    debugLog('log', `[CaptureDebug][${sessionPlatform}] Batch complete - Scanned: ${posts.length}, New: ${newCount}, Duplicates: ${duplicateCount}, Total unique: ${sessionPosts.size}, Elapsed: ${elapsed}s`);
  }
  
  // ============================================================================
  // SOFT RATE LIMITING: Track posts-per-second and delay next cycle if too fast
  // Never blocks, never skips - just adds small delays to smooth out bursts
  // ============================================================================
  if (newCount > 0 && sessionRateState.sessionStartTimeMs) {
    sessionRateState.totalNewPostsThisSession += newCount;
    
    const elapsedSeconds = Math.max((Date.now() - sessionRateState.sessionStartTimeMs) / 1000, 1);
    const postsPerSecond = sessionRateState.totalNewPostsThisSession / elapsedSeconds;
    
    // Only apply delay if exceeding BURST threshold (50 posts/sec)
    // MAX_POSTS_PER_SECOND (30) is informational only
    if (postsPerSecond > BURST_POSTS_PER_SECOND) {
      // Too fast - insert delay instead of skipping
      lastCollectionDelayedUntil = Date.now() + RATE_DELAY_MS;
      // No console spam - quiet delay
    } else if (postsPerSecond <= MAX_POSTS_PER_SECOND) {
      // Rate is normal, reset any consecutive counter
      sessionRateState.consecutiveRateExceeds = 0;
    }
  }
  
  // ===== INSTRUMENTATION: Reddit-specific logging for session state =====
  if (sessionPlatform === 'reddit') {
    console.debug('[AlgorithmLens][Reddit] 📊 Session state after collectVisiblePosts: sessionPosts.size =', sessionPosts.size);
  }
  
  // ===== ENHANCED INSTRUMENTATION: Facebook-specific logging for session state =====
  if (sessionPlatform === 'facebook') {
    console.debug('[AlgorithmLens][Facebook][Session] 📊 Session state after collectVisiblePosts:');
    console.debug('[AlgorithmLens][Facebook][Session]   → Batch: scanned=%d, new=%d, duplicates=%d', posts.length, newCount, duplicateCount);
    console.debug('[AlgorithmLens][Facebook][Session]   → sessionPosts.size (total unique):', sessionPosts.size);
    
    if (sessionPosts.size > 0) {
      const fbPosts = Array.from(sessionPosts.values()).filter(p => p.platform === 'facebook');
      const sponsored = fbPosts.filter(p => p.isSponsored).length;
      const withCreator = fbPosts.filter(p => p.creator).length;
      const withCaption = fbPosts.filter(p => p.caption && p.caption.length > 10).length;
      const withLink = fbPosts.filter(p => p.link).length;
      
      console.debug('[AlgorithmLens][Facebook][Session]   → Facebook posts in session:', fbPosts.length);
      console.debug('[AlgorithmLens][Facebook][Session]   → With creator:', withCreator);
      console.debug('[AlgorithmLens][Facebook][Session]   → With caption >10 chars:', withCaption);
      console.debug('[AlgorithmLens][Facebook][Session]   → With link:', withLink);
      console.debug('[AlgorithmLens][Facebook][Session]   → Sponsored:', sponsored, `(${fbPosts.length > 0 ? Math.round(sponsored / fbPosts.length * 100) : 0}%)`);
    } else {
      console.warn('[AlgorithmLens][Facebook][Session] ⚠️ Session has 0 posts accumulated!');
    }
  }
}

/**
 * Set up MutationObserver and IntersectionObserver for detecting new feed content
 *
 * UNIFIED APPROACH (all platforms):
 * Uses IntersectionObserver to capture posts ONLY when they enter the viewport.
 * This prevents capturing pre-loaded posts below viewport that user may never actually see.
 *
 * Previous bug: MutationObserver captured posts immediately when added to DOM, but platforms
 * pre-load posts speculatively for smooth scrolling, causing us to capture posts user never viewed.
 */
function setupSessionObserver() {
  const feedContainerSelectors = getFeedContainerSelectors(sessionPlatform);

  let feedContainer = null;
  for (const selector of feedContainerSelectors) {
    feedContainer = document.querySelector(selector);
    if (feedContainer) break;
  }

  if (!feedContainer) {
    feedContainer = document.body;
  }

  console.log(`[AlgorithmLens][Session] 👁️ Setting up observer on:`, feedContainer.tagName || 'body');

  // Get platform-specific context and post container selectors
  const platformContext = getPlatformContext(sessionPlatform);
  const postContainerSelectors = getPostContainerSelectors(sessionPlatform, platformContext);

  // Determine logging context (e.g., "Reels" vs "Feed" for Instagram, "Shorts" vs "Feed" for YouTube)
  let viewportContext = 'Feed';
  if (sessionPlatform === 'instagram' && platformContext.isReels) {
    viewportContext = 'Reels';
  } else if (sessionPlatform === 'youtube' && platformContext.isShorts) {
    viewportContext = 'Shorts';
  }

  console.log(`[AlgorithmLens][Session] Platform: ${sessionPlatform}, Context: ${viewportContext}`);
  console.log(`[AlgorithmLens][Session] Using ${postContainerSelectors.length} post container selectors`);

  // ============================================================================
  // UNIFIED INTERSECTIONOBSERVER - Captures posts when they enter viewport
  // This applies to ALL platforms for accurate "what user actually saw" tracking
  // ============================================================================
  platformViewportObserver = new IntersectionObserver((entries) => {
    if (!sessionActive) return;

    for (const entry of entries) {
      // Only capture when post enters viewport (isIntersecting = true)
      if (entry.isIntersecting) {
        const container = entry.target;

        try {
          const result = extractPostForPlatform(container, sessionPlatform, platformContext);
          if (result && !result.rejected && result.id) {
            if (!sessionPosts.has(result.id)) {
              sessionPosts.set(result.id, result);
              if (CAPTURE_DEBUG) {
                debugLog('log', `[CaptureDebug][${sessionPlatform}][${viewportContext}] VIEWPORT: Captured post when it entered viewport: ${result.id}`);
              }
            }
          }
        } catch (e) {
          // Ignore extraction errors - expected for some container types
        }

        // Stop observing this element once we've processed it
        platformViewportObserver.unobserve(container);
      }
    }
  }, {
    threshold: 0.1, // Trigger when at least 10% of the post is visible
    rootMargin: '50px 0px 50px 0px' // Small buffer to capture slightly before entering viewport
  });

  // ============================================================================
  // UNIFIED MUTATIONOBSERVER - Detects new DOM elements and adds them to IntersectionObserver
  // ============================================================================

  // Track containers we've already processed to avoid duplicates
  const processedContainers = new WeakSet();

  const platformMutationObserver = new MutationObserver((mutations) => {
    if (!sessionActive) return;

    // Look for newly added post containers
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Find all potential post containers in the added node
        const containers = [];

        // Check if the node itself matches any container selector
        for (const selector of postContainerSelectors) {
          try {
            if (node.matches && node.matches(selector)) {
              containers.push(node);
              break; // Node matched, don't add it multiple times
            }
          } catch (e) {
            // matches() can throw on invalid selectors
          }
        }

        // Also check for containers inside the added node
        if (node.querySelectorAll) {
          for (const selector of postContainerSelectors) {
            try {
              const found = node.querySelectorAll(selector);
              containers.push(...found);
            } catch (e) {
              // querySelectorAll can throw on invalid selectors
            }
          }
        }

        // Deduplicate and filter containers
        for (const container of containers) {
          // Skip if already processed
          if (processedContainers.has(container)) continue;

          // Skip containers without media/content (not actual posts)
          if (!containerHasMedia(container, sessionPlatform)) continue;

          // For Instagram: skip non-article containers nested inside an article
          // (to avoid double-capturing)
          if (sessionPlatform === 'instagram') {
            if (container.tagName !== 'ARTICLE' && container.closest('article')) {
              continue;
            }
          }

          processedContainers.add(container);

          // Check if container is already in or above viewport
          const rect = container.getBoundingClientRect();
          const windowHeight = window.innerHeight || document.documentElement.clientHeight;
          const isInOrAboveViewport = rect.top < windowHeight && rect.bottom > 0;

          if (isInOrAboveViewport) {
            // Already visible - capture immediately
            try {
              const result = extractPostForPlatform(container, sessionPlatform, platformContext);
              if (result && !result.rejected && result.id) {
                if (!sessionPosts.has(result.id)) {
                  sessionPosts.set(result.id, result);
                  if (CAPTURE_DEBUG) {
                    debugLog('log', `[CaptureDebug][${sessionPlatform}][${viewportContext}] MUTATION+VISIBLE: Captured post already in viewport: ${result.id}`);
                  }
                }
              }
            } catch (e) {
              // Ignore extraction errors
            }
          } else {
            // Below viewport - add to IntersectionObserver to capture when user scrolls to it
            platformViewportObserver.observe(container);
            if (CAPTURE_DEBUG) {
              debugLog('log', `[CaptureDebug][${sessionPlatform}][${viewportContext}] MUTATION: Added post below viewport to observer (will capture when viewed)`);
            }
          }
        }
      }
    }
  });

  platformMutationObserver.observe(feedContainer, { childList: true, subtree: true });
  sessionObservers.push(platformMutationObserver);

  // Add IntersectionObserver cleanup to session observers
  sessionObservers.push({ disconnect: () => {
    if (platformViewportObserver) {
      platformViewportObserver.disconnect();
      platformViewportObserver = null;
    }
  }});

  // ============================================================================
  // SCROLL HANDLER - Backup capture mechanism
  // The IntersectionObserver is the primary capture mechanism, but we keep this
  // scroll handler as a backup to catch any posts that might slip through
  // (e.g., posts that were already in DOM before observer was set up)
  // ============================================================================
  let lastThrottledScan = 0;
  const SCROLL_THROTTLE_MS = 500; // Reduced frequency since IntersectionObserver is primary

  const scrollHandler = () => {
    if (!sessionActive) return;
    lastScrollTime = Date.now();

    // THROTTLE: Scan with reduced frequency (backup only)
    const now = Date.now();
    if (now - lastThrottledScan >= SCROLL_THROTTLE_MS) {
      lastThrottledScan = now;
      collectVisiblePosts();
    }

    // DEBOUNCE: Schedule a final scan after scrolling stops
    clearTimeout(window._alScrollDebounce);
    window._alScrollDebounce = setTimeout(() => {
      lastThrottledScan = Date.now();
      collectVisiblePosts();
    }, SCAN_INTERVAL_SCROLLING_MS);
  };

  window.addEventListener('scroll', scrollHandler, { passive: true });
  sessionObservers.push({ disconnect: () => window.removeEventListener('scroll', scrollHandler) });

  // ============================================================================
  // INITIAL SCAN - Capture posts already visible when session starts
  // ============================================================================
  // Find and observe all existing post containers
  for (const selector of postContainerSelectors) {
    try {
      const existingContainers = feedContainer.querySelectorAll(selector);
      for (const container of existingContainers) {
        if (processedContainers.has(container)) continue;
        if (!containerHasMedia(container, sessionPlatform)) continue;

        // Instagram-specific nesting check
        if (sessionPlatform === 'instagram') {
          if (container.tagName !== 'ARTICLE' && container.closest('article')) {
            continue;
          }
        }

        processedContainers.add(container);

        // Check viewport position
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const isInOrAboveViewport = rect.top < windowHeight && rect.bottom > 0;

        if (isInOrAboveViewport) {
          // Visible - capture immediately
          try {
            const result = extractPostForPlatform(container, sessionPlatform, platformContext);
            if (result && !result.rejected && result.id) {
              if (!sessionPosts.has(result.id)) {
                sessionPosts.set(result.id, result);
                if (CAPTURE_DEBUG) {
                  debugLog('log', `[CaptureDebug][${sessionPlatform}][${viewportContext}] INITIAL: Captured existing visible post: ${result.id}`);
                }
              }
            }
          } catch (e) {
            // Ignore extraction errors
          }
        } else {
          // Below viewport - add to observer
          platformViewportObserver.observe(container);
        }
      }
    } catch (e) {
      // Selector may be invalid for this page
    }
  }

  console.log('[AlgorithmLens][Session] ✅ Observers ready (unified IntersectionObserver for all platforms)');

  // ============================================================================
  // YOUTUBE SHORTS URL CHANGE DETECTION
  // Shorts virtualize content - only 1 video exists in DOM at a time
  // We detect new Shorts by watching for URL changes (/shorts/VIDEO_ID)
  // ============================================================================
  if (sessionPlatform === 'youtube' && platformContext.isShorts) {
    let lastShortsUrl = ''; // Start empty to capture initial Short
    let shortsUrlCheckInterval = null;

    const captureShortsFromUrl = () => {
      if (!sessionActive) return;

      const currentUrl = window.location.href;
      if (currentUrl === lastShortsUrl) return;

      // URL changed - this is a new Short
      lastShortsUrl = currentUrl;

      // Extract video ID from URL
      const shortsMatch = currentUrl.match(/\/shorts\/([^?/]+)/);
      if (!shortsMatch) return;

      const videoId = shortsMatch[1];
      const postId = `youtube-${videoId}`;

      // Skip if we already have this Short
      if (sessionPosts.has(postId)) {
        console.log(`[AlgorithmLens][Shorts] URL changed but already captured: ${postId}`);
        return;
      }

      console.log(`[AlgorithmLens][Shorts] 📹 New Short detected via URL: ${videoId}`);

      // Find the current Shorts container and extract data
      const shortsContainer = document.querySelector('ytd-reel-video-renderer, ytd-shorts, [class*="reel-video"]');
      if (shortsContainer) {
        try {
          const result = extractPostForPlatform(shortsContainer, sessionPlatform, platformContext);
          if (result && !result.rejected && result.id) {
            sessionPosts.set(result.id, result);
            console.log(`[AlgorithmLens][Shorts] ✅ Captured Short: ${result.id} (creator: ${result.creator || 'unknown'})`);
            if (CAPTURE_DEBUG) {
              debugLog('log', `[CaptureDebug][YouTube][Shorts] URL_CHANGE: Captured new Short: ${result.id}`);
            }
          } else if (result && result.rejected) {
            console.log(`[AlgorithmLens][Shorts] ⚠️ Short rejected: ${result.code}`);
          }
        } catch (e) {
          console.warn('[AlgorithmLens][Shorts] Error extracting Short:', e.message);
        }
      } else {
        // No container found - create a minimal post entry from URL
        console.log(`[AlgorithmLens][Shorts] ⚠️ No container found, creating minimal entry from URL`);
        sessionPosts.set(postId, {
          id: postId,
          platform: 'youtube',
          platformSubtype: 'shorts',
          creator: null,
          caption: null,
          hashtags: [],
          isSponsored: false,
          sponsoredEvidence: null,
          ctaText: null,
          link: currentUrl
        });
      }
    };

    // Check for URL changes every 200ms (YouTube uses pushState for navigation)
    shortsUrlCheckInterval = setInterval(captureShortsFromUrl, 200);

    // Also listen for popstate (back/forward navigation)
    const shortsPopstateHandler = () => {
      setTimeout(captureShortsFromUrl, 100); // Small delay to let DOM update
    };
    window.addEventListener('popstate', shortsPopstateHandler);

    // Capture the initial Short
    captureShortsFromUrl();

    // Add cleanup
    sessionObservers.push({
      disconnect: () => {
        if (shortsUrlCheckInterval) {
          clearInterval(shortsUrlCheckInterval);
          shortsUrlCheckInterval = null;
        }
        window.removeEventListener('popstate', shortsPopstateHandler);
      }
    });

    console.log('[AlgorithmLens][Session] 🎬 Shorts URL change detector active');
  }
}

/**
 * Start a session scan
 * UPDATED: Always starts fresh - clears any existing session state first
 * @returns {Object}
 */
function startSessionScan() {
  console.debug('[AlgorithmLens][Session][Content] startSessionScan() called');
  
  const platform = detectPlatform();
  console.debug('[AlgorithmLens][Session][Content] Detected platform:', platform);
  
  if (platform === 'unknown') {
    console.warn('[AlgorithmLens][Session][Content] Platform is unknown, cannot start session');
    return { success: false, error: 'Unsupported platform' };
  }
  
  // ============================================================================
  // ALWAYS CLEAR AND RESTART: This ensures Start always works on first click
  // ============================================================================
  if (sessionActive) {
    console.log('[AlgorithmLens][Session][Content] Session was already active, clearing and restarting fresh');
    console.debug('[AlgorithmLens][Session][Content]   → Previous platform:', sessionPlatform);
    console.debug('[AlgorithmLens][Session][Content]   → Previous post count:', sessionPosts.size);
  }
  
  // Clear ALL previous state unconditionally
  sessionPosts.clear();
  sessionObservers.forEach(obs => { try { obs.disconnect(); } catch {} });
  sessionObservers = [];
  clearTimeout(window._alSessionDebounce);
  clearTimeout(window._alScrollDebounce);
  
  // Reset Facebook container tracking (hash-based)
  facebookProcessedContainerHashes = new Set();
  
  // Reset soft rate limiting delay tracking
  lastCollectionDelayedUntil = 0;
  lastScrollY = window.scrollY || window.pageYOffset || 0;
  forceNextScan = false;
  lastScrollTime = 0; // Reset scroll interval tracking
  
  // Reset rate limiting state
  sessionRateState = {
    totalNewPostsThisSession: 0,
    sessionStartTimeMs: Date.now(),
    consecutiveRateExceeds: 0,
    rateLimitTriggered: false  // Kept for backward compat but never triggered
  };
  
  // Initialize fresh session
  sessionActive = true;
  sessionPlatform = platform;
  sessionStartTime = Date.now();
  
  console.log('\n');
  console.log('[AlgorithmLens][Session] ╔════════════════════════════════════════╗');
  console.log('[AlgorithmLens][Session] ║         SESSION SCAN STARTED           ║');
  console.log('[AlgorithmLens][Session] ╚════════════════════════════════════════╝');
  console.log(`[AlgorithmLens][Session] Platform: ${platform}`);
  console.log(`[AlgorithmLens][Session] Start time: ${new Date().toISOString()}`);
  
  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][${platform}] START_SESSION_SCAN - Session started at ${new Date().toISOString()}`);
  }
  
  // Initial collection
  collectVisiblePosts();
  
  // Set up observers
  setupSessionObserver();
  
  // Set up periodic heartbeat logging (every 1 second during active session)
  if (CAPTURE_DEBUG) {
    const heartbeatInterval = setInterval(() => {
      if (!sessionActive) {
        clearInterval(heartbeatInterval);
        return;
      }
      const elapsed = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
      const selectorCounts = {};
      if (platform === 'instagram') {
        const selectors = ['article[role="presentation"]', 'article', 'div[class*="_aagv"]'];
        selectors.forEach(sel => {
          const found = document.querySelectorAll(sel);
          selectorCounts[sel] = found.length;
        });
      } else if (platform === 'twitter') {
        const selectors = ['article[data-testid="tweet"]', 'article[role="article"]'];
        selectors.forEach(sel => {
          const found = document.querySelectorAll(sel);
          selectorCounts[sel] = found.length;
        });
      }
      debugLog('log', `[CaptureDebug][${platform}] Heartbeat - Elapsed: ${elapsed}s, Total posts: ${sessionPosts.size}, Selector counts:`, selectorCounts);
    }, 1000);
    // Store interval ID so we can clear it on stop
    window._alCaptureDebugHeartbeat = heartbeatInterval;
  }
  
  console.debug('[AlgorithmLens][Session][Content] startSessionScan() → observers attached, debouncers set.');
  console.log(`[AlgorithmLens][Session] 📊 Initial posts collected: ${sessionPosts.size}`);
  
  return {
    success: true,
    platform: sessionPlatform,
    message: 'Session scan started',
    initialPostCount: sessionPosts.size
  };
}

/**
 * Stop session scan and return all collected posts
 * @returns {Object}
 */
function stopSessionScan() {
  console.log('\n');
  console.log('[AlgorithmLens][Session] ╔════════════════════════════════════════╗');
  console.log('[AlgorithmLens][Session] ║         SESSION SCAN STOPPING          ║');
  console.log('[AlgorithmLens][Session] ╚════════════════════════════════════════╝');
  
  // Capture platform before clearing
  const currentPlatform = sessionPlatform || detectPlatform();
  
  // Final collection
  if (sessionActive) {
    collectVisiblePosts();
  }
  
  // Disconnect observers
  sessionObservers.forEach(obs => { try { obs.disconnect(); } catch {} });
  sessionObservers = [];
  
  // Clear timeouts
  clearTimeout(window._alSessionDebounce);
  clearTimeout(window._alScrollDebounce);
  
  // Gather results
  const posts = Array.from(sessionPosts.values());
  const platform = currentPlatform;
  const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
  
  // ===== INSTRUMENTATION: Reddit-specific logging before clearing session =====
  if (platform === 'reddit') {
    console.debug('[AlgorithmLens][Reddit] 📤 stopSessionScan() gathered', posts.length, 'posts from sessionPosts');
    if (posts.length > 0) {
      console.table(
        posts.slice(0, 5).map((p) => ({
          id: p.id,
          creator: p.creator,
          captionSample: p.caption ? p.caption.slice(0, 80) : null,
          isSponsored: p.isSponsored,
          link: p.link,
        }))
      );
    }
  }
  
  // ===== ENHANCED INSTRUMENTATION: Facebook-specific logging before clearing session =====
  if (platform === 'facebook') {
    console.log('[AlgorithmLens][Facebook][Session] ════════════════════════════════════════════');
    console.log('[AlgorithmLens][Facebook][Session] 📤 STOP SESSION - FINAL FACEBOOK RESULTS');
    console.log('[AlgorithmLens][Facebook][Session] ════════════════════════════════════════════');
    console.log('[AlgorithmLens][Facebook][Session]   → Total posts gathered:', posts.length);
    
    if (posts.length > 0) {
      const sponsored = posts.filter(p => p.isSponsored).length;
      const withCreator = posts.filter(p => p.creator).length;
      const withCaption = posts.filter(p => p.caption && p.caption.length > 10).length;
      const withLink = posts.filter(p => p.link).length;
      const withCTA = posts.filter(p => p.ctaText).length;
      
      console.log('[AlgorithmLens][Facebook][Session]   → Sponsored/Ads:', sponsored, `(${posts.length > 0 ? Math.round(sponsored / posts.length * 100) : 0}%)`);
      console.log('[AlgorithmLens][Facebook][Session]   → With creator name:', withCreator);
      console.log('[AlgorithmLens][Facebook][Session]   → With caption >10 chars:', withCaption);
      console.log('[AlgorithmLens][Facebook][Session]   → With external link:', withLink);
      console.log('[AlgorithmLens][Facebook][Session]   → With CTA button:', withCTA);
      
      console.log('[AlgorithmLens][Facebook][Session] Sample posts (first 15):');
      console.table(
        posts.slice(0, 15).map((p, i) => ({
          '#': i,
          id: (p.id || '').slice(0, 30),
          creator: p.creator ? p.creator.slice(0, 25) : '—',
          captionSample: p.caption ? p.caption.slice(0, 50) + '...' : '—',
          isSponsored: p.isSponsored ? '✓ AD' : '',
          hasLink: p.link ? '✓' : '',
          hasCTA: p.ctaText ? '✓' : '',
        }))
      );
    } else {
      console.error('[AlgorithmLens][Facebook][Session] ════════════════════════════════════════════');
      console.error('[AlgorithmLens][Facebook][Session] ❌ NO POSTS COLLECTED DURING SESSION!');
      console.error('[AlgorithmLens][Facebook][Session] ════════════════════════════════════════════');
      console.error('[AlgorithmLens][Facebook][Session] Possible reasons:');
      console.error('[AlgorithmLens][Facebook][Session]   1. Not on the main Facebook feed (check URL)');
      console.error('[AlgorithmLens][Facebook][Session]   2. Feed content not loaded (try scrolling)');
      console.error('[AlgorithmLens][Facebook][Session]   3. Facebook DOM structure changed significantly');
      console.error('[AlgorithmLens][Facebook][Session]   4. Ad blockers interfering with content');
      console.error('[AlgorithmLens][Facebook][Session] Check earlier console logs for detailed diagnostics');
    }
    console.log('[AlgorithmLens][Facebook][Session] ════════════════════════════════════════════');
  }
  
  // Capture rate limit state before clearing
  const wasRateLimited = sessionRateState.rateLimitTriggered;
  const rateStateSnapshot = {
    totalNewPostsThisSession: sessionRateState.totalNewPostsThisSession,
    rateLimitTriggered: sessionRateState.rateLimitTriggered
  };
  
  // Clear session state
  sessionActive = false;
  
  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][${platform}] STOP_SESSION_SCAN - Final total: ${sessionPosts.size} posts, Duration: ${duration}s`);
    if (window._alCaptureDebugHeartbeat) {
      clearInterval(window._alCaptureDebugHeartbeat);
      window._alCaptureDebugHeartbeat = null;
    }
  }
  
  sessionPosts.clear();
  sessionPlatform = null;
  sessionStartTime = null;
  
  // Reset rate limit state
  sessionRateState = {
    totalNewPostsThisSession: 0,
    sessionStartTimeMs: null,
    consecutiveRateExceeds: 0,
    rateLimitTriggered: false
  };
  
  // Log summary
  const sponsored = posts.filter(p => p.isSponsored).length;
  const adPct = posts.length > 0 ? Math.round(sponsored / posts.length * 100) : 0;
  
  // Aggregate posts by platform for debugging
  const summaryObject = {};
  for (const post of posts) {
    summaryObject[post.platform] = (summaryObject[post.platform] || 0) + 1;
  }
  console.debug('[AlgorithmLens][Session] stopSessionScan() aggregated posts by platform:', summaryObject);
  
  console.log(`[AlgorithmLens][Session] Duration: ${duration} seconds`);
  console.log(`[AlgorithmLens][Session] Total unique posts: ${posts.length}`);
  console.log(`[AlgorithmLens][Session] Sponsored/Ads: ${sponsored} (${adPct}%)`);
  if (wasRateLimited) {
    console.log(`[AlgorithmLens][Session] ⚠️ Rate limit was triggered during session`);
  }
  console.log('[AlgorithmLens][Session] ╔════════════════════════════════════════╗');
  console.log('[AlgorithmLens][Session] ║           SESSION COMPLETE             ║');
  console.log('[AlgorithmLens][Session] ╚════════════════════════════════════════╝');
  console.log('\n');
  
  // ===== INSTRUMENTATION: Reddit-specific logging of final return value =====
  if (platform === 'reddit') {
    console.debug('[AlgorithmLens][Reddit] 🔄 stopSessionScan() RETURNING to background.js:', posts.length, 'posts');
  }
  
  return {
    success: true,
    platform,
    posts,
    postCount: posts.length,
    rateLimited: wasRateLimited,
    rateState: rateStateSnapshot
  };
}

/**
 * Get current session status
 * @returns {Object}
 */
function getSessionStatus() {
  return {
    active: sessionActive,
    platform: sessionPlatform,
    postCount: sessionPosts.size,
    duration: sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0,
    rateLimited: sessionRateState.rateLimitTriggered,
    postsPerSecond: sessionRateState.sessionStartTimeMs 
      ? (sessionRateState.totalNewPostsThisSession / Math.max((Date.now() - sessionRateState.sessionStartTimeMs) / 1000, 1))
      : 0
  };
}

// ============================================================================
// MESSAGE LISTENER (Extension API)
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const action = message.action || message.type;
  console.log(`[AlgorithmLens] 📨 Message received: ${action}`);
  
  // Platform check / ping
  if (message.type === 'PING') {
    const platform = detectPlatform();
    sendResponse({
      status: 'ok',
      platform,
      url: window.location.href
    });
    return true;
  }
  
  // Get session status
  if (message.action === 'GET_SESSION_STATUS') {
    sendResponse(getSessionStatus());
    return true;
  }
  
  // Start session scan
  if (message.action === 'START_SESSION_SCAN') {
    console.debug('[AlgorithmLens][Session][Content] START_SESSION_SCAN received from background');
    const result = startSessionScan();
    sendResponse(result);
    return true;
  }
  
  // Stop session scan (user clicked Stop in popup)
  if (message.action === 'STOP_SESSION_SCAN') {
    console.debug('[AlgorithmLens][Session][Content] STOP_SESSION_SCAN received from background (user-initiated)');
    const result = stopSessionScan();
    sendResponse(result);
    return true;
  }
  
  // One-shot feed scan
  if (message.action === 'SCAN_FEED' || message.type === 'START_SCAN') {
    try {
      const posts = scanFeed();
      sendResponse({
        success: true,
        posts,
        platform: detectPlatform(),
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AlgorithmLens] ❌ Scan failed:', error);
      sendResponse({
        success: false,
        error: error.message || 'Unknown error',
        posts: []
      });
    }
    return true;
  }
  
  return true;
});

// ============================================================================
// INITIALIZATION
// ============================================================================

(function init() {
  const platform = detectPlatform();
  const runId = Math.random().toString(36).substring(2, 9);
  
  console.log('\n');
  console.log('[AlgorithmLens] ╔════════════════════════════════════════╗');
  console.log('[AlgorithmLens] ║      CONTENT SCRIPT INITIALIZED        ║');
  console.log('[AlgorithmLens] ╚════════════════════════════════════════╝');
  console.log(`[AlgorithmLens] Platform: ${platform}`);
  console.log(`[AlgorithmLens] URL: ${window.location.href}`);
  console.log('[AlgorithmLens] Ready for commands: SCAN_FEED, START_SESSION_SCAN, STOP_SESSION_SCAN');
  console.log('\n');
  
  if (CAPTURE_DEBUG) {
    const timestamp = new Date().toISOString();
    debugLog('log', `[CaptureDebug] content init - Platform: ${platform}, URL: ${window.location.href}, RunID: ${runId}, Timestamp: ${timestamp}`);
  }
})();
