/**
 * LockedOverlayCard — React Native equivalent of the main site's LockedOverlayCard.
 *
 * Wraps premium content with a blur overlay and "Unlock Plus" CTA for free-tier users.
 * When `locked` is false, renders children as-is (no overlay).
 *
 * Visual behavior:
 * - Children remain rendered underneath with a blur effect so the underlying
 *   content is tantalizingly visible but not readable.
 * - A semi-transparent overlay with CTA sits on top.
 * - Trial messaging matches the main site: "Try free for 14 days."
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../lib/theme';

const TRIAL_DAYS = 14;

interface LockedOverlayCardProps {
  /** When false, renders children without overlay. */
  locked: boolean;
  /** Overlay title. */
  title?: string;
  /** Overlay body description. */
  body?: string;
  /** CTA button label. */
  ctaLabel?: string;
  /** Called when the CTA is pressed. */
  onUpgrade?: () => void;
  /** The premium content to wrap. */
  children: React.ReactNode;
}

function LockedOverlayCardComponent({
  locked = false,
  title = 'Deeper analysis available',
  body = 'Your snapshot shows the headlines. Plus reveals the full picture — trend tracking, creator breakdowns, and rare content detection.',
  ctaLabel = `Try free for ${TRIAL_DAYS} days`,
  onUpgrade,
  children,
}: LockedOverlayCardProps) {
  const { colors } = useTheme();

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Blurred content underneath — visible but not readable */}
      <View style={styles.blurredContent} pointerEvents="none">
        {children}
      </View>

      {/* Overlay */}
      <View style={[styles.overlay, { backgroundColor: colors.overlayBg, borderColor: colors.borderSlate200 }]}>
        <View style={styles.overlayInner}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: colors.blue50 }]}>
            <Sparkles size={22} color={colors.primaryBlue} strokeWidth={2} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textMain }]}>{title}</Text>

          {/* Body */}
          <Text style={[styles.body, { color: colors.textMuted }]}>{body}</Text>

          {/* CTA */}
          {onUpgrade && (
            <View style={styles.ctaContainer}>
              <TouchableOpacity
                onPress={onUpgrade}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Premium feature: ${title}. ${ctaLabel}`}
                accessibilityHint="Opens upgrade flow to unlock premium features"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.ctaButton, { backgroundColor: colors.primaryBlue, minHeight: 44 }]}
              >
                <Text style={[styles.ctaText, { color: colors.white }]}>{ctaLabel}</Text>
              </TouchableOpacity>
              <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                No charge for {TRIAL_DAYS} days. Cancel anytime.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export const LockedOverlayCard = React.memo(LockedOverlayCardComponent);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
  },
  blurredContent: {
    // Approximate blur on RN: reduce opacity + overlay does the rest.
    // On iOS we get real blur via the overlay backdrop; on Android we
    // rely on low opacity to make content tantalizingly visible.
    // Platform-specific opacity values: iOS can be higher (0.35) due to native blur effect,
    // Android lower (0.25) to compensate for lack of native blur.
    opacity: Platform.OS === 'ios' ? 0.35 : 0.25,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  overlayInner: {
    maxWidth: 300,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['2xl'],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  body: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  ctaContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ctaButton: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    ...SHADOWS.soft,
  },
  ctaText: {
    ...TYPOGRAPHY.h3,
  },
  disclaimer: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
  },
});
