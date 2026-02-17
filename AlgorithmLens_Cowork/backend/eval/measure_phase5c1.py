"""
Measurement hook for Phase 5C1: Count HIGH claims and evidence linking in Ads tab.

This script can be run on baseline vs new outputs to measure:
- Count of HIGH confidence claims in Ads tab
- Count of claims missing evidence_ids (should be 0%)

Usage:
    python -m eval.measure_phase5c1 <path_to_evidence_bundle.json>

Or import and use programmatically:
    from eval.measure_phase5c1 import measure_ads_bundle
    metrics = measure_ads_bundle(bundle_dict)
"""

import json
import sys
from typing import Dict, Any, Optional


def measure_ads_bundle(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """
    Measure Phase 5C1 metrics from an Ads evidence bundle.

    Metrics:
    - high_confidence_claims_count: Number of HIGH confidence claims/insights
    - claims_with_method_reliability: Number of evidence items with method_reliability
    - platform_labeled_ads_with_reliability: Count of platform-labeled ads with method_reliability

    Args:
        bundle: Ads evidence bundle dict

    Returns:
        Dict with metric names and values
    """
    observations = bundle.get("observations", {})
    measurements = bundle.get("measurements", {})

    metrics = {
        "high_confidence_claims_count": 0,
        "claims_with_method_reliability": 0,
        "platform_labeled_ads_with_reliability": 0,
        "unlabeled_promo_with_reliability": 0,
    }

    # Count platform-labeled ads with method_reliability
    platform_evidence = observations.get("platform_labeled_ad_evidence", [])
    for evidence_item in platform_evidence:
        if evidence_item.get("method_reliability") is not None:
            metrics["platform_labeled_ads_with_reliability"] += 1
            metrics["claims_with_method_reliability"] += 1

    # Count unlabeled promo evidence with method_reliability
    unlabeled_evidence = observations.get("unlabeled_promo_evidence", [])
    for evidence_item in unlabeled_evidence:
        if evidence_item.get("method_reliability") is not None:
            metrics["unlabeled_promo_with_reliability"] += 1
            metrics["claims_with_method_reliability"] += 1

    # Count HIGH confidence items from commercial exposure spectrum
    spectrum = observations.get("commercial_exposure_spectrum", {})
    high_conf_items = spectrum.get("high_confidence_items", 0)
    metrics["high_confidence_claims_count"] = high_conf_items

    # Calculate coverage percentages
    total_ads = observations.get("total_ads_detected", 0)
    if total_ads > 0:
        metrics["platform_labeled_reliability_coverage_pct"] = (
            metrics["platform_labeled_ads_with_reliability"] / total_ads * 100
        )
    else:
        metrics["platform_labeled_reliability_coverage_pct"] = 0.0

    return metrics


def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python -m eval.measure_phase5c1 <path_to_evidence_bundle.json>")
        sys.exit(1)

    bundle_path = sys.argv[1]
    try:
        with open(bundle_path, "r", encoding="utf-8") as f:
            bundle = json.load(f)

        metrics = measure_ads_bundle(bundle)

        print("Phase 5C1 Metrics:")
        print(f"  HIGH confidence claims: {metrics['high_confidence_claims_count']}")
        print(f"  Claims with method_reliability: {metrics['claims_with_method_reliability']}")
        print(f"  Platform-labeled ads with reliability: {metrics['platform_labeled_ads_with_reliability']}")
        print(f"  Unlabeled promo with reliability: {metrics['unlabeled_promo_with_reliability']}")
        if "platform_labeled_reliability_coverage_pct" in metrics:
            print(f"  Platform-labeled reliability coverage: {metrics['platform_labeled_reliability_coverage_pct']:.1f}%")

        # Output as JSON for programmatic use
        print("\nJSON output:")
        print(json.dumps(metrics, indent=2))

    except FileNotFoundError:
        print(f"Error: File not found: {bundle_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

