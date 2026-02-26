"""
Phase 5C4.1: Test that learned priors override bootstrap priors.
"""

import pytest
import sqlite3
import os
import tempfile
from datetime import datetime
from accuracy.priors import get_ads_rate_prior
from database import get_connection, init_database, DB_PATH


class TestPriorSelection:
    """Test prior selection logic (learned vs bootstrap)."""

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

    def test_bootstrap_prior_when_no_learned(self, temp_db):
        """Should return bootstrap prior when no learned prior exists."""
        alpha, beta, source = get_ads_rate_prior("twitter")
        
        assert source == "bootstrap"
        assert alpha == 2.0
        assert beta == 18.0

    def test_learned_prior_overrides_bootstrap(self, temp_db):
        """Should return learned prior when it exists."""
        conn = get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO learned_priors
            (platform, alpha, beta, effective_n, version, last_updated, source, note)
            VALUES (?, 5.0, 95.0, 100.0, 'learned_v1', ?, 'learned', 'test')
        """, ("twitter", now))
        
        conn.commit()
        conn.close()
        
        alpha, beta, source = get_ads_rate_prior("twitter")
        
        assert source == "learned"
        assert alpha == 5.0
        assert beta == 95.0

    def test_learned_prior_platform_specific(self, temp_db):
        """Learned prior should only affect the specific platform."""
        conn = get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO learned_priors
            (platform, alpha, beta, effective_n, version, last_updated, source, note)
            VALUES (?, 5.0, 95.0, 100.0, 'learned_v1', ?, 'learned', 'test')
        """, ("twitter", now))
        
        conn.commit()
        conn.close()
        
        # Twitter should use learned
        alpha_tw, beta_tw, source_tw = get_ads_rate_prior("twitter")
        assert source_tw == "learned"
        
        # TikTok should use bootstrap
        alpha_tk, beta_tk, source_tk = get_ads_rate_prior("tiktok")
        assert source_tk == "bootstrap"
        assert alpha_tk == 2.0
        assert beta_tk == 18.0

    def test_case_insensitive_platform(self, temp_db):
        """Platform matching should be case-insensitive."""
        conn = get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO learned_priors
            (platform, alpha, beta, effective_n, version, last_updated, source, note)
            VALUES (?, 5.0, 95.0, 100.0, 'learned_v1', ?, 'learned', 'test')
        """, ("twitter", now))
        
        conn.commit()
        conn.close()
        
        # Test with uppercase
        alpha1, beta1, source1 = get_ads_rate_prior("TWITTER")
        assert source1 == "learned"
        
        # Test with mixed case
        alpha2, beta2, source2 = get_ads_rate_prior("Twitter")
        assert source2 == "learned"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

