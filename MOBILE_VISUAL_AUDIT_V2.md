# AlgorithmLens Mobile App — Visual + Functional Audit V2

**Date:** February 25, 2026
**Platform:** iOS (Expo Go)
**App Version:** 1.0.0 (1)
**Recording Duration:** ~1 minute 40 seconds
**Auditor:** Claude (from screen recording frame-by-frame analysis)
**Context:** This is the second audit, performed after fixes from V1 were applied (SVG transform fix, per-tab ErrorBoundary, Broadcast mode gating, LogBox suppression, ErrorBoundary "Go Home" button).

---

## Executive Summary

Several V1 fixes landed successfully: the app no longer full-crashes on dashboard load, onboarding was added, the upgrade modal was redesigned into a proper bottom sheet, scan overlay copy was improved, and post capture count now works correctly (14 posts captured vs. 5 previously). However, **two critical blockers remain that make the product unusable**: (1) ALL six dashboard tabs show "This section couldn't load" — the entire dashboard is non-functional, and (2) Screen Capture mode is disabled in Expo Go with a "DEV BUILD ONLY" label, meaning the primary scan mode cannot be used. The core value loop (scan → view dashboard) is still broken.

**Total findings: 38**
- Critical: 4
- High: 12
- Medium: 13
- Low: 9

### What Improved Since V1
- Onboarding flow added (3-step walkthrough: "See what's in your feed" → "Scan any platform" → "Get insights")
- No full-screen crash on dashboard — per-tab ErrorBoundary catches errors gracefully
- ErrorBoundary "Go Home" button visible on Scan Complete screen
- Upgrade modal redesigned from iOS system alert to proper branded bottom sheet with feature list, Annual/Monthly toggle, and "Start 14-day free trial" CTA
- Platform picker now shows "Choose a platform above to get started" hint text
- Scan mode labels improved: "Screen Capture" / "Quick Scan" (was "Broadcast" / "Precision")
- Scan overlay copy improved: "Keep scrolling — 5 more posts needed", "Good start! Keep scrolling"
- Post capture pipeline fixed: 14 posts captured in ~18 seconds (vs. stuck at 5 in V1)
- "Scan Another Platform" now styled as proper outline button (was text link)
- History cards show sample quality thresholds: "Low sample (aim for 10+)"
- No Expo error banners visible during entire recording (LogBox fix working)

---

## CRITICAL — Blocks Launch

### C-01: ALL six dashboard tabs show "This section couldn't load"
- **Timestamps:** 0:10–0:20 (user cycles through every tab)
- **What happens:** Navigating to the Dashboard tab, the Overview tab displays "This section couldn't load — The Overview tab ran into an issue. Try switching to another tab or refreshing the dashboard." The user then taps Sources, Ads & Promos, Political, Tone, and Suggested vs. Followed — every single one shows the identical error with only the tab name changed. The per-tab ErrorBoundary successfully prevents a full crash (V1 fix working), but it's catching an error in ALL tab content components.
- **Impact:** The entire product value loop is broken. Users can scan but **never see any results**. This is the #1 blocker. The dashboard is the product — without it, AlgorithmLens has no value proposition.
- **Root cause hypothesis:** The V1 fix only addressed the ChevronDown SVG transform in PoliticsContent. But ALL tabs crash, meaning the error is in shared code — likely a shared component, chart library, or data utility used by every tab content component. Possible causes: (a) another SVG component with a CSS-style transform elsewhere in shared code, (b) a charting/visualization library that renders SVGs with incompatible transforms, (c) a data parsing error that throws before content renders, (d) a shared utility or hook that all tab components depend on. The ErrorBoundary catches a render-phase error, so it's happening during component rendering, not in an effect.
- **Debug approach:** Add `console.error` logging to the ErrorBoundary's `componentDidCatch` to capture the actual error message and stack trace. Then trace which shared component or library is crashing. Run the app in development mode and check the Metro bundler console for the exact error.

### C-02: Screen Capture mode disabled — shows "DEV BUILD ONLY"
- **Timestamp:** 0:65
- **What happens:** In the platform picker bottom sheet, after selecting YouTube, the mode toggle shows two options: "Screen Capture" (grayed out, 50% opacity, with text "Requires development build" and a gray "DEV BUILD ONLY" badge) and "Quick Scan" (selected, blue, with checkmark, "Analyze content via built-in browser"). The CTA button reads "Start Quick Scan". Screen Capture mode cannot be tapped — it is completely disabled.
- **Impact:** This is a NON-NEGOTIABLE issue. Screen Capture is the primary, differentiated scan mode — it's what makes AlgorithmLens unique vs. competitors. Showing it as disabled with a developer-jargon badge ("DEV BUILD ONLY") makes the product feel unfinished. Users don't know what a "development build" is and shouldn't have to. The fix applied in V1 (gating broadcast behind `Constants.appOwnership === 'expo'`) was a stopgap for crash prevention, but the real fix is to **make Screen Capture actually work**. This requires migrating from Expo Go to an Expo development build with native modules.
- **What "fixed" means:** Screen Capture mode must be fully functional: user taps Screen Capture → selects platform → iOS screen recording prompt appears → user records their feed → recording is processed into dashboard data. The "DEV BUILD ONLY" badge must never appear in any user-facing build.

### C-03: Dashboard shows stale data from previous scan (not newest)
- **Timestamp:** 0:10 (dashboard header)
- **What happens:** The dashboard header reads "Feb 24, 2026 at 4:24 PM — Youtube (5 posts)" — this is from the PREVIOUS scan session (V1 recording). The user has since completed a new scan with 14 posts, but the dashboard doesn't reflect it. Even after completing the new scan at 0:90, the dashboard would still show the old data.
- **Impact:** Users see outdated results. After spending time scanning, they expect to see their new data.
- **Root cause:** Dashboard data loading likely reads from a cache or storage that doesn't invalidate when a new scan completes. The navigation from Scan Complete → Dashboard should pass the new scan ID or trigger a data refresh.

### C-04: Streak logic broken — "Streak paused" despite active scanning
- **Timestamp:** 0:05, 0:98, 1:40
- **What happens:** At recording start (0:05), home screen shows "Streak paused — Scan today to start a new streak." After completing a scan (0:98), the home screen briefly shows "Start your streak — Scan once to begin tracking your awareness" — a DIFFERENT and more regressed message. Then at 1:40 it shows "Streak paused" again. The user has 5+ scans in history (4 visible in History tab plus the one just completed) but the streak never activates.
- **Impact:** Core gamification/engagement mechanic is non-functional. Users feel their activity isn't being tracked.

---

## HIGH — Fix Before Beta

### H-01: "Good evening, Jwjwin" — email prefix used as name
- **Timestamp:** 0:05, 0:09, 1:40
- **What happens:** The greeting shows "Good evening, Jwjwin" — parsed from the email `jwjwin0+app1@gmail.com` by stripping the `0+app1` portion (or similar). "Jwjwin" is not a name — it's an email handle artifact.
- **Impact:** First thing users see. Feels impersonal and broken.
- **Fix:** Pull display name from Supabase auth profile. If no display name set, use just "Good evening" without a name, or prompt the user to set their name during onboarding.

### H-02: Feed Score shows contradictory state
- **Timestamp:** 0:05 vs 0:98
- **What happens:** At session start, Feed Score card shows "84 — Balanced" with "1 scan this week." After completing a new scan and returning to Home (0:98), it briefly shows "Complete 2 scans to see your Feed Score" before transitioning to "80 — Balanced" with "2 scans this week." The score dropped from 84 to 80 after a scan — possible but the momentary "Complete 2 scans" flash is a data loading race condition.
- **Impact:** Users see contradictory states. The flash of "Complete 2 scans" when they already have a score is confusing.
- **Fix:** Ensure Feed Score is loaded before rendering. Use a skeleton placeholder during load, never flash the "complete X scans" state when a score already exists.

### H-03: 0% Ads across ALL scans — systematically incorrect
- **Timestamp:** 0:50 (history), 0:90 (scan complete)
- **What happens:** YouTube scan: 14 posts, 0% ads. Previous YouTube scan: 5 posts, 0% ads. All Instagram scans in history: 0% ads. YouTube and Instagram both serve ads to virtually all users.
- **Impact:** If ad detection is broken, the entire Ads & Promos tab is meaningless. This is a credibility-destroying accuracy failure for a "transparency tool."
- **Fix:** Review the ad classification pipeline. Instagram ads have "Sponsored" labels. YouTube ads appear between organic content. The WebView content observer may need to detect these markers.

### H-04: 100% Suggested on YouTube needs validation
- **Timestamp:** 0:50, 0:90
- **What happens:** Both YouTube scans show 100% suggested content. While YouTube homepage content is algorithmically surfaced, this metric may be overly simplistic — marking everything as "suggested" because the user isn't subscribed to the channels.
- **Impact:** If the classifier always returns 100% for YouTube, the Suggested vs. Followed tab provides zero insight for YouTube scans.
- **Fix:** Verify subscription-aware detection. Check if the "Subscribe"/"Subscribed" button text is being parsed for each channel shown in the feed.

### H-05: Upgrade checkout appears to fail silently
- **Timestamp:** 0:35–0:45
- **What happens:** User selects Monthly plan ($10/month) → taps "Start 14-day free trial" → loading spinner appears on the button → cut to next screen is Settings (no success or error feedback shown in recording). The spinner either timed out or the user dismissed it.
- **Impact:** Revenue flow may be broken. No success confirmation or error message was shown.
- **Fix:** Verify Stripe checkout integration. Ensure success/error states are clearly communicated. Add a timeout with an error message if checkout takes too long.

### H-06: History screen has clipped UI element at top-right
- **Timestamp:** 0:50–0:55
- **What happens:** A small UI element (filter or sort icon) is partially visible at the top-right edge of the History screen, clipped by the screen boundary.
- **Impact:** Either this is an unfinished feature that should be hidden, or it has insufficient padding.
- **Fix:** Either complete the filter/sort feature or hide the element until it's ready.

### H-07: Onboarding shows on every app open (not just first time)
- **Timestamp:** 0:01–0:04
- **What happens:** The 3-step onboarding modal ("See what's in your feed" → "Scan any platform" → "Get insights") appears over the home screen at app open. This user already has 4 scans in history — they are NOT a first-time user. The onboarding should only show once.
- **Impact:** Returning users are annoyed by repeated onboarding. It blocks immediate access to the app.
- **Fix:** Store an `onboardingCompleted` flag in AsyncStorage. Only show onboarding when the flag is false or absent.

### H-08: "Scan today to start a new streak" despite having scanned today
- **Timestamp:** 1:40
- **What happens:** After completing a scan (which shows "YouTube · Just now · 14 posts" in the Last Scan card), the Streak card still says "Streak paused — Scan today to start a new streak." The user literally just scanned.
- **Impact:** Direct contradiction between what the user did and what the app says.
- **Fix:** Streak logic must check if any scan was completed today. If yes, show the active streak count.

### H-09: Home screen subtitle inconsistency
- **Timestamp:** 0:05 vs 0:98
- **What happens:** At session start, subtitle reads "Welcome back — ready for a fresh scan?" At 0:98 (after scan, sliding transition), it reads "See what's in your social media feed" — a different subtitle for the same screen.
- **Impact:** Inconsistent copy on the same screen. Minor but noticeable.
- **Fix:** Pick one subtitle and stick with it, or make the logic deterministic (e.g., first-time users see one, returning users see another).

### H-10: Dashboard "Youtube" capitalization error
- **Timestamp:** 0:10
- **What happens:** Dashboard header reads "Youtube (5 posts)" — the 'T' in YouTube should be capitalized. It's a trademark.
- **Fix:** Change to "YouTube" everywhere in the codebase. Grep for "Youtube" (case-sensitive) and fix all instances.

### H-11: Platform picker bottom sheet has no scroll indicator
- **Timestamp:** 0:60–0:65
- **What happens:** The platform picker bottom sheet shows all 6 platforms and the mode toggle, but the sheet has no visual scroll indicator to hint that the mode toggle is below the fold. Users who don't scroll might miss the mode selection entirely.
- **Impact:** Users could unknowingly start a scan in the wrong mode.

### H-12: Scan complete screen appears behind home screen during transition
- **Timestamp:** 0:98
- **What happens:** When navigating from Scan Complete to Home, both screens are visible simultaneously during the transition — the Scan Complete screen on the left, Home screen on the right. The Scan Complete content (stats cards, buttons) is partially visible alongside the Home screen's greeting and cards.
- **Impact:** Visual glitch during navigation. Looks unpolished.
- **Fix:** Ensure screen transition uses a full-screen push/pop animation rather than a side-by-side reveal.

---

## MEDIUM — Should Fix

### M-01: Onboarding modal "Skip" option on first two screens but not third
- **Timestamp:** 0:01–0:03
- **What happens:** Steps 1 and 2 show "Next" button + "Skip" text link. Step 3 shows only "Get Started" button with no skip. Inconsistent — though the last step naturally is "Get Started," the removal of Skip is slightly jarring.

### M-02: Onboarding blocks view of home screen content
- **Timestamp:** 0:01
- **What happens:** The home screen is visible behind the onboarding modal (dimmed), but all interactive elements are blocked. The "Last scan: YouTube · 3h ago" card is partially visible below the modal.

### M-03: History "Low sample (aim for 10+)" threshold labels
- **Timestamp:** 0:50
- **What happens:** Both visible scans show "Low sample (aim for 10+)" in a red badge. The YouTube scan has 5 posts (clearly low) and the Instagram scan has 8 posts (also below 10). This is actually good — it educates users on sample quality.
- **Note:** This is an improvement from V1. The threshold is now explicit and helpful.

### M-04: Settings "Data & Privacy" text still partially clipped
- **Timestamp:** 0:21, 0:25
- **What happens:** The Data & Privacy section text is visible in full: "AlgorithmLens analyzes your feed content to show you its composition. We never collect passwords, login credentials, or personally identifiable information. Your data is not used to train AI models." This appears to be fixed from V1 — text is no longer truncated mid-sentence. Good.
- **Status:** FIXED from V1.

### M-05: Upgrade modal "Free: —" for most features looks odd
- **Timestamp:** 0:30
- **What happens:** Feature list shows "All 6 dashboard tabs / Free: Overview only", "Unlimited scan history / Free: —", "Longitudinal trend analysis / Free: —", "Priority support / Free: —". The "Free: —" (dash) is not intuitive — it could mean "not available" or "unlimited" depending on interpretation.
- **Fix:** Use "Free: Not included" or a red X icon instead of a dash.

### M-06: Scan overlay panel covers significant screen area
- **Timestamp:** 0:68–0:72
- **What happens:** The scan progress panel at the bottom takes up ~30% of the screen height, showing: status text, instruction text, post count, ads count, timer, and "Keep scrolling" prompt. This significantly reduces the visible feed area for scrolling.
- **Fix:** Consider a more compact panel, or auto-collapse after the user starts scrolling.

### M-07: "Loading YouTube..." text during scan init
- **Timestamp:** 0:68
- **What happens:** The scan screen header shows "YouTube / Loading YouTube..." with a spinner. The loading text disappears once content appears.
- **Note:** This is functional but could show a skeleton or progress bar instead of just a spinner for better perceived performance.

### M-08: Scan timer format inconsistent between header and panel
- **Timestamp:** 0:72
- **What happens:** Header shows "Scanning 0:05" while the panel shows timer "0:05" — these match, which is good. No inconsistency found here.
- **Status:** NO ISSUE.

### M-09: YouTube feed shows Shorts grid before regular feed
- **Timestamp:** 0:72–0:75
- **What happens:** The WebView loads YouTube's home page which shows Shorts thumbnails in a grid, plus regular video recommendations below. The scan captures both formats. Post count goes up as user scrolls.
- **Note:** This is better than V1 where counter stalled at 5. The capture pipeline improvements are working.

### M-10: No visual distinction for different content types
- **Timestamp:** 0:72–0:85
- **What happens:** Shorts and regular videos are both counted as "posts" with no distinction. The scan captures everything as flat post count.
- **Fix:** Consider categorizing captured content (Shorts vs. regular videos vs. ads) for richer dashboard data.

### M-11: Post counter bubble overlaps content
- **Timestamp:** 0:75–0:85
- **What happens:** The minimized scan indicator (blue bubble showing "● 4 0:08", "● 8 0:11", "● 12 0:15", "● 14 0:18") overlaps with video content. It's small but could obscure important UI elements.
- **Fix:** Position the bubble in a safe zone (e.g., top-left or top-right near the header).

### M-12: "Delete Account" remains unstyled and too accessible
- **Timestamp:** 0:25
- **What happens:** "Delete Account" is plain red text directly below "Sign Out" with no visual separation, no confirmation gate shown.
- **Fix:** Add destructive action confirmation or move behind an expandable section.

### M-13: Scan Complete screen excessive white space
- **Timestamp:** 0:90–0:95
- **What happens:** Large blank areas above and below the checkmark/stats. The screen could use an insight preview or dashboard teaser.

---

## LOW — Polish Items

### L-01: Daily tip text is generic and static
- **Timestamp:** 0:07
- **What happens:** "Your scans may show how much of your feed comes from accounts you don't follow — compare across sessions to see if this changes." Same tip as V1 recording (different specific text, but still static).

### L-02: Platform icons all same gray color when unselected
- **Timestamp:** 0:60
- **What happens:** All six platform icons are identical gray circles. No brand colors until selected.

### L-03: YouTube icon gets red ring when selected
- **Timestamp:** 0:65
- **What happens:** YouTube gets a red selection ring — good, this is brand-appropriate.

### L-04: "TikTok" spelled as "TikTok" in picker
- **Timestamp:** 0:60, 0:65
- **What happens:** Spelled correctly. No issue.

### L-05: X platform uses old Twitter bird icon
- **Timestamp:** 0:60
- **What happens:** The X platform shows what appears to be the Twitter bird icon rather than the X logo.
- **Fix:** Update to X logo for brand accuracy.

### L-06: Scan Complete green checkmark doesn't match brand colors
- **Timestamp:** 0:90
- **What happens:** Blue checkmark circle (improved from V1's green) — actually matches brand now.
- **Status:** IMPROVED from V1.

### L-07: "Scan Another Platform" button styling
- **Timestamp:** 0:90
- **What happens:** Now styled as an outline button. Improved from V1's text link.
- **Status:** IMPROVED from V1.

### L-08: No pull-to-refresh indicator on Home or History
- **Timestamp:** Full session
- **What happens:** No pull-to-refresh gesture visible. If data is stale, user has no manual refresh option.

### L-09: Settings lacks visual separators between sections
- **Timestamp:** 0:21
- **What happens:** AI Analysis, Scan Reminders, Data & Privacy, and Account sections are separated only by gray ALL-CAPS headers. No horizontal dividers or spacing.

---

## Accuracy-Specific Findings

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| A-01 | 0% ads on ALL scans (5 total scans visible) | Critical | YouTube and Instagram both serve ads. The classifier is systematically failing to detect any ads. |
| A-02 | 100% Suggested on both YouTube scans | High | May be technically correct for unsubscribed channels, but needs subscription-aware logic to validate. |
| A-03 | Feed Score dropped from 84 to 80 after adding a scan | Medium | Score change is plausible but the direction seems wrong — more data should increase confidence, not change the number. |
| A-04 | 14 posts captured in 18 seconds | Improved | Major improvement from V1 (5 posts in 27 seconds). Capture pipeline is working much better. |

---

## Previous Findings Status

| V1 ID | Status | Notes |
|-------|--------|-------|
| C-01 (SVG crash) | PARTIALLY FIXED | No full crash, but per-tab ErrorBoundary catches error → all tabs show "couldn't load". Root error persists. |
| C-02 (Broadcast in Expo Go) | WORKAROUND APPLIED | Mode is disabled instead of crashing. But needs to actually WORK, not be hidden. |
| C-03 (SVG persists) | PARTIALLY FIXED | No visible Expo error banners, but underlying error still crashes all tab content. |
| C-04 (Payment fails) | UNCLEAR | Upgrade modal redesigned. Checkout attempted but result not visible in recording. |
| C-05 (Crash on first load) | FIXED | App loads cleanly to home screen. Onboarding shows first. |
| C-06 (Try Again loop) | FIXED | Per-tab ErrorBoundary isolates errors. "Go Home" button added. |
| C-07 (Dual error on broadcast) | FIXED | Broadcast mode is disabled before user can trigger it. |
| H-10 (RECOMMENDED on broken mode) | FIXED | "RECOMMENDED" badge removed. "DEV BUILD ONLY" shown instead. |
| H-12 (No nav on error screen) | FIXED | "Go Home" button added to ErrorBoundary. |
| H-14 (Expo error banner) | FIXED | No error banners visible in entire recording. |
| H-16 (iOS alert for upgrade) | FIXED | Proper bottom sheet with features, pricing, CTA. |

---

## Recommended Priority Order

1. **Fix ALL dashboard tabs** (C-01) — Debug the shared error crashing every tab. This is THE blocker.
2. **Make Screen Capture mode actually work** (C-02) — Migrate to Expo dev build with native modules. Non-negotiable.
3. **Fix ad detection** (H-03/A-01) — 0% ads is categorically wrong.
4. **Fix streak logic** (C-04/H-08) — Core engagement mechanic is broken.
5. **Fix dashboard data staleness** (C-03) — Dashboard must show newest scan data.
6. **Fix onboarding showing repeatedly** (H-07) — Should only show once.
7. **Fix greeting name** (H-01) — Parse display name, not email prefix.
8. **Fix Feed Score race condition** (H-02) — No flash of "complete X scans" when score exists.
9. **Fix "Youtube" capitalization** (H-10) — Grep and fix everywhere.
10. **Verify checkout flow** (H-05) — Ensure Stripe works end-to-end.
11. Polish everything else — Medium and Low items, in order.

---

## What's Working Well

- **Home screen layout** is clean, well-structured, and informative
- **Onboarding flow** is a great addition — clear 3-step introduction
- **Platform picker** bottom sheet with mode toggle is intuitive
- **Scan overlay** is well-designed with encouraging, positive copy
- **Post capture** is dramatically improved (14 posts in 18s vs 5 in 27s)
- **History cards** with sample quality badges are informative
- **Upgrade modal** is properly designed with features, pricing, and trust signals
- **Per-tab ErrorBoundary** isolates errors gracefully (just needs the underlying error fixed)
- **Tab bar** visible and functional throughout
- **No error banners** visible during normal usage
- **Epistemic restraint** maintained in all copy — no accusatory language
- **Privacy messaging** clear and prominent in Settings

---

*This audit was generated from frame-by-frame analysis of a 1:40 screen recording (100 frames at 1fps). Timestamps are approximate (±1 second).*
