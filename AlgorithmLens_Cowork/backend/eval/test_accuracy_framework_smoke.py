import os
import sys
import unittest


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from accuracy.eval_framework import EvaluationCase, EvaluationHarness
from accuracy.schema import TabResult, Insight


class TestAccuracyFrameworkSmoke(unittest.TestCase):
    def test_smoke_evaluate_against_labels(self):
        predicted = TabResult(
            tab_name="ads",
            insights=[
                Insight(
                    insight_id="i-1",
                    claim_type="signal",
                    claim_status="FINAL",
                    evidence_ids=["ev-1"],
                )
            ],
        )
        case = EvaluationCase(
            case_id="case-1",
            tab="ads",
            predicted=predicted,
            labeled=predicted,
        )

        harness = EvaluationHarness()
        metrics = harness.evaluate_against_labels([case])

        self.assertIn("case-1", metrics)
        result = metrics["case-1"]
        self.assertGreaterEqual(result.abstention_rate, 0.0)
        self.assertGreaterEqual(result.overclaim_rate, 0.0)
        self.assertIsNotNone(result.sample_size)

    def test_compare_runs(self):
        predicted = TabResult(
            tab_name="algorithm",
            insights=[
                Insight(
                    insight_id="i-2",
                    claim_type="signal",
                    claim_status="PRELIMINARY",
                    evidence_ids=[],
                )
            ],
        )
        baseline_case = EvaluationCase(case_id="case-2", tab="algorithm", predicted=predicted)
        candidate_case = EvaluationCase(case_id="case-2", tab="algorithm", predicted=predicted)
        harness = EvaluationHarness()
        metrics = harness.compare_runs([baseline_case], [candidate_case])
        self.assertIn("case-2", metrics)
        self.assertIsNotNone(metrics["case-2"].abstention_rate)


if __name__ == "__main__":
    unittest.main()

