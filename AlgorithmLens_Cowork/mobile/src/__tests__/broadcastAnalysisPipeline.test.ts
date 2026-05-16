/**
 * Tests for BroadcastAnalysisPipeline — full broadcast analysis orchestration.
 *
 * Tests cover: pipeline stages, abort/cancel, frame analysis batching,
 * deduplication, buildUnifiedScanResult shape, persistence, error handling,
 * and the pure helper functions (mapContentType, mapValence,
 * validateSourceOrigin, validateAiDisclosure, correctPercentageRounding).
 */
import {
  BroadcastAnalysisPipeline,
  PipelineError,
  PipelineCallbacks,
  PipelineConfig,
  PipelineProgress,
} from '../lib/analysis/broadcastAnalysisPipeline';
import type { BroadcastFrame, BroadcastCaptureInfo } from '../types/broadcast';
import type { UnifiedScanResult } from '../types';

// ─── Mocks ──────────────────────────────────────

jest.mock('../lib/sentry', () => ({
  captureMessage: jest.fn(),
  captureError: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

jest.mock('../lib/api', () => ({
  api: {
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

jest.mock('../lib/utils', () => ({
  generateUUID: jest.fn(() => 'test-scan-uuid-1234'),
}));

// Mock GeminiFlashService
const mockAnalyzeFrame = jest.fn();
const mockDeduplicateItems = jest.fn();
const mockTestConnection = jest.fn();

jest.mock('../lib/analysis/geminiFlashService', () => ({
  GeminiFlashService: jest.fn().mockImplementation(() => ({
    analyzeFrame: mockAnalyzeFrame,
    deduplicateItems: mockDeduplicateItems,
    testConnection: mockTestConnection,
  })),
  GeminiApiError: class GeminiApiError extends Error {
    status: number;
    retryable: boolean;
    constructor(message: string, status: number, retryable: boolean) {
      super(message);
      this.name = 'GeminiApiError';
      this.status = status;
      this.retryable = retryable;
    }
  },
}));

// ─── Helpers ──────────────────────────────────────

function makeFrame(index: number): BroadcastFrame {
  return {
    frame_id: `frame_${index}`,
    captured_at: `2026-01-01T00:00:0${index}Z`,
    perceptual_hash: `hash_${index}`,
    local_path: `/path/to/frames/frame_${index}.jpg`,
    size_bytes: 50000,
    width: 1170,
    height: 2532,
    ocr_text: `OCR text from frame ${index}`,
    ocr_confidence: 0.95,
    is_unique: true,
  };
}

function makeExtractedItem(overrides: Record<string, any> = {}) {
  return {
    estimated_position: 1,
    content_type: 'photo',
    creator_handle: '@testuser',
    creator_display_name: 'Test User',
    is_ad: false,
    ad_detection_reason: null,
    is_suggested: false,
    suggestion_detection_reason: null,
    post_text: 'Hello world',
    hashtags: ['#test'],
    is_partial: false,
    topics: { primary_category: 'Entertainment', secondary_categories: [], freeform_tags: [] },
    political: { is_political: false, stance_or_alignment_guess: null, policy_area: null },
    wellbeing: { wellbeing_relevance: 'NONE', themes: [], potential_risk_flags: [] },
    emotions: { valence: 'POSITIVE' },
    source_origin: null,
    ai_disclosure: null,
    ...overrides,
  };
}

function makeCaptureInfo(): BroadcastCaptureInfo {
  return {
    is_broadcast_based: true,
    broadcast_method: 'REPLAYKIT',
    frames_captured: 5,
    frames_unique: 5,
    duration_seconds: 60,
    average_frame_interval_seconds: 2.5,
    on_device_ocr_used: true,
  };
}

function makeCallbacks(): PipelineCallbacks & {
  progressHistory: PipelineProgress[];
  completedScanId: string | null;
  completedResult: UnifiedScanResult | null;
  errorCaptured: Error | null;
} {
  const obj = {
    progressHistory: [] as PipelineProgress[],
    completedScanId: null as string | null,
    completedResult: null as UnifiedScanResult | null,
    errorCaptured: null as Error | null,
    onProgress: jest.fn(),
    onComplete: jest.fn(),
    onError: jest.fn(),
  };
  obj.onProgress.mockImplementation((progress: PipelineProgress) => {
    obj.progressHistory.push({ ...progress });
  });
  obj.onComplete.mockImplementation((scanId: string, result: UnifiedScanResult) => {
    obj.completedScanId = scanId;
    obj.completedResult = result;
  });
  obj.onError.mockImplementation((error: Error) => {
    obj.errorCaptured = error;
  });
  return obj;
}

function defaultConfig(): PipelineConfig {
  return {
    apiKey: 'test-api-key',
    enablePersistence: false,
    enableBackendEnrichment: false,
    enableDeduplication: false,
    concurrency: 1,
  };
}

// ─── Tests ──────────────────────────────────────

describe('BroadcastAnalysisPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: analyzeFrame returns one extracted item
    mockAnalyzeFrame.mockResolvedValue({
      items: [makeExtractedItem()],
      extraction_confidence: 0.9,
    });
    mockDeduplicateItems.mockResolvedValue({
      deduplicated_items: [makeExtractedItem()],
      original_count: 1,
      deduplicated_count: 1,
      duplicate_pairs_found: 0,
    });
  });

  describe('PipelineError', () => {
    test('extends Error with stage property', () => {
      const err = new PipelineError('Test error', 'ANALYZING');
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('PipelineError');
      expect(err.message).toBe('Test error');
      expect(err.stage).toBe('ANALYZING');
    });

    test('supports all pipeline stages', () => {
      const stages = ['PREPARING', 'ANALYZING', 'DEDUPLICATING', 'BUILDING', 'SAVING', 'COMPLETE', 'FAILED'] as const;
      for (const stage of stages) {
        const err = new PipelineError(`error at ${stage}`, stage);
        expect(err.stage).toBe(stage);
      }
    });
  });

  describe('constructor', () => {
    test('creates pipeline with valid config', () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);
      expect(pipeline).toBeDefined();
    });
  });

  describe('run — stage transitions', () => {
    test('progresses through PREPARING → ANALYZING → BUILDING → COMPLETE', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      const frames = [makeFrame(0)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      // Check stage progression
      const stages = callbacks.progressHistory.map((p) => p.stage);
      expect(stages).toContain('PREPARING');
      expect(stages).toContain('ANALYZING');
      expect(stages).toContain('BUILDING');
      expect(stages).toContain('COMPLETE');
    });

    test('includes DEDUPLICATING stage when enabled', async () => {
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enableDeduplication: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      const frames = [makeFrame(0)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      const stages = callbacks.progressHistory.map((p) => p.stage);
      expect(stages).toContain('DEDUPLICATING');
    });

    test('includes SAVING stage when persistence enabled', async () => {
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enablePersistence: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      const frames = [makeFrame(0)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      const stages = callbacks.progressHistory.map((p) => p.stage);
      expect(stages).toContain('SAVING');
    });
  });

  describe('run — zero frames', () => {
    test('fails with PipelineError when no frames provided', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      await pipeline.run([], 'instagram', makeCaptureInfo(), jest.fn(), 'user-123');

      expect(callbacks.onError).toHaveBeenCalledTimes(1);
      const error = (callbacks.onError as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('No frames to analyze');
      expect(callbacks.progressHistory.some((p) => p.stage === 'FAILED')).toBe(true);
    });
  });

  describe('run — single frame', () => {
    test('analyzes one frame and produces valid result', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValueOnce({
        items: [makeExtractedItem({ creator_handle: '@alice', post_text: 'Hi there' })],
        extraction_confidence: 0.85,
      });

      const frames = [makeFrame(0)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'twitter', makeCaptureInfo(), getBase64, 'user-123');

      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
      const result = callbacks.completedResult!;
      expect(result.feed_items).toHaveLength(1);
      expect(result.feed_items[0]!.account.account_handle).toBe('@alice');
      expect(result.aggregates.total_feed_items).toBe(1);
    });
  });

  describe('run — multiple frames with concurrency', () => {
    test('processes 6 frames with concurrency=3 in 2 batches', async () => {
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), concurrency: 3 };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      // Each frame returns 1 item
      mockAnalyzeFrame.mockResolvedValue({
        items: [makeExtractedItem()],
        extraction_confidence: 0.9,
      });

      const frames = Array.from({ length: 6 }, (_, i) => makeFrame(i));
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
      expect(mockAnalyzeFrame).toHaveBeenCalledTimes(6);
      expect(callbacks.completedResult!.feed_items).toHaveLength(6);
    });
  });

  describe('run — maxFramesToAnalyze cap', () => {
    test('caps frames to maxFramesToAnalyze setting', async () => {
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), maxFramesToAnalyze: 3 };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      mockAnalyzeFrame.mockResolvedValue({
        items: [makeExtractedItem()],
        extraction_confidence: 0.9,
      });

      const frames = Array.from({ length: 10 }, (_, i) => makeFrame(i));
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      expect(mockAnalyzeFrame).toHaveBeenCalledTimes(3);
      expect(callbacks.completedResult!.feed_items).toHaveLength(3);
    });
  });

  describe('run — frame base64 is null', () => {
    test('skips frames with no base64 data', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValue({
        items: [makeExtractedItem()],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0), makeFrame(1)];
      // First frame has no base64, second does
      const getBase64 = jest.fn((filename: string) =>
        filename.includes('frame_1') ? 'base64data' : null,
      );

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      // Only the second frame should be analyzed
      expect(mockAnalyzeFrame).toHaveBeenCalledTimes(1);
      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    });

    test('fails when all frames have null base64', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      const frames = [makeFrame(0)];
      const getBase64 = jest.fn(() => null);

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      expect(callbacks.onError).toHaveBeenCalledTimes(1);
      const error = (callbacks.onError as jest.Mock).mock.calls[0][0];
      // Build #42 introduced the structured "No items extracted from the captured
      // frames. <summary>" error; this test was never updated to match. The
      // summary mentions "missing frame data" for the null-base64 case, so we
      // assert against the stable prefix that's always present.
      expect(error.message).toContain('No items extracted from the captured frames');
      expect(error.message).toContain('missing frame data');
    });
  });

  describe('run — Gemini API errors', () => {
    test('skips frame on retryable error and continues', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      const { GeminiApiError } = require('../lib/analysis/geminiFlashService');

      // First frame fails (retryable), second succeeds
      mockAnalyzeFrame
        .mockRejectedValueOnce(new GeminiApiError('Server error', 500, true))
        .mockResolvedValueOnce({
          items: [makeExtractedItem()],
          extraction_confidence: 0.9,
        });

      const frames = [makeFrame(0), makeFrame(1)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.completedResult!.feed_items).toHaveLength(1);
    });

    test('propagates non-retryable error (bad API key)', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      const { GeminiApiError } = require('../lib/analysis/geminiFlashService');

      mockAnalyzeFrame.mockRejectedValueOnce(
        new GeminiApiError('Invalid API key', 401, false),
      );

      const frames = [makeFrame(0)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      expect(callbacks.onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('run — abort/cancel', () => {
    test('abort() stops processing of new frames', async () => {
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), concurrency: 1 };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      let callCount = 0;
      mockAnalyzeFrame.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Abort after first frame is analyzed
          pipeline.abort();
        }
        return Promise.resolve({
          items: [makeExtractedItem()],
          extraction_confidence: 0.9,
        });
      });

      const frames = Array.from({ length: 5 }, (_, i) => makeFrame(i));
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      // Should have been called for first batch only (concurrency=1, so frame 0)
      // then abort kicks in before next batch
      expect(callbacks.onError).toHaveBeenCalledTimes(1);
      const error = (callbacks.onError as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('aborted');
    });
  });

  describe('run — deduplication', () => {
    test('deduplicates items when enabled', async () => {
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enableDeduplication: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      // Two frames each return one item
      mockAnalyzeFrame.mockResolvedValue({
        items: [makeExtractedItem()],
        extraction_confidence: 0.9,
      });

      // Dedup removes one
      mockDeduplicateItems.mockResolvedValueOnce({
        deduplicated_items: [makeExtractedItem()],
        original_count: 2,
        deduplicated_count: 1,
        duplicate_pairs_found: 1,
      });

      const frames = [makeFrame(0), makeFrame(1)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      expect(mockDeduplicateItems).toHaveBeenCalledTimes(1);
      expect(callbacks.completedResult!.feed_items).toHaveLength(1);
    });

    test('falls back to locally-deduped items when LLM dedup fails', async () => {
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enableDeduplication: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      // Build #47 (audit #20): the pipeline now does a deterministic local
      // dedup pass BEFORE the LLM dedup. To verify the LLM-failure fallback
      // path preserves data, we feed two genuinely-distinct items (different
      // creator + different text) so the local pass keeps both. Without this
      // distinction, identical items would already have collapsed to 1 in
      // the local pass and the test couldn't tell whether the fallback ran.
      mockAnalyzeFrame
        .mockResolvedValueOnce({
          items: [makeExtractedItem({ creator_handle: 'alpha', post_text: 'first creator first video about cats' })],
          extraction_confidence: 0.9,
        })
        .mockResolvedValueOnce({
          items: [makeExtractedItem({ creator_handle: 'bravo', post_text: 'second creator entirely different video about dogs' })],
          extraction_confidence: 0.9,
        });

      mockDeduplicateItems.mockRejectedValueOnce(new Error('Dedup failed'));

      const frames = [makeFrame(0), makeFrame(1)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      // Should still complete successfully with locally-deduped items.
      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.completedResult!.feed_items).toHaveLength(2);
    });

    test('falls back to locally-deduped items when LLM dedup returns empty array', async () => {
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enableDeduplication: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      // Same as the test above — distinct items so the local pass preserves
      // both, then we verify the empty-LLM-result fallback returns those
      // locally-deduped items rather than dropping the data.
      mockAnalyzeFrame
        .mockResolvedValueOnce({
          items: [makeExtractedItem({ creator_handle: 'alpha', post_text: 'first creator unique video title here' })],
          extraction_confidence: 0.9,
        })
        .mockResolvedValueOnce({
          items: [makeExtractedItem({ creator_handle: 'bravo', post_text: 'second creator different unique video title' })],
          extraction_confidence: 0.9,
        });

      mockDeduplicateItems.mockResolvedValueOnce({
        deduplicated_items: [],
        original_count: 2,
        deduplicated_count: 0,
        duplicate_pairs_found: 0,
      });

      const frames = [makeFrame(0), makeFrame(1)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      // Fallback: use locally-deduped items since LLM dedup returned empty.
      expect(callbacks.completedResult!.feed_items).toHaveLength(2);
    });

    test('local dedup runs even when LLM dedup is unavailable — duplicates collapse', async () => {
      // Build #47 (audit #20): explicit assertion that the local dedup pass
      // catches the failure mode the LLM dedup was missing — same handle,
      // same text across multiple frames must collapse to one item even if
      // the LLM dedup throws.
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enableDeduplication: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      mockAnalyzeFrame.mockResolvedValue({
        items: [
          makeExtractedItem({
            creator_handle: 'samevideo',
            post_text: 'The exact same long video title in every frame',
          }),
        ],
        extraction_confidence: 0.9,
      });
      mockDeduplicateItems.mockRejectedValueOnce(new Error('LLM dedup unavailable'));

      const frames = Array.from({ length: 5 }, (_, i) => makeFrame(i));
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'youtube', makeCaptureInfo(), getBase64, 'user-123');

      expect(callbacks.completedResult!.feed_items).toHaveLength(1);
    });
  });

  describe('run — buildUnifiedScanResult shape', () => {
    test('produces valid UnifiedScanResult with all required fields', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValueOnce({
        items: [
          makeExtractedItem({
            is_ad: true,
            ad_detection_reason: 'Sponsored label visible',
            source_origin: 'suggested',
          }),
          makeExtractedItem({
            creator_handle: '@bob',
            post_text: 'Political post',
            political: { is_political: true, stance_or_alignment_guess: 'LEFT', policy_area: 'healthcare' },
            emotions: { valence: 'NEGATIVE' },
          }),
        ],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0)];
      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run(frames, 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      const result = callbacks.completedResult!;
      expect(result).toBeDefined();

      // Schema version
      expect(result.schema_version).toBe('1.0.0');

      // Scan metadata
      expect(result.scan_metadata.scan_id).toBe('test-scan-uuid-1234');
      expect(result.scan_metadata.source_type).toBe('MOBILE_BROADCAST');
      expect(result.scan_metadata.platform).toBe('INSTAGRAM');
      expect(result.scan_metadata.created_at).toBeTruthy();

      // Environment
      expect(result.environment.device_type).toBe('MOBILE');
      expect(result.environment.broadcast_capture).toBeDefined();

      // Feed items
      expect(result.feed_items).toHaveLength(2);

      // First item is ad
      const adItem = result.feed_items[0]!;
      expect(adItem.is_ad).toBe(true);
      expect(adItem.ad_metadata).toBeDefined();
      expect(adItem.ad_metadata!.ad_detected_reason).toBe('Sponsored label visible');
      expect(adItem.source_origin).toBe('suggested');

      // Second item is political
      const politicalItem = result.feed_items[1]!;
      expect(politicalItem.political.is_political).toBe(true);
      expect(politicalItem.political.stance_or_alignment_guess).toBe('LEFT');
      expect(politicalItem.emotions?.valence).toBe('NEGATIVE');

      // Aggregates
      expect(result.aggregates.total_feed_items).toBe(2);
      expect(result.aggregates.total_ads).toBe(1);
      expect(result.aggregates.ad_percentage).toBe(50);
      expect(result.aggregates.political_content_summary!.political_items).toBe(1);
      expect(result.aggregates.topic_distribution).toBeDefined();

      // Privacy
      expect(result.privacy.user_identifiers_stored).toBe(false);
      expect(result.privacy.raw_text_stored).toBe(true);

      // Debug
      expect(result.debug.gemini_used).toBe(true);
      expect(result.debug.processing_time_seconds).toBeGreaterThanOrEqual(0);
    });

    test('maps content types correctly', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValueOnce({
        items: [
          makeExtractedItem({ content_type: 'photo' }),
          makeExtractedItem({ content_type: 'video' }),
          makeExtractedItem({ content_type: 'reel' }),
          makeExtractedItem({ content_type: 'story' }),
          makeExtractedItem({ content_type: 'unknown_type' }),
        ],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      const items = callbacks.completedResult!.feed_items;
      expect(items[0]!.content_type).toBe('PHOTO');
      expect(items[1]!.content_type).toBe('VIDEO');
      expect(items[2]!.content_type).toBe('REEL');
      expect(items[3]!.content_type).toBe('STORY');
      expect(items[4]!.content_type).toBe('UNKNOWN');
    });

    test('maps valence correctly', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValueOnce({
        items: [
          makeExtractedItem({ emotions: { valence: 'POSITIVE' } }),
          makeExtractedItem({ emotions: { valence: 'NEGATIVE' } }),
          makeExtractedItem({ emotions: { valence: 'MIXED' } }),
          makeExtractedItem({ emotions: { valence: 'invalid' } }),
          makeExtractedItem({ emotions: undefined }),
        ],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      const items = callbacks.completedResult!.feed_items;
      expect(items[0]!.emotions?.valence).toBe('POSITIVE');
      expect(items[1]!.emotions?.valence).toBe('NEGATIVE');
      expect(items[2]!.emotions?.valence).toBe('MIXED');
      expect(items[3]!.emotions?.valence).toBe('NEUTRAL'); // fallback
      expect(items[4]!.emotions?.valence).toBe('NEUTRAL'); // fallback
    });

    test('validates source_origin correctly', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValueOnce({
        items: [
          makeExtractedItem({ source_origin: 'suggested' }),
          makeExtractedItem({ source_origin: 'followed' }),
          makeExtractedItem({ source_origin: 'invalid' }),
          makeExtractedItem({ source_origin: null }),
        ],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      const items = callbacks.completedResult!.feed_items;
      expect(items[0]!.source_origin).toBe('suggested');
      expect(items[1]!.source_origin).toBe('followed');
      expect(items[2]!.source_origin).toBeNull();
      expect(items[3]!.source_origin).toBeNull();
    });

    test('validates ai_disclosure correctly', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValueOnce({
        items: [
          makeExtractedItem({ ai_disclosure: 'LABELED_AI' }),
          makeExtractedItem({ ai_disclosure: 'NOT_LABELED' }),
          makeExtractedItem({ ai_disclosure: 'invalid' }),
          makeExtractedItem({ ai_disclosure: null }),
        ],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      const items = callbacks.completedResult!.feed_items;
      expect(items[0]!.ai_disclosure).toBe('LABELED_AI');
      expect(items[1]!.ai_disclosure).toBe('NOT_LABELED');
      expect(items[2]!.ai_disclosure).toBeNull();
      expect(items[3]!.ai_disclosure).toBeNull();
    });
  });

  describe('run — aggregates computation', () => {
    test('computes ad_percentage and topic_distribution', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValueOnce({
        items: [
          makeExtractedItem({ is_ad: true, topics: { primary_category: 'Fashion', secondary_categories: [], freeform_tags: [] } }),
          makeExtractedItem({ is_ad: false, topics: { primary_category: 'Fashion', secondary_categories: [], freeform_tags: [] } }),
          makeExtractedItem({ is_ad: false, topics: { primary_category: 'Tech', secondary_categories: [], freeform_tags: [] } }),
          makeExtractedItem({ is_ad: false, topics: { primary_category: 'Tech', secondary_categories: [], freeform_tags: [] } }),
        ],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      const agg = callbacks.completedResult!.aggregates;
      expect(agg.total_feed_items).toBe(4);
      expect(agg.total_ads).toBe(1);
      expect(agg.ad_percentage).toBe(25);
      expect(agg.topic_distribution).toBeDefined();
      expect(agg.topic_distribution!.length).toBe(2);
      // Both Fashion and Tech have 50%
      const fashionTopic = agg.topic_distribution!.find((t) => t.category === 'Fashion');
      const techTopic = agg.topic_distribution!.find((t) => t.category === 'Tech');
      expect(fashionTopic!.count).toBe(2);
      expect(techTopic!.count).toBe(2);
    });

    test('handles zero feed items in aggregates without division error', async () => {
      // This scenario is tested via the "no frames" case which will fail,
      // so let's test that the builder handles it via the structure
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      // Frame returns empty items array but pipeline requires at least 1 item
      // This will trigger the "could not read any posts" error
      mockAnalyzeFrame.mockResolvedValueOnce({
        items: [],
        extraction_confidence: 0,
      });

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      expect(callbacks.onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('run — persistence', () => {
    test('calls supabase insert when persistence enabled', async () => {
      const { supabase } = require('../lib/supabase');
      const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
      supabase.from.mockReturnValue({ insert: mockInsert });

      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enablePersistence: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      expect(supabase.from).toHaveBeenCalledWith('scans');
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    });

    test('persistence failure is non-fatal — still calls onComplete', async () => {
      const { supabase } = require('../lib/supabase');
      supabase.from.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ error: { message: 'DB error' } })),
      });

      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enablePersistence: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      // onComplete should still fire even though save failed
      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
      const result = callbacks.completedResult!;
      expect(result.debug.warnings!.some((w) => w.code === 'SAVE_FAILED')).toBe(true);
    });
  });

  describe('run — backend enrichment', () => {
    test('fires backend enrichment when enabled', async () => {
      const { api } = require('../lib/api');

      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enableBackendEnrichment: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      // Wait a tick for fire-and-forget
      await new Promise((r) => setTimeout(r, 10));

      expect(api.post).toHaveBeenCalledWith('/api/scan/desktop', expect.any(Object));
    });
  });

  describe('run — persistScan row shape for dashboard compatibility', () => {
    test('persistScan writes raw_data.analysis with correct structure', async () => {
      const { supabase } = require('../lib/supabase');
      const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
      supabase.from.mockReturnValue({ insert: mockInsert });

      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), enablePersistence: true };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      mockAnalyzeFrame.mockResolvedValueOnce({
        items: [makeExtractedItem({
          creator_handle: '@testcreator',
          political: { is_political: true, stance_or_alignment_guess: 'LEFT', policy_area: 'education' },
          emotions: { valence: 'POSITIVE' },
        })],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      const insertedRow = (mockInsert.mock.calls as any[][])[0]![0]! as any;
      expect(insertedRow.user_id).toBe('user-123');
      expect(insertedRow.platform).toBe('instagram');

      // Build #44: source_type and duration_seconds are NOT top-level
      // columns on the live Supabase 'scans' table. Inserting them caused
      // PostgREST to reject every broadcast scan with 42703. Both values
      // now live inside raw_data instead.
      expect(insertedRow.source_type).toBeUndefined();
      expect(insertedRow.duration_seconds).toBeUndefined();

      // Verify raw_data shape
      const rawData = insertedRow.raw_data;
      // Build #44: source_type now nested inside raw_data so read sites
      // can still distinguish broadcast vs WebView scans.
      expect(rawData.source_type).toBe('MOBILE_BROADCAST');
      expect(rawData.posts).toHaveLength(1);
      expect(rawData.posts[0].creator_handle).toBe('@testcreator');
      expect(rawData.posts[0].is_ad).toBe(false);

      // Verify analysis key for dashboard compatibility
      expect(rawData.analysis).toBeDefined();
      expect(rawData.analysis.ai_analyzed).toBe(true);
      expect(rawData.analysis.feed_items).toHaveLength(1);
      expect(rawData.analysis.feed_items[0].political.is_political).toBe(true);
      expect(rawData.analysis.feed_items[0].political.stance_or_alignment).toBe('LEFT');
      expect(rawData.analysis.feed_items[0].emotions.valence).toBe('POSITIVE');
    });
  });

  describe('run — progress tracking', () => {
    test('reports progress with correct frame counts', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValue({
        items: [makeExtractedItem()],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0), makeFrame(1), makeFrame(2)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      // Final COMPLETE progress should have all frames processed
      const completeProgress = callbacks.progressHistory.find((p) => p.stage === 'COMPLETE');
      expect(completeProgress).toBeDefined();
      expect(completeProgress!.scanId).toBe('test-scan-uuid-1234');
      expect(completeProgress!.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    test('progress has totalFrames set correctly', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      mockAnalyzeFrame.mockResolvedValue({
        items: [makeExtractedItem()],
        extraction_confidence: 0.9,
      });

      const frames = [makeFrame(0), makeFrame(1)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      const prepProgress = callbacks.progressHistory.find((p) => p.stage === 'ANALYZING');
      expect(prepProgress!.totalFrames).toBe(2);
    });
  });

  describe('run — getFrameBase64 called with correct filename', () => {
    test('extracts filename from local_path', async () => {
      const callbacks = makeCallbacks();
      const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

      const frame: BroadcastFrame = {
        ...makeFrame(0),
        local_path: '/path/to/shared/frames/capture_001.jpg',
      };

      const getBase64 = jest.fn(() => 'base64data');

      await pipeline.run([frame], 'instagram', makeCaptureInfo(), getBase64, 'user-123');

      expect(getBase64).toHaveBeenCalledWith('capture_001.jpg');
    });
  });

  describe('run — mixed results from multiple frames', () => {
    test('collects items from successful frames, ignores failed ones', async () => {
      const callbacks = makeCallbacks();
      const config: PipelineConfig = { ...defaultConfig(), concurrency: 3 };
      const pipeline = new BroadcastAnalysisPipeline(config, callbacks);

      // Frame 0: success with 2 items
      // Frame 1: Gemini returns empty (no readable posts)
      // Frame 2: success with 1 item
      mockAnalyzeFrame
        .mockResolvedValueOnce({
          items: [
            makeExtractedItem({ creator_handle: '@alice' }),
            makeExtractedItem({ creator_handle: '@bob' }),
          ],
          extraction_confidence: 0.9,
        })
        .mockResolvedValueOnce({
          items: [],
          extraction_confidence: 0.1,
        })
        .mockResolvedValueOnce({
          items: [makeExtractedItem({ creator_handle: '@charlie' })],
          extraction_confidence: 0.8,
        });

      const frames = [makeFrame(0), makeFrame(1), makeFrame(2)];
      await pipeline.run(frames, 'instagram', makeCaptureInfo(), jest.fn(() => 'base64'), 'user-123');

      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
      expect(callbacks.completedResult!.feed_items).toHaveLength(3);
    });
  });
});
