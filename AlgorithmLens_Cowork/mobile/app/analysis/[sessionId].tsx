/**
 * Analysis screen. One route, two card states (Analyzing / Results)
 * driven by the useAnalysis pipeline. FAILED renders as an inline error
 * variant inside the Analyzing card; successful COMPLETE transitions to
 * the Results card.
 *
 * Analyzing card: StepIndicator (Frames > Dedupe > Report), a slim
 * progress bar, frames-analyzed counter, and a Cancel text link below
 * the card.
 *
 * Results card: brand-blue hero count of feed items, subhead with
 * duration context, four monochrome Key Findings rows (Ads, Patterns,
 * Political, Tone), and the "View full dashboard" CTA.
 *
 * Frame data is consumed once from analysisDataStore (set by the
 * broadcast screen). Streak recording and iOS shortcut donation fire
 * after successful completion.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CaptureFooter,
  Icon,
  PrimaryButton,
  ScanHeader,
  StepIndicator,
  type IconName,
} from '../../src/design-system';
import {
  colors,
  layout,
  radius,
  spacing,
  type,
} from '../../src/design-tokens/tokens';
import { useAnalysis } from '../../src/hooks/useAnalysis';
import { consumeAnalysisData } from '../../src/lib/analysis/analysisDataStore';
import { recordScan } from '../../src/lib/streakManager';
import { platformName } from '../../src/lib/platformLabels';
import { triggerImpactMedium } from '../../src/lib/haptics';
import type { UnifiedScanResult } from '../../src/types';

const DISCLOSURE =
  "Frames are analyzed by Google's Gemini. No account credentials are shared. Frames are discarded after analysis.";

const STEP_LABELS = ['Frames', 'Dedupe', 'Report'];

export default function AnalysisScreen() {
  const { sessionId: routeSessionId } = useLocalSearchParams<{
    sessionId?: string;
  }>();
  const analysis = useAnalysis();
  const hasStarted = useRef(false);

  const [analysisData] = useState(() => consumeAnalysisData());
  const sessionId = analysisData?.sessionId || routeSessionId || '';
  const platform = analysisData?.platform || 'instagram';
  const platformLabel = platformName(platform) || platform;
  const frames = analysisData?.frames || [];
  const captureInfo = analysisData?.captureInfo || null;
  const frameBase64Map = analysisData?.frameBase64Map || {};

  const getFrameBase64 = useCallback(
    (filename: string): string | null => frameBase64Map[filename] || null,
    [frameBase64Map],
  );

  useEffect(() => {
    if (hasStarted.current) return;
    if (frames.length === 0 || !captureInfo) return;
    hasStarted.current = true;
    analysis.start(frames, platform, captureInfo, getFrameBase64);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streakRecorded = useRef(false);
  useEffect(() => {
    if (analysis.isComplete && !streakRecorded.current) {
      streakRecorded.current = true;
      recordScan().catch(() => {
        // Non-critical
      });
      if (Platform.OS === 'ios') {
        try {
          const { requireNativeModule } = require('expo-modules-core');
          const shortcuts = requireNativeModule('ExpoShortcuts');
          shortcuts.donateInteraction(platform);
        } catch {
          // Non-critical
        }
      }
    }
  }, [analysis.isComplete, platform]);

  const handleCancelPress = useCallback(() => {
    Alert.alert(
      'Cancel analysis?',
      'The analysis is still running. Your captured frames will be lost.',
      [
        { text: 'Keep analyzing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            analysis.abort();
            router.back();
          },
        },
      ],
    );
  }, [analysis]);

  const handleBack = useCallback(() => {
    if (analysis.isRunning) {
      handleCancelPress();
    } else {
      router.back();
    }
  }, [analysis.isRunning, handleCancelPress]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (analysis.isRunning) {
          handleCancelPress();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [analysis.isRunning, handleCancelPress]);

  const handleViewDashboard = useCallback(() => {
    triggerImpactMedium();
    router.replace('/(tabs)/dashboard');
  }, []);

  const handleRetry = useCallback(() => {
    if (frames.length === 0 || !captureInfo) return;
    analysis.reset();
    analysis.start(frames, platform, captureInfo, getFrameBase64);
  }, [analysis, frames, platform, captureInfo, getFrameBase64]);

  // Empty / not-configured fallbacks.
  if (frames.length === 0) {
    return (
      <FallbackScreen
        title="No frames to analyze"
        body="The broadcast session data has expired or wasn't captured properly. Try scanning again."
        ctaLabel="Go back"
        onCta={() => router.back()}
      />
    );
  }
  if (!analysis.isConfigured) {
    return (
      <FallbackScreen
        title="Setup required"
        body="Gemini API key is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your environment to enable feed analysis."
        ctaLabel="Go back"
        onCta={() => router.back()}
      />
    );
  }

  const isResultsCard = analysis.isComplete && analysis.result;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScanHeader
        title={isResultsCard ? 'Results' : 'Analyzing'}
        subtitle={platformLabel}
        onBack={handleBack}
      />
      <View
        style={{
          flex: 1,
          paddingHorizontal: layout.screenPaddingX,
          justifyContent: isResultsCard ? 'flex-start' : 'center',
          paddingTop: isResultsCard ? spacing.s5 : 0,
        }}
      >
        {analysis.isFailed ? (
          <AnalyzingError
            message={
              analysis.progress.errorMessage ||
              'Analysis ended unexpectedly. Try again.'
            }
            onRetry={handleRetry}
          />
        ) : isResultsCard ? (
          <ResultsBody
            result={analysis.result as UnifiedScanResult}
            onViewDashboard={handleViewDashboard}
          />
        ) : (
          <AnalyzingBody
            stage={analysis.progress.stage}
            currentFrame={analysis.progress.currentFrame}
            totalFrames={analysis.progress.totalFrames}
            elapsedMs={analysis.progress.elapsedMs}
            progressPercent={analysis.progressPercent}
            onCancel={handleCancelPress}
          />
        )}
      </View>
      <CaptureFooter text={DISCLOSURE} />
    </SafeAreaView>
  );
}

/* Card bodies */

function AnalyzingBody({
  stage,
  currentFrame,
  totalFrames,
  elapsedMs,
  progressPercent,
  onCancel,
}: {
  stage: string;
  currentFrame: number;
  totalFrames: number;
  elapsedMs: number;
  progressPercent: number;
  onCancel: () => void;
}) {
  const currentStep = stepForStage(stage);
  const pct = progressPercent / 100;
  const remainingMs = pct > 0.05 ? Math.max(0, elapsedMs / pct - elapsedMs) : 0;
  const remainingSecs = Math.ceil(remainingMs / 1000);
  const showRemaining = pct > 0.05 && remainingSecs > 0 && remainingSecs < 600;

  return (
    <View style={{ gap: spacing.s7 }}>
      <StepIndicator labels={STEP_LABELS} currentStep={currentStep} />
      <View style={{ gap: spacing.s3 }}>
        <View
          accessibilityLabel={`${Math.round(progressPercent)} percent complete`}
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.min(100, Math.max(0, progressPercent))}%`,
              height: '100%',
              backgroundColor: colors.brandPrimary,
            }}
          />
        </View>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
            textAlign: 'center',
            fontVariant: ['tabular-nums'],
          }}
        >
          {totalFrames > 0
            ? `Analyzing ${currentFrame} of ${totalFrames} frames`
            : 'Starting analysis…'}
        </Text>
        {showRemaining ? (
          <Text
            style={{
              fontSize: type.caption.fontSize,
              lineHeight: type.caption.lineHeight,
              fontWeight: type.caption.fontWeight,
              color: colors.textTertiary,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
            }}
          >
            {remainingSecs}s remaining
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel analysis"
        style={({ pressed }) => ({
          alignSelf: 'center',
          paddingVertical: spacing.s2,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
          }}
        >
          Cancel analysis
        </Text>
      </Pressable>
    </View>
  );
}

function ResultsBody({
  result,
  onViewDashboard,
}: {
  result: UnifiedScanResult;
  onViewDashboard: () => void;
}) {
  const totalItems = result.aggregates?.total_feed_items ?? 0;
  const durationSecs =
    result.environment?.broadcast_capture?.duration_seconds ?? 0;
  const durationStr = formatDurationLabel(durationSecs);

  const findings: Array<{ icon: IconName; label: string; finding: string }> = [
    { icon: 'shopping-bag', label: 'Ads', finding: interpretAds(result) },
    { icon: 'bar-chart-3', label: 'Patterns', finding: interpretPatterns(result) },
    { icon: 'flag', label: 'Political', finding: interpretPolitical(result) },
    { icon: 'smile', label: 'Tone', finding: interpretTone(result) },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ gap: spacing.s1 }}>
        <Text
          allowFontScaling={false}
          style={{
            fontSize: type.hero.fontSize,
            lineHeight: type.hero.lineHeight,
            fontWeight: type.hero.fontWeight,
            letterSpacing: type.hero.letterSpacing,
            color: colors.brandPrimary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {totalItems}
        </Text>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
          }}
        >
          {totalItems === 1 ? 'item' : 'items'} captured
          {durationStr ? ` in ${durationStr}` : ''}
        </Text>
      </View>
      <View
        style={{
          marginTop: spacing.s7,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.card,
          paddingVertical: spacing.s2,
        }}
      >
        {findings.map((f, idx) => (
          <View
            key={f.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.s3,
              paddingHorizontal: spacing.s4,
              paddingVertical: spacing.s3,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <Icon name={f.icon} size={18} color={colors.textSecondary} strokeWidth={1.75} />
            <Text
              style={{
                fontSize: type.body.fontSize,
                lineHeight: type.body.lineHeight,
                fontWeight: type.bodyStrong.fontWeight,
                color: colors.textPrimary,
                width: 88,
              }}
            >
              {f.label}
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: type.body.fontSize,
                lineHeight: type.body.lineHeight,
                fontWeight: type.body.fontWeight,
                color: colors.textSecondary,
              }}
              numberOfLines={2}
            >
              {f.finding}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: spacing.s7 }}>
        <PrimaryButton label="View full dashboard" onPress={onViewDashboard} />
      </View>
    </View>
  );
}

function AnalyzingError({
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
      <Text
        style={{
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          fontWeight: type.body.fontWeight,
          color: colors.textSecondary,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
      <View style={{ alignSelf: 'stretch' }}>
        <PrimaryButton label="Try again" onPress={onRetry} />
      </View>
    </View>
  );
}

/* Fallback screen for missing data or unconfigured environment. */

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
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
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

/* Helpers */

function stepForStage(stage: string): number {
  switch (stage) {
    case 'PREPARING':
    case 'ANALYZING':
      return 0;
    case 'DEDUPLICATING':
      return 1;
    case 'BUILDING':
    case 'SAVING':
      return 2;
    case 'COMPLETE':
      return 3;
    default:
      return 0;
  }
}

function formatDurationLabel(secs: number): string {
  if (!secs || secs <= 0) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function interpretAds(result: UnifiedScanResult): string {
  const pct = Math.round(result.aggregates?.ad_percentage ?? 0);
  if (pct === 0) return 'No ads detected in this scan';
  return `${pct}% of your feed was ads`;
}

function interpretPatterns(result: UnifiedScanResult): string {
  const total = result.aggregates?.total_feed_items ?? 0;
  const topics = result.aggregates?.topic_distribution ?? [];
  if (topics.length > 0 && topics[0]) {
    return `Top category: ${topics[0].category}`;
  }
  return `${total} unique ${total === 1 ? 'item' : 'items'} captured`;
}

function interpretPolitical(result: UnifiedScanResult): string {
  const pol = result.aggregates?.political_content_summary;
  if (!pol || pol.political_items === 0) {
    return 'No political content detected';
  }
  return `${Math.round(pol.political_percentage)}% political content`;
}

function interpretTone(result: UnifiedScanResult): string {
  const counts: Record<string, number> = {
    POSITIVE: 0,
    NEUTRAL: 0,
    NEGATIVE: 0,
    MIXED: 0,
  };
  for (const item of result.feed_items ?? []) {
    const v = (item as { emotions?: { valence?: string } }).emotions?.valence;
    if (v && counts[v] !== undefined) {
      const next = (counts[v] ?? 0) + 1;
      counts[v] = next;
    }
  }
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (entries.length === 0) return 'Tone not analyzed';
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  if (!top) return 'Mixed tones';
  const labels: Record<string, string> = {
    POSITIVE: 'Mostly positive',
    NEUTRAL: 'Mostly neutral',
    NEGATIVE: 'Mostly negative',
    MIXED: 'Mixed tones',
  };
  return labels[top[0]] ?? 'Mixed tones';
}
