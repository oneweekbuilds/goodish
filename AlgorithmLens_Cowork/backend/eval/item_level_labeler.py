#!/usr/bin/env python3
"""
Item-Level Ground Truth Labeler

Labels individual feed items for more granular accuracy measurement.
Supports labeling for: ads, topics, wellbeing themes, creator extraction.

Usage:
    python item_level_labeler.py --scan scan_desktop-1767216093373-0dykcpc.json
    python item_level_labeler.py --scan scan_desktop-1767216093373-0dykcpc.json --category ads
    python item_level_labeler.py --list-scans
"""

import json
import sys
import os
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime


# ANSI colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    END = '\033[0m'


# Ground truth label categories
LABEL_CATEGORIES = {
    "is_ad": {
        "description": "Is this item an advertisement?",
        "options": ["yes", "no", "unclear"],
        "field": "is_ad_gt"
    },
    "is_unlabeled_promo": {
        "description": "Is this unlabeled promotional content?",
        "options": ["yes", "no", "unclear"],
        "field": "is_unlabeled_promo_gt"
    },
    "topic": {
        "description": "What is the primary topic?",
        "options": ["fitness", "beauty", "fashion", "food", "travel", "gaming",
                   "entertainment", "sports", "technology", "politics", "news",
                   "education", "lifestyle", "business", "other", "unclear"],
        "field": "topic_gt"
    },
    "wellbeing_theme": {
        "description": "Does this contain wellbeing-relevant content?",
        "options": ["body_image", "diet_weight_loss", "conflict", "none", "unclear"],
        "field": "wellbeing_theme_gt"
    },
    "creator_extracted": {
        "description": "Was the creator correctly extracted?",
        "options": ["yes", "no", "partial", "n/a"],
        "field": "creator_extracted_gt"
    }
}


def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')


def load_scan_data(scan_path: Path) -> Dict[str, Any]:
    """Load scan JSON file."""
    with open(scan_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_item_labels(labels_path: Path) -> Dict[str, Any]:
    """Load existing item-level labels or create new structure."""
    if labels_path.exists():
        with open(labels_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "version": "item_v0",
        "created_at": datetime.now().isoformat(),
        "scan_id": "",
        "items": {}
    }


def save_item_labels(labels_path: Path, data: Dict[str, Any]):
    """Save item-level labels."""
    data["updated_at"] = datetime.now().isoformat()
    with open(labels_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_item_context(item: Dict[str, Any]) -> Dict[str, Any]:
    """Extract displayable context from a feed item."""
    context = {
        "position": item.get("position_in_feed", "?"),
        "account_handle": None,
        "display_name": None,
        "is_ad": None,
        "ad_label": None,
        "text_preview": None,
        "hashtags": [],
        "ocr_text": None,
    }

    # Account info
    account = item.get("account", {})
    context["account_handle"] = account.get("account_handle")
    context["display_name"] = account.get("display_name")

    # Ad indicators
    context["is_ad"] = item.get("is_ad", False)
    context["ad_label"] = item.get("ad_label")

    # Text content
    post_content = item.get("post_content", {})
    context["text_preview"] = (post_content.get("text_content", "") or "")[:200]
    context["hashtags"] = post_content.get("hashtags", [])

    # OCR text (for mobile video)
    ocr_data = item.get("ocr_data", {})
    if isinstance(ocr_data, dict):
        ocr_texts = []
        for frame_data in ocr_data.values():
            if isinstance(frame_data, dict):
                ocr_texts.append(frame_data.get("text", "")[:100])
        context["ocr_text"] = " | ".join(ocr_texts)[:200] if ocr_texts else None

    return context


def display_feed_item(item: Dict[str, Any], item_id: str, labels: Dict[str, Any],
                     index: int, total: int, category: Optional[str] = None):
    """Display a feed item for labeling."""
    clear_screen()
    ctx = get_item_context(item)

    print(f"{Colors.BOLD}{Colors.HEADER}=" * 80)
    print(f"  ITEM-LEVEL LABELING - Item {index + 1}/{total}")
    print("=" * 80 + Colors.END)
    print()

    # Item identification
    print(f"{Colors.CYAN}Position in Feed:{Colors.END} {ctx['position']}")
    print(f"{Colors.CYAN}Item ID:{Colors.END} {item_id[:50]}...")
    print()

    # Account info
    if ctx["account_handle"] or ctx["display_name"]:
        print(f"{Colors.YELLOW}--- Account ---{Colors.END}")
        if ctx["account_handle"]:
            print(f"  Handle: {Colors.BOLD}@{ctx['account_handle']}{Colors.END}")
        if ctx["display_name"]:
            print(f"  Display Name: {ctx['display_name']}")
        print()

    # Ad indicators
    print(f"{Colors.YELLOW}--- Detected Signals ---{Colors.END}")
    ad_color = Colors.RED if ctx["is_ad"] else Colors.GREEN
    print(f"  Is Ad (detected): {ad_color}{ctx['is_ad']}{Colors.END}")
    if ctx["ad_label"]:
        print(f"  Ad Label: {ctx['ad_label']}")
    print()

    # Text content
    if ctx["text_preview"]:
        print(f"{Colors.YELLOW}--- Text Preview ---{Colors.END}")
        print(f"  {ctx['text_preview'][:150]}...")
        print()

    # Hashtags
    if ctx["hashtags"]:
        print(f"{Colors.YELLOW}--- Hashtags ---{Colors.END}")
        print(f"  {', '.join(ctx['hashtags'][:10])}")
        if len(ctx["hashtags"]) > 10:
            print(f"  ... and {len(ctx['hashtags']) - 10} more")
        print()

    # OCR text (mobile video)
    if ctx["ocr_text"]:
        print(f"{Colors.YELLOW}--- OCR Text (Mobile Video) ---{Colors.END}")
        print(f"  {ctx['ocr_text'][:150]}...")
        print()

    # Current labels for this item
    item_labels = labels.get("items", {}).get(item_id, {})
    print(f"{Colors.GREEN}--- Current Labels ---{Colors.END}")
    if not item_labels:
        print(f"  {Colors.DIM}No labels set{Colors.END}")
    else:
        for cat_key, cat_info in LABEL_CATEGORIES.items():
            field = cat_info["field"]
            value = item_labels.get(field)
            if value:
                print(f"  {field}: {Colors.BOLD}{value}{Colors.END}")
    print()


def display_category_help(category: str):
    """Display labeling options for a category."""
    if category not in LABEL_CATEGORIES:
        return

    cat_info = LABEL_CATEGORIES[category]
    print(f"{Colors.BOLD}--- {cat_info['description']} ---{Colors.END}")
    print()
    for i, opt in enumerate(cat_info["options"], 1):
        print(f"  {Colors.CYAN}{i}{Colors.END} - {opt}")
    print()
    print(f"  {Colors.BLUE}n{Colors.END} - Next item")
    print(f"  {Colors.BLUE}p{Colors.END} - Previous item")
    print(f"  {Colors.BLUE}c{Colors.END} - Change category")
    print(f"  {Colors.BLUE}q{Colors.END} - Save and quit")
    print()


def get_all_item_ids(scan_data: Dict[str, Any]) -> List[tuple]:
    """Get all item IDs from scan data."""
    items = []
    feed_items = scan_data.get("result", {}).get("feed_items", [])

    for i, item in enumerate(feed_items):
        # Generate stable item ID
        position = item.get("position_in_feed", i)
        account = item.get("account", {}).get("account_handle", "unknown")
        item_id = f"pos{position}_{account}"
        items.append((item_id, item))

    return items


def label_items(scan_path: Path, labels_path: Path, category: Optional[str] = None):
    """Interactive item labeling session."""
    scan_data = load_scan_data(scan_path)
    labels_data = load_item_labels(labels_path)

    # Set scan_id in labels
    labels_data["scan_id"] = scan_path.stem

    all_items = get_all_item_ids(scan_data)
    if not all_items:
        print(f"{Colors.RED}No feed items found in scan.{Colors.END}")
        return

    # Initialize items dict if needed
    if "items" not in labels_data:
        labels_data["items"] = {}

    current_idx = 0
    current_category = category or "is_ad"

    while True:
        item_id, item = all_items[current_idx]

        display_feed_item(item, item_id, labels_data, current_idx, len(all_items), current_category)
        display_category_help(current_category)

        cmd = input(f"{Colors.CYAN}Label ({current_category}):{Colors.END} ").strip()

        # Handle commands
        if cmd == 'q':
            save_item_labels(labels_path, labels_data)
            print(f"{Colors.GREEN}Labels saved to {labels_path}{Colors.END}")
            break

        elif cmd == 'n':
            if current_idx < len(all_items) - 1:
                current_idx += 1
            else:
                print(f"{Colors.YELLOW}Already at last item{Colors.END}")
                input("Press Enter...")

        elif cmd == 'p':
            if current_idx > 0:
                current_idx -= 1
            else:
                print(f"{Colors.YELLOW}Already at first item{Colors.END}")
                input("Press Enter...")

        elif cmd == 'c':
            print(f"\n{Colors.BOLD}Available categories:{Colors.END}")
            for i, (cat_key, cat_info) in enumerate(LABEL_CATEGORIES.items(), 1):
                print(f"  {i}. {cat_key}: {cat_info['description']}")
            try:
                cat_idx = int(input(f"\n{Colors.CYAN}Select category #:{Colors.END} ")) - 1
                cat_keys = list(LABEL_CATEGORIES.keys())
                if 0 <= cat_idx < len(cat_keys):
                    current_category = cat_keys[cat_idx]
            except (ValueError, IndexError):
                print(f"{Colors.RED}Invalid selection{Colors.END}")
                input("Press Enter...")

        elif cmd.isdigit():
            # Apply label
            cat_info = LABEL_CATEGORIES.get(current_category)
            if cat_info:
                opt_idx = int(cmd) - 1
                if 0 <= opt_idx < len(cat_info["options"]):
                    label_value = cat_info["options"][opt_idx]
                    field = cat_info["field"]

                    # Initialize item labels if needed
                    if item_id not in labels_data["items"]:
                        labels_data["items"][item_id] = {}

                    labels_data["items"][item_id][field] = label_value
                    print(f"{Colors.GREEN}Set {field} = {label_value}{Colors.END}")

                    # Auto-advance to next item
                    if current_idx < len(all_items) - 1:
                        current_idx += 1
                    input("Press Enter...")
                else:
                    print(f"{Colors.RED}Invalid option number{Colors.END}")
                    input("Press Enter...")

        else:
            print(f"{Colors.RED}Unknown command. Use numbers for labels or n/p/c/q.{Colors.END}")
            input("Press Enter...")


def list_available_scans(baselines_dir: Path):
    """List available scan files."""
    print(f"\n{Colors.BOLD}Available Scans:{Colors.END}")
    print()

    scan_files = list(baselines_dir.glob("scan_*.json"))
    if not scan_files:
        print(f"  {Colors.DIM}No scan files found in {baselines_dir}{Colors.END}")
        return

    for scan_file in sorted(scan_files):
        try:
            with open(scan_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            n_items = len(data.get("result", {}).get("feed_items", []))
            print(f"  {Colors.CYAN}{scan_file.name}{Colors.END}: {n_items} items")
        except Exception as e:
            print(f"  {Colors.RED}{scan_file.name}{Colors.END}: Error loading ({e})")

    print()


def print_label_stats(labels_path: Path):
    """Print statistics about labels."""
    if not labels_path.exists():
        print(f"{Colors.YELLOW}No labels file found.{Colors.END}")
        return

    with open(labels_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    items = data.get("items", {})
    print(f"\n{Colors.BOLD}Label Statistics:{Colors.END}")
    print(f"  Total items labeled: {len(items)}")

    # Count by category
    for cat_key, cat_info in LABEL_CATEGORIES.items():
        field = cat_info["field"]
        counts = {}
        for item_labels in items.values():
            value = item_labels.get(field)
            if value:
                counts[value] = counts.get(value, 0) + 1

        if counts:
            print(f"\n  {Colors.CYAN}{cat_key}:{Colors.END}")
            for value, count in sorted(counts.items()):
                print(f"    {value}: {count}")

    print()


def main():
    parser = argparse.ArgumentParser(description="Item-Level Ground Truth Labeler")
    parser.add_argument("--scan", help="Scan JSON file to label (in baselines/)")
    parser.add_argument("--category", choices=list(LABEL_CATEGORIES.keys()),
                       help="Initial category to label")
    parser.add_argument("--list-scans", action="store_true", help="List available scan files")
    parser.add_argument("--stats", action="store_true", help="Show label statistics")
    args = parser.parse_args()

    eval_dir = Path(__file__).parent
    baselines_dir = eval_dir / "baselines"
    item_labels_dir = eval_dir / "item_labels"

    # Create item_labels directory if needed
    item_labels_dir.mkdir(exist_ok=True)

    if args.list_scans:
        list_available_scans(baselines_dir)
        sys.exit(0)

    if args.stats:
        # Show stats for all label files
        for labels_file in item_labels_dir.glob("*.json"):
            print(f"\n{Colors.HEADER}=== {labels_file.name} ==={Colors.END}")
            print_label_stats(labels_file)
        sys.exit(0)

    if not args.scan:
        print(f"{Colors.RED}Error: --scan is required. Use --list-scans to see available files.{Colors.END}")
        sys.exit(1)

    scan_path = baselines_dir / args.scan
    if not scan_path.exists():
        print(f"{Colors.RED}Error: Scan file not found: {scan_path}{Colors.END}")
        list_available_scans(baselines_dir)
        sys.exit(1)

    # Labels file path
    labels_path = item_labels_dir / f"{scan_path.stem}_labels.json"

    label_items(scan_path, labels_path, args.category)


if __name__ == "__main__":
    main()
