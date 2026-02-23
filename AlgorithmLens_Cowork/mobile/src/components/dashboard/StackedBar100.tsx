import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '../../context/ThemeContext';

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
      return Animated.timing(animValuesRef.current[index], {
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
      style={{ marginBottom: 20 }}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilitySummary
          ? `Stacked bar chart showing ${accessibilitySummary}`
          : `Stacked bar chart with ${segments.length} segments`
      }
    >
      {/* Bar */}
      <View
        style={{
          flexDirection: 'row',
          height: 44,
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
          backgroundColor: colors.stackedBarTrack,
        }}
      >
        {normalizedSegments.map((segment, index) => {
          // Skip rendering truly 0% segments
          if (segment.percentage === 0) {
            return null;
          }

          const widthAnim = animValuesRef.current[index].interpolate({
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
              {segment.visualPct >= 10 && (
                <Text
                  style={{
                    fontSize: RFValue(14),
                    fontWeight: '600',
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
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {segments.map((segment, index) => (
          <View
            key={`legend-${segment.label}-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
            accessible={true}
            accessibilityLabel={`${segment.label}: ${Math.round(segment.percentage)}% (${segment.count})`}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: segment.color,
              }}
            />
            <Text
              style={{
                fontSize: RFValue(14),
                color: colors.textMuted,
                fontWeight: '500',
              }}
            >
              {segment.label}
            </Text>
            <Text
              style={{
                fontSize: RFValue(14),
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

export const StackedBar100 = React.memo(StackedBar100Component);
