#!/usr/bin/env python3
"""
Interactive CLI Labeling Tool for Ground Truth

Provides an efficient workflow for human labeling of ground truth items.
Supports bundle-level and item-level labeling with keyboard shortcuts.

Usage:
    python labeling_cli.py --run 20260108_012303
    python labeling_cli.py --run 20260108_012303 --filter unlabeled
    python labeling_cli.py --run 20260108_012303 --tab ads
"""

import json
import sys
import os
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime


# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'


def clear_screen():
    """Clear terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')


def load_labels(run_dir: Path) -> Dict[str, Any]:
    """Load labels_v0.json from run directory."""
    labels_file = run_dir / "labels_v0.json"
    if not labels_file.exists():
        raise FileNotFoundError(f"labels_v0.json not found in {run_dir}")
    with open(labels_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_labels(run_dir: Path, data: Dict[str, Any]):
    """Save labels to JSON file with backup."""
    labels_file = run_dir / "labels_v0.json"

    # Create backup
    backup_file = run_dir / f"labels_v0.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    if labels_file.exists():
        with open(labels_file, 'r', encoding='utf-8') as f:
            backup_data = f.read()
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(backup_data)

    # Save updated labels
    with open(labels_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_bundle(run_dir: Path, bundle_file: str) -> Optional[Dict[str, Any]]:
    """Load bundle JSON file."""
    bundle_path = run_dir / bundle_file
    if not bundle_path.exists():
        return None
    with open(bundle_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_item_status(item: Dict[str, Any]) -> str:
    """Get labeling status of an item."""
    gt = item.get("ground_truth", {})
    is_correct = gt.get("is_main_claim_correct")

    if is_correct is None:
        return "unlabeled"
    elif isinstance(is_correct, str) and is_correct.lower() in ["yes", "no"]:
        return "labeled"
    else:
        return "partial"


def display_item(item: Dict[str, Any], bundle: Optional[Dict[str, Any]], index: int, total: int):
    """Display item details for labeling."""
    clear_screen()

    pred = item.get("predicted", {})
    gt = item.get("ground_truth", {})

    print(f"{Colors.BOLD}{Colors.HEADER}=" * 80)
    print(f"  GROUND TRUTH LABELING - Item {index + 1}/{total}")
    print("=" * 80 + Colors.END)
    print()

    # Item identification
    print(f"{Colors.CYAN}Scan ID:{Colors.END} {item.get('scan_id', 'N/A')}")
    print(f"{Colors.CYAN}Tab:{Colors.END} {Colors.BOLD}{item.get('tab', 'N/A').upper()}{Colors.END}")
    print(f"{Colors.CYAN}Bundle:{Colors.END} {item.get('bundle_file', 'N/A')}")
    print()

    # Predicted values
    print(f"{Colors.YELLOW}--- Predicted Values ---{Colors.END}")
    print(f"  Claim Status: {Colors.BOLD}{pred.get('claim_status', 'N/A')}{Colors.END}")
    print(f"  Main Insight ID: {pred.get('main_insight_id', 'N/A')}")
    print(f"  Evidence IDs Length: {pred.get('evidence_ids_len', 'N/A')}")
    print(f"  Evidence Items Count: {pred.get('evidence_items_count', 'N/A')}")
    print(f"  Insights Count: {pred.get('insights_count', 'N/A')}")
    print()

    # Extract insight text from bundle if available
    if bundle:
        insights = bundle.get("bundle", {}).get("insights", [])
        if insights:
            main_insight = insights[0]
            claim_text = main_insight.get("claim_text", "")
            if claim_text:
                print(f"{Colors.YELLOW}--- Claim Text ---{Colors.END}")
                # Word wrap claim text
                words = claim_text.split()
                line = "  "
                for word in words:
                    if len(line) + len(word) > 75:
                        print(line)
                        line = "  "
                    line += word + " "
                if line.strip():
                    print(line)
                print()

            # Show evidence sample
            evidence_items = bundle.get("bundle", {}).get("evidence_items", {})
            if evidence_items:
                print(f"{Colors.YELLOW}--- Evidence Sample (first 3) ---{Colors.END}")
                evidence_ids = main_insight.get("evidence_ids", [])[:3]
                for ev_id in evidence_ids:
                    ev = evidence_items.get(ev_id, {})
                    signal_type = ev.get("signal_type", "unknown")
                    signal_subtype = ev.get("signal_subtype", "")
                    method = ev.get("detection_method", "unknown")
                    print(f"  - {ev_id[:30]}... ({signal_type}/{signal_subtype}, {method})")
                print()

    # Current labels
    print(f"{Colors.GREEN}--- Current Labels ---{Colors.END}")
    is_correct = gt.get("is_main_claim_correct")
    should_abstain = gt.get("should_have_abstained")

    status_color = Colors.RED if is_correct is None else Colors.GREEN
    print(f"  is_main_claim_correct: {status_color}{is_correct if is_correct else 'NOT SET'}{Colors.END}")
    print(f"  should_have_abstained: {should_abstain if should_abstain else 'NOT SET'}")
    print(f"  what_is_wrong: {gt.get('what_is_wrong', '')[:50]}")
    print(f"  notes: {gt.get('notes', '')[:50]}")
    print()


def display_help():
    """Display keyboard shortcuts."""
    print(f"{Colors.BOLD}--- Keyboard Shortcuts ---{Colors.END}")
    print()
    print(f"  {Colors.GREEN}y{Colors.END} - Mark claim as CORRECT (is_main_claim_correct=yes)")
    print(f"  {Colors.RED}n{Colors.END} - Mark claim as INCORRECT (is_main_claim_correct=no)")
    print(f"  {Colors.YELLOW}u{Colors.END} - Mark as UNSURE (is_main_claim_correct=unsure)")
    print()
    print(f"  {Colors.GREEN}a{Colors.END} - Should have abstained: YES")
    print(f"  {Colors.RED}d{Colors.END} - Should have abstained: NO")
    print(f"  {Colors.YELLOW}s{Colors.END} - Should have abstained: UNSURE")
    print()
    print(f"  {Colors.CYAN}w{Colors.END} - Add what_is_wrong note")
    print(f"  {Colors.CYAN}t{Colors.END} - Add notes")
    print(f"  {Colors.CYAN}v{Colors.END} - Set severity (high/med/low)")
    print()
    print(f"  {Colors.BLUE}>{Colors.END} - Next item")
    print(f"  {Colors.BLUE}<{Colors.END} - Previous item")
    print(f"  {Colors.BLUE}j{Colors.END} - Jump to item number")
    print()
    print(f"  {Colors.BLUE}q{Colors.END} - Save and quit")
    print(f"  {Colors.BLUE}!{Colors.END} - Quit without saving")
    print(f"  {Colors.BLUE}?{Colors.END} - Show this help")
    print()


def prompt_input(prompt: str) -> str:
    """Get input from user with prompt."""
    return input(f"{Colors.CYAN}{prompt}{Colors.END} ").strip()


def label_item(item: Dict[str, Any], bundle: Optional[Dict[str, Any]],
               index: int, total: int, run_dir: Path, labels_data: Dict[str, Any]) -> tuple:
    """
    Interactive labeling for a single item.

    Returns: (next_index, should_continue, should_save)
    """
    while True:
        display_item(item, bundle, index, total)
        display_help()

        cmd = prompt_input("Command:")
        gt = item.get("ground_truth", {})

        if cmd == 'y':
            gt["is_main_claim_correct"] = "yes"
            print(f"{Colors.GREEN}Set: is_main_claim_correct = yes{Colors.END}")

        elif cmd == 'n':
            gt["is_main_claim_correct"] = "no"
            print(f"{Colors.RED}Set: is_main_claim_correct = no{Colors.END}")

        elif cmd == 'u':
            gt["is_main_claim_correct"] = "unsure"
            print(f"{Colors.YELLOW}Set: is_main_claim_correct = unsure{Colors.END}")

        elif cmd == 'a':
            gt["should_have_abstained"] = "yes"
            print(f"{Colors.GREEN}Set: should_have_abstained = yes{Colors.END}")

        elif cmd == 'd':
            gt["should_have_abstained"] = "no"
            print(f"{Colors.RED}Set: should_have_abstained = no{Colors.END}")

        elif cmd == 's':
            gt["should_have_abstained"] = "unsure"
            print(f"{Colors.YELLOW}Set: should_have_abstained = unsure{Colors.END}")

        elif cmd == 'w':
            text = prompt_input("what_is_wrong:")
            gt["what_is_wrong"] = text
            print(f"Set: what_is_wrong = '{text[:30]}...'")

        elif cmd == 't':
            text = prompt_input("notes:")
            gt["notes"] = text
            print(f"Set: notes = '{text[:30]}...'")

        elif cmd == 'v':
            severity = prompt_input("severity (high/med/low):")
            if severity.lower() in ["high", "med", "low"]:
                gt["severity_if_wrong"] = severity.lower()
                print(f"Set: severity_if_wrong = {severity.lower()}")
            else:
                print(f"{Colors.RED}Invalid severity. Use: high, med, low{Colors.END}")

        elif cmd == '>' or cmd == '':
            # Next item
            if index < total - 1:
                return (index + 1, True, False)
            else:
                print(f"{Colors.YELLOW}Already at last item{Colors.END}")

        elif cmd == '<':
            # Previous item
            if index > 0:
                return (index - 1, True, False)
            else:
                print(f"{Colors.YELLOW}Already at first item{Colors.END}")

        elif cmd == 'j':
            try:
                jump_to = int(prompt_input("Jump to item #:")) - 1
                if 0 <= jump_to < total:
                    return (jump_to, True, False)
                else:
                    print(f"{Colors.RED}Invalid item number. Range: 1-{total}{Colors.END}")
            except ValueError:
                print(f"{Colors.RED}Invalid number{Colors.END}")

        elif cmd == 'q':
            # Save and quit
            save_labels(run_dir, labels_data)
            print(f"{Colors.GREEN}Labels saved to {run_dir / 'labels_v0.json'}{Colors.END}")
            return (index, False, True)

        elif cmd == '!':
            # Quit without saving
            confirm = prompt_input("Quit without saving? (yes/no):")
            if confirm.lower() == 'yes':
                return (index, False, False)

        elif cmd == '?':
            # Already showing help
            pass

        else:
            print(f"{Colors.RED}Unknown command: {cmd}. Press ? for help.{Colors.END}")

        input(f"{Colors.CYAN}Press Enter to continue...{Colors.END}")


def filter_items(items: List[Dict[str, Any]], filter_type: str, tab: Optional[str]) -> List[Dict[str, Any]]:
    """Filter items based on criteria."""
    filtered = items

    if tab:
        filtered = [item for item in filtered if item.get("tab") == tab]

    if filter_type == "unlabeled":
        filtered = [item for item in filtered if get_item_status(item) == "unlabeled"]
    elif filter_type == "labeled":
        filtered = [item for item in filtered if get_item_status(item) == "labeled"]
    elif filter_type == "incorrect":
        filtered = [item for item in filtered
                   if item.get("ground_truth", {}).get("is_main_claim_correct", "").lower() == "no"]

    return filtered


def print_summary(labels_data: Dict[str, Any]):
    """Print summary of labeling progress."""
    items = labels_data.get("items", [])

    labeled = sum(1 for item in items if get_item_status(item) == "labeled")
    unlabeled = sum(1 for item in items if get_item_status(item) == "unlabeled")
    partial = sum(1 for item in items if get_item_status(item) == "partial")

    print(f"\n{Colors.BOLD}Labeling Progress Summary:{Colors.END}")
    print(f"  Total items: {len(items)}")
    print(f"  {Colors.GREEN}Labeled:{Colors.END} {labeled}")
    print(f"  {Colors.RED}Unlabeled:{Colors.END} {unlabeled}")
    print(f"  {Colors.YELLOW}Partial:{Colors.END} {partial}")

    # Per-tab breakdown
    tab_counts = {}
    for item in items:
        tab = item.get("tab", "unknown")
        status = get_item_status(item)
        if tab not in tab_counts:
            tab_counts[tab] = {"labeled": 0, "unlabeled": 0, "partial": 0}
        tab_counts[tab][status] += 1

    print(f"\n  {Colors.BOLD}Per-tab breakdown:{Colors.END}")
    for tab in sorted(tab_counts.keys()):
        counts = tab_counts[tab]
        total = sum(counts.values())
        print(f"    {tab}: {counts['labeled']}/{total} labeled")


def main():
    parser = argparse.ArgumentParser(description="Interactive Ground Truth Labeling CLI")
    parser.add_argument("--run", required=True, help="Run directory name (e.g., 20260108_012303)")
    parser.add_argument("--filter", choices=["all", "unlabeled", "labeled", "incorrect"],
                       default="all", help="Filter items to show")
    parser.add_argument("--tab", choices=["ads", "politics", "patterns", "creators", "inferences"],
                       help="Filter by tab")
    parser.add_argument("--summary", action="store_true", help="Show summary only, don't label")
    args = parser.parse_args()

    eval_dir = Path(__file__).parent
    run_dir = eval_dir / "gt_runs" / args.run

    if not run_dir.exists():
        print(f"{Colors.RED}Error: Run directory not found: {run_dir}{Colors.END}")
        sys.exit(1)

    try:
        labels_data = load_labels(run_dir)
    except FileNotFoundError as e:
        print(f"{Colors.RED}Error: {e}{Colors.END}")
        sys.exit(1)

    if args.summary:
        print_summary(labels_data)
        sys.exit(0)

    items = labels_data.get("items", [])
    filtered_items = filter_items(items, args.filter, args.tab)

    if not filtered_items:
        print(f"{Colors.YELLOW}No items match the filter criteria.{Colors.END}")
        print_summary(labels_data)
        sys.exit(0)

    # Create index mapping to original items
    item_indices = []
    for i, orig_item in enumerate(items):
        if orig_item in filtered_items:
            item_indices.append(i)

    print(f"\n{Colors.GREEN}Found {len(filtered_items)} items to label.{Colors.END}")
    print_summary(labels_data)
    input(f"\n{Colors.CYAN}Press Enter to start labeling...{Colors.END}")

    # Start labeling loop
    current_idx = 0
    should_continue = True

    while should_continue and current_idx < len(filtered_items):
        item = filtered_items[current_idx]
        orig_idx = item_indices[current_idx]
        bundle = load_bundle(run_dir, item.get("bundle_file", ""))

        next_idx, should_continue, was_saved = label_item(
            item, bundle, current_idx, len(filtered_items), run_dir, labels_data
        )

        if should_continue:
            current_idx = next_idx

    # Final summary
    clear_screen()
    print(f"\n{Colors.GREEN}Labeling session complete.{Colors.END}")
    print_summary(labels_data)


if __name__ == "__main__":
    main()
