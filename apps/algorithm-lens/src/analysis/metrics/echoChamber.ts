// Echo Chamber Metric - measures content diversity and source concentration
// Detects filter bubbles by analyzing source variety and topic clustering

import type { NormalizedItem, ItemFeatures } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { calculateEntropy, calculateHHI } from '../utils/entropy';
import { mean, stdDev } from '../utils/stats';
import { calculateCombinedWeight } from '../utils/weightings';

export interface EchoChamberMetric extends MetricBase {
  metric: 'echo_chamber';
  value: {
    score: number; // 0-100, higher = more echo chamber
    sourceConcentration: number; // HHI of sources
    topicConcentration: number; // HHI of topics
    authorConcentration: number; // HHI of authors
    diversityScore: number; // 0-100, higher = more diverse
  };
}

/**
 * Calculate echo chamber metric
 * Analyzes source diversity, topic clustering, and author concentration
 *
 * @param items - Array of normalized items with features
 * @param options - Analysis options
 * @returns Echo chamber metric with explainability
 */
export function calculateEchoChamber(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): EchoChamberMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  // Extract data with weighting
  const weightedSources: Array<{ source: string; weight: number }> = [];
  const weightedTopics: Array<{ topic: string; weight: number }> = [];
  const weightedAuthors: Array<{ author: string; weight: number }> = [];

  for (const { item, features } of items) {
    const weight = calculateCombinedWeight(
      item.engagement,
      item.timestamp,
      item.author.followers
    );

    // Source (domain from URLs or platform)
    const source = extractSource(item);
    if (source) {
      weightedSources.push({ source, weight });
    }

    // Topics
    for (const topic of features.topics) {
      weightedTopics.push({ topic, weight });
    }

    // Authors
    weightedAuthors.push({ author: item.author.id, weight });
  }

  // Calculate concentration metrics using HHI
  const sourceConcentration = calculateWeightedHHI(weightedSources);
  const topicConcentration = calculateWeightedHHI(weightedTopics);
  const authorConcentration = calculateWeightedHHI(weightedAuthors);

  // Calculate diversity score (inverse of concentration)
  const sourceDiversity = 1 - sourceConcentration;
  const topicDiversity = 1 - topicConcentration;
  const authorDiversity = 1 - authorConcentration;

  // Overall diversity score (weighted average)
  const diversityScore = Math.round(
    (sourceDiversity * 0.4 + topicDiversity * 0.4 + authorDiversity * 0.2) * 100
  );

  // Echo chamber score (inverse of diversity)
  const echoChamberScore = 100 - diversityScore;

  // Generate explanation
  const explanation = generateExplanation(
    echoChamberScore,
    sourceConcentration,
    topicConcentration,
    authorConcentration,
    weightedSources.length,
    weightedTopics.length,
    weightedAuthors.length
  );

  // Find top signals
  const topSignals = generateTopSignals(
    weightedSources,
    weightedTopics,
    weightedAuthors,
    sourceConcentration,
    topicConcentration
  );

  // Generate examples
  const examples = generateExamples(items, weightedSources, weightedTopics);

  // Determine status and issues
  const { status, issues } = assessStatus(
    echoChamberScore,
    items.length,
    weightedSources.length
  );

  return {
    metric: 'echo_chamber',
    key: 'echo_score',
    value: {
      score: echoChamberScore,
      sourceConcentration: Math.round(sourceConcentration * 100) / 100,
      topicConcentration: Math.round(topicConcentration * 100) / 100,
      authorConcentration: Math.round(authorConcentration * 100) / 100,
      diversityScore
    },
    unit: 'score',
    confidence: calculateConfidence(items.length, weightedSources.length),
    explanation,
    topSignals,
    examples,
    status,
    issues
  };
}

/**
 * Extract source domain from item
 */
function extractSource(item: NormalizedItem): string | null {
  // Try to get domain from URLs
  if (item.urls.length > 0) {
    try {
      const url = new URL(item.urls[0]);
      return url.hostname.replace(/^www\./, '');
    } catch {
      // Invalid URL, fall through
    }
  }

  // Fallback to platform + author
  return `${item.platform}:${item.author.username || item.author.id}`;
}

/**
 * Calculate weighted HHI (Herfindahl-Hirschman Index)
 */
function calculateWeightedHHI(items: Array<{ source: string; weight: number }>): number {
  if (items.length === 0) return 0;

  // Aggregate weights by source
  const sourceWeights = new Map<string, number>();
  let totalWeight = 0;

  for (const { source, weight } of items) {
    sourceWeights.set(source, (sourceWeights.get(source) || 0) + weight);
    totalWeight += weight;
  }

  // Calculate HHI
  let hhi = 0;
  for (const weight of sourceWeights.values()) {
    const share = weight / totalWeight;
    hhi += share * share;
  }

  return hhi;
}

/**
 * Generate explanation text
 */
function generateExplanation(
  score: number,
  sourceConc: number,
  topicConc: number,
  authorConc: number,
  numSources: number,
  numTopics: number,
  numAuthors: number
): string {
  if (score >= 70) {
    return `High echo chamber effect detected. Your feed shows strong concentration: ${Math.round(sourceConc * 100)}% source concentration, ${Math.round(topicConc * 100)}% topic concentration. This suggests you're seeing similar content from similar sources repeatedly, which may limit exposure to diverse perspectives.`;
  } else if (score >= 50) {
    return `Moderate echo chamber effect. Your feed has ${numSources} unique sources covering ${numTopics} topics, but shows some concentration patterns. Consider following more diverse sources to broaden your information diet.`;
  } else if (score >= 30) {
    return `Low echo chamber effect. Your feed demonstrates good diversity with ${numSources} sources and ${numTopics} topics. While you're exposed to varied content, there's still room to expand your information sources.`;
  } else {
    return `Very low echo chamber effect. Your feed shows excellent diversity across sources (${numSources}), topics (${numTopics}), and authors (${numAuthors}). You're being exposed to a wide range of perspectives and content types.`;
  }
}

/**
 * Generate top signals contributing to the metric
 */
function generateTopSignals(
  sources: Array<{ source: string; weight: number }>,
  topics: Array<{ topic: string; weight: number }>,
  authors: Array<{ author: string; weight: number }>,
  sourceConc: number,
  topicConc: number
): string[] {
  const signals: string[] = [];

  // Top sources
  const topSources = getTopWeighted(sources, 3);
  if (topSources.length > 0) {
    signals.push(`Top sources: ${topSources.map(s => s.source).join(', ')}`);
  }

  // Top topics
  const topTopics = getTopWeighted(topics, 3);
  if (topTopics.length > 0) {
    signals.push(`Top topics: ${topTopics.map(t => t.topic.replace(/_/g, ' ')).join(', ')}`);
  }

  // Concentration levels
  if (sourceConc > 0.3) {
    signals.push(`High source concentration (${Math.round(sourceConc * 100)}%)`);
  }
  if (topicConc > 0.3) {
    signals.push(`High topic concentration (${Math.round(topicConc * 100)}%)`);
  }

  // Unique counts
  const uniqueSources = new Set(sources.map(s => s.source)).size;
  const uniqueTopics = new Set(topics.map(t => t.topic)).size;
  signals.push(`${uniqueSources} unique sources, ${uniqueTopics} topics`);

  return signals;
}

/**
 * Get top items by weight
 */
function getTopWeighted<T extends { source?: string; topic?: string; weight: number }>(
  items: T[],
  limit: number
): T[] {
  // Aggregate by source or topic
  const aggregated = new Map<string, T & { totalWeight: number }>();

  for (const item of items) {
    const key = (item as any).source || (item as any).topic;
    if (!key) continue;

    const existing = aggregated.get(key);
    if (existing) {
      existing.totalWeight += item.weight;
    } else {
      aggregated.set(key, { ...item, totalWeight: item.weight });
    }
  }

  return Array.from(aggregated.values())
    .sort((a, b) => b.totalWeight - a.totalWeight)
    .slice(0, limit);
}

/**
 * Generate example items
 */
function generateExamples(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>,
  sources: Array<{ source: string; weight: number }>,
  topics: Array<{ topic: string; weight: number }>
): string[] {
  const examples: string[] = [];

  // Top source example
  const topSource = getTopWeighted(sources, 1)[0];
  if (topSource) {
    const exampleFromSource = items.find(i => extractSource(i.item) === topSource.source);
    if (exampleFromSource) {
      const preview = exampleFromSource.item.text.substring(0, 100);
      examples.push(`Most common source (${topSource.source}): "${preview}..."`);
    }
  }

  // Diverse source example (if exists)
  const allSources = Array.from(new Set(sources.map(s => s.source)));
  if (allSources.length > 5) {
    const diverseSource = allSources[allSources.length - 1];
    const exampleFromDiverse = items.find(i => extractSource(i.item) === diverseSource);
    if (exampleFromDiverse) {
      const preview = exampleFromDiverse.item.text.substring(0, 100);
      examples.push(`Less common source (${diverseSource}): "${preview}..."`);
    }
  }

  return examples;
}

/**
 * Assess status and identify issues
 */
function assessStatus(
  score: number,
  itemCount: number,
  sourceCount: number
): { status: 'ok' | 'warning' | 'error'; issues: string[] } {
  const issues: string[] = [];
  let status: 'ok' | 'warning' | 'error' = 'ok';

  // Check sample size
  if (itemCount < 10) {
    issues.push('Small sample size (< 10 items). Confidence is low.');
    status = 'warning';
  }

  if (itemCount < 5) {
    issues.push('Very small sample (< 5 items). Results unreliable.');
    status = 'error';
  }

  // Check source diversity
  if (sourceCount < 3) {
    issues.push('Very few unique sources. Consider following more diverse accounts.');
    if (status === 'ok') status = 'warning';
  }

  // Check echo chamber level
  if (score >= 70) {
    issues.push('High echo chamber detected. You may be in a filter bubble.');
    status = 'warning';
  }

  if (score >= 85) {
    issues.push('Severe echo chamber. Strongly recommend diversifying your sources.');
    status = 'error';
  }

  return { status, issues };
}

/**
 * Calculate confidence score
 */
function calculateConfidence(itemCount: number, sourceCount: number): number {
  // Base confidence on sample size
  let confidence = Math.min(itemCount / 50, 1.0); // Full confidence at 50+ items

  // Reduce confidence for very low source diversity
  if (sourceCount < 3) {
    confidence *= 0.5;
  } else if (sourceCount < 5) {
    confidence *= 0.7;
  }

  return Math.round(confidence * 100) / 100;
}

/**
 * Create empty metric for no data
 */
function createEmptyMetric(): EchoChamberMetric {
  return {
    metric: 'echo_chamber',
    key: 'echo_score',
    value: {
      score: 0,
      sourceConcentration: 0,
      topicConcentration: 0,
      authorConcentration: 0,
      diversityScore: 0
    },
    unit: 'score',
    confidence: 0,
    explanation: 'No data available to calculate echo chamber metric.',
    topSignals: [],
    examples: [],
    status: 'error',
    issues: ['No items provided for analysis']
  };
}
