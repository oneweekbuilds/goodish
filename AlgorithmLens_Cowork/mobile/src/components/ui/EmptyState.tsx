import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS, MIN_TOUCH_TARGET } from '../../lib/theme';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: Omit<EmptyStateAction, 'loading'>;
  testID?: string;
}

const EmptyStateComponent: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  testID,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING['3xl'],
    },
    iconContainer: {
      marginBottom: SPACING['2xl'],
    },
    title: {
      fontSize: TYPOGRAPHY.h3.fontSize,
      lineHeight: TYPOGRAPHY.h3.lineHeight,
      fontWeight: TYPOGRAPHY.h3.fontWeight,
      color: colors.textPrimary,
      marginBottom: SPACING.md,
      textAlign: 'center',
    },
    description: {
      fontSize: TYPOGRAPHY.bodySmall.fontSize,
      lineHeight: TYPOGRAPHY.bodySmall.lineHeight,
      color: colors.textSecondary,
      marginBottom: action ? SPACING.xl : 0,
      textAlign: 'center',
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: MIN_TOUCH_TARGET,
    },
    buttonText: {
      color: colors.white,
      fontSize: TYPOGRAPHY.buttonMd.fontSize,
      lineHeight: TYPOGRAPHY.buttonMd.lineHeight,
      fontWeight: TYPOGRAPHY.buttonMd.fontWeight,
    },
    actionRow: {
      flexDirection: 'row',
      gap: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.borderDefault,
      backgroundColor: 'transparent',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: MIN_TOUCH_TARGET,
      flex: 1,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
      fontSize: TYPOGRAPHY.buttonMd.fontSize,
      lineHeight: TYPOGRAPHY.buttonMd.lineHeight,
      fontWeight: TYPOGRAPHY.buttonMd.fontWeight,
    },
  });

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`Empty state: ${title}`}
      testID={testID}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <Text
        style={styles.title}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      {action && secondaryAction ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={Platform.OS === 'web' ? { ...styles.secondaryButton, flex: 1 } : [styles.secondaryButton, { flex: 1 }]}
            onPress={secondaryAction.onPress}
            accessible={true}
            accessibilityLabel={secondaryAction.label}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={Platform.OS === 'web' ? { ...styles.button, flex: 1 } : [styles.button, { flex: 1 }]}
            onPress={action.onPress}
            disabled={action.loading}
            accessible={true}
            accessibilityLabel={action.loading ? `${action.label}, loading` : action.label}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>{action.loading ? `${action.label}...` : action.label}</Text>
          </TouchableOpacity>
        </View>
      ) : action ? (
        <TouchableOpacity
          style={styles.button}
          onPress={action.onPress}
          disabled={action.loading}
          accessible={true}
          accessibilityLabel={action.loading ? `${action.label}, loading` : action.label}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{action.loading ? `${action.label}...` : action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default React.memo(EmptyStateComponent);
