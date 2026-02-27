import { triggerNotificationSuccess } from '../../lib/haptics';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../lib/theme';
import { MIN_POSTS_REQUIRED, MIN_SCAN_DURATION_SECS } from '../../config/thresholds';

interface ScanOverlayProps {
  postCount: number;
  adCount: number;
  startTime: number; // M4: single source of truth
  onDone: () => void;
}

/**
 * Returns a milestone message based on current post count and elapsed time.
 * Encouraging framing to motivate users to keep scrolling.
 */
function getMilestoneMessage(postCount: number, elapsedSecs: number, colors: ReturnType<typeof useTheme>['colors']): {
  label: string;
  color: string;
} {
  const postsMet = postCount >= MIN_POSTS_REQUIRED;
  const timeMet = elapsedSecs >= MIN_SCAN_DURATION_SECS;

  if (postsMet && timeMet) {
    if (postCount >= 50) {
      return { label: 'Excellent! This will give you very detailed insights.', color: colors.accentGreen };
    }
    if (postCount >= 30) {
      return { label: 'Great sample! Save anytime.', color: colors.accentGreen };
    }
    if (elapsedSecs >= 120) {
      return { label: 'Great session length! Your results will be comprehensive.', color: colors.accentGreen };
    }
    return { label: 'Good start! Keep going for better accuracy.', color: colors.accentGreen };
  }

  if (postCount >= 1) {
    return { label: 'Keep scrolling — building your sample', color: colors.primaryBlue };
  }

  return { label: 'Start scrolling to capture posts', color: colors.primaryBlue };
}

/**
 * Returns the button label based on threshold state.
 */
function getButtonLabel(postCount: number, elapsedSecs: number): string {
  const postsMet = postCount >= MIN_POSTS_REQUIRED;
  const timeMet = elapsedSecs >= MIN_SCAN_DURATION_SECS;

  if (postsMet && timeMet) {
    if (postCount >= 30) return 'Save scan — great sample!';
    return 'Save scan — good to go!';
  }

  // Show which requirement(s) are missing
  const needs: string[] = [];
  if (!postsMet) needs.push(`${MIN_POSTS_REQUIRED - postCount} more post${MIN_POSTS_REQUIRED - postCount !== 1 ? 's' : ''}`);
  if (!timeMet) {
    const secsLeft = MIN_SCAN_DURATION_SECS - elapsedSecs;
    needs.push(`${secsLeft}s more`);
  }
  return `Keep scrolling — ${needs.join(' & ')} needed`;
}

export const ScanOverlay: React.FC<ScanOverlayProps> = React.memo(({
  postCount,
  adCount,
  startTime,
  onDone,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const [minimized, setMinimized] = useState(false);
  const [, forceUpdate] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use useRef-based timer to update display without full re-renders
  useEffect(() => {
    timerRef.current = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-minimize after 8s so users see more of their feed
  useEffect(() => {
    const autoMinTimer = setTimeout(() => {
      if (!minimized) setMinimized(true);
    }, 8000);
    return () => clearTimeout(autoMinTimer);
  }, []);

  // M4: Compute time from single source of truth (startTime prop)
  const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsedSecs / 60);
  const seconds = elapsedSecs % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Threshold checks
  const postsMet = postCount >= MIN_POSTS_REQUIRED;
  const timeMet = elapsedSecs >= MIN_SCAN_DURATION_SECS;
  const canSave = postsMet && timeMet;

  const milestone = getMilestoneMessage(postCount, elapsedSecs, colors);

  // Progress bar percentages (capped at 100%)
  const postProgress = Math.min(postCount / MIN_POSTS_REQUIRED, 1);
  const timeProgress = Math.min(elapsedSecs / MIN_SCAN_DURATION_SECS, 1);

  // Format time requirement display
  const timeReqMinutes = Math.floor(MIN_SCAN_DURATION_SECS / 60);
  const timeReqSeconds = MIN_SCAN_DURATION_SECS % 60;
  const timeReqString = timeReqSeconds > 0
    ? `${timeReqMinutes}:${timeReqSeconds.toString().padStart(2, '0')}`
    : `${timeReqMinutes}:00`;

  // Minimized mode — small floating pill (L1: white dot on blue)
  if (minimized) {
    return (
      <TouchableOpacity
        onPress={() => setMinimized(false)}
        activeOpacity={0.8}
        accessibilityLabel={`Scan progress: ${postCount} posts captured, ${timeString} elapsed. ${canSave ? 'Ready to save.' : 'Keep scrolling.'} Tap to expand.`}
        accessibilityRole="button"
        style={{
          position: 'absolute',
          bottom: insets.bottom + SPACING.lg,
          right: SPACING.lg,
          backgroundColor: canSave ? colors.accentGreen : colors.primaryBlue,
          borderRadius: RADIUS['2xl'],
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          ...shadows.lg,
        }}
      >
        <View style={{
          width: 8,
          height: 8,
          borderRadius: RADIUS.xs,
          backgroundColor: colors.white,
        }} />
        <Text style={{ ...TYPOGRAPHY.labelBold, color: colors.white }}>
          {postCount}
        </Text>
        <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: colors.whiteOverlay85 }}>
          {timeString}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        // L-05 FIX: More compact panel with higher opacity to prevent overlap with content
        backgroundColor: colors.scanOverlayBg,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm + insets.bottom,
        ...shadows.lg,
      }}
    >
      {/* Milestone indicator + minimize button — L-05: tighter spacing */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          flex: 1,
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: RADIUS.xs,
            backgroundColor: milestone.color,
          }} />
          <Text style={{
            ...TYPOGRAPHY.caption,
            fontWeight: '600',
            color: milestone.color,
            flex: 1,
          }} numberOfLines={2}>
            {canSave
              ? 'Great sample! You can save now or keep scrolling for richer insights.'
              : milestone.label}
          </Text>
        </View>
        {/* M-21 FIX: "Hide panel" with note about continued scanning */}
        <TouchableOpacity
          onPress={() => setMinimized(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Hide panel — scanning continues in the background"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: colors.textSecondary }}>
            Hide panel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instruction hint for new users */}
      {postCount < MIN_POSTS_REQUIRED && (
        <Text
          style={{
            ...TYPOGRAPHY.caption,
            color: colors.textSecondary,
            marginBottom: SPACING.xs,
          }}
          accessibilityLiveRegion="polite"
        >
          Scroll through your feed — posts are captured automatically as they appear.
        </Text>
      )}

      {/* Progress indicators — posts and time — L-05: reduced margins */}
      <View style={{ marginBottom: SPACING.sm, gap: SPACING.xs }}>
        {/* Posts progress */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
            <Text style={{ ...TYPOGRAPHY.caption, fontWeight: '600', color: postsMet ? colors.accentGreen : colors.textMain }}>
              Posts: {postCount}/{MIN_POSTS_REQUIRED}
            </Text>
            {postsMet && (
              <Text style={{ ...TYPOGRAPHY.caption, color: colors.accentGreen, fontWeight: '600' }}>✓</Text>
            )}
          </View>
          <View style={{
            height: 6,
            borderRadius: RADIUS.full,
            backgroundColor: colors.bgSecondary,
            overflow: 'hidden',
          }}>
            <View style={{
              height: '100%',
              width: `${Math.round(postProgress * 100)}%`,
              borderRadius: RADIUS.full,
              backgroundColor: postsMet ? colors.accentGreen : colors.primaryBlue,
            }} />
          </View>
        </View>

        {/* Time progress */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
            <Text style={{ ...TYPOGRAPHY.caption, fontWeight: '600', color: timeMet ? colors.accentGreen : colors.textMain }}>
              Time: {timeString}/{timeReqString}
            </Text>
            {timeMet && (
              <Text style={{ ...TYPOGRAPHY.caption, color: colors.accentGreen, fontWeight: '600' }}>✓</Text>
            )}
          </View>
          <View style={{
            height: 6,
            borderRadius: RADIUS.full,
            backgroundColor: colors.bgSecondary,
            overflow: 'hidden',
          }}>
            <View style={{
              height: '100%',
              width: `${Math.round(timeProgress * 100)}%`,
              borderRadius: RADIUS.full,
              backgroundColor: timeMet ? colors.accentGreen : colors.primaryBlue,
            }} />
          </View>
        </View>
      </View>

      {/* Stats Row — ads count + timer — L-05: reduced margin */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs }}>
            <Text style={{ ...TYPOGRAPHY.h2, color: colors.primaryBlue }}>
              {postCount}
            </Text>
            <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: colors.textMuted }}>
              posts
            </Text>
          </View>

          <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: colors.separator }}>|</Text>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs }}>
            <Text style={{ ...TYPOGRAPHY.h2, color: colors.primaryBlue }}>
              {adCount}
            </Text>
            <Text style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: colors.textMuted }}>
              ads
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.timerBg,
            borderRadius: RADIUS.sm,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.xs,
          }}
        >
          <Text
            style={{ ...TYPOGRAPHY.labelBold, color: colors.textMuted, fontVariant: ['tabular-nums'] }}
          >
            {timeString}
          </Text>
        </View>
      </View>

      {/* Done Button — disabled until both thresholds met */}
      <Button
        title={getButtonLabel(postCount, elapsedSecs)}
        onPress={() => {
          triggerNotificationSuccess();
          onDone();
        }}
        variant="primary"
        size="lg"
        style={{ width: '100%' }}
        disabled={!canSave}
        accessibilityLabel={
          canSave
            ? `Save scan with ${postCount} posts`
            : `Cannot save yet — need ${!postsMet ? `${MIN_POSTS_REQUIRED - postCount} more posts` : ''}${!postsMet && !timeMet ? ' and ' : ''}${!timeMet ? `${MIN_SCAN_DURATION_SECS - elapsedSecs} more seconds` : ''}`
        }
      />
    </View>
  );
});
