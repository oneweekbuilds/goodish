"""Discover rich scan candidates for ground truth validation."""
import sqlite3
import json
from pathlib import Path

db_path = Path(__file__).parent / "scans.db"
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Get schema
cursor.execute("PRAGMA table_info(scans)")
cols = [row[1] for row in cursor.fetchall()]
print("Schema:", cols)

# Fetch scans
cursor.execute("SELECT id, created_at, platform, result_json FROM scans ORDER BY created_at DESC LIMIT 50")
scans = []

for row in cursor.fetchall():
    scan_id, created_at, platform, result_json_str = row
    try:
        result = json.loads(result_json_str) if result_json_str else {}
        feed_items = result.get("feed_items", [])
        n_items = len(feed_items)
        ads_count = sum(1 for item in feed_items if item.get("is_ad", False))
        
        has_ocr = any(
            item.get("content_text", {}).get("on_screen_labels")
            for item in feed_items
        )
        has_caption = any(
            item.get("content_text", {}).get("caption") or
            item.get("content_text", {}).get("post_text")
            for item in feed_items
        )
        has_hashtags = any(
            item.get("content_text", {}).get("hashtags")
            for item in feed_items
        )
        
        scans.append({
            "scan_id": scan_id,
            "created_at": created_at,
            "platform": platform,
            "total_items": n_items,
            "ads_count": ads_count,
            "has_ocr": has_ocr,
            "has_caption": has_caption,
            "has_hashtags": has_hashtags,
        })
    except Exception as e:
        print(f"Error processing {scan_id}: {e}")
        continue

conn.close()

# Sort by richness
scans.sort(
    key=lambda x: (
        x["total_items"],
        x["ads_count"],
        x["has_caption"],
        x["has_ocr"],
    ),
    reverse=True,
)

print("\nTop 15 scans by richness:")
print("-" * 100)
for i, s in enumerate(scans[:15], 1):
    print(
        f"{i:2d}. {s['scan_id']:40s} | {s['platform']:10s} | "
        f"items={s['total_items']:3d} ads={s['ads_count']:2d} | "
        f"ocr={s['has_ocr']} caption={s['has_caption']} hashtags={s['has_hashtags']}"
    )

print("\n" + "=" * 100)
print("SELECTED TOP 5 SCAN IDs:")
print("=" * 100)
for i, s in enumerate(scans[:5], 1):
    print(f"{i}. {s['scan_id']}")

