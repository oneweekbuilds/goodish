#!/usr/bin/env python3
"""
Compare two snapshots of the issue registry to show what changed.
Used after each verification pass to generate a clear delta report.

Usage:
    python3 diff_registries.py --before registry_before.json --after registry_after.json
"""

import argparse
import json
import sys
from collections import Counter


def load_json(path):
    with open(path) as f:
        return json.load(f)


def diff_registries(before_path: str, after_path: str):
    before = load_json(before_path)
    after = load_json(after_path)

    before_issues = {i["id"]: i for i in before.get("issues", [])}
    after_issues = {i["id"]: i for i in after.get("issues", [])}

    before_ids = set(before_issues.keys())
    after_ids = set(after_issues.keys())

    new_ids = after_ids - before_ids
    removed_ids = before_ids - after_ids
    common_ids = before_ids & after_ids

    # Track transitions
    transitions = Counter()
    changed_issues = []
    unchanged_issues = []

    for iid in sorted(common_ids):
        b_status = before_issues[iid]["status"]
        a_status = after_issues[iid]["status"]
        if b_status != a_status:
            transitions[(b_status, a_status)] += 1
            changed_issues.append({
                "id": iid,
                "title": after_issues[iid].get("title", ""),
                "from": b_status,
                "to": a_status,
            })
        else:
            unchanged_issues.append(iid)

    # Print report
    print("═" * 58)
    print("  REGISTRY DIFF REPORT")
    print("═" * 58)

    # Before/after summary
    b_counts = Counter(i["status"] for i in before.get("issues", []))
    a_counts = Counter(i["status"] for i in after.get("issues", []))

    print(f"\n  Total issues: {len(before_issues)} → {len(after_issues)}")
    print()

    all_statuses = sorted(set(list(b_counts.keys()) + list(a_counts.keys())))
    for status in all_statuses:
        b = b_counts.get(status, 0)
        a = a_counts.get(status, 0)
        delta = a - b
        delta_str = f"+{delta}" if delta > 0 else str(delta) if delta < 0 else " 0"
        arrow = "↑" if delta > 0 else "↓" if delta < 0 else "="
        print(f"  {status:<18} {b:>3} → {a:>3}  ({delta_str}) {arrow}")

    # New issues
    if new_ids:
        print(f"\n  🆕 NEW ISSUES ({len(new_ids)}):")
        for iid in sorted(new_ids):
            issue = after_issues[iid]
            print(f"    {iid}: {issue.get('title', 'N/A')} [{issue.get('severity', '?')}]")

    # Removed issues (shouldn't normally happen)
    if removed_ids:
        print(f"\n  ⚠️  REMOVED ISSUES ({len(removed_ids)}):")
        for iid in sorted(removed_ids):
            print(f"    {iid}: {before_issues[iid].get('title', 'N/A')}")

    # Changed issues
    if changed_issues:
        print(f"\n  STATUS CHANGES ({len(changed_issues)}):")
        for change in changed_issues:
            emoji = {
                "VERIFIED": "✅",
                "CODE_VERIFIED": "🔵",
                "FIX_FAILED": "❌",
                "REGRESSED": "🔄",
                "FIX_ATTEMPTED": "🟡",
                "OPEN": "🔴",
            }.get(change["to"], "❓")
            print(f"    {emoji} {change['id']}: {change['from']} → {change['to']}")
            print(f"       {change['title']}")

    # Unchanged
    if unchanged_issues:
        print(f"\n  UNCHANGED: {len(unchanged_issues)} issues")

    # Transition summary
    if transitions:
        print(f"\n  TRANSITION SUMMARY:")
        for (from_s, to_s), count in sorted(transitions.items()):
            print(f"    {from_s} → {to_s}: {count}")

    print()
    print("═" * 58)

    # Completion comparison
    b_verified = b_counts.get("VERIFIED", 0)
    a_verified = a_counts.get("VERIFIED", 0)
    b_active = len(before_issues) - b_counts.get("DEFERRED", 0)
    a_active = len(after_issues) - a_counts.get("DEFERRED", 0)
    b_pct = (b_verified / b_active * 100) if b_active > 0 else 0
    a_pct = (a_verified / a_active * 100) if a_active > 0 else 0

    print(f"  Completion: {b_pct:.1f}% → {a_pct:.1f}%")
    print("═" * 58)


def main():
    parser = argparse.ArgumentParser(description="Diff two registry snapshots")
    parser.add_argument("--before", required=True, help="Path to before registry")
    parser.add_argument("--after", required=True, help="Path to after registry")
    args = parser.parse_args()
    diff_registries(args.before, args.after)


if __name__ == "__main__":
    main()
