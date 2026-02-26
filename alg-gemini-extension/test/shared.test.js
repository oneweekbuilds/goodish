/**
 * Tests for shared utilities: generate-scan-id and constants.
 */
import { jest } from '@jest/globals';

const { generateScanId } = await import('../src/shared/generate-scan-id.js');
const { SUPPORTED_SCAN_PLATFORMS, PLATFORM_DISPLAY_NAMES, STORAGE_KEYS, TIMING } = await import('../src/shared/constants.js');

describe('generateScanId', () => {
  test('returns a string starting with "scan_"', () => {
    const id = generateScanId();
    expect(typeof id).toBe('string');
    expect(id.startsWith('scan_')).toBe(true);
  });

  test('generates unique IDs on successive calls', () => {
    const id1 = generateScanId();
    const id2 = generateScanId();
    expect(id1).not.toBe(id2);
  });

  test('includes timestamp and random component', () => {
    const id = generateScanId();
    const parts = id.split('_');
    expect(parts.length).toBe(3); // 'scan', timestamp, random
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBeGreaterThan(0);
  });
});

describe('SUPPORTED_SCAN_PLATFORMS', () => {
  test('includes all 7 supported platforms', () => {
    expect(SUPPORTED_SCAN_PLATFORMS).toContain('instagram');
    expect(SUPPORTED_SCAN_PLATFORMS).toContain('twitter');
    expect(SUPPORTED_SCAN_PLATFORMS).toContain('youtube');
    expect(SUPPORTED_SCAN_PLATFORMS).toContain('tiktok');
    expect(SUPPORTED_SCAN_PLATFORMS).toContain('facebook');
    expect(SUPPORTED_SCAN_PLATFORMS).toContain('reddit');
    expect(SUPPORTED_SCAN_PLATFORMS).toContain('linkedin');
    expect(SUPPORTED_SCAN_PLATFORMS).toHaveLength(7);
  });
});

describe('PLATFORM_DISPLAY_NAMES', () => {
  test('has display name for every supported platform', () => {
    for (const platform of SUPPORTED_SCAN_PLATFORMS) {
      expect(PLATFORM_DISPLAY_NAMES[platform]).toBeDefined();
      expect(typeof PLATFORM_DISPLAY_NAMES[platform]).toBe('string');
    }
  });
});

describe('STORAGE_KEYS', () => {
  test('has required keys', () => {
    expect(STORAGE_KEYS.AUTH_TOKEN).toBe('authToken');
    expect(STORAGE_KEYS.ONBOARDING_COMPLETE).toBe('onboarding_complete');
    expect(STORAGE_KEYS.SCAN_HISTORY).toBe('scanHistory');
  });
});

describe('TIMING', () => {
  test('rate limits are positive numbers', () => {
    expect(TIMING.MAX_POSTS_PER_SECOND).toBeGreaterThan(0);
    expect(TIMING.BURST_POSTS_PER_SECOND).toBeGreaterThan(0);
    expect(TIMING.RATE_DELAY_MS).toBeGreaterThan(0);
  });

  test('burst limit is higher than normal limit', () => {
    expect(TIMING.BURST_POSTS_PER_SECOND).toBeGreaterThan(TIMING.MAX_POSTS_PER_SECOND);
  });

  test('retry count is reasonable', () => {
    expect(TIMING.MAX_BACKEND_RETRIES).toBeGreaterThanOrEqual(1);
    expect(TIMING.MAX_BACKEND_RETRIES).toBeLessThanOrEqual(10);
  });
});
