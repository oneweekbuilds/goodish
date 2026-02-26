# PostgreSQL Migration Plan

**Status:** Planning
**Priority:** Post-beta (required before scaling beyond ~50 concurrent users)
**Current state:** SQLite with WAL mode, local file `backend/scans.db`

## Why Migrate

SQLite works for a controlled beta with limited users, but it has fundamental limitations for production:

- Single-writer concurrency: only one write operation at a time across all connections
- No network access: the database file must be on the same machine as the server
- No horizontal scaling: can't run multiple backend instances against the same database
- No built-in encryption at rest
- No role-based access control

## Recommended Target

Use Supabase's built-in PostgreSQL (already in the stack for auth). This avoids adding another managed service.

## Tables to Migrate

1. **scans** — main scan storage (id, created_at, platform, user_id, result_json, status, error_message)
2. **subscriptions** — Stripe subscription state (user_id, stripe_customer_id, status, plan_type, trial_end, current_period_end)
3. **stripe_webhook_events** — idempotency tracking (event_id, event_type, created_at)
4. **aggregate_buckets** — weekly platform aggregates (platform, week_bucket, n_scans, n_items_total, n_ads_total)
5. **learned_priors** — Bayesian priors (platform, alpha, beta, effective_n)
6. **aggregation_config** — feature flags (key, value)

## Migration Steps

1. Create PostgreSQL tables in Supabase matching current SQLite schema
2. Add Row Level Security (RLS) policies: users can only read/write their own scans and subscriptions
3. Create a migration script that reads from SQLite and inserts into PostgreSQL
4. Update `database.py` to use `psycopg2` or `asyncpg` instead of `sqlite3`
5. Replace thread-local connection pattern with connection pooling
6. Update all parameterized queries from `?` (SQLite) to `%s` (psycopg2) or `$1` (asyncpg)
7. Test all endpoints against PostgreSQL
8. Run migration script on production data
9. Switch backend to PostgreSQL connection string
10. Keep SQLite as read-only fallback for 1 week, then remove

## Connection Pattern Change

**Current (SQLite):**
```python
_local = threading.local()
def get_connection():
    conn = getattr(_local, "connection", None)
    if conn is None:
        conn = sqlite3.connect(DB_PATH)
        _local.connection = conn
    return conn
```

**Target (PostgreSQL with connection pool):**
```python
from psycopg2 import pool
db_pool = pool.ThreadedConnectionPool(1, 10, dsn=os.getenv("DATABASE_URL"))

def get_connection():
    return db_pool.getconn()

def release_connection(conn):
    db_pool.putconn(conn)
```

## Environment Variables to Add

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## Estimated Effort

- Schema creation + RLS: 2-3 hours
- database.py rewrite: 4-6 hours
- Migration script: 2-3 hours
- Testing: 4-6 hours
- Total: ~2 days of focused work
