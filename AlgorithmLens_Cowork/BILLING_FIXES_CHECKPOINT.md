# Billing Fixes Checkpoint

**Date:** February 15, 2026
**Source:** BILLING_AUDIT.md
**Status:** Implementation in progress

---

## What's Being Changed and Why

This document lists every change being made to fix the billing audit findings. Each item explains what the problem is in plain language, what file is being changed, and what the change does.

---

### CRITICAL-B1: Trial Cancellation Fix
**Problem:** When someone cancels during their free trial, the system still shows "your Plus access continues until [date]" — even though trial cancellations should take effect immediately. This could confuse users and create support tickets.

**File:** `backend/routes/stripe_routes.py` (the `customer.subscription.deleted` webhook handler)
**Change:** When a canceled subscription was in a trial period, set `current_period_end` to the current time instead of preserving the original date. This way the frontend correctly shows "your account has been switched to Free."

---

### IMPORTANT-B2: Add Payment Succeeded Handler
**Problem:** There's no handler for the `invoice.payment_succeeded` webhook event. This means if a payment fails and then succeeds on retry, the system might not promptly update the user's status back to "active."

**File:** `backend/routes/stripe_routes.py`
**Change:** Add a new `invoice.payment_succeeded` handler that finds the subscription by customer ID and sets the status to "active" if it was previously "past_due."

---

### IMPORTANT-B3: Consolidate Hardcoded Pricing
**Problem:** Prices ($10/month, $96/year) are hardcoded in multiple frontend files. If you ever change prices in Stripe, you'd need to manually update every file. Worse, the PricingPage shows $9.99/$7.99 while the PaywallModal shows $10/$96.

**Files:** Create `src/lib/plan/pricingConfig.js` as single source of truth. Update `PaywallModal.jsx`, `PlusPage.jsx`, and `PricingPage.jsx` to import from it.
**Change:** Move all price values to one shared config file. Every component reads from the same place.

---

### IMPORTANT-B4: Trial-Ending Email
**Problem:** Users approaching the end of their 14-day trial don't receive a notification that they're about to be charged. This is a common source of chargebacks.

**File:** `backend/routes/stripe_routes.py` (the `trial_will_end` handler) + `MANUAL_ACTION_ITEMS.md`
**Change:** Add a clear comment in the webhook handler pointing to Stripe dashboard setup, and create/update MANUAL_ACTION_ITEMS.md with step-by-step Stripe dashboard instructions.

---

### IMPORTANT-B5: Plan Switching via Billing Portal
**Problem:** No UI exists for switching between monthly and annual plans. Users would need to cancel and resubscribe.

**Change:** This is a Stripe dashboard configuration, not a code change. Document the steps in MANUAL_ACTION_ITEMS.md: enable plan switching in the Stripe billing portal settings.

---

### IMPORTANT-B6: Handle `past_due` Status
**Problem:** When a payment fails, the user immediately loses Plus access. But Stripe retries payments (typically 3 times over ~2 weeks). Cutting access on the first failure is too aggressive.

**Files:** `backend/database.py` (update `is_user_plus()`), `backend/routes/entitlements.py` (expose status to frontend), `src/lib/plan/entitlements.js` (handle `past_due` in sync), frontend components (add payment failed banner).
**Change:** (1) `is_user_plus()` now returns True for "past_due" so users keep access during retries. (2) The entitlements endpoint exposes the status so the frontend can show a "payment failed — update your payment method" banner.

---

### MINOR-B7: Trial Duration as Environment Variable
**Problem:** The trial period (14 days) is hardcoded. If you ever want to experiment with different trial lengths, you'd need code changes.

**Files:** `backend/routes/stripe_routes.py`, `.env.example`
**Change:** Read trial duration from `TRIAL_PERIOD_DAYS` environment variable (default: 14).

---

### MINOR-B8: Dev Endpoint Protection
**Problem:** Dev diagnostic endpoints could theoretically be accessible in production if ENV isn't set properly.

**File:** `backend/routes/stripe_routes.py`
**Change:** Already properly gated (empty string ENV is NOT treated as dev). Adding an additional explicit comment to confirm this is intentional. No code change needed — already correctly implemented.

---

### MINOR-B9: Proration Policy
**Problem:** No explicit proration policy is set when creating checkout sessions.

**Change:** No code change needed now. Only relevant when plan switching is added (B5). Document in MANUAL_ACTION_ITEMS.md.

---

### MINOR-B10: Standardize Frontend Pricing
**Problem:** PricingPage shows $9.99/$7.99 while PaywallModal and PlusPage show $10/$96. Inconsistent numbers undermine trust.

**Files:** `src/components/PricingPage.jsx` (and shared config from B3)
**Change:** All pages now use the same shared pricing config, showing consistent $10/month and $96/year across the board.

---

*This checkpoint was created before any code changes were made.*
