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
  'Your scans may show how much of your feed comes from accounts you don\'t follow — compare across sessions to see if this changes.',
  'Scanning across multiple platforms can reveal how content composition varies between them.',
  'Your scans can show how much of your feed is labeled as sponsored — compare sessions to see if this varies.',
  'Try scanning at different times of day. Your feed composition may look different in the morning versus the evening.',
  'Feed composition can shift noticeably between sessions — scanning regularly helps you spot patterns over time.',
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
        ...shadows.card,
      }}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Daily insight: ${tip}`}
    >
      <View
        style={{
          width: SPACING['3xl'],
          height: SPACING['3xl'],
          borderRadius: SPACING.lg,
          backgroundColor: `${colors.accentGreen}18`,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: SPACING.xxs,
        }}
      >
        <Lightbulb size={14} color={colors.accentGreen} strokeWidth={2} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...TYPOGRAPHY.overline,
            color: colors.textTertiary,
            marginBottom: SPACING.xs,
          }}
        >
          Daily tip
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
