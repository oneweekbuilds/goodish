"""
Diagnose the 'Cannot operate on a closed database' issue.
Run from project root: python diagnose_db.py
"""
import os
import shutil
import glob

print("=" * 60)
print("DATABASE DIAGNOSIS")
print("=" * 60)

# 1. Check database.py for any conn.close() calls
print("\n--- Step 1: Checking database.py for conn.close() ---")
db_path = "backend/database.py"
with open(db_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "close()" in line.lower():
        print(f"  Line {i}: {line.rstrip()}")

# 2. Check for get_connection health check
print("\n--- Step 2: Checking get_connection() has health check ---")
content = "".join(lines)
if "SELECT 1" in content:
    print("  OK: Health check (SELECT 1) is present")
else:
    print("  MISSING: No health check in get_connection()")

# 3. Check for __pycache__ files
print("\n--- Step 3: Checking for cached .pyc files ---")
pycache_dirs = glob.glob("backend/**/__pycache__", recursive=True)
pyc_files = glob.glob("backend/**/*.pyc", recursive=True)
print(f"  Found {len(pycache_dirs)} __pycache__ directories")
print(f"  Found {len(pyc_files)} .pyc files")
for p in pyc_files:
    mod_time = os.path.getmtime(p)
    import datetime
    ts = datetime.datetime.fromtimestamp(mod_time).isoformat()
    print(f"    {p} (modified: {ts})")

# 4. DELETE all __pycache__ to force fresh compilation
print("\n--- Step 4: Deleting all __pycache__ directories ---")
deleted = 0
for d in pycache_dirs:
    try:
        shutil.rmtree(d)
        deleted += 1
        print(f"  Deleted: {d}")
    except Exception as e:
        print(f"  Failed to delete {d}: {e}")
print(f"  Deleted {deleted} __pycache__ directories")

# 5. Test the database directly
print("\n--- Step 5: Testing database connection ---")
import sys
sys.path.insert(0, "backend")
# Force fresh import (no cached modules)
if "database" in sys.modules:
    del sys.modules["database"]

from database import get_connection, init_database

try:
    init_database()
    print("  init_database(): OK")
except Exception as e:
    print(f"  init_database() FAILED: {e}")

# Test multiple sequential calls (this is what fails with the bug)
print("\n--- Step 6: Testing sequential database calls ---")
for i in range(5):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM scans")
        count = cursor.fetchone()[0]
        print(f"  Call {i+1}: OK (found {count} scans)")
    except Exception as e:
        print(f"  Call {i+1}: FAILED - {type(e).__name__}: {e}")

print("\n" + "=" * 60)
print("DIAGNOSIS COMPLETE")
print("If Steps 5-6 show OK, restart your backend:")
print("  1. Go to the terminal running uvicorn")
print("  2. Press Ctrl+C to stop it")
print("  3. Run: python -m uvicorn app:app --reload --port 8000")
print("=" * 60)
