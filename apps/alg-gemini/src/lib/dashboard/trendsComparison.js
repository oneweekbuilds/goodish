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
 * Format a number with thousands separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., "1,234")
 */
function formatNumber(num) {
  return num.toLocaleString('en-US');
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
 * Format an absolute delta for display with optional percent change
 * @param {number} baseline - Baseline value
 * @param {number} compare - Compare value
 * @param {boolean} showPercentChange - Whether to show percent change
 * @returns {string} Formatted delta (e.g., "+12 (+15%)", "-5 (-10%)", "0")
 */
function formatAbsoluteDelta(baseline, compare, showPercentChange = false) {
  if (baseline == null || compare == null) return 'N/A';
  const delta = compare - baseline;
  if (delta === 0) return '0';
  const sign = delta > 0 ? '+' : '';

  let result = `${sign}${formatNumber(Math.abs(delta))}`;

  // Add percent change if requested and baseline is not zero
  if (showPercentChange && baseline !== 0) {
    const percentChange = ((delta / baseline) * 100);
    const percentSign = percentChange > 0 ? '+' : '';
    result += ` (${percentSign}${percentChange.toFixed(1)}%)`;
  }

  return result;
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
 * Parse a formatted metric value back to a number
 * @param {string} value - Formatted value (e.g., "1,234" or "12.3%")
 * @returns {number|null} Numeric value or null if unparseable
 */
function parseMetricValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;

  // Remove commas and percentage signs, then parse
  const cleaned = value.replace(/,/g, '').replace(/%/g, '');
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

/**
 * Generate a plain-English summary for a single comparison metric
 * @param {Object} metric - Comparison metric object
 * @returns {string|null} Plain-English summary or null if not applicable
 */
function generateMetricSummary(metric) {
  const { label, baseline, compare, absoluteDelta } = metric;

  if (absoluteDelta === 0) return null;

  // Parse baseline and compare values
  const baselineNum = parseMetricValue(baseline);
  const compareNum = parseMetricValue(compare);

  if (baselineNum === null || compareNum === null) return null;

  const isIncrease = compareNum > baselineNum;
  const direction = isIncrease ? 'increased' : 'decreased';
  const absDiff = Math.abs(compareNum - baselineNum);

  // Generate summary based on metric type
  switch (label) {
    case 'Total posts':
      return `Total posts ${direction} by ${formatNumber(absDiff)}.`;

    case 'Ad percentage':
      return `Ad content ${direction} by ${absDiff.toFixed(1)} percentage points.`;

    case 'Political content':
      return `Political content ${direction} by ${absDiff.toFixed(1)} percentage points.`;

    case 'Unique creators':
      return `You saw posts from ${formatNumber(absDiff)} ${isIncrease ? 'more' : 'fewer'} unique creators.`;

    case 'Top 5 creator share':
      return `Content from your top 5 sources ${direction} by ${absDiff.toFixed(1)} percentage points.`;

    case 'Suggested content':
      return `Suggested posts made up a ${isIncrease ? 'larger' : 'smaller'} share of your feed.`;

    case 'Unique topics':
      return `Posts covered ${formatNumber(absDiff)} ${isIncrease ? 'more' : 'fewer'} unique topics.`;

    case 'Positive tone':
      return `Positive-toned posts ${direction} by ${absDiff.toFixed(1)} percentage points.`;

    case 'Negative tone':
      return `Negative-toned posts ${direction} by ${absDiff.toFixed(1)} percentage points.`;

    default:
      return null;
  }
}

/**
 * Generate plain-English summaries for top comparison metrics
 * @param {Array} metrics - Sorted comparison metrics (already sorted by absoluteDelta)
 * @param {number} maxSummaries - Maximum number of summaries to generate (default 4)
 * @returns {Array<string>} Array of plain-English summaries
 */
export function generateChangeSummaries(metrics, maxSummaries = 4) {
  const summaries = [];
  const metricsToSummarize = metrics.slice(0, maxSummaries);

  for (const metric of metricsToSummarize) {
    const summary = generateMetricSummary(metric);
    if (summary) {
      summaries.push(summary);
    }
  }

  return summaries;
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
      const delta = compareFeedItems - baselineFeedItems;
      metrics.push({
        label: 'Total posts',
        baseline: formatNumber(baselineFeedItems),
        compare: formatNumber(compareFeedItems),
        delta: formatAbsoluteDelta(baselineFeedItems, compareFeedItems, true),
        absoluteDelta: Math.abs(delta),
        category: 'feed_makeup',
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
      const delta = comparePercent - baselinePercent;
      metrics.push({
        label: 'Ad percentage',
        baseline: `${baselinePercent.toFixed(1)}%`,
        compare: `${comparePercent.toFixed(1)}%`,
        delta: formatPercentageDelta(baselinePercent, comparePercent),
        absoluteDelta: Math.abs(delta),
        category: 'feed_makeup',
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
      const delta = comparePercent - baselinePercent;
      metrics.push({
        label: 'Political content',
        baseline: `${baselinePercent.toFixed(1)}%`,
        compare: `${comparePercent.toFixed(1)}%`,
        delta: formatPercentageDelta(baselinePercent, comparePercent),
        absoluteDelta: Math.abs(delta),
        category: 'feed_makeup',
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
      const delta = compareCount - baselineCount;
      metrics.push({
        label: 'Unique creators',
        baseline: formatNumber(baselineCount),
        compare: formatNumber(compareCount),
        delta: formatAbsoluteDelta(baselineCount, compareCount, true),
        absoluteDelta: Math.abs(delta),
        category: 'who_what',
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
      const delta = compareConcentration - baselineConcentration;
      metrics.push({
        label: 'Top 5 creator share',
        baseline: `${baselineConcentration.toFixed(1)}%`,
        compare: `${compareConcentration.toFixed(1)}%`,
        delta: formatPercentageDelta(baselineConcentration, compareConcentration),
        absoluteDelta: Math.abs(delta),
        category: 'who_what',
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
      const delta = comparePercent - baselinePercent;
      metrics.push({
        label: 'Suggested content',
        baseline: `${baselinePercent.toFixed(1)}%`,
        compare: `${comparePercent.toFixed(1)}%`,
        delta: formatPercentageDelta(baselinePercent, comparePercent),
        absoluteDelta: Math.abs(delta),
        category: 'feed_makeup',
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
      const delta = compareCount - baselineCount;
      metrics.push({
        label: 'Unique topics',
        baseline: formatNumber(baselineCount),
        compare: formatNumber(compareCount),
        delta: formatAbsoluteDelta(baselineCount, compareCount, true),
        absoluteDelta: Math.abs(delta),
        category: 'who_what',
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
      const delta = comparePositive - baselinePositive;
      metrics.push({
        label: 'Positive tone',
        baseline: `${baselinePositive.toFixed(1)}%`,
        compare: `${comparePositive.toFixed(1)}%`,
        delta: formatPercentageDelta(baselinePositive, comparePositive),
        absoluteDelta: Math.abs(delta),
        category: 'who_what',
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
      const delta = compareNegative - baselineNegative;
      metrics.push({
        label: 'Negative tone',
        baseline: `${baselineNegative.toFixed(1)}%`,
        compare: `${compareNegative.toFixed(1)}%`,
        delta: formatPercentageDelta(baselineNegative, compareNegative),
        absoluteDelta: Math.abs(delta),
        category: 'who_what',
      });
    }
  } catch (err) {
    console.warn('Error calculating negative tone:', err);
  }

  return metrics;
}
