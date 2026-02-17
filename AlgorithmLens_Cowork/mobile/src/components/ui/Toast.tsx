import React, { useEffect } from 'react';
import {
  Animated,
  View,
  Text,
  SafeAreaView,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../lib/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onDismiss,
}) => {
  const slideAnim = new Animated.Value(300);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onDismiss();
        });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim, onDismiss]);

  if (!visible) {
    return null;
  }

  const getBorderColor = (): string => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.error;
      case 'info':
      default:
        return COLORS.primaryBlue;
    }
  };

  const borderColor = getBorderColor();

  return (
    <SafeAreaView
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      <Animated.View
        style={[
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            marginHorizontal: 16,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: borderColor,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#1E293B',
            }}
          >
            {message}
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};
