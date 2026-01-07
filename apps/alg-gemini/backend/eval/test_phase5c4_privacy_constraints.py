"""
Phase 5C4.1: Test privacy constraints - no scan IDs or content stored.
"""

import pytest
import sqlite3
import os
import tempfile
from datetime import datetime
from accuracy.aggregation import contribute_scan_to_aggregates, is_aggregation_enabled
from database import get_connection, init_database, DB_PATH


class TestPrivacyConstraints:
    """Test that privacy constraints are enforced."""

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

    def test_aggregate_buckets_schema_no_identifiers(self, temp_db):
        """aggregate_buckets table should not contain scan_id or user_id columns."""
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get table schema
        cursor.execute("PRAGMA table_info(aggregate_buckets)")
        columns = [row[1] for row in cursor.fetchall()]
        conn.close()
        
        # Verify allowed columns only
        allowed_columns = {
            "platform", "week_bucket", "n_scans", "n_items_total", 
            "n_ads_total", "created_at", "updated_at"
        }
        
        assert set(columns) == allowed_columns
        assert "scan_id" not in columns
        assert "user_id" not in columns
        assert "scan_metadata" not in columns

    def test_contribution_stores_only_counts(self, temp_db):
        """Contribution should store only aggregate counts, not content."""
        # Enable aggregation
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE aggregation_config SET value = 'true' WHERE key = 'AGGREGATE_COLLECTION_ENABLED'
        """)
        conn.commit()
        conn.close()
        
        scan = {
            "scan_metadata": {
                "scan_id": "test-scan-123",
                "platform": "twitter",
                "created_at": datetime.now().isoformat(),
                "aggregate_consent": True,
                "user_identifier": "user-456"
            },
            "aggregates": {
                "total_feed_items": 50,
                "total_ads": 5
            },
            "feed_items": [
                {
                    "position_in_feed": i,
                    "is_ad": i < 5,
                    "content_text": {"caption": f"Post {i} content"},
                    "account": {"account_handle": f"user{i}"}
                }
                for i in range(50)
            ]
        }
        
        contribute_scan_to_aggregates(scan)
        
        # Verify bucket contents
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT platform, week_bucket, n_scans, n_items_total, n_ads_total
            FROM aggregate_buckets
        """)
        row = cursor.fetchone()
        conn.close()
        
        assert row is not None
        assert row["platform"] == "twitter"
        assert row["n_scans"] == 1
        assert row["n_items_total"] == 50
        assert row["n_ads_total"] == 5
        
        # Verify no scan_id or content in any column
        # (We can't directly check, but schema ensures it)

    def test_learned_priors_schema_no_identifiers(self, temp_db):
        """learned_priors table should not contain scan_id or user_id columns."""
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get table schema
        cursor.execute("PRAGMA table_info(learned_priors)")
        columns = [row[1] for row in cursor.fetchall()]
        conn.close()
        
        # Verify allowed columns only
        allowed_columns = {
            "platform", "alpha", "beta", "effective_n", "version",
            "last_updated", "source", "note"
        }
        
        assert set(columns) == allowed_columns
        assert "scan_id" not in columns
        assert "user_id" not in columns

    def test_no_content_fields_in_tables(self, temp_db):
        """Verify that content fields are not stored in aggregate tables."""
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check aggregate_buckets
        cursor.execute("PRAGMA table_info(aggregate_buckets)")
        agg_columns = [row[1] for row in cursor.fetchall()]
        
        # Check learned_priors
        cursor.execute("PRAGMA table_info(learned_priors)")
        prior_columns = [row[1] for row in cursor.fetchall()]
        
        conn.close()
        
        # Content-related field names that should not appear
        forbidden_patterns = [
            "content", "caption", "text", "image", "video", "url",
            "handle", "username", "account", "user", "identifier"
        ]
        
        all_columns = agg_columns + prior_columns
        
        for col in all_columns:
            col_lower = col.lower()
            for pattern in forbidden_patterns:
                assert pattern not in col_lower, f"Column '{col}' contains forbidden pattern '{pattern}'"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

