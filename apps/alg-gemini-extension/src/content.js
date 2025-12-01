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
// SESSION STATE
// ============================================================================

let sessionActive = false;
let sessionPosts = new Map(); // key: stable post ID, value: DesktopPostItem
let sessionObservers = [];    // MutationObservers to disconnect on stop
let sessionPlatform = null;
let sessionStartTime = null;

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
    if (
      text.includes("suggested for you") ||
      text.includes("try these reels") ||
      text.includes("top reels") ||
      text.includes("explore") ||
      text.includes("new for you") ||
      (text.includes("follow") && container.querySelectorAll("button").length > 1)
    ) {
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

  if (platform === "youtube") {
    if (
      text.includes("mix") ||
      text.includes("playlist") ||
      text.includes("recommended") ||
      text.includes("channels for you") ||
      text.includes("people also watched")
    ) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
 * Generate a stable unique ID for deduplication
 * @param {string} platform 
 * @param {string|null} creator 
 * @param {string|null} caption 
 * @param {Element} element 
 * @param {number} index 
 * @returns {string}
 */
function generateStableId(platform, creator, caption, element, index) {
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
  
  // Fallback: index + timestamp
  return `${platform}-idx${index}-${Date.now()}`;
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
 * Validate if text looks like a real creator name (not a timestamp or UI element)
 * @param {string|null} text 
 * @returns {boolean}
 */
function isValidCreator(text) {
  if (!text) return false;
  const t = text.trim();
  return t.length > 0 && 
         t.length < 100 &&
         !t.includes('·') && 
         !t.includes(' hr') &&
         !t.includes(' min') &&
         !/^\d+[hmd]?\s*(ago)?$/i.test(t) &&
         !/^(just now|yesterday|today)$/i.test(t) &&
         !/^(like|comment|share|reply|see more|sponsored|ad|suggested for you)$/i.test(t) &&
         !/^\d+ (hour|minute|second|day|week|month|year)s? ago$/i.test(t) &&
         !/^\d+\s*$/.test(t); // Pure numeric
}

/**
 * Validate if text looks like a real caption (not UI chrome or metadata)
 * @param {string|null} text 
 * @returns {boolean}
 */
function isValidCaption(text) {
  if (!text) return false;
  const t = text.trim();
  return t.length > 10 &&
         !/^(\d+[hmd]?\s*(ago)?|just now|yesterday|today)$/i.test(t) &&
         !/^(like|comment|share|reply|see more|sponsored|ad|follow|message)$/i.test(t) &&
         !/^\d+ (hour|minute|second|day|week|month|year)s? ago$/i.test(t) &&
         !/^(all reactions|comments|shares):/i.test(t) &&
         !t.match(/^\d+\s*(likes?|comments?|shares?|views?)$/i);
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
  // Check for ad-specific elements
  const adSelectors = [
    '[class*="SpanAdBadge"]',
    '[class*="ad-badge"]',
    '[data-e2e*="ad-"]',
    '[class*="AdContainer"]',
    '[class*="DivPromotedBadge"]',
    '[class*="Promoted"]'
  ];
  
  for (const sel of adSelectors) {
    if (safeQuery(container, sel)) {
      console.debug('[AlgorithmLens][TikTok] Sponsored detected via selector:', sel);
      return true;
    }
  }
  
  // Check text content in meta areas
  const metaText = safeText(container)?.slice(0, 500) || '';
  if (containsAdIndicator(metaText)) {
    console.debug('[AlgorithmLens][TikTok] Sponsored detected via text indicator');
    return true;
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
    return null;
  }
  
  const creator = extractTikTokCreator(container);
  const caption = extractTikTokCaption(container);
  const isSponsored = isTikTokSponsored(container);
  
  // Extract hashtags
  const hashtags = extractHashtags(caption);
  
  // Extract CTA
  const ctaText = extractCTA(container);
  
  // Extract link
  const link = extractLink(container);
  
  // Generate stable ID
  const postId = generateStableId(platform, creator, caption, container, index);
  
  // Only return post if we have meaningful content
  if (creator || (caption && caption.length > 10)) {
    return {
      id: postId,
      platform,
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      ctaText: ctaText || null,
      link: link || null
    };
  }
  
  return null;
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
  const containerSelectors = [
    '[data-e2e="recommend-list-item-container"]',
    '[data-e2e="search-card-video-card"]',
    '[class*="DivItemContainerV2"]',
    '[class*="DivItemContainerForSearch"]',
    '[class*="DivContentContainer"]',
    'div[class*="video-feed-item"]',
    '[class*="DivBrowserModeContainer"]'
  ];
  
  let containers = [];
  let usedSelector = null;
  
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    if (found.length > 0) {
      containers = found;
      usedSelector = selector;
      break;
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
    usedSelector = 'video-parent-fallback';
  }
  
  console.log(`[AlgorithmLens][TikTok] Found raw containers: ${containers.length} (${usedSelector})`);
  
  // Filter out navigation/header/empty containers
  containers = containers.filter(el => {
    const text = el.innerText || '';
    const hasVideo = !!el.querySelector('video');
    const hasContent = text.length > 30 || hasVideo;
    const notHeader = !el.closest('header') && !el.closest('nav');
    return hasContent && notHeader;
  });
  
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
  
  containers.forEach((container, index) => {
    try {
      const post = extractTikTokPost(container, index);
      if (post) {
        posts.push(post);
      } else {
        issues.push({ index, issue: 'no_content' });
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][TikTok] Error parsing container ${index}:`, err.message);
      issues.push({ index, issue: 'parse_error', error: err.message });
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
  
  logScanResults('TikTok', posts, issues);
  
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
  const creatorSelectors = [
    'header a[href*="/"]',
    'a[class*="notranslate"]',
    'span[class*="_aap6"] a',
    'a[role="link"][tabindex="0"]',
    'header span a',
    'header a[href^="/"]'
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
  
  return null;
}

/**
 * Extract caption from an Instagram post container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractInstagramCaption(container) {
  const captionSelectors = [
    'div[class*="_a9zs"]',
    'span[class*="_aacl"]',
    'ul li span',
    'div[class*="x1i10hfl"]',
    'div[class*="x1vvkbs"]',
    'span[dir="auto"]'
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
 * @returns {boolean}
 */
function isInstagramSponsored(container) {
  // Check header area for sponsored text
  const headerEl = safeQuery(container, 'header');
  const headerText = safeText(headerEl) || '';
  
  if (containsAdIndicator(headerText) || 
      headerText.toLowerCase().includes('paid partnership')) {
    console.debug('[AlgorithmLens][Instagram] Sponsored detected via header text');
    return true;
  }
  
  // Check for sponsored badge via class selectors
  const sponsoredSelectors = [
    '[class*="Sponsored"]',
    '[aria-label*="Sponsored"]',
    '[aria-label*="sponsored"]'
  ];
  
  for (const sel of sponsoredSelectors) {
    if (safeQuery(container, sel)) {
      console.debug('[AlgorithmLens][Instagram] Sponsored detected via selector:', sel);
      return true;
    }
  }
  
  // Check for "Sponsored" text in spans near the header
  const headerSpans = safeQueryAll(container, 'header span');
  for (const span of headerSpans) {
    const text = (safeText(span) || '').toLowerCase();
    if (text === 'sponsored' || text === 'paid partnership') {
      console.debug('[AlgorithmLens][Instagram] Sponsored detected via header span text');
      return true;
    }
  }
  
  // Check full container for ad indicators
  const fullText = (container.innerText || '').toLowerCase().slice(0, 1500);
  if (/\bpaid partnership with\b/.test(fullText)) {
    console.debug('[AlgorithmLens][Instagram] Sponsored detected via paid partnership text');
    return true;
  }
  
  return false;
}

/**
 * Extract a single Instagram post from its container element
 * @param {Element} container 
 * @param {number} index 
 * @returns {DesktopPostItem|null}
 */
function extractInstagramPost(container, index) {
  const platform = 'instagram';
  
  // Skip non-post modules (suggestions, explore, etc.)
  if (isNonPostModule(container, platform)) {
    return null;
  }
  
  const creator = extractInstagramCreator(container);
  const caption = extractInstagramCaption(container);
  const isSponsored = isInstagramSponsored(container);
  
  // Extract hashtags from explicit links first, then from caption text
  const hashtagEls = safeQueryAll(container, 'a[href*="/explore/tags/"]');
  let hashtags = hashtagEls.map(el => safeText(el)).filter(Boolean);
  if (hashtags.length === 0) {
    hashtags = extractHashtags(caption);
  }
  
  // Extract CTA
  const ctaText = extractCTA(container);
  
  // Extract link
  const link = extractLink(container);
  
  // Generate stable ID
  const postId = generateStableId(platform, creator, caption, container, index);
  
  // Only return post if we have meaningful content
  if (creator || (caption && caption.length > 10)) {
    return {
      id: postId,
      platform,
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      ctaText: ctaText || null,
      link: link || null
    };
  }
  
  return null;
}

/**
 * Scan Instagram feed for posts
 * @returns {DesktopPostItem[]}
 */
function scanInstagramFeed() {
  const platform = 'instagram';
  const posts = [];
  const issues = [];
  
  console.log('[AlgorithmLens][Instagram] 🔍 Starting scan...');
  console.log(`[AlgorithmLens][Instagram] URL: ${window.location.href}`);
  
  // Primary selectors for Instagram posts
  const containerSelectors = [
    'article[role="presentation"]',
    'article',
    'div[class*="_aagv"]',
    'div[class*="x1lliihq"][class*="x1n2onr6"]'
  ];
  
  let containers = [];
  let usedSelector = null;
  
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    // Filter to only actual posts (containing media)
    const filtered = found.filter(el => el.querySelector('img, video'));
    if (filtered.length > 0) {
      containers = filtered;
      usedSelector = selector;
      break;
    }
  }
  
  console.log(`[AlgorithmLens][Instagram] Found raw containers: ${containers.length} (${usedSelector})`);
  
  // Deduplicate nested articles
  const uniqueContainers = [];
  const seen = new WeakSet();
  
  for (const container of containers) {
    // Check if this container is inside another we've already seen
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
  console.log(`[AlgorithmLens][Instagram] After deduplication: ${containers.length} containers`);
  
  containers.forEach((container, index) => {
    try {
      const post = extractInstagramPost(container, index);
      if (post) {
        posts.push(post);
      } else {
        issues.push({ index, issue: 'no_content' });
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][Instagram] Error parsing container ${index}:`, err.message);
      issues.push({ index, issue: 'parse_error', error: err.message });
    }
  });
  
  // === DETAILED LOGGING ===
  console.log(`[AlgorithmLens][Instagram] Final posts extracted: ${posts.length}`);
  
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
  
  logScanResults('Instagram', posts, issues);
  
  return posts;
}

// ============================================================================
// YOUTUBE SCANNER
// ============================================================================

/**
 * Extract creator/channel name from a YouTube video container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractYouTubeCreator(container) {
  const creatorSelectors = [
    '#channel-name a',
    'ytd-channel-name a',
    '#text.ytd-channel-name',
    '#owner-text a',
    'a[href*="/@"]',
    'ytd-channel-name #text',
    '#channel-info a',
    '.ytd-channel-name a'
  ];
  
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
  
  return null;
}

/**
 * Extract title/caption from a YouTube video container
 * @param {Element} container 
 * @returns {string|null}
 */
function extractYouTubeCaption(container) {
  const titleSelectors = [
    '#video-title',
    'h3 a',
    '[id="video-title"]',
    'ytd-video-meta-block h3',
    '.title',
    'h3#video-title',
    'yt-formatted-string#video-title'
  ];
  
  for (const sel of titleSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const caption = safeText(el);
      if (caption && caption.length > 3 && isValidCaption(caption)) {
        return caption;
      }
    }
  }
  
  return null;
}

/**
 * Detect if a YouTube video is a promoted/ad video
 * @param {Element} container 
 * @returns {boolean}
 */
function isYouTubeSponsored(container) {
  // Check for ad renderer wrappers
  const adSelectors = [
    '.ytd-ad-slot-renderer',
    'ytd-display-ad-renderer',
    'ytd-promoted-sparkles-text-search-renderer',
    '[class*="ad-badge"]',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-action-companion-ad-renderer'
  ];
  
  for (const sel of adSelectors) {
    if (container.closest(sel) || safeQuery(container, sel)) {
      console.debug('[AlgorithmLens][YouTube] Sponsored detected via selector:', sel);
      return true;
    }
  }
  
  // Check badge text
  const badgeEl = safeQuery(container, 'span.ytd-badge-supported-renderer, [class*="badge"]');
  const badgeText = (safeText(badgeEl) || '').toLowerCase();
  if (badgeText === 'ad' || badgeText.includes('promoted')) {
    console.debug('[AlgorithmLens][YouTube] Sponsored detected via badge text:', badgeText);
    return true;
  }
  
  // Check for overlay ad indicators
  const overlayText = safeText(safeQuery(container, '[class*="overlay"]')) || '';
  if (/\bad\b/i.test(overlayText)) {
    console.debug('[AlgorithmLens][YouTube] Sponsored detected via overlay text');
    return true;
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
  
  // Skip non-post modules (playlists, mixes, channel suggestions, etc.)
  if (isNonPostModule(container, platform)) {
    return null;
  }
  
  const creator = extractYouTubeCreator(container);
  const caption = extractYouTubeCaption(container);
  const isSponsored = isYouTubeSponsored(container);
  
  // Extract hashtags
  const hashtags = extractHashtags(caption);
  
  // Extract CTA
  const ctaText = extractCTA(container);
  
  // Extract link and video ID
  const linkEl = safeQuery(container, 'a#thumbnail, a[href*="/watch"], a[href*="/shorts"]');
  let link = linkEl?.getAttribute('href') || null;
  if (link && !link.startsWith('http')) {
    link = 'https://www.youtube.com' + link;
  }
  
  // Extract video ID for stable ID
  let videoId = null;
  if (link) {
    const watchMatch = link.match(/[?&]v=([^&]+)/);
    const shortsMatch = link.match(/\/shorts\/([^?/]+)/);
    videoId = watchMatch?.[1] || shortsMatch?.[1] || null;
  }
  
  // Generate stable ID
  const postId = videoId ? `${platform}-${videoId}` : generateStableId(platform, creator, caption, container, index);
  
  // Only return post if we have meaningful content
  if (creator || caption) {
    return {
      id: postId,
      platform,
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      ctaText: ctaText || null,
      link: link || null
    };
  }
  
  return null;
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
  const containerSelectors = isShorts ? [
    'ytd-reel-video-renderer',
    'ytd-shorts',
    '[class*="reel-video"]'
  ] : [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer'
  ];
  
  let containers = [];
  let usedSelector = null;
  
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    if (found.length > 0) {
      containers = found;
      usedSelector = selector;
      break;
    }
  }
  
  console.log(`[AlgorithmLens][YouTube] Found raw containers: ${containers.length} (${usedSelector})`);
  
  // Filter out empty containers
  containers = containers.filter(el => {
    return el.querySelector('#video-title, h3, img, video, #thumbnail');
  });
  
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
  
  containers.forEach((container, index) => {
    try {
      const post = extractYouTubePost(container, index, isShorts);
      if (post) {
        posts.push(post);
      } else {
        issues.push({ index, issue: 'no_content' });
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][YouTube] Error parsing container ${index}:`, err.message);
      issues.push({ index, issue: 'parse_error', error: err.message });
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
  
  logScanResults('YouTube', posts, issues);
  
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
    return null;
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
    
    // Build stable fallback ID
    const fallbackIdBase = trimmedTextOrNull 
      ? hashString(trimmedTextOrNull.slice(0, 160))
      : `media-${index}-${Date.now()}`;
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
  console.debug(`[AlgorithmLens][Facebook] ⏭️ Post ${index} SKIPPED (no content):`, {
    containerHasContent: false,
    hasMedia,
    rawTextLength: rawContainerText.length,
    containerTextSample: rawContainerText.slice(0, 80)
  });
  
  return null;
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
      const post = extractFacebookPost(container, index);
      if (post) {
        posts.push(post);
        validPosts++;
      } else {
        // Capture diagnostic info for skipped containers
        const textSample = (container.innerText || '').slice(0, 100).replace(/\n/g, ' ');
        issues.push({
          index,
          reason: 'extractFacebookPost returned null',
          textSample,
        });
        skippedPosts++;
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][Facebook] ❌ Error parsing container ${index}:`, err.message);
      issues.push({ index, reason: 'parse_error', error: err.message });
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
  
  logScanResults('Facebook', posts, issues);
  
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
 * @returns {boolean}
 */
function isTwitterSponsored(container) {
  // Strategy 1: Check for "Promoted" label in the tweet
  const allText = (container.innerText || '').toLowerCase();
  
  // Check for exact "Promoted" word (Twitter's ad label)
  if (/\bpromoted\b/.test(allText)) {
    console.debug('[AlgorithmLens][Twitter][Sponsored] Detected via Promoted label');
    return true;
  }
  
  // Strategy 2: Check for placement tracking element (ad wrapper)
  if (safeQuery(container, 'div[data-testid="placementTracking"]')) {
    console.debug('[AlgorithmLens][Twitter][Sponsored] Detected via placementTracking element');
    return true;
  }
  
  // Strategy 3: Check aria-labels for promotion indicators
  const ariaElements = safeQueryAll(container, '[aria-label]');
  for (const el of ariaElements) {
    const label = (el.getAttribute('aria-label') || '').toLowerCase();
    if (label.includes('promoted') || label.includes('advertisement')) {
      console.debug('[AlgorithmLens][Twitter][Sponsored] Detected via aria-label:', label);
      return true;
    }
  }
  
  // Strategy 4: Check for ad-specific elements or classes
  const adSelectors = [
    '[class*="promoted"]',
    '[class*="Promoted"]',
    '[data-testid*="promoted"]',
    '[data-testid*="Promoted"]'
  ];
  
  for (const sel of adSelectors) {
    if (safeQuery(container, sel)) {
      console.debug('[AlgorithmLens][Twitter][Sponsored] Detected via selector:', sel);
      return true;
    }
  }
  
  // Strategy 5: Look for small text that says "Promoted" near the header
  const spans = safeQueryAll(container, 'span');
  for (const span of spans) {
    const text = (safeText(span) || '').toLowerCase().trim();
    if (text === 'promoted' || text === 'ad') {
      console.debug('[AlgorithmLens][Twitter][Sponsored] Detected via span text:', text);
      return true;
    }
  }
  
  return false;
}

/**
 * Extract a single Twitter/X post from its container element
 * @param {Element} container 
 * @param {number} index 
 * @returns {DesktopPostItem|null}
 */
function extractTwitterPost(container, index) {
  const platform = 'twitter';
  
  const creator = extractTwitterCreator(container);
  const caption = extractTwitterCaption(container);
  const isSponsored = isTwitterSponsored(container);
  
  // Extract hashtags from caption
  const hashtags = extractHashtags(caption);
  
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
  
  // Fallback: get tweet link
  if (!link) {
    const tweetLink = safeQuery(container, 'a[href*="/status/"]');
    if (tweetLink) {
      link = tweetLink.getAttribute('href');
      if (link && !link.startsWith('http')) {
        link = 'https://x.com' + link;
      }
    }
  }
  
  // Generate stable ID
  const postId = generateStableId(platform, creator, caption, container, index);
  
  // Only return post if we have meaningful content
  if (creator || (caption && caption.length > 10)) {
    return {
      id: postId,
      platform,
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      ctaText: ctaText || null,
      link: link || null
    };
  }
  
  return null;
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
  
  // Primary selector for Twitter tweets
  const containerSelectors = [
    'article[data-testid="tweet"]',
    'article[role="article"]',
    'div[data-testid="cellInnerDiv"] article'
  ];
  
  let containers = [];
  let usedSelector = null;
  
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    if (found.length > 0) {
      containers = found;
      usedSelector = selector;
      break;
    }
  }
  
  console.log(`[AlgorithmLens][Twitter] Found raw containers: ${containers.length} (${usedSelector})`);
  
  // Filter out empty or non-tweet containers
  containers = containers.filter(el => {
    const text = el.innerText || '';
    const hasContent = text.length > 20;
    const notHeader = !el.closest('header') && !el.closest('nav');
    return hasContent && notHeader;
  });
  
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
  console.log(`[AlgorithmLens][Twitter] After deduplication: ${containers.length} containers`);
  
  containers.forEach((container, index) => {
    try {
      const post = extractTwitterPost(container, index);
      if (post) {
        posts.push(post);
      } else {
        issues.push({ index, issue: 'no_content' });
      }
    } catch (err) {
      console.warn(`[AlgorithmLens][Twitter] Error parsing container ${index}:`, err.message);
      issues.push({ index, issue: 'parse_error', error: err.message });
    }
  });
  
  // === DETAILED LOGGING ===
  console.log(`[AlgorithmLens][Twitter] Final posts extracted: ${posts.length}`);
  
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
  
  logScanResults('Twitter', posts, issues);
  
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
      const id = `reddit:${index}:${link || caption || creator || ''}`;
      
      return {
        id,
        platform,
        creator: creator || null,
        caption: caption || null,
        hashtags: extractHashtags(caption),
        isSponsored: isRedditSponsored(container),
        ctaText: null,
        link: link || null
      };
    }
    
    // Shreddit-post with no creator AND no caption - skip with issue
    issues.push({
      index,
      issue: 'Skipped shreddit-post: no creator and no caption',
      tag,
      titleAttr: titleAttr || '(null)',
      authorAttr: authorAttr || '(null)',
      subredditPrefixed: subredditPrefixed || '(null)'
    });
    return null;
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
  
  // Generate stable ID
  const id = `reddit:${index}:${link || caption || creator || ''}`;
  
  // Only skip when BOTH creator and caption are missing
  if (!creator && !caption) {
    issues.push({
      index,
      issue: 'Skipped Reddit post: no creator and no caption',
      tag
    });
    return null;
  }
  
  return {
    id,
    platform,
    creator: creator || null,
    caption: caption || null,
    hashtags,
    isSponsored: Boolean(isSponsored),
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
  
  // Map containers to posts, passing issues array for mutation
  const extractedPosts = containers
    .map((container, index) => {
      try {
        return extractRedditPost(container, index, issues);
      } catch (err) {
        console.warn(`[AlgorithmLens][Reddit] Error parsing container ${index}:`, err.message);
        issues.push({ index, issue: 'parse_error', error: err.message });
        return null;
      }
    })
    .filter(Boolean);
  
  posts.push(...extractedPosts);
  
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
      
      const id = `reddit-fallback:${index}:${link || caption || creator || ''}`;
      
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
    
    logScanResults('Reddit', fallbackPosts, issues);
    
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
  
  logScanResults('Reddit', posts, issues);
  
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
 * Log scan results in a developer-friendly format
 * @param {string} platformName 
 * @param {DesktopPostItem[]} posts 
 * @param {Array} issues 
 */
function logScanResults(platformName, posts, issues) {
  console.log(`[AlgorithmLens][${platformName}] ========================================`);
  console.log(`[AlgorithmLens][${platformName}] ✅ Scan complete`);
  console.log(`[AlgorithmLens][${platformName}]    Total posts extracted: ${posts.length}`);
  
  const sponsored = posts.filter(p => p.isSponsored).length;
  const withCreator = posts.filter(p => p.creator).length;
  const withCaption = posts.filter(p => p.caption).length;
  const withHashtags = posts.filter(p => p.hashtags.length > 0).length;
  const withCTA = posts.filter(p => p.ctaText).length;
  
  console.log(`[AlgorithmLens][${platformName}]    Sponsored/Ads: ${sponsored} (${posts.length > 0 ? Math.round(sponsored/posts.length*100) : 0}%)`);
  console.log(`[AlgorithmLens][${platformName}]    With creator: ${withCreator}`);
  console.log(`[AlgorithmLens][${platformName}]    With caption: ${withCaption}`);
  console.log(`[AlgorithmLens][${platformName}]    With hashtags: ${withHashtags}`);
  console.log(`[AlgorithmLens][${platformName}]    With CTA: ${withCTA}`);
  
  // Log extraction issues
  if (issues.length > 0) {
    const issueCounts = {};
    issues.forEach(i => {
      issueCounts[i.issue] = (issueCounts[i.issue] || 0) + 1;
    });
    console.log(`[AlgorithmLens][${platformName}] ⚠️ Extraction issues:`, issueCounts);
  }
  
  console.log(`[AlgorithmLens][${platformName}] ========================================`);
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
 * Collect visible posts and add new ones to session
 * Includes rate limiting to protect browser performance
 */
function collectVisiblePosts() {
  if (!sessionActive || !sessionPlatform) return;
  
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
 * Set up MutationObserver for detecting new feed content
 */
function setupSessionObserver() {
  const selectors = getFeedContainerSelectors(sessionPlatform);
  
  let feedContainer = null;
  for (const selector of selectors) {
    feedContainer = document.querySelector(selector);
    if (feedContainer) break;
  }
  
  if (!feedContainer) {
    feedContainer = document.body;
  }
  
  console.log(`[AlgorithmLens][Session] 👁️ Setting up observer on:`, feedContainer.tagName || 'body');
  
  const observer = new MutationObserver((mutations) => {
    if (!sessionActive) return;
    
    let hasNewContent = mutations.some(m => m.addedNodes.length > 0);
    if (hasNewContent) {
      clearTimeout(window._alSessionDebounce);
      window._alSessionDebounce = setTimeout(collectVisiblePosts, getCurrentScanInterval());
    }
  });
  
  observer.observe(feedContainer, { childList: true, subtree: true });
  sessionObservers.push(observer);
  
  // Also collect on scroll (with variable interval tracking)
  const scrollHandler = () => {
    if (!sessionActive) return;
    lastScrollTime = Date.now();
    clearTimeout(window._alScrollDebounce);
    window._alScrollDebounce = setTimeout(collectVisiblePosts, SCAN_INTERVAL_SCROLLING_MS);
  };
  
  window.addEventListener('scroll', scrollHandler, { passive: true });
  sessionObservers.push({ disconnect: () => window.removeEventListener('scroll', scrollHandler) });
  
  console.log('[AlgorithmLens][Session] ✅ Observers ready');
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
  
  // Initial collection
  collectVisiblePosts();
  
  // Set up observers
  setupSessionObserver();
  
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
  
  console.log('\n');
  console.log('[AlgorithmLens] ╔════════════════════════════════════════╗');
  console.log('[AlgorithmLens] ║      CONTENT SCRIPT INITIALIZED        ║');
  console.log('[AlgorithmLens] ╚════════════════════════════════════════╝');
  console.log(`[AlgorithmLens] Platform: ${platform}`);
  console.log(`[AlgorithmLens] URL: ${window.location.href}`);
  console.log('[AlgorithmLens] Ready for commands: SCAN_FEED, START_SESSION_SCAN, STOP_SESSION_SCAN');
  console.log('\n');
})();
