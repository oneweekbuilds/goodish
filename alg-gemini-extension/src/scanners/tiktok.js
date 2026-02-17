import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';
import {
  safeQuery, safeQueryAll, safeText, extractHashtags, containsAdIndicator,
  extractCTA, extractLink, isValidCreator, isValidCaption, isNonPostModule,
  generateStableId, parseEngagementCount
} from './utils.js';

// ============================================================================
// TIKTOK SCANNER
// ============================================================================

/**
 * Extract engagement metrics from a TikTok post
 * @param {Element} container
 * @returns {{likes: number|null, comments: number|null, shares: number|null, views: number|null}}
 */
function extractTikTokEngagement(container) {
  const likes = parseEngagementCount(safeText(safeQuery(container, '[data-e2e="like-count"], [data-e2e="browse-like-count"]')));
  const comments = parseEngagementCount(safeText(safeQuery(container, '[data-e2e="comment-count"], [data-e2e="browse-comment-count"]')));
  const shares = parseEngagementCount(safeText(safeQuery(container, '[data-e2e="share-count"], [data-e2e="browse-share-count"]')));
  const views = parseEngagementCount(safeText(safeQuery(container, '[data-e2e="video-views"], strong[data-e2e="video-views"]')));
  return { likes, comments, shares, views };
}

/**
 * Detect media type from a TikTok post
 * @param {Element} container
 * @returns {string}
 */
function detectTikTokMediaType(container) {
  if (container.querySelector('video')) return 'VIDEO';
  if (container.querySelector('img[src]')) return 'IMAGE';
  return 'TEXT';
}

/**
 * Detect source type and algorithmic nature of a TikTok post
 * @param {Element} container
 * @returns {{isAlgorithmic: boolean, sourceType: 'followed'|'suggested'|'ad'|'unknown'}}
 */
function detectTikTokSourceType(container) {
  try {
    // Check if on "Following" tab - look for active tab selector or URL pattern
    const followingTab = safeQuery(document, '[data-e2e="following-tab"][class*="active"], [data-e2e="following-tab"][aria-selected="true"]');
    if (followingTab || window.location.pathname.includes('/following')) {
      return { isAlgorithmic: false, sourceType: 'followed' };
    }

    // Check for following context in data attributes
    const followingContext = container.getAttribute?.('data-e2e');
    if (followingContext && followingContext.includes('following')) {
      return { isAlgorithmic: false, sourceType: 'followed' };
    }

    // If on "For You" page (default) - virtually everything on FYP is algorithmic
    if (!window.location.pathname.includes('/following')) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    return { isAlgorithmic: false, sourceType: 'unknown' };
  } catch (error) {
    if (CAPTURE_DEBUG) {
      debugLog('warn', '[AlgorithmLens][TikTok] Error in detectTikTokSourceType:', error.message);
    }
    return { isAlgorithmic: false, sourceType: 'unknown' };
  }
}

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
      if (CAPTURE_DEBUG) {
        debugLog('log', `[AlgorithmLens][TikTok] AD DETECTED via selector: ${sel}`);
      }
      return true;
    }
  }

  // Check container and ancestor class names for ad indicators
  const elementsToCheck = [container, container.parentElement, container.parentElement?.parentElement].filter(Boolean);
  for (const el of elementsToCheck) {
    const className = el.className || '';
    if (className.toLowerCase().includes('ad') && (className.includes('Container') || className.includes('Badge') || className.includes('Spark'))) {
      if (CAPTURE_DEBUG) {
        debugLog('log', `[AlgorithmLens][TikTok] AD DETECTED via class pattern: ${className}`);
      }
      return true;
    }
  }

  // Check text content in meta areas - look for specific ad indicators
  const metaText = safeText(container)?.slice(0, 500) || '';
  if (containsAdIndicator(metaText)) {
    if (CAPTURE_DEBUG) {
      debugLog('log', `[AlgorithmLens][TikTok] AD DETECTED via text indicator`);
    }
    return true;
  }

  // Scan for standalone "Sponsored" or "Ad" text labels (like YouTube fix)
  const allSpans = safeQueryAll(container, 'span, div[class*="Label"], div[class*="Badge"]');
  for (const span of allSpans) {
    const directText = span.textContent?.trim().toLowerCase() || '';
    if (directText === 'sponsored' || directText === 'ad' || directText === 'promoted' || directText === 'iklan') {
      if (CAPTURE_DEBUG) {
        debugLog('log', `[AlgorithmLens][TikTok] AD DETECTED via label text: ${directText}`);
      }
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
    const sourceInfo = isSponsored
      ? { isAlgorithmic: true, sourceType: 'ad' }
      : detectTikTokSourceType(container);

    return {
      id: postId,
      platform,
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null, // TikTok sponsored detection returns boolean only
      ctaText: ctaText || null,
      link: link || null,
      engagement: extractTikTokEngagement(container),
      mediaType: detectTikTokMediaType(container),
      isAlgorithmic: sourceInfo.isAlgorithmic,
      sourceType: sourceInfo.sourceType
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

  if (CAPTURE_DEBUG) {
    debugLog('log', '[AlgorithmLens][TikTok] 🔍 Starting scan...');
    debugLog('log', `[AlgorithmLens][TikTok] URL: ${window.location.href}`);
  }

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

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][TikTok] Found raw containers: ${containers.length} [${usedSelectors.join(', ')}]`);
  }

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

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][TikTok] After empty filter: ${containers.length} containers`);
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
    debugLog('log', `[AlgorithmLens][TikTok] After deduplication: ${containers.length} containers`);
  }

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
  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][TikTok] Final posts extracted: ${posts.length}`);
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

export { extractTikTokPost, scanTikTokFeed };
