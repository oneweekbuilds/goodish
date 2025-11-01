// Statistical utilities

/**
 * Calculate mean of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculate z-score for a value
 * @param value - Value to score
 * @param values - Reference distribution
 * @returns Z-score (number of std devs from mean)
 */
export function zScore(value: number, values: number[]): number {
  const avg = mean(values);
  const sd = stdDev(values);
  if (sd === 0) return 0;
  return (value - avg) / sd;
}

/**
 * Min-max normalization to [0, 1]
 * @param value - Value to normalize
 * @param min - Minimum value in range
 * @param max - Maximum value in range
 * @returns Normalized value [0, 1]
 */
export function minMaxScale(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Clamp value to range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Softmax function
 * Converts scores to probabilities that sum to 1
 * @param scores - Array of scores
 * @param temperature - Temperature parameter (default 1.0, higher = more uniform)
 * @returns Probability distribution
 */
export function softmax(scores: number[], temperature: number = 1.0): number[] {
  if (scores.length === 0) return [];

  // Subtract max for numerical stability
  const maxScore = Math.max(...scores);
  const expScores = scores.map(s => Math.exp((s - maxScore) / temperature));
  const sumExp = expScores.reduce((sum, e) => sum + e, 0);

  if (sumExp === 0) {
    // Return uniform distribution
    return scores.map(() => 1 / scores.length);
  }

  return expScores.map(e => e / sumExp);
}

/**
 * Sigmoid function (logistic)
 * Maps (-∞, +∞) to (0, 1)
 * @param x - Input value
 * @returns Sigmoid output [0, 1]
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Calculate percentile
 * @param values - Sorted or unsorted array
 * @param p - Percentile [0, 100]
 * @returns Value at percentile
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate moving average
 * @param values - Time series data
 * @param windowSize - Size of moving window
 * @returns Smoothed values (shorter array)
 */
export function movingAverage(values: number[], windowSize: number): number[] {
  if (windowSize <= 0 || values.length < windowSize) return values;

  const result: number[] = [];
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize);
    result.push(mean(window));
  }
  return result;
}

/**
 * Calculate weighted average
 * @param values - Values to average
 * @param weights - Weights (same length as values)
 * @returns Weighted average
 */
export function weightedMean(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0;

  const weightedSum = values.reduce((sum, v, i) => sum + v * weights[i], 0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight === 0) return 0;
  return weightedSum / totalWeight;
}

/**
 * Calculate Pearson correlation coefficient
 * @param x - First variable
 * @param y - Second variable
 * @returns Correlation [-1, 1]
 */
export function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;

  return numerator / denom;
}
