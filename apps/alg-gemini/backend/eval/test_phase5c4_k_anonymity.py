"""
Phase 5C4.1: Test k-anonymity enforcement (minimum scans per bucket).
"""

import pytest
import sqlite3
import os
import tempfile
from datetime import datetime, timedelta
from accuracy.aggregation import (
    get_eligible_buckets,
    DEFAULT_MIN_SCANS_PER_BUCKET
)
from database import get_connection, init_database, DB_PATH


class TestKAnonymity:
    """Test that k-anonymity threshold is enforced."""

    @pytest.fixture
    def temp_db(self):
        """Create a temporary database for testing."""
        original_path = DB_PATH
        
        fd, temp_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        
        import database
        database.DB_PATH = temp_path
        
        init_database()
        
        yield temp_path
        
        database.DB_PATH = original_path
        
        if os.path.exists(temp_path):
            os.remove(temp_path)

    def test_buckets_below_threshold_not_eligible(self, temp_db):
        """Buckets with <100 scans should not be eligible."""
        conn = get_connection()
        cursor = conn.cursor()
        
        # Create bucket with 50 scans (below threshold)
        week_bucket = "2026-W01"
        cursor.execute("""
            INSERT INTO aggregate_buckets
            (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
            VALUES (?, ?, 50, 5000, 250, ?, ?)
        """, ("twitter", week_bucket, datetime.now().isoformat(), datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        eligible = get_eligible_buckets("twitter", min_scans_per_bucket=DEFAULT_MIN_SCANS_PER_BUCKET)
        assert len(eligible) == 0

    def test_buckets_at_threshold_eligible(self, temp_db):
        """Buckets with exactly 100 scans should be eligible."""
        conn = get_connection()
        cursor = conn.cursor()
        
        week_bucket = "2026-W01"
        cursor.execute("""
            INSERT INTO aggregate_buckets
            (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
            VALUES (?, ?, 100, 10000, 500, ?, ?)
        """, ("twitter", week_bucket, datetime.now().isoformat(), datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        eligible = get_eligible_buckets("twitter", min_scans_per_bucket=DEFAULT_MIN_SCANS_PER_BUCKET)
        assert len(eligible) == 1
        assert eligible[0]["week_bucket"] == week_bucket
        assert eligible[0]["n_scans"] == 100

    def test_buckets_above_threshold_eligible(self, temp_db):
        """Buckets with >100 scans should be eligible."""
        conn = get_connection()
        cursor = conn.cursor()
        
        week_bucket = "2026-W01"
        cursor.execute("""
            INSERT INTO aggregate_buckets
            (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
            VALUES (?, ?, 150, 15000, 750, ?, ?)
        """, ("twitter", week_bucket, datetime.now().isoformat(), datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        eligible = get_eligible_buckets("twitter", min_scans_per_bucket=DEFAULT_MIN_SCANS_PER_BUCKET)
        assert len(eligible) == 1
        assert eligible[0]["n_scans"] == 150

    def test_mixed_buckets_only_eligible_returned(self, temp_db):
        """Only eligible buckets should be returned."""
        conn = get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Eligible bucket
        cursor.execute("""
            INSERT INTO aggregate_buckets
            (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
            VALUES (?, ?, 120, 12000, 600, ?, ?)
        """, ("twitter", "2026-W01", now, now))
        
        # Ineligible bucket
        cursor.execute("""
            INSERT INTO aggregate_buckets
            (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
            VALUES (?, ?, 80, 8000, 400, ?, ?)
        """, ("twitter", "2026-W02", now, now))
        
        # Another eligible bucket
        cursor.execute("""
            INSERT INTO aggregate_buckets
            (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
            VALUES (?, ?, 200, 20000, 1000, ?, ?)
        """, ("twitter", "2026-W03", now, now))
        
        conn.commit()
        conn.close()
        
        eligible = get_eligible_buckets("twitter", min_scans_per_bucket=DEFAULT_MIN_SCANS_PER_BUCKET)
        assert len(eligible) == 2
        assert all(b["n_scans"] >= DEFAULT_MIN_SCANS_PER_BUCKET for b in eligible)
        assert all(b["week_bucket"] in ["2026-W01", "2026-W03"] for b in eligible)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

