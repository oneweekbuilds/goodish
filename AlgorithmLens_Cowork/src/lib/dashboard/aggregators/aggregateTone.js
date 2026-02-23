/**
 * Tone Metrics Aggregators
 * Emotional and valence distribution
 */

import {
  getAggregates,
  getFeedItems,
  normalizeCreatorId,
  formatDateLabel,
} from './aggregatorUtils';

/**
 * Aggregate emotional/wellbeing data across ALL scans.
 *
 * Returns:
 * - valenceDistribution: POSITIVE/NEUTRAL/NEGATIVE/MIXED totals
 * - valencePercentages: percentages for each valence
 * - dominantValence: most common valence
 * - intensity: 'light' | 'neutral' | 'heavy' based on negative content
 * - byDate: valence breakdown over time
 * - scansUsed: number of scans with emotion data
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Aggregated emotions data
 */
export function aggregateEmotions(scans, scanDetails) {
  const result = {
    valenceDistribution: { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0, MIXED: 0 },
    valencePercentages: { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0, MIXED: 0 },
    dominantValence: null,
    intensity: 'neutral',
    byDate: [],
    scansUsed: 0,
    scansWithData: [],
    totalPostsAnalyzed: 0,
  };

  if (!scans || scans.length === 0) {
    return result;
  }

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const aggregates = getAggregates(detail);
    const wellbeing = aggregates?.wellbeing_summary;
    const valence = wellbeing?.valence_distribution;

    // Validate valence is a proper object with expected keys
    if (!valence || typeof valence !== 'object' || Array.isArray(valence)) continue;
    if (!('POSITIVE' in valence || 'NEUTRAL' in valence || 'NEGATIVE' in valence)) continue;

    const pos = valence.POSITIVE || 0;
    const neut = valence.NEUTRAL || 0;
    const neg = valence.NEGATIVE || 0;
    const mixed = valence.MIXED || 0;
    const total = pos + neut + neg + mixed;

    if (total === 0) continue;

    result.scansUsed++;
    result.scansWithData.push(scan.id);
    result.totalPostsAnalyzed += total;

    result.valenceDistribution.POSITIVE += pos;
    result.valenceDistribution.NEUTRAL += neut;
    result.valenceDistribution.NEGATIVE += neg;
    result.valenceDistribution.MIXED += mixed;

    // Time series - store scan-level percentages
    const platform = (scan.platform || 'unknown').toLowerCase();
    result.byDate.push({
      date: scan.created_at,
      label: formatDateLabel(scan.created_at),
      positivePercent: Math.round((pos / total) * 100),
      neutralPercent: Math.round((neut / total) * 100),
      negativePercent: Math.round((neg / total) * 100),
      platform,
      scanId: scan.id,
    });
  }

  // Calculate overall percentages
  const total = result.totalPostsAnalyzed;
  if (total > 0) {
    result.valencePercentages.POSITIVE = Math.round((result.valenceDistribution.POSITIVE / total) * 100);
    result.valencePercentages.NEUTRAL = Math.round((result.valenceDistribution.NEUTRAL / total) * 100);
    result.valencePercentages.NEGATIVE = Math.round((result.valenceDistribution.NEGATIVE / total) * 100);
    result.valencePercentages.MIXED = Math.round((result.valenceDistribution.MIXED / total) * 100);

    // Determine dominant valence
    const entries = Object.entries(result.valenceDistribution);
    entries.sort((a, b) => b[1] - a[1]);
    result.dominantValence = entries[0][0];

    // Determine intensity based on negative content
    const negativeRatio = result.valencePercentages.NEGATIVE;
    if (negativeRatio > 40) {
      result.intensity = 'heavy';
    } else if (negativeRatio > 20) {
      result.intensity = 'neutral';
    } else {
      result.intensity = 'light';
    }
  }

  result.byDate.sort((a, b) => new Date(a.date) - new Date(b.date));

  return result;
}

/**
 * Aggregate creator-tone relationships across all scans.
 * Only works if feed items have per-item emotion/valence data.
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} { creatorTones, topCreatorsByTone, scansUsed, hasPerItemData }
 */
export function aggregateCreatorTones(scans, scanDetails) {
  const creatorTones = {}; // creatorId -> { valences: { POSITIVE: n, NEGATIVE: n, ... }, displayName, total }
  let totalPairs = 0;
  let scansUsed = 0;
  let hasPerItemData = false;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    let scanHasData = false;

    for (const item of feedItems) {
      const creatorId = normalizeCreatorId(item.creator || item.account);
      // Check for per-item emotion data in various possible fields
      const valence = item.valence || item.emotion?.valence || item.wellbeing?.valence || item.sentiment;

      if (!creatorId || !valence) continue;

      const normalizedValence = valence.toUpperCase();
      if (!['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'].includes(normalizedValence)) continue;

      scanHasData = true;
      hasPerItemData = true;
      totalPairs++;

      if (!creatorTones[creatorId]) {
        creatorTones[creatorId] = {
          displayName: item.creator?.name || item.creator?.handle || creatorId,
          valences: { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, MIXED: 0 },
          total: 0,
        };
      }
      creatorTones[creatorId].valences[normalizedValence]++;
      creatorTones[creatorId].total++;
    }

    if (scanHasData) {
      scansUsed++;
    }
  }

  // If no per-item data, return early
  if (!hasPerItemData) {
    return {
      creatorTones: {},
      topCreatorsByTone: [],
      scansUsed: 0,
      totalPairs: 0,
      hasPerItemData: false,
      missingField: 'per-item valence/emotion field on feed_items',
    };
  }

  // Build creators ranked by negative content percentage
  const creatorsByNegative = Object.entries(creatorTones)
    .map(([id, data]) => ({
      creatorId: id,
      displayName: data.displayName,
      negativePercent: data.total > 0 ? Math.round((data.valences.NEGATIVE / data.total) * 100) : 0,
      positivePercent: data.total > 0 ? Math.round((data.valences.POSITIVE / data.total) * 100) : 0,
      totalPosts: data.total,
      dominantTone: Object.entries(data.valences).sort((a, b) => b[1] - a[1])[0][0],
    }))
    .filter(c => c.totalPosts >= 3) // Minimum 3 posts for reliability
    .sort((a, b) => b.negativePercent - a.negativePercent)
    .slice(0, 10);

  return {
    creatorTones,
    topCreatorsByTone: creatorsByNegative,
    scansUsed,
    totalPairs,
    hasPerItemData: true,
  };
}
