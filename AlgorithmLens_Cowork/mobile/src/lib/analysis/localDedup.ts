/**
 * localDedup.ts — deterministic first-pass deduplication of Gemini extracted items.
 *
 * Build #47 (audit #20): runs BEFORE the LLM-based deduplication. Catches the
 * common "same video across N frames produces N items" failure mode that the
 * LLM dedup misses because of slight UI text drift (timestamp overlays, view
 * counts, time-ago labels) between frames.
 *
 * Strategy: build a normalized key from (creator_handle, post_text) and keep
 * the first occurrence per key. The LLM dedup remains as a second-pass
 * refinement for semantic similarity that this pass can't catch.
 *
 * Null-handle protection: items without a creator_handle could otherwise all
 * collapse into the same bucket. To avoid over-merging unrelated short sidebar
 * items, we require post_text >= 30 characters when the handle is missing,
 * and even then compare full normalized text instead of the 80-char slice
 * used in the handle-present path.
 */

import type { GeminiExtractedItem } from './analysisPrompts';

// ============================================
// Types
// ============================================

export interface LocalDedupStats {
  /** Items the function received. */
  inputCount: number;
  /** Items the function returned (input - merged). */
  outputCount: number;
  /** Items collapsed into existing buckets (inputCount - outputCount). */
  mergedCount: number;
  /** How each surviving item was keyed. Useful for diagnosing over- or under-merging. */
  keyBreakdown: {
    /** Survivors that had a non-empty creator_handle. */
    handlePlusText: number;
    /** Survivors with empty handle but post_text >= 30 chars. */
    noHandleLongText: number;
    /** Survivors with empty handle and short text — kept individually unique. */
    uniqueShortText: number;
  };
}

export interface LocalDedupResult {
  items: GeminiExtractedItem[];
  stats: LocalDedupStats;
}

// ============================================
// Normalization
// ============================================

/**
 * Strips leading "@" symbols, lowercases, and trims. Matches the formatHandle
 * helper's input expectations so a handle stored as "@Foo", "Foo", or " foo "
 * all hash to the same bucket.
 */
function normalizeHandle(handle: string | null | undefined): string {
  if (!handle) return '';
  // Trim first so leading whitespace doesn't shield the "@" from the strip.
  return String(handle).trim().replace(/^@+/, '').toLowerCase();
}

/**
 * Normalizes post_text for stable equality across frames of the same item.
 *
 * Strips three classes of dynamic UI tokens that drift across frames of the
 * same video on YouTube and other platforms:
 * - Timestamps: "0:32", "12:45", "1:23:45"
 * - View counts: "1.2M views", "4K views", "1,234 views", "12 views"
 * - Time-ago durations: "5 minutes ago", "1 hour ago", "2 days ago"
 *
 * After stripping, lowercases, collapses whitespace, and trims. Caller
 * decides whether to slice the result.
 */
function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    // timestamps: 0:32 / 12:45 / 1:23:45
    .replace(/\b\d+:\d+(:\d+)?\b/g, '')
    // view counts: 1.2M views, 4K views, 1,234 views, 12 view
    .replace(/\b[\d,.]+\s*[mkb]?\s*views?\b/gi, '')
    // time-ago: 5 minutes ago, 1 hour ago, 2 weeks ago
    .replace(/\b\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================
// Key construction
// ============================================

const SHORT_TEXT_THRESHOLD = 30;
const SLICE_LENGTH = 80;

type KeyKind = 'handlePlusText' | 'noHandleLongText' | 'uniqueShortText';

interface DedupKey {
  key: string;
  kind: KeyKind;
}

/**
 * Builds a dedup key for one item. Three modes:
 *
 * 1. Handle present → key = `H:${handle}::T:${slicedNormText}` (80-char slice).
 *    Slicing absorbs long-tail text variation (suffixed timestamps, captions
 *    that shift between frames) without making the key meaninglessly broad.
 *
 * 2. Handle missing AND normText length >= 30 → key = `NH:T:${fullNormText}`.
 *    No slicing here because we have less signal; require full text equality
 *    so two semantically-different posts with similar-but-not-identical text
 *    do not collapse together.
 *
 * 3. Handle missing AND normText length < 30 → key = `UNIQ:${index}`.
 *    Each item gets its own bucket. Avoids the failure mode where 10 sidebar
 *    thumbnails with handle=null and text="Watch later" all merge into one
 *    item. Better to under-dedup here than to silently lose data; the LLM
 *    dedup pass that follows can still merge these if it has enough context.
 */
function buildDedupKey(
  handle: string,
  normText: string,
  index: number,
): DedupKey {
  if (handle) {
    return {
      key: `H:${handle}::T:${normText.slice(0, SLICE_LENGTH)}`,
      kind: 'handlePlusText',
    };
  }
  if (normText.length >= SHORT_TEXT_THRESHOLD) {
    return {
      key: `NH:T:${normText}`,
      kind: 'noHandleLongText',
    };
  }
  return {
    key: `UNIQ:${index}`,
    kind: 'uniqueShortText',
  };
}

// ============================================
// Public API
// ============================================

/**
 * Runs the deterministic dedup pass over Gemini-extracted items.
 *
 * - Preserves first-occurrence order (insertion order via Map).
 * - Returns a stats object the pipeline can write into __pipelineDiag for
 *   on-device diagnostics.
 * - Never throws on weird inputs — empty array in, empty array out.
 */
export function localDedup(items: GeminiExtractedItem[]): LocalDedupResult {
  const stats: LocalDedupStats = {
    inputCount: items.length,
    outputCount: 0,
    mergedCount: 0,
    keyBreakdown: {
      handlePlusText: 0,
      noHandleLongText: 0,
      uniqueShortText: 0,
    },
  };

  if (items.length === 0) {
    return { items: [], stats };
  }

  const seen = new Map<string, GeminiExtractedItem>();

  items.forEach((item, idx) => {
    const handle = normalizeHandle(item.creator_handle);
    const normText = normalizeText(item.post_text);
    const { key, kind } = buildDedupKey(handle, normText, idx);

    if (seen.has(key)) {
      stats.mergedCount += 1;
      return;
    }
    seen.set(key, item);
    stats.keyBreakdown[kind] += 1;
  });

  stats.outputCount = seen.size;
  return {
    items: Array.from(seen.values()),
    stats,
  };
}

// Internal helpers exported for unit testing.
export const __test = {
  normalizeHandle,
  normalizeText,
  buildDedupKey,
  SHORT_TEXT_THRESHOLD,
  SLICE_LENGTH,
};
