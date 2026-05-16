# InsightHero consumers inventory

Planning doc — not project code. Inventory of every place in the codebase that imports, renders, or otherwise depends on the legacy `InsightHero` component, in advance of deprecating it across the remaining 5 dashboard tab redesigns (Sources, Ads, Politics, Tone, Suggested vs. Followed).

The component itself lives at `mobile/src/components/dashboard/InsightHero.tsx` (331 lines) and is a single-export module: `export const InsightHero = React.memo(InsightHeroComponent)`. It accepts a `title / meaning / whyCare / meta / accent / counterfactual / howWeMeasure` prop bundle and renders a multi-block hero card with progressive-disclosure "About this analysis" panel.

The data shape it consumes (`InsightHeroData`) is defined in `mobile/src/lib/computeDashboardData.ts:237` — six pre-built per-tab insights are exposed on `DashboardData` as `overviewInsight`, `sourcesInsight`, `adsInsight`, `suggestedInsight`, `politicsInsight`, `toneInsight`.

## Headline finding

**The `InsightHero` *component* is rendered in exactly one file: `mobile/app/(tabs)/dashboard.tsx`, in 5 places (Sources, Ads, Suggested, Politics, Tone).** It is NOT consumed by any other surface in the app — not Home, not History, not Settings, not Scan, not Broadcast, not Scanner, not the analysis components. The redesign needs to swap each of those 5 render sites; nothing else will break when the component is deleted.

The `InsightHeroData` *type* is referenced in `computeDashboardData.ts` (data layer) and in those same 5 render sites in `dashboard.tsx`. Plus 41 test assertions in `mobile/src/__tests__/computeDashboardData.test.ts`. See the test impact section below.

## Component render sites — the 5 consumers

All in `mobile/app/(tabs)/dashboard.tsx`. All pass `accent={colors.primaryBlue}` and a per-tab `counterfactual` + `howWeMeasure` block.

### Sources tab — `SourcesContent`

| Aspect | Value |
|---|---|
| File | `mobile/app/(tabs)/dashboard.tsx` |
| Line | 118 |
| Imports | `InsightHero` component + `data.sourcesInsight` |
| Renders | The Sources hero — title/meaning/whyCare/meta from `sourcesInsight` + counterfactual about following choices vs. algorithmic amplification + howWeMeasure (top-5 concentration) |
| Touch in redesign? | **YES.** Replace with `HeroStatCard` — hero metric is `top5Pct` or top-creator share (per the Sources audit). counterfactual + howWeMeasure migrate to a `DisclosureRow` + sheet. |

### Ads tab — `AdsContent`

| Aspect | Value |
|---|---|
| File | `mobile/app/(tabs)/dashboard.tsx` |
| Line | 368 |
| Imports | `InsightHero` component + `data.adsInsight` |
| Renders | The Ads hero — title/meaning/whyCare/meta from `adsInsight` + counterfactual about ads blending in + howWeMeasure (label-based detection) |
| Touch in redesign? | **YES.** Replace with `HeroStatCard` on `adPct`. counterfactual + howWeMeasure migrate to `DisclosureRow`. |

### Suggested vs. Followed tab — `SuggestedContent`

| Aspect | Value |
|---|---|
| File | `mobile/app/(tabs)/dashboard.tsx` |
| Line | 790 |
| Imports | `InsightHero` component + `data.suggestedInsight` |
| Renders | The Suggested-vs-followed hero — title/meaning/whyCare/meta from `suggestedInsight` + counterfactual about session variability + howWeMeasure (platform-indicator classification) |
| Touch in redesign? | **YES.** Replace with `HeroStatCard` on whichever is dominant (suggestedPct or followedPct). counterfactual + howWeMeasure migrate to `DisclosureRow`. |

### Politics tab — `PoliticsContent`

| Aspect | Value |
|---|---|
| File | `mobile/app/(tabs)/dashboard.tsx` |
| Line | 1301 |
| Imports | `InsightHero` component + `data.politicsInsight` |
| Renders | The Politics hero — title/meaning/whyCare/meta from `politicsInsight` + counterfactual about exposure-not-belief + howWeMeasure (Gemini AI classification) |
| Touch in redesign? | **YES.** Replace with `HeroStatCard` on `politicalPct`. **Politics currently has TWO heroes** (InsightHero + a `BigNumber` card below); the redesign collapses to one. counterfactual + howWeMeasure migrate to `DisclosureRow`; Politics also has its own `PoliticsMethodologyDisclaimer` block at the bottom that gets folded into the same disclosure surface. |

### Tone tab — `ToneContent`

| Aspect | Value |
|---|---|
| File | `mobile/app/(tabs)/dashboard.tsx` |
| Line | 1598 |
| Imports | `InsightHero` component + `data.toneInsight` |
| Renders | The Tone hero — title/meaning/whyCare/meta from `toneInsight` + counterfactual about sarcasm/irony + howWeMeasure (Gemini AI valence classification) |
| Touch in redesign? | **YES.** Replace with `HeroStatCard` showing dominant tone bucket (e.g. `"{maxPct}% mostly {tone}"`). counterfactual + howWeMeasure migrate to `DisclosureRow`. Tone has its own `ToneMethodologyDisclaimer` similar to Politics'; folds into same surface. |

### Overview tab — already migrated

The Overview tab (`mobile/src/screens/dashboard/OverviewTab.tsx`) was the first to drop `InsightHero` during build #48. It does NOT import `InsightHero`, render `<InsightHero>`, or consume `data.overviewInsight` directly. Confirmed via grep — zero matches for any of those tokens in `OverviewTab.tsx`. The reference implementation for what migration looks like.

## Data-layer scaffolding for `InsightHeroData`

`InsightHeroData` is the typed shape passed to the component. It's built by 6 sibling factory functions in `computeDashboardData.ts`:

| Function | Line | Builds |
|---|---|---|
| `buildOverviewInsight` | 381 | overviewInsight |
| `buildSourcesInsight` | 422 | sourcesInsight |
| `buildAdsInsight` | 466 | adsInsight |
| `buildSuggestedInsight` | 524 | suggestedInsight |
| `buildPoliticsInsight` | 1008 | politicsInsight |
| `buildToneInsight` | 572 | toneInsight |

Each builder produces `{ title, meaning, whyCare, meta }` strings tailored per-tab via bucket-based conditional copy (e.g. `suggestedPct >= 80` → "came from accounts you don't follow"). They are called from the main `computeDashboardData` body at lines 1569–1574 (early-return path) and 1714–1719 (full path).

These functions are the only callers of themselves — they are not exported beyond `computeDashboardData.ts`. After all 5 tabs migrate away from `InsightHero`, the question becomes: do the redesigned `HeroStatCard` and `DisclosureRow` surfaces still want pre-built copy from the data layer, or do they synthesize their own copy from the underlying counts?

**My read**: keep the builders. The bucket-based copy logic encodes domain interpretation that's worth preserving (e.g. distinguishing `pct >= 80` vs `>= 50` vs `>= 20` thresholds). The new HeroStatCard can consume `*Insight.title` as its `label`, `*Insight.whyCare` as its `description`, ignore `meaning` if it's redundant, and pipe `meta` into the new "About this analysis" `DisclosureRow`. The builders stay; only the component changes.

## Test impact — `computeDashboardData.test.ts`

41 test assertions reference `*Insight.{title,meaning,whyCare,meta}` fields:

| Field | Assertions |
|---|---|
| `*Insight.title` | 25 |
| `*Insight.meaning` | 7 |
| `*Insight.whyCare` | 6 |
| `*Insight.meta` | 3 |
| **Total** | **41** |

Per-tab breakdown of test assertions:

| Tab | Lines | Sample assertions |
|---|---|---|
| Overview | 235, 245, 252, 273, 282, 730, 759 | `expect(result.overviewInsight.title).toContain('Not enough data')`, `.toContain('many voices')` |
| Ads | 293, 302, 311, 320 | `.toContain('commercial content')`, `.toContain('1 in')`, `.toContain('contained ads')`, `.toContain('minimal')` |
| Suggested | 331, 340, 349 | `.toContain("don't follow")`, `.toContain('More than half')`, `.toContain('mostly from accounts you follow')` |
| Tone | 584, 599, 604 | `.toContain('balanced')`, `.toContain('negative')`, `.toContain('requires AI')` |
| Politics | 613, 627, 642, 657 | `.toContain('requires AI')`, `.toContain('Limited')`, `.toContain('political content')`, `.toContain('1 in')` |

**These tests do NOT need to break.** The assertions test the data-layer builders, not the component. As long as the redesign keeps the builders (per the recommendation above) and doesn't change their output strings, all 41 assertions continue to pass. If a redesign opts to rewrite or remove a builder, the corresponding tests would need to be updated or deleted.

## Tendrils — types and helpers tied to InsightHero

### `HowWeMeasureData` interface

| Aspect | Value |
|---|---|
| Defined in | `src/components/dashboard/InsightHero.tsx:19` (private — not exported) |
| Shape | `{ what?, how?, limitations?, learnMoreUrl? }` |
| Consumers outside InsightHero.tsx | NONE (grep returns 0 matches in any other file) |
| Disposition | Dies cleanly when InsightHero is deleted. No external callers to update. |

### `counterfactual` prop

The 5 dashboard render sites pass per-tab `counterfactual` strings inline (the longest is the Politics one at ~50 words). These are content, not code — they migrate to whatever copy slot the new `DisclosureRow` / sheet exposes during redesign. No scaffolding to remove; just literal-string moves.

### `howWeMeasure` prop

Same situation — the 5 render sites pass per-tab `howWeMeasure={{ what, how, limitations }}` objects inline. Pure content. Migrates to the new disclosure surface.

### Helper: `metaLine` / `InsightMeta` / etc.

None found. `grep` for `metaLine`, `InsightMeta`, `insightMeta` returns zero matches. The `meta` field on `InsightHeroData` is a plain pre-built string (e.g. `Based on N posts from {platform}`) constructed inside the builders. No standalone helper.

### Visual scaffolding inside `InsightHero` (gradient, expand-collapse animation, ChevronDown)

`InsightHero.tsx:1–331` includes:

- A `LinearGradient`-based decorative accent block (violates the new "no gradients" rule)
- A web-safe `GradientWrapper` Platform.OS shim
- An `Animated.timing` height transition for the progressive-disclosure expand
- A `Pressable` + `ChevronDown` disclosure trigger
- An optional `learnMoreUrl` `Linking.openURL` handler

None of these are exported. All die with the component.

## Surfaces the audit ruled OUT

For completeness, the following surfaces were grep-checked and found to NOT consume `InsightHero` or `InsightHeroData`:

- `mobile/app/(tabs)/index.tsx` (Home) — does not import or reference InsightHero
- `mobile/app/(tabs)/history.tsx` — does not reference InsightHero
- `mobile/app/(tabs)/settings.tsx` — does not reference InsightHero
- `mobile/app/(tabs)/scan.tsx` — does not reference InsightHero
- `mobile/app/scanner/[platform].tsx` — does not reference InsightHero
- `mobile/app/broadcast/[platform].tsx` — does not reference InsightHero
- `mobile/app/analysis/[sessionId].tsx` — does not reference InsightHero
- `mobile/src/components/home/CalmHomeScreen.tsx` — does not reference InsightHero
- `mobile/src/components/analysis/*` — does not reference InsightHero
- `mobile/src/components/broadcast/*` — does not reference InsightHero
- `mobile/src/components/scanner/*` — does not reference InsightHero
- All other `src/components/*` paths

## Disposition plan when redesign work concludes

1. Remove the import on `dashboard.tsx:21`.
2. Confirm zero `<InsightHero` JSX usages remain (grep).
3. Delete `mobile/src/components/dashboard/InsightHero.tsx` (the whole file, 331 lines).
4. Optionally, audit the legacy `colors.primaryBlue12`-style gradient tokens that were used only by InsightHero (deferred; covered in the cross-tab risk flags from the earlier audit).
5. Keep `InsightHeroData` and the 6 builder functions in `computeDashboardData.ts` per the recommendation above; they continue to power the new HeroStatCard label/description and the new DisclosureRow methodology surface. The `*Insight` field names stay on `DashboardData` to keep tests passing without rewriting fixtures. (If a future cleanup wants to rename them — e.g. `sourcesInsight` → `sourcesCopy` — that's a separate breaking change with 41 test assertions to update.)

## Quick reference — total count of consumers

| Consumer | Count | Files |
|---|---|---|
| `InsightHero` component imports | 1 | `dashboard.tsx` |
| `<InsightHero>` JSX renders | 5 | `dashboard.tsx` (Sources, Ads, Suggested, Politics, Tone) |
| `InsightHeroData` type references | 14 | `computeDashboardData.ts` (8 internal: type def + 6 builder return-type annotations + the 6 `*Insight` field declarations on DashboardData; 6 builder call-sites) |
| Test assertions on `*Insight.*` fields | 41 | `src/__tests__/computeDashboardData.test.ts` |
| `HowWeMeasureData` type external consumers | 0 | (private to InsightHero.tsx) |
| Helper exports outside InsightHero | 0 | (single-export module) |

## Disposition of `*Insight` fields on `DashboardData`

The data-layer builders (`buildOverviewInsight`, `buildSourcesInsight`, `buildAdsInsight`, `buildSuggestedInsight`, `buildPoliticsInsight`, `buildToneInsight`) produce well-tested copy. The `InsightHero` component is a render shell — the value is in the copy, not the shell. As the 5 remaining tabs migrate off `InsightHero`, the `*Insight` fields and their builders should be **preserved**.

### Decision: keep the `*Insight` fields on `DashboardData` as-is

Consume their content through the new design system primitives instead of rewriting or removing the builders.

### Per-field consumption plan

| Field | Migrates to | Notes |
|---|---|---|
| `title` | `HeroStatCard` headline label or its interpretive text | Sentence-case headline that captures the dominant insight (e.g. `"Came from accounts you don't follow"` for the Suggested hero). The bucket-based switch logic in the builder stays. |
| `meaning` | `HeroStatCard.description` near the hero, or the body of a paired `ExpandableCard` immediately below | The longer prose interpretation (e.g. `"Your top source dominates this session"`). If the redesign places the hero number above a 1-line description, `meaning` is the natural fit. If the description slot is shorter, `meaning` moves into the first ExpandableCard's body or the methodology disclosure sheet. |
| `whyCare` | `MethodologyDisclosureSheet` body, OR a small block beneath the hero | Currently optional. Skews philosophical ("Why this matters"). Most natural home is inside the disclosure sheet. Per-tab decision during the actual redesign. |
| `meta` | The page-level meta strip (already there) | Already rendered as `"May 7, 2026 at 12:04 PM · Facebook · 82 posts"`. Keep using `*Insight.meta` for that string — it's the single source of truth for `getPlatformDisplayName` formatting (called out as a risk in the cross-tab audit). |
| `howWeMeasure` | `MethodologyDisclosureSheet` (the audit already proposed this primitive) | The full `{ what, how, limitations, learnMoreUrl }` object passes straight through. The sheet renders three labeled paragraphs and an optional outbound link. |
| `counterfactual` | Optional. Either folds into `MethodologyDisclosureSheet` (likely as a labeled "Alternative interpretations" section), or deprecated per-tab if it doesn't fit the redesigned voice | Per-tab judgment call during redesign. Keep the strings in `dashboard.tsx` for now even after migration — they're literal copy, easy to relocate. |

### Why keep the field names

41 test assertions in `mobile/src/__tests__/computeDashboardData.test.ts` reference these field paths (e.g. `result.sourcesInsight.title`, `result.adsInsight.meaning`). Renaming `sourcesInsight` to e.g. `sourcesCopy` would require updating all 41 assertions for purely cosmetic gain. The "Insight" naming is fine even after the InsightHero component is gone — these fields ARE the per-tab insight copy bundle. **Not worth a 41-assertion rewrite.**

If a future cleanup decides the rename is worth doing, that's a single mechanical PR and the audit doc gets revised then.

### Sequencing — when does the `InsightHero` component file get deleted?

The component file (`mobile/src/components/dashboard/InsightHero.tsx`, 331 lines) gets deleted as the **LAST step of the 5-tab redesign**, only after every `<InsightHero>` JSX render site in `dashboard.tsx` has been replaced. The component remains in the codebase between Build #51 (Sources + Politics, per the cross-tab batching plan) and the final cleanup, so partial redesigns don't break.

### Cleanup checklist after the final tab redesigns

When the last `<InsightHero>` render is removed from `dashboard.tsx`:

1. **Verify zero `<InsightHero` JSX usages remain** — `grep -rE '<InsightHero\b' mobile/app mobile/src` should return empty.
2. **Verify zero `InsightHero` import statements remain** — same grep for `from '.*InsightHero'`.
3. **Remove `dashboard.tsx:21`** — the now-orphaned `import { InsightHero } from '../../src/components/dashboard/InsightHero';`.
4. **Delete `mobile/src/components/dashboard/InsightHero.tsx`** — the entire file, plus its private `HowWeMeasureData` interface and the `GradientWrapper`/`Animated.timing`/disclosure-trigger scaffolding that goes with it.
5. **Re-run `tsc --noEmit`** — should be clean. Any newly-surfaced "imported but never used" errors at this point are real (the previous pre-existing 31 errors are unrelated).
6. **Re-run `computeDashboardData.test.ts`** — all 41 `*Insight.*` assertions should still pass since the builders are unchanged.
7. **Optional follow-up cleanups**:
   - Audit whether any of the gradient tokens (`gradientPrimaryStart/End`) lose their last consumer with InsightHero gone. If so, mark them dead and remove on a separate pass.
   - Audit whether the per-tab `*MethodologyDisclaimer` subcomponents in `dashboard.tsx` (`PoliticsMethodologyDisclaimer` at line 1532, `ToneMethodologyDisclaimer` at line 1936) are still rendered, or have been folded into the new `MethodologyDisclosureSheet`. Remove if redundant.

### Risk on this disposition plan

The only realistic risk is if a redesigned hero ends up **not needing** the `meaning` or `whyCare` content at all — the new HeroStatCard's slim shape might leave one or both fields rendered nowhere. If that happens, the builders still produce them (cheap to compute), and the test assertions still pass. The fields just become "data the UI doesn't render." Not a problem; not worth removing.

This doc supersedes itself once all 5 tabs are redesigned and the deletion plan above executes. Delete then.
