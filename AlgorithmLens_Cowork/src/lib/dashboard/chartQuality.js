/**
 * Chart Quality System - Deterministic Metric Definitions
 *
 * This module enforces strict data quality gating for all dashboard charts.
 * Charts must never imply precision that the underlying data cannot support.
 *
 * DESIGN PRINCIPLES (per Accuracy Contract):
 * 1. Every chart payload MUST include: n_items, window_start, window_end, quality
 * 2. quality is one of: "ok", "low_sample", "missing_fields", "model_low_confidence"
 * 3. When quality != "ok", frontend MUST render "Insufficient data" state
 * 4. Backend is source of truth for quality gating
 * 5. No fake confidence scores - use binary gating and plain-language caveats only
 *
 * @see apps/alg-gemini/docs/accuracy_contract.md
 * @see apps/alg-gemini/docs/chart_quality_system.md
 */

// ============================================
// QUALITY FLAG CONSTANTS
// ============================================

export const QUALITY_FLAGS = {
  OK: 'ok',
  LOW_SAMPLE: 'low_sample',
  MISSING_FIELDS: 'missing_fields',
  MODEL_LOW_CONFIDENCE: 'model_low_confidence',
};

// ============================================
// MINIMUM THRESHOLDS BY CHART CLASS
// These are conservative thresholds justified by statistical reliability
// ============================================

/**
 * THRESHOLD JUSTIFICATIONS:
 *
 * TOPIC_DISTRIBUTION (20 items):
 *   - With fewer than 20 items, a single item represents >5% of the distribution
 *   - This creates misleading "spikes" from random variation
 *   - 20 items allows at least 4-5 meaningful categories with 3+ items each
 *   - Reference: Accuracy Contract Section 3.4 specifies 20 posts for pie/donut charts
 *
 * AD_SHARE (10 items):
 *   - Ad rates typically range 5-25%
 *   - With <10 items, a single ad changes percentage by >10 points
 *   - 10 items provides ±10% stability per item
 *   - Reference: Accuracy Contract Section 2.5 requires 10+ posts for analysis
 *
 * CREATOR_CONCENTRATION (10 items):
 *   - Concentration metrics need enough data to show clustering vs spread
 *   - With <10 posts, Herfindahl-like indices become meaningless
 *   - 10 posts minimum ensures at least some creator diversity is possible
 *
 * POLITICAL_MIX (15 items):
 *   - Political content is typically sparse (5-20% of feed)
 *   - With political_rate=10%, need 100 items to see 10 political posts
 *   - 15 items is minimum where we might see 1-3 political items
 *   - Higher threshold than ads because political classification is lower confidence
 *   - Reference: Accuracy Contract Section 3.4 specifies 15 classified posts
 *
 * TREND_OVER_TIME (3 data points):
 *   - A "trend" requires directionality which needs at least 3 points
 *   - 2 points can only show "up" or "down", not acceleration/deceleration
 *   - Reference: Accuracy Contract Section 3.4 requires 3 data points minimum
 *
 * SENTIMENT_DISTRIBUTION (15 items):
 *   - Same reasoning as political - classification confidence concerns
 *   - Reference: Accuracy Contract Section 3.4 specifies 15 classified posts
 *
 * SOURCE_DIVERSITY (5 sources):
 *   - Diversity metric is meaningless with fewer than 5 unique sources
 *   - Reference: Accuracy Contract Section 3.4
 *
 * ENGAGEMENT_COMPARISON (10 items):
 *   - Engagement metrics need baseline for comparison
 *   - Reference: Accuracy Contract Section 3.4
 */
export const CHART_THRESHOLDS = {
  // Topic/Category distribution charts (pie, bar)
  TOPIC_DISTRIBUTION: {
    minItems: 20,
    reason: 'Topic distribution requires at least 20 posts for meaningful patterns.',
  },

  // Ad share percentage
  AD_SHARE: {
    minItems: 10,
    reason: 'Ad percentage requires at least 10 posts for reliable measurement.',
  },

  // Creator/voice concentration
  CREATOR_CONCENTRATION: {
    minItems: 10,
    reason: 'Creator analysis requires at least 10 posts to show meaningful patterns.',
  },

  // Political content mix
  POLITICAL_MIX: {
    minItems: 15,
    reason: 'Political analysis requires at least 15 posts due to classification uncertainty.',
  },

  // Time-series trends
  TREND_OVER_TIME: {
    minDataPoints: 3,
    reason: 'Trend analysis requires at least 3 data points to show direction.',
  },

  // Sentiment/emotional distribution
  SENTIMENT_DISTRIBUTION: {
    minItems: 15,
    reason: 'Sentiment analysis requires at least 15 classified posts.',
  },

  // Source diversity metrics
  SOURCE_DIVERSITY: {
    minSources: 5,
    reason: 'Diversity metrics require at least 5 unique sources.',
  },

  // Engagement comparisons
  ENGAGEMENT_COMPARISON: {
    minItems: 10,
    reason: 'Engagement comparison requires at least 10 posts with engagement data.',
  },

  // Default fallback for unspecified chart types
  DEFAULT: {
    minItems: 10,
    reason: 'Analysis requires at least 10 items for reliable patterns.',
  },
};

// ============================================
// QUALITY COMPUTATION FUNCTIONS
// ============================================

/**
 * Create a ChartQuality metadata object.
 *
 * @param {number} nItems - Number of items used for this chart
 * @param {string|Date|null} windowStart - Earliest data point timestamp
 * @param {string|Date|null} windowEnd - Latest data point timestamp
 * @param {string} quality - One of QUALITY_FLAGS values
 * @param {string|null} qualityReason - Human-readable explanation when not ok
 * @returns {Object} ChartQuality metadata
 */
export function createChartQuality(nItems, windowStart, windowEnd, quality, qualityReason = null) {
  return {
    n_items: nItems,
    window_start: windowStart ? new Date(windowStart).toISOString() : null,
    window_end: windowEnd ? new Date(windowEnd).toISOString() : null,
    quality,
    quality_reason: qualityReason,
  };
}

/**
 * Compute quality flag for a topic distribution chart.
 *
 * @param {number} totalItems - Total feed items
 * @param {number} classifiedItems - Items with valid topic classification
 * @param {number} lowConfidenceCount - Items with classification confidence < 0.6
 * @returns {Object} { quality: string, reason: string|null }
 */
export function computeTopicDistributionQuality(totalItems, classifiedItems, lowConfidenceCount = 0) {
  const threshold = CHART_THRESHOLDS.TOPIC_DISTRIBUTION;

  // Check sample size
  if (totalItems < threshold.minItems) {
    return {
      quality: QUALITY_FLAGS.LOW_SAMPLE,
      reason: threshold.reason,
    };
  }

  // Check for missing classification
  const unclassifiedRate = (totalItems - classifiedItems) / totalItems;
  if (unclassifiedRate > 0.3) {
    return {
      quality: QUALITY_FLAGS.MISSING_FIELDS,
      reason: `${Math.round(unclassifiedRate * 100)}% of posts could not be classified. Results may be unreliable.`,
    };
  }

  // Check model confidence (if > 20% are low confidence)
  if (lowConfidenceCount > 0) {
    const lowConfidenceRate = lowConfidenceCount / totalItems;
    if (lowConfidenceRate > 0.2) {
      return {
        quality: QUALITY_FLAGS.MODEL_LOW_CONFIDENCE,
        reason: `${Math.round(lowConfidenceRate * 100)}% of classifications have low confidence.`,
      };
    }
  }

  return { quality: QUALITY_FLAGS.OK, reason: null };
}

/**
 * Compute quality flag for ad share charts.
 *
 * @param {number} totalItems - Total feed items
 * @returns {Object} { quality: string, reason: string|null }
 */
export function computeAdShareQuality(totalItems) {
  const threshold = CHART_THRESHOLDS.AD_SHARE;

  if (totalItems < threshold.minItems) {
    return {
      quality: QUALITY_FLAGS.LOW_SAMPLE,
      reason: threshold.reason,
    };
  }

  return { quality: QUALITY_FLAGS.OK, reason: null };
}

/**
 * Compute quality flag for creator concentration charts.
 *
 * @param {number} totalItems - Total feed items
 * @param {number} uniqueCreators - Number of unique creators
 * @returns {Object} { quality: string, reason: string|null }
 */
export function computeCreatorConcentrationQuality(totalItems, uniqueCreators) {
  const threshold = CHART_THRESHOLDS.CREATOR_CONCENTRATION;

  if (totalItems < threshold.minItems) {
    return {
      quality: QUALITY_FLAGS.LOW_SAMPLE,
      reason: threshold.reason,
    };
  }

  // Check for missing creator data
  if (uniqueCreators === 0) {
    return {
      quality: QUALITY_FLAGS.MISSING_FIELDS,
      reason: 'No creator information available in the scanned posts.',
    };
  }

  return { quality: QUALITY_FLAGS.OK, reason: null };
}

/**
 * Compute quality flag for political mix charts.
 *
 * @param {number} totalItems - Total feed items
 * @param {number} classifiedItems - Items with political classification
 * @returns {Object} { quality: string, reason: string|null }
 */
export function computePoliticalMixQuality(totalItems, classifiedItems) {
  const threshold = CHART_THRESHOLDS.POLITICAL_MIX;

  if (totalItems < threshold.minItems) {
    return {
      quality: QUALITY_FLAGS.LOW_SAMPLE,
      reason: threshold.reason,
    };
  }

  // Political classification has inherent uncertainty
  // Always note that political lean is LOW confidence per Accuracy Contract
  return { quality: QUALITY_FLAGS.OK, reason: null };
}

/**
 * Compute quality flag for trend over time charts.
 *
 * @param {number} dataPoints - Number of data points (typically scans)
 * @returns {Object} { quality: string, reason: string|null }
 */
export function computeTrendQuality(dataPoints) {
  const threshold = CHART_THRESHOLDS.TREND_OVER_TIME;

  if (dataPoints < threshold.minDataPoints) {
    return {
      quality: QUALITY_FLAGS.LOW_SAMPLE,
      reason: threshold.reason,
    };
  }

  return { quality: QUALITY_FLAGS.OK, reason: null };
}

/**
 * Compute quality flag for sentiment distribution charts.
 *
 * @param {number} totalItems - Total feed items
 * @param {number} classifiedItems - Items with sentiment classification
 * @returns {Object} { quality: string, reason: string|null }
 */
export function computeSentimentQuality(totalItems, classifiedItems) {
  const threshold = CHART_THRESHOLDS.SENTIMENT_DISTRIBUTION;

  if (totalItems < threshold.minItems) {
    return {
      quality: QUALITY_FLAGS.LOW_SAMPLE,
      reason: threshold.reason,
    };
  }

  const classifiedRate = classifiedItems / totalItems;
  if (classifiedRate < 0.7) {
    return {
      quality: QUALITY_FLAGS.MISSING_FIELDS,
      reason: `Only ${Math.round(classifiedRate * 100)}% of posts have sentiment classification.`,
    };
  }

  return { quality: QUALITY_FLAGS.OK, reason: null };
}

/**
 * Compute quality flag for source diversity charts.
 *
 * @param {number} uniqueSources - Number of unique content sources
 * @returns {Object} { quality: string, reason: string|null }
 */
export function computeSourceDiversityQuality(uniqueSources) {
  const threshold = CHART_THRESHOLDS.SOURCE_DIVERSITY;

  if (uniqueSources < threshold.minSources) {
    return {
      quality: QUALITY_FLAGS.LOW_SAMPLE,
      reason: threshold.reason,
    };
  }

  return { quality: QUALITY_FLAGS.OK, reason: null };
}

/**
 * Generic quality computation for any chart type.
 * Maps chart types to appropriate quality functions.
 *
 * @param {string} chartType - Type of chart (matches CHART_THRESHOLDS keys)
 * @param {Object} metrics - Relevant metrics for quality computation
 * @returns {Object} { quality: string, reason: string|null }
 */
export function computeChartQuality(chartType, metrics) {
  const {
    totalItems = 0,
    classifiedItems = 0,
    lowConfidenceCount = 0,
    uniqueCreators = 0,
    uniqueSources = 0,
    dataPoints = 0,
  } = metrics;

  switch (chartType) {
    case 'TOPIC_DISTRIBUTION':
      return computeTopicDistributionQuality(totalItems, classifiedItems, lowConfidenceCount);

    case 'AD_SHARE':
      return computeAdShareQuality(totalItems);

    case 'CREATOR_CONCENTRATION':
      return computeCreatorConcentrationQuality(totalItems, uniqueCreators);

    case 'POLITICAL_MIX':
      return computePoliticalMixQuality(totalItems, classifiedItems);

    case 'TREND_OVER_TIME':
      return computeTrendQuality(dataPoints);

    case 'SENTIMENT_DISTRIBUTION':
      return computeSentimentQuality(totalItems, classifiedItems);

    case 'SOURCE_DIVERSITY':
      return computeSourceDiversityQuality(uniqueSources);

    case 'ENGAGEMENT_COMPARISON':
      return computeAdShareQuality(totalItems); // Same threshold logic

    default:
      // Default quality check
      const defaultThreshold = CHART_THRESHOLDS.DEFAULT;
      if (totalItems < defaultThreshold.minItems) {
        return {
          quality: QUALITY_FLAGS.LOW_SAMPLE,
          reason: defaultThreshold.reason,
        };
      }
      return { quality: QUALITY_FLAGS.OK, reason: null };
  }
}

// ============================================
// HELPER TO MAP VIEW IDs TO CHART TYPES
// ============================================

/**
 * Map dashboard view IDs to chart quality types.
 * This ensures consistent quality computation across views.
 */
export const VIEW_TO_CHART_TYPE = {
  // Ads tab
  'ads-percentage': 'AD_SHARE',
  'ads-concentration': 'CREATOR_CONCENTRATION',
  'ads-by-platform': 'AD_SHARE',
  'ads-trend': 'TREND_OVER_TIME',
  'ads-likely-promo': 'AD_SHARE',
  'ads-products': 'TOPIC_DISTRIBUTION',
  'ads-explicit-vs-hidden': 'AD_SHARE',
  'ads-promo-creators': 'CREATOR_CONCENTRATION',
  'ads-themes': 'TOPIC_DISTRIBUTION',
  'ads-advertiser-insights': 'AD_SHARE',

  // Politics tab
  'politics-share': 'POLITICAL_MIX',
  'politics-balance': 'POLITICAL_MIX',
  'politics-creators': 'CREATOR_CONCENTRATION',
  'politics-by-platform': 'POLITICAL_MIX',
  'politics-leaning': 'POLITICAL_MIX',
  'politics-blind-spots': 'POLITICAL_MIX',
  'politics-repetition': 'POLITICAL_MIX',
  'politics-tone': 'SENTIMENT_DISTRIBUTION',
  'politics-trend': 'TREND_OVER_TIME',
  'politics-profile': 'POLITICAL_MIX',

  // Patterns tab
  'patterns-topic-variety': 'TOPIC_DISTRIBUTION',
  'patterns-echo-risk': 'TOPIC_DISTRIBUTION',
  'patterns-repeated-themes': 'TOPIC_DISTRIBUTION',
  'patterns-stability': 'TREND_OVER_TIME',
  'patterns-emotional-weight': 'SENTIMENT_DISTRIBUTION',
  'patterns-sentiment-balance': 'SENTIMENT_DISTRIBUTION',
  'patterns-discovery': 'CREATOR_CONCENTRATION',
  'patterns-rare-content': 'TOPIC_DISTRIBUTION',
  'patterns-intensity-spikes': 'SENTIMENT_DISTRIBUTION',
  'patterns-summary': 'TOPIC_DISTRIBUTION',

  // Creators tab
  'creators-top': 'CREATOR_CONCENTRATION',
  'creators-concentration': 'CREATOR_CONCENTRATION',
  'creators-voice-diversity': 'SOURCE_DIVERSITY',
  'creators-cross-platform': 'CREATOR_CONCENTRATION',
  'creators-new-vs-familiar': 'CREATOR_CONCENTRATION',
  'creators-driving-ads': 'CREATOR_CONCENTRATION',
  'creators-driving-politics': 'CREATOR_CONCENTRATION',
  'creators-by-topic': 'CREATOR_CONCENTRATION',
  'creators-by-tone': 'CREATOR_CONCENTRATION',
  'creators-influential': 'CREATOR_CONCENTRATION',

  // Algorithm tab
  'algo-topics-liked': 'TOPIC_DISTRIBUTION',
  'algo-profile-breadth': 'TOPIC_DISTRIBUTION',
  'algo-confident': 'TOPIC_DISTRIBUTION',
  'algo-future': 'TREND_OVER_TIME',
  'algo-topics-avoided': 'TOPIC_DISTRIBUTION',
  'algo-products': 'TOPIC_DISTRIBUTION',
  'algo-political-themes': 'POLITICAL_MIX',
  'algo-emotional-triggers': 'SENTIMENT_DISTRIBUTION',
  'algo-uncertain': 'TOPIC_DISTRIBUTION',
  'algo-change-advice': 'TOPIC_DISTRIBUTION',
};

/**
 * Get the chart type for a view ID.
 * Returns DEFAULT if view ID is not mapped.
 *
 * @param {string} viewId - Dashboard view ID
 * @returns {string} Chart type key
 */
export function getChartTypeForView(viewId) {
  return VIEW_TO_CHART_TYPE[viewId] || 'DEFAULT';
}
