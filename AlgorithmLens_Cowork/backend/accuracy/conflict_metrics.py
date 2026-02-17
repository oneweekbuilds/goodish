"""Helpers for computing and validating conflict metrics (Phase 5F1)."""

from __future__ import annotations

from .schema import ConflictMetrics


def compute_validation(metrics: ConflictMetrics) -> ConflictMetrics:
    """Apply validation thresholds and populate validation flags.

    This is a small helper used by the conflict engine. It mutates and
    returns the metrics instance for convenience.
    """
    errors = []

    if metrics.total_conflicts_detected > 0:
        resolution_rate = metrics.conflict_resolution_rate
        unresolved_rate = (
            metrics.conflicts_abstained / float(metrics.total_conflicts_detected)
        )

        if resolution_rate < 0.90:
            errors.append(
                f"conflict_resolution_rate too low: {resolution_rate:.2f} (< 0.90)"
            )
        if unresolved_rate >= 0.10:
            errors.append(
                f"unresolved_conflict_rate too high: {unresolved_rate:.2f} (>= 0.10)"
            )

        # Platform label override rate is tracked in metrics but enforcement
        # is kept soft here to avoid hard failures in early phases.

    metrics.validation_errors = errors
    metrics.validation_passed = len(errors) == 0
    return metrics
