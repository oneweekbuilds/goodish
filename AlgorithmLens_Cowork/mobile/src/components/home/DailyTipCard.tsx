/**
 * DailyTipCard — Rotating insight card with feed-related observations.
 *
 * Shows one tip per day (rotates based on the day of the year).
 * Epistemically restrained: describes observable patterns,
 * never implies algorithmic intent or manipulation.
 *
 * Design: Subtle card with a lightbulb icon. Calm and informational.
 */

import React, { useMemo } from 'react';
import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lightbulb } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, ICON_SIZES } from '../../lib/theme';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
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

/**
 * Epistemically restrained tips — describe observable patterns,
 * never accuse platforms or imply intent.
 */
const DAILY_TIPS: string[] = [
  'Your scans may show how much of your feed comes from accounts you don\'t follow, compare across sessions to see if this changes.',
  'Scanning across multiple platforms can reveal how content composition varies between them.',
  'Your scans can show how much of your feed is labeled as sponsored, compare sessions to see if this varies.',
  'Try scanning at different times of day. Your feed composition may look different in the morning versus the evening.',
  'Feed composition can shift noticeably between sessions, scanning regularly helps you spot patterns over time.',
  'Scanning regularly helps you build a more complete picture of what appears in your feed over time.',
  'Check your Sources tab to see how concentrated your feed is among a few accounts.',
  'Your Feed Score reflects source diversity, ad density, and content balance in your recent scans.',
];

function DailyTipCardComponent() {
  const { colors, shadows } = useTheme();

  const tip = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
  }, []);

  return (
    <GradientWrapper
      colors={[colors.bgCard, colors.bgCardGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.md,
        ...shadows.card,
      }}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Daily insight: ${tip}`}
    >
      <View
        style={{
          width: ICON_SIZES.lg,
          height: ICON_SIZES.lg,
          borderRadius: RADIUS.md,
          backgroundColor: colors.green50,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: SPACING.xxs,
        }}
      >
        <Lightbulb size={16} color={colors.accentGreen} strokeWidth={1.8} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...GL_TYPOGRAPHY.overline,
            color: colors.textTertiary,
            marginBottom: SPACING.xs,
          }}
        >
          Daily tip
        </Text>
        <Text
          style={{
            ...GL_TYPOGRAPHY.bodySmall,
            color: colors.textSecondary,
            lineHeight: GL_TYPOGRAPHY.bodySmall.lineHeight,
          }}
        >
          {tip}
        </Text>
      </View>
    </GradientWrapper>
  );
}

export const DailyTipCard = React.memo(DailyTipCardComponent);
