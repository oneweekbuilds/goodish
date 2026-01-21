import React from 'react';

/**
 * Confidence levels for data quality assessment
 *
 * PHASE 5 DATA TRUTH RULES:
 * - LOW: Data exists but is sparse or narrow (1-3 scans, single platform)
 * - MEDIUM: Moderate data (4-6 scans OR 2+ platforms)
 * - HIGH: Strong data (7+ scans across 2+ platforms with consistency)
 *
 * IMPORTANT: We NEVER claim "high confidence" or "stable" unless:
 * - Data is supported across MULTIPLE scans
 * - Data is supported across MULTIPLE platforms (when applicable)
 */
export const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Calculate confidence level based on ACTUAL scan data used for a metric.
 *
 * Phase 5 Strict Rules:
 * - HIGH: VERY strict - 7+ scans + 2+ platforms + consistent signal
 * - MEDIUM: 4-6 scans OR (3 scans + 2+ platforms)
 * - LOW: 1-3 scans on single platform (default for sparse data)
 *
 * This function takes the ACTUAL scans used for the metric (from dataResult.scansUsed),
 * not the total scan count in the database.
 *
 * @param {number} scanCount - ACTUAL number of scans used for this metric
 * @param {number} platformCount - Number of platforms in the data
 * @param {boolean} hasConsistentSignal - Whether data shows consistent patterns
 * @returns {string} One of CONFIDENCE_LEVELS
 */
export function calculateConfidence(scanCount, platformCount, hasConsistentSignal = true) {
  // No data = low confidence
  if (scanCount === 0) {
    return CONFIDENCE_LEVELS.LOW;
  }

  // Low confidence: sparse data (1-3 scans, single platform)
  // PHASE 5: Be more conservative - don't claim medium until we have more data
  if (scanCount <= 3 && platformCount <= 1) {
    return CONFIDENCE_LEVELS.LOW;
  }

  // High confidence: STRICT requirements
  // PHASE 5: Must have 7+ scans AND 2+ platforms AND consistent signal
  // We never claim high confidence lightly
  if (scanCount >= 7 && platformCount >= 2 && hasConsistentSignal) {
    return CONFIDENCE_LEVELS.HIGH;
  }

  // High confidence alternative: very many scans (10+) with consistency
  // Single platform can reach high if we have lots of data
  if (scanCount >= 10 && hasConsistentSignal) {
    return CONFIDENCE_LEVELS.HIGH;
  }

  // Medium confidence: moderate data
  // PHASE 5: Requires either multiple platforms OR substantial scans
  if (scanCount >= 4 || (scanCount >= 3 && platformCount >= 2)) {
    return CONFIDENCE_LEVELS.MEDIUM;
  }

  // Default to low for everything else
  return CONFIDENCE_LEVELS.LOW;
}

/**
 * Get display text for scan count footer
 *
 * PHASE 5: This text reflects the ACTUAL scans used for this specific metric.
 * Different views may show different scan counts depending on data availability.
 */
export function getScanCountText(scanCount, platformCount) {
  if (scanCount === 0) {
    return 'No scan data for this metric';
  }

  if (scanCount === 1) {
    return 'Based on 1 scan (limited data)';
  }

  if (scanCount <= 3) {
    return `Based on ${scanCount} scans (limited data)`;
  }

  const platformText = platformCount > 1 ? ` across ${platformCount} platforms` : '';
  return `Based on ${scanCount} scans${platformText}`;
}

/**
 * ConfidenceBadge component - displays confidence level for data quality
 * Phase 4: Visually softened to feel like metadata, not the headline
 *
 * @param {string} level - One of CONFIDENCE_LEVELS (high, medium, low)
 * @param {boolean} showLabel - Whether to show text label (default: true)
 * @param {string} size - Size variant: 'sm' | 'md' (default: 'sm')
 */
const ConfidenceBadge = ({ level, showLabel = true, size = 'sm' }) => {
  // FIX X4/P8: Changed labels from "confidence" to "sample size" language
  // Reason: "Higher confidence" badges contradicted "low confidence" banners on Politics tab
  // Using data quantity language avoids this trust-breaking contradiction
  const config = {
    [CONFIDENCE_LEVELS.HIGH]: {
      label: 'Broader sample',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-500',
      dotColor: 'bg-emerald-400',
    },
    [CONFIDENCE_LEVELS.MEDIUM]: {
      label: 'Moderate sample',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-400',
      dotColor: 'bg-slate-300',
    },
    [CONFIDENCE_LEVELS.LOW]: {
      label: 'Limited data',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-400',
      dotColor: 'bg-slate-200',
    },
  };

  const { label, bgColor, textColor, dotColor } = config[level] || config[CONFIDENCE_LEVELS.LOW];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${bgColor} ${textColor} ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {showLabel && label}
    </span>
  );
};

/**
 * DataQualityFooter component - displays scan count and confidence info
 *
 * @param {number} scanCount - Number of scans used for this data
 * @param {number} platformCount - Number of platforms in the data
 * @param {string} confidenceLevel - Optional override for confidence level
 */
export const DataQualityFooter = ({ scanCount, platformCount, confidenceLevel, scopeLabel }) => {
  const level = confidenceLevel || calculateConfidence(scanCount, platformCount);
  const scanText = scopeLabel || getScanCountText(scanCount, platformCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
      <span className="text-xs text-slate-400">
        {scanText}
      </span>
      <ConfidenceBadge level={level} size="sm" />
    </div>
  );
};

export default ConfidenceBadge;
