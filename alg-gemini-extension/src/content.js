/**
 * AlgorithmLens Content Script — slim session controller.
 *
 * All platform-specific extraction has moved to src/scanners/*.js.
 * This file handles: platform detection, session lifecycle,
 * MutationObserver / IntersectionObserver wiring, scroll handling,
 * rate-limiting, and the chrome.runtime message listener.
 */

import { CAPTURE_DEBUG, CONTENT_SCRIPT_VERSION, debugLog } from './shared/debug.js';
import { initSentry, captureError, addBreadcrumb } from './shared/sentry.js';
import { TIMING } from './shared/constants.js';

// Initialize Sentry in the content script context
initSentry('content');
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
  if (hostname.includes('linkedin.com')) return 'linkedin';
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

// Rate-limiting configuration (from shared constants)
const MAX_POSTS_PER_SECOND = TIMING.MAX_POSTS_PER_SECOND;
const BURST_POSTS_PER_SECOND = TIMING.BURST_POSTS_PER_SECOND;
const RATE_DELAY_MS = TIMING.RATE_DELAY_MS;
let lastCollectionDelayedUntil = 0;
let lastScrollY = 0;
let forceNextScan = false;
let lastScrollTime = 0;

// (Audit 8 L3) Module-scoped debounce/heartbeat timers instead of window globals
let _alScrollDebounceTimer = null;
let _alSessionDebounceTimer = null;
let _alCaptureDebugHeartbeatTimer = null;
let _alPostCountReporterTimer = null;
let _lastReportedPostCount = 0;

let sessionRateState = {
  totalNewPostsThisSession: 0,
  sessionStartTimeMs: null,
  consecutiveRateExceeds: 0,
  rateLimitTriggered: false
};

const SCAN_INTERVAL_STABLE_MS = TIMING.SCAN_INTERVAL_STABLE_MS;
const SCAN_INTERVAL_SCROLLING_MS = TIMING.SCAN_INTERVAL_SCROLLING_MS;

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
    captureError(error, 'content:scan_feed', { platform, url: window.location.href });
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
  if (Math.abs(currentScrollY - lastScrollY) > TIMING.SCROLL_CHANGE_THRESHOLD_PX) forceNextScan = true;
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
  const SCROLL_THROTTLE_MS = TIMING.SCROLL_THROTTLE_MS;

  const scrollHandler = () => {
    if (!sessionActive) return;
    lastScrollTime = Date.now();
    const now = Date.now();
    if (now - lastThrottledScan >= SCROLL_THROTTLE_MS) {
      lastThrottledScan = now;
      collectVisiblePosts();
    }
    clearTimeout(_alScrollDebounceTimer);
    _alScrollDebounceTimer = setTimeout(() => { lastThrottledScan = Date.now(); collectVisiblePosts(); }, SCAN_INTERVAL_SCROLLING_MS);
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

    // (Audit 8 C2) Increased from 200ms to 500ms to reduce CPU overhead on host page
    shortsUrlCheckInterval = setInterval(captureShortsFromUrl, TIMING.SHORTS_URL_CHECK_INTERVAL_MS);
    const shortsPopstateHandler = () => setTimeout(captureShortsFromUrl, TIMING.SHORTS_POPSTATE_DELAY_MS);
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
// IN-PAGE SCAN PROGRESS TOAST
// ============================================================================

const TOAST_ID = 'algorithmlens-scan-toast';

function createScanToast() {
  // Remove any existing toast
  removeScanToast();

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  // Use shadow DOM to isolate styles from the host page
  const shadow = toast.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      pointer-events: auto !important;
    }
    .al-toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(37, 99, 235, 0.92);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18), 0 1px 4px rgba(0, 0, 0, 0.1);
      color: #ffffff;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      min-width: 200px;
      max-width: 320px;
      transition: opacity 0.3s ease, transform 0.3s ease;
      opacity: 0;
      transform: translateY(8px);
      animation: al-toast-in 0.35s ease forwards;
    }
    .al-toast.al-complete {
      background: rgba(16, 185, 129, 0.92);
    }
    .al-toast.al-fade-out {
      animation: al-toast-out 0.4s ease forwards;
    }
    @keyframes al-toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes al-toast-out {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(8px); }
    }
    .al-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .al-pulse {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ffffff;
      flex-shrink: 0;
      animation: al-pulse 1.5s ease-in-out infinite;
    }
    @keyframes al-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .al-text {
      flex: 1;
      min-width: 0;
    }
    .al-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.85;
      margin-bottom: 2px;
    }
    .al-count {
      font-size: 14px;
      font-weight: 600;
    }
    .al-close {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 2px;
      margin: -2px -4px -2px 0;
      font-size: 16px;
      line-height: 1;
      border-radius: 4px;
      flex-shrink: 0;
      transition: color 0.15s, background 0.15s;
    }
    .al-close:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.15);
    }
  `;

  const container = document.createElement('div');
  container.className = 'al-toast';
  container.innerHTML = `
    <span class="al-pulse"></span>
    <div class="al-text">
      <div class="al-label">AlgorithmLens</div>
      <div class="al-count">Scanning\u2026 <span class="al-post-count">0</span> posts captured</div>
    </div>
    <button class="al-close" aria-label="Close scan indicator" title="Dismiss">\u00D7</button>
  `;

  // Close button handler
  container.querySelector('.al-close').addEventListener('click', () => {
    removeScanToast();
  });

  shadow.appendChild(style);
  shadow.appendChild(container);
  document.body.appendChild(toast);

  return toast;
}

function updateScanToast(count) {
  const toast = document.getElementById(TOAST_ID);
  if (!toast || !toast.shadowRoot) return;
  const countEl = toast.shadowRoot.querySelector('.al-post-count');
  if (countEl) countEl.textContent = count.toString();
}

function showScanCompleteToast(finalCount) {
  const toast = document.getElementById(TOAST_ID);
  if (!toast || !toast.shadowRoot) return;

  const container = toast.shadowRoot.querySelector('.al-toast');
  if (!container) return;

  container.classList.add('al-complete');
  const pulse = container.querySelector('.al-pulse');
  if (pulse) pulse.style.display = 'none';

  const countEl = container.querySelector('.al-count');
  if (countEl) countEl.textContent = `Scan complete \u2713 ${finalCount} posts`;

  // Fade out after display period
  setTimeout(() => {
    container.classList.add('al-fade-out');
    setTimeout(() => removeScanToast(), TIMING.TOAST_FADE_OUT_MS);
  }, TIMING.TOAST_COMPLETE_DISPLAY_MS);
}

function removeScanToast() {
  const toast = document.getElementById(TOAST_ID);
  if (toast) toast.remove();
}

// ============================================================================
// POST COUNT REPORTER (sends count to background for badge updates)
// ============================================================================

function startPostCountReporter() {
  _lastReportedPostCount = 0;
  // Report immediately, then every 1.5 seconds
  reportPostCount();
  _alPostCountReporterTimer = setInterval(reportPostCount, TIMING.POST_COUNT_REPORT_INTERVAL_MS);
}

function reportPostCount() {
  if (!sessionActive) return;
  const count = sessionPosts.size;
  // Only send if changed
  if (count !== _lastReportedPostCount) {
    _lastReportedPostCount = count;
    updateScanToast(count);
    try {
      chrome.runtime.sendMessage({
        action: 'UPDATE_POST_COUNT',
        postCount: count
      }).catch(() => {}); // Ignore errors if background not available
    } catch (e) { /* content script may be disconnected */ }
  }
}

function stopPostCountReporter() {
  if (_alPostCountReporterTimer) {
    clearInterval(_alPostCountReporterTimer);
    _alPostCountReporterTimer = null;
  }
  _lastReportedPostCount = 0;
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
  clearTimeout(_alSessionDebounceTimer);
  clearTimeout(_alScrollDebounceTimer);
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

  // Start in-page toast and post count badge reporter
  createScanToast();
  updateScanToast(sessionPosts.size);
  startPostCountReporter();

  // Debug heartbeat
  if (CAPTURE_DEBUG) {
    const heartbeatInterval = setInterval(() => {
      if (!sessionActive) { clearInterval(heartbeatInterval); return; }
      debugLog('log', `[CaptureDebug][${platform}] Heartbeat — Posts: ${sessionPosts.size}`);
    }, TIMING.DEBUG_HEARTBEAT_INTERVAL_MS);
    _alCaptureDebugHeartbeatTimer = heartbeatInterval;
  }

  return { success: true, platform: sessionPlatform, message: 'Session scan started', initialPostCount: sessionPosts.size };
}

function stopSessionScan() {
  const currentPlatform = sessionPlatform || detectPlatform();
  if (sessionActive) collectVisiblePosts();

  sessionObservers.forEach(obs => { try { obs.disconnect(); } catch {} });
  sessionObservers = [];
  clearTimeout(_alSessionDebounceTimer);
  clearTimeout(_alScrollDebounceTimer);

  const posts = Array.from(sessionPosts.values());
  const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;
  const wasRateLimited = sessionRateState.rateLimitTriggered;
  const rateStateSnapshot = { totalNewPostsThisSession: sessionRateState.totalNewPostsThisSession, rateLimitTriggered: sessionRateState.rateLimitTriggered };

  sessionActive = false;

  // Stop post count reporter and show completion toast
  stopPostCountReporter();
  showScanCompleteToast(posts.length);

  if (CAPTURE_DEBUG) {
    debugLog('log', `[CaptureDebug][${currentPlatform}] STOP — ${posts.length} posts, ${duration}s`);
    if (_alCaptureDebugHeartbeatTimer) { clearInterval(_alCaptureDebugHeartbeatTimer); _alCaptureDebugHeartbeatTimer = null; }
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
  if (message.action === 'START_SESSION_SCAN') {
    addBreadcrumb('state', 'Content script: scanning started');
    sendResponse(startSessionScan());
    return true;
  }
  if (message.action === 'STOP_SESSION_SCAN') {
    addBreadcrumb('state', 'Content script: scanning stopped');
    sendResponse(stopSessionScan());
    return true;
  }

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
