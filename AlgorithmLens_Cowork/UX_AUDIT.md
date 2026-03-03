# AlgorithmLens Dashboard — UX Audit Report

**Date:** February 14, 2026
**Audited against:** UI/UX Design Philosophy (`ui-ux-philosophy/SKILL.md`), Design Patterns Reference (`design-patterns.md`), and Epistemic Restraint Standards (`epistemic-restraint/SKILL.md`)

---

## Summary of Findings

| Category | Issues Found |
|---|---|
| 1. Visual Hierarchy | 6 |
| 2. Progressive Disclosure | 4 |
| 3. Color and Tone | 9 |
| 4. Typography and Spacing | 5 |
| 5. Charts and Data Visualization | 4 |
| 6. Microcopy | 8 |
| 7. Accessibility | 6 |
| **Total** | **42** |

---

## 1. Visual Hierarchy

### VH-1: ToplineMetricCard headline text is too small to serve as a "headline"

**Component:** `src/components/dashboard/primitives/ToplineMetricCard.jsx`

**Current state:** The card headline uses `text-sm font-medium` (14px). The value node is larger, but the card itself lacks the prominent, scannable "biggest number on the page" pattern described in the design philosophy.

**Why it falls short:** The design standard says the most important number or insight on each tab must be the largest and most prominent element. At 14px, the headline competes with other small text rather than standing out. A user cannot absorb the main takeaway in under 3 seconds when everything is similarly sized.

**What should change:** Increase the headline to at least `text-base font-semibold` (16px) and ensure the `valueNode` inside is rendered at 32–40px bold per the typography scale for headline metrics.

---

### VH-2: PoliticsTab duplicates the political percentage in two adjacent elements

**Component:** `src/pages/dashboard/tabs/PoliticsTab.jsx` (lines 221–225)

**Current state:** The political share section shows both a `text-sm` line reading "Political posts: X% of feed" and a `text-3xl font-bold` showing the same "X%." These two lines appear directly next to each other.

**Why it falls short:** Repeating the same number at two different sizes creates visual clutter rather than hierarchy. The user sees the number twice without gaining new information.

**What should change:** Remove the redundant `text-sm` line ("Political posts: X% of feed") and keep only the large `text-3xl` number. Add a plain-language label beneath it like "of your feed was political content" instead.

---

### VH-3: OverviewTab four-card grid has equal visual weight across all cards

**Component:** `src/pages/dashboard/tabs/OverviewTab.jsx`

**Current state:** The four topline metric cards (source concentration, commercial composition, political share, tone) are all identically styled white cards with equal border, padding, and heading treatment. No single card is visually prioritized.

**Why it falls short:** The design standard says "Never present a wall of numbers with equal visual weight." When all four cards look identical, the user must read each one to find the most important insight rather than absorbing a headline in 3 seconds.

**What should change:** Make the most actionable card (likely suggested-vs-followed or source concentration) span full width at the top with a larger number, then stack the remaining three in a secondary row at smaller sizes.

---

### VH-4: ConcentrationSummary presents three lines of equal visual weight

**Component:** `src/components/dashboard/primitives/ConcentrationSummary.jsx`

**Current state:** All three lines (Top 5, Top 10, All others) use identical `text-sm text-text-main` styling. Nothing is visually prioritized.

**Why it falls short:** The top-5 figure is the most important concentration metric, but it's styled exactly like the others. This creates a "wall of numbers" where the user has to scan all three to identify the key insight.

**What should change:** Make the Top 5 percentage larger and bolder (e.g., `text-xl font-bold`) and style Top 10 and All Others as smaller supporting metrics beneath it.

---

### VH-5: SourcesTab top-10 table gives equal emphasis to all 10 rows

**Component:** `src/pages/dashboard/tabs/SourcesTab.jsx`

**Current state:** The top 10 sources table presents all rows with the same text size and weight. The #1 source looks the same as #10.

**Why it falls short:** The design philosophy says the most important number should be the most prominent. The top 1–3 sources tell the concentration story; the rest are supporting detail.

**What should change:** Visually distinguish the top 3 rows (bolder text, slightly larger font, or a subtle accent background) from the remaining rows.

---

### VH-6: SuggestedVsFollowedTab has many equal-weight sections

**Component:** `src/pages/dashboard/tabs/SuggestedVsFollowedTab.jsx`

**Current state:** The tab contains 6+ sections (overall breakdown, platform breakdown, creator novelty, commercial content, tone split, topics, content formats, what you can do) all rendered sequentially with similar card styling.

**Why it falls short:** With so many sections at similar visual weight, the main takeaway (the percentage split between suggested and followed) gets diluted. A user cannot absorb the headline in 3 seconds when 6 sections compete for attention.

**What should change:** Ensure the headline percentage (e.g., "62% of your feed was content you didn't choose to follow") is dramatically larger and sits alone at the top. Push subsequent sections into collapsible detail or make them noticeably smaller.

---

## 2. Progressive Disclosure

### PD-1: AdsTab shows all sections expanded by default

**Component:** `src/pages/dashboard/tabs/AdsTab.jsx`

**Current state:** Sections 3.1 through 3.5 (commercial composition, top advertisers, top product types, unlabeled promos, tone split) are all visible on load. Only the summary section is collapsed.

**Why it falls short:** The design philosophy requires "Show the big picture first. Let users tap or click into layers of detail." Showing 5 data-dense sections at once forces complexity on users who just want the headline.

**What should change:** Lead with the InsightHero and one primary section (commercial composition bar). Collapse "Top advertisers," "Top product types," "Unlabeled promos," and "Tone split" behind expandable sections so users who want detail can access it without overwhelming those who don't.

---

### PD-2: ToneTab shows all tone splits on first load

**Component:** `src/pages/dashboard/tabs/ToneTab.jsx`

**Current state:** The main tone distribution, top sources by positive/negative volume, political vs. non-political tone split, and selling vs. not-selling tone split all appear expanded by default.

**Why it falls short:** Same pattern as the Ads tab — all detail is forced on the user. The design calls for detail to be "available but not forced."

**What should change:** Show the main tone distribution and hero as the primary view. Place the comparative tone splits (political vs. non-political, selling vs. not-selling) behind "Show more" toggles.

---

### PD-3: PoliticsTab shows all three sections expanded

**Component:** `src/pages/dashboard/tabs/PoliticsTab.jsx`

**Current state:** Political share, top political source, and ideological distribution are all visible simultaneously on load.

**Why it falls short:** While this tab is simpler than others, it still violates the "headline first, detail on demand" principle when all three sections are visible. The ideological distribution is a deeper-cut insight that not every user will want.

**What should change:** Keep the InsightHero and political share visible. Place the ideological distribution behind a collapsible "Show ideological breakdown" toggle.

---

### PD-4: DashboardPage ViewsGridWithCollapsing collapses "More Details" but not "Context"

**Component:** `src/pages/dashboard/DashboardPage.jsx` (ViewsGridWithCollapsing, ~line 575)

**Current state:** The component groups views into "Key Insight" (always visible), "Context" (always visible), "More Details" (collapsed), and "Summary." The "Context" section with its supporting cards is always expanded.

**Why it falls short:** The design pattern calls for a shallow-to-deep architecture. Having both the primary "Key Insight" and multiple "Context" supporting cards visible at once creates information overload on tabs that have many supporting views.

**What should change:** Show a maximum of 2 context cards by default and add "Show all context" if there are more than 2.

---

## 3. Color and Tone

### CT-1: Ideological distribution uses bright red (#EF4444) for "Right" segment

**Component:** `src/pages/dashboard/tabs/PoliticsTab.jsx` (line 173)

**Current state:** The ideological distribution composition bar uses `color: '#EF4444'` (Tailwind red-500) for the "Right" political segment.

**Why it falls short:** The design standard explicitly says "Do NOT use bright reds" and "color communicates structure and category, not urgency or danger." Using red for the "Right" segment implies moral judgment — that right-leaning content is alarming or bad. This also violates epistemic restraint by coloring data in a way that suggests a conclusion.

**What should change:** Replace `#EF4444` with a muted slate or warm gray tone (e.g., `#94A3B8` or a muted coral like `#D4A5A5`) that distinguishes the segment without implying judgment.

---

### CT-2: Negative tone uses bright red (#FCA5A5) across multiple components

**Components:** `src/pages/dashboard/tabs/OverviewTab.jsx` (line 290), `src/pages/dashboard/tabs/ToneTab.jsx`, `src/components/dashboard/charts/StackedBar100.jsx`

**Current state:** The "Negative" tone segment uses `#FCA5A5` (Tailwind red-200/300) in composition bars and tone displays.

**Why it falls short:** While lighter than pure red, this is still a recognizably red/pink tone that signals alarm. The design philosophy says color should "feel informational, not judgmental." Labeling content "Negative" in red implies that negative-toned content is bad or dangerous.

**What should change:** Replace with a muted cool gray (e.g., `#A3B1C6`) or soft slate tone. The "Negative" label itself should be sufficient to communicate the category without red reinforcing a moral judgment.

---

### CT-3: TrendsPanel uses red (#text-red-600) for decrease and green (#text-emerald-600) for increase

**Component:** `src/components/dashboard/TrendsPanel.jsx` (lines 372–373, 412–413)

**Current state:** In the comparison table, positive deltas show as `text-emerald-600` and negative deltas as `text-red-600`.

**Why it falls short:** The design standard says to avoid traffic-light metaphors. Red for decrease and green for increase implies that increases are "good" and decreases are "bad" — but in feed analysis, an increase in political content or ads isn't inherently negative. This violates both the color philosophy and epistemic restraint.

**What should change:** Use muted teal for increases and muted slate for decreases, per the design patterns reference (change indicator colors). These communicate direction without moral judgment.

---

### CT-4: ScanWarnings uses yellow warning styling (#FEFCE8, #FDE68A, #854D0E)

**Component:** `src/components/ScanWarnings.jsx`

**Current state:** The scan warnings box uses a bright yellow background (`#FEFCE8`), yellow border (`#FDE68A`), brown text (`#854D0E`), and a ⚠️ emoji.

**Why it falls short:** The design standard says not to use "warning yellows" as they feel alarming. Combined with the ⚠️ emoji and "Scan Integrity Warnings" header, this component creates an anxious, error-like feeling rather than the calm, measured tone the product aims for.

**What should change:** Replace with a soft blue-gray informational banner. Change the header to something calmer like "Notes about this scan" and remove the ⚠️ emoji. Use the info icon (ⓘ) already used in DenominatorLine.

---

### CT-5: PostItem uses red badge for "Political" content

**Component:** `src/components/PostItem.jsx` (line 22)

**Current state:** Political content badges use `bg-red-100 text-red-800 border-red-200`.

**Why it falls short:** Using red for political content implies that political content is dangerous or alarming. The design and epistemic standards say color should communicate category, not urgency or judgment. A red badge on political content tells users they should be concerned about seeing it.

**What should change:** Use a neutral category color like soft slate (`bg-slate-100 text-slate-700 border-slate-200`) or muted blue.

---

### CT-6: InsightCards PoliticalContent shows warning-styled banner when >20%

**Component:** `src/components/results/InsightCards.jsx` (lines 124–130)

**Current state:** When political content exceeds 20%, a banner appears with `bg-status-warning/5` background and text reading "Your feed has a higher than average amount of political content."

**Why it falls short:** This violates both the color philosophy (warning styling) and epistemic restraint. The product should not judge whether a particular percentage of political content is "too high." There is no universal "average" for political content, and flagging it as above-average implies the user should be alarmed.

**What should change:** Remove the warning banner entirely. The percentage already speaks for itself. If context is needed, use a calm tooltip explaining "This is the percentage of posts in this scan that contained political keywords."

---

### CT-7: ContentTone and WellbeingSignals use status-error color for negative metrics

**Component:** `src/components/results/InsightCards.jsx` (lines 97–100, 158)

**Current state:** "Negative" tone uses `text-status-error` and `bg-status-error`. Wellbeing values above 20% use `text-status-warning`.

**Why it falls short:** Using error and warning semantic colors for data categories implies that negative tone or high wellbeing signal percentages are errors or problems. This is morally judgmental — a feed with negative tone is not inherently bad; it might contain serious journalism or important commentary.

**What should change:** Use neutral category colors. "Negative" tone could use a muted cool gray. Wellbeing metrics should use the same neutral text color regardless of percentage.

---

### CT-8: Multiple error pages use bright red backgrounds and icons

**Components:** `src/pages/ScanHistoryPage.jsx`, `src/pages/HistoryPage.jsx`, `src/pages/dashboard/DashboardPage.jsx`, `src/components/auth/ResultsGate.jsx`

**Current state:** Error states across the app use `bg-red-50`, `text-red-600`, `bg-red-600` buttons, and large red icons.

**Why it falls short:** While error states are different from data displays, the design philosophy asks for a "calm" feeling throughout. Bright red error pages feel aggressive and anxiety-inducing.

**What should change:** Use a softer error treatment — muted rose or warm gray backgrounds, slate-toned text, and calm iconography. Error messages can be clear and actionable without being visually alarming.

---

### CT-9: Unlabeled promos use amber (#F59E0B) in composition bars

**Components:** `src/pages/dashboard/tabs/OverviewTab.jsx` (line 200), `src/pages/dashboard/tabs/AdsTab.jsx` (line 148)

**Current state:** "Unlabeled promos" segment in composition bars uses `#F59E0B` (Tailwind amber-500).

**Why it falls short:** Amber/yellow is close to the "warning yellow" the design standard says to avoid. It subtly implies that unlabeled promotional content is a problem to worry about rather than simply a data category.

**What should change:** Replace with a muted warm gray or soft terracotta (e.g., `#B8A394`) that differentiates from the other segments without carrying warning connotations.

---

## 4. Typography and Spacing

### TS-1: DenominatorLine caption text at 12px may be too small

**Component:** `src/components/dashboard/primitives/DenominatorLine.jsx`

**Current state:** Uses `text-xs text-text-muted` which is 12px.

**Why it falls short:** The design typography scale specifies "Caption/tooltip: 12-13px" which this meets, but the design standard also says "minimum 14px for body text." While DenominatorLine is a caption, it contains important contextual information about how metrics are calculated. At 12px on mobile devices, this can be difficult to read.

**What should change:** Consider bumping to 13px (`text-[13px]`) for better readability while still maintaining visual hierarchy below body text.

---

### TS-2: MasterNumbersLine at 12px is important context rendered very small

**Component:** `src/components/dashboard/primitives/MasterNumbersLine.jsx`

**Current state:** Uses `text-xs text-text-muted` (12px) for the "Based on X posts · Y scans · Z platforms" line at the bottom of each tab.

**Why it falls short:** This line establishes the entire data foundation for the tab. At 12px in muted gray, it's easy to miss entirely. While it should be secondary, it shouldn't be nearly invisible.

**What should change:** Increase to `text-[13px]` and use `text-slate-500` instead of `text-text-muted` for slightly more visibility.

---

### TS-3: ToplineMetricCard headline at text-sm creates a cramped header

**Component:** `src/components/dashboard/primitives/ToplineMetricCard.jsx`

**Current state:** The card headline uses `text-sm font-medium text-text-main` (14px). Combined with `p-5 space-y-3`, the heading sits close to the card edge and value node.

**Why it falls short:** The typography scale says section headers should be 16–18px semibold. At 14px medium weight, the headline doesn't clearly establish itself as a heading, making the card feel cramped.

**What should change:** Increase to `text-base font-semibold` (16px, 600 weight) to match the section header specification.

---

### TS-4: ViewCard "How we measure" label at 11px is extremely small

**Component:** `src/components/dashboard/ViewCard.jsx` (HowWeMeasureSection, line 62)

**Current state:** The "How we measure" heading uses `text-[11px] font-semibold uppercase tracking-[0.12em]`.

**Why it falls short:** At 11px, this is below even the caption minimum (12–13px) in the typography scale. While the uppercase treatment adds some visual distinction, the tiny size makes this section hard to read, especially on mobile.

**What should change:** Increase to `text-xs` (12px) minimum, or preferably `text-[13px]`.

---

### TS-5: DataCoverageBar text at 11px is below minimum readable size

**Component:** `src/pages/dashboard/DashboardPage.jsx` (DataCoverageBar, line 265)

**Current state:** Uses `text-[11px] text-slate-400` for the scan/platform/post count.

**Why it falls short:** Below the 12px minimum specified in the typography scale. This is contextual data that helps users understand the scope of what they're seeing.

**What should change:** Increase to `text-xs` (12px) minimum.

---

## 5. Charts and Data Visualization

### CD-1: CompositionBar100WithCounts hides percentage labels on small segments

**Component:** `src/components/dashboard/primitives/CompositionBar100WithCounts.jsx`

**Current state:** Percentage labels inside bar segments are only shown when `segment.percentage >= 10`. Smaller segments appear as colored slices with no visible label.

**Why it falls short:** The design standard says "Axis labels and data points must be clear without hovering." When a segment is 5–9%, the user must hover or look at the legend to know its value. This requires extra effort to understand the chart.

**What should change:** Show percentage labels outside or above the bar for segments that are too narrow to contain text (under 10%). Or provide an always-visible annotation row beneath the bar.

---

### CD-2: ToneDiffInsight diverging bar lacks clear axis labels

**Component:** `src/pages/dashboard/tabs/ToneTab.jsx` (ToneDiffInsight component)

**Current state:** The diverging bar shows two side-by-side bars with group labels at the sides, but no axis labels explaining what the bar length represents (e.g., "% negative" or "% positive").

**Why it falls short:** The design standard says "every chart must have a plain-language label explaining what it shows." The diverging bar shows relative proportions but doesn't explicitly state which tone metric is being compared.

**What should change:** Add a small axis label above or below the bar, such as "% negative tone" or "% positive tone" (whichever metric is being compared).

---

### CD-3: Ideological distribution bar uses politically loaded color mapping

**Component:** `src/pages/dashboard/tabs/PoliticsTab.jsx` (line 171–173)

**Current state:** Left = blue (#3B82F6), Center = gray (#94A3B8), Right = red (#EF4444). This mirrors the US political color convention.

**Why it falls short:** Beyond the red issue (covered in CT-1), using US political party colors (blue = Democrat, red = Republican) in an ideological chart makes the visualization feel partisan rather than neutral. The product is meant to be descriptive, not to reinforce political polarization frameworks.

**What should change:** Use three equally neutral, muted tones (e.g., three different grays or soft pastels) that don't reference any country's political party colors. Rely on the text labels ("Left," "Center," "Right") rather than color to convey meaning.

---

### CD-4: BigNumber radial gauge lacks a plain-language label

**Component:** `src/components/dashboard/charts/BigNumber.jsx`

**Current state:** When rendered as a percentage with a radial gauge, the component shows the number and an optional `label` prop but doesn't always explain what the gauge represents (what 0% and 100% mean in context).

**Why it falls short:** The design standard says charts should be understood without reading a legend. A radial gauge showing "62%" without context requires the user to look elsewhere to understand what's being measured.

**What should change:** Ensure every BigNumber usage passes a clear, descriptive `label` prop. Consider adding a subtitle slot for context (e.g., "of your feed" beneath the number).

---

## 6. Microcopy

### MC-1: ScanWarnings header "Scan Integrity Warnings" sounds clinical and alarming

**Component:** `src/components/ScanWarnings.jsx` (line 66)

**Current state:** The header reads "Scan Integrity Warnings" in semibold brown text.

**Why it falls short:** The design standard says microcopy should "feel human, calm, and helpful" and "Never robotic or clinical." The phrase "Scan Integrity Warnings" sounds like a system error message, not a helpful note.

**What should change:** Replace with something like "A few things to know about this scan" or "Notes about this scan."

---

### MC-2: MasterNumbersLine shows "No posts available for this view" — feels like an error

**Component:** `src/components/dashboard/primitives/MasterNumbersLine.jsx`

**Current state:** When `postCount === 0`, the component shows "No posts available for this view."

**Why it falls short:** The design standard says empty states should "feel encouraging, not like error messages." The phrase "No posts available" sounds like something broke. The empty state pattern calls for forward-looking language.

**What should change:** Replace with something like "This view will populate once posts are scanned" or "Scan your feed to see data here."

---

### MC-3: PoliticsTab empty state "Political exposure was light in this window" lacks encouragement

**Component:** `src/pages/dashboard/tabs/PoliticsTab.jsx` (line 232)

**Current state:** When no political data is available, the text reads "Political exposure was light in this window."

**Why it falls short:** While not error-like, this doesn't follow the empty state pattern of explaining what will appear and when, or offering a CTA. It's a statement that stops rather than inviting action.

**What should change:** Add forward-looking text: "Political exposure was light in this window. Scan more content to see a full breakdown."

---

### MC-4: LockedOverlayCard uses "Lock" icon which implies restriction

**Component:** `src/components/plan/LockedOverlayCard.jsx`

**Current state:** The locked overlay shows a Lock icon from lucide-react with a rounded gray background.

**Why it falls short:** The design standard for upgrade prompts says "Never use 'Locked' or 'Restricted' or 'Upgrade required.'" While the text copy is good ("Your snapshot is free. Plus adds trends..."), the Lock icon contradicts this by visually communicating "locked/restricted."

**What should change:** Replace the Lock icon with something inviting — a Sparkles icon, a TrendingUp icon, or a simple illustration that communicates added value rather than restriction.

---

### MC-5: TrendsCTA for free users says "Unlock Plus" — uses restriction language

**Component:** `src/components/dashboard/TrendsCTA.jsx`

**Current state:** The CTA button for free users reads "Unlock Plus."

**Why it falls short:** "Unlock" is restriction language that implies something is locked. The design standard says upgrade prompts should "Feel like an invitation, not a paywall."

**What should change:** Replace with "Try Plus free" or "Start free trial" — invitational language that describes value rather than restriction.

---

### MC-6: InsightCards PoliticalContent tells users their feed has "higher than average" political content

**Component:** `src/components/results/InsightCards.jsx` (line 127)

**Current state:** When political content exceeds 20%, text reads "Your feed has a higher than average amount of political content."

**Why it falls short:** This violates epistemic restraint. The product doesn't know what "average" political content looks like across all users. It also tells users how to feel about their data ("higher than average" implies something is wrong), violating the principle of "present data without moral judgment."

**What should change:** Remove this judgmental comparison entirely. If context is needed, state factually: "Political keywords appeared in X% of scanned posts."

---

### MC-7: HowToUnlockBox uses instructional language that implies user is doing something wrong

**Component:** `src/pages/dashboard/DashboardPage.jsx` (HowToUnlockBox, ~line 278)

**Current state:** The box header reads "How to unlock more insights:" followed by tips like "Scan feeds with sponsored content for better detection" or "Run more scans to see promotional patterns."

**Why it falls short:** "How to unlock" is restriction language. The tips also subtly suggest the user's scanning behavior is insufficient, which can feel critical.

**What should change:** Reframe as forward-looking encouragement: "What will appear here" with notes like "This section shows results after scanning 2–3 feeds" — describing what will happen rather than what the user needs to "unlock."

---

### MC-8: Several tooltip and methodology sections missing from tab-level views

**Components:** `src/pages/dashboard/tabs/PoliticsTab.jsx`, `src/pages/dashboard/tabs/SourcesTab.jsx`

**Current state:** Sections like "Ideological distribution" and "Top 10 sources" lack tooltips explaining methodology and limitations. The composition bars appear without methodology disclosure at the section level.

**Why it falls short:** The design standard says "Tooltips proactively explain methodology and acknowledge limitations." The epistemic restraint standard says to "Clarify methodology" and "Acknowledge limits." Without tooltips, users might take categorizations (like "Left" vs. "Right") as definitive rather than approximate.

**What should change:** Add info-icon tooltips to section headers for Ideological distribution ("Categorized based on stance keywords found in post text. This is approximate and may not capture nuance.") and other categorization-heavy sections.

---

## 7. Accessibility

### A-1: Ideological distribution relies on color alone to distinguish Left/Center/Right

**Component:** `src/pages/dashboard/tabs/PoliticsTab.jsx`

**Current state:** The composition bar uses blue, gray, and red segments. In the legend, colored dots accompany text labels, but within the bar itself, segments are only distinguishable by color.

**Why it falls short:** The design standard says "Never rely on color alone to convey meaning" and the dashboard must be "usable by someone who is color-blind." A red-green color-blind user would have difficulty distinguishing the segments within the bar.

**What should change:** Add patterns (stripes, dots, hatching) to bar segments, or add percentage labels inside/adjacent to each segment so the bar is readable without relying on color.

---

### A-2: CompositionBar100WithCounts segments distinguishable only by color

**Component:** `src/components/dashboard/primitives/CompositionBar100WithCounts.jsx`

**Current state:** Bar segments are differentiated solely by background color. Segments under 10% have no text label, making color the only identifier.

**Why it falls short:** Same as A-1 — violates the "never rely on color alone" accessibility requirement. The legend below the bar helps, but within the bar visualization itself, a color-blind user cannot tell segments apart.

**What should change:** Add subtle patterns or texture overlays to segments. For segments over 10%, the percentage text helps; for under 10%, consider adding thin border separators or small label annotations.

---

### A-3: ToneDiffInsight diverging bar lacks screen reader text

**Component:** `src/pages/dashboard/tabs/ToneTab.jsx` (ToneDiffInsight)

**Current state:** The diverging bar chart is a purely visual component with no `aria-label`, `role`, or screen reader description. A screen reader would read the individual text elements but not understand the chart relationship.

**Why it falls short:** The design standard requires "Screen reader compatibility for key metrics." Visual-only charts exclude screen reader users from understanding the comparison.

**What should change:** Add an `aria-label` to the chart container summarizing the comparison, e.g., `aria-label="Political posts are 8 points more negative than non-political posts"`.

---

### A-4: ExpandableDetailRow toggle lacks aria-expanded state

**Component:** `src/pages/dashboard/DashboardPage.jsx` (ExpandableDetailRow, ~line 328)

**Current state:** The expand/collapse button uses "Show more" / "Show less" text but does not include `aria-expanded` attribute.

**Why it falls short:** Interactive elements need accessible state indicators. Without `aria-expanded`, screen reader users cannot determine whether a section is currently expanded or collapsed.

**What should change:** Add `aria-expanded={isExpanded}` to the toggle button element.

---

### A-5: DataCoverageBar and several labels at 11px are below readable minimum

**Components:** `src/pages/dashboard/DashboardPage.jsx` (DataCoverageBar), `src/components/dashboard/ViewCard.jsx` (HowWeMeasureSection)

**Current state:** Multiple text elements use 11px font size (`text-[11px]`).

**Why it falls short:** The accessibility requirement specifies "Readable font sizes (minimum 14px for body text)" and the typography scale sets captions at "12–13px." At 11px, these elements may be illegible for users with moderate vision impairment or on lower-resolution displays.

**What should change:** Increase all 11px text to at least 12px.

---

### A-6: Focus states are inconsistent across interactive elements

**Components:** Various, including `src/components/dashboard/primitives/MiniCalculator.jsx`, `src/pages/dashboard/DashboardPage.jsx` (tab buttons)

**Current state:** Some buttons and inputs have `focus-visible:ring-2 focus-visible:ring-primary-blue/60` while others (like ExpandableDetailRow's toggle button) lack visible focus states entirely.

**Why it falls short:** The design standard requires "Interactive elements must have visible focus states." Inconsistent focus styling means keyboard-only users lose track of their position when tabbing through the dashboard.

**What should change:** Audit all interactive elements (buttons, links, toggles, inputs) and ensure every one includes `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2`.

---

## Recommendations Summary

The dashboard already shows strong foundations — consistent use of InsightHero components, thoughtful section structure, and generally good epistemic restraint in copy. The most impactful improvements would be:

1. **Color overhaul (highest priority):** Remove all red, amber/yellow, and green/red paired indicators from data displays. Replace with the muted palette specified in the design patterns reference. This addresses 7 of the 42 findings and is the single biggest misalignment with the design philosophy.

2. **Progressive disclosure enforcement:** Collapse secondary sections behind "Show more" toggles on tabs with 4+ sections (Ads, Tone, Suggested vs. Followed). This addresses 4 findings and directly improves the 3-second comprehension goal.

3. **Visual hierarchy sharpening:** Ensure each tab has one dramatically larger headline element. Break the equal-weight pattern in card grids by sizing the primary card larger. This addresses 6 findings.

4. **Accessibility fixes:** Add patterns to composition bars, aria attributes to charts, and consistent focus states. These are compliance requirements and address 6 findings.

5. **Microcopy refinement:** Replace restriction language ("Unlock," "Locked," "Warnings") with invitational language. Remove judgmental comparisons ("higher than average"). This addresses 8 findings and brings the product fully into alignment with epistemic restraint.
