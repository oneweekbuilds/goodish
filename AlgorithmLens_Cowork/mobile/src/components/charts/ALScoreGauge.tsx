/**
 * ALScoreGauge — Circular arc progress gauge with animated fill.
 *
 * Uses react-native-gifted-charts PieChart in donut/progress mode
 * to create a score gauge with animated fill, large center number,
 * and color that changes by score range (green → blue → amber → gray).
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { Text, Skeleton } from '../glue';

// ─── Types ──────────────────────────────────────────────

export interface ALScoreGaugeProps {
  /** Score value 0-100 */
  score: number;
  /** Label below score (e.g., "Good", "Excellent") */
  label?: string;
  /** Whether data is still loading */
  loading?: boolean;
  /** Outer radius */
  radius?: number;
  /** Ring thickness */
  strokeWidth?: number;
  /** Animated count-up for score display */
  animated?: boolean;
  /** Accessibility label override */
  accessibilityLabel?: string;
}

// ─── Animated Counter Hook ──────────────────────────────

function useCountUp(target: number, duration: number = 600): string {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);
  const animRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasAnimated.current || target <= 0) {
      setDisplayValue(target);
      return;
    }
    hasAnimated.current = true;

    const listenerId = animRef.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    Animated.timing(animRef, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animRef.removeListener(listenerId);
    };
  }, [target, duration, animRef]);

  return String(displayValue);
}

// ─── Component ──────────────────────────────────────────

function ALScoreGaugeComponent({
  score,
  label,
  loading = false,
  radius = 60,
  strokeWidth = 8,
  animated = true,
  accessibilityLabel: propA11yLabel,
}: ALScoreGaugeProps) {
  const { colors } = useTheme();
  const displayScore = animated ? useCountUp(score) : String(score);

  // Score-based color
  const getScoreColor = (s: number): string => {
    if (s >= 70) return colors.success as string;
    if (s >= 50) return colors.primaryBlue as string;
    if (s >= 30) return colors.warning as string;
    return colors.textMuted as string;
  };

  const scoreColor = getScoreColor(score);
  const innerRadius = radius - strokeWidth;

  // ─── Loading State ──────────────────────────────────
  if (loading) {
    return (
      <View style={{ alignItems: 'center' }}>
        <Skeleton width={radius * 2} height={radius * 2} borderRadius={radius} />
      </View>
    );
  }

  // ─── Chart Data ─────────────────────────────────────
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const remaining = 100 - clampedScore;

  const pieData = [
    { value: clampedScore, color: scoreColor },
    { value: remaining, color: colors.borderSubtle as string },
  ];

  return (
    <View
      style={{ alignItems: 'center' }}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={
        propA11yLabel ?? `Score gauge: ${score}${label ? ` - ${label}` : ''}`
      }
      accessibilityValue={{ min: 0, max: 100, now: score }}
    >
      <PieChart
        data={pieData}
        donut
        radius={radius}
        innerRadius={innerRadius}
        innerCircleColor={colors.bgCard as string}
        centerLabelComponent={() => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                ...GL_TYPOGRAPHY.bigNumber,
                color: scoreColor,
              }}
            >
              {displayScore}
            </Text>
            {label && (
              <Text
                style={{
                  ...GL_TYPOGRAPHY.captionSmall,
                  color: colors.textSecondary as string,
                  marginTop: -2,
                }}
              >
                {label}
              </Text>
            )}
          </View>
        )}
        isAnimated
        animationDuration={600}
      />
    </View>
  );
}

export const ALScoreGauge = React.memo(ALScoreGaugeComponent);
