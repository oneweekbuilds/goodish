import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../ui/Button';
import { COLORS, RADIUS } from '../../lib/theme';

interface ScanOverlayProps {
  postCount: number;
  adCount: number;
  startTime: number; // M4: single source of truth
  onDone: () => void;
}

function getQualityIndicator(postCount: number): {
  label: string;
  color: string;
} {
  if (postCount >= 20) {
    return { label: 'Good sample', color: COLORS.accentGreen };
  } else if (postCount >= 10) {
    return { label: 'Keep scrolling', color: COLORS.warning };
  } else {
    return { label: `${10 - postCount} more for good data`, color: COLORS.error };
  }
}

// M1 & M5: Better button copy
function getButtonLabel(postCount: number): string {
  if (postCount >= 10) return 'Done — Save Scan';
  if (postCount >= 5) return `Save (${postCount} posts) — or keep scrolling`;
  return `Scroll past ${Math.max(5 - postCount, 0)} more posts to save`;
}

export const ScanOverlay: React.FC<ScanOverlayProps> = ({
  postCount,
  adCount,
  startTime,
  onDone,
}) => {
  const insets = useSafeAreaInsets();
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

  // M4: Compute time from single source of truth (startTime prop)
  const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsedSecs / 60);
  const seconds = elapsedSecs % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const quality = getQualityIndicator(postCount);

  // Minimized mode — small floating pill (L1: white dot on blue)
  if (minimized) {
    return (
      <TouchableOpacity
        onPress={() => setMinimized(false)}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 16,
          right: 16,
          backgroundColor: COLORS.primaryBlue,
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
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
          backgroundColor: '#FFFFFF',
        }} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
          {postCount}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
          {timeString}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14 + insets.bottom,
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
        marginBottom: 10,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: quality.color,
          }} />
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: quality.color,
          }}>
            {quality.label}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setMinimized(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
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
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryBlue }}>
              {postCount}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted }}>
              posts
            </Text>
          </View>

          <Text style={{ fontSize: 13, color: '#D1D5DB' }}>|</Text>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.warning }}>
              {adCount}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted }}>
              ads
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{ fontSize: 14, fontWeight: '600', color: COLORS.textMuted, fontVariant: ['tabular-nums'] }}
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
      />
    </View>
  );
};
