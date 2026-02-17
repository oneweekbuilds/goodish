import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  ViewStyle,
  Platform,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { ScanOverlay } from './ScanOverlay';
import { getPlatformUrl, getPlatformScript } from '../../lib/platformScripts';

export interface FeedItemCapture {
  platform: string;
  position_in_feed: number;
  creator_handle: string | null;
  creator_display_name: string | null;
  is_ad: boolean;
  ad_label_text: string | null;
  post_text: string;
  hashtags: string[];
  is_suggested: boolean;
  content_type: string;
  capture_timestamp: number;
  metadata?: Record<string, any>;
}

export interface ScanResult {
  platform: string;
  posts: FeedItemCapture[];
  scannedAt: string;
  adCount: number;
  topCreators: string[];
}

type ScanStatus = 'idle' | 'loading' | 'scanning' | 'done';

interface WebViewScannerProps {
  platform: string;
  onScanComplete: (result: ScanResult) => void;
  onScanStatusChange?: (status: ScanStatus) => void;
}

const USER_AGENT = Platform.select({
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.200 Mobile Safari/537.36',
  default: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
});

const BLOCKED_PATH_PATTERNS = [
  /\/reel\//i,
  /\/reels\//i,
  /\/stories\//i,
  /\/live\//i,
  /\/tv\//i,
  /\/watch/i,
  /\/shorts\//i,
  /\/video\//i,
  /\/status\/\d+\/video/i,
];

const ALLOWED_PATH_PATTERNS = [
  /\/login/i,
  /\/auth/i,
  /\/accounts\//i,
  /\/challenge/i,
  /\/consent/i,
  /\/oauth/i,
  /\/checkpoint/i,
  /\/cookie/i,
  /\/privacy/i,
  /\/terms/i,
];

export const WebViewScanner: React.FC<WebViewScannerProps> = ({
  platform,
  onScanComplete,
  onScanStatusChange,
}) => {
  const [capturedItems, setCapturedItems] = useState<FeedItemCapture[]>([]);
  const [startTime] = useState(Date.now());
  const [status, setStatus] = useState<ScanStatus>('loading');
  const webViewRef = useRef<WebView>(null);
  const baseUrl = getPlatformUrl(platform);

  useEffect(() => {
    onScanStatusChange?.(status);
  }, [status]);

  const injectionScript = getPlatformScript(platform);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === 'SCANNER_READY') {
          setStatus('scanning');
        } else if (message.type === 'FEED_ITEM' && message.data) {
          setCapturedItems((prev) => {
            const data = message.data;
            // H8: Improved dedup with 1000ms proximity threshold (less aggressive than 2000ms)
            const exists = prev.some((item) => {
              if (item.creator_handle === data.creator_handle && item.post_text === data.post_text) return true;
              if (
                item.creator_handle === data.creator_handle &&
                !item.post_text && !data.post_text &&
                Math.abs(item.capture_timestamp - data.capture_timestamp) < 1000
              ) return true;
              return false;
            });
            if (exists) return prev;
            return [...prev, data as FeedItemCapture];
          });
        }
      } catch (error) {
        console.error('Error parsing WebView message:', error);
      }
    },
    // Empty dependency array is intentional: this callback should remain stable across renders
    // to avoid unnecessary re-subscriptions to WebView message handler
    []
  );

  const handleNavigationRequest = useCallback(
    (request: WebViewNavigation): boolean => {
      const { url } = request;
      if (url === baseUrl || url === baseUrl.replace(/\/$/, '')) return true;
      if (ALLOWED_PATH_PATTERNS.some((p) => p.test(url))) return true;
      if (BLOCKED_PATH_PATTERNS.some((p) => p.test(url))) return false;

      try {
        const baseHost = new URL(baseUrl).hostname.replace('www.', '');
        const navHost = new URL(url).hostname.replace('www.', '');
        if (navHost.includes(baseHost) || baseHost.includes(navHost)) return true;
      } catch {
        return true;
      }

      return false;
    },
    [baseUrl]
  );

  // M10: Android fallback
  const handleNavigationStateChange = useCallback(
    (navState: { url: string }) => {
      if (Platform.OS !== 'android') return;
      const { url } = navState;
      if (BLOCKED_PATH_PATTERNS.some((p) => p.test(url))) {
        webViewRef.current?.goBack();
      }
    },
    []
  );

  const handleDone = () => {
    setStatus('done');
    const creatorCounts: Record<string, number> = {};
    capturedItems.forEach((item) => {
      const handle = item.creator_handle || 'unknown';
      creatorCounts[handle] = (creatorCounts[handle] || 0) + 1;
    });
    const topCreators = Object.entries(creatorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([handle]) => handle);

    const result: ScanResult = {
      platform: platform.toUpperCase(),
      posts: capturedItems,
      scannedAt: new Date().toISOString(),
      adCount: capturedItems.filter((item) => item.is_ad).length,
      topCreators,
    };

    onScanComplete(result);
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: baseUrl }}
        userAgent={USER_AGENT}
        injectedJavaScript={injectionScript}
        onMessage={handleWebViewMessage}
        onShouldStartLoadWithRequest={handleNavigationRequest}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        incognito={false}
        mediaPlaybackRequiresUserAction={true}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={false}
        onLoadEnd={() => {
          if (status === 'loading') setStatus('scanning');
        }}
        style={{ flex: 1 } as ViewStyle}
      />

      <ScanOverlay
        postCount={capturedItems.length}
        adCount={capturedItems.filter((item) => item.is_ad).length}
        startTime={startTime}
        onDone={handleDone}
      />
    </View>
  );
};
