# Checkpoint: QA Report Fixes

**Date:** February 14, 2026
**Triggered by:** QA_REPORT.md findings
**Total findings addressed:** 23 (3 Critical, 12 Important, 8 Minor)

---

## What Changed

### Backend Files Modified

| File | What Changed | QA Finding |
|------|-------------|------------|
| `backend/auth.py` | Added `import logging` + `logger`. Replaced 8 `print()` calls with `logger.warning()`. | M2 |
| `backend/routes/scans.py` | Added file size limit (500 MB), MIME type validation, allowed extensions check. Changed error detail from `str(e)` to generic message. Added `signal`-based processing timeout. Added rate limiter (10 uploads/min). | C2, I3, I11, I5 |
| `backend/routes/evidence_bundles.py` | Added `_is_dev_env()` helper. All 5 debug blocks now gated behind ENV check. | I9 |
| `backend/routes/stripe_routes.py` | Added handlers for `customer.subscription.trial_will_end` and `invoice.payment_action_required`. Added rate limiter on checkout (5/min). Added security comments on dev endpoints. | I1, I2, I4, I5 |
| `backend/routes/entitlements.py` | Added `trial_days_remaining` and `period_days_remaining` computed fields. | M10 |
| `backend/database.py` | Renamed `get_all_scans()` → `_internal_get_all_scans()` and `get_scan_by_id()` → `_internal_get_scan_by_id()`. | M7 |
| `backend/eval/*.py` | Updated 4 eval scripts to use renamed `_internal_get_scan_by_id`. | M7 |
| `backend/app.py` | CORS: `allow_methods` and `allow_headers` now explicit (not `*`). Added `slowapi` rate limiter middleware. | I8, I5 |
| `backend/requirements.txt` | Added `slowapi==0.1.9`. | I5 |

### Frontend Files Modified

| File | What Changed | QA Finding |
|------|-------------|------------|
| `src/lib/dashboard/trendsComparison.js` | Fixed `calculateCreatorConcentration()`: changed `.length` to `Object.keys().length`, changed `.slice()` to `Object.values().sort().slice()`. | C3 |
| `src/lib/dashboard/dataHelpers.js` | Fixed `getPromoThemesData()`: changed hardcoded `0` to `scans?.length \|\| 0`. Exported `getFeedItems()`. | I12, M5 |
| `src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx` | Changed "future releases" text to "Coming Soon" with clearer language. | I6 |
| `src/pages/dashboard/tabs/SourcesTab.jsx` | Removed commented-out Section 2.3 placeholder. | I7 |
| `src/pages/dashboard/tabs/AdsTab.jsx` | Removed local `getFeedItems` definition, now imports from `dataHelpers`. | M5 |
| `src/pages/dashboard/tabs/ToneTab.jsx` | Removed local `getFeedItems` definition, now imports from `dataHelpers`. | M5 |
| `src/pages/dashboard/tabs/PatternsTab.jsx` | Extracted hardcoded `20` into `MIN_TOPIC_DISPLAY_PERCENT` constant. | M8 |
| `src/lib/dashboard/scanAggregator.js` | Added structural validation for `valence_distribution` (type check + key check). | M6 |

### Config Files Modified

| File | What Changed | QA Finding |
|------|-------------|------------|
| `vercel.json` | Added `Content-Security-Policy` header with allowlists for Stripe, Supabase, Beehiiv. | I10 |

### Documentation

| File | What Changed |
|------|-------------|
| `QA_REPORT.md` | Retracted C4 (billing portal exists), M1 (already gitignored), M9 (correct behavior). Updated summary counts. |
| `MANUAL_ACTION_ITEMS.md` | Created step-by-step guide for key rotation, trial email setup, and product decisions. |
| `CHECKPOINT_QA_FIXES.md` | This file. |

---

## What Was NOT Changed (and Why)

| Finding | Reason |
|---------|--------|
| C1 (rotate keys) | Requires manual action in Stripe/Supabase/Google dashboards. See `MANUAL_ACTION_ITEMS.md`. |
| C4 (billing portal) | **Retracted** — already implemented in `stripe_routes.py` and `PlusPage.jsx`. |
| M1 (SQLite in gitignore) | **Retracted** — already covered by `backend/.gitignore` line 14. |
| M3 (multiple scan iterations) | Performance optimization deferred — not a correctness issue. |
| M4 (demo mode detection) | Dev-only logging, not user-facing. Low risk. |
| M9 (Privacy/Terms links) | **Retracted** — `<a>` tags are correct for pages outside the SPA. |
| I1 (email notification) | Webhook handler added; email delivery requires external service setup. See `MANUAL_ACTION_ITEMS.md`. |
| I6 (Suggested vs Followed pipeline) | Product decision needed. Copy updated to "Coming Soon." See `MANUAL_ACTION_ITEMS.md`. |

---

## How to Verify

1. **Frontend build:** Run `npm run build` — should complete with no errors
2. **Backend imports:** Run `cd backend && python -c "from routes import scans, stripe_routes, evidence_bundles, entitlements; print('OK')"` — should print OK
3. **Grep checks:**
   - `grep -r 'print(' backend/auth.py` — should return 0 results
   - `grep -r 'detail=str(e)' backend/routes/` — should return 0 results
   - `grep -r 'get_scan_by_id(' backend/routes/` — should only show `get_scan_by_id_for_user` variants
4. **CSP header:** Deploy and check response headers in browser DevTools
