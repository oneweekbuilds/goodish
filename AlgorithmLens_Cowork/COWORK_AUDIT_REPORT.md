# AlgorithmLens — Full Codebase Audit Report

**Date:** February 13, 2026
**Scope:** Read-only audit of the entire AlgorithmLens codebase (frontend + backend)
**Auditor:** Claude (Cowork mode)

---

## 1. Project Overview (Plain Language)

AlgorithmLens is a web application that lets people see what their social media feeds are actually showing them. A user can scan their feed (via a Chrome extension or file upload), and AlgorithmLens breaks down the results into six dashboard tabs: Overview, Sources, Ads, Politics, Tone, and Suggested vs Followed.

The free tier gives anyone a single-scan snapshot — a one-time look at what's in their feed right now. The paid tier ("Plus," at $10/month or $96/year with a 14-day free trial) is designed to unlock longitudinal analysis: comparing scans over time, seeing what changed, and tracking trends.

The product philosophy is **epistemic restraint**: describe what appeared in the feed, never claim to know *why* the platform showed it. The tool should be a mirror, not an oracle.

The frontend is built with React and Vite. The backend is Python (FastAPI) with a SQLite database. Payments go through Stripe. Authentication uses Supabase JWTs.

---

## 2. Current State Assessment

### What's Complete and Working

**Frontend — Core Dashboard (6 tabs):**
All six tabs are built and render data:

- **Overview** (`src/pages/dashboard/tabs/OverviewTab.jsx`) — Source concentration, commercial content, political share, tone distribution, suggested vs followed ratio. Includes a "Next steps" section with context-aware suggestions.
- **Sources** (`src/pages/dashboard/tabs/SourcesTab.jsx`) — Top sources table, concentration summary. Note: Section 2.3 (Suggested vs Followed share within Sources) is commented out with the note `/* HIDDEN: Capability does not exist yet */`.
- **Ads** (`src/pages/dashboard/tabs/AdsTab.jsx`) — Commercial content breakdown (labeled ads vs likely selling), tone split for selling vs not-selling posts.
- **Politics** (`src/pages/dashboard/tabs/PoliticsTab.jsx`) — Political content frequency measurement.
- **Tone** (`src/pages/dashboard/tabs/ToneTab.jsx`) — Overall tone distribution, political vs non-political tone, selling vs not-selling tone.
- **Suggested vs Followed** (`src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`) — Followed vs suggested breakdown with tone comparison and a "What you can do" advice card.

**Frontend — Plan & Paywall System:**
- Plan tier state management (`src/lib/plan/planTier.js`) — Three tiers: anon, free, plus. Stored in localStorage, synced from backend.
- Entitlements sync (`src/lib/plan/entitlements.js`) — Fetches `is_plus` from backend. Fails closed to FREE on error (good safety behavior).
- PaywallProvider (`src/lib/plan/PaywallProvider.jsx`) — Global modal management with Stripe Checkout redirect.
- PaywallModal (`src/components/plan/PaywallModal.jsx`) — Accessible modal with billing cycle toggle, focus trap, escape key handling.
- Plus conversion page (`src/pages/plus/PlusPage.jsx`) — Free vs Plus comparison, pricing cards, FAQ section.

**Frontend — Supporting Infrastructure:**
- Dashboard catalog (`src/lib/dashboard/dashboardCatalog.js`) — Declarative catalog defining all dashboard views with data functions, takeaway strings, sort order, and visibility flags.
- Insight builders (`src/lib/dashboard/insightBuilders.js`) — Threshold-based hero card generators for each tab.
- Analytics client and events system.
- Demo mode support (`?demo=1` URL parameter) that isolates analytics and provides mock data.

**Backend — Core:**
- FastAPI application (`backend/app.py`) — API endpoints for scans, dashboard, authentication, Stripe.
- SQLite database (`backend/database.py`) — Tables for scans, subscriptions, aggregate buckets, learned priors, aggregation config, and Stripe webhook idempotency.
- Authentication (`backend/auth.py`) — Supabase JWT verification.
- Video processor and commercial classifier modules.

**Backend — Stripe Integration:**
- Checkout session creation (`/api/stripe/create-checkout`) — Maps billing cycle to price ID, creates Stripe customer, initiates checkout with 14-day trial.
- Webhook handler (`/api/stripe/webhook`) — Processes `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted` events.
- Entitlements endpoint (`/api/user/entitlements`) — Returns `is_plus` based on subscription status.
- Dev diagnostic endpoints for webhook events and subscription inspection.

**Backend — Accuracy & Evaluation:**
An extensive `backend/accuracy/` directory contains evaluation infrastructure for measuring classifier performance.

### What's Partially Complete

- **Suggested vs Followed tab data pipeline:** The tab UI exists, but the actual data depends on "platform metadata captured during scans." The tab shows a message saying this will be available in future releases and currently only works in demo mode.
- **Sources tab Section 2.3:** Explicitly commented out as not yet implemented.
- **Trends/longitudinal analysis:** The TrendsCTA and TrendsPanel components exist, and Plus gating is wired up, but the actual trend comparison features (comparing scans side-by-side, tracking shifts over time) appear to be the planned Plus value proposition rather than fully shipped functionality.

### What Appears Missing

- **Self-serve subscription management:** There is no customer portal endpoint or UI for users to manage, pause, or cancel their subscription themselves. Cancellation currently depends on Stripe's webhook (`customer.subscription.deleted`) but there's no user-facing "Manage subscription" or "Cancel" button.
- **Stripe Customer Portal integration:** No `stripe.billing_portal.Session.create()` call exists in the backend. Users cannot access their billing details, update payment methods, or cancel without contacting support.
- **Trial expiration notification:** No mechanism to warn users their trial is about to end or has ended. The frontend syncs entitlements on load, so it will eventually reflect the change, but there's no proactive notification.
- **Webhook retry/recovery:** If the webhook endpoint is down when Stripe sends an event, there's no manual reconciliation mechanism beyond Stripe's built-in retry behavior. No scheduled job checks for stale subscription states.
- **Rate limiting:** No visible rate limiting on API endpoints, including the Stripe checkout creation endpoint.
- **Error boundary:** No React error boundary is visible in the component tree (though one may exist higher up in App.jsx).

---

## 3. Stripe and Payments Audit

### What's Implemented (Strengths)

The Stripe integration is reasonably well-structured:

- **Webhook signature verification** is present and correct (lines 1368-1378 of `app.py`). Events are verified using `stripe.Webhook.construct_event()`.
- **Idempotency** is handled via a `was_stripe_event_processed()` / `mark_stripe_event_processed()` pattern in the database. Duplicate events are safely ignored.
- **Out-of-order event handling:** The `subscription.updated` handler includes fallback logic when the customer→user mapping doesn't exist yet (tries Stripe customer metadata, then subscription metadata).
- **Fail-closed entitlements:** The frontend `entitlements.js` sets tier to FREE (not PLUS) when the backend call fails. The backend `is_user_plus()` function only returns true for `active` or `trialing` status.
- **Customer→user mapping:** `client_reference_id` ties the Stripe checkout to the Supabase user ID. Customer metadata also stores `supabase_user_id` as a fallback.
- **Sanitized API responses:** The entitlements endpoint and dev endpoints strip Stripe IDs before returning data.
- **Dev endpoints are environment-gated:** `/api/dev/*` endpoints check for dev/development/local environment before responding.

### Gaps and Concerns

1. **No Customer Portal (Critical for launch):** Users have no way to manage their subscription. There is no `/api/stripe/create-portal-session` endpoint and no "Manage subscription" link in the UI. Before launching paid subscriptions, you need a way for users to cancel, update payment methods, and view invoices without contacting support.

2. **No `invoice.payment_failed` webhook handler:** If a user's card declines after the trial, Stripe sends `invoice.payment_failed` events. The webhook handler does not process this event type. This means a user whose payment fails might remain in a "trialing" or "active" state in your database until Stripe eventually sends a `customer.subscription.deleted` event (which could take days depending on your Stripe dunning settings).

3. **No `invoice.paid` webhook handler:** Similarly, when a trial converts to a paid subscription, Stripe sends `invoice.paid`. Not handling this means you're relying solely on `subscription.updated` to catch the trial→active transition, which should work but is less explicit.

4. **Trial-end grace period ambiguity:** The `is_user_plus()` function returns true for `trialing` status. When a trial ends and payment fails, the subscription status goes through `past_due` before `canceled`. During `past_due`, `is_user_plus()` returns false (correct), but there's no user communication about what happened.

5. **Dev diagnostic endpoints leak in ambiguous environments:** The dev endpoint guard checks if `ENV` is in `("dev", "development", "local", "")`. The empty string default means that if `ENV` is not set at all in production, the diagnostic endpoints would be accessible. This should be inverted: only enable in explicitly listed dev environments, and block by default.

6. **`successUrl` and `cancelUrl` come from the frontend:** The `CreateCheckoutRequest` model accepts `successUrl` and `cancelUrl` from the client. A malicious client could pass arbitrary URLs. These should be validated against an allowlist or constructed server-side.

7. **No webhook event cleanup:** Processed webhook events accumulate in the database indefinitely. There's no cleanup job to prune old events.

---

## 4. User-Facing Copy Audit (Epistemic Restraint)

This section flags language that violates the product's core principle: **describe what appeared; never claim to know why.** Each finding includes the exact text, where it appears, what the problem is, and a suggested direction.

### High Priority — Claims About Platform Intent or Causation

**4.1 "why it likely happened"**
- **Where:** `PlusPage.jsx` line 95, `PaywallModal.jsx` line 162
- **Text:** "See how your feed changes over time, what shifted, and why it likely happened."
- **Problem:** This promises causal explanation of feed changes. The product philosophy says you cannot know why platforms show what they show. The FAQ on the same page (line 289) correctly says "we do not speculate about platform intent," creating an internal contradiction.
- **Suggested direction:** Replace with something like "See how your feed changes over time, what shifted, and what factors may be involved."

**4.2 "Algorithmic recommendations optimize for engagement"**
- **Where:** `insightBuilders.js` line 367 (buildSuggestedVsFollowedHero, whyCare field)
- **Text:** "Algorithmic recommendations optimize for engagement, which may not align with what you consciously want to see."
- **Problem:** This is a claim about platform intent. We don't know what any specific platform's algorithm optimizes for. Even if it's a widely held belief, stating it as fact in a transparency tool undermines the tool's credibility.
- **Suggested direction:** "Algorithmically suggested content is selected by the platform, not by you. The criteria the platform uses are not publicly documented."

**4.3 "how hard the feed is selling to you"**
- **Where:** `dashboardCatalog.js` (Ads tab takeaway text, in a hidden view)
- **Text:** "how hard the feed is selling to you"
- **Problem:** Implies intentional behavior by the feed itself ("selling *to you*"). Anthropomorphizes the algorithm.
- **Suggested direction:** "what share of your feed contains commercial content"

**4.4 "Where your feed is steering you to spend"**
- **Where:** `dashboardCatalog.js` (hidden view in catalog)
- **Text:** "Where your feed is steering you to spend"
- **Problem:** "Steering" implies deliberate manipulation. The feed shows ads; we can't claim it's steering.
- **Suggested direction:** "Where commercial content appears in your feed"

**4.5 "Curate your algorithm"**
- **Where:** `SuggestedVsFollowedTab.jsx` line 463
- **Text:** "Curate your algorithm: Engage with (like, share, comment) content from accounts you follow to signal to the algorithm that you want to see more from them."
- **Problem:** Claims specific knowledge of how algorithms respond to user behavior. This is prescriptive advice presented as fact, but the actual response of any platform's algorithm is not publicly documented.
- **Suggested direction:** "Platforms often describe engagement (likes, shares, comments) as a factor in feed ranking, though the exact weight is not disclosed."

### Medium Priority — Psychological Claims Without Citation

**4.6 "High political exposure continuously shapes your mood and worldview"**
- **Where:** `insightBuilders.js` line 201 (buildPoliticsHero, whyCare field)
- **Problem:** This is a psychological claim about the user's internal state. While there is research on this topic, presenting it as definitive fact in a dashboard card goes beyond description.
- **Suggested direction:** "High political exposure means a significant portion of your scrolling time involves political content."

**4.7 "Outrage-driven content is engaging but can affect how you feel after scrolling"**
- **Where:** `insightBuilders.js` line 266 (buildToneHero, whyCare field)
- **Problem:** Makes a causal claim about emotional impact. "Outrage-driven" is also an interpretive label.
- **Suggested direction:** "A large share of posts in your feed carry negative or conflict-focused framing."

**4.8 "Commercial content influences purchasing behavior even when you scroll past"**
- **Where:** `insightBuilders.js` line 163 (buildAdsHero, whyCare field)
- **Problem:** Causal claim about behavioral influence. While supported by advertising research, stating it without qualification in a dashboard reads as editorial opinion.
- **Suggested direction:** "Regular exposure to commercial content is part of your daily feed experience."

**4.9 "High concentration means these few sources have outsized influence on what you think about and pay attention to"**
- **Where:** `insightBuilders.js` line 39 (buildOverviewHero, whyCare field)
- **Problem:** Claims to know what influences the user's cognition.
- **Suggested direction:** "High concentration means most of your feed content comes from a small number of accounts."

### Lower Priority — Loaded Language

**4.10 "Negative or outrage tone"**
- **Where:** Appears across ToneTab.jsx, OverviewTab.jsx, SuggestedVsFollowedTab.jsx, insightBuilders.js, dashboardCatalog.js
- **Problem:** "Outrage" is a loaded, sensational label. The classifier likely detects negative sentiment or conflict-related language; labeling it "outrage" editorializes the classification.
- **Suggested direction:** "Negative or conflict-focused tone" — still descriptive but less sensational.

**4.11 "Unlabeled promotion blends persuasion with entertainment, making it harder to evaluate intent"**
- **Where:** `insightBuilders.js` line 139 (buildAdsHero, whyCare field)
- **Problem:** "Blends persuasion with entertainment" is an interpretive claim about the creator's strategy.
- **Suggested direction:** "Some promotional content is not clearly labeled as advertising."

**4.12 "Reduce engagement to stop reinforcing patterns"**
- **Where:** `dashboardCatalog.js` (hidden view)
- **Problem:** Claims that reducing engagement will change algorithm behavior. This is speculative about platform mechanics.
- **Suggested direction:** Remove or reframe as "You can choose to engage less with content you'd rather not see."

---

## 5. Security Concerns

### Critical

**5.1 Real API keys and secrets in `.env.local`**

The file `.env.local` in the project root contains real (non-placeholder) credentials:

- `GOOGLE_API_KEY` — A real Google API key (starts with `AIzaSy...`)
- `SUPABASE_JWT_SECRET` — The actual JWT signing secret
- `STRIPE_SECRET_KEY` — A Stripe test-mode secret key (starts with `sk_test_...`)
- `STRIPE_WEBHOOK_SECRET` — A real webhook signing secret
- `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ANNUAL` — Real Stripe price IDs
- `VITE_STRIPE_PUBLISHABLE_KEY` — A Stripe test-mode publishable key

While `.env.local` is listed in `.gitignore` (so it should not be committed), the fact that it contains real credentials means:
- If `.gitignore` is ever misconfigured, these secrets would be exposed.
- Anyone with access to the development machine or this workspace can see them.
- The `SUPABASE_JWT_SECRET` in particular would allow forging authentication tokens.

**Recommendation:** Verify these secrets have never been committed to git history. If they have, rotate all of them immediately. Consider using a secrets manager or environment-specific injection rather than a file on disk.

### Moderate

**5.2 Dev diagnostic endpoints accessible by default**

As noted in Section 3, the `/api/dev/stripe/webhook-events` and `/api/dev/subscription` endpoints check if `ENV` is in `("dev", "development", "local", "")`. The empty string means they're accessible when `ENV` is not set, which could happen in a misconfigured production deployment.

**Recommendation:** Invert the logic: explicitly block these endpoints unless `ENV` is set to a known dev value. Default should be "locked."

**5.3 Frontend `successUrl`/`cancelUrl` from client**

The Stripe checkout endpoint accepts redirect URLs from the frontend without validation. A malicious request could set these to arbitrary URLs, potentially for phishing after checkout.

**Recommendation:** Either construct these URLs server-side from a configured domain, or validate them against an allowlist of permitted domains.

### Low

**5.4 SQLite for production**

SQLite is used for the database (`backend/database.py`). This is fine for development and low-traffic production, but has limitations for concurrent writes and doesn't support replication. Not urgent, but worth noting for scaling planning.

**5.5 `check_same_thread=False` on SQLite connection**

The database connection uses `check_same_thread=False` (line 16 of `database.py`). This disables SQLite's thread-safety check, which is necessary for FastAPI's async model but means the application must handle concurrent access carefully.

---

## 6. Recommended Next Steps (Ranked by Importance)

### 1. Add Stripe Customer Portal (Must-have before paid launch)

**Why:** Users currently have no way to cancel their subscription, update their payment method, or view invoices. This is both a legal requirement in many jurisdictions and a basic trust expectation. Without it, you will receive support requests for every cancellation and risk chargebacks.

**What to do:** Add a `/api/stripe/create-portal-session` endpoint that creates a Stripe Billing Portal session, and a "Manage subscription" link in the user's account area.

### 2. Fix the "why it likely happened" copy contradiction (Must-have before launch)

**Why:** The Plus page promises causal explanations ("why it likely happened") while the FAQ on the same page says you don't speculate about platform intent. This is a credibility issue for a tool built on epistemic restraint. If a journalist or skeptical user notices this, it undermines the entire positioning.

**What to do:** Review and revise all copy items flagged in Section 4, prioritizing items 4.1 through 4.5 (claims about platform intent or causation).

### 3. Verify secrets have never been committed to git (Must-have immediately)

**Why:** If the `.env.local` credentials were ever in a git commit — even one that was later reverted — they are recoverable from git history. The JWT secret in particular would allow anyone to forge authentication tokens.

**What to do:** Run `git log --all --full-history -- .env.local` to check. If any results appear, rotate every credential in that file immediately.

### 4. Add `invoice.payment_failed` webhook handler (Should-have before paid launch)

**Why:** Without it, users whose payments fail after the trial will be in a limbo state where the backend doesn't accurately reflect their subscription status until Stripe eventually cancels the subscription.

**What to do:** Add handling for `invoice.payment_failed` in the webhook handler. When payment fails, update the subscription status to `past_due` in the database. Consider showing the user a message that their payment needs attention.

### 5. Invert dev endpoint access logic (Should-have before production)

**Why:** The current logic makes diagnostic endpoints accessible by default (when ENV is unset). A production deployment that forgets to set ENV would expose webhook event history.

**What to do:** Change the guard to only allow access when `ENV` is explicitly set to a dev value. Block by default.

### 6. Validate Stripe redirect URLs server-side (Should-have)

**Why:** Accepting `successUrl` and `cancelUrl` from the client without validation is a phishing vector.

**What to do:** Either construct URLs server-side using a configured base domain, or validate that incoming URLs match an allowlist.

### 7. Audit all "whyCare" strings in insightBuilders.js (Should-have)

**Why:** Most of the epistemic restraint violations are concentrated in the `whyCare` field of the insight hero cards. These are the prominent, bold statements users see at the top of each tab. Getting these right is important for the product's integrity.

**What to do:** Review each `whyCare` string against the standard: "Does this describe what's in the feed, or does it claim to know what effect it has on the user?" Replace interpretive claims with descriptive statements.

### 8. Replace "outrage" label across the codebase (Nice-to-have)

**Why:** "Outrage" is a loaded, editorializing label. It appears in at least 6 files across the frontend. The classifier detects negative sentiment; calling it "outrage" adds editorial judgment.

**What to do:** Search-and-replace "Negative or outrage tone" with "Negative or conflict-focused tone" (or similar) across all tab files, insight builders, and the dashboard catalog.

### 9. Build out the Suggested vs Followed data pipeline (Roadmap item)

**Why:** Tab 6 exists in the UI but currently only works in demo mode. It shows a message about future releases. This is a core differentiator for the product's value proposition.

**What to do:** Implement platform metadata capture during scans so the Suggested vs Followed tab can show real data.

### 10. Plan for database scaling beyond SQLite (Roadmap item)

**Why:** SQLite works for now, but if the product grows, concurrent writes and lack of replication will become bottlenecks. Not urgent, but worth having a migration plan.

---

*End of audit report. No files were modified during this audit.*
