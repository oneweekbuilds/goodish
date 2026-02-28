# AlgorithmLens Site Changes — Cowork Prompts Plan

Each prompt below is a self-contained Cowork task. They are ordered by dependency (foundational changes first, page-specific changes later). Run them sequentially.

---

## Prompt 1: Remove All Email Address References Site-Wide

**Goal:** Remove all fake email addresses (`support@algorithmlens.com`, `legal@algorithmlens.com`) from the entire codebase. These are not real addresses and should not be shown to users.

**Files to modify:**
- `AlgorithmLens_Cowork/src/App.jsx` — Footer has `mailto:support@algorithmlens.com` as the "Contact" link (line 283). Remove the entire Support column from the footer nav, or replace the mailto link with a link to a contact form page if one exists. If no contact form exists, just remove the Support section entirely.
- `AlgorithmLens_Cowork/src/pages/SettingsPage.jsx` — Has references to `legal@algorithmlens.com` and `support@algorithmlens.com` in the about/legal footer section at the bottom. Remove all email links. Keep the Privacy Policy and Terms of Service links but remove the "Contact" mailto link.
- `AlgorithmLens_Cowork/src/pages/PrivacyPage.jsx` — Contains `support@algorithmlens.com` and/or `legal@algorithmlens.com` as contact addresses. Remove all email address references. Where the privacy policy says "contact us at [email]", replace with generic language like "Contact us through the AlgorithmLens website."
- `AlgorithmLens_Cowork/src/pages/TermsPage.jsx` — Same as privacy page: remove all email addresses and replace with generic "contact us through the AlgorithmLens website" language.
- `AlgorithmLens_Cowork/src/pages/ScanPlatformPage.jsx` — May reference support email. Search and remove.

**Search the entire `AlgorithmLens_Cowork/src/` directory for any other occurrences of `@algorithmlens.com` and remove them all.**

**Verification:** After changes, grep the entire `src/` folder for `@algorithmlens.com` and confirm zero results. Visit `/settings`, `/privacy`, `/terms`, and the site footer in the browser to confirm no email addresses appear.

---

## Prompt 2: Standardize All MIT References to "Built at MIT"

**Goal:** Every MIT reference across the entire site should simply say "Built at MIT." Remove all variations like "Built by an MIT student", "Developed with support from MIT Sandbox Innovation Fund", "MIT Sandbox" etc.

**Files to modify:**
- `AlgorithmLens_Cowork/src/App.jsx`:
  - Line 259: Change `"Understand what appears in your social media feed. Built by an MIT student."` → `"Understand what appears in your social media feed. Built at MIT."`
  - Line 294: Change `"Developed with support from MIT Sandbox Innovation Fund."` → `"Built at MIT."`
- `AlgorithmLens_Cowork/src/pages/plus/PlusPage.jsx`: Find the social proof badge that says "Built by an MIT student" (around line 228) and change to "Built at MIT"
- `AlgorithmLens_Cowork/src/components/WaitlistSignup.jsx`: Find "Built by an MIT student" and MIT Sandbox Fund mentions, change all to "Built at MIT"
- `AlgorithmLens_Cowork/src/components/Sections/SocialProofSection.jsx`: If this file exists and contains MIT references, update to "Built at MIT" (note: it may be commented out in App.jsx but the file may still exist)

**Also search the entire `src/` directory for any other occurrences of "MIT" (case-sensitive) and update them all to just say "Built at MIT."**

**Verification:** Grep the entire `src/` folder for "MIT" and confirm every occurrence simply says "Built at MIT." Check the homepage footer, Plus page, and any waitlist forms in the browser.

---

## Prompt 3: Homepage Hero Section Changes

**Goal:** Update the hero section in `AlgorithmLens_Cowork/src/components/Hero/HeroSection.jsx`.

**Changes:**

1. **Main headline** (lines 52-57): Change from `"See what your algorithm actually shows you."` to `"See how the algorithms see you."` with this specific coloring:
   - "See how the" — black/dark text (use `text-text-main`)
   - "algorithms" — blue (use `text-primary-blue`)
   - "see you." — green (use `text-accent-green`)

   The new JSX should be something like:
   ```jsx
   <span className="font-bold text-text-main">See how the </span>
   <span className="font-extrabold text-primary-blue">algorithms </span>
   <span className="font-extrabold text-accent-green">see you.</span>
   ```
   Keep it on one line visually if possible at larger breakpoints. Keep the existing motion animation wrapper.

2. **Subtitle paragraph** (line 66): The current copy is too long. Replace with something roughly half the word count that gets the point across simply. Current: "AlgorithmLens scans your social media feed and breaks down exactly what's in it — how many ads, what topics dominate, which posts are suggested by the algorithm vs. accounts you follow. No guessing, just the data." Replace with: "Scan your feed. See exactly what's ads, what's suggested, and what's from accounts you actually follow."

3. **Add "Built at MIT" badge** somewhere in the hero section. Add it as a small pill/badge above or below the CTA button. Style it as a subtle, light badge — e.g., a small rounded pill with light gray background and dark text, similar to social proof badges used elsewhere on the site. Example: `<span className="inline-block px-3 py-1 bg-slate-100 text-text-muted text-xs font-semibold rounded-full">Built at MIT</span>`

**Verification:** Visit `http://localhost:5173/` in the browser and visually confirm: the new headline with correct colors, the shorter subtitle, and the "Built at MIT" badge in the hero area.

---

## Prompt 4: Homepage Copy — Loosen Epistemic Restraint Language

**Goal:** Throughout the entire homepage, update the copy to be more direct about algorithms optimizing for engagement. The current language is overly cautious. It's safe to say algorithms are designed to keep users engaged. Update language in all homepage marketing sections to reflect this.

**Files to modify and specific changes:**

1. **`SectionTracking.jsx`** (`src/components/Sections/SectionTracking.jsx`):
   - Line 26 heading: `"Platforms record more than you realize."` — This is fine, keep it.
   - Line 35 subtitle: `"Every scroll generates data. Platforms log your interactions as behavioral signals."` → Change to something more direct like: `"Every scroll, pause, and tap trains the algorithm to keep you engaged."`

2. **`SectionLoop.jsx`** (`src/components/Sections/SectionLoop.jsx`):
   - Line 10 heading: `"The Feedback Loop"` — fine, keep it.
   - Line 12 subtitle: `"A cycle where your behavior trains the model, which refines the content, which influences what you see next."` → Make more direct: `"Your behavior trains the algorithm. The algorithm reshapes your feed to maximize engagement. The cycle repeats."`
   - Card 3 desc (line 54): `"Your feed composition reflects your inferred categories."` → `"The algorithm fills your feed with content designed to keep you scrolling."`
   - Card 4 desc (line 64): `"Over time, your feed composition may reflect and reinforce the topics you engage with most."` → `"Over time, your feed narrows around what keeps you engaged — whether you want it to or not."`

3. **`HowItWorksSection.jsx`** (`src/components/Sections/HowItWorksSection.jsx`):
   - Line 9 heading: `"Your data stays yours."` — fine, keep it.
   - Line 11 subtitle: `"We show you the patterns in your feed so you can engage with intention."` → `"See what the algorithm is optimizing for, so you can scroll with intention."`

4. **`TwoWaysSection.jsx`** (`src/components/Sections/TwoWaysSection.jsx`):
   - This section is more functional/instructional, so the copy is largely fine. No major changes needed.

5. **`LabelsPreviewSection.jsx`** and **`HeroDashboardPreview.jsx`**: Read these files and check for any overly cautious language about algorithms. Update if needed to be more direct about engagement optimization.

6. **Bottom CTA in `App.jsx`** (line 187): `"Ready to see your profile?"` — Change to: `"Ready to see what the algorithm sees?"`
   - Line 189 subtitle: `"Upload a screen recording of your feed to generate your AlgorithmLens dashboard. Private and secure."` → `"Scan your feed and get your AlgorithmLens dashboard in minutes."`

**Important:** Also update the CLAUDE.md project instructions to relax the epistemic restraint rules. The current rules say to NEVER speculate on algorithmic intent — update this to say it's acceptable to state that algorithms optimize for engagement, but still avoid specific unverifiable claims about individual platform mechanics.

**Verification:** Scroll through the entire homepage at `http://localhost:5173/` and read every section. Confirm the language is more direct about algorithmic engagement optimization while still being factual and defensible.

---

## Prompt 5: Simplify Scan Platform Pages

**Goal:** The scan platform pages (e.g., `http://localhost:5173/scan/platform/x`) are too text-heavy and complicated. Simplify them visually and in terms of explanation.

**File:** `AlgorithmLens_Cowork/src/pages/ScanPlatformPage.jsx`

**Changes:**

1. **Simplify the layout:** The current page shows two side-by-side panels (Chrome Extension vs Upload Recording) with lots of explanatory text, bullet points, and "How it works" steps. Drastically simplify:
   - Remove the "How it works" numbered steps from the Chrome Extension panel
   - Remove the "Tips for best results" bullet list from the Upload panel
   - Remove the expandable "How to record on your phone" section
   - Keep just: a clear heading, one short sentence of explanation per method, and the action button/upload zone

2. **Simplified Chrome Extension panel:** Should just show:
   - Icon + "Chrome Extension" title
   - One line: "Scan your feed automatically in your browser."
   - Extension status (detected/not detected)
   - Action button (Start Scan or Install Extension)

3. **Simplified Upload panel:** Should just show:
   - Icon + "Upload Recording" title
   - One line: "Upload a screen recording of your feed."
   - The drag-and-drop upload zone
   - The file select button

4. **Page header:** Keep `"Scan Your [Platform] Feed"` but remove the subtitle `"Choose how you'd like to capture your feed"` — the two panels make it obvious.

**Verification:** Visit `http://localhost:5173/scan/platform/x` and `http://localhost:5173/scan/platform/tiktok` in the browser. Confirm the pages look clean, simple, and uncluttered. Each panel should be visually scannable in under 3 seconds.

---

## Prompt 6: Settings Page Cleanup

**Goal:** Remove unnecessary features from the Settings page and simplify for MVP.

**File:** `AlgorithmLens_Cowork/src/pages/SettingsPage.jsx`

**Changes:**

1. **Remove Data Export section entirely.** Find the "Data Export" section with the JSON/CSV export button and remove the entire block. This is too complicated for MVP.

2. **Remove Default Scan Duration setting.** Find the "Default scan duration" section with the 30s/1m/2m/3m buttons and remove it. This setting isn't meaningful in the current product context.

3. **Remove Preferred Platforms setting** if it doesn't actually affect anything functional. Find the "Preferred platforms" checkboxes section and remove it.

4. **Auto-save scan results:** Find the auto-save toggle. Change its default to `true` (on/yes). If the current default is stored in localStorage, make sure the initial state defaults to `true` when no preference has been set yet.

5. **After removals, the Settings page should only contain:**
   - Account section (email, member since, current plan, sign out)
   - AI Analysis toggle (enable/disable Gemini analysis)
   - Plan Management (current plan, upgrade/manage billing)
   - The legal footer links (Privacy Policy, Terms of Service — but NOT Contact email, per Prompt 1)

**Verification:** Visit `http://localhost:5173/settings` in the browser. Confirm the page is clean and minimal: just Account info, AI Analysis toggle, Plan Management, and footer links. No data export, no scan duration, no preferred platforms.

---

## Prompt 7: Plus Page — Fix Scroll Position and Simplify

**Goal:** Fix the Plus page so it opens at the top, simplify the language/structure, and fix the styling of the bottom CTA box.

**File:** `AlgorithmLens_Cowork/src/pages/plus/PlusPage.jsx`

**Changes:**

1. **Fix scroll position:** The page currently opens at the middle instead of the top when navigating to `/plus`. Add a `useEffect` that scrolls to top on mount:
   ```jsx
   useEffect(() => { window.scrollTo(0, 0); }, []);
   ```
   Check if this already exists — if it does, it may be broken. The React Router `<AnimatePresence>` wrapper in App.jsx may need a scroll-to-top on route change instead. If App.jsx already has route-change scroll behavior, debug why it's not working for /plus specifically. The fix might need to go in App.jsx as a global scroll-to-top on location change.

2. **Simplify the page structure and copy:**
   - The current page has: Hero → "Upgrade to Plus" section → feature cards → Free vs Plus comparison → Pricing cards → Trust badges → FAQ → Bottom CTA. This is too much and repetitive.
   - **Remove the separate "Upgrade to Plus" section** that appears between the hero and the feature content. It's redundant — the hero already sells Plus.
   - **Simplify the hero copy.** Current: "Your scan shows the surface. Plus shows the story." with a long subtitle. Keep the heading but shorten the subtitle to one clear sentence.
   - **Simplify feature card copy** — make descriptions shorter and punchier, consistent with the more direct homepage tone.
   - **Simplify the pricing cards section.** Remove any redundant CTAs or explanatory text above the pricing cards. Just show the two pricing options (Monthly/Annual) cleanly.

3. **Fix the dark navy bottom CTA box styling.**
   - Currently it uses a dark navy/slate background that doesn't match the rest of the site's light, clean aesthetic.
   - Change its background from the dark navy gradient to match the site's style: either a light blue gradient (like `bg-gradient-to-b from-blue-50 to-white`) or use the same `bg-[#F0F7FF]` that the Feedback Loop section uses on the homepage.
   - Update text colors accordingly — the heading should be `text-text-main` (dark), subtitle `text-text-muted`, and the CTA button should remain `bg-primary-blue text-white`.

4. **Ensure color/formatting consistency with homepage:**
   - The Plus page should use the same color palette and design tokens as the homepage (primary-blue, accent-green, text-text-main, text-text-muted, bg-bg-page, etc.)
   - Buttons should be the same style as homepage CTAs (rounded-full, bg-primary-blue, shadow-glow)

5. **Update MIT references** on this page to "Built at MIT" (if not already done in Prompt 2).

**Verification:** Navigate to `http://localhost:5173/plus` in the browser. Confirm: (1) page opens at the top, (2) the structure feels streamlined with no redundant sections, (3) the bottom CTA box uses light styling consistent with the rest of the site, (4) colors and fonts match the homepage.

---

## Prompt 8: Privacy Policy and Terms of Service Accuracy Review

**Goal:** Review the Privacy Policy and Terms of Service to ensure no false claims are made. These are legal documents and must accurately reflect what the product actually does.

**Files:**
- `AlgorithmLens_Cowork/src/pages/PrivacyPage.jsx`
- `AlgorithmLens_Cowork/src/pages/TermsPage.jsx`

**Changes:**

1. **Privacy Policy review — check for false claims:**
   - Verify that all third-party services listed (Supabase, Stripe, Google Gemini, Sentry, Vercel) are actually used in the codebase. Search the `src/` directory for imports/references to each. Remove any services that aren't actually integrated.
   - Check data retention claims — if the policy states specific retention periods or deletion procedures, make sure these are accurate or use softer language like "we aim to" rather than hard promises if the backend doesn't yet enforce them.
   - Remove any references to email addresses (covered in Prompt 1).
   - If the policy references features that don't exist yet (like specific data deletion endpoints), add language like "where technically feasible" to avoid making promises the product can't keep yet.

2. **Terms of Service review — check for false claims:**
   - Verify the pricing claims match what's actually in the Stripe configuration ($10/month, $96/year, 14-day trial)
   - Check that the free plan description matches what's actually available
   - Make sure governing law jurisdiction (New York) is intentional
   - Remove any references to email addresses (covered in Prompt 1)
   - If terms reference features or processes that don't exist yet, soften the language

3. **Update MIT/company references** — ensure any references to MIT use "Built at MIT" language, and Goodish company info is accurate.

**Verification:** Read through both `/privacy` and `/terms` pages in the browser. Look for any specific claims that could be false or misleading. Cross-reference service integrations with actual code imports.

---

## Prompt 9: Chrome Extension and Mobile App Link Placeholders

**Goal:** The Chrome Extension and Mobile App links throughout the site currently point to generic homepages (`https://chrome.google.com/webstore` and `https://apps.apple.com`). These aren't real yet. Update them site-wide to be more honest about the current state.

**Files to search across `src/`:** Any file containing `chrome.google.com/webstore` or `apps.apple.com`.

Known files:
- `HeroSection.jsx` (lines 107, 116)
- `TwoWaysSection.jsx` (lines 50, 80)
- `ScanPlatformPage.jsx` (extension install link)

**Changes:**
- Instead of linking to the generic store homepages, either:
  - Option A: Make these buttons non-linking with a "Coming Soon" badge/label, OR
  - Option B: Keep the links but add "(Coming Soon)" text next to the button labels

- Use Option A for cleaner UX: Change the `<a>` tags to `<button>` or `<span>` elements that are visually styled the same but not clickable as links. Add a small "Coming Soon" label below or beside each. Example:
  ```jsx
  <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-border-light rounded-full text-sm font-medium text-text-muted cursor-default opacity-75">
    <Monitor size={16} className="text-primary-blue" />
    Chrome Extension
    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">Coming Soon</span>
  </div>
  ```

**Verification:** Check the homepage hero, the TwoWaysSection, and the scan platform page in the browser. Confirm extension/app links are clearly marked as Coming Soon and don't lead to generic store pages.

---

## Prompt 10: Final Site-Wide Language Consistency Pass

**Goal:** Do a final pass across all pages to ensure the language tone is consistent: direct about algorithmic engagement optimization, concise, not overly cautious.

**Pages to review in browser and source:**
- Homepage (all sections)
- Scan platform pages
- Plus page
- Settings page
- Dashboard empty states and onboarding copy (check `src/components/onboarding/` and `src/components/dashboard/` for any overly cautious language)

**Specific things to check:**
- No remaining "may suggest" or "pattern may indicate" hedging language on the homepage or Plus page (dashboard analysis tabs can keep hedged language since those are about specific user data)
- All MIT references say "Built at MIT"
- No email addresses remain
- No broken links to generic store pages
- Language is concise throughout — if any section still feels wordy, tighten it up
- The CLAUDE.md file has been updated (from Prompt 4) to reflect the relaxed epistemic stance

**Verification:** Full site walkthrough in browser: Home → scroll through all sections → Scan → pick a platform → Plus → Settings → Privacy → Terms. Screenshot each page and confirm visual/copy consistency.

---

## Summary of All Prompts

| # | Scope | Key Changes |
|---|-------|-------------|
| 1 | Site-wide | Remove all fake email addresses |
| 2 | Site-wide | Standardize MIT refs to "Built at MIT" |
| 3 | Homepage hero | New headline, shorter subtitle, MIT badge |
| 4 | Homepage sections | Loosen epistemic language, be direct about engagement |
| 5 | Scan platform pages | Drastically simplify, remove text clutter |
| 6 | Settings page | Remove data export, scan duration, preferred platforms; auto-save default on |
| 7 | Plus page | Fix scroll-to-top, simplify structure, fix dark CTA box |
| 8 | Privacy/Terms | Review for accuracy, remove false claims |
| 9 | Site-wide links | Mark extension/app links as Coming Soon |
| 10 | Site-wide | Final consistency and language pass |
