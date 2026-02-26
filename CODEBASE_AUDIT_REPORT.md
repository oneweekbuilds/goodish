# AlgorithmLens Codebase Audit Report
**Date:** 2026-02-18
**Scope:** Auth Bridge, Ad Percentage Pipeline, Epistemic Restraint

---

## 1. AUTH BRIDGE

### Overview
The system uses Supabase magic-link auth on the web app, with token synchronization to the Chrome extension via `window.postMessage`. The extension stores tokens in `chrome.storage.local` and includes basic JWT expiry detection.

### Files Involved

| Component | File | Key Lines |
|-----------|------|-----------|
| Supabase client | `AlgorithmLens_Cowork/src/lib/auth/supabaseClient.js` | 1-24 |
| Auth session helpers | `AlgorithmLens_Cowork/src/lib/auth/authSession.js` | 1-56 |
| Auth provider (React) | `AlgorithmLens_Cowork/src/lib/auth/AuthProvider.jsx` | 1-156 |
| Extension bridge (web side) | `AlgorithmLens_Cowork/src/lib/extension/extensionBridge.js` | 1-97 |
| Auth bridge (extension side) | `alg-gemini-extension/src/auth_bridge.js` | 1-83 |
| Background worker | `alg-gemini-extension/src/background.js` | 63-328 |
| Auth callback page | `AlgorithmLens_Cowork/src/pages/auth/AuthCallbackPage.jsx` | 1-104 |
| Sign-in prompt | `AlgorithmLens_Cowork/src/components/auth/SignInPrompt.jsx` | 1-176 |
| Authenticated fetch | `AlgorithmLens_Cowork/src/lib/api/authenticatedFetch.js` | 1-65 |
| Manifest | `alg-gemini-extension/manifest.json` | 52-88 |

### Flow Trace

1. **User clicks "Send sign-in link"** — `SignInPrompt.jsx:94` calls `useAuth().sendMagicLink(email)`
2. **Magic link sent** — `AuthProvider.jsx:124-131` constructs redirect URL to `/auth/callback`, calls `authSession.sendMagicLink()` which calls `supabase.auth.signInWithOtp()`
3. **User clicks email link** — Supabase redirects to `/auth/callback?code=...`
4. **Callback page loads** — `AuthCallbackPage.jsx:37-62` waits for `authReady` from AuthProvider; Supabase's `detectSessionInUrl: true` (supabaseClient.js:22) extracts session from URL
5. **Token sent to extension** — `AuthProvider.jsx:88-89` calls `sendAuthTokenToExtension(access_token)` which posts `ALGORITHMLENS_AUTH_TOKEN` via `window.postMessage` (extensionBridge.js:57-60)
6. **Extension content script intercepts** — `auth_bridge.js:42-62` receives the message, validates origin (lines 27-33), forwards via `chrome.runtime.sendMessage({action: 'SET_AUTH_TOKEN', token})`
7. **Background worker stores token** — `background.js:298-299` stores in `chrome.storage.local.set({authToken: token})`

### Token Expiry Handling

- **Web app**: Supabase SDK auto-refreshes tokens (`autoRefreshToken: true`, supabaseClient.js:21). On refresh, `AuthProvider.jsx:114` pushes new token to extension.
- **Extension**: `getAuthToken()` (background.js:77-89) decodes JWT payload, checks `exp` claim against current time. If expired, returns `null` but does NOT clear the stored token (line 85).
- **401 from backend**: background.js:823-826 sets `isAuthError: true`, breaks retry loop, returns message: "Please sign in at algorithmlens.com"

### Gaps Found

| # | Gap | Severity | Details |
|---|-----|----------|---------|
| 1 | **No token refresh trigger from extension** | HIGH | Extension is purely a recipient. If the web app isn't open when the token expires, the extension has no way to refresh. User must manually visit algorithmlens.com. No reverse channel exists. |
| 2 | **Expired token not cleared from storage** | LOW | background.js:85 returns `null` but the stale token persists in `chrome.storage.local`. Each request wastes cycles decoding it. |
| 3 | **Token push is fire-and-forget** | MEDIUM | AuthProvider.jsx:89 calls `sendAuthTokenToExtension(...).catch(() => {})` — not awaited. Race condition if extension tries to use token immediately. |
| 4 | **No refresh_token sent to extension** | MEDIUM | extensionBridge.js:59 sends only `{type, token}`. Extension stores only the access_token, cannot independently refresh. |
| 5 | **Callback page race condition** | LOW | AuthCallbackPage.jsx doesn't explicitly wait for token sync to extension. If user navigates away before sync completes, token might not reach extension. |
| 6 | **No storage write verification** | LOW | background.js:298-306 sends `{success: true}` without verifying `chrome.storage.local.set()` succeeded (can fail silently in incognito). |
| 7 | **401 errors not surfaced in popup UI** | MEDIUM | background.js creates the error but no evidence popup.js displays it to the user. |

---

## 2. AD PERCENTAGE PIPELINE

### Value at Each Stage

| Stage | Component | File:Line | Value Range | Example |
|-------|-----------|-----------|-------------|---------|
| 1. Extension calculation | `desktop_mapper.js` | `:1373` | 0-1 decimal | 0.25 |
| 2. API reception | `backend/routes/scans.py` | `:393` | 0-1 decimal | 0.25 |
| 3a. save_scan() conversion | `backend/database.py` | `:272-277` | 0-100 percentage | 25.00 |
| 3b. update_scan_result() conversion | `backend/database.py` | `:515-520` | 0-100 percentage | 25.00 |
| 4. DB storage | SQLite `scans` table | — | 0-100 percentage | 25.00 |
| 5. Dashboard retrieval | `scanAggregator.js` | `:177` | 0-100 (from DB) | 25.00 |
| 6. **Chart display (BUG)** | `scanAggregator.js` | `:198` | **0-10000 (double-converted)** | **2500** |
| 7. **Page display (BUG)** | `dataParsing.js` | `:83` | **0-10000 (double-converted)** | **2500** |

### Detailed Trace

**Extension** (`alg-gemini-extension/src/desktop_mapper.js`):
- Line 1373: `const adPercentage = totalItems > 0 ? totalAds / totalItems : 0;` — produces 0-1 decimal
- Line 1446: Stored in `aggregates.ad_percentage` as 0-1

**API** (`backend/routes/scans.py`):
- Line 393: `ad_percentage = aggregates.get("ad_percentage", 0.0)` — receives 0-1 decimal
- Line 448: Returns 0-1 decimal back to extension in response

**Database save_scan()** (`backend/database.py`):
- Lines 272-277: Correctly converts 0-1 to 0-100:
  ```python
  if total_items > 0:
      ad_percentage = round(min(total_ads / total_items, 1.0) * 100, 2)
  ```
- Line 312-316: Inserts the 0-100 value into SQLite

**Database update_scan_result()** (`backend/database.py`):
- Lines 515-520: Identical conversion logic, correctly converts 0-1 to 0-100:
  ```python
  if total_items > 0:
      ad_percentage = round(min(total_ads / total_items, 1.0) * 100, 2)
  ```
- Lines 529-534: Updates the row with 0-100 value

**Conversion consistency verdict: save_scan() and update_scan_result() are CONSISTENT.** Both recalculate from `total_ads / total_items` and multiply by 100. This is correct.

### Critical Bug: Double Conversion in Dashboard

**scanAggregator.js** (`src/lib/dashboard/scanAggregator.js`):
- Line 177: `const adPct = aggregates.ad_percentage || 0;` — receives 0-100 from DB
- Line 194 comment: `"Note: adPct from backend is 0-1, convert to 0-100 for display"` — **THIS COMMENT IS WRONG**
- Line 198: `value: Math.round(adPct * 100)` — multiplies already-converted value by 100 again

**dataParsing.js** (`src/lib/dataParsing.js`):
- Line 83: `const adPercentage = Math.round((aggregates.ad_percentage || 0) * 100);` — same double-conversion

**Result:** A feed with 25% ads displays as 2500% in time-series charts and scan detail pages. The overall percentage calculation (scanAggregator.js:206) is correct because it recalculates from totals: `Math.round((totalAds / totalPosts) * 100)`.

---

## 3. EPISTEMIC RESTRAINT

### Violations Found

#### HIGH Severity — Speculates about algorithmic intent

| File | Line(s) | Text | Issue |
|------|---------|------|-------|
| `src/components/Sections/SectionTracking.jsx` | 98 | "May surface more self-improvement and routine content." | Speculates about future algorithmic behavior |
| Same file | 107 | "May surface more political content with similar viewpoints." | Same pattern |
| Same file | 116 | "May surface more beauty, lifestyle, and product content." | Same pattern |
| Same file | 125 | "May surface more emotional-support and anxiety-related content." | Same pattern |
| Same file | 134 | "May surface more relationship and dating content." | Same pattern |
| Same file | 90 | "Signals algorithms pick up from your behavior" | Claims algorithms intentionally detect signals |
| `src/pages/dashboard/dashboardCatalog.js` | 1285 | "Topics the algorithm favors" | Attributes preference to algorithm |
| Same file | 1313 | "Does the algorithm favor videos, images, or other formats over what you follow." | Same "favor" language |
| Same file | ~2053 | "What topics does the algorithm push vs what I chose to follow?" | "Push" implies force/manipulation |
| Same file | ~2295 | "Does the algorithm favor certain content formats?" | Same "favor" pattern |
| `index.html` | 22-36 | "See what your algorithms see in you. Understand ads, themes, and influence across your feed." | "See in you" anthropomorphizes the algorithm and implies profiling |

#### MEDIUM Severity — Profiling/causal language

| File | Line(s) | Text | Issue |
|------|---------|------|-------|
| `src/components/Hero/Hero.jsx` | 26 | "The Spotify Wrapped for your algorithm. Discover your inferred digital labels." | "Inferred digital labels" frames feed observation as identity profiling |
| `src/components/Sections/SectionLoop.jsx` | 54, 107 | "Your feed composition reflects your inferred categories." | "Inferred categories" implies the platform has categorized the user |
| Same file | 64, 108 | "Over time, your feed composition may reflect and reinforce the topics you engage with most." | Claims reinforcement loop without evidence |
| `src/pages/dashboard/dashboardCatalog.js` | 1262 | "Engaging with new creators you discover may influence future suggestions." | Speculates about cause-effect |

#### Clean Examples (Good Restraint)

| File | Line | Text | Note |
|------|------|------|------|
| `src/components/dashboard/TalkToAlgorithmSection.jsx` | 580 | "In this scan, certain topics appeared frequently. This does not indicate what you are interested in, only what showed up." | Explicitly disclaims inference — this is the standard that should be applied everywhere |
| `alg-gemini-extension/src/popup/index.html` | 718 | "Analyzes tone and political signals. Only limited post data is sent." | Describes what the tool does without speculating |

### Patterns Identified

1. **"May surface" pattern** (5 instances in SectionTracking.jsx) — speculates about future algorithm behavior
2. **"Favor/favors" pattern** (3 instances in dashboardCatalog.js) — attributes preference/intent
3. **"Push" pattern** (1 instance in dashboardCatalog.js) — loaded language implying manipulation
4. **"Inferred categories/labels"** (Hero.jsx, SectionLoop.jsx) — frames observations as identity profiling
5. **"Reflect and reinforce"** (SectionLoop.jsx) — claims feedback loops without evidence

---

## Summary

| Flow | Status | Critical Issues |
|------|--------|-----------------|
| **Auth Bridge** | Functional but fragile | No reverse refresh channel; fire-and-forget token push; expired tokens not cleared |
| **Ad Percentage Pipeline** | Backend correct, frontend broken | Double-conversion bug in scanAggregator.js:198 and dataParsing.js:83 (values display 100x too high) |
| **Epistemic Restraint** | 15+ violations found | "May surface," "algorithm favors," "push," "inferred labels" — speculative/loaded language in marketing copy, dashboard labels, and meta tags |
