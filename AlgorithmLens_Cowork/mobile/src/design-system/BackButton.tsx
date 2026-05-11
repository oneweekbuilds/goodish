/**
 * BackButton: standardized 44x44 back affordance.
 *
 * 24px chevron-left in a transparent 44x44 tap area, no border, opacity
 * 0.6 on press. The accessibility label defaults to "Back" and can be
 * overridden for context-specific announcements.
 *
 * Replaces the three inline back-button patterns previously duplicated
 * across scanner / broadcast / analysis routes. Compare's inline header
 * keeps its own back affordance for now; future cleanup will migrate it.
 */
import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from './Icon';
import { colors, tap } from '../design-tokens/tokens';

export interface BackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

export function BackButton({
  onPress,
  accessibilityLabel = 'Back',
}: BackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => ({
        width: tap.min,
        height: tap.min,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name="chevron-left" size={24} color={colors.textPrimary} />
    </Pressable>
  );
}
