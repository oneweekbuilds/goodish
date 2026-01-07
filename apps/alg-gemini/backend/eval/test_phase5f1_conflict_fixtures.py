"""
Phase 5F1: Fixture-driven tests for the Ads Conflict Resolution Engine.

This test module uses the JSON fixtures under `eval/fixtures/phase5f1/` and
`ConflictResolver` to verify that the conflict engine behaves as specified.

It intentionally does NOT depend on pytest so it can run in constrained
environments via:

    python -m eval.test_phase5f1_conflict_fixtures
"""

import json
import os
import sys
import math
import unittest

# Ensure backend modules are importable when run as a module
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from accuracy.schema import EvidenceItem, MethodReliability, ItemContext
from accuracy.conflicts import ConflictResolver


FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "phase5f1")


def _make_reliability(method: str, value: float) -> MethodReliability:
    """Helper to construct MethodReliability with both base and effective set."""
    return MethodReliability(
        method=method,
        base_reliability=value,
        effective_reliability=value,
    )


class Phase5F1ConflictFixtureTests(unittest.TestCase):
    """Fixture-driven tests for the Ads conflict resolution engine."""

    @classmethod
    def setUpClass(cls) -> None:
        # Load expected outcomes
        with open(os.path.join(FIXTURES_DIR, "expected_outcomes.json"), "r", encoding="utf-8") as f:
            data = json.load(f)
        cls.expected_by_id = {f["fixture_id"]: f for f in data["fixtures"]}

    def _build_evidence_for_fixture(self, fixture_id: str):
        """
        Build a list of EvidenceItem instances for a fixture.

        We align with the expected outcomes but keep construction simple and
        deterministic. Each fixture builds evidence in a way that matches what
        the ConflictResolver.detect_conflicts(...) expects.
        """
        items: list[EvidenceItem] = []

        if fixture_id == "platform_vs_ocr_denial":
            # One item with PLATFORM_LABEL and OCR_DISCLOSURE evidence
            item_index = 0
            ctx = ItemContext(item_index=item_index, platform="tiktok", modality="DESKTOP_EXTENSION")
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-platform-001",
                    signal_type="platform_labeled_ad",
                    detection_method="PLATFORM_LABEL",
                    method_reliability=_make_reliability("PLATFORM_LABEL", 0.999),
                    item_context=ctx,
                )
            )
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-ocr-001",
                    signal_type="ocr_denial",
                    detection_method="OCR_DISCLOSURE",
                    method_reliability=_make_reliability("OCR_DISCLOSURE", 0.85),
                    item_context=ctx,
                )
            )

        elif fixture_id == "creator_notanad_hashtag":
            # One item with platform label + a single creator denial signal
            item_index = 0
            ctx = ItemContext(item_index=item_index, platform="instagram", modality="MOBILE_APP")
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-platform-001",
                    signal_type="platform_labeled_ad",
                    detection_method="PLATFORM_LABEL",
                    method_reliability=_make_reliability("PLATFORM_LABEL", 0.999),
                    item_context=ctx,
                )
            )
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-denial-001",
                    signal_type="creator_denial_hashtag",
                    detection_method="KEYWORD_MATCH",
                    method_reliability=_make_reliability("KEYWORD_MATCH", 0.70),
                    item_context=ctx,
                )
            )

        elif fixture_id == "unlabeled_promo_codes":
            # No platform ad, but multiple high-reliability promo signals
            item_index = 0
            ctx = ItemContext(item_index=item_index, platform="tiktok", modality="DESKTOP_EXTENSION")
            # Platform evidence (no label)
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-platform-001",
                    signal_type="platform_no_label",
                    detection_method="PLATFORM_LABEL",
                    method_reliability=_make_reliability("PLATFORM_LABEL", 0.999),
                    item_context=ctx,
                )
            )
            # Discount code
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-promo-discount-001",
                    signal_type="discount_code",
                    detection_method="REGEX_PATTERN",
                    method_reliability=_make_reliability("REGEX_PATTERN", 0.85),
                    item_context=ctx,
                )
            )
            # CTA
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-promo-cta-001",
                    signal_type="call_to_action",
                    detection_method="KEYWORD_MATCH",
                    method_reliability=_make_reliability("KEYWORD_MATCH", 0.80),
                    item_context=ctx,
                )
            )
            # Purchase intent
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-promo-purchase-001",
                    signal_type="purchase_intent",
                    detection_method="KEYWORD_MATCH",
                    method_reliability=_make_reliability("KEYWORD_MATCH", 0.80),
                    item_context=ctx,
                )
            )

        elif fixture_id == "multi_method_disagreement":
            # Three distinct methods, majority promotional among reliable methods
            item_index = 0
            ctx = ItemContext(item_index=item_index, platform="youtube", modality="DESKTOP_EXTENSION")
            # Keyword promotional (reliable)
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-keyword-001",
                    signal_type="commercial_keywords",
                    detection_method="KEYWORD_MATCH",
                    method_reliability=_make_reliability("KEYWORD_MATCH", 0.80),
                    item_context=ctx,
                )
            )
            # Heuristic promotional (boosted reliability to be included in majority)
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-cta-001",
                    signal_type="commercial_keywords",  # treat as promo keywords
                    detection_method="HEURISTIC_RULE",
                    method_reliability=_make_reliability("HEURISTIC_RULE", 0.80),
                    item_context=ctx,
                )
            )
            # Classifier ambiguous (reliable but minority)
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-classifier-001",
                    signal_type="classifier_ambiguous",
                    detection_method="CLASSIFIER_OUTPUT",
                    method_reliability=_make_reliability("CLASSIFIER_OUTPUT", 0.80),
                    item_context=ctx,
                )
            )

        elif fixture_id == "duplicate_different_signals":
            # Two items with same platform_id (content_hash), different signals
            platform_id = "abc123def456"
            ctx1 = ItemContext(item_index=0, platform="tiktok", modality="DESKTOP_EXTENSION", platform_id=platform_id)
            ctx2 = ItemContext(item_index=5, platform="tiktok", modality="DESKTOP_EXTENSION", platform_id=platform_id)
            # First occurrence: no label
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-platform-001",
                    signal_type="platform_no_label",
                    detection_method="PLATFORM_LABEL",
                    method_reliability=_make_reliability("PLATFORM_LABEL", 0.999),
                    item_context=ctx1,
                )
            )
            # Second occurrence: labeled ad (should win)
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-platform-005",
                    signal_type="platform_labeled_ad",
                    detection_method="PLATFORM_LABEL",
                    method_reliability=_make_reliability("PLATFORM_LABEL", 0.999),
                    item_context=ctx2,
                )
            )

        elif fixture_id == "adversarial_sponsored_denial":
            # Platform labeled ad + multiple denial signals
            item_index = 0
            ctx = ItemContext(item_index=item_index, platform="instagram", modality="MOBILE_APP")
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-platform-001",
                    signal_type="platform_labeled_ad",
                    detection_method="PLATFORM_LABEL",
                    method_reliability=_make_reliability("PLATFORM_LABEL", 0.999),
                    item_context=ctx,
                )
            )
            # Explicit denial
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-denial-explicit-001",
                    signal_type="explicit_denial",
                    detection_method="REGEX_PATTERN",
                    method_reliability=_make_reliability("REGEX_PATTERN", 0.75),
                    item_context=ctx,
                )
            )
            # Hashtag denial
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-denial-hashtag-001",
                    signal_type="hashtag_denial",
                    detection_method="KEYWORD_MATCH",
                    method_reliability=_make_reliability("KEYWORD_MATCH", 0.70),
                    item_context=ctx,
                )
            )
            # Authenticity claim (not considered a denial by resolver)
            items.append(
                EvidenceItem(
                    evidence_id="ev-ads-denial-auth-001",
                    signal_type="authenticity_claim",
                    detection_method="NER_EXTRACTION",
                    method_reliability=_make_reliability("NER_EXTRACTION", 0.75),
                    item_context=ctx,
                )
            )

        else:
            self.fail(f"Unknown fixture_id: {fixture_id}")

        return items

    def _assert_float_close(self, actual: float, expected: float, tol: float = 1e-6):
        self.assertTrue(
            math.isclose(actual, expected, rel_tol=tol, abs_tol=tol),
            msg=f"Expected {expected}, got {actual}",
        )

    def test_all_fixtures(self):
        resolver = ConflictResolver()
        for fixture_id, expected in self.expected_by_id.items():
            with self.subTest(fixture_id=fixture_id):
                evidence_items = self._build_evidence_for_fixture(fixture_id)
                self.assertTrue(evidence_items, msg="No evidence items built for fixture")

                resolutions, metrics = resolver.process(evidence_items)
                # basic metrics sanity
                self.assertGreaterEqual(metrics.conflict_resolution_rate, 0.0)
                self.assertGreaterEqual(metrics.conflicts_resolved + metrics.conflicts_abstained, 0)

                # Find relevant resolution by conflict_type
                target_type = expected["conflict_type"]
                matching = [
                    rec for rec in resolutions.values()
                    if rec.conflict_type.value == target_type
                ]
                self.assertTrue(
                    matching,
                    msg=f"No ConflictResolutionRecord found for type {target_type}",
                )
                # For these fixtures we expect exactly one relevant conflict
                resolution = matching[0]

                # Required exact matches
                self.assertEqual(resolution.conflict_type.value, expected["conflict_type"])
                self.assertEqual(resolution.resolution_type, expected["expected_resolution"])
                self.assertEqual(resolution.winning_method, expected["expected_winner"])
                self.assertEqual(resolution.classification, expected["expected_classification"])
                self.assertEqual(resolution.claim_status, expected["expected_status"])
                self._assert_float_close(resolution.confidence_penalty, expected["expected_penalty"])

                # Winning / losing evidence IDs must exist in evidence list
                evidence_ids = {ev.evidence_id for ev in evidence_items}
                if resolution.winning_evidence_id is not None:
                    self.assertIn(
                        resolution.winning_evidence_id,
                        evidence_ids,
                        msg="winning_evidence_id not found in evidence items",
                    )
                for losing_id in resolution.losing_evidence_ids:
                    self.assertIn(
                        losing_id,
                        evidence_ids,
                        msg=f"losing_evidence_id {losing_id} not found in evidence items",
                    )

                # PLATFORM_LABEL dominance fixtures
                if expected["expected_winner"] == "PLATFORM_LABEL":
                    self.assertEqual(
                        resolution.winning_method,
                        "PLATFORM_LABEL",
                        msg="Platform label should dominate in this fixture",
                    )


def main():
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(Phase5F1ConflictFixtureTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    # Exit non-zero if tests failed
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    main()


