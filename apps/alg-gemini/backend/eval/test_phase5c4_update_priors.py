"""
Phase 5C4.1: Test learned prior update CLI and computation.
"""

import pytest
import sqlite3
import os
import tempfile
from datetime import datetime
from accuracy.update_priors import (
    compute_learned_prior,
    update_learned_prior,
    update_priors_for_platform
)
from accuracy.aggregation import DEFAULT_MIN_SCANS_PER_BUCKET
from database import get_connection, init_database, DB_PATH


class TestUpdatePriors:
    """Test learned prior computation and updates."""

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

    def test_compute_prior_from_eligible_buckets(self, temp_db):
        """Should compute prior parameters from eligible buckets."""
        conn = get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Create 4 eligible buckets for twitter
        buckets = [
            ("2026-W01", 100, 10000, 500),  # 5% ad rate
            ("2026-W02", 120, 12000, 600),  # 5% ad rate
            ("2026-W03", 110, 11000, 550),  # 5% ad rate
            ("2026-W04", 130, 13000, 650),  # 5% ad rate
        ]
        
        for week, n_scans, n_items, n_ads in buckets:
            cursor.execute("""
                INSERT INTO aggregate_buckets
                (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("twitter", week, n_scans, n_items, n_ads, now, now))
        
        conn.commit()
        conn.close()
        
        eligible_buckets = [
            {"platform": "twitter", "week_bucket": week, "n_scans": n_scans, 
             "n_items_total": n_items, "n_ads_total": n_ads}
            for week, n_scans, n_items, n_ads in buckets
        ]
        
        prior_params = compute_learned_prior(eligible_buckets)
        
        assert prior_params is not None
        assert "alpha" in prior_params
        assert "beta" in prior_params
        assert "effective_n" in prior_params
        assert prior_params["empirical_mean"] == pytest.approx(0.05, rel=1e-2)  # 5%
        assert prior_params["alpha"] > 0
        assert prior_params["beta"] > 0

    def test_update_prior_dry_run(self, temp_db):
        """Dry run should not write to database."""
        conn = get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Create eligible buckets
        for week in ["2026-W01", "2026-W02", "2026-W03", "2026-W04"]:
            cursor.execute("""
                INSERT INTO aggregate_buckets
                (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
                VALUES (?, ?, 100, 10000, 500, ?, ?)
            """, ("twitter", week, now, now))
        
        conn.commit()
        conn.close()
        
        # Dry run update
        result = update_priors_for_platform(
            "twitter",
            min_scans_per_bucket=DEFAULT_MIN_SCANS_PER_BUCKET,
            min_eligible_buckets=4,
            dry_run=True
        )
        
        assert result is False  # Dry run returns False
        
        # Verify no prior was written
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM learned_priors WHERE platform = 'twitter'")
        count = cursor.fetchone()["count"]
        conn.close()
        
        assert count == 0

    def test_update_prior_real_write(self, temp_db):
        """Real update should write to database."""
        conn = get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Create eligible buckets
        for week in ["2026-W01", "2026-W02", "2026-W03", "2026-W04"]:
            cursor.execute("""
                INSERT INTO aggregate_buckets
                (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
                VALUES (?, ?, 100, 10000, 500, ?, ?)
            """, ("twitter", week, now, now))
        
        conn.commit()
        conn.close()
        
        # Real update
        result = update_priors_for_platform(
            "twitter",
            min_scans_per_bucket=DEFAULT_MIN_SCANS_PER_BUCKET,
            min_eligible_buckets=4,
            dry_run=False
        )
        
        assert result is True
        
        # Verify prior was written
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT alpha, beta, effective_n, source, version
            FROM learned_priors
            WHERE platform = 'twitter'
        """)
        row = cursor.fetchone()
        conn.close()
        
        assert row is not None
        assert row["source"] == "learned"
        assert row["alpha"] > 0
        assert row["beta"] > 0
        assert row["effective_n"] > 0

    def test_smoothing_applied(self, temp_db):
        """Smoothing should blend new and existing priors."""
        conn = get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Create existing learned prior
        cursor.execute("""
            INSERT INTO learned_priors
            (platform, alpha, beta, effective_n, version, last_updated, source, note)
            VALUES (?, 2.0, 18.0, 20.0, 'learned_v1', ?, 'learned', 'test')
        """, ("twitter", now))
        
        # Create eligible buckets
        for week in ["2026-W01", "2026-W02", "2026-W03", "2026-W04"]:
            cursor.execute("""
                INSERT INTO aggregate_buckets
                (platform, week_bucket, n_scans, n_items_total, n_ads_total, created_at, updated_at)
                VALUES (?, ?, 100, 10000, 500, ?, ?)
            """, ("twitter", week, now, now))
        
        conn.commit()
        conn.close()
        
        # Update with smoothing
        result = update_priors_for_platform(
            "twitter",
            min_scans_per_bucket=DEFAULT_MIN_SCANS_PER_BUCKET,
            min_eligible_buckets=4,
            smoothing=0.3,
            dry_run=False
        )
        
        assert result is True
        
        # Verify smoothed prior
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT alpha, beta FROM learned_priors WHERE platform = 'twitter'")
        row = cursor.fetchone()
        conn.close()
        
        # New empirical would be around alpha=5, beta=95 for 5% mean
        # With smoothing 0.3: alpha_new = 0.3*5 + 0.7*2 = 2.9
        # Should be between old (2.0) and new empirical (5.0)
        assert 2.0 < row["alpha"] < 5.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

