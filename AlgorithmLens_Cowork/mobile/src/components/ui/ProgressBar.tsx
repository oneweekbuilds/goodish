import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../lib/theme';

interface ProgressBarProps {
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
  const progressValue = useSharedValue(indeterminate ? 0.3 : Math.min(Math.max(progress, 0), 1));

  const finalColor = color || colors.primary;
  const finalTrackColor = trackColor || colors.bgSecondary;

  useEffect(() => {
    if (indeterminate) {
      // Pulse animation for indeterminate state
      progressValue.value = withTiming(0.7, {
        duration: 1500,
        easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
      });
    } else if (animated) {
      progressValue.value = withTiming(Math.min(Math.max(progress, 0), 1), {
        duration: 300,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
    } else {
      progressValue.value = Math.min(Math.max(progress, 0), 1);
    }
  }, [progress, animated, indeterminate, progressValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      height,
      backgroundColor: finalTrackColor,
      borderRadius: RADIUS.full,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: finalColor,
      borderRadius: RADIUS.full,
    },
  });

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`Progress ${Math.round(progress * 100)} percent`}
      accessibilityRole="progressbar"
      accessibilityValue={{min: 0, max: 100, now: Math.round(progress * 100)}}
      testID={testID}
    >
      <Animated.View style={[styles.progressBar, animatedStyle]} />
    </View>
  );
};

export default React.memo(ProgressBarComponent);
