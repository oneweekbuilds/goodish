# AlgorithmLens Dashboard Audit

**Date:** February 14, 2026
**Scope:** Dashboard tab — all 6 sub-tabs (Overview, Sources, Ads, Politics, Tone, Suggested vs Followed)
**Evaluation criteria:** Value of insights, visual appeal, digestibility for non-technical users

---

## Executive Summary

AlgorithmLens has a solid data pipeline and thoughtful quality-gating system underneath. The architecture (custom SVG/CSS charts, scanAggregator → dataHelpers → insightBuilders → ViewCard) is well-designed for the product's needs. However, the dashboard currently reads more like a **data dump with explanatory text** than a **personal feed intelligence report**. The insights feel informational rather than revelatory, and the visual presentation undercuts the perceived value of what's actually a sophisticated analysis.

The core tension: you've built something genuinely useful, but the UI makes it feel like a free tool rather than something worth paying for. The fixes below focus on closing that gap.

---

## Audit Area 1: Insight Value — "Is this worth paying for?"

### Current State

The dashboard surfaces real, computed metrics (source concentration %, ad share %, political exposure %, tone split). The InsightHero component does a good job of framing a key takeaway per tab. The experiment suggestion system in OverviewTab is a genuinely clever feature that gives users actionable next steps.

### Problems

**1.1 — Insights feel descriptive, not revelatory**
Most takeaways restate the chart in words. For example, the ads tab takeaway says *"Sponsored content appears regularly. Promotions are present but not dominant."* — this is what the user can already see from the 14% number. A paying user wants the *implication*, not the observation. Compare: *"At 14%, you're seeing roughly 1 ad for every 7 posts. That's 8 minutes of ad content in a typical 60-minute scroll session."*

**Recommendation:** Rewrite all `takeaway` functions in `dashboardCatalog.js` to follow a pattern of **observation → implication → context**. The observation is the number. The implication is what it means for their time/attention. The context is how it compares (to averages, to their previous scans, to benchmarks).

**1.2 — No benchmarks or comparisons**
Every metric exists in isolation. "Your top 5 sources account for 62% of posts" means nothing without context. Is that high? Low? Normal? The user has no frame of reference. This is the single biggest gap in perceived value.

**Recommendation:** Add benchmark ranges to each key metric. These can be derived from aggregate anonymized user data, or, if that's not available yet, from published research on social media feed composition. Display as a subtle range indicator below each big number: e.g., "Typical range: 40–70%" or a simple marker showing where the user falls on a spectrum. Even qualitative labels ("Lower than most users" / "About average" / "Higher than most") add enormous perceived value.

**1.3 — The "So What?" is buried or missing**
The `whyCare` field in InsightHero is excellent in concept but the copy is often generic. For example, the political tab's whyCare says something about exposure not equaling belief formation — that's a disclaimer, not a value proposition. Users want to know: "What should I do differently?" or "What does this reveal about how the platform sees me?"

**Recommendation:** Make the whyCare copy specific to the user's actual data. If their political exposure is 23%, the whyCare should say something like *"At this level, roughly 1 in 4 posts you scroll past carries political framing. This is high enough that it likely shapes your perception of how politically charged social media is."*

**1.4 — Mini Calculators are a hidden gem, but feel like afterthoughts**
The "minutes per day advertised to" and "minutes per day on political content" calculators in OverviewTab are genuinely compelling — they translate abstract percentages into felt time. But they're buried below the 4 topline cards, styled as plain white boxes, and the default of 30 minutes feels arbitrary.

**Recommendation:** Elevate these calculators. Make them visually distinct (perhaps with a slight gradient or icon treatment). Pre-fill with the user's actual average session time if available, or default to platform-specific averages (e.g., 53 minutes/day for TikTok). Consider making them the *lead* insight on the Overview tab — "You spend approximately X minutes per day being advertised to" is a more powerful opener than "Top 5 sources accounted for Y%."

**1.5 — Experiment Suggestions need more specificity**
The `generateSuggestions()` function produces good directional advice ("Try following 5 new accounts in a different niche"), but the suggestions are the same regardless of which platform the user scanned. They should reference the specific platform and the specific accounts/topics involved.

**Recommendation:** Make suggestions platform-aware and reference actual data. Instead of "Try following 5 new accounts in a different niche," say "Try following 5 accounts outside of [top topic] on [platform]. Your feed is currently 62% dominated by your top 5 sources, led by @[handle]."

---

## Audit Area 2: Visual Design — "Does this look premium?"

### Current State

The dashboard uses Tailwind CSS with a clean, minimal aesthetic. White cards on light backgrounds, slate text, rounded corners. The InsightHero has a subtle blue left-border accent. Charts are custom SVG/CSS with no external dependencies.

### Problems

**2.1 — Visual monotony across all tabs**
Every tab follows the same pattern: blue-accented InsightHero → white card → white card → white card → master numbers footer. There's no visual rhythm, no hierarchy beyond "primary card is slightly bigger." The eye has nowhere to rest and nowhere to be drawn. The entire dashboard looks like the same card repeated with different text.

**Recommendation:** Introduce visual differentiation between card types. Primary cards should feel substantially different from supporting cards — not just a left border, but perhaps a different background treatment, larger typography, or an embedded micro-visualization. Consider alternating card widths (full-width hero, then 2-column grid, then full-width summary) to create visual rhythm. Each tab should have a distinct visual "moment" — a chart or visualization that feels like the centerpiece.

**2.2 — Charts are too simple and too small**
The `BarChartSimple` component caps at 5 bars and uses basic CSS width percentages. The `StackedBar100` is a single 32px-tall bar. The `BigNumber` is just styled text. These feel adequate for a prototype but not for a paid product. There's no animation, no interactivity, no visual delight.

**Recommendation:**
- **StackedBar100:** Increase height to 48-56px. Add a subtle entrance animation (segments growing from left). Show values on hover/tap, not just in the legend. Consider a donut chart variant for the Overview tab's composition metrics — donuts are more visually engaging and feel more "dashboard-like."
- **BarChartSimple:** Add subtle entrance animations (bars growing from left). Consider horizontal labels above bars instead of truncated labels to the left. The 32-character truncation on labels means users can't read creator names.
- **BigNumber:** Add a circular progress indicator or gauge behind the number for percentage values. A bare "62%" looks like a spreadsheet; "62%" inside a subtle radial gauge looks like a premium health app.
- **General:** Consider adding Framer Motion animations (already in the dependency list) for chart entrance effects. Even a 200ms fade-in + slide-up makes the dashboard feel significantly more polished.

**2.3 — Color palette is too restrained**
The entire dashboard uses essentially 4 colors: blue (#2563EB), slate gray, and the tone pastels (green #86EFAC, red #FCA5A5). Everything feels the same temperature. There's no color coding by tab or metric type.

**Recommendation:** Assign each tab a subtle color accent (while keeping blue as primary). For example: Sources = indigo, Ads = amber, Politics = purple, Tone = teal. This doesn't mean garish colors — just a shifted accent on the InsightHero border, the primary card's accent line, and chart fills. This gives each tab a distinct identity and makes navigation feel more purposeful. The tone pastels (green/slate/red) are good and should stay.

**2.4 — Too much text, not enough visual information**
The `ViewCard` component has extensive text regions: eyebrow → title → description → takeaway → chart → why explanation → counterfactual → action → confidence disclaimer → "How we measure" section. Many cards are 80% text and 20% visualization. Non-technical users scan visuals first and read text second.

**Recommendation:** Flip the ratio. Make the chart/visualization the dominant element (60-70% of card height). Reduce text to: one headline + one takeaway sentence + expandable detail. Move "How we measure," counterfactual notes, and confidence disclaimers behind a "Learn more" or info icon toggle. The card should communicate its message visually within 2 seconds, with text as reinforcement.

**2.5 — Empty states feel like broken features**
When data is insufficient, the current empty states show italic gray text like "Not enough posts in this window." This looks like an error, not a pending feature. For a paid product, empty states should feel intentional and encouraging.

**Recommendation:** Design proper empty states with illustrations or icons. Show a progress indicator toward the data threshold (e.g., "12 of 20 posts needed — scan again to unlock this insight"). Make the empty state feel like anticipation, not absence.

**2.6 — No dark mode or theme awareness**
The dashboard is hardcoded to light mode with white backgrounds. Many users, especially the tech-savvy audience likely to use AlgorithmLens, prefer dark mode.

**Recommendation:** This is lower priority than other items, but worth noting. Using Tailwind's `dark:` variant system, implement a dark mode that maps the slate palette to dark backgrounds. This also adds perceived polish.

---

## Audit Area 3: Digestibility — "Can a non-technical user understand this in 30 seconds?"

### Current State

The copy is generally good — plain language, no jargon, observation-based rather than judgmental. The Phase 8 principles in `dashboardCatalog.js` (one primary card per tab, max 2 secondary, language a non-technical user understands) are sound design rules.

### Problems

**3.1 — Information overload on the Overview tab**
The Overview tab currently shows: InsightHero + TrendsCTA + Feed Summary (bullet list) + AI Likelihood section + 4 topline metric cards (2×2 grid) + 2 mini calculators + experiment suggestions + master numbers line. That's 10+ distinct content blocks on a single screen. A new user will scroll once and feel overwhelmed.

**Recommendation:** Restructure the Overview as a focused "feed receipt" with a clear visual hierarchy:
1. **Hero stat** — the single most surprising or important finding (auto-selected based on what deviates most from typical)
2. **4 metric cards** — keep the 2×2 grid but make each card more visual (gauge, donut, or icon-based) and less text-heavy
3. **"Your feed in minutes"** — elevate the calculators into a visually distinct section
4. **"Try this"** — the experiment suggestion, styled as a call-to-action card
5. Move AI Likelihood, Feed Summary bullets, and master numbers into a collapsible "Details" section

**3.2 — Denominator lines are confusing**
Nearly every section ends with a `DenominatorLine` that says something like "Percent of posts in the selected date range (160 posts)." This is statistically correct but reads as jargon. Non-technical users don't think in terms of denominators.

**Recommendation:** Replace denominator lines with plain context: "Based on 160 posts from your last scan" or even simpler, move the post count into the InsightHero's meta line and don't repeat it on every card. One mention per tab is sufficient.

**3.3 — Tab names don't communicate value**
The current tabs are: Overview, Sources, Ads, Politics, Tone, Suggested vs Followed. These are category labels, not value propositions. A user scanning tabs doesn't know what they'll learn.

**Recommendation:** Consider renaming tabs to questions or outcomes:
- "Overview" → "Your Feed Report" or keep as "Overview"
- "Sources" → "Who Shapes Your Feed"
- "Ads" → "What's Selling to You"
- "Politics" → "Political Exposure"
- "Tone" → "Emotional Tone"
- "Suggested vs Followed" → "Algorithm's Picks"

These names immediately communicate what the user will learn, not just what category of data they'll see.

**3.4 — Stacked bar legends are information-dense**
The `CompositionBar100WithCounts` legend shows: color dot + label + percentage + count for every segment. For example: "🔵 Ads clearly labeled as ads: 14% (23)". This is a lot of text for a legend item, especially on mobile. The label "Ads clearly labeled as ads" is redundant and long.

**Recommendation:** Shorten segment labels dramatically. Instead of "Ads clearly labeled as ads" → "Labeled ads." Instead of "Likely selling, not labeled as an ad" → "Unlabeled promos." Instead of "Positive or happy tone" → "Positive." Show counts only on hover/tap or in expanded view. The bar itself, with inline percentages for segments ≥10%, communicates the distribution — the legend should clarify, not overwhelm.

**3.5 — The Tone tab's side-by-side comparisons are hard to parse**
The Tone tab shows "Political posts vs Non-political posts" and "Selling posts vs Not selling posts" as side-by-side `CompositionBar100WithCounts` bars. Each bar has the same 3 segments (positive/neutral/negative) with the same colors. Users need to visually compare 6 numbers across 2 bars to extract the insight.

**Recommendation:** Instead of showing two bars and asking the user to compare, show the *difference*. A single visualization that says "Political posts are 15% more negative than non-political posts" with a simple diverging bar or arrow is far more digestible. The side-by-side bars can remain as a "See details" expansion for users who want the raw numbers.

**3.6 — "How to read this" and "How we measure" add cognitive load**
These collapsible sections are well-intentioned but appear on nearly every card. Their presence suggests the card is hard to understand, which undermines confidence. The "How we measure" section within ViewCard adds 4-5 rows of methodology text that most users won't read.

**Recommendation:** Consolidate all methodology into a single "How AlgorithmLens Works" page accessible from the dashboard header. On individual cards, a small (i) icon that opens a tooltip or bottom sheet is sufficient. Remove the inline "How to read this" details elements entirely — if a card needs instructions to be understood, the card itself needs to be redesigned.

---

## Audit Area 4: Architecture & Technical Opportunities

**4.1 — DashboardPage.jsx is 120KB**
This is a monolithic file that handles tab switching, routing, and state management. While functional, it makes iteration slow and increases the risk of regressions.

**Recommendation:** Extract tab-switching logic, filter management, and trends panel state into custom hooks. Each tab already has its own component file, which is good, but the parent orchestrator should be leaner.

**4.2 — Redundant computation across tabs**
Several tabs independently call the same aggregation functions. For example, `aggregateAds()` is called in OverviewTab, AdsTab, and ToneTab. `aggregateCreators()` is called in OverviewTab, PoliticsTab, and SourcesTab.

**Recommendation:** Memoize aggregation results at the DashboardPage level and pass them down as props. Use `useMemo` keyed on `scans` and `scanDetails` to avoid redundant computation when switching tabs.

**4.3 — No loading skeletons**
The `useDashboardData` hook handles loading state, but there are no skeleton/shimmer components. While data loads, users see nothing or a spinner. Skeleton screens significantly improve perceived performance.

**Recommendation:** Create skeleton variants of ToplineMetricCard, InsightHero, and ViewCard that show animated placeholder shapes. This makes the dashboard feel faster and more polished.

**4.4 — Charts are not responsive to container width**
`BarChartSimple` uses a fixed `w-32` (128px) for labels and hardcoded gap/padding values. On narrow mobile screens, this leaves very little room for the actual bars. The stacked bars use percentage widths (which is good) but their legends wrap awkwardly on mobile.

**Recommendation:** Make chart components container-aware. Use CSS container queries or a ResizeObserver hook to adapt label placement, font sizes, and legend layout based on available width. On mobile, labels should move above bars rather than sitting beside them.

---

## Audit Area 5: Specific Tab-Level Recommendations

### Overview Tab
- Lead with the most surprising metric, not source concentration
- Make the "feed receipt" metaphor more literal — consider a receipt-style visual layout
- Collapse AI Likelihood section by default (it's secondary information)

### Sources Tab
- The "where influence concentrated" insight is strong — make the top creator's handle visually prominent (large, styled like a social handle)
- Add a simple visualization showing the power-law distribution (many creators with 1 post, few with many)

### Ads Tab
- Lead with the "minutes per day advertised to" calculator, not the percentage
- The "Tone split: selling vs not selling" section is an interesting comparison — but present it as a single insight ("Ads in your feed are X% more positive than non-ad content") rather than two separate bars
- The advertiser table is useful but visually plain — consider brand logos or at least colored badges

### Politics Tab
- The ideological distribution bar (Left/Neutral/Right) is visually stark with blue vs red. Consider softening the colors (currently #3B82F6 and #EF4444 are quite vivid)
- Add a prominent disclaimer that ideological classification is approximate — this is a sensitive area where perceived inaccuracy could cause users to distrust the entire product
- The "Top political source" section feels like it's pointing a finger — reframe as "Where political content concentrated" (which is already the title in dashboardCatalog, but the rendered section says "Top political source")

### Tone Tab
- This tab has the most side-by-side comparisons and the least clear single takeaway
- Consider leading with: "Your feed's emotional temperature" — a single metric that captures overall sentiment skew
- The top 5 positive/negative source lists are interesting but feel like they're judging the creators — add context like "These accounts posted the most content tagged as [positive/negative]"

### Suggested vs Followed Tab
- This is potentially the most "worth paying for" insight — it reveals the algorithm's hand
- Make the suggested percentage a BIG, prominent number with a gauge or dial
- Compare "what the algorithm chose for you" vs "what you chose" as a clear visual split

---

## Priority Ranking

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| **P0** | Add benchmarks/comparisons to key metrics (1.2) | Very High | Medium |
| **P0** | Rewrite takeaways for observation → implication → context (1.1) | Very High | Low |
| **P0** | Reduce text density, increase chart prominence (2.4) | High | Medium |
| **P1** | Elevate mini calculators (1.4) | High | Low |
| **P1** | Shorten segment labels (3.4) | High | Low |
| **P1** | Add chart entrance animations via Framer Motion (2.2) | High | Low |
| **P1** | Restructure Overview tab hierarchy (3.1) | High | Medium |
| **P1** | Replace denominator lines with plain context (3.2) | Medium | Low |
| **P1** | Improve empty states with progress indicators (2.5) | Medium | Medium |
| **P2** | Tab-specific color accents (2.3) | Medium | Low |
| **P2** | Rename tabs to value propositions (3.3) | Medium | Low |
| **P2** | Show tone differences as single insights, not dual bars (3.5) | Medium | Medium |
| **P2** | Add loading skeletons (4.3) | Medium | Low |
| **P2** | Memoize aggregation results (4.2) | Low | Low |
| **P2** | Platform-aware experiment suggestions (1.5) | Medium | Medium |
| **P3** | Consolidate methodology into single page (3.6) | Low | Low |
| **P3** | Make charts responsive (4.4) | Medium | High |
| **P3** | Dark mode (2.6) | Low | Medium |
| **P3** | Extract DashboardPage logic into hooks (4.1) | Low | Medium |

---

## Summary

The dashboard has three fundamental shifts to make:

1. **From data display to insight delivery.** Every card should answer "so what?" before showing "what." Benchmarks and implications are the single highest-leverage addition.

2. **From text-heavy to visual-first.** The current ratio is ~80% text / 20% chart. Flip it. Make charts bigger, more animated, and more interactive. Push methodology and caveats behind toggles.

3. **From uniform layout to visual hierarchy.** Each tab should have one clear visual "moment" — a chart or number that catches the eye and communicates the key finding in under 2 seconds. Everything else supports that moment.

These three shifts will move the dashboard from "interesting free tool" to "premium intelligence report I'd pay for."
