"""
Run this script to fix the database connection bug.
Usage: python fix_database.py
"""
import re

filepath = "backend/database.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Count existing conn.close() calls (not in comments)
lines = content.split("\n")
close_count = 0
for line in lines:
    stripped = line.strip()
    if stripped == "conn.close()" or stripped == "conn.close()  # Close connection":
        close_count += 1

print(f"Found {close_count} conn.close() calls to remove")

if close_count == 0:
    print("No conn.close() calls found - file may already be patched!")
else:
    # Replace all conn.close() lines with a comment
    new_lines = []
    replaced = 0
    for line in lines:
        stripped = line.strip()
        if stripped == "conn.close()" or stripped == "conn.close()  # Close connection":
            indent = line[:len(line) - len(line.lstrip())]
            new_lines.append(indent + "# Connection is thread-local and reused — do not close")
            replaced += 1
        else:
            new_lines.append(line)

    content = "\n".join(new_lines)

    # Also fix get_connection() to add health check if not already present
    if "conn.execute(\"SELECT 1\")" not in content:
        old_get_conn = '''    conn = getattr(_local, "connection", None)
    if conn is None:'''
        new_get_conn = '''    conn = getattr(_local, "connection", None)

    # Check if the cached connection is still open
    if conn is not None:
        try:
            conn.execute("SELECT 1")
        except Exception:
            conn = None
            _local.connection = None

    if conn is None:'''
        content = content.replace(old_get_conn, new_get_conn)
        print("Added connection health check to get_connection()")
    else:
        print("Connection health check already present")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Done! Replaced {replaced} conn.close() calls.")
    print("Uvicorn should auto-reload. If not, restart your backend.")
