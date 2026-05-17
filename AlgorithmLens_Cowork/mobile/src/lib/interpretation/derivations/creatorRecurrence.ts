/**
 * creatorRecurrence: cross-scan creator presence detection.
 *
 * Detects when a creator appears across multiple scans in the user's
 * history — the "@MarquesBrownlee · in 5 of last 6 scans" pattern
 * referenced throughout the Dashboard design spec.
 *
 * Phase 5.4.2 refactored this to a thin wrapper over the shared
 * `aggregateAcrossScans` core. The wrapper passes a no-op post
 * predicate (`() => true`), meaning every post in raw_data.posts
 * contributes to creator aggregation. For ad-source-only recurrence,
 * see computeAdvertiserRecurrence. For the algorithm's full
 * behavior rules (case-insensitive grouping, null-handle exclusion,
 * display-name resolution, malformed-scan tolerance), see the JSDoc
 * on recurrenceCore.ts — that file is the single source of truth.
 *
 * The public types `CreatorRecurrenceRecord` / `CreatorRecurrenceResult`
 * / `CreatorRecurrenceOptions` are semantic aliases of the shared
 * `RecurrenceRecord` / `RecurrenceResult` / `RecurrenceOptions` so
 * call-site readability is preserved at zero runtime cost.
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md,
 *            mobile/audits/2x-dashboard-design/decisions.md
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import {
  aggregateAcrossScans,
  type RecurrenceOptions,
  type RecurrenceRecord,
  type RecurrenceResult,
} from './recurrenceCore';

// Semantic aliases. Same shape as the shared types, semantically
// scoped to creator-recurrence for readability at call sites that
// import these types directly.
export type CreatorRecurrenceRecord = RecurrenceRecord;
export type CreatorRecurrenceResult = RecurrenceResult;
export type CreatorRecurrenceOptions = RecurrenceOptions;

/**
 * Cross-scan creator recurrence. Returns one record per identifiable
 * creator within the window, sorted by `scanCount` desc (ties broken
 * by `totalPosts` desc). The result's `windowScanCount` is the
 * denominator for "in N of M scans" template copy.
 */
export function computeCreatorRecurrence(
  scans: ScanDetail[],
  platform: string,
  options: CreatorRecurrenceOptions = {},
): CreatorRecurrenceResult {
  return aggregateAcrossScans(scans, platform, includeAllPosts, options);
}

/** No-op predicate: every post contributes to creator aggregation. */
function includeAllPosts(): boolean {
  return true;
}
