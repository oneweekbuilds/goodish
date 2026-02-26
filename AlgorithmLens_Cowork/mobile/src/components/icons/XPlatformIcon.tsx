/**
 * XPlatformIcon — Custom "X" icon for the X (formerly Twitter) platform.
 *
 * L-05 FIX: Replaces the old Twitter bird icon with a bold "X" letterform
 * that matches the current X brand. Uses the same prop interface as lucide
 * icons (size, color, strokeWidth) so it's a drop-in replacement.
 *
 * Note: lucide-react-native does not have an official X (Twitter) logo icon.
 * The lucide `X` icon is a close/dismiss icon (×), not the platform logo.
 * This component renders an SVG "X" that visually matches the X brand.
 */

import React from 'react';
import { Text, View } from 'react-native';

interface XPlatformIconProps {
  size: number;
  color: string;
  strokeWidth?: number;
}

/**
 * Renders a bold "X" character styled to match the X platform branding.
 * Uses a Text element for simplicity and cross-platform compatibility.
 */
export function XPlatformIcon({ size, color }: XPlatformIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.72,
          fontWeight: '800',
          color,
          lineHeight: size,
          textAlign: 'center',
          // Slight offset to visually center the character
          includeFontPadding: false,
          textAlignVertical: 'center',
        }}
        allowFontScaling={false}
      >
        𝕏
      </Text>
    </View>
  );
}
