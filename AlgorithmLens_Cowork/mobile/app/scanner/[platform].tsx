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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RADIUS, SPACING } from '../../src/lib/theme';
import { X, Check, ChartBar, AlertTriangle, ChevronLeft } from 'lucide-react-native';
import { MIN_POSTS_GOOD, MIN_POSTS_OK } from '../../src/config/thresholds';
import { recordScanDate } from '../../src/services/notifications';

const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  reddit: 'Reddit',
};

// Uses centralized thresholds from config/thresholds.ts
function getScanQuality(postCount: number, colors: any): { label: string; color: string; message: string } {
  if (postCount >= MIN_POSTS_GOOD) {
    return {
      label: 'Good sample',
      color: colors.accentGreen,
      message: `${postCount} posts captured — enough for meaningful analysis`,
    };
  } else if (postCount >= MIN_POSTS_OK) {
    return {
      label: 'Okay sample',
      color: colors.warning,
      message: `${postCount} posts — scroll more for better accuracy`,
    };
  } else {
    return {
      label: 'Keep scrolling',
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
        const suggestedCount = posts.filter((p) => p.is_suggested).length;
        const adPercentage =
          posts.length > 0 ? Math.round((adCount / posts.length) * 100) : 0;
        const suggestedPercentage =
          posts.length > 0
            ? Math.round((suggestedCount / posts.length) * 100)
            : 0;

        // Save stats for success screen
        setSavedPostCount(posts.length);
        setSavedAdPct(adPercentage);
        setSavedSuggestedPct(suggestedPercentage);

        // Save to Supabase
        try {
          await supabase.from('scans').insert({
            user_id: user.id,
            platform: result.platform.toLowerCase(),
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
              top_creators: result.topCreators,
              scanned_at: result.scannedAt,
              duration_seconds: elapsedSecs,
            },
            created_at: new Date().toISOString(),
          });
          // Record scan date for notification scheduling
          await recordScanDate();

          // Fire-and-forget: trigger AI analysis (same pipeline as Chrome extension)
          authenticatedFetch('/api/scan/analyze', {
            method: 'POST',
            body: JSON.stringify({
              user_id: user.id,
              platform: result.platform.toLowerCase(),
              post_count: posts.length,
            }),
          }).catch((analysisError) => {
            // Non-blocking — dashboard will still show raw stats
            if (__DEV__) {
              console.warn('AI analysis request failed (non-blocking):', analysisError);
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
                top_creators: result.topCreators,
                scanned_at: result.scannedAt,
                duration_seconds: elapsedSecs,
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
          {/* Success icon */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.accentGreen,
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
            marginBottom: 32,
          }}>
            Your {platformName} feed has been analyzed
          </Text>

          {/* Warn if metrics look like detection failure */}
          {savedAdPct === 0 && savedSuggestedPct === 0 && savedPostCount > 0 && (
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
                We couldn't detect ads or suggested content. {platformName} may have updated their layout.
              </Text>
            </View>
          )}

          {/* Quick stats */}
          <View style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 40,
          }}>
            <View style={{
              flex: 1,
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              alignItems: 'center',
              ...shadows.card,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primaryBlue }}>
                {savedPostCount}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                Posts
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              alignItems: 'center',
              ...shadows.card,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primaryBlue }}>
                {savedAdPct}%
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                Ads
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              alignItems: 'center',
              ...shadows.card,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.blue700 }}>
                {savedSuggestedPct}%
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                Suggested
              </Text>
            </View>
          </View>

          {/* View Dashboard button */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
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
            <ChartBar size={18} color={colors.white} strokeWidth={2} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.white }}>
              View Your Dashboard
            </Text>
          </TouchableOpacity>

          {/* Scan another link */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/scan')}
            style={{ marginTop: 16, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 14, color: colors.primaryBlue, fontWeight: '500' }}>
              Scan another platform
            </Text>
          </TouchableOpacity>
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
                backgroundColor: colors.accentGreen,
              }} />
            )}
            <Text style={{
              fontSize: 13,
              color: scanStatus === 'scanning' ? colors.accentGreen : colors.textSecondary,
              fontWeight: '500',
            }}>
              {scanStatus === 'loading'
                ? 'Loading...'
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
