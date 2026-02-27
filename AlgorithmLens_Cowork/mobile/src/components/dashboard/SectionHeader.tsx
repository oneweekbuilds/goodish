import React from 'react';
import {
  View,
  Text,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { TYPOGRAPHY, SPACING } from '../../lib/theme';

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

type HeaderLevel = 'h2' | 'h3';

interface SectionHeaderProps {
  title: string;
  subtitle?: string | null;
  level?: HeaderLevel;
}

const SectionHeaderComponent: React.FC<SectionHeaderProps> = ({
  title,
  subtitle = null,
  level = 'h2',
}) => {
  const { colors } = useTheme();
  const isH2 = level === 'h2';
  const barHeight = isH2 ? 20 : 16;
  const titleStyle = isH2 ? TYPOGRAPHY.h2 : TYPOGRAPHY.h3;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.md,
        marginTop: SPACING.lg,
      }}
    >
      {/* Gradient Accent Bar */}
      <GradientWrapper
        colors={[colors.primaryBlue, colors.barMedium]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          width: 2,
          height: barHeight,
          borderRadius: 1,
        }}
      />

      {/* Content */}
      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={{
            ...titleStyle,
            color: colors.textMain,
            marginBottom: subtitle ? SPACING.xs : 0,
          }}
          accessibilityRole="header"
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={{
              ...TYPOGRAPHY.bodySmall,
              color: colors.textSecondary,
              maxWidth: 560,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

export const SectionHeader = React.memo(SectionHeaderComponent);
