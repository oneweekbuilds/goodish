/**
 * ComparisonPair — two labelled StackedBar mini-rows for A/B comparison.
 *
 * Replaces the legacy ToneComparisonCard from src/components/dashboard.
 * Used inside an ExpandableCard body to compare two grouped distributions
 * (e.g. selling vs. not-selling tone, suggested vs. followed commercial
 * content). The consumer owns the surrounding card chrome — this
 * primitive renders only the labelled bars + optional delta caption.
 *
 * Layout
 *   - Always stacks vertically (two bars one above the other). The legacy
 *     ToneComparisonCard switched to vertical at < 380pt window width;
 *     by always stacking we eliminate the useWindowDimensions read,
 *     satisfy the "no internal state" rule from the spec, and produce a
 *     consistent rhythm at every iPhone size.
 *   - Group label sits directly above its bar. Bars are the design
 *     system default (8px tall, 4px corner radius) via StackedBar.
 *   - Optional per-group `denominator` caption sits between label and bar
 *     in textTertiary (e.g. "based on 12 posts"). When absent, no empty
 *     space is introduced: the label → bar gap stays exactly spacing.s2.
 *   - Optional delta insight renders as a caption beneath both groups.
 *
 * Color discipline
 *   - StackedBarSegment.color is the `ColorToken` union — raw hex is
 *     rejected at compile time. ComparisonPair inherits this guarantee:
 *     any palette violation in a segment fails the TypeScript build.
 *
 * No animation, no internal state, no Pressable surfaces. Caller composes
 * the surrounding chrome (typically an ExpandableCard).
 */
import React from 'react';
import { View, Text } from 'react-native';
import { StackedBar, type StackedBarSegment } from './StackedBar';
import { colors, type, spacing } from '../design-tokens/tokens';

export interface ComparisonPairGroup {
  /** Label rendered above the bar. Sentence case per brand voice. */
  label: string;
  /**
   * Optional sample-size caption rendered between the label and the bar
   * in textTertiary (e.g. "based on 12 posts"). Surfaces per-side counts
   * so the user can weigh each side's reliability — core to the
   * epistemic-restraint voice. When undefined or an empty string the
   * caption is omitted entirely and no extra vertical space is
   * introduced (label → bar gap stays exactly spacing.s2).
   */
  denominator?: string;
  /**
   * Stacked-bar segments for this group. Each segment's color must be
   * a `ColorToken` key (see StackedBar) — raw hex is rejected at
   * compile time.
   */
  segments: StackedBarSegment[];
  /**
   * Optional accessibility label for this group's bar. If omitted,
   * StackedBar composes one from the segments' label+value pairs.
   */
  accessibilityLabel?: string;
}

export interface ComparisonPairProps {
  /** The left/first/upper group. */
  left: ComparisonPairGroup;
  /** The right/second/lower group. */
  right: ComparisonPairGroup;
  /**
   * Optional one-sentence interpretation of the comparison
   * (e.g. "12% more positive in suggested feed"). Renders as a caption
   * in textSecondary below the bars. Sentence case per brand voice.
   * Pass null/undefined to omit the caption entirely.
   */
  deltaInsight?: string | null;
}

/**
 * Renders one labelled bar. Internal — kept private so the public API
 * is the pair, not the individual group.
 *
 * Spacing intent (manual margins, not parent `gap`, because the absent-
 * denominator path must NOT introduce empty vertical space):
 *   - label  → denominator: marginTop spacing.s1 (only when present)
 *   - denominator → bar:    marginTop spacing.s2 (when denominator present)
 *   - label  → bar:         marginTop spacing.s2 (when denominator absent)
 */
function ComparisonGroup({ group }: { group: ComparisonPairGroup }) {
  // Treat empty string the same as undefined per the public type contract.
  const hasDenominator = !!group.denominator;
  return (
    <View>
      <Text
        style={{
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          fontWeight: type.bodyStrong.fontWeight,
          color: colors.textPrimary,
        }}
      >
        {group.label}
      </Text>
      {hasDenominator ? (
        <Text
          style={{
            fontSize: type.caption.fontSize,
            lineHeight: type.caption.lineHeight,
            color: colors.textTertiary,
            marginTop: spacing.s1,
          }}
        >
          {group.denominator}
        </Text>
      ) : null}
      <View style={{ marginTop: spacing.s2 }}>
        <StackedBar
          segments={group.segments}
          accessibilityLabel={group.accessibilityLabel}
        />
      </View>
    </View>
  );
}

export function ComparisonPair({ left, right, deltaInsight }: ComparisonPairProps) {
  return (
    <View style={{ gap: spacing.s4 }}>
      <ComparisonGroup group={left} />
      <ComparisonGroup group={right} />
      {deltaInsight ? (
        <Text
          style={{
            fontSize: type.caption.fontSize,
            lineHeight: type.caption.lineHeight,
            color: colors.textSecondary,
            marginTop: spacing.s1,
          }}
        >
          {deltaInsight}
        </Text>
      ) : null}
    </View>
  );
}
