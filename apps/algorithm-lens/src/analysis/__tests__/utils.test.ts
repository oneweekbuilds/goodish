// Utility functions tests
import { describe, it, expect } from 'vitest';

// Hash & Seed
import { generateItemId, seededRandom, anonymizePII } from '../utils/hashSeed';

// Entropy
import { calculateEntropy, calculateHHI, calculateGini } from '../utils/entropy';

// Stats
import { mean, stdDev, zScore, softmax, sigmoid } from '../utils/stats';

// Weightings
import { calculateEngagementWeight, calculateRecencyWeight, calculateAuthorityWeight, calculateCombinedWeight } from '../utils/weightings';

// Validators
import { validateInput, checkMinimumItems, checkSignalStrength } from '../utils/validators';

describe('Hash & Seed Utils', () => {
  it('should generate consistent IDs with same input', () => {
    const id1 = generateItemId('test content', 1234567890);
    const id2 = generateItemId('test content', 1234567890);
    expect(id1).toBe(id2);
  });

  it('should generate different IDs with different input', () => {
    const id1 = generateItemId('test content 1', 1234567890);
    const id2 = generateItemId('test content 2', 1234567890);
    expect(id1).not.toBe(id2);
  });

  it('should generate seeded random numbers consistently', () => {
    const rand1 = seededRandom(42);
    const rand2 = seededRandom(42);
    expect(rand1).toBe(rand2);
    expect(rand1).toBeGreaterThanOrEqual(0);
    expect(rand1).toBeLessThan(1);
  });

  it('should anonymize email addresses', () => {
    const text = 'Contact me at user@example.com for details';
    const anonymized = anonymizePII(text);
    expect(anonymized).not.toContain('user@example.com');
    expect(anonymized).toContain('[EMAIL]');
  });

  it('should anonymize phone numbers', () => {
    const text = 'Call me at 555-123-4567';
    const anonymized = anonymizePII(text);
    expect(anonymized).not.toContain('555-123-4567');
    expect(anonymized).toContain('[PHONE]');
  });
});

describe('Entropy Utils', () => {
  it('should calculate entropy correctly', () => {
    const probs = [0.5, 0.5];
    const entropy = calculateEntropy(probs);
    expect(entropy).toBeCloseTo(1.0, 1); // Maximum entropy for 2 equal probabilities
  });

  it('should return 0 entropy for single probability', () => {
    const probs = [1.0];
    const entropy = calculateEntropy(probs);
    expect(entropy).toBe(0);
  });

  it('should calculate HHI correctly', () => {
    const probs = [0.5, 0.3, 0.2];
    const hhi = calculateHHI(probs);
    expect(hhi).toBeCloseTo(0.38, 2);
  });

  it('should return 1.0 HHI for monopoly', () => {
    const probs = [1.0];
    const hhi = calculateHHI(probs);
    expect(hhi).toBe(1.0);
  });

  it('should calculate Gini coefficient', () => {
    const values = [10, 20, 30, 40, 50];
    const gini = calculateGini(values);
    expect(gini).toBeGreaterThan(0);
    expect(gini).toBeLessThan(1);
  });

  it('should return 0 Gini for perfect equality', () => {
    const values = [10, 10, 10, 10];
    const gini = calculateGini(values);
    expect(gini).toBeCloseTo(0, 5);
  });
});

describe('Stats Utils', () => {
  it('should calculate mean correctly', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([10, 20, 30])).toBe(20);
  });

  it('should return 0 for empty array', () => {
    expect(mean([])).toBe(0);
  });

  it('should calculate standard deviation', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const sd = stdDev(values);
    expect(sd).toBeGreaterThan(0);
    expect(sd).toBeCloseTo(2, 0);
  });

  it('should calculate z-score', () => {
    const z = zScore(75, 50, 10);
    expect(z).toBe(2.5);
  });

  it('should calculate softmax', () => {
    const result = softmax([1, 2, 3]);
    expect(result.length).toBe(3);
    expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 5);
    expect(result[2]).toBeGreaterThan(result[1]);
    expect(result[1]).toBeGreaterThan(result[0]);
  });

  it('should calculate sigmoid', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 5);
    expect(sigmoid(10)).toBeCloseTo(1.0, 2);
    expect(sigmoid(-10)).toBeCloseTo(0.0, 2);
  });
});

describe('Weightings Utils', () => {
  it('should calculate engagement weight', () => {
    const weight = calculateEngagementWeight({
      likes: 100,
      comments: 20,
      shares: 10,
      views: 1000
    });
    expect(weight).toBeGreaterThan(1);
  });

  it('should return 1 for zero engagement', () => {
    const weight = calculateEngagementWeight({
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0
    });
    expect(weight).toBe(1);
  });

  it('should calculate recency weight', () => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const weight = calculateRecencyWeight(oneDayAgo);
    expect(weight).toBeGreaterThan(0);
    expect(weight).toBeLessThanOrEqual(1);
  });

  it('should give higher weight to recent items', () => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recentWeight = calculateRecencyWeight(oneDayAgo);
    const oldWeight = calculateRecencyWeight(oneWeekAgo);

    expect(recentWeight).toBeGreaterThan(oldWeight);
  });

  it('should calculate authority weight', () => {
    const weight = calculateAuthorityWeight(10000, true);
    expect(weight).toBeGreaterThan(0);
    expect(weight).toBeLessThanOrEqual(1.2); // Max is 1.0 + 0.2 bonus
  });

  it('should give bonus for verified accounts', () => {
    const verified = calculateAuthorityWeight(10000, true);
    const unverified = calculateAuthorityWeight(10000, false);
    expect(verified).toBeGreaterThan(unverified);
  });

  it('should calculate combined weight', () => {
    const engagement = { likes: 100, comments: 10, shares: 5, views: 1000 };
    const timestamp = Date.now() - 24 * 60 * 60 * 1000;
    const followers = 10000;

    const weight = calculateCombinedWeight(engagement, timestamp, followers, true);
    expect(weight).toBeGreaterThan(1);
  });
});

describe('Validators', () => {
  it('should validate input', () => {
    const items = [{ id: '1', text: 'test' }];
    const result = validateInput(items, 'twitter');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty items', () => {
    const result = validateInput([], 'twitter');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject invalid platform', () => {
    const items = [{ id: '1', text: 'test' }];
    const result = validateInput(items, 'invalid' as any);
    expect(result.isValid).toBe(false);
  });

  it('should check minimum items', () => {
    const result = checkMinimumItems(15, 10);
    expect(result.isValid).toBe(true);
  });

  it('should fail if below minimum', () => {
    const result = checkMinimumItems(5, 10);
    expect(result.isValid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('should check signal strength', () => {
    const result = checkSignalStrength(100, 10);
    expect(result.hasSignal).toBe(true);
  });

  it('should detect weak signal', () => {
    const result = checkSignalStrength(100, 2);
    expect(result.hasSignal).toBe(false);
  });
});
