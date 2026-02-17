/**
 * YouTube Scanner Module
 * Extracts posts from YouTube feeds (both regular videos and Shorts)
 * Converted from monolithic content.js into ES module format
 */

import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';
import {
  safeQuery, safeQueryAll, safeText, extractHashtags, containsAdIndicator,
  extractCTA, extractLink, isValidCreator, isValidCaption, isNonPostModule,
  generateStableId, extractYouTubeVideoId, parseEngagementCount
} from './utils.js';

// ============================================================================
// ENGAGEMENT AND MEDIA TYPE EXTRACTION
// ============================================================================

/**
 * Extract engagement metrics from a YouTube video container
 * @param {Element} container
 * @param {boolean} isShorts - Whether this is a Shorts video
 * @returns {Object} Engagement object { likes, comments, shares, views }
 */
function extractYouTubeEngagement(container, isShorts = false) {
  let views = null;
  let likes = null;

  if (isShorts) {
    // Shorts show likes/comments in overlay buttons
    const likeBtn = safeQuery(container, '#like-button button, [aria-label*="like" i]');
    if (likeBtn) {
      const label = likeBtn.getAttribute('aria-label') || '';
      const match = label.match(/([\d,.KMBkmb]+)/);
      if (match) likes = parseEngagementCount(match[1]);
    }
  } else {
    // Regular videos show view count in metadata
    const metaSpans = safeQueryAll(container, '#metadata-line span, #video-info span, ytd-video-meta-block span');
    for (const span of metaSpans) {
      const text = safeText(span) || '';
      const viewMatch = text.match(/([\d,.KMBkmb]+)\s*view/i);
      if (viewMatch) { views = parseEngagementCount(viewMatch[1]); break; }
    }
  }

  return { likes, comments: null, shares: null, views };
}

/**
 * Detect media type from a YouTube container
 * @param {Element} container
 * @returns {string} Media type (always 'VIDEO' for YouTube)
 */
function detectYouTubeMediaType(container) {
  return 'VIDEO'; // YouTube content is virtually always video
}

/**
 * Detect source type and algorithmic nature of a YouTube video
 * @param {Element} container
 * @param {boolean} isShorts
 * @returns {{isAlgorithmic: boolean, sourceType: 'followed'|'suggested'|'ad'|'unknown'}}
 */
function detectYouTubeSourceType(container, isShorts) {
  try {
    // On Shorts, default to 'suggested' (Shorts are primarily algorithmic)
    if (isShorts) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // Check for "Recommended for you" text in metadata
    const fullText = (container.innerText || container.textContent || '').toLowerCase();
    if (/recommended\s+for\s+you/i.test(fullText)) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // Check if in subscriptions page
    if (window.location.pathname.includes('/feed/subscriptions')) {
      return { isAlgorithmic: false, sourceType: 'followed' };
    }

    // Check for channel badge "Subscribed"
    const subscribedBadge = safeQuery(container, '[aria-label*="Subscribed"], [class*="subscribed" i]');
    if (subscribedBadge) {
      return { isAlgorithmic: false, sourceType: 'followed' };
    }

    // Look for home page indicator - default to 'suggested'
    if (window.location.pathname === '/' || window.location.pathname === '') {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    return { isAlgorithmic: false, sourceType: 'unknown' };
  } catch (error) {
    if (CAPTURE_DEBUG) {
      debugLog('warn', '[AlgorithmLens][YouTube] Error in detectYouTubeSourceType:', error.message);
    }
    return { isAlgorithmic: false, sourceType: 'unknown' };
  }
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
      if (CAPTURE_DEBUG) {
        debugLog('log', '[AlgorithmLens][YouTube] AD DETECTED via selector:', sel);
      }
      return true;
    }
  }

  // Check if container itself IS an ad renderer element
  const tagName = container.tagName?.toLowerCase() || '';
  if (tagName.includes('ad-') || tagName.includes('-ad')) {
    if (CAPTURE_DEBUG) {
      debugLog('log', '[AlgorithmLens][YouTube] AD DETECTED via tag name:', tagName);
    }
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
        if (CAPTURE_DEBUG) {
          debugLog('log', '[AlgorithmLens][YouTube] AD DETECTED via badge text:', badgeText);
        }
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
      if (CAPTURE_DEBUG) {
        debugLog('log', '[AlgorithmLens][YouTube] AD DETECTED via span text:', directText);
      }
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
        if (CAPTURE_DEBUG) {
          debugLog('log', '[AlgorithmLens][YouTube] AD DETECTED via metadata text in:', metaSel);
        }
        return true;
      }
    }
  }

  // Check for ad metadata attributes on container and ancestors
  const elementsToCheck = [container, container.parentElement, container.parentElement?.parentElement].filter(Boolean);
  for (const el of elementsToCheck) {
    if (el.hasAttribute('is-promoted') || el.hasAttribute('data-promoted') ||
        el.hasAttribute('is-ad') || el.getAttribute('class')?.includes('promoted')) {
      if (CAPTURE_DEBUG) {
        debugLog('log', '[AlgorithmLens][YouTube] AD DETECTED via attribute on element');
      }
      return true;
    }
  }

  // Shorts-specific: Check for ad overlay or indicators
  if (isShorts) {
    const adOverlay = safeQuery(container, '[class*="ad-overlay"], [class*="promoted"]');
    if (adOverlay) {
      if (CAPTURE_DEBUG) {
        debugLog('log', '[AlgorithmLens][YouTube] AD DETECTED via Shorts overlay');
      }
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
    const sourceInfo = isSponsored
      ? { isAlgorithmic: true, sourceType: 'ad' }
      : detectYouTubeSourceType(container, isShorts);

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
      link: link || null,
      engagement: extractYouTubeEngagement(container, isShorts),
      mediaType: detectYouTubeMediaType(container),
      isAlgorithmic: sourceInfo.isAlgorithmic,
      sourceType: sourceInfo.sourceType
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
  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][YouTube] 🔍 Starting scan... (isShorts: ${isShorts})`);
    debugLog('log', `[AlgorithmLens][YouTube] URL: ${window.location.href}`);
  }

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

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][YouTube] Found raw containers: ${containers.length} [${usedSelectors.join(', ')}]`);
  }

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

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][YouTube] After empty filter: ${containers.length} containers`);
  }

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
  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][YouTube] After deduplication: ${containers.length} containers`);
  }

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

    if (CAPTURE_DEBUG) {
      debugLog('log', `[AlgorithmLens][YouTube][Shorts] Viewport filter: ${beforeViewportFilter} -> ${containers.length} (removed ${beforeViewportFilter - containers.length} not yet viewed)`);
    }
  } else {
    // For regular feed, filter out pre-loaded videos below viewport
    containers = containers.filter(el => {
      const rect = el.getBoundingClientRect();
      // Keep videos that are visible OR above the viewport (already scrolled past)
      const isVisibleOrScrolledPast = rect.top < viewportHeight;
      return isVisibleOrScrolledPast;
    });

    if (CAPTURE_DEBUG) {
      debugLog('log', `[AlgorithmLens][YouTube] Viewport filter: ${beforeViewportFilter} -> ${containers.length} (removed ${beforeViewportFilter - containers.length} below viewport)`);
    }
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
  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][YouTube] Final posts extracted: ${posts.length}`);
  }

  if (CAPTURE_DEBUG && posts.length > 0) {
    debugLog('log', `[CaptureDebug][YouTube] Sample posts (first 20):`, posts.slice(0, 20).map(p => ({
      id: (p.id || '').slice(0, 25),
      creator: (p.creator || '—').slice(0, 20),
      captionSample: p.caption ? p.caption.slice(0, 60) + '...' : '—',
      isSponsored: p.isSponsored ? '✓ AD' : '',
      hasCTA: p.ctaText ? '✓' : '',
      link: p.link ? '✓' : ''
    })));
  }

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][YouTube] Rejection histogram:`, rejectionCounts);
  }

  return posts;
}

export { extractYouTubePost, scanYouTubeFeed };
