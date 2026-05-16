/**
 * rollingAverage: per-platform, per-metric running average.
 *
 * Takes a scan history and computes the arithmetic mean of a single
 * metric over the most-recent N scans on a given platform, excluding
 * the active scan (when its ID is supplied). Returns null when there's
 * insufficient history (fewer than 2 scans in the window).
 *
 * Each metric has a per-scan extraction helper below. Extractors return
 * null when the scan lacks the data the metric requires; the main
 * function tolerates this and only returns null itself when extraction
 * fails on more than half the scans in the window (the average would
 * be too noisy to support an interpretation).
 *
 * Reference: mobile/audits/2x-interpretation-engine-scoping/decisions.md
 */

import type { ScanDetail } from '../../../hooks/useDashboard';
import type { MetricKey } from '../interpretation-types';

const DEFAULT_WINDOW_SIZE = 5;
const MIN_VALID_SCANS = 2;

export interface RollingAverageOptions {
  windowSize?: number;
  excludeScanId?: string;
}

export function computeRollingAverage(
  scans: ScanDetail[],
  platform: string,
  metric: MetricKey,
  options: RollingAverageOptions = {},
): number | null {
  const { windowSize = DEFAULT_WINDOW_SIZE, excludeScanId } = options;

  if (!Array.isArray(scans) || scans.length === 0) return null;

  // Filter by platform (case-insensitive), exclude active scan,
  // sort by created_at desc (most recent first), take top windowSize.
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
      // Desc by date. Invalid dates sort after valid dates.
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

  if (filtered.length < MIN_VALID_SCANS) return null;

  // Extract metric values. Track failures so we can bail when most
  // of the window has missing data.
  const values: number[] = [];
  let failures = 0;
  for (const scan of filtered) {
    const value = extractMetric(scan, metric);
    if (value === null) {
      failures += 1;
    } else {
      values.push(value);
    }
  }

  // More than half missing means the remaining average would be too
  // noisy to trust. Also bail if fewer than MIN_VALID_SCANS succeeded.
  if (failures > filtered.length / 2) return null;
  if (values.length < MIN_VALID_SCANS) return null;

  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / values.length;
  return Math.round(mean * 10) / 10;
}

// ============================================
// Per-metric extraction helpers
// ============================================

function extractMetric(scan: ScanDetail, metric: MetricKey): number | null {
  try {
    switch (metric) {
      case 'ad_pct':
        return extractAdPct(scan);
      case 'suggested_pct':
        return extractSuggestedPct(scan);
      case 'political_pct':
        return extractPoliticalPct(scan);
      case 'top_creator_share':
        return extractTopCreatorShare(scan);
      case 'tone_positive_pct':
        return extractTonePct(scan, 'POSITIVE');
      case 'tone_neutral_pct':
        return extractTonePct(scan, 'NEUTRAL');
      case 'tone_negative_pct':
        return extractTonePct(scan, 'NEGATIVE');
      default: {
        // Exhaustive switch guard. If MetricKey grows without a handler
        // here, the assignment to `never` becomes a compile error.
        const _exhaustive: never = metric;
        void _exhaustive;
        return null;
      }
    }
  } catch {
    // Defensive: malformed raw_data should never crash the derivation.
    return null;
  }
}

function extractAdPct(scan: ScanDetail): number | null {
  return typeof scan.ad_percentage === 'number' && Number.isFinite(scan.ad_percentage)
    ? scan.ad_percentage
    : null;
}

function extractSuggestedPct(scan: ScanDetail): number | null {
  return typeof scan.suggested_percentage === 'number' &&
    Number.isFinite(scan.suggested_percentage)
    ? scan.suggested_percentage
    : null;
}

function extractPoliticalPct(scan: ScanDetail): number | null {
  const raw = scan.raw_data;
  if (!raw || typeof raw !== 'object') return null;

  const analysis = (raw as Record<string, unknown>).analysis;
  if (!analysis || typeof analysis !== 'object') return null;

  // Prefer the pre-computed summary if present (matches what
  // computeDashboardData already produces).
  const summary = (analysis as Record<string, unknown>).political_content_summary;
  if (summary && typeof summary === 'object') {
    const pct = (summary as Record<string, unknown>).political_percentage;
    if (typeof pct === 'number' && Number.isFinite(pct)) return pct;
  }

  // Fall back to per-item derivation when the summary is absent.
  // Denominator is total feed_items (matches the existing dashboard's
  // political_pct = political_count / total_analyzed convention).
  const feedItems = (analysis as Record<string, unknown>).feed_items;
  if (!Array.isArray(feedItems) || feedItems.length === 0) return null;

  let politicalCount = 0;
  for (const item of feedItems) {
    if (!item || typeof item !== 'object') continue;
    const political = (item as Record<string, unknown>).political;
    if (political && typeof political === 'object') {
      if ((political as Record<string, unknown>).is_political === true) {
        politicalCount += 1;
      }
    }
  }

  return (politicalCount / feedItems.length) * 100;
}

function extractTopCreatorShare(scan: ScanDetail): number | null {
  const raw = scan.raw_data;
  if (!raw || typeof raw !== 'object') return null;

  const posts = (raw as Record<string, unknown>).posts;
  if (!Array.isArray(posts) || posts.length === 0) return null;

  // Group by handle, falling back to display name (mirrors the
  // existing computeDashboardData.countByCreator pattern). Posts
  // without any identifiable creator are excluded from the
  // counts map so an "Unknown" bucket can't masquerade as the
  // top source.
  const counts: Record<string, number> = {};
  for (const p of posts) {
    if (!p || typeof p !== 'object') continue;
    const post = p as Record<string, unknown>;
    const handleField = post.creator_handle;
    const displayField = post.creator_display_name;
    const handle =
      (typeof handleField === 'string' && handleField.length > 0 && handleField) ||
      (typeof displayField === 'string' && displayField.length > 0 && displayField) ||
      null;
    if (!handle) continue;
    counts[handle] = (counts[handle] || 0) + 1;
  }

  const values = Object.values(counts);
  if (values.length === 0) return null;

  const max = Math.max(...values);

  // Denominator is total posts (not identified-only), since the metric
  // describes "share of feed from your top source" and unidentified
  // posts are still part of the feed.
  return (max / posts.length) * 100;
}

function extractTonePct(
  scan: ScanDetail,
  valence: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
): number | null {
  const raw = scan.raw_data;
  if (!raw || typeof raw !== 'object') return null;

  const analysis = (raw as Record<string, unknown>).analysis;
  if (!analysis || typeof analysis !== 'object') return null;

  const feedItems = (analysis as Record<string, unknown>).feed_items;
  if (!Array.isArray(feedItems) || feedItems.length === 0) return null;

  // Denominator excludes MIXED and items with missing valence. Mirrors
  // the DashboardData.toneAnalysis.knownValenceTotal convention. MIXED
  // is a valid Gemini output value but doesn't belong in any single
  // bucket; folding it into one would distort the breakdown.
  let target = 0;
  let knownTotal = 0;
  for (const item of feedItems) {
    if (!item || typeof item !== 'object') continue;
    const emotions = (item as Record<string, unknown>).emotions;
    if (!emotions || typeof emotions !== 'object') continue;
    const v = (emotions as Record<string, unknown>).valence;
    if (v === 'POSITIVE' || v === 'NEUTRAL' || v === 'NEGATIVE') {
      knownTotal += 1;
      if (v === valence) target += 1;
    }
  }

  if (knownTotal === 0) return null;
  return (target / knownTotal) * 100;
}
