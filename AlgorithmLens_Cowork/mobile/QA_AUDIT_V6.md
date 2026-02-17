# QA Audit V6 — February 17, 2026

## Baseline
QA Audit V5 (50 items) was fully implemented in the previous session. This audit is based on a new screen recording of the live app in Expo Go, reviewed frame-by-frame (160 frames at 2fps across 80 seconds of usage).

## Scope
Full app walkthrough: Dashboard (all 6 tabs), Settings, History, Scan picker, active Instagram scan session. Also includes static code review of all key source files.

---

## Findings

### Critical — Blocks Launch

**C1. Plus subscription says "Coming Soon" instead of connecting to Stripe payment**
- **File:** `app/(tabs)/settings.tsx` line 191
- **What happens:** Tapping "Start 2-Week Free Trial" shows an Alert saying "Plus subscriptions will be available soon. Stay tuned!" — this is a placeholder that blocks revenue.
- **Why it matters:** Users who want to pay literally cannot. The main site (algorithmlens.com) has working Stripe checkout. The mobile app needs the exact same payment flow — $10/month, $96/year, 2-week free trial.
- **Fix:** Replace the Alert with actual Stripe integration (or deep-link to the web checkout flow). At minimum, open the Stripe checkout URL in an in-app browser so users can subscribe.

**C2. Click/tap interaction is completely blocked during scanning — users cannot interact with the social media platform at all**
- **File:** `src/lib/platformScripts/instagram.ts` lines 78–127
- **What happens:** The reels blocker prevents ALL video playback (`document.addEventListener('play', ...)` pauses every video) and blocks taps on video elements. But the problem is broader — users report they cannot click on anything within the platform during scanning (can't switch from Posts to Reels tab, can't tap on content, can't interact normally).
- **Why it matters:** The core scanning experience requires users to "scroll your feed normally." If they can't interact with the platform at all, the scan feels broken and unnatural. The previous version was too permissive (auto-opening reels), but this is too restrictive.
- **Fix:** The blocking should be more targeted:
  1. Allow video play (just prevent fullscreen takeover)
  2. Allow taps on most UI elements (likes, comments, profile links, tab switching)
  3. Only block: fullscreen requests, Reels viewer overlay, navigation away from the feed
  4. Remove the blanket `video.pause()` on the `play` event — instead only block `requestFullscreen`

**C3. Hardcoded bright red (#EF4444) and bright yellow (#F59E0B) still present in multiple files**
- **Files:** `app/scanner/[platform].tsx` lines 41, 47, 267; `app/(auth)/login.tsx` lines 304, 318; `src/components/scanner/ScanOverlay.tsx` lines 26, 28, 182; `app/(tabs)/index.tsx` line 126; `src/components/ui/Toast.tsx` lines 58, 60
- **What happens:** Despite V5 fixes to the theme file, many components still use hardcoded `#EF4444` (bright red) and `#F59E0B` (bright yellow) instead of the theme tokens.
- **Why it matters:** Violates the UI/UX philosophy: "Do NOT use bright reds, warning yellows, or aggressive color combinations." These are visually jarring and inconsistent with the calm, measured Oura Ring aesthetic.
- **Fix:** Replace all instances: `#EF4444` → `COLORS.error` (#B45555), `#F59E0B` → `COLORS.warning` (#B8860B). Also fix `#8B5CF6` and `#EC4899` in the content types chart (line 126 of index.tsx) — these are hardcoded rather than using theme tokens.

---

### Important — Fix Before Beta

**I1. Politics and Tone tabs show "Coming Soon" with no detail — misleading UX**
- **File:** `app/(tabs)/index.tsx` lines 307–358
- **What happens:** Even when AI analysis is enabled, Politics and Tone tabs show a generic "Coming Soon" message with an info icon. There's no explanation of what users will eventually see, no timeline, and no visual preview.
- **Why it matters:** Users who enable AI analysis expect to see something. "Coming Soon" feels like a dead end. The tabs should give users a richer preview of what's ahead and feel less like empty placeholders.
- **Fix:** Replace the minimal "Coming Soon" card with a more detailed preview showing:
  - What the tab will show (e.g., "This tab will show the percentage of politically-themed content in your feed")
  - A visual mockup or illustration placeholder
  - A warmer empty state message per the UI/UX skill: "You'll see political content breakdown here once this feature launches. Each scan will categorize posts by political relevance."

**I2. AlgorithmLens green (#10B981) barely used — branding feels one-dimensional**
- **What happens:** Looking at the dashboard, nearly everything is blue. The green accent color only appears in: history tab chips, scanner "good sample" indicator, settings checkmarks, and one content type bar segment. The scan picker icons, dashboard headers, tab bar, Plus banner, insight cards — all exclusively blue.
- **Why it matters:** The theme file defines a 70/30 blue/green split, but the actual app is more like 95/5. The green accent color is part of the AlgorithmLens brand identity. Without it, the app feels flat and monotone.
- **Fix:** Introduce green accents strategically:
  - Scan picker: platform cards could have a subtle green border or green icon backgrounds
  - Dashboard: "Tap for more context" buttons could use green
  - Plus banner: "Try Free" badge could use green instead of white
  - Scan button: consider green as a CTA color (it signals "go")
  - Success states already use green — good, extend this pattern

**I3. Epistemic restraint violations remain in computeDashboardData.ts**
- **File:** `src/lib/computeDashboardData.ts` lines 260, 268
- **Violations found:**
  1. Line 260: "appeared because the platform's recommendation system showed them to you" — "showed them to you" implies intent
  2. Line 268: "algorithmic recommendations play a larger role in shaping your experience" — "shaping your experience" implies intent
- **Fix:**
  1. → "appeared through the platform's recommendation system" (describe mechanism, not intent)
  2. → "a larger portion of your feed consisted of recommended content" (describe composition)

**I4. Epistemic restraint violation in index.tsx suggested content text**
- **File:** `app/(tabs)/index.tsx` line 296
- **Violation:** "The platform's recommendation system played a significant role in shaping what appeared."
- **Fix:** → "A majority of what appeared in your feed came through the platform's recommendation system."

**I5. Content Types chart uses hardcoded colors including aggressive palette**
- **File:** `app/(tabs)/index.tsx` line 126
- **What happens:** Content type chart uses `[COLORS.primaryBlue, COLORS.accentGreen, '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1']` — mixing theme tokens with hardcoded values including bright yellow and hot pink.
- **Fix:** Create a dedicated chart color palette in theme.ts using muted, sophisticated tones: e.g., `chartPalette: ['#2563EB', '#10B981', '#7C8DB5', '#B8860B', '#8B7BA8', '#5B7FA6']`

**I6. Success screen stats use hardcoded #F59E0B (yellow) and #8B5CF6 (purple)**
- **File:** `app/scanner/[platform].tsx` lines 267, 282
- **What happens:** The success screen after a scan shows ad percentage in bright yellow and suggested percentage in purple — hardcoded, not from theme.
- **Fix:** Use `COLORS.primaryBlue` for all three stats, or define chart-appropriate tokens in the theme.

**I7. ScanOverlay uses hardcoded bright red and yellow for post count indicators**
- **File:** `src/components/scanner/ScanOverlay.tsx` lines 26, 28, 182
- **What happens:** The overlay during scanning uses `#F59E0B` for "Keep scrolling" and `#EF4444` for the "X more for good data" state.
- **Fix:** Use `COLORS.warning` and `COLORS.error` from theme (which were updated to muted tones in V5).

**I8. Login error states use hardcoded #EF4444**
- **File:** `app/(auth)/login.tsx` lines 304, 318
- **Fix:** Replace `#EF4444` with `COLORS.error`.

**I9. Toast component uses hardcoded colors**
- **File:** `src/components/ui/Toast.tsx` lines 58, 60
- **What happens:** Returns `'#10B981'` and `'#EF4444'` instead of `COLORS.success`/`COLORS.error`.
- **Fix:** Import and use `COLORS.success` and `COLORS.error`.

**I10. History tab skeleton loading lasts too long — shows 4 skeleton cards even for 2 scans**
- **File:** `app/(tabs)/history.tsx` (visible in video frame 065)
- **What happens:** When navigating to History, 4 skeleton cards appear and render for a noticeable duration before the actual 2 scans load. The skeleton count doesn't match reality.
- **Fix:** Reduce default skeleton count to 2, or match skeleton count to a reasonable estimate. Also check if the loading state is slower than necessary.

**I11. Date displayed as "Feb 16, 2020" on dashboard — date parsing may be wrong**
- **File:** `app/(tabs)/index.tsx` line 558
- **What happens:** Dashboard header shows "Feb 16, 2020" as the scan date, but the scan was clearly done in 2026. This could be a timezone issue, a date format issue, or stale test data.
- **Why it matters:** An incorrect date destroys credibility. Users will wonder if they're looking at old data.
- **Fix:** Investigate whether this is a date parsing bug or stale data. Verify `created_at` field format from Supabase.

**I12. computeDashboardData still accepts `any` type despite V5 C1 fix**
- **File:** `src/lib/computeDashboardData.ts` line 308
- **What happens:** The function signature is still `computeDashboardData(scan: any)` — the ScanRecord interface fix from V5 may not have been applied.
- **Fix:** Change to `computeDashboardData(scan: ScanRecord)` using the interface that was supposed to be added.

---

### Minor — Can Fix Later

**M1. Scan picker instruction text could be warmer**
- **File:** `app/(tabs)/scan.tsx`
- **Current:** "Log in and scroll your feed normally. AlgorithmLens captures what appears as you scroll. Tap "Done" when finished."
- **Suggested:** "Just scroll your feed like you normally would. AlgorithmLens quietly captures what appears. When you've scrolled enough, tap Done."

**M2. No haptic feedback on scan platform selection**
- **File:** `app/(tabs)/scan.tsx`
- **Fix:** Add `Haptics.selectionAsync()` on platform card tap (already used for dashboard tab switching).

**M3. "Scanning 0:02" header could show platform icon**
- **File:** `app/scanner/[platform].tsx`
- **What happens:** During scanning, the header shows "Instagram" + "Scanning 0:02" but no platform icon. Adding the Instagram icon would make it instantly recognizable.

**M4. Instagram bottom nav not hidden in some frames**
- **File:** `src/lib/platformScripts/instagram.ts` lines 170–176
- **What happens:** In video frames 090–095, the Instagram bottom navigation bar is still visible during scanning, creating confusion about which nav belongs to AlgorithmLens vs Instagram.
- **Fix:** Make the bottom nav hiding more aggressive — target `nav` elements by position rather than just `role="navigation"`.

**M5. "Keep scrolling — 5 more to save" button text could be clearer**
- **File:** `src/components/scanner/ScanOverlay.tsx`
- **Suggestion:** "Scroll past 5 more posts to save" — makes it clearer that the user needs to scroll past posts, not just scroll.

**M6. Source Concentration card text could include benchmark**
- **File:** `app/(tabs)/index.tsx` lines 181–186
- **Current:** Just shows "36%" and "of your feed from top 5 accounts"
- **Suggestion:** Add a subtle benchmark line: "Typical range: 40–60%"

**M7. Bar chart labels show "100%" for every source when each has 1 post**
- **Observed in:** Video frame 010 — all sources show "100%" bars
- **What happens:** When every creator has exactly 1 post out of 14, the bar chart shows each as "100%" which is misleading. The bar should show the creator's percentage of total posts (e.g., 7%).
- **File:** `src/components/dashboard/BarChart.tsx`
- **Fix:** Verify that percentage is calculated relative to total posts, not showing a fixed 100%.

**M8. Scan picker TikTok icon (music note) doesn't match the platform**
- **File:** `app/(tabs)/scan.tsx`
- **What happens:** TikTok uses a music note icon, which isn't immediately recognizable as TikTok.
- **Fix:** Consider a more recognizable icon or custom SVG.

**M9. SecureStore warning about value >2048 bytes**
- **Observed in:** Expo console output
- **What happens:** "Value being stored in SecureStore is larger than 2048 bytes and it may not be stored successfully."
- **Fix:** Check what's being stored in SecureStore (likely the auth token) and ensure it doesn't exceed limits, or switch to a different storage approach for large values.

**M10. Package version mismatches in Expo console**
- **Observed in:** Expo console output
- **What happens:** Several packages are out of date vs Expo SDK 54 expectations: expo-constants, expo-linking, expo-splash-screen, react-native-gesture-handler, react-native-reanimated, react-native-webview.
- **Fix:** Run `npx expo install --fix` to align all package versions.

**M11. "newArchEnabled: false" warning**
- **Observed in:** Expo console output
- **What happens:** New Architecture is always enabled in Expo Go but explicitly disabled in app.json.
- **Fix:** Remove `"newArchEnabled": false` from app.json.

**M12. Settings Sign Out color still uses COLORS.error (bright red tone)**
- **File:** `app/(tabs)/settings.tsx` lines 404, 410
- **What happens:** Sign out button and loading indicator still use `COLORS.error`. While the theme value was updated to `#DC2626`, it should use `COLORS.textMuted` as specified in V5 M18.
- **Fix:** Previous fix may not have been applied. Change both to `COLORS.textMuted`.

**M13. Suggested tab explanatory text references "the platform's recommendation system" — could be simpler**
- **File:** `app/(tabs)/index.tsx` line 296
- **Suggestion:** "Most of what appeared in your feed came from accounts you don't follow" — simpler, still descriptive.

**M14. Dashboard date format inconsistent — uses long date but no time**
- **File:** `app/(tabs)/index.tsx` line 558
- **Suggestion:** Add time of scan: "Feb 16, 2026 at 3:09 PM" would help users know which scan they're viewing.

**M15. History cards don't show scan quality indicator**
- **File:** `app/(tabs)/history.tsx`
- **Suggestion:** Show a subtle "Good sample" / "Low sample" badge so users know at a glance which scans have enough data.

---

## What's Working Well

1. **Tab switching** — smooth fade animation with haptic feedback
2. **InsightHero pattern** — headline insight at top of each tab, expandable for detail
3. **Scan overlay** — live post count, ad count, and timer during scanning
4. **Platform picker** — clean 2x3 grid with all 6 platforms
5. **History tab** — shows past scans with platform, post count, and key stats
6. **Progressive disclosure** — big number first, detail below
7. **Settings layout** — clean grouped sections with toggle switches
8. **Success screen** — animated transition after scan completes
9. **Scanning flow** — WebView loads Instagram, posts are captured as user scrolls
10. **Content capture** — posts, suggested content, and content types are being detected correctly

## Comparison to Previous Baseline (V5)

### Improved
- Cancel button now says "Discard Scan" (M20 fixed)
- Saving overlay says "Saving your scan" (I14 fixed)
- ErrorBoundary wraps root layout (C3 fixed)
- Supabase env validation added (C2 fixed)
- ScanRecord interface added (C1 partially — function still accepts `any`)

### Regressed
- Click blocking too aggressive (was too permissive, now too restrictive)
- Some V5 color fixes were not applied (hardcoded #EF4444 and #F59E0B remain in many files)

### New Issues Found
- Date displayed as 2020 instead of 2026 (I11)
- Bar chart showing 100% for each source (M7)
- Green accent color barely visible in the app (I2)
- SecureStore and package version warnings (M9, M10, M11)

## Recommended Priority Order

1. **C2** — Fix click blocking (scanning is the core experience)
2. **C1** — Connect Stripe payment (revenue blocker)
3. **C3** — Fix all remaining hardcoded colors (12+ files affected)
4. **I1** — Improve Politics/Tone empty states
5. **I2** — Add green accent color throughout
6. **I3/I4** — Fix remaining epistemic restraint violations
7. **I11** — Investigate date display issue
8. **I12** — Fix the `any` type that slipped through
9. Everything else
