"""
Minimal regression test for Phase 5C1: Method-aware HIGH confidence for platform-labeled ads.

This test verifies that:
1. Platform-labeled ads get HIGH confidence with PLATFORM_LABEL method
2. Evidence items include method_reliability = 0.999 for PLATFORM_LABEL
3. Single-method HIGH confidence is allowed for PLATFORM_LABEL

Run from backend/ directory:
    python -m eval.test_phase5c1_platform_label
"""

import sys
import os

# Add parent directory to path so we can import backend modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from commercial_classifier import classify_feed_item, DetectionMethod, CommercialConfidence, CommercialClass
from evidence_bundle import build_ads_evidence_bundle
from accuracy.method_reliability import get_method_reliability, can_yield_high_alone


def test_platform_labeled_ad_classification():
    """Test that platform-labeled ads get HIGH confidence with PLATFORM_LABEL method."""
    # Create a minimal feed item with platform label
    feed_item = {
        "is_ad": True,
        "position_in_feed": 0,
        "ad_metadata": {
            "ad_detected_reason": "platform_label",
            "sponsored_label_text": "Sponsored",
            "advertiser_name": "TestBrand",
        },
        "content_text": {
            "captions": [],
            "hashtags": [],
            "on_screen_labels": [],
        },
    }

    # Classify the item
    classification = classify_feed_item(feed_item)

    # Verify HIGH confidence
    assert classification.confidence == CommercialConfidence.HIGH, \
        f"Expected HIGH confidence, got {classification.confidence}"

    # Verify LABELED_AD class
    assert classification.commercial_class == CommercialClass.LABELED_AD, \
        f"Expected LABELED_AD, got {classification.commercial_class}"

    # Verify PLATFORM_LABEL method is present
    assert DetectionMethod.PLATFORM_LABEL in classification.detection_methods, \
        f"Expected PLATFORM_LABEL in methods, got {classification.detection_methods}"

    # Verify single method can yield HIGH (Phase 5C1 requirement)
    assert len(classification.detection_methods) == 1, \
        f"Expected single method for platform label, got {len(classification.detection_methods)}"

    print("[PASS] Platform-labeled ad classification")


def test_method_reliability_constants():
    """Test method reliability constants."""
    reliability = get_method_reliability("PLATFORM_LABEL")
    assert reliability == 0.999, f"Expected 0.999, got {reliability}"

    can_high = can_yield_high_alone("PLATFORM_LABEL")
    assert can_high is True, f"Expected PLATFORM_LABEL can yield HIGH alone"

    print("[PASS] Method reliability constants")


def test_evidence_bundle_method_reliability():
    """Test that evidence bundle attaches method_reliability for platform-labeled ads."""
    # Create minimal scan result with one platform-labeled ad
    scan_result = {
        "scan_metadata": {
            "scan_id": "test_scan_001",
            "platform": "TIKTOK",
            "source_type": "DESKTOP_EXTENSION",
        },
        "aggregates": {
            "total_feed_items": 1,
            "total_ads": 1,
            "ad_percentage": 100.0,
        },
        "feed_items": [
            {
                "is_ad": True,
                "position_in_feed": 0,
                "ad_metadata": {
                    "ad_detected_reason": "platform_label",
                    "sponsored_label_text": "Sponsored",
                    "advertiser_name": "TestBrand",
                },
                "content_text": {
                    "captions": [],
                    "hashtags": [],
                    "on_screen_labels": [],
                },
            },
        ],
    }

    # Build evidence bundle
    bundle = build_ads_evidence_bundle(scan_result)

    # Check that platform_labeled_ad_evidence exists
    observations = bundle.get("observations", {})
    assert "platform_labeled_ad_evidence" in observations, \
        "Expected platform_labeled_ad_evidence in observations"

    evidence_list = observations["platform_labeled_ad_evidence"]
    assert len(evidence_list) > 0, "Expected at least one evidence item"

    # Check first evidence item has method_reliability
    first_evidence = evidence_list[0]
    assert "method" in first_evidence, "Expected 'method' in evidence item"
    assert "method_reliability" in first_evidence, "Expected 'method_reliability' in evidence item"
    assert first_evidence["method"] == "PLATFORM_LABEL", \
        f"Expected PLATFORM_LABEL method, got {first_evidence['method']}"
    assert first_evidence["method_reliability"] == 0.999, \
        f"Expected 0.999 reliability, got {first_evidence['method_reliability']}"

    print("[PASS] Evidence bundle method_reliability attachment")


def main():
    """Run all Phase 5C1 regression tests."""
    print("Running Phase 5C1 regression tests...\n")

    try:
        test_method_reliability_constants()
        test_platform_labeled_ad_classification()
        test_evidence_bundle_method_reliability()

        print("\n[SUCCESS] All Phase 5C1 tests PASSED")
        return 0
    except AssertionError as e:
        print(f"\n[FAIL] Test FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

