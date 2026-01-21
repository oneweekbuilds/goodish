# Dashboard QA: 55 Known Issues - Master Backlog

**Created**: 2026-01-21  
**Status**: OPEN - No fixes applied yet  
**Last Updated**: 2026-01-21

---

## HOW WE WILL EXECUTE

### Fix Workflow
1. **Batch** 5–8 related issues together
2. **Implement** fixes for that batch
3. **Test** by running `node scripts/test-dashboard-smoke.mjs`
4. **Capture** before/after screenshots in `apps/alg-gemini/docs/screenshots/dashboard/`
5. **Commit** with issue IDs in message + tag the commit
6. **Repeat** until all 55 issues resolved

### Screenshot Convention
- **Location**: `apps/alg-gemini/docs/screenshots/dashboard/`
- **Naming**: `YYYYMMDD_tab_state_issueIDs.png`
  - Example: `20260121_ads_expanded_A1-A4.png`
- **States to capture per tab**:
  - Collapsed (default view)
  - Expanded ("More details" sections open)

---

## ISSUE SEVERITY DEFINITIONS

- **P0**: Trust breakers — makes users think "this is broken or contradictory"
- **P1**: Visual hierarchy / UX issues that hurt comprehension
- **P2**: Polish / consistency issues that don't block understanding

---

## CROSS-TAB ISSUES (X1–X5)

### X1 — "OBSERVED IN THIS SCAN" contradicts the product's "window" framing
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Copy contradiction
- Multiple tabs still show "OBSERVED IN THIS SCAN" while the rest of the UX says "during this window," "across your last N scans," etc. Creates instant trust break.
- **Done means**: All scope references use consistent language system-wide. If product uses "window" aggregation, say "during this window" everywhere. Never mix.

### X2 — Scope labels conflict across the same view
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Data contradiction
- Example patterns: page header says 115 scans, a pill says 108 scans, and "How we measure" says 105 or another number. Users will assume something is broken or cherry-picked.
- **Done means**: Single canonical scope calculation per tab. All references to scan count/window must derive from one source of truth and match exactly.

### X3 — "Try this" content is inconsistent with the "no generic advice" decision
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / UX consistency
- Several tabs still show "Try this" sections with generic actions (follow/unfollow, engage differently). You explicitly removed this earlier, but it reappears and feels preachy.
- **Done means**: Either remove all "Try this" sections or make them specific to observed patterns with no generic "follow/unfollow" advice.
- **Resolution**: Removed all generic "You could try" action fields across patterns, creators, and algorithm tabs (set to null).

### X4 — Confidence signaling is inconsistent or contradictory
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Logic contradiction
- Examples: "Low confidence estimate" inside a card + a "Higher confidence" badge on the same card. Or a low-confidence banner at top of tab but "Higher confidence" badges throughout.
- **Done means**: Confidence labeling rules are consistent. If a section has low confidence banner, individual cards cannot show "higher confidence" unless explicitly comparative.

### X5 — Expanded-state UX is visually noisy and feels "prototype-y," not Oura-level
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy / Polish
- When expanding details, spacing, typography density, and repeated boilerplate ("How we measure," scope lines, disclaimers) create a wall of tiny text that looks unconsidered.
- **Done means**: Expanded state has clear visual hierarchy, comfortable spacing, consolidated explanatory text (not repeated per card), and reads as premium product.
- **Resolution**: Removed redundant SectionHeader in expanded "More details", increased card padding (p-4 to p-5), increased gap between cards (gap-5 to gap-6), increased spacing between elements (mb-2.5 to mb-3).

---

## ADS & INFLUENCE (A1–A10)

### A1 — Platform naming inconsistency inside Ads by-platform card
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Naming consistency
- The list includes both Twitter and X in the same breakdown (and/or across the dashboard). This is a blatant credibility hit.
- **Done means**: Use "X" consistently everywhere. No "Twitter" references in any user-facing copy or data labels.

### A2 — Hero scope mismatch: "Across your last 108 scans" vs other dashboard totals
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Data contradiction
- Dashboard header says 115 scans, Ads hero says 108, and other sections reference different counts. Needs one canonical scope label per tab.
- **Done means**: All scope references in Ads tab derive from single calculation and display identical numbers.

### A3 — Hero sentence claims interpretive insight while evidence feels underexplained
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Evidence clarity
- "Steering you toward sponsored offers as background noise" is crisp, but the supporting evidence doesn't clearly define what counts as "sponsored," what the denominator is, and why "background noise" maps to the shown trend.
- **Done means**: Hero copy connects clearly to visible evidence. Either make interpretation more grounded or soften claim language.
- **Resolution**: Changed to "Sponsored content appears regularly — promotions are present but not dominant."

### A4 — Line chart x-axis labeling is cramped and confusing
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy / Bug appearance
- The x-axis repeats "Dec 31" with stacked tiny % labels under each tick. It looks broken and undermines "premium dashboard" feel.
- **Done means**: Chart x-axis shows clean date labels (de-duplicated, readable spacing) and looks polished.
- **Resolution**: Increased spacing (mt-1 to mt-2), improved label separation (mb-0.5), increased value font weight and size (text-[13px] font-semibold), wider max-width (60px to 70px).

### A5 — 8% displayed as a big number competes with the actual insight
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy
- Even after hierarchy tuning, the big "8%" still reads as the headline, not the interpretive sentence. Oura-style would make the sentence the hero and the % a supporting annotation.
- **Done means**: Visual hierarchy makes interpretive sentence primary, with percentage as supporting detail (smaller, less prominent).
- **Resolution**: Added `deemphasize` prop to BigNumber component for primary hero cards - reduces size from text-3xl to text-2xl and opacity from 90% to 60%.

### A6 — "Where the selling comes from" section mixes metaphors and scope language
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy consistency
- Header says "Where the selling comes from," but subcopy says "in this scan window," while other areas say "during this window," and elsewhere "across last N scans." Needs one consistent system.
- **Done means**: Section uses same scope language pattern as rest of Ads tab.
- **Resolution**: Changed all "scan window" references to "window" in ads tab section headers and anchor messages for consistency.

### A7 — Possibly Promotional card is redundant and reads like a false precision machine
- **Status**: OPEN
- **Severity**: P2
- **Type**: Copy / Trust
- It says ~0% in multiple lines, repeats itself, and the "low confidence" treatment does not match the confidence badge. Also: "no potential promotional signals" is too absolute if it's heuristic.
- **Done means**: Either suppress card when signal is insufficient, or use softer language ("no obvious promotional signals detected") and ensure confidence labeling is consistent.

### A8 — "More details" preview text is cluttered and not user-centered
- **Status**: OPEN
- **Severity**: P2
- **Type**: Copy / UX
- The preview lists internal categories ("Possibly Promotional (Unlabeled…)") rather than what value the user gets ("Unlabeled promos and what's being pitched").
- **Done means**: Preview text describes user value, not internal classification labels.

### A9 — Ads-products "low signal" copy is unclear and feels defensive
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Empty state
- "Only 3 keyword matches across all ads" doesn't tell the user what to do, whether that's expected, or how many ads were analyzed. It feels like the system shrugging.
- **Done means**: Low-signal copy provides context ("we analyzed X ads but only found 3 product keywords") and calm guidance about what this means.
- **Resolution**: Changed to "Found X product keyword matches. This may mean ads were subtle, or few ads appeared."

### A10 — Footer + meta repetition creates bloat
- **Status**: OPEN
- **Severity**: P2
- **Type**: Copy / Visual bloat
- Scope lines like "Across your last 108 scans" appear multiple times (hero, measure box, footer). It feels unedited.
- **Done means**: Scope information appears once prominently, not repeated in every section.

---

## POLITICS & WORLDVIEW (P1–P10)

### P1 — Top warning banner is awkward and confusing ("Enable")
- **Status**: FIXED
- **Severity**: P1
- **Type**: UX / Copy clarity
- The banner says political leaning estimates are low confidence, then shows an "Enable" control. It's unclear what gets enabled and why the user should. Feels like an unfinished feature flag.
- **Done means**: Banner clearly explains what enabling does, or is repositioned/reframed as an opt-in control with clear value prop.
- **Resolution**: Changed banner copy to "Optional: Show viewpoint distribution estimate" with explanation "Enabling shows which perspective keywords appeared more. Does not measure accuracy or your beliefs."

### P2 — Still uses "OBSERVED IN THIS SCAN" while content is windowed
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Copy contradiction
- Same core contradiction as X1, but especially damaging in politics because it invites "this is cherry-picked."
- **Done means**: All Politics tab scope references use consistent window language.

### P3 — Hero chart has cramped tick labels and reads as noisy
- **Status**: OPEN
- **Severity**: P1
- **Type**: Visual hierarchy
- The line chart has dense dates and tiny stacked percentages. The visuals feel like debug charts, not Oura-grade.
- **Done means**: Chart rendering has clean spacing, readable labels, and polished visual treatment.

### P4 — "Where political exposure concentrated" table produces misleading percentages
- **Status**: FIXED
- **Severity**: P1
- **Type**: Data display / Trust
- Rows like 1 post = 100% are not meaningful and look absurd. Needs suppression/aggregation rules in UI copy/formatting (without changing data logic, this can be solved via display rules).
- **Done means**: Table either suppresses meaningless rows or uses qualitative labels ("nearly all from X") when percentages would be misleading.
- **Resolution**: Table now uses qualitative labels ("all"/"some") when total posts ≤ 2.

### P5 — Table lacks explanation for what "Political Percent" means
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Labeling clarity
- Percent of that creator's posts? Percent of political posts? Percent of your total feed? The column label is ambiguous.
- **Done means**: Column header or tooltip clearly explains what the percentage represents.
- **Resolution**: Changed table columns from "politicalPosts"/"politicalPercent" to "Political posts"/"% of their posts".

### P6 — Viewpoint distribution section reads like it's claiming "lean" from keywords
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Trust
- Even with caveats, users will read it as "the app says my politics are X." The expanded copy needs to be more precise about exposure skew vs ideology classification.
- **Done means**: Copy clearly frames as "exposure pattern" not "your political identity," with boundary language that stays calm.
- **Resolution**: Changed whyExplanation to emphasize "exposure pattern only", takeaway to "shows which perspective keywords appeared more, not which is correct".

### P7 — Platform asymmetry conclusion is weird when most platforms are 0
- **Status**: OPEN
- **Severity**: P2
- **Type**: Copy / Logic
- "Leaned toward Twitter over TikTok" when TikTok is 0 reads robotic and low-value.
- **Done means**: Conclusion suppressed or reworded when comparison is meaningless (e.g., only one platform has political content).

### P8 — Confidence badges contradict the low-confidence framing
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Logic contradiction
- If the banner says the leaning estimate is low confidence, the "Higher confidence" badges in the same region feel wrong.
- **Done means**: Confidence labeling is internally consistent (same as X4 but specific to Politics tab).

### P9 — "Try this" appears again (generic behavioral advice)
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Tone consistency
- This reintroduces tone you already decided to remove and makes the product feel preachy.
- **Done means**: Generic "Try this" advice removed from Politics tab.
- **Resolution**: Politics tab already had action: null for all non-hidden views. Fixed as part of X3 cross-tab cleanup.

### P10 — Summary card repeats the hero rather than adding a new synthesis
- **Status**: OPEN
- **Severity**: P2
- **Type**: UX / Redundancy
- It should either disappear or answer a distinct question (source concentration, platform driver) without parroting.
- **Done means**: Summary section adds new insight or is removed. Does not repeat hero content.

---

## PATTERNS IN YOUR FEED (PA1–PA10)

### PA1 — Hero claims "Your feed broadened" while card shows "Insufficient data"
- **Status**: FIXED
- **Severity**: P0
- **Type**: Trust breaker / Logic contradiction
- This is a direct contradiction. If the hero cannot be supported, the hero needs a "not enough signal" variant, not a confident conclusion.
- **Done means**: Hero only renders interpretive claim when data is sufficient. Otherwise shows calm "insufficient data" state.
- **Resolution**: Takeaway now returns null if data/topTopics is missing or empty.

### PA2 — "Insufficient data requires 20 posts" empty state is visually harsh and generic
- **Status**: FIXED
- **Severity**: P1
- **Type**: Empty state / Tone
- It feels like an error state, not a premium product. It should tell the user what to do next and why 20 matters, calmly.
- **Done means**: Empty state uses calm, helpful language explaining why threshold exists and what user can do.
- **Resolution**: Title changed to "Not enough data yet", message explains why threshold matters ("individual items have too much influence").

### PA3 — Still says "OBSERVED IN THIS SCAN"
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Copy contradiction
- Same contradiction, but especially glaring because patterns are inherently about trends/time windows.
- **Done means**: Patterns tab uses consistent window language throughout.

### PA4 — "How topics distributed" card uses unclear terminology
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Labeling clarity
- "Distribution" vs "concentration" vs "variety" are mixed, and the card doesn't clearly distinguish what it's measuring.
- **Done means**: Card uses one clear term consistently and explains what it measures.
- **Resolution**: Changed patterns-echo-risk title from "How concentrated the top themes were" to "Topic concentration" for clarity.

### PA5 — Attention tactics card shows "5%" as a headline with weak interpretation
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy / Copy
- The number doesn't map to meaning, and the explanation is tiny. Needs a clearer interpretive sentence or a better "low signal" treatment.
- **Done means**: Either make interpretation primary (with % secondary), or use low-signal treatment when percentage lacks context.
- **Resolution**: Reordered takeaway logic to check sample size first, shows "Limited sample — need more posts" when total < 20 before showing percentage.

### PA6 — Emotional Tone section feels out of place and visually loud
- **Status**: OPEN
- **Severity**: P2
- **Type**: Visual hierarchy / Tone
- The saturated green-to-red bar reads as judgmental and not aligned with the calm Oura aesthetic (also feels like sentiment analysis overclaim). Even if you keep it, the presentation needs to be gentler and more precise.
- **Done means**: Either tone down visual treatment (softer colors, less saturated) or add clearer framing about what emotion detection can/cannot do.

### PA7 — Emotional tone legend is unreadable at this size
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy / Bug appearance
- Text is tiny and cramped; it looks broken in expanded mode.
- **Done means**: Legend is readable with comfortable font size and spacing.
- **Resolution**: Increased legend text size from 14px to 13px with better spacing, made font medium weight.

### PA8 — "More details" section creates a wall of microcopy
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy / UX
- Too many repeated "How we measure" blocks; the density kills trust and premium feel.
- **Done means**: Consolidate explanatory text, improve spacing, make expanded state feel considered and calm.
- **Resolution**: Increased spacing in "How we measure" blocks, text size to 13px, padding to p-4, row spacing to 2.5, shortened whyExplanation text.

### PA9 — "Try this" section returns (generic advice)
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Tone consistency
- Conflicts with earlier editorial decision.
- **Done means**: Generic "Try this" advice removed from Patterns tab.
- **Resolution**: Removed 4 action fields with generic advice in patterns tab (set to null).

### PA10 — Summary conflicts with hero/empty-state logic
- **Status**: FIXED
- **Severity**: P0
- **Type**: Trust breaker / Logic contradiction
- Example: summary says "Your feed covers 16 topics" while hero shows insufficient data. Either the empty state or the summary logic needs a coherence rule.
- **Done means**: Summary and hero draw from same data availability check and never contradict each other.
- **Resolution**: Summary now checks chartQuality (not just hasData) before adding topic insight.

---

## CREATORS & VOICES (C1–C10)

### C1 — "OBSERVED IN THIS SCAN" persists
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Copy contradiction
- Contradicts the "window" framing used elsewhere.
- **Done means**: Creators tab uses consistent window language throughout.

### C2 — Handle formatting is inconsistent and looks sloppy
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual consistency
- Some are handles, some are display names ("Elon Musk"), capitalization differs, spacing differs. Needs normalization in presentation.
- **Done means**: Creator names follow consistent format rules (e.g., always @handle, or always display name with handle secondary).
- **Resolution**: Added `normalizeCreatorName()` helper function in dataHelpers - converts all-lowercase/all-uppercase to title case, preserves intentional mixed case. Applied to all 6 locations where creator displayName is used.

### C3 — Table columns are unclear ("Posts" and "Share" of what?)
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Labeling clarity
- Is "Posts" count across window? "Share" of total feed? Needs explicit labeling.
- **Done means**: Column headers clearly state what they measure (e.g., "Posts in window" / "% of your feed").
- **Resolution**: Changed column headers from "posts" / "share" to "Posts in window" / "% of your feed".

### C4 — The hero conclusion ("no single account dominated") doesn't feel justified
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Logic clarity
- Top share is 6%. Maybe that's "not dominated," but the UI should explain the threshold for "dominated," or use softer language.
- **Done means**: Either explain threshold, or use neutral language like "content came from multiple creators" without claiming non-dominance.
- **Resolution**: Replaced "dominated" language with softer phrases: "appeared very frequently", "appeared most often", "content came from X voices".

### C5 — "How we measure" block is too dense and tiny
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy
- Expanded state becomes unreadable, looks like debug notes, not product.
- **Done means**: Explanatory text has comfortable reading size and spacing.
- **Resolution**: Same fix as PA8 - increased text size, spacing, and padding in "How we measure" component.

### C6 — Still includes generic "You could try…" advice
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Tone consistency
- Conflicts with your "remove try-this advice" decision.
- **Done means**: Generic advice removed from Creators tab.
- **Resolution**: Removed action field with generic "follow new accounts" advice (set to null).

### C7 — "Does this match your experience?" / feedback affordance appears (or remnants)
- **Status**: OPEN
- **Severity**: P2
- **Type**: UX / Dead UI
- This feels like an unfinished feature and lowers trust.
- **Done means**: Feedback affordance removed or fully implemented with working backend.

### C8 — Cross-platform section reads low-value when empty
- **Status**: OPEN
- **Severity**: P2
- **Type**: Empty state / Copy
- "No accounts appeared across multiple platforms" is a dead end. Needs a better empty-state that still teaches something.
- **Done means**: Empty state explains what this would show if detected, or section is hidden when no data.

### C9 — The "More details" organization doesn't match user mental model
- **Status**: OPEN
- **Severity**: P2
- **Type**: UX / Information architecture
- "Additional detail" and "Summary" sections feel redundant and not clearly differentiated.
- **Done means**: Sections have clear distinct purposes or are consolidated into one well-organized expanded view.

### C10 — Summary list at bottom looks like it's labeling creators ("promotions", "general content")
- **Status**: OPEN
- **Severity**: P2
- **Type**: Copy / Trust
- Feels arbitrary and not obviously evidence-based. If kept, it needs clearer justification or different phrasing.
- **Done means**: Either provide clear evidence trail for labels, or remove speculative categorization.

---

## WHAT THE ALGORITHM THINKS (W1–W10)

### W1 — The tab name itself ("What the Algorithm Thinks") implies mind-reading
- **Status**: OPEN
- **Severity**: P0
- **Type**: Trust breaker / Copy overclaim
- Even if you fixed some copy, the label invites overclaim. Consider renaming in UI (if allowed) or adding a calmer framing line right under the tab header (without disclaimers).
- **Done means**: Tab name changed to avoid mind-reading implication (e.g., "Observed Patterns" or "Feed Signals"), or prominent framing line clarifies observational nature.

### W2 — Hero still risks feeling like identity labeling even with "feed/signals"
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Trust
- "The system is associating your feed with Sports and Food" is better, but still feels like "this is who you are." Needs a sharper boundary line that stays calm and non-defensive.
- **Done means**: Copy clearly distinguishes between "topics that appeared" vs "what you are" without sounding defensive.
- **Resolution**: Changed algo-topics-liked takeaway from "appeared most frequently" to "surfaced most often in your feed" - emphasizes platform action, not identity.

### W3 — Topic list presentation feels like raw tags, not insight
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy / UX
- The vertical list (Sports, Food, Tech…) lacks grouping, ordering explanation, or "why these" clarity.
- **Done means**: Topic list has clear organizing principle (frequency, recency, etc.) or context about why these topics matter.
- **Resolution**: Added rank indicators (#1, #2, etc.) as subtext for top 5 topics in algo-topics-liked view to show ordering principle.

### W4 — Expanded "How we measure" text is cramped and repetitive
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy
- Same wall-of-text issue, but more harmful here because users are sensitive to misclassification.
- **Done means**: Expanded text is well-spaced and consolidated (not repeated across cards).
- **Resolution**: Already fixed in PA8/C5 - "How we measure" component spacing improved (text-[13px], p-4, row spacing 2.5). Additional X5 fixes further reduced visual noise in expanded sections.

### W5 — "What the system is reinforcing" section repeats the hero themes
- **Status**: OPEN
- **Severity**: P2
- **Type**: UX / Redundancy
- It needs to add something different (persistence across time, not just re-listing).
- **Done means**: Section adds distinct insight or is removed to avoid repetition.

### W6 — "Extrapolated future associations" is scary and reads like prediction
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Trust
- Even with "speculation," the UI looks like it's forecasting your future identity. Needs calmer language and clearer "why user should care."
- **Done means**: Section is removed, or reframed with prominent speculation framing and softer language.
- **Resolution**: Title changed to "If current trends continued (speculation)", takeaway reframed to emphasize "not a forecast".

### W7 — The speculation card contains too much text and not enough structure
- **Status**: OPEN
- **Severity**: P2
- **Type**: Visual hierarchy / UX
- It's a paragraph blob. Needs scannable structure (what, why, confidence) without adding new logic.
- **Done means**: Content has clear structure with headers/sections, not a wall of text.

### W8 — "Try this" advice comes back (follow/search/mute)
- **Status**: FIXED
- **Severity**: P1
- **Type**: Copy / Tone consistency
- Conflicts with the earlier editorial direction; also can feel manipulative ("train your feed").
- **Done means**: Generic "Try this" advice removed from Algorithm tab.
- **Resolution**: Removed action field with generic "engage with different content" advice (set to null).

### W9 — "Summary" header says "Current algorithmic interpretation" but the content below looks like a checklist
- **Status**: OPEN
- **Severity**: P2
- **Type**: Copy / Visual mismatch
- Feels like an MVP coaching panel, not an Oura-grade insight page.
- **Done means**: Either improve summary presentation or change header to match actual content style.

### W10 — Multiple scope lines repeat (scans/platforms/window) in too many places
- **Status**: OPEN
- **Severity**: P2
- **Type**: Copy / Visual bloat
- The page feels cluttered and "explainy," not calm.
- **Done means**: Scope information consolidated and appears once prominently per section, not repeated everywhere.

---

## TALK TO YOUR ALGORITHM (T1–T5)

### T1 — Tab label is truncated in the top nav ("Ta")
- **Status**: FIXED
- **Severity**: P1
- **Type**: Visual hierarchy / Bug appearance
- Looks broken and cheap.
- **Done means**: Tab label either shortened to "Talk" or nav layout ensures full label is visible.
- **Resolution**: Tab label shortened from "Talk to Your Algorithm" to "Talk".

### T2 — The green panel background is too large and too saturated
- **Status**: OPEN
- **Severity**: P2
- **Type**: Visual hierarchy / Polish
- It dominates the page more than any other tab and feels like a different design system.
- **Done means**: Green panel is toned down (smaller area, softer color) to match rest of dashboard aesthetic.

### T3 — The "Beta feature • coming soon" pill styling feels off-brand
- **Status**: OPEN
- **Severity**: P2
- **Type**: Visual consistency
- It looks like a random badge component. Needs alignment with the rest of the UI.
- **Done means**: Badge styling matches dashboard design system.

### T4 — The description copy is long and slightly repetitive
- **Status**: OPEN
- **Severity**: P2
- **Type**: Copy / Editing
- "Calm, evidence-first… cite what we observed… show uncertainty… avoid speculation… guardrails… tuned to earn trust" repeats the same promise 3 times.
- **Done means**: Copy edited to be concise while preserving key value props.

### T5 — Waitlist module feels generic and not premium
- **Status**: OPEN
- **Severity**: P2
- **Type**: Visual hierarchy / Polish
- Placeholder "you@domain.com" + "Notify me" button is fine, but the layout/spacing feels like a standard form, not an Oura-grade "early access" module.
- **Done means**: Waitlist module has polished spacing, typography, and visual treatment matching dashboard quality bar.

---

## SUMMARY

- **Total issues**: 55
- **P0 (Trust breakers)**: 15
- **P1 (UX/comprehension)**: 29
- **P2 (Polish)**: 11
- **Status**: All OPEN, no fixes applied yet

Next step: Begin batching related issues for implementation following the workflow above.
