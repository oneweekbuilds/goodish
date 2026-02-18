"""Conflict type-specific handlers for Ads (Phase 5F1)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from .schema import (
    EvidenceItem,
    ConflictResolutionRecord,
    ConflictType,
    ConflictSeverity,
    ClaimStatus,
)
from .conflicts import _get_reliability


def resolve_platform_ocr_mismatch(
    platform_ev: EvidenceItem, ocr_ev: EvidenceItem
) -> ConflictResolutionRecord:
    """Platform vs OCR text: platform label always wins."""
    now = datetime.now(timezone.utc)
    return ConflictResolutionRecord(
        conflict_id="",
        conflict_type=ConflictType.PLATFORM_OCR_MISMATCH,
        conflict_severity=ConflictSeverity.CRITICAL,
        resolution_type="PRECEDENCE",
        winning_method="PLATFORM_LABEL",
        winning_evidence_id=platform_ev.evidence_id,
        losing_methods=[ocr_ev.detection_method or "OCR_DISCLOSURE"],
        losing_evidence_ids=[ocr_ev.evidence_id],
        rationale=(
            "Platform disclosure (reliability=0.999) overrides OCR text (reliability=0.85). "
            "Platform ad labels are legally binding."
        ),
        confidence_penalty=0.0,
        claim_status="FINAL",
        classification="LABELED_AD",
        metadata=None,
        detected_at=now,
        resolved_at=now,
    )


def resolve_creator_denial(
    platform_ev: EvidenceItem, denial_evs: List[EvidenceItem]
) -> ConflictResolutionRecord:
    """Creator denial vs platform label: platform wins, denial noted."""
    now = datetime.now(timezone.utc)
    losing_methods = [ev.detection_method or "" for ev in denial_evs]
    losing_ids = [ev.evidence_id for ev in denial_evs]

    metadata = {
        "creator_denial_noted": True,
        "denial_count": len(denial_evs),
    }

    return ConflictResolutionRecord(
        conflict_id="",
        conflict_type=ConflictType.CREATOR_DENIAL,
        conflict_severity=ConflictSeverity.CRITICAL,
        resolution_type="PRECEDENCE",
        winning_method="PLATFORM_LABEL",
        winning_evidence_id=platform_ev.evidence_id,
        losing_methods=losing_methods,
        losing_evidence_ids=losing_ids,
        rationale=(
            "Platform ad label (reliability=0.999) overrides creator denial. "
            "Denial noted but classification remains labeled ad."
        ),
        confidence_penalty=0.0,
        claim_status="FINAL",
        classification="LABELED_AD",
        metadata=metadata,
        detected_at=now,
        resolved_at=now,
    )


def resolve_label_promo_mismatch(
    promo_evidence: List[EvidenceItem],
) -> ConflictResolutionRecord:
    """No platform label but strong promotional signals → UNLABELED_PROMOTION."""
    now = datetime.now(timezone.utc)
    if not promo_evidence:
        avg_rel = 0.0
    else:
        rels = [_get_reliability(ev) for ev in promo_evidence]
        avg_rel = sum(rels) / len(rels)

    penalty = 0.05 if avg_rel >= 0.80 else 0.10
    claim_status = "FINAL" if avg_rel >= 0.80 else "PRELIMINARY"

    primary_ev = promo_evidence[0] if promo_evidence else None

    return ConflictResolutionRecord(
        conflict_id="",
        conflict_type=ConflictType.LABEL_PROMO_MISMATCH,
        conflict_severity=ConflictSeverity.MODERATE,
        resolution_type="PRECEDENCE",
        winning_method="AGGREGATE_PROMO_SIGNALS",
        winning_evidence_id=primary_ev.evidence_id if primary_ev else None,
        losing_methods=[],
        losing_evidence_ids=[],
        rationale=(
        f"Promotional signals detected (avg reliability={avg_rel:.2f}) without ad label. "
        "Classified as unlabeled promotion."
        ),
        confidence_penalty=penalty,
        claim_status=claim_status,
        classification="UNLABELED_PROMOTION",
        metadata=None,
        detected_at=now,
        resolved_at=now,
    )


def resolve_multi_method_conflict(
    evidence_items: List[EvidenceItem],
) -> ConflictResolutionRecord:
    """Resolve multi-method disagreement via precedence or majority."""
    now = datetime.now(timezone.utc)
    if not evidence_items:
        return ConflictResolutionRecord(
            conflict_id="",
            conflict_type=ConflictType.MULTI_METHOD_CONFLICT,
            conflict_severity=ConflictSeverity.MODERATE,
            resolution_type="ABSTAIN",
            winning_method=None,
            winning_evidence_id=None,
            losing_methods=[],
            losing_evidence_ids=[],
            rationale="No evidence items provided for conflict resolution.",
            confidence_penalty=1.0,
            claim_status="ABSTAIN",
            classification=None,
            metadata=None,
            detected_at=now,
            resolved_at=now,
        )

    # Sort by reliability
    sorted_evs = sorted(
        evidence_items,
        key=lambda ev: _get_reliability(ev),
        reverse=True,
    )
    top_rel = _get_reliability(sorted_evs[0])
    second_rel = _get_reliability(sorted_evs[1]) if len(sorted_evs) > 1 else 0.0

    # 1) Dominant method by precedence
    if top_rel >= 0.95 and (top_rel - second_rel) >= 0.10:
        return ConflictResolutionRecord(
            conflict_id="",
            conflict_type=ConflictType.MULTI_METHOD_CONFLICT,
            conflict_severity=ConflictSeverity.MODERATE,
            resolution_type="PRECEDENCE",
            winning_method=sorted_evs[0].detection_method,
            winning_evidence_id=sorted_evs[0].evidence_id,
            losing_methods=[ev.detection_method or "" for ev in sorted_evs[1:]],
            losing_evidence_ids=[ev.evidence_id for ev in sorted_evs[1:]],
            rationale="Highest reliability method selected by precedence (gap >= 0.10).",
            confidence_penalty=0.05,
            claim_status="FINAL",
            classification=_majority_classification(evidence_items),
            metadata=None,
            detected_at=now,
            resolved_at=now,
        )

    # 2) Majority vote among reliable methods
    reliable = [ev for ev in evidence_items if _get_reliability(ev) >= 0.70]
    if reliable:
        from collections import Counter

        classes = [ev.signal_type or "" for ev in reliable]
        counts = Counter(classes)
        majority_class, majority_count = counts.most_common(1)[0]
        majority_frac = majority_count / len(reliable)

        if majority_frac >= 0.60:
            winning_evs = [ev for ev in reliable if (ev.signal_type or "") == majority_class]
            losing_evs = [ev for ev in reliable if ev not in winning_evs]

            return ConflictResolutionRecord(
                conflict_id="",
                conflict_type=ConflictType.MULTI_METHOD_CONFLICT,
                conflict_severity=ConflictSeverity.MODERATE,
                resolution_type="MAJORITY",
                winning_method="MAJORITY",
                winning_evidence_id=winning_evs[0].evidence_id if winning_evs else None,
                losing_methods=[ev.detection_method or "" for ev in losing_evs],
                losing_evidence_ids=[ev.evidence_id for ev in losing_evs],
                rationale="Majority agreement among reliable methods.",
            confidence_penalty=0.10,
            claim_status="FINAL",
                classification="UNLABELED_PROMOTION",
                metadata=None,
                detected_at=now,
                resolved_at=now,
            )

    # 3) Unresolvable → ABSTAIN
    return ConflictResolutionRecord(
        conflict_id="",
        conflict_type=ConflictType.MULTI_METHOD_CONFLICT,
        conflict_severity=ConflictSeverity.MODERATE,
        resolution_type="ABSTAIN",
        winning_method=None,
        winning_evidence_id=None,
        losing_methods=[],
        losing_evidence_ids=[],
        rationale="No clear precedence or majority; abstaining.",
            confidence_penalty=1.0,
            claim_status="ABSTAIN",
        classification=None,
        metadata=None,
        detected_at=now,
        resolved_at=now,
    )


def _majority_classification(evidence_items: List[EvidenceItem]) -> str:
    """Heuristic classification from evidence types."""
    from collections import Counter

    if not evidence_items:
        return "UNKNOWN"

    classes = [ev.signal_type or "" for ev in evidence_items]
    majority, _ = Counter(classes).most_common(1)[0]
    if majority in {
        "discount_code",
        "call_to_action",
        "purchase_intent",
        "commercial_keywords",
    }:
        return "UNLABELED_PROMOTION"
    if majority == "platform_labeled_ad":
        return "LABELED_AD"
    return majority or "UNKNOWN"


def resolve_duplicate_items(evidence_items: List[EvidenceItem]) -> ConflictResolutionRecord:
    """Handle duplicate items with potentially different signals."""
    now = datetime.now(timezone.utc)
    if len(evidence_items) < 2:
        return ConflictResolutionRecord(
            conflict_id="",
            conflict_type=ConflictType.DUPLICATE_ITEM,
            conflict_severity=ConflictSeverity.MINOR,
            resolution_type="ABSTAIN",
            winning_method=None,
            winning_evidence_id=None,
            losing_methods=[],
            losing_evidence_ids=[],
            rationale="Not enough evidence items to determine duplicate.",
            confidence_penalty=0.0,
            claim_status="FINAL",
            classification=None,
            metadata=None,
            detected_at=now,
            resolved_at=now,
        )

    labeled = [ev for ev in evidence_items if (ev.signal_type or "") == "platform_labeled_ad"]
    unlabeled = [ev for ev in evidence_items if (ev.signal_type or "") == "platform_no_label"]

    if labeled:
        winning_ev = labeled[0]
        losing_evs = [ev for ev in evidence_items if ev is not winning_ev]
        signals_match = all(ev.signal_type == winning_ev.signal_type for ev in losing_evs)
        penalty = 0.0 if signals_match else 0.02
        metadata = {
            "duplicate_count": len(evidence_items),
            "signal_mismatch": not signals_match,
        }
        return ConflictResolutionRecord(
            conflict_id="",
            conflict_type=ConflictType.DUPLICATE_ITEM,
            conflict_severity=ConflictSeverity.MINOR,
            resolution_type="PRECEDENCE",
            winning_method=winning_ev.detection_method or "PLATFORM_LABEL",
            winning_evidence_id=winning_ev.evidence_id,
            losing_methods=[ev.detection_method or "" for ev in losing_evs],
            losing_evidence_ids=[ev.evidence_id for ev in losing_evs],
            rationale="Duplicate detected with signal mismatch. Platform label from preferred occurrence used.",
            confidence_penalty=penalty,
            claim_status="FINAL",
            classification="LABELED_AD",
            metadata=metadata,
            detected_at=now,
            resolved_at=now,
        )

    # Fallback: keep first occurrence
    original_ev = evidence_items[0]
    duplicate_evs = evidence_items[1:]
    signals_match = all(ev.signal_type == original_ev.signal_type for ev in duplicate_evs)
    penalty = 0.0 if signals_match else 0.02
    metadata = {
        "duplicate_count": len(evidence_items),
        "signal_mismatch": not signals_match,
    }

    return ConflictResolutionRecord(
        conflict_id="",
        conflict_type=ConflictType.DUPLICATE_ITEM,
        conflict_severity=ConflictSeverity.MINOR,
        resolution_type="PRECEDENCE",
        winning_method=original_ev.detection_method or "PLATFORM_LABEL",
        winning_evidence_id=original_ev.evidence_id,
        losing_methods=[ev.detection_method or "" for ev in duplicate_evs],
        losing_evidence_ids=[ev.evidence_id for ev in duplicate_evs],
        rationale="Duplicate detected; keeping first occurrence.",
            confidence_penalty=penalty,
            claim_status="FINAL",
        classification=_majority_classification(evidence_items),
        metadata=metadata,
        detected_at=now,
        resolved_at=now,
    )


# --------------------------------------------------------------------------- #
# Non-Ads tab conflict handlers (parity extensions)
# --------------------------------------------------------------------------- #


def resolve_politics_signal_conflict(
    platform_ev: EvidenceItem, keyword_evs: List[EvidenceItem]
) -> ConflictResolutionRecord:
    """Platform/first-party label overrides weaker keyword/classifier signals."""
    now = datetime.now(timezone.utc)
    losing_methods = [ev.detection_method or "KEYWORD_MATCH" for ev in keyword_evs]
    losing_ids = [ev.evidence_id for ev in keyword_evs]
    return ConflictResolutionRecord(
        conflict_id="",
        conflict_type=ConflictType.POLITICS_SIGNAL_CONFLICT,
        conflict_severity=ConflictSeverity.MODERATE,
        resolution_type="PRECEDENCE",
        winning_method=platform_ev.detection_method or "PLATFORM_LABEL",
        winning_evidence_id=platform_ev.evidence_id,
        losing_methods=losing_methods,
        losing_evidence_ids=losing_ids,
        rationale=(
            "Platform label or first-party indicator takes precedence over ambiguous "
            "keyword or classifier-only political signals."
        ),
        confidence_penalty=0.05,
        claim_status="FINAL",
        classification="POLITICAL_SIGNAL",
        metadata=None,
        detected_at=now,
        resolved_at=now,
    )


def resolve_creator_profile_conflict(
    self_description_ev: EvidenceItem, observed_evs: List[EvidenceItem]
) -> ConflictResolutionRecord:
    """Self-described identity wins unless multiple observed conflicts dominate."""
    now = datetime.now(timezone.utc)
    losing_methods = [ev.detection_method or "" for ev in observed_evs]
    losing_ids = [ev.evidence_id for ev in observed_evs]
    observed_reliabilities = [_get_reliability(ev) for ev in observed_evs] or [0.0]
    observed_avg = sum(observed_reliabilities) / len(observed_reliabilities)

    # If observed evidence is far stronger, fall back to majority.
    if observed_avg - _get_reliability(self_description_ev) >= 0.15:
        resolution_type = "MAJORITY"
        winning_method = "OBSERVED_CONTENT"
        winning_id = observed_evs[0].evidence_id if observed_evs else None
        penalty = 0.15
        claim_status = "PRELIMINARY"
        rationale = "Observed content reliability outweighs self-description."
    else:
        resolution_type = "PRECEDENCE"
        winning_method = self_description_ev.detection_method or "SELF_DESCRIPTION"
        winning_id = self_description_ev.evidence_id
        penalty = 0.05
        claim_status = "FINAL"
        rationale = "Creator self-description (first-party) dominates observed contradictions."

    return ConflictResolutionRecord(
        conflict_id="",
        conflict_type=ConflictType.CREATOR_PROFILE_CONFLICT,
        conflict_severity=ConflictSeverity.MODERATE,
        resolution_type=resolution_type,
        winning_method=winning_method,
        winning_evidence_id=winning_id,
        losing_methods=losing_methods,
        losing_evidence_ids=losing_ids,
        rationale=rationale,
        confidence_penalty=penalty,
        claim_status=claim_status,
        classification="CREATOR_PROFILE",
        metadata=None,
        detected_at=now,
        resolved_at=now,
    )


def resolve_pattern_inconsistency(
    evidence_items: List[EvidenceItem],
) -> ConflictResolutionRecord:
    """Temporal or duplication inconsistency within pattern signals."""
    now = datetime.now(timezone.utc)
    if not evidence_items:
        return ConflictResolutionRecord(
            conflict_id="",
            conflict_type=ConflictType.PATTERN_INCONSISTENCY,
            conflict_severity=ConflictSeverity.MINOR,
            resolution_type="ABSTAIN",
            winning_method=None,
            winning_evidence_id=None,
            losing_methods=[],
            losing_evidence_ids=[],
            rationale="No pattern evidence available.",
            confidence_penalty=0.25,
            claim_status="ABSTAIN",
            classification=None,
            metadata=None,
            detected_at=now,
            resolved_at=now,
        )

    sorted_evs = sorted(
        evidence_items, key=lambda ev: _get_reliability(ev), reverse=True
    )
    top_ev = sorted_evs[0]
    losing_evs = sorted_evs[1:]
    penalty = 0.10 if losing_evs else 0.0

    return ConflictResolutionRecord(
        conflict_id="",
        conflict_type=ConflictType.PATTERN_INCONSISTENCY,
        conflict_severity=ConflictSeverity.MODERATE,
        resolution_type="PRECEDENCE",
        winning_method=top_ev.detection_method or "PATTERN_SIGNAL",
        winning_evidence_id=top_ev.evidence_id,
        losing_methods=[ev.detection_method or "" for ev in losing_evs],
        losing_evidence_ids=[ev.evidence_id for ev in losing_evs],
        rationale="Highest reliability pattern signal selected; others penalized.",
        confidence_penalty=penalty,
        claim_status="PRELIMINARY" if penalty > 0 else "FINAL",
        classification="PATTERN_SIGNAL",
        metadata=None,
        detected_at=now,
        resolved_at=now,
    )


def resolve_algorithm_intent_conflict(
    evidence_items: List[EvidenceItem],
) -> ConflictResolutionRecord:
    """Resolve conflicting inferred intents with majority weighting."""
    now = datetime.now(timezone.utc)
    if not evidence_items:
        return ConflictResolutionRecord(
            conflict_id="",
            conflict_type=ConflictType.ALGORITHM_INTENT_CONFLICT,
            conflict_severity=ConflictSeverity.MINOR,
            resolution_type="ABSTAIN",
            winning_method=None,
            winning_evidence_id=None,
            losing_methods=[],
            losing_evidence_ids=[],
            rationale="No intent evidence provided.",
            confidence_penalty=0.50,
            claim_status="ABSTAIN",
            classification=None,
            metadata=None,
            detected_at=now,
            resolved_at=now,
        )

    from collections import Counter

    intents = [ev.signal_subtype or "" for ev in evidence_items]
    counts = Counter(intents)
    majority_intent, count = counts.most_common(1)[0]
    majority_frac = count / len(evidence_items)

    if majority_frac >= 0.6:
        winning_evs = [
            ev for ev in evidence_items if (ev.signal_subtype or "") == majority_intent
        ]
        losing_evs = [ev for ev in evidence_items if ev not in winning_evs]
        return ConflictResolutionRecord(
            conflict_id="",
            conflict_type=ConflictType.ALGORITHM_INTENT_CONFLICT,
            conflict_severity=ConflictSeverity.MODERATE,
            resolution_type="MAJORITY",
            winning_method="MAJORITY",
            winning_evidence_id=winning_evs[0].evidence_id if winning_evs else None,
            losing_methods=[ev.detection_method or "" for ev in losing_evs],
            losing_evidence_ids=[ev.evidence_id for ev in losing_evs],
            rationale="Majority of intent signals agree; minority penalized.",
            confidence_penalty=0.15 if losing_evs else 0.05,
            claim_status="PRELIMINARY" if losing_evs else "FINAL",
            classification="INTENT_SIGNAL",
            metadata=None,
            detected_at=now,
            resolved_at=now,
        )

    return ConflictResolutionRecord(
        conflict_id="",
        conflict_type=ConflictType.ALGORITHM_INTENT_CONFLICT,
        conflict_severity=ConflictSeverity.MODERATE,
        resolution_type="ABSTAIN",
        winning_method=None,
        winning_evidence_id=None,
        losing_methods=[],
        losing_evidence_ids=[],
        rationale="Intent signals conflict without majority; abstaining.",
        confidence_penalty=0.50,
        claim_status="ABSTAIN",
        classification=None,
        metadata=None,
        detected_at=now,
        resolved_at=now,
    )