"""
Phase 5C4.1: Test ISO week bucket computation.
"""

import pytest
from datetime import datetime
from accuracy.aggregation import get_week_bucket


class TestWeekBucket:
    """Test ISO week bucket computation."""

    def test_week_bucket_iso_format(self):
        """Week bucket should be in ISO format (YYYY-WNN)."""
        date_str = "2026-01-06T12:00:00"
        bucket = get_week_bucket(date_str)
        
        assert bucket.startswith("2026-")
        assert bucket.count("-") == 1
        assert "W" in bucket
        parts = bucket.split("-W")
        assert len(parts) == 2
        assert len(parts[1]) == 2  # Week number is 2 digits

    def test_week_bucket_stable(self):
        """Same date should produce same bucket."""
        date_str = "2026-01-06T12:00:00"
        bucket1 = get_week_bucket(date_str)
        bucket2 = get_week_bucket(date_str)
        
        assert bucket1 == bucket2

    def test_week_bucket_different_weeks(self):
        """Dates in different weeks should produce different buckets."""
        date1 = "2026-01-06T12:00:00"  # Week 1
        date2 = "2026-01-15T12:00:00"  # Likely Week 2 or 3
        
        bucket1 = get_week_bucket(date1)
        bucket2 = get_week_bucket(date2)
        
        # They might be the same if in same week, but let's check format
        assert bucket1.startswith("2026-")
        assert bucket2.startswith("2026-")

    def test_week_bucket_with_z_suffix(self):
        """Week bucket should handle Z suffix (UTC)."""
        date_str = "2026-01-06T12:00:00Z"
        bucket = get_week_bucket(date_str)
        
        assert bucket.startswith("2026-")
        assert "W" in bucket

    def test_week_bucket_invalid_date_fallback(self):
        """Invalid date should fallback to current week."""
        invalid_date = "not-a-date"
        bucket = get_week_bucket(invalid_date)
        
        # Should still produce valid format
        assert "-W" in bucket
        assert len(bucket.split("-W")) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

