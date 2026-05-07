/**
 * Analysis Processing Screen — Shows Gemini analysis progress after broadcast capture.
 *
 * Reads broadcast data from the in-memory analysisDataStore (not route params,
 * since base64 frame data can be 20MB+ which exceeds URL limits).
 *
 * Navigation: broadcast/[platform] → analysis/[sessionId] → (tabs)/dashboard
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, TouchableOpacity, BackHandler, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Sparkles, Share2 } from 'lucide-react-native';
import { triggerImpactMedium } from '../../src/lib/haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { GL_TYPOGRAPHY } from '../../src/lib/gluestackTheme';
import { SPACING, RADIUS, PLATFORMS, MIN_TOUCH_TARGET } from '../../src/lib/theme';
import { Text, ContentFadeIn } from '../../src/components/glue';
import { useAnalysis } from '../../src/hooks/useAnalysis';
import { AnalysisProgress } from '../../src/components/analysis/AnalysisProgress';
import { BroadcastResultsSummary } from '../../src/components/analysis/BroadcastResultsSummary';
import { consumeAnalysisData } from '../../src/lib/analysis/analysisDataStore';
import { recordScan } from '../../src/lib/streakManager';
import type { BroadcastFrame, BroadcastCaptureInfo, SupportedPlatform } from '../../src/types/broadcast';

export default function AnalysisScreen() {
  const { sessionId: routeSessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { colors } = useTheme();
  const analysis = useAnalysis();
  const hasStarted = useRef(false);

  // Consume analysis data from the in-memory store (set by broadcast screen)
  const [analysisData] = useState(() => consumeAnalysisData());

  const sessionId = analysisData?.sessionId || routeSessionId || '';
  const platform = analysisData?.platform || 'instagram';
  const platformBrandColor = PLATFORMS[platform as keyof typeof PLATFORMS]?.color || colors.primaryBlue;
  const frames = analysisData?.frames || [];
  const captureInfo = analysisData?.captureInfo || null;
  const frameBase64Map = analysisData?.frameBase64Map || {};

  // Frame base64 lookup function
  const getFrameBase64 = useCallback(
    (filename: string): string | null => {
      return frameBase64Map[filename] || null;
    },
    [frameBase64Map],
  );

  // Start analysis on mount (once)
  useEffect(() => {
    if (hasStarted.current) return;
    if (frames.length === 0 || !captureInfo) return;

    hasStarted.current = true;
    analysis.start(frames, platform, captureInfo, getFrameBase64);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Record streak and donate shortcut interaction when analysis completes
  const streakRecorded = useRef(false);
  useEffect(() => {
    if (analysis.isComplete && !streakRecorded.current) {
      streakRecorded.current = true;
      recordScan().catch((err) => {
        if (__DEV__) {
          console.warn('Failed to record streak:', err);
        }
      });

      // Donate shortcut interaction for Siri/Spotlight suggestions (iOS only)
      if (Platform.OS === 'ios') {
        try {
          const { requireNativeModule } = require('expo-modules-core');
          const shortcuts = requireNativeModule('ExpoShortcuts');
          shortcuts.donateInteraction(platform);
        } catch {
          // Shortcuts module not available — non-critical
        }
      }
    }
  }, [analysis.isComplete, platform]);

  // Handle Android back button
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (analysis.isRunning) {
        handleCancelPress();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [analysis.isRunning]);

  const handleCancelPress = useCallback(() => {
    Alert.alert(
      'Cancel Analysis?',
      'The analysis is still running. Your captured frames will be lost.',
      [
        { text: 'Keep Analyzing', style: 'cancel' },
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

  const handleViewResults = useCallback(() => {
    triggerImpactMedium();
    router.replace('/(tabs)/dashboard');
  }, []);

  const handleRetry = useCallback(() => {
    if (frames.length === 0 || !captureInfo) return;
    analysis.reset();
    analysis.start(frames, platform, captureInfo, getFrameBase64);
  }, [analysis, frames, platform, captureInfo, getFrameBase64]);

  // Error state: no frames (data store was empty or stale)
  if (frames.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }}>
          <Text
            variant="h3"
            color={colors.textMain}
            align="center"
            style={{ marginBottom: SPACING.md }}
          >
            No frames to analyze
          </Text>
          <Text
            variant="body"
            color={colors.textSecondary}
            align="center"
            style={{ marginBottom: SPACING.xl }}
          >
            The broadcast session data has expired or wasn't captured properly. Try scanning again.
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
              minHeight: MIN_TOUCH_TARGET,
              justifyContent: 'center',
              alignItems: 'center',
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

  // API key not configured
  if (!analysis.isConfigured) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }}>
          <Text
            variant="h3"
            color={colors.textMain}
            align="center"
            style={{ marginBottom: SPACING.md }}
          >
            Setup Required
          </Text>
          <Text
            variant="body"
            color={colors.textSecondary}
            align="center"
            style={{ marginBottom: SPACING.xl }}
          >
            Gemini API key is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your environment to enable feed analysis.
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
              minHeight: MIN_TOUCH_TARGET,
              justifyContent: 'center',
              alignItems: 'center',
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

  const handleSharePress = useCallback(() => {
    // Share functionality not yet implemented
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <View style={{ flex: 1, padding: SPACING.lg }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SPACING['3xl'],
            paddingBottom: SPACING.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 36,
              height: 36,
              borderRadius: RADIUS.md,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: RADIUS.md,
                  backgroundColor: `${platformBrandColor}18`,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Sparkles size={12} color={platformBrandColor} strokeWidth={2} />
              </View>
              <Text
                variant="scoreSmall"
                color={colors.textMain}
                accessibilityRole="header"
              >
                Analyzing Feed
              </Text>
            </View>
            <Text
              variant="caption"
              color={colors.textMuted}
              style={{ marginTop: SPACING.xxs }}
            >
              {frames.length} frames from {platform}
            </Text>
          </View>
          {/* Build #44: Share button hidden because handleSharePress is a
              no-op. Tapping it previously did nothing, which is confusing
              for sighted users and worse for VoiceOver. Re-enable when
              real share via deep link / image export ships.
              TODO build #45+: implement real share via deep link */}
          {false && (
            <TouchableOpacity
              onPress={handleSharePress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Share results"
              style={{
                width: 36,
                height: 36,
                borderRadius: RADIUS.md,
                backgroundColor: colors.bgCard,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.borderSoft,
                marginLeft: SPACING.md,
              }}
            >
              <Share2 size={18} color={colors.textMain} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Analysis Progress Card — hidden when complete + results available */}
        {!(analysis.isComplete && analysis.result) && (
          <AnalysisProgress
            progress={analysis.progress}
            statusMessage={analysis.statusMessage}
            progressPercent={analysis.progressPercent}
            isRunning={analysis.isRunning}
            onCancel={() => {
              analysis.abort();
              router.back();
            }}
            onViewResults={handleViewResults}
            onRetry={handleRetry}
          />
        )}

        {/* Results summary card — shown when analysis completes successfully */}
        {analysis.isComplete && analysis.result && (
          <View style={{ flex: 1 }}>
            <ContentFadeIn
              ready={analysis.isComplete && !!analysis.result}
              duration={250}
            >
              <BroadcastResultsSummary
                result={analysis.result}
                onViewDashboard={handleViewResults}
              />
            </ContentFadeIn>
          </View>
        )}

        {/* Summary info during analysis (hidden once complete or failed) */}
        {analysis.progress.stage !== 'PREPARING' && !analysis.isComplete && !analysis.isFailed && (
          <View
            style={{
              marginTop: SPACING.xl,
              backgroundColor: colors.bgCard,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              borderWidth: 1,
              borderColor: colors.borderSoft,
            }}
          >
            <Text
              variant="overline"
              color={colors.textMuted}
              style={{ marginBottom: SPACING.md }}
            >
              What's happening
            </Text>
            <View style={{ position: 'relative' }}>
              {[
                {
                  label: 'Frame Analysis',
                  description: 'Examining your feed, each screenshot is reviewed for the content that was shown to you',
                  active: analysis.progress.stage === 'ANALYZING',
                  done: ['DEDUPLICATING', 'BUILDING', 'SAVING', 'COMPLETE'].includes(analysis.progress.stage),
                },
                {
                  label: 'Deduplication',
                  description: 'Filtering duplicate posts across frames to build a clean picture of your unique feed content',
                  active: analysis.progress.stage === 'DEDUPLICATING',
                  done: ['BUILDING', 'SAVING', 'COMPLETE'].includes(analysis.progress.stage),
                },
                {
                  label: 'Report Building',
                  description: 'Compiling your personalized feed report, ads, sources, tone, and content patterns all in one place',
                  active: analysis.progress.stage === 'BUILDING' || analysis.progress.stage === 'SAVING',
                  done: analysis.progress.stage === 'COMPLETE',
                },
              ].map((step, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    gap: SPACING.sm,
                    marginBottom: index < 2 ? SPACING.lg : 0,
                    opacity: step.done ? 0.5 : 1,
                    position: 'relative',
                  }}
                >
                  {/* Connector line between steps */}
                  {index < 2 && (
                    <View
                      style={{
                        position: 'absolute',
                        left: 9,
                        top: 20,
                        width: 2,
                        height: SPACING.lg - SPACING.sm,
                        backgroundColor: colors.borderLight,
                      }}
                    />
                  )}
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: RADIUS.md,
                      backgroundColor: step.active
                        ? colors.primaryBlue
                        : step.done
                          ? colors.accentGreen
                          : colors.bgPage,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: step.active || step.done ? 0 : 1,
                      borderColor: colors.borderSoft,
                      marginTop: 1,
                      zIndex: 1,
                    }}
                  >
                    {step.done && (
                      <Text
                        variant="captionSmall"
                        color={colors.textInverse}
                      >
                        ✓
                      </Text>
                    )}
                    {step.active && (
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: RADIUS.xs,
                          backgroundColor: colors.textInverse,
                        }}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="labelBold"
                      color={step.active ? colors.textMain : colors.textSecondary}
                    >
                      {step.label}
                    </Text>
                    <Text
                      variant="caption"
                      color={colors.textMuted}
                      style={{ marginTop: SPACING.xxs }}
                    >
                      {step.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Privacy note */}
        <View style={{ marginTop: 'auto', paddingTop: SPACING.xl }}>
          <Text
            variant="captionSmall"
            color={colors.textTertiary}
            align="center"
          >
            Frames are sent to Google's Gemini AI for analysis. No personal account
            credentials are shared. Results are stored in your AlgorithmLens account.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
