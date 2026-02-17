"""
Evaluation harness for AlgorithmLens Accuracy Architecture v3.1.

Supports two modes:
1. Fixture mode (original): Run analysis against saved fixture files
2. Live capture mode (new): Capture → Analyze → Grade → Fix → Repeat

Usage:
    # Run fixture-based eval (original behavior)
    python run_eval.py --suite golden

    # Run live capture eval loop
    python run_eval.py --platform twitter --threshold 0.05 --max-cycles 10

    # Run from saved snapshot (skip capture, useful for re-grading)
    python run_eval.py --platform twitter --snapshot path/to/ground_truth.json
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Setup paths
BACKEND_ROOT = Path(__file__).resolve().parent.parent
EVAL_ROOT = BACKEND_ROOT / "eval"
FIXTURES_ROOT = EVAL_ROOT / "fixtures"
OUTPUTS_ROOT = EVAL_ROOT / "outputs"

# Add backend to Python path for imports
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

logging.basicConfig(
    level=logging.INFO,
    format="[eval] %(asctime)s %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ======================================================================
# Fixture mode (original behavior, preserved)
# ======================================================================

def discover_fixture_files(suite: str) -> List[Path]:
    """Discover fixture input files for a given suite."""
    if suite not in {"golden", "edge", "adversarial", "all"}:
        raise ValueError(f"Unknown suite '{suite}'. Expected one of: golden, edge, adversarial, all.")

    if suite == "all":
        bases = [FIXTURES_ROOT / "golden", FIXTURES_ROOT / "edge", FIXTURES_ROOT / "adversarial"]
    else:
        bases = [FIXTURES_ROOT / suite]

    files: List[Path] = []
    for base in bases:
        if not base.exists():
            continue
        for path in base.rglob("*.json"):
            files.append(path)
    return sorted(files)


def load_fixture(path: Path) -> Dict[str, Any]:
    """Load a single fixture JSON file."""
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def analyze_fixture(fixture: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analysis hook for fixture-based eval.

    Now wired to the real pipeline when a fixture contains
    valid UnifiedScanResult-format data.
    """
    # Check if fixture has feed_items (real scan data)
    if "feed_items" in fixture or "items" in fixture:
        try:
            from gemini_analyzer import analyze_scan
            result, success, reason = analyze_scan(fixture)
            if success:
                return result
            return {
                "_status": "ANALYSIS_INCOMPLETE",
                "_reason": reason,
                "result": result,
            }
        except Exception as e:
            return {
                "_status": "ERROR",
                "_error": str(e),
            }

    # For conflict resolution fixtures (Phase 5F1 format), return as-is
    return {
        "_status": "FIXTURE_ONLY",
        "_note": "Fixture does not contain UnifiedScanResult data",
        "fixture": fixture,
    }


def ensure_output_dir(prefix: str = "") -> Path:
    """Create and return the timestamped output directory."""
    OUTPUTS_ROOT.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    dir_name = f"{prefix}_{ts}" if prefix else ts
    out_dir = OUTPUTS_ROOT / dir_name
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def run_fixture_eval(suite: str) -> None:
    """Run the fixture-based evaluation harness."""
    fixture_paths = discover_fixture_files(suite)
    if not fixture_paths:
        print(f"[eval] No fixtures found for suite '{suite}' under {FIXTURES_ROOT}")
        return

    output_dir = ensure_output_dir(prefix=f"fixture_{suite}")
    print(f"[eval] Running suite '{suite}' with {len(fixture_paths)} fixtures")
    print(f"[eval] Writing outputs to {output_dir}")

    for fixture_path in fixture_paths:
        rel_name = fixture_path.relative_to(FIXTURES_ROOT)
        output_path = output_dir / f"{rel_name.as_posix().replace('/', '_')}"

        try:
            fixture_data = load_fixture(fixture_path)
            result = analyze_fixture(fixture_data)
        except NotImplementedError as e:
            result = {
                "_status": "NOT_IMPLEMENTED",
                "_reason": str(e),
                "_fixture": str(rel_name),
            }
        except Exception as e:
            result = {
                "_status": "ERROR",
                "_error": str(e),
                "_fixture": str(rel_name),
            }

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

    print("[eval] Done.")


# ======================================================================
# Live capture eval loop (new)
# ======================================================================

def run_live_eval(
    platform: str,
    threshold: float = 5.0,
    max_cycles: int = 10,
    snapshot_path: Optional[str] = None,
    feed_type: str = "for_you",
    dry_run: bool = False,
    verbose: bool = False,
) -> None:
    """
    Run the live capture → analyze → grade → fix loop.

    Args:
        platform: Which social media platform to capture (e.g., "twitter")
        threshold: ±% accuracy threshold for grading
        max_cycles: Maximum fix iterations before stopping
        snapshot_path: Path to existing snapshot JSON (skip capture if provided)
        feed_type: Which feed to capture (for_you, following, etc.)
        dry_run: If True, don't apply auto-fixes
        verbose: Print detailed output
    """
    from platforms.common.schema import CaptureSnapshot, EvalRunSummary
    from platforms.common.grader import Grader
    from platforms.common.fixer import Fixer
    from platforms.common.pipeline import run_analysis, build_evidence_bundles, save_outputs
    from platforms.common.reporter import generate_summary_text, save_run_summary
    from platforms.registry import get_platform, is_platform_registered

    # Validate platform
    if not is_platform_registered(platform):
        # Try to register it dynamically
        _register_default_platforms()

    if not is_platform_registered(platform):
        print(f"[eval] Platform '{platform}' is not registered.")
        print(f"[eval] Available platforms: {', '.join(_get_available_platforms())}")
        return

    platform_mod = get_platform(platform)
    if not platform_mod:
        print(f"[eval] Platform '{platform}' not found.")
        return

    # Setup
    run_id = f"eval_{platform}_{uuid.uuid4().hex[:8]}"
    output_dir = ensure_output_dir(prefix=f"live_{platform}")
    grader = Grader(threshold_pct=threshold)
    fixer = Fixer(auto_fix_prompts=not dry_run, dry_run=dry_run)

    summary = EvalRunSummary(
        run_id=run_id,
        platform=platform,
        started_at=datetime.now(timezone.utc).isoformat(),
        threshold_pct=threshold,
        max_cycles=max_cycles,
    )

    print(f"[eval] Starting live eval for {platform}")
    print(f"[eval] Run ID: {run_id}")
    print(f"[eval] Threshold: ±{threshold}%")
    print(f"[eval] Max cycles: {max_cycles}")
    print(f"[eval] Output dir: {output_dir}")
    print()

    # Step 1: Capture or load ground truth
    if snapshot_path:
        print(f"[eval] Loading snapshot from {snapshot_path}")
        with open(snapshot_path, "r", encoding="utf-8") as f:
            snapshot_data = json.load(f)
        snapshot = CaptureSnapshot(**snapshot_data)
    else:
        print(f"[eval] Capturing live feed from {platform}...")
        print("[eval] NOTE: Live browser capture requires Claude-in-Chrome.")
        print("[eval] Use --snapshot to provide pre-captured data for CLI-only mode.")
        # In CLI mode without browser, we can't capture. Provide instructions.
        print()
        print("To capture a live feed, run this from Cowork mode where Claude-in-Chrome is available.")
        print("Alternatively, provide a snapshot file with --snapshot path/to/ground_truth.json")
        return

    print(f"[eval] Ground truth: {snapshot.summary()}")
    print()

    # Initialize variables that may not be set if all cycles fail
    analysis_result = None
    evidence_bundles = {}

    # Step 2-5: Analyze → Grade → Fix → Repeat loop
    for cycle in range(1, max_cycles + 1):
        print(f"{'='*50}")
        print(f"  CYCLE {cycle}/{max_cycles}")
        print(f"{'='*50}")

        # Run analysis
        print(f"[eval] Running analysis pipeline...")
        analysis_result, success, reason = run_analysis(
            snapshot, platform_mod.normalize_fn
        )

        if not success:
            print(f"[eval] Analysis failed: {reason}")
            if cycle < max_cycles:
                print("[eval] Retrying next cycle...")
                continue
            else:
                print("[eval] Max cycles reached with analysis failure.")
                break

        # Build evidence bundles
        print(f"[eval] Building evidence bundles...")
        evidence_bundles = build_evidence_bundles(analysis_result)

        # Grade
        print(f"[eval] Grading analysis against ground truth...")
        report = grader.grade(snapshot, analysis_result, evidence_bundles, cycle_number=cycle)
        summary.grading_reports.append(report)

        print(f"[eval] Result: {'PASS' if report.overall_passed else 'FAIL'} "
              f"({report.passed_criteria}/{report.total_criteria} criteria)")

        if verbose:
            for c in report.criteria:
                icon = "✓" if c.passed else "✗"
                acc = f" ({c.accuracy_pct:.1f}%)" if c.accuracy_pct is not None else ""
                print(f"  {icon} {c.name}{acc}")
                if not c.passed and c.error_description:
                    print(f"    → {c.error_description}")

        # If passed, we're done!
        if report.overall_passed:
            print()
            print("[eval] All criteria passed! Eval complete.")
            summary.final_passed = True
            summary.total_cycles = cycle
            break

        # Fix failures
        if cycle < max_cycles:
            print(f"[eval] Attempting to fix {report.failed_criteria} failure(s)...")
            fixes = fixer.fix_failures(report, cycle_number=cycle)
            summary.fixes_applied.extend(fixes)

            auto_count = sum(1 for f in fixes if f.auto_fixed)
            suggest_count = sum(1 for f in fixes if not f.auto_fixed)
            print(f"[eval] Applied {auto_count} auto-fix(es), {suggest_count} suggestion(s)")

            if auto_count == 0:
                print("[eval] No auto-fixes available. Remaining issues need manual review.")
                summary.total_cycles = cycle
                break
        else:
            print(f"[eval] Max cycles ({max_cycles}) reached. Stopping.")
            summary.total_cycles = cycle

        print()

    # Step 6: Report
    summary.completed_at = datetime.now(timezone.utc).isoformat()
    if not summary.total_cycles:
        summary.total_cycles = max_cycles

    # Save everything (only if we have analysis results)
    if analysis_result is not None:
        save_outputs(snapshot, analysis_result, evidence_bundles, output_dir)
    report_paths = save_run_summary(summary, output_dir)

    print()
    print(generate_summary_text(summary))
    print()
    print(f"[eval] Full results saved to: {output_dir}")
    print(f"[eval] Summary: {report_paths.get('text', 'N/A')}")


def _register_default_platforms():
    """Register built-in platform modules."""
    from platforms.registry import register_platform, is_platform_registered

    if not is_platform_registered("twitter"):
        from platforms.twitter.normalize import normalize_to_unified_scan
        from platforms.twitter.capture import build_snapshot

        register_platform(
            name="twitter",
            capture_fn=build_snapshot,  # Actual browser capture handled by Cowork
            normalize_fn=normalize_to_unified_scan,
            enabled=True,
            description="Twitter/X feed capture and analysis",
            default_url="https://x.com/home",
        )


def _get_available_platforms() -> List[str]:
    """List available platform names."""
    _register_default_platforms()
    from platforms.registry import list_platforms
    return list_platforms()


# ======================================================================
# CLI entry point
# ======================================================================

def main() -> None:
    parser = argparse.ArgumentParser(
        description="AlgorithmLens Eval Harness — Fixture and Live Capture Modes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fixture-based eval (original)
  python run_eval.py --suite golden

  # Live eval from saved snapshot
  python run_eval.py --platform twitter --snapshot ground_truth.json

  # Live eval with custom threshold
  python run_eval.py --platform twitter --threshold 0.03 --max-cycles 5
        """,
    )

    # Mode selection
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument(
        "--suite",
        type=str,
        choices=["golden", "edge", "adversarial", "all"],
        help="Run fixture-based eval for a specific suite.",
    )
    mode_group.add_argument(
        "--platform",
        type=str,
        help="Run live capture eval for a platform (e.g., twitter).",
    )

    # Live eval options
    parser.add_argument(
        "--threshold",
        type=float,
        default=5.0,
        help="±%% accuracy threshold for grading (default: 5.0).",
    )
    parser.add_argument(
        "--max-cycles",
        type=int,
        default=10,
        help="Maximum fix cycles before stopping (default: 10).",
    )
    parser.add_argument(
        "--snapshot",
        type=str,
        default=None,
        help="Path to existing snapshot JSON (skip live capture).",
    )
    parser.add_argument(
        "--feed-type",
        type=str,
        default="for_you",
        choices=["for_you", "following", "explore"],
        help="Which feed to capture (default: for_you).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't apply auto-fixes, only suggest.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print detailed criterion results.",
    )

    args = parser.parse_args()

    # Ensure we're running from the backend root for predictable imports
    os.chdir(BACKEND_ROOT)

    if args.suite:
        run_fixture_eval(args.suite)
    elif args.platform:
        run_live_eval(
            platform=args.platform,
            threshold=args.threshold,
            max_cycles=args.max_cycles,
            snapshot_path=args.snapshot,
            feed_type=args.feed_type,
            dry_run=args.dry_run,
            verbose=args.verbose,
        )


if __name__ == "__main__":
    main()
