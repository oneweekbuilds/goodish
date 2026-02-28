import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../lib/gluestackTheme';

export interface ProgressBarProps {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  animated?: boolean;
  indeterminate?: boolean;
  testID?: string;
}

const ProgressBarComponent: React.FC<ProgressBarProps> = ({
  progress,
  color,
  trackColor,
  height = SPACING.xs,
  animated = true,
  indeterminate = false,
  testID,
}) => {
  const { colors } = useTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const progressAnim = useRef(new Animated.Value(indeterminate ? 0.3 : clampedProgress)).current;

  const finalColor = color || colors.primary;
  const finalTrackColor = trackColor || colors.bgSecondary;

  useEffect(() => {
    if (indeterminate) {
      Animated.timing(progressAnim, {
        toValue: 0.7,
        duration: 1500,
        easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
        useNativeDriver: false,
      }).start();
    } else if (animated) {
      Animated.timing(progressAnim, {
        toValue: clampedProgress,
        duration: 300,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(clampedProgress);
    }
  }, [progress, animated, indeterminate, progressAnim, clampedProgress]);

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={{ width: '100%', height, backgroundColor: finalTrackColor, borderRadius: RADIUS.full, overflow: 'hidden' }}
      accessible
      accessibilityLabel={`Progress ${Math.round(progress * 100)} percent`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      testID={testID}
    >
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: finalColor,
          borderRadius: RADIUS.full,
          width: widthInterpolation,
        }}
      />
    </View>
  );
};

export const ProgressBar = React.memo(ProgressBarComponent);
