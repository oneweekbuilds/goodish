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
import { WebViewScanner, ScanResult } from '../../src/components/scanner/WebViewScanner';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../src/lib/theme';
import { X, Check, ChartBar, AlertTriangle } from 'lucide-react-native';

const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  reddit: 'Reddit',
};

// Quality thresholds
const MIN_POSTS_GOOD = 20;
const MIN_POSTS_OK = 10;

function getScanQuality(postCount: number): { label: string; color: string; message: string } {
  if (postCount >= MIN_POSTS_GOOD) {
    return {
      label: 'Good sample',
      color: COLORS.accentGreen,
      message: `${postCount} posts captured — enough for meaningful analysis`,
    };
  } else if (postCount >= MIN_POSTS_OK) {
    return {
      label: 'Okay sample',
      color: COLORS.warning,
      message: `${postCount} posts — scroll more for better accuracy`,
    };
  } else {
    return {
      label: 'Keep scrolling',
      color: COLORS.error,
      message: `Only ${postCount} posts — need at least 10 for basic analysis`,
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
  const platformStr = typeof platform === 'string' ? platform : '';
  const platformName = PLATFORM_NAMES[platformStr] || platformStr;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  // Live timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSecs((prev) => prev + 1);
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
          // Success feedback: scan saved successfully (shown in success screen)
        } catch (dbError) {
          console.warn('Could not save scan to database:', dbError);
          // Show user-visible error about database save failure
          setSaving(false);
          Alert.alert(
            'Save Error',
            'Your scan was captured but could not be saved to your dashboard. Please try again or contact support if the problem persists.',
            [{ text: 'OK' }]
          );
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
        console.error('Error completing scan:', error);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgPage }}>
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
            backgroundColor: COLORS.accentGreen,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            ...SHADOWS.hero,
          }}>
            <Check size={40} color="#FFFFFF" strokeWidth={2.5} />
          </View>

          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: COLORS.textMain,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Scan Complete
          </Text>

          <Text style={{
            fontSize: 15,
            color: COLORS.textMuted,
            textAlign: 'center',
            marginBottom: 32,
          }}>
            Your {platformName} feed has been analyzed
          </Text>

          {/* Quick stats */}
          <View style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 40,
          }}>
            <View style={{
              flex: 1,
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              alignItems: 'center',
              ...SHADOWS.card,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.primaryBlue }}>
                {savedPostCount}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                Posts
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              alignItems: 'center',
              ...SHADOWS.card,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.primaryBlue }}>
                {savedAdPct}%
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                Ads
              </Text>
            </View>
            <View style={{
              flex: 1,
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              alignItems: 'center',
              ...SHADOWS.card,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.blue700 }}>
                {savedSuggestedPct}%
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                Suggested
              </Text>
            </View>
          </View>

          {/* View Dashboard button */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={{
              backgroundColor: COLORS.primaryBlue,
              borderRadius: RADIUS.md,
              paddingHorizontal: 32,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              ...SHADOWS.medium,
            }}
          >
            <ChartBar size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
              View Your Dashboard
            </Text>
          </TouchableOpacity>

          {/* Scan another link */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/scan')}
            style={{ marginTop: 16, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 14, color: COLORS.primaryBlue, fontWeight: '500' }}>
              Scan another platform
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgPage }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: COLORS.bgCard,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderSlate200,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: COLORS.textMain,
            marginBottom: 2,
          }}>
            {platformName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {scanStatus === 'scanning' && (
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: COLORS.accentGreen,
              }} />
            )}
            <Text style={{
              fontSize: 13,
              color: scanStatus === 'scanning' ? COLORS.accentGreen : COLORS.textSecondary,
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
          style={{
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
            backgroundColor: '#F3F4F6',
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.primaryBlue} />
          ) : (
            <X size={18} color={COLORS.textMuted} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      {/* WebView Scanner */}
      <View style={{ flex: 1 }}>
        <WebViewScanner
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
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
        }}>
          <View style={{
            backgroundColor: COLORS.bgCard,
            borderRadius: RADIUS.xl,
            paddingHorizontal: 32,
            paddingVertical: 24,
            alignItems: 'center',
            ...SHADOWS.hero,
          }}>
            <ActivityIndicator size="large" color={COLORS.primaryBlue} />
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: COLORS.textMain,
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
