/**
 * useScan — manages captured feed items during a scan session and saves to Supabase.
 *
 * Replaces the old hardcoded API URL approach. Scans are saved directly
 * to the Supabase `scans` table for the current user.
 */

import { useState, useCallback } from 'react';
import { FeedItemCapture } from '../components/scanner/WebViewScanner';
import { supabase } from '../lib/supabase';
import { captureError, captureMessage, addBreadcrumb } from '../lib/sentry';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface UseScanReturn {
  capturedItems: FeedItemCapture[];
  addItem: (item: FeedItemCapture) => void;
  clearItems: () => void;
  saveScan: (platform: string) => Promise<{ success: boolean; scanId?: string; error?: string }>;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Send captured posts to backend for Gemini AI analysis.
 * Builds a UnifiedScanResult payload matching the desktop extension format,
 * sends it to /api/scan/desktop, and writes the enriched results back to Supabase.
 */
async function requestGeminiAnalysis(
  scanId: string,
  posts: FeedItemCapture[],
  platform: string,
): Promise<void> {
  // Build UnifiedScanResult matching the desktop extension format
  const feedItems = posts.map((p, i) => ({
    item_id: `mobile_${scanId}_${i}`,
    creator: {
      handle: p.creator_handle || '',
      name: p.creator_display_name || p.creator_handle || '',
    },
    content_text: {
      title: '',
      body: (p.post_text || '').substring(0, 2000),
      on_screen_labels: [],
    },
    is_ad: p.is_ad,
    is_suggested: p.is_suggested,
    content_type: p.content_type || 'unknown',
    position_in_feed: p.position_in_feed ?? i,
    // Placeholder fields (Gemini will enrich these)
    political: { is_political: false, stance_or_alignment: 'NOT_ANALYZED' },
    tone: { classification: 'NOT_ANALYZED' },
    topic: { primary: 'NOT_ANALYZED', secondary: '' },
  }));

  const totalAds = feedItems.filter((item) => item.is_ad).length;
  const totalItems = feedItems.length;

  const payload = {
    scan_metadata: {
      scan_id: scanId,
      platform: platform.toUpperCase(),
      source_type: 'MOBILE_APP',
      created_at: new Date().toISOString(),
      user_identifier: '', // Backend overrides this with JWT user
    },
    feed_items: feedItems,
    aggregates: {
      total_feed_items: totalItems,
      total_ads: totalAds,
      ad_percentage: totalItems > 0 ? totalAds / totalItems : 0,
    },
    gemini_consent: true, // Mobile users opt in via Settings AI consent toggle
  };

  const result = await api.post<{
    success: boolean;
    ai_analyzed: boolean;
    political_content_summary?: {
      political_items?: number;
      political_percentage?: number;
    };
    topic_distribution?: Record<string, unknown>[];
    wellbeing_summary?: Record<string, unknown>;
  }>('/api/scan/desktop', payload);

  // If Gemini analysis ran, store enriched feed_items back into the Supabase record.
  // We use a separate field (raw_data.analysis) to avoid overwriting the original capture data.
  if (result.ai_analyzed) {
    // Re-fetch the scan from backend to get the full Gemini-enriched feed_items.
    // The /api/scan/desktop endpoint already saved to backend DB;
    // we need the enriched feed_items with political/tone classification.
    try {
      const scanDetail = await api.get<{
        result?: {
          feed_items?: Record<string, unknown>[];
          aggregates?: Record<string, unknown>;
        };
      }>(`/api/scans/${scanId}`);

      if (scanDetail?.result?.feed_items) {
        // Update Supabase record with Gemini analysis results
        const { error: updateError } = await supabase
          .from('scans')
          .update({
            raw_data: {
              // Preserve original posts
              ...((await supabase.from('scans').select('raw_data').eq('id', scanId).single())
                .data?.raw_data || {}),
              // Add analysis results
              analysis: {
                feed_items: scanDetail.result.feed_items,
                political_content_summary: scanDetail.result.aggregates?.political_content_summary,
                ai_analyzed: true,
              },
            },
          })
          .eq('id', scanId);

        if (updateError) {
          captureMessage(
            'Failed to update Supabase with Gemini results',
            'warning',
            { error: updateError.message }
          );
        }
      }
    } catch (fetchErr: unknown) {
      const errorMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      captureMessage(
        'Failed to fetch enriched scan detail',
        'warning',
        { error: errorMsg }
      );
    }
  }
}

export const useScan = (): UseScanReturn => {
  const { user } = useAuth();
  const [capturedItems, setCapturedItems] = useState<FeedItemCapture[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = useCallback((item: FeedItemCapture) => {
    setCapturedItems((prev) => {
      // Deduplicate: skip if same creator + same post text
      const exists = prev.some(
        (existing) =>
          existing.creator_handle === item.creator_handle &&
          existing.post_text === item.post_text
      );
      if (exists) return prev;
      return [...prev, item];
    });
  }, []);

  const clearItems = useCallback(() => {
    setCapturedItems([]);
  }, []);

  const saveScan = useCallback(
    async (platform: string) => {
      if (!user?.id) {
        return { success: false, error: 'Not authenticated' };
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const posts = capturedItems;
        const adCount = posts.filter((p) => p.is_ad).length;
        const suggestedCount = posts.filter((p) => p.is_suggested).length;
        const adPercentage = posts.length > 0
          ? Math.round((adCount / posts.length) * 100)
          : 0;
        const suggestedPercentage = posts.length > 0
          ? Math.round((suggestedCount / posts.length) * 100)
          : 0;

        // Build top creators
        const creatorCounts: Record<string, number> = {};
        posts.forEach((p) => {
          const handle = p.creator_handle || 'unknown';
          creatorCounts[handle] = (creatorCounts[handle] || 0) + 1;
        });
        const topCreators = Object.entries(creatorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([handle]) => handle);

        const scanRow = {
          user_id: user.id,
          platform: platform.toLowerCase(),
          post_count: posts.length,
          ad_count: adCount,
          ad_percentage: adPercentage,
          suggested_count: suggestedCount,
          suggested_percentage: suggestedPercentage,
          raw_data: {
            posts: posts.map((p) => ({
              creator_handle: p.creator_handle,
              creator_display_name: p.creator_display_name,
              post_text: (p.post_text || '').substring(0, 2000),
              is_ad: p.is_ad,
              is_suggested: p.is_suggested,
              content_type: p.content_type,
              hashtags: p.hashtags || [],
              position_in_feed: p.position_in_feed,
              ad_label_text: p.ad_label_text,
            })),
            top_creators: topCreators,
            scanned_at: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        };

        const { data, error: insertError } = await supabase
          .from('scans')
          .insert(scanRow)
          .select('id')
          .single();

        if (insertError) {
          captureMessage('Supabase insert error', 'warning', { error: insertError.message });
          captureError(new Error(insertError.message), 'useScan:supabase_insert', {
            platform,
            postCount: posts.length,
          });
          // Don't throw — we still want to show scan results
          return { success: false, error: insertError.message };
        }

        const scanId = data?.id;

        // Fire-and-forget: Send to backend for Gemini AI analysis.
        // This enriches the scan with political/tone classification.
        // If it fails, the scan still exists in Supabase — user just won't
        // see AI-powered tabs until the next scan succeeds.
        if (scanId) {
          requestGeminiAnalysis(scanId, posts, platform).catch((err) => {
            const errorMsg = err instanceof Error ? err.message : String(err);
            captureMessage('Gemini analysis request failed (non-fatal)', 'warning', {
              error: errorMsg,
            });
          });
        }

        // Clear captured items only on successful save
        setCapturedItems([]);
        return { success: true, scanId };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Failed to save scan');
        captureError(err instanceof Error ? err : new Error(errorMessage), 'useScan:save_scan', {
          platform,
          postCount: capturedItems.length,
        });
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsSubmitting(false);
      }
    },
    [capturedItems, user?.id]
  );

  return {
    capturedItems,
    addItem,
    clearItems,
    saveScan,
    isSubmitting,
    error,
  };
};
