/**
 * AlgorithmLens Mobile App — Type Definitions
 *
 * Matches the UnifiedScanResult schema from backend/unified_scan_models.py
 */

// Re-export broadcast and streak types for convenient imports
export type {
  BroadcastSession,
  BroadcastStatus,
  BroadcastFrame,
  FrameAnalysisResult,
  StreamConfig,
  BroadcastCaptureInfo,
  ScanMode,
  SupportedPlatform,
} from './broadcast';

export type {
  StreakData,
  StreakDisplayState,
  StreakMilestone,
  FeedScore,
} from './streak';

// ============================================
// Feed Item Capture (from WebView JS injection)
// ============================================

export interface FeedItemCapture {
  platform: string;
  position_in_feed: number;
  creator_handle: string | null;
  creator_display_name: string | null;
  is_ad: boolean;
  ad_label_text: string | null;
  post_text: string;
  hashtags: string[];
  is_suggested: boolean | null;
  content_type: 'photo' | 'video' | 'reel' | 'short' | 'text' | 'carousel' | 'image' | 'gallery' | 'link' | 'unknown';
  capture_timestamp: number;
}

// ============================================
// UnifiedScanResult (sent to backend)
// ============================================

export interface ScanMetadata {
  scan_id: string;
  created_at: string;
  source_type: 'MOBILE_APP' | 'DESKTOP_EXTENSION' | 'MOBILE_VIDEO' | 'MOBILE_BROADCAST';
  platform: string;
  user_identifier?: string;
  app_scan_version?: string;
}

export interface Environment {
  device_type: 'MOBILE' | 'DESKTOP';
  device_os?: string;
  device_os_version?: string;
  screen_resolution?: { width: number; height: number };
  broadcast_capture?: {
    is_broadcast_based: true;
    broadcast_method: 'REPLAYKIT' | 'MEDIA_PROJECTION';
    frames_captured: number;
    frames_unique: number;
    duration_seconds: number;
    average_frame_interval_seconds: number;
    on_device_ocr_used: boolean;
  };
}

export interface FeedItemAccount {
  account_handle: string | null;
  account_display_name: string | null;
  account_category_guess?: string | null;
}

export interface FeedItemContentText {
  captions: string;
  hashtags: string[];
  on_screen_labels?: string[];
}

export interface FeedItemTopics {
  primary_category: string | null;
  secondary_categories?: string[];
  freeform_tags?: string[];
}

export interface FeedItemPolitical {
  is_political: boolean;
  stance_or_alignment_guess?: string | null;
  policy_area?: string | null;
}

export interface FeedItemWellbeing {
  wellbeing_relevance: string | null;
  themes?: string[];
  potential_risk_flags?: string[];
}

export interface FeedItemEmotions {
  valence: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED' | 'NOT_ANALYZED' | null;
}

export interface FeedItem {
  position_in_feed: number;
  content_type: string;
  is_ad: boolean;
  ad_metadata?: {
    ad_detected_reason?: string;
    sponsored_label_text?: string;
    advertiser_name?: string;
  };
  account: FeedItemAccount;
  content_text: FeedItemContentText;
  topics: FeedItemTopics;
  political: FeedItemPolitical;
  wellbeing?: FeedItemWellbeing;
  emotions?: FeedItemEmotions;
  source_origin?: 'suggested' | 'followed' | null;
  ai_disclosure?: 'LABELED_AI' | 'NOT_LABELED' | null;
  influenceSignals?: string[];
  /** Vision model confidence score for broadcast-captured items (0.0–1.0). Null for WebView items. */
  vision_confidence?: number | null;
}

export interface Aggregates {
  total_feed_items: number;
  total_ads: number;
  ad_percentage: number;
  topic_distribution?: Array<{ category: string; count: number; percentage: number }>;
  wellbeing_summary?: Record<string, any>;
  political_content_summary?: {
    political_items: number;
    political_percentage: number;
  };
}

export interface PrivacyInfo {
  user_identifiers_stored: boolean;
  profile_photos_stored: boolean;
  raw_text_stored: boolean;
  retention_policy_key: string;
  redacted_fields: string[];
}

export interface DebugInfo {
  processing_time_seconds: number;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  gemini_consent?: boolean;
  gemini_attempted?: boolean;
  gemini_used?: boolean;
  gemini_reason?: string;
}

export interface UnifiedScanResult {
  schema_version: string;
  scan_metadata: ScanMetadata;
  environment: Environment;
  feed_items: FeedItem[];
  aggregates: Aggregates;
  privacy: PrivacyInfo;
  debug: DebugInfo;
}

// ============================================
// API Response Types
// ============================================

export interface ScanListItem {
  id: string;
  created_at: string;
  platform: string;
  user_id: string;
  duration_seconds?: number;
  total_items: number;
  total_ads: number;
  ad_percentage: number;
  source_type: string;
}

export interface ScanDetailResponse {
  id: string;
  status: 'completed' | 'processing' | 'failed';
  error_message: string | null;
  result: UnifiedScanResult;
}

export interface EntitlementsResponse {
  is_plus: boolean;
  subscription: {
    status: string | null;
    plan_type: string | null;
    trial_end: number | null;
    current_period_end: number | null;
    cancel_at_period_end: boolean;
    trial_days_remaining: number | null;
    period_days_remaining: number | null;
  };
}

// ============================================
// App State Types
// ============================================

export interface UserSession {
  user_id: string;
  email: string;
  access_token: string;
  refresh_token: string;
}

export interface AppSettings {
  gemini_consent: boolean;
  notifications_enabled: boolean;
  reminder_frequency_days: number;
  onboarded: boolean;
  /** User's preferred scan mode. Defaults to 'broadcast'. */
  default_scan_mode: 'broadcast' | 'precision';
  /** Platforms the user has configured iOS Shortcuts automations for. */
  onboarded_platforms: string[];
}
