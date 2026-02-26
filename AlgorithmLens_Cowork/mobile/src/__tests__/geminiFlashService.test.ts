/**
 * Tests for GeminiFlashService — Gemini 2.0 Flash vision API client.
 *
 * Tests cover: retry logic, rate limiting, error handling, response parsing,
 * deduplication, and timeout behavior.
 */
import { GeminiFlashService, GeminiApiError } from '../lib/analysis/geminiFlashService';

// ─── Mocks ──────────────────────────────────────

// Mock sentry
jest.mock('../lib/sentry', () => ({
  captureMessage: jest.fn(),
  captureError: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Helper to create a successful Gemini API response
function geminiResponse(text: string, finishReason = 'STOP') {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      candidates: [{
        content: { parts: [{ text }] },
        finishReason,
      }],
    }),
    text: () => Promise.resolve(text),
  };
}

function errorResponse(status: number, body = 'Error') {
  return {
    ok: false,
    status,
    text: () => Promise.resolve(body),
    json: () => Promise.resolve({ error: body }),
  };
}

const VALID_FRAME_RESPONSE = JSON.stringify({
  frame_id: '1',
  extraction_confidence: 0.9,
  items: [{
    estimated_position: 1,
    content_type: 'photo',
    creator_handle: '@user1',
    creator_display_name: 'User One',
    is_ad: false,
    post_text: 'Hello world',
    hashtags: ['#test'],
    topics: { primary_category: 'General' },
    political: { is_political: false },
    emotions: { valence: 'POSITIVE' },
  }],
});

// ─── Tests ──────────────────────────────────────

describe('GeminiFlashService', () => {
  let service: GeminiFlashService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ advanceTimers: true });
    service = new GeminiFlashService({ apiKey: 'test-key', maxRetries: 2 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('analyzeFrame', () => {
    test('successful single request returns parsed items', async () => {
      mockFetch.mockResolvedValueOnce(geminiResponse(VALID_FRAME_RESPONSE));

      const result = await service.analyzeFrame({
        frameBase64: 'base64data',
        platform: 'instagram',
        frameNumber: 1,
        totalFrames: 5,
        ocrText: 'some text',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.creator_handle).toBe('@user1');
      expect(result.items[0]?.is_ad).toBe(false);
      expect(result.extraction_confidence).toBe(0.9);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('sends correct API key in header', async () => {
      mockFetch.mockResolvedValueOnce(geminiResponse(VALID_FRAME_RESPONSE));

      await service.analyzeFrame({
        frameBase64: 'base64data',
        platform: 'twitter',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers['x-goog-api-key']).toBe('test-key');
    });

    test('sends image as inline base64', async () => {
      mockFetch.mockResolvedValueOnce(geminiResponse(VALID_FRAME_RESPONSE));

      await service.analyzeFrame({
        frameBase64: 'my-base64-image-data',
        platform: 'youtube',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.contents[0].parts[0].inlineData.data).toBe('my-base64-image-data');
      expect(body.contents[0].parts[0].inlineData.mimeType).toBe('image/jpeg');
    });
  });

  describe('retry logic', () => {
    test('retries on 500 error up to maxRetries', async () => {
      mockFetch
        .mockResolvedValueOnce(errorResponse(500))
        .mockResolvedValueOnce(errorResponse(500))
        .mockResolvedValueOnce(geminiResponse(VALID_FRAME_RESPONSE));

      const promise = service.analyzeFrame({
        frameBase64: 'data',
        platform: 'instagram',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      // Advance timers for retry delays
      await jest.advanceTimersByTimeAsync(5000);
      await jest.advanceTimersByTimeAsync(5000);

      const result = await promise;
      expect(result.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('retries on 429 rate limit', async () => {
      mockFetch
        .mockResolvedValueOnce(errorResponse(429, 'Rate limited'))
        .mockResolvedValueOnce(geminiResponse(VALID_FRAME_RESPONSE));

      const promise = service.analyzeFrame({
        frameBase64: 'data',
        platform: 'instagram',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      await jest.advanceTimersByTimeAsync(5000);

      const result = await promise;
      expect(result.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('does NOT retry on 400 client error', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(400, 'Bad request'));

      await expect(
        service.analyzeFrame({
          frameBase64: 'data',
          platform: 'instagram',
          frameNumber: 1,
          totalFrames: 1,
          ocrText: '',
          capturedAt: '2026-01-01T00:00:00Z',
        }),
      ).rejects.toThrow(GeminiApiError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('does NOT retry on 401 auth error', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(401, 'Invalid API key'));

      await expect(
        service.analyzeFrame({
          frameBase64: 'data',
          platform: 'instagram',
          frameNumber: 1,
          totalFrames: 1,
          ocrText: '',
          capturedAt: '2026-01-01T00:00:00Z',
        }),
      ).rejects.toThrow('Invalid API key');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('throws after max retries exhausted', async () => {
      jest.useRealTimers(); // Use real timers for this test since retry delays are small
      const fastService = new GeminiFlashService({ apiKey: 'test-key', maxRetries: 1 });
      mockFetch.mockResolvedValue(errorResponse(503, 'Service unavailable'));

      await expect(
        fastService.analyzeFrame({
          frameBase64: 'data',
          platform: 'instagram',
          frameNumber: 1,
          totalFrames: 1,
          ocrText: '',
          capturedAt: '2026-01-01T00:00:00Z',
        }),
      ).rejects.toThrow('503');
      // 1 initial + 1 retry = 2 total calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('response parsing', () => {
    test('handles malformed JSON response body', async () => {
      mockFetch.mockResolvedValueOnce(geminiResponse('not valid json'));

      const result = await service.analyzeFrame({
        frameBase64: 'data',
        platform: 'instagram',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      // Should return empty items, not throw
      expect(result.items).toEqual([]);
      expect(result.extraction_confidence).toBe(0);
    });

    test('handles empty response body', async () => {
      mockFetch.mockResolvedValueOnce(geminiResponse(''));

      const result = await service.analyzeFrame({
        frameBase64: 'data',
        platform: 'instagram',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      expect(result.items).toEqual([]);
    });

    test('handles response with missing items array', async () => {
      mockFetch.mockResolvedValueOnce(geminiResponse(JSON.stringify({ frame_id: '1' })));

      const result = await service.analyzeFrame({
        frameBase64: 'data',
        platform: 'instagram',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      expect(result.items).toEqual([]);
    });

    test('sanitizes items with missing fields', async () => {
      const responseJson = JSON.stringify({
        items: [{ creator_handle: '@test' }], // Most fields missing
      });
      mockFetch.mockResolvedValueOnce(geminiResponse(responseJson));

      const result = await service.analyzeFrame({
        frameBase64: 'data',
        platform: 'instagram',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      expect(result.items).toHaveLength(1);
      const item = result.items[0]!;
      expect(item.creator_handle).toBe('@test');
      expect(item.content_type).toBe('unknown');
      expect(item.is_ad).toBe(false);
      expect(item.post_text).toBe('');
      expect(item.hashtags).toEqual([]);
      expect(item.topics.primary_category).toBe('Other');
      expect(item.political.is_political).toBe(false);
    });

    test('clamps extraction_confidence to 0-1 range', async () => {
      const responseJson = JSON.stringify({
        extraction_confidence: 5.0, // Out of range
        items: [],
      });
      mockFetch.mockResolvedValueOnce(geminiResponse(responseJson));

      const result = await service.analyzeFrame({
        frameBase64: 'data',
        platform: 'instagram',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      expect(result.extraction_confidence).toBe(1);
    });

    test('handles SAFETY finishReason', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          candidates: [{
            content: { parts: [{ text: '' }] },
            finishReason: 'SAFETY',
          }],
        }),
      });

      const result = await service.analyzeFrame({
        frameBase64: 'data',
        platform: 'instagram',
        frameNumber: 1,
        totalFrames: 1,
        ocrText: '',
        capturedAt: '2026-01-01T00:00:00Z',
      });

      expect(result.items).toEqual([]);
    });

    test('handles no candidates in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ candidates: [] }),
        text: () => Promise.resolve(''),
      });

      await expect(
        service.analyzeFrame({
          frameBase64: 'data',
          platform: 'instagram',
          frameNumber: 1,
          totalFrames: 1,
          ocrText: '',
          capturedAt: '2026-01-01T00:00:00Z',
        }),
      ).rejects.toThrow('No candidates');
    });
  });

  describe('network errors', () => {
    test('GeminiApiError is instance of Error', () => {
      const err = new GeminiApiError('Fetch failed', 0, true);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Fetch failed');
    });
  });

  describe('GeminiApiError', () => {
    test('has status, retryable, and name properties', () => {
      const err = new GeminiApiError('Test error', 429, true);
      expect(err.message).toBe('Test error');
      expect(err.status).toBe(429);
      expect(err.retryable).toBe(true);
      expect(err.name).toBe('GeminiApiError');
      expect(err).toBeInstanceOf(Error);
    });

    test('non-retryable error for 400', () => {
      const err = new GeminiApiError('Bad request', 400, false);
      expect(err.retryable).toBe(false);
    });
  });

  describe('testConnection', () => {
    test('returns true on valid response', async () => {
      mockFetch.mockResolvedValueOnce(geminiResponse(JSON.stringify({ status: 'ok' })));

      const result = await service.testConnection();
      expect(result).toBe(true);
    });

    test('returns false on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const promise = service.testConnection();
      await jest.advanceTimersByTimeAsync(30000);

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('deduplication', () => {
    test('deduplicateItems returns dedup response', async () => {
      const dedupResponse = JSON.stringify({
        deduplicated_items: [{
          estimated_position: 1,
          content_type: 'photo',
          creator_handle: '@user1',
          post_text: 'Hello',
          is_ad: false,
          topics: { primary_category: 'General' },
          political: { is_political: false },
          emotions: { valence: 'NEUTRAL' },
        }],
        original_count: 3,
        deduplicated_count: 1,
        duplicate_pairs_found: 2,
      });
      mockFetch.mockResolvedValueOnce(geminiResponse(dedupResponse));

      const items = [
        { estimated_position: 1, content_type: 'photo', creator_handle: '@user1', creator_display_name: null, post_text: 'Hello', is_ad: false, ad_detection_reason: null, is_suggested: false, suggestion_detection_reason: null, hashtags: [], is_partial: false, topics: { primary_category: 'General', secondary_categories: [], freeform_tags: [] }, political: { is_political: false, stance_or_alignment_guess: null, policy_area: null }, wellbeing: { wellbeing_relevance: 'NONE', themes: [], potential_risk_flags: [] }, emotions: { valence: 'NEUTRAL' }, source_origin: null, ai_disclosure: null },
        { estimated_position: 2, content_type: 'photo', creator_handle: '@user1', creator_display_name: null, post_text: 'Hello', is_ad: false, ad_detection_reason: null, is_suggested: false, suggestion_detection_reason: null, hashtags: [], is_partial: false, topics: { primary_category: 'General', secondary_categories: [], freeform_tags: [] }, political: { is_political: false, stance_or_alignment_guess: null, policy_area: null }, wellbeing: { wellbeing_relevance: 'NONE', themes: [], potential_risk_flags: [] }, emotions: { valence: 'NEUTRAL' }, source_origin: null, ai_disclosure: null },
        { estimated_position: 3, content_type: 'video', creator_handle: '@user2', creator_display_name: null, post_text: 'World', is_ad: false, ad_detection_reason: null, is_suggested: false, suggestion_detection_reason: null, hashtags: [], is_partial: false, topics: { primary_category: 'General', secondary_categories: [], freeform_tags: [] }, political: { is_political: false, stance_or_alignment_guess: null, policy_area: null }, wellbeing: { wellbeing_relevance: 'NONE', themes: [], potential_risk_flags: [] }, emotions: { valence: 'NEUTRAL' }, source_origin: null, ai_disclosure: null },
      ];

      const result = await service.deduplicateItems(items as any, 'instagram');
      expect(result.deduplicated_items).toHaveLength(1);
      expect(result.original_count).toBe(3);
    });

    test('dedup fallback when response is malformed', async () => {
      mockFetch.mockResolvedValueOnce(geminiResponse('not json'));

      const items = [
        { estimated_position: 1, content_type: 'photo', creator_handle: '@user1', post_text: 'Hello', is_ad: false, topics: { primary_category: 'General' }, political: { is_political: false }, emotions: { valence: 'NEUTRAL' } },
      ];

      const result = await service.deduplicateItems(items as any, 'instagram');
      // Falls back to original items
      expect(result.deduplicated_items).toHaveLength(1);
      expect(result.duplicate_pairs_found).toBe(0);
    });
  });
});
