# Interpretation engine (2.x)

The interpretation engine turns scan data into structured interpretive output: verdict statements, sub-lines labeled by mode (OBSERVED, LIKELY, SOMETHING TO TRY, A QUESTION FOR YOU), and supporting rows.

This module is the 2.x layer over the existing 1.x data pipeline. The existing `computeDashboardData()` continues to derive per-scan metrics; the engine adds cross-scan aggregation and template-driven interpretation on top.

## References

- [Scoping investigation](../../../audits/2x-interpretation-engine-scoping/decisions.md): engineering scoping baseline. Read this first.
- [Strategic brief](../../../audits/algorithmlens-2x-interpretation-layer-brief.md): product framing for 2.x.
- [Results screen design spec](../../../audits/2x-results-design/decisions.md): the four-mode sub-line system.
- [Dashboard design spec](../../../audits/2x-dashboard-design/decisions.md): Dashboard surface design.

## Module structure

| File | Purpose |
|---|---|
| `interpretation-types.ts` | Core types: `Subline`, `SupportingRow` (discriminated union), `InterpretationResult`, `InterpretationContext`, `MetricKey`. |
| `interpretationEngine.ts` | Orchestrator. Public entry: `interpretScan(context, surface)`. |
| `derivations/` | Pure cross-scan aggregations. Each function takes `scans[]` and produces a structured aggregation. |
| `derivations/rollingAverage.ts` | Per-platform, per-metric running average. |
| `derivations/index.ts` | Barrel. |
| `templates/` | Per-surface template collections. Each template is `{ id, when, priority, render }`. |
| `templates/results.ts` | Results screen templates. |
| `templates/index.ts` | Barrel. |
| `utils/platformDisplay.ts` | Platform key to user-facing display name. |
| `utils/comparativeAnchor.ts` | Anchor phrase from current value and rolling average. |

Unit tests live in `__tests__/` siblings of each module (e.g., `derivations/__tests__/rollingAverage.test.ts`).

## Status

Phase 3 complete. The engine is functional on the Results surface for the Concentrated Feed pattern, with a calm-case fallback for scans that don't match any template. Ready for UI integration on the Results screen.

## Current capabilities

The engine produces a complete `InterpretationResult` for any scan via `interpretScan(context, 'results')`. Specifically:

- **Concentrated Feed template** fires when the top creator's share is at least 25% of the scan. Produces a "A few voices are shaping your [Platform] feed" verdict, OBSERVED + LIKELY sub-lines (the workhorse pair from the Results design spec), and four FactRow supporting rows (Ads, Patterns, Political, Tone). Comparative anchors on Ads and Political rows use rolling averages when scan history is available; the anchor is omitted on first scans per the design spec.
- **Calm-case fallback** when no template matches. Produces a "Your [Platform] feed is in its usual shape" verdict with a placeholder OBSERVED sub-line and no supporting rows. Will graduate to a proper calm-case template in a later phase.
- **Surface gating**: only `'results'` is functional. Calls with any `'dashboard.*'` surface throw `"surface X not yet implemented"`, so unimplemented surfaces fail loudly during development rather than silently producing wrong output.
- **Cross-scan rolling averages** for seven metrics: `ad_pct`, `suggested_pct`, `political_pct`, `top_creator_share`, `tone_positive_pct`, `tone_neutral_pct`, `tone_negative_pct`. Per-platform, sample-size-gated (returns null when fewer than 2 scans remain after filtering, or when extraction fails on more than half the window), defensive against malformed scan data.
- **Reusable utils**: `capitalizePlatform()` for brand-correct platform names (YouTube, TikTok, X), `getComparativeAnchor()` for the 2-4 word "typical / higher than typical / N× your typical" phrases.

## Next phases

- **Phase 4**: wire the engine into the Results screen (`app/analysis/[sessionId].tsx`). Replace the four trivial `interpret*` functions currently rendering "Key Findings" with the engine's structured output. Build the four-mode sub-line UI primitives (OBSERVED marker, LIKELY marker) in the design system.
- **Phase 5+**: add more Results templates (Broadly sourced, Heavy ad load, Political shift from the design spec), graduate the calm-case to its own template, and add a proper top-topic derivation so the Patterns supporting row can move from "top content type" to "top topic category".
- **Future**: extend to Dashboard surfaces, add additional derivations (creator recurrence, advertiser persistence, trajectory series, cross-metric correlation), and introduce the SOMETHING TO TRY and QUESTION sub-line modes.

The full MVP scope and phase plan live in the [scoping doc](../../../audits/2x-interpretation-engine-scoping/decisions.md).
