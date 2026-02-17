import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}) => {
  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: 16,
            paddingVertical: 10,
          },
          text: {
            fontSize: 14,
          },
        };
      case 'lg':
        return {
          container: {
            paddingHorizontal: 32,
            paddingVertical: 18,
          },
          text: {
            fontSize: 18,
          },
        };
      case 'md':
      default:
        return {
          container: {
            paddingHorizontal: 24,
            paddingVertical: 14,
          },
          text: {
            fontSize: 16,
          },
        };
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#2563EB',
          },
          text: {
            color: '#2563EB',
            fontWeight: '600',
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: '#2563EB',
            fontWeight: '600',
          },
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: '#2563EB',
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
            fontWeight: '600',
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        sizeStyles.container,
        variantStyles.container,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.text.color as string}
          size="small"
        />
      ) : (
        <Text
          style={[
            {
              fontWeight: '600',
            },
            sizeStyles.text,
            variantStyles.text,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
