"""
Evidence Bundle Builder for Creators & Voices Tab

This module produces an Evidence Bundle for the Creators & Voices tab.
All plain-English analysis and Talk-to-Algorithm responses MUST be generated
from this bundle only - never from raw feed text or generic explanations.

Epistemic boundaries (enforced):
- Cannot infer what user trusts, follows, or agrees with
- Cannot infer whether creator variety is "good" or "bad"
- Cannot infer political/media bias from creator list
- Cannot know why algorithm selected these creators

Evidence Bundle Structure:
{
    "meta": { ... },           # Scan metadata
    "observations": { ... },   # Hard facts: creator counts, verification, handles
    "measurements": { ... },   # Classifier-based estimates
    "limits": { ... }          # What is missing or uncertain
}
"""

from datetime import datetime
from typing import Dict, Any, List
from collections import Counter


def build_creators_evidence_bundle(scan_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build an Evidence Bundle for the Creators & Voices tab.

    Args:
        scan_result: The full UnifiedScanResult dict from the database

    Returns:
        Evidence Bundle dict with keys: meta, observations, measurements, limits
    """
    scan_metadata = scan_result.get("scan_metadata", {})
    aggregates = scan_result.get("aggregates", {})
    feed_items = scan_result.get("feed_items", [])

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

    return {
        "scan_id": scan_metadata.get("scan_id"),
        "platform": scan_metadata.get("platform"),
        "n_items": n_items,
        "window_start": created_at,
        "window_end": created_at,
        "generated_at": datetime.now().isoformat(),
    }


def _build_observations(
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Build the observations section with hard facts only.

    Creators tab focuses on: unique creators, verification status,
    follower counts (if available), posting frequency in scan.
    """
    observations = {}
    n_items = len(feed_items)
    observations["total_posts_seen"] = n_items

    # Build creator profile map
    creator_profiles = {}
    creator_post_counts = Counter()

    for item in feed_items:
        account = item.get("account") or {}
        handle = account.get("account_handle") or account.get("display_name") or "unknown"

        creator_post_counts[handle] += 1

        if handle not in creator_profiles:
            creator_profiles[handle] = {
                "handle": handle,
                "display_name": account.get("display_name"),
                "is_verified": account.get("is_verified", False),
                "follower_count": account.get("follower_count"),
                "post_count_in_scan": 0,
                "is_ad_account": False,
            }

        creator_profiles[handle]["post_count_in_scan"] += 1

        # Check if this creator is associated with ads
        if item.get("is_ad", False):
            creator_profiles[handle]["is_ad_account"] = True

    # Populate creator stats
    observations["unique_creators_count"] = len(creator_profiles)

    # Verification breakdown
    verified_count = sum(1 for p in creator_profiles.values() if p["is_verified"])
    observations["verified_creators_count"] = verified_count
    observations["unverified_creators_count"] = len(creator_profiles) - verified_count

    if len(creator_profiles) > 0:
        observations["verified_rate_percent"] = round(
            (verified_count / len(creator_profiles)) * 100, 1
        )

    # Top creators by post count
    top_creators = sorted(
        creator_profiles.values(),
        key=lambda x: -x["post_count_in_scan"]
    )[:10]

    observations["top_creators"] = [
        {
            "handle": c["handle"],
            "display_name": c["display_name"],
            "is_verified": c["is_verified"],
            "post_count": c["post_count_in_scan"],
            "is_ad_account": c["is_ad_account"],
        }
        for c in top_creators
    ]

    # Creators appearing in ads vs organic
    ad_creators = [h for h, p in creator_profiles.items() if p["is_ad_account"]]
    observations["creators_in_ads_count"] = len(ad_creators)

    # Handle missing info
    handles_missing = sum(
        1 for p in creator_profiles.values()
        if p["handle"] == "unknown" or not p["handle"]
    )
    observations["creators_with_missing_handle"] = handles_missing

    return observations


def _build_measurements(
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Build the measurements section with derived metrics."""
    measurements = {}
    n_items = len(feed_items)

    # Creator concentration metric
    account_counts = Counter()
    for item in feed_items:
        account = item.get("account") or {}
        handle = account.get("account_handle") or "unknown"
        account_counts[handle] += 1

    unique_creators = len(account_counts)

    if unique_creators > 0 and n_items > 0:
        # Concentration: how much content comes from top creators
        sorted_counts = sorted(account_counts.values(), reverse=True)
        top1_share = sorted_counts[0] / n_items if sorted_counts else 0
        top5_share = sum(sorted_counts[:5]) / n_items if len(sorted_counts) >= 5 else 1.0

        measurements["creator_concentration"] = {
            "value": {
                "top1_share": round(top1_share, 2),
                "top5_share": round(top5_share, 2),
                "unique_count": unique_creators,
            },
            "method": "post_count_per_creator",
            "quality": "ok" if n_items >= 10 else "low_sample",
            "notes": f"Top creator has {sorted_counts[0]} posts ({round(top1_share*100)}% of feed)."
        }

    # Voice diversity (simple metric)
    if n_items > 0:
        diversity_ratio = unique_creators / n_items
        measurements["voice_diversity"] = {
            "value": round(diversity_ratio, 2),
            "method": "unique_creators / total_posts",
            "quality": "ok" if n_items >= 10 else "low_sample",
            "notes": "1.0 = all unique creators, lower = more repetition."
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
            f"Only {n_items} posts in this scan. Creator patterns may not be representative."
        ]
    elif n_items < 30:
        limits["sample_size_limitations"] = [
            f"Sample size of {n_items} posts. Creator analysis is tentative."
        ]
    else:
        limits["sample_size_limitations"] = [
            f"Sample of {n_items} posts from a single scan session."
        ]

    # Epistemic boundaries
    limits["epistemic_boundaries"] = [
        "We cannot infer what you trust, follow, or agree with.",
        "We cannot determine whether creator variety is 'good' or 'bad'.",
        "We cannot infer political or ideological bias from creator presence.",
        "We cannot know why the algorithm selected these specific creators.",
        "Verification status is platform-determined and does not indicate credibility.",
        "We cannot determine your relationship or engagement with any creator.",
    ]

    # Detection limitations
    limits["detection_limitations"] = [
        "Creator identification relies on account metadata which may be incomplete.",
        "Verification status depends on platform data availability.",
        "Some creators may use multiple accounts not detected here.",
    ]

    return limits


def generate_creators_analysis_copy(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate plain-English analysis copy for the Creators & Voices tab.

    Returns:
        Dict with analysis sections
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    analysis = {}

    unique_creators = observations.get("unique_creators_count", 0)
    verified_count = observations.get("verified_creators_count", 0)
    verified_rate = observations.get("verified_rate_percent", 0)
    top_creators = observations.get("top_creators", [])

    if n_items < 10:
        analysis["primary_insight"] = {
            "text": f"In this scan, we captured {n_items} posts. More data is needed to analyze creator patterns.",
            "cited_fields": ["meta.n_items"],
            "quality": "insufficient_data"
        }
    else:
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, content came from {unique_creators} unique creators.",
            "cited_fields": ["meta.n_items", "observations.unique_creators_count"],
            "quality": "ok"
        }

    # Verification insight
    if unique_creators > 0:
        analysis["verification_insight"] = {
            "text": f"{verified_count} creators ({verified_rate}%) had verified accounts.",
            "cited_fields": [
                "observations.verified_creators_count",
                "observations.verified_rate_percent"
            ],
            "quality": "ok"
        }

    # Top creators insight
    if top_creators and top_creators[0]["post_count"] > 1:
        top = top_creators[0]
        analysis["concentration_insight"] = {
            "text": f"Most frequent creator: {top['handle']} with {top['post_count']} posts.",
            "cited_fields": ["observations.top_creators"],
            "quality": "ok"
        }

    # Limitations
    analysis["limitations_summary"] = {
        "text": "Creator presence does not indicate your preferences, trust, or agreement with their content.",
        "cited_fields": ["limits.epistemic_boundaries"],
        "quality": "ok"
    }

    return analysis


def generate_creators_talk_response(
    bundle: Dict[str, Any],
    question: str
) -> Dict[str, Any]:
    """Generate a Talk-to-Algorithm response for Creators & Voices tab."""
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    unique_creators = observations.get("unique_creators_count", 0)
    verified_count = observations.get("verified_creators_count", 0)
    top_creators = observations.get("top_creators", [])
    creators_in_ads = observations.get("creators_in_ads_count", 0)

    response = {
        "what_we_observed": {
            "intro": f"In this scan of {n_items} posts:",
            "facts": [],
            "cited_fields": []
        },
        "what_it_might_mean": {
            "intro": "This could reflect:",
            "hypotheses": []
        },
        "what_we_cannot_know": {
            "intro": "Important limitations:",
            "limits": [],
            "cited_fields": []
        },
        "what_you_can_try": {
            "intro": "To explore further:",
            "actions": []
        }
    }

    # Observations
    response["what_we_observed"]["facts"].append(
        f"Content came from {unique_creators} unique creators."
    )
    response["what_we_observed"]["facts"].append(
        f"{verified_count} creators had verified accounts."
    )
    if top_creators and top_creators[0]["post_count"] > 1:
        top = top_creators[0]
        response["what_we_observed"]["facts"].append(
            f"Most frequent: {top['handle']} ({top['post_count']} posts)."
        )
    if creators_in_ads > 0:
        response["what_we_observed"]["facts"].append(
            f"{creators_in_ads} creators appeared in ad content."
        )

    response["what_we_observed"]["cited_fields"] = [
        "observations.unique_creators_count",
        "observations.verified_creators_count",
        "observations.top_creators"
    ]

    # Hypotheses
    response["what_it_might_mean"]["hypotheses"] = [
        {
            "label": "Possibility A",
            "text": "The algorithm may be surfacing creators popular in your content areas."
        },
        {
            "label": "Possibility B",
            "text": "Some creators may be boosted due to recent posting activity."
        },
        {
            "label": "Possibility C",
            "text": "Verified accounts may receive different algorithmic treatment."
        }
    ]

    # Limits
    epistemic = limits.get("epistemic_boundaries", [])
    response["what_we_cannot_know"]["limits"] = epistemic[:4] if epistemic else [
        "We cannot infer your relationship with these creators.",
        "We cannot determine why these creators were shown."
    ]
    response["what_we_cannot_know"]["cited_fields"] = ["limits.epistemic_boundaries"]

    # Actions
    response["what_you_can_try"]["actions"] = [
        "Run multiple scans to see if the same creators appear consistently.",
        "Compare creator diversity across different platforms.",
        "Note whether creators in your feed overlap with who you follow.",
        "Check platform settings for content preference controls."
    ]

    return response


def format_creators_talk_response_as_text(response: Dict[str, Any]) -> str:
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
