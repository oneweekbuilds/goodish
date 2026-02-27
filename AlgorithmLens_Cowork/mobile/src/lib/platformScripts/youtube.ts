/**
 * YouTube feed capture script.
 * Injected into m.youtube.com WebView.
 *
 * YouTube's home feed is algorithmically curated. Ads show "Ad ·" label,
 * "Sponsored" text, or ad badge. Subscription status is detected via the
 * "Subscribed" button state on each video/short.
 *
 * Also hides YouTube's "Get the app" / "Open in app" banners.
 *
 * Fixes applied (from MOBILE_VISUAL_AUDIT):
 * - H-05/A-04/A-07: Improved capture pipeline — lower threshold, faster capture, more selectors
 * - H-06/A-01: Comprehensive ad detection for YouTube's 2024-2026 ad formats
 * - H-07/A-02: Subscription-aware is_suggested instead of hardcoded true
 * - M-09: Reduced capture delay and increased fallback frequency to prevent counter freeze
 * - M-15/A-05: Improved content type detection for Shorts vs. regular video
 *
 * Pipeline fix (SCAN_PIPELINE_FIX):
 * - H-01: Fixed @Unknown — expanded channel extraction selectors for Shorts vertical player,
 *         YouTube 2025-2026 mobile DOM, aria-label fallback with channel name parsing
 * - C-03: Fixed 0% ads — added Shorts ad overlay detection, removed premature Shorts tab
 *         auto-navigation so home feed ads are captured first
 * - H-03: Fixed 100% suggested — detect /feed/subscriptions URL, extract subscription
 *         shelf signals, fallback to null instead of always "suggested"
 */

export const YOUTUBE_SCRIPT = `
(function() {
  'use strict';

  const CAPTURED = new Set();
  let position = 0;
  let mutationDebounceTimer = null;

  // ── Shorts-friendly style injection ────────────────────────
  // We no longer block Shorts navigation or hide the Shorts player,
  // because the user needs to scroll through Shorts to capture them.
  // We only hide the fullscreen button to prevent leaving the WebView context.
  function injectShortsStyleFixes() {
    const style = document.createElement('style');
    style.id = '__alg_shorts_style';
    style.textContent = [
      // Hide fullscreen button only — don't block Shorts player
      'video::-webkit-media-controls-fullscreen-button { display: none !important; }',
      // L-13 FIX: Hide YouTube top bar and bottom pivot bar during scan
      'ytm-mobile-topbar-renderer { display: none !important; }',
      'ytm-pivot-bar-renderer { display: none !important; }',
    ].join('\\n');
    document.head.appendChild(style);
  }

  injectShortsStyleFixes();

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
  setTimeout(suppressBanners, 1000);
  setTimeout(suppressBanners, 3000);
  setTimeout(suppressBanners, 6000);
  var bannerObserver = new MutationObserver(function() { suppressBanners(); });
  setTimeout(function() { bannerObserver.observe(document.body, { childList: true, subtree: true }); }, 6000);

  // ── Shared selectors for feed items ─────────────────────────
  var FEED_SELECTORS = [
    'ytm-rich-item-renderer',
    'ytm-video-with-context-renderer',
    'ytm-compact-video-renderer',
    'ytm-reel-item-renderer',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
    'ytm-media-item',
    '[is-shorts]',
    '.media-item',
    '.compact-media-item',
    '.shortsLockupViewModelHostOutsideMetadata',
    '.reel-item-endpoint',
    // Shorts-specific selectors for full-screen vertical player
    'ytm-reel-video-renderer',
    '#shorts-container .reel-video-in-sequence',
    'ytm-shorts-player-renderer',
    '.shorts-video-cell',
  ];

  // ── Extraction helpers ─────────────────────────────────────

  // PIPELINE FIX H-01: Expanded channel extraction with many more selectors
  // to cover Shorts vertical player, YouTube 2025-2026 mobile layouts,
  // and aria-label fallback with channel name parsing.
  function extractChannel(element) {
    // 1. YouTube shows channel name in link elements (regular videos)
    var channelLinks = element.querySelectorAll('a[href*="/channel/"], a[href*="/@"], a[href*="/c/"]');
    for (var i = 0; i < channelLinks.length; i++) {
      var text = (channelLinks[i].textContent || '').trim();
      if (text.length > 0 && text.length < 80) return text;
    }

    // 2. Byline areas — expanded selectors for 2025-2026 YouTube mobile DOM
    var bylineSelectors = [
      '.ytm-channel-name',
      '.slim-owner-icon-and-title a',
      '[class*="channel-name"]',
      // Shorts vertical player channel info
      'ytm-reel-channel-bar-renderer .channel-name',
      'ytm-reel-channel-bar-renderer a',
      '.reel-player-overlay-channel-info a',
      '.reel-player-overlay-channel-info span',
      '.channel-info-container a',
      '.channel-info-container span',
      // Shorts lockup metadata
      '.shortsLockupViewModelHostOutsideMetadata a',
      '.shortsLockupViewModelHostOutsideMetadata span[class*="channel"]',
      // Compact/media item bylines
      '.media-item-byline a',
      '.compact-media-item-byline a',
      '.media-item-byline span',
      '.compact-media-item-byline span',
      // Badge area near channel name
      '.badge-and-byline-item-byline a',
      '.badge-and-byline-renderer a',
      // YouTube 2025 renderer patterns
      'ytm-badge-and-byline-renderer a',
      'ytm-badge-and-byline-renderer span:first-child',
      // Owner text in video renderers
      '.slim-owner a',
      '.slim-owner span',
      '#channel-name',
      '#channel-name a',
      '#owner-name a',
      '#text a[href*="/@"]',
      '#text a[href*="/channel/"]',
    ];

    var bylines = element.querySelectorAll(bylineSelectors.join(', '));
    for (var j = 0; j < bylines.length; j++) {
      var bylineText = (bylines[j].textContent || '').trim();
      // Filter out non-channel text (view counts, dates, etc.)
      if (bylineText.length > 0 && bylineText.length < 80 &&
          !bylineText.match(/^[0-9]/) && // Skip "123K views"
          !bylineText.match(/ago$/i) && // Skip "2 hours ago"
          !bylineText.match(/^(subscribe|subscribed)$/i) && // Skip button text
          bylineText !== 'Ad' && bylineText !== 'Sponsored') {
        return bylineText;
      }
    }

    // 3. Shorts player overlay — look for channel name near avatar
    var overlayChannels = element.querySelectorAll(
      '.reel-player-header a, .reel-player-header span, ' +
      '.overlay-text-item a, .overlay-text-item span, ' +
      'ytm-reel-player-overlay-renderer a, ytm-reel-player-overlay-renderer span'
    );
    for (var k = 0; k < overlayChannels.length; k++) {
      var overlayText = (overlayChannels[k].textContent || '').trim();
      if (overlayText.length > 0 && overlayText.length < 80 &&
          overlayText !== 'Subscribe' && overlayText !== 'Subscribed' &&
          !overlayText.match(/^[0-9]/)) {
        // Check if it links to a channel
        var href = overlayChannels[k].getAttribute('href') || '';
        if (href.includes('/@') || href.includes('/channel/') || href.includes('/c/')) {
          return overlayText;
        }
      }
    }

    // 4. aria-label parsing fallback — YouTube often puts "Title - Channel - Duration" in aria-label
    var ariaLabel = element.getAttribute('aria-label') || '';
    if (!ariaLabel) {
      var ariaEl = element.querySelector('a[aria-label], [aria-label]');
      if (ariaEl) ariaLabel = ariaEl.getAttribute('aria-label') || '';
    }
    if (ariaLabel && ariaLabel.includes(' - ')) {
      var parts = ariaLabel.split(' - ');
      // YouTube pattern: "Video Title - Channel Name - Duration - Views"
      // Channel name is typically the 2nd part
      if (parts.length >= 3) {
        var candidateChannel = parts[1].trim();
        // Validate: channel names don't start with numbers or time patterns
        if (candidateChannel.length > 0 && candidateChannel.length < 80 &&
            !candidateChannel.match(/^[0-9]/) &&
            !candidateChannel.match(/^\\d+:\\d+/)) {
          return candidateChannel;
        }
      }
    }

    // 5. Look for any text element that links to a channel page
    var allLinks = element.querySelectorAll('a[href]');
    for (var m = 0; m < allLinks.length; m++) {
      var linkHref = allLinks[m].getAttribute('href') || '';
      if ((linkHref.includes('/@') || linkHref.includes('/channel/') || linkHref.includes('/c/')) &&
          !linkHref.includes('/feed/') && !linkHref.includes('/playlist')) {
        var linkText = (allLinks[m].textContent || '').trim();
        if (linkText.length > 0 && linkText.length < 80 &&
            linkText !== 'Subscribe' && linkText !== 'Subscribed') {
          return linkText;
        }
      }
    }

    return null;
  }

  function extractHandle(element) {
    // 1. Standard @handle links
    var links = element.querySelectorAll('a[href*="/@"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var match = href.match(/@([a-zA-Z0-9_.-]+)/);
      if (match && match[1]) return match[1];
    }

    // 2. Shorts player overlay links
    var overlayLinks = element.querySelectorAll(
      '.reel-player-overlay-channel-info a[href*="/@"], ' +
      'ytm-reel-channel-bar-renderer a[href*="/@"], ' +
      '.channel-info-container a[href*="/@"], ' +
      'ytm-reel-player-overlay-renderer a[href*="/@"]'
    );
    for (var j = 0; j < overlayLinks.length; j++) {
      var ovHref = overlayLinks[j].getAttribute('href') || '';
      var ovMatch = ovHref.match(/@([a-zA-Z0-9_.-]+)/);
      if (ovMatch && ovMatch[1]) return ovMatch[1];
    }

    // 3. Channel ID fallback — extract from /channel/ URLs
    var channelLinks = element.querySelectorAll('a[href*="/channel/"]');
    for (var k = 0; k < channelLinks.length; k++) {
      var chHref = channelLinks[k].getAttribute('href') || '';
      var chMatch = chHref.match(/\\/channel\\/([a-zA-Z0-9_-]+)/);
      if (chMatch && chMatch[1]) return chMatch[1];
    }

    return null;
  }

  function extractTitle(element) {
    // Check aria-label first (Shorts lockups use this)
    var ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.length > 3) return ariaLabel.trim().substring(0, 500);

    // Check child elements for title text
    var titleEl = element.querySelector('h3, .media-item-headline, .compact-media-item-headline');
    if (titleEl) return (titleEl.textContent || '').trim().substring(0, 500);

    // Check links with aria-label (common in Shorts grids)
    var ariaLink = element.querySelector('a[aria-label]');
    if (ariaLink) {
      var linkLabel = ariaLink.getAttribute('aria-label');
      if (linkLabel && linkLabel.length > 3) return linkLabel.trim().substring(0, 500);
    }

    // Check any element with aria-label
    var anyAria = element.querySelector('[aria-label]');
    if (anyAria) {
      var anyLabel = anyAria.getAttribute('aria-label');
      if (anyLabel && anyLabel.length > 3) return anyLabel.trim().substring(0, 500);
    }

    return (element.textContent || '').trim().substring(0, 300);
  }

  // ── Ad detection (H-06, A-01, C-03 PIPELINE FIX) ──────────
  // PIPELINE FIX C-03: Added Shorts ad overlay detection and
  // "Includes paid promotion" label detection.
  function isAd(element) {
    var text = (element.textContent || '').toLowerCase();

    // Signal 1: "Ad ·" pattern in metadata area
    if (text.includes('ad \\u00b7') || text.includes('ad\\u00b7') || text.includes('ad ·') || text.includes('ad·')) return true;

    // Signal 2: Sponsored text anywhere in the element
    if (text.includes('sponsored')) return true;

    // Signal 3: "Includes paid promotion" label (creator sponsorship)
    if (text.includes('includes paid promotion') || text.includes('paid promotion')) return true;

    // Signal 4: YouTube ad renderers (element itself or children)
    if (element.matches && element.matches('ytm-promoted-sparkles-web-renderer, ytm-promoted-video-renderer, [class*="promoted"]')) return true;
    if (element.querySelector('ytm-promoted-sparkles-web-renderer, ytm-promoted-video-renderer, [class*="promoted"]')) return true;

    // Signal 5: aria-label check (case-insensitive)
    var allAria = element.querySelectorAll('[aria-label]');
    for (var i = 0; i < allAria.length; i++) {
      var label = (allAria[i].getAttribute('aria-label') || '').toLowerCase();
      if (label.includes(' ad ') || label.startsWith('ad ') || label === 'ad' || label.includes('sponsored') || label.includes('promoted')) return true;
    }

    // Signal 6: ad-badge or ad-container classes
    if (element.querySelector('.ad-badge, [class*="ad-badge"], [class*="ad-container"], [class*="sparkles-light-cta"]')) return true;

    // Signal 7: "Ad" as standalone text in small elements (spans, divs)
    var spans = element.querySelectorAll('span, div');
    for (var j = 0; j < spans.length; j++) {
      var spanText = (spans[j].textContent || '').trim();
      if (spanText === 'Ad' || spanText === 'Sponsored' || spanText === 'AD' || spanText === 'Promoted') return true;
    }

    // Signal 8: Data attributes used by YouTube for ad content
    if (element.querySelector('[data-ad], [data-ad-slot], [is-ad]')) return true;

    // Signal 9: Check parent elements — YouTube sometimes wraps ad content
    var parent = element.parentElement;
    for (var p = 0; p < 3 && parent; p++) {
      if (parent.matches && parent.matches('ytm-promoted-sparkles-web-renderer, ytm-promoted-video-renderer, [class*="promoted"]')) return true;
      if (parent.querySelector && parent.querySelector('[class*="sparkles-light-cta"], [class*="ad-badge"]')) return true;
      parent = parent.parentElement;
    }

    // Signal 10 (PIPELINE FIX C-03): Shorts ad indicators
    // YouTube Shorts ads show "Sponsored" or "Ad" as overlay text
    if (element.querySelector('[class*="shorts-ad"], [class*="reel-ad"], .ad-overlay, .sponsored-overlay')) return true;
    var overlayTexts = element.querySelectorAll('.reel-player-overlay-renderer span, .overlay-text span, ytm-reel-player-overlay-renderer span');
    for (var ot = 0; ot < overlayTexts.length; ot++) {
      var ovText = (overlayTexts[ot].textContent || '').trim();
      if (ovText === 'Ad' || ovText === 'Sponsored' || ovText === 'AD') return true;
    }

    // Signal 11: "Shop" or product placement indicators
    if (text.includes('shop now') || text.includes('learn more') && element.querySelector('[class*="cta"], [class*="action-button"]')) return true;

    // Signal 12: Visit advertiser link
    if (element.querySelector('a[href*="googleadservices"], a[href*="doubleclick"]')) return true;

    return false;
  }

  function extractHashtags(text) {
    var matches = text.match(/#[a-zA-Z0-9_]+/g);
    return matches ? matches.slice(0, 10) : [];
  }

  // ── Content type detection (M-15, A-05) ────────────────────
  function detectContentType(element) {
    // Check element type directly
    if (element.matches && element.matches('ytm-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, [is-shorts], ytm-reel-video-renderer, ytm-shorts-player-renderer')) return 'short';

    // Check if element is inside a Shorts container
    if (element.closest && element.closest('[is-shorts], ytm-shorts-player-renderer, #shorts-container')) return 'short';

    // Check URL patterns — links to /shorts/
    var links = element.querySelectorAll('a[href*="/shorts/"]');
    if (links.length > 0) return 'short';

    // Check class names for reel/short indicators
    if (element.querySelector('[class*="reel"], [class*="short"], [class*="Short"]')) return 'short';

    // Check aria labels for "Shorts" keyword
    var ariaLabel = element.getAttribute('aria-label') || '';
    if (ariaLabel.toLowerCase().includes('short')) return 'short';

    // Check the current page URL — if we're on /shorts/, everything is a Short
    if (window.location.pathname.includes('/shorts')) return 'short';

    return 'video';
  }

  // ── Subscription detection (H-07, A-02, H-03 PIPELINE FIX) ──
  // PIPELINE FIX H-03: Also detect subscription status from page URL
  // and shelf context. Return null when genuinely uncertain instead of
  // always defaulting to "not subscribed".
  function detectSubscriptionStatus(element) {
    // URL-level signal: /feed/subscriptions page → everything is followed
    if (window.location.pathname.includes('/feed/subscriptions') ||
        window.location.pathname.includes('/feed/library')) {
      return 'followed';
    }

    // Check for "Subscribed" button state
    var subBtn = element.querySelector('[aria-label*="Subscribed"], [aria-label*="subscribed"], button[aria-label*="Subscribe"]');
    if (subBtn) {
      var label = (subBtn.getAttribute('aria-label') || '').toLowerCase();
      // "Subscribed" means the user follows this channel
      if (label.includes('subscribed') && !label.includes('subscribe to')) return 'followed';
      // "Subscribe to ..." means the user does NOT follow
      if (label.includes('subscribe to') || label === 'subscribe') return 'suggested';
    }

    // Check for subscribe/subscribed text in buttons
    var btns = element.querySelectorAll('button, [role="button"]');
    for (var i = 0; i < btns.length; i++) {
      var btnText = (btns[i].textContent || '').trim().toLowerCase();
      if (btnText === 'subscribed') return 'followed';
      if (btnText === 'subscribe') return 'suggested';
    }

    // Shorts player overlay — check subscription button in Shorts player
    var shortsSubBtn = element.querySelector(
      'ytm-subscribe-button-renderer, ' +
      '.reel-player-overlay-channel-info button, ' +
      'ytm-reel-channel-bar-renderer button'
    );
    if (shortsSubBtn) {
      var shortsLabel = (shortsSubBtn.getAttribute('aria-label') || shortsSubBtn.textContent || '').toLowerCase().trim();
      if (shortsLabel.includes('subscribed') && !shortsLabel.includes('subscribe to')) return 'followed';
      if (shortsLabel === 'subscribe' || shortsLabel.includes('subscribe to')) return 'suggested';
    }

    // Check for "Recommended for you" or suggestion indicators
    var fullText = (element.textContent || '').toLowerCase();
    if (fullText.includes('recommended for you') || fullText.includes('suggested for you') ||
        fullText.includes('based on your') || fullText.includes('new to you')) {
      return 'suggested';
    }

    // Check shelf/section context — if inside a "Subscriptions" section
    var parentSection = element.closest && element.closest('[class*="subscription"], [class*="following"]');
    if (parentSection) return 'followed';

    // PIPELINE FIX H-03: Return null instead of assuming "suggested"
    // when we genuinely cannot determine subscription status.
    // The scanner will use null to indicate "unknown".
    return null;
  }

  // ── Capture logic ──────────────────────────────────────────

  function captureVideo(element) {
    var title = extractTitle(element);
    var channel = extractChannel(element);

    // Improved deduplication: use channel + title combination to avoid
    // collisions when multiple Shorts have short or similar titles (H-05)
    var key = (channel || '') + '|' + title.substring(0, 60);
    if (CAPTURED.has(key) || title.length < 5) return;
    CAPTURED.add(key);

    var handle = extractHandle(element);
    var adDetected = isAd(element);
    var subscriptionStatus = detectSubscriptionStatus(element);
    position++;

    // PIPELINE FIX H-01: Use channel name as handle fallback.
    // If we have a channel name but no @handle, use channel name.
    // Only fall back to null if BOTH are missing.
    var finalHandle = handle || (channel ? channel.replace(/\\s+/g, '') : null);
    var finalDisplayName = channel || null;

    // PIPELINE FIX H-03: is_suggested uses subscription detection.
    // null means "unknown" — downstream will handle it proportionally.
    var isSuggested;
    if (adDetected) {
      isSuggested = true; // Ads are always "suggested" (not from subscriptions)
    } else if (subscriptionStatus === 'followed') {
      isSuggested = false;
    } else if (subscriptionStatus === 'suggested') {
      isSuggested = true;
    } else {
      // subscriptionStatus is null — we don't know
      // Default to null so computeDashboardData can handle unknowns
      isSuggested = null;
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'FEED_ITEM',
      data: {
        platform: 'YOUTUBE',
        position_in_feed: position,
        creator_handle: finalHandle,
        creator_display_name: finalDisplayName,
        is_ad: adDetected,
        ad_label_text: adDetected ? 'Ad' : null,
        post_text: title,
        hashtags: extractHashtags(title),
        is_suggested: isSuggested,
        content_type: detectContentType(element),
        capture_timestamp: Date.now()
      }
    }));
  }

  // Shorts are simple DOM elements — capture immediately.
  // Regular videos get a short delay for DOM to stabilize. (H-05, M-09)
  function captureWithDelay(element) {
    if (element.matches && element.matches('[is-shorts], ytm-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, ytm-reel-video-renderer, ytm-shorts-player-renderer, .shorts-video-cell')) {
      captureVideo(element);
    } else {
      setTimeout(function() { captureVideo(element); }, 300);
    }
  }

  // Lower threshold from 0.1 to 0.01 — Shorts that are barely visible
  // should still be captured since they scroll past quickly (H-05, A-04)
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) captureWithDelay(entry.target);
    });
  }, { threshold: 0.01 });

  function observeItems() {
    FEED_SELECTORS.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        if (!el.__alg_observed) {
          el.__alg_observed = true;
          el.setAttribute('data-alg-observed', 'true');
          observer.observe(el);
        }
      });
    });
  }

  observeItems();
  var mutationObserver = new MutationObserver(function() {
    if (mutationDebounceTimer) return;
    mutationDebounceTimer = setTimeout(function() {
      mutationDebounceTimer = null;
      observeItems();
    }, 200);
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Scroll-based fallback: capture any visible item every 1.5 seconds (was 3s)
  // More frequent scanning prevents missing Shorts during fast scrolling (M-09, A-07)
  setInterval(function() {
    FEED_SELECTORS.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          captureWithDelay(el);
        }
      });
    });
  }, 1500);

  // ── Debug logging ──────────────────────────────────────────
  // Reports capture stats every 5 seconds so WebViewScanner can log them in dev mode
  setInterval(function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SCANNER_DEBUG',
      data: {
        captured: CAPTURED.size,
        observing: document.querySelectorAll('[data-alg-observed]').length,
        timestamp: Date.now()
      }
    }));
  }, 5000);

  // PIPELINE FIX C-03: REMOVED auto-navigate to Shorts tab.
  // Previously this auto-navigated to Shorts after 2 seconds, which meant
  // the home feed (where ads and subscribed content appear) was barely captured.
  // The user can navigate to Shorts themselves if they want to scan Shorts.
  // This ensures home feed ads and subscription signals are captured.

  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'SCANNER_READY',
    data: { platform: 'YOUTUBE', timestamp: Date.now() }
  }));

  true;
})();
`;
