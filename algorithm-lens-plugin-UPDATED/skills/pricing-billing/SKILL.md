---
name: pricing-billing
description: >
  This skill should be used when working on "Stripe", "payments", "billing",
  "subscriptions", "pricing", "checkout", "webhooks", "trial", "cancellation",
  "is_user_plus", "premium features", "feature gating", "freemium", "Plus tier",
  or any payment-related functionality in the AlgorithmLens project.
version: 0.1.0
---

# Pricing and Billing Logic for AlgorithmLens

AlgorithmLens uses a freemium model with two tiers. Stripe handles all payment processing.

## Tier Definitions

### Free Tier
- Perform feed scans
- View the six-tab dashboard for individual snapshots
- No time limit, no scan limit (at launch)
- Full access to: Overview, Sources, Ads, Politics, Tone, Suggested vs. Followed

### Plus Tier — $10/month or $96/year
- Everything in Free
- Longitudinal trend analysis: see how feed composition changes over time
- Two-week free trial on first subscription
- Premium value proposition: historical perspective transforms individual snapshots into a dataset

## Database Flag

`is_user_plus` (boolean) determines access to premium features. This flag must be:
- Set to `true` when a subscription is successfully created or renewed
- Set to `false` when a subscription is cancelled, expires, or payment fails
- Checked at BOTH the API layer and the UI layer

## Feature Gating — Double Layer

### API Layer (Backend)
- Check `is_user_plus` before returning trend/longitudinal data
- Return HTTP 403 with a clear error message if the user is not Plus
- Never return premium data with a "just hide it on the frontend" approach

### UI Layer (Frontend)
- Check subscription status before rendering premium components
- Hide or disable trend analysis features for free users
- Show a clear, calm upgrade prompt (not an error state)
- Never show broken or empty premium UI — either fully functional or fully gated

## Stripe Integration Requirements

### Checkout Flow
- Create Stripe Checkout sessions for both monthly ($10) and annual ($96) plans
- Include the two-week free trial on first subscription
- Redirect to success/cancel URLs after checkout
- Handle checkout session completion via webhooks

### Webhook Handler
- Validate webhook signatures using Stripe's signing secret
- Handle these events at minimum:
  - `checkout.session.completed` — activate subscription
  - `customer.subscription.updated` — handle plan changes
  - `customer.subscription.deleted` — revoke access
  - `invoice.payment_succeeded` — confirm renewal
  - `invoice.payment_failed` — handle failed payment
- **Webhook handling must be idempotent** — processing the same event twice must not cause errors or double-charges

### Trial Logic
- Trial period: 14 days
- Trial start date stored in database
- Trial expiration must transition user cleanly to free tier
- No payment collected during trial
- If user cancels during trial, access reverts to free immediately

### Cancellation
- Cancellation revokes Plus access at end of billing period (or immediately if during trial)
- `is_user_plus` set to `false` upon access revocation
- User retains access to free tier features
- Historical snapshots remain accessible (free tier viewing)

### Billing Portal
- Users can manage their subscription through Stripe's billing portal
- Portal allows plan changes, payment method updates, and cancellation

## Detailed Reference

For webhook event handling patterns and error scenarios, read `references/stripe-patterns.md`.
