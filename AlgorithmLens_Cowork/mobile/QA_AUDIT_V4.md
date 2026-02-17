# QA Audit V4 — February 16, 2026

## Baseline
QA Audit V3 implemented 32 fixes (C1–C4, H1–H8, M1–M10, L1–L7). This V4 audit is a comprehensive deep-dive after the user recorded a ~44-second walkthrough of the current app state.

## Scope
Full review of every screen, every source file, every platform script, and every component. 200+ areas for improvement.

---

## VIDEO OBSERVATIONS

### What's Working
- Dashboard scrolls fully ✓
- All 6 tabs render and switch with fade animation ✓
- InsightHero is collapsible ✓
- Sources tab shows bar chart with creators ✓
- Suggested tab shows stacked bar + explanation text ✓
- Ads tab shows composition bar ✓
- Settings screen has Plus upgrade card, AI toggle, links ✓
- Tab bar is visible and all 4 bottom tabs work ✓
- Scan button in dashboard header ✓

### What's Broken / Needs Improvement
- **Politics & Tone tabs show "AI Analysis Required" even though AI consent is ON** (Critical bug)
- **Suggested tab InsightHero text is invisible/faded on first load** (rendering glitch)
- 0% ads detected (likely legitimate for this feed, but detection may still need improvement)
- 86% suggested seems high — accuracy concern
- Bar chart in Sources tab shows "1" for every creator — no visual differentiation
- Content Types stacked bar at bottom of Overview gets cut off
- Plus banner is persistent and takes up prime real estate every visit
- Too much vertical whitespace between dashboard sections
- MetricCard numbers are still large relative to the card
- "Tap for more context" on InsightHero is easy to miss
- No visual cue that tabs are tappable (no chevron or expansion indicator)

---

## FINDINGS (200 Items)

### CRITICAL — App-Breaking Bugs

**C1. Politics & Tone tabs show "AI Required" even when AI consent is enabled**
- File: `app/(tabs)/index.tsx` lines 294-330
- The `PoliticsContent` and `ToneContent` components always show `AiRequiredCard` unconditionally
- They never check `userProfile.ai_analysis_consent` before displaying
- Fix: Check AI consent status and show actual AI analysis data when enabled, or show a "no AI data yet" state if consent is on but data hasn't been processed

**C2. Suggested tab InsightHero renders with invisible/faded text on first navigation**
- File: `app/(tabs)/index.tsx` — fade animation starts at opacity 0
- When switching to Suggested tab for the first time, the fadeAnim may not complete properly
- Fix: Ensure initial render doesn't start faded; only animate on subsequent tab switches

---

### HIGH PRIORITY — Major UX Issues

**H1. Dashboard has excessive vertical whitespace between all sections**
- Gap of 12px between cards is fine, but combined with large section headers and card padding, content is pushed way down
- Fix: Reduce SectionHeader marginTop, reduce gap in tab content containers

**H2. MetricCard value font still too large for mobile (28px)**
- The "14", "0%", "86%", "36%" numbers dominate the screen
- Fix: Reduce to 24px, add denominator context inline

**H3. Bar chart labels show "1" for every creator — no visual meaning**
- All creators have count 1, making the bar chart visually meaningless
- Fix: Show percentages instead of counts when all counts are equal or very low; add count labels on bars

**H4. "Tap for more context" on InsightHero is barely visible**
- Light blue text on light blue background, 13px font
- Fix: Make it a small pill/chip with better contrast

**H5. Content Types stacked bar lacks visual polish**
- Green segment for "Reel" (21%) is tiny and hard to read
- Fix: Add min-width for small segments, show labels below with colored dots

**H6. Plus banner appears every single time user visits dashboard**
- Takes ~80px of vertical space on every visit
- Fix: Add dismissibility (save dismissed state), or make it slimmer

**H7. Sources bar chart doesn't show percentage labels**
- Just shows bars with no numbers, making it hard to compare
- Fix: Add percentage text at end of each bar

**H8. AiRequiredCard uses red accent (#FEF2F2, #EF4444) which feels alarming**
- Violates UI/UX philosophy: "Do NOT use bright reds, warning yellows"
- Fix: Change to blue or neutral accent

**H9. Ads tab "0" BigNumber looks orphaned when no ads found**
- Just "0" and "ads in 14 posts" — needs contextual explanation
- Fix: Add encouraging text like "No sponsored content was detected in this scan"

**H10. Settings page — notification settings not persisted**
- Push notification toggle and frequency choice reset on app restart
- Fix: Save to Supabase user profile or AsyncStorage

**H11. Error handling is silent throughout the app**
- Database save failures, auth errors, scan errors all silently caught
- Fix: Add user-visible error toasts/banners

**H12. Scanner [platform].tsx swallows database save errors**
- User's scan can fail to save and they'd never know
- Fix: Show error alert if save fails

---

### MEDIUM PRIORITY — Visual & UX Polish

**M1–M5: Dashboard spacing reductions**
- M1: Reduce SectionHeader top margin from implicit to 4px
- M2: Reduce InsightHero bottom margin
- M3: Reduce gap between MetricCards from 10 to 8
- M4: Reduce padding in tab content area from 16 to 14
- M5: Reduce dashboard header bottom padding

**M6–M10: MetricCard improvements**
- M6: Value font 28→22px
- M7: Headline font weight from 600→500 for less visual competition
- M8: Add subtle colored left border based on metric type
- M9: "Total feed items captured" microline is redundant with "Posts scanned"
- M10: Side-by-side cards (Ads/Suggested) need equal height

**M11–M15: InsightHero improvements**
- M11: "Tap for more context" should be a styled pill button
- M12: Collapsed InsightHero should show a subtle down-chevron
- M13: Reduce InsightHero padding from 16 to 14
- M14: Insight text line-height too tight at 13px font
- M15: InsightHero border-left accent should be thicker (3→4px)

**M16–M20: Tab grid improvements**
- M16: Active tab should have subtle shadow for depth
- M17: Tab font size 12px is too small for comfortable tapping
- M18: Sparkle icons on Politics/Tone are 10px — too tiny
- M19: Tab grid gap of 6 is too tight
- M20: Second row tabs should align visually with first row

**M21–M25: Sources tab improvements**
- M21: Bar chart bars need percentage labels
- M22: First bar should be more visually prominent (darker blue)
- M23: "Source Concentration" BigNumber section needs better card treatment
- M24: Show "of your feed" next to concentration percentage
- M25: Truncate long creator handles with ellipsis

**M26–M30: Ads tab improvements**
- M26: 100% organic bar should use brand blue, not gray
- M27: "Ads 0" legend item shows "0" which is confusing
- M28: Add explanation card for 0-ad state
- M29: BigNumber "0" is too large for a zero-result
- M30: StackedBar100 needs better min-width handling for 0% segments

**M31–M35: Suggested tab improvements**
- M31: Purple accent (#8B5CF6) clashes with brand blue
- M32: Following/Suggested stacked bar labels overlap when percentages are small
- M33: Explanatory text card has no visual container (just floating text)
- M34: "Tap for more context" on Suggested InsightHero same issue as M11
- M35: Content origin section header subtitle is redundant

**M36–M40: Politics & Tone tab improvements**
- M36: Red accent on Politics InsightHero violates color philosophy
- M37: "AI Analysis Required" title is tech jargon — should be friendlier
- M38: "Go to Settings" button should be unnecessary if AI is already on
- M39: Politics/Tone insights should show placeholder data
- M40: When AI is on but no AI data yet, show "Processing" state

**M41–M45: Settings improvements**
- M41: "Upgrade to Plus" card text is hard to read (white on blue, small font)
- M42: "$96/year (save 20%)" text is very faint
- M43: "Start 2-Week Free Trial" button should have more visual weight
- M44: AI Analysis info text is too long — break into shorter paragraph
- M45: Section headers "AI ANALYSIS" etc use uppercase which feels cold

**M46–M50: Scan screen improvements**
- M46: Platform cards lack description text
- M47: No indication of which platforms have been scanned before
- M48: Cards could show a subtle arrow/chevron indicating they're tappable
- M49: "Log in and scroll..." instruction text should be more prominent
- M50: Platform grid gap should be larger for easier tapping

**M51–M55: History screen improvements**
- M51: History cards don't show content type breakdown
- M52: No search or filter for scan history
- M53: Empty state icon should be more distinctive
- M54: Relative time display doesn't update in real-time
- M55: History screen header should show date range

**M56–M60: Scanner/WebView improvements**
- M56: ScanOverlay timer creates unnecessary re-renders every second
- M57: WebView dedup logic is too aggressive with 2000ms window
- M58: Captured items count animation could be smoother
- M59: "Keep scrolling" CTA text could be more encouraging
- M60: No visual indicator of scan progress (e.g., filling circle)

**M61–M65: Login/Onboarding improvements**
- M61: No email validation before submission
- M62: Login form could auto-focus email field
- M63: Onboarding screens don't show current step indicator
- M64: "Get Started" CTA should have more visual weight
- M65: Magic link explanation could be clearer

**M66–M70: Platform script improvements**
- M66: Instagram capture delay (800ms) may miss fast-scrolling content
- M67: Twitter ad detection only has 2 signals (vs Instagram's 6)
- M68: YouTube detection misses YouTube Shorts ad labels
- M69: TikTok script doesn't block fullscreen video takeover
- M70: Facebook script doesn't block Reels/Stories takeover

**M71–M75: Cross-platform consistency**
- M71: Unify capture delays across all platforms (standardize to 500ms)
- M72: Add fullscreen blocking to ALL platform scripts, not just Instagram
- M73: Add scroll-based capture fallback to ALL platforms
- M74: Add banner/login-wall suppression to ALL platforms
- M75: Add MutationObserver debouncing to ALL platforms

---

### LOW PRIORITY — Code Quality & Polish

**L1–L10: Memory & Performance**
- L1: BarChart recreates Animated.Values on every render
- L2: StackedBar100 same issue as L1
- L3: Skeleton creates new Animated.Value on every render
- L4: ScanOverlay timer should use useRef instead of useState for tick
- L5: WebViewScanner handleWebViewMessage missing dependency array items
- L6: AuthContext has duplicate loading/isLoading properties
- L7: setInterval in platform scripts never cleaned up (WebView lifecycle)
- L8: InsightHero expanded state doesn't reset on tab switch
- L9: Dashboard re-renders all tab content when switching (could lazy-load)
- L10: computeDashboardData called synchronously on main thread

**L11–L20: Type Safety**
- L11: `(item as any).raw_data?.posts` in history.tsx — unsafe cast
- L12: Platform scripts use string interpolation for JS injection — no type checking
- L13: ScanDetail type doesn't include all raw_data fields
- L14: CONTENT_TYPE_LABELS map doesn't cover all possible types
- L15: PLATFORM_ICONS type assertion is loose
- L16: computeDashboardData has implicit any in several places
- L17: WebViewScanner message handler lacks message type validation
- L18: Theme PLATFORMS type doesn't match lucide icon names
- L19: Missing return type annotations on several functions
- L20: useLocalSearchParams generic type could be more precise

**L21–L30: Error Handling**
- L21: computeDashboardData silently falls back to aggregates
- L22: Auth errors in fetchOrCreateProfile silently caught
- L23: Supabase table-not-exists error silently swallowed
- L24: Platform script injection errors not caught
- L25: WebView load failure has no user-facing error
- L26: Image loading in onboarding not error-handled
- L27: Linking.openURL failures show generic "Could not open link"
- L28: No network connectivity check before scan
- L29: No timeout handling for long scans
- L30: No retry mechanism for failed Supabase queries

**L31–L40: Accessibility**
- L31: MetricCards lack accessibilityLabel
- L32: InsightHero "Tap for more context" needs accessibilityHint
- L33: Tab buttons lack accessibilityRole="tab"
- L34: Active tab should announce state change to screen reader
- L35: Bar chart bars lack accessibilityLabel for values
- L36: StackedBar100 segments need accessibility descriptions
- L37: Settings toggles need accessibilityLabel
- L38: Platform cards on scan screen need accessibilityHint
- L39: Color-only differentiation in charts (needs text labels)
- L40: Minimum touch target size not enforced (44pt)

**L41–L50: Microcopy & Epistemic Restraint**
- L41: "Your feed draws from many voices" — could be more specific
- L42: "No small group of creators dominates" — value judgment
- L43: "Commercial content is minimal" — sounds positive, should be neutral
- L44: "AI Analysis Required" — technical, should be "Enable AI insights"
- L45: "Total feed items captured" is redundant
- L46: "Typical range: 40–60%" — source not cited
- L47: "Led by @username" — implies hierarchy
- L48: "Organic vs. commercial content" — "organic" is loaded term
- L49: "Your top 3 sources accounted for X%" — should cite count, not "your"
- L50: Button "Done — Save Scan" could be clearer about what happens next

**L51–L60: Visual Polish**
- L51: Dashboard header "Your Dashboard" could be just platform name
- L52: Scan button in header is too small (12px font, 8px padding)
- L53: Tab content area bottom padding 40px is arbitrary
- L54: Loading spinner is generic — could show branded animation
- L55: Empty state illustration is just an icon in a circle
- L56: Card shadows are very subtle — may not be visible on all screens
- L57: Border radius inconsistency: some RADIUS.lg, some RADIUS.md
- L58: Color palette has some unused entries (brandTintBg, accentTintBg)
- L59: Typography scale has too many levels (heroTitle, h2, h3, body, bodySmall, label, labelBold, small, xsmall)
- L60: Section headers use a blue bar that's inconsistent with Oura-style design

**L61–L70: Platform Script Quality**
- L61: Instagram banner suppression timer is too aggressive early (2s)
- L62: Twitter script doesn't detect Twitter Blue "subscriber" labels
- L63: YouTube doesn't detect pre-roll ad indicators
- L64: TikTok creator handle extraction regex may miss some formats
- L65: Facebook suggested detection is basic (boolean flag, not position-aware)
- L66: Reddit doesn't detect "Promoted" label in new Reddit UI
- L67: All scripts use different observer threshold values
- L68: Instagram script at 432 lines is too long — should be modularized
- L69: No platform script tests or validation
- L70: Console.log statements left in production code in scripts

**L71–L80: Component Architecture**
- L71: Dashboard index.tsx at 627 lines is too long — extract tab content to separate files
- L72: Settings screen could use a SettingsStore/context
- L73: Theme could export component-specific style presets
- L74: No loading boundary/Suspense patterns used
- L75: No animation library — all manual Animated API usage
- L76: No gesture handling library for swipe between tabs
- L77: No analytics/tracking for user interactions
- L78: No crash reporting setup
- L79: No deep linking configuration
- L80: No app icon or splash screen customization

**L81–L90: Data & State Management**
- L81: No offline support — app is useless without network
- L82: No data caching — every visit re-fetches from Supabase
- L83: No optimistic updates for scan saves
- L84: No pagination for scan history (loads all 50 at once)
- L85: No data export functionality
- L86: Scan data not compressed before storage
- L87: No scan comparison feature (diff two scans)
- L88: Raw data stored as JSON blob — not queryable
- L89: No data retention policy
- L90: No rate limiting on scan frequency

---

## IMPLEMENTATION PLAN

### Phase 1: Critical Bugs (C1–C2)
### Phase 2: High Priority UX (H1–H12)
### Phase 3: Medium Priority Polish (M1–M75)
### Phase 4: Low Priority Code Quality (L1–L90)

Total: 179 actionable items (remaining 21 are architectural/future considerations)

---

## What's Working Well
- Clean component architecture
- Consistent design system (theme.ts)
- Good epistemic restraint in most dashboard language
- Secure auth implementation
- Comprehensive platform script coverage
- Good TypeScript coverage
