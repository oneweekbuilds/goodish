import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';
import {
  safeQuery, safeQueryAll, safeText, extractHashtags, containsAdIndicator,
  extractCTA, extractLink, isValidCreator, isValidCaption, isNonPostModule,
  hasBeenViewed, generateStableId, isInstagramReels, extractInstagramPostId,
  parseEngagementCount
} from './utils.js';

// ============================================================================
// INSTAGRAM CONFIG
// ============================================================================

const ALLOW_REELS_MEDIA_ONLY_FALLBACK = false;

// ============================================================================
// INSTAGRAM SCANNER
// ============================================================================

/**
 * Extract engagement metrics from an Instagram post
 * @param {Element} container
 * @returns {{likes: number|null, comments: number|null, shares: null, views: null}}
 */
function extractInstagramEngagement(container) {
  let likes = null;
  // Instagram shows likes as "X likes" in a section or button
  const likeEls = safeQueryAll(container, 'section a[href*="/liked_by/"] span, button span, a[role="button"] span');
  for (const el of likeEls) {
    const text = safeText(el);
    if (text && /\d/.test(text) && /like/i.test(safeText(el.closest('a, button')) || '')) {
      likes = parseEngagementCount(text.replace(/\s*likes?\s*/i, ''));
      if (likes !== null) break;
    }
  }
  // Comments count from "View all X comments" link
  let comments = null;
  const commentLink = safeQuery(container, 'a[href*="/comments/"], a[href*="/p/"][href*="/c/"]');
  if (commentLink) {
    const text = safeText(commentLink);
    if (text) {
      const match = text.match(/([\d,.]+)\s*comment/i);
      if (match) comments = parseEngagementCount(match[1]);
    }
  }
  return { likes, comments, shares: null, views: null };
}

/**
 * Detect media type from an Instagram post
 * @param {Element} container
 * @returns {string}
 */
function detectInstagramMediaType(container) {
  if (container.querySelector('video')) return 'VIDEO';
  const imgs = safeQueryAll(container, 'img[srcset], img[src]').filter(img => {
    const w = img.naturalWidth || img.width || 0;
    return w > 50;
  });
  // Carousel detection: multiple content images or carousel navigation dots
  if (imgs.length > 1 || container.querySelector('[class*="carousel"], [class*="Carousel"], button[aria-label*="Next"], button[aria-label*="Go to slide"]')) {
    return 'CAROUSEL';
  }
  if (imgs.length === 1) return 'IMAGE';
  return 'TEXT';
}

/**
 * Detect source type and algorithmic nature of an Instagram post
 * @param {Element} container
 * @returns {{isAlgorithmic: boolean, sourceType: 'followed'|'suggested'|'ad'|'unknown'}}
 */
function detectInstagramSourceType(container) {
  try {
    // Check for "Suggested for you" text in various forms (case-insensitive)
    const fullText = (container.innerText || container.textContent || '').toLowerCase();

    if (/suggested\s+for\s+you/i.test(fullText) ||
        /suggested\s+posts?/i.test(fullText) ||
        /based\s+on/i.test(fullText)) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // Check for aria-label with "Suggested" pattern
    const suggestedElements = safeQueryAll(container, '[aria-label*="Suggested"], [aria-label*="suggested"]');
    if (suggestedElements.length > 0) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // If on Reels page, default to 'suggested' since Reels are primarily algorithmic
    if (isInstagramReels()) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // For feed posts, check if there's a "Follow" button visible (indicating non-followed account = suggested)
    const followButton = safeQuery(container, 'button[aria-label*="Follow"]');
    if (followButton) {
      const buttonText = (followButton.getAttribute('aria-label') || '').toLowerCase();
      if (buttonText.includes('follow') && !buttonText.includes('unfollow')) {
        return { isAlgorithmic: true, sourceType: 'suggested' };
      }
    }

    // On the home feed, if no "Suggested" markers were found,
    // the post is most likely from a followed account.
    // (Suggested posts typically have a "Follow" button or "Suggested for you" text.)
    return { isAlgorithmic: false, sourceType: 'followed' };
  } catch (error) {
    if (CAPTURE_DEBUG) {
      debugLog('warn', '[AlgorithmLens][Instagram] Error in detectInstagramSourceType:', error.message);
    }
    return { isAlgorithmic: false, sourceType: 'followed' };
  }
}

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
      if (CAPTURE_DEBUG) {
        debugLog('debug', '[AlgorithmLens][Instagram] Sponsored detected via paid partnership text');
      }
      return {
        isSponsored: true,
        evidence: { strategy: 'paidPartnership', matchedPattern: 'paid partnership with' }
      };
    }

    // Check for "Sponsored" label text
    if (/\bsponsored\b/.test(textSlice) && !/show fewer posts like this/.test(textSlice)) {
      // Make sure "sponsored" isn't part of the "show fewer posts" menu
      if (CAPTURE_DEBUG) {
        debugLog('debug', '[AlgorithmLens][Instagram] Sponsored detected via sponsored text');
      }
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
        if (CAPTURE_DEBUG) {
          debugLog('debug', `[AlgorithmLens][Instagram] Sponsored detected via selector: ${sel}`);
        }
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
        if (CAPTURE_DEBUG) {
          debugLog('debug', '[AlgorithmLens][Instagram] Sponsored detected via header text');
        }
        return {
          isSponsored: true,
          evidence: { strategy: 'headerText', matchedText: headerText.slice(0, 100) }
        };
      }
    }

    return { isSponsored: false, evidence: null };
  } catch (error) {
    // Defensive: if ad detection fails, assume not sponsored
    if (CAPTURE_DEBUG) console.warn('[AlgorithmLens][Instagram] Error in isInstagramSponsored:', error);
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
      if (CAPTURE_DEBUG) console.warn('[AlgorithmLens][Instagram] Error detecting sponsored status:', error);
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

      const sourceInfo = isSponsored
        ? { isAlgorithmic: true, sourceType: 'ad' }
        : detectInstagramSourceType(container);

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
        link: link || null,
        engagement: extractInstagramEngagement(container),
        mediaType: detectInstagramMediaType(container),
        isAlgorithmic: sourceInfo.isAlgorithmic,
        sourceType: sourceInfo.sourceType
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

  if (CAPTURE_DEBUG) {
    debugLog('log', '[AlgorithmLens][Instagram] 🔍 Starting scan...');
    debugLog('log', `[AlgorithmLens][Instagram] URL: ${window.location.href}, subtype: ${subtype}`);
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

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][Instagram] Found raw containers: ${allContainers.length} from selectors: [${usedSelectors.join(', ')}]`);
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
  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][Instagram] After deduplication: ${containers.length} containers`);
  }

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
      if (CAPTURE_DEBUG) console.warn(`[AlgorithmLens][Instagram] Error parsing container ${index}:`, err.message);
      const code = 'OUTER_PARSE_ERROR';
      rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
      issues.push({ index, issue: code, error: err.message });
      if (CAPTURE_DEBUG) {
        debugLog('error', `[CaptureDebug][Instagram] Container ${index}: OUTER ERROR - ${err.message}`);
      }
    }
  });

  // === DETAILED LOGGING ===
  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][Instagram] Final posts extracted: ${posts.length}`);
    debugLog('log', `[CaptureDebug][Instagram] Scan complete - Total posts extracted: ${posts.length}, Issues: ${issues.length}`);
    debugLog('log', `[CaptureDebug][Instagram] Posts successfully extracted: ${posts.length} out of ${containers.length} containers`);
  }

  if (posts.length > 0) {
    if (CAPTURE_DEBUG) {
      debugLog('table', posts.slice(0, 20).map(p => ({
        id: (p.id || '').slice(0, 25),
        creator: (p.creator || '—').slice(0, 20),
        captionSample: p.caption ? p.caption.slice(0, 60) + '...' : '—',
        isSponsored: p.isSponsored ? '✓ AD' : '',
        hasCTA: p.ctaText ? '✓' : '',
        link: p.link ? '✓' : ''
      })));
    }
  }

  // Note: logScanResults is called in the main content.js file
  // This function only returns posts, the logging happens in the orchestrator

  return posts;
}

export { extractInstagramPost, scanInstagramFeed };
