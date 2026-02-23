import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../lib/theme';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
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
  const [pressed, setPressed] = useState(false);
  const { colors } = useTheme();

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.primaryBlue;
      case 'accent':
        return colors.accentGreen;
      case 'default':
      default:
        return colors.primary;
    }
  };

  const sizeConfig = {
    sm: {
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xxs,
      fontSize: TYPOGRAPHY.captionSmall.fontSize,
      lineHeight: TYPOGRAPHY.captionSmall.lineHeight,
    },
    md: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      fontSize: TYPOGRAPHY.caption.fontSize,
      lineHeight: TYPOGRAPHY.caption.lineHeight,
    },
  };

  const config = sizeConfig[size];

  const getOpacity = (): number => {
    if (!onPress) return 1;
    return pressed ? 0.75 : 1;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getBackgroundColor(),
      borderRadius: RADIUS.pill,
      paddingHorizontal: config.paddingHorizontal,
      paddingVertical: config.paddingVertical,
      alignSelf: 'flex-start',
      opacity: getOpacity(),
    },
    text: {
      color: colors.white,
      fontSize: config.fontSize,
      lineHeight: config.lineHeight,
      fontWeight: '600',
    },
  });

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessible={true}
        accessibilityLabel={`${variant} badge: ${label}`}
        accessibilityRole="button"
        testID={testID}
      >
        <View style={styles.container}>
          <Text style={styles.text}>{label}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`${variant} badge: ${label}`}
      accessibilityRole="text"
      testID={testID}
    >
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

export default React.memo(BadgeComponent);
