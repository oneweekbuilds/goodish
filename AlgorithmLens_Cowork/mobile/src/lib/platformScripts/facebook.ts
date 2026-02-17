/**
 * Facebook feed capture script.
 * Injected into m.facebook.com WebView.
 *
 * Detection strategy:
 *   Ads — "Sponsored" label appearing as a standalone small text/link element
 *         near the post author. On mobile Facebook, this is often a plain <a>
 *         or <span> with just the word "Sponsored" directly after the timestamp.
 *   Suggested — "Suggested for you", "People you may know", "Recommended for you",
 *               "You might like" labels, or a "Follow" / "Add Friend" button
 *               indicating the user doesn't already follow this page/person.
 *
 * Also hides Facebook's "Use the app" banners.
 */

export const FACEBOOK_SCRIPT = `
(function() {
  'use strict';

  const CAPTURED = new Set();
  let position = 0;
  let mutationDebounceTimer = null;

  // ── Prevent Reels/Watch fullscreen takeover ────────────────
  function injectReelsBlocker() {
    const style = document.createElement('style');
    style.id = '__alg_reels_blocker';
    style.textContent = [
      // Hide the immersive Reels viewer/overlay
      '[class*="ReelsPlayer"], [class*="reels-player"], [class*="watch-video"],' +
      '[class*="WatchContainer"], [role="presentation"][style*="position: fixed"],' +
      'div[style*="position: fixed"][style*="z-index"][style*="inset: 0"]' +
      '{ display: none !important; visibility: hidden !important; }',

      // Prevent videos from going fullscreen
      'video { max-height: 400px !important; object-fit: cover !important; }',
      'video::-webkit-media-controls-fullscreen-button { display: none !important; }',

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

    // ONLY block navigation to Reels/Watch — allow normal interaction with videos and UI
    document.addEventListener('click', function(e) {
      // Block navigation to Reels and Watch sections
      var link = e.target.closest('a[href*="/reel/"], a[href*="/reels/"], a[href*="/watch/"]');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  injectReelsBlocker();

  // ── Hide app-install banners ───────────────────────────────
  function suppressBanners() {
    // Facebook mobile "Use the app" / "Open in app" banners
    document.querySelectorAll('[data-sigil*="MTopBlueBarOpen"], [data-sigil*="open_app"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    // Generic banner suppression
    document.querySelectorAll('div, a, section').forEach(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      if (
        (text === 'use the app' || text === 'open in app' || text === 'use the facebook app' || text === 'open') &&
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

    // Hide ALL fixed/sticky elements that block scrolling
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
            text.includes('download')
          ) {
            el.style.setProperty('display', 'none', 'important');
          }
        }
      }
    });

    // Hide bottom nav bar to avoid conflict with scan overlay
    // Target ALL nav elements near the bottom, not just those with role="navigation"
    document.querySelectorAll('nav, div[role="navigation"]').forEach(nav => {
      const rect = nav.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 120 && rect.height < 150) {
        nav.style.setProperty('display', 'none', 'important');
      }
    });
  }

  suppressBanners();
  setInterval(suppressBanners, 2000);

  // ── Extraction helpers ─────────────────────────────────────

  function extractCreator(element) {
    const headerLinks = element.querySelectorAll('a[href*="/profile.php"], a[href*="/pages/"], a[href*="/groups/"], h3 a, h4 a, [data-sigil="feed_story_ring"] + div a');
    for (const link of headerLinks) {
      const text = (link.textContent || '').trim();
      if (text.length > 1 && text.length < 80) return text;
    }
    const strong = element.querySelector('strong');
    if (strong) {
      const text = (strong.textContent || '').trim();
      if (text.length > 1 && text.length < 80) return text;
    }
    return null;
  }

  function extractHandle(element) {
    const links = element.querySelectorAll('a[href*="/profile.php"], a[href*="facebook.com/"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const usernameMatch = href.match(/facebook\\.com\\/([a-zA-Z0-9.]+)/);
      if (usernameMatch && !['pages', 'groups', 'events', 'watch', 'marketplace', 'stories', 'login', 'help'].includes(usernameMatch[1])) {
        return usernameMatch[1];
      }
    }
    return null;
  }

  function extractPostText(element) {
    const textSelectors = [
      '[data-sigil="expose"]',
      '[data-gt*="story_message"]',
      '.story_body_container',
      '[class*="userContent"]',
      'p',
    ];
    for (const sel of textSelectors) {
      const els = element.querySelectorAll(sel);
      for (const el of els) {
        const text = (el.textContent || '').trim();
        if (text.length > 10) return text.substring(0, 2000);
      }
    }
    return (element.textContent || '').trim().substring(0, 500);
  }

  function isAd(element) {
    const text = (element.textContent || '').toLowerCase();

    // Signal 1: Look for "Sponsored" as a standalone label element
    // On mobile Facebook, the Sponsored label is usually a small <a> or <span>
    // right after the post timestamp (e.g., "2h · Sponsored")
    if (text.includes('sponsored')) {
      // Check all small text elements for standalone "Sponsored"
      const smallEls = element.querySelectorAll('span, a, abbr');
      for (const el of smallEls) {
        const elText = (el.textContent || '').trim().toLowerCase();
        if (elText === 'sponsored') return true;
        // Also check for "Sponsored · " pattern (with separator)
        if (elText.startsWith('sponsored') && elText.length < 15) return true;
      }

      // Check for the specific Facebook ad-info link
      if (element.querySelector('a[href*="ads/about"]')) return true;
      if (element.querySelector('[data-sigil*="sponsor"]')) return true;
    }

    return false;
  }

  function isSuggested(element) {
    const text = (element.textContent || '').toLowerCase();

    // Signal 1: Explicit labels
    if (text.includes('suggested for you')) return true;
    if (text.includes('people you may know')) return true;
    if (text.includes('recommended for you')) return true;
    if (text.includes('you might like')) return true;
    if (text.includes('pages you may like')) return true;

    // Signal 2: "Follow" / "Like Page" button indicates the user
    // doesn't follow this page, so it's suggested content
    const buttons = element.querySelectorAll('button, a[role="button"]');
    for (const btn of buttons) {
      const btnText = (btn.textContent || '').trim().toLowerCase();
      if (btnText === 'follow' || btnText === 'like page' || btnText === 'like') {
        // Make sure it's in the post header area, not a comment action
        const rect = btn.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();
        if (rect.top - elRect.top < 100) return true;
      }
    }

    return false;
  }

  function detectContentType(element) {
    if (element.querySelector('video, [data-sigil*="video"]')) return 'video';
    if (element.querySelector('[data-sigil="photo-image"], img[src*="scontent"]')) return 'photo';
    if (element.querySelector('a[href*="/reel/"]')) return 'reel';
    return 'text';
  }

  function extractHashtags(text) {
    const matches = text.match(/#[a-zA-Z0-9_]+/g);
    return matches ? matches.slice(0, 10) : [];
  }

  // ── Capture logic ──────────────────────────────────────────

  function capturePost(element) {
    const postText = extractPostText(element);
    const key = postText.substring(0, 80) || element.innerHTML.substring(0, 80);
    if (CAPTURED.has(key)) return;
    CAPTURED.add(key);

    const creator = extractCreator(element);
    const handle = extractHandle(element);
    const adDetected = isAd(element);
    const suggestedDetected = isSuggested(element);
    position++;

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FEED_ITEM',
      data: {
        platform: 'FACEBOOK',
        position_in_feed: position,
        creator_handle: handle || creator,
        creator_display_name: creator,
        is_ad: adDetected,
        ad_label_text: adDetected ? 'Sponsored' : null,
        post_text: postText,
        hashtags: extractHashtags(postText),
        is_suggested: suggestedDetected,
        content_type: detectContentType(element),
        capture_timestamp: Date.now()
      }
    }));
  }

  function captureWithDelay(element) {
    setTimeout(() => capturePost(element), 500);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) captureWithDelay(entry.target);
    });
  }, { threshold: 0.1 });

  function observeItems() {
    const selectors = [
      '[data-sigil="feed_story_ring"]',
      'article[data-ft]',
      '[data-sigil*="story"]',
      '.story_body_container',
      '[role="article"]',
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
      '[data-sigil="feed_story_ring"]',
      'article[data-ft]',
      '[data-sigil*="story"]',
      '.story_body_container',
      '[role="article"]',
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
    data: { platform: 'FACEBOOK', timestamp: Date.now() }
  }));

  true;
})();
`;
