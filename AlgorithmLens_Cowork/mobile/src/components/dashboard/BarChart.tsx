import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Animated,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '../../context/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES } from '../../lib/theme';

interface BarChartItem {
  label: string;
  value: number;
  percentage: number;
  color?: string;
  category?: string;
}

interface BarChartProps {
  items: BarChartItem[];
  /** Optional summary label for screen readers (e.g., "source distribution across 8 sources") */
  accessibilitySummary?: string;
  /** Show a legend when items use multiple distinct colors/categories */
  showLegend?: boolean;
}

const BarChartComponent: React.FC<BarChartProps> = ({
  items,
  accessibilitySummary,
  showLegend = false,
}) => {
  const { colors } = useTheme();
  const animValuesRef = useRef(items.map(() => new Animated.Value(0)));

  useEffect(() => {
    // Only extend array if new items added; reuse existing values
    const currentValues = animValuesRef.current;
    if (items.length > currentValues.length) {
      animValuesRef.current = [
        ...currentValues,
        ...Array.from({ length: items.length - currentValues.length }, () => new Animated.Value(0)),
      ];
    } else if (items.length < currentValues.length) {
      animValuesRef.current = currentValues.slice(0, items.length);
    }
  }, [items.length]);

  useEffect(() => {
    const animations = items.map((_, index) => {
      const animValue = animValuesRef.current[index];
      if (!animValue) return Animated.delay(0);
      return Animated.timing(animValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
        delay: index * 50,
      });
    });

    Animated.stagger(50, animations).start();
  }, [items]);

  const maxValue = useMemo(() => Math.max(...items.map((item) => item.value), 1), [items]);
  const totalValue = useMemo(() => items.reduce((sum, item) => sum + item.value, 0), [items]);

  // Graduated blue scale — ranked from darkest to lightest.
  const barColors: string[] = [
    colors.barDarkest,   // #1
    colors.barDark,      // #2
    colors.barMedium,    // #3
    colors.barLight,     // #4
    colors.barLightest,  // #5
  ];

  /** Return the color for a bar at the given rank index.
   *  Custom item.color takes priority; ranked items use the gradient;
   *  items beyond the gradient fall back to neutral gray. */
  const getBarColor = (index: number, itemColor?: string): string => {
    if (itemColor) return itemColor;
    if (index < barColors.length) return barColors[index]!;
    return colors.textTertiary;
  };

  // Build legend entries from unique categories/colors
  const legendEntries = showLegend
    ? items.reduce<Array<{ label: string; color: string }>>((acc, item, index) => {
        const color = getBarColor(index, item.color);
        const label = item.category || item.label;
        if (!acc.some((e) => e.label === label && e.color === color)) {
          acc.push({ label, color: color ?? colors.accent });
        }
        return acc;
      }, [])
    : [];

  return (
    <View
      style={{ gap: SPACING.xl }}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilitySummary
          ? `Bar chart showing ${accessibilitySummary}`
          : `Bar chart showing ${items.length} items`
      }
    >
      {items.map((item, index) => {
        const normalizedPercentage = (item.value / maxValue) * 100;
        // Cap visual bar width at 82% to always leave room for the percentage label
        const barVisualWidth = Math.min(normalizedPercentage, 82);
        const itemPercentageOfTotal = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
        const animValue = animValuesRef.current[index];
        if (!animValue) return null;
        const widthAnim = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', `${barVisualWidth}%`],
        });

        const barColor = getBarColor(index, item.color);

        return (
          <View
            key={`${item.label}-${index}`}
            style={{
              gap: SPACING.sm,
            }}
            accessible={true}
            accessibilityLabel={`${item.label}: ${item.value} posts, ${itemPercentageOfTotal}% of total`}
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
                  ...TYPOGRAPHY.label,
                  color: colors.textMuted,
                  flex: 1,
                  maxWidth: '70%',
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: colors.textSecondary,
                  marginLeft: SPACING.sm,
                }}
              >
                {item.value} ({itemPercentageOfTotal}%)
              </Text>
            </View>

            {/* Bar with background track */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
              <View style={{
                flex: 1,
                height: 28,
                backgroundColor: colors.stackedBarTrack,
                borderRadius: RADIUS.xs,
                overflow: 'hidden',
              }}>
                <Animated.View
                  style={{
                    width: widthAnim,
                    height: 28,
                    backgroundColor: barColor,
                    borderRadius: RADIUS.xs,
                  }}
                />
              </View>
              <Text style={{
                ...TYPOGRAPHY.label,
                color: colors.textSecondary,
                minWidth: 36,
                textAlign: 'right',
              }}>
                {itemPercentageOfTotal}%
              </Text>
            </View>
          </View>
        );
      })}

      {/* Legend — shown when multiple categories are displayed */}
      {showLegend && legendEntries.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING.md,
            marginTop: SPACING.sm,
            paddingTop: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: colors.borderSoft,
          }}
        >
          {legendEntries.map((entry, idx) => (
            <View
              key={`bar-legend-${idx}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.sm,
              }}
            >
              <View
                style={{
                  width: ICON_SIZES.dot,
                  height: ICON_SIZES.dot,
                  borderRadius: ICON_SIZES.dot / 2,
                  backgroundColor: entry.color,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              />
              <Text
                style={{
                  ...TYPOGRAPHY.label,
                  color: colors.textMuted,
                }}
              >
                {entry.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export const BarChart = React.memo(BarChartComponent);
