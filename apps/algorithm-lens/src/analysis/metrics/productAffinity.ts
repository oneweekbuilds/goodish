// Product Affinity Metric - analyzes commercial content and brand exposure
// Detects targeted advertising and consumer profiling

import type { NormalizedItem, ItemFeatures } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { detectBrands, PRODUCT_CATEGORIES } from '../rules/brands.dictionary';
import { calculateCombinedWeight } from '../utils/weightings';
import { calculateHHI } from '../utils/entropy';

export interface ProductAffinityMetric extends MetricBase {
  metric: 'product_affinity';
  value: {
    adRatio: number; // % of content that is ads/sponsored
    brandMentions: number; // total brand mentions
    topCategories: Array<{ category: string; count: number; percentage: number }>;
    categoryConcentration: number; // HHI of categories
    consumerProfile: string; // inferred demographic/lifestyle
    targetingIntensity: number; // 0-100, how targeted ads appear
  };
}

/**
 * Calculate product affinity metric
 * Analyzes commercial content, brand mentions, and advertising patterns
 *
 * @param items - Array of normalized items with features
 * @returns Product affinity metric with explainability
 */
export function calculateProductAffinity(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): ProductAffinityMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  // Count ads and promoted content
  const adItems = items.filter(i => i.item.isPromoted || i.features.brands.length > 0);
  const adRatio = adItems.length / items.length;

  // Analyze brand mentions with weighting
  const weightedBrands: Array<{ brand: string; category: string; weight: number }> = [];

  for (const { item, features } of items) {
    const weight = calculateCombinedWeight(
      item.engagement,
      item.timestamp,
      item.author.followers
    );

    // Detect brands in text
    const text = [item.text, ...item.hashtags.map(h => `#${h}`)].join(' ');
    const detectedBrands = detectBrands(text);

    for (const brand of detectedBrands) {
      weightedBrands.push({
        brand: brand.canonical,
        category: brand.category,
        weight: item.isPromoted ? weight * 2 : weight // Double weight for promoted content
      });
    }
  }

  const brandMentions = weightedBrands.length;

  // Calculate category distribution
  const categoryWeights = new Map<string, number>();
  for (const { category, weight } of weightedBrands) {
    categoryWeights.set(category, (categoryWeights.get(category) || 0) + weight);
  }

  // Sort categories by weight
  const topCategories = Array.from(categoryWeights.entries())
    .map(([category, weight]) => ({
      category,
      count: weightedBrands.filter(b => b.category === category).length,
      weight
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  // Calculate total weight for percentages
  const totalWeight = topCategories.reduce((sum, c) => sum + c.weight, 0);

  const topCategoriesWithPct = topCategories.map(c => ({
    category: c.category,
    count: c.count,
    percentage: totalWeight > 0 ? Math.round((c.weight / totalWeight) * 100) : 0
  }));

  // Calculate category concentration using HHI
  const categoryConcentration = calculateCategoryHHI(categoryWeights);

  // Infer consumer profile from top categories
  const consumerProfile = inferConsumerProfile(topCategoriesWithPct);

  // Calculate targeting intensity
  const targetingIntensity = calculateTargetingIntensity(
    adRatio,
    categoryConcentration,
    adItems,
    items.length
  );

  // Generate explanation
  const explanation = generateExplanation(
    adRatio,
    brandMentions,
    topCategoriesWithPct,
    consumerProfile,
    targetingIntensity,
    items.length
  );

  // Find top signals
  const topSignals = generateTopSignals(
    adRatio,
    brandMentions,
    topCategoriesWithPct,
    categoryConcentration
  );

  // Generate examples
  const examples = generateExamples(items, weightedBrands);

  // Determine status and issues
  const { status, issues } = assessStatus(
    adRatio,
    targetingIntensity,
    items.length
  );

  return {
    metric: 'product_affinity',
    key: 'product_affinity',
    value: {
      adRatio: Math.round(adRatio * 100) / 100,
      brandMentions,
      topCategories: topCategoriesWithPct,
      categoryConcentration: Math.round(categoryConcentration * 100) / 100,
      consumerProfile,
      targetingIntensity: Math.round(targetingIntensity)
    },
    unit: '%',
    confidence: calculateConfidence(items.length, brandMentions),
    explanation,
    topSignals,
    examples,
    status,
    issues
  };
}

/**
 * Calculate HHI for category concentration
 */
function calculateCategoryHHI(categoryWeights: Map<string, number>): number {
  if (categoryWeights.size === 0) return 0;

  const totalWeight = Array.from(categoryWeights.values()).reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  let hhi = 0;
  for (const weight of categoryWeights.values()) {
    const share = weight / totalWeight;
    hhi += share * share;
  }

  return hhi;
}

/**
 * Infer consumer profile from top categories
 */
function inferConsumerProfile(
  topCategories: Array<{ category: string; count: number; percentage: number }>
): string {
  if (topCategories.length === 0) {
    return 'Minimal commercial profiling';
  }

  const top1 = topCategories[0]?.category || '';
  const top2 = topCategories[1]?.category || '';
  const top3 = topCategories[2]?.category || '';

  // Create profile based on top categories
  const profiles: Record<string, string> = {
    fitness: 'Health & Fitness Enthusiast',
    beauty: 'Beauty & Personal Care Consumer',
    tech: 'Tech Early Adopter',
    fashion: 'Fashion-Conscious Shopper',
    food: 'Food & Dining Enthusiast',
    home: 'Home & Lifestyle',
    finance: 'Financial Services Consumer',
    auto: 'Automotive Interest',
    games: 'Gaming Enthusiast',
    outdoors: 'Outdoor & Adventure',
    health_supplements: 'Health & Wellness Consumer'
  };

  // Check for combined profiles
  if ((top1 === 'fitness' || top2 === 'fitness') && (top1 === 'health_supplements' || top2 === 'health_supplements')) {
    return 'Fitness & Wellness Enthusiast';
  }

  if ((top1 === 'fashion' || top2 === 'fashion') && (top1 === 'beauty' || top2 === 'beauty')) {
    return 'Fashion & Beauty Consumer';
  }

  if ((top1 === 'tech' || top2 === 'tech') && (top1 === 'games' || top2 === 'games')) {
    return 'Tech & Gaming Enthusiast';
  }

  // Return primary profile
  return profiles[top1] || 'General Consumer';
}

/**
 * Calculate targeting intensity (0-100)
 */
function calculateTargetingIntensity(
  adRatio: number,
  categoryConcentration: number,
  adItems: Array<{ item: NormalizedItem; features: ItemFeatures }>,
  totalItems: number
): number {
  let score = 0;

  // High ad ratio indicates heavy targeting
  if (adRatio > 0.3) {
    score += 40;
  } else if (adRatio > 0.2) {
    score += 25;
  } else if (adRatio > 0.1) {
    score += 15;
  }

  // High category concentration suggests specific targeting
  if (categoryConcentration > 0.5) {
    score += 30;
  } else if (categoryConcentration > 0.3) {
    score += 20;
  }

  // Many distinct brands in same category = aggressive targeting
  const brandsPerCategory = new Map<string, Set<string>>();
  for (const { features } of adItems) {
    for (const brand of features.brands) {
      const category = features.brandCategories[0] || 'unknown';
      if (!brandsPerCategory.has(category)) {
        brandsPerCategory.set(category, new Set());
      }
      brandsPerCategory.get(category)!.add(brand);
    }
  }

  const maxBrandsInCategory = Math.max(
    ...Array.from(brandsPerCategory.values()).map(s => s.size),
    0
  );

  if (maxBrandsInCategory > 10) {
    score += 20;
  } else if (maxBrandsInCategory > 5) {
    score += 10;
  }

  // Recent ads indicate active profiling
  const recentAds = adItems.filter(i => {
    const age = Date.now() - i.item.timestamp;
    return age < 7 * 24 * 60 * 60 * 1000; // 7 days
  });

  if (recentAds.length / totalItems > 0.15) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Generate explanation text
 */
function generateExplanation(
  adRatio: number,
  brandMentions: number,
  topCategories: Array<{ category: string; count: number; percentage: number }>,
  consumerProfile: string,
  targetingIntensity: number,
  totalItems: number
): string {
  const adPct = Math.round(adRatio * 100);

  let explanation = `${adPct}% of your feed contains commercial content (${brandMentions} brand mentions across ${totalItems} items). `;

  if (topCategories.length > 0) {
    const top3 = topCategories.slice(0, 3).map(c => c.category.replace(/_/g, ' ')).join(', ');
    explanation += `Primary product categories: ${top3}. `;
  }

  explanation += `Inferred consumer profile: ${consumerProfile}. `;

  if (targetingIntensity > 70) {
    explanation += `High targeting intensity (${targetingIntensity}/100) suggests aggressive algorithmic profiling. You're seeing highly personalized commercial content.`;
  } else if (targetingIntensity > 40) {
    explanation += `Moderate targeting (${targetingIntensity}/100). Platforms appear to have built a consumer profile for ad targeting.`;
  } else {
    explanation += `Low targeting intensity (${targetingIntensity}/100). Commercial content appears relatively generic.`;
  }

  return explanation;
}

/**
 * Generate top signals
 */
function generateTopSignals(
  adRatio: number,
  brandMentions: number,
  topCategories: Array<{ category: string; count: number; percentage: number }>,
  categoryConcentration: number
): string[] {
  const signals: string[] = [];

  // Ad ratio
  const adPct = Math.round(adRatio * 100);
  signals.push(`${adPct}% ad/commercial content`);

  // Brand mentions
  signals.push(`${brandMentions} brand mentions detected`);

  // Top categories
  if (topCategories.length > 0) {
    const top3 = topCategories.slice(0, 3)
      .map(c => `${c.category.replace(/_/g, ' ')} (${c.percentage}%)`)
      .join(', ');
    signals.push(`Top categories: ${top3}`);
  }

  // Concentration
  if (categoryConcentration > 0.5) {
    signals.push(`High category concentration (${Math.round(categoryConcentration * 100)}%)`);
  }

  return signals;
}

/**
 * Generate examples
 */
function generateExamples(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>,
  weightedBrands: Array<{ brand: string; category: string; weight: number }>
): string[] {
  const examples: string[] = [];

  // Most promoted brand
  const brandCounts = new Map<string, number>();
  for (const { brand } of weightedBrands) {
    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
  }

  const topBrand = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];

  if (topBrand) {
    const [brand, count] = topBrand;
    const exampleItem = items.find(i => i.features.brands.includes(brand));
    if (exampleItem) {
      const preview = exampleItem.item.text.substring(0, 100);
      examples.push(`Most mentioned brand (${brand}, ${count}x): "${preview}..."`);
    }
  }

  // Explicit ad example
  const explicitAd = items.find(i => i.item.isPromoted);
  if (explicitAd) {
    const preview = explicitAd.item.text.substring(0, 100);
    examples.push(`Promoted content: "${preview}..."`);
  }

  return examples;
}

/**
 * Assess status and identify issues
 */
function assessStatus(
  adRatio: number,
  targetingIntensity: number,
  totalItems: number
): { status: 'ok' | 'warning' | 'error'; issues: string[] } {
  const issues: string[] = [];
  let status: 'ok' | 'warning' | 'error' = 'ok';

  // Check sample size
  if (totalItems < 10) {
    issues.push('Small sample size. Confidence is low.');
    status = 'warning';
  }

  // Check excessive ads
  if (adRatio > 0.4) {
    issues.push('Very high commercial content (>40%). Feed heavily commercialized.');
    status = 'warning';
  }

  if (adRatio > 0.6) {
    issues.push('Extreme commercial saturation (>60%). Consider ad blockers or platform alternatives.');
    status = 'error';
  }

  // Check targeting intensity
  if (targetingIntensity > 75) {
    issues.push('Aggressive algorithmic targeting detected. Your data is being heavily monetized.');
    if (status === 'ok') status = 'warning';
  }

  return { status, issues };
}

/**
 * Calculate confidence score
 */
function calculateConfidence(totalItems: number, brandMentions: number): number {
  // Base confidence on sample size
  let confidence = Math.min(totalItems / 50, 1.0);

  // Reduce confidence if very few brands detected
  if (brandMentions < 3) {
    confidence *= 0.6;
  } else if (brandMentions < 10) {
    confidence *= 0.8;
  }

  return Math.round(confidence * 100) / 100;
}

/**
 * Create empty metric for no data
 */
function createEmptyMetric(): ProductAffinityMetric {
  return {
    metric: 'product_affinity',
    key: 'product_affinity',
    value: {
      adRatio: 0,
      brandMentions: 0,
      topCategories: [],
      categoryConcentration: 0,
      consumerProfile: 'Unknown',
      targetingIntensity: 0
    },
    unit: '%',
    confidence: 0,
    explanation: 'No data available to calculate product affinity metric.',
    topSignals: [],
    examples: [],
    status: 'error',
    issues: ['No items provided for analysis']
  };
}
