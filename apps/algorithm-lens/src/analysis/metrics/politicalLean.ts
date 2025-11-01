// Political Lean Metric - detects political bias in content feed
// Analyzes political terminology, sources, and framing to determine lean

import type { NormalizedItem, ItemFeatures } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { detectPoliticalTerms, calculatePoliticalLean, getPoliticalLabel } from '../rules/politics.lexicon';
import { calculateCombinedWeight } from '../utils/weightings';
import { mean, stdDev } from '../utils/stats';

export interface PoliticalLeanMetric extends MetricBase {
  metric: 'political_lean';
  value: {
    leanScore: number; // -100 (left) to +100 (right)
    label: string; // 'Left-leaning', 'Centrist/Neutral', 'Right-leaning'
    distribution: {
      left: number; // percentage
      center: number; // percentage
      right: number; // percentage
    };
    politicalContentRatio: number; // % of items with political content
    partisanshipIndex: number; // 0-100, how partisan vs neutral
  };
}

/**
 * Calculate political lean metric
 * Analyzes political terminology and framing across content
 *
 * @param items - Array of normalized items with features
 * @returns Political lean metric with explainability
 */
export function calculatePoliticalLean(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): PoliticalLeanMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  // Analyze each item for political content
  const politicalItems: Array<{
    item: NormalizedItem;
    features: ItemFeatures;
    leanScore: number;
    weight: number;
    terms: any[];
  }> = [];

  for (const { item, features } of items) {
    const weight = calculateCombinedWeight(
      item.engagement,
      item.timestamp,
      item.author.followers
    );

    // Detect political terms
    const text = [item.text, ...item.hashtags.map(h => `#${h}`)].join(' ');
    const terms = detectPoliticalTerms(text);

    if (terms.length > 0) {
      const leanScore = calculatePoliticalLean(terms);
      politicalItems.push({ item, features, leanScore, weight, terms });
    }
  }

  // Calculate political content ratio
  const politicalContentRatio = politicalItems.length / items.length;

  // Calculate weighted average lean score
  let weightedLeanSum = 0;
  let totalWeight = 0;

  for (const pItem of politicalItems) {
    weightedLeanSum += pItem.leanScore * pItem.weight;
    totalWeight += pItem.weight;
  }

  const overallLeanScore = totalWeight > 0 ? weightedLeanSum / totalWeight : 0;

  // Calculate distribution (left/center/right)
  const distribution = calculateDistribution(politicalItems);

  // Calculate partisanship index (how extreme vs moderate)
  const partisanshipIndex = calculatePartisanshipIndex(politicalItems);

  // Get label
  const label = getPoliticalLabel(overallLeanScore);

  // Generate explanation
  const explanation = generateExplanation(
    overallLeanScore,
    label,
    distribution,
    politicalContentRatio,
    partisanshipIndex,
    items.length
  );

  // Find top signals
  const topSignals = generateTopSignals(politicalItems, distribution);

  // Generate examples
  const examples = generateExamples(politicalItems);

  // Determine status and issues
  const { status, issues } = assessStatus(
    overallLeanScore,
    politicalContentRatio,
    partisanshipIndex,
    items.length
  );

  return {
    metric: 'political_lean',
    key: 'political_lean_score',
    value: {
      leanScore: Math.round(overallLeanScore),
      label,
      distribution: {
        left: Math.round(distribution.left * 100),
        center: Math.round(distribution.center * 100),
        right: Math.round(distribution.right * 100)
      },
      politicalContentRatio: Math.round(politicalContentRatio * 100) / 100,
      partisanshipIndex: Math.round(partisanshipIndex)
    },
    unit: 'score',
    confidence: calculateConfidence(items.length, politicalItems.length),
    explanation,
    topSignals,
    examples,
    status,
    issues
  };
}

/**
 * Calculate distribution of left/center/right content
 */
function calculateDistribution(
  politicalItems: Array<{ leanScore: number; weight: number }>
): { left: number; center: number; right: number } {
  if (politicalItems.length === 0) {
    return { left: 0, center: 0, right: 0 };
  }

  let leftWeight = 0;
  let centerWeight = 0;
  let rightWeight = 0;
  let totalWeight = 0;

  for (const item of politicalItems) {
    totalWeight += item.weight;

    if (item.leanScore < -40) {
      leftWeight += item.weight;
    } else if (item.leanScore > 40) {
      rightWeight += item.weight;
    } else {
      centerWeight += item.weight;
    }
  }

  return {
    left: totalWeight > 0 ? leftWeight / totalWeight : 0,
    center: totalWeight > 0 ? centerWeight / totalWeight : 0,
    right: totalWeight > 0 ? rightWeight / totalWeight : 0
  };
}

/**
 * Calculate partisanship index (0-100)
 * Higher score = more partisan/extreme content
 */
function calculatePartisanshipIndex(
  politicalItems: Array<{ leanScore: number; weight: number }>
): number {
  if (politicalItems.length === 0) return 0;

  // Calculate weighted average of absolute lean scores
  let weightedAbsSum = 0;
  let totalWeight = 0;

  for (const item of politicalItems) {
    weightedAbsSum += Math.abs(item.leanScore) * item.weight;
    totalWeight += item.weight;
  }

  const avgAbsLean = totalWeight > 0 ? weightedAbsSum / totalWeight : 0;

  // Normalize to 0-100 scale
  return avgAbsLean; // Already in 0-100 range
}

/**
 * Generate explanation text
 */
function generateExplanation(
  leanScore: number,
  label: string,
  distribution: { left: number; center: number; right: number },
  politicalRatio: number,
  partisanshipIndex: number,
  totalItems: number
): string {
  const politicalPct = Math.round(politicalRatio * 100);
  const leftPct = Math.round(distribution.left * 100);
  const centerPct = Math.round(distribution.center * 100);
  const rightPct = Math.round(distribution.right * 100);

  if (politicalRatio < 0.1) {
    return `Very little political content detected (${politicalPct}% of ${totalItems} items). Your feed appears to be primarily non-political.`;
  }

  let explanation = `Your feed shows a ${label.toLowerCase()} bias (score: ${Math.round(leanScore)}). `;
  explanation += `Political content appears in ${politicalPct}% of items, with distribution: ${leftPct}% left-leaning, ${centerPct}% centrist, ${rightPct}% right-leaning. `;

  if (partisanshipIndex > 70) {
    explanation += `High partisanship detected (${Math.round(partisanshipIndex)}/100), suggesting exposure to strongly opinionated sources.`;
  } else if (partisanshipIndex > 40) {
    explanation += `Moderate partisanship (${Math.round(partisanshipIndex)}/100), with a mix of partisan and neutral sources.`;
  } else {
    explanation += `Low partisanship (${Math.round(partisanshipIndex)}/100), indicating mostly moderate or neutral political content.`;
  }

  return explanation;
}

/**
 * Generate top signals
 */
function generateTopSignals(
  politicalItems: Array<{ item: NormalizedItem; leanScore: number; terms: any[]; weight: number }>,
  distribution: { left: number; center: number; right: number }
): string[] {
  const signals: string[] = [];

  // Distribution summary
  const leftPct = Math.round(distribution.left * 100);
  const centerPct = Math.round(distribution.center * 100);
  const rightPct = Math.round(distribution.right * 100);
  signals.push(`Distribution: ${leftPct}% left, ${centerPct}% center, ${rightPct}% right`);

  // Top political terms
  const allTerms = politicalItems.flatMap(p => p.terms);
  const termCounts = new Map<string, number>();
  for (const term of allTerms) {
    termCounts.set(term.term, (termCounts.get(term.term) || 0) + 1);
  }

  const topTerms = Array.from(termCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term]) => term);

  if (topTerms.length > 0) {
    signals.push(`Top political terms: ${topTerms.join(', ')}`);
  }

  // Most biased sources
  const authorBias = new Map<string, { score: number; count: number }>();
  for (const pItem of politicalItems) {
    const authorId = pItem.item.author.username || pItem.item.author.id;
    const existing = authorBias.get(authorId);
    if (existing) {
      existing.score += pItem.leanScore;
      existing.count += 1;
    } else {
      authorBias.set(authorId, { score: pItem.leanScore, count: 1 });
    }
  }

  const mostBiasedAuthors = Array.from(authorBias.entries())
    .map(([author, data]) => ({ author, avgScore: data.score / data.count }))
    .sort((a, b) => Math.abs(b.avgScore) - Math.abs(a.avgScore))
    .slice(0, 3);

  if (mostBiasedAuthors.length > 0) {
    const authorList = mostBiasedAuthors.map(a => {
      const direction = a.avgScore < -40 ? 'left' : a.avgScore > 40 ? 'right' : 'center';
      return `@${a.author} (${direction})`;
    }).join(', ');
    signals.push(`Most political accounts: ${authorList}`);
  }

  return signals;
}

/**
 * Generate examples
 */
function generateExamples(
  politicalItems: Array<{ item: NormalizedItem; leanScore: number; terms: any[] }>
): string[] {
  if (politicalItems.length === 0) return [];

  const examples: string[] = [];

  // Most left-leaning example
  const mostLeft = politicalItems
    .filter(p => p.leanScore < 0)
    .sort((a, b) => a.leanScore - b.leanScore)[0];

  if (mostLeft) {
    const preview = mostLeft.item.text.substring(0, 100);
    const topTerms = mostLeft.terms.slice(0, 3).map(t => t.term).join(', ');
    examples.push(`Left example (score: ${Math.round(mostLeft.leanScore)}): "${preview}..." [Terms: ${topTerms}]`);
  }

  // Most right-leaning example
  const mostRight = politicalItems
    .filter(p => p.leanScore > 0)
    .sort((a, b) => b.leanScore - a.leanScore)[0];

  if (mostRight) {
    const preview = mostRight.item.text.substring(0, 100);
    const topTerms = mostRight.terms.slice(0, 3).map(t => t.term).join(', ');
    examples.push(`Right example (score: ${Math.round(mostRight.leanScore)}): "${preview}..." [Terms: ${topTerms}]`);
  }

  return examples;
}

/**
 * Assess status and identify issues
 */
function assessStatus(
  leanScore: number,
  politicalRatio: number,
  partisanshipIndex: number,
  totalItems: number
): { status: 'ok' | 'warning' | 'error'; issues: string[] } {
  const issues: string[] = [];
  let status: 'ok' | 'warning' | 'error' = 'ok';

  // Check sample size
  if (totalItems < 10) {
    issues.push('Small sample size. Confidence is low.');
    status = 'warning';
  }

  // Check extreme bias
  if (Math.abs(leanScore) > 70) {
    issues.push(`Very strong ${leanScore < 0 ? 'left' : 'right'}-leaning bias detected. Consider diversifying sources.`);
    status = 'warning';
  }

  // Check high partisanship
  if (partisanshipIndex > 75 && politicalRatio > 0.3) {
    issues.push('High partisanship with frequent political content. May indicate filter bubble.');
    if (status === 'ok') status = 'warning';
  }

  // Check extreme partisanship
  if (partisanshipIndex > 85 && politicalRatio > 0.5) {
    issues.push('Extreme partisanship detected. Strongly recommend adding centrist sources.');
    status = 'error';
  }

  return { status, issues };
}

/**
 * Calculate confidence score
 */
function calculateConfidence(totalItems: number, politicalItems: number): number {
  // Base confidence on total sample size
  let confidence = Math.min(totalItems / 50, 1.0);

  // Reduce confidence if very few political items
  if (politicalItems < 5) {
    confidence *= 0.5;
  } else if (politicalItems < 10) {
    confidence *= 0.7;
  }

  return Math.round(confidence * 100) / 100;
}

/**
 * Create empty metric for no data
 */
function createEmptyMetric(): PoliticalLeanMetric {
  return {
    metric: 'political_lean',
    key: 'political_lean_score',
    value: {
      leanScore: 0,
      label: 'Centrist/Neutral',
      distribution: { left: 0, center: 0, right: 0 },
      politicalContentRatio: 0,
      partisanshipIndex: 0
    },
    unit: 'score',
    confidence: 0,
    explanation: 'No data available to calculate political lean metric.',
    topSignals: [],
    examples: [],
    status: 'error',
    issues: ['No items provided for analysis']
  };
}
