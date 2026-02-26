/**
 * AnalysisProgress — Visual progress indicator for the Gemini analysis pipeline.
 *
 * Renders a card showing:
 * - Current stage with animated icon
 * - Progress bar with percentage
 * - Status message with frame count
 * - Elapsed time
 * - Stats summary (items found, frames processed)
 * - Cancel button during analysis
 * - "View Results" button on completion
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, AccessibilityInfo as RNAccessibilityInfo, Platform, StyleSheet } from 'react-native';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Loader,
  Eye,
  Layers,
  Save,
  Brain,
} from 'lucide-react-native';
import { triggerNotificationSuccess, triggerNotificationError } from '../../lib/haptics';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS, COLORS } from '../../lib/theme';
import type { PipelineProgress, PipelineStage } from '../../lib/analysis/broadcastAnalysisPipeline';

interface AnalysisProgressProps {
  progress: PipelineProgress;
  statusMessage: string;
  progressPercent: number;
  isRunning: boolean;
  onCancel: () => void;
  onViewResults: () => void;
  onRetry: () => void;
}

export const AnalysisProgress = React.memo(function AnalysisProgress({
  progress,
  statusMessage,
  progressPercent,
  isRunning,
  onCancel,
  onViewResults,
  onRetry,
}: AnalysisProgressProps) {
  const { colors } = useTheme();

  // Animated spinner for active stages
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Spin animation for the loader
  useEffect(() => {
    if (isRunning) {
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spin.start();
      return () => spin.stop();
    }
  }, [isRunning, spinAnim]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent / 100,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progressPercent, progressAnim]);

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Haptic on completion
  useEffect(() => {
    if (progress.stage === 'COMPLETE') {
      triggerNotificationSuccess();
    } else if (progress.stage === 'FAILED') {
      triggerNotificationError();
    }
  }, [progress.stage]);

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const stageInfo = STAGE_CONFIG[progress.stage];

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: progress.stage === 'COMPLETE'
          ? colors.accentGreen
          : progress.stage === 'FAILED'
            ? colors.errorBright
            : colors.borderSoft,
      }}
    >
      {/* Stage Icon + Message */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: stageInfo.bgColor(colors),
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
          }}
        >
          {isRunning ? (
            <Animated.View
              style={Platform.OS === 'web'
                ? {
                    transform: `rotate(${spinRotation.__getValue ? spinRotation.__getValue() : 0}deg)`,
                  }
                : {
                    transform: [{ rotate: spinRotation }],
                  }
              }
            >
              <StageIcon stage={progress.stage} color={stageInfo.iconColor(colors)} />
            </Animated.View>
          ) : (
            <StageIcon stage={progress.stage} color={stageInfo.iconColor(colors)} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...TYPOGRAPHY.body,
              fontWeight: '600',
              color: colors.textMain,
              fontSize: 15,
            }}
          >
            {stageInfo.title}
          </Text>
          <Text
            style={{
              ...TYPOGRAPHY.body,
              fontSize: 13,
              color: colors.textSecondary,
              marginTop: 2,
            }}
            accessibilityLiveRegion="polite"
            accessible={true}
          >
            {statusMessage}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {progress.stage !== 'FAILED' && (
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.bgPage,
            marginBottom: SPACING.md,
            overflow: 'hidden',
          }}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: progressPercent,
          }}
          accessibilityLabel={`Progress: ${progressPercent}%`}
        >
          <Animated.View
            style={{
              height: '100%',
              borderRadius: 3,
              backgroundColor:
                progress.stage === 'COMPLETE'
                  ? colors.accentGreen
                  : colors.primaryBlue,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>
      )}

      {/* Stats Row */}
      {(progress.itemsExtracted > 0 || progress.currentFrame > 0) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: SPACING.md,
            paddingHorizontal: SPACING.xs,
          }}
        >
          <StatItem
            label="Frames"
            value={`${progress.currentFrame}/${progress.totalFrames}`}
            colors={colors}
          />
          <StatItem
            label="Items Found"
            value={String(progress.itemsExtracted)}
            colors={colors}
          />
          {progress.itemsDeduplicated > 0 && progress.itemsDeduplicated !== progress.itemsExtracted && (
            <StatItem
              label="After Dedup"
              value={String(progress.itemsDeduplicated)}
              colors={colors}
            />
          )}
          <StatItem
            label="Time"
            value={formatElapsed(progress.elapsedMs)}
            colors={colors}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        {isRunning && (
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cancel analysis"
            style={{
              flex: 1,
              borderRadius: RADIUS.md,
              paddingVertical: 12,
              minHeight: 44,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary }}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}

        {progress.stage === 'COMPLETE' && (
          <TouchableOpacity
            onPress={onViewResults}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="View analysis results"
            style={{
              flex: 1,
              backgroundColor: colors.primaryBlue,
              borderRadius: RADIUS.md,
              paddingVertical: 12,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.white }}>
              View Results
            </Text>
          </TouchableOpacity>
        )}

        {progress.stage === 'FAILED' && (
          <>
            <TouchableOpacity
              onPress={onRetry}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Retry analysis"
              style={{
                flex: 1,
                backgroundColor: colors.primaryBlue,
                borderRadius: RADIUS.md,
                paddingVertical: 12,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.white }}>
                Retry Analysis
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Animated.View>
  );
});

AnalysisProgress.displayName = 'AnalysisProgress';

// ============================================
// Sub-components
// ============================================

function StageIcon({ stage, color }: { stage: PipelineStage; color: string }) {
  const size = 20;
  const strokeWidth = 2;

  switch (stage) {
    case 'PREPARING':
      return <Loader size={size} color={color} strokeWidth={strokeWidth} />;
    case 'ANALYZING':
      return <Brain size={size} color={color} strokeWidth={strokeWidth} />;
    case 'DEDUPLICATING':
      return <Layers size={size} color={color} strokeWidth={strokeWidth} />;
    case 'BUILDING':
      return <Sparkles size={size} color={color} strokeWidth={strokeWidth} />;
    case 'SAVING':
      return <Save size={size} color={color} strokeWidth={strokeWidth} />;
    case 'COMPLETE':
      return <CheckCircle size={size} color={color} strokeWidth={strokeWidth} />;
    case 'FAILED':
      return <XCircle size={size} color={color} strokeWidth={strokeWidth} />;
    default:
      return <Eye size={size} color={color} strokeWidth={strokeWidth} />;
  }
}

function StatItem({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.textMain,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ============================================
// Stage Configuration
// ============================================

interface StageDisplayConfig {
  title: string;
  bgColor: (colors: ReturnType<typeof useTheme>['colors']) => string;
  iconColor: (colors: ReturnType<typeof useTheme>['colors']) => string;
}

const STAGE_CONFIG: Record<PipelineStage, StageDisplayConfig> = {
  PREPARING: {
    title: 'Preparing',
    bgColor: (c) => c.blue50,
    iconColor: (c) => c.primaryBlue,
  },
  ANALYZING: {
    title: 'Analyzing Frames',
    bgColor: (c) => c.blue50,
    iconColor: (c) => c.primaryBlue,
  },
  DEDUPLICATING: {
    title: 'Removing Duplicates',
    bgColor: (c) => c.blue50,
    iconColor: (c) => c.primaryBlue,
  },
  BUILDING: {
    title: 'Building Report',
    bgColor: (c) => c.blue50,
    iconColor: (c) => c.primaryBlue,
  },
  SAVING: {
    title: 'Saving Results',
    bgColor: (c) => c.blue50,
    iconColor: (c) => c.primaryBlue,
  },
  COMPLETE: {
    title: 'Analysis Complete',
    bgColor: (c) => c.successBgLight,
    iconColor: (c) => c.accentGreen,
  },
  FAILED: {
    title: 'Analysis Failed',
    bgColor: (c) => c.errorLight,
    iconColor: (c) => c.errorBright,
  },
};

// ============================================
// Helpers
// ============================================

function formatElapsed(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}
