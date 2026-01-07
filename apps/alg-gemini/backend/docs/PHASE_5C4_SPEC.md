# Phase 5C4: Privacy-Preserving Opt-In Aggregated Priors

**Status:** DESIGN
**Scope:** Ads tab only (ad_rate priors)
**Prerequisite:** Phase 5C3 (Bayesian priors with bootstrap values)

---

## 1. Overview

Phase 5C4 introduces a privacy-preserving system to learn and update Bayesian priors from real scans over time. The system:

1. Collects **only aggregate counts** (k ads, n total) at platform + time-bucket level
2. Enforces **k-anonymity** (minimum 100 scans per bucket before use)
3. Updates priors with **exponential smoothing** to prevent swings
4. Falls back to **bootstrap priors** when insufficient aggregate data
5. Reports `prior_info.source = "learned"` when learned priors are used

**Non-goals:**
- Per-item classification changes (architecture invariant: priors only affect confidence intervals)
- Real-time prior updates (weekly batch only)
- Cross-tab aggregation (Ads tab only for now)

---

## 2. Privacy Model

### 2.1 What We Store

| Field | Description | Example |
|-------|-------------|---------|
| `platform` | Lowercase platform name | `"tiktok"` |
| `week_bucket` | ISO week string | `"2025-W01"` |
| `n_scans` | Count of scans in bucket | `142` |
| `n_items_total` | Sum of all items across scans | `3550` |
| `n_ads_total` | Sum of all ads across scans | `355` |
| `created_at` | When bucket was created | `2025-01-06T00:00:00Z` |
| `updated_at` | Last update timestamp | `2025-01-06T12:00:00Z` |

### 2.2 What We NEVER Store

- Raw post content (captions, text, OCR)
- Creator/account handles or names
- User identifiers (user_id, IP, device fingerprints)
- Individual scan IDs linked to aggregates
- Timestamps finer than week buckets
- Ad advertiser names or brands

### 2.3 Privacy Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| **K-anonymity** | Minimum 100 scans required before bucket contributes to priors |
| **Temporal protection** | Weekly buckets prevent timestamp fingerprinting |
| **Aggregation-only** | Raw scan data never written to aggregate tables |
| **No joins possible** | Aggregate table has no foreign keys to scans table |

### 2.4 Opt-In Mechanism

Aggregation is **opt-in** at two levels:

1. **Global backend flag:** `AGGREGATE_COLLECTION_ENABLED` (default: `False`)
2. **Per-scan consent:** `scan_metadata.aggregate_consent` (default: `False`)

A scan contributes to aggregates **only if both are true**.

---

## 3. Database Schema

### 3.1 New Table: `aggregate_buckets`

```sql
CREATE TABLE IF NOT EXISTS aggregate_buckets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,           -- 'tiktok', 'instagram', etc.
    week_bucket TEXT NOT NULL,        -- ISO week: '2025-W01'
    n_scans INTEGER NOT NULL DEFAULT 0,
    n_items_total INTEGER NOT NULL DEFAULT 0,
    n_ads_total INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,         -- ISO 8601
    updated_at TEXT NOT NULL,         -- ISO 8601

    UNIQUE(platform, week_bucket)
);

CREATE INDEX IF NOT EXISTS idx_aggregate_buckets_platform
    ON aggregate_buckets(platform);
CREATE INDEX IF NOT EXISTS idx_aggregate_buckets_week
    ON aggregate_buckets(week_bucket DESC);
```

### 3.2 New Table: `learned_priors`

```sql
CREATE TABLE IF NOT EXISTS learned_priors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL UNIQUE,    -- 'tiktok', 'instagram', etc.
    alpha REAL NOT NULL,              -- Beta distribution alpha
    beta REAL NOT NULL,               -- Beta distribution beta
    effective_n REAL NOT NULL,        -- alpha + beta (pseudo-observations)
    source_version TEXT NOT NULL,     -- 'learned_v1', 'learned_v2'
    n_buckets_used INTEGER NOT NULL,  -- How many week buckets contributed
    n_scans_total INTEGER NOT NULL,   -- Total scans across all buckets
    last_updated TEXT NOT NULL,       -- ISO 8601

    -- Audit trail
    prev_alpha REAL,                  -- Previous alpha (for rollback)
    prev_beta REAL                    -- Previous beta (for rollback)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_learned_priors_platform
    ON learned_priors(platform);
```

### 3.3 New Table: `aggregation_config`

```sql
CREATE TABLE IF NOT EXISTS aggregation_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Default configuration
INSERT OR IGNORE INTO aggregation_config (key, value, updated_at) VALUES
    ('collection_enabled', 'false', datetime('now')),
    ('min_scans_per_bucket', '100', datetime('now')),
    ('min_buckets_for_prior', '4', datetime('now')),
    ('smoothing_alpha', '0.3', datetime('now')),
    ('max_prior_effective_n', '100', datetime('now')),
    ('min_prior_effective_n', '10', datetime('now'));
```

---

## 4. Aggregation Algorithm

### 4.1 Per-Scan Contribution

When a scan completes AND both opt-in conditions are met:

```python
def contribute_to_aggregate(scan_result: dict, db: sqlite3.Connection) -> bool:
    """
    Contribute a completed scan to aggregate buckets.

    Returns True if contribution was made, False otherwise.
    Privacy: Only aggregate counts are stored. No identifying data.
    """
    # Check opt-in conditions
    if not get_config_bool(db, 'collection_enabled'):
        return False

    scan_meta = scan_result.get("scan_metadata", {})
    if not scan_meta.get("aggregate_consent", False):
        return False

    # Extract only what we need
    platform = scan_meta.get("platform", "").lower()
    if not platform:
        return False

    aggregates = scan_result.get("aggregates", {})
    n_items = aggregates.get("total_feed_items", 0)
    n_ads = aggregates.get("total_ads", 0)

    if n_items <= 0:
        return False  # Nothing to contribute

    # Compute week bucket from scan timestamp
    created_at = scan_meta.get("created_at", datetime.utcnow().isoformat())
    week_bucket = iso_week_bucket(created_at)  # e.g., "2025-W01"

    # Atomic upsert into aggregate bucket
    now = datetime.utcnow().isoformat()
    db.execute("""
        INSERT INTO aggregate_buckets
            (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
        VALUES (?, ?, 1, ?, ?, ?, ?)
        ON CONFLICT(platform, week_bucket) DO UPDATE SET
            n_scans = n_scans + 1,
            n_items_total = n_items_total + excluded.n_items_total,
            n_ads_total = n_ads_total + excluded.n_ads_total,
            updated_at = excluded.updated_at
    """, (platform, week_bucket, n_items, n_ads, now, now))
    db.commit()

    return True
```

### 4.2 ISO Week Bucket Computation

```python
from datetime import datetime

def iso_week_bucket(iso_timestamp: str) -> str:
    """
    Convert ISO 8601 timestamp to ISO week bucket string.

    Example: "2025-01-06T12:00:00Z" -> "2025-W02"
    """
    dt = datetime.fromisoformat(iso_timestamp.replace("Z", "+00:00"))
    iso_cal = dt.isocalendar()
    return f"{iso_cal.year}-W{iso_cal.week:02d}"
```

---

## 5. Prior Update Algorithm

### 5.1 Update Trigger

Prior updates run **weekly** via:
1. Scheduled job (production): Runs Sunday 00:00 UTC
2. CLI command (dev): `python -m accuracy.update_priors --platform tiktok`
3. API endpoint (gated): `POST /api/admin/update-priors` (requires admin token)

### 5.2 Eligibility Check

```python
def get_eligible_buckets(
    db: sqlite3.Connection,
    platform: str,
    min_scans: int = 100,
    lookback_weeks: int = 12
) -> list[dict]:
    """
    Get aggregate buckets eligible to contribute to prior update.

    Eligibility:
    - At least min_scans scans in the bucket (k-anonymity)
    - Within lookback_weeks of current date (recency)
    """
    cutoff_week = iso_week_bucket(
        (datetime.utcnow() - timedelta(weeks=lookback_weeks)).isoformat()
    )

    rows = db.execute("""
        SELECT platform, week_bucket, n_scans, n_items_total, n_ads_total
        FROM aggregate_buckets
        WHERE platform = ?
          AND week_bucket >= ?
          AND n_scans >= ?
        ORDER BY week_bucket DESC
    """, (platform, cutoff_week, min_scans)).fetchall()

    return [
        {
            "platform": r[0],
            "week_bucket": r[1],
            "n_scans": r[2],
            "n_items": r[3],
            "n_ads": r[4],
        }
        for r in rows
    ]
```

### 5.3 Prior Computation with Exponential Smoothing

```python
from accuracy.priors import BOOTSTRAP_PRIORS

def compute_learned_prior(
    platform: str,
    eligible_buckets: list[dict],
    current_prior: dict | None,
    smoothing_alpha: float = 0.3,
    min_buckets: int = 4,
    max_effective_n: float = 100.0,
    min_effective_n: float = 10.0
) -> dict | None:
    """
    Compute updated prior from eligible aggregate buckets.

    Uses exponential smoothing: new = alpha * empirical + (1 - alpha) * old

    Returns None if insufficient data (falls back to bootstrap).
    """
    if len(eligible_buckets) < min_buckets:
        return None  # Insufficient data, use bootstrap

    # Aggregate across eligible buckets
    total_items = sum(b["n_items"] for b in eligible_buckets)
    total_ads = sum(b["n_ads"] for b in eligible_buckets)
    total_scans = sum(b["n_scans"] for b in eligible_buckets)

    if total_items < 500:
        return None  # Still insufficient

    # Empirical rate
    empirical_rate = total_ads / total_items

    # Method of moments: target a reasonable variance
    # Variance of Beta(a,b) = ab / ((a+b)^2 * (a+b+1))
    # For ad rates ~10%, variance ~0.002 gives reasonable uncertainty
    target_variance = 0.002

    # Solve for effective_n = alpha + beta
    # Simplified: effective_n ≈ p(1-p)/variance - 1
    empirical_effective_n = (
        empirical_rate * (1 - empirical_rate) / target_variance
    ) - 1

    # Clamp to reasonable range
    empirical_effective_n = max(min_effective_n, min(empirical_effective_n, max_effective_n))

    # Compute empirical alpha/beta
    empirical_alpha = empirical_rate * empirical_effective_n
    empirical_beta = (1 - empirical_rate) * empirical_effective_n

    # Get baseline (current learned or bootstrap)
    if current_prior:
        old_alpha = current_prior["alpha"]
        old_beta = current_prior["beta"]
    else:
        bootstrap = BOOTSTRAP_PRIORS.get(platform, BOOTSTRAP_PRIORS["default"])
        old_alpha = bootstrap["alpha"]
        old_beta = bootstrap["beta"]

    # Exponential smoothing
    new_alpha = smoothing_alpha * empirical_alpha + (1 - smoothing_alpha) * old_alpha
    new_beta = smoothing_alpha * empirical_beta + (1 - smoothing_alpha) * old_beta

    return {
        "platform": platform,
        "alpha": round(new_alpha, 4),
        "beta": round(new_beta, 4),
        "effective_n": round(new_alpha + new_beta, 2),
        "n_buckets_used": len(eligible_buckets),
        "n_scans_total": total_scans,
        "empirical_rate": round(empirical_rate, 4),
    }
```

### 5.4 Prior Update Execution

```python
def update_prior_for_platform(
    db: sqlite3.Connection,
    platform: str,
    dry_run: bool = False
) -> dict:
    """
    Update learned prior for a platform.

    Returns result dict with status and details.
    """
    # Load config
    min_scans = get_config_int(db, 'min_scans_per_bucket', 100)
    min_buckets = get_config_int(db, 'min_buckets_for_prior', 4)
    smoothing = get_config_float(db, 'smoothing_alpha', 0.3)
    max_n = get_config_float(db, 'max_prior_effective_n', 100.0)
    min_n = get_config_float(db, 'min_prior_effective_n', 10.0)

    # Get eligible buckets
    eligible = get_eligible_buckets(db, platform, min_scans)

    if len(eligible) < min_buckets:
        return {
            "status": "skipped",
            "reason": f"insufficient_buckets",
            "buckets_found": len(eligible),
            "buckets_required": min_buckets,
            "fallback": "bootstrap",
        }

    # Get current learned prior (if any)
    current = db.execute(
        "SELECT alpha, beta FROM learned_priors WHERE platform = ?",
        (platform,)
    ).fetchone()
    current_prior = {"alpha": current[0], "beta": current[1]} if current else None

    # Compute new prior
    new_prior = compute_learned_prior(
        platform, eligible, current_prior,
        smoothing_alpha=smoothing,
        min_buckets=min_buckets,
        max_effective_n=max_n,
        min_effective_n=min_n
    )

    if new_prior is None:
        return {
            "status": "skipped",
            "reason": "computation_failed",
            "fallback": "bootstrap",
        }

    result = {
        "status": "success" if not dry_run else "dry_run",
        "platform": platform,
        "new_alpha": new_prior["alpha"],
        "new_beta": new_prior["beta"],
        "new_effective_n": new_prior["effective_n"],
        "empirical_rate_percent": round(new_prior["empirical_rate"] * 100, 2),
        "buckets_used": new_prior["n_buckets_used"],
        "scans_total": new_prior["n_scans_total"],
    }

    if current_prior:
        result["prev_alpha"] = current_prior["alpha"]
        result["prev_beta"] = current_prior["beta"]

    if dry_run:
        return result

    # Persist to database
    now = datetime.utcnow().isoformat()
    db.execute("""
        INSERT INTO learned_priors
            (platform, alpha, beta, effective_n, source_version,
             n_buckets_used, n_scans_total, last_updated, prev_alpha, prev_beta)
        VALUES (?, ?, ?, ?, 'learned_v1', ?, ?, ?, ?, ?)
        ON CONFLICT(platform) DO UPDATE SET
            alpha = excluded.alpha,
            beta = excluded.beta,
            effective_n = excluded.effective_n,
            n_buckets_used = excluded.n_buckets_used,
            n_scans_total = excluded.n_scans_total,
            last_updated = excluded.last_updated,
            prev_alpha = learned_priors.alpha,
            prev_beta = learned_priors.beta
    """, (
        platform,
        new_prior["alpha"],
        new_prior["beta"],
        new_prior["effective_n"],
        new_prior["n_buckets_used"],
        new_prior["n_scans_total"],
        now,
        current_prior["alpha"] if current_prior else None,
        current_prior["beta"] if current_prior else None,
    ))
    db.commit()

    return result
```

---

## 6. Prior Selection Logic Update

### 6.1 Updated `get_ads_rate_prior()`

```python
# accuracy/priors.py

def get_ads_rate_prior(
    platform: str,
    db: sqlite3.Connection | None = None,
    use_learned: bool = True
) -> tuple[float, float, str, dict]:
    """
    Get the appropriate prior for ads rate estimation.

    Returns: (alpha, beta, source, prior_info)

    Priority:
    1. Learned prior (if use_learned=True and available)
    2. Bootstrap prior (platform-specific or default)

    prior_info contains:
    - source: "learned" | "bootstrap"
    - effective_n: alpha + beta
    - last_updated: ISO timestamp (for learned) or None
    - version: source_version (for learned) or None
    """
    # Try learned prior first
    if use_learned and db is not None:
        row = db.execute("""
            SELECT alpha, beta, effective_n, source_version, last_updated
            FROM learned_priors
            WHERE platform = ?
        """, (platform.lower(),)).fetchone()

        if row:
            alpha, beta, effective_n, version, last_updated = row
            return (
                alpha,
                beta,
                "learned",
                {
                    "source": "learned",
                    "effective_n": effective_n,
                    "last_updated": last_updated,
                    "version": version,
                }
            )

    # Fall back to bootstrap
    bootstrap = BOOTSTRAP_PRIORS.get(platform.lower(), BOOTSTRAP_PRIORS["default"])
    alpha = bootstrap["alpha"]
    beta = bootstrap["beta"]

    return (
        alpha,
        beta,
        "bootstrap",
        {
            "source": "bootstrap",
            "effective_n": alpha + beta,
            "last_updated": None,
            "version": None,
        }
    )
```

### 6.2 Updated Evidence Bundle Output

When learned priors are used, `prior_info` in the response becomes:

```json
{
  "ad_rate_percent_ci_bayesian": {
    "lower": 6.8,
    "upper": 19.4,
    "method": "bayesian_beta",
    "point_estimate": 11.1,
    "prior_used": true,
    "prior_info": {
      "platform": "tiktok",
      "source": "learned",
      "alpha": 2.34,
      "beta": 19.66,
      "effective_n": 22.0,
      "last_updated": "2025-01-05T00:00:00Z",
      "version": "learned_v1"
    }
  }
}
```

---

## 7. Gating and Opt-In

### 7.1 Backend Configuration

```python
# config.py

AGGREGATION_CONFIG = {
    # Master switch for aggregate collection
    "AGGREGATE_COLLECTION_ENABLED": os.getenv("AGGREGATE_COLLECTION_ENABLED", "false").lower() == "true",

    # Admin API token for manual prior updates
    "ADMIN_API_TOKEN": os.getenv("ADMIN_API_TOKEN", None),

    # Whether to use learned priors in responses
    "USE_LEARNED_PRIORS": os.getenv("USE_LEARNED_PRIORS", "false").lower() == "true",
}
```

### 7.2 Per-Scan Consent

Consent is expressed in `scan_metadata`:

```json
{
  "scan_metadata": {
    "scan_id": "abc123",
    "platform": "tiktok",
    "aggregate_consent": true
  }
}
```

The frontend/client must:
1. Collect explicit user consent before setting `aggregate_consent: true`
2. Default to `aggregate_consent: false` if not explicitly granted
3. Allow users to revoke consent (future scans only; past contributions are anonymous)

### 7.3 Admin API Endpoint

```python
# app.py

@app.post("/api/admin/update-priors")
def admin_update_priors(
    platform: str = Query(...),
    dry_run: bool = Query(default=True),
    authorization: str = Header(...)
):
    """
    Manually trigger prior update for a platform.

    Requires valid admin token in Authorization header.
    """
    expected_token = AGGREGATION_CONFIG["ADMIN_API_TOKEN"]
    if not expected_token or authorization != f"Bearer {expected_token}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    db = get_db_connection()
    result = update_prior_for_platform(db, platform, dry_run=dry_run)
    return result
```

### 7.4 CLI Command

```python
# accuracy/update_priors.py

"""
CLI for updating learned priors.

Usage:
    python -m accuracy.update_priors --platform tiktok
    python -m accuracy.update_priors --platform tiktok --dry-run
    python -m accuracy.update_priors --all-platforms
"""

import argparse
from database import get_db_connection
from accuracy.aggregation import update_prior_for_platform

PLATFORMS = ["tiktok", "instagram", "youtube", "facebook", "twitter"]

def main():
    parser = argparse.ArgumentParser(description="Update learned priors from aggregates")
    parser.add_argument("--platform", type=str, help="Platform to update")
    parser.add_argument("--all-platforms", action="store_true", help="Update all platforms")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be updated")
    args = parser.parse_args()

    if not args.platform and not args.all_platforms:
        parser.error("Must specify --platform or --all-platforms")

    db = get_db_connection()
    platforms = PLATFORMS if args.all_platforms else [args.platform]

    for platform in platforms:
        print(f"\n{'='*50}")
        print(f"Platform: {platform}")
        print('='*50)
        result = update_prior_for_platform(db, platform, dry_run=args.dry_run)
        for k, v in result.items():
            print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
```

---

## 8. Evaluation Metrics

### 8.1 Prior Quality Metrics (Privacy-Safe)

These metrics use only aggregate data:

| Metric | Definition | Target |
|--------|------------|--------|
| **Coverage** | % of platforms with learned priors | ≥ 80% |
| **Bucket depth** | Average eligible buckets per platform | ≥ 6 |
| **Staleness** | Days since last prior update | ≤ 14 |
| **Stability** | |alpha_new - alpha_old| / alpha_old | ≤ 20% |
| **Convergence** | Trend in stability over time | Decreasing |

### 8.2 Accuracy Improvement Metrics (Requires Ground Truth)

For internal evaluation only (not exposed):

| Metric | Definition | How Measured |
|--------|------------|--------------|
| **Prior calibration** | |learned_rate - true_rate| | Compare to labeled test set |
| **CI coverage** | % of true rates within credible interval | Should be ~95% |
| **Shrinkage quality** | Does shrinkage help or hurt? | A/B on held-out scans |

### 8.3 Monitoring Dashboard (Privacy-Safe)

```python
def get_aggregation_stats(db: sqlite3.Connection) -> dict:
    """
    Get privacy-safe aggregation statistics for monitoring.

    Returns only aggregate counts, never individual data.
    """
    return {
        "total_buckets": db.execute(
            "SELECT COUNT(*) FROM aggregate_buckets"
        ).fetchone()[0],

        "eligible_buckets": db.execute(
            "SELECT COUNT(*) FROM aggregate_buckets WHERE n_scans >= 100"
        ).fetchone()[0],

        "platforms_with_learned": db.execute(
            "SELECT COUNT(*) FROM learned_priors"
        ).fetchone()[0],

        "oldest_bucket": db.execute(
            "SELECT MIN(week_bucket) FROM aggregate_buckets"
        ).fetchone()[0],

        "newest_bucket": db.execute(
            "SELECT MAX(week_bucket) FROM aggregate_buckets"
        ).fetchone()[0],

        "total_scans_aggregated": db.execute(
            "SELECT SUM(n_scans) FROM aggregate_buckets"
        ).fetchone()[0] or 0,

        "by_platform": {
            row[0]: {"buckets": row[1], "scans": row[2], "items": row[3]}
            for row in db.execute("""
                SELECT platform, COUNT(*), SUM(n_scans), SUM(n_items_total)
                FROM aggregate_buckets
                GROUP BY platform
            """).fetchall()
        }
    }
```

---

## 9. Test Plan

### 9.1 Unit Tests

**File:** `eval/test_phase5c4_aggregation.py`

```python
"""
Phase 5C4 Aggregation Tests

Run: pytest eval/test_phase5c4_aggregation.py -v
"""

import pytest
import sqlite3
from datetime import datetime, timedelta
from accuracy.aggregation import (
    contribute_to_aggregate,
    get_eligible_buckets,
    compute_learned_prior,
    update_prior_for_platform,
    iso_week_bucket,
)
from accuracy.priors import get_ads_rate_prior, BOOTSTRAP_PRIORS


class TestIsoWeekBucket:
    """Test ISO week bucket computation."""

    def test_week_bucket_format(self):
        assert iso_week_bucket("2025-01-06T12:00:00Z") == "2025-W02"
        assert iso_week_bucket("2025-01-01T00:00:00Z") == "2025-W01"
        assert iso_week_bucket("2024-12-31T23:59:59Z") == "2025-W01"  # ISO week

    def test_week_bucket_consistency(self):
        # Same week should produce same bucket
        assert iso_week_bucket("2025-01-06T00:00:00Z") == iso_week_bucket("2025-01-12T23:59:59Z")


class TestContributeToAggregate:
    """Test per-scan contribution logic."""

    @pytest.fixture
    def db(self):
        conn = sqlite3.connect(":memory:")
        conn.execute("""
            CREATE TABLE aggregate_buckets (
                id INTEGER PRIMARY KEY,
                platform TEXT NOT NULL,
                week_bucket TEXT NOT NULL,
                n_scans INTEGER DEFAULT 0,
                n_items_total INTEGER DEFAULT 0,
                n_ads_total INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT,
                UNIQUE(platform, week_bucket)
            )
        """)
        conn.execute("""
            CREATE TABLE aggregation_config (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TEXT
            )
        """)
        conn.execute("INSERT INTO aggregation_config VALUES ('collection_enabled', 'true', datetime('now'))")
        return conn

    def test_contribution_with_consent(self, db):
        scan = {
            "scan_metadata": {
                "platform": "tiktok",
                "created_at": "2025-01-06T12:00:00Z",
                "aggregate_consent": True,
            },
            "aggregates": {
                "total_feed_items": 25,
                "total_ads": 3,
            }
        }
        result = contribute_to_aggregate(scan, db)
        assert result is True

        row = db.execute("SELECT * FROM aggregate_buckets").fetchone()
        assert row is not None
        assert row[1] == "tiktok"  # platform
        assert row[2] == "2025-W02"  # week_bucket
        assert row[3] == 1  # n_scans
        assert row[4] == 25  # n_items_total
        assert row[5] == 3  # n_ads_total

    def test_contribution_without_consent(self, db):
        scan = {
            "scan_metadata": {
                "platform": "tiktok",
                "created_at": "2025-01-06T12:00:00Z",
                "aggregate_consent": False,
            },
            "aggregates": {"total_feed_items": 25, "total_ads": 3}
        }
        result = contribute_to_aggregate(scan, db)
        assert result is False
        assert db.execute("SELECT COUNT(*) FROM aggregate_buckets").fetchone()[0] == 0

    def test_contribution_accumulates(self, db):
        for i in range(5):
            scan = {
                "scan_metadata": {
                    "platform": "tiktok",
                    "created_at": "2025-01-06T12:00:00Z",
                    "aggregate_consent": True,
                },
                "aggregates": {"total_feed_items": 20, "total_ads": 2}
            }
            contribute_to_aggregate(scan, db)

        row = db.execute("SELECT n_scans, n_items_total, n_ads_total FROM aggregate_buckets").fetchone()
        assert row == (5, 100, 10)

    def test_no_contribution_when_disabled(self, db):
        db.execute("UPDATE aggregation_config SET value = 'false' WHERE key = 'collection_enabled'")
        scan = {
            "scan_metadata": {"platform": "tiktok", "aggregate_consent": True},
            "aggregates": {"total_feed_items": 25, "total_ads": 3}
        }
        result = contribute_to_aggregate(scan, db)
        assert result is False


class TestEligibleBuckets:
    """Test bucket eligibility for prior updates."""

    @pytest.fixture
    def db_with_buckets(self):
        conn = sqlite3.connect(":memory:")
        conn.execute("""
            CREATE TABLE aggregate_buckets (
                id INTEGER PRIMARY KEY,
                platform TEXT, week_bucket TEXT, n_scans INTEGER,
                n_items_total INTEGER, n_ads_total INTEGER,
                created_at TEXT, updated_at TEXT,
                UNIQUE(platform, week_bucket)
            )
        """)
        # Add test buckets
        buckets = [
            ("tiktok", "2025-W01", 150, 3750, 375),  # Eligible
            ("tiktok", "2025-W02", 120, 3000, 300),  # Eligible
            ("tiktok", "2024-W50", 80, 2000, 200),   # Below threshold
            ("tiktok", "2024-W40", 200, 5000, 500),  # Too old (if lookback < 12)
            ("instagram", "2025-W01", 100, 2500, 300),  # Different platform
        ]
        for p, w, n, items, ads in buckets:
            conn.execute(
                "INSERT INTO aggregate_buckets VALUES (NULL, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
                (p, w, n, items, ads)
            )
        return conn

    def test_eligible_buckets_threshold(self, db_with_buckets):
        eligible = get_eligible_buckets(db_with_buckets, "tiktok", min_scans=100)
        assert len(eligible) == 2
        assert all(b["n_scans"] >= 100 for b in eligible)

    def test_eligible_buckets_platform_filter(self, db_with_buckets):
        eligible = get_eligible_buckets(db_with_buckets, "instagram", min_scans=100)
        assert len(eligible) == 1
        assert eligible[0]["platform"] == "instagram"


class TestComputeLearnedPrior:
    """Test prior computation from aggregates."""

    def test_insufficient_buckets(self):
        buckets = [{"n_items": 1000, "n_ads": 100, "n_scans": 150}]
        result = compute_learned_prior("tiktok", buckets, None, min_buckets=4)
        assert result is None

    def test_sufficient_buckets(self):
        buckets = [
            {"n_items": 1000, "n_ads": 100, "n_scans": 150},
            {"n_items": 1000, "n_ads": 110, "n_scans": 150},
            {"n_items": 1000, "n_ads": 90, "n_scans": 150},
            {"n_items": 1000, "n_ads": 105, "n_scans": 150},
        ]
        result = compute_learned_prior("tiktok", buckets, None, min_buckets=4)
        assert result is not None
        assert result["platform"] == "tiktok"
        assert 0 < result["alpha"] < 50
        assert 0 < result["beta"] < 50
        # Empirical rate should be ~10.125%
        assert 0.09 < result["empirical_rate"] < 0.12

    def test_smoothing_effect(self):
        buckets = [
            {"n_items": 1000, "n_ads": 200, "n_scans": 150},  # 20% rate
        ] * 4

        # Current prior at 10%
        current = {"alpha": 2.0, "beta": 18.0}

        result = compute_learned_prior(
            "tiktok", buckets, current,
            smoothing_alpha=0.3, min_buckets=4
        )

        # New prior should be between 10% and 20%, closer to 10%
        new_rate = result["alpha"] / (result["alpha"] + result["beta"])
        assert 0.10 < new_rate < 0.20
        assert new_rate < 0.15  # Smoothing pulls toward old prior

    def test_effective_n_bounds(self):
        buckets = [{"n_items": 10000, "n_ads": 1000, "n_scans": 500}] * 4

        result = compute_learned_prior(
            "tiktok", buckets, None,
            min_buckets=4, max_effective_n=100.0, min_effective_n=10.0
        )

        assert 10.0 <= result["effective_n"] <= 100.0


class TestPriorSelection:
    """Test prior selection with learned priors."""

    @pytest.fixture
    def db_with_learned(self):
        conn = sqlite3.connect(":memory:")
        conn.execute("""
            CREATE TABLE learned_priors (
                id INTEGER PRIMARY KEY,
                platform TEXT UNIQUE,
                alpha REAL, beta REAL, effective_n REAL,
                source_version TEXT, n_buckets_used INTEGER,
                n_scans_total INTEGER, last_updated TEXT,
                prev_alpha REAL, prev_beta REAL
            )
        """)
        conn.execute("""
            INSERT INTO learned_priors VALUES
            (NULL, 'tiktok', 2.5, 20.5, 23.0, 'learned_v1', 6, 900,
             '2025-01-05T00:00:00Z', 2.0, 18.0)
        """)
        return conn

    def test_learned_prior_selected(self, db_with_learned):
        alpha, beta, source, info = get_ads_rate_prior("tiktok", db_with_learned, use_learned=True)
        assert source == "learned"
        assert alpha == 2.5
        assert beta == 20.5
        assert info["effective_n"] == 23.0
        assert info["last_updated"] == "2025-01-05T00:00:00Z"

    def test_fallback_to_bootstrap(self, db_with_learned):
        alpha, beta, source, info = get_ads_rate_prior("instagram", db_with_learned, use_learned=True)
        assert source == "bootstrap"
        assert info["last_updated"] is None

    def test_bootstrap_when_learned_disabled(self, db_with_learned):
        alpha, beta, source, info = get_ads_rate_prior("tiktok", db_with_learned, use_learned=False)
        assert source == "bootstrap"


class TestPrivacyConstraints:
    """Verify privacy guarantees are maintained."""

    def test_no_identifying_fields_in_aggregate(self):
        # Aggregate bucket schema should not contain identifying fields
        forbidden_fields = ["user_id", "scan_id", "ip", "account", "handle", "content"]
        aggregate_fields = ["platform", "week_bucket", "n_scans", "n_items_total", "n_ads_total"]

        for forbidden in forbidden_fields:
            assert forbidden not in aggregate_fields

    def test_k_anonymity_threshold(self):
        # Default threshold should be at least 100
        from accuracy.aggregation import DEFAULT_MIN_SCANS_PER_BUCKET
        assert DEFAULT_MIN_SCANS_PER_BUCKET >= 100
```

### 9.2 Integration Tests

**File:** `eval/test_phase5c4_integration.py`

```python
"""
Phase 5C4 Integration Tests

Run: pytest eval/test_phase5c4_integration.py -v
"""

import pytest
from fastapi.testclient import TestClient
from app import app


class TestAdminAPI:
    """Test admin prior update endpoint."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_update_priors_requires_auth(self, client):
        response = client.post("/api/admin/update-priors?platform=tiktok")
        assert response.status_code == 401

    def test_update_priors_dry_run(self, client, monkeypatch):
        monkeypatch.setenv("ADMIN_API_TOKEN", "test-token")
        response = client.post(
            "/api/admin/update-priors?platform=tiktok&dry_run=true",
            headers={"Authorization": "Bearer test-token"}
        )
        assert response.status_code == 200
        assert response.json()["status"] in ["dry_run", "skipped"]


class TestEvidenceBundleWithLearnedPriors:
    """Test evidence bundle reflects learned priors correctly."""

    def test_prior_info_source_learned(self):
        # When learned prior is used, source should be "learned"
        # This requires a scan + learned prior in DB
        pass  # Implement with fixtures

    def test_prior_info_includes_last_updated(self):
        # last_updated should be present when source is "learned"
        pass  # Implement with fixtures
```

### 9.3 Fixtures

**File:** `eval/fixtures/phase5c4/eligible_buckets.json`

```json
{
  "description": "Test data for prior update with eligible buckets",
  "platform": "tiktok",
  "buckets": [
    {"week_bucket": "2025-W01", "n_scans": 150, "n_items": 3750, "n_ads": 375},
    {"week_bucket": "2025-W02", "n_scans": 120, "n_items": 3000, "n_ads": 360},
    {"week_bucket": "2024-W52", "n_scans": 180, "n_items": 4500, "n_ads": 405},
    {"week_bucket": "2024-W51", "n_scans": 110, "n_items": 2750, "n_ads": 303}
  ],
  "expected": {
    "eligible_count": 4,
    "total_items": 14000,
    "total_ads": 1443,
    "empirical_rate": 0.1031,
    "prior_update_status": "success"
  }
}
```

---

## 10. Acceptance Criteria

### 10.1 Privacy

- [ ] `aggregate_buckets` table contains NO user identifiers, scan IDs, or content
- [ ] Minimum 100 scans required before bucket contributes to priors (configurable)
- [ ] Weekly time buckets only (no finer granularity)
- [ ] No foreign keys linking aggregates to individual scans

### 10.2 Correctness

- [ ] Learned priors do NOT affect per-item `is_ad` classification
- [ ] Exponential smoothing prevents prior swings (|Δα|/α ≤ 50% per update)
- [ ] Fallback to bootstrap when <4 eligible buckets
- [ ] Prior effective_n stays within [10, 100] bounds

### 10.3 Transparency

- [ ] `prior_info.source` = `"learned"` when learned priors used
- [ ] `prior_info.last_updated` present for learned priors
- [ ] `prior_info.version` indicates learned prior version
- [ ] `prior_info.effective_n` reflects learned prior strength

### 10.4 Gating

- [ ] Aggregation disabled by default (`AGGREGATE_COLLECTION_ENABLED=false`)
- [ ] Per-scan opt-in via `aggregate_consent` field
- [ ] Admin API requires valid token
- [ ] CLI works only with explicit `--platform` flag

### 10.5 Tests

- [ ] All unit tests pass (`pytest eval/test_phase5c4_aggregation.py`)
- [ ] Integration tests pass (`pytest eval/test_phase5c4_integration.py`)
- [ ] Privacy constraints verified in tests

---

## 11. File Structure

```
apps/alg-gemini/backend/
├── accuracy/
│   ├── aggregation.py        # NEW: Aggregation logic
│   ├── priors.py             # MODIFIED: Add learned prior selection
│   ├── stats.py              # UNCHANGED
│   └── update_priors.py      # NEW: CLI for prior updates
├── database.py               # MODIFIED: Add aggregate tables
├── app.py                    # MODIFIED: Add admin endpoint
├── config.py                 # MODIFIED: Add aggregation config
├── eval/
│   ├── test_phase5c4_aggregation.py   # NEW
│   ├── test_phase5c4_integration.py   # NEW
│   └── fixtures/phase5c4/             # NEW
│       └── eligible_buckets.json
└── docs/
    └── PHASE_5C4_SPEC.md     # THIS FILE
```

---

## 12. Implementation Order

1. **Database schema** - Add tables to `database.py`
2. **Aggregation logic** - Create `accuracy/aggregation.py`
3. **Prior selection update** - Modify `accuracy/priors.py`
4. **Evidence bundle update** - Modify `evidence_bundle.py` for learned prior_info
5. **CLI command** - Create `accuracy/update_priors.py`
6. **Admin API** - Add endpoint to `app.py`
7. **Unit tests** - Create test files
8. **Integration tests** - Create integration test file
9. **Documentation** - Update README with aggregation section

---

## Appendix A: Configuration Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `AGGREGATE_COLLECTION_ENABLED` | bool | `false` | Master switch for collection |
| `USE_LEARNED_PRIORS` | bool | `false` | Use learned priors in responses |
| `ADMIN_API_TOKEN` | str | `null` | Token for admin API |
| `min_scans_per_bucket` | int | `100` | K-anonymity threshold |
| `min_buckets_for_prior` | int | `4` | Minimum buckets for update |
| `smoothing_alpha` | float | `0.3` | Exponential smoothing factor |
| `max_prior_effective_n` | float | `100.0` | Max pseudo-observations |
| `min_prior_effective_n` | float | `10.0` | Min pseudo-observations |

---

## Appendix B: Migration Guide

When enabling aggregation for the first time:

1. Set `AGGREGATE_COLLECTION_ENABLED=true` in environment
2. Wait 4+ weeks for buckets to accumulate
3. Run `python -m accuracy.update_priors --all-platforms --dry-run`
4. Review output for sanity (rates should be 5-20% typically)
5. Run `python -m accuracy.update_priors --all-platforms` to apply
6. Set `USE_LEARNED_PRIORS=true` to enable in responses
7. Monitor via `/api/admin/aggregation-stats` endpoint
