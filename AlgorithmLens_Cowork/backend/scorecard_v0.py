"""Generate Scorecard v0 for ground truth validation."""
import json
from pathlib import Path
from collections import defaultdict

# Find the most recent gt_runs directory
gt_runs_dir = Path(__file__).parent / "eval" / "gt_runs"
runs = sorted([d for d in gt_runs_dir.iterdir() if d.is_dir()], reverse=True)
if not runs:
    print("No gt_runs directories found!")
    sys.exit(1)

latest_run = runs[0]
print(f"Processing: {latest_run}")
print("=" * 100)

# Load summary to get scan IDs
summary_path = latest_run / "summary.json"
with open(summary_path, encoding="utf-8") as f:
    summary = json.load(f)

scan_ids = summary["scan_ids"]
tabs = ["ads", "politics", "patterns", "creators", "inferences"]

results = []

for scan_id in scan_ids:
    scan_results = {"scan_id": scan_id, "tabs": {}}
    
    for tab in tabs:
        filename = f"{scan_id}__{tab}.json"
        filepath = latest_run / filename
        
        if not filepath.exists():
            scan_results["tabs"][tab] = {"error": "File not found"}
            continue
        
        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)
        
        bundle = data.get("bundle", {})
        
        # Counts
        evidence_items = bundle.get("evidence_items", {})
        ev_count = len(evidence_items) if isinstance(evidence_items, dict) else len(evidence_items) if evidence_items else 0
        
        insights = bundle.get("insights", [])
        ins_count = len(insights) if insights else 0
        
        conflict_resolutions = bundle.get("conflict_resolutions", {})
        conflict_count = len(conflict_resolutions) if isinstance(conflict_resolutions, dict) else 0
        
        # Insight statuses
        final_count = sum(1 for ins in insights if ins.get("claim_status") == "FINAL")
        prelim_count = sum(1 for ins in insights if ins.get("claim_status") == "PRELIMINARY")
        abstain_count = sum(1 for ins in insights if ins.get("claim_status") == "ABSTAIN")
        
        # Critic metrics
        critic_metrics = bundle.get("critic_metrics", {})
        critic_downgraded = critic_metrics.get("downgraded_final_to_preliminary", 0)
        critic_validation = critic_metrics.get("validation_passed", True)
        
        # Evidence chain metrics
        ec_metrics = bundle.get("evidence_chain_metrics", {})
        ec_validation = ec_metrics.get("validation_passed", True)
        ec_linking = ec_metrics.get("evidence_linking_rate", 0.0)
        ec_missing = ec_metrics.get("missing_evidence_rate", 0.0)
        ec_orphan = ec_metrics.get("orphan_evidence_rate", 0.0)
        
        # Top 3 insights
        top_insights = []
        for ins in insights[:3]:
            eid_count = len(ins.get("evidence_ids", []))
            top_insights.append({
                "id": ins.get("insight_id", "unknown"),
                "status": ins.get("claim_status", "unknown"),
                "evidence_ids_count": eid_count,
            })
        
        scan_results["tabs"][tab] = {
            "evidence_items": ev_count,
            "insights": ins_count,
            "conflict_resolutions": conflict_count,
            "final": final_count,
            "preliminary": prelim_count,
            "abstain": abstain_count,
            "critic_downgraded": critic_downgraded,
            "critic_validation_passed": critic_validation,
            "ec_validation_passed": ec_validation,
            "ec_linking_rate": ec_linking,
            "ec_missing_rate": ec_missing,
            "ec_orphan_rate": ec_orphan,
            "top_insights": top_insights,
        }
    
    results.append(scan_results)

# Print scorecard tables
print("\nSCORECARD V0 - DIAGNOSTICS SUMMARY")
print("=" * 100)

for result in results:
    scan_id = result["scan_id"]
    print(f"\n{'='*100}")
    print(f"SCAN: {scan_id}")
    print(f"{'='*100}")
    
    # Header
    print(f"\n{'Tab':<12} {'EvItems':<8} {'Insights':<8} {'Conflicts':<10} {'FINAL':<6} {'PRELIM':<7} {'ABSTAIN':<8} {'Critic':<7} {'EC Valid':<9} {'EC Link':<9} {'EC Miss':<9} {'EC Orph':<9}")
    print("-" * 100)
    
    for tab in tabs:
        t = result["tabs"].get(tab, {})
        if "error" in t:
            print(f"{tab:<12} {'ERROR':<8}")
            continue
        
        print(
            f"{tab:<12} "
            f"{t['evidence_items']:<8} "
            f"{t['insights']:<8} "
            f"{t['conflict_resolutions']:<10} "
            f"{t['final']:<6} "
            f"{t['preliminary']:<7} "
            f"{t['abstain']:<8} "
            f"{t['critic_downgraded']:<7} "
            f"{str(t['critic_validation_passed']):<9} "
            f"{t['ec_validation_passed']:<9} "
            f"{t['ec_linking_rate']:<9.2f} "
            f"{t['ec_missing_rate']:<9.2f} "
            f"{t['ec_orphan_rate']:<9.2f}"
        )
    
    # Top insights per tab
    print(f"\n{'Top Insights by Tab:'}")
    print("-" * 100)
    for tab in tabs:
        t = result["tabs"].get(tab, {})
        if "error" in t or not t.get("top_insights"):
            continue
        print(f"\n{tab.upper()}:")
        for ins in t["top_insights"]:
            print(f"  - {ins['id']:<40} | {ins['status']:<12} | evidence_ids: {ins['evidence_ids_count']}")

print(f"\n{'='*100}")
print(f"Scorecard complete. Data from: {latest_run}")
print(f"{'='*100}")

