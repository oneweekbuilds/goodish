/**
 * broadcastAnalysisPipeline.ts — Orchestrates the full broadcast analysis flow.
 *
 * Pipeline stages:
 * 1. PREPARING   — Validate frames, initialize Gemini service
 * 2. ANALYZING   — Send each frame to Gemini Flash for feed item extraction
 * 3. DEDUPLICATING — Merge duplicate items across overlapping frames
 * 4. BUILDING    — Construct UnifiedScanResult from extracted items
 * 5. SAVING      — Persist to Supabase + fire backend enrichment
 * 6. COMPLETE    — Pipeline finished, results ready
 *
 * The pipeline reports progress via callbacks so the UI can show
 * real-time analysis updates (e.g., "Analyzing frame 5 of 23...").
 */

import { Platform } from 'react-native';
import { GeminiFlashService, GeminiApiError } from './geminiFlashService';
import type { GeminiExtractedItem } from './analysisPrompts';
import type {
  BroadcastFrame,
  BroadcastCaptureInfo,
  SupportedPlatform,
} from '../../types/broadcast';
import type {
  UnifiedScanResult,
  FeedItem,
  ScanMetadata,
  Environment,
  Aggregates,
  PrivacyInfo,
  DebugInfo,
} from '../../types';
import { supabase } from '../supabase';
import { api } from '../api';
import { captureError } from '../sentry';
import { generateUUID } from '../utils';

// ============================================
// Pipeline Types
// ============================================

export type PipelineStage =
  | 'PREPARING'
  | 'ANALYZING'
  | 'DEDUPLICATING'
  | 'BUILDING'
  | 'SAVING'
  | 'COMPLETE'
  | 'FAILED';

export interface PipelineProgress {
  stage: PipelineStage;
  /** Current frame being analyzed (1-indexed). */
  currentFrame: number;
  /** Total frames to analyze. */
  totalFrames: number;
  /** Total feed items extracted so far. */
  itemsExtracted: number;
  /** Items after deduplication. */
  itemsDeduplicated: number;
  /** Elapsed time since pipeline start in ms. */
  elapsedMs: number;
  /** Error message if stage is FAILED. */
  errorMessage: string | null;
  /** Resulting scan ID if COMPLETE. */
  scanId: string | null;
}

export interface PipelineCallbacks {
  onProgress: (progress: PipelineProgress) => void;
  onComplete: (scanId: string, result: UnifiedScanResult) => void;
  onError: (error: Error, partialResult?: UnifiedScanResult) => void;
}

export interface PipelineConfig {
  /** Gemini API key. */
  apiKey: string;
  /** Max frames to analyze (to cap cost on very long sessions). 0 = no limit. */
  maxFramesToAnalyze?: number;
  /** Whether to run the deduplication pass. */
  enableDeduplication?: boolean;
  /** Whether to save to Supabase. */
  enablePersistence?: boolean;
  /** Whether to fire backend Gemini enrichment (political/tone). */
  enableBackendEnrichment?: boolean;
  /** Concurrency level for frame analysis (1 = sequential). */
  concurrency?: number;
}

const DEFAULT_CONFIG: Required<Omit<PipelineConfig, 'apiKey'>> = {
  maxFramesToAnalyze: 200, // Safety cap to bound cost; 0 = no limit
  enableDeduplication: true,
  enablePersistence: true,
  enableBackendEnrichment: true,
  concurrency: 3,
};

// ============================================
// Pipeline Class
// ============================================

export class BroadcastAnalysisPipeline {
  private gemini: GeminiFlashService;
  private config: Required<PipelineConfig>;
  private callbacks: PipelineCallbacks;
  private aborted: boolean = false;
  private startTime: number = 0;

  constructor(
    config: PipelineConfig,
    callbacks: PipelineCallbacks,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<PipelineConfig>;
    this.callbacks = callbacks;
    this.gemini = new GeminiFlashService({ apiKey: config.apiKey });
  }

  /**
   * Aborts the pipeline. In-flight Gemini requests will complete
   * but no new frames will be sent.
   */
  abort(): void {
    this.aborted = true;
  }

  /**
   * Runs the full analysis pipeline.
   *
   * @param frames - Captured broadcast frames (from useBroadcast.collectFrames)
   * @param platform - Platform being analyzed
   * @param captureInfo - Broadcast capture metadata
   * @param getFrameBase64 - Function to retrieve frame image data
   * @param userId - Current user ID for scan persistence
   */
  async run(
    frames: BroadcastFrame[],
    platform: SupportedPlatform,
    captureInfo: BroadcastCaptureInfo,
    getFrameBase64: (filename: string) => string | null,
    userId: string,
  ): Promise<void> {
    this.startTime = Date.now();
    this.aborted = false;

    const progress: PipelineProgress = {
      stage: 'PREPARING',
      currentFrame: 0,
      totalFrames: frames.length,
      itemsExtracted: 0,
      itemsDeduplicated: 0,
      elapsedMs: 0,
      errorMessage: null,
      scanId: null,
    };

    try {
      // ── Stage 1: PREPARING ──
      this.reportProgress(progress);

      const framesToAnalyze = this.config.maxFramesToAnalyze > 0
        ? frames.slice(0, this.config.maxFramesToAnalyze)
        : frames;

      progress.totalFrames = framesToAnalyze.length;

      if (framesToAnalyze.length === 0) {
        throw new PipelineError('No frames to analyze', 'PREPARING');
      }

      // ── Stage 2: ANALYZING ──
      progress.stage = 'ANALYZING';
      this.reportProgress(progress);

      const allExtractedItems = await this.analyzeFrames(
        framesToAnalyze,
        platform,
        getFrameBase64,
        progress,
      );

      // After analyzing, the getFrameBase64 function still holds references to base64 data,
      // which is expected and necessary for deduplication and building stages.
      // This is passed by reference from the parent, so cleanup is handled externally.

      if (this.aborted) {
        throw new PipelineError('Pipeline aborted by user', 'ANALYZING');
      }

      progress.itemsExtracted = allExtractedItems.length;

      // If no items were extracted from any frame, this is a fatal error
      if (allExtractedItems.length === 0 && !this.aborted) {
        throw new PipelineError(
          "We could not read any posts from the captured frames. This can happen if the feed was not visible during recording, or if the frames were too blurry. Try scrolling more slowly next time.",
          "ANALYZING",
        );
      }
      // ── Stage 3: DEDUPLICATING ──
      let finalItems: GeminiExtractedItem[];

      if (this.config.enableDeduplication && allExtractedItems.length > 0) {
        progress.stage = 'DEDUPLICATING';
        this.reportProgress(progress);

        try {
          const dedupResult = await this.gemini.deduplicateItems(
            allExtractedItems,
            platform,
          );
          finalItems = dedupResult.deduplicated_items.length > 0
            ? dedupResult.deduplicated_items
            : allExtractedItems; // Fallback if dedup returned empty
          progress.itemsDeduplicated = finalItems.length;
        } catch (error) {
          // Deduplication failure is non-fatal — use raw items
          if (__DEV__) {
            console.warn('Deduplication failed, using raw extracted items:', error);
          }
          finalItems = allExtractedItems;
          progress.itemsDeduplicated = allExtractedItems.length;
        }
      } else {
        finalItems = allExtractedItems;
        progress.itemsDeduplicated = allExtractedItems.length;
      }

      // ── Stage 4: BUILDING ──
      progress.stage = 'BUILDING';
      this.reportProgress(progress);

      const scanId = generateUUID();
      const scanResult = this.buildUnifiedScanResult(
        scanId,
        platform,
        finalItems,
        captureInfo,
        progress,
      );

      // ── Stage 5: SAVING ──
      let saveWarning: string | null = null;
      if (this.config.enablePersistence) {
        progress.stage = 'SAVING';
        this.reportProgress(progress);

        try {
          await this.persistScan(scanId, scanResult, userId, platform);
        } catch (saveError) {
          // Saving is non-fatal — show results anyway, warn user
          const msg = saveError instanceof Error ? saveError.message : String(saveError);
          if (__DEV__) {
            console.warn('Failed to save scan to history (non-fatal):', msg);
          }
          captureError(
            saveError instanceof Error ? saveError : new Error(msg),
            'BroadcastAnalysisPipeline:persistScan',
            { scanId, platform }
          );
          saveWarning = 'Your results are ready, but we couldn\'t save them to your history. They\'ll only be available during this session.';
        }
      }

      // ── Stage 6: COMPLETE ──
      progress.stage = 'COMPLETE';
      progress.scanId = scanId;
      progress.elapsedMs = Date.now() - this.startTime;
      this.reportProgress(progress);

      // If save failed, the result still includes a warning the UI can show
      if (saveWarning && scanResult.debug) {
        scanResult.debug.warnings = [...(scanResult.debug.warnings || []), { code: 'SAVE_FAILED', message: saveWarning }];
      }

      this.callbacks.onComplete(scanId, scanResult);

      // Fire-and-forget backend enrichment
      if (this.config.enableBackendEnrichment) {
        this.requestBackendEnrichment(scanId, scanResult).catch((err) => {
          if (__DEV__) {
            console.warn('Backend enrichment failed (non-fatal):', err?.message);
          }
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      progress.stage = 'FAILED';
      progress.errorMessage = err.message;
      progress.elapsedMs = Date.now() - this.startTime;
      this.reportProgress(progress);
      this.callbacks.onError(err);

      captureError(err, 'BroadcastAnalysisPipeline:run', {
        platform,
        frameCount: frames.length,
        stage: (error as PipelineError).stage || 'UNKNOWN',
      });
    }
  }

  // ============================================
  // Frame Analysis
  // ============================================

  /**
   * Analyzes frames with controlled concurrency.
   * Sends `concurrency` frames at a time to Gemini Flash.
   * Explicitly nulls out processed frame references to help GC release memory after each batch.
   */
  private async analyzeFrames(
    frames: BroadcastFrame[],
    platform: SupportedPlatform,
    getFrameBase64: (filename: string) => string | null,
    progress: PipelineProgress,
  ): Promise<GeminiExtractedItem[]> {
    const allItems: GeminiExtractedItem[] = [];
    const concurrency = this.config.concurrency;

    // Process in batches of `concurrency`
    for (let i = 0; i < frames.length; i += concurrency) {
      if (this.aborted) break;

      const batch = frames.slice(i, i + concurrency);
      const batchPromises = batch.map((frame, batchIndex) => {
        const frameIndex = i + batchIndex;
        return this.analyzeSingleFrame(
          frame,
          platform,
          frameIndex + 1,
          frames.length,
          getFrameBase64,
        );
      });

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          allItems.push(...result.value);
        }
        // Rejected promises are logged inside analyzeSingleFrame
      }

      // Explicitly null out processed batch to help GC release memory
      batch.length = 0;

      // Update progress
      progress.currentFrame = Math.min(i + concurrency, frames.length);
      progress.itemsExtracted = allItems.length;
      progress.elapsedMs = Date.now() - this.startTime;
      this.reportProgress(progress);
    }

    return allItems;
  }

  /**
   * Analyzes a single frame, returns extracted items or empty array on failure.
   */
  private async analyzeSingleFrame(
    frame: BroadcastFrame,
    platform: SupportedPlatform,
    frameNumber: number,
    totalFrames: number,
    getFrameBase64: (filename: string) => string | null,
  ): Promise<GeminiExtractedItem[]> {
    try {
      // Get frame image as base64
      const filename = frame.local_path.split('/').pop() || frame.frame_id;
      const base64 = getFrameBase64(filename);

      if (!base64) {
        if (__DEV__) {
          console.warn(`Frame ${frameNumber}: no base64 data available, skipping`);
        }
        return [];
      }

      const response = await this.gemini.analyzeFrame({
        frameBase64: base64,
        platform,
        frameNumber,
        totalFrames,
        ocrText: frame.ocr_text || '',
        capturedAt: frame.captured_at,
      });

      return response.items;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (__DEV__) {
        console.warn(`Frame ${frameNumber}: analysis failed — ${message}`);
      }

      // Non-fatal: skip this frame but continue the pipeline
      if (error instanceof GeminiApiError && !error.retryable) {
        throw error; // Propagate non-retryable errors (bad API key, etc.)
      }

      return [];
    }
  }

  // ============================================
  // UnifiedScanResult Builder
  // ============================================

  /**
   * Transforms Gemini extracted items into a UnifiedScanResult
   * that the existing dashboard can consume.
   */
  private buildUnifiedScanResult(
    scanId: string,
    platform: SupportedPlatform,
    items: GeminiExtractedItem[],
    captureInfo: BroadcastCaptureInfo,
    progress: PipelineProgress,
  ): UnifiedScanResult {
    const feedItems: FeedItem[] = items.map((item, index) => ({
      position_in_feed: item.estimated_position || index + 1,
      content_type: mapContentType(item.content_type),
      is_ad: item.is_ad,
      ad_metadata: item.is_ad
        ? {
            ad_detected_reason: item.ad_detection_reason || undefined,
            sponsored_label_text: item.ad_detection_reason || undefined,
            advertiser_name: item.creator_display_name || undefined,
          }
        : undefined,
      account: {
        account_handle: item.creator_handle,
        account_display_name: item.creator_display_name,
        account_category_guess: item.topics.primary_category || null,
      },
      content_text: {
        captions: item.post_text,
        hashtags: item.hashtags,
        on_screen_labels: [],
      },
      topics: {
        primary_category: item.topics.primary_category || null,
        secondary_categories: item.topics.secondary_categories,
        freeform_tags: item.topics.freeform_tags,
      },
      political: {
        is_political: item.political.is_political,
        stance_or_alignment_guess: item.political.stance_or_alignment_guess,
        policy_area: item.political.policy_area,
      },
      wellbeing: {
        wellbeing_relevance: item.wellbeing?.wellbeing_relevance || null,
        themes: item.wellbeing?.themes || [],
        potential_risk_flags: item.wellbeing?.potential_risk_flags || [],
      },
      emotions: {
        valence: mapValence(item.emotions?.valence),
      },
      source_origin: validateSourceOrigin(item.source_origin),
      ai_disclosure: validateAiDisclosure(item.ai_disclosure),
      vision_confidence: null, // Set per-item if available
    }));

    // Build aggregates
    const totalAds = feedItems.filter((item) => item.is_ad).length;
    const topicCounts: Record<string, number> = {};
    feedItems.forEach((item) => {
      const cat = item.topics?.primary_category || 'Other';
      topicCounts[cat] = (topicCounts[cat] || 0) + 1;
    });
    const topicDistributionRaw = Object.entries(topicCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: feedItems.length > 0
          ? Math.round((count / feedItems.length) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Correct rounding so percentages sum to exactly 100%
    const topicDistribution = correctPercentageRounding(topicDistributionRaw);

    const politicalItems = feedItems.filter((i) => i.political?.is_political).length;

    const aggregates: Aggregates = {
      total_feed_items: feedItems.length,
      total_ads: totalAds,
      ad_percentage: feedItems.length > 0
        ? Math.round((totalAds / feedItems.length) * 10000) / 100
        : 0,
      topic_distribution: topicDistribution,
      political_content_summary: {
        political_items: politicalItems,
        political_percentage: feedItems.length > 0
          ? Math.round((politicalItems / feedItems.length) * 10000) / 100
          : 0,
      },
    };

    const scanMetadata: ScanMetadata = {
      scan_id: scanId,
      created_at: new Date().toISOString(),
      source_type: 'MOBILE_BROADCAST',
      platform: platform.toUpperCase(),
    };

    const environment: Environment = {
      device_type: 'MOBILE',
      device_os: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      device_os_version: Platform.Version?.toString(),
      broadcast_capture: captureInfo,
    };

    const privacy: PrivacyInfo = {
      user_identifiers_stored: false,
      profile_photos_stored: false,
      raw_text_stored: true,
      retention_policy_key: 'SHORT',
      redacted_fields: [],
    };

    const debugInfo: DebugInfo = {
      processing_time_seconds: Math.round((Date.now() - this.startTime) / 1000 * 10) / 10,
      errors: [],
      warnings: [],
      gemini_consent: true,
      gemini_attempted: true,
      gemini_used: true,
      gemini_reason: 'Broadcast frame analysis via Gemini 2.0 Flash',
    };

    return {
      schema_version: '1.0.0',
      scan_metadata: scanMetadata,
      environment,
      feed_items: feedItems,
      aggregates,
      privacy,
      debug: debugInfo,
    };
  }

  // ============================================
  // Persistence
  // ============================================

  /**
   * Saves the scan result to Supabase.
   */
  private async persistScan(
    scanId: string,
    result: UnifiedScanResult,
    userId: string,
    platform: string,
  ): Promise<void> {
    const totalAds = result.aggregates.total_ads;
    const totalItems = result.aggregates.total_feed_items;
    const suggestedCount = result.feed_items.filter(
      (i) => i.source_origin === 'suggested',
    ).length;

    const scanRow = {
      id: scanId,
      user_id: userId,
      platform: platform.toLowerCase(),
      post_count: totalItems,
      ad_count: totalAds,
      ad_percentage: result.aggregates.ad_percentage,
      suggested_count: suggestedCount,
      suggested_percentage: totalItems > 0
        ? Math.round((suggestedCount / totalItems) * 100)
        : 0,
      source_type: 'MOBILE_BROADCAST',
      duration_seconds: result.environment.broadcast_capture?.duration_seconds || 0,
      raw_data: {
        posts: result.feed_items.map((item) => ({
          creator_handle: item.account?.account_handle || '',
          creator_display_name: item.account?.account_display_name || '',
          post_text: item.content_text?.captions || '',
          is_ad: item.is_ad,
          is_suggested: item.source_origin === 'suggested',
          content_type: item.content_type,
          hashtags: item.content_text?.hashtags || [],
          position_in_feed: item.position_in_feed,
          ad_label_text: item.ad_metadata?.ad_detected_reason || null,
        })),
        top_creators: this.getTopCreators(result.feed_items),
        scanned_at: new Date().toISOString(),
        broadcast_capture: result.environment.broadcast_capture,
        // Dashboard compatibility: analysis key matches the format
        // written by requestGeminiAnalysis() in useScan.ts so that
        // computeDashboardData can read political + tone data.
        analysis: {
          ai_analyzed: true,
          feed_items: result.feed_items.map((item) => ({
            political: {
              is_political: item.political?.is_political || false,
              stance_or_alignment: item.political?.stance_or_alignment_guess || 'NOT_ANALYZED',
            },
            emotions: {
              valence: item.emotions?.valence || 'NEUTRAL',
            },
            creator: {
              handle: item.account?.account_handle || '',
              name: item.account?.account_display_name || '',
            },
          })),
          political_content_summary: result.aggregates.political_content_summary,
        },
      },
      created_at: new Date().toISOString(),
    };

    const insertPromise = supabase.from('scans').insert(scanRow);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase insert timed out after 15 seconds')), 15000)
    );

    const { error: insertError } = await Promise.race([insertPromise, timeoutPromise]);

    if (insertError) {
      if (__DEV__) {
        console.warn('Supabase insert error:', insertError.message);
      }
      throw new PipelineError(
        `Failed to save scan: ${insertError.message}`,
        'SAVING',
      );
    }
  }

  /**
   * Sends the scan to the backend for additional Gemini enrichment
   * (political/tone classification on text content).
   */
  private async requestBackendEnrichment(
    scanId: string,
    result: UnifiedScanResult,
  ): Promise<void> {
    const feedItems = result.feed_items.map((item, i) => ({
      item_id: `broadcast_${scanId}_${i}`,
      creator: {
        handle: item.account?.account_handle || '',
        name: item.account?.account_display_name || '',
      },
      content_text: {
        title: '',
        body: (item.content_text?.captions || '').substring(0, 2000),
        on_screen_labels: item.content_text?.on_screen_labels || [],
      },
      is_ad: item.is_ad,
      is_suggested: item.source_origin === 'suggested',
      content_type: item.content_type,
      position_in_feed: item.position_in_feed,
      political: {
        is_political: item.political?.is_political || false,
        stance_or_alignment: item.political?.stance_or_alignment_guess || 'NOT_ANALYZED',
      },
      tone: { classification: 'NOT_ANALYZED' },
      topic: {
        primary: item.topics?.primary_category || 'NOT_ANALYZED',
        secondary: (item.topics?.secondary_categories || []).join(', '),
      },
    }));

    const payload = {
      scan_metadata: {
        scan_id: scanId,
        platform: result.scan_metadata.platform,
        source_type: 'MOBILE_BROADCAST',
        created_at: result.scan_metadata.created_at,
        user_identifier: '',
      },
      feed_items: feedItems,
      aggregates: {
        total_feed_items: result.aggregates.total_feed_items,
        total_ads: result.aggregates.total_ads,
        ad_percentage: result.aggregates.ad_percentage / 100, // Backend expects 0-1
      },
      gemini_consent: true,
    };

    await api.post('/api/scan/desktop', payload);
  }

  // ============================================
  // Helpers
  // ============================================

  private getTopCreators(feedItems: FeedItem[]): Array<{ name: string; count: number }> {
    const counts: Record<string, number> = {};
    feedItems.forEach((item) => {
      const handle = item.account?.account_handle || 'unknown';
      counts[handle] = (counts[handle] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }

  private reportProgress(progress: PipelineProgress): void {
    progress.elapsedMs = Date.now() - this.startTime;
    this.callbacks.onProgress({ ...progress });
  }
}

// ============================================
// Type Mappers
// ============================================

function mapContentType(geminiType: string): string {
  const map: Record<string, string> = {
    photo: 'PHOTO',
    video: 'VIDEO',
    reel: 'REEL',
    short: 'SHORT',
    text: 'TEXT',
    story: 'STORY',
    ad: 'AD',
    unknown: 'UNKNOWN',
  };
  return map[geminiType.toLowerCase()] || 'UNKNOWN';
}

type Valence = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED' | 'NOT_ANALYZED';
const VALID_VALENCES: Valence[] = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'MIXED', 'NOT_ANALYZED'];

function mapValence(geminiValence: string | undefined): Valence | null {
  const upper = (geminiValence || '').toUpperCase();
  if (VALID_VALENCES.includes(upper as Valence)) {
    return upper as Valence;
  }
  return 'NEUTRAL';
}

function validateSourceOrigin(value: string | null | undefined): 'suggested' | 'followed' | null {
  if (value === 'suggested' || value === 'followed') return value;
  return null;
}

function validateAiDisclosure(value: string | null | undefined): 'LABELED_AI' | 'NOT_LABELED' | null {
  if (value === 'LABELED_AI' || value === 'NOT_LABELED') return value;
  return null;
}

// generateUUID imported from ../utils

/**
 * Adjusts rounded percentages so they sum to exactly 100%.
 * Uses largest-remainder method to distribute rounding error.
 */
function correctPercentageRounding<T extends { percentage: number }>(items: T[]): T[] {
  if (items.length === 0) return items;
  const total = items.reduce((sum, item) => sum + item.percentage, 0);
  if (total === 0 || Math.abs(total - 100) < 0.01) return items;
  const diff = 100 - total;
  // Apply the correction to the largest item
  const result = items.map((item) => ({ ...item }));
  const first = result[0];
  if (first) first.percentage = Math.round((first.percentage + diff) * 100) / 100;
  return result;
}

// ============================================
// Error Types
// ============================================

export class PipelineError extends Error {
  stage: PipelineStage;

  constructor(message: string, stage: PipelineStage) {
    super(message);
    this.name = 'PipelineError';
    this.stage = stage;
  }
}
