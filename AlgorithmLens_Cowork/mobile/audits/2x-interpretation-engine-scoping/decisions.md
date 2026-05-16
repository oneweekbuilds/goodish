# 2.x interpretation engine: scoping investigation

Read-only investigation conducted May 2026 against the merged main branch (commit d5573cb7). This document is the engineering scoping baseline for the eventual 2.x interpretation engine implementation. Implementation has not started.

## Status

Investigation complete. No code changes proposed. This document is the foundation for whoever picks up the engine implementation work.

Related design specifications:
- `mobile/audits/algorithmlens-2x-interpretation-layer-brief.md` (strategic context)
- `mobile/audits/2x-results-design/decisions.md` (Results screen design spec)
- `mobile/audits/2x-dashboard-design/decisions.md` (Dashboard design spec)

## Headline finding

The current pipeline already captures all the raw data needed for every interpretation capability the design specs describe. No new scan-time data needs to be captured. The gap is entirely at derivation — `computeDashboardData()` operates on one scan at a time, while the engine needs to operate on `scans[]` for cross-scan aggregation.

This is the bullish reading. The shape of the engine work is "build a derivation layer that aggregates across scans plus an orchestrator that selects templates," not "rebuild the capture pipeline."

## Part 1: Current data pipeline

### 1.1 Scan capture to UI render

Six distinct stages from capture to render:

1. **Capture (broadcast):** iOS Broadcast Extension (`mobile/modules/broadcast/ios/`) uses ReplayKit to capture frames from the platform app. Frames plus per-frame OCR persist to an in-memory `analysisDataStore` (`mobile/src/lib/analysis/analysisDataStore.ts`). When the user stops recording, the broadcast screen consumes this store and routes to `/analysis/[sessionId]` with a fresh session ID.

2. **Pipeline orchestration:** `BroadcastAnalysisPipeline` (`mobile/src/lib/analysis/broadcastAnalysisPipeline.ts`, 776 lines) runs six stages: PREPARING → ANALYZING → DEDUPLICATING → BUILDING → SAVING → COMPLETE. Driven by `useAnalysis` (`mobile/src/hooks/useAnalysis.ts`).

3. **Gemini analysis (per-frame):** `GeminiFlashService` (`mobile/src/lib/analysis/geminiFlashService.ts`) calls Google Gemini 2.0 Flash directly from the client using `EXPO_PUBLIC_GEMINI_API_KEY`. Prompt structure in `mobile/src/lib/analysis/analysisPrompts.ts` (283 lines): a system prompt plus per-frame user prompt that includes platform hints, OCR text, and an explicit JSON schema. Gemini returns `GeminiFrameResponse { frame_id, extraction_confidence, items: GeminiExtractedItem[] }` per frame, where each item is `{ content_type, creator_handle, creator_display_name, is_ad, is_suggested, post_text, hashtags, topics, political, wellbeing, emotions, source_origin, ai_disclosure }`.

4. **Deduplication:** Two-pass. First `localDedup.ts` runs deterministic local dedup (handle + post_text substring matching). Then a second LLM dedup pass via Gemini using `buildDeduplicationPrompt`.

5. **Build (UnifiedScanResult):** Aggregates `{ total_feed_items, ad_percentage, topic_distribution, political_content_summary, ... }`, `feed_items[]`, `environment { broadcast_capture { duration_seconds, ... } }`, `metadata`, `privacy_info`, `debug_info`.

6. **Persist (Supabase):** Inserted into `scans` table as a `ScanDetail` row. Top-level columns: `id, scan_id, created_at, platform, user_id, post_count, ad_count, ad_percentage, suggested_count, suggested_percentage`. Full result lives in `raw_data` (JSONB).

7. **Read (Dashboard):** `useDashboard` (`mobile/src/hooks/useDashboard.ts`) fetches up to 50 scans per user, sorted desc by `created_at`. Exposes `{ scans, latestScan, loading, error, refresh }`. The Dashboard screen passes `activeScan` (either `scanId`-matched from History deep-link or `latestScan`) to `computeDashboardData()`.

8. **Render:** Dashboard renders six tab components, each reading specific slices of `DashboardData`. The Results screen renders four trivial findings directly from `UnifiedScanResult` (separate path from Dashboard).

### 1.2 `computeDashboardData()` in detail

`mobile/src/lib/computeDashboardData.ts` is 1,741 lines and is the load-bearing function for everything the Dashboard shows. Single entry: takes one `ScanRecord`, returns one `DashboardData`.

**Inputs consumed from the scan record:**
- Raw posts array (`raw_data.posts`): `creator_handle, creator_display_name, post_text, is_ad, is_suggested, content_type, hashtags, ad_label_text`
- Gemini analysis (`raw_data.analysis.feed_items`): per-item political and emotion classifications, `ai_disclosure` flag, creator/handle
- Top-level scan stats: `platform, post_count, ad_count, suggested_count`

**Outputs (DashboardData):** ~30 fields across core counts (`totalPosts, adCount, adPct, suggestedPct, followedPct`), top creators (`topCreators, top5Pct, uniqueCreatorCount`), tab-specific analysis blocks (`politicalAnalysis, toneAnalysis, toneBySourceOrigin, toneBySelling, toneByPolitical, creatorNovelty, byPlatform, commercialComparison, unlabeledPromos, topAdvertisedProductTypes, brandsAndInfluencers`), six pre-baked `InsightHeroData` blocks (one per tab: `overviewInsight, sourcesInsight, adsInsight, suggestedInsight, politicsInsight, toneInsight`), and flag fields (`hasData, hasPoliticsData, hasToneData`).

**Threshold logic — already present at a primitive level.** The function's "Insight Builders" section (lines 388-740+) contains six builders: `buildOverviewInsight, buildSourcesInsight, buildAdsInsight, buildSuggestedInsight, buildPoliticsInsight, buildToneInsight`. Each follows an identical pattern:
```

if (totalPosts < 10) return { title: 'Not enough data yet', meaning: '...', whyCare: null, meta } if (metricPct >= upperThreshold) return { title: '...', meaning: '...', whyCare: 'Above typical range', meta } else if (metricPct >= lowerThreshold) return { title: '...', meaning: '...', whyCare: 'Within typical', meta } else return { title: '...', meaning: '...', whyCare: 'Below typical', meta }

```

This already implements primitive rule-based template selection. The 2.x design specs essentially extend this concept along four orthogonal dimensions: cross-scan awareness, four-mode mode discrimination (OBSERVED/LIKELY/SOMETHING TO TRY/QUESTION), comparative anchors against running averages, and voice rule enforcement.

The threshold values themselves are hard-coded (e.g., `top5Pct >= 60` is "concentrated"; `top5Pct >= 40` is "typical"). Each branch has matching prose for `title`, `meaning`, and `whyCare`. Sample-size gates fall to a "not enough data" template when `totalPosts < 10` or specific subset counts (e.g., political) fall below 10.

The hero `pickHeroStat` cascade in each tab component layers a second tier of threshold logic on top of these builders. For example, `OverviewTab`'s `pickHeroStat` tests `data.suggestedPct > 50` first, then `data.adPct > 15`, then `data.top5Pct > 70`, then top-creator-share (the three-tier copy just landed in 1.1.1), then `totalPosts` fallback.

### 1.3 Results screen flow

Separate data path. `app/analysis/[sessionId].tsx` renders a two-card state machine (Analyzing / Results) driven by `useAnalysis`. The Results card uses `UnifiedScanResult` directly (the in-memory result from the pipeline), not the persisted `ScanDetail` and not `DashboardData`.

The Results card has four "Key Findings" rows generated by four local `interpret` functions inside the analysis screen file (lines 540-580):
- `interpretAds(result)`: `${pct}% of your feed was ads` or "No ads detected"
- `interpretPatterns(result)`: `Top category: ${topics[0].category}` or item count
- `interpretPolitical(result)`: `${pct}% political content` or "No political content detected"
- `interpretTone(result)`: counts valence buckets, picks the dominant

These are completely separate from `computeDashboardData` and don't share threshold logic. The interpretations are intentionally trivial (one-line, single-metric). The hero is currently a `total_feed_items` count (64/72/600 brand-blue tabular), not a verdict. The 2.x Results design proposes replacing both the hero and the findings with the four-mode interpretation system.

The "View full dashboard" CTA routes to `/(tabs)/dashboard` where the user gets the full 6-tab `computeDashboardData`-driven view.

## Part 2: Design spec capabilities required

The design specs require 22 distinct interpretation capabilities. Summary table:

| # | Capability | Data needed | Already in pipeline? |
|---|-----------|-------------|---------------------|
| 1 | Single-scan threshold verdict | One scan | Yes |
| 2 | Comparative anchor against running average | Last N scans on platform | No |
| 3 | Comparative anchor against population baseline | External platform baselines | No |
| 4 | Cross-scan trajectory series | All scans on platform, time-ordered | No (data is there, no derivation) |
| 5 | Creator recurrence ("in 5 of last 6 scans") | Last 6+ scans, per-creator presence | No (data is there, no derivation) |
| 6 | Creator novelty ("first appeared scan 5") | Full scan history per platform | No (data is there, no derivation) |
| 7 | Advertiser persistence | Same as creator recurrence | No (data is there, no derivation) |
| 8 | Source attribution within category | One scan | Yes (politics); not for other categories |
| 9 | Cross-metric correlation | All scans on platform, multi-metric series | No |
| 10 | Quiet-followed-creator detection | Per-creator last-seen timestamps across scans | No |
| 11 | Topic divergence (suggested vs followed) | One scan | Yes |
| 12 | OBSERVED sub-line (raw fact from scan) | Same as existing meaning strings | Yes (just needs reformat) |
| 13 | LIKELY sub-line (hedged inference about cause) | Mostly population-level generic claims + per-user data | Partial — generic claims need authoring |
| 14 | SOMETHING TO TRY coaching beat | Pattern-strength threshold + coaching template per pattern | No |
| 15 | A QUESTION FOR YOU mode | Detected shift + uncertainty about cause | No |
| 16 | Finding-dot per tab (strong-finding boolean) | Derived from interpretation engine output | No |
| 17 | Calm-case verdict generation (specific without eventful) | One scan + history | Partial — running average needed |
| 18 | Three-tier hero copy concentration | One scan | Yes (just shipped in 1.1.1) |
| 19 | Hypothetical specificity move | Template-only, no new data | Yes (just template work) |
| 20 | Voice-rule enforcement | Template review process | Partial (existing builders mostly comply) |
| 21 | Trajectory sparkline data | Per-scan time series per metric per platform | No (data is there, no derivation) |
| 22 | Per-platform running average | All scans on platform | No (data is there, no derivation) |

**Single most important observation:** the current pipeline already captures all the raw data needed for capabilities 1-22. No new scan-time data needs to be captured. What's missing is cross-scan aggregation logic. `computeDashboardData` operates on one scan at a time; the engine needs to operate on `scans[]` for capabilities 2, 4-7, 9-10, 21-22.

Two capabilities require external data: capability 3 (platform population baselines like "typical for YouTube") and arguably capability 19 (the hypothetical specificity move sometimes refers to general algorithm-mechanism knowledge that's not in the scan data). The former requires authored config; the latter is purely template prose.

## Part 3: Gap analysis

### Already supported (6 items)

- Single-scan threshold verdicts (capabilities 1, 18) — the existing six insight builders ARE this, just dressed differently
- Per-scan source attribution for politics (capability 8 — `politicalAnalysis.topPoliticalSource` is already computed)
- Topic divergence (capability 11 — already in `topTopicsBySuggested` and `topTopicsByFollowed`)
- Sample-size gating (`if totalPosts < 10` and `lowSample` flags already exist)
- The per-tab `howWeMeasure` methodology prose (already lifted onto `data.xxxInsight.howWeMeasure` for redesigned tabs)
- Voice rule compliance is partial — existing strings broadly comply but some borderline cases would need review

### Small lift (5 items)

- Reformatting existing strings into four-mode sub-lines (capabilities 12, 13 partial). The existing "meaning" string becomes OBSERVED; a new "likely" template gets authored per branch.
- Source attribution beyond politics (capability 8 for other categories). The same pattern that produced `topPoliticalSource` can produce `topAdSource`, `topNegativeSource`, etc. — these mostly already exist (`topAdvertisers`, `topNegativeSources`).
- Hypothetical specificity prose (capability 19). Pure copy work.
- Three-tier hero copy extension to non-Sources tabs (already done in Overview and Sources during 1.1.1; same pattern for Ads, Politics, Tone).
- Finding-dot derivation (capability 16). Boolean computed from interpretation engine's output. Trivial once engine exists.
- Calm-case templates (capability 17 partial). New template branches with explicit non-eventful wording.

### Medium lift (5 items)

- **Cross-scan aggregation infrastructure.** The single biggest missing piece. Need a derivation layer that takes `scans: ScanDetail[]` (the array already returned by `useDashboard`) and produces per-platform, per-metric running aggregates: averages over the last N scans, trajectory time series, max/min/median across history. This becomes the data source for capabilities 2, 4, 17, 21, 22.
- **Creator recurrence detection** (capabilities 5, 6). Walk `scans[].raw_data.top_creators` (or aggregate from `raw_data.posts`) across the history. Build a `{handle: { firstSeenScanIdx, scanCountSeen, totalPosts }}` map per platform. Recurrence is `scanCountSeen / totalScansOnPlatform`. Novelty is `firstSeenScanIdx === currentScanIdx`. All data is in `raw_data` of each scan.
- **Advertiser persistence** (capability 7). Same pattern, applied to `topAdvertisers` across scans.
- **Quiet-followed-creator detection** (capability 10). Per-creator last-seen-in-scan tracking. Filter to followed-only. Compute time-since-last-appearance.
- **Cross-metric correlation** (capability 9). Compute pairwise correlations between metric series across scan history. Surface when correlation > threshold and explain the relationship.

None of these require new data capture. All are pure-derivation logic that takes `scans[]` and computes new fields.

### Large lift (4 items)

- **The interpretation engine itself.** The orchestrator that takes the augmented data (current scan + cross-scan aggregates + per-creator history maps) and decides which template fires at which mode slot. Includes the calibration of "what threshold makes a finding strong enough to warrant a tab dot."
- **The four-mode sub-line design-system primitives.** Today the design system has `HeroStatCard, InfluencerRow, StackedBar, ComparisonPair, CategoryRow, CautionBadge, ExpandableCard, SectionHeader, DisclosureRow, MicroSectionHeader`. The Dashboard design spec introduces six new row variants (`FactRow, CreatorRow, TrajectoryRow, BarRow, CaveatNote, MethodologyRow`) and the sub-line zone primitives (OBSERVED marker, LIKELY marker, SOMETHING TO TRY marker, QUESTION italic-with-left-rule). None of these exist today.
- **Population-baseline data sourcing** (capability 3). "Typical for YouTube" requires either hand-curated config or some method of deriving population baselines. Could be authored as a static config file in MVP.
- **Coaching threshold calibration.** No methodology exists yet for "what's strong enough." Likely requires user research, not just engineering.

### Missing data

No scan-time data is missing. Everything the engine needs is already captured. One quality flag: empty `displayName` from Gemini extraction (tracked in issue #6) affects creator identity for recurrence detection. The 1.1.x rendering fix swallows the symptom; the engine needs to filter at engine time and acknowledge the rate of unidentified creators when surfacing recurrence claims.

Edge case: a creator changing handles between scans appears as two distinct creators. Likely acceptable for MVP.

## Part 4: Proposed implementation shape

### 4.1 Architecture

**Location:** new module `mobile/src/lib/interpretation/`. Sibling to `mobile/src/lib/computeDashboardData.ts`, not a replacement. The existing function continues to derive per-scan metrics that the engine consumes. The engine adds the cross-scan and interpretive layer on top.

**Module structure:**

- `interpretation/interpretationEngine.ts` — orchestrator. Single public function `interpretScan(activeScan, scans, dashboardData)` returns `InterpretationResult { verdict, sublines: Subline[], supportingRows: SupportingRow[], findingDot: boolean }` per surface (Results, Overview, Sources, etc.).
- `interpretation/derivations/` — pure cross-scan aggregations: `rollingAverage.ts`, `creatorRecurrence.ts`, `advertiserPersistence.ts`, `trajectorySeries.ts`, `quietCreators.ts`, `crossMetricCorrelation.ts`. Each takes `scans[]` and produces structured aggregations.
- `interpretation/templates/` — per-surface, per-pattern template definitions. Each template is `{ when: (ctx) => boolean, verdict: string, observed: string, likely: string, coaching?: string, question?: string }`. The engine evaluates `when` predicates in priority order and picks the first match (or a default calm-case template).
- `interpretation/interpretation-types.ts` — `Subline { mode: 'OBSERVED' | 'LIKELY' | 'COACHING' | 'QUESTION', text: string }`, `SupportingRow { variant: 'fact' | 'creator' | 'trajectory' | 'bar' | 'caveat' | 'methodology', ...variant-specific fields }`, etc.

**Integration:**

- `useDashboard` gains an `interpretation` field next to `dashboardData`. The hook calls `interpretScan` with both `activeScan` and the full `scans[]` array. Additive — no existing callers break.
- For the Results screen: same pattern. `useAnalysis` already has `result: UnifiedScanResult`; the scans history could be passed in separately (or fetched alongside via a new hook). The Results interpretation needs platform history to produce comparative anchors.

**Output format:** structured objects, not strings. Each `Subline` carries its mode discriminator so the UI can render the correct visual treatment (filled square / hollow ring / arrow / italic with left rule). Each `SupportingRow` carries its variant discriminator. This decision should be made early because string-only output makes it hard to add mode discrimination later.

**Template selection:** rule-based for MVP. TypeScript-data templates with `when` predicates that close over the augmented context (current scan + aggregates + history). Predicates are deterministic, testable in isolation. LLM-driven selection deferred to a later cycle. The structured `Subline`/`SupportingRow` output format lets either driver back the same UI shape.

### 4.2 MVP-critical vs nice-to-have

**MVP-critical (must exist for a 2.x ship):**

- The interpretation engine orchestrator (the public `interpretScan` function)
- Cross-scan rolling average derivation (`rollingAverage.ts`)
- The four-mode UI primitives in the design system (or at minimum: OBSERVED and LIKELY)
- OBSERVED + LIKELY pair per surface (the workhorse pair — every scan gets these)
- Threshold-based template selection
- Voice rule enforcement at template authoring time (not runtime; templates are reviewed against the rule)
- Results screen integration (proof-of-concept surface)
- Calm-case templates for every surface
- Per-platform running average for at least: `ad_pct, political_pct, top_creator_share`, tone breakdown

**Nice-to-have (can ship 2.0 without; add later):**

- Creator recurrence detection (the @MarquesBrownlee-in-5-of-6 pattern)
- Advertiser persistence detection
- Quiet-followed-creator detection
- Cross-metric correlation
- SOMETHING TO TRY coaching mode (defer; voice/frequency calibration is real work)
- QUESTION mode (defer; frequency calibration is real work and lower-frequency surface)
- Sparkline / trajectory visualization
- LLM-driven interpretation selection
- Population baselines ("typical for YouTube")
- Finding-dot threshold on Dashboard (depends on full engine for accurate signal)

The MVP basically delivers: hero-as-verdict + OBSERVED + LIKELY (vs running average) on Results and Overview. That's enough to validate the dashboard-to-coach frame before scaling the engine to all six tabs and adding the coaching/question modes.

**Important caveat:** The MVP as defined ships Results brilliantly but undersells Dashboard. Most of the Dashboard design spec's "revelation" moments depend on creator recurrence and advertiser persistence (the nice-to-have items). If Dashboard launch is the goal, those capabilities probably move from nice-to-have to MVP-critical. That's a meaningful scope addition worth deciding before implementation starts.

### 4.3 Architectural lock-ins

Decisions that would be hard to reverse:

- **String vs structured output:** starting with strings forecloses mode discrimination later. Recommend structured from start.
- **Engine location (client vs server):** client-side keeps PII local and matches the brand's privacy posture. Recommend client-side for MVP.
- **Rule-based vs LLM-driven:** rule-based is faster to ship and predictable. LLM-driven is richer but requires guardrails. Both can produce the same `InterpretationResult` shape, so somewhat reversible. Recommend rule-based for MVP.
- **Per-scan vs incremental computation:** per-scan re-runs the engine on every dashboard load. Incremental caches derived aggregates per user per platform. Recommend per-scan for MVP (cheap enough at 50 scans, no cache invalidation problem). Add caching when scans-per-user grows.
- **Replacing vs augmenting `computeDashboardData`:** recommend augmenting for MVP — let the existing builders continue to feed `data.xxxInsight.meaning` for tabs that haven't been ported to the new four-mode UI yet. Migrate tab-by-tab.

## Part 5: Risks and open questions

### Top risks

1. **Cold-start risk (highest probability, highest impact).** First-scan users have no history. Every Level-2 capability (running average, trajectory, creator recurrence) is unavailable. The engine must degrade gracefully to Level-1 generic interpretations, and the calm-case design (Outcome B in Results design) handles this for first scans. But cold-start users see the product at its weakest — they get the most generic experience. Risk that the dashboard-to-coach frame fails to demonstrate value on first scan and users churn before the engine warms up.

2. **Sparse-history risk.** Users with 2-3 scans on a platform aren't truly cold-start but also can't sustain a "running average" claim with meaningful confidence. The engine needs explicit sample-size gating per derivation (current `if totalPosts < 10` pattern in `computeDashboardData` is the right precedent). Risk that templates fire trajectory claims like "your political content climbed from 4% to 11%" when the user only has two scans, which is statistical noise. Mitigation: every cross-scan derivation needs a minimum-sample threshold.

3. **Multi-platform risk.** The design spec is explicit that interpretations should be platform-scoped by default. A user with 10 YouTube scans and 1 Instagram scan should NOT borrow YouTube interpretations for their Instagram scan. Risk that the engine accidentally pulls from the wrong platform's history. Mitigation: every aggregation explicitly filters by platform; cross-platform interpretation is a separate, labeled mode.

4. **Template overfit to canonical user state.** The Dashboard design's 6th-scan-YouTube state is a coherent story (political climb correlated with tone shift, recurring creator, quiet followed-creator filling the gap with news). Real scans are messier. Risk that templates designed for the canonical state miss real-world patterns: non-monotonic political shifts, multiple recurring creators with different patterns, ad density spikes that don't correlate with anything. Mitigation: every template needs a sanity-check predicate beyond the trigger condition; if the predicate fails, fall through to calmer alternatives.

5. **Voice drift over time.** The Dashboard design pass already surfaced two anthropomorphism violations during rendering (Tab 2 "high confidence" and Tab 6 "reaches into recommendations"). As templates multiply, voice drift will recur. Risk that the locked voice rule (extended in commit de475f66) erodes through incremental template additions. Mitigation: voice-rule review must be a template-authoring gate, not a post-hoc cleanup.

6. **Empty-creator-data quality risk.** Issue #6 tracks the underlying question of why Gemini emits empty displayName for some resolved creators. The 1.1.x rendering fix swallows the symptom but the engine relies on creator handles for recurrence detection. If 20% of detected creators have unusable identity, recurrence detection becomes noisy. Mitigation: filter at engine time + acknowledge the rate of unidentified creators when surfacing recurrence claims.

7. **Performance risk.** `useDashboard` returns up to 50 scans. Computing rolling averages, creator recurrence, advertiser persistence, and trajectory series for 50 scans on every dashboard load is real work. The current `computeDashboardData` is already 1,741 lines for one scan. Risk that the engine adds enough cost that the dashboard feels slow on cold load. Mitigation: profile with realistic data before shipping; consider caching derived aggregates between renders.

### Open questions

1. **Engine versioning / template management:** hard-coded TS data, JSON config bundled in the app, or remote-fetched at runtime? Affects iteration speed for copy changes. Remote-fetched allows non-engineering edits but adds latency and offline complexity.

2. **Population baseline sourcing:** "typical for YouTube ad density is 10-18%" is referenced in the strategic brief and Outcome C. Where does that come from? Hand-curated config (simplest, most maintainable), ML-derived from aggregated anonymous user data (most accurate, requires backend), or skipped entirely in MVP (most pragmatic)?

3. **Threshold calibration:** every capability has a "is this strong enough" question. Coaching beat threshold, finding-dot threshold, recurrence threshold, persistence threshold. Each needs an initial number. Who calibrates these — designer judgment, user research, telemetry?

4. **Engine output for calm scans:** when every metric is close to average and nothing notable trajectory-wise, what does the engine emit? The Dashboard design's calm-case Ads tab is one approach ("Your ads have been steady"). But the engine has to reliably recognize "nothing to say" — that's a non-trivial classifier.

5. **Creator identity stability:** a creator changing handles between scans appears as two distinct creators today. Edge case but worth deciding.

6. **Replacement strategy for `computeDashboardData` insight builders:** do they continue to feed `data.xxxInsight.meaning` for backward compat with un-migrated tabs, or get deprecated atomically with the engine launch? Affects migration shape.

7. **MVP scope decision:** ship the engine on Results screen only first, then expand tab-by-tab? Or ship all six Dashboard tabs together? The Results-first approach validates the concept on the simplest surface; the all-at-once approach delivers a coherent product moment.

8. **First-party engagement signal capture:** the design spec mentions the QUESTION mode could capture user-confirmed signal (e.g., user confirms "yes, I've been engaging with political content"). Does this become a new data table? If so, how does it feed back into future interpretations?

## Carry-forward to implementation

When implementation starts, the recommended sequence is:

1. **Establish the engine module structure** (`mobile/src/lib/interpretation/`) and the `InterpretationResult` types
2. **Build the first derivation** (rolling average per platform per metric) — simplest cross-scan aggregation, immediate value
3. **Build the design system primitives** (OBSERVED marker, LIKELY marker, simplified verdict eyebrow) — UI work that can happen in parallel with derivations
4. **Build the orchestrator** with rule-based template selection for the simplest case (Results screen, OBSERVED + LIKELY only)
5. **Integrate on Results screen first** as proof-of-concept
6. **Scale to Dashboard Overview tab** to validate the pattern across surfaces
7. **Expand to other Dashboard tabs** incrementally

Each step is shippable on its own and produces user-visible value. The full design spec for all six Dashboard tabs is the destination; the path is incremental.

Investigation complete. This document is the engineering scoping baseline. Implementation has not started.
