/**
 * Card — the foundation surface element.
 *
 * Per SKILL.md: white bg, hairline border, 12 radius, no shadow.
 * Press state on cards: background shifts to bg-secondary for the duration
 * of the touch (no scale, no shadow).
 *
 * Implemented as a Pressable when onPress is supplied, a plain View
 * otherwise. We use Pressable's render-prop form so the press feedback
 * is owned by the component, not the caller.
 */
import React from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radius, layout } from '../design-tokens/tokens';

export interface CardProps {
  children: React.ReactNode;
  /** Internal padding. Defaults to layout.cardPadding (20). Pass 0 to
   * lay out custom edge content (e.g. ExpandableCard's header row). */
  padding?: number;
  /** Tap handler. When set, the Card becomes a Pressable with the brand
   * press-feedback (bg shifts to bg-secondary). */
  onPress?: PressableProps['onPress'];
  /** Optional style overrides. Caller-supplied. */
  style?: ViewStyle;
  /** Accessibility label. Required when onPress is set. */
  accessibilityLabel?: string;
}

export function Card({
  children,
  padding = layout.cardPadding,
  onPress,
  style,
  accessibilityLabel,
}: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.card,
          { padding, backgroundColor: pressed ? colors.bgSecondary : colors.bgPrimary },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    // Explicitly: no shadow. Per spec.
  },
});
