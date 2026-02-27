/**
 * Card — Themed container with consistent padding, radius, and shadow.
 *
 * Variants:
 * - default: subtle shadow, standard padding
 * - elevated: stronger shadow for floating panels
 * - interactive: responds to press with opacity change
 */

import React, { useRef, useEffect } from 'react';
import { View, Pressable, Animated, type ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../lib/theme';

type CardVariant = 'default' | 'elevated' | 'interactive';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
}

const CardComponent: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  onPress,
}) => {
  const { colors, shadows } = useTheme();
  const hasMounted = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, slideAnim]);

  const getVariantShadow = () => {
    switch (variant) {
      case 'elevated':
        return shadows.lg;
      case 'interactive':
        return shadows.md;
      case 'default':
      default:
        return shadows.card;
    }
  };

  const baseStyle: ViewStyle = {
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: SPACING.xl,
    ...getVariantShadow(),
  };

  const entranceStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  if (variant === 'interactive' && onPress) {
    return (
      <Animated.View style={entranceStyle}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={({ pressed }) => Platform.OS === 'web' ? {
            ...baseStyle,
            opacity: pressed ? 0.9 : 1,
            ...style,
          } : [
            baseStyle,
            { opacity: pressed ? 0.9 : 1 },
            style,
          ]}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={entranceStyle}>
      <View
        style={Platform.OS === 'web' ? { ...baseStyle, ...style } : [baseStyle, style]}
        accessibilityRole="summary"
      >
        {children}
      </View>
    </Animated.View>
  );
};

export const Card = React.memo(CardComponent);
