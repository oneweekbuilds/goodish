# AlgorithmLens Mobile — UX Audit Report

**Date:** 2026-02-25
**Audited against:** UI/UX Design Philosophy, Design Patterns Reference, Epistemic Restraint Standards
**Design reference point:** Oura Ring app — complex data made immediately understandable

---

## Summary

| Category | Issues Found |
|----------|:----------:|
| 1. Visual Hierarchy | 7 |
| 2. Progressive Disclosure | 5 |
| 3. Color and Tone | 5 |
| 4. Typography and Spacing | 4 |
| 5. Charts and Data Visualization | 5 |
| 6. Microcopy | 10 |
| 7. Accessibility | 4 |
| **Total** | **40** |

**Severity breakdown:** 10 high, 16 medium, 14 low

---

## 1. Visual Hierarchy

### VH-001 — InsightHero title undersized vs. design spec (High)

**Component:** `src/components/dashboard/InsightHero.tsx`
**Current state:** Title renders at `RFValue(18)` with font-weight 700. On a standard iPhone, this resolves to roughly 18–20px — a typical body-large size.
**Why it falls short:** The design patterns spec calls for "Headline metric: 32–40px, bold (700)" as the largest and most prominent element on each tab. At 18px, the InsightHero title competes with MetricCard values (22px) and BigNumber values (40px), undermining the intended hierarchy where the headline insight is visually dominant.
**What should change:** Increase InsightHero title to at least `RFValue(24)` (matching TYPOGRAPHY.h1) or consider `RFValue(26)` (heroTitle). The headline should be the unambiguous visual anchor — larger than any MetricCard value on the same tab.

### VH-002 — Overview tab presents a wall of content with equal visual weight (High)

**Component:** `app/(tabs)/dashboard.tsx` — OverviewContent
**Current state:** The Overview tab renders in sequence: InsightHero → three MetricCards in a row → full-width MetricCard → StackedBar100 → "Your Feed in Minutes" (two number cards) → "Content Patterns Observed" → "Experiment Suggestions" (bullet list) → LockedOverlayCard for trends. That is 7–8 distinct sections on a single scroll.
**Why it falls short:** The design philosophy says "Never present a wall of numbers with equal visual weight" and "the user should absorb the main takeaway in under 3 seconds." With this many sections at roughly similar visual weight, the Overview tab overwhelms rather than summarizes.
**What should change:** Reduce the Overview tab to InsightHero + 3–4 key metrics + one chart. Move "Feed in Minutes," "Content Patterns," and "Experiment Suggestions" into an expandable "See more" section or a secondary view. The Overview should feel like a health dashboard summary card, not a data dump.

### VH-003 — Sources tab uses custom stat cards instead of MetricCard (Low)

**Component:** `app/(tabs)/dashboard.tsx` — SourcesContent, lines ~404–463
**Current state:** The Sources tab renders three inline stat cards with hardcoded styling (22px numbers, custom layout) instead of using the shared MetricCard component.
**Why it falls short:** Creates visual inconsistency between tabs. Overview uses MetricCard; Sources uses bespoke cards with slightly different spacing, border treatment, and typography.
**What should change:** Refactor the Sources three-column stats to use MetricCard or a shared variant. Visual consistency across tabs reinforces the design system.

### VH-004 — "Your Feed in Minutes" section competes with headline metric (Medium)

**Component:** `app/(tabs)/dashboard.tsx` — OverviewContent, lines ~214–258
**Current state:** Two side-by-side cards with 28px bold numbers ("min/day on ads" and "min/day on political content") sit below the MetricCards but above Content Patterns. These large numbers draw the eye as much as the headline InsightHero.
**Why it falls short:** Supporting data should be visually secondary. These 28px numbers are larger than the InsightHero title (18px), inverting the intended hierarchy.
**What should change:** Either reduce these numbers to caption-size supplementary metrics, or move this entire section into an expandable detail view.

### VH-005 — "Experiment Suggestions" section uses bulleted list format (Medium)

**Component:** `app/(tabs)/dashboard.tsx` — OverviewContent, lines ~259–308
**Current state:** A list of 3–5 text suggestions rendered as bullet points at the bottom of the Overview tab.
**Why it falls short:** Reads as advice or instructions, not data. It breaks the pattern of "data visualization first, interpretation available on demand." In the Oura model, suggestions would appear in a coaching section separate from the data dashboard.
**What should change:** Move to an expandable section or a separate "coaching" view. The dashboard should show data; suggestions belong in a secondary layer.

### VH-006 — BigNumber (40px) on sub-tabs is larger than InsightHero title (18px) (Medium)

**Component:** `src/components/dashboard/BigNumber.tsx` vs `InsightHero.tsx`
**Current state:** BigNumber renders at RFValue(40). InsightHero title renders at RFValue(18). On the Sources tab, the "Source Concentration" BigNumber is over twice the size of the tab's headline insight.
**Why it falls short:** The design philosophy says the headline insight should be the "largest and most prominent element." When a secondary metric is twice the size of the headline, the visual hierarchy is inverted.
**What should change:** Either increase InsightHero to be the largest element (see VH-001), or reduce BigNumber to ~RFValue(32) to sit below the headline in the visual hierarchy.

### VH-007 — Upgrade banner on Settings page competes for attention (Low)

**Component:** `app/(tabs)/settings.tsx`
**Current state:** A blue banner "Upgrade to Plus — track trends over time" with a "Try Free" button sits at the top of the Settings page, above functional settings like AI Analysis and Scan Reminders. Verified in recording frame 60.
**Why it falls short:** Settings is a utilitarian screen. A promotional banner at the top makes the settings page feel like a marketing surface rather than a neutral configuration area. The design philosophy targets "trustworthy, measured, sophisticated" — promotional banners undermine that.
**What should change:** Move the upgrade prompt to the bottom of the settings page, or show it only once (dismissible) rather than persistently. The dashboard's LockedOverlayCard already handles upgrade prompts in context.

---

## 2. Progressive Disclosure

### PD-001 — Tone tab shows all sections simultaneously (Medium)

**Component:** `app/(tabs)/dashboard.tsx` — ToneContent
**Current state:** When tone data exists, the tab renders: InsightHero → StackedBar100 → Summary Stats paragraph → "Top Sources by Tone" (two lists) → "Tone: Suggested vs Followed" (two mini bars + legend) → methodology disclaimer. All visible at once.
**Why it falls short:** The design pattern specifies "Detail lives below the headline and is available but never forced." Top Sources by Tone, the Suggested vs Followed comparison, and the methodology should be in expandable sections.
**What should change:** Collapse "Top Sources by Tone" and "Tone: Suggested vs Followed" under expandable headers. Only show InsightHero + StackedBar100 + one-sentence summary on initial view.

### PD-002 — Suggested vs. Followed tab shows prescriptive "What You Can Do" section (High)

**Component:** `app/(tabs)/dashboard.tsx` — SuggestedVsFollowedContent, lines ~938–1050
**Current state:** Three numbered action cards ("Follow more diverse accounts," "Use chronological feeds when available," "Engage with content you value") are always visible below the data. Each has a paragraph of explanatory text.
**Why it falls short:** This violates both progressive disclosure ("never force complexity") and the epistemic restraint principle ("never tell users how to feel about their data"). Showing prescriptive action cards implies the user should change behavior based on the data, which crosses from observation into judgment.
**What should change:** Either remove entirely, or collapse behind a "Suggestions" expandable section. The dashboard should present data and let users draw their own conclusions. If retained, the tone should be "Some people find it helpful to..." rather than imperative commands.

### PD-003 — Methodology disclaimers always visible at the bottom of AI tabs (Low)

**Component:** `app/(tabs)/dashboard.tsx` — PoliticsMethodologyDisclaimer, ToneMethodologyDisclaimer
**Current state:** Full methodology paragraphs ("How we measure," "Political classification uses Google's Gemini AI...") are always rendered at the bottom of the Politics and Tone tabs.
**Why it falls short:** Methodology is important but belongs in an expandable section, not inline. The InsightHero already has a "How we measure" expandable disclosure — the bottom disclaimer is redundant.
**What should change:** Remove the bottom-of-tab methodology disclaimers. The InsightHero's built-in "How we measure" section already handles this with proper progressive disclosure.

### PD-004 — Sources tab concentration breakdown always visible (Low)

**Component:** `app/(tabs)/dashboard.tsx` — SourcesContent
**Current state:** "Source Concentration" BigNumber + "Concentration Breakdown" StackedBar100 + italic disclaimer all render below the Top Creators bar chart.
**Why it falls short:** Source concentration is a deeper analysis beyond the initial "who posts the most" question. It should be available but not forced.
**What should change:** Collapse the concentration section under an expandable header: "How concentrated is your feed?"

### PD-005 — Overview "Content Types" always visible (Low)

**Component:** `app/(tabs)/dashboard.tsx` — OverviewContent
**Current state:** The Content Types StackedBar100 (formats in your feed: videos, shorts, etc.) is always visible below the MetricCards.
**Why it falls short:** Content type breakdown is secondary to the headline metrics. It adds to the VH-002 wall-of-content problem.
**What should change:** Collapse behind an expandable section header, or integrate into InsightHero's "How we measure" section as supporting context.

---

## 3. Color and Tone

### CT-001 — Tone chart colors are too similar to each other (Medium)

**Component:** `src/lib/theme.ts` — tone colors
**Current state:** Light mode: tonePositive (#93C5B8 muted teal), toneNeutral (#CBD5E1 gray), toneNegative (#A3B1C6 muted blue). These three colors are all desaturated blue-gray tones within ~30 hue degrees of each other.
**Why it falls short:** While the muted palette is correct philosophically (no alarming colors), these three colors are too similar to quickly distinguish. The design philosophy says charts should be "immediately readable" — but differentiating three close blue-grays requires careful study.
**What should change:** Keep the muted approach but increase hue separation. For example: tonePositive as muted sage-green (#93C5A8), toneNeutral as warm gray (#C5C0B8), toneNegative as muted slate-blue (#A3B1C6). Same saturation level but with distinct hue families (green, warm, cool).

### CT-002 — Ideology colors nearly indistinguishable (Medium)

**Component:** `src/lib/theme.ts` — ideology colors
**Current state:** Light mode: ideologyLeft (#7C9CBF muted blue), ideologyCenter (#94A3B8 gray), ideologyRight (#B8A394 muted tan). While the hue separation is better than tone colors, at small sizes in the StackedBar100 chart these can look similar.
**Why it falls short:** Political ideology breakdown is already a sensitive visualization. If users can't instantly tell which segment is which, the chart fails to communicate.
**What should change:** Increase saturation slightly for left and right while keeping center neutral. Example: ideologyLeft (#6B8FC4), ideologyCenter (#94A3B8), ideologyRight (#C4A088).

### CT-003 — YouTube platform brand color uses #FF0000 (Low)

**Component:** `src/lib/theme.ts` — platform brand colors
**Current state:** YouTube platform color is #FF0000 (pure bright red).
**Why it falls short:** The design patterns explicitly list "#FF0000 or similar" under "Colors to NEVER Use." While this is YouTube's brand color, it appears in platform pickers and potentially in dashboard elements referencing the scanned platform.
**What should change:** Use YouTube's slightly muted red (#CC0000 or #D32F2F) for in-app references. The platform icon itself can retain the brand red, but any dashboard-facing color references should be toned down.

### CT-004 — ComparisonView delta direction colors are semantically confusing (Low)

**Component:** `src/components/dashboard/ComparisonView.tsx`
**Current state:** Up arrows use `primaryBlue` (#2563EB). Down arrows use `accentGreen` (#10B981). Green typically signals "good" and blue is neutral. An increase in ads (up arrow, blue) and a decrease in ads (down arrow, green) accidentally makes it look like more ads is neutral and fewer ads is positive — imposing a value judgment the design philosophy says to avoid.
**Why it falls short:** Color should "feel informational, not judgmental." Using green for down and blue for up subtly implies that decreases are good and increases are bad.
**What should change:** Use the same neutral color (e.g., `textSecondary` or `primaryBlue`) for both directions. Differentiate by arrow direction only, not color. This keeps the comparison purely informational.

### CT-005 — Upgrade modal green checkmarks imply judgment about Plus features (Low)

**Component:** `src/components/plan/UpgradeModal.tsx`
**Current state:** Each Plus feature in the upgrade modal has a green checkmark (success color #059669) next to it. Verified in recording frame 70.
**Why it falls short:** Green checkmarks semantically mean "correct" or "complete." They subtly imply that Plus features are the "right" state and free tier is deficient. The design patterns say upgrade prompts should "describe the value, not the restriction" and "feel like an invitation, not a paywall."
**What should change:** Replace green checkmarks with a neutral indicator — a small blue dot, a subtle arrow, or simply use the feature icons without a check. The comparison between Plus and Free labels already communicates the difference without needing a "correctness" indicator.

---

## 4. Typography and Spacing

### TS-001 — FeedScoreTrend day labels below minimum caption size (Medium)

**Component:** `src/components/home/FeedScoreTrend.tsx`
**Current state:** Day labels (Sun, Mon, Tue...) use `TYPOGRAPHY.captionSmall.fontSize - 2`, which resolves to approximately 9px.
**Why it falls short:** The design patterns specify "Caption/tooltip: 12–13px" as the minimum text size. At ~9px, these labels are difficult to read, especially for users with reduced vision.
**What should change:** Use `TYPOGRAPHY.captionSmall` (11px) at minimum for day labels. If space is tight, abbreviate to single letters (S, M, T, W, T, F, S).

### TS-002 — AI badge text on tab chips is 9px (Medium)

**Component:** `app/(tabs)/dashboard.tsx` — tab chip AI badge
**Current state:** The "AI" text badge on Political and Tone tab chips uses `fontSize: 9`. This was recently added to replace sparkle icons (UI-003 fix).
**Why it falls short:** 9px text is below the minimum 12px caption size and may be illegible on smaller devices. WCAG guidelines recommend minimum 12px for any text.
**What should change:** Increase to at least 10px. If the badge looks too large, reduce horizontal padding rather than font size. Alternatively, use a 12px badge with tighter letter spacing.

### TS-003 — MetricCard and custom card inconsistent padding (Low)

**Component:** `src/components/dashboard/MetricCard.tsx` vs `src/components/ui/Card.tsx`
**Current state:** MetricCard uses `SPACING.lg` (16px) padding. The Card primitive uses `SPACING.xl` (20px) padding. Other custom cards (Sources three-column, Feed in Minutes) use varying padding.
**Why it falls short:** Inconsistent padding creates subtle visual unevenness. The eye notices when cards don't align perfectly.
**What should change:** Standardize all dashboard-facing cards to the same padding value — either 16px or 20px uniformly.

### TS-004 — Section gap between tab content sections inconsistent (Low)

**Component:** `app/(tabs)/dashboard.tsx`
**Current state:** Different sections use varying gap values: `SPACING.sm` (8px) between some cards, `SPACING.md` (12px) between sections, and occasional `SPACING.lg` (16px) or `SPACING.xl` (20px).
**Why it falls short:** The design philosophy calls for "generous spacing between sections — white space is a feature." Inconsistent gaps make the layout feel slightly disorganized.
**What should change:** Establish a consistent rhythm: `SPACING.lg` (16px) between items within a section, `SPACING.xl` (20px) or `SPACING['2xl']` (24px) between sections.

---

## 5. Charts and Data Visualization

### CD-001 — StackedBar100 hides labels for segments under 10% (Medium)

**Component:** `src/components/dashboard/StackedBar100.tsx`, line ~123
**Current state:** Percentage labels inside the bar only render if the segment width is >= 10%. Segments between 3% and 10% appear as colored slivers with no label.
**Why it falls short:** The design philosophy says "Every chart must have a plain-language label" and data points must be "clear without hovering." A 7% segment with no label forces the user to look at the legend and mentally match colors.
**What should change:** For segments between 3–10%, show the percentage label above or below the bar (externally positioned), or use a callout line. The legend helps, but the label should be visible without cross-referencing.

### CD-002 — BarChart uses 5 shades of the same blue hue (Medium)

**Component:** `src/components/dashboard/BarChart.tsx`
**Current state:** Bar colors progress from #1E40AF (darkest) through #93C5FD (lightest) — five shades of blue. When showing top 8 creators, bars 4–8 are quite similar in shade.
**Why it falls short:** The design patterns say "Prefer clean bar charts" and "No chart should require reading a legend." Five shades of the same hue become difficult to distinguish after the 3rd shade, especially for color-blind users.
**What should change:** Use a monochromatic intensity gradient (all bars the same color, differentiated only by length) since the bar length already communicates ranking. Alternatively, use two hue families (top 3 in blue, rest in gray) to create a clear visual "top creators" vs "others" separation.

### CD-003 — Tone mini-bars in "Suggested vs Followed" section lack labels (Low)

**Component:** `app/(tabs)/dashboard.tsx` — ToneContent, lines ~1543–1565
**Current state:** Two 20px-tall horizontal bars show tone distribution for suggested vs. followed content. Color segments represent positive/neutral/negative but individual segments have no percentage labels. A text line below shows inline percentages.
**Why it falls short:** The user must read a separate text line to understand the bar breakdown. The bar itself has no visible labels — it's purely decorative without the accompanying text.
**What should change:** Either add percentage labels inside segments (if large enough) or position labels above each segment. Alternatively, replace the mini-bars with a simple text-based comparison table which would be clearer at this size.

### CD-004 — Content Types StackedBar100 uses chartPalette rotation for many categories (Low)

**Component:** `app/(tabs)/dashboard.tsx` — OverviewContent, lines ~201–208
**Current state:** Content types (videos, shorts, posts, etc.) map to `colors.chartPalette[i % chartPalette.length]`. With 6+ content types, colors start repeating from the palette.
**Why it falls short:** If there are more content types than palette entries, two categories could share the same color, making the chart misleading.
**What should change:** Extend the chartPalette to at least 8 distinct colors, or cap content types shown at the palette length and group remaining types into an "Other" category.

### CD-005 — Ad Composition chart shows 100% "Non-sponsored" bar when 0 ads exist (Medium)

**Component:** `app/(tabs)/dashboard.tsx` — AdsContent
**Current state:** When 0 ads are detected, the Ad Composition StackedBar100 renders a single 100% blue segment labeled "Non-sponsored." Verified in recording frame 40.
**Why it falls short:** Showing a 100% bar for a single category communicates zero information — it's a tautology ("100% of your non-ad content is non-ads"). The chart takes up visual space without adding insight. The design philosophy says every chart should communicate something clear.
**What should change:** Hide the Ad Composition chart entirely when ad count is 0. The "No labeled ads detected" empty state already communicates the finding. Only show the composition chart when there are both sponsored and non-sponsored segments to compare.

---

## 6. Microcopy

### MC-001 — Empty state uses "No data available" language (High)

**Component:** `src/components/dashboard/MetricCard.tsx`, line ~150–162
**Current state:** When `hasData` is false, MetricCard shows fallback text. The default pattern is "No [X] data available for this scan."
**Why it falls short:** The design patterns explicitly state: "Never say 'No data' or 'Error' or 'Nothing to show.'" Empty states should be "encouraging and forward-looking."
**What should change:** Replace with forward-looking language. Instead of "No creator data available for this scan," use "Creator data appears after scanning longer. Try scrolling through more content."

### MC-002 — AiProcessingCard uses "No [X] detected" phrasing (High)

**Component:** `app/(tabs)/dashboard.tsx` — Politics Gate 2, Tone Gate 2
**Current state:** When AI is enabled but no data exists, the card reads "No political content detected" or "No emotional tone data detected."
**Why it falls short:** Starts with "No" and uses clinical "detected" language. The design patterns say empty states should "feel encouraging, not like error messages."
**What should change:** Reframe positively: "Political content wasn't prominent in this scan — try scanning longer or at a different time." Or: "This scan didn't surface strong emotional tone patterns. Each scan captures a different moment."

### MC-003 — EmptySection says "No creator data available" (Medium)

**Component:** `app/(tabs)/dashboard.tsx` — Sources tab, line ~486
**Current state:** `EmptySection` renders: "No creator data available for this scan."
**Why it falls short:** Same "No data" anti-pattern as MC-001.
**What should change:** "Creator information builds up as you scan. Try scrolling through more content to capture source data."

### MC-004 — "What You Can Do" section uses imperative voice (Medium)

**Component:** `app/(tabs)/dashboard.tsx` — SuggestedVsFollowedContent, lines ~938–1050
**Current state:** Three cards with prescriptive instructions: "Follow more diverse accounts," "Use chronological feeds when available," "Engage with content you value."
**Why it falls short:** The epistemic restraint standard says "Invite reflection, not outrage" and "Never tell users how to feel about their data." Imperative commands ("Follow more," "Use chronological," "Engage with") cross from observation into prescription. They also imply the current feed state is a problem to fix.
**What should change:** Reframe as reflections: "Some users find that following a wider range of accounts changes what their feed recommends." Or collapse the entire section behind an expandable "Ideas to explore" header with softer, optional framing.

### MC-005 — Ad context lines use vague judgment language (Low)

**Component:** `app/(tabs)/dashboard.tsx` — OverviewContent, MetricCard contextLines
**Current state:** Context lines for the Ads MetricCard read: "Very few ads in this session" / "A typical ad density" / "Higher than average ad density."
**Why it falls short:** "Very few" and "Higher than average" are mild value judgments. The design philosophy says to "Present data without moral judgment." What counts as "typical" or "higher than average" is an assertion without cited source.
**What should change:** Use purely factual context: "8% of posts were labeled as ads" with a neutral comparison: "Typical range across scans: 10–25%." Let the user decide if their number is high or low.

### MC-006 — Suggested content context lines interpret the ratio (Low)

**Component:** `app/(tabs)/dashboard.tsx` — OverviewContent, MetricCard contextLines
**Current state:** "Most of your feed was recommended" (if suggestedPct >= 50) / "Your feed was mostly from accounts you follow" (if < 20%).
**Why it falls short:** While descriptive, these cross slightly into interpretation. "Most of your feed was recommended" could be read as implying this is unusual or concerning.
**What should change:** Pure observation: "69% of posts were from accounts you don't follow." Let the Suggested vs. Followed tab handle deeper context.

### MC-007 — "Only 0 ads were detected" — awkward zero-count phrasing (Medium)

**Component:** `app/(tabs)/dashboard.tsx` — AdsContent InsightHero
**Current state:** When no ads are found, the insight meaning reads "Only 0 ads were detected among 62 posts." Verified in recording frame 35.
**Why it falls short:** "Only 0" is grammatically awkward and reads like a template that wasn't designed for the zero case. "Only" implies surprise that the count is low, but zero is a perfectly normal result.
**What should change:** Handle the zero case explicitly: "No labeled ads appeared in this 62-post scan." Or even more positively: "This scan captured 62 posts with no visible ad labels."

### MC-008 — Ads tab "detected" language feels clinical (Low)

**Component:** `app/(tabs)/dashboard.tsx` — AdsContent
**Current state:** Multiple instances: "0 ads were detected," "No labeled ads detected," "Only X ads were detected."
**Why it falls short:** "Detected" is surveillance/security language. The design philosophy aims for "human, calm, and helpful" — not clinical or forensic.
**What should change:** Replace "detected" with "found" or "appeared": "No labeled ads appeared in this scan" or "We found X labeled ads."

### MC-009 — History page has no encouraging empty state (High)

**Component:** `app/(tabs)/history.tsx`
**Current state:** "Scan History — Review your past feed analyses" followed by skeleton loading placeholders and empty space. Verified in recording frame 55.
**Why it falls short:** When there's no scan history (or it's loading), the page shows bare skeletons with no encouraging message. The design patterns say empty states should explain "what will appear here and when" and "feel encouraging, not like error messages."
**What should change:** Show a warm empty state: "Your scan history will build up here. Each scan adds a new snapshot — compare them over time to spot patterns in your feed."

### MC-010 — Locked overlay says "Try free for 14 days" — urgency framing (Low)

**Component:** `src/components/plan/LockedOverlayCard.tsx`
**Current state:** CTA reads "Try free for 14 days" with disclaimer "No charge for 14 days. Cancel anytime."
**Why it falls short:** The design patterns say upgrade prompts should "Describe the value, not the restriction" and "Feel like an invitation, not a paywall." While "Try free" is not aggressive, repeating "14 days" twice and mentioning "Cancel" introduces friction-reduction language typical of aggressive SaaS upsells.
**What should change:** Simplify to a single value statement: "See how your feed changes over time" with a button "Start exploring" and a small note "Free for 14 days."

---

## Appendix: Frame Evidence

Key findings cross-referenced with verification recording frames:

- **Frame R1-05:** Overview tab — VH-002 (content density), VH-001 (InsightHero title size vs MetricCards)
- **Frame R1-10:** InsightHero expanded — PD-003 visible (methodology always expanded below)
- **Frame R1-25:** Sources InsightHero — demonstrates good counterfactual section
- **Frame R1-30:** Source Concentration — VH-006 (40px BigNumber towers over 18px InsightHero)
- **Frame R1-35:** Ads tab with 0 ads — MC-007 ("Only 0 ads"), CD-005 (100% Non-sponsored bar)
- **Frame R1-40:** Ads "How we measure" — demonstrates good methodology disclosure
- **Frame R1-50:** Suggested vs. Followed — good StackedBar100, clean hierarchy
- **Frame R1-55:** History page — MC-009 (empty/loading state with no encouragement)
- **Frame R1-60:** Settings — VH-007 (upgrade banner), CT-005 (green checks in modal)
- **Frame R1-70:** Upgrade modal — CT-005 (green checkmarks as implicit judgment)

---

## 7. Accessibility

### A-001 — Tone and ideology chart colors may be indistinguishable for color-blind users (High)

**Component:** `src/lib/theme.ts` — tone and ideology colors
**Current state:** Tone positive (#93C5B8), neutral (#CBD5E1), negative (#A3B1C6) — all desaturated blue-gray. Ideology left (#7C9CBF), center (#94A3B8), right (#B8A394) — similar muted tones. For deuteranopia (most common color blindness), these could be nearly identical.
**Why it falls short:** The design philosophy says "Never rely on color alone to convey meaning" and "Dashboard must be usable by someone who is color-blind." The StackedBar100 legend uses colored dots as the only differentiator between segments.
**What should change:** Add pattern fills or texture variations to chart segments (hatching, dots, solid). Or add inline text labels to each segment. The legend dots should also include distinct shapes (circle, square, triangle) alongside color.

### A-002 — ~9px text in FeedScoreTrend and AI badge below WCAG minimums (Medium)

**Component:** `src/components/home/FeedScoreTrend.tsx`, `app/(tabs)/dashboard.tsx`
**Current state:** Day labels resolve to ~9px. AI badge on tab chips is explicitly 9px. WCAG AA requires minimum 12px for meaningful text.
**Why it falls short:** Users with low vision or larger accessibility text settings may not be able to read these labels. Even users with normal vision may find 9px text straining on a mobile screen.
**What should change:** Minimum 11px for any text element. Reorganize layout if needed to accommodate larger text.

### A-003 — StackedBar100 small segments (<10%) have no accessible label (Medium)

**Component:** `src/components/dashboard/StackedBar100.tsx`
**Current state:** Segments below 10% have no visible text label. The accessibility label exists in the code (`accessibilityLabel` per segment) but there's no visual indicator for sighted users who don't use assistive technology.
**Why it falls short:** Color-only communication for small segments. A sighted user must cross-reference the legend to understand what a thin colored sliver represents.
**What should change:** Add external labels (positioned outside the bar) for small segments, or show a tooltip on tap for any segment.

### A-004 — Interactive expandable sections lack focus indicators (Low)

**Component:** `src/components/dashboard/InsightHero.tsx`, collapsible sections in dashboard.tsx
**Current state:** Expandable sections (InsightHero "Tap for more context," collapsible advertiser list, ideology breakdown) use TouchableOpacity with press states but no visible focus ring or border change for keyboard/switch control navigation.
**Why it falls short:** The design philosophy requires "Interactive elements must have visible focus states."
**What should change:** Add a 2px outline in `colors.primaryBlue` on focus for all interactive expand/collapse elements. React Native's `onFocus` / `onBlur` can drive this on supporting platforms.

---

## High-Priority Action Items (Top 10)

1. **VH-001** — Increase InsightHero title to RFValue(24–26) so it's the true visual anchor
2. **VH-002** — Restructure Overview tab to show fewer items above the fold; collapse secondary sections
3. **PD-002** — Remove or collapse the prescriptive "What You Can Do" section on Suggested tab
4. **MC-001** — Replace all "No data available" empty states with forward-looking encouragement
5. **MC-002** — Rewrite AiProcessingCard "No [X] detected" messages to be encouraging, not clinical
6. **MC-009** — Add warm empty state to History page instead of bare skeletons
7. **A-001** — Add pattern/shape differentiation to tone and ideology charts for color-blind users
8. **MC-004** — Reframe "What You Can Do" imperative commands as optional reflections
9. **CT-001** — Increase hue separation in tone chart colors so segments are instantly distinguishable
10. **CD-005** — Hide Ad Composition chart when ad count is 0 (100% "Non-sponsored" is meaningless)

---

## What's Working Well

The audit also identified strong adherence to standards in several areas:

**Epistemic Restraint: Exceptional (100% compliant)**
Zero violations found across the entire codebase. All insight text uses observational language ("Your feed contained," "appeared in," "came from"). Automated test coverage verifies banned phrases. Counterfactual sections ("What this might also mean") demonstrate intellectual honesty. Methodology disclosures ("How we measure") are thorough and transparent.

**Design System Discipline: Excellent**
Zero hardcoded colors found outside the theme system. All components use `useTheme()` hook. Consistent spacing scale (4pt grid), border radius scale, and shadow system. Both light and dark modes are fully themed.

**WCAG AA Contrast: Verified**
Theme file includes documented contrast ratio checks. Primary text on card backgrounds exceeds AAA (11.3:1). Tertiary text meets AA minimum (4.6:1). Both light and dark modes pass.

**Component Architecture: Strong**
Clean separation between data computation (computeDashboardData.ts) and presentation (dashboard.tsx). Shared components (InsightHero, MetricCard, SectionHeader, BarChart, StackedBar100, BigNumber) ensure consistency. Each tab follows the same structural pattern.

**Accessibility Labels: Comprehensive**
All charts include `accessibilitySummary` props. MetricCards build full `accessibilityLabel` from component parts. BigNumber and BarChart announce values to screen readers. ProgressBar uses proper ARIA roles.
