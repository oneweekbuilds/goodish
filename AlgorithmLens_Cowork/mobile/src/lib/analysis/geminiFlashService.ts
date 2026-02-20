/**
 * geminiFlashService.ts — Gemini 2.0 Flash vision API client.
 *
 * Sends broadcast-captured frames to Gemini 2.0 Flash for visual feed analysis.
 * Each frame is sent as a base64 JPEG with OCR context, and the model returns
 * structured JSON describing every visible feed item.
 *
 * Architecture:
 * - Uses Google Generative AI SDK (@google/generative-ai)
 * - Frames are sent individually (not batched into multi-image requests)
 *   to maximize extraction quality per frame
 * - Retry logic with exponential backoff for transient failures
 * - Rate limiting to stay within API quotas
 * - Response validation against expected JSON schema
 */

import {
  GEMINI_SYSTEM_PROMPT,
  buildFramePrompt,
  buildDeduplicationPrompt,
  type GeminiFrameResponse,
  type GeminiExtractedItem,
  type GeminiDeduplicationResponse,
} from './analysisPrompts';
import type { SupportedPlatform } from '../../types/broadcast';

// ============================================
// Configuration
// ============================================

const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 200; // Minimum delay between API calls
const REQUEST_TIMEOUT_MS = 30000;

interface GeminiConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
}

// ============================================
// Service Class
// ============================================

export class GeminiFlashService {
  private apiKey: string;
  private model: string;
  private maxRetries: number;
  private lastRequestTime: number = 0;
  private rateLimitQueue: Promise<void> = Promise.resolve();

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || GEMINI_MODEL;
    this.maxRetries = config.maxRetries || MAX_RETRIES;
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Analyzes a single frame and returns extracted feed items.
   * Sends the frame image + OCR text to Gemini Flash for vision analysis.
   */
  async analyzeFrame(params: {
    frameBase64: string;
    platform: SupportedPlatform;
    frameNumber: number;
    totalFrames: number;
    ocrText: string;
    capturedAt: string;
  }): Promise<GeminiFrameResponse> {
    const userPrompt = buildFramePrompt({
      platform: params.platform,
      frameNumber: params.frameNumber,
      totalFrames: params.totalFrames,
      ocrText: params.ocrText,
      capturedAt: params.capturedAt,
    });

    const response = await this.callGeminiVision(
      params.frameBase64,
      userPrompt,
    );

    return this.parseFrameResponse(response, params.frameNumber);
  }

  /**
   * Deduplicates items extracted across multiple frames.
   * Uses Gemini to identify duplicate items that appeared in consecutive screenshots.
   * For large item sets (>100), processes in overlapping batches to avoid token limits.
   */
  async deduplicateItems(
    allItems: GeminiExtractedItem[],
    platform: SupportedPlatform,
  ): Promise<GeminiDeduplicationResponse> {
    const CHUNK_SIZE = 100;

    if (allItems.length <= CHUNK_SIZE) {
      return this._deduplicateBatch(allItems, platform);
    }

    // Chunk large sets and deduplicate incrementally
    let accumulator = allItems.slice(0, CHUNK_SIZE);
    const firstResult = await this._deduplicateBatch(accumulator, platform);
    accumulator = firstResult.deduplicated_items;

    for (let i = CHUNK_SIZE; i < allItems.length; i += CHUNK_SIZE) {
      const nextChunk = allItems.slice(i, i + CHUNK_SIZE);
      const combined = [...accumulator, ...nextChunk];
      const result = await this._deduplicateBatch(combined, platform);
      accumulator = result.deduplicated_items;
    }

    return {
      deduplicated_items: accumulator,
      original_count: allItems.length,
      deduplicated_count: accumulator.length,
      duplicate_pairs_found: allItems.length - accumulator.length,
    };
  }

  /**
   * Deduplicates a single batch of items via Gemini.
   */
  private async _deduplicateBatch(
    items: GeminiExtractedItem[],
    platform: SupportedPlatform,
  ): Promise<GeminiDeduplicationResponse> {
    const prompt = buildDeduplicationPrompt(platform, items.length);
    const contextPrompt = `${prompt}\n\nAll extracted items:\n${JSON.stringify(items, null, 0)}`;
    const response = await this.callGeminiText(contextPrompt);
    return this.parseDeduplicationResponse(response, items.length, items);
  }

  /**
   * Tests the API connection with a simple request.
   * Returns true if the API key is valid and the model is accessible.
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.callGeminiText('Respond with exactly: {"status":"ok"}');
      const parsed = JSON.parse(response);
      return parsed.status === 'ok';
    } catch {
      return false;
    }
  }

  // ============================================
  // API Call Methods
  // ============================================

  /**
   * Calls Gemini Flash with an image (vision request).
   * Uses the REST API directly for maximum control over the request.
   */
  private async callGeminiVision(
    imageBase64: string,
    userPrompt: string,
  ): Promise<string> {
    await this.enforceRateLimit();

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              text: userPrompt,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [{ text: GEMINI_SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.1, // Low temperature for deterministic extraction
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    };

    return this.executeWithRetry(() =>
      this.makeApiRequest(requestBody),
    );
  }

  /**
   * Calls Gemini Flash with text only (no image).
   * Used for deduplication and aggregation steps.
   */
  private async callGeminiText(prompt: string): Promise<string> {
    await this.enforceRateLimit();

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: GEMINI_SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    };

    return this.executeWithRetry(() =>
      this.makeApiRequest(requestBody),
    );
  }

  /**
   * Makes a raw HTTP request to the Gemini REST API.
   */
  private async makeApiRequest(requestBody: any): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new GeminiApiError(
          `Gemini API error ${response.status}: ${errorBody}`,
          response.status,
          isRetryableStatus(response.status),
        );
      }

      const data = await response.json();

      // Extract text from Gemini response structure
      const candidates = data.candidates;
      if (!candidates || candidates.length === 0) {
        throw new GeminiApiError(
          'No candidates in Gemini response',
          0,
          false,
        );
      }

      const candidate = candidates[0];
      const finishReason = candidate.finishReason;

      if (finishReason === 'SAFETY') {
        console.warn('Gemini blocked this frame due to content safety filters');
        return '{"frame_id":"blocked","extraction_confidence":0,"items":[]}';
      }

      if (finishReason === 'MAX_TOKENS') {
        console.warn('Gemini response was truncated (MAX_TOKENS)');
        // Try to parse what we got — the parseFrameResponse fallback handles partial JSON
      }

      const content = candidate.content;
      if (!content || !content.parts || content.parts.length === 0) {
        throw new GeminiApiError(
          'Empty content in Gemini response',
          0,
          false,
        );
      }

      return content.parts[0].text || '';
    } finally {
      clearTimeout(timeout);
    }
  }

  // ============================================
  // Retry & Rate Limiting
  // ============================================

  /**
   * Executes a function with exponential backoff retry logic.
   * Only retries on transient/retryable errors.
   */
  private async executeWithRetry(fn: () => Promise<string>): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof GeminiApiError && !error.retryable) {
          throw error; // Don't retry non-retryable errors
        }

        if (attempt < this.maxRetries) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay + Math.random() * 500); // Jitter
        }
      }
    }

    throw lastError || new Error('Gemini API request failed after retries');
  }

  /**
   * Enforces minimum delay between API requests using a promise queue.
   * Safe for concurrent callers — each waits in line.
   */
  private async enforceRateLimit(): Promise<void> {
    this.rateLimitQueue = this.rateLimitQueue.then(async () => {
      const elapsed = Date.now() - this.lastRequestTime;
      if (elapsed < RATE_LIMIT_DELAY_MS) {
        await sleep(RATE_LIMIT_DELAY_MS - elapsed);
      }
      this.lastRequestTime = Date.now();
    });
    await this.rateLimitQueue;
  }

  // ============================================
  // Response Parsing
  // ============================================

  /**
   * Parses and validates a Gemini frame analysis response.
   */
  private parseFrameResponse(
    rawText: string,
    frameNumber: number,
  ): GeminiFrameResponse {
    try {
      const parsed = JSON.parse(rawText);

      // Validate required structure
      if (!Array.isArray(parsed.items)) {
        console.warn(`Frame ${frameNumber}: response missing items array, wrapping`);
        return {
          frame_id: String(frameNumber),
          extraction_confidence: 0.5,
          items: [],
        };
      }

      // Sanitize and validate each item
      const items: GeminiExtractedItem[] = parsed.items.map(
        (item: any, index: number) => sanitizeExtractedItem(item, index),
      );

      return {
        frame_id: String(parsed.frame_id || frameNumber),
        extraction_confidence: clamp(
          typeof parsed.extraction_confidence === 'number' ? parsed.extraction_confidence : 0.5,
          0,
          1,
        ),
        items,
      };
    } catch (error) {
      console.warn(`Frame ${frameNumber}: failed to parse Gemini response`, error);
      return {
        frame_id: String(frameNumber),
        extraction_confidence: 0,
        items: [],
      };
    }
  }

  /**
   * Parses and validates a deduplication response.
   */
  private parseDeduplicationResponse(
    rawText: string,
    originalCount: number,
    allItems: GeminiExtractedItem[],
  ): GeminiDeduplicationResponse {
    try {
      const parsed = JSON.parse(rawText);

      if (!Array.isArray(parsed.deduplicated_items)) {
        throw new Error('Missing deduplicated_items array');
      }

      // Validate dedup didn't return more items than input (hallucination guard)
      if (parsed.deduplicated_items.length > allItems.length) {
        console.warn('Dedup returned more items than input, falling back to originals');
        return {
          deduplicated_items: allItems,
          original_count: originalCount,
          deduplicated_count: allItems.length,
          duplicate_pairs_found: 0,
        };
      }

      return {
        deduplicated_items: parsed.deduplicated_items.map(
          (item: any, i: number) => sanitizeExtractedItem(item, i),
        ),
        original_count: parsed.original_count || originalCount,
        deduplicated_count: parsed.deduplicated_count || parsed.deduplicated_items.length,
        duplicate_pairs_found: parsed.duplicate_pairs_found || 0,
      };
    } catch (error) {
      console.warn('Failed to parse deduplication response, returning originals');
      // Fallback: return items as-is without deduplication
      return {
        deduplicated_items: allItems,
        original_count: originalCount,
        deduplicated_count: allItems.length,
        duplicate_pairs_found: 0,
      };
    }
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Sanitizes a single extracted feed item, ensuring all required fields exist
 * with correct types and safe defaults.
 */
function sanitizeExtractedItem(raw: any, index: number): GeminiExtractedItem {
  return {
    estimated_position: typeof raw.estimated_position === 'number'
      ? raw.estimated_position : index + 1,
    content_type: typeof raw.content_type === 'string'
      ? raw.content_type : 'unknown',
    creator_handle: typeof raw.creator_handle === 'string'
      ? raw.creator_handle : null,
    creator_display_name: typeof raw.creator_display_name === 'string'
      ? raw.creator_display_name : null,
    is_ad: raw.is_ad === true || raw.is_ad === 'true',
    ad_detection_reason: typeof raw.ad_detection_reason === 'string'
      ? raw.ad_detection_reason : null,
    is_suggested: raw.is_suggested != null ? Boolean(raw.is_suggested) : null,
    suggestion_detection_reason: typeof raw.suggestion_detection_reason === 'string'
      ? raw.suggestion_detection_reason : null,
    post_text: typeof raw.post_text === 'string'
      ? raw.post_text.substring(0, 2000) : '',
    hashtags: Array.isArray(raw.hashtags)
      ? raw.hashtags.filter((h: any) => typeof h === 'string') : [],
    is_partial: Boolean(raw.is_partial),
    topics: {
      primary_category: raw.topics?.primary_category || 'Other',
      secondary_categories: Array.isArray(raw.topics?.secondary_categories)
        ? raw.topics.secondary_categories : [],
      freeform_tags: Array.isArray(raw.topics?.freeform_tags)
        ? raw.topics.freeform_tags : [],
    },
    political: {
      is_political: Boolean(raw.political?.is_political),
      stance_or_alignment_guess: raw.political?.stance_or_alignment_guess || null,
      policy_area: raw.political?.policy_area || null,
    },
    wellbeing: {
      wellbeing_relevance: raw.wellbeing?.wellbeing_relevance || 'NONE',
      themes: Array.isArray(raw.wellbeing?.themes) ? raw.wellbeing.themes : [],
      potential_risk_flags: Array.isArray(raw.wellbeing?.potential_risk_flags)
        ? raw.wellbeing.potential_risk_flags : [],
    },
    emotions: {
      valence: (raw.emotions?.valence && typeof raw.emotions.valence === 'string' && raw.emotions.valence.trim())
        ? raw.emotions.valence.trim().toUpperCase()
        : 'NEUTRAL',
    },
    source_origin: raw.source_origin || null,
    ai_disclosure: raw.ai_disclosure || null,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503;
}

// ============================================
// Error Types
// ============================================

export class GeminiApiError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = 'GeminiApiError';
    this.status = status;
    this.retryable = retryable;
  }
}
