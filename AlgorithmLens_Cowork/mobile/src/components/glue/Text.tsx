import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';

type TextVariant = keyof typeof GL_TYPOGRAPHY;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

const TextComponent: React.FC<TextProps> = ({
  variant = 'body',
  color,
  align,
  style,
  children,
  ...rest
}) => {
  const { colors } = useTheme();
  const typo = GL_TYPOGRAPHY[variant];

  const textStyle: TextStyle = {
    ...typo,
    color: color || colors.textPrimary,
    ...(align ? { textAlign: align } : {}),
  };

  return (
    <RNText
      style={Platform.OS === 'web' ? { ...textStyle, ...(style as any) } : [textStyle, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

export const Text = React.memo(TextComponent);
