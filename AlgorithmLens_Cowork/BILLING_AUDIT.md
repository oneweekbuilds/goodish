# AlgorithmLens — Billing Audit Report

**Date:** February 15, 2026
**Scope:** Full Stripe integration, subscription lifecycle, feature gating
**Standard:** Pricing & Billing Skill (v0.1.0) + Stripe Patterns Reference

---

## Summary

| Severity | Count |
|---|---|
| **Critical** | 1 |
| **Important** | 5 |
| **Minor** | 4 |

**Overall assessment:** The billing system is well-architected. Webhook idempotency, backend-driven entitlements, fail-closed feature gating, and signature verification are all properly implemented. The one critical issue is a gap in trial-vs-paid cancellation handling. The important issues are mostly about hardcoded values that create maintenance risk and a missing `invoice.payment_succeeded` handler. None of these are show-stoppers, but the critical and important items should be addressed before accepting real payments.

---

## What's Working Well

Before listing the gaps, it's worth noting what's already solid — this system has clearly been built with care:

- **Webhook idempotency** — Event IDs are tracked in a `stripe_webhook_events` table. Duplicate events are detected and skipped. This is exactly the right pattern.
- **Backend-driven entitlements** — The `is_user_plus()` function in `database.py` is the single source of truth. It returns `True` only for `"active"` or `"trialing"` status. The frontend syncs from this via `/api/user/entitlements`.
- **Fail-closed gating** — If the entitlements fetch fails, the frontend defaults to FREE (not PLUS). This means a network error never accidentally grants premium access.
- **Double-layer feature gating** — Trends and evidence bundles are gated at both the API layer (HTTP 403) and the UI layer (locked overlay). A free user can't access premium data even if they manipulate the frontend.
- **Webhook signature verification** — `stripe.Webhook.construct_event()` validates signatures using the webhook secret. Unverified payloads are rejected with 400.
- **Out-of-order event handling** — The `checkout.session.completed` handler fetches the real subscription status from Stripe's API rather than trusting the event payload alone. This handles cases where events arrive out of order.
- **Rate limiting** — Checkout creation is limited to 5/minute. Evidence bundles are limited to 30/minute.
- **Startup validation** — The backend fails loudly if required Stripe environment variables are missing.
- **Checkout verification fallback** — A `/stripe/verify-checkout` endpoint exists as a webhook fallback, so subscription activation doesn't silently fail if a webhook is delayed.

---

## Findings

---

### CRITICAL-B1: Trial Cancellation Does Not Revoke Access Immediately

**What the gap is:**
The Stripe Patterns Reference specifies: "If user cancels during trial, access reverts to free immediately." Currently, the `customer.subscription.deleted` webhook handler in `stripe_routes.py` (lines 434–458) sets the status to `"canceled"` and preserves `current_period_end`. This is correct for paid cancellations (access continues until period end), but for trial cancellations, access should be revoked immediately.

The `is_user_plus()` function in `database.py` only checks whether the status is `"active"` or `"trialing"` — so a canceled trial user would correctly lose access. However, the `current_period_end` is still preserved, which could cause confusion in the UI if it displays "access until [date]" for a trial user who canceled and should have no remaining access.

**What could go wrong:**
A user who cancels during their free trial could see messaging like "Your Plus access continues until [date]" when they should see "Your account has been switched to Free." This is a confusing experience that could also create support tickets.

**What the fix involves:**
In the `customer.subscription.deleted` handler, check whether the canceled subscription was in a trial period. If so, set `current_period_end` to the current time (or null) instead of preserving the original value. This way the frontend shows the correct state. Stripe provides a `trial_end` field on the subscription object that can be compared to the current time.

---

### IMPORTANT-B2: Missing `invoice.payment_succeeded` Handler

**What the gap is:**
The Pricing & Billing Skill requires handling `invoice.payment_succeeded` to confirm renewals. The webhook handler in `stripe_routes.py` handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `customer.subscription.trial_will_end`, and `invoice.payment_action_required` — but `invoice.payment_succeeded` is not explicitly handled.

**What could go wrong:**
In practice, `customer.subscription.updated` often fires alongside successful payments, so renewals likely still update status correctly. However, relying on this is fragile. If Stripe changes the timing of events or if `subscription.updated` is delayed, a successful renewal might not be reflected promptly. Additionally, `invoice.payment_succeeded` is the canonical event for confirming that money was actually collected — it's the right place to reset a `past_due` status back to `active`.

**What the fix involves:**
Add an `invoice.payment_succeeded` handler that looks up the subscription by customer ID and sets the status to `"active"` if it was previously `"past_due"`. This ensures clean recovery from failed-then-retried payments.

---

### IMPORTANT-B3: Hardcoded Pricing in Frontend Components

**What the gap is:**
The prices ($10/month, $96/year) are hardcoded in multiple frontend files: `PaywallModal.jsx` (lines 213, 231), `PlusPage.jsx` (lines 215, 237), and `PricingPage.jsx`. These values exist independently from the actual Stripe price configuration. If you ever change prices in Stripe, you'd need to manually update every frontend file that displays a price.

**What could go wrong:**
If prices are changed in Stripe (e.g., during a promotion or price increase) but the frontend isn't updated simultaneously, users would see one price on the marketing page and be charged a different price at checkout. This is a trust-destroying experience and could also create legal/compliance issues.

**What the fix involves:**
Either (a) create a `/api/pricing` endpoint that returns current prices from Stripe and have the frontend fetch from it, or (b) move the price values to a single shared constants file so there's only one place to update. Option (a) is more robust but adds a network request; option (b) is simpler and sufficient for now.

---

### IMPORTANT-B4: Trial-Ending Email Not Configured

**What the gap is:**
The `customer.subscription.trial_will_end` webhook handler (lines 489–504) logs the event but doesn't send an email. There's a comment referencing "MANUAL_ACTION_ITEMS.md" for email setup. This means users approaching the end of their 14-day trial receive no notification that they're about to be charged.

**What could go wrong:**
A user who signed up for a free trial and forgot about it gets charged without warning. This is one of the most common sources of chargebacks and negative reviews for subscription products. Many jurisdictions also have consumer protection requirements around trial-to-paid transitions.

**What the fix involves:**
Configure Stripe's built-in email templates for trial ending notifications (this is done in the Stripe dashboard, not in code). Alternatively, integrate a transactional email service (SendGrid, Resend, etc.) and trigger an email from the webhook handler. The Stripe dashboard approach is simpler and doesn't require code changes.

---

### IMPORTANT-B5: No Handling for Plan Changes (Upgrade/Downgrade)

**What the gap is:**
There is no UI or API endpoint for switching between monthly and annual plans. A user who starts on monthly and wants to switch to annual (or vice versa) would need to cancel and resubscribe, losing their current billing period.

**What could go wrong:**
Users who want to switch to annual billing to save money have a frustrating experience. They either can't figure out how to do it, or they cancel and resubscribe — potentially losing their trial if they haven't used it yet.

**What the fix involves:**
This can be handled through Stripe's billing portal, which is already integrated. Verify that the portal configuration in Stripe's dashboard allows plan switching. If it does, this is already solved — users can click "Manage subscription" and switch plans in the portal. If the portal doesn't show plan switching options, enable it in the Stripe dashboard under Portal → Features.

---

### IMPORTANT-B6: `past_due` Status Not Handled in Frontend

**What the gap is:**
When a payment fails, the webhook sets the subscription status to `past_due`. The `is_user_plus()` function returns `False` for `past_due`, which means the user immediately loses Plus access. However, the Stripe Patterns Reference says: "Do NOT immediately revoke access. Stripe retries." The backend correctly doesn't set the status to `canceled` (it sets `past_due`), but the `is_user_plus()` check treats `past_due` the same as `canceled`.

Additionally, the frontend has no specific UI state for `past_due`. The user would just see the free tier experience without understanding why or what to do about it.

**What could go wrong:**
A user whose credit card expired or had a temporary hold would lose Plus access immediately on the first failed charge, even though Stripe will retry the payment (typically 3 times over ~2 weeks). This is overly aggressive and creates a poor experience for users who would otherwise convert on a retry.

**What the fix involves:**
Two changes: (1) Update `is_user_plus()` to also return `True` for `"past_due"` status, so users keep access during Stripe's retry window. Access is only truly revoked when Stripe sends `customer.subscription.deleted` after all retries fail. (2) Add a banner or notification in the frontend when status is `past_due`, telling the user their payment failed and they should update their payment method (with a link to the billing portal).

---

### MINOR-B7: Hardcoded Trial Duration

**What the gap is:**
The trial period (14 days) is hardcoded in `stripe_routes.py` line 113 (`"trial_period_days": 14`). It's also hardcoded in several frontend files as "14-day free trial." If you wanted to experiment with different trial lengths (e.g., 7-day trial for a promotion), you'd need to change code in multiple places.

**What could go wrong:**
Low risk currently, but if you ever want to A/B test trial durations or run a promotion, the hardcoded values make it tedious and error-prone.

**What the fix involves:**
Move the trial duration to an environment variable (e.g., `TRIAL_PERIOD_DAYS=14`) and have the backend pass it to the frontend via the `/api/pricing` endpoint (if created per B3). Low priority — only matters if you plan to experiment with trial lengths.

---

### MINOR-B8: Dev Diagnostic Endpoints Not Protected

**What the gap is:**
The dev diagnostic endpoints (`/api/dev/stripe/webhook-events` and `/api/dev/subscription`) appear to be available without strong access controls. The webhook events endpoint at line 537 has no authentication decorator shown (though it may have one at the router level). If these endpoints are accessible in production, they could leak subscription data.

**What could go wrong:**
In production, someone could hit `/api/dev/stripe/webhook-events` and see recent webhook events, which include Stripe customer IDs and subscription IDs. This is a data exposure risk.

**What the fix involves:**
Ensure these endpoints are disabled in production. This could be done by checking an environment variable (e.g., only register the `/dev/` routes when `ENVIRONMENT=development`) or by removing them before production deployment.

---

### MINOR-B9: No Proration Policy Explicitly Set

**What the gap is:**
When creating checkout sessions, no explicit proration policy is set. Stripe defaults to daily prorated billing, which is usually fine, but the behavior isn't explicitly configured.

**What could go wrong:**
If Stripe changes its default proration behavior, or if a plan change is added later (B5), the proration might not work as expected. Low risk currently since plan switching isn't offered yet.

**What the fix involves:**
When/if plan switching is added, explicitly set the proration behavior in the Stripe API call. Not needed now.

---

### MINOR-B10: Frontend Pricing Inconsistency Between Pages

**What the gap is:**
The `PricingPage.jsx` shows monthly as `$9.99/month` and annual as `$7.99/month ($95.88 billed today)`, while `PaywallModal.jsx` shows `$10/month` and `$96/year`. The `PlusPage.jsx` shows yet another presentation. While these may resolve to the same Stripe prices, the inconsistent display creates confusion.

**What could go wrong:**
Users who see "$9.99" on the pricing page and "$10" in the paywall modal may wonder if they're looking at different plans. Inconsistent pricing display undermines trust.

**What the fix involves:**
Standardize all price displays across all pages. Use a single source (shared constants file or pricing API endpoint per B3) so every component renders the same numbers in the same format.

---

## Files Reviewed

| File | Role |
|---|---|
| `backend/routes/stripe_routes.py` | Checkout, webhook, portal, verification endpoints |
| `backend/routes/entitlements.py` | Entitlements API (Plus status check) |
| `backend/routes/trends.py` | Trends endpoint with Plus gating |
| `backend/routes/evidence_bundles.py` | Evidence bundles with Plus gating |
| `backend/database.py` | Subscription table, `is_user_plus()`, webhook idempotency |
| `backend/app.py` | Stripe initialization, env var validation |
| `backend/tests/test_payment_flow.py` | Payment flow tests |
| `src/lib/plan/planTier.js` | Plan tier constants and helpers |
| `src/lib/plan/entitlements.js` | Entitlements fetching and sync |
| `src/lib/plan/PaywallProvider.jsx` | Checkout and portal flow |
| `src/components/plan/PaywallModal.jsx` | Paywall UI |
| `src/components/plan/LockedOverlayCard.jsx` | Locked feature overlay |
| `src/components/plan/UpgradeCTA.jsx` | Upgrade button |
| `src/pages/plus/PlusPage.jsx` | Plus marketing page |
| `src/components/PricingPage.jsx` | Pricing comparison page |
| `src/pages/dashboard/DashboardPage.jsx` | Dashboard feature gating |
| `src/pages/dev/EntitlementsDebugPage.jsx` | Dev diagnostics |
| `.env.example` | Environment variable template |

---

*This audit was performed by reviewing the codebase against the Pricing & Billing Skill v0.1.0 and Stripe Patterns Reference. No Stripe API calls were made and no customer data was accessed.*
