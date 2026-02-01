/**
 * Data processing helpers for dashboard views.
 * Phase 5: Rewired to use canonical scanAggregator layer.
 *
 * All functions return:
 * {
 *   hasData: boolean,
 *   data: any,
 *   missing: string | null,
 *   scansUsed: number,        // ACTUAL scans used for this metric
 *   scansWithData: string[],  // IDs of scans that contributed
 * }
 *
 * IMPORTANT: scansUsed reflects the ACTUAL number of scans that contributed
 * to this specific metric, not the total scan count. This ensures "Based on X scans"
 * labels are accurate.
 */

import {
  aggregateAds,
  aggregatePolitics,
  aggregateTopics,
  aggregateCreators,
  aggregateEmotions,
  aggregateProducts,
  aggregateAdThemes,
  calculateStability,
  calculateDiscoveryRate,
  calculateEchoRisk,
  // Phase 6A additions
  buildTopicUniverse,
  deriveRareTopics,
  aggregateCreatorTopics,
  aggregateCreatorTones,
  summarizeInfluence,
  classifyPromoThemes,
  aggregatePoliticalLeaning,
  aggregateManipulativePatterns,
  UNCLASSIFIED_TOPIC,
  normalizeTopicLabel,
  formatDateLabel,
} from './scanAggregator';

import {
  QUALITY_FLAGS,
  createChartQuality,
  computeChartQuality,
  getChartTypeForView,
  CHART_THRESHOLDS,
} from './chartQuality';

import { FALLBACK_MIX_TOPICS_HEADLINE, pickHeadlineSafeLabels } from './headlineSafety';

// Re-export formatDateLabel for backward compatibility
export { formatDateLabel };

// Re-export quality constants for use by ViewCard
export { QUALITY_FLAGS, CHART_THRESHOLDS };

// =====================================================
// INTERNAL HELPERS
// =====================================================

/**
 * Extract time window from scans
 * @param {Array} scans - List of scan objects
 * @param {Object} scanDetails - Map of scanId -> scan detail
 * @returns {Object} { windowStart, windowEnd }
 */
function extractTimeWindow(scans, scanDetails) {
  let windowStart = null;
  let windowEnd = null;

  for (const scan of scans || []) {
    const detail = scanDetails?.[scan.id];
    if (!detail) continue;

    const data = detail.result || detail.scan || detail;
    const meta = data?.scan_metadata;
    const timestamp = meta?.created_at || scan.created_at;

    if (timestamp) {
      const date = new Date(timestamp);
      if (!windowStart || date < windowStart) windowStart = date;
      if (!windowEnd || date > windowEnd) windowEnd = date;
    }
  }

  return {
    windowStart: windowStart ? windowStart.toISOString() : null,
    windowEnd: windowEnd ? windowEnd.toISOString() : null,
  };
}

/**
 * Create a standardized response with metadata and quality gating.
 *
 * @param {boolean} hasData - Whether data is available
 * @param {any} data - The chart data
 * @param {string|null} missing - Reason for missing data
 * @param {number} scansUsed - Number of scans used
 * @param {string[]} scansWithData - IDs of scans with data
 * @param {Object} qualityOverride - Optional quality override { n_items, windowStart, windowEnd, quality, quality_reason }
 * @returns {Object} Standardized response with chartQuality
 */
function createResponse(hasData, data, missing = null, scansUsed = 0, scansWithData = [], qualityOverride = null) {
  // Build chart quality metadata
  let chartQuality;

  if (qualityOverride) {
    chartQuality = createChartQuality(
      qualityOverride.n_items || 0,
      qualityOverride.windowStart || null,
      qualityOverride.windowEnd || null,
      qualityOverride.quality || QUALITY_FLAGS.OK,
      qualityOverride.quality_reason || null
    );
  } else if (!hasData) {
    // No data means low sample by default
    chartQuality = createChartQuality(
      0,
      null,
      null,
      QUALITY_FLAGS.LOW_SAMPLE,
      missing || 'Insufficient data for analysis.'
    );
  } else {
    // Default to OK when hasData is true and no override
    chartQuality = createChartQuality(
      0, // Will be overridden by caller
      null,
      null,
      QUALITY_FLAGS.OK,
      null
    );
  }

  return { hasData, data, missing, scansUsed, scansWithData, chartQuality };
}

/**
 * Get aggregates from a single scan detail (for backward compatibility)
 */
function getAggregates(scanDetail) {
  if (!scanDetail) return null;
  const data = scanDetail.result || scanDetail.scan || scanDetail;
  return data?.aggregates || null;
}

/**
 * Get feed items from a single scan detail
 */
function getFeedItems(scanDetail) {
  if (!scanDetail) return [];
  const data = scanDetail.result || scanDetail.scan || scanDetail;
  return data?.feed_items || [];
}

// =====================================================
// HELPER: Normalize platform names for consistent presentation
// FIX A1: Map Twitter -> X at display time
// =====================================================

/**
 * Normalize platform name for consistent display.
 * Maps legacy platform names to current naming (e.g., Twitter -> X).
 * This is presentation-only - does not affect data storage or computations.
 */
function normalizePlatformName(platform) {
  if (!platform || typeof platform !== 'string') return 'Unknown';
  
  const lower = platform.toLowerCase().trim();
  
  // Map legacy "twitter" to current "X" branding
  if (lower === 'twitter') return 'X';
  
  // Standard capitalization for other platforms
  return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
}

// =====================================================
// HELPER: Normalize creator names for consistent presentation
// FIX C2: Handle formatting normalization
// =====================================================

/**
 * Normalize creator display name for consistent formatting.
 * Ensures consistent capitalization and format across dashboard.
 */
function normalizeCreatorName(displayName) {
  if (!displayName || typeof displayName !== 'string') return 'Unknown';
  
  const trimmed = displayName.trim();
  
  // If it's all lowercase or all uppercase, use title case for readability
  if (trimmed === trimmed.toLowerCase() || trimmed === trimmed.toUpperCase()) {
    return trimmed
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Otherwise preserve original mixed case (likely intentional branding)
  return trimmed;
}

// =====================================================
// TAB 1: ADS & INFLUENCE
// Phase 5: All views now use aggregateAds for consistency
// =====================================================

/**
 * View 1: How much of your feed is advertising
 * PHASE 5 FIX: Now aggregates across ALL scans, not just latest
 * PHASE 11: Includes chart quality gating
 * PRIMARY INSIGHT: Uses aggregated ad data across all scans
 */
export function getAdPercentageData(scans, scanDetails) {
  const adsData = aggregateAds(scans, scanDetails);
  const { windowStart, windowEnd } = extractTimeWindow(scans, scanDetails);

  // Compute quality based on sample size
  const qualityResult = computeChartQuality('AD_SHARE', {
    totalItems: adsData.totalPosts,
  });

  if (adsData.scansUsed === 0) {
    return createResponse(
      false,
      null,
      'Run at least 1 scan with post-level data.',
      0,
      [],
      {
        n_items: 0,
        windowStart,
        windowEnd,
        quality: QUALITY_FLAGS.LOW_SAMPLE,
        quality_reason: 'No scan data available.',
      }
    );
  }

  const response = createResponse(
    true,
    {
      currentPercent: adsData.adPercentageOverall,
      // Provide trend data if multiple scans
      trend: adsData.byDate.length >= 2 ? adsData.byDate : null,
      // Additional context
      totalAds: adsData.totalAds,
      totalPosts: adsData.totalPosts,
    },
    null,
    adsData.scansUsed,
    adsData.scansWithData,
    {
      n_items: adsData.totalPosts,
      windowStart,
      windowEnd,
      quality: qualityResult.quality,
      quality_reason: qualityResult.reason,
    }
  );
  if (adsData.byDate.length >= 2) {
    response.micro = {
      type: 'sparkline',
      points: adsData.byDate,
    };
  }
  return response;
}

/**
 * View 2: Likely promotional posts (not labeled as ads)
 * PHASE 6A: Now uses heuristic detection with LOW confidence
 */
export function getLikelyPromoData(scans, scanDetails) {
  const influence = summarizeInfluence(scans, scanDetails);

  if (!influence.hasData) {
    return createResponse(
      false,
      null,
      'Need more scans with content to analyze promotional patterns.',
      0,
      []
    );
  }

  // Only show if we found some possible influence
  if (influence.possibleInfluence === 0) {
    return createResponse(
      true,
      {
        possibleInfluencePercent: 0,
        topSignals: [],
        disclaimer: influence.disclaimer,
        confidence: influence.confidence,
        message: 'No unlabeled promotional posts were detected in the selected date range.',
      },
      null,
      influence.scansUsed,
      []
    );
  }

  return createResponse(
    true,
    {
      possibleInfluencePercent: influence.possibleInfluenceShare,
      possibleInfluenceCount: influence.possibleInfluence,
      totalPosts: influence.totalItems,
      topSignals: influence.topSignals,
      examples: influence.examples,
      disclaimer: influence.disclaimer,
      confidence: influence.confidence,
    },
    null,
    influence.scansUsed,
    []
  );
}

/**
 * View 3: Explicit ads vs hidden promotions
 * PHASE 6A: Now compares labeled ads vs possible influence (heuristic)
 */
export function getAdsVsPromoData(scans, scanDetails) {
  const influence = summarizeInfluence(scans, scanDetails);

  if (!influence.hasData) {
    return createResponse(
      false,
      null,
      'Need more scans to compare labeled ads vs possible influence.',
      0,
      []
    );
  }

  // Create stacked bar segments
  const segments = [
    {
      label: 'Labeled Ads',
      value: influence.labeledShare,
      color: '#3B82F6', // Blue
    },
    {
      label: 'Possible Influence',
      value: influence.possibleInfluenceShare,
      color: '#F59E0B', // Amber
    },
    {
      label: 'Other Content',
      value: Math.max(0, 100 - influence.labeledShare - influence.possibleInfluenceShare),
      color: '#94A3B8', // Gray
    },
  ];

  return createResponse(
    true,
    {
      segments,
      disclaimer: influence.disclaimer,
      confidence: influence.confidence,
    },
    null,
    influence.scansUsed,
    []
  );
}

/**
 * View 4: Ad themes (what the ads were mostly about)
 * Uses aggregateAdThemes to summarize ad narratives from multiple text sources:
 * - ad_metadata.product_or_service
 * - content_text.captions
 * - content_text.on_screen_labels
 * Groups ads into neutral, readable themes based on keyword patterns.
 */
export function getProductMentionsData(scans, scanDetails) {
  const themesData = aggregateAdThemes(scans, scanDetails);

  if (themesData.scansUsed === 0 || themesData.totalAds === 0) {
    return createResponse(
      false,
      null,
      'No ad data found in scans yet.',
      0,
      []
    );
  }

  // If no themes detected (ads didn't repeat enough)
  if (!themesData.hasThemes) {
    return createResponse(
      true,
      {
        themes: [],
        totalAds: themesData.totalAds,
        message: 'Ads in this window did not repeat strongly enough to form clear themes.',
      },
      null,
      themesData.scansUsed,
      themesData.scansWithData
    );
  }

  // Return top themes with examples
  const themes = themesData.themesArray.slice(0, 8).map(t => ({
    label: t.theme,
    value: t.percentage,
    count: t.count,
    examples: [...t.advertisers, ...t.domains].slice(0, 2), // Mix advertisers and domains, max 2
  }));

  return createResponse(
    true,
    {
      themes,
      totalAds: themesData.totalAds,
    },
    null,
    themesData.scansUsed,
    themesData.scansWithData
  );
}

/**
 * View 5: Who is doing the promoting (creators with promo content)
 * PHASE 5: Uses aggregateCreators for consistent creator tracking
 */
export function getPromoCreatorsData(scans, scanDetails) {
  const creatorsData = aggregateCreators(scans, scanDetails);

  if (creatorsData.scansUsed === 0) {
    return createResponse(
      false,
      null,
      'No creator data with promotional content found. Run more scans.',
      0,
      []
    );
  }

  // Filter to creators who have ads
  const promoCreators = Object.entries(creatorsData.creators)
    .filter(([_, c]) => c.ads > 0)
    .map(([id, c]) => ({
      creator: normalizeCreatorName(c.displayName), // FIX C2
      promoPosts: c.ads,
      promoPercent: `${Math.round((c.ads / c.totalPosts) * 100)}%`,
    }))
    .sort((a, b) => b.promoPosts - a.promoPosts)
    .slice(0, 10);

  if (promoCreators.length === 0) {
    return createResponse(
      false,
      null,
      'No promotional content with creator attribution found.',
      creatorsData.scansUsed,
      creatorsData.scansWithData
    );
  }

  return createResponse(
    true,
    promoCreators,
    null,
    creatorsData.scansUsed,
    creatorsData.scansWithData
  );
}

/**
 * View 6: Ad concentration (% from top 5 creators)
 * PHASE 9 (Trust): Qualitative labels only
 */
export function getAdConcentrationData(scans, scanDetails) {
  const result = getPromoCreatorsData(scans, scanDetails);
  if (!result.hasData) {
    return result;
  }

  const rows = result.data;
  const totalPromo = rows.reduce((sum, r) => sum + r.promoPosts, 0);
  const top5Promo = rows.slice(0, 5).reduce((sum, r) => sum + r.promoPosts, 0);
  const concentration = totalPromo > 0 ? Math.round((top5Promo / totalPromo) * 100) : 0;

  // PHASE 9: Qualitative labels only - no percentages
  let qualitativeLabel;
  if (concentration >= 60) {
    qualitativeLabel = 'A small number of accounts make up most of your promotions';
  } else {
    qualitativeLabel = 'Your promotions come from a mix of sources';
  }

  // Include top advertisers list (up to 5) if available
  const topAdvertisers = rows.slice(0, 5).map(r => ({
    name: r.creator || r.name || r.domain || r.handle || 'Unknown',
    count: r.promoPosts || 0,
  })).filter(a => a.name && a.name !== 'Unknown');

  return createResponse(
    true,
    { 
      qualitativeLabel, 
      top5Count: Math.min(rows.length, 5),
      advertisers: topAdvertisers.length > 0 ? topAdvertisers : null,
      advertiserCount: rows.length,
    },
    null,
    result.scansUsed,
    result.scansWithData
  );
}

/**
 * View 7: Promotional themes
 * PHASE 6A: Uses keyword-based theme classification (not ML)
 */
export function getPromoThemesData(scans, scanDetails) {
  const themes = classifyPromoThemes(scans, scanDetails);

  if (!themes.hasData) {
    return createResponse(
      false,
      null,
      'Need more ad content to identify promotional themes.',
      0,
      []
    );
  }

  // Convert to bar chart format
  const bars = themes.themes.slice(0, 8).map(t => ({
    label: t.theme,
    value: t.share,
  }));

  return createResponse(
    true,
    {
      bars,
      note: themes.note,
      totalClassified: themes.totalClassified,
      confidence: 'LOW',
    },
    null,
    0,
    []
  );
}

/**
 * View 8: Changes in advertising over time
 */
export function getAdTrendData(scans, scanDetails) {
  const adsData = aggregateAds(scans, scanDetails);

  if (adsData.scansUsed < 2 || adsData.byDate.length < 2) {
    return createResponse(
      false,
      null,
      'Need at least 2 scans to show advertising trends over time.',
      adsData.scansUsed,
      adsData.scansWithData
    );
  }

  const trend = adsData.byDate;
  const first = trend[0].value;
  const last = trend[trend.length - 1].value;
  const direction = last > first ? 'rising' : last < first ? 'falling' : 'stable';

  return createResponse(
    true,
    { trend, direction, firstValue: first, lastValue: last },
    null,
    adsData.scansUsed,
    adsData.scansWithData
  );
}

/**
 * View 9: Platforms driving the most promotion
 */
export function getPlatformPromoData(scans, scanDetails) {
  const adsData = aggregateAds(scans, scanDetails);
  const platforms = Object.keys(adsData.byPlatform);

  if (platforms.length < 2) {
    return createResponse(
      false,
      null,
      'Need scans from at least 2 platforms to compare.',
      adsData.scansUsed,
      adsData.scansWithData
    );
  }

  const bars = platforms.map(platform => ({
    label: normalizePlatformName(platform), // FIX A1: Consistent platform naming
    value: adsData.byPlatform[platform].adPercentage,
  })).sort((a, b) => b.value - a.value);

  return createResponse(
    true,
    bars,
    null,
    adsData.scansUsed,
    adsData.scansWithData
  );
}

/**
 * View 10: What advertisers seem to want from you
 * PHASE 9 (Trust): Threshold of 50 signals AND 3 categories
 * Updated to use theme-based ad aggregation
 */
export function getAdvertiserInsightsData(scans, scanDetails) {
  const themes = getProductMentionsData(scans, scanDetails);
  if (!themes.hasData) {
    return createResponse(
      false,
      null,
      'Need product/category data from ad analysis to generate insights.',
      0,
      []
    );
  }

  // Handle case where themes exist but no clear patterns
  if (themes.data?.message || !themes.data?.themes || themes.data.themes.length === 0) {
    return createResponse(
      false,
      null,
      'Not enough data to identify a pattern yet.',
      themes.scansUsed,
      themes.scansWithData
    );
  }

  // PHASE 9: Require ≥50 ads AND ≥3 theme categories
  const totalAds = themes.data.totalAds || 0;
  const themeArray = themes.data.themes || [];
  const categoryCount = themeArray.length;

  if (totalAds < 50 || categoryCount < 3) {
    return createResponse(
      false,
      null,
      'Not enough data to identify a pattern yet.',
      themes.scansUsed,
      themes.scansWithData
    );
  }

  const topThemes = themeArray.slice(0, 3).map(t => t.label);
  return createResponse(
    true,
    { interests: topThemes },
    null,
    themes.scansUsed,
    themes.scansWithData
  );
}

// =====================================================
// TAB 2: POLITICS & WORLDVIEW
// Phase 5: Uses aggregatePolitics for all political views
// Phase 11: Includes chart quality gating
// =====================================================

/**
 * View 11: Political content share
 * PHASE 5 FIX: Uses aggregated political data
 * PHASE 11: Includes chart quality gating
 */
export function getPoliticalShareData(scans, scanDetails) {
  const politicsData = aggregatePolitics(scans, scanDetails);
  const { windowStart, windowEnd } = extractTimeWindow(scans, scanDetails);

  // Compute quality - political classification needs higher threshold due to inherent uncertainty
  const qualityResult = computeChartQuality('POLITICAL_MIX', {
    totalItems: politicsData.totalPosts,
    classifiedItems: politicsData.totalPosts, // Political field is always present
  });

  if (politicsData.scansUsed === 0) {
    return createResponse(
      false,
      null,
      'Political classification is not available for your scans.',
      0,
      [],
      {
        n_items: 0,
        windowStart,
        windowEnd,
        quality: QUALITY_FLAGS.LOW_SAMPLE,
        quality_reason: 'No scan data available for political analysis.',
      }
    );
  }

  const response = createResponse(
    true,
    {
      currentPercent: politicsData.politicalPercentageOverall,
      trend: politicsData.byDate.length >= 2 ? politicsData.byDate : null,
      totalPolitical: politicsData.totalPolitical,
      totalPosts: politicsData.totalPosts,
    },
    null,
    politicsData.scansUsed,
    politicsData.scansWithData,
    {
      n_items: politicsData.totalPosts,
      windowStart,
      windowEnd,
      quality: qualityResult.quality,
      quality_reason: qualityResult.reason,
    }
  );
  if (politicsData.byDate.length >= 2) {
    response.micro = {
      type: 'sparkline',
      points: politicsData.byDate,
    };
  }
  return response;
}

/**
 * View 12: Political leaning breakdown
 * PHASE 6A: Heuristic classification with opt-in toggle (handled by UI)
 * Returns data structure for stacked bar chart
 */
export function getPoliticalLeaningData(scans, scanDetails, options = {}) {
  const { enabled = false } = options;

  // If not enabled, return special state
  if (!enabled) {
    return createResponse(
      false,
      null,
      'Political leaning estimates are disabled. Enable them in settings to see this view.',
      0,
      [],
      { requiresOptIn: true }
    );
  }

  const leaning = aggregatePoliticalLeaning(scans, scanDetails);

  // PHASE 9 (Trust): Raised threshold to 30 political content signals
  if (leaning.totalPolitical < 30) {
    return createResponse(
      false,
      null,
      'Not enough data to determine political lean.',
      leaning.scansUsed,
      []
    );
  }

  // PHASE 9: Qualitative labels only - no percentages or charts
  const left = leaning.percentages.left;
  const right = leaning.percentages.right;

  let qualitativeLabel = 'Mixed';
  if (left > right + 20) {
    qualitativeLabel = 'Leans left';
  } else if (right > left + 20) {
    qualitativeLabel = 'Leans right';
  }

  return createResponse(
    true,
    {
      qualitativeLabel,
      disclaimer: leaning.disclaimer,
      confidence: leaning.confidence,
    },
    null,
    leaning.scansUsed,
    []
  );
}

/**
 * Ideological distribution of political content
 * Shows left/neutral/right breakdown of political posts
 */
export function getPoliticalIdeologyDistributionData(scans, scanDetails) {
  const leaning = aggregatePoliticalLeaning(scans, scanDetails);

  // Need at least 10 political posts to show distribution
  if (leaning.totalPolitical < 10) {
    return createResponse(
      false,
      null,
      'Political content volume was too low to show a reliable ideological distribution.',
      leaning.scansUsed,
      []
    );
  }

  // Create bars for left, neutral, right (exclude unknown)
  const bars = [
    { label: 'Left leaning', value: leaning.percentages.left },
    { label: 'Neutral', value: leaning.percentages.neutral },
    { label: 'Right leaning', value: leaning.percentages.right },
  ];

  return createResponse(
    true,
    bars,
    null,
    leaning.scansUsed,
    [],
    {
      denominator: `Percent of political posts in the selected date range (${leaning.totalPolitical} posts)`,
      methodology: 'Ideological leaning is inferred from language patterns in political posts. Neutral includes content without a clear directional signal.',
    }
  );
}

/**
 * View 13: Balance vs imbalance
 * PHASE 6A: Uses heuristic political leaning data (opt-in)
 * PHASE 9 (Trust): Qualitative only, raised threshold to 30
 */
export function getPoliticalBalanceData(scans, scanDetails, options = {}) {
  const { enabled = false } = options;

  if (!enabled) {
    return createResponse(
      false,
      null,
      'Political balance requires political leaning estimates to be enabled.',
      0,
      [],
      { requiresOptIn: true }
    );
  }

  const leaning = aggregatePoliticalLeaning(scans, scanDetails);

  // PHASE 9: Raised threshold to 30 political content signals
  if (leaning.totalPolitical < 30) {
    return createResponse(
      false,
      null,
      'Not enough data to determine political lean.',
      leaning.scansUsed,
      []
    );
  }

  // PHASE 9: Qualitative labels only - no percentages
  const left = leaning.percentages.left;
  const right = leaning.percentages.right;

  let status = 'Mixed';
  let variant = 'neutral';
  let message = 'Your political content appears mixed.';

  if (left > right + 30) {
    status = 'Leans left';
    variant = 'neutral';
    message = 'Leans left';
  } else if (right > left + 30) {
    status = 'Leans right';
    variant = 'neutral';
    message = 'Leans right';
  }

  return createResponse(
    true,
    {
      status,
      variant,
      message,
      disclaimer: leaning.disclaimer,
      confidence: leaning.confidence,
    },
    null,
    leaning.scansUsed,
    []
  );
}

/**
 * View 14: Who drives political content
 * PHASE 5: Uses aggregatePolitics.byCreator for creator attribution
 */
export function getPoliticalCreatorsData(scans, scanDetails) {
  const politicsData = aggregatePolitics(scans, scanDetails);

  if (politicsData.scansUsed === 0) {
    return createResponse(
      false,
      null,
      'No political content data available.',
      0,
      []
    );
  }

  const rows = Object.entries(politicsData.byCreator)
    .filter(([_, stats]) => stats.political > 0)
    .map(([_, stats]) => {
      // Normalize percent to 0-100% format consistently
      const percentValue = stats.total > 0 ? (stats.political / stats.total) * 100 : 0;
      // Format: 0 decimals if >= 10%, 1 decimal if < 10%
      const politicalPercent = percentValue >= 10 
        ? `${Math.round(percentValue)}%`
        : `${percentValue.toFixed(1)}%`;
      
      return {
        creator: normalizeCreatorName(stats.displayName), // FIX C2
        'Political posts': stats.political,
        'Percent of account posts': politicalPercent,
        _rawPercent: percentValue, // Store raw value for concentration logic
      };
    })
    .sort((a, b) => b['Political posts'] - a['Political posts'])
    .slice(0, 10);

  if (rows.length === 0) {
    return createResponse(
      false,
      null,
      'No accounts in your scanned posts contained political terms yet.',
      politicsData.scansUsed,
      politicsData.scansWithData
    );
  }

  return createResponse(
    true,
    rows,
    null,
    politicsData.scansUsed,
    politicsData.scansWithData
  );
}

/**
 * View 15-20: Various political views
 */
export function getPoliticalRepetitionData() {
  return createResponse(false, null, 'Political theme clustering is not available yet.', 0, []);
}

export function getPoliticalToneData() {
  return createResponse(false, null, 'Political tone classification is not available yet.', 0, []);
}

export function getPoliticalTrendData(scans, scanDetails) {
  const politicsData = aggregatePolitics(scans, scanDetails);

  if (politicsData.scansUsed < 2 || politicsData.byDate.length < 2) {
    return createResponse(
      false,
      null,
      'Need at least 2 scans with political data.',
      politicsData.scansUsed,
      politicsData.scansWithData
    );
  }

  const trend = politicsData.byDate;
  const first = trend[0].value;
  const last = trend[trend.length - 1].value;
  const direction = last > first ? 'rising' : last < first ? 'falling' : 'stable';

  return createResponse(
    true,
    { trend, direction },
    null,
    politicsData.scansUsed,
    politicsData.scansWithData
  );
}

export function getPoliticalBlindSpotsData(scans, scanDetails, options = {}) {
  const { enabled = false } = options;

  if (!enabled) {
    return createResponse(
      false,
      null,
      'Political blind spots require political leaning estimates to be enabled.',
      0,
      [],
      { requiresOptIn: true }
    );
  }

  const leaning = aggregatePoliticalLeaning(scans, scanDetails);

  if (!leaning.hasData) {
    return createResponse(
      false,
      null,
      'Need more political content to identify blind spots.',
      leaning.scansUsed,
      []
    );
  }

  // Identify potential blind spots based on low representation
  const blindSpots = [];
  const threshold = 10; // Less than 10% = potential blind spot

  if (leaning.percentages.left < threshold && leaning.percentages.right > threshold) {
    blindSpots.push('Left-leaning perspectives');
  }
  if (leaning.percentages.right < threshold && leaning.percentages.left > threshold) {
    blindSpots.push('Right-leaning perspectives');
  }
  if (leaning.percentages.neutral < threshold) {
    blindSpots.push('Neutral/centrist perspectives');
  }

  return createResponse(
    true,
    {
      blindSpots,
      disclaimer: leaning.disclaimer,
      confidence: leaning.confidence,
      message: blindSpots.length > 0
        ? 'These perspectives rarely appear in your political content.'
        : 'No clear blind spots detected based on available data.',
    },
    null,
    leaning.scansUsed,
    []
  );
}

export function getCrossPlatformPoliticalData(scans, scanDetails) {
  const politicsData = aggregatePolitics(scans, scanDetails);
  const platforms = Object.keys(politicsData.byPlatform);

  if (platforms.length < 2) {
    return createResponse(
      false,
      null,
      'Need scans from at least 2 platforms.',
      politicsData.scansUsed,
      politicsData.scansWithData
    );
  }

  const bars = platforms.map(p => ({
    label: normalizePlatformName(p), // FIX A1: Consistent platform naming
    value: politicsData.byPlatform[p].politicalPercentage,
  })).sort((a, b) => b.value - a.value);

  return createResponse(
    true,
    bars,
    null,
    politicsData.scansUsed,
    politicsData.scansWithData
  );
}

// =====================================================
// TAB 3: PATTERNS IN YOUR FEED
// Phase 5: Uses aggregateTopics and aggregateEmotions
// CRITICAL FIXES: Topic and emotion views now aggregate ALL scans
// =====================================================

/**
 * View 21: Topic variety
 * PHASE 5 CRITICAL FIX: Now aggregates topics across ALL scans
 * PHASE 9 (Trust): Threshold of 25 posts with topics
 * PHASE 11: Includes chart quality gating
 */
export function getTopicVarietyData(scans, scanDetails) {
  const topicsData = aggregateTopics(scans, scanDetails);
  const { windowStart, windowEnd } = extractTimeWindow(scans, scanDetails);

  // Compute quality based on sample size and classification rate
  // Note: topicsData.totalItems gives us the total items analyzed
  const totalItems = topicsData.totalItems || 0;
  const classifiedItems = totalItems - (topicsData.unclassifiedCount || 0);

  const qualityResult = computeChartQuality('TOPIC_DISTRIBUTION', {
    totalItems,
    classifiedItems,
    lowConfidenceCount: 0, // We don't have confidence scores per item
  });

  if (topicsData.scansUsed === 0) {
    return createResponse(
      false,
      null,
      'No topic classification data available.',
      0,
      [],
      {
        n_items: 0,
        windowStart,
        windowEnd,
        quality: QUALITY_FLAGS.LOW_SAMPLE,
        quality_reason: 'No scan data available for topic analysis.',
      }
    );
  }

  // PHASE 9: Require ≥25 posts with topics (use uniqueTopicCount as proxy)
  // If we have fewer than 3 unique topics, we likely don't have enough data
  if (topicsData.uniqueTopicCount < 3) {
    return createResponse(
      false,
      null,
      'Not enough topics detected yet.',
      topicsData.scansUsed,
      topicsData.scansWithData,
      {
        n_items: totalItems,
        windowStart,
        windowEnd,
        quality: QUALITY_FLAGS.LOW_SAMPLE,
        quality_reason: 'Need more topic variety to show meaningful distribution.',
      }
    );
  }

  // Sort topics by aggregated percentage
  const sortedTopics = Object.entries(topicsData.topics)
    .map(([category, percentage]) => ({ category, percentage }))
    .sort((a, b) => b.percentage - a.percentage);

  const topTopics = sortedTopics.slice(0, 5).map(t => ({
    label: t.category,
    value: Math.round(t.percentage * 100),
    isUnclassified: t.category === UNCLASSIFIED_TOPIC,
  }));

  const response = createResponse(
    true,
    {
      topicCount: topicsData.uniqueTopicCount,
      topTopics,
      hasUnclassified: topicsData.hasUnclassified,
      unclassifiedNote: topicsData.hasUnclassified
        ? "Some content can't be reliably categorized yet."
        : null,
    },
    null,
    topicsData.scansUsed,
    topicsData.scansWithData,
    {
      n_items: totalItems,
      windowStart,
      windowEnd,
      quality: qualityResult.quality,
      quality_reason: qualityResult.reason,
    }
  );
  const microSegments = topTopics
    .filter(t => !t.isUnclassified)
    .slice(0, 3)
    .map(t => ({
      label: normalizeTopicLabel ? normalizeTopicLabel(t.label) : t.label,
      value: t.value,
    }))
    .filter(s => s.label);
  if (microSegments.length > 0) {
    response.micro = {
      type: 'segments',
      segments: microSegments,
    };
  }
  return response;
}

/**
 * View 22: Repeated themes (% in top 3 topics)
 */
export function getRepeatedThemesData(scans, scanDetails) {
  const result = getTopicVarietyData(scans, scanDetails);
  if (!result.hasData) return result;

  const top3Percent = result.data.topTopics.slice(0, 3).reduce((sum, t) => sum + t.value, 0);

  return createResponse(
    true,
    { top3Percent, topTopics: result.data.topTopics.slice(0, 3) },
    null,
    result.scansUsed,
    result.scansWithData
  );
}

/**
 * View 23: Emotional weight (tone breakdown)
 * PHASE 5 CRITICAL FIX: Now aggregates emotions across ALL scans
 * PHASE 9 (Trust): Threshold of 50 posts, qualitative labels
 */
export function getEmotionalWeightData(scans, scanDetails) {
  const emotionsData = aggregateEmotions(scans, scanDetails);

  if (emotionsData.scansUsed === 0 || emotionsData.totalPostsAnalyzed === 0) {
    return createResponse(
      false,
      null,
      'No tone/sentiment data available.',
      0,
      []
    );
  }

  // PHASE 9: Require ≥50 posts with text
  if (emotionsData.totalPostsAnalyzed < 50) {
    return createResponse(
      false,
      null,
      'Not enough content to analyze tone patterns.',
      emotionsData.scansUsed,
      emotionsData.scansWithData
    );
  }

  // Return semantic categories without presentation colors
  // Colors are applied in presentation layer (StackedBar100.jsx)
  // Combine positive and neutral into "Mostly positive or neutral" for clarity
  const segments = [
    { label: 'Mostly positive or neutral', value: emotionsData.valencePercentages.POSITIVE + emotionsData.valencePercentages.NEUTRAL, category: 'positive' },
    { label: 'More negative or tense', value: emotionsData.valencePercentages.NEGATIVE, category: 'negative' },
  ];

  // Get creator tone examples if available
  const creatorTones = aggregateCreatorTones(scans, scanDetails);
  let positiveExamples = null;
  let negativeExamples = null;

  if (creatorTones.hasPerItemData && creatorTones.topCreatorsByTone.length > 0) {
    // Get top creators by positive/neutral (lowest negative percent, highest positive+neutral)
    const creatorsByPositive = creatorTones.topCreatorsByTone
      .map(c => ({
        displayName: c.displayName,
        positiveNeutralPercent: 100 - c.negativePercent,
        totalPosts: c.totalPosts,
      }))
      .filter(c => c.totalPosts >= 3)
      .sort((a, b) => b.positiveNeutralPercent - a.positiveNeutralPercent)
      .slice(0, 5);
    
    positiveExamples = creatorsByPositive.length > 0 
      ? creatorsByPositive.map(c => c.displayName).filter(name => name && name.trim())
      : null;

    // Get top creators by negative (already sorted by negativePercent)
    const creatorsByNegative = creatorTones.topCreatorsByTone
      .filter(c => c.negativePercent > 0 && c.totalPosts >= 3)
      .slice(0, 5);
    
    negativeExamples = creatorsByNegative.length > 0
      ? creatorsByNegative.map(c => c.displayName).filter(name => name && name.trim())
      : null;
  }

  return createResponse(
    true,
    { 
      segments, 
      intensity: emotionsData.intensity,
      positiveExamples,
      negativeExamples,
    },
    null,
    emotionsData.scansUsed,
    emotionsData.scansWithData
  );
}

/**
 * View 24: Negative vs positive balance
 */
export function getSentimentBalanceData(scans, scanDetails) {
  const result = getEmotionalWeightData(scans, scanDetails);
  if (!result.hasData) return result;

  return createResponse(
    true,
    { segments: result.data.segments },
    null,
    result.scansUsed,
    result.scansWithData
  );
}

/**
 * View 25: Stability of your feed (How your feed is evolving)
 * Evidence-based comparison of recent vs earlier scans
 */
export function getFeedStabilityData(scans, scanDetails) {
  // Require at least 4 scans with timestamps
  if (!scans || scans.length < 4) {
    return createResponse(
      false,
      null,
      'We need more scan history to describe changes over time. As you scan on different days, this section will summarize what actually shifted between earlier and more recent scans.',
      0,
      []
    );
  }

  // Sort scans by date (newest first, as they come from API)
  const sortedScans = [...scans].sort((a, b) => {
    const dateA = new Date(a.created_at || a.timestamp || 0);
    const dateB = new Date(b.created_at || b.timestamp || 0);
    return dateB - dateA;
  });

  // Split into recent (25%, min 2) and earlier (25%, min 2)
  const recentCount = Math.max(2, Math.ceil(sortedScans.length * 0.25));
  const earlierCount = Math.max(2, Math.ceil(sortedScans.length * 0.25));
  
  const recentScans = sortedScans.slice(0, recentCount);
  const earlierScans = sortedScans.slice(-earlierCount);

  // Helper to aggregate metrics for a window of scans
  const aggregateWindow = (windowScans) => {
    let totalItems = 0;
    let adItems = 0;
    let negativeItems = 0;
    const topicCounts = {};
    const scanIds = [];

    for (const scan of windowScans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const aggregates = getAggregates(detail);
      const feedItems = getFeedItems(detail);
      
      if (feedItems.length === 0 && !aggregates) continue;
      scanIds.push(scan.id);

      // Count ads
      const adSummary = aggregates?.ad_summary;
      if (adSummary) {
        const total = adSummary.total_feed_items || 0;
        const adCount = adSummary.ad_items || 0;
        totalItems += total;
        adItems += adCount;
      } else {
        // Fallback: count from feed items
        for (const item of feedItems) {
          totalItems++;
          if (item.ad?.is_ad || item.promotional?.is_promotional) {
            adItems++;
          }
        }
      }

      // Count negative tone
      const wellbeing = aggregates?.wellbeing_summary;
      const valence = wellbeing?.valence_distribution;
      if (valence) {
        const neg = valence.NEGATIVE || 0;
        const total = (valence.POSITIVE || 0) + (valence.NEUTRAL || 0) + neg + (valence.MIXED || 0);
        negativeItems += neg;
        if (totalItems === 0 && total > 0) {
          totalItems += total;
        }
      }

      // Collect topics
      const topics = aggregates?.topic_distribution || [];
      for (const topic of topics) {
        const normalized = normalizeTopicLabel(topic.category);
        topicCounts[normalized] = (topicCounts[normalized] || 0) + (topic.percentage || 0);
      }
    }

    // Find top topic
    let topTopic = null;
    let topTopicShare = 0;
    if (Object.keys(topicCounts).length > 0) {
      const sorted = Object.entries(topicCounts)
        .filter(([topic]) => topic !== UNCLASSIFIED_TOPIC)
        .sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        topTopic = sorted[0][0];
        topTopicShare = sorted[0][1];
      }
    }

    return {
      adPercent: totalItems > 0 ? (adItems / totalItems) * 100 : 0,
      negativePercent: totalItems > 0 ? (negativeItems / totalItems) * 100 : 0,
      topTopic,
      topTopicShare,
      scanIds,
    };
  };

  const recent = aggregateWindow(recentScans);
  const earlier = aggregateWindow(earlierScans);

  // Check if we have enough data
  if (recent.scanIds.length < 2 || earlier.scanIds.length < 2) {
    return createResponse(
      false,
      null,
      'We need more scan history to describe changes over time. As you scan on different days, this section will summarize what actually shifted between earlier and more recent scans.',
      0,
      []
    );
  }

  // Compute changes (only report if meaningful)
  const changes = [];
  
  // Ads change (threshold: 5 percentage points)
  const adChange = Math.abs(recent.adPercent - earlier.adPercent);
  if (adChange >= 5) {
    changes.push({
      type: 'ads',
      earlier: Math.round(earlier.adPercent),
      recent: Math.round(recent.adPercent),
    });
  }

  // Tone change (threshold: 5 percentage points)
  const toneChange = Math.abs(recent.negativePercent - earlier.negativePercent);
  if (toneChange >= 5) {
    changes.push({
      type: 'tone',
      earlier: Math.round(earlier.negativePercent),
      recent: Math.round(recent.negativePercent),
    });
  }

  // Topic change (threshold: top topic changed OR new top topic share >= 15%)
  if (recent.topTopic && earlier.topTopic) {
    if (recent.topTopic !== earlier.topTopic) {
      // Top topic changed
      if (recent.topTopicShare >= 15) {
        changes.push({
          type: 'topic_change',
          earlierTopic: earlier.topTopic,
          recentTopic: recent.topTopic,
        });
      }
    } else if (recent.topTopic === earlier.topTopic) {
      // Same topic, check if it became more concentrated
      const concentrationChange = recent.topTopicShare - earlier.topTopicShare;
      if (concentrationChange >= 5 && recent.topTopicShare >= 15) {
        changes.push({
          type: 'topic_concentration',
          topic: recent.topTopic,
        });
      }
    }
  }

  // If no meaningful changes, still return data but indicate no changes
  const allScanIds = [...new Set([...recent.scanIds, ...earlier.scanIds])];

  return createResponse(
    true,
    {
      changes: changes.slice(0, 2), // Max 2 changes
      hasChanges: changes.length > 0,
    },
    null,
    allScanIds.length,
    allScanIds
  );
}

/**
 * View 26: Discovery rate (new creators)
 * PHASE 5: Uses calculateDiscoveryRate from aggregator
 */
export function getDiscoveryRateData(scans, scanDetails) {
  const creatorsData = aggregateCreators(scans, scanDetails);
  const discovery = calculateDiscoveryRate(creatorsData, scans, scanDetails);

  if (!discovery.hasData) {
    return createResponse(
      false,
      null,
      discovery.reason || 'Need at least 2 scans to measure discovery.',
      0,
      []
    );
  }

  return createResponse(
    true,
    {
      discoveryRate: discovery.discoveryRate,
      newCount: discovery.newCount,
      totalCreators: discovery.totalCreators,
    },
    null,
    creatorsData.scansUsed,
    creatorsData.scansWithData
  );
}

/**
 * View 27: Reinforcement warning (echo risk)
 * PHASE 5: Uses calculateEchoRisk from aggregator
 * PHASE 9 (Trust): Qualitative concentration labels
 */
export function getEchoRiskData(scans, scanDetails) {
  const topicsData = aggregateTopics(scans, scanDetails);
  const stability = calculateStability(topicsData, scans, scanDetails);
  const echoRisk = calculateEchoRisk(topicsData, stability);

  if (!echoRisk.hasData) {
    return createResponse(
      false,
      null,
      'Need topic and stability data.',
      0,
      []
    );
  }

  // PHASE 9: Qualitative concentration labels - no numeric risk levels
  let concentrationLabel;
  if (echoRisk.riskLevel === 'high') {
    concentrationLabel = 'High concentration';
  } else if (echoRisk.riskLevel === 'moderate') {
    concentrationLabel = 'Moderate concentration';
  } else {
    concentrationLabel = 'Low concentration';
  }

  // Get top topics for examples (up to 5)
  const topTopics = [];
  if (topicsData.topics && Object.keys(topicsData.topics).length > 0) {
    const sortedTopics = Object.entries(topicsData.topics)
      .filter(([topic]) => topic !== UNCLASSIFIED_TOPIC)
      .map(([topic, percentage]) => ({
        name: topic,
        percentage: percentage * 100, // Convert to 0-100%
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
    
    topTopics.push(...sortedTopics.map(t => t.name));
  }

  return createResponse(
    true,
    {
      riskLevel: concentrationLabel,
      factors: echoRisk.factors,
      topicCount: echoRisk.topicCount,
      topTopics: topTopics.length > 0 ? topTopics : null,
    },
    null,
    topicsData.scansUsed,
    topicsData.scansWithData
  );
}

/**
 * View 28: Content you almost never see
 * PHASE 6A: Uses observed topic universe to find rare topics
 */
export function getRareContentData(scans, scanDetails) {
  const universe = buildTopicUniverse(scans, scanDetails);
  const rare = deriveRareTopics(universe);

  if (!rare.hasData) {
    return createResponse(
      false,
      null,
      rare.reason || 'Need more scannable content to identify rare topics.',
      universe.scansUsed,
      []
    );
  }

  if (rare.rareTopics.length === 0) {
    return createResponse(
      true,
      {
        rareTopics: [],
        message: 'Your feed has fairly even topic distribution. No extremely rare topics found.',
        confidence: rare.confidence,
      },
      null,
      universe.scansUsed,
      []
    );
  }

  return createResponse(
    true,
    {
      rareTopics: rare.rareTopics,
      blindSpots: rare.blindSpots,
      totalTopicsInUniverse: rare.totalTopicsInUniverse,
      confidence: rare.confidence,
    },
    null,
    universe.scansUsed,
    []
  );
}

/**
 * View 29: Intensity spikes
 */
export function getIntensitySpikesData(scans, scanDetails) {
  const emotionsData = aggregateEmotions(scans, scanDetails);

  if (emotionsData.scansUsed < 2 || emotionsData.byDate.length < 2) {
    return createResponse(
      false,
      null,
      'Need tone data from at least 2 scans.',
      emotionsData.scansUsed,
      emotionsData.scansWithData
    );
  }

  const dataPoints = emotionsData.byDate.map(d => ({
    label: d.label,
    value: d.negativePercent,
  }));

  return createResponse(
    true,
    dataPoints,
    null,
    emotionsData.scansUsed,
    emotionsData.scansWithData
  );
}

/**
 * View 30: What your patterns suggest
 */
export function getPatternSummaryData(scans, scanDetails) {
  const topics = getTopicVarietyData(scans, scanDetails);
  const emotional = getEmotionalWeightData(scans, scanDetails);
  const stability = getFeedStabilityData(scans, scanDetails);

  const insights = [];
  let totalScansUsed = 0;
  const allScansWithData = new Set();

  // FIX PA10: Only add topic insight if data quality is OK (not just hasData)
  const topicQualityOk = topics.hasData && 
    (!topics.chartQuality || 
     topics.chartQuality.quality === 'OK' || 
     topics.chartQuality.quality === 'ok');

  if (topicQualityOk) {
    const variety = topics.data.topicCount > 10 ? 'diverse' : topics.data.topicCount > 5 ? 'moderate' : 'narrow';
    insights.push(`Your feed covers ${topics.data.topicCount} topics (${variety} variety).`);
    totalScansUsed = Math.max(totalScansUsed, topics.scansUsed);
    topics.scansWithData.forEach(id => allScansWithData.add(id));
  }

  if (emotional.hasData) {
    insights.push(`Content tone feels ${emotional.data.intensity}.`);
    totalScansUsed = Math.max(totalScansUsed, emotional.scansUsed);
    emotional.scansWithData.forEach(id => allScansWithData.add(id));
  }

  if (stability.hasData) {
    insights.push(`Feed content is ${stability.data.stability} between scans.`);
    totalScansUsed = Math.max(totalScansUsed, stability.scansUsed);
    stability.scansWithData.forEach(id => allScansWithData.add(id));
  }

  if (insights.length === 0) {
    return createResponse(
      false,
      null,
      'Need more scan data to generate pattern summary.',
      0,
      []
    );
  }

  return createResponse(
    true,
    { insights },
    null,
    totalScansUsed,
    Array.from(allScansWithData)
  );
}

// =====================================================
// TAB 4: CREATORS & VOICES
// Phase 5: Uses aggregateCreators for all creator views
// =====================================================

/**
 * View 31: Creators you see most
 * PHASE 5: Uses aggregateCreators with deduplication
 */
export function getTopCreatorsData(scans, scanDetails) {
  const creatorsData = aggregateCreators(scans, scanDetails);

  if (creatorsData.scansUsed === 0 || creatorsData.uniqueCreatorCount === 0) {
    return createResponse(
      false,
      null,
      'No creator data found in scans.',
      0,
      []
    );
  }

  // FIX C3: Use clearer column labels
  const rows = Object.entries(creatorsData.creators)
    .map(([_, c]) => ({
      creator: normalizeCreatorName(c.displayName), // FIX C2
      'Posts in window': c.totalPosts,
      '% of your feed': `${Math.round((c.totalPosts / creatorsData.totalPostsWithCreatorData) * 100)}%`,
    }))
    .sort((a, b) => b['Posts in window'] - a['Posts in window'])
    .slice(0, 10);

  return createResponse(
    true,
    rows,
    null,
    creatorsData.scansUsed,
    creatorsData.scansWithData
  );
}

/**
 * View 32: Creator concentration
 * PHASE 9 (Trust): Qualitative only, threshold of 100 posts
 * POLISH: Human-first phrasing with Oura-style context
 */
export function getCreatorConcentrationData(scans, scanDetails) {
  const creatorsData = aggregateCreators(scans, scanDetails);

  if (creatorsData.scansUsed === 0 || creatorsData.uniqueCreatorCount === 0) {
    return createResponse(
      false,
      null,
      'No creator data found.',
      0,
      []
    );
  }

  const totalPosts = creatorsData.totalPostsWithCreatorData;

  // PHASE 9: Require ≥100 posts analyzed
  if (totalPosts < 100) {
    return createResponse(
      false,
      null,
      'We need more data to assess source diversity.',
      creatorsData.scansUsed,
      creatorsData.scansWithData
    );
  }

  // Calculate top 10 concentration (LOCKED: no math changes)
  const sortedCreators = Object.values(creatorsData.creators)
    .sort((a, b) => b.totalPosts - a.totalPosts);

  const top10Posts = sortedCreators.slice(0, 10).reduce((sum, c) => sum + c.totalPosts, 0);
  const concentration = totalPosts > 0 ? Math.round((top10Posts / totalPosts) * 100) : 0;

  // Round concentration for human-first phrasing (round to nearest 5% for cleaner copy)
  const roundedConcentration = Math.round(concentration / 5) * 5;
  const top10Count = Math.min(sortedCreators.length, 10);

  // Human-first primary insight with rounded numbers (no decimals, natural language)
  let primaryInsight;
  if (concentration >= 75) {
    primaryInsight = `About three-quarters of your feed came from just ${top10Count} accounts`;
  } else if (concentration >= 65) {
    primaryInsight = `About two-thirds of your feed came from just ${top10Count} accounts`;
  } else if (concentration >= 60) {
    primaryInsight = `About three-fifths of your feed came from just ${top10Count} accounts`;
  } else if (concentration >= 50) {
    primaryInsight = `About half of your feed came from ${top10Count} accounts`;
  } else if (concentration >= 40) {
    primaryInsight = `About two-fifths of your feed came from ${top10Count} accounts`;
  } else if (concentration >= 30) {
    primaryInsight = `About a third of your feed came from ${top10Count} accounts`;
  } else {
    primaryInsight = `Your feed came from a mix of sources. ${top10Count} accounts accounted for about ${roundedConcentration}%`;
  }

  // Oura-style context line: calm, non-judgmental, acknowledges intentionality
  const contextLine = 'Seeing the same accounts repeatedly can feel familiar or limiting, depending on what you\'re hoping to see.';

  // Top creators list (secondary evidence)
  const topCreators = sortedCreators.slice(0, 10).map((c, idx) => ({
    rank: idx + 1,
    creator: normalizeCreatorName(c.displayName), // FIX C2
    posts: c.totalPosts,
    share: Math.round((c.totalPosts / totalPosts) * 100),
  }));

  return createResponse(
    true,
    {
      primaryInsight,
      contextLine,
      topCreators,
      top10Count,
      // Keep qualitativeLabel for backward compatibility
      qualitativeLabel: primaryInsight,
    },
    null,
    creatorsData.scansUsed,
    creatorsData.scansWithData
  );
}

/**
 * View 33: New vs familiar creators
 */
export function getNewVsFamiliarData(scans, scanDetails) {
  const discovery = getDiscoveryRateData(scans, scanDetails);
  if (!discovery.hasData) return discovery;

  const newPercent = discovery.data.discoveryRate;
  const familiarPercent = 100 - newPercent;

  return createResponse(
    true,
    {
      segments: [
        { label: 'New creators', value: newPercent, color: '#3B82F6' },
        { label: 'Familiar creators', value: familiarPercent, color: '#94A3B8' },
      ],
    },
    null,
    discovery.scansUsed,
    discovery.scansWithData
  );
}

/**
 * View 34: Creators by Topic
 * PHASE 6A: Maps which creators dominate which topics
 */
export function getCreatorsByTopicData(scans, scanDetails) {
  const creatorTopics = aggregateCreatorTopics(scans, scanDetails);

  if (creatorTopics.totalPairs < 10) {
    return createResponse(
      false,
      null,
      `Need more creator-topic pairs (found ${creatorTopics.totalPairs}/10 minimum).`,
      creatorTopics.scansUsed,
      []
    );
  }

  // Build table data
  const rows = creatorTopics.topCreatorsByTopic.map(t => ({
    topic: t.topic,
    topCreator: t.topCreator,
    share: `${t.topCreatorShare}%`,
    count: t.topCreatorCount,
    creatorCount: t.creatorCount,
  }));

  // Generate takeaway
  const topRow = rows[0];
  let takeaway = null;
  if (topRow && topRow.creatorCount <= 2) {
    takeaway = `Most of your "${topRow.topic}" posts come from ${topRow.creatorCount} creator${topRow.creatorCount > 1 ? 's' : ''}. Following one new ${topRow.topic.toLowerCase()} creator could diversify this topic.`;
  }

  return createResponse(
    true,
    {
      rows,
      takeaway,
      totalPairs: creatorTopics.totalPairs,
    },
    null,
    creatorTopics.scansUsed,
    []
  );
}

/**
 * View 35: Creators by Emotional Tone
 * PHASE 6A: Only works if per-item emotion data exists
 */
export function getCreatorsByToneData(scans, scanDetails) {
  const creatorTones = aggregateCreatorTones(scans, scanDetails);

  if (!creatorTones.hasPerItemData) {
    return createResponse(
      false,
      null,
      `Per-item emotion data not available. Missing: ${creatorTones.missingField}`,
      0,
      [],
      { missingField: creatorTones.missingField }
    );
  }

  if (creatorTones.topCreatorsByTone.length === 0) {
    return createResponse(
      false,
      null,
      'Not enough creator-tone pairs to analyze.',
      creatorTones.scansUsed,
      []
    );
  }

  // Build table data
  const rows = creatorTones.topCreatorsByTone.map(c => ({
    creator: normalizeCreatorName(c.displayName), // FIX C2
    dominantTone: c.dominantTone,
    negativePercent: `${c.negativePercent}%`,
    positivePercent: `${c.positivePercent}%`,
    posts: c.totalPosts,
  }));

  return createResponse(
    true,
    {
      rows,
      totalPairs: creatorTones.totalPairs,
    },
    null,
    creatorTones.scansUsed,
    []
  );
}

export function getCrossplatformCreatorData(scans, scanDetails) {
  const creatorsData = aggregateCreators(scans, scanDetails);
  const platforms = Object.keys(creatorsData.byPlatform);

  if (platforms.length < 2) {
    return createResponse(
      false,
      null,
      'Need scans from at least 2 platforms.',
      creatorsData.scansUsed,
      creatorsData.scansWithData
    );
  }

  const overlapping = creatorsData.crossPlatformCreators
    .slice(0, 10)
    .map(c => ({
      creator: normalizeCreatorName(c.displayName), // FIX C2
      platforms: c.platforms.join(', '),
    }));

  if (overlapping.length === 0) {
    return createResponse(
      true,
      { overlapping: [], message: 'No creators found across multiple platforms.' },
      null,
      creatorsData.scansUsed,
      creatorsData.scansWithData
    );
  }

  return createResponse(
    true,
    { overlapping },
    null,
    creatorsData.scansUsed,
    creatorsData.scansWithData
  );
}

export function getVoiceDiversityData(scans, scanDetails) {
  const concentration = getCreatorConcentrationData(scans, scanDetails);
  const discovery = getDiscoveryRateData(scans, scanDetails);
  const topics = getTopicVarietyData(scans, scanDetails);

  let diversity = 'moderate';
  const factors = [];
  let totalScansUsed = 0;
  const allScansWithData = new Set();

  if (concentration.hasData) {
    totalScansUsed = Math.max(totalScansUsed, concentration.scansUsed);
    concentration.scansWithData.forEach(id => allScansWithData.add(id));

    if (concentration.data.concentration > 70) {
      diversity = 'low';
      factors.push('Few creators dominate your feed');
    } else if (concentration.data.concentration < 40) {
      diversity = 'high';
      factors.push('Many different creators appear');
    }
  }

  if (discovery.hasData) {
    totalScansUsed = Math.max(totalScansUsed, discovery.scansUsed);
    discovery.scansWithData.forEach(id => allScansWithData.add(id));

    if (discovery.data.discoveryRate < 10) {
      if (diversity !== 'low') diversity = 'low';
      factors.push('Few new creators appearing');
    }
  }

  if (factors.length === 0 && !concentration.hasData) {
    return createResponse(
      false,
      null,
      'Need creator data to assess voice diversity.',
      0,
      []
    );
  }

  return createResponse(
    true,
    { diversity, factors },
    null,
    totalScansUsed,
    Array.from(allScansWithData)
  );
}

export function getInfluentialCreatorsData(scans, scanDetails) {
  const topCreators = getTopCreatorsData(scans, scanDetails);
  const promoCreators = getPromoCreatorsData(scans, scanDetails);
  const politicalCreators = getPoliticalCreatorsData(scans, scanDetails);

  if (!topCreators.hasData) {
    return createResponse(false, null, 'Need creator data.', 0, []);
  }

  const top3 = topCreators.data.slice(0, 3).map(c => {
    const promo = promoCreators.hasData && promoCreators.data.find(p => p.creator === c.creator);
    const political = politicalCreators.hasData && politicalCreators.data.find(p => p.creator === c.creator);

    const contributions = [];
    if (promo) contributions.push('promotions');
    if (political) contributions.push('politics');
    if (contributions.length === 0) contributions.push('general content');

    return { creator: c.creator, share: c.share, contributions: contributions.join(', ') };
  });

  return createResponse(
    true,
    top3,
    null,
    topCreators.scansUsed,
    topCreators.scansWithData
  );
}

// =====================================================
// TAB 5: WHAT THE ALGORITHM THINKS ABOUT YOU
// Phase 5: Uses aggregated data from all tabs
// =====================================================

/**
 * View 41: Topics the algorithm thinks you like
 * PHASE 5: Uses aggregateTopics for multi-scan aggregation
 */
export function getAlgoTopicsLikedData(scans, scanDetails) {
  const topicsData = aggregateTopics(scans, scanDetails);

  if (topicsData.scansUsed === 0) {
    return createResponse(false, null, 'No topic data available.', 0, []);
  }

  const sorted = Object.entries(topicsData.topics)
    .map(([topic, score]) => ({
      topic,
      score,
      isUnclassified: topic === UNCLASSIFIED_TOPIC,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const hasUnclassified = sorted.some(t => t.isUnclassified);

  // Return with additional metadata for the view
  const result = createResponse(
    true,
    sorted,
    null,
    topicsData.scansUsed,
    topicsData.scansWithData
  );
  result.hasUnclassified = hasUnclassified;
  result.unclassifiedNote = hasUnclassified ? "Some content can't be reliably categorized yet." : null;

  const microSegments = sorted
    .filter(t => !t.isUnclassified)
    .slice(0, 3)
    .map(t => ({
      label: normalizeTopicLabel ? normalizeTopicLabel(t.topic) : t.topic,
      value: Math.round((t.score || 0) * 100),
    }))
    .filter(s => s.label && s.value > 0);
  if (microSegments.length > 0) {
    result.micro = {
      type: 'segments',
      segments: microSegments,
    };
  }

  return result;
}

/**
 * View 42: Topics the algorithm thinks you avoid
 * PHASE 6A: Uses observed topic universe (renamed to "Topics that rarely show up")
 */
export function getAlgoTopicsAvoidedData(scans, scanDetails) {
  const universe = buildTopicUniverse(scans, scanDetails);
  const rare = deriveRareTopics(universe);

  if (!rare.hasData) {
    return createResponse(
      false,
      null,
      rare.reason || 'Need more topic data to identify rarely-shown topics.',
      universe.scansUsed,
      []
    );
  }

  // Combine rare topics and blind spots
  const rarelyShown = [...rare.rareTopics.map(t => t.topic), ...rare.blindSpots]
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .slice(0, 8);

  if (rarelyShown.length === 0) {
    return createResponse(
      true,
      {
        topics: [],
        message: 'No topics are significantly underrepresented in your feed.',
        confidence: rare.confidence,
      },
      null,
      universe.scansUsed,
      []
    );
  }

  return createResponse(
    true,
    {
      topics: rarelyShown,
      confidence: rare.confidence,
      note: 'These topics rarely appear in your feed based on observed content.',
    },
    null,
    universe.scansUsed,
    []
  );
}

/**
 * View 43: Products the algorithm thinks you're receptive to
 */
export function getAlgoProductsData(scans, scanDetails) {
  return getProductMentionsData(scans, scanDetails);
}

/**
 * View 44: Political themes the algorithm thinks matter to you
 * BLOCKED: Requires political theme extraction
 */
export function getAlgoPoliticalThemesData() {
  return createResponse(false, null, 'Political theme extraction not available.', 0, []);
}

/**
 * View 45: Emotional triggers the algorithm responds to
 */
export function getAlgoEmotionalTriggersData(scans, scanDetails) {
  return getEmotionalWeightData(scans, scanDetails);
}

/**
 * View 46: What the algorithm is confident about
 */
export function getAlgoConfidentData(scans, scanDetails) {
  const topicsData = aggregateTopics(scans, scanDetails);
  const stability = calculateStability(topicsData, scans, scanDetails);

  if (topicsData.scansUsed < 2) {
    return createResponse(
      false,
      null,
      'We did not detect strong recurring themes in your scanned posts yet.',
      topicsData.scansUsed,
      topicsData.scansWithData
    );
  }

  // Get top 3 unique topics (deduplicated by normalized topic name)
  const sortedTopics = Object.entries(topicsData.topics)
    .filter(([topic]) => topic !== UNCLASSIFIED_TOPIC)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (sortedTopics.length === 0) {
    return createResponse(
      false,
      null,
      'We did not detect strong recurring themes in your scanned posts yet.',
      topicsData.scansUsed,
      topicsData.scansWithData
    );
  }

  // Build summary themes and evidence
  const summaryThemes = sortedTopics.map(([topic]) => topic);
  const evidence = sortedTopics.map(([topic, percentage]) => ({
    theme: topic,
    percentage: Math.round(percentage * 100), // Convert to 0-100%
    scanCount: topicsData.topicCounts[topic] || 0,
  }));

  return createResponse(
    true,
    {
      summaryThemes,
      evidence,
      isStable: stability.hasData && stability.overlapPercent > 60,
    },
    null,
    topicsData.scansUsed,
    topicsData.scansWithData
  );
}

/**
 * View 47: What the algorithm is uncertain about
 */
export function getAlgoUncertainData(scans, scanDetails) {
  const topicsData = aggregateTopics(scans, scanDetails);
  const stability = calculateStability(topicsData, scans, scanDetails);

  if (topicsData.scansUsed < 2) {
    return createResponse(
      false,
      null,
      'Need at least 2 scans.',
      topicsData.scansUsed,
      topicsData.scansWithData
    );
  }

  if (!stability.hasData) {
    return createResponse(
      false,
      null,
      'Need topic data.',
      topicsData.scansUsed,
      topicsData.scansWithData
    );
  }

  const insights = [];
  if (stability.overlapPercent < 50) {
    insights.push('Your topics vary significantly between scans, suggesting the algorithm is still learning your preferences.');
  } else {
    insights.push('Your feed appears relatively stable. The algorithm seems confident about your interests.');
  }

  return createResponse(
    true,
    { insights },
    null,
    topicsData.scansUsed,
    topicsData.scansWithData
  );
}

/**
 * View 48: How narrow or broad your inferred profile is
 */
export function getProfileBreadthData(scans, scanDetails) {
  const topics = getTopicVarietyData(scans, scanDetails);
  const concentration = getCreatorConcentrationData(scans, scanDetails);

  let breadth = 'Moderate';
  const factors = [];
  let totalScansUsed = 0;
  const allScansWithData = new Set();

  if (topics.hasData) {
    totalScansUsed = Math.max(totalScansUsed, topics.scansUsed);
    topics.scansWithData.forEach(id => allScansWithData.add(id));

    if (topics.data.topicCount > 10) {
      breadth = 'Broad';
      factors.push('Many different topics');
    } else if (topics.data.topicCount < 5) {
      breadth = 'Narrow';
      factors.push('Few topics');
    }
  }

  if (concentration.hasData) {
    totalScansUsed = Math.max(totalScansUsed, concentration.scansUsed);
    concentration.scansWithData.forEach(id => allScansWithData.add(id));

    if (concentration.data.concentration > 70) {
      if (breadth !== 'Narrow') breadth = 'Narrow';
      factors.push('Few creators dominate');
    } else if (concentration.data.concentration < 40) {
      if (breadth !== 'Broad') breadth = 'Broad';
      factors.push('Many different creators');
    }
  }

  if (factors.length === 0) {
    return createResponse(false, null, 'Need topic and creator data.', 0, []);
  }

  const variant = breadth === 'Broad' ? 'positive' : breadth === 'Narrow' ? 'warning' : 'neutral';

  return createResponse(
    true,
    { breadth, variant, factors },
    null,
    totalScansUsed,
    Array.from(allScansWithData)
  );
}

/**
 * View 49: How this profile may shape future recommendations
 * Grounded in co-occurrence analysis, not repetition
 */
export function getFutureRecommendationsData(scans, scanDetails) {
  // Get top reinforcement themes (from algo-confident logic)
  const topicsData = aggregateTopics(scans, scanDetails);
  const confidentData = getAlgoConfidentData(scans, scanDetails);

  if (topicsData.scansUsed < 2 || !confidentData.hasData) {
    return createResponse(
      false,
      null,
      'We do not have enough consistent co-occurrence signal yet to suggest related future themes.',
      topicsData.scansUsed,
      topicsData.scansWithData
    );
  }

  // Get top 1-2 reinforcement themes
  const topThemes = confidentData.data?.summaryThemes?.slice(0, 2) || [];
  if (topThemes.length === 0) {
    return createResponse(
      false,
      null,
      'We do not have enough consistent co-occurrence signal yet to suggest related future themes.',
      topicsData.scansUsed,
      topicsData.scansWithData
    );
  }

  // Build co-occurrence map: topic -> count of scans where it appears with top themes
  const coOccurrenceCounts = {};
  const topThemeSet = new Set(topThemes);

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const aggregates = getAggregates(detail);
    const topicDistribution = aggregates?.topic_distribution;
    if (!topicDistribution || !Array.isArray(topicDistribution)) continue;

    // Get all topics in this scan
    const scanTopics = new Set(
      topicDistribution
        .map(t => normalizeTopicLabel(t.category))
        .filter(t => t !== UNCLASSIFIED_TOPIC)
    );

    // Check if any top theme appears in this scan
    const hasTopTheme = topThemes.some(theme => scanTopics.has(theme));
    if (!hasTopTheme) continue;

    // Count co-occurring topics (excluding the top themes themselves)
    for (const topic of scanTopics) {
      if (!topThemeSet.has(topic)) {
        coOccurrenceCounts[topic] = (coOccurrenceCounts[topic] || 0) + 1;
      }
    }
  }

  // Get overall topic frequencies for tie-breaking
  const topicFrequencies = topicsData.topics || {};

  // Score and sort co-occurring topics
  const scoredTopics = Object.entries(coOccurrenceCounts)
    .map(([topic, coOccurCount]) => ({
      topic,
      coOccurCount,
      frequency: topicFrequencies[topic] || 0,
    }))
    .sort((a, b) => {
      // Sort by co-occurrence count first, then by overall frequency
      if (b.coOccurCount !== a.coOccurCount) {
        return b.coOccurCount - a.coOccurCount;
      }
      return b.frequency - a.frequency;
    })
    .slice(0, 3); // Top 3 suggestions

  // Check if we have sufficient signal (at least 2 co-occurrence counts)
  const hasSufficientSignal = scoredTopics.length > 0 && scoredTopics.some(t => t.coOccurCount >= 2);

  if (!hasSufficientSignal) {
    return createResponse(
      false,
      null,
      'We do not have enough consistent co-occurrence signal yet to suggest related future themes.',
      topicsData.scansUsed,
      topicsData.scansWithData
    );
  }

  const suggestedThemes = scoredTopics.map(t => t.topic);
  const topTheme = topThemes[0]; // Use first top theme for evidence line

  return createResponse(
    true,
    {
      suggestedThemes,
      topTheme,
      coOccurrenceCounts: scoredTopics.reduce((acc, t) => {
        acc[t.topic] = t.coOccurCount;
        return acc;
      }, {}),
    },
    null,
    topicsData.scansUsed,
    topicsData.scansWithData
  );
}

/**
 * View 50: How to change what the algorithm thinks about you
 * Always available - no data required
 */
export function getAlgoChangeAdviceData() {
  const tips = [
    'Follow creators outside your usual interests',
    'Search for new topics you want to see more of',
    'Mute or unfollow accounts that drive unwanted content',
    'Spend less time on content you want less of',
    'Like and save content you want more of',
  ];

  // This view doesn't depend on scan data
  return createResponse(true, { tips }, null, 0, []);
}

// =====================================================
// MANIPULATIVE PATTERNS METRIC
// =====================================================

/**
 * Get manipulative patterns data (attention tactics)
 * A post is flagged if wellbeing.themes.length > 0 OR engagement_drivers.hooks_detected.length > 0
 *
 * Returns:
 * - primaryValue: count string like "14 posts"
 * - percent: numeric 0-1
 * - percentDisplay: integer percentage (no decimals)
 * - insight: plain-English insight line
 * - status: 'good' | 'neutral' | 'attention' based on percentage thresholds
 */
export function getManipulativePatternsData(scans, scanDetails) {
  const patternsData = aggregateManipulativePatterns(scans, scanDetails);

  if (patternsData.scansUsed === 0 || patternsData.totalItems === 0) {
    return createResponse(
      false,
      null,
      'Need scan data with feed items to analyze attention tactics.',
      0,
      []
    );
  }

  const flaggedCount = patternsData.flaggedItems;
  const totalItems = patternsData.totalItems;
  const percent = patternsData.percentage;
  const percentDisplay = Math.round(percent * 100);

  // Determine status based on thresholds
  let status = 'good';
  if (percentDisplay >= 12) {
    status = 'attention';
  } else if (percentDisplay >= 5) {
    status = 'neutral';
  }

  // Generate insight text
  let insight;
  if (flaggedCount === 0) {
    insight = 'No posts contained patterns often associated with attention-grabbing tactics.';
  } else if (totalItems < 20) {
    insight = `${flaggedCount} of ${totalItems} posts contained patterns often associated with attention-grabbing tactics.`;
  } else if (percentDisplay < 5) {
    insight = `A small portion (${percentDisplay}%) of posts contained patterns often associated with attention-grabbing tactics.`;
  } else if (percentDisplay < 12) {
    insight = `Some posts (${percentDisplay}%) contained patterns often associated with attention-grabbing tactics.`;
  } else {
    insight = `A notable portion (${percentDisplay}%) of posts contained patterns often associated with attention-grabbing tactics.`;
  }

  // Collect examples: top accounts using attention tactics (up to 5)
  const examples = [];
  if (patternsData.byCreator && Object.keys(patternsData.byCreator).length > 0) {
    const sortedCreators = Object.entries(patternsData.byCreator)
      .map(([_, stats]) => ({
        name: stats.displayName,
        count: stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    examples.push(...sortedCreators.map(c => c.name));
  }

  const response = createResponse(
    true,
    {
      currentPercent: percentDisplay,
      flaggedCount,
      totalPosts: totalItems,
      insight,
      status,
      examples: examples.length > 0 ? examples : null,
    },
    null,
    patternsData.scansUsed,
    patternsData.scansWithData
  );
  response.micro = {
    type: 'bar',
    value: percentDisplay,
  };
  return response;
}
