/**
 * Demo Data Generator for Dashboard Development
 *
 * Activated ONLY when ?demo=1 is present in URL.
 * Generates realistic scan data that meets ALL thresholds for the locked 6-tab dashboard.
 *
 * DO NOT USE IN PRODUCTION. This is a dev-only helper.
 */

// 15 creators with SKEWED distribution (top 5 will account for 60-75%)
const CREATORS = [
  // Top 5 (will get more posts each)
  'techinfluencer',
  'newsnetwork',
  'fitnessguru',
  'politicalvoice',
  'comedycentral',
  // Others (will get fewer posts)
  'artcollective',
  'brandofficial',
  'localbusiness',
  'celebritychef',
  'musicartist',
  'scienceexplainer',
  'fashionblogger',
  'gamingchannel',
  'traveladventurer',
  'bookreviewer',
];

// 10 advertisers for labeled ads
const ADVERTISERS = [
  'Nike',
  'Samsung',
  'HelloFresh',
  'Skillshare',
  'Nordstrom',
  'Target',
  'Apple',
  'Amazon',
  'Sephora',
  'Adobe',
];

// 8 product categories for ads
const PRODUCT_CATEGORIES = [
  'Fashion & Apparel',
  'Electronics',
  'Food & Beverage',
  'Education',
  'Health & Fitness',
  'Home & Garden',
  'Software',
  'Beauty & Personal Care',
];

// Topic categories for Patterns tab (12 topics)
const TOPICS = [
  'Technology',
  'Politics',
  'Entertainment',
  'Sports',
  'Food',
  'Travel',
  'Fashion',
  'Health',
  'Science',
  'Art',
  'Music',
  'Gaming',
];

// Affiliate signals that detectPossibleInfluence looks for
const UNLABELED_PROMO_CAPTIONS = [
  'Check out my favorite product! Link in bio 🔗',
  'Use my code SAVE20 for 20% off! 🎁',
  'Shop now and get yours today! Limited time offer ⏰',
  'Click the link to get this amazing deal! Tap to shop 🛍️',
  'Get yours now! Use code PROMO for discount 💰',
  'Available now! Swipe up to shop 👆',
  'Order now before it sells out! Buy now 🔥',
  "I'm partnering with this brand! Check it out 🤝",
  'My affiliate link is in my bio! 🔗',
  'Discount code in my story! Coupon code: SAVE15 🎟️',
];

// EXACT position-based post type assignments (160 posts total, indices 0-159)
// These arrays define EXACTLY which posts are which type

// 23 labeled ads (14.4%) - evenly distributed
const AD_INDICES = [0, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91, 98, 105, 112, 119, 126, 133, 140, 147, 154];

// 27 political posts (16.9%) - non-ads, evenly distributed
const POLITICAL_INDICES = [1, 8, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 92, 99, 106, 113, 120, 127, 134, 141, 148, 155, 2, 9, 16, 23];

// 16 unlabeled promo posts (10.0%) - non-ads, non-political
const UNLABELED_PROMO_INDICES = [3, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 94, 101, 108];

// Counters for distributing patterns within post types
let politicalCounter = 0;
let unlabeledPromoCounter = 0;

/**
 * Generate a single feed item with EXACT deterministic patterns
 * Uses explicit position arrays to ensure exact counts
 */
function generateFeedItem(globalIndex, scanId, scanIndex) {
  // Skewed creator distribution: top 5 get 3x more posts
  let creatorIndex;
  if (globalIndex % 8 < 5) {
    // 62.5% of posts go to top 5 creators
    creatorIndex = globalIndex % 5;
  } else {
    // 37.5% of posts go to remaining 10 creators
    creatorIndex = 5 + (globalIndex % 10);
  }
  const creatorHandle = CREATORS[creatorIndex];

  // EXACT post type assignment using position arrays
  const isAd = AD_INDICES.includes(globalIndex);
  const isPolitical = POLITICAL_INDICES.includes(globalIndex);
  const isUnlabeledPromo = UNLABELED_PROMO_INDICES.includes(globalIndex);

  // Source origin: 55% suggested, 45% followed (deterministic pattern)
  // Pattern: if (globalIndex % 20) < 11, then "suggested", else "followed"
  // This gives: 11/20 = 55% suggested, 9/20 = 45% followed
  const sourceOrigin = (globalIndex % 20) < 11 ? 'suggested' : 'followed';

  // Media type: 70% visual (image/video), 30% text-only
  // Pattern: if (globalIndex % 10) < 7, then visual, else text
  // This gives: 7/10 = 70% visual, 3/10 = 30% text
  const isVisual = (globalIndex % 10) < 7;
  const mediaType = isVisual ? (globalIndex % 2 === 0 ? 'image' : 'video') : 'text';

  // AI disclosure fields: ONLY for visual posts
  // Target distribution for visual posts:
  // - C2PA indicator observed: ~5% (6 posts out of 112 visual posts) - rare, cutting-edge
  // - Platform labeled AI: ~15% (17 posts) - more common on platforms
  // - No disclosure observed: ~80% (89 posts) - most common
  let aiDisclosure = null;
  let c2paDisclosure = null;

  if (isVisual) {
    // Count how many visual posts came before this one
    // Visual posts occur at indices: 0,1,2,3,4,5,6, 10,11,12,13,14,15,16, 20,21,22,23,24,25,26, ...
    // Calculate visual post index deterministically
    const visualIndex = Math.floor(globalIndex / 10) * 7 + Math.min(globalIndex % 10, 6);

    // Total visual posts = 160 * 0.7 = 112
    // C2PA indicator observed: first 6 visual posts (~5% of 112)
    // Platform labeled AI: next 17 visual posts (~15% of 112)
    // No disclosure observed: remaining 89 visual posts (~80% of 112)
    if (visualIndex < 6) {
      aiDisclosure = 'NOT_LABELED'; // Has C2PA, so doesn't need platform label
      c2paDisclosure = 'HAS_C2PA';
    } else if (visualIndex < 23) {
      aiDisclosure = 'LABELED_AI';
      c2paDisclosure = 'NO_C2PA';
    } else {
      aiDisclosure = 'NOT_LABELED';
      c2paDisclosure = 'NO_C2PA';
    }
  }

  const item = {
    id: `${scanId}_item_${globalIndex}`,
    is_ad: isAd,
    position_in_feed: globalIndex % 50, // For post key generation
    created_at: new Date(Date.now() - globalIndex * 3600000).toISOString(), // 1 hour apart
    // Content type (replaces old media_type, matches backend schema)
    content_type: mediaType.toUpperCase(), // "IMAGE", "VIDEO", "TEXT"
    // AI disclosure fields (platform-disclosed AI labels and C2PA)
    ...(aiDisclosure !== null && { ai_disclosure: aiDisclosure }),
    ...(c2paDisclosure !== null && { c2pa_disclosure: c2paDisclosure }),
    // Source origin (Suggested vs Followed tab)
    sourceOrigin: sourceOrigin,
    // Creator fields (multiple formats for compatibility)
    creator: {
      handle: creatorHandle,
      name: creatorHandle.charAt(0).toUpperCase() + creatorHandle.slice(1),
    },
    creator_username: creatorHandle,
    author_handle: creatorHandle,
  };

  // Ad metadata for labeled ads
  if (isAd) {
    const advertiserIndex = globalIndex % ADVERTISERS.length;
    const categoryIndex = globalIndex % PRODUCT_CATEGORIES.length;
    item.ad_metadata = {
      advertiser_name: ADVERTISERS[advertiserIndex],
      product_or_service: PRODUCT_CATEGORIES[categoryIndex],
    };
  }

  // Unlabeled promo content - CRITICAL: needs caption/text with affiliate signals
  if (isUnlabeledPromo) {
    const captionIndex = unlabeledPromoCounter % UNLABELED_PROMO_CAPTIONS.length;
    item.caption = UNLABELED_PROMO_CAPTIONS[captionIndex];
    item.text = UNLABELED_PROMO_CAPTIONS[captionIndex];
    // Add affiliate URL pattern
    item.urls = [`https://example.com/product?utm_source=instagram&ref=${creatorHandle}`];
    // Add product mention in ad_metadata (even though not is_ad)
    item.ad_metadata = {
      product_or_service: PRODUCT_CATEGORIES[unlabeledPromoCounter % PRODUCT_CATEGORIES.length],
    };
    unlabeledPromoCounter++;
  }

  // Influence/selling signals (for UI display, but detection happens via text analysis)
  item.influence = {
    is_ad: isAd,
    likely_influence: isUnlabeledPromo,
    triggers: isUnlabeledPromo ? ['affiliate_link', 'discount_code'] : [],
  };

  // Political metadata with EXACT stance distribution (9 Left, 9 Neutral, 9 Right)
  if (isPolitical) {
    // 27 political posts total: first 9 = Left, next 9 = Neutral, last 9 = Right
    let stance;
    if (politicalCounter < 9) {
      stance = 'left';
    } else if (politicalCounter < 18) {
      stance = 'neutral';
    } else {
      stance = 'right';
    }
    item.political = {
      is_political: true,
      stance_or_alignment: stance,
    };
    politicalCounter++;
  } else {
    item.political = {
      is_political: false,
    };
  }

  // Emotions/tone metadata with EXACT distribution
  // Political posts: 9 Positive, 9 Neutral, 9 Negative (in order of political counter)
  // Overall: near-even split (54 Positive, 53 Neutral, 53 Negative)
  let valence;
  if (isPolitical) {
    // For political posts, use the counter position (after increment)
    const politicalIndex = politicalCounter - 1;
    if (politicalIndex < 9) {
      valence = 'POSITIVE';
    } else if (politicalIndex < 18) {
      valence = 'NEUTRAL';
    } else {
      valence = 'NEGATIVE';
    }
  } else {
    // For non-political posts, distribute to get overall near-even split
    // 160 total - 27 political = 133 non-political posts
    // Need: 54 total Positive (9 political + 45 non-political)
    //       53 total Neutral (9 political + 44 non-political)
    //       53 total Negative (9 political + 44 non-political)
    // Distribute: first 45 = Positive, next 44 = Neutral, last 44 = Negative
    const nonPoliticalIndex = globalIndex - politicalCounter;
    if (nonPoliticalIndex < 45) {
      valence = 'POSITIVE';
    } else if (nonPoliticalIndex < 89) {
      valence = 'NEUTRAL';
    } else {
      valence = 'NEGATIVE';
    }
  }
  item.emotions = {
    valence: valence,
  };

  // Topics (deterministic distribution)
  const topicIndex = globalIndex % TOPICS.length;
  item.topics = {
    primary_category: TOPICS[topicIndex],
  };

  return item;
}

/**
 * Generate demo scans and scanDetails
 * Target: 8 scans × 20 items = 160 total posts
 */
export function generateDemoData() {
  // Reset counters for deterministic generation
  politicalCounter = 0;
  unlabeledPromoCounter = 0;

  const scans = [];
  const scanDetails = {};
  const platforms = ['instagram', 'tiktok'];

  let globalIndex = 0;

  // Generate 8 scans (4 per platform)
  for (let scanIndex = 0; scanIndex < 8; scanIndex++) {
    const scanId = `demo_scan_${scanIndex + 1}`;
    const platform = platforms[scanIndex % platforms.length];
    const createdAt = new Date(Date.now() - (8 - scanIndex) * 86400000); // 1 day apart

    // Create scan metadata
    scans.push({
      id: scanId,
      platform: platform,
      created_at: createdAt.toISOString(),
      status: 'completed',
    });

    // Generate 20 feed items per scan
    const feedItems = [];
    const itemCount = 20;

    for (let i = 0; i < itemCount; i++) {
      feedItems.push(generateFeedItem(globalIndex, scanId, scanIndex));
      globalIndex++;
    }

    // Calculate aggregates from feed items (CRITICAL for scanAggregator functions)
    const totalAds = feedItems.filter((item) => item.is_ad).length;
    const politicalItems = feedItems.filter((item) => item.political?.is_political).length;

    // Count valence distribution for wellbeing summary
    const valenceCounts = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0, MIXED: 0 };
    feedItems.forEach((item) => {
      const valence = item.emotions?.valence;
      if (valence && valenceCounts[valence] !== undefined) {
        valenceCounts[valence]++;
      }
    });

    // Create scan detail with aggregates (CRITICAL field)
    scanDetails[scanId] = {
      id: scanId,
      result: {
        feed_items: feedItems,
        platform: platform,
        // Aggregates that scanAggregator functions rely on
        aggregates: {
          total_feed_items: feedItems.length,
          total_ads: totalAds,
          ad_percentage: feedItems.length > 0 ? totalAds / feedItems.length : 0,
          political_content_summary: {
            political_items: politicalItems,
            political_percentage: feedItems.length > 0 ? politicalItems / feedItems.length : 0,
          },
          wellbeing_summary: {
            valence_distribution: valenceCounts,
          },
        },
      },
    };
  }

  // Calculate comprehensive stats for dev-only self-check
  let totalPosts = 0;
  let totalAds = 0;
  let totalPolitical = 0;
  let unlabeledPromoDetected = 0; // What summarizeInfluence will find
  const valenceCounts = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
  const alignmentCounts = { left: 0, neutral: 0, right: 0 };
  const politicalToneCounts = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
  const sourceOriginCounts = { suggested: 0, followed: 0 };
  const creatorSet = new Set();
  const creatorPostCounts = {};
  const aiDisclosureCounts = { HAS_C2PA: 0, LABELED_AI: 0, NO_DISCLOSURE: 0 };
  const contentTypeCounts = { IMAGE: 0, VIDEO: 0, TEXT: 0 };
  let totalVisualPosts = 0;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (detail?.result?.feed_items) {
      const items = detail.result.feed_items;
      totalPosts += items.length;

      for (const item of items) {
        if (item.is_ad) totalAds++;
        if (item.political?.is_political) {
          totalPolitical++;

          // Track political post tone
          const valence = item.emotions?.valence;
          if (valence && politicalToneCounts[valence] !== undefined) {
            politicalToneCounts[valence]++;
          }

          // Track alignment
          const stance = item.political.stance_or_alignment;
          if (stance && alignmentCounts[stance] !== undefined) {
            alignmentCounts[stance]++;
          }
        }

        // Track content types
        const contentType = (item.content_type || '').toUpperCase();
        if (contentTypeCounts[contentType] !== undefined) {
          contentTypeCounts[contentType]++;
        }

        // Track AI disclosure (only for visual posts)
        const isVisual = contentType === 'IMAGE' || contentType === 'VIDEO';
        if (isVisual) {
          totalVisualPosts++;

          // Classify by disclosure signal (prioritize C2PA over platform label)
          if (item.c2pa_disclosure === 'HAS_C2PA') {
            aiDisclosureCounts.HAS_C2PA++;
          } else if (item.ai_disclosure === 'LABELED_AI') {
            aiDisclosureCounts.LABELED_AI++;
          } else {
            aiDisclosureCounts.NO_DISCLOSURE++;
          }
        }

        // Count unlabeled promo (posts with caption/text containing affiliate signals)
        if (!item.is_ad && (item.caption || item.text || item.urls?.length > 0 || item.ad_metadata?.product_or_service)) {
          const text = (item.caption || item.text || '').toLowerCase();
          const hasAffiliateSignal =
            text.includes('link in bio') ||
            text.includes('use code') ||
            text.includes('shop now') ||
            text.includes('discount code') ||
            text.includes('promo code') ||
            (item.urls && item.urls.some((url) => url.includes('utm_') || url.includes('ref='))) ||
            (item.ad_metadata?.product_or_service && !item.is_ad);
          if (hasAffiliateSignal) {
            unlabeledPromoDetected++;
          }
        }

        // Track overall tone
        if (item.emotions?.valence && valenceCounts[item.emotions.valence] !== undefined) {
          valenceCounts[item.emotions.valence]++;
        }

        // Track source origin (Suggested vs Followed)
        if (item.sourceOrigin && sourceOriginCounts[item.sourceOrigin] !== undefined) {
          sourceOriginCounts[item.sourceOrigin]++;
        }

        // Track creators
        if (item.creator?.handle) {
          const handle = item.creator.handle;
          creatorSet.add(handle);
          creatorPostCounts[handle] = (creatorPostCounts[handle] || 0) + 1;
        }
      }
    }
  }

  // Calculate top 5 and top 10 concentration (matching SourcesTab logic exactly)
  const sortedCreators = Object.entries(creatorPostCounts).sort((a, b) => b[1] - a[1]);
  const top5Count = sortedCreators.slice(0, 5).reduce((sum, [_, count]) => sum + count, 0);
  const top10Count = sortedCreators.slice(0, 10).reduce((sum, [_, count]) => sum + count, 0);

  // Calculate and round percentages
  let top5Percent = totalPosts > 0 ? Math.round((top5Count / totalPosts) * 100) : 0;
  let top10Percent = totalPosts > 0 ? Math.round((top10Count / totalPosts) * 100) : 0;
  let othersPercent = 100 - top10Percent;
  othersPercent = Math.round(othersPercent);

  // Ensure top10 + others = 100 (same adjustment as SourcesTab)
  const sum = top10Percent + othersPercent;
  if (sum !== 100) {
    const diff = 100 - sum;
    if (top10Percent >= othersPercent) {
      top10Percent += diff;
    } else {
      othersPercent += diff;
    }
  }

  const knownValenceTotal = valenceCounts.POSITIVE + valenceCounts.NEUTRAL + valenceCounts.NEGATIVE;
  const knownAlignmentTotal = alignmentCounts.left + alignmentCounts.neutral + alignmentCounts.right;
  const politicalToneTotal = politicalToneCounts.POSITIVE + politicalToneCounts.NEUTRAL + politicalToneCounts.NEGATIVE;

  return {
    scans,
    scanDetails,
    loading: false,
    error: false,
    errorMessage: null,
    fetchScans: () => {},
    fetchAllScanDetails: () => {},
    hasScans: scans.length > 0,
    platforms,
    totalScanCount: scans.length,
    unfilteredScanCount: scans.length,
  };
}

