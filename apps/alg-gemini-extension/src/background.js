/**
 * AlgorithmLens Background Service Worker
 * 
 * Handles extension lifecycle events and coordinates between popup and content scripts.
 * Manages session scanning with duration tracking per tab.
 * 
 * Session Flow:
 * 1. START_SESSION_SCAN -> stores startTime per tab, sets REC badge, forwards to content script
 * 2. GET_SESSION_STATE -> returns session state for popup to check on open
 * 3. STOP_SESSION_SCAN_AND_PROCESS -> computes duration, gets posts, maps to UnifiedScanResult, sends to backend, clears badge
 */

import { mapDesktopPostsToUnifiedResult } from './desktop_mapper.js';

console.log('[AlgorithmLens] Background service worker active');

// ============================================================================
// DEBUG FLAG (temporary - remove after fixing capture issues)
// ============================================================================
const CAPTURE_DEBUG = true; // Set to false to disable all [CaptureDebug] logs

// ============================================
// Utility: Generate unique scan ID
// ============================================
function generateScanId() {
  return `desktop-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Backend API configuration
const BACKEND_URL = 'http://127.0.0.1:8000';
const DASHBOARD_URL = 'http://localhost:5173';

// Platforms that are currently supported for scanning
// (Reddit is temporarily disabled - keep code in place for future re-enable)
const SUPPORTED_SCAN_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter'];

// ============================================
// MVP Session Behavior Flag
// ============================================
// For MVP: sessions should only end when user explicitly clicks Stop.
// Set to false to disable automatic session clearing on tab navigation.
const AUTO_CLEAR_ON_NAVIGATION = false;

// ============================================
// Per-Tab Session State (persisted via chrome.storage.session)
// ============================================

// In-memory cache for quick access (synced with chrome.storage.session)
const sessionStateByTab = new Map();

// Storage key prefix for session state
const SESSION_STATE_KEY_PREFIX = 'session_';

/**
 * Get session state for a tab (async - reads from storage)
 * @param {number} tabId
 * @returns {Promise<{ startTime: number, platform: string, scanId: string, isProcessing?: boolean } | null>}
 */
async function getSessionState(tabId) {
  // Try in-memory cache first
  const cachedState = sessionStateByTab.get(tabId);
  if (cachedState) {
    console.log(`[AlgorithmLens] getSessionState(${tabId}) from cache:`, cachedState);
    return cachedState;
  }

  // Fall back to chrome.storage.session
  const key = SESSION_STATE_KEY_PREFIX + tabId;
  try {
    const result = await chrome.storage.session.get(key);
    const state = result[key] || null;
    if (state) {
      // Re-populate cache
      sessionStateByTab.set(tabId, state);
      console.log(`[AlgorithmLens] getSessionState(${tabId}) from storage:`, state);
    } else {
      console.log(`[AlgorithmLens] getSessionState(${tabId}): null (not found)`);
    }
    return state;
  } catch (err) {
    console.error(`[AlgorithmLens] Error reading session state for tab ${tabId}:`, err);
    return null;
  }
}

/**
 * Set session state for a tab (async - persists to storage)
 * @param {number} tabId
 * @param {{ startTime: number, platform: string, scanId: string, geminiConsent?: boolean, isProcessing?: boolean }} state
 */
async function setSessionState(tabId, state) {
  // Update in-memory cache
  sessionStateByTab.set(tabId, state);

  // Persist to chrome.storage.session
  const key = SESSION_STATE_KEY_PREFIX + tabId;
  try {
    await chrome.storage.session.set({ [key]: state });
    console.log(`[AlgorithmLens] Session START for tab ${tabId} at ${state.startTime} (${new Date(state.startTime).toISOString()}) - persisted`);
  } catch (err) {
    console.error(`[AlgorithmLens] Error persisting session state for tab ${tabId}:`, err);
  }
}

/**
 * Clear session state for a tab (async - removes from storage)
 * @param {number} tabId
 */
async function clearSessionState(tabId) {
  const state = sessionStateByTab.get(tabId);
  if (state) {
    console.log(`[AlgorithmLens] Session END for tab ${tabId}. Was started at ${state.startTime}`);
  }

  // Clear from cache
  sessionStateByTab.delete(tabId);

  // Clear from storage
  const key = SESSION_STATE_KEY_PREFIX + tabId;
  try {
    await chrome.storage.session.remove(key);
  } catch (err) {
    console.error(`[AlgorithmLens] Error clearing session state for tab ${tabId}:`, err);
  }
}

/**
 * Set recording badge on extension icon for a tab
 * @param {number} tabId 
 */
async function setRecordingBadge(tabId) {
  try {
    await chrome.action.setBadgeText({ text: 'REC', tabId });
    await chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId }); // Red
    console.log(`[AlgorithmLens] Badge set to REC for tab ${tabId}`);
  } catch (e) {
    console.warn('[AlgorithmLens] Failed to set badge:', e);
  }
}

/**
 * Clear recording badge on extension icon for a tab
 * @param {number} tabId 
 */
async function clearRecordingBadge(tabId) {
  try {
    await chrome.action.setBadgeText({ text: '', tabId });
    console.log(`[AlgorithmLens] Badge cleared for tab ${tabId}`);
  } catch (e) {
    console.warn('[AlgorithmLens] Failed to clear badge:', e);
  }
}

// Clean up session state and badge when tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (sessionStateByTab.has(tabId)) {
    await clearSessionState(tabId);
    console.log(`[AlgorithmLens] Cleaned up session state for closed tab ${tabId}`);
  }
});

// ============================================
// Extension Lifecycle
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[AlgorithmLens] Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    console.log('[AlgorithmLens] First-time installation');
  } else if (details.reason === 'update') {
    console.log('[AlgorithmLens] Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

// ============================================
// Message Handlers
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[AlgorithmLens] Background received message:', message.action || message.type);
  
  // ----------------------------------------
  // Debug log relay (forwards content/popup logs to background console)
  // ----------------------------------------
  if (message.type === 'CAPTURE_DEBUG_LOG' && CAPTURE_DEBUG) {
    const { source, level, message: logMessage, data } = message;
    const prefix = `[CaptureDebug][${source.charAt(0).toUpperCase() + source.slice(1)}]`;
    const consoleMethod = console[level] || console.log;
    
    if (data !== null && data !== undefined) {
      consoleMethod(`${prefix} ${logMessage}`, data);
    } else {
      consoleMethod(`${prefix} ${logMessage}`);
    }
    
    // No response needed for log relay
    return false;
  }
  
  // ----------------------------------------
  // Get active tab
  // ----------------------------------------
  if (message.type === 'GET_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ tab: tabs[0] });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    return true;
  }
  
  // ----------------------------------------
  // Check platform (includes session state)
  // ----------------------------------------
  if (message.type === 'CHECK_PLATFORM') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) {
        sendResponse({ supported: false, platform: null });
        return;
      }
      
      const url = tab.url;
      let platform = null;
      
      if (url.includes('tiktok.com')) {
        platform = 'tiktok';
      } else if (url.includes('instagram.com')) {
        platform = 'instagram';
      } else if (url.includes('youtube.com')) {
        platform = 'youtube';
      } else if (url.includes('facebook.com')) {
        platform = 'facebook';
      } else if (url.includes('x.com') || url.includes('twitter.com')) {
        platform = 'twitter';
      } else if (url.includes('reddit.com')) {
        platform = 'reddit';
      }
      
      // Include session state
      const sessionState = await getSessionState(tab.id);
      
      // Note: 'supported' now reflects if platform is in SUPPORTED_SCAN_PLATFORMS
      // Reddit is detected as a platform but marked as unsupported for now
      const isSupportedForScanning = platform !== null && SUPPORTED_SCAN_PLATFORMS.includes(platform);
      
      sendResponse({ 
        supported: isSupportedForScanning, 
        platform,  // Still return the detected platform (e.g., 'reddit') for the popup to show specific messaging
        url: tab.url,
        tabId: tab.id,
        sessionActive: !!sessionState,
        sessionStartTime: sessionState?.startTime || null,
        sessionPlatform: sessionState?.platform || null
      });
    });
    return true;
  }
  
  // ----------------------------------------
  // GET SESSION STATE (explicit check for popup)
  // ----------------------------------------
  if (message.action === 'GET_SESSION_STATE') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab) {
        sendResponse({ success: false, error: 'No active tab', active: false });
        return;
      }

      const state = await getSessionState(tab.id);
      
      sendResponse({
        success: true,
        tabId: tab.id,
        active: !!state,
        startTime: state?.startTime || null,
        platform: state?.platform || null
      });
    });
    return true;
  }
  
  // ----------------------------------------
  // SET BADGE (for popup to call after start)
  // ----------------------------------------
  if (message.action === 'SET_BADGE') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (tab) {
        await setRecordingBadge(tab.id);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true;
  }
  
  // ----------------------------------------
  // CLEAR BADGE (for popup to call after stop)
  // ----------------------------------------
  if (message.action === 'CLEAR_BADGE') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (tab) {
        await clearRecordingBadge(tab.id);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true;
  }
  
  // ----------------------------------------
  // START SESSION SCAN
  // ----------------------------------------
  if (message.action === 'START_SESSION_SCAN') {
    console.debug('[AlgorithmLens][Session] START_SESSION_SCAN received (user clicked Start)');
    console.log('[AlgorithmLens] === START_SESSION_SCAN ===');
    
    if (CAPTURE_DEBUG) {
      console.log('[CaptureDebug][Background] START_SESSION_SCAN received - geminiConsent:', message.geminiConsent);
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }
      
      const tabId = tab.id;
      console.log(`[AlgorithmLens] Starting session for tab ${tabId}`);
      
      // Detect platform from URL to block unsupported platforms (e.g., Reddit)
      const url = tab.url || '';
      let detectedPlatform = null;
      if (url.includes('reddit.com')) {
        detectedPlatform = 'reddit';
      }
      
      // Block Reddit scans with a specific message
      if (detectedPlatform === 'reddit') {
        console.log('[AlgorithmLens] Reddit scanning is temporarily disabled');
        sendResponse({
          success: false,
          platform: 'reddit',
          error: 'Reddit scanning is temporarily disabled while we improve it.',
          temporarilyDisabled: true
        });
        return;
      }
      
      // ============================================================================
      // ALWAYS CLEAR STALE STATE: Ensure Start always begins a fresh session
      // This fixes the "first click doesn't work" issue caused by stale state
      // ============================================================================
      const existingSession = await getSessionState(tabId);
      if (existingSession) {
        console.log(`[AlgorithmLens][Session] Clearing stale/existing session state for tab ${tabId} before starting fresh`);
        console.debug(`[AlgorithmLens][Session]   → Previous session startTime: ${existingSession.startTime}`);
        console.debug(`[AlgorithmLens][Session]   → Previous session platform: ${existingSession.platform}`);
        await clearSessionState(tabId);
        await clearRecordingBadge(tabId);
        // Continue to create new session (don't return early)
      }
      
      try {
        // Forward to content script FIRST
        console.log(`[AlgorithmLens] Sending START_SESSION_SCAN to tab ${tabId}...`);
        const contentResponse = await chrome.tabs.sendMessage(tabId, { action: 'START_SESSION_SCAN' });
        
        console.log(`[AlgorithmLens] Content script response:`, contentResponse);
        
        if (!contentResponse) {
          console.error('[AlgorithmLens] Content script returned null/undefined response');
          sendResponse({ 
            success: false, 
            error: 'Content script did not respond. Please refresh the page and try again.',
            needsRefresh: true
          });
          return;
        }
        
        if (!contentResponse.success) {
          sendResponse({ success: false, error: contentResponse.error || 'Failed to start session in content script' });
          return;
        }
        
        // Generate NEW scanId at session start (critical for scan uniqueness)
        const scanId = generateScanId();
        const startTime = Date.now();
        const createdAt = new Date(startTime).toISOString();
        const geminiConsent = message.geminiConsent === true; // Default to false

        await setSessionState(tabId, {
          scanId: scanId,
          startTime: startTime,
          createdAt: createdAt,
          platform: contentResponse.platform,
          initialPostCount: contentResponse.initialPostCount || 0,
          geminiConsent: geminiConsent,
          isProcessing: false // Not yet processing
        });

        console.debug(`[AlgorithmLens][Session] NEW scanId generated: ${scanId}`);
        console.log(`[AlgorithmLens] Session state saved with scanId=${scanId}, geminiConsent=${geminiConsent}`);
        
        if (CAPTURE_DEBUG) {
          console.log(`[CaptureDebug][Background] Session started - scanId: ${scanId}, platform: ${contentResponse.platform}, initialPostCount: ${contentResponse.initialPostCount || 0}`);
        }
        
        // Set the recording badge
        await setRecordingBadge(tabId);
        
        console.log(`[AlgorithmLens] Session started successfully for tab ${tabId}, startTime=${startTime}`);
        
        sendResponse({
          success: true,
          message: 'Session scan started',
          tabId: tabId,
          platform: contentResponse.platform,
          startTime: startTime,
          initialPostCount: contentResponse.initialPostCount || 0
        });
        
      } catch (error) {
        console.error('[AlgorithmLens] Error starting session:', error);
        
        // Check if this is a "content script not injected" error
        const errorMessage = error.message || '';
        const isContentScriptMissing = 
          errorMessage.includes('Receiving end does not exist') ||
          errorMessage.includes('Could not establish connection') ||
          errorMessage.includes('No tab with id') ||
          errorMessage.includes('message port closed');
        
        if (isContentScriptMissing) {
          console.log('[AlgorithmLens] Content script not available - needs page refresh');
          sendResponse({ 
            success: false, 
            error: 'Content script not loaded. Please refresh the page and try again.',
            needsRefresh: true
          });
        } else {
          sendResponse({ 
            success: false, 
            error: errorMessage || 'Failed to communicate with page. Try refreshing.'
          });
        }
      }
    });
    
    return true;
  }
  
  // ----------------------------------------
  // STOP SESSION SCAN AND PROCESS
  // ----------------------------------------
  if (message.action === 'STOP_SESSION_SCAN_AND_PROCESS') {
    console.debug('[AlgorithmLens][Session] STOP_SESSION_SCAN_AND_PROCESS received (user-initiated stop)');
    console.log('[AlgorithmLens] === STOP_SESSION_SCAN_AND_PROCESS ===');

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      const tabId = tab.id;

      // Get session state - THIS IS CRITICAL for scanId and duration
      const sessionState = await getSessionState(tabId);
      const startTime = sessionState?.startTime;
      const scanId = sessionState?.scanId;
      const createdAt = sessionState?.createdAt;

      console.log(`[AlgorithmLens] Stopping session for tab ${tabId}`);
      console.debug(`[AlgorithmLens][Session] Session state:`, sessionState);
      console.debug(`[AlgorithmLens][Session] scanId from session: ${scanId}`);
      console.log(`[AlgorithmLens] startTime:`, startTime, startTime ? `(${new Date(startTime).toISOString()})` : '(MISSING!)');

      // ===== DOUBLE-SUBMIT PROTECTION =====
      // If no session or already processing, reject the request
      if (!sessionState) {
        console.warn('[AlgorithmLens][Session] No session state found - ignoring stop request (possible double-submit)');
        sendResponse({ success: false, error: 'No active session to stop', alreadyProcessed: true });
        return;
      }

      if (sessionState.isProcessing) {
        console.warn(`[AlgorithmLens][Session] Session ${scanId} is already being processed - ignoring duplicate stop`);
        sendResponse({ success: false, error: 'Session is already being processed', alreadyProcessed: true });
        return;
      }

      // Mark session as processing IMMEDIATELY to prevent double-submits
      await setSessionState(tabId, { ...sessionState, isProcessing: true });
      console.debug(`[AlgorithmLens][Session] Marked session ${scanId} as processing`);

      // Warn if startTime is missing
      if (!startTime) {
        console.warn('[AlgorithmLens] WARNING: startTime is missing! Duration will default to 1s');
      }

      try {
        // Stop session in content script and get posts
        console.log(`[AlgorithmLens] Sending STOP_SESSION_SCAN to tab ${tabId}...`);
        const contentResponse = await chrome.tabs.sendMessage(tabId, { action: 'STOP_SESSION_SCAN' });
        
        console.log(`[AlgorithmLens] Content script stop response:`, contentResponse);
        
        if (!contentResponse) {
          console.error('[AlgorithmLens] Content script returned null/undefined response on stop');
          await clearSessionState(tabId);
          await clearRecordingBadge(tabId);
          sendResponse({ 
            success: false, 
            error: 'Content script did not respond. The session may have been lost due to page navigation.',
            needsRefresh: true
          });
          return;
        }
        
        if (!contentResponse.success) {
          await clearSessionState(tabId);
          await clearRecordingBadge(tabId);
          sendResponse({ success: false, error: contentResponse.error || 'Failed to stop session' });
          return;
        }
        
        const { posts, platform, rateLimited, rateState } = contentResponse;
        
        if (CAPTURE_DEBUG) {
          console.log(`[CaptureDebug][Background] STOP_SESSION_SCAN_AND_PROCESS - Received ${posts?.length || 0} posts from content script, platform: ${platform}`);
          console.log(`[CaptureDebug][Background] Payload size: ${JSON.stringify(posts || []).length} bytes`);
        }
        
        // Log rate limit info if triggered
        if (rateLimited) {
          console.warn('[AlgorithmLens][Background] Session was rate-limited. Posts collected:', posts?.length || 0);
        }
        
        // ===== INSTRUMENTATION: Reddit-specific logging when receiving posts from content script =====
        if (platform === 'reddit') {
          console.debug('[AlgorithmLens][Reddit][Background] 📥 Received posts from content script:', posts?.length || 0);
          if (posts && posts.length > 0) {
            console.table(
              posts.slice(0, 5).map((p) => ({
                id: p.id,
                creator: p.creator,
                captionSample: p.caption ? p.caption.slice(0, 80) : null,
                isSponsored: p.isSponsored,
                link: p.link,
              }))
            );
          } else {
            console.warn('[AlgorithmLens][Reddit][Background] ⚠️ ZERO POSTS received from content script!');
          }
        }
        
        // Compute duration - use startTime from session state
        const endTime = Date.now();
        const rawDurationMs = startTime ? (endTime - startTime) : 0;
        const rawDurationSeconds = rawDurationMs / 1000;
        const durationSeconds = Math.max(1, Math.round(rawDurationSeconds));
        
        console.log(`[AlgorithmLens] Session STOP for tab ${tabId}:`);
        console.log(`[AlgorithmLens]   startTime: ${startTime}`);
        console.log(`[AlgorithmLens]   endTime: ${endTime}`);
        console.log(`[AlgorithmLens]   rawDurationMs: ${rawDurationMs}`);
        console.log(`[AlgorithmLens]   rawDurationSeconds: ${rawDurationSeconds}`);
        console.log(`[AlgorithmLens]   durationSeconds (final): ${durationSeconds}`);
        console.log(`[AlgorithmLens]   posts collected: ${posts?.length || 0}`);

        // Map to UnifiedScanResult - pass scanId and createdAt from session state
        console.debug(`[AlgorithmLens][Session] Mapping with scanId: ${scanId}`);
        const result = mapDesktopPostsToUnifiedResult(posts || [], platform, {
          scanId: scanId,
          createdAt: createdAt
        });
        
        // Inject duration into ALL the places the backend might look
        result.aggregates = result.aggregates || {};
        result.aggregates.duration_seconds = durationSeconds;
        
        result.scan_metadata = result.scan_metadata || {};
        result.scan_metadata.session_duration_seconds = durationSeconds;
        
        result.environment = result.environment || {};
        result.environment.extension_capture = result.environment.extension_capture || {};
        result.environment.extension_capture.session_duration_seconds = durationSeconds;
        result.environment.extension_capture.capture_method = 'SESSION_SCAN';
        
        console.log('[AlgorithmLens] Final UnifiedScanResult for session:', {
          durationSeconds: durationSeconds,
          'aggregates.duration_seconds': result.aggregates.duration_seconds,
          'scan_metadata.session_duration_seconds': result.scan_metadata.session_duration_seconds,
          totalItems: result.aggregates?.total_feed_items,
          sourceType: result.scan_metadata?.source_type
        });
        
        // ===== INSTRUMENTATION: Reddit-specific logging before sending to backend =====
        if (platform === 'reddit') {
          console.debug('[AlgorithmLens][Reddit][Background] 📤 About to send to backend:');
          console.debug('[AlgorithmLens][Reddit][Background]   result.aggregates.total_feed_items:', result.aggregates?.total_feed_items);
          console.debug('[AlgorithmLens][Reddit][Background]   result.feed_items.length:', result.feed_items?.length);
          if (result.feed_items && result.feed_items.length > 0) {
            console.table(
              result.feed_items.slice(0, 5).map((item) => ({
                item_id: item.item_id,
                creator: item.creator?.name || item.creator?.username,
                captionSample: item.content?.text ? item.content.text.slice(0, 80) : null,
                is_ad: item.ad_info?.is_ad,
              }))
            );
          }
        }
        
        // ===== INSTRUMENTATION: Log platform summary before sending to backend =====
        function summarizePostsByPlatform(posts) {
          const summary = {};
          for (const post of posts) {
            const p = post.platform || "unknown";
            summary[p] = (summary[p] || 0) + 1;
          }
          return summary;
        }
        
        const postsSummary = summarizePostsByPlatform(posts || []);
        console.debug(
          "[AlgorithmLens][Background] Sending ingest payload. Posts by platform:",
          postsSummary
        );
        console.debug(
          "[AlgorithmLens][Background] Mapped result summary:",
          {
            total_feed_items: result.aggregates?.total_feed_items,
            total_ads: result.aggregates?.total_ads,
            platform: result.scan_metadata?.platform
          }
        );
        
        // Send to backend with gemini_consent flag from session state
        const geminiConsent = sessionState?.geminiConsent === true;
        const payloadWithConsent = {
          ...result,
          gemini_consent: geminiConsent
        };
        console.debug(`[AlgorithmLens][Session] Submitting scanId: ${result.scan_metadata?.scan_id}`);
        console.log(`[AlgorithmLens] Sending to backend with gemini_consent=${geminiConsent}`);

        let backendResponse = null;
        try {
          if (CAPTURE_DEBUG) {
            const payloadSize = JSON.stringify(payloadWithConsent).length;
            console.log(`[CaptureDebug][Background] Sending to backend - URL: ${BACKEND_URL}/api/scan/desktop, Payload size: ${payloadSize} bytes, scanId: ${result.scan_metadata?.scan_id}`);
          }
          
          const response = await fetch(`${BACKEND_URL}/api/scan/desktop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadWithConsent)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend error (${response.status}): ${errorText}`);
          }
          
          backendResponse = await response.json();
          console.log('[AlgorithmLens] Scan saved to backend:', backendResponse);
          
          if (CAPTURE_DEBUG) {
            console.log(`[CaptureDebug][Background] Backend response received - success: ${backendResponse?.success}, scan_id: ${backendResponse?.scan_id}`);
          }
          
        } catch (backendError) {
          console.error('[AlgorithmLens][Background] Ingest request failed:', backendError);
          console.error('[AlgorithmLens][Background] Attempted payload summary:', {
            scan_id: result.scan_metadata?.scan_id,
            platform: result.scan_metadata?.platform,
            total_items: result.aggregates?.total_feed_items,
            total_ads: result.aggregates?.total_ads
          });
          
          if (CAPTURE_DEBUG) {
            console.error(`[CaptureDebug][Background] Backend error: ${backendError.message}`);
          }
          
          backendResponse = { success: false, error: backendError.message };
        }
        
        // Clear session state and badge - CRITICAL: ensures next scan gets new scanId
        console.debug(`[AlgorithmLens][Session] Clearing session for tab ${tabId} (scanId was: ${scanId})`);
        await clearSessionState(tabId);
        await clearRecordingBadge(tabId);
        console.debug(`[AlgorithmLens][Session] Session cleared - next scan will generate new scanId`);

        // Return comprehensive response
        sendResponse({
          success: true,
          tabId: tabId,
          platform,
          durationSeconds,
          postCount: posts?.length || 0,
          result,
          backendSaved: backendResponse?.success !== false,
          backendResponse,
          dashboardUrl: `${DASHBOARD_URL}/history`,
          // Rate limiting info
          rateLimited: rateLimited || false,
          rateState: rateState || null
        });
        
      } catch (error) {
        console.error('[AlgorithmLens] Error stopping session:', error);
        await clearSessionState(tabId);
        await clearRecordingBadge(tabId);
        
        // Check if this is a "content script not available" error
        const errorMessage = error.message || '';
        const isContentScriptMissing = 
          errorMessage.includes('Receiving end does not exist') ||
          errorMessage.includes('Could not establish connection') ||
          errorMessage.includes('No tab with id') ||
          errorMessage.includes('message port closed');
        
        if (isContentScriptMissing) {
          sendResponse({ 
            success: false, 
            error: 'Lost connection to page. The session data may have been lost due to page navigation or refresh.',
            needsRefresh: true
          });
        } else {
          sendResponse({ 
            success: false, 
            error: errorMessage || 'Failed to process session scan'
          });
        }
      }
    });
    
    return true;
  }
  
  // ----------------------------------------
  // PROCESS DESKTOP SCAN (legacy/snapshot mode - kept for compatibility)
  // ----------------------------------------
  if (message.action === 'PROCESS_DESKTOP_SCAN') {
    console.log('[AlgorithmLens] Processing desktop scan (legacy)...', {
      postCount: message.posts?.length || 0,
      platform: message.platform
    });
    
    try {
      const result = mapDesktopPostsToUnifiedResult(message.posts || [], message.platform);
      
      // If duration is provided, inject it
      if (message.durationSeconds) {
        result.aggregates = result.aggregates || {};
        result.aggregates.duration_seconds = message.durationSeconds;
        result.scan_metadata = result.scan_metadata || {};
        result.scan_metadata.session_duration_seconds = message.durationSeconds;
      }
      
      console.log('[AlgorithmLens] Scan processed successfully:', {
        totalItems: result.aggregates.total_feed_items,
        totalAds: result.aggregates.total_ads,
        adPercentage: Math.round(result.aggregates.ad_percentage * 100) + '%'
      });
      
      sendResponse({ 
        success: true, 
        result 
      });
    } catch (error) {
      console.error('[AlgorithmLens] Error processing scan:', error);
      sendResponse({ 
        success: false, 
        error: error.message || 'Failed to process scan results'
      });
    }
    
    return true;
  }
  
  // ----------------------------------------
  // SEND DESKTOP SCAN TO BACKEND (legacy - kept for compatibility)
  // ----------------------------------------
  if (message.action === 'SEND_DESKTOP_SCAN_TO_BACKEND') {
    console.log('[AlgorithmLens] Sending scan to backend (legacy)...');
    
    const scanResult = message.result;
    
    if (!scanResult) {
      sendResponse({ success: false, error: 'No scan result provided' });
      return true;
    }
    
    (async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/scan/desktop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scanResult)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('[AlgorithmLens] Scan saved to backend:', data);
        
        sendResponse({
          success: true,
          scanId: data.scan_id,
          createdAt: data.created_at,
          platform: data.platform,
          totalItems: data.total_items,
          totalAds: data.total_ads,
          adPercentage: data.ad_percentage,
          message: data.message || 'Scan saved successfully',
          dashboardUrl: `${DASHBOARD_URL}/history`
        });
        
      } catch (error) {
        console.error('[AlgorithmLens] Failed to send scan to backend:', error);
        
        let userMessage = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          userMessage = 'Could not connect to AlgorithmLens backend. Make sure it\'s running on http://127.0.0.1:8000';
        }
        
        sendResponse({ success: false, error: userMessage });
      }
    })();
    
    return true;
  }
  
  // ----------------------------------------
  // Open dashboard in new tab
  // ----------------------------------------
  if (message.action === 'OPEN_DASHBOARD') {
    const url = message.url || `${DASHBOARD_URL}/history`;
    chrome.tabs.create({ url });
    sendResponse({ success: true });
    return true;
  }
  
  return true;
});

// ============================================
// Tab update listener - clear session on navigation
// ============================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // If tab navigates to a different page, clear its session and badge
  if (changeInfo.status === 'loading' && sessionStateByTab.has(tabId)) {
    if (AUTO_CLEAR_ON_NAVIGATION) {
      console.log(`[AlgorithmLens][Session] Tab ${tabId} navigating, clearing session state and badge`);
      await clearSessionState(tabId);
      await clearRecordingBadge(tabId);
      // Note: When AUTO_CLEAR_ON_NAVIGATION is true and we auto-clear here,
      // the popup won't know unless it re-checks session state on open.
    } else {
      // MVP: Do NOT auto-clear sessions on navigation.
      // This log appears once per navigation event while a session is active.
      console.debug('[AlgorithmLens][Session] AUTO_CLEAR_ON_NAVIGATION is disabled; session will continue despite tab navigation. Session will only end when user clicks Stop.');
    }
  }
});
