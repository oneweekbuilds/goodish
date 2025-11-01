// Topic Diversity Metric - measures breadth of content topics
// Detects narrow interest tunnels vs broad information diet

import type { NormalizedItem, ItemFeatures } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { calculateEntropy, calculateHHI } from '../utils/entropy';
import { calculateCombinedWeight } from '../utils/weightings';

export interface TopicDiversityMetric extends MetricBase {
  metric: 'topic_diversity';
  value: {
    uniqueTopics: number;
    entropy: number; // Shannon entropy of topic distribution
    hhi: number; // Herfindahl-Hirschman Index
    diversityScore: number; // 0-100, higher = more diverse
    topTopics: Array<{ topic: string; count: number; percentage: number }>;
    breadthLabel: string; // 'Narrow', 'Moderate', 'Broad', 'Very Broad'
  };
}

/**
 * Calculate topic diversity metric
 * Analyzes distribution of topics across content
 */
export function calculateTopicDiversity(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): TopicDiversityMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  // Collect weighted topics
  const weightedTopics: Array<{ topic: string; weight: number }> = [];

  for (const { item, features } of items) {
    const weight = calculateCombinedWeight(
      item.engagement,
      item.timestamp,
      item.author.followers
    );

    for (const topic of features.topics) {
      weightedTopics.push({ topic, weight });
    }
  }

  if (weightedTopics.length === 0) {
    return createNoTopicsMetric(items.length);
  }

  // Calculate topic distribution
  const topicWeights = new Map<string, number>();
  let totalWeight = 0;

  for (const { topic, weight } of weightedTopics) {
    topicWeights.set(topic, (topicWeights.get(topic) || 0) + weight);
    totalWeight += weight;
  }

  const uniqueTopics = topicWeights.size;

  // Calculate probabilities for entropy
  const probabilities: number[] = [];
  for (const weight of topicWeights.values()) {
    probabilities.push(weight / totalWeight);
  }

  // Calculate entropy (normalized to 0-1)
  const entropy = calculateEntropy(probabilities);
  const maxEntropy = Math.log2(uniqueTopics);
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

  // Calculate HHI
  const hhi = probabilities.reduce((sum, p) => sum + p * p, 0);

  // Diversity score (combines entropy and inverse HHI)
  const diversityScore = Math.round(((normalizedEntropy * 0.6 + (1 - hhi) * 0.4)) * 100);

  // Get top topics
  const topTopics = Array.from(topicWeights.entries())
    .map(([topic, weight]) => ({
      topic,
      count: weightedTopics.filter(t => t.topic === topic).length,
      weight
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10)
    .map(t => ({
      topic: t.topic,
      count: t.count,
      percentage: Math.round((t.weight / totalWeight) * 100)
    }));

  // Breadth label
  const breadthLabel = getBreadthLabel(uniqueTopics, diversityScore);

  // Generate explanation
  const explanation = generateExplanation(
    uniqueTopics,
    diversityScore,
    breadthLabel,
    topTopics,
    items.length
  );

  // Top signals
  const topSignals = generateTopSignals(uniqueTopics, entropy, hhi, topTopics);

  // Examples
  const examples = generateExamples(items, topTopics);

  // Status
  const { status, issues } = assessStatus(uniqueTopics, diversityScore, items.length);

  return {
    metric: 'topic_diversity',
    key: 'topic_diversity',
    value: {
      uniqueTopics,
      entropy: Math.round(normalizedEntropy * 100) / 100,
      hhi: Math.round(hhi * 100) / 100,
      diversityScore,
      topTopics,
      breadthLabel
    },
    unit: 'score',
    confidence: calculateConfidence(items.length, weightedTopics.length),
    explanation,
    topSignals,
    examples,
    status,
    issues
  };
}

function getBreadthLabel(uniqueTopics: number, score: number): string {
  if (uniqueTopics < 3 || score < 30) return 'Narrow';
  if (uniqueTopics < 8 || score < 55) return 'Moderate';
  if (uniqueTopics < 15 || score < 75) return 'Broad';
  return 'Very Broad';
}

function generateExplanation(
  uniqueTopics: number,
  score: number,
  breadth: string,
  topTopics: Array<{ topic: string; percentage: number }>,
  totalItems: number
): string {
  let exp = `Your feed covers ${uniqueTopics} distinct topics (diversity score: ${score}/100). `;
  exp += `This indicates a ${breadth.toLowerCase()} information diet. `;

  if (topTopics.length > 0) {
    const top3 = topTopics.slice(0, 3).map(t => `${t.topic.replace(/_/g, ' ')} (${t.percentage}%)`).join(', ');
    exp += `Top topics: ${top3}. `;
  }

  if (score < 40) {
    exp += 'Consider exploring more diverse content to broaden your perspective.';
  } else if (score > 75) {
    exp += 'Excellent topic diversity - you\'re exposed to a wide range of subjects.';
  }

  return exp;
}

function generateTopSignals(
  uniqueTopics: number,
  entropy: number,
  hhi: number,
  topTopics: Array<{ topic: string; percentage: number }>
): string[] {
  const signals = [
    `${uniqueTopics} unique topics`,
    `Entropy: ${entropy.toFixed(2)} (normalized)`,
    `HHI: ${hhi.toFixed(2)}`
  ];

  if (topTopics.length > 0) {
    const dominant = topTopics[0];
    if (dominant.percentage > 40) {
      signals.push(`Dominant topic: ${dominant.topic.replace(/_/g, ' ')} (${dominant.percentage}%)`);
    }
  }

  return signals;
}

function generateExamples(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>,
  topTopics: Array<{ topic: string }>
): string[] {
  const examples: string[] = [];

  if (topTopics.length > 0) {
    const topTopic = topTopics[0].topic;
    const example = items.find(i => i.features.topics.includes(topTopic));
    if (example) {
      const preview = example.item.text.substring(0, 100);
      examples.push(`${topTopic.replace(/_/g, ' ')}: "${preview}..."`);
    }
  }

  return examples;
}

function assessStatus(uniqueTopics: number, score: number, totalItems: number): {
  status: 'ok' | 'warning' | 'error';
  issues: string[];
} {
  const issues: string[] = [];
  let status: 'ok' | 'warning' | 'error' = 'ok';

  if (totalItems < 10) {
    issues.push('Small sample size.');
    status = 'warning';
  }

  if (uniqueTopics < 3) {
    issues.push('Very narrow topic range. Consider diversifying your sources.');
    status = 'warning';
  }

  if (score < 25) {
    issues.push('Severe topic concentration detected.');
    status = 'error';
  }

  return { status, issues };
}

function calculateConfidence(totalItems: number, topicCount: number): number {
  let conf = Math.min(totalItems / 50, 1.0);
  if (topicCount < 5) conf *= 0.6;
  return Math.round(conf * 100) / 100;
}

function createEmptyMetric(): TopicDiversityMetric {
  return {
    metric: 'topic_diversity',
    key: 'topic_diversity',
    value: {
      uniqueTopics: 0,
      entropy: 0,
      hhi: 0,
      diversityScore: 0,
      topTopics: [],
      breadthLabel: 'Unknown'
    },
    unit: 'score',
    confidence: 0,
    explanation: 'No data available.',
    topSignals: [],
    examples: [],
    status: 'error',
    issues: ['No items provided']
  };
}

function createNoTopicsMetric(totalItems: number): TopicDiversityMetric {
  return {
    metric: 'topic_diversity',
    key: 'topic_diversity',
    value: {
      uniqueTopics: 0,
      entropy: 0,
      hhi: 0,
      diversityScore: 0,
      topTopics: [],
      breadthLabel: 'Unclassified'
    },
    unit: 'score',
    confidence: 0.3,
    explanation: `No topics detected in ${totalItems} items. Content may be uncategorized or highly specialized.`,
    topSignals: ['No recognizable topics'],
    examples: [],
    status: 'warning',
    issues: ['No topics detected']
  };
}
