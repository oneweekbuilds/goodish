/**
 * Reddit feed capture script.
 * Injected into reddit.com WebView.
 *
 * Detection strategy:
 *   Ads — "Promoted" label badge on posts.
 *   Suggested — Reddit shows recommendation labels for non-subscribed content:
 *     - "Because you've shown interest in..."
 *     - "Similar to..."
 *     - "Recommended for you"
 *     - "Popular near you"
 *     - Posts from subreddits with a "Join" button (user hasn't joined)
 *     - On the "Home" feed, Reddit also defaults to the "Best" sort which
 *       mixes subscribed and recommended content.
 *
 * Also hides Reddit's "Open in app" / "Use app" banners.
 */

export const REDDIT_SCRIPT = `
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

      // Hide only the modal overlay, not inline video
      '[class*="MediaModal"] { display: none !important; visibility: hidden !important; }',
    ].join('\\n');
    document.head.appendChild(style);

    // No click blocking needed — Reddit videos play inline
  }

  injectVideoBlocker();

  // ── Hide app-install banners ───────────────────────────────
  function suppressBanners() {
    // Reddit's "Open in app" / "Use app" banner
    const selectors = [
      '[class*="XPromoPopup"]',
      '[class*="xpromo"]',
      '[data-testid="xpromo-banner"]',
      '.XPromoNativeSmall',
      '.XPromoNativeLarge',
      '[class*="bottom-bar"]',
      '#xpromo-header-banner',
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
    });

    // Also hide "Get the Reddit app" / "Open in app" text-based banners
    document.querySelectorAll('a, button, div').forEach(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      if (
        (text === 'open in app' || text === 'get the app' || text === 'use app' || text === 'continue in app') &&
        el.offsetHeight > 0 && el.offsetHeight < 80
      ) {
        let parent = el.parentElement;
        for (let i = 0; i < 6 && parent; i++) {
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
            text.includes('open in app') ||
            text.includes('get the app') ||
            text.includes('use app') ||
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
  setTimeout(suppressBanners, 1000);
  setTimeout(suppressBanners, 3000);
  setTimeout(suppressBanners, 6000);
  var bannerObserver = new MutationObserver(function() { suppressBanners(); });
  setTimeout(function() { bannerObserver.observe(document.body, { childList: true, subtree: true }); }, 6000);

  // ── Extraction helpers ─────────────────────────────────────

  function extractSubreddit(element) {
    const links = element.querySelectorAll('a[href*="/r/"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\\/r\\/([a-zA-Z0-9_]+)/);
      if (match) return match[1];
    }
    const text = element.textContent || '';
    const textMatch = text.match(/r\\/([a-zA-Z0-9_]+)/);
    return textMatch ? textMatch[1] : null;
  }

  function extractAuthor(element) {
    const links = element.querySelectorAll('a[href*="/user/"], a[href*="/u/"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\\/(?:user|u)\\/([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
    }
    return null;
  }

  function extractTitle(element) {
    const titleEls = element.querySelectorAll('h3, [slot="title"], [data-click-id="title"], a[data-click-id="body"]');
    for (const el of titleEls) {
      const text = (el.textContent || '').trim();
      if (text.length > 5) return text.substring(0, 500);
    }
    return null;
  }

  function extractPostText(element) {
    const title = extractTitle(element);
    const bodyEls = element.querySelectorAll('[data-click-id="text"], .RichTextJSON-root, [slot="text-body"]');
    let body = '';
    for (const el of bodyEls) {
      const text = (el.textContent || '').trim();
      if (text.length > 5) { body = text.substring(0, 1500); break; }
    }
    if (title && body) return title + '\\n' + body;
    if (title) return title;
    return (element.textContent || '').trim().substring(0, 500);
  }

  function isAd(element) {
    // Check for "Promoted" badge/label
    const promoEls = element.querySelectorAll('span, [data-click-id="promoted"]');
    for (const el of promoEls) {
      const elText = (el.textContent || '').trim().toLowerCase();
      if (elText === 'promoted') return true;
    }
    if (element.querySelector('[data-click-id="promoted"]')) return true;

    // Check for ad-related attributes on the element itself
    const tagName = (element.tagName || '').toLowerCase();
    if (tagName === 'shreddit-post' && element.getAttribute('is-promoted') !== null) return true;

    return false;
  }

  function isSuggested(element) {
    const text = (element.textContent || '').toLowerCase();

    // Signal 1: Explicit recommendation labels
    if (text.includes("because you've shown interest")) return true;
    if (text.includes('similar to')) return true;
    if (text.includes('recommended for you')) return true;
    if (text.includes('popular near you')) return true;
    if (text.includes('trending today')) return true;
    if (text.includes('you might like')) return true;
    if (text.includes('because you follow')) return true;

    // Signal 2: Check for "Join" button on the subreddit
    // If the subreddit shows a Join button, the user hasn't joined it,
    // so this post is being recommended by the algorithm.
    const buttons = element.querySelectorAll('button');
    for (const btn of buttons) {
      const btnText = (btn.textContent || '').trim().toLowerCase();
      if (btnText === 'join') return true;
    }

    return false;
  }

  function detectContentType(element) {
    if (element.querySelector('video, [data-click-id="media"] video')) return 'video';
    if (element.querySelector('img[src*="preview.redd.it"], [data-click-id="media"] img')) return 'image';
    if (element.querySelector('a[href*="gallery"]')) return 'gallery';
    if (element.querySelector('[data-click-id="text"]')) return 'text';
    return 'link';
  }

  function extractFlairs(element) {
    const flairs = [];
    element.querySelectorAll('[class*="flair"], [class*="Flair"]').forEach(el => {
      const text = (el.textContent || '').trim();
      if (text.length > 0 && text.length < 50) flairs.push(text);
    });
    return flairs;
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

    const subreddit = extractSubreddit(element);
    const author = extractAuthor(element);
    const adDetected = isAd(element);
    const suggestedDetected = isSuggested(element);
    position++;

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FEED_ITEM',
      data: {
        platform: 'REDDIT',
        position_in_feed: position,
        creator_handle: author ? 'u/' + author : null,
        creator_display_name: subreddit ? 'r/' + subreddit : null,
        is_ad: adDetected,
        ad_label_text: adDetected ? 'Promoted' : null,
        post_text: postText,
        hashtags: extractHashtags(postText),
        is_suggested: suggestedDetected,
        content_type: detectContentType(element),
        capture_timestamp: Date.now(),
        metadata: {
          subreddit: subreddit,
          flairs: extractFlairs(element)
        }
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
      'shreddit-post',
      '[data-testid="post-container"]',
      '.Post',
      'article',
      '[data-click-id="body"]',
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
      'shreddit-post',
      '[data-testid="post-container"]',
      '.Post',
      'article',
      '[data-click-id="body"]',
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
    data: { platform: 'REDDIT', timestamp: Date.now() }
  }));

  true;
})();
`;
