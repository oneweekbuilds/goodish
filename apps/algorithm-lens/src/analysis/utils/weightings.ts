// Item weighting calculations

import { NormalizedItem } from '../../types/content';

/**
 * Calculate engagement weight for an item
 * w_e = 1 + ln(1 + likes) + 0.5*ln(1 + comments) + 0.75*ln(1 + shares) + 0.2*ln(1 + views)
 * @param item - Normalized item
 * @returns Engagement weight
 */
export function calculateEngagementWeight(item: NormalizedItem): number {
  const { likes, comments, shares, views } = item.engagement;

  const w = 1 +
    Math.log(1 + likes) +
    0.5 * Math.log(1 + comments) +
    0.75 * Math.log(1 + shares) +
    0.2 * Math.log(1 + views);

  return Math.max(1, w);
}

/**
 * Calculate recency weight for an item
 * w_r = exp(-Δt / τ) where τ = 14 days in ms
 * @param timestamp - Item timestamp in ms
 * @param referenceTime - Reference time (default: now)
 * @param tau - Time constant in ms (default: 14 days)
 * @returns Recency weight [0, 1]
 */
export function calculateRecencyWeight(
  timestamp: number,
  referenceTime: number = Date.now(),
  tau: number = 14 * 24 * 60 * 60 * 1000
): number {
  const deltaT = Math.max(0, referenceTime - timestamp);
  return Math.exp(-deltaT / tau);
}

/**
 * Calculate author authority weight
 * w_a = ln(1 + followers) / ln(1 + 1_000_000) + 0.2 if verified
 * @param item - Normalized item
 * @returns Authority weight [0, ~1.2]
 */
export function calculateAuthorityWeight(item: NormalizedItem): number {
  const followersComponent = Math.log(1 + item.authorFollowers) / Math.log(1 + 1_000_000);
  const verifiedBonus = item.authorVerified ? 0.2 : 0;
  return followersComponent + verifiedBonus;
}

/**
 * Calculate combined weight for an item
 * W = w_e * w_r * (0.5 + 0.5*w_a)
 * @param item - Normalized item
 * @param referenceTime - Reference time for recency
 * @returns Combined weight
 */
export function calculateItemWeight(item: NormalizedItem, referenceTime?: number): number {
  const wE = calculateEngagementWeight(item);
  const wR = calculateRecencyWeight(item.timestamp, referenceTime);
  const wA = calculateAuthorityWeight(item);

  return wE * wR * (0.5 + 0.5 * wA);
}

/**
 * Calculate weights for all items
 * @param items - Array of normalized items
 * @param referenceTime - Reference time for recency
 * @returns Array of weights (same length as items)
 */
export function calculateWeights(items: NormalizedItem[], referenceTime?: number): number[] {
  return items.map(item => calculateItemWeight(item, referenceTime));
}

/**
 * Normalize weights to have mean = 1.0
 * Rescales so Σ W = n (preserves relative ratios)
 * @param weights - Raw weights
 * @returns Normalized weights
 */
export function normalizeWeights(weights: number[]): number[] {
  if (weights.length === 0) return [];

  const sum = weights.reduce((s, w) => s + w, 0);
  if (sum === 0) return weights.map(() => 1);

  const scaleFactor = weights.length / sum;
  return weights.map(w => w * scaleFactor);
}

/**
 * Calculate weighted frequency distribution
 * @param categories - Category label for each item
 * @param weights - Weight for each item
 * @returns Object mapping categories to weighted counts
 */
export function weightedFrequency(categories: string[], weights: number[]): Record<string, number> {
  if (categories.length !== weights.length) {
    throw new Error('Categories and weights must have same length');
  }

  const freq: Record<string, number> = {};
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    freq[cat] = (freq[cat] || 0) + weights[i];
  }

  return freq;
}

/**
 * Get top K items by weight
 * @param items - Array of items
 * @param weights - Corresponding weights
 * @param k - Number of top items to return
 * @returns Top k items with their weights
 */
export function topKByWeight<T>(
  items: T[],
  weights: number[],
  k: number
): Array<{ item: T; weight: number }> {
  if (items.length !== weights.length) {
    throw new Error('Items and weights must have same length');
  }

  const paired = items.map((item, i) => ({ item, weight: weights[i] }));
  paired.sort((a, b) => b.weight - a.weight);

  return paired.slice(0, k);
}
