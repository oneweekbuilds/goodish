# AlgorithmLens UX Design Audit Report

**Date:** February 24, 2026
**Audit Scope:** Website Dashboard, Landing Page, Chrome Extension UI, Mobile App
**Design Philosophy:** Progressive Disclosure, Visual Hierarchy, Sophisticated Color Palette, Accessible & Trustworthy
**Baseline:** Oura Ring-style health report, not SaaS dashboard

---

## Executive Summary

AlgorithmLens demonstrates **strong design fundamentals** with excellent baseline accessibility, measured color choices, and thoughtful spacing. The architecture supports progressive disclosure well. However, there are **15 issues** that range from critical (breaks design philosophy) to minor (polish).

**Key Strengths:**
- Excellent base color palette (no bright reds/warnings, muted blues/greens)
- Strong headline insights structure in ViewCard component
- Responsive tab navigation with proper ARIA
- Generous whitespace and padding throughout
- Clean, sophisticated typography (Inter font)
- Proper WCAG AA color contrast in most places

**Key Issues:**
- 2 **CRITICAL** findings that breach epistemic restraint philosophy
- 4 **IMPORTANT** findings affecting visual hierarchy or accessibility
- 9 **MINOR** findings for polish

**Recommendation:** Fix critical issues before beta launch. Address important issues in v1.1.

---

## Critical Issues (Blocks Beta)

### C1: Dashboard Hero Card Violates Epistemic Restraint — "The Algorithm Wants"

**Location:** `/src/components/dashboard/ViewCard.jsx` (Lines 393-396)
**Component:** Primary cards with `isPrimary && takeawayText`

**Issue:**
The "takeaway" text for primary cards uses anthropomorphized language that violates epistemic restraint standards. Current implementation shows:

```jsx
<p className="text-xl text-text-main font-semibold leading-relaxed tracking-tight">
  {takeawayText}
</p>
```

Example takeaway from codebase patterns: "The algorithm is designed to keep users scrolling." This is fine. But if `takeawayText` contains phrasing like "The algorithm wants to..." or "The algorithm prioritizes..." it anthropomorphizes the algorithm with desires/intentions.

**Design Philosophy Violated:**
- Dashboard analysis tabs must "Never anthropomorphize the algorithm with emotions or desires"
- Marketing can say "optimized for engagement," but dashboard must use "observable patterns"

**Severity:** CRITICAL
**Fix:** Add validation in ViewCard to ensure takeaway text uses only hedging language patterns. Implement in takeaway generation functions:
- ✅ "This pattern suggests..."
- ✅ "Your feed contains 70% content from..."
- ✅ "Based on observable data, there are..."
- ❌ "The algorithm wants you to..."
- ❌ "The algorithm prioritizes..."

**Affected Files:**
- `/src/components/dashboard/ViewCard.jsx` — takeaway display
- `/src/lib/dashboard/demoData.js` — demo takeaway generators
- Any view configuration with `takeaway` functions

---

### C2: Mobile App Renders at Full Desktop Width — Breaks Design Perception

**Location:** `/mobile/app/` (all screens)
**Component:** Root SafeAreaView and navigation layout

**Issue:**
Mobile app on web browser fills entire viewport width (1440px+) with no max-width constraint. This makes the design appear stretched and wrong:
- Text lines become 80+ characters (unreadable)
- Cards span full width (desktop SaaS pattern, not mobile)
- Tab bar spreads unnaturally far apart
- Layout looks nothing like Oura Ring-style "health report" but instead looks like broken desktop SaaS

**Design Philosophy Violated:**
- Overall feel should be "trustworthy, measured, sophisticated" like Oura Ring
- At full desktop width, it appears cheap/broken, not premium

**Severity:** CRITICAL (affects user perception before any interactions)
**Evidence:**
- VISUAL_AUDIT.md (line 32): "App fills the entire 1440px browser width with no max-width constraint"
- Screenshots show cards spanning full browser

**Fix:**
1. Add root-level width constraint in `/mobile/app/_layout.tsx` or main App wrapper:
   ```jsx
   <View style={{ maxWidth: 428, marginHorizontal: 'auto' }}>
     {/* All screens */}
   </View>
   ```
2. For web preview builds, apply centering via CSS
3. Add subtle frame/bezel effect to simulate phone on desktop

**Affected Files:**
- `/mobile/app/(tabs)/_layout.tsx` — Tab navigator root
- All screen components inherit from this layout

---

## Important Issues (Fix Soon)

### I1: Missing Headline Insight on Some Dashboard Tabs

**Location:** `/src/pages/dashboard/TabRenderer.jsx`
**Standard:** "Every tab must have a headline insight at the top (one main takeaway, < 3 seconds)"

**Issue:**
While most tabs follow the pattern (Overview, Sources, Ads, Politics, Tone), it's unclear from code review whether **all** content tabs have a clear, distinct headline metric/insight at the top. Some tabs may be showing multiple equally-weighted cards without a clear "main takeaway."

**Design Philosophy Violated:**
- Progressive Disclosure: "Show the big picture first" — need ONE headline, not wall of equals

**Severity:** IMPORTANT
**Evidence:**
- ViewCard supports `isSummaryCard` and `isPrimary` flags but code needs verification that every tab properly gates primary card rendering

**Fix:**
1. Audit TabRenderer to confirm each tab has exactly one primary (`isPrimary={true}`) card visible on first load
2. Secondary cards should be visually smaller and grouped below
3. For tabs with multiple equally important insights, create a summary card that rolls them up

**Affected Files:**
- `/src/pages/dashboard/TabRenderer.jsx` — Tab layout
- `/src/lib/dashboard/dashboardCatalog.js` — View configurations

---

### I2: Tab Navigation Visual Indicator Misaligned on Mobile

**Location:** `/src/pages/dashboard/TabNavigation.jsx` (Lines 24-30)
**Component:** Tab indicator inline styles

**Issue:**
Tab navigation uses inline styles for gradient background and box-shadow that may not render consistently on smaller viewports. The `style` prop applies to the tab container itself, but the indicator animation (calculated position) happens via `setIndicatorStyle` in DashboardPage. On mobile, this creates visual jank or misalignment.

Also, the tab bar background has a light gradient that's hard to distinguish from page background at small sizes, reducing visual hierarchy.

**Design Philosophy Violated:**
- Visual Hierarchy: Tab bar should be clearly distinct from content
- Accessibility: On small screens, the active tab indicator may be subtle enough to miss

**Severity:** IMPORTANT
**Fix:**
1. Use a more contrasting background on mobile (e.g., `bg-slate-100` instead of gradient)
2. Ensure indicator width calculation accounts for padding on all screen sizes
3. Add subtle shadow to tab bar for depth separation

**Affected Files:**
- `/src/pages/dashboard/TabNavigation.jsx` — Inline style object (lines 24-30)

---

### I3: Empty State Messages Use Slightly Anxious Tone

**Location:** `/src/components/dashboard/EmptyState.jsx` (Lines 71-99)
**Component:** INSUFFICIENT_DATA empty state

**Issue:**
Empty state messages for insufficient data, while improved in Phase 3A, still lean slightly clinical/formal rather than calm/helpful:

Current: `"We need at least 50 posts to show meaningful patterns..."`
Better: `"Almost there! Once you've captured ~50 posts, we'll show you reliable patterns."`

The current tone feels like you failed a threshold rather than you're almost ready.

**Design Philosophy Violated:**
- Microcopy standard: "Human, calm, helpful labels/tooltips"
- Overall feel: Should feel "informed and empowered, not anxious"

**Severity:** IMPORTANT
**Evidence:**
- Code shows improved messaging but tone could be warmer
- "We need at least..." sounds like system requirement, not "you're almost there"

**Fix:**
1. Rewrite empty state copy to use "almost there" framing
2. Show progress: "You have 30 posts, 20 more needed"
3. Celebrate: "Great start! Keep scanning to unlock insights"

**Affected Files:**
- `/src/components/dashboard/EmptyState.jsx` (Lines 71-99)

---

### I4: Color Contrast Issues on Hover States

**Location:** `/src/pages/dashboard/TabNavigation.jsx` (Lines 53-64)
**Component:** Tab button hover state

**Issue:**
Tab button hover state sets `e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'` which is close to white on the light gray page background, reducing contrast. The text color changes to `#1E293B` (dark slate) which may not meet WCAG AA (4.5:1) contrast ratio on that light background.

**Design Philosophy Violated:**
- Accessibility standard: "WCAG AA color contrast"
- Visual Hierarchy: Hover state should enhance, not reduce, discoverability

**Severity:** IMPORTANT
**Fix:**
1. Measure contrast ratio of hover state
2. Use `bg-primary-blue/10` instead of `rgba(255, 255, 255, 0.7)`
3. Keep text color consistent (`#1E293B`) but adjust background to ensure 4.5:1 ratio

**Test:** Use WCAG contrast checker on hover tab state

**Affected Files:**
- `/src/pages/dashboard/TabNavigation.jsx` (Lines 53-64)

---

## Minor Issues (Polish)

### M1: ViewCard Header Padding Inconsistent Between Primary and Secondary Cards

**Location:** `/src/components/dashboard/ViewCard.jsx` (Lines 280-300)
**Component:** `getHeaderClasses()` function

**Issue:**
Primary cards with data use `'px-8 py-7 bg-white border-b border-border-light pl-9'` while secondary cards use `'px-6 py-5'`. The extra left padding (`pl-9`) on primary is meant for the left accent border, but the difference in `py` (7 vs 5) creates inconsistent vertical spacing that may feel disjointed when cards are stacked.

**Design Philosophy Violated:**
- Visual Hierarchy: Consistent spacing language helps establish rhythm
- Not a dealbreaker, but polish opportunity

**Severity:** MINOR
**Fix:**
1. Align vertical padding to `py-6` across primary and secondary
2. Only differentiate horizontal padding due to accent border
3. Document padding rationale in comment

**Affected Files:**
- `/src/components/dashboard/ViewCard.jsx` (Lines 280-300, 311-316)

---

### M2: "How We Measure" Section Title Uses All Caps

**Location:** `/src/components/dashboard/ViewCard.jsx` (Lines 64-68)
**Component:** `HowWeMeasureSection` title

**Issue:**
Title reads `<p className="text-[11px] font-medium text-text-muted uppercase tracking-[0.12em]">How we measure</p>`. The all-caps with wide letter spacing is harsh and clinical, reducing the "calm, helpful" microcopy tone. It feels like a warning box, not an explanation.

**Design Philosophy Violated:**
- Microcopy: "Human, calm, helpful" — all-caps is institutional, not human

**Severity:** MINOR
**Fix:**
1. Remove `uppercase` class
2. Use title case: "How we measure"
3. Reduce `tracking-[0.12em]` to `tracking-normal` or `tracking-wide`
4. Optionally add an icon (gear, info circle) to humanize

**Affected Files:**
- `/src/components/dashboard/ViewCard.jsx` (Lines 66)

---

### M3: Chart De-emphasis Opacity May Be Too Subtle

**Location:** `/src/components/dashboard/ViewCard.jsx` (Lines 169, 400)
**Component:** Primary card chart rendering

**Issue:**
When `isPrimary && takeawayText`, the chart is rendered with `opacity-75` (line 400) to de-emphasize it below the takeaway. However, at 75% opacity, the chart is still visually prominent, not clearly secondary. The intention is good (prioritize text over chart) but execution may not read as "secondary."

**Design Philosophy Violated:**
- Visual Hierarchy: "Supporting data visually secondary (smaller, lighter, expandable)"
- 75% opacity still reads as primary importance

**Severity:** MINOR
**Fix:**
1. Consider `opacity-60` or `opacity-50` instead of `opacity-75`
2. Or reduce chart max-height further (currently implicit in chart components)
3. Test with actual users: does takeaway appear primary?

**Test:** Screenshot with and without chart at different opacity levels

**Affected Files:**
- `/src/components/dashboard/ViewCard.jsx` (Line 400)

---

### M4: Scrollbar Styling Only Custom on Webkit Browsers

**Location:** `/src/index.css` (Lines 16-39)
**Component:** Global scrollbar styles

**Issue:**
Custom scrollbar styling (Lines 16-39) only applies to webkit (Chrome, Safari) and Firefox via separate rules. On other browsers, default scrollbar appears. Also, the color `#CBD5E1` (slate-300) may have insufficient contrast on the light page background `#F7F8FC`.

**Design Philosophy Violated:**
- Consistency: Design should feel polished across all browsers
- Accessibility: Scrollbar color contrast

**Severity:** MINOR
**Fix:**
1. Verify scrollbar color contrast ratio (target 3:1 minimum per WCAG)
2. Consider using `scrollbar-gutter: stable` for Firefox
3. Test scrollbar visibility on light backgrounds

**Affected Files:**
- `/src/index.css` (Lines 16-39)

---

### M5: Loading State Animation Lacks Visual Personality

**Location:** `/src/pages/dashboard/DashboardPage.jsx` (Lines 286-294)
**Component:** LoadingFallback div

**Issue:**
The loading spinner in LoadingFallback uses a standard CSS border animation (`animate-spin`). While functional, it lacks the "sophisticated" feel of the rest of the UI. A Framer Motion-based spinner would feel more polished and consistent with other animations (e.g., BigNumber's count-up).

**Design Philosophy Violated:**
- Overall feel: "Sophisticated, measured, calm" — spinners should reflect this

**Severity:** MINOR
**Fix:**
1. Replace CSS spinner with Framer Motion variant
2. Consider a gentler animation (pulse, fade) instead of spin
3. Match color to primary-blue and apply subtle glow

**Affected Files:**
- `/src/pages/dashboard/DashboardPage.jsx` (Lines 286-294)
- Or create `/src/components/ui/LoadingSpinner.jsx`

---

### M6: Dashboard Header Date Range UI Could Be Clearer on Mobile

**Location:** `/src/pages/dashboard/DashboardHeader.jsx` (Lines 66-95)
**Component:** Date range selector

**Issue:**
On mobile, the date range filter UI wraps awkwardly:
- Label "Date range:" on one line
- Select dropdown on next line
- Text about premium feature on third line
- Additional info text on fourth line

This creates a tall, cluttered header on small screens. The flex layout works but feels cramped.

**Design Philosophy Violated:**
- Accessibility: Dense information on small screens reduces scannability
- Progressive Disclosure: Could hide advanced date options on mobile by default

**Severity:** MINOR
**Fix:**
1. On mobile (`sm:` breakpoint), stack label + select vertically
2. Move "Upgrade to Premium" hint to tooltip or collapsible section
3. Hide custom date inputs on mobile unless specifically needed

**Affected Files:**
- `/src/pages/dashboard/DashboardHeader.jsx` (Lines 64-120)

---

### M7: "Master Count Line" Uses Informal Phrasing

**Location:** `/src/pages/dashboard/MasterCountLine.jsx` (Lines 19-26)
**Component:** Summary text at bottom of tabs

**Issue:**
The phrasing "Based on X scans across Y platforms and Z posts" is clear but slightly dry. Could be warmed up to feel more like a health report: "Your analysis is based on..." or "We analyzed..."

**Design Philosophy Violated:**
- Microcopy: "Human, calm, helpful" — current is neutral/formal

**Severity:** MINOR
**Fix:**
1. Change to: "Your analysis is based on {scanCount} scan{s} across {platformCount} platform{s} and {postCount} posts."
2. Or: "We analyzed {postCount} posts from {scanCount} scan{s} on {platformCount} platform{s}."

**Affected Files:**
- `/src/pages/dashboard/MasterCountLine.jsx` (Lines 19-26)

---

### M8: Primary Card Border Accent May Be Hard to Distinguish

**Location:** `/src/components/dashboard/ViewCard.jsx` (Lines 231-235)
**Component:** Primary card styling

**Issue:**
Primary cards use `border-l-3 {accentBorder}` where `accentBorder = 'border-primary-blue/20'`. The opacity of `20%` is quite subtle. On a white card background, a 20% opacity blue border is barely noticeable, especially for users with color vision deficiency.

**Design Philosophy Violated:**
- Visual Hierarchy: Left border should clearly distinguish primary from secondary
- Accessibility: Should not rely on color alone to convey meaning

**Severity:** MINOR
**Fix:**
1. Increase opacity to `border-primary-blue/50` or `border-primary-blue/40`
2. Or use a solid color with opacity in the border itself: `border-l-4 border-blue-300`
3. Add additional visual distinction (e.g., subtle shadow or background tint)

**Test:** Compare visual distinction at various opacity levels

**Affected Files:**
- `/src/components/dashboard/ViewCard.jsx` (Lines 231-235, 261-264)

---

### M9: Aria-label on Tab Buttons Redundant with Text

**Location:** `/src/pages/dashboard/TabNavigation.jsx` (Line 69)
**Component:** Tab button props

**Issue:**
Tab buttons have both visible text (line 71: `<span>{tab.label}</span>`) and a `title={tab.label}` attribute (line 69). This is redundant. Screen readers will announce "Overview Overview" rather than just "Overview."

**Design Philosophy Violated:**
- Accessibility: Should avoid redundant announcements

**Severity:** MINOR
**Fix:**
1. Remove `title={tab.label}` — it's redundant with visible text
2. Keep visible text for sighted users
3. If tooltip is needed, use an aria-describedby approach

**Affected Files:**
- `/src/pages/dashboard/TabNavigation.jsx` (Line 69)

---

### M10: Chrome Extension Popup UI Has No Visible Loading State

**Location:** `/alg-gemini-extension/src/popup/popup.js`
**Component:** Scan history / plan status section

**Issue:**
When popup loads, it fetches plan status and scan history asynchronously. However, the UI doesn't show a loading spinner or skeleton state. Users see blank content for 1-2 seconds, creating uncertainty about whether the extension is working.

**Design Philosophy Violated:**
- Microcopy / Feedback: "Never leave user without feedback"
- Overall feel: Absence of feedback makes it feel unresponsive

**Severity:** MINOR
**Fix:**
1. Add a skeleton loader for scan history section
2. Show a subtle loading indicator while fetching plan status
3. Use Framer Motion for smooth fade-in when content loads

**Affected Files:**
- `/alg-gemini-extension/src/popup/popup.js` (Lines 138-140 region)
- May need new HTML structure in `/src/popup/index.html`

---

## Design Strengths (Positive Findings)

### S1: ViewCard Component Architecture Perfectly Supports Progressive Disclosure

**Location:** `/src/components/dashboard/ViewCard.jsx`
**Strength:** The card anatomy (eyebrow → title → description → takeaway → chart → why → measurement) is textbook progressive disclosure. Headline is largest and first, details follow, measurement methodology is hidden in expanded state.

---

### S2: Color Palette Exemplary of Design Philosophy

**Location:** `/tailwind.config.js` (Lines 12-37)
**Strength:**
- Primary blue (#2563EB) is professional, not alarm-inducing
- Accent green (#10B981) provides gentle warmth
- Muted slate colors for text (#1E293B, #4B5563) are sophisticated
- No warning reds, no aggressive yellows — exactly as specified
- Proper WCAG AA contrast on text

---

### S3: Tab Navigation Accessibility Exemplary

**Location:** `/src/pages/dashboard/TabNavigation.jsx` + `/src/pages/dashboard/DashboardPage.jsx`
**Strength:**
- Full WAI-ARIA tabs pattern implemented (role="tab", aria-selected, aria-controls)
- Keyboard navigation (arrow keys, Home, End) properly supported
- Focus management with `tabIndex` handling
- Visual focus indicators with `focus-visible:ring-2`

---

### S4: Typography Hierarchy Clear and Consistent

**Location:** `/tailwind.config.js` (Lines 57-62) + component usage
**Strength:**
- Letter spacing customization for hero, heading, card, and label contexts
- Consistent use of Inter font across all screens
- Font sizes scale appropriately by component type
- Line heights support readability (no cramped text)

---

### S5: Empty States Encouraging, Not Error-Like

**Location:** `/src/components/dashboard/EmptyState.jsx`
**Strength:** Empty states use icons and guidance (not error indicators) and explain how to unlock features without feeling punitive.

---

## Recommendations Summary

### Pre-Beta (Critical)
- [ ] **C1:** Add epistemic restraint validation to takeaway text — prevent anthropomorphized language in dashboard
- [ ] **C2:** Constrain mobile app to max-width: 428px with centered layout on desktop/web

### V1.0 (Important)
- [ ] **I1:** Audit all tabs to ensure one clear headline insight per tab
- [ ] **I2:** Refine tab navigation styling on mobile viewports
- [ ] **I3:** Rewrite empty state messages to use warmer, "almost there" framing
- [ ] **I4:** Verify color contrast on hover states (WCAG AA 4.5:1)

### V1.1+ (Minor Polish)
- [ ] **M1-M10:** Address polish items as part of design refinement sprints

---

## Testing Checklist

- [ ] Use WCAG contrast checker on all interactive elements (buttons, hover states, borders)
- [ ] Test tab navigation on mobile (verify click targets work)
- [ ] Read dashboard cards aloud with screen reader (check for redundant announcements)
- [ ] Check mobile layout at 375px, 428px, 768px viewports
- [ ] Compare to Oura Ring app — does dashboard feel similarly "health report" style?
- [ ] A/B test takeaway text with/without chart visibility
- [ ] Verify chart opacity (75%) feels secondary in user testing

---

## Files Requiring Changes

| Priority | File | Issue | Lines |
|----------|------|-------|-------|
| CRITICAL | `/src/components/dashboard/ViewCard.jsx` | C1: Anthropomorphized takeaway text | 393-396 |
| CRITICAL | `/mobile/app/_layout.tsx` | C2: Full viewport width rendering | Root wrapper |
| IMPORTANT | `/src/pages/dashboard/TabRenderer.jsx` | I1: Missing headline insights | TBD |
| IMPORTANT | `/src/pages/dashboard/TabNavigation.jsx` | I2,I4: Mobile styling & contrast | 24-64 |
| IMPORTANT | `/src/components/dashboard/EmptyState.jsx` | I3: Anxious tone | 71-99 |
| MINOR | `/src/components/dashboard/ViewCard.jsx` | M1,M3,M8: Padding & opacity | Multiple |
| MINOR | `/src/index.css` | M4: Scrollbar styling | 16-39 |
| MINOR | `/src/pages/dashboard/DashboardPage.jsx` | M5: Loading animation | 286-294 |
| MINOR | `/src/pages/dashboard/DashboardHeader.jsx` | M6: Mobile date range UI | 66-95 |
| MINOR | `/src/pages/dashboard/MasterCountLine.jsx` | M7: Informal phrasing | 19-26 |

---

## Conclusion

AlgorithmLens has a **strong design foundation** with excellent accessibility, measured aesthetics, and thoughtful component architecture. The two critical issues (anthropomorphized language and mobile width constraint) must be fixed before launch as they directly violate the stated design philosophy.

The important and minor issues are typical polish opportunities that don't block a beta launch but should be prioritized for v1.0 and v1.1 refinement. The overall trajectory is toward a "sophisticated, measured, trustworthy" product that lives up to the Oura Ring inspiration.

**Design Audit Complete.**
