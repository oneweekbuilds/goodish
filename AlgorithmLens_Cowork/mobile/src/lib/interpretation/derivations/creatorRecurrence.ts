/**
 * creatorRecurrence: cross-scan creator presence detection.
 *
 * Detects when a creator appears across multiple scans in the user's
 * history — the "@MarquesBrownlee · in 5 of last 6 scans" pattern
 * referenced throughout the Dashboard design spec.
 *
 * Returns one record per identifiable creator within the window,
 * sorted by scanCount desc (ties broken by totalPosts desc). Each
 * record carries the canonical handle, display form, scan count,
 * total posts, and the position in the desc-sorted window where the
 * creator first appears (templates that say "first appeared scan
 * 5 of 6" derive the chronological position from this).
 *
 * The result also includes windowScanCount — the actual scan count
 * in the window after filtering. Templates need this denominator to
 * render "in N of M scans" copy.
 *
 * Deliberate divergences from related code:
 *
 *   1. Case-insensitive grouping. "@MarquesBrownlee" and
 *      "@marquesbrownlee" collapse to the same record. This is
 *      DIFFERENT from rollingAverage's extractTopCreatorShare,
 *      which keys on the literal string. Recurrence compares
 *      creators ACROSS scans where capitalization drift is
 *      plausible; share computation compares within a single scan
 *      where it isn't. Harmonization (making extractTopCreatorShare
 *      case-insensitive too) is filed as future cleanup.
 *
 *   2. Null-handle exclusion. Posts with no creator_handle AND no
 *      creator_display_name are excluded from per-creator counts
 *      but still contribute to windowScanCount. This is DIFFERENT
 *      from computeDashboardData.countByCreator, which puts them in
 *      an 'Unknown' bucket. Tracking "Unknown" as recurrence would
 *      be a lie — it's a different unknown each time and reporting
 *      "Unknown appears in 6 of 6 scans" misleads.
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md,
 *            mobile/audits/2x-dashboard-design/decisions.md
 */

import type { ScanDetail } from '../../../hooks/useDashboard';

/** Default scan window. 6 matches the design spec's "5 of last 6
 *  scans" worked examples — a 6-scan window is enough history to
 *  detect persistent patterns while staying recent. */
const DEFAULT_WINDOW_SIZE = 6;

export interface CreatorRecurrenceRecord {
  /** Canonical lowercased key used for grouping across scans. */
  handle: string;
  /** Display-form name to render. Most recent non-empty value
   *  observed in the window; falls back to the original-case handle
   *  if no display name ever appeared for this creator. */
  displayName: string;
  /** Number of distinct scans in the window where this creator
   *  appeared at least once. Always >= 1 (creators with zero
   *  appearances aren't in the result). */
  scanCount: number;
  /** Sum of posts attributed to this creator across all scans in
   *  the window. Always >= scanCount. */
  totalPosts: number;
  /** Index into the desc-sorted window (0 = most recent scan)
   *  where this creator FIRST appears. With scans sorted newest-
   *  first, this is the HIGHEST index they're seen at.
   *
   *  Templates that say "first appeared scan 5 of 6" compute the
   *  chronological position as `windowScanCount - firstSeenIndex`.
   *  Templates that say "new this scan" check `firstSeenIndex === 0
   *  && scanCount === 1`. */
  firstSeenIndex: number;
}

export interface CreatorRecurrenceResult {
  /** Records sorted by scanCount desc, then totalPosts desc.
   *  Empty when no identifiable creators in the window. */
  records: CreatorRecurrenceRecord[];
  /** Actual scan count in the window after platform filter +
   *  excludeScanId + windowSize slice. The denominator for
   *  "in N of M scans" copy. */
  windowScanCount: number;
}

export interface CreatorRecurrenceOptions {
  /** Number of most-recent scans to consider. Default 6. */
  windowSize?: number;
  /** When set, the scan with this id is removed from the window
   *  before counting. Templates that want recurrence among prior
   *  scans only pass the active scan's id; templates that count the
   *  active scan toward recurrence pass undefined. */
  excludeScanId?: string;
}

export function computeCreatorRecurrence(
  scans: ScanDetail[],
  platform: string,
  options: CreatorRecurrenceOptions = {},
): CreatorRecurrenceResult {
  const { windowSize = DEFAULT_WINDOW_SIZE, excludeScanId } = options;

  if (!Array.isArray(scans) || scans.length === 0) {
    return { records: [], windowScanCount: 0 };
  }

  // Filter by platform (case-insensitive), exclude active scan,
  // sort by created_at desc, take top windowSize. Mirrors
  // rollingAverage's defensive filter chain.
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

  // Aggregate creators across the window. Walk newest-first so the
  // first display name we see for each creator is the most-recent
  // one — captured then not updated, per the design's resolution rule.
  type Aggregate = {
    handle: string; // canonical lowercased key
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
      // Defensive: malformed raw_data should never crash the
      // derivation. Scan still counted toward windowScanCount
      // (it was a real scan, even if the posts payload is bad).
      continue;
    }
    if (!Array.isArray(posts)) continue;

    for (const p of posts) {
      if (!p || typeof p !== 'object') continue;
      const post = p as Record<string, unknown>;
      const handleField = post.creator_handle;
      const displayField = post.creator_display_name;

      // Prefer handle over display_name for the canonical key.
      // Both fields can be null or empty; if both are missing the
      // post is unattributed and excluded from counts.
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
        // First encounter for this creator. Walking newest-first
        // means this is also their most-recent appearance — capture
        // display form preferring display_name, falling back to
        // the original-case handle.
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

  // Build records. firstSeenIndex is the HIGHEST scan index the
  // creator appears at (since desc sort means higher index = older
  // scan = earlier in time).
  const records: CreatorRecurrenceRecord[] = [];
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
