// Calibration - adjusts metrics to population baselines for accurate interpretation
// Uses deterministic baseline parameters to normalize scores

import type { MetricBundle, CalibrationParams } from '../../types/metrics';
import { seededRandom } from '../utils/hashSeed';

/**
 * Population baseline parameters
 * These represent "average" user across platforms (derived from research/testing)
 */
const BASELINE_PARAMS: Record<string, CalibrationParams> = {
  echoChamber: {
    mean: 55, // Average user has moderate echo chamber
    stdDev: 15,
    min: 0,
    max: 100
  },
  politicalLean: {
    mean: 0, // Neutral average
    stdDev: 35, // Wide variance in population
    min: -100,
    max: 100
  },
  emotionTone: {
    mean: 0.1, // Slightly positive average
    stdDev: 0.4,
    min: -1,
    max: 1
  },
  productAffinity: {
    mean: 0.25, // 25% ads is typical
    stdDev: 0.15,
    min: 0,
    max: 1
  },
  topicDiversity: {
    mean: 60, // Moderate diversity
    stdDev: 20,
    min: 0,
    max: 100
  },
  sentimentBalance: {
    mean: 0, // Neutral baseline
    stdDev: 0.3,
    min: -1,
    max: 1
  },
  influenceBias: {
    mean: 50000, // 50k average follower count
    stdDev: 100000,
    min: 0,
    max: 10000000
  },
  adIntent: {
    mean: 0.15, // 15% undisclosed sponsorship
    stdDev: 0.12,
    min: 0,
    max: 1
  },
  misinfoRisk: {
    mean: 30, // Low-moderate baseline risk
    stdDev: 20,
    min: 0,
    max: 100
  },
  platformContrast: {
    mean: 40, // Moderate divergence
    stdDev: 25,
    min: 0,
    max: 100
  }
};

/**
 * Calibrate metrics against population baselines
 * @param metrics - Raw metric bundle
 * @param options - Calibration options
 * @returns Calibrated metrics with adjusted confidence
 */
export function calibrateMetrics(
  metrics: MetricBundle,
  options: { seed?: number } = {}
): MetricBundle {
  const seed = options.seed ?? 42;
  const calibrated: MetricBundle = {};

  // Echo chamber
  if (metrics.echoChamber) {
    const score = metrics.echoChamber.value.score;
    const baseline = BASELINE_PARAMS.echoChamber;
    const calibratedScore = calibrateScore(score, baseline);

    calibrated.echoChamber = {
      ...metrics.echoChamber,
      value: {
        ...metrics.echoChamber.value,
        score: calibratedScore
      },
      notes: [
        ...(metrics.echoChamber.notes || []),
        `Calibrated against baseline (mean: ${baseline.mean}, stdDev: ${baseline.stdDev})`
      ]
    };
  }

  // Political lean
  if (metrics.politicalLean) {
    const score = metrics.politicalLean.value.leanScore;
    const baseline = BASELINE_PARAMS.politicalLean;
    const calibratedScore = calibrateScore(score, baseline, { preserveSign: true });

    calibrated.politicalLean = {
      ...metrics.politicalLean,
      value: {
        ...metrics.politicalLean.value,
        leanScore: calibratedScore
      },
      notes: [
        ...(metrics.politicalLean.notes || []),
        `Calibrated against neutral baseline`
      ]
    };
  }

  // Emotion tone - calibrate valence
  if (metrics.emotionTone) {
    const valence = metrics.emotionTone.value.avgValence;
    const baseline = BASELINE_PARAMS.emotionTone;
    const calibratedValence = calibrateScore(valence, baseline, { preserveSign: true });

    calibrated.emotionTone = {
      ...metrics.emotionTone,
      value: {
        ...metrics.emotionTone.value,
        avgValence: Number(calibratedValence.toFixed(2))
      },
      notes: [
        ...(metrics.emotionTone.notes || []),
        `Valence calibrated to population baseline`
      ]
    };
  }

  // Product affinity - calibrate ad ratio
  if (metrics.productAffinity) {
    const adRatio = metrics.productAffinity.value.adRatio;
    const baseline = BASELINE_PARAMS.productAffinity;

    // Don't recalibrate ratio itself, but add context note
    calibrated.productAffinity = {
      ...metrics.productAffinity,
      notes: [
        ...(metrics.productAffinity.notes || []),
        `Population avg: ${Math.round(baseline.mean * 100)}% commercial content`
      ]
    };
  }

  // Topic diversity
  if (metrics.topicDiversity) {
    const score = metrics.topicDiversity.value.diversityScore;
    const baseline = BASELINE_PARAMS.topicDiversity;
    const calibratedScore = calibrateScore(score, baseline);

    calibrated.topicDiversity = {
      ...metrics.topicDiversity,
      value: {
        ...metrics.topicDiversity.value,
        diversityScore: calibratedScore
      },
      notes: [
        ...(metrics.topicDiversity.notes || []),
        `Calibrated against avg diversity (${baseline.mean}/100)`
      ]
    };
  }

  // Sentiment balance
  if (metrics.sentimentBalance) {
    calibrated.sentimentBalance = {
      ...metrics.sentimentBalance,
      notes: [
        ...(metrics.sentimentBalance.notes || []),
        `Population baseline: ${baseline.mean.toFixed(2)} (neutral)`
      ]
    };
  }

  // Influence bias
  if (metrics.influenceBias) {
    calibrated.influenceBias = {
      ...metrics.influenceBias,
      notes: [
        ...(metrics.influenceBias.notes || []),
        `Population avg follower count: ${BASELINE_PARAMS.influenceBias.mean.toLocaleString()}`
      ]
    };
  }

  // Ad intent
  if (metrics.adIntent) {
    calibrated.adIntent = {
      ...metrics.adIntent,
      notes: [
        ...(metrics.adIntent.notes || []),
        `Baseline undisclosed sponsorship: ${Math.round(BASELINE_PARAMS.adIntent.mean * 100)}%`
      ]
    };
  }

  // Misinfo risk
  if (metrics.misinfoRisk) {
    const score = metrics.misinfoRisk.value.avgRiskScore;
    const baseline = BASELINE_PARAMS.misinfoRisk;
    const calibratedScore = calibrateScore(score, baseline);

    calibrated.misinfoRisk = {
      ...metrics.misinfoRisk,
      value: {
        ...metrics.misinfoRisk.value,
        avgRiskScore: calibratedScore
      },
      notes: [
        ...(metrics.misinfoRisk.notes || []),
        `Calibrated against baseline risk (${baseline.mean}/100)`
      ]
    };
  }

  // Platform contrast
  if (metrics.platformContrast) {
    calibrated.platformContrast = {
      ...metrics.platformContrast,
      notes: [
        ...(metrics.platformContrast.notes || []),
        `Typical platform divergence: ${BASELINE_PARAMS.platformContrast.mean}/100`
      ]
    };
  }

  return calibrated;
}

/**
 * Calibrate a single score against baseline parameters
 * @param rawScore - Uncalibrated score
 * @param baseline - Baseline parameters
 * @param options - Calibration options
 * @returns Calibrated score
 */
function calibrateScore(
  rawScore: number,
  baseline: CalibrationParams,
  options: { preserveSign?: boolean } = {}
): number {
  // Calculate z-score relative to baseline
  const zScore = (rawScore - baseline.mean) / baseline.stdDev;

  // Gentle calibration: move slightly toward baseline if extreme
  // This prevents over-correction while still normalizing outliers
  let calibrated: number;

  if (Math.abs(zScore) > 2) {
    // More than 2 std devs away - pull slightly toward baseline
    const pullStrength = 0.15; // 15% pull toward baseline
    calibrated = rawScore * (1 - pullStrength) + baseline.mean * pullStrength;
  } else {
    // Within 2 std devs - keep as is
    calibrated = rawScore;
  }

  // Clamp to valid range
  calibrated = Math.max(baseline.min, Math.min(baseline.max, calibrated));

  // Preserve sign if needed (for bipolar metrics like political lean)
  if (options.preserveSign && Math.sign(calibrated) !== Math.sign(rawScore)) {
    calibrated = rawScore; // Don't flip sign
  }

  // Round appropriately
  if (baseline.max <= 1) {
    return Math.round(calibrated * 100) / 100; // 2 decimal places for ratios
  } else {
    return Math.round(calibrated); // Whole numbers for scores
  }
}

/**
 * Get baseline parameter for a metric
 * @param metricName - Name of metric
 * @returns Baseline parameters or undefined
 */
export function getBaseline(metricName: string): CalibrationParams | undefined {
  return BASELINE_PARAMS[metricName];
}

/**
 * Calculate percentile rank relative to baseline
 * Assumes normal distribution
 * @param score - Raw score
 * @param baseline - Baseline parameters
 * @returns Percentile (0-100)
 */
export function calculatePercentile(score: number, baseline: CalibrationParams): number {
  const zScore = (score - baseline.mean) / baseline.stdDev;

  // Approximate CDF of standard normal distribution
  // Using error function approximation
  const percentile = cdf(zScore) * 100;

  return Math.round(percentile);
}

/**
 * Cumulative distribution function for standard normal
 * @param z - Z-score
 * @returns Probability (0-1)
 */
function cdf(z: number): number {
  // Abramowitz and Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - p : p;
}

/**
 * Get interpretation label based on percentile
 * @param percentile - Percentile rank (0-100)
 * @returns Human-readable label
 */
export function getPercentileLabel(percentile: number): string {
  if (percentile >= 95) return 'Extremely high (top 5%)';
  if (percentile >= 85) return 'Very high (top 15%)';
  if (percentile >= 70) return 'Above average (top 30%)';
  if (percentile >= 30) return 'Average';
  if (percentile >= 15) return 'Below average (bottom 30%)';
  if (percentile >= 5) return 'Very low (bottom 15%)';
  return 'Extremely low (bottom 5%)';
}
