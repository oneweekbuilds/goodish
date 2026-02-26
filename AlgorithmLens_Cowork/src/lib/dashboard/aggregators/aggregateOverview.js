/**
 * Overview Metrics Aggregators
 * Topics, creators, and AI disclosures
 */

import {
  getAggregates,
  getFeedItems,
  normalizeCreatorId,
  normalizeTopicLabel,
  UNCLASSIFIED_TOPIC,
  roundPercentagesToSum100,
} from './aggregatorUtils';

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
 * Aggregate AI-labeled visuals (platform-disclosed) across scans.
 *
 * This aggregator counts visual posts with EXPLICIT platform disclosure signals:
 * - Platform AI labels (Instagram "Made with AI", TikTok "AI generated", etc.)
 * - C2PA / Content Credentials indicators
 *
 * IMPORTANT: This is NOT AI generation detection. It ONLY reports what platforms
 * explicitly disclose via labels or Content Credentials.
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
    const rounded = roundPercentagesToSum100(
      [
        rawPercentages.both,
        rawPercentages.c2paOnly,
        rawPercentages.aiOnly,
        rawPercentages.none,
      ],
      [
        result.buckets.both,
        result.buckets.c2paOnly,
        result.buckets.aiOnly,
        result.buckets.none,
      ]
    );

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
        label: 'Shows where it came from (like a digital receipt)',
        count: c2paCount,
        percentage: c2paPercent,
        color: '#8B5CF6', // Purple - highest confidence
      },
      {
        label: 'App labeled it "Made with AI"',
        count: result.buckets.aiOnly,
        percentage: result.percentages.aiOnly,
        color: '#3B82F6', // Blue - explicit platform disclosure
      },
      {
        label: 'No label',
        count: result.buckets.none,
        percentage: result.percentages.none,
        color: '#94A3B8', // Gray - no disclosure signal
      },
    ];

    // Build simplified 2-segment view (for user-facing dashboard)
    // Signal-based likelihood model: combines all strong AI signals into one bucket
    // Strong signals include: platform AI labels, C2PA indicators, watermarks, etc.
    const likelyAiCount = c2paCount + result.buckets.aiOnly;
    const likelyAiPercent = c2paPercent + result.percentages.aiOnly;
    const noSignalsCount = result.buckets.none;
    const noSignalsPercent = result.percentages.none;

    result.segmentsSimplified = [
      {
        label: 'Likely AI-made',
        count: likelyAiCount,
        percentage: likelyAiPercent,
        color: '#3B82F6', // Blue - likely AI
      },
      {
        label: 'No strong AI signals',
        count: noSignalsCount,
        percentage: noSignalsPercent,
        color: '#94A3B8', // Gray - insufficient evidence
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

      if (!isDemoMode && import.meta.env.DEV) {
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
