"""Scan management endpoints (upload, list, retrieve, delete, status)."""
import json
import logging
import os
import shutil
import signal
import sys
import threading
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from video_processor import process_video
from database import (
    create_pending_scan, update_scan_result, update_scan_error, get_scan_status,
    get_scans_by_user, get_scan_by_id_for_user, delete_scan
)
from auth import get_current_user
from config import is_dev_environment
from ocr_utils import get_ocr_debug_enabled
from validation import validate_scan_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["scans"])
limiter = Limiter(key_func=get_remote_address)

# Ensure tmp directory exists
TMP_DIR = os.path.join(os.path.dirname(__file__), "..", "tmp")
os.makedirs(TMP_DIR, exist_ok=True)

# Upload validation constants
MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB
ALLOWED_VIDEO_CONTENT_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
    "video/x-matroska", "video/mpeg", "application/octet-stream",
}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv", ".mpeg"}
PROCESSING_TIMEOUT_SECONDS = 30 * 60  # 30 minutes


class _ProcessingTimeoutError(Exception):
    """Raised when video processing exceeds the time limit."""
    pass


def _process_video_background(scan_id: str, file_path: str, user_id: str, platform: str):
    """
    Background task to process video and update scan result.
    Runs in a separate thread to avoid blocking the request.
    Includes a timeout to prevent stuck processing jobs.
    """
    logger.info(f"Background processing STARTED for scan {scan_id}")

    def _timeout_handler(signum, frame):
        raise _ProcessingTimeoutError(f"Processing exceeded {PROCESSING_TIMEOUT_SECONDS}s limit")

    try:
        # Set timeout for processing (only works on Unix; silently skipped on Windows)
        try:
            old_handler = signal.signal(signal.SIGALRM, _timeout_handler)
            signal.alarm(PROCESSING_TIMEOUT_SECONDS)
        except (AttributeError, ValueError) as e:
            # signal.SIGALRM not available on Windows or in non-main threads
            # Timeout protection is best-effort
            logger.debug(f"Signal alarm not available (platform limitation): {e}")
            old_handler = None

        # Process video (this is the expensive operation)
        result = process_video(file_path, user_id=user_id, platform=platform)

        # Cancel the alarm if processing finished in time
        try:
            signal.alarm(0)
            if old_handler is not None:
                signal.signal(signal.SIGALRM, old_handler)
        except (AttributeError, ValueError) as e:
            logger.debug(f"Error cleaning up signal handler: {e}")

        # Override the scan_id to match our pre-generated one
        result_dict = result.model_dump()
        result_dict["scan_metadata"]["scan_id"] = scan_id
        result_dict["scan_metadata"]["created_at"] = result_dict["scan_metadata"]["created_at"].isoformat()

        # Update database with completed result
        update_scan_result(scan_id, result_dict, status="completed")

        logger.info(
            f"Background processing COMPLETED for scan {scan_id}: "
            f"{result_dict['aggregates']['total_feed_items']} items, "
            f"{result_dict['aggregates']['total_ads']} ads"
        )

    except Exception as e:
        error_msg = "Scan processing failed. This can happen with very short videos or unsupported formats. Please try uploading a longer recording (at least 30 seconds)."
        logger.error(f"Background processing FAILED for scan {scan_id}: {e}")
        update_scan_error(scan_id, error_msg)

        # Cleanup file on error
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError as e:
                logger.warning(f"Failed to clean up file {file_path}: {e}")


@router.post("/scan/upload")
@limiter.limit("10/minute")
async def upload_scan(
    request: Request,
    file: UploadFile = File(...),
    platform: str = Form("tiktok"),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a mobile screen recording for analysis.

    Returns immediately with scan_id. Processing runs in background.
    Frontend should poll /api/scans/{scan_id} for status.

    Requires: Authorization header with valid Supabase JWT

    Returns:
        scan_id: Unique identifier for this scan
        status: 'processing' (will become 'completed' or 'failed')
    """
    user_id = current_user["user_id"]
    logger.info(f"Received upload request: file={file.filename}, platform={platform}, user_id={user_id}")

    # Validate platform
    from shared_constants import ALL_ACCEPTED_PLATFORMS
    platform_lower = platform.lower()
    if platform_lower not in ALL_ACCEPTED_PLATFORMS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported platform '{platform}'. Supported platforms: {', '.join(sorted(ALL_ACCEPTED_PLATFORMS))}"
        )

    # Validate content type
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_VIDEO_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a video file (MP4, MOV, AVI, WebM)."
        )

    # Generate unique scan_id and filename
    scan_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if not file_ext:
        file_ext = ".mp4"  # Default to mp4 if no extension
    elif file_ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file extension. Please upload a video file (MP4, MOV, AVI, WebM)."
        )

    temp_filename = f"{scan_id}{file_ext}"
    temp_file_path = os.path.join(TMP_DIR, temp_filename)

    try:
        # Save uploaded file
        logger.info(f"Saving file to {temp_file_path}")
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(temp_file_path)
        logger.info(f"File saved: {file_size} bytes")

        # Validate file size after save
        if file_size > MAX_UPLOAD_SIZE_BYTES:
            os.remove(temp_file_path)
            raise HTTPException(
                status_code=413,
                detail="File too large. Maximum upload size is 500 MB."
            )

        # Create pending scan record in database (use authenticated user_id)
        create_pending_scan(scan_id, platform, user_id)

        # Start background processing in a thread
        # Using threading instead of BackgroundTasks because process_video is CPU-bound
        thread = threading.Thread(
            target=_process_video_background,
            args=(scan_id, temp_file_path, user_id, platform),
            daemon=True
        )
        thread.start()

        logger.info(f"Returning scan_id={scan_id}, processing in background")

        # Return immediately with scan_id
        return {
            "scan_id": scan_id,
            "status": "processing",
            "message": "Upload successful. Processing started in background."
        }

    except HTTPException:
        raise  # Re-raise HTTP exceptions (like 400/413) without wrapping
    except Exception as e:
        logger.error(f"Error during upload: {type(e).__name__}: {e}", exc_info=True)
        # Cleanup on failure
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError as cleanup_error:
                logger.warning(f"Failed to clean up file {temp_file_path}: {cleanup_error}")
        # Hide detailed error messages in production
        if is_dev_environment():
            raise HTTPException(status_code=500, detail=f"Upload error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload processing failed")


@router.get("/scans/{scan_id}/status")
def get_scan_status_endpoint(scan_id: str, current_user: dict = Depends(get_current_user)):
    """
    Lightweight status check for scan processing.

    Use this endpoint for polling during video processing.
    Returns only status info without the full result payload.

    Status values:
        - processing: Video is being analyzed
        - completed: Analysis finished, result available
        - failed: Processing error occurred

    Requires: Authorization header with valid Supabase JWT

    Returns:
        scan_id, status, error_message (if failed), total_items, total_ads
    """
    validate_scan_id(scan_id)
    # Verify ownership before returning status
    user_id = current_user["user_id"]
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")

    # Return lightweight status (could optimize this to not fetch full scan)
    status = get_scan_status(scan_id)
    return status


@router.get("/scans")
def list_scans(current_user: dict = Depends(get_current_user)):
    """
    Get list of scans for the authenticated user (without full result JSON).
    Returns scans sorted by created_at descending (newest first).

    Requires: Authorization header with valid Supabase JWT
    """
    user_id = current_user["user_id"]
    scans = get_scans_by_user(user_id)
    return {"scans": scans}


@router.get("/scans/{scan_id}")
def get_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get a single scan by ID, including the full UnifiedScanResult.

    Returns 404 if scan doesn't exist OR doesn't belong to authenticated user.
    This prevents leaking scan existence to unauthorized users.

    Requires: Authorization header with valid Supabase JWT
    """
    validate_scan_id(scan_id)
    user_id = current_user["user_id"]
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    return scan


@router.delete("/scans/{scan_id}")
def remove_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a scan by ID.

    Requires: Authorization header with valid Supabase JWT.
    Only the scan owner can delete their scan.
    """
    validate_scan_id(scan_id)
    user_id = current_user["user_id"]
    # Verify ownership before deletion
    scan = get_scan_by_id_for_user(scan_id, user_id)
    if scan is None:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    deleted = delete_scan(scan_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
    return {"deleted": True, "scan_id": scan_id}


@router.post("/scan/desktop")
async def desktop_scan(scan_result: dict, current_user: dict = Depends(get_current_user)):
    """
    Receive a desktop extension scan result (UnifiedScanResult) and save it to the database.

    The extension sends a fully-formed UnifiedScanResult JSON object.
    This endpoint validates it has the required fields and saves it.

    Supports all platforms: tiktok, instagram, youtube, facebook, twitter
    (Reddit is temporarily disabled in the extension but would work here)

    Gemini AI Analysis:
        - Only runs if extension sends gemini_consent=true in the payload
        - Also requires GEMINI_API_KEY environment variable to be set
        - If consent not given or key not set, fields remain NOT_ANALYZED/null

    Requires: Authorization header with valid Supabase JWT

    Returns:
        Summary with scan_id, created_at, platform, total_items, total_ads, ad_percentage, ai_analyzed
    """
    from gemini_analyzer import analyze_scan
    from database import save_scan

    try:
        # Validate payload format
        if not isinstance(scan_result, dict):
            raise HTTPException(status_code=400, detail="Invalid scan result format")

        # Validate payload size (prevent memory exhaustion from oversized payloads)
        payload_size = sys.getsizeof(json.dumps(scan_result)) if scan_result else 0
        if payload_size > 10 * 1024 * 1024:  # 10MB max for desktop scan JSON
            raise HTTPException(status_code=413, detail="Scan payload too large")

        # Validate required structure
        scan_metadata = scan_result.get("scan_metadata")
        if not isinstance(scan_metadata, dict):
            raise HTTPException(status_code=400, detail="Missing or invalid scan_metadata")

        # Get authenticated user_id (override any user_identifier in scan_metadata)
        user_id = current_user["user_id"]

        # Extract consent flag from payload (default: False for safety)
        gemini_consent = scan_result.pop("gemini_consent", False)

        # Validate required fields exist
        scan_metadata = scan_result.get("scan_metadata", {})
        aggregates = scan_result.get("aggregates", {})
        feed_items = scan_result.get("feed_items", [])

        # Override user_identifier with authenticated user_id
        scan_metadata["user_identifier"] = user_id

        scan_id = scan_metadata.get("scan_id")

        # Validate scan_id format
        if scan_id:
            try:
                validate_scan_id(scan_id)
            except HTTPException:
                raise HTTPException(status_code=400, detail="Invalid scan_id format in scan_metadata")

        platform = scan_metadata.get("platform", "UNKNOWN")
        payload_size = len(str(scan_result))

        # [CaptureDebug] Log request received
        logger.info(f"[CaptureDebug][Backend] Request received - scanId: {scan_id}, platform: {platform}, payload_size: {payload_size} bytes")

        # Log received payload summary for debugging
        platform_summary = {}
        for item in feed_items:
            # Feed items don't have platform directly, but we count them
            platform_summary["items"] = platform_summary.get("items", 0) + 1
            if item.get("is_ad"):
                platform_summary["ads"] = platform_summary.get("ads", 0) + 1

        logger.info(f"Ingest handler: received posts summary: {platform_summary}")
        logger.info(f"[CaptureDebug][Backend] feed_items count: {len(feed_items)}, aggregates.total_feed_items: {aggregates.get('total_feed_items', 0)}")

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
        total_items = aggregates.get("total_feed_items", 0)
        total_ads = aggregates.get("total_ads", 0)
        ad_percentage = aggregates.get("ad_percentage", 0.0)

        # [CaptureDebug] Log computed n_items that analysis will see
        logger.info(f"[CaptureDebug][Backend] Computed n_items (total_feed_items): {total_items}, total_ads: {total_ads}")

        # Run Gemini AI analysis if user consented
        # Policy: Gemini is CORE to every scan, not a separate tier
        # - If consent given, Gemini ALWAYS runs (unless runtime error)
        # - gemini_reason may only be: "no_consent", "success", or "error:<message>"
        ai_analyzed = False
        gemini_reason = None

        if not gemini_consent:
            gemini_reason = "no_consent"
            logger.info(f"Gemini skipped: user did not consent to AI analysis")
        else:
            try:
                logger.info(f"Running Gemini AI analysis for {total_items} posts (consent=True)...")
                scan_result, ai_analyzed, gemini_reason = analyze_scan(scan_result)
                if ai_analyzed:
                    logger.info(f"Gemini analysis complete")
                else:
                    logger.info(f"Gemini analysis did not run: {gemini_reason}")
            except Exception as e:
                gemini_reason = f"error:{str(e)}"
                logger.error(f"Gemini analysis failed (non-fatal): {e}")

        # Add debug info about Gemini analysis to the scan result
        # Debug fields: gemini_consent, gemini_attempted, gemini_used, gemini_reason
        if "debug" not in scan_result:
            scan_result["debug"] = {}
        scan_result["debug"]["gemini_consent"] = gemini_consent
        scan_result["debug"]["gemini_attempted"] = gemini_consent  # If consent given, we always attempt
        scan_result["debug"]["gemini_used"] = ai_analyzed
        scan_result["debug"]["gemini_reason"] = gemini_reason

        # Save to database (same function used by mobile scans)
        save_scan(scan_result)

        logger.info(f"Saved desktop scan {scan_id}: {total_items} items, {total_ads} ads")

        # Extract Gemini-enriched data to return to extension
        # This allows the popup to show AI-classified topics instead of keyword-based
        enriched_aggregates = scan_result.get("aggregates", {})
        enriched_topic_distribution = enriched_aggregates.get("topic_distribution", [])
        enriched_wellbeing_summary = enriched_aggregates.get("wellbeing_summary", {})
        enriched_political_summary = enriched_aggregates.get("political_content_summary", {})

        return {
            "success": True,
            "scan_id": scan_id,
            "created_at": created_at,
            "platform": platform,
            "total_items": total_items,
            "total_ads": total_ads,
            "ad_percentage": ad_percentage,
            "ai_analyzed": ai_analyzed,
            "message": "Desktop scan saved successfully",
            # Gemini-enriched data for popup display
            "topic_distribution": enriched_topic_distribution if ai_analyzed else None,
            "wellbeing_summary": enriched_wellbeing_summary if ai_analyzed else None,
            "political_content_summary": enriched_political_summary if ai_analyzed else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving scan: {e}")
        raise HTTPException(status_code=500, detail="Scan could not be saved due to a server issue. Please try scanning again in a few moments.")


@router.get("/scans/{scan_id}/ocr-diagnostics")
def get_scan_ocr_diagnostics(scan_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get OCR diagnostics for a specific scan.

    Returns detailed OCR extraction metrics for MOBILE_VIDEO scans.
    Useful for verifying OCR is working correctly.

    Requires: Authorization header with valid Supabase JWT
    """
    validate_scan_id(scan_id)
    user_id = current_user["user_id"]
    scan = get_scan_by_id_for_user(scan_id, user_id)
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
