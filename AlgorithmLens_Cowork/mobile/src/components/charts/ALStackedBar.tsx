/**
 * ALStackedBar — 100% stacked horizontal bar with animated segments.
 *
 * Replaces the old StackedBar100.tsx with react-native-gifted-charts powered
 * stacked bar that includes animated segments, legend, and touch interactions.
 * Falls back to a custom implementation since gifted-charts stacked bars
 * work best vertically — we keep the horizontal 100% pattern the app uses.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, useWindowDimensions, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { Text, Skeleton, EmptyState } from '../glue';

// ─── Types ──────────────────────────────────────────────

export interface ALStackedBarSegment {
  label: string;
  percentage: number;
  count: number;
  color: string;
}

export interface ALStackedBarProps {
  /** Segment data — percentages should sum to ~100 */
  segments: ALStackedBarSegment[];
  /** Whether data is still loading */
  loading?: boolean;
  /** Message when data is empty */
  emptyMessage?: string;
  /** Optional summary label for screen readers */
  accessibilitySummary?: string;
  /** Height of the bar */
  barHeight?: number;
}

// ─── Constants ──────────────────────────────────────────

const MIN_VISIBLE_PCT = 3;

// ─── Legend Shape Component ─────────────────────────────

function LegendShape({ index, color }: { index: number; color: string }) {
  const shape = index % 4;
  switch (shape) {
    case 0:
      return <View style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: color }} />;
    case 1:
      return <View style={{ width: 10, height: 10, borderRadius: 1, backgroundColor: color }} />;
    case 2:
      return (
        <View style={{ width: 12, height: 12, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
        </View>
      );
    case 3:
      return (
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderBottomWidth: 10,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
          }}
        />
      );
    default:
      return <View style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: color }} />;
  }
}

// ─── Component ──────────────────────────────────────────

function ALStackedBarComponent({
  segments,
  loading = false,
  emptyMessage = 'No data available yet.',
  accessibilitySummary,
  barHeight = 36,
}: ALStackedBarProps) {
  const { colors } = useTheme();
  const [activeSegment, setActiveSegment] = React.useState<number | null>(null);
  const animValuesRef = useRef(segments.map(() => new Animated.Value(0)));

  useEffect(() => {
    const currentValues = animValuesRef.current;
    if (segments.length > currentValues.length) {
      animValuesRef.current = [
        ...currentValues,
        ...Array.from({ length: segments.length - currentValues.length }, () => new Animated.Value(0)),
      ];
    } else if (segments.length < currentValues.length) {
      animValuesRef.current = currentValues.slice(0, segments.length);
    }
  }, [segments.length]);

  useEffect(() => {
    const animations = segments.map((_, index) => {
      const animValue = animValuesRef.current[index];
      if (!animValue) return Animated.delay(0);
      return Animated.timing(animValue, {
        toValue: 1,
        duration: 800 + index * 100,
        useNativeDriver: false,
      });
    });
    Animated.stagger(50, animations).start();
  }, [segments]);

  // Compute visual percentages with minimum width enforcement
  const normalizedSegments = useMemo(() => {
    const visual = segments.map((seg) => ({
      ...seg,
      visualPct: seg.percentage === 0 ? 0 : Math.max(seg.percentage, MIN_VISIBLE_PCT),
    }));
    const total = visual.reduce((sum, s) => sum + s.visualPct, 0);
    return visual.map((s) => ({
      ...s,
      visualPct: total > 0 ? (s.visualPct / total) * 100 : 0,
    }));
  }, [segments]);

  // ─── Loading State ──────────────────────────────────
  if (loading) {
    return (
      <View style={{ gap: SPACING.md }}>
        <Skeleton width="100%" height={barHeight} borderRadius={RADIUS.md} />
        <View style={{ flexDirection: 'row', gap: SPACING.lg }}>
          <Skeleton width={60} height={14} borderRadius={RADIUS.xs} />
          <Skeleton width={60} height={14} borderRadius={RADIUS.xs} />
          <Skeleton width={60} height={14} borderRadius={RADIUS.xs} />
        </View>
      </View>
    );
  }

  // ─── Empty State ────────────────────────────────────
  if (!segments || segments.length === 0) {
    return <EmptyState icon="layers" message={emptyMessage} />;
  }

  return (
    <View
      style={{ marginBottom: SPACING.xl }}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilitySummary
          ? `Stacked bar chart showing ${accessibilitySummary}`
          : `Stacked bar chart with ${segments.length} segments`
      }
    >
      {/* External labels for small segments */}
      {normalizedSegments.some((s) => s.percentage > 0 && s.visualPct < 15) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm }}>
          {normalizedSegments.map((segment, index) => {
            if (segment.percentage === 0 || segment.visualPct >= 15) return null;
            return (
              <View
                key={`ext-label-${segment.label}-${index}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}
              >
                <View style={{ width: 8, height: 8, borderRadius: RADIUS.xs, backgroundColor: segment.color }} />
                <Text variant="captionSmall" color={colors.textSecondary as string} style={{ fontWeight: '500' }}>
                  {segment.label} {Math.round(segment.percentage)}%
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Tooltip */}
      {activeSegment !== null && normalizedSegments[activeSegment] && (
        <View
          style={{
            backgroundColor: '#1E293B',
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            borderRadius: RADIUS.sm,
            marginBottom: SPACING.sm,
            alignSelf: 'center',
          }}
        >
          <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: '#F1F5F9', fontWeight: '600' }}>
            {normalizedSegments[activeSegment]!.label}: {Math.round(normalizedSegments[activeSegment]!.percentage)}% ({normalizedSegments[activeSegment]!.count})
          </Text>
        </View>
      )}

      {/* Bar */}
      <View
        style={{
          flexDirection: 'row',
          height: barHeight,
          borderRadius: RADIUS.md,
          overflow: 'hidden',
          marginBottom: SPACING.lg,
          backgroundColor: colors.stackedBarTrack as string,
        }}
      >
        {normalizedSegments.map((segment, index) => {
          if (segment.percentage === 0) return null;
          const animValue = animValuesRef.current[index];
          if (!animValue) return null;
          const widthAnim = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', `${segment.visualPct}%`],
          });
          const isActive = activeSegment === index;

          return (
            <Pressable
              key={`${segment.label}-${index}`}
              onPressIn={() => setActiveSegment(index)}
              onPressOut={() => setActiveSegment(null)}
            >
              <Animated.View
                style={{
                  width: widthAnim,
                  height: barHeight,
                  backgroundColor: segment.color,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: activeSegment !== null && !isActive ? 0.4 : 1,
                }}
                accessible={true}
                accessibilityLabel={`${segment.label}: ${Math.round(segment.percentage)}% of content`}
              >
                {segment.visualPct >= 15 && (
                  <Text variant="labelBold" color={colors.white as string} numberOfLines={1}>
                    {Math.round(segment.percentage)}%
                  </Text>
                )}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>

      {/* Legend with distinct shapes for colorblind accessibility */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: SPACING.md,
        }}
      >
        {segments.map((segment, index) => (
          <View
            key={`legend-${segment.label}-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
            }}
            accessible={true}
            accessibilityLabel={`${segment.label}: ${Math.round(segment.percentage)}% (${segment.count})`}
          >
            <LegendShape index={index} color={segment.color} />
            <Text variant="label" color={colors.textMuted as string}>
              {segment.label}
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary as string}>
              {Math.round(segment.percentage)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const ALStackedBar = React.memo(ALStackedBarComponent);
