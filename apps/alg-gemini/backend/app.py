from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import shutil
import os
import uuid
import threading
from datetime import datetime
from video_processor import process_video
from models import ScanResult  # Keeping for backward compat if needed, but not used in endpoint
from unified_scan_models import UnifiedScanResult
from database import (
    init_database, save_scan, get_all_scans, get_scan_by_id, delete_scan,
    create_pending_scan, update_scan_result, update_scan_error, get_scan_status
)
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
from ocr_utils import get_ocr_debug_enabled

app = FastAPI(title="AlgorithmLens Backend")

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_database()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure tmp directory exists
TMP_DIR = os.path.join(os.path.dirname(__file__), "tmp")
os.makedirs(TMP_DIR, exist_ok=True)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/ocr-status")
def ocr_status():
    """
    Check OCR system status and configuration.

    Returns:
        OCR debug mode status and configuration details
    """
    return {
        "ocr_debug_enabled": get_ocr_debug_enabled(),
        "debug_env_var": "ALGO_OCR_DEBUG",
        "debug_output_dir": "backend/ocr_debug/",
        "preprocessing_pipeline": [
            "grayscale",
            "2x_upscale",
            "clahe_contrast",
            "adaptive_threshold"
        ],
        "ad_disclosure_tokens": [
            "ad", "sponsored", "promoted", "advertisement",
            "paid partnership", "paid promotion", "#ad", "#sponsored"
        ]
    }


@app.get("/api/scans/{scan_id}/ocr-diagnostics")
def get_scan_ocr_diagnostics(scan_id: str):
    """
    Get OCR diagnostics for a specific scan.

    Returns detailed OCR extraction metrics for MOBILE_VIDEO scans.
    Useful for verifying OCR is working correctly.
    """
    scan = get_scan_by_id(scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    scan_result = scan.get("result", {})
    scan_metadata = scan_result.get("scan_metadata", {})
    feed_items = scan_result.get("feed_items", [])
    debug_info = scan_result.get("debug") or {}

    # Count OCR metrics
    total_items = len(feed_items)
    items_with_ocr_text = 0
    ocr_ad_detections = 0
    sample_ocr_texts = []

    for item in feed_items:
        content_text = item.get("content_text", {})
        on_screen_labels = content_text.get("on_screen_labels", [])

        # Check for non-empty OCR text
        for label in on_screen_labels:
            if label and label.strip():
                items_with_ocr_text += 1
                # Collect sample (first 5 non-empty)
                if len(sample_ocr_texts) < 5:
                    sample_ocr_texts.append({
                        "frame": item.get("position_in_feed"),
                        "text_length": len(label),
                        "text_preview": label[:100]
                    })
                break

        # Check for OCR-based ad detection
        ad_meta = item.get("ad_metadata", {})
        if ad_meta and ad_meta.get("ad_detected_reason") == "ocr_disclosure_token":
            ocr_ad_detections += 1

    ocr_rate = (items_with_ocr_text / total_items * 100) if total_items > 0 else 0

    return {
        "scan_id": scan_id,
        "source_type": scan_metadata.get("source_type"),
        "platform": scan_metadata.get("platform"),
        "total_frames": total_items,
        "frames_with_ocr_text": items_with_ocr_text,
        "ocr_extraction_rate_percent": round(ocr_rate, 1),
        "ads_detected_via_ocr": ocr_ad_detections,
        "ocr_summary_from_processing": (debug_info.get("raw_backend_payload") or {}).get("ocr_summary"),
        "sample_ocr_texts": sample_ocr_texts,
        "ocr_debug_enabled": get_ocr_debug_enabled(),
        "verdict": "OCR_WORKING" if items_with_ocr_text > 0 else "OCR_EMPTY"
    }

def _process_video_background(scan_id: str, file_path: str, user_id: str, platform: str):
    """
    Background task to process video and update scan result.
    Runs in a separate thread to avoid blocking the request.
    """
    print(f"[upload] Background processing STARTED for scan {scan_id}")

    try:
        # Process video (this is the expensive operation)
        result = process_video(file_path, user_id=user_id, platform=platform)

        # Override the scan_id to match our pre-generated one
        result_dict = result.model_dump()
        result_dict["scan_metadata"]["scan_id"] = scan_id
        result_dict["scan_metadata"]["created_at"] = result_dict["scan_metadata"]["created_at"].isoformat()

        # Update database with completed result
        update_scan_result(scan_id, result_dict, status="completed")

        print(f"[upload] Background processing COMPLETED for scan {scan_id}: "
              f"{result_dict['aggregates']['total_feed_items']} items, "
              f"{result_dict['aggregates']['total_ads']} ads")

    except Exception as e:
        print(f"[upload] Background processing FAILED for scan {scan_id}: {e}")
        update_scan_error(scan_id, str(e))

        # Cleanup file on error
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass


@app.post("/api/scan/upload")
async def upload_scan(
    file: UploadFile = File(...),
    userId: str = Form("demo-user"),
    platform: str = Form("tiktok")
):
    """
    Upload a mobile screen recording for analysis.

    Returns immediately with scan_id. Processing runs in background.
    Frontend should poll /api/scans/{scan_id} for status.

    Returns:
        scan_id: Unique identifier for this scan
        status: 'processing' (will become 'completed' or 'failed')
    """
    print(f"[upload] Received upload request: file={file.filename}, platform={platform}")

    # Generate unique scan_id and filename
    scan_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    if not file_ext:
        file_ext = ".mp4"  # Default to mp4 if no extension

    temp_filename = f"{scan_id}{file_ext}"
    temp_file_path = os.path.join(TMP_DIR, temp_filename)

    try:
        # Save uploaded file
        print(f"[upload] Saving file to {temp_file_path}")
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(temp_file_path)
        print(f"[upload] File saved: {file_size} bytes")

        # Create pending scan record in database
        create_pending_scan(scan_id, platform, userId)

        # Start background processing in a thread
        # Using threading instead of BackgroundTasks because process_video is CPU-bound
        thread = threading.Thread(
            target=_process_video_background,
            args=(scan_id, temp_file_path, userId, platform),
            daemon=True
        )
        thread.start()

        print(f"[upload] Returning scan_id={scan_id}, processing in background")

        # Return immediately with scan_id
        return {
            "scan_id": scan_id,
            "status": "processing",
            "message": "Upload successful. Processing started in background."
        }

    except Exception as e:
        print(f"[upload] Error during upload: {e}")
        # Cleanup on failure
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError:
                pass
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Status Endpoint (for polling)
# ============================================

@app.get("/api/scans/{scan_id}/status")
def get_scan_status_endpoint(scan_id: str):
    """
    Lightweight status check for scan processing.

    Use this endpoint for polling during video processing.
    Returns only status info without the full result payload.

    Status values:
        - processing: Video is being analyzed
        - completed: Analysis finished, result available
        - failed: Processing error occurred

    Returns:
        scan_id, status, error_message (if failed), total_items, total_ads
    """
    status = get_scan_status(scan_id)
    if status is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    return status


# ============================================
# History Endpoints
# ============================================

@app.get("/api/scans")
def list_scans():
    """
    Get list of all past scans (without full result JSON).
    Returns scans sorted by created_at descending (newest first).
    """
    scans = get_all_scans()
    return {"scans": scans}


@app.get("/api/scans/{scan_id}")
def get_scan(scan_id: str):
    """
    Get a single scan by ID, including the full UnifiedScanResult.
    """
    scan = get_scan_by_id(scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    return scan


@app.delete("/api/scans/{scan_id}")
def remove_scan(scan_id: str):
    """
    Delete a scan by ID.
    """
    deleted = delete_scan(scan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    return {"deleted": True, "scan_id": scan_id}


# ============================================
# Desktop Extension Endpoint
# ============================================

@app.post("/api/scan/desktop")
async def desktop_scan(scan_result: dict):
    """
    Receive a desktop extension scan result (UnifiedScanResult) and save it to the database.
    
    The extension sends a fully-formed UnifiedScanResult JSON object.
    This endpoint validates it has the required fields and saves it.
    
    Supports all platforms: tiktok, instagram, youtube, facebook, twitter
    (Reddit is temporarily disabled in the extension but would work here)
    
    Returns:
        Summary with scan_id, created_at, platform, total_items, total_ads, ad_percentage
    """
    try:
        # Validate required fields exist
        scan_metadata = scan_result.get("scan_metadata", {})
        aggregates = scan_result.get("aggregates", {})
        feed_items = scan_result.get("feed_items", [])
        
        # Log received payload summary for debugging
        platform_summary = {}
        for item in feed_items:
            # Feed items don't have platform directly, but we count them
            platform_summary["items"] = platform_summary.get("items", 0) + 1
            if item.get("is_ad"):
                platform_summary["ads"] = platform_summary.get("ads", 0) + 1
        
        print(f"[desktop_scan] Ingest handler: received posts summary: {platform_summary}")
        
        scan_id = scan_metadata.get("scan_id")
        if not scan_id:
            raise HTTPException(status_code=400, detail="Missing scan_id in scan_metadata")
        
        # Ensure source_type is set correctly
        if "source_type" not in scan_metadata:
            scan_metadata["source_type"] = "DESKTOP_EXTENSION"
        
        # Get created_at (use current time if not provided)
        created_at = scan_metadata.get("created_at")
        if not created_at:
            created_at = datetime.now().isoformat()
            scan_metadata["created_at"] = created_at
        
        # Extract summary fields
        platform = scan_metadata.get("platform", "UNKNOWN")
        total_items = aggregates.get("total_feed_items", 0)
        total_ads = aggregates.get("total_ads", 0)
        ad_percentage = aggregates.get("ad_percentage", 0.0)
        
        # Save to database (same function used by mobile scans)
        save_scan(scan_result)
        
        print(f"[desktop_scan] Saved desktop scan {scan_id}: {total_items} items, {total_ads} ads")
        
        return {
            "success": True,
            "scan_id": scan_id,
            "created_at": created_at,
            "platform": platform,
            "total_items": total_items,
            "total_ads": total_ads,
            "ad_percentage": ad_percentage,
            "message": "Desktop scan saved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[desktop_scan] Error saving scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Evidence Bundle Endpoints
# ============================================

@app.get("/api/scans/{scan_id}/evidence-bundle/ads")
def get_ads_evidence_bundle(
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging")
):
    """
    Get the Evidence Bundle for the Ads & Influence tab.

    The Evidence Bundle is the single source of truth for all analysis copy
    and Talk-to-Algorithm responses in the Ads & Influence tab.

    Query params:
        debug: If true, includes the raw bundle JSON in the response

    Returns:
        Evidence Bundle with meta, observations, measurements, limits,
        plus generated analysis copy and Talk response structure.
    """
    scan = get_scan_by_id(scan_id)
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

    # Include debug info if requested
    if debug:
        response["_debug"] = {
            "raw_bundle": bundle,
            "scan_metadata": scan_result.get("scan_metadata", {}),
            "aggregates": scan_result.get("aggregates", {}),
            "feed_items_count": len(scan_result.get("feed_items", [])),
        }

    return response


@app.post("/api/scans/{scan_id}/talk/ads")
def talk_to_algorithm_ads(
    scan_id: str,
    question: str = Form(..., description="The user's question")
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

    Args:
        scan_id: The scan ID to generate response for
        question: The user's question

    Returns:
        Structured response with all four sections
    """
    scan = get_scan_by_id(scan_id)
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

@app.get("/api/scans/{scan_id}/evidence-bundle/politics")
def get_politics_evidence_bundle(
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging")
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

    Returns:
        Evidence Bundle with meta, observations, measurements, limits,
        plus generated analysis copy.
    """
    scan = get_scan_by_id(scan_id)
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

    # Include debug info if requested
    if debug:
        response["_debug"] = {
            "raw_bundle": bundle,
            "scan_metadata": scan_result.get("scan_metadata", {}),
            "aggregates": scan_result.get("aggregates", {}),
            "feed_items_count": len(scan_result.get("feed_items", [])),
        }

    return response


@app.post("/api/scans/{scan_id}/talk/politics")
def talk_to_algorithm_politics(
    scan_id: str,
    question: str = Form(..., description="The user's question")
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
    scan = get_scan_by_id(scan_id)
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

@app.get("/api/scans/{scan_id}/evidence-bundle/patterns")
def get_patterns_evidence_bundle(
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging")
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
    scan = get_scan_by_id(scan_id)
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

    # Include debug info if requested
    if debug:
        response["_debug"] = {
            "raw_bundle": bundle,
            "scan_metadata": scan_result.get("scan_metadata", {}),
            "aggregates": scan_result.get("aggregates", {}),
            "feed_items_count": len(scan_result.get("feed_items", [])),
        }

    return response


@app.post("/api/scans/{scan_id}/talk/patterns")
def talk_to_algorithm_patterns(
    scan_id: str,
    question: str = Form(..., description="The user's question")
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
    scan = get_scan_by_id(scan_id)
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

@app.get("/api/scans/{scan_id}/evidence-bundle/creators")
def get_creators_evidence_bundle(
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging")
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
    scan = get_scan_by_id(scan_id)
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

    # Include debug info if requested
    if debug:
        response["_debug"] = {
            "raw_bundle": bundle,
            "scan_metadata": scan_result.get("scan_metadata", {}),
            "aggregates": scan_result.get("aggregates", {}),
            "feed_items_count": len(scan_result.get("feed_items", [])),
        }

    return response


@app.post("/api/scans/{scan_id}/talk/creators")
def talk_to_algorithm_creators(
    scan_id: str,
    question: str = Form(..., description="The user's question")
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
    scan = get_scan_by_id(scan_id)
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

@app.get("/api/scans/{scan_id}/evidence-bundle/inferences")
def get_inferences_evidence_bundle(
    scan_id: str,
    debug: Optional[bool] = Query(False, description="Include raw bundle in response for debugging")
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
    scan = get_scan_by_id(scan_id)
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

    # Include debug info if requested
    if debug:
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


@app.post("/api/scans/{scan_id}/talk/inferences")
def talk_to_algorithm_inferences(
    scan_id: str,
    question: str = Form(..., description="The user's question")
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
    scan = get_scan_by_id(scan_id)
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
