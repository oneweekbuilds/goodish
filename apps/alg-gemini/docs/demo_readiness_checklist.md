# Demo Readiness Checklist

Quick reference for AlgorithmLens demo preparation.

## Pre-Demo Verification

### 1. Run Full Verification Suite

```powershell
# From apps/alg-gemini directory
powershell -ExecutionPolicy Bypass -File scripts/verify_accuracy.ps1
```

**Required pass counts:**
| Suite | Expected |
|-------|----------|
| Golden Harness | 60/60 |
| Adversarial | 35/35 |
| Regression | 65/65 |

### 2. Check Git Status

```bash
git status
```

**Requirements:**
- Working tree clean (no uncommitted changes)
- Never commit `.claude/settings.local.json`
- All Prompt 10 changes should be in `apps/alg-gemini/**` only

## Starting the Demo Environment

### Backend

```bash
cd apps/alg-gemini/backend
python -m uvicorn app:app --reload --port 8000
```

Verify: http://localhost:8000/health should return `{"status": "healthy"}`

### Frontend

```bash
cd apps/alg-gemini
pnpm dev
```

Verify: http://localhost:5173 should load the application

## Golden Scan IDs for Demo

These scans are verified and reliable for demos:

| Scan ID | Type | Platform | Items | Best For |
|---------|------|----------|-------|----------|
| `desktop-1764455612626-3o417ax` | DESKTOP | Twitter | 30 | General demo, good item count |
| `desktop-1764543221023-qmro3dm` | DESKTOP | Twitter | 17 | Ad detection demo |
| `11bee9a8-417d-434b-aec0-d7fcd28c952f` | MOBILE_VIDEO | X | 103 | High ad percentage (37%), OCR demo |
| `e6815472-239e-465b-98f3-122b7f824ed0` | MOBILE_VIDEO | Instagram | 68 | No-ads scenario |
| `d0592cab-2e4a-4080-a4d0-bf494c653888` | MOBILE_VIDEO | X | 103 | Mobile video coverage demo |
| `desktop-1764434417031-vlysfj4` | DESKTOP | Instagram | 5 | Low-sample edge case |

## Quick Sanity Checks

Before demo, verify each tab loads correctly:

1. **Ads & Influence**: Commercial exposure spectrum renders
2. **Politics & Worldview**: Political content distribution shows
3. **Patterns in Your Feed**: Creator concentration visible
4. **Creators & Voices**: Top creators list populated
5. **What the Algorithm Thinks**: Content signals display

## Confidence Label Reference

All tabs use consistent semantics (from `confidence_normalization.py`):

| Confidence | Meaning |
|------------|---------|
| `high` | Multiple modalities agree, 2+ content sources |
| `medium` | Signals detected with uncertainty |
| `low` | Weak or single-modality signals |
| `unknown` | Insufficient coverage to assess |

| Presence | Meaning |
|----------|---------|
| `yes` | Signals detected with sufficient coverage |
| `no` | Not found WITH adequate coverage |
| `unknown` | Cannot determine due to insufficient coverage |

## Honesty Rules (Never Violate)

**Never say:**
- "You are..." (identity claims)
- "The algorithm thinks you like..." (mind reading)
- "This proves..." (overclaiming)
- "Definitely..." / "Certainly..." (false certainty)

**Always say:**
- "In this scan..." (temporal anchoring)
- "Signals suggest..." (epistemic humility)
- "We didn't evaluate..." (coverage transparency)
- "This does not mean..." (explicit non-claims)

## Troubleshooting

### Backend won't start
```bash
cd apps/alg-gemini/backend
pip install -r requirements.txt
```

### Tests failing
1. Ensure backend is running at http://localhost:8000
2. Check that golden_scans.json exists in `scripts/` directory
3. Re-run with verbose output:
```bash
pytest test_regressions.py -v
pytest test_adversarial.py -v
```

### Scan not found
Verify scan exists in database:
```bash
curl http://localhost:8000/api/scan/{scan_id}/summary
```

---

*Last updated: Prompt 10 Final Calibration*
