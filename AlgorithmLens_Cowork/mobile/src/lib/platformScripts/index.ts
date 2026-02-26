/**
 * Platform-specific JavaScript injection scripts for the WebView scanner.
 *
 * Each script is injected into the WebView and runs in the context of the
 * social media platform's mobile website. It captures feed items as the
 * user scrolls, detecting creators, ads, and suggested content.
 *
 * Scripts communicate back to React Native via:
 *   window.ReactNativeWebView.postMessage(JSON.stringify({...}))
 */

import { INSTAGRAM_SCRIPT } from './instagram';
import { TWITTER_SCRIPT } from './twitter';
import { YOUTUBE_SCRIPT } from './youtube';
import { TIKTOK_SCRIPT } from './tiktok';
import { FACEBOOK_SCRIPT } from './facebook';
import { REDDIT_SCRIPT } from './reddit';

export { INSTAGRAM_SCRIPT } from './instagram';
export { TWITTER_SCRIPT } from './twitter';
export { YOUTUBE_SCRIPT } from './youtube';
export { TIKTOK_SCRIPT } from './tiktok';
export { FACEBOOK_SCRIPT } from './facebook';
export { REDDIT_SCRIPT } from './reddit';

/**
 * Get the mobile web URL for a platform.
 */
export function getPlatformUrl(platform: string): string {
  const urls: Record<string, string> = {
    instagram: 'https://www.instagram.com/',
    twitter: 'https://x.com/home',
    youtube: 'https://m.youtube.com/',
    tiktok: 'https://www.tiktok.com/foryou',
    facebook: 'https://m.facebook.com/',
    reddit: 'https://m.reddit.com/',
  };
  return urls[platform.toLowerCase()] || 'https://www.google.com/';
}

/**
 * Generic capture script that works as a fallback for any platform.
 */
const GENERIC_CAPTURE_SCRIPT = `
(function() {
  'use strict';

  const CAPTURED = new Set();
  let position = 0;

  const AD_KEYWORDS = [
    'sponsored', 'promoted', 'advertisement', '#ad', '#sponsored',
    'paid partnership', 'paid promotion'
  ];

  const SUGGESTED_KEYWORDS = [
    'suggested for you', 'recommended', 'because you follow',
    'based on your activity', 'you might like', 'discover',
    'popular near you', 'trending'
  ];

  function isAdContent(text) {
    const lower = text.toLowerCase();
    return AD_KEYWORDS.some(kw => lower.includes(kw));
  }

  function isSuggestedContent(text) {
    const lower = text.toLowerCase();
    return SUGGESTED_KEYWORDS.some(kw => lower.includes(kw));
  }

  function extractHandle(element) {
    const links = element.querySelectorAll('a[href]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\\/(@?[a-zA-Z0-9_\\.]{2,30})\\/?$/);
      if (match) return match[1].replace(/^@/, '');
    }
    const text = element.textContent || '';
    const handleMatch = text.match(/@([a-zA-Z0-9_\\.]{2,30})/);
    if (handleMatch) return handleMatch[1];
    return null;
  }

  function captureItem(element) {
    const text = (element.textContent || '').trim();
    const key = text.substring(0, 100);
    if (CAPTURED.has(key) || text.length < 10) return;
    CAPTURED.add(key);

    position++;
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FEED_ITEM',
      data: {
        platform: 'UNKNOWN',
        position_in_feed: position,
        creator_handle: extractHandle(element),
        creator_display_name: null,
        is_ad: isAdContent(text),
        ad_label_text: isAdContent(text) ? 'Detected via text analysis' : null,
        post_text: text.substring(0, 2000),
        hashtags: (text.match(/#[a-zA-Z0-9_]+/g) || []).slice(0, 10),
        is_suggested: isSuggestedContent(text),
        content_type: 'unknown',
        capture_timestamp: Date.now()
      }
    }));
  }

  const selectors = ['article', '[role="article"]', '[data-testid*="post"]', '.Post', '.post'];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) captureItem(entry.target); });
  }, { threshold: 0.3 });

  function observeItems() {
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.__alg_observed) { el.__alg_observed = true; observer.observe(el); }
      });
    });
  }

  observeItems();
  new MutationObserver(observeItems).observe(document.body, { childList: true, subtree: true });

  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'SCANNER_READY', data: { timestamp: Date.now() }
  }));
  true;
})();
`;

/**
 * Wraps a platform injection script with error handling.
 *
 * Adds:
 * - Global try-catch around the entire script
 * - Error reporting back to React Native via postMessage
 * - Timeout detection: if no FEED_ITEM is captured within SCAN_TIMEOUT_MS,
 *   sends a SCAN_TIMEOUT message so the native layer can show an error state
 * - Categorizes common failure modes (DOM changed, bot detection, page not loaded)
 */
const SCAN_TIMEOUT_MS = 30000;

function wrapWithErrorHandling(script: string): string {
  // Strip the outer IIFE wrapper and trailing `true;` from the platform script
  // so we can re-wrap it inside our error-handling IIFE.
  // Platform scripts follow the pattern: (function() { ... true; })();
  const trimmed = script.trim();

  return `
(function() {
  'use strict';

  var __alg_hasCapturedItem = false;
  var __alg_scanTimedOut = false;

  // Patch postMessage to track whether any FEED_ITEM was captured
  var __alg_originalPostMessage = window.ReactNativeWebView.postMessage.bind(window.ReactNativeWebView);
  window.ReactNativeWebView.postMessage = function(msg) {
    try {
      var parsed = JSON.parse(msg);
      if (parsed.type === 'FEED_ITEM') {
        __alg_hasCapturedItem = true;
      }
    } catch(e) {}
    __alg_originalPostMessage(msg);
  };

  // Early health check at 10s: test critical selectors before full timeout
  setTimeout(function() {
    if (__alg_hasCapturedItem || __alg_scanTimedOut) return;

    // Platform-specific critical selectors that MUST exist if the page loaded correctly
    var criticalSelectors = {
      INSTAGRAM: ['article', 'a[href^="/"]'],
      TWITTER: ['article[role="article"]', '[data-testid="tweetText"]'],
      YOUTUBE: ['ytm-rich-item-renderer, ytm-video-with-context-renderer, .media-item'],
      TIKTOK: ['[data-e2e="recommend-list-item-container"], [class*="DivItemContainer"], [class*="VideoCard"]'],
      FACEBOOK: ['[role="article"], article[data-ft], [data-sigil*="story"]'],
      REDDIT: ['shreddit-post, [data-testid="post-container"], article'],
    };

    // Detect platform from the URL
    var host = window.location.hostname.toLowerCase();
    var platform = 'UNKNOWN';
    if (host.includes('instagram')) platform = 'INSTAGRAM';
    else if (host.includes('x.com') || host.includes('twitter')) platform = 'TWITTER';
    else if (host.includes('youtube')) platform = 'YOUTUBE';
    else if (host.includes('tiktok')) platform = 'TIKTOK';
    else if (host.includes('facebook')) platform = 'FACEBOOK';
    else if (host.includes('reddit')) platform = 'REDDIT';

    var selectors = criticalSelectors[platform] || [];
    var totalFound = 0;
    for (var i = 0; i < selectors.length; i++) {
      totalFound += document.querySelectorAll(selectors[i]).length;
    }

    if (totalFound === 0 && document.body && document.body.textContent.length > 500) {
      // Page loaded but no feed elements found — DOM likely changed
      __alg_scanTimedOut = true;
      __alg_originalPostMessage(JSON.stringify({
        type: 'SCAN_ERROR',
        data: {
          reason: 'DOM_STRUCTURE_CHANGED',
          detail: 'This platform recently updated their layout. Feed elements could not be found after 10 seconds.',
          articlesFound: 0,
          timestamp: Date.now()
        }
      }));
    }
  }, 10000);

  // Timeout: if no posts captured within ${SCAN_TIMEOUT_MS}ms, report failure
  setTimeout(function() {
    if (!__alg_hasCapturedItem && !__alg_scanTimedOut) {
      __alg_scanTimedOut = true;

      // Determine failure reason by inspecting the page
      var reason = 'TIMEOUT_NO_POSTS';
      var detail = 'No posts were captured within the scanning period.';

      // Check if page has articles at all
      var articles = document.querySelectorAll('article, [role="article"]');
      if (articles.length === 0) {
        // No articles found — DOM structure may have changed or page didn't load
        var bodyText = (document.body && document.body.textContent) || '';
        var bodyLen = bodyText.length;

        if (bodyLen < 500) {
          reason = 'PAGE_NOT_LOADED';
          detail = 'The page does not appear to have fully loaded.';
        } else if (
          bodyText.toLowerCase().includes('verify') ||
          bodyText.toLowerCase().includes('captcha') ||
          bodyText.toLowerCase().includes('confirm your identity') ||
          bodyText.toLowerCase().includes('suspicious activity') ||
          bodyText.toLowerCase().includes('unusual activity') ||
          bodyText.toLowerCase().includes('automated')
        ) {
          reason = 'BOT_DETECTION';
          detail = 'The platform may have detected automated access.';
        } else {
          reason = 'DOM_STRUCTURE_CHANGED';
          detail = 'Could not find feed posts. The platform layout may have changed.';
        }
      } else {
        // Articles exist but none were captured — script logic may have failed
        reason = 'CAPTURE_FAILED';
        detail = 'Feed posts were found but could not be captured. The platform layout may have changed.';
      }

      __alg_originalPostMessage(JSON.stringify({
        type: 'SCAN_ERROR',
        data: {
          reason: reason,
          detail: detail,
          articlesFound: articles ? articles.length : 0,
          timestamp: Date.now()
        }
      }));
    }
  }, ${SCAN_TIMEOUT_MS});

  try {
    // Execute the original platform script inline
    ${trimmed}
  } catch(err) {
    // Script threw an error during execution
    var errorMsg = (err && err.message) ? err.message : String(err);
    var reason = 'INJECTION_ERROR';
    var detail = 'The scanning script encountered an error: ' + errorMsg;

    // Categorize common errors
    if (errorMsg.indexOf('Cannot read') >= 0 || errorMsg.indexOf('null') >= 0 || errorMsg.indexOf('undefined') >= 0) {
      reason = 'DOM_STRUCTURE_CHANGED';
      detail = 'The platform layout has changed and the scanner could not read the page structure.';
    } else if (errorMsg.indexOf('SecurityError') >= 0 || errorMsg.indexOf('cross-origin') >= 0) {
      reason = 'BLOCKED_BY_PLATFORM';
      detail = 'The platform blocked the scanning script.';
    }

    __alg_originalPostMessage(JSON.stringify({
      type: 'SCAN_ERROR',
      data: {
        reason: reason,
        detail: detail,
        errorMessage: errorMsg,
        timestamp: Date.now()
      }
    }));
  }
})();
true;`;
}

/**
 * Get the injection script for a platform, wrapped with error handling.
 */
export function getPlatformScript(platform: string): string {
  const scripts: Record<string, string> = {
    instagram: INSTAGRAM_SCRIPT,
    twitter: TWITTER_SCRIPT,
    youtube: YOUTUBE_SCRIPT,
    tiktok: TIKTOK_SCRIPT,
    facebook: FACEBOOK_SCRIPT,
    reddit: REDDIT_SCRIPT,
  };

  const raw = scripts[platform.toLowerCase()] || GENERIC_CAPTURE_SCRIPT;
  return wrapWithErrorHandling(raw);
}
