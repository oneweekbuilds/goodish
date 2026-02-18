"""
SQLite database for storing AlgorithmLens scan history.

Thread safety: Uses thread-local connections so each thread gets its own
sqlite3.Connection, avoiding cross-thread access issues with FastAPI's
thread pool and background tasks.
"""
import sqlite3
import json
import os
import threading
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

# Database file path (same directory as this file)
DB_PATH = os.path.join(os.path.dirname(__file__), "scans.db")

# Thread-local storage for connections
_local = threading.local()


# Helper functions for row-to-dict mapping

def _row_to_scan_summary(row: sqlite3.Row) -> Dict[str, Any]:
    """
    Convert a database row to a scan summary dict (without full result JSON).
    Extracts source_type from result_json for UI display logic.
    """
    # Extract source_type from the stored result JSON
    source_type = None
    try:
        result_data = json.loads(row["result_json"])
        source_type = result_data.get("scan_metadata", {}).get("source_type", None)
    except (json.JSONDecodeError, TypeError):
        pass

    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "platform": row["platform"],
        "user_id": row["user_id"],
        "duration_seconds": row["duration_seconds"],
        "total_items": row["total_items"],
        "total_ads": row["total_ads"],
        "ad_percentage": row["ad_percentage"],
        "source_type": source_type
    }


def _row_to_scan_detail(row: sqlite3.Row) -> Dict[str, Any]:
    """
    Convert a database row to a full scan detail dict (includes full result JSON).
    """
    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "platform": row["platform"],
        "user_id": row["user_id"],
        "duration_seconds": row["duration_seconds"],
        "total_items": row["total_items"],
        "total_ads": row["total_ads"],
        "ad_percentage": row["ad_percentage"],
        "status": row["status"] or "completed",
        "error_message": row["error_message"],
        "result": json.loads(row["result_json"])
    }


def get_connection() -> sqlite3.Connection:
    """Get a thread-local database connection.

    Each thread gets its own connection, which is safe for SQLite's
    default serialized threading mode. Connections are reused within
    the same thread for performance.

    NOTE: Do NOT call conn.close() on the returned connection — it is
    cached for reuse. Closing it would cause 'Cannot operate on a closed
    database' errors on the next call.
    """
    conn = getattr(_local, "connection", None)

    # Check if the cached connection is still open
    if conn is not None:
        try:
            conn.execute("SELECT 1")
        except Exception:
            # Connection was closed or is broken — recreate it
            conn = None
            _local.connection = None

    if conn is None:
        conn = sqlite3.connect(DB_PATH, timeout=30)
        conn.row_factory = sqlite3.Row  # Enable dict-like access
        conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent read/write
        conn.execute("PRAGMA busy_timeout=5000")  # Wait up to 5s on lock
        _local.connection = conn
    return conn


def init_database():
    """Initialize the database with required tables."""
    conn = get_connection()
    cursor = conn.cursor()

    # Create scans table with status support
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
            status TEXT DEFAULT 'completed',
            error_message TEXT,
            result_json TEXT NOT NULL
        )
    """)

    # Add status column if it doesn't exist (migration for existing DBs)
    try:
        cursor.execute("ALTER TABLE scans ADD COLUMN status TEXT DEFAULT 'completed'")
        logger.info("Added status column to scans table")
    except sqlite3.OperationalError:
        pass  # Column already exists

    try:
        cursor.execute("ALTER TABLE scans ADD COLUMN error_message TEXT")
        logger.info("Added error_message column to scans table")
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Create index on created_at for faster sorting
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC)
    """)

    # Phase 5C4.1: Create aggregate_buckets table for weekly platform aggregates
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS aggregate_buckets (
            platform TEXT NOT NULL,
            week_bucket TEXT NOT NULL,
            n_scans INTEGER NOT NULL,
            n_items_total INTEGER NOT NULL,
            n_ads_total INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (platform, week_bucket)
        )
    """)

    # Phase 5C4.1: Create learned_priors table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learned_priors (
            platform TEXT PRIMARY KEY,
            alpha REAL NOT NULL,
            beta REAL NOT NULL,
            effective_n REAL NOT NULL,
            version TEXT NOT NULL,
            last_updated TEXT NOT NULL,
            source TEXT NOT NULL,
            note TEXT
        )
    """)

    # Phase 5C4.1: Create aggregation_config table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS aggregation_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)

    # Seed aggregation_config with default (OFF)
    cursor.execute("""
        INSERT OR IGNORE INTO aggregation_config (key, value)
        VALUES ('AGGREGATE_COLLECTION_ENABLED', 'false')
    """)

    # Create index on aggregate_buckets for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_aggregate_buckets_platform_week
        ON aggregate_buckets(platform, week_bucket)
    """)

    # Create subscriptions table for Stripe entitlements
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            user_id TEXT PRIMARY KEY,
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            status TEXT,
            plan_type TEXT,
            trial_end REAL,
            current_period_end REAL,
            created_at TEXT,
            updated_at TEXT
        )
    """)

    # Create stripe_webhook_events table for idempotency
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stripe_webhook_events (
            event_id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    # Connection is thread-local and reused — do not close
    logger.info(f"Initialized database at {DB_PATH}")


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

    # Validate ad percentage: total_ads cannot exceed total_items
    total_ads = min(total_ads, total_items)
    if total_items > 0:
        ad_percentage = min(total_ads / total_items * 100, 100.0)
    else:
        ad_percentage = 0.0
    
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
        logger.info(f"Using aggregates.duration_seconds: {duration_seconds}")
    # Priority 2: scan_metadata.session_duration_seconds
    elif isinstance(scan_metadata.get("session_duration_seconds"), (int, float)) and scan_metadata.get("session_duration_seconds") > 0:
        duration_seconds = scan_metadata["session_duration_seconds"]
        logger.info(f"Using scan_metadata.session_duration_seconds: {duration_seconds}")
    # Priority 3: environment.video_capture.duration_seconds (video uploads)
    elif isinstance(video_capture.get("duration_seconds"), (int, float)) and video_capture.get("duration_seconds") > 0:
        duration_seconds = video_capture["duration_seconds"]
        logger.info(f"Using video_capture.duration_seconds: {duration_seconds}")
    # Priority 4: environment.extension_capture.session_duration_seconds
    elif isinstance(ext_capture.get("session_duration_seconds"), (int, float)) and ext_capture.get("session_duration_seconds") > 0:
        duration_seconds = ext_capture["session_duration_seconds"]
        logger.info(f"Using extension_capture.session_duration_seconds: {duration_seconds}")
    else:
        logger.info(f"No valid duration found, using default: {duration_seconds}")
    
    # Serialize the full result to JSON
    result_json = json.dumps(scan_result)
    
    cursor.execute("""
        INSERT OR REPLACE INTO scans 
        (id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (scan_id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json))
    
    conn.commit()
    # Connection is thread-local and reused — do not close

    logger.info(f"Saved scan {scan_id} to database")

    # Phase 5C4.1: Contribute to aggregates if opt-in consent given
    try:
        from accuracy.aggregation import contribute_scan_to_aggregates
        if contribute_scan_to_aggregates(scan_result):
            logger.info(f"Contributed scan {scan_id} to aggregates")
    except Exception as e:
        # Don't fail scan save if aggregation fails
        logger.warning(f"Failed to contribute scan to aggregates: {e}")
    
    return scan_id


def _internal_get_all_scans() -> List[Dict[str, Any]]:
    """
    INTERNAL ONLY — Get list of all scans (without full result JSON for efficiency).
    Returns list sorted by created_at descending (newest first).
    Includes source_type extracted from result_json for UI display logic.

    WARNING: This returns ALL scans regardless of user. Do NOT use in API routes.
    Use get_scans_by_user() for user-scoped queries.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json
        FROM scans
        ORDER BY created_at DESC
    """)

    rows = cursor.fetchall()
    # Connection is thread-local and reused — do not close

    return [_row_to_scan_summary(row) for row in rows]


def get_scans_by_user(user_id: str) -> List[Dict[str, Any]]:
    """
    Get list of scans for a specific user (without full result JSON for efficiency).
    Returns list sorted by created_at descending (newest first).
    Includes source_type extracted from result_json for UI display logic.

    Args:
        user_id: Supabase user UUID or other user identifier

    Returns:
        List of scan metadata dicts owned by this user
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json
        FROM scans
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user_id,))

    rows = cursor.fetchall()
    # Connection is thread-local and reused — do not close

    return [_row_to_scan_summary(row) for row in rows]


def _internal_get_scan_by_id(scan_id: str) -> Optional[Dict[str, Any]]:
    """
    INTERNAL ONLY — Get a single scan by ID, including the full result JSON and status.

    WARNING: This does NOT check user ownership. Do NOT use in API routes.
    Use get_scan_by_id_for_user() for user-scoped queries.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, status, error_message, result_json
        FROM scans
        WHERE id = ?
    """, (scan_id,))

    row = cursor.fetchone()
    # Connection is thread-local and reused — do not close

    if row is None:
        return None

    return _row_to_scan_detail(row)


def get_scan_by_id_for_user(scan_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a single scan by ID for a specific user, including the full result JSON and status.

    Returns None if scan doesn't exist OR doesn't belong to the user.
    This prevents leaking scan existence to unauthorized users.

    Args:
        scan_id: Scan UUID
        user_id: Supabase user UUID or other user identifier

    Returns:
        Scan dict with full result, or None if not found/unauthorized
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, status, error_message, result_json
        FROM scans
        WHERE id = ? AND user_id = ?
    """, (scan_id, user_id))

    row = cursor.fetchone()
    # Connection is thread-local and reused — do not close

    if row is None:
        return None

    return _row_to_scan_detail(row)


def delete_scan(scan_id: str, user_id: str) -> bool:
    """Delete a scan by ID. Always requires user_id for ownership verification.
    Returns True if deleted, False if not found or not owned by user."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM scans WHERE id = ? AND user_id = ?", (scan_id, user_id))
    deleted = cursor.rowcount > 0

    conn.commit()
    # Connection is thread-local and reused — do not close

    if deleted:
        logger.info(f"Deleted scan {scan_id}")

    return deleted


def create_pending_scan(scan_id: str, platform: str, user_id: str = "demo-user") -> str:
    """
    Create a placeholder scan record with status='processing'.
    Used for async video processing - returns scan_id immediately to frontend.
    """
    conn = get_connection()
    cursor = conn.cursor()

    created_at = datetime.now().isoformat()

    # Create minimal placeholder result
    placeholder_result = {
        "scan_metadata": {
            "scan_id": scan_id,
            "created_at": created_at,
            "platform": platform.upper(),
            "user_identifier": user_id,
            "source_type": "MOBILE_VIDEO"
        },
        "aggregates": {
            "total_feed_items": 0,
            "total_ads": 0,
            "ad_percentage": 0.0
        },
        "feed_items": []
    }

    cursor.execute("""
        INSERT OR REPLACE INTO scans
        (id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, status, result_json)
        VALUES (?, ?, ?, ?, 0, 0, 0, 0.0, 'processing', ?)
    """, (scan_id, created_at, platform.upper(), user_id, json.dumps(placeholder_result)))

    conn.commit()
    # Connection is thread-local and reused — do not close

    logger.info(f"Created pending scan {scan_id} with status='processing'")
    return scan_id


def update_scan_result(scan_id: str, scan_result: Dict[str, Any], status: str = "completed") -> bool:
    """
    Update a scan with the full result after processing completes.
    Returns True if updated, False if scan not found.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Extract fields from the unified scan result
    aggregates = scan_result.get("aggregates", {})
    total_items = aggregates.get("total_feed_items", 0)
    total_ads = aggregates.get("total_ads", 0)
    ad_percentage = aggregates.get("ad_percentage", 0.0)

    # Get duration from environment
    environment = scan_result.get("environment", {}) or {}
    video_capture = environment.get("video_capture", {}) or {}
    duration_seconds = video_capture.get("duration_seconds", 0) or 0

    result_json = json.dumps(scan_result)

    cursor.execute("""
        UPDATE scans
        SET total_items = ?, total_ads = ?, ad_percentage = ?,
            duration_seconds = ?, status = ?, result_json = ?, error_message = NULL
        WHERE id = ?
    """, (total_items, total_ads, ad_percentage, duration_seconds, status, result_json, scan_id))

    updated = cursor.rowcount > 0
    conn.commit()
    # Connection is thread-local and reused — do not close

    logger.info(f"Updated scan {scan_id} with status='{status}', {total_items} items, {total_ads} ads")
    return updated


def update_scan_error(scan_id: str, error_message: str) -> bool:
    """
    Update a scan with an error status after processing fails.
    Returns True if updated, False if scan not found.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE scans
        SET status = 'failed', error_message = ?
        WHERE id = ?
    """, (error_message, scan_id))

    updated = cursor.rowcount > 0
    conn.commit()
    # Connection is thread-local and reused — do not close

    logger.info(f"Updated scan {scan_id} with status='failed': {error_message}")
    return updated


def get_scan_status(scan_id: str) -> Optional[Dict[str, Any]]:
    """
    Get just the status of a scan (lightweight check for polling).
    Returns dict with status, error_message, or None if not found.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, status, error_message, total_items, total_ads
        FROM scans WHERE id = ?
    """, (scan_id,))

    row = cursor.fetchone()
    # Connection is thread-local and reused — do not close

    if row is None:
        return None

    return {
        "scan_id": row["id"],
        "status": row["status"] or "completed",
        "error_message": row["error_message"],
        "total_items": row["total_items"],
        "total_ads": row["total_ads"]
    }


# Subscription entitlement functions

def upsert_subscription(
    user_id: str,
    stripe_customer_id: Optional[str] = None,
    stripe_subscription_id: Optional[str] = None,
    status: Optional[str] = None,
    plan_type: Optional[str] = None,
    trial_end: Optional[float] = None,
    current_period_end: Optional[float] = None
) -> bool:
    """
    Create or update subscription record for a user.
    Uses COALESCE to preserve existing non-null values when None is passed.
    Always updates updated_at. Sets created_at on first insert.
    Returns True if row was affected.
    """
    conn = get_connection()
    cursor = conn.cursor()

    now = datetime.now().isoformat()

    # Check if record exists
    cursor.execute("SELECT user_id FROM subscriptions WHERE user_id = ?", (user_id,))
    exists = cursor.fetchone() is not None

    if exists:
        # Update existing record, using COALESCE to preserve non-null values
        cursor.execute("""
            UPDATE subscriptions
            SET stripe_customer_id = COALESCE(?, stripe_customer_id),
                stripe_subscription_id = COALESCE(?, stripe_subscription_id),
                status = COALESCE(?, status),
                plan_type = COALESCE(?, plan_type),
                trial_end = COALESCE(?, trial_end),
                current_period_end = COALESCE(?, current_period_end),
                updated_at = ?
            WHERE user_id = ?
        """, (stripe_customer_id, stripe_subscription_id, status, plan_type,
              trial_end, current_period_end, now, user_id))
    else:
        # Insert new record
        cursor.execute("""
            INSERT INTO subscriptions
            (user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
             trial_end, current_period_end, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
              trial_end, current_period_end, now, now))

    affected = cursor.rowcount > 0
    conn.commit()
    # Connection is thread-local and reused — do not close

    return affected


def get_subscription_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get subscription record for a user. Returns None if not found."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
               trial_end, current_period_end, created_at, updated_at
        FROM subscriptions
        WHERE user_id = ?
    """, (user_id,))

    row = cursor.fetchone()
    # Connection is thread-local and reused — do not close

    if row is None:
        return None

    return {
        "user_id": row["user_id"],
        "stripe_customer_id": row["stripe_customer_id"],
        "stripe_subscription_id": row["stripe_subscription_id"],
        "status": row["status"],
        "plan_type": row["plan_type"],
        "trial_end": row["trial_end"],
        "current_period_end": row["current_period_end"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"]
    }


def get_subscription_by_customer_id(stripe_customer_id: str) -> Optional[Dict[str, Any]]:
    """Get subscription record by Stripe customer ID. Returns None if not found."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
               trial_end, current_period_end, created_at, updated_at
        FROM subscriptions
        WHERE stripe_customer_id = ?
    """, (stripe_customer_id,))

    row = cursor.fetchone()
    # Connection is thread-local and reused — do not close

    if row is None:
        return None

    return {
        "user_id": row["user_id"],
        "stripe_customer_id": row["stripe_customer_id"],
        "stripe_subscription_id": row["stripe_subscription_id"],
        "status": row["status"],
        "plan_type": row["plan_type"],
        "trial_end": row["trial_end"],
        "current_period_end": row["current_period_end"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"]
    }


def is_user_plus(user_id: str) -> bool:
    """
    Check if user has active Plus subscription.
    Returns True for 'active', 'trialing', or 'past_due' status.

    B6 fix: 'past_due' users keep access during Stripe's retry window
    (typically 3 retries over ~2 weeks). Access is only truly revoked when
    Stripe sends 'customer.subscription.deleted' after all retries fail.
    """
    subscription = get_subscription_by_user_id(user_id)
    if subscription is None:
        return False

    status = subscription.get("status")
    return status in ("active", "trialing", "past_due")


# Stripe webhook idempotency functions

def was_stripe_event_processed(event_id: str) -> bool:
    """
    Check if a Stripe webhook event has already been processed.
    Returns True if event_id exists in stripe_webhook_events table.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT event_id FROM stripe_webhook_events WHERE event_id = ?
    """, (event_id,))

    exists = cursor.fetchone() is not None
    # Connection is thread-local and reused — do not close

    return exists


def mark_stripe_event_processed(event_id: str, event_type: str) -> None:
    """
    Mark a Stripe webhook event as processed.
    Inserts event_id, event_type, and current timestamp into stripe_webhook_events table.
    """
    conn = get_connection()
    cursor = conn.cursor()

    now = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO stripe_webhook_events (event_id, event_type, created_at)
        VALUES (?, ?, ?)
    """, (event_id, event_type, now))

    conn.commit()
    # Connection is thread-local and reused — do not close


def get_recent_webhook_events(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get recent webhook events for debugging/diagnostics.
    Returns last N events ordered by created_at descending.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT event_id, event_type, created_at
        FROM stripe_webhook_events
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()
    # Connection is thread-local and reused — do not close

    events = []
    for row in rows:
        events.append({
            "event_id": row["event_id"],
            "event_type": row["event_type"],
            "created_at": row["created_at"]
        })

    return events


def cleanup_old_webhook_events(days_to_keep: int = 90) -> int:
    """
    Delete webhook events older than the specified number of days.
    Returns the number of deleted events.

    Called during startup or periodically to prevent unbounded table growth.
    """
    conn = get_connection()
    cursor = conn.cursor()

    from datetime import timedelta
    cutoff = (datetime.now() - timedelta(days=days_to_keep)).isoformat()

    cursor.execute("""
        DELETE FROM stripe_webhook_events
        WHERE created_at < ?
    """, (cutoff,))

    deleted = cursor.rowcount
    conn.commit()

    if deleted > 0:
        logger.info(f"Cleaned up {deleted} webhook events older than {days_to_keep} days")

    return deleted


def delete_user_data(user_id: str) -> dict:
    """
    Delete ALL data for a specific user. Used for account deletion / data erasure requests.
    Returns counts of deleted records.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Delete scans
    cursor.execute("DELETE FROM scans WHERE user_id = ?", (user_id,))
    scans_deleted = cursor.rowcount

    # Delete subscription records
    cursor.execute("DELETE FROM subscriptions WHERE user_id = ?", (user_id,))
    subs_deleted = cursor.rowcount

    conn.commit()

    logger.info(f"Deleted user data for {user_id}: {scans_deleted} scans, {subs_deleted} subscription records")

    return {
        "scans_deleted": scans_deleted,
        "subscriptions_deleted": subs_deleted
    }

