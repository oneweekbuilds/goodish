/**
 * Canonical Scan Aggregation Layer - Phase 5
 *
 * This module provides the single source of truth for aggregating scan data
 * across all platforms and time periods. All dashboard views should consume
 * data from this layer rather than implementing ad-hoc aggregation.
 *
 * DESIGN PRINCIPLES:
 * - Accept ALL scans as input
 * - Normalize across platforms (TikTok, Instagram, X, etc.)
 * - Deduplicate creators, posts, and topics
 * - Preserve timestamps for time-based trends
 * - Return metadata about what data was actually used
 *
 * NO UI LOGIC IN THIS FILE.
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely extract data from potentially nested scan detail objects.
 * Handles different response shapes from API.
 */
function getScanData(scanDetail) {
  if (!scanDetail) return null;
  return scanDetail.result || scanDetail.scan || scanDetail;
}

/**
 * Extract aggregates from a scan detail
 */
function getAggregates(scanDetail) {
  const data = getScanData(scanDetail);
  return data?.aggregates || null;
}

/**
 * Extract feed items from a scan detail
 */
function getFeedItems(scanDetail) {
  const data = getScanData(scanDetail);
  return data?.feed_items || [];
}

/**
 * Extract scan metadata
 */
function getScanMeta(scanDetail) {
  const data = getScanData(scanDetail);
  return data?.scan_metadata || {};
}

/**
 * Normalize creator identifier for deduplication.
 * Uses handle preferentially, falls back to name.
 * Lowercased for consistency.
 */
function normalizeCreatorId(creator) {
  if (!creator) return null;
  const id = creator.handle || creator.name || creator.account_handle || creator.account_display_name;
  return id ? id.toLowerCase().trim() : null;
}

/**
 * Normalize topic label for aggregation.
 * Combines confusing/unclear categories into one bucket.
 */
const CONFUSING_TOPICS = ['unknown', 'general', 'uncategorized', 'other', 'misc', 'miscellaneous', 'none', 'n/a', ''];
const UNCLASSIFIED_TOPIC = 'Unclassified';

function normalizeTopicLabel(label) {
  if (!label) return UNCLASSIFIED_TOPIC;
  const lower = label.toLowerCase().trim();
  if (CONFUSING_TOPICS.includes(lower)) {
    return UNCLASSIFIED_TOPIC;
  }
  // Capitalize first letter for display
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

/**
 * Generate a unique key for a post to avoid duplicate counting.
 * Uses platform + creator + position as proxy since we don't have post IDs.
 */
function generatePostKey(item, scanId, platform) {
  const creator = normalizeCreatorId(item.creator || item.account);
  const position = item.position_in_feed || 0;
  // Use scanId to ensure posts from different scans are counted
  // (same creator at same position in different scans = different content)
  return `${platform}:${creator}:${position}:${scanId}`;
}

// ============================================
// CORE AGGREGATION FUNCTIONS
// ============================================

/**
 * Aggregate all ads data across scans.
 *
 * Returns:
 * - totalAds: count of ads across all scans
 * - totalPosts: count of all posts across all scans
 * - adPercentageOverall: weighted average ad percentage
 * - byPlatform: ad stats broken down by platform
 * - byDate: ad percentages over time for trends
 * - scansUsed: number of scans that had ad data
 *
 * @param {Array} scans - List of scan objects (from /api/scans)
 * @param {Object} scanDetails - Map of scanId -> scan detail
 * @returns {Object} Aggregated ads data
 */
export function aggregateAds(scans, scanDetails) {
  const result = {
    totalAds: 0,
    totalPosts: 0,
    adPercentageOverall: 0,
    byPlatform: {},  // platform -> { totalAds, totalPosts, adPercentage }
    byDate: [],      // [{ date, label, value, platform, scanId }]
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
    if (!aggregates) continue;

    const platform = (scan.platform || 'unknown').toLowerCase();
    const totalItems = aggregates.total_feed_items || 0;
    const totalAds = aggregates.total_ads || 0;
    const adPct = aggregates.ad_percentage || 0;

    if (totalItems === 0) continue;

    result.scansUsed++;
    result.scansWithData.push(scan.id);
    result.totalPosts += totalItems;
    result.totalAds += totalAds;

    // Platform breakdown
    if (!result.byPlatform[platform]) {
      result.byPlatform[platform] = { totalAds: 0, totalPosts: 0, adPercentage: 0 };
    }
    result.byPlatform[platform].totalPosts += totalItems;
    result.byPlatform[platform].totalAds += totalAds;

    // Time series data (for trend charts)
    // Note: adPct from backend is 0-1, convert to 0-100 for display
    result.byDate.push({
      date: scan.created_at,
      label: formatDateLabel(scan.created_at),
      value: Math.round(adPct * 100),
      platform,
      scanId: scan.id,
    });
  }

  // Calculate overall percentage
  if (result.totalPosts > 0) {
    result.adPercentageOverall = Math.round((result.totalAds / result.totalPosts) * 100);
  }

  // Calculate per-platform percentages
  for (const platform of Object.keys(result.byPlatform)) {
    const p = result.byPlatform[platform];
    p.adPercentage = p.totalPosts > 0 ? Math.round((p.totalAds / p.totalPosts) * 100) : 0;
  }

  // Sort time series by date (oldest first for charts)
  result.byDate.sort((a, b) => new Date(a.date) - new Date(b.date));

  return result;
}

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
 * Aggregate topics across ALL scans.
 *
 * IMPORTANT: This aggregates topic_distribution from ALL scans,
 * not just the latest. This differs from the old getTopicVarietyData
 * which only used the latest scan.
 *
 * Returns:
 * - topics: normalized topic -> total percentage weight
 * - topicCounts: topic -> number of scans it appeared in
 * - uniqueTopicCount: count of distinct topics (excluding Unclassified)
 * - hasUnclassified: whether there's unclassified content
 * - unclassifiedPercentage: % of content that couldn't be classified
 * - scansUsed: number of scans with topic data
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Aggregated topics data
 */
export function aggregateTopics(scans, scanDetails) {
  const result = {
    topics: {},           // normalized topic -> sum of percentages
    topicCounts: {},      // normalized topic -> number of scans it appeared in
    uniqueTopicCount: 0,
    hasUnclassified: false,
    unclassifiedPercentage: 0,
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
    const topicDistribution = aggregates?.topic_distribution;

    if (!topicDistribution || !Array.isArray(topicDistribution) || topicDistribution.length === 0) {
      continue;
    }

    result.scansUsed++;
    result.scansWithData.push(scan.id);

    for (const topic of topicDistribution) {
      const normalized = normalizeTopicLabel(topic.category);
      const percentage = topic.percentage || 0;

      // Sum percentages across scans (will average later)
      result.topics[normalized] = (result.topics[normalized] || 0) + percentage;
      result.topicCounts[normalized] = (result.topicCounts[normalized] || 0) + 1;
    }
  }

  // Average the percentages by number of scans used
  if (result.scansUsed > 0) {
    for (const topic of Object.keys(result.topics)) {
      result.topics[topic] = result.topics[topic] / result.scansUsed;
    }
  }

  // Calculate unique topic count (excluding Unclassified)
  result.uniqueTopicCount = Object.keys(result.topics).filter(t => t !== UNCLASSIFIED_TOPIC).length;

  // Check for unclassified content
  if (result.topics[UNCLASSIFIED_TOPIC]) {
    result.hasUnclassified = true;
    result.unclassifiedPercentage = Math.round(result.topics[UNCLASSIFIED_TOPIC] * 100);
  }

  return result;
}

/**
 * Aggregate creator data across ALL scans with deduplication.
 *
 * Returns:
 * - creators: Map of creatorId -> { displayName, totalPosts, platforms, ads, political }
 * - uniqueCreatorCount: count of distinct creators
 * - byPlatform: platform -> Set of creator IDs
 * - crossPlatformCreators: creators appearing on 2+ platforms
 * - scansUsed: number of scans with creator data
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Aggregated creator data
 */
export function aggregateCreators(scans, scanDetails) {
  const result = {
    creators: {},
    uniqueCreatorCount: 0,
    byPlatform: {},
    crossPlatformCreators: [],
    scansUsed: 0,
    scansWithData: [],
    totalPostsWithCreatorData: 0,
  };

  if (!scans || scans.length === 0) {
    return result;
  }

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    const platform = (scan.platform || 'unknown').toLowerCase();

    if (feedItems.length === 0) continue;

    let hasCreatorData = false;

    for (const item of feedItems) {
      const creatorId = normalizeCreatorId(item.creator || item.account);
      if (!creatorId) continue;

      hasCreatorData = true;
      result.totalPostsWithCreatorData++;

      // Initialize creator entry
      if (!result.creators[creatorId]) {
        result.creators[creatorId] = {
          displayName: item.creator?.name || item.creator?.handle || item.account?.account_display_name || creatorId,
          totalPosts: 0,
          platforms: new Set(),
          ads: 0,
          political: 0,
          scans: new Set(),
        };
      }

      const creator = result.creators[creatorId];
      creator.totalPosts++;
      creator.platforms.add(platform);
      creator.scans.add(scan.id);

      if (item.is_ad) {
        creator.ads++;
      }
      if (item.political?.is_political) {
        creator.political++;
      }

      // Track platform -> creators
      if (!result.byPlatform[platform]) {
        result.byPlatform[platform] = new Set();
      }
      result.byPlatform[platform].add(creatorId);
    }

    if (hasCreatorData) {
      result.scansUsed++;
      result.scansWithData.push(scan.id);
    }
  }

  // Convert Sets to arrays for serialization
  for (const creatorId of Object.keys(result.creators)) {
    const creator = result.creators[creatorId];
    creator.platforms = Array.from(creator.platforms);
    creator.scans = Array.from(creator.scans);
    creator.scanCount = creator.scans.length;
  }

  for (const platform of Object.keys(result.byPlatform)) {
    result.byPlatform[platform] = Array.from(result.byPlatform[platform]);
  }

  // Calculate unique creator count
  result.uniqueCreatorCount = Object.keys(result.creators).length;

  // Find cross-platform creators
  result.crossPlatformCreators = Object.entries(result.creators)
    .filter(([_, c]) => c.platforms.length >= 2)
    .map(([id, c]) => ({
      id,
      displayName: c.displayName,
      platforms: c.platforms,
      totalPosts: c.totalPosts,
    }));

  return result;
}

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

    if (!valence) continue;

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
 * Aggregate products mentioned in ads across ALL scans.
 *
 * Returns:
 * - products: Map of product -> count
 * - sortedProducts: Array of { label, value } sorted by frequency
 * - scansUsed: number of scans with product data
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Aggregated products data
 */
export function aggregateProducts(scans, scanDetails) {
  const result = {
    products: {},
    sortedProducts: [],
    scansUsed: 0,
    scansWithData: [],
    totalAdsWithProducts: 0,
  };

  if (!scans || scans.length === 0) {
    return result;
  }

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    let hasProductData = false;

    for (const item of feedItems) {
      if (!item.is_ad) continue;

      const product = item.ad_metadata?.product_or_service;
      if (!product || !product.trim()) continue;

      hasProductData = true;
      result.totalAdsWithProducts++;

      // Normalize product name (lowercase, trim)
      const normalized = product.trim().toLowerCase();
      result.products[normalized] = (result.products[normalized] || 0) + 1;
    }

    if (hasProductData) {
      result.scansUsed++;
      result.scansWithData.push(scan.id);
    }
  }

  // Sort products by frequency
  result.sortedProducts = Object.entries(result.products)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return result;
}

// ============================================
// DERIVED CALCULATIONS
// ============================================

/**
 * Calculate feed stability by comparing topics across scans.
 *
 * @param {Object} topicsData - Result from aggregateTopics
 * @param {Array} scans - Original scans array
 * @param {Object} scanDetails - Scan details map
 * @returns {Object} Stability assessment
 */
export function calculateStability(topicsData, scans, scanDetails) {
  if (scans.length < 2 || topicsData.scansUsed < 2) {
    return {
      hasData: false,
      reason: 'Need at least 2 scans with topic data',
    };
  }

  // Compare topic distributions across scans
  const scanTopics = [];

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const aggregates = getAggregates(detail);
    const topics = aggregates?.topic_distribution || [];
    if (topics.length === 0) continue;

    const topicSet = new Set(topics.map(t => normalizeTopicLabel(t.category)));
    scanTopics.push({ scanId: scan.id, topics: topicSet });
  }

  if (scanTopics.length < 2) {
    return { hasData: false, reason: 'Insufficient topic data' };
  }

  // Calculate average overlap between consecutive scans
  let totalOverlap = 0;
  let comparisons = 0;

  for (let i = 1; i < scanTopics.length; i++) {
    const current = scanTopics[i].topics;
    const previous = scanTopics[i - 1].topics;
    const union = new Set([...current, ...previous]);
    const intersection = [...current].filter(t => previous.has(t));
    const overlap = union.size > 0 ? (intersection.length / union.size) * 100 : 0;
    totalOverlap += overlap;
    comparisons++;
  }

  const averageOverlap = Math.round(totalOverlap / comparisons);
  let stability = 'moderate';
  if (averageOverlap > 70) stability = 'stable';
  else if (averageOverlap < 40) stability = 'changing';

  return {
    hasData: true,
    overlapPercent: averageOverlap,
    stability,
    scansCompared: scanTopics.length,
  };
}

/**
 * Calculate discovery rate (new creators in most recent scan).
 *
 * @param {Object} creatorsData - Result from aggregateCreators
 * @param {Array} scans - Original scans array
 * @param {Object} scanDetails - Scan details map
 * @returns {Object} Discovery assessment
 */
export function calculateDiscoveryRate(creatorsData, scans, scanDetails) {
  if (scans.length < 2 || creatorsData.scansUsed < 2) {
    return {
      hasData: false,
      reason: 'Need at least 2 scans with creator data',
    };
  }

  // Get creators from latest scan
  const latestScan = scans[0];
  const latestDetail = scanDetails[latestScan.id];
  if (!latestDetail) {
    return { hasData: false, reason: 'Latest scan details not loaded' };
  }

  const latestItems = getFeedItems(latestDetail);
  const latestCreators = new Set();
  latestItems.forEach(item => {
    const creatorId = normalizeCreatorId(item.creator || item.account);
    if (creatorId) latestCreators.add(creatorId);
  });

  if (latestCreators.size === 0) {
    return { hasData: false, reason: 'No creator data in latest scan' };
  }

  // Get creators from all previous scans
  const pastCreators = new Set();
  for (let i = 1; i < scans.length; i++) {
    const detail = scanDetails[scans[i].id];
    if (!detail) continue;
    const items = getFeedItems(detail);
    items.forEach(item => {
      const creatorId = normalizeCreatorId(item.creator || item.account);
      if (creatorId) pastCreators.add(creatorId);
    });
  }

  const newCreators = [...latestCreators].filter(c => !pastCreators.has(c));
  const discoveryRate = Math.round((newCreators.length / latestCreators.size) * 100);

  return {
    hasData: true,
    discoveryRate,
    newCount: newCreators.length,
    totalCreators: latestCreators.size,
    pastCreatorCount: pastCreators.size,
  };
}

/**
 * Calculate echo risk based on topic concentration and stability.
 *
 * @param {Object} topicsData - Result from aggregateTopics
 * @param {Object} stabilityData - Result from calculateStability
 * @returns {Object} Echo risk assessment
 */
export function calculateEchoRisk(topicsData, stabilityData) {
  const factors = [];
  let riskLevel = 'low';

  // Check topic concentration (top 3 topics)
  const topTopics = Object.entries(topicsData.topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const top3Percent = topTopics.reduce((sum, [_, pct]) => sum + pct, 0);
  const top3PercentRounded = Math.round(top3Percent * 100);

  if (top3PercentRounded > 70) {
    factors.push('Feed heavily concentrated in few topics');
    riskLevel = 'moderate';
  }

  // Check stability
  if (stabilityData.hasData && stabilityData.overlapPercent > 80) {
    factors.push('High topic consistency across scans');
    riskLevel = factors.length > 1 ? 'high' : 'moderate';
  }

  // Check topic diversity
  if (topicsData.uniqueTopicCount < 5) {
    factors.push('Limited topic diversity');
    riskLevel = riskLevel === 'low' ? 'moderate' : riskLevel;
  }

  return {
    hasData: topicsData.scansUsed > 0,
    riskLevel,
    factors,
    top3Concentration: top3PercentRounded,
    topicCount: topicsData.uniqueTopicCount,
  };
}

// ============================================
// MASTER AGGREGATION FUNCTION
// ============================================

/**
 * Perform all aggregations at once.
 * This is the primary entry point for the dashboard.
 *
 * @param {Array} scans - List of scan objects
 * @param {Object} scanDetails - Map of scanId -> scan detail
 * @returns {Object} All aggregated data
 */
export function aggregateAllScanData(scans, scanDetails) {
  // Run all core aggregations
  const ads = aggregateAds(scans, scanDetails);
  const politics = aggregatePolitics(scans, scanDetails);
  const topics = aggregateTopics(scans, scanDetails);
  const creators = aggregateCreators(scans, scanDetails);
  const emotions = aggregateEmotions(scans, scanDetails);
  const products = aggregateProducts(scans, scanDetails);

  // Run derived calculations
  const stability = calculateStability(topics, scans, scanDetails);
  const discovery = calculateDiscoveryRate(creators, scans, scanDetails);
  const echoRisk = calculateEchoRisk(topics, stability);

  return {
    // Core aggregations
    ads,
    politics,
    topics,
    creators,
    emotions,
    products,

    // Derived metrics
    stability,
    discovery,
    echoRisk,

    // Metadata
    meta: {
      totalScans: scans.length,
      totalScanDetails: Object.keys(scanDetails).length,
      platforms: [...new Set(scans.map(s => (s.platform || 'unknown').toLowerCase()))],
      dateRange: scans.length > 0 ? {
        oldest: scans[scans.length - 1]?.created_at,
        newest: scans[0]?.created_at,
      } : null,
    },
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format a date to a short label for charts.
 */
function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Export constants for use by data helpers
 */
export { UNCLASSIFIED_TOPIC, CONFUSING_TOPICS, normalizeTopicLabel, normalizeCreatorId, formatDateLabel };
