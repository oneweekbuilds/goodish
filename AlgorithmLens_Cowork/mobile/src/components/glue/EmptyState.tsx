import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { MIN_TOUCH_TARGET } from '../../lib/theme';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

export interface EmptyStateProps {
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

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING['3xl'],
      }}
      accessible
      accessibilityLabel={`Empty state: ${title}`}
      testID={testID}
    >
      <View style={{ marginBottom: SPACING['2xl'] }}>{icon}</View>
      <Text
        style={{ ...GL_TYPOGRAPHY.h3, color: colors.textPrimary, marginBottom: SPACING.md, textAlign: 'center' }}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Text style={{ ...GL_TYPOGRAPHY.bodySmall, color: colors.textSecondary, marginBottom: action ? SPACING.xl : 0, textAlign: 'center' }}>
        {description}
      </Text>
      {action && secondaryAction ? (
        <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <TouchableOpacity
            style={{
              flex: 1, borderWidth: 1, borderColor: colors.borderDefault, backgroundColor: 'transparent',
              paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
              alignItems: 'center', justifyContent: 'center', minHeight: MIN_TOUCH_TARGET,
            }}
            onPress={secondaryAction.onPress}
            accessible accessibilityLabel={secondaryAction.label} accessibilityRole="button" activeOpacity={0.7}
          >
            <Text style={{ ...GL_TYPOGRAPHY.buttonMd, color: colors.textPrimary }}>{secondaryAction.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1, backgroundColor: colors.primary,
              paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
              alignItems: 'center', justifyContent: 'center', minHeight: MIN_TOUCH_TARGET,
            }}
            onPress={action.onPress}
            disabled={action.loading}
            accessible accessibilityLabel={action.loading ? `${action.label}, loading` : action.label} accessibilityRole="button" activeOpacity={0.7}
          >
            <Text style={{ ...GL_TYPOGRAPHY.buttonMd, color: colors.white }}>{action.loading ? `${action.label}...` : action.label}</Text>
          </TouchableOpacity>
        </View>
      ) : action ? (
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
            borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', minHeight: MIN_TOUCH_TARGET,
          }}
          onPress={action.onPress}
          disabled={action.loading}
          accessible accessibilityLabel={action.loading ? `${action.label}, loading` : action.label} accessibilityRole="button" activeOpacity={0.7}
        >
          <Text style={{ ...GL_TYPOGRAPHY.buttonMd, color: colors.white }}>{action.loading ? `${action.label}...` : action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const EmptyState = React.memo(EmptyStateComponent);
