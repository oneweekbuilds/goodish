"""
Phase 5C3.1: Regression test for evidence bundle Phase 5C3 fields.

This test verifies that Phase 5C3 fields are present in the evidence bundle
and that prior activation logic works correctly.

This test would have failed before the import fix due to NameError.
"""

import sys
import os

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

from evidence_bundle import build_ads_evidence_bundle
from accuracy.stats import wilson_ci_percent


def test_phase5c3_fields_present():
    """
    Test that Phase 5C3 fields are present in evidence bundle.
    
    Uses Twitter platform with n=41, k=2 (similar to real scan).
    Expected: prior_used=True, estimate_method="bayesian_beta" since
    n=41 < 100 and wilson_width > 10%.
    """
    scan_result = {
        "scan_metadata": {
            "scan_id": "test-phase5c3-fields",
            "platform": "twitter",
            "created_at": "2024-01-01T12:00:00Z"
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
                "account": {"account_handle": f"user{i}"}
            }
            for i in range(41)
        ]
    }
    
    # Build evidence bundle
    bundle = build_ads_evidence_bundle(scan_result)
    observations = bundle.get("observations", {})
    
    # Basic fields should exist
    assert observations.get("ad_rate_percent") is not None, "ad_rate_percent should be present"
    assert observations.get("total_posts_seen") == 41, "total_posts_seen should be 41"
    assert observations.get("total_ads_detected") == 2, "total_ads_detected should be 2"
    
    # Wilson CI should exist
    wilson_ci = observations.get("ad_rate_percent_ci")
    assert wilson_ci is not None, "ad_rate_percent_ci (wilson) should be present"
    assert wilson_ci.get("method") == "wilson", "Wilson CI method should be 'wilson'"
    
    # Phase 5C3 fields should exist
    bayesian_ci = observations.get("ad_rate_percent_ci_bayesian")
    assert bayesian_ci is not None, "ad_rate_percent_ci_bayesian should be present"
    
    bayesian_point = observations.get("ad_rate_percent_bayesian")
    assert bayesian_point is not None, "ad_rate_percent_bayesian should be present"
    
    estimate_method = observations.get("ad_rate_estimate_method")
    assert estimate_method is not None, "ad_rate_estimate_method should be present"
    assert estimate_method in {"wilson", "bayesian_beta"}, f"estimate_method should be 'wilson' or 'bayesian_beta', got '{estimate_method}'"
    
    prior_used = observations.get("prior_used")
    assert isinstance(prior_used, bool), f"prior_used should be a bool, got {type(prior_used)}"
    
    # Verify activation logic for this case
    n = observations.get("total_posts_seen", 0)
    wilson_lower = wilson_ci.get("lower", 0)
    wilson_upper = wilson_ci.get("upper", 0)
    wilson_width = wilson_upper - wilson_lower
    
    # For n=41 and wilson_width > 10%, prior should activate
    assert n == 41, f"Expected n=41, got {n}"
    assert wilson_width > 10.0, f"Expected wilson_width > 10%, got {wilson_width:.1f}%"
    
    # Prior should be used
    assert prior_used == True, f"Expected prior_used=True for n={n} and wilson_width={wilson_width:.1f}%, got {prior_used}"
    assert estimate_method == "bayesian_beta", f"Expected estimate_method='bayesian_beta' when prior_used=True, got '{estimate_method}'"
    
    # Verify Bayesian CI structure
    assert "lower" in bayesian_ci, "Bayesian CI should have 'lower'"
    assert "upper" in bayesian_ci, "Bayesian CI should have 'upper'"
    assert "prior_info" in bayesian_ci, "Bayesian CI should have 'prior_info'"
    
    bayes_lower = bayesian_ci.get("lower", 0)
    bayes_upper = bayesian_ci.get("upper", 0)
    bayes_width = bayes_upper - bayes_lower
    
    assert bayes_width >= 5.0, f"Bayesian CI width should be >= 5%, got {bayes_width:.1f}%"
    
    # Verify prior_info
    prior_info = bayesian_ci.get("prior_info", {})
    assert prior_info.get("platform") == "twitter", "Prior info should have correct platform"
    assert prior_info.get("source") == "bootstrap", "Prior source should be 'bootstrap'"
    assert "alpha" in prior_info, "Prior info should have 'alpha'"
    assert "beta" in prior_info, "Prior info should have 'beta'"
    
    print(f"\n[PASS] Phase 5C3 fields present and correct")
    print(f"  n={n}, wilson_width={wilson_width:.1f}%")
    print(f"  prior_used={prior_used}, estimate_method={estimate_method}")
    print(f"  bayesian_ci=[{bayes_lower:.1f}%, {bayes_upper:.1f}%], width={bayes_width:.1f}%")


if __name__ == "__main__":
    test_phase5c3_fields_present()
    print("\n[SUCCESS] All Phase 5C3 field tests passed")

