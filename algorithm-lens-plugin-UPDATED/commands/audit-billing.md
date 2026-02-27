---
description: Review Stripe payment flow for gaps and issues
allowed-tools: Read, Grep, Glob, Write, Task
---

Perform a comprehensive billing audit of the AlgorithmLens Stripe integration. The goal is to verify that the entire payment flow is complete, correct, and production-ready.

First, read the pricing and billing skill at `${CLAUDE_PLUGIN_ROOT}/skills/pricing-billing/SKILL.md` and the Stripe patterns reference at `${CLAUDE_PLUGIN_ROOT}/skills/pricing-billing/references/stripe-patterns.md`. These define what the billing system should look like.

Then review the codebase for every billing-related component:

**1. Checkout Implementation**
- Find the Stripe Checkout session creation code
- Verify both monthly ($10) and annual ($96) plans are configured
- Check that the two-week free trial is included for first-time subscribers
- Verify success and cancel redirect URLs are set correctly
- Check that the Stripe publishable key is loaded from environment variables (not hardcoded)

**2. Webhook Handler**
- Find the webhook endpoint
- Verify signature validation is implemented using `STRIPE_WEBHOOK_SECRET`
- Check that these events are handled: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- Verify that webhook handling is idempotent (same event processed twice causes no harm)
- Check error handling for malformed or unexpected webhook payloads

**3. Subscription Status Updates**
- Verify that `is_user_plus` is set to `true` on successful subscription
- Verify that `is_user_plus` is set to `false` on cancellation, expiration, or final payment failure
- Check that state transitions are clean (no edge cases where a user gets stuck in an inconsistent state)

**4. Trial Logic**
- Verify trial period is 14 days
- Check that trial expiration transitions the user to free tier
- Verify no payment is collected during trial

**5. Cancellation Handling**
- Verify cancellation revokes access appropriately
- Check that access continues until end of billing period for paid cancellations
- Verify immediate revocation for trial cancellations

**6. Feature Gating**
- Verify API-layer gating (backend checks `is_user_plus` before returning premium data)
- Verify UI-layer gating (frontend hides premium features for free users)
- Check for any gaps where premium content could leak to free users

**7. Billing Portal**
- Check if Stripe billing portal is integrated
- Verify users can access subscription management

For each finding, document:
1. **What the gap or issue is** — in plain language
2. **What could go wrong** — the real-world consequence if this isn't fixed
3. **What the fix involves** — a plain-language description of the solution
4. **Severity** — critical, important, or minor

Save the results as `BILLING_AUDIT.md` in the project root directory. Include a summary at the top with counts by severity.
