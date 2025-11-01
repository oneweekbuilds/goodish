import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateToneBreakdown } from './tone';
import * as db from '../db';

vi.mock('../db', () => ({
  getAllSamples: vi.fn(),
}));

describe('calculateToneBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return zeros for empty data', async () => {
    vi.mocked(db.getAllSamples).mockResolvedValue([]);

    const result = await calculateToneBreakdown();

    expect(result.analytical).toBe(0);
    expect(result.empathetic).toBe(0);
    expect(result.calm).toBe(0);
    expect(result.emotional).toBe(0);
    expect(result.outrage).toBe(0);
    expect(result.totalTagged).toBe(0);
  });

  it('should calculate balanced tone distribution', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'post' as const, timestamp: 1, tone: 'analytical' as const },
      { id: '2', platform: 'x' as const, type: 'post' as const, timestamp: 2, tone: 'empathetic' as const },
      { id: '3', platform: 'x' as const, type: 'post' as const, timestamp: 3, tone: 'calm' as const },
      { id: '4', platform: 'x' as const, type: 'post' as const, timestamp: 4, tone: 'emotional' as const },
      { id: '5', platform: 'x' as const, type: 'post' as const, timestamp: 5, tone: 'outrage' as const },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculateToneBreakdown();

    expect(result.analytical).toBe(20);
    expect(result.empathetic).toBe(20);
    expect(result.calm).toBe(20);
    expect(result.emotional).toBe(20);
    expect(result.outrage).toBe(20);
    expect(result.totalTagged).toBe(5);
  });

  it('should handle high outrage content', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'post' as const, timestamp: 1, tone: 'outrage' as const },
      { id: '2', platform: 'x' as const, type: 'post' as const, timestamp: 2, tone: 'outrage' as const },
      { id: '3', platform: 'x' as const, type: 'post' as const, timestamp: 3, tone: 'analytical' as const },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculateToneBreakdown();

    expect(result.outrage).toBe(67); // 2/3
    expect(result.analytical).toBe(33); // 1/3
    expect(result.totalTagged).toBe(3);
  });

  it('should ignore items without tone tag', async () => {
    const mockData = [
      { id: '1', platform: 'x' as const, type: 'post' as const, timestamp: 1, tone: 'analytical' as const },
      { id: '2', platform: 'x' as const, type: 'post' as const, timestamp: 2 }, // no tone
      { id: '3', platform: 'x' as const, type: 'post' as const, timestamp: 3, tone: 'calm' as const },
    ];

    vi.mocked(db.getAllSamples).mockResolvedValue(mockData);

    const result = await calculateToneBreakdown();

    expect(result.analytical).toBe(50);
    expect(result.calm).toBe(50);
    expect(result.totalTagged).toBe(2);
  });
});
