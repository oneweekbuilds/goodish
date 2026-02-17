"""
Phase 5C4.1: Opt-in privacy-preserving aggregation for learned priors.

This module handles contribution of scan data to weekly platform aggregates.
All contributions are opt-in only (global + per-scan consent required).
No identifiers or content are stored.
"""

import sqlite3
import os
from datetime import datetime
from typing import Dict, Any, Optional
from database import get_connection, DB_PATH


# Minimum scans per bucket for k-anonymity (k=100)
DEFAULT_MIN_SCANS_PER_BUCKET = 100


def is_aggregation_enabled() -> bool:
    """
    Check if global aggregation collection is enabled.
    
    Checks:
    1. Environment variable AGGREGATE_COLLECTION_ENABLED (if set)
    2. Database config table (default: false)
    
    Returns:
        True if aggregation is enabled, False otherwise
    """
    # Check environment variable first
    env_enabled = os.getenv("AGGREGATE_COLLECTION_ENABLED", "").lower()
    if env_enabled in ("true", "1", "yes"):
        return True
    if env_enabled in ("false", "0", "no", ""):
        pass  # Continue to DB check
    
    # Check database config
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT value FROM aggregation_config WHERE key = 'AGGREGATE_COLLECTION_ENABLED'
    """)
    row = cursor.fetchone()
    # Connection is thread-local and reused — do not close

    if row:
        return row["value"].lower() == "true"
    
    # Default: disabled
    return False


def get_week_bucket(date_str: str) -> str:
    """
    Convert ISO date string to ISO week bucket (e.g., "2026-W01").
    
    Args:
        date_str: ISO date string (e.g., "2026-01-06T12:00:00")
    
    Returns:
        ISO week bucket string (e.g., "2026-W01")
    """
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        # Get ISO week number
        year, week, _ = dt.isocalendar()
        return f"{year}-W{week:02d}"
    except (ValueError, AttributeError):
        # Fallback: use current week
        dt = datetime.now()
        year, week, _ = dt.isocalendar()
        return f"{year}-W{week:02d}"


def contribute_scan_to_aggregates(scan_result: Dict[str, Any]) -> bool:
    """
    Contribute scan data to weekly platform aggregates (opt-in only).
    
    Rules:
    - Global aggregation must be enabled (config or env)
    - Per-scan consent must be true (scan_metadata.aggregate_consent)
    - Only stores: platform, week_bucket, n_items, k_ads
    - No scan_id, user_id, or content stored
    
    Args:
        scan_result: Full scan result dict
    
    Returns:
        True if contribution was made, False otherwise
    """
    # Check global enablement
    if not is_aggregation_enabled():
        return False
    
    # Extract scan metadata
    scan_metadata = scan_result.get("scan_metadata", {})
    
    # Check per-scan consent (default: False if not present)
    aggregate_consent = scan_metadata.get("aggregate_consent", False)
    if not aggregate_consent:
        return False
    
    # Extract required fields
    platform = scan_metadata.get("platform", "").lower()
    if not platform:
        return False
    
    created_at = scan_metadata.get("created_at", datetime.now().isoformat())
    week_bucket = get_week_bucket(created_at)
    
    # Extract counts from aggregates or feed_items
    aggregates = scan_result.get("aggregates", {})
    n_items = aggregates.get("total_feed_items", 0)
    k_ads = aggregates.get("total_ads", 0)
    
    # Fallback: count from feed_items if aggregates not available
    if n_items == 0:
        feed_items = scan_result.get("feed_items", [])
        n_items = len(feed_items)
        k_ads = sum(1 for item in feed_items if item.get("is_ad", False))
    
    # Skip if no items
    if n_items == 0:
        return False
    
    # Update or insert aggregate bucket
    conn = get_connection()
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    
    # Check if bucket exists
    cursor.execute("""
        SELECT n_scans, n_items_total, n_ads_total
        FROM aggregate_buckets
        WHERE platform = ? AND week_bucket = ?
    """, (platform, week_bucket))
    
    row = cursor.fetchone()
    
    if row:
        # Update existing bucket
        new_n_scans = row["n_scans"] + 1
        new_n_items = row["n_items_total"] + n_items
        new_n_ads = row["n_ads_total"] + k_ads
        
        cursor.execute("""
            UPDATE aggregate_buckets
            SET n_scans = ?, n_items_total = ?, n_ads_total = ?, updated_at = ?
            WHERE platform = ? AND week_bucket = ?
        """, (new_n_scans, new_n_items, new_n_ads, now, platform, week_bucket))
    else:
        # Insert new bucket
        cursor.execute("""
            INSERT INTO aggregate_buckets
            (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
            VALUES (?, ?, 1, ?, ?, ?, ?)
        """, (platform, week_bucket, n_items, k_ads, now, now))
    
    conn.commit()
    # Connection is thread-local and reused — do not close

    return True


def get_eligible_buckets(
    platform: str,
    min_scans_per_bucket: int = DEFAULT_MIN_SCANS_PER_BUCKET
) -> list[Dict[str, Any]]:
    """
    Get eligible aggregate buckets for a platform.
    
    A bucket is eligible if n_scans >= min_scans_per_bucket (k-anonymity).
    
    Args:
        platform: Platform name (lowercase)
        min_scans_per_bucket: Minimum scans required per bucket (default 100)
    
    Returns:
        List of eligible bucket dicts with keys: platform, week_bucket, n_scans, n_items_total, n_ads_total
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT platform, week_bucket, n_scans, n_items_total, n_ads_total
        FROM aggregate_buckets
        WHERE platform = ? AND n_scans >= ?
        ORDER BY week_bucket ASC
    """, (platform, min_scans_per_bucket))
    
    rows = cursor.fetchall()
    # Connection is thread-local and reused — do not close

    return [
        {
            "platform": row["platform"],
            "week_bucket": row["week_bucket"],
            "n_scans": row["n_scans"],
            "n_items_total": row["n_items_total"],
            "n_ads_total": row["n_ads_total"]
        }
        for row in rows
    ]

