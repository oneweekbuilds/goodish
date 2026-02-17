"""Evidence bundle endpoints for all tabs."""
import logging
import os
from typing import Optional

from fastapi import APIRouter, Query, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from auth import get_current_user
from config import is_dev_environment
from database import get_scan_by_id_for_user, is_user_plus
from evidence_bundle import (
    build_ads_evidence_bundle,
    generate_ads_analysis_copy,
    generate_talk_response,
    format_talk_response_as_text,
)
from politics_evidence_bundle import (
    build_politics_evidence_bundle,
    generate_politics_analysis_copy,
    generate_politics_talk_response,
    format_politics_talk_response_as_text,
)
from patterns_evidence_bundle import (
    build_patterns_evidence_bundle,
    generate_patterns_analysis_copy,
    generate_patterns_talk_response,
    format_patterns_talk_response_as_text,
)
from creators_evidence_bundle import (
    build_creators_evidence_bundle,
    generate_creators_analysis_copy,
    generate_creators_talk_response,
    format_creators_talk_response_as_text,
)
from inferences_evidence_bundle import (
    build_inferences_evidence_bundle,
    generate_inferences_analysis_copy,
    generate_inferences_talk_response,
    format_inferences_talk_response_as_text,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["evidence-bundles"])
limiter = Limiter(key_func=get_remote_address)


def _require_plus(user_id: str):
    """Raise HTTP 403 if user does not have an active Plus subscription."""
    if not is_user_plus(user_id):
        raise HTTPException(
            status_code=403,
            detail="Plus subscription required. Evidence bundles are a premium feature."
        )


# ============================================
# Ads & Influence Evidence Bundle Endpoints
# ============================================

@limiter.limit("30/minute")
@router.get("/scans/{scan_id}/evidence-bundle/ads")
def get_ads_evidence_bundle(
    request: Request,
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the Evidence Bundle for the Ads & Influence tab.

    The Evidence Bundle is the single source of truth for all analysis copy
    and Talk-to-Algorithm responses in the Ads & Influence tab.

    Query params:
        debug: If true, includes the raw bundle JSON in the response

    Requires: Authorization header with valid Supabase JWT

    Returns:
        Evidence Bundle with meta, observations, measurements, limits,
        plus generated analysis copy and Talk response structure.
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build the Evidence Bundle
    bundle = build_ads_evidence_bundle(scan_result)

    # Phase 5C2.4: Ensure CI fields are present (with fallback computation if missing)
    # This handles cases where the server has stale code or import issues
    observations = bundle.get("observations", {})
    total_posts = observations.get("total_posts_seen", 0)
    if total_posts > 0:
        ad_rate_ci = observations.get("ad_rate_percent_ci")
        ad_rate_estimate_type = observations.get("ad_rate_estimate_type")
        if ad_rate_ci is None or ad_rate_estimate_type is None:
            # Fallback: compute CI inline if missing (handles stale code/import issues)
            total_ads = observations.get("total_ads_detected", 0)
            try:
                from accuracy.stats import wilson_ci_percent
                ci_lower, ci_upper = wilson_ci_percent(total_ads, total_posts, conf=0.95)
                observations["ad_rate_percent_ci"] = {
                    "lower": round(ci_lower, 1),
                    "upper": round(ci_upper, 1),
                    "confidence_level": 0.95,
                    "method": "wilson"
                }
                observations["ad_rate_estimate_type"] = "INTERVAL"
            except ImportError:
                # If import fails, leave as None (should not happen in production)
                pass

    # Generate analysis copy from the bundle
    analysis = generate_ads_analysis_copy(bundle)

    response = {
        "scan_id": scan_id,
        "tab": "ads",
        "bundle": bundle,
        "analysis": analysis,
    }

    # Include debug info if requested (only in dev environments)
    if debug and is_dev_environment():
        response["_debug"] = {
            "raw_bundle": bundle,
            "scan_metadata": scan_result.get("scan_metadata", {}),
            "aggregates": scan_result.get("aggregates", {}),
            "feed_items_count": len(scan_result.get("feed_items", [])),
        }

    return response


@limiter.limit("30/minute")
@router.get("/scans/{scan_id}/evidence-bundle/ads/debug")
def get_ads_evidence_bundle_debug(
    request: Request,
    scan_id: str, current_user: dict = Depends(get_current_user)):
    """
    Dev-only debug endpoint to inspect bundle computation vs serialization.

    Returns both the raw computed bundle and the final response to diagnose
    if CI fields are missing before or during serialization.

    This endpoint is only available in dev/local environments.
    """
    if not is_dev_environment():
        raise HTTPException(status_code=404, detail="Debug endpoint not available")

    user_id = current_user["user_id"]
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build the Evidence Bundle
    bundle = build_ads_evidence_bundle(scan_result)

    # Generate analysis copy from the bundle
    analysis = generate_ads_analysis_copy(bundle)

    response = {
        "scan_id": scan_id,
        "tab": "ads",
        "bundle": bundle,
        "analysis": analysis,
    }

    # Return debug info showing both raw bundle and final response
    observations = bundle.get("observations", {})
    return {
        "debug": True,
        "raw_bundle_observations": {
            "ad_rate_percent": observations.get("ad_rate_percent"),
            "ad_rate_percent_ci": observations.get("ad_rate_percent_ci"),
            "ad_rate_estimate_type": observations.get("ad_rate_estimate_type"),
            "total_posts_seen": observations.get("total_posts_seen"),
            "total_ads_detected": observations.get("total_ads_detected"),
        },
        "final_response_bundle_observations": {
            "ad_rate_percent": response["bundle"]["observations"].get("ad_rate_percent"),
            "ad_rate_percent_ci": response["bundle"]["observations"].get("ad_rate_percent_ci"),
            "ad_rate_estimate_type": response["bundle"]["observations"].get("ad_rate_estimate_type"),
        },
        "full_response": response,
    }


@limiter.limit("30/minute")
@router.post("/scans/{scan_id}/talk/ads")
def talk_to_algorithm_ads(
    request: Request,
    scan_id: str,
    question: str = Query(..., description="The user's question"),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a Talk-to-Algorithm response for the Ads & Influence tab.

    The response is generated ONLY from the Evidence Bundle - never from
    raw feed text or generic explanations.

    Response structure (per accuracy_contract.md):
    1. What we observed (cites 2-4 Evidence Bundle fields)
    2. What it might mean (2-3 labeled hypotheses)
    3. What we cannot know (cites limits)
    4. What you can try (2-4 non-judgmental actions)

    Requires: Authorization header with valid Supabase JWT

    Args:
        scan_id: The scan ID to generate response for
        question: The user's question

    Returns:
        Structured response with all four sections
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build the Evidence Bundle
    bundle = build_ads_evidence_bundle(scan_result)

    # Generate the Talk response from the bundle
    structured_response = generate_talk_response(bundle, question)

    # Format as readable text
    formatted_text = format_talk_response_as_text(structured_response)

    return {
        "scan_id": scan_id,
        "tab": "ads",
        "question": question,
        "response": {
            "structured": structured_response,
            "formatted_text": formatted_text,
        },
        "cited_fields": structured_response.get("what_we_observed", {}).get("cited_fields", []) +
                       structured_response.get("what_we_cannot_know", {}).get("cited_fields", [])
    }


# ============================================
# Politics & Worldview Evidence Bundle Endpoints
# ============================================

@limiter.limit("30/minute")
@router.get("/scans/{scan_id}/evidence-bundle/politics")
def get_politics_evidence_bundle(
    request: Request,
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the Evidence Bundle for the Politics & Worldview tab.

    The Evidence Bundle is the single source of truth for all analysis copy
    and Talk-to-Algorithm responses in the Politics & Worldview tab.

    Epistemic boundaries (enforced):
    - Cannot infer user beliefs, intent, or ideology
    - Cannot infer political persuasion goals of creators
    - Cannot know why algorithm showed this content
    - Cannot assess actual political balance/bias

    Query params:
        debug: If true, includes the raw bundle JSON in the response

    Requires: Authorization header with valid Supabase JWT

    Returns:
        Evidence Bundle with meta, observations, measurements, limits,
        plus generated analysis copy.
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build the Evidence Bundle
    bundle = build_politics_evidence_bundle(scan_result)

    # Generate analysis copy from the bundle
    analysis = generate_politics_analysis_copy(bundle)

    response = {
        "scan_id": scan_id,
        "tab": "politics",
        "bundle": bundle,
        "analysis": analysis,
    }

    # Include debug info if requested (only in dev environments)
    if debug and is_dev_environment():
        response["_debug"] = {
            "raw_bundle": bundle,
            "scan_metadata": scan_result.get("scan_metadata", {}),
            "aggregates": scan_result.get("aggregates", {}),
            "feed_items_count": len(scan_result.get("feed_items", [])),
        }

    return response


@limiter.limit("30/minute")
@router.post("/scans/{scan_id}/talk/politics")
def talk_to_algorithm_politics(
    request: Request,
    scan_id: str,
    question: str = Query(..., description="The user's question"),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a Talk-to-Algorithm response for the Politics & Worldview tab.

    The response is generated ONLY from the Evidence Bundle - never from
    raw feed text or generic explanations.

    Response structure (per accuracy contract):
    1. What we observed (cites 2-4 Evidence Bundle fields)
    2. What it might mean (2-3 labeled hypotheses; no certainty)
    3. What we cannot know (cites limits - ESPECIALLY epistemic boundaries)
    4. What you can try (2-4 non-judgmental, optional actions)

    Args:
        scan_id: The scan ID to generate response for
        question: The user's question

    Returns:
        Structured response with all four sections
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build the Evidence Bundle
    bundle = build_politics_evidence_bundle(scan_result)

    # Generate the Talk response from the bundle
    structured_response = generate_politics_talk_response(bundle, question)

    # Format as readable text
    formatted_text = format_politics_talk_response_as_text(structured_response)

    return {
        "scan_id": scan_id,
        "tab": "politics",
        "question": question,
        "response": {
            "structured": structured_response,
            "formatted_text": formatted_text,
        },
        "cited_fields": structured_response.get("what_we_observed", {}).get("cited_fields", []) +
                       structured_response.get("what_we_cannot_know", {}).get("cited_fields", [])
    }


# ============================================
# Patterns in Your Feed Evidence Bundle Endpoints
# ============================================

@limiter.limit("30/minute")
@router.get("/scans/{scan_id}/evidence-bundle/patterns")
def get_patterns_evidence_bundle(
    request: Request,
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the Evidence Bundle for the Patterns in Your Feed tab.

    The Evidence Bundle is the single source of truth for all analysis copy
    and Talk-to-Algorithm responses in the Patterns tab.

    Epistemic boundaries (enforced):
    - Cannot know why algorithm chose these items
    - Cannot infer user intent or preferences
    - Repetition does not prove manipulation
    - Diversity metrics depend on classifier coverage

    Query params:
        debug: If true, includes the raw bundle JSON in the response

    Returns:
        Evidence Bundle with meta, observations, measurements, limits,
        plus generated analysis copy.
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build the Evidence Bundle
    bundle = build_patterns_evidence_bundle(scan_result)

    # Generate analysis copy from the bundle
    analysis = generate_patterns_analysis_copy(bundle)

    response = {
        "scan_id": scan_id,
        "tab": "patterns",
        "bundle": bundle,
        "analysis": analysis,
    }

    # Include debug info if requested (only in dev environments)
    if debug and is_dev_environment():
        response["_debug"] = {
            "raw_bundle": bundle,
            "scan_metadata": scan_result.get("scan_metadata", {}),
            "aggregates": scan_result.get("aggregates", {}),
            "feed_items_count": len(scan_result.get("feed_items", [])),
        }

    return response


@limiter.limit("30/minute")
@router.post("/scans/{scan_id}/talk/patterns")
def talk_to_algorithm_patterns(
    request: Request,
    scan_id: str,
    question: str = Query(..., description="The user's question"),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a Talk-to-Algorithm response for the Patterns in Your Feed tab.

    The response is generated ONLY from the Evidence Bundle - never from
    raw feed text or generic explanations.

    Response structure (per accuracy contract):
    1. What we observed (cites 2-4 Evidence Bundle fields)
    2. What it might mean (2-3 labeled hypotheses; no certainty)
    3. What we cannot know (cites limits - especially epistemic boundaries)
    4. What you can try (2-4 non-judgmental, optional actions)

    Args:
        scan_id: The scan ID to generate response for
        question: The user's question

    Returns:
        Structured response with all four sections
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build the Evidence Bundle
    bundle = build_patterns_evidence_bundle(scan_result)

    # Generate the Talk response from the bundle
    structured_response = generate_patterns_talk_response(bundle, question)

    # Format as readable text
    formatted_text = format_patterns_talk_response_as_text(structured_response)

    return {
        "scan_id": scan_id,
        "tab": "patterns",
        "question": question,
        "response": {
            "structured": structured_response,
            "formatted_text": formatted_text,
        },
        "cited_fields": structured_response.get("what_we_observed", {}).get("cited_fields", []) +
                       structured_response.get("what_we_cannot_know", {}).get("cited_fields", [])
    }


# ============================================
# Creators & Voices Evidence Bundle Endpoints
# ============================================

@limiter.limit("30/minute")
@router.get("/scans/{scan_id}/evidence-bundle/creators")
def get_creators_evidence_bundle(
    request: Request,
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the Evidence Bundle for the Creators & Voices tab.

    The Evidence Bundle is the single source of truth for all analysis copy
    and Talk-to-Algorithm responses in the Creators & Voices tab.

    Epistemic boundaries (enforced):
    - Cannot infer what user trusts, follows, or agrees with
    - Cannot infer whether creator variety is "good" or "bad"
    - Cannot infer political/media bias from creator list
    - Cannot know why algorithm selected these creators

    Query params:
        debug: If true, includes the raw bundle JSON in the response

    Returns:
        Evidence Bundle with meta, observations, measurements, limits,
        plus generated analysis copy.
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build the Evidence Bundle
    bundle = build_creators_evidence_bundle(scan_result)

    # Generate analysis copy from the bundle
    analysis = generate_creators_analysis_copy(bundle)

    response = {
        "scan_id": scan_id,
        "tab": "creators",
        "bundle": bundle,
        "analysis": analysis,
    }

    # Include debug info if requested (only in dev environments)
    if debug and is_dev_environment():
        response["_debug"] = {
            "raw_bundle": bundle,
            "scan_metadata": scan_result.get("scan_metadata", {}),
            "aggregates": scan_result.get("aggregates", {}),
            "feed_items_count": len(scan_result.get("feed_items", [])),
        }

    return response


@limiter.limit("30/minute")
@router.post("/scans/{scan_id}/talk/creators")
def talk_to_algorithm_creators(
    request: Request,
    scan_id: str,
    question: str = Query(..., description="The user's question"),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a Talk-to-Algorithm response for the Creators & Voices tab.

    The response is generated ONLY from the Evidence Bundle - never from
    raw feed text or generic explanations.

    Response structure (per accuracy contract):
    1. What we observed (cites 2-4 Evidence Bundle fields)
    2. What it might mean (2-3 labeled hypotheses; no certainty)
    3. What we cannot know (cites limits - ESPECIALLY epistemic boundaries)
    4. What you can try (2-4 non-judgmental, optional actions)

    Args:
        scan_id: The scan ID to generate response for
        question: The user's question

    Returns:
        Structured response with all four sections
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build the Evidence Bundle
    bundle = build_creators_evidence_bundle(scan_result)

    # Generate the Talk response from the bundle
    structured_response = generate_creators_talk_response(bundle, question)

    # Format as readable text
    formatted_text = format_creators_talk_response_as_text(structured_response)

    return {
        "scan_id": scan_id,
        "tab": "creators",
        "question": question,
        "response": {
            "structured": structured_response,
            "formatted_text": formatted_text,
        },
        "cited_fields": structured_response.get("what_we_observed", {}).get("cited_fields", []) +
                       structured_response.get("what_we_cannot_know", {}).get("cited_fields", [])
    }


# ============================================
# Inferences Evidence Bundle Endpoints
# ("What the Algorithm Thinks" tab)
# ============================================

@limiter.limit("30/minute")
@router.get("/scans/{scan_id}/evidence-bundle/inferences")
def get_inferences_evidence_bundle(
    request: Request,
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the Evidence Bundle for the "What the Algorithm Thinks" tab.

    This bundle aggregates inference candidates from all other bundles
    (ads, politics, patterns, creators) and applies strict confidence thresholds.

    Key principle: These are "signals present IN the content" not "who you are."

    Epistemic boundaries (enforced):
    - Cannot infer user identity, beliefs, intent, or demographics
    - Cannot infer targeting criteria or why content was shown
    - Cannot infer causal influence on the user
    - These are scan-content signals only

    Query params:
        debug: If true, includes raw bundle and source data in response

    Returns:
        Evidence Bundle with meta, observations (surfaced_inferences),
        measurements (thresholds), limits (epistemic boundaries),
        plus generated analysis copy.
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build source bundles first (for cross-referencing)
    ads_bundle = build_ads_evidence_bundle(scan_result)
    politics_bundle = build_politics_evidence_bundle(scan_result)
    patterns_bundle = build_patterns_evidence_bundle(scan_result)
    creators_bundle = build_creators_evidence_bundle(scan_result)

    # Build the Inferences Evidence Bundle
    bundle = build_inferences_evidence_bundle(
        scan_result,
        ads_bundle=ads_bundle,
        politics_bundle=politics_bundle,
        patterns_bundle=patterns_bundle,
        creators_bundle=creators_bundle,
    )

    # Generate analysis copy from the bundle
    analysis = generate_inferences_analysis_copy(bundle)

    response = {
        "scan_id": scan_id,
        "tab": "inferences",
        "bundle": bundle,
        "analysis": analysis,
    }

    # Include debug info if requested (only in dev environments)
    if debug and is_dev_environment():
        response["_debug"] = {
            "raw_bundle": bundle,
            "source_bundles": {
                "ads": ads_bundle,
                "politics": politics_bundle,
                "patterns": patterns_bundle,
                "creators": creators_bundle,
            },
            "scan_metadata": scan_result.get("scan_metadata", {}),
            "aggregates": scan_result.get("aggregates", {}),
            "feed_items_count": len(scan_result.get("feed_items", [])),
        }

    return response


@limiter.limit("30/minute")
@router.post("/scans/{scan_id}/talk/inferences")
def talk_to_algorithm_inferences(
    request: Request,
    scan_id: str,
    question: str = Query(..., description="The user's question"),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a Talk-to-Algorithm response for the "What the Algorithm Thinks" tab.

    The response is generated ONLY from the Evidence Bundle - never from
    raw feed text or generic explanations.

    Response structure (per accuracy contract):
    1. What we observed (cites 2-4 Evidence Bundle fields)
    2. What it might mean (2-3 labeled hypotheses; no certainty)
    3. What we cannot know (cites limits - ESPECIALLY epistemic boundaries)
    4. What you can try (2-4 non-judgmental, optional actions)

    CRITICAL: Responses must NEVER claim to know:
    - User identity, beliefs, or demographics
    - Why content was shown
    - What targeting criteria were used
    - Causal influence on user behavior

    Args:
        scan_id: The scan ID to generate response for
        question: The user's question

    Returns:
        Structured response with all four sections
    """
    user_id = current_user["user_id"]
    _require_plus(user_id)
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})

    # Build source bundles
    ads_bundle = build_ads_evidence_bundle(scan_result)
    politics_bundle = build_politics_evidence_bundle(scan_result)
    patterns_bundle = build_patterns_evidence_bundle(scan_result)
    creators_bundle = build_creators_evidence_bundle(scan_result)

    # Build the Inferences Evidence Bundle
    bundle = build_inferences_evidence_bundle(
        scan_result,
        ads_bundle=ads_bundle,
        politics_bundle=politics_bundle,
        patterns_bundle=patterns_bundle,
        creators_bundle=creators_bundle,
    )

    # Generate the Talk response from the bundle
    structured_response = generate_inferences_talk_response(bundle, question)

    # Format as readable text
    formatted_text = format_inferences_talk_response_as_text(structured_response)

    return {
        "scan_id": scan_id,
        "tab": "inferences",
        "question": question,
        "response": {
            "structured": structured_response,
            "formatted_text": formatted_text,
        },
        "cited_fields": structured_response.get("what_we_observed", {}).get("cited_fields", []) +
                       structured_response.get("what_we_cannot_know", {}).get("cited_fields", [])
    }
