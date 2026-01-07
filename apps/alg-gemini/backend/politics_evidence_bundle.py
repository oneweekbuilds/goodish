"""
Evidence Bundle Builder for Politics & Worldview Tab

This module produces an Evidence Bundle for the Politics & Worldview tab.
All plain-English analysis and Talk-to-Algorithm responses MUST be generated
from this bundle only - never from raw feed text or generic explanations.

Epistemic boundaries (enforced):
- Cannot infer user beliefs, intent, or ideology
- Cannot infer political persuasion goals of creators
- Cannot know why algorithm showed this content
- Cannot assess actual political balance/bias

Evidence Bundle Structure:
{
    "meta": { ... },           # Scan metadata
    "observations": { ... },   # Hard facts from data (content categories, hashtags)
    "measurements": { ... },   # Classifier-based estimates
    "limits": { ... }          # What is missing or uncertain
}
"""

from datetime import datetime
from typing import Dict, Any, List
from collections import Counter
from text_signals import extract_text_signals, has_analyzable_text
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


def build_politics_evidence_bundle(scan_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build an Evidence Bundle for the Politics & Worldview tab from a scan result.

    The Evidence Bundle is the SINGLE SOURCE OF TRUTH for all analysis copy
    and Talk-to-Algorithm responses in the Politics & Worldview tab.

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

    bundle = {
        "meta": meta,
        "observations": observations,
        "measurements": measurements,
        "limits": limits,
    }

    # Accuracy scaffolding (additive, non-breaking)
    accuracy_payload = _build_accuracy_section(scan_metadata, feed_items, observations)
    bundle.update(accuracy_payload)
    return bundle


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
    Compute coverage metadata for the politics evidence bundle.

    Coverage Contract (enforced):
    - n_items_total = n_items_included + n_items_excluded
    - exclusion_reasons counts ONLY truly excluded items (sum == n_items_excluded)
    - quality_flags counts issues among INCLUDED items (does not affect coverage counts)

    For Politics bundle: Items WITHOUT text are EXCLUDED because keyword matching
    requires text content. Uses text_signals.py for canonical text access.

    Returns:
        Coverage dict with standardized fields
    """
    n_items_total = len(feed_items)
    exclusion_reasons: Dict[str, int] = {}
    quality_flags: Dict[str, int] = {}

    # Track items excluded for mechanical reasons
    n_missing_text = 0

    for item in feed_items:
        # Use canonical text_signals utility for text extraction
        # This handles MOBILE_VIDEO OCR text (on_screen_labels) properly
        text_result = extract_text_signals(item)
        has_text = bool(text_result["content_text"])

        if not has_text:
            n_missing_text += 1
        else:
            # Track quality flags for included items
            for flag, count in text_result["quality_flags"].items():
                if flag not in ["missing_text_fields"]:  # Don't count missing as quality flag
                    quality_flags[flag] = quality_flags.get(flag, 0) + count

    # Items without text are EXCLUDED (cannot analyze for political keywords)
    # Contract: sum(exclusion_reasons.values()) == n_items_excluded
    n_items_excluded = n_missing_text
    n_items_included = n_items_total - n_items_excluded

    if n_missing_text > 0:
        exclusion_reasons["missing_text"] = n_missing_text

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

    Observations are deterministic counts - no inference or interpretation.
    Politics tab focuses on hashtags, content categories, and topic mentions.
    Uses text_signals.py for canonical text access (including MOBILE_VIDEO OCR).
    """
    observations = {}
    n_items = len(feed_items)
    observations["total_posts_seen"] = n_items

    # Extract hashtags from all feed items
    hashtag_counts = Counter()
    for item in feed_items:
        content_text = item.get("content_text", {})
        hashtags = content_text.get("hashtags", [])
        for hashtag in hashtags:
            if hashtag:
                hashtag_counts[hashtag.lower().strip("#")] = hashtag_counts.get(
                    hashtag.lower().strip("#"), 0
                ) + 1

    if hashtag_counts:
        observations["top_hashtags"] = [
            {"tag": tag, "count": count}
            for tag, count in hashtag_counts.most_common(10)
        ]
        observations["unique_hashtags_count"] = len(hashtag_counts)
    else:
        observations["top_hashtags"] = []
        observations["unique_hashtags_count"] = 0

    # Content categories/topics if available
    category_counts = Counter()
    for item in feed_items:
        categories = item.get("content_categories", [])
        for cat in categories:
            if cat:
                category_counts[cat] += 1

    if category_counts:
        observations["content_categories"] = [
            {"category": cat, "count": count}
            for cat, count in category_counts.most_common(5)
        ]
    else:
        observations["content_categories"] = []

    # Count items with any political/news indicators (keyword-based, not inference)
    political_keywords = [
        "politics", "election", "vote", "congress", "senate", "democrat",
        "republican", "liberal", "conservative", "government", "policy",
        "president", "legislation", "partisan"
    ]
    news_keywords = [
        "breaking", "news", "report", "journalist", "media", "coverage"
    ]

    political_signal_count = 0
    news_signal_count = 0

    for item in feed_items:
        # Use canonical text_signals utility for text extraction
        # This properly handles MOBILE_VIDEO OCR text (on_screen_labels)
        text_result = extract_text_signals(item)
        text_content = text_result["content_text"]  # Already normalized/lowercased

        if any(kw in text_content for kw in political_keywords):
            political_signal_count += 1
        if any(kw in text_content for kw in news_keywords):
            news_signal_count += 1

    observations["items_with_political_keywords"] = political_signal_count
    observations["items_with_news_keywords"] = news_signal_count

    if n_items > 0:
        observations["political_keyword_rate_percent"] = round(
            (political_signal_count / n_items) * 100, 1
        )
        observations["news_keyword_rate_percent"] = round(
            (news_signal_count / n_items) * 100, 1
        )

    return observations


def _build_measurements(
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Build the measurements section with classifier-based estimates.

    Note: We do NOT classify political leaning or bias - this would
    violate epistemic boundaries. We only measure presence of keywords.
    """
    measurements = {}
    n_items = len(feed_items)

    # Keyword density measurement (no political inference)
    measurements["keyword_density"] = {
        "value": {
            "political_keywords_present": n_items > 0,
            "sample_size": n_items,
        },
        "method": "keyword_matching",
        "quality": "ok" if n_items >= 10 else "low_sample",
        "notes": "Keyword presence detection only. No political leaning inference."
    }

    return measurements


def _build_limits(
    scan_metadata: Dict[str, Any],
    aggregates: Dict[str, Any],
    feed_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Build the limits section describing what is missing or uncertain.

    Politics tab has STRICT epistemic boundaries.
    """
    limits = {}
    n_items = len(feed_items)

    # Sample size limitations
    if n_items < 10:
        limits["sample_size_limitations"] = [
            f"Only {n_items} posts in this scan. Patterns may not be representative."
        ]
    elif n_items < 30:
        limits["sample_size_limitations"] = [
            f"Sample size of {n_items} posts. Conclusions should be tentative."
        ]
    else:
        limits["sample_size_limitations"] = [
            f"Sample of {n_items} posts from a single scan session."
        ]

    # STRICT epistemic boundaries for politics
    limits["epistemic_boundaries"] = [
        "We cannot infer your political beliefs, ideology, or intent.",
        "We cannot determine the political persuasion goals of any creator.",
        "We cannot know why the algorithm showed you this content.",
        "We cannot assess whether your feed is politically 'balanced' or 'biased'.",
        "Presence of political keywords does not indicate your agreement or interest.",
        "We cannot predict how this content might influence your views.",
    ]

    # Detection limitations
    limits["detection_limitations"] = [
        "Keyword matching may miss nuanced political content.",
        "Content categorization is based on explicit signals, not interpretation.",
        "Hashtag analysis reflects creator labeling, not content substance.",
    ]

    # Coverage/exclusions
    limits["coverage_notes"] = [
        "Analysis covers only content captured in this scan.",
        "Visual political content (images, video) is not analyzed for political signals.",
    ]

    return limits


def _build_accuracy_section(
    scan_metadata: Dict[str, Any],
    feed_items: List[Dict[str, Any]],
    observations: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build additive accuracy scaffolding for the Politics tab.

    This mirrors Ads evidence-chain parity without altering existing outputs.
    """
    contract = get_tab_accuracy_contract("politics")
    platform = scan_metadata.get("platform")
    modality = scan_metadata.get("source_type", "UNKNOWN")
    evidence_items: List[EvidenceItem] = []
    insight_evidence_ids: List[str] = []

    keywords = [
        "politics", "election", "vote", "congress", "senate", "democrat",
        "republican", "liberal", "conservative", "government", "policy",
        "president", "legislation", "partisan",
    ]
    news_keywords = ["breaking", "news", "report", "journalist", "media", "coverage"]

    def _make_reliability(method: str) -> MethodReliability:
        score = get_method_reliability(method) or 0.0
        return MethodReliability(
            method=method,
            base_reliability=score,
            effective_reliability=score,
        )

    for idx, item in enumerate(feed_items):
        text_result = extract_text_signals(item)
        content_text = text_result["content_text"]
        has_pol = any(kw in content_text for kw in keywords)
        has_news = any(kw in content_text for kw in news_keywords)

        if not (has_pol or has_news):
            continue

        item_context = ItemContext(
            item_index=item.get("position_in_feed", idx),
            platform=platform,
            modality=modality,
            item_type=item.get("content_type"),
            platform_id=item.get("post_id"),
        )

        evidence_id = f"pol-kw-{idx:03d}"
        evidence_items.append(
            EvidenceItem(
                evidence_id=evidence_id,
                source_item_index=item_context.item_index,
                signal_type="political_keyword" if has_pol else "news_keyword",
                signal_subtype="political" if has_pol else "news",
                detection_method="KEYWORD_MATCH",
                method_reliability=_make_reliability("KEYWORD_MATCH"),
                source="text_signal",
                item_context=item_context,
            )
        )
        insight_evidence_ids.append(evidence_id)

    # Construct a single aggregated insight for political/news presence
    claim_status: str
    if len(insight_evidence_ids) >= contract.min_evidence_for_final:
        claim_status = "FINAL"
    elif len(insight_evidence_ids) > 0:
        claim_status = "PRELIMINARY"
    else:
        claim_status = "ABSTAIN"

    insight = Insight(
        insight_id="politics-keyword-presence",
        claim_type="political_signal",
        claim_text="Political or news keywords detected in this scan.",
        claim_status=claim_status,
        evidence_ids=insight_evidence_ids,
        abstention_flag=claim_status == "ABSTAIN",
        abstention_reason=(
            None if claim_status != "ABSTAIN" else "No political or news indicators detected"
        ),
        preliminary_upgrade_path="Collect more keyword-backed items to upgrade to FINAL",
    )

    # Conflict resolution (politics parity)
    resolver = ConflictResolver()
    conflict_resolutions, conflict_metrics = resolver.process(
        evidence_items, tab_name="politics"
    )

    # Annotate evidence with conflict outcomes
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

    # Evidence chain enforcement (Phase 5 parity)
    enforced_insights, ec_metrics = enforce_evidence_chain(
        [insight], evidence_items, tab_name="politics", orphan_threshold=0.20
    )

    # Independent critic pass
    critic = Critic()
    critic_insights = critic.evaluate(
        "politics", enforced_insights, evidence_items, conflict_metrics=conflict_metrics
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
    }


def generate_politics_analysis_copy(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate plain-English analysis copy for the Politics & Worldview tab
    using ONLY the Evidence Bundle fields.

    Strict accuracy requirements:
    - Anchors claims to "in this scan / in this sample"
    - NEVER infers beliefs, ideology, bias, or intent
    - States uncertainty prominently

    Returns:
        Dict with analysis sections
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    analysis = {}

    # Primary insight
    political_count = observations.get("items_with_political_keywords", 0)
    political_rate = observations.get("political_keyword_rate_percent", 0)
    news_count = observations.get("items_with_news_keywords", 0)

    if n_items < 10:
        analysis["primary_insight"] = {
            "text": f"In this scan, we captured {n_items} posts. More data is needed to identify any patterns.",
            "cited_fields": ["meta.n_items"],
            "quality": "insufficient_data"
        }
    elif political_count == 0 and news_count == 0:
        analysis["primary_insight"] = {
            "text": f"In this scan of {n_items} posts, no posts contained political or news keywords.",
            "cited_fields": [
                "meta.n_items",
                "observations.items_with_political_keywords",
                "observations.items_with_news_keywords"
            ],
            "quality": "ok"
        }
    else:
        parts = [f"In this scan of {n_items} posts"]
        if political_count > 0:
            parts.append(f"{political_count} contained political keywords ({political_rate}%)")
        if news_count > 0:
            parts.append(f"{news_count} contained news-related keywords")

        analysis["primary_insight"] = {
            "text": ", ".join(parts) + ".",
            "cited_fields": [
                "meta.n_items",
                "observations.items_with_political_keywords",
                "observations.political_keyword_rate_percent"
            ],
            "quality": "ok"
        }

    # Hashtag insight
    top_hashtags = observations.get("top_hashtags", [])
    if top_hashtags:
        tag_names = [h["tag"] for h in top_hashtags[:5]]
        analysis["hashtag_insight"] = {
            "text": f"Most common hashtags in this scan: #{', #'.join(tag_names)}.",
            "cited_fields": ["observations.top_hashtags"],
            "quality": "ok"
        }

    # Limitations summary - ALWAYS include for politics
    epistemic = limits.get("epistemic_boundaries", [])
    analysis["limitations_summary"] = {
        "text": (
            "Important: This analysis cannot determine political bias, your beliefs, "
            "or why content was shown to you. Only keyword presence is measured."
        ),
        "cited_fields": ["limits.epistemic_boundaries"],
        "quality": "ok"
    }

    return analysis


def generate_politics_talk_response(
    bundle: Dict[str, Any],
    question: str
) -> Dict[str, Any]:
    """
    Generate a Talk-to-Algorithm response for Politics & Worldview tab.

    Response structure:
    1. What we observed (cites 2-4 Evidence Bundle fields)
    2. What it might mean (2-3 labeled hypotheses; no certainty)
    3. What we cannot know (MUST cite epistemic boundaries)
    4. What you can try (2-4 non-judgmental actions)
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    political_count = observations.get("items_with_political_keywords", 0)
    news_count = observations.get("items_with_news_keywords", 0)
    top_hashtags = observations.get("top_hashtags", [])

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
            "intro": "Critical limitations:",
            "limits": [],
            "cited_fields": []
        },
        "what_you_can_try": {
            "intro": "If you want to explore:",
            "actions": []
        }
    }

    # Observations
    if political_count > 0:
        response["what_we_observed"]["facts"].append(
            f"{political_count} posts contained political keywords."
        )
    if news_count > 0:
        response["what_we_observed"]["facts"].append(
            f"{news_count} posts contained news-related keywords."
        )
    if top_hashtags:
        tag_names = [h["tag"] for h in top_hashtags[:3]]
        response["what_we_observed"]["facts"].append(
            f"Top hashtags: #{', #'.join(tag_names)}."
        )
    if len(response["what_we_observed"]["facts"]) == 0:
        response["what_we_observed"]["facts"].append(
            "No political or news keywords were detected."
        )
        response["what_we_observed"]["facts"].append(
            f"This scan captured {n_items} posts total."
        )

    response["what_we_observed"]["cited_fields"] = [
        "observations.items_with_political_keywords",
        "observations.items_with_news_keywords",
        "observations.top_hashtags"
    ]

    # Hypotheses (neutral, non-inferential)
    response["what_it_might_mean"]["hypotheses"] = [
        {
            "label": "Possibility A",
            "text": "Content may reflect trending topics during this time window."
        },
        {
            "label": "Possibility B",
            "text": "Hashtag usage reflects how creators labeled their content."
        },
        {
            "label": "Possibility C",
            "text": "Keyword presence does not indicate targeted political messaging."
        }
    ]

    # Limits - CRITICAL for politics tab
    epistemic = limits.get("epistemic_boundaries", [])
    response["what_we_cannot_know"]["limits"] = epistemic[:4] if epistemic else [
        "We cannot infer your political beliefs or ideology.",
        "We cannot determine if content is politically biased.",
        "We cannot know why the algorithm showed this content."
    ]
    response["what_we_cannot_know"]["cited_fields"] = ["limits.epistemic_boundaries"]

    # Actions
    response["what_you_can_try"]["actions"] = [
        "Run scans at different times to compare keyword patterns.",
        "Review your platform's content preferences if available.",
        "Compare this scan to scans on different platforms.",
        "Note that keyword presence is not the same as content analysis."
    ]

    return response


def format_politics_talk_response_as_text(response: Dict[str, Any]) -> str:
    """Format a structured Talk response as readable text."""
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
