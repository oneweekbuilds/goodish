#!/usr/bin/env python3
"""Check for unlabeled items in labels_v0.json."""
import json
from collections import defaultdict

LABELS_FILE = "eval/gt_runs/20260108_012303/labels_v0.json"

with open(LABELS_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

unlabeled = [item for item in data['items'] if item['ground_truth']['is_main_claim_correct'] is None]

print(f"Unlabeled items: {len(unlabeled)}")
print()

if unlabeled:
    # Group by tab and claim_status
    grouped = defaultdict(list)
    for item in unlabeled:
        key = (item['tab'], item['predicted']['claim_status'])
        grouped[key].append(item)
    
    for (tab, status), items in sorted(grouped.items()):
        print(f"{tab.upper()} - {status}: {len(items)} items")
        for item in items:
            print(f"  - {item['scan_id']} (evidence: {item['predicted']['evidence_ids_len']})")
        print()
else:
    print("All items are labeled!")




