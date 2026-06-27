"""
PostgreSQL database for storing AlgorithmLens scan history.

Supports PostgreSQL via psycopg2 with connection pooling. Falls back to SQLite
for local development if DATABASE_URL is not set.

Thread safety: Uses connection pooling from psycopg2.pool.SimpleConnectionPool
for thread-safe concurrent access. Each thread/request gets its own connection
from the pool.
"""
import json
import os
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
import threading

logger = logging.getLogger(__name__)

# Check for DATABASE_URL environment variable (Supabase provides this)
DATABASE_URL = os.getenv("DATABASE_URL")

# Connection pooling setup
_pool = None
_sqlite_conn = None
_local = threading.local()

# Fallback for local development
DB_PATH = os.path.join(os.path.dirname(__file__), "scans.db")

# Determine if we're using PostgreSQL or SQLite
_USE_POSTGRESQL = DATABASE_URL is not None


def _get_pg_pool():
    """Initialize and return PostgreSQL connection pool."""
    global _pool
    if _pool is None:
        try:
            import psycopg2.pool
            _pool = psycopg2.pool.SimpleConnectionPool(
                1, 10, DATABASE_URL, connect_timeout=10
            )
            logger.info("PostgreSQL connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL pool: {e}")
            raise
    return _pool


# Helper functions for row-to-dict mapping

def _row_to_dict(row: Tuple) -> Dict[str, Any]:
    """Convert PostgreSQL cursor.description and row tuple to dict."""
    if _USE_POSTGRESQL:
        # For PostgreSQL, we need to manually map based on cursor.description
        # This is handled in the query functions by using RealDictCursor
        return row
    else:
        # For SQLite, row is already a Row object with dict-like access
        return row


def _row_to_scan_summary(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a database row to a scan summary dict (without full result JSON).
    Extracts source_type from result_json for UI display logic.

    Note: ad_percentage is stored in DB as 0-100 scale but returned as 0-1 decimal
    to match the frontend convention (frontend multiplies by 100 for display).
    """
    # Extract source_type from the stored result JSON
    source_type = None
    try:
        result_data = json.loads(row["result_json"])
        source_type = result_data.get("scan_metadata", {}).get("source_type", None)
    except (json.JSONDecodeError, TypeError):
        pass

    # Convert ad_percentage from DB scale (0-100) to API scale (0-1 decimal)
    # Frontend expects 0-1 and multiplies by 100 for display
    db_ad_pct = row["ad_percentage"] or 0.0
    api_ad_pct = round(db_ad_pct / 100.0, 4) if db_ad_pct else 0.0

    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "platform": row["platform"],
        "user_id": row["user_id"],
        "duration_seconds": row["duration_seconds"],
        "total_items": row["total_items"],
        "total_ads": row["total_ads"],
        "ad_percentage": api_ad_pct,
        "source_type": source_type
    }


def _row_to_scan_detail(row: Dict[str, Any]) -> Dict[str, Any]:
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


def get_connection():
    """Get a database connection (PostgreSQL from pool or SQLite thread-local).

    For PostgreSQL: Returns a connection from the connection pool. Caller is
    responsible for returning it with conn.close() after use.

    For SQLite: Returns a thread-local cached connection. Do NOT call close()
    as it is cached for reuse.
    """
    if _USE_POSTGRESQL:
        return _get_pg_pool().getconn()
    else:
        # SQLite thread-local connection
        import sqlite3
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


def return_connection(conn):
    """Return a PostgreSQL connection to the pool. No-op for SQLite."""
    if _USE_POSTGRESQL and _pool is not None:
        _pool.putconn(conn)


def init_database():
    """Initialize the database with required tables."""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if _USE_POSTGRESQL:
            # PostgreSQL table definitions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scans (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    user_id TEXT,
                    duration_seconds DOUBLE PRECISION,
                    total_items INTEGER DEFAULT 0,
                    total_ads INTEGER DEFAULT 0,
                    ad_percentage DOUBLE PRECISION DEFAULT 0.0,
                    status TEXT DEFAULT 'completed',
                    error_message TEXT,
                    result_json JSONB NOT NULL
                )
            """)

            # Add columns if they don't exist (migration for existing DBs)
            try:
                cursor.execute("ALTER TABLE scans ADD COLUMN status TEXT DEFAULT 'completed'")
                logger.info("Added status column to scans table")
            except Exception:
                pass  # Column already exists

            try:
                cursor.execute("ALTER TABLE scans ADD COLUMN error_message TEXT")
                logger.info("Added error_message column to scans table")
            except Exception:
                pass  # Column already exists

            # Create index on created_at for faster sorting
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC)
            """)

            # Create aggregate_buckets table
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

            # Create learned_priors table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS learned_priors (
                    platform TEXT PRIMARY KEY,
                    alpha DOUBLE PRECISION NOT NULL,
                    beta DOUBLE PRECISION NOT NULL,
                    effective_n DOUBLE PRECISION NOT NULL,
                    version TEXT NOT NULL,
                    last_updated TEXT NOT NULL,
                    source TEXT NOT NULL,
                    note TEXT
                )
            """)

            # Create aggregation_config table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS aggregation_config (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            """)

            # Seed aggregation_config with default (OFF)
            cursor.execute("""
                INSERT INTO aggregation_config (key, value)
                VALUES (%s, %s)
                ON CONFLICT (key) DO NOTHING
            """, ('AGGREGATE_COLLECTION_ENABLED', 'false'))

            # Create index on aggregate_buckets
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_aggregate_buckets_platform_week
                ON aggregate_buckets(platform, week_bucket)
            """)

            # Create subscriptions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS subscriptions (
                    user_id TEXT PRIMARY KEY,
                    stripe_customer_id TEXT,
                    stripe_subscription_id TEXT,
                    status TEXT,
                    plan_type TEXT,
                    trial_end DOUBLE PRECISION,
                    current_period_end DOUBLE PRECISION,
                    cancel_at_period_end BOOLEAN DEFAULT FALSE,
                    created_at TEXT,
                    updated_at TEXT
                )
            """)

            # Add cancel_at_period_end column if it doesn't exist (migration)
            try:
                cursor.execute("ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE")
                logger.info("Added cancel_at_period_end column to subscriptions table")
            except Exception:
                pass  # Column already exists

            # Create index on stripe_customer_id
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id
                ON subscriptions(stripe_customer_id)
            """)

            # Create stripe_webhook_events table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS stripe_webhook_events (
                    event_id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)

        else:
            # SQLite table definitions
            import sqlite3

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

            # Add columns if they don't exist (migration for existing DBs)
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

            # H3 fix: Add cancel_at_period_end column (migration for existing DBs)
            try:
                cursor.execute("ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end INTEGER DEFAULT 0")
                logger.info("Added cancel_at_period_end column to subscriptions table")
            except sqlite3.OperationalError:
                pass  # Column already exists

            # H4 fix: Add index on stripe_customer_id for fast webhook lookups.
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id
                ON subscriptions(stripe_customer_id)
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
        logger.info("Initialized database successfully")

    finally:
        # Return connection to pool for PostgreSQL
        return_connection(conn)


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

    try:
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

        # Extension sends ad_percentage as 0-1 decimal; database stores 0-100 percentage.
        # Always recalculate from total_ads/total_items to ensure consistency.
        if total_items > 0:
            ad_percentage = round(min(total_ads / total_items, 1.0) * 100, 2)
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

        if _USE_POSTGRESQL:
            cursor.execute("""
                INSERT INTO scans
                (id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    created_at = EXCLUDED.created_at,
                    platform = EXCLUDED.platform,
                    user_id = EXCLUDED.user_id,
                    duration_seconds = EXCLUDED.duration_seconds,
                    total_items = EXCLUDED.total_items,
                    total_ads = EXCLUDED.total_ads,
                    ad_percentage = EXCLUDED.ad_percentage,
                    result_json = EXCLUDED.result_json
            """, (scan_id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json))
        else:
            cursor.execute("""
                INSERT OR REPLACE INTO scans
                (id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (scan_id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json))

        conn.commit()
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

    finally:
        return_connection(conn)


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

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json
                FROM scans
                ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            return [dict(row) if hasattr(row, 'keys') else row for row in rows]
        else:
            cursor.execute("""
                SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json
                FROM scans
                ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            return [_row_to_scan_summary(row) for row in rows]
    finally:
        return_connection(conn)


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

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json
                FROM scans
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, result_json
                FROM scans
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user_id,))

        rows = cursor.fetchall()
        return [_row_to_scan_summary(row if isinstance(row, dict) else dict(row)) for row in rows]

    finally:
        return_connection(conn)


def _internal_get_scan_by_id(scan_id: str) -> Optional[Dict[str, Any]]:
    """
    INTERNAL ONLY — Get a single scan by ID, including the full result JSON and status.

    WARNING: This does NOT check user ownership. Do NOT use in API routes.
    Use get_scan_by_id_for_user() for user-scoped queries.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, status, error_message, result_json
                FROM scans
                WHERE id = %s
            """, (scan_id,))
        else:
            cursor.execute("""
                SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, status, error_message, result_json
                FROM scans
                WHERE id = ?
            """, (scan_id,))

        row = cursor.fetchone()

        if row is None:
            return None

        row = row if isinstance(row, dict) else dict(row)
        return _row_to_scan_detail(row)

    finally:
        return_connection(conn)


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

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, status, error_message, result_json
                FROM scans
                WHERE id = %s AND user_id = %s
            """, (scan_id, user_id))
        else:
            cursor.execute("""
                SELECT id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, status, error_message, result_json
                FROM scans
                WHERE id = ? AND user_id = ?
            """, (scan_id, user_id))

        row = cursor.fetchone()

        if row is None:
            return None

        row = row if isinstance(row, dict) else dict(row)
        return _row_to_scan_detail(row)

    finally:
        return_connection(conn)


def delete_scan(scan_id: str, user_id: str) -> bool:
    """Delete a scan by ID. Always requires user_id for ownership verification.
    Returns True if deleted, False if not found or not owned by user."""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if _USE_POSTGRESQL:
            cursor.execute("DELETE FROM scans WHERE id = %s AND user_id = %s", (scan_id, user_id))
        else:
            cursor.execute("DELETE FROM scans WHERE id = ? AND user_id = ?", (scan_id, user_id))

        deleted = cursor.rowcount > 0
        conn.commit()

        if deleted:
            logger.info(f"Deleted scan {scan_id}")

        return deleted

    finally:
        return_connection(conn)


def create_pending_scan(scan_id: str, platform: str, user_id: str = "demo-user") -> str:
    """
    Create a placeholder scan record with status='processing'.
    Used for async video processing - returns scan_id immediately to frontend.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
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

        if _USE_POSTGRESQL:
            cursor.execute("""
                INSERT INTO scans
                (id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, status, result_json)
                VALUES (%s, %s, %s, %s, 0, 0, 0, 0.0, 'processing', %s)
                ON CONFLICT (id) DO UPDATE SET
                    created_at = EXCLUDED.created_at,
                    platform = EXCLUDED.platform,
                    user_id = EXCLUDED.user_id,
                    status = EXCLUDED.status,
                    result_json = EXCLUDED.result_json
            """, (scan_id, created_at, platform.upper(), user_id, json.dumps(placeholder_result)))
        else:
            cursor.execute("""
                INSERT OR REPLACE INTO scans
                (id, created_at, platform, user_id, duration_seconds, total_items, total_ads, ad_percentage, status, result_json)
                VALUES (?, ?, ?, ?, 0, 0, 0, 0.0, 'processing', ?)
            """, (scan_id, created_at, platform.upper(), user_id, json.dumps(placeholder_result)))

        conn.commit()
        logger.info(f"Created pending scan {scan_id} with status='processing'")
        return scan_id

    finally:
        return_connection(conn)


def update_scan_result(scan_id: str, scan_result: Dict[str, Any], status: str = "completed") -> bool:
    """
    Update a scan with the full result after processing completes.
    Returns True if updated, False if scan not found.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Extract fields from the unified scan result
        aggregates = scan_result.get("aggregates", {})
        total_items = aggregates.get("total_feed_items", 0)
        total_ads = aggregates.get("total_ads", 0)

        # Session 9 fix: Recalculate ad_percentage to 0-100 DB scale (matching save_scan behavior)
        # The incoming payload uses 0-1 decimal scale; DB stores 0-100 percentage scale.
        if total_items > 0:
            ad_percentage = round(min(total_ads / total_items, 1.0) * 100, 2)
        else:
            ad_percentage = 0.0

        # Get duration from environment
        environment = scan_result.get("environment", {}) or {}
        video_capture = environment.get("video_capture", {}) or {}
        duration_seconds = video_capture.get("duration_seconds", 0) or 0

        result_json = json.dumps(scan_result)

        if _USE_POSTGRESQL:
            cursor.execute("""
                UPDATE scans
                SET total_items = %s, total_ads = %s, ad_percentage = %s,
                    duration_seconds = %s, status = %s, result_json = %s, error_message = NULL
                WHERE id = %s
            """, (total_items, total_ads, ad_percentage, duration_seconds, status, result_json, scan_id))
        else:
            cursor.execute("""
                UPDATE scans
                SET total_items = ?, total_ads = ?, ad_percentage = ?,
                    duration_seconds = ?, status = ?, result_json = ?, error_message = NULL
                WHERE id = ?
            """, (total_items, total_ads, ad_percentage, duration_seconds, status, result_json, scan_id))

        updated = cursor.rowcount > 0
        conn.commit()
        logger.info(f"Updated scan {scan_id} with status='{status}', {total_items} items, {total_ads} ads")
        return updated

    finally:
        return_connection(conn)


def update_scan_error(scan_id: str, error_message: str) -> bool:
    """
    Update a scan with an error status after processing fails.
    Returns True if updated, False if scan not found.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                UPDATE scans
                SET status = 'failed', error_message = %s
                WHERE id = %s
            """, (error_message, scan_id))
        else:
            cursor.execute("""
                UPDATE scans
                SET status = 'failed', error_message = ?
                WHERE id = ?
            """, (error_message, scan_id))

        updated = cursor.rowcount > 0
        conn.commit()
        logger.info(f"Updated scan {scan_id} with status='failed': {error_message}")
        return updated

    finally:
        return_connection(conn)


def get_scan_status(scan_id: str) -> Optional[Dict[str, Any]]:
    """
    Get just the status of a scan (lightweight check for polling).
    Returns dict with status, error_message, or None if not found.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                SELECT id, status, error_message, total_items, total_ads
                FROM scans WHERE id = %s
            """, (scan_id,))
        else:
            cursor.execute("""
                SELECT id, status, error_message, total_items, total_ads
                FROM scans WHERE id = ?
            """, (scan_id,))

        row = cursor.fetchone()

        if row is None:
            return None

        row = row if isinstance(row, dict) else dict(row)
        return {
            "scan_id": row["id"],
            "status": row["status"] or "completed",
            "error_message": row["error_message"],
            "total_items": row["total_items"],
            "total_ads": row["total_ads"]
        }

    finally:
        return_connection(conn)


# Subscription entitlement functions

def upsert_subscription(
    user_id: str,
    stripe_customer_id: Optional[str] = None,
    stripe_subscription_id: Optional[str] = None,
    status: Optional[str] = None,
    plan_type: Optional[str] = None,
    trial_end: Optional[float] = None,
    current_period_end: Optional[float] = None,
    cancel_at_period_end: Optional[bool] = None
) -> bool:
    """
    Create or update subscription record for a user.
    Uses COALESCE to preserve existing non-null values when None is passed.
    Always updates updated_at. Sets created_at on first insert.

    H3 fix: Added cancel_at_period_end parameter so the UI can show cancellation state.
    Returns True if row was affected.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        now = datetime.now().isoformat()

        if _USE_POSTGRESQL:
            # PostgreSQL upsert with ON CONFLICT
            cursor.execute("""
                INSERT INTO subscriptions
                (user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
                 trial_end, current_period_end, cancel_at_period_end, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, subscriptions.stripe_customer_id),
                    stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, subscriptions.stripe_subscription_id),
                    status = COALESCE(EXCLUDED.status, subscriptions.status),
                    plan_type = COALESCE(EXCLUDED.plan_type, subscriptions.plan_type),
                    trial_end = COALESCE(EXCLUDED.trial_end, subscriptions.trial_end),
                    current_period_end = COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end),
                    cancel_at_period_end = COALESCE(EXCLUDED.cancel_at_period_end, subscriptions.cancel_at_period_end),
                    updated_at = %s
            """, (user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
                  trial_end, current_period_end, cancel_at_period_end, now, now, now))
        else:
            # SQLite version
            cursor.execute("SELECT user_id FROM subscriptions WHERE user_id = ?", (user_id,))
            exists = cursor.fetchone() is not None

            # Convert bool to int for SQLite storage (None stays None for COALESCE)
            cancel_at_period_end_int = int(cancel_at_period_end) if cancel_at_period_end is not None else None

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
                        cancel_at_period_end = COALESCE(?, cancel_at_period_end),
                        updated_at = ?
                    WHERE user_id = ?
                """, (stripe_customer_id, stripe_subscription_id, status, plan_type,
                      trial_end, current_period_end, cancel_at_period_end_int, now, user_id))
            else:
                # Insert new record
                cursor.execute("""
                    INSERT INTO subscriptions
                    (user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
                     trial_end, current_period_end, cancel_at_period_end, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
                      trial_end, current_period_end, cancel_at_period_end_int or 0, now, now))

        affected = cursor.rowcount > 0
        conn.commit()
        return affected

    finally:
        return_connection(conn)


def get_subscription_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get subscription record for a user. Returns None if not found."""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                SELECT user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
                       trial_end, current_period_end, cancel_at_period_end, created_at, updated_at
                FROM subscriptions
                WHERE user_id = %s
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
                       trial_end, current_period_end, cancel_at_period_end, created_at, updated_at
                FROM subscriptions
                WHERE user_id = ?
            """, (user_id,))

        row = cursor.fetchone()

        if row is None:
            return None

        row = row if isinstance(row, dict) else dict(row)
        return {
            "user_id": row["user_id"],
            "stripe_customer_id": row["stripe_customer_id"],
            "stripe_subscription_id": row["stripe_subscription_id"],
            "status": row["status"],
            "plan_type": row["plan_type"],
            "trial_end": row["trial_end"],
            "current_period_end": row["current_period_end"],
            "cancel_at_period_end": bool(row["cancel_at_period_end"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        }

    finally:
        return_connection(conn)


def get_subscription_by_customer_id(stripe_customer_id: str) -> Optional[Dict[str, Any]]:
    """Get subscription record by Stripe customer ID. Returns None if not found."""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                SELECT user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
                       trial_end, current_period_end, cancel_at_period_end, created_at, updated_at
                FROM subscriptions
                WHERE stripe_customer_id = %s
            """, (stripe_customer_id,))
        else:
            cursor.execute("""
                SELECT user_id, stripe_customer_id, stripe_subscription_id, status, plan_type,
                       trial_end, current_period_end, cancel_at_period_end, created_at, updated_at
                FROM subscriptions
                WHERE stripe_customer_id = ?
            """, (stripe_customer_id,))

        row = cursor.fetchone()

        if row is None:
            return None

        row = row if isinstance(row, dict) else dict(row)
        return {
            "user_id": row["user_id"],
            "stripe_customer_id": row["stripe_customer_id"],
            "stripe_subscription_id": row["stripe_subscription_id"],
            "status": row["status"],
            "plan_type": row["plan_type"],
            "trial_end": row["trial_end"],
            "current_period_end": row["current_period_end"],
            "cancel_at_period_end": bool(row["cancel_at_period_end"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        }

    finally:
        return_connection(conn)


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

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                SELECT event_id FROM stripe_webhook_events WHERE event_id = %s
            """, (event_id,))
        else:
            cursor.execute("""
                SELECT event_id FROM stripe_webhook_events WHERE event_id = ?
            """, (event_id,))

        exists = cursor.fetchone() is not None
        return exists

    finally:
        return_connection(conn)


def mark_stripe_event_processed(event_id: str, event_type: str) -> None:
    """
    Mark a Stripe webhook event as processed.
    Inserts event_id, event_type, and current timestamp into stripe_webhook_events table.

    H1 fix: Uses INSERT OR IGNORE (SQLite) / ON CONFLICT DO NOTHING (PostgreSQL) to prevent
    IntegrityError if two concurrent webhook deliveries race past the was_stripe_event_processed
    check. Without this, the second INSERT crashes with a UNIQUE constraint violation,
    returning 500 to Stripe and causing infinite retries.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        now = datetime.now().isoformat()

        if _USE_POSTGRESQL:
            cursor.execute("""
                INSERT INTO stripe_webhook_events (event_id, event_type, created_at)
                VALUES (%s, %s, %s)
                ON CONFLICT (event_id) DO NOTHING
            """, (event_id, event_type, now))
        else:
            cursor.execute("""
                INSERT OR IGNORE INTO stripe_webhook_events (event_id, event_type, created_at)
                VALUES (?, ?, ?)
            """, (event_id, event_type, now))

        conn.commit()

    finally:
        return_connection(conn)


def get_recent_webhook_events(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get recent webhook events for debugging/diagnostics.
    Returns last N events ordered by created_at descending.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if _USE_POSTGRESQL:
            cursor.execute("""
                SELECT event_id, event_type, created_at
                FROM stripe_webhook_events
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
        else:
            cursor.execute("""
                SELECT event_id, event_type, created_at
                FROM stripe_webhook_events
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))

        rows = cursor.fetchall()
        events = []
        for row in rows:
            row = row if isinstance(row, dict) else dict(row)
            events.append({
                "event_id": row["event_id"],
                "event_type": row["event_type"],
                "created_at": row["created_at"]
            })

        return events

    finally:
        return_connection(conn)


def cleanup_old_webhook_events(days_to_keep: int = 90) -> int:
    """
    Delete webhook events older than the specified number of days.
    Returns the number of deleted events.

    Called during startup or periodically to prevent unbounded table growth.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        from datetime import timedelta
        cutoff = (datetime.now() - timedelta(days=days_to_keep)).isoformat()

        if _USE_POSTGRESQL:
            cursor.execute("""
                DELETE FROM stripe_webhook_events
                WHERE created_at < %s
            """, (cutoff,))
        else:
            cursor.execute("""
                DELETE FROM stripe_webhook_events
                WHERE created_at < ?
            """, (cutoff,))

        deleted = cursor.rowcount
        conn.commit()

        if deleted > 0:
            logger.info(f"Cleaned up {deleted} webhook events older than {days_to_keep} days")

        return deleted

    finally:
        return_connection(conn)


def delete_user_data(user_id: str) -> dict:
    """
    Delete ALL data for a specific user. Used for account deletion / data erasure requests.
    Returns counts of deleted records.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Delete scans
        if _USE_POSTGRESQL:
            cursor.execute("DELETE FROM scans WHERE user_id = %s", (user_id,))
        else:
            cursor.execute("DELETE FROM scans WHERE user_id = ?", (user_id,))
        scans_deleted = cursor.rowcount

        # Delete subscription records
        if _USE_POSTGRESQL:
            cursor.execute("DELETE FROM subscriptions WHERE user_id = %s", (user_id,))
        else:
            cursor.execute("DELETE FROM subscriptions WHERE user_id = ?", (user_id,))
        subs_deleted = cursor.rowcount

        conn.commit()
        logger.info(f"Deleted user data for {user_id}: {scans_deleted} scans, {subs_deleted} subscription records")

        return {
            "scans_deleted": scans_deleted,
            "subscriptions_deleted": subs_deleted
        }

    finally:
        return_connection(conn)


class AuthUserDeletionError(RuntimeError):
    """Raised when the connected Postgres role cannot delete the Supabase auth user.

    Signals that direct SQL deletion of auth.users (Option A) is not available
    for this role and the service-role admin API (Option B) is required.
    """


def delete_user_account(user_id: str) -> dict:
    """
    Permanently delete a user's ENTIRE account in a single transaction.

    Deletes, in order, all scoped to the given user_id:
      1. scans
      2. subscriptions
      3. user_profiles         (PostgreSQL only)
      4. the Supabase auth user, auth.users (PostgreSQL only)

    This implements Apple Guideline 5.1.1(v): the auth user itself is removed,
    not just their data, so the account can no longer be used to sign in.

    The user_id MUST be the caller's own id from the verified JWT. Never pass a
    value taken from request input.

    Explicit child deletes run even though scans and user_profiles cascade from
    auth.users, so the outcome is correct regardless of cascade rules and no
    orphan rows are possible. subscriptions has no foreign key to auth.users and
    is only removed by this explicit delete.

    All deletes share one transaction. If any step fails, the whole transaction
    is rolled back so an account is never half-deleted.

    In SQLite local/dev mode there is no Supabase auth schema, so steps 3 and 4
    are skipped.

    Returns counts of what was removed. Raises on failure (after rollback).
    """
    conn = get_connection()
    cursor = conn.cursor()
    placeholder = "%s" if _USE_POSTGRESQL else "?"

    try:
        cursor.execute(f"DELETE FROM scans WHERE user_id = {placeholder}", (user_id,))
        scans_deleted = cursor.rowcount

        cursor.execute(f"DELETE FROM subscriptions WHERE user_id = {placeholder}", (user_id,))
        subscriptions_deleted = cursor.rowcount

        user_profiles_deleted = 0
        auth_user_deleted = False

        if _USE_POSTGRESQL:
            cursor.execute("DELETE FROM user_profiles WHERE user_id = %s", (user_id,))
            user_profiles_deleted = cursor.rowcount

            # Delete the Supabase auth user. Requires the connected role to have
            # DELETE on auth.users (verified: the postgres role does). If this
            # ever fails with a permission error, fail loudly and roll back the
            # whole transaction rather than committing a data wipe that leaves a
            # usable login behind. A distinct error tells us to switch to the
            # service-role admin API (Option B).
            try:
                cursor.execute("DELETE FROM auth.users WHERE id = %s", (user_id,))
                auth_user_deleted = cursor.rowcount > 0
            except Exception as auth_err:
                logger.error(
                    "AUTH USER DELETION FAILED for %s: %s. The DB role may lack "
                    "DELETE on auth.users; switch to the service-role admin API "
                    "(Option B). Rolling back the entire account deletion.",
                    user_id, auth_err,
                )
                raise AuthUserDeletionError(str(auth_err)) from auth_err

        conn.commit()
        logger.info(
            "Deleted account for %s: %s scans, %s subscriptions, %s profiles, auth_user_deleted=%s",
            user_id, scans_deleted, subscriptions_deleted, user_profiles_deleted, auth_user_deleted,
        )

        return {
            "scans_deleted": scans_deleted,
            "subscriptions_deleted": subscriptions_deleted,
            "user_profiles_deleted": user_profiles_deleted,
            "auth_user_deleted": auth_user_deleted,
        }

    except Exception:
        # Any failure rolls back every delete so the account is never partially
        # removed.
        conn.rollback()
        raise
    finally:
        return_connection(conn)

