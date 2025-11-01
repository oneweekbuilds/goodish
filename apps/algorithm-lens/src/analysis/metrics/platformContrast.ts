// Platform Contrast Metric - compares content characteristics across platforms
// Reveals how different platforms show different sides of you

import type { NormalizedItem, ItemFeatures, Platform } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { mean } from '../utils/stats';

export interface PlatformContrastMetric extends MetricBase {
  metric: 'platform_contrast';
  value: {
    platforms: string[];
    topicDivergence: number; // 0-100, how different topics are across platforms
    sentimentDivergence: number; // 0-100, sentiment difference
    platformProfiles: Record<string, {
      itemCount: number;
      topTopics: string[];
      avgSentiment: number;
      adRatio: number;
    }>;
    mostDivergentPair: {
      platform1: string;
      platform2: string;
      divergenceScore: number;
    } | null;
  };
}

export function calculatePlatformContrast(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): PlatformContrastMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  // Group by platform
  const platformGroups = new Map<Platform, Array<{ item: NormalizedItem; features: ItemFeatures }>>();

  for (const itemData of items) {
    const platform = itemData.item.platform;
    if (!platformGroups.has(platform)) {
      platformGroups.set(platform, []);
    }
    platformGroups.get(platform)!.push(itemData);
  }

  const platforms = Array.from(platformGroups.keys());

  if (platforms.length < 2) {
    return createSinglePlatformMetric(platforms[0] || 'unknown', items.length);
  }

  // Build platform profiles
  const platformProfiles: Record<string, {
    itemCount: number;
    topTopics: string[];
    avgSentiment: number;
    adRatio: number;
  }> = {};

  for (const [platform, platformItems] of platformGroups) {
    // Get top topics
    const topicCounts = new Map<string, number>();
    for (const { features } of platformItems) {
      for (const topic of features.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }

    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);

    // Average sentiment
    const sentiments = platformItems.map(i => i.features.sentimentProxies.sentimentScore);
    const avgSentiment = mean(sentiments);

    // Ad ratio
    const adCount = platformItems.filter(i => i.item.isPromoted).length;
    const adRatio = adCount / platformItems.length;

    platformProfiles[platform] = {
      itemCount: platformItems.length,
      topTopics,
      avgSentiment,
      adRatio
    };
  }

  // Calculate topic divergence
  const topicDivergence = calculateTopicDivergence(platformGroups);

  // Calculate sentiment divergence
  const sentimentDivergence = calculateSentimentDivergence(platformProfiles);

  // Find most divergent pair
  const mostDivergentPair = findMostDivergentPair(platformProfiles, platformGroups);

  const explanation = `Content analyzed across ${platforms.length} platforms: ${platforms.join(', ')}. Topic divergence: ${Math.round(topicDivergence)}/100, sentiment divergence: ${Math.round(sentimentDivergence)}/100. ${topicDivergence > 60 || sentimentDivergence > 60 ? 'Platforms show significantly different sides of your interests.' : 'Platforms show relatively consistent content.'}`;

  return {
    metric: 'platform_contrast',
    key: 'platform_contrast',
    value: {
      platforms,
      topicDivergence: Math.round(topicDivergence),
      sentimentDivergence: Math.round(sentimentDivergence),
      platformProfiles,
      mostDivergentPair: mostDivergentPair ? {
        ...mostDivergentPair,
        divergenceScore: Math.round(mostDivergentPair.divergenceScore)
      } : null
    },
    unit: 'index',
    confidence: Math.min(items.length / 100, 1.0),
    explanation,
    topSignals: [
      `${platforms.length} platforms`,
      `Topic divergence: ${Math.round(topicDivergence)}/100`,
      `Sentiment divergence: ${Math.round(sentimentDivergence)}/100`
    ],
    examples: [],
    status: 'ok',
    issues: []
  };
}

function calculateTopicDivergence(
  platformGroups: Map<Platform, Array<{ item: NormalizedItem; features: ItemFeatures }>>
): number {
  const platformTopics = new Map<Platform, Set<string>>();

  for (const [platform, items] of platformGroups) {
    const topics = new Set<string>();
    for (const { features } of items) {
      features.topics.forEach(t => topics.add(t));
    }
    platformTopics.set(platform, topics);
  }

  // Calculate Jaccard distance between each pair
  const platforms = Array.from(platformGroups.keys());
  let totalDistance = 0;
  let pairCount = 0;

  for (let i = 0; i < platforms.length; i++) {
    for (let j = i + 1; j < platforms.length; j++) {
      const topics1 = platformTopics.get(platforms[i])!;
      const topics2 = platformTopics.get(platforms[j])!;

      const intersection = new Set([...topics1].filter(t => topics2.has(t)));
      const union = new Set([...topics1, ...topics2]);

      const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;
      const jaccardDistance = 1 - jaccardSimilarity;

      totalDistance += jaccardDistance;
      pairCount++;
    }
  }

  return pairCount > 0 ? (totalDistance / pairCount) * 100 : 0;
}

function calculateSentimentDivergence(
  profiles: Record<string, { avgSentiment: number }>
): number {
  const sentiments = Object.values(profiles).map(p => p.avgSentiment);

  if (sentiments.length < 2) return 0;

  const minSentiment = Math.min(...sentiments);
  const maxSentiment = Math.max(...sentiments);

  // Sentiment ranges from -1 to +1, so max divergence is 2
  const divergence = Math.abs(maxSentiment - minSentiment);

  return (divergence / 2) * 100; // Normalize to 0-100
}

function findMostDivergentPair(
  profiles: Record<string, { topTopics: string[]; avgSentiment: number }>,
  platformGroups: Map<Platform, Array<{ item: NormalizedItem; features: ItemFeatures }>>
): { platform1: string; platform2: string; divergenceScore: number } | null {
  const platforms = Object.keys(profiles);

  if (platforms.length < 2) return null;

  let maxDivergence = 0;
  let mostDivergent: { platform1: string; platform2: string; divergenceScore: number } | null = null;

  for (let i = 0; i < platforms.length; i++) {
    for (let j = i + 1; j < platforms.length; j++) {
      const p1 = platforms[i];
      const p2 = platforms[j];

      // Topic overlap
      const topics1 = new Set(profiles[p1].topTopics);
      const topics2 = new Set(profiles[p2].topTopics);
      const intersection = new Set([...topics1].filter(t => topics2.has(t)));
      const topicSimilarity = (topics1.size + topics2.size) > 0 ?
        (2 * intersection.size) / (topics1.size + topics2.size) : 0;

      // Sentiment difference
      const sentimentDiff = Math.abs(profiles[p1].avgSentiment - profiles[p2].avgSentiment);

      // Combined divergence (lower similarity + higher sentiment diff = higher divergence)
      const divergence = ((1 - topicSimilarity) * 60) + (sentimentDiff / 2 * 40);

      if (divergence > maxDivergence) {
        maxDivergence = divergence;
        mostDivergent = { platform1: p1, platform2: p2, divergenceScore: divergence };
      }
    }
  }

  return mostDivergent;
}

function createEmptyMetric(): PlatformContrastMetric {
  return {
    metric: 'platform_contrast',
    key: 'platform_contrast',
    value: {
      platforms: [],
      topicDivergence: 0,
      sentimentDivergence: 0,
      platformProfiles: {},
      mostDivergentPair: null
    },
    unit: 'index',
    confidence: 0,
    explanation: 'No data available.',
    topSignals: [],
    examples: [],
    status: 'error',
    issues: ['No items provided']
  };
}

function createSinglePlatformMetric(platform: string, itemCount: number): PlatformContrastMetric {
  return {
    metric: 'platform_contrast',
    key: 'platform_contrast',
    value: {
      platforms: [platform],
      topicDivergence: 0,
      sentimentDivergence: 0,
      platformProfiles: {},
      mostDivergentPair: null
    },
    unit: 'index',
    confidence: 0.3,
    explanation: `Only one platform (${platform}) with ${itemCount} items. Need data from multiple platforms for contrast analysis.`,
    topSignals: ['Single platform only'],
    examples: [],
    status: 'warning',
    issues: ['Need multiple platforms for comparison']
  };
}
