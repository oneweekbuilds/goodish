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
 * Rules:
 * - High: 5+ scans across 2+ platforms OR 10+ scans on single platform
 * - Medium: 2-4 scans OR single platform with 3-9 scans
 * - Low: single scan or very sparse data
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

  if (scanCount === 1) {
    return CONFIDENCE_LEVELS.LOW;
  }

  // High confidence: many scans + multiple platforms + consistent signal
  if ((scanCount >= 5 && platformCount >= 2) || (scanCount >= 10 && hasConsistentSignal)) {
    return CONFIDENCE_LEVELS.HIGH;
  }

  // Medium confidence: some scans or mixed signal
  if (scanCount >= 2) {
    return CONFIDENCE_LEVELS.MEDIUM;
  }

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
 *
 * @param {string} level - One of CONFIDENCE_LEVELS (high, medium, low)
 * @param {boolean} showLabel - Whether to show text label (default: true)
 * @param {string} size - Size variant: 'sm' | 'md' (default: 'sm')
 */
const ConfidenceBadge = ({ level, showLabel = true, size = 'sm' }) => {
  const config = {
    [CONFIDENCE_LEVELS.HIGH]: {
      label: 'High confidence',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-700',
      dotColor: 'bg-emerald-500',
    },
    [CONFIDENCE_LEVELS.MEDIUM]: {
      label: 'Medium confidence',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      dotColor: 'bg-amber-500',
    },
    [CONFIDENCE_LEVELS.LOW]: {
      label: 'Low confidence',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      dotColor: 'bg-slate-400',
    },
  };

  const { label, bgColor, textColor, dotColor } = config[level] || config[CONFIDENCE_LEVELS.LOW];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${bgColor} ${textColor} ${sizeClasses[size]} font-medium`}>
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
