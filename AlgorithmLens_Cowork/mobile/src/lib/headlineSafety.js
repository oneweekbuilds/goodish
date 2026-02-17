import { UNCLASSIFIED_TOPIC } from './scanAggregator';

// Slice 6 rule: These labels may appear in evidence/details, but never in
// hero headlines or top-line takeaways.
const EXCLUDED_HEADLINE_LABELS = new Set([
  'unclassified',
  'other',
  // Canonical unclassified label used by the topic aggregator
  String(UNCLASSIFIED_TOPIC || '').toLowerCase(),
  // Historical / variant spellings
  "other / couldn\'t categorize",
  "other / couldn\'t categorize",
]);

export const FALLBACK_MIX_TOPICS_HEADLINE = 'We detected a mix of topics in this scan';
export const UNCATEGORIZED_NOTE = "Some posts couldn\'t be categorized yet.";

export function isHeadlineExcludedLabel(label) {
  if (label == null) return true;
  const normalized = String(label).trim().toLowerCase();
  if (!normalized) return true;
  return EXCLUDED_HEADLINE_LABELS.has(normalized);
}

/**
 * Returns the first N headline-safe labels (excluding Unclassified/Other).
 *
 * @param {Array} items
 * @param {Object} opts
 * @param {(item:any)=>string} opts.getLabel
 * @param {number} opts.limit
 * @returns {{ labels: string[], hadExcluded: boolean }}
 */
export function pickHeadlineSafeLabels(items, { getLabel, limit = 2 } = {}) {
  const arr = Array.isArray(items) ? items : [];
  const labels = [];
  let hadExcluded = false;

  for (const item of arr) {
    const label = getLabel ? getLabel(item) : item;
    if (isHeadlineExcludedLabel(label)) {
      // Only count as excluded if it was a non-empty label-ish value.
      if (label != null && String(label).trim().length > 0) hadExcluded = true;
      continue;
    }
    labels.push(String(label));
    if (labels.length >= limit) break;
  }

  return { labels, hadExcluded };
}

