# Phase 5C3 Test Fixtures

Test fixtures for validating Bayesian prior-based rate estimation.

## Fixtures

| File | N | Ads | Platform | Prior Used | Key Test |
|------|---|-----|----------|------------|----------|
| `small_n_near_prior.json` | 25 | 3 | TikTok | Yes | Interval narrowing when rate matches prior |
| `small_n_far_from_prior.json` | 20 | 8 | TikTok | Yes | Shrinkage when rate differs from prior |
| `medium_n.json` | 60 | 6 | Instagram | Yes | Diminishing prior influence |
| `large_n_no_prior.json` | 150 | 15 | TikTok | No | Prior disabled for large samples |
| `zero_ads.json` | 30 | 0 | YouTube | Yes | Non-zero estimate for zero observed ads |
| `all_ads_extreme.json` | 15 | 15 | Facebook | Yes | Strong shrinkage for extreme rates |

## Usage

```python
import json
from pathlib import Path

fixture_dir = Path(__file__).parent / "fixtures" / "phase5c3"

def load_fixture(name: str) -> dict:
    with open(fixture_dir / f"{name}.json") as f:
        return json.load(f)

# Example
fixture = load_fixture("small_n_near_prior")
assert fixture["expected"]["prior_used"] == True
```

## Validation Criteria

Each fixture specifies expected values with tolerances. Tests should verify:

1. **Wilson CI:** Matches expected bounds (tolerance: 0.01)
2. **Bayesian CI:** Matches expected bounds when `prior_used: true`
3. **Point estimate:** Posterior mean matches expected (tolerance: 0.01)
4. **Prior activation:** `should_use_prior()` returns expected value
5. **Interval width reduction:** Matches expected reduction percentage
