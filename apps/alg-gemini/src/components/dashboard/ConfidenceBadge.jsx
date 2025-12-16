import React from 'react';

/**
 * Confidence levels for data quality assessment
 */
export const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/**
 * Calculate confidence level based on scan data
 *
 * Phase 4 Recalibration:
 * - High: STRICT requirements - many scans + multiple platforms + consistent signal
 * - Medium: Now the default for most cases
 * - Low: Used more often for sparse or narrow data
 *
 * Rules:
 * - High: 7+ scans across 3+ platforms AND consistent signal
 * - Medium: 3-6 scans OR 2 platforms OR inconsistent high-scan data
 * - Low: 1-2 scans OR single narrow signal
 *
 * @param {number} scanCount - Number of scans used
 * @param {number} platformCount - Number of platforms scanned
 * @param {boolean} hasConsistentSignal - Whether data shows consistent patterns
 * @returns {string} One of CONFIDENCE_LEVELS
 */
export function calculateConfidence(scanCount, platformCount, hasConsistentSignal = true) {
  if (scanCount === 0) {
    return CONFIDENCE_LEVELS.LOW;
  }

  // Low confidence: very sparse data
  if (scanCount <= 2) {
    return CONFIDENCE_LEVELS.LOW;
  }

  // High confidence: strict requirements
  // Must have 7+ scans AND 3+ platforms AND consistent signal
  if (scanCount >= 7 && platformCount >= 3 && hasConsistentSignal) {
    return CONFIDENCE_LEVELS.HIGH;
  }

  // High confidence alternative: very many scans with consistency
  if (scanCount >= 15 && hasConsistentSignal) {
    return CONFIDENCE_LEVELS.HIGH;
  }

  // Medium confidence: moderate data (3-6 scans or 2+ platforms)
  // This is now the default for most populated views
  if (scanCount >= 3 || platformCount >= 2) {
    return CONFIDENCE_LEVELS.MEDIUM;
  }

  // Default to low for everything else
  return CONFIDENCE_LEVELS.LOW;
}

/**
 * Get display text for scan count footer
 */
export function getScanCountText(scanCount, platformCount) {
  if (scanCount === 0) {
    return 'No scan data yet';
  }

  if (scanCount === 1) {
    return 'Based on 1 scan (limited data)';
  }

  if (scanCount <= 2) {
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
  // Phase 4: Muted colors so confidence feels like metadata
  const config = {
    [CONFIDENCE_LEVELS.HIGH]: {
      label: 'Higher confidence',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-500',
      dotColor: 'bg-emerald-400',
    },
    [CONFIDENCE_LEVELS.MEDIUM]: {
      label: 'Moderate confidence',
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
export const DataQualityFooter = ({ scanCount, platformCount, confidenceLevel }) => {
  const level = confidenceLevel || calculateConfidence(scanCount, platformCount);
  const scanText = getScanCountText(scanCount, platformCount);

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
