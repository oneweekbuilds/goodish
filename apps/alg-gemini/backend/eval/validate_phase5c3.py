"""Validate Phase 5C3 fields in live HTTP response."""
import requests
import json

url = "http://localhost:8000/api/scans/desktop-1767216093373-0dykcpc/evidence-bundle/ads"
response = requests.get(url, timeout=15)
bundle = response.json().get("bundle", {})
obs = bundle.get("observations", {})

print("=== Phase 5C3 Fields Validation ===")
print(f"ad_rate_percent: {obs.get('ad_rate_percent')}")
print(f"total_posts_seen: {obs.get('total_posts_seen')}")
print(f"total_ads_detected: {obs.get('total_ads_detected')}")

wilson_ci = obs.get("ad_rate_percent_ci")
print(f"\nad_rate_percent_ci (wilson):")
if wilson_ci:
    print(json.dumps(wilson_ci, indent=2))
else:
    print("NULL")

bayesian_ci = obs.get("ad_rate_percent_ci_bayesian")
print(f"\nad_rate_percent_ci_bayesian:")
if bayesian_ci:
    print(json.dumps(bayesian_ci, indent=2))
else:
    print("NULL")

print(f"\nad_rate_percent_bayesian: {obs.get('ad_rate_percent_bayesian')}")
print(f"ad_rate_estimate_method: {obs.get('ad_rate_estimate_method')}")
print(f"prior_used: {obs.get('prior_used')}")

prior_info = bayesian_ci.get("prior_info") if bayesian_ci else None
print(f"\nprior_info:")
if prior_info:
    print(json.dumps(prior_info, indent=2))
else:
    print("NULL")

# Compute widths
if wilson_ci:
    wilson_width = wilson_ci.get("upper", 0) - wilson_ci.get("lower", 0)
    print(f"\nwilson_width: {wilson_width:.1f}%")
else:
    wilson_width = None
    print("\nwilson_width: N/A")

if bayesian_ci:
    bayes_width = bayesian_ci.get("upper", 0) - bayesian_ci.get("lower", 0)
    print(f"bayes_width: {bayes_width:.1f}%")
    print(f"bayes_width >= 5%: {bayes_width >= 5.0}")
else:
    bayes_width = None
    print("bayes_width: N/A")

# Validation checks
print("\n=== Validation Checks ===")
n = obs.get("total_posts_seen", 0)
prior_used = obs.get("prior_used", False)
estimate_method = obs.get("ad_rate_estimate_method", "unknown")

print(f"n = {n}")
print(f"wilson_width = {wilson_width:.1f}%" if wilson_width else "wilson_width = N/A")
print(f"prior_used = {prior_used}")
print(f"estimate_method = {estimate_method}")

if wilson_width is not None:
    expected_prior_used = (n < 100) and (wilson_width > 10.0)
    if prior_used != expected_prior_used:
        print(f"\n[BUG] prior_used mismatch!")
        print(f"   Expected: {expected_prior_used} (n={n} < 100: {n < 100}, width={wilson_width:.1f}% > 10%: {wilson_width > 10.0})")
        print(f"   Actual: {prior_used}")
    else:
        print(f"\n[OK] Prior activation logic correct")
        
    if prior_used and bayesian_ci:
        bayes_width_check = bayesian_ci.get("upper", 0) - bayesian_ci.get("lower", 0)
        if bayes_width_check < 5.0:
            print(f"\n[BUG] Bayesian CI width {bayes_width_check:.1f}% < 5% minimum!")
        else:
            print(f"\n[OK] Bayesian CI width >= 5% ({bayes_width_check:.1f}%)")

