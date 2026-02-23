/**
 * Facebook Scanner Module
 * Extracts posts from Facebook feeds
 * Converted from monolithic content.js into ES module format
 */

import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';
import {
  safeQuery, safeQueryAll, safeText, extractHashtags, containsAdIndicator,
  extractCTA, extractLink, isValidCreator, isValidCaption, isNonPostModule,
  hashString, generateStableId, parseEngagementCount
} from './utils.js';

// ============================================================================
// MODULE-LEVEL STATE (per session)
// ============================================================================

let facebookProcessedContainerHashes = new Set();
let fbQueryCache = new Map();
let fbQueryCacheLastClear = 0;

/**
 * Reset Facebook module state (call at start of new session)
 */
export function resetFacebookState() {
  facebookProcessedContainerHashes = new Set();
  fbQueryCache = new Map();
  fbQueryCacheLastClear = 0;
}

/**
 * Generate a stable hash for a Facebook container based on content
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

/**
 * Cached DOM query for Facebook selectors
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
 * Clear the Facebook query cache
 */
function clearFbQueryCache() {
  fbQueryCache.clear();
}

// ============================================================================
// ENGAGEMENT AND MEDIA TYPE EXTRACTION
// ============================================================================

/**
 * Extract engagement metrics from a Facebook post container
 * @param {Element} container
 * @returns {Object} Engagement object { likes, comments, shares, views }
 */
function extractFacebookEngagement(container) {
  let likes = null;
  let comments = null;
  let shares = null;

  // Reactions count (e.g., "1.2K" near the reaction icons)
  const reactionEls = safeQueryAll(container, 'span[aria-label*="reaction" i], span[aria-label*="like" i], span[role="toolbar"] span');
  for (const el of reactionEls) {
    const label = el.getAttribute('aria-label') || safeText(el) || '';
    const match = label.match(/([\d,.KMBkmb]+)/);
    if (match) { likes = parseEngagementCount(match[1]); break; }
  }

  // Comments/shares count from text like "X comments · Y shares"
  const engagementArea = safeQueryAll(container, 'span[class*="x1e558r4"], div[class*="x168nmei"] span');
  for (const el of engagementArea) {
    const text = safeText(el) || '';
    const commentMatch = text.match(/([\d,.KMBkmb]+)\s*comment/i);
    if (commentMatch && comments === null) comments = parseEngagementCount(commentMatch[1]);
    const shareMatch = text.match(/([\d,.KMBkmb]+)\s*share/i);
    if (shareMatch && shares === null) shares = parseEngagementCount(shareMatch[1]);
  }

  return { likes, comments, shares, views: null };
}

/**
 * Detect media type from a Facebook post container
 * @param {Element} container
 * @returns {string} Media type ('VIDEO', 'CAROUSEL', 'IMAGE', or 'TEXT')
 */
function detectFacebookMediaType(container) {
  if (container.querySelector('video')) return 'VIDEO';

  const imgs = safeQueryAll(container, 'img[src]').filter(img => {
    const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
    return w > 100;
  });

  // Facebook carousels use multiple images in a scrollable container
  if (imgs.length > 1) return 'CAROUSEL';
  if (imgs.length === 1) return 'IMAGE';
  return 'TEXT';
}

/**
 * Detect source type and algorithmic nature of a Facebook post
 * @param {Element} container
 * @returns {{isAlgorithmic: boolean, sourceType: 'followed'|'suggested'|'ad'|'unknown'}}
 */
function detectFacebookSourceType(container) {
  try {
    // Check for "Suggested for you" text in the header area
    const headerArea = container.querySelector('div > div > div > div > div') || container;
    const headerText = (headerArea.innerText || '').toLowerCase();

    if (/suggested\s+for\s+you/i.test(headerText)) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // Check for "People you may know" → suggested
    if (/people\s+you\s+may\s+know/i.test(headerText)) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // Check for "Suggested" group/page posts
    if (/suggested\s+(posts?|groups?|pages?)/i.test(headerText)) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // Look for friend activity indicators (liked, commented) → followed
    if (/liked|commented/i.test(headerText)) {
      return { isAlgorithmic: false, sourceType: 'followed' };
    }

    // On the Facebook news feed, posts without explicit "Suggested" markers
    // are typically from friends or followed pages.
    return { isAlgorithmic: false, sourceType: 'followed' };
  } catch (error) {
    if (CAPTURE_DEBUG) {
      debugLog('warn', '[AlgorithmLens][Facebook] Error in detectFacebookSourceType:', error.message);
    }
    return { isAlgorithmic: false, sourceType: 'followed' };
  }
}

// ============================================================================
// FACEBOOK SCANNER
// ============================================================================

/**
 * Extract creator name from a Facebook post container
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
    'div[dir="auto"][style*="text-align: start"]',
    'div[dir="auto"][style*="text-align:start"]',
    'div[data-ad-comet-preview="message"]',
    'div[data-ad-preview="message"]',
    '[data-testid="post_message"]',
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
 * @param {Element} container
 * @returns {boolean}
 */
function isFacebookSponsored(container) {
  // STRATEGY 0: Extract header text from top elements for analysis
  const headerTextFromElements = Array.from(
    container.querySelectorAll('div[role="button"], span, a, div[dir="auto"]')
  )
    .slice(0, 40) // Only check top portion of DOM
    .map(el => (el.innerText || '').trim())
    .filter(text => text && text.length < 100)
    .join(' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  if (headerTextFromElements.includes('sponsored') ||
      headerTextFromElements.includes('paid partnership') ||
      headerTextFromElements.includes('paid promotion')) {
    if (CAPTURE_DEBUG) {
      debugLog('debug', '[AlgorithmLens][Facebook][Sponsored] Detected via header element text:',
        headerTextFromElements.slice(0, 150));
    }
    return true;
  }

  // Strategy 1: Check for ads/about link (most reliable indicator)
  if (container.querySelector('a[href*="ads/about"]') ||
      container.querySelector('a[href*="/ads/"]') ||
      container.querySelector('a[href*="facebook.com/ads"]')) {
    if (CAPTURE_DEBUG) {
      debugLog('debug', '[AlgorithmLens][Facebook][Sponsored] Detected via ads/about link');
    }
    return true;
  }

  // Strategy 2: Check for aria-label containing "Sponsored"
  const ariaElements = container.querySelectorAll('[aria-label]');
  for (const el of ariaElements) {
    const label = (el.getAttribute('aria-label') || '').toLowerCase();
    if (label.includes('sponsored') ||
        label.includes('paid partnership') ||
        label.includes('advertisement')) {
      if (CAPTURE_DEBUG) {
        debugLog('debug', '[AlgorithmLens][Facebook][Sponsored] Detected via aria-label:', label);
      }
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
  const suspiciousSpans = container.querySelectorAll(
    'span.x1r8a4m5, span.x1n2onr6, span[class*="x17ihmo5"], span[class*="x13rv6gb"], ' +
    'span[class*="xt0psk2"], span[class*="x1fvot60"], span[class*="x1s688f"]'
  );

  if (suspiciousSpans.length >= 3) {
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
 * @param {string|null|undefined} raw
 * @returns {string}
 */
function normalizeFacebookText(raw) {
  if (!raw) return '';
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Build a STABLE Facebook post ID that doesn't change across batches
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
 * @param {Element} container
 * @param {number} index
 * @returns {DesktopPostItem|null}
 */
function extractFacebookPost(container, index) {
  const platform = 'facebook';

  // Skip non-post modules (PYMK, groups, events, etc.)
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

  // Generate STABLE ID using content fingerprinting
  const postId = buildFacebookPostId(container, caption, index);

  // ============================================================================
  // VERY RELAXED VALIDATION: Accept if we have ANY meaningful content
  // Only skip when ALL of these are missing: creator, caption, link
  // ============================================================================
  const hasCreator = !!(creator && creator.trim());
  const hasCaption = !!(caption && caption.trim().length > 5);
  const hasLink = !!(link && link.trim());
  const hasCTA = !!(ctaText && ctaText.trim());
  const hasHashtags = hashtags.length > 0;
  const hasSubstantialText = rawContainerText.length > 50;

  // Keep the post if ANY of these conditions are true
  if (hasCreator || hasCaption || hasLink || isSponsored || hasCTA || hasHashtags) {
    const sourceInfo = isSponsored
      ? { isAlgorithmic: true, sourceType: 'ad' }
      : detectFacebookSourceType(container);

    const post = {
      id: postId,
      platform,
      creator: creator || "Unknown creator",
      caption: caption || "(No caption)",
      hashtags,
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null,
      ctaText: ctaText || null,
      link: link || null,
      uiLabel: isSponsored ? "Sponsored Ad" : "Post",
      isFallback: false,
      fbMeta,
      engagement: extractFacebookEngagement(container),
      mediaType: detectFacebookMediaType(container),
      isAlgorithmic: sourceInfo.isAlgorithmic,
      sourceType: sourceInfo.sourceType
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

    const sourceInfo = isSponsored
      ? { isAlgorithmic: true, sourceType: 'ad' }
      : detectFacebookSourceType(container);

    return {
      id: lastResortId,
      platform,
      creator: "Unknown creator",
      caption: minimalCaption || "(No caption)",
      hashtags: extractHashtags(minimalCaption),
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null,
      ctaText: null,
      link: null,
      uiLabel: isSponsored ? "Sponsored Ad" : "Post",
      isFallback: true,
      fbMeta,
      engagement: extractFacebookEngagement(container),
      mediaType: detectFacebookMediaType(container),
      isAlgorithmic: sourceInfo.isAlgorithmic,
      sourceType: sourceInfo.sourceType
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

    if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Facebook] Fallback post accepted for container ${index} (text length: ${rawContainerText.length}, hasMedia: ${hasMedia})`);

    const sourceInfo = isSponsored
      ? { isAlgorithmic: true, sourceType: 'ad' }
      : detectFacebookSourceType(container);

    return {
      id: fallbackId,
      platform,
      type: 'feed_item_fallback',
      creator: creator || "Unknown creator",
      caption: trimmedTextOrNull || "(No caption)",
      hashtags: trimmedTextOrNull ? extractHashtags(trimmedTextOrNull) : [],
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null,
      ctaText: ctaText || null,
      link: link || null,
      uiLabel: isSponsored ? "Sponsored Ad" : "Post",
      isFallback: true,
      fbMeta,
      engagement: extractFacebookEngagement(container),
      mediaType: detectFacebookMediaType(container),
      isAlgorithmic: sourceInfo.isAlgorithmic,
      sourceType: sourceInfo.sourceType,
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
 * @returns {DesktopPostItem[]}
 */
function scanFacebookFeed() {
  const platform = 'facebook';
  let posts = [];
  const issues = [];

  // Clear query cache at start of each scan cycle
  clearFbQueryCache();

  if (CAPTURE_DEBUG) console.log('\n');
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] 🔍 STARTING FACEBOOK FEED SCAN');
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] URL:', window.location.href);
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] Pathname:', window.location.pathname);
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] Timestamp:', new Date().toISOString());

  // ============================================================================
  // SINGLE SELECTOR: Only process TRUE top-level FeedUnit containers
  // This prevents inflated counts from nested role="article" elements
  // ============================================================================
  const rawContainers = Array.from(document.querySelectorAll('div[data-pagelet^="FeedUnit_"]'));

  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Facebook] 📦 FeedUnit containers found: ${rawContainers.length}`);

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

  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Facebook] 📦 After validity check: ${containers.length} valid containers`);

  // ============================================================================
  // PHASE 2.5: Per-session container tracking using CONTENT HASH
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
    if (CAPTURE_DEBUG) console.warn('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
    if (CAPTURE_DEBUG) console.warn('[AlgorithmLens][Facebook] ⚠️ NO FEEDUNIT CONTAINERS FOUND - DIAGNOSTIC INFO:');
    if (CAPTURE_DEBUG) console.warn('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
    if (CAPTURE_DEBUG) console.warn(`[AlgorithmLens][Facebook]   → div[data-pagelet^="FeedUnit_"] count: ${document.querySelectorAll('div[data-pagelet^="FeedUnit_"]').length}`);
    if (CAPTURE_DEBUG) console.warn(`[AlgorithmLens][Facebook]   → role="feed" count: ${document.querySelectorAll('[role="feed"]').length}`);
    if (CAPTURE_DEBUG) console.warn(`[AlgorithmLens][Facebook]   → role="main" count: ${document.querySelectorAll('[role="main"]').length}`);

    // Log first few data-pagelet values to help debug
    const pagelets = Array.from(document.querySelectorAll('[data-pagelet]')).slice(0, 10);
    const pageletValues = pagelets.map(el => el.getAttribute('data-pagelet'));
    if (CAPTURE_DEBUG) console.warn('[AlgorithmLens][Facebook]   → Sample data-pagelet values:', pageletValues);

    // Check if we're actually on the feed
    const isFeedPage = window.location.pathname === '/' ||
                       window.location.pathname === '' ||
                       window.location.pathname.includes('/home');
    if (CAPTURE_DEBUG) console.warn(`[AlgorithmLens][Facebook]   → Appears to be feed page: ${isFeedPage}`);
    if (CAPTURE_DEBUG) console.warn('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  }

  // ============================================================================
  // PHASE 3: PRIMARY EXTRACTION - Extract posts
  // ============================================================================
  let totalContainers = containers.length;
  let validPosts = 0;
  let skippedPosts = 0;

  // Track rejection code histogram
  const rejectionCounts = {};

  console.debug('[AlgorithmLens][Facebook] 🔄 Starting primary extraction pass...');

  for (let index = 0; index < containers.length; index++) {
    const container = containers[index];

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
      if (CAPTURE_DEBUG) console.warn(`[AlgorithmLens][Facebook] ❌ Error parsing container ${index}:`, err.message);
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

  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] 📊 PRIMARY EXTRACTION RESULTS:');
  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Facebook]   → Containers scanned: ${totalContainers}`);
  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Facebook]   → Valid posts: ${validPosts}`);
  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Facebook]   → Skipped posts: ${skippedPosts}`);
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');

  if (issues.length > 0) {
    console.debug('[AlgorithmLens][Facebook] 🔍 Issues sample (first 5):', issues.slice(0, 5));
  }

  // ============================================================================
  // FINAL LOGGING
  // ============================================================================
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Facebook] 📊 FINAL POSTS EXTRACTED: ${posts.length}`);
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');

  if (posts.length > 0) {
    console.debug('[AlgorithmLens][Facebook] Sample captions (first 5):',
      posts.slice(0, 5).map(p => (p.caption || '').slice(0, 80)));
    console.debug('[AlgorithmLens][Facebook] Sample creators (first 5):',
      posts.slice(0, 5).map(p => p.creator || '(none)'));

    const sponsoredCount = posts.filter(p => p.isSponsored).length;
    if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Facebook] 📊 Sponsored/Ads: ${sponsoredCount} / ${posts.length} (${posts.length > 0 ? Math.round(sponsoredCount / posts.length * 100) : 0}%)`);

    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Facebook] Sample posts (first 20):`, posts.slice(0, 20).map(p => ({
        id: (p.id || '').slice(0, 30),
        creator: (p.creator || '—').slice(0, 20),
        captionSample: p.caption ? p.caption.slice(0, 50) + '...' : '—',
        isSponsored: p.isSponsored ? '✓ AD' : '',
        hasCTA: p.ctaText ? '✓' : '',
        link: p.link ? '✓' : ''
      })));
    }
  } else {
    console.error('[AlgorithmLens][Facebook] ❌ NO POSTS EXTRACTED');
    console.error('[AlgorithmLens][Facebook] This may indicate:');
    console.error('[AlgorithmLens][Facebook]   - No FeedUnit_ containers on this page');
    console.error('[AlgorithmLens][Facebook]   - Not on the main Facebook feed');
    console.error('[AlgorithmLens][Facebook]   - Facebook DOM structure has changed');
    console.error('[AlgorithmLens][Facebook] Issues encountered:', issues.length);
    if (issues.length > 0 && CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Facebook] Issues (first 15):`, issues.slice(0, 15));
    }
  }

  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] 🔍 FACEBOOK FEED SCAN COMPLETE');
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Facebook] ════════════════════════════════════════════');
  if (CAPTURE_DEBUG) console.log('\n');

  return posts;
}

export { extractFacebookPost, scanFacebookFeed };
