# AlgorithmLens: Website → Mobile Parity Audit

## Executive Summary

The mobile app has a solid foundation with all 6 tabs implemented, but **significant content gaps** exist compared to the website. The website has substantially more charts, analysis sections, and visualizations — especially in the Overview, Ads, Tone, and Suggested vs. Followed tabs. The mobile app's Plus-locked sections are mostly **placeholders** (MetricCards with `hasData={false}`), while the website has fully built premium features.

### Critical Product Decision: AI Analysis Is Not Optional

**The mobile app currently gates the Politics and Tone tabs behind an AI consent toggle in Settings, showing "Coming in a future update" placeholders when disabled. This is wrong.** The website has no such gate — it processes AI analysis automatically and renders charts immediately.

**New policy:** AI analysis (Google Gemini) is enabled by default for all users. There is no opt-in toggle. Users agree to AI analysis by using the product. Clear disclosure text ("Powered by Google Gemini AI") should appear on relevant sections for transparency and legal coverage, but the toggle and consent cards must be removed. This means:
- Remove `AiConsentCard` from Politics and Tone tabs
- Remove `AiProcessingCard` "Coming in a future update" placeholders
- Remove the AI analysis toggle from Settings
- Replace with graceful per-section empty states (matching website pattern) when data is insufficient
- Add "Analyzed by Google Gemini" disclosure text to Politics and Tone tab headers

---

## Tab-by-Tab Gap Analysis

### 1. OVERVIEW TAB

| Feature | Website | Mobile | Status |
|---------|---------|--------|--------|
| InsightHero banner | ✅ | ✅ | ✅ Parity |
| Key Metrics (Posts, Ads %, Suggested %, Top 5 %) | ✅ 4 ToplineMetricCards | ✅ BigNumber + 3 supporting cards | ✅ Parity (different layout, same data) |
| Content Types stacked bar | ✅ | ✅ ALStackedBar | ✅ Parity |
| Minutes per day calculators (ads + political) | ✅ 2 MiniCalculators | ✅ 2 time estimate cards | ✅ Parity |
| Content Patterns Observed (6 cards) | ✅ 6 cards (interests, tone, politics, style, diversity) | ⚠️ Partial — only text insights on tone + diversity | 🔴 **GAP: Missing structured 6-card grid** |
| Experiment Suggestions | ✅ ExperimentSuggestionCard (up to 2) | ✅ "Ideas to Explore" section | ✅ Parity (adapted format) |
| Feed Summary (5 bullet points) | ✅ Bulleted text summary | ❌ Not present | 🔴 **GAP** |
| Brands & Influencers (PLUS) | ✅ Top 3 brands + Top 3 influencers | ❌ Not present | 🔴 **GAP** |
| AI-made Content Analysis | ✅ Bar chart + % | ❌ Not present | 🔴 **GAP** |
| How the Feedback Loop Works (4 steps) | ✅ 4 numbered explanation cards | ❌ Not present | 🔴 **GAP** |
| Trends CTA / TrendsPanel (PLUS) | ✅ Full trends comparison | ❌ Not present | 🔴 **GAP** |
| ConcentrationSummary text | ✅ | ❌ Not present as standalone | 🟡 Partial (data exists in Sources tab) |
| MasterNumbersLine footer | ✅ | ❌ Not present | 🟡 Minor gap |

**Overview Gaps: 5 missing features (2 free, 2 paid, 1 educational)**

---

### 2. SOURCES TAB

| Feature | Website | Mobile | Status |
|---------|---------|--------|--------|
| InsightHero banner | ✅ | ✅ | ✅ Parity |
| Summary stats (Top 5 %, Top Source, Total Sources) | ✅ 3 stat cards | ✅ 3-column summary cards | ✅ Parity |
| Top Creators list/table | ✅ SimpleTable (top 5 free / top 10 paid) | ✅ ALBarChart (top 8) | ✅ Parity (different viz, same data) |
| Concentration breakdown bar | ✅ CompositionBar100WithCounts | ✅ ALStackedBar | ✅ Parity |
| ConcentrationSummary text | ✅ Text breakdown (top 5, top 10, others) | ✅ BigNumber + context | ✅ Parity |
| Creator Breakdowns (PLUS) | ❌ Not on website Sources tab | ✅ LockedOverlayCard placeholder | ✅ Mobile-only |
| Extended table (top 10, PLUS) | ✅ Top 10 for Plus users | ❌ No distinction | 🟡 Minor gap |
| Trends CTA / TrendsPanel (PLUS) | ✅ | ❌ Not present | 🔴 **GAP** |
| EvidenceBundleTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| FreeAskTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| DenominatorLine | ✅ | ❌ Not present | 🟡 Minor |
| MasterNumbersLine | ✅ | ❌ Not present | 🟡 Minor |

**Sources Gaps: 1 significant gap (Trends), several minor**

---

### 3. ADS TAB

| Feature | Website | Mobile | Status |
|---------|---------|--------|--------|
| InsightHero banner | ✅ | ✅ | ✅ Parity |
| Summary stats (Ad Posts, Top Advertiser, Ad Density) | ✅ 3 stat cards | ✅ 3-column summary cards | ✅ Parity |
| Ad Composition bar (sponsored/non-sponsored) | ✅ CompositionBar100WithCounts (3 segments: not ads, labeled, unlabeled) | ✅ ALStackedBar (2 segments: sponsored/non) | 🟡 **GAP: Missing unlabeled promo segment** |
| Top Advertised Companies table | ✅ Table (top 3 free / top 5 paid) | ✅ Collapsible list | ✅ Parity |
| Top Advertised Product Types table | ✅ Table (theme, %, examples) | ❌ Not present | 🔴 **GAP** |
| Unlabeled Promotional Content section | ✅ Big number + triggers + example accounts | ❌ Not present | 🔴 **GAP** |
| Tone Split: Selling vs Not Selling | ✅ Side-by-side diverging bars | ❌ Not present | 🔴 **GAP** |
| Ad Detection Note | ✅ | ✅ | ✅ Parity |
| Trends CTA / TrendsPanel (PLUS) | ✅ | ✅ LockedOverlayCard placeholder | 🟡 Placeholder only |
| EvidenceBundleTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| FreeAskTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| MasterNumbersLine | ✅ | ❌ Not present | 🟡 Minor |

**Ads Gaps: 3 significant missing free features + composition bar needs third segment**

---

### 4. POLITICS TAB

| Feature | Website | Mobile | Status |
|---------|---------|--------|--------|
| InsightHero banner | ✅ | ✅ | ✅ Parity |
| AI Consent Gate | ❌ None (AI runs by default) | ✅ AiConsentCard blocks entire tab | 🔴 **REMOVE: AI consent gate** |
| "Coming in a future update" placeholder | ❌ None (shows real empty states) | ✅ AiProcessingCard placeholder | 🔴 **REMOVE: Replace with per-section empty states** |
| "Analyzed by Google Gemini" disclosure | ❌ Not present | ❌ Not present | 🔴 **ADD to both website and mobile** |
| Political Share (big number + text) | ✅ | ✅ BigNumber section | ✅ Parity |
| Top Political Source (handle, %, count, bar) | ✅ | ✅ | ✅ Parity |
| Ideological Distribution (Left/Center/Right bar) | ✅ CompositionBar100WithCounts | ✅ ALStackedBar (collapsible) | ✅ Parity |
| Political Summary sentence | ✅ | ✅ | ✅ Parity |
| Low Sample Indicator | ❌ | ✅ | ✅ Mobile-only (good addition) |
| Trends CTA / TrendsPanel (PLUS) | ✅ | ✅ LockedOverlayCard placeholder | 🟡 Placeholder only |
| EvidenceBundleTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| FreeAskTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| MasterNumbersLine | ✅ | ❌ Not present | 🟡 Minor |

**Politics Gaps: Must remove AI consent gate + "coming soon" placeholder. Otherwise best parity of all tabs.**

---

### 5. TONE TAB

| Feature | Website | Mobile | Status |
|---------|---------|--------|--------|
| InsightHero banner | ✅ | ✅ | ✅ Parity |
| AI Consent Gate | ❌ None (AI runs by default) | ✅ AiConsentCard blocks entire tab | 🔴 **REMOVE: AI consent gate** |
| "Coming in a future update" placeholder | ❌ None (shows real empty states) | ✅ AiProcessingCard placeholder | 🔴 **REMOVE: Replace with per-section empty states** |
| "Analyzed by Google Gemini" disclosure | ❌ Not present | ❌ Not present | 🔴 **ADD to both website and mobile** |
| Tone Distribution bar (Pos/Neutral/Neg) | ✅ CompositionBar100WithCounts | ✅ ALStackedBar | ✅ Parity |
| Top 5 Sources by Positive Volume | ✅ Ranked list with bars | ✅ "Most Positive Sources" list | ✅ Parity |
| Top 5 Sources by Negative Volume | ✅ Ranked list with bars | ✅ "Most Negative Sources" list | ✅ Parity |
| Tone: Political vs Non-Political comparison | ✅ ToneDiffInsight (diverging bars + delta) | ❌ Not present | 🔴 **GAP** |
| Tone: Selling vs Not Selling comparison | ✅ ToneDiffInsight (diverging bars + delta) | ❌ Not present | 🔴 **GAP** |
| Tone: Suggested vs Followed comparison | ✅ (in Suggested tab on website) | ✅ Mini bars in Tone tab | ✅ Parity (different location) |
| Summary Stats text | ✅ | ✅ | ✅ Parity |
| Low Sample Indicator | ❌ | ✅ | ✅ Mobile-only |
| Trends CTA / TrendsPanel (PLUS) | ✅ | ❌ Not present | 🔴 **GAP** |
| Rare Content Detection (PLUS) | ❌ | ✅ LockedOverlayCard placeholder | ✅ Mobile-only |
| EvidenceBundleTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| FreeAskTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| MasterNumbersLine | ✅ | ❌ Not present | 🟡 Minor |

**Tone Gaps: 2 significant missing free features (tone cross-comparisons)**

---

### 6. SUGGESTED vs. FOLLOWED TAB

| Feature | Website | Mobile | Status |
|---------|---------|--------|--------|
| InsightHero banner | ✅ | ✅ | ✅ Parity |
| Content Origin bar (Following/Suggested) | ✅ CompositionBar100WithCounts | ✅ ALStackedBar | ✅ Parity |
| By Platform breakdown | ✅ Per-platform stacked bars | ❌ Not present | 🔴 **GAP** |
| Are These New Voices? (novelty stats) | ✅ 3 stat cards + BigNumber + text | ✅ BigNumber + 3-column cards + text | ✅ Parity |
| Commercial Content Comparison (Suggested vs Followed ads) | ✅ Side-by-side composition bars + delta | ❌ Not present | 🔴 **GAP** |
| Tone: Suggested vs Followed | ✅ Side-by-side composition bars + delta | ❌ Not present (exists in Tone tab instead) | 🟡 Partial |
| Top Topics in Suggested Content | ✅ Dual top-5 lists with horizontal bars | ❌ Not present | 🔴 **GAP** |
| Content Format Preferences table | ✅ Table (format, suggested %, followed %, delta) | ❌ Not present | 🔴 **GAP** |
| What You Can Do (3 action items) | ✅ 3 numbered action cards | ✅ "Ideas to Explore" (3 suggestions) | ✅ Parity (adapted) |
| Trends CTA / TrendsPanel (PLUS) | ✅ | ❌ Not present | 🔴 **GAP** |
| EvidenceBundleTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| FreeAskTeaser (PLUS) | ✅ | ❌ Not present | 🟡 Minor |
| MasterNumbersLine | ✅ | ❌ Not present | 🟡 Minor |

**Suggested Gaps: 4 significant missing free features — worst parity of all tabs**

---

## Summary of All Gaps

### ARCHITECTURAL FIX (Highest Priority)

| # | Tab | Change Required | Complexity |
|---|-----|----------------|------------|
| 0a | Politics + Tone | Remove AiConsentCard gate — AI is always on | Medium |
| 0b | Politics + Tone | Remove "Coming in a future update" AiProcessingCard placeholders | Low |
| 0c | Politics + Tone | Add per-section graceful empty states (matching website pattern) | Medium |
| 0d | Politics + Tone | Add "Analyzed by Google Gemini" disclosure text | Low |
| 0e | Settings | Remove AI analysis toggle | Low |

### FREE TIER GAPS (High Priority)

| # | Tab | Missing Feature | Complexity |
|---|-----|----------------|------------|
| 1 | Overview | Content Patterns Observed (6-card grid) | Medium |
| 2 | Overview | Feed Summary (5 bullet points) | Low |
| 3 | Overview | AI-made Content Analysis (bar + %) | Medium |
| 4 | Overview | How the Feedback Loop Works (4 steps) | Low |
| 5 | Ads | Top Advertised Product Types table | Medium |
| 6 | Ads | Unlabeled Promotional Content section | Medium |
| 7 | Ads | Tone Split: Selling vs Not Selling | Medium |
| 8 | Ads | Ad Composition bar — add 3rd segment (unlabeled promos) | Low |
| 9 | Tone | Tone: Political vs Non-Political comparison | Medium |
| 10 | Tone | Tone: Selling vs Not Selling comparison | Medium |
| 11 | Suggested | By Platform breakdown | Medium |
| 12 | Suggested | Commercial Content Comparison | Medium |
| 13 | Suggested | Top Topics in Suggested Content | Medium |
| 14 | Suggested | Content Format Preferences table | Medium |

### PLUS TIER GAPS (Lower Priority)

| # | Tab | Missing Feature | Complexity |
|---|-----|----------------|------------|
| 15 | Overview | Brands & Influencers section | Medium |
| 16 | All Tabs | TrendsCTA / TrendsPanel (currently placeholders or missing) | High |
| 17 | All Tabs | EvidenceBundleTeaser cards | Low |
| 18 | All Tabs | FreeAskTeaser cards | Low |

### MINOR GAPS (Lowest Priority)

| # | Tab | Missing Feature |
|---|-----|----------------|
| 19 | All | MasterNumbersLine footer context |
| 20 | All | DenominatorLine context lines |
| 21 | Sources | Top 5 vs Top 10 distinction for free/paid |

---

## Proposed Cowork Prompt Plan

### Prompt 0: Remove AI Consent Gate — Make AI Analysis Default
**Scope:** Architectural fix — Politics and Tone tabs should never be gated behind a consent toggle
- Remove `AiConsentCard` component from Politics and Tone tab rendering
- Remove `AiProcessingCard` "Coming in a future update" placeholder
- Remove the AI analysis toggle from Settings screen
- Instead, render the full tab structure with per-section empty states when insufficient data (e.g., "Not enough political posts yet — scan more content to see a full breakdown")
- Add subtle "Analyzed by Google Gemini" disclosure text near the InsightHero on Politics and Tone tabs
- Ensure the scan pipeline always sends data to Gemini for analysis (no consent check gating the API call)

**Why first:** This unblocks the Politics and Tone tabs from being dead-end placeholders, which is a prerequisite for adding the missing charts in Prompts 3 and beyond.

### Prompt 1: Overview Tab — Free Feature Parity
**Scope:** Add 4 missing free features to Overview tab
- Content Patterns Observed (6-card grid: interests, tone, politics, style, diversity, + optional)
- Feed Summary (5 bullet points summarizing the scan)
- AI-made Content Analysis (composition bar showing AI-labeled/C2PA/no signals)
- How the Feedback Loop Works (4 numbered educational cards)

**Data available:** All data fields already exist in scan results — just need UI components.

### Prompt 2: Ads Tab — Free Feature Parity
**Scope:** Add 3 missing sections + fix composition bar
- Update Ad Composition bar to show 3 segments (not ads / labeled ads / unlabeled promos) instead of 2
- Add Top Advertised Product Types table (theme, % of labeled ads, example advertisers)
- Add Unlabeled Promotional Content section (big number, top triggers, example accounts)
- Add Tone Split: Selling vs Not Selling comparison (side-by-side bars)

**Data available:** `ad_metadata`, `influence` signals, and `emotions.valence` fields already in scan data.

### Prompt 3: Tone Tab — Free Feature Parity
**Scope:** Add 2 missing tone cross-comparisons
- Add Tone: Political vs Non-Political comparison (side-by-side bars with delta insight)
- Add Tone: Selling vs Not Selling comparison (side-by-side bars with delta insight)

**Data available:** Political classification + tone valence already in scan data.
**Note:** Will need a reusable "ToneDiffInsight" component for mobile (two side-by-side bars with delta text).

### Prompt 4: Suggested Tab — Free Feature Parity
**Scope:** Add 4 missing analysis sections
- By Platform breakdown (per-platform stacked bars, only when multi-platform)
- Commercial Content Comparison (side-by-side ad % bars for suggested vs followed)
- Top Topics in Suggested Content (dual top-5 horizontal bar lists)
- Content Format Preferences table (format, suggested %, followed %, delta)

**Data available:** Platform, ad status, topics, and content type fields already in scan data.

### Prompt 5: Plus Features — Brands & Influencers + Teasers
**Scope:** Add Plus-gated features across tabs
- Overview: Brands & Influencers section (top 3 brands + top 3 influencers, locked for free users)
- All tabs: Add EvidenceBundleTeaser cards for free users
- All tabs: Add FreeAskTeaser cards for free users

### Prompt 6: Plus Features — Trends System
**Scope:** Build out the trends comparison system
- Replace placeholder MetricCards with actual TrendsCTA component for free users
- Build TrendsPanel equivalent for Plus users (comparison across scans)
- Apply across all 6 tabs

**Note:** This is the highest-complexity prompt and may need the most testing.

### Prompt 7: Polish & Footer Context
**Scope:** Minor UI additions
- Add MasterNumbersLine equivalent footer to each tab
- Add DenominatorLine context under charts
- Sources tab: Implement top 5 vs top 10 distinction for free/paid
- Final QA pass for visual consistency

---

## Recommended Execution Order

**Phase 0 — Unblock AI Tabs (Prompt 0)**
0. Prompt 0 (Remove AI consent gate) — must come first to unblock Politics + Tone tabs

**Phase 1 — Free Feature Parity (Prompts 1-4)**
These are the most impactful since they affect all users. Suggested order:
1. Prompt 1 (Overview) — sets patterns for other tabs
2. Prompt 3 (Tone) — creates ToneDiffInsight component reused in Prompts 2 and 4
3. Prompt 2 (Ads) — uses ToneDiffInsight component
4. Prompt 4 (Suggested) — largest scope, benefits from established patterns

**Phase 2 — Plus Features (Prompts 5-6)**
5. Prompt 5 (Brands/Influencers + Teasers)
6. Prompt 6 (Trends System)

**Phase 3 — Polish (Prompt 7)**
7. Prompt 7 (Footer context + minor fixes)
