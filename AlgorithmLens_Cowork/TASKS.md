# Tasks

## Active

- [ ] **Verify secrets never committed to git** - Open a terminal in the *original* AlgorithmLens project folder (not the Cowork copy) and run: `git log --all --full-history -- .env.local`. If any results appear, rotate every credential in `.env.local` immediately (Stripe, Supabase JWT secret, Google API key). See COWORK_AUDIT_REPORT.md section 5.1 for details.

- [ ] **Configure Stripe Customer Portal in Stripe Dashboard** - Go to Stripe Dashboard → Settings → Billing → Customer Portal. Enable the features you want customers to access: cancellation, plan changes, invoice history, payment method updates. The backend code is ready — this is a Stripe dashboard configuration step.

- [ ] **Copy finished code changes back to original project** - The Cowork copy has all code changes from recommendations 1-8. These need to be merged back into the original project folder that Cursor uses for git/deployment. Consider using a diff tool or copying the modified files manually. Key files changed: `backend/app.py`, `src/lib/plan/PaywallProvider.jsx`, `src/pages/plus/PlusPage.jsx`, `src/components/plan/PaywallModal.jsx`, `src/lib/dashboard/insightBuilders.js`, `src/pages/dashboard/dashboardCatalog.js`, `src/pages/dashboard/DashboardPage.jsx`, and all six tab files in `src/pages/dashboard/tabs/`.

## Waiting On

- [ ] **Suggested vs Followed data pipeline** - since Feb 13, 2026. Needs Chrome extension work to capture whether each post is "suggested" or "followed." Frontend is already built. See `SPEC_SUGGESTED_VS_FOLLOWED_PIPELINE.md` for the full specification. Start with TikTok (simplest platform).

- [ ] **Database migration planning** - since Feb 13, 2026. Not urgent — SQLite is fine for now. When concurrent users become a concern, migrate to PostgreSQL. See `PLAN_DATABASE_SCALING.md` for the full plan and checklist.

## Someday

## Done

- [x] ~~Full codebase audit~~ (Feb 13, 2026) — See `COWORK_AUDIT_REPORT.md`
- [x] ~~Add Stripe Customer Portal endpoint and UI~~ (Feb 13, 2026) — Recommendation 1
- [x] ~~Fix all epistemic restraint copy violations~~ (Feb 13, 2026) — Recommendation 2, 28 string changes across 9 files
- [x] ~~Add invoice.payment_failed webhook handler~~ (Feb 13, 2026) — Recommendation 4
- [x] ~~Invert dev endpoint access logic~~ (Feb 13, 2026) — Recommendation 5
- [x] ~~Validate Stripe redirect URLs server-side~~ (Feb 13, 2026) — Recommendation 6
- [x] ~~Audit all whyCare strings~~ (Feb 13, 2026) — Recommendation 7, done as part of rec 2
- [x] ~~Replace "outrage" label across codebase~~ (Feb 13, 2026) — Recommendation 8, done as part of rec 2
