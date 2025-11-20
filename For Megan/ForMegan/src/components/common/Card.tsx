import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, ThemeName } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  theme?: ThemeName;
  variant?: 'glass' | 'solid' | 'neumorphic';
  style?: ViewStyle;
  blur?: boolean;
  padding?: keyof typeof SPACING;
}

export const Card: React.FC<CardProps> = ({
  children,
  theme = 'sunrise-vibes',
  variant = 'glass',
  style,
  blur = true,
  padding = 'md',
}) => {
  const colors = COLORS[theme];

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING[padding],
      overflow: 'hidden',
    };

    switch (variant) {
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: `${colors.surface}CC`, // 80% opacity
          borderWidth: 1,
          borderColor: `${colors.primary}33`, // 20% opacity
          ...SHADOWS.md,
        };
      
      case 'solid':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          ...SHADOWS.lg,
        };
      
      case 'neumorphic':
        return {
          ...baseStyle,
          backgroundColor: colors.background,
          shadowColor: colors.primary,
          shadowOffset: { width: -4, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
          // Inner shadow effect (simulated)
          borderWidth: 1,
          borderColor: `${colors.primary}11`,
        };
      
      default:
        return baseStyle;
    }
  };

  if (variant === 'glass' && blur) {
    return (
      <BlurView intensity={20} style={[getCardStyle(), style]}>
        <View style={{ backgroundColor: `${colors.surface}40` }}>
          {children}
        </View>
      </BlurView>
    );
  }

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};