// Main Analyzer - orchestrates the complete analysis pipeline
// Normalizes → Extracts Features → Calculates Metrics → Generates Report

import type { RawItem, Platform } from '../../types/content';
import type { AnalyzerOptions, AnalysisReport } from '../../types/analysis';
import type { MetricBundle } from '../../types/metrics';

import { normalizeItems, filterValidItems } from '../normalize/platformNormalizer';
import { extractFeaturesFromItems } from '../normalize/featureExtractor';
import { validateInput, checkMinimumItems } from '../utils/validators';

// Import all metric calculators
import { calculateEchoChamber } from '../metrics/echoChamber';
import { calculatePoliticalLean } from '../metrics/politicalLean';
import { calculateEmotionTone } from '../metrics/emotionTone';
import { calculateProductAffinity } from '../metrics/productAffinity';
import { calculateTopicDiversity } from '../metrics/topicDiversity';
import { calculateSentimentBalance } from '../metrics/sentimentBalance';
import { calculateInfluenceBias } from '../metrics/influenceBias';
import { calculateAdIntent } from '../metrics/adIntent';
import { calculateMisinfoRisk } from '../metrics/misinfoRisk';
import { calculatePlatformContrast } from '../metrics/platformContrast';

import { calibrateMetrics } from './calibration';
import { aggregateMetrics } from './aggregation';
import { generateNarrative } from './narrative';

/**
 * Main analysis function - orchestrates complete pipeline
 * @param rawItems - Array of raw items from any platform
 * @param platform - Source platform
 * @param options - Analysis configuration options
 * @returns Complete analysis report with metrics and narrative
 */
export async function analyzeContent(
  rawItems: RawItem[],
  platform: Platform,
  options: AnalyzerOptions = {}
): Promise<AnalysisReport> {
  const startTime = Date.now();

  // Set defaults
  const opts: Required<AnalyzerOptions> = {
    seed: options.seed ?? 42,
    minItems: options.minItems ?? 10,
    includeRawData: options.includeRawData ?? false,
    calibrate: options.calibrate ?? true,
    generateNarrative: options.generateNarrative ?? true,
    metrics: options.metrics ?? ['all']
  };

  try {
    // Step 1: Validate input
    const validationResult = validateInput(rawItems, platform);
    if (!validationResult.isValid) {
      return createErrorReport(validationResult.errors, startTime);
    }

    // Step 2: Check minimum items
    const minItemsCheck = checkMinimumItems(rawItems.length, opts.minItems);
    if (!minItemsCheck.isValid) {
      return createErrorReport([minItemsCheck.message || 'Insufficient items'], startTime);
    }

    // Step 3: Normalize items
    const normalizedItems = normalizeItems(rawItems, platform);
    const validItems = filterValidItems(normalizedItems);

    if (validItems.length === 0) {
      return createErrorReport(['No valid items after normalization'], startTime);
    }

    // Step 4: Extract features
    const itemsWithFeatures = extractFeaturesFromItems(validItems);

    // Step 5: Calculate all metrics
    const metrics = calculateAllMetrics(itemsWithFeatures, opts.metrics);

    // Step 6: Calibrate metrics (if enabled)
    const calibratedMetrics = opts.calibrate
      ? calibrateMetrics(metrics, { seed: opts.seed })
      : metrics;

    // Step 7: Aggregate metrics
    const aggregated = aggregateMetrics(calibratedMetrics);

    // Step 8: Generate narrative (if enabled)
    const narrative = opts.generateNarrative
      ? generateNarrative(calibratedMetrics, aggregated)
      : undefined;

    // Step 9: Build final report
    const processingTime = Date.now() - startTime;

    const report: AnalysisReport = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        platform,
        itemCount: rawItems.length,
        validItemCount: validItems.length,
        processingTimeMs: processingTime,
        version: '1.0.0',
        seed: opts.seed
      },
      metrics: calibratedMetrics,
      aggregated,
      narrative,
      recommendations: generateRecommendations(calibratedMetrics),
      warnings: collectWarnings(calibratedMetrics),
      rawData: opts.includeRawData ? {
        normalized: validItems,
        features: itemsWithFeatures
      } : undefined
    };

    return report;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorReport([`Analysis failed: ${errorMessage}`], startTime);
  }
}

/**
 * Calculate all requested metrics
 */
function calculateAllMetrics(
  items: Array<{ item: any; features: any }>,
  requestedMetrics: string[]
): MetricBundle {
  const shouldCalculate = (metricName: string) =>
    requestedMetrics.includes('all') || requestedMetrics.includes(metricName);

  const metrics: MetricBundle = {
    echoChamber: shouldCalculate('echoChamber') ? calculateEchoChamber(items) : undefined,
    politicalLean: shouldCalculate('politicalLean') ? calculatePoliticalLean(items) : undefined,
    emotionTone: shouldCalculate('emotionTone') ? calculateEmotionTone(items) : undefined,
    productAffinity: shouldCalculate('productAffinity') ? calculateProductAffinity(items) : undefined,
    topicDiversity: shouldCalculate('topicDiversity') ? calculateTopicDiversity(items) : undefined,
    sentimentBalance: shouldCalculate('sentimentBalance') ? calculateSentimentBalance(items) : undefined,
    influenceBias: shouldCalculate('influenceBias') ? calculateInfluenceBias(items) : undefined,
    adIntent: shouldCalculate('adIntent') ? calculateAdIntent(items) : undefined,
    misinfoRisk: shouldCalculate('misinfoRisk') ? calculateMisinfoRisk(items) : undefined,
    platformContrast: shouldCalculate('platformContrast') ? calculatePlatformContrast(items) : undefined
  };

  return metrics;
}

/**
 * Generate actionable recommendations based on metrics
 */
function generateRecommendations(metrics: MetricBundle): string[] {
  const recommendations: string[] = [];

  // Echo chamber
  if (metrics.echoChamber && metrics.echoChamber.value.score > 70) {
    recommendations.push('Follow more diverse sources to escape your echo chamber');
    recommendations.push('Actively seek opposing viewpoints on topics you care about');
  }

  // Political lean
  if (metrics.politicalLean && Math.abs(metrics.politicalLean.value.leanScore) > 70) {
    recommendations.push('Add centrist or opposing political sources for balance');
  }

  // Emotion manipulation
  if (metrics.emotionTone && metrics.emotionTone.value.manipulationScore > 70) {
    recommendations.push('Be aware of emotionally manipulative content designed for engagement');
    recommendations.push('Consider unfollowing sources that consistently use outrage tactics');
  }

  // Commercial content
  if (metrics.productAffinity && metrics.productAffinity.value.adRatio > 0.4) {
    recommendations.push('Your feed is heavily commercialized - consider ad blockers');
  }

  if (metrics.adIntent && metrics.adIntent.value.undisclosedSponsorshipScore > 70) {
    recommendations.push('Watch for undisclosed sponsorships and affiliate marketing');
  }

  // Topic diversity
  if (metrics.topicDiversity && metrics.topicDiversity.value.diversityScore < 40) {
    recommendations.push('Expand your interests by following accounts in new topic areas');
  }

  // Sentiment
  if (metrics.sentimentBalance && metrics.sentimentBalance.value.negativityBias > 70) {
    recommendations.push('Balance negative content with positive or neutral sources');
    recommendations.push('Consider limiting exposure to doom-scrolling content');
  }

  // Influence bias
  if (metrics.influenceBias && metrics.influenceBias.value.amplificationScore > 70) {
    recommendations.push('Follow smaller accounts and grassroots voices for diverse perspectives');
  }

  // Misinformation
  if (metrics.misinfoRisk && metrics.misinfoRisk.value.avgRiskScore > 60) {
    recommendations.push('Verify claims with fact-checking sites before sharing');
    recommendations.push('Be skeptical of sensational headlines and unverified sources');
  }

  // Platform contrast
  if (metrics.platformContrast && metrics.platformContrast.value.topicDivergence > 70) {
    recommendations.push('Your platforms show very different content - consider why algorithms differ');
  }

  // General recommendation if no issues
  if (recommendations.length === 0) {
    recommendations.push('Your feed shows good balance - maintain diverse sources');
  }

  return recommendations;
}

/**
 * Collect warnings from all metrics
 */
function collectWarnings(metrics: MetricBundle): string[] {
  const warnings: string[] = [];

  for (const [metricName, metric] of Object.entries(metrics)) {
    if (metric && metric.status === 'warning' && metric.issues.length > 0) {
      warnings.push(`[${metricName}] ${metric.issues.join(', ')}`);
    }
    if (metric && metric.status === 'error' && metric.issues.length > 0) {
      warnings.push(`[${metricName}] ERROR: ${metric.issues.join(', ')}`);
    }
  }

  return warnings;
}

/**
 * Create error report when analysis fails
 */
function createErrorReport(errors: string[], startTime: number): AnalysisReport {
  return {
    metadata: {
      analyzedAt: new Date().toISOString(),
      platform: 'unknown' as Platform,
      itemCount: 0,
      validItemCount: 0,
      processingTimeMs: Date.now() - startTime,
      version: '1.0.0',
      seed: 42
    },
    metrics: {},
    aggregated: {
      overallHealth: 0,
      criticalIssues: errors,
      summary: {}
    },
    recommendations: ['Fix errors before analysis can proceed'],
    warnings: errors
  };
}

/**
 * Batch analyze multiple platforms
 * @param platformData - Map of platform to raw items
 * @param options - Analysis options
 * @returns Map of platform to analysis reports
 */
export async function analyzeBatch(
  platformData: Map<Platform, RawItem[]>,
  options: AnalyzerOptions = {}
): Promise<Map<Platform, AnalysisReport>> {
  const results = new Map<Platform, AnalysisReport>();

  for (const [platform, items] of platformData) {
    const report = await analyzeContent(items, platform, options);
    results.set(platform, report);
  }

  return results;
}

/**
 * Quick analysis with minimal options (for testing/demos)
 * @param rawItems - Array of raw items
 * @param platform - Source platform
 * @returns Analysis report
 */
export async function quickAnalyze(
  rawItems: RawItem[],
  platform: Platform
): Promise<AnalysisReport> {
  return analyzeContent(rawItems, platform, {
    seed: 42,
    minItems: 5,
    calibrate: true,
    generateNarrative: true,
    includeRawData: false,
    metrics: ['all']
  });
}
