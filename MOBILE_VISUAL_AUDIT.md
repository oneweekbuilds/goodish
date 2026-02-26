# AlgorithmLens Mobile App — Visual + Functional Audit

**Date:** February 24, 2026
**Platform:** iOS (Expo Go)
**App Version:** 1.0.0 (1)
**Recording Duration:** ~1 minute 36 seconds
**Auditor:** Claude (from screen recording analysis)

---

## Executive Summary

The mobile app is in a pre-beta state with **multiple critical blockers** that would prevent any user from completing the core value loop (scan → view dashboard). The Broadcast scan mode is completely non-functional in Expo Go, the Precision (browser) scan completes but **crashes the app when the user tries to view results**, and the payment flow fails with a network error. Beyond these blockers, the app has significant accuracy concerns, numerous UX inconsistencies, and several visual polish issues.

**Total findings: 62**
- Critical: 7
- High: 16
- Medium: 22
- Low: 17

---

## CRITICAL — Blocks Launch

### C-01: Dashboard crashes after scan completion — SVG Render Error
- **Timestamp:** 0:07, 0:60, 1:34
- **What happens:** After completing a Precision scan (5 YouTube posts captured), tapping "View Your Dashboard" triggers a full-screen crash: "Something went wrong — We ran into an unexpected problem." The Expo error log reveals: `Render Error: Expected transform functions but "r" found.` originating from `transformToRn.js` → `extractTransformSvgView` → `Svg.tsx`. The ErrorBoundary catches a `SyntaxError`.
- **Impact:** The entire product value loop is broken. Users can scan but **never see their results**. This is the single most important bug in the app.
- **Root cause:** An SVG component (likely a chart in the dashboard) is receiving malformed transform data. The string `"r"` is being passed where a transform function like `rotate()`, `translate()`, or `scale()` is expected.
- **Recommended fix:** Audit every SVG chart component in the dashboard for transform props. Check if any charting library (react-native-svg, victory-native, etc.) is receiving raw data values instead of transform strings. Add error boundaries around individual chart components so one broken chart doesn't crash the entire dashboard.

### C-02: Broadcast scan mode completely non-functional
- **Timestamp:** 0:45–0:52
- **What happens:** User selects YouTube → Broadcast → taps "Start Broadcasting." Three failure states cascade: (1) Screen transitions to "Broadcast not available" with message: "Screen broadcast requires a development build with native modules. It is not available in Expo Go. Use Precision Mode to scan your feed instead." (2) Simultaneously, an iOS system alert appears: "Couldn't Start Recording — We ran into a problem setting up the recording. Please try again. If this keeps happening, restart the app." (3) The user must dismiss both the alert AND navigate back using the "Go Back" button.
- **Impact:** Broadcast mode is the primary scan mode (labeled "RECOMMENDED" in the UI). It fundamentally cannot work in Expo Go, yet the app prominently offers it.
- **Recommended fix:** Either (a) hide Broadcast mode entirely when running in Expo Go, or (b) disable the Broadcast option with a clear inline explanation — don't let users tap through to a dead end.

### C-03: SVG Render Error persists across entire session
- **Timestamp:** 0:04, 0:30, 0:57, 1:36
- **What happens:** The `Render Error: Expected transform functions but "r" found` appears in the Expo error log at least 4 separate times throughout the recording. It appears both as "Log 1 of 1" (Console Error from ErrorBoundary) and "Log 2 of 2" (Render Error from SVG). This error recurs even after using "Try Again" to recover.
- **Impact:** The underlying SVG parsing bug is not isolated. It contaminates the entire app session and prevents dashboard rendering at all times.
- **Recommended fix:** This is the same root cause as C-01. Fix the SVG transform issue, then verify with a clean app restart that no residual errors remain.

### C-04: Payment/checkout flow fails with network error
- **Timestamp:** 0:25–0:26
- **What happens:** After tapping "Try Free" on the Upgrade to Plus banner → selecting a plan option (Monthly or Annual) from the "Choose Your Plan" modal, the app shows: "Checkout Error — Network request failed." An Expo error banner also appears at the bottom: `Uncaught (in promise, id: 0) TypeError: Net...`
- **Impact:** Users cannot subscribe to Plus even if they want to. Revenue flow is completely broken.
- **Recommended fix:** Verify Stripe integration endpoint URLs. Check if the Stripe checkout session creation API call is correctly configured for the mobile environment. The `TypeError: Network request failed` suggests either a missing/incorrect API URL, CORS issue, or the backend endpoint is down.

### C-05: App shows error state on first load
- **Timestamp:** 0:04–0:08
- **What happens:** Immediately upon opening the recording (which appears to be shortly after app launch or navigation), the Expo error log pops up showing the SVG Render Error, followed by the full-screen "Something went wrong" crash screen. The user has to tap "Try Again" to recover to the home screen.
- **Impact:** First impression is a crash screen. Any new user encountering this would immediately uninstall.
- **Recommended fix:** Same root cause as C-01/C-03. Additionally, ensure the error boundary recovery actually re-renders cleanly without residual error state.

### C-06: "Try Again" recovery leads back to crash loop
- **Timestamp:** 0:07 → 0:09 → 1:34
- **What happens:** After the crash at 0:07, tapping "Try Again" recovers to the home screen. But attempting to view the dashboard later (after scan at 1:30) triggers the exact same crash again. The error boundary doesn't fix the underlying issue — it just resets the UI temporarily.
- **Impact:** Users are stuck in a loop: scan → try to view dashboard → crash → try again → scan again → crash again.
- **Recommended fix:** The error boundary must either (a) fall back to a text-only dashboard view when SVG rendering fails, or (b) catch and handle the specific SVG error at the component level rather than letting it propagate.

### C-07: "Couldn't Start Recording" system alert overlaps "Broadcast not available" screen
- **Timestamp:** 0:45
- **What happens:** When Broadcast mode fails, TWO separate error messages appear simultaneously — the in-app "Broadcast not available" screen AND an iOS system `UIAlertController` saying "Couldn't Start Recording." The user must dismiss both independently. Behind both, the "Go Back" button is partially visible but obstructed.
- **Impact:** Double error state is confusing and janky. Users may think the app is completely broken (which it is for this feature).
- **Recommended fix:** Catch the native broadcast error BEFORE showing it. If `expo-screen-capture` or `react-native-broadcast` throws, handle it silently and only show your custom "Broadcast not available" screen — never allow the iOS system alert to surface.

---

## HIGH — Fix Before Beta

### H-01: "Good afternoon, there" — generic placeholder greeting
- **Timestamp:** 0:00
- **What happens:** Home screen greeting says "Good afternoon, there" instead of the user's name. The account email is `jwjwin0+app1@gmail.com` — the app should parse a display name or at least use the email prefix.
- **Impact:** Feels impersonal and unfinished. The Oura Ring app (the design reference) always greets by name.
- **Recommended fix:** Pull display name from auth profile. If unavailable, parse email prefix (e.g., "Good afternoon, Justin") or omit the name entirely ("Good afternoon").

### H-02: "Last scan" card text truncated with ellipsis
- **Timestamp:** 0:00–0:01
- **What happens:** The Last Scan card on the home screen reads: `Instagram · 1w ago · 8 posts · 0...` — the text is clipped. The "0..." likely represents "0% ads" or "0 ads" but the user can't tell.
- **Impact:** Critical scan summary data is hidden from the user on the primary screen.
- **Recommended fix:** Either (a) allow the card to expand vertically to fit all text, (b) use a two-line layout for the metadata, or (c) use compact labels (e.g., icons for ads/suggested instead of text).

### H-03: "Start your streak" still shows despite 3 completed scans
- **Timestamp:** 0:00
- **What happens:** The home screen shows "Start your streak — Scan once to begin tracking your feed awareness" even though the History tab shows 3 completed scans from Feb 16-17.
- **Impact:** Stale/incorrect gamification state. Undermines trust in the app's data awareness.
- **Recommended fix:** Update streak logic to check scan history count. If scans > 0, show the current streak count (e.g., "2-day streak" or "Streak: 3 scans this week").

### H-04: Feed Score says "Complete 2 scans" despite having 3 scans
- **Timestamp:** 0:00
- **What happens:** The Feed Score card reads "Complete 2 scans to see your Feed Score" but the user already has 3 scans in history.
- **Impact:** Either the Feed Score calculation is broken, or the threshold check doesn't account for existing scans. Either way, a core feature is failing silently.
- **Recommended fix:** Debug why 3 scans don't trigger Feed Score generation. Check if the scans are properly linked to the user account in the database.

### H-05: YouTube Precision scan captures only 5 posts despite many more visible
- **Timestamp:** 0:65–0:88 (scan duration: ~27 seconds)
- **What happens:** The user scrolls through YouTube Shorts for 27 seconds. At least 8 distinct Shorts are visible on screen during the scan (Dress replica, Dad makeup, Baby responses, Marcelo/DECADESHORTS, DormRoom Pranks, Cigarettes/Fake_Habit, Ferret Instincts, NO HANDS trend, Life Hacks, Snow Stove). But the scan summary shows only **5 posts** captured.
- **Impact:** Over 40% of visible content was not captured. The dashboard will show an incomplete picture of the user's feed.
- **Recommended fix:** Investigate the WebView content capture logic. YouTube Shorts use a vertical scroll container — the observer may not be detecting all Shorts as they scroll past. The post detection threshold or scroll event listener may need tuning for Shorts' rapid-fire format.

### H-06: 0% Ads across all scans is almost certainly wrong
- **Timestamp:** 0:11–0:12 (History), 0:90 (Scan Complete)
- **What happens:** All 4 scans visible in the app show 0% ads (three Instagram scans at 0%, 0%, 5%; one YouTube scan at 0%). Instagram and YouTube both serve ads to virtually all users.
- **Impact:** If the ad detection is systematically missing ads, the entire Ads tab of the dashboard is useless. This is a credibility-destroying accuracy failure.
- **Recommended fix:** Review ad classification logic. Instagram ads appear as "Sponsored" label posts — verify the scraper/parser is detecting the "Sponsored" text. YouTube Shorts ads appear between organic Shorts — verify the ad detection criteria for YouTube's ad format.

### H-07: 100% Suggested on YouTube scan needs scrutiny
- **Timestamp:** 0:90
- **What happens:** The Scan Complete screen shows "100% Suggested" for a YouTube Shorts scan. While YouTube Shorts are algorithmically surfaced, this classification may be overly simplistic.
- **Impact:** If the classifier simply marks all YouTube Shorts as "Suggested" without checking if the user is subscribed to any of the channels, the Suggested vs. Followed analysis is meaningless for YouTube.
- **Recommended fix:** For YouTube, check if the user is subscribed to each channel (the "Subscribe" button is visible on each Short — if it says "Subscribed," the post is from a followed account). Currently, all content appears to be from unsubscribed channels, so 100% may be correct for this specific scan, but the system needs the logic to distinguish.

### H-08: Contradictory scan history data
- **Timestamp:** 0:11–0:12
- **What happens:** Three Instagram scans show wildly different metrics: (1) Feb 17: 8 posts, 0% ads, 88% suggested; (2) Feb 16 9:38PM: 14 posts, 0% ads, 86% suggested; (3) Feb 16 8:33PM: 20 posts, 5% ads, **0% suggested**. The third scan shows 0% suggested while the other two show 86-88%. A feed composition doesn't change that dramatically in one hour.
- **Impact:** Users will notice the inconsistency and lose trust. If the classifier can't produce stable results across similar timeframes, the data is unreliable.
- **Recommended fix:** Investigate the Feb 16 8:33PM scan. The 0% suggested result is an outlier — check if there was a parsing error, an API timeout that returned default values, or a different classification prompt version.

### H-09: Scan mode toggle labels are confusing
- **Timestamp:** 0:40, 0:60
- **What happens:** The platform picker shows two scan modes: "Broadcast — Scroll your real app" and "Precision — Text-only via browser." These labels don't clearly explain what each mode does or why a user would choose one over the other.
- **Impact:** Users don't know which to pick. "Broadcast" sounds like it will share their screen publicly. "Precision" sounds better/more accurate but is described as "text-only" which sounds limited.
- **Recommended fix:** Rename to something clearer: "Screen Capture — Record your real feed as you scroll" and "Quick Scan — Analyze text content via built-in browser." Add a brief tooltip or info icon explaining the tradeoff.

### H-10: "Broadcast" mode labeled "RECOMMENDED" despite not working
- **Timestamp:** 0:60
- **What happens:** When the platform picker shows scan modes, the Broadcast option displays a green "RECOMMENDED" badge. But Broadcast doesn't work in Expo Go at all.
- **Impact:** The app actively directs users toward a broken feature.
- **Recommended fix:** Remove the "RECOMMENDED" badge when running in Expo Go. Better yet, hide Broadcast mode entirely (see C-02).

### H-11: Platform picker button disabled with no clear reason
- **Timestamp:** 0:37
- **What happens:** When the "Choose a platform" bottom sheet first opens, the CTA button at the bottom says "Select a platform" and is grayed out / disabled. No platform is pre-selected. The user must tap a platform icon first before the button activates.
- **Impact:** Momentary confusion — "why can't I press the button?" The disabled state isn't visually explained. No hint text says "tap a platform above to continue."
- **Recommended fix:** Either (a) pre-select the most recently scanned platform, or (b) add helper text above the disabled button: "Choose a platform above to get started."

### H-12: No back button or navigation on crash/error screens
- **Timestamp:** 0:07, 1:34
- **What happens:** The "Something went wrong" screen shows only a "Try Again" button. There's no back button, no tab bar, no way to navigate to Settings, History, or any other part of the app. The user is trapped until "Try Again" works.
- **Impact:** If the underlying issue persists (which it does — see C-06), the user is stuck in a dead end with no escape route.
- **Recommended fix:** Show the bottom tab bar on error screens, or add a "Go Home" link alongside "Try Again."

### H-13: Tab bar disappears on scan-related screens
- **Timestamp:** 0:62 (Loading), 0:90 (Scan Complete), 0:07 (Error)
- **What happens:** During the scan loading screen, scan progress, and scan complete screen, the bottom tab bar is not visible. The user can't navigate away mid-scan or from the results screen without using the specific buttons provided.
- **Impact:** Users feel trapped. If a scan is taking too long or they want to check settings, they have no way out.
- **Recommended fix:** Keep the tab bar visible, or at minimum provide an explicit "Cancel" / "Close" / back arrow on all scan-flow screens.

### H-14: Expo error banner leaks into production UI
- **Timestamp:** 0:25, 1:34
- **What happens:** The red/pink Expo development error banner appears at the bottom of the screen showing raw error messages like `Uncaught (in promise, id: 0) TypeError: Net...` and `[ErrorBoundary] Caught error: SyntaxError:...`. These are developer-facing error messages visible in the user's app.
- **Impact:** Exposes internal error details to users. Looks unprofessional and alarming.
- **Recommended fix:** This is an Expo Go development artifact. For production builds, these won't appear. However, for any beta testing in Expo Go, set `__DEV__` LogBox configuration to suppress or minimize these. Also ensure production builds have `LogBox.ignoreAllLogs()` or equivalent.

### H-15: Multiple error types cascade on single failure
- **Timestamp:** 0:25–0:26, 0:45
- **What happens:** A single failure (e.g., checkout network error) produces multiple overlapping error indicators: (1) a modal dialog ("Checkout Error"), (2) an Expo error banner at the bottom, and (3) sometimes an underlying screen error too. Similarly, Broadcast failure shows both an in-app screen AND an iOS system alert simultaneously.
- **Impact:** Error state management is chaotic. Users see 2-3 error messages for one problem.
- **Recommended fix:** Implement a centralized error handling service. One error = one user-facing message. Suppress duplicate indicators. For native errors (like broadcast), intercept them before they surface to the system.

### H-16: "Choose Your Plan" modal uses native iOS alert style
- **Timestamp:** 0:20–0:21
- **What happens:** The upgrade plan selection appears as a native iOS `UIAlertController` with plain text options: "Monthly — $10/month", "Annual — $96/year (save 20%)", "Cancel." It has no visual design, no branding, no feature comparison.
- **Impact:** Critical revenue conversion moment presented in the most generic possible way. No information about what Plus includes, no visual comparison, no trust signals.
- **Recommended fix:** Replace with a custom-designed bottom sheet or full-screen modal showing: feature comparison (Free vs. Plus), pricing with annual savings highlighted, testimonials or social proof, and a branded checkout button. This is the single highest-leverage UX improvement for revenue.

---

## MEDIUM — Should Fix

### M-01: History tab shows skeleton loading with no animation
- **Timestamp:** 0:10
- **What happens:** History tab displays static gray skeleton placeholder blocks while loading. The blocks are static — no shimmer, pulse, or any loading animation.
- **Recommended fix:** Add a shimmer/pulse animation to skeleton placeholders to indicate loading is in progress.

### M-02: History screen has clipped element at top-right
- **Timestamp:** 0:11
- **What happens:** There's a partially visible UI element (appears to be a filter or sort icon) clipped at the top-right edge of the History screen, barely visible.
- **Recommended fix:** Ensure the element is either fully visible with proper padding or hidden if not yet functional.

### M-03: Progress bars on history cards are unexplained
- **Timestamp:** 0:11–0:12
- **What happens:** Each scan history card has a horizontal progress bar at the bottom with green and blue segments. There's no legend, label, or tooltip explaining what the colors represent.
- **Recommended fix:** Add a small legend or tooltip explaining the bar (e.g., green = followed content, blue = suggested content, orange = ads). Or remove the bar if it's not adding value at the card level.

### M-04: "Low sample" / "Fair sample" / "Good sample" labels unexplained
- **Timestamp:** 0:11–0:12
- **What happens:** Each history card has a colored badge: "Low sample" (red), "Fair sample" (yellow), "Good sample" (green). The thresholds are unclear — 8 posts = Low, 14 = Fair, 20 = Good?
- **Recommended fix:** Add a tooltip or info icon explaining what determines sample quality. Consider showing the threshold: "Low sample (8 posts — aim for 15+)."

### M-05: Settings "Data & Privacy" text truncated
- **Timestamp:** 0:15
- **What happens:** The Data & Privacy section text reads: "We analyze feed content for insights. We" — cut off mid-sentence. The full text only becomes visible after scrolling slightly.
- **Recommended fix:** Either show the full text by default (it's short) or add a "Read more" link. Never truncate privacy-related text mid-sentence.

### M-06: Settings has no visual separator between sections
- **Timestamp:** 0:14–0:16
- **What happens:** AI Analysis, Scan Reminders, Data & Privacy, and Account sections run together. The section headers (ALL CAPS gray text) provide some separation, but there are no dividers or spacing to clearly delineate groups.
- **Recommended fix:** Add subtle horizontal dividers or increased vertical spacing between settings groups. Follow the iOS Settings app pattern.

### M-07: "Delete Account" is too accessible and unstyled
- **Timestamp:** 0:16
- **What happens:** "Delete Account" appears as plain red text in the Account section, with no confirmation, no warning, and no visual distinction from "Sign Out" above it. It's a single tap away from a destructive action.
- **Recommended fix:** Add a confirmation dialog with consequences explained. Consider moving it behind a "Danger Zone" expandable section or at least adding vertical spacing between "Sign Out" and "Delete Account."

### M-08: Scan overlay "Scroll past X more posts to save" is confusing
- **Timestamp:** 0:62, 0:65
- **What happens:** During the Precision scan, a purple overlay at the bottom shows "Scroll past 5 more posts to save" which changes to "Scroll past 1 more posts to save." The wording implies posts won't be saved unless you scroll past more — but the scan is already capturing content.
- **Recommended fix:** Clarify the copy: "5 more posts needed for a good sample" or "Keep scrolling — 5 more posts for reliable data." The word "save" is ambiguous (save to phone? save the scan?).

### M-09: Scan post counter stops updating
- **Timestamp:** 0:65–0:88
- **What happens:** The scan overlay shows "5" posts captured and the bubble shows "5" from around 0:70 onward. Despite continuing to scroll through additional Shorts for another 15+ seconds, the counter stays at 5.
- **Recommended fix:** Investigate why additional Shorts after the 5th aren't being detected. The WebView content observer may have timing issues with YouTube's infinite scroll.

### M-10: "Loading Youtube" capitalization error
- **Timestamp:** 0:62
- **What happens:** The loading screen says "Loading Youtube" — the 'T' in YouTube should be capitalized. It's a trademark.
- **Recommended fix:** Change to "Loading YouTube" (capital T).

### M-11: No platform selection visual feedback
- **Timestamp:** 0:37–0:42
- **What happens:** When tapping platform icons in the picker, the selected platform gets a colored ring (YouTube gets red), but the transition is subtle. Unselected platforms show no hover/press state.
- **Recommended fix:** Add a press/scale animation on tap, and make the selected state more prominent (background color change, checkmark, or larger ring).

### M-12: Scan mode cards have inconsistent selection states
- **Timestamp:** 0:40 vs 0:60
- **What happens:** In one view, "Broadcast" is selected (blue background). In another, "Precision" is selected (blue background). The unselected mode has a white/light background with gray border. The visual distinction could be stronger.
- **Recommended fix:** Add an icon change, checkmark, or more dramatic color shift for the selected scan mode.

### M-13: Scan timer format inconsistent
- **Timestamp:** 0:62–0:88
- **What happens:** The scan timer shows "0:01", "0:04", "0:09", etc. This is a non-standard time format — typically you'd see "00:01" or "0m 01s."
- **Recommended fix:** Use "0:01" consistently (current format is actually fine for short durations, but ensure it handles > 1 minute properly, e.g., "1:05" not "0:65").

### M-14: Green "Scanning" indicator color clashes with blue UI
- **Timestamp:** 0:65–0:88
- **What happens:** The scan header shows "Scanning 0:04" in green text with a green dot, while the rest of the app uses blue as its primary color. The green feels jarring and disconnected from the design system.
- **Recommended fix:** Use the app's primary blue for the scanning indicator, or ensure green is an intentional part of the "active/live" state in the design system.

### M-15: YouTube Shorts content not detected as "Shorts" format
- **Timestamp:** 0:65–0:88
- **What happens:** The scan captures YouTube Shorts but doesn't appear to classify them distinctly as short-form video content. The scan treats them the same as any other YouTube post.
- **Recommended fix:** Add content format detection (Short vs. standard video vs. livestream). This is valuable metadata for the Overview and Tone tabs.

### M-16: No loading indicator between scan complete and dashboard
- **Timestamp:** 0:90–1:34
- **What happens:** After tapping "View Your Dashboard" on the scan complete screen, the app immediately crashes. But even if the crash were fixed, there's no loading state shown between the tap and the dashboard appearing.
- **Recommended fix:** Add a loading spinner or skeleton dashboard while analysis data is being prepared.

### M-17: "Scan another platform" link placement
- **Timestamp:** 0:90
- **What happens:** On the scan complete screen, "Scan another platform" is a plain text link below the main CTA button. It has no icon and lower visual prominence than may be appropriate for a key action.
- **Recommended fix:** Style as a secondary button (outline style) rather than a text link, for better touch target and visual balance.

### M-18: History screen doesn't update after new scan
- **Timestamp:** Full session
- **What happens:** The home screen still shows "Last scan: Instagram · 1w ago" throughout the entire session, even after completing a new YouTube scan. The new scan doesn't appear to update the home screen card.
- **Impact:** Stale data on the primary screen.
- **Recommended fix:** Refresh home screen data after scan completion. Invalidate the "Last scan" cache when a new scan is saved.

### M-19: No pull-to-refresh on any screen
- **Timestamp:** Full session
- **What happens:** No pull-to-refresh gesture is visible on the Home, History, or Dashboard screens. If data is stale, the user has no way to force a refresh.
- **Recommended fix:** Add pull-to-refresh on Home and History screens at minimum.

### M-20: "10 more for good data" counter in scan overlay
- **Timestamp:** 0:62
- **What happens:** When the scan starts, the overlay shows "10 more for good data" in red text. This immediately puts the user in a deficit framing — they feel behind before they've started.
- **Recommended fix:** Reframe positively: "Scroll to capture posts" initially, then "Great start! Keep scrolling for more data" once a few are captured.

### M-21: Scan overlay "Minimize" button behavior unclear
- **Timestamp:** 0:62–0:65
- **What happens:** The scan overlay shows a "Minimize" button. It's unclear what minimizing does — does it hide the overlay? Does scanning continue? Users need to know.
- **Recommended fix:** Add a brief tooltip or change the label to "Hide panel — scanning continues."

### M-22: No onboarding or first-use guidance
- **Timestamp:** 0:00
- **What happens:** The app opens to a home screen with cards but no tutorial, walkthrough, or first-scan guidance. A new user would need to figure out the scan flow on their own.
- **Recommended fix:** Add a first-use onboarding flow (3-4 screens explaining: what AlgorithmLens does, how to scan, what you'll see). Or at minimum, make the "Choose a Platform to Scan" CTA more descriptive for first-time users.

---

## LOW — Polish Items

### L-01: "Daily tip" always shows the same tip
- **Timestamp:** 0:00, 0:35, 0:55
- **What happens:** The Daily Tip section on the home screen always shows: "Your Feed Score reflects source diversity, ad density, and content balance in your recent scans." It never changes.
- **Recommended fix:** Implement a rotation of tips based on the user's scan history, or tie tips to the day of the week.

### L-02: Home screen subtitle wraps awkwardly
- **Timestamp:** 0:00
- **What happens:** "See what appears in your social media feed" wraps to a second line with just the word "feed" on line two. It looks orphaned.
- **Recommended fix:** Adjust text or container width to avoid the orphaned word. Consider shortening to "See what appears in your social media feed" on one line at a larger screen width, or rewrite to avoid the break.

### L-03: Scan history month grouping header spacing
- **Timestamp:** 0:11
- **What happens:** "FEBRUARY 2026" header has generous space above but feels crowded against the first card below it.
- **Recommended fix:** Add 8-12px of bottom padding below the section header.

### L-04: Platform icons are visually generic
- **Timestamp:** 0:37, 0:42
- **What happens:** Platform icons (Instagram, Twitter/X, YouTube, TikTok, Facebook, Reddit) are simple line icons in gray circles. They're all the same color and size, making quick visual recognition difficult.
- **Recommended fix:** Use brand colors for platform icons (Instagram gradient, YouTube red, etc.) even in unselected state, but at reduced opacity.

### L-05: Twitter still labeled "Twitter / X"
- **Timestamp:** 0:37
- **What happens:** The platform is labeled "Twitter / X" — this slash format is awkward. X rebranded from Twitter in 2023.
- **Recommended fix:** Label as "X" with the X logo, or "X (Twitter)" if brand recognition is a concern. The slash format looks indecisive.

### L-06: "Upgrade to Plus" banner takes significant vertical space
- **Timestamp:** 0:14
- **What happens:** The blue Upgrade to Plus banner at the top of Settings is tall and prominent, pushing actual settings content down. On smaller phones, it would consume nearly a quarter of the visible area.
- **Recommended fix:** Make the banner more compact (single line) or collapsible/dismissable.

### L-07: Push notifications toggle description is redundant
- **Timestamp:** 0:15
- **What happens:** The toggle is labeled "Push notifications" and the description says "Get reminders to scan your feed. Enable to customize frequency." The "Enable to customize frequency" is conditional text shown while the toggle is OFF — but it reads awkwardly.
- **Recommended fix:** When OFF: "Get periodic reminders to scan your feed." When ON: show the frequency picker.

### L-08: Settings "About" section could be collapsible
- **Timestamp:** 0:16
- **What happens:** App Version, Privacy Policy, Terms of Service, and Website are all permanently visible in the About section, taking up significant scroll space.
- **Recommended fix:** Keep App Version visible; group the legal links into a single "Legal" row that expands on tap.

### L-09: "Part of Goodish" attribution could link more clearly
- **Timestamp:** 0:16
- **What happens:** The bottom of Settings shows "Part of Goodish — building tools that increase human agency." "Goodish" is a blue link, but the sentence feels like a footer more than an interactive element.
- **Recommended fix:** This is fine for launch. Low priority.

### L-10: Scan Complete screen has excessive white space
- **Timestamp:** 0:90
- **What happens:** The Scan Complete screen has large blank areas above and below the content. The green checkmark, stats cards, and buttons are vertically centered but the overall layout feels sparse.
- **Recommended fix:** Add a brief insight sentence below the stats (e.g., "All captured content was from channels you don't follow") or show a preview of the dashboard.

### L-11: Stat cards on Scan Complete have inconsistent text sizing
- **Timestamp:** 0:90
- **What happens:** "5 Posts" and "0% Ads" fit cleanly in their cards, but "100%" wraps to show "100" on one line and "%" on the next, with "Suggested" below. The layout breaks at three digits.
- **Recommended fix:** Use a smaller font size for values > 99%, or abbreviate to "100%" on one line by reducing font size dynamically.

### L-12: Green checkmark icon on Scan Complete doesn't match brand
- **Timestamp:** 0:90
- **What happens:** The green checkmark circle uses a bright, saturated green that doesn't appear elsewhere in the app's color palette (which is primarily blue and white).
- **Recommended fix:** Use the app's primary blue with a check icon, or a more muted green that fits the calm color philosophy from the design system.

### L-13: YouTube WebView shows full YouTube UI chrome
- **Timestamp:** 0:65–0:88
- **What happens:** During Precision scan, the YouTube mobile site loads with its full UI (navigation bar, Shorts tab, Home/Shorts/You tabs at bottom). This creates a confusing double-navigation situation with the app's scan header on top and YouTube's nav at the bottom.
- **Recommended fix:** Consider injecting CSS to hide YouTube's bottom nav bar during scanning, or add a note explaining "You're browsing YouTube inside AlgorithmLens."

### L-14: YouTube Shorts grid shows before transitioning to full-screen
- **Timestamp:** 0:65–0:70
- **What happens:** The WebView initially shows YouTube Shorts as a thumbnail grid, then transitions to full-screen vertical scroll when a Short is tapped. The grid view may not be capturing posts effectively.
- **Recommended fix:** Consider auto-navigating to the Shorts full-screen player view to maximize capture accuracy.

### L-15: No visual indicator of which tab is active on Home
- **Timestamp:** 0:00
- **What happens:** The Home tab is active (blue icon and label) but the transition between tabs has no animation or visual feedback.
- **Recommended fix:** Add a subtle tab switch animation (slide or fade).

### L-16: Scan history cards don't indicate if dashboard is viewable
- **Timestamp:** 0:11
- **What happens:** Each history card shows scan metadata and a right chevron suggesting it's tappable, but there's no indication of whether tapping will work (given that dashboards crash). Users may repeatedly tap and crash.
- **Recommended fix:** (After fixing C-01) Add a dashboard preview thumbnail or "View Results →" label to make the tap target clear.

### L-17: Warning icon on error screen uses bright yellow
- **Timestamp:** 0:07
- **What happens:** The "Something went wrong" screen uses a yellow warning triangle icon. Per the UI/UX philosophy, the app should avoid alarming colors.
- **Recommended fix:** Use a more muted icon — perhaps a blue info circle or a gray illustration — to match the calm, measured design philosophy.

---

## Accuracy-Specific Findings Summary

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| A-01 | 0% ads across 3/4 scans | High | Instagram and YouTube both serve ads. The classifier is systematically missing them. |
| A-02 | 100% Suggested on YouTube | Medium | May be technically correct for Shorts from unsubscribed channels, but needs subscription-aware logic. |
| A-03 | 0% Suggested on one Instagram scan vs 86-88% on others | High | Wildly inconsistent results within 1 hour suggest a parsing or classification error on the Feb 16 8:33PM scan. |
| A-04 | Only 5/8+ posts captured during 27s YouTube scan | High | Over 40% of visible content was missed. The capture pipeline has significant data loss. |
| A-05 | No content-type classification (Shorts vs. regular) | Medium | YouTube Shorts are treated identically to standard videos. Format metadata is lost. |
| A-06 | No tone or political analysis visible | Medium | The scan captures posts but it's unclear if Tone and Politics tabs would have any data (dashboard crashes before we can see). |
| A-07 | Post count discrepancy: scan shows 5, but overlay counter also shows 5 while many more were scrolled past | High | The scanner appears to have a hard cap or detection ceiling that limits capture count. |

---

## Recommended Priority Order

1. **Fix the SVG Render Error** (C-01/C-03/C-05/C-06) — This single bug blocks the entire product.
2. **Hide Broadcast mode in Expo Go** (C-02/C-07/H-10) — Stop directing users to a broken feature.
3. **Fix Stripe checkout** (C-04) — Revenue must work before beta.
4. **Fix post capture count** (H-05/M-09/A-04/A-07) — Accuracy is the product's credibility.
5. **Fix ad detection** (H-06/A-01) — 0% ads is almost certainly wrong.
6. **Fix stale home screen data** (H-03/H-04/H-02/M-18) — Home screen must reflect reality.
7. **Redesign upgrade flow** (H-16) — Revenue conversion requires better than a system alert.
8. **Fix scan history inconsistencies** (H-08/A-03) — Contradictory data destroys trust.
9. **Add error recovery navigation** (H-12/H-13) — Users shouldn't be trapped on error screens.
10. **Polish everything else** — Medium and Low items, in order.

---

## What's Working

- **Home screen layout** is clean and well-structured (when not showing stale data)
- **Platform picker** bottom sheet is a good UX pattern
- **Precision scan WebView** loads YouTube successfully and the scan overlay is well-designed
- **Scan progress indicators** (timer, post count bubble) provide useful real-time feedback
- **Scan Complete screen** is clear and celebratory
- **Settings page** is well-organized with appropriate sections
- **Tab bar** navigation works reliably across Home, Dashboard, History, Settings
- **History cards** show useful at-a-glance scan metadata with color-coded badges
- **Overall visual design** follows the calm, measured aesthetic described in the design philosophy
- **Epistemic restraint** in copy is well-maintained — no accusatory or speculative language observed
- **Privacy transparency** in Settings ("Your data is not used to train AI models") is good

---

*This audit was generated from frame-by-frame analysis of a 1:36 screen recording. Some findings may require code-level investigation to confirm root causes. Timestamps are approximate (±1 second).*
