import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculatePoliticalDistribution } from './politics';
import * as db from '../db';

vi.mock('../db', () => ({
  getAllSamples: vi.fn(),
  getSamplesByPlatform: vi.fn(),
}));

describe('calculatePoliticalDistribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return zeros for empty data', async () => {
    vi.mocked(db.getAllSamples).mockResolvedValue([]);

    const result = await calculatePoliticalDistribution();

    expect(result.left).toBe(0);
    expect(result.neutral).toBe(0);
    expect(result.right).toBe(0);
    expect(result.totalPolitical).toBe(0);
  });

  it('should calculate balanced distribution', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'post' as const, timestamp: 1, political: 'left' as const },
      { id: '2', platform: 'x' as const, type: 'post' as const, timestamp: 2, political: 'neutral' as const },
      { id: '3', platform: 'x' as const, type: 'post' as const, timestamp: 3, political: 'right' as const },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculatePoliticalDistribution();

    expect(result.left).toBe(33); // rounded from 33.33
    expect(result.neutral).toBe(33);
    expect(result.right).toBe(33);
    expect(result.totalPolitical).toBe(3);
  });

  it('should calculate left-leaning distribution', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'post' as const, timestamp: 1, political: 'left' as const },
      { id: '2', platform: 'x' as const, type: 'post' as const, timestamp: 2, political: 'left' as const },
      { id: '3', platform: 'x' as const, type: 'post' as const, timestamp: 3, political: 'left' as const },
      { id: '4', platform: 'x' as const, type: 'post' as const, timestamp: 4, political: 'neutral' as const },
      { id: '5', platform: 'x' as const, type: 'post' as const, timestamp: 5, political: 'right' as const },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculatePoliticalDistribution();

    expect(result.left).toBe(60); // 3/5
    expect(result.neutral).toBe(20); // 1/5
    expect(result.right).toBe(20); // 1/5
    expect(result.totalPolitical).toBe(5);
  });

  it('should ignore items without political tag', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'post' as const, timestamp: 1, political: 'left' as const },
      { id: '2', platform: 'x' as const, type: 'post' as const, timestamp: 2 }, // no political tag
      { id: '3', platform: 'x' as const, type: 'post' as const, timestamp: 3, political: 'right' as const },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculatePoliticalDistribution();

    expect(result.left).toBe(50);
    expect(result.neutral).toBe(0);
    expect(result.right).toBe(50);
    expect(result.totalPolitical).toBe(2); // Only 2 items have political tags
  });

  it('should handle 100% one direction', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'post' as const, timestamp: 1, political: 'left' as const },
      { id: '2', platform: 'x' as const, type: 'post' as const, timestamp: 2, political: 'left' as const },
      { id: '3', platform: 'x' as const, type: 'post' as const, timestamp: 3, political: 'left' as const },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculatePoliticalDistribution();

    expect(result.left).toBe(100);
    expect(result.neutral).toBe(0);
    expect(result.right).toBe(0);
    expect(result.totalPolitical).toBe(3);
  });

  it('should filter by platform when specified', async () => {
    const mockData = [
      { id: '1', platform: 'instagram' as const, type: 'post' as const, timestamp: 1, political: 'left' as const },
    ];

    vi.mocked(db.getSamplesByPlatform).mockResolvedValue(mockData);

    const result = await calculatePoliticalDistribution('instagram');

    expect(db.getSamplesByPlatform).toHaveBeenCalledWith('instagram');
    expect(result).toBeDefined();
  });

  it('should round percentages correctly', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'post' as const, timestamp: 1, political: 'left' as const },
      { id: '2', platform: 'x' as const, type: 'post' as const, timestamp: 2, political: 'left' as const },
      { id: '3', platform: 'x' as const, type: 'post' as const, timestamp: 3, political: 'right' as const },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculatePoliticalDistribution();

    // 2/3 = 66.66... should round to 67
    // 1/3 = 33.33... should round to 33
    expect(result.left).toBe(67);
    expect(result.neutral).toBe(0);
    expect(result.right).toBe(33);
  });
});
