import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';
import { SUPPORTED_SCAN_PLATFORMS, PLATFORM_DISPLAY_NAMES } from '../shared/constants.js';

/**
 * AlgorithmLens Popup Script
 *
 * Handles the extension popup UI for session-based feed scanning.
 * After scan completion, shows 6 dashboard preview cards linking to full dashboard.
 */

// ============================================
// Security Helpers
// ============================================

/**
 * Safely set text content to prevent XSS
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text to set
 */
function safeSetText(element, text) {
  if (!element) return;
  element.textContent = text;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML context
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Safely set HTML with escaped user data
 * Builds DOM structure using createElement instead of innerHTML with interpolation
 * @param {HTMLElement} element - Target element
 * @param {Object} content - Object with text values to safely insert
 * @param {string} htmlTemplate - HTML template string (no user data should be interpolated)
 */
function safeSetHtml(element, htmlTemplate) {
  if (!element) return;
  element.innerHTML = htmlTemplate;
}

// ============================================
// Feature Flags
// ============================================

const FACEBOOK_ENABLED_FOR_MVP = true;

if (CAPTURE_DEBUG) {
  debugLog('log', '[AlgorithmLens] Popup opened');
}

// ============================================
// DOM Elements
// ============================================

const statusEl = document.getElementById('status');
const scanButton = document.getElementById('scanButton');
const sessionTimerEl = document.getElementById('sessionTimer');
const aiConsentToggle = document.getElementById('aiConsentToggle');
const aiConsentSection = document.getElementById('aiConsentSection');

// ============================================
// State
// ============================================

let currentPlatform = null;
let currentTabId = null;
let isSupported = false;
let sessionActive = false;
let sessionStartTime = null;
let timerInterval = null;
let lastUnifiedResult = null;
let lastBackendResponse = null;

const platformNames = PLATFORM_DISPLAY_NAMES;

// ============================================
// Timer Functions
// ============================================

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  sessionTimerEl.style.display = 'block';
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    if (sessionActive && sessionStartTime) {
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  if (sessionStartTime) {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    sessionTimerEl.innerHTML = ''; // Clear previous content
    // [Audit 6 M6] Add recording pulse dot
    const recordingDot = document.createElement('span');
    recordingDot.className = 'recording-dot';
    recordingDot.setAttribute('aria-hidden', 'true');
    const timeSpan = document.createElement('span');
    timeSpan.textContent = formatTime(elapsed);
    const smallSpan = document.createElement('small');
    smallSpan.textContent = 'Session recording...';
    sessionTimerEl.appendChild(recordingDot);
    sessionTimerEl.appendChild(timeSpan);
    sessionTimerEl.appendChild(smallSpan);
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  sessionTimerEl.style.display = 'none';
}

// ============================================
// Platform & Session Check
// ============================================

async function checkCurrentTab() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeUrl = activeTab?.url || '';
    const isFacebookPage = activeUrl.includes('facebook.com');

    if (isFacebookPage && !FACEBOOK_ENABLED_FOR_MVP) {
      if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Facebook detected but disabled for MVP');
      isSupported = false;
      currentPlatform = null;
      sessionActive = false;
      statusEl.className = 'status unsupported';
      statusEl.innerHTML = `
        <strong>Facebook support coming soon</strong><br>
        <small>Facebook scanning is in beta and not available in this version.</small>
      `;
      scanButton.disabled = true;
      scanButton.textContent = 'Start Session Scan';
      scanButton.className = 'scan-button';
      stopTimer();
      return;
    }

    const platformResponse = await chrome.runtime.sendMessage({ type: 'CHECK_PLATFORM' });
    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Platform check response:', platformResponse);

    // SECURITY: Validate response structure before using it
    if (!platformResponse || typeof platformResponse !== 'object') {
      throw new Error('Invalid platform response from background script');
    }

    currentTabId = platformResponse.tabId;
    const platformDetected = platformResponse.platform;
    const isSupportedPlatform = platformDetected && SUPPORTED_SCAN_PLATFORMS.includes(platformDetected);

    if (!platformResponse.supported || !isSupportedPlatform) {
      isSupported = false;
      currentPlatform = null;
      sessionActive = false;
      statusEl.className = 'status unsupported';

      if (platformDetected === 'reddit') {
        statusEl.innerHTML = `
          <strong>Reddit support coming soon</strong><br>
          <small>Reddit scanning is temporarily disabled while we improve it.</small>
        `;
      } else {
        statusEl.innerHTML = `
          Navigate to TikTok, Instagram, YouTube, Facebook, Twitter/X, or Reddit to start a session scan.
        `;
      }

      scanButton.disabled = true;
      scanButton.textContent = 'Start Session Scan';
      scanButton.className = 'scan-button';
      stopTimer();
      return;
    }

    isSupported = true;
    currentPlatform = platformResponse.platform;

    const sessionResponse = await chrome.runtime.sendMessage({ action: 'GET_SESSION_STATE' });
    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Session state response:', sessionResponse);

    // SECURITY: Validate response structure before using it
    if (!sessionResponse || typeof sessionResponse !== 'object') {
      throw new Error('Invalid session state response from background script');
    }

    if (sessionResponse.active && sessionResponse.startTime) {
      sessionActive = true;
      sessionStartTime = sessionResponse.startTime;
      currentPlatform = sessionResponse.platform || currentPlatform;
      showSessionActiveState();
    } else {
      sessionActive = false;
      sessionStartTime = null;
      showReadyState();
    }

    scanButton.disabled = false;

  } catch (error) {
    console.error('[AlgorithmLens] Error checking platform:', error);
    statusEl.className = 'status unsupported';
    statusEl.textContent = 'Unable to detect page. Try refreshing.';
    scanButton.disabled = true;
  }
}

function showReadyState() {
  statusEl.className = 'status supported';
  statusEl.innerHTML = '';

  const textNode = document.createTextNode('Ready to scan ');
  const badge = document.createElement('span');
  badge.className = 'platform-badge';
  badge.textContent = platformNames[currentPlatform] || currentPlatform;

  statusEl.appendChild(textNode);
  statusEl.appendChild(badge);

  scanButton.textContent = 'Start Session Scan';
  scanButton.className = 'scan-button';
  scanButton.disabled = false;
  stopTimer();
}

function showSessionActiveState() {
  statusEl.className = 'status session-active';
  statusEl.innerHTML = '';

  const strong = document.createElement('strong');
  strong.textContent = `Recording on ${platformNames[currentPlatform] || currentPlatform}`;
  const br = document.createElement('br');
  const small = document.createElement('small');
  small.textContent = 'Scroll your feed to capture posts. Click "Stop" when ready.';

  statusEl.appendChild(strong);
  statusEl.appendChild(br);
  statusEl.appendChild(small);

  scanButton.textContent = 'Stop & Analyze Session';
  scanButton.className = 'scan-button stop';
  scanButton.disabled = false;
  startTimer();
}

// ============================================
// Format Results — Dashboard Preview Cards
// ============================================

function formatUnifiedResults(result, durationSeconds, backendSaved = false, backendResponse = null, rateLimited = false) {
  const { aggregates, scan_metadata, _computed } = result;
  const scanId = scan_metadata?.scan_id || '';
  const aiEnabled = getAiConsent();
  const aiDataAvailable = aiEnabled && backendSaved;

  // No posts captured
  if (!aggregates || aggregates.total_feed_items === 0) {
    return `
      <div class="scan-result">
        <div class="result-header">
          <span class="result-count">0</span>
          <span class="result-meta">posts captured</span>
        </div>
        <div class="result-detail">Try scrolling your feed a bit longer before stopping.</div>
      </div>
    `;
  }

  const totalItems = aggregates.total_feed_items;
  const totalAds = aggregates.total_ads;
  const adPercent = Math.round(aggregates.ad_percentage * 100);
  const platform = scan_metadata.platform?.toLowerCase() || 'unknown';
  const platformLabel = platformNames[platform] || platform;

  // Unique creators
  const uniqueCreators = _computed?.uniqueCreators || [];
  const creatorCount = uniqueCreators.length;
  const topCreator = uniqueCreators[0] || null;
  const creatorRatio = totalItems > 0 ? (creatorCount / totalItems) : 0;

  // Suggested vs followed
  const svf = aggregates.suggested_vs_followed || {};
  const suggestedPct = _computed?.suggestedPercent ?? Math.round((svf.suggested_percentage || 0) * 100);
  const followedPct = _computed?.followedPercent ?? Math.round((svf.followed_percentage || 0) * 100);

  // Top topics / hashtags
  const topTopics = _computed?.topTopics || [];
  const topHashtags = _computed?.topHashtags || [];
  const topTopic = topTopics.length > 0 ? topTopics[0] : null;

  // Sponsor names for ads
  const adItems = (result.feed_items || []).filter(item => item.is_ad);
  const sponsorNames = [...new Set(adItems.map(a => a.ad_metadata?.advertiser_name).filter(Boolean))];
  const sponsorCount = sponsorNames.length;

  // Duration display
  const durationMin = durationSeconds >= 60
    ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
    : `${durationSeconds}s`;

  // Status banners
  let rateLimitBanner = '';
  if (rateLimited) {
    rateLimitBanner = `
      <div class="saved-banner rate-limit">
        <div class="saved-icon">⚡</div>
        <div class="saved-text">
          <strong>Feed moved quickly</strong>
          <small>Scrolling slowly helps capture more posts.</small>
        </div>
      </div>
    `;
  }

  // Auth error banner — shown when backend save failed due to authentication
  let authErrorBanner = '';
  if (!backendSaved && backendResponse?.isAuthError) {
    authErrorBanner = `
      <div class="saved-banner auth-error">
        <div class="saved-icon">🔑</div>
        <div class="saved-text">
          <strong>Sign in to save scans</strong>
          <small>Your scan was captured locally. Sign in at algorithmlens.com to save to your dashboard.</small>
        </div>
      </div>
    `;
  } else if (!backendSaved && backendResponse && !backendResponse.success) {
    authErrorBanner = `
      <div class="saved-banner save-error">
        <div class="saved-icon">⚠️</div>
        <div class="saved-text">
          <strong>Scan not saved to dashboard</strong>
          <small>Your scan was captured locally but could not be saved. Try again later.</small>
        </div>
      </div>
    `;
  }

  // --- Build the 6 dashboard cards ---

  // Card 1: Overview — show feed diversity insight, not a repeat of the header
  // SECURITY: Escape user data to prevent XSS
  let overviewValue, overviewUnit, overviewDetail;
  if (topTopic && topTopic.topic) {
    overviewValue = escapeHtml(topTopic.topic);
    overviewUnit = '';
    overviewDetail = topTopics.length > 1
      ? `Top category · ${topTopics.length} topics detected`
      : 'Dominant topic in your feed';
  } else if (topHashtags.length > 0) {
    overviewValue = `#${escapeHtml(topHashtags[0].tag)}`;
    overviewUnit = '';
    overviewDetail = `Appeared ${topHashtags[0].count}× · ${topHashtags.length} hashtags total`;
  } else {
    overviewValue = totalItems;
    overviewUnit = 'posts';
    overviewDetail = `Scanned in ${durationMin} on ${platformLabel}`;
  }

  // Card 2: Sources — unique creators with diversity insight
  // SECURITY: Escape user data to prevent XSS
  let sourcesDetail;
  if (creatorCount === 0) {
    sourcesDetail = 'Creator data not available';
  } else if (topCreator) {
    const escapedCreator = escapeHtml(topCreator);
    sourcesDetail = creatorRatio > 0.8
      ? `High variety · top: ${escapedCreator}`
      : `Top creator: ${escapedCreator}`;
  } else {
    sourcesDetail = `${creatorCount} unique across ${totalItems} posts`;
  }

  // Card 3: Ads — percentage of feed that is ads
  const adsValue = `${adPercent}%`;
  const adsUnit = 'ads in feed';
  let adsDetail;
  if (totalAds === 0) {
    adsDetail = 'No sponsored content detected';
  } else if (sponsorCount > 0) {
    adsDetail = `${totalAds} ad${totalAds !== 1 ? 's' : ''} from ${sponsorCount} brand${sponsorCount !== 1 ? 's' : ''}`;
  } else {
    adsDetail = `${totalAds} sponsored post${totalAds !== 1 ? 's' : ''} found`;
  }
  // SECURITY: Escape user data to prevent XSS
  const escapedAdsDetail = escapeHtml(adsDetail);

  // Card 4: Suggested vs Followed — always show a number, never "—"
  let suggestedValue, suggestedUnit, suggestedDetail;
  if (suggestedPct > 0 || followedPct > 0) {
    suggestedValue = `${suggestedPct}%`;
    suggestedUnit = 'algorithm-suggested';
    suggestedDetail = `${followedPct}% from accounts you follow`;
  } else {
    suggestedValue = '0%';
    suggestedUnit = 'algorithm-suggested';
    suggestedDetail = `${platformLabel} may not expose this signal`;
  }
  // SECURITY: Escape user data to prevent XSS
  const escapedSuggestedDetail = escapeHtml(suggestedDetail);

  return `
    <div class="scan-result">
      ${rateLimitBanner}
      ${authErrorBanner}

      <div class="result-header">
        <span class="result-count">${totalItems}</span>
        <span class="result-meta">posts in ${durationMin} on ${platformLabel}</span>
      </div>

      <div class="dashboard-preview">
        <div class="dashboard-cards">
          <a class="dash-card" data-tab="overview" data-scan-id="${scanId}" role="button" tabindex="0" aria-label="View Overview on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Overview</div>
            <div class="dash-card-value">${overviewValue} <span class="dash-card-unit">${overviewUnit}</span></div>
            <div class="dash-card-detail">${overviewDetail}</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>

          <a class="dash-card" data-tab="sources" data-scan-id="${scanId}" role="button" tabindex="0" aria-label="View Sources on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Sources</div>
            <div class="dash-card-value">${creatorCount} <span class="dash-card-unit">${creatorCount === 1 ? 'creator' : 'creators'}</span></div>
            <div class="dash-card-detail">${sourcesDetail}</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>

          <a class="dash-card" data-tab="ads" data-scan-id="${scanId}" role="button" tabindex="0" aria-label="View Ads and Sponsors on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Ads &amp; Sponsors</div>
            <div class="dash-card-value">${adsValue} <span class="dash-card-unit">${adsUnit}</span></div>
            <div class="dash-card-detail">${escapedAdsDetail}</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>

          <a class="dash-card" data-tab="suggested" data-scan-id="${scanId}" role="button" tabindex="0" aria-label="View Suggested vs Followed on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Suggested vs Followed</div>
            <div class="dash-card-value">${suggestedValue} <span class="dash-card-unit">${suggestedUnit}</span></div>
            <div class="dash-card-detail">${escapedSuggestedDetail}</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>
        </div>
      </div>

      <a class="dashboard-cta" data-scan-id="${scanId}" role="button" tabindex="0" aria-label="View full dashboard">
        View Full Dashboard →
      </a>
    </div>
  `;
}

// ============================================
// Attach Event Handlers for Dynamic Cards
// ============================================

function attachDashboardCardHandlers() {
  // [Audit 6 H4] Helper: open dashboard tab from a card element
  function openCardDashboard(card) {
    const tab = card.getAttribute('data-tab');
    const scanId = card.getAttribute('data-scan-id');
    if (CAPTURE_DEBUG) debugLog('log', `[AlgorithmLens] Opening dashboard tab: ${tab}, scanId: ${scanId}`);
    chrome.runtime.sendMessage({
      action: 'OPEN_DASHBOARD',
      tab: tab,
      scanId: scanId
    });
  }

  // Individual card clicks -> open specific dashboard tab
  const cards = document.querySelectorAll('.dash-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openCardDashboard(card);
    });
    // [Audit 6 H4] Keyboard support: Enter/Space activates card
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCardDashboard(card);
      }
    });
  });

  // CTA button -> open dashboard overview
  const cta = document.querySelector('.dashboard-cta');
  if (cta) {
    function openFullDashboard() {
      const scanId = cta.getAttribute('data-scan-id');
      if (CAPTURE_DEBUG) debugLog('log', `[AlgorithmLens] Opening full dashboard, scanId: ${scanId}`);
      chrome.runtime.sendMessage({
        action: 'OPEN_DASHBOARD',
        tab: 'overview',
        scanId: scanId
      });
    }

    cta.addEventListener('click', (e) => {
      e.preventDefault();
      openFullDashboard();
    });
    // [Audit 6 H4] Keyboard support for CTA
    cta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFullDashboard();
      }
    });
  }
}

// ============================================
// Session Scan Handlers
// ============================================

async function startSession() {
  if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Starting session scan...');

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeUrl = activeTab?.url || '';
    const isFacebookPage = activeUrl.includes('facebook.com');

    if (isFacebookPage && !FACEBOOK_ENABLED_FOR_MVP) {
      if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Blocking Facebook session start (MVP restriction)');
      statusEl.className = 'status unsupported';
      statusEl.innerHTML = `
        <strong>Facebook support coming soon</strong><br>
        <small>Facebook scanning is coming soon.</small>
      `;
      scanButton.disabled = true;
      return;
    }
  } catch (e) {
    console.error('[AlgorithmLens] Error checking tab URL:', e);
  }

  scanButton.disabled = true;
  scanButton.textContent = 'Starting...';
  statusEl.className = 'status loading';
  statusEl.textContent = 'Starting session...';

  try {
    const geminiConsent = getAiConsent();
    const response = await chrome.runtime.sendMessage({
      action: 'START_SESSION_SCAN',
      geminiConsent: geminiConsent
    });

    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Start session response:', { response, geminiConsent });

    // SECURITY: Validate response structure before using it
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response from background script');
    }

    if (!response.success) {
      if (response.needsRefresh) {
        statusEl.className = 'status unsupported';
        statusEl.innerHTML = `
          <strong>Page refresh needed</strong><br>
          <small>Please refresh the page and try again.</small>
        `;
        scanButton.disabled = false;
        scanButton.textContent = 'Start Session Scan';
        scanButton.className = 'scan-button';
        return;
      }
      throw new Error(response.error || 'Failed to start session');
    }

    sessionActive = true;
    sessionStartTime = response.startTime || Date.now();
    currentPlatform = response.platform;

    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Session started, startTime:', sessionStartTime);
    window.close();

  } catch (error) {
    console.error('[AlgorithmLens] Error starting session:', error);
    statusEl.className = 'status unsupported';
    statusEl.innerHTML = '';

    const errorMessage = error.message || '';
    const isConnectionError =
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('message port closed');

    const strong = document.createElement('strong');
    const br = document.createElement('br');
    const small = document.createElement('small');

    if (isConnectionError) {
      strong.textContent = 'Page refresh needed';
      small.textContent = 'Please refresh the page and try again.';
    } else {
      strong.textContent = 'Error';
      small.textContent = errorMessage || 'Could not start session';
    }

    statusEl.appendChild(strong);
    statusEl.appendChild(br);
    statusEl.appendChild(small);

    scanButton.disabled = false;
    scanButton.textContent = 'Start Session Scan';
    scanButton.className = 'scan-button';
  }
}

async function stopSessionAndAnalyze() {
  if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Stopping session and analyzing...');

  scanButton.disabled = true;
  scanButton.textContent = 'Analyzing...';
  statusEl.className = 'status loading';
  statusEl.textContent = 'Stopping session and processing...';
  stopTimer();

  try {
    const response = await chrome.runtime.sendMessage({ action: 'STOP_SESSION_SCAN_AND_PROCESS' });

    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Stop session response:', response);

    // SECURITY: Validate response structure before using it
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response from background script');
    }

    if (!response.success) {
      if (response.alreadyProcessed) {
        if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Ignoring duplicate stop request');
        return;
      }

      if (response.needsRefresh) {
        sessionActive = false;
        sessionStartTime = null;
        statusEl.className = 'status unsupported';
        statusEl.innerHTML = '';

        const strong = document.createElement('strong');
        strong.textContent = 'Connection Lost';
        const br = document.createElement('br');
        const small = document.createElement('small');
        small.textContent = 'Lost connection to the page. Please refresh and start a new session.';

        statusEl.appendChild(strong);
        statusEl.appendChild(br);
        statusEl.appendChild(small);

        scanButton.disabled = false;
        scanButton.textContent = 'Start Session Scan';
        scanButton.className = 'scan-button';
        return;
      }
      throw new Error(response.error || 'Failed to process session');
    }

    sessionActive = false;
    sessionStartTime = null;
    lastUnifiedResult = response.result;
    lastBackendResponse = response.backendResponse;

    // Display results with dashboard cards
    statusEl.className = 'status results';
    statusEl.innerHTML = formatUnifiedResults(
      response.result,
      response.durationSeconds,
      response.backendSaved,
      response.backendResponse,
      response.rateLimited
    );

    // Attach click handlers to dashboard cards
    attachDashboardCardHandlers();

    if (CAPTURE_DEBUG) {
      debugLog('log', '[AlgorithmLens] SESSION SCAN COMPLETE');
      debugLog('log', '[AlgorithmLens] Duration:', response.durationSeconds);
      debugLog('log', '[AlgorithmLens] Posts:', response.postCount);
      debugLog('log', '[AlgorithmLens] Platform:', response.platform);
      debugLog('log', '[AlgorithmLens] Backend saved:', response.backendSaved);
      debugLog('log', '[AlgorithmLens] Full result:', response.result);
    }

    scanButton.disabled = false;
    scanButton.textContent = 'Start Session Scan';
    scanButton.className = 'scan-button';

  } catch (error) {
    console.error('[AlgorithmLens] Error processing session:', error);
    sessionActive = false;
    sessionStartTime = null;

    statusEl.className = 'status unsupported';
    statusEl.innerHTML = '';

    const errorMessage = error.message || '';
    const isConnectionError =
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('message port closed');

    const strong = document.createElement('strong');
    const br = document.createElement('br');
    const small = document.createElement('small');

    if (isConnectionError) {
      strong.textContent = 'Connection Lost';
      small.textContent = 'Lost connection to the page. Please refresh and start a new session.';
    } else {
      strong.textContent = 'Error Processing Session';
      small.textContent = errorMessage || 'Could not process session';
    }

    statusEl.appendChild(strong);
    statusEl.appendChild(br);
    statusEl.appendChild(small);

    scanButton.disabled = false;
    scanButton.textContent = 'Start Session Scan';
    scanButton.className = 'scan-button';
  }
}

// ============================================
// Main Button Handler
// ============================================

async function handleScanClick() {
  if (!isSupported) {
    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Scan attempted on unsupported platform');
    statusEl.className = 'status unsupported';
    statusEl.innerHTML = 'Navigate to a supported platform to start a session scan.';
    return;
  }

  if (sessionActive) {
    await stopSessionAndAnalyze();
  } else {
    await startSession();
  }
}

// ============================================
// Event Listeners
// ============================================

scanButton.addEventListener('click', handleScanClick);

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  checkCurrentTab();
});

if (document.readyState !== 'loading') {
  checkCurrentTab();
}

// ============================================
// AI Consent Toggle Persistence
// ============================================

async function loadAiConsentPreference() {
  try {
    const result = await chrome.storage.local.get(['aiConsentEnabled']);
    const enabled = result.aiConsentEnabled === true;
    if (aiConsentToggle) {
      aiConsentToggle.checked = enabled;
    }
    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] AI consent preference loaded:', enabled);
    return enabled;
  } catch (e) {
    console.error('[AlgorithmLens] Error loading AI consent preference:', e);
    return false;
  }
}

async function saveAiConsentPreference(enabled) {
  try {
    await chrome.storage.local.set({ aiConsentEnabled: enabled });
    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] AI consent preference saved:', enabled);
  } catch (e) {
    console.error('[AlgorithmLens] Error saving AI consent preference:', e);
  }
}

function getAiConsent() {
  return aiConsentToggle ? aiConsentToggle.checked : false;
}

if (aiConsentToggle) {
  aiConsentToggle.addEventListener('change', () => {
    saveAiConsentPreference(aiConsentToggle.checked);
  });
}

loadAiConsentPreference();
