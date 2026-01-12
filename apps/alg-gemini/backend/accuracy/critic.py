"""
Independent second-pass critic for FINAL claims (Phase 5 parity).

Runs after insights are built and conflict metrics computed. It downgrades
overconfident claims and enforces defensible evidence use without altering
Ads logic unless a true violation exists.
"""

from __future__ import annotations

from typing import Iterable, List, Optional, Dict, Any

from accuracy.schema import Insight, EvidenceItem, get_tab_accuracy_contract, CriticMetrics
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
        bundle_meta: Optional[Dict[str, Any]] = None,
    ) -> tuple[List[Insight], CriticMetrics]:
        contract = get_tab_accuracy_contract(tab_name)
        updated: List[Insight] = []
        evidence_lookup = {ev.evidence_id: ev for ev in evidence_items}
        
        # Initialize critic metrics
        critic_metrics = CriticMetrics()

        # Ensure conflict metrics are validated for downstream checks
        if conflict_metrics is not None and conflict_metrics.validation_passed is None:
            compute_validation(conflict_metrics)

        for insight in insights:
            mutated = insight.model_copy(deep=True)

            if mutated.claim_status == "FINAL":
                evidence_ids = mutated.evidence_ids or []
                if len(evidence_ids) < contract.min_evidence_for_final:
                    mutated.claim_status = "PRELIMINARY"
                    reason = f"{tab_name}: insufficient evidence count for FINAL"
                    mutated.abstention_reason = mutated.abstention_reason or reason
                    critic_metrics.downgraded_final_to_preliminary += 1
                    if len(critic_metrics.downgraded_reasons) < 10:  # Bound list
                        critic_metrics.downgraded_reasons.append(reason)

                # Politics-specific: Check evidence rate and type quality for news-only signals
                if (
                    mutated.claim_status == "FINAL"
                    and tab_name == "politics"
                    and len(evidence_ids) >= contract.min_evidence_for_final
                    and bundle_meta is not None
                    and contract.min_evidence_rate_for_final is not None
                ):
                    # Get total items from bundle_meta (try multiple possible keys)
                    total_items = (
                        bundle_meta.get("n_items")
                        or bundle_meta.get("total_posts_seen")
                        or bundle_meta.get("observations", {}).get("total_posts_seen")
                        or 0
                    )
                    if total_items > 0:
                        evidence_rate = len(evidence_ids) / total_items
                        # Check if evidence rate is below threshold
                        if evidence_rate < contract.min_evidence_rate_for_final:
                            # Check if all evidence is news_keyword (not political_keyword)
                            evidence_types = []
                            for ev_id in evidence_ids:
                                if ev_id in evidence_lookup:
                                    ev_obj = evidence_lookup[ev_id]
                                    # Check signal_subtype or signal_type
                                    signal_subtype = getattr(ev_obj, "signal_subtype", None)
                                    signal_type = getattr(ev_obj, "signal_type", None)
                                    if signal_subtype == "news" or (signal_type and "news" in signal_type.lower()):
                                        evidence_types.append("news")
                                    elif signal_subtype == "political" or (signal_type and "political" in signal_type.lower()):
                                        evidence_types.append("political")
                            
                            # If all evidence is news-only, downgrade
                            if len(evidence_types) > 0 and all(et == "news" for et in evidence_types):
                                mutated.claim_status = "PRELIMINARY"
                                reason = (
                                    f"{tab_name}: evidence rate {evidence_rate:.2%} below threshold "
                                    f"{contract.min_evidence_rate_for_final:.0%} with news-only signals"
                                )
                                mutated.abstention_reason = mutated.abstention_reason or reason
                                critic_metrics.downgraded_final_to_preliminary += 1
                                if len(critic_metrics.downgraded_reasons) < 10:
                                    critic_metrics.downgraded_reasons.append(reason)

                # Downgrade if missing evidence metadata (but allow aggregate items with source=="aggregate")
                incomplete_meta = []
                for ev_id in evidence_ids:
                    if ev_id not in evidence_lookup:
                        incomplete_meta.append(ev_id)
                    else:
                        ev_obj = evidence_lookup[ev_id]
                        # Special case: aggregate items with source=="aggregate" are allowed to have None method_reliability
                        # if the method is a known aggregate computation method
                        if ev_obj.source == "aggregate" and ev_obj.detection_method in ("BAYESIAN_BETA", "WILSON_CI"):
                            # Aggregate items are valid even without method_reliability if source is set
                            if ev_obj.source is None:
                                incomplete_meta.append(ev_id)
                        elif ev_obj.method_reliability is None or ev_obj.source is None:
                            incomplete_meta.append(ev_id)
                
                if incomplete_meta:
                    mutated.claim_status = "PRELIMINARY"
                    reason = f"{tab_name}: incomplete evidence metadata"
                    mutated.abstention_reason = mutated.abstention_reason or reason
                    critic_metrics.downgraded_final_to_preliminary += 1
                    critic_metrics.metadata_incomplete_count += len(incomplete_meta)
                    if len(critic_metrics.downgraded_reasons) < 10:
                        critic_metrics.downgraded_reasons.append(reason)

                # Conflict penalties
                if conflict_metrics is not None:
                    penalty = conflict_metrics.avg_confidence_penalty or 0.0
                    threshold = contract.conflict_penalty_threshold or 0.0
                    if penalty >= threshold and threshold > 0:
                        mutated.claim_status = "PRELIMINARY"
                        reason = f"{tab_name}: conflict penalty {penalty:.2f} exceeds threshold {threshold:.2f}"
                        mutated.abstention_reason = mutated.abstention_reason or reason
                        critic_metrics.downgraded_final_to_preliminary += 1
                        if len(critic_metrics.downgraded_reasons) < 10:
                            critic_metrics.downgraded_reasons.append(reason)
                    if not conflict_metrics.validation_passed:
                        mutated.claim_status = "PRELIMINARY"
                        reason = f"{tab_name}: unresolved conflicts"
                        mutated.abstention_reason = mutated.abstention_reason or reason
                        critic_metrics.downgraded_final_to_preliminary += 1
                        if len(critic_metrics.downgraded_reasons) < 10:
                            critic_metrics.downgraded_reasons.append(reason)

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
                        reason = f"{tab_name}: uncertainty width {width:.2f} exceeds threshold"
                        mutated.abstention_reason = mutated.abstention_reason or reason
                        critic_metrics.downgraded_final_to_preliminary += 1
                        if len(critic_metrics.downgraded_reasons) < 10:
                            critic_metrics.downgraded_reasons.append(reason)

                # If nothing defensible remains, abstain explicitly
                if (
                    mutated.claim_status == "FINAL"
                    and not mutated.evidence_ids
                ):
                    mutated.claim_status = "ABSTAIN"
                    mutated.abstention_flag = True
                    reason = f"{tab_name}: critic could not justify FINAL without evidence"
                    mutated.abstention_reason = mutated.abstention_reason or reason
                    critic_metrics.downgraded_final_to_abstain += 1
                    if len(critic_metrics.downgraded_reasons) < 10:
                        critic_metrics.downgraded_reasons.append(reason)

            updated.append(mutated)
        
        # Finalize critic metrics validation
        if critic_metrics.downgraded_final_to_preliminary > 0 or critic_metrics.downgraded_final_to_abstain > 0:
            critic_metrics.validation_passed = False
            if not critic_metrics.validation_errors:
                critic_metrics.validation_errors.append(
                    f"Critic downgraded {critic_metrics.downgraded_final_to_preliminary} FINAL to PRELIMINARY, "
                    f"{critic_metrics.downgraded_final_to_abstain} FINAL to ABSTAIN"
                )

        return updated, critic_metrics

