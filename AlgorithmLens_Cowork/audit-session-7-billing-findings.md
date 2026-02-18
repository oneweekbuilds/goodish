# Audit Session 7: Billing & Account Management Findings

**Date:** 2026-02-18
**Scope:** Full billing, payments, subscription, and account management audit across both codebases (web app + Chrome extension)
**Payment Provider:** Stripe
**Model:** Freemium — Free tier + Plus tier ($10/month or $96/year, 14-day trial)
**Cycles completed:** 5

---

## Architecture Summary

- **Backend:** FastAPI + SQLite, Stripe SDK for payments
- **Frontend:** React SPA with localStorage-backed plan tier state
- **Extension:** Chrome extension communicates via auth bridge (auth token only, no subscription state)
- **Webhook handling:** Idempotent via `stripe_webhook_events` table
- **Feature gating:** Backend `is_user_plus()` + frontend `planTier` state + backend 403 on trends/evidence/talk endpoints

---

## CRITICAL Issues

### C1: `delete_all_user_data` Does Not Cancel Stripe Subscription — FIXED
**File:** `backend/routes/entitlements.py`
**Description:** The `DELETE /api/user/data` endpoint deleted local data but did NOT cancel the user's active Stripe subscription, causing continued billing after GDPR erasure.
**Fix:** Added Stripe subscription cancellation before local data deletion. Handles already-canceled and Stripe API errors gracefully.

### C2: Duplicate Subscription Creation — No Active Subscription Check — FIXED
**File:** `backend/routes/stripe_routes.py`
**Description:** `create_checkout_session` did not verify whether the user already had an active subscription. A Plus user could end up with two concurrent Stripe subscriptions, causing double-billing.
**Fix:** Added `is_user_plus()` check at the start of `create_checkout_session`. Returns 409 if already subscribed, directing them to the billing portal instead.

### C3: Stripe API Key Not Initialized at Module Level — FIXED (Cycle 3)
**File:** `backend/routes/stripe_routes.py`
**Description:** stripe_routes.py imported the stripe module but never initialized `stripe.api_key` at module level. The initialization in app.py only ran in dev mode. In production, all Stripe API calls could fail silently.
**Fix:** Added `stripe.api_key = os.getenv("STRIPE_SECRET_KEY")` at module level.

### C3b: Debug Evidence Bundle Endpoint Missing Plus Gate — FIXED (Cycle 2)
**File:** `backend/routes/evidence_bundles.py`
**Description:** The `get_ads_evidence_bundle_debug` endpoint only checked `is_dev_environment()` but not `is_user_plus()`. Free users in dev environments could access premium debug data.
**Fix:** Added `_require_plus(user_id)` check to the debug endpoint.

---

## HIGH Issues

### H1: `mark_stripe_event_processed` Race Condition Crash — FIXED
**File:** `database.py`
**Description:** Plain `INSERT INTO` could throw `IntegrityError` when concurrent webhook deliveries raced past the idempotency check. This returned 500 to Stripe, causing infinite retries.
**Fix:** Changed to `INSERT OR IGNORE INTO stripe_webhook_events`.

### H2: `verify-checkout` Searches Too Few Sessions — FIXED
**File:** `backend/routes/stripe_routes.py`
**Description:** Fallback logic only checked last 5 checkout sessions globally. Could miss the user's session during concurrent checkouts.
**Fix:** Increased limit to 25 sessions and added email-based customer lookup as secondary fallback.

### H3: Missing `cancel_at_period_end` — Full Stack Fix — FIXED
**Files:** `database.py`, `stripe_routes.py`, `entitlements.py`, `PlusPage.jsx`
**Description:** When a user scheduled cancellation via Stripe portal, the `cancel_at_period_end` flag was not stored, so the UI couldn't show the cancellation state.
**Fix:** Added `cancel_at_period_end` column to subscriptions table, stored it from the `subscription.updated` webhook, returned it in the entitlements API, and displayed a cancellation notice banner on the Plus page.

### H4: No Index on `stripe_customer_id` — FIXED
**File:** `database.py`
**Description:** Multiple webhook handlers queried by `stripe_customer_id` without an index, causing full table scans on every webhook event.
**Fix:** Added `CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(stripe_customer_id)`.

---

## MEDIUM Issues

### M1: Checkout Success URL Param Never Stripped — FIXED
**File:** `src/pages/dashboard/DashboardPage.jsx`
**Description:** `?checkout=success` only stripped in the "backend couldn't confirm" path. For successful activations, it stayed in the URL permanently.
**Fix:** Moved URL param cleanup to a `finally` block so it always executes.

### M2: Hardcoded Trial Duration in 7+ Frontend Components — FIXED
**Files:** LockedOverlayCard, UpgradeCTA, PricingPage, EvidenceBundleTeaser, TrendsCTA, FreeAskTeaser, PlusPage
**Description:** Trial duration "14 days" was hardcoded in multiple components instead of using `PRICING.trial.days` from `pricingConfig.js`.
**Fix:** Replaced all hardcoded trial strings with `PRICING.trial.days` references.

### M3: Webhook Events Table Cleanup — VERIFIED (no change needed)
**File:** `app.py`
**Description:** `cleanup_old_webhook_events()` was already called on startup in the lifespan handler.

### M4: Demo Mode Plus Tier Bypass — FIXED (Cycle 3)
**File:** `src/pages/dashboard/DashboardPage.jsx`
**Description:** Users in demo mode could manipulate localStorage to set `alg_plan_tier=plus`, showing paid features in demo environment.
**Fix:** Added demo mode isolation: forces FREE tier regardless of localStorage when `?demo=1` is active.

---

## LOW Issues

### L1: Annual "Save 20%" Badge is Hardcoded — DEFERRED
**File:** `src/lib/plan/pricingConfig.js`
**Description:** Should be computed from actual prices. Low priority, no revenue impact.

### L2: Extension Does Not Receive Subscription Status — BY DESIGN
**Description:** Extension only stores auth token, not subscription status. Feature gating happens entirely in the web app backend. Acceptable for current architecture.

### L3: Frontend pricingConfig Has No Stripe Price IDs — VERIFIED
**Description:** Price IDs are only in backend env vars, not in frontend code. No action needed.

---

## Test Coverage Added

### New test: `TestCheckoutDuplicateSubscription` (Cycle 3)
**File:** `backend/tests/test_payment_flow.py`
**Description:** Tests that `create_checkout_session` raises 409 when user already has Plus. Prevents regression of C2 fix.

---

## Files Modified (All 5 Cycles)

### Backend (4 files)
1. `backend/database.py` — H1, H3, H4 fixes
2. `backend/routes/stripe_routes.py` — C2, C3, H2, H3 fixes
3. `backend/routes/entitlements.py` — C1, H3 fixes
4. `backend/routes/evidence_bundles.py` — C3b fix

### Frontend (8 files)
5. `src/pages/dashboard/DashboardPage.jsx` — M1, M4 fixes
6. `src/pages/plus/PlusPage.jsx` — H3, M2 fixes
7. `src/components/plan/LockedOverlayCard.jsx` — M2 fix
8. `src/components/plan/UpgradeCTA.jsx` — M2 fix
9. `src/components/plan/EvidenceBundleTeaser.jsx` — M2 fix
10. `src/components/dashboard/TrendsCTA.jsx` — M2 fix
11. `src/components/dashboard/FreeAskTeaser.jsx` — M2 fix
12. `src/components/PricingPage.jsx` — M2 fix

### Tests (1 file)
13. `backend/tests/test_payment_flow.py` — New C2 regression test

### Documentation (1 file)
14. `audit-session-7-billing-findings.md` — This document

---

## Summary

| Severity | Found | Fixed | Deferred |
|----------|-------|-------|----------|
| CRITICAL | 4     | 4     | 0        |
| HIGH     | 4     | 4     | 0        |
| MEDIUM   | 4     | 3     | 1 (verified OK) |
| LOW      | 3     | 0     | 3        |
| **Total** | **15** | **11** | **4** |

**Revenue protection:** No leakage paths remain. All Plus-gated endpoints verified.
**GDPR compliance:** Data deletion now properly cancels Stripe subscriptions.
**Webhook reliability:** Idempotent, indexed, race-condition-safe.
**User experience:** Cancellation status visible, checkout errors handled, trial duration consistent.
