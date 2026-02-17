"""
Report generation for eval runs.

Produces human-readable summaries and machine-readable JSON logs
of eval runs, including grading results, fixes applied, and
accuracy trends over time.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .schema import (
    EvalRunSummary,
    FixRecord,
    GradingReport,
)

logger = logging.getLogger(__name__)

EVAL_ROOT = Path(__file__).resolve().parent.parent.parent
HISTORY_DIR = EVAL_ROOT / "history"


def generate_summary_text(summary: EvalRunSummary) -> str:
    """Generate a human-readable summary of an eval run."""
    lines = []
    lines.append("=" * 60)
    lines.append(f"EVAL RUN SUMMARY — {summary.platform.upper()}")
    lines.append("=" * 60)
    lines.append(f"Run ID:      {summary.run_id}")
    lines.append(f"Started:     {summary.started_at}")
    lines.append(f"Completed:   {summary.completed_at or 'In progress'}")
    lines.append(f"Threshold:   ±{summary.threshold_pct}%")
    lines.append(f"Max cycles:  {summary.max_cycles}")
    lines.append(f"Total cycles: {summary.total_cycles}")
    lines.append(f"Final result: {'PASSED ✓' if summary.final_passed else 'FAILED ✗'}")
    lines.append("")

    # Per-cycle breakdown
    for report in summary.grading_reports:
        status = "PASS" if report.overall_passed else "FAIL"
        lines.append(f"--- Cycle {report.cycle_number} [{status}] ---")
        lines.append(f"  Passed: {report.passed_criteria}/{report.total_criteria} criteria")

        for criterion in report.criteria:
            icon = "  ✓" if criterion.passed else "  ✗"
            acc = f" ({criterion.accuracy_pct:.1f}%)" if criterion.accuracy_pct is not None else ""
            lines.append(f"  {icon} {criterion.name}{acc}")
            if not criterion.passed and criterion.error_description:
                lines.append(f"      → {criterion.error_description}")

        lines.append("")

    # Fixes applied
    if summary.fixes_applied:
        lines.append("--- Fixes Applied ---")
        for fix in summary.fixes_applied:
            auto = "[AUTO]" if fix.auto_fixed else "[SUGGEST]"
            lines.append(f"  {auto} Cycle {fix.cycle_number}: {fix.description}")
            if fix.file_changed:
                lines.append(f"         File: {fix.file_changed}")
        lines.append("")

    # Accuracy trend
    if len(summary.grading_reports) > 1:
        lines.append("--- Accuracy Trend ---")
        for report in summary.grading_reports:
            pct = report.passed_criteria / max(report.total_criteria, 1) * 100
            bar_len = int(pct / 2)
            bar = "█" * bar_len + "░" * (50 - bar_len)
            lines.append(f"  Cycle {report.cycle_number}: {bar} {pct:.0f}%")
        lines.append("")

    lines.append("=" * 60)
    return "\n".join(lines)


def save_run_summary(summary: EvalRunSummary, output_dir: Path) -> Dict[str, str]:
    """
    Save eval run summary to disk as both JSON and human-readable text.

    Returns dict of output type → file path.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = {}

    # Save JSON
    json_path = output_dir / "eval_summary.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(summary.model_dump(), f, indent=2, default=str)
    paths["json"] = str(json_path)

    # Save human-readable text
    text_path = output_dir / "eval_summary.txt"
    with open(text_path, "w", encoding="utf-8") as f:
        f.write(generate_summary_text(summary))
    paths["text"] = str(text_path)

    # Also append to history log
    _append_to_history(summary)

    return paths


def _append_to_history(summary: EvalRunSummary) -> None:
    """Append run summary to the cumulative history log."""
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    history_path = HISTORY_DIR / "eval_history.jsonl"

    entry = {
        "run_id": summary.run_id,
        "platform": summary.platform,
        "started_at": summary.started_at,
        "completed_at": summary.completed_at,
        "total_cycles": summary.total_cycles,
        "final_passed": summary.final_passed,
        "threshold_pct": summary.threshold_pct,
        "criteria_passed": summary.grading_reports[-1].passed_criteria if summary.grading_reports else 0,
        "criteria_total": summary.grading_reports[-1].total_criteria if summary.grading_reports else 0,
        "fixes_applied_count": len(summary.fixes_applied),
        "auto_fixes_count": sum(1 for f in summary.fixes_applied if f.auto_fixed),
    }

    with open(history_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, default=str) + "\n")

    logger.info(f"Appended eval run to history: {history_path}")


def load_history() -> List[Dict[str, Any]]:
    """Load all historical eval run summaries."""
    history_path = HISTORY_DIR / "eval_history.jsonl"
    if not history_path.exists():
        return []

    entries = []
    with open(history_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    return entries
