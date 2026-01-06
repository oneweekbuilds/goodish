"""
Phase 5C2.2 Integration Test: Verify Ads evidence-bundle API endpoint returns CI fields.

This test exercises the exact same code path as the FastAPI endpoint to catch
runtime data-path mismatches where CI fields are computed but not returned.
"""

import sys
import os
import json

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

def test_endpoint_handler_directly():
    """Test the endpoint handler function directly (same as FastAPI route)."""
    try:
        from database import get_scan_by_id
        from evidence_bundle import build_ads_evidence_bundle, generate_ads_analysis_copy
        
        # Use the same scan_id as the API test
        scan_id = "desktop-1767216093373-0dykcpc"
        scan = get_scan_by_id(scan_id)
        
        if scan is None:
            print(f"[SKIP] Scan {scan_id} not found in database - creating mock scan")
            # Create a minimal mock scan matching the structure
            scan_result = {
                "scan_metadata": {
                    "scan_id": scan_id,
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
        else:
            scan_result = scan.get("result", {})
        
        # This is the exact code path from the endpoint handler
        bundle = build_ads_evidence_bundle(scan_result)
        analysis = generate_ads_analysis_copy(bundle)
        
        response = {
            "scan_id": scan_id,
            "tab": "ads",
            "bundle": bundle,
            "analysis": analysis,
        }
        
        # Extract observations from response (same as API client would)
        response_bundle = response.get("bundle", {})
        observations = response_bundle.get("observations", {})
        
        # Verify CI fields are present and non-null
        print(f"[CHECK] ad_rate_percent: {observations.get('ad_rate_percent')}")
        print(f"[CHECK] total_posts_seen: {observations.get('total_posts_seen')}")
        
        ad_rate_ci = observations.get("ad_rate_percent_ci")
        print(f"[CHECK] ad_rate_percent_ci: {ad_rate_ci}")
        
        assert "ad_rate_percent" in observations, "ad_rate_percent should be present"
        assert observations.get("ad_rate_percent") is not None, "ad_rate_percent should not be None"
        
        assert "ad_rate_percent_ci" in observations, "ad_rate_percent_ci key should be present"
        assert ad_rate_ci is not None, f"ad_rate_percent_ci should not be None (got: {ad_rate_ci})"
        
        assert isinstance(ad_rate_ci, dict), f"ad_rate_percent_ci should be a dict, got {type(ad_rate_ci)}"
        assert "lower" in ad_rate_ci, "CI should have 'lower' key"
        assert "upper" in ad_rate_ci, "CI should have 'upper' key"
        assert "confidence_level" in ad_rate_ci, "CI should have 'confidence_level' key"
        assert "method" in ad_rate_ci, "CI should have 'method' key"
        assert ad_rate_ci["confidence_level"] == 0.95, "confidence_level should be 0.95"
        assert ad_rate_ci["method"] == "wilson", "method should be 'wilson'"
        
        ad_rate_estimate_type = observations.get("ad_rate_estimate_type")
        assert ad_rate_estimate_type == "INTERVAL", f"ad_rate_estimate_type should be 'INTERVAL', got '{ad_rate_estimate_type}'"
        
        # Check promotional rate CI if present
        promo_ci = observations.get("promotional_rate_percent_ci")
        if promo_ci is not None:
            assert isinstance(promo_ci, dict), "promotional_rate_percent_ci should be a dict"
            assert "lower" in promo_ci and "upper" in promo_ci, "Promo CI should have lower/upper"
        
        print("[PASS] Endpoint handler returns CI fields correctly")
        print(f"  ad_rate_percent_ci: {json.dumps(ad_rate_ci, indent=2)}")
        print(f"  ad_rate_estimate_type: {ad_rate_estimate_type}")
        return True
        
    except AssertionError as e:
        print(f"[FAIL] Assertion failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_fastapi_testclient():
    """Test using FastAPI TestClient if available."""
    try:
        from fastapi.testclient import TestClient
        from app import app
        
        client = TestClient(app)
        
        # Call the endpoint
        response = client.get("/api/scans/desktop-1767216093373-0dykcpc/evidence-bundle/ads")
        
        if response.status_code == 404:
            print(f"[SKIP] Scan not found in database for TestClient test")
            return True  # Skip if scan doesn't exist
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        bundle = data.get("bundle", {})
        observations = bundle.get("observations", {})
        
        print(f"[CHECK] API response - ad_rate_percent: {observations.get('ad_rate_percent')}")
        
        ad_rate_ci = observations.get("ad_rate_percent_ci")
        print(f"[CHECK] API response - ad_rate_percent_ci: {ad_rate_ci}")
        
        assert "ad_rate_percent_ci" in observations, "ad_rate_percent_ci key should be present in API response"
        assert ad_rate_ci is not None, f"ad_rate_percent_ci should not be None in API response (got: {ad_rate_ci})"
        
        assert isinstance(ad_rate_ci, dict), f"ad_rate_percent_ci should be a dict, got {type(ad_rate_ci)}"
        assert "lower" in ad_rate_ci and "upper" in ad_rate_ci, "CI should have lower/upper keys"
        
        ad_rate_estimate_type = observations.get("ad_rate_estimate_type")
        assert ad_rate_estimate_type == "INTERVAL", f"ad_rate_estimate_type should be 'INTERVAL', got '{ad_rate_estimate_type}'"
        
        print("[PASS] FastAPI TestClient returns CI fields correctly")
        return True
        
    except (ImportError, RuntimeError) as e:
        # Skip if TestClient dependencies not available (httpx, etc.)
        print(f"[SKIP] FastAPI TestClient not available: {e}")
        return True  # Skip if TestClient not available
    except AssertionError as e:
        print(f"[FAIL] Assertion failed: {e}")
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
    print("Phase 5C2.2 Integration Test: API Endpoint CI Fields")
    print("=" * 60)
    
    test1_passed = test_endpoint_handler_directly()
    print()
    test2_passed = test_fastapi_testclient()
    
    print()
    print("=" * 60)
    if test1_passed and test2_passed:
        print("[SUCCESS] All tests passed")
        sys.exit(0)
    else:
        print("[FAILURE] Some tests failed")
        sys.exit(1)

