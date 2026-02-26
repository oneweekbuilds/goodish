# AlgorithmLens — Next Round of Changes

**Important context**: I do not know how to read or write code. Explain everything in plain language. Never make changes to any files without explicitly asking me first and getting my approval. Read the CLAUDE.md files in both the root `AlgorithmLens_ParentFolder/` and `AlgorithmLens_Cowork/` folders before starting.

The project is a React/Vite app at `AlgorithmLens_Cowork/`. Run `npm run dev` from that folder to start the dev server if it's not already running at localhost:5173.

---

## Phase 0: Pre-flight — Understand the Current State

Before making ANY changes:

1. **Start the dev server** if not already running (`npm run dev` in `AlgorithmLens_Cowork/`). Confirm localhost:5173 loads.
2. **Screenshot the homepage** (localhost:5173) — scroll through the entire page top to bottom, taking screenshots at each scroll position. Pay close attention to the hero headline, subtitle, color scheme, card styles, spacing, and overall visual tone.
3. **Screenshot the Settings page** (localhost:5173/settings) — capture the full page. Note every section currently visible.
4. **Screenshot the Plus page** (localhost:5173/plus) — scroll through the entire page top to bottom, taking screenshots at each scroll position. Pay close attention to the charts, card styles, colors, CTA buttons, and how the overall styling compares to the homepage.
5. **Read all files you'll be editing** before touching anything: `src/components/Hero/HeroSection.jsx`, `src/pages/SettingsPage.jsx`, `src/pages/plus/PlusPage.jsx`. Understand the full structure of each file.
6. **Check the browser console** on all three pages — note any existing warnings/errors so you don't confuse them with new ones later.

Only proceed to Change 1 after completing all of the above.

---

## Change 1: Homepage Hero — Headline Line Break + New Subtitle

**File:** `src/components/Hero/HeroSection.jsx`

### 1A: Headline fix
The current headline reads: "See how the algorithms see you." and naturally wraps in the browser so "algorithms" stays on the first line. I want a forced line break so it displays as:

Line 1: `See how the`
Line 2: `algorithms see you.`

Add a `<br />` tag after "the " to force "algorithms see you." onto the second line. Keep the existing color coding — "See how the" is dark text (`text-text-main`), "algorithms" is blue (`text-primary-blue`), "see you." is green (`text-accent-green`).

### 1B: Subtitle rewrite
The current subtitle says: "Scan your feed. See exactly what's ads, what's suggested, and what's from accounts you actually follow."

Replace it with something that more directly hits on the idea that **algorithms are trying to keep you engaged** — they figure out what content, emotions, and topics will keep you hooked, and AlgorithmLens shows you how. The subtitle should convey: the algorithm studies your behavior to determine what keeps you scrolling, and AlgorithmLens reveals that process.

Don't use those exact words — write something concise, punchy, and natural that fits the tone of the rest of the site. Keep it to 1-2 sentences max.

### Verification checkpoint 1:
- [ ] Open localhost:5173 in browser and take a screenshot
- [ ] Confirm "See how the" is on line 1 and "algorithms see you." is on line 2 at desktop width (1440px)
- [ ] Resize the browser to mobile width (~375px) and take a screenshot — confirm the headline still looks good and doesn't break awkwardly
- [ ] Read the subtitle out loud — does it sound natural and punchy? Does it clearly convey "algorithms study your behavior to keep you hooked"?
- [ ] Check browser console — no new warnings or errors
- [ ] If ANYTHING looks wrong, fix it before moving to Change 2. Do not proceed with issues.

---

## Change 2: Settings — Remove Scan Preferences Section

**File:** `src/pages/SettingsPage.jsx`

Remove the entire "Scan Preferences" section (the card with the header "Scan Preferences / Configure your default scan settings" and the "Auto-save scan results" toggle). Auto-save should always be on — it should not be a user-facing option.

This means:
- Remove the `Scan` icon import if it's only used for that section
- Remove the `STORAGE_KEYS.scanPrefs` constant and related `loadPreferences`/`savePreferences` functions if they're only used here
- Remove the `preferences`/`setPreferences` state and `updatePreference` callback
- Remove the entire `<SettingsSection icon={Scan} ...>` block
- Keep everything else (Account, AI Analysis, Plan Management sections)
- **IMPORTANT**: After removing code, grep the entire codebase for any references to the removed functions/state/constants to make sure nothing else depends on them. If something does, handle it (e.g., hardcode auto-save to true wherever it was read).

### Verification checkpoint 2:
- [ ] Open localhost:5173/settings in browser and take a screenshot
- [ ] Confirm the Scan Preferences card is completely gone
- [ ] Confirm the remaining sections are: Account → AI Analysis → Plan Management → footer links (no gaps, no broken layout)
- [ ] Click through remaining settings — toggle AI Analysis on/off, confirm it still works
- [ ] Run `grep -r "scanPrefs\|scanPref\|SCAN_PREF\|preferences\.autoSave\|loadPreferences\|savePreferences" src/` to confirm no orphaned references remain
- [ ] Check browser console — no new warnings or errors
- [ ] If ANYTHING looks wrong or any orphaned references exist, fix them before moving to Change 3.

---

## Change 3: Plus Page — Simplify Charts, Match Homepage Styling, Optimize for Conversion

**File:** `src/pages/plus/PlusPage.jsx` (and any sub-components it imports)

**Before starting this change**: Re-screenshot the homepage (localhost:5173) for direct comparison. Keep it as your reference throughout.

### 3A: Simplify the charts
The "EXAMPLE INSIGHTS FROM PLUS" section currently has two charts:
1. "Ad content in your feed over 8 weeks" — a vertical bar chart showing week-by-week data
2. "Source diversity over time" — a horizontal bar chart showing scan-by-scan data

These charts take too long to read and interpret. Simplify them so a user understands the point in a 1-second glance. Ideas:
- Use bigger, bolder numbers with clear before/after comparisons instead of multi-bar charts
- Consider simple visual metaphors (e.g., a single big number with an arrow showing the trend direction)
- Each insight should communicate ONE clear takeaway instantly — "Ads doubled from 18% to 38%" should be the immediate visual, not something you have to read from a bar chart
- Keep the "Plus insight" badges and the text insights below each chart

### Verification checkpoint 3A:
- [ ] Take a screenshot of the new chart designs
- [ ] Ask yourself: Can I understand the insight in literally 1 second without reading any small text? If no, simplify further.
- [ ] Check at mobile width too — do the simplified charts still work on small screens?
- [ ] Check browser console — no new warnings

### 3B: Match homepage coloring and formatting exactly
Compare the Plus page styling to the homepage (localhost:5173). They should feel like the same site but currently have subtle differences. Specifically compare:
- Background colors/gradients — take screenshots of both pages and compare
- Card border styles and shadows
- Text color tokens (should all use `text-text-main`, `text-text-muted`, `text-primary-blue`, `text-accent-green` — not hardcoded hex colors or Tailwind defaults like `text-gray-500`)
- Button styles (gradient, padding, border-radius, hover states)
- Section spacing and padding
- Font weights and sizes for headings
Make the Plus page visually identical in feel to the homepage.

### Verification checkpoint 3B:
- [ ] Take a screenshot of the Plus page hero area
- [ ] Take a screenshot of the homepage hero area
- [ ] Compare them side by side — do the background gradients, text colors, and spacing feel identical?
- [ ] Scroll through the full Plus page and take screenshots of every section
- [ ] Grep PlusPage.jsx for any hardcoded colors (hex values like `#`, Tailwind defaults like `text-gray-`, `bg-slate-`, `text-blue-`, `border-gray-`) that should be design tokens instead. Fix any you find.
- [ ] Check browser console — no new warnings

### 3C: General conversion rate optimization sweep
Do web research on SaaS free-to-paid conversion rate best practices and apply them to the Plus page. Consider:
- Is the value proposition immediately clear above the fold?
- Is there enough social proof? (the homepage has "Built at MIT" — does the Plus page use it prominently?)
- Are CTAs prominent and repeated at the right intervals?
- Is the pricing section optimized (anchoring, default selection, visual hierarchy)?
- Is there unnecessary friction or cognitive load?
- Does the page effectively create urgency or reduce risk perception? (14-day free trial messaging)
- Are the FAQ answers actually addressing common objections?

Implement what you find, but keep changes tasteful and aligned with the site's clean, minimal aesthetic. Don't add cheesy marketing tactics.

### Verification checkpoint 3C:
- [ ] Take a full-page screenshot scroll of the final Plus page (top to bottom)
- [ ] Count the number of CTA buttons visible as you scroll — there should be at least 2-3 at natural decision points
- [ ] Confirm "Built at MIT" social proof appears on the Plus page
- [ ] Confirm the "Start 14-day free trial" messaging is prominent and appears multiple times
- [ ] Check mobile width — does the page convert well on mobile too?
- [ ] Check browser console — no new warnings

---

## Phase 4: Final Cross-Page Verification

After ALL changes are complete, do a thorough final check:

### Homepage final check:
- [ ] Navigate to localhost:5173
- [ ] Take a screenshot at desktop width (1440px)
- [ ] Take a screenshot at mobile width (~375px)
- [ ] Scroll through entire page — all sections render correctly, no visual glitches
- [ ] Confirm headline: "See how the" on line 1, "algorithms see you." on line 2
- [ ] Check browser console — zero new warnings/errors

### Settings final check:
- [ ] Navigate to localhost:5173/settings
- [ ] Take a screenshot at desktop width
- [ ] Take a screenshot at mobile width
- [ ] Confirm Scan Preferences section is gone
- [ ] Toggle AI Analysis — still works
- [ ] Check browser console — zero new warnings/errors

### Plus page final check:
- [ ] Navigate to localhost:5173/plus
- [ ] Take full-page screenshots at desktop width (scroll top to bottom)
- [ ] Take full-page screenshots at mobile width (scroll top to bottom)
- [ ] Confirm charts communicate their insight at a glance
- [ ] Confirm styling matches homepage look and feel (compare screenshots)
- [ ] Click "Start 14-day free trial" button — confirm it opens the paywall modal (don't complete checkout)
- [ ] Check browser console — zero new warnings/errors

### Cross-page consistency:
- [ ] Compare homepage and Plus page screenshots side by side one more time
- [ ] Confirm background colors, text colors, card styles, and button styles are consistent
- [ ] Run `grep -rn "text-gray-\|text-slate-\|bg-gray-\|bg-slate-\|#[0-9a-fA-F]\{3,6\}" src/pages/plus/PlusPage.jsx` to catch any remaining hardcoded colors

### Code hygiene:
- [ ] Run `grep -rn "console\.\(log\|warn\|error\|debug\)" src/components/Hero/HeroSection.jsx src/pages/SettingsPage.jsx src/pages/plus/PlusPage.jsx` — remove any debug logging you added
- [ ] Check the browser console one final time on each page

**If any check fails, fix the issue and re-run that entire verification checkpoint before reporting completion.**

---

## General Rules
- Follow the epistemic restraint standards in CLAUDE.md — marketing copy CAN say algorithms optimize for engagement, but avoid specific unverifiable claims about individual platform mechanics
- Use existing Tailwind CSS design tokens (text-text-main, text-text-muted, text-primary-blue, bg-bg-page, etc.) — never hardcode colors
- Keep the console clean — no new warnings
- Test at both desktop (1440px) and mobile widths (~375px)
- If you break something, fix it immediately before moving on — never leave broken state
- When in doubt, take a screenshot and compare visually
