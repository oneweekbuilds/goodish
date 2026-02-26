#!/usr/bin/env python3
"""Analyze overconfidence: should_have_abstained=yes but claim_status=FINAL."""
import json

LABELS_FILE = "eval/gt_runs/20260108_012303/labels_v0.json"
BUNDLE_DIR = "eval/gt_runs/20260108_012303"

with open(LABELS_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

overconfident = []

for item in data['items']:
    pred = item['predicted']
    gt = item['ground_truth']
    
    # Load actual bundle to get current claim_status (not the predicted one from labels)
    bundle_file = f"{BUNDLE_DIR}/{item['bundle_file']}"
    try:
        with open(bundle_file, 'r', encoding='utf-8') as f:
            bundle_data = json.load(f)
        insights = bundle_data.get('bundle', {}).get('insights', [])
        current_status = insights[0]['claim_status'] if insights else pred['claim_status']
    except Exception:
        current_status = pred['claim_status']  # Fallback to predicted if bundle can't be loaded
    
    if (gt['should_have_abstained'] == 'yes' and 
        current_status == 'FINAL'):
        overconfident.append(item)

print(f"Overconfidence cases: {len(overconfident)}\n")

if overconfident:
    print("=" * 80)
    print("OVERCONFIDENCE REPORT")
    print("=" * 80)
    print()
    
    for i, item in enumerate(overconfident, 1):
        pred = item['predicted']
        gt = item['ground_truth']
        
        # Load bundle to get claim_text
        bundle_file = f"{BUNDLE_DIR}/{item['bundle_file']}"
        try:
            with open(bundle_file, 'r', encoding='utf-8') as f:
                bundle_data = json.load(f)
            insights = bundle_data.get('bundle', {}).get('insights', [])
            claim_text = insights[0]['claim_text'] if insights else "N/A"
        except Exception as e:
            claim_text = f"Error loading: {e}"
        
        print(f"{i}. {item['scan_id']} - {item['tab']}")
        print(f"   Insight ID: {pred['main_insight_id']}")
        print(f"   Evidence count: {pred['evidence_ids_len']}")
        print(f"   Claim: {claim_text}")
        print(f"   Why abstention desired: {gt.get('notes', 'No notes provided')}")
        print()
else:
    print("No overconfidence cases found (all FINAL claims appropriately confident).")

