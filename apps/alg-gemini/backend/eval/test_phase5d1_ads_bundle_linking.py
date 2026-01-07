"""
Phase 5D1: Test evidence chain linking in Ads evidence bundle.
"""

import pytest
import sys
import os
from datetime import datetime

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

from evidence_bundle import build_ads_evidence_bundle


# Mock scan data for Twitter, n=41, k=2
MOCK_SCAN_TWITTER = {
    "scan_metadata": {
        "scan_id": "test-twitter-phase5d1",
        "platform": "twitter",
        "created_at": datetime.now().isoformat(),
        "source_type": "DESKTOP_EXTENSION"
    },
    "aggregates": {
        "total_feed_items": 41,
        "total_ads": 2,
    },
    "feed_items": [
        {
            "position_in_feed": i,
            "is_ad": (i < 2),  # First 2 are ads
            "content_text": {"caption": f"Post {i}"},
            "account": {"account_handle": f"user{i}"},
            "ad_metadata": {
                "ad_detected_reason": "platform_label",
                "sponsored_label_text": "Promoted" if i < 2 else None
            } if i < 2 else {}
        }
        for i in range(41)
    ]
}


class TestAdsBundleLinking:
    """Test that Ads evidence bundle has proper evidence chain linking."""
    
    def test_final_insights_have_evidence_ids(self):
        """All FINAL insights should have evidence_ids."""
        bundle = build_ads_evidence_bundle(MOCK_SCAN_TWITTER)
        insights = bundle.get("insights", [])
        
        final_insights = [insight for insight in insights if insight.get("claim_status") == "FINAL"]
        
        for insight in final_insights:
            evidence_ids = insight.get("evidence_ids", [])
            assert len(evidence_ids) >= 1, f"FINAL insight {insight.get('insight_id')} has no evidence_ids"
    
    def test_all_evidence_ids_resolve(self):
        """All evidence_ids in insights should resolve to evidence_items."""
        bundle = build_ads_evidence_bundle(MOCK_SCAN_TWITTER)
        insights = bundle.get("insights", [])
        evidence_items = bundle.get("evidence_items", {})
        
        evidence_item_ids = set(evidence_items.keys())
        
        for insight in insights:
            evidence_ids = insight.get("evidence_ids", [])
            for ev_id in evidence_ids:
                assert ev_id in evidence_item_ids, f"Evidence ID {ev_id} not found in evidence_items"
    
    def test_missing_evidence_rate_zero(self):
        """missing_evidence_rate should be 0.0 after enforcement."""
        bundle = build_ads_evidence_bundle(MOCK_SCAN_TWITTER)
        metrics = bundle.get("evidence_chain_metrics", {})
        
        missing_rate = metrics.get("missing_evidence_rate", 1.0)
        assert missing_rate == 0.0, f"missing_evidence_rate should be 0.0, got {missing_rate}"
    
    def test_orphan_evidence_rate_acceptable(self):
        """orphan_evidence_rate should be <= 0.20 (20%)."""
        bundle = build_ads_evidence_bundle(MOCK_SCAN_TWITTER)
        metrics = bundle.get("evidence_chain_metrics", {})
        
        orphan_rate = metrics.get("orphan_evidence_rate", 1.0)
        assert orphan_rate <= 0.20, f"orphan_evidence_rate should be <= 0.20, got {orphan_rate}"
    
    def test_evidence_items_have_required_fields(self):
        """Evidence items should have required fields: evidence_id, source."""
        bundle = build_ads_evidence_bundle(MOCK_SCAN_TWITTER)
        evidence_items = bundle.get("evidence_items", {})
        
        for ev_id, ev_item in evidence_items.items():
            assert "evidence_id" in ev_item, f"Evidence item {ev_id} missing evidence_id"
            assert "source" in ev_item, f"Evidence item {ev_id} missing source"
            assert ev_item["evidence_id"] == ev_id, f"Evidence item ID mismatch"
    
    def test_aggregate_insight_has_evidence(self):
        """Aggregate ad rate insight should have evidence_ids."""
        bundle = build_ads_evidence_bundle(MOCK_SCAN_TWITTER)
        insights = bundle.get("insights", [])
        
        # Find ad rate insight
        ad_rate_insights = [
            insight for insight in insights
            if "ad rate" in insight.get("claim_text", "").lower() or
               insight.get("insight_id") == "ads-commercial-spectrum"
        ]
        
        if ad_rate_insights:
            insight = ad_rate_insights[0]
            evidence_ids = insight.get("evidence_ids", [])
            assert len(evidence_ids) >= 1, "Ad rate insight should have evidence_ids"
            
            # Verify evidence_ids resolve
            evidence_items = bundle.get("evidence_items", {})
            for ev_id in evidence_ids:
                assert ev_id in evidence_items, f"Evidence ID {ev_id} not found"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

