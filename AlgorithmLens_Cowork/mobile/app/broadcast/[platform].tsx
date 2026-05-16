/**
 * Broadcast screen. One route, three card states (Setup / Recording /
 * Complete) driven by useBroadcast.status. FAILED renders as an inline
 * error variant inside whichever card was last visible. CANCELLED
 * returns the user to the Setup card. IDLE is a transitional
 * non-visible state.
 *
 * The recording inversion: this is the centerpiece of the redesign. No
 * red border. The hero timer is textPrimary (a clock, not a score).
 * "Open [platform]" is the primary CTA; "Stop recording" demotes to a
 * secondary text button. Pulsing red dot lives only in the eyebrow line.
 *
 * iOS Shortcut auto-start (source=shortcut, autostart=1) is preserved so
 * the existing native shortcut module keeps working without rebuild.
 *
 * The native picker host (NativeBroadcastPicker, invisible on iOS) stays
 * mounted; the Setup card's primary CTA calls triggerBroadcastPicker().
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import {
  CaptureFooter,
  CautionPill,
  Icon,
  PrimaryButton,
  ScanHeader,
} from '../../src/design-system';
import {
  colors,
  layout,
  spacing,
  type,
} from '../../src/design-tokens/tokens';
import { useBroadcast } from '../../src/hooks/useBroadcast';
import {
  NativeBroadcastPicker,
  triggerBroadcastPicker,
} from '../../src/components/broadcast/NativeBroadcastPicker';
import { storeAnalysisData } from '../../src/lib/analysis/analysisDataStore';
import { PLATFORM_BROADCAST_CONFIGS } from '../../src/types/broadcast';
import type { SupportedPlatform } from '../../src/types/broadcast';
import { platformName } from '../../src/lib/platformLabels';
import {
  triggerImpactMedium,
  triggerNotificationWarning,
} from '../../src/lib/haptics';

const DISCLOSURE =
  "Frames are analyzed by Google's Gemini. No account credentials are shared. Frames are discarded after analysis.";
const FRAME_THRESHOLD = 30;
const BROADCAST_CLEANUP_DELAY_MS = 2000;

type CardKey = 'setup' | 'recording' | 'complete';

export default function BroadcastScreen() {
  const params = useLocalSearchParams<{
    platform?: string;
    autostart?: string;
    source?: string;
  }>();
  const broadcast = useBroadcast();

  // Guard: Expo Go cannot host the broadcast extension.
  useEffect(() => {
    if (Constants.appOwnership === 'expo') {
      Alert.alert(
        'Development build required',
        'Screen capture requires the AlgorithmLens development build. Use the built-in browser instead.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/') }],
      );
    }
  }, []);

  const validKeys = Object.keys(PLATFORM_BROADCAST_CONFIGS);
  const platformKey = (
    params.platform && validKeys.includes(params.platform)
      ? params.platform
      : 'instagram'
  ) as SupportedPlatform;
  const platformLabel = platformName(platformKey) || platformKey;
  const isFromShortcut = params.source === 'shortcut';
  const shouldAutoStart = params.autostart === '1';

  // Session lifecycle on mount.
  useEffect(() => {
    if (broadcast.status === 'IDLE') {
      broadcast.startSession(platformKey);
    }
    return () => {
      if (broadcast.isRecording) {
        broadcast.stopSession();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // iOS Shortcut autostart: clear pending, optionally request capture (Android).
  const shortcutConsumed = useRef(false);
  useEffect(() => {
    if (
      isFromShortcut &&
      !shortcutConsumed.current &&
      broadcast.status === 'AWAITING_BROADCAST_START'
    ) {
      shortcutConsumed.current = true;
      if (Platform.OS === 'ios') {
        try {
          const { requireNativeModule } = require('expo-modules-core');
          const shortcuts = requireNativeModule('ExpoShortcuts');
          shortcuts.clearPendingShortcut();
        } catch {
          // Non-critical
        }
      }
      if (shouldAutoStart && Platform.OS === 'android') {
        broadcast.requestScreenCapture().catch(() => {
          // Permission denied; user sees the manual button.
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcast.status]);

  // Record last platform for the Quick Scan shortcut.
  useEffect(() => {
    if (Platform.OS === 'ios') {
      try {
        const { requireNativeModule } = require('expo-modules-core');
        const shortcuts = requireNativeModule('ExpoShortcuts');
        shortcuts.setLastPlatform(platformKey);
      } catch {
        // Module unavailable; non-critical
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformKey]);

  // Pulse animation for the eyebrow's recording dot.
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (broadcast.status === 'RECORDING') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
    return undefined;
  }, [broadcast.status, pulseAnim]);

  const cardKey: CardKey = (() => {
    if (broadcast.status === 'RECORDING') return 'recording';
    if (
      broadcast.status === 'PROCESSING' ||
      broadcast.status === 'COMPLETE'
    ) {
      return 'complete';
    }
    return 'setup';
  })();
  const lastCardRef = useRef<CardKey>(cardKey);
  useEffect(() => {
    if (broadcast.status !== 'FAILED') {
      lastCardRef.current = cardKey;
    }
  }, [cardKey, broadcast.status]);
  const isError = broadcast.status === 'FAILED';
  const displayCard = isError ? lastCardRef.current : cardKey;

  // Back handler. Setup: no confirm. Recording / Complete: confirm.
  const confirmAndStop = useCallback(
    (destructiveLabel: string) => {
      Alert.alert(
        'Stop recording?',
        "Your scan doesn't have enough data yet.",
        [
          { text: 'Keep recording', style: 'cancel' },
          {
            text: destructiveLabel,
            style: 'destructive',
            onPress: async () => {
              triggerNotificationWarning();
              await broadcast.cancelSession();
              router.back();
            },
          },
        ],
      );
    },
    [broadcast],
  );
  const handleBack = useCallback(() => {
    if (displayCard === 'recording') {
      confirmAndStop('Stop and discard');
    } else if (displayCard === 'complete') {
      Alert.alert(
        'Discard captured frames?',
        'You have captured frames that have not been analyzed yet.',
        [
          { text: 'Keep frames', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              await broadcast.cleanup();
              router.back();
            },
          },
        ],
      );
    } else {
      router.back();
    }
  }, [displayCard, confirmAndStop, broadcast]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (displayCard !== 'setup') {
          handleBack();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [displayCard, handleBack]);

  const handleStartRecording = useCallback(() => {
    if (Platform.OS === 'ios') {
      triggerBroadcastPicker();
    } else if (Platform.OS === 'android') {
      broadcast.requestScreenCapture().catch(() => {
        // Permission denied; the manual button stays available.
      });
    }
  }, [broadcast]);

  const handleOpenPlatform = useCallback(async () => {
    const success = await broadcast.openPlatformApp(platformKey);
    if (!success) {
      Alert.alert(
        `${platformLabel} not installed`,
        `Install ${platformLabel} on your device, then try again.`,
      );
    }
  }, [broadcast, platformKey, platformLabel]);

  const handleStop = useCallback(async () => {
    triggerNotificationWarning();
    await broadcast.stopSession();
  }, [broadcast]);

  const handleRetry = useCallback(async () => {
    await broadcast.cleanup();
    broadcast.startSession(platformKey);
  }, [broadcast, platformKey]);

  const handleAnalyze = useCallback(async () => {
    triggerImpactMedium();
    try {
      const frames = await broadcast.collectFrames();
      const captureInfo = broadcast.buildCaptureInfo();
      if (frames.length === 0 || !captureInfo) {
        Alert.alert(
          'No frames captured',
          'The recording ended without usable frames. Try again.',
          [{ text: 'OK' }],
        );
        return;
      }
      const frameBase64Map: Record<string, string> = {};
      for (const frame of frames) {
        const filename =
          frame.local_path.split('/').pop() || `${frame.frame_id}.jpg`;
        const base64 = broadcast.getFrameBase64(filename);
        if (base64) frameBase64Map[filename] = base64;
      }
      const sessionId = broadcast.session?.session_id || Date.now().toString();
      storeAnalysisData({
        sessionId,
        platform: platformKey,
        frames,
        captureInfo,
        frameBase64Map,
        storedAt: Date.now(),
      });
      router.replace({
        pathname: '/analysis/[sessionId]',
        params: { sessionId },
      });
      setTimeout(() => {
        broadcast.cleanup();
      }, BROADCAST_CLEANUP_DELAY_MS);
    } catch {
      Alert.alert(
        'Something went wrong',
        "We couldn't process the captured frames. Please try recording again.",
        [{ text: 'OK' }],
      );
    }
  }, [broadcast, platformKey]);

  // Android: screen capture is not implemented on this platform.
  if (Platform.OS === 'android') {
    return (
      <FallbackScreen
        title="Coming to Android soon"
        body="Screen recording is coming to Android soon. In the meantime, use the built-in browser for text-based feed analysis."
        ctaLabel="Use the built-in browser"
        onCta={() => router.back()}
      />
    );
  }

  // Broadcast extension unavailable.
  if (!broadcast.isAvailable) {
    return (
      <FallbackScreen
        title="Broadcast not available"
        body="Screen broadcast requires iOS 12 or later and the AlgorithmLens development build. Use the built-in browser to scan in the meantime."
        ctaLabel="Go back"
        onCta={() => router.back()}
      />
    );
  }

  // Subtitle reflects the current card; error variants override with copy.
  const subtitle = isError
    ? 'Something went wrong'
    : displayCard === 'setup'
    ? 'Set up'
    : displayCard === 'recording'
    ? undefined
    : 'Capture complete';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScanHeader
        title={platformLabel}
        subtitle={subtitle}
        onBack={handleBack}
      />
      <View style={{ flex: 1, paddingHorizontal: layout.screenPaddingX }}>
        <View
          style={{
            flex: 1,
            alignItems: 'stretch',
            justifyContent: 'center',
          }}
        >
          {isError ? (
            <ErrorBody
              message={
                broadcast.session?.error_message ||
                'The broadcast session ended unexpectedly.'
              }
              onRetry={handleRetry}
            />
          ) : displayCard === 'setup' ? (
            <SetupBody onStart={handleStartRecording} />
          ) : displayCard === 'recording' ? (
            <RecordingBody
              elapsedTime={broadcast.elapsedTime}
              frameCount={broadcast.frameCount}
              pulseAnim={pulseAnim}
              platformLabel={platformLabel}
              onOpenPlatform={handleOpenPlatform}
              onStop={handleStop}
            />
          ) : (
            <CompleteBody
              frameCount={broadcast.frameCount}
              onAnalyze={handleAnalyze}
            />
          )}
        </View>
      </View>
      {Platform.OS === 'ios' ? <NativeBroadcastPicker /> : null}
      <CaptureFooter text={DISCLOSURE} />
    </SafeAreaView>
  );
}

/* Card bodies */

function SetupBody({ onStart }: { onStart: () => void }) {
  return (
    <View style={{ gap: spacing.s6 }}>
      <Text style={bodyCenterStyle}>Capture about a minute of scrolling</Text>
      <PrimaryButton label="Start recording" onPress={onStart} />
    </View>
  );
}

function RecordingBody({
  elapsedTime,
  frameCount,
  pulseAnim,
  platformLabel,
  onOpenPlatform,
  onStop,
}: {
  elapsedTime: string;
  frameCount: number;
  pulseAnim: Animated.Value;
  platformLabel: string;
  onOpenPlatform: () => void;
  onStop: () => void;
}) {
  const showCaution = frameCount < FRAME_THRESHOLD;
  return (
    <View style={{ gap: spacing.s6 }}>
      <View style={{ alignItems: 'center', gap: spacing.s3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s2 }}>
          <Animated.View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.destructive,
              opacity: pulseAnim,
            }}
          />
          <Text
            style={{
              fontSize: type.micro.fontSize,
              lineHeight: type.micro.lineHeight,
              fontWeight: type.micro.fontWeight,
              letterSpacing: type.micro.letterSpacing,
              textTransform: 'uppercase',
              color: colors.textSecondary,
            }}
          >
            Recording
          </Text>
        </View>
        <Text
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Recording, ${elapsedTime} elapsed, ${frameCount} frames`}
          allowFontScaling={false}
          style={{
            fontSize: type.hero.fontSize,
            lineHeight: type.hero.lineHeight,
            fontWeight: type.hero.fontWeight,
            letterSpacing: type.hero.letterSpacing,
            color: colors.textPrimary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {elapsedTime}
        </Text>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {frameCount} {frameCount === 1 ? 'frame' : 'frames'} captured
        </Text>
        {showCaution ? (
          <CautionPill text="Keep scrolling. We need a few more frames" />
        ) : null}
      </View>
      <View style={{ gap: spacing.s3 }}>
        <PrimaryButton
          label={`Open ${platformLabel}`}
          onPress={onOpenPlatform}
        />
        <SecondaryTextButton label="Stop recording" onPress={onStop} />
      </View>
    </View>
  );
}

function CompleteBody({
  frameCount,
  onAnalyze,
}: {
  frameCount: number;
  onAnalyze: () => void;
}) {
  return (
    <View style={{ gap: spacing.s6 }}>
      <View style={{ alignItems: 'center', gap: spacing.s3 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.brandAccent12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name="check"
            size={28}
            color={colors.brandAccent}
            strokeWidth={2.5}
          />
        </View>
        <Text style={bodyCenterStyle}>Capture complete</Text>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {frameCount} {frameCount === 1 ? 'frame' : 'frames'} captured
        </Text>
      </View>
      <PrimaryButton label="Analyze frames" onPress={onAnalyze} />
    </View>
  );
}

function ErrorBody({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={{ gap: spacing.s5, alignItems: 'center' }}>
      <Icon
        name="alert-triangle"
        size={28}
        color={colors.textSecondary}
        strokeWidth={2}
      />
      <Text style={[bodyCenterStyle, { color: colors.textSecondary }]}>
        {message}
      </Text>
      <View style={{ alignSelf: 'stretch' }}>
        <PrimaryButton label="Try again" onPress={onRetry} />
      </View>
    </View>
  );
}

/* Fallback screen for unsupported environments. */

function FallbackScreen({
  title,
  body,
  ctaLabel,
  onCta,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScanHeader title="" onBack={() => router.back()} />
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: layout.screenPaddingX,
          gap: spacing.s5,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontSize: type.subheading.fontSize,
            lineHeight: type.subheading.lineHeight,
            fontWeight: type.subheading.fontWeight,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text style={[bodyCenterStyle, { color: colors.textSecondary }]}>
          {body}
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          <PrimaryButton label={ctaLabel} onPress={onCta} />
        </View>
      </View>
      <CaptureFooter text={DISCLOSURE} />
    </SafeAreaView>
  );
}

/* Secondary text button. The primary action button is the imported
   PrimaryButton primitive; this lighter affordance stays inline since
   its shape (text-only, no fill) doesn't match the primary variant. */

function SecondaryTextButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        paddingVertical: spacing.s3,
        alignItems: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          fontWeight: type.bodyStrong.fontWeight,
          color: colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const bodyCenterStyle = {
  fontSize: type.body.fontSize,
  lineHeight: type.body.lineHeight,
  fontWeight: type.body.fontWeight,
  color: colors.textPrimary,
  textAlign: 'center' as const,
};
