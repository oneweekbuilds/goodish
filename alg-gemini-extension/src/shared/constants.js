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
  'tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'reddit'
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
