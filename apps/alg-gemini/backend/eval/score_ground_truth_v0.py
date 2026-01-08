#!/usr/bin/env python3
"""Score ground truth labels against predicted outputs."""

import json
import sys
import argparse
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any

def load_labels(run_dir: Path) -> Dict[str, Any]:
    """Load labels_v0.json from run directory."""
    labels_file = run_dir / "labels_v0.json"
    if not labels_file.exists():
        raise FileNotFoundError(f"labels_v0.json not found in {run_dir}")
    
    with open(labels_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_bundle(run_dir: Path, bundle_file: str) -> Dict[str, Any]:
    """Load bundle JSON file."""
    bundle_path = run_dir / bundle_file
    if not bundle_path.exists():
        raise FileNotFoundError(f"Bundle file not found: {bundle_path}")
    
    with open(bundle_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_insight_statuses(bundle: Dict[str, Any]) -> Dict[str, int]:
    """Count insight statuses from bundle."""
    insights = bundle.get("bundle", {}).get("insights", [])
    statuses = {"FINAL": 0, "PRELIMINARY": 0, "ABSTAIN": 0}
    for insight in insights:
        status = insight.get("claim_status", "").upper()
        if status in statuses:
            statuses[status] += 1
    return statuses

def has_abstain(bundle: Dict[str, Any]) -> bool:
    """Check if bundle has any ABSTAIN insights."""
    insights = bundle.get("bundle", {}).get("insights", [])
    return any(insight.get("claim_status", "").upper() == "ABSTAIN" for insight in insights)

def compute_metrics(labels_data: Dict[str, Any], run_dir: Path) -> Dict[str, Any]:
    """Compute accuracy and abstention metrics."""
    items = labels_data.get("items", [])
    
    # Overall metrics
    total_items = len(items)
    accuracy_items = []  # (is_correct, should_abstain, model_abstained, has_final, severity)
    tab_metrics = defaultdict(lambda: {
        "total": 0,
        "accuracy_items": [],
        "abstention_items": [],
        "final_items": []
    })
    
    for item in items:
        scan_id = item["scan_id"]
        tab = item["tab"]
        bundle_file = item["bundle_file"]
        predicted = item["predicted"]
        ground_truth = item["ground_truth"]
        
        is_correct = ground_truth.get("is_main_claim_correct")
        should_abstain = ground_truth.get("should_have_abstained")
        
        # Load bundle to check actual statuses
        try:
            bundle = load_bundle(run_dir, bundle_file)
            statuses = get_insight_statuses(bundle)
            model_abstained = has_abstain(bundle)
            has_final = statuses["FINAL"] > 0
        except Exception as e:
            print(f"Warning: Could not load {bundle_file}: {e}", file=sys.stderr)
            statuses = {"FINAL": 0, "PRELIMINARY": 0, "ABSTAIN": 0}
            model_abstained = False
            has_final = predicted.get("claim_status", "").upper() == "FINAL"
        
        severity = ground_truth.get("severity_if_wrong", "").lower()
        
        # Track for overall metrics
        if is_correct is not None and isinstance(is_correct, str) and is_correct.lower() in ["yes", "no"]:
            accuracy_items.append((
                is_correct.lower() == "yes",
                should_abstain,
                model_abstained,
                has_final,
                severity
            ))
        
        # Track per-tab
        tab_metrics[tab]["total"] += 1
        if is_correct is not None and isinstance(is_correct, str) and is_correct.lower() in ["yes", "no"]:
            tab_metrics[tab]["accuracy_items"].append(is_correct.lower() == "yes")
        if should_abstain is not None and isinstance(should_abstain, str):
            tab_metrics[tab]["abstention_items"].append((
                should_abstain.lower() == "yes",
                model_abstained
            ))
        tab_metrics[tab]["final_items"].append(has_final)
    
    # Compute overall metrics
    accuracy_yes_count = sum(1 for x in accuracy_items if x[0])
    accuracy_total = len(accuracy_items)
    accuracy_yes_rate = accuracy_yes_count / accuracy_total if accuracy_total > 0 else None
    
    # Abstention appropriateness
    should_abstain_yes = [x for x in accuracy_items if x[1] and isinstance(x[1], str) and x[1].lower() == "yes"]
    should_abstain_no = [x for x in accuracy_items if x[1] and isinstance(x[1], str) and x[1].lower() == "no"]
    
    appropriate_abstain_rate = None
    if should_abstain_yes:
        model_abstained_count = sum(1 for x in should_abstain_yes if x[2])
        appropriate_abstain_rate = model_abstained_count / len(should_abstain_yes)
    
    false_abstain_rate = None
    if should_abstain_no:
        model_abstained_count = sum(1 for x in should_abstain_no if x[2])
        false_abstain_rate = model_abstained_count / len(should_abstain_no)
    
    # Coverage (FINAL rate)
    coverage_final_rate = sum(1 for x in accuracy_items if x[3]) / accuracy_total if accuracy_total > 0 else None
    
    # Incorrect high severity
    incorrect_high_severity = [
        item for item in items
        if isinstance(item["ground_truth"].get("is_main_claim_correct"), str)
        and item["ground_truth"].get("is_main_claim_correct", "").lower() == "no"
        and isinstance(item["ground_truth"].get("severity_if_wrong"), str)
        and item["ground_truth"].get("severity_if_wrong", "").lower() == "high"
    ]
    incorrect_high_severity_count = len(incorrect_high_severity)
    
    # Compute per-tab metrics
    tab_results = {}
    for tab, metrics in tab_metrics.items():
        acc_items = metrics["accuracy_items"]
        acc_rate = sum(acc_items) / len(acc_items) if acc_items else None
        
        abst_items = metrics["abstention_items"]
        should_yes = [x for x in abst_items if x[0] is True]
        should_no = [x for x in abst_items if x[0] is False]
        
        appropriate_abst = None
        if should_yes:
            model_abst = sum(1 for x in should_yes if x[1])
            appropriate_abst = model_abst / len(should_yes)
        
        false_abst = None
        if should_no:
            model_abst = sum(1 for x in should_no if x[1])
            false_abst = model_abst / len(should_no)
        
        final_rate = sum(metrics["final_items"]) / len(metrics["final_items"]) if metrics["final_items"] else None
        
        tab_results[tab] = {
            "total": metrics["total"],
            "accuracy_yes_rate": acc_rate,
            "appropriate_abstention_rate": appropriate_abst,
            "false_abstention_rate": false_abst,
            "coverage_final_rate": final_rate
        }
    
    return {
        "overall": {
            "total_items": total_items,
            "accuracy_yes_rate": accuracy_yes_rate,
            "appropriate_abstention_rate": appropriate_abstain_rate,
            "false_abstention_rate": false_abstain_rate,
            "coverage_final_rate": coverage_final_rate,
            "incorrect_high_severity_count": incorrect_high_severity_count
        },
        "per_tab": tab_results,
        "incorrect_items": [
            {
                "scan_id": item["scan_id"],
                "tab": item["tab"],
                "severity": item["ground_truth"].get("severity_if_wrong", ""),
                "model_status": item["predicted"].get("claim_status"),
                "evidence_len": item["predicted"].get("evidence_ids_len", 0),
                "what_is_wrong": item["ground_truth"].get("what_is_wrong", "")
            }
            for item in items
            if isinstance(item["ground_truth"].get("is_main_claim_correct"), str)
            and item["ground_truth"].get("is_main_claim_correct", "").lower() == "no"
        ]
    }

def print_report(results: Dict[str, Any]):
    """Print formatted report."""
    overall = results["overall"]
    per_tab = results["per_tab"]
    incorrect_items = results["incorrect_items"]
    
    print("=" * 80)
    print("GROUND TRUTH SCORING REPORT")
    print("=" * 80)
    print()
    
    print("OVERALL METRICS")
    print("-" * 80)
    print(f"Total items: {overall['total_items']}")
    if overall['accuracy_yes_rate'] is not None:
        print(f"Accuracy (yes rate): {overall['accuracy_yes_rate']:.2%} ({overall['accuracy_yes_rate']:.3f})")
    else:
        print("Accuracy (yes rate): N/A (no labeled items)")
    
    if overall['appropriate_abstention_rate'] is not None:
        print(f"Appropriate abstention rate: {overall['appropriate_abstention_rate']:.2%} ({overall['appropriate_abstention_rate']:.3f})")
    else:
        print("Appropriate abstention rate: N/A")
    
    if overall['false_abstention_rate'] is not None:
        print(f"False abstention rate: {overall['false_abstention_rate']:.2%} ({overall['false_abstention_rate']:.3f})")
    else:
        print("False abstention rate: N/A")
    
    if overall['coverage_final_rate'] is not None:
        print(f"Coverage (FINAL rate): {overall['coverage_final_rate']:.2%} ({overall['coverage_final_rate']:.3f})")
    else:
        print("Coverage (FINAL rate): N/A")
    
    print(f"Incorrect high severity count: {overall['incorrect_high_severity_count']}")
    print()
    
    print("PER-TAB METRICS")
    print("-" * 80)
    print(f"{'Tab':<15} {'Total':<8} {'Acc Rate':<12} {'Appr Abst':<12} {'False Abst':<12} {'FINAL Rate':<12}")
    print("-" * 80)
    for tab in sorted(per_tab.keys()):
        m = per_tab[tab]
        acc_str = f"{m['accuracy_yes_rate']:.2%}" if m['accuracy_yes_rate'] is not None else "N/A"
        appr_str = f"{m['appropriate_abstention_rate']:.2%}" if m['appropriate_abstention_rate'] is not None else "N/A"
        false_str = f"{m['false_abstention_rate']:.2%}" if m['false_abstention_rate'] is not None else "N/A"
        final_str = f"{m['coverage_final_rate']:.2%}" if m['coverage_final_rate'] is not None else "N/A"
        print(f"{tab:<15} {m['total']:<8} {acc_str:<12} {appr_str:<12} {false_str:<12} {final_str:<12}")
    print()
    
    print("WORST CASES (Incorrect Claims)")
    print("-" * 80)
    if not incorrect_items:
        print("No incorrect claims found (all labeled as 'yes' or 'unsure').")
    else:
        # Sort by severity (high > med > low) then by evidence_len (descending)
        severity_order = {"high": 3, "med": 2, "low": 1, "": 0}
        sorted_items = sorted(
            incorrect_items,
            key=lambda x: (severity_order.get(x.get("severity", "").lower(), 0), -x.get("evidence_len", 0)),
            reverse=True
        )
        
        top_n = min(10, len(sorted_items))
        print(f"Showing top {top_n} worst cases:")
        print()
        print(f"{'Scan ID':<35} {'Tab':<12} {'Severity':<10} {'Status':<12} {'Ev Len':<8} {'Issue':<30}")
        print("-" * 80)
        for item in sorted_items[:top_n]:
            scan_short = item['scan_id'][:33] + ".." if len(item['scan_id']) > 35 else item['scan_id']
            what_wrong = item.get('what_is_wrong', '')[:28] + ".." if len(item.get('what_is_wrong', '')) > 30 else item.get('what_is_wrong', '')
            print(f"{scan_short:<35} {item['tab']:<12} {item.get('severity', ''):<10} {item.get('model_status', ''):<12} {item.get('evidence_len', 0):<8} {what_wrong:<30}")
    print()
    print("=" * 80)

def main():
    parser = argparse.ArgumentParser(description="Score ground truth labels")
    parser.add_argument("--run", required=True, help="Run directory name (e.g., 20260108_012303)")
    args = parser.parse_args()
    
    eval_dir = Path(__file__).parent
    run_dir = eval_dir / "gt_runs" / args.run
    
    if not run_dir.exists():
        print(f"Error: Run directory not found: {run_dir}", file=sys.stderr)
        sys.exit(1)
    
    try:
        labels_data = load_labels(run_dir)
        results = compute_metrics(labels_data, run_dir)
        print_report(results)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

