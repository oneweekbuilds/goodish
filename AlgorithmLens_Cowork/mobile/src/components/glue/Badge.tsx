import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'subtle';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  onPress?: () => void;
  testID?: string;
}

const BadgeComponent: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  onPress,
  testID,
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'outline': return 'transparent';
      case 'subtle': return colors.blue50 as string;
      default: return colors.primary;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'outline': return colors.textSecondary;
      case 'subtle': return colors.primaryBlue;
      default: return colors.white;
    }
  };

  const sizeConfig = size === 'sm'
    ? { ph: SPACING.xs, pv: SPACING.xxs, typo: GL_TYPOGRAPHY.captionSmall }
    : { ph: SPACING.sm, pv: SPACING.xs, typo: GL_TYPOGRAPHY.caption };

  const containerStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: RADIUS.pill,
    paddingHorizontal: sizeConfig.ph,
    paddingVertical: sizeConfig.pv,
    alignSelf: 'flex-start' as const,
    ...(variant === 'outline' ? { borderWidth: 1, borderColor: colors.borderLight } : {}),
  };

  const textStyle = {
    ...sizeConfig.typo,
    color: getTextColor(),
    fontWeight: '600' as const,
  };

  const content = (
    <View style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessible accessibilityLabel={`${variant} badge: ${label}`}
        accessibilityRole="button"
        testID={testID}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityLabel={`${variant} badge: ${label}`} accessibilityRole="text" testID={testID}>
      {content}
    </View>
  );
};

export const Badge = React.memo(BadgeComponent);
