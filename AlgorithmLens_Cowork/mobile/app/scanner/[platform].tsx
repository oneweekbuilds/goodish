import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WebViewScanner, ScanResult, WebViewScannerHandle } from '../../src/components/scanner/WebViewScanner';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { supabase } from '../../src/lib/supabase';
import { authenticatedFetch } from '../../src/lib/api';
import { classifyPostTexts } from '../../src/lib/analysis/textClassificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../src/lib/theme';
import { X, Check, ChartBar, AlertTriangle, ChevronLeft } from 'lucide-react-native';
import { MIN_POSTS_GOOD, MIN_POSTS_OK, MIN_POSTS_REQUIRED, MIN_SCAN_DURATION_SECS } from '../../src/config/thresholds';
import { recordScanDate } from '../../src/services/notifications';

// PIPELINE FIX: Gemini API key for client-side text classification (political/tone)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram',
  twitter: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  reddit: 'Reddit',
};

// Uses centralized thresholds from config/thresholds.ts — 5-tier system
function getScanQuality(postCount: number, colors: { accentGreen: string; warning: string; error: string }): { label: string; color: string; message: string } {
  if (postCount >= 50) {
    return {
      label: 'Excellent sample',
      color: colors.accentGreen,
      message: `${postCount} posts captured — detailed insights available`,
    };
  } else if (postCount >= 30) {
    return {
      label: 'Good sample',
      color: colors.accentGreen,
      message: `${postCount} posts captured — enough for meaningful analysis`,
    };
  } else if (postCount >= MIN_POSTS_GOOD) {
    return {
      label: 'Fair sample',
      color: colors.warning,
      message: `${postCount} posts captured — more posts = richer insights`,
    };
  } else if (postCount >= MIN_POSTS_OK) {
    return {
      label: 'Low sample',
      color: colors.warning,
      message: `${postCount} posts — aim for ${MIN_POSTS_GOOD}+ for better accuracy`,
    };
  } else {
    return {
      label: 'Very low sample',
      color: colors.error,
      message: `Only ${postCount} posts — need at least ${MIN_POSTS_OK} for basic analysis`,
    };
  }
}

export default function ScannerScreen() {
  const { platform } = useLocalSearchParams();
  const [saving, setSaving] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('loading');
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedPostCount, setSavedPostCount] = useState(0);
  const [savedAdPct, setSavedAdPct] = useState(0);
  const [savedSuggestedPct, setSavedSuggestedPct] = useState(0);
  const [navigatingToDashboard, setNavigatingToDashboard] = useState(false);
  const { user } = useAuth();
  const { colors, shadows } = useTheme();
  const platformStr = typeof platform === 'string' ? platform : '';
  const platformName = PLATFORM_NAMES[platformStr] || platformStr;
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successAnim = useRef(new Animated.Value(0)).current;
  const scannerRef = useRef<WebViewScannerHandle>(null);

  // Live timer — single source of truth from startTimeRef
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleScanComplete = useCallback(
    async (result: ScanResult) => {
      if (!user?.id) {
        Alert.alert('Error', 'You need to be signed in to save scans.');
        return;
      }

      if (timerRef.current) clearInterval(timerRef.current);

      try {
        setSaving(true);

        const posts = result.posts;
        const adCount = result.adCount;
        // PIPELINE FIX H-03: Count only explicitly suggested posts (true), not null
        const suggestedCount = posts.filter((p) => p.is_suggested === true).length;
        const followedCount = posts.filter((p) => p.is_suggested === false).length;
        const unknownCount = posts.filter((p) => p.is_suggested === null || p.is_suggested === undefined).length;
        const adPercentage =
          posts.length > 0 ? Math.round((adCount / posts.length) * 100) : 0;
        // Use known suggested + proportional unknowns for the percentage
        let effectiveSuggested = suggestedCount;
        if (unknownCount > 0 && (suggestedCount + followedCount) > 0) {
          const knownTotal = suggestedCount + followedCount;
          effectiveSuggested = suggestedCount + Math.round(unknownCount * (suggestedCount / knownTotal));
        } else if (unknownCount > 0) {
          // All unknown — use 70% default
          effectiveSuggested = Math.round(posts.length * 0.7);
        }
        const suggestedPercentage =
          posts.length > 0
            ? Math.round((effectiveSuggested / posts.length) * 100)
            : 0;

        // H-08/A-03 FIX: Sanity check — if all posts are classified as non-suggested
        // on a platform known for algorithmic curation, flag as potential classification error.
        // PIPELINE FIX: With null-aware subscription detection, only warn when ALL posts
        // are explicitly "followed" (not just when suggestedCount is 0 due to unknowns)
        const classificationWarning =
          posts.length > 5 &&
          suggestedCount === 0 &&
          unknownCount === 0 &&
          platformStr !== 'reddit';

        if (classificationWarning) {
          console.warn(
            '[ScannerScreen] 0% suggested with',
            posts.length,
            'posts on',
            platformStr,
            '— possible classification error'
          );
        }

        // Save stats for success screen (use effective values for display)
        setSavedPostCount(posts.length);
        setSavedAdPct(adPercentage);
        setSavedSuggestedPct(suggestedPercentage);

        // PIPELINE FIX (C-04, H-02): Run client-side Gemini text classification
        // BEFORE saving to Supabase, so raw_data.analysis is populated immediately
        // with political + tone data. This fixes "No political content detected"
        // and "No emotional tone data detected" on the dashboard.
        let analysisData = null;
        if (GEMINI_API_KEY && posts.length > 0) {
          try {
            if (__DEV__) {
              console.log('[ScannerScreen] Running text classification on', posts.length, 'posts...');
            }
            analysisData = await classifyPostTexts(
              posts.map((p) => ({
                post_text: p.post_text || '',
                creator_handle: p.creator_handle,
                creator_display_name: p.creator_display_name,
                is_ad: p.is_ad,
                content_type: p.content_type,
              })),
              GEMINI_API_KEY,
            );
            if (__DEV__ && analysisData) {
              const polCount = analysisData.feed_items.filter(
                (item: any) => item.political?.is_political
              ).length;
              console.log('[ScannerScreen] Classification complete:', polCount, 'political posts,',
                analysisData.feed_items.length, 'total analyzed');
            }
          } catch (classifyError) {
            // Non-fatal — save scan without AI analysis
            if (__DEV__) {
              console.warn('[ScannerScreen] Text classification failed (non-fatal):', classifyError);
            }
          }
        }

        // Save to Supabase
        try {
          await supabase.from('scans').insert({
            user_id: user.id,
            platform: result.platform.toLowerCase(),
            post_count: posts.length,
            ad_count: adCount,
            ad_percentage: adPercentage,
            suggested_count: effectiveSuggested,
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
                ...(p.metadata ? { metadata: p.metadata } : {}),
              })),
              top_creators: result.topCreators,
              scanned_at: result.scannedAt,
              duration_seconds: elapsedSecs,
              // H-08/A-03: Flag scans with potential classification errors
              ...(classificationWarning ? { classification_warning: true } : {}),
              // PIPELINE FIX (C-04, H-02): Include AI analysis data so
              // computeDashboardData can read political + tone classifications
              ...(analysisData ? { analysis: analysisData } : {}),
            },
            created_at: new Date().toISOString(),
          });
          // Record scan date for notification scheduling
          await recordScanDate();

          // Also fire-and-forget backend enrichment as a fallback
          authenticatedFetch('/api/scan/analyze', {
            method: 'POST',
            body: JSON.stringify({
              user_id: user.id,
              platform: result.platform.toLowerCase(),
              post_count: posts.length,
            }),
          }).catch((analysisError) => {
            // Non-blocking — we already have client-side analysis
            if (__DEV__) {
              console.warn('Backend AI analysis request failed (non-blocking):', analysisError);
            }
          });
        } catch (dbError) {
          if (__DEV__) {
            console.warn('Could not save scan to database:', dbError);
          }
          // Save locally as backup so data isn't lost
          try {
            const backupKey = `@alg_scan_backup_${Date.now()}`;
            await AsyncStorage.setItem(backupKey, JSON.stringify({
              user_id: user.id,
              platform: result.platform.toLowerCase(),
              post_count: posts.length,
              ad_count: adCount,
              ad_percentage: adPercentage,
              suggested_count: effectiveSuggested,
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
                top_creators: result.topCreators,
                scanned_at: result.scannedAt,
                duration_seconds: elapsedSecs,
                ...(analysisData ? { analysis: analysisData } : {}),
              },
              created_at: new Date().toISOString(),
            }));
          } catch (backupError) {
            if (__DEV__) {
              console.warn('Local backup also failed:', backupError);
            }
          }

          // Show user-friendly error — data is saved locally
          setSaving(false);
          Alert.alert(
            'Saved Locally',
            'Your scan was saved to your device but could not upload to the cloud. It will sync automatically next time you open the app.',
            [{ text: 'OK' }]
          );

          // Still show success screen since data is preserved
          setSavedPostCount(posts.length);
          setSavedAdPct(adPercentage);
          setSavedSuggestedPct(suggestedPercentage);
          setShowSuccess(true);
          Animated.spring(successAnim, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }).start();
          return;
        }

        // Show success screen instead of Alert
        setSaving(false);
        setShowSuccess(true);
        Animated.spring(successAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        if (__DEV__) {
          console.error('Error completing scan:', error);
        }
        setSaving(false);
        Alert.alert(
          'Scan captured',
          'We captured your feed data but had trouble saving. You can try scanning again.',
          [{ text: 'Go Back', onPress: () => router.replace('/(tabs)') }]
        );
      }
    },
    [user?.id, elapsedSecs, successAnim]
  );

  const handleCancel = () => {
    // Check if thresholds are met — if not, show a more specific warning
    const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const postCount = scannerRef.current ? 0 : 0; // Post count is tracked in WebViewScanner
    // We can't easily access the post count here, so always show the threshold warning
    // during active scanning when time hasn't been met
    const timeMet = currentElapsed >= MIN_SCAN_DURATION_SECS;

    if (!timeMet && scanStatus === 'scanning') {
      Alert.alert(
        "Your scan doesn't have enough data yet",
        `Scans need at least ${MIN_POSTS_REQUIRED} posts and ${Math.floor(MIN_SCAN_DURATION_SECS / 60)} minute${MIN_SCAN_DURATION_SECS >= 120 ? 's' : ''} of scrolling for accurate analysis. Keep scrolling?`,
        [
          { text: 'Keep Scanning', style: 'cancel' },
          {
            text: 'Discard & Exit',
            style: 'destructive',
            onPress: () => {
              if (timerRef.current) clearInterval(timerRef.current);
              router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert('Cancel scan?', 'Your progress will be lost.', [
        { text: 'Keep scanning', style: 'cancel' },
        {
          text: 'Discard Scan',
          style: 'destructive',
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            router.back();
          },
        },
      ]);
    }
  };

  // Success screen — smooth transition instead of Alert
  if (showSuccess) {
    const scale = successAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
        <Animated.View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
          opacity: successAnim,
          transform: [{ scale }],
        }}>
          {/* L-12 FIX: Success icon uses brand blue instead of green */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primaryBlue,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            ...shadows.hero,
          }}>
            <Check size={40} color={colors.white} strokeWidth={2.5} />
          </View>

          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.textMain,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Scan Complete
          </Text>

          <Text style={{
            fontSize: 15,
            color: colors.textMuted,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Your {platformName} feed has been analyzed
          </Text>
          {/* L-10 FIX: Add insight sentence to fill white space */}
          <Text style={{
            fontSize: 13,
            color: colors.textTertiary,
            textAlign: 'center',
            marginBottom: 24,
          }}>
            Here's a quick snapshot of what we captured
          </Text>

          {/* Warn if metrics look like detection failure (H-08/A-03) */}
          {((savedAdPct === 0 && savedSuggestedPct === 0 && savedPostCount > 0) ||
            (savedSuggestedPct === 0 && savedPostCount > 5 && platformStr !== 'reddit')) && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.lowSampleBg,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              marginBottom: 16,
              gap: 8,
            }}>
              <AlertTriangle size={16} color={colors.warning} strokeWidth={2} />
              <Text style={{ fontSize: 13, color: colors.warning, flex: 1 }}>
                {savedSuggestedPct === 0 && savedAdPct > 0
                  ? `0% suggested content detected across ${savedPostCount} posts. This may indicate a classification issue — your dashboard data for this scan may be incomplete.`
                  : `We couldn't detect ads or suggested content. ${platformName} may have updated their layout.`}
              </Text>
            </View>
          )}

          {/* Quick stats — Apple Health summary style */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            paddingVertical: SPACING.xl,
            marginBottom: 40,
            width: '100%',
          }}>
            {[
              { value: String(savedPostCount), label: 'Posts' },
              { value: `${savedAdPct}%`, label: 'Ads' },
              { value: `${savedSuggestedPct}%`, label: 'Suggested' },
            ].map((stat) => (
              <View key={stat.label} style={{ alignItems: 'center' }}>
                <Text
                  style={{ ...TYPOGRAPHY.h1, color: colors.primaryBlue }}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {stat.value}
                </Text>
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textSecondary, marginTop: SPACING.xs }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* View Dashboard button — L-07 FIX: Always tappable, timeout spinner after 5s */}
          <TouchableOpacity
            onPress={async () => {
              if (!navigatingToDashboard) {
                setNavigatingToDashboard(true);
                // L-07: Set a 5-second timeout — if still loading, hide spinner
                setTimeout(() => setNavigatingToDashboard(false), 5000);
              }
              // Always navigate, even if already "loading" — let the dashboard load in place
              await new Promise(resolve => setTimeout(resolve, 300));
              router.replace('/(tabs)/dashboard');
            }}
            activeOpacity={0.7}
            style={{
              backgroundColor: colors.primaryBlue,
              borderRadius: RADIUS.md,
              paddingHorizontal: 32,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              ...shadows.medium,
            }}
          >
            {navigatingToDashboard ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <ChartBar size={18} color={colors.white} strokeWidth={2} />
            )}
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.white }}>
              {navigatingToDashboard ? 'Loading Dashboard...' : 'View Your Dashboard'}
            </Text>
          </TouchableOpacity>

          {/* M-17 FIX: "Scan Another Platform" as proper outline button */}
          <View style={{ gap: 12, marginTop: 16, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/scan')}
              accessibilityRole="button"
              accessibilityLabel="Scan Another Platform"
              style={{
                borderWidth: 1,
                borderColor: colors.primaryBlue,
                borderRadius: RADIUS.md,
                paddingVertical: SPACING.md,
                paddingHorizontal: SPACING['2xl'],
                alignItems: 'center',
                minWidth: 200,
              }}
            >
              <Text style={{ ...TYPOGRAPHY.buttonMd, color: colors.primaryBlue }}>
                Scan Another Platform
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              accessibilityLabel="Go Home"
              style={{
                paddingVertical: SPACING.sm,
                paddingHorizontal: SPACING.xl,
              }}
            >
              <Text style={{ ...TYPOGRAPHY.label, color: colors.textSecondary }}>
                Go Home
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.bgCard,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSlate200,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Back button for in-WebView navigation */}
        <TouchableOpacity
          onPress={() => {
            scannerRef.current?.goBack();
          }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <ChevronLeft size={20} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.textMain,
            marginBottom: 2,
          }} accessibilityRole="header">
            {platformName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {scanStatus === 'scanning' && (
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primaryBlue,
              }} />
            )}
            <Text style={{
              fontSize: 13,
              color: scanStatus === 'scanning' ? colors.primaryBlue : colors.textSecondary,
              fontWeight: '500',
            }}>
              {/* M-10 FIX: Use platformName (correctly capitalized) in loading text */}
              {scanStatus === 'loading'
                ? `Loading ${platformName}...`
                : scanStatus === 'scanning'
                  ? `Scanning ${formatTime(elapsedSecs)}`
                  : 'Done'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleCancel}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Cancel scan"
          style={{
            width: 36,
            height: 36,
            minHeight: 44,
            minWidth: 44,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
            backgroundColor: colors.cancelButtonBg,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryBlue} />
          ) : (
            <X size={18} color={colors.textMuted} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      {/* WebView Scanner */}
      <View style={{ flex: 1 }}>
        <WebViewScanner
          ref={scannerRef}
          platform={platformStr}
          onScanComplete={handleScanComplete}
          onScanStatusChange={(status) => setScanStatus(status)}
        />
      </View>

      {/* Saving overlay */}
      {saving && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.savingOverlayBg,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
        }}>
          <View style={{
            backgroundColor: colors.bgCard,
            borderRadius: RADIUS.xl,
            paddingHorizontal: 32,
            paddingVertical: 24,
            alignItems: 'center',
            ...shadows.hero,
          }}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.textMain,
              marginTop: 16,
            }}>
              Saving your scan...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
