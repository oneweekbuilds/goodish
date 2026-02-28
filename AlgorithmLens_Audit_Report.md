# AlgorithmLens Website Audit Report

**Date:** February 23, 2026
**Environment:** localhost:5173 (Vite dev server, demo mode via `?demo=1`)
**Scope:** Full visual and functional audit of all pages and dashboard tabs

---

## Critical Bug Found (and Fixed)

### `require()` crash in `useDashboardInitialization.js`

The dashboard was completely broken on load due to a `ReferenceError: require is not defined` at line 24 of `useDashboardInitialization.js`. The file used CommonJS `require()` inside a Vite ESM project. The error boundary caught it and showed a generic "Something went wrong" page, making the entire dashboard inaccessible.

**Fix applied:** Replaced the `require()` call with an ES module import at the top of the file. `getCurrentPlanTier` was already exported from `../../lib/plan` but wasn't being imported.

**Status:** Fixed. Dashboard now loads correctly.

---

## Bugs & Issues

### 1. Text Duplication Bug in Overview Tab (High Priority)

**Location:** Overview tab > "What you can do with this" section, suggestion #2

**What it says:** "10% of your your feed feed appears promotional but isn't labeled as an ad."

**Root cause:** In `OverviewTab.jsx` line 332-334, when the user has scans from multiple platforms, `platformName` is set to `'your feed'`. This is then interpolated into strings like `"your ${platformName} feed"`, which produces `"your your feed feed"`.

**File:** `src/pages/dashboard/tabs/OverviewTab.jsx`, lines 332-334 and 360

**Suggested fix:** Change the multi-platform fallback from `'your feed'` to just `'feed'`, or restructure the template strings to handle the multi-platform case separately.

### 2. "Suggested vs. Fol" Tab Label Truncated (Medium Priority)

The sixth tab label "Suggested vs. Followed" is cut off to "Suggested vs. Fol" because the tab bar doesn't have enough horizontal space. On narrower viewports this would be worse.

**Suggested fix:** Consider shortening to "Suggested vs. Followed" with text wrapping, or abbreviate to "Suggested vs. Organic" or just "Suggestions" for the tab label.

### 3. Debug Elements Visible in Demo Mode (Low Priority)

The following dev/test elements are visible at the bottom of each dashboard tab when using `?demo=1`:

- Yellow banner: "Demo Mode: Plan UI Preview (only visible with ?demo=1) / Current plan tier: free"
- "Open Paywall Modal (test)" clickable link

**File:** `src/pages/dashboard/DemoPreview.jsx`

**Assessment:** These are intentionally gated behind `?demo=1` so they won't show in production. However, if demo mode is ever used for demos to stakeholders or investors, these debug elements would look unprofessional. Consider adding a separate `?debug=1` flag for these.

### 4. History Page Error Without Backend (Expected)

The History page shows "Unable to Load History" when the backend isn't running. This is expected behavior since it needs the API, but the error message could be more helpful in demo mode, perhaps showing sample history data like the dashboard does.

---

## What Works Well

### Homepage
- Clean, professional hero section with strong headline ("See how the algorithms see you")
- Good subheading copy that explains the value proposition clearly
- Phone mockup showing feed categorization is effective
- User persona section (Jordan M.) with realistic data makes the product tangible
- Category tags ("Finance-focused", "Price-conscious shopper") are a compelling illustration
- "The Feedback Loop" section clearly explains the concept
- "Your data stays yours" privacy section builds trust
- CTA at the bottom is clear and well-placed
- Footer has appropriate links (Privacy Policy, Terms of Service)
- "Built at MIT" credibility badge is well-placed

### Dashboard (Demo Mode)
- All 6 tabs load and display data correctly
- Key takeaway cards are well-written with clear, specific insights
- "Based on 160 posts across 2 platforms" attribution is good epistemic practice
- Stacked bar charts (commercial composition, emotional tone) are clean and readable
- Top creators table is well-formatted with rank, handle, share %, and post count
- Platform filter (Instagram pill) works correctly
- "Upgrade to Premium" upsells are tasteful and non-intrusive
- "There's more to this data" premium cards explain what Plus adds
- "Ask your feed" feature teaser with lock icon is a nice touch
- Collapsible sections ("Feed summary", "AI-made content analysis") keep the page manageable
- Date range selector and scan count are clearly visible

### Tab-by-Tab Assessment

| Tab | Status | Notes |
|-----|--------|-------|
| Overview | Good (with text bug) | Strong key takeaway, good summary cards, actionable suggestions |
| Who Shapes Your Feed | Good | Clear concentration metrics, top 5 table, "63% from your top 5 sources" |
| Ads & Promotions | Good | Clean commercial composition bar, labeled vs unlabeled distinction |
| Political Exposure | Good | 17% political content with typical range context (8-20%), top source shown |
| Emotional Tone | Good | Balanced 34/33/33 split, top sources by positive/negative volume tables |
| Suggested vs. Followed | Good | 55/45 split visualization, per-platform breakdown, "Are these new voices?" section |

### Other Pages
- **Scan page:** Clean platform selection grid with 7 platforms, nice color-coded cards
- **Plus page:** Clear Free vs. Plus comparison, pricing ($10/month, $96/year), 14-day trial
- **Settings page:** Clean account info display, AI Analysis toggle, upgrade CTA
- **Navigation:** Consistent across all pages, active state clearly highlighted

---

## Epistemic Restraint Compliance

The dashboard copy largely follows the epistemic restraint standards from CLAUDE.md:

- Uses hedging language: "This is above the typical range of 40-60%"
- Describes observable patterns: "63% of your feed comes from just 5 accounts"
- Provides context without over-claiming: "This falls within the typical range (8-20%)"
- Bottom disclaimer: "These insights show patterns in what you're shown, not who you are"
- No anthropomorphization of the algorithm detected

**One borderline instance:** The homepage says "The algorithm reshapes your feed to maximize engagement." This is acceptable per the CLAUDE.md rules (marketing copy can state that algorithms optimize for engagement), but worth noting.

---

## Recommendations Summary

| Priority | Issue | Action |
|----------|-------|--------|
| Fixed | `require()` crash in dashboard | Already fixed in this session |
| High | "your your feed feed" text duplication | Fix `platformName` fallback logic |
| Medium | Tab label truncation | Shorten label or improve tab responsiveness |
| Low | Debug elements in demo mode | Consider separate `?debug=1` flag |
| Low | History page in demo mode | Consider showing demo history data |
| Suggestion | Plus page hero section | Large empty space at top before "Free vs. Plus" - consider tightening |
