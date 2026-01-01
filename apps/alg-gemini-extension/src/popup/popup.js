/**
 * AlgorithmLens Popup Script
 * 
 * Handles the extension popup UI for session-based feed scanning.
 * 
 * Session Flow:
 * 1. User clicks "Start Session Scan" -> session begins, badge set to REC, popup auto-closes
 * 2. User scrolls feed on the platform (posts are collected by content script)
 * 3. User clicks extension icon again -> popup shows timer and "Stop & Analyze Session"
 * 4. User clicks "Stop & Analyze Session" -> session ends, badge cleared, results displayed
 */

// ============================================
// Feature Flags
// ============================================

// Facebook scanning is disabled for MVP due to reliability issues
// Keep all Facebook code in place for future re-enable
const FACEBOOK_ENABLED_FOR_MVP = false;

console.log('[AlgorithmLens] Popup opened');

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

// Platforms that are currently supported for scanning
// (Reddit is temporarily disabled - keep code in place for future re-enable)
const SUPPORTED_SCAN_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter'];

// Platform display names
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
    // Check if we're on Facebook (which is disabled for MVP)
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeUrl = activeTab?.url || '';
    const isFacebookPage = activeUrl.includes('facebook.com');
    
    if (isFacebookPage && !FACEBOOK_ENABLED_FOR_MVP) {
      console.log('[AlgorithmLens] Facebook detected but disabled for MVP');
      isSupported = false;
      currentPlatform = null;
      sessionActive = false;
      
      statusEl.className = 'status unsupported';
      statusEl.innerHTML = `
        <strong>Facebook support coming soon</strong><br>
        <small>Facebook scanning is in beta and not available in this version. AlgorithmLens currently supports TikTok, Instagram, YouTube, and X/Twitter.</small>
      `;
      
      scanButton.disabled = true;
      scanButton.textContent = 'Start Session Scan';
      scanButton.className = 'scan-button';
      stopTimer();
      return;
    }
    
    // First check platform support
    const platformResponse = await chrome.runtime.sendMessage({ type: 'CHECK_PLATFORM' });
    console.log('[AlgorithmLens] Platform check response:', platformResponse);
    
    currentTabId = platformResponse.tabId;
    
    // Check if platform is detected but not in our supported list
    // (e.g., Reddit is detected but temporarily disabled)
    const platformDetected = platformResponse.platform;
    const isSupportedPlatform = platformDetected && SUPPORTED_SCAN_PLATFORMS.includes(platformDetected);
    
    if (!platformResponse.supported || !isSupportedPlatform) {
      isSupported = false;
      currentPlatform = null;
      sessionActive = false;
      
      statusEl.className = 'status unsupported';
      
      // Show a specific message for Reddit (temporarily disabled)
      if (platformDetected === 'reddit') {
        statusEl.innerHTML = `
          <strong>Reddit support coming soon</strong><br>
          <small>Reddit scanning is temporarily disabled while we improve it.</small>
        `;
      } else {
        statusEl.innerHTML = `
          Navigate to TikTok, Instagram, YouTube, or Twitter/X to start a session scan.
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
    
    // Check session state from background
    const sessionResponse = await chrome.runtime.sendMessage({ action: 'GET_SESSION_STATE' });
    console.log('[AlgorithmLens] Session state response:', sessionResponse);
    
    if (sessionResponse.active && sessionResponse.startTime) {
      // Session is active - show stop UI
      sessionActive = true;
      sessionStartTime = sessionResponse.startTime;
      currentPlatform = sessionResponse.platform || currentPlatform;
      showSessionActiveState();
    } else {
      // No active session - show start UI
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
    <strong>📡 Recording on ${platformNames[currentPlatform] || currentPlatform}</strong><br>
    <small>Scroll your feed to capture posts. Click "Stop" when ready to analyze.</small>
  `;
  scanButton.textContent = 'Stop & Analyze Session';
  scanButton.className = 'scan-button stop';
  scanButton.disabled = false;
  startTimer();
}

// ============================================
// Format Results
// ============================================

function formatUnifiedResults(result, durationSeconds, backendSaved = false, backendResponse = null, rateLimited = false) {
  const { aggregates, scan_metadata, _computed } = result;
  
  // Case 1: No posts captured at all
  if (!aggregates || aggregates.total_feed_items === 0) {
    // Different message if rate limit was hit (shouldn't happen with 0 posts, but handle it)
    if (rateLimited) {
      return `
        <div class="scan-result">
          <div class="result-header">⚠️ Session slowed down</div>
          <div class="result-detail">The feed was updating very quickly. Try scrolling more slowly and start a new scan.</div>
        </div>
      `;
    }
    return `
      <div class="scan-result">
        <div class="result-header">No posts captured</div>
        <div class="result-detail">Try scrolling more before stopping the session, then start a new scan.</div>
      </div>
    `;
  }
  
  const totalItems = aggregates.total_feed_items;
  const totalAds = aggregates.total_ads;
  const adPercent = Math.round(aggregates.ad_percentage * 100);
  const politicalPercent = Math.round((aggregates.political_content_summary?.political_percentage || 0) * 100);
  
  // Valence distribution
  const valence = aggregates.wellbeing_summary?.valence_distribution || {};
  const totalValence = (valence.POSITIVE || 0) + (valence.NEUTRAL || 0) + (valence.NEGATIVE || 0) + (valence.MIXED || 0);
  const positivePercent = totalValence > 0 ? Math.round((valence.POSITIVE || 0) / totalValence * 100) : 0;
  const negativePercent = totalValence > 0 ? Math.round((valence.NEGATIVE || 0) / totalValence * 100) : 0;
  
  // Top topics
  const topTopics = (aggregates.topic_distribution || []).slice(0, 4);
  
  // Top hashtags (from _computed)
  const topHashtags = (_computed?.topHashtags || []).slice(0, 6);
  
  // Top CTAs
  const topCTAs = (aggregates.engagement_pattern_summary?.top_hooks || []).slice(0, 3);
  
  // Wellbeing themes
  const wellbeingThemes = _computed?.wellbeingThemes || [];
  
  // Build rate limit banner if triggered
  let rateLimitBanner = '';
  if (rateLimited) {
    rateLimitBanner = `
      <div class="saved-banner warning">
        <div class="saved-icon">⚡</div>
        <div class="saved-text">
          <strong>Session slowed down</strong>
          <small>The feed was updating quickly. We captured ${aggregates.total_feed_items} posts to keep your browser responsive.</small>
        </div>
      </div>
    `;
  }
  
  // Build saved confirmation banner
  let savedBanner = '';
  if (backendSaved && backendResponse) {
    savedBanner = `
      <div class="saved-banner">
        <div class="saved-icon">✅</div>
        <div class="saved-text">
          <strong>Saved to your history</strong>
          <small>View detailed insights in the dashboard</small>
        </div>
      </div>
      <button id="viewDashboard" class="dashboard-button">
        📊 View in Dashboard
      </button>
    `;
  } else if (backendSaved === false && backendResponse?.error) {
    savedBanner = `
      <div class="saved-banner error">
        <div class="saved-icon">⚠️</div>
        <div class="saved-text">
          <strong>Could not save to history</strong>
          <small>${backendResponse.error}</small>
        </div>
      </div>
    `;
  }
  
  // Format duration for display
  const durationDisplay = durationSeconds ? `${durationSeconds}s session` : '';
  
  return `
    <div class="scan-result">
      ${rateLimitBanner}
      ${savedBanner}
      
      <div class="result-header">
        ✅ Analyzed ${totalItems} posts ${durationDisplay ? `(${durationDisplay})` : ''}
      </div>
      
      <div class="result-stats">
        <div class="stat">
          <span class="stat-value ${adPercent > 20 ? 'high' : ''}">${adPercent}%</span>
          <span class="stat-label">Ads</span>
        </div>
        <div class="stat">
          <span class="stat-value ${positivePercent > 50 ? 'positive' : ''}">${positivePercent}%</span>
          <span class="stat-label">Positive</span>
        </div>
        <div class="stat">
          <span class="stat-value ${negativePercent > 30 ? 'negative' : ''}">${negativePercent}%</span>
          <span class="stat-label">Negative</span>
        </div>
      </div>
      
      ${topTopics.length > 0 ? `
        <div class="result-section">
          <div class="section-title">Top Topics</div>
          <div class="topic-list">
            ${topTopics.map(t => `
              <span class="topic">${t.category} <small>${Math.round(t.percentage * 100)}%</small></span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${topHashtags.length > 0 ? `
        <div class="result-section">
          <div class="section-title">Top Hashtags</div>
          <div class="hashtag-list">
            ${topHashtags.map(h => `<span class="hashtag">${h.tag}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      
      ${topCTAs.length > 0 ? `
        <div class="result-section">
          <div class="section-title">Call-to-Actions (${_computed?.totalCTAs || 0})</div>
          <div class="cta-list">
            ${topCTAs.map(c => `<span class="cta">${c.hook} <small>×${c.count}</small></span>`).join('')}
          </div>
        </div>
      ` : ''}
      
      ${wellbeingThemes.length > 0 ? `
        <div class="result-section">
          <div class="section-title">Wellbeing Themes</div>
          <div class="theme-list">
            ${wellbeingThemes.map(t => `<span class="theme">${t}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      
      ${politicalPercent > 0 ? `
        <div class="result-section political">
          <div class="section-title">Political Content</div>
          <span class="political-badge">${politicalPercent}% of posts</span>
        </div>
      ` : ''}
      
      <div class="result-footer">
        Platform: ${platformNames[scan_metadata.platform?.toLowerCase()] || scan_metadata.platform}<br>
        <small>Scan ID: ${scan_metadata.scan_id?.slice(0, 20)}...</small>
      </div>
    </div>
  `;
}

// ============================================
// Attach Event Handlers for Dynamic Elements
// ============================================

function attachDashboardButtonHandler() {
  const dashboardBtn = document.getElementById('viewDashboard');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
      console.log('[AlgorithmLens] Opening dashboard...');
      chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
    });
  }
}

// ============================================
// Session Scan Handlers
// ============================================

async function startSession() {
  console.log('[AlgorithmLens] Starting session scan...');
  
  // Safety check: prevent Facebook sessions even if button was somehow clicked
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeUrl = activeTab?.url || '';
    const isFacebookPage = activeUrl.includes('facebook.com');
    
    if (isFacebookPage && !FACEBOOK_ENABLED_FOR_MVP) {
      console.log('[AlgorithmLens] Blocking Facebook session start (MVP restriction)');
      statusEl.className = 'status unsupported';
      statusEl.innerHTML = `
        <strong>Facebook support coming soon</strong><br>
        <small>Facebook scanning is coming soon. For now, AlgorithmLens works on TikTok, Instagram, YouTube, and X/Twitter.</small>
      `;
      scanButton.disabled = true;
      return;
    }
  } catch (e) {
    console.error('[AlgorithmLens] Error checking tab URL:', e);
    // Continue with normal flow if tab check fails
  }
  
  scanButton.disabled = true;
  scanButton.textContent = 'Starting...';
  statusEl.className = 'status loading';
  statusEl.textContent = 'Starting session...';
  
  try {
    // Include AI consent in session start message
    const geminiConsent = getAiConsent();
    const response = await chrome.runtime.sendMessage({
      action: 'START_SESSION_SCAN',
      geminiConsent: geminiConsent
    });

    console.log('[AlgorithmLens] Start session response:', response, '(geminiConsent:', geminiConsent, ')');
    
    if (!response.success) {
      // Check if this is specifically a "needs refresh" scenario
      if (response.needsRefresh) {
        statusEl.className = 'status unsupported';
        statusEl.innerHTML = `
          <strong>🔄 Page refresh needed</strong><br>
          <small>Please refresh the page and try again. The extension needs to reload on this page.</small>
        `;
        scanButton.disabled = false;
        scanButton.textContent = 'Start Session Scan';
        scanButton.className = 'scan-button';
        return;
      }
      throw new Error(response.error || 'Failed to start session');
    }
    
    // Session started successfully
    sessionActive = true;
    sessionStartTime = response.startTime || Date.now();
    currentPlatform = response.platform;
    
    console.log('[AlgorithmLens] Session started, startTime:', sessionStartTime);
    
    // Auto-close the popup - badge is already set by background script
    // User can click icon again to see status or stop
    console.log('[AlgorithmLens] Auto-closing popup...');
    window.close();
    
  } catch (error) {
    console.error('[AlgorithmLens] Error starting session:', error);
    
    statusEl.className = 'status unsupported';
    
    // Check for connection errors that indicate content script isn't loaded
    const errorMessage = error.message || '';
    const isConnectionError = 
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('message port closed');
    
    if (isConnectionError) {
      statusEl.innerHTML = `
        <strong>🔄 Page refresh needed</strong><br>
        <small>Please refresh the page and try again. The extension needs to reload on this page.</small>
      `;
    } else {
      statusEl.innerHTML = `
        <strong>❌ Error</strong><br>
        <small>${errorMessage || 'Could not start session'}</small>
      `;
    }
    
    scanButton.disabled = false;
    scanButton.textContent = 'Start Session Scan';
    scanButton.className = 'scan-button';
  }
}

async function stopSessionAndAnalyze() {
  console.log('[AlgorithmLens] Stopping session and analyzing...');
  
  scanButton.disabled = true;
  scanButton.textContent = 'Analyzing...';
  statusEl.className = 'status loading';
  statusEl.textContent = 'Stopping session and processing...';
  stopTimer();
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'STOP_SESSION_SCAN_AND_PROCESS' });
    
    console.log('[AlgorithmLens] Stop session response:', response);
    
    if (!response.success) {
      // Check if this is a double-submit (already processing or already processed)
      if (response.alreadyProcessed) {
        console.log('[AlgorithmLens] Ignoring duplicate stop request - already processed');
        // Don't change UI state, just return (the first request is handling it)
        return;
      }

      // Check if this is specifically a "needs refresh" scenario
      if (response.needsRefresh) {
        sessionActive = false;
        sessionStartTime = null;

        statusEl.className = 'status unsupported';
        statusEl.innerHTML = `
          <strong>⚠️ Connection Lost</strong><br>
          <small>Lost connection to the page. Session data may have been lost due to page navigation. Please refresh and start a new session.</small>
        `;
        scanButton.disabled = false;
        scanButton.textContent = 'Start Session Scan';
        scanButton.className = 'scan-button';
        return;
      }
      throw new Error(response.error || 'Failed to process session');
    }
    
    // Session stopped and processed successfully
    sessionActive = false;
    sessionStartTime = null;
    
    lastUnifiedResult = response.result;
    lastBackendResponse = response.backendResponse;
    
    // Display results
    statusEl.className = 'status results';
    statusEl.innerHTML = formatUnifiedResults(
      response.result, 
      response.durationSeconds,
      response.backendSaved, 
      response.backendResponse,
      response.rateLimited
    );
    
    // Attach dashboard button handler
    attachDashboardButtonHandler();
    
    // Log full result to console
    console.log('[AlgorithmLens] ========================================');
    console.log('[AlgorithmLens] SESSION SCAN COMPLETE');
    console.log('[AlgorithmLens] ========================================');
    console.log('[AlgorithmLens] Duration:', response.durationSeconds, 'seconds');
    console.log('[AlgorithmLens] Posts collected:', response.postCount);
    console.log('[AlgorithmLens] Platform:', response.platform);
    console.log('[AlgorithmLens] Backend saved:', response.backendSaved);
    console.log('[AlgorithmLens] ----------------------------------------');
    console.log('[AlgorithmLens] FULL RESULT:');
    console.log(JSON.stringify(response.result, null, 2));
    console.log('[AlgorithmLens] ========================================');
    
    // Reset button state for new scan
    scanButton.disabled = false;
    scanButton.textContent = 'Start Session Scan';
    scanButton.className = 'scan-button';
    
  } catch (error) {
    console.error('[AlgorithmLens] Error processing session:', error);
    
    sessionActive = false;
    sessionStartTime = null;
    
    statusEl.className = 'status unsupported';
    
    // Check for connection errors
    const errorMessage = error.message || '';
    const isConnectionError = 
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('message port closed');
    
    if (isConnectionError) {
      statusEl.innerHTML = `
        <strong>⚠️ Connection Lost</strong><br>
        <small>Lost connection to the page. Session data may have been lost due to page navigation. Please refresh and start a new session.</small>
      `;
    } else {
      statusEl.innerHTML = `
        <strong>❌ Error Processing Session</strong><br>
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
    console.log('[AlgorithmLens] Scan attempted on unsupported platform');
    statusEl.className = 'status unsupported';
    statusEl.innerHTML = 'Go to TikTok, Instagram, YouTube, or Twitter/X to start a session scan.';
    return;
  }
  
  if (sessionActive) {
    // Session is active - stop and analyze
    await stopSessionAndAnalyze();
  } else {
    // No active session - start one
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

// Also run immediately in case DOMContentLoaded already fired
if (document.readyState !== 'loading') {
  checkCurrentTab();
}

// ============================================
// AI Consent Toggle Persistence
// ============================================

// Load saved consent preference (default OFF)
async function loadAiConsentPreference() {
  try {
    const result = await chrome.storage.local.get(['aiConsentEnabled']);
    const enabled = result.aiConsentEnabled === true; // Default to false
    if (aiConsentToggle) {
      aiConsentToggle.checked = enabled;
    }
    console.log('[AlgorithmLens] AI consent preference loaded:', enabled);
    return enabled;
  } catch (e) {
    console.error('[AlgorithmLens] Error loading AI consent preference:', e);
    return false;
  }
}

// Save consent preference
async function saveAiConsentPreference(enabled) {
  try {
    await chrome.storage.local.set({ aiConsentEnabled: enabled });
    console.log('[AlgorithmLens] AI consent preference saved:', enabled);
  } catch (e) {
    console.error('[AlgorithmLens] Error saving AI consent preference:', e);
  }
}

// Get current consent state
function getAiConsent() {
  return aiConsentToggle ? aiConsentToggle.checked : false;
}

// Toggle change handler
if (aiConsentToggle) {
  aiConsentToggle.addEventListener('change', () => {
    saveAiConsentPreference(aiConsentToggle.checked);
  });
}

// Load preference on popup open
loadAiConsentPreference();
