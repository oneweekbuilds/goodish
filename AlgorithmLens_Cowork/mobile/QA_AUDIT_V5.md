# QA Audit V5 — February 17, 2026

## Baseline
QA Audit V4 implemented ~200 fixes across the codebase: critical bugs (Politics/Tone AI check), dashboard visual polish, code quality (memory leaks, error handling), and all 6 platform scripts upgraded. TypeScript compiles clean with zero errors.

## Scope
Full review of every screen, every component, every platform script, every hook/lib file, config files, and a screen recording walkthrough on iPhone in Expo Go.

---

## VIDEO OBSERVATIONS — What's Working

- Dashboard loads and scrolls fully ✓
- All 6 tabs (Overview, Sources, Ads, Politics, Tone, Suggested) render and switch with fade animation ✓
- InsightHero is collapsible with chevron ✓
- Sources tab shows bar chart with creators ✓
- Ads tab shows stacked bar + contextual message for 0-ad state ✓
- Suggested tab shows stacked bar + text explanation ✓
- Politics/Tone tabs now correctly check AI consent status ✓
- Settings screen has subscription card, AI toggle, links ✓
- Tab bar is visible with all 4 bottom tabs ✓
- Haptic feedback on tab switches ✓
- Pull-to-refresh on scan screen ✓
- Platform icons on scan cards ✓

---

## FINDINGS

### Critical — Blocks Launch

**C1. `computeDashboardData` accepts `scan: any` — no type safety on the single most important function**
- File: `src/lib/computeDashboardData.ts` line 308
- The function that computes ALL dashboard data uses `any` for its input. If the Supabase `scans` table shape changes, or if `raw_data` has unexpected structure, the entire dashboard silently breaks with wrong data.
- Impact: Wrong numbers on every tab; user sees incorrect information.
- Fix: Define a proper `ScanRecord` interface and validate the shape before computing.

**C2. Supabase client silently initializes with empty credentials if env vars are missing**
- File: `src/lib/supabase.ts` lines 9-10
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` default to `''`. If the `.env` file is missing or misconfigured, the app loads but every Supabase call silently fails. No error message, no crash — just an empty dashboard with "No scans yet" forever.
- Impact: New developer or fresh clone can't tell why nothing works.
- Fix: Add a runtime check that throws if either value is empty.

**C3. No error boundary anywhere in the app**
- If any component throws during render (e.g., `computeDashboardData` gets malformed data), the entire app crashes with a white screen.
- Impact: Unrecoverable crash for end users.
- Fix: Add React error boundaries around the root layout and key screens.

---

### Important — Fix Before Beta

**I1. Settings notification preferences are not persisted**
- File: `app/(tabs)/settings.tsx` lines 108-111
- `pushNotifications` and `notificationFrequency` are useState with hardcoded defaults. They reset on every app restart. User toggles push notifications on, closes app, re-opens — notifications are off again.
- Fix: Store in AsyncStorage or Supabase user_profiles.

**I2. AuthContext has no way to refresh `userProfile` after a profile update**
- File: `src/context/AuthContext.tsx`
- If a user upgrades to Plus (sets `is_user_plus = true` in Supabase), the app won't know until the next full app restart because `userProfile` is only fetched on auth state change.
- Fix: Add a `refreshProfile()` method to AuthContext.

**I3. `useDashboard` has an unused `hasFetched` ref — fetch-only-once pattern is broken**
- File: `src/hooks/useDashboard.ts` line 39
- `const hasFetched = useRef(false)` is declared but never checked before fetching. This means every time `user` changes (even identity provider refreshes), it re-fetches all scans.
- Fix: Actually use the ref to prevent redundant fetches.

**I4. BarChart and StackedBar100 recreate Animated.Value arrays when data changes**
- Files: `src/components/dashboard/BarChart.tsx` line 20, `StackedBar100.tsx` line 20
- When items/segments change length, `animValuesRef.current` is replaced with a new array. This breaks any in-progress animations and causes animation jank.
- Fix: Only recreate when length actually changes; preserve existing values when possible.

**I5. ScanOverlay uses `fontVariant: ['tabular-nums']` which doesn't work in React Native**
- File: `src/components/scanner/ScanOverlay.tsx` line 200
- `fontVariant` is a CSS property, not a valid React Native style. Timer digits will jump as numbers change width (e.g., "1:09" → "1:10" shifts the text).
- Fix: Use a monospace font or fixed-width container.

**I6. `getBarColor` function in BarChart calculates alpha but never uses it**
- File: `src/components/dashboard/BarChart.tsx` lines 45-50
- Function computes a fade value but returns `baseColor` unchanged. Dead code that misleads about what's happening.
- Fix: Either implement the alpha fade or remove the function.

**I7. Onboarding screen 2 step label says "Scroll your feed for 10 minutes" with a chart icon**
- File: `app/(auth)/onboarding.tsx` line 205
- Step 2 uses `ChartBar` icon but describes scrolling. Should use a Scroll or Mouse icon. Also, the second step shows a chart icon for scrolling, and the third step shows a checkmark for analysis — the icon/label pairing is off.
- Fix: Use `Scroll` or a custom finger-scroll icon for step 2, and `ChartBar` for step 3.

**I8. History cards calculate suggested% from `(item as any).raw_data` — unsafe cast**
- File: `app/(tabs)/history.tsx` lines 67-69
- Uses `(item as any).raw_data?.posts` which bypasses TypeScript completely. If `raw_data` doesn't have a `posts` array (e.g., for older scans), this silently produces `suggestedPct = 0` which is misleading (shows "0% suggested" instead of "unknown").
- Fix: Add `raw_data` to the `ScanDetail` type in useDashboard.ts.

**I9. Login screen email validation is too permissive**
- File: `app/(auth)/login.tsx` line 19
- `isValidEmail` only checks for `@` and `.` — `"a@b."` passes, `"@."` passes. This will let through garbage that Supabase will reject, creating a confusing error message.
- Fix: Use a proper email regex or at minimum check for characters before @, between @ and ., and after the last dot.

**I10. `#EF4444` (bright red) used for email validation error in login.tsx**
- File: `app/(auth)/login.tsx` lines 304, 318
- The UI/UX philosophy explicitly says "Do NOT use bright reds." This violates the color philosophy.
- Fix: Use `COLORS.error` from theme (which is `#EF4444` — meaning the theme itself has this issue). Soften to a muted coral/salmon.

**I11. `COLORS.error` in theme.ts is bright red (#EF4444) — violates UI/UX philosophy**
- File: `src/lib/theme.ts`
- The UI/UX philosophy says "Do NOT use bright reds, warning yellows, or aggressive color combinations." The error color is `#EF4444` which is a bright red.
- Fix: Change to a softer error color like `#DC6B6B` or `#C9544D`.

**I12. Scan quality indicator in [platform].tsx uses red (#EF4444) and yellow (#F59E0B)**
- File: `app/scanner/[platform].tsx` lines 42-49
- `getScanQuality()` returns `'#F59E0B'` (warning yellow) and `'#EF4444'` (bright red) — both banned by the UI/UX philosophy.
- Fix: Use muted alternatives — soft amber and soft coral.

**I13. Success screen shows quick stats with `#F59E0B` (yellow) for Ads and `#8B5CF6` (purple) for Suggested**
- File: `app/scanner/[platform].tsx` lines 267, 282
- These hardcoded colors don't match the brand palette and use a warning yellow for ads which implies ads are bad.
- Fix: Use brand blue variations for all stat cards — the data should feel neutral.

**I14. No loading state between scan completion and success screen**
- File: `app/scanner/[platform].tsx`
- There's a `saving` overlay but it says "Analyzing your feed..." — the scan isn't being analyzed, it's being saved to Supabase. The copy is misleading.
- Fix: Change to "Saving your scan..." or "Uploading results..."

**I15. Platform scripts all inject CSS with `document.head.appendChild(style)` but never check if it was already injected**
- Files: All 6 platform scripts
- If the MutationObserver or scroll fallback re-runs the injection function, duplicate style elements accumulate in the DOM, slowing down the page.
- Fix: Check for existing style element by ID before injecting.

**I16. Platform scripts use `setInterval` that is never cleared on WebView unmount**
- Files: All 6 platform scripts (3-second scroll fallback, banner suppression timer)
- When the WebView is destroyed (user taps Done), the intervals keep running in the detached WebView context. Not a memory leak per se (WebView is destroyed), but it's sloppy.
- Fix: Store interval IDs and provide a cleanup mechanism.

---

### Minor — Can Fix Later

#### Dashboard

**M1. `ChevronDown` is imported in index.tsx but never used**
- File: `app/(tabs)/index.tsx` line 31
- Dead import.

**M2. Gap between dashboard sections (8px) may be too tight for comfortable reading**
- UI/UX philosophy says "Generous spacing between sections — white space is a feature, not waste."
- Consider increasing to 12px between major sections.

**M3. InsightHero's "Tap for more context" hint may confuse users — there's no visual affordance**
- The entire card is tappable but looks like a static info box. Users may not discover the expand behavior.
- Consider adding a subtle border-bottom animation or pulse on first visit.

**M4. SectionHeader subtitle is always shown — could be hidden on first render and revealed on scroll**
- Progressive disclosure principle: "Show the big picture first."

**M5. Tab grid has hardcoded `borderColor: COLORS.borderSlate200` — not a COLORS.borderSoft/borderLight token**
- Minor inconsistency: most cards use `borderSoft` or `borderLight`, but tabs use `borderSlate200` directly.

**M6. Plus banner links to settings but doesn't scroll to the subscription section**
- User has to find the subscription card after navigating.

**M7. No visual distinction between "active scan" in header and latest scan**
- When a scanId is passed from history, the header shows the scan date but doesn't indicate "Viewing older scan" vs "Latest scan."

**M8. Content types stacked bar shows colors from a hardcoded array that could repeat for >6 types**
- File: `app/(tabs)/index.tsx` line 126
- `[COLORS.primaryBlue, COLORS.accentGreen, '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1'][i % 6]` — uses yellow and pink which may violate the calm color philosophy.

#### Scan Screen

**M9. Pull-to-refresh on scan screen does nothing useful (400ms fake delay)**
- File: `app/(tabs)/scan.tsx` line 49
- The pull-to-refresh just waits 400ms and sets refreshing to false. There's no data to refresh on a static platform list.
- Consider removing or making it fetch latest scan count per platform.

**M10. Platform icon tinted background uses `${platform.color}14` — the `14` is hex alpha but looks like a magic number**
- File: `app/(tabs)/scan.tsx` line 109
- `14` in hex = 8% opacity. Works, but could be a theme utility like `withAlpha(color, 0.08)`.

**M11. Platform cards don't show last scan info (e.g., "Last scanned 3 days ago")**
- Would help users know which platforms they've already scanned.

#### History Screen

**M12. History screen header shows "X scans total" but doesn't show date range**
- Would be helpful to see "Feb 1 – Feb 17" or similar.

**M13. Relative time in history cards doesn't update while viewing the screen**
- `getRelativeTime()` is computed once on render. If user sits on the history screen for 5 minutes, "2m ago" is stale.

**M14. History cards use `Zap` icon for ads — Zap implies energy/power, not advertising**
- Consider using `Megaphone` or `BadgeDollarSign` for ads.

#### Settings

**M15. "Upgrade to Plus" card has no `onPress` handler — entire card is a TouchableOpacity that does nothing**
- File: `app/(tabs)/settings.tsx` line 190
- The TouchableOpacity wraps the card but there's no `onPress` prop. Tapping does nothing.
- Should open Stripe checkout or at minimum show an "available soon" message.

**M16. Section titles use uppercase (TYPOGRAPHY.xsmall) which feels cold**
- UI/UX philosophy: "Labels, tooltips, button text, and empty states should feel human, calm, and helpful. Never robotic or clinical."
- "AI ANALYSIS", "SCAN REMINDERS" in all-caps feels clinical.

**M17. Data & Privacy section is a static text block with no actions**
- Consider adding a "Learn more" link or "Download my data" option.

**M18. "Sign Out" button uses `COLORS.error` (bright red) — violates color philosophy**
- Same issue as I10/I11. Should use a muted tone.

#### Scanner / WebView

**M19. Scanner header says "Scanning 1:23" with double-space before time**
- File: `app/scanner/[platform].tsx` line 366
- Template literal `\`Scanning  ${formatTime(elapsedSecs)}\`` has two spaces.

**M20. Cancel scan confirmation dialog uses "Keep scanning" and "Cancel" — the double-negative is confusing**
- "Cancel" in a dialog about canceling is ambiguous — does it cancel the cancellation or cancel the scan?
- Fix: Use "Discard Scan" instead of "Cancel."

**M21. WebViewScanner `ALLOWED_PATH_PATTERNS` are regexes but don't account for query strings or fragments**
- File: `src/components/scanner/WebViewScanner.tsx`
- Instagram share links with `?utm_source=...` could be blocked.

**M22. ScanOverlay minimized pill has a white dot that doesn't communicate scan quality**
- Previous version showed quality-colored dots; current shows white only.

#### Onboarding

**M23. Onboarding "What gets sent" / "What doesn't get sent" sections are collapsible but don't show a chevron**
- Users may not realize they can tap to expand.

**M24. Onboarding page indicator dots don't support swiping back**
- Swipe works, but there's no "Back" button — if a user swipes to page 3, they can only go forward (Get Started) or swipe back manually.

#### Login

**M25. Google and Apple sign-in buttons show the same loading spinner**
- If both are disabled during loading, user can't tell which one is processing.

**M26. No "Forgot password" link on email sign-in view**

**M27. Password field has no visibility toggle (show/hide password)**

#### Components

**M28. BigNumber `letterSpacing: -0.03` is likely meant to be -0.03em but React Native uses points**
- File: `src/components/dashboard/BigNumber.tsx` line 36
- `-0.03` points is imperceptible. Should be `-1` or `-2` for visual effect.

**M29. InsightHero `hexToRgb` function computes alpha value but never uses it**
- File: `src/components/dashboard/InsightHero.tsx`
- Similar to I6 — dead computed value.

**M30. MetricCard fallbackText is an optional prop but most callers don't pass it**
- Leads to inconsistent empty states across tabs.

#### Code Quality

**M31. Design iteration comments scattered through files (e.g., "H4: Reduced from 28px to 22px")**
- These are useful for audit trail but cluttered for production code. Should be moved to a changelog or git commit messages.

**M32. Inconsistent card styling — some cards use `COLORS.borderSoft`, others use `COLORS.borderLight`, others use `COLORS.borderSlate200`**
- Three different border color tokens used for what appears to be the same visual intent.

**M33. `SHADOWS.card`, `SHADOWS.soft`, `SHADOWS.medium`, `SHADOWS.hero` — too many shadow levels**
- Most cards use `SHADOWS.card` or `SHADOWS.soft` but the distinction is subtle. Simplify to 2-3 levels.

**M34. No loading boundary or Suspense patterns — every screen handles loading independently**
- Creates inconsistent loading UX across screens.

**M35. No test files anywhere in the project**
- No unit tests, integration tests, or snapshot tests.

**M36. No ESLint, Prettier, or any linting configuration**
- Code formatting is manually maintained.

#### Platform Scripts

**M37. Instagram has 6 ad detection signals but Twitter/TikTok/Reddit only have 2**
- Leads to inconsistent ad detection accuracy across platforms.

**M38. YouTube and TikTok hardcode `is_suggested: true` for ALL content**
- This is documented as intentional (TikTok For You page is all algorithmic) but it means the Suggested tab for these platforms always shows 100%.
- Consider adding a note to the user: "On TikTok, your entire For You feed is algorithmically recommended."

**M39. Twitter dedup uses only `tweetText.substring(0, 80)` — retweets of same content will be deduped**
- This could undercount actual appearances of the same content.

**M40. All platform scripts have identical touch-tracking boilerplate (~40 lines each)**
- Could be extracted to a shared utility injected before the platform-specific script.

**M41. `SCROLL_THRESHOLD = 10` (pixels) is used in all scripts but not documented**
- No comment explaining why 10px was chosen for distinguishing taps from scrolls.

**M42. Platform scripts assume `window.ReactNativeWebView.postMessage` exists**
- If the bridge isn't set up (e.g., in a non-RN WebView context), the entire script fails silently.

#### Epistemic Restraint

**M43. SuggestedContent text says "The platform's recommendation system played a significant role in shaping what appeared"**
- File: `app/(tabs)/index.tsx` line 296
- "Shaping what appeared" is borderline — it describes the system's role rather than just what appeared. Consider: "A majority of posts came from accounts you don't follow."

**M44. computeDashboardData line 261: "recommendation system showed them to you"**
- "Showed them to you" implies intent. Better: "they appeared in your feed."

**M45. computeDashboardData line 268: "algorithmic recommendations play a larger role"**
- "Play a role" implies agency. Better: "a larger portion of your feed consisted of recommended content."

#### Config / Infrastructure

**M46. `app.json` has `userInterfaceStyle: "light"` — no dark mode support**
- Theme.ts has a full palette that could support dark mode but it's not wired up.

**M47. `app.json` has `newArchEnabled: false`**
- New Architecture is now stable in Expo SDK 54. Should evaluate enabling for performance benefits.

**M48. `package.json` has no scripts for testing, linting, or type-checking**
- Only script is `"start": "expo start"`.

**M49. No `expo-notifications` plugin in `app.json` despite notification settings UI existing**
- Push notification settings exist in settings.tsx but no actual notification infrastructure.

**M50. No EAS Build configuration**
- No `eas.json` for app store builds.

---

## What's Working Well

1. Clean component architecture with proper separation of concerns
2. Consistent design system in theme.ts (COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS)
3. Good epistemic restraint in most dashboard language
4. Collapsible InsightHero with progressive disclosure
5. Proper Supabase auth flow with SecureStore
6. Platform-specific scanner scripts with comprehensive capture logic
7. Video/Reels takeover prevention across all 6 platforms
8. TypeScript compiles clean with zero errors
9. Haptic feedback on interactions
10. Skeleton loading states in history screen
11. Success screen after scan with stats preview
12. User-visible error alerts for database save failures
13. Email validation on login with auto-focus

## Comparison to Previous Baseline (V4)

**Improved:**
- Politics/Tone tabs now correctly check AI consent ✓
- Red accent colors replaced with blue on AI consent cards ✓
- Dashboard scrolls properly ✓
- InsightHero is collapsible ✓
- All 6 platform scripts upgraded ✓
- Code quality issues fixed (ScanOverlay timer, Skeleton animation) ✓

**Still Present:**
- Notification settings not persisted (flagged in V4, still not fixed)
- Bright red error color throughout (#EF4444)
- No error boundaries
- No test infrastructure

**New Issues Found:**
- `computeDashboardData` `any` type (C1) — always existed but not flagged
- Missing Supabase env validation (C2) — always existed
- Epistemic restraint borderline phrases in suggested content text (M43-M45)
- Onboarding icon mismatches (I7)
- Unused imports (M1)

## Recommended Next Steps (Priority Order)

1. **C1-C3**: Type safety for computeDashboardData, env validation, error boundaries
2. **I10-I13**: Fix all bright red/yellow color violations
3. **I1-I2**: Persist settings, add profile refresh
4. **I8-I9**: Fix unsafe type casts and weak validation
5. **M43-M45**: Tighten epistemic restraint language
6. **M15**: Wire up Plus subscription card
7. **M19-M20**: Fix scanner copy issues
8. **M37-M38**: Improve platform script consistency
9. **M35-M36**: Add testing and linting infrastructure
10. **Everything else**: Visual polish and code quality
