# Cowork Prompt — AlgorithmLens Mobile V2 Fixes

Copy-paste each numbered prompt into a separate Cowork session. Execute them in order. Prompt 1 is the most critical. Prompt 2 is non-negotiable and may take the longest.

---

## PROMPT 1: Fix All Dashboard Tabs Crashing

```
You are fixing critical bugs in the AlgorithmLens React Native mobile app (Expo). Read every skill file in the algorithm-lens plugin before starting. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read the full MOBILE_VISUAL_AUDIT_V2.md file at the repo root first. You are fixing finding C-01.

## THE PROBLEM

ALL six dashboard tabs (Overview, Sources, Ads & Promos, Political, Tone, Suggested vs. Followed) display "This section couldn't load" with the per-tab ErrorBoundary catching an error. This means every tab content component crashes during rendering. The previous fix (changing a ChevronDown CSS transform string to RN array syntax in PoliticsContent) was NOT sufficient — the error is in shared code that ALL tabs use.

## YOUR MISSION

Find and fix every render-crashing bug in the dashboard tab content components. The dashboard MUST render actual content — charts, stats, breakdowns — not error fallbacks.

## DEBUG STRATEGY

1. First, add temporary `console.error` logging to the ErrorBoundary's `componentDidCatch` in `src/components/ErrorBoundary.tsx` to capture the ACTUAL error message and full stack trace. Log both `error.message` and `errorInfo.componentStack`.

2. Open `app/(tabs)/dashboard.tsx` and trace every component rendered by each tab:
   - OverviewContent
   - SourcesContent
   - AdsContent
   - PoliticsContent
   - ToneContent
   - SuggestedContent

3. For EACH component, search for:
   - Any SVG components (from lucide-react-native, react-native-svg, victory-native, or any charting library)
   - Any `transform` prop or style that uses CSS string syntax instead of RN array syntax
   - Any `style` prop that passes web-only CSS properties
   - Any component that might throw during render (e.g., accessing properties on undefined/null data)

4. Common patterns that crash react-native-svg on mobile:
   - `transform: 'rotate(Xdeg)'` → must be `transform: [{ rotate: 'Xdeg' }]`
   - `transform: 'translate(X, Y)'` → must be `transform: [{ translateX: X }, { translateY: Y }]`
   - `transform: 'scale(X)'` → must be `transform: [{ scale: X }]`
   - ANY string-based transform on an SVG element
   - `style={{ transform: someString }}` on lucide icons
   - Charting libraries that internally generate SVG with web transforms

5. Also check for null/undefined data access:
   - If `dashboardData` has missing fields, components may throw `TypeError: Cannot read property 'X' of undefined`
   - Check every data access pattern: `data.overview?.sources`, `data.politics?.ideology`, etc.
   - Add null checks and fallback empty states for missing data

6. GREP the ENTIRE `mobile/` directory for these patterns:
   ```
   transform: 'rotate
   transform: "rotate
   transform: 'translate
   transform: "translate
   transform: 'scale
   transform: "scale
   transform: `rotate
   transform: `translate
   transform: `scale
   ```
   Fix EVERY instance found.

7. Also grep for any charting or SVG visualization imports and inspect their usage:
   ```
   import.*from.*victory
   import.*from.*react-native-svg
   import.*from.*react-native-chart
   import.*from.*lucide-react-native
   ```

8. Check if any shared component file (like a chart wrapper, progress bar, or stat card) has SVG rendering issues.

## VERIFICATION CHECKLIST — Do not stop until ALL pass:
- [ ] Navigate to Dashboard tab — Overview tab renders actual content (charts, stats, not "couldn't load")
- [ ] Tap Sources tab — renders content
- [ ] Tap Ads & Promos tab — renders content
- [ ] Tap Political tab — renders content
- [ ] Tap Tone tab — renders content
- [ ] Tap Suggested vs. Followed tab — renders content
- [ ] grep the entire mobile/ directory for CSS-style transform strings — zero results
- [ ] Run `npx tsc --noEmit` — no new TypeScript errors
- [ ] If the root cause was null data, add appropriate empty states with "No data yet" messaging
```

---

## PROMPT 2: Make Screen Capture (Broadcast) Mode Actually Work

```
You are making the Screen Capture scan mode functional in the AlgorithmLens React Native mobile app. Read every skill file in the algorithm-lens plugin before starting. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read the full MOBILE_VISUAL_AUDIT_V2.md file at the repo root first. You are fixing finding C-02. This is NON-NEGOTIABLE — Screen Capture mode must actually work. Take as long as you need. No compute limits.

## CONTEXT

Screen Capture (formerly "Broadcast") mode is the PRIMARY, DIFFERENTIATED feature of AlgorithmLens mobile. It lets users record their actual social media feed as they scroll through their real app (Instagram, YouTube, TikTok, etc.), then processes the recording into dashboard analytics.

Currently, Screen Capture mode is DISABLED in Expo Go with a "DEV BUILD ONLY" badge because native screen capture modules aren't available in the Expo Go runtime. The V1 fix intentionally gated this to prevent crashes, but the real fix is to make it work.

## THE FUNDAMENTAL PROBLEM

Expo Go is a pre-built app that only includes a fixed set of native modules. Screen recording/broadcast requires native iOS APIs (ReplayKit) that are NOT bundled in Expo Go. To use native modules like screen capture, the app must run as an **Expo development build** (custom dev client) instead of Expo Go.

## YOUR MISSION

Make Screen Capture mode fully functional by migrating the app from Expo Go to an Expo development build. This is a multi-step process:

### PHASE 1: Understand the current broadcast implementation

1. Read ALL files in `src/hooks/useBroadcast.ts` (or similar broadcast hook)
2. Read `src/components/broadcast/BroadcastOverlay.tsx`
3. Read `src/components/broadcast/BroadcastPickerButton.tsx`
4. Read `app/broadcast/[platform].tsx`
5. Read `src/types/broadcast.ts`
6. Identify what native modules the broadcast system depends on:
   - `expo-screen-capture`?
   - `react-native-screen-capture`?
   - A custom native module?
   - ReplayKit integration?
7. Document what the broadcast flow is SUPPOSED to do:
   - User selects platform → Screen Capture mode
   - iOS presents a system broadcast picker (RPSystemBroadcastPickerView)
   - User starts screen recording
   - User switches to their social media app and scrolls
   - User returns to AlgorithmLens and stops recording
   - App processes the recorded video into analyzable data
   - Results populate the dashboard

### PHASE 2: Set up Expo development build

1. Check if `app.json` or `app.config.js` already has the right configuration for development builds
2. Run `npx expo install expo-dev-client` if not already installed
3. Check the `ios/` directory — does it exist? If not, run `npx expo prebuild --platform ios`
4. Ensure all native module dependencies are in `package.json`:
   - `expo-dev-client`
   - `expo-screen-capture` (or whatever the broadcast system uses)
   - Any other native modules the app needs
5. Update `app.json`/`app.config.js` with any required iOS permissions:
   - `UIBackgroundModes: ["processing"]` or broadcast-related keys
   - Any Info.plist entries needed for ReplayKit
6. Generate the native iOS project: `npx expo prebuild --platform ios --clean`
7. Provide the EXACT commands needed to build and run the development build:
   ```
   npx expo run:ios
   ```
   or
   ```
   eas build --platform ios --profile development
   ```

### PHASE 3: Fix the Expo Go gating

1. In `src/components/home/ModeToggle.tsx`:
   - Remove the `isExpoGo` check that disables Screen Capture
   - Remove the "DEV BUILD ONLY" badge
   - Remove the `isBroadcastDisabled` logic that combines `isAndroid || isExpoGo`
   - Keep the Android-only check (Android MediaProjection still not implemented)
   - Restore Screen Capture as the selectable, default option on iOS
   - Restore the "RECOMMENDED" badge on Screen Capture

2. In `src/components/home/PlatformBottomSheet.tsx`:
   - Remove the `isExpoGo` default mode override
   - Default back to `'broadcast'` (Screen Capture) on iOS

3. In `app/broadcast/[platform].tsx`:
   - Remove the Expo Go guard `useEffect` that shows an Alert and redirects

4. Clean up the mode toggle labels:
   - "Screen Capture" → Keep this label (it's clearer than "Broadcast")
   - Description: "Record your real feed as you scroll"
   - "Quick Scan" → Keep this label
   - Description: "Analyze content via built-in browser"

### PHASE 4: Verify the broadcast pipeline works end-to-end

1. Does `BroadcastPickerButton` render the iOS `RPSystemBroadcastPickerView`?
2. Does the broadcast session properly initialize and track status?
3. Does the recorded video get processed into analyzable data?
4. Does the data flow correctly into the dashboard?
5. Test error handling — what happens if the user denies screen recording permission?

### PHASE 5: Write developer setup documentation

Create or update a `DEVELOPMENT_BUILD_SETUP.md` file that explains:
- Why the app needs a development build (not Expo Go)
- Exact steps to build and run on iOS simulator and physical device
- Required Apple Developer account setup
- How to switch between development build and Expo Go for other testing
- Troubleshooting common issues

## IMPORTANT NOTES

- The founder (Justin) does not write code — he tests via Expo Go on his physical iPhone. After this migration, he will need to install a development build instead. Make the setup process as simple as possible.
- If EAS Build is the easiest path, provide the exact `eas.json` configuration.
- If local building is possible, provide the exact Xcode/command-line steps.
- The "DEV BUILD ONLY" badge should NEVER appear in any build that Justin runs.
- Screen Capture should be the default recommended scan mode on iOS.

## VERIFICATION CHECKLIST — Do not stop until ALL pass:
- [ ] `expo-dev-client` is installed and configured
- [ ] Native iOS project generates cleanly with `npx expo prebuild`
- [ ] ModeToggle shows Screen Capture as enabled and RECOMMENDED on iOS
- [ ] No "DEV BUILD ONLY" or "Requires development build" text anywhere
- [ ] `app/broadcast/[platform].tsx` has no Expo Go guard
- [ ] BroadcastPickerButton renders the iOS system broadcast picker
- [ ] Build commands are documented and tested
- [ ] `npx tsc --noEmit` — no new TypeScript errors
- [ ] DEVELOPMENT_BUILD_SETUP.md exists with clear setup instructions
```

---

## PROMPT 3: Fix Streak Logic, Stale Data, and Onboarding Persistence

```
You are fixing engagement and data freshness bugs in the AlgorithmLens React Native mobile app. Read every skill file in the algorithm-lens plugin before starting. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read the full MOBILE_VISUAL_AUDIT_V2.md file at the repo root first. You are fixing findings C-03, C-04, H-02, H-07, H-08, H-09.

## BUG 1: Streak logic broken (C-04, H-08)

The streak card shows "Streak paused — Scan today to start a new streak" even AFTER the user completes a scan. After a scan it briefly flashes "Start your streak — Scan once to begin tracking your awareness" then reverts to "Streak paused." The user has 5+ scans in history but the streak never activates.

### Fix instructions:
1. Find the streak logic — likely in a hook, context, or utility file
2. The streak should work like this:
   - If user has scanned TODAY → show active streak (e.g., "1-day streak" or "Streak active")
   - If user scanned yesterday → show streak count (consecutive days)
   - If user hasn't scanned today but has recent history → show "Streak paused — scan today to continue"
   - If user has never scanned → show "Start your streak — scan once to begin"
3. After a scan completes, the home screen MUST immediately reflect the updated streak
4. The streak calculation must check the actual scan history timestamps, not a separate counter

## BUG 2: Dashboard shows stale data (C-03)

The dashboard header shows "Feb 24, 2026 at 4:24 PM — Youtube (5 posts)" from a PREVIOUS scan, not the most recent one. After completing a new 14-post scan, the dashboard still shows old data.

### Fix instructions:
1. Find how the dashboard loads its data — likely from AsyncStorage, a data store, or Supabase
2. When navigating to Dashboard from Scan Complete, the newest scan data must be loaded
3. If the dashboard loads by default (via tab bar), it should show the most recent scan
4. Add a data refresh mechanism when the Dashboard tab gains focus

## BUG 3: Feed Score flash/race condition (H-02)

Feed Score shows "84 Balanced" at session start. After a new scan, it briefly flashes "Complete 2 scans to see your Feed Score" before settling on "80 Balanced." The flash of the incomplete state is a loading race condition.

### Fix instructions:
1. Feed Score component must not render the "Complete X scans" state while loading
2. Use a loading/skeleton state until data is confirmed
3. If a Feed Score already exists, never show the "complete X scans" prompt — only show it when no score has been calculated yet

## BUG 4: Onboarding shows on every app open (H-07)

The 3-step onboarding modal appears even for users with scan history. It should only show once.

### Fix instructions:
1. Add an `onboardingCompleted` flag in AsyncStorage
2. Set it to `true` when the user taps "Get Started" on the last step or "Skip" on any step
3. On app load, check the flag before showing the modal
4. Never show onboarding if the user has any scan history (belt-and-suspenders check)

## BUG 5: Home subtitle inconsistency (H-09)

Home screen shows "Welcome back — ready for a fresh scan?" at session start but "See what's in your social media feed" after returning from a scan. Pick one.

### Fix instructions:
1. Find where the subtitle is set — likely conditional logic in the home screen component
2. Use deterministic logic:
   - If user has scan history: "Welcome back — ready for a fresh scan?"
   - If user has never scanned: "See what's in your social media feed"
3. Don't change the subtitle within a single session

## VERIFICATION CHECKLIST:
- [ ] Complete a scan → return to Home → streak shows "1-day streak" or equivalent active state
- [ ] Complete a scan → tap Dashboard → dashboard shows the NEW scan data (not old)
- [ ] Feed Score never flashes "Complete X scans" when a score already exists
- [ ] Close and reopen the app after completing onboarding → onboarding does NOT reappear
- [ ] Home subtitle is consistent within a session
- [ ] Run `npx tsc --noEmit` — no new TypeScript errors
```

---

## PROMPT 4: Fix Greeting Name, Capitalization, and UI Polish

```
You are fixing user-facing text and UI polish issues in the AlgorithmLens React Native mobile app. Read the algorithm-lens epistemic-restraint and ui-ux-philosophy skill files before starting. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read MOBILE_VISUAL_AUDIT_V2.md. You are fixing: H-01, H-06, H-10, H-11, M-05, M-12, L-05, L-09.

## FIX 1: "Good evening, Jwjwin" → use real name (H-01)

1. Find where the greeting name is set (likely from Supabase auth user profile)
2. Use `user.user_metadata.display_name` or `user.user_metadata.full_name` if available
3. If no display name exists, use just "Good evening" with no name
4. NEVER parse the email address to extract a "name"

## FIX 2: History screen clipped element at top-right (H-06)

1. Open the History screen component
2. Find the partially visible element at the top-right edge
3. Either add proper padding so it's fully visible, or hide it if it's not functional yet

## FIX 3: "Youtube" → "YouTube" capitalization (H-10)

1. Grep the ENTIRE mobile/ directory for case-sensitive "Youtube" (capital Y, lowercase t)
2. Replace every instance with "YouTube" (capital Y, capital T)
3. Check: display strings, constants, type definitions, comments, everywhere

## FIX 4: Platform picker scroll hint (H-11)

1. If the mode toggle is below the fold in the platform picker bottom sheet, add a visual scroll indicator or auto-scroll to show both the platform grid and mode toggle

## FIX 5: Upgrade modal "Free: —" clarity (M-05)

1. In the upgrade/paywall bottom sheet component
2. Replace "Free: —" with "Free: Not included" or use a visual indicator (gray X icon)

## FIX 6: "Delete Account" confirmation gate (M-12)

1. In Settings, add a confirmation dialog before Delete Account action
2. Dialog should explain consequences: "This will permanently delete your account and all scan history. This cannot be undone."
3. Require typing "DELETE" or similar confirmation

## FIX 7: X platform icon (L-05)

1. The X (Twitter) platform uses the old Twitter bird icon
2. Update to the X logo, or use a generic text "X" icon if the X logo isn't available in lucide

## FIX 8: Settings section separators (L-09)

1. Add subtle horizontal dividers or increased spacing between Settings sections
2. Follow iOS Settings app pattern: light gray divider lines between groups

## VERIFICATION:
- [ ] Home screen greeting shows "Good evening" (no email-parsed name) or display name if set
- [ ] History screen has no clipped elements
- [ ] grep for case-sensitive "Youtube" returns zero results
- [ ] Upgrade modal shows "Not included" instead of "—" for free tier
- [ ] Delete Account shows confirmation dialog before executing
- [ ] Settings sections have visual separators
- [ ] `npx tsc --noEmit` — no new TypeScript errors
```

---

## PROMPT 5: Fix Ad Detection and Scan Accuracy

```
You are fixing scan accuracy issues in the AlgorithmLens React Native mobile app. Read the algorithm-lens scan-accuracy skill file before starting. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read MOBILE_VISUAL_AUDIT_V2.md. You are fixing: H-03, H-04, A-01, A-02.

## THE PROBLEM

Across 5+ scans (YouTube and Instagram), ad detection returns 0% EVERY TIME. YouTube and Instagram both serve ads to virtually all users. This is a systematic failure in the classification pipeline. The "Ads & Promos" dashboard tab is meaningless if ads are never detected.

Additionally, YouTube scans return 100% suggested content — which may be correct for unsubscribed channels but needs validation.

## INVESTIGATION STEPS

1. Trace the ad detection pipeline end-to-end:
   - How are posts captured during a Precision/Quick Scan? (WebView content extraction)
   - What data is extracted per post? (text, author, metadata, labels)
   - How is each post classified as ad/not-ad?
   - Where does the classification happen? (client-side? API call to Google Gemini?)
   - What are the classification criteria for ads?

2. For Instagram specifically:
   - Instagram ads have a "Sponsored" label below the account name
   - Check if the WebView content scraper detects the "Sponsored" text
   - Check if Instagram's DOM structure makes "Sponsored" difficult to extract
   - Instagram may also show "Paid partnership" labels

3. For YouTube specifically:
   - YouTube shows video ads between organic content
   - YouTube Shorts show ads between organic Shorts
   - Check if the ad detection criteria match YouTube's ad markers
   - YouTube ads may have "Ad" labels or different DOM structure

4. For the Suggested vs. Followed classification:
   - On YouTube: check if the parser looks at the "Subscribe"/"Subscribed" button
   - On Instagram: check if the parser detects whether the user follows the account
   - If ALL content is marked "suggested" by default, the classifier has a fallback bias

5. Check the Google Gemini prompts used for classification:
   - Are the prompts asking about ads specifically?
   - Do the prompts provide examples of what an ad looks like on each platform?
   - Are the prompts platform-aware (different ad formats on different platforms)?

## FIX INSTRUCTIONS

1. If ads are detected client-side (DOM inspection):
   - Add detection for Instagram "Sponsored" label
   - Add detection for YouTube "Ad" markers
   - Test with actual ad-containing feeds

2. If ads are classified by AI (Gemini):
   - Review and improve the classification prompt
   - Add explicit examples of ad formats per platform
   - Ensure the prompt asks "Is this post a paid advertisement or sponsored content?"

3. For Suggested vs. Followed:
   - Add subscription status detection for YouTube
   - Add follow status detection for Instagram
   - Don't default to "suggested" — default to "unknown" if status can't be determined

## VERIFICATION:
- [ ] Run a scan on Instagram — if any ads appear in the feed, they must be detected
- [ ] Review the classification prompt and verify it explicitly handles ad detection
- [ ] Suggested vs. Followed logic has platform-specific detection, not just a default
- [ ] Document what ad markers are detected for each platform
```

---

## Execution Order

1. **Prompt 1** (Dashboard tabs) — MUST be first. Without a working dashboard, nothing else matters.
2. **Prompt 2** (Screen Capture) — Do this second. Non-negotiable. Take as long as needed.
3. **Prompt 3** (Streak, stale data, onboarding) — Third. Fixes core engagement mechanics.
4. **Prompt 4** (Text, UI polish) — Fourth. Quality-of-life improvements.
5. **Prompt 5** (Ad detection accuracy) — Fifth. Fixes data credibility.

After each prompt, do a fresh screen recording and re-audit before proceeding to the next prompt.
