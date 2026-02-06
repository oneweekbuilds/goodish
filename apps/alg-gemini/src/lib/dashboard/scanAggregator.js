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
const UNCLASSIFIED_TOPIC = 'Other / couldn\'t categorize';

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

/**
 * Aggregate ad themes from ad content across all scans.
 *
 * Uses multi-source text analysis:
 * - ad_metadata.product_or_service
 * - content_text.captions (array)
 * - content_text.on_screen_labels (array)
 * - ad_metadata.advertiser_name
 * - ad_metadata.advertiser_domain
 *
 * Groups ads into themes using keyword matching (not ML).
 * Each theme must represent 2+ ads to avoid surfacing single instances.
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Theme summary with examples
 */
export function aggregateAdThemes(scans, scanDetails) {
  const result = {
    themes: {},        // theme -> { count, advertisers: Set(), domains: Set() }
    totalAds: 0,
    scansUsed: 0,
    scansWithData: [],
  };

  if (!scans || scans.length === 0) {
    return result;
  }

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    let hasAdData = false;

    for (const item of feedItems) {
      if (!item.is_ad) continue;

      hasAdData = true;
      result.totalAds++;

      // Collect all text from ad
      const textSources = [
        item.ad_metadata?.product_or_service || '',
        ...(item.content_text?.captions || []),
        ...(item.content_text?.on_screen_labels || []),
      ];
      const allText = textSources.join(' ').toLowerCase();

      // Skip if no meaningful text
      if (!allText.trim()) continue;

      // Match against theme keywords (same as PROMO_THEME_KEYWORDS but expanded)
      let matchedTheme = null;
      const themeKeywords = {
        'Beauty and skincare': ['makeup', 'skincare', 'beauty', 'cosmetic', 'lipstick', 'foundation', 'serum', 'moisturizer', 'cleanser'],
        'Fitness and wellness': ['workout', 'fitness', 'protein', 'supplement', 'gym', 'weight loss', 'diet', 'exercise', 'nutrition'],
        'Finance and investing': ['invest', 'crypto', 'trading', 'stock', 'money', 'finance', 'loan', 'credit', 'bank', 'savings'],
        'Food and dining': ['food', 'recipe', 'restaurant', 'meal', 'cooking', 'snack', 'drink', 'delivery', 'dining'],
        'Technology products': ['app', 'software', 'tech', 'device', 'phone', 'computer', 'gadget', 'laptop', 'tablet'],
        'Home and lifestyle': ['home', 'decor', 'furniture', 'interior', 'household'],
        'Travel and hospitality': ['travel', 'vacation', 'hotel', 'flight', 'booking', 'destination'],
        'Fashion and apparel': ['fashion', 'clothing', 'outfit', 'dress', 'shoes', 'accessories', 'style', 'wear'],
        'Gaming and entertainment': ['game', 'gaming', 'console', 'esports', 'stream', 'play'],
        'Education and courses': ['course', 'learn', 'education', 'training', 'class', 'tutorial'],
        'E-commerce and shopping': ['shop', 'buy', 'sale', 'discount', 'deal', 'store', 'purchase'],
      };

      for (const [theme, keywords] of Object.entries(themeKeywords)) {
        for (const keyword of keywords) {
          if (allText.includes(keyword)) {
            matchedTheme = theme;
            break;
          }
        }
        if (matchedTheme) break;
      }

      // Only track if we found a theme
      if (matchedTheme) {
        if (!result.themes[matchedTheme]) {
          result.themes[matchedTheme] = {
            count: 0,
            advertisers: new Set(),
            domains: new Set(),
          };
        }

        const theme = result.themes[matchedTheme];
        theme.count++;

        if (item.ad_metadata?.advertiser_name) {
          theme.advertisers.add(item.ad_metadata.advertiser_name);
        }
        if (item.ad_metadata?.advertiser_domain) {
          theme.domains.add(item.ad_metadata.advertiser_domain);
        }
      }
    }

    if (hasAdData) {
      result.scansUsed++;
      result.scansWithData.push(scan.id);
    }
  }

  // Convert Sets to arrays and calculate percentages
  // Filter out themes with only 1 ad (not enough for a pattern)
  const themesArray = Object.entries(result.themes)
    .filter(([_, data]) => data.count >= 2) // Must have 2+ ads
    .map(([theme, data]) => ({
      theme,
      count: data.count,
      percentage: result.totalAds > 0 ? Math.round((data.count / result.totalAds) * 100) : 0,
      advertisers: Array.from(data.advertisers).slice(0, 2), // Max 2 examples
      domains: Array.from(data.domains).slice(0, 2), // Max 2 examples
    }))
    .sort((a, b) => b.count - a.count);

  return {
    ...result,
    themesArray,
    hasThemes: themesArray.length > 0,
  };
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
// PHASE 6A: TOPIC UNIVERSE (Unblocks "Content You Almost Never See" + "Topics You Avoid")
// ============================================

/**
 * Build a reference topic universe from ALL observed topics across scans.
 * This is the union of all normalized topics with their total counts and shares.
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} { topics: [{topic, count, share}], totalTopics, totalItems, scansUsed }
 */
export function buildTopicUniverse(scans, scanDetails) {
  const topicCounts = {};
  let totalTaggedItems = 0;
  let scansUsed = 0;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    let scanHasTopicData = false;

    for (const item of feedItems) {
      // Get topic from various possible fields
      const rawTopic = item.topic || item.category || item.content_category;
      if (!rawTopic) continue;

      const topic = normalizeTopicLabel(rawTopic);
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      totalTaggedItems++;
      scanHasTopicData = true;
    }

    if (scanHasTopicData) {
      scansUsed++;
    }
  }

  // Convert to sorted array
  const topics = Object.entries(topicCounts)
    .map(([topic, count]) => ({
      topic,
      count,
      share: totalTaggedItems > 0 ? count / totalTaggedItems : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    topics,
    totalTopics: topics.length,
    totalItems: totalTaggedItems,
    scansUsed,
  };
}

/**
 * Derive topics that rarely appear in the user's feed.
 * Uses the topic universe to identify gaps.
 *
 * Thresholds:
 * - "almost never see" = topics below 2% share but nonzero
 * - "avoided" is renamed to "rarely show up" to avoid implying intent
 *
 * @param {Object} universe - Result from buildTopicUniverse
 * @param {Object} options - { minItems: 20, lowShareThreshold: 0.02 }
 * @returns {Object} { rareTopics, confidence, reason }
 */
export function deriveRareTopics(universe, options = {}) {
  const { minItems = 20, lowShareThreshold = 0.02 } = options;

  // Check if we have enough data
  if (universe.totalItems < minItems) {
    return {
      rareTopics: [],
      confidence: 'LOW',
      reason: `Need more scannable content (${universe.totalItems}/${minItems} items with topics)`,
      hasData: false,
    };
  }

  // Check if most content is unclassified
  const unclassifiedTopic = universe.topics.find(t => t.topic === UNCLASSIFIED_TOPIC);
  const unclassifiedShare = unclassifiedTopic?.share || 0;

  if (unclassifiedShare > 0.5) {
    return {
      rareTopics: [],
      confidence: 'LOW',
      reason: 'Most content could not be classified into topics',
      hasData: false,
    };
  }

  // Find rare topics (low share but nonzero)
  const rareTopics = universe.topics
    .filter(t => t.topic !== UNCLASSIFIED_TOPIC && t.share < lowShareThreshold && t.share > 0)
    .slice(0, 10);

  // Also identify potential blind spots - topics that exist in universe but are very low
  const blindSpots = universe.topics
    .filter(t => t.topic !== UNCLASSIFIED_TOPIC && t.share < 0.01)
    .slice(0, 5);

  return {
    rareTopics: rareTopics.map(t => ({
      topic: t.topic,
      share: Math.round(t.share * 100 * 10) / 10, // One decimal place
      count: t.count,
    })),
    blindSpots: blindSpots.map(t => t.topic),
    confidence: universe.scansUsed >= 3 ? 'MEDIUM' : 'LOW',
    reason: null,
    hasData: true,
    totalTopicsInUniverse: universe.totalTopics,
  };
}

// ============================================
// PHASE 6A: CREATOR-TOPIC MAPPING
// ============================================

/**
 * Aggregate creator-topic relationships across all scans.
 * For each feed item with both a creator and a topic, increment a counter.
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} { creatorTopics, topCreatorsByTopic, scansUsed, totalPairs }
 */
export function aggregateCreatorTopics(scans, scanDetails) {
  const creatorTopics = {}; // creatorId -> { topics: { topic: count }, displayName, totalPosts }
  const topicCreators = {}; // topic -> { creators: { creatorId: count }, totalPosts }
  let totalPairs = 0;
  let scansUsed = 0;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    let scanHasData = false;

    for (const item of feedItems) {
      const creatorId = normalizeCreatorId(item.creator || item.account);
      const rawTopic = item.topic || item.category || item.content_category;

      if (!creatorId || !rawTopic) continue;

      const topic = normalizeTopicLabel(rawTopic);
      if (topic === UNCLASSIFIED_TOPIC) continue; // Skip unclassified

      scanHasData = true;
      totalPairs++;

      // Track creator -> topics
      if (!creatorTopics[creatorId]) {
        creatorTopics[creatorId] = {
          displayName: item.creator?.name || item.creator?.handle || creatorId,
          topics: {},
          totalPosts: 0,
        };
      }
      creatorTopics[creatorId].topics[topic] = (creatorTopics[creatorId].topics[topic] || 0) + 1;
      creatorTopics[creatorId].totalPosts++;

      // Track topic -> creators
      if (!topicCreators[topic]) {
        topicCreators[topic] = { creators: {}, totalPosts: 0 };
      }
      if (!topicCreators[topic].creators[creatorId]) {
        topicCreators[topic].creators[creatorId] = {
          displayName: creatorTopics[creatorId].displayName,
          count: 0,
        };
      }
      topicCreators[topic].creators[creatorId].count++;
      topicCreators[topic].totalPosts++;
    }

    if (scanHasData) {
      scansUsed++;
    }
  }

  // Build top creators by topic table
  const topCreatorsByTopic = Object.entries(topicCreators)
    .map(([topic, data]) => {
      const sortedCreators = Object.entries(data.creators)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3); // Top 3 creators per topic

      const topCreator = sortedCreators[0];
      return {
        topic,
        topCreator: topCreator ? topCreator[1].displayName : null,
        topCreatorShare: topCreator && data.totalPosts > 0
          ? Math.round((topCreator[1].count / data.totalPosts) * 100)
          : 0,
        topCreatorCount: topCreator ? topCreator[1].count : 0,
        totalPosts: data.totalPosts,
        creatorCount: Object.keys(data.creators).length,
      };
    })
    .filter(t => t.topCreator !== null)
    .sort((a, b) => b.totalPosts - a.totalPosts)
    .slice(0, 10); // Top 10 topics

  return {
    creatorTopics,
    topicCreators,
    topCreatorsByTopic,
    scansUsed,
    totalPairs,
  };
}

// ============================================
// PHASE 6A: CREATOR-TONE MAPPING (if per-item emotion data exists)
// ============================================

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

// ============================================
// PHASE 6A: HIDDEN PROMOTION HEURISTIC
// ============================================

// Disclosure keywords (indicate labeled promotional content)
const DISCLOSURE_KEYWORDS = [
  'ad', 'sponsored', 'paid partnership', 'promotion', 'advertisement',
  '#ad', '#sponsored', '#paidpartnership',
];

// Affiliate and CTA signals (may indicate unlabeled influence)
const AFFILIATE_SIGNALS = [
  'use my code', 'use code', 'discount code', 'promo code', 'coupon code',
  'link in bio', 'affiliate', 'shop now', 'limited time', 'sponsored by',
  'check out', 'get yours', 'click the link', 'swipe up', 'tap to shop',
  'available now', 'order now', 'buy now', "i\'m partnering", 'partnership',
];

// URL patterns that suggest affiliate links
const AFFILIATE_URL_PATTERNS = [
  'utm_', 'ref=', 'aff=', 'affiliate', 'partner', 'tracking',
];

// Promotional theme keyword buckets
const PROMO_THEME_KEYWORDS = {
  Beauty: ['makeup', 'skincare', 'beauty', 'cosmetic', 'lipstick', 'foundation', 'serum'],
  Fitness: ['workout', 'fitness', 'protein', 'supplement', 'gym', 'weight loss', 'diet'],
  Finance: ['invest', 'crypto', 'trading', 'stock', 'money', 'finance', 'loan', 'credit'],
  Food: ['food', 'recipe', 'restaurant', 'meal', 'cooking', 'snack', 'drink'],
  Tech: ['app', 'software', 'tech', 'device', 'phone', 'computer', 'gadget'],
  Lifestyle: ['lifestyle', 'home', 'decor', 'travel', 'vacation', 'hotel'],
  Fashion: ['fashion', 'clothing', 'outfit', 'dress', 'shoes', 'accessories'],
  Gaming: ['game', 'gaming', 'console', 'esports', 'stream'],
  Other: [],
};

/**
 * Detect labeled ads in feed items.
 *
 * @param {Array} items - Feed items
 * @returns {Object} { count, items }
 */
export function detectLabeledAds(items) {
  const labeledAds = items.filter(item => item.is_ad === true);
  return {
    count: labeledAds.length,
    items: labeledAds,
  };
}

/**
 * Detect possible promotional content using heuristic signals.
 * This is a CONSERVATIVE estimate with LOW confidence.
 *
 * @param {Array} items - Feed items
 * @returns {Object} { count, items, signalBreakdown, confidence }
 */
export function detectPossibleInfluence(items) {
  const flaggedItems = [];
  const signalCounts = {};

  for (const item of items) {
    // Skip already-labeled ads
    if (item.is_ad) continue;

    const signals = [];
    const text = (item.caption || item.text || item.content || '').toLowerCase();

    // Check for affiliate signals in text
    for (const signal of AFFILIATE_SIGNALS) {
      if (text.includes(signal.toLowerCase())) {
        signals.push('affiliate_language');
        signalCounts['affiliate_language'] = (signalCounts['affiliate_language'] || 0) + 1;
        break;
      }
    }

    // Check for URL patterns (if URLs exist)
    const urls = item.urls || [];
    const urlString = urls.join(' ').toLowerCase();
    for (const pattern of AFFILIATE_URL_PATTERNS) {
      if (urlString.includes(pattern)) {
        signals.push('affiliate_url');
        signalCounts['affiliate_url'] = (signalCounts['affiliate_url'] || 0) + 1;
        break;
      }
    }

    // Check for disclosure keywords that might be informal
    for (const keyword of DISCLOSURE_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        signals.push('disclosure_language');
        signalCounts['disclosure_language'] = (signalCounts['disclosure_language'] || 0) + 1;
        break;
      }
    }

    // Check ad_metadata for product mentions (even if not flagged as ad)
    if (item.ad_metadata?.product_or_service) {
      signals.push('product_mention');
      signalCounts['product_mention'] = (signalCounts['product_mention'] || 0) + 1;
    }

    if (signals.length > 0) {
      flaggedItems.push({
        ...item,
        influenceSignals: signals,
      });
    }
  }

  return {
    count: flaggedItems.length,
    items: flaggedItems,
    signalBreakdown: signalCounts,
    confidence: 'LOW', // Always LOW for heuristic
  };
}

/**
 * Summarize promotional influence across all scans.
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Summary with labeled, possible, and breakdown
 */
export function summarizeInfluence(scans, scanDetails) {
  let totalItems = 0;
  let labeledAds = 0;
  let possibleInfluence = 0;
  const allSignals = {};
  const creatorCounts = {}; // Track creators posting promotional content
  let scansUsed = 0;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    scansUsed++;
    totalItems += feedItems.length;

    const labeled = detectLabeledAds(feedItems);
    labeledAds += labeled.count;

    const possible = detectPossibleInfluence(feedItems);
    possibleInfluence += possible.count;

    // Aggregate signals
    for (const [signal, count] of Object.entries(possible.signalBreakdown)) {
      allSignals[signal] = (allSignals[signal] || 0) + count;
    }

    // Track creators from flagged items
    for (const flaggedItem of possible.items) {
      const creatorId = normalizeCreatorId(flaggedItem.creator || flaggedItem.account);
      if (creatorId) {
        if (!creatorCounts[creatorId]) {
          creatorCounts[creatorId] = {
            displayName: flaggedItem.creator?.name || flaggedItem.creator?.handle || flaggedItem.account?.account_display_name || creatorId,
            count: 0,
          };
        }
        creatorCounts[creatorId].count++;
      }
    }
  }

  // Top signals
  const topSignals = Object.entries(allSignals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([signal, count]) => ({
      signal: signal.replace(/_/g, ' '),
      count,
    }));

  // Top creators with promotional content (up to 5)
  const topCreators = Object.entries(creatorCounts)
    .map(([_, stats]) => ({
      name: stats.displayName,
      count: stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const examples = topCreators.map(c => c.name);

  return {
    totalItems,
    labeledAds,
    labeledShare: totalItems > 0 ? Math.round((labeledAds / totalItems) * 100) : 0,
    possibleInfluence,
    possibleInfluenceShare: totalItems > 0 ? Math.round((possibleInfluence / totalItems) * 100) : 0,
    topSignals,
    examples: examples.length > 0 ? examples : null,
    scansUsed,
    hasData: scansUsed > 0 && totalItems > 0,
    confidence: 'LOW',
    disclaimer: 'This is a best-effort guess based on language patterns, not proof of sponsorship.',
  };
}

/**
 * Classify promotional content into theme buckets.
 * Simple keyword matching, NOT ML.
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Theme breakdown
 */
export function classifyPromoThemes(scans, scanDetails) {
  const themeCounts = {};
  let totalClassified = 0;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);

    for (const item of feedItems) {
      // Only classify ads or possible promotional content
      if (!item.is_ad) continue;

      const text = (item.caption || item.text || item.ad_metadata?.product_or_service || '').toLowerCase();
      let matchedTheme = 'Other';

      for (const [theme, keywords] of Object.entries(PROMO_THEME_KEYWORDS)) {
        if (theme === 'Other') continue;
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            matchedTheme = theme;
            break;
          }
        }
        if (matchedTheme !== 'Other') break;
      }

      themeCounts[matchedTheme] = (themeCounts[matchedTheme] || 0) + 1;
      totalClassified++;
    }
  }

  const themes = Object.entries(themeCounts)
    .map(([theme, count]) => ({
      theme,
      count,
      share: totalClassified > 0 ? Math.round((count / totalClassified) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    themes,
    totalClassified,
    hasData: totalClassified > 0,
    note: 'Themes classified by keyword matching, not ML.',
  };
}

// ============================================
// PHASE 6A: POLITICAL LEANING HEURISTIC (OPT-IN)
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

/**
 * Aggregate AI-labeled visuals (platform-disclosed) across scans.
 *
 * This aggregator counts visual posts with EXPLICIT platform disclosure signals:
 * - Platform AI labels (Instagram "Made with AI", TikTok "AI generated", etc.)
 * - C2PA / Content Credentials indicators
 *
 * IMPORTANT: This is NOT AI generation detection. It ONLY reports what platforms
 * explicitly disclose via labels or Content Credentials.
 *
 * Returns:
 * - totalVisualPosts: count of all visual posts (image/video)
 * - counts: { labeled, hasC2pa, noDisclosure }
 * - percentages: { labeled, hasC2pa, noDisclosure }
 * - hasEnoughData: true if >= 20 visual posts analyzed
 * - segments: composition bar data
 * - scansUsed: number of scans processed
 * - scansWithData: array of scan IDs that contributed data
 *
 * @param {Array} scans - Array of scan objects
 * @param {Object} scanDetails - Map of scan ID to full scan details
 * @returns {Object} Aggregated AI disclosure data
 */
export function aggregateAiDisclosures(scans, scanDetails) {
  const result = {
    totalVisualPosts: 0,
    // Raw counts (can overlap)
    rawCounts: {
      aiLabelPresent: 0,  // Posts with LABELED_AI
      c2paPresent: 0,     // Posts with HAS_C2PA
    },
    // Mutually exclusive buckets for display
    buckets: {
      both: 0,        // Has both AI label AND C2PA
      aiOnly: 0,      // Has AI label but NOT C2PA
      c2paOnly: 0,    // Has C2PA but NOT AI label
      none: 0,        // Has neither
    },
    percentages: {
      both: 0,
      aiOnly: 0,
      c2paOnly: 0,
      none: 0,
    },
    hasEnoughData: false,
    segments: [],
    scansUsed: 0,
    scansWithData: [],
  };

  if (!scans || scans.length === 0) {
    return result;
  }

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    let scanHasVisualPosts = false;

    for (const item of feedItems) {
      // Only count visual content (image/video)
      const contentType = (item.content_type || '').toLowerCase();
      const isVisual = contentType === 'image' || contentType === 'video';

      if (!isVisual) continue;

      result.totalVisualPosts++;
      scanHasVisualPosts = true;

      // Check for disclosure signals
      const hasAiLabel = item.ai_disclosure === 'LABELED_AI';
      const hasC2pa = item.c2pa_disclosure === 'HAS_C2PA';

      // Track raw counts (can overlap)
      if (hasAiLabel) result.rawCounts.aiLabelPresent++;
      if (hasC2pa) result.rawCounts.c2paPresent++;

      // Classify into mutually exclusive buckets
      if (hasAiLabel && hasC2pa) {
        result.buckets.both++;
      } else if (hasAiLabel && !hasC2pa) {
        result.buckets.aiOnly++;
      } else if (!hasAiLabel && hasC2pa) {
        result.buckets.c2paOnly++;
      } else {
        result.buckets.none++;
      }
    }

    if (scanHasVisualPosts) {
      result.scansUsed++;
      result.scansWithData.push(scan.id);
    }
  }

  // Calculate percentages for mutually exclusive buckets
  if (result.totalVisualPosts > 0) {
    const total = result.totalVisualPosts;

    // Calculate raw percentages for 4 buckets
    const rawPercentages = {
      both: (result.buckets.both / total) * 100,
      c2paOnly: (result.buckets.c2paOnly / total) * 100,
      aiOnly: (result.buckets.aiOnly / total) * 100,
      none: (result.buckets.none / total) * 100,
    };

    // Round and adjust to ensure sum = 100
    const rounded = roundPercentagesToSum100([
      rawPercentages.both,
      rawPercentages.c2paOnly,
      rawPercentages.aiOnly,
      rawPercentages.none,
    ]);

    result.percentages = {
      both: rounded[0],
      c2paOnly: rounded[1],
      aiOnly: rounded[2],
      none: rounded[3],
    };

    // Build 3-segment composition bar (merge both+c2paOnly into one C2PA segment)
    // This keeps UI clean while preserving correctness in the data
    const c2paCount = result.buckets.both + result.buckets.c2paOnly;
    const c2paPercent = result.percentages.both + result.percentages.c2paOnly;

    result.segments = [
      {
        label: 'C2PA indicator observed',
        count: c2paCount,
        percentage: c2paPercent,
        color: '#8B5CF6', // Purple - highest confidence
      },
      {
        label: 'Platform labeled AI',
        count: result.buckets.aiOnly,
        percentage: result.percentages.aiOnly,
        color: '#3B82F6', // Blue - explicit platform disclosure
      },
      {
        label: 'No disclosure observed',
        count: result.buckets.none,
        percentage: result.percentages.none,
        color: '#94A3B8', // Gray - no disclosure signal
      },
    ];
  }

  // Require at least 20 visual posts for reliable analysis
  result.hasEnoughData = result.totalVisualPosts >= 20;

  // Dev-only validation log (only runs in non-production builds, once per page load)
  // Skip in demo mode since demo data already has self-check logging
  if (process.env.NODE_ENV !== 'production' && result.totalVisualPosts > 0) {
    // Initialize global guard if not exists
    if (!globalThis.__AL_AI_DISCLOSURE_LOGGED__) {
      globalThis.__AL_AI_DISCLOSURE_LOGGED__ = false;
    }

    // Log once per page load only (not on every render/aggregation)
    if (!globalThis.__AL_AI_DISCLOSURE_LOGGED__) {
      // Check if this is demo mode by looking for demo scan IDs
      const isDemoMode = scans.length > 0 && scans[0].id?.startsWith('demo-');

      if (!isDemoMode) {
        console.info('[AI Disclosure Validation]', {
          totalVisualPosts: result.totalVisualPosts,
          rawCounts: result.rawCounts,
          buckets: result.buckets,
          percentages: result.percentages,
          scansUsed: result.scansUsed,
        });
        globalThis.__AL_AI_DISCLOSURE_LOGGED__ = true;
      }
    }
  }

  return result;
}

/**
 * Aggregate sourceOrigin data across scans (Suggested vs Followed).
 *
 * Returns:
 * - totalSuggested: count of suggested posts
 * - totalFollowed: count of followed posts
 * - totalPosts: total posts analyzed
 * - suggestedPercentage: percentage of suggested posts
 * - followedPercentage: percentage of followed posts
 * - byPlatform: sourceOrigin breakdown by platform
 * - scansUsed: number of scans with sourceOrigin data
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object} Aggregated sourceOrigin data
 */
export function aggregateSourceOrigin(scans, scanDetails) {
  const result = {
    totalSuggested: 0,
    totalFollowed: 0,
    totalPosts: 0,
    suggestedPercentage: 0,
    followedPercentage: 0,
    byPlatform: {}, // platform -> { suggested, followed, total, suggestedPercent, followedPercent }
    scansUsed: 0,
    scansWithData: [],
    hasData: false,
  };

  if (!scans || scans.length === 0) {
    return result;
  }

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    const platform = (scan.platform || 'unknown').toLowerCase();
    let scanHasData = false;

    // Initialize platform data if needed
    if (!result.byPlatform[platform]) {
      result.byPlatform[platform] = {
        suggested: 0,
        followed: 0,
        total: 0,
        suggestedPercent: 0,
        followedPercent: 0,
      };
    }

    for (const item of feedItems) {
      const origin = item.sourceOrigin;

      // Count posts with valid sourceOrigin
      if (origin === 'suggested' || origin === 'followed') {
        scanHasData = true;
        result.totalPosts++;
        result.byPlatform[platform].total++;

        if (origin === 'suggested') {
          result.totalSuggested++;
          result.byPlatform[platform].suggested++;
        } else if (origin === 'followed') {
          result.totalFollowed++;
          result.byPlatform[platform].followed++;
        }
      }
    }

    if (scanHasData) {
      result.scansUsed++;
      result.scansWithData.push(scan.id);
    }
  }

  // Calculate overall percentages
  if (result.totalPosts > 0) {
    result.suggestedPercentage = Math.round((result.totalSuggested / result.totalPosts) * 100);
    result.followedPercentage = Math.round((result.totalFollowed / result.totalPosts) * 100);
    result.hasData = true;
  }

  // Calculate per-platform percentages
  for (const platform of Object.keys(result.byPlatform)) {
    const p = result.byPlatform[platform];
    if (p.total > 0) {
      p.suggestedPercent = Math.round((p.suggested / p.total) * 100);
      p.followedPercent = Math.round((p.followed / p.total) * 100);
    }
  }

  return result;
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
