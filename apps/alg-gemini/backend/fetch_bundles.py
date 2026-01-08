"""Fetch evidence bundles for ground truth validation."""
import requests
import json
import sys
from pathlib import Path
from datetime import datetime

scan_ids = [
    "desktop-1767216093373-0dykcpc",
    "desktop-1767213421203-es5qrua",
    "desktop-1767213795895-7cvybej",
    "desktop-1767282143724-w7lwh78",
    "desktop-1767214732271-5fvxxhi",
]

tabs = ["ads", "politics", "patterns", "creators", "inferences"]
base_url = "http://127.0.0.1:8000/api/scans"

# Create output directory
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_dir = Path(__file__).parent / "eval" / "gt_runs" / timestamp
output_dir.mkdir(parents=True, exist_ok=True)

print(f"Output directory: {output_dir}")
print(f"Fetching bundles for {len(scan_ids)} scans...")

fetched = []
errors = []

for scan_id in scan_ids:
    print(f"\nProcessing {scan_id}...")
    for tab in tabs:
        url = f"{base_url}/{scan_id}/evidence-bundle/{tab}"
        filename = f"{scan_id}__{tab}.json"
        filepath = output_dir / filename
        
        try:
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                data = response.json()
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                fetched.append({"scan_id": scan_id, "tab": tab, "file": filename})
                print(f"  [OK] {tab}: saved to {filename}")
            else:
                error_msg = f"HTTP {response.status_code}"
                errors.append({"scan_id": scan_id, "tab": tab, "error": error_msg})
                print(f"  [FAIL] {tab}: {error_msg}")
        except Exception as e:
            error_msg = str(e)
            errors.append({"scan_id": scan_id, "tab": tab, "error": error_msg})
            print(f"  ✗ {tab}: {error_msg}")

# Create summary.json
summary = {
    "timestamp": timestamp,
    "run_date": datetime.now().isoformat(),
    "scan_ids": scan_ids,
    "tabs": tabs,
    "fetched_count": len(fetched),
    "error_count": len(errors),
    "fetched": fetched,
    "errors": errors,
}

summary_path = output_dir / "summary.json"
with open(summary_path, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"Summary saved to: {summary_path}")
print(f"Total fetched: {len(fetched)}/{len(scan_ids) * len(tabs)}")
if errors:
    print(f"Errors: {len(errors)}")
    for err in errors:
        print(f"  - {err['scan_id']} / {err['tab']}: {err['error']}")
print(f"{'='*60}")

