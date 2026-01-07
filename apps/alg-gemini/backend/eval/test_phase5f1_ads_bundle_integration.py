"""
Phase 5F1: Ads bundle integration test for conflict engine + evidence chains.

This test ensures that:
- `build_ads_evidence_bundle` returns conflict_metrics and conflict_resolutions
  in the Ads bundle.
- Phase 5D1 evidence chain invariants still hold:
    - evidence_linking_rate == 1.0
    - missing_evidence_rate == 0.0
    - orphan_evidence_rate <= 0.20

Run via:

    python -m eval.test_phase5f1_ads_bundle_integration
"""

import os
import sys
import unittest
from datetime import datetime

# Ensure backend modules are importable when run as a module
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from evidence_bundle import build_ads_evidence_bundle


class Phase5F1AdsBundleIntegrationTests(unittest.TestCase):
    """Integration tests for Ads bundle conflict fields and evidence chains."""

    def _build_mock_scan(self):
        """Construct a minimal scan dict for Ads bundle generation."""
        return {
            "scan_metadata": {
                "scan_id": "test-phase5f1-integration",
                "platform": "twitter",
                "created_at": datetime.now().isoformat(),
                "source_type": "DESKTOP_EXTENSION",
            },
            "aggregates": {
                "total_feed_items": 10,
                "total_ads": 2,
            },
            "feed_items": [
                {
                    "position_in_feed": i,
                    "is_ad": i < 2,
                    "content_text": {"caption": f"Post {i}"},
                    "account": {"account_handle": f"user{i}"},
                    "ad_metadata": {
                        "ad_detected_reason": "platform_label",
                        "sponsored_label_text": "Promoted" if i < 2 else None,
                    }
                    if i < 2
                    else {},
                }
                for i in range(10)
            ],
        }

    def test_ads_bundle_includes_conflict_and_evidence_chain_fields(self):
        scan = self._build_mock_scan()
        bundle = build_ads_evidence_bundle(scan)

        # Conflict engine fields
        self.assertIn("conflict_metrics", bundle)
        self.assertIn("conflict_resolutions", bundle)

        conflict_metrics = bundle.get("conflict_metrics", {})
        self.assertIsInstance(conflict_metrics, dict)
        # Basic keys should exist
        self.assertIn("conflict_resolution_rate", conflict_metrics)
        self.assertIn("conflicts_resolved", conflict_metrics)

        # Evidence chain metrics should still satisfy Phase 5D1 invariants
        self.assertIn("evidence_chain_metrics", bundle)
        ec_metrics = bundle.get("evidence_chain_metrics", {})
        self.assertIsInstance(ec_metrics, dict)

        linking_rate = ec_metrics.get("evidence_linking_rate")
        missing_rate = ec_metrics.get("missing_evidence_rate")
        orphan_rate = ec_metrics.get("orphan_evidence_rate")

        self.assertEqual(linking_rate, 1.0)
        self.assertEqual(missing_rate, 0.0)
        self.assertLessEqual(orphan_rate, 0.20)


def main():
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(
        Phase5F1AdsBundleIntegrationTests
    )
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    main()


