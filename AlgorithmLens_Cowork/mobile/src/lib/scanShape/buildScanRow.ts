/**
 * buildScanRow: the canonical UnifiedScanResult → Supabase `scans` row
 * transform.
 *
 * This module is the single source of truth for "what shape is a
 * persisted scan." Two call sites consume it:
 *
 *   1. The broadcast analysis pipeline's persistScan() — at SAVING
 *      stage, calls this helper and inserts the result into Supabase.
 *
 *   2. The Results-screen adapter (Phase 4.4.2) — synthesizes a
 *      "virtual" ScanDetail from the in-memory UnifiedScanResult
 *      without touching Supabase, so the 2.x interpretation engine
 *      can run synchronously on the Results screen.
 *
 * Keeping these two call sites pointing at one helper means the
 * virtual ScanDetail on the Results screen is byte-identical (modulo
 * the `now` timestamps) to the row that will be persisted moments
 * later. The engine sees the same shape whether it runs pre- or
 * post-persist.
 *
 * Live Supabase schema (verified 2026-05-06, Build #44):
 *   id, user_id, platform, post_count, ad_count, ad_percentage,
 *   suggested_count, suggested_percentage, raw_data, created_at.
 *
 * `source_type` and `duration_seconds` are NOT top-level columns;
 * both live nested inside raw_data. PostgREST rejects rows that put
 * them at the top level (error 42703 undefined_column).
 */

import type { UnifiedScanResult, FeedItem } from '../../types';

// ============================================
// Types
// ============================================

/** Shape of a row inserted into the Supabase `scans` table. */
export interface ScanRow {
  id: string;
  user_id: string;
  platform: string;
  post_count: number;
  ad_count: number;
  ad_percentage: number;
  suggested_count: number;
  suggested_percentage: number;
  raw_data: ScanRowRawData;
  created_at: string;
}

/** Shape of the nested `raw_data` JSONB column. */
export interface ScanRowRawData {
  /** Source-type literal moved inside raw_data in Build #44. */
  source_type: 'MOBILE_BROADCAST';
  posts: ScanRowPost[];
  top_creators: Array<{ name: string; count: number }>;
  scanned_at: string;
  broadcast_capture: UnifiedScanResult['environment']['broadcast_capture'];
  /** Dashboard-compatibility format. computeDashboardData reads from
   *  this nested analysis key (matches the format written by
   *  requestGeminiAnalysis in useScan.ts). */
  analysis: {
    ai_analyzed: true;
    feed_items: AnalyzedFeedItem[];
    political_content_summary: UnifiedScanResult['aggregates']['political_content_summary'];
  };
}

/** Flattened post shape inside raw_data.posts. */
export interface ScanRowPost {
  creator_handle: string;
  creator_display_name: string;
  post_text: string;
  is_ad: boolean;
  is_suggested: boolean;
  content_type: string;
  hashtags: string[];
  position_in_feed: number;
  ad_label_text: string | null;
}

/** Per-item Gemini classification shape inside raw_data.analysis.feed_items. */
export interface AnalyzedFeedItem {
  political: {
    is_political: boolean;
    stance_or_alignment: string;
  };
  emotions: {
    valence: string;
  };
  creator: {
    handle: string;
    name: string;
  };
}

export interface BuildScanRowOptions {
  scanId: string;
  userId: string;
  platform: string;
  /** Optional injected "now" for deterministic timestamps. Defaults
   *  to the current time — matches the original persistScan behavior
   *  of stamping rows at insert time. The Results-screen adapter may
   *  pass `result.scan_metadata.created_at` here so the virtual
   *  ScanDetail's timestamps don't drift across re-renders. */
  now?: Date;
}

// ============================================
// Transform
// ============================================

/**
 * Builds a Supabase `scans` row from an in-memory UnifiedScanResult.
 *
 * Behavior is byte-identical to the inline transform that previously
 * lived in BroadcastAnalysisPipeline.persistScan (lines 786-836 of
 * broadcastAnalysisPipeline.ts before this refactor), with the
 * single difference that `now` can be injected for determinism.
 */
export function buildScanRow(
  result: UnifiedScanResult,
  opts: BuildScanRowOptions,
): ScanRow {
  const { scanId, userId, platform, now = new Date() } = opts;
  const nowIso = now.toISOString();

  const totalAds = result.aggregates.total_ads;
  const totalItems = result.aggregates.total_feed_items;
  const suggestedCount = result.feed_items.filter(
    (i) => i.source_origin === 'suggested',
  ).length;

  return {
    id: scanId,
    user_id: userId,
    platform: platform.toLowerCase(),
    post_count: totalItems,
    ad_count: totalAds,
    ad_percentage: result.aggregates.ad_percentage,
    suggested_count: suggestedCount,
    suggested_percentage:
      totalItems > 0 ? Math.round((suggestedCount / totalItems) * 100) : 0,
    raw_data: {
      source_type: 'MOBILE_BROADCAST',
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
      top_creators: getTopCreators(result.feed_items),
      scanned_at: nowIso,
      broadcast_capture: result.environment.broadcast_capture,
      analysis: {
        ai_analyzed: true,
        feed_items: result.feed_items.map((item) => ({
          political: {
            is_political: item.political?.is_political || false,
            stance_or_alignment:
              item.political?.stance_or_alignment_guess || 'NOT_ANALYZED',
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
    created_at: nowIso,
  };
}

// ============================================
// Helpers
// ============================================

/**
 * Returns the top 10 creators by post count, descending. Unknown
 * handles fall into a single 'unknown' bucket. Matches the behavior
 * of the original BroadcastAnalysisPipeline.getTopCreators private
 * method moved here unchanged.
 */
function getTopCreators(
  feedItems: FeedItem[],
): Array<{ name: string; count: number }> {
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
