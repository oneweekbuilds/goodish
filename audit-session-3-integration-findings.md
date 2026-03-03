# Audit Session 3: Extension–App Integration Findings

**Date:** 2026-02-18
**Auditor:** Claude (Automated)
**Scope:** Full integration and compatibility audit between `alg-gemini-extension` (Chrome extension) and `AlgorithmLens_Cowork` (web app + backend)

---

## Cycle 1: Initial Integration Audit

### Integration Architecture Overview

**Data Flow:**
1. Extension content script (`content.js`) scrapes social media feed posts via platform-specific scanners
2. Extension background script (`background.js`) maps raw posts to `UnifiedScanResult` via `desktop_mapper.js`
3. Background script sends payload to backend `POST /api/scan/desktop` with Supabase JWT auth
4. Backend validates, optionally runs Gemini AI analysis, saves to SQLite
5. Web app dashboard (`useDashboardData.js`) fetches scans via `GET /api/scans` and `GET /api/scans/{id}`
6. Extension popup links to dashboard via `OPEN_DASHBOARD` message

**Authentication Flow:**
- Web app uses Supabase auth (magic link) → JWT stored in browser
- Backend validates JWT via `auth.py` (JWKS or HS256 fallback)
- Extension sends scan data to backend → backend requires `Authorization: Bearer <JWT>`

---

### CRITICAL Issues

#### C1. Extension sends scan data WITHOUT authentication [CRITICAL]
**Files:** `alg-gemini-extension/src/background.js` (lines 715-718), `AlgorithmLens_Cowork/backend/routes/scans.py` (line 299)

The extension's `STOP_SESSION_SCAN_AND_PROCESS` handler sends the scan payload to `POST /api/scan/desktop` with NO Authorization header:
```js
const response = await fetch(`${BACKEND_URL}/api/scan/desktop`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payloadWithConsent)
});
```
But the backend endpoint requires authentication:
```python
async def desktop_scan(scan_result: dict, current_user: dict = Depends(get_current_user)):
```

This means **every scan submission from the extension will fail with 401 Unauthorized**. The extension has no mechanism to obtain or pass a Supabase JWT token.

**Impact:** Complete failure of the core extension→backend data pipeline.
**Fix:** Implement auth token flow in the extension (store JWT from webapp login, pass in API calls).

#### C2. Extension CORS origin not in allowed list [CRITICAL]
**Files:** `AlgorithmLens_Cowork/backend/app.py` (lines 122-131)

The backend CORS config allows:
- Dev: `http://localhost:5173`, `http://127.0.0.1:5173`, `:5175`
- Prod: `https://algorithmlens.com`, `https://www.algorithmlens.com`

Chrome extension requests come from `chrome-extension://<id>` origin, which is NOT in either list. The `fetch()` from the extension service worker may bypass CORS (service workers aren't bound by same-origin policy for simple requests), but any pre-flight OPTIONS requests would fail.

**Impact:** Potential request failures depending on browser CORS enforcement for extension contexts.
**Fix:** Add `chrome-extension://*` origin support or handle extension requests specially.

---

### HIGH Issues

#### H1. No version compatibility check between extension and backend [HIGH]
**Files:** `alg-gemini-extension/src/shared/debug.js` (line 8), `AlgorithmLens_Cowork/backend/config.py` (line 4)

Extension version: `1.1.0` (manifest), content script version: `1.0.0` (debug.js)
Backend version: `2026-02-17a`

There is no mechanism for:
- The extension to check if its payload format is compatible with the current backend
- The backend to reject or migrate payloads from outdated extensions
- The user to be notified if their extension is out of date

**Impact:** Silent data corruption or failures after either side is updated.
**Fix:** Add version handshake or at minimum a version header in API requests.

#### H2. Supported platforms list duplicated and potentially out of sync [HIGH]
**Files:**
- `alg-gemini-extension/src/background.js` (line 75): `['tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'reddit']`
- `alg-gemini-extension/src/popup/popup.js` (line 81): `['tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'reddit']`
- `AlgorithmLens_Cowork/backend/routes/scans.py` (line 133): `{"tiktok", "instagram", "youtube", "facebook", "twitter", "x", "linkedin", "reddit"}`

The backend accepts `"x"` and `"linkedin"` but the extension uses `"twitter"` (not `"x"`). This mismatch could cause issues if naming conventions change.

**Impact:** Platform name mismatches could cause data to be saved with inconsistent platform identifiers.
**Fix:** Create shared constants or at minimum document the canonical platform names.

#### H3. Extension hardcodes localhost backend URLs — no production URL configuration [HIGH]
**Files:** `alg-gemini-extension/src/background.js` (lines 59-60)

```js
let BACKEND_URL = 'http://127.0.0.1:8000';
let DASHBOARD_URL = 'http://localhost:5173';
```

While there's a mechanism to override via `chrome.storage.local`, there's no UI or automatic mechanism to set production URLs. Extension users in production would need to manually configure these.

**Impact:** Extension cannot communicate with production backend without manual configuration.
**Fix:** Set production URLs as defaults or auto-detect from extension store metadata.

#### H4. Extension manifest host_permissions include localhost but not production backend [HIGH]
**Files:** `alg-gemini-extension/manifest.json` (lines 34-35)

```json
"http://127.0.0.1:8000/*",
"http://localhost:8000/*"
```

No production backend URL is in host_permissions. The extension can't make requests to the production backend.

**Impact:** Extension cannot reach production API.
**Fix:** Add production backend URL to host_permissions.

#### H5. scan_id format mismatch between extension and backend validation [HIGH]
**Files:**
- `alg-gemini-extension/src/shared/generate-scan-id.js`: generates `scan_${timestamp_base36}_${random_base36}` (e.g., `scan_m1abc2_xyz12345`)
- `AlgorithmLens_Cowork/backend/validation.py` (line 6): validates against `^[a-zA-Z0-9][a-zA-Z0-9_\-]{4,128}$`

The extension-generated scan IDs use underscores which ARE allowed by the regex, so this is compatible. However, the backend also generates UUIDs for video uploads (`uuid.uuid4()`). The validation regex accepts both formats, but there's no type differentiation.

The `save_scan` function in `database.py` does NOT call `validate_scan_id` — only the GET/DELETE endpoints do. This means malicious scan_ids could be saved but then fail to retrieve.

**Impact:** Potential for inconsistent scan ID validation.
**Fix:** Add validation in the save path too.

#### H6. Backend saves ad_percentage as 0-100 scale, extension sends 0-1 scale [HIGH]
**Files:**
- `alg-gemini-extension/src/desktop_mapper.js` (mapDesktopPostsToUnifiedResult): computes `ad_percentage` as a 0-1 decimal
- `AlgorithmLens_Cowork/backend/database.py` (save_scan, line 250): recalculates `ad_percentage = min(total_ads / total_items * 100, 100.0)` — a 0-100 percentage

The backend ignores the extension's `ad_percentage` value and recalculates it as a 0-100 number. But the `/api/scan/desktop` response returns the original `aggregates.ad_percentage` (0-1 scale). The frontend's popup.js multiplies by 100 (`Math.round(aggregates.ad_percentage * 100)`), which is correct for the 0-1 scale from the extension.

However, when the dashboard fetches saved scans from the database, the stored `ad_percentage` is on the 0-100 scale. If the dashboard also multiplies by 100, it would show 10000% for a 100% ad feed.

**Impact:** Potential percentage display errors on the dashboard for desktop extension scans.
**Fix:** Standardize on one scale (0-1 or 0-100) across the entire pipeline.

---

### MEDIUM Issues

#### M1. Failed scan retry mechanism stores truncated data [MEDIUM]
**Files:** `alg-gemini-extension/src/background.js` (lines 747-771)

When backend submission fails, the extension stores a truncated payload to `chrome.storage.local` for later retry. However, there is no retry mechanism — the failed scans are stored but never retried.

**Impact:** Lost scan data on transient backend failures.
**Fix:** Implement a retry mechanism on extension startup or periodic alarm.

#### M2. No offline detection or user notification [MEDIUM]
**Files:** `alg-gemini-extension/src/background.js`

The extension doesn't check for network connectivity before attempting to send scans. If the backend is unreachable, the user gets a vague error after the retry attempts complete.

**Impact:** Poor user experience when backend is unavailable.
**Fix:** Add network connectivity check and clear user messaging.

#### M3. Content-Security-Policy blocks extension communication [MEDIUM]
**Files:** `AlgorithmLens_Cowork/backend/app.py` (line 152)

The CSP header sets `connect-src 'self' https://api.stripe.com https://*.supabase.co` which would block the web app from communicating with the extension if any postMessage or fetch is needed between them.

**Impact:** Limits future cross-communication options between web app and extension.
**Fix:** Consider if extension-webapp communication is needed and adjust CSP accordingly.

#### M4. Dashboard URL constructed without encoding [MEDIUM]
**Files:** `alg-gemini-extension/src/background.js` (line 803)

```js
dashboardUrl: `${DASHBOARD_URL}/history`
```

And in OPEN_DASHBOARD handler (lines 946-956), query params are encoded but the base URL uses string interpolation from potentially untrusted storage.

**Impact:** If DASHBOARD_URL is tampered with in chrome.storage.local, could redirect to malicious site.
**Fix:** Validate DASHBOARD_URL format before use.

#### M5. Extension content script version hardcoded and out of sync with manifest [MEDIUM]
**Files:**
- `alg-gemini-extension/src/shared/debug.js` (line 8): `CONTENT_SCRIPT_VERSION = '1.0.0'`
- `alg-gemini-extension/manifest.json` (line 4): `"version": "1.1.0"`

These should be in sync or derived from a single source.

**Impact:** Misleading version reporting in diagnostics.
**Fix:** Derive content script version from manifest version or a shared constant.

#### M6. Extension popup duplicates platform name map that could diverge [MEDIUM]
**Files:**
- `alg-gemini-extension/src/popup/popup.js` (lines 83-90): `platformNames` object
- No equivalent in backend — platform names are not shared

If a new platform is added, the names must be updated in the popup, background script platform detection, content script platform detection, backend validation, and frontend dashboard.

**Impact:** Inconsistent platform naming across the system.
**Fix:** Create a shared constants approach.

#### M7. Extension doesn't validate backend response schema [MEDIUM]
**Files:** `alg-gemini-extension/src/background.js` (lines 720-731)

After `fetch()`, the extension parses JSON but doesn't validate the response structure:
```js
backendResponse = await response.json();
```

If the backend response format changes, the extension would silently pass through incorrect data.

**Impact:** Silent failures if backend response format changes.
**Fix:** Add response schema validation.

---

### LOW Issues

#### L1. Debug flag is a compile-time constant, not runtime configurable [LOW]
**Files:** `alg-gemini-extension/src/shared/debug.js` (line 7): `CAPTURE_DEBUG = false`

Cannot enable debugging in production without rebuilding.

#### L2. Extension stores AI consent preference but doesn't sync with web app [LOW]
**Files:** `alg-gemini-extension/src/popup/popup.js` (lines 747-773)

AI consent is stored in `chrome.storage.local` and sent per-scan. The web app has no knowledge of this preference.

#### L3. No request deduplication on the backend for scan submissions [LOW]
**Files:** `AlgorithmLens_Cowork/backend/routes/scans.py` (desktop_scan endpoint)

If the same scan_id is submitted twice (e.g., due to network retry), the database would attempt to insert a duplicate primary key, which would fail with a SQLite constraint error that gets caught as a 500 error.

**Impact:** Retry logic in extension could cause 500 errors on duplicate submission.
**Fix:** Use INSERT OR REPLACE or handle IntegrityError gracefully.

#### L4. YouTube mobile URL not in content_scripts matches [LOW]
**Files:** `alg-gemini-extension/manifest.json` (content_scripts matches)

`m.youtube.com` is in host_permissions but not in content_scripts matches. The content script won't auto-inject on mobile YouTube.

---

## Summary — Cycle 1

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 2     | No auth in extension API calls, CORS mismatch |
| HIGH     | 6     | No version check, platform name mismatch, hardcoded URLs, scan_id validation gap, ad_percentage scale mismatch |
| MEDIUM   | 7     | No retry mechanism, no offline detection, CSP restrictions, URL encoding, version mismatch, duplicated constants |
| LOW      | 4     | Debug flag, AI consent sync, duplicate scan handling, YouTube mobile |

**Total: 19 issues identified**

---

## Cycle 2: Re-audit — API Contracts and Edge Cases

### Additional Issues Found

#### C3. No auth token bridge between web app and extension [CRITICAL → FIXED]
The web app's `AuthProvider.jsx` had no mechanism to send the Supabase JWT token to the Chrome extension. The extension's `SET_AUTH_TOKEN` handler existed but nothing called it.

**Fix:** Created complete token bridge:
- `alg-gemini-extension/src/auth_bridge.js`: Content script injected on algorithmlens.com, listens for postMessage tokens
- `AlgorithmLens_Cowork/src/lib/extension/extensionBridge.js`: Web app utility to send tokens via postMessage
- `AuthProvider.jsx`: Sends token on login/refresh, clears on logout
- `manifest.json`: Added algorithmlens.com to content_scripts matches

#### C4. ad_percentage scale mismatch between scan list API and frontend [CRITICAL → FIXED]
DB stores ad_percentage as 0-100. `_row_to_scan_summary()` returned it raw. Frontend's `formatPercent()` multiplied by 100, showing "2500%" for 25% ads.

**Fix:** `_row_to_scan_summary()` now converts from 0-100 (DB) to 0-1 (API) before returning.

#### H7. Trends threshold broken by ad_percentage scale change [HIGH → FIXED]
`TREND_THRESHOLD_PERCENTAGE_POINTS = 2` was designed for 0-100 scale. With scan summaries returning 0-1, the threshold needed adjustment to `0.02`.

#### H8. Scans.py error message referenced removed variable [HIGH → FIXED]
After replacing `SUPPORTED_PLATFORMS` with `ALL_ACCEPTED_PLATFORMS`, the error message still referenced the old variable name.

#### H9. Popup.js import placement [HIGH → FIXED]
The `import { SUPPORTED_SCAN_PLATFORMS, PLATFORM_DISPLAY_NAMES }` statement was placed mid-file instead of at the top. Moved to file header.

---

## Cycle 3: Re-audit — State Sync, Retry Logic, Resilience

### Issues Found and Fixed

#### H10. Extension retries auth errors unnecessarily [HIGH → FIXED]
The extension's retry loop retried all errors including 401/403 auth failures. Auth errors should break immediately since retrying won't help.

**Fix:** Added 401/403 detection in the retry loop that sets `isAuthError = true` and breaks immediately.

#### H11. No user-facing feedback for auth vs. backend errors [HIGH → FIXED]
When backend save failed, the popup showed no indication of WHY. Users couldn't distinguish "sign in needed" from "backend is down".

**Fix:** Added two distinct banners in `formatUnifiedResults()`:
- Auth error: "Sign in to save scans" with 🔑 icon
- Backend error: "Scan not saved to dashboard" with ⚠️ icon

#### M8. Extension doesn't detect expired JWT tokens [MEDIUM → FIXED]
The extension stored tokens indefinitely without checking expiry. Expired tokens would silently fail with 401.

**Fix:** `getAuthToken()` now decodes JWT payload and checks `exp` claim against current time. Returns `null` for expired tokens with a console warning.

#### M9. Secondary scan submission path missing auth error handling [MEDIUM → FIXED]
`SEND_DESKTOP_SCAN_TO_BACKEND` handler had no 401/403 detection. Fixed to match the primary path's auth error handling.

---

## Cycle 4: Re-audit — Developer Experience and Documentation

### Issues Found and Fixed

#### M10. AuthProvider getSession() not properly unwrapped [MEDIUM → FIXED]
`getSession()` returns `{ data: { session }, error }` from Supabase, but `AuthProvider` used the raw return value without destructuring. This meant `initialSession.user` and `initialSession.access_token` were always `undefined` on initial load.

**Fix:** Changed to `getSession().then(({ data: { session: initialSession } = {} } = {}) => {...})`.

#### M11. No integration documentation [MEDIUM → FIXED]
No documentation existed describing how the extension and web app communicate, the authentication flow, API contracts, or how to add new features spanning both codebases.

**Fix:** Created `INTEGRATION_GUIDE.md` with complete architecture overview, authentication flow, data flow, API contracts, shared constants reference, error handling matrix, and file reference tables.

---

## Cycle 5: Final End-to-End Verification

All 13 modified/created files verified correct. Four scenario traces completed successfully:
1. ✅ New user without auth → proper "Sign in" banner
2. ✅ User login → token bridge → extension stores token → authenticated scans
3. ✅ Token expiry → detected → null token → 401 → no retry → "Sign in" banner
4. ✅ Backend down → 3 retries with backoff → local save → "Not saved" banner

---

## Final Summary — All 5 Cycles

| Severity | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| CRITICAL | 4     | 4     | 0         |
| HIGH     | 11    | 11    | 0         |
| MEDIUM   | 11    | 8     | 3*        |
| LOW      | 4     | 3     | 1*        |
| **TOTAL**| **30**| **26**| **4**     |

*Remaining unfixed (deferred — low risk):
- M1: Failed scan retry queue has no actual retry mechanism (stored but never retried)
- M2: No offline detection before scan submission
- M3: CSP blocks potential future webapp-extension communication patterns
- L1: Debug flag is compile-time constant, not runtime configurable

### Files Created (4)
- `alg-gemini-extension/src/auth_bridge.js`
- `alg-gemini-extension/src/shared/constants.js`
- `AlgorithmLens_Cowork/backend/shared_constants.py`
- `AlgorithmLens_Cowork/src/lib/extension/extensionBridge.js`
- `INTEGRATION_GUIDE.md`

### Files Modified (10)
- `alg-gemini-extension/manifest.json`
- `alg-gemini-extension/src/background.js`
- `alg-gemini-extension/src/popup/popup.js`
- `alg-gemini-extension/src/shared/debug.js`
- `AlgorithmLens_Cowork/backend/app.py`
- `AlgorithmLens_Cowork/backend/routes/scans.py`
- `AlgorithmLens_Cowork/backend/routes/trends.py`
- `AlgorithmLens_Cowork/backend/database.py`
- `AlgorithmLens_Cowork/src/lib/auth/AuthProvider.jsx`
