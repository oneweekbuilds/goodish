import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  SafeAreaView,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onDismiss: () => void;
}

const ToastComponent: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(300)).current;

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
  }, [visible, onDismiss]);

  if (!visible) {
    return null;
  }

  const getBorderColor = (): string => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'info':
      default:
        return colors.primaryBlue;
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
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
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
            backgroundColor: colors.bgCard,
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
              color: colors.textMain,
            }}
          >
            {message}
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export const Toast = React.memo(ToastComponent);
