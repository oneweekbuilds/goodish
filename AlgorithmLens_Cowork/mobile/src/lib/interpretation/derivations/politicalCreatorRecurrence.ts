/**
 * politicalCreatorRecurrence: cross-scan presence detection for
 * creators whose posts are classified as political.
 *
 * Detects when a creator who produces political content appears
 * across multiple scans — the "@PoliticalNewsChannel first appeared
 * scan 5" pattern from the Dashboard's Tab 4 (Political Exposure)
 * worked examples.
 *
 * ============================================================
 * Data-shape note (Phase 6.4.0a discovery)
 * ============================================================
 *
 * Unlike creator-recurrence and advertiser-recurrence — which walk
 * `raw_data.posts[]` where each post carries its own `creator_handle`
 * / `creator_display_name` / `is_ad` fields — political classification
 * is NOT on the post itself. The data lives in a parallel structure:
 *
 *   raw_data.posts[]                  raw_data.analysis.feed_items[]
 *   ────────────────                  ─────────────────────────────
 *   creator_handle                    creator: { handle, name }
 *   creator_display_name              political: { is_political, ... }
 *   is_ad                             emotions: { valence }
 *   is_suggested
 *
 * The two arrays are parallel (same length, same ordering by
 * position_in_feed), but the political flag is on
 * `analysis.feed_items[i]`, not on `posts[i]`.
 *
 * The shared `aggregateAcrossScans` core defaults to reading
 * `raw_data.posts`. This wrapper passes a custom `postsExtractor` that
 * reads `raw_data.analysis.feed_items` instead, remapping each item
 * to the post shape the core expects (creator_handle,
 * creator_display_name) plus an internal `_is_political` marker the
 * predicate reads.
 *
 * The `_is_political` field is an internal convention between this
 * wrapper's extractor and its predicate. It is NOT part of the
 * public scan-row shape — readers of buildScanRow output should not
 * expect to find it. Hidden field name to discourage external use.
 *
 * Phase 6.4.0a shipped this as the third wrapper over
 * `aggregateAcrossScans` (after creator-recurrence in Phase 5.2 and
 * advertiser-recurrence in Phase 5.4). For the algorithm's full
 * behavior rules see recurrenceCore.ts.
 *
 * The public types `PoliticalCreatorRecurrenceRecord` /
 * `PoliticalCreatorRecurrenceResult` /
 * `PoliticalCreatorRecurrenceOptions` are semantic aliases of the
 * shared `RecurrenceRecord` / `RecurrenceResult` / `RecurrenceOptions`
 * for call-site readability.
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md Tab 4
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import {
  aggregateAcrossScans,
  type RecurrenceOptions,
  type RecurrenceRecord,
  type RecurrenceResult,
} from './recurrenceCore';

// Semantic aliases for call-site readability.
export type PoliticalCreatorRecurrenceRecord = RecurrenceRecord;
export type PoliticalCreatorRecurrenceResult = RecurrenceResult;
export type PoliticalCreatorRecurrenceOptions = RecurrenceOptions;

/**
 * Cross-scan political-creator recurrence. Returns one record per
 * identifiable creator who has produced political content within the
 * window, sorted by `scanCount` desc (ties broken by `totalPosts` desc).
 *
 * Posts not classified as political are excluded from aggregation
 * even when the same creator produces them. Scans containing only
 * non-political posts still count toward `windowScanCount` (the
 * scan WAS in the window; it just had no political content from any
 * identifiable creator).
 */
export function computePoliticalCreatorRecurrence(
  scans: ScanDetail[],
  platform: string,
  options: PoliticalCreatorRecurrenceOptions = {},
): PoliticalCreatorRecurrenceResult {
  return aggregateAcrossScans(scans, platform, isPoliticalPost, {
    ...options,
    postsExtractor: extractPoliticalCreatorPosts,
  });
}

/**
 * Pull political-creator-shaped items from raw_data.analysis.feed_items
 * and remap to the post shape the shared core expects. The remap:
 *   feed_items[i].creator.handle      → post.creator_handle
 *   feed_items[i].creator.name        → post.creator_display_name
 *   feed_items[i].political.is_political → post._is_political (internal)
 *
 * Other fields on the feed_item (emotions, content classification,
 * etc.) are dropped — they're not consumed by recurrence aggregation.
 *
 * Returns an empty array when raw_data.analysis or feed_items are
 * absent or malformed. The core's own defensive checks then skip
 * the scan for aggregation; it still counts toward windowScanCount.
 */
function extractPoliticalCreatorPosts(
  raw: Record<string, unknown>,
): unknown[] {
  const analysis = raw.analysis as Record<string, unknown> | undefined;
  if (!analysis || typeof analysis !== 'object') return [];
  const items = analysis.feed_items;
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (!item || typeof item !== 'object') return null;
    const i = item as Record<string, unknown>;
    const creator = (i.creator as Record<string, unknown> | undefined) ?? {};
    const political = (i.political as Record<string, unknown> | undefined) ?? {};
    return {
      creator_handle: creator.handle,
      creator_display_name: creator.name,
      _is_political: political.is_political === true,
    };
  });
}

/** Predicate: include only items where political.is_political === true,
 *  flagged inline by the extractor above. */
function isPoliticalPost(post: Record<string, unknown>): boolean {
  return post._is_political === true;
}
