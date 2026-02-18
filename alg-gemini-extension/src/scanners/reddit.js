import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';
import {
  safeQuery, safeQueryAll, safeText, extractHashtags, containsAdIndicator,
  extractCTA, extractLink, isValidCreator, isValidCaption, isNonPostModule,
  generateStableId, parseEngagementCount
} from './utils.js';

/**
 * Extract engagement metrics from a Reddit post container
 * @param {Element} container
 * @returns {{likes: number|null, comments: number|null, shares: null, views: null}}
 */
function extractRedditEngagement(container) {
  let likes = null; // upvotes
  let comments = null;

  // Shreddit-post attributes
  const scoreAttr = container.getAttribute?.('score');
  if (scoreAttr) likes = parseEngagementCount(scoreAttr);
  const commentCountAttr = container.getAttribute?.('comment-count');
  if (commentCountAttr) comments = parseEngagementCount(commentCountAttr);

  // Fallback: DOM elements
  if (likes === null) {
    const scoreEl = safeQuery(container, '[data-testid="post-score"], [id="vote-arrows"] div, shreddit-post-overflow-menu');
    if (scoreEl) likes = parseEngagementCount(safeText(scoreEl));
  }

  if (comments === null) {
    const commentEl = safeQuery(container, 'a[data-click-id="comments"] span, [data-testid="comment-count"], a[slot="full-post-link"]');
    if (commentEl) {
      const text = safeText(commentEl) || '';
      const match = text.match(/([\d,.KMBkmb]+)\s*comment/i);
      if (match) comments = parseEngagementCount(match[1]);
      else comments = parseEngagementCount(text);
    }
  }

  return { likes, comments, shares: null, views: null };
}

/**
 * Detect media type in a Reddit post container
 * @param {Element} container
 * @returns {string} - one of: 'VIDEO', 'CAROUSEL', 'IMAGE', 'TEXT'
 */
function detectRedditMediaType(container) {
  if (container.querySelector('video, shreddit-player')) return 'VIDEO';
  // Check for gallery (multiple images)
  if (container.querySelector('[class*="gallery"], [slot="post-media-container"] ul')) return 'CAROUSEL';
  const contentType = container.getAttribute?.('post-type');
  if (contentType === 'image') return 'IMAGE';
  if (contentType === 'video' || contentType === 'gif') return 'VIDEO';
  if (contentType === 'gallery') return 'CAROUSEL';
  if (container.querySelector('img[src*="preview.redd.it"], img[src*="i.redd.it"]')) return 'IMAGE';
  if (contentType === 'link') return 'TEXT'; // Link posts are text-like
  return 'TEXT';
}

/**
 * Detect source type and algorithmic nature of a Reddit post
 * @param {Element} container
 * @returns {{isAlgorithmic: boolean, sourceType: 'followed'|'suggested'|'ad'|'unknown'}}
 */
function detectRedditSourceType(container) {
  try {
    // Check for "Recommended" or "Because you visited" text
    const fullText = (container.innerText || container.textContent || '').toLowerCase();
    if (/recommended/i.test(fullText) || /because\s+you\s+visited/i.test(fullText)) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // For shreddit-post elements, check subscription status
    const isShreddit = container.tagName?.toLowerCase() === 'shreddit-post';
    if (isShreddit) {
      // Check for [subscribed] attribute indicating user is subscribed to the subreddit
      if (container.hasAttribute?.('subscribed')) {
        return { isAlgorithmic: false, sourceType: 'followed' };
      }

      // Check for Join button (not subscribed = suggested)
      if (container.querySelector?.('[slot*="join"]') || fullText.includes('join')) {
        return { isAlgorithmic: true, sourceType: 'suggested' };
      }

      // Check for "Joined" or "Leave" button (already subscribed = followed)
      if (fullText.includes('joined') || fullText.includes('leave')) {
        return { isAlgorithmic: false, sourceType: 'followed' };
      }
    }

    // Check feed-index-type attribute
    const feedIndexType = container.getAttribute?.('feed-index-type');
    if (feedIndexType === 'home') {
      // On home feed without subscription info, default to followed
      // (suggested posts are caught by subscription/join checks above)
      return { isAlgorithmic: false, sourceType: 'followed' };
    }

    // For posts from r/popular or r/all, mark as suggested
    const subreddit = container.getAttribute?.('subreddit-prefixed-name');
    if (subreddit && (subreddit.includes('r/popular') || subreddit.includes('r/all'))) {
      return { isAlgorithmic: true, sourceType: 'suggested' };
    }

    // Default: if no explicit suggested signals, likely from subscribed subreddit
    return { isAlgorithmic: false, sourceType: 'followed' };
  } catch (error) {
    if (CAPTURE_DEBUG) {
      debugLog('warn', '[AlgorithmLens][Reddit] Error in detectRedditSourceType:', error.message);
    }
    return { isAlgorithmic: false, sourceType: 'followed' };
  }
}

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

      const isSponsored = isRedditSponsored(container);
      const sourceInfo = isSponsored
        ? { isAlgorithmic: true, sourceType: 'ad' }
        : detectRedditSourceType(container);

      return {
        id: postId,
        platform,
        creator: creator || null,
        caption: caption || null,
        hashtags: extractHashtags(caption),
        isSponsored: isSponsored,
        sponsoredEvidence: null, // Reddit sponsored detection returns boolean only
        ctaText: null,
        link: link || null,
        engagement: extractRedditEngagement(container),
        mediaType: detectRedditMediaType(container),
        isAlgorithmic: sourceInfo.isAlgorithmic,
        sourceType: sourceInfo.sourceType
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

  const sourceInfo = isSponsored
    ? { isAlgorithmic: true, sourceType: 'ad' }
    : detectRedditSourceType(container);

  return {
    id: postId,
    platform,
    creator: creator || null,
    caption: caption || null,
    hashtags,
    isSponsored: Boolean(isSponsored),
    sponsoredEvidence: null, // Reddit sponsored detection returns boolean only
    ctaText: ctaText || null,
    link: link || null,
    engagement: extractRedditEngagement(container),
    mediaType: detectRedditMediaType(container),
    isAlgorithmic: sourceInfo.isAlgorithmic,
    sourceType: sourceInfo.sourceType
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

  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Reddit] Starting scan...');
  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Reddit] URL:', window.location.href);

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
      if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Reddit] Using selector: ${selector}, found: ${found.length}`);
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

  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Reddit] Found raw containers:', containers.length, `(${usedSelector})`);

  // Debug: If no containers, log what we can find
  if (containers.length === 0 && CAPTURE_DEBUG) {
    console.log('[AlgorithmLens][Reddit] No containers found. Debug info:');
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

  if (CAPTURE_DEBUG) console.log('[AlgorithmLens][Reddit] After filtering: ', containers.length, 'containers');

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
  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens][Reddit] After deduplication: ${containers.length} containers`);

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

      const sponsoredStatus = isRedditSponsored(container);
      const sourceInfo = sponsoredStatus
        ? { isAlgorithmic: true, sourceType: 'ad' }
        : detectRedditSourceType(container);

      return {
        id,
        platform: 'reddit',
        creator: creator || null,
        caption: caption || null,
        hashtags: [],
        isSponsored: sponsoredStatus,
        ctaText: null,
        link: link || null,
        engagement: extractRedditEngagement(container),
        mediaType: detectRedditMediaType(container),
        isAlgorithmic: sourceInfo.isAlgorithmic,
        sourceType: sourceInfo.sourceType
      };
    }).filter(Boolean);

    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Reddit] Fallback posts extracted: ${fallbackPosts.length}`);
    }

    if (fallbackPosts.length > 0) {
      if (CAPTURE_DEBUG) {
        debugLog('table', fallbackPosts.slice(0, 10).map((p) => ({
          id: p.id,
          creator: p.creator,
          captionSample: p.caption ? p.caption.slice(0, 80) : null,
          isSponsored: p.isSponsored,
          link: p.link,
        })));
      }
    }

    if (CAPTURE_DEBUG) {
      debugLog('log', `[CaptureDebug][Reddit] scanRedditFeed() RETURNING (fallback): ${fallbackPosts.length} posts`);
    }

    return fallbackPosts;
  }

  // === DETAILED LOGGING ===
  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Reddit] Final posts extracted: ${posts.length}`);
  }

  if (posts.length > 0) {
    if (CAPTURE_DEBUG) {
      debugLog('table', posts.slice(0, 10).map((p) => ({
        id: p.id,
        creator: p.creator,
        captionSample: p.caption ? p.caption.slice(0, 80) : null,
        isSponsored: p.isSponsored,
        link: p.link,
      })));
    }
  }

  if (posts.length === 0) {
    console.warn('[AlgorithmLens][Reddit] No posts extracted. Issues:', issues);
  }

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][Reddit] scanRedditFeed() RETURNING (normal): ${posts.length} posts`);
  }

  return posts;
}

export { extractRedditPost, scanRedditFeed };
