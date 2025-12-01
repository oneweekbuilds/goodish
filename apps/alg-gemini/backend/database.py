"""
SQLite database for storing AlgorithmLens scan history.
"""
import sqlite3
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any

# Database file path (same directory as this file)
DB_PATH = os.path.join(os.path.dirname(__file__), "scans.db")


def get_connection() -> sqlite3.Connection:
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Enable dict-like access
    return conn


def init_database():
    """Initialize the database with required tables."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create scans table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            platform TEXT NOT NULL,
            user_id TEXT,
            duration_seconds REAL,
            total_items INTEGER DEFAULT 0,
            total_ads INTEGER DEFAULT 0,
            ad_percentage REAL DEFAULT 0.0,
            result_json TEXT NOT NULL
        )
    """)
    
    # Create index on created_at for faster sorting
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC)
    """)
    
    conn.commit()
    conn.close()
    print(f"[database] Initialized database at {DB_PATH}")


def save_scan(scan_result: Dict[str, Any]) -> str:
    """
    Save a scan result to the database.
    Returns the scan_id.
    
    Duration is extracted from multiple possible sources (in order of priority):
    1. aggregates.duration_seconds (session scans)
    2. scan_metadata.session_duration_seconds (session scans)
    3. environment.video_capture.duration_seconds (video scans)
    4. environment.extension_capture.session_duration_seconds (session scans)
    5. Fallback to 0
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Extract fields from the unified scan result
    scan_id = scan_result.get("scan_metadata", {}).get("scan_id", "")
    created_at = scan_result.get("scan_metadata", {}).get("created_at", datetime.now().isoformat())
    platform = scan_result.get("scan_metadata", {}).get("platform", "UNKNOWN")
    user_id = scan_result.get("scan_metadata", {}).get("user_identifier", "")
    
    # Get aggregates
    aggregates = scan_result.get("aggregates", {})
    total_items = aggregates.get("total_feed_items", 0)
    total_ads = aggregates.get("total_ads", 0)
    ad_percentage = aggregates.get("ad_percentage", 0.0)
    
    # Get duration from multiple possible sources (session scans vs video scans)
    # Use isinstance checks to ensure we get numeric values, not falsy 0s
    duration_seconds = 0
    
    # Extract nested objects safely
    scan_metadata = scan_result.get("scan_metadata", {}) or {}
    environment = scan_result.get("environment", {}) or {}
    ext_capture = environment.get("extension_capture", {}) or {}
    video_capture = environment.get("video_capture", {}) or {}
    
    # Priority 1: aggregates.duration_seconds (session scans inject here)
    agg_duration = aggregates.get("duration_seconds")
    if isinstance(agg_duration, (int, float)) and agg_duration > 0:
        duration_seconds = agg_duration
        print(f"[database] Using aggregates.duration_seconds: {duration_seconds}")
    # Priority 2: scan_metadata.session_duration_seconds
    elif isinstance(scan_metadata.get("session_duration_seconds"), (int, float)) and scan_metadata.get("session_duration_seconds") > 0:
        duration_seconds = scan_metadata["session_duration_seconds"]
        print(f"[database] Using scan_metadata.session_duration_seconds: {duration_seconds}")
    # Priority 3: environment.video_capture.duration_seconds (video uploads)
    elif isinstance(video_capture.get("duration_seconds"), (int, float)) and video_capture.get("duration_seconds") > 0:
        duration_seconds = video_capture["duration_seconds"]
        print(f"[database] Using video_capture.duration_seconds: {duration_seconds}")
    # Priority 4: environment.extension_capture.session_duration_seconds
    elif isinstance(ext_capture.get("session_duration_seconds"), (int, float)) and ext_capture.get("session_duration_seconds") > 0:
        duration_seconds = ext_capture["session_duration_seconds"]
        print(f"[database] Using extension_capture.session_duration_seconds: {duration_seconds}")
    else:
        print(f"[database] No valid duration found, using default: {duration_seconds}")
    
    # Serialize the full result to JSON
    result_json = json.dumps(scan_result)
    
    cursor.execute("""
        INSERT OR REPLACE INTO scans 
        (id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (scan_id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json))
    
    conn.commit()
    conn.close()
    
    print(f"[database] Saved scan {scan_id} to database")
    return scan_id


def get_all_scans() -> List[Dict[str, Any]]:
    """
    Get list of all scans (without full result JSON for efficiency).
    Returns list sorted by created_at descending (newest first).
    Includes source_type extracted from result_json for UI display logic.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json
        FROM scans
        ORDER BY created_at DESC
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    scans = []
    for row in rows:
        # Extract source_type from the stored result JSON
        source_type = None
        try:
            result_data = json.loads(row["result_json"])
            source_type = result_data.get("scan_metadata", {}).get("source_type", None)
        except (json.JSONDecodeError, TypeError):
            pass
        
        scans.append({
            "id": row["id"],
            "created_at": row["created_at"],
            "platform": row["platform"],
            "user_id": row["user_id"],
            "duration_seconds": row["duration_seconds"],
            "total_items": row["total_items"],
            "total_ads": row["total_ads"],
            "ad_percentage": row["ad_percentage"],
            "source_type": source_type
        })
    
    return scans


def get_scan_by_id(scan_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a single scan by ID, including the full result JSON.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json
        FROM scans
        WHERE id = ?
    """, (scan_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        return None
    
    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "platform": row["platform"],
        "user_id": row["user_id"],
        "duration_seconds": row["duration_seconds"],
        "total_items": row["total_items"],
        "total_ads": row["total_ads"],
        "ad_percentage": row["ad_percentage"],
        "result": json.loads(row["result_json"])
    }


def delete_scan(scan_id: str) -> bool:
    """Delete a scan by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    deleted = cursor.rowcount > 0
    
    conn.commit()
    conn.close()
    
    return deleted

