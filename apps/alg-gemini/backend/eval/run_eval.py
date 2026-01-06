"""
Evaluation harness skeleton for Accuracy Architecture v3.1 (HPA + CMA).

Phase 5B NOTE:
- This script is scaffolding only.
- It does NOT call the real analysis pipeline yet.
- The core hook `analyze_fixture` is a placeholder that raises
  NotImplementedError and will be wired to the production analysis
  entrypoint in a later phase.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


BACKEND_ROOT = Path(__file__).resolve().parent.parent
EVAL_ROOT = BACKEND_ROOT / "eval"
FIXTURES_ROOT = EVAL_ROOT / "fixtures"
OUTPUTS_ROOT = EVAL_ROOT / "outputs"


def discover_fixture_files(suite: str) -> List[Path]:
    """
    Discover fixture input files for a given suite.

    Suites:
        - golden
        - edge
        - adversarial
        - all
    """
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
    Placeholder analysis hook.

    In later phases this will:
        - Call the existing analysis pipeline using the unified scan input
        - Produce an Accuracy Architecture v3.1 AnalysisResult structure
        - Preserve all existing outputs for diffing

    For Phase 5B, we leave this as a stub and avoid importing or
    refactoring any production code paths.
    """
    # IMPORTANT: Do NOT wire this to the live pipeline in Phase 5B.
    raise NotImplementedError(
        "analyze_fixture is not wired yet. "
        "Future phases should call the current analysis pipeline here, "
        "without changing its behavior, and attach v3.1 accuracy outputs "
        "alongside existing responses."
    )


def ensure_output_dir() -> Path:
    """Create and return the timestamped output directory."""
    OUTPUTS_ROOT.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%SZ")
    out_dir = OUTPUTS_ROOT / ts
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def run_eval(suite: str) -> None:
    """
    Run the evaluation harness for the given suite.

    This currently:
        - Discovers fixture JSON files
        - Attempts to call `analyze_fixture` for each
        - Writes the raw output (or stub error info) into outputs/<timestamp>/
    """
    fixture_paths = discover_fixture_files(suite)
    if not fixture_paths:
        print(f"[eval] No fixtures found for suite '{suite}' under {FIXTURES_ROOT}")
        return

    output_dir = ensure_output_dir()
    print(f"[eval] Running suite '{suite}' with {len(fixture_paths)} fixtures")
    print(f"[eval] Writing outputs to {output_dir}")

    for fixture_path in fixture_paths:
        rel_name = fixture_path.relative_to(FIXTURES_ROOT)
        output_path = output_dir / f"{rel_name.as_posix().replace('/', '_')}"

        try:
            fixture_data = load_fixture(fixture_path)
            result = analyze_fixture(fixture_data)
        except NotImplementedError as e:
            # Explicit stub behavior so we can safely run the harness during Phase 5B.
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Accuracy eval harness (v3.1 scaffolding).")
    parser.add_argument(
        "--suite",
        type=str,
        default="all",
        choices=["golden", "edge", "adversarial", "all"],
        help="Which fixture suite to run.",
    )
    args = parser.parse_args()

    # Ensure we're running from the backend root for predictable paths
    os.chdir(BACKEND_ROOT)
    run_eval(args.suite)


if __name__ == "__main__":
    main()


