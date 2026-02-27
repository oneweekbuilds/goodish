import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '../../context/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../lib/theme';

interface Segment {
  label: string;
  percentage: number;
  count: number;
  color: string;
}

interface StackedBar100Props {
  segments: Segment[];
  /** Optional summary label for screen readers */
  accessibilitySummary?: string;
}

/** Minimum visible width for any segment, in percentage points.
 *  Real values below this threshold render at MIN_VISIBLE_PCT
 *  visual width but show the actual percentage in the label. */
const MIN_VISIBLE_PCT = 3;

const StackedBar100Component: React.FC<StackedBar100Props> = ({
  segments,
  accessibilitySummary,
}) => {
  const { colors } = useTheme();
  const animValuesRef = useRef(segments.map(() => new Animated.Value(0)));

  useEffect(() => {
    // Only extend array if new items added; reuse existing values
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

  // Compute visual percentages: enforce minimum visible width for non-zero segments
  const visualSegments = segments.map((seg) => {
    if (seg.percentage === 0) return { ...seg, visualPct: 0 };
    const visualPct = Math.max(seg.percentage, MIN_VISIBLE_PCT);
    return { ...seg, visualPct };
  });

  // Normalize so visual percentages sum to 100
  const visualTotal = visualSegments.reduce((sum, s) => sum + s.visualPct, 0);
  const normalizedSegments = visualSegments.map((s) => ({
    ...s,
    visualPct: visualTotal > 0 ? (s.visualPct / visualTotal) * 100 : 0,
  }));

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
      {/* CD-001 FIX: External labels for segments 3–10% that can't fit internal text */}
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
                <Text style={{ ...TYPOGRAPHY.captionSmall, color: colors.textSecondary, fontWeight: '500' }}>
                  {segment.label} {Math.round(segment.percentage)}%
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Bar */}
      <View
        style={{
          flexDirection: 'row',
          height: 36,
          borderRadius: RADIUS.xl,
          overflow: 'hidden',
          marginBottom: SPACING.lg,
          backgroundColor: colors.stackedBarTrack,
        }}
      >
        {normalizedSegments.map((segment, index) => {
          // Skip rendering truly 0% segments
          if (segment.percentage === 0) {
            return null;
          }

          const animValue = animValuesRef.current[index];
          if (!animValue) return null;
          const widthAnim = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', `${segment.visualPct}%`],
          });

          return (
            <Animated.View
              key={`${segment.label}-${index}`}
              style={{
                width: widthAnim,
                backgroundColor: segment.color,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessible={true}
              accessibilityLabel={`${segment.label}: ${Math.round(segment.percentage)}% of content`}
            >
              {segment.visualPct >= 15 && (
                <Text
                  style={{
                    ...TYPOGRAPHY.labelBold,
                    color: colors.white,
                  }}
                  numberOfLines={1}
                >
                  {Math.round(segment.percentage)}%
                </Text>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Legend — horizontal wrap layout below the chart */}
      {/* A-001/A-003 FIX: Distinct shapes per legend item for color-blind accessibility */}
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
            <Text
              style={{
                ...TYPOGRAPHY.label,
                color: colors.textMuted,
              }}
            >
              {segment.label}
            </Text>
            <Text
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: colors.textSecondary,
              }}
            >
              {Math.round(segment.percentage)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/** A-001 FIX: Distinct legend shapes — circle, square, diamond, triangle —
 *  so segments are distinguishable without relying on color alone. */
function LegendShape({ index, color }: { index: number; color: string }) {
  const shape = index % 4;
  switch (shape) {
    case 0: // circle
      return <View style={{ width: 10, height: 10, borderRadius: RADIUS.full, backgroundColor: color }} />;
    case 1: // square
      return <View style={{ width: 10, height: 10, borderRadius: 1, backgroundColor: color }} />;
    case 2: // diamond (rotated square)
      return (
        <View style={{ width: 12, height: 12, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
        </View>
      );
    case 3: // triangle
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
      return <View style={{ width: 10, height: 10, borderRadius: RADIUS.full, backgroundColor: color }} />;
  }
}

export const StackedBar100 = React.memo(StackedBar100Component);
