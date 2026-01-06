"""
Phase 5C1 Measurement Helper: Count HIGH Claims and Missing Evidence IDs

This script analyzes Ads evidence bundle outputs to compute:
- count of HIGH confidence claims/items
- count of claims missing evidence_ids

Usage:
    python -m eval.measure_ads_claims <bundle_json_path>

Or import and use:
    from eval.measure_ads_claims import measure_ads_bundle
    metrics = measure_ads_bundle(bundle_dict)
"""

import json
import sys
from typing import Dict, Any, Optional


def measure_ads_bundle(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """
    Measure Phase 5C1 metrics from an Ads evidence bundle.
    
    Args:
        bundle: Ads evidence bundle dict
        
    Returns:
        Dict with metrics:
        - high_confidence_count: Number of HIGH confidence items
        - platform_label_high_count: Number of platform-labeled ads with HIGH confidence
        - total_evidence_items: Total evidence items
        - missing_evidence_ids_count: Items missing evidence_ids (if applicable)
    """
    metrics = {
        "high_confidence_count": 0,
        "platform_label_high_count": 0,
        "total_evidence_items": 0,
        "missing_evidence_ids_count": 0,
    }
    
    observations = bundle.get("observations", {})
    
    # Count platform-labeled ad evidence with HIGH confidence
    platform_evidence = observations.get("platform_labeled_ad_evidence", [])
    metrics["total_evidence_items"] += len(platform_evidence)
    
    for item in platform_evidence:
        if item.get("confidence") == "high":
            metrics["high_confidence_count"] += 1
            if item.get("method") == "PLATFORM_LABEL":
                metrics["platform_label_high_count"] += 1
    
    # Count unlabeled promo evidence with HIGH confidence
    unlabeled_evidence = observations.get("unlabeled_promo_evidence", [])
    metrics["total_evidence_items"] += len(unlabeled_evidence)
    
    for item in unlabeled_evidence:
        if item.get("confidence") == "high":
            metrics["high_confidence_count"] += 1
    
    # Count from commercial exposure spectrum
    spectrum = observations.get("commercial_exposure_spectrum", {})
    high_conf_items = spectrum.get("high_confidence_items", 0)
    metrics["high_confidence_count"] = max(metrics["high_confidence_count"], high_conf_items)
    
    return metrics


def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python -m eval.measure_ads_claims <bundle_json_path>")
        sys.exit(1)
    
    json_path = sys.argv[1]
    
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            bundle = json.load(f)
        
        metrics = measure_ads_bundle(bundle)
        
        print("Phase 5C1 Metrics:")
        print(f"  HIGH confidence items: {metrics['high_confidence_count']}")
        print(f"  Platform-label HIGH items: {metrics['platform_label_high_count']}")
        print(f"  Total evidence items: {metrics['total_evidence_items']}")
        print(f"  Missing evidence_ids: {metrics['missing_evidence_ids_count']}")
        
    except FileNotFoundError:
        print(f"Error: File not found: {json_path}")
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

