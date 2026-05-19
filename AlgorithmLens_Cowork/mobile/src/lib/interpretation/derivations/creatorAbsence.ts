/**
 * creatorAbsence: detect followed creators with meaningful gaps since
 * last appearance.
 *
 * Two cooperating derivations:
 *
 *   1. computeFollowedCreatorRecurrence — 4th wrapper over
 *      aggregateAcrossScans. The post predicate is
 *      `is_suggested === false` (creators the user follows, as
 *      opposed to algorithm-recommended sources). Returns standard
 *      RecurrenceResult enriched with the lastSeen fields the Phase
 *      6.5.0 core extension added.
 *
 *   2. computeCreatorAbsence — pure post-processor over any
 *      RecurrenceResult. Takes the active scan's `created_at` as a
 *      temporal anchor and computes `daysSinceLastSeen` for each
 *      record. The two derivations are kept separate so absence
 *      semantics (temporal-anchor overlay) stay out of the
 *      recurrence wrapper (presence aggregation only).
 *
 * Design-canonical use case (decisions.md L208):
 *   "Your followed creators have gone quiet, so suggestions are
 *    filling the gap. @ColinAndSamir, your top followed creator,
 *    hasn't posted in 8 days."
 *
 * The template that lands this verdict calls:
 *   const recurrence = computeFollowedCreatorRecurrence(scans, platform);
 *   const absence = computeCreatorAbsence(recurrence, activeScan.created_at);
 *   const topAbsent = absence.records[0]; // longest-absence, sort default
 *
 * ============================================================
 * Algorithm decisions
 * ============================================================
 *
 *   1. Follow predicate: `is_suggested === false`. Posts with
 *      `is_suggested === true` (suggested) and `is_suggested === null`
 *      (unknown — PIPELINE FIX H-03 documents this) are excluded.
 *      A creator with mixed posts (some followed, some suggested)
 *      contributes only their followed posts to the count.
 *
 *   2. daysSinceLastSeen uses floor division on the millisecond
 *      delta: `Math.floor((activeMs - lastSeenMs) / DAY_MS)`. Editorial
 *      semantics: "hasn't posted in 8 days" reads as "at least 8 ×
 *      24 = 192 hours since last appearance." Sub-24h gaps round to 0.
 *
 *   3. Date-parse failure tolerance: if either activeScanCreatedAt
 *      or record.lastSeenAt fails Date.parse, daysSinceLastSeen is
 *      null. The record is still emitted (templates can decide to
 *      skip null entries themselves). null-handling keeps the
 *      derivation defensive without losing the record entirely.
 *
 *   4. Default ranking: daysSinceLastSeen desc (longest absence
 *      first). Null daysSinceLastSeen sorts last. Templates can
 *      re-rank for other angles ("top followed creator" by
 *      totalPosts → look up that handle's absence record).
 *
 *   5. `minDays` option filters out records below the threshold.
 *      Templates that only care about meaningful absences (e.g., >= 5
 *      days) pass `minDays: 5`. Records with null daysSinceLastSeen
 *      pass through regardless of minDays — null is a parse failure,
 *      not a small absence; surfacing it lets templates decide.
 *
 * Reference: mobile/audits/2x-dashboard-design/decisions.md Tab 6
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import {
  aggregateAcrossScans,
  type RecurrenceOptions,
  type RecurrenceRecord,
  type RecurrenceResult,
} from './recurrenceCore';

// Semantic aliases for call-site readability.
export type FollowedCreatorRecurrenceRecord = RecurrenceRecord;
export type FollowedCreatorRecurrenceResult = RecurrenceResult;
export type FollowedCreatorRecurrenceOptions = RecurrenceOptions;

/**
 * Cross-scan followed-creator recurrence. Returns one record per
 * creator with at least one `is_suggested === false` post in the
 * window, sorted by `scanCount` desc (ties broken by `totalPosts`
 * desc) per the shared core's contract.
 *
 * Note on `excludeScanId`: templates that want to know which followed
 * creators appear in the active scan vs only in history should NOT
 * pass excludeScanId. computeCreatorAbsence consumes the result's
 * lastSeen fields, which need the active scan included so that
 * "present in the active scan" can be detected as daysSinceLastSeen = 0.
 */
export function computeFollowedCreatorRecurrence(
  scans: ScanDetail[],
  platform: string,
  options: FollowedCreatorRecurrenceOptions = {},
): FollowedCreatorRecurrenceResult {
  return aggregateAcrossScans(scans, platform, isFollowedPost, options);
}

/** Predicate: include only posts where the user follows the source.
 *  is_suggested === true (suggested) and is_suggested === null
 *  (unknown subscription state) are both excluded. */
function isFollowedPost(post: Record<string, unknown>): boolean {
  return post.is_suggested === false;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * An absence record — a recurrence record enriched with the temporal
 * gap between the active scan and the entity's most recent appearance.
 *
 * daysSinceLastSeen semantics:
 *   - 0 → entity is in the active scan (or another scan with the
 *     same calendar-day timestamp).
 *   - >= 1 → entity hasn't appeared in at least N × 24 hours.
 *   - null → either activeScanCreatedAt or record.lastSeenAt failed
 *     Date.parse. Templates should treat null as "absence unknown"
 *     and decide whether to skip the record.
 */
export interface AbsenceRecord extends RecurrenceRecord {
  /** Floor-divided days between activeScanCreatedAt and
   *  record.lastSeenAt. See file header for full semantics. */
  daysSinceLastSeen: number | null;
}

export interface CreatorAbsenceResult {
  /** Records sorted by daysSinceLastSeen desc (longest absence first).
   *  Null daysSinceLastSeen sorts last. */
  records: AbsenceRecord[];
}

export interface CreatorAbsenceOptions {
  /** Filter records whose daysSinceLastSeen falls below this
   *  threshold. Records with null daysSinceLastSeen pass through
   *  regardless. Default 0 (include all). */
  minDays?: number;
}

/**
 * Compute per-record absence overlay on top of a recurrence result.
 *
 * Pure post-processor. Does not re-walk scans. Reads only:
 *   - recurrence.records (for lastSeenAt and the rest of the record)
 *   - activeScanCreatedAt (the temporal anchor)
 *
 * Templates that want absence for a specific handle should pass the
 * full recurrence in and pick the matching record from
 * `result.records` — sort is by daysSinceLastSeen desc, so a per-
 * handle .find() is the right access pattern, not result.records[0].
 */
export function computeCreatorAbsence(
  recurrence: RecurrenceResult,
  activeScanCreatedAt: string,
  options: CreatorAbsenceOptions = {},
): CreatorAbsenceResult {
  const { minDays = 0 } = options;
  const activeMs = Date.parse(activeScanCreatedAt);
  const activeMsValid = Number.isFinite(activeMs);

  const enriched: AbsenceRecord[] = [];
  for (const record of recurrence.records) {
    const daysSinceLastSeen = computeDaysSince(
      activeMsValid ? activeMs : null,
      record.lastSeenAt,
    );

    // Apply minDays filter — null passes through (see header decision #5).
    if (
      daysSinceLastSeen !== null &&
      daysSinceLastSeen < minDays
    ) {
      continue;
    }

    enriched.push({ ...record, daysSinceLastSeen });
  }

  // Sort by daysSinceLastSeen desc, nulls last. The null-last rule
  // makes templates' .records[0] reliably the longest known absence.
  enriched.sort((a, b) => {
    const aNull = a.daysSinceLastSeen === null;
    const bNull = b.daysSinceLastSeen === null;
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    return b.daysSinceLastSeen! - a.daysSinceLastSeen!;
  });

  return { records: enriched };
}

/**
 * Floor-divided day delta. Returns null when either input is
 * unparseable.
 */
function computeDaysSince(
  activeMs: number | null,
  lastSeenAt: string,
): number | null {
  if (activeMs === null) return null;
  const lastMs = Date.parse(lastSeenAt);
  if (!Number.isFinite(lastMs)) return null;
  // Defensive: clamp negative deltas (lastSeen in the future relative
  // to active scan) to 0 rather than emitting a negative. Production
  // shouldn't produce this — the recurrence wrapper sorts desc by
  // date so lastSeenAt <= activeScanCreatedAt by construction when
  // the active scan is in the input — but a malformed timestamp or
  // an unusual caller could trip it. 0 is the same value as "in the
  // active scan today," editorially safe.
  const delta = activeMs - lastMs;
  if (delta < 0) return 0;
  return Math.floor(delta / DAY_MS);
}
