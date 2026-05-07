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
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Radio,
  StopCircle,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { SPACING, RADIUS, ICON_SIZES, MIN_TOUCH_TARGET } from '../../lib/theme';
import { Text } from '../glue';
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
  canSave,
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

  const renderContent = () => {
    switch (status) {
      case 'INITIALIZING':
        return (
          <View style={styles.contentSection}>
            <Text
              variant="body"
              color={colors.textMuted}
              align="center"
            >
              Preparing broadcast session...
            </Text>
          </View>
        );

      case 'AWAITING_BROADCAST_START':
        return (
          <View style={styles.contentSection}>
            <View style={styles.instructionRow}>
              <Radio size={18} color={colors.primaryBlue} strokeWidth={2} />
              <Text
                variant="buttonMd"
                color={colors.textMain}
                style={{ flex: 1 }}
              >
                Tap the broadcast button above to start recording
              </Text>
            </View>
            <Text
              variant="bodySmall"
              color={colors.textSecondary}
              accessibilityLiveRegion="polite"
            >
              Once recording starts, open {platformName} and scroll your feed normally.
            </Text>
            <TouchableOpacity
              onPress={onOpenPlatform}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Open ${platformName}`}
              style={[styles.secondaryButton, { borderColor: colors.borderSlate200, minHeight: MIN_TOUCH_TARGET }]}
            >
              <Text
                variant="labelBold"
                color={colors.primaryBlue}
              >
                Open {platformName}
              </Text>
              <ArrowRight size={14} color={colors.primaryBlue} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel broadcast session"
              style={{ minHeight: MIN_TOUCH_TARGET }}
            >
              <Text
                variant="body"
                color={colors.textMuted}
                align="center"
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'RECORDING':
        return (
          <View style={styles.contentSection}>
            {/* Hero: pulsing dot + elapsed time */}
            <View style={{ alignItems: 'center', gap: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
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
                <Text
                  variant="h2"
                  color={colors.textMain}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {elapsedTime}
                </Text>
              </View>
              <Text
                variant="bodySmall"
                color={colors.textSecondary}
                align="center"
              >
                {frameCount} frames captured from {platformName}
              </Text>
              {!thresholdsMet && (
                <Text
                  variant="caption"
                  color={colors.warning}
                  align="center"
                >
                  Keep scrolling, need more data for accurate analysis
                </Text>
              )}
            </View>

            {/* Actions: stop (primary, full-width) + back to platform (secondary) */}
            <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
              <TouchableOpacity
                onPress={() => {
                  triggerImpactMedium();
                  onStop();
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Stop recording broadcast"
                style={[styles.primaryButton, {
                  backgroundColor: colors.stopButtonBg,
                  minHeight: 48,
                }]}
              >
                <StopCircle size={16} color={colors.errorBright} strokeWidth={2} />
                <Text
                  variant="labelBold"
                  color={colors.stopButtonText}
                >
                  Stop Recording
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onOpenPlatform}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Open ${platformName} in another app`}
                style={[styles.secondaryButton, { borderColor: colors.borderSlate200, minHeight: MIN_TOUCH_TARGET }]}
              >
                <Text
                  variant="labelBold"
                  color={colors.primaryBlue}
                >
                  Back to {platformName}
                </Text>
                <ArrowRight size={14} color={colors.primaryBlue} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'PROCESSING':
        return (
          <View style={styles.contentSection}>
            <Text
              variant="body"
              color={colors.textMain}
              align="center"
            >
              Processing {frameCount} frames...
            </Text>
          </View>
        );

      case 'COMPLETE':
        return (
          <View style={styles.contentSection}>
            <View style={styles.completeHeader}>
              <CheckCircle size={20} color={colors.accentGreen} strokeWidth={2} />
              <Text
                variant="h3"
                color={colors.textMain}
              >
                Broadcast complete
              </Text>
            </View>
            <Text
              variant="bodySmall"
              color={colors.textSecondary}
            >
              {frameCount} frames captured in {elapsedTime}
            </Text>
            <TouchableOpacity
              onPress={() => {
                triggerImpactMedium();
                onViewResults();
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View analysis results"
              style={[styles.primaryButton, { backgroundColor: colors.primaryBlue, minHeight: MIN_TOUCH_TARGET }]}
            >
              <Text
                variant="labelBold"
                color={colors.textInverse}
              >
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
              <Text
                variant="h3"
                color={colors.textMain}
              >
                Broadcast ended
              </Text>
            </View>
            <Text
              variant="bodySmall"
              color={colors.textSecondary}
            >
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
                style={[styles.primaryButton, { backgroundColor: colors.primaryBlue, flex: 1, minHeight: MIN_TOUCH_TARGET }]}
              >
                <Text
                  variant="labelBold"
                  color={colors.textInverse}
                >
                  Try Again
                </Text>
              </TouchableOpacity>
              {frameCount > 0 && (
                <TouchableOpacity
                  onPress={onViewResults}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="View partial results from captured frames"
                  style={[styles.secondaryButton, { borderColor: colors.borderSlate200, flex: 1, minHeight: MIN_TOUCH_TARGET }]}
                >
                  <Text
                    variant="labelBold"
                    color={colors.primaryBlue}
                  >
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
              <Text
                variant="h3"
                color={colors.textMain}
              >
                Session cancelled
              </Text>
            </View>
            <TouchableOpacity
              onPress={onRetry}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Start a new session"
              style={[styles.secondaryButton, { borderColor: colors.borderSlate200 }]}
            >
              <Text
                variant="labelBold"
                color={colors.primaryBlue}
              >
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
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    marginHorizontal: SPACING.md,
  },
  contentSection: {
    gap: SPACING.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recordingDot: {
    width: ICON_SIZES.dot,
    height: ICON_SIZES.dot,
    borderRadius: RADIUS.sm,
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
  completeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});
