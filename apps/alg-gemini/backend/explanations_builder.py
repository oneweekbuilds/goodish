"""
Explanations Builder Module - Evidence Explanations Trust Layer (Prompt 7)

This module provides a shared utility for generating "explanations" objects that
help users understand which signals fired, which didn't, and why confidence is
high/medium/low - all in plain English with no technical jargon.

Explanations Object Structure:
{
    "summary": str,                 # Plain-English 1-2 sentence summary
    "signals_fired": list[dict],    # Signals that were detected
    "signals_not_evaluated": list[dict],  # Signals we couldn't check (missing modality)
    "signals_not_found": list[dict],      # Signals we looked for but didn't find
    "confidence_drivers": list[dict],     # What's driving confidence up/down
    "what_this_does_not_mean": list[str], # Epistemic boundaries
    "next_best_actions": list[str]        # User agency suggestions
}

Signal Entry Structure:
{
    "id": str,           # stable identifier
    "label": str,        # plain English label
    "why": str,          # explanation of why it fired/didn't fire
    "evidence_ref": list # references to bundle fields
}

Coverage Thresholds (from Prompt 6):
- OCR coverage low: < 60%
- Audio not analyzed: audio_analyzed=false or availability != present_processed

Wording Rules:
- No jargon: translate "VAD", "ASR", "modalities", "thresholds"
- Soften "not found" when coverage is weak
- Use "signals_not_evaluated" for missing modalities
"""

from typing import Dict, Any, List, Optional, Literal
from signal_fusion_engine import get_fusion_summary_for_explanations


# Coverage thresholds (consistent with claims_generator.py)
OCR_COVERAGE_LOW_THRESHOLD = 60  # percent
SAMPLE_SIZE_MIN = 10  # minimum items for reliable analysis


# =============================================================================
# SIGNAL DEFINITIONS
# =============================================================================

# Ads Tab Signals
ADS_SIGNALS = {
    "labeled_ad_disclosure": {
        "label": "Platform-labeled ads",
        "category": "visual_and_metadata",
    },
    "promo_cta_visual": {
        "label": "Promotional call-to-action visible",
        "category": "visual",
    },
    "paid_disclosure_visual": {
        "label": "Paid partnership disclosure visible",
        "category": "visual",
    },
    "brand_mention_text": {
        "label": "Brand or product mentions in text",
        "category": "text",
    },
    "promo_language_audio": {
        "label": "Promotional language in spoken audio",
        "category": "audio",
    },
    "ad_disclosure_audio": {
        "label": "Ad disclosure mentioned in audio",
        "category": "audio",
    },
}

# Politics Tab Signals
POLITICS_SIGNALS = {
    "political_keyword_text": {
        "label": "Political keywords in text",
        "category": "text",
    },
    "political_figure_mention": {
        "label": "Political figures mentioned",
        "category": "text",
    },
    "political_language_audio": {
        "label": "Political language in spoken audio",
        "category": "audio",
    },
    "political_visual_cue": {
        "label": "Political visual elements",
        "category": "visual",
    },
}

# Patterns Tab Signals
PATTERNS_SIGNALS = {
    "topic_repetition": {
        "label": "Repeated topic patterns",
        "category": "text",
    },
    "creator_concentration": {
        "label": "Concentrated creator sources",
        "category": "metadata",
    },
    "content_similarity": {
        "label": "Similar content clusters",
        "category": "text",
    },
}

# Creators Tab Signals
CREATORS_SIGNALS = {
    "verified_accounts": {
        "label": "Verified account presence",
        "category": "metadata",
    },
    "creator_diversity": {
        "label": "Diversity of content creators",
        "category": "metadata",
    },
    "creator_mentions_audio": {
        "label": "Creator mentions in audio",
        "category": "audio",
    },
}

# Inferences Tab Signals
INFERENCES_SIGNALS = {
    "interest_topic_signal": {
        "label": "Apparent interest topic signals",
        "category": "aggregated",
    },
    "commercial_exposure_signal": {
        "label": "Commercial exposure patterns",
        "category": "aggregated",
    },
    "content_type_preference": {
        "label": "Content type preferences",
        "category": "aggregated",
    },
}

# Public Figure Signals (Prompt 5)
# NOTE: These detect TITLES and INSTITUTIONAL CUES, not identities.
PUBLIC_FIGURE_SIGNALS = {
    "public_figure_text": {
        "label": "Public office title in text",
        "category": "text",
    },
    "public_figure_audio": {
        "label": "Public office title in audio",
        "category": "audio",
    },
    "public_figure_ocr": {
        "label": "Institutional visual cues",
        "category": "visual",
    },
    "public_figure_verified": {
        "label": "Verified account badge",
        "category": "metadata",
    },
}


def _get_coverage_status(
    feature_collection: Optional[Dict[str, Any]],
    n_items: int
) -> Dict[str, Any]:
    """
    Compute coverage status from feature collection.

    Returns dict with:
        - ocr_coverage_percent: float
        - ocr_coverage_sufficient: bool
        - audio_analyzed: bool
        - audio_error_code: str or None
        - sample_size_sufficient: bool
    """
    status = {
        "ocr_coverage_percent": 0.0,
        "ocr_coverage_sufficient": False,
        "audio_analyzed": False,
        "audio_error_code": None,
        "sample_size_sufficient": n_items >= SAMPLE_SIZE_MIN,
    }

    if not feature_collection:
        return status

    coverage = feature_collection.get("coverage", {})

    # OCR coverage
    vision_coverage = coverage.get("vision", {})
    ocr_pct = vision_coverage.get("ocr_coverage_percent", 0)
    status["ocr_coverage_percent"] = ocr_pct
    status["ocr_coverage_sufficient"] = ocr_pct >= OCR_COVERAGE_LOW_THRESHOLD

    # Audio coverage
    audio_coverage = coverage.get("audio", {})
    status["audio_analyzed"] = audio_coverage.get("audio_analyzed", False)

    # Get audio error code if present
    items = feature_collection.get("items", [])
    if items:
        first_item = items[0]
        audio_features = first_item.get("audio_features", {})
        status["audio_error_code"] = audio_features.get("error_reason_code")

    return status


def _translate_error_code(code: Optional[str]) -> str:
    """
    Translate technical error codes to plain English.
    """
    translations = {
        "FFMPEG_NOT_FOUND": "required audio processing software is not installed",
        "WHISPER_NOT_AVAILABLE": "speech recognition is not available",
        "NO_AUDIO_STREAM": "this video has no audio track",
        "AUDIO_TOO_SHORT": "the audio was too short to analyze",
        "TRANSCRIPTION_FAILED": "speech recognition could not process the audio",
        "SKIPPED_NO_SPEECH": "no speech was detected (music or ambient audio only)",
    }
    return translations.get(code, "audio processing was not completed")


def _build_not_evaluated_signals(
    coverage_status: Dict[str, Any],
    signal_categories: List[str],
    tab: str
) -> List[Dict[str, Any]]:
    """
    Build list of signals that couldn't be evaluated due to missing modalities.
    """
    not_evaluated = []

    # Check audio signals
    if "audio" in signal_categories and not coverage_status["audio_analyzed"]:
        error_reason = _translate_error_code(coverage_status.get("audio_error_code"))
        not_evaluated.append({
            "id": f"{tab}_audio_signals",
            "label": "Audio-based signals",
            "why": f"Audio was not analyzed for this scan because {error_reason}.",
            "evidence_ref": ["limits.audio_analysis_limitations"],
        })

    # Check visual signals when OCR coverage is zero
    if "visual" in signal_categories and coverage_status["ocr_coverage_percent"] == 0:
        not_evaluated.append({
            "id": f"{tab}_visual_text_signals",
            "label": "On-screen text signals",
            "why": "On-screen text could not be extracted from this video.",
            "evidence_ref": ["limits.ocr_extraction_limitations"],
        })

    return not_evaluated


def _build_confidence_drivers(
    coverage_status: Dict[str, Any],
    signals_fired: List[Dict[str, Any]],
    signals_not_found: List[Dict[str, Any]],
    signals_not_evaluated: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Build list of factors driving confidence up or down.
    """
    drivers = []

    # Sample size
    if coverage_status["sample_size_sufficient"]:
        drivers.append({
            "direction": "up",
            "label": "Adequate sample size",
            "detail": "Enough posts were analyzed for pattern detection.",
        })
    else:
        drivers.append({
            "direction": "down",
            "label": "Small sample size",
            "detail": "Fewer posts were captured, so patterns may not be representative.",
        })

    # OCR coverage
    ocr_pct = coverage_status["ocr_coverage_percent"]
    if ocr_pct >= 80:
        drivers.append({
            "direction": "up",
            "label": "Good text visibility",
            "detail": f"On-screen text was extracted from {ocr_pct:.0f}% of items.",
        })
    elif ocr_pct >= OCR_COVERAGE_LOW_THRESHOLD:
        drivers.append({
            "direction": "up",
            "label": "Moderate text visibility",
            "detail": f"On-screen text was extracted from {ocr_pct:.0f}% of items.",
        })
    elif ocr_pct > 0:
        drivers.append({
            "direction": "down",
            "label": "Limited text visibility",
            "detail": f"On-screen text was only extracted from {ocr_pct:.0f}% of items. Some visual signals may have been missed.",
        })
    else:
        drivers.append({
            "direction": "down",
            "label": "No text extracted",
            "detail": "On-screen text could not be extracted. Visual text-based signals are unavailable.",
        })

    # Audio
    if coverage_status["audio_analyzed"]:
        drivers.append({
            "direction": "up",
            "label": "Audio analyzed",
            "detail": "Spoken content was transcribed and analyzed.",
        })
    else:
        error_reason = _translate_error_code(coverage_status.get("audio_error_code"))
        drivers.append({
            "direction": "down",
            "label": "Audio not analyzed",
            "detail": f"Audio signals are unavailable because {error_reason}.",
        })

    # Signal detection results
    if signals_fired:
        drivers.append({
            "direction": "up",
            "label": f"{len(signals_fired)} signal(s) detected",
            "detail": "Specific patterns were found in the content.",
        })

    if signals_not_evaluated:
        drivers.append({
            "direction": "down",
            "label": f"{len(signals_not_evaluated)} signal type(s) could not be checked",
            "detail": "Some signal types were unavailable for this scan.",
        })

    return drivers


def _soften_not_found_text(
    base_why: str,
    coverage_status: Dict[str, Any],
    signal_category: str
) -> str:
    """
    Soften "not found" language when coverage is insufficient.
    """
    # Check if we should soften based on coverage
    should_soften = False
    reason = ""

    if signal_category == "visual" and not coverage_status["ocr_coverage_sufficient"]:
        should_soften = True
        ocr_pct = coverage_status["ocr_coverage_percent"]
        reason = f"only {ocr_pct:.0f}% of on-screen text was captured"
    elif signal_category == "audio" and not coverage_status["audio_analyzed"]:
        should_soften = True
        reason = "audio was not analyzed"
    elif signal_category in ("visual", "audio"):
        if not coverage_status["ocr_coverage_sufficient"] and not coverage_status["audio_analyzed"]:
            should_soften = True
            reason = "both visual text and audio coverage were limited"

    if should_soften:
        return f"Not detected in this scan. Note: {reason}, so this signal may have been present but not captured."

    return base_why


# =============================================================================
# ADS TAB EXPLANATIONS
# =============================================================================

def build_ads_explanations(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build explanations object for the Ads & Influence tab.
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    coverage_status = _get_coverage_status(feature_collection, n_items)

    signals_fired = []
    signals_not_found = []
    signals_not_evaluated = []

    # Get spectrum data
    spectrum = observations.get("commercial_exposure_spectrum", {})
    stacked_bar = spectrum.get("stacked_bar", {})
    labeled_ads = stacked_bar.get("labeled_ads", 0)
    unlabeled_promo = stacked_bar.get("unlabeled_promotion", 0)

    # Check labeled ads signal
    if labeled_ads > 0:
        signals_fired.append({
            "id": "labeled_ad_disclosure",
            "label": "Platform-labeled ads",
            "why": f"{labeled_ads} posts were marked as ads by the platform.",
            "evidence_ref": ["observations.commercial_exposure_spectrum.stacked_bar.labeled_ads"],
        })
    else:
        signals_not_found.append({
            "id": "labeled_ad_disclosure",
            "label": "Platform-labeled ads",
            "why": _soften_not_found_text(
                "No posts were marked as ads by the platform.",
                coverage_status,
                "visual_and_metadata"
            ),
            "evidence_ref": ["observations.commercial_exposure_spectrum.stacked_bar.labeled_ads"],
        })

    # Check promo signals
    promo_signals = observations.get("promo_signals", {})
    n_high_conf = promo_signals.get("n_high_confidence", 0)

    if n_high_conf > 0 or unlabeled_promo > 0:
        signal_types = promo_signals.get("signal_types_detected", [])
        signals_fired.append({
            "id": "promo_cta_visual",
            "label": "Promotional patterns detected",
            "why": f"{unlabeled_promo} posts showed promotional signals like calls-to-action or brand mentions.",
            "evidence_ref": ["observations.promo_signals", "observations.unlabeled_promo_evidence"],
        })
    else:
        signals_not_found.append({
            "id": "promo_cta_visual",
            "label": "Promotional patterns",
            "why": _soften_not_found_text(
                "No promotional calls-to-action or undisclosed brand mentions were detected.",
                coverage_status,
                "visual"
            ),
            "evidence_ref": ["observations.promo_signals"],
        })

    # Check vision cues (Prompt 4)
    vision_cues_detected = limits.get("vision_cues_detected", False)
    if vision_cues_detected:
        signals_fired.append({
            "id": "paid_disclosure_visual",
            "label": "Paid partnership disclosure visible",
            "why": "Visual disclosure cues like 'Ad' or 'Sponsored' labels were detected on screen.",
            "evidence_ref": ["limits.vision_analysis_limitations"],
        })
    else:
        signals_not_found.append({
            "id": "paid_disclosure_visual",
            "label": "Paid partnership disclosure visible",
            "why": _soften_not_found_text(
                "No visual 'Ad' or 'Sponsored' labels were detected on screen.",
                coverage_status,
                "visual"
            ),
            "evidence_ref": ["limits.vision_analysis_limitations"],
        })

    # Add not-evaluated audio signals
    signals_not_evaluated.extend(
        _build_not_evaluated_signals(coverage_status, ["audio"], "ads")
    )

    # Build confidence drivers
    confidence_drivers = _build_confidence_drivers(
        coverage_status, signals_fired, signals_not_found, signals_not_evaluated
    )

    # Build summary
    total_promo = labeled_ads + unlabeled_promo
    if total_promo > 0:
        summary = f"In this scan of {n_items} posts, {total_promo} showed promotional content. "
        if signals_not_evaluated:
            summary += "Some signal types could not be checked due to limited audio coverage."
        else:
            summary += "Multiple signal types were analyzed for commercial content detection."
    else:
        if coverage_status["can_make_high_confidence_claims"] if "can_make_high_confidence_claims" in coverage_status else (coverage_status["ocr_coverage_sufficient"] or coverage_status["audio_analyzed"]):
            summary = f"No promotional content was detected in this scan of {n_items} posts."
        else:
            summary = f"No promotional content was detected in this scan of {n_items} posts, though limited coverage may have caused some to be missed."

    # What this does not mean
    what_this_does_not_mean = [
        "This does not tell you why these ads were shown to you.",
        "We cannot determine the advertiser's targeting criteria.",
        "Absence of ads in this scan does not mean you won't see ads in future scrolls.",
    ]
    if not coverage_status["audio_analyzed"]:
        what_this_does_not_mean.append(
            "Verbal promotions or sponsorship mentions in audio could not be detected."
        )

    # Next best actions
    next_best_actions = [
        "Check your platform's ad preferences to see what interests are associated with your account.",
        "Run another scan at a different time to compare ad patterns.",
    ]
    if unlabeled_promo > 0:
        next_best_actions.insert(0,
            "Look for disclosure labels (#ad, 'Sponsored') when viewing similar content."
        )

    return {
        "summary": summary,
        "signals_fired": signals_fired,
        "signals_not_evaluated": signals_not_evaluated,
        "signals_not_found": signals_not_found,
        "confidence_drivers": confidence_drivers,
        "what_this_does_not_mean": what_this_does_not_mean,
        "next_best_actions": next_best_actions[:4],
    }


# =============================================================================
# POLITICS TAB EXPLANATIONS
# =============================================================================

def build_politics_explanations(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build explanations object for the Politics & Worldview tab.

    Prompt 6 Integration:
    - Uses fused_public_figure_signals if available for unified confidence
    - Falls back to raw public_figure_signals for backward compatibility
    - Surfaces conflict resolution notes from fusion engine
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    # Prompt 6: Prefer fused signals over raw signals
    # fused_public_figure_signals contains cross-modal arbitration and conflict resolution
    fused_pf_signals = bundle.get("fused_public_figure_signals", {})
    raw_pf_signals = bundle.get("public_figure_signals", {})

    # Use fused if available and marked as fused, otherwise fall back to raw
    use_fused = fused_pf_signals and fused_pf_signals.get("_fused", False)
    public_figure_signals = fused_pf_signals if use_fused else raw_pf_signals

    n_items = meta.get("n_items", 0)
    coverage_status = _get_coverage_status(feature_collection, n_items)

    signals_fired = []
    signals_not_found = []
    signals_not_evaluated = []

    # Get political content data
    spectrum = observations.get("political_content_spectrum", {})
    stacked_bar = spectrum.get("stacked_bar", {})
    political_items = stacked_bar.get("political", 0)
    political_rate = observations.get("political_rate_percent")

    # Check political keyword signal
    if political_items > 0:
        signals_fired.append({
            "id": "political_keyword_text",
            "label": "Political keywords in text",
            "why": f"{political_items} posts contained political keywords or topics.",
            "evidence_ref": ["observations.political_content_spectrum"],
        })
    else:
        signals_not_found.append({
            "id": "political_keyword_text",
            "label": "Political keywords in text",
            "why": _soften_not_found_text(
                "No political keywords were detected in the text content.",
                coverage_status,
                "text"
            ),
            "evidence_ref": ["observations.political_content_spectrum"],
        })

    # Check political topics
    topic_measurement = measurements.get("political_topic_mix", {})
    topic_value = topic_measurement.get("value", [])
    if topic_value:
        topic_names = []
        for t in topic_value[:3]:
            if isinstance(t, dict):
                topic_names.append(t.get("topic", "Unknown").replace("_", " "))
            else:
                topic_names.append(str(t).replace("_", " "))

        signals_fired.append({
            "id": "political_figure_mention",
            "label": "Political topics detected",
            "why": f"Topics included: {', '.join(topic_names)}.",
            "evidence_ref": ["measurements.political_topic_mix"],
        })

    # Add not-evaluated audio signals for politics
    signals_not_evaluated.extend(
        _build_not_evaluated_signals(coverage_status, ["audio"], "politics")
    )

    # Merge public figure signals (Prompt 5/6)
    if public_figure_signals:
        # Get signals from fused or raw result (structure is preserved)
        pf_fired = public_figure_signals.get("signals_fired", [])
        pf_not_evaluated = public_figure_signals.get("signals_not_evaluated", [])
        pf_not_found = public_figure_signals.get("signals_not_found", [])

        # Add public figure signals to our lists
        signals_fired.extend(pf_fired)
        signals_not_evaluated.extend(pf_not_evaluated)
        signals_not_found.extend(pf_not_found)

    # Build confidence drivers
    confidence_drivers = _build_confidence_drivers(
        coverage_status, signals_fired, signals_not_found, signals_not_evaluated
    )

    # Add public figure confidence drivers (includes fusion notes if fused)
    if public_figure_signals:
        pf_confidence = public_figure_signals.get("confidence_drivers", [])
        confidence_drivers.extend(pf_confidence)

    # Prompt 6: Add conflict resolution notes from fusion as confidence drivers
    if use_fused:
        conflict_notes = fused_pf_signals.get("conflict_resolution_notes", [])
        for conflict in conflict_notes[:2]:  # Cap at 2
            confidence_drivers.append({
                "direction": "down",
                "label": "Cross-modal conflict detected",
                "detail": conflict.get("description", "Signals disagreed across modalities."),
            })

        # Add fusion summary to explanations if there are key signals
        fusion_summary = get_fusion_summary_for_explanations(fused_pf_signals)
        if fusion_summary.get("conflicts"):
            for conflict_desc in fusion_summary["conflicts"][:1]:
                confidence_drivers.append({
                    "direction": "note",
                    "label": "Fusion resolution",
                    "detail": conflict_desc,
                })

    # Build summary
    if political_items > 0:
        summary = f"In this scan of {n_items} posts, {political_items} contained political content ({political_rate}%). "
        if signals_not_evaluated:
            summary += "Audio-based political signals could not be checked."
    else:
        if coverage_status.get("ocr_coverage_sufficient") or coverage_status["audio_analyzed"]:
            summary = f"No political keywords were detected in this scan of {n_items} posts."
        else:
            summary = f"No political keywords were detected in this scan of {n_items} posts, though limited coverage may have caused some to be missed."

    # What this does not mean
    what_this_does_not_mean = [
        "This does not indicate your political beliefs or preferences.",
        "We cannot determine why political content was or wasn't shown to you.",
        "Keyword detection cannot assess the actual political stance or bias of content.",
        "Absence of political keywords doesn't mean content has no political implications.",
    ]

    # Add public figure epistemic boundaries (Prompt 5/6 - preserved through fusion)
    if public_figure_signals:
        pf_boundaries = public_figure_signals.get("what_this_does_not_mean", [])
        # Add unique boundaries (avoid duplicates)
        for boundary in pf_boundaries[:4]:  # Cap at 4 to avoid UI overflow
            if boundary not in what_this_does_not_mean:
                what_this_does_not_mean.append(boundary)

    # Next best actions
    next_best_actions = [
        "Scan feeds from different platforms to compare political content exposure.",
        "Consider following diverse sources to broaden the perspectives you see.",
        "Run multiple scans over time to see if patterns emerge.",
    ]

    return {
        "summary": summary,
        "signals_fired": signals_fired,
        "signals_not_evaluated": signals_not_evaluated,
        "signals_not_found": signals_not_found,
        "confidence_drivers": confidence_drivers,
        "what_this_does_not_mean": what_this_does_not_mean,
        "next_best_actions": next_best_actions[:4],
    }


# =============================================================================
# PATTERNS TAB EXPLANATIONS
# =============================================================================

def build_patterns_explanations(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build explanations object for the Patterns in Your Feed tab.
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    coverage_status = _get_coverage_status(feature_collection, n_items)

    signals_fired = []
    signals_not_found = []
    signals_not_evaluated = []

    # Check topic diversity
    topic_summary = observations.get("topic_diversity_summary", {})
    unique_topics = topic_summary.get("unique_topics_count", 0)
    top_topics = topic_summary.get("top_topics", [])

    if unique_topics > 0:
        top_names = [t.get("topic", "Unknown") for t in top_topics[:3]]
        signals_fired.append({
            "id": "topic_repetition",
            "label": "Topic patterns detected",
            "why": f"{unique_topics} distinct topics were identified. Most common: {', '.join(top_names)}.",
            "evidence_ref": ["observations.topic_diversity_summary"],
        })
    else:
        signals_not_found.append({
            "id": "topic_repetition",
            "label": "Topic patterns",
            "why": _soften_not_found_text(
                "No clear topic patterns could be identified from the text content.",
                coverage_status,
                "text"
            ),
            "evidence_ref": ["observations.topic_diversity_summary"],
        })

    # Check repetition
    repetition = observations.get("repetition_summary", {})
    repetition_rate = repetition.get("repetition_rate_percent")
    cluster_detected = repetition.get("cluster_detected", False)

    if cluster_detected or (repetition_rate and repetition_rate > 20):
        signals_fired.append({
            "id": "content_similarity",
            "label": "Content repetition detected",
            "why": f"Approximately {repetition_rate}% of content showed similar patterns.",
            "evidence_ref": ["observations.repetition_summary"],
        })
    elif repetition_rate is not None:
        signals_not_found.append({
            "id": "content_similarity",
            "label": "Content repetition",
            "why": f"Content repetition was low ({repetition_rate}%) - no significant clustering detected.",
            "evidence_ref": ["observations.repetition_summary"],
        })

    # Build confidence drivers
    confidence_drivers = _build_confidence_drivers(
        coverage_status, signals_fired, signals_not_found, signals_not_evaluated
    )

    # Build summary
    if unique_topics > 0:
        summary = f"In this scan of {n_items} posts, {unique_topics} distinct topics were detected. "
        if cluster_detected:
            summary += "Some content clustering was observed."
    else:
        summary = f"No clear topic patterns emerged from this scan of {n_items} posts."

    # What this does not mean
    what_this_does_not_mean = [
        "Pattern detection does not reveal why the algorithm chose this content.",
        "Topic repetition does not prove the algorithm is 'trapping' you in a bubble.",
        "We cannot determine if patterns reflect your interests or platform optimization.",
    ]

    # Next best actions
    next_best_actions = [
        "Try engaging with different types of content to observe how patterns shift.",
        "Run scans at different times of day to compare topic distributions.",
        "Compare patterns across different platforms you use.",
    ]

    return {
        "summary": summary,
        "signals_fired": signals_fired,
        "signals_not_evaluated": signals_not_evaluated,
        "signals_not_found": signals_not_found,
        "confidence_drivers": confidence_drivers,
        "what_this_does_not_mean": what_this_does_not_mean,
        "next_best_actions": next_best_actions[:4],
    }


# =============================================================================
# CREATORS TAB EXPLANATIONS
# =============================================================================

def build_creators_explanations(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build explanations object for the Creators & Voices tab.
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    coverage_status = _get_coverage_status(feature_collection, n_items)

    signals_fired = []
    signals_not_found = []
    signals_not_evaluated = []

    # Check creator concentration
    concentration = observations.get("creator_concentration", {})
    unique_creators = concentration.get("unique_creators_count", 0)
    top_creators = concentration.get("most_frequent_creators", [])
    top1_share = concentration.get("top1_creator_share_percent")

    if unique_creators > 0:
        signals_fired.append({
            "id": "creator_diversity",
            "label": "Creator diversity measured",
            "why": f"Content came from {unique_creators} unique creators.",
            "evidence_ref": ["observations.creator_concentration"],
        })

        if top1_share and top1_share > 30:
            signals_fired.append({
                "id": "creator_concentration",
                "label": "Creator concentration detected",
                "why": f"The top creator accounted for {top1_share}% of content.",
                "evidence_ref": ["observations.creator_concentration.top1_creator_share_percent"],
            })
    else:
        signals_not_found.append({
            "id": "creator_diversity",
            "label": "Creator information",
            "why": "Creator/account information was not available for this scan.",
            "evidence_ref": ["observations.creator_concentration"],
        })

    # Check verified accounts
    voice_variety = observations.get("voice_variety_proxies", {})
    verified_count = voice_variety.get("unique_verified_accounts_count", 0)

    if verified_count > 0:
        signals_fired.append({
            "id": "verified_accounts",
            "label": "Verified accounts present",
            "why": f"{verified_count} verified accounts appeared in this scan.",
            "evidence_ref": ["observations.voice_variety_proxies.unique_verified_accounts_count"],
        })

    # Add not-evaluated audio signals
    signals_not_evaluated.extend(
        _build_not_evaluated_signals(coverage_status, ["audio"], "creators")
    )

    # Build confidence drivers
    confidence_drivers = _build_confidence_drivers(
        coverage_status, signals_fired, signals_not_found, signals_not_evaluated
    )

    # Build summary
    if unique_creators > 0:
        summary = f"In this scan of {n_items} posts, content came from {unique_creators} unique creators. "
        if top1_share and top1_share > 30:
            summary += f"Source concentration was notable, with the top creator representing {top1_share}% of content."
    else:
        summary = f"Creator information was not available for this scan of {n_items} posts."

    # What this does not mean
    what_this_does_not_mean = [
        "Creator frequency does not indicate who you trust or follow.",
        "We cannot determine why certain creators appeared more than others.",
        "Verified status does not indicate content quality or accuracy.",
    ]

    # Next best actions
    next_best_actions = [
        "Review who you follow to understand your creator mix.",
        "Consider following new creators to diversify your feed.",
        "Run scans over multiple days to see if creator patterns persist.",
    ]

    return {
        "summary": summary,
        "signals_fired": signals_fired,
        "signals_not_evaluated": signals_not_evaluated,
        "signals_not_found": signals_not_found,
        "confidence_drivers": confidence_drivers,
        "what_this_does_not_mean": what_this_does_not_mean,
        "next_best_actions": next_best_actions[:4],
    }


# =============================================================================
# INFERENCES TAB EXPLANATIONS
# =============================================================================

def build_inferences_explanations(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build explanations object for the Inferences (What Algorithm Thinks) tab.
    """
    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    coverage_status = _get_coverage_status(feature_collection, n_items)

    signals_fired = []
    signals_not_found = []
    signals_not_evaluated = []

    # Check surfaced inferences
    overview = observations.get("inference_overview", {})
    surfaced_count = overview.get("total_candidates_surfaced", 0)
    total_generated = overview.get("total_candidates_generated", 0)

    surfaced = observations.get("surfaced_inferences", [])

    if surfaced_count > 0:
        for inf in surfaced[:3]:
            signals_fired.append({
                "id": f"inference_{inf.get('id', 'unknown')}",
                "label": inf.get("label", "Content signal"),
                "why": f"This signal appeared with {inf.get('confidence', 'medium')} confidence based on content patterns.",
                "evidence_ref": [f"observations.surfaced_inferences.{inf.get('id', 'unknown')}"],
            })

    if surfaced_count == 0 and total_generated > 0:
        signals_not_found.append({
            "id": "high_confidence_inference",
            "label": "High-confidence content signals",
            "why": f"{total_generated} potential signals were evaluated, but none met the high-confidence threshold.",
            "evidence_ref": ["observations.inference_overview"],
        })

    # Add coverage-based not-evaluated signals
    signals_not_evaluated.extend(
        _build_not_evaluated_signals(coverage_status, ["audio", "visual"], "inferences")
    )

    # Build confidence drivers
    confidence_drivers = _build_confidence_drivers(
        coverage_status, signals_fired, signals_not_found, signals_not_evaluated
    )

    # Add inference-specific driver
    if n_items < 30:
        confidence_drivers.insert(0, {
            "direction": "down",
            "label": "Sample size below threshold for inferences",
            "detail": f"At least 30 posts are recommended for reliable inference detection; this scan has {n_items}.",
        })

    # Build summary
    if surfaced_count > 0:
        summary = f"Based on {n_items} posts, {surfaced_count} content signal(s) were detected with high confidence. "
        summary += "These reflect patterns in your feed content, not claims about you personally."
    elif n_items >= 30:
        summary = f"From {n_items} posts, no high-confidence content signals were detected. This may indicate diverse content or insufficient distinctive patterns."
    else:
        summary = f"This scan of {n_items} posts is too small for reliable inference detection. At least 30 posts are recommended."

    # What this does not mean
    what_this_does_not_mean = [
        "These signals do not define who you are or what you believe.",
        "We cannot know why the algorithm chose this content for you.",
        "Content patterns do not reveal the platform's targeting criteria.",
        "These are observations about content, not predictions about your behavior.",
    ]

    # Next best actions
    next_best_actions = [
        "Run larger scans (30+ posts) for more reliable signal detection.",
        "Compare signals across multiple scans to identify persistent patterns.",
        "Review your platform's ad and content preferences to understand targeting.",
        "Try using the platform differently and observe how signals change.",
    ]

    return {
        "summary": summary,
        "signals_fired": signals_fired,
        "signals_not_evaluated": signals_not_evaluated,
        "signals_not_found": signals_not_found,
        "confidence_drivers": confidence_drivers,
        "what_this_does_not_mean": what_this_does_not_mean,
        "next_best_actions": next_best_actions[:4],
    }


# =============================================================================
# UNIFIED EXPLANATIONS GENERATOR
# =============================================================================

def build_explanations_for_tab(
    tab: str,
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build explanations for a specific tab.

    Args:
        tab: One of "ads", "politics", "patterns", "creators", "inferences"
        bundle: The evidence bundle for the tab
        feature_collection: Optional feature collection for coverage status

    Returns:
        Explanations object with summary, signals, confidence drivers, etc.
    """
    builders = {
        "ads": build_ads_explanations,
        "politics": build_politics_explanations,
        "patterns": build_patterns_explanations,
        "creators": build_creators_explanations,
        "inferences": build_inferences_explanations,
    }

    builder = builders.get(tab)
    if builder:
        return builder(bundle, feature_collection)

    # Fallback for unknown tab
    return {
        "summary": "Explanations not available for this tab.",
        "signals_fired": [],
        "signals_not_evaluated": [],
        "signals_not_found": [],
        "confidence_drivers": [],
        "what_this_does_not_mean": [],
        "next_best_actions": [],
    }
