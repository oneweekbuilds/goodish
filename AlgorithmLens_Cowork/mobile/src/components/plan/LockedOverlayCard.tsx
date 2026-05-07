/**
 * LockedOverlayCard — React Native equivalent of the main site's LockedOverlayCard.
 *
 * Wraps premium content with a subtle inline card for free-tier users.
 * When `locked` is false, renders children as-is (no overlay).
 *
 * Visual behavior:
 * - Styled as a normal dashboard card (bgCard background, borderDefault border)
 *   so upsell cards feel like natural extensions of the dashboard, not ads.
 * - Small sparkle icon + concise copy + text-link CTA.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { Text } from '../glue';

interface LockedOverlayCardProps {
  /** When false, renders children without overlay. */
  locked: boolean;
  /** Card title. */
  title?: string;
  /** Card body description. */
  body?: string;
  /** CTA button label (ignored — CTA is now fixed text link). */
  ctaLabel?: string;
  /** Called when the CTA is pressed. */
  onUpgrade?: () => void;
  /** The premium content to wrap. */
  children: React.ReactNode;
}

function LockedOverlayCardComponent({
  locked = false,
  title = 'See how your feed changes over time',
  body = 'Trend tracking, creator breakdowns, and rare content detection, the full picture behind your feed.',
  ctaLabel: _ctaLabel,
  onUpgrade,
  children,
}: LockedOverlayCardProps) {
  const { colors } = useTheme();

  if (!locked) {
    return <>{children}</>;
  }

  const cardStyle = Platform.OS === 'web'
    ? {
        ...styles.card,
        backgroundColor: colors.bgCard,
        borderColor: colors.borderDefault,
      }
    : [styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderDefault }];

  return (
    <View style={cardStyle}>
      {/* Header row: icon + title */}
      <View style={styles.headerRow}>
        <Sparkles size={16} color={colors.primaryBlue} strokeWidth={2} />
        <Text
          variant="h3"
          color={colors.textMain}
          style={{ flexShrink: 1 }}
        >
          {title}
        </Text>
      </View>

      {/* Description */}
      <Text
        variant="caption"
        color={colors.textSecondary}
        style={[
          { lineHeight: GL_TYPOGRAPHY.bodySmall.lineHeight, paddingLeft: SPACING.sm + 16 }
        ]}
      >
        {body}
      </Text>

      {/* Text-link CTA */}
      {onUpgrade && (
        <TouchableOpacity
          onPress={onUpgrade}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`Premium feature: ${title}. Try free for 14 days`}
          accessibilityHint="Opens upgrade flow to unlock premium features"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            variant="label"
            color={colors.primaryBlue}
            style={{ paddingLeft: SPACING.sm + 16, paddingTop: SPACING.xs }}
          >
            Try free for 14 days →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export const LockedOverlayCard = React.memo(LockedOverlayCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});
