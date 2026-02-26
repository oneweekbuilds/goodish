/**
 * Politics Metrics Aggregators
 * Political content and leaning detection
 */

import {
  getAggregates,
  getFeedItems,
  normalizeCreatorId,
  formatDateLabel,
} from './aggregatorUtils';

// ============================================
// CONSTANTS
// ============================================

// Conservative left-leaning signals (explicit only)
const LEFT_SIGNALS = [
  'progressive', 'liberal', 'democrat', 'left-wing', 'socialism', 'leftist',
  'bernie', 'aoc', 'green new deal', 'defund', 'blm', 'black lives matter',
];

// Conservative right-leaning signals (explicit only)
const RIGHT_SIGNALS = [
  'conservative', 'republican', 'right-wing', 'maga', 'trump', 'gop',
  'patriot', 'second amendment', '2a', 'pro-life', 'america first',
];

// Neutral political signals
const NEUTRAL_SIGNALS = [
  'bipartisan', 'moderate', 'centrist', 'independent', 'both sides',
];

// ============================================
// CORE AGGREGATION FUNCTIONS
// ============================================

/**
 * Aggregate political content data across scans.
 *
 * Returns:
 * - totalPolitical: count of political posts
 * - totalPosts: total posts analyzed
 * - politicalPercentageOverall: weighted average
 * - byPlatform: political stats by platform
 * - byDate: political percentages over time
 * - byCreator: creators who post political content
 * - scansUsed: number of scans with political data
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Aggregated political data
 */
export function aggregatePolitics(scans, scanDetails) {
  const result = {
    totalPolitical: 0,
    totalPosts: 0,
    politicalPercentageOverall: 0,
    byPlatform: {},
    byDate: [],
    byCreator: {},  // creatorId -> { total, political }
    scansUsed: 0,
    scansWithData: [],
  };

  if (!scans || scans.length === 0) {
    return result;
  }

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const aggregates = getAggregates(detail);
    const feedItems = getFeedItems(detail);
    const platform = (scan.platform || 'unknown').toLowerCase();

    // Get political summary from aggregates
    const politicalSummary = aggregates?.political_content_summary;
    const politicalPct = politicalSummary?.political_percentage;

    // Only count scans that have political classification data
    if (typeof politicalPct !== 'number') continue;

    const totalItems = aggregates?.total_feed_items || feedItems.length || 0;
    const politicalCount = politicalSummary?.political_items || 0;

    if (totalItems === 0) continue;

    result.scansUsed++;
    result.scansWithData.push(scan.id);
    result.totalPosts += totalItems;
    result.totalPolitical += politicalCount;

    // Platform breakdown
    if (!result.byPlatform[platform]) {
      result.byPlatform[platform] = { totalPolitical: 0, totalPosts: 0, politicalPercentage: 0 };
    }
    result.byPlatform[platform].totalPosts += totalItems;
    result.byPlatform[platform].totalPolitical += politicalCount;

    // Time series
    result.byDate.push({
      date: scan.created_at,
      label: formatDateLabel(scan.created_at),
      value: Math.round(politicalPct * 100),
      platform,
      scanId: scan.id,
    });

    // Creator-level political attribution
    for (const item of feedItems) {
      const creatorId = normalizeCreatorId(item.creator || item.account);
      if (!creatorId) continue;

      if (!result.byCreator[creatorId]) {
        result.byCreator[creatorId] = { total: 0, political: 0, displayName: item.creator?.name || item.creator?.handle || creatorId };
      }
      result.byCreator[creatorId].total++;
      if (item.political?.is_political) {
        result.byCreator[creatorId].political++;
      }
    }
  }

  // Calculate overall percentage
  if (result.totalPosts > 0) {
    result.politicalPercentageOverall = Math.round((result.totalPolitical / result.totalPosts) * 100);
  }

  // Calculate per-platform percentages
  for (const platform of Object.keys(result.byPlatform)) {
    const p = result.byPlatform[platform];
    p.politicalPercentage = p.totalPosts > 0 ? Math.round((p.totalPolitical / p.totalPosts) * 100) : 0;
  }

  result.byDate.sort((a, b) => new Date(a.date) - new Date(b.date));

  return result;
}

/**
 * Classify political leaning of a single item using heuristic keywords.
 * Very conservative - defaults to 'unknown' unless explicit signals.
 *
 * @param {Object} item - Feed item
 * @returns {Object} { bucket: 'left'|'neutral'|'right'|'unknown', reasons: [], confidence: 'LOW' }
 */
export function classifyPoliticalLeaningHeuristic(item) {
  const text = (item.caption || item.text || item.content || '').toLowerCase();

  // Check for explicit signals
  let leftScore = 0;
  let rightScore = 0;
  let neutralScore = 0;
  const reasons = [];

  for (const signal of LEFT_SIGNALS) {
    if (text.includes(signal)) {
      leftScore++;
      reasons.push(`contains "${signal}"`);
    }
  }

  for (const signal of RIGHT_SIGNALS) {
    if (text.includes(signal)) {
      rightScore++;
      reasons.push(`contains "${signal}"`);
    }
  }

  for (const signal of NEUTRAL_SIGNALS) {
    if (text.includes(signal)) {
      neutralScore++;
      reasons.push(`contains "${signal}"`);
    }
  }

  // Determine bucket
  let bucket = 'unknown';

  if (neutralScore > 0 && neutralScore >= leftScore && neutralScore >= rightScore) {
    bucket = 'neutral';
  } else if (leftScore > rightScore && leftScore > 0) {
    bucket = 'left';
  } else if (rightScore > leftScore && rightScore > 0) {
    bucket = 'right';
  } else if (leftScore > 0 && rightScore > 0) {
    // Mixed signals -> neutral
    bucket = 'neutral';
    reasons.push('mixed signals');
  }

  return {
    bucket,
    reasons: reasons.slice(0, 3),
    confidence: 'LOW',
  };
}

/**
 * Aggregate political leaning classification across scans.
 * Only classifies POLITICAL content (items marked as political).
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Political leaning breakdown
 */
export function aggregatePoliticalLeaning(scans, scanDetails) {
  const buckets = { left: 0, neutral: 0, right: 0, unknown: 0 };
  let totalPolitical = 0;
  let scansUsed = 0;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    let scanHasData = false;

    for (const item of feedItems) {
      // Only classify items marked as political
      if (!item.political?.is_political) continue;

      scanHasData = true;
      totalPolitical++;

      const result = classifyPoliticalLeaningHeuristic(item);
      buckets[result.bucket]++;
    }

    if (scanHasData) {
      scansUsed++;
    }
  }

  // Calculate percentages
  const percentages = {};
  for (const [bucket, count] of Object.entries(buckets)) {
    percentages[bucket] = totalPolitical > 0 ? Math.round((count / totalPolitical) * 100) : 0;
  }

  return {
    buckets,
    percentages,
    totalPolitical,
    scansUsed,
    hasData: totalPolitical >= 5, // Need at least 5 political items
    confidence: totalPolitical >= 10 ? 'LOW' : 'VERY_LOW',
    disclaimer: 'These are rough estimates based on keyword patterns, not facts about content or creators.',
  };
}
