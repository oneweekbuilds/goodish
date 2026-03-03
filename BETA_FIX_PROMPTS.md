# AlgorithmLens Beta Fix Prompts (Consolidated)

**Strategy:** 4 prompts covering tasks 4-23 from BETA_READINESS.md (tasks 1-3 excluded per request).

**Skill trigger note:** Always use `/algorithm-lens:fix-issues` as the skill trigger. Put it on its own line with nothing else — previous errors were caused by text running into the skill name.

**Run order:** Prompt 1 → 2 → 3 → 4 (sequential — later prompts touch files modified by earlier ones)

---

## Prompt 1 of 4 — Verification, Backend Security, Code Quality & Cleanup

**Tasks covered:** #4, #7, #8, #16, #17, #18, #20
**Estimated time:** 30-45 min

```
/algorithm-lens:fix-issues

Read the code-quality, architecture-rules, and pricing-billing skills before starting. This prompt covers 7 tasks across backend security, code quality, and project cleanup. Work through them in order.

--- PART 1: VERIFY FEB 17 CRITICAL ITEMS (BETA_READINESS.md item C6) ---

The Feb 17 BETA_READINESS.md flagged critical blockers. Verify each one is resolved:

CHECK A — Exposed API keys: Run `git log --all --full-history -- .env.local` to check if .env.local was ever committed. Check if .env.local exists and whether it contains live keys (sk_live_*, not just sk_test_*). Check that .gitignore includes .env.local or *.local.

CHECK B — Unverified credibility claims: Search all files in src/ for: "Built at MIT", "Harvard", "Stanford", "Open-source" (in marketing context), "No data stored", "1200" (hardcoded waitlist count). Check SocialProofSection.jsx, HeroSection.jsx, WaitlistSignup.jsx, PricingPage.jsx, and App.jsx.

CHECK C — Fabricated testimonials: Check if `src/components/Sections/SocialProofSection.jsx` still exists and whether it's imported anywhere. Check if it still contains fabricated testimonial quotes.

CHECK D — Pricing page: Read the pricing page component. Check whether it still advertises nonexistent features: "5+ platforms", "custom ranges", "Compare bias", "Advanced dashboard views", "Unlimited profile refreshes", "Priority platform-level insights."

CHECK E — Privacy Policy and Terms of Service: Check if /privacy and /terms routes exist in the React router. Check if corresponding page components exist.

For each check, report RESOLVED or UNRESOLVED with evidence. Save results to VERIFICATION_FEB17_ITEMS.md in the project root.

--- PART 2: RESTRICT CORS TO SPECIFIC EXTENSION ID (BETA_READINESS.md item I2) ---

Find the CORS configuration in the backend. The current regex `^chrome-extension://.*$` allows ANY Chrome extension. Replace it with the specific AlgorithmLens extension ID from `alg-gemini-extension/manifest.json` (look for the `key` field or published ID). If the ID isn't available, use a placeholder with a clear comment: `# TODO: Replace with production extension ID from Chrome Web Store`.

--- PART 3: FIX EMPTY CATCH BLOCKS (BETA_READINESS.md item I7) ---

Search the entire backend directory for empty except/catch blocks (Python: `except:` or `except Exception:` followed by `pass` or nothing). There should be ~3 instances. For each one:
- Add proper error logging: `logger.error(f"Error in [context]: {e}", exc_info=True)`
- Re-raise if it's in a critical path, or return a meaningful error response if it's in an API handler
- Never silently swallow errors

--- PART 4: TIGHTEN CSP (BETA_READINESS.md item I3) ---

Find the Content Security Policy configuration (likely in `vercel.json` or backend middleware). Currently allows `unsafe-inline` and `unsafe-eval`. Tighten where possible:
- If `unsafe-eval` is only needed for Stripe, consider using `https://js.stripe.com` as a specific source instead
- If `unsafe-inline` can be replaced with nonce-based or hash-based CSP for inline scripts, do so
- If tightening would break Stripe, leave it but add a clear comment: `# unsafe-inline required for Stripe.js integration`

--- PART 5: REMOVE CONSOLE.LOG/WARN FROM PRODUCTION (BETA_READINESS.md item M3) ---

Search the entire codebase (frontend src/, mobile/, backend/) for `console.log`, `console.warn`, `console.error`, and `console.info` statements:
- Debug logging that shouldn't be in production: remove it
- Error logging that should stay: replace with proper logger (Python: `logger.error()`, JS: gate behind `import.meta.env.DEV`)
- Do NOT remove console.error in catch blocks doing legitimate error reporting
Report count: X removed, Y converted to proper logging, Z kept with justification.

--- PART 6: CENTRALIZE STRIPE INITIALIZATION (BETA_READINESS.md item M5) ---

Find all locations where the Stripe API key is initialized (`stripe.Stripe(...)` in Python or `loadStripe(...)` in JS). Consolidate into a single module that exports the initialized Stripe instance. Other files should import from this central module.

--- PART 7: FILE CLEANUP (BETA_READINESS.md item M9) ---

1. Delete ALL `vite.config.js.timestamp-*.mjs` files from both `AlgorithmLens_Cowork/` and `alg-gemini-extension/`.
2. Add `vite.config.js.timestamp-*.mjs` to `.gitignore` in both directories. Check if the pattern already exists before adding.
3. Clean up stale files: `.fuse_hidden*` files in `src/pages/`, `video_processor.py.bak` in backend/, `COPY_CHANGES_REVIEW.docx.js`. Add `.fuse_hidden*` to .gitignore.

--- FINAL VERIFICATION ---

Run a grep for `console.log` in production code paths (excluding node_modules, test files, dist/) and confirm count is 0 or justify remaining instances. Confirm no empty catch blocks remain in backend/. Report total: files modified, files deleted, gitignore rules added, and RESOLVED/UNRESOLVED status for each Feb 17 item.
```

---

## Prompt 2 of 4 — Mobile App + Billing

**Tasks covered:** #5, #6, #9, #12, #13
**Estimated time:** 30-60 min

```
/algorithm-lens:fix-issues

Read the ui-ux-philosophy, architecture-rules, and pricing-billing skills before starting. This prompt covers 5 tasks across the mobile app and billing system. The mobile app is in the `mobile/` directory.

--- PART 1: SCOPE MOBILE BETA TO iOS-ONLY (BETA_READINESS.md item C4) ---

Android screen recording is not implemented. Add clear documentation and UI gating:
1. In the mobile app's scan/recording screen, add a platform check. If Android, show a friendly message: "Screen recording is coming to Android soon. The iOS version is available now." Do NOT show a broken recording button.
2. Create a file `mobile/BETA_SCOPE.md` documenting that the mobile beta is iOS-only, with the reason (Android MediaProjection API not yet implemented).
3. Make sure any "Start Scan" or "Record" buttons are disabled or hidden on Android.

--- PART 2: FIX MOBILE APP VIEWPORT RENDERING (BETA_READINESS.md item C5) ---

The mobile app renders at desktop width (1440px+). Find the root layout component(s) and fix:
1. Ensure the app uses `<meta name="viewport" content="width=device-width, initial-scale=1">` or the React Native equivalent.
2. Check that the root container constrains to device width, not a hardcoded desktop width.
3. If using WebView for dashboard rendering, ensure the WebView also has proper viewport settings.
4. Test that the layout doesn't overflow horizontally on a 375px-wide viewport.

--- PART 3: FIX TAB NAVIGATION ON MOBILE VIEWPORTS (BETA_READINESS.md item I6) ---

Find the dashboard tab navigation component (likely shared between web and mobile). On narrow viewports (<768px), the six tabs should either:
- Scroll horizontally with the active tab visible, OR
- Use a compact layout (icons-only or a dropdown selector)
Do NOT hide tabs or break the six-tab structure. Follow the existing CSS framework patterns.

--- PART 4: ADD BILLING PORTAL BUTTON TO MOBILE SETTINGS (BETA_READINESS.md item I9) ---

In `mobile/app/(tabs)/settings.tsx`, add a "Manage Subscription" button that opens the Stripe billing portal. The backend already supports this — check the existing web implementation for the API endpoint pattern. The button should:
- Only be visible to Plus subscribers (check entitlements/subscription status)
- Open the billing portal URL in the device's default browser
- Follow the existing button styling in the settings screen

--- PART 5: CONFIGURE TRIAL-END EMAIL NOTIFICATIONS (BETA_READINESS.md item I8) ---

The Stripe webhook handler captures `customer.subscription.trial_will_end` events but doesn't notify users.

1. In the webhook handler for `customer.subscription.trial_will_end`, add a structured log entry recording: customer ID, subscription ID, trial end date, and a note that Stripe's built-in email should have fired.
2. Create `docs/TRIAL_EMAIL_SETUP.md` with step-by-step Stripe Dashboard configuration instructions for enabling the "Trial ending" email (Settings → Emails → enable "Trial ending"), how to customize the template, and how to verify emails are sending via Stripe Dashboard → Logs → Events.
3. If the codebase already has a transactional email integration (SendGrid, Resend, etc.), wire up a custom trial-ending email with AlgorithmLens branding. If no email service exists, note this as a future enhancement.

--- FINAL VERIFICATION ---

List every file modified with a one-line summary of the change. Confirm no architecture boundary violations (mobile app should not process data or communicate directly with the Chrome extension). Confirm the webhook handler logs trial-end events. Confirm TRIAL_EMAIL_SETUP.md and BETA_SCOPE.md exist and are accurate.
```

---

## Prompt 3 of 4 — Dashboard UX + Refactoring

**Tasks covered:** #10, #11, #19, #21, #22
**Estimated time:** 45-75 min

```
/algorithm-lens:fix-issues

Read the ui-ux-philosophy, code-quality, and architecture-rules skills before starting. This prompt covers dashboard UX improvements and refactoring large files.

--- PART 1: ADD HEADLINE INSIGHTS TO ALL DASHBOARD TABS (BETA_READINESS.md item I4) ---

The design philosophy requires every tab to lead with a bold headline insight — "one main takeaway a user can absorb in under three seconds." Check each of the six dashboard tabs (Overview, Sources, Ads, Politics, Tone, Suggested vs. Followed) and verify they have a prominent headline metric at the top. For any tab missing one:
- Add a headline component using the existing InsightHero or similar pattern from the Overview tab
- The headline should display the single most important metric in large bold text
- Example formats: "62% of your feed was content you didn't choose to follow" or "Your top 3 sources accounted for 45% of all posts"
- Use data already available in the tab's data model — do NOT add new API calls
- Follow epistemic restraint: describe what appeared, never infer why

--- PART 2: WARM UP EMPTY STATE COPY (BETA_READINESS.md item I5) ---

Search all dashboard components for empty state messages. Look for patterns like "No data", "We need", "Error:", "N/A", or conditional renders when data is missing. Replace clinical language with warm, encouraging copy:
- BAD: "We need more data to show trends" → GOOD: "You'll see trends here after your second scan. Each snapshot adds to your personal feed history."
- BAD: "No scans available" → GOOD: "Your first scan will appear here — it only takes a minute."
- BAD: "Error: No trend data available" → GOOD: "Trends unlock after your second scan. Try scanning again in a few days to see how your feed changes."
Keep the tone calm, helpful, and encouraging — like the Oura Ring app.

--- PART 3: FIX HOVER STATE CONTRAST RATIOS (BETA_READINESS.md item M2) ---

Check all interactive elements (buttons, tabs, links, chart elements) for hover state color contrast. WCAG AA requires 4.5:1 for normal text, 3:1 for large text. Focus on:
- Dashboard tab hover states
- Chart tooltip text
- Button hover backgrounds
- Any `text-text-muted` on light backgrounds
For any failing contrast ratios, darken the text or lighten the background to meet 4.5:1. Stay within the existing calm blue/green color palette.

--- PART 4: MOVE TONE COLORS INTO TOKEN SYSTEM (BETA_READINESS.md item M10) ---

Find the StackedBar100 chart component (or wherever emotional tone colors are defined). Currently, tone colors like "negative" (#FCA5A5) are hardcoded outside the design token system. Move all tone colors into `DESIGN_TOKENS.json` or `tokens.js` (wherever the project's design tokens live). The "negative" tone color should feel calm and informational, not like a warning — consider using a muted purple or soft gray-blue instead of #FCA5A5.

--- PART 5: REFACTOR LARGE MONOLITHIC FILES (BETA_READINESS.md item M4/task 22) ---

TARGET A: `TrendsPanel.jsx` (756 lines)
- Read the file and identify logical sections (data processing, chart rendering, UI state management)
- Split into focused sub-components. Likely splits:
  - `TrendsPanel.jsx` — main container/layout (should be <200 lines)
  - `TrendsChart.jsx` — chart rendering logic
  - `TrendsDataHelpers.js` — data transformation and aggregation functions
  - `TrendsSummary.jsx` — summary metrics display
- Maintain all existing imports and exports so nothing breaks upstream
- Preserve the exact same rendered output — this is a refactor, not a redesign

TARGET B: `desktop_mapper.js` (97KB)
- Read it and identify distinct responsibilities
- Split into focused modules based on platform or processing stage
- Each resulting file should be under 300 lines and focused on one responsibility
- Export a unified API from an index file so existing imports don't break

REFACTOR RULES:
- Do NOT change any behavior — same inputs must produce same outputs
- Do NOT rename any exported functions or components
- Do NOT change any CSS class names or DOM structure
- If a file is risky to split (too many cross-references), document why and skip it rather than introducing bugs
- Create a REFACTOR_LOG.md documenting what was split and why

--- FINAL VERIFICATION ---

List every empty state message changed with before/after text. Confirm each dashboard tab has a visible headline insight. List every new file created by the refactor with line counts. Check that all imports still resolve after refactoring. If the project has any tests, run them and confirm they pass.
```

---

## Prompt 4 of 4 — Test Coverage

**Tasks covered:** #23
**Estimated time:** 60-90 min

```
/algorithm-lens:fix-issues

Read the qa-process and code-quality skills before starting. Current test coverage is estimated at <15%. Write comprehensive tests for the most critical paths.

PRIORITY 1 — Backend API endpoints (highest priority):
- Test the scan upload endpoint: valid upload, invalid file type, missing auth, rate limiting
- Test the entitlements endpoint: free user response, Plus user response, expired trial
- Test the Stripe webhook handler: valid signature, invalid signature, duplicate event (idempotency), each event type (checkout.session.completed, subscription.updated, subscription.deleted, payment_succeeded, payment_failed)
- Use the existing test framework (check for pytest, jest, or similar in package.json/requirements.txt)

PRIORITY 2 — Data processing helpers (high priority):
- Test `insightBuilders.js`: verify output for known input data, verify hedging language is present, verify banned words are absent
- Test `headlineSafety.js`: verify it correctly filters low-quality labels
- Test any data transformation functions used by the six dashboard tabs

PRIORITY 3 — Feature gating logic (high priority):
- Test that free users cannot access Plus-only API endpoints (expect 403)
- Test that `is_user_plus` flag correctly gates features at the API layer
- Test trial expiration logic

PRIORITY 4 — Chrome extension data capture (medium priority):
- Test the content scripts produce correctly structured snapshot data
- Test platform detection (TikTok, Instagram, YouTube, X, Reddit, LinkedIn, Facebook)
- Test error handling when capture fails

PRIORITY 5 — Frontend components (lower priority — only if time allows):
- Test that dashboard tabs render without crashing given valid data
- Test empty state rendering when data is missing
- Test that the billing portal button only appears for Plus users

RULES:
- Use the test framework already in the project — do NOT introduce a new one
- Each test file should mirror the source file structure (e.g., `tests/test_scan_routes.py` for `backend/routes/scans.py`)
- Tests must be runnable with a single command (document the command)
- Include both positive and negative test cases
- Mock external services (Stripe, Gemini API, Supabase) — never call real APIs in tests

VERIFICATION: Run the full test suite and report: X tests written, Y passing, Z failing. For any failing tests, fix the test (not the source code) unless the failure reveals an actual bug. Report final coverage percentage if a coverage tool is available.
```

---

## Execution Order

```
Prompt 1 (Backend + Verification + Cleanup)  — run first, no dependencies
Prompt 2 (Mobile + Billing)                  — run second, no file overlap with Prompt 1
Prompt 3 (Dashboard UX + Refactor)           — run third, benefits from Prompt 1's cleanup
Prompt 4 (Tests)                             — run last, tests should cover all fixed code
```

Prompts 1 and 2 can run in parallel if using separate Cowork sessions (they touch completely different directories). Prompts 3 and 4 should run sequentially after 1-2 are complete.
