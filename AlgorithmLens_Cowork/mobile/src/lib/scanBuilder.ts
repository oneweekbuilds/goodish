import { FeedItemCapture } from '../components/scanner/WebViewScanner';
import { generateUUID } from './utils';

export interface FeedItem {
  creator_handle: string;
  post_text: string;
  is_ad: boolean;
  is_suggested: boolean;
  timestamp: number;
  source_url?: string;
}

export interface UnifiedScanResult {
  scan_id: string;
  source_type: string;
  timestamp: number;
  platform: string;
  feed_items: FeedItem[];
  total_feed_items: number;
  total_ads: number;
  ad_percentage: number;
  privacy: {
    identifiers_stored: boolean;
    photos_stored: boolean;
    retention_days: number;
  };
  gemini_consent: boolean;
}

/**
 * Builds a UnifiedScanResult from captured feed items
 */
export function buildUnifiedScanResult(
  captures: FeedItemCapture[],
  platform: string,
  geminiConsent: boolean
): UnifiedScanResult {
  const feedItems: FeedItem[] = captures.map((capture) => ({
    creator_handle: capture.creator_handle || '',
    post_text: capture.post_text || '',
    is_ad: capture.is_ad,
    is_suggested: capture.is_suggested,
    timestamp: capture.capture_timestamp || Date.now(),
  }));

  const totalAds = feedItems.filter((item) => item.is_ad).length;
  const adPercentage = feedItems.length > 0
    ? Math.round((totalAds / feedItems.length) * 100)
    : 0;

  return {
    scan_id: generateUUID(),
    source_type: 'MOBILE_APP',
    timestamp: Date.now(),
    platform: platform.toLowerCase(),
    feed_items: feedItems,
    total_feed_items: feedItems.length,
    total_ads: totalAds,
    ad_percentage: adPercentage,
    privacy: {
      identifiers_stored: false,
      photos_stored: false,
      retention_days: 30,
    },
    gemini_consent: geminiConsent,
  };
}
