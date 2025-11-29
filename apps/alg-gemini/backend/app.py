from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import shutil
import os
import uuid
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
