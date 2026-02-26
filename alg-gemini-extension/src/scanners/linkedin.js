import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';
import {
  safeQuery, safeQueryAll, safeText, extractHashtags, containsAdIndicator,
  extractCTA, extractLink, isValidCreator, isValidCaption, isNonPostModule,
  generateStableId, parseEngagementCount
} from './utils.js';

// ============================================================================
// LINKEDIN SCANNER
// ============================================================================

/**
 * Extract engagement metrics from a LinkedIn post
 * @param {Element} container
 * @returns {{likes: number|null, comments: number|null, shares: number|null, reposts: number|null}}
 */
function extractLinkedInEngagement(container) {
  const likes = parseEngagementCount(safeText(safeQuery(container, '[aria-label*="like"], [data-test-id*="reactions"]')));
  const comments = parseEngagementCount(safeText(safeQuery(container, '[aria-label*="comment"]')));
  const shares = parseEngagementCount(safeText(safeQuery(container, '[aria-label*="share"]')));
  const reposts = parseEngagementCount(safeText(safeQuery(container, '[aria-label*="repost"]')));
  return { likes, comments, shares, reposts };
}

/**
 * Detect media type from a LinkedIn post
 * @param {Element} container
 * @returns {string}
 */
function detectLinkedInMediaType(container) {
  if (container.querySelector('video')) return 'VIDEO';
  if (container.querySelector('img[alt]')) return 'IMAGE';
  if (container.querySelector('[data-test-id*="article"]')) return 'ARTICLE';
  if (container.querySelector('[data-test-id*="document"]')) return 'DOCUMENT';
  return 'TEXT';
}

/**
 * Detect source type and algorithmic nature of a LinkedIn post
 * @param {Element} container
 * @returns {{isAlgorithmic: boolean, sourceType: 'followed'|'suggested'|'ad'|'unknown'}}
 */
function detectLinkedInSourceType(container) {
  try {
    // Check for sponsored/promoted indicators
    const sponsoredSelectors = [
      'span:contains("Promoted")',
      '[aria-label*="promoted"]',
      '[aria-label*="sponsored"]'
    ];

    const hasPromotedText = safeText(container)?.toLowerCase().includes('promoted');
    if (hasPromotedText) {
      return { isAlgorithmic: true, sourceType: 'ad' };
    }

    // Check for "Suggested" indicators
    const suggestedText = safeText(container)?.toLowerCase().includes('suggested');
    if (suggestedText) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // Default to feed (followed) posts
    return { isAlgorithmic: false, sourceType: 'followed' };
  } catch (error) {
    if (CAPTURE_DEBUG) {
      debugLog('warn', '[AlgorithmLens][LinkedIn] Error in detectLinkedInSourceType:', error.message);
    }
    return { isAlgorithmic: false, sourceType: 'unknown' };
  }
}

/**
 * Extract creator name from a LinkedIn post container
 * @param {Element} container
 * @returns {string|null}
 */
function extractLinkedInCreator(container) {
  const creatorSelectors = [
    '.update-components-actor__name',
    '.feed-shared-actor__name',
    'span.feed-shared-actor__title',
    '[data-test-id="actor-name"]',
    'a[href*="/in/"] span',
    '[data-test-id="feed-card-author-headline"]'
  ];

  for (const sel of creatorSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      let creator = safeText(el);
      if (creator && isValidCreator(creator)) {
        return creator.trim();
      }
    }
  }

  return null;
}

/**
 * Extract caption/description from a LinkedIn post container
 * @param {Element} container
 * @returns {string|null}
 */
function extractLinkedInCaption(container) {
  const captionSelectors = [
    '.feed-shared-update-v2__description',
    '.feed-shared-text',
    '[data-test-id="update-text"]',
    '.break-words',
    '[data-test-id="post-text"]'
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
 * Detect if a LinkedIn post is sponsored/an ad
 * @param {Element} container
 * @returns {boolean}
 */
function isLinkedInSponsored(container) {
  // Check for ad-specific elements
  const adSelectors = [
    '[aria-label*="promoted"]',
    '[aria-label*="sponsored"]',
    '[data-test-id*="promoted"]',
    '[class*="promoted"]',
    '[class*="Promoted"]',
    '[class*="sponsored"]',
    '[class*="Sponsored"]'
  ];

  for (const sel of adSelectors) {
    if (safeQuery(container, sel)) {
      if (CAPTURE_DEBUG) {
        debugLog('log', `[AlgorithmLens][LinkedIn] AD DETECTED via selector: ${sel}`);
      }
      return true;
    }
  }

  // Check text content for sponsored indicators
  const text = safeText(container)?.slice(0, 500) || '';
  if (containsAdIndicator(text)) {
    if (CAPTURE_DEBUG) {
      debugLog('log', `[AlgorithmLens][LinkedIn] AD DETECTED via text indicator`);
    }
    return true;
  }

  // Check for "Promoted" or "Sponsored" text labels
  const allLabels = safeQueryAll(container, 'span, div[class*="Label"], div[class*="Badge"]');
  for (const label of allLabels) {
    const directText = label.textContent?.trim().toLowerCase() || '';
    if (directText === 'promoted' || directText === 'sponsored' || directText === 'ad') {
      if (CAPTURE_DEBUG) {
        debugLog('log', `[AlgorithmLens][LinkedIn] AD DETECTED via label text: ${directText}`);
      }
      return true;
    }
  }

  return false;
}

/**
 * Extract a single LinkedIn post from its container element
 * @param {Element} container
 * @param {number} index
 * @returns {DesktopPostItem|null}
 */
function extractLinkedInPost(container, index) {
  const platform = 'linkedin';

  // Skip non-post modules
  if (isNonPostModule(container, platform)) {
    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][LinkedIn] Container ${index}: REJECTED (non-post module)`);
    }
    return { rejected: true, code: 'NON_POST_MODULE' };
  }

  const creator = extractLinkedInCreator(container);
  const caption = extractLinkedInCaption(container);
  const isSponsored = isLinkedInSponsored(container);

  // Extract hashtags
  const hashtags = extractHashtags(caption);

  // Extract CTA
  const ctaText = extractCTA(container);

  // Extract link
  let link = extractLink(container);

  // LinkedIn-specific: Look for post permalink
  let linkedinPermalink = null;
  const postLinkSelectors = [
    'a[href*="/feed/update/"]',
    'a[data-test-id*="feed-card"]',
    'a[href*="linkedin.com/feed"]'
  ];

  for (const sel of postLinkSelectors) {
    const el = safeQuery(container, sel);
    if (el) {
      const href = el.getAttribute('href') || '';
      if (href && href.includes('linkedin.com')) {
        linkedinPermalink = href.startsWith('http') ? href : 'https://www.linkedin.com' + href;
        if (!link) link = linkedinPermalink;
        break;
      }
    }
  }

  // Check for media presence
  const hasMedia = !!(container.querySelector('video') || container.querySelector('img[src]'));

  // Generate stable ID
  const postId = generateStableId(platform, creator, caption, container, index, linkedinPermalink);

  // ============================================================================
  // UNIFIED ACCEPTANCE CRITERIA (same as TikTok):
  // HARD requirements: stable post identifier (link OR postId with content)
  // SOFT requirements: at least one of (creator, caption, media)
  // EXCEPTION: Ads are accepted with just an identifier
  // ============================================================================
  const hasCreator = !!creator;
  const hasCaption = !!(caption && caption.length > 0);
  const hasLink = !!link;
  const hasStableId = postId && !postId.includes('-idx');

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
    debugLog('log', `[CaptureDebug][LinkedIn] Container ${index}: hasCreator=${hasCreator}, hasCaption=${hasCaption}, hasMedia=${hasMedia}, hasLink=${hasLink}, hasStableId=${hasStableId}${sponsoredInfo} => ${isValidPost ? 'ACCEPTED' : 'REJECTED'}${rejectInfo}`);
  }

  if (isValidPost) {
    const sourceInfo = isSponsored
      ? { isAlgorithmic: true, sourceType: 'ad' }
      : detectLinkedInSourceType(container);

    return {
      id: postId,
      platform,
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: null,
      ctaText: ctaText || null,
      link: link || null,
      engagement: extractLinkedInEngagement(container),
      mediaType: detectLinkedInMediaType(container),
      isAlgorithmic: sourceInfo.isAlgorithmic,
      sourceType: sourceInfo.sourceType
    };
  }

  return { rejected: true, code: rejectionCode };
}

/**
 * Scan LinkedIn feed for posts
 * @returns {DesktopPostItem[]}
 */
function scanLinkedInFeed() {
  const platform = 'linkedin';
  const posts = [];
  const issues = [];

  if (CAPTURE_DEBUG) {
    debugLog('log', '[AlgorithmLens][LinkedIn] Scanning LinkedIn feed...');
    debugLog('log', `[AlgorithmLens][LinkedIn] URL: ${window.location.href}`);
  }

  // Primary selectors for LinkedIn feed items
  const containerSelectors = [
    'div.feed-shared-update-v2',
    '[data-id]',
    'div[data-urn*="urn:li:activity"]',
    '[data-test-id="update-box"]',
    '[data-test-id="feed-card"]',
    'article[data-test-id*="feed"]'
  ];

  let containers = [];
  const usedSelectors = [];

  // Collect containers from ALL selectors
  for (const selector of containerSelectors) {
    const found = safeQueryAll(document, selector);
    if (found.length > 0) {
      containers.push(...found);
      usedSelectors.push(`${selector}(${found.length})`);
    }
  }

  // Fallback: find containers within scaffold-finite-scroll
  if (containers.length === 0) {
    const scrollContainer = safeQuery(document, 'div.scaffold-finite-scroll__content');
    if (scrollContainer) {
      const allDivs = safeQueryAll(scrollContainer, 'div[data-id]');
      containers = allDivs;
      usedSelectors.push('scaffold-finite-scroll__content > div[data-id]');
    }
  }

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][LinkedIn] Found raw containers: ${containers.length} [${usedSelectors.join(', ')}]`);
  }

  // Filter out navigation/header/empty containers
  containers = containers.filter(el => {
    const text = el.innerText || '';
    const hasContent = text.length > 30;
    const notHeader = !el.closest('header') && !el.closest('nav');
    return hasContent && notHeader;
  });

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][LinkedIn] After empty filter: ${containers.length} containers`);
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
    debugLog('log', `[AlgorithmLens][LinkedIn] After deduplication: ${containers.length} containers`);
  }

  // Track rejection code histogram
  const rejectionCounts = {};

  containers.forEach((container, index) => {
    try {
      const result = extractLinkedInPost(container, index);

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
      if (CAPTURE_DEBUG) console.warn(`[AlgorithmLens][LinkedIn] Error parsing container ${index}:`, err.message);
      const code = 'PARSE_ERROR';
      rejectionCounts[code] = (rejectionCounts[code] || 0) + 1;
      issues.push({ index, issue: code, error: err.message });
    }
  });

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][LinkedIn] Final posts extracted: ${posts.length}`);
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

  return posts;
}

export { extractLinkedInPost, scanLinkedInFeed };
