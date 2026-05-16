/**
 * Integration test — regression fence for the dedup bug from diagnostic #20.
 *
 * Background: TestFlight build #46 reported "52 distinct feed items" from a
 * 43-frame YouTube broadcast where the user actually watched 2 videos. Audit
 * #20 traced this to (a) per-frame over-extraction on YouTube watch pages
 * (sidebar / Up Next thumbnails counted as items) and (b) the LLM dedup's
 * imperfect recall on UI-text drift (timestamps, view counts).
 *
 * This test exercises the full pipeline with a hardcoded fixture that mimics
 * what Gemini WOULD return for 10 frames of a YouTube watch page (1 main
 * video + 5 sidebar thumbnails per frame, with shifting timestamps on the
 * main video). It does NOT call the real Gemini API.
 *
 * The LLM dedup is mocked as identity — we are testing whether the local
 * dedup pass alone is sufficient to compress 60 raw items into a sensible
 * single-digit count. This isolates the regression we care about: even if
 * the LLM dedup completely fails or returns its input unchanged, the local
 * pass must still produce a reasonable feed_items count.
 *
 * If this test ever fails with feed_items.length > 10, something in the
 * dedup chain has regressed. Investigate before shipping.
 */

import {
  BroadcastAnalysisPipeline,
  PipelineCallbacks,
  PipelineConfig,
  PipelineProgress,
} from '../lib/analysis/broadcastAnalysisPipeline';
import type { BroadcastFrame, BroadcastCaptureInfo } from '../types/broadcast';
import type { UnifiedScanResult } from '../types';
import type { GeminiExtractedItem } from '../lib/analysis/analysisPrompts';

// ─── Mocks (identical pattern to broadcastAnalysisPipeline.test.ts) ──

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
  api: { post: jest.fn(() => Promise.resolve({ data: {} })) },
}));

jest.mock('../lib/utils', () => ({
  generateUUID: jest.fn(() => 'integration-test-scan'),
}));

const mockAnalyzeFrame = jest.fn();
const mockDeduplicateItems = jest.fn();

jest.mock('../lib/analysis/geminiFlashService', () => ({
  GeminiFlashService: jest.fn().mockImplementation(() => ({
    analyzeFrame: mockAnalyzeFrame,
    deduplicateItems: mockDeduplicateItems,
    testConnection: jest.fn(),
  })),
  GeminiApiError: class extends Error {
    status: number;
    retryable: boolean;
    constructor(m: string, s: number, r: boolean) {
      super(m);
      this.status = s;
      this.retryable = r;
    }
  },
}));

// ─── Fixture: a YouTube watch-page frame as Gemini would return it ──
//
// One main video (the user is watching) + 5 sidebar Up Next items. The main
// video's post_text changes per frame because the player timestamp overlay
// shifts (this is the exact failure mode that defeated the LLM dedup).
// Sidebar items are stable across frames.

function makeFrame(index: number): BroadcastFrame {
  return {
    frame_id: `frame_${index}`,
    captured_at: `2026-05-07T03:00:${String(index).padStart(2, '0')}Z`,
    perceptual_hash: `hash_${index}`,
    local_path: `/path/to/frame_${index}.jpg`,
    size_bytes: 50000,
    width: 1170,
    height: 2532,
    ocr_text: '',
    ocr_confidence: 0.9,
    is_unique: true,
  };
}

function makeItem(overrides: Partial<GeminiExtractedItem>): GeminiExtractedItem {
  return {
    estimated_position: 1,
    content_type: 'video',
    creator_handle: 'unknown',
    creator_display_name: null,
    is_ad: false,
    ad_detection_reason: null,
    is_suggested: false,
    suggestion_detection_reason: null,
    post_text: '',
    hashtags: [],
    is_partial: false,
    topics: { primary_category: 'Entertainment', secondary_categories: [], freeform_tags: [] },
    political: { is_political: false, stance_or_alignment_guess: null, policy_area: null },
    wellbeing: { wellbeing_relevance: 'NONE', themes: [], potential_risk_flags: [] },
    emotions: { valence: 'NEUTRAL' },
    source_origin: null,
    ai_disclosure: null,
    ...overrides,
  };
}

// 6 items per watch-page frame: 1 main + 5 sidebar. Same sidebar items in
// every frame (mimics a static Up Next list); main item's post_text shifts.
function watchPageFrameItems(frameIndex: number): GeminiExtractedItem[] {
  const playerTimestamps = ['0:00', '0:15', '0:32', '1:01', '1:23', '2:10', '3:05', '4:48', '5:30', '7:00'];
  const ts = playerTimestamps[frameIndex % playerTimestamps.length];
  return [
    // The main watched video — same handle and title, only timestamp drifts.
    makeItem({
      creator_handle: 'resurgestories',
      post_text: `The Long Forgotten Tale of Saturday ${ts}`,
      content_type: 'video',
    }),
    // 5 sidebar / Up Next items, stable across frames.
    makeItem({ creator_handle: 'mrbeast', post_text: 'I gave away my entire factory 1.2M views 2 days ago' }),
    makeItem({ creator_handle: 'veritasium', post_text: 'The math problem nobody could solve 4M views 1 week ago' }),
    makeItem({ creator_handle: 'lemmino', post_text: 'The mystery of the missing flight 8M views 3 months ago' }),
    makeItem({ creator_handle: 'kurzgesagt', post_text: 'What happens inside a black hole 12M views 5 months ago' }),
    makeItem({ creator_handle: 'tomscott', post_text: 'A thing you didnt know about bridges 2M views 1 year ago' }),
  ];
}

// ─── Helpers ──────────────────────────────────────

function makeCaptureInfo(): BroadcastCaptureInfo {
  return {
    is_broadcast_based: true,
    broadcast_method: 'REPLAYKIT',
    frames_captured: 10,
    frames_unique: 10,
    duration_seconds: 109,
    average_frame_interval_seconds: 2.5,
    on_device_ocr_used: true,
  };
}

function makeCallbacks(): PipelineCallbacks & {
  completedResult: UnifiedScanResult | null;
  errorCaptured: Error | null;
  progressHistory: PipelineProgress[];
} {
  const obj = {
    completedResult: null as UnifiedScanResult | null,
    errorCaptured: null as Error | null,
    progressHistory: [] as PipelineProgress[],
    onProgress: jest.fn(),
    onComplete: jest.fn(),
    onError: jest.fn(),
  };
  obj.onProgress.mockImplementation((p: PipelineProgress) => {
    obj.progressHistory.push({ ...p });
  });
  obj.onComplete.mockImplementation((_id: string, result: UnifiedScanResult) => {
    obj.completedResult = result;
  });
  obj.onError.mockImplementation((err: Error) => {
    obj.errorCaptured = err;
  });
  return obj;
}

function defaultConfig(): PipelineConfig {
  return {
    apiKey: 'integration-test-key',
    enablePersistence: false,
    enableBackendEnrichment: false,
    enableDeduplication: true,
    concurrency: 1,
  };
}

// ─── Tests ──────────────────────────────────────

describe('Dedup integration — regression fence for audit #20', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Per-frame extraction: return 6 items per frame (1 main + 5 sidebar).
    let frameCounter = 0;
    mockAnalyzeFrame.mockImplementation(() => {
      const items = watchPageFrameItems(frameCounter);
      frameCounter += 1;
      return Promise.resolve({
        items,
        extraction_confidence: 0.9,
      });
    });

    // LLM dedup mocked as IDENTITY — return whatever it gets, unchanged.
    // This is the worst-case for local dedup: the LLM contributes zero
    // additional dedup, so anything below the inflated count must come
    // from the local dedup pass alone.
    mockDeduplicateItems.mockImplementation((items: GeminiExtractedItem[]) =>
      Promise.resolve({
        deduplicated_items: items,
        original_count: items.length,
        deduplicated_count: items.length,
        duplicate_pairs_found: 0,
      }),
    );
  });

  test('10 frames × 6 items each → final feed_items is single-digit (the bug from build #46 would have produced ~50)', async () => {
    const callbacks = makeCallbacks();
    const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

    const frames = Array.from({ length: 10 }, (_, i) => makeFrame(i));
    const getBase64 = jest.fn(() => 'fake-base64');

    await pipeline.run(frames, 'youtube', makeCaptureInfo(), getBase64, 'user-test');

    expect(callbacks.errorCaptured).toBeNull();
    expect(callbacks.completedResult).not.toBeNull();

    const finalCount = callbacks.completedResult!.feed_items.length;

    // With local dedup working: 1 main video (10 timestamp-drifted copies
    // collapse) + 5 stable sidebar items = 6 items.
    // Without local dedup (the bug): 60 raw items pass through identity
    // LLM dedup unchanged → 60 final items.
    // Single-digit threshold gives a small buffer for normalization edge
    // cases, but a regression that re-introduces the bug would land at 50+.
    expect(finalCount).toBeLessThanOrEqual(10);
    expect(finalCount).toBeGreaterThanOrEqual(2);
  });

  test('main watched video appears exactly once despite 10 timestamp variations', async () => {
    const callbacks = makeCallbacks();
    const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

    const frames = Array.from({ length: 10 }, (_, i) => makeFrame(i));
    await pipeline.run(frames, 'youtube', makeCaptureInfo(), jest.fn(() => 'fake'), 'user-test');

    const mainItems = callbacks.completedResult!.feed_items.filter(
      (item) => item.account?.account_handle?.toLowerCase() === 'resurgestories',
    );
    expect(mainItems).toHaveLength(1);
  });

  test('each sidebar creator appears exactly once', async () => {
    const callbacks = makeCallbacks();
    const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

    const frames = Array.from({ length: 10 }, (_, i) => makeFrame(i));
    await pipeline.run(frames, 'youtube', makeCaptureInfo(), jest.fn(() => 'fake'), 'user-test');

    const handles = callbacks.completedResult!.feed_items.map(
      (item) => item.account?.account_handle?.toLowerCase(),
    );
    const expectedHandles = ['resurgestories', 'mrbeast', 'veritasium', 'lemmino', 'kurzgesagt', 'tomscott'];
    for (const expected of expectedHandles) {
      expect(handles.filter((h) => h === expected)).toHaveLength(1);
    }
  });

  test('aggregate post count matches feed_items length (no inflation downstream)', async () => {
    const callbacks = makeCallbacks();
    const pipeline = new BroadcastAnalysisPipeline(defaultConfig(), callbacks);

    const frames = Array.from({ length: 10 }, (_, i) => makeFrame(i));
    await pipeline.run(frames, 'youtube', makeCaptureInfo(), jest.fn(() => 'fake'), 'user-test');

    const result = callbacks.completedResult!;
    expect(result.aggregates.total_feed_items).toBe(result.feed_items.length);
    // The bug would have shown ~52 here; we expect single-digit.
    expect(result.aggregates.total_feed_items).toBeLessThan(15);
  });
});
