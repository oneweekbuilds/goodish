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
  UNCLASSIFIED_TOPIC,
  normalizeTopicLabel,
  formatDateLabel,
} from './scanAggregator';

// Re-export formatDateLabel for backward compatibility
export { formatDateLabel };

// =====================================================
// INTERNAL HELPERS
// =====================================================

/**
 * Create a standardized response with metadata
 */
function createResponse(hasData, data, missing = null, scansUsed = 0, scansWithData = []) {
  return { hasData, data, missing, scansUsed, scansWithData };
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
// TAB 1: ADS & INFLUENCE
// Phase 5: All views now use aggregateAds for consistency
// =====================================================

/**
 * View 1: How much of your feed is advertising
 * PHASE 5 FIX: Now aggregates across ALL scans, not just latest
 * PRIMARY INSIGHT: Uses aggregated ad data across all scans
 */
export function getAdPercentageData(scans, scanDetails) {
  const adsData = aggregateAds(scans, scanDetails);

  if (adsData.scansUsed === 0) {
    return createResponse(false, null, 'Run at least 1 scan with post-level data.');
  }

  return createResponse(
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
    adsData.scansWithData
  );
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
        message: 'No potential promotional signals detected in your feed.',
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
      topSignals: influence.topSignals,
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
 * View 4: Products mentioned most often
 * PHASE 5: Uses aggregateProducts for deduplication
 */
export function getProductMentionsData(scans, scanDetails) {
  const productsData = aggregateProducts(scans, scanDetails);

  if (productsData.scansUsed === 0 || productsData.sortedProducts.length === 0) {
    return createResponse(
      false,
      null,
      'No product data extracted from ads yet. Run more scans with ad content.',
      0,
      []
    );
  }

  // Return top 10 products
  return createResponse(
    true,
    productsData.sortedProducts.slice(0, 10),
    null,
    productsData.scansUsed,
    productsData.scansWithData
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
      creator: c.displayName,
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

  return createResponse(
    true,
    { concentration, totalPromo, top5Count: Math.min(rows.length, 5) },
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
    label: platform.charAt(0).toUpperCase() + platform.slice(1),
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
 */
export function getAdvertiserInsightsData(scans, scanDetails) {
  const products = getProductMentionsData(scans, scanDetails);
  if (!products.hasData) {
    return createResponse(
      false,
      null,
      'Need product/category data from ad analysis to generate insights.',
      0,
      []
    );
  }

  const topProducts = products.data.slice(0, 3).map(p => p.label);
  return createResponse(
    true,
    { interests: topProducts },
    null,
    products.scansUsed,
    products.scansWithData
  );
}

// =====================================================
// TAB 2: POLITICS & WORLDVIEW
// Phase 5: Uses aggregatePolitics for all political views
// =====================================================

/**
 * View 11: Political content share
 * PHASE 5 FIX: Uses aggregated political data
 */
export function getPoliticalShareData(scans, scanDetails) {
  const politicsData = aggregatePolitics(scans, scanDetails);

  if (politicsData.scansUsed === 0) {
    return createResponse(
      false,
      null,
      'Political classification is not available for your scans.',
      0,
      []
    );
  }

  return createResponse(
    true,
    {
      currentPercent: politicsData.politicalPercentageOverall,
      trend: politicsData.byDate.length >= 2 ? politicsData.byDate : null,
      totalPolitical: politicsData.totalPolitical,
      totalPosts: politicsData.totalPosts,
    },
    null,
    politicsData.scansUsed,
    politicsData.scansWithData
  );
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

  if (!leaning.hasData) {
    return createResponse(
      false,
      null,
      `Need at least 5 political posts to estimate leaning (found ${leaning.totalPolitical}).`,
      leaning.scansUsed,
      []
    );
  }

  // Create stacked bar segments
  const segments = [
    { label: 'Left', value: leaning.percentages.left, color: '#3B82F6' },
    { label: 'Neutral', value: leaning.percentages.neutral, color: '#94A3B8' },
    { label: 'Right', value: leaning.percentages.right, color: '#EF4444' },
    { label: 'Unknown', value: leaning.percentages.unknown, color: '#E5E7EB' },
  ];

  return createResponse(
    true,
    {
      segments,
      totalPolitical: leaning.totalPolitical,
      disclaimer: leaning.disclaimer,
      confidence: leaning.confidence,
      takeaway: 'Most of the political content in your feed is categorized as Neutral or Unknown. These are rough estimates, not facts.',
    },
    null,
    leaning.scansUsed,
    []
  );
}

/**
 * View 13: Balance vs imbalance
 * PHASE 6A: Uses heuristic political leaning data (opt-in)
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

  if (!leaning.hasData) {
    return createResponse(
      false,
      null,
      'Need more political content to assess balance.',
      leaning.scansUsed,
      []
    );
  }

  // Calculate balance based on left vs right ratio
  const left = leaning.percentages.left;
  const right = leaning.percentages.right;
  const difference = Math.abs(left - right);

  let status = 'balanced';
  let variant = 'positive';
  let message = 'Your political content appears relatively balanced.';

  if (difference > 40) {
    status = 'heavily skewed';
    variant = 'warning';
    message = `Political content appears heavily skewed (${left > right ? 'left-leaning' : 'right-leaning'}).`;
  } else if (difference > 20) {
    status = 'somewhat skewed';
    variant = 'neutral';
    message = `Political content appears somewhat skewed (${left > right ? 'left-leaning' : 'right-leaning'}).`;
  }

  return createResponse(
    true,
    {
      status,
      variant,
      message,
      leftPercent: left,
      rightPercent: right,
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
    .map(([_, stats]) => ({
      creator: stats.displayName,
      politicalPosts: stats.political,
      politicalPercent: `${Math.round((stats.political / stats.total) * 100)}%`,
    }))
    .sort((a, b) => b.politicalPosts - a.politicalPosts)
    .slice(0, 10);

  if (rows.length === 0) {
    return createResponse(
      false,
      null,
      'No political content with creator attribution found.',
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
    label: p.charAt(0).toUpperCase() + p.slice(1),
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

export function getPoliticalProfileData(scans, scanDetails) {
  const politicsData = aggregatePolitics(scans, scanDetails);

  if (politicsData.scansUsed === 0) {
    return createResponse(
      false,
      null,
      'Need political content data to generate insights.',
      0,
      []
    );
  }

  return createResponse(
    true,
    { politicalPercent: politicsData.politicalPercentageOverall },
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
 * Previously used only the latest scan (scans[0])
 */
export function getTopicVarietyData(scans, scanDetails) {
  const topicsData = aggregateTopics(scans, scanDetails);

  if (topicsData.scansUsed === 0) {
    return createResponse(
      false,
      null,
      'No topic classification data available.',
      0,
      []
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

  return createResponse(
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
    topicsData.scansWithData
  );
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
 * Previously used only the latest scan (scans[0])
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

  const segments = [
    { label: 'Calm/Positive', value: emotionsData.valencePercentages.POSITIVE, color: '#22C55E' },
    { label: 'Neutral', value: emotionsData.valencePercentages.NEUTRAL, color: '#94A3B8' },
    { label: 'Intense/Negative', value: emotionsData.valencePercentages.NEGATIVE, color: '#EF4444' },
  ];

  return createResponse(
    true,
    { segments, intensity: emotionsData.intensity },
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
 * View 25: Stability of your feed
 * PHASE 5: Uses calculateStability from aggregator
 */
export function getFeedStabilityData(scans, scanDetails) {
  const topicsData = aggregateTopics(scans, scanDetails);
  const stability = calculateStability(topicsData, scans, scanDetails);

  if (!stability.hasData) {
    return createResponse(
      false,
      null,
      stability.reason || 'Need at least 2 scans to measure stability.',
      0,
      []
    );
  }

  return createResponse(
    true,
    {
      overlapPercent: stability.overlapPercent,
      stability: stability.stability,
      scansCompared: stability.scansCompared,
    },
    null,
    stability.scansCompared,
    topicsData.scansWithData.slice(0, stability.scansCompared)
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

  return createResponse(
    true,
    {
      riskLevel: echoRisk.riskLevel,
      factors: echoRisk.factors,
      top3Concentration: echoRisk.top3Concentration,
      topicCount: echoRisk.topicCount,
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

  if (topics.hasData) {
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

  const rows = Object.entries(creatorsData.creators)
    .map(([_, c]) => ({
      creator: c.displayName,
      posts: c.totalPosts,
      share: `${Math.round((c.totalPosts / creatorsData.totalPostsWithCreatorData) * 100)}%`,
    }))
    .sort((a, b) => b.posts - a.posts)
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

  // Calculate top 10 concentration
  const sortedCreators = Object.values(creatorsData.creators)
    .sort((a, b) => b.totalPosts - a.totalPosts);

  const top10Posts = sortedCreators.slice(0, 10).reduce((sum, c) => sum + c.totalPosts, 0);
  const totalPosts = creatorsData.totalPostsWithCreatorData;
  const concentration = totalPosts > 0 ? Math.round((top10Posts / totalPosts) * 100) : 0;

  return createResponse(
    true,
    { concentration, top10Count: Math.min(sortedCreators.length, 10) },
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
    creator: c.displayName,
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
      creator: c.displayName,
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
      'Need at least 2 scans to identify patterns.',
      topicsData.scansUsed,
      topicsData.scansWithData
    );
  }

  const insights = [];

  if (stability.hasData && stability.overlapPercent > 60) {
    insights.push('Your topic interests appear consistent across scans.');
  }

  if (Object.keys(topicsData.topics).length > 0) {
    const topTopic = Object.entries(topicsData.topics)
      .sort((a, b) => b[1] - a[1])[0][0];
    insights.push(`Strong association with "${topTopic}" content.`);
  }

  if (insights.length === 0) {
    return createResponse(
      false,
      null,
      'Not enough consistent patterns found.',
      topicsData.scansUsed,
      topicsData.scansWithData
    );
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
 */
export function getFutureRecommendationsData(scans, scanDetails) {
  const topics = getAlgoTopicsLikedData(scans, scanDetails);
  const products = getProductMentionsData(scans, scanDetails);

  const predictions = [];
  let totalScansUsed = 0;
  const allScansWithData = new Set();

  if (topics.hasData && topics.data.length > 0) {
    totalScansUsed = Math.max(totalScansUsed, topics.scansUsed);
    topics.scansWithData.forEach(id => allScansWithData.add(id));

    const top = topics.data[0].topic;
    predictions.push(`Because your feed emphasizes "${top}", you'll likely see more similar content.`);
  }

  if (products.hasData && products.data.length > 0) {
    totalScansUsed = Math.max(totalScansUsed, products.scansUsed);
    products.scansWithData.forEach(id => allScansWithData.add(id));

    const topProduct = products.data[0].label;
    predictions.push(`Product recommendations may continue focusing on ${topProduct}.`);
  }

  if (predictions.length === 0) {
    return createResponse(false, null, 'Need topic or product data.', 0, []);
  }

  return createResponse(
    true,
    { predictions },
    null,
    totalScansUsed,
    Array.from(allScansWithData)
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
