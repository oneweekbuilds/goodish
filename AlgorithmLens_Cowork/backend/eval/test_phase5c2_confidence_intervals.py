"""
Phase 5C2 Regression Test: 95% Confidence Intervals for Ads Rate Estimates

This test verifies that:
1. Wilson CI computation is correct for various edge cases
2. Ads evidence bundle includes uncertainty_interval and estimate_type fields
3. CI bounds are reasonable (contain true proportion, handle edge cases)

Test Cases:
- k=0, n=10: CI.low ≈ 0.0, CI.high > 0
- k=10, n=10: CI.low < 1, CI.high ≈ 1.0
- k=3, n=20: CI contains 0.15 (15%)
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from accuracy.stats import wilson_ci, wilson_ci_percent
from evidence_bundle import build_ads_evidence_bundle


def test_wilson_ci_edge_cases():
    """Test Wilson CI computation for edge cases."""
    
    # Test 1: k=0, n=10 (no ads)
    lower, upper = wilson_ci(0, 10, conf=0.95)
    assert lower >= 0.0, f"Expected lower >= 0.0, got {lower}"
    assert lower <= 0.1, f"Expected lower <= 0.1 for k=0, n=10, got {lower}"
    assert upper > 0.0, f"Expected upper > 0.0, got {upper}"
    assert upper <= 1.0, f"Expected upper <= 1.0, got {upper}"
    print(f"PASS: k=0, n=10 -> CI=[{lower:.4f}, {upper:.4f}]")
    
    # Test 2: k=10, n=10 (all ads)
    lower, upper = wilson_ci(10, 10, conf=0.95)
    assert lower >= 0.0, f"Expected lower >= 0.0, got {lower}"
    assert lower < 1.0, f"Expected lower < 1.0 for k=10, n=10, got {lower}"
    assert upper <= 1.0, f"Expected upper <= 1.0, got {upper}"
    assert upper >= 0.9, f"Expected upper >= 0.9 for k=10, n=10, got {upper}"
    print(f"PASS: k=10, n=10 -> CI=[{lower:.4f}, {upper:.4f}]")
    
    # Test 3: k=3, n=20 (15% rate) - CI should contain 0.15
    true_prop = 3 / 20
    lower, upper = wilson_ci(3, 20, conf=0.95)
    assert lower <= true_prop <= upper, \
        f"Expected CI [{lower:.4f}, {upper:.4f}] to contain {true_prop:.4f}"
    print(f"PASS: k=3, n=20 -> CI=[{lower:.4f}, {upper:.4f}] contains {true_prop:.4f}")
    
    # Test 4: n=0 edge case
    lower, upper = wilson_ci(0, 0, conf=0.95)
    assert lower == 0.0, f"Expected lower=0.0 for n=0, got {lower}"
    assert upper == 1.0, f"Expected upper=1.0 for n=0, got {upper}"
    print(f"PASS: n=0 -> CI=[{lower:.4f}, {upper:.4f}] (full uncertainty)")
    
    # Test 5: Percent version (should multiply by 100)
    # Recompute CI for k=3, n=20 to get fresh values
    lower_prop, upper_prop = wilson_ci(3, 20, conf=0.95)
    lower_pct, upper_pct = wilson_ci_percent(3, 20, conf=0.95)
    assert abs(lower_pct - lower_prop * 100) < 0.01, \
        f"Percent version should be 100x proportion: {lower_pct} vs {lower_prop * 100}"
    assert abs(upper_pct - upper_prop * 100) < 0.01, \
        f"Percent version should be 100x proportion: {upper_pct} vs {upper_prop * 100}"
    print(f"PASS: wilson_ci_percent correctly multiplies by 100")
    
    return True


def test_ads_bundle_ci_fields():
    """Test that Ads evidence bundle includes CI fields."""
    
    # Create synthetic scan with ads
    feed_items = []
    for i in range(20):
        is_ad = i < 3  # 3 ads out of 20 (15%)
        feed_items.append({
            "position_in_feed": i,
            "is_ad": is_ad,
            "ad_metadata": {
                "ad_detected_reason": "platform_label" if is_ad else None
            } if is_ad else {},
            "content_text": {
                "captions": [],
                "hashtags": [],
                "on_screen_labels": []
            },
            "account": {
                "account_handle": f"@user{i}"
            }
        })
    
    scan_result = {
        "scan_metadata": {
            "scan_id": "test_scan_5c2",
            "platform": "TIKTOK",
            "source_type": "DESKTOP_EXTENSION"
        },
        "aggregates": {
            "total_feed_items": 20,
            "total_ads": 3,
            "ad_percentage": 15.0
        },
        "feed_items": feed_items
    }
    
    bundle = build_ads_evidence_bundle(scan_result)
    observations = bundle.get("observations", {})
    
    # Check ad_rate_percent exists (backwards compatibility)
    assert "ad_rate_percent" in observations, \
        "Expected ad_rate_percent field for backwards compatibility"
    assert observations["ad_rate_percent"] == 15.0, \
        f"Expected ad_rate_percent=15.0, got {observations['ad_rate_percent']}"
    
    # Check CI fields exist
    assert "ad_rate_percent_ci" in observations, \
        "Expected ad_rate_percent_ci field"
    assert observations["ad_rate_percent_ci"] is not None, \
        "ad_rate_percent_ci should not be None when n_items > 0"
    
    ci = observations["ad_rate_percent_ci"]
    assert "lower" in ci, "CI should have 'lower' field"
    assert "upper" in ci, "CI should have 'upper' field"
    assert ci["confidence_level"] == 0.95, \
        f"Expected confidence_level=0.95, got {ci['confidence_level']}"
    assert ci["method"] == "wilson", \
        f"Expected method='wilson', got {ci['method']}"
    
    # Check CI bounds are reasonable
    assert ci["lower"] <= 15.0 <= ci["upper"], \
        f"Expected CI [{ci['lower']}, {ci['upper']}] to contain 15.0"
    assert ci["lower"] >= 0.0, f"CI lower bound should be >= 0, got {ci['lower']}"
    assert ci["upper"] <= 100.0, f"CI upper bound should be <= 100, got {ci['upper']}"
    
    # Check estimate_type field
    assert "ad_rate_estimate_type" in observations, \
        "Expected ad_rate_estimate_type field"
    assert observations["ad_rate_estimate_type"] == "INTERVAL", \
        f"Expected estimate_type='INTERVAL', got {observations['ad_rate_estimate_type']}"
    
    # Check promotional rate CI (should also exist)
    assert "promotional_rate_percent_ci" in observations, \
        "Expected promotional_rate_percent_ci field"
    
    print(f"PASS: Ads bundle includes CI fields: ad_rate_percent_ci={ci}")
    return True


if __name__ == "__main__":
    try:
        test_wilson_ci_edge_cases()
        test_ads_bundle_ci_fields()
        print("\n[PASS] Phase 5C2 tests PASSED")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] Phase 5C2 test FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Phase 5C2 test ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

