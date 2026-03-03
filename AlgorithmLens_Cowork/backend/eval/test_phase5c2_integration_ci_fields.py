"""
Phase 5C2.1 Integration Test: Verify CI fields are present in Ads evidence bundle API response.

This test reproduces the bug where CI fields were returning null even though
the code was present. It validates that:
1. The accuracy.stats module can be imported
2. build_ads_evidence_bundle() sets CI fields when n_items > 0
3. The CI fields have the correct structure
"""

import sys
import os

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

def test_import_accuracy_stats():
    """Test that accuracy.stats can be imported."""
    try:
        from accuracy.stats import wilson_ci_percent
        print("[PASS] accuracy.stats import successful")
        
        # Test the function works
        result = wilson_ci_percent(2, 41, conf=0.95)
        assert len(result) == 2, "wilson_ci_percent should return (lower, upper)"
        assert 0 <= result[0] <= 100, "Lower bound should be in [0, 100]"
        assert 0 <= result[1] <= 100, "Upper bound should be in [0, 100]"
        assert result[0] <= result[1], "Lower bound should be <= upper bound"
        print(f"[PASS] wilson_ci_percent(2, 41) = {result}")
        return True
    except ImportError as e:
        print(f"[FAIL] Import error: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Function error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_build_ads_bundle_ci_fields():
    """Test that build_ads_evidence_bundle sets CI fields correctly."""
    try:
        from evidence_bundle import build_ads_evidence_bundle
        
        # Create a minimal scan result matching the known scan structure
        # 41 items total, 2 ads detected
        feed_items = []
        for i in range(41):
            is_ad = i < 2  # First 2 items are ads
            item = {
                "position_in_feed": i,
                "is_ad": is_ad,
            }
            if is_ad:
                item["ad_metadata"] = {
                    "ad_detected_reason": "platform_label",
                    "sponsored_label_text": "Sponsored"
                }
            feed_items.append(item)
        
        scan_result = {
            "scan_metadata": {
                "scan_id": "test-scan-ci-integration",
                "platform": "tiktok",
                "created_at": "2024-01-01T12:00:00Z"
            },
            "aggregates": {
                "total_feed_items": 41,
                "total_ads": 2,
            },
            "feed_items": feed_items
        }
        
        # Build the evidence bundle
        bundle = build_ads_evidence_bundle(scan_result)
        observations = bundle.get("observations", {})
        
        # Verify CI fields are present and non-null
        assert "ad_rate_percent" in observations, "ad_rate_percent should be present"
        assert observations["ad_rate_percent"] is not None, "ad_rate_percent should not be None"
        
        assert "ad_rate_percent_ci" in observations, "ad_rate_percent_ci should be present"
        assert observations["ad_rate_percent_ci"] is not None, "ad_rate_percent_ci should not be None (bug fix)"
        
        ci = observations["ad_rate_percent_ci"]
        assert isinstance(ci, dict), "ad_rate_percent_ci should be a dict"
        assert "lower" in ci, "CI should have 'lower' key"
        assert "upper" in ci, "CI should have 'upper' key"
        assert "confidence_level" in ci, "CI should have 'confidence_level' key"
        assert "method" in ci, "CI should have 'method' key"
        assert ci["confidence_level"] == 0.95, "confidence_level should be 0.95"
        assert ci["method"] == "wilson", "method should be 'wilson'"
        assert 0 <= ci["lower"] <= 100, "CI lower bound should be in [0, 100]"
        assert 0 <= ci["upper"] <= 100, "CI upper bound should be in [0, 100]"
        assert ci["lower"] <= ci["upper"], "CI lower should be <= upper"
        
        assert "ad_rate_estimate_type" in observations, "ad_rate_estimate_type should be present"
        assert observations["ad_rate_estimate_type"] == "INTERVAL", "ad_rate_estimate_type should be 'INTERVAL'"
        
        # Check promotional rate CI fields
        assert "promotional_rate_percent_ci" in observations, "promotional_rate_percent_ci should be present"
        promo_ci = observations.get("promotional_rate_percent_ci")
        if promo_ci is not None:
            assert isinstance(promo_ci, dict), "promotional_rate_percent_ci should be a dict"
            assert "lower" in promo_ci and "upper" in promo_ci, "Promo CI should have lower/upper"
        
        print("[PASS] build_ads_evidence_bundle sets CI fields correctly")
        print(f"  ad_rate_percent: {observations['ad_rate_percent']}")
        print(f"  ad_rate_percent_ci: {observations['ad_rate_percent_ci']}")
        print(f"  ad_rate_estimate_type: {observations['ad_rate_estimate_type']}")
        return True
        
    except AssertionError as e:
        print(f"[FAIL] Assertion failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"[FAIL] Error building bundle: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Phase 5C2.1 Integration Test: CI Fields in Ads Bundle")
    print("=" * 60)
    
    test1_passed = test_import_accuracy_stats()
    print()
    test2_passed = test_build_ads_bundle_ci_fields()
    
    print()
    print("=" * 60)
    if test1_passed and test2_passed:
        print("[SUCCESS] All tests passed")
        sys.exit(0)
    else:
        print("[FAILURE] Some tests failed")
        sys.exit(1)

