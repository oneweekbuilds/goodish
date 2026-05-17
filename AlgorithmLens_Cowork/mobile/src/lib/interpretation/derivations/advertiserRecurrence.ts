/**
 * advertiserRecurrence: cross-scan ad-source presence detection.
 *
 * Detects when one advertiser (the creator of an `is_ad: true` post)
 * appears across multiple scans — the "Recurring advertiser:
 * tech-retail brand · 4 of 6 scans" pattern from the Dashboard's
 * Tab 3 (Ads & Promotions) worked examples.
 *
 * Identification approach: ad posts carry the same `creator_handle`
 * and `creator_display_name` fields as regular posts. There's no
 * separate brand identifier on the post; `ad_label_text` is the
 * platform's UI label (usually "Ad" / "Sponsored" / "Promoted"),
 * NOT an advertiser identity. Brand-category rollup ("tech-retail
 * brand" grouping multiple specific advertisers) is a Phase 6+
 * design aspiration that requires classification we don't have.
 * For now, individual advertisers are tracked via creator_handle
 * exactly like creators in Phase 5.2.
 *
 * Phase 5.4.2 shipped this as a thin wrapper over
 * `aggregateAcrossScans` — the same algorithm `computeCreatorRecurrence`
 * uses, with a post-filter restricting aggregation to `is_ad: true`
 * posts. For the algorithm's full behavior rules see recurrenceCore.ts.
 *
 * The public types `AdvertiserRecurrenceRecord` /
 * `AdvertiserRecurrenceResult` / `AdvertiserRecurrenceOptions` are
 * semantic aliases of the shared `RecurrenceRecord` /
 * `RecurrenceResult` / `RecurrenceOptions` for call-site readability.
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md Tab 3
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import {
  aggregateAcrossScans,
  type RecurrenceOptions,
  type RecurrenceRecord,
  type RecurrenceResult,
} from './recurrenceCore';

// Semantic aliases for call-site readability.
export type AdvertiserRecurrenceRecord = RecurrenceRecord;
export type AdvertiserRecurrenceResult = RecurrenceResult;
export type AdvertiserRecurrenceOptions = RecurrenceOptions;

/**
 * Cross-scan advertiser recurrence. Returns one record per
 * identifiable advertiser (creator of ad posts) within the window,
 * sorted by `scanCount` desc (ties broken by `totalPosts` desc).
 *
 * Non-ad posts are excluded from aggregation; they do not contribute
 * to any advertiser's totalPosts. Scans containing only non-ad posts
 * still count toward `windowScanCount` (the scan WAS in the window;
 * it just had no ads).
 */
export function computeAdvertiserRecurrence(
  scans: ScanDetail[],
  platform: string,
  options: AdvertiserRecurrenceOptions = {},
): AdvertiserRecurrenceResult {
  return aggregateAcrossScans(scans, platform, isAdPost, options);
}

/** Predicate: include only posts marked is_ad === true. */
function isAdPost(post: Record<string, unknown>): boolean {
  return post.is_ad === true;
}
