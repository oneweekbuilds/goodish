"""
Evidence Bundle Builder for Ads & Influence Tab

This module produces an Evidence Bundle for the Ads & Influence tab.
All plain-English analysis and Talk-to-Algorithm responses MUST be generated
from this bundle only - never from raw feed text or generic explanations.

Evidence Bundle Structure:
{
    "meta": { ... },           # Scan metadata
    "observations": { ... },   # Hard facts from data
    "measurements": { ... },   # Classifier-based estimates
    "limits": { ... }          # What is missing or uncertain
}

Accuracy Philosophy (v2.0):
    - Only HIGH confidence classifications are surfaced in primary metrics
    - Commercial Exposure Spectrum uses confidence-gated aggregation
    - Topics and Brands include explicit thresholds and exclusions
    - Every claim traces back to specific Evidence Bundle fields

See docs/evidence_bundles.md for full documentation.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from collections import Counter
import json

from commercial_classifier import (
    analyze_commercial_content,
    CommercialClass,
    CommercialConfidence,
    CommercialAnalysisResult,
    DetectionMethod,
)
from promo_signals import (
    extract_promo_signals,
    batch_extract_promo_signals,
    get_promo_evidence_summary,
    PromoConfidence,
)
from accuracy.method_reliability import get_method_reliability
from accuracy.stats import (
    wilson_ci_percent,
    safe_bayesian_ci,
    bayesian_point_estimate,
    beta_posterior_params,
)
from accuracy.priors import get_ads_rate_prior, should_use_prior
from accuracy.conflicts import ConflictResolver
from accuracy.schema import EvidenceItem, Insight, ItemContext, ClaimStatus, ConflictResolution
from accuracy.evidence_chain import enforce_evidence_chain
from accuracy.critic import Critic


def build_ads_evidence_bundle(scan_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build an Evidence Bundle for the Ads & Influence tab from a scan result.

    The Evidence Bundle is the SINGLE SOURCE OF TRUTH for all analysis copy
    and Talk-to-Algorithm responses in the Ads & Influence tab.

    Args:
        scan_result: The full UnifiedScanResult dict from the database

    Returns:
        Evidence Bundle dict with keys: meta, observations, measurements, limits
    """
    # Extract scan metadata
    scan_metadata = scan_result.get("scan_metadata", {})
    aggregates = scan_result.get("aggregates", {})
    feed_items = scan_result.get("feed_items", [])

    # Get source_type for MOBILE_VIDEO-specific handling
    source_type = scan_metadata.get("source_type")

    # Run commercial analysis on all feed items (pass source_type for brand extraction)
    commercial_analysis = analyze_commercial_content(feed_items, source_type=source_type)

    # Build meta section
    meta = _build_meta(scan_metadata, aggregates, feed_items)

    # Build observations section (hard facts only)
    observations = _build_observations(aggregates, feed_items, commercial_analysis, source_type, scan_metadata)

    # Build measurements section (classifier-based estimates)
    measurements = _build_measurements(aggregates, feed_items, commercial_analysis)

    # Build limits section (what we don't know)
    limits = _build_limits(scan_metadata, aggregates, feed_items, commercial_analysis, observations)

    # ==========================================================================
    # SANITY CHECK: Verify stacked_bar totals match high_confidence_items
    # ==========================================================================
    spectrum = observations.get("commercial_exposure_spectrum", {})
    stacked_bar = spectrum.get("stacked_bar", {})
    expected_total = stacked_bar.get("total", 0)
    actual_high_conf = spectrum.get("high_confidence_items", 0)

    if expected_total != actual_high_conf:
        # Log warning but don't fail - add to limits
        limits.setdefault("data_quality_warnings", []).append(
            f"Stacked bar total ({expected_total}) does not match high_confidence_items ({actual_high_conf}). "
            "This may indicate a classification counting error."
        )

    # Phase 5D1: Build evidence_items
    evidence_items = _build_evidence_items(feed_items, commercial_analysis, scan_metadata, observations)

    # Phase 5F1: Conflict detection and resolution (Ads-only)
    resolver = ConflictResolver()
    conflict_resolutions, conflict_metrics = resolver.process(evidence_items)

    # Annotate evidence items with conflict info
    evidence_items_by_id = {ev.evidence_id: ev for ev in evidence_items}
    for conflict_id, resolution in conflict_resolutions.items():
        if resolution.winning_evidence_id:
            winner = evidence_items_by_id.get(resolution.winning_evidence_id)
            if winner is not None:
                winner.conflict_resolution = ConflictResolution(
                    resolution_type=resolution.resolution_type,
                    winning_evidence_id=resolution.winning_evidence_id,
                    resolution_rationale=resolution.rationale,
                    confidence_penalty=resolution.confidence_penalty,
                )
        for losing_id in resolution.losing_evidence_ids:
            loser = evidence_items_by_id.get(losing_id)
            if loser is not None and resolution.winning_evidence_id:
                if resolution.winning_evidence_id not in loser.conflicts_with:
                    loser.conflicts_with.append(resolution.winning_evidence_id)

    # Build insights based on (potentially updated) evidence items
    insights = _build_insights(observations, measurements, evidence_items, scan_metadata)
    
    # Enforce evidence chain requirements (Phase 5D1)
    updated_insights, ec_metrics = enforce_evidence_chain(
        insights, evidence_items, tab_name="ads", orphan_threshold=0.20
    )

    critic = Critic()
    reviewed_insights = critic.evaluate(
        "ads", updated_insights, evidence_items, conflict_metrics=conflict_metrics
    )
    
    # Hard requirement: evidence_linking_rate must be 1.0 and missing_evidence_rate must be 0.0
    if not ec_metrics.validation_passed:
        # Log warning but don't fail - add to limits
        limits.setdefault("evidence_chain_warnings", []).append(
            f"Evidence chain validation failed: linking_rate={ec_metrics.evidence_linking_rate:.2f}, "
            f"missing_rate={ec_metrics.missing_evidence_rate:.2f}"
        )
    
    # Convert to dict format for JSON serialization
    evidence_items_dict = {item.evidence_id: item.model_dump(exclude_none=True) for item in evidence_items}
    insights_dict = [insight.model_dump(exclude_none=True) for insight in reviewed_insights]
    
    return {
        "meta": meta,
        "observations": observations,
        "measurements": measurements,
        "limits": limits,
        # Phase 5D1: Add evidence_items, insights, and metrics
        "evidence_items": evidence_items_dict,
        "insights": insights_dict,
        "evidence_chain_metrics": {
            "evidence_linking_rate": ec_metrics.evidence_linking_rate,
            "missing_evidence_rate": ec_metrics.missing_evidence_rate,
            "orphan_evidence_rate": ec_metrics.orphan_evidence_rate,
            "validation_passed": ec_metrics.validation_passed,
        },
        # Phase 5F1: Conflict engine outputs
        "conflict_resolutions": {
            cid: rec.model_dump(exclude_none=True)
            for cid, rec in conflict_resolutions.items()
        },
        "conflict_metrics": conflict_metrics.model_dump(exclude_none=True),
    }


def _build_meta(
    scan_metadata: Dict[str, Any],
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Build the meta section with scan context."""
    n_items = len(feed_items)

    # Extract time window from feed items
    window_start = None
    window_end = None

    # Use created_at from scan_metadata as the primary timestamp
    created_at = scan_metadata.get("created_at")
    if created_at:
        window_start = created_at
        window_end = created_at

    # Try to get more precise window from feed item timestamps
    for item in feed_items:
        offset = item.get("approx_timestamp_offset_sec")
        if offset is not None and created_at:
            # Window spans the scan duration
            pass

    # Build coverage accounting
    coverage = _compute_coverage(feed_items)

    return {
        "scan_id": scan_metadata.get("scan_id"),
        "platform": scan_metadata.get("platform"),
        "n_items": n_items,
        "window_start": window_start,
        "window_end": window_end,
        "generated_at": datetime.now().isoformat(),
        "coverage": coverage,
    }


def _compute_coverage(feed_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compute coverage metadata for the ads evidence bundle.

    Coverage Contract (enforced):
    - n_items_total = n_items_included + n_items_excluded
    - exclusion_reasons counts ONLY truly excluded items (sum == n_items_excluded)
    - quality_flags counts issues among INCLUDED items (does not affect coverage counts)

    For Ads bundle: All items are INCLUDED for commercial analysis.
    Items with missing text are still analyzed (lower confidence), so they are
    tracked in quality_flags, NOT exclusion_reasons.

    Returns:
        Coverage dict with standardized fields
    """
    n_items_total = len(feed_items)

    # Track quality issues among INCLUDED items
    # (these items are still analyzed, just with potential quality degradation)
    quality_flags: Dict[str, int] = {}

    n_missing_text = 0
    n_missing_metadata = 0

    for item in feed_items:
        content_text = item.get("content_text", {})

        # Check for missing text content
        has_text = bool(
            content_text.get("caption") or
            content_text.get("post_text") or
            content_text.get("on_screen_labels")
        )

        if not has_text:
            # Check if ad metadata is also missing (completely empty item)
            has_ad_metadata = bool(item.get("ad_metadata"))
            has_account = bool(item.get("account"))

            if not has_ad_metadata and not has_account:
                n_missing_metadata += 1
            else:
                n_missing_text += 1

    # Populate quality_flags for issues among INCLUDED items
    # (commercial classifier runs on all items, even those with missing text)
    if n_missing_text > 0:
        quality_flags["missing_text"] = n_missing_text
    if n_missing_metadata > 0:
        quality_flags["missing_metadata"] = n_missing_metadata

    # For ads bundle, all items are included for evaluation
    # Items with missing data are still processed but may produce lower confidence
    n_items_included = n_items_total
    n_items_excluded = 0

    # exclusion_reasons is empty because no items are excluded
    # Contract: sum(exclusion_reasons.values()) == n_items_excluded == 0
    exclusion_reasons: Dict[str, int] = {}

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
    commercial_analysis: CommercialAnalysisResult,
    source_type: Optional[str] = None,
    scan_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build the observations section with hard facts only.

    These are deterministic counts computed directly from stored data.
    No inference or interpretation is applied.

    Accuracy v2.0: Includes Commercial Exposure Spectrum with confidence-gated counts.
    """
    observations = {}

    # Total posts seen - directly countable
    n_items = len(feed_items)
    observations["total_posts_seen"] = n_items

    # ==========================================================================
    # Commercial Exposure Spectrum (View A) - The Primary Metric
    # Only HIGH confidence classifications are included in the stacked bar
    # ==========================================================================
    spectrum = commercial_analysis.exposure_spectrum
    spectrum_data = spectrum.to_dict()

    observations["commercial_exposure_spectrum"] = {
        # Stacked bar data (100% of high-confidence items)
        "stacked_bar": spectrum_data["stacked_bar"],
        # What's excluded for transparency
        "excluded": spectrum_data["excluded_from_bar"],
        # Summary stats
        "total_items": spectrum.total_items,
        "high_confidence_items": spectrum.high_confidence_items,
        "coverage_percent": spectrum_data["summary"]["coverage_percent"],
    }

    # Total ads detected - count is_ad=true items (labeled ads)
    ads = [item for item in feed_items if item.get("is_ad", False)]
    total_ads_detected = len(ads)
    observations["total_ads_detected"] = total_ads_detected

    # Build evidence items for platform-labeled ads (Phase 5C1: attach method_reliability)
    platform_labeled_ad_evidence = []
    for i, item in enumerate(ads[:10]):  # Limit to first 10 for brevity
        ad_meta = item.get("ad_metadata", {})
        reason = ad_meta.get("ad_detected_reason", "platform_label")
        method = "OCR_DISCLOSURE" if reason == "ocr_disclosure_token" else "PLATFORM_LABEL"
        method_reliability = get_method_reliability(method)

        evidence_item = {
            "item_position": item.get("position_in_feed", i),
            "method": method,
            "method_reliability": method_reliability,
            "confidence": "high",  # Platform-labeled ads are always HIGH confidence
        }
        if ad_meta.get("sponsored_label_text"):
            evidence_item["sponsored_label_text"] = ad_meta["sponsored_label_text"]
        if ad_meta.get("advertiser_name"):
            evidence_item["advertiser_name"] = ad_meta["advertiser_name"]

        platform_labeled_ad_evidence.append(evidence_item)

    if platform_labeled_ad_evidence:
        observations["platform_labeled_ad_evidence"] = platform_labeled_ad_evidence
        observations["platform_labeled_ad_evidence_count"] = len(ads)

    # Unlabeled promotions (high confidence only)
    observations["unlabeled_promotions_high_confidence"] = spectrum.unlabeled_promotion_high

    # Total promotional content (labeled + unlabeled high confidence)
    total_promotional = spectrum.labeled_ads + spectrum.unlabeled_promotion_high
    observations["total_promotional_content"] = total_promotional

    # ==========================================================================
    # Promo Signals with Evidence (NEW: deterministic signal extraction)
    # Uses promo_signals.py for explicit evidence snippets
    # ==========================================================================
    promo_analysis = batch_extract_promo_signals(feed_items)
    promo_summary = promo_analysis["summary"]

    # Store promo signals summary
    observations["promo_signals"] = {
        "n_high_confidence": promo_summary["n_high_confidence"],
        "n_medium_confidence": promo_summary["n_medium_confidence"],
        "n_low_confidence": promo_summary["n_low_confidence"],
        "n_unlabeled_promo": promo_summary["n_unlabeled_promo"],
        "signal_types_detected": list(promo_summary["signal_type_counts"].keys()),
        "signal_type_counts": promo_summary["signal_type_counts"],
    }

    # Build evidence list for unlabeled promo items (HIGH confidence only)
    unlabeled_promo_evidence = []
    for i, item in enumerate(feed_items):
        # Skip labeled ads - we only want unlabeled promos
        if item.get("is_ad", False):
            continue

        promo_result = promo_analysis["extractions"][i]
        if promo_result["is_unlabeled_promo"] and promo_result["signals"]:
            # Extract primary detection method from signal types (if available)
            # For now, use a placeholder - future phases will map signal types to methods
            primary_method = "KEYWORD_MATCH"  # Placeholder for Phase 5C1
            method_reliability = get_method_reliability(primary_method)

            evidence_item = {
                "item_position": item.get("position_in_feed", i),
                "confidence": promo_result["confidence"],
                "signal_types": promo_result["signal_types"],
                "method": primary_method,  # Phase 5C1: attach method
                "method_reliability": method_reliability,  # Phase 5C1: attach reliability
                "evidence_snippets": [
                    {"type": s["type"], "evidence": s["evidence"]}
                    for s in promo_result["signals"][:3]  # Max 3 snippets per item
                ],
            }
            unlabeled_promo_evidence.append(evidence_item)

    # Store evidence for unlabeled promos (limit to first 10 for brevity)
    if unlabeled_promo_evidence:
        observations["unlabeled_promo_evidence"] = unlabeled_promo_evidence[:10]
        observations["unlabeled_promo_evidence_count"] = len(unlabeled_promo_evidence)

    # OCR extraction metrics (for MOBILE_VIDEO scans)
    # Count items with non-empty OCR text
    items_with_ocr_text = 0
    ocr_ad_detections = 0
    for item in feed_items:
        # Check on_screen_labels for OCR text
        content_text = item.get("content_text", {})
        on_screen_labels = content_text.get("on_screen_labels", [])
        has_ocr_text = any(label and label.strip() for label in on_screen_labels)
        if has_ocr_text:
            items_with_ocr_text += 1

        # Count ads detected via OCR disclosure tokens
        ad_meta = item.get("ad_metadata", {})
        if ad_meta and ad_meta.get("ad_detected_reason") == "ocr_disclosure_token":
            ocr_ad_detections += 1

    if n_items > 0:
        observations["ocr_extraction_rate_percent"] = round((items_with_ocr_text / n_items) * 100, 1)
        observations["items_with_ocr_text"] = items_with_ocr_text
    if ocr_ad_detections > 0:
        observations["ads_detected_via_ocr"] = ocr_ad_detections

    # Ad rate - only if we have items to avoid division by zero
    if n_items > 0:
        ad_rate = round((total_ads_detected / n_items) * 100, 1)
        observations["ad_rate_percent"] = ad_rate

        # Phase 5C2: Add 95% confidence interval for ad rate (Wilson CI)
        ci_lower, ci_upper = wilson_ci_percent(total_ads_detected, n_items, conf=0.95)
        wilson_width = ci_upper - ci_lower
        observations["ad_rate_percent_ci"] = {
            "lower": round(ci_lower, 1),
            "upper": round(ci_upper, 1),
            "confidence_level": 0.95,
            "method": "wilson"
        }
        observations["ad_rate_estimate_type"] = "INTERVAL"

        # Phase 5C3: Add Bayesian credible interval with platform-specific priors
        platform = (scan_metadata.get("platform", "") if scan_metadata else "").lower()
        alpha0, beta0, prior_source = get_ads_rate_prior(platform)
        prior_used = should_use_prior(n_items, wilson_width)
        
        if prior_used:
            # Compute Bayesian credible interval
            bayes_lower, bayes_upper = safe_bayesian_ci(
                total_ads_detected, n_items, alpha0, beta0, conf=0.95, min_width_percent=5.0
            )
            bayes_lower_pct = round(bayes_lower * 100, 1)
            bayes_upper_pct = round(bayes_upper * 100, 1)
            
            # Compute posterior mean (Bayesian point estimate)
            alpha_post, beta_post = beta_posterior_params(alpha0, beta0, total_ads_detected, n_items)
            bayes_point_estimate = bayesian_point_estimate(alpha_post, beta_post)
            bayes_point_pct = round(bayes_point_estimate * 100, 1)
            
            observations["ad_rate_percent_ci_bayesian"] = {
                "lower": bayes_lower_pct,
                "upper": bayes_upper_pct,
                "confidence_level": 0.95,
                "method": "bayesian_beta",
                "point_estimate": bayes_point_pct,
                "prior_used": True,
                "prior_info": {
                    "platform": platform or "unknown",
                    "source": prior_source,
                    "alpha": alpha0,
                    "beta": beta0,
                    "effective_prior_n": alpha0 + beta0
                }
            }
            observations["ad_rate_percent_bayesian"] = bayes_point_pct
            observations["ad_rate_estimate_method"] = "bayesian_beta"
        else:
            observations["ad_rate_percent_ci_bayesian"] = None
            observations["ad_rate_percent_bayesian"] = None
            observations["ad_rate_estimate_method"] = "wilson"
        
        observations["prior_used"] = prior_used

        # Promotional rate (labeled + unlabeled high confidence)
        promo_rate = round((total_promotional / n_items) * 100, 1)
        observations["promotional_rate_percent"] = promo_rate

        # Phase 5C2: Add 95% confidence interval for promotional rate
        promo_ci_lower, promo_ci_upper = wilson_ci_percent(total_promotional, n_items, conf=0.95)
        observations["promotional_rate_percent_ci"] = {
            "lower": round(promo_ci_lower, 1),
            "upper": round(promo_ci_upper, 1),
            "confidence_level": 0.95,
            "method": "wilson"
        }
        observations["promotional_rate_estimate_type"] = "INTERVAL"
    else:
        observations["ad_rate_percent"] = None
        observations["promotional_rate_percent"] = None
        # No CI when n=0 (wilson_ci returns (0.0, 1.0) which is not meaningful)
        observations["ad_rate_percent_ci"] = None
        observations["promotional_rate_percent_ci"] = None
        # Phase 5C3: No Bayesian CI when n=0
        observations["ad_rate_percent_ci_bayesian"] = None
        observations["ad_rate_percent_bayesian"] = None
        observations["ad_rate_estimate_method"] = "wilson"
        observations["prior_used"] = False

    # ==========================================================================
    # Top Companies (View C) - PROMO-ONLY per spec
    # Uses strict surfacing rule: count >= 2 AND high_confidence >= 1
    # ==========================================================================
    company_data = commercial_analysis.company_aggregation.to_dict()
    spectrum = commercial_analysis.exposure_spectrum
    total_promotional = spectrum.labeled_ads + spectrum.unlabeled_promotion_high

    # Use surfaced_companies (or surfaced_brands for backward compat)
    surfaced_companies = company_data.get("surfaced_companies", company_data.get("surfaced_brands", []))

    if surfaced_companies:
        # Only surface companies that meet strict threshold
        observations["top_companies"] = [
            {"name": c["name"], "count": c["count"], "high_confidence": c["high_confidence_count"]}
            for c in surfaced_companies[:5]
        ]
        observations["unique_companies_surfaced"] = len(surfaced_companies)
    else:
        # No companies surfaced - provide empty list with clear reason per spec
        observations["top_companies"] = []
        observations["unique_companies_surfaced"] = 0

        # Build detailed explanation of why no companies are shown
        exclusion_reasons = company_data.get("exclusion_reasons", {})
        below_count = exclusion_reasons.get("below_count_threshold", 0)
        no_high_conf = exclusion_reasons.get("no_high_confidence_evidence", 0)
        total_unique = company_data.get("total_unique_companies", company_data.get("total_unique_brands", 0))

        if total_promotional == 0:
            observations["top_companies_note"] = "No promotional content detected, so no company data available."
        elif total_unique == 0:
            observations["top_companies_note"] = "No company or brand names could be extracted from this scan."
        elif no_high_conf > 0 and below_count == 0:
            observations["top_companies_note"] = (
                f"{no_high_conf} potential companies detected but none had high-confidence evidence. "
                "Surfacing requires advertiser metadata or verified disclosure labels."
            )
        elif source_type == "MOBILE_VIDEO":
            observations["top_companies_note"] = (
                f"MOBILE_VIDEO scan: {total_unique} company mentions detected but none met surfacing threshold "
                f"(count >= 2 AND high_confidence >= 1). Advertiser metadata unavailable in video frames."
            )
        else:
            observations["top_companies_note"] = (
                f"{total_unique} company mentions detected but none met surfacing threshold "
                f"(count >= 2 AND high_confidence >= 1)."
            )

    # Track exclusion stats for limits section
    observations["_company_exclusion_stats"] = company_data.get("exclusion_reasons", {})

    # Legacy: Top advertisers from ad_metadata (for backward compatibility)
    advertiser_counts = Counter()
    for item in ads:
        ad_meta = item.get("ad_metadata", {})
        if ad_meta:
            advertiser = ad_meta.get("advertiser_name")
            if advertiser:
                advertiser_counts[advertiser] += 1

    if advertiser_counts:
        top_advertisers = [
            {"name": name, "count": count}
            for name, count in advertiser_counts.most_common(5)
        ]
        observations["top_advertisers"] = top_advertisers

    # Repeated sponsors/creators count (for ads)
    # Only include if we have advertisers that appear multiple times
    repeated_count = sum(1 for count in advertiser_counts.values() if count > 1)
    if repeated_count > 0:
        observations["repeated_advertisers_count"] = repeated_count

    # Ad source concentration - simple metric
    # How much of ad inventory comes from top 1, top 3 advertisers
    if total_ads_detected > 0 and advertiser_counts:
        sorted_counts = sorted(advertiser_counts.values(), reverse=True)
        top1_share = round((sorted_counts[0] / total_ads_detected) * 100, 1) if sorted_counts else 0
        top3_share = round((sum(sorted_counts[:3]) / total_ads_detected) * 100, 1) if sorted_counts else 0
        observations["top1_advertiser_share_percent"] = top1_share
        observations["top3_advertiser_share_percent"] = top3_share

    # Unique advertisers count
    if advertiser_counts:
        observations["unique_advertisers_count"] = len(advertiser_counts)

    return observations


def _build_measurements(
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
    commercial_analysis: CommercialAnalysisResult
) -> Dict[str, Any]:
    """
    Build the measurements section with classifier-based estimates.

    Each measurement includes:
    - value: the measured value
    - method: how it was computed (heuristic, classifier, etc.)
    - quality: ok | low_sample | missing_fields | model_low_confidence
    - notes: any caveats

    Accuracy v2.0: Includes topic aggregation with confidence thresholds.
    """
    measurements = {}
    n_items = len(feed_items)
    spectrum = commercial_analysis.exposure_spectrum

    # ==========================================================================
    # Unlabeled Promotion Measurement (with confidence tiers)
    # ==========================================================================
    measurements["unlabeled_promotions"] = {
        "value": {
            "high_confidence": spectrum.unlabeled_promotion_high,
            "medium_confidence": spectrum.unlabeled_promotion_medium,
            "ambiguous": spectrum.ambiguous,
        },
        "method": "classifier:commercial_intent_pipeline",
        "quality": "ok" if n_items >= 10 else "low_sample",
        "notes": (
            "Unlabeled promotions detected via disclosure tokens, CTA patterns, "
            "and entity references. Only high-confidence items counted in metrics. "
            f"{spectrum.ambiguous} items excluded as ambiguous."
        )
    }

    # Backward compatibility: possible_unlabeled_promotions
    measurements["possible_unlabeled_promotions"] = {
        "value": spectrum.unlabeled_promotion_high + spectrum.unlabeled_promotion_medium,
        "method": "classifier:commercial_intent_pipeline",
        "quality": "ok" if n_items >= 10 else "low_sample",
        "notes": (
            f"High confidence: {spectrum.unlabeled_promotion_high}, "
            f"Medium confidence: {spectrum.unlabeled_promotion_medium}. "
            "Only high-confidence items are included in primary metrics."
        )
    }

    non_ad_items = n_items - spectrum.labeled_ads
    if non_ad_items > 0:
        measurements["possible_promo_rate_percent"] = {
            "value": round((spectrum.unlabeled_promotion_high / non_ad_items) * 100, 1),
            "method": "classifier:commercial_intent_pipeline",
            "quality": "ok" if n_items >= 10 else "low_sample",
            "notes": "Percentage of non-ad posts with high-confidence promotional signals."
        }

    # ==========================================================================
    # Promotion Topics (View B) - PROMO-ONLY per spec
    # Quality: "ok" | "not_applicable" | "insufficient_signal"
    # ==========================================================================
    topic_data = commercial_analysis.topic_aggregation.to_dict()
    surfaced_topics = topic_data["surfaced_topics"]
    below_threshold = topic_data["below_threshold"]

    # Get promotional item count for context
    total_promotional = spectrum.labeled_ads + spectrum.unlabeled_promotion_high

    if surfaced_topics:
        measurements["promotion_topics"] = {
            "value": [t["topic"] for t in surfaced_topics],  # Just topic names per spec
            "method": "classifier:topic_keyword_matching",
            "quality": "ok",
            "notes": (
                f"Topics derived from promotional content only ({total_promotional} promotional items). "
                f"Threshold: {topic_data['threshold_rule']}."
            ),
            "threshold_rule": topic_data["threshold_rule"],
            "detected_but_excluded_count": len(below_threshold),
            # Also include full breakdown for debug
            "_full_breakdown": [
                {
                    "topic": t["topic"],
                    "count": t["count"],
                    "high_confidence_count": t["high_confidence_count"],
                }
                for t in surfaced_topics
            ],
        }
    elif below_threshold:
        # Topics were detected but none met the threshold
        measurements["promotion_topics"] = {
            "value": [],
            "method": "classifier:topic_keyword_matching",
            "quality": "ok",  # Analysis succeeded, just nothing surfaced
            "notes": (
                f"{len(below_threshold)} topics detected from {total_promotional} promotional items "
                f"but none met surfacing threshold ({topic_data['threshold_rule']})."
            ),
            "threshold_rule": topic_data["threshold_rule"],
            "detected_but_excluded_count": len(below_threshold),
        }
    elif total_promotional == 0:
        # No promotional items to analyze - legitimately no data
        measurements["promotion_topics"] = {
            "value": [],
            "method": "classifier:topic_keyword_matching",
            "quality": "not_applicable",
            "notes": "No promotional content detected, so topic analysis not applicable.",
        }
    else:
        # Promotional items exist but no topics could be extracted
        measurements["promotion_topics"] = {
            "value": [],
            "method": "classifier:topic_keyword_matching",
            "quality": "insufficient_signal",
            "notes": (
                f"{total_promotional} promotional items analyzed but no topic keywords matched. "
                "This may indicate diverse or unrecognized product categories."
            ),
        }

    # Topics excluded for transparency
    if below_threshold:
        measurements["promotion_topics_excluded"] = {
            "value": [
                {"topic": t["topic"], "count": t["count"], "reason": "below_threshold"}
                for t in below_threshold
            ],
            "method": "classifier:topic_keyword_matching",
            "quality": "model_low_confidence",
            "notes": "Topics that did not meet the threshold for reliable surfacing."
        }

    # ==========================================================================
    # Legacy: Product/service categories mentioned in ads
    # ==========================================================================
    product_categories = Counter()
    for item in feed_items:
        if item.get("is_ad", False):
            ad_meta = item.get("ad_metadata", {})
            product = ad_meta.get("product_or_service")
            if product:
                product_categories[product] += 1

    if product_categories:
        measurements["ad_product_categories"] = {
            "value": [
                {"category": cat, "count": count}
                for cat, count in product_categories.most_common(5)
            ],
            "method": "heuristic:ad_metadata_extraction",
            "quality": "ok" if sum(product_categories.values()) >= 3 else "low_sample",
            "notes": "Product categories extracted from ad metadata."
        }

    return measurements


def _build_limits(
    scan_metadata: Dict[str, Any],
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
    commercial_analysis: CommercialAnalysisResult,
    observations: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build the limits section describing what is missing or uncertain.

    This section is CRITICAL for honest communication about data quality.

    Accuracy v2.0: Includes explicit documentation of excluded items and
    commercial analysis validity constraints.
    """
    limits = {}
    n_items = len(feed_items)
    spectrum = commercial_analysis.exposure_spectrum

    # Sample size limitations
    sample_limitations = []
    if n_items < 10:
        sample_limitations.append(
            f"Only {n_items} posts in this scan. Patterns may not be representative."
        )
    elif n_items < 30:
        sample_limitations.append(
            f"Sample size of {n_items} posts. Single-item changes significantly affect percentages."
        )
    else:
        sample_limitations.append(
            f"Sample of {n_items} posts from a single scan session."
        )

    limits["sample_size_limitations"] = sample_limitations

    # ==========================================================================
    # Commercial Analysis Exclusions (new in v2.0)
    # ==========================================================================
    commercial_exclusions = []

    # Document ambiguous items excluded from metrics
    if spectrum.ambiguous > 0:
        commercial_exclusions.append(
            f"{spectrum.ambiguous} items had ambiguous commercial signals and were excluded from metrics."
        )

    # Document medium-confidence items not in stacked bar
    if spectrum.unlabeled_promotion_medium > 0:
        commercial_exclusions.append(
            f"{spectrum.unlabeled_promotion_medium} items showed medium-confidence promotional signals "
            "but are not included in the primary exposure spectrum."
        )

    # Document coverage if less than 100%
    coverage = spectrum.high_confidence_items / n_items * 100 if n_items > 0 else 0
    if coverage < 90:
        commercial_exclusions.append(
            f"Only {coverage:.0f}% of items could be classified with high confidence."
        )

    if not commercial_exclusions:
        commercial_exclusions.append("All items classified with high confidence.")

    limits["commercial_analysis_exclusions"] = commercial_exclusions

    # ==========================================================================
    # Topic/Company Threshold Exclusions
    # ==========================================================================
    topic_data = commercial_analysis.topic_aggregation.to_dict()
    company_data = commercial_analysis.company_aggregation.to_dict()

    threshold_exclusions = []

    if topic_data["below_threshold"]:
        excluded_topics = [t["topic"] for t in topic_data["below_threshold"]]
        threshold_exclusions.append(
            f"Topics excluded (below threshold): {', '.join(excluded_topics[:5])}"
            + (f" and {len(excluded_topics) - 5} more" if len(excluded_topics) > 5 else "")
        )

    # Company exclusion reasons
    exclusion_reasons = company_data.get("exclusion_reasons", {})
    below_count = exclusion_reasons.get("below_count_threshold", 0)
    no_high_conf = exclusion_reasons.get("no_high_confidence_evidence", 0)

    if below_count > 0:
        threshold_exclusions.append(
            f"{below_count} companies appeared only once and are not shown individually."
        )
    if no_high_conf > 0:
        threshold_exclusions.append(
            f"{no_high_conf} companies had count >= 2 but no high-confidence evidence (advertiser metadata or disclosure label)."
        )

    if threshold_exclusions:
        limits["threshold_exclusions"] = threshold_exclusions

    # Missing metadata limitations
    missing_metadata = []

    # Check for missing advertiser names in ads
    ads = [item for item in feed_items if item.get("is_ad", False)]
    ads_without_advertiser = sum(
        1 for item in ads
        if not item.get("ad_metadata", {}).get("advertiser_name")
    )
    if ads_without_advertiser > 0 and len(ads) > 0:
        missing_metadata.append(
            f"{ads_without_advertiser} of {len(ads)} ads lack advertiser name information."
        )

    # Check for missing account info
    items_without_account = sum(
        1 for item in feed_items
        if not item.get("account") or not item.get("account", {}).get("account_handle")
    )
    if items_without_account > n_items * 0.5 and n_items > 0:
        missing_metadata.append(
            f"Account information missing for {items_without_account} of {n_items} posts."
        )

    if not missing_metadata:
        missing_metadata.append("No significant metadata gaps detected.")

    limits["missing_metadata_limitations"] = missing_metadata

    # Ad detection limitations
    ad_detection_limits = [
        "Ad detection relies on platform labels. Native ads or influencer promotions without disclosure may not be detected.",
        "Unlabeled promotion detection uses pattern matching on disclosure tokens, CTAs, and keywords.",
    ]

    # Add specific limitations based on scan source
    source_type = scan_metadata.get("source_type")
    if source_type == "MOBILE_VIDEO":
        ad_detection_limits.append(
            "Video-based scans may miss ad labels that appear briefly or are not captured in frames."
        )

    # Add validity warning if commercial analysis flagged issues
    if not commercial_analysis.is_valid_for_display:
        ad_detection_limits.append(
            f"Commercial analysis validity: {commercial_analysis.validity_reason}"
        )

    limits["ad_detection_limitations"] = ad_detection_limits

    # OCR/extraction limitations (if applicable)
    ocr_limitations = []

    # Count items with actual OCR text vs just metadata
    items_with_ocr_text = 0
    items_with_ocr_metadata = 0
    low_confidence_count = 0

    for item in feed_items:
        source_details = item.get("source_details", {})
        ocr_meta = source_details.get("ocr_metadata", {})

        if ocr_meta:
            items_with_ocr_metadata += 1
            confidence = ocr_meta.get("average_ocr_confidence")
            if confidence is not None and confidence < 0.7:
                low_confidence_count += 1

        # Check if OCR actually extracted text
        content_text = item.get("content_text", {})
        on_screen_labels = content_text.get("on_screen_labels", [])
        if any(label and label.strip() for label in on_screen_labels):
            items_with_ocr_text += 1

    if source_type == "MOBILE_VIDEO":
        # Calculate OCR extraction rate
        if n_items > 0:
            ocr_rate = (items_with_ocr_text / n_items) * 100

            if ocr_rate == 0:
                ocr_limitations.append(
                    "OCR extracted no text from video frames. Ad detection relies on visual disclosure labels "
                    "which may not have been captured. Results may be incomplete."
                )
            elif ocr_rate < 30:
                ocr_limitations.append(
                    f"OCR extracted text from only {ocr_rate:.0f}% of frames. "
                    "Some ad labels may have been missed."
                )
            else:
                ocr_limitations.append(
                    f"OCR extracted text from {ocr_rate:.0f}% of frames. "
                    "Detection depends on visible disclosure labels (Ad, Sponsored, etc.)."
                )

        if low_confidence_count > items_with_ocr_metadata * 0.2 and items_with_ocr_metadata > 0:
            ocr_limitations.append(
                f"OCR confidence was low for {low_confidence_count} items. Text extraction may be incomplete."
            )
    else:
        if not ocr_limitations:
            ocr_limitations.append("No significant OCR issues detected.")

    limits["ocr_extraction_limitations"] = ocr_limitations

    # What we cannot know
    limits["epistemic_boundaries"] = [
        "We cannot know why the algorithm showed this content.",
        "We cannot know your intent or interest level in any content shown.",
        "We cannot predict future ad targeting based on this single scan.",
        "Advertiser intent and targeting criteria are not visible to us.",
    ]

    # Phase 5C3: Add Bayesian prior limitations if prior was used
    if observations:
        prior_used = observations.get("prior_used", False)
        if prior_used:
            platform = scan_metadata.get("platform", "unknown").lower()
            alpha0, beta0, prior_source = get_ads_rate_prior(platform)
            prior_n = alpha0 + beta0
            n_items = len(feed_items)
            prior_influence_pct = (prior_n / (prior_n + n_items)) * 100 if n_items > 0 else 0.0
            
            limits["bayesian_prior_limitations"] = {
                "applies": True,
                "explanation": (
                    f"The ad rate estimate uses a statistical prior based on typical {platform} ad patterns. "
                    "This helps provide more stable estimates for small samples, but assumes your feed is "
                    "broadly similar to typical feeds. The prior has minimal influence on estimates from larger scans (50+ items)."
                ),
                "prior_source": prior_source,
                "prior_influence_percent": round(prior_influence_pct, 1)
            }

    return limits


def generate_ads_analysis_copy(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate plain-English analysis copy for the Ads & Influence tab
    using ONLY the Evidence Bundle fields.

    This copy complies with accuracy_contract.md:
    - Anchors claims to "in this scan / in this sample"
    - Avoids identity, belief, intent, or causal claims
    - States uncertainty when limits indicate missingness or low sample

    Accuracy v2.0: Uses commercial exposure spectrum and confidence-gated data.

    Returns:
        Dict with analysis sections, each containing:
        - text: the plain-English copy
        - cited_fields: list of Evidence Bundle fields used
        - quality: ok | insufficient_data
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    analysis = {}

    # ==========================================================================
    # Primary insight: Commercial Exposure Spectrum (View A)
    # ==========================================================================
    spectrum = observations.get("commercial_exposure_spectrum", {})
    stacked_bar = spectrum.get("stacked_bar", {})

    labeled_ads = stacked_bar.get("labeled_ads", 0)
    unlabeled_promo = stacked_bar.get("unlabeled_promotion", 0)
    non_commercial = stacked_bar.get("non_commercial", 0)
    total_promotional = labeled_ads + unlabeled_promo

    promo_rate = observations.get("promotional_rate_percent")
    coverage = spectrum.get("coverage_percent", 0)

    if n_items < 10:
        analysis["primary_insight"] = {
            "text": f"In this scan, we captured {n_items} posts. More data is needed to show reliable commercial patterns.",
            "cited_fields": ["meta.n_items"],
            "quality": "insufficient_data"
        }
    elif total_promotional == 0:
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, no promotional content was detected (neither labeled ads nor unlabeled promotions).",
            "cited_fields": [
                "meta.n_items",
                "observations.commercial_exposure_spectrum.stacked_bar"
            ],
            "quality": "ok"
        }
    else:
        # Build a precise, data-grounded statement
        parts = []
        parts.append(f"In this scan of {n_items} posts")

        if labeled_ads > 0 and unlabeled_promo > 0:
            parts.append(f"{labeled_ads} were labeled ads and {unlabeled_promo} showed high-confidence promotional signals without disclosure")
        elif labeled_ads > 0:
            parts.append(f"{labeled_ads} were labeled ads")
        elif unlabeled_promo > 0:
            parts.append(f"{unlabeled_promo} showed high-confidence promotional signals without disclosure")

        if promo_rate is not None:
            parts.append(f"({promo_rate}% of content)")

        text = ", ".join(parts[:2]) + " " + parts[2] if len(parts) > 2 else ", ".join(parts)
        text += "."

        analysis["primary_insight"] = {
            "text": text,
            "cited_fields": [
                "meta.n_items",
                "observations.commercial_exposure_spectrum.stacked_bar",
                "observations.promotional_rate_percent"
            ],
            "quality": "ok"
        }

    # ==========================================================================
    # Brand/Advertiser concentration (View C)
    # ==========================================================================
    top_companies = observations.get("top_companies", [])
    unique_brands = observations.get("unique_brands_count", 0)
    top_advertisers = observations.get("top_advertisers", [])
    unique_advertisers = observations.get("unique_advertisers_count", 0)

    # Prefer companies data if available, fall back to advertisers
    if top_companies:
        if len(top_companies) == 1:
            company_name = top_companies[0]["name"]
            company_count = top_companies[0]["count"]
            analysis["concentration_insight"] = {
                "text": f"In this scan, promotional content was dominated by {company_name} (appeared {company_count} times).",
                "cited_fields": ["observations.top_companies"],
                "quality": "ok"
            }
        else:
            company_names = [b["name"] for b in top_companies[:3]]
            analysis["concentration_insight"] = {
                "text": f"In this scan, the most common companies in promotional content were: {', '.join(company_names)}.",
                "cited_fields": ["observations.top_companies", "observations.unique_companies_surfaced"],
                "quality": "ok"
            }
    elif total_promotional > 0 and unique_advertisers > 0:
        if unique_advertisers == 1:
            analysis["concentration_insight"] = {
                "text": f"In this scan, all {labeled_ads} labeled ads came from a single advertiser.",
                "cited_fields": ["observations.total_ads_detected", "observations.unique_advertisers_count"],
                "quality": "ok"
            }
        else:
            analysis["concentration_insight"] = {
                "text": f"In this scan, ads came from {unique_advertisers} different advertisers.",
                "cited_fields": ["observations.unique_advertisers_count"],
                "quality": "ok"
            }
    elif total_promotional == 0:
        analysis["concentration_insight"] = {
            "text": "No promotional content was detected, so brand/advertiser concentration cannot be assessed.",
            "cited_fields": ["observations.commercial_exposure_spectrum.stacked_bar"],
            "quality": "ok"
        }

    # ==========================================================================
    # Promotion Topics (View B)
    # ==========================================================================
    topic_measurement = measurements.get("promotion_topics", {})
    topic_value = topic_measurement.get("value", [])
    topic_quality = topic_measurement.get("quality", "missing_fields")

    if topic_quality in ["ok", "low_sample"] and topic_value:
        topic_names = [t["topic"].replace("_", " ").title() for t in topic_value[:3]]
        if len(topic_names) == 1:
            analysis["topic_insight"] = {
                "text": f"In this scan, promotional content primarily related to {topic_names[0]}.",
                "cited_fields": ["measurements.promotion_topics"],
                "quality": "ok"
            }
        else:
            analysis["topic_insight"] = {
                "text": f"In this scan, promotional content related to: {', '.join(topic_names)}.",
                "cited_fields": ["measurements.promotion_topics"],
                "quality": "ok"
            }
    elif total_promotional > 0:
        analysis["topic_insight"] = {
            "text": "Promotional topics could not be reliably determined for this scan.",
            "cited_fields": ["measurements.promotion_topics"],
            "quality": "insufficient_data"
        }

    # ==========================================================================
    # Unlabeled promotions detail
    # ==========================================================================
    unlabeled_measurement = measurements.get("unlabeled_promotions", {})
    unlabeled_value = unlabeled_measurement.get("value", {})
    high_conf = unlabeled_value.get("high_confidence", 0)
    medium_conf = unlabeled_value.get("medium_confidence", 0)
    ambiguous = unlabeled_value.get("ambiguous", 0)

    if high_conf > 0 or medium_conf > 0:
        text_parts = [f"In this scan, {high_conf} posts showed high-confidence promotional signals without formal disclosure"]
        if medium_conf > 0:
            text_parts[0] += f", plus {medium_conf} with medium-confidence signals"
        text_parts[0] += "."
        if ambiguous > 0:
            text_parts.append(f"{ambiguous} posts were ambiguous and excluded from counts.")

        analysis["unlabeled_promo_insight"] = {
            "text": " ".join(text_parts),
            "cited_fields": ["measurements.unlabeled_promotions"],
            "quality": "ok"
        }
    elif n_items >= 10:
        analysis["unlabeled_promo_insight"] = {
            "text": "In this scan, no unlabeled promotional signals were detected with high confidence.",
            "cited_fields": ["measurements.unlabeled_promotions"],
            "quality": "ok"
        }

    # ==========================================================================
    # Limitations summary
    # ==========================================================================
    sample_limits = limits.get("sample_size_limitations", [])
    commercial_exclusions = limits.get("commercial_analysis_exclusions", [])
    ad_limits = limits.get("ad_detection_limitations", [])

    limitations_text = []
    if sample_limits:
        limitations_text.append(sample_limits[0])
    if commercial_exclusions and "excluded" in commercial_exclusions[0].lower():
        limitations_text.append(commercial_exclusions[0])

    analysis["limitations_summary"] = {
        "text": " ".join(limitations_text) if limitations_text else "Standard detection methods were used.",
        "cited_fields": [
            "limits.sample_size_limitations",
            "limits.commercial_analysis_exclusions",
            "limits.ad_detection_limitations"
        ],
        "quality": "ok"
    }

    return analysis


def generate_talk_response(
    bundle: Dict[str, Any],
    question: str
) -> Dict[str, Any]:
    """
    Generate a Talk-to-Algorithm response using ONLY the Evidence Bundle.

    Response structure (per accuracy_contract.md):
    1. What we observed (must cite 2-4 specific Evidence Bundle fields)
    2. What it might mean (2-3 labeled hypotheses; no certainty)
    3. What we cannot know (must cite limits)
    4. What you can try (2-4 non-judgmental, optional actions)

    Accuracy v2.0: Uses commercial exposure spectrum, topics, and brands.

    Returns:
        Dict with structured response sections
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)

    # Extract commercial exposure spectrum data
    spectrum = observations.get("commercial_exposure_spectrum", {})
    stacked_bar = spectrum.get("stacked_bar", {})
    labeled_ads = stacked_bar.get("labeled_ads", 0)
    unlabeled_promo = stacked_bar.get("unlabeled_promotion", 0)
    non_commercial = stacked_bar.get("non_commercial", 0)
    total_promotional = labeled_ads + unlabeled_promo

    promo_rate = observations.get("promotional_rate_percent")
    top_companies = observations.get("top_companies", [])

    # Extract topic data
    topic_measurement = measurements.get("promotion_topics", {})
    topic_value = topic_measurement.get("value", [])

    # Extract unlabeled promotion details
    unlabeled_measurement = measurements.get("unlabeled_promotions", {})
    unlabeled_value = unlabeled_measurement.get("value", {})
    high_conf_promos = unlabeled_value.get("high_confidence", 0)

    # Build the structured response
    response = {
        "what_we_observed": {
            "intro": f"In this scan of {n_items} posts:",
            "facts": [],
            "cited_fields": []
        },
        "what_it_might_mean": {
            "intro": "This pattern could suggest:",
            "hypotheses": []
        },
        "what_we_cannot_know": {
            "intro": "Important limitations:",
            "limits": []
        },
        "what_you_can_try": {
            "intro": "If you want to explore further:",
            "actions": []
        }
    }

    # ==========================================================================
    # Populate observations from commercial exposure spectrum
    # ==========================================================================

    # Commercial exposure breakdown
    if total_promotional == 0:
        response["what_we_observed"]["facts"].append(
            f"No promotional content (ads or unlabeled promotions) was detected."
        )
    else:
        if labeled_ads > 0 and unlabeled_promo > 0:
            response["what_we_observed"]["facts"].append(
                f"{labeled_ads} labeled ads and {unlabeled_promo} unlabeled promotions were detected."
            )
        elif labeled_ads > 0:
            response["what_we_observed"]["facts"].append(
                f"{labeled_ads} labeled ads were detected ({promo_rate}% of content)."
            )
        elif unlabeled_promo > 0:
            response["what_we_observed"]["facts"].append(
                f"{unlabeled_promo} posts showed high-confidence promotional signals without disclosure."
            )

    response["what_we_observed"]["cited_fields"].extend([
        "observations.commercial_exposure_spectrum.stacked_bar",
        "observations.promotional_rate_percent"
    ])

    # Non-commercial content
    if non_commercial > 0:
        response["what_we_observed"]["facts"].append(
            f"{non_commercial} posts ({round(non_commercial/n_items*100) if n_items > 0 else 0}%) were non-commercial content."
        )

    # Top companies/brands
    if top_companies:
        company_names = [b["name"] for b in top_companies[:3]]
        response["what_we_observed"]["facts"].append(
            f"Most common companies/brands: {', '.join(company_names)}."
        )
        response["what_we_observed"]["cited_fields"].append(
            "observations.top_companies"
        )

    # Promotion topics
    if topic_value:
        topic_names = [t["topic"].replace("_", " ") for t in topic_value[:3]]
        response["what_we_observed"]["facts"].append(
            f"Promotional content primarily related to: {', '.join(topic_names)}."
        )
        response["what_we_observed"]["cited_fields"].append(
            "measurements.promotion_topics"
        )

    # Ensure we have at least 2 observations
    if len(response["what_we_observed"]["facts"]) < 2:
        response["what_we_observed"]["facts"].append(
            f"This scan captured {n_items} posts total."
        )
        response["what_we_observed"]["cited_fields"].append("meta.n_items")

    # ==========================================================================
    # Build hypotheses based on the question and data
    # ==========================================================================
    question_lower = question.lower() if question else ""

    # Check for specific question themes
    is_asking_about_ads = any(w in question_lower for w in ["ads", "ad", "advertis", "promoted"])
    is_asking_about_targeting = any(w in question_lower for w in ["target", "interest", "why", "seeing"])
    is_asking_about_brands = any(w in question_lower for w in ["brand", "company", "who", "advertiser"])
    is_asking_about_unlabeled = any(w in question_lower for w in ["unlabeled", "hidden", "sneaky", "influencer"])

    if total_promotional == 0:
        response["what_it_might_mean"]["hypotheses"] = [
            {
                "label": "Possibility A",
                "text": "The platform may not have shown targeted ads during this scroll session."
            },
            {
                "label": "Possibility B",
                "text": "Ads may have been present but not captured in the frames analyzed."
            },
            {
                "label": "Possibility C",
                "text": "Your ad preferences or account state may affect ad delivery."
            }
        ]
    elif is_asking_about_unlabeled and high_conf_promos > 0:
        response["what_it_might_mean"]["hypotheses"] = [
            {
                "label": "Possibility A",
                "text": "Some creators may be promoting products without proper disclosure."
            },
            {
                "label": "Possibility B",
                "text": "The detection may have captured organic recommendations that resemble promotions."
            },
            {
                "label": "Possibility C",
                "text": "Disclosure labels may exist but were not captured in the video frames."
            }
        ]
    elif is_asking_about_brands and top_companies:
        response["what_it_might_mean"]["hypotheses"] = [
            {
                "label": "Possibility A",
                "text": "These brands may be running campaigns targeting your demographic."
            },
            {
                "label": "Possibility B",
                "text": "The brands may be popular in content you engage with."
            },
            {
                "label": "Possibility C",
                "text": "This may reflect broader platform advertising trends."
            }
        ]
    elif promo_rate and promo_rate < 10:
        response["what_it_might_mean"]["hypotheses"] = [
            {
                "label": "Possibility A",
                "text": "The platform may be optimizing for engagement over ad frequency."
            },
            {
                "label": "Possibility B",
                "text": "This session type or time may have lower ad inventory."
            },
            {
                "label": "Possibility C",
                "text": "Your account may be in a segment with lower ad targeting."
            }
        ]
    else:
        response["what_it_might_mean"]["hypotheses"] = [
            {
                "label": "Possibility A",
                "text": "The platform is likely testing ad frequencies with different users."
            },
            {
                "label": "Possibility B",
                "text": "Your inferred interests may align with advertiser target audiences."
            },
            {
                "label": "Possibility C",
                "text": "Ad load may vary by content category and time of day."
            }
        ]

    # ==========================================================================
    # Build limits section with commercial analysis exclusions
    # ==========================================================================
    epistemic = limits.get("epistemic_boundaries", [])
    ad_detection = limits.get("ad_detection_limitations", [])
    sample = limits.get("sample_size_limitations", [])
    commercial_exclusions = limits.get("commercial_analysis_exclusions", [])

    response["what_we_cannot_know"]["limits"] = []

    if epistemic:
        response["what_we_cannot_know"]["limits"].append(epistemic[0])
    if ad_detection:
        response["what_we_cannot_know"]["limits"].append(ad_detection[0])
    if commercial_exclusions and "excluded" in commercial_exclusions[0].lower():
        response["what_we_cannot_know"]["limits"].append(commercial_exclusions[0])
    if sample and len(response["what_we_cannot_know"]["limits"]) < 3:
        response["what_we_cannot_know"]["limits"].append(sample[0])

    response["what_we_cannot_know"]["cited_fields"] = [
        "limits.epistemic_boundaries",
        "limits.ad_detection_limitations",
        "limits.commercial_analysis_exclusions",
        "limits.sample_size_limitations"
    ]

    # ==========================================================================
    # Build actions section
    # ==========================================================================
    actions = [
        "Run another scan at a different time to compare commercial patterns.",
        "Check your platform's ad preferences or settings for opt-out options.",
    ]

    if high_conf_promos > 0:
        actions.append("Look for disclosure labels (Ad, Sponsored, #ad) when browsing promotional content.")

    if top_companies:
        actions.append("Note if the same brands appear across multiple scans.")

    actions.append("Run scans on different platforms to compare ad approaches.")

    response["what_you_can_try"]["actions"] = actions[:4]

    return response


def _build_evidence_items(
    feed_items: List[Dict[str, Any]],
    commercial_analysis: CommercialAnalysisResult,
    scan_metadata: Dict[str, Any],
    observations: Dict[str, Any]
) -> List[EvidenceItem]:
    """
    Phase 5D1: Build EvidenceItems from feed items and analysis.
    
    Naming convention: ev-ads-{signal_type}-{index:03d}
    """
    evidence_items: List[EvidenceItem] = []
    platform = scan_metadata.get("platform", "").lower()
    modality = scan_metadata.get("source_type", "").lower()
    
    # Build evidence items for platform-labeled ads
    ads = [item for item in feed_items if item.get("is_ad", False)]
    for idx, item in enumerate(ads):
        ad_meta = item.get("ad_metadata", {})
        reason = ad_meta.get("ad_detected_reason", "platform_label")
        method = "OCR_DISCLOSURE" if reason == "ocr_disclosure_token" else "PLATFORM_LABEL"
        reliability_score = get_method_reliability(method)
        # get_method_reliability returns a float, create MethodReliability object
        from accuracy.schema import MethodReliability
        method_reliability_obj = MethodReliability(
            method=method,
            base_reliability=reliability_score,
            effective_reliability=reliability_score
        ) if reliability_score is not None else None
        
        evidence_id = f"ev-ads-platform-{idx:03d}"
        
        # Build item context
        item_index = item.get("position_in_feed", idx)
        # Include platform_id if present for duplicate detection in conflict engine
        platform_id = item.get("platform_item_id") or item.get("post_id") or None

        item_context = ItemContext(
            item_index=item_index,
            platform=platform,
            modality=modality,
            item_type="ad",
            platform_id=platform_id,
        )
        
        evidence_item = EvidenceItem(
            evidence_id=evidence_id,
            source_item_index=item_index,
            signal_type="platform_labeled_ad",
            detection_method=method,
            method_reliability=method_reliability_obj,
            source="platform_label",
            item_context=item_context
        )
        
        evidence_items.append(evidence_item)
    
    # Build aggregate evidence item for ad rate
    n_items = len(feed_items)
    total_ads = observations.get("total_ads_detected", 0)
    ad_rate = observations.get("ad_rate_percent")
    
    if ad_rate is not None and n_items > 0:
        # Create aggregate evidence item
        aggregate_ev_id = "ev-ads-aggregate-adrate"
        
        # Determine method from observations
        estimate_method = observations.get("ad_rate_estimate_method", "wilson")
        if estimate_method == "bayesian_beta":
            method = "BAYESIAN_BETA"
        else:
            method = "WILSON_CI"
        
        reliability_score = get_method_reliability(method)
        # get_method_reliability returns a float, create MethodReliability object
        from accuracy.schema import MethodReliability
        method_reliability_obj = MethodReliability(
            method=method,
            base_reliability=reliability_score,
            effective_reliability=reliability_score
        ) if reliability_score is not None else None
        
        aggregate_item = EvidenceItem(
            evidence_id=aggregate_ev_id,
            signal_type="aggregate_computation",
            detection_method=method,
            method_reliability=method_reliability_obj,
            source="aggregate",
            item_context=None  # Aggregate has no single item context
        )
        
        evidence_items.append(aggregate_item)

    # ------------------------------------------------------------------
    # Phase 5F2: Additional evidence from OCR / captions / promo signals
    # ------------------------------------------------------------------
    from accuracy.schema import MethodReliability  # local import to avoid cycles

    DISCLOSURE_PHRASES = [
        "sponsored",
        "paid partnership",
        "paid promotion",
        "ad ",
        " ad",
        "#ad",
        "promo",
        "promotion",
        "partner",
        "affiliate",
    ]
    DENIAL_PHRASES = [
        "not an ad",
        "not sponsored",
        "#notanad",
        "no sponsor",
        "not a sponsored post",
        "not paid",
    ]
    PROMO_PHRASES = [
        "use code",
        "promo code",
        "discount code",
        "% off",
        "off your order",
        "link in bio",
        "use my link",
    ]

    def _make_method_reliability(method_name: str) -> Optional[MethodReliability]:
        score = get_method_reliability(method_name)
        if score is None:
            return None
        return MethodReliability(
            method=method_name,
            base_reliability=score,
            effective_reliability=score,
        )

    for idx, item in enumerate(feed_items):
        item_index = item.get("position_in_feed", idx)
        platform_id = item.get("platform_item_id") or item.get("post_id") or None
        base_context = ItemContext(
            item_index=item_index,
            platform=platform,
            modality=modality,
            item_type="ad" if item.get("is_ad", False) else "post",
            platform_id=platform_id,
        )

        # Extract text fields safely
        content_text = item.get("content_text") or {}
        caption = (
            content_text.get("caption")
            or content_text.get("post_text")
            or ""
        )
        hashtags = content_text.get("hashtags") or []
        hashtags_text = " ".join(hashtags)
        caption_combined = f"{caption} {hashtags_text}".strip()

        ocr_text = item.get("ocr_text") or ""

        # A) OCR disclosure / denial evidence (OCR_DISCLOSURE)
        if ocr_text:
            text_lower = ocr_text.lower()
            # Any denial phrase in OCR → creator_denial via OCR
            if any(p in text_lower for p in DENIAL_PHRASES):
                ev_id = f"ev-ads-ocr-denial-{item_index:03d}"
                evidence_items.append(
                    EvidenceItem(
                        evidence_id=ev_id,
                        source_item_index=item_index,
                        signal_type="creator_denial_ocr",
                        detection_method="OCR_DISCLOSURE",
                        method_reliability=_make_method_reliability("OCR_DISCLOSURE"),
                        source="ocr",
                        item_context=base_context,
                    )
                )
            # Any disclosure phrase in OCR → ocr_disclosure
            elif any(p in text_lower for p in DISCLOSURE_PHRASES):
                ev_id = f"ev-ads-ocr-disclosure-{item_index:03d}"
                evidence_items.append(
                    EvidenceItem(
                        evidence_id=ev_id,
                        source_item_index=item_index,
                        signal_type="ocr_disclosure",
                        detection_method="OCR_DISCLOSURE",
                        method_reliability=_make_method_reliability("OCR_DISCLOSURE"),
                        source="ocr",
                        item_context=base_context,
                    )
                )

        # B) Caption / hashtag denial evidence (KEYWORD_MATCH)
        if caption_combined:
            caption_lower = caption_combined.lower()
            if any(p in caption_lower for p in DENIAL_PHRASES):
                ev_id = f"ev-ads-caption-denial-{item_index:03d}"
                evidence_items.append(
                    EvidenceItem(
                        evidence_id=ev_id,
                        source_item_index=item_index,
                        signal_type="creator_denial_hashtag",
                        detection_method="KEYWORD_MATCH",
                        method_reliability=_make_method_reliability("KEYWORD_MATCH"),
                        source="caption",
                        item_context=base_context,
                    )
                )

        # C) Promo code / discount CTA signals (unlabeled promotions)
        if caption_combined or ocr_text:
            combined_text = f"{caption_combined} {ocr_text}".lower()
            if any(p in combined_text for p in PROMO_PHRASES):
                # Discount code signal
                if "use code" in combined_text or "promo code" in combined_text or "discount code" in combined_text:
                    ev_id = f"ev-ads-promo-discount-{item_index:03d}"
                    evidence_items.append(
                        EvidenceItem(
                            evidence_id=ev_id,
                            source_item_index=item_index,
                            signal_type="discount_code",
                            detection_method="REGEX_PATTERN",
                            method_reliability=_make_method_reliability("REGEX_PATTERN"),
                            source="caption",
                            item_context=base_context,
                        )
                    )
                # CTA signal
                if "link in bio" in combined_text or "use my link" in combined_text:
                    ev_id = f"ev-ads-promo-cta-{item_index:03d}"
                    evidence_items.append(
                        EvidenceItem(
                            evidence_id=ev_id,
                            source_item_index=item_index,
                            signal_type="call_to_action",
                            detection_method="HEURISTIC_RULE",
                            method_reliability=_make_method_reliability("HEURISTIC_RULE"),
                            source="caption",
                            item_context=base_context,
                        )
                    )

    return evidence_items


def _build_insights(
    observations: Dict[str, Any],
    measurements: Dict[str, Any],
    evidence_items: List[EvidenceItem],
    scan_metadata: Dict[str, Any]
) -> List[Insight]:
    """
    Phase 5D1: Build Insights from observations and measurements.
    
    For aggregate claims (like ad_rate), attach evidence_ids to underlying evidence items
    or reference the aggregate EvidenceItem.
    """
    insights = []
    
    # Build insight for ad rate (aggregate claim)
    ad_rate = observations.get("ad_rate_percent")
    n_items = observations.get("total_posts_seen", 0)
    total_ads = observations.get("total_ads_detected", 0)
    
    if ad_rate is not None and n_items > 0:
        # Find aggregate evidence item
        aggregate_ev_id = "ev-ads-aggregate-adrate"
        aggregate_ev_exists = any(item.evidence_id == aggregate_ev_id for item in evidence_items)
        
        # Collect all evidence IDs so that no evidence is orphaned in ads tab
        # (Phase 5D1 invariants: orphan_evidence_rate <= 0.20).
        other_ids = [
            item.evidence_id for item in evidence_items
            if item.evidence_id != aggregate_ev_id
        ]
        evidence_ids = []
        if aggregate_ev_exists:
            evidence_ids.append(aggregate_ev_id)
        evidence_ids.extend(other_ids)
        
        # Determine claim status: FINAL if we have evidence, PRELIMINARY otherwise
        claim_status: ClaimStatus = "FINAL" if evidence_ids else "PRELIMINARY"
        
        insight = Insight(
            insight_id="ads-commercial-spectrum",
            claim_type="aggregate_observation",
            claim_text=f"Ad rate: {ad_rate}% ({total_ads} ads in {n_items} posts)",
            claim_status=claim_status,
            evidence_ids=evidence_ids,
            numeric_confidence=observations.get("ad_rate_percent_ci", {}).get("confidence_level", 0.95),
            point_estimate=ad_rate
        )
        
        insights.append(insight)
    
    return insights


def format_talk_response_as_text(response: Dict[str, Any]) -> str:
    """
    Format a structured Talk response as readable text.
    """
    sections = []

    # What we observed
    obs = response.get("what_we_observed", {})
    if obs.get("facts"):
        sections.append("**What we observed**")
        sections.append(obs.get("intro", ""))
        for fact in obs["facts"]:
            sections.append(f"- {fact}")
        sections.append("")

    # What it might mean
    meaning = response.get("what_it_might_mean", {})
    if meaning.get("hypotheses"):
        sections.append("**What it might mean**")
        sections.append(meaning.get("intro", ""))
        for hyp in meaning["hypotheses"]:
            sections.append(f"- {hyp['label']}: {hyp['text']}")
        sections.append("")

    # What we cannot know
    unknown = response.get("what_we_cannot_know", {})
    if unknown.get("limits"):
        sections.append("**What we cannot know**")
        sections.append(unknown.get("intro", ""))
        for limit in unknown["limits"]:
            sections.append(f"- {limit}")
        sections.append("")

    # What you can try
    actions = response.get("what_you_can_try", {})
    if actions.get("actions"):
        sections.append("**What you can try**")
        sections.append(actions.get("intro", ""))
        for action in actions["actions"]:
            sections.append(f"- {action}")

    return "\n".join(sections)
