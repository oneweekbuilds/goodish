/**
 * Ads Metrics Aggregators
 * Ads, products, and themes aggregation
 */

import {
  getAggregates,
  getFeedItems,
  formatDateLabel,
  UNCLASSIFIED_TOPIC,
} from './aggregatorUtils';

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
    // Note: adPct from backend is already 0-100 scale
    result.byDate.push({
      date: scan.created_at,
      label: formatDateLabel(scan.created_at),
      value: Math.round(adPct),
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

