import React from 'react';
import {
  View,
  Text,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../lib/theme';

// Web-safe gradient wrapper for LinearGradient
const GradientWrapper = Platform.OS === 'web'
  ? ({ colors: gradientColors, start, end, style, children, ...props }: any) => {
      const flatStyle = style ? (Array.isArray(style) ? Object.assign({}, ...style) : style) : {};
      return (
        <View
          style={{
            ...flatStyle,
            background: `linear-gradient(to bottom, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
          }}
          {...props}
        >
          {children}
        </View>
      );
    }
  : LinearGradient;

interface MetricCardProps {
  headline: string;
  value?: string | null;
  microLine?: string | null;
  /** Contextual insight line — e.g. "That's lower than average" */
  contextLine?: string | null;
  denominatorText?: string;
  fallbackText?: string;
  hasData: boolean;
  /** Optional icon rendered to the left of the value */
  icon?: React.ReactNode;
}

const MetricCardComponent: React.FC<MetricCardProps> = ({
  headline,
  value = null,
  microLine = null,
  contextLine = null,
  denominatorText = '',
  fallbackText = 'This data appears after scanning more content',
  hasData,
  icon,
}) => {
  const { colors, shadows } = useTheme();
  const accessibilityLabel = `${headline}${value ? ': ' + value : ''}${microLine ? '. ' + microLine : ''}${contextLine ? '. ' + contextLine : ''}`;

  return (
    <GradientWrapper
      colors={[colors.bgCard, colors.bgCardGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.brandTintBorder,
        ...shadows.card,
      }}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
    >
      {hasData ? (
        <>
          {/* Value row with optional icon */}
          {value && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
              {icon && (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: RADIUS.md,
                    backgroundColor: colors.blue50,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {icon}
                </View>
              )}
              <Text
                style={{
                  fontSize: RFValue(22),
                  fontWeight: '700',
                  color: colors.textMain,
                  letterSpacing: -0.5,
                }}
              >
                {value}
              </Text>
            </View>
          )}

          <Text
            style={{
              ...TYPOGRAPHY.label,
              color: colors.textMuted,
              marginBottom: microLine || denominatorText || contextLine ? SPACING.xxs : 0,
            }}
          >
            {headline}
          </Text>

          {microLine && (
            <Text
              style={{
                ...TYPOGRAPHY.caption,
                color: colors.textSecondary,
                marginTop: SPACING.xxs,
              }}
            >
              {microLine}
            </Text>
          )}

          {contextLine && (
            <Text
              style={{
                ...TYPOGRAPHY.caption,
                color: colors.primary,
                fontWeight: '500',
                marginTop: SPACING.xs,
              }}
            >
              {contextLine}
            </Text>
          )}

          {denominatorText && (
            <Text
              style={{
                ...TYPOGRAPHY.caption,
                color: colors.textSecondary,
                marginTop: SPACING.xs,
              }}
            >
              {denominatorText}
            </Text>
          )}
        </>
      ) : (
        <Text
          style={{
            ...TYPOGRAPHY.bodySmall,
            color: colors.textSecondary,
            fontStyle: 'italic',
            textAlign: 'center',
            paddingVertical: SPACING.md,
          }}
        >
          {fallbackText}
        </Text>
      )}
    </GradientWrapper>
  );
};

export const MetricCard = React.memo(MetricCardComponent);
