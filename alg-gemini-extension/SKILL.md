---
name: extension-dev
description: >
  This skill should be used when working on the AlgorithmLens Chrome extension
  codebase (alg-gemini-extension). Use for auditing, improving, debugging, or
  adding features to the extension's content script, background service worker,
  popup UI, desktop mapper, or test harness.
version: 0.1.0
---

# AlgorithmLens Extension Development Skill

## Architecture Overview

The AlgorithmLens Chrome extension is a Manifest V3 extension that scans desktop social media feeds via DOM scraping and sends structured results to a local backend for analysis.

### File Map

| File | Role | Lines | Status |
|------|------|-------|--------|
| `manifest.json` | MV3 manifest — permissions, content script injection, service worker | 47 | Stable |
| `src/content.js` | **Core engine** — platform detection, DOM scraping for 6 platforms, session management, MutationObserver-based continuous capture | ~6460 | Active, heavy |
| `src/background.js` | Service worker — session state (per-tab via `chrome.storage.session`), message routing, backend POST to `/api/scan/desktop`, badge management | ~894 | Stable |
| `src/desktop_mapper.js` | Maps `DesktopPostItem[]` → `UnifiedScanResult` schema — topic classification (keyword-based), aggregates, privacy metadata | ~1517 | Stable |
| `src/popup/index.html` | Popup UI — session timer, start/stop button, AI consent toggle, results display | ~577 | Stable |
| `src/popup/popup.js` | Popup logic — platform check, session start/stop, result formatting, dashboard link | ~772 | Stable |
| `test/run-extraction-test.js` | Snapshot-based test harness using jsdom — currently supports Instagram + Twitter only | ~609 | Partial |
| `vite.config.js` | Build config — multi-entry (content, background, popup), copies manifest + HTML to dist | ~53 | Stable |

### Data Flow

```
User clicks Start → popup.js → background.js (START_SESSION_SCAN)
  → content.js (startSessionScan → collectVisiblePosts + setupSessionObserver)
  → MutationObserver + scroll listener continuously collect posts
  → User clicks Stop → popup.js → background.js (STOP_SESSION_SCAN_AND_PROCESS)
  → content.js (stopSessionScan → returns posts[])
  → background.js calls desktop_mapper.mapDesktopPostsToUnifiedResult()
  → background.js POSTs to http://127.0.0.1:8000/api/scan/desktop
  → popup.js displays results + "View in Dashboard" button
```

### Platform Scanner Architecture (content.js)

Each platform has 4-5 extraction functions following the same pattern:

1. `extract{Platform}Creator(container)` — finds creator name via CSS selectors
2. `extract{Platform}Caption(container)` — finds caption/text content
3. `is{Platform}Sponsored(container)` — detects ads via labels, DOM attributes, class patterns
4. `extract{Platform}Post(container, index)` — orchestrates extraction into `DesktopPostItem`
5. `scan{Platform}Feed()` — finds all post containers, iterates, deduplicates

Platforms implemented: TikTok, Instagram (feed + Reels), YouTube (feed + Shorts), Facebook, Twitter/X, Reddit.

### Session Management

- **Per-tab state** stored in `chrome.storage.session` with in-memory cache
- **Double-submit protection** via `isProcessing` flag
- **REC badge** on extension icon during active sessions
- **Popup auto-closes** after starting a session
- **Rate limiting** via soft delay (not hard cap) — configurable thresholds

### Schema: DesktopPostItem (content.js output)

```js
{
  id: string,           // Platform-specific stable ID
  platform: string,     // tiktok|instagram|youtube|facebook|twitter|reddit
  creator: string|null,
  caption: string|null,
  hashtags: string[],
  isSponsored: boolean,
  ctaText: string|null,
  link: string|null,
  sponsoredEvidence?: { matchedText, selector, method }
}
```

### Schema: UnifiedScanResult (desktop_mapper.js output)

Top-level keys: `schema_version`, `scan_metadata`, `environment`, `feed_items[]`, `aggregates`, `privacy`, `debug`, `_computed`.

Each `feed_item` includes: `content_type`, `is_ad`, `ad_metadata`, `account`, `content_text`, `topics`, `political` (null—needs AI), `wellbeing` (NOT_ANALYZED—needs AI), `engagement_drivers`, `source_details`.

---

## What Currently Works vs. What's Incomplete

### ✅ Fully Working

- **Session-based scanning** — start/stop with timer, badge, auto-close popup
- **TikTok extraction** — creator, caption, hashtags, sponsored detection, video ID-based dedup
- **Instagram feed extraction** — creator, caption, hashtags, sponsored/paid-partnership detection, permalink-based dedup
- **Instagram Reels extraction** — shortcode extraction from container links, URL, and meta tags
- **YouTube feed extraction** — creator, title, channel links, video ID dedup
- **YouTube Shorts extraction** — separate path with URL change detection via `setInterval`
- **Twitter/X extraction** — creator via `[data-testid="User-Name"]`, tweet text, ad detection via `[data-testid="placementTracking"]`
- **Facebook extraction** — creator, caption, multi-method sponsored detection (13+ selector patterns), content-hash dedup
- **Non-post module filtering** — universal + per-platform rejection of PYMK, marketplace, memories, suggestions, carousels
- **Desktop mapper** — keyword-based topic classification (~5000+ terms across 15 categories), CTA aggregation, hashtag counting
- **Backend integration** — POST to `/api/scan/desktop` with `gemini_consent` flag
- **AI consent toggle** — persisted via `chrome.storage.local`, sent with scan payload
- **Debug logging relay** — content/popup logs forwarded to background console
- **Snapshot test harness** — jsdom-based extraction tests for Instagram and Twitter

### ⚠️ Partially Working / Known Issues

- **Reddit scanning** — fully implemented in content.js but **disabled in popup.js and background.js** (`SUPPORTED_SCAN_PLATFORMS` excludes it; `FACEBOOK_ENABLED_FOR_MVP` blocks Facebook in popup only)
- **Facebook scanning** — content.js extraction works but popup.js has `FACEBOOK_ENABLED_FOR_MVP = false` blocking it
- **Topic classification** — keyword-only (no AI); massive keyword lists (~1200 lines) but no contextual understanding; prone to false positives
- **Wellbeing/political/valence detection** — explicitly stubbed as `null`/`NOT_ANALYZED`; comment notes these require AI
- **Snapshot tests** — only Instagram + Twitter extractors are replicated in test harness; TikTok, YouTube, Facebook, Reddit not tested
- **`CAPTURE_DEBUG = true`** hardcoded in 3 files — should be `false` for production

### ❌ Not Yet Implemented / Stubbed

- **Engagement metrics extraction** — likes, comments, shares, views are NOT captured from any platform
- **Media type detection** — no distinction between image, video, carousel, text-only posts
- **Repetition detection** — `repetition` fields in mapper always return `false`/empty
- **Algorithm inference** — `suggested_interests` just echoes extracted keywords; no real inference
- **Error recovery** — if content script crashes mid-session, posts are lost; no persistence
- **Offline/queued submissions** — if backend is down, scan data is lost
- **Extension icons** — no custom icons (uses default Chrome puzzle piece)
- **Options page** — no settings/configuration page
- **User authentication** — no user identity tied to scans (uses `null` user_identifier)

---

## Prioritized Improvements

### P0 — Critical (Before Any Release)

1. **Set `CAPTURE_DEBUG = false` for production builds** — currently `true` in content.js, background.js, and popup.js; floods console with thousands of log lines per session
2. **Re-enable Facebook in popup** — `FACEBOOK_ENABLED_FOR_MVP = false` blocks a completed scanner
3. **Add extension icons** — missing `default_icon` in manifest; users see generic puzzle piece

### P1 — High Priority (Beta Quality)

4. **Extract engagement metrics** — likes, comments, shares, view counts are available in DOM for all platforms but not captured; critical for meaningful feed analysis
5. **Add media type detection** — distinguish VIDEO vs IMAGE vs CAROUSEL vs TEXT; affects content_type accuracy in UnifiedScanResult
6. **Expand test harness** — add TikTok, YouTube, Facebook, Reddit extractors to test/run-extraction-test.js; currently only Instagram + Twitter
7. **Reduce content.js size** — 6460 lines in one file; split into per-platform modules (e.g., `scanners/tiktok.js`, `scanners/instagram.js`)
8. **Add error boundaries in session** — if extraction throws for one post, catch and continue; currently a single DOM error could break the session
9. **Persist session posts to storage** — if content script reloads mid-session (page navigation, extension update), all collected posts are lost

### P2 — Medium Priority (Polish)

10. **Trim topic keyword lists** — `desktop_mapper.js` has ~1200 lines of keyword arrays; many are overly specific celebrity/brand names that cause false positives; consider condensing or moving to a JSON config
11. **Re-enable Reddit scanning** — code is complete but disabled; needs QA pass on extraction accuracy
12. **Add retry/queue for backend submissions** — if `127.0.0.1:8000` is unreachable, silently fails; should retry or queue
13. **Remove duplicate utility functions** — `generateScanId()` is defined in both background.js and desktop_mapper.js; `debugLog()` is copy-pasted across 3 files
14. **Add content script version check** — popup shows "refresh needed" errors when content script is stale; could auto-detect version mismatch
15. **Improve popup UX after scan** — results are dense HTML; could show a cleaner summary with expandable sections

### P3 — Nice to Have (Future)

16. **Options page** — let users configure: backend URL, debug mode, platform preferences, scan limits
17. **Offline mode** — store scan results in `chrome.storage.local` when backend is unreachable; sync later
18. **Repetition detection** — compare posts within a session for similar content/creators
19. **Visual indicator of scan progress** — show post count badge in real-time during session
20. **Export scan data** — allow users to download raw JSON from popup

---

## Slash Command Reference

### `/audit-extension`

Run a full audit of the extension codebase. Steps:

1. Read every file in `alg-gemini-extension/src/` and `test/`
2. Check for: hardcoded debug flags, dead code, duplicate functions, missing error handling, console.log pollution
3. Verify manifest.json permissions are minimal and correct
4. Check that all platform scanners follow the same extraction pattern
5. Verify desktop_mapper.js output matches UnifiedScanResult schema
6. Check popup.js handles all error states (no active tab, content script missing, backend down)
7. Produce a severity-classified findings report (Critical / Important / Minor)

### `/improve-popup`

Improve the popup UI and UX. Steps:

1. Read `src/popup/index.html` and `src/popup/popup.js`
2. Identify UX issues: information density, error messaging, loading states, accessibility
3. Check that all platform states render correctly (supported, unsupported, session active, results, error)
4. Propose specific CSS/HTML/JS changes
5. Implement approved changes
6. Test by reading the final HTML to verify structure

### `/add-feature [feature-name]`

Add a new feature to the extension. Steps:

1. Read the Architecture Overview above to understand file layout and data flow
2. Identify which files need changes (content.js, background.js, popup.js, desktop_mapper.js, manifest.json)
3. Check if the feature touches the UnifiedScanResult schema — if so, coordinate with backend expectations
4. Implement the feature following existing patterns:
   - Platform-specific code goes in the appropriate scanner section of content.js
   - New message types need handlers in both background.js and content.js
   - UI changes go in popup/index.html (CSS) and popup/popup.js (logic)
   - Schema changes go in desktop_mapper.js
5. Add test coverage in test/run-extraction-test.js if the feature affects extraction
6. Update this SKILL.md if the feature changes architecture

### `/fix-scanner [platform]`

Debug and fix extraction issues for a specific platform. Steps:

1. Read the relevant scanner section in content.js (search for `// {PLATFORM} SCANNER`)
2. Read the test snapshot notes if available (test/snapshots/{platform}_notes.txt)
3. Identify the extraction functions: `extract{Platform}Creator`, `extract{Platform}Caption`, `is{Platform}Sponsored`, `extract{Platform}Post`, `scan{Platform}Feed`
4. Check CSS selectors against current DOM structure (platforms change their markup frequently)
5. Look for: false positives in sponsored detection, missed creators, caption truncation, deduplication failures
6. Fix issues and update test snapshots
7. Run `npm run test:snapshots` to verify

### `/split-content-js`

Refactor content.js into per-platform modules. Steps:

1. Read the full content.js to understand shared utilities vs platform-specific code
2. Create a module structure:
   - `src/scanners/tiktok.js`
   - `src/scanners/instagram.js`
   - `src/scanners/youtube.js`
   - `src/scanners/facebook.js`
   - `src/scanners/twitter.js`
   - `src/scanners/reddit.js`
   - `src/scanners/utils.js` (shared: safeQuery, safeText, extractHashtags, containsAdIndicator, etc.)
   - `src/scanners/index.js` (platform router)
3. Move each scanner's functions into its module
4. Keep session management and message listener in content.js
5. Update vite.config.js if needed for new entry points
6. Verify build succeeds with `npm run build`

### `/add-engagement-metrics`

Add extraction of likes, comments, shares, and view counts. Steps:

1. For each platform scanner, identify DOM elements containing engagement counts
2. Add extraction functions: `extract{Platform}EngagementMetrics(container)`
3. Add to DesktopPostItem schema: `engagement: { likes, comments, shares, views }`
4. Update desktop_mapper.js to map engagement data into feed_items
5. Update aggregates with engagement summaries
6. Add display in popup results

### `/production-prep`

Prepare extension for production/store submission. Steps:

1. Set `CAPTURE_DEBUG = false` in all three files (content.js, background.js, popup.js)
2. Remove or gate all `console.log` statements behind debug flag
3. Add extension icons (16, 32, 48, 128px) to manifest
4. Review and minimize permissions in manifest.json
5. Check `host_permissions` — currently `https://*/*` is overly broad; restrict to supported domains
6. Set `FACEBOOK_ENABLED_FOR_MVP` based on current readiness
7. Add proper error messages for all edge cases
8. Run `npm run build` and verify dist/ output
9. Test loading dist/ as unpacked extension in Chrome

---

## Key Conventions

- **Platform names** are lowercase in code: `tiktok`, `instagram`, `youtube`, `facebook`, `twitter`, `reddit`
- **Message actions** use SCREAMING_SNAKE_CASE: `START_SESSION_SCAN`, `STOP_SESSION_SCAN`, etc.
- **CSS selectors** break frequently — always comment WHY a selector was chosen and WHEN it was last verified
- **Deduplication** uses platform-specific IDs first (permalink-based), falls back to content hash, then index
- **Sponsored detection** uses multiple methods per platform — check `is{Platform}Sponsored()` for the full list
- **The `_computed` field** in UnifiedScanResult is for popup display convenience only; backend should not depend on it
- **Backend URL** is hardcoded to `http://127.0.0.1:8000` in background.js
- **Dashboard URL** is hardcoded to `http://localhost:5173` in background.js
