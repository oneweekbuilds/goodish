// Entropy and information theory utilities

/**
 * Calculate Shannon entropy
 * H = -Σ p_i * log2(p_i)
 * @param distribution - Probability distribution (must sum to 1)
 * @returns Entropy value in bits
 */
export function shannonEntropy(distribution: number[]): number {
  let entropy = 0;
  for (const p of distribution) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/**
 * Calculate normalized Shannon entropy
 * Divides by log2(k) where k is number of categories
 * Returns value in [0, 1] where 1 = maximum diversity
 * @param distribution - Probability distribution
 * @returns Normalized entropy [0, 1]
 */
export function normalizedEntropy(distribution: number[]): number {
  if (distribution.length <= 1) return 0;
  const maxEntropy = Math.log2(distribution.length);
  if (maxEntropy === 0) return 0;
  return shannonEntropy(distribution) / maxEntropy;
}

/**
 * Calculate entropy from frequency counts
 * @param counts - Object mapping categories to counts
 * @returns Normalized entropy
 */
export function entropyFromCounts(counts: Record<string, number>): number {
  const values = Object.values(counts);
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total === 0) return 0;

  const distribution = values.map(v => v / total);
  return normalizedEntropy(distribution);
}

/**
 * Calculate Kullback-Leibler divergence
 * D_KL(P || Q) = Σ P(i) * log(P(i) / Q(i))
 * @param p - First distribution
 * @param q - Second distribution (reference)
 * @returns KL divergence (asymmetric, ≥ 0)
 */
export function klDivergence(p: number[], q: number[]): number {
  if (p.length !== q.length) {
    throw new Error('Distributions must have same length');
  }

  let divergence = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 0) {
      // Add small epsilon to avoid log(0)
      const qVal = Math.max(q[i], 1e-10);
      divergence += p[i] * Math.log2(p[i] / qVal);
    }
  }
  return Math.max(0, divergence);
}

/**
 * Calculate Jensen-Shannon divergence
 * Symmetric version of KL divergence
 * JSD(P, Q) = 0.5 * KL(P || M) + 0.5 * KL(Q || M) where M = 0.5(P + Q)
 * @param p - First distribution
 * @param q - Second distribution
 * @returns JS divergence [0, 1] (0 = identical, 1 = completely different)
 */
export function jsDivergence(p: number[], q: number[]): number {
  if (p.length !== q.length) {
    throw new Error('Distributions must have same length');
  }

  // Calculate midpoint distribution
  const m = p.map((pVal, i) => 0.5 * (pVal + q[i]));

  // Calculate symmetric divergence
  const kl1 = klDivergence(p, m);
  const kl2 = klDivergence(q, m);

  return 0.5 * (kl1 + kl2);
}

/**
 * Calculate Gini coefficient (inequality measure)
 * @param values - Array of values
 * @returns Gini coefficient [0, 1] where 1 = maximum inequality
 */
export function giniCoefficient(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((sum, v) => sum + v, 0);

  if (total === 0) return 0;

  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sorted[i];
  }

  return numerator / (n * total);
}

/**
 * Calculate Herfindahl-Hirschman Index (concentration measure)
 * HHI = Σ (share_i)^2 where shares are in [0, 1]
 * @param shares - Market shares or proportions
 * @returns HHI value [1/n, 1] where 1 = monopoly, 1/n = perfect competition
 */
export function herfindahlIndex(shares: number[]): number {
  return shares.reduce((sum, share) => sum + share * share, 0);
}
