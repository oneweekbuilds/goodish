// Sentiment Balance Metric - analyzes positive vs negative content sentiment
// Detects negativity bias and emotional balance in feed

import type { NormalizedItem, ItemFeatures } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { calculateCombinedWeight } from '../utils/weightings';
import { mean } from '../utils/stats';

export interface SentimentBalanceMetric extends MetricBase {
  metric: 'sentiment_balance';
  value: {
    avgSentiment: number; // -1 to +1
    positiveRatio: number; // % positive content
    negativeRatio: number; // % negative content
    neutralRatio: number; // % neutral content
    balanceScore: number; // 0-100, how balanced
    negativityBias: number; // 0-100, higher = more negative bias
  };
}

export function calculateSentimentBalance(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): SentimentBalanceMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  let weightedSentimentSum = 0;
  let totalWeight = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  for (const { item, features } of items) {
    const weight = calculateCombinedWeight(item.engagement, item.timestamp, item.author.followers);
    const sentiment = features.sentimentProxies.sentimentScore;

    weightedSentimentSum += sentiment * weight;
    totalWeight += weight;

    if (sentiment > 0.2) positiveCount++;
    else if (sentiment < -0.2) negativeCount++;
    else neutralCount++;
  }

  const avgSentiment = totalWeight > 0 ? weightedSentimentSum / totalWeight : 0;
  const positiveRatio = positiveCount / items.length;
  const negativeRatio = negativeCount / items.length;
  const neutralRatio = neutralCount / items.length;

  // Balance score: how evenly distributed positive/negative (0 = imbalanced, 100 = balanced)
  const balanceScore = Math.round((1 - Math.abs(positiveRatio - negativeRatio)) * 100);

  // Negativity bias (0-100)
  const negativityBias = Math.round(Math.max(0, -avgSentiment * 100));

  const explanation = `Average sentiment: ${avgSentiment.toFixed(2)} (${avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral'}). Distribution: ${Math.round(positiveRatio * 100)}% positive, ${Math.round(neutralRatio * 100)}% neutral, ${Math.round(negativeRatio * 100)}% negative. ${negativityBias > 60 ? 'Strong negativity bias detected.' : negativityBias > 30 ? 'Moderate negative skew.' : 'Reasonably balanced sentiment.'}`;

  const topSignals = [
    `Avg sentiment: ${avgSentiment.toFixed(2)}`,
    `Balance: ${balanceScore}/100`,
    `Negativity bias: ${negativityBias}/100`
  ];

  const { status, issues } = negativityBias > 70 ?
    { status: 'warning' as const, issues: ['High negativity bias detected'] } :
    { status: 'ok' as const, issues: [] };

  return {
    metric: 'sentiment_balance',
    key: 'sentiment_balance',
    value: {
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      positiveRatio: Math.round(positiveRatio * 100) / 100,
      negativeRatio: Math.round(negativeRatio * 100) / 100,
      neutralRatio: Math.round(neutralRatio * 100) / 100,
      balanceScore,
      negativityBias
    },
    unit: 'score',
    confidence: Math.min(items.length / 50, 1.0),
    explanation,
    topSignals,
    examples: [],
    status,
    issues
  };
}

function createEmptyMetric(): SentimentBalanceMetric {
  return {
    metric: 'sentiment_balance',
    key: 'sentiment_balance',
    value: {
      avgSentiment: 0,
      positiveRatio: 0,
      negativeRatio: 0,
      neutralRatio: 0,
      balanceScore: 0,
      negativityBias: 0
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
