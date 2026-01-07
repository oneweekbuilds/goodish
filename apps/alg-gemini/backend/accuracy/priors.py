"""
Platform-specific Bayesian priors for ad rate estimation.

Phase 5C3: Bootstrap priors based on industry reports.
Phase 5C4 (future): Will update priors from anonymized aggregate data.

These priors are used ONLY for aggregate rate estimation, never for
per-item classification. PLATFORM_LABEL evidence remains authoritative.
"""

from dataclasses import dataclass
from typing import Tuple


@dataclass(frozen=True)
class BetaPrior:
    """Immutable Beta prior parameters for a platform."""
    alpha: float
    beta: float
    source: str  # "bootstrap" | "aggregate_v1" | "aggregate_v2" ...
    effective_n: int  # alpha + beta (prior "sample size")


# Bootstrap defaults - will be replaced by aggregate-derived priors in Phase 5C4
PLATFORM_PRIORS: dict[str, BetaPrior] = {
    "tiktok": BetaPrior(
        alpha=2.0,
        beta=18.0,
        source="bootstrap",
        effective_n=20
    ),
    "instagram": BetaPrior(
        alpha=2.5,
        beta=17.5,
        source="bootstrap",
        effective_n=20
    ),
    "youtube": BetaPrior(
        alpha=1.5,
        beta=18.5,
        source="bootstrap",
        effective_n=20
    ),
    "facebook": BetaPrior(
        alpha=3.0,
        beta=17.0,
        source="bootstrap",
        effective_n=20
    ),
    "twitter": BetaPrior(
        alpha=2.0,
        beta=18.0,
        source="bootstrap",
        effective_n=20
    ),
}

# Default weak prior for unknown platforms: Beta(1, 9) = 10% mean, eff_n=10
DEFAULT_PRIOR = BetaPrior(
    alpha=1.0,
    beta=9.0,
    source="bootstrap",
    effective_n=10
)


def get_ads_rate_prior(platform: str) -> Tuple[float, float, str]:
    """
    Get the Beta prior parameters for a platform.
    
    Args:
        platform: Platform name (e.g., "tiktok", "instagram")
    
    Returns:
        Tuple of (alpha, beta, source) where:
        - alpha: Beta prior alpha parameter
        - beta: Beta prior beta parameter
        - source: Prior source ("bootstrap" for Phase 5C3)
    """
    prior = PLATFORM_PRIORS.get(platform.lower() if platform else "", DEFAULT_PRIOR)
    return (prior.alpha, prior.beta, prior.source)


def should_use_prior(n: int, wilson_ci_width: float) -> bool:
    """
    Determine whether to use Bayesian estimation with prior.
    
    Prior activates only when:
    1. Sample size n < 100 (prior loses influence at large n)
    2. Wilson CI width > 10 percentage points (prior helps when CI is wide)
    
    Args:
        n: Total number of items (sample size)
        wilson_ci_width: Width of Wilson CI in percentage points (0-100 scale)
    
    Returns:
        True if prior should be used, False otherwise
    """
    # Condition 1: Small sample (prior loses influence at large n anyway)
    if n >= 100:
        return False
    
    # Condition 2: Wilson CI is wide (prior can help)
    # If Wilson CI width < 10 percentage points, prior adds little value
    if wilson_ci_width < 10.0:
        return False
    
    return True

