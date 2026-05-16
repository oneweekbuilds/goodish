/**
 * ExpandableCard — the foundational repeating component.
 *
 * Per SKILL.md ("one repeating component does most of the work"):
 *   icon | title | headline metric | chevron | expanded body.
 *
 * Tap anywhere on the header to toggle.
 *
 * Animation:
 *   - Reanimated `Layout` transition with a soft iOS-feeling spring
 *     (mass: 1, damping: 18, stiffness: 220) approximates the design's
 *     280ms / response-0.5 / damping-0.8 expand. The container's height
 *     animates as the body mounts/unmounts.
 *   - Body content fades in via FadeIn at the tail of the expand
 *     (delay 160ms, duration 120ms) per spec ("content fade-in 120ms
 *     at the tail of the expand, not the head").
 *
 * No bounce, no scale, no celebratory motion.
 */
import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  LinearTransition,
} from 'react-native-reanimated';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { colors, type, spacing, motion } from '../design-tokens/tokens';

export interface ExpandableCardProps {
  /** Icon at the left of the header. Brand-primary color. Optional. */
  icon?: IconName;
  /** Section title. Sentence case per spec. */
  title: string;
  /** Headline metric on the right of the header. tabular-nums. */
  headline?: string;
  /** Body content shown when expanded. */
  children?: React.ReactNode;
  /** Whether the card starts open. Defaults to false. */
  defaultOpen?: boolean;
  /** Optional accessibility label override. Defaults to title + headline. */
  accessibilityLabel?: string;
}

export function ExpandableCard({
  icon,
  title,
  headline,
  children,
  defaultOpen = false,
  accessibilityLabel,
}: ExpandableCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const a11yLabel =
    accessibilityLabel ??
    `${title}${headline ? `, ${headline}` : ''}, ${open ? 'expanded' : 'collapsed'}`;

  return (
    <Animated.View
      layout={LinearTransition.springify()
        .mass(motion.spring.mass)
        .damping(motion.spring.damping)
        .stiffness(motion.spring.stiffness)}
    >
      <Card padding={0}>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityState={{ expanded: open }}
          style={({ pressed }) => [
            styles.header,
            pressed && { backgroundColor: colors.brandPrimary12 },
          ]}
        >
          {icon ? (
            <View style={styles.iconWrap}>
              <Icon name={icon} size={16} color={colors.brandPrimary} />
            </View>
          ) : null}
          {/* Title can wrap to a 2nd line if the row's intrinsic width
              exceeds the card. Headline shrinks alongside (RN's default
              flexShrink is 0, so we must opt in) and ellipsizes if needed,
              keeping its tabular-nums when readable.
              Title gets numberOfLines={2} explicitly so RN's text engine
              prefers word-boundary breaks (avoids the "concentrat / ion"
              character-break we saw in Build #51). ellipsizeMode='tail'
              is the clean fallback if even two lines can't fit. */}
          <Text
            style={[styles.title, !icon && { marginLeft: 0 }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {headline ? (
            <Text style={styles.headline} numberOfLines={1} ellipsizeMode="tail">
              {headline}
            </Text>
          ) : null}
          {/* Chevron in a 24×24 brand-tinted circle for tap affordance.
              Same affordance whether the card is collapsed or expanded —
              the chevron flips direction; the circle stays. Subtle, not loud. */}
          <View style={styles.chevronWrap}>
            <Icon
              name={open ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.brandPrimary}
              strokeWidth={2.25}
            />
          </View>
        </Pressable>
        {open ? (
          <Animated.View
            entering={FadeIn.delay(motion.expandMs - motion.contentFadeMs).duration(
              motion.contentFadeMs
            )}
            style={styles.body}
          >
            <View style={styles.bodyDivider} />
            {children}
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingVertical: spacing.s4,
    paddingHorizontal: spacing.s5,
    minHeight: 56, // tap target
  },
  iconWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    // flex: 1 = { flexGrow: 1, flexShrink: 1, flexBasis: 0% }. The
    // explicit flexShrink: 1 reiteration matches the headline below so
    // shrink-priority intent reads at a glance.
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: type.subheading.fontSize,
    lineHeight: type.subheading.lineHeight,
    fontWeight: type.subheading.fontWeight,
    color: colors.textPrimary,
  },
  headline: {
    flexShrink: 1,
    // Cap headline at 40% of the header row so the title is guaranteed
    // ≥60% of the content width (minus icon and chevron). Without this
    // cap, long numeric headlines like "12 of 47 political posts" can
    // squeeze the title narrow enough that a single word like
    // "concentration" overflows even one line and RN forces a
    // character-break.
    maxWidth: '40%',
    fontSize: type.subheading.fontSize,
    lineHeight: type.subheading.lineHeight,
    fontWeight: type.subheading.fontWeight,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  body: {
    paddingHorizontal: spacing.s5,
    paddingBottom: spacing.s5,
  },
  bodyDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.s4,
  },
});
