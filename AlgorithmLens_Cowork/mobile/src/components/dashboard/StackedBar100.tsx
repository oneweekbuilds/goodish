import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
} from 'react-native';

interface Segment {
  label: string;
  percentage: number;
  count: number;
  color: string;
}

interface StackedBar100Props {
  segments: Segment[];
}

export const StackedBar100: React.FC<StackedBar100Props> = ({ segments }) => {
  const animValuesRef = useRef(segments.map(() => new Animated.Value(0)));

  useEffect(() => {
    animValuesRef.current = segments.map((_, index) => animValuesRef.current[index] || new Animated.Value(0));
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

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Bar */}
      <View
        style={{
          flexDirection: 'row',
          height: 44,
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
          backgroundColor: '#F1F5F9',
        }}
      >
        {segments.map((segment, index) => {
          // Skip rendering 0% segments
          if (segment.percentage === 0) {
            return null;
          }

          const widthAnim = animValuesRef.current[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', `${segment.percentage}%`],
          });

          return (
            <Animated.View
              key={`${segment.label}-${index}`}
              style={{
                width: widthAnim,
                minWidth: 30,
                backgroundColor: segment.color,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {segment.percentage >= 10 && (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#FFFFFF',
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

      {/* Legend - includes all segments for reference */}
      <View style={{ gap: 12 }}>
        {segments.map((segment, index) => (
          <View
            key={`legend-${segment.label}-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
            accessible={true}
            accessibilityLabel={`${segment.label}: ${Math.round(segment.percentage)}% (${segment.count})`}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: segment.color,
              }}
            />
            <Text
              style={{
                fontSize: 14,
                color: '#475569',
                fontWeight: '500',
              }}
            >
              {segment.label}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: '#94A3B8',
              }}
            >
              {Math.round(segment.percentage)}% ({segment.count})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
