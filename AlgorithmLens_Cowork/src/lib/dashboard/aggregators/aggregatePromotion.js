/**
 * Promotional Influence Detection & Classification
 * Detects labeled ads, possible influence via heuristics, and classifies promotional themes
 */

import {
  getFeedItems,
  normalizeCreatorId,
} from './aggregatorUtils';

// ============================================
// CONSTANTS
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

// ============================================
// PROMOTION DETECTION FUNCTIONS
// ============================================

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

// Export constants for use by other modules
export { DISCLOSURE_KEYWORDS, AFFILIATE_SIGNALS, AFFILIATE_URL_PATTERNS, PROMO_THEME_KEYWORDS };
