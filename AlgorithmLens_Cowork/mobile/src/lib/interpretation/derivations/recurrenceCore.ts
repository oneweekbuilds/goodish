/**
 * recurrenceCore: shared cross-scan recurrence aggregation.
 *
 * The single algorithm that powers `computeCreatorRecurrence`,
 * `computeAdvertiserRecurrence`, and (when authored in Phase 5.5+)
 * any future per-category recurrence variant — political-creator
 * recurrence, suggested-source recurrence, etc. The wrappers differ
 * only in the post predicate they pass in; the aggregation logic is
 * identical.
 *
 * Extracted in Phase 5.4.2 when advertiser-recurrence became the
 * second consumer of the same algorithm. Documented decisions below
 * are the single source of truth — fixing a bug or revising a rule
 * here propagates to every wrapper automatically.
 *
 * ============================================================
 * Behavior decisions (the rules every wrapper inherits)
 * ============================================================
 *
 *   1. Case-insensitive grouping. Canonical key is `handle.toLowerCase()`.
 *      "@MarquesBrownlee" and "@marquesbrownlee" collapse to one record.
 *      This is DIFFERENT from rollingAverage's extractTopCreatorShare,
 *      which keys on the literal string. Recurrence compares creators
 *      ACROSS scans where capitalization drift is plausible; share
 *      computation compares within a single scan where it isn't.
 *
 *   2. Null-handle exclusion. Posts with no creator_handle AND no
 *      creator_display_name are excluded from per-creator counts but
 *      the scan they belong to still counts toward windowScanCount.
 *      This is DIFFERENT from computeDashboardData.countByCreator,
 *      which puts them in an 'Unknown' bucket. Tracking "Unknown" as
 *      recurrence would be a lie — it's a different unknown each time.
 *
 *   3. Display-name resolution: most-recent appearance wins. The
 *      aggregation walks scans newest-first, so the first display
 *      name encountered for each canonical key is the most-recent
 *      one — captured then not updated. Falls back to original-case
 *      handle when no display name is available.
 *
 *   4. firstSeenIndex semantics. Index into the desc-sorted window
 *      (0 = newest scan). Within an aggregate, this is the HIGHEST
 *      scan index where the creator appears (i.e., earliest in
 *      time). Wrappers' callers use windowScanCount - firstSeenIndex
 *      to convert to chronological position when needed.
 *
 *   5. Malformed-scan tolerance. Per-scan try/catch around the
 *      raw_data extraction. A scan with bad raw_data is skipped
 *      silently in aggregation but is still counted toward
 *      windowScanCount (it was a real scan in the window; only its
 *      posts payload was malformed).
 *
 *   6. Post-level predicate filtering. The `postPredicate`
 *      parameter is applied AFTER the structural validity check
 *      (post is a non-null object) but BEFORE handle extraction.
 *      Returning false short-circuits aggregation for that post
 *      without affecting windowScanCount. Wrappers that want every
 *      post (creator-recurrence) pass `() => true`; wrappers that
 *      filter (advertiser-recurrence) pass an `is_ad === true`
 *      check.
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md
 */

import type { ScanDetail } from '../../../hooks/useDashboard';

/** Default scan window. 6 matches the design spec's "5 of last 6
 *  scans" worked examples. */
const DEFAULT_WINDOW_SIZE = 6;

/**
 * One aggregated record per identifiable entity (creator, advertiser,
 * etc., depending on the wrapper's post predicate).
 */
export interface RecurrenceRecord {
  /** Canonical lowercased key used for grouping across scans. */
  handle: string;
  /** Display-form name to render. Most recent non-empty value
   *  observed in the window; falls back to the original-case handle
   *  if no display name ever appeared. */
  displayName: string;
  /** Number of distinct scans in the window where this entity
   *  appeared at least once (after the post predicate filter).
   *  Always >= 1 — entities with zero matching appearances aren't
   *  in the result. */
  scanCount: number;
  /** Sum of matching posts attributed to this entity across all
   *  scans in the window. Always >= scanCount. */
  totalPosts: number;
  /** Index into the desc-sorted window (0 = most recent scan) where
   *  this entity first appears, i.e., the HIGHEST scan index they're
   *  seen at. */
  firstSeenIndex: number;
  /**
   * Index into the desc-sorted window of the entity's MOST RECENT
   * appearance — the LOWEST scan index in the aggregate's set. Added
   * Phase 6.5.0 to enable absence detection.
   *
   * Read carefully: this is a position counter, NOT a time delta.
   *   - lastSeenIndex = 0 → entity is present in the most recent scan
   *     in the desc-sorted window. (When the active scan is included
   *     in the input array, that's the active scan.)
   *   - lastSeenIndex = 3 → entity is absent from the 3 most recent
   *     scans in the desc-sorted window; their most recent appearance
   *     is the 4th-newest scan (index 3, zero-indexed).
   *
   * It is NOT "days since last seen" (use computeCreatorAbsence's
   * daysSinceLastSeen for that — derived from lastSeenAt, not from
   * this index). It is NOT "chronological-forward index" (the window
   * is sorted newest-first). It is NOT "scans ago in absolute time"
   * (the window is sparse; consecutive indices are NOT consecutive
   * days).
   *
   * The pair (firstSeenIndex, lastSeenIndex) brackets the entity's
   * presence in the window: lastSeenIndex <= firstSeenIndex always,
   * with equality when the entity appears in exactly one scan.
   */
  lastSeenIndex: number;
  /** id of the scan at lastSeenIndex. The same id the input
   *  ScanDetail carried — not the scan_id alias. Use this to look up
   *  the source scan from the original input array when needed. */
  lastSeenScanId: string;
  /** created_at of the scan at lastSeenIndex, propagated verbatim
   *  from the source ScanDetail. ISO 8601 string in the production
   *  data shape. Date.parse-able; computeCreatorAbsence consumes this
   *  for the daysSinceLastSeen computation. */
  lastSeenAt: string;
}

export interface RecurrenceResult {
  /** Records sorted by scanCount desc, then totalPosts desc. */
  records: RecurrenceRecord[];
  /** Actual scan count in the window after platform + excludeScanId
   *  + windowSize filtering. Denominator for "in N of M scans" copy. */
  windowScanCount: number;
}

export interface RecurrenceOptions {
  windowSize?: number;
  excludeScanId?: string;
}

/**
 * Internal options extending RecurrenceOptions with the
 * `postsExtractor` parameter. Kept separate from the public
 * RecurrenceOptions so wrapper-facing types (CreatorRecurrenceOptions,
 * AdvertiserRecurrenceOptions, PoliticalCreatorRecurrenceOptions)
 * don't leak this implementation detail.
 *
 * Default extractor reads `raw_data.posts` (the structure
 * creator-recurrence and advertiser-recurrence walk). Wrappers that
 * need to aggregate from a different path inside raw_data — e.g.,
 * political-creator-recurrence walks `raw_data.analysis.feed_items`
 * because political classification lives there, not on
 * `raw_data.posts[]` — supply their own extractor and remap each
 * item to the core's expected `{ creator_handle, creator_display_name,
 * ... }` shape.
 */
export interface AggregateAcrossScansOptions extends RecurrenceOptions {
  /** Extract the post-shaped items the core will aggregate. The
   *  returned array's elements must carry `creator_handle` and
   *  `creator_display_name` for identity resolution. The default
   *  reads `raw.posts` (creator and advertiser wrappers); other
   *  wrappers may pull from `raw.analysis.feed_items` and remap. */
  postsExtractor?: (raw: Record<string, unknown>) => unknown[];
}

function defaultPostsExtractor(raw: Record<string, unknown>): unknown[] {
  const p = raw.posts;
  return Array.isArray(p) ? p : [];
}

/**
 * The shared aggregation algorithm. Intended for internal use by
 * recurrence wrapper functions (computeCreatorRecurrence,
 * computeAdvertiserRecurrence, computePoliticalCreatorRecurrence, ...)
 * — not part of the public engine API. Exported because TypeScript
 * doesn't enforce module-private exports; treat as private by
 * convention.
 *
 * @param postPredicate runs AFTER the structural validity check
 *   `(post && typeof post === 'object')` but BEFORE handle extraction.
 *   Returning `false` excludes the post from aggregation without
 *   affecting windowScanCount.
 * @param options.postsExtractor overrides where in raw_data the
 *   core reads posts from. Defaults to `raw.posts`. Wrappers that
 *   aggregate from `raw.analysis.feed_items` (political-creator)
 *   pass a custom extractor that remaps each item to the core's
 *   expected shape.
 */
export function aggregateAcrossScans(
  scans: ScanDetail[],
  platform: string,
  postPredicate: (post: Record<string, unknown>) => boolean,
  options: AggregateAcrossScansOptions = {},
): RecurrenceResult {
  const {
    windowSize = DEFAULT_WINDOW_SIZE,
    excludeScanId,
    postsExtractor = defaultPostsExtractor,
  } = options;

  if (!Array.isArray(scans) || scans.length === 0) {
    return { records: [], windowScanCount: 0 };
  }

  // Stage 1: scan-level filtering — platform, excludeScanId, sort
  // desc by date, slice to window. Mirrors rollingAverage's chain.
  const platformLower = platform.toLowerCase();
  const filtered = scans
    .filter((s) => {
      if (!s || typeof s !== 'object') return false;
      if (excludeScanId && s.id === excludeScanId) return false;
      if (typeof s.platform !== 'string') return false;
      return s.platform.toLowerCase() === platformLower;
    })
    .slice() // copy before sort (sort mutates)
    .sort((a, b) => {
      const aTime = Date.parse(a.created_at);
      const bTime = Date.parse(b.created_at);
      const aValid = Number.isFinite(aTime);
      const bValid = Number.isFinite(bTime);
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;
      return bTime - aTime;
    })
    .slice(0, windowSize);

  // Stage 2: post-level aggregation.
  type Aggregate = {
    handle: string;
    displayName: string;
    scanIndices: Set<number>;
    totalPosts: number;
  };
  const aggregates = new Map<string, Aggregate>();

  for (let scanIdx = 0; scanIdx < filtered.length; scanIdx++) {
    const scan = filtered[scanIdx]!;
    let posts: unknown[];
    try {
      const raw = scan.raw_data;
      if (!raw || typeof raw !== 'object') continue;
      posts = postsExtractor(raw as Record<string, unknown>);
    } catch {
      continue;
    }
    if (!Array.isArray(posts)) continue;

    for (const p of posts) {
      if (!p || typeof p !== 'object') continue;
      const post = p as Record<string, unknown>;
      if (!postPredicate(post)) continue;

      const handleField = post.creator_handle;
      const displayField = post.creator_display_name;

      const validHandle =
        typeof handleField === 'string' && handleField.length > 0
          ? handleField
          : null;
      const validDisplay =
        typeof displayField === 'string' && displayField.length > 0
          ? displayField
          : null;
      const rawHandle = validHandle ?? validDisplay;
      if (rawHandle === null) continue;

      const canonical = rawHandle.toLowerCase();
      let agg = aggregates.get(canonical);
      if (!agg) {
        const initialDisplayName = validDisplay ?? validHandle ?? rawHandle;
        agg = {
          handle: canonical,
          displayName: initialDisplayName,
          scanIndices: new Set<number>(),
          totalPosts: 0,
        };
        aggregates.set(canonical, agg);
      }
      agg.scanIndices.add(scanIdx);
      agg.totalPosts += 1;
    }
  }

  const records: RecurrenceRecord[] = [];
  for (const agg of aggregates.values()) {
    // Single pass over scanIndices: max for firstSeenIndex (oldest in
    // desc-sorted window), min for lastSeenIndex (most recent).
    // Initialize from any element of the set so we don't rely on a
    // sentinel value that could collide with a real index.
    const iter = agg.scanIndices.values();
    const first = iter.next();
    // The set is built by .add() inside the loop, so it always has at
    // least one element by the time we get here. Defensive default
    // satisfies TypeScript's narrowing.
    let firstSeenIndex = first.done ? 0 : first.value;
    let lastSeenIndex = firstSeenIndex;
    for (const idx of agg.scanIndices) {
      if (idx > firstSeenIndex) firstSeenIndex = idx;
      if (idx < lastSeenIndex) lastSeenIndex = idx;
    }
    const lastSeenScan = filtered[lastSeenIndex]!;
    records.push({
      handle: agg.handle,
      displayName: agg.displayName,
      scanCount: agg.scanIndices.size,
      totalPosts: agg.totalPosts,
      firstSeenIndex,
      lastSeenIndex,
      lastSeenScanId: lastSeenScan.id,
      lastSeenAt: lastSeenScan.created_at,
    });
  }

  records.sort((a, b) => {
    if (b.scanCount !== a.scanCount) return b.scanCount - a.scanCount;
    return b.totalPosts - a.totalPosts;
  });

  return { records, windowScanCount: filtered.length };
}
