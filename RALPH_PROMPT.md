Read CLAUDE.md for project context. You are doing a complete codebase overhaul of the AlgorithmLens mobile app in a single overnight session. There are 10 phases. Work through every phase sequentially, do not skip any. After completing each phase, log a summary in activity.md and run cd AlgorithmLens_Cowork/mobile && npx tsc --noEmit and npm test to verify nothing is broken before proceeding.

PHASE 1 of 10: DEAD CODE REMOVAL

Shrink the codebase before doing anything else.

a) For every exported function, type, constant, and component in mobile/src/, grep the entire mobile/ directory to check if it is imported anywhere. Delete unused exports. If an entire file has no remaining exports or usages, delete the file.
b) Remove all commented-out code blocks longer than 3 lines.
c) Check package.json dependencies, remove any package imported nowhere in src/ or app/.
d) Specifically check if mobile/src/hooks/useScan.ts is used anywhere. Its saveScan() duplicates logic in app/scanner/[platform].tsx. If unused, delete it.
e) Remove TODO/FIXME comments that describe work already completed.
f) Verify: npx tsc --noEmit zero errors, npm test all pass.
g) Log in activity.md: files deleted, exports removed, packages removed, total lines eliminated.

PHASE 2 of 10: TYPESCRIPT STRICTNESS

a) Enable noUncheckedIndexedAccess: true in tsconfig.json. Fix every resulting error with proper null checks.
b) Search for every any type in src/. Replace with proper types or unknown + type guards. Reduce count by 70%+. Where any is unavoidable, add a comment explaining why.
c) Replace unsafe non-null assertions (!) with optional chaining or proper null checks. Leave ! only where provably safe.
d) Add explicit return types to every exported function missing one.
e) Verify: npx tsc --noEmit zero errors, npm test all pass.
f) Log in activity.md: any count before/after, ! count before/after, return types added.

PHASE 3 of 10: TEST COVERAGE EXPANSION

Write comprehensive tests for every critical module. Mock external dependencies (Supabase, Gemini API, native modules, AsyncStorage, expo-router) using Jest mocks following patterns in src/__tests__/__mocks__/. For EACH file, create tests, run npm test, fix failures, then move to the next.

a) src/lib/computeDashboardData.ts: Test with empty scans, single scan, multiple scans, missing fields, zero posts, broadcast-only data, browser-only data. Test each of the 6 tab computations. Test edge cases: division by zero, null nested fields, empty feed_items. TARGET: 80%+ coverage on this file.

b) src/lib/analysis/broadcastAnalysisPipeline.ts: Test stage transitions (PREPARING to ANALYZING to DEDUPLICATING to BUILDING to SAVING to COMPLETE), error handling (Gemini errors, Supabase failures, empty frames), dedup logic, and verify persistScan output format matches what computeDashboardData expects. TARGET: 80%+ coverage.

c) src/lib/analysis/geminiFlashService.ts: Test retry logic (fail twice then succeed), rate limiting, response parsing (valid, malformed, empty, error), timeout behavior.

d) src/lib/broadcastSessionManager.ts: Test state machine transitions (valid and invalid), cleanup on destroy, auto-stop at 10 min limit.

e) src/lib/platformScripts/: Test each platform generates syntactically valid JS (wrap in new Function()), test index.ts routing, test error wrapper.

f) src/lib/scanBuilder.ts: Test construction with various inputs and missing optional fields.

g) src/lib/cookieManager.ts: Test save/load/clear, TTL expiry, malformed data.

h) src/components/scanner/WebViewScanner.tsx: Test message handling, dedup logic, error categorization.

After all tests: npm test -- --coverage. Log coverage numbers in activity.md. TARGET: 60%+ overall.

PHASE 4 of 10: PLATFORM SCRIPT HARDENING

For each of the 6 platform scripts in src/lib/platformScripts/:

a) Read the Chrome extension equivalent scanner in alg-gemini-extension/src/scanners/ for comparison. Add any selectors or edge case handling the extension has that the mobile script lacks.
b) Add fallback selectors in cascading priority: data-testid first, semantic HTML second, class-based last.
c) Add page type detection: detect login page, consent wall, rate limit page, error page, or correct feed. Send page state messages via postMessage with states LOGIN_REQUIRED, CONSENT_REQUIRED, RATE_LIMITED, FEED_READY, or UNKNOWN_PAGE.
d) Add selector health check on init: if critical selectors are missing, send a SELECTOR_WARNING message listing the missing selectors.
e) Add VERSION constant to each script, included in SCANNER_READY message.
f) Ensure explicit 30-second timeout if no posts captured after SCANNER_READY.
g) Update tests from Phase 3 to cover new functionality.
h) Verify: npx tsc --noEmit zero errors, npm test all pass.
i) Log changes per platform in activity.md.

PHASE 5 of 10: API ERROR RESILIENCE

a) Search for every network call: supabase.from(), supabase.auth, supabase.functions, fetch(). List every call with file, line, purpose.
b) For each call, verify it has: timeout (10s reads, 15s writes, 30s AI), retry with exponential backoff for transient failures (max 3, not for 4xx except 429), user-facing error handling (no silent failures), and fallback where appropriate (cached data from AsyncStorage).
c) Fix every gap. If the same retry/timeout pattern is needed 3+ times, create a shared utility.
d) Write tests for any shared utility created.
e) Verify: npx tsc --noEmit zero errors, npm test all pass.
f) Log in activity.md: total calls audited, gaps found, fixes applied.

PHASE 6 of 10: ACCESSIBILITY

Read EVERY .tsx file in mobile/src/components/ and mobile/app/.

a) Every TouchableOpacity, Pressable, Button must have accessibilityLabel (describing the action) and accessibilityRole. Target: 100%.
b) Every Image must have accessibilityLabel describing content.
c) Every TextInput must have accessibilityLabel and accessibilityHint.
d) All interactive elements must have touch targets minimum 44x44pt. Add hitSlop where too small.
e) Section headings should have accessibilityRole set to header.
f) Dynamic status indicators (scan progress, errors, loading, results) must have accessibilityLiveRegion set to polite.
g) Charts and data visualizations must have accessibilityLabel summarizing data in plain English.
h) Check theme colors for contrast ratios. Flag any below WCAG AA (4.5:1 normal text, 3:1 large text). Fix where possible by adjusting the color.
i) Verify: npx tsc --noEmit zero errors, npm test all pass.
j) Log in activity.md: components audited, labels added, contrast issues, touch target fixes.

PHASE 7 of 10: EPISTEMIC RESTRAINT COPY AUDIT

AlgorithmLens core principle: describe observable patterns without speculating about algorithmic intent.

a) Extract every user-facing string from every .tsx and .ts file: JSX text, labels, descriptions, messages, placeholders, error text, toast text, Gemini prompts, formatted result strings.

b) Flag violations: Attributing intent like the algorithm wants, designed to keep you, trying to manipulate, pushing you toward, the platform knows, deliberately showing. Causal claims like causes addiction, leads to radicalization, makes you feel. False certainty like definitely, proves that, clearly manipulating. Fear-mongering like alarming, dangerous, you should be worried, toxic.

c) Fix every violation. Replacements must describe what was observed (not why), use data (not judgments), and maintain the same information content.

d) Pay SPECIAL attention to Gemini prompts: if prompts instruct Gemini to speculate about intent, all AI outputs will violate epistemic restraint.

e) Fix inconsistent terminology (mixing scan/analysis/audit for the same concept).

f) Verify: npx tsc --noEmit zero errors, npm test all pass.
g) Log in activity.md: strings audited, violations by category, corrections made.

PHASE 8 of 10: PERFORMANCE OPTIMIZATION

a) mobile/app/(tabs)/dashboard.tsx (1287 lines): Add React.memo to expensive child components, wrap computations in useMemo with proper deps, replace .map() in ScrollView with FlatList for long lists, lazy-load tab content (user sees one tab at a time).

b) mobile/src/lib/computeDashboardData.ts (789 lines): Eliminate redundant iterations over the same data, cache intermediate results, remove unnecessary object spreads/array copies.

c) Broadcast pipeline memory: Verify base64 frame strings are released after Gemini analysis. Verify analysisDataStore is cleaned up after navigation. Fix any event listeners or timers not cleaned up on unmount.

d) Import efficiency: Replace whole-library imports with specific sub-module imports where possible.

e) Remove unused assets from assets/ directory.

f) Verify: npx tsc --noEmit zero errors, npm test all pass.
g) Log in activity.md: optimizations made, files changed.

PHASE 9 of 10: CROSS-PLATFORM DATA CONSISTENCY

a) Read how the Chrome extension structures scan data (alg-gemini-extension/src/desktop_mapper.js). Read how the mobile app structures scan data (scanBuilder.ts, broadcastAnalysisPipeline.ts persistScan).

b) Verify the mobile app saved scan format is 100% compatible with the website dashboard: Field names match exactly (check camelCase vs snake_case), posts array structure matches, analysis.feed_items structure matches, metadata fields (platform, scan_type, created_at) match, ai_analyzed flag set correctly.

c) Fix any format mismatches on the mobile side to match the website/extension reference.

d) Check if mobile computeDashboardData.ts diverges from the website equivalent. Document any differences.

e) Verify: npx tsc --noEmit zero errors, npm test all pass.
f) Log in activity.md: compatibility issues found, fixes applied.

PHASE 10 of 10: BETA LAUNCH READINESS

Final sweep:

a) Error states: Every screen that loads data must have loading state, error state with retry, and empty state. Fix missing ones.

b) Placeholder content: Search for TODO, FIXME, HACK, lorem, placeholder, example.com, xxx, fake. Remove or replace anything visible to users.

c) Console logging: Remove console.log from production code (not tests). Keep console.error only where Sentry should capture.

d) Environment variables: Verify no dev/staging URLs or keys would ship to production. Verify placeholder DSNs are clearly marked.

e) App metadata: Read app.json or app.config.js. Verify app name, bundle ID, version, permissions are correct and not defaults.

f) Navigation: Verify every router.push/router.replace points to a route that exists. Flag dead routes.

g) Offline handling: Check what happens with no internet on every data-loading screen. Add offline message or cached fallback where missing.

h) Verify: npx tsc --noEmit zero errors, npm test all pass.
i) Log in activity.md: issues found per category, fixes applied, items needing manual attention.

FINAL COMPLETION CHECK

Run npx tsc --noEmit for zero errors. Run npm test -- --coverage for all tests pass, log final coverage numbers. Review activity.md, all 10 phases must have logged summaries. Count total: files changed, files deleted, tests added, lines added, lines removed.

Output FULL_OVERHAUL_COMPLETE only when ALL ten phases are done, build passes, all tests pass, and activity.md documents everything.
