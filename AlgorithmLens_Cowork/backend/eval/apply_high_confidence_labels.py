#!/usr/bin/env python3
"""Apply only high-confidence label recommendations (ads/creators) to labels_v0.json."""

import json
import sys
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Usage: python apply_high_confidence_labels.py <run_dir_name>")
        sys.exit(1)
    
    run_dir_name = sys.argv[1]
    eval_dir = Path(__file__).parent
    run_dir = eval_dir / "gt_runs" / run_dir_name
    
    original_file = run_dir / "labels_v0.json"
    recommended_file = run_dir / "labels_v0.recommended.json"
    applied_file = run_dir / "labels_v0.applied.json"
    
    if not original_file.exists():
        print(f"Error: {original_file} not found")
        sys.exit(1)
    
    if not recommended_file.exists():
        print(f"Error: {recommended_file} not found")
        sys.exit(1)
    
    # Load both files
    with open(original_file, 'r', encoding='utf-8') as f:
        original_data = json.load(f)
    
    with open(recommended_file, 'r', encoding='utf-8') as f:
        recommended_data = json.load(f)
    
    # Create applied data (copy structure from original)
    applied_data = original_data.copy()
    applied_data["items"] = []
    
    # Track counts per tab
    applied_counts = {"ads": 0, "creators": 0, "politics": 0, "patterns": 0, "inferences": 0}
    
    # Match items by (scan_id, tab) and apply recommendations selectively
    recommended_by_key = {}
    for item in recommended_data.get("items", []):
        key = (item["scan_id"], item["tab"])
        recommended_by_key[key] = item
    
    for original_item in original_data.get("items", []):
        scan_id = original_item["scan_id"]
        tab = original_item["tab"]
        key = (scan_id, tab)
        
        # Create new item (start with original)
        new_item = original_item.copy()
        
        # Apply recommendations only for ads and creators tabs
        if tab in ["ads", "creators"]:
            if key in recommended_by_key:
                rec_item = recommended_by_key[key]
                new_item["ground_truth"] = rec_item["ground_truth"].copy()
                applied_counts[tab] += 1
            else:
                print(f"Warning: No recommendation found for {scan_id} - {tab}", file=sys.stderr)
        else:
            # For politics, patterns, inferences: keep original (null/empty)
            applied_counts[tab] += 0  # Track that we skipped
        
        applied_data["items"].append(new_item)
    
    # Write applied file
    with open(applied_file, 'w', encoding='utf-8') as f:
        json.dump(applied_data, f, indent=2, ensure_ascii=False)
    
    print(f"Applied file written: {applied_file}")
    print(f"\nApplied counts per tab:")
    for tab in ["ads", "creators", "politics", "patterns", "inferences"]:
        print(f"  {tab}: {applied_counts[tab]} items")

if __name__ == "__main__":
    main()

