"""
Claims Generator Module - Evidence-Backed Claims Layer (Prompt 6)

This module provides a shared utility for generating "claim objects" for each
evidence bundle tab (Ads, Politics, Patterns, Creators, Inferences).

Claim Object Structure:
{
    "id": str,                      # stable string identifier
    "claim_text": str,              # plain English, non-judgmental
    "confidence": "high"|"medium"|"low",
    "coverage_required": dict,      # what had to be present (OCR %, audio, etc.)
    "evidence": list[str],          # 1-4 concrete supports
    "limitations": list[str],       # 1-3 caveats (required when coverage low)
    "why_it_matters": str,          # one sentence, reflective, agency-oriented
    "next_best_action": str         # one sentence, what user can do next
}

Coverage Thresholds (Prompt 6 Spec):
- OCR coverage low: < 60%
- Audio not analyzed: audio_analyzed=false or availability != present_processed
- If both OCR low AND audio not analyzed: only "low confidence / incomplete evidence" claims allowed

Epistemic Honesty Rules:
- Never claim "no political content" or "no ads" if audio was not analyzed or OCR < 60%
- When coverage below threshold, show: "We can't conclude X from this scan" and state what's missing
"""

from typing import Dict, Any, List, Optional, Literal


# Coverage thresholds (per Prompt 6 spec)
OCR_COVERAGE_LOW_THRESHOLD = 60  # percent
SAMPLE_SIZE_MIN = 10  # minimum items for reliable analysis


ConfidenceLevel = Literal["high", "medium", "low"]


def get_coverage_status(
    feature_collection: Optional[Dict[str, Any]],
    n_items: int
) -> Dict[str, Any]:
    """
    Compute coverage status from feature collection for claim generation.

    Returns:
        Dict with:
            - ocr_coverage_percent: float
            - ocr_coverage_sufficient: bool
            - audio_analyzed: bool
            - audio_availability: str
            - sample_size_sufficient: bool
            - can_make_high_confidence_claims: bool
    """
    status = {
        "ocr_coverage_percent": 0.0,
        "ocr_coverage_sufficient": False,
        "audio_analyzed": False,
        "audio_availability": "unknown",
        "sample_size_sufficient": n_items >= SAMPLE_SIZE_MIN,
        "can_make_high_confidence_claims": False,
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

    # Determine audio availability from items
    n_processed = audio_coverage.get("n_present_processed", 0)
    n_absent = audio_coverage.get("n_absent", 0)
    n_unknown = audio_coverage.get("n_unknown", 0)

    if n_processed > 0:
        status["audio_availability"] = "present_processed"
    elif n_absent > 0 and n_processed == 0:
        status["audio_availability"] = "absent"
    else:
        status["audio_availability"] = "unknown"

    # Can make high confidence claims?
    # Per spec: if both OCR low AND audio not analyzed, only low confidence allowed
    if status["sample_size_sufficient"]:
        if status["ocr_coverage_sufficient"] or status["audio_analyzed"]:
            status["can_make_high_confidence_claims"] = True

    return status


def determine_claim_confidence(
    base_confidence: ConfidenceLevel,
    coverage_status: Dict[str, Any]
) -> ConfidenceLevel:
    """
    Adjust claim confidence based on coverage status.

    Per Prompt 6 spec:
    - If both OCR low AND audio not analyzed: downgrade to "low"
    - If only one is missing but sample size OK: allow up to "medium"
    """
    if not coverage_status["sample_size_sufficient"]:
        return "low"

    if not coverage_status["can_make_high_confidence_claims"]:
        return "low"

    # If OCR is low but audio was analyzed, cap at medium
    if not coverage_status["ocr_coverage_sufficient"] and coverage_status["audio_analyzed"]:
        if base_confidence == "high":
            return "medium"

    # If audio not analyzed but OCR is sufficient, cap at medium
    if coverage_status["ocr_coverage_sufficient"] and not coverage_status["audio_analyzed"]:
        if base_confidence == "high":
            return "medium"

    return base_confidence


def build_coverage_required(coverage_status: Dict[str, Any]) -> Dict[str, Any]:
    """Build the coverage_required field for a claim."""
    return {
        "ocr_coverage_percent": coverage_status["ocr_coverage_percent"],
        "ocr_coverage_sufficient": coverage_status["ocr_coverage_sufficient"],
        "audio_analyzed": coverage_status["audio_analyzed"],
        "sample_size_sufficient": coverage_status["sample_size_sufficient"],
    }


def build_standard_limitations(coverage_status: Dict[str, Any]) -> List[str]:
    """Build standard limitation caveats based on coverage status."""
    limitations = []

    if not coverage_status["sample_size_sufficient"]:
        limitations.append(
            "Sample size is too small for reliable patterns. "
            "More scans are needed for confident conclusions."
        )

    if not coverage_status["ocr_coverage_sufficient"]:
        limitations.append(
            f"On-screen text was extracted from only {coverage_status['ocr_coverage_percent']:.0f}% of items. "
            "Visual disclosure labels or text may have been missed."
        )

    if not coverage_status["audio_analyzed"]:
        limitations.append(
            "Audio was not analyzed for this scan. "
            "Spoken content, including verbal disclosures or political language, could not be detected."
        )

    return limitations[:3]  # Max 3 per spec


# =============================================================================
# ADS TAB CLAIMS
# =============================================================================

def generate_ads_claims(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Generate evidence-backed claims for the Ads & Influence tab.

    Returns list of 3-6 claim objects based on observations and measurements.
    """
    claims = []

    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    coverage_status = get_coverage_status(feature_collection, n_items)

    spectrum = observations.get("commercial_exposure_spectrum", {})
    stacked_bar = spectrum.get("stacked_bar", {})
    labeled_ads = stacked_bar.get("labeled_ads", 0)
    unlabeled_promo = stacked_bar.get("unlabeled_promotion", 0)
    non_commercial = stacked_bar.get("non_commercial", 0)
    promo_rate = observations.get("promotional_rate_percent")

    # Claim 1: Commercial Exposure Rate
    if n_items >= SAMPLE_SIZE_MIN:
        total_promo = labeled_ads + unlabeled_promo

        if total_promo == 0:
            # Special case: no promo detected
            base_confidence: ConfidenceLevel = "high" if coverage_status["can_make_high_confidence_claims"] else "low"
            confidence = determine_claim_confidence(base_confidence, coverage_status)

            if confidence == "low":
                claim_text = (
                    f"In this scan of {n_items} posts, no promotional content was detected. "
                    "However, coverage limitations may have caused ads or promotions to be missed."
                )
            else:
                claim_text = (
                    f"In this scan of {n_items} posts, no promotional content "
                    "(labeled ads or unlabeled promotions) was detected."
                )

            claims.append({
                "id": "ads_commercial_exposure_rate",
                "claim_text": claim_text,
                "confidence": confidence,
                "coverage_required": build_coverage_required(coverage_status),
                "evidence": [
                    f"Analyzed {n_items} posts total",
                    f"No labeled ads detected",
                    f"No high-confidence unlabeled promotions detected",
                ],
                "limitations": build_standard_limitations(coverage_status),
                "why_it_matters": (
                    "Understanding ad load helps you gauge how much of your feed is commercial."
                ),
                "next_best_action": (
                    "Run another scan at a different time to compare."
                ),
            })
        else:
            base_confidence = "high" if spectrum.get("coverage_percent", 0) >= 80 else "medium"
            confidence = determine_claim_confidence(base_confidence, coverage_status)

            evidence = [
                f"Analyzed {n_items} posts total",
                f"{labeled_ads} labeled ads detected",
            ]
            if unlabeled_promo > 0:
                evidence.append(f"{unlabeled_promo} unlabeled promotions (high confidence)")
            if promo_rate is not None:
                evidence.append(f"Promotional rate: {promo_rate}%")

            claims.append({
                "id": "ads_commercial_exposure_rate",
                "claim_text": (
                    f"In this scan, approximately {promo_rate}% of content was promotional "
                    f"({labeled_ads} labeled ads, {unlabeled_promo} unlabeled promotions)."
                ),
                "confidence": confidence,
                "coverage_required": build_coverage_required(coverage_status),
                "evidence": evidence[:4],
                "limitations": build_standard_limitations(coverage_status),
                "why_it_matters": (
                    "Knowing your ad exposure helps you make informed choices about your feed."
                ),
                "next_best_action": (
                    "Check platform ad settings to see targeting options."
                ),
            })

    # Claim 2: Top Companies/Advertisers
    top_companies = observations.get("top_companies", [])
    if top_companies:
        company_names = [c["name"] for c in top_companies[:3]]
        base_confidence = "medium"  # Company extraction is inherently medium confidence
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        claims.append({
            "id": "ads_top_companies",
            "claim_text": (
                f"The most frequent companies in promotional content were: {', '.join(company_names)}."
            ),
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"{c['name']} appeared {c['count']} times" for c in top_companies[:3]
            ],
            "limitations": [
                "Company names are extracted from visible text and metadata.",
                "Some advertisers may not be identifiable from content alone.",
            ] + build_standard_limitations(coverage_status)[:1],
            "why_it_matters": (
                "Seeing which companies appear frequently can reveal targeting patterns."
            ),
            "next_best_action": (
                "Note if the same companies appear across multiple scans."
            ),
        })

    # Claim 3: Promotion Topics
    topic_measurement = measurements.get("promotion_topics", {})
    topic_value = topic_measurement.get("value", [])
    if topic_value and isinstance(topic_value, list) and len(topic_value) > 0:
        topic_names = [t.replace("_", " ").title() if isinstance(t, str) else str(t) for t in topic_value[:3]]
        base_confidence = "medium"
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        claims.append({
            "id": "ads_promotion_topics",
            "claim_text": (
                f"Promotional content in this scan related to: {', '.join(topic_names)}."
            ),
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"Topic detected: {t}" for t in topic_names
            ],
            "limitations": [
                "Topics are detected via keyword matching in promotional content.",
            ] + build_standard_limitations(coverage_status)[:2],
            "why_it_matters": (
                "Understanding what categories of ads you see reveals advertiser assumptions about your interests."
            ),
            "next_best_action": (
                "Consider if these categories match your actual interests."
            ),
        })

    # Claim 4: Unlabeled Promotions (if detected)
    if unlabeled_promo > 0:
        base_confidence = "medium"  # Unlabeled detection is inherently less certain
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        claims.append({
            "id": "ads_unlabeled_promotions",
            "claim_text": (
                f"{unlabeled_promo} posts showed high-confidence promotional signals "
                "without formal disclosure labels."
            ),
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"{unlabeled_promo} items with promotional CTAs or brand mentions",
                "Detected via disclosure token and CTA pattern matching",
            ],
            "limitations": [
                "Some legitimate recommendations may resemble promotions.",
                "Disclosure labels may exist but not be visible in captured content.",
            ] + build_standard_limitations(coverage_status)[:1],
            "why_it_matters": (
                "Undisclosed promotions can influence you without transparency."
            ),
            "next_best_action": (
                "Look for #ad or 'Sponsored' labels when browsing similar content."
            ),
        })

    return claims[:6]  # Max 6 per tab


# =============================================================================
# POLITICS TAB CLAIMS
# =============================================================================

def generate_politics_claims(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Generate evidence-backed claims for the Politics & Worldview tab.

    Returns list of 3-6 claim objects based on observations and measurements.
    """
    claims = []

    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    coverage_status = get_coverage_status(feature_collection, n_items)

    spectrum = observations.get("political_content_spectrum", {})
    stacked_bar = spectrum.get("stacked_bar", {})
    political_items = stacked_bar.get("political", 0)
    non_political = stacked_bar.get("non_political", 0)
    political_rate = observations.get("political_rate_percent")

    # Claim 1: Political Content Rate
    if n_items >= SAMPLE_SIZE_MIN:
        if political_items == 0:
            base_confidence: ConfidenceLevel = "high" if coverage_status["can_make_high_confidence_claims"] else "low"
            confidence = determine_claim_confidence(base_confidence, coverage_status)

            if confidence == "low":
                claim_text = (
                    f"In this scan of {n_items} posts, no political keywords were detected. "
                    "However, coverage limitations may have caused some political content to be missed."
                )
            else:
                claim_text = (
                    f"In this scan of {n_items} posts, no content matched political keyword patterns."
                )

            claims.append({
                "id": "politics_content_rate",
                "claim_text": claim_text,
                "confidence": confidence,
                "coverage_required": build_coverage_required(coverage_status),
                "evidence": [
                    f"Analyzed {n_items} posts",
                    "No political keyword matches detected",
                ],
                "limitations": build_standard_limitations(coverage_status),
                "why_it_matters": (
                    "Understanding political content exposure helps you assess information balance."
                ),
                "next_best_action": (
                    "Scan feeds with news content to compare political exposure."
                ),
            })
        else:
            base_confidence = "medium"  # Political classification is inherently uncertain
            confidence = determine_claim_confidence(base_confidence, coverage_status)

            claims.append({
                "id": "politics_content_rate",
                "claim_text": (
                    f"In this scan, approximately {political_rate}% of content "
                    f"matched political keyword patterns ({political_items} posts)."
                ),
                "confidence": confidence,
                "coverage_required": build_coverage_required(coverage_status),
                "evidence": [
                    f"Analyzed {n_items} posts",
                    f"{political_items} posts matched political keywords",
                    f"Political content rate: {political_rate}%",
                ],
                "limitations": [
                    "Political classification uses keyword matching only.",
                    "Cannot detect nuance, irony, or context.",
                ] + build_standard_limitations(coverage_status)[:1],
                "why_it_matters": (
                    "Being aware of political content exposure supports informed media consumption."
                ),
                "next_best_action": (
                    "Consider following diverse sources to broaden perspectives."
                ),
            })

    # Claim 2: Political Topics
    topic_measurement = measurements.get("political_topic_mix", {})
    topic_value = topic_measurement.get("value", [])
    if topic_value and isinstance(topic_value, list) and len(topic_value) > 0:
        # Handle both string lists and dict lists
        if isinstance(topic_value[0], dict):
            topic_names = [t.get("topic", "").replace("_", " ").title() for t in topic_value[:3]]
        else:
            topic_names = [str(t).replace("_", " ").title() for t in topic_value[:3]]

        base_confidence: ConfidenceLevel = "medium"
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        claims.append({
            "id": "politics_topics",
            "claim_text": (
                f"Political content in this scan related to: {', '.join(topic_names)}."
            ),
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"Topic detected: {t}" for t in topic_names
            ],
            "limitations": [
                "Topics are detected via keyword matching.",
                "Subtopic classification is approximate.",
            ] + build_standard_limitations(coverage_status)[:1],
            "why_it_matters": (
                "Understanding which political topics appear reveals platform emphasis."
            ),
            "next_best_action": (
                "Seek out coverage of topics that didn't appear in your feed."
            ),
        })

    return claims[:6]


# =============================================================================
# PATTERNS TAB CLAIMS
# =============================================================================

def generate_patterns_claims(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Generate evidence-backed claims for the Patterns in Your Feed tab.

    Returns list of 3-6 claim objects.
    """
    claims = []

    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    coverage_status = get_coverage_status(feature_collection, n_items)

    # Topic Diversity
    topic_summary = observations.get("topic_diversity_summary", {})
    unique_topics = topic_summary.get("unique_topics_count", 0)
    top_topics = topic_summary.get("top_topics", [])
    topic_coverage = topic_summary.get("coverage_percent", 0)

    if n_items >= SAMPLE_SIZE_MIN and unique_topics > 0:
        base_confidence: ConfidenceLevel = "high" if topic_coverage >= 60 else "medium"
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        top_topic_names = [t.get("topic", "Unknown") for t in top_topics[:3]]

        claims.append({
            "id": "patterns_topic_diversity",
            "claim_text": (
                f"In this scan, {unique_topics} distinct topics were detected. "
                f"Most common: {', '.join(top_topic_names)}."
            ),
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"{unique_topics} unique topics",
                f"Topic coverage: {topic_coverage}%",
            ] + [f"{t['topic']}: {t.get('count', 0)} posts" for t in top_topics[:2]],
            "limitations": [
                "Topic detection relies on text content analysis.",
            ] + build_standard_limitations(coverage_status)[:2],
            "why_it_matters": (
                "Topic diversity affects the breadth of information you encounter."
            ),
            "next_best_action": (
                "Try engaging with different topics to encourage variety."
            ),
        })

    # Repetition Patterns
    repetition = observations.get("repetition_summary", {})
    repetition_rate = repetition.get("repetition_rate_percent")
    cluster_detected = repetition.get("cluster_detected", False)

    if repetition_rate is not None and n_items >= SAMPLE_SIZE_MIN:
        base_confidence = "medium"
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        if repetition_rate > 20:
            claim_text = (
                f"Approximately {repetition_rate}% of posts showed repeated content patterns."
            )
        else:
            claim_text = (
                f"Content repetition was low ({repetition_rate}%) in this scan."
            )

        claims.append({
            "id": "patterns_repetition",
            "claim_text": claim_text,
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"Repetition rate: {repetition_rate}%",
                f"Cluster detected: {'Yes' if cluster_detected else 'No'}",
            ],
            "limitations": [
                "Repetition detection uses text similarity analysis.",
            ] + build_standard_limitations(coverage_status)[:2],
            "why_it_matters": (
                "High repetition may indicate algorithm-driven content loops."
            ),
            "next_best_action": (
                "Vary your interactions to break potential content loops."
            ),
        })

    # Feed Skew Flags
    skew_flags = measurements.get("feed_skew_flags", {})
    flag_list = skew_flags.get("value", [])
    triggered_count = measurements.get("triggered_flags_count", 0)

    if triggered_count > 0:
        base_confidence = "medium"
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        triggered = [f for f in flag_list if f.get("triggered", False)]
        flag_names = [f.get("flag", "Unknown") for f in triggered[:3]]

        claims.append({
            "id": "patterns_skew_flags",
            "claim_text": (
                f"{triggered_count} potential feed pattern flag(s) were triggered: {', '.join(flag_names)}."
            ),
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"Flag: {f.get('flag', 'Unknown')}" for f in triggered[:3]
            ],
            "limitations": [
                "Flags indicate potential patterns, not definitive issues.",
            ] + build_standard_limitations(coverage_status)[:2],
            "why_it_matters": (
                "Feed patterns can affect the diversity of content you see."
            ),
            "next_best_action": (
                "Experiment with different browsing behaviors to observe changes."
            ),
        })

    return claims[:6]


# =============================================================================
# CREATORS TAB CLAIMS
# =============================================================================

def generate_creators_claims(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Generate evidence-backed claims for the Creators & Voices tab.

    Returns list of 3-6 claim objects.
    """
    claims = []

    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    coverage_status = get_coverage_status(feature_collection, n_items)

    # Creator Data Coverage
    creator_coverage = observations.get("creator_data_coverage", {})
    coverage_percent = creator_coverage.get("creator_coverage_percent", 0)
    coverage_quality = creator_coverage.get("coverage_quality", "unknown")

    # Creator Concentration
    concentration = observations.get("creator_concentration", {})
    unique_creators = concentration.get("unique_creators_count", 0)
    top_creators = concentration.get("most_frequent_creators", [])
    top1_share = concentration.get("top1_creator_share_percent")

    if n_items >= SAMPLE_SIZE_MIN and unique_creators > 0:
        base_confidence: ConfidenceLevel = "high" if coverage_quality == "ok" else "medium"
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        top_creator_names = [c.get("creator", "Unknown") for c in top_creators[:3]]

        claim_text = f"In this scan, content came from {unique_creators} unique creators."
        if top_creator_names:
            claim_text += f" Most frequent: {', '.join(top_creator_names)}."

        evidence = [
            f"{unique_creators} unique creators",
            f"Creator coverage: {coverage_percent}%",
        ]
        if top1_share is not None:
            evidence.append(f"Top creator share: {top1_share}%")

        claims.append({
            "id": "creators_concentration",
            "claim_text": claim_text,
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": evidence[:4],
            "limitations": [
                "Creator identification depends on available metadata.",
            ] + build_standard_limitations(coverage_status)[:2],
            "why_it_matters": (
                "Source diversity affects the range of perspectives you encounter."
            ),
            "next_best_action": (
                "Consider following new creators to diversify your feed."
            ),
        })

    # Voice Variety
    voice_variety = observations.get("voice_variety_proxies", {})
    unique_handles = voice_variety.get("unique_handles_count", 0)
    verified_count = voice_variety.get("unique_verified_accounts_count", 0)

    if unique_handles > 0:
        base_confidence = "medium"
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        claims.append({
            "id": "creators_voice_variety",
            "claim_text": (
                f"This scan included {unique_handles} unique account handles"
                + (f", including {verified_count} verified accounts." if verified_count > 0 else ".")
            ),
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"{unique_handles} unique handles",
                f"{verified_count} verified accounts",
            ],
            "limitations": [
                "Handle counts depend on metadata availability.",
            ] + build_standard_limitations(coverage_status)[:2],
            "why_it_matters": (
                "A mix of verified and unverified sources provides different perspectives."
            ),
            "next_best_action": (
                "Pay attention to source credibility when consuming content."
            ),
        })

    # Creator Skew Flags
    skew_flags = measurements.get("creator_skew_flags", {})
    flag_list = skew_flags.get("value", [])
    triggered_count = measurements.get("triggered_flags_count", 0)

    if triggered_count > 0:
        base_confidence = "medium"
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        triggered = [f for f in flag_list if f.get("triggered", False)]
        flag_names = [f.get("flag", "Unknown") for f in triggered[:3]]

        claims.append({
            "id": "creators_skew_flags",
            "claim_text": (
                f"{triggered_count} creator concentration flag(s) triggered: {', '.join(flag_names)}."
            ),
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"Flag: {f.get('flag', 'Unknown')}" for f in triggered[:3]
            ],
            "limitations": [
                "Flags indicate potential patterns, not definitive issues.",
            ] + build_standard_limitations(coverage_status)[:2],
            "why_it_matters": (
                "Source concentration can limit the diversity of viewpoints you see."
            ),
            "next_best_action": (
                "Actively seek out new voices in your areas of interest."
            ),
        })

    return claims[:6]


# =============================================================================
# INFERENCES TAB CLAIMS
# =============================================================================

def generate_inferences_claims(
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Generate evidence-backed claims for the Inferences (What Algorithm Thinks) tab.

    Returns list of 3-6 claim objects.
    """
    claims = []

    meta = bundle.get("meta", {})
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})
    limits = bundle.get("limits", {})

    n_items = meta.get("n_items", 0)
    coverage_status = get_coverage_status(feature_collection, n_items)

    # Inference Overview
    overview = observations.get("inference_overview", {})
    surfaced_count = overview.get("total_candidates_surfaced", 0)
    total_generated = overview.get("total_candidates_generated", 0)

    # Surfaced Inferences
    surfaced = observations.get("surfaced_inferences", [])

    if n_items >= 30:  # Inferences require higher sample size
        base_confidence: ConfidenceLevel = "medium"  # Inferences are inherently uncertain
        confidence = determine_claim_confidence(base_confidence, coverage_status)

        if surfaced_count > 0:
            claim_text = (
                f"Based on {n_items} posts, {surfaced_count} content signal(s) met "
                "the threshold for high-confidence detection."
            )
        else:
            claim_text = (
                f"From {n_items} posts, no signals met the high-confidence threshold. "
                "This scan may not have enough distinctive patterns."
            )

        evidence = [
            f"{surfaced_count} signals surfaced",
            f"{total_generated} candidates evaluated",
            f"Sample size: {n_items} posts",
        ]

        claims.append({
            "id": "inferences_overview",
            "claim_text": claim_text,
            "confidence": confidence,
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": evidence,
            "limitations": [
                "Signals reflect patterns in visible content, not platform targeting.",
                "We cannot know why content was shown to you.",
            ] + build_standard_limitations(coverage_status)[:1],
            "why_it_matters": (
                "Understanding content signals helps you see patterns in what you're shown."
            ),
            "next_best_action": (
                "Compare signals across multiple scans over time."
            ),
        })

        # Individual high-confidence inferences (up to 3)
        for i, inference in enumerate(surfaced[:3]):
            inference_confidence = inference.get("confidence", "medium")
            adjusted_confidence = determine_claim_confidence(
                inference_confidence, coverage_status
            )

            label = inference.get("label", "Unknown signal")
            kind = inference.get("kind", "unknown")
            stats = inference.get("observed_stats", {})

            # Build evidence from observed_stats
            evidence = []
            if "count" in stats:
                evidence.append(f"Observed count: {stats['count']}")
            if "percent" in stats:
                evidence.append(f"Share: {stats['percent']}%")
            if "topic" in stats:
                evidence.append(f"Topic: {stats['topic']}")

            claims.append({
                "id": f"inferences_signal_{i+1}",
                "claim_text": f"Signal detected: {label}",
                "confidence": adjusted_confidence,
                "coverage_required": build_coverage_required(coverage_status),
                "evidence": evidence[:4] if evidence else ["Pattern detected in content"],
                "limitations": [
                    "This reflects content patterns, not platform intent.",
                ] + build_standard_limitations(coverage_status)[:2],
                "why_it_matters": (
                    "Recognizing patterns helps you understand your content environment."
                ),
                "next_best_action": (
                    "Observe if this pattern persists across scans."
                ),
            })
    else:
        # Not enough data for inferences
        claims.append({
            "id": "inferences_insufficient_data",
            "claim_text": (
                f"This scan has {n_items} posts, but at least 30 are needed "
                "for reliable inference detection."
            ),
            "confidence": "low",
            "coverage_required": build_coverage_required(coverage_status),
            "evidence": [
                f"Sample size: {n_items} posts",
                "Minimum required: 30 posts",
            ],
            "limitations": [
                "Small sample sizes cannot reveal reliable patterns.",
            ],
            "why_it_matters": (
                "More data enables more confident pattern detection."
            ),
            "next_best_action": (
                "Run more scans to build up sufficient data."
            ),
        })

    return claims[:6]


# =============================================================================
# UNIFIED CLAIM GENERATOR
# =============================================================================

def generate_claims_for_tab(
    tab: str,
    bundle: Dict[str, Any],
    feature_collection: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Generate claims for a specific tab.

    Args:
        tab: One of "ads", "politics", "patterns", "creators", "inferences"
        bundle: The evidence bundle for the tab
        feature_collection: Optional feature collection for coverage status

    Returns:
        List of claim objects
    """
    generators = {
        "ads": generate_ads_claims,
        "politics": generate_politics_claims,
        "patterns": generate_patterns_claims,
        "creators": generate_creators_claims,
        "inferences": generate_inferences_claims,
    }

    generator = generators.get(tab)
    if generator:
        return generator(bundle, feature_collection)
    return []
