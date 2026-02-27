/**
 * BroadcastOverlay — Recording status UI for active broadcast sessions.
 *
 * This component is shown as a floating overlay when the user returns
 * to AlgorithmLens during (or after) a broadcast capture session.
 *
 * States rendered:
 * - AWAITING_BROADCAST_START: Instructions to tap the broadcast picker
 * - RECORDING: Live recording indicator, frame count, elapsed time, stop hint
 * - PROCESSING: Brief processing state
 * - COMPLETE: Summary with frame count, duration, and "View Results" CTA
 * - FAILED: Error message with retry option
 * - CANCELLED: Session was cancelled
 *
 * Design: Calm, minimal card that floats above the content.
 * Uses the app's theme system for consistent styling.
 */

import { triggerImpactMedium } from '../../lib/haptics';
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import {
  Radio,
  StopCircle,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS, COLORS } from '../../lib/theme';
import type { BroadcastStatus } from '../../types/broadcast';
import { PLATFORM_BROADCAST_CONFIGS, type SupportedPlatform } from '../../types/broadcast';

interface BroadcastOverlayProps {
  /** Current broadcast status. */
  status: BroadcastStatus;
  /** Platform being scanned. */
  platform: SupportedPlatform;
  /** Number of unique frames captured. */
  frameCount: number;
  /** Formatted elapsed time string (e.g., "2:35"). */
  elapsedTime: string;
  /** Elapsed time in raw seconds (for threshold checks). */
  elapsedSeconds?: number;
  /** Storage used in bytes. */
  storageUsed: number;
  /** Error message if session failed. */
  errorMessage?: string | null;
  /** Whether minimum thresholds are met to save. */
  canSave?: boolean;
  /** Called when user taps "Stop Recording". */
  onStop: () => void;
  /** Called when user taps "Cancel". */
  onCancel: () => void;
  /** Called when user taps "View Results" after completion. */
  onViewResults: () => void;
  /** Called when user taps "Open [Platform]" to launch the target app. */
  onOpenPlatform: () => void;
  /** Called when user taps "Try Again" after failure. */
  onRetry: () => void;
}

export const BroadcastOverlay = React.memo(function BroadcastOverlayComponent({
  status,
  platform,
  frameCount,
  elapsedTime,
  storageUsed,
  errorMessage,
  onStop,
  onCancel,
  onViewResults,
  onOpenPlatform,
  onRetry,
}: BroadcastOverlayProps) {
  const { colors, shadows } = useTheme();
  const platformName = PLATFORM_BROADCAST_CONFIGS[platform]?.display_name ?? platform;
  const thresholdsMet = canSave ?? true;

  // Pulsing animation for recording indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'RECORDING') {
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
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderContent = () => {
    switch (status) {
      case 'INITIALIZING':
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.statusText, { color: colors.textMuted }]}>
              Preparing broadcast session...
            </Text>
          </View>
        );

      case 'AWAITING_BROADCAST_START':
        return (
          <View style={styles.contentSection}>
            <View style={styles.instructionRow}>
              <Radio size={18} color={colors.primaryBlue} strokeWidth={2} />
              <Text style={[styles.instructionText, { color: colors.textMain }]}>
                Tap the broadcast button above to start recording
              </Text>
            </View>
            <Text
              style={[styles.hintText, { color: colors.textSecondary }]}
              accessibilityLiveRegion="polite"
            >
              Once recording starts, open {platformName} and scroll your feed normally.
            </Text>
            <TouchableOpacity
              onPress={onOpenPlatform}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Open ${platformName}`}
              style={[styles.secondaryButton, { borderColor: colors.borderSlate200, minHeight: 44 }]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primaryBlue }]}>
                Open {platformName}
              </Text>
              <ArrowRight size={14} color={colors.primaryBlue} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel broadcast session"
              style={{ minHeight: 44 }}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'RECORDING':
        return (
          <View style={styles.contentSection}>
            {/* Recording indicator */}
            <View style={styles.recordingRow}>
              <Animated.View
                style={Platform.OS === 'web' ? {
                  ...styles.recordingDot,
                  backgroundColor: colors.recordingDot,
                  opacity: 1,
                } : [
                  styles.recordingDot,
                  { backgroundColor: colors.recordingDot, opacity: pulseAnim },
                ]}
              />
              <Text style={[styles.recordingLabel, { color: colors.textMain }]}>
                Recording
              </Text>
            </View>

            {/* Stats row */}
            <View
              style={styles.statsRow}
              accessibilityLiveRegion="polite"
              accessible={true}
              accessibilityLabel={`Broadcast recording: ${frameCount} frames captured, ${elapsedTime} elapsed`}
            >
              <View style={styles.statItem}>
                <Layers size={14} color={colors.primaryBlue} strokeWidth={2} />
                <Text style={[styles.statValue, { color: colors.textMain }]}>
                  {frameCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  frames
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Clock size={14} color={colors.primaryBlue} strokeWidth={2} />
                <Text style={[styles.statValue, { color: colors.textMain }]}>
                  {elapsedTime}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  elapsed
                </Text>
              </View>
              {storageUsed > 0 && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.textMain }]}>
                      {formatBytes(storageUsed)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Scroll your {platformName} feed normally. Come back here when you're done.
            </Text>

            {/* Threshold status hint */}
            {!thresholdsMet && (
              <Text style={[styles.hintText, { color: colors.warning, fontWeight: '500' }]}>
                Keep recording — more frames and time needed for accurate analysis.
              </Text>
            )}

            {/* Action buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={onOpenPlatform}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Open ${platformName} in another app`}
                style={[styles.secondaryButton, { borderColor: colors.borderSlate200, flex: 1, minHeight: 44 }]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primaryBlue }]}>
                  Open {platformName}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  triggerImpactMedium();
                  onStop();
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Stop recording broadcast"
                style={[styles.stopButton, { backgroundColor: colors.stopButtonBg }]}
              >
                <StopCircle size={16} color={colors.errorBright} strokeWidth={2} />
                <Text style={[styles.stopButtonText, { color: colors.stopButtonText }]}>
                  Stop
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'PROCESSING':
        return (
          <View style={styles.contentSection}>
            <Text style={[styles.statusText, { color: colors.textMain }]}>
              Processing captured frames...
            </Text>
            <Text style={[styles.hintText, { color: colors.textMuted }]}>
              {frameCount} frames captured in {elapsedTime}
            </Text>
          </View>
        );

      case 'COMPLETE':
        return (
          <View style={styles.contentSection}>
            <View style={styles.completeHeader}>
              <CheckCircle size={20} color={colors.accentGreen} strokeWidth={2} />
              <Text style={[styles.completeTitle, { color: colors.textMain }]}>
                Broadcast complete
              </Text>
            </View>
            <Text style={[styles.completeSummary, { color: colors.textSecondary }]}>
              Captured {frameCount} unique frames in {elapsedTime} from {platformName}.
              {storageUsed > 0 ? ` (${formatBytes(storageUsed)})` : ''}
            </Text>
            <TouchableOpacity
              onPress={() => {
                triggerImpactMedium();
                onViewResults();
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View analysis results"
              style={[styles.primaryButton, { backgroundColor: colors.primaryBlue, minHeight: 44 }]}
            >
              <Text style={styles.primaryButtonText}>
                View Results
              </Text>
              <ArrowRight size={16} color={colors.textInverse} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        );

      case 'FAILED':
        return (
          <View style={styles.contentSection}>
            <View style={styles.completeHeader}>
              <AlertCircle size={20} color={colors.error} strokeWidth={2} />
              <Text style={[styles.completeTitle, { color: colors.textMain }]}>
                Broadcast ended
              </Text>
            </View>
            <Text style={[styles.completeSummary, { color: colors.textSecondary }]}>
              {errorMessage || 'The broadcast session ended unexpectedly.'}
              {frameCount > 0
                ? ` ${frameCount} frames were captured before it ended.`
                : ''}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={onRetry}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Retry broadcast session"
                style={[styles.primaryButton, { backgroundColor: colors.primaryBlue, flex: 1, minHeight: 44 }]}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {frameCount > 0 && (
                <TouchableOpacity
                  onPress={onViewResults}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="View partial results from captured frames"
                  style={[styles.secondaryButton, { borderColor: colors.borderSlate200, flex: 1, minHeight: 44 }]}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.primaryBlue }]}>
                    View Partial Results
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 'CANCELLED':
        return (
          <View style={styles.contentSection}>
            <View style={styles.completeHeader}>
              <XCircle size={20} color={colors.textMuted} strokeWidth={2} />
              <Text style={[styles.completeTitle, { color: colors.textMain }]}>
                Session cancelled
              </Text>
            </View>
            <TouchableOpacity
              onPress={onRetry}
              activeOpacity={0.7}
              style={[styles.secondaryButton, { borderColor: colors.borderSlate200 }]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primaryBlue }]}>
                Start a new session
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={Platform.OS === 'web' ? {
        ...styles.container,
        backgroundColor: colors.bgCard,
        borderColor: status === 'RECORDING' ? colors.recordingBorder : colors.borderLight,
        ...shadows.hero,
      } : [
        styles.container,
        {
          backgroundColor: colors.bgCard,
          borderColor: status === 'RECORDING' ? colors.recordingBorder : colors.borderLight,
          ...shadows.hero,
        },
      ]}
    >
      {renderContent()}
    </View>
  );
});

BroadcastOverlay.displayName = 'BroadcastOverlay';

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    marginHorizontal: SPACING.md,
  },
  contentSection: {
    gap: SPACING.md,
  },
  statusText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  instructionText: {
    ...TYPOGRAPHY.buttonMd,
    flex: 1,
  },
  hintText: {
    fontSize: TYPOGRAPHY.bodySmall.fontSize,
    lineHeight: TYPOGRAPHY.bodySmall.lineHeight,
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    paddingVertical: SPACING.xs,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.sm,
  },
  recordingLabel: {
    ...TYPOGRAPHY.buttonMd,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.labelBold,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption.fontSize,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.labelBold,
    color: COLORS.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.labelBold,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },
  stopButtonText: {
    ...TYPOGRAPHY.labelBold,
  },
  completeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  completeTitle: {
    ...TYPOGRAPHY.h3,
  },
  completeSummary: {
    fontSize: TYPOGRAPHY.bodySmall.fontSize,
    lineHeight: TYPOGRAPHY.bodySmall.lineHeight,
  },
});
