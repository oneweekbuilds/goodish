export interface ScreenResolution {
    width: number;
    height: number;
}

export interface VideoCaptureInfo {
    is_video_based: boolean;
    duration_seconds?: number;
    frame_rate_fps?: number;
    approx_feed_items_visible?: number;
}

export interface ExtensionCaptureInfo {
    is_dom_based: boolean;
    dom_capture_strategy?: string | null;
}

export interface ScanMetadata {
    scan_id: string;
    created_at: string;
    source_type: string;
    platform: string;
    user_identifier?: string | null;
    app_scan_version?: string | null;
    insights_engine_version?: string | null;
}

export interface Environment {
    device_type: string;
    device_os?: string | null;
    device_os_version?: string | null;
    browser_name?: string | null;
    browser_version?: string | null;
    screen_resolution?: ScreenResolution | null;
    video_capture?: VideoCaptureInfo | null;
    extension_capture?: ExtensionCaptureInfo | null;
}

export interface AdMetadata {
    ad_detected_reason?: string | null;
    sponsored_label_text?: string | null;
    advertiser_name?: string | null;
    advertiser_domain?: string | null;
    product_or_service?: string | null;
}

export interface AccountInfo {
    account_handle?: string | null;
    account_display_name?: string | null;
    account_category_guess?: string | null;
}

export interface ContentText {
    captions: string[];
    hashtags: string[];
    on_screen_labels: string[];
}

export interface TopicsInfo {
    primary_category?: string | null;
    secondary_categories: string[];
    freeform_tags: string[];
}

export interface PoliticalInfo {
    is_political: boolean;
    political_subtype?: string | null;
    stance_or_alignment_guess?: string | null;
    policy_area?: string | null;
    geographic_focus?: string | null;
}

export interface WellbeingInfo {
    wellbeing_relevance: string;
    valence?: string | null;
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
    repetition_cluster_id?: string | null;
}

export interface AlgorithmInferences {
    suggested_interests: string[];
    suggested_audience_segments: string[];
}

export interface DomMetadata {
    post_id?: string | null;
    post_url?: string | null;
    account_id?: string | null;
}

export interface OcrMetadata {
    frames_sampled?: number | null;
    average_ocr_confidence?: number | null;
}

export interface SourceDetails {
    capture_source_type: string;
    dom_metadata?: DomMetadata | null;
    ocr_metadata?: OcrMetadata | null;
}

export interface FeedItem {
    position_in_feed: number;
    approx_timestamp_offset_sec?: number | null;
    content_type: string;
    is_ad: boolean;

    // AI disclosure fields (platform-disclosed AI labels and C2PA indicators)
    // These capture EXPLICIT platform disclosure signals, NOT AI generation detection
    ai_disclosure?: string | null;  // Platform AI labels: "LABELED_AI" | "NOT_LABELED" | null
    c2pa_disclosure?: string | null;  // C2PA/Content Credentials: "HAS_C2PA" | "NO_C2PA" | null

    ad_metadata?: AdMetadata | null;
    account?: AccountInfo | null;
    content_text: ContentText;
    topics: TopicsInfo;
    political: PoliticalInfo;
    wellbeing: WellbeingInfo;
    engagement_drivers: EngagementDrivers;
    repetition: RepetitionInfo;
    algorithm_inferences: AlgorithmInferences;
    source_details: SourceDetails;
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
}

export interface PrivacyInfo {
    user_identifiers_stored: boolean;
    profile_photos_stored: boolean;
    raw_text_stored: boolean;
    retention_policy_key: string;
    redacted_fields: string[];
}

export interface DebugWarning {
    code: string;
    message: string;
}

export interface DebugInfo {
    processing_time_seconds?: number | null;
    frames_extracted?: number | null;
    frames_sampled_for_ocr?: number | null;
    errors: DebugWarning[];
    warnings: DebugWarning[];
    raw_backend_payload?: Record<string, unknown> | null;
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
