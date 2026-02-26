/**
 * API Type Definitions (#12, #14)
 *
 * TypeScript interfaces and enums for the main API response shapes.
 * These provide type safety for API integration points without requiring
 * conversion of all .jsx files to .tsx.
 *
 * Import these types in existing .ts files and use in JSDoc comments for .jsx files.
 */

// Enums for API constants
export enum PlanTier {
  FREE = 'free',
  PLUS = 'plus',
  ANON = 'anon',
}

export enum ScanStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PENDING = 'pending',
  ERROR = 'error',
}

export enum SourceType {
  DESKTOP_EXTENSION = 'DESKTOP_EXTENSION',
  MOBILE_VIDEO = 'MOBILE_VIDEO',
}

// Main API response types

export interface ScanMetadata {
  scan_id?: string;
  platform: string;
  created_at: string;
  source_type?: SourceType | string;
  duration_seconds?: number;
  user_identifier?: string | null;
  app_scan_version?: string | null;
  insights_engine_version?: string | null;
}

export interface Aggregates {
  total_feed_items: number;
  ad_percentage: number;
  topic_distribution: TopicDistribution[];
  wellbeing_summary?: WellbeingSummary;
  political_content_summary?: PoliticalContentSummary;
}

export interface TopicDistribution {
  category: string;
  percentage: number;
}

export interface WellbeingSummary {
  valence_distribution?: ValenceDistribution;
}

export interface ValenceDistribution {
  POSITIVE?: number;
  NEUTRAL?: number;
  NEGATIVE?: number;
}

export interface PoliticalContentSummary {
  political_percentage?: number | null;
}

export interface WellbeingTheme {
  body_image?: boolean;
  diet_weight_loss?: boolean;
  diet_weight?: boolean;
  conflict?: boolean;
}

export interface FeedItem {
  id?: string;
  is_ad: boolean;
  thumbnail_url?: string;
  creator?: {
    handle?: string;
    name?: string;
  };
  account?: {
    account_handle?: string;
    account_display_name?: string;
  };
  text_content?: {
    caption?: string;
    ocr_text?: string;
  };
  content_text?: {
    captions?: string[];
  };
  source_details?: {
    dom_metadata?: {
      post_url?: string;
    };
  };
  topics?: string[];
  political?: {
    is_political?: boolean;
  };
  ad_metadata?: {
    product_or_service?: string;
  };
  wellbeing?: {
    valence?: string;
    themes?: string[];
  };
}

export interface ScanResult {
  id: string;
  scan_metadata?: ScanMetadata;
  platform?: string;
  created_at?: string;
  source_type?: string;
  status?: ScanStatus | string;
  aggregates?: Aggregates;
  feed_items?: FeedItem[];
  environment?: {
    extension_capture?: boolean;
  };
  debug?: {
    gemini_used?: boolean;
  };
  result?: ScanResult;
  scan?: ScanResult;
  error_message?: string;
}

export interface ScanListResponse {
  scans: ScanListItem[];
  count?: number;
}

export interface ScanListItem {
  id: string;
  platform: string;
  created_at: string;
  status: ScanStatus | string;
  source_type?: SourceType | string;
  total_items?: number;
  ad_percentage?: number;
  duration_seconds?: number;
}

export interface ScanStatusResponse {
  scan_id: string;
  status: ScanStatus | string;
  error_message?: string;
  progress?: number;
}

export interface UserEntitlements {
  plan_tier: PlanTier | string;
  features: string[];
  scans_remaining?: number;
  scans_used?: number;
}

export interface AuthSession {
  user?: {
    id: string;
    email?: string;
  };
  access_token?: string;
}

export interface UploadResponse {
  scan_id?: string;
  id?: string;
  status?: ScanStatus | string;
  scan_metadata?: ScanMetadata;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  status?: number;
}
