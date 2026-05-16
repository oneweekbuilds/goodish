/**
 * StackedBar — flat 100% horizontal stacked bar in brand-only colors.
 *
 * Replaces the legacy ALStackedBar (animated, gradient-tinted, multi-shape
 * legend, 36px tall) for use in the redesigned dashboard tabs. Per the
 * brand spec:
 *   - Fixed 8px height (the "thin bar" pattern from the design's
 *     concentration breakdown, not the legacy 36px fat bar)
 *   - 4px outer corner radius
 *   - No animation, no gradient, no shadow
 *   - No on-bar labels (consumer renders labels via CategoryRow / AttributeCard
 *     above or below the bar)
 *   - Track color is the design system's hairline border so a partial bar
 *     reads cleanly against the surrounding card
 *
 * TypeScript enforces token-only colors via the `ColorToken` union — raw hex
 * strings are rejected at compile time. If a consumer needs a color that
 * doesn't exist in the token map, add it to `design-tokens/tokens.ts` first.
 */
import React from 'react';
import { View } from 'react-native';
import { colors, type ColorToken } from '../design-tokens/tokens';

export interface StackedBarSegment {
  /**
   * Optional label. Not rendered visually — used only to compose the
   * default accessibility label for the bar (e.g. "Top 5 60%, Others 40%").
   * Pass it so VoiceOver users get a meaningful description.
   */
  label?: string;
  /** Percentage 0–100. Negative or NaN values are clamped to 0. */
  value: number;
  /**
   * Color must be a key from `design-tokens/tokens.ts` colors. This
   * intentionally rejects raw hex strings — every color on the bar must
   * be a brand token.
   */
  color: ColorToken;
}

export interface StackedBarProps {
  segments: StackedBarSegment[];
  /**
   * Bar height in pixels. Defaults to 8 per the design spec. Override only
   * when an explicit deviation is documented in the consumer.
   */
  height?: number;
  /**
   * Optional override for VoiceOver. Defaults to a comma-separated list of
   * "{label} {value}%" pairs.
   */
  accessibilityLabel?: string;
}

function defaultA11y(segments: StackedBarSegment[]): string {
  return segments
    .filter((s) => s.value > 0)
    .map((s) => `${s.label ?? 'segment'} ${Math.round(s.value)}%`)
    .join(', ');
}

export function StackedBar({
  segments,
  height = 8,
  accessibilityLabel,
}: StackedBarProps) {
  // Clamp + filter zero-or-negative segments so we don't emit useless
  // <View width="0%" /> nodes (RN flex behaves oddly on 0% width).
  const visible = segments
    .map((s) => ({ ...s, value: Number.isFinite(s.value) && s.value > 0 ? s.value : 0 }))
    .filter((s) => s.value > 0);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? defaultA11y(segments)}
      style={{
        flexDirection: 'row',
        height,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: colors.border,
      }}
    >
      {visible.map((seg, i) => (
        <View
          key={`${seg.label ?? 'seg'}-${i}`}
          style={{
            width: `${seg.value}%`,
            height,
            backgroundColor: colors[seg.color],
          }}
        />
      ))}
    </View>
  );
}
