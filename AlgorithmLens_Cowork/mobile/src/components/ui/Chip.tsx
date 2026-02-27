import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../lib/theme';

export type ChipVariant = 'default' | 'outline';

interface ChipProps {
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

  const getBackgroundColor = (): string => {
    if (selected) {
      return colors.primary;
    }
    return variant === 'outline' ? 'transparent' : colors.bgSecondary;
  };

  const getTextColor = (): string => {
    if (selected) {
      return colors.white;
    }
    return variant === 'outline' ? colors.textPrimary : colors.textSecondary;
  };

  const getBorderColor = (): string | undefined => {
    if (variant === 'outline') {
      return selected ? colors.primary : colors.borderDefault;
    }
    return undefined;
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.pill,
      minHeight: 44,
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: getBorderColor() || 'transparent',
      opacity: disabled || loading ? 0.6 : 1,
    },
    iconContainer: {
      marginRight: icon ? SPACING.xs : 0,
    },
    text: {
      color: getTextColor(),
      fontSize: TYPOGRAPHY.buttonSm.fontSize,
      lineHeight: TYPOGRAPHY.buttonSm.lineHeight,
      fontWeight: TYPOGRAPHY.buttonSm.fontWeight,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={disabled || loading || !onPress}
      accessible={true}
      accessibilityLabel={`${label}${selected ? ', selected' : ''}${loading ? ', loading' : ''}`}
      accessibilityRole="togglebutton"
      accessibilityState={{ selected, disabled: disabled || loading }}
      activeOpacity={0.7}
      testID={testID}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.text}>{loading ? `${label}...` : label}</Text>
    </TouchableOpacity>
  );
};

export default React.memo(ChipComponent);
