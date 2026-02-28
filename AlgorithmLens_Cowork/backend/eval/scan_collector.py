#!/usr/bin/env python3
"""
Scan Collection Workflow for Ground Truth

Manages the collection and organization of scan data for ground truth labeling.
Provides tools to:
- Copy new scans to baselines directory
- Generate bundles for new scans
- Create or update ground truth runs
- Track labeling progress across scans

Usage:
    python scan_collector.py --add-scan /path/to/scan.json
    python scan_collector.py --new-run my_run_name --scans scan1.json scan2.json
    python scan_collector.py --list-baselines
    python scan_collector.py --progress
"""

import json
import sys
import os
import shutil
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime


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


def get_eval_dir() -> Path:
    return Path(__file__).parent


def get_baselines_dir() -> Path:
    return get_eval_dir() / "baselines"


def get_gt_runs_dir() -> Path:
    return get_eval_dir() / "gt_runs"


def validate_scan_file(scan_path: Path) -> Dict[str, Any]:
    """Validate a scan JSON file and return summary info."""
    try:
        with open(scan_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Check required structure
        result = data.get("result", {})
        feed_items = result.get("feed_items", [])
        metadata = data.get("metadata", {})

        info = {
            "valid": True,
            "scan_id": metadata.get("scan_id", scan_path.stem),
            "platform": metadata.get("platform", "unknown"),
            "source_type": metadata.get("source_type", "unknown"),
            "feed_items_count": len(feed_items),
            "timestamp": metadata.get("timestamp"),
            "has_ocr": any(item.get("ocr_data") for item in feed_items),
            "ads_count": sum(1 for item in feed_items if item.get("is_ad")),
            "issues": []
        }

        # Validation checks
        if not feed_items:
            info["issues"].append("No feed items found")
        if not metadata.get("scan_id"):
            info["issues"].append("Missing scan_id in metadata")

        return info

    except json.JSONDecodeError as e:
        return {
            "valid": False,
            "scan_id": scan_path.stem,
            "issues": [f"Invalid JSON: {e}"]
        }
    except Exception as e:
        return {
            "valid": False,
            "scan_id": scan_path.stem,
            "issues": [f"Error: {e}"]
        }


def add_scan_to_baselines(scan_path: Path, force: bool = False) -> bool:
    """Copy a scan file to the baselines directory."""
    baselines_dir = get_baselines_dir()
    baselines_dir.mkdir(exist_ok=True)

    # Validate scan
    info = validate_scan_file(scan_path)
    print(f"\n{Colors.BOLD}Validating scan: {scan_path.name}{Colors.END}")
    print(f"  Scan ID: {info['scan_id']}")
    print(f"  Platform: {info['platform']}")
    print(f"  Feed items: {info['feed_items_count']}")
    print(f"  Ads: {info['ads_count']}")
    print(f"  Has OCR: {info['has_ocr']}")

    if info["issues"]:
        print(f"  {Colors.YELLOW}Issues:{Colors.END}")
        for issue in info["issues"]:
            print(f"    - {issue}")

    if not info["valid"]:
        print(f"\n{Colors.RED}Scan validation failed. Not adding to baselines.{Colors.END}")
        return False

    # Generate filename
    dest_name = f"scan_{info['scan_id']}.json"
    dest_path = baselines_dir / dest_name

    if dest_path.exists() and not force:
        print(f"\n{Colors.YELLOW}Scan already exists: {dest_path}{Colors.END}")
        print("Use --force to overwrite.")
        return False

    # Copy file
    shutil.copy2(scan_path, dest_path)
    print(f"\n{Colors.GREEN}Added scan to baselines: {dest_path}{Colors.END}")
    return True


def list_baselines():
    """List all scan files in baselines directory."""
    baselines_dir = get_baselines_dir()

    if not baselines_dir.exists():
        print(f"{Colors.YELLOW}No baselines directory found.{Colors.END}")
        return

    scan_files = sorted(baselines_dir.glob("scan_*.json"))
    bundle_files = sorted(baselines_dir.glob("bundle_*.json"))

    print(f"\n{Colors.BOLD}Baselines Directory: {baselines_dir}{Colors.END}")
    print()

    if not scan_files:
        print(f"  {Colors.DIM}No scan files found{Colors.END}")
    else:
        print(f"{Colors.CYAN}Scan Files ({len(scan_files)}):{Colors.END}")
        for scan_file in scan_files:
            info = validate_scan_file(scan_file)
            status = Colors.GREEN + "OK" + Colors.END if info["valid"] else Colors.RED + "ERR" + Colors.END
            print(f"  [{status}] {scan_file.name}")
            print(f"       Items: {info['feed_items_count']}, Ads: {info['ads_count']}, OCR: {info['has_ocr']}")

    print()

    if bundle_files:
        print(f"{Colors.CYAN}Bundle Files ({len(bundle_files)}):{Colors.END}")
        for bundle_file in bundle_files:
            print(f"  {bundle_file.name}")


def list_gt_runs():
    """List all ground truth runs."""
    gt_runs_dir = get_gt_runs_dir()

    if not gt_runs_dir.exists():
        print(f"{Colors.YELLOW}No gt_runs directory found.{Colors.END}")
        return

    runs = sorted([d for d in gt_runs_dir.iterdir() if d.is_dir()])

    print(f"\n{Colors.BOLD}Ground Truth Runs:{Colors.END}")
    print()

    if not runs:
        print(f"  {Colors.DIM}No runs found{Colors.END}")
        return

    for run_dir in runs:
        labels_file = run_dir / "labels_v0.json"
        if labels_file.exists():
            with open(labels_file, 'r', encoding='utf-8') as f:
                labels_data = json.load(f)

            items = labels_data.get("items", [])
            labeled = sum(1 for item in items
                         if item.get("ground_truth", {}).get("is_main_claim_correct") is not None)

            print(f"  {Colors.CYAN}{run_dir.name}{Colors.END}")
            print(f"    Items: {len(items)}, Labeled: {labeled}/{len(items)}")
        else:
            print(f"  {Colors.DIM}{run_dir.name} (no labels_v0.json){Colors.END}")


def create_new_run(run_name: str, scan_ids: List[str], tabs: Optional[List[str]] = None) -> Path:
    """Create a new ground truth run directory structure."""
    gt_runs_dir = get_gt_runs_dir()
    gt_runs_dir.mkdir(exist_ok=True)

    # Generate run name with timestamp if not provided
    if not run_name:
        run_name = datetime.now().strftime("%Y%m%d_%H%M%S")

    run_dir = gt_runs_dir / run_name
    if run_dir.exists():
        print(f"{Colors.RED}Run directory already exists: {run_dir}{Colors.END}")
        return run_dir

    run_dir.mkdir()

    # Default tabs
    if not tabs:
        tabs = ["ads", "politics", "patterns", "creators", "inferences"]

    # Create summary.json
    summary = {
        "run_name": run_name,
        "created_at": datetime.now().isoformat(),
        "scan_ids": scan_ids,
        "tabs": tabs,
        "notes": ""
    }

    summary_file = run_dir / "summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)

    print(f"\n{Colors.GREEN}Created new run: {run_dir}{Colors.END}")
    print(f"  Scans: {len(scan_ids)}")
    print(f"  Tabs: {tabs}")
    print(f"\nNext steps:")
    print(f"  1. Generate bundles for the scans")
    print(f"  2. Copy bundles to run directory")
    print(f"  3. Run: python generate_labels_v0.py {run_name}")
    print(f"  4. Run: python labeling_cli.py --run {run_name}")

    return run_dir


def show_progress():
    """Show overall labeling progress across all runs."""
    gt_runs_dir = get_gt_runs_dir()
    item_labels_dir = get_eval_dir() / "item_labels"

    print(f"\n{Colors.BOLD}=" * 60)
    print("GROUND TRUTH LABELING PROGRESS")
    print("=" * 60 + Colors.END)

    # Bundle-level progress
    print(f"\n{Colors.CYAN}Bundle-Level Labels:{Colors.END}")
    total_items = 0
    total_labeled = 0

    if gt_runs_dir.exists():
        for run_dir in sorted(gt_runs_dir.iterdir()):
            if not run_dir.is_dir():
                continue

            labels_file = run_dir / "labels_v0.json"
            if labels_file.exists():
                with open(labels_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                items = data.get("items", [])
                labeled = sum(1 for item in items
                             if item.get("ground_truth", {}).get("is_main_claim_correct") is not None)

                total_items += len(items)
                total_labeled += labeled

                pct = (labeled / len(items) * 100) if items else 0
                bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))

                print(f"  {run_dir.name}: [{bar}] {labeled}/{len(items)} ({pct:.0f}%)")

    print(f"\n  {Colors.BOLD}Total: {total_labeled}/{total_items} bundle items labeled{Colors.END}")

    # Item-level progress
    print(f"\n{Colors.CYAN}Item-Level Labels:{Colors.END}")
    total_item_labels = 0

    if item_labels_dir.exists():
        for labels_file in sorted(item_labels_dir.glob("*.json")):
            with open(labels_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            items = data.get("items", {})
            total_item_labels += len(items)
            print(f"  {labels_file.name}: {len(items)} items labeled")
    else:
        print(f"  {Colors.DIM}No item-level labels directory{Colors.END}")

    print(f"\n  {Colors.BOLD}Total: {total_item_labels} individual feed items labeled{Colors.END}")

    # Recommendations
    print(f"\n{Colors.YELLOW}Recommendations:{Colors.END}")
    if total_items < 50:
        print(f"  - Add more scans to reach at least 50 bundle items")
    if total_labeled < total_items:
        print(f"  - Label remaining {total_items - total_labeled} bundle items")
    if total_item_labels < 100:
        print(f"  - Add item-level labels for more granular accuracy")

    print()


def main():
    parser = argparse.ArgumentParser(description="Scan Collection Workflow")
    parser.add_argument("--add-scan", help="Add a scan file to baselines")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    parser.add_argument("--new-run", help="Create a new ground truth run")
    parser.add_argument("--scans", nargs="+", help="Scan IDs for new run")
    parser.add_argument("--list-baselines", action="store_true", help="List baseline files")
    parser.add_argument("--list-runs", action="store_true", help="List ground truth runs")
    parser.add_argument("--progress", action="store_true", help="Show labeling progress")
    parser.add_argument("--validate", help="Validate a scan file")
    args = parser.parse_args()

    if args.add_scan:
        scan_path = Path(args.add_scan)
        if not scan_path.exists():
            print(f"{Colors.RED}Error: File not found: {scan_path}{Colors.END}")
            sys.exit(1)
        add_scan_to_baselines(scan_path, args.force)

    elif args.validate:
        scan_path = Path(args.validate)
        if not scan_path.exists():
            print(f"{Colors.RED}Error: File not found: {scan_path}{Colors.END}")
            sys.exit(1)
        info = validate_scan_file(scan_path)
        print(json.dumps(info, indent=2))

    elif args.new_run:
        if not args.scans:
            print(f"{Colors.RED}Error: --scans required with --new-run{Colors.END}")
            sys.exit(1)
        create_new_run(args.new_run, args.scans)

    elif args.list_baselines:
        list_baselines()

    elif args.list_runs:
        list_gt_runs()

    elif args.progress:
        show_progress()

    else:
        # Default: show progress
        show_progress()


if __name__ == "__main__":
    main()
