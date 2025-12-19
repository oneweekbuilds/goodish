"""
Confidence Normalization Module (Prompt 10)

This module provides centralized, consistent confidence semantics across all
5 tabs (Ads, Politics, Patterns, Creators, Inferences).

=============================================================================
CONFIDENCE LEVEL DEFINITIONS (CANONICAL)
=============================================================================

PRESENCE values:
    "yes"     - Signals were detected with sufficient coverage to be confident
    "no"      - Signals were NOT found, AND we had sufficient coverage to claim absence
    "unknown" - Cannot determine; insufficient coverage to make reliable claims

CONFIDENCE values:
    "high"    - Multiple modalities agree, >= 2 content modalities with coverage
    "medium"  - Signals detected but with uncertainty (conflicts, limited coverage)
    "low"     - Weak or single-modality signals only
    "unknown" - Insufficient coverage to assess confidence

=============================================================================
THRESHOLD MAPPING (CONSERVATIVE)
=============================================================================

Signal Fusion Rules (from Prompt 6, applied universally):
    1. COVERAGE_FIRST:
       - If < 2 content modalities have coverage -> cap at "low"
       - If no signals + poor coverage -> presence = "unknown" (not "no")

    2. DISAGREEMENT_LOWERS:
       - If modalities conflict -> downgrade confidence by one level
       - high -> medium, medium -> low

    3. WEAK_SIGNALS_NEVER_DOMINATE:
       - Metadata-only signals -> cap at "low" confidence
       - Content signals (text, audio, vision) have priority

    4. ABSENCE_REQUIRES_COVERAGE:
       - Cannot claim presence = "no" with < 2 modalities covered
       - Use presence = "unknown" instead

Coverage Thresholds:
    - OCR coverage minimum: 60% (below this, cannot claim visual signals absent)
    - Audio analyzed: must be True to claim audio signals absent
    - Minimum sample size: 10 items for "ok" quality, 30 for high confidence

Evidence Thresholds:
    - High confidence: >= 3 supporting items OR >= 2 modalities agreeing
    - Medium confidence: >= 2 supporting items from single modality
    - Low confidence: 1 supporting item only

=============================================================================
QUALITY LABELS (FOR MEASUREMENTS)
=============================================================================

    "ok"                 - Analysis completed successfully, reliable
    "low_sample"         - Sample size < 10, patterns may not be representative
    "partial_coverage"   - Some modalities unavailable, results incomplete
    "not_applicable"     - Analysis category doesn't apply (e.g., no promo content)
    "insufficient_signal"- Analysis ran but no patterns detected (not an error)
    "not_evaluated"      - Modality was not analyzed (missing data/capability)

=============================================================================
"""

from typing import Dict, Any, List, Optional, Literal, Tuple
from enum import Enum


# =============================================================================
# Type Definitions
# =============================================================================

class Presence(str, Enum):
    """Canonical presence values for signal detection."""
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"


class Confidence(str, Enum):
    """Canonical confidence levels."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


class Quality(str, Enum):
    """Canonical quality labels for measurements."""
    OK = "ok"
    LOW_SAMPLE = "low_sample"
    PARTIAL_COVERAGE = "partial_coverage"
    NOT_APPLICABLE = "not_applicable"
    INSUFFICIENT_SIGNAL = "insufficient_signal"
    NOT_EVALUATED = "not_evaluated"


# =============================================================================
# Coverage Thresholds (Centralized)
# =============================================================================

THRESHOLDS = {
    # Coverage thresholds
    "ocr_coverage_min_percent": 60,           # Below this, cannot claim visual absence
    "min_modalities_for_high": 2,             # Need at least 2 for high confidence
    "min_sample_size_ok": 10,                 # Below this, quality = low_sample
    "min_sample_size_reliable": 30,           # Below this, treat as tentative

    # Evidence thresholds
    "min_evidence_for_high": 3,               # Items needed for high confidence
    "min_evidence_for_medium": 2,             # Items needed for medium confidence
    "min_evidence_for_surfacing": 2,          # Items needed to surface at all

    # Inference thresholds
    "min_items_for_inference": 30,            # Recommended for inferences tab
}


# =============================================================================
# Coverage Assessment
# =============================================================================

def assess_coverage(
    n_items: int,
    ocr_coverage_percent: float = 0.0,
    audio_analyzed: bool = False,
    text_available: bool = True,
    metadata_available: bool = True,
) -> Dict[str, Any]:
    """
    Assess coverage status and determine what claims can be made.

    Args:
        n_items: Number of items in scan
        ocr_coverage_percent: Percentage of items with OCR text (0-100)
        audio_analyzed: Whether audio was successfully analyzed
        text_available: Whether text content is available
        metadata_available: Whether metadata is available

    Returns:
        Coverage assessment dict with:
        - modalities_with_coverage: list of modality names
        - n_content_modalities: count of content modalities with coverage
        - can_claim_absence: whether we can reliably claim "not found"
        - max_achievable_confidence: highest confidence level possible
        - sample_quality: quality label based on sample size
        - notes: list of coverage notes
    """
    modalities_with_coverage = []
    notes = []

    # Check each modality
    if text_available:
        modalities_with_coverage.append("text")
    else:
        notes.append("Text content not available")

    if audio_analyzed:
        modalities_with_coverage.append("audio")
    else:
        notes.append("Audio was not analyzed")

    if ocr_coverage_percent >= THRESHOLDS["ocr_coverage_min_percent"]:
        modalities_with_coverage.append("vision")
    elif ocr_coverage_percent > 0:
        notes.append(f"Limited OCR coverage ({ocr_coverage_percent:.0f}%)")
    else:
        notes.append("On-screen text not available")

    if metadata_available:
        modalities_with_coverage.append("metadata")

    # Count content modalities (excludes metadata - it's weak)
    content_modalities = [m for m in modalities_with_coverage if m != "metadata"]
    n_content = len(content_modalities)

    # Determine max achievable confidence
    if n_content >= 2:
        max_confidence = Confidence.HIGH
    elif n_content == 1:
        max_confidence = Confidence.MEDIUM
        notes.append("Single modality limits confidence to medium")
    else:
        max_confidence = Confidence.LOW
        notes.append("No content modalities - confidence limited to low")

    # Can we claim absence?
    can_claim_absence = n_content >= 2
    if not can_claim_absence:
        notes.append("Cannot claim 'not found' - insufficient coverage")

    # Sample quality
    if n_items >= THRESHOLDS["min_sample_size_reliable"]:
        sample_quality = Quality.OK
    elif n_items >= THRESHOLDS["min_sample_size_ok"]:
        sample_quality = Quality.OK
        notes.append(f"Sample of {n_items} posts - treat patterns as tentative")
    else:
        sample_quality = Quality.LOW_SAMPLE
        notes.append(f"Only {n_items} posts - patterns may not be representative")

    return {
        "modalities_with_coverage": modalities_with_coverage,
        "n_content_modalities": n_content,
        "can_claim_absence": can_claim_absence,
        "max_achievable_confidence": max_confidence.value,
        "sample_quality": sample_quality.value,
        "notes": notes,
    }


# =============================================================================
# Confidence Normalization
# =============================================================================

def normalize_confidence(
    raw_confidence: str,
    coverage: Dict[str, Any],
    has_conflicts: bool = False,
    is_metadata_only: bool = False,
) -> Tuple[str, List[str]]:
    """
    Normalize a raw confidence value applying coverage and conflict rules.

    Args:
        raw_confidence: Input confidence ("high", "medium", "low", or any string)
        coverage: Coverage assessment from assess_coverage()
        has_conflicts: Whether signals from different modalities conflict
        is_metadata_only: Whether only metadata signals contributed (no content)

    Returns:
        Tuple of (normalized_confidence, list of rules applied)
    """
    rules_applied = []

    # Start with raw value
    confidence = raw_confidence.lower() if raw_confidence else "unknown"

    # Map to canonical values
    if confidence not in ("high", "medium", "low", "unknown"):
        confidence = "unknown"
        rules_applied.append(f"NORMALIZE: '{raw_confidence}' -> 'unknown'")

    # Rule 1: Coverage caps confidence
    max_conf = coverage.get("max_achievable_confidence", "low")
    if confidence == "high" and max_conf in ("medium", "low", "unknown"):
        confidence = max_conf
        rules_applied.append(f"COVERAGE_CAP: high -> {max_conf}")
    elif confidence == "medium" and max_conf in ("low", "unknown"):
        confidence = max_conf
        rules_applied.append(f"COVERAGE_CAP: medium -> {max_conf}")

    # Rule 2: Conflicts downgrade
    if has_conflicts:
        if confidence == "high":
            confidence = "medium"
            rules_applied.append("CONFLICT_DOWNGRADE: high -> medium")
        elif confidence == "medium":
            confidence = "low"
            rules_applied.append("CONFLICT_DOWNGRADE: medium -> low")

    # Rule 3: Metadata-only caps at low
    if is_metadata_only and confidence in ("high", "medium"):
        confidence = "low"
        rules_applied.append("METADATA_ONLY_CAP: -> low")

    return confidence, rules_applied


def normalize_presence(
    raw_presence: str,
    coverage: Dict[str, Any],
    signals_found: bool,
) -> Tuple[str, List[str]]:
    """
    Normalize a raw presence value ensuring we don't overclaim absence.

    Args:
        raw_presence: Input presence ("yes", "no", "unknown", or any string)
        coverage: Coverage assessment from assess_coverage()
        signals_found: Whether any signals were detected

    Returns:
        Tuple of (normalized_presence, list of rules applied)
    """
    rules_applied = []

    # Start with raw value
    presence = raw_presence.lower() if raw_presence else "unknown"

    # Map to canonical values
    if presence not in ("yes", "no", "unknown"):
        presence = "unknown"
        rules_applied.append(f"NORMALIZE: '{raw_presence}' -> 'unknown'")

    # If signals found, presence should be "yes"
    if signals_found and presence != "yes":
        presence = "yes"
        rules_applied.append("SIGNALS_FOUND: -> yes")

    # Critical: Cannot claim "no" without adequate coverage
    if presence == "no" and not coverage.get("can_claim_absence", False):
        presence = "unknown"
        rules_applied.append("ABSENCE_REQUIRES_COVERAGE: no -> unknown")

    return presence, rules_applied


# =============================================================================
# Quality Assessment
# =============================================================================

def get_quality_label(
    n_items: int,
    n_included: int,
    has_results: bool,
    modality_available: bool = True,
) -> str:
    """
    Determine the quality label for a measurement.

    Args:
        n_items: Total items in scan
        n_included: Items that could be analyzed
        has_results: Whether analysis produced any results
        modality_available: Whether the required modality was available

    Returns:
        Quality label string
    """
    if not modality_available:
        return Quality.NOT_EVALUATED.value

    if n_items < THRESHOLDS["min_sample_size_ok"]:
        return Quality.LOW_SAMPLE.value

    if n_included < n_items * 0.5:
        return Quality.PARTIAL_COVERAGE.value

    if not has_results:
        return Quality.INSUFFICIENT_SIGNAL.value

    return Quality.OK.value


# =============================================================================
# "Not Evaluated" vs "Not Found" Helper
# =============================================================================

def get_absence_statement(
    signal_name: str,
    coverage: Dict[str, Any],
    modality: str,
) -> Dict[str, Any]:
    """
    Generate an appropriate absence statement based on coverage.

    This is critical for honesty: we must distinguish between:
    - "Not found" (we looked, with good coverage, and didn't find it)
    - "Not evaluated" (we couldn't look due to missing modality)
    - "Uncertain" (we looked but coverage was too poor to be confident)

    Args:
        signal_name: Name of the signal being checked
        coverage: Coverage assessment from assess_coverage()
        modality: The modality that would detect this signal

    Returns:
        Dict with:
        - status: "not_found" | "not_evaluated" | "uncertain"
        - statement: Plain-English statement
        - can_claim_absence: Whether we can confidently say it's absent
    """
    modalities_covered = coverage.get("modalities_with_coverage", [])

    if modality not in modalities_covered:
        # Modality wasn't available at all
        if modality == "audio":
            reason = "audio was not analyzed for this scan"
        elif modality == "vision":
            reason = "on-screen text could not be extracted"
        elif modality == "text":
            reason = "text content was not available"
        else:
            reason = f"{modality} modality was not available"

        return {
            "status": "not_evaluated",
            "statement": f"{signal_name} could not be checked because {reason}.",
            "can_claim_absence": False,
        }

    # Modality was available - check if coverage is sufficient for absence claims
    if coverage.get("can_claim_absence", False):
        return {
            "status": "not_found",
            "statement": f"No {signal_name.lower()} were detected in this scan.",
            "can_claim_absence": True,
        }

    # Limited coverage - can't confidently claim absence
    notes = coverage.get("notes", [])
    coverage_note = notes[0] if notes else "coverage was limited"

    return {
        "status": "uncertain",
        "statement": f"{signal_name} were not detected, but {coverage_note.lower()}.",
        "can_claim_absence": False,
    }


# =============================================================================
# Evidence Threshold Checks
# =============================================================================

def check_surfacing_threshold(
    evidence_count: int,
    require_high_confidence: bool = False,
) -> Dict[str, Any]:
    """
    Check if evidence meets surfacing threshold.

    Args:
        evidence_count: Number of supporting items/signals
        require_high_confidence: Whether high confidence is required

    Returns:
        Dict with:
        - meets_threshold: bool
        - confidence: suggested confidence level
        - reason: explanation if not met
    """
    min_for_surface = THRESHOLDS["min_evidence_for_surfacing"]
    min_for_high = THRESHOLDS["min_evidence_for_high"]

    if evidence_count < min_for_surface:
        return {
            "meets_threshold": False,
            "confidence": "low",
            "reason": f"Only {evidence_count} supporting item(s); {min_for_surface}+ required",
        }

    if evidence_count >= min_for_high:
        confidence = "high"
    elif evidence_count >= THRESHOLDS["min_evidence_for_medium"]:
        confidence = "medium"
    else:
        confidence = "low"

    if require_high_confidence and confidence != "high":
        return {
            "meets_threshold": False,
            "confidence": confidence,
            "reason": f"Confidence is {confidence}; high required",
        }

    return {
        "meets_threshold": True,
        "confidence": confidence,
        "reason": None,
    }


# =============================================================================
# Normalization Result Builder
# =============================================================================

def build_normalized_result(
    presence: str,
    confidence: str,
    coverage: Dict[str, Any],
    evidence_count: int = 0,
    signals_fired: List[Dict] = None,
    signals_not_evaluated: List[Dict] = None,
    signals_not_found: List[Dict] = None,
    has_conflicts: bool = False,
    is_metadata_only: bool = False,
) -> Dict[str, Any]:
    """
    Build a fully normalized result applying all rules.

    This is the main entry point for evidence bundles to ensure consistent
    confidence semantics.

    Args:
        presence: Raw presence value
        confidence: Raw confidence value
        coverage: Coverage assessment from assess_coverage()
        evidence_count: Number of supporting items
        signals_fired: List of detected signals
        signals_not_evaluated: List of signals that couldn't be checked
        signals_not_found: List of signals checked but not found
        has_conflicts: Whether signals conflict
        is_metadata_only: Whether only metadata signals contributed

    Returns:
        Normalized result dict with:
        - presence: normalized presence
        - confidence: normalized confidence
        - rules_applied: list of normalization rules that fired
        - coverage_summary: summary of coverage status
        - quality: quality assessment
    """
    signals_fired = signals_fired or []
    signals_not_evaluated = signals_not_evaluated or []
    signals_not_found = signals_not_found or []

    # Normalize presence
    norm_presence, presence_rules = normalize_presence(
        presence,
        coverage,
        signals_found=len(signals_fired) > 0,
    )

    # Normalize confidence
    norm_confidence, confidence_rules = normalize_confidence(
        confidence,
        coverage,
        has_conflicts=has_conflicts,
        is_metadata_only=is_metadata_only,
    )

    # Check surfacing threshold
    threshold_result = check_surfacing_threshold(evidence_count)
    if not threshold_result["meets_threshold"] and norm_presence == "yes":
        # Evidence too weak to surface confidently
        if norm_confidence in ("high", "medium"):
            norm_confidence = "low"
            confidence_rules.append(
                f"EVIDENCE_THRESHOLD: {evidence_count} items below threshold -> low"
            )

    all_rules = presence_rules + confidence_rules

    return {
        "presence": norm_presence,
        "confidence": norm_confidence,
        "rules_applied": all_rules,
        "coverage_summary": {
            "modalities_available": coverage.get("modalities_with_coverage", []),
            "can_claim_absence": coverage.get("can_claim_absence", False),
            "max_achievable_confidence": coverage.get("max_achievable_confidence", "unknown"),
            "sample_quality": coverage.get("sample_quality", "unknown"),
        },
        "evidence_summary": {
            "signals_fired_count": len(signals_fired),
            "signals_not_evaluated_count": len(signals_not_evaluated),
            "signals_not_found_count": len(signals_not_found),
            "has_conflicts": has_conflicts,
            "is_metadata_only": is_metadata_only,
        },
    }


# =============================================================================
# Explanation Text Generators (Epistemically Humble)
# =============================================================================

def get_confidence_explanation(confidence: str, rules_applied: List[str]) -> str:
    """
    Generate a plain-English explanation for a confidence level.

    Uses epistemically humble language - no "proves", "definitely", "always".
    """
    base_explanations = {
        "high": "Multiple independent signals support this detection.",
        "medium": "Signals were detected, but with some uncertainty.",
        "low": "Weak signals detected; treat with caution.",
        "unknown": "We could not assess confidence due to limited coverage.",
    }

    explanation = base_explanations.get(confidence, base_explanations["unknown"])

    # Add context from rules if significant
    if "COVERAGE_CAP" in " ".join(rules_applied):
        explanation += " Confidence was limited by available coverage."
    if "CONFLICT_DOWNGRADE" in " ".join(rules_applied):
        explanation += " Conflicting signals reduced our confidence."
    if "METADATA_ONLY_CAP" in " ".join(rules_applied):
        explanation += " Only metadata signals were available."

    return explanation


def get_presence_explanation(presence: str, coverage: Dict[str, Any]) -> str:
    """
    Generate a plain-English explanation for a presence determination.

    Uses epistemically humble language.
    """
    if presence == "yes":
        return "Signals were detected in this scan."
    elif presence == "no":
        if coverage.get("can_claim_absence"):
            return "No signals were detected, and we had sufficient coverage to be confident in this finding."
        else:
            return "No signals were detected, though limited coverage means we cannot rule out their presence."
    else:  # unknown
        notes = coverage.get("notes", [])
        if notes:
            return f"We could not determine presence: {notes[0].lower()}."
        return "We could not determine presence due to insufficient coverage."
