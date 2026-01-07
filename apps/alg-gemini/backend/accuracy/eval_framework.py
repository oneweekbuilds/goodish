"""
Lightweight evaluation scaffolding for accuracy benchmarking (Phase 5).

No datasets are shipped; this module only defines schemas and helpers to
compare pre/post outputs or labeled outcomes when available.
"""

from __future__ import annotations

from typing import Dict, List, Optional
from pydantic import BaseModel

from accuracy.schema import TabResult


class EvaluationCase(BaseModel):
    """Single evaluation example used for offline benchmarking."""

    case_id: str
    tab: str
    predicted: TabResult
    labeled: Optional[TabResult] = None
    notes: Optional[str] = None


class AccuracyMetric(BaseModel):
    """Basic accuracy metrics aligned with abstention-aware evaluation."""

    precision: Optional[float] = None
    abstention_rate: Optional[float] = None
    overclaim_rate: Optional[float] = None
    sample_size: int = 0


class EvaluationHarness:
    """Utility for comparing outputs without shipping datasets."""

    def compare_runs(
        self, baseline: List[EvaluationCase], candidate: List[EvaluationCase]
    ) -> Dict[str, AccuracyMetric]:
        """Compare two runs (e.g., pre-overhaul vs post-overhaul) by case_id."""
        baseline_map = {c.case_id: c for c in baseline}
        candidate_map = {c.case_id: c for c in candidate}
        metrics: Dict[str, AccuracyMetric] = {}

        for case_id, cand_case in candidate_map.items():
            base_case = baseline_map.get(case_id)
            metrics[case_id] = self._compare_case(base_case, cand_case)

        return metrics

    def evaluate_against_labels(
        self, cases: List[EvaluationCase]
    ) -> Dict[str, AccuracyMetric]:
        """Compute metrics where labeled outcomes exist."""
        results: Dict[str, AccuracyMetric] = {}
        for case in cases:
            results[case.case_id] = self._compare_case(case, case)
        return results

    def _compare_case(
        self, baseline: Optional[EvaluationCase], candidate: EvaluationCase
    ) -> AccuracyMetric:
        """Very small placeholder comparison for smoke tests."""
        metric = AccuracyMetric(sample_size=1)

        # Abstention tracking
        candidate_abstentions = sum(
            1 for i in candidate.predicted.insights if i.claim_status == "ABSTAIN"
        )
        metric.abstention_rate = candidate_abstentions / max(
            1, len(candidate.predicted.insights)
        )

        # Overclaim heuristic: FINAL without evidence_ids
        overclaims = sum(
            1
            for i in candidate.predicted.insights
            if i.claim_status == "FINAL" and not i.evidence_ids
        )
        metric.overclaim_rate = overclaims / max(1, len(candidate.predicted.insights))

        # Precision proxy when labels exist
        if baseline and baseline.labeled:
            labeled_final = {
                i.insight_id for i in baseline.labeled.insights if i.claim_status == "FINAL"
            }
            candidate_final = {
                i.insight_id for i in candidate.predicted.insights if i.claim_status == "FINAL"
            }
            true_positive = len(candidate_final & labeled_final)
            predicted_final = len(candidate_final)
            metric.precision = true_positive / predicted_final if predicted_final else 0.0

        return metric

