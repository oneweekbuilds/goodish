/**
 * Shared constants for AlgorithmLens extension.
 *
 * SYNC WARNING: These constants must stay in sync with the backend.
 * Backend mirror: AlgorithmLens_Cowork/backend/shared_constants.py
 *
 * When modifying platform lists or names, update BOTH files.
 */

// Platforms supported for scanning (must match backend SUPPORTED_PLATFORMS)
export const SUPPORTED_SCAN_PLATFORMS = [
  'tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'reddit', 'linkedin'
];

// Human-readable platform display names
export const PLATFORM_DISPLAY_NAMES = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  reddit: 'Reddit',
  linkedin: 'LinkedIn',
};

// Platform name aliases (extension name → canonical backend name)
// The extension uses 'twitter' internally, backend also accepts 'x'
export const PLATFORM_ALIASES = {
  'x': 'twitter',
};

// API version info
export const API_VERSION = '1';

// Ad percentage scale used in UnifiedScanResult: 0-1 (decimal)
// Backend database stores 0-100 for display, but the scan payload uses 0-1
export const AD_PERCENTAGE_SCALE = 'decimal'; // 0.0 to 1.0

// ============================================================================
// STORAGE KEYS — centralized chrome.storage key strings
// ============================================================================

export const STORAGE_KEYS = {
  // chrome.storage.local keys
  AUTH_TOKEN: 'authToken',              // JWT token from web app login
  BACKEND_URL: 'backendUrl',            // Dev override for backend API URL
  DASHBOARD_URL: 'dashboardUrl',        // Dev override for dashboard URL
  ONBOARDING_COMPLETE: 'onboarding_complete', // Whether first-install onboarding is done
  AI_CONSENT_ENABLED: 'aiConsentEnabled',     // User's AI analysis consent preference
  USER_PLAN: 'userPlan',               // Cached plan tier ('free' or 'plus')
  PLAN_CHECKED_AT: 'planCheckedAt',     // Timestamp of last plan check
  SCAN_HISTORY: 'scanHistory',          // Array of recent scan summaries (max 5)
  FAILED_SCANS: 'failedScans',          // Array of scans that failed to upload (max 5)

  // chrome.storage.session key prefix (per-tab session state)
  SESSION_STATE_PREFIX: 'session_',     // Prefix + tabId = per-tab session key
};

// ============================================================================
// TIMING CONSTANTS — rate limits, intervals, and delays
// ============================================================================

export const TIMING = {
  // Content script: rate limiting
  MAX_POSTS_PER_SECOND: 30,        // Soft rate limit: normal post collection rate
  BURST_POSTS_PER_SECOND: 50,      // Hard rate limit: triggers collection delay
  RATE_DELAY_MS: 180,              // Pause duration (ms) when burst rate exceeded

  // Content script: scan intervals
  SCAN_INTERVAL_STABLE_MS: 500,    // Feed scan interval when user is idle
  SCAN_INTERVAL_SCROLLING_MS: 300, // Feed scan interval during active scrolling
  SCROLL_THROTTLE_MS: 500,         // Minimum gap between scroll-triggered scans

  // Content script: toast and reporting
  POST_COUNT_REPORT_INTERVAL_MS: 1500, // How often to update badge post count
  TOAST_COMPLETE_DISPLAY_MS: 3000,     // How long "Scan complete" toast stays visible
  TOAST_FADE_OUT_MS: 450,             // Toast fade-out animation duration

  // Content script: YouTube Shorts
  SHORTS_URL_CHECK_INTERVAL_MS: 500,  // Interval for checking Shorts URL changes
  SHORTS_POPSTATE_DELAY_MS: 100,      // Delay after popstate before checking URL

  // Content script: debug heartbeat
  DEBUG_HEARTBEAT_INTERVAL_MS: 5000,  // Interval for debug heartbeat logging

  // Background: retry logic
  MAX_BACKEND_RETRIES: 3,             // Number of retry attempts for backend API calls
  MAX_RETRY_DELAY_MS: 4000,           // Maximum backoff delay between retries

  // Background: data limits
  MAX_FAILED_SCANS_STORED: 5,         // Maximum failed scans kept in storage
  MAX_SCAN_HISTORY_ENTRIES: 5,         // Maximum recent scans shown in popup
  MAX_FEED_ITEM_TEXT_LENGTH: 5000,     // Truncation limit for feed item text in payload

  // Content script: scroll detection
  SCROLL_CHANGE_THRESHOLD_PX: 100,    // Minimum scroll delta (px) to trigger a forced scan
};
