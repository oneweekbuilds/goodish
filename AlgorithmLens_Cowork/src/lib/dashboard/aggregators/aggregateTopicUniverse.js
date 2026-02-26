/**
 * Topic Universe and Creator-Topic Mapping Aggregators
 * Phase 6A: Topic universe discovery and creator-topic relationships
 */

import {
  getFeedItems,
  normalizeCreatorId,
  normalizeTopicLabel,
  UNCLASSIFIED_TOPIC,
} from './aggregatorUtils';

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
