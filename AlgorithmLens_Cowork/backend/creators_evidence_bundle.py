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
from creator_extraction import extract_creators_from_feed_items
from creator_profile_inference import (
    infer_creator_profile,
    batch_infer_creator_profiles,
    FollowerTier,
    AccountType,
)
from accuracy.schema import (
    EvidenceItem,
    Insight,
    ItemContext,
    MethodReliability,
    ConflictResolution,
)
from accuracy.schema import get_tab_accuracy_contract
from accuracy.method_reliability import get_method_reliability
from accuracy.evidence_chain import enforce_evidence_chain
from accuracy.conflicts import ConflictResolver
from accuracy.critic import Critic


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
    source_type = scan_metadata.get("source_type", "UNKNOWN")

    # Extract creators from feed items (handles MOBILE_VIDEO vs DESKTOP)
    extraction_result = extract_creators_from_feed_items(feed_items, source_type)

    meta = _build_meta(scan_metadata, aggregates, feed_items, extraction_result)
    observations = _build_observations(aggregates, feed_items, extraction_result)
    measurements = _build_measurements(aggregates, feed_items, extraction_result)
    limits = _build_limits(scan_metadata, aggregates, feed_items, extraction_result)

    bundle = {
        "meta": meta,
        "observations": observations,
        "measurements": measurements,
        "limits": limits,
    }

    accuracy_payload = _build_accuracy_section(
        scan_metadata, feed_items, extraction_result
    )
    bundle.update(accuracy_payload)
    return bundle


def _build_meta(
    scan_metadata: Dict[str, Any],
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
    extraction_result: Dict[str, Any]
) -> Dict[str, Any]:
    """Build the meta section with scan context."""
    n_items = len(feed_items)
    created_at = scan_metadata.get("created_at")

    # Build coverage accounting using extraction results
    coverage = _compute_coverage(feed_items, extraction_result)

    return {
        "scan_id": scan_metadata.get("scan_id"),
        "platform": scan_metadata.get("platform"),
        "n_items": n_items,
        "window_start": created_at,
        "window_end": created_at,
        "generated_at": datetime.now().isoformat(),
        "coverage": coverage,
    }


def _compute_coverage(
    feed_items: List[Dict[str, Any]],
    extraction_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compute coverage metadata for the creators evidence bundle.

    Coverage Contract (enforced):
    - n_items_total = n_items_included + n_items_excluded
    - exclusion_reasons counts ONLY truly excluded items (sum == n_items_excluded)
    - quality_flags counts issues among INCLUDED items (does not affect coverage counts)

    For Creators bundle: Items where a creator could NOT be identified are EXCLUDED.
    This includes:
    - DESKTOP items without account metadata
    - MOBILE_VIDEO items where OCR extraction failed

    Returns:
        Coverage dict with standardized fields
    """
    n_items_total = len(feed_items)
    exclusion_reasons: Dict[str, int] = {}
    quality_flags: Dict[str, int] = {}

    # Use extraction results for coverage accounting
    n_extracted = extraction_result.get("summary", {}).get("n_extracted", 0)
    n_med_confidence = extraction_result.get("summary", {}).get("n_med_confidence", 0)

    # Get exclusion counts from extraction
    exc_counts = extraction_result.get("exclusion_counts", {})
    for reason, count in exc_counts.items():
        if count > 0:
            exclusion_reasons[reason] = count

    # Items included = items where creator was extracted
    n_items_included = n_extracted
    n_items_excluded = n_items_total - n_items_included

    # Track MED confidence extractions as a quality flag (not exclusion)
    if n_med_confidence > 0:
        quality_flags["med_confidence_extraction"] = n_med_confidence

    return {
        "n_items_total": n_items_total,
        "n_items_included": n_items_included,
        "n_items_excluded": n_items_excluded,
        "exclusion_reasons": exclusion_reasons,
        "quality_flags": quality_flags,
    }


def _build_observations(
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
    extraction_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Build the observations section with hard facts only.

    Creators tab focuses on: unique creators, verification status,
    follower counts (if available), posting frequency in scan.

    Uses extraction_result to build creator profiles for both DESKTOP (account metadata)
    and MOBILE_VIDEO (OCR-extracted handles).
    """
    observations = {}
    n_items = len(feed_items)
    observations["total_posts_seen"] = n_items

    # Build creator profile map from extraction results
    creator_profiles = {}
    creator_post_counts = Counter()

    extractions = extraction_result.get("extractions", [])

    for i, item in enumerate(feed_items):
        # Get extraction result for this item
        extraction = extractions[i] if i < len(extractions) else {}

        if not extraction.get("extracted"):
            continue  # Skip items without extracted creator

        creator_id = extraction.get("creator_id")
        if not creator_id:
            continue

        creator_post_counts[creator_id] += 1

        if creator_id not in creator_profiles:
            # For DESKTOP with account metadata, use account info
            account = item.get("account") or {}
            creator_profiles[creator_id] = {
                "handle": creator_id,
                "display_name": account.get("display_name"),
                "is_verified": account.get("is_verified", False),
                "follower_count": account.get("follower_count"),
                "post_count_in_scan": 0,
                "is_ad_account": False,
                "extraction_source": extraction.get("source", "unknown"),
                "extraction_confidence": extraction.get("confidence"),
            }

        creator_profiles[creator_id]["post_count_in_scan"] += 1

        # Check if this creator is associated with ads
        if item.get("is_ad", False):
            creator_profiles[creator_id]["is_ad_account"] = True

        # Store bio/description for profile inference
        account = item.get("account") or {}
        if "bio" not in creator_profiles[creator_id]:
            creator_profiles[creator_id]["bio"] = account.get("description") or account.get("bio")

    # Infer creator profiles using profile inference module
    profile_inference_results = {}
    for creator_id, profile in creator_profiles.items():
        inference = infer_creator_profile(
            handle=profile["handle"],
            follower_count=profile.get("follower_count"),
            bio=profile.get("bio"),
            is_verified=profile.get("is_verified", False),
            is_ad_account=profile.get("is_ad_account", False),
        )
        profile_inference_results[creator_id] = inference
        # Add inference to profile
        creator_profiles[creator_id]["inferred_tier"] = inference["follower_tier"]
        creator_profiles[creator_id]["inferred_type"] = inference["account_type"]
        creator_profiles[creator_id]["is_commercial"] = inference["is_commercial"]

    # Populate creator stats (only for extracted creators)
    observations["unique_creators_count"] = len(creator_profiles)

    # Verification breakdown (only meaningful for DESKTOP where we have this data)
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
            "extraction_source": c.get("extraction_source"),
            # Inferred profile data
            "inferred_tier": c.get("inferred_tier"),
            "inferred_type": c.get("inferred_type"),
            "is_commercial": c.get("is_commercial", False),
        }
        for c in top_creators
    ]

    # Creators appearing in ads vs organic
    ad_creators = [h for h, p in creator_profiles.items() if p["is_ad_account"]]
    observations["creators_in_ads_count"] = len(ad_creators)

    # Track extraction stats
    summary = extraction_result.get("summary", {})
    observations["extraction_summary"] = {
        "total_items": summary.get("total_items", n_items),
        "items_with_creator": summary.get("n_extracted", 0),
        "high_confidence_extractions": summary.get("n_high_confidence", 0),
        "med_confidence_extractions": summary.get("n_med_confidence", 0),
    }

    # Profile inference summary (inferred account types and follower tiers)
    if creator_profiles:
        tier_distribution = {}
        type_distribution = {}
        n_commercial = 0

        for profile in creator_profiles.values():
            tier = profile.get("inferred_tier", "unknown")
            atype = profile.get("inferred_type", "unknown")
            tier_distribution[tier] = tier_distribution.get(tier, 0) + 1
            type_distribution[atype] = type_distribution.get(atype, 0) + 1
            if profile.get("is_commercial"):
                n_commercial += 1

        observations["profile_inference_summary"] = {
            "follower_tier_distribution": {k: v for k, v in tier_distribution.items() if v > 0},
            "account_type_distribution": {k: v for k, v in type_distribution.items() if v > 0},
            "commercial_accounts_count": n_commercial,
            "commercial_rate_percent": round(n_commercial / len(creator_profiles) * 100, 1) if creator_profiles else 0,
        }

    return observations


def _build_measurements(
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
    extraction_result: Dict[str, Any]
) -> Dict[str, Any]:
    """Build the measurements section with derived metrics."""
    measurements = {}
    n_items = len(feed_items)

    # Creator concentration metric - use extraction results
    extractions = extraction_result.get("extractions", [])
    creator_counts = Counter()

    for extraction in extractions:
        if extraction.get("extracted"):
            creator_id = extraction.get("creator_id")
            if creator_id:
                creator_counts[creator_id] += 1

    unique_creators = len(creator_counts)
    n_items_with_creator = sum(creator_counts.values())

    if unique_creators > 0 and n_items_with_creator > 0:
        # Concentration: how much content comes from top creators
        sorted_counts = sorted(creator_counts.values(), reverse=True)
        top1_share = sorted_counts[0] / n_items_with_creator if sorted_counts else 0
        top5_share = sum(sorted_counts[:5]) / n_items_with_creator if len(sorted_counts) >= 5 else 1.0

        measurements["creator_concentration"] = {
            "value": {
                "top1_share": round(top1_share, 2),
                "top5_share": round(top5_share, 2),
                "unique_count": unique_creators,
            },
            "method": "post_count_per_creator",
            "quality": "ok" if n_items_with_creator >= 10 else "low_sample",
            "notes": f"Top creator has {sorted_counts[0]} posts ({round(top1_share*100)}% of identified content)."
        }

    # Voice diversity (simple metric) - based on items with identified creators
    if n_items_with_creator > 0:
        diversity_ratio = unique_creators / n_items_with_creator
        measurements["voice_diversity"] = {
            "value": round(diversity_ratio, 2),
            "method": "unique_creators / items_with_creator",
            "quality": "ok" if n_items_with_creator >= 10 else "low_sample",
            "notes": "1.0 = all unique creators, lower = more repetition."
        }

    return measurements


def _build_limits(
    scan_metadata: Dict[str, Any],
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
    extraction_result: Dict[str, Any]
) -> Dict[str, Any]:
    """Build the limits section."""
    limits = {}
    n_items = len(feed_items)
    source_type = scan_metadata.get("source_type", "UNKNOWN")

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

    # Detection limitations - vary by source type
    if source_type == "MOBILE_VIDEO":
        # Get extraction stats
        summary = extraction_result.get("summary", {})
        extraction_rate = summary.get("extraction_rate_percent", 0)

        limits["detection_limitations"] = [
            "Creator identification uses OCR-based @handle extraction from video frames.",
            "OCR accuracy varies with video quality, font size, and screen contrast.",
            f"Creators were identified for {extraction_rate}% of items in this scan.",
            "Some creators may not be identified if @handles are not visible in frames.",
            "Verification status is not available for OCR-extracted creators.",
        ]
    else:
        limits["detection_limitations"] = [
            "Creator identification relies on account metadata which may be incomplete.",
            "Verification status depends on platform data availability.",
            "Some creators may use multiple accounts not detected here.",
        ]

    return limits


def _build_accuracy_section(
    scan_metadata: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
    extraction_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Additive accuracy scaffolding for Creators tab.
    """
    contract = get_tab_accuracy_contract("creators")
    platform = scan_metadata.get("platform")
    modality = scan_metadata.get("source_type", "UNKNOWN")

    evidence_items: List[EvidenceItem] = []
    evidence_ids: List[str] = []

    def _make_reliability(method: str) -> MethodReliability:
        score = get_method_reliability(method) or 0.0
        return MethodReliability(
            method=method,
            base_reliability=score,
            effective_reliability=score,
        )

    extractions = extraction_result.get("extractions", [])

    for idx, item in enumerate(feed_items):
        extraction = extractions[idx] if idx < len(extractions) else {}
        if not extraction.get("extracted"):
            continue

        creator_id = extraction.get("creator_id") or f"creator-{idx}"
        ev_id = f"creator-{creator_id}"
        item_context = ItemContext(
            item_index=item.get("position_in_feed", idx),
            platform=platform,
            modality=modality,
            item_type=item.get("content_type"),
            platform_id=creator_id,
        )

        evidence_items.append(
            EvidenceItem(
                evidence_id=ev_id,
                source_item_index=item_context.item_index,
                signal_type="creator_handle",
                signal_subtype=creator_id,
                detection_method=extraction.get("source", "CREATOR_EXTRACTION"),
                method_reliability=_make_reliability("NER_EXTRACTION"),
                source="creator_extraction",
                item_context=item_context,
            )
        )
        evidence_ids.append(ev_id)

        # Optional self-description evidence when available
        account = item.get("account") or {}
        description = account.get("description") or extraction.get("description")
        if description:
            sd_id = f"{ev_id}-self"
            evidence_items.append(
                EvidenceItem(
                    evidence_id=sd_id,
                    source_item_index=item_context.item_index,
                    signal_type="creator_self_description",
                    signal_subtype=creator_id,
                    detection_method="METADATA_FIELD",
                    method_reliability=_make_reliability("METADATA_FIELD"),
                    source="creator_extraction",
                    text_snippet=description,
                    item_context=item_context,
                )
            )
            evidence_ids.append(sd_id)

        # Observed content evidence (ads vs organic)
        observed_id = f"{ev_id}-observed"
        evidence_items.append(
            EvidenceItem(
                evidence_id=observed_id,
                source_item_index=item_context.item_index,
                signal_type="observed_content",
                signal_subtype=creator_id,
                detection_method="HEURISTIC_RULE",
                method_reliability=_make_reliability("HEURISTIC_RULE"),
                source="content_observation",
                pattern_category="ad_account" if item.get("is_ad", False) else "organic",
                item_context=item_context,
            )
        )
        evidence_ids.append(observed_id)

    if len(evidence_ids) >= contract.min_evidence_for_final:
        status = "FINAL"
    elif evidence_ids:
        status = "PRELIMINARY"
    else:
        status = "ABSTAIN"

    creator_insight = Insight(
        insight_id="creators-extracted",
        claim_type="creator_presence",
        claim_text="Creators identified in this scan.",
        claim_status=status,
        evidence_ids=evidence_ids,
        abstention_flag=status == "ABSTAIN",
        abstention_reason=None if status != "ABSTAIN" else "No reliable creator extraction",
        preliminary_upgrade_path="Extract more creators or increase reliability to upgrade",
    )

    resolver = ConflictResolver()
    conflict_resolutions, conflict_metrics = resolver.process(
        evidence_items, tab_name="creators"
    )

    evidence_map = {ev.evidence_id: ev for ev in evidence_items}
    for cid, resolution in conflict_resolutions.items():
        if resolution.winning_evidence_id:
            winner = evidence_map.get(resolution.winning_evidence_id)
            if winner:
                winner.conflict_resolution = ConflictResolution(
                    resolution_type=resolution.resolution_type,
                    winning_evidence_id=resolution.winning_evidence_id,
                    resolution_rationale=resolution.rationale,
                    confidence_penalty=resolution.confidence_penalty,
                )
        for losing_id in resolution.losing_evidence_ids:
            loser = evidence_map.get(losing_id)
            if loser and resolution.winning_evidence_id:
                if resolution.winning_evidence_id not in loser.conflicts_with:
                    loser.conflicts_with.append(resolution.winning_evidence_id)

    enforced_insights, ec_metrics = enforce_evidence_chain(
        [creator_insight],
        evidence_items,
        tab_name="creators",
        orphan_threshold=0.20,
    )

    critic = Critic()
    critic_insights, critic_metrics = critic.evaluate(
        "creators", enforced_insights, evidence_items, conflict_metrics=conflict_metrics
    )

    return {
        "evidence_items": {
            ev.evidence_id: ev.model_dump(exclude_none=True) for ev in evidence_items
        },
        "insights": [ins.model_dump(exclude_none=True) for ins in critic_insights],
        "evidence_chain_metrics": ec_metrics.model_dump(exclude_none=True),
        "conflict_resolutions": {
            cid: rec.model_dump(exclude_none=True) for cid, rec in conflict_resolutions.items()
        },
        "conflict_metrics": conflict_metrics.model_dump(exclude_none=True),
        "critic_metrics": critic_metrics.model_dump(exclude_none=True),
    }


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
    coverage = meta.get("coverage", {})
    n_included = coverage.get("n_items_included", 0)
    analysis = {}

    unique_creators = observations.get("unique_creators_count", 0)
    verified_count = observations.get("verified_creators_count", 0)
    verified_rate = observations.get("verified_rate_percent", 0)
    top_creators = observations.get("top_creators", [])
    extraction_summary = observations.get("extraction_summary", {})

    if n_items < 10:
        analysis["primary_insight"] = {
            "text": f"In this scan, we captured {n_items} posts. More data is needed to analyze creator patterns.",
            "cited_fields": ["meta.n_items"],
            "quality": "insufficient_data"
        }
    elif n_included == 0:
        # No creators could be identified
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, no creator handles could be identified.",
            "cited_fields": ["meta.n_items", "meta.coverage.n_items_included"],
            "quality": "no_data"
        }
    elif n_included < n_items:
        # Partial coverage
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, we identified {unique_creators} unique creators from {n_included} items with extractable handles.",
            "cited_fields": ["meta.n_items", "meta.coverage.n_items_included", "observations.unique_creators_count"],
            "quality": "partial_coverage"
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
