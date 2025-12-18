"""
Evidence Bundle Builder for Patterns in Your Feed Tab

This module produces an Evidence Bundle for the Patterns tab.
All plain-English analysis and Talk-to-Algorithm responses MUST be generated
from this bundle only - never from raw feed text or generic explanations.

Epistemic boundaries (enforced):
- Cannot know why algorithm chose these items
- Cannot infer user intent or preferences
- Repetition does not prove manipulation
- Diversity metrics depend on classifier coverage

Evidence Bundle Structure:
{
    "meta": { ... },           # Scan metadata
    "observations": { ... },   # Hard facts: repetition, timing, diversity
    "measurements": { ... },   # Classifier-based estimates
    "limits": { ... }          # What is missing or uncertain
}
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from collections import Counter
from feature_bundle import build_feature_bundle_collection


def build_patterns_evidence_bundle(
    scan_result: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build an Evidence Bundle for the Patterns in Your Feed tab.

    Args:
        scan_result: The full UnifiedScanResult dict from the database
        feature_collection: Optional pre-computed FeatureBundleCollection.
            If None, will be computed internally (backward compatibility).
            If provided, MUST be used and MUST NOT be recomputed.

    Returns:
        Evidence Bundle dict with keys: meta, observations, measurements, limits
    """
    scan_metadata = scan_result.get("scan_metadata", {})
    aggregates = scan_result.get("aggregates", {})
    feed_items = scan_result.get("feed_items", [])

    # Compute or use provided feature_collection
    if feature_collection is None:
        feature_collection = build_feature_bundle_collection(scan_result)

    meta = _build_meta(scan_metadata, aggregates, feed_items)
    observations = _build_observations(aggregates, feed_items)
    measurements = _build_measurements(aggregates, feed_items)
    limits = _build_limits(scan_metadata, aggregates, feed_items)

    return {
        "meta": meta,
        "observations": observations,
        "measurements": measurements,
        "limits": limits,
    }


def _build_meta(
    scan_metadata: Dict[str, Any],
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Build the meta section with scan context."""
    n_items = len(feed_items)
    created_at = scan_metadata.get("created_at")

    # Build coverage accounting
    coverage = _compute_coverage(feed_items)

    return {
        "scan_id": scan_metadata.get("scan_id"),
        "platform": scan_metadata.get("platform"),
        "n_items": n_items,
        "window_start": created_at,
        "window_end": created_at,
        "generated_at": datetime.now().isoformat(),
        "coverage": coverage,
    }


def _compute_coverage(feed_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compute coverage metadata for the patterns evidence bundle.

    Coverage Contract (enforced):
    - n_items_total = n_items_included + n_items_excluded
    - exclusion_reasons counts ONLY truly excluded items (sum == n_items_excluded)
    - quality_flags counts issues among INCLUDED items (does not affect coverage counts)

    For Patterns bundle: Items WITHOUT both content_type AND account info are EXCLUDED
    because pattern analysis requires at least one of these. These items are tracked
    in exclusion_reasons.

    Returns:
        Coverage dict with standardized fields
    """
    n_items_total = len(feed_items)
    exclusion_reasons: Dict[str, int] = {}
    quality_flags: Dict[str, int] = {}

    # Track items excluded for mechanical reasons
    n_missing_metadata = 0

    for item in feed_items:
        # Patterns analysis requires at minimum content_type or account info
        has_content_type = bool(item.get("content_type"))
        has_account = bool(item.get("account"))

        if not has_content_type and not has_account:
            n_missing_metadata += 1

    # Items without any metadata are EXCLUDED (cannot contribute to pattern analysis)
    # Contract: sum(exclusion_reasons.values()) == n_items_excluded
    n_items_excluded = n_missing_metadata
    n_items_included = n_items_total - n_items_excluded

    if n_missing_metadata > 0:
        exclusion_reasons["missing_metadata"] = n_missing_metadata

    return {
        "n_items_total": n_items_total,
        "n_items_included": n_items_included,
        "n_items_excluded": n_items_excluded,
        "exclusion_reasons": exclusion_reasons,
        "quality_flags": quality_flags,
    }


def _build_observations(
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Build the observations section with hard facts only.

    Patterns tab focuses on: repetition, content type distribution,
    creator concentration, and feed structure.
    """
    observations = {}
    n_items = len(feed_items)
    observations["total_posts_seen"] = n_items

    # Content type distribution
    content_type_counts = Counter()
    for item in feed_items:
        content_type = item.get("content_type", "unknown")
        content_type_counts[content_type] += 1

    if content_type_counts:
        observations["content_type_distribution"] = [
            {"type": ct, "count": count, "percent": round(count / n_items * 100, 1)}
            for ct, count in content_type_counts.most_common()
        ]
    else:
        observations["content_type_distribution"] = []

    # Creator/account concentration
    account_counts = Counter()
    for item in feed_items:
        account = item.get("account") or {}
        handle = account.get("account_handle") or account.get("display_name") or "unknown"
        account_counts[handle] += 1

    unique_creators = len(account_counts)
    observations["unique_creators_count"] = unique_creators

    # Repeated creators (appear 2+ times)
    repeated_creators = [(handle, count) for handle, count in account_counts.items() if count >= 2]
    observations["repeated_creators_count"] = len(repeated_creators)

    if repeated_creators:
        observations["top_repeated_creators"] = [
            {"handle": handle, "count": count}
            for handle, count in sorted(repeated_creators, key=lambda x: -x[1])[:5]
        ]
    else:
        observations["top_repeated_creators"] = []

    # Creator concentration metric
    if n_items > 0 and account_counts:
        sorted_counts = sorted(account_counts.values(), reverse=True)
        top1_share = round((sorted_counts[0] / n_items) * 100, 1)
        top5_share = round((sum(sorted_counts[:5]) / n_items) * 100, 1) if len(sorted_counts) >= 5 else 100
        observations["top1_creator_share_percent"] = top1_share
        observations["top5_creator_share_percent"] = top5_share

    # Feed structure: spacing analysis
    ad_positions = []
    for i, item in enumerate(feed_items):
        if item.get("is_ad", False):
            ad_positions.append(i)

    if len(ad_positions) >= 2:
        gaps = [ad_positions[i+1] - ad_positions[i] for i in range(len(ad_positions) - 1)]
        observations["ad_spacing"] = {
            "min_gap": min(gaps),
            "max_gap": max(gaps),
            "avg_gap": round(sum(gaps) / len(gaps), 1),
            "positions": ad_positions[:10]  # First 10 positions
        }
    elif len(ad_positions) == 1:
        observations["ad_spacing"] = {
            "min_gap": None,
            "max_gap": None,
            "avg_gap": None,
            "positions": ad_positions
        }
    else:
        observations["ad_spacing"] = None

    # Hashtag repetition
    hashtag_counts = Counter()
    for item in feed_items:
        content_text = item.get("content_text", {})
        hashtags = content_text.get("hashtags", [])
        for tag in hashtags:
            if tag:
                hashtag_counts[tag.lower().strip("#")] += 1

    repeated_hashtags = [(tag, count) for tag, count in hashtag_counts.items() if count >= 2]
    observations["repeated_hashtags_count"] = len(repeated_hashtags)
    if repeated_hashtags:
        observations["top_repeated_hashtags"] = [
            {"tag": tag, "count": count}
            for tag, count in sorted(repeated_hashtags, key=lambda x: -x[1])[:5]
        ]

    return observations


def _build_measurements(
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Build the measurements section with derived metrics."""
    measurements = {}
    n_items = len(feed_items)

    # Diversity index (simple: unique creators / total items)
    account_counts = Counter()
    for item in feed_items:
        account = item.get("account") or {}
        handle = account.get("account_handle") or "unknown"
        account_counts[handle] += 1

    unique_creators = len(account_counts)
    if n_items > 0:
        diversity_ratio = round(unique_creators / n_items, 2)
        measurements["creator_diversity_ratio"] = {
            "value": diversity_ratio,
            "method": "unique_creators / total_items",
            "quality": "ok" if n_items >= 10 else "low_sample",
            "notes": f"{unique_creators} unique creators across {n_items} posts. Ratio of 1.0 = all unique."
        }

    # Repetition score
    repeated_count = sum(1 for count in account_counts.values() if count >= 2)
    measurements["repetition_score"] = {
        "value": repeated_count,
        "method": "count_creators_appearing_2plus_times",
        "quality": "ok" if n_items >= 10 else "low_sample",
        "notes": f"{repeated_count} creators appeared multiple times in this scan."
    }

    return measurements


def _build_limits(
    scan_metadata: Dict[str, Any],
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Build the limits section."""
    limits = {}
    n_items = len(feed_items)

    # Sample size limitations
    if n_items < 10:
        limits["sample_size_limitations"] = [
            f"Only {n_items} posts in this scan. Patterns may be coincidental."
        ]
    elif n_items < 30:
        limits["sample_size_limitations"] = [
            f"Sample size of {n_items} posts. Pattern detection is tentative."
        ]
    else:
        limits["sample_size_limitations"] = [
            f"Sample of {n_items} posts from a single scan session."
        ]

    # Epistemic boundaries
    limits["epistemic_boundaries"] = [
        "We cannot know why the algorithm chose these specific items.",
        "We cannot infer your intent, preferences, or interests from this content.",
        "Repetition does not prove manipulation or targeting.",
        "Diversity metrics depend on our ability to identify unique creators.",
        "Patterns in a single scan may not reflect long-term feed behavior.",
    ]

    # Detection limitations
    limits["detection_limitations"] = [
        "Creator identification relies on account handles which may be incomplete.",
        "Content type classification is based on available metadata.",
        "Ad position analysis assumes linear feed ordering.",
    ]

    return limits


def generate_patterns_analysis_copy(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate plain-English analysis copy for the Patterns tab.

    Returns:
        Dict with analysis sections
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    analysis = {}

    # Primary insight - creator diversity
    unique_creators = observations.get("unique_creators_count", 0)
    repeated_count = observations.get("repeated_creators_count", 0)
    diversity = measurements.get("creator_diversity_ratio", {}).get("value", 0)

    if n_items < 10:
        analysis["primary_insight"] = {
            "text": f"In this scan, we captured {n_items} posts. More data is needed to identify feed patterns.",
            "cited_fields": ["meta.n_items"],
            "quality": "insufficient_data"
        }
    elif unique_creators == n_items:
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, all content came from {unique_creators} different creators (no repeats).",
            "cited_fields": ["meta.n_items", "observations.unique_creators_count"],
            "quality": "ok"
        }
    else:
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, content came from {unique_creators} unique creators. {repeated_count} creators appeared multiple times.",
            "cited_fields": [
                "meta.n_items",
                "observations.unique_creators_count",
                "observations.repeated_creators_count"
            ],
            "quality": "ok"
        }

    # Repetition insight
    top_repeated = observations.get("top_repeated_creators", [])
    if top_repeated:
        creator_info = [f"{c['handle']} ({c['count']}x)" for c in top_repeated[:3]]
        analysis["repetition_insight"] = {
            "text": f"Most repeated creators: {', '.join(creator_info)}.",
            "cited_fields": ["observations.top_repeated_creators"],
            "quality": "ok"
        }

    # Content type insight
    content_dist = observations.get("content_type_distribution", [])
    if content_dist:
        dominant = content_dist[0]
        analysis["content_type_insight"] = {
            "text": f"Content was primarily {dominant['type']} ({dominant['percent']}% of posts).",
            "cited_fields": ["observations.content_type_distribution"],
            "quality": "ok"
        }

    # Limitations
    analysis["limitations_summary"] = {
        "text": "Patterns in a single scan may not reflect long-term feed behavior.",
        "cited_fields": ["limits.epistemic_boundaries"],
        "quality": "ok"
    }

    return analysis


def generate_patterns_talk_response(
    bundle: Dict[str, Any],
    question: str
) -> Dict[str, Any]:
    """Generate a Talk-to-Algorithm response for Patterns tab."""
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    unique_creators = observations.get("unique_creators_count", 0)
    repeated_count = observations.get("repeated_creators_count", 0)
    top_repeated = observations.get("top_repeated_creators", [])
    ad_spacing = observations.get("ad_spacing")

    response = {
        "what_we_observed": {
            "intro": f"In this scan of {n_items} posts:",
            "facts": [],
            "cited_fields": []
        },
        "what_it_might_mean": {
            "intro": "These patterns could indicate:",
            "hypotheses": []
        },
        "what_we_cannot_know": {
            "intro": "Important limitations:",
            "limits": [],
            "cited_fields": []
        },
        "what_you_can_try": {
            "intro": "To learn more:",
            "actions": []
        }
    }

    # Observations
    response["what_we_observed"]["facts"].append(
        f"Content came from {unique_creators} unique creators."
    )
    if repeated_count > 0:
        response["what_we_observed"]["facts"].append(
            f"{repeated_count} creators appeared multiple times."
        )
    if top_repeated:
        top_name = top_repeated[0]["handle"]
        top_count = top_repeated[0]["count"]
        response["what_we_observed"]["facts"].append(
            f"Most frequent creator: {top_name} ({top_count} posts)."
        )
    if ad_spacing and ad_spacing.get("avg_gap"):
        response["what_we_observed"]["facts"].append(
            f"Ads appeared every ~{ad_spacing['avg_gap']} posts on average."
        )

    response["what_we_observed"]["cited_fields"] = [
        "observations.unique_creators_count",
        "observations.repeated_creators_count",
        "observations.top_repeated_creators"
    ]

    # Hypotheses
    response["what_it_might_mean"]["hypotheses"] = [
        {
            "label": "Possibility A",
            "text": "Creator repetition may reflect popular accounts in your interest areas."
        },
        {
            "label": "Possibility B",
            "text": "The algorithm may be testing content from specific creators."
        },
        {
            "label": "Possibility C",
            "text": "Feed patterns may vary based on time of day and content availability."
        }
    ]

    # Limits
    epistemic = limits.get("epistemic_boundaries", [])
    response["what_we_cannot_know"]["limits"] = epistemic[:3] if epistemic else [
        "We cannot know why specific content was chosen.",
        "Repetition does not prove targeting or manipulation."
    ]
    response["what_we_cannot_know"]["cited_fields"] = ["limits.epistemic_boundaries"]

    # Actions
    response["what_you_can_try"]["actions"] = [
        "Run multiple scans to compare patterns over time.",
        "Note if the same creators appear across different sessions.",
        "Check if pattern changes after interacting with different content.",
        "Compare feed patterns across different platforms."
    ]

    return response


def format_patterns_talk_response_as_text(response: Dict[str, Any]) -> str:
    """Format a structured Talk response as readable text."""
    sections = []

    obs = response.get("what_we_observed", {})
    if obs.get("facts"):
        sections.append("**What we observed**")
        sections.append(obs.get("intro", ""))
        for fact in obs["facts"]:
            sections.append(f"- {fact}")
        sections.append("")

    meaning = response.get("what_it_might_mean", {})
    if meaning.get("hypotheses"):
        sections.append("**What it might mean**")
        sections.append(meaning.get("intro", ""))
        for hyp in meaning["hypotheses"]:
            sections.append(f"- {hyp['label']}: {hyp['text']}")
        sections.append("")

    unknown = response.get("what_we_cannot_know", {})
    if unknown.get("limits"):
        sections.append("**What we cannot know**")
        sections.append(unknown.get("intro", ""))
        for limit in unknown["limits"]:
            sections.append(f"- {limit}")
        sections.append("")

    actions = response.get("what_you_can_try", {})
    if actions.get("actions"):
        sections.append("**What you can try**")
        sections.append(actions.get("intro", ""))
        for action in actions["actions"]:
            sections.append(f"- {action}")

    return "\n".join(sections)
