// Aggregation - combines metrics into high-level summaries and health scores
// Provides holistic view of algorithmic exposure

import type { MetricBundle } from '../../types/metrics';

export interface AggregatedMetrics {
  overallHealth: number; // 0-100 composite health score
  criticalIssues: string[]; // High-priority concerns
  summary: {
    echoScore?: number;
    biasScore?: number;
    manipulationScore?: number;
    commercializationScore?: number;
    credibilityScore?: number;
  };
  categories?: {
    informationDiet: { score: number; label: string };
    emotionalWellbeing: { score: number; label: string };
    commercialExposure: { score: number; label: string };
    sourceCredibility: { score: number; label: string };
  };
}

/**
 * Aggregate all metrics into high-level summary
 * @param metrics - Bundle of calculated metrics
 * @returns Aggregated summary with overall health score
 */
export function aggregateMetrics(metrics: MetricBundle): AggregatedMetrics {
  const criticalIssues: string[] = [];
  const summary: AggregatedMetrics['summary'] = {};

  // Information Diet (echo chamber + topic diversity)
  let echoScore = 0;
  let topicScore = 0;
  let informationDietCount = 0;

  if (metrics.echoChamber) {
    echoScore = 100 - metrics.echoChamber.value.score; // Invert: lower echo = better
    informationDietCount++;
    if (metrics.echoChamber.value.score > 75) {
      criticalIssues.push('Severe echo chamber detected - very limited information diversity');
    }
  }

  if (metrics.topicDiversity) {
    topicScore = metrics.topicDiversity.value.diversityScore;
    informationDietCount++;
    if (topicScore < 30) {
      criticalIssues.push('Very narrow topic range - consider expanding interests');
    }
  }

  const informationDietScore = informationDietCount > 0
    ? Math.round((echoScore + topicScore) / informationDietCount)
    : 50;

  summary.echoScore = informationDietScore;

  // Bias Score (political + influence)
  let politicalBias = 0;
  let influenceBias = 0;
  let biasCount = 0;

  if (metrics.politicalLean) {
    // Convert partisan score to bias (0-100, higher = more biased)
    politicalBias = metrics.politicalLean.value.partisanshipIndex;
    biasCount++;
    if (politicalBias > 80) {
      criticalIssues.push('Extreme political bias - heavily partisan content');
    }
  }

  if (metrics.influenceBias) {
    influenceBias = metrics.influenceBias.value.amplificationScore;
    biasCount++;
    if (influenceBias > 80) {
      criticalIssues.push('Algorithms heavily favor elite voices over grassroots content');
    }
  }

  const biasScore = biasCount > 0
    ? Math.round((politicalBias + influenceBias) / biasCount)
    : 0;

  summary.biasScore = biasScore;

  // Manipulation Score (emotion + sentiment)
  let emotionManipulation = 0;
  let sentimentManipulation = 0;
  let manipulationCount = 0;

  if (metrics.emotionTone) {
    emotionManipulation = metrics.emotionTone.value.manipulationScore;
    manipulationCount++;
    if (emotionManipulation > 80) {
      criticalIssues.push('High emotional manipulation - content designed to trigger outrage');
    }
  }

  if (metrics.sentimentBalance) {
    sentimentManipulation = metrics.sentimentBalance.value.negativityBias;
    manipulationCount++;
    if (sentimentManipulation > 80) {
      criticalIssues.push('Extreme negativity bias - may harm mental wellbeing');
    }
  }

  const manipulationScore = manipulationCount > 0
    ? Math.round((emotionManipulation + sentimentManipulation) / manipulationCount)
    : 0;

  summary.manipulationScore = manipulationScore;

  // Commercialization Score (product affinity + ad intent)
  let productCommerce = 0;
  let adCommerce = 0;
  let commerceCount = 0;

  if (metrics.productAffinity) {
    productCommerce = Math.round(metrics.productAffinity.value.targetingIntensity);
    commerceCount++;
    if (productCommerce > 80) {
      criticalIssues.push('Aggressive commercial targeting - feed heavily monetized');
    }
  }

  if (metrics.adIntent) {
    adCommerce = metrics.adIntent.value.undisclosedSponsorshipScore;
    commerceCount++;
    if (adCommerce > 75) {
      criticalIssues.push('High undisclosed sponsorship - beware hidden advertising');
    }
  }

  const commercializationScore = commerceCount > 0
    ? Math.round((productCommerce + adCommerce) / commerceCount)
    : 0;

  summary.commercializationScore = commercializationScore;

  // Credibility Score
  let credibilityScore = 100; // Start at perfect, deduct for issues

  if (metrics.misinfoRisk) {
    const riskScore = metrics.misinfoRisk.value.avgRiskScore;
    credibilityScore = 100 - riskScore; // Invert: high risk = low credibility

    if (riskScore > 70) {
      criticalIssues.push('High misinformation risk - verify claims before sharing');
    }
  }

  summary.credibilityScore = credibilityScore;

  // Calculate overall health score (0-100)
  // Weighted average of key factors
  const weights = {
    informationDiet: 0.25,
    bias: 0.15,
    manipulation: 0.20,
    commercialization: 0.15,
    credibility: 0.25
  };

  const overallHealth = Math.round(
    informationDietScore * weights.informationDiet +
    (100 - biasScore) * weights.bias + // Invert bias
    (100 - manipulationScore) * weights.manipulation + // Invert manipulation
    (100 - commercializationScore) * weights.commercialization + // Invert commercialization
    credibilityScore * weights.credibility
  );

  // Create categories with labels
  const categories = {
    informationDiet: {
      score: informationDietScore,
      label: getScoreLabel(informationDietScore)
    },
    emotionalWellbeing: {
      score: 100 - manipulationScore, // Invert for clarity
      label: getScoreLabel(100 - manipulationScore)
    },
    commercialExposure: {
      score: 100 - commercializationScore, // Invert for clarity
      label: getScoreLabel(100 - commercializationScore)
    },
    sourceCredibility: {
      score: credibilityScore,
      label: getScoreLabel(credibilityScore)
    }
  };

  return {
    overallHealth,
    criticalIssues,
    summary,
    categories
  };
}

/**
 * Get human-readable label for score
 * @param score - Score from 0-100
 * @returns Label
 */
function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

/**
 * Generate quick summary statistics
 * @param metrics - Metric bundle
 * @returns Key stats
 */
export function getQuickStats(metrics: MetricBundle): Record<string, number | string> {
  const stats: Record<string, number | string> = {};

  if (metrics.echoChamber) {
    stats.echoScore = metrics.echoChamber.value.score;
    stats.diversityScore = metrics.echoChamber.value.diversityScore;
  }

  if (metrics.politicalLean) {
    stats.politicalLean = metrics.politicalLean.value.leanScore;
    stats.politicalLabel = metrics.politicalLean.value.label;
  }

  if (metrics.emotionTone) {
    stats.emotionalValence = metrics.emotionTone.value.avgValence;
    stats.dominantEmotion = metrics.emotionTone.value.dominantEmotion;
  }

  if (metrics.productAffinity) {
    stats.adRatio = `${Math.round(metrics.productAffinity.value.adRatio * 100)}%`;
    stats.consumerProfile = metrics.productAffinity.value.consumerProfile;
  }

  if (metrics.misinfoRisk) {
    stats.misinfoRisk = metrics.misinfoRisk.value.avgRiskScore;
    stats.riskLevel = metrics.misinfoRisk.value.overallRiskLevel;
  }

  return stats;
}

/**
 * Identify most concerning metric
 * @param metrics - Metric bundle
 * @returns Name and score of worst metric
 */
export function getMostConcerningMetric(metrics: MetricBundle): {
  metric: string;
  score: number;
  issue: string;
} | null {
  const concerns: Array<{ metric: string; score: number; issue: string }> = [];

  if (metrics.echoChamber && metrics.echoChamber.value.score > 70) {
    concerns.push({
      metric: 'Echo Chamber',
      score: metrics.echoChamber.value.score,
      issue: 'Very limited information diversity'
    });
  }

  if (metrics.politicalLean && metrics.politicalLean.value.partisanshipIndex > 75) {
    concerns.push({
      metric: 'Political Bias',
      score: metrics.politicalLean.value.partisanshipIndex,
      issue: 'Extreme partisan content'
    });
  }

  if (metrics.emotionTone && metrics.emotionTone.value.manipulationScore > 75) {
    concerns.push({
      metric: 'Emotional Manipulation',
      score: metrics.emotionTone.value.manipulationScore,
      issue: 'Outrage-driven engagement tactics'
    });
  }

  if (metrics.misinfoRisk && metrics.misinfoRisk.value.avgRiskScore > 70) {
    concerns.push({
      metric: 'Misinformation Risk',
      score: metrics.misinfoRisk.value.avgRiskScore,
      issue: 'High exposure to questionable sources'
    });
  }

  if (metrics.adIntent && metrics.adIntent.value.undisclosedSponsorshipScore > 75) {
    concerns.push({
      metric: 'Undisclosed Ads',
      score: metrics.adIntent.value.undisclosedSponsorshipScore,
      issue: 'Hidden commercial content'
    });
  }

  // Return highest scoring concern
  if (concerns.length === 0) return null;

  return concerns.sort((a, b) => b.score - a.score)[0];
}
