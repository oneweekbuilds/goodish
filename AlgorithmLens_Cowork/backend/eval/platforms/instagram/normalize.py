"""
Normalize Instagram capture data into AlgorithmLens UnifiedScanResult format.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from ..common.schema import CaptureSnapshot, CapturedPost


def _map_content_type(capture_type: str) -> str:
    """Map Instagram content_type to UnifiedScanResult content_type values."""
    mapping = {
        "text": "TEXT",
        "image": "IMAGE",
        "video": "VIDEO",
        "carousel": "CAROUSEL",
        "reel": "REEL",
        "story": "STORY",
        "link": "LINK",
    }
    return mapping.get(capture_type.lower(), "IMAGE")


def _post_to_feed_item(post: CapturedPost, index: int) -> Dict[str, Any]:
    """Convert a CapturedPost to a UnifiedScanResult FeedItem dict."""
    return {
        "position_in_feed": index,
        "approx_timestamp_offset_sec": None,
        "content_type": _map_content_type(post.content_type),
        "is_ad": post.is_ad,
        "ai_disclosure": None,
        "c2pa_disclosure": None,
        "ai_disclosure_source": None,
        "ai_disclosure_text": None,
        "ad_metadata": {
            "ad_detected_reason": "sponsored_label" if post.is_ad else None,
            "sponsored_label_text": "Sponsored" if post.is_ad else None,
            "advertiser_name": post.author if post.is_ad else None,
            "advertiser_domain": None,
            "product_or_service": None,
        } if post.is_ad else None,
        "account": {
            "account_handle": post.author,
            "account_display_name": post.author_display_name,
            "account_category_guess": None,
        },
        "content_text": {
            "captions": [post.content_text] if post.content_text else [],
            "hashtags": post.hashtags,
            "on_screen_labels": [],
        },
        "topics": {
            "primary_category": None,
            "secondary_categories": [],
            "freeform_tags": [],
        },
        "political": {
            "is_political": False,
            "political_subtype": None,
            "stance_or_alignment_guess": None,
            "policy_area": None,
            "geographic_focus": None,
        },
        "wellbeing": {
            "wellbeing_relevance": "NONE",
            "valence": None,
            "themes": [],
            "potential_risk_flags": [],
        },
        "engagement_drivers": {
            "hooks_detected": [],
            "call_to_action_patterns": [],
            "urgency_or_scarcity_signals": [],
        },
        "repetition": {
            "similar_to_previous_items": False,
            "repetition_reasons": [],
            "repetition_cluster_id": None,
        },
        "algorithm_inferences": {
            "suggested_interests": [],
            "suggested_audience_segments": [],
        },
        "source_details": {
            "capture_source_type": "DESKTOP_EXTENSION",
            "dom_metadata": {
                "post_id": post.id,
                "post_url": f"https://www.instagram.com/p/{post.id}/" if post.id and not post.id.startswith("ig_") else None,
                "account_id": None,
            },
            "ocr_metadata": None,
        },
    }


def normalize_to_unified_scan(snapshot: CaptureSnapshot) -> Dict[str, Any]:
    """Convert a CaptureSnapshot to a UnifiedScanResult dictionary."""
    scan_id = f"eval_{snapshot.platform}_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    feed_items = [
        _post_to_feed_item(post, i)
        for i, post in enumerate(snapshot.posts)
    ]

    total_items = len(feed_items)
    total_ads = sum(1 for p in snapshot.posts if p.is_ad)

    type_counts: Dict[str, int] = {}
    for post in snapshot.posts:
        ct = _map_content_type(post.content_type)
        type_counts[ct] = type_counts.get(ct, 0) + 1

    return {
        "schema_version": "1.0.0",
        "scan_metadata": {
            "scan_id": scan_id,
            "created_at": now,
            "source_type": "DESKTOP_EXTENSION",
            "platform": "INSTAGRAM",
            "user_identifier": None,
            "app_scan_version": "eval-1.0.0",
            "insights_engine_version": "eval-1.0.0",
        },
        "environment": {
            "device_type": "DESKTOP",
            "device_os": "LINUX",
            "browser_name": "Chrome",
            "browser_version": None,
            "screen_resolution": None,
            "video_capture": None,
            "extension_capture": {
                "is_dom_based": True,
                "dom_capture_strategy": "VISIBLE_FEED_ONLY",
            },
        },
        "feed_items": feed_items,
        "aggregates": {
            "total_feed_items": total_items,
            "total_ads": total_ads,
            "ad_percentage": round(total_ads / total_items * 100, 2) if total_items > 0 else 0,
            "topic_distribution": [],
            "wellbeing_summary": {
                "high_relevance_items": 0,
                "potential_risk_items": 0,
                "valence_distribution": {"POSITIVE": 0, "NEUTRAL": 0, "NEGATIVE": 0, "MIXED": 0},
            },
            "political_content_summary": {"political_items": 0, "political_percentage": 0.0},
            "repetition_summary": {"items_in_repetition_clusters": 0, "largest_cluster_size": 0},
            "engagement_pattern_summary": {"top_hooks": []},
        },
        "privacy": {
            "user_identifiers_stored": False,
            "profile_photos_stored": False,
            "raw_text_stored": True,
            "retention_policy_key": "SHORT",
            "redacted_fields": [],
        },
        "debug": {
            "processing_time_seconds": None,
            "frames_extracted": None,
            "frames_sampled_for_ocr": None,
            "errors": [],
            "warnings": [],
            "raw_backend_payload": None,
        },
        "_eval_metadata": {
            "capture_snapshot_summary": snapshot.summary(),
            "ground_truth_post_count": total_items,
            "ground_truth_content_types": type_counts,
            "capture_timestamp": snapshot.capture_timestamp,
        },
    }
