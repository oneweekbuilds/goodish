/**
 * Political Leaning Classifier
 *
 * Multi-signal approach:
 * 1. Outlet/handle dictionaries (left vs right sources)
 * 2. Keyword lexicons (weighted policy terms)
 *
 * Transparent and explainable - users can see exact triggers
 */

import { EnrichedRecord, Lean, PoliticalInsight } from '../../types/insights';

// Outlet dictionaries (handles/sources)
export const LEFT_OUTLETS = [
  'msnbc', 'nytimes', 'washingtonpost', 'huffpost', 'motherjones',
  'theatlantic', 'vox', 'cnn', 'npr', 'pbs', 'maddow', 'msnbcdaily',
  'nyt', 'wapo', 'slate', 'thenation', 'jacobin', 'commondreams'
];

export const RIGHT_OUTLETS = [
  'foxnews', 'breitbart', 'dailywire', 'nypost', 'newsmax',
  'thefederalist', 'oann', 'benshapiro', 'seanhannity', 'tuckercarl',
  'foxandfriends', 'washex', 'dailycaller', 'redstate', 'pjmedia'
];

// Keyword lexicons (weighted)
export const LEFT_KEYWORDS = [
  'climate justice', 'universal healthcare', 'gun control', 'reproductive rights',
  'student debt relief', 'living wage', 'green new deal', 'medicare for all',
  'social justice', 'systemic racism', 'wealth tax', 'union rights',
  'lgbtq rights', 'voting rights', 'police reform', 'criminal justice reform'
];

export const RIGHT_KEYWORDS = [
  'border security', '2a', 'second amendment', 'pro life', 'tax cuts',
  'election integrity', 'parental rights', 'woke', 'cancel culture',
  'traditional values', 'religious freedom', 'school choice', 'free market',
  'small government', 'law and order', 'illegal immigration', 'energy independence'
];

/**
 * Check if author/handle matches a political outlet
 */
function matchesOutlet(author: string, outlets: string[]): boolean {
  const lower = author.toLowerCase().replace(/[@_\s]/g, '');
  return outlets.some(outlet => lower.includes(outlet.replace(/[@_\s]/g, '')));
}

/**
 * Count keyword matches in text
 */
function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    return count + (lower.includes(keyword.toLowerCase()) ? 1 : 0);
  }, 0);
}

/**
 * Classify a single record's political lean
 */
export function classifyPolitical(record: EnrichedRecord): { lean: Lean; leftScore: number; rightScore: number } {
  let leftScore = 0;
  let rightScore = 0;

  const author = record.author || '';
  const text = record.text || '';

  // Check outlet/handle matches
  if (matchesOutlet(author, LEFT_OUTLETS)) {
    leftScore += 2;
  }
  if (matchesOutlet(author, RIGHT_OUTLETS)) {
    rightScore += 2;
  }

  // Check keyword matches
  leftScore += countKeywords(text, LEFT_KEYWORDS);
  rightScore += countKeywords(text, RIGHT_KEYWORDS);

  // Determine lean
  let lean: Lean = 'neutral';
  if (leftScore > 0 || rightScore > 0) {
    if (leftScore >= rightScore + 2) {
      lean = 'left';
    } else if (rightScore >= leftScore + 2) {
      lean = 'right';
    }
    // If within 1 point, stays neutral
  }

  return { lean, leftScore, rightScore };
}

/**
 * Compute political insight from all records
 */
export function computePoliticalInsight(records: EnrichedRecord[]): PoliticalInsight {
  let leftCount = 0;
  let rightCount = 0;
  let neutralCount = 0;

  const outletCounts: Map<string, { lean: Lean; count: number }> = new Map();

  for (const record of records) {
    const { lean } = classifyPolitical(record);
    record.politicalLean = lean;

    // Count leans
    if (lean === 'left') leftCount++;
    else if (lean === 'right') rightCount++;
    else neutralCount++;

    // Track outlet counts
    const author = record.author || 'Unknown';
    if (lean !== 'neutral') {
      const existing = outletCounts.get(author) || { lean, count: 0 };
      outletCounts.set(author, { lean, count: existing.count + 1 });
    }
  }

  const totalPolitical = leftCount + rightCount + neutralCount;
  const leftPct = totalPolitical > 0 ? (leftCount / totalPolitical) * 100 : 0;
  const rightPct = totalPolitical > 0 ? (rightCount / totalPolitical) * 100 : 0;
  const neutralPct = totalPolitical > 0 ? (neutralCount / totalPolitical) * 100 : 0;

  // Confidence based on sample size and signal strength
  const confidence = Math.min(100, (totalPolitical / 50) * 100);

  // Top outlets
  const topOutlets = Array.from(outletCounts.entries())
    .map(([name, { lean, count }]) => ({ name, lean, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    leftPct,
    rightPct,
    neutralPct,
    confidence,
    topOutlets,
  };
}

/**
 * Get explanation for a record's classification
 */
export function explainPoliticalClassification(record: EnrichedRecord): string[] {
  const explanations: string[] = [];
  const author = record.author || '';
  const text = record.text || '';

  // Outlet matches
  if (matchesOutlet(author, LEFT_OUTLETS)) {
    const matched = LEFT_OUTLETS.find(o => author.toLowerCase().includes(o));
    explanations.push(`Author matches left-leaning outlet: ${matched}`);
  }
  if (matchesOutlet(author, RIGHT_OUTLETS)) {
    const matched = RIGHT_OUTLETS.find(o => author.toLowerCase().includes(o));
    explanations.push(`Author matches right-leaning outlet: ${matched}`);
  }

  // Keyword matches
  const leftMatches = LEFT_KEYWORDS.filter(kw => text.toLowerCase().includes(kw.toLowerCase()));
  if (leftMatches.length > 0) {
    explanations.push(`Left keywords: ${leftMatches.join(', ')}`);
  }

  const rightMatches = RIGHT_KEYWORDS.filter(kw => text.toLowerCase().includes(kw.toLowerCase()));
  if (rightMatches.length > 0) {
    explanations.push(`Right keywords: ${rightMatches.join(', ')}`);
  }

  return explanations;
}
