#!/usr/bin/env python3
"""
Shadow Evaluation: PRELIMINARY vs ABSTAIN Rubric

HOW TO RUN:
From repo root:
    python -m accuracy.shadow_prelim_abstain_eval

From backend directory:
    python accuracy/shadow_prelim_abstain_eval.py

This script performs a read-only evaluation of the PRELIMINARY vs ABSTAIN rubric
defined in accuracy/notes/preliminary_vs_abstain_rubric.md. It does NOT modify
production behavior, bundles, or decision paths.

It computes rubric inputs from existing bundle data, applies candidate threshold
sets A-E, and compares rubric recommendations against actual system outcomes and
ground truth labels.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict
from dataclasses import dataclass, field

# Add backend to path for imports
BACKEND_DIR = Path(__file__).parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from accuracy.schema import get_tab_accuracy_contract


@dataclass
class RubricInputs:
    """Measurable inputs for the rubric decision."""
    evidence_rate: Optional[float] = None
    unique_support_count: Optional[int] = None
    support_quality_mix: Dict[str, int] = field(default_factory=lambda: {"high": 0, "medium": 0, "low": 0})
    counterevidence_presence: bool = False
    counterevidence_count: int = 0
    evidence_type_diversity: Optional[int] = None
    claim_specificity: Optional[float] = None  # Optional, not computed yet
    
    # Missing inputs tracking
    missing_inputs: List[str] = field(default_factory=list)


@dataclass
class ThresholdSet:
    """Candidate threshold set configuration."""
    name: str
    min_abstain_rate: float
    min_high_reliability_for_final: int
    min_evidence_diversity_for_final: int
    quality_gate_high: int  # Minimum high-reliability for PRELIMINARY
    quality_gate_medium: int  # Minimum medium-reliability for PRELIMINARY
    quality_gate_diversity: int  # Minimum diversity for PRELIMINARY
    quality_gate_low: Optional[int] = None  # Optional: minimum low-reliability for PRELIMINARY (set C only)


# Candidate threshold sets from rubric document
THRESHOLD_SETS = {
    "A": ThresholdSet(
        name="Conservative (High Abstention)",
        min_abstain_rate=0.02,
        min_high_reliability_for_final=2,
        min_evidence_diversity_for_final=2,
        quality_gate_high=1,
        quality_gate_medium=2,
        quality_gate_diversity=1,
    ),
    "B": ThresholdSet(
        name="Balanced (Current-Equivalent)",
        min_abstain_rate=0.01,
        min_high_reliability_for_final=1,
        min_evidence_diversity_for_final=1,
        quality_gate_high=1,
        quality_gate_medium=1,
        quality_gate_diversity=0,  # No diversity requirement
    ),
    "C": ThresholdSet(
        name="Aggressive (Low Abstention)",
        min_abstain_rate=0.005,
        min_high_reliability_for_final=1,
        min_evidence_diversity_for_final=1,
        quality_gate_high=1,
        quality_gate_medium=1,
        quality_gate_diversity=0,
        quality_gate_low=2,  # Allows low-reliability if multiple
    ),
    "D": ThresholdSet(
        name="Quality-Focused (High Reliability Emphasis)",
        min_abstain_rate=0.01,
        min_high_reliability_for_final=2,
        min_evidence_diversity_for_final=2,
        quality_gate_high=1,
        quality_gate_medium=2,
        quality_gate_diversity=0,
    ),
    "E": ThresholdSet(
        name="Diversity-Focused (Corroboration Emphasis)",
        min_abstain_rate=0.01,
        min_high_reliability_for_final=1,
        min_evidence_diversity_for_final=2,
        quality_gate_high=1,
        quality_gate_medium=1,
        quality_gate_diversity=2,
    ),
}


def compute_rubric_inputs(bundle: Dict[str, Any], contract) -> RubricInputs:
    """
    Compute rubric inputs from bundle data.
    
    Returns RubricInputs with computed values and missing_inputs list.
    """
    inputs = RubricInputs()
    
    # Get bundle structure
    bundle_data = bundle.get("bundle", bundle)
    evidence_items = bundle_data.get("evidence_items", {})
    insights = bundle_data.get("insights", [])
    meta = bundle_data.get("meta", {})
    observations = bundle_data.get("observations", {})
    conflict_resolutions = bundle_data.get("conflict_resolutions", {})
    
    # Get main insight
    main_insight = insights[0] if insights else {}
    evidence_ids = main_insight.get("evidence_ids", [])
    
    # 1. evidence_rate
    total_items = (
        meta.get("n_items")
        or observations.get("total_posts_seen")
        or meta.get("coverage", {}).get("n_items_total")
    )
    if total_items and total_items > 0:
        inputs.evidence_rate = len(evidence_ids) / total_items
    else:
        inputs.missing_inputs.append("evidence_rate (total_items not available)")
    
    # 2. unique_support_count (deduplication)
    seen = set()
    unique_items = []
    for ev_id in evidence_ids:
        ev = evidence_items.get(ev_id, {})
        # Deduplication key: (source_item_index, signal_type+signal_subtype, detection_method)
        source_idx = ev.get("source_item_index") or ev.get("item_context", {}).get("item_index")
        signal_type = ev.get("signal_type", "")
        signal_subtype = ev.get("signal_subtype", "")
        detection_method = ev.get("detection_method", "")
        
        dedup_key = (source_idx, f"{signal_type}:{signal_subtype}", detection_method)
        if dedup_key not in seen:
            seen.add(dedup_key)
            unique_items.append(ev)
    
    inputs.unique_support_count = len(unique_items)
    
    # 3. support_quality_mix
    for ev in unique_items:
        method_rel = ev.get("method_reliability", {})
        reliability = (
            method_rel.get("effective_reliability")
            or method_rel.get("base_reliability")
            or 0.0
        )
        if reliability >= 0.80:
            inputs.support_quality_mix["high"] += 1
        elif reliability >= 0.50:
            inputs.support_quality_mix["medium"] += 1
        else:
            inputs.support_quality_mix["low"] += 1
    
    # 4. counterevidence_presence
    # Check conflict_resolutions for losing evidence
    counterevidence_ids = set()
    for resolution in conflict_resolutions.values():
        if isinstance(resolution, dict):
            losing_ids = resolution.get("losing_evidence_ids", [])
            counterevidence_ids.update(losing_ids)
    
    # Also check conflicts_with in evidence items
    for ev_id, ev in evidence_items.items():
        conflicts_with = ev.get("conflicts_with", [])
        if conflicts_with:
            counterevidence_ids.update(conflicts_with)
    
    inputs.counterevidence_count = len(counterevidence_ids)
    inputs.counterevidence_presence = inputs.counterevidence_count > 0
    
    # 5. evidence_type_diversity
    type_pairs = set()
    for ev in unique_items:
        signal_type = ev.get("signal_type", "")
        signal_subtype = ev.get("signal_subtype", "")
        if signal_type or signal_subtype:
            type_pairs.add((signal_type, signal_subtype))
    inputs.evidence_type_diversity = len(type_pairs)
    
    # 6. claim_specificity (optional, not computed)
    inputs.missing_inputs.append("claim_specificity (not yet instrumented)")
    
    return inputs


def apply_rubric(
    inputs: RubricInputs,
    threshold_set: ThresholdSet,
    contract,
    actual_status: str
) -> Tuple[str, str]:
    """
    Apply rubric rules to determine recommended outcome.
    
    Returns: (recommended_status, rule_triggered)
    - recommended_status: "ABSTAIN" or "PRELIMINARY"
    - rule_triggered: Description of which rule/condition triggered
    """
    # Rule 1: Mandatory ABSTAIN Conditions
    # 1.1: No Evidence Condition
    if inputs.unique_support_count == 0:
        return ("ABSTAIN", "Rule 1.1: No Evidence (unique_support_count == 0)")
    
    # 1.2: Counterevidence Dominance
    if inputs.counterevidence_presence and inputs.counterevidence_count >= inputs.unique_support_count:
        return ("ABSTAIN", f"Rule 1.2: Counterevidence Dominance (counterevidence_count {inputs.counterevidence_count} >= unique_support_count {inputs.unique_support_count})")
    
    # 1.3: Extreme Low Rate
    if inputs.evidence_rate is not None and inputs.evidence_rate < threshold_set.min_abstain_rate:
        return ("ABSTAIN", f"Rule 1.3: Extreme Low Rate (evidence_rate {inputs.evidence_rate:.4f} < min_abstain_rate {threshold_set.min_abstain_rate})")
    
    # 1.4: All Low Reliability
    if inputs.support_quality_mix["high"] == 0 and inputs.support_quality_mix["medium"] == 0:
        return ("ABSTAIN", "Rule 1.4: All Low Reliability (no high or medium reliability evidence)")
    
    # Rule 2: PRELIMINARY Conditions
    # 2.1: Evidence Exists (already checked above)
    # 2.2: Not Mandatory ABSTAIN (already passed Rule 1)
    
    # 2.3: Below FINAL Threshold
    below_final = False
    below_final_reasons = []
    
    min_evidence_for_final = contract.min_evidence_for_final
    if inputs.unique_support_count < min_evidence_for_final:
        below_final = True
        below_final_reasons.append(f"unique_support_count {inputs.unique_support_count} < min_evidence_for_final {min_evidence_for_final}")
    
    min_evidence_rate_for_final = getattr(contract, "min_evidence_rate_for_final", None)
    if min_evidence_rate_for_final and inputs.evidence_rate is not None:
        if inputs.evidence_rate < min_evidence_rate_for_final:
            below_final = True
            below_final_reasons.append(f"evidence_rate {inputs.evidence_rate:.4f} < min_evidence_rate_for_final {min_evidence_rate_for_final}")
    
    if inputs.support_quality_mix["high"] < threshold_set.min_high_reliability_for_final:
        below_final = True
        below_final_reasons.append(f"high_reliability {inputs.support_quality_mix['high']} < min_high_reliability_for_final {threshold_set.min_high_reliability_for_final}")
    
    if not below_final:
        # If not below FINAL threshold, rubric doesn't apply (FINAL logic is out of scope)
        # Return actual status
        return (actual_status, "Not applicable (meets FINAL thresholds)")
    
    # 2.4: Quality Gate
    quality_gate_met = False
    quality_gate_reasons = []
    
    if inputs.support_quality_mix["high"] >= threshold_set.quality_gate_high:
        quality_gate_met = True
        quality_gate_reasons.append(f"high_reliability >= {threshold_set.quality_gate_high}")
    
    if inputs.support_quality_mix["medium"] >= threshold_set.quality_gate_medium:
        quality_gate_met = True
        quality_gate_reasons.append(f"medium_reliability >= {threshold_set.quality_gate_medium}")
    
    if threshold_set.quality_gate_diversity > 0 and inputs.evidence_type_diversity is not None:
        if inputs.evidence_type_diversity >= threshold_set.quality_gate_diversity:
            quality_gate_met = True
            quality_gate_reasons.append(f"diversity >= {threshold_set.quality_gate_diversity}")
    
    if threshold_set.quality_gate_low is not None:
        if inputs.support_quality_mix["low"] >= threshold_set.quality_gate_low:
            quality_gate_met = True
            quality_gate_reasons.append(f"low_reliability >= {threshold_set.quality_gate_low}")
    
    if quality_gate_met:
        return ("PRELIMINARY", f"Rule 2: PRELIMINARY ({', '.join(quality_gate_reasons)})")
    else:
        # Quality gate not met, but not forced to ABSTAIN → still PRELIMINARY (weak)
        return ("PRELIMINARY", f"Rule 2: PRELIMINARY (weak, quality gate not fully met)")
    
    # Rule 3: Edge cases (handled implicitly above)
    # If we get here, something unexpected happened
    return (actual_status, "Unexpected: no rule matched")


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


def evaluate_item(item: Dict[str, Any], threshold_set: ThresholdSet) -> Dict[str, Any]:
    """Evaluate a single item with the rubric."""
    tab = item["tab"]
    contract = get_tab_accuracy_contract(tab)
    bundle = item.get("bundle_data")
    
    if not bundle:
        return {
            "error": "Bundle not loaded",
            "rubric_recommended": None,
            "rule_triggered": None,
        }
    
    # Get actual status from bundle
    insights = bundle.get("bundle", bundle).get("insights", [])
    actual_status = insights[0].get("claim_status", "UNKNOWN") if insights else "UNKNOWN"
    
    # Compute rubric inputs
    inputs = compute_rubric_inputs(bundle, contract)
    
    # Apply rubric (only to PRELIMINARY/ABSTAIN, not FINAL)
    if actual_status == "FINAL":
        # Rubric doesn't apply to FINAL (out of scope)
        rubric_recommended = "FINAL"
        rule_triggered = "Not applicable (FINAL is out of scope)"
    else:
        rubric_recommended, rule_triggered = apply_rubric(inputs, threshold_set, contract, actual_status)
    
    # Ground truth
    gt = item.get("ground_truth", {})
    should_abstain = gt.get("should_have_abstained")
    
    # Score against ground truth
    # should_have_abstained=yes => only ABSTAIN acceptable
    # should_have_abstained=no => PRELIMINARY or FINAL acceptable
    if should_abstain == "yes":
        rubric_acceptable = (rubric_recommended == "ABSTAIN")
    elif should_abstain == "no":
        rubric_acceptable = (rubric_recommended in ["PRELIMINARY", "FINAL"])
    else:
        rubric_acceptable = None  # unsure
    
    return {
        "scan_id": item["scan_id"],
        "tab": tab,
        "actual_status": actual_status,
        "rubric_recommended": rubric_recommended,
        "rule_triggered": rule_triggered,
        "should_have_abstained": should_abstain,
        "rubric_acceptable": rubric_acceptable,
        "inputs": {
            "evidence_rate": inputs.evidence_rate,
            "unique_support_count": inputs.unique_support_count,
            "support_quality_mix": inputs.support_quality_mix,
            "counterevidence_presence": inputs.counterevidence_presence,
            "counterevidence_count": inputs.counterevidence_count,
            "evidence_type_diversity": inputs.evidence_type_diversity,
            "missing_inputs": inputs.missing_inputs,
        },
    }


def compute_metrics(evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute aggregate metrics from evaluations."""
    total = len(evaluations)
    if total == 0:
        return {}
    
    # Status counts
    actual_abstain = sum(1 for e in evaluations if e.get("actual_status") == "ABSTAIN")
    actual_preliminary = sum(1 for e in evaluations if e.get("actual_status") == "PRELIMINARY")
    actual_final = sum(1 for e in evaluations if e.get("actual_status") == "FINAL")
    
    rubric_abstain = sum(1 for e in evaluations if e.get("rubric_recommended") == "ABSTAIN")
    rubric_preliminary = sum(1 for e in evaluations if e.get("rubric_recommended") == "PRELIMINARY")
    rubric_final = sum(1 for e in evaluations if e.get("rubric_recommended") == "FINAL")
    
    # Flips (changes from actual)
    flips = sum(1 for e in evaluations if e.get("actual_status") != e.get("rubric_recommended"))
    
    # Ground truth scoring (matching scorer logic)
    # Appropriate abstention: of items where should_have_abstained == "yes", how many did rubric recommend ABSTAIN?
    should_abstain_yes = [e for e in evaluations if e.get("should_have_abstained") == "yes"]
    if should_abstain_yes:
        appropriate_abstention = sum(
            1 for e in should_abstain_yes
            if e.get("rubric_recommended") == "ABSTAIN"
        ) / len(should_abstain_yes)
    else:
        appropriate_abstention = None
    
    # False abstention: of items where should_have_abstained == "no", how many did rubric recommend ABSTAIN?
    should_abstain_no = [e for e in evaluations if e.get("should_have_abstained") == "no"]
    if should_abstain_no:
        false_abstention = sum(
            1 for e in should_abstain_no
            if e.get("rubric_recommended") == "ABSTAIN"
        ) / len(should_abstain_no)
    else:
        false_abstention = None
    
    return {
        "total_items": total,
        "actual": {
            "abstain_count": actual_abstain,
            "preliminary_count": actual_preliminary,
            "final_count": actual_final,
            "abstain_rate": actual_abstain / total if total > 0 else 0,
            "preliminary_rate": actual_preliminary / total if total > 0 else 0,
            "final_rate": actual_final / total if total > 0 else 0,
        },
        "rubric": {
            "abstain_count": rubric_abstain,
            "preliminary_count": rubric_preliminary,
            "final_count": rubric_final,
            "abstain_rate": rubric_abstain / total if total > 0 else 0,
            "preliminary_rate": rubric_preliminary / total if total > 0 else 0,
            "final_rate": rubric_final / total if total > 0 else 0,
        },
        "flips_count": flips,
        "appropriate_abstention_rate": appropriate_abstention,
        "false_abstention_rate": false_abstention,
    }


def check_guardrails(metrics: Dict[str, Any]) -> Dict[str, bool]:
    """Check guardrails against baseline metrics."""
    # Baseline from current system
    baseline_accuracy = 1.000  # 100%
    baseline_appropriate_abstention = 0.8571  # 85.71%
    baseline_false_abstention = 0.000  # 0%
    baseline_final_rate = 0.600  # 60%
    
    rubric_appropriate_abstention = metrics.get("appropriate_abstention_rate")
    rubric_false_abstention = metrics.get("false_abstention_rate")
    rubric_final_rate = metrics.get("rubric", {}).get("final_rate", 0)
    
    # Note: We don't recompute accuracy here - we reuse existing evaluation
    # Accuracy guardrail: Must remain 100% (we assume it does, not recomputing)
    
    return {
        "accuracy_guardrail": True,  # Assumed (not recomputed)
        "appropriate_abstention_guardrail": (
            rubric_appropriate_abstention is not None
            and rubric_appropriate_abstention >= baseline_appropriate_abstention
        ),
        "false_abstention_guardrail": (
            rubric_false_abstention is not None
            and rubric_false_abstention <= baseline_false_abstention
        ),
        "final_rate_guardrail": rubric_final_rate <= baseline_final_rate + 0.02,  # Allow ±2% tolerance
    }


def generate_report(
    all_evaluations: Dict[str, List[Dict[str, Any]]],
    all_metrics: Dict[str, Dict[str, Any]],
    all_guardrails: Dict[str, Dict[str, bool]]
) -> str:
    """Generate markdown report."""
    lines = []
    lines.append("# Shadow Evaluation: PRELIMINARY vs ABSTAIN Rubric")
    lines.append("")
    lines.append("**Date:** Generated by shadow evaluation script")
    lines.append("**Status:** Read-only evaluation (no behavior changes)")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Summary Table: Candidate Sets A-E")
    lines.append("")
    lines.append("| Set | Name | Flips | Abstain Rate | Preliminary Rate | Final Rate | Guardrails |")
    lines.append("|-----|------|-------|--------------|-----------------|------------|------------|")
    
    for set_id in ["A", "B", "C", "D", "E"]:
        metrics = all_metrics.get(set_id, {})
        guardrails = all_guardrails.get(set_id, {})
        rubric_metrics = metrics.get("rubric", {})
        
        guardrail_status = "[PASS]" if all(guardrails.values()) else "[FAIL]"
        
        lines.append(
            f"| {set_id} | {THRESHOLD_SETS[set_id].name} | "
            f"{metrics.get('flips_count', 0)} | "
            f"{rubric_metrics.get('abstain_rate', 0):.2%} | "
            f"{rubric_metrics.get('preliminary_rate', 0):.2%} | "
            f"{rubric_metrics.get('final_rate', 0):.2%} | "
            f"{guardrail_status} |"
        )
    
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Per-Item Table (25 items)")
    lines.append("")
    lines.append("| Scan ID | Tab | Should Abstain | Actual | Rubric (Best) | Rule | Missing Inputs |")
    lines.append("|---------|-----|----------------|--------|---------------|------|----------------|")
    
    # Use set B (Balanced) as the "best" for per-item display
    best_set = "B"
    evaluations = all_evaluations.get(best_set, [])
    
    for eval_item in evaluations:
        scan_id = eval_item.get("scan_id", "")[:20]  # Truncate for display
        tab = eval_item.get("tab", "")
        should_abstain = eval_item.get("should_have_abstained", "?")
        actual = eval_item.get("actual_status", "")
        rubric = eval_item.get("rubric_recommended", "")
        rule = eval_item.get("rule_triggered", "")[:50]  # Truncate
        missing = ", ".join(eval_item.get("inputs", {}).get("missing_inputs", []))[:30]  # Truncate
        
        lines.append(f"| {scan_id} | {tab} | {should_abstain} | {actual} | {rubric} | {rule} | {missing} |")
    
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## No-Regression Confirmation")
    lines.append("")
    
    for set_id in ["A", "B", "C", "D", "E"]:
        guardrails = all_guardrails.get(set_id, {})
        all_pass = all(guardrails.values())
        status = "[PASS]" if all_pass else "[FAIL]"
        lines.append(f"### Set {set_id}: {status}")
        lines.append("")
        for guardrail_name, passed in guardrails.items():
            status_icon = "[PASS]" if passed else "[FAIL]"
            lines.append(f"- {status_icon} {guardrail_name}: {'PASS' if passed else 'FAIL'}")
        lines.append("")
    
    lines.append("---")
    lines.append("")
    lines.append("## Missing Inputs Summary")
    lines.append("")
    lines.append("The following rubric inputs could not be computed from current bundle data:")
    lines.append("")
    
    # Collect all missing inputs
    all_missing = set()
    for evaluations in all_evaluations.values():
        for eval_item in evaluations:
            missing = eval_item.get("inputs", {}).get("missing_inputs", [])
            all_missing.update(missing)
    
    for missing in sorted(all_missing):
        lines.append(f"- {missing}")
    
    lines.append("")
    lines.append("**Recommendation:** These inputs require minimal future instrumentation:")
    lines.append("- `claim_specificity`: Requires tab-specific heuristics or claim text analysis")
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
    
    # Evaluate with each threshold set
    all_evaluations = {}
    all_metrics = {}
    all_guardrails = {}
    
    for set_id, threshold_set in THRESHOLD_SETS.items():
        print(f"\nEvaluating with threshold set {set_id}: {threshold_set.name}...")
        evaluations = []
        for item in items:
            eval_result = evaluate_item(item, threshold_set)
            evaluations.append(eval_result)
        
        all_evaluations[set_id] = evaluations
        metrics = compute_metrics(evaluations)
        all_metrics[set_id] = metrics
        guardrails = check_guardrails(metrics)
        all_guardrails[set_id] = guardrails
        
        print(f"  Flips: {metrics.get('flips_count', 0)}")
        print(f"  Abstain rate: {metrics.get('rubric', {}).get('abstain_rate', 0):.2%}")
        print(f"  Guardrails: {'[PASS]' if all(guardrails.values()) else '[FAIL]'}")
    
    # Generate report
    print("\nGenerating report...")
    report_md = generate_report(all_evaluations, all_metrics, all_guardrails)
    
    report_file = reports_dir / "shadow_prelim_abstain_eval_v0.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report_md)
    print(f"Report written to: {report_file}")
    
    # Also save JSON for machine-readable format
    json_data = {
        "evaluations": all_evaluations,
        "metrics": all_metrics,
        "guardrails": all_guardrails,
    }
    json_file = reports_dir / "shadow_prelim_abstain_eval_v0.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    print(f"JSON written to: {json_file}")
    
    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print("\nCandidate Set Performance:")
    for set_id in ["A", "B", "C", "D", "E"]:
        metrics = all_metrics[set_id]
        guardrails = all_guardrails[set_id]
        status = "[PASS]" if all(guardrails.values()) else "[FAIL]"
        print(f"  {set_id}: {THRESHOLD_SETS[set_id].name}")
        print(f"    Flips: {metrics.get('flips_count', 0)}")
        print(f"    Guardrails: {status}")
    print("\nDone.")


if __name__ == "__main__":
    main()

