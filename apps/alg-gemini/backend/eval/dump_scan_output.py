"""
Baseline runner for dumping current production scan outputs.

Phase 5B NOTE:
- This script is intentionally NON-INVASIVE.
- It does not change any analysis behavior or thresholds.
- It simply loads an existing scan from the database and writes the
  stored result JSON to a baseline file for future diffing.

Usage:

    cd apps/alg-gemini/backend
    python -m eval.dump_scan_output --scan-id <scan_id>
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

from database import get_scan_by_id


BACKEND_ROOT = Path(__file__).resolve().parent.parent
EVAL_ROOT = BACKEND_ROOT / "eval"
BASELINES_ROOT = EVAL_ROOT / "baselines"


def load_existing_scan(scan_id: str) -> Dict[str, Any]:
  """
  Fetch an existing scan from the database.

  This uses the current production database access layer and does not
  modify any stored data.
  """
  scan = get_scan_by_id(scan_id)
  if scan is None:
      raise SystemExit(f"[baseline] Scan {scan_id} not found in database.")
  return scan


def dump_scan_output(scan_id: str) -> Path:
    """
    Dump the current stored scan result JSON to a baseline file.

    NOTE:
    - We rely on the fact that the analysis pipeline has already been
      applied when the scan was originally stored.
    - We do NOT re-run any analysis here in Phase 5B; we only mirror
      the existing output for later comparison.
    """
    BASELINES_ROOT.mkdir(parents=True, exist_ok=True)

    scan = load_existing_scan(scan_id)
    result = scan.get("result")

    if result is None:
        raise SystemExit(
            f"[baseline] Scan {scan_id} has no 'result' field. "
            "This likely indicates an incomplete or pending scan record."
        )

    out_path = BASELINES_ROOT / f"scan_{scan_id}.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"[baseline] Wrote baseline output to {out_path}")
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Dump current production outputs for a scan into eval/baselines."
    )
    parser.add_argument(
        "--scan-id",
        required=True,
        help="Scan ID to dump (must already exist in the database).",
    )
    args = parser.parse_args()

    dump_scan_output(args.scan_id)


if __name__ == "__main__":
    main()


