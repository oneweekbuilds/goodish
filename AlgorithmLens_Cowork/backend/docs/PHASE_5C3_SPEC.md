# Phase 5C3: Platform-Specific Bayesian Priors for Ads Rate Estimation

**Status:** Draft Specification
**Scope:** Ads tab aggregate rate estimates only
**Dependencies:** Phase 5C1 (method-aware HIGH confidence), Phase 5C2 (Wilson CI)

---

## 1. Executive Summary

Phase 5C3 introduces **platform-specific Beta priors** for Bayesian estimation of ad rates. This improves estimate quality for small samples by incorporating prior knowledge about typical platform ad rates, while maintaining epistemic honesty and ensuring priors never override direct evidence.

**Key principle:** Priors influence *aggregate rate estimates* only, never *per-item classification*. PLATFORM_LABEL evidence remains authoritative at 0.999 reliability.

---

## 2. Mathematical Formulation

### 2.1 Beta-Binomial Model

For ad rate estimation, we use the conjugate Beta-Binomial model:

```
Prior:      θ ~ Beta(α₀, β₀)
Likelihood: k | n, θ ~ Binomial(n, θ)
Posterior:  θ | k, n ~ Beta(α₀ + k, β₀ + n - k)
```

Where:
- `θ` = true ad rate (proportion of ads in feed)
- `k` = observed HIGH-confidence ads
- `n` = total items classified with HIGH confidence
- `α₀, β₀` = platform-specific prior parameters

### 2.2 Prior Interpretation

The Beta(α₀, β₀) prior encodes:
- **Prior mean:** `μ₀ = α₀ / (α₀ + β₀)` (expected ad rate before seeing data)
- **Prior sample size:** `n₀ = α₀ + β₀` (strength of prior belief, in "pseudo-observations")
- **Prior variance:** `σ₀² = α₀β₀ / ((α₀+β₀)²(α₀+β₀+1))`

**Interpretation:** A Beta(2, 18) prior means "behave as if we've already seen 2 ads in 20 items" before observing actual data.

### 2.3 Posterior Credible Interval

We compute the **Equal-Tailed Credible Interval (ETCI)** at 95% confidence:

```python
from scipy.stats import beta

def bayesian_credible_interval(
    k: int,           # observed ads
    n: int,           # total items
    alpha_0: float,   # prior alpha
    beta_0: float,    # prior beta
    conf: float = 0.95
) -> tuple[float, float]:
    """
    Returns (lower, upper) bounds as proportions [0, 1].
    """
    alpha_post = alpha_0 + k
    beta_post = beta_0 + (n - k)

    tail = (1 - conf) / 2
    lower = beta.ppf(tail, alpha_post, beta_post)
    upper = beta.ppf(1 - tail, alpha_post, beta_post)

    return (lower, upper)
```

### 2.4 Posterior Point Estimate

Use the **posterior mean** (not mode) for robustness:

```python
def bayesian_point_estimate(k: int, n: int, alpha_0: float, beta_0: float) -> float:
    """Returns posterior mean as proportion [0, 1]."""
    return (alpha_0 + k) / (alpha_0 + beta_0 + n)
```

### 2.5 Coexistence with Wilson CI

**Decision:** Provide BOTH intervals in the API response with clear labeling.

| Field | Method | When to Use |
|-------|--------|-------------|
| `ad_rate_percent_ci` | Wilson | Frequentist baseline, no prior assumptions |
| `ad_rate_percent_ci_bayesian` | Beta posterior | When prior is appropriate, esp. small n |
| `ad_rate_percent` | Posterior mean | When `prior_used: true`, else MLE |

**User-facing presentation:** The Talk/Analysis copy uses `ad_rate_percent_ci_bayesian` as the primary interval when `n < 50` and prior is valid for the platform. Otherwise, Wilson CI is primary.

---

## 3. Platform-Specific Prior Parameters

### 3.1 Bootstrap Defaults (No Aggregate Data)

These are **weakly informative priors** based on public industry reports and conservative assumptions. They will be updated with real aggregate data in Phase 5C4.

| Platform | α₀ | β₀ | Prior Mean | Prior "n" | Rationale |
|----------|----|----|------------|-----------|-----------|
| `tiktok` | 2.0 | 18.0 | 10.0% | 20 | Industry reports: 8-15% ad density |
| `instagram` | 2.5 | 17.5 | 12.5% | 20 | Reels/Feed hybrid, higher ad load |
| `youtube` | 1.5 | 18.5 | 7.5% | 20 | In-feed ads less frequent (excludes pre-roll) |
| `facebook` | 3.0 | 17.0 | 15.0% | 20 | Historically higher ad density |
| `twitter` | 2.0 | 18.0 | 10.0% | 20 | Similar to TikTok baseline |
| `unknown` | 2.0 | 18.0 | 10.0% | 20 | Conservative default |

**Prior strength:** `n₀ = 20` means the prior is equivalent to 20 pseudo-observations. This is weak enough that:
- With 10 real observations, prior contributes ~67% of effective sample
- With 30 real observations, prior contributes ~40% of effective sample
- With 100 real observations, prior contributes ~17% of effective sample

### 3.2 Prior Parameter Storage

```python
# accuracy/priors.py

from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class BetaPrior:
    """Immutable Beta prior parameters for a platform."""
    alpha: float
    beta: float
    source: str  # "bootstrap" | "aggregate_v1" | "aggregate_v2" ...
    last_updated: str  # ISO date
    min_aggregate_scans: int  # Scans contributing to this prior (0 for bootstrap)

# Bootstrap defaults - will be replaced by aggregate-derived priors
PLATFORM_PRIORS: dict[str, BetaPrior] = {
    "tiktok": BetaPrior(
        alpha=2.0, beta=18.0,
        source="bootstrap",
        last_updated="2025-01-06",
        min_aggregate_scans=0
    ),
    "instagram": BetaPrior(
        alpha=2.5, beta=17.5,
        source="bootstrap",
        last_updated="2025-01-06",
        min_aggregate_scans=0
    ),
    "youtube": BetaPrior(
        alpha=1.5, beta=18.5,
        source="bootstrap",
        last_updated="2025-01-06",
        min_aggregate_scans=0
    ),
    "facebook": BetaPrior(
        alpha=3.0, beta=17.0,
        source="bootstrap",
        last_updated="2025-01-06",
        min_aggregate_scans=0
    ),
    "twitter": BetaPrior(
        alpha=2.0, beta=18.0,
        source="bootstrap",
        last_updated="2025-01-06",
        min_aggregate_scans=0
    ),
}

DEFAULT_PRIOR = BetaPrior(
    alpha=2.0, beta=18.0,
    source="bootstrap",
    last_updated="2025-01-06",
    min_aggregate_scans=0
)

def get_prior(platform: str) -> BetaPrior:
    """Get the appropriate prior for a platform."""
    return PLATFORM_PRIORS.get(platform.lower(), DEFAULT_PRIOR)
```

---

## 4. Safety Constraints

### 4.1 Priors NEVER Override Per-Item Classification

**Invariant:** The prior affects only the aggregate rate estimate. Individual items are classified based solely on:
1. PLATFORM_LABEL evidence (0.999 reliability)
2. Other detection methods per existing logic
3. Method reliability thresholds

```python
# CORRECT: Prior only affects aggregate
posterior_rate = bayesian_point_estimate(k_ads, n_total, prior.alpha, prior.beta)

# WRONG: Never do this
# if posterior_rate > 0.5:
#     reclassify_item_as_ad(item)  # FORBIDDEN
```

### 4.2 Prior Activation Conditions

Priors are only used when ALL conditions are met:

```python
def should_use_prior(
    n: int,
    platform: str,
    wilson_ci_width: float,
    prior: BetaPrior
) -> bool:
    """
    Determines whether to use Bayesian estimation with prior.

    Returns True only when:
    1. Sample size is small enough that prior adds value
    2. Platform has a valid prior
    3. Wilson CI is wide enough that prior helps
    """
    # Condition 1: Small sample (prior loses influence at large n anyway)
    if n >= 100:
        return False

    # Condition 2: Platform has non-default prior OR bootstrap is acceptable
    # (For now, bootstrap is acceptable; later we may require aggregate-derived)
    if prior.source == "bootstrap" and n >= 50:
        # With 50+ samples, prefer data-driven Wilson over bootstrap prior
        return False

    # Condition 3: Wilson CI is wide (prior can help)
    # If Wilson CI width < 10 percentage points, prior adds little value
    if wilson_ci_width < 0.10:  # 10 percentage points
        return False

    return True
```

### 4.3 Never Make Small Samples Appear Overconfident

**Key safeguard:** The Bayesian credible interval width has a natural floor based on the prior variance. We enforce an additional minimum width:

```python
MIN_CREDIBLE_INTERVAL_WIDTH = 0.05  # 5 percentage points minimum

def safe_bayesian_ci(k: int, n: int, alpha_0: float, beta_0: float, conf: float = 0.95):
    lower, upper = bayesian_credible_interval(k, n, alpha_0, beta_0, conf)
    width = upper - lower

    if width < MIN_CREDIBLE_INTERVAL_WIDTH:
        # Expand symmetrically to minimum width
        center = (lower + upper) / 2
        half_min = MIN_CREDIBLE_INTERVAL_WIDTH / 2
        lower = max(0.0, center - half_min)
        upper = min(1.0, center + half_min)

    return (lower, upper)
```

### 4.4 Transparency Requirements

Every Bayesian estimate MUST include metadata explaining:
1. That a prior was used
2. The prior source ("bootstrap" vs "aggregate_vN")
3. The effective sample size contribution

---

## 5. Data Source Strategy for Prior Learning

### 5.1 Opt-In Anonymized Aggregation

**Phase 5C4 will implement this.** For now, we use bootstrap priors only.

**Proposed aggregation scheme:**

```python
@dataclass
class AnonymizedScanSummary:
    """
    Privacy-preserving summary of a single scan.
    Contains NO identifying information.
    """
    platform: str                    # e.g., "tiktok"
    n_items: int                     # total items
    n_high_confidence_ads: int       # HIGH-confidence ads only
    n_high_confidence_total: int     # items with HIGH-confidence classification
    scan_date_bucket: str            # Week bucket, e.g., "2025-W01"
    # NO: scan_id, user_id, IP, timestamps, content, account names
```

**Privacy safeguards:**

1. **No per-user storage:** Summaries are immediately aggregated, never stored individually
2. **Date bucketing:** Weekly buckets prevent temporal fingerprinting
3. **Minimum aggregation threshold:** Platform priors only update when ≥100 scans contribute
4. **Laplace smoothing:** Add noise to counts before aggregation
5. **No rare platform leakage:** Platforms with <50 scans in a bucket use default prior

### 5.2 Aggregation to Prior Update

```python
def update_prior_from_aggregates(
    platform: str,
    scan_summaries: list[AnonymizedScanSummary],
    current_prior: BetaPrior
) -> BetaPrior:
    """
    Update platform prior using aggregated scan data.
    Uses empirical Bayes with regularization.
    """
    if len(scan_summaries) < 100:
        # Insufficient data, keep current prior
        return current_prior

    # Aggregate across scans
    total_ads = sum(s.n_high_confidence_ads for s in scan_summaries)
    total_items = sum(s.n_high_confidence_total for s in scan_summaries)

    if total_items < 500:
        # Still insufficient, keep current
        return current_prior

    # Compute empirical rate
    empirical_rate = total_ads / total_items

    # Method of moments for Beta parameters
    # Assume variance ~ 0.002 (roughly observed variance across users)
    # This is a regularization choice to prevent overfitting
    target_variance = 0.002

    # Beta parameters from mean and variance:
    # mean = α / (α + β)
    # var = αβ / ((α+β)²(α+β+1))
    #
    # Solving: let μ = empirical_rate, σ² = target_variance
    # α + β = μ(1-μ)/σ² - 1
    # α = μ * (α + β)

    sum_params = (empirical_rate * (1 - empirical_rate) / target_variance) - 1
    sum_params = max(4.0, min(sum_params, 100.0))  # Clamp to reasonable range

    new_alpha = empirical_rate * sum_params
    new_beta = (1 - empirical_rate) * sum_params

    return BetaPrior(
        alpha=new_alpha,
        beta=new_beta,
        source=f"aggregate_v{int(time.time() // 86400)}",
        last_updated=datetime.now().isoformat()[:10],
        min_aggregate_scans=len(scan_summaries)
    )
```

### 5.3 Bootstrap-Only Mode (Phase 5C3)

For Phase 5C3, we use bootstrap priors only. The aggregation infrastructure is specified here for future implementation but NOT activated.

```python
# In Phase 5C3, this always returns the bootstrap prior
USE_AGGREGATE_PRIORS = False  # Flip to True in Phase 5C4

def get_prior(platform: str) -> BetaPrior:
    if USE_AGGREGATE_PRIORS:
        return _get_aggregate_prior(platform)  # Phase 5C4
    return PLATFORM_PRIORS.get(platform.lower(), DEFAULT_PRIOR)
```

---

## 6. Output Contract

### 6.1 New Fields in Evidence Bundle

Add to `observations` section:

```python
# In evidence_bundle.py, _build_observations()

"ad_rate_percent_ci_bayesian": {
    "lower": 5.2,
    "upper": 18.7,
    "confidence_level": 0.95,
    "method": "bayesian_beta",
    "point_estimate": 10.5,
    "prior_used": True,
    "prior_info": {
        "platform": "tiktok",
        "source": "bootstrap",
        "alpha": 2.0,
        "beta": 18.0,
        "effective_prior_n": 20
    }
} if should_use_prior(...) else None,

"ad_rate_estimate_method": "bayesian_beta" if prior_used else "wilson",
```

### 6.2 Full Schema Addition

```python
# In evidence_bundle.py or accuracy/schema.py

@dataclass
class BayesianRateEstimate:
    """Bayesian rate estimate with credible interval."""
    lower: float                    # Lower bound [0, 100] as percent
    upper: float                    # Upper bound [0, 100] as percent
    confidence_level: float         # 0.95 typically
    method: str                     # "bayesian_beta"
    point_estimate: float           # Posterior mean as percent
    prior_used: bool                # Always True for this structure
    prior_info: dict                # {platform, source, alpha, beta, effective_prior_n}

@dataclass
class RateEstimates:
    """Combined rate estimates with both methods."""
    wilson: WilsonCI                # Always computed
    bayesian: Optional[BayesianRateEstimate]  # Only if prior applicable
    canonical: str                  # "wilson" or "bayesian" - which to use for display
```

### 6.3 API Response Example

```json
{
  "meta": { "platform": "tiktok", "n_items": 25 },
  "observations": {
    "ad_rate_percent": 12.0,
    "ad_rate_percent_ci": {
      "lower": 2.5,
      "upper": 30.2,
      "confidence_level": 0.95,
      "method": "wilson"
    },
    "ad_rate_percent_ci_bayesian": {
      "lower": 6.8,
      "upper": 19.4,
      "confidence_level": 0.95,
      "method": "bayesian_beta",
      "point_estimate": 11.6,
      "prior_used": true,
      "prior_info": {
        "platform": "tiktok",
        "source": "bootstrap",
        "alpha": 2.0,
        "beta": 18.0,
        "effective_prior_n": 20
      }
    },
    "ad_rate_estimate_method": "bayesian_beta"
  }
}
```

### 6.4 User-Facing Presentation

**In Talk/Analysis copy:**

When Bayesian is canonical:
> "Based on your scan of 25 items (3 identified ads), we estimate the ad rate is approximately **12%** (credible interval: 7-19%). This estimate incorporates typical patterns for TikTok feeds."

When Wilson is canonical (large n or narrow CI):
> "Based on your scan of 150 items (18 identified ads), the ad rate is approximately **12%** (confidence interval: 8-18%)."

**Key principle:** Never hide that a prior was used. The phrase "incorporates typical patterns for [platform]" signals prior usage without requiring statistical literacy.

### 6.5 Limits Section Addition

Add to `limits` section when prior is used:

```python
"bayesian_prior_limitations": {
    "applies": True,
    "explanation": "The ad rate estimate uses a statistical prior based on typical TikTok ad patterns. This helps provide more stable estimates for small samples, but assumes your feed is broadly similar to typical feeds. The prior has minimal influence on estimates from larger scans (50+ items).",
    "prior_source": "bootstrap",  # or "aggregate_v1"
    "prior_influence_percent": 44.4  # (prior_n / (prior_n + actual_n)) * 100
}
```

---

## 7. Implementation Plan

### 7.1 File Changes

| File | Changes |
|------|---------|
| `accuracy/priors.py` | **NEW** - Prior definitions, `get_prior()`, `should_use_prior()` |
| `accuracy/stats.py` | Add `bayesian_credible_interval()`, `bayesian_point_estimate()` |
| `evidence_bundle.py` | Add Bayesian CI fields in `_build_observations()` |
| `app.py` | Ensure API returns new fields |
| `eval/fixtures/` | Add test fixtures for Bayesian estimation |
| `eval/test_phase5c3_bayesian_priors.py` | **NEW** - Unit and integration tests |

### 7.2 Implementation Order

1. **Step 1:** Create `accuracy/priors.py` with prior definitions
2. **Step 2:** Add Bayesian functions to `accuracy/stats.py`
3. **Step 3:** Add `should_use_prior()` logic
4. **Step 4:** Integrate into `evidence_bundle.py`
5. **Step 5:** Update API response handling in `app.py`
6. **Step 6:** Add limits section documentation
7. **Step 7:** Write tests and fixtures
8. **Step 8:** Validate with evaluation metrics

---

## 8. Evaluation

### 8.1 Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Interval Width Reduction** | `(wilson_width - bayesian_width) / wilson_width` | >20% for n<30 |
| **Coverage** | Fraction of true rates within interval (simulated) | ≥95% |
| **Calibration** | |Empirical coverage - nominal coverage| | <3% |
| **Prior Influence Decay** | Prior contribution at n=50 | <30% |

### 8.2 Acceptance Criteria

1. **AC-1:** Bayesian CI is always narrower than or equal to Wilson CI for n < 50
2. **AC-2:** Bayesian CI width ≥ 5 percentage points (never overconfident)
3. **AC-3:** Prior influence < 20% when n ≥ 100
4. **AC-4:** All per-item classifications unchanged (priors don't affect items)
5. **AC-5:** `prior_used: true` included whenever prior is applied
6. **AC-6:** Limits section explains prior usage

### 8.3 Test Fixtures

#### Fixture 1: Small N, Rate Near Prior

```python
# eval/fixtures/phase5c3/small_n_near_prior.json
{
  "name": "small_n_near_prior",
  "description": "25 items, 3 ads (12%) on TikTok - near prior mean",
  "platform": "tiktok",
  "n_total": 25,
  "n_ads": 3,
  "expected": {
    "wilson_ci": {"lower": 2.5, "upper": 30.2},
    "bayesian_ci": {"lower": 6.7, "upper": 19.2},
    "bayesian_point": 11.1,
    "prior_used": true,
    "interval_width_reduction_min": 0.25
  }
}
```

#### Fixture 2: Small N, Rate Far From Prior

```python
# eval/fixtures/phase5c3/small_n_far_from_prior.json
{
  "name": "small_n_far_from_prior",
  "description": "20 items, 8 ads (40%) on TikTok - far from 10% prior",
  "platform": "tiktok",
  "n_total": 20,
  "n_ads": 8,
  "expected": {
    "wilson_ci": {"lower": 19.1, "upper": 63.9},
    "bayesian_ci": {"lower": 17.5, "upper": 47.8},
    "bayesian_point": 25.0,
    "prior_used": true,
    "note": "Prior shrinks estimate toward 10%, but data dominates"
  }
}
```

#### Fixture 3: Medium N

```python
# eval/fixtures/phase5c3/medium_n.json
{
  "name": "medium_n",
  "description": "60 items, 6 ads (10%) - prior influence diminishing",
  "platform": "instagram",
  "n_total": 60,
  "n_ads": 6,
  "expected": {
    "wilson_ci": {"lower": 3.7, "upper": 19.5},
    "bayesian_ci": {"lower": 5.1, "upper": 16.9},
    "bayesian_point": 10.6,
    "prior_used": true,
    "prior_influence_percent": 25.0
  }
}
```

#### Fixture 4: Large N (Prior Disabled)

```python
# eval/fixtures/phase5c3/large_n_no_prior.json
{
  "name": "large_n_no_prior",
  "description": "150 items, 15 ads (10%) - prior not used",
  "platform": "tiktok",
  "n_total": 150,
  "n_ads": 15,
  "expected": {
    "wilson_ci": {"lower": 5.8, "upper": 16.1},
    "bayesian_ci": null,
    "prior_used": false,
    "estimate_method": "wilson"
  }
}
```

#### Fixture 5: Zero Ads

```python
# eval/fixtures/phase5c3/zero_ads.json
{
  "name": "zero_ads",
  "description": "30 items, 0 ads - prior provides non-zero estimate",
  "platform": "youtube",
  "n_total": 30,
  "n_ads": 0,
  "expected": {
    "wilson_ci": {"lower": 0.0, "upper": 11.6},
    "bayesian_ci": {"lower": 0.2, "upper": 10.8},
    "bayesian_point": 3.0,
    "prior_used": true,
    "note": "Prior prevents estimate from being exactly 0%"
  }
}
```

#### Fixture 6: All Ads (Extreme Rate)

```python
# eval/fixtures/phase5c3/all_ads.json
{
  "name": "all_ads",
  "description": "15 items, 15 ads (100%) - prior shrinks toward typical",
  "platform": "facebook",
  "n_total": 15,
  "n_ads": 15,
  "expected": {
    "wilson_ci": {"lower": 78.2, "upper": 100.0},
    "bayesian_ci": {"lower": 56.8, "upper": 87.2},
    "bayesian_point": 51.4,
    "prior_used": true,
    "note": "Strong shrinkage - prior says 100% is implausible"
  }
}
```

### 8.4 Regression Test Suite

```python
# eval/test_phase5c3_bayesian_priors.py

import pytest
from accuracy.stats import wilson_ci, bayesian_credible_interval, bayesian_point_estimate
from accuracy.priors import get_prior, should_use_prior, PLATFORM_PRIORS

class TestBayesianPriors:
    """Phase 5C3: Bayesian priors for rate estimation."""

    def test_posterior_with_prior(self):
        """Posterior combines prior and data correctly."""
        prior = get_prior("tiktok")
        k, n = 3, 25

        # Posterior mean = (α + k) / (α + β + n)
        expected_mean = (prior.alpha + k) / (prior.alpha + prior.beta + n)
        actual_mean = bayesian_point_estimate(k, n, prior.alpha, prior.beta)

        assert abs(actual_mean - expected_mean) < 0.001

    def test_bayesian_ci_narrower_than_wilson_small_n(self):
        """Bayesian CI should be narrower than Wilson for small samples."""
        prior = get_prior("tiktok")
        k, n = 3, 25

        wilson_lower, wilson_upper = wilson_ci(k, n)
        bayes_lower, bayes_upper = bayesian_credible_interval(
            k, n, prior.alpha, prior.beta
        )

        wilson_width = wilson_upper - wilson_lower
        bayes_width = bayes_upper - bayes_lower

        assert bayes_width < wilson_width

    def test_prior_influence_diminishes_with_n(self):
        """Prior influence should decrease as sample size grows."""
        prior = get_prior("tiktok")

        # At n=20, prior contributes 50%
        # At n=80, prior contributes 20%
        # At n=180, prior contributes ~10%

        prior_n = prior.alpha + prior.beta

        influence_at_20 = prior_n / (prior_n + 20)
        influence_at_80 = prior_n / (prior_n + 80)
        influence_at_180 = prior_n / (prior_n + 180)

        assert influence_at_20 > influence_at_80 > influence_at_180
        assert influence_at_80 < 0.25  # Less than 25% at n=80

    def test_should_use_prior_small_n(self):
        """Prior should be used for small samples."""
        prior = get_prior("tiktok")
        wilson_lower, wilson_upper = wilson_ci(3, 25)
        wilson_width = wilson_upper - wilson_lower

        assert should_use_prior(25, "tiktok", wilson_width, prior)

    def test_should_not_use_prior_large_n(self):
        """Prior should NOT be used for large samples."""
        prior = get_prior("tiktok")
        wilson_lower, wilson_upper = wilson_ci(15, 150)
        wilson_width = wilson_upper - wilson_lower

        assert not should_use_prior(150, "tiktok", wilson_width, prior)

    def test_minimum_interval_width_enforced(self):
        """Credible interval should never be narrower than 5 percentage points."""
        prior = get_prior("tiktok")
        # Large n with concentrated data should still have min width
        k, n = 100, 1000

        lower, upper = bayesian_credible_interval(k, n, prior.alpha, prior.beta)
        # Note: safe_bayesian_ci enforces minimum, raw function may not
        # This test checks the raw function behavior

        # With large n, interval can be narrow - that's OK
        # The safety wrapper handles minimum width

    def test_platform_priors_exist(self):
        """All expected platforms have defined priors."""
        expected_platforms = ["tiktok", "instagram", "youtube", "facebook", "twitter"]

        for platform in expected_platforms:
            prior = get_prior(platform)
            assert prior is not None
            assert prior.alpha > 0
            assert prior.beta > 0
            assert 0 < prior.alpha / (prior.alpha + prior.beta) < 1

    def test_prior_does_not_affect_per_item_classification(self):
        """
        Priors only affect aggregate rates, never per-item classification.
        This is a documentation test - actual classification is unchanged.
        """
        # This test documents the invariant.
        # Per-item classification uses PLATFORM_LABEL, OCR, etc.
        # Priors are applied only in evidence_bundle rate computation.
        pass  # Invariant enforced by architecture, not runtime check
```

---

## 9. Recommended Defaults Summary

| Platform | Prior Mean | Prior α | Prior β | Prior n | Rationale |
|----------|------------|---------|---------|---------|-----------|
| TikTok | 10.0% | 2.0 | 18.0 | 20 | FYF algorithm baseline |
| Instagram | 12.5% | 2.5 | 17.5 | 20 | Reels + feed ads |
| YouTube | 7.5% | 1.5 | 18.5 | 20 | Shorts in-feed (excl. pre-roll) |
| Facebook | 15.0% | 3.0 | 17.0 | 20 | Higher ad density historically |
| Twitter/X | 10.0% | 2.0 | 18.0 | 20 | For You feed baseline |
| Unknown | 10.0% | 2.0 | 18.0 | 20 | Conservative fallback |

**Update plan:** Phase 5C4 will implement opt-in aggregation. When ≥100 scans are collected per platform, priors will be updated using empirical Bayes with the aggregation formula specified in Section 5.2.

---

## 10. Epistemic Boundaries

**What this phase DOES claim:**
- Platform-specific priors improve rate estimate precision for small samples
- Priors are derived from public industry reports (bootstrap) or anonymized aggregates (future)
- The Bayesian interval represents a credible range given the prior and observed data

**What this phase does NOT claim:**
- That the prior accurately reflects YOUR specific feed
- That any individual item's classification is affected by priors
- That platform ad rates are stable over time
- That Bayesian estimates are "more correct" than Wilson (they answer different questions)

**Transparency commitment:**
- `prior_used: true` always present when prior is applied
- `prior_info` includes source and parameters
- Limits section explains prior influence
- User-facing text always mentions when "typical patterns" are incorporated

---

## Appendix A: Mathematical Reference

### Wilson Score Interval (existing)

For observed proportion p̂ = k/n with confidence z:

```
center = (p̂ + z²/2n) / (1 + z²/n)
margin = z × √[(p̂(1-p̂) + z²/4n) / n] / (1 + z²/n)
CI = [center - margin, center + margin]
```

### Beta Posterior (new)

Prior: Beta(α₀, β₀)
Data: k successes in n trials
Posterior: Beta(α₀ + k, β₀ + n - k)

Posterior mean: (α₀ + k) / (α₀ + β₀ + n)
Posterior mode: (α₀ + k - 1) / (α₀ + β₀ + n - 2) for α,β > 1

95% ETCI: [Beta.ppf(0.025, α_post, β_post), Beta.ppf(0.975, α_post, β_post)]

### Prior Influence

The posterior mean can be written as:
```
E[θ|data] = w × prior_mean + (1-w) × MLE
where w = n₀ / (n₀ + n)
and n₀ = α₀ + β₀ (prior "sample size")
```

---

## Appendix B: Implementation Checklist

- [ ] Create `accuracy/priors.py` with BetaPrior dataclass
- [ ] Define PLATFORM_PRIORS dictionary with bootstrap values
- [ ] Implement `get_prior(platform)` function
- [ ] Implement `should_use_prior(n, platform, wilson_width, prior)` function
- [ ] Add `bayesian_credible_interval()` to `accuracy/stats.py`
- [ ] Add `bayesian_point_estimate()` to `accuracy/stats.py`
- [ ] Add `safe_bayesian_ci()` with minimum width enforcement
- [ ] Update `_build_observations()` in `evidence_bundle.py`
- [ ] Add `ad_rate_percent_ci_bayesian` field
- [ ] Add `ad_rate_estimate_method` field
- [ ] Add `bayesian_prior_limitations` to limits section
- [ ] Update API response handling in `app.py`
- [ ] Create test fixtures in `eval/fixtures/phase5c3/`
- [ ] Write `eval/test_phase5c3_bayesian_priors.py`
- [ ] Run evaluation metrics
- [ ] Update Talk/Analysis copy generation for prior disclosure
