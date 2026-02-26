/**
 * Derived Calculation Aggregators
 * Stability, discovery rate, and echo risk
 */

import {
  getAggregates,
  getFeedItems,
  normalizeCreatorId,
  normalizeTopicLabel,
} from './aggregatorUtils';

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
