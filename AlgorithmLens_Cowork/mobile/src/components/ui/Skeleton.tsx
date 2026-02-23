import React, { useEffect, useRef } from 'react';
import { ViewStyle, Animated, AccessibilityInfo } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number | `${number}%` | 'auto';
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonComponent: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  // Use useRef to prevent Animated.Value from being recreated on each render
  const opacityRef = useRef(new Animated.Value(0.3));
  const opacity = opacityRef.current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    const initAnimation = async () => {
      const prefersReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();

      if (!prefersReducedMotion) {
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );

        animation.start();
      }
    };

    void initAnimation();

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.borderSlate200,
          borderRadius,
          opacity,
        },
        style,
      ]}
      accessible={true}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    />
  );
};

export const Skeleton = React.memo(SkeletonComponent);
