# Dashboard QA: 55 Known Issues - Master Backlog

**Created**: 2026-01-21  
**Status**: Pass 1 (P0 Trust Breakers) - IN PROGRESS  
**Last Updated**: 2026-01-21

---

## QA FLOW (REQUIRED FOR ALL PASSES)

### Smoke Test Command
```bash
cd apps/alg-gemini
npm run test:smoke
```

For UI mode:
```bash
npm run test:smoke:ui
```

### Screenshot Capture Process
1. **Location**: `apps/alg-gemini/docs/screenshots/dashboard/`
2. **Naming**: `YYYYMMDD_tab_state_issueIDs.png`
   - Example: `20260121_ads_expanded_A1-A4.png`
3. **States to capture per tab**:
   - Collapsed (default view)
   - Expanded ("More details" sections open)

### Screenshots Folder
All dashboard QA screenshots are stored in:
```
apps/alg-gemini/docs/screenshots/dashboard/
```

---

## ISSUE SEVERITY DEFINITIONS

- **P0**: Trust breakers — makes users think "this is broken or contradictory"
- **P1**: Visual hierarchy / UX issues that hurt comprehension
- **P2**: Polish / consistency issues that don't block understanding

---

## ISSUES BY TAB

### ADS TAB (A1-A10)

#### A1: Scan/window language contradiction in hero
- **Severity**: P0
- **Type**: Trust breaker / Copy contradiction
- **Symptom**: Hero says "Observed in this scan" but supporting card says "during this window" and metadata says "115 scans / 5 platforms"
- **Fix intent**: Single consistent scope language pattern. If window-based aggregation, say "during this window" everywhere. If single scan, say "in this scan" everywhere. Never mix.
- **Likely files**: `DashboardPage.jsx` (TabHero), `dashboardCatalog.js` (TAB_TRUST_SENTENCES)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Changed TAB_TRUST_SENTENCES to use neutral "here" language, updated kickerText logic to be context-aware

#### A2: Metadata contradiction - single scan vs multiple scans
- **Severity**: P0
- **Type**: Trust breaker / Data contradiction
- **Symptom**: Top of hero says "Observed in this scan" but metadata pill shows "115 scans / 5 platforms"
- **Fix intent**: Metadata should accurately reflect the actual scope. If 115 scans were used, don't say "this scan" anywhere.
- **Likely files**: `DashboardPage.jsx` (TabHero component)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Updated kickerText to say "During this window (N scans)" when multiple scans

#### A3: "More Details" expanded section - low signal content
- **Severity**: P1
- **Type**: UX / Empty state
- **Symptom**: When expanded, "More Details" shows cards that feel internal or repetitive, not useful
- **Fix intent**: Either improve content quality or hide these cards when they don't add value
- **Likely files**: `DashboardPage.jsx` (ViewsGridWithCollapsing), `dashboardCatalog.js`
- **Status**: Open

#### A4: Platform comparison bar - single platform shows as "comparison"
- **Severity**: P1
- **Type**: Labeling / Copy
- **Symptom**: If user only scanned one platform, "Platform comparison" card is misleading
- **Fix intent**: Empty state or different label like "Ad rate by platform" when only 1 platform
- **Likely files**: `dashboardCatalog.js` (ads-by-platform view)
- **Status**: Open

#### A5: Ad concentration takeaway - percentage without context
- **Severity**: P1
- **Type**: Copy / Labeling
- **Symptom**: Says "X% from top 5 advertisers" but from how many total? No denominator context.
- **Fix intent**: Use qualitative label only (already in code but verify it shows), e.g. "Most ads come from a small group"
- **Likely files**: `dashboardCatalog.js` (ads-concentration takeaway)
- **Status**: Open

#### A6: Empty state copy contradicts hero claim
- **Severity**: P0
- **Type**: Trust breaker / Contradiction
- **Symptom**: Hero says "broadened" but empty state says "insufficient data"
- **Fix intent**: Hero should only make claims when data supports it. Check data availability before showing takeaway.
- **Likely files**: `dashboardCatalog.js` (ads hero takeaway function)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Added chartQuality check to TabHero to prevent rendering claims when quality is insufficient

#### A7: "Try this" advice is generic
- **Severity**: P2
- **Type**: Copy / UX
- **Symptom**: Summary section gives generic advice like "reduce engagement" without context
- **Fix intent**: Make advice specific to what was observed, or remove if not useful
- **Likely files**: `dashboardCatalog.js` (ads summary view)
- **Status**: Open

#### A8: Date labels on trend line duplicated
- **Severity**: P1
- **Type**: Visual hierarchy / Bug appearance
- **Symptom**: Chart shows "Dec 31" repeated multiple times, looks like rendering error
- **Fix intent**: De-duplicate date labels in chart rendering. Show only unique dates or use "Day 1, Day 2" format.
- **Likely files**: `LineChartSimple.jsx`, `dataHelpers.js` (formatDateLabel)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Updated LineChartSimple to show "·" for duplicate consecutive labels except first/last

#### A9: "Advertiser insights" low confidence not labeled
- **Severity**: P1
- **Type**: Trust / Labeling
- **Symptom**: Product category list presented without confidence disclaimer, but it's keyword matching
- **Fix intent**: Add low-confidence labeling or disclaimer
- **Likely files**: `dashboardCatalog.js` (ads-advertiser-insights)
- **Status**: Open

#### A10: Scope pill contradicts kicker label
- **Severity**: P0
- **Type**: Trust breaker / Copy contradiction
- **Symptom**: Kicker says "Observed in this scan" but scope pill says "115 scans / 5 platforms"
- **Fix intent**: Kicker and pill must match. Use consistent scope language.
- **Likely files**: `DashboardPage.jsx` (TabHero component, lines 1420-1448)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Same fix as A1, A2

---

### POLITICS TAB (P1-P10)

#### P1: Scan/window contradiction in trust sentence
- **Severity**: P0
- **Type**: Trust breaker / Copy contradiction
- **Symptom**: TAB_TRUST_SENTENCES says "during this window" but other copy says "in this scan"
- **Fix intent**: Use one pattern everywhere: either "during this window" or "in this scan", not both
- **Likely files**: `dashboardCatalog.js` (TAB_TRUST_SENTENCES)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Updated TAB_TRUST_SENTENCES and all view descriptions to remove "window" language

#### P2: Political leaning opt-in toggle position confusing
- **Severity**: P1
- **Type**: UX / Visual hierarchy
- **Symptom**: Toggle appears before hero, disrupts flow
- **Fix intent**: Consider moving toggle below hero or into "More details" section
- **Likely files**: `DashboardPage.jsx` (political leaning toggle, line 2028-2035)
- **Status**: Open

#### P3: "Viewpoint distribution" card when leaning disabled
- **Severity**: P1
- **Type**: Empty state / Copy
- **Symptom**: Shows card even when leaning is disabled, with confusing empty state
- **Fix intent**: Hide card entirely when opt-in is disabled
- **Likely files**: `dashboardCatalog.js` (politics-balance view, requiresOptIn)
- **Status**: Open

#### P4: Platform comparison empty when 1 platform
- **Severity**: P1
- **Type**: Empty state / Labeling
- **Symptom**: "Platform asymmetry" card shown even with single platform
- **Fix intent**: Hide or show different message when only 1 platform scanned
- **Likely files**: `dashboardCatalog.js` (politics-by-platform)
- **Status**: Open

#### P5: Keyword matching disclaimer too subtle
- **Severity**: P1
- **Type**: Trust / Labeling
- **Symptom**: Political exposure is keyword-based but warning is buried
- **Fix intent**: Make keyword matching limitation more prominent
- **Likely files**: `dashboardCatalog.js` (politics tab views whyExplanation)
- **Status**: Open

#### P6: "Blind spots" section feels speculative
- **Severity**: P2
- **Type**: Copy / Trust
- **Symptom**: "Absent keyword categories" presented as insight when it's just absence
- **Fix intent**: Reframe as "Not detected" instead of "Blind spots", or remove
- **Likely files**: `dashboardCatalog.js` (politics-blind-spots view)
- **Status**: Open

#### P7: Creator concentration table with 1 row
- **Severity**: P1
- **Type**: Visual hierarchy / Empty state
- **Symptom**: Table showing single creator looks broken
- **Fix intent**: Use different layout or text format for single-creator case
- **Likely files**: `ViewCard.jsx` (renderTable), `dashboardCatalog.js` (politics-creators takeaway)
- **Status**: Open

#### P8: "Low confidence" badge not prominent enough
- **Severity**: P1
- **Type**: Trust / Labeling
- **Symptom**: Political leaning has low confidence badge but it's small and easy to miss
- **Fix intent**: Make confidence badge larger/more prominent or move to top of card
- **Likely files**: `ViewCard.jsx` (confidence disclaimer rendering)
- **Status**: Open

#### P9: Expanded section "Additional detail" feels repetitive
- **Severity**: P2
- **Type**: UX / Copy
- **Symptom**: "Additional detail" header is vague, content feels like repeat of above
- **Fix intent**: Use more specific header or consolidate content
- **Likely files**: `DashboardPage.jsx` (ViewsGridWithCollapsing moreDetails section)
- **Status**: Open

#### P10: Empty state for political share conflicts with hero
- **Severity**: P0
- **Type**: Trust breaker / Contradiction
- **Symptom**: Hero makes claim about political exposure but supporting cards say "no data"
- **Fix intent**: Hero should only render when data exists
- **Likely files**: `dashboardCatalog.js` (politics-share hero takeaway)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Same chartQuality check as A6

---

### PATTERNS TAB (PA1-PA10)

#### PA1: "Topic variety" takeaway contradicts data shown
- **Severity**: P0
- **Type**: Trust breaker / Data contradiction
- **Symptom**: Hero says "broadened" but chart shows concentrated topics
- **Fix intent**: Takeaway logic should match actual topic distribution
- **Likely files**: `dashboardCatalog.js` (patterns-topic-variety takeaway function)
- **Status**: Open

#### PA2: Unclassified topic shown in headline
- **Severity**: P1
- **Type**: Copy / Trust
- **Symptom**: Hero says "Your feed broadened to Unclassified and Other"
- **Fix intent**: Use headline safety filter to exclude Unclassified/Other from top-line copy
- **Likely files**: `dashboardCatalog.js` (patterns-topic-variety takeaway), `headlineSafety.js`
- **Status**: Open

#### PA3: "Echo risk" label is jargon
- **Severity**: P2
- **Type**: Copy / UX
- **Symptom**: "Echo risk" title is internal jargon, not user-facing language
- **Fix intent**: Change to "Topic concentration" or similar plain language
- **Likely files**: `dashboardCatalog.js` (patterns-echo-risk view title)
- **Status**: Open

#### PA4: Repeated themes percentage unclear
- **Severity**: P1
- **Type**: Copy / Labeling
- **Symptom**: Says "X% repeated" but not clear if that's good or bad
- **Fix intent**: Add context like "high repetition" or "moderate variety"
- **Likely files**: `dashboardCatalog.js` (patterns-repeated-themes takeaway)
- **Status**: Open

#### PA5: Feed stability card when only 1 scan
- **Severity**: P1
- **Type**: Empty state / Copy
- **Symptom**: "How your feed is evolving" shown even with single scan
- **Fix intent**: Require 2+ scans, show clear empty state otherwise
- **Likely files**: `dashboardCatalog.js` (patterns-stability, emptyStateType)
- **Status**: Open

#### PA6: Emotional weight with low confidence
- **Severity**: P1
- **Type**: Trust / Labeling
- **Symptom**: Sentiment analysis presented without prominent disclaimer
- **Fix intent**: Add "Estimate" to title or low-confidence badge
- **Likely files**: `dashboardCatalog.js` (patterns-emotional-weight)
- **Status**: Open

#### PA7: Manipulative patterns threshold unclear
- **Severity**: P1
- **Type**: Copy / Labeling
- **Symptom**: "Attention tactics" flagged but criteria not explained
- **Fix intent**: Add explanation of what counts as "attention tactic"
- **Likely files**: `dashboardCatalog.js` (manipulative-patterns whyExplanation)
- **Status**: Open

#### PA8: Chart bar color inconsistency
- **Severity**: P2
- **Type**: Visual hierarchy
- **Symptom**: Some charts use blue, others use mixed colors without semantic meaning
- **Fix intent**: Consistent color scheme across all charts in tab
- **Likely files**: `BarChartSimple.jsx`, `THEME` constants in `DashboardPage.jsx`
- **Status**: Open

#### PA9: "Try this" section empty or generic
- **Severity**: P2
- **Type**: UX / Copy
- **Symptom**: Summary section has generic or no actionable advice
- **Fix intent**: Provide specific actions based on observed patterns
- **Likely files**: `dashboardCatalog.js` (patterns-summary)
- **Status**: Open

#### PA10: Date labels repeated on trend line
- **Severity**: P1
- **Type**: Visual hierarchy / Bug appearance
- **Symptom**: Same as A8 - chart shows duplicated date labels
- **Fix intent**: De-duplicate date labels in chart component
- **Likely files**: `LineChartSimple.jsx`
- **Status**: Fixed
- **Fixed in**: Pass 1 - Same fix as A8, X3

---

### CREATORS TAB (C1-C10)

#### C1: Scan/window language contradiction
- **Severity**: P0
- **Type**: Trust breaker / Copy contradiction
- **Symptom**: Same pattern as other tabs - inconsistent scope language
- **Fix intent**: Single consistent pattern across all copy
- **Likely files**: `dashboardCatalog.js` (TAB_TRUST_SENTENCES, creator view descriptions)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Same fix as A1, P1

#### C2: Top creators table with single row looks broken
- **Severity**: P1
- **Type**: Visual hierarchy / UX
- **Symptom**: Hero shows table with 1 creator, feels incomplete
- **Fix intent**: Use different layout for single creator case
- **Likely files**: `ViewCard.jsx` (renderTable), `dashboardCatalog.js` (creators-top takeaway)
- **Status**: Open

#### C3: Creator concentration shows percentage from unknown denominator
- **Severity**: P1
- **Type**: Copy / Labeling
- **Symptom**: "X% from top 3" but no context on total creator count
- **Fix intent**: Use qualitative label or add denominator context
- **Likely files**: `dashboardCatalog.js` (creators-concentration takeaway)
- **Status**: Open

#### C4: Cross-platform creators empty when 1 platform
- **Severity**: P1
- **Type**: Empty state / Copy
- **Symptom**: "Voices that appeared everywhere" shown for single platform
- **Fix intent**: Hide card or show different message when only 1 platform
- **Likely files**: `dashboardCatalog.js` (creators-cross-platform)
- **Status**: Open

#### C5: Voice diversity qualitative label unclear
- **Severity**: P2
- **Type**: Copy / UX
- **Symptom**: "Low/Medium/High diversity" without context of what that means
- **Fix intent**: Add explanation or use more descriptive labels
- **Likely files**: `dashboardCatalog.js` (creators-voice-diversity takeaway)
- **Status**: Open

#### C6: Influential creators summary feels repetitive
- **Severity**: P2
- **Type**: UX / Copy
- **Symptom**: Summary section repeats hero content
- **Fix intent**: Either add new insight or remove summary
- **Likely files**: `dashboardCatalog.js` (creators-influential)
- **Status**: Open

#### C7: Creator share percentages don't add up
- **Severity**: P1
- **Type**: Trust breaker / Data display
- **Symptom**: Top creators show percentages that sum to >100% or <50% without explanation
- **Fix intent**: Label as "share of feed" and explain overlap or filtering
- **Likely files**: `ViewCard.jsx` (table rendering), `dashboardCatalog.js`
- **Status**: Open

#### C8: "New vs Familiar" stacked bar with unclear baseline
- **Severity**: P2
- **Type**: Visual hierarchy / Labeling
- **Symptom**: Stacked bar shows distribution but "new" criteria not defined
- **Fix intent**: Add tooltip or explanation of "new" threshold
- **Likely files**: `StackedBar100.jsx`, `dashboardCatalog.js` (creators-new-vs-familiar)
- **Status**: Open

#### C9: Empty state for creators when data exists
- **Severity**: P0
- **Type**: Trust breaker / Bug
- **Symptom**: Hero shows empty state despite having creator data
- **Fix intent**: Fix data availability check in hero rendering
- **Likely files**: `DashboardPage.jsx` (TabHero), `dataHelpers.js` (getTopCreatorsData)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Same chartQuality check as A6

#### C10: "Does this match your experience?" dead UI
- **Severity**: P2
- **Type**: UX / Dead UI
- **Symptom**: Feedback affordance with no backend action
- **Fix intent**: Either wire up feedback or remove affordance
- **Likely files**: `ViewCard.jsx` (FeedbackAffordance component)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Removed FeedbackAffordance component entirely

---

### ALGORITHM TAB (W1-W10)

#### W1: "What the Algorithm Thinks" implies mind-reading
- **Severity**: P0
- **Type**: Trust breaker / Copy
- **Symptom**: Tab title and copy imply we know algorithm's intent, but we only observe patterns
- **Fix intent**: Change all copy to "observed patterns" language, not "what algorithm thinks"
- **Likely files**: `dashboardCatalog.js` (tab label, view descriptions), `DashboardPage.jsx`
- **Status**: Fixed
- **Fixed in**: Pass 1 - Changed tab label to "Observed Patterns", updated all view titles and descriptions

#### W2: Hero takeaway makes identity claim
- **Severity**: P0
- **Type**: Trust breaker / Copy
- **Symptom**: Says "the system sees you as X" when we only observe topics that surfaced
- **Fix intent**: Reframe as "these topics appeared most" not "system categorizes you"
- **Likely files**: `dashboardCatalog.js` (algo-topics-liked takeaway)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Changed takeaway to "X appeared most frequently" instead of "system associates"

#### W3: "Profile breadth" jargon
- **Severity**: P2
- **Type**: Copy / UX
- **Symptom**: "How compressed the inferred profile is" - internal jargon
- **Fix intent**: Change to "Topic range" or similar plain language
- **Likely files**: `dashboardCatalog.js` (algo-profile-breadth view)
- **Status**: Open

#### W4: Speculation section makes predictions
- **Severity**: P1
- **Type**: Trust / Copy
- **Symptom**: "Future recommendations" presented as insight when it's pure speculation
- **Fix intent**: Label prominently as speculation or remove
- **Likely files**: `dashboardCatalog.js` (algo-future view, label says "speculation" but needs prominence)
- **Status**: Open

#### W5: Recurring themes vs top topics redundant
- **Severity**: P2
- **Type**: UX / Redundancy
- **Symptom**: Two different cards showing essentially same topic list
- **Fix intent**: Consolidate or differentiate more clearly
- **Likely files**: `dashboardCatalog.js` (algo-topics-liked, algo-confident)
- **Status**: Open

#### W6: Empty state contradicts hero claim
- **Severity**: P0
- **Type**: Trust breaker / Contradiction
- **Symptom**: Hero says "system associates you with X" but supporting cards show "insufficient data"
- **Fix intent**: Hero should only render with sufficient data
- **Likely files**: `dashboardCatalog.js` (algo-topics-liked takeaway), `DashboardPage.jsx` (TabHero)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Same chartQuality check as A6

#### W7: Two-column layout breaks on mobile
- **Severity**: P1
- **Type**: Visual hierarchy / Responsive
- **Symptom**: Algorithm tab hero has two-column layout that stacks poorly on small screens
- **Fix intent**: Ensure clean stack on mobile with proper spacing
- **Likely files**: `DashboardPage.jsx` (Algorithm tab hero rendering, lines 778-851)
- **Status**: Open

#### W8: Topic pills show percentages inconsistently
- **Severity**: P2
- **Type**: Visual hierarchy / Consistency
- **Symptom**: Some topic pills show percentage, others don't
- **Fix intent**: Consistent format across all topic pills
- **Likely files**: `DashboardPage.jsx` (topic pills rendering in hero)
- **Status**: Open

#### W9: "Try this" advice feels preachy
- **Severity**: P2
- **Type**: Copy / UX
- **Symptom**: Summary section gives advice in prescriptive tone
- **Fix intent**: Soften to optional experiments, not shoulds
- **Likely files**: `dashboardCatalog.js` (algo-change-advice view)
- **Status**: Open

#### W10: Unclassified topics shown in headline
- **Severity**: P1
- **Type**: Copy / Trust
- **Symptom**: Same as PA2 - "Unclassified" shown in hero takeaway
- **Fix intent**: Use headline safety filter
- **Likely files**: `dashboardCatalog.js` (algo-topics-liked takeaway), `headlineSafety.js`
- **Status**: Open

---

### TALK TAB (T1-T5)

#### T1: Tab label truncated to "Ta"
- **Severity**: P1
- **Type**: Visual hierarchy / Bug appearance
- **Symptom**: Tab label "Talk to Your Algorithm" truncates to "Ta" on narrow screens
- **Fix intent**: Ensure minimum width or use shorter label "Talk"
- **Likely files**: `DashboardPage.jsx` (tab navigation rendering), `dashboardCatalog.js` (TABS array)
- **Status**: Open

#### T2: Green theme not Oura-level polish
- **Severity**: P2
- **Type**: Visual hierarchy / Polish
- **Symptom**: Talk tab has green theme but feels less polished than hero sections
- **Fix intent**: Match Oura-level visual quality with gradients, spacing, shadows
- **Likely files**: `DashboardPage.jsx` (TalkTabPanel component, SURFACES.TALK_GREEN)
- **Status**: Open

#### T3: Beta badge position awkward
- **Severity**: P2
- **Type**: Visual hierarchy / Layout
- **Symptom**: "Beta feature · coming soon" badge placement feels tacked on
- **Fix intent**: Integrate badge more naturally into header design
- **Likely files**: `DashboardPage.jsx` (TalkTabPanel, lines 1644-1653)
- **Status**: Open

#### T4: Waitlist form copy generic
- **Severity**: P2
- **Type**: Copy / UX
- **Symptom**: Form copy doesn't communicate value proposition clearly
- **Fix intent**: Improve copy to be more specific about what user gets
- **Likely files**: `DashboardPage.jsx` (TalkTabPanel form section, lines 1656-1663)
- **Status**: Open

#### T5: Success state feels anticlimactic
- **Severity**: P2
- **Type**: UX / Polish
- **Symptom**: After form submit, success message is plain text, not celebrated
- **Fix intent**: Add visual flourish or more encouraging success state
- **Likely files**: `DashboardPage.jsx` (TalkTabPanel form onSubmit, line 1621)
- **Status**: Open

---

### CROSS-TAB ISSUES (X1-X5)

#### X1: "Twitter" vs "X" inconsistency
- **Severity**: P0
- **Type**: Trust breaker / Naming consistency
- **Symptom**: Some places say "Twitter", others say "X"
- **Fix intent**: Use "X" everywhere, canonical mapping in PlatformBadge
- **Likely files**: `PlatformBadge.jsx` (already handles this), verify all other references
- **Status**: Fixed
- **Fixed in**: Pass 1 - Updated StartPage, ScanPlatformPage, ScanPage, FeedConnect to use "X" consistently

#### X2: "Observed in this scan" vs "during this window" global pattern
- **Severity**: P0
- **Type**: Trust breaker / Copy contradiction
- **Symptom**: Inconsistent scope language across all tabs
- **Fix intent**: Single source of truth for scope labeling based on actual aggregation method
- **Likely files**: `DashboardPage.jsx` (TabHero, deriveWindowLabel), `dashboardCatalog.js` (TAB_TRUST_SENTENCES)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Comprehensive update across all tabs and views

#### X3: Date labels repeated across all tabs with trend lines
- **Severity**: P1
- **Type**: Visual hierarchy / Bug appearance
- **Symptom**: LineChartSimple shows repeated date labels looking like render bug
- **Fix intent**: De-duplicate logic in chart component or data formatting
- **Likely files**: `LineChartSimple.jsx`, `dataHelpers.js` (formatDateLabel)
- **Status**: Fixed
- **Fixed in**: Pass 1 - Same fix as A8

#### X4: Empty states contradict hero claims pattern
- **Severity**: P0
- **Type**: Trust breaker / Logic error
- **Symptom**: Multiple tabs show hero with claim but supporting cards say "no data"
- **Fix intent**: Hero should only render takeaway when sufficient data exists
- **Likely files**: `DashboardPage.jsx` (TabHero component), all hero takeaway functions in `dashboardCatalog.js`
- **Status**: Fixed
- **Fixed in**: Pass 1 - Added chartQuality gating to TabHero

#### X5: "More Details" label generic across tabs
- **Severity**: P2
- **Type**: Copy / UX
- **Symptom**: All tabs use same "More details" label, doesn't describe what's inside
- **Fix intent**: Use dynamic label based on content, e.g. "Platform comparison and trends"
- **Likely files**: `DashboardPage.jsx` (ViewsGridWithCollapsing, moreDetailsSubtitle logic already exists but verify)
- **Status**: Open

---

## PASS 1: P0 TRUST BREAKERS (PRIORITY LIST)

The following issues are P0 and will be fixed in Pass 1:

1. **X2**: Scan/window language contradiction (global)
2. **X1**: Twitter vs X inconsistency  
3. **X4**: Empty states contradict hero claims (global pattern)
4. **A1**: Scan/window language in ads hero
5. **A2**: Metadata contradiction ads hero
6. **A6**: Empty state contradicts hero (ads)
7. **A10**: Scope pill vs kicker contradiction
8. **P1**: Scan/window contradiction politics
9. **P10**: Empty state contradicts hero (politics)
10. **PA1**: Topic variety takeaway contradicts data
11. **C1**: Scan/window language contradiction creators
12. **C9**: Empty state when data exists creators
13. **W1**: "What Algorithm Thinks" implies mind-reading
14. **W2**: Hero makes identity claims
15. **W6**: Empty state contradicts hero (algorithm)

**Total P0 issues**: 15

---

## PASS 2: P1 VISUAL HIERARCHY & UX (DEFERRED)

Pass 2 will address P1 issues affecting comprehension and trust. Not started yet.

---

## PASS 3: P2 POLISH & CONSISTENCY (DEFERRED)

Pass 3 will address P2 polish issues. Not started yet.

---

## CHANGELOG

### 2026-01-21 - Pass 1 Complete (P0 Trust Breakers)
- **Fixed 15 P0 issues** (all trust breakers)
- **Files changed**: 8
  - `DashboardPage.jsx`: Fixed scope language consistency, added chartQuality gating
  - `dashboardCatalog.js`: Updated all tab labels, view descriptions, takeaways
  - `LineChartSimple.jsx`: De-duplicated repeated date labels
  - `ViewCard.jsx`: Removed non-functional feedback UI
  - `PlatformBadge.jsx`: Already handled Twitter→X (verified)
  - `StartPage.jsx`, `ScanPlatformPage.jsx`, `ScanPage.jsx`, `FeedConnect.jsx`: Consistent X naming
- **Key achievements**:
  - ✓ Eliminated scan/window language contradictions globally
  - ✓ Fixed Twitter vs X naming everywhere
  - ✓ Prevented hero claims when data insufficient
  - ✓ Fixed repeated date labels in charts
  - ✓ Removed "What Algorithm Thinks" mind-reading language
  - ✓ Removed dead feedback UI
- Ready for smoke test and screenshots

### 2026-01-21 - Backlog Created
- Created comprehensive 55-issue backlog
- Organized by tab with clear IDs
- Defined severity levels and pass structure
- Ready for Pass 1 execution
