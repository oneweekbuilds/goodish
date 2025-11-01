// Emotion Tone Metric - analyzes emotional content using Plutchik's emotion model
// Maps content to valence/arousal space and detects emotional manipulation

import type { NormalizedItem, ItemFeatures } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { detectEmotions, calculateEmotionalState, getEmotionDistribution } from '../rules/emotions.lexicon';
import { calculateCombinedWeight } from '../utils/weightings';
import { mean, stdDev } from '../utils/stats';

export interface EmotionToneMetric extends MetricBase {
  metric: 'emotion_tone';
  value: {
    avgValence: number; // -1 (negative) to +1 (positive)
    avgArousal: number; // 0 (calm) to 1 (excited)
    dominantEmotion: string; // joy, trust, fear, surprise, sadness, disgust, anger, anticipation
    emotionDistribution: Record<string, number>; // percentage by family
    manipulationScore: number; // 0-100, likelihood of emotional manipulation
    toneLabel: string; // 'Positive & Calm', 'Negative & Intense', etc.
  };
}

/**
 * Calculate emotion tone metric
 * Analyzes emotional content across Plutchik's 8 emotion families
 *
 * @param items - Array of normalized items with features
 * @returns Emotion tone metric with explainability
 */
export function calculateEmotionTone(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): EmotionToneMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  // Analyze emotions in each item
  const emotionalItems: Array<{
    item: NormalizedItem;
    features: ItemFeatures;
    emotions: any[];
    valence: number;
    arousal: number;
    weight: number;
  }> = [];

  for (const { item, features } of items) {
    const weight = calculateCombinedWeight(
      item.engagement,
      item.timestamp,
      item.author.followers
    );

    // Detect emotions
    const text = [item.text, ...item.hashtags.map(h => `#${h}`)].join(' ');
    const emotions = detectEmotions(text);

    if (emotions.length > 0) {
      const { valence, arousal } = calculateEmotionalState(emotions);
      emotionalItems.push({ item, features, emotions, valence, arousal, weight });
    }
  }

  // If no emotional content detected, return neutral
  if (emotionalItems.length === 0) {
    return createNeutralMetric(items.length);
  }

  // Calculate weighted average valence and arousal
  let weightedValenceSum = 0;
  let weightedArousalSum = 0;
  let totalWeight = 0;

  for (const eItem of emotionalItems) {
    weightedValenceSum += eItem.valence * eItem.weight;
    weightedArousalSum += eItem.arousal * eItem.weight;
    totalWeight += eItem.weight;
  }

  const avgValence = totalWeight > 0 ? weightedValenceSum / totalWeight : 0;
  const avgArousal = totalWeight > 0 ? weightedArousalSum / totalWeight : 0;

  // Calculate emotion distribution
  const allEmotions = emotionalItems.flatMap(e => e.emotions);
  const distribution = getEmotionDistribution(allEmotions);

  // Find dominant emotion
  const dominantEmotion = Object.entries(distribution)
    .sort((a, b) => b[1].percentage - a[1].percentage)[0]?.[0] || 'neutral';

  // Calculate manipulation score
  const manipulationScore = calculateManipulationScore(
    emotionalItems,
    avgValence,
    avgArousal,
    distribution
  );

  // Generate tone label
  const toneLabel = getToneLabel(avgValence, avgArousal);

  // Generate explanation
  const explanation = generateExplanation(
    avgValence,
    avgArousal,
    dominantEmotion,
    toneLabel,
    manipulationScore,
    emotionalItems.length,
    items.length
  );

  // Find top signals
  const topSignals = generateTopSignals(distribution, avgValence, avgArousal, manipulationScore);

  // Generate examples
  const examples = generateExamples(emotionalItems);

  // Determine status and issues
  const { status, issues } = assessStatus(
    avgValence,
    avgArousal,
    manipulationScore,
    items.length
  );

  // Convert distribution to percentages only
  const percentageDistribution: Record<string, number> = {};
  for (const [emotion, data] of Object.entries(distribution)) {
    percentageDistribution[emotion] = data.percentage;
  }

  return {
    metric: 'emotion_tone',
    key: 'emotion_tone',
    value: {
      avgValence: Math.round(avgValence * 100) / 100,
      avgArousal: Math.round(avgArousal * 100) / 100,
      dominantEmotion,
      emotionDistribution: percentageDistribution,
      manipulationScore: Math.round(manipulationScore),
      toneLabel
    },
    unit: 'index',
    confidence: calculateConfidence(items.length, emotionalItems.length),
    explanation,
    topSignals,
    examples,
    status,
    issues
  };
}

/**
 * Calculate manipulation score (0-100)
 * Higher score indicates potential emotional manipulation
 */
function calculateManipulationScore(
  emotionalItems: Array<{ emotions: any[]; valence: number; arousal: number; weight: number }>,
  avgValence: number,
  avgArousal: number,
  distribution: Record<string, { count: number; percentage: number }>
): number {
  let score = 0;

  // High arousal increases manipulation likelihood
  if (avgArousal > 0.7) {
    score += 30;
  } else if (avgArousal > 0.5) {
    score += 15;
  }

  // Extreme valence (very negative) suggests fear/outrage tactics
  if (avgValence < -0.6) {
    score += 25;
  }

  // High concentration in fear or anger families
  const fearPct = distribution.fear?.percentage || 0;
  const angerPct = distribution.anger?.percentage || 0;
  const disgustPct = distribution.disgust?.percentage || 0;

  if (fearPct > 30 || angerPct > 30) {
    score += 20;
  }

  if (fearPct + angerPct + disgustPct > 50) {
    score += 15;
  }

  // Lack of positive emotions with high negative is concerning
  const joyPct = distribution.joy?.percentage || 0;
  const trustPct = distribution.trust?.percentage || 0;

  if (joyPct + trustPct < 10 && avgValence < -0.3) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Get tone label from valence/arousal
 */
function getToneLabel(valence: number, arousal: number): string {
  if (valence > 0.3) {
    return arousal > 0.5 ? 'Positive & Energetic' : 'Positive & Calm';
  } else if (valence < -0.3) {
    return arousal > 0.5 ? 'Negative & Intense' : 'Negative & Low-energy';
  } else {
    return arousal > 0.5 ? 'Neutral & Active' : 'Neutral & Calm';
  }
}

/**
 * Generate explanation text
 */
function generateExplanation(
  valence: number,
  arousal: number,
  dominantEmotion: string,
  toneLabel: string,
  manipulationScore: number,
  emotionalItemCount: number,
  totalItems: number
): string {
  const emotionalPct = Math.round((emotionalItemCount / totalItems) * 100);

  let explanation = `Your feed has a ${toneLabel.toLowerCase()} emotional tone (valence: ${valence.toFixed(2)}, arousal: ${arousal.toFixed(2)}). `;
  explanation += `${emotionalPct}% of content contains emotional language, with ${dominantEmotion} as the dominant emotion. `;

  if (manipulationScore > 70) {
    explanation += `High manipulation score (${manipulationScore}/100) detected. Content appears designed to trigger strong emotional responses, potentially to drive engagement through outrage or fear.`;
  } else if (manipulationScore > 40) {
    explanation += `Moderate manipulation indicators (${manipulationScore}/100). Some content uses emotionally charged language that may be optimized for engagement.`;
  } else {
    explanation += `Low manipulation risk (${manipulationScore}/100). Emotional content appears authentic rather than engineered for viral engagement.`;
  }

  return explanation;
}

/**
 * Generate top signals
 */
function generateTopSignals(
  distribution: Record<string, { count: number; percentage: number }>,
  valence: number,
  arousal: number,
  manipulationScore: number
): string[] {
  const signals: string[] = [];

  // Valence/Arousal position
  signals.push(`Valence: ${valence.toFixed(2)} (${valence > 0 ? 'positive' : valence < 0 ? 'negative' : 'neutral'})`);
  signals.push(`Arousal: ${arousal.toFixed(2)} (${arousal > 0.6 ? 'high' : arousal > 0.3 ? 'medium' : 'low'})`);

  // Top 3 emotions
  const topEmotions = Object.entries(distribution)
    .sort((a, b) => b[1].percentage - a[1].percentage)
    .slice(0, 3)
    .map(([emotion, data]) => `${emotion} (${data.percentage}%)`);

  if (topEmotions.length > 0) {
    signals.push(`Top emotions: ${topEmotions.join(', ')}`);
  }

  // Manipulation indicators
  if (manipulationScore > 50) {
    signals.push(`Manipulation score: ${Math.round(manipulationScore)}/100 (elevated)`);
  }

  // Specific emotion families of concern
  const fearPct = distribution.fear?.percentage || 0;
  const angerPct = distribution.anger?.percentage || 0;

  if (fearPct > 20) {
    signals.push(`High fear content (${fearPct}%)`);
  }
  if (angerPct > 20) {
    signals.push(`High anger content (${angerPct}%)`);
  }

  return signals;
}

/**
 * Generate examples
 */
function generateExamples(
  emotionalItems: Array<{ item: NormalizedItem; emotions: any[]; valence: number; arousal: number }>
): string[] {
  if (emotionalItems.length === 0) return [];

  const examples: string[] = [];

  // Most positive example
  const mostPositive = emotionalItems
    .filter(e => e.valence > 0)
    .sort((a, b) => b.valence - a.valence)[0];

  if (mostPositive) {
    const preview = mostPositive.item.text.substring(0, 100);
    const topEmotions = mostPositive.emotions.slice(0, 3).map(e => e.family).join(', ');
    examples.push(`Most positive (${mostPositive.valence.toFixed(2)}): "${preview}..." [${topEmotions}]`);
  }

  // Most negative example
  const mostNegative = emotionalItems
    .filter(e => e.valence < 0)
    .sort((a, b) => a.valence - b.valence)[0];

  if (mostNegative) {
    const preview = mostNegative.item.text.substring(0, 100);
    const topEmotions = mostNegative.emotions.slice(0, 3).map(e => e.family).join(', ');
    examples.push(`Most negative (${mostNegative.valence.toFixed(2)}): "${preview}..." [${topEmotions}]`);
  }

  // Highest arousal example
  const highestArousal = [...emotionalItems]
    .sort((a, b) => b.arousal - a.arousal)[0];

  if (highestArousal && highestArousal.arousal > 0.7) {
    const preview = highestArousal.item.text.substring(0, 100);
    examples.push(`Highest arousal (${highestArousal.arousal.toFixed(2)}): "${preview}..."`);
  }

  return examples;
}

/**
 * Assess status and identify issues
 */
function assessStatus(
  valence: number,
  arousal: number,
  manipulationScore: number,
  totalItems: number
): { status: 'ok' | 'warning' | 'error'; issues: string[] } {
  const issues: string[] = [];
  let status: 'ok' | 'warning' | 'error' = 'ok';

  // Check sample size
  if (totalItems < 10) {
    issues.push('Small sample size. Confidence is low.');
    status = 'warning';
  }

  // Check extreme negativity
  if (valence < -0.6 && arousal > 0.6) {
    issues.push('Very negative and high-arousal content detected. May indicate exposure to outrage-driven media.');
    status = 'warning';
  }

  // Check manipulation
  if (manipulationScore > 70) {
    issues.push('High manipulation score. Content appears designed to trigger emotional responses.');
    if (status === 'ok') status = 'warning';
  }

  if (manipulationScore > 85) {
    issues.push('Severe emotional manipulation detected. Consider diversifying sources.');
    status = 'error';
  }

  return { status, issues };
}

/**
 * Calculate confidence score
 */
function calculateConfidence(totalItems: number, emotionalItems: number): number {
  // Base confidence on total sample size
  let confidence = Math.min(totalItems / 50, 1.0);

  // Reduce confidence if very few emotional items
  if (emotionalItems < 5) {
    confidence *= 0.5;
  } else if (emotionalItems < 10) {
    confidence *= 0.7;
  }

  return Math.round(confidence * 100) / 100;
}

/**
 * Create empty metric for no data
 */
function createEmptyMetric(): EmotionToneMetric {
  return {
    metric: 'emotion_tone',
    key: 'emotion_tone',
    value: {
      avgValence: 0,
      avgArousal: 0,
      dominantEmotion: 'neutral',
      emotionDistribution: {},
      manipulationScore: 0,
      toneLabel: 'Neutral'
    },
    unit: 'index',
    confidence: 0,
    explanation: 'No data available to calculate emotion tone metric.',
    topSignals: [],
    examples: [],
    status: 'error',
    issues: ['No items provided for analysis']
  };
}

/**
 * Create neutral metric when no emotions detected
 */
function createNeutralMetric(totalItems: number): EmotionToneMetric {
  return {
    metric: 'emotion_tone',
    key: 'emotion_tone',
    value: {
      avgValence: 0,
      avgArousal: 0,
      dominantEmotion: 'neutral',
      emotionDistribution: {},
      manipulationScore: 0,
      toneLabel: 'Neutral & Calm'
    },
    unit: 'index',
    confidence: 0.5,
    explanation: `No significant emotional language detected across ${totalItems} items. Content appears to be primarily factual or neutral in tone.`,
    topSignals: ['No emotional language detected', 'Neutral tone throughout feed'],
    examples: [],
    status: 'ok',
    issues: []
  };
}
