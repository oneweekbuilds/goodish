/**
 * Tests for analysisDataStore — the in-memory transient store
 * that passes large data between the broadcast and analysis screens.
 */

import { storeAnalysisData, consumeAnalysisData } from '../lib/analysis/analysisDataStore';

describe('analysisDataStore', () => {
  beforeEach(() => {
    // Consume any leftover data from previous tests
    consumeAnalysisData();
  });

  it('stores and consumes data correctly', () => {
    const data = {
      sessionId: 'test-123',
      platform: 'instagram' as const,
      frames: [],
      captureInfo: {} as any,
      frameBase64Map: { 'frame_0.jpg': 'base64data' },
      storedAt: Date.now(),
    };

    storeAnalysisData(data);
    const result = consumeAnalysisData();

    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe('test-123');
    expect(result!.platform).toBe('instagram');
    expect(result!.frameBase64Map['frame_0.jpg']).toBe('base64data');
  });

  it('returns null after data is consumed (single-use)', () => {
    storeAnalysisData({
      sessionId: 'test-456',
      platform: 'twitter' as const,
      frames: [],
      captureInfo: {} as any,
      frameBase64Map: {},
      storedAt: Date.now(),
    });

    // First consume succeeds
    const first = consumeAnalysisData();
    expect(first).not.toBeNull();

    // Second consume returns null (already consumed)
    const second = consumeAnalysisData();
    expect(second).toBeNull();
  });

  it('returns null when no data has been stored', () => {
    const result = consumeAnalysisData();
    expect(result).toBeNull();
  });

  it('expires data after 5 minutes', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000 - 1; // 5 minutes + 1ms ago

    storeAnalysisData({
      sessionId: 'old-session',
      platform: 'youtube' as const,
      frames: [],
      captureInfo: {} as any,
      frameBase64Map: {},
      storedAt: fiveMinutesAgo,
    });

    const result = consumeAnalysisData();
    expect(result).toBeNull();
  });

  it('does not expire data before 5 minutes', () => {
    const fourMinutesAgo = Date.now() - 4 * 60 * 1000;

    storeAnalysisData({
      sessionId: 'recent-session',
      platform: 'tiktok' as const,
      frames: [],
      captureInfo: {} as any,
      frameBase64Map: {},
      storedAt: fourMinutesAgo,
    });

    const result = consumeAnalysisData();
    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe('recent-session');
  });

  it('overwrites previous data when storing again', () => {
    storeAnalysisData({
      sessionId: 'first',
      platform: 'instagram' as const,
      frames: [],
      captureInfo: {} as any,
      frameBase64Map: {},
      storedAt: Date.now(),
    });

    storeAnalysisData({
      sessionId: 'second',
      platform: 'reddit' as const,
      frames: [],
      captureInfo: {} as any,
      frameBase64Map: {},
      storedAt: Date.now(),
    });

    const result = consumeAnalysisData();
    expect(result!.sessionId).toBe('second');
    expect(result!.platform).toBe('reddit');
  });
});
