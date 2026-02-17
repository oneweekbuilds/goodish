import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
} from 'react-native';

interface BarChartItem {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

interface BarChartProps {
  items: BarChartItem[];
}

export const BarChart: React.FC<BarChartProps> = ({ items }) => {
  const animValuesRef = useRef(items.map(() => new Animated.Value(0)));

  useEffect(() => {
    animValuesRef.current = items.map((_, index) => animValuesRef.current[index] || new Animated.Value(0));
  }, [items.length]);

  useEffect(() => {
    const animations = items.map((_, index) => {
      return Animated.timing(animValuesRef.current[index], {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
        delay: index * 50,
      });
    });

    Animated.stagger(50, animations).start();
  }, [items]);

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  // Generate progressively lighter colors: first bar darker, subsequent bars lighter
  const getBarColor = (index: number, defaultColor: string): string => {
    if (defaultColor) return defaultColor;
    const baseColor = '#3B82F6'; // Base blue
    const lightness = [0, 20, 35, 50].includes(index)
      ? [0, 20, 35, 50][index]
      : 50;
    // Simple lightness progression: 0% darker, 20%, 35%, 50%+ lighter
    const alpha = 1 - (lightness / 100) * 0.5;
    return baseColor; // In practice, use color library or CSS-like approach
  };

  return (
    <View style={{ gap: 16 }}>
      {items.map((item, index) => {
        const normalizedPercentage = (item.value / maxValue) * 100;
        const widthAnim = animValuesRef.current[index].interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', `${normalizedPercentage}%`],
        });

        // First bar darker blue, subsequent bars progressively lighter
        const baseColor = '#1E40AF'; // Darker blue
        const colors = [
          '#1E40AF', // Darkest
          '#2563EB', // Dark
          '#3B82F6', // Medium
          '#60A5FA', // Light
          '#93C5FD', // Lighter
        ];
        const barColor = item.color || colors[Math.min(index, colors.length - 1)];

        return (
          <View
            key={`${item.label}-${index}`}
            style={{
              gap: 8,
            }}
            accessible={true}
            accessibilityLabel={`${item.label}: ${item.value}`}
          >
            {/* Label and Value Row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: '#475569',
                  fontWeight: '500',
                  flex: 1,
                  maxWidth: '70%',
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#94A3B8',
                  marginLeft: 8,
                }}
              >
                {item.value}
              </Text>
            </View>

            {/* Bar with percentage label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Animated.View
                style={{
                  width: widthAnim,
                  height: 24,
                  backgroundColor: barColor,
                  borderRadius: 4,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: '#94A3B8',
                  fontWeight: '500',
                  minWidth: 28,
                }}
              >
                {Math.round(normalizedPercentage)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
