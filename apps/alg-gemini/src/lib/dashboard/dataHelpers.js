/**
 * Data processing helpers for dashboard views.
 * All functions return { hasData: boolean, data: any, missing: string }
 */

/**
 * Format a date to a short label
 */
export function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Process scan for aggregates extraction
 */
function getAggregates(scanDetail) {
  if (!scanDetail) return null;
  const data = scanDetail.result || scanDetail.scan || scanDetail;
  return data.aggregates || null;
}

/**
 * Process scan for feed items extraction
 */
function getFeedItems(scanDetail) {
  if (!scanDetail) return [];
  const data = scanDetail.result || scanDetail.scan || scanDetail;
  return data.feed_items || [];
}

/**
 * Get scan metadata
 */
function getScanMeta(scanDetail) {
  if (!scanDetail) return {};
  const data = scanDetail.result || scanDetail.scan || scanDetail;
  return data.scan_metadata || {};
}

// =====================================================
// TAB 1: ADS & INFLUENCE
// =====================================================

/**
 * View 1: How much of your feed is advertising
 */
export function getAdPercentageData(scans, scanDetails) {
  const dataPoints = [];

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const aggregates = getAggregates(detail);
    if (aggregates && typeof aggregates.ad_percentage === 'number') {
      dataPoints.push({
        scanId: scan.id,
        date: scan.created_at,
        label: formatDateLabel(scan.created_at),
        value: Math.round(aggregates.ad_percentage * 100),
        platform: scan.platform,
      });
    }
  }

  if (dataPoints.length === 0) {
    return { hasData: false, data: null, missing: 'Run at least 1 scan with post-level data.' };
  }

  const latest = dataPoints[0];
  return {
    hasData: true,
    data: {
      currentPercent: latest.value,
      trend: dataPoints.length >= 2 ? dataPoints : null,
    },
    missing: null,
  };
}

/**
 * View 2: Likely promotional posts (not labeled as ads)
 * NOTE: This requires a "likely promotional" classifier which doesn't exist yet
 */
export function getLikelyPromoData(scans, scanDetails) {
  // Not available in current schema
  return {
    hasData: false,
    data: null,
    missing: 'Hidden promo detection is not available yet. This feature requires content analysis beyond current capabilities.',
  };
}

/**
 * View 3: Explicit ads vs hidden promotions
 * NOTE: Requires likely promotional data
 */
export function getAdsVsPromoData(scans, scanDetails) {
  return {
    hasData: false,
    data: null,
    missing: 'Requires both explicit ad detection and hidden promotion detection to compare.',
  };
}

/**
 * View 4: Products mentioned most often
 */
export function getProductMentionsData(scans, scanDetails) {
  const productCounts = {};

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    for (const item of feedItems) {
      const product = item.ad_metadata?.product_or_service;
      if (product && product.trim()) {
        const key = product.trim().toLowerCase();
        productCounts[key] = (productCounts[key] || 0) + 1;
      }
    }
  }

  const sorted = Object.entries(productCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  if (sorted.length === 0) {
    return {
      hasData: false,
      data: null,
      missing: 'No product data extracted from ads yet. Run more scans with ad content.',
    };
  }

  return { hasData: true, data: sorted, missing: null };
}

/**
 * View 5: Who is doing the promoting (creators with promo content)
 */
export function getPromoCreatorsData(scans, scanDetails) {
  const creatorStats = {};

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    for (const item of feedItems) {
      const creator = item.creator?.handle || item.creator?.name;
      if (!creator) continue;

      if (!creatorStats[creator]) {
        creatorStats[creator] = { total: 0, promo: 0 };
      }
      creatorStats[creator].total++;
      if (item.is_ad) {
        creatorStats[creator].promo++;
      }
    }
  }

  const rows = Object.entries(creatorStats)
    .filter(([_, stats]) => stats.promo > 0)
    .map(([creator, stats]) => ({
      creator,
      promoPosts: stats.promo,
      promoPercent: `${Math.round((stats.promo / stats.total) * 100)}%`,
    }))
    .sort((a, b) => b.promoPosts - a.promoPosts)
    .slice(0, 10);

  if (rows.length === 0) {
    return {
      hasData: false,
      data: null,
      missing: 'No creator data with promotional content found. Run more scans.',
    };
  }

  return { hasData: true, data: rows, missing: null };
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

  return {
    hasData: true,
    data: { concentration, totalPromo, top5Count: Math.min(rows.length, 5) },
    missing: null,
  };
}

/**
 * View 7: Promotional themes
 * NOTE: Requires theme classifier which doesn't exist
 */
export function getPromoThemesData(scans, scanDetails) {
  return {
    hasData: false,
    data: null,
    missing: 'Promotional theme detection is not available yet.',
  };
}

/**
 * View 8: Changes in advertising over time
 */
export function getAdTrendData(scans, scanDetails) {
  const result = getAdPercentageData(scans, scanDetails);
  if (!result.hasData || !result.data.trend || result.data.trend.length < 2) {
    return {
      hasData: false,
      data: null,
      missing: 'Need at least 2 scans to show advertising trends over time.',
    };
  }

  const trend = result.data.trend;
  const first = trend[trend.length - 1].value;
  const last = trend[0].value;
  const direction = last > first ? 'rising' : last < first ? 'falling' : 'stable';

  return {
    hasData: true,
    data: { trend, direction, firstValue: first, lastValue: last },
    missing: null,
  };
}

/**
 * View 9: Platforms driving the most promotion
 */
export function getPlatformPromoData(scans, scanDetails) {
  const platformStats = {};

  for (const scan of scans) {
    const platform = scan.platform?.toLowerCase();
    if (!platform) continue;

    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const aggregates = getAggregates(detail);
    if (!aggregates) continue;

    if (!platformStats[platform]) {
      platformStats[platform] = { totalAds: 0, totalPosts: 0 };
    }
    platformStats[platform].totalPosts += aggregates.total_feed_items || 0;
    platformStats[platform].totalAds += Math.round(
      (aggregates.total_feed_items || 0) * (aggregates.ad_percentage || 0)
    );
  }

  const platforms = Object.keys(platformStats);
  if (platforms.length < 2) {
    return {
      hasData: false,
      data: null,
      missing: 'Need scans from at least 2 platforms to compare.',
    };
  }

  const bars = platforms.map(platform => ({
    label: platform.charAt(0).toUpperCase() + platform.slice(1),
    value: platformStats[platform].totalPosts > 0
      ? Math.round((platformStats[platform].totalAds / platformStats[platform].totalPosts) * 100)
      : 0,
  })).sort((a, b) => b.value - a.value);

  return { hasData: true, data: bars, missing: null };
}

/**
 * View 10: What advertisers seem to want from you
 */
export function getAdvertiserInsightsData(scans, scanDetails) {
  const products = getProductMentionsData(scans, scanDetails);
  if (!products.hasData) {
    return {
      hasData: false,
      data: null,
      missing: 'Need product/category data from ad analysis to generate insights.',
    };
  }

  const topProducts = products.data.slice(0, 3).map(p => p.label);
  return {
    hasData: true,
    data: { interests: topProducts },
    missing: null,
  };
}

// =====================================================
// TAB 2: POLITICS & WORLDVIEW
// =====================================================

/**
 * View 11: Political content share
 */
export function getPoliticalShareData(scans, scanDetails) {
  const dataPoints = [];

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const aggregates = getAggregates(detail);
    const politicalPct = aggregates?.political_content_summary?.political_percentage;

    if (typeof politicalPct === 'number') {
      dataPoints.push({
        scanId: scan.id,
        label: formatDateLabel(scan.created_at),
        value: Math.round(politicalPct * 100),
        platform: scan.platform,
      });
    }
  }

  if (dataPoints.length === 0) {
    return {
      hasData: false,
      data: null,
      missing: 'Political classification is not available for your scans.',
    };
  }

  return {
    hasData: true,
    data: {
      currentPercent: dataPoints[0].value,
      trend: dataPoints.length >= 2 ? dataPoints : null,
    },
    missing: null,
  };
}

/**
 * View 12: Political leaning breakdown
 * NOTE: Requires Left/Neutral/Right classification which doesn't exist
 */
export function getPoliticalLeaningData(scans, scanDetails) {
  return {
    hasData: false,
    data: null,
    missing: 'Political leaning classification (Left/Neutral/Right) is not available yet.',
  };
}

/**
 * View 13: Balance vs imbalance
 * NOTE: Requires political leaning data
 */
export function getPoliticalBalanceData(scans, scanDetails) {
  return {
    hasData: false,
    data: null,
    missing: 'Requires political leaning breakdown to assess balance.',
  };
}

/**
 * View 14: Who drives political content
 */
export function getPoliticalCreatorsData(scans, scanDetails) {
  const creatorStats = {};

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    for (const item of feedItems) {
      const creator = item.creator?.handle || item.creator?.name;
      if (!creator) continue;

      if (!creatorStats[creator]) {
        creatorStats[creator] = { total: 0, political: 0 };
      }
      creatorStats[creator].total++;
      if (item.political?.is_political) {
        creatorStats[creator].political++;
      }
    }
  }

  const rows = Object.entries(creatorStats)
    .filter(([_, stats]) => stats.political > 0)
    .map(([creator, stats]) => ({
      creator,
      politicalPosts: stats.political,
      politicalPercent: `${Math.round((stats.political / stats.total) * 100)}%`,
    }))
    .sort((a, b) => b.politicalPosts - a.politicalPosts)
    .slice(0, 10);

  if (rows.length === 0) {
    return {
      hasData: false,
      data: null,
      missing: 'No political content with creator attribution found.',
    };
  }

  return { hasData: true, data: rows, missing: null };
}

/**
 * View 15-20: Various political views requiring unavailable data
 */
export function getPoliticalRepetitionData() {
  return { hasData: false, data: null, missing: 'Political theme clustering is not available yet.' };
}

export function getPoliticalToneData() {
  return { hasData: false, data: null, missing: 'Political tone classification is not available yet.' };
}

export function getPoliticalTrendData(scans, scanDetails) {
  const result = getPoliticalShareData(scans, scanDetails);
  if (!result.hasData || !result.data.trend || result.data.trend.length < 2) {
    return { hasData: false, data: null, missing: 'Need at least 2 scans with political data.' };
  }
  const trend = result.data.trend;
  const direction = trend[0].value > trend[trend.length - 1].value ? 'rising' :
                    trend[0].value < trend[trend.length - 1].value ? 'falling' : 'stable';
  return { hasData: true, data: { trend, direction }, missing: null };
}

export function getPoliticalBlindSpotsData() {
  return { hasData: false, data: null, missing: 'Requires political leaning + theme analysis.' };
}

export function getCrossPlatformPoliticalData(scans, scanDetails) {
  const platformStats = {};

  for (const scan of scans) {
    const platform = scan.platform?.toLowerCase();
    if (!platform) continue;

    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const aggregates = getAggregates(detail);
    const politicalPct = aggregates?.political_content_summary?.political_percentage;

    if (typeof politicalPct === 'number') {
      if (!platformStats[platform]) {
        platformStats[platform] = { sum: 0, count: 0 };
      }
      platformStats[platform].sum += politicalPct;
      platformStats[platform].count++;
    }
  }

  const platforms = Object.keys(platformStats);
  if (platforms.length < 2) {
    return { hasData: false, data: null, missing: 'Need scans from at least 2 platforms.' };
  }

  const bars = platforms.map(p => ({
    label: p.charAt(0).toUpperCase() + p.slice(1),
    value: Math.round((platformStats[p].sum / platformStats[p].count) * 100),
  })).sort((a, b) => b.value - a.value);

  return { hasData: true, data: bars, missing: null };
}

export function getPoliticalProfileData(scans, scanDetails) {
  const political = getPoliticalShareData(scans, scanDetails);
  if (!political.hasData) {
    return { hasData: false, data: null, missing: 'Need political content data to generate insights.' };
  }
  return {
    hasData: true,
    data: { politicalPercent: political.data.currentPercent },
    missing: null,
  };
}

// =====================================================
// TAB 3: PATTERNS IN YOUR FEED
// =====================================================

/**
 * View 21: Topic variety
 */
export function getTopicVarietyData(scans, scanDetails) {
  if (scans.length === 0) {
    return { hasData: false, data: null, missing: 'Run at least 1 scan.' };
  }

  const latestScan = scans[0];
  const detail = scanDetails[latestScan.id];
  if (!detail) {
    return { hasData: false, data: null, missing: 'Scan details not loaded yet.' };
  }

  const aggregates = getAggregates(detail);
  const topics = aggregates?.topic_distribution || [];

  if (topics.length === 0) {
    return { hasData: false, data: null, missing: 'No topic classification data available.' };
  }

  const topTopics = topics.slice(0, 5).map(t => ({
    label: t.category,
    value: Math.round(t.percentage * 100),
  }));

  return {
    hasData: true,
    data: { topicCount: topics.length, topTopics },
    missing: null,
  };
}

/**
 * View 22: Repeated themes (% in top 3 topics)
 */
export function getRepeatedThemesData(scans, scanDetails) {
  const result = getTopicVarietyData(scans, scanDetails);
  if (!result.hasData) return result;

  const top3Percent = result.data.topTopics.slice(0, 3).reduce((sum, t) => sum + t.value, 0);
  return {
    hasData: true,
    data: { top3Percent, topTopics: result.data.topTopics.slice(0, 3) },
    missing: null,
  };
}

/**
 * View 23: Emotional weight (tone breakdown)
 */
export function getEmotionalWeightData(scans, scanDetails) {
  if (scans.length === 0) {
    return { hasData: false, data: null, missing: 'Run at least 1 scan.' };
  }

  const latestScan = scans[0];
  const detail = scanDetails[latestScan.id];
  if (!detail) {
    return { hasData: false, data: null, missing: 'Scan details not loaded yet.' };
  }

  const aggregates = getAggregates(detail);
  const valence = aggregates?.wellbeing_summary?.valence_distribution || {};
  const total = (valence.POSITIVE || 0) + (valence.NEUTRAL || 0) + (valence.NEGATIVE || 0);

  if (total === 0) {
    return { hasData: false, data: null, missing: 'No tone/sentiment data available.' };
  }

  const segments = [
    { label: 'Calm/Positive', value: valence.POSITIVE || 0, color: '#22C55E' },
    { label: 'Neutral', value: valence.NEUTRAL || 0, color: '#94A3B8' },
    { label: 'Intense/Negative', value: valence.NEGATIVE || 0, color: '#EF4444' },
  ];

  const dominant = segments.reduce((a, b) => a.value > b.value ? a : b);
  const intensity = dominant.label === 'Intense/Negative' ? 'heavy' :
                    dominant.label === 'Neutral' ? 'neutral' : 'light';

  return { hasData: true, data: { segments, intensity }, missing: null };
}

/**
 * View 24: Negative vs positive balance
 */
export function getSentimentBalanceData(scans, scanDetails) {
  const result = getEmotionalWeightData(scans, scanDetails);
  if (!result.hasData) return result;

  return {
    hasData: true,
    data: { segments: result.data.segments },
    missing: null,
  };
}

/**
 * View 25: Stability of your feed
 */
export function getFeedStabilityData(scans, scanDetails) {
  if (scans.length < 2) {
    return { hasData: false, data: null, missing: 'Need at least 2 scans to measure stability.' };
  }

  // Compare topic distributions between latest 2 scans
  const scan1 = scanDetails[scans[0].id];
  const scan2 = scanDetails[scans[1].id];

  if (!scan1 || !scan2) {
    return { hasData: false, data: null, missing: 'Scan details not loaded.' };
  }

  const topics1 = getAggregates(scan1)?.topic_distribution || [];
  const topics2 = getAggregates(scan2)?.topic_distribution || [];

  if (topics1.length === 0 || topics2.length === 0) {
    return { hasData: false, data: null, missing: 'Need topic data from both scans.' };
  }

  const categories1 = new Set(topics1.map(t => t.category));
  const categories2 = new Set(topics2.map(t => t.category));
  const overlap = [...categories1].filter(c => categories2.has(c)).length;
  const total = new Set([...categories1, ...categories2]).size;
  const overlapPercent = Math.round((overlap / total) * 100);

  const stability = overlapPercent > 70 ? 'stable' : overlapPercent > 40 ? 'moderate' : 'changing';

  return { hasData: true, data: { overlapPercent, stability }, missing: null };
}

/**
 * View 26: Discovery rate (new creators)
 */
export function getDiscoveryRateData(scans, scanDetails) {
  if (scans.length < 2) {
    return { hasData: false, data: null, missing: 'Need at least 2 scans to measure discovery.' };
  }

  const latestDetail = scanDetails[scans[0].id];
  if (!latestDetail) {
    return { hasData: false, data: null, missing: 'Scan details not loaded.' };
  }

  // Get creators from latest scan
  const latestItems = getFeedItems(latestDetail);
  const latestCreators = new Set();
  latestItems.forEach(item => {
    const creator = item.creator?.handle || item.creator?.name;
    if (creator) latestCreators.add(creator);
  });

  // Get creators from all previous scans
  const pastCreators = new Set();
  for (let i = 1; i < scans.length; i++) {
    const detail = scanDetails[scans[i].id];
    if (!detail) continue;
    const items = getFeedItems(detail);
    items.forEach(item => {
      const creator = item.creator?.handle || item.creator?.name;
      if (creator) pastCreators.add(creator);
    });
  }

  if (latestCreators.size === 0) {
    return { hasData: false, data: null, missing: 'No creator data in latest scan.' };
  }

  const newCreators = [...latestCreators].filter(c => !pastCreators.has(c));
  const discoveryRate = Math.round((newCreators.length / latestCreators.size) * 100);

  return {
    hasData: true,
    data: { discoveryRate, newCount: newCreators.length, totalCreators: latestCreators.size },
    missing: null,
  };
}

/**
 * View 27: Reinforcement warning (echo risk)
 */
export function getEchoRiskData(scans, scanDetails) {
  const stability = getFeedStabilityData(scans, scanDetails);
  const themes = getRepeatedThemesData(scans, scanDetails);

  if (!stability.hasData && !themes.hasData) {
    return { hasData: false, data: null, missing: 'Need topic and stability data.' };
  }

  let riskLevel = 'low';
  const factors = [];

  if (stability.hasData && stability.data.overlapPercent > 80) {
    factors.push('High topic consistency across scans');
    riskLevel = 'moderate';
  }

  if (themes.hasData && themes.data.top3Percent > 70) {
    factors.push('Feed heavily concentrated in few topics');
    riskLevel = factors.length > 1 ? 'high' : 'moderate';
  }

  return {
    hasData: true,
    data: { riskLevel, factors },
    missing: null,
  };
}

/**
 * View 28: Content you almost never see
 */
export function getRareContentData(scans, scanDetails) {
  // This would require a known universe of topics to compare against
  return {
    hasData: false,
    data: null,
    missing: 'Requires a reference topic universe to identify missing content.',
  };
}

/**
 * View 29: Intensity spikes
 */
export function getIntensitySpikesData(scans, scanDetails) {
  if (scans.length < 2) {
    return { hasData: false, data: null, missing: 'Need at least 2 scans.' };
  }

  const dataPoints = [];
  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const aggregates = getAggregates(detail);
    const valence = aggregates?.wellbeing_summary?.valence_distribution || {};
    const total = (valence.POSITIVE || 0) + (valence.NEUTRAL || 0) + (valence.NEGATIVE || 0);

    if (total > 0) {
      const negativePercent = Math.round(((valence.NEGATIVE || 0) / total) * 100);
      dataPoints.push({
        label: formatDateLabel(scan.created_at),
        value: negativePercent,
      });
    }
  }

  if (dataPoints.length < 2) {
    return { hasData: false, data: null, missing: 'Need tone data from at least 2 scans.' };
  }

  return { hasData: true, data: dataPoints, missing: null };
}

/**
 * View 30: What your patterns suggest
 */
export function getPatternSummaryData(scans, scanDetails) {
  const topics = getTopicVarietyData(scans, scanDetails);
  const emotional = getEmotionalWeightData(scans, scanDetails);
  const stability = getFeedStabilityData(scans, scanDetails);

  const insights = [];

  if (topics.hasData) {
    const variety = topics.data.topicCount > 10 ? 'diverse' : topics.data.topicCount > 5 ? 'moderate' : 'narrow';
    insights.push(`Your feed covers ${topics.data.topicCount} topics (${variety} variety).`);
  }

  if (emotional.hasData) {
    insights.push(`Content tone feels ${emotional.data.intensity}.`);
  }

  if (stability.hasData) {
    insights.push(`Feed content is ${stability.data.stability} between scans.`);
  }

  if (insights.length === 0) {
    return { hasData: false, data: null, missing: 'Need more scan data to generate pattern summary.' };
  }

  return { hasData: true, data: { insights }, missing: null };
}

// =====================================================
// TAB 4: CREATORS & VOICES
// =====================================================

/**
 * View 31: Creators you see most
 */
export function getTopCreatorsData(scans, scanDetails) {
  const creatorCounts = {};
  let totalPosts = 0;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    for (const item of feedItems) {
      const creator = item.creator?.handle || item.creator?.name;
      if (creator) {
        creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;
        totalPosts++;
      }
    }
  }

  const rows = Object.entries(creatorCounts)
    .map(([creator, count]) => ({
      creator,
      posts: count,
      share: `${Math.round((count / totalPosts) * 100)}%`,
    }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 10);

  if (rows.length === 0) {
    return { hasData: false, data: null, missing: 'No creator data found in scans.' };
  }

  return { hasData: true, data: rows, missing: null };
}

/**
 * View 32: Creator concentration
 */
export function getCreatorConcentrationData(scans, scanDetails) {
  const result = getTopCreatorsData(scans, scanDetails);
  if (!result.hasData) return result;

  const rows = result.data;
  const totalPosts = rows.reduce((sum, r) => sum + r.posts, 0);
  const top10Posts = rows.slice(0, 10).reduce((sum, r) => sum + r.posts, 0);
  const concentration = Math.round((top10Posts / totalPosts) * 100);

  return {
    hasData: true,
    data: { concentration, top10Count: Math.min(rows.length, 10) },
    missing: null,
  };
}

/**
 * View 33: New vs familiar creators
 */
export function getNewVsFamiliarData(scans, scanDetails) {
  const discovery = getDiscoveryRateData(scans, scanDetails);
  if (!discovery.hasData) return discovery;

  const newPercent = discovery.data.discoveryRate;
  const familiarPercent = 100 - newPercent;

  return {
    hasData: true,
    data: {
      segments: [
        { label: 'New creators', value: newPercent, color: '#3B82F6' },
        { label: 'Familiar creators', value: familiarPercent, color: '#94A3B8' },
      ],
    },
    missing: null,
  };
}

/**
 * View 34-40: Various creator views
 */
export function getCreatorsByTopicData(scans, scanDetails) {
  // Would need topic-per-creator mapping
  return { hasData: false, data: null, missing: 'Creator-topic mapping not available yet.' };
}

export function getCreatorsByToneData(scans, scanDetails) {
  // Would need tone-per-creator aggregation
  return { hasData: false, data: null, missing: 'Creator tone analysis not available yet.' };
}

export function getCrossplatformCreatorData(scans, scanDetails) {
  const platformCreators = {};

  for (const scan of scans) {
    const platform = scan.platform?.toLowerCase();
    if (!platform) continue;

    const detail = scanDetails[scan.id];
    if (!detail) continue;

    if (!platformCreators[platform]) {
      platformCreators[platform] = new Set();
    }

    const feedItems = getFeedItems(detail);
    feedItems.forEach(item => {
      const creator = item.creator?.handle || item.creator?.name;
      if (creator) platformCreators[platform].add(creator);
    });
  }

  const platforms = Object.keys(platformCreators);
  if (platforms.length < 2) {
    return { hasData: false, data: null, missing: 'Need scans from at least 2 platforms.' };
  }

  // Find overlap
  const allCreators = new Map(); // creator -> [platforms]
  for (const [platform, creators] of Object.entries(platformCreators)) {
    for (const creator of creators) {
      if (!allCreators.has(creator)) {
        allCreators.set(creator, []);
      }
      allCreators.get(creator).push(platform);
    }
  }

  const overlapping = [];
  for (const [creator, plats] of allCreators) {
    if (plats.length >= 2) {
      overlapping.push({ creator, platforms: plats.join(', ') });
    }
  }

  if (overlapping.length === 0) {
    return { hasData: true, data: { overlapping: [], message: 'No creators found across multiple platforms.' }, missing: null };
  }

  return { hasData: true, data: { overlapping: overlapping.slice(0, 10) }, missing: null };
}

export function getVoiceDiversityData(scans, scanDetails) {
  const concentration = getCreatorConcentrationData(scans, scanDetails);
  const discovery = getDiscoveryRateData(scans, scanDetails);
  const topics = getTopicVarietyData(scans, scanDetails);

  let diversity = 'moderate';
  const factors = [];

  if (concentration.hasData) {
    if (concentration.data.concentration > 70) {
      diversity = 'low';
      factors.push('Few creators dominate your feed');
    } else if (concentration.data.concentration < 40) {
      diversity = 'high';
      factors.push('Many different creators appear');
    }
  }

  if (discovery.hasData && discovery.data.discoveryRate < 10) {
    if (diversity !== 'low') diversity = 'low';
    factors.push('Few new creators appearing');
  }

  if (factors.length === 0 && !concentration.hasData) {
    return { hasData: false, data: null, missing: 'Need creator data to assess voice diversity.' };
  }

  return {
    hasData: true,
    data: { diversity, factors },
    missing: null,
  };
}

export function getInfluentialCreatorsData(scans, scanDetails) {
  const topCreators = getTopCreatorsData(scans, scanDetails);
  const promoCreators = getPromoCreatorsData(scans, scanDetails);
  const politicalCreators = getPoliticalCreatorsData(scans, scanDetails);

  if (!topCreators.hasData) {
    return { hasData: false, data: null, missing: 'Need creator data.' };
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

  return { hasData: true, data: top3, missing: null };
}

// =====================================================
// TAB 5: WHAT THE ALGORITHM THINKS ABOUT YOU
// =====================================================

/**
 * View 41: Topics the algorithm thinks you like
 */
export function getAlgoTopicsLikedData(scans, scanDetails) {
  // Aggregate topics across all scans
  const topicScores = {};

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const topics = getAggregates(detail)?.topic_distribution || [];
    topics.forEach(t => {
      topicScores[t.category] = (topicScores[t.category] || 0) + t.percentage;
    });
  }

  const sorted = Object.entries(topicScores)
    .map(([topic, score]) => ({ topic, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (sorted.length === 0) {
    return { hasData: false, data: null, missing: 'No topic data available.' };
  }

  return { hasData: true, data: sorted, missing: null };
}

/**
 * View 42: Topics the algorithm thinks you avoid
 */
export function getAlgoTopicsAvoidedData() {
  return { hasData: false, data: null, missing: 'Requires a reference topic universe.' };
}

/**
 * View 43: Products the algorithm thinks you're receptive to
 */
export function getAlgoProductsData(scans, scanDetails) {
  return getProductMentionsData(scans, scanDetails);
}

/**
 * View 44: Political themes the algorithm thinks matter to you
 */
export function getAlgoPoliticalThemesData() {
  return { hasData: false, data: null, missing: 'Political theme extraction not available.' };
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
  if (scans.length < 2) {
    return { hasData: false, data: null, missing: 'Need at least 2 scans to identify patterns.' };
  }

  const stability = getFeedStabilityData(scans, scanDetails);
  const topics = getAlgoTopicsLikedData(scans, scanDetails);

  const insights = [];

  if (stability.hasData && stability.data.overlapPercent > 60) {
    insights.push('Your topic interests appear consistent across scans.');
  }

  if (topics.hasData && topics.data.length > 0) {
    const top = topics.data[0].topic;
    insights.push(`Strong association with "${top}" content.`);
  }

  if (insights.length === 0) {
    return { hasData: false, data: null, missing: 'Not enough consistent patterns found.' };
  }

  return { hasData: true, data: { insights }, missing: null };
}

/**
 * View 47: What the algorithm is uncertain about
 */
export function getAlgoUncertainData(scans, scanDetails) {
  if (scans.length < 2) {
    return { hasData: false, data: null, missing: 'Need at least 2 scans.' };
  }

  const stability = getFeedStabilityData(scans, scanDetails);

  if (!stability.hasData) {
    return { hasData: false, data: null, missing: 'Need topic data.' };
  }

  if (stability.data.overlapPercent < 50) {
    return {
      hasData: true,
      data: { insights: ['Your topics vary significantly between scans, suggesting the algorithm is still learning your preferences.'] },
      missing: null,
    };
  }

  return {
    hasData: true,
    data: { insights: ['Your feed appears relatively stable. The algorithm seems confident about your interests.'] },
    missing: null,
  };
}

/**
 * View 48: How narrow or broad your inferred profile is
 */
export function getProfileBreadthData(scans, scanDetails) {
  const topics = getTopicVarietyData(scans, scanDetails);
  const concentration = getCreatorConcentrationData(scans, scanDetails);

  let breadth = 'Moderate';
  const factors = [];

  if (topics.hasData) {
    if (topics.data.topicCount > 10) {
      breadth = 'Broad';
      factors.push('Many different topics');
    } else if (topics.data.topicCount < 5) {
      breadth = 'Narrow';
      factors.push('Few topics');
    }
  }

  if (concentration.hasData) {
    if (concentration.data.concentration > 70) {
      if (breadth !== 'Narrow') breadth = 'Narrow';
      factors.push('Few creators dominate');
    } else if (concentration.data.concentration < 40) {
      if (breadth !== 'Broad') breadth = 'Broad';
      factors.push('Many different creators');
    }
  }

  if (factors.length === 0) {
    return { hasData: false, data: null, missing: 'Need topic and creator data.' };
  }

  const variant = breadth === 'Broad' ? 'positive' : breadth === 'Narrow' ? 'warning' : 'neutral';

  return { hasData: true, data: { breadth, variant, factors }, missing: null };
}

/**
 * View 49: How this profile may shape future recommendations
 */
export function getFutureRecommendationsData(scans, scanDetails) {
  const topics = getAlgoTopicsLikedData(scans, scanDetails);
  const products = getProductMentionsData(scans, scanDetails);

  const predictions = [];

  if (topics.hasData && topics.data.length > 0) {
    const top = topics.data[0].topic;
    predictions.push(`Because your feed emphasizes "${top}", you'll likely see more similar content.`);
  }

  if (products.hasData && products.data.length > 0) {
    const topProduct = products.data[0].label;
    predictions.push(`Product recommendations may continue focusing on ${topProduct}.`);
  }

  if (predictions.length === 0) {
    return { hasData: false, data: null, missing: 'Need topic or product data.' };
  }

  return { hasData: true, data: { predictions }, missing: null };
}

/**
 * View 50: How to change what the algorithm thinks about you
 * This one is always available - no data required
 */
export function getAlgoChangeAdviceData() {
  const tips = [
    'Follow creators outside your usual interests',
    'Search for new topics you want to see more of',
    'Mute or unfollow accounts that drive unwanted content',
    'Spend less time on content you want less of',
    'Like and save content you want more of',
  ];

  return { hasData: true, data: { tips }, missing: null };
}
