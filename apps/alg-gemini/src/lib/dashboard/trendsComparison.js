/**
 * Trends Comparison Helper
 *
 * Calculates deltas between two scans for the Trends feature.
 * Returns comparison metrics for display in TrendsPanel.
 */

import {
  aggregateAds,
  aggregatePolitics,
  aggregateCreators,
  aggregateEmotions,
  aggregateTopics,
  aggregateSourceOrigin,
} from './scanAggregator';

/**
 * Safely extract a numeric value from nested object paths
 * @param {Object} obj - Object to extract from
 * @param {string[]} paths - Array of possible paths to try
 * @returns {number|null} Number if found and valid, null otherwise
 */
function safeGetNumber(obj, paths) {
  if (!obj) return null;

  for (const path of paths) {
    let value = obj;
    const keys = path.split('.');

    for (const key of keys) {
      if (value == null || typeof value !== 'object') {
        value = null;
        break;
      }
      value = value[key];
    }

    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return value;
    }
  }

  return null;
}

/**
 * Format a percentage delta for display
 * @param {number} baseline - Baseline value (0-100)
 * @param {number} compare - Compare value (0-100)
 * @returns {string} Formatted delta (e.g., "+5.2%", "-3.0%", "0%")
 */
function formatPercentageDelta(baseline, compare) {
  if (baseline == null || compare == null) return 'N/A';
  const delta = compare - baseline;
  if (delta === 0) return '0%';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

/**
 * Format an absolute delta for display
 * @param {number} baseline - Baseline value
 * @param {number} compare - Compare value
 * @returns {string} Formatted delta (e.g., "+12", "-5", "0")
 */
function formatAbsoluteDelta(baseline, compare) {
  if (baseline == null || compare == null) return 'N/A';
  const delta = compare - baseline;
  if (delta === 0) return '0';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}`;
}

/**
 * Calculate creator concentration (% from top 5 creators)
 * @param {Object} creatorsData - Result from aggregateCreators
 * @returns {number|null} Percentage (0-100) or null if insufficient data
 */
function calculateCreatorConcentration(creatorsData) {
  if (!creatorsData || !creatorsData.creators || creatorsData.creators.length === 0) {
    return null;
  }

  const totalPosts = creatorsData.totalPostsWithCreatorData || 0;
  if (totalPosts === 0) return null;

  // Get top 5 creators
  const top5 = creatorsData.creators.slice(0, 5);
  const top5Posts = top5.reduce((sum, c) => sum + (c.postCount || 0), 0);

  return Math.round((top5Posts / totalPosts) * 100);
}

/**
 * Compare two scans and return comparison metrics
 * @param {Object} baselineScan - Scan object for baseline
 * @param {Object} compareScan - Scan object for comparison
 * @param {Object} scanDetails - Map of scanId -> scan detail
 * @returns {Array} Array of comparison metric objects
 */
export function compareTwoScans(baselineScan, compareScan, scanDetails) {
  // Wrap each scan in an array for aggregation functions
  const baselineScans = [baselineScan];
  const compareScans = [compareScan];

  const metrics = [];

  // 1. Total Posts
  try {
    const baselineDetail = scanDetails[baselineScan.id];
    const compareDetail = scanDetails[compareScan.id];

    const baselineFeedItems = safeGetNumber(baselineDetail, [
      'result.feed_items.length',
      'scan.feed_items.length',
      'feed_items.length'
    ]);
    const compareFeedItems = safeGetNumber(compareDetail, [
      'result.feed_items.length',
      'scan.feed_items.length',
      'feed_items.length'
    ]);

    // Only show if both scans have posts
    if (baselineFeedItems != null && compareFeedItems != null && baselineFeedItems > 0 && compareFeedItems > 0) {
      metrics.push({
        label: 'Total posts',
        baseline: baselineFeedItems.toString(),
        compare: compareFeedItems.toString(),
        delta: formatAbsoluteDelta(baselineFeedItems, compareFeedItems),
      });
    }
  } catch (err) {
    console.warn('Error calculating total posts:', err);
  }

  // 2. Ad Percentage
  try {
    const baselineAds = aggregateAds(baselineScans, scanDetails);
    const compareAds = aggregateAds(compareScans, scanDetails);

    const baselinePercent = safeGetNumber(baselineAds, ['adPercentageOverall']);
    const comparePercent = safeGetNumber(compareAds, ['adPercentageOverall']);

    // Only show if both scans have valid ad data
    if (baselineAds.scansUsed > 0 && compareAds.scansUsed > 0 && baselinePercent != null && comparePercent != null) {
      metrics.push({
        label: 'Ad percentage',
        baseline: `${baselinePercent}%`,
        compare: `${comparePercent}%`,
        delta: formatPercentageDelta(baselinePercent, comparePercent),
      });
    }
  } catch (err) {
    console.warn('Error calculating ad percentage:', err);
  }

  // 3. Political Content
  try {
    const baselinePolitics = aggregatePolitics(baselineScans, scanDetails);
    const comparePolitics = aggregatePolitics(compareScans, scanDetails);

    const baselinePercent = safeGetNumber(baselinePolitics, ['politicalPercentageOverall']);
    const comparePercent = safeGetNumber(comparePolitics, ['politicalPercentageOverall']);

    // Only show if both scans have valid political data
    if (baselinePolitics.scansUsed > 0 && comparePolitics.scansUsed > 0 && baselinePercent != null && comparePercent != null) {
      metrics.push({
        label: 'Political content',
        baseline: `${baselinePercent}%`,
        compare: `${comparePercent}%`,
        delta: formatPercentageDelta(baselinePercent, comparePercent),
      });
    }
  } catch (err) {
    console.warn('Error calculating political content:', err);
  }

  // 4. Unique Creators
  try {
    const baselineCreators = aggregateCreators(baselineScans, scanDetails);
    const compareCreators = aggregateCreators(compareScans, scanDetails);

    const baselineCount = safeGetNumber(baselineCreators, ['uniqueCreatorCount']);
    const compareCount = safeGetNumber(compareCreators, ['uniqueCreatorCount']);

    // Only show if both scans have creator data
    if (baselineCount != null && compareCount != null && baselineCount > 0 && compareCount > 0) {
      metrics.push({
        label: 'Unique creators',
        baseline: baselineCount.toString(),
        compare: compareCount.toString(),
        delta: formatAbsoluteDelta(baselineCount, compareCount),
      });
    }
  } catch (err) {
    console.warn('Error calculating unique creators:', err);
  }

  // 5. Creator Concentration (Top 5)
  try {
    const baselineCreators = aggregateCreators(baselineScans, scanDetails);
    const compareCreators = aggregateCreators(compareScans, scanDetails);

    const baselineConcentration = calculateCreatorConcentration(baselineCreators);
    const compareConcentration = calculateCreatorConcentration(compareCreators);

    if (baselineConcentration != null && compareConcentration != null) {
      metrics.push({
        label: 'Top 5 creator share',
        baseline: `${baselineConcentration}%`,
        compare: `${compareConcentration}%`,
        delta: formatPercentageDelta(baselineConcentration, compareConcentration),
      });
    }
  } catch (err) {
    console.warn('Error calculating creator concentration:', err);
  }

  // 6. Suggested vs. Followed
  try {
    const baselineOrigin = aggregateSourceOrigin(baselineScans, scanDetails);
    const compareOrigin = aggregateSourceOrigin(compareScans, scanDetails);

    const baselinePercent = safeGetNumber(baselineOrigin, ['suggestedPercentage']);
    const comparePercent = safeGetNumber(compareOrigin, ['suggestedPercentage']);

    // Only show if both scans have source origin data
    if (baselineOrigin.scansUsed > 0 && compareOrigin.scansUsed > 0 && baselinePercent != null && comparePercent != null) {
      metrics.push({
        label: 'Suggested content',
        baseline: `${baselinePercent}%`,
        compare: `${comparePercent}%`,
        delta: formatPercentageDelta(baselinePercent, comparePercent),
      });
    }
  } catch (err) {
    console.warn('Error calculating source origin:', err);
  }

  // 7. Topic Diversity
  try {
    const baselineTopics = aggregateTopics(baselineScans, scanDetails);
    const compareTopics = aggregateTopics(compareScans, scanDetails);

    const baselineCount = safeGetNumber(baselineTopics, ['uniqueTopicCount']);
    const compareCount = safeGetNumber(compareTopics, ['uniqueTopicCount']);

    // Only show if both scans have topic data
    if (baselineCount != null && compareCount != null && baselineCount > 0 && compareCount > 0) {
      metrics.push({
        label: 'Unique topics',
        baseline: baselineCount.toString(),
        compare: compareCount.toString(),
        delta: formatAbsoluteDelta(baselineCount, compareCount),
      });
    }
  } catch (err) {
    console.warn('Error calculating topic diversity:', err);
  }

  // 8. Positive Tone
  try {
    const baselineEmotions = aggregateEmotions(baselineScans, scanDetails);
    const compareEmotions = aggregateEmotions(compareScans, scanDetails);

    const baselinePositive = safeGetNumber(baselineEmotions, ['valencePercentages.POSITIVE']);
    const comparePositive = safeGetNumber(compareEmotions, ['valencePercentages.POSITIVE']);

    // Only show if both scans have valid positive tone data
    if (baselineEmotions.scansUsed > 0 && compareEmotions.scansUsed > 0 && baselinePositive != null && comparePositive != null) {
      metrics.push({
        label: 'Positive tone',
        baseline: `${baselinePositive}%`,
        compare: `${comparePositive}%`,
        delta: formatPercentageDelta(baselinePositive, comparePositive),
      });
    }
  } catch (err) {
    console.warn('Error calculating positive tone:', err);
  }

  // 9. Negative Tone
  try {
    const baselineEmotions = aggregateEmotions(baselineScans, scanDetails);
    const compareEmotions = aggregateEmotions(compareScans, scanDetails);

    const baselineNegative = safeGetNumber(baselineEmotions, ['valencePercentages.NEGATIVE']);
    const compareNegative = safeGetNumber(compareEmotions, ['valencePercentages.NEGATIVE']);

    // Only show if both scans have valid negative tone data
    if (baselineEmotions.scansUsed > 0 && compareEmotions.scansUsed > 0 && baselineNegative != null && compareNegative != null) {
      metrics.push({
        label: 'Negative tone',
        baseline: `${baselineNegative}%`,
        compare: `${compareNegative}%`,
        delta: formatPercentageDelta(baselineNegative, compareNegative),
      });
    }
  } catch (err) {
    console.warn('Error calculating negative tone:', err);
  }

  return metrics;
}
