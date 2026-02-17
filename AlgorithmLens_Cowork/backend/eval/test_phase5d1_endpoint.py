"""
Phase 5D1.1: Test that Ads evidence bundle endpoint returns 200.
"""

import sys
import os
from datetime import datetime

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

from database import _internal_get_scan_by_id
from evidence_bundle import build_ads_evidence_bundle


def test_build_ads_evidence_bundle_no_crash():
    """Test that build_ads_evidence_bundle doesn't crash with real scan data."""
    # Use a known scan ID or create minimal test data
    scan_id = "desktop-1767216093373-0dykcpc"
    scan = _internal_get_scan_by_id(scan_id)
    
    if not scan:
        # Fall back to mock data if scan not found
        scan_result = {
            "scan_metadata": {
                "scan_id": "test-endpoint",
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
                    "is_ad": (i < 2),
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
    else:
        scan_result = scan.get("result", {})
    
    # This should not raise an exception
    try:
        bundle = build_ads_evidence_bundle(scan_result)
        assert "evidence_items" in bundle, "Bundle should have evidence_items"
        assert "insights" in bundle, "Bundle should have insights"
        assert "evidence_chain_metrics" in bundle, "Bundle should have evidence_chain_metrics"
        print("[PASS] build_ads_evidence_bundle completed without errors")
        return True
    except Exception as e:
        print(f"[FAIL] build_ads_evidence_bundle raised exception: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_build_ads_evidence_bundle_no_crash()
    sys.exit(0 if success else 1)

