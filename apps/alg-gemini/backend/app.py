from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import shutil
import os
import uuid
from datetime import datetime
from video_processor import process_video
from models import ScanResult # Keeping for backward compat if needed, but not used in endpoint
from unified_scan_models import UnifiedScanResult
from database import init_database, save_scan, get_all_scans, get_scan_by_id, delete_scan

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

@app.post("/api/scan/upload", response_model=UnifiedScanResult)
async def upload_scan(
    file: UploadFile = File(...),
    userId: str = Form("demo-user"),
    platform: str = Form("tiktok")
):
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    if not file_ext:
        file_ext = ".mp4" # Default to mp4 if no extension
        
    temp_filename = f"{uuid.uuid4()}{file_ext}"
    temp_file_path = os.path.join(TMP_DIR, temp_filename)
    
    try:
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Process video
        # Note: This is synchronous for MVP as requested. 
        # For production, this should be a background task.
        result = process_video(temp_file_path, user_id=userId, platform=platform)
        
        # Save scan result to database
        result_dict = result.model_dump()
        # Convert datetime to ISO string for JSON serialization
        result_dict["scan_metadata"]["created_at"] = result_dict["scan_metadata"]["created_at"].isoformat()
        save_scan(result_dict)
        
        return result
        
    except Exception as e:
        # Ensure cleanup on failure
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError:
                pass
        raise HTTPException(status_code=500, detail=str(e))


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
