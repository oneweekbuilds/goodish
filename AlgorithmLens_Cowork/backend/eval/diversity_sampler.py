#!/usr/bin/env python3
"""
Diversity Sampler for Ground Truth Labeling

Selects a diverse subset of items that maximizes coverage of:
- Edge cases (low confidence predictions)
- Different signal types
- Different claim statuses
- Different tabs/categories
- Different evidence patterns

Usage:
    python diversity_sampler.py --run 20260108_012303 --sample-size 50
    python diversity_sampler.py --run 20260108_012303 --strategy edge_cases
    python diversity_sampler.py --scan scan_desktop-xxx.json --item-sample 30
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from collections import defaultdict
import random
from datetime import datetime


class DiversitySampler:
    """Samples items to maximize diversity and edge case coverage."""

    def __init__(self, seed: int = 42):
        self.rng = random.Random(seed)

    def score_item_diversity(self, item: Dict[str, Any], seen_patterns: Dict[str, Set]) -> float:
        """
        Score an item by how much diversity it adds.
        Higher score = more diverse (hasn't been seen before).
        """
        score = 0.0
        patterns = self._extract_patterns(item)

        for pattern_type, pattern_values in patterns.items():
            if pattern_type not in seen_patterns:
                seen_patterns[pattern_type] = set()

            for value in pattern_values:
                if value not in seen_patterns[pattern_type]:
                    score += 1.0  # New pattern = adds diversity

        return score

    def _extract_patterns(self, item: Dict[str, Any]) -> Dict[str, List[str]]:
        """Extract pattern features from an item for diversity scoring."""
        patterns = defaultdict(list)

        # Bundle-level patterns
        pred = item.get("predicted", {})
        patterns["claim_status"].append(pred.get("claim_status", "unknown"))
        patterns["tab"].append(item.get("tab", "unknown"))

        # Evidence count buckets
        evidence_len = pred.get("evidence_ids_len", 0)
        if evidence_len == 0:
            patterns["evidence_bucket"].append("zero")
        elif evidence_len <= 2:
            patterns["evidence_bucket"].append("low")
        elif evidence_len <= 10:
            patterns["evidence_bucket"].append("medium")
        else:
            patterns["evidence_bucket"].append("high")

        # Insight type
        insight_id = pred.get("main_insight_id", "")
        patterns["insight_type"].append(insight_id.split("-")[0] if insight_id else "unknown")

        # Critic metrics
        critic = pred.get("critic_metrics", {})
        if critic.get("downgraded_final_to_preliminary", 0) > 0:
            patterns["downgraded"].append("preliminary")
        if critic.get("downgraded_final_to_abstain", 0) > 0:
            patterns["downgraded"].append("abstain")

        return patterns

    def _extract_feed_item_patterns(self, item: Dict[str, Any]) -> Dict[str, List[str]]:
        """Extract patterns from a feed item for diversity scoring."""
        patterns = defaultdict(list)

        # Is ad
        is_ad = item.get("is_ad", False)
        patterns["is_ad"].append("ad" if is_ad else "organic")

        # Ad label type
        ad_label = item.get("ad_label", "")
        if ad_label:
            patterns["ad_label_type"].append(ad_label)

        # Account presence
        account = item.get("account", {})
        has_handle = bool(account.get("account_handle"))
        patterns["has_account"].append("yes" if has_handle else "no")

        # Text presence
        post_content = item.get("post_content", {})
        has_text = bool(post_content.get("text_content"))
        patterns["has_text"].append("yes" if has_text else "no")

        # Hashtag presence
        hashtags = post_content.get("hashtags", [])
        if hashtags:
            patterns["has_hashtags"].append("yes")
            # Sample some hashtag categories
            for tag in hashtags[:5]:
                tag_lower = tag.lower()
                if any(kw in tag_lower for kw in ["fitness", "gym", "workout"]):
                    patterns["hashtag_category"].append("fitness")
                elif any(kw in tag_lower for kw in ["beauty", "makeup", "skincare"]):
                    patterns["hashtag_category"].append("beauty")
                elif any(kw in tag_lower for kw in ["fashion", "style", "outfit"]):
                    patterns["hashtag_category"].append("fashion")
                elif any(kw in tag_lower for kw in ["food", "recipe", "cooking"]):
                    patterns["hashtag_category"].append("food")
        else:
            patterns["has_hashtags"].append("no")

        # OCR data (mobile video indicator)
        has_ocr = bool(item.get("ocr_data"))
        patterns["has_ocr"].append("yes" if has_ocr else "no")

        return patterns

    def sample_bundles_diverse(self, items: List[Dict[str, Any]], n: int,
                               strategy: str = "balanced") -> List[Dict[str, Any]]:
        """
        Sample n bundle items for maximum diversity.

        Strategies:
        - balanced: Equal coverage of all pattern types
        - edge_cases: Prioritize unusual/low-confidence cases
        - stratified: Ensure minimum representation of each tab
        """
        if n >= len(items):
            return items

        sampled = []
        seen_patterns: Dict[str, Set] = defaultdict(set)

        if strategy == "stratified":
            # First, ensure at least one item per tab
            tab_items: Dict[str, List] = defaultdict(list)
            for item in items:
                tab_items[item.get("tab", "unknown")].append(item)

            for tab, tab_item_list in tab_items.items():
                if tab_item_list and len(sampled) < n:
                    selected = self.rng.choice(tab_item_list)
                    sampled.append(selected)
                    for pattern_type, values in self._extract_patterns(selected).items():
                        seen_patterns[pattern_type].update(values)

        if strategy == "edge_cases":
            # Prioritize items with:
            # - ABSTAIN or PRELIMINARY status
            # - Low evidence count
            # - Downgrades from critic
            edge_scores = []
            for item in items:
                score = 0
                pred = item.get("predicted", {})

                if pred.get("claim_status") in ["ABSTAIN", "PRELIMINARY"]:
                    score += 2
                if pred.get("evidence_ids_len", 0) <= 2:
                    score += 1

                critic = pred.get("critic_metrics", {})
                if critic.get("downgraded_final_to_preliminary", 0) > 0:
                    score += 2
                if critic.get("downgraded_final_to_abstain", 0) > 0:
                    score += 3

                edge_scores.append((score, item))

            # Sort by edge score, take top items
            edge_scores.sort(key=lambda x: -x[0])
            for _, item in edge_scores:
                if item not in sampled and len(sampled) < n:
                    sampled.append(item)
                    for pattern_type, values in self._extract_patterns(item).items():
                        seen_patterns[pattern_type].update(values)

        # Fill remaining slots with diversity-based selection
        remaining = [item for item in items if item not in sampled]
        self.rng.shuffle(remaining)

        while len(sampled) < n and remaining:
            # Score each remaining item by diversity contribution
            best_item = None
            best_score = -1

            for item in remaining[:50]:  # Sample from top 50 for efficiency
                score = self.score_item_diversity(item, seen_patterns)
                if score > best_score:
                    best_score = score
                    best_item = item

            if best_item:
                sampled.append(best_item)
                remaining.remove(best_item)
                for pattern_type, values in self._extract_patterns(best_item).items():
                    seen_patterns[pattern_type].update(values)
            else:
                # No diversity gain, just pick randomly
                item = remaining.pop(0)
                sampled.append(item)

        return sampled

    def sample_feed_items_diverse(self, items: List[Dict[str, Any]], n: int) -> List[tuple]:
        """
        Sample n feed items for maximum diversity.
        Returns list of (index, item) tuples.
        """
        if n >= len(items):
            return [(i, item) for i, item in enumerate(items)]

        indexed_items = [(i, item) for i, item in enumerate(items)]
        sampled = []
        seen_patterns: Dict[str, Set] = defaultdict(set)

        # First, ensure some ads and non-ads
        ads = [(i, item) for i, item in indexed_items if item.get("is_ad")]
        non_ads = [(i, item) for i, item in indexed_items if not item.get("is_ad")]

        # Add some ads if available
        if ads:
            n_ads = min(len(ads), max(1, n // 5))  # At least 20% ads if available
            selected_ads = self.rng.sample(ads, n_ads)
            for idx, item in selected_ads:
                sampled.append((idx, item))
                for pattern_type, values in self._extract_feed_item_patterns(item).items():
                    seen_patterns[pattern_type].update(values)

        # Fill with diversity-based selection from non-ads
        remaining = [x for x in indexed_items if x not in sampled]
        self.rng.shuffle(remaining)

        while len(sampled) < n and remaining:
            best_item = None
            best_idx = None
            best_score = -1

            for idx, item in remaining[:30]:
                patterns_copy = {k: v.copy() for k, v in seen_patterns.items()}
                score = 0
                for pattern_type, values in self._extract_feed_item_patterns(item).items():
                    for v in values:
                        if v not in patterns_copy.get(pattern_type, set()):
                            score += 1
                if score > best_score:
                    best_score = score
                    best_item = item
                    best_idx = idx

            if best_item is not None:
                sampled.append((best_idx, best_item))
                remaining = [(i, it) for i, it in remaining if i != best_idx]
                for pattern_type, values in self._extract_feed_item_patterns(best_item).items():
                    seen_patterns[pattern_type].update(values)
            elif remaining:
                idx, item = remaining.pop(0)
                sampled.append((idx, item))

        return sorted(sampled, key=lambda x: x[0])


def sample_from_run(run_dir: Path, sample_size: int, strategy: str) -> Dict[str, Any]:
    """Sample bundle items from a ground truth run."""
    labels_file = run_dir / "labels_v0.json"
    if not labels_file.exists():
        raise FileNotFoundError(f"labels_v0.json not found in {run_dir}")

    with open(labels_file, 'r', encoding='utf-8') as f:
        labels_data = json.load(f)

    items = labels_data.get("items", [])
    sampler = DiversitySampler()
    sampled = sampler.sample_bundles_diverse(items, sample_size, strategy)

    # Generate sampling report
    report = {
        "source_run": str(run_dir),
        "strategy": strategy,
        "requested_size": sample_size,
        "actual_size": len(sampled),
        "original_size": len(items),
        "sampled_at": datetime.now().isoformat(),
        "distribution": {
            "by_tab": defaultdict(int),
            "by_status": defaultdict(int),
            "by_evidence_bucket": defaultdict(int)
        }
    }

    for item in sampled:
        report["distribution"]["by_tab"][item.get("tab", "unknown")] += 1
        report["distribution"]["by_status"][item.get("predicted", {}).get("claim_status", "unknown")] += 1

        evidence_len = item.get("predicted", {}).get("evidence_ids_len", 0)
        if evidence_len == 0:
            bucket = "zero"
        elif evidence_len <= 2:
            bucket = "low"
        elif evidence_len <= 10:
            bucket = "medium"
        else:
            bucket = "high"
        report["distribution"]["by_evidence_bucket"][bucket] += 1

    # Convert defaultdicts to regular dicts
    report["distribution"] = {k: dict(v) for k, v in report["distribution"].items()}

    return {
        "report": report,
        "sampled_items": sampled
    }


def sample_from_scan(scan_path: Path, sample_size: int) -> Dict[str, Any]:
    """Sample feed items from a scan file."""
    with open(scan_path, 'r', encoding='utf-8') as f:
        scan_data = json.load(f)

    feed_items = scan_data.get("result", {}).get("feed_items", [])
    sampler = DiversitySampler()
    sampled = sampler.sample_feed_items_diverse(feed_items, sample_size)

    # Generate report
    report = {
        "source_scan": str(scan_path),
        "requested_size": sample_size,
        "actual_size": len(sampled),
        "original_size": len(feed_items),
        "sampled_at": datetime.now().isoformat(),
        "distribution": {
            "ads": sum(1 for _, item in sampled if item.get("is_ad")),
            "organic": sum(1 for _, item in sampled if not item.get("is_ad")),
            "with_text": sum(1 for _, item in sampled if item.get("post_content", {}).get("text_content")),
            "with_hashtags": sum(1 for _, item in sampled if item.get("post_content", {}).get("hashtags")),
            "with_ocr": sum(1 for _, item in sampled if item.get("ocr_data"))
        },
        "sampled_positions": [idx for idx, _ in sampled]
    }

    return {
        "report": report,
        "sampled_items": sampled
    }


def print_report(report: Dict[str, Any]):
    """Print sampling report."""
    print("\n" + "=" * 60)
    print("DIVERSITY SAMPLING REPORT")
    print("=" * 60)
    print(f"Source: {report.get('source_run') or report.get('source_scan')}")
    print(f"Strategy: {report.get('strategy', 'n/a')}")
    print(f"Sampled: {report['actual_size']} / {report['original_size']} items")
    print(f"Time: {report['sampled_at']}")
    print()

    dist = report.get("distribution", {})

    if "by_tab" in dist:
        print("Distribution by Tab:")
        for tab, count in sorted(dist["by_tab"].items()):
            print(f"  {tab}: {count}")
        print()

    if "by_status" in dist:
        print("Distribution by Claim Status:")
        for status, count in sorted(dist["by_status"].items()):
            print(f"  {status}: {count}")
        print()

    if "by_evidence_bucket" in dist:
        print("Distribution by Evidence Count:")
        for bucket, count in sorted(dist["by_evidence_bucket"].items()):
            print(f"  {bucket}: {count}")
        print()

    if "ads" in dist:
        print("Feed Item Distribution:")
        print(f"  Ads: {dist['ads']}")
        print(f"  Organic: {dist['organic']}")
        print(f"  With text: {dist['with_text']}")
        print(f"  With hashtags: {dist['with_hashtags']}")
        print(f"  With OCR: {dist['with_ocr']}")
        print()

    if "sampled_positions" in report:
        positions = report["sampled_positions"]
        print(f"Sampled positions: {positions[:10]}{'...' if len(positions) > 10 else ''}")

    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Diversity Sampler for Ground Truth")
    parser.add_argument("--run", help="Run directory for bundle sampling")
    parser.add_argument("--scan", help="Scan file for item-level sampling")
    parser.add_argument("--sample-size", type=int, default=50, help="Number of items to sample")
    parser.add_argument("--strategy", choices=["balanced", "edge_cases", "stratified"],
                       default="balanced", help="Sampling strategy")
    parser.add_argument("--output", help="Output file for sampled items JSON")
    args = parser.parse_args()

    eval_dir = Path(__file__).parent

    if args.run:
        run_dir = eval_dir / "gt_runs" / args.run
        if not run_dir.exists():
            print(f"Error: Run directory not found: {run_dir}")
            sys.exit(1)

        result = sample_from_run(run_dir, args.sample_size, args.strategy)
        print_report(result["report"])

        if args.output:
            output_path = Path(args.output)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\nSampled items written to: {output_path}")

    elif args.scan:
        scan_path = eval_dir / "baselines" / args.scan
        if not scan_path.exists():
            print(f"Error: Scan file not found: {scan_path}")
            sys.exit(1)

        result = sample_from_scan(scan_path, args.sample_size)
        print_report(result["report"])

        if args.output:
            output_path = Path(args.output)
            # Convert sampled items to serializable format
            result["sampled_items"] = [
                {"position": idx, "item": item}
                for idx, item in result["sampled_items"]
            ]
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\nSampled items written to: {output_path}")

    else:
        print("Error: Must specify --run or --scan")
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
