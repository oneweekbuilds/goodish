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
 * The shared aggregation algorithm. Intended for internal use by
 * recurrence wrapper functions (computeCreatorRecurrence,
 * computeAdvertiserRecurrence, ...) — not part of the public engine
 * API. Exported because TypeScript doesn't enforce module-private
 * exports; treat as private by convention.
 *
 * @param postPredicate runs AFTER the structural validity check
 *   `(post && typeof post === 'object')` but BEFORE handle extraction.
 *   Returning `false` excludes the post from aggregation without
 *   affecting windowScanCount.
 */
export function aggregateAcrossScans(
  scans: ScanDetail[],
  platform: string,
  postPredicate: (post: Record<string, unknown>) => boolean,
  options: RecurrenceOptions = {},
): RecurrenceResult {
  const { windowSize = DEFAULT_WINDOW_SIZE, excludeScanId } = options;

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
    let posts: unknown;
    try {
      const raw = scan.raw_data;
      if (!raw || typeof raw !== 'object') continue;
      posts = (raw as Record<string, unknown>).posts;
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
    let firstSeenIndex = 0;
    for (const idx of agg.scanIndices) {
      if (idx > firstSeenIndex) firstSeenIndex = idx;
    }
    records.push({
      handle: agg.handle,
      displayName: agg.displayName,
      scanCount: agg.scanIndices.size,
      totalPosts: agg.totalPosts,
      firstSeenIndex,
    });
  }

  records.sort((a, b) => {
    if (b.scanCount !== a.scanCount) return b.scanCount - a.scanCount;
    return b.totalPosts - a.totalPosts;
  });

  return { records, windowScanCount: filtered.length };
}
