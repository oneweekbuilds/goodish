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
| `interpretation-types.ts` | Core types: `Subline`, `SupportingRow` (discriminated union), `InterpretationResult`, `InterpretationContext`. |
| `interpretationEngine.ts` | Orchestrator. Public entry: `interpretScan(context)`. |
| `derivations/` | Pure cross-scan aggregations. Each function takes `scans[]` and produces a structured aggregation. |
| `derivations/rollingAverage.ts` | Per-platform, per-metric running average. |
| `derivations/index.ts` | Barrel. |
| `templates/` | Per-surface template collections. Each template is a `{ when, verdict, observed, likely, ... }` record. |
| `templates/results.ts` | Results screen templates. |
| `templates/index.ts` | Barrel. |

## Status

Phase 1 of MVP implementation. Module structure established. Engine not yet functional.

The MVP scope and phase plan live in the scoping doc. The eventual MVP delivers a working `interpretScan()` for the Results screen, with rolling-average-based comparative anchors and OBSERVED + LIKELY sub-lines.
