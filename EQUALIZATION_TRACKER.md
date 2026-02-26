# AlgorithmLens Equalization Tracker

## How to use this file
- Check off items as they are completed in Cowork task sessions
- Each item includes its source dimension and priority from the audit
- Items are grouped by platform, then sorted by priority (P0 first)

---

## Mobile App

### P0 — Launch Blockers

- [x] **[Functionality]** Enable Politics tab — connect to Gemini political analysis endpoint, render PoliticsTab with ideology distribution and keyword leaning, remove "Coming Soon" gate (hasPoliticsData always false → compute real data)
- [x] **[Functionality]** Enable Tone tab — connect to Gemini tone analysis endpoint, render ToneTab with stacked composition chart and methodology disclaimer, remove "Coming Soon" gate (hasToneData always false → compute real data)
- [x] **[Feature Gating]** Implement LockedOverlayCard for Plus features — port LockedOverlayCard pattern, implement mobile Stripe checkout with deep-link return flow, add trial tracking (Plus badge currently decorative only)

### P1 — Core Experience Parity

- [x] **[Functionality]** Fix WebView error handling — add try-catch around injectedJavaScript, show error state if injection returns no posts, add retry button (currently fails silently)
- [x] **[Data Visualization]** Improve chart readability — increase BarChart label size to 14px minimum, add legend to StackedBar100, set minimum segment width of 3% visible (currently 12px labels, no legends, segments <5% invisible)
- [x] **[Accessibility]** Add Dynamic Type support — replace hardcoded fontSize with RFValue or PixelRatio-based scaling, test at 200% size (currently fixed font sizes ignore device accessibility settings)
- [x] **[Accessibility]** Add chart accessibility labels — add accessibilityLabel on BarChart items and StackedBar100 segments describing values for VoiceOver/TalkBack (currently no screen reader support for charts)

### P2 — Polish

- [x] **[Security]** Add Sentry error tracking — add @sentry/react-native, instrument WebView injection failures, Stripe checkout errors, Supabase auth errors, scan processing failures, add navigation breadcrumbs for screen transitions (cross-platform audit requirement)
- [x] **[UI/UX]** Add dark mode — add dark color tokens to theme.ts, use useColorScheme(), update all component styles (currently light theme only)
- [x] **[Onboarding]** Build dashboard tooltip tour — built DashboardTour component with 6-step guided tooltip flow highlighting each tab (Overview, Sources, Ads, Politics, Tone, Suggested) with descriptions and accent colors. Triggers once after first scan via SecureStore flag. Mobile-optimized: bottom-positioned card, large tap targets (44px min), animated transitions, Back/Next/Skip navigation, progress dots. Switches active tab as user progresses through tour.
- [x] **[Copy & Epistemic Restraint]** Port counterfactual and "How we measure" patterns — added collapsible "What this might also mean" (counterfactual) and "How we measure" (methodology) expandable sections to InsightHero component. All 6 tabs now include both sections with tab-specific content matching the main site's epistemic restraint pattern. Counterfactuals acknowledge alternative interpretations. Methodology sections include What/How/Limitations rows plus "Learn more" deeplink to algorithmlens.com. Collapsed by default for clean card design (progressive disclosure).

### P3 — Long-term

- [x] **[Functionality]** Implement push notification scheduling — connected expo-notifications to settings frequency picker (3/5/7 day options). Requests permission once, respects denial (guides to Settings instead of re-prompting). Schedules repeating local notifications via TIME_INTERVAL trigger. Persists enabled state and frequency in SecureStore. Records last scan date after each scan for dynamic notification content. Notification handler configured for foreground display.
- [x] **[Functionality]** Build scan comparison view — added "Compare" button in history screen header. Tap enters selection mode with numbered badges; select 2 scans then tap "Compare Selected Scans." ComparisonView shows side-by-side date cards, summary narrative, and detailed metric rows (total posts, ad %, source diversity, suggested/followed ratio, plus political and tone if available) with up/down arrows and percentage deltas. Includes methodology disclaimer about scan variability. Uses observational language throughout.
- [x] **[Code Quality]** Clean up dead code — deleted unused App.tsx template file (confirmed no imports reference it; app uses expo-router via index.ts). Created centralized `src/config/thresholds.ts` with MIN_POSTS_GOOD, MIN_POSTS_OK, getQualityLevel(), and REMINDER_FREQUENCY_OPTIONS. Updated `app/scanner/[platform].tsx` and `app/(tabs)/history.tsx` to import from centralized config instead of duplicating constants.

---

## Chrome Extension

### P0 — Launch Blockers

- [x] **[Onboarding]** Build first-install welcome screen — create 3-step onboarding flow (what AlgorithmLens does, how to scan, AI consent), show on first install via chrome.storage flag (currently no welcome screen; popup opens directly to status check)
- [x] **[Accessibility]** Fix WCAG AA color contrast — change .dash-card-detail text from #9ca3af (3.8:1 ratio) to #6b7280, verify all secondary text meets 4.5:1 minimum
- [x] **[Accessibility]** Add aria-live region for status announcements — add aria-live=polite to status container, announce "Ready to scan", "Scanning", "Results ready" (currently status changes not announced to screen readers)

### P1 — Core Experience Parity

- [x] **[Accessibility]** Implement focus management in popup — auto-focus scan button on open, move focus to results container after scan, add visible focus rings (currently no focus trap; focus doesn't move to results)
- [x] **[Onboarding]** Add live post count badge and in-page scan indicator — update badge text with post count during session via chrome.action.setBadgeText, inject minimal toast overlay on page (currently no indicator during scan)
- [x] **[Copy & Epistemic Restraint]** Fix copy quality — add "(beta, limited accuracy)" to AI toggle, distinguish "captured locally" vs "upload failed" in error messages, add scrolling guidance "30+ seconds of natural scrolling", add methodology tooltips to all result cards, update CTA to reference methodology details, use observational language throughout (completed: all 5 audit issues resolved + methodology notes added to 6 result cards)
- [x] **[Data Visualization]** Add mini-chart visualizations to popup — add sparkline or mini horizontal bar to each of the 6 result cards using lightweight SVG rendering (currently text-only metric cards)

### P2 — Polish

- [x] **[Security]** Add Sentry error tracking — add @sentry/browser, initialize in background/popup/content scripts, report failed scan uploads, auth bridge failures, retry exhaustion, add state transition breadcrumbs (cross-platform audit requirement)
- [x] **[Feature Gating]** Show plan status and gate AI toggle — query /api/user/entitlements on auth, show "Free"/"Plus" in popup footer, gate AI toggle with "(Plus)" badge and upsell hint for free users (fail-closed: defaults to Free)
- [x] **[Functionality]** Add scan history section in popup — add collapsible "Recent Scans" section below results showing last 5 scans with platform/date/post count, each linking to dashboard; stores in chrome.storage.local; shows sign-in prompt for unauthenticated users
- [x] **[Functionality]** Clarify Reddit support status — Reddit scanner is fully implemented and enabled in SUPPORTED_SCAN_PLATFORMS; updated fallback popup message to "Reddit scanning is coming soon. We're working on compatibility with Reddit's layout."; cleaned up stale "unsupported" comment in background.js; fixed legacy error message that referenced localhost

### P3 — Long-term

- [x] **[Security]** Remove dev URLs from production manifest — removed http://localhost:8000/* and http://127.0.0.1:8000/* from manifest.json host_permissions; removed localhost:5173 from auth_bridge content_scripts matches; removed localhost from auth_bridge ALLOWED_ORIGINS; added LOCAL DEV SETUP comment block in background.js explaining how to re-add dev URLs for testing
- [x] **[Code Quality]** Clean up codebase — added STORAGE_KEYS object and TIMING constants to shared/constants.js with descriptive names and comments; refactored background.js, content.js, popup.js, auth_bridge.js to use centralized constants instead of magic numbers and scattered string keys; deleted facebook.js.bak and desktop_mapper.js.bak

---

## Main Site

### P1 — Core Experience Parity

- [x] **[Onboarding]** Build interactive dashboard tour — create OnboardingTour component highlighting each tab with tooltip, trigger on first dashboard visit, add tab-specific empty states (currently no interactive tour; empty state is generic)
- [x] **[Accessibility]** Implement WAI-ARIA keyboard tab navigation — add role=tablist, role=tab, arrow key + Home/End handlers, roving tabindex to dashboard tabs (currently not keyboard-navigable with arrow keys)
- [x] **[Accessibility]** Add alt text to micro-visualizations — add aria-label to each micro-visual type in ViewCard.jsx (sparklines, micro bars, micro segments) describing the trend or value
- [x] **[UI/UX]** Fix mobile responsive design — add explicit sm: breakpoints for all table components, test on 360px/390px viewports, add horizontal scroll fallback (currently tables truncate on <640px)
- [x] **[Security]** Add API retry logic with timeout handling — port extension's retry pattern (3 attempts, exponential backoff) to main site API layer, add timeout to ProcessingPage (currently no timeout/retry; ProcessingPage can hang)

### P2 — Polish

- [x] **[Security]** Add Sentry error tracking — add Sentry SDK, instrument API calls, auth flows, and payment paths, add error boundary reporting (currently console-only error logging)
- [x] **[Code Quality]** Split large files — split DashboardPage (3,121→499 lines) into TabRenderer, InsightManager, DashboardHeader, CheckoutBanners, TabNavigation, constants, utils + 3 custom hooks; split scanAggregator (2,418→134 lines index) into 9 metric-type modules; extract ViewCard (1,316→485 lines) into 10 renderer components + MicroVisuals. All files under 500 lines.
- [x] **[Performance]** Lazy-load tab components — all 7 dashboard tab components lazy-loaded via React.lazy() + Suspense with DashboardSkeleton fallback; Framer Motion audited (26 files, used for parallax/scroll physics/AnimatePresence — KEEP, justified by complex animation needs; ~80-100KB gzipped is acceptable for the feature set)

### P3 — Long-term

- [x] **[Code Quality]** Begin TypeScript migration — added tsconfig.json with strict mode, migrated API layer (fetchWithRetry.ts, authenticatedFetch.ts), auth module (supabaseClient.ts, authSession.ts, useAuth.ts, AuthProvider.tsx, index.ts), and data aggregation (aggregatorUtils.ts, scanAggregator.ts) to TypeScript with full type annotations and zero `any` escape hatches. Added .d.ts declaration files for non-migrated modules (errorLogger, sentry, apiConfig, planTier, entitlements, pricingConfig, analytics, extensionBridge) so TypeScript consumers can import them safely. Added vite-env.d.ts for import.meta.env types.
- [x] **[Functionality]** Build settings/profile page — created SettingsPage.jsx with 5 sections matching mobile scope: Account Info (email, member since, plan tier), Scan Preferences (duration, platforms, auto-save toggle), AI Analysis (consent toggle with epistemic restraint explanation of what AI does and its limitations), Plan Management (current plan display, upgrade CTA, Stripe billing portal link), Data Export (JSON/CSV format selector with download). Added /settings route to App.jsx and Settings link to Navbar (desktop + mobile). Responsive at 360px+. Styled with existing design system (Inter + Plus Jakarta Sans, blue/green accents, card shadows).
