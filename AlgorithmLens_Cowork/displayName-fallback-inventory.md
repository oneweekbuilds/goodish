# displayName fallback inventory

Planning doc — not project code. Inventory of every place in the mobile app that renders a creator handle, plus whether the call site uses the `displayName ?? @name` fallback pattern (matching `OverviewTab.tsx`) or just renders the raw `.name` / `.handle` field.

The fix happens during each tab's redesign, not now. This doc is the input.

## Background — what is the fallback?

The data layer's `CreatorStat` shape exposes both fields:

```ts
// mobile/src/lib/computeDashboardData.ts:244
export interface CreatorStat {
  name: string;
  displayName: string | null;
  count: number;
  percentage: number;
}
```

`name` is the raw handle (sometimes a YouTube channel id like `UC...`). `displayName` is the human-readable label ("Fox News"). The redesigned `OverviewTab.tsx` prefers `displayName` and falls back to `@name`:

```ts
const display = c.displayName ?? (c.name.startsWith('@') ? c.name : `@${c.name}`);
```

`formatHandle()` from `mobile/src/lib/formatHandle.ts` only normalizes the `@`-prefix; it does NOT consult `displayName`.

## Critical scoping note

The `displayName` fallback is **only applicable to `CreatorStat`-shaped data**. Other handle-bearing types in `computeDashboardData.ts` do NOT carry a `displayName` field:

| Type | Fields | displayName field? |
|---|---|---|
| `CreatorStat` | `name`, `displayName`, `count`, `percentage` | ✅ yes |
| `AdvertiserStat` | `name`, `count`, `percent` | ❌ no |
| `ToneSourceStat` | `handle`, `count` | ❌ no |
| `PoliticalAnalysis.topPoliticalSource` | `handle`, `count`, `pctOfPolitical` | ❌ no |
| `UnlabeledPromos.topTriggers` | `name`, `count` | ❌ no |
| `UnlabeledPromos.exampleAccounts` | `string[]` | ❌ no |

So the inventory below splits into two groups:

- **Group 1 — `CreatorStat` consumers** — fallback opportunity exists; redesign should adopt it.
- **Group 2 — non-`CreatorStat` consumers** — fallback NOT applicable from presentation alone; either accept raw `@handle`, or a future data-layer change adds `displayName` upstream (out of scope for this redesign).

## Group 1 — CreatorStat consumers

These render `CreatorStat`-shaped data and have a `displayName` field available. Redesigns should use the `displayName ?? @name` pattern.

### Tab: Who Shapes Your Feed (Sources)

| File | Line | Snippet | Has fallback? |
|---|---|---|---|
| `mobile/app/(tabs)/dashboard.tsx` | 168 | `{data.topCreators[0]?.name ? formatHandle(data.topCreators[0].name) : '—'}` (Top Source stat card label) | ❌ no |
| `mobile/app/(tabs)/dashboard.tsx` | 209 | `data={data.topCreators.slice(0, isPlus ? 10 : 5).map((creator) => ({ label: formatHandle(creator.name), ... }))}` (ALBarChart label series) | ❌ no |

**Fix during Sources redesign**: replace `formatHandle(creator.name)` with `creator.displayName ?? formatHandle(creator.name)` (or import the same helper from OverviewTab). Both call sites read `topCreators[i]` which is `CreatorStat`-shaped.

### Tab: Overview (reference implementation — already correct)

| File | Line | Snippet | Has fallback? |
|---|---|---|---|
| `mobile/src/screens/dashboard/OverviewTab.tsx` | 96 | `top.displayName ?? (top.name.startsWith('@') ? top.name : '@${top.name}')` (top-creator-share hero label) | ✅ yes |
| `mobile/src/screens/dashboard/OverviewTab.tsx` | 507 | `const display = c.displayName ?? (c.name.startsWith('@') ? c.name : '@${c.name}');` (Top influencers row) | ✅ yes |

These are the two sites that established the pattern in build #50. No change needed.

## Group 2 — Non-CreatorStat consumers

These render handles from types that do NOT carry a `displayName` field. The presentation layer cannot synthesize a fallback; only the raw `.name` / `.handle` is available. Redesigns will preserve raw `@handle` rendering unless the data-layer types are extended (separate hook-touching change, currently out of scope).

### Tab: Ads & Promotions

| File | Line | Snippet | Type | Has fallback? |
|---|---|---|---|---|
| `mobile/app/(tabs)/dashboard.tsx` | 425 | `{data.topAdvertisers[0]?.name ? formatHandle(data.topAdvertisers[0].name) : '—'}` (Top Ad Source stat card) | `AdvertiserStat` | n/a — type has no displayName |
| `mobile/app/(tabs)/dashboard.tsx` | 573 | `{formatHandle(advertiser.name)}` (top advertisers list inside collapsible) | `AdvertiserStat` | n/a |
| `mobile/app/(tabs)/dashboard.tsx` | 714 | `{formatHandle(handle)}` (unlabeled-promos example accounts — `string[]`, no enclosing object) | `string` | n/a |

Note: code comments at `dashboard.tsx:404-410` already acknowledge that `topAdvertisers[].name` is the post creator handle, not the advertised brand. This is a known data-quality caveat preserved across redesigns.

### Tab: Political Exposure

| File | Line | Snippet | Type | Has fallback? |
|---|---|---|---|---|
| `mobile/app/(tabs)/dashboard.tsx` | 1379 | `{formatHandle(analysis.topPoliticalSource.handle)}` (top political source card) | `PoliticalAnalysis.topPoliticalSource` | n/a — type literally `{ handle, count, pctOfPolitical }` |

### Tab: Emotional Tone

| File | Line | Snippet | Type | Has fallback? |
|---|---|---|---|---|
| `mobile/app/(tabs)/dashboard.tsx` | 1742 | `{formatHandle(source.handle)}` (Most Positive Sources list) | `ToneSourceStat` | n/a |
| `mobile/app/(tabs)/dashboard.tsx` | 1768 | `{formatHandle(source.handle)}` (Most Negative Sources list) | `ToneSourceStat` | n/a |

### Tab: Suggested vs. Followed

No creator-handle render sites in `SuggestedContent` (lines 784–1262). The tab renders topic strings, platform names, and content format names — no per-creator handle lists.

## Other surfaces (non-dashboard) — read-only audit

### Data layer — `computeDashboardData.ts` (out of scope)

These are inside the data layer building copy strings, not presentation-layer renders. Per project rules we don't touch the data layer; logging here for completeness.

| File | Line | Snippet | Has fallback? |
|---|---|---|---|
| `mobile/src/lib/computeDashboardData.ts` | 440 | `meaning: \`${formatHandle(topName)} alone appeared in ${topPct}% of posts...\`` (sourcesInsight composition) | ❌ no |
| `mobile/src/lib/computeDashboardData.ts` | 447 | `meaning: \`${formatHandle(topName)} appeared most often...\`` (sourcesInsight) | ❌ no |
| `mobile/src/lib/computeDashboardData.ts` | 982 | `summary += \`, mostly from ${formatHandle(analysis.topPoliticalSource.handle)}\`` (politicalSummary) | n/a — non-CreatorStat |

If the redesigns drop `InsightHero` (which renders `sourcesInsight.meaning`), call sites 440 and 447 either become dead or migrate. The political summary on line 982 still feeds the Politics tab via `data.politicalSummary`.

### `formatHandle` consumers outside the dashboard

`grep -rl 'formatHandle' mobile/src mobile/app` returned 3 files:

| File | Notes |
|---|---|
| `mobile/src/lib/computeDashboardData.ts` | Data layer (above). 3 call sites. |
| `mobile/app/(tabs)/dashboard.tsx` | The 8 dashboard call sites covered above. |
| `mobile/src/components/analysis/BroadcastResultsSummary.tsx` | **Imports `formatHandle` (line 27) but does NOT call it.** Dead import. Worth removing on a separate cleanup pass. |

### Other handle-shaped renders found in non-dashboard surfaces

| File | Line | Notes |
|---|---|---|
| `mobile/src/components/home/CalmHomeScreen.tsx` | 139–141 | Reads `meta?.display_name ?? meta?.full_name ?? meta?.name` for the user's *own* profile-display first-name greeting. **NOT a creator handle render** — different concept (user profile metadata, not feed creator). Already implements its own multi-fallback pattern. No change needed. |
| `mobile/app/scanner/[platform].tsx` | 219, 256, 316 | Reads `p.creator_handle` when persisting raw scan posts to the database. Pure data passthrough, not a Text render. No change needed. |

No other render sites found.

## Summary by tab

| Tab | CreatorStat fallback opportunities | Non-CreatorStat handles | Priority for redesign |
|---|---|---|---|
| Overview | 0 (already correct) | 0 | Reference implementation; no action |
| Sources | **2 sites** | 0 | High — both render the dominant top creator |
| Ads | 0 | 3 sites | Low — type lacks displayName; raw @handle is the only option |
| Politics | 0 | 1 site | Low — type lacks displayName |
| Tone | 0 | 2 sites | Low — type lacks displayName |
| Suggested vs Followed | 0 | 0 | None |

## Recommendation for the upcoming redesigns

1. **Sources redesign**: adopt the `displayName ?? formatHandle(name)` fallback at lines 168 and 209. ~2 lines.
2. **Ads / Politics / Tone redesigns**: ship the redesigned UI with raw `@handle` rendering. Flag a separate, future data-layer change to extend `AdvertiserStat`, `ToneSourceStat`, and `PoliticalAnalysis.topPoliticalSource` with optional `displayName` fields — but that's a hook-touching change deliberately deferred.
3. **Optional cleanup** (separate commit): remove the dead `formatHandle` import from `BroadcastResultsSummary.tsx`.

This doc supersedes itself once all 5 tabs are redesigned. Delete then.

## Future data-layer work — extending non-CreatorStat types with displayName

**OUT OF SCOPE for current redesign work — data-layer change. Logged here so the work is discoverable when we revisit it.**

The 6 non-CreatorStat handle render sites (Ads ×3, Politics ×1, Tone ×2 from the inventory above) cannot be fixed by presentation-layer changes alone — their underlying types in `mobile/src/lib/computeDashboardData.ts` don't carry a `displayName` field. To make those sites render human-readable creator names (e.g. "Fox News" instead of `@FoxNews`), each of the four affected types needs an optional `displayName?: string` field, and the corresponding extractor in `computeDashboardData.ts` needs to populate it from the underlying scan rows.

Each scan post in `RawPost` already carries both `creator_handle` and `creator_display_name` (see `computeDashboardData.ts:19-20`). The information is there in the source data; the aggregation functions just don't currently propagate it through to the typed shapes consumed by the dashboard.

### 1. `AdvertiserStat`

**Current shape** (`computeDashboardData.ts:251-255`):
```ts
export interface AdvertiserStat {
  name: string;
  count: number;
  percent: number;
}
```

**Change needed**: add `displayName?: string | null` field.

**Construction site**: search `computeDashboardData.ts` for the function that aggregates `topAdvertisers` (the assignment to `data.topAdvertisers` in the main `computeDashboardData` return object). The aggregator iterates ad-flagged posts and counts per `creator_handle`; it needs to also retain `creator_display_name` from the same post and surface it as `displayName` on the resulting stat.

**Consumer tab**: Ads & Promotions (3 render sites — `dashboard.tsx:425, 573`, plus the `topAdvertisers[]` series rendered inline).

### 2. `ToneSourceStat`

**Current shape** (`computeDashboardData.ts:124-127`):
```ts
export interface ToneSourceStat {
  handle: string;
  count: number;
}
```

**Change needed**: add `displayName?: string | null` field.

**Construction site**: `extractTopToneSources` (or whichever function builds `topPositiveSources` and `topNegativeSources`). Same propagation pattern — pull `creator_display_name` alongside `creator_handle` during the per-post aggregation.

**Consumer tab**: Emotional Tone (2 render sites — `dashboard.tsx:1742, 1768`).

### 3. `PoliticalAnalysis.topPoliticalSource`

**Current shape** (inline at `computeDashboardData.ts:46-50`):
```ts
topPoliticalSource: {
  handle: string;
  count: number;
  pctOfPolitical: number;
} | null;
```

**Change needed**: add `displayName?: string | null` field to the inline shape. (Or extract to a named interface `TopPoliticalSource` first if cleaner.)

**Construction site**: `computeDashboardData.ts:694-698` builds this from a `creatorPoliticalCounts` map. The map's keys appear to be raw handles; values would need to additionally retain `creator_display_name` from the contributing posts (use the most-recent or most-frequent display name when handles repeat).

**Consumer tab**: Political Exposure (1 render site — `dashboard.tsx:1379`).

### 4. `UnlabeledPromos.topTriggers` (and `exampleAccounts`)

**Current shape** (`computeDashboardData.ts:165-170`):
```ts
export interface UnlabeledPromos {
  count: number;
  percentage: number;
  topTriggers: { name: string; count: number }[];
  exampleAccounts: string[];
}
```

**Change needed (subtler)**:
- `topTriggers` doesn't surface creator handles — `name` here is the trigger keyword/phrase that matched the unlabeled-promo classifier. **No displayName fallback applies** to triggers.
- `exampleAccounts: string[]` IS the creator-handle list. To surface `displayName`, this would need to become `{ handle: string; displayName?: string | null }[]` — a breaking shape change.

**Construction site**: search `computeDashboardData.ts` for `unlabeledPromos` assembly (extractor function building the `UnlabeledPromos` object).

**Consumer tab**: Ads & Promotions (1 render site — `dashboard.tsx:714`).

**Note**: `UnlabeledPromos` is the only one of the four where the data-layer change is non-trivial (shape change vs. additive optional field). The other three are purely additive and backward-compatible.

### Suggested batching

If/when this work happens, the four type extensions cluster well:

- **One commit, one file**: all four changes touch only `computeDashboardData.ts`. The extractor functions are sibling-shaped — find the `creator_display_name` field on the contributing posts during aggregation, propagate it through.
- **No tab UI changes required at the time of the data-layer commit**. Existing renders continue to work since `displayName` is optional. Tabs adopt the fallback during their respective redesigns.
- **Test impact**: any test fixtures for `computeDashboardData` that snapshot `AdvertiserStat`/`ToneSourceStat`/`UnlabeledPromos`/`PoliticalAnalysis` shapes will need updates. Worth grepping `__tests__` before opening the change.

### Risk on the `UnlabeledPromos.exampleAccounts` shape change

Because `exampleAccounts` would change from `string[]` to `{ handle: string; displayName?: string | null }[]`, every consumer of that field needs updating in lockstep with the data-layer commit. Currently only one consumer (`dashboard.tsx:714`). When that line is touched during the Ads tab redesign, that's the natural moment to do this shape change — bundle the data-layer extension with the Ads tab UI rewrite rather than as a standalone commit.
