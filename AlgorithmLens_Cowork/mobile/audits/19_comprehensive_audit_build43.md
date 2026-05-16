# AlgorithmLens — Comprehensive Read-Only Audit
## Build #43 / branch `claude/upbeat-dirac-a374dc` / 2026-05-03

**Scope:** Mobile app (`AlgorithmLens_Cowork/mobile`). Read-only walkthrough of every screen, every flow, every component touched on TestFlight build #43. Captures structural bugs, visual issues, UX friction, copy problems, accessibility, performance, dead code, and untested paths. The "if-you-only-do-N-things" lists at the end are the one-shot prioritization for build #44.

**Severity scale**
- **critical** — blocks ship, App Store risk, data loss, or unrecoverable state
- **high** — user-visible defect that breaks the golden path or makes the app feel broken
- **medium** — friction, polish gap, or correctness issue users will notice on second look
- **low** — small inconsistency, would feel "off" to a designer, won't be flagged by most users
- **nitpick** — only matters if everything else is perfect

**Effort scale**
- **trivial** — one line, copy edit, small style change (under 15 min)
- **small** — single file, scoped change (under 1 hour)
- **medium** — touches a few files, requires light testing (1–4 hours)
- **large** — architectural / cross-cutting / needs design (half day or more)

**Action scope**
- **local** — single file, no callers affected
- **structural** — multiple files, may affect data shape or navigation
- **autonomous** — Claude Code can do it without judgment calls
- **judgment** — needs designer/user input

---

# PART 1 — STRUCTURAL BUGS

## 1.1 Dashboard "No scans yet" after a successful broadcast scan
**severity: critical · effort: small · structural · autonomous**

### Trace

| step | file | what happens |
|---|---|---|
| 1 | [app/broadcast/[platform].tsx:261](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx:261) | `handleViewResults` collects frames, stores them in `analysisDataStore`, navigates to `/analysis/[sessionId]` |
| 2 | [app/analysis/[sessionId].tsx:52](AlgorithmLens_Cowork/mobile/app/analysis/[sessionId].tsx:52) | `useAnalysis().start(...)` runs the pipeline |
| 3 | [src/lib/analysis/broadcastAnalysisPipeline.ts:296](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:296) | `SAVING` stage calls `persistScan` |
| 4 | [broadcastAnalysisPipeline.ts:772](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:772) | `supabase.from('scans').insert(scanRow)` — 15s timeout |
| 5 | [broadcastAnalysisPipeline.ts:304-316](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:304) | If insert fails, error is swallowed: `saveWarning` is set on `scanResult.debug.warnings` and `onComplete` still fires |
| 6 | [src/components/analysis/BroadcastResultsSummary.tsx](AlgorithmLens_Cowork/mobile/src/components/analysis/BroadcastResultsSummary.tsx) | Displays results — **never reads `result.debug.warnings`** |
| 7 | User taps "View Full Dashboard" → `router.replace('/(tabs)/dashboard')` |
| 8 | [src/hooks/useDashboard.ts:64](AlgorithmLens_Cowork/mobile/src/hooks/useDashboard.ts:64) | Queries `scans` table for `user_id`. If insert at step 4 failed, returns empty → "No scans yet" |

### Root cause
`persistScan` is fail-soft: the warning `'Your results are ready, but we couldn't save them to your history. They\'ll only be available during this session.'` (broadcastAnalysisPipeline.ts:315) is attached to `scanResult.debug.warnings` but **`BroadcastResultsSummary` never renders that array**. The user sees a green "Scan Complete" card with the right item count and percentages, taps "View Full Dashboard," and lands on an empty dashboard. They have no signal that the persistence failed.

### Why this is the most likely cause of the bug as observed
- The user reports analysis succeeds (88 items, percentages computed, summary shown) and dashboard is empty.
- That state exactly matches `onComplete` firing while `persistScan` failed.
- Every other dashboard data path (history tab, home recent scan card) reads from the same `useDashboard()` hook → all empty if the insert failed.

### Possible insert failure modes
1. **Supabase RLS policy** on `scans` table not permitting insert under the current role. Reads pass; writes are silently rejected. **Most likely.**
2. **Schema mismatch** — `scanRow` includes `id`, `user_id`, `platform`, `post_count`, `ad_count`, `ad_percentage`, `suggested_count`, `suggested_percentage`, `source_type`, `duration_seconds`, `raw_data`, `created_at`. If the table also requires a `scan_id` NOT NULL column (the `ScanDetail` interface at [useDashboard.ts:21](AlgorithmLens_Cowork/mobile/src/hooks/useDashboard.ts:21) lists it as optional but it might be NOT NULL in the DB), insert fails.
3. Network drop mid-insert (15s timeout would fire silently).
4. Auth token expired between session start and persist (uncommon but possible on long sessions).

### Recommended fix (build #44)
**Step 1 (local, autonomous, trivial):** In [BroadcastResultsSummary.tsx](AlgorithmLens_Cowork/mobile/src/components/analysis/BroadcastResultsSummary.tsx), render `result.debug?.warnings` if non-empty as a yellow inline banner above the CTA. One conditional view, one map.

**Step 2 (structural, autonomous, small):** In [broadcastAnalysisPipeline.ts:303](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:303), the catch around persistScan should also write a fallback row to AsyncStorage (mirror what scanner/[platform].tsx already does at lines 304–337) so the data survives. The home screen / dashboard / history can then optionally read AsyncStorage backups and merge them with Supabase results — but at minimum the user has a copy.

**Step 3 (judgment, separate ticket):** Diagnose **why** the insert is failing. Ask user to:
- Open Supabase dashboard → `scans` table → Policies. Confirm there's an INSERT policy permitting `auth.uid() = user_id`.
- Compare `scans` schema to the row written at [broadcastAnalysisPipeline.ts:720-770](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:720). Pay specific attention to `scan_id` — `ScanDetail` lists it as optional, but the table may require it.
- Check Sentry for `BroadcastAnalysisPipeline:persistScan` errors from build #43.

This is judgment-needed because Claude can't introspect the live Supabase schema.

---

## 1.2 History tab — same root cause as 1.1
**severity: critical (same bug) · effort: trivial once 1.1 is fixed**

History reads from the same `useDashboard()` hook ([app/(tabs)/history.tsx:36](AlgorithmLens_Cowork/mobile/app/(tabs)/history.tsx:36)). If insert succeeds, history is correct. If 1.1 is fixed, this is too.

There is no second reading path; the implementation is consistent.

---

## 1.3 Re-broadcasting flow
**severity: medium · effort: small · local · autonomous**

### What works
- After analysis completes, `analysisDataStore.consume()` clears the in-memory data ([analysis/[sessionId].tsx:34](AlgorithmLens_Cowork/mobile/app/analysis/[sessionId].tsx:34)).
- `broadcast.cleanup()` is called via setTimeout(2000) on viewResults ([broadcast/[platform].tsx:336](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx:336)). Good.
- `useBroadcast.cleanup` resets all state ([useBroadcast.ts:247](AlgorithmLens_Cowork/mobile/src/hooks/useBroadcast.ts:247)).

### Concerns

**1.3a** Stop-then-immediately-start race: `useBroadcast.cleanup` is async. If the user navigates back to home and starts a new scan within ~2 seconds while the cleanup setTimeout is pending, the new session's `prepareSession()` might race with the old session's `cleanupFrames()` (both touch the App Group container). Native side handles it, but worth verifying — could leave stale frames in the new session's count. **Status: untested, needs runtime check.**

**1.3b** [app/broadcast/[platform].tsx:202](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx:202): `handleBack` calls `broadcast.cleanup()` only if `broadcast.isComplete`. If the user navigates away **after** stopping but before tapping View Results (status `COMPLETE` from native event), cleanup fires correctly. But if status is still `RECORDING` when they back out, only `cancelSession()` is called — frames may remain on disk.

**Recommended fix:** Always call `broadcast.cleanup()` in the back/cancel paths in addition to `cancelSession`. Mirror the pattern from `handleViewResults`.

---

## 1.4 Sign-out / sign-in cycle
**severity: medium · effort: small · structural · autonomous**

[AuthContext.tsx:388-392](AlgorithmLens_Cowork/mobile/src/context/AuthContext.tsx:388):
```ts
const signOut = async () => {
  await supabase.auth.signOut();
  setSession(null);
  setUserProfile(null);
};
```

What's NOT cleared:
- `@algorithmlens_onboarding_completed` AsyncStorage key — old user's onboarding flag persists into next user's session, suppressing their onboarding flow ([AuthContext.tsx:23](AlgorithmLens_Cowork/mobile/src/context/AuthContext.tsx:23)).
- `@algorithmlens/streak_data` — old user's streak, scan count, milestones carry over.
- `@algorithmlens_has_seen_walkthrough`, `@algorithmlens_mock_plus_status`, `@algorithmlens_mock_sub_source`, `@alg_scan_backup_*` keys.
- Notification preferences (`pushNotifications` toggle state in AsyncStorage).

**Effect:** If user A signs out and user B signs in on the same device, user B sees user A's streak count, doesn't get onboarded, and may inherit notification preferences. The dashboard data does fetch correctly (Supabase scoped to user_id) but everything stored locally bleeds across.

**Recommended fix:** In `signOut`, before calling `supabase.auth.signOut`, clear an explicit list of AsyncStorage keys. Define a `LOCAL_STATE_KEYS` array in a new `src/lib/localState.ts` and clear it on sign-out + on auth-state-change `SIGNED_IN` when user.id differs from a previous-user-id key.

---

## 1.5 Network failure handling

**severity: high · effort: medium · structural · autonomous**

### Audit by path

| path | failure mode | current behavior | rating |
|---|---|---|---|
| `getSession` at launch | rejected/hangs | 5s timeout race + 7s hard-failsafe → defaults to logged-out ([AuthContext.tsx:128-185](AlgorithmLens_Cowork/mobile/src/context/AuthContext.tsx:128)) | **good** |
| `fetchOrCreateProfile` | rejected/hangs | 5s timeout → defaults to local AsyncStorage flag ([AuthContext.tsx:300-315](AlgorithmLens_Cowork/mobile/src/context/AuthContext.tsx:300)) | **good** |
| `signInWithPassword` | network drop | error.message displayed in `authError` state ([login.tsx:94](AlgorithmLens_Cowork/mobile/app/(auth)/login.tsx:94)) | **OK** but raw Supabase error message is technical |
| `signInWithOAuth` | OAuth flow broken (see 1.7) | n/a | **broken** |
| `useDashboard.fetchScans` | rejected/timeout | 10s timeout, friendly error string ([useDashboard.ts:96](AlgorithmLens_Cowork/mobile/src/hooks/useDashboard.ts:96)) | **good** |
| Gemini analysis (per-frame) | 429 / network error | retry exhaustion → counted as `apiError`, error text surfaced in formatAnalysisOutcomes summary ([broadcastAnalysisPipeline.ts:532](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:532)) | **good** |
| `persistScan` | RLS / network | swallowed silently into `result.debug.warnings`, never displayed (see 1.1) | **broken** |
| `requestBackendEnrichment` | any | swallowed, fire-and-forget ([broadcastAnalysisPipeline.ts:336](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:336)) | **acceptable** (non-fatal) |
| `notifications.scheduleReminder` | denied | non-blocking, console.warn | **acceptable** |
| Stripe portal session | failure | error message surfaced via Alert ([settings.tsx:288](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:288)) | **good** |

**Findings:**
- Login network errors leak Supabase's raw "Invalid login credentials"-class messages to the UI. `getUserFriendlyNetworkError` exists in [src/lib/networkUtils.ts](AlgorithmLens_Cowork/mobile/src/lib/networkUtils.ts) but isn't used in login.tsx. Apply it.
- `persistScan` failure is the silent path that produces the "No scans yet" bug. Surface it (see 1.1 fix).

---

## 1.6 Frame loss — partial fix in build #43, residual edge case
**severity: medium · effort: small · local · autonomous**

### What build #43 fixed
[broadcast/[platform].tsx:304](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx:304):
```ts
const filename = frame.local_path.split('/').pop() || `${frame.frame_id}.jpg`;
```

When `local_path === ''` (because native `framePaths` is shorter than `rawMetadata`), `''.split('/').pop()` returns `''`, falsy → falls back to `${frame_id}.jpg`. Build #43's fix corrected the missing `.jpg` extension.

### Residual edge case
The fix only helps when a `.jpg` file actually exists at `<frame_id>.jpg` on disk. If the metadata claims 50 frames but only 29 `.jpg` files exist (i.e. the trailing 21 are entirely missing from disk, not just from the framePaths array), `getFrameBase64` still returns null for those. The pipeline counts them as `framesNoBase64` and the user sees "21 missing frame data" in the failure message.

This is a real native-side edge case (extension stops mid-write, app group write quota, OS-level termination). The mitigation is on the native side: the BroadcastExtension should ensure metadata is only written **after** the corresponding `.jpg` file is fsynced.

**Verification needed at runtime:** read `__broadcastDiag.lastMetadataCount` vs `__broadcastDiag.lastDiskCount` after each scan. If they differ, the count gap is the residual issue. The footer trail already shows this (`md/dk=N/M`) — once removed (see 2.1 below), surface this in dev only.

---

## 1.7 OAuth flow — confirmed broken, multi-day fix
**severity: high · effort: medium-large · structural · judgment+autonomous**

### What's missing

**a. `expo-web-browser` is not installed.** Verified via [package.json](AlgorithmLens_Cowork/mobile/package.json:13). `supabase.auth.signInWithOAuth` opens the system browser via `Linking.openURL` by default; the user authenticates externally and returns via deep link. Without `expo-web-browser` and an `WebBrowser.openAuthSessionAsync` wrapper, the session token won't reliably be captured back into the app on iOS.

**b. No callback route handler.** `app/auth/callback.tsx` does not exist (verified via `ls app/`). The deep link `algorithmLens://auth/callback` (note camelCase — the scheme in app.config.ts is lowercase `algorithmlens`, **case mismatch** ([AuthContext.tsx:398](AlgorithmLens_Cowork/mobile/src/context/AuthContext.tsx:398))) has no route to handle the redirect.

**c. Apple Sign-In package missing.** `expo-apple-authentication` is not installed; calling `signInWithOAuth('apple')` at most opens Apple's web flow (which is rejected by Apple guideline 4.8 if the native flow is available on iOS).

### Recommended fix outline

1. `npm install expo-web-browser expo-apple-authentication`
2. Fix scheme casing: change `algorithmLens://` to `algorithmlens://` in [AuthContext.tsx:398](AlgorithmLens_Cowork/mobile/src/context/AuthContext.tsx:398).
3. Create `app/auth/callback.tsx` that reads URL fragments / deep-link params and calls `supabase.auth.exchangeCodeForSession`.
4. Wrap `signInWithOAuth` with `WebBrowser.openAuthSessionAsync` so the session is captured.
5. For Apple specifically on iOS, branch to `expo-apple-authentication.signInAsync` and call `supabase.auth.signInWithIdToken` with the returned identityToken.
6. Test deep link via `xcrun simctl openurl booted algorithmlens://auth/callback`.

### App Store guideline 4.8
If you offer Google Sign-In in a paid app (or any app with login), Apple **requires** Sign in with Apple as an option. Currently both buttons render but Apple's flow doesn't actually work. If you submit with Google working but Apple silently failing, expect a rejection.

**Estimate:** 6–10 hours including testing across cold-start and warm-start scenarios. Defer to build #45 unless time permits — for build #44 either disable both OAuth buttons (hide them, leave only email) or proceed with email-only and add OAuth post-launch.

---

## 1.8 Other untested paths

### Routes never confirmed at runtime in TestFlight
*(verified by walking expo-router structure, then matching against user-reported "functionally working" list)*

| route | status | notes |
|---|---|---|
| `/(auth)/login` | tested ✓ | email/password works |
| `/(auth)/onboarding` | tested ✓ | 3 screens |
| `/(tabs)/index` (Home) | tested ✓ | |
| `/(tabs)/dashboard` | tested ✓ but broken (see 1.1) | |
| `/(tabs)/history` | tested ✓ but empty (see 1.2) | |
| `/(tabs)/settings` | partially tested | sub-flows below |
| `/(tabs)/scan` | **untested** | hidden tab; CTAs route here from dashboard empty state and "Scan Another Platform" |
| `/scanner/[platform]` | tested ✓ for YouTube only | other platforms unverified |
| `/broadcast/[platform]` | tested ✓ | |
| `/analysis/[sessionId]` | tested ✓ | |
| `/checkout/success` | **untested** | RevenueCat is mocked, Stripe path not exercised |
| `/checkout/cancel` | **untested** | same |

### Settings sub-flows untested

- **Manage Subscription** ([settings.tsx:250](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:250)) — opens App Store / Play Store / Stripe portal. Untested because nobody is Plus.
- **Restore Purchases** ([settings.tsx:297](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:297)) — depends on RevenueCat (mocked).
- **Push notifications toggle** ([settings.tsx:179](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:179)) — calls `enableNotifications`. iOS permission prompt + scheduling has not been verified.
- **Frequency picker** — untested.
- **Delete Account** — UI exists but **the action is fake** (see Part 1.8a below).

### 1.8a CRITICAL: Delete Account is non-functional
**severity: critical for App Store submission · effort: large · structural · judgment**

[settings.tsx:866-873](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:866):
```ts
onPress={() => {
  setShowDeleteModal(false);
  // TODO: Implement actual account deletion API call
  Alert.alert(
    'Feature Coming Soon',
    'Account deletion will be available in a future update. Contact support@algorithmlens.com for assistance.'
  );
}}
```

**App Store Guideline 5.1.1(v):** "Apps that support account creation must also offer account deletion within the app." Apple will reject this. Either:
- (a) Implement a real account deletion endpoint on the backend that calls `supabase.auth.admin.deleteUser` and deletes scan rows.
- (b) Remove the Delete Account button entirely and provide an email-based deletion flow per Apple's exception (acceptable but slower for users).

**Recommendation:** for build #44, replace the fake Alert with a real `mailto:support@algorithmlens.com?subject=Delete%20my%20account&body=...` Linking call. That's 10 minutes of work and satisfies the guideline minimally. Implementing the real flow is multi-day.

### 1.8b Plus / RevenueCat is entirely mocked
**severity: low for TestFlight beta · medium for public launch · large effort to make real**

[src/services/revenueCat.ts:1-6](AlgorithmLens_Cowork/mobile/src/services/revenueCat.ts:1):
```ts
/**
 * RevenueCat Service — Native IAP Integration
 * MOCK: Replace with RevenueCat when API keys are configured.
 */
```

`react-native-purchases` is **not** in [package.json](AlgorithmLens_Cowork/mobile/package.json). Plus tier is simulated via AsyncStorage. UpgradeModal also has a `// TODO: Replace with real RevenueCat presentPaywall()` ([UpgradeModal.tsx:160](AlgorithmLens_Cowork/mobile/src/components/plan/UpgradeModal.tsx:160)).

**Implication for TestFlight #44:** the "Upgrade to Plus" CTAs work locally but no money changes hands. Acceptable for a private beta as long as you don't claim Plus is real in the App Store metadata yet. **Do not** advertise paid Plus in the App Store description until this is wired up.

### 1.8c Backend `/api/scan/desktop` enrichment endpoint
The pipeline fires `requestBackendEnrichment` ([broadcastAnalysisPipeline.ts:794](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:794)) which calls `api.post('/api/scan/desktop', payload)`. Whether this endpoint exists and what it does is opaque from the mobile-app side. If the backend isn't deployed / isn't accepting that route, every scan logs a non-fatal warning. Not user-visible but worth verifying.

---

# PART 2 — VISUAL/AESTHETIC AUDIT

## 2.1 Debug footer is visible on every screen
**severity: critical · effort: trivial · local · autonomous**

[app/_layout.tsx:148-289](AlgorithmLens_Cowork/mobile/app/_layout.tsx:148) renders `<DebugCheckpointTrail>` unconditionally. This is the multi-row diagnostic overlay (`fonts: ok | auth: ok | user: in | onb: yes | gs:1/0/0 | fp:1/1/0/0 | bcast: mod=ok ava=ok ...`).

**It is shown on every screen of the app, including login, onboarding, home, dashboard, broadcast, analysis.** Pre-public-TestFlight invitations, this MUST be gated.

**Fix:** Wrap with `{__DEV__ && <DebugCheckpointTrail ... />}` or behind a runtime feature flag. The wrapping change is one line. The `__DEV__` guard means it disappears on EAS production builds but stays on `npx expo start` builds for diagnostics. **Do this before any non-team TestFlight invite.**

This single change alone will dramatically improve the perceived polish of the app.

## 2.2 Color system

### Health: B+
- LIGHT_COLORS / DARK_COLORS in [theme.ts](AlgorithmLens_Cowork/mobile/src/lib/theme.ts) define a coherent system: blue (`#2563EB` primary), green secondary, neutral 50–900 scale, semantic borders, brand tints.
- ThemeContext supports light/dark and is correctly threaded via `useTheme()`.
- WCAG-compliant text-on-background pairs (textMain `#1E293B` on bgPage `#F7F8FC` = high contrast).

### Issues
**2.2a** 39 hardcoded hex values still exist in components, primarily in dashboard.tsx for chart colors:
- Recurring `#22C55E` (green), `#EF4444` (red), `#F59E0B` (amber) for chart legend colors ([dashboard.tsx:1541, 1543, 1546, 1548, 1786, 1790, 1908, 2664, 2666, 2669, 2671, 2689, 2691, 2694, 2696](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx)).
- `#F8FAFC` ([dashboard.tsx:538, 734, 788](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx)) — same as theme `bgPrimary` but hardcoded.
- `#FAFBFE` ([dashboard.tsx:2083, 2382](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx)) — same as theme `bgCardGradientEnd` but hardcoded.
- `#F59E0B` for a "delta" arrow ([dashboard.tsx:1908](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx)).
- Debug footer text colors `#fff`, `#fbb`, `#bdf`, `#bfd` (these are debug-only, not user-facing if 2.1 is fixed).

**Effort:** map each hex to the matching `colors.*` token — under 1 hour.

**2.2b** **Dark mode coverage looks complete** — DARK_COLORS is defined, ThemeProvider switches based on system. Spot check on the LinearGradient hero CTA in CalmHomeScreen suggests it'll look fine in dark mode (uses `colors.gradientPrimaryStart/End`). But these hardcoded hex values **will not invert in dark mode**, so any chart using `#22C55E`/`#EF4444` will look identical in light and dark — fine for green/red, jarring for the gray neutrals (`#F8FAFC` will show as a light bar on a dark background).

### Calm/Oura tone
The palette is closer to **Linear/Notion** than **Oura**. Oura is restrained warm grays, very low saturation, pale gold accents. AlgorithmLens uses bright royal blue (#2563EB) as primary, plus saturated semantic greens/reds in charts. If the user wants Oura-feel, the primary should pull toward a desaturated indigo or warm gray, and chart accents should be muted.

This is a judgment-needed palette overhaul, large effort. **Recommendation:** keep the current palette for build #44; revisit if user agrees the visual identity should shift.

## 2.3 Typography

### Health: A−
- Geist is loaded correctly via `expo-font` ([_layout.tsx:345-350](AlgorithmLens_Cowork/mobile/app/_layout.tsx:345)).
- `GL_TYPOGRAPHY` provides a coherent type scale (display, h1, heroTitle, h2, h3, body, bodyLarge, bodySmall, caption, captionSmall, label, labelBold, etc.).
- Letter-spacing tokens applied per-variant per [gluestackTheme.ts:56](AlgorithmLens_Cowork/mobile/src/lib/gluestackTheme.ts:56).
- The font gate was correctly removed in build #33 so the app doesn't hang on font load.

### Issues
- `GL_TYPOGRAPHY` is used inconsistently — sometimes via the `<Text variant="...">` glue component (good), sometimes via `style={{ ...GL_TYPOGRAPHY.body }}` spread (acceptable), sometimes via raw `fontSize/fontWeight` props ([login.tsx:215, 227](AlgorithmLens_Cowork/mobile/app/(auth)/login.tsx) — these inline `fontWeight: 'bold'` overrides on icons but use GL_TYPOGRAPHY for sizing).
- A very small number of inline `fontSize: 13`/`fontSize: 11` exist (dashboard tab pill ([dashboard.tsx:3134](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx:3134)) uses `RFValue(13)` directly, ErrorBoundary's diagnostic block uses `fontSize: 11`). These are intentional escape hatches but should be reviewed.

### Hero typography
The "heroTitle" variant is used on Home, History, Settings — appropriate. "display" on onboarding screen 1 — appropriate. No inconsistencies between same-class screens.

## 2.4 Spacing

### Health: A
SPACING tokens are 4pt-grid based (xxs=2, xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32, 4xl=48, 5xl=64, 6xl=96). Used consistently throughout. No major cramping or runaway gutters observed.

### Notes
- Header heights are inconsistent: dashboard has `paddingTop: SPACING.xl, paddingBottom: SPACING.md`, Settings has `paddingVertical: SPACING.xl`, History has `paddingVertical: SPACING.xl`. Not wrong, but a `<ScreenHeader>` component would standardize this.

## 2.5 Component visual quality

### Buttons
Glue `Button.tsx` provides primary/secondary/ghost variants with size lg/md/sm. States: default, pressed (via TouchableOpacity activeOpacity), disabled (opacity reduction), loading (ActivityIndicator). Corner radii consistent via `RADIUS.md`.

**Issue 2.5a:** Some buttons throughout the app are **raw `TouchableOpacity` blocks** instead of using the `<Button>` component:
- Dashboard tab strip pills ([dashboard.tsx:3200](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx:3200)) — uses raw TouchableOpacity (intentional, custom pill UI).
- Login OAuth buttons use Glue Button ✓.
- Onboarding "Next" / "Get Started" use Glue Button ✓.
- Broadcast screen "Use Precision Mode" CTA uses raw TouchableOpacity ([broadcast/[platform].tsx:388](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx:388)).
- Scanner screen "View Your Dashboard" uses raw TouchableOpacity ([scanner/[platform].tsx:733](AlgorithmLens_Cowork/mobile/app/scanner/[platform].tsx:733)).
- BroadcastResultsSummary "View Full Dashboard" uses raw TouchableOpacity.
- Empty state CTAs in dashboard / history use raw TouchableOpacity.

This is a coverage-gap problem. **Effort:** medium-small to swap each raw button for `<Button>`. Doing so unifies pressed-state animation and a11y labels.

### Cards
Glue `Card.tsx` exists. Used inconsistently — `MetricCard`, `BigNumber`, `FeedScoreCard`, `RecentScanCard`, `WeeklySummaryCard` are all custom components rather than wrapping `Card`. Not necessarily wrong (each has bespoke layout) but the shadow/border treatment varies:
- FeedScoreCard uses `shadows.card`
- WeeklySummaryCard uses `shadows.medium` (assumption — verify)
- MetricCard uses `shadows.soft`

Visually subtle but a designer would notice on a hero shot.

### Forms
Login text inputs are correctly themed. Placeholder color, error border, autocomplete hints, accessibility labels — all good ([login.tsx:294-363](AlgorithmLens_Cowork/mobile/app/(auth)/login.tsx:294)).

### Lists
History uses `SectionList` with `getItemLayout` for virtualization — correct. Dashboard's tab content scrolls via outer ScrollView; nestedScrollEnabled enables inner charts. No `FlatList` performance issues observed.

### Empty states
- Home "No scans yet" empty state with mock dashboard preview is **the strongest** in the app ([CalmHomeScreen.tsx:336-457](AlgorithmLens_Cowork/mobile/src/components/home/CalmHomeScreen.tsx:336)). It teaches what the user will get.
- Dashboard empty state is decent — shows tab strip preview at 0.4 opacity, then Eye icon + "No scans yet" + CTA.
- History empty state references unread `emptyComponent` — see [history.tsx:728](AlgorithmLens_Cowork/mobile/app/(tabs)/history.tsx:728) — at line ~480 (not fully read but well-structured).

## 2.6 Iconography

Lucide icons throughout, sizes generally 14/16/18/20/24/28 — internally consistent. Stroke widths vary 1.5/1.8/2 depending on context (decorative vs functional).

### Issues
**2.6a** Platform icons mix Lucide for most platforms with a custom `XPlatformIcon` for X (formerly Twitter):
- Instagram, YouTube, TikTok, Facebook, Reddit → Lucide stroke icons.
- X → custom SVG (correct, since Lucide doesn't have current X branding).

These look visually inconsistent — Lucide's stroked Instagram icon is monochrome line art, the X icon is a filled glyph. On the platform picker grid this jumps out.

**Recommendation:** use the official platform glyphs (with proper licensing) or commit to a monochrome stroke style across all six. Lucide ships filled variants for Instagram (`instagram` is stroke; there's no filled). For consistency, swap all six to a custom filled-glyph set sourced from each platform's brand kit. **Effort:** medium.

**2.6b** ModeToggle uses `Radio` icon for "Screen Capture" and `Type` icon for "Quick Scan" — `Radio` is OK (broadcast metaphor), `Type` is weird (suggests typing). A `Globe` or `Compass` icon would better signal "browser-based scan."

## 2.7 Imagery

### Splash icon
[app.config.ts:25](AlgorithmLens_Cowork/mobile/app.config.ts:25): `image: './assets/splash-icon.png'`. The user notes this is the Expo bullseye placeholder. Confirmed by the existence of [`assets/splash.svg`](AlgorithmLens_Cowork/mobile/assets/splash.svg) which appears to be a custom icon (`splashLensGrad` gradient suggests the eye/lens design) but the **PNG actually wired into app.config is the placeholder.**

**Fix:** export the SVG to PNG (1284×2778 portrait per the SVG canvas) and replace `splash-icon.png`. **Effort:** trivial. **Action: must do for build #44.**

### Onboarding
Onboarding screen 1's "phone frame" with overlapping Eye / BarChart3 / Shield icons in concentric blue circles ([onboarding.tsx:248-336](AlgorithmLens_Cowork/mobile/app/(auth)/onboarding.tsx:248)) is well-executed. Animated entrance is smooth.

## 2.8 Animation and motion

### Strengths
- Reanimated 4.x throughout; `useSharedValue` / `useAnimatedStyle` / `withSpring` / `withTiming` used correctly.
- StaggeredList provides cascade entrance ([CalmHomeScreen.tsx:281](AlgorithmLens_Cowork/mobile/src/components/home/CalmHomeScreen.tsx:281)).
- BottomSheet uses `@gorhom/bottom-sheet` with sensible damping/stiffness configs.
- AccessibilityInfo.isReduceMotionEnabled is checked before tab switch animation in dashboard ([dashboard.tsx:2914](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx:2914)) — good.

### Issues
- **The tab switch fade in dashboard is 80ms out + 150ms in = 230ms total.** Feels slightly laggy because users tap and see nothing for 80ms before the new content appears. Reduce to 60ms out + 120ms in or cross-fade.
- The BroadcastResultsSummary card has no entrance animation — it just appears. Adding a 250ms fade-in (matching the analysis-screen ContentFadeIn) would feel cleaner.
- The BroadcastOverlay recording dot pulse (1s in, 1s out) is on the slow side. Real recording UIs (Voice Memos, Loom) pulse closer to 750ms. Faster pulse reads as more "live."

## 2.9 Screen-by-screen visual issues

### 2.9.1 Login ([app/(auth)/login.tsx](AlgorithmLens_Cowork/mobile/app/(auth)/login.tsx))
1. **Apple icon is an emoji 🍎** ([login.tsx:227](AlgorithmLens_Cowork/mobile/app/(auth)/login.tsx:227)) `icon={<Text style={{ fontSize: GL_TYPOGRAPHY.h3.fontSize }}>🍎</Text>}`. This is jarring against the Geist-rendered Google "G". Use the official Apple logo glyph (you can ship an SVG via `expo-image` or react-native-svg, or use the SF Symbol "applelogo" via `react-native-symbols`). **severity: medium**
2. **Google "G" is just a Text "G"** — not the brand mark. Same fix.
3. The 🍎 is **disallowed by user preference** ("Only use emojis if the user explicitly requests it" from CLAUDE.md doesn't appear here, but the user dislikes emojis broadly).
4. Eye icon in app-icon container uses strokeWidth `1.5`, but the broadcast extension menu uses strokeWidth `1.5` too — consistent.
5. Form inputs are uniform but have a 48-min-height that's tighter than iOS default 50. A11y still passes.
6. "Sign in with email" link is correctly underlinked-by-color (primary blue) but **missing underline**. Make it `textDecorationLine: 'underline'` for better discoverability.
7. AuthError messages: `setAuthError('Account created! Signing you in...')` ([login.tsx:136](AlgorithmLens_Cowork/mobile/app/(auth)/login.tsx:136)) is a SUCCESS message rendered in `colors.error` red. Confusing.
8. There is no privacy policy / TOS link on the login screen. Apple's guideline 5.1.1 requires this for new accounts.

### 2.9.2 Onboarding ([app/(auth)/onboarding.tsx](AlgorithmLens_Cowork/mobile/app/(auth)/onboarding.tsx))
1. Em dash on screen 1: "A clear picture of what appears — sources, ads, tone, and more." ([onboarding.tsx:356](AlgorithmLens_Cowork/mobile/app/(auth)/onboarding.tsx:356)) **violates user preference**.
2. accessibility labels include em dashes ([onboarding.tsx:430, 601](AlgorithmLens_Cowork/mobile/app/(auth)/onboarding.tsx:430)) — only matters if user dislikes them in screen-reader output too; probably no-op.
3. Screen 3 uses 6 platform tiles. On a 375pt-wide iPhone 13, three 100pt-wide tiles per row + 16pt gaps = 332pt + 32pt of gaps = 364pt. Fits. On a 320pt-wide iPhone SE, this overflows. The grid uses `flexWrap` so it wraps to 2-per-row, but visually the "3-rows of 2" pattern is messier than "2-rows of 3". Verify on smallest-supported device.
4. The "AI consent notice" on screen 3 is decent but the language "AlgorithmLens analyzes your feed locally using AI. Your data stays on your device." is **misleading** — frames are sent to Google Gemini. See section 4 for the privacy-copy contradiction.
5. "Skip" button for screens 1 & 2 is a ghost button with reasonable affordance. Skip on screen 3 is a Pressable text link "Skip for now" — inconsistent treatment of the same action.

### 2.9.3 Home / CalmHomeScreen ([src/components/home/CalmHomeScreen.tsx](AlgorithmLens_Cowork/mobile/src/components/home/CalmHomeScreen.tsx))
1. Em dash on subheading line 631: `'Welcome back — ready for a fresh scan?'` (the `—` IS an em dash) **violates user preference**.
2. **Greeting + subheading + CTA is densely packed** — there's no visual breathing room between "Good morning" and the subheading, and the CTA is immediately below. Consider a small accent (a horizontal divider, or a 24pt vertical gap in the StaggeredList).
3. The hero CTA gradient (`gradientPrimaryStart` → `gradientPrimaryEnd`) is bright royal blue. With Oura aspirations this should be quieter — consider a single solid color with subtle gradient overlay.
4. Empty state mock dashboard preview is good but the placeholder bars use `colors.borderLight` (very faint) — on some light-mode backgrounds these are nearly invisible. Bumping opacity slightly (0.7 → 0.85) or using `bgSecondary` instead of `borderLight` would make the preview register as actual UI shape.
5. "YOUR SCORE" / "THIS WEEK" / "YOUR PROGRESS" overlines use `colors.textTertiary` and feel slightly dim. They're correctly styled; just visually weak.
6. The "Upgrade to Plus" inline card ([CalmHomeScreen.tsx:533-577](AlgorithmLens_Cowork/mobile/src/components/home/CalmHomeScreen.tsx:533)) has minimal visual hierarchy — could use a Sparkles icon at top + bolder primary CTA color.
7. **No pull-to-refresh affordance is visible** on first paint — the user has to discover it. iOS convention is acceptable; consider a subtle "pull down to refresh" hint on first scroll or a Skeleton-bound loading on focus to make the refresh discoverable.

### 2.9.4 Platform Bottom Sheet ([src/components/home/PlatformBottomSheet.tsx](AlgorithmLens_Cowork/mobile/src/components/home/PlatformBottomSheet.tsx))
1. Multi-tap interaction confirmed: tap CTA → tap platform → see ModeToggle → tap Start Scan = **3 taps** (or 4 if user taps wrong platform first). User reported this; see UX section 3.3 for fix.
2. `lastPlatform` defaults to `'instagram'` if no history ([PlatformBottomSheet.tsx:108](AlgorithmLens_Cowork/mobile/src/components/home/PlatformBottomSheet.tsx:108)). Reasonable.
3. The Mode toggle is **only visible after a platform is selected** — but the platform comes pre-selected (defaulting to 'instagram'), so the toggle is visible from the moment the sheet opens. The "Start Scan" button is also visible but disabled until a platform is selected (which always happens). Net: the user sees Choose a platform → 6 platform tiles (one selected) → mode toggle → Start Scan button. This is dense.
4. The "Start Scan" button background goes `colors.primary` when enabled, `colors.borderSlate200` when disabled. On a card already on `colors.bgCard` (white), the disabled state reads as nearly invisible. Use a darker disabled state or hide entirely while disabled.
5. Helper text "Choose a platform above to get started" appears below the disabled button — good fallback affordance.
6. ModeToggle Screen Capture has the "RECOMMENDED" badge but **defaults to Quick Scan** ([PlatformBottomSheet.tsx:96](AlgorithmLens_Cowork/mobile/src/components/home/PlatformBottomSheet.tsx:96)). User has to toggle to get the recommended mode. Inverted defaults.

### 2.9.5 Broadcast screen ([app/broadcast/[platform].tsx](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx))
1. Em dash in alert: "Try again — make sure to scroll your feed for at least 15 seconds after starting." ([broadcast/[platform].tsx:271](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx:271)) **violates user preference**.
2. Em dash: "Launched from Shortcut — tap the button below to start broadcasting" ([broadcast/[platform].tsx:540](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx:540)).
3. **Privacy claim contradiction**: the broadcast screen footer says "Frames are processed on-device and never leave your phone without your explicit action" ([broadcast/[platform].tsx:653-655](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx:653)). This **contradicts** the analysis screen footer ("Frames are sent to Google's Gemini AI") and the actual code path. **severity: high — material misrepresentation in a transparency-focused app.** See section 4.5.
4. The screen has a `<ScrollView>` containing a header, hint banner, NativeBroadcastPicker, the picker button, the BroadcastOverlay, the "How it works" steps, and the privacy footer — a lot of vertical content for a screen the user is supposed to leave (to go to Instagram/etc.). Consider compressing.

### 2.9.6 Broadcast Overlay ([src/components/broadcast/BroadcastOverlay.tsx](AlgorithmLens_Cowork/mobile/src/components/broadcast/BroadcastOverlay.tsx))
1. RECORDING state: pulsing red dot + elapsed timer + "X frames captured from Y" + Stop button + "Back to Y" button. Clear and well-laid-out.
2. The pulse animation drops opacity to 0.4. Some recording UIs use slight scale change (1.0 → 0.85 → 1.0). Either is fine.
3. **No frame count quality indicator** until thresholds are met — once met, "Stop Recording" goes from a warning state (yellow border?) to a positive state. Currently the `canSave` boolean only changes the warning banner ([BroadcastOverlay.tsx:215-223](AlgorithmLens_Cowork/mobile/src/components/broadcast/BroadcastOverlay.tsx:215)) but doesn't change the Stop button styling. A subtle border-color change would reinforce "you can save this now."

### 2.9.7 Analysis screen ([app/analysis/[sessionId].tsx](AlgorithmLens_Cowork/mobile/app/analysis/[sessionId].tsx))
1. The Share button in the header ([analysis/[sessionId].tsx:297-315](AlgorithmLens_Cowork/mobile/app/analysis/[sessionId].tsx:297)) **does nothing** (handleSharePress is empty `() => {}`). Hide it for build #44 or implement Share. **severity: medium**
2. Em dash: "Examining your feed — each screenshot..." ([analysis/[sessionId].tsx:372](AlgorithmLens_Cowork/mobile/app/analysis/[sessionId].tsx:372)).
3. Em dash: "Compiling your personalized feed report — ads, sources, tone, and content patterns..." ([analysis/[sessionId].tsx:384](AlgorithmLens_Cowork/mobile/app/analysis/[sessionId].tsx:384)).
4. The "What's happening" card with 3 step rows (Frame Analysis / Deduplication / Report Building) is well-designed.
5. Privacy note bottom: "Frames are sent to Google's Gemini AI for analysis. No personal account credentials are shared. Results are stored in your AlgorithmLens account." — the phrasing "stored in your AlgorithmLens account" is true if persistScan succeeds; misleading if it doesn't.
6. The status text "Analysis complete — N feed items found" ([useAnalysis.ts:267](AlgorithmLens_Cowork/mobile/src/hooks/useAnalysis.ts:267)) has em dash.

### 2.9.8 Analysis Results / BroadcastResultsSummary ([src/components/analysis/BroadcastResultsSummary.tsx](AlgorithmLens_Cowork/mobile/src/components/analysis/BroadcastResultsSummary.tsx))
1. The success header has a large CheckCircle icon, "Scan Complete" text, and "N feed items found from M frames" subtitle. Good.
2. Two `MiniStat` cards (Broadcast / Duration) and a key-findings list (Ads / Top topics / Political / Tone). Compact and informative.
3. **No save-failure warning surfaced** (see 1.1) — even when `result.debug.warnings` contains SAVE_FAILED, it's not shown.
4. Visual hierarchy: success header (brightest) → MiniStats → Key findings → CTA. The CTA "View Full Dashboard" feels like an afterthought because it's a flat blue button without any visual lift. Adding `shadows.medium` would help.

### 2.9.9 Dashboard ([app/(tabs)/dashboard.tsx](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx))
This file is **3248 lines** — the largest in the app. Mostly tab content (Overview, Sources, Ads, Politics, Tone, Suggested vs Followed). Let me note systemic issues rather than per-section ones:

1. Em dash count in the dashboard alone: **22 instances** (counted via grep). Includes user-facing copy in InsightHero descriptions, MetricCard placeholders (`value="—"`), suggestion strings, methodology disclosures.
2. The em dashes for missing values (`value="—"` on disabled MetricCards) are **conventional and fine** — that's the standard placeholder character. Don't replace those. Only replace the em dashes in prose ("...the algorithm wants you to..." style — none of these exist).
3. **22 hardcoded hex colors** (mostly chart accents) — see 2.2a.
4. Tab labels: "Sources" → "Who Shapes Your Feed", "Ads" → "Ads & Promotions", "Politics" → "Political Exposure", "Tone" → "Emotional Tone", "Suggested vs. Followed" — these are **longer than the CLAUDE.md tab spec** but they're more descriptive. Consistent with the project's epistemic-restraint preference. OK.
5. The horizontally-scrollable tab strip is `paddingRight: SPACING['3xl']` to hint scrollability. Good. But the 6 tabs total are too many to fit horizontally on smaller phones — verify the rightmost tabs are reachable.
6. Active tab styling uses `(colors as any)[tab.accent]` — accessing dynamic properties via `as any` is a TypeScript escape hatch ([dashboard.tsx:3212](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx:3212)). Works at runtime but loses type safety. Define a `tourAccent` type.
7. The `learnMoreUrl: 'https://algorithmlens.com/dashboard#overview'` and similar URLs ([dashboard.tsx:268, 950, 1200, 1610, 2121](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx)) — the website needs to host these anchor sections. If it doesn't, the "Learn more" link in InsightHero leads nowhere meaningful.

### 2.9.10 History ([app/(tabs)/history.tsx](AlgorithmLens_Cowork/mobile/app/(tabs)/history.tsx))
1. Em dash: `"{getRelativeTime(item.created_at)} — {postCount} posts"` ([history.tsx:299](AlgorithmLens_Cowork/mobile/app/(tabs)/history.tsx:299)) — a separator. Could be a bullet `·` instead.
2. Em dash: `"{selectedScans.length}/2 selected — tap scans to compare"` ([history.tsx:540](AlgorithmLens_Cowork/mobile/app/(tabs)/history.tsx:540)).
3. PLATFORM_LABELS uses 2-letter abbreviations (IG, X, YT, TT, FB, Re) which is functional but visually inconsistent — "X" is 1 letter, others are 2. Use platform color-tinted icons instead of letter abbreviations.
4. Compare mode: when 2 scans are selected, an "action bar" appears below the header with the Compare button. Visual treatment is OK but the bar appearing/disappearing causes layout shift.
5. SectionList headers (Today / Yesterday / This Week / [Month Year]) — clean and conventional.

### 2.9.11 Settings ([app/(tabs)/settings.tsx](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx))
1. Em dash: "Upgrade to Plus — track trends over time" ([settings.tsx:628](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:628)).
2. Em dash: "— building tools that increase human agency." ([settings.tsx:779](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:779)).
3. Plus banner uses a flat `colors.primaryBlue` background card — nicely contrasted, signals premium. Good.
4. "Account" section: Email row → Sign Out button → 20pt gap → Delete Account. The 20pt gap is intentional separation but feels slightly arbitrary; a subtle divider line works better.
5. Delete Account link is `colors.error` red — correct.
6. Frequency picker reveals inline below the toggle row — clean.
7. The "About" → "Goodish" link uses `textDecorationLine: 'underline'` ([settings.tsx:775](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:775)) — good. No other underlines in the app though, slight inconsistency.

### 2.9.12 Scanner / WebView screen ([app/scanner/[platform].tsx](AlgorithmLens_Cowork/mobile/app/scanner/[platform].tsx))
1. 5 em dashes in user-facing strings ([scanner/[platform].tsx:53, 59, 65, 71, 77](AlgorithmLens_Cowork/mobile/app/scanner/[platform].tsx)).
2. The bottom-sheet results card with stat trio (Posts/Ads/Suggested) and quality gauge is well-designed.
3. The "Analysis Dimensions" placeholder pills ([scanner/[platform].tsx:709](AlgorithmLens_Cowork/mobile/app/scanner/[platform].tsx:709)) just list the 6 dashboard tabs as inert chips — they look like buttons but do nothing. Either make them tappable (deep-link to that tab) or remove them.

---

# PART 3 — UX/INTERACTION AUDIT

## 3.1 Onboarding

### Counts
- 3 screens (Value prop / How it works / Pick platform).
- Estimated time: 15s if user reads, 5s if they tap through.

### Strengths
- Each screen scannable in 2 seconds.
- Skip option on every screen (subtle but accessible).
- Reanimated transitions feel premium.
- "Pick platform" on screen 3 is a good conversion lever — primes the user to scan.

### Issues
- **Redundant FirstUseWalkthrough** ([src/components/home/FirstUseWalkthrough.tsx](AlgorithmLens_Cowork/mobile/src/components/home/FirstUseWalkthrough.tsx)) covers similar ground (Eye / Scan / Insights). It's correctly suppressed for users who completed onboarding ([FirstUseWalkthrough.tsx:69](AlgorithmLens_Cowork/mobile/src/components/home/FirstUseWalkthrough.tsx:69)) — but acts as a fallback. The onboarding flow + walkthrough is overkill. **Recommendation:** delete FirstUseWalkthrough; trust onboarding.
- The AI consent notice on onboarding screen 3 has misleading copy ("Your data stays on your device") — see Part 4.
- "Get Started" vs "Let's go" CTA copy — the second is friendlier but inconsistent. Pick one.

## 3.2 Information hierarchy

### Home
Primary action: "Scan Your Feed" CTA. Currently moved to top — good. Visually dominant via gradient + size — good.

Secondary actions: streak badge, score card, scan history, suggestions, daily tip. Each gets its own card. The "Upgrade to Plus" card sits among them and competes for attention.

### Dashboard
The InsightHero card is the hero of each tab. Tab strip is at top, hero below, supporting metrics below that. Hierarchy is clear.

## 3.3 Multi-tap friction

### Home → Scan flow audit
1. Tap "Scan Your Feed" CTA.
2. Bottom sheet opens with 6 platforms (one preselected) + Mode toggle (Quick Scan default) + "Start Scan" button (already enabled).
3. Tap "Start Scan" (or change platform / mode first).

**This is 2 taps in the happy path** (CTA + Start Scan). The user reported "4 taps" — but actually it's 2 if they accept defaults, 3 if they change platform.

The friction is **the modal complexity**: 6 platform tiles + a mode toggle = 14 tappable elements visible, and the user feels like they have to make several decisions before the actual scan starts.

### Recommended simplification (judgment-needed, large effort)
Two paths:
- **Path A (most progressive):** make the Home CTA expand to a single platform-tile carousel, no mode toggle. Default to last-used platform + Screen Capture mode. One tap = platform → start scan. The user can tap a different platform if needed. Mode toggle moves into Settings as a per-platform preference.
- **Path B (incremental):** keep the bottom sheet but auto-start the scan when the user taps a platform tile (instead of requiring a separate "Start Scan" button). Tap CTA → tap platform → scan starts. Mode toggle becomes a small dropdown / cog at the top of the sheet.

Either way, **invert the default** so Screen Capture is the default mode (the recommended one).

### Other multi-tap issues
- **Onboarding flow exits to home, then optionally re-routes to /broadcast/[platform] after a 300ms delay** ([onboarding.tsx:131-147](AlgorithmLens_Cowork/mobile/app/(auth)/onboarding.tsx:131)). The user sees a flash of Home before the broadcast screen slides up. Either skip Home entirely or remove the artificial delay.
- **Scanner success → "View Your Dashboard"** ([scanner/[platform].tsx:735-744](AlgorithmLens_Cowork/mobile/app/scanner/[platform].tsx:735)) deliberately waits 300ms before navigating, plus a 5-second loading-state timeout. Feels artificial. Either navigate immediately or show an animated transition.
- **History → tap a scan card → Dashboard** is one tap. Good.
- **Settings → notifications toggle → frequency picker** is correctly inline-disclosed.

## 3.4 Cognitive load

### Things the user shouldn't have to decide
- **Quick Scan vs Screen Capture** is a power-user decision the user mostly doesn't understand. Default to Screen Capture (broadcast) since that's the better/recommended mode. Hide Quick Scan behind "Advanced" or a Settings toggle.
- **Frequency for notifications** — the picker shows multiple options. Default to 7 days, let user change later.
- **"Compare scans" mode** in History — discoverable but few users will care. OK.

## 3.5 Error messaging

| location | message | quality |
|---|---|---|
| login error from Supabase | raw `error.message` | poor — leaks technical detail |
| `'Sign in failed. Try again'` | generic | poor — no info |
| `'Account created! Signing you in...'` rendered in `colors.error` red | confusing | wrong color |
| analysis pipeline `'No items extracted from the captured frames'` + outcome summary | informative | good |
| broadcast no-frames alert | gives 3 reasons + retry | good |
| broadcast `'Something went wrong'` after frame collection error | generic | poor — same as everything else |
| `useDashboard` `"We couldn't load your scan history right now. Pull down to try again."` | actionable | good |
| broadcast `"Couldn't Start Recording"` "We ran into a problem... If this keeps happening, restart the app." | reasonable | good |
| `'Permission Needed'` for screen capture on Android | clear | good |
| settings `'Could not update notification settings.'` | generic | poor |
| settings `'Failed to sign out'` | generic | poor |
| `'No portal URL returned.'` Stripe error | technical | poor — leaks |

**Standard for build #44:** every Alert in user-facing code should:
- Identify what failed in plain English
- Say what to do next
- Avoid Supabase / Stripe / Apple jargon

There are 25+ Alert instances; most are at least decent. The above are the worst offenders.

## 3.6 Loading states

- App launch: Splash → ActivityIndicator → tabs. Splash watchdog dismisses at 8s no matter what. Good defensive coding.
- Dashboard: Skeleton shimmer with placeholder layout matching the real content. Excellent.
- Home: ContentFadeIn wraps the screen. Fades in once data is ready.
- History: SkeletonCard ×2. Fine.
- FeedScoreCard: skeleton when feedScore is undefined. Good.
- Analysis: AnalysisProgress component with stage indicator + percent. Excellent.
- Broadcast: per-state UI with elapsed time. Excellent.
- Saving overlay during scan upload: ActivityIndicator + "Saving your scan..." — generic but acceptable.

The app is mostly **loading-state-aware**. Strong area.

## 3.7 Success states

- Scan complete on broadcast: BroadcastResultsSummary card. Good.
- Scan complete on scanner: bottom sheet expanding to half-height with stats + chart + dashboard CTA. Good.
- Onboarding complete: smooth fade + scale-out screen exit. Good.
- Sign-out: returns to login. No confirmation toast. Could add subtle.
- Notification frequency change: silent. Could add subtle toast.
- Streak milestone (5/30/100 days): MilestoneModal. Excellent — celebratory.

## 3.8 Empty states (covered above)

## 3.9 Recovery paths

- Mid-broadcast cancel: confirmation alert offers "Keep recording" vs "Discard & Exit". Good.
- Mid-analysis cancel: confirmation alert with "Keep Analyzing" vs "Cancel". Good.
- Login error: state cleared on input change. Good.
- Notification permission denied: toggle reverts. Good.

## 3.10 Discoverability

- Pull-to-refresh on dashboard, home, history. Not signposted but iOS users expect it.
- Tap a scan card to view its dashboard data. Discoverable from history but not from RecentScanCard on home (that one navigates correctly via `onRecentScanPress`).
- Compare mode in history: tappable button when 2+ scans exist. Discoverable.
- Empty state CTAs lead the user to scan. Discoverable.
- "How it works" on broadcast screen: helpful but only visible during AWAITING_BROADCAST_START. Once recording starts, the steps disappear.

## 3.11 Onboarding for product value

Once signed in, the user lands on Home. Subheading reads "See what's in your social media feed" or "Welcome back — ready for a fresh scan?". The "Scan Your Feed" CTA is unmissable.

But after the first scan, the dashboard tabs are dense. Six tabs, each with InsightHero + multiple metrics. The user may not understand what to look at first. The DashboardTour exists ([src/components/dashboard/DashboardTour.tsx](AlgorithmLens_Cowork/mobile/src/components/dashboard/DashboardTour.tsx)) — verify it actually fires on first scan completion.

---

# PART 4 — COPY AND CONTENT

## 4.1 Voice and tone

Mostly consistent, calm-professional. Eepistemic-restraint language is honored: "appears in your feed", "may suggest", no anthropomorphizing of algorithms (good).

Inconsistencies:
- "Quick Scan" vs "Precision Mode" — same feature, two names. See 4.6.
- "Screen Capture" vs "Broadcast" / "Broadcast Mode" — same feature, multiple names.
- "Get Started" vs "Let's go" CTA inconsistency.

## 4.2 Em dashes (user dislikes)

**Total occurrences in user-facing strings: ~50** (counted via grep). Locations summarized in Part 2.9. Top fixable in 30 minutes:
- onboarding.tsx (3 instances)
- CalmHomeScreen.tsx (1 — `—`)
- broadcast/[platform].tsx (2)
- analysis/[sessionId].tsx (2)
- BroadcastOverlay.tsx (1)
- ModeToggle.tsx (2)
- ErrorBoundary.tsx (1)
- DailyTipCard.tsx (3)
- FirstUseWalkthrough.tsx (2)
- DashboardTour.tsx (2)
- MilestoneModal.tsx (1)
- LockedOverlayCard.tsx (1)
- ScanOverlay.tsx (5)
- scanner/[platform].tsx (5)
- settings.tsx (2)
- history.tsx (2)
- dashboard.tsx (~15 in InsightHero descriptions, suggestion strings, methodology blocks; plus 7 placeholder `"—"` values which are fine)
- useAnalysis.ts (1)
- achievements.ts (1)

**Replacement guidance:** 
- For "X — Y" used as an aside, switch to a comma or em-dashed-with-space replaced by `,` or `.`.
- For "X — Y" as a hard separator, switch to `·` (middle dot) or rephrase.
- Don't replace placeholder `"—"` (that's standard for missing values).

This is a single grep-and-sed pass. **Effort:** small (1–2 hours including review).

## 4.3 Headlines and labels

Headlines are scannable, active voice, reasonable length. Some examples:
- "See what's in your feed" ✓
- "How it works" ✓
- "Start your first scan" ✓
- "Scan Complete" ✓
- "Broadcast complete" — should be capital B "Broadcast Complete" for consistency with "Scan Complete"
- "Session cancelled" — could be "Scan Cancelled" for consistency with the rest of the app's language
- "Coming to Android Soon" — fine but could be "Android Coming Soon"

## 4.4 Microcopy

Button labels are mostly verb-first action-oriented. A few exceptions:
- "Other sign-in options" (login.tsx:462) — neutral, OK.
- "Skip for now" (onboarding) — friendlier than "Skip".
- "Loading Dashboard..." (scanner) — descriptive, OK.

Form placeholders are minimal ("Email", "Password", "DELETE") — clean.

Toast messages: Glue Toast component exists but I didn't trace its usage broadly. Verify it's actually used somewhere in the app (could be dead code).

## 4.5 Privacy copy contradictions
**severity: high · effort: trivial · local · autonomous**

Three different privacy claims appear in three places:
1. Broadcast screen footer: "Frames are processed on-device and never leave your phone without your explicit action." ([broadcast/[platform].tsx:653-655](AlgorithmLens_Cowork/mobile/app/broadcast/[platform].tsx:653))
2. Onboarding screen 3 AI consent: "AlgorithmLens analyzes your feed locally using AI. Your data stays on your device." ([onboarding.tsx:558](AlgorithmLens_Cowork/mobile/app/(auth)/onboarding.tsx:558))
3. Analysis screen footer: "Frames are sent to Google's Gemini AI for analysis. No personal account credentials are shared. Results are stored in your AlgorithmLens account." ([analysis/[sessionId].tsx:477-479](AlgorithmLens_Cowork/mobile/app/analysis/[sessionId].tsx:477))
4. Settings "AI Analysis" section: "AlgorithmLens uses Google Gemini to analyze political content and emotional tone in your feed. Your data is not used to train AI models." ([settings.tsx:402](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:402))

Claims 1 and 2 are **factually wrong** — frames are sent to Google. Claim 3 is honest. Claim 4 is honest.

For an app whose entire value prop is **algorithmic transparency**, this is a credibility-critical issue. **Fix:** rewrite claims 1 and 2 to match claim 3.

Suggested copy for both:
> "Frames are sent to Google's Gemini AI for analysis. We don't store login credentials, and your scan data isn't used to train AI models."

## 4.6 Marketing-y vs honest copy

- "AlgorithmLens" name itself is great.
- "See what's in your feed" — honest, not overselling.
- "Unlock detailed insights" / "Get detailed charts" (Plus upsell on home) — fine, factual.
- "Track trends over time" (Plus upsell in settings) — true.
- The dashboard's epistemic-restraint disclaimers ("This describes what appeared in your feed — it does not infer your personal views or the platform's intent.") are excellent.
- Home subheading "See what's in your social media feed" — honest, restrained.
- Onboarding "A clear picture of what appears" — restrained.

**Overall: copy honesty is a strength of the app.** The privacy contradictions in 4.5 are the only material misrepresentation.

---

# PART 5 — ACCESSIBILITY

## 5.1 Touch targets

`MIN_TOUCH_TARGET` is defined and used in many places. Spot-checked:
- Login OAuth buttons: explicitly enforce min via Glue Button + size lg. ✓
- Login "Sign in with email" link: `minHeight: 48` ✓
- Tab bar items: `paddingTop: SPACING.xs` + tabBar height 49+insets ✓
- Bottom sheet platform tiles: `minHeight: MIN_TOUCH_TARGET` ✓
- Settings rows: `minHeight: MIN_TOUCH_TARGET` ✓

A few smaller touch areas:
- ChevronLeft back button on onboarding ([onboarding.tsx:223](AlgorithmLens_Cowork/mobile/app/(auth)/onboarding.tsx:223)) — has `hitSlop: 8/8/8/8`, brings effective area to ~40pt. Acceptable but tight.
- Analysis screen Back button: `width: 36, height: 36`, no explicit hitSlop — **below 44pt**. Add hitSlop or increase size.
- Analysis screen Share button: same issue — `width: 36, height: 36`. (Plus the Share button does nothing — see 2.9.7).
- Broadcast screen back button: `ICON_SIZES.xl` which is likely 40-44pt — verify.

## 5.2 Color contrast

- textMain `#1E293B` on bgPage `#F7F8FC` — 14:1 ratio ✓
- textSecondary `#64748B` on bgCard `#FFFFFF` — 5.04:1 ✓ (WCAG AA pass for 14pt+)
- textMuted `#4B5563` on bgPage `#F7F8FC` — 7.8:1 ✓
- textTertiary `#5C6B7A` on bgPage — 7:1 ✓
- White text on primaryBlue `#2563EB` — high contrast ✓
- Warning text `#B8860B` on warningLight `#FFFBEB` — about 5:1 ✓
- Error text `#B45555` on errorLight `#FEF2F2` — 4.7:1, marginal for 14pt-

The `whiteOverlay85` and other overlay colors should be spot-checked. Generally the palette is contrast-conscious.

## 5.3 Screen reader support

- accessibility roles, labels, hints used on most interactive elements. Audited:
- Login: TextInput has `accessibilityLabel`, `accessibilityHint`, `accessible={true}` ✓
- Onboarding: Buttons have role/label ✓
- Home CTA: role/label/hint ✓
- Tabs: `tabBarAccessibilityLabel` on each ✓
- ModeToggle: `radiogroup` with `radio` items, selected state ✓
- BroadcastOverlay: live region for recording state ✓
- AnalysisProgress: assume similar based on the file structure.
- Dashboard: tab strip uses `tablist` / `tab` roles correctly.

The A11Y_ISSUES.md file in the repo root suggests a previous audit. Consider re-running it for build #44.

## 5.4 Dynamic Type

`RFValue` from `react-native-responsive-fontsize` is imported and used in dashboard tab pill (line 3134). `GL_TYPOGRAPHY` font sizes don't use RFValue directly — they use raw numbers from TYPOGRAPHY in theme.ts. **Most text in the app does NOT scale with iOS Dynamic Type.**

For accessibility-conscious apps, this is a **medium issue**. The system font scale slider in iOS Settings won't affect AlgorithmLens text. Users with vision impairments who rely on larger text won't get it.

**Fix:** wrap GL_TYPOGRAPHY's fontSize values in RFValue. Test that layout doesn't break.

## 5.5 Reduce Motion

Dashboard correctly checks `AccessibilityInfo.isReduceMotionEnabled` before tab-switch animation ([dashboard.tsx:2914](AlgorithmLens_Cowork/mobile/app/(tabs)/dashboard.tsx:2914)) — but most other animations (Reanimated tweens, BroadcastOverlay pulse, CalmHomeScreen StaggeredList, FeedScoreCard countUp) **do not check Reduce Motion**.

For full accessibility compliance, every animation should be wrapped. **Effort:** medium.

---

# PART 6 — PERFORMANCE

## 6.1 Initial load

- `expo-splash-screen.preventAutoHideAsync` called in module scope ([_layout.tsx:49](AlgorithmLens_Cowork/mobile/app/_layout.tsx:49)).
- 8s watchdog auto-dismisses splash if RootLayout never renders.
- Auth: 5s getSession timeout + 7s hard failsafe + 5s profile timeout.
- Worst-case cold launch with stale Keychain: ~7s before user sees something.
- Best-case (warm launch, fresh session): <500ms.

This is OK for an app whose first-launch flow goes through Supabase. The defensive timeouts are good citizenship.

## 6.2 Navigation

Tab switches use Tabs animation: 'fade' ([(tabs)/_layout.tsx:107](AlgorithmLens_Cowork/mobile/app/(tabs)/_layout.tsx:107)). On a modern iOS device, transitions feel ~150-200ms. Inside the dashboard, the tab strip switch fade is 230ms (80+150). Slightly laggy.

Stack screens (broadcast, analysis) use `slide_from_bottom` — feels appropriate.

## 6.3 List rendering

- History uses `SectionList` with `getItemLayout` (windowSize 10, maxToRenderPerBatch 10) — virtualized. ✓
- No infinite-scroll on history; capped at 50 scans by Supabase query.
- Dashboard chart components likely render once per scan — not a performance concern unless a single scan has 1000+ feed items.

## 6.4 Image loading

- No `expo-image` — using react-native default Image. For broadcast frames (only used internally for analysis, not displayed), this is fine.
- Onboarding illustrations are vector (lucide icons + Animated views), no raster image loading.
- Splash icon is a PNG — depends on size optimization.

## 6.5 Memory

- Broadcast extension's 50MB limit (per the earlier user note) — the manager passes frames as base64 strings via the App Group container. With ~30-50 frames at ~100-300KB JPG each, base64 representation is ~150KB-500KB per frame. Total in-memory could spike to ~25MB during analysis. Acceptable.
- The pipeline explicitly nulls `batch.length = 0` after each batch ([broadcastAnalysisPipeline.ts:449](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:449)) to help GC. Good.
- `analysisDataStore` is consumed once via `consumeAnalysisData` — clears the in-memory store. Good.

No obvious memory leaks. The watchdog/diagnostic singletons (__authDiag, __broadcastDiag, etc.) are tiny and don't grow unboundedly.

---

# PART 7 — DEAD CODE AND TECHNICAL DEBT

## 7.1 Unused / placeholder code

- `analysisDataStore.ts` is consumed once per analysis — well-scoped.
- `analysis/textClassificationService.ts` — exists, used by scanner.
- `src/components/glue/Toast.tsx` — exists; **verify it's used somewhere**. If not, dead code.
- `Skeleton`, `EmptyState`, `ErrorState`, `Chip`, `Badge` glue components — likely all used.
- `src/components/charts/*` — used by dashboard.
- `src/components/dashboard/ComparisonView` — used by history. ✓
- `XPlatformIcon` — used by onboarding + bottom sheet + scan tab.

A more thorough dead-code analysis would require an `unimported`-style scan. Skipping for this audit.

## 7.2 TODO/FIXME comments

Only **2 TODOs** (impressive cleanliness):
- [settings.tsx:869](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:869) — `// TODO: Implement actual account deletion API call` (see 1.8a — must address)
- [UpgradeModal.tsx:160](AlgorithmLens_Cowork/mobile/src/components/plan/UpgradeModal.tsx:160) — `// TODO: Replace with real RevenueCat presentPaywall()` (see 1.8b)

## 7.3 Console statements

**57 unguarded `console.*` calls** (counted via grep, excluding ones inside `if (__DEV__)`).

In production builds:
- `if (!__DEV__) { LogBox.ignoreAllLogs(true) }` ([_layout.tsx:40](AlgorithmLens_Cowork/mobile/app/_layout.tsx:40)) — silences React Native's own log surfaces.
- But raw `console.log`/`console.warn`/`console.error` calls still fire to native log streams. Not user-visible, but they appear in OS logs and slow down the JS thread slightly.

The ErrorBoundary logs `console.error` unconditionally ([ErrorBoundary.tsx:89-92](AlgorithmLens_Cowork/mobile/src/components/ErrorBoundary.tsx:89)) — explicitly intentional for diagnostics. Keep.

The remaining unguarded `console` calls are mostly inside catch blocks. Wrapping all of them in `if (__DEV__)` is a one-pass cleanup. **Effort:** small.

## 7.4 Deprecated dependencies

- `react-native: 0.81.5` — current.
- `expo: ~54.0.33` — current SDK.
- `react: 19.1.0` — current.
- `react-native-reanimated: ~4.1.1` — recent.
- `react-native-webview: 13.15.0` — recent.
- `lucide-react-native: ^0.564.0` — recent.

No alarming deprecations. Notable:
- `react-native-purchases` is **missing** despite being referenced (see 1.8b).
- `expo-web-browser` is **missing** despite OAuth requiring it (see 1.7).
- `expo-apple-authentication` is **missing** for native Apple Sign-In.

## 7.5 Stash @{0} content

67 files; 1129 insertions, 1393 deletions. By category:

**Likely keep (substantive web-app changes):**
- `AlgorithmLens_Cowork/src/pages/PrivacyPage.jsx` — 769 lines changed. Major privacy page revamp.
- `AlgorithmLens_Cowork/src/pages/SettingsPage.jsx` — 230 lines changed.
- `AlgorithmLens_Cowork/backend/routes/stripe_routes.py` — 8-line stripe route change.

**Likely keep (substantive mobile changes):**
- `mobile/app/(tabs)/settings.tsx` — −300 lines (substantial cleanup or migration)
- `mobile/src/hooks/useEntitlements.ts` — −92 lines
- `mobile/app/(auth)/onboarding.tsx` — +45 lines
- `mobile/src/services/revenueCat.ts` — 19-line change

**Needs judgment:**
- `mobile/app/(tabs)/dashboard.tsx` — 11 lines changed
- `mobile/app/(tabs)/history.tsx` — 14 lines changed
- `mobile/src/components/home/CalmHomeScreen.tsx` — 5 lines changed
- `mobile/src/lib/platformScripts/index.ts` — 2 lines changed
- `mobile/src/components/scanner/WebViewScanner.tsx` — +5 lines
- `mobile/src/context/AuthContext.tsx` — +11 lines

**Discard (mode-bit-only / empty diffs):**
- ~30 mobile files showing 0 lines changed (just chmod/permissions).

**Needs judgment, possibly bigger:**
- `alg-gemini-extension/src/popup/popup.js` — 103 lines
- `alg-gemini-extension/src/background.js` — 27 lines
- Various `src/lib/plan/*`, `src/lib/analytics/*`, `src/lib/auth/*` — refactors

**Recommendation:** do **not** apply the stash to the upbeat-dirac branch wholesale. Instead, cherry-pick the specific mobile changes that look valuable (settings.tsx, onboarding.tsx, useEntitlements.ts) to a new branch and review each. Leave the stash for now — it's a backup, not a path forward.

---

# PART 8 — UNTESTED OR UNDERTESTED PATHS

## 8.1 Per-platform code paths

| platform | scanner script | broadcast | runtime-validated |
|---|---|---|---|
| Instagram | INSTAGRAM_SCRIPT 399 lines | yes | unverified |
| X (Twitter) | TWITTER_SCRIPT 258 lines | yes | unverified |
| YouTube | YOUTUBE_SCRIPT 592 lines | yes | **yes** (per user) |
| TikTok | TIKTOK_SCRIPT 237 lines | yes | unverified |
| Facebook | FACEBOOK_SCRIPT 322 lines | yes | **yes** (per user) |
| Reddit | REDDIT_SCRIPT 328 lines | yes | unverified |

Each script is platform-specific DOM scraping. They share a wrapper with error handling ([platformScripts/index.ts:264](AlgorithmLens_Cowork/mobile/src/lib/platformScripts/index.ts:264)) that categorizes errors as DOM_STRUCTURE_CHANGED / BLOCKED_BY_PLATFORM / INJECTION_ERROR. If a platform changes its layout, the script silently emits zero posts and the user sees a "very low sample" warning.

**Recommendation:** add a per-platform health-check endpoint in the backend that periodically validates the scripts still work, and report the status to the user.

## 8.2 Edge cases

| case | code path | tested |
|---|---|---|
| Broadcast < 5s | `MIN_SCAN_DURATION_SECS` enforced; alerts user | partially — alert exists |
| Broadcast at 600s cap | auto-stops; alerts ([useBroadcast.ts:144-154](AlgorithmLens_Cowork/mobile/src/hooks/useBroadcast.ts:144)) | unverified |
| App backgrounded mid-analysis | useAnalysis cleanup on unmount | partially — cleanup fires |
| App killed mid-broadcast | extension survives; on resume, what happens? | **unknown** |
| Multiple concurrent broadcasts | iOS prevents this; code doesn't try | OK |
| Permission denied (broadcast) | Alert with retry hint | exists, untested |
| Permission denied (notifications) | toggle reverts | exists, untested |
| Supabase auth fails on a long-lived session | `onAuthStateChange` handles SIGNED_OUT | structural — should work |

## 8.3 Permission paths

- Notifications: `enableNotifications` returns false on denial; toggle reverts ([settings.tsx:184-188](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:184)) ✓
- Screen recording (iOS): user-controlled via system picker. No JS-side permission state.
- Screen recording (Android): `requestScreenCapture` returns boolean; on denial, friendly alert ([useBroadcast.ts:207-211](AlgorithmLens_Cowork/mobile/src/hooks/useBroadcast.ts:207)) ✓
- Photo library / camera: not requested.

---

# PART 9 — CONSISTENCY AND PATTERNS

## 9.1 Component reuse

- **Loading spinner**: `<ActivityIndicator>` used in 22 places. Glue's Skeleton is also used (mostly dashboard). For consistency, prefer Skeleton-everywhere.
- **Buttons**: Glue `<Button>` exists; ~half of CTAs use it, ~half use raw TouchableOpacity. Inconsistent.
- **Cards**: Glue `<Card>` exists; rarely used. Most cards are inline View+styles.
- **Empty states**: Glue `<EmptyState>` exists; some empty states are custom (home's mock dashboard, dashboard's tab-strip preview).

Pattern enforcement isn't strict. **Recommendation:** in build #44, port at least the most-visible CTAs to `<Button>` for unified pressed-state.

## 9.2 State management

- **Auth state**: `AuthContext` ✓
- **Theme**: `ThemeContext` ✓
- **Dashboard data**: `useDashboard` hook returns scans + latestScan + loading + error. Single source of truth. ✓
- **Streak/habits**: `useStreak`, `useHabitFeatures`. Read from AsyncStorage. ✓
- **Broadcast**: `useBroadcast` wraps `BroadcastSessionManager`. ✓
- **Analysis**: `useAnalysis` wraps `BroadcastAnalysisPipeline`. ✓
- **Entitlements**: `useEntitlements` (mocked).

Consistent pattern: each domain has a hook + service layer. Good architecture.

**Issue:** dashboard data (`scans`) is fetched in 3 places (Home via useDashboard, Dashboard tab via useDashboard, History tab via useDashboard) — each gets its own hook instance, **each fires its own query**. They could share a context-level hook to avoid 3 network requests on app launch. **Effort:** medium. **Severity:** low for performance, but cleaner architecturally.

## 9.3 Naming conventions

- Components: PascalCase ✓
- Hooks: useXxx ✓
- Files: PascalCase for components, camelCase for utilities/hooks ✓
- Theme tokens: SCREAMING_SNAKE for constants ✓ (SPACING, RADIUS, COLORS, GL_TYPOGRAPHY)

**Inconsistencies:**
- `_layout.tsx` is the convention for expo-router but the underscore convention is followed.
- Some components use displayName, some don't. Not load-bearing.
- "Quick Scan" (UI) = "Precision Mode" (UI) = `'precision'` (code) — see 4.6.
- "Screen Capture" (UI) = "Broadcast Mode" (UI) = `'broadcast'` (code).

## 9.4 Error handling

Try/catch usage is mostly consistent. Pattern: catch → captureError to Sentry → user-friendly Alert or state update. Good.

**Swallowed errors that should surface:**
- `persistScan` failure (see 1.1) — silenced into `result.debug.warnings` which UI doesn't render.
- `requestBackendEnrichment` — silently fails. Acceptable since it's a fire-and-forget.
- `fetchOrCreateProfile` — falls back to local AsyncStorage. Acceptable.
- `recordScan` (streak) — `console.warn` + `if (__DEV__)`. Acceptable.

---

# PART 10 — OPPORTUNITIES

## 10.1 The "single tap to scan" opportunity (large UX win)

**Today:** Tap CTA → bottom sheet (6 platform tiles + mode toggle + Start Scan button) → tap Start Scan = 2 taps minimum, 4 taps if user picks a different platform and toggles mode.

**Opportunity:** make the home CTA itself the platform picker. Replace the gigantic "Scan Your Feed" gradient button with a 6-tile platform grid where **tapping a tile starts the scan immediately** in the recommended (Screen Capture) mode. The "last platform" gets a subtle highlight. Mode toggle moves to Settings or a per-platform long-press menu.

This makes the entire app **one tap from home**. Hugely valuable.

## 10.2 Lead the dashboard with the most surprising insight

**Today:** Dashboard opens to Overview tab, which shows generic categories (Top interests / Emotional signal / Political exposure / etc.) — none personalized.

**Opportunity:** before showing tabs, show a "What stood out" hero card that picks the **most attention-grabbing finding** from this scan. E.g., "Your feed was 71% suggested content, mostly from creators you don't follow," or "Ads made up 3 in every 10 posts." One sentence + one data point + a "tell me more" link to the relevant tab.

This is what Oura does on its activity dashboard — leads with a single insight, not a wall of metrics.

## 10.3 First-scan-as-onboarding

**Today:** Onboarding (3 screens) → home → tap CTA → scan → results.

**Opportunity:** make the first scan part of onboarding. Onboarding screen 3 becomes "Pick a platform & start scanning"; tapping a platform launches the scanner directly with first-time hints overlaid. Skip the home screen entirely on first session.

The DashboardTour already does this for the dashboard side — extend it backwards to the scanner side.

## 10.4 Reframe "Quick Scan vs Screen Capture"

The two modes serve different purposes but the user has to learn the distinction. Reframe:
- **Default everyone to Screen Capture** (with permission flow up-front during onboarding).
- Hide Quick Scan / Precision Mode behind Settings → Advanced → "Use built-in browser instead" toggle.
- When the toggle is off, the only path is broadcast.
- This eliminates the ModeToggle UI entirely from the bottom sheet.

## 10.5 The platform picker concept

The grid of 6 platforms is already pretty clean. Three opportunities:
- Replace icons with platform-branded glyphs (proper licensing) for a more "real" feel.
- Show the user's last scan badge on the platform tile they last scanned ("3 days ago" overlay).
- Allow long-press on a tile to start in Quick Scan / Precision mode (escape hatch for power users).

## 10.6 Scan Results as a "story"

After a scan, instead of dumping the user into the dashboard, show 3-5 swipeable insight cards (Instagram Stories style):
- Card 1: "You saw 88 posts in your feed."
- Card 2: "27% were ads. That's about 1 ad every 4 posts."
- Card 3: "Your top creator was @[name] (12 posts)."
- Card 4: "Your tone score was [X]."
- Card 5: "[CTA] See full breakdown."

Then the "View Full Dashboard" CTA. This makes the result feel earned and personal.

## 10.7 Fix the splash icon (low effort, high signal)

[`assets/splash.svg`](AlgorithmLens_Cowork/mobile/assets/splash.svg) exists with a custom Eye/lens design. Just export it to PNG and drop it in. Build #44 launches feeling "real" instead of "still in development."

## 10.8 Remove the debug footer (mandatory)

Already covered in 2.1 — single line change, **must do** before public TestFlight.

## 10.9 Wire up actual account deletion (App Store gate)

Already covered in 1.8a. Either implement real deletion or replace with a `mailto:` link.

## 10.10 Eliminate the privacy contradiction (credibility-critical)

Already covered in 4.5. Three minutes of copy editing.

## 10.11 Dashboard: kill "—" placeholder cards or hide them

The dashboard renders MetricCards with `value="—"` and `hasData={false}` for trend metrics that need 2+ scans. On a first-scan dashboard, the user sees a row of muted "—" cards. Either hide them entirely until enough data exists, or show a subtle "1 more scan needed for trend" hint.

## 10.12 Notifications strategy

The notification frequency picker offers options like Every 1/3/7/14/30 days. The default is Every 7 days. Once enabled, AlgorithmLens nags the user every X days to scan again.

This is fine but raises the question: **what does the notification say?** If it's just "Time to scan!" the user will dismiss/disable. If it says "Your feed has likely shifted in the last week — scan to see how" the user has motivation. Verify the notification copy in [services/notifications.ts](AlgorithmLens_Cowork/mobile/src/services/notifications.ts).

## 10.13 Streak/habit features

Streaks, achievements, milestones — well-designed but all-or-nothing engagement loops. Consider:
- Show "next milestone" progress bar on home (5-day streak → 10-day streak progress).
- Give partial credit for thinking about scanning (e.g., visiting the home screen counts as a "check-in" but doesn't break the streak).
- Make streak loss less harsh — currently if you miss a day, streak resets to 0. Soft reset (back to last-day-1) is friendlier.

This is judgment territory. Optional.

---

# IF-YOU-ONLY-DO-N PRIORITIZED LISTS

## If you only do 5 things (hard requirements for build #44)

1. **Hide the debug footer** behind `__DEV__`. ([app/_layout.tsx:148](AlgorithmLens_Cowork/mobile/app/_layout.tsx:148)) **trivial · local**
2. **Surface SAVE_FAILED warnings** in BroadcastResultsSummary; also write an AsyncStorage backup if Supabase insert fails. ([broadcastAnalysisPipeline.ts:303](AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts:303), [BroadcastResultsSummary.tsx](AlgorithmLens_Cowork/mobile/src/components/analysis/BroadcastResultsSummary.tsx)) **small · structural**
3. **Replace the splash icon PNG** with the existing [splash.svg](AlgorithmLens_Cowork/mobile/assets/splash.svg) export. **trivial · local**
4. **Fix the privacy copy contradiction** in onboarding.tsx and broadcast/[platform].tsx — both should say frames are sent to Google. **trivial · local · critical credibility**
5. **Replace the fake Delete Account flow** with a `mailto:support@algorithmlens.com` link, OR remove the button entirely until real deletion is implemented. ([settings.tsx:866](AlgorithmLens_Cowork/mobile/app/(tabs)/settings.tsx:866)) **trivial · App Store gate**

## If you do 20 things

Add to the above:

6. **Diagnose the actual persistScan failure** in Supabase (RLS / schema). Get build #44 to a state where `scans` rows reliably persist. **judgment · medium**
7. **Sweep em dashes** out of UI strings (~50 occurrences across the app). One grep+sed pass. **small · local**
8. **Hide the unimplemented Share button** on the analysis screen. ([analysis/[sessionId].tsx:297](AlgorithmLens_Cowork/mobile/app/analysis/[sessionId].tsx:297)) **trivial**
9. **Default ModeToggle to Screen Capture** instead of Quick Scan. ([PlatformBottomSheet.tsx:96](AlgorithmLens_Cowork/mobile/src/components/home/PlatformBottomSheet.tsx:96)) **trivial · local**
10. **Replace the Apple emoji 🍎 and the "G" Text** on login with proper SVG glyphs. ([login.tsx:215, 227](AlgorithmLens_Cowork/mobile/app/(auth)/login.tsx:215)) **small · local**
11. **Fix login error styling** — `'Account created!'` should not render in red. ([login.tsx:136](AlgorithmLens_Cowork/mobile/app/(auth)/login.tsx:136)) **trivial**
12. **Use `getUserFriendlyNetworkError`** in login.tsx for raw Supabase errors. **trivial**
13. **Convert ~20 hardcoded hex colors** in dashboard.tsx to theme tokens. **small · local**
14. **Clear AsyncStorage on signOut** (onboarding flag, streak, walkthrough flag). ([AuthContext.tsx:388](AlgorithmLens_Cowork/mobile/src/context/AuthContext.tsx:388)) **small · local**
15. **Tighten dashboard tab-switch animation** from 80+150ms to 60+120ms. **trivial**
16. **Remove the `FirstUseWalkthrough` modal** — onboarding covers the same ground. **small · local**
17. **Disable OAuth buttons or hide them entirely** until 1.7 is fully implemented. Email-only login for build #44. **trivial · safer than broken UI**
18. **Wrap unguarded `console.*` calls in `if (__DEV__)`** (57 occurrences). **small · global**
19. **Make scan card on home tappable to view its dashboard data** — verify `RecentScanCard.onPress` is wired. (probably already is — verify)
20. **Add splash for the analysis screen Share button removal** — also clean up the misleading `accessibilityLabel="Share results"` ([analysis/[sessionId].tsx:301](AlgorithmLens_Cowork/mobile/app/analysis/[sessionId].tsx:301)). **trivial**

## If you do 100 things (the full backlog)

21. Verify `auth/callback` route exists; if not, OAuth is non-functional regardless of other fixes.
22. Wire up `expo-web-browser` for OAuth (Google).
23. Wire up `expo-apple-authentication` for native Apple Sign-In.
24. Implement real account deletion via backend endpoint.
25. Wire up `react-native-purchases` for real RevenueCat.
26. Increment app.config.ts buildNumber from "1" to actual build #.
27. Implement Reduce Motion preference for all animations.
28. Wrap GL_TYPOGRAPHY fontSizes in RFValue for Dynamic Type.
29. Add hitSlop to Analysis screen Back/Share buttons.
30. Standardize all platform icons (custom set vs Lucide).
31. Use a `<ScreenHeader>` component across home/history/settings/dashboard.
32. Replace raw `TouchableOpacity` CTAs with `<Button>` Glue component (~10 places).
33. Replace all chart hex colors with theme tokens.
34. Audit all em dashes including dashboard methodology blocks (judgment — some may be intentional).
35. Reduce broadcast pulse cycle from 2s to ~1s.
36. Add subtle `shadows.medium` to "View Full Dashboard" CTA on results card.
37. Make the platform picker bottom sheet auto-start scan on platform tap.
38. Move ModeToggle out of the bottom sheet into Settings/Advanced.
39. Add scan count badge per platform tile ("3 days ago" overlay).
40. Add a scan story / swipeable insight cards before the dashboard.
41. Lead dashboard with a single hero insight ("What stood out").
42. Compress the broadcast screen layout.
43. Add subtle "X frames is enough to save" indicator on broadcast Stop button.
44. Improve frequency picker default (verify 7 days default lands).
45. Improve notification copy in services/notifications.ts.
46. Verify DashboardTour fires on first scan completion.
47. Add a "Skip" link on the platform bottom sheet (for users who tap CTA without intent).
48. Make the bottom sheet "Start Scan" button hide when no platform is selected.
49. Replace generic "Sign in failed. Try again" with specific error messages.
50. Add a privacy policy / TOS link on login screen for compliance.
51. Add success toast on sign-out.
52. Add toast on notification frequency change.
53. Verify Dashboard Tour, MilestoneModal animations on real device.
54. Add a "what's coming next" preview after each scan (gamification).
55. Add ability to export a scan as JSON / CSV (Settings → Data).
56. Add ability to delete individual scans from history.
57. Add "this scan" badge on the top result card when on dashboard.
58. Verify ScanOverlay shows correctly after timeout.
59. Address `useDashboard` triple-fetch on app launch.
60. Add a "Plus" badge next to the `is_user_plus` trial-remaining indicator.
61. Add deep linking support (`algorithmlens://scan/instagram`).
62. Verify YouTube/Facebook scripts work on current platform layouts (regression test).
63. Validate Instagram/Twitter/TikTok/Reddit scripts at runtime.
64. Add Sentry release tagging for build #44.
65. Investigate why `requestBackendEnrichment` exists but persists silently.
66. Add a "data shared with Google Gemini" link in Privacy section that opens an explainer.
67. Investigate the website hosts the `learnMoreUrl` anchors (`/dashboard#overview` etc.).
68. Add a real "Share results" deep-linked URL.
69. Add a toggle in Settings for opting out of AI analysis (currently in onboarding only).
70. Audit and remove dead code in the sub-component dirs (unused imports, etc.).
71. Add an onboarding step explaining the privacy tradeoff (what gets sent to Google).
72. Verify `useEntitlements` returns the correct fallback when backend is offline.
73. Add a build-version display in the footer of Settings (already there — but verify it's accurate).
74. Verify the `Plus banner` doesn't block content on small screens.
75. Verify `Restore Purchases` UI is hidden when RevenueCat isn't configured.
76. Add a "Tutorial" section that re-shows the FirstUseWalkthrough on demand (after deleting from initial flow).
77. Investigate the StaggeredList delay timing (50ms feels OK, verify).
78. Add a per-platform scan-count summary on the platform tile.
79. Make the streak badge animatable when the streak increments.
80. Add a "first scan" badge / achievement.
81. Audit Sentry breadcrumbs across all critical paths.
82. Verify the "Coming to Android Soon" screen in broadcast/[platform].tsx is correctly displayed for Android users.
83. Add a "haptic feedback" toggle in Settings (some users dislike it).
84. Increase the default broadcast cap from 600s to 900s for power users.
85. Add a "save scan as draft" if Supabase insert fails (already proposed in 1.1 fix).
86. Verify the `frameLoadFailures > 0` warning is surfaced to the user (currently console-only).
87. Add a "your scan is being analyzed in the background" toast when navigating away from analysis screen.
88. Verify `__broadcastDiag` doesn't leak across runs.
89. Make the dashboard tab strip scrollable to the right with a fade indicator.
90. Audit chart accessibility labels (verify each `<ALPieChart>` has a meaningful label).
91. Add keyboard support for non-touch input (web view).
92. Add a "Sign in with email" auto-link to email entry when user starts typing.
93. Make the Plus banner dismissable (some users will never upgrade and don't want to see it).
94. Verify the notification hook `enableNotifications` works after the user denied once (no recovery path?).
95. Add a "system status" page for users to check if Supabase/Gemini are degraded.
96. Verify `__DEV__` guard works correctly with EAS production builds.
97. Add a "What's new" modal for build version bumps.
98. Audit the BackHandler (Android) on every screen to prevent app exits during recording.
99. Verify the broadcast extension survives a JS bundle reload.
100. Remove the `RNR_MIGRATION_PLAN.md`, `DESIGN_UPGRADE_TARGET.md`, `PHASE*_NOTES.md`, etc. — keep only `audits/` for posterity.

---

# CLOSING NOTES

Build #43 is a credible TestFlight build. The end-to-end pipeline works (broadcast → frame collection → Gemini analysis → results) and the UI is genuinely thoughtful in many places (calm color system, careful epistemic restraint in copy, well-designed empty states, defensive error handling at app launch). The "vibe coding" approach has produced code that's mostly idiomatic and well-organized.

The blocking issues for build #44 are concentrated in **5 trivial fixes** (the "if you only do 5" list) that together transform the app from "still in development" to "ready to invite testers." After those, the second-tier polish list (em dashes, splash icon, OAuth disabling, error message cleanup) is mostly trivial-to-small effort.

The deeper architectural issue — **why is Supabase persistScan failing for the user** — is the only judgment-needed investigation. Once that's known, the dashboard "No scans yet" bug becomes a 30-minute fix.

For the final remaining EAS build, prioritize the 5-things list. That's the highest signal you can get out of one build.
