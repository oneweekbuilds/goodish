/**
 * ContentFadeIn — Screen-level opacity animation that triggers
 * when data finishes loading.
 *
 * Wraps a content area and fades it from 0 → 1 when `ready` becomes true.
 * Only fires once per mount — will not re-animate on subsequent re-renders
 * or state changes.
 *
 * If `ready` is true on initial render (cached data), skips animation
 * and shows content immediately.
 */

import React, { useRef, useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface ContentFadeInProps {
  children: React.ReactNode;
  /** Set to true when data is loaded and content should appear */
  ready: boolean;
  /** Animation duration in ms. Default: 250 */
  duration?: number;
  /** Container style */
  style?: ViewStyle;
}

const ContentFadeInComponent: React.FC<ContentFadeInProps> = ({
  children,
  ready,
  duration = 250,
  style,
}) => {
  const hasAnimated = useRef(false);
  // Start at 1 if ready on mount (cached data), else 0
  const fadeAnim = useRef(new Animated.Value(ready ? 1 : 0)).current;

  useEffect(() => {
    if (ready && !hasAnimated.current) {
      hasAnimated.current = true;
      // If fadeAnim is already at 1 (ready on mount), skip animation
      // @ts-ignore — accessing internal _value for optimization
      if ((fadeAnim as any)._value >= 1) return;

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }
  }, [ready, fadeAnim, duration]);

  return (
    <Animated.View style={[{ opacity: fadeAnim, flex: 1 }, style]}>
      {children}
    </Animated.View>
  );
};

export const ContentFadeIn = React.memo(ContentFadeInComponent);
