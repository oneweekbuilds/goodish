import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS, MIN_TOUCH_TARGET } from '../../lib/theme';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
  retrying?: boolean;
  errorCode?: string;
  testID?: string;
}

const ErrorStateComponent: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  icon,
  retrying = false,
  errorCode,
  testID,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      paddingVertical: SPACING['2xl'],
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: RADIUS.md,
      backgroundColor: colors.errorLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    message: {
      fontSize: TYPOGRAPHY.body.fontSize,
      lineHeight: TYPOGRAPHY.body.lineHeight,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: onRetry ? SPACING.lg : 0,
    },
    errorCode: {
      fontSize: TYPOGRAPHY.captionSmall.fontSize,
      lineHeight: TYPOGRAPHY.captionSmall.lineHeight,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: SPACING.sm,
    },
    button: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.error,
      minHeight: MIN_TOUCH_TARGET,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      color: colors.error,
      fontSize: TYPOGRAPHY.buttonMd.fontSize,
      lineHeight: TYPOGRAPHY.buttonMd.lineHeight,
      fontWeight: TYPOGRAPHY.buttonMd.fontWeight,
    },
  });

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`Error: ${message}`}
      accessibilityRole="alert"
      testID={testID}
    >
      <View style={styles.iconContainer}>
        {icon || <AlertCircle color={colors.error} size={32} />}
      </View>
      <Text style={styles.message}>{message}</Text>
      {errorCode && <Text style={styles.errorCode}>Error code: {errorCode}</Text>}
      {onRetry && (
        <TouchableOpacity
          style={styles.button}
          onPress={onRetry}
          disabled={retrying}
          accessible={true}
          accessibilityLabel={retrying ? "Retrying" : "Retry"}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{retrying ? 'Retrying...' : 'Retry'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(ErrorStateComponent);
