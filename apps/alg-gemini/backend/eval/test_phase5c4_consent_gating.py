"""
Phase 5C4.1: Test consent gating for aggregation contribution.
"""

import pytest
import sqlite3
import os
import sys
import tempfile
from datetime import datetime

# Add backend directory to path for imports
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

from accuracy.aggregation import (
    contribute_scan_to_aggregates,
    is_aggregation_enabled,
    get_week_bucket
)
import database


class TestConsentGating:
    """Test that aggregation only happens with proper consent."""

    @pytest.fixture
    def temp_db(self):
        """Create a temporary database for testing."""
        # Save original DB path
        original_path = database.DB_PATH
        
        # Create temp file
        fd, temp_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        
        # Temporarily override DB_PATH
        database.DB_PATH = temp_path
        
        # Initialize database
        database.init_database()
        
        yield temp_path
        
        # Restore original path
        database.DB_PATH = original_path
        
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)

    def test_global_disabled_no_contribution(self, temp_db):
        """With global flag false, no writes should occur."""
        # Ensure global is disabled (default)
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE aggregation_config SET value = 'false' WHERE key = 'AGGREGATE_COLLECTION_ENABLED'
        """)
        conn.commit()
        conn.close()
        
        assert not is_aggregation_enabled()
        
        scan = {
            "scan_metadata": {
                "scan_id": "test-1",
                "platform": "twitter",
                "created_at": datetime.now().isoformat(),
                "aggregate_consent": True
            },
            "aggregates": {
                "total_feed_items": 50,
                "total_ads": 5
            }
        }
        
        result = contribute_scan_to_aggregates(scan)
        assert result is False
        
        # Verify no bucket was created
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM aggregate_buckets")
        count = cursor.fetchone()["count"]
        conn.close()
        
        assert count == 0

    def test_global_enabled_but_no_consent_no_contribution(self, temp_db):
        """With global true but per-scan false, no writes should occur."""
        # Enable global
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE aggregation_config SET value = 'true' WHERE key = 'AGGREGATE_COLLECTION_ENABLED'
        """)
        conn.commit()
        conn.close()
        
        assert is_aggregation_enabled()
        
        scan = {
            "scan_metadata": {
                "scan_id": "test-2",
                "platform": "twitter",
                "created_at": datetime.now().isoformat(),
                "aggregate_consent": False  # No consent
            },
            "aggregates": {
                "total_feed_items": 50,
                "total_ads": 5
            }
        }
        
        result = contribute_scan_to_aggregates(scan)
        assert result is False
        
        # Verify no bucket was created
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM aggregate_buckets")
        count = cursor.fetchone()["count"]
        conn.close()
        
        assert count == 0

    def test_global_enabled_and_consent_contributes(self, temp_db):
        """With both true, writes should occur."""
        # Enable global
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE aggregation_config SET value = 'true' WHERE key = 'AGGREGATE_COLLECTION_ENABLED'
        """)
        conn.commit()
        conn.close()
        
        scan = {
            "scan_metadata": {
                "scan_id": "test-3",
                "platform": "twitter",
                "created_at": datetime.now().isoformat(),
                "aggregate_consent": True
            },
            "aggregates": {
                "total_feed_items": 50,
                "total_ads": 5
            }
        }
        
        result = contribute_scan_to_aggregates(scan)
        assert result is True
        
        # Verify bucket was created
        conn = database.get_connection()
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

    def test_consent_defaults_to_false(self, temp_db):
        """If aggregate_consent is missing, it should default to False."""
        # Enable global
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE aggregation_config SET value = 'true' WHERE key = 'AGGREGATE_COLLECTION_ENABLED'
        """)
        conn.commit()
        conn.close()
        
        scan = {
            "scan_metadata": {
                "scan_id": "test-4",
                "platform": "twitter",
                "created_at": datetime.now().isoformat()
                # No aggregate_consent field
            },
            "aggregates": {
                "total_feed_items": 50,
                "total_ads": 5
            }
        }
        
        result = contribute_scan_to_aggregates(scan)
        assert result is False
        
        # Verify no bucket was created
        conn = database.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM aggregate_buckets")
        count = cursor.fetchone()["count"]
        conn.close()
        
        assert count == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

