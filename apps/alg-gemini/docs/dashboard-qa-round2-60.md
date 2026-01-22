# Round 2 Dashboard QA Backlog (60 items)

**Created**: 2026-01-21  
**Status**: Active - 13 FIXED, 47 OPEN  
**Last Updated**: 2026-01-21 (R2 Pass 1 - P0 fixes)

---

## RULES

This is Round 2 polish following the successful shipment of dashboard v1 (dashboard-ship-v1).

**What is allowed:**
- Copy and UX polish
- Visual hierarchy improvements
- Presentation-only helper changes (formatting, display logic)

**What is NOT allowed:**
- Changing data logic, thresholds, calculations
- Changing IDs, tab structure, chart rendering rules
- Changing what rows appear or inclusion/exclusion logic
- Adding new features

**Trust discipline (enforced):**
- No mind-reading language ("you want", "you believe")
- No identity claims ("you are a", "your politics")
- No scary language ("the algorithm knows", "predicting your future")
- No contradictory scope claims (pick one: "during this window" or similar, use consistently)

**Paid vs free adaptability:**
- Language must work for both contexts
- Don't assume users have unlimited scans or premium features

---

## SUMMARY

| ID | Tab | Severity | Status | Issue |
|----|-----|----------|--------|-------|
| R2-G1 | Global | P1 | OPEN | Color and contrast separation is too low (eyes glaze over) |
| R2-G2 | Global | P1 | OPEN | Persistent bottom nav bar overlays content and looks like broken layout |
| R2-G3 | Global | P0 | FIXED | Trust discipline regressions: "Try this" and advice UI reappeared |
| R2-G4 | Global | P0 | FIXED | Scope language regressed to "across scans" and "based on your recent scans" |
| R2-G5 | Global | P1 | OPEN | Chart styling reads prototype: markers too large, inconsistent shapes, cramped baseline |
| R2-A1 | Ads & Influence | P2 | OPEN | Line chart dots are too big and oddly shaped |
| R2-A2 | Ads & Influence | P1 | OPEN | Hero says "Not enough data" while chart and percent render |
| R2-A3 | Ads & Influence | P2 | OPEN | "Hide details" button blends into hero |
| R2-A4 | Ads & Influence | P1 | OPEN | "How we measure" block in hero is cramped and equal weight to content |
| R2-A5 | Ads & Influence | P1 | OPEN | Bottom sticky nav overlays hero content |
| R2-A6 | Ads & Influence | P0 | FIXED | "Based on your recent scans" phrasing is back (scope regression) |
| R2-A7 | Ads & Influence | P0 | FIXED | Card scope line uses scan-based framing ("Scope: Based on your recent scans") |
| R2-A8 | Ads & Influence | P1 | OPEN | Section cards do not visually separate enough from hero, low hierarchy |
| R2-A9 | Ads & Influence | P1 | OPEN | Platform list has confusing duplication or ordering (X appears oddly) |
| R2-A10 | Ads & Influence | P2 | OPEN | "More details" accordion preview is generic and low-signal |
| R2-P1 | Politics & Worldview | P1 | OPEN | Orange banner feels like an alert and is too dominant |
| R2-P2 | Politics & Worldview | P1 | OPEN | "Enable" button wording and hierarchy feels like permissions, not optional module |
| R2-P3 | Politics & Worldview | P2 | OPEN | Line chart dots too large and inconsistent |
| R2-P4 | Politics & Worldview | P1 | OPEN | Hero says "Not enough data" while chart and percent render |
| R2-P5 | Politics & Worldview | P1 | OPEN | Table readability is dense and low contrast |
| R2-P6 | Politics & Worldview | P1 | OPEN | "% of their posts" showing "all" reads broken or unclear |
| R2-P7 | Politics & Worldview | P2 | OPEN | Platform asymmetry copy should collapse when most platforms are 0 |
| R2-P8 | Politics & Worldview | P1 | OPEN | Platform list labeling/order has duplication or confusion (X repeats) |
| R2-P9 | Politics & Worldview | P1 | OPEN | More details expansion feels like a second hero, too much weight |
| R2-P10 | Politics & Worldview | P2 | OPEN | Repetition of "exposure not beliefs" across multiple blocks creates bloat |
| R2-PA1 | Patterns in Your Feed | P1 | OPEN | Embedded "Not enough data yet" panel looks like different design system |
| R2-PA2 | Patterns in Your Feed | P2 | OPEN | "Run Another Scan" CTA placement is awkward and inconsistent |
| R2-PA3 | Patterns in Your Feed | P1 | OPEN | Section header hierarchy is too light, lacks contrast |
| R2-PA4 | Patterns in Your Feed | P2 | OPEN | Topic concentration green block is too loud |
| R2-PA5 | Patterns in Your Feed | P1 | OPEN | Attention tactics shows big 5% with weak interpretation hierarchy |
| R2-PA6 | Patterns in Your Feed | P2 | OPEN | Tone distribution bar still feels loud and moralized |
| R2-PA7 | Patterns in Your Feed | P1 | OPEN | More details accordion takes over page, too much vertical bloat |
| R2-PA8 | Patterns in Your Feed | P0 | FIXED | Copy uses "across scans" language (scope regression) |
| R2-PA9 | Patterns in Your Feed | P0 | FIXED | "Try this" section reappeared (trust regression) |
| R2-PA10 | Patterns in Your Feed | P2 | OPEN | Summary card reads like placeholder copy and repeats itself |
| R2-C1 | Creators & Voices | P1 | OPEN | Hero says "Not enough data" while top creators table is populated |
| R2-C2 | Creators & Voices | P1 | OPEN | Table contrast is too low, hard to scan |
| R2-C3 | Creators & Voices | P0 | FIXED | "How we measure" uses "across your scans" (scope regression) |
| R2-C4 | Creators & Voices | P2 | OPEN | Italic disclaimer microcopy is too small and washed out |
| R2-C5 | Creators & Voices | P2 | OPEN | Cross-platform empty state is wordy and low-value |
| R2-C6 | Creators & Voices | P1 | OPEN | Cross-platform presence card is visually buried, weak hierarchy |
| R2-C7 | Creators & Voices | P0 | FIXED | "Try this" section reappeared and labels creators (trust regression) |
| R2-C8 | Creators & Voices | P1 | OPEN | Summary card content conflicts with presence of "Try this" list below |
| R2-C9 | Creators & Voices | P1 | OPEN | Bottom nav overlay blocks content in creators tab |
| R2-C10 | Creators & Voices | P1 | OPEN | "Not enough data" headline pattern across tabs undermines credibility |
| R2-W1 | Observed Patterns | P0 | FIXED | Hero expand button ("How we know this") crashes when clicked |
| R2-W2 | Observed Patterns | P1 | OPEN | Hero says "Not enough data" but the page content below still renders |
| R2-W3 | Observed Patterns | P1 | OPEN | Title "What the system is reinforcing" is too strong and implies active shaping |
| R2-W4 | Observed Patterns | P0 | FIXED | "Across scans" language is back in headings and scope lines |
| R2-W5 | Observed Patterns | P0 | FIXED | Scope badge shows scan counts that can conflict across views (trust risk) |
| R2-W6 | Observed Patterns | P2 | OPEN | Speculation card is still too long and repetitive |
| R2-W7 | Observed Patterns | P1 | OPEN | Bottom nav overlay interrupts observed patterns content |
| R2-W8 | Observed Patterns | P0 | FIXED | "Try this" section reappeared (trust regression) |
| R2-W9 | Observed Patterns | P0 | FIXED | "Current algorithmic interpretation" header is back (tone regression) |
| R2-W10 | Observed Patterns | P1 | OPEN | Tab tone feels inconsistent with calm Oura-style voice and structure |
| R2-T1 | Talk | P2 | OPEN | Coming soon section should feel special without being loud |
| R2-T2 | Talk | P2 | OPEN | Waitlist module needs sharper value clarity in one tight block |
| R2-T3 | Talk | P2 | OPEN | Email form needs premium validation and success states |
| R2-T4 | Talk | P2 | OPEN | Privacy microcopy should be crisp and consistent with trust discipline |
| R2-T5 | Talk | P2 | OPEN | Waitlist CTA should match dashboard button system (states, sizing, focus) |

---

## GLOBAL ISSUES

### R2-G1
**Tab**: Global  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Text colors, borders, and card separations use very similar grays
- When scanning the page quickly, elements blur together
- Hard to distinguish between primary content, metadata, and secondary UI

**Why it hurts:**
- Users cannot quickly parse hierarchy or find what they need
- Page feels dense and tiring to read (low "premium" perception)

**Fix intent (no logic changes):**
- Increase contrast between primary text and backgrounds (presentation only)
- Use stronger border weights or shadows to separate cards (presentation only)
- Adjust metadata/disclaimer text to be visibly lighter than content (presentation only)
- Ensure hierarchy is clear: hero > section cards > supporting cards > metadata

**Acceptance criteria:**
- Quick visual scan shows clear layering (hero stands out, metadata recedes)
- Color contrast ratios meet WCAG AA for body text
- No data logic or calculations changed

---

### R2-G2
**Tab**: Global  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- A persistent bottom navigation bar sits at the bottom of the viewport
- When scrolling through tab content, the nav overlays the last section
- Content gets cut off or hidden behind the nav
- Looks like a broken mobile pattern on desktop

**Why it hurts:**
- Users cannot read the full content at the bottom of tabs
- Feels like an unfinished UI or layout bug

**Fix intent (no logic changes):**
- Remove persistent bottom nav entirely, or convert to top-only navigation (presentation only)
- If bottom nav must stay, add sufficient padding to page bottom so content never overlaps (presentation only)
- Ensure all tabs have proper bottom padding regardless of content height (presentation only)

**Acceptance criteria:**
- No content is ever obscured by navigation UI
- Scrolling to the bottom of any tab shows full content with breathing room
- Trust check: users don't think "this is broken"

---

### R2-G3
**Tab**: Global  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- "Try this" sections have reappeared in multiple tabs
- Generic advice like "Follow new accounts" or "Engage differently" is back
- Language uses prescriptive tone ("you should", "try this", "you could")

**Why it hurts:**
- Direct violation of Round 1 trust discipline freeze
- Makes dashboard feel preachy and manipulative
- Breaks the "observation only, no advice" boundary

**Fix intent (no logic changes):**
- Remove all "Try this" sections from all tabs (presentation only)
- Remove any action field content that is generic behavioral coaching (presentation only)
- If an action field exists, either null it or replace with factual context only (presentation only)
- Ensure no prescriptive language remains ("you should", "try", "you could")

**Acceptance criteria:**
- Zero instances of "Try this" UI anywhere in dashboard
- No generic behavioral advice visible
- Trust check: dashboard stays observational, never prescriptive
- No data logic changed

**Resolution**: Removed entire "Try this" section from DashboardPage.jsx (lines 1094-1265). Section included accordion UI with prescriptive "Try this" actions and advice. Replaced with single comment line. Fixes R2-G3, R2-PA9, R2-C7, R2-W8.

---

### R2-G4
**Tab**: Global  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- Scope language reverted to "across your scans", "based on your recent scans", "in this scan"
- Inconsistent with Round 1 freeze which established "during this window" as the canonical phrase
- Some tabs say "window", others say "scans" or mix both

**Why it hurts:**
- Breaks trust freeze commitment from dashboard-ship-v1
- Creates confusion about what data is included
- Feels like regression or lack of care

**Fix intent (no logic changes):**
- Replace all instances of "across your scans" with "during this window" (presentation only)
- Replace "based on your recent scans" with "during this window" or "in the selected window" (presentation only)
- Remove scan count references in scope lines unless absolutely necessary (presentation only)
- Use date ranges or relative windows ("last 7 days") instead of scan counts where possible (presentation only)

**Acceptance criteria:**
- All scope language uses consistent "window" framing
- No "across your scans" or "in this scan" remains
- Trust check: scope feels coherent and intentional
- No data aggregation logic changed

**Resolution**: Changed scope language across all user-visible dashboard areas: (1) DashboardPage.jsx line 1868: "Based on your recent scans" → "during this window", (2) dashboardCatalog.js: 4 instances of "across your scans" → "during this window" (ads-trend description, creators-top whyExplanation, algo-uncertain description, algo-change-advice takeaway). Fixes R2-G4, R2-A6, R2-A7, R2-PA8, R2-C3, R2-W4.

---

### R2-G5
**Tab**: Global  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Line chart markers are large circles that dominate the chart
- Marker shapes are inconsistent (some circles, some other shapes)
- Axis labels and baselines feel cramped or oddly spaced
- Charts look like debug visualizations, not polished product

**Why it hurts:**
- Charts do not feel "Oura-level premium"
- Visual noise distracts from the data story
- Users focus on the wrong elements (markers instead of trends)

**Fix intent (no logic changes):**
- Reduce marker size significantly or remove markers entirely for cleaner lines (presentation only)
- Standardize marker shapes across all charts (presentation only)
- Improve axis label spacing and sizing (presentation only)
- Ensure baseline and grid elements are subtle and not competing with data (presentation only)

**Acceptance criteria:**
- Charts feel calm and premium, not prototype-y
- Data trends are the focus, not markers or grid lines
- Visual consistency across all chart types
- No chart data or thresholds changed

---

## ADS & INFLUENCE

### R2-A1
**Tab**: Ads & Influence  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Line chart in Ads hero section has large circular markers at each data point
- Markers draw more attention than the line itself
- Shapes look inconsistent with other dashboard charts

**Why it hurts:**
- Feels unpolished and prototype-like
- Distracts from the actual trend story

**Fix intent (no logic changes):**
- Reduce marker size to 50% or smaller (presentation only)
- Ensure marker shape matches other dashboard charts (presentation only)
- Consider removing markers entirely for cleaner line emphasis (presentation only)

**Acceptance criteria:**
- Markers are subtle or absent
- Line trend is the visual focus
- Consistent with chart styling across dashboard

---

### R2-A2
**Tab**: Ads & Influence  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Hero section displays "Not enough data" message
- Below the message, a line chart and percentage value still render
- Creates contradiction: "not enough" but data is shown

**Why it hurts:**
- Confuses users about whether data is trustworthy
- Looks like a layout bug or incomplete conditional logic

**Fix intent (no logic changes):**
- If chart renders, remove or soften the "Not enough data" message (presentation only)
- If insufficient data, hide chart entirely and show only empty state (presentation only)
- Adjust threshold display logic to be coherent (presentation only)

**Acceptance criteria:**
- No contradictory "not enough data" + rendered chart combo
- Empty state or full data state, never mixed
- Trust check: users don't question data reliability

---

### R2-A3
**Tab**: Ads & Influence  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- "Hide details" collapse button in hero section has low contrast
- Button blends into the hero background
- Hard to see it's interactive

**Why it hurts:**
- Users miss the affordance to collapse expanded sections
- Feels like missing UI element

**Fix intent (no logic changes):**
- Increase button contrast or add subtle border (presentation only)
- Use clearer button styling (solid background or outline) (presentation only)
- Ensure hover/focus states are visible (presentation only)

**Acceptance criteria:**
- Button is clearly visible and interactive
- Matches button system used elsewhere in dashboard
- No interaction logic changed

---

### R2-A4
**Tab**: Ads & Influence  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- "How we measure" disclosure block appears in hero section with equal visual weight to primary content
- Text is cramped and hard to read
- Block competes for attention with the main insight

**Why it hurts:**
- Reduces hierarchy clarity (what's primary vs metadata)
- Makes hero feel cluttered and less premium

**Fix intent (no logic changes):**
- Reduce visual weight of "How we measure" block (lighter text, smaller size, recessed styling) (presentation only)
- Increase spacing/padding for better readability (presentation only)
- Ensure block feels like optional metadata, not primary content (presentation only)

**Acceptance criteria:**
- Hero insight is visually dominant
- "How we measure" is present but clearly secondary
- Text is readable and well-spaced

---

### R2-A5
**Tab**: Ads & Influence  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Sticky bottom navigation bar overlays the bottom portion of Ads tab hero content
- Content is cut off or hard to read when scrolling to bottom

**Why it hurts:**
- Users cannot see full content
- Looks like a layout bug

**Fix intent (no logic changes):**
- Add bottom padding to Ads tab content to clear the nav bar (presentation only)
- Or remove sticky nav positioning (presentation only)

**Acceptance criteria:**
- All Ads tab content is fully visible and readable
- No overlap with navigation UI

---

### R2-A6
**Tab**: Ads & Influence  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- Scope label in Ads tab says "Based on your recent scans"
- This violates the Round 1 freeze which established "during this window" as the standard

**Why it hurts:**
- Trust regression from shipped v1
- Inconsistent with other tabs
- Feels careless or regressive

**Fix intent (no logic changes):**
- Replace "Based on your recent scans" with "during this window" or equivalent window-based phrasing (presentation only)

**Acceptance criteria:**
- Scope language matches Round 1 standard ("during this window")
- No "scans" framing in Ads tab scope
- Trust check: feels intentional and consistent

**Resolution**: Fixed by R2-G4 scope language sweep.

---

### R2-A7
**Tab**: Ads & Influence  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- Card-level scope lines display "Scope: Based on your recent scans"
- Uses scan-based framing instead of window-based

**Why it hurts:**
- Trust regression from Round 1 freeze
- Inconsistent with canonical scope language

**Fix intent (no logic changes):**
- Replace card scope lines with "during this window" or remove if redundant (presentation only)

**Acceptance criteria:**
- Card scope uses "during this window" phrasing
- No scan-count framing at card level
- Consistent with tab-level scope

**Resolution**: Fixed by R2-G4 scope language sweep. Scope labels now derive from deriveWindowLabel() which returns "during this window".

---

### R2-A8
**Tab**: Ads & Influence  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Section cards below hero do not have enough visual separation from hero
- Cards feel like part of the hero rather than distinct sections
- Weak hierarchy makes it hard to parse page structure

**Why it hurts:**
- Page feels like one big block, not organized sections
- Hard to scan and find specific content

**Fix intent (no logic changes):**
- Increase spacing between hero and section cards (presentation only)
- Add stronger border or shadow to section cards (presentation only)
- Reduce section card background intensity to differentiate from hero (presentation only)

**Acceptance criteria:**
- Clear visual break between hero and section cards
- Easy to identify distinct sections at a glance
- Hierarchy feels intentional: hero > sections > cards

---

### R2-A9
**Tab**: Ads & Influence  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Platform list in Ads tab shows "X" in an odd position or duplicated
- Ordering feels inconsistent (alphabetical? by volume? random?)
- Creates confusion about what "X" means vs "Twitter"

**Why it hurts:**
- Users don't know if data is correct or if there's duplication
- Platform names should be normalized consistently

**Fix intent (no logic changes):**
- Normalize platform names at display time only (presentation only)
- Ensure consistent ordering (e.g., by volume descending) (presentation only)
- Remove any duplicate entries in display (presentation only)

**Acceptance criteria:**
- Platform list is clear and unambiguous
- No visible duplicates (Twitter/X resolved to one label)
- Ordering is logical and consistent

---

### R2-A10
**Tab**: Ads & Influence  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- "More details" accordion preview text is generic: "Additional detail from the same window"
- Doesn't tell user what they'll actually see if they expand

**Why it hurts:**
- Low information density, feels like placeholder copy
- Doesn't help user decide whether to expand

**Fix intent (no logic changes):**
- Replace preview text with specific signal: "Platform breakdown and advertiser concentration" (presentation only)

**Acceptance criteria:**
- Preview text is specific and informative
- Users can decide whether to expand based on preview
- No new data exposed, just clearer labeling

---

## POLITICS & WORLDVIEW

### R2-P1
**Tab**: Politics & Worldview  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Orange banner at top of Politics tab feels like an alert or warning
- Color is too dominant and draws negative attention
- Creates anxiety before user even reads content

**Why it hurts:**
- Sets wrong tone (alarm instead of calm observation)
- Doesn't match Oura-style calm aesthetic

**Fix intent (no logic changes):**
- Change banner color to neutral (slate or muted blue) (presentation only)
- Reduce banner visual weight (lighter background, softer border) (presentation only)
- Ensure banner feels like informational context, not alert (presentation only)

**Acceptance criteria:**
- Banner is calm and informational, not alarming
- Color palette matches dashboard aesthetic
- Trust check: users feel informed, not warned

---

### R2-P2
**Tab**: Politics & Worldview  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- "Enable" button in Politics banner feels like a permission request
- Hierarchy makes it look required or primary action
- Wording implies user needs to grant access

**Why it hurts:**
- Creates friction and confusion (what am I enabling?)
- Feels like dark pattern or permission dialog

**Fix intent (no logic changes):**
- Change button label to "Show estimates" or "View breakdown" (presentation only)
- Reduce button prominence (secondary styling instead of primary) (presentation only)
- Clarify in surrounding copy that this is optional detail (presentation only)

**Acceptance criteria:**
- Button feels optional and informational, not required
- Wording is clear and non-technical
- Trust check: no permission anxiety

---

### R2-P3
**Tab**: Politics & Worldview  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Line chart in Politics hero has large circular markers
- Markers are visually inconsistent with other charts

**Why it hurts:**
- Same issue as R2-A1 and R2-G5
- Charts don't feel cohesive across dashboard

**Fix intent (no logic changes):**
- Reduce marker size or remove markers (presentation only)
- Standardize with other dashboard chart styling (presentation only)

**Acceptance criteria:**
- Politics chart markers match Ads chart markers in size/style
- Charts feel like one design system

---

### R2-P4
**Tab**: Politics & Worldview  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Hero shows "Not enough data" message
- Chart and percentage still render below the message
- Contradictory signals

**Why it hurts:**
- Same issue as R2-A2
- Confuses users about data reliability

**Fix intent (no logic changes):**
- Hide chart if showing "not enough data", or remove message if chart renders (presentation only)

**Acceptance criteria:**
- No contradictory "not enough" + rendered chart
- Clear empty state or clear data state

---

### R2-P5
**Tab**: Politics & Worldview  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Politics creators table has low contrast between rows
- Text is small and hard to scan
- Dense layout makes it tiring to read

**Why it hurts:**
- Users struggle to parse the table
- Feels low-quality

**Fix intent (no logic changes):**
- Increase row padding for better scanability (presentation only)
- Increase text contrast (darker text or lighter background) (presentation only)
- Add subtle row separators or alternating row colors (presentation only)

**Acceptance criteria:**
- Table is easy to scan quickly
- Contrast meets WCAG AA
- Feels premium and readable

---

### R2-P6
**Tab**: Politics & Worldview  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Politics table column "% of their posts" sometimes shows value "all"
- "all" is ambiguous: does it mean 100%? All posts in window? All their posts ever?

**Why it hurts:**
- Users don't understand what "all" means
- Looks like broken data or placeholder

**Fix intent (no logic changes):**
- If percentage is 100%, display "100%" not "all" (presentation only)
- If meaning is different, clarify label or display differently (presentation only)

**Acceptance criteria:**
- No ambiguous "all" label in percentage columns
- Values are clear and numeric where expected
- Trust check: data feels precise, not vague

---

### R2-P7
**Tab**: Politics & Worldview  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Platform asymmetry card compares platforms even when most have 0 posts
- Copy says "leaned toward X over TikTok" when TikTok is 0
- Reads robotic and low-value

**Why it hurts:**
- Comparison is meaningless when denominator is 0
- Feels like template text, not thoughtful

**Fix intent (no logic changes):**
- Collapse or simplify copy when secondary platform is 0 or near-0 (presentation only)
- Use phrasing like "Political keywords appeared primarily on X" instead of comparison (presentation only)

**Acceptance criteria:**
- No robotic comparisons to platforms with 0 data
- Copy adapts to data shape
- Trust check: feels intelligent, not templated

---

### R2-P8
**Tab**: Politics & Worldview  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Platform list shows duplicate or confusing labels (Twitter vs X)
- Ordering is unclear

**Why it hurts:**
- Same issue as R2-A9
- Platform naming should be consistent

**Fix intent (no logic changes):**
- Normalize platform names at display time (presentation only)
- Consistent ordering across all tabs (presentation only)

**Acceptance criteria:**
- Platform names are normalized (Twitter → X or consistent choice)
- No visible duplicates in list

---

### R2-P9
**Tab**: Politics & Worldview  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- "More details" expansion in Politics tab becomes very long and heavyweight
- Feels like a second hero section appearing below the first
- Too much visual weight for optional detail

**Why it hurts:**
- Page becomes overwhelming when expanded
- Hard to maintain context about what's primary vs optional

**Fix intent (no logic changes):**
- Reduce visual weight of expanded sections (lighter backgrounds, smaller text) (presentation only)
- Add clear visual nesting to show these are sub-sections (presentation only)
- Consider progressive disclosure (show less by default, "show more" for extreme detail) (presentation only)

**Acceptance criteria:**
- Expanded sections feel like supporting detail, not new heroes
- Visual hierarchy maintained even when expanded
- Page doesn't feel overwhelming

---

### R2-P10
**Tab**: Politics & Worldview  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Multiple blocks repeat similar disclaimers: "measures exposure not beliefs", "keyword-based only", "cannot infer opinion"
- Repetition creates bloat

**Why it hurts:**
- Repetitive copy feels unedited
- Users skip over repeated disclaimers

**Fix intent (no logic changes):**
- Consolidate disclaimers into one prominent location (e.g., banner or hero) (presentation only)
- Remove or significantly shorten repeated disclaimers in cards (presentation only)
- Ensure one strong trust boundary statement covers the whole tab (presentation only)

**Acceptance criteria:**
- Disclaimer appears once prominently, not in every card
- Copy feels edited and intentional
- Trust boundary is clear but not repetitive

---

## PATTERNS IN YOUR FEED

### R2-PA1
**Tab**: Patterns in Your Feed  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- "Not enough data yet" panel appears embedded in cards
- Panel styling doesn't match dashboard design system
- Looks like a different product or placeholder UI

**Why it hurts:**
- Breaks visual coherence
- Feels unfinished

**Fix intent (no logic changes):**
- Match empty state styling to dashboard card system (presentation only)
- Use consistent typography, colors, spacing (presentation only)
- Ensure empty states feel intentional, not placeholder (presentation only)

**Acceptance criteria:**
- Empty states match dashboard visual system
- No jarring style breaks
- Feels cohesive across all tabs

---

### R2-PA2
**Tab**: Patterns in Your Feed  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- "Run Another Scan" CTA appears in some empty states
- Placement is awkward (sometimes in card, sometimes in hero)
- Inconsistent across tabs

**Why it hurts:**
- Users don't know where to find the action
- Feels scattered and unintentional

**Fix intent (no logic changes):**
- Standardize CTA placement (always at bottom of empty state card, or remove if not actionable) (presentation only)
- Use consistent button styling (presentation only)

**Acceptance criteria:**
- CTA placement is consistent across all empty states
- Button styling matches dashboard system
- Feels intentional and coherent

---

### R2-PA3
**Tab**: Patterns in Your Feed  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Section headers in Patterns tab are light and low contrast
- Hard to distinguish sections from content
- Lacks clear hierarchy

**Why it hurts:**
- Users can't quickly scan to find sections
- Page feels flat and hard to navigate

**Fix intent (no logic changes):**
- Increase section header contrast and weight (presentation only)
- Use larger font size or bolder weight for headers (presentation only)
- Add spacing above headers to create clear section breaks (presentation only)

**Acceptance criteria:**
- Section headers are clearly visible and scannable
- Hierarchy is obvious: headers > content > metadata
- Easy to navigate page structure

---

### R2-PA4
**Tab**: Patterns in Your Feed  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Topic concentration insight appears in a bright green block
- Green is saturated and stands out too much
- Feels like a different design language

**Why it hurts:**
- Visual loudness distracts from content
- Doesn't match Oura-style calm aesthetic

**Fix intent (no logic changes):**
- Soften green color to pastel or muted tone (presentation only)
- Reduce background saturation (presentation only)
- Ensure block styling matches other insight cards (presentation only)

**Acceptance criteria:**
- Green block is calm and subtle, not loud
- Color palette matches dashboard
- No data or logic changed

---

### R2-PA5
**Tab**: Patterns in Your Feed  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Attention tactics card shows large "5%" number
- Interpretation text below is small and weak
- Number dominates, interpretation is secondary

**Why it hurts:**
- Users focus on number without context
- Hierarchy is inverted (data > meaning instead of meaning > data)

**Fix intent (no logic changes):**
- Reduce number size or de-emphasize (presentation only)
- Increase interpretation text size and prominence (presentation only)
- Ensure meaning is the headline, number is supporting (presentation only)

**Acceptance criteria:**
- Interpretation is more prominent than raw number
- Hierarchy matches Oura-style: insight > data
- Trust check: users understand meaning first

---

### R2-PA6
**Tab**: Patterns in Your Feed  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Emotional tone distribution bar uses saturated colors (red, yellow, green)
- Color choices feel moralized (red = bad, green = good)
- Visual style is loud and draws too much attention

**Why it hurts:**
- Colors imply judgment about content
- Feels like sentiment analysis overclaim
- Doesn't match calm dashboard tone

**Fix intent (no logic changes):**
- Use neutral or pastel color palette for tone bar (presentation only)
- Reduce saturation significantly (presentation only)
- Ensure colors don't imply good/bad judgment (presentation only)

**Acceptance criteria:**
- Tone bar uses calm, neutral colors
- No moralized color coding (avoid red=bad, green=good)
- Matches dashboard aesthetic

---

### R2-PA7
**Tab**: Patterns in Your Feed  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- "More details" accordion in Patterns tab expands to show very long content
- Takes over the page with vertical bloat
- Hard to maintain context about primary vs detail

**Why it hurts:**
- Page becomes overwhelming
- Users lose track of primary content

**Fix intent (no logic changes):**
- Reduce content length in expanded sections (consolidate, remove redundant text) (presentation only)
- Use progressive disclosure (show key points, "show more" for full detail) (presentation only)
- Ensure visual weight is lighter for expanded sections (presentation only)

**Acceptance criteria:**
- Expanded sections feel manageable, not overwhelming
- Visual hierarchy maintained when expanded
- Users can still see primary content context

---

### R2-PA8
**Tab**: Patterns in Your Feed  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- Copy in Patterns tab uses "across scans" phrasing
- Violates Round 1 scope language freeze

**Why it hurts:**
- Trust regression
- Inconsistent with canonical "during this window" standard

**Fix intent (no logic changes):**
- Replace "across scans" with "during this window" (presentation only)

**Acceptance criteria:**
- All scope language matches "during this window" standard
- No "across scans" remains in Patterns tab
- Consistent with other tabs

**Resolution**: Fixed by R2-G4 scope language sweep.

---

### R2-PA9
**Tab**: Patterns in Your Feed  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- "Try this" section reappeared in Patterns tab
- Contains generic behavioral advice

**Why it hurts:**
- Trust regression from Round 1 freeze
- Violates "no advice" boundary

**Fix intent (no logic changes):**
- Remove "Try this" section entirely (presentation only)
- Remove action field content (presentation only)

**Acceptance criteria:**
- No "Try this" UI in Patterns tab
- No prescriptive language
- Trust check: dashboard stays observational

**Resolution**: Fixed by R2-G3 "Try this" removal.

---

### R2-PA10
**Tab**: Patterns in Your Feed  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Summary card at bottom of Patterns tab reads like placeholder copy
- Repeats information from earlier cards
- Low information density

**Why it hurts:**
- Feels unfinished or redundant
- Doesn't add value

**Fix intent (no logic changes):**
- Either remove summary card if truly redundant (presentation only)
- Or rewrite to synthesize distinct insight not stated elsewhere (presentation only)

**Acceptance criteria:**
- Summary adds value or is removed
- No placeholder-feeling copy
- No redundant information

---

## CREATORS & VOICES

### R2-C1
**Tab**: Creators & Voices  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Hero displays "Not enough data" message
- Top creators table is populated and visible below message
- Contradictory signals

**Why it hurts:**
- Same issue as R2-A2 and R2-P4
- Confuses users about data reliability

**Fix intent (no logic changes):**
- Hide table if showing "not enough data", or remove message if table renders (presentation only)

**Acceptance criteria:**
- No contradictory "not enough" + rendered table
- Clear empty state or clear data state

---

### R2-C2
**Tab**: Creators & Voices  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Creators table has low contrast text
- Hard to scan rows and columns
- Dense layout without clear separators

**Why it hurts:**
- Same issue as R2-P5
- Table is tiring to read

**Fix intent (no logic changes):**
- Increase text contrast (presentation only)
- Add row padding and separators (presentation only)
- Ensure table feels scannable and premium (presentation only)

**Acceptance criteria:**
- Table meets WCAG AA contrast
- Easy to scan quickly
- Feels high-quality

---

### R2-C3
**Tab**: Creators & Voices  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- "How we measure" text in Creators tab uses "across your scans"
- Violates Round 1 scope language freeze

**Why it hurts:**
- Trust regression
- Inconsistent with canonical phrasing

**Fix intent (no logic changes):**
- Replace "across your scans" with "during this window" (presentation only)

**Acceptance criteria:**
- Scope language matches "during this window" standard
- Consistent across all tabs

**Resolution**: Fixed by R2-G4 scope language sweep.

---

### R2-C4
**Tab**: Creators & Voices  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Italic disclaimer microcopy in Creators cards is very small
- Text is light gray and hard to read
- Feels washed out

**Why it hurts:**
- Users miss important context
- Disclaimers should be readable, not hidden

**Fix intent (no logic changes):**
- Increase disclaimer text size slightly (presentation only)
- Increase contrast (darker gray) (presentation only)
- Consider removing italic styling for better readability (presentation only)

**Acceptance criteria:**
- Disclaimer text is readable without strain
- Contrast meets WCAG AA
- Feels intentional, not hidden

---

### R2-C5
**Tab**: Creators & Voices  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Cross-platform empty state is long and wordy
- Low information density
- Takes up space without adding value

**Why it hurts:**
- Feels verbose and unedited
- Empty states should be concise

**Fix intent (no logic changes):**
- Shorten empty state copy to 1-2 sentences max (presentation only)
- Make copy more specific and actionable (presentation only)

**Acceptance criteria:**
- Empty state is concise and clear
- Copy feels edited
- Still educational but not verbose

---

### R2-C6
**Tab**: Creators & Voices  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Cross-platform presence card is visually buried
- Doesn't stand out from other cards
- Weak hierarchy makes it easy to miss

**Why it hurts:**
- Important insight gets lost
- Users may not notice cross-platform patterns

**Fix intent (no logic changes):**
- Increase card prominence (stronger border, slight elevation) (presentation only)
- Add visual indicator or icon for cross-platform concept (presentation only)
- Ensure card hierarchy reflects its importance (presentation only)

**Acceptance criteria:**
- Cross-platform card is easily noticeable
- Visual weight matches content importance
- Clear hierarchy

---

### R2-C7
**Tab**: Creators & Voices  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- "Try this" section reappeared in Creators tab
- Content labels or judges creators ("follow these", "unfollow those")
- Feels prescriptive and potentially manipulative

**Why it hurts:**
- Trust regression from Round 1 freeze
- Violates "no advice" boundary
- Labeling creators feels judgmental

**Fix intent (no logic changes):**
- Remove "Try this" section entirely (presentation only)
- Remove any prescriptive creator labels (presentation only)

**Acceptance criteria:**
- No "Try this" UI in Creators tab
- No creator labeling or advice
- Trust check: dashboard stays neutral and observational

**Resolution**: Fixed by R2-G3 "Try this" removal.

---

### R2-C8
**Tab**: Creators & Voices  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Summary card at bottom provides synthesis
- "Try this" list appears below summary
- Content conflicts: summary says "observation only" but advice list follows

**Why it hurts:**
- Mixed signals about dashboard purpose
- Confusing UX structure

**Fix intent (no logic changes):**
- Remove "Try this" list (fixes conflict) (presentation only)
- Ensure summary is final element with no contradictory follow-up (presentation only)

**Acceptance criteria:**
- No conflicting content after summary
- Clear end to tab content
- Trust check: message is coherent

---

### R2-C9
**Tab**: Creators & Voices  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Bottom nav bar overlays Creators tab content
- Last section or summary card is partially obscured

**Why it hurts:**
- Same issue as R2-G2 and R2-A5
- Users cannot see full content

**Fix intent (no logic changes):**
- Add bottom padding to Creators tab (presentation only)
- Or remove sticky nav positioning (presentation only)

**Acceptance criteria:**
- All Creators content fully visible
- No overlap with navigation UI

---

### R2-C10
**Tab**: Creators & Voices  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Multiple tabs show "Not enough data" in hero even when content renders below
- Pattern across dashboard undermines credibility
- Feels like broken conditional logic

**Why it hurts:**
- Same core issue as R2-A2, R2-P4, R2-C1
- Global pattern makes dashboard feel low-quality

**Fix intent (no logic changes):**
- Apply consistent rule across all tabs: if content renders, don't show "not enough" (presentation only)
- Standardize empty state logic in shared component (presentation only)

**Acceptance criteria:**
- No tab shows contradictory "not enough" + rendered content
- Pattern is consistent across dashboard
- Trust check: data presentation feels coherent

---

## OBSERVED PATTERNS

### R2-W1
**Tab**: Observed Patterns  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- Hero section has "How we know this" expand button
- Clicking the button causes a JavaScript error and crashes the UI
- Button may be broken or missing handler

**Why it hurts:**
- Critical bug that breaks user experience
- Makes dashboard feel broken

**Fix intent (no logic changes):**
- Fix or remove expand button to prevent crash (presentation only)
- If button should expand, ensure handler exists (presentation only)
- If not needed, remove button entirely (presentation only)

**Acceptance criteria:**
- No crashes when interacting with hero
- Button works or is removed
- Trust check: dashboard feels stable and reliable

**Resolution**: Verified "How we know this" button works correctly. expandedSections.keyInsightEvidence is properly initialized in useState, toggleSection handler exists, and smoke tests show no crashes. Button functionality is intact. False alarm in backlog.

---

### R2-W2
**Tab**: Observed Patterns  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Hero says "Not enough data"
- Page content below still renders sections and cards
- Contradictory signals

**Why it hurts:**
- Same issue as R2-C10
- Confuses users about data reliability

**Fix intent (no logic changes):**
- Apply consistent empty state logic (presentation only)

**Acceptance criteria:**
- No contradictory "not enough" + rendered content
- Clear empty state or clear data state

---

### R2-W3
**Tab**: Observed Patterns  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Card title says "What the system is reinforcing"
- Language implies active, intentional shaping by algorithm
- Feels stronger than evidence supports

**Why it hurts:**
- Overclaims about algorithm behavior
- Violates trust boundary (we observe patterns, don't know intent)

**Fix intent (no logic changes):**
- Change title to "Recurring themes" or "Patterns that appeared repeatedly" (presentation only)
- Remove "reinforcing" language which implies intent (presentation only)

**Acceptance criteria:**
- Title describes observation, not inferred intent
- Language stays within evidence boundary
- Trust check: feels honest about limitations

---

### R2-W4
**Tab**: Observed Patterns  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- "Across scans" language appears in Observed Patterns headings and scope lines
- Violates Round 1 scope language freeze

**Why it hurts:**
- Trust regression
- Inconsistent with canonical phrasing

**Fix intent (no logic changes):**
- Replace "across scans" with "during this window" (presentation only)

**Acceptance criteria:**
- All scope language matches "during this window" standard
- Consistent across dashboard

**Resolution**: Fixed by R2-G4 scope language sweep.

---

### R2-W5
**Tab**: Observed Patterns  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- Scope badge shows scan count (e.g., "Based on 108 scans")
- Different views may show different scan counts
- Creates trust risk if numbers conflict

**Why it hurts:**
- Users will notice conflicting scan counts and assume data is cherry-picked
- Same core issue as Round 1 X2

**Fix intent (no logic changes):**
- Remove specific scan counts from scope badges (presentation only)
- Use generic "during this window" or date range instead (presentation only)
- Ensure one canonical scope label per tab (presentation only)

**Acceptance criteria:**
- No conflicting scan count numbers within same tab
- Scope feels coherent and intentional
- Trust check: users don't suspect cherry-picking

**Resolution**: Already addressed in Round 1 Pass 2H (A10 fix). DataQualityFooter was simplified to show only confidence badge, removing all "Based on X scans" text. Scope labels now use window-based framing from R2-G4 fix.

---

### R2-W6
**Tab**: Observed Patterns  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Speculation card about "future associations" is long and repetitive
- Contains multiple disclaimers and caveats
- Takes up significant space

**Why it hurts:**
- Feels verbose and unedited
- Users may skip over it

**Fix intent (no logic changes):**
- Shorten speculation card copy significantly (presentation only)
- Keep one strong disclaimer, remove repetitive caveats (presentation only)
- Consider collapsing or hiding this card by default (presentation only)

**Acceptance criteria:**
- Card is concise and scannable
- Disclaimer is clear but not repetitive
- Takes up less vertical space

---

### R2-W7
**Tab**: Observed Patterns  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Bottom nav bar overlays Observed Patterns content
- Last sections or cards are partially obscured

**Why it hurts:**
- Same issue as R2-G2
- Users cannot see full content

**Fix intent (no logic changes):**
- Add bottom padding to Observed Patterns tab (presentation only)
- Or remove sticky nav positioning (presentation only)

**Acceptance criteria:**
- All Observed Patterns content fully visible
- No overlap with navigation UI

---

### R2-W8
**Tab**: Observed Patterns  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- "Try this" section reappeared in Observed Patterns tab
- Contains generic advice about feed behavior

**Why it hurts:**
- Trust regression from Round 1 freeze
- Violates "no advice" boundary

**Fix intent (no logic changes):**
- Remove "Try this" section entirely (presentation only)

**Acceptance criteria:**
- No "Try this" UI in Observed Patterns tab
- No prescriptive language
- Trust check: dashboard stays observational

**Resolution**: Fixed by R2-G3 "Try this" removal.

---

### R2-W9
**Tab**: Observed Patterns  
**Severity**: P0  
**Status**: FIXED

**What you see now:**
- Summary card header says "Current algorithmic interpretation"
- Language was removed in Round 1 as tone regression
- Implies dashboard knows algorithm's "interpretation" or intent

**Why it hurts:**
- Trust regression
- Overclaims about what dashboard can know
- Violates trust boundary

**Fix intent (no logic changes):**
- Change header to "Observed Pattern Summary" or similar neutral phrasing (presentation only)
- Remove "interpretation" language (presentation only)

**Acceptance criteria:**
- Header describes patterns, not algorithm intent
- Language matches Round 1 trust standard
- Trust check: feels honest about limitations

**Resolution**: Changed TAB_STORY_HEADERS.algorithm.summary.title from "Current algorithmic interpretation" to "Observed Pattern Summary", updated subtext from "How the system appears to be categorizing you" to "Themes that appeared consistently during this window".

---

### R2-W10
**Tab**: Observed Patterns  
**Severity**: P1  
**Status**: OPEN

**What you see now:**
- Observed Patterns tab tone feels heavier and more interpretive than other tabs
- Language occasionally slips into claims about algorithm behavior
- Doesn't match Oura-style calm, observational voice

**Why it hurts:**
- Tab stands out as inconsistent
- May undermine trust in overall dashboard

**Fix intent (no logic changes):**
- Audit all copy for tone consistency (presentation only)
- Remove any remaining interpretive or mind-reading language (presentation only)
- Ensure phrasing matches other tabs: patterns, not interpretations (presentation only)

**Acceptance criteria:**
- Tab tone matches other tabs
- Language stays observational
- Feels cohesive with dashboard voice

---

## TALK

### R2-T1
**Tab**: Talk  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- "Coming soon" section for Talk feature
- Styling is functional but not distinctive
- Doesn't feel special or premium

**Why it hurts:**
- Coming soon features should create anticipation
- Current styling doesn't convey value

**Fix intent (no logic changes):**
- Improve visual treatment to feel premium and distinctive (presentation only)
- Add subtle visual flourish (icon, border, or spacing) (presentation only)
- Ensure section stands out without being loud (presentation only)

**Acceptance criteria:**
- Coming soon section feels special and premium
- Visual style is calm but distinctive
- Creates positive anticipation

---

### R2-T2
**Tab**: Talk  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Waitlist module explains value but copy is spread across multiple blocks
- Value proposition is diluted
- Takes up more space than needed

**Why it hurts:**
- Users have to work to understand what they're signing up for
- Copy should be tighter and more compelling

**Fix intent (no logic changes):**
- Consolidate value proposition into one tight block (2-3 sentences max) (presentation only)
- Lead with clearest benefit (presentation only)
- Remove redundant explanatory text (presentation only)

**Acceptance criteria:**
- Value is clear in one glance
- Copy is concise and compelling
- Takes up less vertical space

---

### R2-T3
**Tab**: Talk  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Email input form has basic validation
- Success state is minimal or generic
- Error states may not be clear

**Why it hurts:**
- Form feels basic, not premium
- Users don't get clear feedback

**Fix intent (no logic changes):**
- Improve validation messages (clearer, friendlier) (presentation only)
- Enhance success state (confirmation message, visual feedback) (presentation only)
- Ensure error states are clear and actionable (presentation only)

**Acceptance criteria:**
- Form validation feels premium and helpful
- Success state is clear and encouraging
- Error messages are specific and actionable

---

### R2-T4
**Tab**: Talk  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Privacy microcopy near email form is present but may be wordy or unclear
- Should reassure users simply and quickly

**Why it hurts:**
- Users need quick reassurance about email privacy
- Long privacy copy gets skipped

**Fix intent (no logic changes):**
- Shorten privacy text to one clear sentence (presentation only)
- Use trust-building language consistent with dashboard voice (presentation only)
- Ensure placement is clear (near form, not buried) (presentation only)

**Acceptance criteria:**
- Privacy statement is one sentence
- Language is clear and reassuring
- Consistent with trust discipline

---

### R2-T5
**Tab**: Talk  
**Severity**: P2  
**Status**: OPEN

**What you see now:**
- Waitlist CTA button may have inconsistent styling compared to other dashboard buttons
- States (hover, focus, disabled) may not match dashboard system

**Why it hurts:**
- Button feels like it's from a different UI
- Inconsistent visual system

**Fix intent (no logic changes):**
- Match button styling to dashboard button system (presentation only)
- Ensure hover, focus, and disabled states are consistent (presentation only)
- Match sizing and spacing to other CTAs (presentation only)

**Acceptance criteria:**
- Button styling matches dashboard system
- All states (hover, focus, disabled) are consistent
- Feels cohesive with dashboard UI

---

## END OF BACKLOG
