/**
 * AlgorithmLens Content Script — slim session controller.
 *
 * All platform-specific extraction has moved to src/scanners/*.js.
 * This file handles: platform detection, session lifecycle,
 * MutationObserver / IntersectionObserver wiring, scroll handling,
 * rate-limiting, and the chrome.runtime message listener.
 */

import { CAPTURE_DEBUG, CONTENT_SCRIPT_VERSION, debugLog } from './shared/debug.js';
import {
  scanFeedForPlatform, extractPostForPlatform,
  getFeedContainerSelectors, getPostContainerSelectors,
  getPlatformContext, containerHasMedia, logScanResults,
  resetFacebookState
} from './scanners/index.js';
import { isInstagramReels } from './scanners/utils.js';

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

function detectPlatform() {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('tiktok.com')) return 'tiktok';
  if (hostname.includes('instagram.com')) return 'instagram';
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be') || hostname === 'm.youtube.com') return 'youtube';
  if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('fb.watch')) return 'facebook';
  if (hostname === 'x.com' || hostname === 'www.x.com' || hostname.includes('twitter.com')) return 'twitter';
  if (hostname.includes('reddit.com')) return 'reddit';
  return 'unknown';
}

// ============================================================================
// SESSION STATE
// ============================================================================

let sessionActive = false;
let sessionPosts = new Map();
let sessionObservers = [];
let sessionPlatform = null;
let sessionStartTime = null;
let platformViewportObserver = null;

// Rate-limiting configuration
const MAX_POSTS_PER_SECOND = 30;
const BURST_POSTS_PER_SECOND = 50;
const RATE_DELAY_MS = 180;
let lastCollectionDelayedUntil = 0;
let lastScrollY = 0;
let forceNextScan = false;
let lastScrollTime = 0;

let sessionRateState = {
  totalNewPostsThisSession: 0,
  sessionStartTimeMs: null,
  consecutiveRateExceeds: 0,
  rateLimitTriggered: false
};

const SCAN_INTERVAL_STABLE_MS = 500;
const SCAN_INTERVAL_SCROLLING_MS = 300;

// ============================================================================
// MAIN SCAN FUNCTION (one-shot)
// ============================================================================

function scanFeed() {
  const platform = detectPlatform();

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens] FEED SCAN INITIATED — Platform: ${platform}, URL: ${window.location.href}`);
  }

  let posts = [];
  try {
    posts = scanFeedForPlatform(platform);
  } catch (error) {
    if (CAPTURE_DEBUG) debugLog('error', '[AlgorithmLens] Scan failed:', error);
    return [];
  }

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens] SCAN COMPLETE: ${posts.length} posts extracted`);
  }
  return posts;
}

// ============================================================================
// SESSION COLLECTION
// ============================================================================

function collectVisiblePosts() {
  if (!sessionActive || !sessionPlatform) return;

  if (CAPTURE_DEBUG) {
    const elapsed = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
    debugLog('log', `[CaptureDebug][${sessionPlatform}] collectVisiblePosts() — Elapsed: ${elapsed}s, Total: ${sessionPosts.size}`);
  }

  const currentScrollY = window.scrollY || window.pageYOffset || 0;
  if (Math.abs(currentScrollY - lastScrollY) > 100) forceNextScan = true;
  lastScrollY = currentScrollY;

  if (forceNextScan) {
    forceNextScan = false;
    lastCollectionDelayedUntil = 0;
  }
  if (Date.now() < lastCollectionDelayedUntil) return;

  const posts = scanFeedForPlatform(sessionPlatform);
  let newCount = 0;
  let duplicateCount = 0;

  for (const post of posts) {
    if (!post.id) continue;
    if (sessionPosts.has(post.id)) {
      duplicateCount++;
    } else {
      sessionPosts.set(post.id, post);
      newCount++;
    }
  }

  if (newCount > 0 || duplicateCount > 0) {
    if (CAPTURE_DEBUG) {
      debugLog('log', `[AlgorithmLens][Session] Batch: ${posts.length} scanned, ${newCount} new, ${duplicateCount} dupes. Total: ${sessionPosts.size}`);
    }
  }

  // Soft rate limiting
  if (newCount > 0 && sessionRateState.sessionStartTimeMs) {
    sessionRateState.totalNewPostsThisSession += newCount;
    const elapsedSeconds = Math.max((Date.now() - sessionRateState.sessionStartTimeMs) / 1000, 1);
    const postsPerSecond = sessionRateState.totalNewPostsThisSession / elapsedSeconds;

    if (postsPerSecond > BURST_POSTS_PER_SECOND) {
      lastCollectionDelayedUntil = Date.now() + RATE_DELAY_MS;
    } else if (postsPerSecond <= MAX_POSTS_PER_SECOND) {
      sessionRateState.consecutiveRateExceeds = 0;
    }
  }
}

// ============================================================================
// OBSERVER SETUP
// ============================================================================

function setupSessionObserver() {
  const feedContainerSelectors = getFeedContainerSelectors(sessionPlatform);
  let feedContainer = null;
  for (const selector of feedContainerSelectors) {
    feedContainer = document.querySelector(selector);
    if (feedContainer) break;
  }
  if (!feedContainer) feedContainer = document.body;

  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens][Session] Observer on: ${feedContainer.tagName || 'body'}`);
  }

  const platformContext = getPlatformContext(sessionPlatform);
  const postContainerSelectors = getPostContainerSelectors(sessionPlatform, platformContext);

  let viewportContext = 'Feed';
  if (sessionPlatform === 'instagram' && platformContext.isReels) viewportContext = 'Reels';
  else if (sessionPlatform === 'youtube' && platformContext.isShorts) viewportContext = 'Shorts';

  // --- IntersectionObserver: capture posts entering viewport ---
  platformViewportObserver = new IntersectionObserver((entries) => {
    if (!sessionActive) return;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const container = entry.target;
      try {
        const result = extractPostForPlatform(container, sessionPlatform, platformContext);
        if (result && !result.rejected && result.id && !sessionPosts.has(result.id)) {
          sessionPosts.set(result.id, result);
          if (CAPTURE_DEBUG) debugLog('log', `[CaptureDebug][${sessionPlatform}][${viewportContext}] VIEWPORT: ${result.id}`);
        }
      } catch (e) { /* expected for some containers */ }
      platformViewportObserver.unobserve(container);
    }
  }, { threshold: 0.1, rootMargin: '50px 0px 50px 0px' });

  // --- MutationObserver: detect new DOM nodes ---
  const processedContainers = new WeakSet();

  function processContainer(container) {
    if (processedContainers.has(container)) return;
    if (!containerHasMedia(container, sessionPlatform)) return;
    if (sessionPlatform === 'instagram' && container.tagName !== 'ARTICLE' && container.closest('article')) return;
    processedContainers.add(container);

    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const isInOrAboveViewport = rect.top < windowHeight && rect.bottom > 0;

    if (isInOrAboveViewport) {
      try {
        const result = extractPostForPlatform(container, sessionPlatform, platformContext);
        if (result && !result.rejected && result.id && !sessionPosts.has(result.id)) {
          sessionPosts.set(result.id, result);
        }
      } catch (e) { /* ignore */ }
    } else {
      platformViewportObserver.observe(container);
    }
  }

  const platformMutationObserver = new MutationObserver((mutations) => {
    if (!sessionActive) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        for (const selector of postContainerSelectors) {
          try { if (node.matches && node.matches(selector)) { processContainer(node); break; } } catch (e) {}
        }
        if (node.querySelectorAll) {
          for (const selector of postContainerSelectors) {
            try { node.querySelectorAll(selector).forEach(processContainer); } catch (e) {}
          }
        }
      }
    }
  });

  platformMutationObserver.observe(feedContainer, { childList: true, subtree: true });
  sessionObservers.push(platformMutationObserver);
  sessionObservers.push({ disconnect: () => { if (platformViewportObserver) { platformViewportObserver.disconnect(); platformViewportObserver = null; } } });

  // --- Scroll handler (backup) ---
  let lastThrottledScan = 0;
  const SCROLL_THROTTLE_MS = 500;

  const scrollHandler = () => {
    if (!sessionActive) return;
    lastScrollTime = Date.now();
    const now = Date.now();
    if (now - lastThrottledScan >= SCROLL_THROTTLE_MS) {
      lastThrottledScan = now;
      collectVisiblePosts();
    }
    clearTimeout(window._alScrollDebounce);
    window._alScrollDebounce = setTimeout(() => { lastThrottledScan = Date.now(); collectVisiblePosts(); }, SCAN_INTERVAL_SCROLLING_MS);
  };

  window.addEventListener('scroll', scrollHandler, { passive: true });
  sessionObservers.push({ disconnect: () => window.removeEventListener('scroll', scrollHandler) });

  // --- Initial scan of existing containers ---
  for (const selector of postContainerSelectors) {
    try {
      feedContainer.querySelectorAll(selector).forEach(processContainer);
    } catch (e) {}
  }

  if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens][Session] Observers ready');

  // --- YouTube Shorts URL change detector ---
  if (sessionPlatform === 'youtube' && platformContext.isShorts) {
    let lastShortsUrl = '';
    let shortsUrlCheckInterval = null;

    const captureShortsFromUrl = () => {
      if (!sessionActive) return;
      const currentUrl = window.location.href;
      if (currentUrl === lastShortsUrl) return;
      lastShortsUrl = currentUrl;

      const shortsMatch = currentUrl.match(/\/shorts\/([^?/]+)/);
      if (!shortsMatch) return;
      const videoId = shortsMatch[1];
      const postId = `youtube-${videoId}`;
      if (sessionPosts.has(postId)) return;

      const shortsContainer = document.querySelector('ytd-reel-video-renderer, ytd-shorts, [class*="reel-video"]');
      if (shortsContainer) {
        try {
          const result = extractPostForPlatform(shortsContainer, sessionPlatform, platformContext);
          if (result && !result.rejected && result.id) {
            sessionPosts.set(result.id, result);
          }
        } catch (e) {}
      } else {
        sessionPosts.set(postId, {
          id: postId, platform: 'youtube', platformSubtype: 'shorts',
          creator: null, caption: null, hashtags: [], isSponsored: false,
          sponsoredEvidence: null, ctaText: null, link: currentUrl
        });
      }
    };

    shortsUrlCheckInterval = setInterval(captureShortsFromUrl, 200);
    const shortsPopstateHandler = () => setTimeout(captureShortsFromUrl, 100);
    window.addEventListener('popstate', shortsPopstateHandler);
    captureShortsFromUrl();

    sessionObservers.push({
      disconnect: () => {
        if (shortsUrlCheckInterval) { clearInterval(shortsUrlCheckInterval); shortsUrlCheckInterval = null; }
        window.removeEventListener('popstate', shortsPopstateHandler);
      }
    });
  }
}

// ============================================================================
// START / STOP / STATUS
// ============================================================================

function startSessionScan() {
  const platform = detectPlatform();
  if (platform === 'unknown') return { success: false, error: 'Unsupported platform' };

  // Always clear previous state
  sessionPosts.clear();
  sessionObservers.forEach(obs => { try { obs.disconnect(); } catch {} });
  sessionObservers = [];
  clearTimeout(window._alSessionDebounce);
  clearTimeout(window._alScrollDebounce);
  resetFacebookState();

  lastCollectionDelayedUntil = 0;
  lastScrollY = window.scrollY || window.pageYOffset || 0;
  forceNextScan = false;
  lastScrollTime = 0;
  sessionRateState = { totalNewPostsThisSession: 0, sessionStartTimeMs: Date.now(), consecutiveRateExceeds: 0, rateLimitTriggered: false };

  sessionActive = true;
  sessionPlatform = platform;
  sessionStartTime = Date.now();

  if (CAPTURE_DEBUG) debugLog('log', `[CaptureDebug][${platform}] START_SESSION_SCAN at ${new Date().toISOString()}`);

  collectVisiblePosts();
  setupSessionObserver();

  // Debug heartbeat
  if (CAPTURE_DEBUG) {
    const heartbeatInterval = setInterval(() => {
      if (!sessionActive) { clearInterval(heartbeatInterval); return; }
      debugLog('log', `[CaptureDebug][${platform}] Heartbeat — Posts: ${sessionPosts.size}`);
    }, 5000);
    window._alCaptureDebugHeartbeat = heartbeatInterval;
  }

  return { success: true, platform: sessionPlatform, message: 'Session scan started', initialPostCount: sessionPosts.size };
}

function stopSessionScan() {
  const currentPlatform = sessionPlatform || detectPlatform();
  if (sessionActive) collectVisiblePosts();

  sessionObservers.forEach(obs => { try { obs.disconnect(); } catch {} });
  sessionObservers = [];
  clearTimeout(window._alSessionDebounce);
  clearTimeout(window._alScrollDebounce);

  const posts = Array.from(sessionPosts.values());
  const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
  const wasRateLimited = sessionRateState.rateLimitTriggered;
  const rateStateSnapshot = { totalNewPostsThisSession: sessionRateState.totalNewPostsThisSession, rateLimitTriggered: sessionRateState.rateLimitTriggered };

  sessionActive = false;
  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][${currentPlatform}] STOP — ${posts.length} posts, ${duration}s`);
    if (window._alCaptureDebugHeartbeat) { clearInterval(window._alCaptureDebugHeartbeat); window._alCaptureDebugHeartbeat = null; }
  }

  sessionPosts.clear();
  sessionPlatform = null;
  sessionStartTime = null;
  sessionRateState = { totalNewPostsThisSession: 0, sessionStartTimeMs: null, consecutiveRateExceeds: 0, rateLimitTriggered: false };

  return { success: true, platform: currentPlatform, posts, postCount: posts.length, rateLimited: wasRateLimited, rateState: rateStateSnapshot };
}

function getSessionStatus() {
  return {
    active: sessionActive,
    platform: sessionPlatform,
    postCount: sessionPosts.size,
    duration: sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0,
    rateLimited: sessionRateState.rateLimitTriggered,
    postsPerSecond: sessionRateState.sessionStartTimeMs
      ? (sessionRateState.totalNewPostsThisSession / Math.max((Date.now() - sessionRateState.sessionStartTimeMs) / 1000, 1))
      : 0,
    contentScriptVersion: CONTENT_SCRIPT_VERSION
  };
}

// ============================================================================
// MESSAGE LISTENER
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const action = message.action || message.type;
  if (CAPTURE_DEBUG) debugLog('log', `[AlgorithmLens] Message: ${action}`);

  if (message.type === 'PING') {
    sendResponse({ status: 'ok', platform: detectPlatform(), url: window.location.href, version: CONTENT_SCRIPT_VERSION });
    return true;
  }

  if (message.action === 'GET_SESSION_STATUS') { sendResponse(getSessionStatus()); return true; }
  if (message.action === 'START_SESSION_SCAN') { sendResponse(startSessionScan()); return true; }
  if (message.action === 'STOP_SESSION_SCAN') { sendResponse(stopSessionScan()); return true; }

  if (message.action === 'SCAN_FEED' || message.type === 'START_SCAN') {
    try {
      const posts = scanFeed();
      sendResponse({ success: true, posts, platform: detectPlatform(), url: window.location.href, timestamp: new Date().toISOString() });
    } catch (error) {
      sendResponse({ success: false, error: error.message || 'Unknown error', posts: [] });
    }
    return true;
  }

  return true;
});

// ============================================================================
// INIT
// ============================================================================

(function init() {
  const platform = detectPlatform();
  if (CAPTURE_DEBUG) {
    debugLog('log', `[AlgorithmLens] Content script v${CONTENT_SCRIPT_VERSION} — Platform: ${platform}, URL: ${window.location.href}`);
  }
})();
