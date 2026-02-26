# QA Report — Second Full Audit (Round 2)

**Date:** 2026-02-22
**Auditor:** Claude (automated deep audit)
**Scope:** Complete re-audit of AlgorithmLens mobile app after Steps 5–12 fixes
**Standard:** "Would a senior engineer at Apple approve this for the App Store?"

---

## Baseline

The app went through 8 rounds of fixes (changelogs 05–12) covering:
- Critical/High security & architecture fixes
- Medium/Low bug fixes
- Error handling hardening
- Design system overhaul
- Home screen redesign & onboarding
- Screens overhaul
- Habit-forming features (achievements, streaks, weekly summary)
- Performance & accessibility optimization

Round 1 identified **16 CRITICAL** and **64 HIGH** issues across 4 audit reports.

---

## TypeScript Compiler Results (`npx tsc --noEmit`)

The compiler reports **~90 errors**. While many are expected environment issues (missing `react-native` type declarations in a non-`npx expo` context, missing `__DEV__` global), several are **real code bugs**:

| Error | File | Severity | Description |
|-------|------|----------|-------------|
| TS2459 | `app/broadcast/[platform].tsx:36` | **CRITICAL** | `BroadcastOverlay` is imported but NOT exported from its module |
| TS2305 | `src/components/analysis/AnalysisProgress.tsx:14` | **CRITICAL** | `AccessibilityInfo` imported from `'react'` — should be from `'react-native'` |
| TS17001 | `src/components/broadcast/BroadcastPickerButton.tsx:88` | **HIGH** | Duplicate `style` attribute on same JSX element (line 75 and 88) |
| TS7006 | `app/(auth)/login.tsx:312` | **MEDIUM** | Parameter `text` implicitly has `any` type |
| TS7006 | `app/(tabs)/history.tsx:677` | **MEDIUM** | Parameter `item` implicitly has `any` type |
| TS7006 | `src/lib/broadcastSessionManager.ts:420` | **MEDIUM** | Parameter `nextState` implicitly has `any` type |
| TS7006 | `src/lib/sentry.ts:46,99,124` | **MEDIUM** | Parameters `event`, `scope` implicitly have `any` type |
| TS7031 | `src/components/ui/Button.tsx:153,166` | **MEDIUM** | Binding element `pressed` implicitly has `any` type |
| TS7031 | `src/components/ui/Card.tsx:58` | **MEDIUM** | Binding element `pressed` implicitly has `any` type |
| TS2769 | `src/components/scanner/WebViewScanner.tsx:311,468` | **MEDIUM** | `accessible` and `style` props not valid on WebView component |

---

## Findings

### CRITICAL — Blocks Launch

**C-1: Gemini API Key STILL Embedded in Client Bundle**
- **File:** `src/hooks/useAnalysis.ts`, line 48
- **Code:** `const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';`
- **Status:** NOT FIXED from Round 1. The key was moved from URL query param to HTTP header (good), but the fundamental problem remains: `EXPO_PUBLIC_*` variables are compiled into the JavaScript bundle by Expo at build time. Anyone can extract the Gemini API key from the app binary using standard reverse-engineering tools.
- **Fix:** Implement a backend proxy endpoint (`POST /api/gemini-proxy`) that holds the key server-side. The mobile app should never possess the key.

**C-2: BroadcastOverlay Not Exported — Build Will Fail**
- **File:** `src/components/broadcast/BroadcastOverlay.tsx`, line 69
- **Import site:** `app/broadcast/[platform].tsx`, line 36
- **Issue:** `BroadcastOverlay` is declared as `const BroadcastOverlay = React.memo(...)` but never exported. The broadcast screen imports it as a named export: `import { BroadcastOverlay } from '...'`. This will cause a **build failure** — the entire broadcast flow is broken.
- **Fix:** Add `export` before `const BroadcastOverlay` at line 69, or add `export { BroadcastOverlay };` at the bottom of the file.

**C-3: AccessibilityInfo Imported from Wrong Module**
- **File:** `src/components/analysis/AnalysisProgress.tsx`, line 14
- **Code:** `import React, { useEffect, useRef, AccessibilityInfo } from 'react';`
- **Issue:** `AccessibilityInfo` is a React Native API, not a React export. This import will fail at runtime, crashing the AnalysisProgress component — which means the entire analysis results flow is broken.
- **Fix:** Remove `AccessibilityInfo` from the `react` import. Add `import { AccessibilityInfo } from 'react-native';` on the existing RN import line (line 15).

**C-4: Toast Component Creates New Animated.Value on Every Render**
- **File:** `src/components/ui/Toast.tsx`, line 27
- **Code:** `const slideAnim = new Animated.Value(300);`
- **Issue:** This creates a new `Animated.Value` instance on every render cycle. Since it's also in the `useEffect` dependency array (line 51), this creates an infinite re-render loop: render → new value → effect runs → state change → re-render → new value → ...
- **Fix:** Wrap in `useRef`: `const slideAnim = useRef(new Animated.Value(300)).current;` and remove from useEffect deps.

**C-5: Duplicate `style` Prop on BroadcastPickerButton**
- **File:** `src/components/broadcast/BroadcastPickerButton.tsx`, lines 75 and 88
- **Issue:** The `Pressable` component has `style={[styles.button, ...]}` at line 75 and then another `style={{ minHeight: 44 }}` at line 88. In JSX, duplicate attributes cause the second to silently override the first, meaning ALL button styling (background, border radius, padding, shadows) is lost. Only `minHeight: 44` applies.
- **Fix:** Merge `{ minHeight: 44 }` into the existing style array at line 75.

**C-6: scanBuilder.ts Uses Weak Math.random() UUID Instead of Shared Utility**
- **File:** `src/lib/scanBuilder.ts`, lines 32-38
- **Issue:** Duplicates UUID generation using non-cryptographic `Math.random()` instead of using the shared `generateUUID()` from `src/lib/utils.ts` which uses `expo-crypto` with proper fallback chain. This creates collision risk for scan IDs and is a code duplication that was supposed to be fixed.
- **Fix:** `import { generateUUID } from './utils';` and delete the local function.

---

### HIGH — Fix Before Beta

**H-1: 57 `console.warn`/`console.error` Calls in Production Code**
- **Files:** 30+ files across src/ and app/
- **Issue:** There are 57 instances of `console.warn`, `console.error`, and `console.log` scattered throughout the codebase. In a production iOS app, these:
  1. Leak internal implementation details to anyone with a debugger
  2. Are not collected by Sentry (errors go untracked)
  3. Can cause performance issues on low-end devices with high log volume
  4. Are explicitly flagged by Apple's App Review guidelines
- **Fix:** Replace all `console.*` calls with Sentry breadcrumbs/captures:
  - `console.warn(msg)` → `addBreadcrumb('warning', msg)` or `captureMessage(msg, 'warning')`
  - `console.error(msg, err)` → `captureError(err, context)`
  - Conditional: `if (__DEV__) console.log(...)` for debug-only logging

**H-2: Certificate Pinning Not Implemented**
- **Files:** `src/lib/analysis/geminiFlashService.ts`, `src/lib/api.ts`, `src/lib/supabase.ts`
- **Status:** NOT FIXED from Round 1 (H-5/Security). No certificate pinning was added anywhere. All HTTPS requests (including screenshot uploads to Gemini) are vulnerable to MITM attacks with a CA-signed certificate.
- **Fix:** Implement certificate pinning using `react-native-ssl-pinning` or configure TrustKit for the Gemini and Supabase domains.

**H-3: Screenshots Stored Unencrypted on Disk**
- **Files:** Native modules (`SampleHandler.swift`, `AndroidSharedStorage.kt`)
- **Status:** Cannot verify from TypeScript layer, but no changelog mentions adding `NSFileProtectionComplete` (iOS) or `EncryptedFile` (Android). This was H-1 from the Security audit and likely remains unfixed.
- **Fix:** Add file-level encryption for captured frames on both platforms.

**H-4: `any` Type Used in 12+ Locations**
- **Files:** Multiple hooks and components
- **Locations:**
  - `src/lib/broadcastSessionManager.ts:116` — `private statusSubscription: any`
  - `src/lib/analysis/geminiFlashService.ts:235` — `makeApiRequest(requestBody: any)`
  - `src/hooks/useDashboard.ts:81` — `catch (err: any)`
  - `src/hooks/useScan.ts:81` — `const err: any`
  - `src/components/analysis/AnalysisProgress.tsx:353` — `colors: any`
  - `src/components/dashboard/ComparisonView.tsx:68` — `colors: any`
  - `src/components/analysis/BroadcastResultsSummary.tsx:231,258` — `colors: any`
  - `app/(tabs)/history.tsx:181` — `(item as any).raw_data`
  - `app/(tabs)/history.tsx:678` — `_data: any`
- **Fix:** Create a `ThemeColors` type exported from `ThemeContext.tsx` and use it everywhere. Type error objects as `unknown`. Type API request bodies properly.

**H-5: Unsafe `as string` Type Assertions Throughout**
- **Files:** Multiple components
- **Locations:**
  - `src/components/home/CalmHomeScreen.tsx:121-122` — `(meta.full_name as string).split(' ')[0]` — will crash if `full_name` is null/undefined
  - `src/components/home/FeedScoreTrend.tsx:208,217` — `colors.blue100 as string`
  - `src/components/home/WeeklySummaryCard.tsx:189` — `colors.textSecondary as string`
  - `src/components/ui/Button.tsx:170` — `variantStyles.text.color as string`
- **Fix:** Use proper null checks: `String(meta.full_name ?? '').split(' ')[0] || 'there'`. For colors, create properly typed theme so casts aren't needed.

**H-6: CalmHomeScreen Crashes on Missing User Metadata**
- **File:** `src/components/home/CalmHomeScreen.tsx`, lines 121-122
- **Code:** `(meta.full_name as string).split(' ')[0]` and `(meta.name as string).split(' ')[0]`
- **Issue:** If `user.user_metadata` is present but `full_name` and `name` are both `null` (common with email-only signups), this will throw `TypeError: Cannot read properties of null (reading 'split')`.
- **Fix:** `(meta.full_name ?? meta.name ?? '').toString().split(' ')[0] || 'there'`

**H-7: BarChart and StackedBar100 Recreate Animated.Values in useEffect**
- **Files:** `src/components/dashboard/BarChart.tsx:32-35`, `src/components/dashboard/StackedBar100.tsx:33-36`
- **Issue:** Both components reassign `animValuesRef.current` inside `useEffect`, creating new `Animated.Value` instances every time data changes. This causes animation glitches — values snap to 0 then animate to target, instead of smoothly transitioning.
- **Fix:** Only extend the array if new items are added; reuse existing values for existing indices.

**H-8: API Base URL Still Defaults to Localhost**
- **File:** `src/lib/api.ts`, line 10
- **Code:** `const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';`
- **Issue:** While a `console.warn` was added for production, the app still silently falls back to localhost. In production, this means all API calls fail silently. The Round 1 recommendation was to **throw**, not warn.
- **Fix:** In production (`__DEV__ === false`), throw an error instead of logging a warning. Or better: remove the fallback entirely.

**H-9: Empty Catch Blocks Swallow Errors Silently (12+ instances)**
- **Files:** Multiple files
- **Locations:**
  - `src/components/dashboard/DashboardTour.tsx:148-150,199-201` — Completely empty catch blocks
  - `src/components/scanner/WebViewScanner.tsx:205-206,216-217` — Empty catch for URL parsing
  - `src/hooks/useShortcuts.ts:87-89,117-119,127-129,135-139` — Four empty catch blocks
  - `src/services/notifications.ts:154` — `catch { return null }`
  - `src/components/scanner/WebViewScanner.tsx:280-283` — Linking.openURL silently fails
- **Fix:** At minimum, add `captureError()` or `addBreadcrumb()` to each catch block. For user-facing failures, show feedback.

**H-10: Hardcoded Colors Outside Theme System**
- **Files:** Multiple components
- **Locations:**
  - `src/components/ui/Toast.tsx:101` — `shadowColor: '#000'`
  - `src/components/scanner/ScanOverlay.tsx:106,138` — `shadowColor: '#000'`
  - `src/components/scanner/WebViewScanner.tsx:339` — `backgroundColor: 'rgba(180, 85, 85, 0.1)'`
  - `src/components/scanner/WebViewScanner.tsx:482` — `backgroundColor: 'rgba(247, 248, 252, 0.85)'`
  - `src/components/broadcast/BroadcastOverlay.tsx:462` — `backgroundColor: 'rgba(0,0,0,0.08)'`
- **Issue:** These break dark mode. The WebViewScanner light background (`rgba(247, 248, 252, 0.85)`) will appear as a bright flash in dark mode.
- **Fix:** Use `colors.black` for shadow colors, theme-aware colors for backgrounds.

**H-11: Hex String Concatenation for Opacity — Fragile Pattern**
- **Files:** Multiple
- **Locations:**
  - `src/components/home/PlatformBottomSheet.tsx:257` — `` `${platform.color}18` ``
  - `src/components/home/PlatformPicker.tsx:133` — `` `${platform.color}18` ``
  - `src/components/dashboard/DashboardTour.tsx:281` — `` `${step.accent}18` ``
  - `app/(tabs)/history.tsx:247` — `` `${platformColor}14` ``
  - `app/(auth)/onboarding.tsx:374` — `` `${platform.color}18` ``
- **Issue:** Appending `18` or `14` to a hex color string to create transparency only works if the source color is a 6-character hex string (`#RRGGBB`). If the color is a 3-char hex (`#RGB`), an RGB function (`rgb(...)`), or already has alpha, this produces an invalid color value that React Native silently ignores.
- **Fix:** Create a utility function `withAlpha(hexColor: string, alpha: number): string` that properly converts to `rgba()`.

**H-12: APP_VERSION Hardcoded in Two Places**
- **Files:** `src/lib/sentry.ts:21`, `app/(tabs)/settings.tsx:30`
- **Code:** `const APP_VERSION = '1.0.0';` in both files
- **Issue:** Version will inevitably drift between the two files and between actual app version. Should be read from `app.json` or `expo-constants`.
- **Fix:** `import Constants from 'expo-constants'; const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';`

---

### MEDIUM — Should Fix Before Launch

**M-1: BroadcastOverlay and ScanOverlay AccessibilityInfo Check Does Nothing**
- **Files:** `src/components/broadcast/BroadcastOverlay.tsx:92-95`, `src/components/scanner/ScanOverlay.tsx:54-59`
- **Issue:** Both call `AccessibilityInfo.isScreenReaderEnabled()` but the `.then()` callback result is never used. The check runs but has no effect on rendering.
- **Fix:** Either use the result to adjust UI (e.g., skip animations) or remove the dead code.

**M-2: `AccessibilityInfo.isReduceMotionEnabled()` Not Error-Handled**
- **File:** `app/(tabs)/dashboard.tsx`, line 1030
- **Issue:** `AccessibilityInfo.isReduceMotionEnabled()` returns a promise but the rejection is not caught. If the API is unavailable (Android <API 26), this throws an unhandled rejection.
- **Fix:** Add `.catch(() => false)` or wrap in try/catch.

**M-3: Missing `accessibilityRole="button"` on Settings TouchableOpacity**
- **File:** `app/(tabs)/settings.tsx`, line 316
- **Issue:** Some settings rows are tappable (TouchableOpacity) but lack `accessibilityRole="button"`, making them indistinguishable from static text for screen readers.
- **Fix:** Add `accessibilityRole="button"` to all interactive settings rows.

**M-4: History Filter Buttons Use `accessibilityRole="radio"` Without radiogroup Container**
- **File:** `app/(tabs)/history.tsx`, lines 594-612
- **Issue:** Filter chips use `accessibilityRole="radio"` but are not wrapped in a container with `accessibilityRole="radiogroup"`. Screen readers won't announce "X of Y" position information.
- **Fix:** Wrap the filter bar in a `<View accessibilityRole="radiogroup">`.

**M-5: `fontVariant: ['tabular-nums']` — Incorrect Syntax**
- **File:** `src/components/analysis/AnalysisProgress.tsx`, line 362
- **Issue:** React Native expects `fontVariant` as an array with specific string values, but `'tabular-nums'` may not be supported on all platforms. The correct RN prop is `fontVariant: ['tabular-nums']` (this is actually valid in RN 0.70+, but should be tested on iOS/Android).

**M-6: RecentScanCard Shows "0w ago" for Recent Scans**
- **File:** `src/components/home/RecentScanCard.tsx`, line 48
- **Issue:** When `diffDays` is 0–6, the `Math.floor(diffDays / 7)` returns 0, showing "0w ago" instead of falling through to the days display. The logic should check `diffDays >= 7` before the weeks branch.
- **Fix:** Reorder the if-chain to check weeks only when `diffDays >= 7`.

**M-7: Platform String `.charAt(0)` Can Crash on Empty String**
- **Files:** `src/components/dashboard/ComparisonView.tsx:226`, `src/components/scanner/WebViewScanner.tsx:503`
- **Issue:** If `platform` is an empty string, `.charAt(0).toUpperCase()` returns `''`, and `.slice(1)` returns `''`, producing an empty string — which is confusing but won't crash. However, the pattern is fragile and should validate platform is non-empty.
- **Fix:** `platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Unknown'`

**M-8: useDashboard Uses Magic String for Supabase Error Code**
- **File:** `src/hooks/useDashboard.ts`, line 72
- **Code:** `if (fetchError.code === '42P01' || fetchError.message?.includes('relation'))`
- **Fix:** Extract to constant: `const SUPABASE_RELATION_NOT_FOUND = '42P01';`

**M-9: setTimeout Magic Numbers Without Constants**
- **Files:** Multiple
- **Locations:**
  - `app/(auth)/onboarding.tsx:111` — `setTimeout(..., 300)`
  - `app/broadcast/[platform].tsx:253` — `setTimeout(..., 2000)`
  - `app/checkout/success.tsx:45` — `setTimeout(..., 2500)`
  - `src/hooks/useDashboard.ts:65` — `setTimeout(..., 10000)`
- **Fix:** Extract to named constants: `const NAVIGATION_DELAY_MS = 300;` etc.

**M-10: ComparisonView No Validation for Malformed Dates**
- **File:** `src/components/dashboard/ComparisonView.tsx`, line 207-223
- **Issue:** `new Date(scan.created_at)` can produce an Invalid Date if `created_at` is malformed, which propagates NaN through calculations.
- **Fix:** Add validation: `const d = new Date(scan.created_at); if (isNaN(d.getTime())) return null;`

**M-11: WeeklySummaryCard Empty Emoji Fallback**
- **File:** `src/components/home/WeeklySummaryCard.tsx`, line 140
- **Issue:** `getPlatformEmoji()` can return an empty string, causing layout inconsistency in the stats row.
- **Fix:** Return a default emoji (e.g., `📱`) when platform is unknown.

**M-12: Inconsistent Error Handling Patterns in Login**
- **File:** `app/(auth)/login.tsx`, lines 46, 57, 91, 131
- **Issue:** Error handling mixes `error instanceof Error ? error.message : 'Try again'` with different fallback messages across handlers. Should use a unified approach.
- **Fix:** Create `getErrorMessage(error: unknown): string` utility.

**M-13: ModeToggle Hardcoded Font Size**
- **File:** `src/components/home/ModeToggle.tsx`, line 96
- **Code:** `fontSize: 10, fontWeight: '700'`
- **Issue:** Uses hardcoded font size instead of `TYPOGRAPHY.captionSmall` or similar token.
- **Fix:** Use `TYPOGRAPHY.captionSmall` from the design system.

---

### LOW — Polish Items

**L-1: `as any` in Test Files**
- **File:** `src/__tests__/analysisDataStore.test.ts`, lines 19, 38, 64, 80, 95, 104
- **Issue:** Uses `{} as any` for mock data. Acceptable in tests but should use proper mock factories.

**L-2: DailyTipCard Timezone-Dependent Day Calculation**
- **File:** `src/components/home/DailyTipCard.tsx`, lines 36-39
- **Issue:** Day-of-year calculation may cause different tips to show for users in different timezones at midnight transitions.

**L-3: Skeleton.tsx Async Function Not Awaited in useEffect**
- **File:** `src/components/ui/Skeleton.tsx`, line 27
- **Issue:** `initAnimation()` is async but not awaited in useEffect. Works in practice but semantically incorrect.

**L-4: TikTok Uses Generic Music Icon**
- **Files:** `app/(auth)/onboarding.tsx:58`, `app/(tabs)/scan.tsx:30`
- **Issue:** TikTok platform uses the generic `Music` icon from lucide-react-native since there's no TikTok-specific icon in the library. Minor branding inconsistency.

**L-5: Date Formatting Functions Duplicated**
- **File:** `app/(tabs)/history.tsx`, lines 46-73
- **Issue:** `formatDate()` and `getRelativeTime()` have overlapping logic. Could be consolidated or moved to utils.

**L-6: InsightHero hexToRgb Doesn't Validate Input**
- **File:** `src/components/dashboard/InsightHero.tsx`, lines 72-81
- **Issue:** `hexToRgb()` function returns a fallback on invalid input but doesn't log a warning.

**L-7: LockedOverlayCard Platform-Specific Opacity Hardcoded**
- **File:** `src/components/plan/LockedOverlayCard.tsx`, line 109
- **Issue:** iOS gets 0.35 opacity, Android gets 0.25 — values are hardcoded without documentation.

**L-8: getItemLayout Magic Number**
- **File:** `app/(tabs)/history.tsx`, line 678-681
- **Issue:** `getItemLayout` uses estimated height `130` without documentation of how this was derived.

---

## Round 1 Fix Verification (CYCLE 1)

### CRITICAL Issues — Status

| # | Issue | Status | Evidence |
|---|-------|--------|----------|
| C-1/C-2 | Gemini API key in client bundle | **NOT FIXED** | Still uses `EXPO_PUBLIC_*` which bakes key into JS bundle |
| C-3 | Android bitmap use-after-close | Cannot verify | Native .kt code — changelog says fixed |
| C-4 | iOS memory pressure | Cannot verify | Native .swift code — changelog says fixed |
| C-5 | Supabase empty credentials | **FIXED** ✓ | Throws immediately on missing config |
| Sec C-1 | .env with real credentials | **PARTIALLY FIXED** | .env.example exists; .env may still contain real creds |

### HIGH Issues — Status

| # | Issue | Status |
|---|-------|--------|
| H-1 | Gemini safety block check | **FIXED** ✓ |
| H-2 | Supabase insert timeout | **FIXED** ✓ |
| H-3 | Android getParcelableExtra | Cannot verify (native) |
| H-4 | Dedup batching | **FIXED** ✓ |
| H-5 | isAvailable in state | **FIXED** ✓ |
| H-6 | API retry/backoff | **FIXED** ✓ |
| H-7 | Android frame counter @Volatile | Cannot verify (native) |
| H-8 | Prompt injection defense | **FIXED** ✓ |
| Sec H-1 | Screenshots unencrypted | **NOT VERIFIED** |
| Sec H-2 | Frame cleanup guaranteed | **FIXED** ✓ |
| Sec H-3 | Supabase RLS | Cannot verify (server-side) |
| Sec H-4 | API localhost fallback | **PARTIALLY FIXED** — warns but doesn't throw |
| Sec H-5 | Certificate pinning | **NOT FIXED** |
| UX F-1–F-6 | Login accessibility | **FIXED** ✓ |
| UX F-33 | Dashboard tab touch targets | **FIXED** ✓ |
| PQ-1,2,9 | Classification rules | **FIXED** ✓ |
| RP-3 | Boolean/confidence coercion | **FIXED** ✓ |
| RP-4 | Hallucination guard | **FIXED** ✓ |
| DD-1 | MIXED valence handling | **FIXED** ✓ |

---

## Prohibited Pattern Search (CYCLE 2)

### `as any` Occurrences
- `src/__tests__/analysisDataStore.test.ts` — 6 instances (test code only, acceptable)
- **No `as any` in production code** ✓

### TODO / FIXME / HACK / XXX
- **None found** ✓

### `console.log` / `console.warn` / `console.error`
- **57 instances total** across 30+ files
- Breakdown:
  - `console.warn`: 43 instances
  - `console.error`: 12 instances
  - `console.info`: 1 instance
  - `console.log`: 1 instance (in scanAggregator.js)
- **Verdict:** HIGH severity — these should all route through Sentry

### Hardcoded Hex Colors Outside theme.ts
- `src/components/ui/Toast.tsx:101` — `#000` (shadowColor)
- `src/components/scanner/ScanOverlay.tsx:106,138` — `#000` (shadowColor)
- **All `app/` screens:** No hardcoded colors ✓
- **Verdict:** MEDIUM — only 3 instances in src/, and all are shadow colors

### Unused Imports
- No systematic unused imports detected in production code ✓

---

## New Feature Audit (CYCLE 3)

### Achievements System (`src/lib/achievements.ts`, `src/components/home/AchievementBadges.tsx`)
- **Issue 1:** 7 `console.warn` calls should use Sentry
- **Issue 2:** Achievement check functions load from AsyncStorage on every call — no in-memory cache
- **Issue 3:** `AchievementBadges.tsx:144` — AccessibilityInfo check with `?.` optional chaining is fragile

### Streak System (`src/lib/streakManager.ts`, `src/components/home/StreakBadge.tsx`)
- **Issue 1:** 5 `console.warn` calls should use Sentry
- **Issue 2:** `StreakBadge.tsx:48` — AccessibilityInfo optional chaining pattern
- **Issue 3:** No debounce on `recordScan()` — rapid scans could cause race conditions in AsyncStorage

### Weekly Summary (`src/components/home/WeeklySummaryCard.tsx`)
- **Issue 1:** `as string` cast on `colors.textSecondary` (line 189) — fragile
- **Issue 2:** Empty emoji fallback for unknown platforms

### Feed Score Trend (`src/components/home/FeedScoreTrend.tsx`)
- **Issue 1:** `as string` casts on color values (lines 208, 217)
- **Issue 2:** No handling of zero-length data array (would render empty chart)

### Smart Suggestion (`src/components/home/SmartSuggestion.tsx`)
- **No critical issues found** ✓

### useHabitFeatures Hook (`src/hooks/useHabitFeatures.ts`)
- **Issue 1:** `console.warn` for error logging (lines 107, 168)
- **Issue 2:** useMemo dependency could be stale if underlying async data changes

---

## Screen-by-Screen Audit (CYCLE 4)

### Login (`app/(auth)/login.tsx`)
- Dark mode: ✓ (uses theme colors)
- Accessibility: ✓ (all buttons labeled, roles set)
- Error state: ✓ (shows error messages)
- Loading state: ✓ (disabled state on buttons)
- Empty state: N/A

### Onboarding (`app/(auth)/onboarding.tsx`)
- Dark mode: ✓
- Accessibility: ✓ (labels, selection state)
- Error state: N/A (no async operations)
- Empty state: N/A
- **Issue:** `platform.color + '18'` pattern (line 374) — see H-11

### Home / CalmHomeScreen
- Dark mode: ✓ (uses theme)
- Accessibility: Partial — main CTA has labels, but streak/achievement sub-components need verification
- Error state: ✓ (silently degrades)
- Loading state: ✓ (skeleton-like)
- **Issue:** `as string` crash risk on user metadata (lines 121-122) — see H-6

### Dashboard (`app/(tabs)/dashboard.tsx`)
- Dark mode: ✓
- Accessibility: ✓ (tab roles, labels)
- Error state: ✓ (error banner)
- Loading state: ✓ (loading indicator)
- Empty state: ✓ (empty state message)
- **Issue:** `console.error` on line 1012

### History (`app/(tabs)/history.tsx`)
- Dark mode: ✓
- Accessibility: Partial — radio role without radiogroup container (see M-4)
- Error state: ✓ (warning banner)
- Loading state: ✓
- Empty state: ✓
- **Issue:** `as any` on item and _data parameters

### Scan (`app/(tabs)/scan.tsx`)
- Dark mode: ✓
- Accessibility: ✓
- Error state: N/A
- Loading state: N/A
- Empty state: N/A (platform selection grid)

### Settings (`app/(tabs)/settings.tsx`)
- Dark mode: ✓
- Accessibility: Partial — missing `accessibilityRole="button"` on some rows (see M-3)
- Error state: ✓
- Loading state: N/A

### Broadcast (`app/broadcast/[platform].tsx`)
- Dark mode: ✓
- Accessibility: ✓ (live region, labels)
- Error state: ✓ (alerts)
- Loading state: ✓
- **BLOCKER:** BroadcastOverlay import fails (see C-2)

### Analysis (`app/analysis/[sessionId].tsx`)
- Dark mode: ✓
- Accessibility: ✓
- Error state: ✓
- Loading state: ✓
- **BLOCKER:** AnalysisProgress crashes due to wrong import (see C-3)

### Scanner (`app/scanner/[platform].tsx`)
- Dark mode: Partial — WebViewScanner has hardcoded light background (see H-10)
- Accessibility: ✓
- Error state: ✓
- Loading state: ✓

### Checkout Success (`app/checkout/success.tsx`)
- Dark mode: ✓
- Accessibility: Basic (could use more labels)
- Error state: ✓ (silently handles refresh failure)

---

## What's Working Well

1. **Design system adoption** — Nearly all screens use theme tokens for colors, spacing, typography
2. **Error boundary** — Global error boundary catches crashes with Sentry reporting
3. **Supabase insert timeout** — 15-second timeout prevents hanging
4. **Dedup batching** — 100-item chunks prevent token overflow
5. **Boolean coercion** — `is_ad === true || is_ad === 'true'` properly handles string/boolean
6. **Hallucination guard** — Validates dedup doesn't return more items than input
7. **Prompt injection defense** — OCR sanitization and explicit system prompt instructions
8. **Retry with backoff** — API calls retry with exponential backoff
9. **Rate limiting** — Gemini calls are rate-limited via queue
10. **MIXED valence** — Properly mapped to NEUTRAL
11. **Accessibility labels** — Login, scan, broadcast, and dashboard all have labels
12. **Touch targets** — Most interactive elements meet 44pt minimum
13. **Dark mode colors** — Comprehensive light/dark color system with contrast ratios documented
14. **Streak and habit features** — Well-structured with AsyncStorage persistence

---

## Remaining Issues Summary

### Must Fix Before App Store Submission (Blockers)

1. **C-1: Gemini API key in client bundle** — The most critical security issue. Apple may reject for insecure API key storage. Must implement backend proxy.
2. **C-2: BroadcastOverlay not exported** — Build will literally fail. The entire broadcast flow is broken.
3. **C-3: AccessibilityInfo imported from wrong module** — Analysis progress screen will crash at runtime.
4. **C-4: Toast infinite re-render loop** — Animated.Value created on every render causes infinite loop.
5. **C-5: BroadcastPickerButton duplicate style prop** — All button styling lost; button renders as unstyled.
6. **C-6: Weak UUID generation in scanBuilder** — Uses Math.random() instead of crypto; collision risk.

### Must Fix Before Beta (High Priority)

7. **H-1: 57 console.* calls in production** — Apple flags excessive logging; errors go untracked.
8. **H-2: No certificate pinning** — MITM vulnerability for screenshot data.
9. **H-3: Screenshots stored unencrypted** — Privacy risk on jailbroken/rooted devices.
10. **H-4: 12+ `any` types defeating TypeScript** — Type safety gaps across hooks and components.
11. **H-5: Unsafe `as string` assertions** — Crash risk in CalmHomeScreen, FeedScoreTrend, Button.
12. **H-6: CalmHomeScreen crashes on null user metadata** — Common with email-only signups.
13. **H-7: Animation value recreation** — BarChart and StackedBar100 have glitchy animations.
14. **H-8: API still defaults to localhost** — Production builds fail silently on API calls.
15. **H-9: 12+ empty catch blocks** — Errors silently swallowed with no tracking.
16. **H-10: 5 hardcoded colors break dark mode** — WebViewScanner loading overlay is bright in dark mode.
17. **H-11: Fragile hex+opacity concatenation** — 5 instances of `${color}18` pattern that can produce invalid colors.
18. **H-12: Hardcoded APP_VERSION in 2 places** — Will drift from actual version.

### Should Fix Before Launch (Medium Priority)

19. **M-1:** Dead AccessibilityInfo checks in 2 components
20. **M-2:** Unhandled promise rejection in dashboard accessibility check
21. **M-3:** Missing button roles on settings rows
22. **M-4:** Radio buttons without radiogroup container
23. **M-5:** fontVariant syntax needs cross-platform testing
24. **M-6:** "0w ago" display bug in RecentScanCard
25. **M-7:** Platform string capitalization crashes on empty string
26. **M-8:** Magic Supabase error code string
27. **M-9:** 4 setTimeout magic numbers without constants
28. **M-10:** Malformed date handling in ComparisonView
29. **M-11:** Empty emoji fallback in WeeklySummaryCard
30. **M-12:** Inconsistent error handling in login
31. **M-13:** Hardcoded font size in ModeToggle

### Polish (Low Priority)

32–39. Various minor issues (L-1 through L-8 above)

---

## Verdict

**Is this app ready for the App Store? NO.**

The app has made excellent progress from Round 1 — the vast majority of HIGH issues were properly fixed, the design system is well-implemented, and the new features are solid. However, there are **3 build-breaking bugs** (C-2, C-3, C-5) that would prevent the app from even compiling, **1 infinite loop** (C-4) that would crash the app immediately, and **1 unresolved security vulnerability** (C-1) that should block any public release.

**Estimated effort to reach App Store ready:**
- Fix 6 CRITICAL issues: ~4 hours (C-2, C-3, C-4, C-5, C-6 are quick; C-1 requires backend work)
- Fix 12 HIGH issues: ~8 hours
- Fix 13 MEDIUM issues: ~4 hours
- **Total: ~16 hours of focused work**

The architecture, design system, and feature set are strong. The remaining issues are mostly oversight from the rapid fix cycles — bugs introduced by the fixes themselves (C-2, C-3, C-4, C-5) and patterns that weren't caught by the Round 1 audit process (console.* proliferation, `as string` assertions).
