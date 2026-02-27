/**
 * Card — Themed container with consistent padding, radius, and shadow.
 *
 * Variants:
 * - default: subtle shadow, standard padding
 * - elevated: stronger shadow for floating panels
 * - interactive: responds to press with opacity change
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, Pressable, Animated, type ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../lib/theme';

// Web-safe gradient wrapper for LinearGradient
const GradientWrapper = Platform.OS === 'web'
  ? ({ colors: gradientColors, start, end, style, children, ...props }: any) => {
      const flatStyle = style ? (Array.isArray(style) ? Object.assign({}, ...style) : style) : {};
      return (
        <View
          style={{
            ...flatStyle,
            background: `linear-gradient(to bottom, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
          }}
          {...props}
        >
          {children}
        </View>
      );
    }
  : LinearGradient;

type CardVariant = 'default' | 'elevated' | 'interactive';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const CardComponent: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  onPress,
  accessibilityLabel,
}) => {
  const { colors, shadows } = useTheme();
  const hasMounted = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }, [scaleAnim]);

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
        return shadows.xl;
      case 'interactive':
        return shadows.md;
      case 'default':
      default:
        return shadows.card;
    }
  };

  const baseStyle: ViewStyle = {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: SPACING.xl,
    ...getVariantShadow(),
  };

  const entranceStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  if (variant === 'interactive' && onPress) {
    return (
      <Animated.View style={[entranceStyle, { transform: [...(entranceStyle.transform || []), { scale: scaleAnim }] }]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || 'Interactive card'}
        >
          <GradientWrapper
            colors={[colors.bgCard, colors.bgCardGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={Platform.OS === 'web' ? { ...baseStyle, ...style } : [baseStyle, style]}
          >
            {children}
          </GradientWrapper>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={entranceStyle}>
      <GradientWrapper
        colors={[colors.bgCard, colors.bgCardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={Platform.OS === 'web' ? { ...baseStyle, ...style } : [baseStyle, style]}
        accessibilityRole="summary"
      >
        {children}
      </GradientWrapper>
    </Animated.View>
  );
};

export const Card = React.memo(CardComponent);
