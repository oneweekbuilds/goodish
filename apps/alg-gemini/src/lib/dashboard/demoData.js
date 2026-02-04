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
  const isUnlabeledPromo = UNLABELED_PROMO_INDICES.includes(globalIndex)

  const item = {
    id: `${scanId}_item_${globalIndex}`,
    is_ad: isAd,
    position_in_feed: globalIndex % 50, // For post key generation
    created_at: new Date(Date.now() - globalIndex * 3600000).toISOString(), // 1 hour apart
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
  const creatorSet = new Set();
  const creatorPostCounts = {};

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

  // Dev-only self-check (console log only visible when demo mode active)
  // Guard against duplicate logs in React Strict Mode using globalThis
  if (!globalThis.__AL_DEMO_SELF_CHECK_LOGGED__) {
    globalThis.__AL_DEMO_SELF_CHECK_LOGGED__ = true;
    console.log('='.repeat(80));
    console.log('[Demo Mode] Data Generation Self-Check');
    console.log('='.repeat(80));
    console.log('');
    console.log('CORE METRICS:');
    console.log(`  Total scans: ${scans.length} (target: 8)`);
    console.log(`  Total posts: ${totalPosts} (target: 160)`);
    console.log(`  Platforms: ${platforms.length} (instagram, tiktok)`);
    console.log(`  Unique creators: ${creatorSet.size} (target: 15)`);
    console.log('');
    console.log('COMMERCIAL CONTENT:');
    console.log(`  Labeled ads: ${totalAds} (target: 23, ${((totalAds / totalPosts) * 100).toFixed(1)}%)`);
    console.log(`  Unlabeled promo detected: ${unlabeledPromoDetected} (target: 16, ${((unlabeledPromoDetected / totalPosts) * 100).toFixed(1)}%)`);
    console.log(`  Total commercial: ${totalAds + unlabeledPromoDetected} (${(((totalAds + unlabeledPromoDetected) / totalPosts) * 100).toFixed(1)}%)`);
    console.log('');
    console.log('POLITICAL CONTENT:');
    console.log(`  Political posts: ${totalPolitical} (target: 27, ${((totalPolitical / totalPosts) * 100).toFixed(1)}%)`);
    console.log(`  Ideological split (${knownAlignmentTotal} with known stance):`);
    console.log(`    Left: ${alignmentCounts.left} (target: 9, ${knownAlignmentTotal > 0 ? ((alignmentCounts.left / knownAlignmentTotal) * 100).toFixed(0) : 0}%)`);
    console.log(`    Neutral: ${alignmentCounts.neutral} (target: 9, ${knownAlignmentTotal > 0 ? ((alignmentCounts.neutral / knownAlignmentTotal) * 100).toFixed(0) : 0}%)`);
    console.log(`    Right: ${alignmentCounts.right} (target: 9, ${knownAlignmentTotal > 0 ? ((alignmentCounts.right / knownAlignmentTotal) * 100).toFixed(0) : 0}%)`);
    console.log(`  Political tone (${politicalToneTotal} political posts with tone):`);
    console.log(`    Positive: ${politicalToneCounts.POSITIVE} (target: 9, ${politicalToneTotal > 0 ? ((politicalToneCounts.POSITIVE / politicalToneTotal) * 100).toFixed(0) : 0}%)`);
    console.log(`    Neutral: ${politicalToneCounts.NEUTRAL} (target: 9, ${politicalToneTotal > 0 ? ((politicalToneCounts.NEUTRAL / politicalToneTotal) * 100).toFixed(0) : 0}%)`);
    console.log(`    Negative: ${politicalToneCounts.NEGATIVE} (target: 9, ${politicalToneTotal > 0 ? ((politicalToneCounts.NEGATIVE / politicalToneTotal) * 100).toFixed(0) : 0}%)`);
    console.log('');
    console.log('OVERALL TONE:');
    console.log(`  Total with tone: ${knownValenceTotal} (target: 160)`);
    console.log(`    Positive: ${valenceCounts.POSITIVE} (target: 54, ${((valenceCounts.POSITIVE / knownValenceTotal) * 100).toFixed(1)}%)`);
    console.log(`    Neutral: ${valenceCounts.NEUTRAL} (target: 53, ${((valenceCounts.NEUTRAL / knownValenceTotal) * 100).toFixed(1)}%)`);
    console.log(`    Negative: ${valenceCounts.NEGATIVE} (target: 53, ${((valenceCounts.NEGATIVE / knownValenceTotal) * 100).toFixed(1)}%)`);
    console.log('');
    console.log('SELLING VS NOT SELLING:');
    console.log(`  Selling posts: ${totalAds + unlabeledPromoDetected} (39 commercial posts)`);
    console.log(`  Not selling posts: ${totalPosts - (totalAds + unlabeledPromoDetected)} (121 non-commercial posts)`);
    console.log('');
    console.log('SOURCE CONCENTRATION:');
    console.log(`  Top 5 creators: ${top5Percent}% (target: 60-75%)`);
    console.log(`  Top 10 creators: ${top10Percent}%`);
    console.log(`  Top 10 details:`);
    sortedCreators.slice(0, 10).forEach(([handle, count], i) => {
      console.log(`    ${i + 1}. @${handle}: ${count} posts (${((count / totalPosts) * 100).toFixed(1)}%)`);
    });
    console.log('');
    console.log('THRESHOLD VALIDATION:');
    console.log(`  ${totalPosts === 160 ? '✓' : '✗'} Total posts: ${totalPosts} === 160`);
    console.log(`  ${totalAds === 23 ? '✓' : '✗'} Labeled ads: ${totalAds} === 23`);
    console.log(`  ${unlabeledPromoDetected === 16 ? '✓' : '✗'} Unlabeled promo: ${unlabeledPromoDetected} === 16`);
    console.log(`  ${totalAds + unlabeledPromoDetected === 39 ? '✓' : '✗'} Total commercial/selling: ${totalAds + unlabeledPromoDetected} === 39`);
    console.log(`  ${totalPolitical === 27 ? '✓' : '✗'} Political posts: ${totalPolitical} === 27`);
    console.log(`  ${alignmentCounts.left === 9 ? '✓' : '✗'} Left stance: ${alignmentCounts.left} === 9`);
    console.log(`  ${alignmentCounts.neutral === 9 ? '✓' : '✗'} Neutral stance: ${alignmentCounts.neutral} === 9`);
    console.log(`  ${alignmentCounts.right === 9 ? '✓' : '✗'} Right stance: ${alignmentCounts.right} === 9`);
    console.log(`  ${politicalToneCounts.POSITIVE === 9 ? '✓' : '✗'} Political positive tone: ${politicalToneCounts.POSITIVE} === 9`);
    console.log(`  ${politicalToneCounts.NEUTRAL === 9 ? '✓' : '✗'} Political neutral tone: ${politicalToneCounts.NEUTRAL} === 9`);
    console.log(`  ${politicalToneCounts.NEGATIVE === 9 ? '✓' : '✗'} Political negative tone: ${politicalToneCounts.NEGATIVE} === 9`);
    console.log(`  ${valenceCounts.POSITIVE === 54 ? '✓' : '✗'} Overall positive tone: ${valenceCounts.POSITIVE} === 54`);
    console.log(`  ${valenceCounts.NEUTRAL === 53 ? '✓' : '✗'} Overall neutral tone: ${valenceCounts.NEUTRAL} === 53`);
    console.log(`  ${valenceCounts.NEGATIVE === 53 ? '✓' : '✗'} Overall negative tone: ${valenceCounts.NEGATIVE} === 53`);
    console.log(`  ${top5Percent >= 60 && top5Percent <= 75 ? '✓' : '✗'} Top 5 concentration: ${top5Percent}% in range 60-75%`);
    console.log('');
    console.log('='.repeat(80));
  }

  return {
    scans,
    allScans: scans, // Same as scans since there's no filtering in demo mode
    scanDetails,
    loading: false,
    error: null,
    fetchScans: () => {},
    fetchScanDetail: async (scanId) => scanDetails[scanId] || null,
    fetchAllScanDetails: async () => scanDetails,
    hasScans: true,
    hasMultipleScans: scans.length >= 2,
    platforms: platforms,
    hasMultiplePlatforms: platforms.length >= 2,
    totalScanCount: scans.length,
    unfilteredScanCount: scans.length,
  };
}
