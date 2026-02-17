# Manual Action Items

**Date:** February 14, 2026
**Context:** These items from the QA Report require action outside the codebase — in service dashboards, product decisions, or deployment configuration. Each has step-by-step instructions.

---

## 1. Rotate Exposed API Keys (Critical — Do Before Any Public Deployment)

Your `.env.local` file contains real credentials. Even though this file is gitignored, the keys should be rotated as a precaution.

### Stripe Keys (5 minutes)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Click "Roll key" next to the Secret key (`sk_test_...`)
3. Copy the new key
4. Update `STRIPE_SECRET_KEY` in your `.env.local`
5. Repeat for the Publishable key (`pk_test_...`) — update `VITE_STRIPE_PUBLISHABLE_KEY`
6. For the Webhook Secret:
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click your endpoint → "Reveal signing secret"
   - If you want a new one, delete the endpoint and recreate it
   - Update `STRIPE_WEBHOOK_SECRET` in `.env.local`

### Supabase JWT Secret (5 minutes)

1. Go to https://supabase.com/dashboard → your project → Settings → API
2. Under "JWT Settings," click "Generate a new JWT secret"
3. Copy the new secret
4. Update `SUPABASE_JWT_SECRET` in `.env.local`
5. **Important:** This will invalidate all existing user sessions. Users will need to sign in again.

### Google API Key (5 minutes)

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your current API key
3. Click the three-dot menu → "Regenerate key" (or create a new one)
4. Copy the new key and update `GOOGLE_API_KEY` in `.env.local`
5. **Recommended:** Also add restrictions:
   - Under "Application restrictions," select "HTTP referrers" and add your domain
   - Under "API restrictions," select "Restrict key" and choose only the APIs you use (Generative Language API)
   - Under "Quotas," set a daily request limit (e.g., 1,000 requests/day)

---

## 2. Set Up Trial-Ending Email Notifications

The code now logs `customer.subscription.trial_will_end` webhook events, but users won't see those logs. You need an email notification system.

### Option A: Use Stripe's Built-in Emails (Easiest — 2 minutes)

1. Go to https://dashboard.stripe.com/settings/billing/automatic
2. Under "Customer emails," enable "Send emails when a subscription trial is about to end"
3. Stripe will automatically email users 3 days before their trial expires
4. You can customize the email template in the Stripe dashboard

### Option B: Add a Transactional Email Service (More Control)

If you want branded emails with your own design:

1. Sign up for a service like Resend, SendGrid, or Postmark
2. Create a "Trial Ending" email template
3. In `backend/routes/stripe_routes.py`, find the `customer.subscription.trial_will_end` handler
4. Add code to send the email using the service's API
5. You'll need the user's email (available from `current_user` or from the Stripe customer object)

**Recommendation:** Start with Option A. It's free, takes 2 minutes, and you can switch to Option B later when you want more control over branding.

---

## 3. Product Decision: Suggested vs Followed Tab

The Suggested vs Followed tab currently shows a "Coming Soon" message because it needs platform metadata that isn't captured during scans yet.

### Options

**A. Complete the data pipeline (significant engineering work)**
- Would require the Chrome extension to capture whether each feed item was from a followed account or algorithmically suggested
- Platform-specific: TikTok, Instagram, YouTube each expose this differently
- This is a multi-week project

**B. Keep as "Coming Soon" (current state)**
- The tab is labeled clearly and works in demo mode
- Users can see what it will look like
- No risk of confusion

**C. Hide the tab entirely until it's ready**
- Remove the tab from the tab bar for non-demo users
- Reduces the "6 tabs" to "5 tabs" in marketing
- Cleaner UX but less preview value

**Recommendation:** Keep Option B for beta. The "Coming Soon" label is honest, and showing the tab in demo mode lets early users understand the future value. Complete the data pipeline for v2.

---

## 4. Verify Deployment After Code Changes

After deploying the updated code:

1. **Install new Python dependency:** Run `pip install slowapi==0.1.9` in your backend environment
2. **Test the rate limiter:** Try uploading more than 10 files in 1 minute — you should get a 429 (Too Many Requests) response
3. **Test the CSP header:** Open your deployed site, open DevTools → Network tab, click any page request, check Response Headers for `Content-Security-Policy`
4. **Test Stripe webhook:** Use the Stripe CLI to send a test `customer.subscription.trial_will_end` event and check your backend logs
5. **Test the billing portal:** Sign in as a Plus user, go to /plus, click "Manage subscription" — it should redirect to Stripe's portal

---

## 5. Enable Plan Switching in Stripe Billing Portal (B5)

Users currently have no way to switch between monthly and annual plans without canceling and resubscribing. The Stripe billing portal can handle this if configured.

### Steps (2 minutes)

1. Go to https://dashboard.stripe.com/settings/billing/portal
2. Under "Subscriptions," enable "Allow customers to switch plans"
3. Add both your monthly and annual price IDs as available plans
4. Under "Proration," select "Always prorate" (or your preferred proration behavior — see B9 below)
5. Save changes
6. Test: Sign in as a Plus user → click "Manage subscription" → verify you see the option to switch plans

---

## 6. Set Proration Policy When Plan Switching Is Enabled (B9)

When you enable plan switching (item 5 above), Stripe needs to know how to handle the money.

### Recommendation

Use "Always prorate" — this means if a user switches from monthly ($10) to annual ($96) mid-cycle, they get credit for unused time on the monthly plan applied to the annual plan. This is the most user-friendly option.

### How to Set

1. This is configured in the Stripe billing portal settings (same place as item 5)
2. Under "Proration," select "Always prorate"
3. Alternatively, if you add a plan-switching API endpoint in the future, set `proration_behavior: 'always_invoice'` in the Stripe API call

---

## 7. Dev Endpoint Security Confirmation (B8)

The dev diagnostic endpoints (`/api/dev/stripe/webhook-events` and `/api/dev/subscription`) are already protected. They only respond when `ENV` is explicitly set to `"dev"`, `"development"`, or `"local"`. An empty or missing `ENV` variable is NOT treated as dev mode.

### Verify in Production

1. After deployment, try accessing `https://your-domain.com/api/dev/stripe/webhook-events`
2. You should receive a 404 (Not Found) response
3. If you see data, check your production ENV variable — it should NOT be set to `dev`, `development`, or `local`

No code changes needed — this is already correctly implemented.

---

*This document accompanies QA_REPORT.md, CHECKPOINT_QA_FIXES.md, and BILLING_AUDIT.md.*
