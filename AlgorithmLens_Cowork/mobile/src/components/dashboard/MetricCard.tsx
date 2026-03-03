import React from 'react';
import {
  View,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { ICON_SIZES } from '../../lib/theme';
import { Text } from '../glue';

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
  /** Optional color override for the contextLine text */
  contextLineColor?: string;
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
  contextLineColor,
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
                    width: ICON_SIZES.lg,
                    height: ICON_SIZES.lg,
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
                variant={value && value.length <= 4 ? "bigNumber" : "h2"}
                color={colors.textMain}
                style={value && value.length > 4 ? { letterSpacing: GL_TYPOGRAPHY.h2.letterSpacing } : {}}
              >
                {value}
              </Text>
            </View>
          )}

          <Text
            variant="label"
            color={colors.textMuted}
            style={{
              marginBottom: microLine || denominatorText || contextLine ? SPACING.xxs : 0,
            }}
          >
            {headline}
          </Text>

          {microLine && (
            <Text
              variant="caption"
              color={colors.textSecondary}
              style={{
                marginTop: SPACING.xxs,
              }}
            >
              {microLine}
            </Text>
          )}

          {contextLine && (
            <Text
              variant="caption"
              color={contextLineColor || colors.primary}
              style={{
                fontWeight: '500',
                marginTop: SPACING.xs,
              }}
            >
              {contextLine}
            </Text>
          )}

          {denominatorText && (
            <Text
              variant="caption"
              color={colors.textSecondary}
              style={{
                marginTop: SPACING.xs,
              }}
            >
              {denominatorText}
            </Text>
          )}
        </>
      ) : (
        <Text
          variant="bodySmall"
          color={colors.textSecondary}
          align="center"
          style={{
            fontStyle: 'italic',
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
