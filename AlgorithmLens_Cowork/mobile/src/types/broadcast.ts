/**
 * AlgorithmLens Mobile App — Broadcast Mode Type Definitions
 *
 * Types for the broadcast-first architecture where users scroll their
 * native social media apps while ReplayKit (iOS) or MediaProjection (Android)
 * captures frames for analysis by Gemini 2.0 Flash.
 *
 * These types flow through: native capture → frame processing → Gemini analysis →
 * UnifiedScanResult → existing dashboard.
 */

// ============================================
// Broadcast Session Lifecycle
// ============================================

/**
 * Session status state machine:
 * IDLE → INITIALIZING → AWAITING_BROADCAST_START → RECORDING → PROCESSING → COMPLETE
 *                                                           ↘ FAILED
 * CANCELLED can occur from any active state.
 */
export type BroadcastStatus =
  | 'IDLE'
  | 'INITIALIZING'
  | 'AWAITING_BROADCAST_START'
  | 'RECORDING'
  | 'PROCESSING'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED';

export interface BroadcastSession {
  /** Unique session identifier (UUID v4). */
  session_id: string;
  /** Platform being analyzed during this broadcast. */
  platform: string;
  /** Current lifecycle status. */
  status: BroadcastStatus;
  /** ISO 8601 timestamp when the session was created. */
  started_at: string;
  /** ISO 8601 timestamp when recording stopped, if applicable. */
  ended_at: string | null;
  /** Total frames captured by the native broadcast extension. */
  frames_captured: number;
  /** Unique frames after perceptual deduplication. */
  frames_unique: number;
  /** Duration of the recording in seconds. */
  duration_seconds: number;
  /** Error message if the session entered FAILED status. */
  error_message: string | null;
  /** The scan_id linked to the resulting UnifiedScanResult, set after processing. */
  linked_scan_id: string | null;
}

// ============================================
// Frame Capture & Analysis
// ============================================

export interface BroadcastFrame {
  /** Unique frame identifier (timestamp_hash format). */
  frame_id: string;
  /** ISO 8601 timestamp when the frame was captured. */
  captured_at: string;
  /** Perceptual hash fingerprint for deduplication (hex string). */
  perceptual_hash: string;
  /** Local file path to the compressed JPEG in the shared app group container. */
  local_path: string;
  /** File size in bytes. */
  size_bytes: number;
  /** Width of the captured frame in pixels. */
  width: number;
  /** Height of the captured frame in pixels. */
  height: number;
  /** On-device OCR text extracted from this frame (empty string if none). */
  ocr_text: string;
  /** OCR confidence score from VNRecognizeTextRequest (0.0–1.0). */
  ocr_confidence: number;
  /** Whether this frame was visually distinct enough to keep after dedup. */
  is_unique: boolean;
}

export interface FrameAnalysisResult {
  /** The frame this analysis corresponds to. */
  frame_id: string;
  /** Feed items extracted from this frame by Gemini Flash. */
  extracted_items: ExtractedFeedItem[];
  /** Overall confidence of the extraction (0.0–1.0). */
  extraction_confidence: number;
  /** Whether this frame was re-analyzed by a higher-accuracy model. */
  reanalyzed: boolean;
  /** Processing time in milliseconds for this frame. */
  processing_time_ms: number;
}

export interface ExtractedFeedItem {
  /** Inferred position in the feed (may not be exact from broadcast). */
  estimated_position: number;
  /** Content type detected from the frame. */
  content_type: 'photo' | 'video' | 'reel' | 'short' | 'text' | 'story' | 'ad' | 'unknown';
  /** Creator handle extracted from the frame, if visible. */
  creator_handle: string | null;
  /** Creator display name, if visible. */
  creator_display_name: string | null;
  /** Whether this item appears to be an advertisement. */
  is_ad: boolean;
  /** Reason the item was flagged as an ad (e.g., "Sponsored label visible"). */
  ad_detection_reason: string | null;
  /** Whether this item appears to be suggested/recommended content. */
  is_suggested: boolean | null;
  /** Suggestion detection reason (e.g., "Suggested for you label visible"). */
  suggestion_detection_reason: string | null;
  /** Visible post text extracted via OCR + Gemini. */
  post_text: string;
  /** Hashtags visible in the frame. */
  hashtags: string[];
  /** Per-field confidence scores from Gemini analysis (0.0–1.0). */
  field_confidence: FieldConfidenceScores;
}

export interface FieldConfidenceScores {
  creator_handle: number;
  is_ad: number;
  content_type: number;
  is_suggested: number;
  post_text: number;
}

// ============================================
// Stream Configuration
// ============================================

export interface StreamConfig {
  /** Frames per second to sample from the broadcast stream. */
  target_sample_rate_fps: number;
  /** Minimum visual difference threshold for deduplication (0.0–1.0). */
  dedup_threshold: number;
  /** JPEG compression quality for stored frames (0–100). */
  jpeg_quality: number;
  /** Maximum frames to store before oldest are evicted. */
  max_frames_per_session: number;
  /** Maximum session duration in seconds before auto-stop. */
  max_session_duration_seconds: number;
  /** Whether to run on-device OCR on each captured frame. */
  enable_on_device_ocr: boolean;
}

/**
 * Default stream configuration optimized for feed content analysis.
 * 1 frame per 2.5 seconds captures sufficient feed content without
 * overwhelming storage or processing.
 */
export const DEFAULT_STREAM_CONFIG: StreamConfig = {
  target_sample_rate_fps: 0.4,
  dedup_threshold: 0.15,
  jpeg_quality: 75,
  max_frames_per_session: 200,
  max_session_duration_seconds: 600,
  enable_on_device_ocr: true,
};

// ============================================
// Broadcast Capture Info (for Environment)
// ============================================

export interface BroadcastCaptureInfo {
  is_broadcast_based: true;
  broadcast_method: 'REPLAYKIT' | 'MEDIA_PROJECTION';
  frames_captured: number;
  frames_unique: number;
  duration_seconds: number;
  average_frame_interval_seconds: number;
  on_device_ocr_used: boolean;
}

// ============================================
// Platform-Specific Broadcast Config
// ============================================

export type SupportedPlatform =
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'facebook'
  | 'reddit';

export interface PlatformBroadcastConfig {
  /** iOS URL scheme to open the native app. */
  ios_url_scheme: string;
  /** Android package name for the native app. */
  android_package: string;
  /** Display name for the platform. */
  display_name: string;
  /** Whether broadcast mode is supported for this platform. */
  broadcast_supported: boolean;
  /** Whether precision (WebView) mode is supported for this platform. */
  precision_supported: boolean;
}

export const PLATFORM_BROADCAST_CONFIGS: Record<SupportedPlatform, PlatformBroadcastConfig> = {
  instagram: {
    ios_url_scheme: 'instagram://',
    android_package: 'com.instagram.android',
    display_name: 'Instagram',
    broadcast_supported: true,
    precision_supported: true,
  },
  twitter: {
    ios_url_scheme: 'twitter://',
    android_package: 'com.twitter.android',
    display_name: 'Twitter / X',
    broadcast_supported: true,
    precision_supported: true,
  },
  youtube: {
    ios_url_scheme: 'youtube://',
    android_package: 'com.google.android.youtube',
    display_name: 'YouTube',
    broadcast_supported: true,
    precision_supported: true,
  },
  tiktok: {
    ios_url_scheme: 'snssdk1233://',
    android_package: 'com.zhiliaoapp.musically',
    display_name: 'TikTok',
    broadcast_supported: true,
    precision_supported: true,
  },
  facebook: {
    ios_url_scheme: 'fb://',
    android_package: 'com.facebook.katana',
    display_name: 'Facebook',
    broadcast_supported: true,
    precision_supported: true,
  },
  reddit: {
    ios_url_scheme: 'reddit://',
    android_package: 'com.reddit.frontpage',
    display_name: 'Reddit',
    broadcast_supported: true,
    precision_supported: true,
  },
};

// ============================================
// Scan Mode Selection
// ============================================

export type ScanMode = 'broadcast' | 'precision';

export interface ScanModeInfo {
  mode: ScanMode;
  label: string;
  description: string;
  recommended: boolean;
}

export const SCAN_MODES: Record<ScanMode, ScanModeInfo> = {
  broadcast: {
    mode: 'broadcast',
    label: 'Live Scan',
    description: 'Scroll your real app while we analyze in the background',
    recommended: true,
  },
  precision: {
    mode: 'precision',
    label: 'Quick Scan',
    description: 'Text-only analysis using the built-in browser',
    recommended: false,
  },
};
