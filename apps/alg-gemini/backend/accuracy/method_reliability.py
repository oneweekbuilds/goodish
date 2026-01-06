"""
Method Reliability Constants for Accuracy Architecture v3.1 (HPA + CMA).

Phase 5C1: Minimal implementation starting with PLATFORM_LABEL.
Future phases will add OCR, KEYWORD, MODEL, etc.

These reliability scores are used to:
- Determine if a single method can yield HIGH confidence
- Calculate aggregate method reliability for multi-method evidence
- Inform confidence band assignment

Reference: accuracy-architecture-v3.1.md Section 2.3
"""

from typing import Dict, Optional

# Method reliability scores (0.0-1.0)
# Higher = more reliable, can yield HIGH confidence alone
METHOD_RELIABILITY: Dict[str, float] = {
    "PLATFORM_LABEL": 0.999,  # Platform labels are authoritative by definition
    # Placeholders for future methods (not yet used):
    "METADATA_FIELD": 0.95,  # Structured metadata is highly reliable
    "OCR_DISCLOSURE": 0.85,  # OCR accuracy varies by image quality
    "KEYWORD_MATCH": 0.70,  # Keywords can be ambiguous or sarcastic
    "REGEX_PATTERN": 0.75,  # Patterns are precise but context-blind
    "CLASSIFIER_OUTPUT": 0.80,  # ML classifier (calibrated)
    "HEURISTIC_RULE": 0.65,  # Hand-crafted rules have edge cases
    "NER_EXTRACTION": 0.75,  # NER accuracy on social media text is moderate
}


def get_method_reliability(method: str) -> Optional[float]:
    """
    Get reliability score for a detection method.

    Args:
        method: Detection method name (e.g., "PLATFORM_LABEL")

    Returns:
        Reliability score (0.0-1.0) or None if method not found
    """
    return METHOD_RELIABILITY.get(method.upper())


def can_yield_high_alone(method: str) -> bool:
    """
    Check if a method can yield HIGH confidence alone (per v3.1 spec).

    Phase 5C1: Only PLATFORM_LABEL can yield HIGH alone.
    Future phases will add METADATA_FIELD and calibrated CLASSIFIER_OUTPUT.

    Args:
        method: Detection method name

    Returns:
        True if method can yield HIGH confidence alone
    """
    reliability = get_method_reliability(method)
    if reliability is None:
        return False

    # Per v3.1 spec Section 4.1: Only methods with reliability >= 0.95 can yield HIGH alone
    # (PLATFORM_LABEL = 0.999, METADATA_FIELD = 0.95)
    return reliability >= 0.95

