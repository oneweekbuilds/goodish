"""
Canonical Text Signals Utility for Feed Items

This module provides deterministic text extraction from feed items,
normalizing text access across DESKTOP and MOBILE_VIDEO source types.

Key function: extract_text_signals(item) returns:
    - content_text: normalized combined text string
    - sources: list of source fields that contributed text
    - quality_flags: dict of quality issues detected

Rules:
    - Only uses existing fields; does not invent text
    - Includes OCR-derived text (on_screen_labels) for MOBILE_VIDEO
    - De-duplicates repeated lines
    - Drops ultra-short noise tokens (<3 chars)
    - Deterministic and reproducible
"""

import re
from typing import Dict, Any, List, Tuple, Set


# Minimum token length to keep (filter OCR noise)
MIN_TOKEN_LENGTH = 3

# Patterns to filter out as noise (common OCR artifacts, UI elements)
NOISE_PATTERNS = [
    r'^[\s\d\.\,\!\?\:\;\-\_\@\#\$\%\^\&\*\(\)]+$',  # Only punctuation/symbols
    r'^[a-zA-Z]{1,2}$',  # Very short (1-2 char) tokens
    r'^\d+$',  # Just numbers
    r'^\.+$',  # Just dots
]

NOISE_REGEXES = [re.compile(p) for p in NOISE_PATTERNS]


def normalize_text(text: str) -> str:
    """
    Normalize text: lowercase, collapse whitespace, strip.
    """
    if not text:
        return ""
    # Lowercase and collapse whitespace
    normalized = re.sub(r'\s+', ' ', text.lower().strip())
    return normalized


def is_noise_token(token: str) -> bool:
    """Check if a token is noise (too short or matches noise patterns)."""
    if len(token) < MIN_TOKEN_LENGTH:
        return True
    for regex in NOISE_REGEXES:
        if regex.match(token):
            return True
    return False


def deduplicate_lines(lines: List[str]) -> List[str]:
    """
    De-duplicate OCR lines while preserving order.
    Uses normalized comparison but returns original casing.
    """
    seen: Set[str] = set()
    result: List[str] = []

    for line in lines:
        normalized = normalize_text(line)
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(line)

    return result


def extract_text_signals(feed_item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract canonical text signals from a feed item.

    This is the SINGLE SOURCE OF TRUTH for text content in a feed item.
    All bundles should use this function instead of ad-hoc text access.

    Args:
        feed_item: A feed item dict from the scan result

    Returns:
        Dict with:
            - content_text: str - combined, normalized text
            - sources: List[str] - fields that contributed text
            - quality_flags: Dict[str, int] - quality issues detected
            - raw_text_parts: Dict[str, str] - individual text sources (for debugging)
    """
    content_text_dict = feed_item.get("content_text", {})
    sources: List[str] = []
    quality_flags: Dict[str, int] = {}
    raw_text_parts: Dict[str, str] = {}
    text_parts: List[str] = []

    # 1. Caption (DESKTOP primary text source)
    caption = content_text_dict.get("caption", "")
    if caption and isinstance(caption, str) and caption.strip():
        text_parts.append(caption.strip())
        sources.append("caption")
        raw_text_parts["caption"] = caption.strip()

    # 2. Captions list (some items have multiple captions)
    captions = content_text_dict.get("captions", [])
    if captions:
        for cap in captions:
            if cap and isinstance(cap, str) and cap.strip():
                if cap.strip() not in [t for t in text_parts]:  # Avoid duplicates
                    text_parts.append(cap.strip())
                    if "captions" not in sources:
                        sources.append("captions")
        if "captions" in sources:
            raw_text_parts["captions"] = " | ".join(c.strip() for c in captions if c)

    # 3. Post text (DESKTOP alternative text source)
    post_text = content_text_dict.get("post_text", "")
    if post_text and isinstance(post_text, str) and post_text.strip():
        text_parts.append(post_text.strip())
        sources.append("post_text")
        raw_text_parts["post_text"] = post_text.strip()

    # 4. On-screen labels (MOBILE_VIDEO OCR text - CRITICAL for MOBILE_VIDEO coverage)
    on_screen_labels = content_text_dict.get("on_screen_labels", [])
    if on_screen_labels:
        # Filter out noise and de-duplicate
        valid_labels = []
        for label in on_screen_labels:
            if label and isinstance(label, str):
                cleaned = label.strip()
                if cleaned and not is_noise_token(cleaned):
                    valid_labels.append(cleaned)

        # De-duplicate repeated overlay lines
        unique_labels = deduplicate_lines(valid_labels)

        if unique_labels:
            # Join OCR text
            ocr_text = " ".join(unique_labels)
            text_parts.append(ocr_text)
            sources.append("on_screen_labels")
            raw_text_parts["on_screen_labels"] = ocr_text

            # Track OCR density quality flag
            total_chars = sum(len(l) for l in unique_labels)
            if total_chars < 20:
                quality_flags["low_ocr_density"] = 1
        elif on_screen_labels and not unique_labels:
            # Had OCR labels but all filtered as noise
            quality_flags["ocr_noise_filtered"] = len(on_screen_labels)

    # 5. Hashtags (provide context but not primary content)
    hashtags = content_text_dict.get("hashtags", [])
    if hashtags:
        valid_hashtags = [h.strip() for h in hashtags if h and isinstance(h, str) and h.strip()]
        if valid_hashtags:
            hashtag_text = " ".join(valid_hashtags)
            text_parts.append(hashtag_text)
            sources.append("hashtags")
            raw_text_parts["hashtags"] = hashtag_text

    # Combine all text parts
    combined_text = " ".join(text_parts)
    normalized_text = normalize_text(combined_text)

    # Detect quality issues
    if not normalized_text:
        quality_flags["missing_text_fields"] = 1
    elif len(normalized_text) < 10:
        quality_flags["very_short_text"] = 1

    # Check for missing OCR in MOBILE_VIDEO context
    source_details = feed_item.get("source_details", {})
    capture_source = source_details.get("capture_source_type", "")
    if capture_source == "MOBILE_VIDEO_FRAME" and "on_screen_labels" not in sources:
        quality_flags["missing_ocr_text"] = 1

    return {
        "content_text": normalized_text,
        "sources": sources,
        "quality_flags": quality_flags,
        "raw_text_parts": raw_text_parts,
    }


def get_text_for_analysis(feed_item: Dict[str, Any]) -> Tuple[str, List[str]]:
    """
    Convenience function: get just the text and sources.

    Args:
        feed_item: A feed item dict

    Returns:
        Tuple of (content_text, sources)
    """
    result = extract_text_signals(feed_item)
    return result["content_text"], result["sources"]


def has_analyzable_text(feed_item: Dict[str, Any]) -> bool:
    """
    Check if a feed item has enough text for analysis.

    Args:
        feed_item: A feed item dict

    Returns:
        True if item has non-empty text content
    """
    result = extract_text_signals(feed_item)
    return bool(result["content_text"])


def batch_extract_text_signals(feed_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extract text signals from all feed items with aggregate stats.

    Args:
        feed_items: List of feed item dicts

    Returns:
        Dict with:
            - extractions: List of extraction results per item
            - summary: Aggregate statistics
    """
    extractions = []
    n_with_text = 0
    n_with_ocr = 0
    quality_flag_counts: Dict[str, int] = {}
    source_counts: Dict[str, int] = {}

    for item in feed_items:
        result = extract_text_signals(item)
        extractions.append(result)

        if result["content_text"]:
            n_with_text += 1

        if "on_screen_labels" in result["sources"]:
            n_with_ocr += 1

        # Count sources
        for source in result["sources"]:
            source_counts[source] = source_counts.get(source, 0) + 1

        # Count quality flags
        for flag, count in result["quality_flags"].items():
            quality_flag_counts[flag] = quality_flag_counts.get(flag, 0) + count

    n_total = len(feed_items)
    return {
        "extractions": extractions,
        "summary": {
            "n_total": n_total,
            "n_with_text": n_with_text,
            "n_with_ocr": n_with_ocr,
            "text_coverage_percent": round(n_with_text / n_total * 100, 1) if n_total > 0 else 0,
            "ocr_coverage_percent": round(n_with_ocr / n_total * 100, 1) if n_total > 0 else 0,
            "source_counts": source_counts,
            "quality_flag_counts": quality_flag_counts,
        }
    }
