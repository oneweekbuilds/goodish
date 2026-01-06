"""
Phase 5C1 Regression Test: Platform-Labeled Ads → HIGH Confidence

This test verifies that platform-labeled ads (PLATFORM_LABEL method) yield
HIGH confidence even with a single method, per accuracy-architecture-v3.1.md.

Test Input:
- Synthetic scan with 1 platform-labeled ad (is_ad=True)

Expected Output:
- Evidence bundle includes platform_labeled_ad_evidence with:
  - method = "PLATFORM_LABEL"
  - method_reliability = 0.999
  - confidence = "high"
- Commercial classification assigns HIGH confidence
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from evidence_bundle import build_ads_evidence_bundle
from commercial_classifier import classify_feed_item, CommercialClass, CommercialConfidence
from accuracy.method_reliability import get_method_reliability, can_yield_high_alone


def test_platform_label_high_confidence():
    """Test that platform-labeled ads yield HIGH confidence with single method."""
    
    # Create synthetic feed item with platform-labeled ad
    feed_item = {
        "position_in_feed": 0,
        "is_ad": True,
        "ad_metadata": {
            "ad_detected_reason": "platform_label",
            "sponsored_label_text": "Sponsored",
            "advertiser_name": "TestBrand"
        },
        "content_text": {
            "captions": [],
            "hashtags": [],
            "on_screen_labels": []
        },
        "account": {
            "account_handle": "@testbrand"
        }
    }
    
    # Test 1: Classification assigns HIGH confidence
    classification = classify_feed_item(feed_item)
    
    assert classification.commercial_class == CommercialClass.LABELED_AD, \
        f"Expected LABELED_AD, got {classification.commercial_class}"
    assert classification.confidence == CommercialConfidence.HIGH, \
        f"Expected HIGH confidence, got {classification.confidence}"
    assert len(classification.detection_methods) == 1, \
        f"Expected single method, got {len(classification.detection_methods)}"
    
    # Test 2: Method reliability is correct
    method_reliability = get_method_reliability("PLATFORM_LABEL")
    assert method_reliability == 0.999, \
        f"Expected PLATFORM_LABEL reliability 0.999, got {method_reliability}"
    
    # Test 3: Can yield HIGH alone
    assert can_yield_high_alone("PLATFORM_LABEL"), \
        "PLATFORM_LABEL should be able to yield HIGH confidence alone"
    
    # Test 4: Evidence bundle includes method_reliability
    scan_result = {
        "scan_metadata": {
            "scan_id": "test_scan_001",
            "platform": "TIKTOK",
            "source_type": "DESKTOP_EXTENSION"
        },
        "aggregates": {
            "total_feed_items": 1,
            "total_ads": 1,
            "ad_percentage": 100.0
        },
        "feed_items": [feed_item]
    }
    
    bundle = build_ads_evidence_bundle(scan_result)
    observations = bundle.get("observations", {})
    
    # Check platform_labeled_ad_evidence exists
    platform_evidence = observations.get("platform_labeled_ad_evidence", [])
    assert len(platform_evidence) > 0, \
        "Expected platform_labeled_ad_evidence in bundle"
    
    evidence_item = platform_evidence[0]
    assert evidence_item.get("method") == "PLATFORM_LABEL", \
        f"Expected method PLATFORM_LABEL, got {evidence_item.get('method')}"
    assert evidence_item.get("method_reliability") == 0.999, \
        f"Expected method_reliability 0.999, got {evidence_item.get('method_reliability')}"
    assert evidence_item.get("confidence") == "high", \
        f"Expected confidence 'high', got {evidence_item.get('confidence')}"
    
    print("PASS: Platform-labeled ads correctly yield HIGH confidence with single method")
    return True


if __name__ == "__main__":
    try:
        test_platform_label_high_confidence()
        print("\n[PASS] Phase 5C1 test PASSED")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] Phase 5C1 test FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Phase 5C1 test ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
