import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import RNAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing as REasing,
} from 'react-native-reanimated';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { WebViewScanner, ScanResult, WebViewScannerHandle } from '../../src/components/scanner/WebViewScanner';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { supabase } from '../../src/lib/supabase';
import { authenticatedFetch } from '../../src/lib/api';
import { classifyPostTexts } from '../../src/lib/analysis/textClassificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GL_TYPOGRAPHY } from '../../src/lib/gluestackTheme';
import { RADIUS, SPACING, MIN_TOUCH_TARGET } from '../../src/lib/theme';
import { X, Check, ChartBar, AlertTriangle, ChevronLeft } from 'lucide-react-native';
import { Text } from '../../src/components/glue';
import { MIN_POSTS_GOOD, MIN_POSTS_OK, MIN_POSTS_REQUIRED, MIN_SCAN_DURATION_SECS } from '../../src/config/thresholds';
import { recordScanDate } from '../../src/services/notifications';
import { ALScoreGauge } from '../../src/components/charts';
import { ALPieChart } from '../../src/components/charts';

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
      message: `${postCount} posts captured, detailed insights available`,
    };
  } else if (postCount >= 30) {
    return {
      label: 'Good sample',
      color: colors.accentGreen,
      message: `${postCount} posts captured, enough for meaningful analysis`,
    };
  } else if (postCount >= MIN_POSTS_GOOD) {
    return {
      label: 'Fair sample',
      color: colors.warning,
      message: `${postCount} posts captured, more posts = richer insights`,
    };
  } else if (postCount >= MIN_POSTS_OK) {
    return {
      label: 'Low sample',
      color: colors.warning,
      message: `${postCount} posts, aim for ${MIN_POSTS_GOOD}+ for better accuracy`,
    };
  } else {
    return {
      label: 'Very low sample',
      color: colors.error,
      message: `Only ${postCount} posts, need at least ${MIN_POSTS_OK} for basic analysis`,
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
  const resultsSheetRef = useRef<BottomSheet>(null);

  // Progress bar animation
  const progressWidth = useSharedValue(0);

  // Bottom sheet snap points
  const snapPoints = ['12%', '50%', '90%'];

  // Live timer — single source of truth from startTimeRef
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Progress bar animation
  useEffect(() => {
    if (scanStatus === 'loading') {
      // Animate from 0% to 80% over 3 seconds
      progressWidth.value = withTiming(0.8, {
        duration: 3000,
        easing: REasing.out(REasing.quad),
      });
    } else if (scanStatus === 'scanning') {
      // Snap to 100% over 300ms
      progressWidth.value = withTiming(1, {
        duration: 300,
        easing: REasing.out(REasing.quad),
      });
    } else {
      // Hide progress bar
      progressWidth.value = withTiming(0, {
        duration: 200,
        easing: REasing.out(REasing.quad),
      });
    }
  }, [scanStatus]);

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
            ', possible classification error'
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
          // Race the insert against a timeout so a hung connection doesn't
          // leave the user staring at the "Saving your scan..." spinner forever.
          // Mirrors broadcastAnalysisPipeline.persistScan() which uses the same 15s budget.
          const insertPromise = supabase.from('scans').insert({
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
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Supabase insert timed out after 15 seconds')), 15000)
          );
          await Promise.race([insertPromise, timeoutPromise]);
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
          // Expand bottom sheet to half-screen (index 1 = 50%)
          setTimeout(() => {
            resultsSheetRef.current?.snapToIndex(1);
          }, 100);
          return;
        }

        // Show success screen (expand bottom sheet) instead of Alert
        setSaving(false);
        setShowSuccess(true);
        // Expand bottom sheet to half-screen (index 1 = 50%)
        setTimeout(() => {
          resultsSheetRef.current?.snapToIndex(1);
        }, 100);
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


  // Animated style for progress bar
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      {/* Header with cleaner minimal toolbar */}
      <View
        style={{
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.sm,
          backgroundColor: colors.bgCard,
          opacity: 0.98,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...shadows.sm,
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
            borderRadius: RADIUS.md,
            marginRight: SPACING.sm,
            backgroundColor: colors.bgSecondary,
          }}
        >
          <ChevronLeft size={20} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            variant="h3"
            color={colors.textMain}
            style={{ marginBottom: SPACING.xxs }}
            accessibilityRole="header"
          >
            {platformName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            {scanStatus === 'scanning' && (
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primaryBlue,
              }} />
            )}
            <Text
              variant="caption"
              color={scanStatus === 'scanning' ? colors.primaryBlue : colors.textSecondary}
              style={{ fontWeight: '500' }}
            >
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
            minHeight: MIN_TOUCH_TARGET,
            minWidth: MIN_TOUCH_TARGET,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: RADIUS.sm,
            backgroundColor: 'transparent',
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryBlue} />
          ) : (
            <X size={18} color={colors.textMuted} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      {/* Smooth loading progress bar */}
      <RNAnimated.View
        style={[
          {
            height: 3,
            backgroundColor: colors.primaryBlue,
            width: '100%',
            overflow: 'hidden',
          },
          progressAnimatedStyle,
        ]}
      />

      {/* WebView Scanner */}
      <View style={{ flex: 1 }}>
        <WebViewScanner
          ref={scannerRef}
          platform={platformStr}
          onScanComplete={handleScanComplete}
          onScanStatusChange={(status) => setScanStatus(status)}
        />
      </View>

      {/* Bottom Sheet Results Overlay */}
      {showSuccess && (
        <BottomSheet
          ref={resultsSheetRef}
          snapPoints={snapPoints}
          animationConfigs={{
            damping: 50,
            stiffness: 500,
          }}
          enablePanDownToClose={false}
          backgroundStyle={{ backgroundColor: colors.bgCard }}
          handleIndicatorStyle={{ backgroundColor: colors.borderSlate300 }}
        >
          <BottomSheetView style={{ flex: 1 }}>
            {/* Collapsed state (12%) — Summary line visible at bottom */}
            <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md }}>
              <Text
                variant="caption"
                color={colors.textSecondary}
              >
                Scan complete, pull up for results
              </Text>
            </View>

            {/* Half state (50%) + Full state (90%) content */}
            <ScrollView
              scrollEventThrottle={16}
              style={{ flex: 1, paddingHorizontal: SPACING.lg }}
              showsVerticalScrollIndicator={false}
            >
              {/* Success icon + heading */}
              <View style={{ alignItems: 'center', marginBottom: SPACING['2xl'] }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: RADIUS.full,
                  backgroundColor: colors.primaryBlue,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: SPACING.lg,
                  ...shadows.hero,
                }}>
                  <Check size={32} color={colors.white} strokeWidth={2.5} />
                </View>

                <Text
                  variant="h2"
                  color={colors.textMain}
                  align="center"
                  style={{ marginBottom: SPACING.xs }}
                >
                  Scan Complete
                </Text>

                <Text
                  variant="body"
                  color={colors.textMuted}
                  align="center"
                  style={{ marginBottom: SPACING.sm }}
                >
                  Your {platformName} feed has been analyzed
                </Text>
              </View>

              {/* Warn if metrics look like detection failure (H-08/A-03) */}
              {((savedAdPct === 0 && savedSuggestedPct === 0 && savedPostCount > 0) ||
                (savedSuggestedPct === 0 && savedPostCount > 5 && platformStr !== 'reddit')) && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.lowSampleBg,
                  borderRadius: RADIUS.md,
                  padding: SPACING.md,
                  marginBottom: SPACING.lg,
                  gap: SPACING.sm,
                }}>
                  <AlertTriangle size={16} color={colors.warning} strokeWidth={2} />
                  <Text
                    variant="caption"
                    color={colors.warning}
                    style={{ flex: 1 }}
                  >
                    {savedSuggestedPct === 0 && savedAdPct > 0
                      ? `0% suggested content detected across ${savedPostCount} posts. This may indicate a classification issue, your dashboard data for this scan may be incomplete.`
                      : `We couldn't detect ads or suggested content. ${platformName} may have updated their layout.`}
                  </Text>
                </View>
              )}

              {/* Quick stats — Apple Health summary style */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                paddingVertical: SPACING.lg,
                marginBottom: SPACING['2xl'],
                width: '100%',
              }}>
                {[
                  { value: String(savedPostCount), label: 'Posts' },
                  { value: `${savedAdPct}%`, label: 'Ads' },
                  { value: `${savedSuggestedPct}%`, label: 'Suggested' },
                ].map((stat) => (
                  <View key={stat.label} style={{ alignItems: 'center' }}>
                    <Text
                      variant="h1"
                      color={colors.primaryBlue}
                      style={{ adjustFontSizeToFit: true, numberOfLines: 1 }}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      variant="caption"
                      color={colors.textSecondary}
                      style={{ marginTop: SPACING.xs }}
                    >
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Feed quality score gauge (only if we have data) */}
              {savedPostCount > 0 && (
                <View style={{ marginBottom: SPACING['2xl'] }}>
                  <Text
                    variant="labelBold"
                    color={colors.textMain}
                    style={{ marginBottom: SPACING.md }}
                  >
                    Feed Quality
                  </Text>
                  <ALScoreGauge
                    score={Math.min(Math.round((savedPostCount / 50) * 100), 100)}
                    maxScore={100}
                    colors={colors}
                  />
                </View>
              )}

              {/* Content breakdown pie chart (optional) */}
              {savedPostCount > 0 && (
                <View style={{ marginBottom: SPACING['2xl'] }}>
                  <Text
                    variant="labelBold"
                    color={colors.textMain}
                    style={{ marginBottom: SPACING.md }}
                  >
                    Content Breakdown
                  </Text>
                  <ALPieChart
                    data={[
                      { label: 'Suggested', value: savedSuggestedPct, color: colors.primaryBlue },
                      { label: 'Followed', value: 100 - savedSuggestedPct - savedAdPct, color: colors.accentGreen },
                      { label: 'Ads', value: savedAdPct, color: colors.warning },
                    ]}
                    colors={colors}
                  />
                </View>
              )}

              {/* 6 dimensions tabs placeholder (for future expansion) */}
              <View style={{ marginBottom: SPACING['2xl'] }}>
                <Text
                  variant="labelBold"
                  color={colors.textMain}
                  style={{ marginBottom: SPACING.md }}
                >
                  Analysis Dimensions
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                  {['Overview', 'Sources', 'Ads', 'Politics', 'Tone', 'Suggested vs. Followed'].map((tab) => (
                    <View
                      key={tab}
                      style={{
                        paddingHorizontal: SPACING.md,
                        paddingVertical: SPACING.sm,
                        borderRadius: RADIUS.md,
                        backgroundColor: colors.bgSecondary,
                        borderWidth: 1,
                        borderColor: colors.borderSlate300,
                      }}
                    >
                      <Text
                        variant="caption"
                        color={colors.textSecondary}
                      >
                        {tab}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* View Dashboard button — L-07 FIX: Always tappable, timeout spinner after 5s */}
              <TouchableOpacity
                disabled={navigatingToDashboard}
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
                accessibilityRole="button"
                accessibilityLabel={navigatingToDashboard ? 'Loading dashboard' : 'View your dashboard'}
                style={{
                  backgroundColor: colors.primaryBlue,
                  borderRadius: RADIUS.md,
                  paddingHorizontal: SPACING['3xl'],
                  paddingVertical: SPACING.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: SPACING.sm,
                  opacity: navigatingToDashboard ? 0.5 : 1,
                  ...shadows.medium,
                }}
              >
                {navigatingToDashboard ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <ChartBar size={18} color={colors.white} strokeWidth={2} />
                )}
                <Text
                  variant="buttonLg"
                  color={colors.white}
                >
                  {navigatingToDashboard ? 'Loading Dashboard...' : 'View Your Dashboard'}
                </Text>
              </TouchableOpacity>

              {/* M-17 FIX: "Scan Another Platform" as proper outline button */}
              <View style={{ gap: SPACING.md, marginTop: SPACING.lg, alignItems: 'center', paddingBottom: SPACING['3xl'] }}>
                <TouchableOpacity
                  onPress={() => router.replace('/scan')}
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
                  <Text
                    variant="buttonMd"
                    color={colors.primaryBlue}
                  >
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
                  <Text
                    variant="label"
                    color={colors.textSecondary}
                  >
                    Go Home
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>
      )}

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
            borderRadius: RADIUS.full,
            paddingHorizontal: SPACING['3xl'],
            paddingVertical: SPACING['2xl'],
            alignItems: 'center',
            ...shadows.hero,
          }}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text
              variant="labelBold"
              color={colors.textMain}
              style={{ marginTop: SPACING.lg }}
            >
              Saving your scan...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
