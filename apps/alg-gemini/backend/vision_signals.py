"""
Vision Cue Detection and Excerpting

This module provides deterministic vision cue detection from OCR text.
Extracts evidence excerpts for visual disclosure/ad/promo cues.

Key principles:
    - Deterministic: Same OCR input always produces same excerpts
    - OCR-only: Uses existing OCR text, does NOT run new extraction
    - Conservative: Only high-confidence matches are HIGH tier
    - Versioned patterns: Pattern version stored for audit trail
    - Capped output: Max 10 excerpts per scan

Cue types:
    - disclosure_ad: "ad", "sponsored", "paid partnership", etc.
    - promo_cta: "link in bio", "use code", "shop now", etc.
    - political_visual: "vote", "election", party names, etc.
    - creator_handle_visual: @handle occurrences in OCR
    - commerce_brand_hint: conservative brand detection (.com, "official", etc.)

Excerpt format:
    {
        "text": str (max 200 chars),
        "cue_type": str,
        "matched_term": str,
        "item_id": str,
        "item_position": int,
        "roi_label": str | None,
        "confidence": "HIGH" | "MED" | "LOW"
    }
"""

import re
from typing import Dict, Any, List, Optional, Tuple


# =============================================================================
# Pattern Versions (for audit trail)
# =============================================================================

VISION_PATTERN_VERSION = "1.0.0"

# =============================================================================
# Cue Type Definitions
# Priority order: disclosure_ad > promo_cta > political_visual > creator_handle_visual > commerce_brand_hint
# =============================================================================

CUE_PRIORITY = {
    "disclosure_ad": 1,
    "promo_cta": 2,
    "political_visual": 3,
    "creator_handle_visual": 4,
    "commerce_brand_hint": 5,
}


# =============================================================================
# Disclosure Ad Patterns (highest priority)
# =============================================================================

# Exact tokens that definitively indicate ad/sponsored content
DISCLOSURE_AD_EXACT = {
    "ad", "ads", "sponsored", "promoted", "advertisement",
    "#ad", "#sponsored", "#advertisement", "#promoted",
}

# Phrase patterns for ad disclosure
DISCLOSURE_AD_PATTERNS = [
    r"\bpaid partnership\b",
    r"\bpaid promotion\b",
    r"\bsponsored by\b",
    r"\bsponsored post\b",
    r"\bsponsored content\b",
    r"\bin partnership with\b",
    r"\bad disclosure\b",
]


# =============================================================================
# Promo CTA Patterns
# =============================================================================

PROMO_CTA_PATTERNS = [
    # Link/swipe CTAs
    (r"\blink in bio\b", "HIGH"),
    (r"\blink in description\b", "HIGH"),
    (r"\bswipe up\b", "HIGH"),
    (r"\btap the link\b", "HIGH"),
    (r"\bcheck (the )?link\b", "MED"),

    # Code/discount CTAs
    (r"\buse (my |the )?code\b", "HIGH"),
    (r"\bpromo code\b", "HIGH"),
    (r"\bdiscount code\b", "HIGH"),
    (r"\bcoupon code\b", "HIGH"),
    (r"\b\d+% off\b", "HIGH"),
    (r"\bpercent off\b", "MED"),

    # Purchase CTAs
    (r"\bshop now\b", "HIGH"),
    (r"\bbuy now\b", "HIGH"),
    (r"\border now\b", "HIGH"),
    (r"\bget yours\b", "MED"),
    (r"\bavailable now\b", "LOW"),

    # Urgency CTAs
    (r"\blimited time\b", "MED"),
    (r"\bexclusive offer\b", "MED"),
    (r"\bfree shipping\b", "MED"),
    (r"\bsale ends\b", "MED"),
]


# =============================================================================
# Political Visual Patterns
# Reuses core political lexicon from audio_signals but adapted for visual context
# =============================================================================

POLITICAL_VISUAL_EXACT = {
    # Explicit political terms
    "vote", "voting", "voter", "voters",
    "election", "elections", "ballot",
    "candidate", "candidates",
    "campaign", "campaigns",
    # Parties (US-focused for v1)
    "democrat", "democrats", "democratic",
    "republican", "republicans", "gop",
    "liberal", "liberals", "conservative", "conservatives",
    # Government
    "congress", "senate", "legislation",
    "president", "presidential",
    # Political labels
    "maga", "blm",
}

POLITICAL_VISUAL_PATTERNS = [
    (r"\bleft wing\b", "MED"),
    (r"\bright wing\b", "MED"),
    (r"\bpolitical\b", "LOW"),
    (r"\bpolitics\b", "LOW"),
    (r"\bpartisan\b", "MED"),
    (r"\bbipartisan\b", "MED"),
]


# =============================================================================
# Creator Handle Pattern
# =============================================================================

CREATOR_HANDLE_PATTERN = re.compile(r"@([a-zA-Z0-9_]{3,30})")

# Filter out common false positives (email-like, generic)
HANDLE_FILTER_PATTERNS = [
    r"^gmail$",
    r"^email$",
    r"^twitter$",
    r"^instagram$",
    r"^tiktok$",
    r"^facebook$",
    r"^youtube$",
]


# =============================================================================
# Commerce Brand Hint Patterns (conservative)
# Only explicit brand markers, NOT capitalized words
# =============================================================================

COMMERCE_BRAND_PATTERNS = [
    (r"\b\w+\.com\b", "MED"),  # something.com
    (r"\bofficial\b", "LOW"),
    (r"\bstore\b", "LOW"),
    (r"\bshop\b", "LOW"),
    (r"\bverified\b", "LOW"),
]


# =============================================================================
# Detection Functions
# =============================================================================

def detect_disclosure_ad_cues(
    ocr_text: str,
    roi_texts: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Detect disclosure/ad cues in OCR text.

    Args:
        ocr_text: Combined OCR text from item
        roi_texts: Optional dict of {roi_label: text} for location hints

    Returns:
        List of cue dicts with matched_term, confidence, roi_label
    """
    cues = []
    text_lower = ocr_text.lower() if ocr_text else ""

    if not text_lower:
        return cues

    # Check exact tokens (HIGH confidence)
    for token in DISCLOSURE_AD_EXACT:
        pattern = r"\b" + re.escape(token) + r"\b"
        if re.search(pattern, text_lower):
            cues.append({
                "cue_type": "disclosure_ad",
                "matched_term": token,
                "confidence": "HIGH",
                "roi_label": _find_roi_for_term(token, roi_texts),
            })
            break  # One disclosure match is sufficient

    # Check phrase patterns if no exact match
    if not cues:
        for pattern in DISCLOSURE_AD_PATTERNS:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                cues.append({
                    "cue_type": "disclosure_ad",
                    "matched_term": match.group(0),
                    "confidence": "HIGH",
                    "roi_label": _find_roi_for_term(match.group(0), roi_texts),
                })
                break

    return cues


def detect_promo_cta_cues(
    ocr_text: str,
    roi_texts: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Detect promotional call-to-action cues in OCR text.

    Args:
        ocr_text: Combined OCR text from item
        roi_texts: Optional dict of {roi_label: text} for location hints

    Returns:
        List of cue dicts with matched_term, confidence, roi_label
    """
    cues = []
    text_lower = ocr_text.lower() if ocr_text else ""

    if not text_lower:
        return cues

    for pattern, confidence in PROMO_CTA_PATTERNS:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            cues.append({
                "cue_type": "promo_cta",
                "matched_term": match.group(0),
                "confidence": confidence,
                "roi_label": _find_roi_for_term(match.group(0), roi_texts),
            })

    return cues


def detect_political_visual_cues(
    ocr_text: str,
    roi_texts: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Detect political visual cues in OCR text.

    Args:
        ocr_text: Combined OCR text from item
        roi_texts: Optional dict of {roi_label: text} for location hints

    Returns:
        List of cue dicts with matched_term, confidence, roi_label
    """
    cues = []
    text_lower = ocr_text.lower() if ocr_text else ""

    if not text_lower:
        return cues

    # Check exact tokens (HIGH confidence)
    for token in POLITICAL_VISUAL_EXACT:
        pattern = r"\b" + re.escape(token) + r"\b"
        if re.search(pattern, text_lower):
            cues.append({
                "cue_type": "political_visual",
                "matched_term": token,
                "confidence": "HIGH",
                "roi_label": _find_roi_for_term(token, roi_texts),
            })

    # Check phrase patterns
    for pattern, confidence in POLITICAL_VISUAL_PATTERNS:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            # Avoid duplicates
            term = match.group(0)
            if not any(c["matched_term"] == term for c in cues):
                cues.append({
                    "cue_type": "political_visual",
                    "matched_term": term,
                    "confidence": confidence,
                    "roi_label": _find_roi_for_term(term, roi_texts),
                })

    return cues


def detect_creator_handle_cues(
    ocr_text: str,
    roi_texts: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Detect @handle mentions in OCR text.

    Args:
        ocr_text: Combined OCR text from item
        roi_texts: Optional dict of {roi_label: text} for location hints

    Returns:
        List of cue dicts with matched_term, confidence, roi_label
    """
    cues = []

    if not ocr_text:
        return cues

    matches = CREATOR_HANDLE_PATTERN.findall(ocr_text)

    for handle in matches:
        handle_lower = handle.lower()

        # Filter out false positives
        is_filtered = False
        for filter_pattern in HANDLE_FILTER_PATTERNS:
            if re.match(filter_pattern, handle_lower):
                is_filtered = True
                break

        if is_filtered:
            continue

        # Confidence based on handle length and format
        if len(handle) >= 5:
            confidence = "HIGH"
        elif len(handle) >= 3:
            confidence = "MED"
        else:
            continue  # Skip very short handles

        cues.append({
            "cue_type": "creator_handle_visual",
            "matched_term": f"@{handle}",
            "confidence": confidence,
            "roi_label": _find_roi_for_term(f"@{handle}", roi_texts),
        })

    return cues


def detect_commerce_brand_cues(
    ocr_text: str,
    roi_texts: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Detect commerce/brand hint cues in OCR text (conservative).

    Args:
        ocr_text: Combined OCR text from item
        roi_texts: Optional dict of {roi_label: text} for location hints

    Returns:
        List of cue dicts with matched_term, confidence, roi_label
    """
    cues = []
    text_lower = ocr_text.lower() if ocr_text else ""

    if not text_lower:
        return cues

    for pattern, confidence in COMMERCE_BRAND_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            cues.append({
                "cue_type": "commerce_brand_hint",
                "matched_term": match,
                "confidence": confidence,
                "roi_label": _find_roi_for_term(match, roi_texts),
            })

    return cues


def _find_roi_for_term(
    term: str,
    roi_texts: Optional[Dict[str, str]]
) -> Optional[str]:
    """
    Find which ROI region contains a term.

    Args:
        term: The matched term to locate
        roi_texts: Dict of {roi_label: text}

    Returns:
        ROI label if found, else None
    """
    if not roi_texts:
        return None

    term_lower = term.lower()
    for roi_label, roi_text in roi_texts.items():
        if roi_text and term_lower in roi_text.lower():
            return roi_label

    return None


# =============================================================================
# Main Detection Function
# =============================================================================

def detect_vision_cues(
    ocr_text: str,
    roi_texts: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Detect all vision cue types in OCR text.

    Args:
        ocr_text: Combined OCR text from item
        roi_texts: Optional dict of {roi_label: text} for location hints

    Returns:
        List of cue dicts sorted by priority (disclosure_ad first)
    """
    all_cues = []

    # Detect each cue type
    all_cues.extend(detect_disclosure_ad_cues(ocr_text, roi_texts))
    all_cues.extend(detect_promo_cta_cues(ocr_text, roi_texts))
    all_cues.extend(detect_political_visual_cues(ocr_text, roi_texts))
    all_cues.extend(detect_creator_handle_cues(ocr_text, roi_texts))
    all_cues.extend(detect_commerce_brand_cues(ocr_text, roi_texts))

    # Sort by priority, then by confidence (HIGH > MED > LOW)
    confidence_order = {"HIGH": 0, "MED": 1, "LOW": 2}

    all_cues.sort(key=lambda c: (
        CUE_PRIORITY.get(c["cue_type"], 99),
        confidence_order.get(c["confidence"], 3),
        c["matched_term"],
    ))

    return all_cues


# =============================================================================
# Excerpt Building
# =============================================================================

def build_vision_excerpt(
    cue: Dict[str, Any],
    ocr_text: str,
    item_id: str,
    item_position: int
) -> Dict[str, Any]:
    """
    Build a vision excerpt from a detected cue.

    Args:
        cue: A cue dict from detect_vision_cues
        ocr_text: Full OCR text for context extraction
        item_id: Deterministic item ID
        item_position: Position in feed

    Returns:
        Excerpt dict with all required fields
    """
    # Extract context around the matched term (max 200 chars)
    term = cue["matched_term"]
    text_lower = ocr_text.lower() if ocr_text else ""
    term_lower = term.lower()

    context = ""
    if text_lower and term_lower in text_lower:
        idx = text_lower.find(term_lower)
        start = max(0, idx - 50)
        end = min(len(ocr_text), idx + len(term) + 100)
        context = ocr_text[start:end].strip()

        # Clean up and cap at 200 chars
        context = context[:200]
        if len(context) == 200 and not context.endswith((".", "!", "?")):
            context = context + "..."
    else:
        # Use first 200 chars of OCR if term not found (shouldn't happen)
        context = (ocr_text or "")[:200]

    return {
        "text": context,
        "cue_type": cue["cue_type"],
        "matched_term": cue["matched_term"],
        "item_id": item_id,
        "item_position": item_position,
        "roi_label": cue.get("roi_label"),
        "confidence": cue["confidence"],
    }


def build_vision_excerpts(
    items_with_features: List[Dict[str, Any]],
    max_excerpts: int = 10
) -> Dict[str, Any]:
    """
    Build vision excerpts from items with extracted features.

    Args:
        items_with_features: List of FeatureBundle dicts
        max_excerpts: Maximum excerpts to return (default 10)

    Returns:
        Dict with:
            - excerpts: List of excerpt dicts (max 10)
            - cue_counts: Dict with count per cue type
            - pattern_version: Version string for audit
    """
    result = {
        "excerpts": [],
        "cue_counts": {
            "disclosure_ad": 0,
            "promo_cta": 0,
            "political_visual": 0,
            "creator_handle_visual": 0,
            "commerce_brand_hint": 0,
        },
        "pattern_version": VISION_PATTERN_VERSION,
        "items_with_cues": 0,
        "items_without_ocr": 0,
    }

    all_excerpts = []

    for item in items_with_features:
        item_id = item.get("item_id", "")
        item_position = item.get("item_position", 0)

        # Get OCR text from vision_features
        vision_features = item.get("vision_features", {})
        ocr_text = vision_features.get("ocr_text", "")

        if not ocr_text or not vision_features.get("ocr_text_available", False):
            result["items_without_ocr"] += 1
            continue

        # Detect cues in this item's OCR text
        cues = detect_vision_cues(ocr_text)

        if cues:
            result["items_with_cues"] += 1

        # Build excerpts for each cue
        for cue in cues:
            result["cue_counts"][cue["cue_type"]] = result["cue_counts"].get(cue["cue_type"], 0) + 1

            excerpt = build_vision_excerpt(
                cue=cue,
                ocr_text=ocr_text,
                item_id=item_id,
                item_position=item_position,
            )
            all_excerpts.append(excerpt)

    # Sort excerpts for deterministic ordering:
    # 1. By cue priority
    # 2. By confidence
    # 3. By item_position
    # 4. By matched_term (for stability)
    confidence_order = {"HIGH": 0, "MED": 1, "LOW": 2}

    all_excerpts.sort(key=lambda e: (
        CUE_PRIORITY.get(e["cue_type"], 99),
        confidence_order.get(e["confidence"], 3),
        e["item_position"],
        e["matched_term"],
    ))

    # Cap at max_excerpts
    result["excerpts"] = all_excerpts[:max_excerpts]

    return result


# =============================================================================
# Summary Functions
# =============================================================================

def get_vision_cue_summary(excerpts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a summary of detected vision cues from excerpts.

    Args:
        excerpts: List of excerpt dicts

    Returns:
        Summary dict with flags and lists
    """
    if not excerpts:
        return {
            "has_disclosure_cues": False,
            "has_promo_cues": False,
            "has_political_cues": False,
            "has_creator_cues": False,
            "has_commerce_cues": False,
            "disclosure_terms": [],
            "promo_terms": [],
            "political_terms": [],
            "creator_handles": [],
            "commerce_hints": [],
        }

    disclosure_terms = []
    promo_terms = []
    political_terms = []
    creator_handles = []
    commerce_hints = []

    for exc in excerpts:
        cue_type = exc.get("cue_type")
        term = exc.get("matched_term", "")

        if cue_type == "disclosure_ad":
            disclosure_terms.append(term)
        elif cue_type == "promo_cta":
            promo_terms.append(term)
        elif cue_type == "political_visual":
            political_terms.append(term)
        elif cue_type == "creator_handle_visual":
            creator_handles.append(term)
        elif cue_type == "commerce_brand_hint":
            commerce_hints.append(term)

    return {
        "has_disclosure_cues": len(disclosure_terms) > 0,
        "has_promo_cues": len(promo_terms) > 0,
        "has_political_cues": len(political_terms) > 0,
        "has_creator_cues": len(creator_handles) > 0,
        "has_commerce_cues": len(commerce_hints) > 0,
        "disclosure_terms": list(set(disclosure_terms)),
        "promo_terms": list(set(promo_terms)),
        "political_terms": list(set(political_terms)),
        "creator_handles": list(set(creator_handles)),
        "commerce_hints": list(set(commerce_hints)),
    }


def compute_vision_coverage_stats(
    items_with_features: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Compute OCR coverage statistics for vision analysis.

    Args:
        items_with_features: List of FeatureBundle dicts

    Returns:
        Coverage stats dict
    """
    n_total = len(items_with_features)
    n_with_ocr = 0
    n_with_cues = 0

    for item in items_with_features:
        vision_features = item.get("vision_features", {})

        if vision_features.get("ocr_text_available", False):
            n_with_ocr += 1

            # Check if any cues detected
            ocr_text = vision_features.get("ocr_text", "")
            if ocr_text:
                cues = detect_vision_cues(ocr_text)
                if cues:
                    n_with_cues += 1

    return {
        "n_items_total": n_total,
        "n_items_with_ocr": n_with_ocr,
        "n_items_with_cues": n_with_cues,
        "ocr_coverage_percent": round(n_with_ocr / n_total * 100, 1) if n_total > 0 else 0,
        "cue_rate_percent": round(n_with_cues / n_with_ocr * 100, 1) if n_with_ocr > 0 else 0,
    }
