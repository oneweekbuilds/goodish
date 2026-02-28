import React, { useState, useRef, useCallback } from 'react';
import {
  TextInput,
  View,
  Text,
  Animated,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { MIN_TOUCH_TARGET } from '../../lib/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

const InputComponent: React.FC<InputProps> = ({
  label,
  error,
  disabled = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback((e: any) => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    onFocus?.(e);
  }, [borderAnim, onFocus]);

  const handleBlur = useCallback((e: any) => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    onBlur?.(e);
  }, [borderAnim, onBlur]);

  const getBorderColor = () => {
    if (error) return colors.error;
    if (focused) return colors.primary;
    return colors.borderDefault;
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={{
          ...GL_TYPOGRAPHY.label,
          color: error ? colors.error : colors.textSecondary,
          marginBottom: SPACING.xs,
        }}>
          {label}
        </Text>
      )}
      <TextInput
        editable={!disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={colors.textTertiary}
        style={[
          {
            ...GL_TYPOGRAPHY.body,
            color: disabled ? colors.textTertiary : colors.textPrimary,
            backgroundColor: disabled ? colors.bgSecondary : colors.inputBg,
            borderWidth: 1,
            borderColor: getBorderColor(),
            borderRadius: RADIUS.md,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            minHeight: MIN_TOUCH_TARGET,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
        {...rest}
      />
      {error && (
        <Text style={{
          ...GL_TYPOGRAPHY.captionSmall,
          color: colors.error,
          marginTop: SPACING.xs,
        }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export const Input = React.memo(InputComponent);
