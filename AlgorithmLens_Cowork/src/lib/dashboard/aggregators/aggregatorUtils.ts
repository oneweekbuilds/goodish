/**
 * Aggregator Utilities - Shared helper functions and constants
 * Used across all aggregator modules
 */

import type { ScanResult, ScanListItem, FeedItem } from '../../../types/api';

// ============================================
// CONSTANTS
// ============================================

export const CONFUSING_TOPICS: string[] = ['unknown', 'general', 'uncategorized', 'other', 'misc', 'miscellaneous', 'none', 'n/a', ''];
export const UNCLASSIFIED_TOPIC = "Other / couldn't categorize";

// ============================================
// TYPE DEFINITIONS
// ============================================

/** A scan detail object that may be nested in different shapes */
export type ScanDetail = ScanResult & {
  result?: ScanResult;
  scan?: ScanResult;
};

/** Map of scan ID to scan detail */
export type ScanDetailsMap = Record<string, ScanDetail>;

/** Creator info from a feed item */
export interface CreatorInfo {
  handle?: string;
  name?: string;
  account_handle?: string;
  account_display_name?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely extract data from potentially nested scan detail objects.
 */
export function getScanData(scanDetail: ScanDetail | null | undefined): ScanResult | null {
  if (!scanDetail) return null;
  return scanDetail.result || scanDetail.scan || scanDetail;
}

/**
 * Extract aggregates from a scan detail
 */
export function getAggregates(scanDetail: ScanDetail | null | undefined): ScanResult['aggregates'] | null {
  const data = getScanData(scanDetail);
  return data?.aggregates || null;
}

/**
 * Extract feed items from a scan detail
 */
export function getFeedItems(scanDetail: ScanDetail | null | undefined): FeedItem[] {
  const data = getScanData(scanDetail);
  return (data?.feed_items as FeedItem[]) || [];
}

/**
 * Round percentages and adjust to ensure they sum to exactly 100
 */
export function roundPercentagesToSum100(rawPercentages: number[], counts: number[]): number[] {
  if (!Array.isArray(rawPercentages) || rawPercentages.length === 0) return [];

  const rounded = rawPercentages.map(p => Math.round(p));
  const sum = rounded.reduce((a, b) => a + b, 0);

  if (sum === 100) {
    return rounded;
  }

  let largestIndex = 0;
  let largestCount = counts[0];
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] > largestCount) {
      largestCount = counts[i];
      largestIndex = i;
    }
  }

  const diff = 100 - sum;
  rounded[largestIndex] += diff;

  return rounded;
}

/**
 * Extract scan metadata
 */
export function getScanMeta(scanDetail: ScanDetail | null | undefined): Record<string, unknown> {
  const data = getScanData(scanDetail);
  return (data as unknown as Record<string, unknown>)?.scan_metadata as Record<string, unknown> || {};
}

/**
 * Normalize creator identifier for deduplication.
 */
export function normalizeCreatorId(creator: CreatorInfo | null | undefined): string | null {
  if (!creator) return null;
  const id = creator.handle || creator.name || creator.account_handle || creator.account_display_name;
  return id ? id.toLowerCase().trim() : null;
}

/**
 * Normalize topic label for aggregation.
 */
export function normalizeTopicLabel(label: string | null | undefined): string {
  if (!label) return UNCLASSIFIED_TOPIC;
  const lower = label.toLowerCase().trim();
  if (CONFUSING_TOPICS.includes(lower)) {
    return UNCLASSIFIED_TOPIC;
  }
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

/**
 * Generate a unique key for a post to avoid duplicate counting.
 */
export function generatePostKey(
  item: FeedItem & { creator?: CreatorInfo; account?: CreatorInfo },
  scanId: string,
  platform: string
): string {
  const creator = normalizeCreatorId(item.creator || item.account);
  const position = (item as unknown as Record<string, unknown>).position_in_feed || 0;
  return `${platform}:${creator}:${position}:${scanId}`;
}

/**
 * Format a date to a short label for charts.
 */
export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
