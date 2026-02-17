import React from 'react';
import { View, ViewStyle } from 'react-native';

type CardVariant = 'default' | 'elevated' | 'outline';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: CardVariant;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(30, 41, 59, 0.12)',
          shadowColor: 'transparent',
        };
      case 'default':
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(30, 41, 59, 0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        };
    }
  };

  return (
    <View
      style={[
        {
          padding: 20,
        },
        getVariantStyles(),
        style,
      ]}
    >
      {children}
    </View>
  );
};
