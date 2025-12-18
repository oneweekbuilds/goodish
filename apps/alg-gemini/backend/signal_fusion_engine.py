"""
Signal Fusion Engine (Prompt 6)

Combines multimodal signals (text, audio, vision, metadata) into a unified
confidence assessment with transparent reasoning.

ARCHITECTURAL BOUNDARY:
---------------------------------------------------------------------------
This module (Prompt 6) is responsible for:
  - Cross-modal signal arbitration
  - Conflict resolution with confidence downgrades
  - Unified confidence synthesis
  - Producing "why we believe this" explanations
  - MAY OVERRIDE pre-fusion estimates from earlier prompts

This module consumes:
  - Per-modality signals from Prompt 2 (multimodal features)
  - Pre-fusion estimates from Prompt 5 (public figure signals, marked _pre_fusion: True)
  - Existing evidence bundles and detectors

This module is PURE: no HTTP, no UI, no database access.
---------------------------------------------------------------------------

FUSION PRINCIPLES (STRICT):

1. Coverage First
   If key modalities are missing -> return "unknown" or downgrade to "low"

2. Disagreement Lowers Confidence
   Conflicting signals NEVER increase confidence
   When modalities disagree, prefer downgrading confidence over forcing a decision

3. Weak Signals Never Dominate
   Metadata (verified badge, etc.) can NEVER overpower content signals
   Content signals (text, audio, vision) have priority

4. Pre-Fusion Estimates Are Advisory
   Signals marked `_pre_fusion: True` may be overridden by fusion logic

5. Absence != Evidence of Absence
   Missing signal != signal_not_found UNLESS coverage supports that conclusion

These rules are enforced in code and documented in output.
---------------------------------------------------------------------------

Output Structure:
{
    "fused_present": "yes" | "no" | "unknown",
    "fused_confidence": "low" | "medium" | "high",
    "modality_contributions": {
        "text": { "contributed": bool, "evidence_refs": [...], "weight": str },
        "audio": { ... },
        "vision": { ... },
        "metadata": { ... }
    },
    "conflict_resolution_notes": [...],
    "why_we_believe_this": {
        "primary_signals": [...],
        "supporting_signals": [...],
        "discounted_signals": [...],
        "not_evaluated": [...]
    },
    "_fusion_metadata": {
        "fusion_version": str,
        "rules_applied": [...]
    }
}
"""

from typing import Dict, Any, List, Optional, Literal


# =============================================================================
# Constants
# =============================================================================

FUSION_VERSION = "1.0.0"

# Modality weight categories (qualitative, not numeric)
# Content signals have priority over metadata signals
MODALITY_PRIORITY = {
    "text": "content",     # High priority - content signal
    "audio": "content",    # High priority - content signal
    "vision": "content",   # High priority - content signal
    "metadata": "weak",    # Low priority - supporting signal only
}

# Coverage thresholds for claiming absence
COVERAGE_THRESHOLDS = {
    "ocr_coverage_percent_min": 60,  # Below this, cannot claim "not found"
    "min_modalities_for_high_confidence": 2,  # Need at least 2 content modalities
}


# =============================================================================
# Fusion Primitives
# =============================================================================

def _count_content_signals(
    signals_by_modality: Dict[str, List[Dict[str, Any]]]
) -> int:
    """Count signals from content modalities (text, audio, vision)."""
    count = 0
    for modality in ["text", "audio", "vision"]:
        count += len(signals_by_modality.get(modality, []))
    return count


def _count_metadata_signals(
    signals_by_modality: Dict[str, List[Dict[str, Any]]]
) -> int:
    """Count signals from metadata modality."""
    return len(signals_by_modality.get("metadata", []))


def _check_coverage_sufficient(
    modality_coverage: Dict[str, Any]
) -> Dict[str, bool]:
    """
    Check which modalities have sufficient coverage for reliable claims.

    Returns dict with modality -> is_sufficient mapping.
    """
    result = {
        "text": modality_coverage.get("text_available", False),
        "audio": modality_coverage.get("audio_analyzed", False),
        "vision": False,
        "metadata": modality_coverage.get("metadata_available", False),
    }

    # Vision is sufficient if OCR coverage is above threshold
    ocr_pct = modality_coverage.get("ocr_coverage_percent", 0)
    result["vision"] = ocr_pct >= COVERAGE_THRESHOLDS["ocr_coverage_percent_min"]

    return result


def _detect_conflicts(
    signals_by_modality: Dict[str, List[Dict[str, Any]]],
    coverage_sufficient: Dict[str, bool]
) -> List[Dict[str, Any]]:
    """
    Detect conflicts between modalities.

    A conflict occurs when:
    - One modality fires signals and another with sufficient coverage does not
    - Different modalities suggest different conclusions

    Returns list of conflict dicts.
    """
    conflicts = []

    # Get modalities that fired signals vs those that didn't
    modalities_with_signals = [
        m for m, signals in signals_by_modality.items()
        if signals and MODALITY_PRIORITY.get(m) == "content"
    ]

    modalities_without_signals = [
        m for m, signals in signals_by_modality.items()
        if not signals
        and MODALITY_PRIORITY.get(m) == "content"
        and coverage_sufficient.get(m, False)
    ]

    # Check for partial detection (some content modalities fired, others didn't)
    if modalities_with_signals and modalities_without_signals:
        conflicts.append({
            "type": "partial_detection",
            "description": (
                f"Signals were detected in {', '.join(modalities_with_signals)} "
                f"but not in {', '.join(modalities_without_signals)} "
                "(which had sufficient coverage to detect)."
            ),
            "resolution": "confidence_downgrade",
            "modalities_firing": modalities_with_signals,
            "modalities_not_firing": modalities_without_signals,
        })

    return conflicts


def _apply_fusion_rules(
    n_content_signals: int,
    n_metadata_signals: int,
    n_modalities_with_signals: int,
    n_modalities_with_coverage: int,
    conflicts: List[Dict[str, Any]],
    pre_fusion_present: Optional[str],
    pre_fusion_confidence: Optional[str],
) -> Dict[str, Any]:
    """
    Apply fusion rules to determine final presence and confidence.

    Rules (in priority order):
    1. Coverage First - insufficient coverage -> unknown/low
    2. Disagreement Lowers Confidence - conflicts -> downgrade
    3. Weak Signals Never Dominate - metadata alone -> low
    4. Pre-Fusion Advisory - may override
    5. Absence != Evidence of Absence
    """
    rules_applied = []

    # Start with pre-fusion estimates if available
    fused_present = pre_fusion_present or "unknown"
    fused_confidence = pre_fusion_confidence or "unknown"

    # Rule 1: Coverage First
    # If fewer than 2 content modalities have coverage, cap confidence at low
    if n_modalities_with_coverage < 2:
        if fused_confidence in ("medium", "high"):
            fused_confidence = "low"
            rules_applied.append("COVERAGE_FIRST: <2 content modalities with coverage -> capped at low")
        # If no modalities with signals and poor coverage, cannot claim absence
        if n_content_signals == 0:
            fused_present = "unknown"
            rules_applied.append("COVERAGE_FIRST: no signals + poor coverage -> unknown (not 'no')")

    # Rule 2: Disagreement Lowers Confidence
    if conflicts:
        for conflict in conflicts:
            if conflict["type"] == "partial_detection":
                if fused_confidence == "high":
                    fused_confidence = "medium"
                    rules_applied.append("DISAGREEMENT: partial detection -> high->medium")
                elif fused_confidence == "medium":
                    fused_confidence = "low"
                    rules_applied.append("DISAGREEMENT: partial detection -> medium->low")

    # Rule 3: Weak Signals Never Dominate
    # If only metadata signals and no content signals, keep confidence low
    if n_metadata_signals > 0 and n_content_signals == 0:
        if fused_present == "yes":
            fused_confidence = "low"
            rules_applied.append("WEAK_SIGNALS: metadata-only signals -> capped at low confidence")

    # Rule 4: Pre-Fusion Advisory
    # Pre-fusion estimates are starting points; fusion rules may have already modified them
    if pre_fusion_present and pre_fusion_present != fused_present:
        rules_applied.append(f"PRE_FUSION_OVERRIDE: {pre_fusion_present} -> {fused_present}")
    if pre_fusion_confidence and pre_fusion_confidence != fused_confidence:
        rules_applied.append(f"PRE_FUSION_OVERRIDE: confidence {pre_fusion_confidence} -> {fused_confidence}")

    # Rule 5: Absence != Evidence of Absence
    # Only claim "no" if we have good coverage and truly found nothing
    if fused_present == "no" and n_modalities_with_coverage < 2:
        fused_present = "unknown"
        rules_applied.append("ABSENCE_RULE: cannot claim 'no' with <2 modalities covered")

    return {
        "fused_present": fused_present,
        "fused_confidence": fused_confidence,
        "rules_applied": rules_applied,
    }


# =============================================================================
# Main Fusion Function
# =============================================================================

def fuse_signals(
    signals_fired: List[Dict[str, Any]],
    signals_not_evaluated: List[Dict[str, Any]],
    signals_not_found: List[Dict[str, Any]],
    modality_coverage: Dict[str, Any],
    pre_fusion_present: Optional[str] = None,
    pre_fusion_confidence: Optional[str] = None,
    signal_type: str = "generic",
) -> Dict[str, Any]:
    """
    Fuse multimodal signals into a unified assessment.

    This is the main entry point for the Signal Fusion Engine.

    Args:
        signals_fired: List of signal dicts that were detected
                       Each should have "id", "label", "modality", "evidence_ref"
        signals_not_evaluated: List of signal dicts that couldn't be checked
                               (missing modality)
        signals_not_found: List of signal dicts that were checked but not found
        modality_coverage: Dict with coverage info:
                           - text_available: bool
                           - audio_analyzed: bool
                           - ocr_coverage_percent: float (0-100)
                           - metadata_available: bool
        pre_fusion_present: Pre-fusion estimate of presence ("yes", "no", "unknown")
        pre_fusion_confidence: Pre-fusion estimate of confidence ("low", "medium", "high")
        signal_type: Type of signal being fused (for output context)

    Returns:
        Fused result dict with:
        - fused_present: "yes" | "no" | "unknown"
        - fused_confidence: "low" | "medium" | "high"
        - modality_contributions: per-modality breakdown
        - conflict_resolution_notes: list of conflict dicts
        - why_we_believe_this: structured reasoning object
        - _fusion_metadata: version and rules applied
    """
    # Group signals by modality
    signals_by_modality: Dict[str, List[Dict[str, Any]]] = {
        "text": [],
        "audio": [],
        "vision": [],
        "metadata": [],
    }

    for signal in signals_fired:
        modality = signal.get("modality", "unknown")
        if modality in signals_by_modality:
            signals_by_modality[modality].append(signal)

    # Check coverage sufficiency
    coverage_sufficient = _check_coverage_sufficient(modality_coverage)

    # Count signals
    n_content_signals = _count_content_signals(signals_by_modality)
    n_metadata_signals = _count_metadata_signals(signals_by_modality)

    # Count modalities with signals
    n_modalities_with_signals = sum(
        1 for m, signals in signals_by_modality.items()
        if signals and MODALITY_PRIORITY.get(m) == "content"
    )

    # Count content modalities with sufficient coverage
    n_modalities_with_coverage = sum(
        1 for m in ["text", "audio", "vision"]
        if coverage_sufficient.get(m, False)
    )

    # Detect conflicts
    conflicts = _detect_conflicts(signals_by_modality, coverage_sufficient)

    # Apply fusion rules
    fusion_result = _apply_fusion_rules(
        n_content_signals=n_content_signals,
        n_metadata_signals=n_metadata_signals,
        n_modalities_with_signals=n_modalities_with_signals,
        n_modalities_with_coverage=n_modalities_with_coverage,
        conflicts=conflicts,
        pre_fusion_present=pre_fusion_present,
        pre_fusion_confidence=pre_fusion_confidence,
    )

    # Build modality contributions
    modality_contributions = {}
    for modality in ["text", "audio", "vision", "metadata"]:
        signals = signals_by_modality.get(modality, [])
        contributed = len(signals) > 0

        # Determine weight category
        if not coverage_sufficient.get(modality, False):
            weight = "not_evaluated"
        elif MODALITY_PRIORITY.get(modality) == "weak":
            weight = "supporting_only"
        elif contributed:
            weight = "primary"
        else:
            weight = "checked_negative"

        modality_contributions[modality] = {
            "contributed": contributed,
            "evidence_refs": [s.get("evidence_ref", []) for s in signals],
            "weight": weight,
            "signal_count": len(signals),
        }

    # Build "why we believe this" structure
    why_we_believe_this = {
        "primary_signals": [],
        "supporting_signals": [],
        "discounted_signals": [],
        "not_evaluated": [],
    }

    for signal in signals_fired:
        modality = signal.get("modality", "unknown")
        priority = MODALITY_PRIORITY.get(modality, "unknown")

        signal_entry = {
            "id": signal.get("id"),
            "label": signal.get("label"),
            "modality": modality,
            "evidence_ref": signal.get("evidence_ref", []),
        }

        if priority == "content":
            why_we_believe_this["primary_signals"].append(signal_entry)
        elif priority == "weak":
            why_we_believe_this["supporting_signals"].append(signal_entry)

    # Add discounted signals (those from modalities with poor coverage)
    for signal in signals_not_found:
        modality = signal.get("modality", "unknown")
        if not coverage_sufficient.get(modality, False):
            # Cannot claim "not found" with poor coverage - discount it
            why_we_believe_this["discounted_signals"].append({
                "id": signal.get("id"),
                "label": signal.get("label"),
                "modality": modality,
                "reason": f"Insufficient {modality} coverage to claim absence",
            })

    # Add not-evaluated signals
    for signal in signals_not_evaluated:
        why_we_believe_this["not_evaluated"].append({
            "id": signal.get("id"),
            "label": signal.get("label"),
            "modality": signal.get("modality"),
            "reason": signal.get("why", "Modality not available"),
        })

    # Build conflict resolution notes
    conflict_resolution_notes = []
    for conflict in conflicts:
        conflict_resolution_notes.append({
            "type": conflict["type"],
            "description": conflict["description"],
            "how_resolved": (
                "Confidence was downgraded because signals were detected in some "
                "modalities but not others with sufficient coverage. "
                "Disagreement never increases confidence."
            ),
        })

    return {
        "fused_present": fusion_result["fused_present"],
        "fused_confidence": fusion_result["fused_confidence"],
        "modality_contributions": modality_contributions,
        "conflict_resolution_notes": conflict_resolution_notes,
        "why_we_believe_this": why_we_believe_this,
        "_fusion_metadata": {
            "fusion_version": FUSION_VERSION,
            "signal_type": signal_type,
            "rules_applied": fusion_result["rules_applied"],
            "input_counts": {
                "signals_fired": len(signals_fired),
                "signals_not_evaluated": len(signals_not_evaluated),
                "signals_not_found": len(signals_not_found),
            },
        },
    }


# =============================================================================
# Public Figure Signals Fusion (Prompt 5 Integration)
# =============================================================================

def fuse_public_figure_signals(
    pre_fusion_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Apply signal fusion to public figure signals from Prompt 5.

    This is a specialized wrapper that:
    1. Extracts signals and coverage from the pre-fusion result
    2. Applies fusion rules
    3. Returns fused result with preserved epistemic boundaries

    Args:
        pre_fusion_result: Output from public_figure_signals.detect_public_figure_signals()
                          Must have _pre_fusion: True flag

    Returns:
        Fused public figure signals result
    """
    # Verify this is a pre-fusion result
    if not pre_fusion_result.get("_pre_fusion"):
        # Already fused or not from Prompt 5 - return as-is with warning
        result = pre_fusion_result.copy()
        result["_fusion_warning"] = "Input was not marked as pre-fusion; no fusion applied"
        return result

    # Extract components
    signals_fired = pre_fusion_result.get("signals_fired", [])
    signals_not_evaluated = pre_fusion_result.get("signals_not_evaluated", [])
    signals_not_found = pre_fusion_result.get("signals_not_found", [])
    modality_coverage = pre_fusion_result.get("modality_coverage", {})

    # Map modality_coverage to expected format
    coverage_for_fusion = {
        "text_available": modality_coverage.get("text_available", False),
        "audio_analyzed": modality_coverage.get("audio_analyzed", False),
        "ocr_coverage_percent": 100 if modality_coverage.get("ocr_available", False) else 0,
        "metadata_available": modality_coverage.get("metadata_available", False),
    }

    # Run fusion
    fused = fuse_signals(
        signals_fired=signals_fired,
        signals_not_evaluated=signals_not_evaluated,
        signals_not_found=signals_not_found,
        modality_coverage=coverage_for_fusion,
        pre_fusion_present=pre_fusion_result.get("present"),
        pre_fusion_confidence=pre_fusion_result.get("confidence"),
        signal_type="public_figure",
    )

    # Preserve epistemic boundaries from Prompt 5
    fused["what_this_does_not_mean"] = pre_fusion_result.get("what_this_does_not_mean", [])

    # Preserve confidence drivers and merge with fusion info
    fused["confidence_drivers"] = pre_fusion_result.get("confidence_drivers", [])

    # Add fusion-specific confidence driver if rules were applied
    if fused["_fusion_metadata"]["rules_applied"]:
        fused["confidence_drivers"].append({
            "direction": "note",
            "label": "Signal fusion applied",
            "detail": (
                f"Cross-modal fusion was applied. "
                f"Rules: {', '.join(fused['_fusion_metadata']['rules_applied'][:3])}"
            ),
        })

    # Mark as fused (no longer pre-fusion)
    fused["_pre_fusion"] = False
    fused["_fused"] = True

    return fused


# =============================================================================
# Generic Evidence Bundle Fusion
# =============================================================================

def fuse_evidence_bundle_signals(
    feature_collection: Dict[str, Any],
    signals_fired: List[Dict[str, Any]],
    signals_not_evaluated: List[Dict[str, Any]],
    signals_not_found: List[Dict[str, Any]],
    signal_type: str = "generic",
) -> Dict[str, Any]:
    """
    Apply signal fusion to evidence bundle signals using feature collection coverage.

    This is a convenience wrapper that extracts coverage from a feature collection
    and applies fusion.

    Args:
        feature_collection: FeatureBundleCollection from feature_bundle.py
        signals_fired: Signals that were detected
        signals_not_evaluated: Signals that couldn't be checked
        signals_not_found: Signals that were checked but not found
        signal_type: Type of signal for context

    Returns:
        Fused result dict
    """
    # Extract coverage from feature collection
    coverage = feature_collection.get("coverage", {})
    audio_coverage = coverage.get("audio", {})
    vision_coverage = coverage.get("vision", {})
    text_coverage = coverage.get("text", {})
    metadata_coverage = coverage.get("metadata", {})

    modality_coverage = {
        "text_available": text_coverage.get("coverage_percent", 0) > 0,
        "audio_analyzed": audio_coverage.get("audio_analyzed", False),
        "ocr_coverage_percent": vision_coverage.get("ocr_coverage_percent", 0),
        "metadata_available": metadata_coverage.get("coverage_percent", 0) > 0,
    }

    return fuse_signals(
        signals_fired=signals_fired,
        signals_not_evaluated=signals_not_evaluated,
        signals_not_found=signals_not_found,
        modality_coverage=modality_coverage,
        signal_type=signal_type,
    )


# =============================================================================
# Fusion Summary for Explanations (Prompt 7 Integration)
# =============================================================================

def get_fusion_summary_for_explanations(
    fused_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Extract a summary from fused result suitable for Prompt 7 explanations.

    This produces a simplified view of fusion results that can be incorporated
    into the explanations builder.

    Args:
        fused_result: Output from fuse_signals() or fuse_public_figure_signals()

    Returns:
        Summary dict with:
        - presence_summary: plain-English presence statement
        - confidence_summary: plain-English confidence statement
        - key_signals: list of primary signal labels
        - coverage_gaps: list of modalities that couldn't be checked
        - conflicts: list of conflict descriptions
    """
    fused_present = fused_result.get("fused_present", "unknown")
    fused_confidence = fused_result.get("fused_confidence", "unknown")
    why = fused_result.get("why_we_believe_this", {})

    # Build presence summary
    if fused_present == "yes":
        presence_summary = "Signals were detected."
    elif fused_present == "no":
        presence_summary = "No signals were detected (with sufficient coverage to confirm)."
    else:
        presence_summary = "Presence could not be determined due to insufficient coverage."

    # Build confidence summary
    confidence_explanations = {
        "high": "Multiple independent signals confirm detection.",
        "medium": "Signals detected but with some uncertainty (conflicts or limited coverage).",
        "low": "Weak or single-modality signals only.",
        "unknown": "Insufficient coverage to assess confidence.",
    }
    confidence_summary = confidence_explanations.get(
        fused_confidence,
        "Confidence could not be determined."
    )

    # Extract key signals
    key_signals = [
        s.get("label", s.get("id", "Unknown signal"))
        for s in why.get("primary_signals", [])
    ]

    # Extract coverage gaps
    coverage_gaps = [
        f"{s.get('modality', 'Unknown')}: {s.get('reason', 'not available')}"
        for s in why.get("not_evaluated", [])
    ]

    # Extract conflicts
    conflicts = [
        c.get("description", "Unknown conflict")
        for c in fused_result.get("conflict_resolution_notes", [])
    ]

    return {
        "presence_summary": presence_summary,
        "confidence_summary": confidence_summary,
        "key_signals": key_signals[:5],  # Cap at 5
        "coverage_gaps": coverage_gaps[:3],  # Cap at 3
        "conflicts": conflicts[:2],  # Cap at 2
        "fused_present": fused_present,
        "fused_confidence": fused_confidence,
    }
