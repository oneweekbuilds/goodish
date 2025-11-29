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
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Extract fields from the unified scan result
    scan_id = scan_result.get("scan_metadata", {}).get("scan_id", "")
    created_at = scan_result.get("scan_metadata", {}).get("created_at", datetime.now().isoformat())
    platform = scan_result.get("scan_metadata", {}).get("platform", "UNKNOWN")
    user_id = scan_result.get("scan_metadata", {}).get("user_identifier", "")
    
    # Get duration from environment.video_capture
    video_capture = scan_result.get("environment", {}).get("video_capture", {})
    duration_seconds = video_capture.get("duration_seconds", 0) if video_capture else 0
    
    # Get aggregates
    aggregates = scan_result.get("aggregates", {})
    total_items = aggregates.get("total_feed_items", 0)
    total_ads = aggregates.get("total_ads", 0)
    ad_percentage = aggregates.get("ad_percentage", 0.0)
    
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
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage
        FROM scans
        ORDER BY created_at DESC
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    scans = []
    for row in rows:
        scans.append({
            "id": row["id"],
            "created_at": row["created_at"],
            "platform": row["platform"],
            "user_id": row["user_id"],
            "duration_seconds": row["duration_seconds"],
            "total_items": row["total_items"],
            "total_ads": row["total_ads"],
            "ad_percentage": row["ad_percentage"]
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

