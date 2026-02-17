# Plan: Database Scaling Beyond SQLite

**Date:** February 13, 2026
**Status:** Roadmap item — not urgent, plan for when needed
**When to act:** When you start seeing slow queries, concurrent write failures, or need to run multiple backend instances

---

## Current Setup

AlgorithmLens uses a single SQLite database file (`backend/scans.db`) for everything:

- **scans** — Scan metadata + full result JSON (this is the biggest table, each row can be large because it stores the entire scan result as JSON)
- **subscriptions** — Stripe subscription records (small, one row per user)
- **stripe_webhook_events** — Idempotency records for processed webhook events (small, grows slowly)
- **aggregate_buckets** — Weekly platform aggregate statistics (small)
- **learned_priors** — Bayesian prior parameters for classification (tiny, one row per platform)
- **aggregation_config** — Feature flags for data collection (tiny)

SQLite is accessed with `check_same_thread=False` because FastAPI handles requests across multiple threads.

## Why SQLite Works Fine Right Now

- You have a single backend server
- Write volume is low (one scan at a time per user)
- Read volume is low (one user viewing their dashboard)
- The data fits easily in a single file
- No need for replication or high availability
- Zero operational overhead (no database server to manage)

## When SQLite Will Start to Struggle

SQLite has a single-writer lock. Only one write can happen at a time across the entire database. Problems appear when:

1. **Multiple users scan simultaneously** — Each scan writes a large JSON blob. If two users submit scans at the exact same moment, one blocks the other.
2. **You need multiple backend servers** — SQLite is a file on disk. Two servers can't share the same file safely.
3. **The scans table gets very large** — With full JSON blobs per scan, this table grows fast. Queries that scan all rows (like listing a user's scan history) will slow down.

A rough rule of thumb: SQLite handles up to roughly 100 concurrent users comfortably. Beyond that, you'll want to migrate.

## Recommended Migration Path

### Step 1: PostgreSQL (When You Outgrow SQLite)

PostgreSQL is the natural next step. It handles concurrent writes, supports JSON columns natively, and scales to millions of rows without issue.

**What changes:**

- Replace `sqlite3` calls in `database.py` with a PostgreSQL library (like `asyncpg` or `psycopg2`)
- Change `TEXT` columns to appropriate PostgreSQL types (the `result_json TEXT` column can become `JSONB`, which allows querying into the JSON)
- Set up a PostgreSQL server (managed services like Supabase Postgres, AWS RDS, or Railway make this easy)
- Update the connection to use a database URL instead of a file path
- Run a one-time data migration to move existing SQLite data into PostgreSQL

**What stays the same:**

- All the SQL queries are standard and will work in PostgreSQL with minimal changes
- The `upsert_subscription` function uses `INSERT OR REPLACE` which becomes `INSERT ... ON CONFLICT DO UPDATE` in PostgreSQL
- The overall code structure (functions that get a connection, run a query, return results) stays identical

**Estimated effort:** 1-2 days of development, plus setting up the PostgreSQL server.

### Step 2: Separate Scan Storage (If Scans Get Very Large)

If you accumulate hundreds of thousands of scans, the full result JSON takes up significant space. At that point, you could:

- Store only scan metadata (ID, date, platform, summary stats) in the main database
- Store the full result JSON in object storage (like S3 or Cloudflare R2)
- Load the full result on demand when a user views a specific scan

This is only worth doing if storage costs or query performance become real problems.

### Step 3: Read Replicas (If You Need High Availability)

If AlgorithmLens becomes a high-traffic service, you'd add PostgreSQL read replicas so that dashboard queries don't compete with scan writes. This is standard PostgreSQL operations and doesn't require code changes.

## What NOT to Do

- **Don't migrate preemptively.** SQLite is simpler to operate and has zero moving parts. Migrating before you need to adds complexity for no benefit.
- **Don't use an ORM "just in case."** The current raw SQL approach is clear and fast. Adding SQLAlchemy or similar would be a significant rewrite with little benefit at this scale.
- **Don't shard the database.** Sharding is for millions of concurrent users. AlgorithmLens will be well-served by a single PostgreSQL instance for a very long time.

## Migration Checklist (When the Time Comes)

1. Set up a managed PostgreSQL instance (Supabase, Railway, or AWS RDS)
2. Create the same tables in PostgreSQL (adapt SQLite types to PostgreSQL)
3. Write a one-time migration script to copy data from SQLite to PostgreSQL
4. Update `database.py` to use PostgreSQL connections instead of SQLite
5. Change `INSERT OR REPLACE` to `INSERT ... ON CONFLICT DO UPDATE`
6. Test all database functions against PostgreSQL
7. Deploy with the new database connection string
8. Keep the old SQLite file as a backup until you're confident

---

*This is a planning document only. No code was changed.*
