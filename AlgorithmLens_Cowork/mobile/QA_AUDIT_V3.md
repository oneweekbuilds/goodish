# QA Audit V3 — Mobile App

**Date:** February 16, 2026
**Baseline:** Post-Audit V2 implementation (Phases 1–6 complete)
**Source:** Screen recording of live app on iPhone via Expo Go
**Scope:** Full app flow — Dashboard → Scan → Instagram scroll → Scan Complete → Dashboard

---

## Findings

### Critical — Dealbreakers

**C1. Reels/video fullscreen takeover during scanning**
File: `src/components/scanner/WebViewScanner.tsx`
When the user scrolls past a Reel (video post) in the Instagram feed, Instagram's mobile web triggers a fullscreen Reel view — a dark, immersive video player that takes over the entire screen. The scan header and overlay disappear. The user is trapped in Reels mode and has to manually navigate back.
**Why it matters:** This happens every time a user scrolls past any video. Since ~30-50% of Instagram feed posts are Reels, this will happen within seconds of starting a scan. Users will get frustrated and abandon the app immediately.
**Root cause:** `onShouldStartLoadWithRequest` blocks URL-based navigation (e.g. `/reel/123`), but Instagram's Reels takeover happens via **in-page JavaScript navigation** — it doesn't trigger a new URL request. The WebView's `onShouldStartLoadWithRequest` never fires for this case.
**Fix:** Inject CSS/JS into the WebView to disable video autoplay, prevent the Reels immersive viewer from activating, and intercept Instagram's in-page navigation to Reels. Also add `mediaPlaybackRequiresUserAction={true}` and `allowsInlineMediaPlayback={true}` props to the WebView.

**C2. Dashboard cannot scroll past InsightHero**
Files: `app/(tabs)/index.tsx`, `src/components/dashboard/InsightHero.tsx`, `src/components/dashboard/MetricCard.tsx`
In the video, the dashboard shows the InsightHero card and a "Key Metrics" section header, but the user cannot scroll down to see the actual MetricCards, BarCharts, StackedBars, or BigNumbers below. The content exists in code but is not reachable by scrolling.
**Why it matters:** Users complete a scan and arrive at the dashboard expecting to see their data. They see one big narrative card and a section header — and nothing else. The entire value of the dashboard is hidden below the fold and unreachable.
**Root cause:** The outer `ScrollView` in `index.tsx` wraps the content correctly, but the InsightHero's `marginBottom: 20` combined with the large padding and the MetricCard's `fontSize: 40` values create cards that are very tall. More importantly, the `ScrollView` may be conflicting with the inner horizontal `ScrollView` for tabs (nested ScrollViews issue in React Native), or the content height isn't being calculated correctly by the layout engine because of the `flex: 1` on SafeAreaView combined with ScrollView behavior.
**Fix:** Replace the tab-area horizontal ScrollView with a `FlatList` with `horizontal` prop, or use `nestedScrollEnabled`. Add `contentContainerStyle={{ flexGrow: 1 }}` to the outer ScrollView. Also reduce InsightHero and MetricCard sizes significantly (see C3).

**C3. InsightHero card is far too large — pushes all data below fold**
File: `src/components/dashboard/InsightHero.tsx`
The InsightHero card has: 26px title, 15px meaning text, 14px whyCare text, 12px meta text, 24px padding all around, plus a "KEY TAKEAWAY" chip. It occupies roughly 60-70% of the visible screen. Users see the narrative card and nothing else.
**Why it matters:** The dashboard's value comes from the data — charts, percentages, comparisons. But users have to scroll past an enormous narrative card before seeing any of it. On every tab. The insight should support the data, not replace it.
**Fix:** Dramatically shrink InsightHero — reduce title to 18-20px, meaning to 13px, remove or collapse whyCare/meta into a "Learn more" expandable. Target max height of ~120-140px so data is immediately visible below it.

**C4. Zero ads detected on 14 Instagram posts**
File: `src/lib/platformScripts/instagram.ts`
The scan consistently showed 0 ads across 14 posts. On a typical Instagram feed, you'd expect 1-3 ads in that many posts (~10-20%).
**Why it matters:** If the core scan data is wrong, the entire product loses credibility. Users will see "0% ads" and know that can't be right.
**Root cause:** The `isAd()` function checks for a standalone `<span>` with text exactly equal to "sponsored". But Instagram's mobile web renders "Sponsored" differently — it may be split across elements, wrapped in shadow DOM, or use a translated string. The 300ms delay in `captureWithDelay` may not be enough for Instagram's lazy-loading ad labels. Also, the `IntersectionObserver` with `threshold: 0.3` may fire before the Sponsored label has rendered.
**Fix:** Increase capture delay to 500-800ms. Add additional ad signals: check for `data-testid` attributes containing "ad", look for "Sponsored" in `aria-label` attributes, check for ad disclaimer links ("About this ad", "Why am I seeing this?"), and look for the ad badge icon (ⓘ) near the creator name.

---

### High — Fix Before Beta

**H1. Tone and Suggested tabs invisible — no scroll affordance**
File: `app/(tabs)/index.tsx`
The horizontal tab bar shows Overview, Sources, Ads, ✨Politics — and then cuts off. Tone and Suggested tabs exist but require horizontal scrolling to discover. There's no visual indicator (gradient fade, arrow, partial tab peek) that more tabs exist.
**Why it matters:** Two of the six core tabs are invisible to users. They might never discover them, which means two entire features go unused.
**Fix:** Add a gradient fade-out on the right edge of the tab bar, or ensure the last visible tab is partially cut off to signal scrollability. Alternatively, switch to two rows of 3 tabs each so all 6 are always visible.

**H2. Post count low — only 14 posts in 1+ minute of scrolling**
File: `src/lib/platformScripts/instagram.ts`
The user scrolled through Instagram for over a minute but only 14 posts were captured. A typical Instagram scroll session would show 20-40 posts in that time.
**Why it matters:** Low capture count means less data, less accurate analysis, and user confusion ("I scrolled through tons of posts but it only captured 14?").
**Root cause:** The `IntersectionObserver` with `threshold: 0.3` requires 30% of the article to be visible. Instagram's articles are tall (especially Reels) and the scan overlay at the bottom covers part of the viewport, reducing the visible area. Combined with the fullscreen Reel takeover (C1), several posts were likely missed during that period.
**Fix:** Lower `IntersectionObserver` threshold to `0.1` or `0.15`. Also add a scroll-event-based fallback that captures any article currently in viewport every 2 seconds, as a safety net for posts the observer misses.

**H3. 86% suggested seems inflated**
File: `src/lib/platformScripts/instagram.ts`
The scan completion screen shows 86% suggested content. While it's possible, this seems high and may indicate over-detection.
**Why it matters:** Inflated suggested percentages undermine trust. If users feel the numbers don't match reality, they won't trust any of the data.
**Root cause:** The `pastSuggestedDivider` flag is a one-way latch. Once set to `true` (after finding a "Suggested Posts" divider), every subsequent article is classified as suggested — even if the user scrolled back up into their followed content. Also, the "Follow" button detection (Signal 2) marks any post with a visible Follow button as suggested, but on Instagram's mobile web, Follow buttons sometimes appear on all posts regardless of follow status.
**Fix:** Make `pastSuggestedDivider` position-aware (track the Y-position of the divider and only mark posts below it). For the Follow button signal, add a cross-check: if the user follows 0 accounts in the scan, the Follow button signal is likely wrong and should be downweighted. Add a reasonableness check: if suggested% > 90%, add a disclaimer that detection may be imprecise.

**H4. MetricCard values are absurdly large (40px font)**
File: `src/components/dashboard/MetricCard.tsx`
The MetricCard component renders the value in `fontSize: 40`. Combined with 24px padding, each card is extremely tall. Three cards in a column push content way below the fold.
**Why it matters:** Even if the scroll issue (C2) is fixed, the dashboard will require excessive scrolling to see all the data. Users want a dense, information-rich dashboard — not giant numbers with vast whitespace.
**Fix:** Reduce value font to 28-32px, reduce padding to 16px, and make the card more compact overall.

**H5. Feed goes blank/skeleton mid-scan**
Visible at frame 72 (timestamp 0:51) — the entire feed area goes blank with gray skeleton rectangles, then reloads. This happened during active scrolling.
**Why it matters:** The user loses their place in the feed and any posts that were in-view during the blank period aren't captured.
**Root cause:** Instagram's mobile web periodically unloads off-screen content and re-renders. The WebView may also be experiencing memory pressure. The banner suppression `setInterval` (running every 2 seconds) and the `MutationObserver` (firing on every DOM change) may be causing excessive reflows.
**Fix:** Throttle the `MutationObserver` callback with `requestIdleCallback` or a simple debounce. Reduce `suppressBanners` interval from 2s to 5s after the first 10 seconds.

**H6. Scan overlay competes with Instagram's bottom navigation**
The scan overlay (quality indicator + stats + Done button) sits at the bottom of the screen, directly overlapping Instagram's own bottom nav bar (Home, Search, Reels, Shop, Profile). Users see two sets of navigation controls stacked on top of each other.
**Why it matters:** Visual clutter and confusion. Users might accidentally tap Instagram's nav instead of the scan overlay, or vice versa.
**Fix:** Either (a) inject CSS to hide Instagram's bottom nav during scanning, or (b) position the scan overlay slightly higher so it sits above Instagram's nav with clear separation, or (c) start in minimized pill mode by default and only expand when the user taps it.

**H7. No error recovery on dashboard data fetch**
File: `app/(tabs)/index.tsx`
If the Supabase fetch fails (network error, timeout), the dashboard shows the empty state ("No scans yet") with no retry option and no error message. The user has no way to know something went wrong vs. they actually have no scans.
**Why it matters:** Users who've completed scans will think their data was lost.
**Fix:** Add an error state distinct from empty state, with a "Retry" button and a clear message like "Couldn't load your scans. Check your connection and try again."

**H8. Duplicate post detection is too aggressive**
File: `src/components/scanner/WebViewScanner.tsx`
The dedup check uses `creator_handle + post_text` — but `post_text` might be empty or very short for image-only posts. Two different posts by the same creator with empty captions would be treated as duplicates and only the first would be captured.
**Why it matters:** Missed posts = undercounting, especially for Reels (which often have no caption).
**Fix:** Use `creator_handle + post_text + position_in_feed` or `creator_handle + capture_timestamp` for dedup. If post_text is empty, fall back to a hash of the article's innerHTML snippet.

---

### Medium — Should Fix

**M1. "Need 8 more posts" button text feels like an error**
File: `src/components/scanner/ScanOverlay.tsx`
The Done button says "Need 8 more posts" when under 10 posts are captured. This reads like a system error message, not guidance.
**Why it matters:** Users may think something broke rather than understanding they need to keep scrolling.
**Fix:** Change to "Keep scrolling — 8 more for good data" or similar encouraging language. Consider making the button still tappable (with a confirmation warning) rather than completely disabled at < 5 posts.

**M2. Dashboard shows stale "last scan" data — no way to pick a specific scan**
File: `app/(tabs)/index.tsx`
The dashboard always shows the most recent scan. If a user has done 5 scans across different platforms, they can only see the latest one's data. There's no scan selector or history integration.
**Why it matters:** The History tab shows all past scans, but tapping one just goes to the Dashboard showing the latest scan — not the one they tapped.
**Fix:** Add a scan selector dropdown in the dashboard header, or make the History cards navigate to a dashboard view pre-loaded with that specific scan's data.

**M3. Banner suppression not working for Instagram's login gate**
In the video, Instagram's feed loaded normally (user was already logged in), but the "Log in" bottom bar and "Open in app" prompts may still appear intermittently. The `suppressBanners()` function targets specific selectors, but Instagram frequently changes class names.
**Fix:** Add more aggressive banner suppression: hide all `position: fixed` and `position: sticky` elements that appear in the bottom 100px of the viewport and contain login/app-related text.

**M4. Timer in overlay and header are separate — can drift**
Files: `app/scanner/[platform].tsx`, `src/components/scanner/ScanOverlay.tsx`
Both the scanner screen header and the ScanOverlay run their own independent `setInterval(1000)` timers. Over time, these can drift apart, showing different times.
**Why it matters:** Minor but looks buggy — two timers showing different seconds.
**Fix:** Pass a single `startTime` timestamp down and compute elapsed from `Date.now() - startTime` in both places, or pass the elapsed time from the parent.

**M5. Dashboard tab content doesn't animate when switching tabs**
File: `app/(tabs)/index.tsx`
Tapping between tabs (Overview → Sources → Ads) instantly swaps content with no transition. Feels jarring compared to native apps.
**Fix:** Add a subtle fade transition (100-150ms) when switching tabs using `Animated.timing`.

**M6. No haptic feedback on any interactions**
No haptic feedback on button presses, tab switches, or scan completion. Native apps provide subtle vibration feedback.
**Fix:** Add `expo-haptics` with light impact on tab switches, medium impact on "Done — Save Scan", and success notification on scan complete.

**M7. "Scan Again" CTA at bottom of dashboard is too subtle**
File: `app/(tabs)/index.tsx`
The "Scan Another Feed" button at the bottom of the dashboard is an outline button that's easy to miss. Users who want to scan another platform have to scroll all the way down past all tab content to find it.
**Fix:** Move the "Scan Again" option to the dashboard header area (near the scan date info), or add it as a floating action button.

**M8. Platform selection cards on Scan tab lack visual richness**
File: `app/(tabs)/scan.tsx`
The platform cards are plain white boxes with a colored accent bar and the platform name. No icons, no platform logos, no visual excitement.
**Fix:** Add platform icons (from lucide or custom SVGs) and use the platform's brand color more prominently (e.g., gradient background or colored icon).

**M9. Content type labels are raw/technical**
File: `src/lib/computeDashboardData.ts`
Content types come directly from the capture script: "reel", "photo", "carousel", "unknown". These are displayed as-is on the dashboard.
**Fix:** Map to user-friendly labels: "reel" → "Videos/Reels", "photo" → "Photos", "carousel" → "Multi-image posts", "unknown" → "Other".

**M10. WebView `onShouldStartLoadWithRequest` only works on iOS**
File: `src/components/scanner/WebViewScanner.tsx`
The `onShouldStartLoadWithRequest` prop for request interception only works reliably on iOS. On Android, it fires differently and may not prevent all navigations.
**Why it matters:** Android users won't have the Reel/video navigation blocking.
**Fix:** For Android, also implement `onNavigationStateChange` to detect when the URL has changed to a blocked path, and if so, immediately navigate back with `webViewRef.current?.goBack()`.

---

### Low — Polish Items

**L1. Minimized pill dot color always shows green for Good sample**
File: `src/components/scanner/ScanOverlay.tsx`
The minimized floating pill shows a colored dot, but the dot color comes from `quality.dotColor` which is the same as `quality.color`. On a blue pill background, the green/amber/red dots may not be easily visible.
**Fix:** Use white dot on the blue pill, with the quality label text instead.

**L2. Settings "About" links point to algorithmlens.com pages that may not exist**
File: `app/(tabs)/settings.tsx`
Privacy Policy link goes to `algorithmlens.com/privacy`, Terms to `algorithmlens.com/terms`. If these pages don't exist yet, users get a 404.
**Fix:** Create those pages, or point to placeholder pages, or conditionally hide the links until the pages exist.

**L3. InsightHero creates a new `Animated.Value` on every render**
File: `src/components/dashboard/InsightHero.tsx`
Line 25: `const fadeAnim = new Animated.Value(0)` — this creates a new value on every re-render, restarting the animation each time the parent re-renders.
**Fix:** Use `useRef` to persist the animated value: `const fadeAnim = useRef(new Animated.Value(0)).current`.

**L4. History cards always navigate to dashboard latest scan, not the tapped scan**
File: `app/(tabs)/history.tsx`
`onPress={() => router.push('/(tabs)')}` — tapping any history card navigates to the main dashboard, which always shows the latest scan. Users expect to see that specific scan's data.
**Fix:** Pass the scan ID as a route param and load that specific scan in the dashboard.

**L5. No pull-to-refresh on the Scan tab**
File: `app/(tabs)/scan.tsx`
The Scan tab is a static list of platforms. While it doesn't need refresh, the inconsistency with Dashboard and History (which both have pull-to-refresh) feels slightly off.

**L6. Root layout keyboard dismiss wrapper may interfere with WebView**
File: `app/_layout.tsx`
The `TouchableWithoutFeedback` wrapper for keyboard dismiss wraps the entire app, including the scanner WebView. This may intercept touch events intended for the WebView.
**Fix:** Move keyboard dismiss to only wrap screens that have text inputs (login, settings), not the scanner.

**L7. Onboarding "ChartBar" icon import may not exist in newer lucide versions**
File: `app/(auth)/onboarding.tsx`
`ChartBar` is imported from lucide-react-native. Some versions use `BarChart3` or `BarChartBig` instead.
**Fix:** Verify the icon exists; if not, swap to `BarChart3`.

---

## What's Working

- **Branded login screen** — Eye icon + "AlgorithmLens" looks clean and professional
- **Onboarding flow** — Three screens (welcome, how it works, AI consent) flow smoothly
- **Plus tier presence** — Upgrade CTAs in dashboard banner, settings card, onboarding teaser
- **Tab bar** — Clean icons, proper safe area handling, correct active states
- **Scan overlay** — Quality indicator, minimize mode, stats display all work correctly
- **Scan completion screen** — Green check, stats, smooth animation — looks polished
- **Theme consistency** — All screens now use the shared theme tokens
- **Skeleton loading** — History tab shows skeleton cards while loading
- **InsightHero narratives** — Well-written, epistemically restrained copy across all tabs
- **Settings** — Complete with AI consent toggle, Plus upgrade, About links, sign out
- **Banner suppression** — Instagram's "Use the app" banners don't appear in the video

## Comparison to Audit V2 Baseline

### Improved
- Platform scripts fully rewritten (all 6 platforms)
- Dashboard now has all 6 tabs with InsightHero narratives
- Pre-built components (InsightHero, BarChart, StackedBar100, BigNumber, MetricCard) integrated
- Plus tier upgrade CTAs present in 3 locations
- Scan-to-dashboard transition is smooth (no more jarring Alert.alert)
- ScanOverlay has quality indicator and minimize mode
- Full theme consistency across all screens
- Tab bar has meaningful icons
- History cards show ad% and suggested% chips

### Regressed or New Issues
- Dashboard scroll is broken — data below InsightHero is unreachable (C2, new)
- Reel fullscreen takeover during scanning (C1, was partially addressed by URL blocking but in-page navigation wasn't caught)
- Ad detection accuracy still at 0% (C4, persists from V2)
- Post capture count still low (H2, persists from V2)

### Not Yet Addressed
- Per-scan detail view from History (tapping scan → specific dashboard)
- Dark mode preparation
- Data export
- Cross-platform comparison

---

## Recommended Implementation Order

### Phase 1 — Dealbreakers (C1-C4)
1. Fix Reel/video fullscreen takeover (C1) — inject CSS to disable Reels immersive viewer + WebView props
2. Fix dashboard scroll (C2) — debug nested ScrollView issue, add flexGrow
3. Shrink InsightHero dramatically (C3) — reduce sizes so data is visible
4. Fix ad detection (C4) — increase delay, add more signals

### Phase 2 — High Priority (H1-H8)
5. Make all 6 tabs visible (H1) — show all tabs or add scroll indicator
6. Lower IntersectionObserver threshold + add fallback (H2)
7. Fix suggested over-detection (H3) — position-aware divider tracking
8. Shrink MetricCard sizes (H4)
9. Throttle MutationObserver (H5)
10. Fix scan overlay positioning vs Instagram nav (H6)
11. Add error state to dashboard (H7)
12. Fix duplicate post detection (H8)

### Phase 3 — Medium Priority (M1-M10)
13. Improve scan button copy (M1)
14. Add scan selector to dashboard (M2)
15. Strengthen banner suppression (M3)
16. Single timer source of truth (M4)
17. Tab transition animation (M5)
18. Haptic feedback (M6)
19. Move Scan Again CTA (M7)
20. Platform card icons (M8)
21. Content type labels (M9)
22. Android navigation fallback (M10)

### Phase 4 — Polish (L1-L7)
23-29. Low priority items

---

**Total findings: 7 Critical, 8 High, 10 Medium, 7 Low = 32 items**
