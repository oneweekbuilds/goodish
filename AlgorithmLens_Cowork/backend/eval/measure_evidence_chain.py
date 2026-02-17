"""
Phase 5D1: CLI helper to measure evidence chain metrics from Ads bundle.

Usage:
    python -m eval.measure_evidence_chain --scan-id desktop-1767216093373-0dykcpc
    python -m eval.measure_evidence_chain --bundle-file bundle.json
"""

import argparse
import json
import sys
import os
from typing import Dict, Any

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

from database import _internal_get_scan_by_id
from evidence_bundle import build_ads_evidence_bundle


def measure_from_scan_id(scan_id: str):
    """Load scan and measure evidence chain."""
    scan = _internal_get_scan_by_id(scan_id)
    if not scan:
        print(f"Error: Scan {scan_id} not found")
        return
    
    scan_result = scan.get("result", {})
    bundle = build_ads_evidence_bundle(scan_result)
    
    print_metrics(bundle)


def measure_from_bundle_file(bundle_file: str):
    """Load bundle from file and measure evidence chain."""
    with open(bundle_file, 'r') as f:
        bundle = json.load(f)
    
    print_metrics(bundle)


def print_metrics(bundle: Dict[str, Any]):
    """Print evidence chain metrics from bundle."""
    metrics = bundle.get("evidence_chain_metrics", {})
    insights = bundle.get("insights", [])
    evidence_items = bundle.get("evidence_items", {})
    
    evidence_linking_rate = metrics.get("evidence_linking_rate", 0.0)
    missing_evidence_rate = metrics.get("missing_evidence_rate", 0.0)
    orphan_evidence_rate = metrics.get("orphan_evidence_rate", 0.0)
    validation_passed = metrics.get("validation_passed", False)
    
    # Count FINAL insights
    final_insights = [insight for insight in insights if insight.get("claim_status") == "FINAL"]
    n_final = len(final_insights)
    
    # Count evidence items
    n_evidence = len(evidence_items)
    
    # Count orphan evidence
    referenced_ids = set()
    for insight in insights:
        referenced_ids.update(insight.get("evidence_ids", []))
    
    n_orphans = sum(1 for ev_id in evidence_items.keys() if ev_id not in referenced_ids)
    
    print("=== Evidence Chain Metrics ===")
    print(f"evidence_linking_rate: {evidence_linking_rate:.3f}")
    print(f"missing_evidence_rate: {missing_evidence_rate:.3f}")
    print(f"orphan_evidence_rate: {orphan_evidence_rate:.3f}")
    print(f"validation_passed: {validation_passed}")
    print()
    print("=== Counts ===")
    print(f"# FINAL insights: {n_final}")
    print(f"# evidence_items: {n_evidence}")
    print(f"# orphan evidence: {n_orphans}")


def main():
    parser = argparse.ArgumentParser(description="Measure evidence chain metrics from Ads bundle")
    parser.add_argument("--scan-id", type=str, help="Scan ID to load from database")
    parser.add_argument("--bundle-file", type=str, help="Path to bundle JSON file")
    
    args = parser.parse_args()
    
    if args.scan_id:
        measure_from_scan_id(args.scan_id)
    elif args.bundle_file:
        measure_from_bundle_file(args.bundle_file)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

