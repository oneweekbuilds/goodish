"""
Quick validation script for Phase 5C4.1 implementation.
"""

import sys
import os

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

print("=== Phase 5C4.1 Validation ===\n")

# Test 1: Database schema
print("1. Testing database schema...")
try:
    from database import init_database, get_connection
    init_database()
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    required_tables = ["scans", "aggregate_buckets", "learned_priors", "aggregation_config"]
    for table in required_tables:
        assert table in tables, f"Missing table: {table}"
    
    print(f"   [OK] All required tables exist: {', '.join(required_tables)}")
    
    # Check aggregation_config default
    cursor.execute("SELECT value FROM aggregation_config WHERE key = 'AGGREGATE_COLLECTION_ENABLED'")
    row = cursor.fetchone()
    assert row is not None, "Missing default config"
    assert row["value"] == "false", "Default should be 'false'"
    
    print("   [OK] Default config is 'false' (opt-in)")
    
    conn.close()
except Exception as e:
    print(f"   [FAIL] {e}")
    sys.exit(1)

# Test 2: Aggregation module
print("\n2. Testing aggregation module...")
try:
    from accuracy.aggregation import (
        is_aggregation_enabled,
        get_week_bucket,
        contribute_scan_to_aggregates
    )
    
    # Should be disabled by default
    enabled = is_aggregation_enabled()
    assert not enabled, "Should be disabled by default"
    print("   [OK] Aggregation disabled by default")
    
    # Week bucket format
    bucket = get_week_bucket("2026-01-06T12:00:00")
    assert "-W" in bucket, "Week bucket should contain '-W'"
    print(f"   [OK] Week bucket format: {bucket}")
    
except Exception as e:
    print(f"   [FAIL] {e}")
    sys.exit(1)

# Test 3: Prior selection
print("\n3. Testing prior selection...")
try:
    from accuracy.priors import get_ads_rate_prior
    
    # Should return bootstrap by default (no learned priors)
    alpha, beta, source = get_ads_rate_prior("twitter")
    assert source == "bootstrap", f"Expected bootstrap, got {source}"
    assert alpha > 0 and beta > 0, "Alpha and beta should be positive"
    print(f"   [OK] Bootstrap prior: alpha={alpha}, beta={beta}, source={source}")
    
except Exception as e:
    print(f"   [FAIL] {e}")
    sys.exit(1)

# Test 4: Update priors module
print("\n4. Testing update_priors module...")
try:
    from accuracy.update_priors import compute_learned_prior
    
    # Test with mock buckets
    mock_buckets = [
        {"platform": "twitter", "week_bucket": "2026-W01", "n_scans": 100,
         "n_items_total": 10000, "n_ads_total": 500}
    ]
    
    prior = compute_learned_prior(mock_buckets)
    assert prior is not None, "Should compute prior"
    assert "alpha" in prior and "beta" in prior, "Should have alpha and beta"
    print(f"   [OK] Prior computation works: alpha={prior['alpha']:.2f}, beta={prior['beta']:.2f}")
    
except Exception as e:
    print(f"   [FAIL] {e}")
    sys.exit(1)

print("\n=== All validation checks passed ===")

