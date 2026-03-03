import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';

type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
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
  const { colors, shadows } = useTheme();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }).start(() => onDismiss());
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  const borderColor = type === 'success' ? colors.success : type === 'error' ? colors.error : colors.primaryBlue;

  return (
    <SafeAreaView
      pointerEvents="none"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
      accessible accessibilityRole="alert" accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={Platform.OS === 'web'
          ? { transform: [{ translateY: 0 }] }
          : [{ transform: [{ translateY: slideAnim }] }]
        }
      >
        <View style={{
          backgroundColor: colors.bgCard,
          marginHorizontal: SPACING.lg,
          marginBottom: SPACING.lg,
          borderLeftWidth: 4,
          borderLeftColor: borderColor,
          borderRadius: RADIUS.sm,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          ...shadows.card,
        }}>
          <Text style={{ ...GL_TYPOGRAPHY.label, color: colors.textMain }}>{message}</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export const Toast = React.memo(ToastComponent);
