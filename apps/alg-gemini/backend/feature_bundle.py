"""
Multimodal Feature Bundle Extraction for Feed Items

This module provides deterministic, on-demand feature extraction from feed items.
FeatureBundles are computed once per request and passed to all evidence bundle builders,
avoiding redundant extraction work.

Key principles:
    - Deterministic: Same input always produces same output (except extraction_metadata.extracted_at)
    - No classification: This module extracts/normalizes features only, no inference
    - No persistence: FeatureBundles are not stored to SQLite
    - Internal only: FeatureBundles do not appear in API responses

item_id generation rules (in order):
    1. If dom_metadata.post_id exists: {platform}:{post_id}
    2. Else if dom_metadata.post_url exists: {platform}:{normalized_post_url}
       - normalized = lowercase + strip query params
    3. Else fallback: {platform}:{sha256(platform|source_type|item_position|content_text_prefix)[:16]}
       - content_text_prefix = first 120 chars of normalized content_text (or empty string)

Audio availability 3-state:
    - "present_unprocessed": ONLY if deterministic indicator exists (do not guess)
    - "absent": ONLY if deterministically known (e.g., desktop DOM capture)
    - "unknown": Default when we cannot determine
"""

import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse, urlunparse

from text_signals import extract_text_signals


# Schema version for FeatureBundle format
FEATURE_BUNDLE_SCHEMA_VERSION = "1.0.0"


def _normalize_url(url: str) -> str:
    """
    Normalize URL by lowercasing and stripping query params.

    Args:
        url: The URL to normalize

    Returns:
        Normalized URL string
    """
    if not url:
        return ""
    try:
        parsed = urlparse(url.lower())
        # Rebuild without query, fragment
        normalized = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            "",  # params
            "",  # query
            ""   # fragment
        ))
        return normalized
    except Exception:
        return url.lower()


def _generate_item_id(
    item: Dict[str, Any],
    platform: str,
    source_type: str,
    item_position: int,
    content_text: str
) -> str:
    """
    Generate a deterministic item_id following the priority rules.

    Priority:
        1. dom_metadata.post_id if exists
        2. dom_metadata.post_url (normalized) if exists
        3. SHA256 hash fallback

    Args:
        item: The feed item dict
        platform: Platform name (e.g., "tiktok", "instagram")
        source_type: Source type (e.g., "DESKTOP_EXTENSION", "MOBILE_VIDEO")
        item_position: Position in feed (0-indexed)
        content_text: Normalized content text from text_signals

    Returns:
        Deterministic item_id string
    """
    platform_lower = (platform or "unknown").lower()
    dom_metadata = item.get("dom_metadata", {}) or {}

    # Rule 1: Use post_id if available
    post_id = dom_metadata.get("post_id")
    if post_id:
        return f"{platform_lower}:{post_id}"

    # Rule 2: Use normalized post_url if available
    post_url = dom_metadata.get("post_url")
    if post_url:
        normalized_url = _normalize_url(post_url)
        if normalized_url:
            return f"{platform_lower}:{normalized_url}"

    # Rule 3: SHA256 fallback
    # content_text_prefix = first 120 chars of normalized content_text
    content_prefix = (content_text or "")[:120]

    # Build deterministic hash input
    hash_input = f"{platform_lower}|{source_type or 'UNKNOWN'}|{item_position}|{content_prefix}"
    hash_digest = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()[:16]

    return f"{platform_lower}:{hash_digest}"


def _determine_audio_availability(
    item: Dict[str, Any],
    source_type: str
) -> str:
    """
    Determine audio availability using 3-state logic.

    Returns:
        "present_unprocessed": If deterministic indicator shows audio exists but not transcribed
        "absent": If deterministically known there is no audio (e.g., desktop DOM capture)
        "unknown": Default when we cannot determine
    """
    # For DESKTOP_EXTENSION, audio is definitively absent (DOM capture has no audio)
    if source_type == "DESKTOP_EXTENSION":
        return "absent"

    # For MOBILE_VIDEO, check for deterministic indicators
    if source_type == "MOBILE_VIDEO":
        source_details = item.get("source_details", {}) or {}

        # Check if there's explicit audio metadata
        audio_meta = source_details.get("audio_metadata")
        if audio_meta is not None:
            # If we have audio metadata, audio was present
            has_audio = audio_meta.get("has_audio")
            if has_audio is True:
                return "present_unprocessed"
            elif has_audio is False:
                return "absent"

        # Video frames imply there could be audio, but we don't know for sure
        capture_source = source_details.get("capture_source_type")
        if capture_source == "MOBILE_VIDEO_FRAME":
            # Video frames might have audio, but we can't confirm without processing
            return "unknown"

    # Default: we don't know
    return "unknown"


def _extract_vision_features(
    item: Dict[str, Any],
    text_signals_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Extract vision features from available OCR/metadata.

    This does NOT run new OCR - only uses existing stored OCR fields.

    Args:
        item: The feed item dict
        text_signals_result: Result from extract_text_signals()

    Returns:
        Vision features dict
    """
    content_text = item.get("content_text", {}) or {}
    source_details = item.get("source_details", {}) or {}
    ocr_metadata = source_details.get("ocr_metadata", {}) or {}

    # Extract OCR text if present (from text_signals)
    ocr_text = None
    ocr_source = None

    if "on_screen_labels" in text_signals_result.get("sources", []):
        # OCR text was used in text extraction
        raw_parts = text_signals_result.get("raw_text_parts", {})
        ocr_text = raw_parts.get("on_screen_labels")
        ocr_source = "on_screen_labels"

    # Get on_screen_labels directly for raw access
    on_screen_labels = content_text.get("on_screen_labels", [])

    return {
        "ocr_text": ocr_text,
        "ocr_text_available": ocr_text is not None and len(ocr_text) > 0,
        "ocr_source": ocr_source,
        "ocr_labels_count": len([l for l in on_screen_labels if l and l.strip()]),
        "ocr_confidence": ocr_metadata.get("average_ocr_confidence"),
        "ocr_method": ocr_metadata.get("ocr_method"),
        "thumbnail_url": item.get("thumbnail_url"),
        "has_thumbnail": bool(item.get("thumbnail_url")),
    }


def _extract_metadata_features(
    item: Dict[str, Any],
    platform: str,
    source_type: str
) -> Dict[str, Any]:
    """
    Extract metadata features (pass-through of existing fields).

    Args:
        item: The feed item dict
        platform: Platform name
        source_type: Source type

    Returns:
        Metadata features dict
    """
    account = item.get("account") or {}
    ad_metadata = item.get("ad_metadata") or {}
    dom_metadata = item.get("dom_metadata") or {}

    return {
        "platform": platform,
        "source_type": source_type,
        "content_type": item.get("content_type"),
        "is_ad": item.get("is_ad", False),
        "ad_metadata": ad_metadata if ad_metadata else None,
        "account": {
            "account_handle": account.get("account_handle"),
            "display_name": account.get("display_name"),
            "is_verified": account.get("is_verified"),
            "follower_count": account.get("follower_count"),
        } if account else None,
        "dom_metadata": dom_metadata if dom_metadata else None,
    }


def _compute_quality_flags(
    text_signals_result: Dict[str, Any],
    vision_features: Dict[str, Any],
    audio_availability: str
) -> Dict[str, Any]:
    """
    Compute quality flags from extracted features.

    Args:
        text_signals_result: Result from extract_text_signals()
        vision_features: Vision features dict
        audio_availability: Audio availability state

    Returns:
        Quality flags dict
    """
    flags = {}

    # Text quality flags (from text_signals)
    text_quality = text_signals_result.get("quality_flags", {})
    if text_quality:
        flags["text_quality_flags"] = text_quality

    # Text coverage
    content_text = text_signals_result.get("content_text", "")
    flags["has_text"] = bool(content_text)
    flags["text_length"] = len(content_text)
    flags["text_sources_count"] = len(text_signals_result.get("sources", []))

    # OCR quality flags
    flags["has_ocr"] = vision_features.get("ocr_text_available", False)
    if vision_features.get("ocr_confidence") is not None:
        flags["ocr_confidence"] = vision_features["ocr_confidence"]
        if vision_features["ocr_confidence"] < 0.5:
            flags["low_ocr_confidence"] = True

    # Audio flags
    flags["audio_availability"] = audio_availability

    return flags


def build_feature_bundle_for_item(
    item: Dict[str, Any],
    platform: str,
    source_type: str,
    item_position: int
) -> Dict[str, Any]:
    """
    Build a FeatureBundle for a single feed item.

    This extracts and normalizes all features from a feed item without
    performing any classification or inference.

    Args:
        item: A feed item dict from the scan result
        platform: Platform name (e.g., "tiktok", "instagram")
        source_type: Source type (e.g., "DESKTOP_EXTENSION", "MOBILE_VIDEO")
        item_position: Position in feed (0-indexed)

    Returns:
        FeatureBundle dict with schema_version, item_id, features, quality_flags
    """
    # Extract text signals using canonical utility
    text_signals_result = extract_text_signals(item)
    content_text = text_signals_result.get("content_text", "")

    # Generate deterministic item_id
    item_id = _generate_item_id(
        item=item,
        platform=platform,
        source_type=source_type,
        item_position=item_position,
        content_text=content_text
    )

    # Determine audio availability
    audio_availability = _determine_audio_availability(item, source_type)

    # Extract vision features (from existing OCR, no new work)
    vision_features = _extract_vision_features(item, text_signals_result)

    # Extract metadata features (pass-through)
    metadata_features = _extract_metadata_features(item, platform, source_type)

    # Compute quality flags
    quality_flags = _compute_quality_flags(
        text_signals_result, vision_features, audio_availability
    )

    # Determine modality availability
    modality_availability = {
        "text": bool(content_text),
        "vision": vision_features.get("has_thumbnail", False) or vision_features.get("ocr_text_available", False),
        "audio": audio_availability != "absent",  # True if present_unprocessed or unknown
        "metadata": bool(metadata_features.get("account") or metadata_features.get("ad_metadata")),
    }

    return {
        "schema_version": FEATURE_BUNDLE_SCHEMA_VERSION,
        "item_id": item_id,
        "item_position": item_position,

        # Feature groups
        "text_features": {
            "content_text": content_text,
            "sources": text_signals_result.get("sources", []),
            "raw_text_parts": text_signals_result.get("raw_text_parts", {}),
            "quality_flags": text_signals_result.get("quality_flags", {}),
        },
        "vision_features": vision_features,
        "audio_features": {
            "transcript": None,  # Not yet implemented (Prompt 3)
            "speech_detected": None,  # Not yet implemented (Prompt 3)
            "availability": audio_availability,
        },
        "metadata_features": metadata_features,

        # Summary fields
        "modality_availability": modality_availability,
        "quality_flags": quality_flags,
    }


def build_feature_bundle_collection(
    scan_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Build a FeatureBundleCollection for all items in a scan result.

    This is the main entry point for feature extraction. It processes all
    feed items and produces a collection with summary statistics.

    Args:
        scan_result: The full UnifiedScanResult dict from the database

    Returns:
        FeatureBundleCollection dict with:
            - scan_id, platform, source_type, n_items
            - items: list of FeatureBundles
            - coverage: summary counts for text/vision/audio/metadata
            - extraction_metadata: timestamp (only non-deterministic field)
    """
    scan_metadata = scan_result.get("scan_metadata", {}) or {}
    feed_items = scan_result.get("feed_items", []) or []

    scan_id = scan_metadata.get("scan_id")
    platform = scan_metadata.get("platform", "unknown")
    source_type = scan_metadata.get("source_type", "UNKNOWN")

    # Build FeatureBundle for each item
    items = []
    for i, item in enumerate(feed_items):
        feature_bundle = build_feature_bundle_for_item(
            item=item,
            platform=platform,
            source_type=source_type,
            item_position=i
        )
        items.append(feature_bundle)

    # Compute coverage summary
    n_items = len(items)
    n_with_text = sum(1 for fb in items if fb["modality_availability"]["text"])
    n_with_vision = sum(1 for fb in items if fb["modality_availability"]["vision"])
    n_with_audio_possible = sum(1 for fb in items if fb["modality_availability"]["audio"])
    n_with_metadata = sum(1 for fb in items if fb["modality_availability"]["metadata"])

    # Audio breakdown
    n_audio_present = sum(1 for fb in items if fb["audio_features"]["availability"] == "present_unprocessed")
    n_audio_absent = sum(1 for fb in items if fb["audio_features"]["availability"] == "absent")
    n_audio_unknown = sum(1 for fb in items if fb["audio_features"]["availability"] == "unknown")

    # OCR coverage
    n_with_ocr = sum(1 for fb in items if fb["vision_features"].get("ocr_text_available", False))

    coverage = {
        "text": {
            "n_items_with_text": n_with_text,
            "coverage_percent": round(n_with_text / n_items * 100, 1) if n_items > 0 else 0,
        },
        "vision": {
            "n_items_with_vision": n_with_vision,
            "n_items_with_ocr": n_with_ocr,
            "coverage_percent": round(n_with_vision / n_items * 100, 1) if n_items > 0 else 0,
            "ocr_coverage_percent": round(n_with_ocr / n_items * 100, 1) if n_items > 0 else 0,
        },
        "audio": {
            "n_items_with_audio_possible": n_with_audio_possible,
            "n_present_unprocessed": n_audio_present,
            "n_absent": n_audio_absent,
            "n_unknown": n_audio_unknown,
        },
        "metadata": {
            "n_items_with_metadata": n_with_metadata,
            "coverage_percent": round(n_with_metadata / n_items * 100, 1) if n_items > 0 else 0,
        },
    }

    return {
        "schema_version": FEATURE_BUNDLE_SCHEMA_VERSION,
        "scan_id": scan_id,
        "platform": platform,
        "source_type": source_type,
        "n_items": n_items,
        "items": items,
        "coverage": coverage,
        "extraction_metadata": {
            "extracted_at": datetime.now().isoformat(),
        },
    }


def get_feature_bundle_for_position(
    feature_collection: Dict[str, Any],
    position: int
) -> Optional[Dict[str, Any]]:
    """
    Get the FeatureBundle for a specific item position.

    Convenience function for accessing features by position.

    Args:
        feature_collection: The FeatureBundleCollection
        position: Item position (0-indexed)

    Returns:
        FeatureBundle dict or None if not found
    """
    items = feature_collection.get("items", [])
    if 0 <= position < len(items):
        return items[position]
    return None


def get_text_content_from_features(
    feature_bundle: Dict[str, Any]
) -> str:
    """
    Extract the content_text from a FeatureBundle.

    Convenience function for accessing text content.

    Args:
        feature_bundle: A FeatureBundle dict

    Returns:
        The content_text string (may be empty)
    """
    text_features = feature_bundle.get("text_features", {})
    return text_features.get("content_text", "")
