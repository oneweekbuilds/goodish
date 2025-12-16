/**
 * Scan API helpers for AlgorithmLens
 * Interacts with the backend scan endpoints
 */

// Default API base URL - can be configured via environment or settings
const DEFAULT_API_BASE = 'http://127.0.0.1:8000';

function getApiBase(): string {
  // Check for environment variable or use default
  return (import.meta as any).env?.VITE_API_BASE_URL || DEFAULT_API_BASE;
}

// ============================================================================
// Types
// ============================================================================

export interface ScanListItem {
  id: string;
  created_at: string;
  platform: string;
  user_id: string;
  duration_seconds: number;
  total_items: number;
  total_ads: number;
  ad_percentage: number;
  source_type?: string;
}

export interface TopicDistributionEntry {
  category: string;
  count: number;
  percentage: number;
}

export interface ValenceDistribution {
  POSITIVE: number;
  NEUTRAL: number;
  NEGATIVE: number;
  MIXED: number;
}

export interface WellbeingSummary {
  high_relevance_items: number;
  potential_risk_items: number;
  valence_distribution: ValenceDistribution;
}

export interface PoliticalContentSummary {
  political_items: number;
  political_percentage: number;
}

export interface RepetitionSummary {
  items_in_repetition_clusters: number;
  largest_cluster_size: number;
}

export interface HookCount {
  hook: string;
  count: number;
}

export interface EngagementPatternSummary {
  top_hooks: HookCount[];
}

export interface Aggregates {
  total_feed_items: number;
  total_ads: number;
  ad_percentage: number;
  topic_distribution: TopicDistributionEntry[];
  wellbeing_summary: WellbeingSummary;
  political_content_summary: PoliticalContentSummary;
  repetition_summary: RepetitionSummary;
  engagement_pattern_summary: EngagementPatternSummary;
  duration_seconds?: number;
}

export interface ScanMetadata {
  scan_id: string;
  created_at: string;
  source_type: string;
  platform: string;
  user_identifier?: string;
  app_scan_version?: string;
  insights_engine_version?: string;
  session_duration_seconds?: number;
}

export interface VideoCaptureInfo {
  is_video_based: boolean;
  duration_seconds?: number;
  frame_rate_fps?: number;
  approx_feed_items_visible?: number;
}

export interface ExtensionCaptureInfo {
  is_dom_based: boolean;
  dom_capture_strategy?: string;
  session_duration_seconds?: number;
}

export interface Environment {
  device_type: string;
  device_os?: string;
  device_os_version?: string;
  browser_name?: string;
  browser_version?: string;
  video_capture?: VideoCaptureInfo;
  extension_capture?: ExtensionCaptureInfo;
}

export interface AdMetadata {
  ad_detected_reason?: string;
  sponsored_label_text?: string;
  advertiser_name?: string;
  advertiser_domain?: string;
  product_or_service?: string;
}

export interface AccountInfo {
  account_handle?: string;
  account_display_name?: string;
  account_category_guess?: string;
}

export interface ContentText {
  captions: string[];
  hashtags: string[];
  on_screen_labels: string[];
}

export interface TopicsInfo {
  primary_category?: string;
  secondary_categories: string[];
  freeform_tags: string[];
}

export interface PoliticalInfo {
  is_political: boolean;
  political_subtype?: string;
  stance_or_alignment_guess?: string;
  policy_area?: string;
  geographic_focus?: string;
}

export interface WellbeingInfo {
  wellbeing_relevance: string;
  valence?: string;
  themes: string[];
  potential_risk_flags: string[];
}

export interface EngagementDrivers {
  hooks_detected: string[];
  call_to_action_patterns: string[];
  urgency_or_scarcity_signals: string[];
}

export interface RepetitionInfo {
  similar_to_previous_items: boolean;
  repetition_reasons: string[];
  repetition_cluster_id?: string;
}

export interface FeedItem {
  position_in_feed: number;
  approx_timestamp_offset_sec?: number;
  content_type: string;
  is_ad: boolean;
  ad_metadata?: AdMetadata;
  account?: AccountInfo;
  content_text: ContentText;
  topics: TopicsInfo;
  political: PoliticalInfo;
  wellbeing: WellbeingInfo;
  engagement_drivers: EngagementDrivers;
  repetition: RepetitionInfo;
}

export interface UnifiedScanResult {
  schema_version: string;
  scan_metadata: ScanMetadata;
  environment: Environment;
  feed_items: FeedItem[];
  aggregates: Aggregates;
}

export interface ScanDetailResponse {
  id: string;
  created_at: string;
  platform: string;
  user_id: string;
  duration_seconds: number;
  total_items: number;
  total_ads: number;
  ad_percentage: number;
  result: UnifiedScanResult;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch list of all scans
 */
export async function fetchScans(): Promise<ScanListItem[]> {
  const response = await fetch(`${getApiBase()}/api/scans`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scans: ${response.status}`);
  }

  const data = await response.json();
  return data.scans || [];
}

/**
 * Fetch a single scan by ID
 */
export async function fetchScanById(scanId: string): Promise<ScanDetailResponse> {
  const response = await fetch(`${getApiBase()}/api/scans/${scanId}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scan: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a scan by ID
 */
export async function deleteScan(scanId: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/api/scans/${scanId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete scan: ${response.status}`);
  }
}

/**
 * Upload a video file for scanning
 */
export async function uploadScan(
  file: File,
  platform: string,
  userId: string = 'demo-user'
): Promise<UnifiedScanResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('platform', platform);

  const response = await fetch(`${getApiBase()}/api/scan/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Poll for scan status/results (for async processing)
 */
export async function pollScanStatus(scanId: string): Promise<ScanDetailResponse | null> {
  try {
    return await fetchScanById(scanId);
  } catch {
    return null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format relative time from ISO date string
 */
export function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

/**
 * Format percentage from decimal
 */
export function formatPercent(val: number): string {
  return `${Math.round(val * 100)}%`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return 'N/A';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Get platform display config
 */
export interface PlatformConfig {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  disabled?: boolean;
  disabledReason?: string;
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    bgColor: '#EEE',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    bgColor: '#FDEEF1',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    bgColor: '#FFEEEE',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    color: '#000000',
    bgColor: '#F0F0F0',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    bgColor: '#EEF4FF',
    disabled: true,
    disabledReason: 'Coming soon',
  },
};

export const SUPPORTED_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'x'];

