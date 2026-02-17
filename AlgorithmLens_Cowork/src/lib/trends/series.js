/**
 * Metric Series Utilities
 *
 * Standardized helpers for working with time-series metric data across scans.
 * Provides delta computation, formatting, and distribution helpers.
 */

/**
 * @typedef {Object} SeriesPoint
 * @property {string} scanId - Unique scan identifier
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {number|null} value - Metric value (null if unavailable)
 * @property {number|null} [denominator] - Optional denominator for ratio metrics
 * @property {Object} [meta] - Optional metadata (platform, tags, etc.)
 */

/**
 * @typedef {Object} DeltaResult
 * @property {number|null} delta - Numeric change (null if cannot compute)
 * @property {'up'|'down'|'flat'|'na'} direction - Change direction
 */

/**
 * Compute delta and direction between two values
 *
 * @param {number|null} currentValue - Current metric value
 * @param {number|null} previousValue - Previous metric value
 * @returns {DeltaResult} Delta and direction
 *
 * @example
 * computeDelta(15.5, 12.3) // { delta: 3.2, direction: 'up' }
 * computeDelta(10.0, 10.00001) // { delta: 0.00001, direction: 'flat' }
 * computeDelta(null, 5) // { delta: null, direction: 'na' }
 */
export function computeDelta(currentValue, previousValue) {
  // Handle null cases
  if (currentValue == null || previousValue == null) {
    return { delta: null, direction: 'na' };
  }

  const delta = currentValue - previousValue;
  const FLAT_THRESHOLD = 0.00001;

  // Determine direction
  let direction;
  if (Math.abs(delta) < FLAT_THRESHOLD) {
    direction = 'flat';
  } else if (delta > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return { delta, direction };
}

/**
 * Format a number as a percentage with specified decimals
 *
 * @param {number|null} value - Value to format (0-100 scale)
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted percentage or 'N/A'
 *
 * @example
 * formatPercent(12.345, 1) // '12.3%'
 * formatPercent(100, 0) // '100%'
 * formatPercent(null) // 'N/A'
 */
export function formatPercent(value, decimals = 1) {
  if (value == null) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a count with thousands separators
 *
 * @param {number|null} value - Count to format
 * @returns {string} Formatted count or 'N/A'
 *
 * @example
 * formatCount(1234) // '1,234'
 * formatCount(1234567) // '1,234,567'
 * formatCount(null) // 'N/A'
 */
export function formatCount(value) {
  if (value == null) {
    return 'N/A';
  }
  return value.toLocaleString('en-US');
}

/**
 * Clamp a number between min and max bounds
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 *
 * @example
 * clampNumber(15, 0, 10) // 10
 * clampNumber(-5, 0, 10) // 0
 * clampNumber(5, 0, 10) // 5
 */
export function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round a number to specified decimal places
 *
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 *
 * @example
 * roundTo(12.3456, 2) // 12.35
 * roundTo(12.3456, 0) // 12
 */
export function roundTo(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Round percentages to sum exactly to 100 (or 100.0)
 *
 * Ensures distribution percentages sum to exactly 100 after rounding.
 * Uses largest remainder method to distribute rounding errors deterministically.
 * Does NOT reorder categories.
 *
 * @param {number[]} values - Array of percentage values
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {number[]} Rounded values that sum to 100
 *
 * @example
 * roundPercentagesToSum100([33.33, 33.33, 33.34], 0) // [33, 33, 34]
 * roundPercentagesToSum100([25.1, 25.1, 25.1, 24.7], 1) // [25.1, 25.1, 25.1, 24.7]
 */
export function roundPercentagesToSum100(values, decimals = 0) {
  // Handle empty or invalid input
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  // Check if all values are 0 or invalid
  const hasValidValue = values.some(v => typeof v === 'number' && v > 0);
  if (!hasValidValue) {
    return values.map(() => 0);
  }

  const factor = Math.pow(10, decimals);
  const target = 100 * factor;

  // Floor all values and track remainders
  const floored = values.map(v => {
    const scaled = v * factor;
    return {
      value: Math.floor(scaled),
      remainder: scaled - Math.floor(scaled),
      originalIndex: values.indexOf(v)
    };
  });

  // Calculate how many units we need to add back
  const currentSum = floored.reduce((sum, item) => sum + item.value, 0);
  let unitsToAdd = target - currentSum;

  // Sort by remainder (descending) but keep track of original order
  const sortedByRemainder = [...floored].sort((a, b) => b.remainder - a.remainder);

  // Distribute the remaining units to items with largest remainders
  for (let i = 0; i < unitsToAdd && i < sortedByRemainder.length; i++) {
    sortedByRemainder[i].value += 1;
  }

  // Build result array in original order
  const result = new Array(values.length);
  floored.forEach((item, idx) => {
    const updated = sortedByRemainder.find(s => s.originalIndex === item.originalIndex);
    result[idx] = updated.value / factor;
  });

  return result;
}

/**
 * Get the latest two points from a series
 *
 * @param {SeriesPoint[]} series - Array of series points (sorted newest first)
 * @returns {{latest: SeriesPoint|null, previous: SeriesPoint|null}} Latest and previous points
 *
 * @example
 * getLatestTwoPoints([point1, point2, point3]) // { latest: point1, previous: point2 }
 * getLatestTwoPoints([point1]) // { latest: point1, previous: null }
 * getLatestTwoPoints([]) // { latest: null, previous: null }
 */
export function getLatestTwoPoints(series) {
  if (!Array.isArray(series) || series.length === 0) {
    return { latest: null, previous: null };
  }

  return {
    latest: series[0] || null,
    previous: series[1] || null
  };
}

/**
 * Dev-only self-check for trend utilities
 *
 * Run from console to verify helpers work as expected.
 * Does not auto-run on import.
 *
 * @returns {Object} Test results and examples
 */
export function __devTrendSelfCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test computeDelta
  results.tests.push({
    fn: 'computeDelta',
    cases: [
      { input: [15, 10], output: computeDelta(15, 10), expected: { delta: 5, direction: 'up' } },
      { input: [10, 15], output: computeDelta(10, 15), expected: { delta: -5, direction: 'down' } },
      { input: [10, 10.000001], output: computeDelta(10, 10.000001), expected: { direction: 'flat' } },
      { input: [null, 10], output: computeDelta(null, 10), expected: { delta: null, direction: 'na' } }
    ]
  });

  // Test formatPercent
  results.tests.push({
    fn: 'formatPercent',
    cases: [
      { input: [12.345, 1], output: formatPercent(12.345, 1), expected: '12.3%' },
      { input: [100, 0], output: formatPercent(100, 0), expected: '100%' },
      { input: [null], output: formatPercent(null), expected: 'N/A' }
    ]
  });

  // Test formatCount
  results.tests.push({
    fn: 'formatCount',
    cases: [
      { input: [1234], output: formatCount(1234), expected: '1,234' },
      { input: [null], output: formatCount(null), expected: 'N/A' }
    ]
  });

  // Test roundPercentagesToSum100
  const roundTest1 = roundPercentagesToSum100([33.33, 33.33, 33.34], 0);
  const sum1 = roundTest1.reduce((a, b) => a + b, 0);
  results.tests.push({
    fn: 'roundPercentagesToSum100',
    cases: [
      {
        input: [[33.33, 33.33, 33.34], 0],
        output: roundTest1,
        sum: sum1,
        invariant: 'sum === 100',
        pass: sum1 === 100
      }
    ]
  });

  // Test getLatestTwoPoints
  const mockSeries = [
    { scanId: 's1', timestamp: '2026-01-01', value: 10 },
    { scanId: 's2', timestamp: '2026-01-02', value: 15 }
  ];
  results.tests.push({
    fn: 'getLatestTwoPoints',
    cases: [
      { input: [mockSeries], output: getLatestTwoPoints(mockSeries) },
      { input: [[]], output: getLatestTwoPoints([]) }
    ]
  });

  return results;
}
