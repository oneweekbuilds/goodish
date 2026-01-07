"""
Phase 5F2: Ads extraction + conflict engine integration tests.

These tests build minimal mock scans that exercise the real Ads pipeline
(`build_ads_evidence_bundle`) to ensure:

- Additional EvidenceItems from OCR/captions/promo signals are emitted.
- The Phase 5F1 ConflictResolver detects and resolves conflicts on real scans.
- Phase 5D1 evidence chain invariants still hold.

Run via:

    python -m eval.test_phase5f2_ads_extraction_conflicts
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


class Phase5F2AdsExtractionConflictTests(unittest.TestCase):
    """Tests for real-scan-style evidence extraction feeding the conflict engine."""

    def _build_scan_creator_denial(self):
        """Platform labeled ad + caption denial (#notanad) → CREATOR_DENIAL."""
        return {
            "scan_metadata": {
                "scan_id": "test-phase5f2-creator-denial",
                "platform": "instagram",
                "created_at": datetime.now().isoformat(),
                "source_type": "MOBILE_APP",
            },
            "aggregates": {
                "total_feed_items": 3,
                "total_ads": 1,
            },
            "feed_items": [
                {
                    "position_in_feed": 0,
                    "is_ad": True,
                    "content_text": {
                        "caption": "Loving this product! #notanad #gifted",
                        "hashtags": ["notanad", "gifted"],
                    },
                    "account": {"account_handle": "creator1"},
                    "ad_metadata": {
                        "ad_detected_reason": "platform_label",
                        "sponsored_label_text": "Paid partnership",
                    },
                },
                # Non-ad filler items
                {
                    "position_in_feed": 1,
                    "is_ad": False,
                    "content_text": {"caption": "Just a regular post."},
                    "account": {"account_handle": "creator2"},
                },
                {
                    "position_in_feed": 2,
                    "is_ad": False,
                    "content_text": {"caption": "Another regular post."},
                    "account": {"account_handle": "creator3"},
                },
            ],
        }

    def _build_scan_unlabeled_promo(self):
        """No platform label but strong promo code signals → LABEL_PROMO_MISMATCH."""
        return {
            "scan_metadata": {
                "scan_id": "test-phase5f2-unlabeled-promo",
                "platform": "tiktok",
                "created_at": datetime.now().isoformat(),
                "source_type": "DESKTOP_EXTENSION",
            },
            "aggregates": {
                "total_feed_items": 3,
                "total_ads": 0,
            },
            "feed_items": [
                {
                    "position_in_feed": 0,
                    "is_ad": False,
                    "content_text": {
                        "caption": "OMG you need this! Use code SAVE20 for 20% off, link in bio!",
                    },
                    "account": {"account_handle": "promo_creator"},
                    # No ad_metadata or is_ad flag → unlabeled promo
                },
                {"position_in_feed": 1, "is_ad": False, "content_text": {"caption": "Hi"},"account": {"account_handle": "u1"}},
                {"position_in_feed": 2, "is_ad": False, "content_text": {"caption": "Bye"},"account": {"account_handle": "u2"}},
            ],
        }

    def _build_scan_platform_vs_ocr(self):
        """Platform labeled ad + OCR denial text → PLATFORM_OCR_MISMATCH."""
        return {
            "scan_metadata": {
                "scan_id": "test-phase5f2-platform-ocr",
                "platform": "tiktok",
                "created_at": datetime.now().isoformat(),
                "source_type": "DESKTOP_EXTENSION",
            },
            "aggregates": {
                "total_feed_items": 3,
                "total_ads": 1,
            },
            "feed_items": [
                {
                    "position_in_feed": 0,
                    "is_ad": True,
                    "content_text": {
                        "caption": "This is definitely NOT a sponsored post.",
                    },
                    "ocr_text": "This is definitely not sponsored content.",
                    "account": {"account_handle": "creator1"},
                    "ad_metadata": {
                        "ad_detected_reason": "platform_label",
                        "sponsored_label_text": "Sponsored",
                    },
                },
                {"position_in_feed": 1, "is_ad": False, "content_text": {"caption": "Hi"}, "account": {"account_handle": "u1"}},
                {"position_in_feed": 2, "is_ad": False, "content_text": {"caption": "Bye"}, "account": {"account_handle": "u2"}},
            ],
        }

    def _assert_conflict_present(self, bundle, expected_type: str, expected_winner: str):
        conflicts = bundle.get("conflict_resolutions", {})
        self.assertIsInstance(conflicts, dict)
        found = [
            rec for rec in conflicts.values()
            if rec.get("conflict_type") == expected_type
        ]
        self.assertTrue(
            found,
            msg=f"Expected conflict_type {expected_type} not found in conflict_resolutions",
        )
        # For simplicity, inspect the first matching record
        rec = found[0]
        self.assertEqual(
            rec.get("winning_method"),
            expected_winner,
            msg=f"Expected winning_method {expected_winner}, got {rec.get('winning_method')}",
        )

    def _assert_evidence_chain_invariants(self, bundle):
        metrics = bundle.get("evidence_chain_metrics", {})
        self.assertIsInstance(metrics, dict)
        self.assertEqual(metrics.get("evidence_linking_rate"), 1.0)
        self.assertEqual(metrics.get("missing_evidence_rate"), 0.0)
        self.assertLessEqual(metrics.get("orphan_evidence_rate"), 0.20)

    def test_creator_denial_conflict_from_real_scan(self):
        scan = self._build_scan_creator_denial()
        bundle = build_ads_evidence_bundle(scan)
        # Should detect a CREATOR_DENIAL conflict with PLATFORM_LABEL winning
        self._assert_conflict_present(bundle, "CREATOR_DENIAL", "PLATFORM_LABEL")
        # Evidence chain invariants must still hold
        self._assert_evidence_chain_invariants(bundle)

    def test_unlabeled_promo_conflict_from_real_scan(self):
        scan = self._build_scan_unlabeled_promo()
        bundle = build_ads_evidence_bundle(scan)
        # Should detect a LABEL_PROMO_MISMATCH classified as UNLABELED_PROMOTION
        conflicts = bundle.get("conflict_resolutions", {})
        self.assertIsInstance(conflicts, dict)
        found = [
            rec for rec in conflicts.values()
            if rec.get("conflict_type") == "LABEL_PROMO_MISMATCH"
        ]
        self.assertTrue(found, msg="LABEL_PROMO_MISMATCH conflict not found")
        rec = found[0]
        self.assertEqual(rec.get("classification"), "UNLABELED_PROMOTION")
        # Evidence chain invariants
        self._assert_evidence_chain_invariants(bundle)

    def test_platform_ocr_conflict_from_real_scan(self):
        scan = self._build_scan_platform_vs_ocr()
        bundle = build_ads_evidence_bundle(scan)
        # Should detect PLATFORM_OCR_MISMATCH with PLATFORM_LABEL winning
        self._assert_conflict_present(bundle, "PLATFORM_OCR_MISMATCH", "PLATFORM_LABEL")
        # Evidence chain invariants
        self._assert_evidence_chain_invariants(bundle)


def main():
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(
        Phase5F2AdsExtractionConflictTests
    )
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    main()



