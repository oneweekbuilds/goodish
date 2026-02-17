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
    reddit: 'https://www.reddit.com/',
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
 * Get the injection script for a platform.
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

  return scripts[platform.toLowerCase()] || GENERIC_CAPTURE_SCRIPT;
}
