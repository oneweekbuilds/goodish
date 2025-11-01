// Influence Bias Metric - detects exposure to high-follower accounts vs grassroots
// Analyzes author influence distribution and algorithmic amplification

import type { NormalizedItem, ItemFeatures } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { calculateHHI } from '../utils/entropy';
import { mean, stdDev } from '../utils/stats';

export interface InfluenceBiasMetric extends MetricBase {
  metric: 'influence_bias';
  value: {
    avgFollowers: number;
    medianFollowers: number;
    topAccountRatio: number; // % from accounts with >100k followers
    verifiedRatio: number; // % from verified accounts
    influenceConcentration: number; // HHI of follower distribution
    amplificationScore: number; // 0-100, how much algorithms favor large accounts
  };
}

export function calculateInfluenceBias(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): InfluenceBiasMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  const followerCounts = items
    .map(i => i.item.author.followers || 0)
    .filter(f => f > 0);

  if (followerCounts.length === 0) {
    return createNoFollowerDataMetric(items.length);
  }

  const avgFollowers = Math.round(mean(followerCounts));
  const sortedFollowers = [...followerCounts].sort((a, b) => a - b);
  const medianFollowers = sortedFollowers[Math.floor(sortedFollowers.length / 2)] || 0;

  const topAccountCount = items.filter(i => (i.item.author.followers || 0) > 100000).length;
  const topAccountRatio = topAccountCount / items.length;

  const verifiedCount = items.filter(i => i.item.isVerified).length;
  const verifiedRatio = verifiedCount / items.length;

  // Calculate HHI of follower distribution (treating each account's followers as market share)
  const totalFollowers = followerCounts.reduce((sum, f) => sum + f, 0);
  const shares = followerCounts.map(f => f / totalFollowers);
  const influenceConcentration = shares.reduce((sum, s) => sum + s * s, 0);

  // Amplification score: how much large accounts dominate
  let amplificationScore = 0;
  if (topAccountRatio > 0.4) amplificationScore += 40;
  else if (topAccountRatio > 0.2) amplificationScore += 20;

  if (verifiedRatio > 0.5) amplificationScore += 30;
  else if (verifiedRatio > 0.3) amplificationScore += 15;

  if (influenceConcentration > 0.1) amplificationScore += 30;
  else if (influenceConcentration > 0.05) amplificationScore += 15;

  amplificationScore = Math.min(100, amplificationScore);

  const explanation = `Average follower count: ${avgFollowers.toLocaleString()} (median: ${medianFollowers.toLocaleString()}). ${Math.round(topAccountRatio * 100)}% of content from accounts with >100k followers. ${Math.round(verifiedRatio * 100)}% from verified accounts. ${amplificationScore > 60 ? 'High algorithmic amplification of influential accounts.' : amplificationScore > 30 ? 'Moderate influence bias.' : 'Balanced mix of account sizes.'}`;

  const { status, issues } = amplificationScore > 70 ?
    { status: 'warning' as const, issues: ['Algorithms heavily favor large accounts in your feed'] } :
    { status: 'ok' as const, issues: [] };

  return {
    metric: 'influence_bias',
    key: 'influence_bias',
    value: {
      avgFollowers,
      medianFollowers,
      topAccountRatio: Math.round(topAccountRatio * 100) / 100,
      verifiedRatio: Math.round(verifiedRatio * 100) / 100,
      influenceConcentration: Math.round(influenceConcentration * 100) / 100,
      amplificationScore: Math.round(amplificationScore)
    },
    unit: 'score',
    confidence: Math.min(items.length / 50, 1.0),
    explanation,
    topSignals: [
      `Avg followers: ${avgFollowers.toLocaleString()}`,
      `${Math.round(topAccountRatio * 100)}% from large accounts (>100k)`,
      `Amplification: ${Math.round(amplificationScore)}/100`
    ],
    examples: [],
    status,
    issues
  };
}

function createEmptyMetric(): InfluenceBiasMetric {
  return {
    metric: 'influence_bias',
    key: 'influence_bias',
    value: {
      avgFollowers: 0,
      medianFollowers: 0,
      topAccountRatio: 0,
      verifiedRatio: 0,
      influenceConcentration: 0,
      amplificationScore: 0
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

function createNoFollowerDataMetric(itemCount: number): InfluenceBiasMetric {
  return {
    metric: 'influence_bias',
    key: 'influence_bias',
    value: {
      avgFollowers: 0,
      medianFollowers: 0,
      topAccountRatio: 0,
      verifiedRatio: 0,
      influenceConcentration: 0,
      amplificationScore: 0
    },
    unit: 'score',
    confidence: 0.2,
    explanation: `No follower data available for ${itemCount} items. Platform may not expose this metadata.`,
    topSignals: ['No follower data available'],
    examples: [],
    status: 'warning',
    issues: ['Insufficient follower data']
  };
}
