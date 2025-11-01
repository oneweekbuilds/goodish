// Deterministic hashing utilities

import crypto from 'crypto';

/**
 * Generate a deterministic hash from input string
 * @param input - String to hash
 * @returns SHA-256 hash as hex string
 */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate deterministic ID for a normalized item
 * @param platform - Platform name
 * @param sourceId - Original ID from platform
 * @param timestamp - Timestamp in ms
 * @returns Deterministic hash ID
 */
export function generateItemId(platform: string, sourceId: string, timestamp: number): string {
  const combined = `${platform}:${sourceId}:${timestamp}`;
  return hashString(combined);
}

/**
 * Hash author identifier to remove PII
 * @param authorId - Original author ID or username
 * @returns Anonymized hash
 */
export function hashAuthorId(authorId: string): string {
  return hashString(authorId).substring(0, 16);
}

/**
 * Seeded random number generator (LCG)
 * @param seed - Seed value
 * @returns Function that returns deterministic random numbers [0, 1)
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  return () => {
    state = (a * state + c) % m;
    return state / m;
  };
}

/**
 * Seeded shuffle using Fisher-Yates
 * @param array - Array to shuffle
 * @param seed - Seed value
 * @returns Shuffled array (mutates original)
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const rng = seededRandom(seed);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
