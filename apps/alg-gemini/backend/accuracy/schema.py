"""
Pydantic models for Accuracy Architecture v3.1 (HPA + CMA).

Phase 5B NOTE:
- These types are scaffolding only.
- They are NOT yet wired into any runtime analysis pipeline.
- All fields are optional or have safe defaults so we can adopt them
  incrementally without breaking existing outputs.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from enum import Enum

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Core enums and small value objects
# ---------------------------------------------------------------------------

ClaimStatus = Literal["FINAL", "PRELIMINARY", "ABSTAIN"]
ConfidenceBand = Literal["LOW", "MED", "HIGH"]
EstimateType = Literal["POINT", "INTERVAL", "QUALITATIVE"]


class UncertaintyInterval(BaseModel):
    """Numeric confidence interval for INTERVAL estimates."""

    lower: float
    upper: float
    confidence_level: float = Field(
        0.95,
        description="Nominal confidence level (e.g., 0.95 for a 95% interval).",
    )


class CoverageSummary(BaseModel):
    """
    How much of the feed contributed evidence to a particular claim.

    This mirrors the v3.x accuracy docs but keeps everything optional so
    we can gradually adopt it in the analysis pipeline.
    """

    items_supporting: Optional[int] = None
    items_analyzed: Optional[int] = None
    items_excluded: Optional[int] = None
    coverage_pct: Optional[float] = None


class ThresholdGate(BaseModel):
    """
    Record of a single threshold evaluation for an insight (e.g., minimum N).
    """

    gate_name: str
    required_value: Optional[float] = None
    actual_value: Optional[float] = None
    passed: Optional[bool] = None


class MethodReliability(BaseModel):
    """
    Static reliability metadata for a detection method, as described in v3.1.
    """

    method: Optional[str] = None
    base_reliability: Optional[float] = None
    platform_modifier: Optional[float] = None
    effective_reliability: Optional[float] = None
    reliability_source: Optional[str] = None


class ConflictResolution(BaseModel):
    """
    How conflicting evidence was handled for a given EvidenceItem.
    """

    resolution_type: Optional[Literal["PRECEDENCE", "MAJORITY", "ABSTAIN", "MANUAL"]] = None
    winning_evidence_id: Optional[str] = None
    resolution_rationale: Optional[str] = None
    confidence_penalty: Optional[float] = None


# ---------------------------------------------------------------------------
# Conflict resolution engine (Phase 5F1)
# ---------------------------------------------------------------------------


class ConflictType(str, Enum):
    PLATFORM_OCR_MISMATCH = "PLATFORM_OCR_MISMATCH"
    CREATOR_DENIAL = "CREATOR_DENIAL"
    LABEL_PROMO_MISMATCH = "LABEL_PROMO_MISMATCH"
    MULTI_METHOD_CONFLICT = "MULTI_METHOD_CONFLICT"
    DUPLICATE_ITEM = "DUPLICATE_ITEM"
    INCOMPLETE_METADATA = "INCOMPLETE_METADATA"
    TEMPORAL_CONFLICT = "TEMPORAL_CONFLICT"


class ConflictSeverity(str, Enum):
    CRITICAL = "critical"
    MODERATE = "moderate"
    MINOR = "minor"


class ConflictResolutionRecord(BaseModel):
    """
    Complete audit record for a resolved conflict (Phase 5F1).

    This is an additive structure and does not replace the simpler
    ConflictResolution summary attached to EvidenceItem.
    """

    # Conflict identification
    conflict_id: str
    conflict_type: ConflictType
    conflict_severity: ConflictSeverity

    # Resolution outcome
    resolution_type: Literal["PRECEDENCE", "MAJORITY", "ABSTAIN", "MANUAL"]
    winning_method: Optional[str] = None  # Detection method or "MAJORITY"
    winning_evidence_id: Optional[str] = None
    losing_methods: List[str] = Field(default_factory=list)
    losing_evidence_ids: List[str] = Field(default_factory=list)

    # Rationale and impact
    rationale: str
    confidence_penalty: float = 0.0

    # Outcome classification
    claim_status: ClaimStatus
    classification: Optional[str] = None  # e.g. "LABELED_AD", "UNLABELED_PROMOTION"

    # Optional metadata
    metadata: Optional[Dict[str, Any]] = None

    # Timestamps
    detected_at: datetime
    resolved_at: datetime


class ConflictMetrics(BaseModel):
    """
    Metrics for conflict detection and resolution (Phase 5F1).

    All fields have safe defaults for backward compatibility.
    """

    # Detection metrics
    total_conflicts_detected: int = 0
    conflicts_by_type: Dict[str, int] = Field(default_factory=dict)
    conflicts_by_severity: Dict[str, int] = Field(default_factory=dict)

    # Resolution metrics
    conflicts_resolved: int = 0
    conflicts_abstained: int = 0
    conflict_resolution_rate: float = 0.0  # resolved / detected

    # Quality metrics
    precedence_resolutions: int = 0
    majority_resolutions: int = 0
    avg_confidence_penalty: float = 0.0

    # Platform label dominance
    platform_label_override_count: int = 0
    platform_label_override_rate: float = 0.0

    # Invariant checks
    validation_passed: bool = True
    validation_errors: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Global metadata & audit trail
# ---------------------------------------------------------------------------


class TimeSpan(BaseModel):
    start: Optional[str] = None  # ISO 8601
    end: Optional[str] = None  # ISO 8601
    duration_seconds: Optional[float] = None


class CoverageBlock(BaseModel):
    n_covered: Optional[int] = None
    n_excluded: Optional[int] = None
    n_total: Optional[int] = None
    coverage_pct: Optional[float] = None
    exclusion_reasons: Dict[str, int] = Field(default_factory=dict)


class LanguageInfo(BaseModel):
    primary: Optional[str] = None  # ISO 639-1
    confidence: Optional[float] = None
    secondary_languages: List[str] = Field(default_factory=list)


class GlobalMetadata(BaseModel):
    """
    Top-level metadata for an accuracy analysis result.

    This mirrors (and extends) the v3.x GlobalMetadata definition, but all
    fields are optional so we can backfill over time.
    """

    # Identity / versioning
    scan_id: Optional[str] = None
    schema_version: Optional[str] = None  # e.g. "3.1.0"

    # Source characteristics
    modality: Optional[str] = None  # 'DESKTOP_EXTENSION' | 'MOBILE_VIDEO' | ...
    platform: Optional[str] = None  # 'tiktok' | 'instagram' | ...

    # Sample profile
    post_count: Optional[int] = None
    time_span: Optional[TimeSpan] = None

    # Coverage accounting (per-field)
    coverage: Dict[str, CoverageBlock] = Field(default_factory=dict)

    # Language detection
    language: Optional[LanguageInfo] = None

    # Processing info
    generated_at: Optional[datetime] = None
    processing_duration_ms: Optional[float] = None


class ProcessingStage(BaseModel):
    stage_name: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    items_processed: Optional[int] = None
    items_failed: Optional[int] = None
    notes: Optional[str] = None


class ThresholdConfig(BaseModel):
    """
    Placeholder for threshold configuration audit.

    For Phase 5B we only record an opaque config structure so we can
    store whatever the implementation needs in later phases.
    """

    schema_version: Optional[str] = None
    raw_config: Dict[str, object] = Field(
        default_factory=dict,
        description="Opaque configuration blob; concrete shape enforced later.",
    )


class AbstentionSummary(BaseModel):
    total_possible_insights: Optional[int] = None
    insights_generated: Optional[int] = None
    insights_abstained: Optional[int] = None
    abstention_rate: Optional[float] = None
    abstentions_by_reason: Dict[str, int] = Field(default_factory=dict)


class AuditTrail(BaseModel):
    """
    Global audit trail for a single analysis run.
    """

    schema_version: Optional[str] = None
    processing_stages: List[ProcessingStage] = Field(default_factory=list)
    threshold_configuration: Optional[ThresholdConfig] = None
    abstention_summary: Optional[AbstentionSummary] = None


# ---------------------------------------------------------------------------
# Evidence & insights
# ---------------------------------------------------------------------------


class ItemContext(BaseModel):
    """
    Pointer to source item without storing raw content.
    
    Phase 5D1: Contextual information about the item that produced evidence.
    """
    item_index: Optional[int] = None
    platform: Optional[str] = None
    modality: Optional[str] = None
    item_type: Optional[str] = None  # "post", "ad", "story", etc.
    platform_id: Optional[str] = None  # Platform's ID for the item (if available)
    timestamp_relative: Optional[str] = None  # "early", "middle", "late" in feed


class EvidenceItem(BaseModel):
    """
    Evidence item backing one or more insights.

    Includes v3.1 method_reliability and conflict tracking fields.
    
    Phase 5D1: Extended with source and item_context for evidence chain enforcement.
    """

    evidence_id: str
    source_item_index: Optional[int] = None

    # Signal classification
    signal_type: Optional[str] = None
    signal_subtype: Optional[str] = None

    # Detection details
    detection_method: Optional[str] = None
    detection_confidence: Optional[float] = None
    method_reliability: Optional[MethodReliability] = None
    effective_confidence: Optional[float] = None
    detection_rationale: Optional[str] = None

    # Evidence content
    text_snippet: Optional[str] = None
    snippet_context: Optional[str] = None
    pattern_matched: Optional[str] = None
    pattern_category: Optional[str] = None

    # Conflict tracking
    conflicts_with: List[str] = Field(default_factory=list)
    conflict_resolution: Optional[ConflictResolution] = None
    
    # Phase 5D1: Evidence source and context
    source: Optional[str] = None  # e.g., "platform_label", "ocr", "keyword", "model", "aggregate"
    item_context: Optional[ItemContext] = None


class Insight(BaseModel):
    """
    Canonical v3.1 Insight structure, including:
    - numeric_confidence
    - estimate_type
    - uncertainty_interval
    - claim_status
    - confidence_band
    - evidence_ids
    - coverage_summary
    - audit/threshold metadata
    """

    # Identity
    insight_id: str
    claim_type: str

    # Claim content
    claim_text: Optional[str] = None
    claim_status: ClaimStatus = "FINAL"
    claim_phrasing: Optional[str] = None

    # Confidence
    confidence_band: Optional[ConfidenceBand] = None
    numeric_confidence: Optional[float] = None
    confidence_rationale: Optional[str] = None

    # Estimate & uncertainty
    estimate_type: Optional[EstimateType] = None
    point_estimate: Optional[float] = None
    uncertainty_interval: Optional[UncertaintyInterval] = None
    interval_width_acceptable: Optional[bool] = None

    # Evidence & coverage
    evidence_ids: List[str] = Field(default_factory=list)
    evidence_summary: Optional[str] = None
    coverage_summary: Optional[CoverageSummary] = None
    aggregate_method_reliability: Optional[float] = None

    # Abstention / preliminary status
    abstention_flag: bool = False
    abstention_reason: Optional[str] = None
    abstention_message: Optional[str] = None
    preliminary_upgrade_path: Optional[str] = None

    # Audit hooks
    generation_method: Optional[str] = None
    threshold_gates: List[ThresholdGate] = Field(default_factory=list)
    correctness_definition_ref: Optional[str] = None


class DataSufficiency(BaseModel):
    minimum_items_required: Optional[int] = None
    items_available: Optional[int] = None
    is_sufficient: Optional[bool] = None
    insufficiency_reason: Optional[str] = None


class TabResult(BaseModel):
    """
    Top-level result for a single tab (ads, politics, patterns, creators, algorithm).
    """

    tab_name: str
    status: Optional[Literal["READY", "PARTIAL", "ABSTAINED", "ERROR"]] = None
    insights: List[Insight] = Field(default_factory=list)
    data_sufficiency: Optional[DataSufficiency] = None
    limits_summary: List[str] = Field(default_factory=list)


class AnalysisResult(BaseModel):
    """
    Canonical v3.1 analysis result wrapper.

    NOTE: This does not replace any existing response types yet. It is
    scaffolding that future phases can populate alongside current outputs.
    """

    meta: GlobalMetadata
    tabs: Dict[str, TabResult] = Field(
        default_factory=dict,
        description="Map of tab name → TabResult (e.g., 'ads', 'politics').",
    )

    # Optional global audit trail
    audit_trail: Optional[AuditTrail] = None


