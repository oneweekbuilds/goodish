"""
Phase 5C4.1: CLI tool to update learned priors from aggregate buckets.

Usage:
    python -m accuracy.update_priors --platform twitter
    python -m accuracy.update_priors --all
    python -m accuracy.update_priors --platform tiktok --dry-run
"""

import argparse
import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any
from database import get_connection
from accuracy.aggregation import get_eligible_buckets, DEFAULT_MIN_SCANS_PER_BUCKET


def compute_learned_prior(
    eligible_buckets: List[Dict[str, Any]],
    smoothing: float = 0.3,
    effective_n_min: float = 10.0,
    effective_n_max: float = 100.0
) -> Optional[Dict[str, Any]]:
    """
    Compute learned prior parameters from eligible buckets.
    
    Algorithm:
    1. Aggregate across eligible buckets: total_ads / total_items
    2. Convert to Beta params with bounded effective_n
    3. If existing learned prior exists, apply smoothing
    
    Args:
        eligible_buckets: List of eligible bucket dicts
        smoothing: Smoothing factor (0-1), higher = more weight to new data
        effective_n_min: Minimum effective_n for Beta prior
        effective_n_max: Maximum effective_n for Beta prior
    
    Returns:
        Dict with alpha, beta, effective_n, or None if insufficient data
    """
    if not eligible_buckets:
        return None
    
    # Aggregate across eligible buckets
    total_items = sum(b["n_items_total"] for b in eligible_buckets)
    total_ads = sum(b["n_ads_total"] for b in eligible_buckets)
    
    if total_items == 0:
        return None
    
    # Compute empirical mean
    empirical_mean = total_ads / total_items
    
    # Choose effective_n based on data volume, clamped to [min, max]
    # Use total scans as proxy for data volume
    total_scans = sum(b["n_scans"] for b in eligible_buckets)
    # Scale effective_n based on scans, but clamp
    effective_n = min(effective_n_max, max(effective_n_min, total_scans / 10.0))
    
    # Convert to Beta parameters
    alpha_emp = empirical_mean * effective_n
    beta_emp = (1 - empirical_mean) * effective_n
    
    # Check for existing learned prior
    conn = get_connection()
    cursor = conn.cursor()
    
    platform = eligible_buckets[0]["platform"]
    cursor.execute("""
        SELECT alpha, beta, effective_n, version
        FROM learned_priors
        WHERE platform = ?
    """, (platform,))
    
    existing = cursor.fetchone()
    conn.close()
    
    if existing and smoothing < 1.0:
        # Apply smoothing
        alpha_old = existing["alpha"]
        beta_old = existing["beta"]
        
        alpha_new = smoothing * alpha_emp + (1 - smoothing) * alpha_old
        beta_new = smoothing * beta_emp + (1 - smoothing) * beta_old
        effective_n_new = alpha_new + beta_new
    else:
        # No existing prior or no smoothing
        alpha_new = alpha_emp
        beta_new = beta_emp
        effective_n_new = effective_n
    
    return {
        "alpha": alpha_new,
        "beta": beta_new,
        "effective_n": effective_n_new,
        "empirical_mean": empirical_mean,
        "total_scans": total_scans,
        "total_items": total_items,
        "total_ads": total_ads
    }


def update_learned_prior(
    platform: str,
    prior_params: Dict[str, Any],
    dry_run: bool = False
) -> bool:
    """
    Write learned prior to database.
    
    Args:
        platform: Platform name (lowercase)
        prior_params: Dict with alpha, beta, effective_n, etc.
        dry_run: If True, print what would be written but don't write
    
    Returns:
        True if written, False otherwise
    """
    now = datetime.now().isoformat()
    version = f"learned_v{int(datetime.now().timestamp() // 86400)}"  # Daily version
    
    if dry_run:
        print(f"[DRY RUN] Would update learned_prior for {platform}:")
        print(f"  alpha: {prior_params['alpha']:.2f}")
        print(f"  beta: {prior_params['beta']:.2f}")
        print(f"  effective_n: {prior_params['effective_n']:.2f}")
        print(f"  version: {version}")
        print(f"  source: learned")
        print(f"  last_updated: {now}")
        return False
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR REPLACE INTO learned_priors
        (platform, alpha, beta, effective_n, version, last_updated, source, note)
        VALUES (?, ?, ?, ?, ?, ?, 'learned', ?)
    """, (
        platform,
        prior_params["alpha"],
        prior_params["beta"],
        prior_params["effective_n"],
        version,
        now,
        f"Computed from {prior_params['total_scans']} scans, {prior_params['total_items']} items"
    ))
    
    conn.commit()
    conn.close()
    
    print(f"[SUCCESS] Updated learned_prior for {platform}")
    return True


def update_priors_for_platform(
    platform: str,
    min_scans_per_bucket: int = DEFAULT_MIN_SCANS_PER_BUCKET,
    min_eligible_buckets: int = 4,
    smoothing: float = 0.3,
    effective_n_min: float = 10.0,
    effective_n_max: float = 100.0,
    dry_run: bool = False
) -> bool:
    """
    Update learned priors for a single platform.
    
    Args:
        platform: Platform name (lowercase)
        min_scans_per_bucket: Minimum scans per bucket for eligibility
        min_eligible_buckets: Minimum number of eligible buckets required
        smoothing: Smoothing factor for prior updates
        effective_n_min: Minimum effective_n
        effective_n_max: Maximum effective_n
        dry_run: If True, don't write to database
    
    Returns:
        True if prior was updated, False otherwise
    """
    eligible_buckets = get_eligible_buckets(platform, min_scans_per_bucket)
    
    if len(eligible_buckets) < min_eligible_buckets:
        print(f"[SKIP] {platform}: Only {len(eligible_buckets)} eligible buckets, need {min_eligible_buckets}")
        return False
    
    print(f"[INFO] {platform}: Found {len(eligible_buckets)} eligible buckets")
    
    prior_params = compute_learned_prior(
        eligible_buckets,
        smoothing=smoothing,
        effective_n_min=effective_n_min,
        effective_n_max=effective_n_max
    )
    
    if not prior_params:
        print(f"[ERROR] {platform}: Failed to compute prior parameters")
        return False
    
    print(f"[INFO] {platform}: Empirical mean = {prior_params['empirical_mean']*100:.1f}%")
    print(f"[INFO] {platform}: Computed alpha={prior_params['alpha']:.2f}, beta={prior_params['beta']:.2f}")
    
    return update_learned_prior(platform, prior_params, dry_run=dry_run)


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Update learned priors from aggregate buckets"
    )
    parser.add_argument(
        "--platform",
        type=str,
        help="Platform to update (e.g., 'twitter', 'tiktok')"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Update priors for all platforms with eligible data"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be changed without writing to database"
    )
    parser.add_argument(
        "--min-scans-per-bucket",
        type=int,
        default=DEFAULT_MIN_SCANS_PER_BUCKET,
        help=f"Minimum scans per bucket for eligibility (default: {DEFAULT_MIN_SCANS_PER_BUCKET})"
    )
    parser.add_argument(
        "--min-eligible-buckets",
        type=int,
        default=4,
        help="Minimum number of eligible buckets required (default: 4)"
    )
    parser.add_argument(
        "--smoothing",
        type=float,
        default=0.3,
        help="Smoothing factor for prior updates (default: 0.3)"
    )
    parser.add_argument(
        "--effective-n-min",
        type=float,
        default=10.0,
        help="Minimum effective_n for Beta prior (default: 10.0)"
    )
    parser.add_argument(
        "--effective-n-max",
        type=float,
        default=100.0,
        help="Maximum effective_n for Beta prior (default: 100.0)"
    )
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("[DRY RUN MODE] No database writes will be performed")
    
    if args.all:
        # Get all platforms with eligible buckets
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT platform
            FROM aggregate_buckets
            WHERE n_scans >= ?
        """, (args.min_scans_per_bucket,))
        platforms = [row["platform"] for row in cursor.fetchall()]
        conn.close()
        
        if not platforms:
            print("[INFO] No platforms with eligible buckets found")
            return
        
        print(f"[INFO] Updating priors for {len(platforms)} platforms: {', '.join(platforms)}")
        for platform in platforms:
            update_priors_for_platform(
                platform,
                min_scans_per_bucket=args.min_scans_per_bucket,
                min_eligible_buckets=args.min_eligible_buckets,
                smoothing=args.smoothing,
                effective_n_min=args.effective_n_min,
                effective_n_max=args.effective_n_max,
                dry_run=args.dry_run
            )
    elif args.platform:
        update_priors_for_platform(
            args.platform.lower(),
            min_scans_per_bucket=args.min_scans_per_bucket,
            min_eligible_buckets=args.min_eligible_buckets,
            smoothing=args.smoothing,
            effective_n_min=args.effective_n_min,
            effective_n_max=args.effective_n_max,
            dry_run=args.dry_run
        )
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

