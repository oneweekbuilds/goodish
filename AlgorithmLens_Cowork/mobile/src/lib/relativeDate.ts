/**
 * relativeDate: shared date-phrasing helpers used across surfaces that
 * present "how long ago" labels.
 *
 * Consumers: ConditionalLastScanRow (Home's last-scan row), Compare
 * picker, Compare result, and About this analysis. Earlier commits
 * inlined these in each consumer; with About as the fourth consumer
 * the duplication threshold is met and the logic is extracted here.
 *
 * Comparisons use local time. Calendar-day granularity, not 24h
 * elapsed: a scan at 11:59pm and a view at 12:01am the next day reads
 * as 1 day, by design.
 */

/**
 * Calendar-day distance from `earlier` to `later`, in local time.
 * Returns null if either Date is invalid (NaN getTime), so callers can
 * route the malformed-input case to their existing no-data path.
 *
 * Math.round (not floor) absorbs daylight-saving transitions: spring
 * forward gives 23h between midnights, fall back gives 25h. Both
 * resolve to 1 day.
 */
export function daysBetween(earlier: Date, later: Date): number | null {
  if (isNaN(earlier.getTime()) || isNaN(later.getTime())) return null;
  const a = new Date(
    earlier.getFullYear(),
    earlier.getMonth(),
    earlier.getDate(),
  ).getTime();
  const b = new Date(
    later.getFullYear(),
    later.getMonth(),
    later.getDate(),
  ).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Human-readable phrase for how recently a date occurred:
 *
 *   0 days    "Today"
 *   1 day     "Yesterday"
 *   2 to 6    locale-aware weekday name ("Tuesday")
 *   7+        "N days ago"
 *
 * Returns '' for invalid dates or dates in the future. Callers wanting
 * a lowercase variant (e.g. "today" inline in a sentence) should
 * `.toLowerCase()` the return value.
 *
 * `now` is exposed for tests and for callers (like
 * ConditionalLastScanRow) that already accept a now override.
 */
export function relativeDayPhrase(date: Date, now?: Date): string {
  const current = now ?? new Date();
  const days = daysBetween(date, current);
  if (days === null) return '';
  if (days < 0) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
  return `${days} days ago`;
}
