#!/usr/bin/env python3
"""
Shadow Evaluation: Evidence Quality/Reliability Thresholds (Lever 2)

HOW TO RUN:
From repo root:
    python -m accuracy.shadow_evidence_quality_eval

From backend directory:
    python accuracy/shadow_evidence_quality_eval.py

This script performs a read-only evaluation of evidence quality/reliability rules.
It does NOT modify production behavior, bundles, or decision paths.

It evaluates candidate quality-based rules:
- Rule A: PRELIMINARY with high_reliability_count == 0 → recommend ABSTAIN
- Rule B: FINAL with high_reliability_count < 1 → recommend PRELIMINARY
- Rule C: PRELIMINARY with high_reliability_count == 0 AND medium_reliability_count < 2 → recommend ABSTAIN
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

# Add backend to path for imports
BACKEND_DIR = Path(__file__).parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from accuracy.schema import get_tab_accuracy_contract


@dataclass
class QualityMetrics:
    """Evidence quality metrics for a single insight."""
    high_reliability_count: int
    medium_reliability_count: int
    low_reliability_count: int
    total_unique_support: int
    computation_reliable: bool
    missing_data_reason: Optional[str] = None


def compute_quality_metrics(
    bundle: Dict[str, Any],
    insight: Dict[str, Any]
) -> QualityMetrics:
    """
    Compute evidence quality metrics for a single insight.
    
    Returns QualityMetrics with reliability tier counts.
    """
    bundle_data = bundle.get("bundle", bundle)
    evidence_items = bundle_data.get("evidence_items", {})
    
    # Get supporting evidence IDs from insight
    support_evidence_ids = insight.get("evidence_ids", [])
    
    # Deduplicate supporting evidence (same logic as shadow_prelim_abstain_eval)
    seen = set()
    unique_support_items = []
    for ev_id in support_evidence_ids:
        ev = evidence_items.get(ev_id, {})
        source_idx = ev.get("source_item_index") or ev.get("item_context", {}).get("item_index")
        signal_type = ev.get("signal_type", "")
        signal_subtype = ev.get("signal_subtype", "")
        detection_method = ev.get("detection_method", "")
        
        dedup_key = (source_idx, f"{signal_type}:{signal_subtype}", detection_method)
        if dedup_key not in seen:
            seen.add(dedup_key)
            unique_support_items.append(ev)
    
    # Compute quality mix
    high_count = 0
    medium_count = 0
    low_count = 0
    
    for ev in unique_support_items:
        method_rel = ev.get("method_reliability", {})
        reliability = (
            method_rel.get("effective_reliability")
            or method_rel.get("base_reliability")
            or 0.0
        )
        if reliability >= 0.80:
            high_count += 1
        elif reliability >= 0.50:
            medium_count += 1
        else:
            low_count += 1
    
    return QualityMetrics(
        high_reliability_count=high_count,
        medium_reliability_count=medium_count,
        low_reliability_count=low_count,
        total_unique_support=len(unique_support_items),
        computation_reliable=True,
        missing_data_reason=None,
    )


def apply_quality_rule(
    metrics: QualityMetrics,
    actual_status: str,
    rule_name: str
) -> Tuple[Optional[str], str]:
    """
    Apply evidence quality rule variant.
    
    Returns: (recommended_status, reason)
    - recommended_status: New status if rule triggers, None if not applicable
    - reason: Explanation of rule application
    """
    if rule_name == "A":
        # Rule A: PRELIMINARY with high_reliability_count == 0 → recommend ABSTAIN
        if actual_status == "PRELIMINARY" and metrics.high_reliability_count == 0:
            reason = (
                f"quality_rule_A: PRELIMINARY with 0 high-reliability evidence -> ABSTAIN "
                f"(high={metrics.high_reliability_count}, medium={metrics.medium_reliability_count}, "
                f"low={metrics.low_reliability_count})"
            )
            return ("ABSTAIN", reason)
        else:
            return (None, f"Not applicable: actual_status={actual_status} or high_count={metrics.high_reliability_count} > 0")
    
    elif rule_name == "B":
        # Rule B: FINAL with high_reliability_count < 1 → recommend PRELIMINARY
        if actual_status == "FINAL" and metrics.high_reliability_count < 1:
            reason = (
                f"quality_rule_B: FINAL with high_reliability_count < 1 -> PRELIMINARY "
                f"(high={metrics.high_reliability_count}, medium={metrics.medium_reliability_count}, "
                f"low={metrics.low_reliability_count})"
            )
            return ("PRELIMINARY", reason)
        else:
            return (None, f"Not applicable: actual_status={actual_status} or high_count={metrics.high_reliability_count} >= 1")
    
    elif rule_name == "C":
        # Rule C: PRELIMINARY with high_reliability_count == 0 AND medium_reliability_count < 2 → recommend ABSTAIN
        if actual_status == "PRELIMINARY" and metrics.high_reliability_count == 0 and metrics.medium_reliability_count < 2:
            reason = (
                f"quality_rule_C: PRELIMINARY with 0 high-reliability AND < 2 medium-reliability -> ABSTAIN "
                f"(high={metrics.high_reliability_count}, medium={metrics.medium_reliability_count}, "
                f"low={metrics.low_reliability_count})"
            )
            return ("ABSTAIN", reason)
        else:
            return (None, f"Not applicable: actual_status={actual_status} or (high_count={metrics.high_reliability_count} > 0 or medium_count={metrics.medium_reliability_count} >= 2)")
    
    else:
        return (None, f"Unknown rule: {rule_name}")


def load_labels_and_bundles(run_dir: Path) -> List[Dict[str, Any]]:
    """Load labels and corresponding bundles."""
    labels_file = run_dir / "labels_v0.json"
    with open(labels_file, 'r', encoding='utf-8') as f:
        labels_data = json.load(f)
    
    items = []
    for item in labels_data.get("items", []):
        bundle_file = run_dir / item["bundle_file"]
        try:
            with open(bundle_file, 'r', encoding='utf-8') as f:
                bundle = json.load(f)
            item["bundle_data"] = bundle
            items.append(item)
        except Exception as e:
            print(f"Warning: Could not load {bundle_file}: {e}", file=sys.stderr)
            item["bundle_data"] = None
            items.append(item)
    
    return items


def evaluate_item(
    item: Dict[str, Any],
    rule_name: str
) -> Dict[str, Any]:
    """Evaluate a single item with quality rule."""
    bundle = item.get("bundle_data")
    
    if not bundle:
        return {
            "error": "Bundle not loaded",
            "scan_id": item.get("scan_id", "?"),
            "tab": item.get("tab", "?"),
        }
    
    # Get main insight
    bundle_data = bundle.get("bundle", bundle)
    insights = bundle_data.get("insights", [])
    main_insight = insights[0] if insights else {}
    
    # Get actual status
    actual_status = main_insight.get("claim_status", "UNKNOWN")
    
    # Compute quality metrics
    metrics = compute_quality_metrics(bundle, main_insight)
    
    # Apply rule
    shadow_recommended, rule_reason = apply_quality_rule(metrics, actual_status, rule_name)
    
    # Ground truth
    gt = item.get("ground_truth", {})
    should_abstain = gt.get("should_have_abstained")
    is_correct = gt.get("is_main_claim_correct")
    
    # Determine flip classification
    if shadow_recommended and shadow_recommended != actual_status:
        # This would be a flip
        if actual_status == "PRELIMINARY" and shadow_recommended == "ABSTAIN":
            # PRELIMINARY → ABSTAIN flip
            if should_abstain == "yes":
                flip_classification = "good_flip"
            elif should_abstain == "no":
                flip_classification = "bad_flip"
            else:
                flip_classification = "unknown_flip"
        elif actual_status == "FINAL" and shadow_recommended == "PRELIMINARY":
            # FINAL → PRELIMINARY downgrade
            if is_correct == "yes":
                # Claim is correct, but downgrade might be appropriate
                flip_classification = "neutral_downgrade"
            else:
                flip_classification = "bad_flip"
        else:
            flip_classification = "unknown_flip"
    else:
        flip_classification = "no_flip"
    
    return {
        "scan_id": item.get("scan_id", "?"),
        "tab": item.get("tab", "?"),
        "should_have_abstained": should_abstain,
        "is_main_claim_correct": is_correct,
        "actual_status": actual_status,
        "high_reliability_count": metrics.high_reliability_count,
        "medium_reliability_count": metrics.medium_reliability_count,
        "low_reliability_count": metrics.low_reliability_count,
        "total_unique_support": metrics.total_unique_support,
        "shadow_recommended": shadow_recommended,
        "rule_reason": rule_reason,
        "flip_classification": flip_classification,
        "computation_reliable": metrics.computation_reliable,
        "missing_data_reason": metrics.missing_data_reason,
    }


def compute_metrics(evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute aggregate metrics from evaluations."""
    total = len(evaluations)
    if total == 0:
        return {}
    
    # Count flips
    good_flips = sum(1 for e in evaluations if e.get("flip_classification") == "good_flip")
    bad_flips = sum(1 for e in evaluations if e.get("flip_classification") == "bad_flip")
    neutral_downgrades = sum(1 for e in evaluations if e.get("flip_classification") == "neutral_downgrade")
    unknown_flips = sum(1 for e in evaluations if e.get("flip_classification") == "unknown_flip")
    total_flips = good_flips + bad_flips + neutral_downgrades + unknown_flips
    
    # Count shadow recommendations
    shadow_abstain = sum(1 for e in evaluations if e.get("shadow_recommended") == "ABSTAIN")
    shadow_preliminary = sum(1 for e in evaluations if e.get("shadow_recommended") == "PRELIMINARY")
    
    # Focus on PRELIMINARY cases (3 total)
    preliminary_cases = [e for e in evaluations if e.get("actual_status") == "PRELIMINARY"]
    preliminary_flips = [e for e in preliminary_cases if e.get("shadow_recommended") and e.get("shadow_recommended") != "PRELIMINARY"]
    
    # Ground truth scoring
    should_abstain_yes = [e for e in evaluations if e.get("should_have_abstained") == "yes"]
    should_abstain_no = [e for e in evaluations if e.get("should_have_abstained") == "no"]
    
    if should_abstain_yes:
        appropriate_abstention = sum(
            1 for e in should_abstain_yes
            if e.get("shadow_recommended") == "ABSTAIN" or e.get("actual_status") == "ABSTAIN"
        ) / len(should_abstain_yes)
    else:
        appropriate_abstention = None
    
    if should_abstain_no:
        false_abstention = sum(
            1 for e in should_abstain_no
            if e.get("shadow_recommended") == "ABSTAIN"
        ) / len(should_abstain_no)
    else:
        false_abstention = None
    
    # Accuracy check: count incorrect claims
    incorrect_claims = sum(1 for e in evaluations if e.get("is_main_claim_correct") == "no")
    
    # Current actual status counts
    actual_abstain = sum(1 for e in evaluations if e.get("actual_status") == "ABSTAIN")
    actual_preliminary = sum(1 for e in evaluations if e.get("actual_status") == "PRELIMINARY")
    actual_final = sum(1 for e in evaluations if e.get("actual_status") == "FINAL")
    
    return {
        "total_items": total,
        "preliminary_cases": len(preliminary_cases),
        "preliminary_flips": len(preliminary_flips),
        "actual": {
            "abstain_count": actual_abstain,
            "preliminary_count": actual_preliminary,
            "final_count": actual_final,
            "abstain_rate": actual_abstain / total if total > 0 else 0,
        },
        "shadow": {
            "abstain_count": shadow_abstain,
            "preliminary_count": shadow_preliminary,
            "abstain_rate": shadow_abstain / total if total > 0 else 0,
        },
        "flips": {
            "good_flips": good_flips,
            "bad_flips": bad_flips,
            "neutral_downgrades": neutral_downgrades,
            "unknown_flips": unknown_flips,
            "total_flips": total_flips,
        },
        "ground_truth": {
            "appropriate_abstention_rate": appropriate_abstention,
            "false_abstention_rate": false_abstention,
            "incorrect_claims": incorrect_claims,
        },
    }


def check_guardrails(metrics: Dict[str, Any]) -> Dict[str, bool]:
    """Check guardrails against baseline metrics."""
    baseline_accuracy = 1.000  # 100% (0 incorrect claims)
    baseline_false_abstention = 0.000  # 0%
    
    shadow_false_abstention = metrics.get("ground_truth", {}).get("false_abstention_rate")
    incorrect_claims = metrics.get("ground_truth", {}).get("incorrect_claims", 0)
    
    # Accuracy guardrail: Must remain 100% (no new incorrect claims)
    accuracy_ok = incorrect_claims == 0
    
    # False abstention guardrail: Must remain 0%
    false_abstention_ok = (
        shadow_false_abstention is not None
        and shadow_false_abstention <= baseline_false_abstention
    )
    
    return {
        "accuracy_guardrail": accuracy_ok,
        "false_abstention_guardrail": false_abstention_ok,
    }


def generate_report(
    evaluations_a: List[Dict[str, Any]],
    evaluations_b: List[Dict[str, Any]],
    evaluations_c: List[Dict[str, Any]],
    metrics_a: Dict[str, Any],
    metrics_b: Dict[str, Any],
    metrics_c: Dict[str, Any],
    guardrails_a: Dict[str, bool],
    guardrails_b: Dict[str, bool],
    guardrails_c: Dict[str, bool],
) -> str:
    """Generate markdown report."""
    lines = []
    lines.append("# Shadow Evaluation: Evidence Quality/Reliability Thresholds")
    lines.append("")
    lines.append("**Date:** Generated by shadow evaluation script")
    lines.append("**Status:** Read-only evaluation (no behavior changes)")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Summary Table: Candidate Rules")
    lines.append("")
    lines.append("| Rule | Description | Flips (Good/Bad/Neutral) | Shadow Abstain Rate | False Abstention | Guardrails |")
    lines.append("|------|-------------|--------------------------|-------------------|------------------|------------|")
    
    # Rule A
    flips_a = metrics_a.get("flips", {})
    guardrail_status_a = "[PASS]" if all(guardrails_a.values()) else "[FAIL]"
    lines.append(
        f"| Rule A | PRELIMINARY with high_reliability_count == 0 -> ABSTAIN | "
        f"{flips_a.get('good_flips', 0)}/{flips_a.get('bad_flips', 0)}/{flips_a.get('neutral_downgrades', 0)} | "
        f"{metrics_a.get('shadow', {}).get('abstain_rate', 0):.2%} | "
        f"{metrics_a.get('ground_truth', {}).get('false_abstention_rate', 0):.2%} | "
        f"{guardrail_status_a} |"
    )
    
    # Rule B
    flips_b = metrics_b.get("flips", {})
    guardrail_status_b = "[PASS]" if all(guardrails_b.values()) else "[FAIL]"
    lines.append(
        f"| Rule B | FINAL with high_reliability_count < 1 -> PRELIMINARY | "
        f"{flips_b.get('good_flips', 0)}/{flips_b.get('bad_flips', 0)}/{flips_b.get('neutral_downgrades', 0)} | "
        f"{metrics_b.get('shadow', {}).get('abstain_rate', 0):.2%} | "
        f"{metrics_b.get('ground_truth', {}).get('false_abstention_rate', 0):.2%} | "
        f"{guardrail_status_b} |"
    )
    
    # Rule C
    flips_c = metrics_c.get("flips", {})
    guardrail_status_c = "[PASS]" if all(guardrails_c.values()) else "[FAIL]"
    lines.append(
        f"| Rule C | PRELIMINARY with high==0 AND medium<2 -> ABSTAIN | "
        f"{flips_c.get('good_flips', 0)}/{flips_c.get('bad_flips', 0)}/{flips_c.get('neutral_downgrades', 0)} | "
        f"{metrics_c.get('shadow', {}).get('abstain_rate', 0):.2%} | "
        f"{metrics_c.get('ground_truth', {}).get('false_abstention_rate', 0):.2%} | "
        f"{guardrail_status_c} |"
    )
    
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Per-Item Breakdown: PRELIMINARY Cases (3 items)")
    lines.append("")
    lines.append("| Scan ID | Tab | Should Abstain | Actual | High | Med | Low | Shadow (A) | Shadow (B) | Shadow (C) | Rule Trigger | Flip Classification |")
    lines.append("|---------|-----|----------------|--------|------|-----|-----|------------|------------|------------|--------------|----------------------|")
    
    # Focus on PRELIMINARY cases
    preliminary_items = [e for e in evaluations_a if e.get("actual_status") == "PRELIMINARY"]
    
    for eval_a in preliminary_items:
        scan_id = eval_a.get("scan_id", "")[:20]  # Truncate
        tab = eval_a.get("tab", "")
        should_abstain = eval_a.get("should_have_abstained", "?")
        actual = eval_a.get("actual_status", "")
        high = eval_a.get("high_reliability_count", 0)
        med = eval_a.get("medium_reliability_count", 0)
        low = eval_a.get("low_reliability_count", 0)
        shadow_a = eval_a.get("shadow_recommended", "-")
        # Find matching evaluations for B and C
        eval_b = next(
            (e for e in evaluations_b if e.get("scan_id") == eval_a.get("scan_id") and e.get("tab") == eval_a.get("tab")),
            None
        )
        eval_c = next(
            (e for e in evaluations_c if e.get("scan_id") == eval_a.get("scan_id") and e.get("tab") == eval_a.get("tab")),
            None
        )
        shadow_b = eval_b.get("shadow_recommended", "-") if eval_b else "-"
        shadow_c = eval_c.get("shadow_recommended", "-") if eval_c else "-"
        rule = eval_a.get("rule_reason", "")[:40]  # Truncate
        flip = eval_a.get("flip_classification", "")
        
        lines.append(
            f"| {scan_id} | {tab} | {should_abstain} | {actual} | {high} | {med} | {low} | "
            f"{shadow_a} | {shadow_b} | {shadow_c} | {rule} | {flip} |"
        )
    
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Guardrails Check")
    lines.append("")
    
    for rule_name, guardrails, metrics in [
        ("Rule A", guardrails_a, metrics_a),
        ("Rule B", guardrails_b, metrics_b),
        ("Rule C", guardrails_c, metrics_c),
    ]:
        all_pass = all(guardrails.values())
        status = "[PASS]" if all_pass else "[FAIL]"
        lines.append(f"### {rule_name}: {status}")
        lines.append("")
        for guardrail_name, passed in guardrails.items():
            status_icon = "[PASS]" if passed else "[FAIL]"
            lines.append(f"- {status_icon} {guardrail_name}: {'PASS' if passed else 'FAIL'}")
        lines.append("")
    
    lines.append("---")
    lines.append("")
    lines.append("## Recommendation")
    lines.append("")
    
    # Determine recommendation based on results
    all_rules_pass = (
        all(guardrails_a.values()) and
        all(guardrails_b.values()) and
        all(guardrails_c.values())
    )
    
    # Check if any rule has good flips without bad flips
    rule_a_safe = (
        all(guardrails_a.values()) and
        metrics_a.get("flips", {}).get("good_flips", 0) > 0 and
        metrics_a.get("flips", {}).get("bad_flips", 0) == 0
    )
    rule_c_safe = (
        all(guardrails_c.values()) and
        metrics_c.get("flips", {}).get("good_flips", 0) > 0 and
        metrics_c.get("flips", {}).get("bad_flips", 0) == 0
    )
    
    if rule_a_safe:
        lines.append("**Safe to enforce for PRELIMINARY only (Rule A)**")
        lines.append("")
        lines.append("Rule A shows good flips without bad flips, and all guardrails pass.")
        lines.append("This rule would downgrade PRELIMINARY claims with no high-reliability evidence to ABSTAIN.")
        lines.append("Recommendation: Implement Rule A in critic for PRELIMINARY insights only.")
    elif rule_c_safe:
        lines.append("**Safe to enforce for PRELIMINARY only (Rule C)**")
        lines.append("")
        lines.append("Rule C shows good flips without bad flips, and all guardrails pass.")
        lines.append("This rule is more conservative than Rule A, requiring both no high-reliability AND < 2 medium-reliability.")
        lines.append("Recommendation: Implement Rule C in critic for PRELIMINARY insights only.")
    elif all_rules_pass and metrics_a.get("flips", {}).get("total_flips", 0) == 0:
        lines.append("**No enforcement needed**")
        lines.append("")
        lines.append("All rules pass guardrails, but no flips occur. Current system behavior is already optimal.")
    else:
        lines.append("**No enforcement recommended at this time**")
        lines.append("")
        lines.append("One or more guardrails fail, or flips would introduce regressions.")
        lines.append("Recommendation: Review rule thresholds or wait for additional ground truth data.")
    
    lines.append("")
    
    return "\n".join(lines)


def main():
    """Main evaluation function."""
    # Paths
    run_dir = BACKEND_DIR / "eval" / "gt_runs" / "20260108_012303"
    reports_dir = BACKEND_DIR / "accuracy" / "reports"
    reports_dir.mkdir(exist_ok=True)
    
    print("Loading labels and bundles...")
    items = load_labels_and_bundles(run_dir)
    print(f"Loaded {len(items)} items")
    
    # Evaluate with all three rules
    print("\nEvaluating Rule A (PRELIMINARY with high==0 -> ABSTAIN)...")
    evaluations_a = []
    for item in items:
        eval_result = evaluate_item(item, "A")
        evaluations_a.append(eval_result)
    
    metrics_a = compute_metrics(evaluations_a)
    guardrails_a = check_guardrails(metrics_a)
    
    print(f"  Good flips: {metrics_a.get('flips', {}).get('good_flips', 0)}")
    print(f"  Bad flips: {metrics_a.get('flips', {}).get('bad_flips', 0)}")
    print(f"  PRELIMINARY cases: {metrics_a.get('preliminary_cases', 0)}")
    print(f"  Guardrails: {'[PASS]' if all(guardrails_a.values()) else '[FAIL]'}")
    
    print("\nEvaluating Rule B (FINAL with high<1 -> PRELIMINARY)...")
    evaluations_b = []
    for item in items:
        eval_result = evaluate_item(item, "B")
        evaluations_b.append(eval_result)
    
    metrics_b = compute_metrics(evaluations_b)
    guardrails_b = check_guardrails(metrics_b)
    
    print(f"  Good flips: {metrics_b.get('flips', {}).get('good_flips', 0)}")
    print(f"  Bad flips: {metrics_b.get('flips', {}).get('bad_flips', 0)}")
    print(f"  Neutral downgrades: {metrics_b.get('flips', {}).get('neutral_downgrades', 0)}")
    print(f"  Guardrails: {'[PASS]' if all(guardrails_b.values()) else '[FAIL]'}")
    
    print("\nEvaluating Rule C (PRELIMINARY with high==0 AND medium<2 -> ABSTAIN)...")
    evaluations_c = []
    for item in items:
        eval_result = evaluate_item(item, "C")
        evaluations_c.append(eval_result)
    
    metrics_c = compute_metrics(evaluations_c)
    guardrails_c = check_guardrails(metrics_c)
    
    print(f"  Good flips: {metrics_c.get('flips', {}).get('good_flips', 0)}")
    print(f"  Bad flips: {metrics_c.get('flips', {}).get('bad_flips', 0)}")
    print(f"  PRELIMINARY cases: {metrics_c.get('preliminary_cases', 0)}")
    print(f"  Guardrails: {'[PASS]' if all(guardrails_c.values()) else '[FAIL]'}")
    
    # Generate report
    print("\nGenerating report...")
    report_md = generate_report(
        evaluations_a, evaluations_b, evaluations_c,
        metrics_a, metrics_b, metrics_c,
        guardrails_a, guardrails_b, guardrails_c
    )
    
    report_file = reports_dir / "shadow_evidence_quality_v0.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report_md)
    print(f"Report written to: {report_file}")
    
    # Also save JSON
    json_data = {
        "rule_a": {
            "description": "PRELIMINARY with high_reliability_count == 0 -> ABSTAIN",
            "evaluations": evaluations_a,
            "metrics": metrics_a,
            "guardrails": guardrails_a,
        },
        "rule_b": {
            "description": "FINAL with high_reliability_count < 1 -> PRELIMINARY",
            "evaluations": evaluations_b,
            "metrics": metrics_b,
            "guardrails": guardrails_b,
        },
        "rule_c": {
            "description": "PRELIMINARY with high==0 AND medium<2 -> ABSTAIN",
            "evaluations": evaluations_c,
            "metrics": metrics_c,
            "guardrails": guardrails_c,
        },
    }
    json_file = reports_dir / "shadow_evidence_quality_v0.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    print(f"JSON written to: {json_file}")
    
    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print("\nRule A:")
    print(f"  Good flips: {metrics_a.get('flips', {}).get('good_flips', 0)}")
    print(f"  Bad flips: {metrics_a.get('flips', {}).get('bad_flips', 0)}")
    print(f"  Guardrails: {'[PASS]' if all(guardrails_a.values()) else '[FAIL]'}")
    print("\nRule B:")
    print(f"  Good flips: {metrics_b.get('flips', {}).get('good_flips', 0)}")
    print(f"  Bad flips: {metrics_b.get('flips', {}).get('bad_flips', 0)}")
    print(f"  Guardrails: {'[PASS]' if all(guardrails_b.values()) else '[FAIL]'}")
    print("\nRule C:")
    print(f"  Good flips: {metrics_c.get('flips', {}).get('good_flips', 0)}")
    print(f"  Bad flips: {metrics_c.get('flips', {}).get('bad_flips', 0)}")
    print(f"  Guardrails: {'[PASS]' if all(guardrails_c.values()) else '[FAIL]'}")
    print("\nDone.")


if __name__ == "__main__":
    main()

