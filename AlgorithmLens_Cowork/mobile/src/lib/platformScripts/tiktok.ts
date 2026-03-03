/**
 * TikTok feed capture script.
 * Injected into tiktok.com/foryou WebView.
 *
 * TikTok's For You page is entirely algorithmically curated — all content
 * is suggested. Ads show "Sponsored" label.
 *
 * Also hides TikTok's "Get the app" banners.
 */

export const TIKTOK_SCRIPT = `
(function() {
  'use strict';

  const CAPTURED = new Set();
  let position = 0;
  let mutationDebounceTimer = null;

  // ── Constrain fullscreen video layout ───────────────────────
  // TikTok videos are fullscreen by default. We need to constrain height
  // and disable the fullscreen API, but allow normal video playback and UI interaction.
  function injectVideoConstrainer() {
    const style = document.createElement('style');
    style.id = '__alg_video_constrainer';
    style.textContent = [
      // TikTok: Allow videos to use up to 85vh — closer to native experience
      // while still leaving room for the scan overlay at the bottom
      'video { max-height: 85vh !important; object-fit: contain !important; }',
      'video::-webkit-media-controls-fullscreen-button { display: none !important; }',

      // Constrain video containers to fit within viewport with overlay space
      '[class*="VideoContainer"], [class*="video-container"], [class*="FeedContainer"]' +
      '{ max-height: 85vh !important; overflow: hidden !important; }',

      // Allow vertical scrolling and normal touch interaction
      'video { touch-action: manipulation !important; }',
    ].join('\\n');
    document.head.appendChild(style);

    // Only block navigation away from the feed — allow all video interaction
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href*="/video/"]');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  injectVideoConstrainer();

  // ── Hide app-install banners ───────────────────────────────
  function suppressBanners() {
    document.querySelectorAll('[class*="banner"], [class*="download"]').forEach(el => {
      const text = (el.textContent || '').toLowerCase();
      if (text.includes('get the app') || text.includes('download') || text.includes('open in app')) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    // Hide fixed/sticky app-promotion elements
    document.querySelectorAll('div, a, section').forEach(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      if (
        (text === 'get the app' || text === 'open in app' || text === 'get app') &&
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

  // ── Extraction helpers ─────────────────────────────────────

  function extractHandle(element) {
    const links = element.querySelectorAll('a[href*="/@"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/@([a-zA-Z0-9_\\.]+)/);
      if (match) return match[1];
    }
    const text = element.textContent || '';
    const handleMatch = text.match(/@([a-zA-Z0-9_\\.]{2,30})/);
    return handleMatch ? handleMatch[1] : null;
  }

  function extractDisplayName(element) {
    // TikTok shows display names above or beside handles
    const nameEls = element.querySelectorAll('[class*="AuthorTitle"], [class*="author-name"], h3, h4');
    for (const el of nameEls) {
      const text = (el.textContent || '').trim();
      if (text.length > 0 && text.length < 50 && !text.startsWith('@')) return text;
    }
    return null;
  }

  function extractCaption(element) {
    const descEls = element.querySelectorAll('[data-e2e="video-desc"], .video-meta-caption, [class*="Description"]');
    for (const el of descEls) {
      const text = (el.textContent || '').trim();
      if (text.length > 5) return text.substring(0, 2000);
    }
    return (element.textContent || '').trim().substring(0, 500);
  }

  function isAd(element) {
    const text = (element.textContent || '').toLowerCase();
    if (text.includes('sponsored')) return true;
    if (text.includes('#ad ') || text.endsWith('#ad')) return true;
    if (element.querySelector('[data-e2e="video-ad-label"]')) return true;
    return false;
  }

  function extractHashtags(text) {
    const matches = text.match(/#[a-zA-Z0-9_]+/g);
    return matches ? matches.slice(0, 10) : [];
  }

  // ── Capture logic ──────────────────────────────────────────

  function captureVideo(element) {
    const caption = extractCaption(element);
    const key = caption.substring(0, 80) || element.innerHTML.substring(0, 80);
    if (CAPTURED.has(key)) return;
    CAPTURED.add(key);

    const handle = extractHandle(element);
    const displayName = extractDisplayName(element);
    const adDetected = isAd(element);
    position++;

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FEED_ITEM',
      data: {
        platform: 'TIKTOK',
        position_in_feed: position,
        creator_handle: handle,
        creator_display_name: displayName,
        is_ad: adDetected,
        ad_label_text: adDetected ? 'Sponsored' : null,
        post_text: caption,
        hashtags: extractHashtags(caption),
        is_suggested: true,
        content_type: 'video',
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
      '[data-e2e="recommend-list-item-container"]',
      '[class*="DivItemContainer"]',
      '[class*="VideoCard"]',
      '.video-feed-item',
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
      '[data-e2e="recommend-list-item-container"]',
      '[class*="DivItemContainer"]',
      '[class*="VideoCard"]',
      '.video-feed-item',
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
    data: { platform: 'TIKTOK', timestamp: Date.now() }
  }));

  true;
})();
`;
