# AlgorithmLens Beta Readiness Assessment

**Date:** February 17, 2026
**Auditor:** Claude (Comprehensive 5-Audit Sweep — Extra Critical)
**Scope:** Full codebase — frontend (React/Vite), backend (Python/FastAPI), Stripe integration, Chrome extension hooks, landing page, dashboard, and all user-facing copy.
**Previous Assessment:** Supersedes BETA_READINESS.md dated February 14/16, 2026. This audit is substantially more thorough and critical.

---

## Beta Readiness Verdict

**NO — Not ready for controlled beta.**

AlgorithmLens has strong product foundations: the six-tab dashboard architecture is well-built, the insight copy in `insightBuilders.js` is epistemically grounded, the billing flow covers the major Stripe lifecycle events, and the frontend component library is thoughtfully organized. However, this audit uncovered several critical issues that must be resolved before any external users interact with the product. The most urgent is a `.env.local` file containing live API keys (Stripe, Supabase, Gemini) that is present in the working codebase and may have been committed to git history. Additionally, there are unverified credibility claims on the landing page and pricing page ("Built at MIT," "Trusted by researchers at MIT, Harvard, and Stanford," "1200+ people on the waitlist"), multiple epistemic restraint violations in user-facing copy, a pricing page that advertises features the product does not actually offer, fabricated testimonials, and placeholder code in production paths. These are not polish issues — they are trust, legal, and security risks that would undermine the product's core thesis of transparency and honesty if exposed to beta users.

---

## Critical Blockers

Issues that **MUST** be fixed before any beta users see the product.

### C1. Live API Keys Exposed in `.env.local`
**Audit:** Security
**File:** `/.env.local`

The file contains production Stripe secret key (`sk_test_...`), Stripe webhook secret, Supabase JWT secret, Google Gemini API key, and Supabase anon key — all in plaintext. While `.gitignore` lists `*.local`, if this file was ever committed to git, the secrets exist in git history permanently.

Anyone with access to the repository can extract these keys and make Stripe charges, impersonate users via JWT forgery, or consume the Gemini API quota. This is a fundamental security violation.

**Fix:** Immediately rotate ALL exposed keys (Stripe, Supabase, Gemini). Verify with `git log --all --full-history -- .env.local` whether the file was ever committed. If so, use `git filter-repo` or BFG Repo-Cleaner to purge it from history. Ensure `.env.local` is in `.gitignore` (it already is) and verify it's not tracked with `git ls-files .env.local`.

---

### C2. Unverified Credibility Claims on Landing Page and Pricing Page
**Audit:** Copy
**Files:** `src/components/Hero/HeroSection.jsx` (line 77), `src/components/WaitlistSignup.jsx` (line 133), `src/components/PricingPage.jsx` (line 29), `src/components/Sections/SocialProofSection.jsx` (lines 185, 195, 200), `src/App.jsx` (line 243)

Multiple locations state "Built at MIT" as a prominent credibility badge. The pricing page claims "Trusted by researchers and users at MIT, Harvard, and Stanford." SocialProofSection claims "Open-source" and "No data stored." These claims appear unverified:

- **"Built at MIT"**: If the founder worked on this while at MIT, this is potentially defensible but still misleading if MIT has no institutional affiliation. If there is no MIT connection at all, this is fabricated credibility.
- **"Trusted by researchers and users at MIT, Harvard, and Stanford"**: This is a strong, specific claim. If there are not actual researchers at these institutions using the tool, this is deceptive.
- **"Open-source"**: The codebase does not appear to have a public repository or open-source license.
- **"No data stored"**: The backend has a `scans.db` SQLite database that stores user scans persistently. This claim is factually false.
- **"1200+ people on the waitlist"**: This number is hardcoded (`targetCount = 1200` in SocialProofSection.jsx), not pulled from real data.

AlgorithmLens's entire value proposition rests on transparency and honesty. Fabricated or misleading credibility claims on the landing page directly contradict the product's core thesis. If discovered by beta users — especially ones in the AI governance or academic community — this would be devastating to trust and reputation.

**Fix:** Remove or verify every claim. Replace "Built at MIT" with something verifiable (e.g., "Built by an MIT researcher" if true, or remove entirely). Remove the Harvard/Stanford claim unless documented. Remove "Open-source" unless the code is publicly available under an open-source license. Replace "No data stored" with an accurate statement like "Your video is deleted after processing." Replace the hardcoded waitlist counter with a real number from Beehiiv or remove it.

---

### C3. Pricing Page Advertises Features That Don't Exist
**Audit:** Copy / QA
**File:** `src/components/PricingPage.jsx`

The "Starter" (free) plan promises "Access a 7-day snapshot of your feed" and "Limited refresh frequency." The "Premium" plan promises "Analyze all major platforms (5+)," "See 7-day, 30-day, and custom ranges," "Compare bias, tone & sentiment," "Advanced dashboard views," "Unlimited profile refreshes," and "Priority platform-level insights." These features do not exist in the current codebase:

- There is no "7-day snapshot" — scans are point-in-time captures.
- There is no multi-platform analysis in a single session (5+).
- There are no "custom ranges" for time-based filtering.
- "Compare bias" implies partisan bias detection, which the epistemic restraint rules explicitly forbid.
- "Advanced dashboard views" vs "Basic dashboard views" is undefined — free and Plus users see the same six tabs.
- "Unlimited profile refreshes" vs "Limited refresh frequency" has no implementation.
- "Priority platform-level insights" has no implementation.

Charging users for a "Premium" tier that advertises capabilities the product doesn't have is, at minimum, misleading, and potentially a legal liability. Users who upgrade expecting these features will feel deceived.

**Fix:** Rewrite the pricing page to accurately describe what Free and Plus actually offer today. Free: individual scan snapshots with the full six-tab dashboard. Plus: longitudinal trend comparison across scans and the "Talk to Your Algorithm" evidence-grounded conversation feature. Remove all references to features that don't exist.

---

### C4. Fabricated Testimonials in SocialProofSection
**Audit:** Copy
**File:** `src/components/Sections/SocialProofSection.jsx` (lines 107-124)

Three testimonial quotes with attributions like "Beta tester, MIT" and "Early access user" appear fabricated. One testimonial says "The political lean breakdown was genuinely surprising" — but "political lean" analysis is a heuristic keyword match that the product itself treats as low-confidence. Another says "I had no idea my feed was 40% ads. This opened my eyes" — there is no evidence a real user said this.

Fabricated testimonials violate FTC guidelines and directly undermine the trust that AlgorithmLens needs to establish. The component appears to have been removed from `App.jsx` imports, but the component file still exists and could be accidentally re-enabled.

**Fix:** Delete the SocialProofSection component entirely, or replace with real testimonials from actual beta testers when available. Do not re-enable until real quotes exist.

---

## Important Items

Issues that should be fixed soon but don't strictly block a controlled beta if the critical items above are resolved first.

### I1. Epistemic Restraint Violations in User-Facing Copy
**Audit:** Copy
**Severity:** Important — individually minor, but cumulatively they erode the product's distinctive claim

| # | File | Violation | Fix |
|---|------|-----------|-----|
| 1 | `ScanWalkthrough.jsx:44` | "ads targeting you" — banned phrase | → "ads that appeared in your feed" |
| 2 | `DashboardPage.jsx:559` | View ID `manipulative-patterns` — loaded word | → `repetition-patterns` or `feed-patterns` |
| 3 | `ViewCard.jsx:261` | References `manipulative-patterns` view ID | → Update to match renamed ID |
| 4 | `HeroDashboardPreview.jsx:12` | "The algorithm sees stress content — and keeps serving it" — implies intent | → "The feed showed a concentration of stress-related content" |
| 5 | `HeroSection.jsx:68` | "Algorithms shape what you see" — implies deliberate curation | → "Algorithms influence what appears in your feed" |
| 6 | `LabelsPreviewSection.jsx:37` | "what the algorithm has figured out about you" — anthropomorphizes | → "what categories the platform may associate with your activity" |
| 7 | `PricingPage.jsx:132` | "Compare bias, tone & sentiment" — "bias" implies judgment | → "Compare tone, topics & sources" |
| 8 | `DashboardPage.jsx:2561` | SEO meta: "what ads target you, your political lean" | → "what ads appear, political content patterns" |
| 9 | `insightBuilders.js` multiple | "the platform has more control over your attention than you do" | → "suggested posts make up a significant portion of your feed" |
| 10 | `insightBuilders.js` multiple | "outsized influence on what you see and think about" | → "make up a large portion of what appears in your feed" |
| 11 | `insightBuilders.js` multiple | "These sources significantly shape what information reaches you" | → "These sources appear frequently in your feed" |

### I2. Placeholder Code in Production Paths
**Audit:** Code Quality / QA

| # | File | Issue |
|---|------|-------|
| 1 | `DashboardPage.jsx:1902` | Comment: "Premium gating placeholder, wire to real auth later" — if this code path is reachable, free users might access premium features |
| 2 | `submitWaitlistEmail.js:14` | `TODO(beehiiv): Replace localStorage persistence with Beehiiv API submission` — if the waitlist form doesn't actually submit to Beehiiv, the form is broken |
| 3 | `evidence_bundle.py:395-396` | `primary_method = "KEYWORD_MATCH" # Placeholder for Phase 5C1` — evidence attribution is hardcoded |
| 4 | `video_processor.py:835` | `high_relevance_items=0, # Placeholder` — always returns 0 for relevance scoring |

### I3. "Talk to Algorithm" Feature Uses Mock Responses
**Audit:** QA
**File:** `src/components/dashboard/TalkToAlgorithmSection.jsx` (line 571)

The "Ask About This Scan" conversational feature generates responses using hardcoded template strings with `setTimeout` delays to simulate AI responses. These are not actual AI-generated responses based on the user's scan data. The comment says: `// Placeholder responses grounded in observation, not intent`.

Users will assume they're interacting with a real AI analysis of their scan. Presenting canned responses as dynamic analysis is deceptive — and this product is specifically positioned as a transparency tool.

**Fix:** Either connect this to a real backend endpoint that generates responses from scan data, or clearly label responses as "example responses" / "preview — coming soon", or remove the feature entirely until it's real.

### I4. No Privacy Policy or Terms of Service Pages Exist
**Audit:** Security / Legal
**Files:** `src/components/plan/PaywallModal.jsx` (line 286), `src/App.jsx` (footer)

The PaywallModal links to `https://algorithmlens.com/privacy`, and the footer links to Privacy Policy and Terms of Service. But there is no `/privacy` or `/terms` route in the React app and no indication these pages exist on the deployed site.

Before collecting any user data or processing payments, you need both a privacy policy and terms of service. These are legal requirements in most jurisdictions (GDPR, CCPA). The links already exist in the UI but appear to 404.

**Fix:** Create and deploy both pages before beta launch. The privacy policy should accurately describe data handling (including that scans are stored in a database, videos are deleted after processing, and payment data is handled by Stripe).

### I5. Coming Soon Mode is Enabled by Default
**Audit:** QA
**File:** `.env.local` (line: `VITE_COMING_SOON_MODE=true`)

`VITE_COMING_SOON_MODE=true` is set, which blocks access to the scan flow and dashboard for all users, replacing functionality with waitlist signup forms.

If this flag isn't toggled before beta launch, beta users will only see the waitlist page and won't be able to use the product at all.

**Fix:** Ensure the deployment pipeline sets `VITE_COMING_SOON_MODE=false` for the beta environment. Test the full scan flow end-to-end with the flag disabled.

### I6. Database is SQLite — Not Production-Ready for Concurrent Users
**Audit:** QA / Code Quality
**File:** `backend/database.py`

The backend uses SQLite with file-based storage (`scans.db`). SQLite doesn't handle concurrent writes well and isn't suitable for a web application with multiple simultaneous users. Under even modest load (10+ concurrent users), database writes will fail or queue unacceptably. Stripe webhook processing could lose events under write contention.

**Fix:** For a controlled beta with < 20 users this is tolerable short-term. Migrate to PostgreSQL before any broader launch.

### I7. Dev Debug Pages Accessible via ENV Variable Only
**Audit:** Security
**Files:** `src/pages/dev/EntitlementsDebugPage.jsx`, `src/pages/dev/EventsDebugPage.jsx`, `backend/routes/stripe_routes.py`

Debug pages (`/dev/entitlements`, `/dev/events`) and backend diagnostic endpoints (`/dev/stripe/webhook-events`, `/dev/subscription`) are gated only by the `ENV` environment variable. If ENV is misconfigured in production (or left as "dev"), these endpoints expose subscription data, webhook events, and customer details.

**Fix:** Add explicit authentication checks (require admin user) to all dev endpoints. Consider removing them from production builds entirely.

### I8. No Per-User Scan Rate Limit
**Audit:** Security
**File:** `backend/routes/scans.py`

The upload endpoint has a global rate limit (10/minute) but no per-user daily cap. A malicious user could upload hundreds of large videos per day, exhausting Gemini API quota and server disk space.

**Fix:** Add a per-user daily scan cap (e.g., 5 scans/day for free users, 20 for Plus).

### I9. No Refund Handling in Webhook
**Audit:** Billing
**File:** `backend/routes/stripe_routes.py`

The Stripe webhook handler covers checkout, subscription updates, deletion, and payment success/failure, but does not handle `charge.refunded` events. If a refund is issued through the Stripe dashboard, the user's `is_user_plus` status won't automatically update.

**Fix:** Add a `charge.refunded` webhook handler, or document that refunds must be manually processed.

### I10. Trial-Ending Email Not Configured
**Audit:** Billing

The Stripe webhook handler logs `customer.subscription.trial_will_end` events (3 days before expiry) but doesn't send a notification to the user. Users may not realize their trial is ending and could be surprised by a charge or loss of access.

**Fix:** Configure Stripe's built-in trial-ending emails or integrate a transactional email service (SendGrid, etc.).

---

## Minor Items

Polish and optimization items that can be addressed after beta begins.

### M1. Stale Files in Repository
`.fuse_hidden*` FUSE artifacts in `src/pages/` and `src/pages/dashboard/`, `video_processor.py.bak` in backend, `_old_dashboard.html` (97KB) in project root, and `COPY_CHANGES_REVIEW.docx.js` (malformed extension). Delete all and add `.fuse_hidden*` to `.gitignore`.

### M2. Labels Preview Section Shows Psychographic Labels
`LabelsPreviewSection.jsx` shows labels like "High Anxiety," "Validation Seeking," "Impulse Buyer," and "Doomscroller" — psychologically loaded terms the product doesn't actually generate. Replace with labels the product actually outputs (topic categories).

### M3. HeroDashboardPreview Narratives Overstate Capabilities
The carousel narratives describe algorithmic behavior ("The algorithm sees stress content — and keeps serving it") that goes beyond what the product measures. Rewrite to describe observable feed composition.

### M4. Color Contrast Needs WCAG AA Audit
Multiple components use `text-text-muted` on light backgrounds. Without checking exact token values, muted text on near-white backgrounds frequently fails WCAG AA contrast requirements (4.5:1 ratio for normal text).

### M5. ScanWalkthrough localStorage Without Fallback
The onboarding walkthrough reads/writes localStorage without try/catch. In private browsing modes on some browsers, this could throw.

### M6. Emotional Tone Colors Outside Token System
The StackedBar100 chart component hardcodes emotional tone colors outside the design token system. The "negative" tone color (#FCA5A5) feels like a warning rather than a calm data display. Move to `tokens.js`.

### M7. Phase Number Comments in Production Code
Multiple files contain comments like "PHASE 6A:" which are internal development references. Clean these up for code readability.

### M8. Missing `is_trial` Convenience Field in Entitlements API
The entitlements API endpoint doesn't include an `is_trial` boolean. The frontend must calculate this from `trial_end` timestamps. Adding this field simplifies frontend logic.

### M9. `/api/subscribe.js` Naming Ambiguity
This file handles Beehiiv newsletter subscriptions, not Stripe payments. The name could confuse developers working on billing. Rename to `/api/newsletter-subscribe.js`.

### M10. No GDPR Deletion Endpoint
There is no API endpoint for users to request deletion of all their data (right to be forgotten). This is a legal requirement for EU users.

---

## Recommended Action Plan

Prioritized, ordered list of tasks. Critical items first, then important items by impact-to-effort ratio.

| # | Task | Audit | Complexity | Why It Matters |
|---|------|-------|------------|----------------|
| 1 | **Rotate all exposed API keys** (Stripe, Supabase, Gemini) and purge `.env.local` from git history if committed | Security | Simple | Anyone with repo access can impersonate users, make charges, or exhaust API quota |
| 2 | **Remove or verify all credibility claims**: "Built at MIT," "Harvard/Stanford," "Open-source," "No data stored," hardcoded waitlist count | Copy | Simple | False claims destroy trust and violate FTC guidelines. Directly contradicts product thesis |
| 3 | **Rewrite PricingPage.jsx** to describe only features that actually exist today. Remove 5+ platforms, custom ranges, bias comparison, refresh limits | Copy / QA | Moderate | Advertising nonexistent features is legally risky and immediately visible to users |
| 4 | **Delete SocialProofSection.jsx** or remove all fabricated testimonials and hardcoded metrics | Copy | Simple | Fabricated social proof violates FTC guidelines |
| 5 | **Fix all 11 epistemic restraint violations** (see table in I1) | Copy | Moderate | Every violation undermines credibility with governance-aware audience |
| 6 | **Create and deploy Privacy Policy and Terms of Service** | Legal | Moderate | Legal requirement before collecting data or processing payments |
| 7 | **Set `VITE_COMING_SOON_MODE=false`** for beta deployment and test full scan flow | QA | Simple | Product is unusable if still in waitlist mode |
| 8 | **Fix or remove the "Talk to Algorithm" mock responses** — connect to real backend or label as preview | QA | Complex | Canned responses presented as AI analysis is deceptive |
| 9 | **Resolve all placeholder code** in production paths: verify waitlist submits to Beehiiv, check premium gating, fix relevance scoring | Code Quality | Moderate | Placeholders cause silent failures and feature-gating bypasses |
| 10 | **Add authentication to dev/debug endpoints** | Security | Simple | Prevents exposure of subscription and webhook data in production |
| 11 | **Add per-user daily scan cap** | Security | Moderate | Prevents API quota exhaustion and abuse |
| 12 | **Add `charge.refunded` webhook handler** | Billing | Simple | Keeps user status accurate after refunds |
| 13 | **Configure trial-ending notification emails** | Billing | Moderate | Prevents surprise charges and user frustration |
| 14 | **Clean up stale files** (`.fuse_hidden*`, `.bak`, `_old_dashboard.html`, `.docx.js`) | Code Quality | Simple | Reduces confusion and repo bloat |
| 15 | **Rewrite landing page labels and carousel** to match actual product output | UX / Copy | Simple | Sets accurate expectations for new users |
| 16 | **Audit color contrast** for WCAG AA compliance | UX | Moderate | Accessibility requirement and legal best practice |
| 17 | **Add GDPR deletion endpoint** | Legal | Moderate | Required for EU users before public launch |

---

## Audit Detail Summaries

### Copy Audit (Epistemic Restraint)
The dashboard insight copy is a strength — `insightBuilders.js` generates carefully worded, data-grounded headlines following an observation-implication-context pattern. The `headlineSafety.js` module properly excludes low-quality labels from headlines. The `InsightHero` component has strict documentation rules banning vague adjectives, moralizing, and em dashes. However, the landing page, pricing page, and onboarding copy contain trust-damaging claims and epistemic violations that undermine the otherwise excellent dashboard copy. The SocialProofSection (which appears removed from App.jsx but still exists as a file) is the worst offender, followed by PricingPage.jsx which advertises a product that doesn't exist. Total violations: 4 critical, 11 important.

### Billing Audit (Stripe Integration)
The Stripe integration is comprehensive and well-structured. Webhook handling covers all critical lifecycle events (checkout, subscription updates, deletion, payment success/failure). Idempotency is properly implemented via an event deduplication table (`stripe_webhook_events`). Trial logic correctly handles 14-day periods with immediate revocation on trial cancellation. The `past_due` grace period preserves access during Stripe's retry window (B6 fix). The billing portal is accessible to existing subscribers. `pricingConfig.js` serves as a single source of truth for pricing. Gaps: no `charge.refunded` handler, no trial-ending notification, no dunning email integration, and no explicit grace period policy documentation.

### Security Audit
Most critical: exposed API keys in `.env.local`. Beyond that, security posture is reasonable. CORS is restrictive in production (only algorithmlens.com and www.algorithmlens.com). JWT verification uses proper JWKS with algorithm validation (ES256, RS256, HS256). Webhook signatures are verified. Redirect URLs in checkout are validated against an allowlist. User-generated text is sanitized before Gemini API calls (null bytes removed, control characters stripped, truncated to 2000 chars). File uploads validate content type and extension. Security headers are set via `vercel.json` (CSP, HSTS, X-Frame-Options). Dev endpoints lack authentication and are only gated by ENV variable. No GDPR deletion endpoint exists.

### QA Report (Feature Completeness)
The scan flow (upload → processing → results → dashboard) appears functional. All six dashboard tabs render with proper data aggregation. Feature gating exists at both API and UI layers. Error boundaries and loading states are implemented. Coming Soon mode blocks the entire app and must be disabled for beta. The Talk to Algorithm feature uses mock/canned responses. SQLite won't scale beyond a handful of concurrent users. Multiple placeholder comments indicate incomplete implementations. One Playwright smoke test exists; no unit tests for data helpers or API endpoints. PricingPage describes a different product than what exists.

### UX Audit (Design Philosophy)
The dashboard follows progressive disclosure well — headline insights at the top, collapsible detail sections below. The `InsightHero` component delivers the "3-second takeaway." Chart components are clean and use appropriate visualization types. Color palette is calm and informational (blue/green). The landing page, however, sets expectations the product can't meet (psychographic labels, algorithmic intent narratives, fabricated social proof). Empty states are handled with encouraging, non-error copy. Quality gating shows "insufficient data" messages rather than inaccurate charts. Accessibility needs work (color contrast, minimum font sizes, screen reader attributes).

---

## What's Working Well

Despite the critical issues, the audit surfaced genuine strengths:

- **Dashboard insight copy quality.** The `insightBuilders.js` and `headlineSafety.js` modules demonstrate strong epistemic restraint internally.
- **Stripe integration maturity.** Idempotent webhooks, trial logic, past-due handling, and double-layer feature gating are all well-implemented.
- **Authentication architecture.** JWT verification with JWKS, token expiration enforcement, scan ownership checks, and proper CORS configuration.
- **Progressive disclosure UX.** Six-tab dashboard with hero insights, collapsible detail sections, and quality-gated empty states.
- **Error handling.** Frontend ErrorBoundary, backend global exception handler, user-friendly error messages, and structured logging.
- **Demo mode isolation.** Comprehensive demo data with self-validation, analytics disabled, checkout disabled.
- **Design aesthetic.** Calm blue/green palette, generous spacing, subtle animations, and Inter typography create a trustworthy feel.
- **Internal guardrails.** The `dashboardCatalog.js` comment "NOTE: We CANNOT know what the algorithm 'thinks' — only what appeared" shows strong awareness, even where the UI copy doesn't follow through.

---

*This assessment supersedes all prior BETA_READINESS.md versions. It was generated by a comprehensive 5-audit sweep of the entire AlgorithmLens codebase on February 17, 2026.*
