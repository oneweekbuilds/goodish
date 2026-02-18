import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';
import {
  safeQuery, safeQueryAll, safeText, extractHashtags, containsAdIndicator,
  extractCTA, extractLink, isValidCreator, isValidCaption, isNonPostModule,
  generateStableId, extractTwitterStatusId, parseEngagementCount
} from './utils.js';

/**
 * Extract engagement metrics from a Twitter/X tweet container
 * @param {Element} container
 * @returns {{likes: number|null, comments: number|null, shares: number|null, views: number|null}}
 */
function extractTwitterEngagement(container) {
  let likes = null;
  let comments = null;
  let shares = null;

  // Twitter uses data-testid for engagement buttons, with aria-label containing counts
  const replyBtn = safeQuery(container, '[data-testid="reply"] [aria-label], [data-testid="reply"]');
  if (replyBtn) {
    const label = replyBtn.getAttribute('aria-label') || '';
    const match = label.match(/([\d,.KMBkmb]+)\s*repl/i);
    if (match) comments = parseEngagementCount(match[1]);
    if (comments === null) {
      const span = safeQuery(replyBtn, 'span[data-testid="app-text-transition-container"] span');
      if (span) comments = parseEngagementCount(safeText(span));
    }
  }

  const retweetBtn = safeQuery(container, '[data-testid="retweet"] [aria-label], [data-testid="retweet"]');
  if (retweetBtn) {
    const label = retweetBtn.getAttribute('aria-label') || '';
    const match = label.match(/([\d,.KMBkmb]+)\s*(retweet|repost)/i);
    if (match) shares = parseEngagementCount(match[1]);
    if (shares === null) {
      const span = safeQuery(retweetBtn, 'span[data-testid="app-text-transition-container"] span');
      if (span) shares = parseEngagementCount(safeText(span));
    }
  }

  const likeBtn = safeQuery(container, '[data-testid="like"] [aria-label], [data-testid="like"]');
  if (likeBtn) {
    const label = likeBtn.getAttribute('aria-label') || '';
    const match = label.match(/([\d,.KMBkmb]+)\s*like/i);
    if (match) likes = parseEngagementCount(match[1]);
    if (likes === null) {
      const span = safeQuery(likeBtn, 'span[data-testid="app-text-transition-container"] span');
      if (span) likes = parseEngagementCount(safeText(span));
    }
  }

  // Views from analytics link
  let views = null;
  const viewLink = safeQuery(container, 'a[href*="/analytics"] span');
  if (viewLink) views = parseEngagementCount(safeText(viewLink));

  return { likes, comments, shares, views };
}

/**
 * Detect media type in a Twitter/X tweet container
 * @param {Element} container
 * @returns {string} - one of: 'VIDEO', 'CAROUSEL', 'IMAGE', 'TEXT'
 */
function detectTwitterMediaType(container) {
  if (container.querySelector('video')) return 'VIDEO';
  const photos = safeQueryAll(container, '[data-testid="tweetPhoto"] img');
  if (photos.length > 1) return 'CAROUSEL';
  if (photos.length === 1) return 'IMAGE';
  if (container.querySelector('[data-testid="card.wrapper"]')) return 'IMAGE'; // Link cards
  return 'TEXT';
}

/**
 * Detect source type and algorithmic nature of a Twitter/X tweet
 * @param {Element} container
 * @returns {{isAlgorithmic: boolean, sourceType: 'followed'|'suggested'|'ad'|'unknown'}}
 */
function detectTwitterSourceType(container) {
  try {
    // Check for "Suggested for you" text
    const fullText = (container.innerText || container.textContent || '').toLowerCase();
    if (/suggested\s+for\s+you/i.test(fullText)) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // Check for "Because you follow" text
    if (/because\s+you\s+follow/i.test(fullText)) {
      return { isAlgorithmic: false, sourceType: 'followed' };
    }

    // Look for social context labels indicating algorithmic content
    const socialContext = safeQuery(container, '[data-testid="socialContext"]');
    if (socialContext) {
      const contextText = (safeText(socialContext) || '').toLowerCase();
      if (contextText.includes('suggested') || contextText.includes('trending') || contextText.includes('liked')) {
        return { isAlgorithmic: true, sourceType: 'suggested' };
      }
    }

    // Check for "Who to follow" section → suggested
    if (/who\s+to\s+follow/i.test(fullText)) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // On the home feed "For you" tab, posts without explicit "suggested" markers
    // are most likely from followed accounts (Twitter mixes them into the algorithmic feed).
    // The "Following" tab (/home/following) only shows followed accounts.
    if (window.location.pathname.includes('/home') || window.location.pathname === '/') {
      return { isAlgorithmic: false, sourceType: 'followed' };
    }

    return { isAlgorithmic: false, sourceType: 'followed' };
  } catch (error) {
    if (CAPTURE_DEBUG) {
      debugLog('warn', '[AlgorithmLens][Twitter] Error in detectTwitterSourceType:', error.message);
    }
    return { isAlgorithmic: false, sourceType: 'followed' };
  }
}

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
    const sourceInfo = isSponsored
      ? { isAlgorithmic: true, sourceType: 'ad' }
      : detectTwitterSourceType(container);

    return {
      id: postId,
      platform,
      creator: creator || null,
      caption: caption || null,
      hashtags,
      isSponsored: Boolean(isSponsored),
      sponsoredEvidence: sponsoredEvidence || null,
      ctaText: ctaText || null,
      link: link || null,
      engagement: extractTwitterEngagement(container),
      mediaType: detectTwitterMediaType(container),
      isAlgorithmic: sourceInfo.isAlgorithmic,
      sourceType: sourceInfo.sourceType
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

  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Twitter] Starting scan...');
  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Twitter] URL: ${window.location.href}`);

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

  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Twitter] Found raw containers: ${containers.length} (${usedSelector})`);

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

  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Twitter] Viewport filter: ${beforeViewportFilter} -> ${containers.length} (removed ${beforeViewportFilter - containers.length} below viewport)`);

  // Log each container's creator for debugging
  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Twitter] Analyzing ${containers.length} containers:`);
  containers.forEach((el, i) => {
    // Try to find creator name
    const userNameEl = el.querySelector('div[data-testid="User-Name"] a[href^="/"]');
    const creatorHandle = userNameEl ? userNameEl.getAttribute('href')?.replace('/', '') : 'unknown';
    const statusLink = el.querySelector('a[href*="/status/"]');
    const tweetId = statusLink?.href.match(/\/status\/(\d+)/)?.[1] || 'no-id';
    const rect = el.getBoundingClientRect();
    if (CAPTURE_DEBUG) console.log(`  [${i}] @${creatorHandle} - tweet ID: ${tweetId} (top: ${Math.round(rect.top)}px)`);
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
  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Twitter] After tweet ID deduplication: ${containers.length} containers (${seenTweetIds.size} unique IDs)`);

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
  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Twitter] Final posts extracted: ${posts.length}`);

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Twitter] Scan complete - Total posts: ${posts.length}, Issues: ${issues.length}`);
  }

  if (posts.length > 0) {
    if (CAPTURE_DEBUG) {
      debugLog('table', posts.slice(0, 20).map(p => ({
        id: (p.id || '').slice(0, 25),
        creator: (p.creator || '—').slice(0, 20),
        captionSample: p.caption ? p.caption.slice(0, 60) + '...' : '—',
        isSponsored: p.isSponsored ? 'AD' : '',
        hasCTA: p.ctaText ? '✓' : '',
        link: p.link ? '✓' : ''
      })));
    }
  }

  return posts;
}

export { extractTwitterPost, scanTwitterFeed };
