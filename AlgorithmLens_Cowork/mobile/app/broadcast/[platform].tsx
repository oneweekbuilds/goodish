/**
 * Broadcast Session Screen — Full-screen broadcast capture flow.
 *
 * This route is navigated to when the user selects a platform and
 * chooses Broadcast mode from the Home screen's PlatformPicker.
 *
 * Flow:
 * 1. Screen opens → session initializes → shared container prepared
 * 2. BroadcastPickerButton renders → user taps to start recording
 * 3. Status transitions: AWAITING → RECORDING → user scrolls their feed
 * 4. User returns to AlgorithmLens → sees live recording stats
 * 5. User taps "Stop" or broadcast ends → COMPLETE
 * 6. "View Results" navigates to the processing/dashboard flow
 *
 * The screen adapts its content based on the BroadcastStatus,
 * using the BroadcastOverlay component for each state.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import Constants from 'expo-constants';

// Cleanup delay for broadcast session (ms)
const BROADCAST_CLEANUP_DELAY_MS = 2000;
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Radio, Shield } from 'lucide-react-native';
import { triggerNotificationWarning, triggerImpactMedium } from '../../src/lib/haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { GL_TYPOGRAPHY } from '../../src/lib/gluestackTheme';
import { SPACING, RADIUS, PLATFORMS, ICON_SIZES } from '../../src/lib/theme';
import { Text } from '../../src/components/glue';
import { MIN_FRAMES_REQUIRED, MIN_SCAN_DURATION_SECS } from '../../src/config/thresholds';
import { useBroadcast } from '../../src/hooks/useBroadcast';
import { BroadcastOverlay } from '../../src/components/broadcast/BroadcastOverlay';
import { BroadcastPickerButton } from '../../src/components/broadcast/BroadcastPickerButton';
import {
  NativeBroadcastPicker,
  triggerBroadcastPicker,
} from '../../src/components/broadcast/NativeBroadcastPicker';
import { PLATFORM_BROADCAST_CONFIGS } from '../../src/types/broadcast';
import type { SupportedPlatform } from '../../src/types/broadcast';
import { storeAnalysisData } from '../../src/lib/analysis/analysisDataStore';

export default function BroadcastScreen() {
  const { platform, autostart, source } = useLocalSearchParams<{
    platform: string;
    autostart?: string;
    source?: string;
  }>();
  const { colors, shadows } = useTheme();
  const broadcast = useBroadcast();

  // Safety guard: If running in Expo Go, redirect back immediately.
  // ReplayKit requires native modules only available in development builds.
  useEffect(() => {
    if (Constants.appOwnership === 'expo') {
      Alert.alert(
        'Development Build Required',
        'Screen Capture requires the AlgorithmLens development build. Use Quick Scan instead.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/') }]
      );
    }
  }, []);

  // Detect if this screen was launched from an iOS Shortcut
  const isFromShortcut = source === 'shortcut';
  const shouldAutoStart = autostart === '1';

  // Validate platform parameter against known platforms
  const validPlatforms = Object.keys(PLATFORM_BROADCAST_CONFIGS);
  const platformKey = (
    platform && validPlatforms.includes(platform) ? platform : 'instagram'
  ) as SupportedPlatform;
  const platformConfig = PLATFORM_BROADCAST_CONFIGS[platformKey];
  const platformName = platformConfig.display_name;
  const platformBrandColor = PLATFORMS[platformKey as keyof typeof PLATFORMS]?.color || colors.primaryBlue;

  // Initialize session on mount
  useEffect(() => {
    if (broadcast.status === 'IDLE') {
      broadcast.startSession(platformKey);
    }

    return () => {
      // Cleanup on unmount if session is still active
      if (broadcast.isRecording) {
        broadcast.stopSession();
      }
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── iOS Shortcuts: auto-start broadcast + clear pending shortcut data ──
  const shortcutConsumed = useRef(false);
  useEffect(() => {
    if (isFromShortcut && !shortcutConsumed.current && broadcast.status === 'AWAITING_BROADCAST_START') {
      shortcutConsumed.current = true;

      // Clear pending shortcut from UserDefaults so re-opens don't retrigger
      if (Platform.OS === 'ios') {
        try {
          const { requireNativeModule } = require('expo-modules-core');
          const shortcuts = requireNativeModule('ExpoShortcuts');
          shortcuts.clearPendingShortcut();
        } catch {
          // Non-critical
        }
      }

      // On Android, we can programmatically request screen capture.
      // On iOS, the BroadcastPickerButton is system-controlled (RPSystemBroadcastPickerView)
      // and cannot be triggered programmatically — user taps the picker button.
      if (shouldAutoStart && Platform.OS === 'android') {
        broadcast.requestScreenCapture().catch(() => {
          // Permission denied — user will see the manual button
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcast.status]);

  // Record last platform for Quick Scan shortcut
  useEffect(() => {
    if (Platform.OS === 'ios') {
      try {
        const { requireNativeModule } = require('expo-modules-core');
        const shortcuts = requireNativeModule('ExpoShortcuts');
        shortcuts.setLastPlatform(platformKey);
      } catch {
        // Shortcuts module not available
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformKey]);

  // Handle Android back button during recording
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (broadcast.isRecording) {
        handleBackDuringRecording();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [broadcast.isRecording]);

  const handleBackDuringRecording = useCallback(() => {
    const framesMet = broadcast.frameCount >= MIN_FRAMES_REQUIRED;
    const timeMet = broadcast.elapsedSeconds >= MIN_SCAN_DURATION_SECS;

    if (!framesMet || !timeMet) {
      Alert.alert(
        "Your scan doesn't have enough data yet",
        `Scans need at least ${MIN_FRAMES_REQUIRED} frames and ${Math.floor(MIN_SCAN_DURATION_SECS / 60)} minute of recording for accurate analysis. Keep recording?`,
        [
          { text: 'Keep Recording', style: 'cancel' },
          {
            text: 'Discard & Exit',
            style: 'destructive',
            onPress: async () => {
              await broadcast.cancelSession();
              router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Recording in progress',
        'Would you like to stop the broadcast and go back?',
        [
          { text: 'Keep Recording', style: 'cancel' },
          {
            text: 'Stop & Go Back',
            style: 'destructive',
            onPress: async () => {
              await broadcast.cancelSession();
              router.back();
            },
          },
        ]
      );
    }
  }, [broadcast]);

  const handleBack = useCallback(() => {
    if (broadcast.isRecording) {
      handleBackDuringRecording();
    } else {
      if (broadcast.isComplete) {
        broadcast.cleanup();
      }
      router.back();
    }
  }, [broadcast, handleBackDuringRecording]);

  const handleOpenPlatform = useCallback(async () => {
    const success = await broadcast.openPlatformApp(platformKey);
    if (!success) {
      Alert.alert(
        `${platformName} not installed`,
        `Make sure ${platformName} is installed on your device, then try again.`
      );
    }
  }, [broadcast, platformKey, platformName]);

  const handleStop = useCallback(async () => {
    const framesMet = broadcast.frameCount >= MIN_FRAMES_REQUIRED;
    const timeMet = broadcast.elapsedSeconds >= MIN_SCAN_DURATION_SECS;

    if (!framesMet || !timeMet) {
      // Thresholds not met — warn user
      triggerNotificationWarning();
      const needs: string[] = [];
      if (!framesMet) needs.push(`${MIN_FRAMES_REQUIRED - broadcast.frameCount} more frames`);
      if (!timeMet) needs.push(`${MIN_SCAN_DURATION_SECS - broadcast.elapsedSeconds}s more recording time`);

      Alert.alert(
        "Your scan doesn't have enough data yet",
        `Need ${needs.join(' and ')} for accurate analysis. Keep recording?`,
        [
          { text: 'Keep Recording', style: 'cancel' },
          {
            text: 'Stop Anyway',
            style: 'destructive',
            onPress: async () => {
              await broadcast.stopSession();
            },
          },
        ]
      );
    } else {
      triggerNotificationWarning();
      Alert.alert(
        'Stop recording?',
        `This will end the broadcast session. ${broadcast.frameCount} frames have been captured so far.`,
        [
          { text: 'Keep Recording', style: 'cancel' },
          {
            text: 'Stop Recording',
            onPress: async () => {
              await broadcast.stopSession();
            },
          },
        ]
      );
    }
  }, [broadcast]);

  const handleViewResults = useCallback(async () => {
    triggerImpactMedium();

    try {
      // Collect captured frames for the analysis pipeline
      const frames = await broadcast.collectFrames();

      if (frames.length === 0) {
        Alert.alert(
          'No frames captured',
          'The recording ended without capturing any frames. This can happen if:\n\n• The recording didn\'t start properly\n• The screen was off during recording\n• The app didn\'t have time to capture\n\nTry again — make sure to scroll your feed for at least 15 seconds after starting.',
          [
            { text: 'Try Again', onPress: handleRetry },
            { text: 'Go Back', onPress: () => router.back(), style: 'cancel' },
          ]
        );
        return;
      }

      // Build capture info for the analysis pipeline
      const captureInfo = broadcast.buildCaptureInfo();
      if (!captureInfo) {
        Alert.alert(
          'Something went wrong',
          'We couldn\'t process the recording data. Please try again.',
          [
            { text: 'Try Again', onPress: handleRetry },
            { text: 'Go Back', onPress: () => router.back(), style: 'cancel' },
          ]
        );
        return;
      }

      // Collect base64 data for all frames (needed by Gemini vision analysis)
      const frameBase64Map: Record<string, string> = {};
      for (const frame of frames) {
        const filename = frame.local_path.split('/').pop() || frame.frame_id;
        const base64 = broadcast.getFrameBase64(filename);
        if (base64) {
          frameBase64Map[filename] = base64;
        }
      }

      // Store large data in memory store (route params have strict size limits)
      const sessionId = broadcast.session?.session_id || Date.now().toString();
      storeAnalysisData({
        sessionId,
        platform: platformKey,
        frames,
        captureInfo,
        frameBase64Map,
        storedAt: Date.now(),
      });

      // Navigate to analysis screen with just the session ID
      router.replace({
        pathname: '/analysis/[sessionId]',
        params: { sessionId },
      });

      // Cleanup broadcast data after a short delay to allow navigation
      setTimeout(() => {
        broadcast.cleanup();
      }, BROADCAST_CLEANUP_DELAY_MS);
    } catch (error) {
      if (__DEV__) {
        console.error('handleViewResults error:', error);
      }
      Alert.alert(
        'Something went wrong',
        'We couldn\'t process the captured frames. Please try recording again.',
        [
          { text: 'Try Again', onPress: handleRetry },
          { text: 'Go Back', onPress: () => router.back(), style: 'cancel' },
        ]
      );
    }
  }, [broadcast, platformKey]);

  const handleRetry = useCallback(async () => {
    await broadcast.cleanup();
    broadcast.startSession(platformKey);
  }, [broadcast, platformKey]);

  const handleCancel = useCallback(async () => {
    await broadcast.cancelSession();
    await broadcast.cleanup();
    router.back();
  }, [broadcast]);

  // C4 FIX: Android screen recording (MediaProjection API) is not yet implemented.
  // Show a friendly message and redirect users to Precision Mode instead.
  if (Platform.OS === 'android') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }}>
          <Radio size={40} color={colors.primaryBlue} strokeWidth={1.5} />
          <Text
            variant="h3"
            color={colors.textMain}
            align="center"
            style={{ marginTop: SPACING.lg, marginBottom: SPACING.md }}
          >
            Coming to Android Soon
          </Text>
          <Text
            variant="body"
            color={colors.textSecondary}
            align="center"
            style={{ marginBottom: SPACING.xl, lineHeight: 22 }}
          >
            Screen recording is coming to Android soon. The iOS version is available now.{'\n\n'}In the meantime, you can use Precision Mode for text-based feed analysis.
          </Text>
          <TouchableOpacity
            onPress={() => {
              router.back();
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back and use Precision Mode"
            style={{
              backgroundColor: colors.primaryBlue,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.md,
              paddingHorizontal: SPACING.xl,
            }}
          >
            <Text
              variant="buttonMd"
              color={colors.textInverse}
            >
              Use Precision Mode
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check broadcast availability
  if (!broadcast.isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }}>
          <Text
            variant="h3"
            color={colors.textMain}
            align="center"
            style={{ marginBottom: SPACING.md }}
          >
            Broadcast not available
          </Text>
          <Text
            variant="body"
            color={colors.textSecondary}
            align="center"
            style={{ marginBottom: SPACING.xl }}
          >
            Screen broadcast requires iOS 12+ and the AlgorithmLens development build. Please ensure you're running the app via a development build (not Expo Go). Use Quick Scan to analyze your feed in the meantime.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              backgroundColor: colors.primaryBlue,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.md,
              paddingHorizontal: SPACING.xl,
            }}
          >
            <Text
              variant="buttonMd"
              color={colors.textInverse}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: SPACING.lg,
          paddingBottom: SPACING['4xl'],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl }}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: ICON_SIZES.xl,
              height: ICON_SIZES.xl,
              borderRadius: ICON_SIZES.xl / 2,
              backgroundColor: colors.bgCard,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.borderSoft,
              marginRight: SPACING.md,
            }}
          >
            <ArrowLeft size={18} color={colors.textMain} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <View
                style={{
                  width: ICON_SIZES.md,
                  height: ICON_SIZES.md,
                  borderRadius: ICON_SIZES.md / 2,
                  backgroundColor: `${platformBrandColor}18`,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Radio size={12} color={platformBrandColor} strokeWidth={2} />
              </View>
              <Text
                variant="scoreSmall"
                color={colors.textMain}
                accessibilityRole="header"
              >
                Broadcast Mode
              </Text>
            </View>
            <Text
              variant="caption"
              color={colors.textMuted}
              style={{ marginTop: SPACING.xxs }}
            >
              Scanning {platformName}
            </Text>
          </View>
        </View>

        {/* Shortcut-triggered hint — iOS only, since broadcast picker requires user tap */}
        {isFromShortcut && Platform.OS === 'ios' && broadcast.status === 'AWAITING_BROADCAST_START' && (
          <View
            style={{
              backgroundColor: colors.blue50,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              marginBottom: SPACING.md,
              borderWidth: 1,
              borderColor: colors.blue200,
            }}
          >
            <Text
              variant="caption"
              color={colors.primaryBlue}
              align="center"
              style={{ fontWeight: '600' }}
            >
              Launched from Shortcut — tap the button below to start broadcasting
            </Text>
          </View>
        )}

        {/* Native broadcast picker — invisible, hosts RPSystemBroadcastPickerView */}
        {Platform.OS === 'ios' && <NativeBroadcastPicker />}

        {/* Broadcast picker button — shown before recording starts */}
        {(broadcast.status === 'INITIALIZING' ||
          broadcast.status === 'AWAITING_BROADCAST_START') && (
          <View style={{ marginBottom: SPACING.xl }}>
            <BroadcastPickerButton
              disabled={broadcast.status === 'INITIALIZING'}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  // iOS: Trigger the native RPSystemBroadcastPickerView
                  triggerBroadcastPicker();
                } else if (Platform.OS === 'android') {
                  // Android: Request MediaProjection permission
                  broadcast.requestScreenCapture();
                }
              }}
            />
          </View>
        )}

        {/* Broadcast overlay — adapts to current status */}
        <View
          accessibilityLiveRegion="polite"
          accessibilityLabel={broadcast.isRecording ? `Recording: ${broadcast.frameCount} frames captured, elapsed time ${broadcast.elapsedTime} seconds` : undefined}
        >
          <BroadcastOverlay
            status={broadcast.status}
            platform={platformKey}
            frameCount={broadcast.frameCount}
            elapsedTime={broadcast.elapsedTime}
            elapsedSeconds={broadcast.elapsedSeconds}
            storageUsed={broadcast.storageUsed}
            errorMessage={broadcast.session?.error_message}
            canSave={broadcast.frameCount >= MIN_FRAMES_REQUIRED && broadcast.elapsedSeconds >= MIN_SCAN_DURATION_SECS}
            onStop={handleStop}
            onCancel={handleCancel}
            onViewResults={handleViewResults}
            onOpenPlatform={handleOpenPlatform}
            onRetry={handleRetry}
          />
        </View>

        {/* How it works section — shown during awaiting state */}
        {broadcast.status === 'AWAITING_BROADCAST_START' && (
          <View
            style={{
              marginTop: SPACING['3xl'],
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              borderWidth: 1,
              borderColor: colors.borderSoft,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.overline,
                color: colors.textMuted,
                marginBottom: SPACING.md,
              }}
            >
              How it works
            </Text>
            {[
              Platform.OS !== 'web' && Platform.OS !== 'windows' && Platform.OS !== 'macos'
                ? 'Tap "Start Screen Capture" and grant permission'
                : 'Tap "Start Screen Recording" above',
              `Open ${platformName} and scroll your feed normally`,
              'AlgorithmLens captures frames in the background',
              'Come back here to see your results',
            ].map((step, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  gap: SPACING.sm,
                  marginBottom: index < 3 ? SPACING.sm : 0,
                }}
              >
                <Text
                  variant="caption"
                  color={platformBrandColor}
                  style={{ fontWeight: '600', width: 20 }}
                >
                  {index + 1}.
                </Text>
                <Text
                  variant="caption"
                  color={colors.textSecondary}
                  style={{ flex: 1 }}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom privacy note */}
        <View style={{ marginTop: SPACING['3xl'], alignItems: 'center', gap: SPACING.sm }}>
          <Shield size={16} color={colors.textTertiary} strokeWidth={1.5} />
          <Text
            variant="captionSmall"
            color={colors.textTertiary}
            align="center"
          >
            AlgorithmLens only captures visual frames from your feed.
            No audio is recorded. Frames are processed on-device and
            never leave your phone without your explicit action.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
