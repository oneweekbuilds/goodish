"""
Deterministic Creator Extraction for MOBILE_VIDEO Scans

This module extracts creator identifiers from MOBILE_VIDEO scan items using
deterministic pattern matching on OCR text. No LLM calls, no speculative inference.

Extraction Rules:
1. @handle patterns: Look for @username in OCR text
2. Confidence gating:
   - HIGH: Handle is 4+ chars, alphanumeric with underscores/dots only
   - MED: Handle is 3 chars or contains unusual patterns
   - LOW: Ambiguous or multiple conflicting handles
3. Exclusion reasons when not extractable:
   - missing_ocr_text: No OCR text available for this item
   - no_handle_found: OCR text exists but no @handle pattern found
   - ambiguous_handle: Multiple conflicting handles found
   - handle_too_short: Handle is only 1-2 characters

Only HIGH confidence extractions are surfaced as creators.
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from enum import Enum
from text_signals import extract_text_signals


class ExtractionConfidence(Enum):
    HIGH = "HIGH"
    MED = "MED"
    LOW = "LOW"


class ExclusionReason(Enum):
    MISSING_OCR_TEXT = "missing_ocr_text"
    NO_HANDLE_FOUND = "no_handle_found"
    AMBIGUOUS_HANDLE = "ambiguous_handle"
    HANDLE_TOO_SHORT = "handle_too_short"


# Regex pattern for @handle extraction
# Matches @followed by alphanumeric, underscore, or dot (common social media handles)
HANDLE_PATTERN = re.compile(r'@([a-zA-Z0-9_\.]+)', re.IGNORECASE)

# Minimum length for HIGH confidence (4 chars excluding @)
MIN_HIGH_CONFIDENCE_LENGTH = 4

# Minimum length for any extraction (4 chars excluding @, increased from 3)
MIN_HANDLE_LENGTH = 4

# Patterns that suggest the handle is valid (context clues in social media UI)
VALID_CONTEXT_PATTERNS = [
    r'follow',
    r'retweet',
    r'like',
    r'share',
    r'comment',
    r'reply',
    r'post',
]

# Patterns that suggest the @ is NOT a handle (e.g., email-like patterns)
INVALID_CONTEXT_PATTERNS = [
    r'@[a-zA-Z0-9_.]+\.[a-z]{2,}',  # email-like: user@domain.com
]


def extract_creator_from_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract creator information from a single feed item.

    Args:
        item: A feed item dict from the scan result

    Returns:
        Dict with:
            - extracted: bool - whether a creator was successfully extracted
            - creator_id: str or None - the extracted @handle (with @)
            - confidence: str or None - HIGH/MED/LOW
            - evidence: dict or None - extraction evidence
            - exclusion_reason: str or None - why extraction failed
    """
    result = {
        "extracted": False,
        "creator_id": None,
        "confidence": None,
        "evidence": None,
        "exclusion_reason": None,
    }

    # Use canonical text_signals utility for normalized OCR text extraction
    # This provides de-duplicated, noise-filtered text from all sources
    text_result = extract_text_signals(item)
    ocr_text = text_result["content_text"]  # Already normalized lowercase

    # Check if we have OCR text
    if not ocr_text:
        result["exclusion_reason"] = ExclusionReason.MISSING_OCR_TEXT.value
        return result

    # Extract all @handle patterns
    handles = HANDLE_PATTERN.findall(ocr_text)

    if not handles:
        result["exclusion_reason"] = ExclusionReason.NO_HANDLE_FOUND.value
        return result

    # Filter out too-short handles and normalize
    valid_handles = []
    for handle in handles:
        # Skip email-like patterns
        if _looks_like_email(handle, ocr_text):
            continue

        # Skip very short handles (likely OCR noise)
        if len(handle) < MIN_HANDLE_LENGTH:
            continue

        valid_handles.append(handle.lower())

    if not valid_handles:
        result["exclusion_reason"] = ExclusionReason.HANDLE_TOO_SHORT.value
        return result

    # Deduplicate and count occurrences
    handle_counts = {}
    for h in valid_handles:
        handle_counts[h] = handle_counts.get(h, 0) + 1

    # Get the most frequent handle
    sorted_handles = sorted(handle_counts.items(), key=lambda x: -x[1])
    best_handle, best_count = sorted_handles[0]

    # Determine confidence
    confidence = _assess_confidence(best_handle, best_count, sorted_handles, ocr_text)

    # For HIGH confidence, we extract; otherwise mark as ambiguous
    if confidence == ExtractionConfidence.HIGH:
        result["extracted"] = True
        result["creator_id"] = f"@{best_handle}"
        result["confidence"] = confidence.value
        result["evidence"] = {
            "source": "ocr_handle_pattern",
            "raw_handle": best_handle,
            "occurrences": best_count,
            "ocr_text_length": len(ocr_text),
        }
    elif confidence == ExtractionConfidence.MED:
        # MED confidence - still extract but flag it
        result["extracted"] = True
        result["creator_id"] = f"@{best_handle}"
        result["confidence"] = confidence.value
        result["evidence"] = {
            "source": "ocr_handle_pattern",
            "raw_handle": best_handle,
            "occurrences": best_count,
            "ocr_text_length": len(ocr_text),
            "quality_note": "medium_confidence_extraction",
        }
    else:
        # LOW confidence - don't extract
        result["exclusion_reason"] = ExclusionReason.AMBIGUOUS_HANDLE.value

    return result


def _looks_like_email(handle: str, full_text: str) -> bool:
    """Check if the @handle looks like part of an email address."""
    # Look for the handle followed by a domain-like pattern
    email_pattern = re.compile(rf'@{re.escape(handle)}\.[a-z]{{2,}}', re.IGNORECASE)
    return bool(email_pattern.search(full_text))


def _assess_confidence(
    handle: str,
    count: int,
    all_handles: List[Tuple[str, int]],
    ocr_text: str
) -> ExtractionConfidence:
    """
    Assess confidence level for a handle extraction.

    HIGH confidence requirements:
    - Handle is at least 4 characters
    - Handle is mostly alphanumeric (not just symbols/numbers)
    - Either appears multiple times OR is the only handle found

    MED confidence:
    - Handle is 3 characters
    - OR multiple handles found with similar counts

    LOW confidence:
    - Handle is ambiguous
    - Multiple conflicting handles with similar prominence
    """
    # Check length
    if len(handle) < MIN_HIGH_CONFIDENCE_LENGTH:
        return ExtractionConfidence.MED

    # Check if handle has at least one letter (not just numbers)
    if not any(c.isalpha() for c in handle):
        return ExtractionConfidence.LOW

    # Check for multiple conflicting handles
    if len(all_handles) > 1:
        second_handle, second_count = all_handles[1]
        # If second handle has significant presence, reduce confidence
        if second_count >= count * 0.7:
            return ExtractionConfidence.MED

    # If handle appears multiple times, boost confidence
    if count >= 2:
        return ExtractionConfidence.HIGH

    # Single occurrence but long enough and looks valid
    if len(handle) >= MIN_HIGH_CONFIDENCE_LENGTH:
        return ExtractionConfidence.HIGH

    return ExtractionConfidence.MED


def extract_creators_from_feed_items(
    feed_items: List[Dict[str, Any]],
    source_type: str
) -> Dict[str, Any]:
    """
    Extract creator information from all feed items in a scan.

    For MOBILE_VIDEO source_type: Use OCR-based extraction
    For DESKTOP source_type: Use existing account metadata (pass through)

    Args:
        feed_items: List of feed item dicts
        source_type: "MOBILE_VIDEO", "DESKTOP", etc.

    Returns:
        Dict with:
            - extractions: List of extraction results per item
            - summary: Aggregate counts
            - coverage: Items where creator was extracted
    """
    extractions = []

    n_extracted = 0
    n_high_confidence = 0
    n_med_confidence = 0
    exclusion_counts = {reason.value: 0 for reason in ExclusionReason}

    for item in feed_items:
        # For DESKTOP, check if account info already exists
        account = item.get("account") or {}
        has_existing_account = bool(
            account.get("account_handle") or
            account.get("display_name")
        )

        if source_type == "DESKTOP" or has_existing_account:
            # Use existing account data
            if has_existing_account:
                extractions.append({
                    "position": item.get("position_in_feed"),
                    "extracted": True,
                    "creator_id": account.get("account_handle") or account.get("display_name"),
                    "confidence": "HIGH",
                    "source": "account_metadata",
                    "exclusion_reason": None,
                })
                n_extracted += 1
                n_high_confidence += 1
            else:
                extractions.append({
                    "position": item.get("position_in_feed"),
                    "extracted": False,
                    "creator_id": None,
                    "confidence": None,
                    "source": None,
                    "exclusion_reason": "missing_account",
                })
                exclusion_counts["missing_account"] = exclusion_counts.get("missing_account", 0) + 1
        else:
            # MOBILE_VIDEO - use OCR extraction
            result = extract_creator_from_item(item)
            extractions.append({
                "position": item.get("position_in_feed"),
                "extracted": result["extracted"],
                "creator_id": result["creator_id"],
                "confidence": result["confidence"],
                "source": "ocr_extraction" if result["extracted"] else None,
                "evidence": result.get("evidence"),
                "exclusion_reason": result["exclusion_reason"],
            })

            if result["extracted"]:
                n_extracted += 1
                if result["confidence"] == "HIGH":
                    n_high_confidence += 1
                elif result["confidence"] == "MED":
                    n_med_confidence += 1
            elif result["exclusion_reason"]:
                exclusion_counts[result["exclusion_reason"]] = \
                    exclusion_counts.get(result["exclusion_reason"], 0) + 1

    # Clean up exclusion counts (remove zeros)
    exclusion_counts = {k: v for k, v in exclusion_counts.items() if v > 0}

    return {
        "extractions": extractions,
        "summary": {
            "total_items": len(feed_items),
            "n_extracted": n_extracted,
            "n_high_confidence": n_high_confidence,
            "n_med_confidence": n_med_confidence,
            "extraction_rate_percent": round(n_extracted / len(feed_items) * 100, 1) if feed_items else 0,
        },
        "exclusion_counts": exclusion_counts,
    }
