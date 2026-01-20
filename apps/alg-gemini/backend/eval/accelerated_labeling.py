#!/usr/bin/env python3
"""Accelerated labeling mode: auto-apply rules and batch FINAL claims."""
import json
import sys
from pathlib import Path

RUN_DIR = "20260108_012303"
LABELS_FILE = f"eval/gt_runs/{RUN_DIR}/labels_v0.json"

def load_labels():
    with open(LABELS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_labels(data):
    with open(LABELS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def auto_apply_rule(item):
    """Apply auto-rules for simple cases."""
    pred = item['predicted']
    status = pred['claim_status']
    evidence_len = pred['evidence_ids_len']
    tab = item['tab']
    
    # Rule 1: PRELIMINARY politics with ≤1 keyword → A=yes, B=no
    if tab == 'politics' and status == 'PRELIMINARY' and evidence_len <= 1:
        return {
            'is_main_claim_correct': 'yes',
            'should_have_abstained': 'no',
            'notes': f'PRELIMINARY politics with {evidence_len} keyword(s). Auto-applied: claim correct, abstention not needed.'
        }
    
    # Rule 2: ABSTAIN politics with no evidence → A=yes, B=yes
    if tab == 'politics' and status == 'ABSTAIN' and evidence_len == 0:
        return {
            'is_main_claim_correct': 'yes',
            'should_have_abstained': 'yes',
            'notes': 'ABSTAIN politics with no evidence. Auto-applied: abstention was correct.'
        }
    
    # Rule 3: ABSTAIN patterns with no repetition → A=yes, B=yes
    if tab == 'patterns' and status == 'ABSTAIN' and evidence_len == 0:
        return {
            'is_main_claim_correct': 'yes',
            'should_have_abstained': 'yes',
            'notes': 'ABSTAIN patterns with no repetition. Auto-applied: abstention was correct.'
        }
    
    return None

def main():
    data = load_labels()
    unlabeled = []
    auto_applied = []
    
    for item in data['items']:
        gt = item['ground_truth']
        if gt['is_main_claim_correct'] is None:
            auto_result = auto_apply_rule(item)
            if auto_result:
                gt.update(auto_result)
                auto_applied.append(f"{item['scan_id']} - {item['tab']}")
            else:
                unlabeled.append(item)
    
    save_labels(data)
    
    print(f"[AUTO-APPLIED] {len(auto_applied)} items:")
    for x in auto_applied:
        print(f"  - {x}")
    
    print(f"\n[REMAINING] {len(unlabeled)} items need manual review:")
    final_items = [x for x in unlabeled if x['predicted']['claim_status'] == 'FINAL']
    other_items = [x for x in unlabeled if x['predicted']['claim_status'] != 'FINAL']
    
    print(f"\n  FINAL claims ({len(final_items)}):")
    for i, item in enumerate(final_items[:5], 1):
        print(f"    {i}. {item['scan_id']} - {item['tab']} (evidence: {item['predicted']['evidence_ids_len']})")
    
    if len(final_items) > 5:
        print(f"    ... and {len(final_items) - 5} more FINAL items")
    
    if other_items:
        print(f"\n  Other status ({len(other_items)}):")
        for item in other_items:
            print(f"    - {item['scan_id']} - {item['tab']} ({item['predicted']['claim_status']}, evidence: {item['predicted']['evidence_ids_len']})")
    
    return final_items[:5]

if __name__ == '__main__':
    main()




