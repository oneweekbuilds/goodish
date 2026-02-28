"""
Phase 5F1: Conflict Resolution Engine for Ads.

Minimal implementation for Ads tab only, focused on the 5 fixture-backed
conflict types: PLATFORM_OCR_MISMATCH, CREATOR_DENIAL, LABEL_PROMO_MISMATCH,
MULTI_METHOD_CONFLICT, and DUPLICATE_ITEM.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Tuple

from .schema import (
    EvidenceItem,
    ConflictResolutionRecord,
    ConflictMetrics,
    ConflictType,
    ConflictSeverity,
)


def _get_reliability(ev: EvidenceItem) -> float:
    """Helper to read reliability from EvidenceItem.method_reliability.

    Falls back to 0.0 when missing.
    """
    mr = ev.method_reliability
    if mr is None:
        return 0.0
    if mr.effective_reliability is not None:
        return mr.effective_reliability
    if mr.base_reliability is not None:
        return mr.base_reliability
    return 0.0


class ConflictResolver:
    """Detects and resolves conflicts in Ads evidence items (Phase 5F1).

    Usage:
        resolver = ConflictResolver()
        resolutions, metrics = resolver.process(evidence_items)
    """

    def process(
        self,
        evidence_items: List[EvidenceItem],
        tab_name: str = "ads",
    ) -> Tuple[Dict[str, ConflictResolutionRecord], ConflictMetrics]:
        """Detect and resolve conflicts, returning records and metrics."""
        from .conflict_handlers import (
            resolve_platform_ocr_mismatch,
            resolve_creator_denial,
            resolve_label_promo_mismatch,
            resolve_multi_method_conflict,
            resolve_duplicate_items,
            resolve_politics_signal_conflict,
            resolve_creator_profile_conflict,
            resolve_pattern_inconsistency,
            resolve_algorithm_intent_conflict,
        )

        from .conflict_metrics import compute_validation

        metrics = ConflictMetrics()
        resolutions: Dict[str, ConflictResolutionRecord] = {}

        # Dispatch per-tab detection while preserving Ads behavior.
        if tab_name.lower() == "ads":
            resolutions = self._process_ads_conflicts(
                evidence_items,
                metrics,
                resolve_platform_ocr_mismatch,
                resolve_creator_denial,
                resolve_label_promo_mismatch,
                resolve_multi_method_conflict,
                resolve_duplicate_items,
            )
        elif tab_name.lower() == "politics":
            resolutions = self._process_politics_conflicts(
                evidence_items,
                metrics,
                resolve_politics_signal_conflict,
            )
        elif tab_name.lower() == "creators":
            resolutions = self._process_creators_conflicts(
                evidence_items,
                metrics,
                resolve_creator_profile_conflict,
            )
        elif tab_name.lower() == "patterns":
            resolutions = self._process_patterns_conflicts(
                evidence_items,
                metrics,
                resolve_pattern_inconsistency,
            )
        elif tab_name.lower() in {"algorithm", "inferences"}:
            resolutions = self._process_algorithm_conflicts(
                evidence_items,
                metrics,
                resolve_algorithm_intent_conflict,
            )
        else:
            # Unknown tab: no-op but still validate empty metrics.
            resolutions = {}

        # Finalize metrics
        self._finalize_metrics(metrics)
        compute_validation(metrics)
        return resolutions, metrics

    # ------------------------------------------------------------------ #
    # Tab-specific processors (Ads remains untouched)
    # ------------------------------------------------------------------ #

    def _process_ads_conflicts(
        self,
        evidence_items: List[EvidenceItem],
        metrics: ConflictMetrics,
        resolve_platform_ocr_mismatch,
        resolve_creator_denial,
        resolve_label_promo_mismatch,
        resolve_multi_method_conflict,
        resolve_duplicate_items,
    ) -> Dict[str, ConflictResolutionRecord]:
        resolutions: Dict[str, ConflictResolutionRecord] = {}

        # Group evidence by item_index when available
        by_item: Dict[int, List[EvidenceItem]] = {}
        for ev in evidence_items:
            idx = ev.item_context.item_index if ev.item_context is not None else None
            if idx is None:
                continue
            by_item.setdefault(idx, []).append(ev)

        # 1) Per-item conflicts
        for item_index, items in by_item.items():
            # PLATFORM_OCR_MISMATCH
            platform_evs = [
                ev
                for ev in items
                if (ev.detection_method or "").upper() == "PLATFORM_LABEL"
            ]
            ocr_evs = [
                ev
                for ev in items
                if (ev.detection_method or "").upper() == "OCR_DISCLOSURE"
            ]
            if platform_evs and ocr_evs:
                metrics.total_conflicts_detected += 1
                conflict_id = f"conflict-{item_index}-platform-ocr"
                resolution = resolve_platform_ocr_mismatch(platform_evs[0], ocr_evs[0])
                resolution.conflict_id = conflict_id
                resolutions[conflict_id] = resolution
                self._update_metrics_for_resolution(metrics, resolution)

            # CREATOR_DENIAL
            if platform_evs:
                denial_evs = [
                    ev
                    for ev in items
                    if (ev.signal_type or "").startswith("creator_denial")
                    or (ev.signal_type or "").endswith("denial")
                ]
                if denial_evs:
                    metrics.total_conflicts_detected += 1
                    conflict_id = f"conflict-{item_index}-creator-denial"
                    resolution = resolve_creator_denial(platform_evs[0], denial_evs)
                    resolution.conflict_id = conflict_id
                    resolutions[conflict_id] = resolution
                    self._update_metrics_for_resolution(metrics, resolution)

            # LABEL_PROMO_MISMATCH (no ad label but strong promo signals)
            has_platform_ad = any(
                (ev.signal_type or "") == "platform_labeled_ad" for ev in items
            )
            promo_evs = [
                ev
                for ev in items
                if (ev.signal_type or "")
                in {
                    "discount_code",
                    "call_to_action",
                    "purchase_intent",
                    "commercial_keywords",
                }
            ]
            if not has_platform_ad and len(promo_evs) >= 2:
                metrics.total_conflicts_detected += 1
                conflict_id = f"conflict-{item_index}-label-promo"
                resolution = resolve_label_promo_mismatch(promo_evs)
                resolution.conflict_id = conflict_id
                resolutions[conflict_id] = resolution
                self._update_metrics_for_resolution(metrics, resolution)

            # MULTI_METHOD_CONFLICT (3+ methods with mixed signals)
            method_names = {ev.detection_method for ev in items if ev.detection_method}
            if len(method_names) >= 3:
                metrics.total_conflicts_detected += 1
                conflict_id = f"conflict-{item_index}-multi-method"
                resolution = resolve_multi_method_conflict(items)
                resolution.conflict_id = conflict_id
                resolutions[conflict_id] = resolution
                self._update_metrics_for_resolution(metrics, resolution)

        # 2) DUPLICATE_ITEM conflicts across items using platform_id / content hash
        # We piggy-back on item_context.platform_id when present (tests set this).
        by_platform_id: Dict[str, List[EvidenceItem]] = {}
        for ev in evidence_items:
            platform_id = ev.item_context.platform_id if ev.item_context is not None else None
            if not platform_id:
                continue
            by_platform_id.setdefault(platform_id, []).append(ev)

        for platform_id, evs in by_platform_id.items():
            if len(evs) < 2:
                continue
            metrics.total_conflicts_detected += 1
            conflict_id = f"conflict-dup-{platform_id}"
            resolution = resolve_duplicate_items(evs)
            resolution.conflict_id = conflict_id
            resolutions[conflict_id] = resolution
            self._update_metrics_for_resolution(metrics, resolution)

        return resolutions

    def _process_politics_conflicts(
        self,
        evidence_items: List[EvidenceItem],
        metrics: ConflictMetrics,
        resolve_politics_signal_conflict,
    ) -> Dict[str, ConflictResolutionRecord]:
        resolutions: Dict[str, ConflictResolutionRecord] = {}
        by_item: Dict[int, List[EvidenceItem]] = {}
        for ev in evidence_items:
            idx = ev.item_context.item_index if ev.item_context else None
            if idx is None:
                continue
            by_item.setdefault(idx, []).append(ev)

        for item_index, items in by_item.items():
            platform_labels = [
                ev for ev in items if (ev.detection_method or "").upper() == "PLATFORM_LABEL"
            ]
            keyword_signals = [
                ev for ev in items if (ev.signal_type or "").startswith("political_keyword")
                or (ev.signal_type or "").startswith("news_keyword")
            ]
            classifier_signals = [
                ev for ev in items if (ev.detection_method or "").upper() == "CLASSIFIER_OUTPUT"
            ]

            if platform_labels and (keyword_signals or classifier_signals):
                metrics.total_conflicts_detected += 1
                conflict_id = f"conflict-{item_index}-politics-signal"
                resolution = resolve_politics_signal_conflict(
                    platform_labels[0],
                    keyword_signals or classifier_signals,
                )
                resolution.conflict_id = conflict_id
                resolutions[conflict_id] = resolution
                self._update_metrics_for_resolution(metrics, resolution)

        return resolutions

    def _process_creators_conflicts(
        self,
        evidence_items: List[EvidenceItem],
        metrics: ConflictMetrics,
        resolve_creator_profile_conflict,
    ) -> Dict[str, ConflictResolutionRecord]:
        resolutions: Dict[str, ConflictResolutionRecord] = {}
        by_creator: Dict[str, List[EvidenceItem]] = {}

        for ev in evidence_items:
            creator_id = None
            if ev.item_context:
                creator_id = getattr(ev.item_context, "platform_id", None)
            if not creator_id and ev.signal_subtype:
                creator_id = ev.signal_subtype
            if creator_id:
                by_creator.setdefault(creator_id, []).append(ev)

        for creator_id, items in by_creator.items():
            self_desc = [ev for ev in items if (ev.signal_type or "") == "creator_self_description"]
            observed = [ev for ev in items if (ev.signal_type or "") == "observed_content"]
            if self_desc and observed:
                metrics.total_conflicts_detected += 1
                conflict_id = f"conflict-creator-{creator_id}"
                resolution = resolve_creator_profile_conflict(self_desc[0], observed)
                resolution.conflict_id = conflict_id
                resolutions[conflict_id] = resolution
                self._update_metrics_for_resolution(metrics, resolution)

        return resolutions

    def _process_patterns_conflicts(
        self,
        evidence_items: List[EvidenceItem],
        metrics: ConflictMetrics,
        resolve_pattern_inconsistency,
    ) -> Dict[str, ConflictResolutionRecord]:
        resolutions: Dict[str, ConflictResolutionRecord] = {}
        by_item: Dict[int, List[EvidenceItem]] = {}
        for ev in evidence_items:
            idx = ev.item_context.item_index if ev.item_context else None
            if idx is None:
                continue
            by_item.setdefault(idx, []).append(ev)

        for item_index, items in by_item.items():
            temporal = [ev for ev in items if (ev.signal_type or "") == "temporal_pattern"]
            duplication = [ev for ev in items if (ev.signal_type or "") == "duplicate_inference"]
            if len(temporal) >= 2 or duplication:
                metrics.total_conflicts_detected += 1
                conflict_id = f"conflict-{item_index}-patterns"
                resolution = resolve_pattern_inconsistency(temporal or duplication)
                resolution.conflict_id = conflict_id
                resolutions[conflict_id] = resolution
                self._update_metrics_for_resolution(metrics, resolution)

        return resolutions

    def _process_algorithm_conflicts(
        self,
        evidence_items: List[EvidenceItem],
        metrics: ConflictMetrics,
        resolve_algorithm_intent_conflict,
    ) -> Dict[str, ConflictResolutionRecord]:
        resolutions: Dict[str, ConflictResolutionRecord] = {}
        by_item: Dict[int, List[EvidenceItem]] = {}
        for ev in evidence_items:
            idx = ev.item_context.item_index if ev.item_context else None
            if idx is None:
                continue
            by_item.setdefault(idx, []).append(ev)

        for item_index, items in by_item.items():
            intents = [ev for ev in items if (ev.signal_type or "") == "intent_signal"]
            intent_labels = {ev.signal_subtype for ev in intents if ev.signal_subtype}
            if len(intent_labels) >= 2:
                metrics.total_conflicts_detected += 1
                conflict_id = f"conflict-{item_index}-intent"
                resolution = resolve_algorithm_intent_conflict(intents)
                resolution.conflict_id = conflict_id
                resolutions[conflict_id] = resolution
                self._update_metrics_for_resolution(metrics, resolution)

        return resolutions

    def _update_metrics_for_resolution(
        self, metrics: ConflictMetrics, resolution: ConflictResolutionRecord
    ) -> None:
        # Type & severity counts
        ctype = resolution.conflict_type.value
        metrics.conflicts_by_type[ctype] = metrics.conflicts_by_type.get(ctype, 0) + 1
        severity = resolution.conflict_severity.value
        metrics.conflicts_by_severity[severity] = (
            metrics.conflicts_by_severity.get(severity, 0) + 1
        )

        # Resolution vs abstention
        if resolution.resolution_type == "ABSTAIN":
            metrics.conflicts_abstained += 1
        else:
            metrics.conflicts_resolved += 1
            if resolution.resolution_type == "PRECEDENCE":
                metrics.precedence_resolutions += 1
            elif resolution.resolution_type == "MAJORITY":
                metrics.majority_resolutions += 1

        # Confidence penalty accumulation (for avg)
        total_applied = metrics.conflicts_resolved + metrics.conflicts_abstained
        if total_applied > 0:
            metrics.avg_confidence_penalty = (
                metrics.avg_confidence_penalty * (total_applied - 1)
                + (resolution.confidence_penalty or 0.0)
            ) / float(total_applied)

        # Platform label override tracking
        if resolution.winning_method == "PLATFORM_LABEL":
            metrics.platform_label_override_count += 1

    def _finalize_metrics(self, metrics: ConflictMetrics) -> None:
        # Resolution rate / unresolved rate
        if metrics.total_conflicts_detected > 0:
            metrics.conflict_resolution_rate = (
                metrics.conflicts_resolved / float(metrics.total_conflicts_detected)
            )
            unresolved_rate = (
                metrics.conflicts_abstained / float(metrics.total_conflicts_detected)
            )
        else:
            unresolved_rate = 0.0

        # Platform label override rate (approximate: fraction of conflicts won by platform)
        conflicts_with_platform = metrics.platform_label_override_count or 0
        if conflicts_with_platform > 0:
            metrics.platform_label_override_rate = (
                metrics.platform_label_override_count / float(conflicts_with_platform)
            )

        # Keep unresolved_rate for validation helper
        # (we don't store it explicitly, but it's recomputable).
