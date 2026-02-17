import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';

/**
 * AlgorithmLens Popup Script
 *
 * Handles the extension popup UI for session-based feed scanning.
 * After scan completion, shows 6 dashboard preview cards linking to full dashboard.
 */

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

const SUPPORTED_SCAN_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'reddit'];

const platformNames = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  reddit: 'Reddit'
};

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
    sessionTimerEl.innerHTML = `${formatTime(elapsed)}<small>Session recording...</small>`;
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
  statusEl.innerHTML = `
    Ready to scan <span class="platform-badge">${platformNames[currentPlatform] || currentPlatform}</span>
  `;
  scanButton.textContent = 'Start Session Scan';
  scanButton.className = 'scan-button';
  scanButton.disabled = false;
  stopTimer();
}

function showSessionActiveState() {
  statusEl.className = 'status session-active';
  statusEl.innerHTML = `
    <strong>Recording on ${platformNames[currentPlatform] || currentPlatform}</strong><br>
    <small>Scroll your feed to capture posts. Click "Stop" when ready.</small>
  `;
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

  // Rate limit banner (only banner we show)
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

  // --- Build the 6 dashboard cards ---

  // Card 1: Overview — show feed diversity insight, not a repeat of the header
  let overviewValue, overviewUnit, overviewDetail;
  if (topTopic && topTopic.topic) {
    overviewValue = topTopic.topic;
    overviewUnit = '';
    overviewDetail = topTopics.length > 1
      ? `Top category · ${topTopics.length} topics detected`
      : 'Dominant topic in your feed';
  } else if (topHashtags.length > 0) {
    overviewValue = `#${topHashtags[0].tag}`;
    overviewUnit = '';
    overviewDetail = `Appeared ${topHashtags[0].count}× · ${topHashtags.length} hashtags total`;
  } else {
    overviewValue = totalItems;
    overviewUnit = 'posts';
    overviewDetail = `Scanned in ${durationMin} on ${platformLabel}`;
  }

  // Card 2: Sources — unique creators with diversity insight
  let sourcesDetail;
  if (creatorCount === 0) {
    sourcesDetail = 'Creator data not available';
  } else if (topCreator) {
    sourcesDetail = creatorRatio > 0.8
      ? `High variety · top: ${topCreator}`
      : `Top creator: ${topCreator}`;
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

  return `
    <div class="scan-result">
      ${rateLimitBanner}

      <div class="result-header">
        <span class="result-count">${totalItems}</span>
        <span class="result-meta">posts in ${durationMin} on ${platformLabel}</span>
      </div>

      <div class="dashboard-preview">
        <div class="dashboard-cards">
          <a class="dash-card" data-tab="overview" data-scan-id="${scanId}">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Overview</div>
            <div class="dash-card-value">${overviewValue} <span class="dash-card-unit">${overviewUnit}</span></div>
            <div class="dash-card-detail">${overviewDetail}</div>
            <span class="dash-card-arrow">›</span>
          </a>

          <a class="dash-card" data-tab="sources" data-scan-id="${scanId}">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Sources</div>
            <div class="dash-card-value">${creatorCount} <span class="dash-card-unit">${creatorCount === 1 ? 'creator' : 'creators'}</span></div>
            <div class="dash-card-detail">${sourcesDetail}</div>
            <span class="dash-card-arrow">›</span>
          </a>

          <a class="dash-card" data-tab="ads" data-scan-id="${scanId}">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Ads &amp; Sponsors</div>
            <div class="dash-card-value">${adsValue} <span class="dash-card-unit">${adsUnit}</span></div>
            <div class="dash-card-detail">${adsDetail}</div>
            <span class="dash-card-arrow">›</span>
          </a>

          <a class="dash-card" data-tab="suggested" data-scan-id="${scanId}">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Suggested vs Followed</div>
            <div class="dash-card-value">${suggestedValue} <span class="dash-card-unit">${suggestedUnit}</span></div>
            <div class="dash-card-detail">${suggestedDetail}</div>
            <span class="dash-card-arrow">›</span>
          </a>
        </div>
      </div>

      <a class="dashboard-cta" data-scan-id="${scanId}">
        View Full Dashboard →
      </a>
    </div>
  `;
}

// ============================================
// Attach Event Handlers for Dynamic Cards
// ============================================

function attachDashboardCardHandlers() {
  // Individual card clicks -> open specific dashboard tab
  const cards = document.querySelectorAll('.dash-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = card.getAttribute('data-tab');
      const scanId = card.getAttribute('data-scan-id');
      if (CAPTURE_DEBUG) debugLog('log', `[AlgorithmLens] Opening dashboard tab: ${tab}, scanId: ${scanId}`);
      chrome.runtime.sendMessage({
        action: 'OPEN_DASHBOARD',
        tab: tab,
        scanId: scanId
      });
    });
  });

  // CTA button -> open dashboard overview
  const cta = document.querySelector('.dashboard-cta');
  if (cta) {
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      const scanId = cta.getAttribute('data-scan-id');
      if (CAPTURE_DEBUG) debugLog('log', `[AlgorithmLens] Opening full dashboard, scanId: ${scanId}`);
      chrome.runtime.sendMessage({
        action: 'OPEN_DASHBOARD',
        tab: 'overview',
        scanId: scanId
      });
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

    const errorMessage = error.message || '';
    const isConnectionError =
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('message port closed');

    if (isConnectionError) {
      statusEl.innerHTML = `
        <strong>Page refresh needed</strong><br>
        <small>Please refresh the page and try again.</small>
      `;
    } else {
      statusEl.innerHTML = `
        <strong>Error</strong><br>
        <small>${errorMessage || 'Could not start session'}</small>
      `;
    }

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

    if (!response.success) {
      if (response.alreadyProcessed) {
        if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Ignoring duplicate stop request');
        return;
      }

      if (response.needsRefresh) {
        sessionActive = false;
        sessionStartTime = null;
        statusEl.className = 'status unsupported';
        statusEl.innerHTML = `
          <strong>Connection Lost</strong><br>
          <small>Lost connection to the page. Please refresh and start a new session.</small>
        `;
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

    const errorMessage = error.message || '';
    const isConnectionError =
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('message port closed');

    if (isConnectionError) {
      statusEl.innerHTML = `
        <strong>Connection Lost</strong><br>
        <small>Lost connection to the page. Please refresh and start a new session.</small>
      `;
    } else {
      statusEl.innerHTML = `
        <strong>Error Processing Session</strong><br>
        <small>${errorMessage || 'Could not process session'}</small>
      `;
    }

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
