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
        self, evidence_items: List[EvidenceItem]
    ) -> Tuple[Dict[str, ConflictResolutionRecord], ConflictMetrics]:
        """Detect and resolve conflicts, returning records and metrics."""
        from .conflict_handlers import (
            resolve_platform_ocr_mismatch,
            resolve_creator_denial,
            resolve_label_promo_mismatch,
            resolve_multi_method_conflict,
            resolve_duplicate_items,
        )

        from .conflict_metrics import compute_validation

        metrics = ConflictMetrics()
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

        # Finalize metrics
        self._finalize_metrics(metrics)
        compute_validation(metrics)
        return resolutions, metrics

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
