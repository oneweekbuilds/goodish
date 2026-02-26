# AlgorithmLens Mobile App — Visual Audit Report

**Date:** February 24, 2026
**Auditor:** Claude (Automated Visual QA)
**Platform:** Expo Web (Metro bundler at localhost:8082)
**Viewport:** 1440×765 desktop browser (React Native Web rendering)
**Auth:** test@test.com / test1234 (newly created account, no scan data)

---

## Executive Summary

The mobile app renders and functions on web but reveals **47 visual and UX issues** across all screens. The most critical problems center on the onboarding flow being completely broken on web, platform label truncation throughout the app, the peach/salmon outer border artifact on every screen, and several interaction patterns that fail silently. The overall design language is clean and professional, but needs polish before beta.

**Severity Breakdown:**
- Critical (5): Blocks user flow or causes data loss
- Major (14): Significant visual/UX degradation
- Minor (18): Polish items noticeable to attentive users
- Nitpick (10): Perfectionist-level observations

---

## 1. Global Issues (Affect Every Screen)

### CRITICAL

**G-1. Peach/salmon border artifact on every screen**
Every single screen renders with a noticeable peach/salmon colored border around the entire viewport. This appears to be a React Native Web rendering artifact — possibly a `SafeAreaView` background color bleeding through, or a body/root element background. This is the most visually jarring issue in the entire app and makes every screen look broken.
*Recommendation:* Inspect the root layout's `SafeAreaView` or body background color. On web, SafeAreaView insets are zero, so the background shows as a border around content.

**G-2. App renders at full desktop width, not mobile-constrained**
The app fills the entire 1440px browser width. There is no `max-width` constraint or mobile viewport simulation. On desktop browsers, content stretches unnaturally wide — text lines become extremely long (80+ characters), cards span the full width, and the layout looks nothing like a mobile app.
*Recommendation:* Add a root-level `max-width: 428px` (or similar) wrapper with `margin: 0 auto` and a device-frame background for web preview builds.

### MAJOR

**G-3. Tab bar click targets don't respond to mouse clicks**
Clicking the tab bar icons/labels with a mouse does nothing. Tab navigation only works via JavaScript `element.click()` on the `<a>` tags. This means the Expo Router tab bar's `TouchableOpacity`/`Pressable` wrappers aren't translating mouse events to press events on web.
*Recommendation:* Investigate `react-native-web`'s `Pressable` mouse event handling, or add explicit `onClick` handlers for web platform.

**G-4. Tab bar icon and label spacing**
The tab bar renders correctly with 4 tabs (Home, Dashboard, History, Settings) and proper icons. The active tab (blue) and inactive (muted gray) states work well. However, at full desktop width, the 4 tabs are spread extremely far apart with vast empty space between them — they should be grouped closer together.
*Recommendation:* On web, constrain the tab bar width to match the content `max-width`.

### MINOR

**G-5. No status bar simulation on web**
The web preview shows no simulated iOS/Android status bar. This makes it harder to judge how the top of each screen will actually appear on device.
*Recommendation:* For web preview builds, consider adding a mock status bar overlay.

**G-6. Scroll behavior inconsistencies**
`window.scrollBy()` works on the Settings page but the `scroll` computer action times out. React Native Web's ScrollView containers have inconsistent scroll behavior — some respond to mouse wheel, others don't.
*Recommendation:* Ensure all ScrollView components have `overscrollMode` and proper web scroll CSS.

---

## 2. Login Screen

### MAJOR

**L-1. OAuth buttons lack platform logos/icons**
"Continue with Google" and "Continue with Apple" buttons display as plain white rectangles with only text — no Google "G" logo, no Apple logo. This violates both Google's and Apple's brand guidelines for sign-in buttons and reduces user trust.
*Recommendation:* Add SVG icons for Google and Apple. Both companies provide official assets. The Google button should show the multicolor G; the Apple button should show the Apple logo.

**L-2. No visible error feedback on failed sign-in**
Entering invalid credentials (before creating the account) and clicking "Sign In" produced no visible error message, no toast, no shake animation — nothing. The user is left staring at the same form with no indication of what went wrong.
*Recommendation:* The `Alert.alert()` used for auth errors doesn't render on web. Replace with an inline error message below the form fields, or use a cross-platform toast library.

**L-3. "Sign in with email" button unresponsive to initial mouse clicks**
The first several attempts to click "Sign in with email" via mouse did nothing. Only JavaScript `dispatchEvent` worked. This is the same Pressable/TouchableOpacity mouse event issue as G-3.
*Recommendation:* Same fix as G-3 — ensure press handlers work on web.

### MINOR

**L-4. Email field auto-focuses with thick black border**
When the email form appears, the email field has a very heavy black outline on focus. This is likely the browser's default `outline` style, not a custom focus indicator. It's jarring compared to the otherwise soft design.
*Recommendation:* Add custom `:focus` styles that match the app's design language — e.g., a subtle blue border or shadow.

**L-5. No "Forgot password?" link**
The email sign-in form has "Sign In", "Create Account", and "Other sign-in options" but no password recovery option. Users who forget their password have no self-service recovery path.
*Recommendation:* Add a "Forgot password?" link below the password field.

**L-6. "or" divider between OAuth and email is plain text**
The divider between OAuth buttons and "Sign in with email" is just the word "or" in gray. It has no horizontal lines or visual separation. It looks like floating orphan text.
*Recommendation:* Add horizontal rules on either side: `——— or ———` pattern.

### NITPICK

**L-7. Logo icon container has no shadow or depth**
The Eye icon in the blue rounded-square container is flat. Adding a subtle shadow would give it the same depth as other card elements in the app.

**L-8. "See what shapes your feed" tagline font weight**
The tagline uses a light gray that provides good contrast, but could benefit from slightly heavier weight to improve readability at this size.

---

## 3. Onboarding Flow

### CRITICAL

**O-1. Horizontal ScrollView pagination completely broken on web**
The 3-screen onboarding flow uses a horizontal `ScrollView` with `pagingEnabled`. On web, `scrollTo()` does not work — clicking "Next" doesn't advance the page. Clicking "Skip" also calls `scrollTo()` internally and fails. The only way to progress is via DOM manipulation (`scrollDiv.scrollLeft = 2880`), which doesn't update React's `currentPage` state.
*Recommendation:* This is a fundamental React Native Web limitation. Replace with a web-compatible carousel (e.g., `react-native-pager-view` which has web support, or conditional rendering with fade transitions on web).

**O-2. React state desyncs from DOM scroll position**
Even when manually scrolling the DOM to page 3, the `currentPage` state remains 0. This means the dot indicators show the wrong page, and the conditional button rendering shows "Next" (page 0's button) instead of "Let's go" (page 2's button). The "Let's go" button is only accessible because it exists in the DOM but is layered behind/beside the "Next" button.
*Recommendation:* The `onMomentumScrollEnd` handler that updates `currentPage` never fires on web. Add a `onScroll` handler with debouncing as a web fallback.

### MAJOR

**O-3. Platform labels truncated with ellipsis on Screen 3**
On the "Start your first scan" screen, platform labels are truncated: "Instag...", "Twitte...", "YouTu...", "Faceb...". Only "TikTok" and "Reddit" fit without truncation. This looks broken and unprofessional.
*Recommendation:* The fixed-width platform icon containers are too narrow. Either increase the width, use smaller font size for labels, or abbreviate intentionally (e.g., "IG", "X", "YT", "FB").

**O-4. TikTok uses Music icon instead of TikTok logo**
The TikTok platform uses the `Music` (musical note) icon from lucide-react-native. While this is a recognizable placeholder, it doesn't match TikTok's actual branding and may confuse users.
*Recommendation:* Use a custom TikTok SVG icon, or at minimum the `Music2` icon which is slightly more recognizable.

**O-5. No way to go back to a previous onboarding screen**
There's no back button or swipe-back gesture. If a user accidentally advances past a screen, they can't review it.
*Recommendation:* Add a back arrow in the top-left, or enable swipe-to-go-back on the horizontal ScrollView.

### MINOR

**O-6. Dot indicators don't update when scrolling on web**
The 3 dot indicators at the bottom always show the first dot as active (blue, wider) regardless of which page is visible. This is a consequence of O-2 — the `currentPage` state doesn't update.
*Recommendation:* Same fix as O-2.

**O-7. Screen 2 step icons are very small and left-aligned**
On "How it works" screen, the Smartphone, ScrollText, and BarChart3 icons are small (~16px) and positioned far to the left edge. On a full-width desktop render, the text starts near the left edge with vast empty space to the right. The layout feels unbalanced.
*Recommendation:* Center the content block, or constrain max-width.

**O-8. Screen 1 has excessive vertical whitespace**
Between the subtitle ("A clear picture of what appears...") and the dot indicators, there's roughly 300px of empty space. This is because the screen is designed for mobile height but renders in a short desktop viewport.
*Recommendation:* Use `flex: 1` with `justifyContent: 'space-between'` instead of fixed spacing, or clamp the height.

### NITPICK

**O-9. Screen 1 concentric circles graphic not visible on web**
The decorative concentric blue circles behind the Eye icon on Screen 1 are very faint — barely visible against the light background.
*Recommendation:* Increase opacity or contrast of the decorative circles.

**O-10. "Let's go" button text uses a smart apostrophe inconsistency**
The button reads "Let's go" in the code with a standard apostrophe, but verify rendering across platforms for consistent typography.

---

## 4. Home Screen

### MAJOR

**H-1. "Good morning, test" — raw email prefix used as display name**
The greeting shows "Good morning, test" — using the email prefix (test from test@test.com) as the user's name. For a real user with email "john.doe.2024@gmail.com", this would show "Good morning, john.doe.2024" which looks terrible.
*Recommendation:* During onboarding or sign-up, collect a display name. Fall back to "there" or "friend" if no name is set, never use the email prefix.

**H-2. "Scan Your Feed" button has no platform picker context**
The big blue "Scan Your Feed" CTA doesn't indicate which platform will be scanned. The user must presumably choose a platform after clicking, but there's no preview of that step.
*Recommendation:* Either show the platform picker directly on the home screen (like onboarding Screen 3 does), or label the button "Choose a Platform to Scan".

### MINOR

**H-3. Streak card shows "Start your streak" with sparkle icon**
The streak card says "Scan once to begin tracking your feed awareness." This is good empty-state copy, but the sparkle icon is very small and hard to identify. Consider using a more recognizable icon like a flame or calendar.

**H-4. Feed Score card empty state text is long**
"You'll see your weekly feed health score here after your second scan. Each scan adds to the picture." — This is 2 sentences when 1 would suffice. Consider: "Complete 2 scans to see your Feed Score."

**H-5. DailyTipCard "DID YOU KNOW?" label is uppercase**
The "DID YOU KNOW?" overline uses `TYPOGRAPHY.overline` which renders as all-caps. This is a design choice but reads as slightly aggressive/shouty compared to the rest of the calm UI.
*Recommendation:* Consider "Did you know?" in sentence case, or "Daily tip" as a softer label.

### NITPICK

**H-6. No pull-to-refresh visual indicator on web**
While pull-to-refresh was implemented in the code, on web there's no visual indicator that pulling down would refresh content.

**H-7. The scan icon (crosshairs) in the blue button is small**
The `ScanLine` icon next to "Scan Your Feed" text is relatively small compared to the button size. Increasing it by 2-4px would improve visual balance.

---

## 5. Dashboard Screen (Empty State)

### MAJOR

**D-1. Empty state uses a different CTA color than Home**
The Dashboard empty state "Start Your First Scan" button is **teal/green** (`#10b981`-ish), while the Home screen's "Scan Your Feed" button is **blue** (`#2563eb`). This inconsistency is confusing — are these different actions? The same action should use the same color.
*Recommendation:* Unify all scan CTA buttons to the same primary blue.

**D-2. No tab strip visible in empty state**
The Dashboard shows "Your Dashboard / No scans yet" with a single empty-state card, but doesn't show the 6 tab strip (Overview, Sources, Ads & Promos, Political, Tone, Suggested vs. Followed). New users don't know what tabs exist or what the dashboard will look like with data.
*Recommendation:* Show the tab strip even in empty state (disabled/grayed), so users understand the dashboard's structure. This also serves as a teaser for the product's depth.

### MINOR

**D-3. "No scans yet" subtitle is flush left under "Your Dashboard"**
The subtitle "No scans yet" appears directly under the title but in a much smaller, lighter font. It looks like a rendering label rather than intentional UX copy.
*Recommendation:* Consider removing the subtitle in empty state, or replacing with something more informative like "Complete your first scan to unlock insights."

**D-4. Search icon in empty state is very faint**
The circular icon above "No scans yet" appears to be a magnifying glass in a very light blue circle. It's barely visible and doesn't clearly communicate "no data yet."
*Recommendation:* Use a more distinctive empty-state illustration — perhaps the AlgorithmLens eye icon with a dashed circle, or a telescope/binoculars metaphor.

**D-5. Excessive vertical space above and below empty state card**
The empty state content is vertically centered in the viewport with massive margins. This wastes space and pushes the CTA button below the fold on smaller screens.
*Recommendation:* Position the empty state in the upper third of the screen.

---

## 6. History Screen (Empty State)

### MINOR

**Hi-1. Consistent empty state messaging**
The History screen shows "No scans yet / Your scan history will appear here after you complete your first scan." followed by a blue "Start a Scan" button. This is well-done — clear, actionable, and uses the correct primary blue color (unlike Dashboard's teal).

**Hi-2. Clock icon in empty state circle is very small**
The clock icon is inside a faint circular container. At the current scale it's hard to identify. Consider increasing the icon size.

**Hi-3. "Scan History" title has no subtitle in normal state**
When the history has scans, the page title just says "Scan History" with no explanation. For new users, a subtitle like "Review your past feed analyses" would help orient them.

---

## 7. Settings Screen

### MAJOR

**S-1. "Upgrade to Plus" card dominates the entire above-the-fold area**
The blue "Upgrade to Plus" promotional card takes up roughly 70% of the visible viewport on the Settings screen. The actual settings (AI Analysis, Scan Reminders, etc.) are pushed below the fold. For a settings screen, this is an aggressive upsell placement.
*Recommendation:* Reduce the Plus card size — make it a slim banner rather than a massive card. Or move it below the core settings sections.

**S-2. Push notifications toggle appears disabled with no explanation**
The "Push notifications" toggle is in the off position with a gray track. There's no explanatory text about what notifications the user would receive, or how to enable them. On web, push notifications may not be supported — this should be communicated.
*Recommendation:* Add helper text: "Get reminders to scan your feed" and if on web, show "Available on iOS and Android" with the toggle disabled.

### MINOR

**S-3. Scan Reminders section has no frequency options visible**
The "SCAN REMINDERS" section only shows a "Push notifications" toggle. Per the code, there should be a frequency picker ("Daily", "Every few days", "Weekly") that appears when notifications are enabled. This isn't visible because notifications are off — but there's no indication more options exist.
*Recommendation:* Show the frequency options in a collapsed/preview state with a note "Enable notifications to customize."

**S-4. "AI ANALYSIS" section heading is all-caps**
All section headings (AI ANALYSIS, SCAN REMINDERS, DATA & PRIVACY, ACCOUNT, ABOUT) use all-caps styling. While this is a common iOS settings pattern, it's inconsistent with the rest of the app's more casual tone.
*Recommendation:* This is acceptable for a settings screen, but ensure the letter-spacing and font weight match iOS conventions (light weight, generous spacing).

**S-5. Data & Privacy text is dense**
"AlgorithmLens collects data about your feed content to provide insights. We never collect personal information, passwords, or login credentials. Your data is stored securely in our cloud infrastructure." — This is good informational text, but it's long for a settings row. Consider linking to a dedicated privacy page.

**S-6. No "Delete Account" option**
The Account section shows Email and Sign Out, but no option to delete the account. App Store and Play Store guidelines require a clear account deletion option.
*Recommendation:* Add a "Delete Account" button in red text at the bottom of the Account section, with a confirmation dialog.

### NITPICK

**S-7. "Part of Goodish — building tools that increase human agency" tagline**
This is a nice brand touch at the bottom. However, "Goodish" is not hyperlinked — users can't learn more about the parent company.
*Recommendation:* Make "Goodish" a tappable link to the company website.

**S-8. App Version "1.0.0" has no build number**
Professional apps typically show "1.0.0 (42)" with a build number. This helps debugging and support.
*Recommendation:* Append the build number from `expo.version` or `eas.buildNumber`.

**S-9. Chevron indicators inconsistent**
"Privacy Policy" and "Terms of Service" have right-chevron `>` indicators, "Website" has an external-link icon. This is actually correct (internal vs. external navigation), but verify the chevron is a proper icon and not a text character.

---

## 8. Tab Bar

### MINOR

**T-1. Active tab indicator is text color only**
The active tab is indicated only by changing the icon and label color to blue. There's no top border, no background highlight, no indicator line. This is subtle and may be missed by users.
*Recommendation:* Add a small indicator dot or a top border line on the active tab.

**T-2. Tab labels are very small at desktop width**
At 1440px width, the tab labels (11px per the code) are tiny relative to the screen. On an actual mobile device this would be appropriate, but on web preview they're hard to read.
*Recommendation:* This is a consequence of G-2 (no max-width constraint). Fix the root cause.

---

## 9. Cross-Cutting Concerns

### Accessibility

**A-1. Tab bar has proper accessibility labels** — Good. Each tab has `tabBarAccessibilityLabel`.
**A-2. DailyTipCard has `accessibilityRole="summary"`** — Good.
**A-3. Onboarding screens lack `accessibilityLabel` on the page indicator dots** — they're decorative but should be labeled for screen readers.
**A-4. Color contrast on the "Upgrade to Plus" card** — The white text on blue background appears to meet WCAG AA, but the lighter feature list text may not.

### Performance

**P-1. Multiple Sentry 400 errors in console** — The Sentry SDK is failing to report events (400 status). This means error monitoring is not functioning.
**P-2. Console is noisy** — Multiple Sentry integration logs and React DevTools messages clutter the console.

### Epistemic Restraint Compliance

**E-1. All user-facing text passes epistemic restraint standards** — Verified that DailyTipCard tips use hedging language ("may show", "can reveal", "may look different"). The data privacy text accurately describes data handling without overclaiming security ("stored securely in our cloud infrastructure" — correctly avoiding "encrypted" claim).
**E-2. "See what shapes your feed" on login screen** — This is borderline. "Shapes" implies intentional algorithmic action. Consider "See what appears in your feed" for stricter compliance, or accept as marketing copy (where the bar is lower per CLAUDE.md).

---

## Summary Table

| Screen | Critical | Major | Minor | Nitpick | Total |
|--------|----------|-------|-------|---------|-------|
| Global | 2 | 2 | 2 | 0 | 6 |
| Login | 0 | 3 | 3 | 2 | 8 |
| Onboarding | 2 | 3 | 3 | 2 | 10 |
| Home | 0 | 2 | 3 | 2 | 7 |
| Dashboard | 0 | 2 | 3 | 0 | 5 |
| History | 0 | 0 | 3 | 0 | 3 |
| Settings | 0 | 2 | 4 | 3 | 9 |
| Tab Bar | 0 | 0 | 2 | 0 | 2 |
| Cross-cutting | 1 | 0 | 3 | 1 | 5 |
| **TOTAL** | **5** | **14** | **26** | **10** | **55** |

---

## Top 10 Priority Fixes

1. **G-1** — Fix peach/salmon border artifact (affects every screen)
2. **G-2** — Add max-width constraint for web preview
3. **O-1** — Replace horizontal ScrollView with web-compatible carousel
4. **L-1** — Add Google/Apple logo icons to OAuth buttons
5. **L-2** — Fix error feedback on failed sign-in (Alert.alert doesn't work on web)
6. **D-1** — Unify scan CTA button colors (teal → blue)
7. **G-3** — Fix tab bar mouse click handling on web
8. **O-3** — Fix truncated platform labels on onboarding Screen 3
9. **S-1** — Reduce "Upgrade to Plus" card prominence on Settings
10. **H-1** — Don't use email prefix as display name

---

*This audit was conducted via Expo Web rendering in a desktop browser. Some issues may not manifest on native iOS/Android. A follow-up native device audit is recommended before beta launch.*
