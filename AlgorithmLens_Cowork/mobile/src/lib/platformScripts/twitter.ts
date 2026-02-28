/**
 * Twitter/X feed capture script.
 * Injected into x.com WebView.
 *
 * Detection strategy:
 *   Ads — "Ad" or "Promoted" label near the tweet metadata.
 *   Suggested — Twitter's home timeline has two tabs: "For you" and "Following".
 *     - "For you" tab: all content is algorithmically suggested.
 *     - "Following" tab: content is from followed accounts (not suggested).
 *     - We detect the active tab and classify accordingly.
 *
 * Also hides Twitter's "Sign up" / "Log in" banners.
 */

export const TWITTER_SCRIPT = `
(function() {
  'use strict';

  const CAPTURED = new Set();
  let position = 0;
  let mutationDebounceTimer = null;

  // ── Prevent video fullscreen takeover ──────────────────────
  function injectVideoBlocker() {
    const style = document.createElement('style');
    style.id = '__alg_video_blocker';
    style.textContent = [
      // Only hide fullscreen button — allow normal video playback
      'video::-webkit-media-controls-fullscreen-button { display: none !important; }',
    ].join('\\n');
    document.head.appendChild(style);

    // Only block navigation to Spaces — allow all other interaction
    document.addEventListener('click', function(e) {
      var spacesLink = e.target.closest('a[href*="/spaces/"]');
      if (spacesLink) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  injectVideoBlocker();

  // ── Hide app-install and signup banners ────────────────────
  function suppressBanners() {
    // Twitter shows a bottom bar prompting sign-up/login
    document.querySelectorAll('[data-testid="BottomBar"], [data-testid="sheetDialog"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    // Hide "Sign up" / "Log in" sticky banners
    document.querySelectorAll('div[role="banner"], nav').forEach(el => {
      const text = (el.textContent || '').toLowerCase();
      if (
        (text.includes('sign up') || text.includes('log in') || text.includes('get the app')) &&
        !text.includes('tweet')
      ) {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'sticky') {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    });

    // Hide "See what's happening" / "Don't miss what's happening" overlays
    document.querySelectorAll('[role="dialog"]').forEach(el => {
      const text = (el.textContent || '').toLowerCase();
      if (text.includes("what's happening") || text.includes('sign up')) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    // Hide bottom nav bar to avoid conflict with scan overlay
    const bottomNav = document.querySelector('nav[role="navigation"], div[role="navigation"]');
    if (bottomNav) {
      const rect = bottomNav.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 80) {
        bottomNav.style.setProperty('display', 'none', 'important');
      }
    }
  }

  suppressBanners();
  setTimeout(suppressBanners, 1000);
  setTimeout(suppressBanners, 3000);
  setTimeout(suppressBanners, 6000);
  var bannerObserver = new MutationObserver(function() { suppressBanners(); });
  setTimeout(function() { bannerObserver.observe(document.body, { childList: true, subtree: true }); }, 6000);

  // ── Detect active tab (For you vs Following) ──────────────
  function getActiveTab() {
    const tabs = document.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
      if (tab.getAttribute('aria-selected') === 'true') {
        const text = (tab.textContent || '').trim().toLowerCase();
        if (text === 'for you' || text.includes('for you')) return 'for_you';
        if (text === 'following') return 'following';
      }
    }
    // Fallback: check URL
    if (window.location.href.toLowerCase().includes('/following')) return 'following';
    // Default: Twitter home page defaults to "For you"
    return 'for_you';
  }

  // ── Extraction helpers ─────────────────────────────────────

  function extractHandle(article) {
    const links = article.querySelectorAll('a[href^="/"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/^\\/([a-zA-Z0-9_]{1,15})\\/?$/);
      if (match) {
        const reserved = ['home', 'explore', 'search', 'notifications', 'messages',
                          'compose', 'settings', 'i', 'tos', 'privacy'];
        if (!reserved.includes(match[1])) return match[1];
      }
    }
    const text = article.textContent || '';
    const handleMatch = text.match(/@([a-zA-Z0-9_]{1,15})/);
    return handleMatch ? handleMatch[1] : null;
  }

  function extractDisplayName(article) {
    const links = article.querySelectorAll('a[href^="/"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      if (/^\\/[a-zA-Z0-9_]{1,15}\\/?$/.test(href)) {
        const spans = link.querySelectorAll('span');
        for (const span of spans) {
          const text = (span.textContent || '').trim();
          if (text.length > 0 && text.length < 50 && !text.startsWith('@')) return text;
        }
      }
    }
    return null;
  }

  function extractTweetText(article) {
    const tweetText = article.querySelector('[data-testid="tweetText"]');
    if (tweetText) return (tweetText.textContent || '').trim().substring(0, 2000);
    return (article.textContent || '').trim().substring(0, 500);
  }

  function isAd(article) {
    const spans = article.querySelectorAll('span');
    for (const span of spans) {
      const text = (span.textContent || '').trim().toLowerCase();
      if (text === 'ad' || text === 'promoted') return true;
    }
    if (article.querySelector('[data-testid*="promoted"], [data-testid*="placementTracking"]')) return true;
    return false;
  }

  function isSuggested(article) {
    const activeTab = getActiveTab();
    if (activeTab === 'for_you') return true;
    if (activeTab === 'following') return false;

    // Fallback: check for recommendation labels
    const text = (article.textContent || '').toLowerCase();
    if (text.includes('suggested for you')) return true;
    if (text.includes('you might like')) return true;
    if (text.includes('based on your')) return true;
    return false;
  }

  function extractHashtags(text) {
    const matches = text.match(/#[a-zA-Z0-9_]+/g);
    return matches ? matches.slice(0, 10) : [];
  }

  function detectContentType(article) {
    if (article.querySelector('video')) return 'video';
    if (article.querySelector('img[src*="pbs.twimg"]')) return 'image';
    return 'text';
  }

  // ── Capture logic ──────────────────────────────────────────

  function captureTweet(article) {
    const tweetText = extractTweetText(article);
    const key = tweetText.substring(0, 80);
    if (CAPTURED.has(key) || tweetText.length < 5) return;
    CAPTURED.add(key);

    const handle = extractHandle(article);
    const displayName = extractDisplayName(article);
    const adDetected = isAd(article);
    position++;

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FEED_ITEM',
      data: {
        platform: 'TWITTER',
        position_in_feed: position,
        creator_handle: handle,
        creator_display_name: displayName,
        is_ad: adDetected,
        ad_label_text: adDetected ? 'Promoted' : null,
        post_text: tweetText,
        hashtags: extractHashtags(tweetText),
        is_suggested: isSuggested(article),
        content_type: detectContentType(article),
        capture_timestamp: Date.now()
      }
    }));
  }

  function captureWithDelay(article) {
    setTimeout(() => captureTweet(article), 500);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) captureWithDelay(entry.target);
    });
  }, { threshold: 0.1 });

  function observeArticles() {
    document.querySelectorAll('article[role="article"]').forEach(a => {
      if (!a.__alg_observed) {
        a.__alg_observed = true;
        observer.observe(a);
      }
    });
  }

  observeArticles();
  const mutationObserver = new MutationObserver(() => {
    if (mutationDebounceTimer) return;
    mutationDebounceTimer = setTimeout(() => {
      mutationDebounceTimer = null;
      observeArticles();
    }, 200);
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Scroll-based fallback: capture any visible tweet every 3 seconds
  setInterval(function() {
    document.querySelectorAll('article[role="article"]').forEach(a => {
      const rect = a.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        captureWithDelay(a);
      }
    });
  }, 3000);

  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'SCANNER_READY',
    data: { platform: 'TWITTER', timestamp: Date.now() }
  }));

  true;
})();
`;
