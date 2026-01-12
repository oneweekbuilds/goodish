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


# ---------------------------------------------------------------------------
# Tab-specific accuracy contracts (Phase 5E bridge)
# ---------------------------------------------------------------------------


class TabAccuracyContract(BaseModel):
    """
    Lightweight, code-level contracts describing per-tab accuracy expectations.

    These are additive and backward compatible; callers may ignore if not needed.
    """

    tab: str
    final_definition: str
    preliminary_definition: str
    abstain_definition: str
    min_evidence_for_final: int = 1
    min_evidence_rate_for_final: Optional[float] = None
    allowed_evidence_types: List[str] = Field(default_factory=list)
    abstention_triggers: List[str] = Field(default_factory=list)
    uncertainty_width_threshold: Optional[float] = None
    conflict_penalty_threshold: Optional[float] = None
    notes: Optional[str] = None


# Ads is the reference contract; other tabs extend parity without changing Ads.
TAB_ACCURACY_CONTRACTS: Dict[str, TabAccuracyContract] = {
    "ads": TabAccuracyContract(
        tab="ads",
        final_definition="Platform-labeled or corroborated promotional content with complete evidence chain.",
        preliminary_definition="Promo indications with partial or lower-reliability support.",
        abstain_definition="No defensible promotional signal or conflicting signals with no winner.",
        min_evidence_for_final=1,
        allowed_evidence_types=[
            "platform_label",
            "ocr_disclosure",
            "promo_signal",
            "duplicate_item",
        ],
        abstention_triggers=[
            "no_evidence",
            "unresolved_conflict",
            "insufficient_sample",
        ],
        uncertainty_width_threshold=0.35,
        conflict_penalty_threshold=0.50,
    ),
    "politics": TabAccuracyContract(
        tab="politics",
        final_definition="Direct political/news signals with corroborated keywords or platform labels.",
        preliminary_definition="Weak or single-source political indicators without corroboration.",
        abstain_definition="No political indicators or conflicting platform vs keyword evidence.",
        min_evidence_for_final=2,
        min_evidence_rate_for_final=0.10,
        allowed_evidence_types=[
            "platform_label",
            "keyword_match",
            "content_category",
            "news_indicator",
        ],
        abstention_triggers=[
            "low_sample",
            "no_political_signals",
            "platform_keyword_conflict",
            "weak_reliability",
        ],
        uncertainty_width_threshold=0.40,
        conflict_penalty_threshold=0.40,
    ),
    "patterns": TabAccuracyContract(
        tab="patterns",
        final_definition="Repeated patterns across feed items supported by multiple occurrences.",
        preliminary_definition="Pattern detected but below repetition threshold or sample size.",
        abstain_definition="No observable repetition or conflicting temporal signals.",
        min_evidence_for_final=2,
        allowed_evidence_types=[
            "content_type_repetition",
            "creator_repetition",
            "temporal_pattern",
            "duplicate_inference",
        ],
        abstention_triggers=[
            "insufficient_repetition",
            "temporal_conflict",
            "low_sample",
        ],
        uncertainty_width_threshold=0.45,
        conflict_penalty_threshold=0.45,
    ),
    "creators": TabAccuracyContract(
        tab="creators",
        final_definition="Creator-level findings backed by verified extraction and repeated occurrences.",
        preliminary_definition="Single-observation creator signals or medium-confidence extraction.",
        abstain_definition="No reliable creator extraction or creator denial conflicts.",
        min_evidence_for_final=2,
        allowed_evidence_types=[
            "creator_handle",
            "creator_self_description",
            "observed_content",
            "verification_status",
        ],
        abstention_triggers=[
            "no_creator_extraction",
            "conflicting_creator_claims",
            "low_confidence_extraction",
        ],
        uncertainty_width_threshold=0.40,
        conflict_penalty_threshold=0.40,
    ),
    "algorithm": TabAccuracyContract(
        tab="algorithm",
        final_definition="High-confidence signals aggregated from other tabs with consistent support.",
        preliminary_definition="Signals present but with limited support or wide uncertainty.",
        abstain_definition="No defensible signals or conflicting intent indicators.",
        min_evidence_for_final=2,
        allowed_evidence_types=[
            "cross_tab_signal",
            "aggregated_inference",
            "content_cluster",
        ],
        abstention_triggers=[
            "no_signals",
            "conflicting_intents",
            "insufficient_cross_tab_support",
        ],
        uncertainty_width_threshold=0.35,
        conflict_penalty_threshold=0.50,
    ),
}


def get_tab_accuracy_contract(tab_name: str) -> TabAccuracyContract:
    """Return tab-specific accuracy contract with safe fallback."""
    return TAB_ACCURACY_CONTRACTS.get(
        tab_name,
        TabAccuracyContract(
            tab=tab_name,
            final_definition="Tab-specific contract not defined; require explicit evidence.",
            preliminary_definition="Weak or partial support.",
            abstain_definition="No defensible claim.",
            min_evidence_for_final=1,
        ),
    )


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
    POLITICS_SIGNAL_CONFLICT = "POLITICS_SIGNAL_CONFLICT"
    CREATOR_PROFILE_CONFLICT = "CREATOR_PROFILE_CONFLICT"
    PATTERN_INCONSISTENCY = "PATTERN_INCONSISTENCY"
    ALGORITHM_INTENT_CONFLICT = "ALGORITHM_INTENT_CONFLICT"


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


class CriticMetrics(BaseModel):
    """
    Metrics for critic/contract validation (separate from evidence-chain validation).

    Tracks downgrades and contract violations without mixing into evidence-chain metrics.
    """

    downgraded_final_to_preliminary: int = 0
    downgraded_final_to_abstain: int = 0
    downgraded_reasons: List[str] = Field(default_factory=list)  # Bounded list of reasons
    metadata_incomplete_count: int = 0
    contract_violations: List[str] = Field(default_factory=list)
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


