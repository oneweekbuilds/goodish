import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { MIN_TOUCH_TARGET } from '../../lib/theme';

export type ChipVariant = 'default' | 'outline';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  variant?: ChipVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

const ChipComponent: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  variant = 'default',
  disabled = false,
  loading = false,
  testID,
}) => {
  const { colors } = useTheme();

  const bgColor = selected ? colors.primary : (variant === 'outline' ? 'transparent' : colors.bgSecondary);
  const textColor = selected ? colors.white : (variant === 'outline' ? colors.textPrimary : colors.textSecondary);
  const borderColor = variant === 'outline' ? (selected ? colors.primary : colors.borderDefault) : 'transparent';

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.pill,
        minHeight: MIN_TOUCH_TARGET,
        backgroundColor: bgColor,
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor,
        opacity: disabled || loading ? 0.6 : 1,
      }}
      onPress={onPress}
      disabled={disabled || loading || !onPress}
      accessible
      accessibilityLabel={`${label}${selected ? ', selected' : ''}${loading ? ', loading' : ''}`}
      accessibilityRole="togglebutton"
      accessibilityState={{ selected, disabled: disabled || loading }}
      activeOpacity={0.7}
      testID={testID}
    >
      {icon && <View style={{ marginRight: SPACING.xs }}>{icon}</View>}
      <Text style={{ ...GL_TYPOGRAPHY.buttonSm, color: textColor }}>
        {loading ? `${label}...` : label}
      </Text>
    </TouchableOpacity>
  );
};

export const Chip = React.memo(ChipComponent);
