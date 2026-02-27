import React, { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  ViewStyle,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanOverlay } from './ScanOverlay';
import { getPlatformUrl, getPlatformScript } from '../../lib/platformScripts';
import { captureError, addBreadcrumb } from '../../lib/sentry';
import { markPlatformLoggedIn, isLoggedInUrl } from '../../lib/cookieManager';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING, SHADOWS } from '../../lib/theme';
import { getPlatformDisplayName } from '../../lib/utils';

export interface FeedItemCapture {
  platform: string;
  position_in_feed: number;
  creator_handle: string | null;
  creator_display_name: string | null;
  is_ad: boolean;
  ad_label_text: string | null;
  post_text: string;
  hashtags: string[];
  // PIPELINE FIX H-03: null means subscription status is unknown
  is_suggested: boolean | null;
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

type ScanStatus = 'idle' | 'loading' | 'scanning' | 'done' | 'error';

/** Error info reported back from the injected script or timeout logic. */
interface ScanError {
  reason: string;
  detail: string;
  errorMessage?: string;
  articlesFound?: number;
}

interface WebViewScannerProps {
  platform: string;
  onScanComplete: (result: ScanResult) => void;
  onScanStatusChange?: (status: ScanStatus) => void;
}

export interface WebViewScannerHandle {
  goBack: () => void;
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
  // /shorts/ is intentionally NOT blocked — users need to scroll through
  // Shorts to capture them during YouTube Precision scans (H-05, A-04)
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
  /\/signin/i,
  /\/signup/i,
  /\/sso/i,
  /\/password/i,
  /\/recovery/i,
  /\/verify/i,
  /\/confirm/i,
  /\/captcha/i,
  /\/two.?factor/i,
  /\/mfa/i,
  /\/permission/i,
  /\/approve/i,
];

/** Hosts that should always be allowed for OAuth redirect flows. */
const ALLOWED_AUTH_HOSTS = [
  'accounts.google.com',
  'appleid.apple.com',
  'www.facebook.com',
  'facebook.com',
  'm.facebook.com',
  'login.microsoftonline.com',
  'api.twitter.com',
  'twitter.com',
  'x.com',
  'abs.twimg.com',
  'accounts.youtube.com',
  'consent.google.com',
  'myaccount.google.com',
  'gds.google.com',
  'ssl.gstatic.com',
  'apis.google.com',
  'www.google.com',
  'oauth.reddit.com',
  'www.tiktok.com',
  'login.tiktok.com',
  'sf16-website-login.neutral.ttwstatic.com',
];

/** Max retry attempts — matches the Chrome extension's pattern (3 attempts). */
const MAX_RETRY_ATTEMPTS = 3;

/** URL for users to report persistent scan failures. */
const REPORT_ISSUE_URL = 'https://algorithmlens.com/support';

export const WebViewScanner = React.memo(forwardRef<WebViewScannerHandle, WebViewScannerProps>(({
  platform,
  onScanComplete,
  onScanStatusChange,
}, ref) => {
  const [capturedItems, setCapturedItems] = useState<FeedItemCapture[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [status, setStatus] = useState<ScanStatus>('loading');
  const [scanError, setScanError] = useState<ScanError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const baseUrl = getPlatformUrl(platform);
  // O(1) dedup using a Set of keys instead of O(n) array scan
  const dedupKeysRef = useRef<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    goBack: () => {
      webViewRef.current?.goBack();
    },
  }));

  useEffect(() => {
    onScanStatusChange?.(status);
  }, [status]);

  const injectionScript = getPlatformScript(platform);

  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === 'SCANNER_READY') {
          setStatus('scanning');
        } else if (message.type === 'FEED_ITEM' && message.data) {
          const data = message.data as FeedItemCapture;
          // O(1) dedup check using Set
          const dedupKey = `${data.creator_handle || ''}::${(data.post_text || '').substring(0, 80)}`;
          if (dedupKeysRef.current.has(dedupKey)) return;
          dedupKeysRef.current.add(dedupKey);

          setCapturedItems((prev) => {
            return [...prev, data];
          });
        } else if (message.type === 'SCANNER_DEBUG' && message.data) {
          // Debug logging from injected script — log in dev mode only
          if (__DEV__) {
            console.log(`[Scanner Debug] captured: ${message.data.captured}, observing: ${message.data.observing}`);
          }
        } else if (message.type === 'SCAN_ERROR' && message.data) {
          // Error reported by injected script (try-catch or timeout)
          const scanErr = message.data as ScanError;
          captureError(
            new Error(`WebView scan error: ${scanErr.reason}`),
            'webview:scan_error',
            { errorReason: scanErr.reason, platform, detail: scanErr.detail }
          );
          addBreadcrumb('scan', `Scan error: ${scanErr.reason}`, { platform });
          setScanError(scanErr);
          setStatus('error');
        }
      } catch (error) {
        captureError(error instanceof Error ? error : new Error(String(error)), 'webview:message_parse');
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

      // Always allow known OAuth/auth hosts
      try {
        const navHostname = new URL(url).hostname;
        if (ALLOWED_AUTH_HOSTS.some((h) => navHostname === h || navHostname.endsWith('.' + h))) {
          return true;
        }
      } catch {
        // Invalid URL — allow it rather than blocking the auth flow
        return true;
      }

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

  // M10: Login detection + block navigation to video/reel pages on all platforms.
  // YouTube and other SPAs use client-side navigation which bypasses onShouldStartLoadWithRequest
  // on iOS, so we also need to catch blocked URLs here and navigate back.
  const handleNavigationStateChange = useCallback(
    (navState: { url: string }) => {
      const { url } = navState;

      // Detect successful login and persist state
      if (isLoggedInUrl(platform, url)) {
        markPlatformLoggedIn(platform);
      }

      // Block navigation to video/reel/watch pages on ALL platforms (not just Android).
      // SPA-style navigation (e.g. YouTube clicking into a video) bypasses
      // onShouldStartLoadWithRequest on iOS, so this is needed as a fallback.
      if (BLOCKED_PATH_PATTERNS.some((p) => p.test(url))) {
        webViewRef.current?.goBack();
      }
    },
    [platform]
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

  /** Re-inject the scanning script. Clears error state, resets captured items, increments retry count. */
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    setScanError(null);
    setCapturedItems([]);
    setStartTime(Date.now());
    setStatus('loading');

    // Reload the WebView — this triggers re-injection of the JS
    webViewRef.current?.reload();
  }, []);

  const handleReportIssue = useCallback(() => {
    Linking.openURL(REPORT_ISSUE_URL).catch(() => {
      // Silently fail if the URL can't be opened
    });
  }, []);

  const hasReachedMaxRetries = retryCount >= MAX_RETRY_ATTEMPTS;

  // ── Error state UI ──────────────────────────────────────────
  if (status === 'error' && scanError) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgPage }}>
        {/* Show the WebView behind the error overlay so users can see the page state */}
        <View style={{ flex: 1, opacity: 0.3 }}>
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
            accessible={true}
            style={{ flex: 1 } as ViewStyle}
          />
        </View>

        {/* Error overlay */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: COLORS.bgCard,
            borderTopLeftRadius: RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING['2xl'],
            paddingBottom: SPACING['2xl'] + insets.bottom,
            ...SHADOWS.medium,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Error icon */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: RADIUS['2xl'],
                backgroundColor: COLORS.errorLight,
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
                marginBottom: SPACING.lg,
              }}
            >
              <Text style={{ ...TYPOGRAPHY.h1, color: COLORS.error }}>!</Text>
            </View>

            {/* Error heading */}
            <Text
              style={{
                ...TYPOGRAPHY.h2,
                color: COLORS.textMain,
                textAlign: 'center',
                marginBottom: SPACING.sm,
              }}
            >
              Scan couldn't capture posts
            </Text>

            {/* Error detail */}
            <Text
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginBottom: SPACING['2xl'],
              }}
            >
              {getErrorMessage(scanError, hasReachedMaxRetries)}
            </Text>

            {/* Retry button (if retries remain) */}
            {!hasReachedMaxRetries ? (
              <TouchableOpacity
                onPress={handleRetry}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Try again, ${MAX_RETRY_ATTEMPTS - retryCount} attempts remaining`}
                style={{
                  backgroundColor: COLORS.primaryBlue,
                  borderRadius: RADIUS.md,
                  paddingVertical: SPACING.lg,
                  alignItems: 'center',
                  marginBottom: SPACING.md,
                }}
              >
                <Text style={{ ...TYPOGRAPHY.label, fontSize: TYPOGRAPHY.body.fontSize, fontWeight: '600', color: COLORS.white }}>
                  Try Again ({MAX_RETRY_ATTEMPTS - retryCount} {MAX_RETRY_ATTEMPTS - retryCount === 1 ? 'attempt' : 'attempts'} left)
                </Text>
              </TouchableOpacity>
            ) : (
              /* Max retries reached — show report link */
              <TouchableOpacity
                onPress={handleReportIssue}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Report this scan issue"
                style={{
                  backgroundColor: COLORS.primaryBlue,
                  borderRadius: RADIUS.md,
                  paddingVertical: SPACING.lg,
                  alignItems: 'center',
                  marginBottom: SPACING.md,
                }}
              >
                <Text style={{ ...TYPOGRAPHY.label, fontSize: TYPOGRAPHY.body.fontSize, fontWeight: '600', color: COLORS.white }}>
                  Report This Issue
                </Text>
              </TouchableOpacity>
            )}

            {/* Suggestions */}
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: COLORS.textMuted,
                textAlign: 'center',
                marginBottom: SPACING.sm,
              }}
            >
              {hasReachedMaxRetries
                ? 'We were unable to scan this platform after multiple attempts. Our team will look into it.'
                : 'Try scrolling the page a bit first, then tap Try Again. If the problem persists, try scanning from a different platform.'}
            </Text>

            {/* Retry count indicator */}
            {retryCount > 0 && (
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: COLORS.textSecondary,
                  textAlign: 'center',
                  marginTop: SPACING.xs,
                }}
              >
                Attempt {retryCount} of {MAX_RETRY_ATTEMPTS}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Loading state UI ──────────────────────────────────────────
  const isLoading = status === 'loading';

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
        pullToRefreshEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        incognito={false}
        mediaPlaybackRequiresUserAction={true}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={false}
        accessible={true}
        onLoadEnd={() => {
          // Give the injected JS 5 seconds to send SCANNER_READY.
          // If it doesn't fire (e.g. script blocked by CSP), fall back to 'scanning'
          // so the user isn't stuck on a loading screen indefinitely.
          setTimeout(() => {
            setStatus((prev) => (prev === 'loading' ? 'scanning' : prev));
          }, 5000);
        }}
        style={{ flex: 1, backgroundColor: COLORS.white } as ViewStyle}
        containerStyle={{ backgroundColor: COLORS.white }}
      />

      {/* Loading indicator — visible while page is loading, before scanning starts */}
      {isLoading && (
        <View
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Loading ${platform}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: COLORS.whiteOverlay85,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              paddingHorizontal: SPACING['3xl'],
              paddingVertical: SPACING['2xl'],
              alignItems: 'center',
              ...SHADOWS.card,
            }}
          >
            <ActivityIndicator size="large" color={COLORS.primaryBlue} />
            <Text
              style={{
                ...TYPOGRAPHY.h3,
                color: COLORS.textMain,
                marginTop: SPACING.lg,
              }}
            >
              Loading {getPlatformDisplayName(platform)}
            </Text>
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: COLORS.textSecondary,
                marginTop: SPACING.xs,
              }}
            >
              Preparing to scan your feed...
            </Text>
          </View>
        </View>
      )}

      <ScanOverlay
        postCount={capturedItems.length}
        adCount={capturedItems.filter((item) => item.is_ad).length}
        startTime={startTime}
        onDone={handleDone}
      />
    </View>
  );
}));

/**
 * Map error reasons from the injected script to user-friendly messages.
 */
function getErrorMessage(error: ScanError, isMaxRetries: boolean): string {
  if (isMaxRetries) {
    return "We couldn't capture posts from this page after multiple attempts. This can happen when a platform changes its layout or blocks automated access.";
  }

  switch (error.reason) {
    case 'PAGE_NOT_LOADED':
      return "The page hasn't fully loaded yet. Make sure you have a stable internet connection, then try again.";
    case 'BOT_DETECTION':
      return 'The platform may have detected automated access. Try scrolling the page manually for a few seconds, then tap Try Again.';
    case 'DOM_STRUCTURE_CHANGED':
      return "We couldn't read the feed layout. This can happen when a platform updates its design. Try again, or scan a different platform.";
    case 'CAPTURE_FAILED':
      return "We found posts on the page but couldn't capture them. Try scrolling the feed a bit first, then tap Try Again.";
    case 'BLOCKED_BY_PLATFORM':
      return 'The platform blocked the scan. Try scrolling the page manually, then tap Try Again.';
    case 'INJECTION_ERROR':
      return "Something went wrong while scanning. This can happen if the platform's layout has changed.";
    case 'TIMEOUT_NO_POSTS':
    default:
      return "We couldn't capture posts from this page. This can happen if the page hasn't fully loaded or if the platform's layout has changed.";
  }
}
