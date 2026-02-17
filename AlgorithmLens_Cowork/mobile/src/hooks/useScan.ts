/**
 * useScan — manages captured feed items during a scan session and saves to Supabase.
 *
 * Replaces the old hardcoded API URL approach. Scans are saved directly
 * to the Supabase `scans` table for the current user.
 */

import { useState, useCallback } from 'react';
import { FeedItemCapture } from '../components/scanner/WebViewScanner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UseScanReturn {
  capturedItems: FeedItemCapture[];
  addItem: (item: FeedItemCapture) => void;
  clearItems: () => void;
  saveScan: (platform: string) => Promise<{ success: boolean; scanId?: string; error?: string }>;
  isSubmitting: boolean;
  error: string | null;
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
          console.warn('Supabase insert error:', insertError);
          // Don't throw — we still want to show scan results
          return { success: false, error: insertError.message };
        }

        // Clear captured items only on successful save
        setCapturedItems([]);
        return { success: true, scanId: data?.id };
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to save scan';
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
