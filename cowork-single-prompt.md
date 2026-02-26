# AlgorithmLens — Complete Site Overhaul (Single Prompt)

You are making a series of changes to the AlgorithmLens website. The site is a React/Vite app located at `AlgorithmLens_Cowork/`. Work through each phase sequentially. After each phase, run the verification step before proceeding.

**Important context:**
- The dev server is at `http://localhost:5173/`
- The site uses Tailwind utility classes and a custom design token system (`text-text-main`, `text-text-muted`, `text-primary-blue`, `text-accent-green`, `bg-bg-page`, etc.)
- Framer Motion is used for animations
- React Router v6 handles routing

---

## PHASE 1: Site-Wide Cleanup (Emails + MIT References)

### 1A: Remove all email addresses
Remove every reference to `support@algorithmlens.com` and `legal@algorithmlens.com`. These are not real.

**Files and exact changes:**

- **`src/App.jsx`**: The footer's Support column (around lines 280-285) currently has a `mailto:support@algorithmlens.com` link. The entire Support `<div>` section with the "Support" heading and "Contact" mailto link has already been removed. Verify it's gone. If it somehow remains, remove it.

- **`src/pages/SettingsPage.jsx`**: Lines 648-657, the about/legal footer. Currently has links to Privacy Policy, Terms of Service. If there's still a "Contact" link pointing to a mailto, remove it. Keep Privacy Policy and Terms of Service links.

- **`src/pages/PrivacyPage.jsx`**: Search for any `@algorithmlens.com` email references. Replace any "contact us at support@algorithmlens.com" or "legal@algorithmlens.com" text with "contact us through the AlgorithmLens website." Do NOT remove the entire sentence — just replace the email with generic language.

- **`src/pages/TermsPage.jsx`**: Same as PrivacyPage — replace all email addresses with "contact us through the AlgorithmLens website."

- **`src/pages/ScanPlatformPage.jsx`**: Check for any email references and remove them.

- **Do a final grep** across the entire `src/` directory for `@algorithmlens.com` and fix any remaining occurrences.

### 1B: Standardize all MIT references to "Built at MIT"

**Every** MIT reference across the entire site must say exactly "Built at MIT" — no other variations.

- **`src/App.jsx` footer** (line ~259): Change `"Understand what appears in your social media feed. Built by an MIT student."` → `"Understand what appears in your social media feed. Built at MIT."`
- **`src/App.jsx` footer** (line ~294): Change `"Developed with support from MIT Sandbox Innovation Fund."` → `"Built at MIT."`
- **`src/pages/plus/PlusPage.jsx`** (line ~228): In the social proof row, change `{ icon: Shield, text: 'Built by an MIT student' }` → `{ icon: Shield, text: 'Built at MIT' }`
- **`src/components/WaitlistSignup.jsx`**: Find "Built by an MIT student" and MIT Sandbox references, change to "Built at MIT"

**Grep the entire `src/` folder for "MIT"** and fix any remaining variations (e.g., "MIT student", "MIT Sandbox", "MIT Sandbox Innovation Fund").

### ✅ VERIFICATION CHECKPOINT 1
1. Run `grep -r "@algorithmlens.com" src/` — expect **zero** results
2. Run `grep -r "MIT" src/` — every result should say exactly "Built at MIT" (exception: filenames or unrelated strings)
3. Visit `http://localhost:5173/` and scroll to footer — confirm it says "Built at MIT." with no email visible
4. Visit `http://localhost:5173/settings` — scroll to bottom, confirm no email links
5. Visit `http://localhost:5173/privacy` and `http://localhost:5173/terms` — search page for "@" symbol, confirm no email addresses

**Do not proceed to Phase 2 until all 5 verification checks pass. If any fail, fix them first.**

---

## PHASE 2: Homepage Hero Section

**File:** `src/components/Hero/HeroSection.jsx`

### 2A: Change the main headline
Replace the current h1 content (lines 52-57) from "See what your algorithm actually shows you." to "See how the algorithms see you." with specific coloring:
- "See how the" → black text (`text-text-main`, `font-bold`)
- "algorithms" → blue text (`text-primary-blue`, `font-extrabold`)
- "see you." → green text (`text-accent-green`, `font-extrabold`)

New JSX for the h1 inner content:
```jsx
<span className="font-bold text-text-main">See how the </span>
<span className="font-extrabold text-primary-blue">algorithms </span>
<span className="font-extrabold text-accent-green">see you.</span>
```
Remove the `<br />` tag and the wrapping `<span className="block sm:inline...">` — make it flow naturally on one line at large screens. Keep the `<motion.h1>` wrapper and its classes.

### 2B: Shorten the subtitle
Replace the paragraph on line 66. Current: "AlgorithmLens scans your social media feed and breaks down exactly what's in it — how many ads, what topics dominate, which posts are suggested by the algorithm vs. accounts you follow. No guessing, just the data."

New: **"Scan your feed. See exactly what's ads, what's suggested, and what's from accounts you actually follow."**

### 2C: Add "Built at MIT" badge in hero
Add a small badge/pill in the hero section. Place it right after the "Works with TikTok, Instagram..." line (after the `<motion.p>` on line 69-76) and before the CTA button. Style it as:
```jsx
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.17, ease: [0.16, 1, 0.3, 1] }}
>
    <span className="inline-block px-4 py-1.5 bg-slate-100 text-text-muted text-xs font-semibold rounded-full">
        Built at MIT
    </span>
</motion.div>
```

### ✅ VERIFICATION CHECKPOINT 2
1. Visit `http://localhost:5173/` — take a screenshot
2. Confirm: headline shows "See how the" (black) "algorithms" (blue) "see you." (green)
3. Confirm: subtitle is the shorter version (one sentence, ~15 words)
4. Confirm: "Built at MIT" badge is visible in the hero area
5. Confirm: the layout isn't broken on the page

**Do not proceed to Phase 3 until all checks pass.**

---

## PHASE 3: Homepage Section Copy — Loosen Language

Update homepage marketing copy to be more direct about algorithms optimizing for engagement. The current copy is overly cautious.

### 3A: SectionTracking.jsx (`src/components/Sections/SectionTracking.jsx`)
- Line 35 subtitle: Change `"Every scroll generates data. Platforms log your interactions as behavioral signals."` → `"Every scroll, pause, and tap trains the algorithm to keep you engaged."`

### 3B: SectionLoop.jsx (`src/components/Sections/SectionLoop.jsx`)
- Line 12 subtitle: Change `"A cycle where your behavior trains the model, which refines the content, which influences what you see next."` → `"Your behavior trains the algorithm. The algorithm reshapes your feed to maximize engagement. The cycle repeats."`
- Card 3 desc (line 54, "Tailored content" card): Change `"Your feed composition reflects your inferred categories."` → `"The algorithm fills your feed with content designed to keep you scrolling."`
- Card 4 desc (line 64, "Your media diet evolves" card): Change `"Over time, your feed composition may reflect and reinforce the topics you engage with most."` → `"Over time, your feed narrows around what keeps you engaged — whether you want it to or not."`
- Also update the mobile layout duplicates of Card 3 and Card 4 (lines 105-108) with the same new text.

### 3C: HowItWorksSection.jsx (`src/components/Sections/HowItWorksSection.jsx`)
- Line 11 subtitle: Change `"We show you the patterns in your feed so you can engage with intention."` → `"See what the algorithm is optimizing for, so you can scroll with intention."`

### 3D: LabelsPreviewSection.jsx (`src/components/Sections/LabelsPreviewSection.jsx`)
- Line 37 heading: Change `"Based on your feed, here's what patterns emerged."` → `"This is how the algorithm sees you."`
- Line 38-39 subtitle: Change `"We observe what appears in your feed. These patterns show the composition of your content, not what you think or who you are."` → `"Based on your scrolling behavior, here are the categories the algorithm likely puts you in."`

### 3E: HeroDashboardPreview.jsx (`src/components/Hero/HeroDashboardPreview.jsx`)
- Line 169 heading: Change `"AlgorithmLens makes the pattern visible."` → `"AlgorithmLens shows you what the algorithm sees."`

### 3F: Bottom CTA in App.jsx (`src/App.jsx`)
- Line ~187 heading: Change `"Ready to see your profile?"` → `"Ready to see what the algorithm sees?"`
- Line ~189-190 subtitle: Change `"Upload a screen recording of your feed to generate your AlgorithmLens dashboard. Private and secure."` → `"Scan your feed and get your AlgorithmLens dashboard in minutes."`

### 3G: Update CLAUDE.md epistemic restraint rules
In the project `CLAUDE.md` file, update the "Critical: Epistemic Restraint Standards" section to say:
- It IS acceptable to state that algorithms optimize for engagement
- It IS acceptable to say algorithms are designed to keep users scrolling
- Still avoid specific unverifiable claims about individual platform mechanics (e.g., don't say "TikTok uses X specific technique")
- Dashboard analysis tabs should still use observational language for specific user data claims

### ✅ VERIFICATION CHECKPOINT 3
1. Visit `http://localhost:5173/` and slowly scroll through the entire page
2. Check SectionTracking: subtitle says "Every scroll, pause, and tap trains the algorithm to keep you engaged."
3. Check The Feedback Loop: subtitle mentions "maximize engagement"; Card 3 says "keep you scrolling"; Card 4 says "whether you want it to or not"
4. Check "Your data stays yours" section: subtitle says "See what the algorithm is optimizing for..."
5. Check labels section: heading says "This is how the algorithm sees you."
6. Check bottom CTA: says "Ready to see what the algorithm sees?"
7. Read through the entire homepage one more time — does anything still sound overly hedged or cautious?

**Do not proceed to Phase 4 until all checks pass.**

---

## PHASE 4: Scan Platform Pages + Settings Page

### 4A: Simplify scan platform pages
**File:** `src/pages/ScanPlatformPage.jsx`

The pages at `/scan/platform/x`, `/scan/platform/tiktok` etc. are too text-heavy. Simplify:

1. **Remove** the "How it works:" numbered steps section from the Chrome Extension panel
2. **Remove** the "Tips for best results:" bullet list from the Upload Recording panel
3. **Remove** the expandable "How to record on your phone" section
4. **Remove** the subtitle `"Choose how you'd like to capture your feed"` from the page header — just keep the platform name heading
5. **Keep** the core functionality: extension detection, Start Desktop Scan button, Install Extension link, drag-and-drop upload zone, and file select button
6. Each panel should have just: icon + title, one short sentence, and the action element

### 4B: Settings page cleanup
**File:** `src/pages/SettingsPage.jsx`

1. **Remove the entire Data Export section** (lines ~586-645). Remove the entire `<SettingsSection icon={Download} ...>` block and its children. Also remove related state variables (`isExporting`, `exportFormat`, `exportError`) and the `handleExport` callback function. Remove the `Download` import from lucide-react.

2. **Remove Default Scan Duration** from the Scan Preferences section. Delete the entire `<div>` block containing "Default scan duration" label and the `SCAN_DURATIONS` buttons (lines ~412-432). Also remove the `SCAN_DURATIONS` constant at the top of the file.

3. **Remove Preferred Platforms** from the Scan Preferences section. Delete the entire `<div>` block containing "Preferred platforms" label and the platform checkboxes (lines ~434-457). Also remove the `SUPPORTED_PLATFORMS` constant and the `togglePlatform` callback.

4. After removing those, the **Scan Preferences section should only have the auto-save toggle** remaining. If it looks odd having just one toggle in a section, you can either remove the entire Scan Preferences section header and just move the auto-save toggle into a simpler layout, or keep the section and it'll be clean with just one setting.

5. **Ensure auto-save defaults to true.** Check `loadPreferences()` — verify the default `autoSave` is `true`. Currently it appears to already be `true` on line 76. Confirm this is correct.

### ✅ VERIFICATION CHECKPOINT 4
1. Visit `http://localhost:5173/scan/platform/x` — confirm the page is dramatically simpler: no numbered steps, no bullet lists, no expandable sections
2. Visit `http://localhost:5173/scan/platform/tiktok` — same check
3. Visit `http://localhost:5173/settings` — confirm:
   - No "Data Export" section visible
   - No "Default scan duration" buttons visible
   - No "Preferred platforms" checkboxes visible
   - Auto-save toggle is visible and defaults to ON
   - Account, AI Analysis, and Plan Management sections look clean

**Do not proceed to Phase 5 until all checks pass.**

---

## PHASE 5: Plus Page Fixes

**File:** `src/pages/plus/PlusPage.jsx`

### 5A: Fix scroll-to-top
The page doesn't scroll to top when navigated to. Add this at the beginning of the component (after the state declarations, or combine with an existing useEffect):
```jsx
useEffect(() => {
    window.scrollTo(0, 0);
}, []);
```

If there's already a scroll-to-top mechanism in `App.jsx` that's supposed to handle route changes, investigate why it's not working for `/plus`. The issue might be that `AnimatePresence` with `mode="wait"` delays the render. A scroll-to-top in the component itself is the safest fix.

### 5B: Fix the dark navy bottom CTA box (lines ~826-858)
The dark `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900` box doesn't match the site's light aesthetic. Change it to use the light blue styling consistent with the rest of the site:

Replace the entire bottom CTA `<motion.div>` styling:
- Change background from `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900` → `bg-gradient-to-b from-blue-50 via-white to-emerald-50/30 border border-blue-200/60`
- Remove the dark-themed accent glow divs (`bg-primary-blue/10` and `bg-emerald-500/10` blur elements)
- Change heading from `text-white` → `text-text-main`
- Change first paragraph from `text-slate-400` → `text-text-muted`
- Change second paragraph from `text-slate-500` → `text-text-muted/70`
- Change the CTA button from `bg-white text-slate-900` → `bg-gradient-to-r from-primary-blue to-blue-600 text-white rounded-full font-bold` (match the existing CTA buttons above)
- Change the badges below from `text-slate-500` with `text-emerald-400`/`text-blue-400` icons → `text-text-muted` with `text-emerald-500`/`text-primary-blue` icons

### 5C: Simplify hero subtitle
Line ~197-209: There are two paragraphs after the main heading. Remove the second one ("Your snapshot shows the headlines. Plus reveals the full picture.") — it's redundant with the first paragraph.

### 5D: Update MIT reference in social proof
The social proof badge on line ~228 `'Built by an MIT student'` should already be fixed from Phase 1. Verify it says `'Built at MIT'`.

### ✅ VERIFICATION CHECKPOINT 5
1. Navigate away from `/plus` (go to `/`) then navigate back to `/plus` — confirm the page opens at the **top**, not scrolled partway down
2. Scroll to the very bottom of the Plus page — confirm the bottom CTA box uses **light** styling (white/blue/green tones), NOT dark navy
3. Confirm the hero section has only one subtitle paragraph
4. Confirm social proof says "Built at MIT"
5. Overall, does the Plus page look visually consistent with the homepage's color palette?

**Do not proceed to Phase 6 until all checks pass.**

---

## PHASE 6: Privacy/Terms Accuracy + Extension Links + Final Pass

### 6A: Privacy Policy and Terms review
**Files:** `src/pages/PrivacyPage.jsx`, `src/pages/TermsPage.jsx`

- Ensure no email addresses remain (should be done from Phase 1)
- Check that third-party services listed (Supabase, Stripe, Google Gemini, Sentry, Vercel) are actually imported/referenced in the codebase. Do a quick grep for each. If any service is NOT actually used in the code, add a note like "when applicable" or remove the section.
- If either page makes hard promises about specific data deletion timelines or procedures that might not be implemented yet, soften with "where technically feasible" or "we aim to"
- Update any MIT references to "Built at MIT"

### 6B: Extension and app links → Coming Soon
Search the entire `src/` folder for `chrome.google.com/webstore` and `apps.apple.com`.

Known locations:
- `src/components/Hero/HeroSection.jsx` (lines 107, 116) — Chrome Extension and Mobile App buttons
- `src/components/Sections/TwoWaysSection.jsx` (lines 50, 80) — Install Extension and Download App links

For each link:
- Change the `<a>` tag to a `<span>` or `<div>` (remove href, target, rel)
- Add `cursor-default opacity-75` to the className
- Append a "Coming Soon" label: `<span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full ml-1">Coming Soon</span>`
- Keep the visual styling (border, rounded-full, icon) so they still look like buttons, just not clickable

### 6C: Final consistency pass
Do a final read-through of ALL files you've modified. Check for:
- Any remaining overly hedged language on the homepage (e.g., "may suggest", "pattern may indicate")
- Any remaining email addresses
- Any MIT references that don't say "Built at MIT"
- Any broken JSX or missing closing tags from your edits
- Ensure no console errors on the homepage

### ✅ FINAL VERIFICATION CHECKPOINT
1. Visit `http://localhost:5173/` — scroll through entire homepage. Take a screenshot at hero, each section, and footer.
2. Visit `http://localhost:5173/scan/platform/x` — confirm clean/simple
3. Visit `http://localhost:5173/plus` — confirm opens at top, bottom CTA is light-styled, MIT references correct
4. Visit `http://localhost:5173/settings` — confirm simplified (no export, no duration, no platforms)
5. Visit `http://localhost:5173/privacy` — confirm no emails
6. Visit `http://localhost:5173/terms` — confirm no emails
7. Check homepage hero buttons for Chrome Extension and Mobile App — confirm they say "Coming Soon" and aren't clickable links
8. Run `grep -r "@algorithmlens.com" src/` — confirm zero results
9. Run `grep -r "MIT" src/` — confirm all say "Built at MIT"
10. Open browser console on homepage — confirm no errors

**Only mark the task as complete when all 10 checks pass.**
