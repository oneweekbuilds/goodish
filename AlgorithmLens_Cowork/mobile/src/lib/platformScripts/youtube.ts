/**
 * YouTube feed capture script.
 * Injected into m.youtube.com WebView.
 *
 * YouTube's home feed is entirely algorithmically curated — all content
 * is suggested/recommended. Ads show "Ad ·" label or ad badge.
 *
 * Also hides YouTube's "Get the app" / "Open in app" banners.
 */

export const YOUTUBE_SCRIPT = `
(function() {
  'use strict';

  const CAPTURED = new Set();
  let position = 0;
  let mutationDebounceTimer = null;

  // ── Prevent Shorts/fullscreen video takeover ───────────────
  function injectShortsBlocker() {
    const style = document.createElement('style');
    style.id = '__alg_shorts_blocker';
    style.textContent = [
      // Hide Shorts fullscreen overlay
      'ytm-shorts-player, [class*="ShortsPlayer"], [class*="shorts-player"], [class*="shorts-container"],' +
      '[role="presentation"][style*="position: fixed"],' +
      'div[style*="position: fixed"][style*="z-index"][style*="inset: 0"]' +
      '{ display: none !important; visibility: hidden !important; }',

      // Prevent videos from going fullscreen
      'video { max-height: 400px !important; object-fit: cover !important; }',
      'video::-webkit-media-controls-fullscreen-button { display: none !important; }',

      // Hide Shorts navigation tab
      '[aria-label*="Shorts"], [aria-label*="shorts"] { pointer-events: none !important; }',

      // Keep video player container constrained
      '.player-container, [class*="video-container"] { max-height: 400px !important; }',

      // Allow vertical scrolling over videos but block tap/horizontal gestures
      'video { touch-action: pan-y !important; }',
    ].join('\\n');
    document.head.appendChild(style);

    // Override fullscreen API to prevent video fullscreen
    const noop = function() { return Promise.reject('blocked'); };
    if (Element.prototype.requestFullscreen) {
      Element.prototype.requestFullscreen = noop;
    }
    if (Element.prototype.webkitRequestFullscreen) {
      Element.prototype.webkitRequestFullscreen = noop;
    }
    if (HTMLVideoElement.prototype.webkitEnterFullscreen) {
      HTMLVideoElement.prototype.webkitEnterFullscreen = noop;
    }

    // ONLY block navigation to Shorts — allow normal video interaction
    document.addEventListener('click', function(e) {
      // Block navigation to Shorts section
      var shortsLink = e.target.closest('a[href*="/shorts/"], ytm-shorts-player');
      if (shortsLink) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  injectShortsBlocker();

  // ── Hide app-install banners ───────────────────────────────
  function suppressBanners() {
    // YouTube mobile "Get the app" / "Open in app" prompts
    document.querySelectorAll('[class*="upsell"], [class*="app-promo"], [class*="banner"], .companion-ad-container').forEach(el => {
      const text = (el.textContent || '').toLowerCase();
      if (text.includes('get the app') || text.includes('open in app') || text.includes('use the app') || text.includes('download')) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    // Hide fixed/sticky app-promotion elements
    document.querySelectorAll('div, a, section, ytm-banner-promo-renderer').forEach(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      if (
        (text === 'get the app' || text === 'open in app' || text === 'use the app' || text === 'get app') &&
        el.offsetHeight > 0 && el.offsetHeight < 80
      ) {
        let parent = el.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          const style = window.getComputedStyle(parent);
          if (style.position === 'fixed' || style.position === 'sticky') {
            parent.style.setProperty('display', 'none', 'important');
            break;
          }
          parent = parent.parentElement;
        }
      }
    });

    // Hide YouTube-specific promo renderers
    document.querySelectorAll('ytm-banner-promo-renderer, ytm-companion-ad-renderer, ytm-promotion-renderer').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
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
  setInterval(suppressBanners, 2000);

  // ── Extraction helpers ─────────────────────────────────────

  function extractChannel(element) {
    // YouTube shows channel name in link elements
    const channelLinks = element.querySelectorAll('a[href*="/channel/"], a[href*="/@"], a[href*="/c/"]');
    for (const link of channelLinks) {
      const text = (link.textContent || '').trim();
      if (text.length > 0 && text.length < 50) return text;
    }
    // Look for channel name in byline areas
    const bylines = element.querySelectorAll('.ytm-channel-name, .slim-owner-icon-and-title a, [class*="channel-name"]');
    for (const byline of bylines) {
      const text = (byline.textContent || '').trim();
      if (text.length > 0) return text;
    }
    return null;
  }

  function extractHandle(element) {
    const links = element.querySelectorAll('a[href*="/@"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/@([a-zA-Z0-9_.-]+)/);
      if (match) return match[1];
    }
    return null;
  }

  function extractTitle(element) {
    const titleEl = element.querySelector('h3, .media-item-headline, .compact-media-item-headline, [aria-label]');
    if (titleEl) return (titleEl.textContent || '').trim().substring(0, 500);
    return (element.textContent || '').trim().substring(0, 300);
  }

  function isAd(element) {
    const text = (element.textContent || '').toLowerCase();

    // Signal 1: "Ad ·" pattern in metadata area
    if (text.includes('ad ·') || text.includes('ad·')) return true;

    // Signal 2: aria-label containing "Ad"
    if (element.querySelector('[aria-label*="Ad"]')) return true;

    // Signal 3: ad-badge class
    if (element.querySelector('.ad-badge, [class*="ad-badge"], [class*="ad-container"]')) return true;

    // Signal 4: "Sponsored" text
    const spans = element.querySelectorAll('span');
    for (const span of spans) {
      const spanText = (span.textContent || '').trim().toLowerCase();
      if (spanText === 'ad' || spanText === 'sponsored') return true;
    }

    return false;
  }

  function extractHashtags(text) {
    const matches = text.match(/#[a-zA-Z0-9_]+/g);
    return matches ? matches.slice(0, 10) : [];
  }

  function detectContentType(element) {
    if (element.querySelector('[class*="reel"], [class*="short"]')) return 'short';
    return 'video';
  }

  // ── Capture logic ──────────────────────────────────────────

  function captureVideo(element) {
    const title = extractTitle(element);
    const key = title.substring(0, 80);
    if (CAPTURED.has(key) || title.length < 5) return;
    CAPTURED.add(key);

    const channel = extractChannel(element);
    const handle = extractHandle(element);
    const adDetected = isAd(element);
    position++;

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FEED_ITEM',
      data: {
        platform: 'YOUTUBE',
        position_in_feed: position,
        creator_handle: handle || channel,
        creator_display_name: channel,
        is_ad: adDetected,
        ad_label_text: adDetected ? 'Ad' : null,
        post_text: title,
        hashtags: extractHashtags(title),
        is_suggested: true,
        content_type: detectContentType(element),
        capture_timestamp: Date.now()
      }
    }));
  }

  function captureWithDelay(element) {
    setTimeout(() => captureVideo(element), 500);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) captureWithDelay(entry.target);
    });
  }, { threshold: 0.1 });

  function observeItems() {
    const selectors = [
      'ytm-rich-item-renderer',
      'ytm-video-with-context-renderer',
      'ytm-compact-video-renderer',
      'ytm-reel-item-renderer',
      '.media-item',
      '.compact-media-item',
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.__alg_observed) {
          el.__alg_observed = true;
          observer.observe(el);
        }
      });
    });
  }

  observeItems();
  const mutationObserver = new MutationObserver(() => {
    if (mutationDebounceTimer) return;
    mutationDebounceTimer = setTimeout(() => {
      mutationDebounceTimer = null;
      observeItems();
    }, 200);
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Scroll-based fallback: capture any visible item every 3 seconds
  setInterval(function() {
    const selectors = [
      'ytm-rich-item-renderer',
      'ytm-video-with-context-renderer',
      'ytm-compact-video-renderer',
      'ytm-reel-item-renderer',
      '.media-item',
      '.compact-media-item',
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          captureWithDelay(el);
        }
      });
    });
  }, 3000);

  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'SCANNER_READY',
    data: { platform: 'YOUTUBE', timestamp: Date.now() }
  }));

  true;
})();
`;
