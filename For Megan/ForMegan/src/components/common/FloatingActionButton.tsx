import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, ThemeName } from '../../constants/theme';

interface FloatingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  theme?: ThemeName;
  size?: number;
  style?: ViewStyle;
  hapticFeedback?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  theme = 'sunrise-vibes',
  size = 56,
  style,
  hapticFeedback = true,
}) => {
  const colors = COLORS[theme];

  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, { width: size, height: size }, style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: size / 2 }]}
      >
        <Ionicons 
          name={icon} 
          size={size * 0.4} 
          color={theme === 'midnight-mode' || theme === 'y2k-nostalgia' ? colors.text : '#FFFFFF'} 
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    ...SHADOWS.lg,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});