# Trial-End Email Notifications — Setup Guide

AlgorithmLens uses Stripe for subscription billing with a 14-day free trial. When a trial is about to end (3 days before expiration), Stripe fires a `customer.subscription.trial_will_end` webhook event. This guide covers how to ensure users receive a notification email at that point.

## Option A: Stripe Built-In Emails (Recommended for Beta)

Stripe can send a branded "Trial ending" email automatically — no code changes needed.

### Step-by-Step Setup

1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings** → **Emails** (under "Billing" or "Customer emails")
3. Find the **"Trial ending"** email option
4. Toggle it **ON**
5. Optionally customize the email:
   - Click the email template to edit
   - Add your AlgorithmLens branding (logo, colors)
   - Update the copy to mention what happens after the trial ends
   - Preview the email before saving

### Customization Tips

The default Stripe email is functional but generic. Consider customizing it to:

- Mention AlgorithmLens by name
- Remind users what they get with Plus (longitudinal trends, premium insights)
- Include a direct link to the billing portal for managing their subscription
- Set a friendly, non-pushy tone consistent with AlgorithmLens's epistemic restraint values

### Verifying Emails Are Sending

1. In the Stripe Dashboard, go to **Logs** → **Events**
2. Filter by event type: `customer.subscription.trial_will_end`
3. Click on any event to see details
4. In the event detail, check the "Emails" tab to confirm the email was queued/sent
5. For test mode, create a test subscription with a short trial (e.g., 1 minute) and verify the email fires

### Test in Stripe Test Mode

1. Use the Stripe CLI to trigger a test event:
   ```bash
   stripe trigger customer.subscription.trial_will_end
   ```
2. Or create a subscription with `trial_end` set to a near-future timestamp
3. Check your webhook logs in the AlgorithmLens backend for the structured log entry

## Option B: Custom Transactional Email (Future Enhancement)

For full brand control, integrate a transactional email service (SendGrid, Resend, or Postmark).

### Current Status

As of February 2026, AlgorithmLens does **not** have a transactional email service integrated. The webhook handler logs the trial-end event with structured data but does not send a custom email.

### Implementation Plan (When Ready)

1. Choose a service: **Resend** (recommended for simplicity) or **SendGrid** (for volume)
2. Add the API key as an environment variable: `TRIAL_EMAIL_API_KEY`
3. Create an HTML email template with AlgorithmLens branding
4. In `backend/routes/stripe_routes.py`, within the `customer.subscription.trial_will_end` handler:
   - Look up the user's email from Supabase or the Stripe customer object
   - Call the email service API to send the branded trial-end notification
5. Include in the email:
   - User's name (if available)
   - Trial end date
   - What happens next (subscription starts, or access reverts to free tier)
   - Link to manage subscription (billing portal)
   - Link to cancel if they don't want to continue

### Email Content Guidelines (Epistemic Restraint)

Per AlgorithmLens's copy standards:

- Do NOT use urgency language ("Act now!", "Don't miss out!")
- Do NOT make claims about what the user will "lose" — instead state what the free tier includes
- DO clearly state the trial end date and what subscription billing looks like
- DO provide a direct link to cancel or manage the subscription
- DO maintain a calm, informative, user-respecting tone

## Webhook Handler Logging

The backend already logs trial-end events with structured data. Each `customer.subscription.trial_will_end` event produces a log entry containing:

- `customer_id` — Stripe customer ID
- `subscription_id` — Stripe subscription ID
- `user_id` — AlgorithmLens user ID (from subscription record lookup)
- `trial_end_date` — ISO 8601 formatted trial end date
- `trial_end_unix` — Unix timestamp of trial end
- `note` — Reminder that Stripe's built-in email should have fired

These logs can be used for monitoring and alerting via your observability stack.
