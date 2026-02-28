import React, { useRef, useCallback } from 'react';
import {
  Pressable,
  Text,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { MIN_TOUCH_TARGET } from '../../lib/theme';
import { flattenStyle } from '../../lib/styles';
import { triggerImpactLight } from '../../lib/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
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

  const handlePressIn = useCallback(() => {
    triggerImpactLight();
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const getSizeStyles = (): { container: ViewStyle; textVariant: 'buttonSm' | 'buttonMd' | 'buttonLg' } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, minHeight: MIN_TOUCH_TARGET },
          textVariant: 'buttonSm',
        };
      case 'lg':
        return {
          container: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, minHeight: MIN_TOUCH_TARGET },
          textVariant: 'buttonLg',
        };
      default:
        return {
          container: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, minHeight: MIN_TOUCH_TARGET },
          textVariant: 'buttonMd',
        };
    }
  };

  const getVariantStyles = (): { container: ViewStyle; textColor: string } => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderDefault },
          textColor: colors.textPrimary,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 0 },
          textColor: colors.primary,
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.errorLight, borderWidth: 0 },
          textColor: colors.error,
        };
      default:
        return {
          container: { backgroundColor: 'transparent', borderWidth: 0, overflow: 'hidden' as const },
          textColor: colors.textInverse,
        };
    }
  };

  const sizeConfig = getSizeStyles();
  const variantConfig = getVariantStyles();
  const typo = GL_TYPOGRAPHY[sizeConfig.textVariant];

  const pressedOpacity = variant === 'primary' || variant === 'danger' ? 0.85 : 0.7;

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={variantConfig.textColor} size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: SPACING.xs }}>{icon}</View>}
          <Text
            style={flattenStyle([
              typo,
              { color: variantConfig.textColor },
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
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        style={({ pressed }) => flattenStyle([
          {
            borderRadius: RADIUS.md,
            opacity: disabled ? 0.4 : pressed ? pressedOpacity : 1,
          },
          variant !== 'primary' && {
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row' as const,
          },
          variant !== 'primary' && sizeConfig.container,
          variantConfig.container,
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
              sizeConfig.container,
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
