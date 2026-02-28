# AlgorithmLens Mobile App — Cowork Fix Prompts

**Generated from:** MOBILE_VISUAL_AUDIT.md (62 findings)
**Date:** February 24, 2026

Each prompt below is self-contained and should be run as a separate Cowork session. They are ordered by priority. After each prompt completes, verify the listed acceptance criteria before moving to the next.

---

## PROMPT 1: Fix Critical SVG Crash + ErrorBoundary Recovery + Broadcast Gating

**Findings addressed:** C-01, C-02, C-03, C-05, C-06, C-07, H-10, H-12, H-14

```
You are fixing critical crash bugs in the AlgorithmLens React Native mobile app (Expo). Read every skill file in the algorithm-lens plugin before starting. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read the full MOBILE_VISUAL_AUDIT.md file at the repo root first. You are fixing findings: C-01, C-02, C-03, C-05, C-06, C-07, H-10, H-12, H-14.

## BUG 1: SVG Transform Crash (C-01, C-03, C-05, C-06)

The dashboard crashes with: "Render Error: Expected transform functions but 'r' found" from transformToRn.js → extractTransformSvgView → Svg.tsx.

ROOT CAUSE: In `app/(tabs)/dashboard.tsx` around line 569-577, the PoliticsContent component has a ChevronDown icon with:

```tsx
<ChevronDown
  size={16}
  color={colors.textSecondary}
  strokeWidth={2}
  style={{
    // @ts-ignore — transform array syntax for web compatibility
    transform: showIdeology ? 'rotate(180deg)' : 'rotate(0deg)',
  }}
/>
```

This passes a CSS string `'rotate(180deg)'` but React Native expects a transform array: `[{ rotate: '180deg' }]`. The lucide-react-native `ChevronDown` renders as SVG, and react-native-svg's transform parser sees the first character 'r' of "rotate(180deg)" and throws.

### Fix instructions:
1. Open `app/(tabs)/dashboard.tsx`
2. Find the ChevronDown in PoliticsContent (around line 569-577)
3. Change the transform from the CSS string to React Native format:
   ```tsx
   style={{
     transform: [{ rotate: showIdeology ? '180deg' : '0deg' }],
   }}
   ```
4. Remove the `// @ts-ignore` comment since it's no longer needed
5. Search the ENTIRE codebase for any other instances of CSS-style transform strings on SVG/lucide-react-native icons. Common patterns to grep for:
   - `transform: 'rotate`
   - `transform: "rotate`
   - `transform: 'translate`
   - `transform: "translate`
   Fix every instance you find the same way.

## BUG 2: ErrorBoundary lacks navigation escape (C-06, H-12)

The ErrorBoundary in `src/components/ErrorBoundary.tsx` only shows a "Try Again" button. If the underlying error persists, the user is trapped.

### Fix instructions:
1. Open `src/components/ErrorBoundary.tsx`
2. Add a "Go Home" button below the "Try Again" button that navigates to the home tab
3. Import `router` from `expo-router`
4. Add the Go Home handler:
   ```tsx
   handleGoHome = (): void => {
     this.setState({ hasError: false, errorMessage: '' });
     router.replace('/(tabs)/');
   };
   ```
5. Add the button in the render method after the "Try Again" button:
   ```tsx
   <TouchableOpacity
     style={[styles.button, { backgroundColor: 'transparent', marginTop: SPACING.sm }]}
     onPress={this.handleGoHome}
     activeOpacity={0.7}
   >
     <Text style={[styles.buttonText, { color: COLORS.primary }]}>Go Home</Text>
   </TouchableOpacity>
   ```
6. Also wrap individual dashboard tab content sections with their own try/catch or error boundaries so one broken tab doesn't crash the whole dashboard. In `app/(tabs)/dashboard.tsx`, wrap each tab content component (OverviewContent, SourcesContent, AdsContent, PoliticsContent, ToneContent, SuggestedContent) in an ErrorBoundary with a per-tab fallback that says "This section couldn't load" with a retry button.

## BUG 3: Broadcast mode available in Expo Go (C-02, C-07, H-10)

Broadcast mode is labeled "RECOMMENDED" but crashes in Expo Go because native screen capture modules aren't available.

### Fix instructions:
1. Open `src/components/home/ModeToggle.tsx` (or wherever the Broadcast/Precision toggle is rendered)
2. Also check `src/components/home/PlatformBottomSheet.tsx` — this likely renders the mode picker
3. Add detection for Expo Go:
   ```tsx
   import Constants from 'expo-constants';
   const isExpoGo = Constants.appOwnership === 'expo';
   ```
4. When `isExpoGo` is true:
   - Hide the Broadcast mode option entirely, OR
   - Show it as disabled with text: "Requires development build"
   - Remove the "RECOMMENDED" badge
   - Auto-select Precision mode
5. In `app/broadcast/[platform].tsx`, add an early guard at the top of the component:
   ```tsx
   import Constants from 'expo-constants';

   // Guard: redirect if running in Expo Go
   useEffect(() => {
     if (Constants.appOwnership === 'expo') {
       Alert.alert(
         'Not Available',
         'Broadcast mode requires a development build. Redirecting to Precision mode.',
         [{ text: 'OK', onPress: () => router.back() }]
       );
     }
   }, []);
   ```
6. This should prevent the dual error state (C-07) where both an in-app error screen AND an iOS system alert appear simultaneously.

## BUG 4: Expo error banner visible (H-14)

### Fix instructions:
1. Open `app/_layout.tsx` (the root layout)
2. Add LogBox configuration:
   ```tsx
   import { LogBox } from 'react-native';

   if (!__DEV__) {
     LogBox.ignoreAllLogs(true);
   }
   ```
3. Even in __DEV__ mode, suppress the specific SVG error (until it's fixed):
   ```tsx
   LogBox.ignoreLogs([
     'Expected transform functions',
     'SyntaxError',
   ]);
   ```

## VERIFICATION CHECKLIST — Do not mark complete until ALL pass:
- [ ] Open the app — NO crash on initial load (C-05 fixed)
- [ ] Navigate to Dashboard tab — NO "Something went wrong" screen (C-01 fixed)
- [ ] The PoliticsContent chevron rotates correctly when toggling ideology breakdown
- [ ] If any individual dashboard section has an error, only that section shows an error state — not the whole screen
- [ ] The ErrorBoundary "Something went wrong" screen now shows both "Try Again" AND "Go Home" buttons (H-12 fixed)
- [ ] Tapping "Go Home" navigates to the home tab
- [ ] In Expo Go: Broadcast mode is hidden or disabled in the platform picker (C-02 fixed)
- [ ] In Expo Go: The "RECOMMENDED" badge does NOT appear on Broadcast (H-10 fixed)
- [ ] In Expo Go: Navigating to broadcast/[platform] shows a graceful redirect, NOT an iOS system alert (C-07 fixed)
- [ ] No red/pink Expo error banners visible during normal usage (H-14 fixed)
- [ ] grep the entire codebase for CSS-style transform strings on SVG components — zero results (C-03 fixed)
- [ ] Run `npx tsc --noEmit` — no new TypeScript errors introduced
```

---

## PROMPT 2: Fix Payment/Checkout Flow

**Findings addressed:** C-04, H-16

```
You are fixing the payment/checkout flow in the AlgorithmLens React Native mobile app. Read every skill file in the algorithm-lens plugin before starting, ESPECIALLY the pricing-billing skill. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read the full MOBILE_VISUAL_AUDIT.md file at the repo root first. You are fixing findings: C-04 and H-16.

## BUG 1: Checkout fails with "Network request failed" (C-04)

The file `src/lib/checkout.ts` calls `api.post('/api/stripe/create-checkout-session', ...)` which fails with a TypeError: Network request failed.

### Fix instructions:
1. Read `src/lib/checkout.ts` completely
2. Read `src/lib/api.ts` completely to understand how `api.post` works and what base URL it uses
3. Verify the API endpoint URL is correct. Common issues:
   - The base URL may be pointing to localhost or a development server
   - The endpoint path may be wrong
   - The backend may not be deployed or the endpoint may not exist yet
4. Check if there's an environment config file (`.env`, `app.json`, `app.config.js`, `eas.json`) that defines the API URL
5. If the API URL is configured for localhost (e.g., `http://localhost:3000`), this won't work on a physical device. Fix by:
   - Using the deployed backend URL
   - Or adding proper network configuration for development
6. Add better error handling in `startCheckout()`:
   ```tsx
   } catch (err) {
     const message = err instanceof Error ? err.message : 'Could not start checkout.';

     // Provide more helpful error messages
     let userMessage = message;
     if (message.includes('Network request failed')) {
       userMessage = 'Unable to connect to payment server. Please check your internet connection and try again.';
     }

     captureError(err instanceof Error ? err : new Error(message), 'checkout:stripe', { plan });
     Alert.alert('Checkout Error', userMessage);
     throw err;
   }
   ```
7. Also ensure the `addBreadcrumb` import is being used — add a breadcrumb before the API call:
   ```tsx
   addBreadcrumb('checkout', 'Starting checkout', { plan });
   ```

## BUG 2: Plan selection uses generic native alert (H-16)

The `presentPlanSelection()` function in `src/lib/checkout.ts` uses `Alert.alert()` which renders as a basic iOS UIAlertController. This is the most critical revenue conversion moment and looks unbranded.

### Fix instructions:
1. Create a new component: `src/components/plan/UpgradeModal.tsx`
2. This should be a custom bottom sheet or full-screen modal that shows:
   - Header: "Unlock Plus" or "Upgrade to Plus"
   - Feature comparison list showing what Plus includes vs Free:
     - All 6 dashboard tabs (Free: Overview only)
     - Unlimited scan history
     - Advanced accuracy insights
     - Priority support
   - Two plan cards side by side or stacked:
     - Monthly: $10/month
     - Annual: $96/year with "Save 20%" badge highlighted
   - "Start 14-day free trial" CTA button (use the app's primary blue)
   - "Maybe later" dismiss link
   - Use the app's design system (TYPOGRAPHY, SPACING, RADIUS, COLORS from theme.ts)
   - Use the ThemeContext for colors
3. Export a `showUpgradeModal` function or use a ref-based approach
4. Update `src/lib/checkout.ts`:
   - Remove the `presentPlanSelection()` function that uses `Alert.alert()`
   - Or rename it to `_legacyPlanSelection` and create a new approach
5. Update everywhere that calls `presentPlanSelection()`:
   - In `app/(tabs)/settings.tsx` — find where the upgrade banner's "Try Free" button calls it
   - In any other file that imports `presentPlanSelection`
   - Replace with navigation to the new UpgradeModal or triggering the modal
6. The modal should call `startCheckout(plan)` when the user selects a plan
7. Use react-native's Modal component or a bottom sheet library if available in the project

Design reference: Follow the app's existing design patterns — calm, measured, generous whitespace, blue primary color. Look at how other modals/bottom sheets are done in the app (e.g., PlatformBottomSheet.tsx) for patterns to follow.

## VERIFICATION CHECKLIST:
- [ ] Tapping "Try Free" or any upgrade CTA shows a custom-designed modal, NOT a native iOS alert
- [ ] The modal shows feature comparison (Free vs Plus)
- [ ] The modal shows both Monthly ($10/mo) and Annual ($96/yr, save 20%) options
- [ ] The modal has a clear CTA button and dismiss option
- [ ] The modal matches the app's design system (colors, typography, spacing)
- [ ] Selecting a plan calls startCheckout() — if the backend endpoint is available, checkout proceeds; if not, a helpful error message appears (not a raw TypeError)
- [ ] The error message for network failures is user-friendly, not "Network request failed"
- [ ] Run `npx tsc --noEmit` — no new TypeScript errors
```

---

## PROMPT 3: Fix Home Screen Stale Data and UI Issues

**Findings addressed:** H-01, H-02, H-03, H-04, M-18, M-19, L-01, L-02

```
You are fixing home screen data freshness and UI issues in the AlgorithmLens React Native mobile app. Read every skill file in the algorithm-lens plugin before starting. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read the full MOBILE_VISUAL_AUDIT.md file at the repo root first. You are fixing findings: H-01, H-02, H-03, H-04, M-18, M-19, L-01, L-02.

Read these files completely before making any changes:
- `app/(tabs)/index.tsx`
- `src/components/home/CalmHomeScreen.tsx`
- `src/components/home/RecentScanCard.tsx`
- `src/components/home/StreakBadge.tsx`
- `src/components/home/FeedScoreCard.tsx`
- `src/components/home/DailyTipCard.tsx`
- `src/hooks/useDashboard.ts`
- `src/hooks/useStreak.ts`
- `src/lib/streakManager.ts`

## FIX 1: "Good afternoon, there" — generic greeting (H-01)

The greeting says "Good afternoon, there" instead of the user's name.

### Fix instructions:
1. Find where the greeting is rendered in CalmHomeScreen.tsx
2. The app has auth context — find the user object (likely from `useAuth()`)
3. Extract display name from the auth profile. Try these in order:
   a. `user.user_metadata?.display_name` or `user.user_metadata?.full_name`
   b. `user.user_metadata?.name`
   c. Parse from email: `user.email?.split('@')[0]` — but clean it up (e.g., "jwjwin0+app1" → "Justin" is hard, so just use the prefix before any '+': `user.email?.split('+')[0]?.split('@')[0]`)
   d. If none available, omit the name entirely: "Good afternoon" (not "Good afternoon, there")
4. The "there" placeholder should NEVER appear — remove it from the fallback

## FIX 2: Last scan card text truncated (H-02)

In `src/components/home/RecentScanCard.tsx`, line 126 has `numberOfLines={1}` which clips the metadata text.

### Fix instructions:
1. Open `src/components/home/RecentScanCard.tsx`
2. Change the metadata display from a single truncated line to a two-line layout:
   - Line 1: Platform name + time ago (e.g., "Instagram · 2h ago")
   - Line 2: Post count + ad percentage (e.g., "23 posts · 12% ads")
3. Remove `numberOfLines={1}` or change to `numberOfLines={2}`
4. Update the text layout:
   ```tsx
   <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMain }}>
     {platformName} · {timeAgo}
   </Text>
   <Text style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: SPACING.xxs }}>
     {scan.post_count} posts · {Math.round(scan.ad_percentage)}% ads
   </Text>
   ```

## FIX 3: Streak shows "Start your streak" despite completed scans (H-03)

The StreakBadge shows `displayState === 'NEW'` even when the user has scan history.

### Fix instructions:
1. Read `src/hooks/useStreak.ts` and `src/lib/streakManager.ts` completely
2. The issue is likely that the streak calculation isn't checking the actual scan history from the database
3. Find where `displayState` is computed. It should check:
   - If `streakData.current_streak > 0` → ACTIVE
   - If user has ANY scans but streak is broken → PAUSED
   - If user has ZERO scans ever → NEW
4. The bug: it may be comparing against a different data source or the streak data isn't being refreshed after scans complete
5. Make sure the streak hook refreshes when scan data changes — it may need to depend on the scan list from useDashboard

## FIX 4: Feed Score says "Complete 2 scans" despite having 3 (H-04)

In `src/components/home/FeedScoreCard.tsx`, line 30 checks: `if (!feedScore || feedScore.label === 'Not enough data')` and line 71 shows "Complete 2 scans to see your Feed Score."

### Fix instructions:
1. Read `app/(tabs)/index.tsx` to see how `feedScore` is computed
2. The feedScore computation in index.tsx has a threshold: `if (scans.length < 2) return null`
3. The issue may be:
   a. The scans aren't loading properly (useDashboard hook issue)
   b. The threshold check uses `scans.length < 2` but scans might be filtered by date
   c. The feed score computation may be returning `null` even with enough scans
4. Debug the feed score computation. Add logging temporarily to understand why 3 scans don't trigger a score
5. Verify the scans are being fetched from Supabase correctly in useDashboard.ts
6. If the scans ARE loading correctly, the issue is in the Feed Score calculation logic in index.tsx — trace through it completely

## FIX 5: Home screen doesn't update after new scan (M-18)

The "Last scan" card still shows old data after completing a new scan.

### Fix instructions:
1. In the scan completion flow (`app/scanner/[platform].tsx`), after saving a scan, the app navigates to the dashboard
2. But the home screen's useDashboard data isn't invalidated/refreshed
3. Add a refresh trigger. Options:
   a. Use `useFocusEffect` from expo-router in the home screen to refresh data when the tab gains focus:
      ```tsx
      import { useFocusEffect } from 'expo-router';

      useFocusEffect(
        useCallback(() => {
          refresh();
        }, [refresh])
      );
      ```
   b. Or use a global event emitter to signal "scan complete" and have the home screen listen for it
4. Apply the same pattern to the History tab if it has the same stale data issue

## FIX 6: No pull-to-refresh on Home screen (M-19)

### Fix instructions:
1. In `src/components/home/CalmHomeScreen.tsx`, the ScrollView should have a RefreshControl
2. Check if it already has one — the history screen does (see history.tsx imports RefreshControl)
3. Add RefreshControl to the home screen's ScrollView:
   ```tsx
   <ScrollView
     refreshControl={
       <RefreshControl
         refreshing={refreshing}
         onRefresh={onRefresh}
         tintColor={colors.primaryBlue}
       />
     }
   >
   ```
4. Add the refresh state and handler (pull from useDashboard's refresh function)
5. Pass the refresh handler through CalmHomeScreen props if needed

## FIX 7: Daily tip never changes (L-01)

### Fix instructions:
1. Read `src/components/home/DailyTipCard.tsx`
2. Create an array of 7-10 tips and rotate based on the day of the year:
   ```tsx
   const TIPS = [
     'Your Feed Score reflects source diversity, ad density, and content balance in your recent scans.',
     'Scanning regularly helps you notice patterns in what the algorithm surfaces for you.',
     'A higher percentage of followed content usually means you have more control over what you see.',
     'Ad frequency varies by platform — some serve more ads during peak shopping seasons.',
     'Content from accounts you don\'t follow is algorithmically suggested based on engagement patterns.',
     'Scanning different platforms helps you compare how each algorithm curates your experience.',
     'Your feed composition can change significantly between morning and evening sessions.',
   ];
   const tipIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % TIPS.length;
   ```

## FIX 8: Home subtitle text wrapping (L-02)

### Fix instructions:
1. Find the subtitle "See what appears in your social media feed" in CalmHomeScreen.tsx
2. Shorten to "See what's in your social media feed" or adjust the container to prevent orphaned words
3. Alternatively, add `adjustsFontSizeToFit` or increase the container's maxWidth

## VERIFICATION CHECKLIST:
- [ ] Greeting shows user's name (or just "Good afternoon" with no "there") (H-01)
- [ ] Last scan card shows full metadata on two lines — nothing truncated (H-02)
- [ ] With 3+ scans in history, streak does NOT show "Start your streak" (H-03)
- [ ] With 3+ scans, Feed Score card shows an actual score, NOT "Complete 2 scans" (H-04)
- [ ] After completing a new scan, returning to home shows updated "Last scan" data (M-18)
- [ ] Pull down on the home screen triggers a refresh (M-19)
- [ ] Daily tip shows different text on different days (L-01)
- [ ] Subtitle text doesn't have an orphaned word on a second line (L-02)
- [ ] Run `npx tsc --noEmit` — no new TypeScript errors
```

---

## PROMPT 4: Fix YouTube Precision Scan Accuracy

**Findings addressed:** H-05, H-06, H-07, M-09, M-15, A-01, A-02, A-04, A-05, A-07

```
You are fixing scan accuracy issues in the AlgorithmLens React Native mobile app, specifically for the YouTube Precision (WebView) scan mode. Read every skill file in the algorithm-lens plugin before starting, ESPECIALLY the scan-accuracy skill. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read the full MOBILE_VISUAL_AUDIT.md file at the repo root first. You are fixing findings: H-05, H-06, H-07, M-09, M-15, A-01, A-02, A-04, A-05, A-07.

Read these files completely before making any changes:
- `src/lib/platformScripts/youtube.ts` — the YouTube capture script
- `src/components/scanner/WebViewScanner.tsx` — the WebView scanner component
- `src/components/scanner/ScanOverlay.tsx` — the scan overlay UI
- `app/scanner/[platform].tsx` — the scanner screen
- `src/lib/platformScripts/index.ts` — the platform script index

## PROBLEM 1: Only 5 posts captured despite 8+ visible (H-05, M-09, A-04, A-07)

During a 27-second YouTube Shorts scan, only 5 posts were captured despite 8+ Shorts being scrolled through. The post counter froze at 5.

### Root cause investigation:
1. In `youtube.ts`, the `captureVideo()` function deduplicates by `title.substring(0, 80)`. If multiple Shorts have very short or similar titles, they may collide.
2. The `IntersectionObserver` has `threshold: 0.1` — Shorts that flash past quickly may not meet this threshold.
3. The `captureWithDelay` adds a 500ms delay — Shorts that are scrolled past in under 500ms may not be captured.
4. YouTube Shorts in the grid view may not have the same DOM structure as regular video items.
5. The Shorts blocker at the top (`injectShortsBlocker`) hides `ytm-shorts-player` and blocks navigation to `/shorts/` — this may be preventing capture of Shorts content.

### Fix instructions:
1. **Remove the Shorts blocker that blocks /shorts/ navigation**: The `injectShortsBlocker()` function blocks clicks on shorts links AND hides the shorts player. Since the user is trying to scan Shorts, we need to ALLOW Shorts display. Remove or conditionally disable the click handler that blocks `/shorts/` links.
2. **Improve deduplication**: Instead of just using `title.substring(0, 80)`, use a combination of title + channel:
   ```js
   const key = (channel || '') + '|' + title.substring(0, 60);
   ```
3. **Reduce capture delay**: Change `captureWithDelay` from 500ms to 100ms, or capture immediately for Shorts (they have simpler DOM):
   ```js
   function captureWithDelay(element) {
     // Shorts are simple — capture immediately
     if (element.matches('[is-shorts], ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, ytm-reel-item-renderer')) {
       captureVideo(element);
     } else {
       setTimeout(() => captureVideo(element), 300);
     }
   }
   ```
4. **Lower IntersectionObserver threshold**: Change from `{ threshold: 0.1 }` to `{ threshold: 0.01 }` — Shorts that are barely visible should still count.
5. **Increase scroll-based fallback frequency**: Change the `setInterval` from 3000ms to 1500ms for more frequent scanning.
6. **Add Shorts-specific selectors**: YouTube Shorts in the full-screen vertical player use different DOM elements. Add selectors for:
   ```js
   'ytm-reel-video-renderer',
   '#shorts-container .reel-video-in-sequence',
   'ytm-shorts-player-renderer',
   '.shorts-video-cell',
   ```
7. **Debug logging**: Add a `SCANNER_DEBUG` message type that reports how many items the observer is tracking:
   ```js
   setInterval(function() {
     window.ReactNativeWebView.postMessage(JSON.stringify({
       type: 'SCANNER_DEBUG',
       data: { captured: CAPTURED.size, observing: document.querySelectorAll('[data-alg-observed]').length }
     }));
   }, 5000);
   ```
   Handle this in WebViewScanner.tsx — log it in dev mode.

## PROBLEM 2: 0% Ads across all scans (H-06, A-01)

The `isAd()` function in youtube.ts checks for "Ad ·", aria-label containing "Ad", ad-badge class, and "sponsored" spans. But YouTube's ad format in 2024-2026 may have changed.

### Fix instructions:
1. Update the `isAd()` function with more comprehensive YouTube ad detection:
   ```js
   function isAd(element) {
     const text = (element.textContent || '').toLowerCase();

     // Signal 1: "Ad ·" pattern
     if (text.includes('ad ·') || text.includes('ad·')) return true;

     // Signal 2: Sponsored text
     if (text.includes('sponsored')) return true;

     // Signal 3: YouTube ad renderers
     if (element.matches('ytm-promoted-sparkles-web-renderer, ytm-promoted-video-renderer, [class*="promoted"]')) return true;
     if (element.querySelector('ytm-promoted-sparkles-web-renderer, ytm-promoted-video-renderer, [class*="promoted"]')) return true;

     // Signal 4: aria-label check (case-insensitive)
     const allAria = element.querySelectorAll('[aria-label]');
     for (const el of allAria) {
       const label = (el.getAttribute('aria-label') || '').toLowerCase();
       if (label.includes(' ad ') || label.startsWith('ad ') || label === 'ad') return true;
     }

     // Signal 5: ad-badge or ad-container classes
     if (element.querySelector('.ad-badge, [class*="ad-badge"], [class*="ad-container"], [class*="sparkles-light-cta"]')) return true;

     // Signal 6: "Ad" as standalone text in small elements
     const spans = element.querySelectorAll('span, div');
     for (const span of spans) {
       const spanText = (span.textContent || '').trim();
       if (spanText === 'Ad' || spanText === 'Sponsored' || spanText === 'AD') return true;
     }

     // Signal 7: Data attributes
     if (element.querySelector('[data-ad], [data-ad-slot], [is-ad]')) return true;

     return false;
   }
   ```
2. Also check the parent elements — YouTube sometimes wraps ad content in a container that has the ad marker, not the video item itself.

## PROBLEM 3: 100% Suggested with no subscription awareness (H-07, A-02)

In youtube.ts line 207, `is_suggested` is hardcoded to `true` for all YouTube content. This is overly simplistic.

### Fix instructions:
1. Add subscription detection to the YouTube script:
   ```js
   function isFromSubscription(element) {
     // Check for "Subscribed" button state
     const subBtn = element.querySelector('[aria-label*="Subscribed"], [aria-label*="subscribed"], button[aria-label*="Subscribe"]');
     if (subBtn) {
       const label = (subBtn.getAttribute('aria-label') || '').toLowerCase();
       if (label.includes('subscribed') && !label.includes('subscribe to')) return true;
     }

     // Check for subscribe/subscribed text near the channel
     const btns = element.querySelectorAll('button, [role="button"]');
     for (const btn of btns) {
       const text = (btn.textContent || '').trim().toLowerCase();
       if (text === 'subscribed') return true;
     }

     return false;
   }
   ```
2. Update `captureVideo()` to use this:
   ```js
   is_suggested: !isFromSubscription(element),
   ```

## PROBLEM 4: No content-type classification for Shorts (M-15, A-05)

The `detectContentType()` function tries to detect shorts but the check is weak.

### Fix instructions:
1. Improve content type detection:
   ```js
   function detectContentType(element) {
     // Check element type
     if (element.matches('ytm-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, [is-shorts]')) return 'short';
     if (element.closest('[is-shorts], ytm-shorts-player-renderer')) return 'short';

     // Check URL patterns
     const links = element.querySelectorAll('a[href*="/shorts/"]');
     if (links.length > 0) return 'short';

     // Check class names
     if (element.querySelector('[class*="reel"], [class*="short"], [class*="Short"]')) return 'short';

     // Check aria labels for "Shorts" keyword
     const ariaLabel = element.getAttribute('aria-label') || '';
     if (ariaLabel.toLowerCase().includes('short')) return 'short';

     return 'video';
   }
   ```

## VERIFICATION CHECKLIST:
- [ ] Run a YouTube scan and scroll through 10+ Shorts — the counter should show 8+ posts captured (H-05, A-04, A-07)
- [ ] The post counter updates continuously during scrolling, not freezing at 5 (M-09)
- [ ] Each captured post has a content_type of 'short' or 'video' as appropriate (M-15, A-05)
- [ ] The is_suggested field is based on subscription status, not hardcoded true (H-07, A-02)
- [ ] Ad detection catches YouTube's current ad formats — test by scrolling until an ad appears (H-06, A-01)
- [ ] No Shorts navigation is blocked that would prevent the user from viewing Shorts content
- [ ] The scanner debug log (if enabled) shows increasing capture counts during scrolling
- [ ] Run `npx tsc --noEmit` — no new TypeScript errors
```

---

## PROMPT 5: Fix Scan History Inconsistencies and Data Pipeline

**Findings addressed:** H-08, H-09, H-13, H-15, M-01, M-02, M-03, M-04, M-08, M-16, A-03, A-06

```
You are fixing scan history, data pipeline, and navigation issues in the AlgorithmLens React Native mobile app. Read every skill file in the algorithm-lens plugin before starting. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read the full MOBILE_VISUAL_AUDIT.md file at the repo root first. You are fixing findings: H-08, H-09, H-13, H-15, M-01, M-02, M-03, M-04, M-08, M-16, A-03, A-06.

Read these files completely before making any changes:
- `app/(tabs)/history.tsx`
- `app/scanner/[platform].tsx`
- `src/components/scanner/ScanOverlay.tsx`
- `src/components/scanner/WebViewScanner.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/hooks/useDashboard.ts`
- `src/lib/computeDashboardData.ts`
- `src/lib/analysis/geminiFlashService.ts`
- `src/lib/analysis/analysisPrompts.ts`

## FIX 1: Contradictory scan history data (H-08, A-03)

Three Instagram scans within 1 hour show: 88%, 86%, and 0% suggested. The 0% is almost certainly a bug.

### Fix instructions:
1. The likely cause is in the analysis pipeline. When the Gemini Flash API call fails or times out, the `suggested_percentage` may default to 0 instead of being marked as "unknown" or "error."
2. Read `src/lib/analysis/geminiFlashService.ts` — find the error/fallback handling
3. Read `src/lib/analysis/analysisPrompts.ts` — check the prompts for how suggested content is classified
4. Add validation after the API response:
   - If `suggested_percentage === 0` AND `post_count > 5`, flag this as a potential error
   - Log a warning: "0% suggested with N posts — possible classification error"
   - Consider re-running the classification once on failure
5. When saving scan results to Supabase, add a `classification_confidence` field or at minimum a `classification_error` boolean flag
6. In the scan saving logic in `app/scanner/[platform].tsx`, validate the results before saving:
   ```tsx
   // Sanity check: if all posts are classified as non-suggested on a platform
   // known for algorithmic curation, flag it
   if (result.posts.length > 5 && suggestedCount === 0 && platform !== 'reddit') {
     console.warn('[ScannerScreen] 0% suggested with', result.posts.length, 'posts — possible error');
     // Still save, but add a flag
   }
   ```

## FIX 2: Scan mode toggle labels confusing (H-09)

### Fix instructions:
1. Find where scan mode labels are defined. Check `src/components/home/ModeToggle.tsx` and `src/components/home/PlatformBottomSheet.tsx`
2. Change labels:
   - Old: "Broadcast — Scroll your real app" → New: "Screen Capture — Record your real feed as you scroll"
   - Old: "Precision — Text-only via browser" → New: "Quick Scan — Analyze content via built-in browser"
3. Add a brief description below each option explaining the tradeoff

## FIX 3: Tab bar disappears on scan screens (H-13)

### Fix instructions:
1. In `app/scanner/[platform].tsx`, add a back/close button in the header that's always visible:
   ```tsx
   <TouchableOpacity onPress={() => router.back()} style={{ padding: SPACING.md }}>
     <X size={24} color={colors.textMain} />
   </TouchableOpacity>
   ```
2. Check if there's already a close button — ensure it's prominent and always visible
3. The scan complete screen should have clear navigation: "View Dashboard" (primary) and "Go Home" (secondary)
4. During active scanning, ensure a "Cancel" or "Close" button is always reachable

## FIX 4: Multiple error types cascade (H-15)

### Fix instructions:
1. Create a centralized error handler in `src/lib/errorHandler.ts`:
   ```tsx
   let activeErrorId: string | null = null;

   export function showAppError(title: string, message: string, id: string) {
     if (activeErrorId === id) return; // Prevent duplicates
     activeErrorId = id;
     Alert.alert(title, message, [
       { text: 'OK', onPress: () => { activeErrorId = null; } }
     ]);
   }
   ```
2. Use this centralized handler in checkout.ts, broadcast/[platform].tsx, and anywhere else errors surface
3. In the broadcast screen, catch the native recording error BEFORE it surfaces as a system alert. In the useBroadcast hook, the `startSession` method should wrap the native call in a try/catch and handle failures gracefully without letting the iOS system alert appear.

## FIX 5: Skeleton loading has no animation (M-01)

### Fix instructions:
1. Read `src/components/ui/Skeleton.tsx`
2. Add a shimmer animation using React Native's Animated API:
   ```tsx
   const shimmerAnim = useRef(new Animated.Value(0)).current;

   useEffect(() => {
     Animated.loop(
       Animated.timing(shimmerAnim, {
         toValue: 1,
         duration: 1500,
         useNativeDriver: true,
       })
     ).start();
   }, []);

   const opacity = shimmerAnim.interpolate({
     inputRange: [0, 0.5, 1],
     outputRange: [0.3, 0.7, 0.3],
   });
   ```
3. Apply `opacity` to the skeleton placeholder views

## FIX 6: Clipped element at top-right of History (M-02)

### Fix instructions:
1. In `app/(tabs)/history.tsx`, look for filter/sort icons near the top
2. Ensure they have adequate padding from the safe area edge:
   ```tsx
   style={{ paddingRight: SPACING.lg + insets.right }}
   ```

## FIX 7: Progress bars on history cards unexplained (M-03)

### Fix instructions:
1. In `app/(tabs)/history.tsx`, find where the progress bars are rendered on scan cards
2. Add a small legend below or beside the bar:
   ```tsx
   <View style={{ flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xxs }}>
     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
       <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentGreen }} />
       <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>Followed</Text>
     </View>
     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
       <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryBlue }} />
       <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textTertiary }}>Suggested</Text>
     </View>
   </View>
   ```

## FIX 8: Sample quality labels unexplained (M-04)

### Fix instructions:
1. In the history card component, add a tooltip or parenthetical to the quality badge:
   - "Low sample (aim for 15+)"
   - "Fair sample"
   - "Good sample"
2. Check `src/config/thresholds.ts` for the actual threshold values and use them in the labels

## FIX 9: Scan overlay copy confusing (M-08)

### Fix instructions:
1. In `src/components/scanner/ScanOverlay.tsx`, the `getButtonLabel` function (line 36-40) says "Scroll past X more posts to save"
2. Change the copy:
   - Under 5 posts: "Keep scrolling — {X} more posts needed"
   - 5-9 posts: "Save scan ({X} posts) — more is better"
   - 10+ posts: "Save scan — great sample!"

## FIX 10: No loading indicator between scan complete and dashboard (M-16)

### Fix instructions:
1. In `app/scanner/[platform].tsx`, when "View Your Dashboard" is tapped, show a loading spinner or transition animation before navigating:
   ```tsx
   const handleViewDashboard = async () => {
     setNavigating(true); // Show loading
     // Short delay for visual feedback
     await new Promise(resolve => setTimeout(resolve, 300));
     router.push('/(tabs)/dashboard');
   };
   ```

## FIX 11: Dashboard analysis tabs data (A-06)

### Fix instructions:
1. Read `src/lib/computeDashboardData.ts` completely
2. Verify that the Tone and Politics tab data computation works correctly
3. The Gemini Flash analysis should be populating these fields — check if the analysis prompts include tone and political classification
4. If the data pipeline doesn't include tone/politics analysis, add it to the analysis prompts or mark those tabs as "Not enough data" gracefully

## VERIFICATION CHECKLIST:
- [ ] Scan history cards with 0% suggested are flagged or validated before saving (H-08, A-03)
- [ ] Scan mode labels are clear: "Screen Capture" and "Quick Scan" (H-09)
- [ ] A close/back button is always visible during scanning (H-13)
- [ ] A single failure produces exactly ONE error message, not multiple overlapping ones (H-15)
- [ ] History skeleton loading has a shimmer/pulse animation (M-01)
- [ ] No UI elements are clipped at the edges of the History screen (M-02)
- [ ] History card progress bars have a legend explaining colors (M-03)
- [ ] Sample quality badges explain the threshold (M-04)
- [ ] Scan overlay text is clear and encouraging, not "Scroll past X more to save" (M-08)
- [ ] Tapping "View Dashboard" shows a loading state before navigation (M-16)
- [ ] Tone and Politics tabs have data or show appropriate empty states (A-06)
- [ ] Run `npx tsc --noEmit` — no new TypeScript errors
```

---

## PROMPT 6: Visual/UX Polish — Medium and Low Priority

**Findings addressed:** M-05, M-06, M-07, M-10, M-11, M-12, M-13, M-14, M-17, M-20, M-21, M-22, L-03, L-04, L-05, L-06, L-07, L-08, L-09, L-10, L-11, L-12, L-13, L-14, L-15, L-16, L-17

```
You are polishing the visual design and UX of the AlgorithmLens React Native mobile app. Read every skill file in the algorithm-lens plugin before starting, ESPECIALLY the ui-ux-philosophy skill. The app is at: AlgorithmLens_Cowork/mobile/

IMPORTANT: Read the full MOBILE_VISUAL_AUDIT.md file at the repo root first. You are fixing findings: M-05, M-06, M-07, M-10, M-11, M-12, M-13, M-14, M-17, M-20, M-21, M-22, L-03, L-04, L-05, L-06, L-07, L-08, L-09, L-10, L-11, L-12, L-13, L-14, L-15, L-16, L-17.

This is a large set of polish items. Work through them systematically. Each fix should be small and targeted.

## SETTINGS FIXES

### M-05: "Data & Privacy" text truncated
- File: `app/(tabs)/settings.tsx`
- Find the Data & Privacy section text that gets cut off mid-sentence
- Show the full text by default (it's short) or add a "Read more" link

### M-06: No visual separator between settings sections
- File: `app/(tabs)/settings.tsx`
- Add the Divider component or a subtle horizontal line between settings groups
- Use `borderBottomWidth: 1, borderBottomColor: colors.borderSoft` with `marginBottom: SPACING.xl`

### M-07: "Delete Account" too accessible
- File: `app/(tabs)/settings.tsx`
- Add a confirmation dialog:
  ```tsx
  Alert.alert(
    'Delete Account',
    'This will permanently delete your account and all scan history. This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: handleDeleteAccount },
    ]
  );
  ```
- Add extra spacing above "Delete Account" to separate it from "Sign Out"

### L-06: "Upgrade to Plus" banner too large
- File: `app/(tabs)/settings.tsx`
- Reduce the upgrade banner height — make it a compact single-line or collapsible
- Add a small "×" dismiss button that hides it for the session

### L-07: Push notification toggle description awkward
- Fix the description copy:
  - When OFF: "Get periodic reminders to scan your feed"
  - When ON: show frequency picker below

### L-08: Settings "About" section takes too much space
- Group Privacy Policy, Terms of Service, and Website into a single expandable "Legal" row
- Keep App Version always visible

## SCANNER FIXES

### M-10: "Loading Youtube" capitalization
- File: `app/scanner/[platform].tsx`
- Find the loading screen text. The PLATFORM_NAMES constant already has "YouTube" with correct capitalization — ensure it's being used for the loading screen text too

### M-11: No platform selection visual feedback
- File: `src/components/home/PlatformPicker.tsx` or `PlatformBottomSheet.tsx`
- Add a `pressedOpacity` and small `transform: [{ scale: 0.95 }]` on press for platform icons
- Make selected state more prominent with a background color fill, not just a ring

### M-12: Scan mode cards inconsistent selection
- Increase contrast between selected (filled background) and unselected (outline only) states
- Add a small checkmark icon on the selected mode card

### M-13: Scan timer format
- Ensure the timer in `app/scanner/[platform].tsx` and `ScanOverlay.tsx` handles >60 seconds correctly
- Format should be "M:SS" (e.g., "1:05", not "0:65")
- Verify the timer formatting function handles edge cases

### M-14: Green "Scanning" indicator clashes with blue UI
- Change the scanning indicator from green to the app's primary blue
- Or use a calmer, muted version of green from the design system (colors.accentGreen)

### M-17: "Scan another platform" link placement
- File: `app/scanner/[platform].tsx` (scan complete screen)
- Style as a secondary outline button instead of plain text link:
  ```tsx
  <TouchableOpacity style={{
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    alignItems: 'center',
  }}>
    <Text style={{ ...TYPOGRAPHY.buttonMd, color: colors.primaryBlue }}>Scan Another Platform</Text>
  </TouchableOpacity>
  ```

### M-20: "10 more for good data" deficit framing
- File: `src/components/scanner/ScanOverlay.tsx`
- Change the `getQualityIndicator` function:
  - 0 posts: "Start scrolling to capture posts" (neutral, not red)
  - 1-4 posts: "Good start! Keep scrolling" (encouraging)
  - 5-9 posts: "Getting there — more posts = better insights"
  - 10+: "Great sample!" (green)
- Change the initial color from `colors.error` (red) to `colors.warning` (amber) for the low state

### M-21: "Minimize" button behavior unclear
- File: `src/components/scanner/ScanOverlay.tsx`
- Change label from "Minimize" to "Hide panel"
- Add brief text or tooltip: "Scanning continues in the background"

### M-22: No onboarding or first-use guidance
- Create a simple first-use check using AsyncStorage
- On first app open, show a 3-step walkthrough:
  1. "AlgorithmLens shows you what's in your social media feed"
  2. "Scan any platform to see your feed composition"
  3. "Get insights about ads, suggested content, and more"
- Use a simple fullscreen modal with dots pagination and "Next"/"Get Started" buttons
- Store `hasSeenOnboarding: true` in AsyncStorage after completion

## HISTORY FIXES

### L-03: History month header spacing
- File: `app/(tabs)/history.tsx`
- Add `marginBottom: SPACING.sm` to the section header style

### L-16: History cards don't indicate if dashboard is viewable
- Add "View Results →" text on the right side of each history card (after fixing C-01)

## PLATFORM PICKER FIXES

### L-04: Platform icons visually generic
- File: `src/components/home/PlatformPicker.tsx` or `PlatformBottomSheet.tsx`
- Use brand colors for each platform icon at reduced opacity (30%) in unselected state:
  - Instagram: gradient (use a warm pink)
  - YouTube: red
  - Twitter/X: black
  - TikTok: black with teal accent
  - Facebook: blue
  - Reddit: orange

### L-05: "Twitter / X" label
- Change to "X" everywhere in the app
- Update `PLATFORM_NAMES` in `app/scanner/[platform].tsx` and in `src/components/home/RecentScanCard.tsx`
- Use the X logo icon

### H-11: Platform picker disabled button with no explanation
- File: `src/components/home/PlatformBottomSheet.tsx`
- When no platform is selected and the CTA is disabled, show helper text: "Choose a platform above to get started"

## SCAN COMPLETE SCREEN FIXES

### L-10: Excessive white space on Scan Complete
- Add a brief insight sentence below the stats: "Here's a quick snapshot of what we captured"
- Or show a mini preview of the top finding

### L-11: Stat cards text wrapping at "100%"
- Use `adjustsFontSizeToFit` and `numberOfLines={1}` on the stat value Text component
- Or reduce font size dynamically when value is > 99

### L-12: Green checkmark doesn't match brand
- Change the success checkmark from bright green to the app's primary blue
- Or use `colors.accentGreen` from the design system instead of a raw green

## WEBVIEW FIXES

### L-13: YouTube WebView shows full YouTube chrome
- In `src/lib/platformScripts/youtube.ts`, the `suppressBanners()` function already hides the bottom nav
- Ensure the bottom tab bar is reliably hidden. Add more aggressive CSS:
  ```js
  'ytm-mobile-topbar-renderer { display: none !important; }',
  'ytm-pivot-bar-renderer { display: none !important; }',
  ```
- Be careful not to hide critical navigation that the user needs for scrolling

### L-14: YouTube Shorts grid shows before full-screen
- In the YouTube platform script, add auto-navigation to Shorts tab:
  ```js
  // After page load, click on "Shorts" tab if available
  setTimeout(function() {
    const shortsTab = document.querySelector('a[href="/shorts"], [aria-label="Shorts"]');
    if (shortsTab) shortsTab.click();
  }, 2000);
  ```

## MISC VISUAL FIXES

### L-15: No tab switch animation
- File: `app/(tabs)/_layout.tsx`
- Add a subtle fade transition between tabs if the Expo Router tab navigator supports it
- Check if `tabBarStyle` or `animationEnabled` props are available

### L-17: Warning icon on error screen uses bright yellow
- File: `src/components/ErrorBoundary.tsx`
- Change the icon from ⚠️ emoji to a lucide-react-native Info or AlertCircle icon
- Use `colors.textSecondary` or a muted blue instead of yellow
- Change the background from `COLORS.warningLight` to a neutral `colors.bgSecondary`

## VERIFICATION CHECKLIST:
- [ ] Settings: Data & Privacy text is fully visible (M-05)
- [ ] Settings: Clear visual separators between sections (M-06)
- [ ] Settings: Delete Account has a confirmation dialog (M-07)
- [ ] Loading screen shows "YouTube" not "Youtube" (M-10)
- [ ] Platform icons have press feedback and clearer selected state (M-11)
- [ ] Scan mode cards have clear selected/unselected distinction (M-12)
- [ ] Scan timer handles >60 seconds correctly (M-13)
- [ ] Scanning indicator uses blue or muted green, not jarring green (M-14)
- [ ] "Scan another platform" is a button, not plain text (M-17)
- [ ] Scan overlay starts with encouraging text, not deficit framing (M-20)
- [ ] Minimize button says "Hide panel" with note about continued scanning (M-21)
- [ ] First-time users see a simple onboarding walkthrough (M-22)
- [ ] History section headers have proper spacing (L-03)
- [ ] Platform icons use brand colors at reduced opacity (L-04)
- [ ] "Twitter / X" is now "X" everywhere (L-05)
- [ ] Upgrade banner is compact with dismiss option (L-06)
- [ ] Notification toggle descriptions are clear (L-07)
- [ ] About section is collapsible (L-08)
- [ ] Scan complete screen uses space well (L-10)
- [ ] "100%" stat doesn't wrap oddly (L-11)
- [ ] Success checkmark uses brand color (L-12)
- [ ] YouTube WebView chrome is minimized during scan (L-13)
- [ ] Error screen icon is calm, not bright yellow (L-17)
- [ ] Disabled platform picker button has helper text (H-11)
- [ ] Run `npx tsc --noEmit` — no new TypeScript errors
```

---

## Finding Coverage Matrix

| Finding | Prompt | Status |
|---------|--------|--------|
| C-01 | 1 | SVG transform fix |
| C-02 | 1 | Broadcast gating |
| C-03 | 1 | SVG transform grep |
| C-04 | 2 | Checkout endpoint |
| C-05 | 1 | Initial load crash |
| C-06 | 1 | ErrorBoundary recovery |
| C-07 | 1 | Dual error state |
| H-01 | 3 | Greeting name |
| H-02 | 3 | Card truncation |
| H-03 | 3 | Streak logic |
| H-04 | 3 | Feed Score threshold |
| H-05 | 4 | Post capture count |
| H-06 | 4 | Ad detection |
| H-07 | 4 | Suggested classification |
| H-08 | 5 | Data consistency |
| H-09 | 5 | Mode labels |
| H-10 | 1 | RECOMMENDED badge |
| H-11 | 6 | Disabled button hint |
| H-12 | 1 | Error navigation |
| H-13 | 5 | Tab bar on scan |
| H-14 | 1 | Expo error banner |
| H-15 | 5 | Error cascading |
| H-16 | 2 | Upgrade modal |
| M-01 | 5 | Skeleton animation |
| M-02 | 5 | Clipped element |
| M-03 | 5 | Progress bar legend |
| M-04 | 5 | Sample labels |
| M-05 | 6 | Privacy text |
| M-06 | 6 | Settings dividers |
| M-07 | 6 | Delete confirmation |
| M-08 | 5 | Overlay copy |
| M-09 | 4 | Counter freeze |
| M-10 | 6 | YouTube capitalization |
| M-11 | 6 | Platform feedback |
| M-12 | 6 | Mode card states |
| M-13 | 6 | Timer format |
| M-14 | 6 | Green indicator |
| M-15 | 4 | Shorts detection |
| M-16 | 5 | Loading transition |
| M-17 | 6 | Button styling |
| M-18 | 3 | Home refresh |
| M-19 | 3 | Pull-to-refresh |
| M-20 | 6 | Deficit framing |
| M-21 | 6 | Minimize label |
| M-22 | 6 | Onboarding |
| L-01 | 3 | Daily tip rotation |
| L-02 | 3 | Subtitle wrapping |
| L-03 | 6 | Header spacing |
| L-04 | 6 | Platform icons |
| L-05 | 6 | Twitter/X label |
| L-06 | 6 | Banner size |
| L-07 | 6 | Toggle description |
| L-08 | 6 | About section |
| L-09 | — | Low priority, skip |
| L-10 | 6 | White space |
| L-11 | 6 | Stat wrapping |
| L-12 | 6 | Checkmark color |
| L-13 | 6 | WebView chrome |
| L-14 | 6 | Shorts grid |
| L-15 | 6 | Tab animation |
| L-16 | 6 | Dashboard indicator |
| L-17 | 6 | Warning icon |
| A-01 | 4 | Ad detection |
| A-02 | 4 | Subscription aware |
| A-03 | 5 | Classification error |
| A-04 | 4 | Capture count |
| A-05 | 4 | Content type |
| A-06 | 5 | Tone/Politics data |
| A-07 | 4 | Detection ceiling |

**Total: 62 findings → 61 addressed across 6 prompts (L-09 skipped as cosmetic-only)**
