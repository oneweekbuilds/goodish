"""
Statistical helper functions for Accuracy Architecture v3.1 (HPA + CMA).

Phase 5C2: Wilson confidence interval for binomial proportions.
Phase 5C3: Bayesian credible intervals with Beta-Binomial model.

Reference: Wilson, E. B. (1927). "Probable inference, the law of succession,
and statistical inference." Journal of the American Statistical Association, 22(158), 209-212.
"""

import math
from typing import Tuple, Optional


def wilson_ci(k: int, n: int, conf: float = 0.95) -> Tuple[float, float]:
    """
    Compute Wilson confidence interval for a binomial proportion.
    
    This method is preferred over normal approximation for small samples and
    handles edge cases (k=0, k=n) gracefully.
    
    Args:
        k: Number of successes (e.g., number of ads)
        n: Total number of trials (e.g., total posts)
        conf: Confidence level (default 0.95 for 95% CI)
    
    Returns:
        Tuple of (lower_bound, upper_bound) as proportions in [0, 1]
    
    Edge cases:
        - n=0: Returns (0.0, 1.0) to indicate complete uncertainty
        - k=0: Returns valid CI with lower bound at or near 0
        - k=n: Returns valid CI with upper bound at or near 1
    """
    if n == 0:
        # No data: return full range to indicate complete uncertainty
        # This is safer than raising, as it allows downstream code to handle gracefully
        return (0.0, 1.0)
    
    if k < 0 or k > n:
        raise ValueError(f"k ({k}) must be between 0 and n ({n})")
    
    if conf <= 0 or conf >= 1:
        raise ValueError(f"conf ({conf}) must be between 0 and 1")
    
    # z-score for desired confidence level
    # For 95% CI: z = 1.96
    z = {
        0.90: 1.645,
        0.95: 1.96,
        0.99: 2.576,
    }.get(conf, 1.96)  # Default to 95% if not in lookup
    
    # Wilson score interval formula
    # p_hat = k/n (sample proportion)
    p_hat = k / n
    
    # Denominator: n + z^2
    denom = n + z * z
    
    # Center: (k + z^2/2) / (n + z^2)
    center = (k + z * z / 2) / denom
    
    # Margin: z * sqrt((p_hat * (1 - p_hat) + z^2/(4*n)) / (n + z^2))
    margin_numerator = p_hat * (1 - p_hat) + z * z / (4 * n)
    margin = z * math.sqrt(margin_numerator / denom)
    
    lower = max(0.0, center - margin)
    upper = min(1.0, center + margin)
    
    return (lower, upper)


def wilson_ci_percent(k: int, n: int, conf: float = 0.95) -> Tuple[float, float]:
    """
    Compute Wilson CI and return as percentages (0-100) instead of proportions (0-1).
    
    Convenience wrapper for wilson_ci that multiplies by 100.
    
    Args:
        k: Number of successes
        n: Total number of trials
        conf: Confidence level (default 0.95)
    
    Returns:
        Tuple of (lower_bound_percent, upper_bound_percent) in [0, 100]
    """
    lower, upper = wilson_ci(k, n, conf)
    return (lower * 100, upper * 100)


# ============================================================================
# Phase 5C3: Bayesian Beta-Binomial Estimation
# ============================================================================

def beta_posterior_params(alpha0: float, beta0: float, k: int, n: int) -> Tuple[float, float]:
    """
    Compute Beta posterior parameters from prior and observed data.
    
    For Beta-Binomial model:
    - Prior: Beta(α₀, β₀)
    - Likelihood: k successes in n trials
    - Posterior: Beta(α₀ + k, β₀ + n - k)
    
    Args:
        alpha0: Prior alpha parameter
        beta0: Prior beta parameter
        k: Number of observed successes
        n: Total number of trials
    
    Returns:
        Tuple of (alpha_posterior, beta_posterior)
    """
    alpha_post = alpha0 + k
    beta_post = beta0 + (n - k)
    return (alpha_post, beta_post)


def bayesian_point_estimate(alpha: float, beta: float) -> float:
    """
    Compute Bayesian point estimate (posterior mean) as proportion [0, 1].
    
    Posterior mean = α / (α + β)
    
    Args:
        alpha: Posterior alpha parameter
        beta: Posterior beta parameter
    
    Returns:
        Posterior mean as proportion in [0, 1]
    """
    return alpha / (alpha + beta)


def _beta_cdf(x: float, alpha: float, beta: float) -> float:
    """
    Approximate Beta CDF using numerical integration.
    
    This is a simple approximation using Simpson's rule for the incomplete
    beta function. For production use, scipy.stats.beta.cdf would be preferred,
    but we avoid adding heavy dependencies.
    
    Args:
        x: Value at which to evaluate CDF (0 <= x <= 1)
        alpha: Beta distribution alpha parameter
        beta: Beta distribution beta parameter
    
    Returns:
        CDF value P(X <= x)
    """
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    
    # Normalization constant (Beta function) using logarithms
    log_beta = (
        math.lgamma(alpha) + math.lgamma(beta) - math.lgamma(alpha + beta)
    )
    
    # Numerical integration: Simpson's rule with adaptive points
    # Use fewer points for efficiency, but ensure accuracy
    n_points = 50
    h = x / n_points
    integral = 0.0
    
    for i in range(0, n_points + 1):
        t = i * h
        if t <= 0:
            pdf_val = 0.0
        elif t >= 1:
            pdf_val = 0.0
        else:
            # Compute PDF: t^(α-1) * (1-t)^(β-1) / B(α,β)
            log_pdf = (alpha - 1) * math.log(t) + (beta - 1) * math.log(1 - t) - log_beta
            pdf_val = math.exp(log_pdf) if log_pdf > -700 else 0.0  # Avoid underflow
        
        if i == 0 or i == n_points:
            integral += pdf_val
        elif i % 2 == 1:
            integral += 4 * pdf_val
        else:
            integral += 2 * pdf_val
    
    integral *= h / 3.0
    return min(1.0, max(0.0, integral))


def _beta_ppf(p: float, alpha: float, beta: float) -> float:
    """
    Approximate Beta quantile function (inverse CDF) using binary search.
    
    Finds x such that P(X <= x) = p.
    
    Args:
        p: Probability (0 <= p <= 1)
        alpha: Beta distribution alpha parameter
        beta: Beta distribution beta parameter
    
    Returns:
        Quantile value x such that CDF(x) = p
    """
    if p <= 0:
        return 0.0
    if p >= 1:
        return 1.0
    
    # Binary search for quantile
    low, high = 0.0, 1.0
    tolerance = 1e-6
    max_iter = 100
    
    for _ in range(max_iter):
        mid = (low + high) / 2.0
        cdf_mid = _beta_cdf(mid, alpha, beta)
        
        if abs(cdf_mid - p) < tolerance:
            return mid
        
        if cdf_mid < p:
            low = mid
        else:
            high = mid
    
    return (low + high) / 2.0


def bayesian_credible_interval(
    k: int,
    n: int,
    alpha0: float,
    beta0: float,
    conf: float = 0.95
) -> Tuple[float, float]:
    """
    Compute Bayesian credible interval (Equal-Tailed Credible Interval) for ad rate.
    
    Uses Beta-Binomial model:
    - Prior: Beta(α₀, β₀)
    - Posterior: Beta(α₀ + k, β₀ + n - k)
    - Returns 95% ETCI: [Beta.ppf(0.025), Beta.ppf(0.975)]
    
    Args:
        k: Number of observed ads
        n: Total number of items
        alpha0: Prior alpha parameter
        beta0: Prior beta parameter
        conf: Confidence level (default 0.95)
    
    Returns:
        Tuple of (lower_bound, upper_bound) as proportions [0, 1]
    """
    alpha_post, beta_post = beta_posterior_params(alpha0, beta0, k, n)
    
    tail = (1 - conf) / 2
    lower = _beta_ppf(tail, alpha_post, beta_post)
    upper = _beta_ppf(1 - tail, alpha_post, beta_post)
    
    return (lower, upper)


def safe_bayesian_ci(
    k: int,
    n: int,
    alpha0: float,
    beta0: float,
    conf: float = 0.95,
    min_width_percent: float = 5.0
) -> Tuple[float, float]:
    """
    Compute Bayesian credible interval with minimum width enforcement.
    
    Enforces minimum interval width to prevent overconfident estimates.
    If computed interval width < min_width_percent, expands symmetrically
    around posterior mean while clamping to [0, 100].
    
    Args:
        k: Number of observed ads
        n: Total number of items
        alpha0: Prior alpha parameter
        beta0: Prior beta parameter
        conf: Confidence level (default 0.95)
        min_width_percent: Minimum interval width in percentage points (default 5.0)
    
    Returns:
        Tuple of (lower_bound, upper_bound) as proportions [0, 1]
    """
    lower, upper = bayesian_credible_interval(k, n, alpha0, beta0, conf)
    width = (upper - lower) * 100  # Convert to percentage points
    
    if width < min_width_percent:
        # Expand symmetrically around posterior mean
        alpha_post, beta_post = beta_posterior_params(alpha0, beta0, k, n)
        center = bayesian_point_estimate(alpha_post, beta_post)
        half_min = (min_width_percent / 100) / 2.0  # Convert to proportion
        
        lower = max(0.0, center - half_min)
        upper = min(1.0, center + half_min)
    
    return (lower, upper)

