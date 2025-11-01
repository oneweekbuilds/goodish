// Misinformation Risk Metric - assesses credibility and fact-checking needs
// Detects low-credibility sources and manipulation patterns

import type { NormalizedItem, ItemFeatures } from '../../types/content';
import type { MetricBase } from '../../types/metrics';
import { calculateMisinfoRisk as assessMisinfoRisk } from '../rules/misinformation.sources';
import { calculateCombinedWeight } from '../utils/weightings';
import { mean } from '../utils/stats';

export interface MisinfoRiskMetric extends MetricBase {
  metric: 'misinfo_risk';
  value: {
    avgRiskScore: number; // 0-100, weighted average
    highRiskRatio: number; // % with risk > 60
    flaggedSourcesCount: number; // number of known problematic sources
    unverifiedRatio: number; // % from unverified accounts
    overallRiskLevel: string; // 'Low', 'Moderate', 'High', 'Critical'
  };
}

export function calculateMisinfoRisk(
  items: Array<{ item: NormalizedItem; features: ItemFeatures }>
): MisinfoRiskMetric {
  if (items.length === 0) {
    return createEmptyMetric();
  }

  const riskAssessments: Array<{ risk: number; weight: number; patterns: string[] }> = [];
  const flaggedSources = new Set<string>();
  let unverifiedCount = 0;

  for (const { item, features } of items) {
    const weight = calculateCombinedWeight(item.engagement, item.timestamp, item.author.followers);

    // Assess misinformation risk for first URL or text
    const url = item.urls[0];
    const assessment = assessMisinfoRisk(url, item.text);

    riskAssessments.push({
      risk: assessment.overallRisk,
      weight,
      patterns: assessment.patterns
    });

    // Track flagged sources
    if (assessment.sourceRisk > 60 && url) {
      try {
        const domain = new URL(url).hostname;
        flaggedSources.add(domain);
      } catch {
        // Invalid URL
      }
    }

    // Track unverified accounts
    if (!item.isVerified) {
      unverifiedCount++;
    }
  }

  // Calculate weighted average risk
  let weightedRiskSum = 0;
  let totalWeight = 0;

  for (const { risk, weight } of riskAssessments) {
    weightedRiskSum += risk * weight;
    totalWeight += weight;
  }

  const avgRiskScore = totalWeight > 0 ? weightedRiskSum / totalWeight : 0;

  // High risk ratio
  const highRiskCount = riskAssessments.filter(r => r.risk > 60).length;
  const highRiskRatio = highRiskCount / items.length;

  // Unverified ratio
  const unverifiedRatio = unverifiedCount / items.length;

  // Overall risk level
  const overallRiskLevel = getRiskLevel(avgRiskScore, highRiskRatio);

  const explanation = `Average misinformation risk: ${Math.round(avgRiskScore)}/100 (${overallRiskLevel}). ${Math.round(highRiskRatio * 100)}% of content from high-risk sources. ${flaggedSources.size} known problematic sources detected. ${Math.round(unverifiedRatio * 100)}% from unverified accounts. ${avgRiskScore > 60 ? 'Exercise caution and verify claims independently.' : avgRiskScore > 30 ? 'Some questionable sources present.' : 'Relatively credible source mix.'}`;

  const { status, issues } = avgRiskScore > 60 ?
    { status: 'warning' as const, issues: [`High misinformation risk (${Math.round(avgRiskScore)}/100)`] } :
    avgRiskScore > 80 ?
    { status: 'error' as const, issues: ['Critical misinformation risk - verify all claims'] } :
    { status: 'ok' as const, issues: [] };

  return {
    metric: 'misinfo_risk',
    key: 'misinfo_risk',
    value: {
      avgRiskScore: Math.round(avgRiskScore),
      highRiskRatio: Math.round(highRiskRatio * 100) / 100,
      flaggedSourcesCount: flaggedSources.size,
      unverifiedRatio: Math.round(unverifiedRatio * 100) / 100,
      overallRiskLevel
    },
    unit: 'score',
    confidence: Math.min(items.length / 50, 1.0),
    explanation,
    topSignals: [
      `Risk score: ${Math.round(avgRiskScore)}/100`,
      `${flaggedSources.size} flagged sources`,
      `${Math.round(highRiskRatio * 100)}% high-risk content`
    ],
    examples: [],
    status,
    issues
  };
}

function getRiskLevel(avgScore: number, highRiskRatio: number): string {
  if (avgScore > 70 || highRiskRatio > 0.3) return 'Critical';
  if (avgScore > 50 || highRiskRatio > 0.15) return 'High';
  if (avgScore > 30 || highRiskRatio > 0.05) return 'Moderate';
  return 'Low';
}

function createEmptyMetric(): MisinfoRiskMetric {
  return {
    metric: 'misinfo_risk',
    key: 'misinfo_risk',
    value: {
      avgRiskScore: 0,
      highRiskRatio: 0,
      flaggedSourcesCount: 0,
      unverifiedRatio: 0,
      overallRiskLevel: 'Unknown'
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
