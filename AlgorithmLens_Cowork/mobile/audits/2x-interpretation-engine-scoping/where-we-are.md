# 2.x interpretation engine: implementation status

## ⚠ Reminder for future sessions: Mac device test required before TestFlight

**Status as of resume**: The 2.x interpretation engine MVP is structurally complete on branch `claude/2x-engine-mvp-results` (59 commits ahead of `origin/main` after this update). All six Dashboard tabs AND the Results screen are wired to the engine. None of this rendering has been validated on a real iOS device.

**Why this matters — and why it matters more now than at any prior checkpoint**:
- The smoke tests prove the engine produces correct **shape and copy** on real Supabase data
- But the React Native primitives (VerdictText, VerdictEyebrow, SublineRow, ResultsMetaLine, SupportingCard, FactRow) have never been rendered on a real iPhone
- **Phase 6 added FIVE new rendering surfaces** to the un-validated branch on top of Results: Sources, Ads, Tone, Politics, Suggested-vs-Followed. That's compounding rendering risk — if a typography or spacing bug exists, it now lives on six surfaces, not one
- Visual issues (typography, spacing, marker rendering, layout overflow, ScrollView behavior, the SupportingCard's "FROM THIS SCAN" eyebrow rhythm at varying row counts) only surface on-device
- This is the **most rendering-risk-accumulated state the branch has been in**. A Mac device test should happen before any further surface work — additional templates, additional supporting-row variants, additional screens would multiply the surface area still further before catching a single rendering issue
- The broadcast extension that captures scan frames is iOS-only and cannot be tested on web or Android

**What's required**:
- macOS machine with Xcode 15+
- Physical iPhone (broadcast extension does not work in iOS Simulator)
- Apple Developer account with code signing configured
- `EXPO_PUBLIC_GEMINI_API_KEY` added to `mobile/.env` on the Mac
- ~2 hours of focused time

**How to execute**:
The runbook at `mobile/audits/2x-results-design/device-test-runbook.md` walks through every step. The findings template at the end of that runbook is the format for capturing results. Phase 6 expanded the surfaces in scope; the runbook's per-surface checklist should be exercised against all six Dashboard tabs plus Results.

**When to remind**: Future Claude Code sessions should mention this requirement in their opening response when the user resumes 2.x work, especially before any work that would deepen the branch (Phase 7+ template work, supporting-row primitive expansion, History/Compare screens). With six un-validated surfaces, the cost of finding a rendering bug late is now substantially higher than it was after Phase 5.

**Path forward**: Mac access remains the gating step. The engine MVP is structurally complete; the runbook is ready; the surfaces are wired. Pickup is one tooling step away from validation.

---

**Snapshot date:** 2026-05-19. The 2.x interpretation engine MVP is structurally complete on `claude/2x-engine-mvp-results`. Post-Phase-6 HEAD will land at the `docs(2x)` commit emitted by this update, **59 + 1 = 60 commits ahead of `origin/main`**. All six Dashboard surfaces (Overview, Sources, Ads, Tone, Politics, Suggested-vs-Followed) plus the Results screen are wired to the engine. The orchestrator's switch no longer contains any throwing case — every `EngineSurface` value has a template registry. Seven cross-scan derivations cooperate: `computeRollingAverage` + `computeMetricTrajectory` (Phase 6.4.0b extension) for metric time-series; the shared `aggregateAcrossScans` core (extracted Phase 5.4.2, extended with `postsExtractor` in 6.4.0a and `lastSeen` fields in 6.5.0) powers four creator-recurrence wrappers — `computeCreatorRecurrence`, `computeAdvertiserRecurrence`, `computePoliticalCreatorRecurrence`, `computeFollowedCreatorRecurrence` — plus the absence overlay `computeCreatorAbsence`. The engine runs end-to-end against real Supabase scan data; smoke tests cover all seven surfaces against real fixtures AND against synthesized depth-padded windows that exercise the dramatic templates. What's NOT done is the visual confirmation on a physical iPhone (the device test), which is blocked on Mac access.

## Status — all six Dashboard tabs

| Tab | Surface key | Phase | Templates | Smoke (real 2-scan) | Smoke (depth-padded) |
|---|---|---|---|---|---|
| Overview | `dashboard.overview` | 5.1 | 5 (political_shift @70, persistent_creator @60, heavy_ad_load @60, concentrated_feed @50, calm_case @10 with 3 variants) | calm-case (fallback) | persistent_creator fires with *"One voice keeps showing up across your YouTube history"* |
| Sources | `dashboard.sources` | 6.1 | 3 (persistent_creator @60, concentrated_feed @50, calm_case @10 with 3 variants incl. Sources-unique source-spread) | calm-case (fallback) | persistent_creator fires with design-canonical *"quietly become your most-seen voice"* |
| Ads | `dashboard.ads` | 6.2 | 3 (advertiser_persistence @60, heavy_ad_load Ads variant @50, calm_case @10 with 3 variants) | calm-case (fallback) | advertiser_persistence fires verbatim: *"One advertiser is sitting on your feed more than the others."* |
| Tone | `dashboard.tone` | 6.3 | 3 (negative_tone_shift @70, dominant_tone @50 with 3 sub-variants, calm_case @10 with 3 variants incl. enrichment-not-available) | calm-case enrichment-not-available *"Tone analysis isn't available for this YouTube scan"* (real fixture lacks `ai_analyzed`) | negative_tone_shift fires with synthesized tone enrichment |
| Politics | `dashboard.politics` | 6.4 | 3 (political_creator_dominance @70, political_trajectory @60, calm_case @10 with 4 variants) | calm-case enrichment-not-available (real fixture lacks `ai_analyzed`) | political_creator_dominance verbatim: *"Your political exposure isn't varied — it's coming from one place."* with 73% concentration math from synthesized fixture |
| Suggested-Followed | `dashboard.suggested` | 6.5 | 3 (followed_creator_absence @70, suggested_dominance @50, calm_case @10 with 4 variants incl. approximate-follow-detection) | calm-case approximate-follow-detection (real fixture has 96% null `is_suggested` → `creatorNovelty.approximate=true`) | followed_creator_absence verbatim: *"Your followed creators have gone quiet, so suggestions are filling the gap."* with 63%/60%/8-days math matching design (62%/60%/8) |

**Design-spec features deferred to Phase 7+** (surfaced during Phase 6):
- **Cross-metric Tone verdict** — "Your feed got more negative because politics got bigger" requires explained-variance / category-attribution infrastructure not yet built.
- **Cross-metric Ads LIKELY** — "more likely given your top creator is also tech-focused" requires creator-to-category attribution.
- **Multiple CreatorRows in Sources supporting card** — design shows a ranked list of recurring creators; only `Top voice` (FactRow) ships today. CreatorRow primitive deferred.
- **TrajectoryRow primitive** — sparkline rendering for `computeMetricTrajectory` output (the data layer is shipped Phase 6.4.0b; the rendering primitive isn't). Politics trajectory and any other monotonic-climbing metric uses an inline OBSERVED reading sequence ("4%, then 7%, now 11%") in lieu of the sparkline.
- **CaveatNote supporting-row variant** — sample-size warnings (the `heroCaution` copy removed when each tab's HeroStatCard cascade dropped) defer to this primitive. All six tabs' wirings make the same deferral consistently.
- **displayName-vs-@handle rendering calibration** — when `creator.name` is a human-readable display name rather than a handle-shaped string, the template renders e.g. `"Political News Channel"` rather than `"@PoliticalNewsChannel"`. Two design-canonical smoke verdicts (Tab 4 Politics, Tab 6 Suggested) hit this. Editorial decision filed; no fix in Phase 6.
- **Persistent-creator with-share frame in OBSERVED** — when the recurring creator's current-scan share is small (and other creators take the lion's share this scan), the OBSERVED reads slightly awkwardly. Editorial calibration filed; no algorithmic change required.

## Engine derivations

| Derivation | Phase | Returns | Backed by |
|---|---|---|---|
| `computeRollingAverage(scans, platform, metric, options)` | 2.3 | `number \| null` (mean of last N scans, excludes active) | Per-metric extractor switch on `MetricKey` |
| `computeMetricTrajectory(scans, platform, metric, options)` | 6.4.0b | `TrajectoryEntry[] \| null` (chronological, oldest-first) | Shared `extractMetricAcrossWindow` helper (Stage 1+2 extraction) |
| `computeCreatorRecurrence(scans, platform, options)` | 5.2 (refactored 5.4.2) | `RecurrenceResult` (per-creator records, sorted scanCount desc → totalPosts desc) | `aggregateAcrossScans` w/ no-op predicate |
| `computeAdvertiserRecurrence(scans, platform, options)` | 5.4.2 | `RecurrenceResult` (ad-only creators) | `aggregateAcrossScans` w/ `is_ad === true` predicate |
| `computePoliticalCreatorRecurrence(scans, platform, options)` | 6.4.0a | `RecurrenceResult` (creators of political posts) | `aggregateAcrossScans` w/ `_is_political` predicate AND custom `postsExtractor` (reads `analysis.feed_items` instead of `raw.posts`) |
| `computeFollowedCreatorRecurrence(scans, platform, options)` | 6.5.0 | `RecurrenceResult` (creators with `is_suggested === false` posts) | `aggregateAcrossScans` w/ `is_suggested === false` predicate |
| `computeCreatorAbsence(recurrence, activeScanCreatedAt, options)` | 6.5.0 | `CreatorAbsenceResult` (records enriched with `daysSinceLastSeen`, sorted longest-absence-first) | Pure post-processor over any `RecurrenceResult` (reads new `lastSeenAt` field from core extension) |

**Shared infrastructure history — four extensions/extractions across Phases 5.4–6.5, all regression-boundary clean**:

1. **Phase 5.4.2**: Extracted `recurrenceCore.ts` (`aggregateAcrossScans`) when advertiser-recurrence became the second consumer of the creator-recurrence algorithm. 19 existing creator-recurrence tests passed unchanged through the refactor. The wrapper pattern became the standard for category-specific recurrence.
2. **Phase 6.4.0a**: Extended `recurrenceCore` with `postsExtractor` option for political-creator recurrence to read from `analysis.feed_items` instead of `raw.posts`. All 34 existing recurrence tests passed unchanged.
3. **Phase 6.4.0b**: Refactored `rollingAverage.ts` to extract Stage 1+2 helper `extractMetricAcrossWindow`; shipped `computeMetricTrajectory` as a sibling consumer of that helper. All 26 existing rolling-average tests passed unchanged.
4. **Phase 6.5.0**: Extended `RecurrenceRecord` with `lastSeenIndex`, `lastSeenScanId`, `lastSeenAt` for absence-detection support. All 50 existing recurrence tests (creator + advertiser + political-creator) passed unchanged.

The shared-core extraction discipline is now load-tested at scale across four extensions and four consumer wrappers.

## Surface differentiation — locked at the test layer

Two algorithmic signals now ship multiple surface-specific verdicts, enforced by negative assertions in the engine test suite:

**Persistent-creator pattern → 3 distinct verdicts on the same predicate**:
- Results: *"One creator has been a steady presence in your YouTube feed."*
- Overview: *"One voice keeps showing up across your YouTube history."*
- Sources: *"One creator has quietly become your most-seen voice on YouTube."*

**High-suggested pattern → 4 distinct calm-case framings**:
- Results: *"Almost everything in your YouTube feed came from suggestions."* (absolute level, ≥80%)
- Overview: *"Almost everything in your YouTube feed today came from suggestions."* (variant of above with "today")
- Sources: *"The sources in your feed were almost all suggestions today."* (Sources-frame)
- Suggested-Followed: *"Suggestions filled more of your YouTube feed than usual."* (comparative-elevation, requires ≥80% AND ≥1.3× rolling avg)

The Suggested-Followed variant's distinctive contribution is the COMPARATIVE elevation framing — the other three state absolute level without history reference. Engine tests assert this differentiation with negative-`toContain` checks across all surface pairs (e.g., Tab 6 dominance verdict must NOT contain "Almost everything" or "The sources in your feed").

## Smoke output examples — design-canonical verdicts on real or synthesized data

| Surface | Template | Verdict (verbatim) |
|---|---|---|
| Results | persistent_creator | *"One creator has been a steady presence in your YouTube feed."* |
| Overview | persistent_creator | *"One voice keeps showing up across your YouTube history."* |
| Sources | persistent_creator | *"One creator has quietly become your most-seen voice on YouTube."* |
| Ads | advertiser_persistence | *"One advertiser is sitting on your feed more than the others."* |
| Tone | negative_tone_shift | *"Negative tone has been climbing in your YouTube feed."* |
| Politics | political_creator_dominance | *"Your political exposure isn't varied — it's coming from one place."* |
| Suggested-Followed | followed_creator_absence | *"Your followed creators have gone quiet, so suggestions are filling the gap."* |

All seven dramatic verdicts have been smoke-tested against either real or depth-padded-synthesized fixtures and render correctly. The Politics and Suggested-Followed cases hit design-canonical math values: Politics' 73% concentration and Suggested-Followed's 63%/60%/8-days both match the worked examples in `mobile/audits/2x-dashboard-design/decisions.md`.

## Test coverage

12 interpretation/scanShape test suites, **300 passing tests** total:

| Suite | Tests | Covers |
|---|---|---|
| `interpretationEngine.test.ts` | 106 | Orchestrator dispatch + selectTemplate, all six Dashboard surfaces' template predicates + render output, surface-differentiation negative assertions, priority ordering (cross-template precedence), platform interpolation, meta resolution |
| `rollingAverage.test.ts` | 26 | All 7 metric extractors, platform filtering, current-scan exclusion, window sizing, malformed-data tolerance, > 50% failure threshold |
| `metricTrajectory.test.ts` | 16 | Null returns, dense chronological output, null entry filtering, filters (platform/excludeScanId/windowSize), per-entry shape, all 7 MetricKey values |
| `creatorRecurrence.test.ts` | 19 | Empty/all-null inputs, aggregation + sort, platform filter, excludeScanId, window size default + custom, sparse history, null-handle exclusion, case-insensitive grouping, display-name resolution, firstSeenIndex, failure tolerance |
| `advertiserRecurrence.test.ts` | 15 | Empty/no-ads inputs, single + multi-advertiser aggregation, ad-only filter behavior, platform + excludeScanId, window size, case-insensitive grouping |
| `politicalCreatorRecurrence.test.ts` | 16 | Empty/no-political inputs, political-only filter via custom `postsExtractor` reading from `analysis.feed_items`, parallel-array data-shape note enforcement |
| `creatorAbsence.test.ts` | 19 | Followed-creator wrapper (empty/all-suggested/null-exclusion/mixed-state-collapse/lastSeen fields), absence helper (empty/0-days/8-days canonical/floor semantics/sort desc/malformed-date/null-sort-last/minDays/null-pass-through/negative-clamp/malformed-active), integration end-to-end |
| `unifiedResultToScanDetail.test.ts` | 12 | Adapter top-level field population, raw_data shape parity, timestamp pinning, Supabase-shape parity |
| `supportingRows.test.ts` | 19 | `recurrenceAnchor` copy variants, `buildTopVoiceRow`, `buildRecurringAdvertiserRow`, `buildStandardSupportingRows` composition |
| `comparativeAnchor.test.ts` | 21 | Bucketing thresholds, null/zero rolling-average handling, label overrides |
| `platformDisplay.test.ts` | 11 | Capitalization mapping including X/Twitter brand convention |
| `realScanSmoke.test.ts` | 20 | End-to-end shape against real production scans (7 surface 2-scan baselines + 8 depth-padded dramatic-template tests + 2 derivation smokes — creator recurrence on 2-scan and advertiser recurrence on 2-scan/4-scan) |
| **Total** | **300** | |

Pre-existing failing tests unrelated to this work: **5** (in `computeDashboardData.test.ts` and `streakManager.test.ts`). Baseline unchanged throughout Phases 4-6.

Full mobile suite: **27 of 29 suites passing, 703 of 708 tests passing**.

TypeScript baseline: **19 errors**, all pre-existing, none in any 2x-engine file. Baseline unchanged throughout Phase 6.

## What works today

The engine functions end-to-end against real Supabase scan data. All six Dashboard surfaces plus Results are wired. The smoke tests at `mobile/src/lib/interpretation/__tests__/realScanSmoke.test.ts` run `interpretScan` against real and synthesized scans for every surface.

**Design-canonical Suggested-vs-Followed verdict on depth-padded synthesized fixture (Phase 6.5.5)**:

```json
{
  "verdict": "Your followed creators have gone quiet, so suggestions are filling the gap.",
  "sublines": [
    { "mode": "OBSERVED", "text": "63% of your feed was suggested content this scan, close to your 60% average. But MKBHD, your top followed creator, hasn't posted in 8 days." },
    { "mode": "LIKELY",   "text": "When followed creators slow down, the recommendation pool fills more of the feed. The category that fills depends on what you've been engaging with." }
  ],
  "supportingRows": [
    { "variant": "fact", "label": "Top voice", "value": "News Source 0", "anchor": "in all 4 of your scans" },
    { "variant": "fact", "label": "Ads",       "value": "0% of feed",    "anchor": "lower than typical" },
    { "variant": "fact", "label": "Patterns",  "value": "Top: Video" },
    { "variant": "fact", "label": "Political", "value": "No analysis" },
    { "variant": "fact", "label": "Tone",      "value": "No analysis" }
  ],
  "findingDot": true
}
```

The 63%/60%/8-days math closes within one percentage point of the design-canonical worked example's 62%/60%/8-days. The LIKELY ships design-cleared voice-rule-checked copy verbatim from `decisions.md:248`.

## What's blocked

The device test (rendering all six wired surfaces on a physical iPhone) is blocked on Mac access. The user does not have Mac access. The runbook at `mobile/audits/2x-results-design/device-test-runbook.md` documents what to do when Mac access is available.

The 2.x ship to TestFlight is blocked on the device test passing.

## What's the next step when Mac access is available

In this order:

1. Sync the worktree to the latest `origin/claude/2x-engine-mvp-results` branch
2. Add `EXPO_PUBLIC_GEMINI_API_KEY` to `mobile/.env` (gitignored, set per machine)
3. Run `npx expo prebuild --platform ios --clean` to generate the iOS workspace
4. Open `ios/AlgorithmLens.xcworkspace` in Xcode 15+
5. Configure signing for both `AlgorithmLens` and `BroadcastExtension` targets (App Group entitlement `group.com.algorithmlens.broadcast`)
6. Follow the device test runbook — extend the per-surface checklist beyond Results to cover the five Phase 6 surfaces (Sources, Ads, Tone, Politics, Suggested-vs-Followed)

After the device test:
- If output renders cleanly: open a PR for the feature branch, merge to `main`, build for TestFlight
- If issues surface: iterate on the engine, templates, or rendering per findings; re-test

## What's NOT implemented (Phase 7+ candidates)

Items shipped in Phase 6 — removed from this list since they're now done:
- ~~Sources tab wiring~~ → shipped 6.1
- ~~Ads tab wiring + standalone advertiser-persistence template~~ → shipped 6.2
- ~~Tone tab wiring~~ → shipped 6.3
- ~~Politics tab wiring + political-creator recurrence + trajectory derivation~~ → shipped 6.4
- ~~Suggested-vs-Followed wiring + absence detection~~ → shipped 6.5

Remaining items (engineering candidates for Phase 7+):

- **COACHING sub-line mode** (the "SOMETHING TO TRY" beat) — design-canonical across multiple tabs; deferred until after device test validates the OBSERVED/LIKELY rendering.
- **QUESTION FOR YOU sub-line mode** — design-canonical sub-mode; deferred similarly.
- **Cross-metric verdict infrastructure** — required for Tone's "got more negative because politics got bigger" and Ads' creator-to-category attribution. Needs explained-variance / category-attribution derivation.
- **CreatorRow supporting-row primitive** — Sources design shows a ranked list of recurring creators; currently only the lead creator surfaces via FactRow.
- **TrajectoryRow primitive** — sparkline rendering for `computeMetricTrajectory`. Data is shipped; rendering isn't.
- **CaveatNote supporting-row primitive** — sample-size warnings (the removed `heroCaution` copy from each tab's HeroStatCard cascade).
- **BarRow + MethodologyRow supporting-row primitives** — also in the design spec, deferred consistently.
- **displayName-vs-@handle rendering calibration** — editorial decision filed.
- **Persistent-creator with-share-frame OBSERVED calibration** — when current-scan share is small.
- **Population baselines** ("typical for YouTube ad density") — requires cohort data.
- **Finding-dot threshold as an explicit upstream engine signal** — currently each template sets `findingDot` directly.
- **LLM-driven template selection** — alternative to the priority-based dispatch.
- **About screen expansion** (methodology surface for interpretation).
- **Capture/Analyzing pre-frame design.**
- **History screen 2.x design.**
- **Compare screen 2.x design.**

The scoping document at `mobile/audits/2x-interpretation-engine-scoping/decisions.md` is the engineering roadmap for these items.

## Phase 6 commits — chronological

23 commits in Phase 6 between `d5fa27b5` (end of Phase 5.4) and `661d0c15` (end of Phase 6.5):

| Phase | Commit | Description |
|---|---|---|
| 6.1.2 | `220a3a27` | feat(2x): add Dashboard Sources interpretation templates |
| 6.1.3 | `996c84e0` | feat(2x): extend orchestrator to support dashboard.sources surface |
| 6.1.4 | `af3f502e` | feat(2x): wire interpretation engine into Dashboard Sources tab |
| 6.1.5 | `63122b2a` | test(2x): extend smoke test to cover dashboard.sources surface |
| 6.2.2 | `6350b461` | feat(2x): add Dashboard Ads interpretation templates |
| 6.2.3 | `65a5bb2a` | feat(2x): extend orchestrator to support dashboard.ads surface |
| 6.2.4 | `63708e75` | feat(2x): wire interpretation engine into Dashboard Ads tab |
| 6.2.5 | `abd5914e` | test(2x): extend smoke test to cover dashboard.ads surface |
| 6.3.2 | `1098cab9` | feat(2x): add Dashboard Tone interpretation templates |
| 6.3.3 | `8527c4cd` | feat(2x): extend orchestrator to support dashboard.tone surface |
| 6.3.4 | `f2888188` | feat(2x): wire interpretation engine into Dashboard Tone tab |
| 6.3.5 | `4967a38d` | test(2x): extend smoke test to cover dashboard.tone surface |
| 6.4.0a | `1b2d1b88` | feat(2x): add political-creator recurrence wrapper, extend shared core with postsExtractor |
| 6.4.0b | `efd81fd8` | feat(2x): extract metric extraction window helper, add computeMetricTrajectory derivation |
| 6.4.2 | `87f1f675` | feat(2x): add Dashboard Politics interpretation templates |
| 6.4.3 | `fa267a2d` | feat(2x): extend orchestrator to support dashboard.politics surface |
| 6.4.4 | `34624c33` | feat(2x): wire interpretation engine into Dashboard Politics tab |
| 6.4.5 | `a30550ca` | test(2x): extend smoke test to cover dashboard.politics surface |
| 6.5.0 | `222723ac` | feat(2x): extend recurrence core with lastSeen fields, add followed-creator absence detection |
| 6.5.2 | `93e04927` | feat(2x): add Dashboard Suggested vs Followed interpretation templates |
| 6.5.3 | `fe9e7134` | feat(2x): extend orchestrator to support dashboard.suggested surface |
| 6.5.4 | `8e4cf4d5` | feat(2x): wire interpretation engine into Dashboard Suggested vs Followed tab |
| 6.5.5 | `661d0c15` | test(2x): extend smoke test to cover dashboard.suggested surface |

## Known issues filed

- **Issue #6:** Empty displayName from Gemini extraction
- **Issue #7:** Unit consistency (frames → posts)
- **Issue #8:** Hide Unknown content type when share small
- **Issue #10:** YouTube shorts not attributed to creators in scan extraction pipeline — Phase 4.5.1a smoke finding that drove early calm-case template work; empirically reframed in Phase 5.2.3 as "dilute creator attribution" rather than "absent"

<!-- TODO-MAC-TEST: Future Claude Code sessions, surface the Mac device test requirement on session resume. See top of this file. -->
