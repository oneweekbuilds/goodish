/**
 * Instagram feed capture script.
 * Injected into instagram.com WebView.
 *
 * Detection strategy:
 *   Ads — Multiple signals checked after 800ms delay:
 *     1. Standalone "Sponsored" label in a span/div
 *     2. "Paid partnership" text
 *     3. aria-label attributes containing "Sponsored"
 *     4. "About this ad" / "Why am I seeing this?" links
 *     5. Ad disclaimer icon (ⓘ) near creator name
 *   Suggested — Position-aware detection:
 *     1. Articles below the "Suggested Posts" divider (Y-position tracked)
 *     2. "Follow" button in article header (with cross-check)
 *     3. Explicit text labels like "Suggested for you"
 *
 * Also hides Instagram's banners AND prevents Reels fullscreen takeover.
 */

export const INSTAGRAM_SCRIPT = `
(function() {
  'use strict';

  const CAPTURED = new Set();
  let position = 0;
  let suggestedDividerY = -1; // Y-position of the divider, -1 = not found yet
  let mutationDebounceTimer = null;
  let bannerCallCount = 0;

  // ── Prevent Reels/Video fullscreen takeover ────────────────
  // This is CRITICAL. Instagram's mobile web tries to open an immersive
  // Reels viewer when a video post scrolls into view. We block this by:
  // 1. Injecting CSS that prevents the Reels overlay from showing
  // 2. Disabling the fullscreen API
  // 3. Blocking ONLY navigation to /reel/ or /reels/ pages
  // Users can still tap videos and interact normally.
  function injectReelsBlocker() {
    const style = document.createElement('style');
    style.id = '__alg_reels_blocker';
    style.textContent = [
      // Hide the immersive Reels viewer/overlay
      '[class*="RMediaFooter"], [class*="ReelsMedia"], [class*="reels-media"],' +
      '[class*="reels-viewer"], [class*="ReelsViewer"], [class*="ImmersiveViewer"],' +
      '[data-pagelet*="Reel"], [role="presentation"][style*="position: fixed"],' +
      'div[style*="position: fixed"][style*="z-index"][style*="inset: 0"]' +
      '{ display: none !important; visibility: hidden !important; }',

      // Prevent videos from going fullscreen
      'video { max-height: 400px !important; object-fit: cover !important; }',
      'video::-webkit-media-controls-fullscreen-button { display: none !important; }',

      // Hide the Reels tab/navigation takeover
      '[aria-label="Reels"] { pointer-events: none !important; }',

      // Keep feed items from expanding into immersive view
      'article { position: relative !important; }',

      // Allow vertical scrolling over videos but block tap/horizontal gestures
      'article video { touch-action: pan-y !important; }',
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
    if (Element.prototype.webkitEnterFullscreen) {
      Element.prototype.webkitEnterFullscreen = noop;
    }
    if (HTMLVideoElement.prototype.webkitEnterFullscreen) {
      HTMLVideoElement.prototype.webkitEnterFullscreen = noop;
    }

    // ONLY block navigation to /reel/ or /reels/ pages — DO NOT block video interactions
    document.addEventListener('click', function(e) {
      // Only block reel/reels navigation links — let everything else through
      var link = e.target.closest('a[href*="/reel/"], a[href*="/reels/"]');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  injectReelsBlocker();

  // ── Hide app-install and login banners ─────────────────────
  function suppressBanners() {
    bannerCallCount++;
    const selectors = [
      '[class*="app-banner"]',
      '[class*="AppBanner"]',
      '[class*="smartBanner"]',
      '[data-testid="open-in-app-button"]',
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    });

    // Hide ALL fixed/sticky elements in the bottom 100px that have login/app text
    document.querySelectorAll('div, section, nav, a, footer').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        const rect = el.getBoundingClientRect();
        const viewH = window.innerHeight;
        // If it's near the bottom of the screen
        if (rect.bottom > viewH - 120 && rect.height < 100) {
          const text = (el.textContent || '').toLowerCase();
          if (
            text.includes('use the app') ||
            text.includes('open in app') ||
            text.includes('get the app') ||
            text.includes('log in') ||
            text.includes('sign up')
          ) {
            el.style.setProperty('display', 'none', 'important');
          }
        }
      }
    });

    // Also hide Instagram's bottom nav bar to avoid conflict with scan overlay
    // Target ALL nav elements near the bottom, not just those with role="navigation"
    document.querySelectorAll('nav, div[role="navigation"]').forEach(nav => {
      const rect = nav.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 120 && rect.height < 150) {
        nav.style.setProperty('display', 'none', 'important');
      }
    });
  }

  // Run banner suppression immediately, frequently for first 10s, then slower (H5)
  suppressBanners();
  const bannerInterval = setInterval(function() {
    suppressBanners();
    // After 10 seconds (5 calls at 2s), slow down to every 5s
    if (bannerCallCount >= 5) {
      clearInterval(bannerInterval);
      setInterval(suppressBanners, 5000);
    }
  }, 2000);

  // ── Watch for the "Suggested Posts" divider (position-aware) ──
  function checkForSuggestedDivider() {
    if (suggestedDividerY >= 0) return; // Already found
    const allElements = document.querySelectorAll('div, span, h2, h3');
    for (const el of allElements) {
      const text = (el.textContent || '').trim().toLowerCase();
      if (
        text === 'suggested posts' ||
        text === 'suggested for you' ||
        text === 'more posts from instagram'
      ) {
        // Verify it's a standalone divider, not inside an article
        if (!el.closest('article')) {
          const rect = el.getBoundingClientRect();
          // Store the absolute Y position (scroll + viewport)
          suggestedDividerY = rect.top + window.scrollY;
          break;
        }
      }
    }
  }

  setInterval(checkForSuggestedDivider, 1500);

  // ── Extraction helpers ─────────────────────────────────────

  function extractHandle(article) {
    const headerLinks = article.querySelectorAll('a[href^="/"]');
    for (const link of headerLinks) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/^\\/([a-zA-Z0-9_\\.]+)\\/?$/);
      if (match) {
        const handle = match[1];
        const reserved = ['explore', 'p', 'reel', 'reels', 'stories', 'accounts', 'direct', 'about'];
        if (!reserved.includes(handle)) return handle;
      }
    }
    const text = article.textContent || '';
    const handleMatch = text.match(/@([a-zA-Z0-9_\\.]{2,30})/);
    return handleMatch ? handleMatch[1] : null;
  }

  function extractDisplayName(article) {
    const headerLinks = article.querySelectorAll('header a, a[href^="/"]');
    for (const link of headerLinks) {
      const href = link.getAttribute('href') || '';
      if (/^\\/[a-zA-Z0-9_\\.]+\\/?$/.test(href)) {
        const text = (link.textContent || '').trim();
        if (text.length > 0 && text.length < 60) return text;
      }
    }
    return null;
  }

  function extractCaption(article) {
    const captionEls = article.querySelectorAll('div[dir="auto"], span[dir="auto"]');
    let longestText = '';
    captionEls.forEach(el => {
      const text = (el.textContent || '').trim();
      if (text.length > longestText.length && text.length > 5) longestText = text;
    });
    return longestText.substring(0, 2000);
  }

  // ── Ad detection (C4 — broadened signals) ───────────────────

  function isAd(article) {
    const text = (article.textContent || '').toLowerCase();

    // Signal 1: Standalone "Sponsored" label
    if (text.includes('sponsored')) {
      const spans = article.querySelectorAll('span, a, div, li');
      for (const span of spans) {
        const spanText = (span.textContent || '').trim().toLowerCase();
        if (spanText === 'sponsored' && span.offsetHeight > 0 && span.offsetHeight < 30) return true;
      }
    }

    // Signal 2: "Paid partnership"
    if (text.includes('paid partnership')) return true;

    // Signal 3: aria-label / data-testid attributes
    if (article.querySelector(
      '[data-testid*="ad"], [data-testid*="sponsor"],' +
      '[aria-label*="Sponsored"], [aria-label*="sponsored"],' +
      '[aria-label*="Ad "], [aria-label*="advertisement"]'
    )) return true;

    // Signal 4: "About this ad" / "Why am I seeing this?" links (ad disclaimer)
    const links = article.querySelectorAll('a, span, button');
    for (const link of links) {
      const lt = (link.textContent || '').trim().toLowerCase();
      if (
        lt === 'about this ad' ||
        lt === 'why am i seeing this?' ||
        lt === 'why am i seeing this ad?' ||
        lt === 'hide ad'
      ) return true;
    }

    // Signal 5: Ad info icon (ⓘ) near the top of the article
    const headerArea = article.querySelector('header') || article;
    const headerText = (headerArea.textContent || '').substring(0, 200).toLowerCase();
    if (headerText.includes('ⓘ') || headerText.includes('\\u24d8')) return true;

    // Signal 6: Check for "Sponsored" in a very small element (Instagram sometimes
    // renders it in tiny text that's hard to select individually)
    const allSmall = article.querySelectorAll('span, div');
    for (const el of allSmall) {
      if (el.children.length === 0) { // leaf elements only
        const t = (el.textContent || '').trim();
        if (t.toLowerCase() === 'sponsored' && el.offsetWidth > 0) return true;
      }
    }

    return false;
  }

  function getAdLabel(article) {
    const text = (article.textContent || '').toLowerCase();
    if (text.includes('paid partnership')) return 'Paid partnership';
    if (text.includes('sponsored')) return 'Sponsored';
    return 'Ad detected';
  }

  // ── Suggested content detection (H3 — position-aware) ──────

  function isSuggested(article) {
    // Signal 1: Article is BELOW the suggested divider (position-aware)
    if (suggestedDividerY >= 0) {
      const rect = article.getBoundingClientRect();
      const articleAbsY = rect.top + window.scrollY;
      if (articleAbsY > suggestedDividerY) return true;
    }

    // Signal 2: Article header has a "Follow" button in the header area
    const buttons = article.querySelectorAll('button, a[role="button"], div[role="button"]');
    let hasFollowButton = false;
    for (const btn of buttons) {
      const btnText = (btn.textContent || '').trim().toLowerCase();
      if (btnText === 'follow') {
        const rect = btn.getBoundingClientRect();
        const articleRect = article.getBoundingClientRect();
        if (rect.top - articleRect.top < 120) {
          hasFollowButton = true;
          break;
        }
      }
    }

    // Signal 3: Explicit text labels
    const text = (article.textContent || '').toLowerCase();
    const hasExplicitLabel = (
      text.includes('suggested for you') ||
      text.includes('based on your activity') ||
      text.includes('based on posts you') ||
      text.includes('recommended for you')
    );

    // If we have an explicit label, it's definitely suggested
    if (hasExplicitLabel) return true;

    // Follow button alone is a strong signal but not definitive
    // Only count it if we haven't found the divider yet (before divider = uncertain)
    if (hasFollowButton && suggestedDividerY < 0) return true;

    return false;
  }

  function extractHashtags(text) {
    const matches = text.match(/#[a-zA-Z0-9_]+/g);
    return matches ? matches.slice(0, 10) : [];
  }

  function detectContentType(article) {
    if (article.querySelector('video')) return 'reel';
    const imgs = article.querySelectorAll('img[src*="scontent"]');
    if (imgs.length > 1) return 'carousel';
    return 'photo';
  }

  // ── Capture logic ──────────────────────────────────────────

  function captureArticle(article) {
    const caption = extractCaption(article);
    const handle = extractHandle(article);
    // Improved dedup: use handle + caption + position (H8)
    const key = (handle || '') + '::' + (caption.substring(0, 80) || article.innerHTML.substring(0, 60));
    if (CAPTURED.has(key)) return;
    // Still require either caption or media
    if (!caption && !article.querySelector('img, video')) return;
    CAPTURED.add(key);

    const displayName = extractDisplayName(article);
    const adDetected = isAd(article);
    const suggestedDetected = isSuggested(article);
    position++;

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FEED_ITEM',
      data: {
        platform: 'INSTAGRAM',
        position_in_feed: position,
        creator_handle: handle,
        creator_display_name: displayName,
        is_ad: adDetected,
        ad_label_text: adDetected ? getAdLabel(article) : null,
        post_text: caption,
        hashtags: extractHashtags(caption),
        is_suggested: suggestedDetected,
        content_type: detectContentType(article),
        capture_timestamp: Date.now()
      }
    }));
  }

  // Increased delay from 300ms to 800ms for lazy-loaded ad labels (C4)
  function captureWithDelay(article) {
    setTimeout(() => captureArticle(article), 800);
  }

  // ── Observers (H2 — lowered threshold + scroll fallback) ───

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.tagName === 'ARTICLE') {
        captureWithDelay(entry.target);
      }
    });
  }, { threshold: 0.1 }); // Lowered from 0.3 to 0.1

  // Observe existing articles
  document.querySelectorAll('article').forEach(a => {
    a.__alg_observed = true;
    observer.observe(a);
  });

  // Watch for new articles — debounced MutationObserver (H5)
  const mutationObserver = new MutationObserver(() => {
    if (mutationDebounceTimer) return;
    mutationDebounceTimer = setTimeout(() => {
      mutationDebounceTimer = null;
      checkForSuggestedDivider();
      document.querySelectorAll('article').forEach(a => {
        if (!a.__alg_observed) {
          a.__alg_observed = true;
          observer.observe(a);
        }
      });
    }, 200);
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Scroll-based fallback: capture any visible article every 3 seconds (H2)
  setInterval(function() {
    document.querySelectorAll('article').forEach(a => {
      const rect = a.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        captureWithDelay(a);
      }
    });
  }, 3000);

  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'SCANNER_READY',
    data: { platform: 'INSTAGRAM', timestamp: Date.now() }
  }));

  true;
})();
`;
