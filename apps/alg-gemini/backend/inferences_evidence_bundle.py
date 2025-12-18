"""
Evidence Bundle Builder for "What the Algorithm Thinks" Tab (Inferences)

This module produces an Evidence Bundle for the Inferences tab by aggregating
inference candidates from all other bundles (ads, politics, patterns, creators)
and applying strict confidence thresholds.

Key principle: These are "signals present IN the content" NOT "who you are."

Epistemic boundaries (STRICTLY enforced):
- Cannot infer user identity, beliefs, intent, or demographics
- Cannot infer targeting criteria or why content was shown
- Cannot infer causal influence on the user
- These are scan-content signals only

Evidence Bundle Structure:
{
    "meta": { ... },           # Scan metadata + sources
    "observations": { ... },   # Surfaced inferences (high confidence only)
    "measurements": { ... },   # Confidence thresholds applied
    "limits": { ... }          # Strict epistemic boundaries
}
"""

from datetime import datetime
from typing import Dict, Any, List, Optional


def build_inferences_evidence_bundle(
    scan_result: Dict[str, Any],
    ads_bundle: Optional[Dict[str, Any]] = None,
    politics_bundle: Optional[Dict[str, Any]] = None,
    patterns_bundle: Optional[Dict[str, Any]] = None,
    creators_bundle: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Build an Evidence Bundle for the "What the Algorithm Thinks" tab.

    This bundle aggregates high-confidence signals from other bundles
    to show what signals are present in the content - NOT user inferences.

    Args:
        scan_result: The full UnifiedScanResult dict
        ads_bundle: Pre-built ads evidence bundle
        politics_bundle: Pre-built politics evidence bundle
        patterns_bundle: Pre-built patterns evidence bundle
        creators_bundle: Pre-built creators evidence bundle

    Returns:
        Evidence Bundle dict with keys: meta, observations, measurements, limits
    """
    scan_metadata = scan_result.get("scan_metadata", {})
    feed_items = scan_result.get("feed_items", [])

    meta = _build_meta(scan_metadata, feed_items, ads_bundle, politics_bundle, patterns_bundle, creators_bundle)
    observations = _build_observations(scan_result, ads_bundle, politics_bundle, patterns_bundle, creators_bundle)
    measurements = _build_measurements(observations)
    limits = _build_limits(scan_metadata, feed_items)

    return {
        "meta": meta,
        "observations": observations,
        "measurements": measurements,
        "limits": limits,
    }


def _build_meta(
    scan_metadata: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
    ads_bundle: Optional[Dict[str, Any]],
    politics_bundle: Optional[Dict[str, Any]],
    patterns_bundle: Optional[Dict[str, Any]],
    creators_bundle: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """Build the meta section with scan context and source bundle info."""
    n_items = len(feed_items)
    created_at = scan_metadata.get("created_at")

    # Track which source bundles were provided
    sources_available = {
        "ads": ads_bundle is not None,
        "politics": politics_bundle is not None,
        "patterns": patterns_bundle is not None,
        "creators": creators_bundle is not None,
    }

    return {
        "scan_id": scan_metadata.get("scan_id"),
        "platform": scan_metadata.get("platform"),
        "n_items": n_items,
        "window_start": created_at,
        "window_end": created_at,
        "generated_at": datetime.now().isoformat(),
        "source_bundles": sources_available,
    }


def _build_observations(
    scan_result: Dict[str, Any],
    ads_bundle: Optional[Dict[str, Any]],
    politics_bundle: Optional[Dict[str, Any]],
    patterns_bundle: Optional[Dict[str, Any]],
    creators_bundle: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Build the observations section with surfaced inferences.

    These are NOT user profile inferences - they are CONTENT SIGNALS.
    Each inference must have:
    - signal: what was detected
    - source: which bundle it came from
    - evidence_count: how many items support it
    - confidence: high/medium
    """
    observations = {}
    feed_items = scan_result.get("feed_items", [])
    n_items = len(feed_items)
    observations["total_posts_analyzed"] = n_items

    # Collect inference candidates
    surfaced_inferences = []
    below_threshold = []

    # From Ads bundle: commercial signals
    if ads_bundle:
        ads_obs = ads_bundle.get("observations", {})
        spectrum = ads_obs.get("commercial_exposure_spectrum", {})
        stacked_bar = spectrum.get("stacked_bar", {})

        labeled_ads = stacked_bar.get("labeled_ads", 0)
        unlabeled_promo = stacked_bar.get("unlabeled_promotion", 0)
        total_promo = labeled_ads + unlabeled_promo

        if total_promo >= 2:
            surfaced_inferences.append({
                "signal": "Commercial content present",
                "detail": f"{total_promo} promotional items detected",
                "source": "ads",
                "evidence_count": total_promo,
                "confidence": "high" if total_promo >= 3 else "medium",
            })

        # Topics from promotional content
        ads_meas = ads_bundle.get("measurements", {})
        promo_topics = ads_meas.get("promotion_topics", {})
        topic_value = promo_topics.get("value", [])
        if topic_value and len(topic_value) > 0:
            # topic_value contains dicts with "topic" key
            if isinstance(topic_value[0], dict):
                topics = [t.get("topic", t) for t in topic_value[:3]]
            else:
                topics = topic_value[:3]
            surfaced_inferences.append({
                "signal": "Promotional topics detected",
                "detail": f"Topics: {', '.join(str(t) for t in topics)}",
                "source": "ads",
                "evidence_count": len(topic_value),
                "confidence": "high" if len(topic_value) >= 2 else "medium",
            })

        # Top companies
        top_companies = ads_obs.get("top_companies", [])
        if top_companies and len(top_companies) >= 1:
            company_names = [c["name"] for c in top_companies[:3]]
            surfaced_inferences.append({
                "signal": "Brand presence in promotional content",
                "detail": f"Companies: {', '.join(company_names)}",
                "source": "ads",
                "evidence_count": len(top_companies),
                "confidence": "high",
            })

    # From Politics bundle: keyword signals
    if politics_bundle:
        pol_obs = politics_bundle.get("observations", {})
        political_count = pol_obs.get("items_with_political_keywords", 0)
        news_count = pol_obs.get("items_with_news_keywords", 0)

        if political_count >= 2:
            surfaced_inferences.append({
                "signal": "Political keywords present",
                "detail": f"{political_count} items contained political terms",
                "source": "politics",
                "evidence_count": political_count,
                "confidence": "high" if political_count >= 3 else "medium",
            })
        elif political_count == 1:
            below_threshold.append({
                "signal": "Political keywords (single item)",
                "source": "politics",
                "evidence_count": 1,
                "reason": "below_threshold",
            })

        if news_count >= 2:
            surfaced_inferences.append({
                "signal": "News content present",
                "detail": f"{news_count} items contained news keywords",
                "source": "politics",
                "evidence_count": news_count,
                "confidence": "high" if news_count >= 3 else "medium",
            })

    # From Patterns bundle: repetition signals
    if patterns_bundle:
        pat_obs = patterns_bundle.get("observations", {})
        repeated_creators = pat_obs.get("repeated_creators_count", 0)
        top_repeated = pat_obs.get("top_repeated_creators", [])

        if repeated_creators >= 2:
            surfaced_inferences.append({
                "signal": "Creator repetition pattern",
                "detail": f"{repeated_creators} creators appeared multiple times",
                "source": "patterns",
                "evidence_count": repeated_creators,
                "confidence": "high" if repeated_creators >= 3 else "medium",
            })

        # Content type concentration
        content_dist = pat_obs.get("content_type_distribution", [])
        if content_dist and content_dist[0].get("percent", 0) >= 70:
            dominant = content_dist[0]
            surfaced_inferences.append({
                "signal": "Dominant content type",
                "detail": f"{dominant['type']} content ({dominant['percent']}%)",
                "source": "patterns",
                "evidence_count": dominant.get("count", 0),
                "confidence": "high",
            })

    # From Creators bundle: creator signals
    if creators_bundle:
        cre_obs = creators_bundle.get("observations", {})
        verified_rate = cre_obs.get("verified_rate_percent", 0)
        creators_in_ads = cre_obs.get("creators_in_ads_count", 0)

        if verified_rate >= 50:
            surfaced_inferences.append({
                "signal": "High verified creator presence",
                "detail": f"{verified_rate}% of creators verified",
                "source": "creators",
                "evidence_count": cre_obs.get("verified_creators_count", 0),
                "confidence": "high",
            })

        if creators_in_ads >= 2:
            surfaced_inferences.append({
                "signal": "Creators in ad content",
                "detail": f"{creators_in_ads} creators appeared in ads",
                "source": "creators",
                "evidence_count": creators_in_ads,
                "confidence": "high" if creators_in_ads >= 3 else "medium",
            })

    # Sort by confidence then evidence count
    surfaced_inferences.sort(key=lambda x: (
        0 if x["confidence"] == "high" else 1,
        -x["evidence_count"]
    ))

    observations["surfaced_inferences"] = surfaced_inferences
    observations["surfaced_count"] = len(surfaced_inferences)
    observations["below_threshold"] = below_threshold
    observations["below_threshold_count"] = len(below_threshold)

    return observations


def _build_measurements(observations: Dict[str, Any]) -> Dict[str, Any]:
    """Build the measurements section with threshold info."""
    measurements = {}

    surfaced = observations.get("surfaced_inferences", [])
    below = observations.get("below_threshold", [])

    # Count by source
    source_counts = {}
    for inf in surfaced:
        source = inf.get("source", "unknown")
        source_counts[source] = source_counts.get(source, 0) + 1

    measurements["inference_sources"] = {
        "value": source_counts,
        "method": "aggregation_from_evidence_bundles",
        "quality": "ok" if surfaced else "no_inferences_surfaced",
        "notes": f"{len(surfaced)} inferences surfaced from {len(source_counts)} sources."
    }

    # Threshold rule
    measurements["surfacing_threshold"] = {
        "value": {
            "min_evidence_count": 2,
            "confidence_required": "medium or high",
        },
        "method": "threshold_gating",
        "quality": "ok",
        "notes": "Inferences require at least 2 supporting items to surface."
    }

    # Confidence breakdown
    high_conf = sum(1 for inf in surfaced if inf.get("confidence") == "high")
    med_conf = sum(1 for inf in surfaced if inf.get("confidence") == "medium")

    measurements["confidence_breakdown"] = {
        "value": {
            "high_confidence": high_conf,
            "medium_confidence": med_conf,
            "below_threshold": len(below),
        },
        "method": "confidence_classification",
        "quality": "ok",
        "notes": f"{high_conf} high-confidence, {med_conf} medium-confidence inferences."
    }

    return measurements


def _build_limits(
    scan_metadata: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Build the limits section with STRICT epistemic boundaries."""
    limits = {}
    n_items = len(feed_items)

    # Sample size limitations
    if n_items < 10:
        limits["sample_size_limitations"] = [
            f"Only {n_items} posts analyzed. Inferences may be unreliable."
        ]
    elif n_items < 30:
        limits["sample_size_limitations"] = [
            f"Sample size of {n_items} posts. Treat inferences as tentative."
        ]
    else:
        limits["sample_size_limitations"] = [
            f"Sample of {n_items} posts from a single scan session."
        ]

    # CRITICAL: Strict epistemic boundaries for inferences
    limits["epistemic_boundaries"] = [
        "These are signals IN THE CONTENT, not inferences about YOU.",
        "We CANNOT infer your identity, beliefs, intent, or demographics.",
        "We CANNOT know what targeting criteria were used.",
        "We CANNOT know why this content was shown to you.",
        "We CANNOT infer causal influence on your behavior or views.",
        "Content signals do not indicate your agreement, interest, or preferences.",
        "The presence of commercial/political content is not evidence of targeting.",
    ]

    # Detection limitations
    limits["detection_limitations"] = [
        "Inferences are aggregated from other evidence bundles.",
        "Each source bundle has its own detection limitations.",
        "Surfacing threshold (2+ items) may exclude valid single-item signals.",
        "Signal detection depends on keyword matching and metadata availability.",
    ]

    # What we explicitly do NOT claim
    limits["explicit_non_claims"] = [
        "We do NOT claim to know your demographic profile.",
        "We do NOT claim to know your political views or leanings.",
        "We do NOT claim to know your purchase intent.",
        "We do NOT claim to predict algorithm behavior.",
        "We do NOT claim these signals were used for targeting.",
    ]

    return limits


def generate_inferences_analysis_copy(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate plain-English analysis copy for the Inferences tab.

    CRITICAL: All copy must emphasize these are CONTENT SIGNALS, not user profiles.

    Returns:
        Dict with analysis sections
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    analysis = {}

    surfaced = observations.get("surfaced_inferences", [])
    surfaced_count = observations.get("surfaced_count", 0)

    if n_items < 10:
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, there isn't enough data to reliably identify content signals.",
            "cited_fields": ["meta.n_items"],
            "quality": "insufficient_data"
        }
    elif surfaced_count == 0:
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, no content signals met the surfacing threshold (2+ items required).",
            "cited_fields": [
                "meta.n_items",
                "observations.surfaced_count",
                "measurements.surfacing_threshold"
            ],
            "quality": "ok"
        }
    else:
        high_conf = sum(1 for s in surfaced if s.get("confidence") == "high")
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, {surfaced_count} content signals were detected ({high_conf} with high confidence).",
            "cited_fields": [
                "meta.n_items",
                "observations.surfaced_count",
                "measurements.confidence_breakdown"
            ],
            "quality": "ok"
        }

    # Signal summary
    if surfaced:
        signal_names = [s["signal"] for s in surfaced[:4]]
        analysis["signals_summary"] = {
            "text": f"Detected signals: {'; '.join(signal_names)}.",
            "cited_fields": ["observations.surfaced_inferences"],
            "quality": "ok"
        }

    # CRITICAL: Limitations disclaimer (always include)
    analysis["limitations_summary"] = {
        "text": (
            "Important: These are signals present in the content, NOT inferences about you. "
            "We cannot determine why this content was shown or what targeting was used."
        ),
        "cited_fields": ["limits.epistemic_boundaries"],
        "quality": "ok"
    }

    return analysis


def generate_inferences_talk_response(
    bundle: Dict[str, Any],
    question: str
) -> Dict[str, Any]:
    """
    Generate a Talk-to-Algorithm response for the Inferences tab.

    CRITICAL: Responses must NEVER claim to know user identity, beliefs,
    why content was shown, or targeting criteria.
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    surfaced = observations.get("surfaced_inferences", [])

    response = {
        "what_we_observed": {
            "intro": f"In this scan of {n_items} posts, we detected these content signals:",
            "facts": [],
            "cited_fields": []
        },
        "what_it_might_mean": {
            "intro": "These signals could indicate:",
            "hypotheses": []
        },
        "what_we_cannot_know": {
            "intro": "Critical limitations (please read carefully):",
            "limits": [],
            "cited_fields": []
        },
        "what_you_can_try": {
            "intro": "To learn more:",
            "actions": []
        }
    }

    # Observations
    if surfaced:
        for inf in surfaced[:4]:
            response["what_we_observed"]["facts"].append(
                f"{inf['signal']}: {inf['detail']}"
            )
    else:
        response["what_we_observed"]["facts"].append(
            "No content signals met the surfacing threshold."
        )
        response["what_we_observed"]["facts"].append(
            f"The scan analyzed {n_items} posts total."
        )

    response["what_we_observed"]["cited_fields"] = [
        "observations.surfaced_inferences",
        "observations.surfaced_count"
    ]

    # Hypotheses (carefully neutral)
    response["what_it_might_mean"]["hypotheses"] = [
        {
            "label": "Possibility A",
            "text": "These signals reflect the content that was available during this scan window."
        },
        {
            "label": "Possibility B",
            "text": "Content patterns may reflect platform-wide trends, not individual targeting."
        },
        {
            "label": "Possibility C",
            "text": "Signal presence does not indicate these topics were specifically chosen for you."
        }
    ]

    # Limits - CRITICAL for this tab
    epistemic = limits.get("epistemic_boundaries", [])
    explicit_non = limits.get("explicit_non_claims", [])

    response["what_we_cannot_know"]["limits"] = (epistemic[:3] if epistemic else []) + (explicit_non[:2] if explicit_non else [])
    if not response["what_we_cannot_know"]["limits"]:
        response["what_we_cannot_know"]["limits"] = [
            "We cannot infer anything about you from this content.",
            "We cannot know why this content was shown.",
        ]

    response["what_we_cannot_know"]["cited_fields"] = [
        "limits.epistemic_boundaries",
        "limits.explicit_non_claims"
    ]

    # Actions
    response["what_you_can_try"]["actions"] = [
        "Run scans at different times to compare content signals.",
        "Check your platform's ad preferences to see declared interests.",
        "Compare signals across different platforms.",
        "Remember: content signals are not user profiles."
    ]

    return response


def format_inferences_talk_response_as_text(response: Dict[str, Any]) -> str:
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
