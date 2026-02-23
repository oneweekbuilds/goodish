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
import { View, Text } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../lib/theme';

/**
 * Epistemically restrained tips — describe observable patterns,
 * never accuse platforms or imply intent.
 */
const DAILY_TIPS: string[] = [
  'On average, about 40% of an Instagram feed consists of suggested content from accounts not followed.',
  'Scanning across multiple platforms can reveal how content composition varies between them.',
  'Ad density in feeds typically ranges from 5% to 15%, depending on the platform.',
  'Most users see content from fewer than 20% of the accounts they follow in a single session.',
  'Feed composition can shift noticeably between morning and evening sessions.',
  'Scanning regularly helps you build a more complete picture of what appears in your feed over time.',
  'Short-form video content has grown to represent a large portion of feed content across platforms.',
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
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.md,
        ...shadows.soft,
      }}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Daily insight: ${tip}`}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.gradientWarmStart,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: SPACING.xxs,
        }}
      >
        <Lightbulb size={14} color={colors.warning} strokeWidth={2} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...TYPOGRAPHY.overline,
            color: colors.textTertiary,
            marginBottom: SPACING.xs,
          }}
        >
          Did you know?
        </Text>
        <Text
          style={{
            ...TYPOGRAPHY.bodySmall,
            color: colors.textSecondary,
            lineHeight: TYPOGRAPHY.bodySmall.lineHeight,
          }}
        >
          {tip}
        </Text>
      </View>
    </View>
  );
}

export const DailyTipCard = React.memo(DailyTipCardComponent);
