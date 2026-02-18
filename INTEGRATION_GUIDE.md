# AlgorithmLens Integration Guide
## Extension ↔ Web App ↔ Backend

**Last updated:** 2026-02-18 (Audit Session 3)

---

## Architecture Overview

```
┌──────────────────────────┐     ┌───────────────────────────────┐
│  Chrome Extension        │     │  Web App (algorithmlens.com)   │
│                          │     │                               │
│  content.js              │     │  AuthProvider.jsx             │
│    ↕ messages             │     │    ↕ Supabase Auth            │
│  auth_bridge.js ─────────┼─────┼→ extensionBridge.js           │
│    ↕ postMessage          │     │    (token sync)               │
│  background.js           │     │                               │
│    ↕ fetch + JWT          │     │  useDashboardData.js          │
│                          │     │    ↕ authenticatedFetch        │
└──────────┬───────────────┘     └──────────┬────────────────────┘
           │                                │
           │   POST /api/scan/desktop       │  GET /api/scans
           │   Authorization: Bearer <JWT>  │  GET /api/scans/{id}
           │                                │  GET /api/user/entitlements
           └────────────┬───────────────────┘
                        │
                ┌───────┴──────────────────┐
                │  FastAPI Backend          │
                │                          │
                │  auth.py (JWT verify)     │
                │  routes/scans.py          │
                │  routes/entitlements.py   │
                │  database.py (SQLite)     │
                │  gemini_analyzer.py       │
                └──────────────────────────┘
```

## Authentication Flow

1. User visits `algorithmlens.com` and signs in via Supabase magic link
2. Supabase returns JWT `access_token` to the web app
3. `AuthProvider.jsx` calls `sendAuthTokenToExtension(access_token)` via `extensionBridge.js`
4. `extensionBridge.js` posts a `window.postMessage` with `type: 'ALGORITHMLENS_AUTH_TOKEN'`
5. Extension's `auth_bridge.js` (content script on algorithmlens.com) receives it
6. `auth_bridge.js` forwards to `background.js` via `chrome.runtime.sendMessage({ action: 'SET_AUTH_TOKEN', token })`
7. `background.js` stores token in `chrome.storage.local`
8. On subsequent API calls, `authenticatedExtensionFetch()` includes `Authorization: Bearer <token>`

### Token Refresh
- Supabase tokens expire after ~1 hour
- Web app has `autoRefreshToken: true` — tokens auto-refresh when user visits
- `AuthProvider` sends refreshed tokens to extension on every auth state change
- Extension checks token expiry before API calls; returns `null` if expired
- If token is expired and user hasn't visited the web app, backend returns 401
- Extension shows "Sign in to save scans" banner (not a hard error)

## Data Flow: Scan Lifecycle

### Desktop Extension Scan
1. User clicks "Start Session Scan" in extension popup
2. `background.js` starts session timer, sets `REC` badge
3. `content.js` starts collecting posts via `MutationObserver` + `IntersectionObserver`
4. User clicks "Stop" → `STOP_SESSION_SCAN_AND_PROCESS` message
5. `background.js`:
   - Gets posts from content script
   - Calls `mapDesktopPostsToUnifiedResult()` from `desktop_mapper.js`
   - Adds `gemini_consent` flag
   - Calls `authenticatedExtensionFetch(POST /api/scan/desktop, payload)`
   - Retries up to 3× with exponential backoff (but NOT for 401/403)
6. Backend:
   - Validates JWT via `auth.py`
   - Validates scan_id format
   - Runs Gemini AI analysis if `gemini_consent=true`
   - Saves to SQLite via `database.save_scan()`
   - Returns enriched result to extension
7. Extension popup shows results with dashboard preview cards

### Mobile Video Upload Scan
1. User uploads video at `algorithmlens.com/scan`
2. Frontend calls `POST /api/scan/upload` with video file
3. Backend returns `scan_id` immediately, processes video in background thread
4. Frontend polls `GET /api/scans/{scan_id}/status` until `completed`

## API Contracts

### POST /api/scan/desktop
**Auth:** Required (Supabase JWT)
**Headers:**
- `Authorization: Bearer <jwt>`
- `Content-Type: application/json`
- `X-Extension-Version: <version>` (informational)

**Request Body:** `UnifiedScanResult` with `gemini_consent` flag
```json
{
  "scan_metadata": {
    "scan_id": "scan_m1abc2_xyz12345",
    "platform": "instagram",
    "source_type": "DESKTOP_EXTENSION",
    "created_at": "2026-02-18T10:30:00.000Z",
    "user_identifier": "ignored-overridden-by-jwt"
  },
  "aggregates": {
    "total_feed_items": 25,
    "total_ads": 3,
    "ad_percentage": 0.12,
    "duration_seconds": 120
  },
  "feed_items": [...],
  "gemini_consent": true
}
```

**Response (200):**
```json
{
  "success": true,
  "scan_id": "scan_m1abc2_xyz12345",
  "platform": "instagram",
  "total_items": 25,
  "total_ads": 3,
  "ad_percentage": 0.12,
  "ai_analyzed": true,
  "topic_distribution": [...],
  "wellbeing_summary": {...},
  "political_content_summary": {...}
}
```

### GET /api/scans
**Auth:** Required
**Response:**
```json
{
  "scans": [
    {
      "id": "scan_m1abc2_xyz12345",
      "created_at": "2026-02-18T10:30:00",
      "platform": "instagram",
      "total_items": 25,
      "total_ads": 3,
      "ad_percentage": 0.12,
      "source_type": "DESKTOP_EXTENSION"
    }
  ]
}
```
**Note:** `ad_percentage` is returned as 0-1 decimal. Frontend multiplies by 100 for display.

### GET /api/user/entitlements
**Auth:** Required
**Response:**
```json
{
  "is_plus": false,
  "subscription": {
    "status": null,
    "plan_type": null,
    "trial_end": null,
    "current_period_end": null,
    "trial_days_remaining": null,
    "period_days_remaining": null
  }
}
```

## Shared Constants

**Extension:** `alg-gemini-extension/src/shared/constants.js`
**Backend:** `AlgorithmLens_Cowork/backend/shared_constants.py`

These files MUST stay in sync. They define:
- `SUPPORTED_SCAN_PLATFORMS` — platforms the extension can scan
- `PLATFORM_DISPLAY_NAMES` — human-readable names
- `PLATFORM_ALIASES` — e.g., `x` → `twitter`

## Error Handling Matrix

| Scenario | Extension Behavior | User Message |
|----------|-------------------|--------------|
| No auth token | Sends request without auth header | "Sign in to save scans" banner |
| Token expired (401) | Stops retry, flags auth error | "Sign in to save scans" banner |
| Backend down (500/network) | Retries 3× with backoff, saves to failedScans | "Scan not saved to dashboard" banner |
| Rate limited (429) | Retries with backoff | Generic error |
| Unsupported platform | Popup shows "unsupported" state | Platform not in dropdown |
| Content script disconnected | Detects via error message | "Connection Lost" banner |

## Adding a New Integration Point

When adding a new feature that spans both codebases:

1. **Define the API contract first** — endpoint path, request/response shapes
2. **Update shared constants** if new platforms or categories are involved (both files!)
3. **Backend**: Add route in `routes/`, add auth with `Depends(get_current_user)`
4. **Extension**: Use `authenticatedExtensionFetch()` for API calls
5. **Frontend**: Use `authenticatedFetch()` from `lib/api/authenticatedFetch.js`
6. **CORS**: Backend allows `chrome-extension://` via regex and standard origins
7. **Test scenarios**: Auth OK, auth expired, backend down, malformed response

## Version Compatibility

- Extension sends `X-Extension-Version` header on every request
- Backend version is in `config.__version__`
- No breaking version check enforced yet — planned for future
- `manifest.json` version and `debug.js CONTENT_SCRIPT_VERSION` should match

## Files Reference

### Integration-Critical Files (Extension)
| File | Purpose |
|------|---------|
| `src/background.js` | Service worker, API calls, session management |
| `src/auth_bridge.js` | Token bridge between web app and extension |
| `src/content.js` | Feed scanning, platform detection |
| `src/desktop_mapper.js` | Converts scraped posts to UnifiedScanResult |
| `src/shared/constants.js` | Shared platform lists and constants |
| `src/shared/generate-scan-id.js` | Scan ID generation |
| `src/popup/popup.js` | Popup UI, result display |
| `manifest.json` | Permissions, content script injection |

### Integration-Critical Files (Backend)
| File | Purpose |
|------|---------|
| `backend/app.py` | CORS config, middleware |
| `backend/auth.py` | JWT verification (JWKS + HS256) |
| `backend/routes/scans.py` | Scan upload and desktop scan endpoints |
| `backend/routes/entitlements.py` | Subscription status |
| `backend/database.py` | SQLite storage, scan CRUD |
| `backend/shared_constants.py` | Shared platform lists and constants |
| `backend/gemini_analyzer.py` | AI analysis pipeline |

### Integration-Critical Files (Frontend)
| File | Purpose |
|------|---------|
| `src/lib/auth/AuthProvider.jsx` | Auth state, token sync to extension |
| `src/lib/extension/extensionBridge.js` | Web app → extension communication |
| `src/lib/api/authenticatedFetch.js` | Authenticated API wrapper |
| `src/lib/apiConfig.js` | API base URL resolution |
| `src/lib/plan/entitlements.js` | Subscription sync |
| `src/lib/dashboard/useDashboardData.js` | Dashboard data fetching |
