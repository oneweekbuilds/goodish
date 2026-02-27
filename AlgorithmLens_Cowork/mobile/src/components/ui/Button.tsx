import React, { ReactNode, useRef, useCallback } from 'react';
import {
  Pressable,
  Text,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS, MIN_TOUCH_TARGET } from '../../lib/theme';
import { flattenStyle } from '../../lib/styles';
import { triggerImpactLight } from '../../lib/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const ButtonComponent: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressInAnim = useCallback(() => {
    triggerImpactLight();
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOutAnim = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            minHeight: MIN_TOUCH_TARGET,
          },
          text: {
            ...TYPOGRAPHY.buttonSm,
          },
        };
      case 'lg':
        return {
          container: {
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            minHeight: MIN_TOUCH_TARGET,
          },
          text: {
            ...TYPOGRAPHY.buttonLg,
          },
        };
      case 'md':
      default:
        return {
          container: {
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            minHeight: MIN_TOUCH_TARGET,
          },
          text: {
            ...TYPOGRAPHY.buttonMd,
          },
        };
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.borderDefault,
          },
          text: {
            color: colors.textPrimary,
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: colors.primary,
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.errorLight,
            borderWidth: 0,
          },
          text: {
            color: colors.error,
          },
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
            overflow: 'hidden' as const,
          },
          text: {
            color: colors.textInverse,
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const handlePressIn = (callback?: (pressed: boolean) => void) => {
    callback?.(true);
  };

  const handlePressOut = (callback?: (pressed: boolean) => void) => {
    callback?.(false);
  };

  const getPressedOpacity = (): number => {
    if (variant === 'primary' || variant === 'danger') {
      return 0.85;
    } else if (variant === 'secondary' || variant === 'ghost') {
      return 0.7;
    }
    return 1;
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          color={variantStyles.text.color as string}
          size="small"
        />
      ) : (
        <>
          {icon && <Text style={{ marginRight: SPACING.xs }}>{icon}</Text>}
          <Text
            style={flattenStyle([
              sizeStyles.text,
              variantStyles.text,
            ])}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressInAnim}
        onPressOut={handlePressOutAnim}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{disabled: disabled || loading}}
        style={({ pressed }) => flattenStyle([
          {
            borderRadius: RADIUS.md,
            opacity: disabled ? 0.4 : pressed ? getPressedOpacity() : 1,
          },
          variant !== 'primary' && {
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row' as const,
          },
          variant !== 'primary' && sizeStyles.container,
          variantStyles.container,
          style,
        ])}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={flattenStyle([
              {
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row' as const,
                borderRadius: RADIUS.md,
              },
              sizeStyles.container,
            ])}
          >
            {renderContent()}
          </LinearGradient>
        ) : (
          renderContent()
        )}
      </Pressable>
    </Animated.View>
  );
};

export const Button = React.memo(ButtonComponent);
