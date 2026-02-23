/**
 * Source Origin Metrics Aggregators
 * Suggested vs. followed content analysis
 */

import {
  getFeedItems,
  normalizeCreatorId,
  normalizeTopicLabel,
  UNCLASSIFIED_TOPIC,
} from './aggregatorUtils';

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

/**
 * Aggregate topics broken down by source origin (suggested vs followed).
 * Answers: "What topics appeared in suggested posts vs posts from followed accounts?"
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object}
 */
export function aggregateTopicsBySourceOrigin(scans, scanDetails) {
  const result = {
    hasData: false,
    suggestedTopics: {},  // topic -> count
    followedTopics: {},   // topic -> count
    suggestedTotal: 0,
    followedTotal: 0,
    topAlgorithmTopics: [],
    topFollowedTopics: [],
    scansUsed: 0,
    scansWithData: [],
  };

  if (!scans || scans.length === 0) return result;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    let scanHasData = false;

    for (const item of feedItems) {
      const origin = item.sourceOrigin;
      const topic = normalizeTopicLabel(item.topics?.primary_category);

      if ((origin === 'suggested' || origin === 'followed') && topic !== UNCLASSIFIED_TOPIC) {
        scanHasData = true;

        if (origin === 'suggested') {
          result.suggestedTopics[topic] = (result.suggestedTopics[topic] || 0) + 1;
          result.suggestedTotal++;
        } else {
          result.followedTopics[topic] = (result.followedTopics[topic] || 0) + 1;
          result.followedTotal++;
        }
      }
    }

    if (scanHasData) {
      result.scansUsed++;
      result.scansWithData.push(scan.id);
    }
  }

  // Need at least 10 posts in each group with topic data
  if (result.suggestedTotal < 10 || result.followedTotal < 10) {
    return result;
  }

  result.hasData = true;

  // Build top topics for each origin
  const buildTopTopics = (topicCounts, total) => {
    return Object.entries(topicCounts)
      .map(([topic, count]) => ({
        topic,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  result.topAlgorithmTopics = buildTopTopics(result.suggestedTopics, result.suggestedTotal);
  result.topFollowedTopics = buildTopTopics(result.followedTopics, result.followedTotal);

  return result;
}

/**
 * Aggregate ad/commercial content broken down by source origin.
 * Answers: "Are suggested posts more commercial than what I follow?"
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object}
 */
export function aggregateAdsBySourceOrigin(scans, scanDetails) {
  const result = {
    hasData: false,
    suggestedAds: 0,
    suggestedTotal: 0,
    followedAds: 0,
    followedTotal: 0,
    suggestedAdPercent: 0,
    followedAdPercent: 0,
    adDelta: 0,
    deltaInsight: '',
    scansUsed: 0,
    scansWithData: [],
  };

  if (!scans || scans.length === 0) return result;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    let scanHasData = false;

    for (const item of feedItems) {
      const origin = item.sourceOrigin;
      if (origin !== 'suggested' && origin !== 'followed') continue;

      scanHasData = true;

      if (origin === 'suggested') {
        result.suggestedTotal++;
        if (item.is_ad) result.suggestedAds++;
      } else {
        result.followedTotal++;
        if (item.is_ad) result.followedAds++;
      }
    }

    if (scanHasData) {
      result.scansUsed++;
      result.scansWithData.push(scan.id);
    }
  }

  // Need at least 10 posts in each group
  if (result.suggestedTotal < 10 || result.followedTotal < 10) {
    return result;
  }

  result.hasData = true;
  result.suggestedAdPercent = Math.round((result.suggestedAds / result.suggestedTotal) * 100);
  result.followedAdPercent = Math.round((result.followedAds / result.followedTotal) * 100);
  result.adDelta = result.suggestedAdPercent - result.followedAdPercent;

  if (Math.abs(result.adDelta) >= 3) {
    const more = result.adDelta > 0 ? 'Suggested' : 'Followed';
    result.deltaInsight = `${more} posts are ${Math.abs(result.adDelta)} points more commercial.`;
  } else {
    result.deltaInsight = 'Similar levels of commercial content in both.';
  }

  return result;
}

/**
 * Aggregate creator familiarity by source origin.
 * Answers: "Does the algorithm show me new voices or familiar ones?"
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object}
 */
export function aggregateCreatorFamiliarityBySourceOrigin(scans, scanDetails) {
  const result = {
    hasData: false,
    suggestedCreators: new Set(),
    followedCreators: new Set(),
    suggestedCreatorCount: 0,
    followedCreatorCount: 0,
    overlapCount: 0,
    noveltyPercent: 0,    // % of suggested creators NOT in followed
    familiarPercent: 0,   // % of suggested creators also in followed
    scansUsed: 0,
    scansWithData: [],
  };

  if (!scans || scans.length === 0) return result;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    let scanHasData = false;

    for (const item of feedItems) {
      const origin = item.sourceOrigin;
      if (origin !== 'suggested' && origin !== 'followed') continue;

      const creatorId = normalizeCreatorId(item.creator || item.account);
      if (!creatorId) continue;

      scanHasData = true;

      if (origin === 'suggested') {
        result.suggestedCreators.add(creatorId);
      } else {
        result.followedCreators.add(creatorId);
      }
    }

    if (scanHasData) {
      result.scansUsed++;
      result.scansWithData.push(scan.id);
    }
  }

  result.suggestedCreatorCount = result.suggestedCreators.size;
  result.followedCreatorCount = result.followedCreators.size;

  // Need at least 5 creators in each group
  if (result.suggestedCreatorCount < 5 || result.followedCreatorCount < 5) {
    // Clean up sets before returning (can't serialize)
    result.suggestedCreators = null;
    result.followedCreators = null;
    return result;
  }

  result.hasData = true;

  // Calculate overlap
  let overlap = 0;
  for (const creator of result.suggestedCreators) {
    if (result.followedCreators.has(creator)) overlap++;
  }
  result.overlapCount = overlap;

  // Novelty = what % of suggested creators are NOT in followed set
  const novelCreators = result.suggestedCreatorCount - overlap;
  result.noveltyPercent = Math.round((novelCreators / result.suggestedCreatorCount) * 100);
  result.familiarPercent = 100 - result.noveltyPercent;

  // Clean up sets (not serializable)
  result.suggestedCreators = null;
  result.followedCreators = null;

  return result;
}

/**
 * Aggregate content type breakdown by source origin.
 * Answers: "Did suggested posts skew toward certain content formats?"
 *
 * @param {Array} scans
 * @param {Object} scanDetails
 * @returns {Object}
 */
export function aggregateContentTypeBySourceOrigin(scans, scanDetails) {
  const result = {
    hasData: false,
    suggested: {},
    followed: {},
    suggestedTotal: 0,
    followedTotal: 0,
    dominantDelta: null,
    scansUsed: 0,
    scansWithData: [],
  };

  if (!scans || scans.length === 0) return result;

  for (const scan of scans) {
    const detail = scanDetails[scan.id];
    if (!detail) continue;

    const feedItems = getFeedItems(detail);
    if (feedItems.length === 0) continue;

    let scanHasData = false;

    for (const item of feedItems) {
      const origin = item.sourceOrigin;
      if (origin !== 'suggested' && origin !== 'followed') continue;

      // Normalize content type
      const rawType = (item.content_type || 'unknown').toUpperCase();
      const contentType = ['VIDEO', 'IMAGE', 'TEXT', 'CAROUSEL', 'REEL', 'SHORT'].includes(rawType)
        ? rawType
        : 'OTHER';

      scanHasData = true;

      if (origin === 'suggested') {
        result.suggested[contentType] = (result.suggested[contentType] || 0) + 1;
        result.suggestedTotal++;
      } else {
        result.followed[contentType] = (result.followed[contentType] || 0) + 1;
        result.followedTotal++;
      }
    }

    if (scanHasData) {
      result.scansUsed++;
      result.scansWithData.push(scan.id);
    }
  }

  // Need at least 10 posts in each group
  if (result.suggestedTotal < 10 || result.followedTotal < 10) {
    return result;
  }

  result.hasData = true;

  // Convert counts to percentages
  const toPercent = (counts, total) => {
    const result = {};
    for (const [type, count] of Object.entries(counts)) {
      result[type] = { count, percent: Math.round((count / total) * 100) };
    }
    return result;
  };

  result.suggested = toPercent(result.suggested, result.suggestedTotal);
  result.followed = toPercent(result.followed, result.followedTotal);

  // Find largest delta between suggested and followed
  const allTypes = new Set([...Object.keys(result.suggested), ...Object.keys(result.followed)]);
  let maxDelta = 0;
  let maxDeltaType = null;

  for (const type of allTypes) {
    const sugPercent = result.suggested[type]?.percent || 0;
    const folPercent = result.followed[type]?.percent || 0;
    const delta = Math.abs(sugPercent - folPercent);

    if (delta > maxDelta) {
      maxDelta = delta;
      maxDeltaType = type;
    }
  }

  if (maxDeltaType && maxDelta >= 5) {
    const sugPercent = result.suggested[maxDeltaType]?.percent || 0;
    const folPercent = result.followed[maxDeltaType]?.percent || 0;
    const more = sugPercent > folPercent ? 'Algorithm suggestions' : 'Followed accounts';
    result.dominantDelta = {
      type: maxDeltaType.charAt(0) + maxDeltaType.slice(1).toLowerCase(),
      delta: maxDelta,
      insight: `${more} have ${maxDelta} points more ${maxDeltaType.toLowerCase()} content.`,
    };
  }

  return result;
}
