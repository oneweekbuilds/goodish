// Input validation and data quality checks

import { NormalizedItem } from '../../types/content';

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Validate minimum item count
 * @param items - Array of items
 * @param min - Minimum required items
 * @returns Validation result
 */
export function assertMinItems(items: any[], min: number = 25): ValidationResult {
  const valid = items.length >= min;
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!valid) {
    if (items.length === 0) {
      issues.push('NO_ITEMS');
    } else {
      warnings.push(`LOW_SAMPLE_SIZE: Only ${items.length} items (recommended minimum: ${min})`);
    }
  }

  return { valid: items.length > 0, issues, warnings };
}

/**
 * Check platform distribution balance
 * @param items - Normalized items
 * @returns Validation result
 */
export function checkPlatformBalance(items: NormalizedItem[]): ValidationResult {
  const platformCounts: Record<string, number> = {};
  items.forEach(item => {
    platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
  });

  const platforms = Object.keys(platformCounts);
  const counts = Object.values(platformCounts);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);

  const warnings: string[] = [];

  // Check if one platform dominates (>80% of items)
  if (maxCount / items.length > 0.8) {
    const dominantPlatform = platforms[counts.indexOf(maxCount)];
    warnings.push(`SKEWED_PLATFORM_DISTRIBUTION: ${dominantPlatform} accounts for ${Math.round(maxCount / items.length * 100)}% of items`);
  }

  // Check if any platform has very few items
  platforms.forEach(platform => {
    const count = platformCounts[platform];
    if (count < 10) {
      warnings.push(`LOW_PLATFORM_SAMPLE: ${platform} has only ${count} items`);
    }
  });

  return {
    valid: true,
    issues: [],
    warnings
  };
}

/**
 * Prune outliers by views (optional quality filter)
 * @param items - Normalized items
 * @param zThreshold - Z-score threshold for outlier removal
 * @returns Filtered items
 */
export function pruneOutliersByViews(items: NormalizedItem[], zThreshold: number = 6): NormalizedItem[] {
  if (items.length < 10) return items;

  const views = items.map(item => item.engagement.views);
  const mean = views.reduce((sum, v) => sum + v, 0) / views.length;
  const stdDev = Math.sqrt(
    views.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / views.length
  );

  if (stdDev === 0) return items;

  return items.filter(item => {
    const z = Math.abs((item.engagement.views - mean) / stdDev);
    return z <= zThreshold;
  });
}

/**
 * Guard language filter (currently no-op, scaffolded for future)
 * @param items - Normalized items
 * @param allowedLanguage - Allowed language code
 * @returns Filtered items
 */
export function guardLanguage(items: NormalizedItem[], allowedLanguage: string = "en"): NormalizedItem[] {
  // Currently returns all items since we only support "en"
  // Future: implement language detection and filtering
  return items.filter(item => item.language === allowedLanguage);
}

/**
 * Validate essential fields in raw items
 * @param rawItem - Raw item to validate
 * @returns True if item has minimum required fields
 */
export function hasEssentialFields(rawItem: any): boolean {
  // Must have some text content
  const hasText = !!(rawItem.text || rawItem.content || rawItem.caption || rawItem.body || rawItem.title);

  // Must have timestamp
  const hasTimestamp = !!(rawItem.timestamp || rawItem.created_at || rawItem.posted_at);

  return hasText && hasTimestamp;
}

/**
 * Check for sufficient signal strength in a metric
 * @param hitCount - Number of signal hits (e.g., political terms found)
 * @param totalItems - Total number of items analyzed
 * @param minHits - Minimum hits for adequate signal
 * @returns Validation result
 */
export function checkSignalStrength(
  metricKey: string,
  hitCount: number,
  totalItems: number,
  minHits: number = 10
): ValidationResult {
  const warnings: string[] = [];

  if (hitCount < minHits) {
    warnings.push(`LOW_SIGNAL_STRENGTH:${metricKey}: Only ${hitCount} relevant signals found in ${totalItems} items`);
  }

  return {
    valid: hitCount > 0,
    issues: hitCount === 0 ? [`NO_SIGNAL:${metricKey}`] : [],
    warnings
  };
}

/**
 * Validate time range coverage
 * @param items - Normalized items
 * @param minDays - Minimum days of coverage expected
 * @returns Validation result
 */
export function validateTimeRange(items: NormalizedItem[], minDays: number = 7): ValidationResult {
  if (items.length === 0) {
    return { valid: false, issues: ['NO_ITEMS'], warnings: [] };
  }

  const timestamps = items.map(item => item.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const rangeMs = maxTime - minTime;
  const rangeDays = rangeMs / (24 * 60 * 60 * 1000);

  const warnings: string[] = [];
  if (rangeDays < minDays) {
    warnings.push(`SHORT_TIME_RANGE: Only ${Math.round(rangeDays)} days of coverage (recommended: ${minDays}+ days)`);
  }

  return {
    valid: true,
    issues: [],
    warnings
  };
}

/**
 * Comprehensive validation of normalized items
 * @param items - Normalized items to validate
 * @param minItems - Minimum item count
 * @returns Combined validation result
 */
export function validateItems(items: NormalizedItem[], minItems: number = 25): ValidationResult {
  const results: ValidationResult[] = [
    assertMinItems(items, minItems),
    checkPlatformBalance(items),
    validateTimeRange(items)
  ];

  const allIssues = results.flatMap(r => r.issues);
  const allWarnings = results.flatMap(r => r.warnings);

  return {
    valid: allIssues.length === 0,
    issues: allIssues,
    warnings: allWarnings
  };
}
