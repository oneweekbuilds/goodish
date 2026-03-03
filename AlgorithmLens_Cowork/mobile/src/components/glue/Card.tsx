import React, { useRef, useEffect, useCallback } from 'react';
import { View, Pressable, Animated, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS } from '../../lib/gluestackTheme';

type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
}

// Web-safe gradient wrapper
const GradientWrapper = Platform.OS === 'web'
  ? ({ colors: gradientColors, start, end, style: gStyle, children, ...props }: any) => {
      const flat = gStyle ? (Array.isArray(gStyle) ? Object.assign({}, ...gStyle) : gStyle) : {};
      return (
        <View style={{ ...flat, background: `linear-gradient(to bottom, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)` }} {...props}>
          {children}
        </View>
      );
    }
  : LinearGradient;

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
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [fadeAnim, slideAnim]);

  const getShadow = () => {
    switch (variant) {
      case 'elevated': return shadows.xl;
      case 'outlined': return shadows.sm;
      default: return shadows.card;
    }
  };

  const getBorderWidth = () => variant === 'outlined' ? 1 : 1;
  const getBorderColor = () => variant === 'outlined' ? colors.borderMedium : colors.borderDefault;

  const baseStyle: ViewStyle = {
    borderRadius: RADIUS.lg,
    borderWidth: getBorderWidth(),
    borderColor: getBorderColor(),
    padding: SPACING.xl,
    ...getShadow(),
  };

  const entranceStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  if (onPress) {
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
