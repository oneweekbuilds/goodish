import { CAPTURE_DEBUG, debugLog } from '../shared/debug.js';
import { SUPPORTED_SCAN_PLATFORMS, PLATFORM_DISPLAY_NAMES, STORAGE_KEYS } from '../shared/constants.js';
import { initSentry, captureError, addBreadcrumb } from '../shared/sentry.js';

// Initialize Sentry in the popup context
initSentry('popup');

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
 * (Audit 8 H9) Escape text for use in HTML attribute context (e.g., data-scan-id)
 * Prevents attribute injection if scanId contains quotes or special chars
 */
function escapeAttr(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
// Onboarding Flow
// ============================================

const onboardingOverlay = document.getElementById('onboardingOverlay');
const mainContent = document.getElementById('mainContent');
const onboardingNavBtn = document.getElementById('onboardingNavBtn');
const onboardingAiToggle = document.getElementById('onboardingAiToggle');

let onboardingStep = 0;
const ONBOARDING_TOTAL_STEPS = 3;

/**
 * Check if onboarding has been completed. If not, show the onboarding flow.
 * Uses chrome.storage.local (device-local, NOT sync).
 */
async function initOnboarding() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.ONBOARDING_COMPLETE]);
    if (result[STORAGE_KEYS.ONBOARDING_COMPLETE] === true) {
      // Onboarding already done — show main content directly
      showMainContent();
    } else {
      // First install — show onboarding
      showOnboarding();
    }
  } catch (e) {
    console.error('[AlgorithmLens] Error checking onboarding state:', e);
    // Fallback: show main content on error
    showMainContent();
  }
}

function showOnboarding() {
  if (onboardingOverlay) onboardingOverlay.classList.remove('hidden');
  if (mainContent) mainContent.style.display = 'none';
  updateOnboardingSlide(0);

  // Wire up detail toggles on consent screen
  const toggleSent = document.getElementById('toggleSentDetails');
  const sentBody = document.getElementById('sentDetailsBody');
  const toggleNotSent = document.getElementById('toggleNotSentDetails');
  const notSentBody = document.getElementById('notSentDetailsBody');

  if (toggleSent && sentBody) {
    toggleSent.addEventListener('click', () => {
      const isOpen = sentBody.style.display !== 'none';
      sentBody.style.display = isOpen ? 'none' : 'block';
      toggleSent.textContent = isOpen ? 'What gets sent ›' : 'What gets sent ‹';
    });
  }
  if (toggleNotSent && notSentBody) {
    toggleNotSent.addEventListener('click', () => {
      const isOpen = notSentBody.style.display !== 'none';
      notSentBody.style.display = isOpen ? 'none' : 'block';
      toggleNotSent.textContent = isOpen ? "What doesn't get sent ›" : "What doesn't get sent ‹";
    });
  }
}

function showMainContent() {
  if (onboardingOverlay) onboardingOverlay.classList.add('hidden');
  if (mainContent) mainContent.style.display = 'block';
  // Now initialize normal popup logic
  checkCurrentTab();
  // [Equalization P2] Fetch plan status and load scan history
  fetchAndDisplayPlan().then(() => {
    loadScanHistory();
  });
}

function updateOnboardingSlide(step) {
  onboardingStep = step;

  // Update slides
  const slides = document.querySelectorAll('.onboarding-slide');
  slides.forEach((slide, idx) => {
    slide.classList.remove('active', 'exit-left');
    if (idx === step) {
      slide.classList.add('active');
    } else if (idx < step) {
      slide.classList.add('exit-left');
    }
  });

  // Update dots
  const dots = document.querySelectorAll('.onboarding-dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === step);
  });

  // Update button text
  if (onboardingNavBtn) {
    if (step === ONBOARDING_TOTAL_STEPS - 1) {
      onboardingNavBtn.textContent = 'Get Started';
      onboardingNavBtn.setAttribute('aria-label', 'Complete setup and get started');
    } else {
      onboardingNavBtn.textContent = 'Next';
      onboardingNavBtn.setAttribute('aria-label', 'Next step');
    }
  }
}

async function completeOnboarding() {
  try {
    // Save onboarding completion flag (device-local only)
    await chrome.storage.local.set({ [STORAGE_KEYS.ONBOARDING_COMPLETE]: true });

    // Save AI consent preference from onboarding toggle
    const aiEnabled = onboardingAiToggle ? onboardingAiToggle.checked : false;
    await chrome.storage.local.set({ [STORAGE_KEYS.AI_CONSENT_ENABLED]: aiEnabled });

    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Onboarding complete, AI consent:', aiEnabled);
  } catch (e) {
    console.error('[AlgorithmLens] Error saving onboarding state:', e);
  }

  // Transition to main content
  showMainContent();
}

if (onboardingNavBtn) {
  onboardingNavBtn.addEventListener('click', () => {
    if (onboardingStep < ONBOARDING_TOTAL_STEPS - 1) {
      updateOnboardingSlide(onboardingStep + 1);
    } else {
      completeOnboarding();
    }
  });
}

// ============================================
// DOM Elements
// ============================================

const statusEl = document.getElementById('status');
const scanButton = document.getElementById('scanButton');
const sessionTimerEl = document.getElementById('sessionTimer');
const aiConsentToggle = document.getElementById('aiConsentToggle');
const aiConsentSection = document.getElementById('aiConsentSection');
const planBadgeEl = document.getElementById('planBadge');
const recentScansSection = document.getElementById('recentScansSection');
const recentScansList = document.getElementById('recentScansList');
const recentScansHeader = document.getElementById('recentScansHeader');
const recentScansToggle = document.getElementById('recentScansToggle');

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
let userPlan = 'free'; // Default fail-closed
let isAuthenticated = false;

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
        // Reddit scanner exists but may be temporarily disabled via SUPPORTED_SCAN_PLATFORMS.
        // This block only triggers if reddit is removed from that list.
        statusEl.innerHTML = `
          <div class="unsupported-content">
            <strong>Reddit scanning is coming soon</strong>
            <p class="unsupported-hint">We're working on compatibility with Reddit's layout. Try one of these platforms in the meantime:</p>
            <div class="unsupported-platforms">
              <span class="unsupported-platform-tag">Instagram</span>
              <span class="unsupported-platform-tag">TikTok</span>
              <span class="unsupported-platform-tag">YouTube</span>
              <span class="unsupported-platform-tag">X / Twitter</span>
              <span class="unsupported-platform-tag">Facebook</span>
            </div>
          </div>
        `;
      } else {
        // [Onboarding] Improved unsupported state with platform list
        statusEl.innerHTML = `
          <div class="unsupported-content">
            <strong>This page isn't supported yet</strong>
            <p class="unsupported-hint">AlgorithmLens works on these platforms. Navigate to one to start scanning:</p>
            <div class="unsupported-platforms">
              <span class="unsupported-platform-tag">Instagram</span>
              <span class="unsupported-platform-tag">TikTok</span>
              <span class="unsupported-platform-tag">YouTube</span>
              <span class="unsupported-platform-tag">X / Twitter</span>
              <span class="unsupported-platform-tag">Facebook</span>
              <span class="unsupported-platform-tag">LinkedIn</span>
            </div>
          </div>
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

    // [Accessibility] Auto-focus the primary action after state check
    focusPrimaryAction();

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

  // [Accessibility] Screen readers will announce "Ready to scan [platform]" via aria-live
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
  small.textContent = 'Scroll naturally through your feed for at least 30 seconds. The more you scroll, the more complete your analysis will be.';

  statusEl.appendChild(strong);
  statusEl.appendChild(br);
  statusEl.appendChild(small);

  scanButton.textContent = 'Stop & Analyze Session';
  scanButton.className = 'scan-button stop';
  scanButton.disabled = false;
  startTimer();
}

// ============================================
// Micro-Chart SVG Renderers (Equalization: Data Visualization P1)
// ============================================

/**
 * Render a stacked horizontal bar showing composition segments.
 * Used for Overview (organic/suggested/ads), Tone (segment breakdown), etc.
 * @param {Array<{label: string, value: number, color: string}>} segments
 * @param {string} ariaLabel - Accessible description of the chart
 * @returns {string} SVG markup or empty string if insufficient data
 */
function renderMicroSegments(segments, ariaLabel) {
  if (!segments || segments.length === 0) return '';
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
  if (total === 0) return '';
  const width = 120;
  const height = 14;
  const rx = 4;
  let parts = '';
  let x = 0;
  segments.forEach((seg, i) => {
    const segWidth = Math.max(0, (seg.value / total) * width);
    if (segWidth > 0) {
      // First and last segments get rounded corners via clip-path; middle segments are rectangular
      if (i === 0 && segments.length === 1) {
        parts += `<rect x="${x}" y="0" width="${segWidth}" height="${height}" rx="${rx}" fill="${seg.color}" />`;
      } else if (i === 0) {
        parts += `<rect x="${x}" y="0" width="${segWidth + rx}" height="${height}" rx="${rx}" fill="${seg.color}" /><rect x="${x + rx}" y="0" width="${Math.max(0, segWidth - rx)}" height="${height}" fill="${seg.color}" />`;
      } else if (i === segments.length - 1) {
        parts += `<rect x="${x}" y="0" width="${segWidth + rx}" height="${height}" rx="${rx}" fill="${seg.color}" /><rect x="${x}" y="0" width="${rx}" height="${height}" fill="${seg.color}" />`;
      } else {
        parts += `<rect x="${x}" y="0" width="${segWidth}" height="${height}" fill="${seg.color}" />`;
      }
      x += segWidth;
    }
  });
  return `<div class="micro-chart micro-chart-fade"><svg width="${width}" height="${height}" role="img" aria-label="${escapeAttr(ariaLabel)}"><rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="#F1F5F9" />${parts}</svg></div>`;
}

/**
 * Render a single horizontal fill bar (0–100%).
 * Used for Ad Percentage, Political Exposure, etc.
 * @param {number} percent - Value 0–100
 * @param {string} color - Fill color
 * @param {string} ariaLabel - Accessible description
 * @returns {string} SVG markup or empty string
 */
function renderMicroBar(percent, color, ariaLabel) {
  if (percent === null || percent === undefined || isNaN(percent)) return '';
  const safeVal = Math.max(0, Math.min(100, percent));
  const width = 120;
  const height = 12;
  const rx = 4;
  const fillWidth = (safeVal / 100) * width;
  return `<div class="micro-chart micro-chart-fade"><svg width="${width}" height="${height}" role="img" aria-label="${escapeAttr(ariaLabel)}"><rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="#F1F5F9" /><rect x="0" y="0" width="${fillWidth}" height="${height}" rx="${rx}" fill="${color}" style="transition: width 0.3s ease" /></svg></div>`;
}

/**
 * Render a split bar showing two-part ratio (e.g., suggested vs followed).
 * @param {number} leftPct - Left segment percentage (0–100)
 * @param {number} rightPct - Right segment percentage (0–100)
 * @param {string} leftColor - Left segment color
 * @param {string} rightColor - Right segment color
 * @param {string} ariaLabel - Accessible description
 * @returns {string} SVG markup or empty string
 */
function renderMicroSplitBar(leftPct, rightPct, leftColor, rightColor, ariaLabel) {
  if ((leftPct === 0 && rightPct === 0) || (isNaN(leftPct) && isNaN(rightPct))) return '';
  const total = (leftPct || 0) + (rightPct || 0);
  if (total === 0) return '';
  const width = 120;
  const height = 14;
  const rx = 4;
  const leftWidth = ((leftPct || 0) / total) * width;
  const rightWidth = width - leftWidth;
  let parts = '';
  if (leftWidth > 0) {
    parts += `<rect x="0" y="0" width="${leftWidth + rx}" height="${height}" rx="${rx}" fill="${leftColor}" /><rect x="${rx}" y="0" width="${Math.max(0, leftWidth - rx)}" height="${height}" fill="${leftColor}" />`;
  }
  if (rightWidth > 0) {
    parts += `<rect x="${leftWidth}" y="0" width="${rightWidth + rx}" height="${height}" rx="${rx}" fill="${rightColor}" /><rect x="${leftWidth}" y="0" width="${rx}" height="${height}" fill="${rightColor}" />`;
  }
  return `<div class="micro-chart micro-chart-fade"><svg width="${width}" height="${height}" role="img" aria-label="${escapeAttr(ariaLabel)}"><rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="#F1F5F9" />${parts}</svg></div>`;
}

/**
 * Render mini horizontal bars showing top sources by post count.
 * @param {Array<{name: string, count: number}>} sources - Top sources with counts
 * @param {string} ariaLabel - Accessible description
 * @returns {string} SVG markup or empty string
 */
function renderMicroSourceBars(sources, ariaLabel) {
  if (!sources || sources.length === 0) return '';
  const top = sources.slice(0, 4);
  const maxCount = Math.max(...top.map(s => s.count || 0));
  if (maxCount === 0) return '';
  const width = 120;
  const barHeight = 5;
  const gap = 3;
  const height = top.length * (barHeight + gap) - gap;
  const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];
  let bars = '';
  top.forEach((source, i) => {
    const y = i * (barHeight + gap);
    const barWidth = Math.max(4, ((source.count || 0) / maxCount) * width);
    bars += `<rect x="0" y="${y}" width="${barWidth}" height="${barHeight}" rx="2" fill="${colors[i % colors.length]}" />`;
  });
  return `<div class="micro-chart micro-chart-fade"><svg width="${width}" height="${height}" role="img" aria-label="${escapeAttr(ariaLabel)}">${bars}</svg></div>`;
}

/**
 * Render a political spectrum bar with a marker position.
 * @param {number} percent - Political content percentage (0–100)
 * @param {string} ariaLabel - Accessible description
 * @returns {string} SVG markup or empty string
 */
function renderMicroSpectrum(percent, ariaLabel) {
  if (percent === null || percent === undefined || isNaN(percent)) return '';
  const width = 120;
  const height = 14;
  const rx = 4;
  const safeVal = Math.max(0, Math.min(100, percent));
  // Gradient from blue through gray to red for spectrum feel
  return `<div class="micro-chart micro-chart-fade"><svg width="${width}" height="${height}" role="img" aria-label="${escapeAttr(ariaLabel)}"><defs><linearGradient id="spectrumGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#3B82F6" stop-opacity="0.3" /><stop offset="50%" stop-color="#94A3B8" stop-opacity="0.3" /><stop offset="100%" stop-color="#EF4444" stop-opacity="0.3" /></linearGradient></defs><rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="url(#spectrumGrad)" /><rect x="${Math.max(0, (safeVal / 100) * width - 3)}" y="0" width="6" height="${height}" rx="2" fill="#6366F1" /></svg></div>`;
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
  // Distinct messages: auth error vs upload failure (per epistemic restraint audit)
  let authErrorBanner = '';
  if (!backendSaved && backendResponse?.isAuthError) {
    authErrorBanner = `
      <div class="saved-banner auth-error">
        <div class="saved-icon">🔑</div>
        <div class="saved-text">
          <strong>Scan captured locally</strong>
          <small>Sign in at algorithmlens.com to save scans to your dashboard and unlock full analysis.</small>
        </div>
      </div>
    `;
  } else if (!backendSaved && backendResponse && !backendResponse.success) {
    authErrorBanner = `
      <div class="saved-banner save-error">
        <div class="saved-icon">⚠️</div>
        <div class="saved-text">
          <strong>Scan captured but upload failed</strong>
          <small>Your data is saved locally — we'll retry automatically.</small>
        </div>
      </div>
    `;
  }

  // --- Build micro-chart SVGs for each card ---
  // Charts degrade gracefully: if data is insufficient, the variable stays empty string

  // Overview chart: stacked segments showing organic vs suggested vs ads composition
  const organicCount = Math.max(0, totalItems - totalAds - (svf.suggested_count || Math.round((svf.suggested_percentage || 0) * totalItems)));
  const suggestedCount = svf.suggested_count || Math.round((svf.suggested_percentage || 0) * totalItems);
  const overviewChart = totalItems > 0 ? renderMicroSegments([
    { label: 'Organic', value: organicCount, color: '#2563EB' },
    { label: 'Suggested', value: suggestedCount, color: '#10B981' },
    { label: 'Ads', value: totalAds, color: '#94A3B8' }
  ], `Feed composition: ${organicCount} organic, ${suggestedCount} suggested, ${totalAds} ads out of ${totalItems} posts`) : '';

  // Ads chart: single fill bar showing ad percentage
  const adsChart = totalItems > 0 ? renderMicroBar(adPercent, adPercent > 25 ? '#EF4444' : adPercent > 15 ? '#F59E0B' : '#2563EB', `Ad percentage: ${adPercent}% of feed`) : '';

  // Sources chart: mini horizontal bars for top creators
  const topCreators = uniqueCreators.slice(0, 4).map(name => {
    const count = (result.feed_items || []).filter(item => {
      const creator = item.creator_name || item.author || item.source || '';
      return creator === name;
    }).length;
    return { name, count: count || 1 };
  });
  const sourcesChart = renderMicroSourceBars(topCreators, `Top sources: ${topCreators.map(c => c.name).join(', ')}`);

  // Suggested vs Followed chart: split bar
  const suggestedChart = (suggestedPct > 0 || followedPct > 0)
    ? renderMicroSplitBar(suggestedPct, followedPct, '#10B981', '#2563EB', `Suggested ${suggestedPct}% vs Followed ${followedPct}%`)
    : '';

  // --- Build the 6 dashboard cards ---

  // Card 1: Overview — show feed diversity insight, not a repeat of the header
  // SECURITY: Escape user data to prevent XSS
  // Copy uses observational language per epistemic restraint standards
  let overviewValue, overviewUnit, overviewDetail;
  if (topTopic && topTopic.topic) {
    overviewValue = escapeHtml(topTopic.topic);
    overviewUnit = '';
    overviewDetail = topTopics.length > 1
      ? `Top category · ${topTopics.length} topics appeared`
      : 'Most frequent topic in this snapshot';
  } else if (topHashtags.length > 0) {
    overviewValue = `#${escapeHtml(topHashtags[0].tag)}`;
    overviewUnit = '';
    overviewDetail = `Appeared ${topHashtags[0].count}× · ${topHashtags.length} hashtags total`;
  } else {
    overviewValue = totalItems;
    overviewUnit = 'posts';
    overviewDetail = `Captured in ${durationMin} on ${platformLabel}`;
  }

  // Card 2: Sources — unique creators with diversity insight
  // SECURITY: Escape user data to prevent XSS
  let sourcesDetail;
  if (creatorCount === 0) {
    sourcesDetail = 'Creator data not available for this platform';
  } else if (topCreator) {
    const escapedCreator = escapeHtml(topCreator);
    sourcesDetail = creatorRatio > 0.8
      ? `High variety · most frequent: ${escapedCreator}`
      : `Most frequent: ${escapedCreator}`;
  } else {
    sourcesDetail = `${creatorCount} unique across ${totalItems} posts`;
  }

  // Card 3: Ads — percentage of feed that contained ads
  const adsValue = `${adPercent}%`;
  const adsUnit = 'ads appeared';
  let adsDetail;
  if (totalAds === 0) {
    adsDetail = 'No sponsored content detected in this snapshot';
  } else if (sponsorCount > 0) {
    adsDetail = `${totalAds} ad${totalAds !== 1 ? 's' : ''} from ${sponsorCount} brand${sponsorCount !== 1 ? 's' : ''}`;
  } else {
    adsDetail = `${totalAds} sponsored post${totalAds !== 1 ? 's' : ''} appeared`;
  }
  // SECURITY: Escape user data to prevent XSS
  const escapedAdsDetail = escapeHtml(adsDetail);

  // Card 4: Suggested vs Followed — always show a number, never "—"
  let suggestedValue, suggestedUnit, suggestedDetail;
  if (suggestedPct > 0 || followedPct > 0) {
    suggestedValue = `${suggestedPct}%`;
    suggestedUnit = 'suggested content';
    suggestedDetail = `${followedPct}% from accounts you follow`;
  } else {
    suggestedValue = '0%';
    suggestedUnit = 'suggested content';
    suggestedDetail = `${platformLabel} may not expose this signal`;
  }
  // SECURITY: Escape user data to prevent XSS
  const escapedSuggestedDetail = escapeHtml(suggestedDetail);

  // --- Build AI-specific cards (Politics, Tone) if AI data available ---
  // Card 5: Politics — only shown when AI analysis was enabled and data returned
  let politicsCard = '';
  if (aiDataAvailable) {
    const politicsData = backendResponse?.politics_percentage;
    const politicsPct = politicsData !== undefined ? Math.round(politicsData * 100) : null;
    const politicsValue = politicsPct !== null ? `${politicsPct}%` : '—';
    const politicsDetail = politicsPct !== null
      ? 'Political keywords appeared in this share of posts'
      : 'Available after AI analysis completes';
    const politicsChart = politicsPct !== null
      ? renderMicroSpectrum(politicsPct, `Political exposure: ${politicsPct}% of posts contained political keywords`)
      : '';
    politicsCard = `
          <a class="dash-card" data-tab="politics" data-scan-id="${escapeAttr(scanId)}" role="button" tabindex="0" aria-label="View Political Exposure on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Political Exposure</div>
            <div class="dash-card-value">${politicsValue} <span class="dash-card-unit">political</span></div>
            ${politicsChart}
            <div class="dash-card-detail">${politicsDetail}</div>
            <div class="dash-card-methodology" role="tooltip">Political content identified by keyword matching for elections, policy, and political figures. Keyword matching has limitations and cannot detect nuance or context.</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>
    `;
  }

  // Card 6: Tone — only shown when AI analysis was enabled and data returned
  let toneCard = '';
  if (aiDataAvailable) {
    const toneData = backendResponse?.dominant_tone;
    const toneValue = toneData || '—';
    const toneDetail = toneData
      ? 'Most frequent emotional tone detected'
      : 'Available after AI analysis completes';
    // Build tone segments from backend breakdown if available, otherwise show simple indicator
    const toneBreakdown = backendResponse?.tone_breakdown || backendResponse?.tone_percentages;
    let toneChart = '';
    if (toneBreakdown && typeof toneBreakdown === 'object') {
      const toneColors = { positive: '#10B981', neutral: '#94A3B8', negative: '#3B82F6', mixed: '#F59E0B' };
      const toneSegments = Object.entries(toneBreakdown)
        .filter(([, v]) => v > 0)
        .map(([label, value]) => ({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          value: typeof value === 'number' && value <= 1 ? value * 100 : value,
          color: toneColors[label.toLowerCase()] || '#94A3B8'
        }));
      toneChart = renderMicroSegments(toneSegments, `Tone breakdown: ${toneSegments.map(s => `${s.label} ${Math.round(s.value)}%`).join(', ')}`);
    } else if (toneData) {
      // Fallback: show a simple bar representing dominant tone presence
      const toneColors = { positive: '#10B981', neutral: '#94A3B8', negative: '#3B82F6', mixed: '#F59E0B' };
      const dominantColor = toneColors[toneData.toLowerCase()] || '#2563EB';
      toneChart = renderMicroBar(70, dominantColor, `Dominant tone: ${escapeHtml(toneData)}`);
    }
    toneCard = `
          <a class="dash-card" data-tab="tone" data-scan-id="${escapeAttr(scanId)}" role="button" tabindex="0" aria-label="View Emotional Tone on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Emotional Tone</div>
            <div class="dash-card-value">${escapeHtml(toneValue)} <span class="dash-card-unit">tone</span></div>
            ${toneChart}
            <div class="dash-card-detail">${escapeHtml(toneDetail)}</div>
            <div class="dash-card-methodology" role="tooltip">Tone inferred from language patterns in post text. Sentiment detection has major limitations and cannot capture sarcasm, irony, or cultural context.</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>
    `;
  }

  return `
    <div class="scan-result">
      ${rateLimitBanner}
      ${authErrorBanner}

      <div class="result-header">
        <span class="result-count">${totalItems}</span>
        <span class="result-meta">posts captured in ${durationMin} on ${platformLabel}</span>
      </div>

      <div class="dashboard-preview">
        <div class="dashboard-cards">
          <a class="dash-card" data-tab="overview" data-scan-id="${escapeAttr(scanId)}" role="button" tabindex="0" aria-label="View Overview on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Overview</div>
            <div class="dash-card-value">${overviewValue} <span class="dash-card-unit">${overviewUnit}</span></div>
            ${overviewChart}
            <div class="dash-card-detail">${overviewDetail}</div>
            <div class="dash-card-methodology" role="tooltip">Topics classified by text patterns in post captions and hashtags. Classification is approximate and may not capture every nuance.</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>

          <a class="dash-card" data-tab="sources" data-scan-id="${escapeAttr(scanId)}" role="button" tabindex="0" aria-label="View Sources on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Sources</div>
            <div class="dash-card-value">${creatorCount} <span class="dash-card-unit">${creatorCount === 1 ? 'creator' : 'creators'}</span></div>
            ${sourcesChart}
            <div class="dash-card-detail">${sourcesDetail}</div>
            <div class="dash-card-methodology" role="tooltip">Sources counted by unique domain or creator handle. Algorithmic recommendations may amplify certain sources disproportionately.</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>

          <a class="dash-card" data-tab="ads" data-scan-id="${escapeAttr(scanId)}" role="button" tabindex="0" aria-label="View Ads and Sponsors on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Ads &amp; Sponsors</div>
            <div class="dash-card-value">${adsValue} <span class="dash-card-unit">${adsUnit}</span></div>
            ${adsChart}
            <div class="dash-card-detail">${escapedAdsDetail}</div>
            <div class="dash-card-methodology" role="tooltip">Ads identified by platform labels and promotional patterns. Some native ads or unlabeled sponsored content may not be detected.</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>

          <a class="dash-card" data-tab="suggested" data-scan-id="${escapeAttr(scanId)}" role="button" tabindex="0" aria-label="View Suggested vs Followed on dashboard">
            <div class="dash-card-indicator"></div>
            <div class="dash-card-name">Suggested vs Followed</div>
            <div class="dash-card-value">${suggestedValue} <span class="dash-card-unit">${suggestedUnit}</span></div>
            ${suggestedChart}
            <div class="dash-card-detail">${escapedSuggestedDetail}</div>
            <div class="dash-card-methodology" role="tooltip">Based on source-origin metadata from the platform. Accuracy depends on how clearly the platform labels suggested content.</div>
            <span class="dash-card-arrow" aria-hidden="true">›</span>
          </a>

          ${politicsCard}
          ${toneCard}
        </div>
      </div>

      <a class="dashboard-cta" data-scan-id="${escapeAttr(scanId)}" role="button" tabindex="0" aria-label="View full analysis with methodology details on your dashboard">
        View full analysis with methodology details on your dashboard →
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
  // [Accessibility] aria-live will announce this to screen readers
  statusEl.textContent = 'Scanning in progress';

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
    captureError(error, 'popup:start_session');
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
  // [Accessibility] aria-live will announce processing state to screen readers
  statusEl.textContent = 'Scanning in progress';
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

    // [Equalization P2] Save scan to history
    const scanId = response.result?.scan_metadata?.scan_id;
    saveScanToHistory(scanId, response.platform, response.postCount, response.durationSeconds);

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

    // [Accessibility] Announce results to screen readers and move focus
    // Use a separate aria-live announcement so screen readers catch the state change
    // (statusEl is now in "results" mode which is transparent/no-padding)
    const srAnnouncement = document.createElement('span');
    srAnnouncement.className = 'sr-only';
    srAnnouncement.setAttribute('role', 'status');
    srAnnouncement.setAttribute('aria-live', 'polite');
    srAnnouncement.textContent = 'Scan complete — results ready';
    statusEl.prepend(srAnnouncement);

    // Move focus to results container
    focusResults();

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
    captureError(error, 'popup:stop_session');
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
// Plan Status & Feature Gating (Equalization P2)
// ============================================

/**
 * Fetch the user's plan from the backend (via background script).
 * Updates the plan badge in footer and gates AI toggle for free users.
 * Fails closed: defaults to 'free' on any error.
 */
async function fetchAndDisplayPlan() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'GET_USER_PLAN' });

    if (response && response.success) {
      userPlan = response.plan || 'free';
      isAuthenticated = response.authenticated || false;
    }
  } catch (e) {
    if (CAPTURE_DEBUG) console.warn('[AlgorithmLens] Error fetching plan:', e);
    userPlan = 'free';
  }

  // Update plan badge
  if (planBadgeEl) {
    planBadgeEl.style.display = 'inline-block';
    if (userPlan === 'plus') {
      planBadgeEl.textContent = 'Plus';
      planBadgeEl.className = 'plan-badge plus';
    } else {
      planBadgeEl.textContent = 'Free';
      planBadgeEl.className = 'plan-badge free';
    }
  }

  // Gate AI toggle for free users
  gateAiToggle();
}

/**
 * Gate the AI toggle based on user plan.
 * Free users see the toggle with a "(Plus)" badge and an upsell hint.
 * The toggle is still visible but clicking it shows an upsell message.
 */
function gateAiToggle() {
  if (!aiConsentSection || !aiConsentToggle) return;

  // Remove any existing Plus badge and upsell hint
  const existingBadge = aiConsentSection.querySelector('.ai-plus-badge');
  if (existingBadge) existingBadge.remove();
  const existingHint = aiConsentSection.querySelector('.ai-upsell-hint');
  if (existingHint) existingHint.remove();

  if (userPlan === 'plus') {
    // Plus users: full access
    aiConsentSection.classList.remove('gated');
    aiConsentToggle.disabled = false;
    return;
  }

  // Free users: add "(Plus)" badge and upsell behavior
  const toggleLabel = aiConsentSection.querySelector('.toggle-label');
  if (toggleLabel && !toggleLabel.querySelector('.ai-plus-badge')) {
    const badge = document.createElement('span');
    badge.className = 'ai-plus-badge';
    badge.textContent = 'Plus';
    toggleLabel.appendChild(badge);
  }

  // Add upsell hint below the info text
  const upsellHint = document.createElement('p');
  upsellHint.className = 'ai-upsell-hint';
  upsellHint.textContent = 'Upgrade to Plus for AI-powered tone and political analysis.';
  aiConsentSection.appendChild(upsellHint);

  // If free user tries to enable AI toggle, show upsell and revert
  aiConsentToggle.addEventListener('change', handleFreeUserAiToggle);
}

function handleFreeUserAiToggle() {
  if (userPlan !== 'plus' && aiConsentToggle && aiConsentToggle.checked) {
    // Revert the toggle
    aiConsentToggle.checked = false;
    // Show the upsell hint
    aiConsentSection.classList.add('gated');
    // Brief highlight animation
    const hint = aiConsentSection.querySelector('.ai-upsell-hint');
    if (hint) {
      hint.style.color = '#D97706';
      hint.style.fontWeight = '600';
      setTimeout(() => {
        hint.style.fontWeight = '400';
      }, 1500);
    }
  }
}

// ============================================
// Scan History (Equalization P2)
// ============================================

/**
 * Save a scan to the Recent Scans history.
 * Stores last 5 scans in chrome.storage.local via background script.
 */
async function saveScanToHistory(scanId, platform, postCount, durationSeconds) {
  if (!scanId) return;

  const entry = {
    scanId,
    platform: platform || 'unknown',
    postCount: postCount || 0,
    durationSeconds: durationSeconds || 0,
    timestamp: Date.now()
  };

  try {
    await chrome.runtime.sendMessage({ action: 'SAVE_SCAN_HISTORY', entry });
    if (CAPTURE_DEBUG) debugLog('log', '[AlgorithmLens] Scan saved to history:', entry);
  } catch (e) {
    console.warn('[AlgorithmLens] Error saving scan to history:', e);
  }
}

/**
 * Load and render the Recent Scans section.
 */
async function loadScanHistory() {
  if (!recentScansSection || !recentScansList) return;

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    recentScansSection.style.display = 'block';
    recentScansList.innerHTML = '';
    const signInMsg = document.createElement('div');
    signInMsg.className = 'scan-history-signin';
    signInMsg.innerHTML = 'Sign in to save scans and view history on your <a href="https://algorithmlens.com" target="_blank" rel="noopener noreferrer">dashboard</a>.';
    recentScansList.appendChild(signInMsg);
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({ action: 'GET_SCAN_HISTORY' });
    const history = (response && response.history) || [];

    if (history.length === 0) {
      recentScansSection.style.display = 'block';
      recentScansList.innerHTML = '';
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'scan-history-empty';
      emptyMsg.textContent = 'No recent scans yet. Start scanning to build your history.';
      recentScansList.appendChild(emptyMsg);
      return;
    }

    recentScansSection.style.display = 'block';
    recentScansList.innerHTML = '';

    history.forEach(entry => {
      const item = document.createElement('a');
      item.className = 'scan-history-item';
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `View ${platformNames[entry.platform] || entry.platform} scan on dashboard`);

      const platformEl = document.createElement('span');
      platformEl.className = 'scan-history-platform';
      platformEl.textContent = platformNames[entry.platform] || entry.platform;

      const summaryEl = document.createElement('span');
      summaryEl.className = 'scan-history-summary';
      summaryEl.textContent = `${entry.postCount} posts scanned`;

      const dateEl = document.createElement('span');
      dateEl.className = 'scan-history-date';
      dateEl.textContent = formatScanDate(entry.timestamp);

      const arrowEl = document.createElement('span');
      arrowEl.className = 'scan-history-arrow';
      arrowEl.setAttribute('aria-hidden', 'true');
      arrowEl.textContent = '\u203A';

      item.appendChild(platformEl);
      item.appendChild(summaryEl);
      item.appendChild(dateEl);
      item.appendChild(arrowEl);

      // Click opens dashboard for this scan
      function openScanDashboard() {
        chrome.runtime.sendMessage({
          action: 'OPEN_DASHBOARD',
          tab: 'overview',
          scanId: entry.scanId
        });
      }

      item.addEventListener('click', (e) => {
        e.preventDefault();
        openScanDashboard();
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openScanDashboard();
        }
      });

      recentScansList.appendChild(item);
    });
  } catch (e) {
    if (CAPTURE_DEBUG) console.warn('[AlgorithmLens] Error loading scan history:', e);
  }
}

/**
 * Format a timestamp for scan history display.
 * Shows "Today HH:MM", "Yesterday HH:MM", or "Mon DD HH:MM".
 */
function formatScanDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const scanDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (scanDay.getTime() === today.getTime()) {
    return `Today ${timeStr}`;
  } else if (scanDay.getTime() === yesterday.getTime()) {
    return `Yesterday ${timeStr}`;
  } else {
    const monthDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${monthDay} ${timeStr}`;
  }
}

// Toggle recent scans list expand/collapse
if (recentScansHeader) {
  recentScansHeader.addEventListener('click', () => {
    const isExpanded = recentScansHeader.getAttribute('aria-expanded') === 'true';
    recentScansHeader.setAttribute('aria-expanded', !isExpanded);
    if (recentScansList) {
      recentScansList.classList.toggle('collapsed', isExpanded);
    }
    if (recentScansToggle) {
      recentScansToggle.classList.toggle('expanded', !isExpanded);
    }
  });
  recentScansHeader.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      recentScansHeader.click();
    }
  });
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initOnboarding();
});

if (document.readyState !== 'loading') {
  initOnboarding();
}

// ============================================
// Focus Management (Accessibility)
// ============================================

/**
 * [Accessibility] Auto-focus the primary action element.
 * Called after state transitions to ensure keyboard users land on the right element.
 */
function focusPrimaryAction() {
  // Small delay to let DOM update settle before focusing
  requestAnimationFrame(() => {
    const ctaButton = document.querySelector('.dashboard-cta');
    if (ctaButton) {
      // Results are showing — focus the CTA
      ctaButton.focus();
      return;
    }
    if (scanButton && !scanButton.disabled) {
      scanButton.focus();
    }
  });
}

/**
 * [Accessibility] Move focus to results container after scan completes.
 * Makes the scan-result div focusable and moves focus there.
 */
function focusResults() {
  requestAnimationFrame(() => {
    const resultsContainer = document.querySelector('.scan-result');
    if (resultsContainer) {
      resultsContainer.setAttribute('tabindex', '-1');
      resultsContainer.focus();
    }
  });
}

// ============================================
// AI Consent Toggle Persistence
// ============================================

async function loadAiConsentPreference() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.AI_CONSENT_ENABLED]);
    const enabled = result[STORAGE_KEYS.AI_CONSENT_ENABLED] === true;
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
    await chrome.storage.local.set({ [STORAGE_KEYS.AI_CONSENT_ENABLED]: enabled });
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
