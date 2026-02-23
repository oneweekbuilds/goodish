import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../lib/theme';
import { MIN_POSTS_GOOD, MIN_POSTS_OK } from '../../config/thresholds';

interface ScanOverlayProps {
  postCount: number;
  adCount: number;
  startTime: number; // M4: single source of truth
  onDone: () => void;
}

function getQualityIndicator(postCount: number, colors: ReturnType<typeof useTheme>['colors']): {
  label: string;
  color: string;
} {
  if (postCount >= MIN_POSTS_GOOD) {
    return { label: 'Good sample', color: colors.accentGreen };
  } else if (postCount >= MIN_POSTS_OK) {
    return { label: 'Getting there', color: colors.warning };
  } else {
    return { label: `${MIN_POSTS_OK - postCount} more for good data`, color: colors.error };
  }
}

// M1 & M5: Better button copy
function getButtonLabel(postCount: number): string {
  if (postCount >= 10) return 'Done — Save Scan';
  if (postCount >= 5) return `Save (${postCount} posts) — or keep scrolling`;
  return `Scroll past ${Math.max(5 - postCount, 0)} more posts to save`;
}

export const ScanOverlay: React.FC<ScanOverlayProps> = React.memo(({
  postCount,
  adCount,
  startTime,
  onDone,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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

  const quality = getQualityIndicator(postCount, colors);

  // Minimized mode — small floating pill (L1: white dot on blue)
  if (minimized) {
    return (
      <TouchableOpacity
        onPress={() => setMinimized(false)}
        activeOpacity={0.8}
        accessibilityLabel={`Scan progress: ${postCount} posts captured, ${timeString} elapsed. Tap to expand.`}
        accessibilityRole="button"
        style={{
          position: 'absolute',
          bottom: insets.bottom + SPACING.lg,
          right: SPACING.lg,
          backgroundColor: colors.primaryBlue,
          borderRadius: RADIUS['2xl'],
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
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
        backgroundColor: colors.scanOverlayBg,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.lg + insets.bottom,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Quality indicator + minimize button */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: quality.color,
          }} />
          <Text style={{
            ...TYPOGRAPHY.caption,
            fontWeight: '600',
            color: quality.color,
          }}>
            {quality.label}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setMinimized(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Minimize scan overlay"
          accessibilityRole="button"
        >
          <Text style={{ fontSize: TYPOGRAPHY.caption.fontSize, color: colors.textSecondary }}>
            Minimize
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.lg,
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
            <Text style={{ ...TYPOGRAPHY.h2, color: colors.warning }}>
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

      {/* Done Button — M1: better labels, still tappable at 5+ */}
      <Button
        title={getButtonLabel(postCount)}
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onDone();
        }}
        variant="primary"
        size="lg"
        style={{ width: '100%' }}
        disabled={postCount < 5}
        accessibilityLabel={postCount < 5 ? `Need ${5 - postCount} more posts to save scan` : `Save scan with ${postCount} posts`}
      />
    </View>
  );
});
