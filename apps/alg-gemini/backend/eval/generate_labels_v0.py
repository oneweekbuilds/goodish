#!/usr/bin/env python3
"""Generate labels_v0.json from bundle files in a gt_runs folder."""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

def extract_main_insight(bundle):
    """Extract main insight (first insight) from bundle."""
    insights = bundle.get("bundle", {}).get("insights", [])
    if not insights:
        return {
            "main_insight_id": None,
            "claim_status": None,
            "title": None,
            "narrative": None,
            "evidence_ids_len": 0
        }
    
    main = insights[0]
    return {
        "main_insight_id": main.get("insight_id"),
        "claim_status": main.get("claim_status"),
        "title": main.get("title"),
        "narrative": main.get("narrative"),
        "evidence_ids_len": len(main.get("evidence_ids", []))
    }

def extract_metrics(bundle):
    """Extract counts and metrics from bundle."""
    bundle_data = bundle.get("bundle", {})
    
    evidence_items = bundle_data.get("evidence_items", [])
    insights = bundle_data.get("insights", [])
    conflict_resolutions = bundle_data.get("conflict_resolutions", {})
    
    return {
        "evidence_items_count": len(evidence_items),
        "insights_count": len(insights),
        "conflict_resolutions_count": len(conflict_resolutions) if isinstance(conflict_resolutions, dict) else 0,
        "evidence_chain_metrics": bundle_data.get("evidence_chain_metrics", {}),
        "critic_metrics": bundle_data.get("critic_metrics", {})
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_labels_v0.py <run_dir_name>")
        print("Example: python generate_labels_v0.py 20260108_012303")
        sys.exit(1)
    
    run_dir_name = sys.argv[1]
    base_dir = Path(__file__).parent / "gt_runs" / run_dir_name
    
    if not base_dir.exists():
        print(f"Error: {base_dir} does not exist")
        sys.exit(1)
    
    summary_file = base_dir / "summary.json"
    if not summary_file.exists():
        print(f"Error: {summary_file} does not exist")
        sys.exit(1)
    
    with open(summary_file, 'r', encoding='utf-8') as f:
        summary = json.load(f)
    
    tabs = summary.get("tabs", ["ads", "politics", "patterns", "creators", "inferences"])
    scan_ids = summary.get("scan_ids", [])
    
    items = []
    missing_files = []
    
    for scan_id in scan_ids:
        for tab in tabs:
            bundle_file = f"{scan_id}__{tab}.json"
            bundle_path = base_dir / bundle_file
            
            if not bundle_path.exists():
                missing_files.append(bundle_file)
                continue
            
            try:
                with open(bundle_path, 'r', encoding='utf-8') as f:
                    bundle = json.load(f)
                
                main_insight = extract_main_insight(bundle)
                metrics = extract_metrics(bundle)
                
                item = {
                    "scan_id": scan_id,
                    "tab": tab,
                    "bundle_file": bundle_file,
                    "predicted": {
                        "main_insight_id": main_insight["main_insight_id"],
                        "claim_status": main_insight["claim_status"],
                        "title": main_insight["title"],
                        "narrative": main_insight["narrative"],
                        "evidence_ids_len": main_insight["evidence_ids_len"],
                        **metrics
                    },
                    "ground_truth": {
                        "is_main_claim_correct": None,
                        "should_have_abstained": None,
                        "what_is_wrong": "",
                        "expected_evidence": "",
                        "notes": ""
                    }
                }
                items.append(item)
            except Exception as e:
                print(f"Error processing {bundle_file}: {e}", file=sys.stderr)
                missing_files.append(bundle_file)
    
    output = {
        "version": "v0",
        "created_at": datetime.now().isoformat(),
        "run_dir": run_dir_name,
        "tabs": tabs,
        "items": items
    }
    
    output_file = base_dir / "labels_v0.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"Path written: {output_file}")
    print(f"Count of items: {len(items)}")
    if missing_files:
        print(f"Missing bundle files ({len(missing_files)}):")
        for f in missing_files:
            print(f"  - {f}")
    else:
        print("Missing bundle files: 0")

if __name__ == "__main__":
    main()

