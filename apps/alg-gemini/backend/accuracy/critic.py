"""
Independent second-pass critic for FINAL claims (Phase 5 parity).

Runs after insights are built and conflict metrics computed. It downgrades
overconfident claims and enforces defensible evidence use without altering
Ads logic unless a true violation exists.
"""

from __future__ import annotations

from typing import Iterable, List, Optional

from accuracy.schema import Insight, EvidenceItem, get_tab_accuracy_contract
from accuracy.conflict_metrics import compute_validation
from accuracy.schema import ConflictMetrics


class Critic:
    """Lightweight post-processor to re-evaluate FINAL claims."""

    def evaluate(
        self,
        tab_name: str,
        insights: Iterable[Insight],
        evidence_items: Iterable[EvidenceItem],
        conflict_metrics: Optional[ConflictMetrics] = None,
    ) -> List[Insight]:
        contract = get_tab_accuracy_contract(tab_name)
        updated: List[Insight] = []
        evidence_lookup = {ev.evidence_id: ev for ev in evidence_items}

        # Ensure conflict metrics are validated for downstream checks
        if conflict_metrics is not None and conflict_metrics.validation_passed is None:
            compute_validation(conflict_metrics)

        for insight in insights:
            mutated = insight.model_copy(deep=True)

            if mutated.claim_status == "FINAL":
                evidence_ids = mutated.evidence_ids or []
                if len(evidence_ids) < contract.min_evidence_for_final:
                    mutated.claim_status = "PRELIMINARY"
                    mutated.abstention_reason = (
                        mutated.abstention_reason
                        or f"{tab_name}: insufficient evidence count for FINAL"
                    )

                # Downgrade if missing evidence metadata
                incomplete_meta = [
                    ev_id
                    for ev_id in evidence_ids
                    if ev_id not in evidence_lookup
                    or evidence_lookup[ev_id].method_reliability is None
                    or evidence_lookup[ev_id].source is None
                ]
                if incomplete_meta:
                    mutated.claim_status = "PRELIMINARY"
                    mutated.abstention_reason = (
                        mutated.abstention_reason
                        or f"{tab_name}: incomplete evidence metadata"
                    )

                # Conflict penalties
                if conflict_metrics is not None:
                    penalty = conflict_metrics.avg_confidence_penalty or 0.0
                    threshold = contract.conflict_penalty_threshold or 0.0
                    if penalty >= threshold and threshold > 0:
                        mutated.claim_status = "PRELIMINARY"
                        mutated.abstention_reason = (
                            mutated.abstention_reason
                            or f"{tab_name}: conflict penalty {penalty:.2f} exceeds threshold {threshold:.2f}"
                        )
                    if not conflict_metrics.validation_passed:
                        mutated.claim_status = "PRELIMINARY"
                        mutated.abstention_reason = (
                            mutated.abstention_reason
                            or f"{tab_name}: unresolved conflicts"
                        )

                # Uncertainty width check
                if (
                    mutated.uncertainty_interval is not None
                    and contract.uncertainty_width_threshold is not None
                ):
                    width = (
                        mutated.uncertainty_interval.upper
                        - mutated.uncertainty_interval.lower
                    )
                    if width > contract.uncertainty_width_threshold:
                        mutated.claim_status = "PRELIMINARY"
                        mutated.abstention_reason = (
                            mutated.abstention_reason
                            or f"{tab_name}: uncertainty width {width:.2f} exceeds threshold"
                        )

                # If nothing defensible remains, abstain explicitly
                if (
                    mutated.claim_status == "FINAL"
                    and not mutated.evidence_ids
                ):
                    mutated.claim_status = "ABSTAIN"
                    mutated.abstention_flag = True
                    mutated.abstention_reason = (
                        mutated.abstention_reason
                        or f"{tab_name}: critic could not justify FINAL without evidence"
                    )

            updated.append(mutated)

        return updated

