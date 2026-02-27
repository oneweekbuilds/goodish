/**
 * StaggeredList — Reusable wrapper that staggers children entrance animations.
 *
 * Each child fades in + slides up with a configurable stagger delay.
 * Animation only fires on mount (not re-renders) via a useRef guard.
 *
 * Usage:
 *   <StaggeredList>
 *     <Card>...</Card>
 *     <Card>...</Card>
 *   </StaggeredList>
 */

import React, { useRef, useEffect, Children } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface StaggeredListProps {
  children: React.ReactNode;
  /** Delay between each child's animation start (ms). Default: 50 */
  staggerDelay?: number;
  /** Duration of each child's animation (ms). Default: 250 */
  duration?: number;
  /** Container style */
  style?: ViewStyle;
}

interface StaggeredItemProps {
  children: React.ReactNode;
  delay: number;
  duration: number;
}

const StaggeredItem: React.FC<StaggeredItemProps> = ({ children, delay, duration }) => {
  const hasMounted = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, delay, duration]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

const StaggeredListComponent: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 50,
  duration = 250,
  style,
}) => {
  const childArray = Children.toArray(children);

  return (
    <Animated.View style={style}>
      {childArray.map((child, index) => (
        <StaggeredItem
          key={index}
          delay={index * staggerDelay}
          duration={duration}
        >
          {child}
        </StaggeredItem>
      ))}
    </Animated.View>
  );
};

export const StaggeredList = React.memo(StaggeredListComponent);
