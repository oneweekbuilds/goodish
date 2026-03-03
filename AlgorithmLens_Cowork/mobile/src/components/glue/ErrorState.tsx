import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { MIN_TOUCH_TARGET } from '../../lib/theme';

export interface ErrorStateProps {
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

  return (
    <View
      style={{ paddingVertical: SPACING['2xl'], paddingHorizontal: SPACING.lg, alignItems: 'center' }}
      accessible accessibilityLabel={`Error: ${message}`} accessibilityRole="alert" testID={testID}
    >
      <View style={{
        width: 56, height: 56, borderRadius: RADIUS.md, backgroundColor: colors.errorLight,
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
      }}>
        {icon || <AlertCircle color={colors.error} size={32} />}
      </View>
      <Text style={{ ...GL_TYPOGRAPHY.body, color: colors.textPrimary, textAlign: 'center', marginBottom: onRetry ? SPACING.lg : 0 }}>
        {message}
      </Text>
      {errorCode && (
        <Text style={{ ...GL_TYPOGRAPHY.captionSmall, color: colors.textTertiary, textAlign: 'center', marginTop: SPACING.sm }}>
          Error code: {errorCode}
        </Text>
      )}
      {onRetry && (
        <TouchableOpacity
          style={{
            paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
            borderWidth: 1, borderColor: colors.error, minHeight: MIN_TOUCH_TARGET,
            justifyContent: 'center', alignItems: 'center',
          }}
          onPress={onRetry}
          disabled={retrying}
          accessible accessibilityLabel={retrying ? 'Retrying' : 'Retry'} accessibilityRole="button" activeOpacity={0.7}
        >
          <Text style={{ ...GL_TYPOGRAPHY.buttonMd, color: colors.error }}>{retrying ? 'Retrying...' : 'Retry'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const ErrorState = React.memo(ErrorStateComponent);
