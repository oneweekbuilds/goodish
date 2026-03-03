PERMISSIONS NOTE: You have full permission to run any bash command, write any file, read any file, edit any file, and delete any file without asking. Never stop to ask for permission. If a command needs confirmation, auto-confirm it. You are running autonomously overnight while the developer sleeps.

Read CLAUDE.md for project context. You are doing a comprehensive overnight improvement pass across ALL THREE AlgorithmLens platforms: the mobile app (AlgorithmLens_Cowork/mobile), the Chrome extension (alg-gemini-extension), and the main website (AlgorithmLens_Cowork/src). This is designed to run for several hours. Be thorough, not fast. For every file you touch, read it completely before making changes. Test after every change. When writing tests, aim for edge cases and failure modes, not just happy paths.

After completing each phase, log a detailed summary in activity.md at the project root. Include: files changed, what was done, before/after metrics where applicable.

PHASE 1: MOBILE APP TEST COVERAGE (spend significant time here, this is the highest value phase)

cd into AlgorithmLens_Cowork/mobile for this phase.

Write exhaustive tests for every module listed below. For EACH test file: write the tests, run npm test, if any fail then read the error carefully, fix the test or fix the source code, run npm test again, repeat until all pass. Only then move to the next file.

a) src/lib/computeDashboardData.ts — This is 789 lines and the most critical file. Write at least 30 test cases:
- Empty scan array returns safe defaults for all 6 tabs
- Single scan with complete data computes all metrics correctly
- Multiple scans aggregates data properly
- Missing fields at every level of nesting (null raw_data, null analysis, null feed_items, null posts)
- Zero posts returns zero percentages without division errors
- Broadcast-only scan data (from the analysis pipeline) computes correctly
- Browser scan data (from WebView scanner) computes correctly
- Mixed broadcast and browser scans in the same dashboard
- Verify each tab computation independently: overview, sources, ads, politics, tone, suggested vs followed
- Edge cases: all posts from one source, all posts are ads, all posts are suggested, zero political posts, zero tone data
- Malformed data: posts array contains non-objects, feed_items with missing required fields
- Large dataset: 1000+ posts to verify no performance issues in computation
Run npm test -- --coverage after all tests pass and log the coverage percentage for this file specifically.

b) src/lib/analysis/broadcastAnalysisPipeline.ts — 776 lines. Write at least 20 test cases:
- Test each stage transition independently
- Mock Gemini API responses: valid response, empty response, malformed JSON, rate limit error, network error, timeout
- Test deduplication: duplicate items should be removed, unique items preserved
- Test persistScan output: verify the exact shape matches what computeDashboardData expects (this is the critical integration point)
- Test with zero frames, one frame, 50 frames
- Test cancellation mid-pipeline
- Test concurrent batch processing (3 simultaneous Gemini calls)
- Test that base64 frame data is cleaned up after processing

c) src/lib/analysis/geminiFlashService.ts — Write at least 15 test cases:
- Successful single request
- Retry on 500 error (should retry up to 3 times with backoff)
- Retry on 429 rate limit
- No retry on 400 client error
- Timeout after configured duration
- Malformed JSON response body
- Empty response body
- Network error (fetch throws)
- Rate limiter throttles rapid calls
- Concurrent request handling
- Response parsing extracts feed items correctly
- Response with missing expected fields

d) src/lib/broadcastSessionManager.ts — 551 lines. Write at least 15 test cases:
- Every valid state transition (IDLE to PREPARING, PREPARING to RECORDING, etc)
- Every invalid state transition (should throw or no-op)
- Auto-stop triggers at 10 minute limit
- Cleanup on destroy removes all listeners and timers
- Frame counting increments correctly
- Session ID generation is unique

e) src/lib/platformScripts/ — For ALL 6 platforms (instagram, twitter, youtube, tiktok, facebook, reddit) plus index.ts:
- Each platform script generates syntactically valid JavaScript (wrap output in new Function() and verify no throw)
- index.ts getScriptForPlatform returns correct script for each platform name
- index.ts returns error for unknown platform
- Error wrapper properly wraps each script with try-catch
- Timeout logic is present in generated scripts
- Each script includes proper postMessage calls

f) src/lib/scanBuilder.ts — At least 8 test cases:
- Build with all fields populated
- Build with minimum required fields only
- Build with missing optional fields
- Output matches UnifiedScanResult type shape
- Platform name normalization

g) src/lib/cookieManager.ts — At least 8 test cases:
- Save and load round-trip
- TTL expiry returns null
- Clear removes data
- Malformed stored data handled gracefully
- Multiple platforms stored independently

h) src/components/scanner/WebViewScanner.tsx — Test the logic functions, not React rendering:
- Message handler correctly parses valid post messages
- Message handler rejects malformed messages
- Dedup logic using Set rejects duplicate keys
- Error categorization maps error reasons to user-friendly messages
- All error categories have messages (no undefined)

After ALL test files pass, run npm test -- --coverage and log full coverage report in activity.md. Target: 60%+ overall, 80%+ on computeDashboardData.ts.

PHASE 2: CHROME EXTENSION TEST INFRASTRUCTURE AND TESTS

cd into alg-gemini-extension for this phase.

The Chrome extension likely has no test infrastructure. Set it up and write tests.

a) Check if package.json exists with test scripts. If not, run npm init -y, install jest as dev dependency, create jest.config.js.
b) Create a test directory structure.
c) Write tests for each scanner (src/scanners/): instagram.js, twitter.js, youtube.js, tiktok.js, facebook.js, reddit.js, linkedin.js
- Each scanner should export functions that can be tested
- If scanners are IIFEs or side-effect-only scripts, write tests that evaluate the script text and verify structure
- Test that scanner functions exist for each supported platform
- Test the utility functions in src/scanners/utils.js
d) Write tests for src/desktop_mapper.js:
- Test that mapping produces UnifiedScanResult-compatible output
- Test with various input shapes
- Test with missing fields
e) Write tests for src/background.js logic (mock Chrome APIs):
- Test message handling
- Test state management
f) Write tests for any shared utilities in src/shared/
g) Run tests, fix failures, repeat until all pass.
h) Log results in activity.md.

PHASE 3: WEBSITE TEST INFRASTRUCTURE AND TESTS

cd into AlgorithmLens_Cowork for this phase.

a) Check existing test setup. If none, set up Vitest (since the project uses Vite) or Jest.
b) Write tests for the most critical website modules:
- src/lib/dashboard/dataHelpers.js — Test all data transformation functions
- src/lib/dashboard/insightBuilders.js — Test insight generation
- src/lib/dashboard/trendsComparison.js — Test trend computation
- src/lib/plan/entitlements.js — Test feature gating logic
- src/lib/plan/planTier.js — Test tier determination
- src/lib/errorMessages.js — Test error message mapping
- src/lib/analytics/ — Test event tracking functions
c) Run tests, fix failures, repeat.
d) Log results in activity.md.

PHASE 4: CROSS-PLATFORM DATA CONTRACT VERIFICATION

This phase writes integration-style tests that verify all three platforms produce and consume compatible data.

a) Read alg-gemini-extension/src/desktop_mapper.js to understand the extension scan output format.
b) Read AlgorithmLens_Cowork/mobile/src/lib/scanBuilder.ts for mobile browser scan output format.
c) Read AlgorithmLens_Cowork/mobile/src/lib/analysis/broadcastAnalysisPipeline.ts persistScan() for mobile broadcast output format.
d) Read AlgorithmLens_Cowork/src/lib/dashboard/dataHelpers.js (or equivalent) for website dashboard input expectations.
e) Read AlgorithmLens_Cowork/mobile/src/lib/computeDashboardData.ts for mobile dashboard input expectations.

f) Create a test file (in mobile or a new top-level test directory) that:
- Defines a sample scan output from each source (extension, mobile browser, mobile broadcast)
- Passes each through the dashboard computation function
- Verifies all three produce valid dashboard data with no errors
- Identifies any field name mismatches (camelCase vs snake_case)
- Identifies any missing fields that one platform provides but another expects
- Documents all incompatibilities found

g) Fix any incompatibilities found. The extension and website are the reference implementation. Mobile should match them.
h) Log all findings in activity.md.

PHASE 5: EPISTEMIC RESTRAINT AUDIT ACROSS ALL THREE PLATFORMS

This is not just mobile. Audit user-facing strings in ALL three codebases.

a) MOBILE: Search every .tsx and .ts file in AlgorithmLens_Cowork/mobile/src and AlgorithmLens_Cowork/mobile/app for user-facing strings. Flag and fix any that violate epistemic restraint by attributing intent to algorithms, making causal claims, using false certainty, or fear-mongering.

b) EXTENSION: Search every .js and .html file in alg-gemini-extension/src for user-facing strings. Check popup text, status messages, error messages, onboarding text. Flag and fix violations.

c) WEBSITE: Search every .jsx, .js, and .html file in AlgorithmLens_Cowork/src for user-facing strings. Check dashboard labels, insight text, error messages, onboarding copy, marketing copy on landing pages. Flag and fix violations.

d) GEMINI PROMPTS: Find every prompt sent to any AI model across all three platforms. These are the most critical. If a prompt instructs the AI to speculate about algorithmic intent, every downstream output will violate epistemic restraint. Fix all prompt violations.

e) TERMINOLOGY CONSISTENCY: Verify all three platforms use the same terminology for the same concepts. Make a terminology map and fix inconsistencies.

f) Verify builds pass on all platforms after changes.
g) Log in activity.md: total strings audited per platform, violations found by category, corrections made.

PHASE 6: ACCESSIBILITY ACROSS ALL THREE PLATFORMS

a) MOBILE: Audit every .tsx component and screen. Every interactive element needs accessibilityLabel and accessibilityRole. Every dynamic status needs accessibilityLiveRegion. Touch targets minimum 44x44. Charts need text summaries.

b) EXTENSION: Audit popup HTML and any injected UI. Add ARIA labels to all interactive elements. Check color contrast. Add aria-live regions for status updates.

c) WEBSITE: Audit all JSX components. Add ARIA labels, roles, landmarks. Check keyboard navigation on dashboard tabs (arrow keys, Home/End). Check color contrast against WCAG AA.

d) Verify builds pass on all platforms.
e) Log in activity.md: elements audited per platform, fixes applied.

PHASE 7: ERROR RESILIENCE ACROSS ALL THREE PLATFORMS

a) MOBILE: Find every network call (Supabase, Gemini, backend API, fetch). Verify each has timeout, retry for transient failures, and user-facing error handling. Fix gaps.

b) EXTENSION: Find every network call (background.js API calls, scan uploads, auth bridge). Verify timeout, retry, error handling. Fix gaps.

c) WEBSITE: Find every network call (Supabase queries, API calls, Stripe). Verify timeout, retry, error handling. Fix gaps.

d) Write tests for any shared retry/timeout utilities created.
e) Verify builds pass.
f) Log in activity.md: total network calls audited per platform, gaps found, fixes applied.

PHASE 8: DEAD CODE AND CONSOLE LOG CLEANUP ACROSS ALL THREE PLATFORMS

a) MOBILE: Remove unused exports, unused files, commented-out code blocks, console.log statements in production code.
b) EXTENSION: Same sweep. Remove dead code, unused files, console.log.
c) WEBSITE: Same sweep. Remove dead code, unused files, console.log. Check for unused components and pages.
d) Verify builds pass and all tests pass.
e) Log in activity.md: files deleted, lines removed per platform.

PHASE 9: PERFORMANCE AND BUNDLE OPTIMIZATION

a) MOBILE dashboard.tsx (1287 lines): Add React.memo to child components, useMemo for computations, replace ScrollView .map() with FlatList for long lists. Verify base64 frame cleanup in broadcast pipeline.

b) EXTENSION: Check popup.js bundle size. Lazy-load scanner scripts (only load the scanner for the detected platform). Remove unused imports.

c) WEBSITE: Check Vite bundle. Lazy-load dashboard tabs. Verify code splitting is working. Check for oversized images in assets.

d) Verify builds pass.
e) Log in activity.md.

PHASE 10: BETA LAUNCH READINESS SWEEP ACROSS ALL THREE PLATFORMS

Final pass on everything:

a) MOBILE: Every screen has loading/error/empty states. No TODO/FIXME visible to users. App metadata correct. All routes valid. Offline handling exists.

b) EXTENSION: Manifest.json permissions are minimal. Popup handles all states. Onboarding flow complete. Error states exist for scan failures.

c) WEBSITE: All pages render without errors. Links work. Stripe checkout flow has error handling. Landing page loads fast. SEO meta tags present.

d) Search all three codebases for: TODO, FIXME, HACK, lorem, placeholder, example.com, xxx, fake, test123. Remove or replace anything user-visible.

e) Verify all builds pass and all tests pass across all platforms.
f) Log final summary in activity.md.

FINAL COMPLETION CHECK

Run all test suites across all platforms. Log final coverage numbers. Review activity.md and ensure all 10 phases have detailed summaries. Count totals across all three platforms: files changed, files deleted, tests added, lines added, lines removed.

Output FULL_OVERHAUL_COMPLETE only when ALL ten phases are done across all three platforms, all builds pass, all tests pass, and activity.md documents everything.
