# 2.x interpretation engine: implementation status

## ⚠ Reminder for future sessions: Mac device test required before TestFlight

**Status as of resume**: The 2.x Results screen engine MVP is complete on branch `claude/2x-engine-mvp-results` (22+ commits ahead of main). It cannot ship to TestFlight until a device test validates the rendering on a real iPhone.

**Why this matters**:
- The smoke test (`mobile/src/lib/interpretation/__tests__/realScanSmoke.test.ts`) proves the engine produces correct output on real Supabase data
- But the React Native primitives (VerdictText, ObservedSubline, LikelySubline, ResultsMetaLine, SupportingCard, FactRow) have never been rendered on a real iOS device
- Visual issues (typography, spacing, marker rendering, layout overflow, ScrollView behavior) only surface on-device
- The broadcast extension that captures scan frames is iOS-only and cannot be tested on web or Android

**What's required**:
- macOS machine with Xcode 15+
- Physical iPhone (broadcast extension does not work in iOS Simulator)
- Apple Developer account with code signing configured
- `EXPO_PUBLIC_GEMINI_API_KEY` added to `mobile/.env` on the Mac
- ~2 hours of focused time

**How to execute**:
The runbook at `mobile/audits/2x-results-design/device-test-runbook.md` walks through every step. The findings template at the end of that runbook is the format for capturing results.

**When to remind**: Future Claude Code sessions should mention this requirement in their opening response when the user resumes 2.x work, especially before any work that would deepen the branch (more templates, more derivations, more screens). The further the branch drifts from main without device validation, the higher the risk that a layout issue or rendering bug compounds across multiple surfaces before it gets caught.

**Path forward**: Currently the user is continuing 2.x development without Mac access (Dashboard tabs, additional templates, more design surfaces). When Mac access becomes available, the device test should be the first action before any further work.

---

**Snapshot date:** 2026-05-17. The 2.x interpretation engine MVP is on `claude/2x-engine-mvp-results` (HEAD will land at the Phase 5.4.4 commit after this update, ~36 commits ahead of `origin/main`). Two surfaces are now wired to the engine — the Results screen (Phase 4) and the Dashboard Overview tab (Phase 5.1) — plus four engine layers added in Phase 5.2-5.4: creator-recurrence derivation, Top voice supporting row, persistent-creator standalone template, and advertiser-recurrence + Recurring advertiser supporting row. The shared `aggregateAcrossScans` core (extracted in Phase 5.4.2) backs both recurrence wrappers and is positioned for future per-category recurrence variants. The engine runs end-to-end against real Supabase scan data; smoke tests cover the calm-case path (2-scan real fixtures), the persistent-creator path (4-scan synthesized window), and advertiser recurrence on both. What's NOT done is the visual confirmation on a physical iPhone (the device test), which is blocked on Mac access. The work sits cleanly on origin and is ready for whoever has Mac + iOS tooling to pick up the runbook.

## What's been built and shipped to origin/main

Two commits on `main` form the baseline this work builds on:

- **`d5573cb7`** — *AlgorithmLens 1.1.1: Brand redesign sweep + 2.x design documentation (#9).* The 1.1.x baseline app (working Results screen with the four-finding card, Dashboard with 6 tabs, broadcast capture pipeline) plus the design specs for the 2.x redesign: the Results screen spec in `mobile/audits/2x-results-design/decisions.md` and the Dashboard tab specs that the engine will eventually feed.
- **`018343b2`** — *docs: capture 2.x interpretation engine scoping investigation.* The scoping document at `mobile/audits/2x-interpretation-engine-scoping/decisions.md` — architecture decisions, derivation roadmap, voice rules, risk register. The engineering plan for everything below.

Nothing engine-code-wise is on `main` yet. The full implementation sits on the feature branch described next.

## What's been built and lives on a feature branch

Branch: **`claude/2x-engine-mvp-results`** at HEAD **`c953c38f`** (Phase 5.4.4 commit will land on top with this status update), ~36 commits ahead of `origin/main` after the Phase 5.4.4 commit + push. Pushed and durable on origin.

In delivery order, the commits group into logical chunks:

**Module structure and derivations (Phase 1-2)**
- `effaba20` — *feat(2x): establish interpretation engine module structure.* Created `mobile/src/lib/interpretation/` with type definitions, README, and the discriminated `SupportingRow` union (fact, creator, trajectory, bar, caveat, methodology).
- `a1343089` — *chore: fix package-lock.json drift.* Added missing `react-refresh@0.18.0` entry that was blocking `npm ci`.
- `5fe2a17e` — *chore: gitignore .expo/web/cache build artifacts.*
- `67e25819` — *chore: remove remaining gitignored .expo files from index.*
- `ff749d5d` — *feat(2x): implement rolling average derivation with tests.* `computeRollingAverage(scans, platform, metric, options)` with per-metric extractors for `ad_pct`, `political_pct`, `top_creator_share`, `tone_*_pct`, `suggested_pct`. 26 unit tests.

**Orchestrator + first template (Phase 3)**
- `1b9011a5` — *feat(2x): add first Results template (concentrated feed) and shared utils.* `concentratedFeedTemplate` (fires at top-creator share ≥ 25%) + `capitalizePlatform` + `getComparativeAnchor` utilities.
- `94fe6913` — *feat(2x): implement interpretation engine orchestrator.* `interpretScan(context, surface)` dispatching to the surface's template registry by priority; the calm-case was an inline placeholder at this point.
- `4e8d98ce` — *docs(2x): update interpretation module README to reflect Phase 3 state.*

**Design system primitives (Phase 4.1)**
- `5c2b68eb` — *feat(2x): add VerdictEyebrow and VerdictText design system primitives.* 28px brand-blue rule + uppercase "VERDICT" label + display-weight verdict text (with documented RN `text-wrap: balance` limitation).
- `d37a78b3` — *feat(2x): add ObservedSubline and LikelySubline components.* The four-mode marker system (filled brand-blue square for OBSERVED, hollow tertiary-gray ring for LIKELY), with the private `SublineFrame` providing the shared layout.
- `1c61623e` — *feat(2x): add ResultsMetaLine component.* Three brand-blue progress segments + uppercase "ANALYZED X · N POSTS · M:SS SESSION" micro-text.

**Supporting card primitives (Phase 4.2)**
- `2f5578b0` — *feat(2x): add SupportingCard design system primitive.* bg-secondary card with "FROM THIS SCAN" eyebrow. Standalone (not wrapping the canonical `Card`) because bg-secondary + no border is a distinct visual semantic.
- `cb039b9d` — *feat(2x): add FactRow design system primitive.* Label-left, value+anchor-right with the single-Text composition trick: RN's native text layout handles wrap behavior for free — anchors drop to a second right-aligned line on tight rows.

**Scan-shape extraction + adapter (Phase 4.4.1-4.4.2)**
- `d4cf170f` — *refactor: extract buildScanRow as shared UnifiedScanResult→ScanDetail mapping.* Moved the persist-time transform from `broadcastAnalysisPipeline.persistScan` (50 lines) into `lib/scanShape/buildScanRow.ts`. Single source of truth for "what shape is a persisted scan."
- `1cfe4eea` — *feat(2x): add adapter from UnifiedScanResult to ScanDetail for engine consumption.* `unifiedResultToScanDetail` wraps `buildScanRow` and pins timestamps to `scan_metadata.created_at` for memo stability. 12 unit tests.

**Results screen wiring (Phase 4.4.4)**
- `43b5f785` — *feat(2x): wire interpretation engine into Results screen.* Rewrote `app/analysis/[sessionId].tsx`'s `ResultsBody`: four `useMemo` hooks chain `activeScan → dashboardData → context → interpretation`. Renders `ResultsMetaLine` + `VerdictEyebrow` + `VerdictText` + sublines (with 12/22/24 gap rhythm) + optional `SupportingCard` with `FactRow` children + CTA. Removed the old hero count and four `interpretAds/Patterns/Political/Tone` inline functions.

**Smoke test + calm-case template (Phase 4.5.1a + 4.5.2.2)**
- `dd01cfdf` — *test(2x): add real-scan smoke test for interpretation engine.* Loads two redacted real YouTube scans (Feb 2026) through the full engine path; surfaced that YouTube shorts have no creator attribution in the current pipeline. Filed as issue #10.
- `9b95df41` — *feat(2x): add real calm-case template replacing placeholder fallback.* Three variants (high-suggested ≥ 80%, content-type-dominant ≥ 50%, fallback) replacing the old generic "Your YouTube feed is in its usual shape." placeholder. Orchestrator's fallback branch became a thrown invariant.

**Documentation (Phase 4.5.3 + 4.5.5)**
- `a01ab36f` — *docs(2x): add device test runbook for Results screen.*
- `195bee27` — *docs(2x): flag Mac requirement at top of device test runbook.*

**Dashboard Overview surface (Phase 5.1)**
- `87f9a15d` — *feat(2x): add Dashboard Overview interpretation templates.* Four templates (political_shift priority 70, heavy_ad_load priority 60, concentrated_feed priority 50, calm_case priority 10) with Overview-specific verdict copy. Extracted shared `buildAdsRow / buildPatternsRow / buildPoliticalRow / buildToneRow` into `templates/supportingRows.ts`.
- `07eea6da` — *feat(2x): extend orchestrator to support dashboard.overview surface.* `selectTemplate(templates, context)` shared helper; `interpretScan` dispatches via switch with explicit per-surface arms.
- `8dcc5222` — *feat(2x): wire interpretation engine into Dashboard Overview tab.* Modified `OverviewTab.tsx` to compute interpretation internally via four `useMemo` hooks; replaced `HeroStatCard` + `pickHeroStat` cascade with engine-driven verdict zone + supporting card; extracted `SublineRow` and `sublineGapTop` to `mobile/src/components/interpretation/` so both Results and Overview consume the shared helpers.
- `32927181` — *test(2x): extend real-scan smoke test to cover dashboard.overview surface.* Verified Overview-specific copy ("today came from suggestions") on real fixtures.

**Creator recurrence + Top voice row (Phase 5.2)**
- `40928dcf` — *feat(2x): add creator recurrence cross-scan derivation.* `computeCreatorRecurrence(scans, platform, options)` returns per-creator records sorted by scanCount desc with totalPosts tiebreaker. Case-insensitive handle grouping (deliberate divergence from `rollingAverage.extractTopCreatorShare`), null-handle exclusion (deliberate divergence from `computeDashboardData.countByCreator`). 19 unit tests.
- `d696a703` — *test(2x): extend smoke test to cover creator recurrence on real fixtures.* Surfaced 49 distinct creators on real YouTube data, 5 recurring across both scans. Empirically reframed Issue #10: creator attribution isn't absent on YouTube, just dilute enough that single-scan concentration rarely fires.
- `a9604b66` — *feat(2x): add Top voice recurrence row to calm-case supporting cards.* Shared `buildStandardSupportingRows` prepends Top voice FactRow when `topRecurrer.scanCount >= 2`. `recurrenceAnchor(scanCount, windowScanCount)` scales copy: "in both your scans" → "in all N of your scans" → "in M of your last 3 scans" → "in M of last N scans" (design-canonical). Applied to all six templates that compose the standard 4-row card.

**Persistent-creator standalone template (Phase 5.3)**
- `99a71a3d` — *feat(2x): add persistent-creator template for Results and Overview surfaces.* Priority 60 on both surfaces; fires at `topRecurrer.scanCount >= 3 AND windowScanCount >= 4`. Surface-differentiated verdict copy: Results says *"One creator has been a steady presence in your YouTube feed,"* Overview says *"One voice keeps showing up across your YouTube history."* On Overview, registered before `heavyAdLoadTemplate` so persistent-creator wins the priority-60 tie when both predicates match (cross-scan signal beats single-scan ad spike).
- `29e495ee` — *test(2x): cover persistent-creator template firing, precedence, and copy.* 18 tests across both surfaces — threshold firing, threshold non-firing (window depth), precedence (loses to political_shift, wins over concentrated_feed and heavy_ad_load), OBSERVED interpolation, Top voice supporting row presence, findingDot true.
- `74416ffd` — *test(2x): add depth-padded smoke test for persistent-creator template.* Synthesizes a 4-scan window by deep-cloning `REAL_PRIOR_SCAN` with mutated id and created_at (1-week and 2-week setbacks). Verifies template fires on real-shape data with honest copy: *"Creator 13 has appeared in 4 of your last 4 scans, with 14 posts across them"* (Results) / *"Creator 13 has been in 4 of your recent 4 scans, with 14 posts total"* (Overview).

**Advertiser-recurrence derivation + Recurring advertiser row (Phase 5.4)**
- `615f5330` — *refactor(2x): extract shared recurrence aggregation helper, add advertiser recurrence.* Shared `aggregateAcrossScans` core (`recurrenceCore.ts`) houses the algorithm — case-insensitive grouping, null-handle exclusion, display-name resolution, malformed-scan tolerance — as the single source of truth. `creatorRecurrence.ts` refactored to a thin wrapper (no-op predicate) preserving the existing 19-test contract. New `advertiserRecurrence.ts` wrapper passes an `is_ad === true` predicate; 15 unit tests cover the ad-only filter behavior and shared aggregation through the wrapper.
- `c953c38f` — *test(2x): extend smoke test to cover advertiser recurrence.* Two smoke tests: real 2-scan fixture surfaces @creator-1 as a 2-of-2 recurring advertiser (the redacted Google ad shows persistence across the 24-hour fixture window — empirical correction of the Phase 5.4.1 discovery hypothesis); depth-padded 4-scan window surfaces @creator-1 at 4-of-4 and @creator-47 at 3-of-4.
- `<pending Phase 5.4.4 commit>` — *feat(2x): add Recurring advertiser supporting row.* `buildRecurringAdvertiserRow` mirrors `buildTopVoiceRow` (Phase 5.2.5) with the same `scanCount >= 2` threshold. `buildStandardSupportingRows` now prepends both rows in visual-hierarchy order: Top voice → Recurring advertiser → standard 4 rows. The two recurrence signals are independent (creator vs ad-source) and both fire when both recurrences exist. Standalone advertiser-persistence template at verdict level deferred to future Phase 6+ work (paired with `dashboard.ads` surface wiring).

### Test coverage

Nine interpretation test suites, 177 passing tests total:

| Suite | Tests | Covers |
|---|---|---|
| `interpretationEngine.test.ts` | 47 | Orchestrator dispatch + selectTemplate, concentrated-feed, calm-case (3 variants + precedence + Unknown-skip), surface gating (Results + Overview pass, others throw), dashboard.overview templates (political_shift, heavy_ad_load, concentrated, calm-case), persistent-creator on Results (8) + Overview (10) with priority-60 tie test, platform interpolation, meta resolution |
| `rollingAverage.test.ts` | 26 | All 7 metric extractors, platform filtering, current-scan exclusion, window sizing, malformed-data tolerance, > 50% failure threshold |
| `creatorRecurrence.test.ts` | 19 | Empty/all-null inputs, aggregation + sort, platform filter, excludeScanId, window size default + custom, sparse history, null-handle exclusion, case-insensitive grouping, display-name resolution, firstSeenIndex, failure tolerance (unchanged from Phase 5.2 — refactored as thin wrapper in Phase 5.4) |
| `advertiserRecurrence.test.ts` | 15 | Empty/no-ads inputs, single + multi-advertiser aggregation, ad-only filter behavior (non-ad excluded, mixed scans counted only-ads, null-handle ad still excluded), platform + excludeScanId, window size, sparse history, case-insensitive grouping, display-name fallback, failure tolerance |
| `unifiedResultToScanDetail.test.ts` | 12 | Adapter top-level field population, `raw_data` shape parity with `buildScanRow`, timestamp pinning, Supabase-shape parity (scan_id undefined, no deprecated top-level columns) |
| `supportingRows.test.ts` | 19 | `recurrenceAnchor` copy variants (in-both / in-all-N / in-M-of-last-3 / in-M-of-last-N), `buildTopVoiceRow` (8 tests: threshold, top-recurrer selection, displayName fallback), `buildRecurringAdvertiserRow` (7 tests: threshold, ad-only filter, signal independence from Top voice) |
| `comparativeAnchor.test.ts` | 21 | Bucketing thresholds, null/zero rolling-average handling, label overrides |
| `platformDisplay.test.ts` | 11 | Capitalization mapping including X/Twitter brand convention |
| `realScanSmoke.test.ts` | 7 | End-to-end shape correctness against redacted real production scans (Results, dashboard.overview, computeCreatorRecurrence, computeAdvertiserRecurrence 2-scan + 4-scan padded, depth-padded persistent-creator on both surfaces) |

Pre-existing failing tests unrelated to this work: 5 (in `computeDashboardData.test.ts` and `streakManager.test.ts`). Baseline unchanged.

Full mobile suite: 24 of 26 suites passing, 580 of 585 tests passing.

TypeScript baseline: 19 errors, all pre-existing, none in any 2x-engine file.

## What works today

The engine functions end-to-end against real Supabase scan data. The smoke tests at `mobile/src/lib/interpretation/__tests__/realScanSmoke.test.ts` run `interpretScan` against two real production YouTube scans (redacted in the fixture) and produce meaningful interpretation output.

**Calm-case path (2-scan real fixtures, Results surface)** — most likely path on typical YouTube data given the creator attribution gap tracked in issue #10:

```json
{
  "verdict": "Almost everything in your YouTube feed came from suggestions.",
  "sublines": [
    { "mode": "OBSERVED", "text": "100% of what you saw was suggested, with 0% from accounts you follow." },
    { "mode": "LIKELY",   "text": "Suggestion weights fill the feed when activity from followed accounts is sparse." }
  ],
  "supportingRows": [
    { "variant": "fact", "label": "Top voice", "value": "Creator 13", "anchor": "in both your scans" },
    { "variant": "fact", "label": "Ads",       "value": "3% of feed" },
    { "variant": "fact", "label": "Patterns",  "value": "Top: Video" },
    { "variant": "fact", "label": "Political", "value": "No analysis" },
    { "variant": "fact", "label": "Tone",      "value": "No analysis" }
  ],
  "findingDot": false
}
```

**Persistent-creator path (4-scan synthesized window, Results surface)** — depth-padded smoke test verifies the template fires honestly on real-shape data when history depth supports it:

```json
{
  "verdict": "One creator has been a steady presence in your YouTube feed.",
  "sublines": [
    { "mode": "OBSERVED", "text": "Creator 13 has appeared in 4 of your last 4 scans, with 14 posts across them." },
    { "mode": "LIKELY",   "text": "When a single creator consistently produces watch-time, recent activity gets weighted as a strong signal for what to surface next. Repeat exposure reinforces this across sessions." }
  ],
  "supportingRows": [
    { "variant": "fact", "label": "Top voice",            "value": "Creator 13", "anchor": "in all 4 of your scans" },
    { "variant": "fact", "label": "Recurring advertiser", "value": "Creator 1",  "anchor": "in all 4 of your scans" },
    { "variant": "fact", "label": "Ads",                  "value": "3% of feed", "anchor": "typical" },
    { "variant": "fact", "label": "Patterns",             "value": "Top: Video" },
    { "variant": "fact", "label": "Political",            "value": "No analysis" },
    { "variant": "fact", "label": "Tone",                 "value": "No analysis" }
  ],
  "findingDot": true
}
```

The "No analysis" rows for Political and Tone are honest output (the fixture's scans don't have Gemini backend enrichment) rather than a wiring bug; filed as a copy iteration candidate. The Dashboard Overview surface produces structurally identical output with surface-specific verdict and OBSERVED copy ("keeps showing up" / "been in your recent N scans").

## What's blocked

The device test (real broadcast scan on a physical iPhone with the engine output rendering on the Results screen) is blocked on Mac access. The user does not have Mac access. The runbook at `mobile/audits/2x-results-design/device-test-runbook.md` documents what to do when Mac access is available.

The 2.x ship to TestFlight is blocked on the device test passing.

## What's the next step when Mac access is available

In this order:

1. Sync the worktree to the latest `origin/claude/2x-engine-mvp-results` branch
2. Add `EXPO_PUBLIC_GEMINI_API_KEY` to `mobile/.env` (it's gitignored, must be set per machine)
3. Run `npx expo prebuild --platform ios --clean` to generate the iOS workspace
4. Open `ios/AlgorithmLens.xcworkspace` in Xcode 15+
5. Configure signing for both `AlgorithmLens` and `BroadcastExtension` targets (App Group entitlement `group.com.algorithmlens.broadcast`)
6. Follow the device test runbook from step 4 onward

After the device test:
- If output renders cleanly: open a PR for the feature branch, merge to `main`, build for TestFlight
- If issues surface: iterate on the engine, templates, or rendering per findings; re-test

## What's NOT implemented but is in the design spec

These items are explicitly out of scope for the current branch and remain as future work:

- COACHING sub-line mode (the "SOMETHING TO TRY" beat)
- A QUESTION FOR YOU sub-line mode
- The 5 remaining Dashboard tabs (Who Shapes Your Feed, Ads, Politics, Tone, Suggested vs Followed) — Overview shipped in Phase 5.1; the others currently throw `"surface not yet implemented"` if `interpretScan` is called with them
- **Advertiser-persistence standalone template at verdict level** — Phase 5.4 chose to ship advertiser recurrence as a supporting-row signal only (the Recurring advertiser row on Results + Overview). A standalone advertiser-persistence verdict template — paralleling Phase 5.3's persistent-creator — is design-spec authored for the `dashboard.ads` surface ("One advertiser is sitting on your feed more than the others") but NOT for Results/Overview. Build alongside dashboard.ads surface wiring in a future phase rather than speculatively author Results/Overview verdict copy without design backing.
- Quiet-followed-creator detection
- Cross-metric correlation
- Trajectory sparklines
- Population baselines ("typical for YouTube ad density")
- Finding-dot threshold on Dashboard tabs
- LLM-driven template selection
- About screen expansion (methodology surface for interpretation)
- Capture/Analyzing pre-frame design
- History screen 2.x design
- Compare screen 2.x design
- The Dashboard design spec applied across all six tabs

The scoping document at `mobile/audits/2x-interpretation-engine-scoping/decisions.md` is the engineering roadmap for these items.

## Known issues filed

- **Issue #6:** Empty displayName from Gemini extraction
- **Issue #7:** Unit consistency (frames → posts)
- **Issue #8:** Hide Unknown content type when share small
- **Issue #10:** YouTube shorts not attributed to creators in scan extraction pipeline — the finding from the Phase 4.5.1a smoke test that drove the calm-case template work

## Test counts at this commit

- Orchestrator + templates: **47 tests** (`interpretationEngine.test.ts`)
- Rolling average derivation: **26 tests** (`rollingAverage.test.ts`)
- Creator recurrence derivation: **19 tests** (`creatorRecurrence.test.ts`)
- Advertiser recurrence derivation: **15 tests** (`advertiserRecurrence.test.ts`)
- Adapter: **12 tests** (`unifiedResultToScanDetail.test.ts`)
- Supporting-row helpers: **19 tests** (`supportingRows.test.ts`)
- Utilities: **32 tests** (`comparativeAnchor.test.ts` 21 + `platformDisplay.test.ts` 11)
- Smoke tests against real Supabase data: **7 tests** (`realScanSmoke.test.ts`)
- **Total interpretation tests: 177**
- Total tests in the full mobile suite: **585**
- Pre-existing failing tests (unrelated, predate this work): **5** (in `computeDashboardData.test.ts` and `streakManager.test.ts`)

<!-- TODO-MAC-TEST: Future Claude Code sessions, surface the Mac device test requirement on session resume. See top of this file. -->
