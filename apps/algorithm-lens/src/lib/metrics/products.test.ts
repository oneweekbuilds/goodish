import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateProductCategories } from './products';
import * as db from '../db';

vi.mock('../db', () => ({
  getAllSamples: vi.fn(),
}));

describe('calculateProductCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty categories for no ads', async () => {
    vi.mocked(db.getAllSamples).mockResolvedValue([
      { id: '1', platform: 'x' as const, type: 'post' as const, timestamp: 1 },
    ]);

    const result = await calculateProductCategories();

    expect(result.categories).toEqual([]);
    expect(result.totalAds).toBe(0);
  });

  it('should categorize technology products', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'ad' as const, timestamp: 1, productTags: ['iphone', 'macbook'] },
      { id: '2', platform: 'x' as const, type: 'ad' as const, timestamp: 2, productTags: ['laptop'] },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculateProductCategories();

    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories[0].category).toBe('Technology');
    expect(result.totalAds).toBe(2);
  });

  it('should calculate percentages correctly', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'ad' as const, timestamp: 1, productTags: ['tech'] },
      { id: '2', platform: 'x' as const, type: 'ad' as const, timestamp: 2, productTags: ['tech'] },
      { id: '3', platform: 'x' as const, type: 'ad' as const, timestamp: 3, productTags: ['wellness'] },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculateProductCategories();

    // 2 tech out of 3 total = 67%
    const techCategory = result.categories.find(c => c.category === 'Technology');
    expect(techCategory?.percentage).toBe(67);
  });

  it('should respect the limit parameter', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'ad' as const, timestamp: 1, productTags: ['tech'] },
      { id: '2', platform: 'x' as const, type: 'ad' as const, timestamp: 2, productTags: ['wellness'] },
      { id: '3', platform: 'x' as const, type: 'ad' as const, timestamp: 3, productTags: ['finance'] },
      { id: '4', platform: 'x' as const, type: 'ad' as const, timestamp: 4, productTags: ['fashion'] },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculateProductCategories(2);

    expect(result.categories.length).toBeLessThanOrEqual(2);
  });

  it('should ignore ads without product tags', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'ad' as const, timestamp: 1, productTags: ['tech'] },
      { id: '2', platform: 'x' as const, type: 'ad' as const, timestamp: 2 }, // no tags
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculateProductCategories();

    expect(result.categories[0].percentage).toBe(100); // Only 1 counted
    expect(result.totalAds).toBe(2); // But 2 total ads
  });
});
