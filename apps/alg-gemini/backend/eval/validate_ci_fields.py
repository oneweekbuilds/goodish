"""Quick validation script for Phase 5C2 CI fields."""
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from eval.measure_ads_claims import measure_ads_bundle

# Test with fresh bundle
fresh_bundle_path = Path(__file__).parent / "baselines" / "test_fresh_bundle.json"
if fresh_bundle_path.exists():
    with open(fresh_bundle_path, encoding="utf-8") as f:
        bundle = json.load(f)
    
    metrics = measure_ads_bundle(bundle)
    
    print("=" * 60)
    print("Phase 5C2 Validation: Fresh Bundle (Generated Locally)")
    print("=" * 60)
    print(f"  HIGH confidence items: {metrics['high_confidence_count']}")
    print(f"  Platform-label HIGH items: {metrics['platform_label_high_count']}")
    print(f"  Total evidence items: {metrics['total_evidence_items']}")
    print(f"  Ad rate CI present: {metrics['ad_rate_ci_present']}")
    if metrics['ad_rate_ci_width'] is not None:
        print(f"  Ad rate CI width: {metrics['ad_rate_ci_width']:.1f}%")
    print(f"  Promo rate CI present: {metrics['promo_rate_ci_present']}")
    if metrics['promo_rate_ci_width'] is not None:
        print(f"  Promo rate CI width: {metrics['promo_rate_ci_width']:.1f}%")
    print()

# Test with stored scan bundle
stored_bundle_path = Path(__file__).parent / "baselines" / "bundle_desktop-1767216093373-0dykcpc.json"
if stored_bundle_path.exists():
    with open(stored_bundle_path, encoding="utf-8") as f:
        bundle = json.load(f)
    
    metrics = measure_ads_bundle(bundle)
    
    print("=" * 60)
    print("Phase 5C2 Validation: Stored Scan Bundle (Generated Locally)")
    print("=" * 60)
    print(f"  HIGH confidence items: {metrics['high_confidence_count']}")
    print(f"  Platform-label HIGH items: {metrics['platform_label_high_count']}")
    print(f"  Total evidence items: {metrics['total_evidence_items']}")
    print(f"  Ad rate CI present: {metrics['ad_rate_ci_present']}")
    if metrics['ad_rate_ci_width'] is not None:
        print(f"  Ad rate CI width: {metrics['ad_rate_ci_width']:.1f}%")
    print(f"  Promo rate CI present: {metrics['promo_rate_ci_present']}")
    if metrics['promo_rate_ci_width'] is not None:
        print(f"  Promo rate CI width: {metrics['promo_rate_ci_width']:.1f}%")
    print()


