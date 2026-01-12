import os
import sys
import unittest


# Ensure backend path is on sys.path for direct module imports
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from accuracy.evidence_chain import enforce_evidence_chain
from accuracy.conflicts import ConflictResolver
from accuracy.critic import Critic
from accuracy.schema import (
    EvidenceItem,
    Insight,
    MethodReliability,
    ItemContext,
    ConflictMetrics,
)


def _mr(method: str, score: float) -> MethodReliability:
    return MethodReliability(method=method, base_reliability=score, effective_reliability=score)


class TestTabEvidenceChains(unittest.TestCase):
    def test_politics_chain_requires_metadata(self):
        ev = EvidenceItem(
            evidence_id="pol-1",
            source="text_signal",
            detection_method="KEYWORD_MATCH",
            method_reliability=_mr("KEYWORD_MATCH", 0.7),
            item_context=ItemContext(item_index=0),
        )
        ins = Insight(
            insight_id="i-pol",
            claim_type="political_signal",
            claim_status="FINAL",
            evidence_ids=["pol-1"],
        )
        updated, metrics = enforce_evidence_chain([ins], [ev], tab_name="politics")
        self.assertEqual(updated[0].claim_status, "FINAL")
        self.assertTrue(metrics.validation_passed)
        self.assertEqual(metrics.metadata_completeness_rate, 1.0)

    def test_patterns_chain_allows_orphans_threshold(self):
        ev = EvidenceItem(
            evidence_id="pat-1",
            source="pattern_analysis",
            detection_method="HEURISTIC_RULE",
            method_reliability=_mr("HEURISTIC_RULE", 0.65),
            item_context=ItemContext(item_index=0),
        )
        ins = Insight(
            insight_id="i-pat",
            claim_type="pattern",
            claim_status="FINAL",
            evidence_ids=["pat-1"],
        )
        updated, metrics = enforce_evidence_chain([ins], [ev], tab_name="patterns")
        self.assertEqual(updated[0].claim_status, "FINAL")
        self.assertTrue(metrics.validation_passed)

    def test_creators_chain_metadata_required(self):
        ev = EvidenceItem(
            evidence_id="creator-1",
            source="creator_extraction",
            detection_method="NER_EXTRACTION",
            method_reliability=_mr("NER_EXTRACTION", 0.75),
            item_context=ItemContext(item_index=0, platform_id="c1"),
        )
        ins = Insight(
            insight_id="i-creator",
            claim_type="creator_presence",
            claim_status="FINAL",
            evidence_ids=["creator-1"],
        )
        updated, metrics = enforce_evidence_chain([ins], [ev], tab_name="creators")
        self.assertEqual(updated[0].claim_status, "FINAL")
        self.assertTrue(metrics.validation_passed)

    def test_algorithm_chain_metadata_required(self):
        ev = EvidenceItem(
            evidence_id="alg-1",
            source="aggregate",
            detection_method="CLASSIFIER_OUTPUT",
            method_reliability=_mr("CLASSIFIER_OUTPUT", 0.8),
            item_context=ItemContext(item_index=0),
        )
        ins = Insight(
            insight_id="i-alg",
            claim_type="algorithm_signals",
            claim_status="FINAL",
            evidence_ids=["alg-1"],
        )
        updated, metrics = enforce_evidence_chain([ins], [ev], tab_name="algorithm")
        self.assertEqual(updated[0].claim_status, "FINAL")
        self.assertTrue(metrics.validation_passed)


class TestTabConflicts(unittest.TestCase):
    def test_politics_conflict_resolution(self):
        platform_ev = EvidenceItem(
            evidence_id="plat-1",
            detection_method="PLATFORM_LABEL",
            method_reliability=_mr("PLATFORM_LABEL", 0.999),
            source="platform_label",
            signal_type="platform_label",
            item_context=ItemContext(item_index=0),
        )
        keyword_ev = EvidenceItem(
            evidence_id="kw-1",
            detection_method="KEYWORD_MATCH",
            method_reliability=_mr("KEYWORD_MATCH", 0.7),
            source="text_signal",
            signal_type="political_keyword",
            item_context=ItemContext(item_index=0),
        )
        resolver = ConflictResolver()
        resolutions, metrics = resolver.process([platform_ev, keyword_ev], tab_name="politics")
        self.assertEqual(metrics.total_conflicts_detected, 1)
        res = list(resolutions.values())[0]
        self.assertEqual(res.resolution_type, "PRECEDENCE")

    def test_creators_conflict_resolution(self):
        self_desc = EvidenceItem(
            evidence_id="creator-self",
            detection_method="METADATA_FIELD",
            method_reliability=_mr("METADATA_FIELD", 0.95),
            source="creator_extraction",
            signal_type="creator_self_description",
            signal_subtype="creatorA",
            item_context=ItemContext(item_index=0, platform_id="creatorA"),
        )
        observed = EvidenceItem(
            evidence_id="creator-observed",
            detection_method="HEURISTIC_RULE",
            method_reliability=_mr("HEURISTIC_RULE", 0.65),
            source="content_observation",
            signal_type="observed_content",
            signal_subtype="creatorA",
            item_context=ItemContext(item_index=0, platform_id="creatorA"),
        )
        resolver = ConflictResolver()
        resolutions, metrics = resolver.process([self_desc, observed], tab_name="creators")
        self.assertEqual(metrics.total_conflicts_detected, 1)
        res = list(resolutions.values())[0]
        self.assertIn(res.resolution_type, ["PRECEDENCE", "MAJORITY"])

    def test_patterns_conflict_resolution(self):
        ev1 = EvidenceItem(
            evidence_id="pat-a",
            detection_method="HEURISTIC_RULE",
            method_reliability=_mr("HEURISTIC_RULE", 0.65),
            source="pattern_analysis",
            signal_type="temporal_pattern",
            signal_subtype="early",
            item_context=ItemContext(item_index=0),
        )
        ev2 = EvidenceItem(
            evidence_id="pat-b",
            detection_method="HEURISTIC_RULE",
            method_reliability=_mr("HEURISTIC_RULE", 0.65),
            source="pattern_analysis",
            signal_type="temporal_pattern",
            signal_subtype="late",
            item_context=ItemContext(item_index=0),
        )
        resolver = ConflictResolver()
        resolutions, metrics = resolver.process([ev1, ev2], tab_name="patterns")
        self.assertEqual(metrics.total_conflicts_detected, 1)
        res = list(resolutions.values())[0]
        self.assertIn(res.resolution_type, ["PRECEDENCE", "ABSTAIN"])

    def test_algorithm_conflict_resolution(self):
        ev1 = EvidenceItem(
            evidence_id="alg-a",
            detection_method="CLASSIFIER_OUTPUT",
            method_reliability=_mr("CLASSIFIER_OUTPUT", 0.8),
            source="aggregate",
            signal_type="intent_signal",
            signal_subtype="shopping",
            item_context=ItemContext(item_index=0),
        )
        ev2 = EvidenceItem(
            evidence_id="alg-b",
            detection_method="CLASSIFIER_OUTPUT",
            method_reliability=_mr("CLASSIFIER_OUTPUT", 0.8),
            source="aggregate",
            signal_type="intent_signal",
            signal_subtype="political",
            item_context=ItemContext(item_index=0),
        )
        resolver = ConflictResolver()
        resolutions, metrics = resolver.process([ev1, ev2], tab_name="algorithm")
        self.assertEqual(metrics.total_conflicts_detected, 1)
        res = list(resolutions.values())[0]
        self.assertIn(res.resolution_type, ["MAJORITY", "ABSTAIN"])


class TestCritic(unittest.TestCase):
    def test_critic_downgrades_on_conflict_penalty(self):
        ev = EvidenceItem(
            evidence_id="crit-1",
            source="text_signal",
            detection_method="KEYWORD_MATCH",
            method_reliability=_mr("KEYWORD_MATCH", 0.7),
            item_context=ItemContext(item_index=0),
        )
        ins = Insight(
            insight_id="i-crit",
            claim_type="political_signal",
            claim_status="FINAL",
            evidence_ids=["crit-1"],
        )
        critic = Critic()
        conflict_metrics = ConflictMetrics(avg_confidence_penalty=0.6)
        reviewed, _ = critic.evaluate(
            "politics",
            [ins],
            [ev],
            conflict_metrics=conflict_metrics,
        )
        self.assertEqual(reviewed[0].claim_status, "PRELIMINARY")

    def test_critic_downgrade_does_not_fail_validation(self):
        """Test that downgrades are valid operations, not validation failures."""
        # Create politics FINAL insight with 2 news-only evidence (low rate: 2/41 = 4.88% < 10%)
        ev1 = EvidenceItem(
            evidence_id="pol-kw-006",
            source="text_signal",
            signal_type="news_keyword",
            signal_subtype="news",
            detection_method="KEYWORD_MATCH",
            method_reliability=_mr("KEYWORD_MATCH", 0.7),
            item_context=ItemContext(item_index=7),
        )
        ev2 = EvidenceItem(
            evidence_id="pol-kw-034",
            source="text_signal",
            signal_type="news_keyword",
            signal_subtype="news",
            detection_method="KEYWORD_MATCH",
            method_reliability=_mr("KEYWORD_MATCH", 0.7),
            item_context=ItemContext(item_index=35),
        )
        ins = Insight(
            insight_id="politics-keyword-presence",
            claim_type="political_signal",
            claim_status="FINAL",
            evidence_ids=["pol-kw-006", "pol-kw-034"],
        )
        critic = Critic()
        bundle_meta = {"n_items": 41, "total_posts_seen": 41}
        reviewed, critic_metrics = critic.evaluate(
            "politics",
            [ins],
            [ev1, ev2],
            conflict_metrics=None,
            bundle_meta=bundle_meta,
        )
        # Assert downgrade occurred
        self.assertEqual(reviewed[0].claim_status, "PRELIMINARY")
        self.assertEqual(critic_metrics.downgraded_final_to_preliminary, 1)
        # Assert validation passed (downgrades are valid operations, not errors)
        self.assertTrue(critic_metrics.validation_passed)
        self.assertEqual(len(critic_metrics.validation_errors), 0)
        self.assertEqual(len(critic_metrics.contract_violations), 0)
        # Assert downgrade reason is recorded
        self.assertGreater(len(critic_metrics.downgraded_reasons), 0)
        self.assertIn("evidence rate", critic_metrics.downgraded_reasons[0].lower())


if __name__ == "__main__":
    unittest.main()

