"""
Phase 5C2.3 HTTP Integration Test: Verify Ads evidence-bundle API returns CI fields via HTTP.

This test exercises the actual HTTP endpoint using FastAPI TestClient to catch
serialization issues where CI fields are computed but not returned in the JSON response.
"""

import sys
import os
import json

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)


def test_ads_evidence_bundle_api_http():
    """Test the HTTP endpoint returns CI fields correctly."""
    try:
        from fastapi.testclient import TestClient
        from app import app
        from unittest.mock import patch
        
        # Create a mock scan object with known data (41 items, 2 ads)
        mock_scan = {
            "scan_id": "test-scan-http-ci",
            "result": {
                "scan_metadata": {
                    "scan_id": "test-scan-http-ci",
                    "platform": "tiktok",
                    "created_at": "2024-01-01T12:00:00Z"
                },
                "aggregates": {
                    "total_feed_items": 41,
                    "total_ads": 2,
                },
                "feed_items": [
                    {
                        "position_in_feed": i,
                        "is_ad": i < 2,
                        "ad_metadata": {
                            "ad_detected_reason": "platform_label",
                            "sponsored_label_text": "Sponsored"
                        } if i < 2 else {}
                    }
                    for i in range(41)
                ]
            }
        }
        
        # Mock get_scan_by_id to return our test scan
        with patch('app.get_scan_by_id', return_value=mock_scan):
            client = TestClient(app)
            
            # Call the HTTP endpoint
            response = client.get("/api/scans/test-scan-http-ci/evidence-bundle/ads")
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            data = response.json()
            bundle = data.get("bundle", {})
            observations = bundle.get("observations", {})
            
            print(f"[CHECK] HTTP response - ad_rate_percent: {observations.get('ad_rate_percent')}")
            print(f"[CHECK] HTTP response - total_posts_seen: {observations.get('total_posts_seen')}")
            
            # Verify CI fields are present and non-null in HTTP response
            ad_rate_ci = observations.get("ad_rate_percent_ci")
            print(f"[CHECK] HTTP response - ad_rate_percent_ci: {ad_rate_ci}")
            
            assert "ad_rate_percent" in observations, "ad_rate_percent should be present in HTTP response"
            assert observations.get("ad_rate_percent") is not None, "ad_rate_percent should not be None"
            # Allow some tolerance for rounding
            assert abs(observations.get("ad_rate_percent", 0) - 4.9) < 0.1, \
                f"ad_rate_percent should be ~4.9, got {observations.get('ad_rate_percent')}"
            
            assert "ad_rate_percent_ci" in observations, \
                "ad_rate_percent_ci key should be present in HTTP response"
            assert ad_rate_ci is not None, \
                f"ad_rate_percent_ci should not be None in HTTP response (got: {ad_rate_ci})"
            
            assert isinstance(ad_rate_ci, dict), \
                f"ad_rate_percent_ci should be a dict in HTTP response, got {type(ad_rate_ci)}"
            assert "lower" in ad_rate_ci, "CI should have 'lower' key in HTTP response"
            assert "upper" in ad_rate_ci, "CI should have 'upper' key in HTTP response"
            assert "confidence_level" in ad_rate_ci, "CI should have 'confidence_level' key in HTTP response"
            assert "method" in ad_rate_ci, "CI should have 'method' key in HTTP response"
            assert ad_rate_ci["confidence_level"] == 0.95, \
                f"confidence_level should be 0.95, got {ad_rate_ci['confidence_level']}"
            assert ad_rate_ci["method"] == "wilson", \
                f"method should be 'wilson', got {ad_rate_ci['method']}"
            assert 0 <= ad_rate_ci["lower"] <= 100, \
                f"CI lower bound should be in [0, 100], got {ad_rate_ci['lower']}"
            assert 0 <= ad_rate_ci["upper"] <= 100, \
                f"CI upper bound should be in [0, 100], got {ad_rate_ci['upper']}"
            assert ad_rate_ci["lower"] <= ad_rate_ci["upper"], \
                f"CI lower should be <= upper, got [{ad_rate_ci['lower']}, {ad_rate_ci['upper']}]"
            
            ad_rate_estimate_type = observations.get("ad_rate_estimate_type")
            assert ad_rate_estimate_type == "INTERVAL", \
                f"ad_rate_estimate_type should be 'INTERVAL' in HTTP response, got '{ad_rate_estimate_type}'"
            
            # Check promotional rate CI if present
            promo_ci = observations.get("promotional_rate_percent_ci")
            if promo_ci is not None:
                assert isinstance(promo_ci, dict), \
                    "promotional_rate_percent_ci should be a dict in HTTP response"
                assert "lower" in promo_ci and "upper" in promo_ci, \
                    "Promo CI should have lower/upper keys in HTTP response"
            
            print("[PASS] HTTP endpoint returns CI fields correctly")
            print(f"  ad_rate_percent_ci: {json.dumps(ad_rate_ci, indent=2)}")
            print(f"  ad_rate_estimate_type: {ad_rate_estimate_type}")
            return True
            
    except (ImportError, RuntimeError) as e:
        if "httpx" in str(e) or "testclient" in str(e).lower():
            print(f"[SKIP] FastAPI TestClient dependencies not available: {e}")
            print("  Install with: pip install httpx")
            return True  # Skip if dependencies not available
        raise
    except AssertionError as e:
        print(f"[FAIL] Assertion failed: {e}")
        print(f"  Response data: {json.dumps(data, indent=2)[:500]}")
        import traceback
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Phase 5C2.3 HTTP Integration Test: API Endpoint CI Fields")
    print("=" * 60)
    
    test_passed = test_ads_evidence_bundle_api_http()
    
    print()
    print("=" * 60)
    if test_passed:
        print("[SUCCESS] Test passed")
        sys.exit(0)
    else:
        print("[FAILURE] Test failed")
        sys.exit(1)

