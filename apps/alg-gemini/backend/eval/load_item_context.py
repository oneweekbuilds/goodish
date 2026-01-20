#!/usr/bin/env python3
"""Load and print context for a specific labeling item."""

import json
import sys
from pathlib import Path

if len(sys.argv) < 3:
    print("Usage: python load_item_context.py <scan_id> <tab>")
    sys.exit(1)

scan_id = sys.argv[1]
tab = sys.argv[2]

run_dir = Path("eval/gt_runs/20260108_012303")
labels_file = run_dir / "labels_v0.json"

with open(labels_file, 'r', encoding='utf-8') as f:
    labels_data = json.load(f)

# Find matching item
item = None
for i in labels_data.get("items", []):
    if i.get("scan_id") == scan_id and i.get("tab") == tab:
        item = i
        break

if not item:
    print(f"Error: Item not found: {scan_id} - {tab}")
    sys.exit(1)

bundle_file = item["bundle_file"]
bundle_path = run_dir / bundle_file

print("=" * 80)
print(f"LABELING CONTEXT: {scan_id} - {tab}")
print("=" * 80)

with open(bundle_path, 'r', encoding='utf-8') as f:
    bundle = json.load(f)

# Extract insight info
insights = bundle.get("bundle", {}).get("insights", [])
if insights:
    main_insight = insights[0]
    claim_status = main_insight.get("claim_status", "N/A")
    claim_text = main_insight.get("claim_text", "N/A")
    evidence_ids = main_insight.get("evidence_ids", [])
else:
    claim_status = "N/A"
    claim_text = "N/A"
    evidence_ids = []

# Get primary insight text
analysis = bundle.get("analysis", {})
primary_insight_text = analysis.get("primary_insight", {}).get("text", "")

print(f"\nClaim Status: {claim_status}")
print(f"Claim Text: {claim_text}")
if primary_insight_text:
    print(f"Primary Insight: {primary_insight_text}")

print(f"\nEvidence Count: {len(evidence_ids)}")

# Extract evidence details
evidence_items = bundle.get("bundle", {}).get("evidence_items", {})
if evidence_ids:
    print("\nEvidence Details:")
    for ev_id in evidence_ids:
        ev_item = evidence_items.get(ev_id, {})
        signal_type = ev_item.get("signal_type", "N/A")
        detection_method = ev_item.get("detection_method", "N/A")
        platform = ev_item.get("item_context", {}).get("platform", "N/A")
        source_index = ev_item.get("source_item_index", "N/A")
        print(f"  - {ev_id}:")
        print(f"      Signal Type: {signal_type}")
        print(f"      Detection Method: {detection_method}")
        print(f"      Platform: {platform}")
        if source_index != "N/A":
            print(f"      Source Item Index: {source_index}")

# Extract limitations
analysis_limits = bundle.get("analysis", {}).get("limitations_summary", {})
limitations_text = analysis_limits.get("text", "")

if limitations_text:
    print(f"\nLimitations Summary: {limitations_text}")

print("\n" + "=" * 80)
print("PLEASE ANSWER:")
print("=" * 80)
print("A) is_main_claim_correct: yes/no/unsure")
print("B) should_have_abstained: yes/no/unsure")
print("C) if A=no: severity_if_wrong (high/med/low) + what_is_wrong (1 sentence) + expected_evidence (brief)")
print("=" * 80)





