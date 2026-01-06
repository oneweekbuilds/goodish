"""
Statistical helper functions for Accuracy Architecture v3.1 (HPA + CMA).

Phase 5C2: Wilson confidence interval for binomial proportions.

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

