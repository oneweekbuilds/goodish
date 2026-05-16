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
 * Results card (Phase 4.4.4 onward): driven by the 2.x interpretation
 * engine. ResultsMetaLine + VerdictEyebrow + VerdictText sit at the top,
 * followed by the engine's sublines (OBSERVED / LIKELY markers), an
 * optional SupportingCard with FactRow children, and the "View full
 * dashboard" CTA. The screen pulls prior scans via useDashboard (Option
 * A from Phase 4.4.3) so the engine's rolling-average derivations can
 * populate comparative anchors. The engine runs synchronously on the
 * in-memory UnifiedScanResult via the unifiedResultToScanDetail adapter
 * — no Supabase round-trip required after persistence.
 *
 * Frame data is consumed once from analysisDataStore (set by the
 * broadcast screen). Streak recording and iOS shortcut donation fire
 * after successful completion.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CaptureFooter,
  FactRow,
  Icon,
  LikelySubline,
  ObservedSubline,
  PrimaryButton,
  ResultsMetaLine,
  ScanHeader,
  StepIndicator,
  SupportingCard,
  VerdictEyebrow,
  VerdictText,
} from '../../src/design-system';
import {
  colors,
  layout,
  spacing,
  type,
} from '../../src/design-tokens/tokens';
import { useAnalysis } from '../../src/hooks/useAnalysis';
import { useDashboard, type ScanDetail } from '../../src/hooks/useDashboard';
import { useAuth } from '../../src/context/AuthContext';
import { consumeAnalysisData } from '../../src/lib/analysis/analysisDataStore';
import { recordScan } from '../../src/lib/streakManager';
import { platformName } from '../../src/lib/platformLabels';
import { triggerImpactMedium } from '../../src/lib/haptics';
import { computeDashboardData } from '../../src/lib/computeDashboardData';
import { interpretScan } from '../../src/lib/interpretation/interpretationEngine';
import { unifiedResultToScanDetail } from '../../src/lib/interpretation/adapters/unifiedResultToScanDetail';
import type {
  InterpretationContext,
  Subline,
  SublineMode,
} from '../../src/lib/interpretation/interpretation-types';
import type { UnifiedScanResult } from '../../src/types';

const DISCLOSURE =
  "Frames are analyzed by Google's Gemini. No account credentials are shared. Frames are discarded after analysis.";

const STEP_LABELS = ['Frames', 'Dedupe', 'Report'];

export default function AnalysisScreen() {
  const { sessionId: routeSessionId } = useLocalSearchParams<{
    sessionId?: string;
  }>();
  const analysis = useAnalysis();
  const { user } = useAuth();
  // useDashboard is the existing scan-history fetch hook; the Results
  // screen consumes only its `scans` field. `latestScan` and `refresh`
  // are Dashboard-specific and ignored here. See Phase 4.4.3 decisions
  // for the option-A rationale and the Option-B follow-up note (extract
  // useScanHistory when the History page is touched for the 2.x design
  // refresh).
  const { scans: priorScans, loading: scansLoading } = useDashboard();
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
            scanId={analysis.scanId ?? ''}
            userId={user?.id ?? ''}
            priorScans={priorScans}
            scansLoading={scansLoading}
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

/**
 * ResultsBody renders the 2.x interpretation engine's output for the
 * Results surface.
 *
 * Render flow:
 *
 *   ResultsMetaLine        (when interpretation.meta is non-null)
 *   VerdictEyebrow         (the 28px brand-blue rule + "VERDICT" label)
 *   VerdictText            (the engine's verdict string)
 *   Sublines               (OBSERVED / LIKELY, with adaptive gap rhythm)
 *   SupportingCard         (when at least one 'fact' supporting row)
 *     FactRow × N
 *   PrimaryButton          ("View full dashboard")
 *
 * Engine wiring (all memoized so re-renders don't re-thrash the
 * interpretation):
 *
 *   activeScan     = unifiedResultToScanDetail(result, {scanId, userId, platform})
 *   dashboardData  = computeDashboardData(activeScan)
 *   context        = { activeScan, scans: priorScans, dashboardData, platform }
 *   interpretation = interpretScan(context, 'results')
 *
 * priorScans starts as [] while useDashboard's fetch is in flight. The
 * engine handles empty scans gracefully (rolling averages return null,
 * FactRow anchors omitted). When scans land, the memo chain re-derives
 * and the engine re-runs with anchors populated — no special loading UI.
 *
 * scansLoading is accepted as a prop but not actively rendered (per
 * Phase 4.4.3 decision: anchors fill in when scans arrive without UI
 * churn; the prop is kept for future use and to make the data
 * dependency explicit at the call site).
 *
 * Supporting rows are filtered to variant 'fact' only — CreatorRow,
 * TrajectoryRow, BarRow, CaveatNote, and MethodologyRow ship in Phase
 * 5+. A console.warn fires once-per-render on unrecognized variants
 * so the gap is loud during development.
 *
 * Subline modes COACHING and QUESTION are skipped with a console.warn
 * (their primitives ship in Phase 5+). In Phase 4 the engine only
 * produces OBSERVED and LIKELY sublines.
 */
function ResultsBody({
  result,
  scanId,
  userId,
  priorScans,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scansLoading,
  onViewDashboard,
}: {
  result: UnifiedScanResult;
  scanId: string;
  userId: string;
  priorScans: ScanDetail[];
  scansLoading: boolean;
  onViewDashboard: () => void;
}) {
  const platform = result.scan_metadata.platform;

  const activeScan = useMemo(
    () => unifiedResultToScanDetail(result, { scanId, userId, platform }),
    [result, scanId, userId, platform],
  );

  const dashboardData = useMemo(
    () => computeDashboardData(activeScan),
    [activeScan],
  );

  const context: InterpretationContext = useMemo(
    () => ({ activeScan, scans: priorScans, dashboardData, platform }),
    [activeScan, priorScans, dashboardData, platform],
  );

  const interpretation = useMemo(
    () => interpretScan(context, 'results'),
    [context],
  );

  // Filter supporting rows to 'fact' variant only. Other variants
  // skipped with a console.warn — they ship as separate primitives in
  // Phase 5+. The filter runs inside useMemo so warns fire at most
  // once per unique interpretation result.
  const factRows = useMemo(() => {
    const out: Array<{ label: string; value: string; anchor?: string }> = [];
    for (const row of interpretation.supportingRows) {
      if (row.variant === 'fact') {
        out.push({ label: row.label, value: row.value, anchor: row.anchor });
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[2x] supporting row variant not yet implemented on Results: ${row.variant}`,
        );
      }
    }
    return out;
  }, [interpretation.supportingRows]);

  const totalItems = result.aggregates?.total_feed_items ?? 0;
  const sessionDuration =
    result.environment?.broadcast_capture?.duration_seconds ?? 0;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: spacing.s5,
      }}
      showsVerticalScrollIndicator={false}
    >
      {interpretation.meta ? (
        <ResultsMetaLine
          analyzedAt={result.scan_metadata.created_at}
          postCount={totalItems}
          sessionDuration={sessionDuration}
        />
      ) : null}

      <View style={{ marginTop: spacing.s5 }}>
        <VerdictEyebrow />
      </View>

      <View style={{ marginTop: spacing.s4 }}>
        <VerdictText>{interpretation.verdict}</VerdictText>
      </View>

      <View style={{ marginTop: spacing.s6 }}>
        {interpretation.sublines.map((subline, idx) => {
          const prevMode =
            idx > 0 ? interpretation.sublines[idx - 1]?.mode : undefined;
          const marginTop = sublineGapTop(prevMode, subline.mode);
          return (
            <SublineRow
              key={idx}
              subline={subline}
              marginTop={marginTop}
            />
          );
        })}
      </View>

      {factRows.length > 0 ? (
        <View style={{ marginTop: spacing.s6 }}>
          <SupportingCard>
            {factRows.map((row, i) => (
              <FactRow
                key={i}
                label={row.label}
                value={row.value}
                anchor={row.anchor}
              />
            ))}
          </SupportingCard>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.s7 }}>
        <PrimaryButton label="View full dashboard" onPress={onViewDashboard} />
      </View>
    </ScrollView>
  );
}

/**
 * SublineRow dispatches on the engine's SublineMode to the matching
 * design-system primitive. COACHING and QUESTION fall through to a
 * console.warn — those primitives ship in Phase 5+.
 */
function SublineRow({
  subline,
  marginTop,
}: {
  subline: Subline;
  marginTop: number;
}) {
  if (subline.mode === 'OBSERVED') {
    return (
      <View style={{ marginTop }}>
        <ObservedSubline>{subline.text}</ObservedSubline>
      </View>
    );
  }
  if (subline.mode === 'LIKELY') {
    return (
      <View style={{ marginTop }}>
        <LikelySubline>{subline.text}</LikelySubline>
      </View>
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    `[2x] subline mode not yet implemented on Results: ${subline.mode}`,
  );
  return null;
}

/**
 * Adaptive vertical rhythm between sublines, per the 2.x Results
 * design spec (mobile/audits/2x-results-design/decisions.md):
 *
 *   12px — same mode → same mode
 *   22px — crossing modes (e.g. OBSERVED → LIKELY)
 *   24px — before a QUESTION (the most distinct mode)
 *
 * The first subline has no top margin.
 */
function sublineGapTop(
  prevMode: SublineMode | undefined,
  currentMode: SublineMode,
): number {
  if (!prevMode) return 0;
  if (currentMode === 'QUESTION') return 24;
  if (prevMode === currentMode) return 12;
  return 22;
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

// formatDurationLabel and the four interpretAds/Patterns/Political/Tone
// helpers were removed in Phase 4.4.4 when the engine took over the
// Results render. ResultsMetaLine handles its own duration formatting
// (M:SS) from the raw seconds, and the engine produces the verdict +
// sublines + supporting rows that previously came from these inline
// helpers.
