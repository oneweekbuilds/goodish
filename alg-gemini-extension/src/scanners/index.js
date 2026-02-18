/**
 * Scanner Index — unified platform router.
 * Re-exports per-platform scan/extract functions through a single interface
 * so content.js stays slim.
 */

import { CAPTURE_DEBUG } from '../shared/debug.js';
import { extractTikTokPost, scanTikTokFeed } from './tiktok.js';
import { extractInstagramPost, scanInstagramFeed } from './instagram.js';
import { extractYouTubePost, scanYouTubeFeed } from './youtube.js';
import { extractFacebookPost, scanFacebookFeed, resetFacebookState } from './facebook.js';
import { extractTwitterPost, scanTwitterFeed } from './twitter.js';
import { extractRedditPost, scanRedditFeed } from './reddit.js';
import { isInstagramReels } from './utils.js';

// Re-export everything scanners need
export {
  scanTikTokFeed, scanInstagramFeed, scanYouTubeFeed,
  scanFacebookFeed, scanTwitterFeed, scanRedditFeed,
  resetFacebookState
};

/**
 * Extract a single post from a container using the appropriate platform scanner.
 * @param {Element} container
 * @param {string} platform
 * @param {object} context - Platform-specific context (isShorts, isReels, etc.)
 * @returns {object|null}
 */
export function extractPostForPlatform(container, platform, context = {}) {
  try {
    switch (platform) {
      case 'tiktok':    return extractTikTokPost(container, -1);
      case 'instagram': return extractInstagramPost(container, -1);
      case 'youtube':   return extractYouTubePost(container, -1, context.isShorts || false);
      case 'facebook':  return extractFacebookPost(container, -1);
      case 'twitter':   return extractTwitterPost(container, -1);
      case 'reddit':    return extractRedditPost(container, -1);
      default:          return null;
    }
  } catch (e) {
    return null;
  }
}

/**
 * Run a full feed scan for the given platform.
 * @param {string} platform
 * @returns {Array}
 */
export function scanFeedForPlatform(platform) {
  switch (platform) {
    case 'tiktok':    return scanTikTokFeed();
    case 'instagram': return scanInstagramFeed();
    case 'youtube':   return scanYouTubeFeed();
    case 'facebook':  return scanFacebookFeed();
    case 'twitter':   return scanTwitterFeed();
    case 'reddit':    return scanRedditFeed();
    default:          return [];
  }
}

/**
 * Get feed container selectors for MutationObserver.
 */
export function getFeedContainerSelectors(platform) {
  switch (platform) {
    case 'tiktok':
      return ['[class*="DivItemContainer"]', 'main', '#main-content-video_detail'];
    case 'instagram':
      return ['main[role="main"]', 'article', 'section main'];
    case 'youtube':
      return ['ytd-rich-grid-renderer', 'ytd-watch-flexy', '#contents'];
    case 'facebook':
      return ['div[role="feed"]', 'div[role="main"]', '[data-pagelet="Feed"]', '[data-pagelet*="FeedUnit"]'];
    case 'twitter':
      return ['main[role="main"]', 'div[data-testid="primaryColumn"]', 'div[data-testid="cellInnerDiv"]'];
    case 'reddit':
      return ['main', 'shreddit-feed', 'div[data-testid="posts-list"]', 'div[data-scroller-first]', '#siteTable'];
    default:
      return ['body'];
  }
}

/**
 * Get individual post container selectors for IntersectionObserver.
 */
export function getPostContainerSelectors(platform, context = {}) {
  switch (platform) {
    case 'tiktok':
      return [
        '[data-e2e="recommend-list-item-container"]', '[data-e2e="search-card-video-card"]',
        '[class*="DivItemContainerV2"]', '[class*="DivItemContainerForSearch"]',
        '[class*="DivContentContainer"]', 'div[class*="video-feed-item"]', '[class*="DivBrowserModeContainer"]'
      ];
    case 'instagram':
      if (context.isReels) {
        return [
          'div[class*="x1ned7t2"]', 'div[class*="xh8yej3"]', 'section[class*="_aap0"]',
          'div[style*="translateX"]', 'article[role="presentation"]', 'article'
        ];
      }
      return ['article[role="presentation"]', 'article'];
    case 'youtube':
      if (context.isShorts) {
        return ['ytd-reel-video-renderer', 'ytd-shorts', '[class*="reel-video"]'];
      }
      return ['ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-compact-video-renderer', 'ytd-grid-video-renderer'];
    case 'facebook':
      return ['div[data-pagelet^="FeedUnit_"]'];
    case 'twitter':
      return ['article[data-testid="tweet"]', 'article[role="article"]', 'div[data-testid="cellInnerDiv"] article'];
    case 'reddit':
      return [
        'shreddit-post', 'article[data-testid="post-container"]', 'div[data-testid="post-container"]',
        'div[data-adclicklocation="background"]', 'faceplate-tracker[source="post"]',
        'article.Post', 'div.thing.link'
      ];
    default:
      return [];
  }
}

/**
 * Get platform-specific context for the current page.
 */
export function getPlatformContext(platform) {
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
 * Check if a container element has media content (post validity check).
 */
export function containerHasMedia(container, platform) {
  if (platform === 'reddit' && container.tagName?.toLowerCase() === 'shreddit-post') {
    const hasPostTitle = container.getAttribute('post-title');
    const hasAuthor = container.getAttribute('author');
    const hasPermalink = container.getAttribute('permalink') || container.getAttribute('content-href');
    return hasPostTitle || hasAuthor || hasPermalink;
  }

  if (platform === 'instagram') {
    if (container.tagName?.toLowerCase() === 'article') return true;
    if (container.tagName?.toLowerCase() === 'section') return true;
    if (container.getAttribute('role') === 'presentation') return true;
    const hasHeader = !!container.querySelector('header');
    const hasTimeElement = !!container.querySelector('time');
    const hasProfileLink = !!container.querySelector('a[href^="/"][href$="/"]');
    if (hasHeader || hasTimeElement || hasProfileLink) return true;
    return !!container.querySelector('img, video, canvas');
  }

  if (platform === 'twitter') {
    const hasTweetText = !!container.querySelector('[data-testid="tweetText"]');
    const hasUserName = !!container.querySelector('[data-testid="User-Name"]');
    const hasTimestamp = !!container.querySelector('time[datetime]');
    if (hasTweetText || hasUserName || hasTimestamp) return true;
    return !!container.querySelector('img, video');
  }

  return !!container.querySelector('img, video, #video-title, #thumbnail, h3');
}

/**
 * Log scan results summary — single consolidated log per scan.
 */
export function logScanResults(platformName, posts, issues, containersSeen = 0, rejectionHistogram = null, explicitSubtype = null) {
  const issueCounts = rejectionHistogram || {};
  if (!rejectionHistogram) {
    issues.forEach(i => { issueCounts[i.issue] = (issueCounts[i.issue] || 0) + 1; });
  }

  const containersCount = containersSeen || (posts.length + issues.length);
  let subtype = explicitSubtype;
  if (!subtype && platformName.toLowerCase() === 'instagram') {
    subtype = isInstagramReels() ? 'reels' : 'feed';
  }

  const subtypePart = subtype ? `, subtype: "${subtype}"` : '';
  const histogramStr = Object.keys(issueCounts).length > 0
    ? `, rejectionCodes: ${JSON.stringify(issueCounts)}`
    : '';

  if (CAPTURE_DEBUG) console.log(`[AlgorithmLens] SCAN_SUMMARY { platform: "${platformName}"${subtypePart}, containersSeen: ${containersCount}, extracted: ${posts.length}, rejected: ${issues.length}${histogramStr} }`);
}
