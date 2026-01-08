#!/usr/bin/env python3
"""Generate labeling recommendations for ground truth items."""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

def load_bundle(run_dir: Path, bundle_file: str) -> Dict[str, Any]:
    """Load bundle JSON file."""
    bundle_path = run_dir / bundle_file
    if not bundle_path.exists():
        raise FileNotFoundError(f"Bundle file not found: {bundle_path}")
    with open(bundle_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_insight_info(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """Extract insight information from bundle."""
    insights = bundle.get("bundle", {}).get("insights", [])
    if not insights:
        return {
            "claim_text": None,
            "claim_status": None,
            "insight_id": None,
            "evidence_ids": []
        }
    
    main_insight = insights[0]
    return {
        "claim_text": main_insight.get("claim_text"),
        "claim_status": main_insight.get("claim_status"),
        "insight_id": main_insight.get("insight_id"),
        "evidence_ids": main_insight.get("evidence_ids", [])
    }

def extract_evidence_details(bundle: Dict[str, Any], evidence_ids: List[str]) -> List[Dict[str, Any]]:
    """Extract details for each evidence ID."""
    evidence_items = bundle.get("bundle", {}).get("evidence_items", {})
    details = []
    for ev_id in evidence_ids:
        ev_item = evidence_items.get(ev_id, {})
        details.append({
            "evidence_id": ev_id,
            "signal_type": ev_item.get("signal_type"),
            "signal_subtype": ev_item.get("signal_subtype"),
            "detection_method": ev_item.get("detection_method"),
            "platform": ev_item.get("item_context", {}).get("platform"),
            "source_item_index": ev_item.get("source_item_index"),
            "method_reliability": ev_item.get("method_reliability", {}).get("effective_reliability")
        })
    return details

def extract_limitations(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """Extract limitations and boundaries."""
    limits = bundle.get("bundle", {}).get("limits", {})
    analysis = bundle.get("analysis", {})
    return {
        "epistemic_boundaries": limits.get("epistemic_boundaries", []),
        "detection_limitations": limits.get("detection_limitations", []),
        "limitations_summary": analysis.get("limitations_summary", {}).get("text", "")
    }

def extract_observations(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """Extract key observations."""
    obs = bundle.get("bundle", {}).get("observations", {})
    return {
        "total_posts_seen": obs.get("total_posts_seen"),
        "items_with_political_keywords": obs.get("items_with_political_keywords"),
        "items_with_news_keywords": obs.get("items_with_news_keywords"),
        "total_ads_detected": obs.get("total_ads_detected"),
        "commercial_exposure_spectrum": obs.get("commercial_exposure_spectrum", {}).get("stacked_bar", {})
    }

def recommend_label(item: Dict[str, Any], bundle: Dict[str, Any], insight_info: Dict[str, Any], 
                    evidence_details: List[Dict[str, Any]], limitations: Dict[str, Any]) -> Dict[str, Any]:
    """Generate label recommendation for an item."""
    tab = item["tab"]
    claim_status = insight_info.get("claim_status", "").upper()
    claim_text = insight_info.get("claim_text", "")
    evidence_count = len(evidence_details)
    
    # Default recommendations
    rec = {
        "is_main_claim_correct": "unsure",
        "should_have_abstained": "unsure",
        "severity_if_wrong": None,
        "justification": ""
    }
    
    # Handle ABSTAIN cases
    if claim_status == "ABSTAIN":
        rec["is_main_claim_correct"] = "unsure"
        rec["should_have_abstained"] = "yes"
        rec["justification"] = "System correctly abstained (no evidence or insufficient signal)."
        return rec
    
    # Handle PRELIMINARY cases
    if claim_status == "PRELIMINARY":
        rec["is_main_claim_correct"] = "unsure"
        rec["should_have_abstained"] = "unsure"
        rec["justification"] = f"PRELIMINARY status suggests thin evidence ({evidence_count} items). Human review needed to verify if claim is correct and if PRELIMINARY was appropriate."
        return rec
    
    # Handle FINAL cases - need to assess based on tab and evidence
    if claim_status == "FINAL":
        if tab == "ads":
            # Ads tab: usually high confidence with platform labels
            if evidence_count >= 1:
                rec["is_main_claim_correct"] = "yes"
                rec["should_have_abstained"] = "no"
                rec["justification"] = f"Ads tab with {evidence_count} evidence items. Platform labels are highly reliable. Claim likely correct unless evidence chain is broken."
            else:
                rec["is_main_claim_correct"] = "no"
                rec["should_have_abstained"] = "yes"
                rec["severity_if_wrong"] = "med"
                rec["justification"] = "FINAL claim with no evidence items - should have abstained."
        
        elif tab == "creators":
            # Creators tab: usually straightforward extraction
            if evidence_count >= 10:
                rec["is_main_claim_correct"] = "yes"
                rec["should_have_abstained"] = "no"
                rec["justification"] = f"Creators tab with {evidence_count} evidence items. High coverage suggests claim is correct."
            elif evidence_count >= 1:
                rec["is_main_claim_correct"] = "unsure"
                rec["should_have_abstained"] = "unsure"
                rec["justification"] = f"Creators tab with {evidence_count} evidence items. May be correct but coverage is thin - human review needed."
            else:
                rec["is_main_claim_correct"] = "no"
                rec["should_have_abstained"] = "yes"
                rec["severity_if_wrong"] = "med"
                rec["justification"] = "FINAL claim with no evidence items - should have abstained."
        
        elif tab == "politics":
            # Politics tab: sensitive, needs careful assessment
            if evidence_count >= 2:
                # Check if evidence is actually political or just news
                news_only = all(ev.get("signal_type") == "news_keyword" for ev in evidence_details)
                if news_only and "political" in claim_text.lower():
                    rec["is_main_claim_correct"] = "unsure"
                    rec["should_have_abstained"] = "maybe"
                    rec["justification"] = f"Claim mentions 'political' but only news keywords found ({evidence_count} items). May be technically correct but wording could be misleading."
                else:
                    rec["is_main_claim_correct"] = "yes"
                    rec["should_have_abstained"] = "no"
                    rec["justification"] = f"Politics tab with {evidence_count} evidence items. Claim appears correct with appropriate disclaimers."
            elif evidence_count == 1:
                rec["is_main_claim_correct"] = "unsure"
                rec["should_have_abstained"] = "yes"
                rec["justification"] = f"Politics tab FINAL with only 1 evidence item. Too thin for confident claim - should have been PRELIMINARY or ABSTAIN."
            else:
                rec["is_main_claim_correct"] = "no"
                rec["should_have_abstained"] = "yes"
                rec["severity_if_wrong"] = "high"
                rec["justification"] = "FINAL claim in politics tab with no evidence - should have abstained."
        
        elif tab == "patterns":
            # Patterns tab: repetition/behavior patterns
            if evidence_count >= 2:
                rec["is_main_claim_correct"] = "unsure"
                rec["should_have_abstained"] = "no"
                rec["justification"] = f"Patterns tab with {evidence_count} evidence items. Claim may be correct but human review needed to verify pattern strength."
            elif evidence_count == 1:
                rec["is_main_claim_correct"] = "unsure"
                rec["should_have_abstained"] = "maybe"
                rec["justification"] = f"Patterns tab FINAL with only 1 evidence item. Pattern may exist but evidence is thin - consider PRELIMINARY."
            else:
                rec["is_main_claim_correct"] = "no"
                rec["should_have_abstained"] = "yes"
                rec["severity_if_wrong"] = "med"
                rec["justification"] = "FINAL claim with no evidence items - should have abstained."
        
        elif tab == "inferences":
            # Inferences tab: algorithm signals
            if evidence_count >= 3:
                rec["is_main_claim_correct"] = "unsure"
                rec["should_have_abstained"] = "no"
                rec["justification"] = f"Inferences tab with {evidence_count} evidence items. Claim may be correct but inference claims need careful human review."
            elif evidence_count >= 1:
                rec["is_main_claim_correct"] = "unsure"
                rec["should_have_abstained"] = "maybe"
                rec["justification"] = f"Inferences tab FINAL with {evidence_count} evidence items. Inference claims are speculative - may need PRELIMINARY or more evidence."
            else:
                rec["is_main_claim_correct"] = "no"
                rec["should_have_abstained"] = "yes"
                rec["severity_if_wrong"] = "med"
                rec["justification"] = "FINAL claim with no evidence items - should have abstained."
    
    return rec

def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_labeling_recommendations.py <run_dir_name>")
        sys.exit(1)
    
    run_dir_name = sys.argv[1]
    eval_dir = Path(__file__).parent
    run_dir = eval_dir / "gt_runs" / run_dir_name
    
    if not run_dir.exists():
        print(f"Error: Run directory not found: {run_dir}")
        sys.exit(1)
    
    labels_file = run_dir / "labels_v0.json"
    if not labels_file.exists():
        print(f"Error: labels_v0.json not found: {labels_file}")
        sys.exit(1)
    
    with open(labels_file, 'r', encoding='utf-8') as f:
        labels_data = json.load(f)
    
    # Validate
    items = labels_data.get("items", [])
    tabs = labels_data.get("tabs", [])
    
    print(f"Validation:")
    print(f"  Items count: {len(items)} (expected: 25)")
    print(f"  Tabs count: {len(tabs)} (expected: 5)")
    
    if len(items) != 25:
        print(f"  WARNING: Expected 25 items, found {len(items)}")
    if len(tabs) != 5:
        print(f"  WARNING: Expected 5 tabs, found {len(tabs)}")
    
    # Check bundle files
    missing_files = []
    for item in items:
        bundle_file = item.get("bundle_file")
        bundle_path = run_dir / bundle_file
        if not bundle_path.exists():
            missing_files.append(bundle_file)
    
    if missing_files:
        print(f"\nMissing bundle files ({len(missing_files)}):")
        for f in missing_files:
            print(f"  - {f}")
    else:
        print(f"\nAll bundle files found: {len(items)}")
    
    # Process each item
    recommendations = []
    for item in items:
        scan_id = item["scan_id"]
        tab = item["tab"]
        bundle_file = item["bundle_file"]
        
        try:
            bundle = load_bundle(run_dir, bundle_file)
            insight_info = extract_insight_info(bundle)
            evidence_details = extract_evidence_details(bundle, insight_info.get("evidence_ids", []))
            limitations = extract_limitations(bundle)
            observations = extract_observations(bundle)
            
            rec = recommend_label(item, bundle, insight_info, evidence_details, limitations)
            
            recommendations.append({
                "item": item,
                "insight_info": insight_info,
                "evidence_details": evidence_details,
                "limitations": limitations,
                "observations": observations,
                "recommendation": rec
            })
        except Exception as e:
            print(f"Error processing {bundle_file}: {e}", file=sys.stderr)
            recommendations.append({
                "item": item,
                "insight_info": {},
                "evidence_details": [],
                "limitations": {},
                "observations": {},
                "recommendation": {
                    "is_main_claim_correct": "unsure",
                    "should_have_abstained": "unsure",
                    "severity_if_wrong": None,
                    "justification": f"Error processing bundle: {e}"
                }
            })
    
    # Generate markdown report
    report_lines = []
    report_lines.append("# Ground Truth Labeling Recommendations")
    report_lines.append(f"\n**Run:** {run_dir_name}")
    report_lines.append(f"**Generated:** {len(recommendations)} recommendations\n")
    
    # Summary table
    report_lines.append("## Summary Table\n")
    report_lines.append("| Scan ID | Tab | Claim Status | Evidence Count | Recommended Correct | Recommended Abstain |")
    report_lines.append("|---------|-----|-------------|----------------|---------------------|---------------------|")
    
    for rec_data in recommendations:
        item = rec_data["item"]
        insight = rec_data["insight_info"]
        rec = rec_data["recommendation"]
        scan_short = item["scan_id"][:20] + "..." if len(item["scan_id"]) > 23 else item["scan_id"]
        report_lines.append(
            f"| {scan_short} | {item['tab']} | {insight.get('claim_status', 'N/A')} | "
            f"{len(rec_data['evidence_details'])} | {rec['is_main_claim_correct']} | {rec['should_have_abstained']} |"
        )
    
    # Detailed per-item sections
    report_lines.append("\n## Detailed Recommendations\n")
    
    for rec_data in recommendations:
        item = rec_data["item"]
        insight = rec_data["insight_info"]
        evidence = rec_data["evidence_details"]
        limitations = rec_data["limitations"]
        rec = rec_data["recommendation"]
        
        report_lines.append(f"### {item['scan_id']} - {item['tab']}\n")
        report_lines.append(f"**Claim:** {insight.get('claim_text', 'N/A')}")
        report_lines.append(f"**Status:** {insight.get('claim_status', 'N/A')}")
        report_lines.append(f"**Evidence IDs:** {len(insight.get('evidence_ids', []))}\n")
        
        if evidence:
            report_lines.append("**Evidence Details:**")
            for ev in evidence:
                report_lines.append(f"- {ev['evidence_id']}: {ev.get('signal_type')}/{ev.get('signal_subtype')} "
                                  f"({ev.get('detection_method')}, reliability: {ev.get('method_reliability')})")
            report_lines.append("")
        
        if limitations.get("limitations_summary"):
            report_lines.append(f"**Limitations:** {limitations['limitations_summary']}\n")
        
        report_lines.append(f"**Recommendation:**")
        report_lines.append(f"- `is_main_claim_correct`: **{rec['is_main_claim_correct']}**")
        report_lines.append(f"- `should_have_abstained`: **{rec['should_have_abstained']}**")
        if rec.get('severity_if_wrong'):
            report_lines.append(f"- `severity_if_wrong`: **{rec['severity_if_wrong']}**")
        report_lines.append(f"- **Justification:** {rec['justification']}\n")
        report_lines.append("---\n")
    
    # Write report
    report_file = run_dir / "labeling_recommendations.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report_lines))
    
    print(f"\nMarkdown report written: {report_file}")
    
    # Generate recommended JSON
    recommended_data = labels_data.copy()
    for i, rec_data in enumerate(recommendations):
        rec = rec_data["recommendation"]
        recommended_data["items"][i]["ground_truth"] = {
            "is_main_claim_correct": rec["is_main_claim_correct"],
            "should_have_abstained": rec["should_have_abstained"],
            "what_is_wrong": "" if rec["is_main_claim_correct"] != "no" else rec["justification"],
            "expected_evidence": "",
            "notes": rec["justification"]
        }
        if rec.get("severity_if_wrong"):
            recommended_data["items"][i]["ground_truth"]["severity_if_wrong"] = rec["severity_if_wrong"]
    
    recommended_file = run_dir / "labels_v0.recommended.json"
    with open(recommended_file, 'w', encoding='utf-8') as f:
        json.dump(recommended_data, f, indent=2, ensure_ascii=False)
    
    print(f"Recommended JSON written: {recommended_file}")
    
    return recommended_file

if __name__ == "__main__":
    main()

