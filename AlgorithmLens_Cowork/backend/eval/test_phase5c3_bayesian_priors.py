"""
Phase 5C3: Tests for Bayesian priors and credible intervals for Ads rate estimation.

Tests verify:
- Prior selection for known platforms + default fallback
- Activation logic (n < 100 AND wilson_width > 10%)
- Interval sanity (bounds, width >= 5%)
- Canonical method selection
"""

import pytest
import sys
import os

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)

from accuracy.stats import (
    wilson_ci_percent,
    bayesian_credible_interval,
    bayesian_point_estimate,
    beta_posterior_params,
    safe_bayesian_ci
)
from accuracy.priors import get_ads_rate_prior, should_use_prior, PLATFORM_PRIORS, DEFAULT_PRIOR
from evidence_bundle import build_ads_evidence_bundle


class TestPriorSelection:
    """Test prior selection for different platforms."""

    def test_known_platform_priors(self):
        """All expected platforms have defined priors."""
        expected_platforms = ["tiktok", "instagram", "youtube", "facebook", "twitter"]
        
        for platform in expected_platforms:
            alpha, beta, source = get_ads_rate_prior(platform)
            assert alpha > 0, f"Platform {platform} should have alpha > 0"
            assert beta > 0, f"Platform {platform} should have beta > 0"
            assert source == "bootstrap", f"Platform {platform} should have bootstrap source"
            
            # Check prior mean is reasonable (between 0 and 1)
            prior_mean = alpha / (alpha + beta)
            assert 0 < prior_mean < 1, f"Platform {platform} prior mean should be in (0, 1)"

    def test_unknown_platform_default(self):
        """Unknown platforms get default prior."""
        alpha, beta, source = get_ads_rate_prior("unknown_platform")
        assert alpha == DEFAULT_PRIOR.alpha
        assert beta == DEFAULT_PRIOR.beta
        assert source == DEFAULT_PRIOR.source

    def test_case_insensitive_platform(self):
        """Platform names are case-insensitive."""
        alpha1, beta1, _ = get_ads_rate_prior("TikTok")
        alpha2, beta2, _ = get_ads_rate_prior("tiktok")
        assert alpha1 == alpha2
        assert beta1 == beta2


class TestPriorActivation:
    """Test should_use_prior logic."""

    def test_activation_small_n_wide_ci(self):
        """Prior should activate for small n with wide CI."""
        # n=20, wilson_width=30% -> should activate
        assert should_use_prior(20, 30.0) == True

    def test_no_activation_large_n(self):
        """Prior should NOT activate for large n."""
        # n=150, even with wide CI -> should NOT activate
        assert should_use_prior(150, 30.0) == False

    def test_no_activation_narrow_ci(self):
        """Prior should NOT activate when CI is narrow."""
        # n=50, wilson_width=5% -> should NOT activate
        assert should_use_prior(50, 5.0) == False

    def test_activation_boundary_n_99(self):
        """Boundary case: n=99 should activate if CI is wide."""
        assert should_use_prior(99, 15.0) == True

    def test_no_activation_boundary_n_100(self):
        """Boundary case: n=100 should NOT activate."""
        assert should_use_prior(100, 15.0) == False

    def test_no_activation_boundary_width_10(self):
        """Boundary case: width=10% should NOT activate."""
        assert should_use_prior(50, 10.0) == False


class TestBayesianEstimation:
    """Test Bayesian estimation functions."""

    def test_posterior_params(self):
        """Posterior parameters combine prior and data correctly."""
        alpha0, beta0 = 2.0, 18.0
        k, n = 3, 25
        
        alpha_post, beta_post = beta_posterior_params(alpha0, beta0, k, n)
        
        assert alpha_post == alpha0 + k
        assert beta_post == beta0 + (n - k)

    def test_bayesian_point_estimate(self):
        """Posterior mean is computed correctly."""
        alpha, beta = 5.0, 20.0
        mean = bayesian_point_estimate(alpha, beta)
        
        expected_mean = alpha / (alpha + beta)
        assert abs(mean - expected_mean) < 1e-6

    def test_bayesian_ci_bounds(self):
        """Bayesian CI bounds are within [0, 100]."""
        alpha0, beta0 = 2.0, 18.0
        k, n = 3, 25
        
        lower, upper = bayesian_credible_interval(k, n, alpha0, beta0)
        
        assert 0.0 <= lower <= 1.0
        assert 0.0 <= upper <= 1.0
        assert lower <= upper

    def test_safe_bayesian_ci_min_width(self):
        """Safe Bayesian CI enforces minimum width."""
        alpha0, beta0 = 2.0, 18.0
        k, n = 100, 1000  # Large n, concentrated data
        
        lower, upper = safe_bayesian_ci(k, n, alpha0, beta0, min_width_percent=5.0)
        width = (upper - lower) * 100  # Convert to percentage points
        
        assert width >= 5.0, f"Interval width {width} should be >= 5%"

    def test_bayesian_ci_narrower_than_wilson_small_n(self):
        """Bayesian CI should be narrower than Wilson for small samples."""
        alpha0, beta0 = 2.0, 18.0
        k, n = 3, 25
        
        wilson_lower, wilson_upper = wilson_ci_percent(k, n)
        bayes_lower, bayes_upper = bayesian_credible_interval(k, n, alpha0, beta0)
        
        # Convert to percentage points for comparison
        wilson_width = wilson_upper - wilson_lower
        bayes_width = (bayes_upper - bayes_lower) * 100
        
        # Bayesian CI should be narrower (or equal) for small samples
        assert bayes_width <= wilson_width, f"Bayesian width {bayes_width} should be <= Wilson width {wilson_width}"


class TestEvidenceBundleIntegration:
    """Test Bayesian fields in evidence bundle."""

    def test_small_n_with_prior(self):
        """Small sample should include Bayesian CI when prior activates."""
        scan_result = {
            "scan_metadata": {
                "scan_id": "test-small-n",
                "platform": "tiktok",
                "created_at": "2024-01-01T12:00:00Z"
            },
            "aggregates": {
                "total_feed_items": 25,
                "total_ads": 3,
            },
            "feed_items": [
                {
                    "position_in_feed": i,
                    "is_ad": (i < 3),
                    "content_text": {"caption": f"Post {i}"},
                    "account": {"account_handle": f"user{i}"}
                }
                for i in range(25)
            ]
        }
        
        bundle = build_ads_evidence_bundle(scan_result)
        observations = bundle.get("observations", {})
        
        # Check Wilson CI exists
        assert observations.get("ad_rate_percent_ci") is not None
        
        # Check Bayesian CI exists (should activate for n=25 with wide CI)
        wilson_ci = observations.get("ad_rate_percent_ci", {})
        wilson_width = wilson_ci.get("upper", 0) - wilson_ci.get("lower", 0)
        
        if wilson_width > 10.0:  # Prior should activate
            assert observations.get("ad_rate_percent_ci_bayesian") is not None
            assert observations.get("prior_used") == True
            assert observations.get("ad_rate_estimate_method") == "bayesian_beta"
            
            bayesian_ci = observations.get("ad_rate_percent_ci_bayesian", {})
            assert "lower" in bayesian_ci
            assert "upper" in bayesian_ci
            assert "prior_info" in bayesian_ci
            assert bayesian_ci.get("prior_info", {}).get("platform") == "tiktok"

    def test_large_n_no_prior(self):
        """Large sample should NOT include Bayesian CI."""
        scan_result = {
            "scan_metadata": {
                "scan_id": "test-large-n",
                "platform": "tiktok",
                "created_at": "2024-01-01T12:00:00Z"
            },
            "aggregates": {
                "total_feed_items": 150,
                "total_ads": 15,
            },
            "feed_items": [
                {
                    "position_in_feed": i,
                    "is_ad": (i < 15),
                    "content_text": {"caption": f"Post {i}"},
                    "account": {"account_handle": f"user{i}"}
                }
                for i in range(150)
            ]
        }
        
        bundle = build_ads_evidence_bundle(scan_result)
        observations = bundle.get("observations", {})
        
        # Wilson CI should exist
        assert observations.get("ad_rate_percent_ci") is not None
        
        # Bayesian CI should NOT exist (n >= 100)
        assert observations.get("ad_rate_percent_ci_bayesian") is None
        assert observations.get("prior_used") == False
        assert observations.get("ad_rate_estimate_method") == "wilson"

    def test_interval_sanity(self):
        """Verify interval bounds and width constraints."""
        scan_result = {
            "scan_metadata": {
                "scan_id": "test-interval-sanity",
                "platform": "instagram",
                "created_at": "2024-01-01T12:00:00Z"
            },
            "aggregates": {
                "total_feed_items": 30,
                "total_ads": 4,
            },
            "feed_items": [
                {
                    "position_in_feed": i,
                    "is_ad": (i < 4),
                    "content_text": {"caption": f"Post {i}"},
                    "account": {"account_handle": f"user{i}"}
                }
                for i in range(30)
            ]
        }
        
        bundle = build_ads_evidence_bundle(scan_result)
        observations = bundle.get("observations", {})
        
        # Check Wilson CI sanity
        wilson_ci = observations.get("ad_rate_percent_ci", {})
        if wilson_ci:
            wilson_lower = wilson_ci.get("lower", 0)
            wilson_upper = wilson_ci.get("upper", 0)
            assert 0 <= wilson_lower <= 100
            assert 0 <= wilson_upper <= 100
            assert wilson_lower <= wilson_upper
        
        # Check Bayesian CI sanity if present
        bayesian_ci = observations.get("ad_rate_percent_ci_bayesian")
        if bayesian_ci:
            bayes_lower = bayesian_ci.get("lower", 0)
            bayes_upper = bayesian_ci.get("upper", 0)
            assert 0 <= bayes_lower <= 100
            assert 0 <= bayes_upper <= 100
            assert bayes_lower <= bayes_upper
            
            # Check minimum width (should be enforced by safe_bayesian_ci)
            bayes_width = bayes_upper - bayes_lower
            assert bayes_width >= 5.0, f"Bayesian CI width {bayes_width} should be >= 5%"
            
            # Check point estimate is within bounds
            point_estimate = bayesian_ci.get("point_estimate", 0)
            assert bayes_lower <= point_estimate <= bayes_upper


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

