from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime


# ---------- Basic shared types ----------

class ScreenResolution(BaseModel):
    width: int
    height: int


class VideoCaptureInfo(BaseModel):
    is_video_based: bool = Field(True)
    duration_seconds: Optional[float] = None
    frame_rate_fps: Optional[float] = None
    approx_feed_items_visible: Optional[int] = None


class ExtensionCaptureInfo(BaseModel):
    is_dom_based: bool = Field(False)
    dom_capture_strategy: Optional[str] = None  # e.g. "VISIBLE_FEED_ONLY"


# ---------- Top-level sections ----------

class ScanMetadata(BaseModel):
    scan_id: str
    created_at: datetime
    source_type: str  # "MOBILE_VIDEO", "DESKTOP_EXTENSION", "MOBILE_APP"
    platform: str     # "TIKTOK", "INSTAGRAM", "YOUTUBE_SHORTS", etc.
    user_identifier: Optional[str] = None
    app_scan_version: Optional[str] = None
    insights_engine_version: Optional[str] = None


class Environment(BaseModel):
    device_type: str                     # "MOBILE" or "DESKTOP"
    device_os: Optional[str] = None      # "IOS", "ANDROID", "WINDOWS", "MACOS", etc.
    device_os_version: Optional[str] = None
    browser_name: Optional[str] = None   # e.g. "Chrome", "Safari"
    browser_version: Optional[str] = None
    screen_resolution: Optional[ScreenResolution] = None
    video_capture: Optional[VideoCaptureInfo] = None
    extension_capture: Optional[ExtensionCaptureInfo] = None


# ---------- Feed item sub-sections ----------

class AdMetadata(BaseModel):
    ad_detected_reason: Optional[str] = None
    sponsored_label_text: Optional[str] = None
    advertiser_name: Optional[str] = None
    advertiser_domain: Optional[str] = None
    product_or_service: Optional[str] = None


class AccountInfo(BaseModel):
    account_handle: Optional[str] = None
    account_display_name: Optional[str] = None
    account_category_guess: Optional[str] = None


class ContentText(BaseModel):
    captions: List[str] = Field(default_factory=list)
    hashtags: List[str] = Field(default_factory=list)
    on_screen_labels: List[str] = Field(default_factory=list)


class TopicsInfo(BaseModel):
    primary_category: Optional[str] = None
    secondary_categories: List[str] = Field(default_factory=list)
    freeform_tags: List[str] = Field(default_factory=list)


class PoliticalInfo(BaseModel):
    is_political: bool = False
    political_subtype: Optional[str] = None
    stance_or_alignment_guess: Optional[str] = None
    policy_area: Optional[str] = None
    geographic_focus: Optional[str] = None


class WellbeingInfo(BaseModel):
    wellbeing_relevance: str = "NONE"
    valence: Optional[str] = None
    themes: List[str] = Field(default_factory=list)
    potential_risk_flags: List[str] = Field(default_factory=list)


class EngagementDrivers(BaseModel):
    hooks_detected: List[str] = Field(default_factory=list)
    call_to_action_patterns: List[str] = Field(default_factory=list)
    urgency_or_scarcity_signals: List[str] = Field(default_factory=list)


class RepetitionInfo(BaseModel):
    similar_to_previous_items: bool = False
    repetition_reasons: List[str] = Field(default_factory=list)
    repetition_cluster_id: Optional[str] = None


class AlgorithmInferences(BaseModel):
    suggested_interests: List[str] = Field(default_factory=list)
    suggested_audience_segments: List[str] = Field(default_factory=list)


class DomMetadata(BaseModel):
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    account_id: Optional[str] = None


class OcrMetadata(BaseModel):
    frames_sampled: Optional[int] = None
    average_ocr_confidence: Optional[float] = None


class SourceDetails(BaseModel):
    capture_source_type: str
    dom_metadata: Optional[DomMetadata] = None
    ocr_metadata: Optional[OcrMetadata] = None


class FeedItem(BaseModel):
    position_in_feed: int
    approx_timestamp_offset_sec: Optional[float] = None
    content_type: str = "VIDEO"
    is_ad: bool = False

    # AI disclosure fields (platform-disclosed AI labels and C2PA indicators)
    # These capture EXPLICIT platform disclosure signals, NOT AI generation detection
    ai_disclosure: Optional[str] = None  # Platform AI labels: "LABELED_AI" | "NOT_LABELED" | None
    c2pa_disclosure: Optional[str] = None  # C2PA/Content Credentials: "HAS_C2PA" | "NO_C2PA" | None

    ad_metadata: Optional[AdMetadata] = None
    account: Optional[AccountInfo] = None
    content_text: ContentText = Field(default_factory=ContentText)
    topics: TopicsInfo = Field(default_factory=TopicsInfo)
    political: PoliticalInfo = Field(default_factory=PoliticalInfo)
    wellbeing: WellbeingInfo = Field(default_factory=WellbeingInfo)
    engagement_drivers: EngagementDrivers = Field(default_factory=EngagementDrivers)
    repetition: RepetitionInfo = Field(default_factory=RepetitionInfo)
    algorithm_inferences: AlgorithmInferences = Field(default_factory=AlgorithmInferences)
    source_details: SourceDetails


# ---------- Aggregates ----------

class TopicDistributionEntry(BaseModel):
    category: str
    count: int
    percentage: float


class ValenceDistribution(BaseModel):
    POSITIVE: int = 0
    NEUTRAL: int = 0
    NEGATIVE: int = 0
    MIXED: int = 0


class WellbeingSummary(BaseModel):
    high_relevance_items: int = 0
    potential_risk_items: int = 0
    valence_distribution: ValenceDistribution = Field(default_factory=ValenceDistribution)


class PoliticalContentSummary(BaseModel):
    political_items: int = 0
    political_percentage: float = 0.0


class RepetitionSummary(BaseModel):
    items_in_repetition_clusters: int = 0
    largest_cluster_size: int = 0


class HookCount(BaseModel):
    hook: str
    count: int


class EngagementPatternSummary(BaseModel):
    top_hooks: List[HookCount] = Field(default_factory=list)


class Aggregates(BaseModel):
    total_feed_items: int = 0
    total_ads: int = 0
    ad_percentage: float = 0.0
    topic_distribution: List[TopicDistributionEntry] = Field(default_factory=list)
    wellbeing_summary: WellbeingSummary = Field(default_factory=WellbeingSummary)
    political_content_summary: PoliticalContentSummary = Field(default_factory=PoliticalContentSummary)
    repetition_summary: RepetitionSummary = Field(default_factory=RepetitionSummary)
    engagement_pattern_summary: EngagementPatternSummary = Field(default_factory=EngagementPatternSummary)


# ---------- Privacy & Debug ----------

class PrivacyInfo(BaseModel):
    user_identifiers_stored: bool = False
    profile_photos_stored: bool = False
    raw_text_stored: bool = True
    retention_policy_key: str = "SHORT"
    redacted_fields: List[str] = Field(default_factory=list)


class DebugWarning(BaseModel):
    code: str
    message: str


class DebugInfo(BaseModel):
    processing_time_seconds: Optional[float] = None
    frames_extracted: Optional[int] = None
    frames_sampled_for_ocr: Optional[int] = None
    errors: List[DebugWarning] = Field(default_factory=list)
    warnings: List[DebugWarning] = Field(default_factory=list)
    raw_backend_payload: Optional[Dict] = None


# ---------- Top-level unified scan result ----------

class UnifiedScanResult(BaseModel):
    schema_version: str = "1.0.0"
    scan_metadata: ScanMetadata
    environment: Environment
    feed_items: List[FeedItem] = Field(default_factory=list)
    aggregates: Aggregates = Field(default_factory=Aggregates)
    privacy: PrivacyInfo = Field(default_factory=PrivacyInfo)
    debug: DebugInfo = Field(default_factory=DebugInfo)
