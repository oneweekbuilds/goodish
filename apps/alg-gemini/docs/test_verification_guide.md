# AlgorithmLens Test Verification Guide

This document explains how to run the accuracy test suites before committing.

## Test Suite Overview

| Suite | File | Purpose | Requires Server |
|-------|------|---------|-----------------|
| **Golden Harness** | `scripts/verify_evidence_bundles.ps1` | Validates Evidence Bundle API contracts (60 checks) | Yes |
| **Adversarial** | `backend/test_adversarial.py` | Edge case safety behaviors (Prompt 8) | No |
| **Regression** | `backend/test_regressions.py` | Must-not-regress assertions (Prompt 9) | No |

## Quick Start

### Run All Tests (Recommended Before Commit)

```powershell
# From apps/alg-gemini directory

# 1. Start the backend server (in a separate terminal)
cd backend
python -m uvicorn app:app --reload

# 2. Run full verification suite
cd ..
.\scripts\verify_accuracy.ps1
```

### Run Unit Tests Only (No Server Required)

```powershell
# From apps/alg-gemini directory
.\scripts\verify_accuracy.ps1 -QuickCheck
```

Or run individual test files:

```powershell
cd backend
python -m pytest test_adversarial.py -v
python -m pytest test_regressions.py -v
```

## Expected Results Before Commit

| Suite | Minimum Pass Requirement |
|-------|--------------------------|
| Golden Harness | 60/60 checks |
| Adversarial | All tests pass |
| Regression | All tests pass |

## Test Categories Explained

### Golden Harness (verify_evidence_bundles.ps1)

Tests the live API endpoints for all 5 evidence bundles:
- Ads & Influence
- Politics & Worldview
- Patterns in Feed
- Creators & Voices
- Inferences

Verifies:
- Required response fields present
- Coverage metadata valid
- Talk endpoint contracts

### Adversarial Tests (test_adversarial.py)

Tests edge case safety behaviors from Prompt 8:
- Meme politics handling
- Sarcasm/irony detection
- Soft influencer ad patterns
- Ambiguous public figure titles
- Missing modality handling
- Signal fusion safety

### Regression Tests (test_regressions.py)

Must-not-regress assertions protecting:
- Modality coverage behavior (Prompts 2-4)
- "Unknown" discipline (Prompt 7)
- Negative-context filters (Prompt 5.1)
- Fusion conflict behavior (Prompt 6)
- Explanations schema stability (Prompt 7)

## Troubleshooting

### Golden Harness Fails to Connect

```
Backend not reachable at http://localhost:8000
```

**Solution**: Start the backend server first:
```powershell
cd backend
python -m uvicorn app:app --reload
```

### Import Errors in pytest

```
ModuleNotFoundError: No module named 'public_figure_signals'
```

**Solution**: Run pytest from the backend directory:
```powershell
cd backend
python -m pytest test_adversarial.py -v
```

### Test Fails After Code Change

If a regression test fails after your change:
1. Read the assertion message carefully - it explains what behavior must not change
2. Revert or adjust your change to preserve the safety behavior
3. If you believe the test is incorrect, discuss before modifying

## Adding New Tests

When adding tests to `test_regressions.py`:
1. Document which prompt/behavior the test protects
2. Use the "MUST NOT REGRESS" pattern in docstrings
3. Make assertions explicit about expected values
4. Run full suite to verify no breakage

Example:
```python
def test_my_new_safety_behavior(self):
    """
    My safety behavior must be preserved.

    MUST NOT REGRESS: Explain why this matters.
    """
    result = some_function()
    assert result["field"] == "expected", \
        "REGRESSION: Explain what changed"
```
