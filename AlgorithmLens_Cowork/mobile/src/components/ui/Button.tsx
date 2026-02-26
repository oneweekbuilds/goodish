import React, { ReactNode } from 'react';
import {
  Pressable,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../lib/theme';
import { flattenStyle } from '../../lib/styles';

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

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            minHeight: 44,
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
            minHeight: 44,
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
            minHeight: 44,
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
            backgroundColor: colors.primary,
            borderWidth: 0,
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

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{disabled: disabled || loading}}
      style={({ pressed }) => flattenStyle([
        {
          borderRadius: RADIUS.md,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.4 : pressed ? getPressedOpacity() : 1,
        },
        sizeStyles.container,
        variantStyles.container,
        style,
      ])}
    >
      {({ pressed }) => (
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
      )}
    </Pressable>
  );
};

export const Button = React.memo(ButtonComponent);
