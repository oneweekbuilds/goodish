# Error Handling Hardening Changelog

**Date:** 2026-02-20
**Scope:** Every screen, hook, service, and pipeline in the AlgorithmLens mobile app
**Goal:** No user ever sees a crash, blank screen, cryptic error, or silent failure
**Guideline:** All user-facing messages follow epistemic restraint — warm, clear, non-technical, never blame the user

---

## New Files Created

### `src/lib/networkUtils.ts`
- **`isOnline()`** — Lightweight connectivity check using a HEAD request to `clients3.google.com/generate_204` with a 5-second timeout
- **`withTimeout<T>()`** — Generic promise timeout wrapper with human-readable labels for error messages
- **`getUserFriendlyNetworkError()`** — Maps raw error messages to warm, non-technical strings (network failures, Gemini down, Supabase down, timeouts, aborts)
- **`TimeoutError`** — Custom error class carrying the timeout duration for debugging

### `src/components/ErrorBoundary.tsx`
- React class component error boundary with Sentry reporting
- Shows a "Something went wrong" recovery screen with a "Try Again" button
- Accepts optional `fallback` prop for custom error UIs
- Catches any unhandled rendering error in the component tree below it

---

## Modified Files

### `app/_layout.tsx` — Global Error Boundary
- **Added:** `<ErrorBoundary>` wrapping `<RootLayoutNav />` inside the root layout
- **Effect:** Any unhandled React error anywhere in the app now shows a recovery screen instead of crashing

### `src/lib/analysis/broadcastAnalysisPipeline.ts` — Pipeline Hardening
- **Supabase save is now non-fatal:** `persistScan()` failures are caught, logged to Sentry, and produce a warning instead of crashing the pipeline. Users see their results with a note: "Your results are ready, but we couldn't save them to your history."
- **Zero extracted items:** If all frames fail Gemini analysis and zero items are extracted, a clear PipelineError is thrown: "We couldn't read any posts from the captured frames. This can happen if the feed wasn't visible during recording..."
- **Save warning attached to result:** The warning is added to `scanResult.debug.warnings` so the UI can display it

### `src/hooks/useAnalysis.ts` — Analysis Hook Hardening
- **Added:** Import of `getUserFriendlyNetworkError` from networkUtils
- **API key missing:** Changed from technical "Set EXPO_PUBLIC_GEMINI_API_KEY" to "The analysis service isn't set up yet. Please contact support if this persists."
- **Not authenticated:** Changed to "You need to be signed in to analyze your feed. Please sign in and try again."
- **Catch-all errors:** Now uses `getUserFriendlyNetworkError()` for user-facing messages
- **Failed status default:** Changed from "Analysis failed" to "Something went wrong during analysis. You can try again."

### `src/hooks/useBroadcast.ts` — Broadcast Hook Hardening
- **10-minute auto-stop:** Added `MAX_BROADCAST_SECONDS = 600`. The elapsed timer now auto-stops the session at 10 minutes with a clear alert: "The broadcast automatically stopped after 10 minutes. This is usually enough to capture a good sample of your feed."
- **Device not available:** Changed from "Broadcast capture is not available" to "Screen recording isn't supported on this device. You need iOS 12+ or Android 5.0+ to use broadcast mode."
- **Session start error:** Changed from exposing raw error message to "We ran into a problem setting up the recording. Please try again."
- **Permission denied:** Changed from raw error to "AlgorithmLens needs screen recording permission to capture your feed. Tap 'Start Screen Capture' and allow the permission when prompted."

### `src/hooks/useDashboard.ts` — Dashboard Data Hook Hardening
- **Added:** Sentry error capture (`captureError`) on fetch failures
- **Added:** 10-second timeout on Supabase queries using `Promise.race`
- **Error message:** Changed from raw Supabase error to "We couldn't load your scan history right now. Pull down to try again."

### `src/hooks/useStreak.ts` — Streak Hook Hardening
- **Added:** try-catch around `onScanComplete` — if `recordScan()` fails, the error is logged but doesn't crash the app or interrupt the user's flow. Returns `null` gracefully.

### `app/(tabs)/dashboard.tsx` — Dashboard Screen Hardening
- **Added:** `error: fetchError` destructured from `useDashboard()`
- **Added:** try-catch around `computeDashboardData()` in useMemo — returns null on error instead of crashing
- **Added:** `dashboardComputeError` derived state for when a scan exists but can't be displayed
- **Added:** Warning banner for fetch errors (yellow background, Info icon)
- **Added:** Error state for malformed scans: "This scan couldn't be displayed. We had trouble reading this scan's data."

### `app/(tabs)/history.tsx` — History Screen Hardening
- **Added:** `error: fetchError` destructured from `useDashboard()`
- **Added:** Warning banner for fetch errors shown at top of scan list

### `app/broadcast/[platform].tsx` — Broadcast Screen Hardening
- **Zero frames alert:** Now explains WHY this might happen (recording didn't start, screen was off, not enough time) and offers both "Try Again" and "Go Back" buttons
- **Capture info error:** Changed from "Failed to build capture info" to "We couldn't process the recording data. Please try again." with retry/go-back options
- **Frame collection error:** Changed from exposing raw error to "We couldn't process the captured frames. Please try recording again." with retry/go-back options

### `src/lib/api.ts` — API Client Hardening
- **Added:** Sentry error capture in `fetchWithRetry` catch block — every retryable network failure is reported with path and attempt number

---

## Error Handling Coverage Summary

| Failure Scenario | Handling | User Message |
|---|---|---|
| No internet | `getUserFriendlyNetworkError()` | "We couldn't connect to the internet. Check your connection and try again." |
| Gemini API unreachable | `getUserFriendlyNetworkError()` | "We couldn't reach the analysis service right now. Check your internet connection and try again." |
| Gemini API timeout (30s) | `AbortController` in `geminiFlashService.ts` | "The analysis service took too long to respond. Please try again." |
| Supabase unreachable | Non-fatal in pipeline; warning in dashboard | "We couldn't save them to your history" / "Pull down to try again" |
| Supabase query timeout (10s) | `Promise.race` in `useDashboard` | "We couldn't load your scan history right now. Pull down to try again." |
| Screen recording permission denied | Alert in `useBroadcast` | "AlgorithmLens needs screen recording permission..." |
| Broadcast extension crash | Native status event → FAILED | Error message from native layer, wrapped in alert |
| Zero frames captured | Alert with explanation | Lists reasons + offers retry |
| Single frame fails Gemini | `Promise.allSettled` in pipeline | Skipped; pipeline continues; "Analyzed X of Y frames" |
| ALL frames fail Gemini | `PipelineError` | "We couldn't read any posts from the captured frames..." |
| Deduplication fails | Non-fatal fallback to raw items | Pipeline continues with all items |
| Save to Supabase fails | Non-fatal; results shown anyway | "Your results are ready, but we couldn't save them to your history." |
| `computeDashboardData` throws | try-catch in useMemo | "This scan couldn't be displayed" |
| Malformed scan data | Null check + error state | "This scan couldn't be displayed" with refresh button |
| Unhandled React error | `ErrorBoundary` at root | "Something went wrong. Try again." with restart button |
| Broadcast exceeds 10 min | Auto-stop timer | "The broadcast automatically stopped after 10 minutes." |
| Streak recording fails | try-catch in `onScanComplete` | Silent — non-critical feature doesn't interrupt user |
| API retry exhaustion | `fetchWithRetry` + Sentry | Sentry capture; error propagated to caller |

---

## Self-Review Cycles

### Cycle 1: Unprotected async calls
- Verified all `await` calls in modified files have try-catch or are inside Promise.allSettled
- Fixed: `onScanComplete` in useStreak was unprotected — added try-catch

### Cycle 2: User-facing error message quality
- All messages verified against epistemic restraint:
  - No technical jargon (no status codes, no variable names, no stack traces)
  - All use "we" language ("We couldn't..." not "Failed to...")
  - All provide clear next steps (retry, refresh, go back, restart)
  - None blame the user

### Cycle 3: Error path tracing
- No internet → every fetch path produces a user-visible message via `getUserFriendlyNetworkError`
- Permission denied → clear Alert with instructions
- API timeout → 30s Gemini timeout, 10s Supabase timeout, both produce messages
- No blank screens — every error state shows either a banner, an alert, or the error boundary

### Cycle 4: Silent error swallowing check
- Every catch block either: shows a user message, logs with console.warn, or reports to Sentry
- Documented non-critical catches (streak recording, cleanup) log warnings
- No empty catch blocks

### Cycle 5: Final TypeScript check
- `npx tsc --noEmit` — **zero errors**

---

## TypeScript Verification

```
$ npx tsc --noEmit
# (no output — zero errors)
```
