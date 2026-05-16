/**
 * FactRow: the FactRow supporting-row variant from the 2.x engine
 * output. A single line of "Label" left, "Value · anchor" right —
 * the workhorse row for the supporting card beneath the sub-line zone.
 *
 * Examples (from the design spec):
 *   "Ads"        →  "12% of feed · typical"
 *   "Patterns"   →  "Top: Tech · same as last 4 scans"
 *
 * Layout decision (load-bearing):
 *
 *   Outer:   flexDirection: 'row', alignItems: 'baseline'
 *   Label:   flex: 1, minWidth: 0 — grows to fill, can wrap if long
 *   Right:   flexShrink: 1, textAlign: 'right' — a single Text that
 *            composes value and (optionally) anchor as nested inline
 *            Text spans
 *
 * The right column is one outer Text, not two siblings. This is the
 * key call: by nesting value + anchor inside one Text, React Native's
 * native text-layout engine handles the wrap behavior for free — when
 * the value+anchor combo fits, it sits on one line; when it doesn't,
 * the engine breaks at the space before the middot and the anchor
 * drops to a second right-aligned line beneath the value. No measure
 * pass, no manual width math. Two-sibling layouts force a choice
 * between "always-inline (anchor never wraps)" or "always-stacked
 * (anchor on its own line even when there's room)"; neither matches
 * the design spec.
 *
 * The anchor span overrides only fontSize, fontWeight, and color —
 * lineHeight is inherited from the outer body-strong Text so the
 * value and anchor share a baseline when on the same line. Setting
 * lineHeight on a nested Text in RN is inconsistent across iOS and
 * Android; inheriting avoids that footgun.
 *
 * When `anchor` is undefined the nested Text is not rendered at all,
 * so there is no trailing middot or whitespace artifact.
 *
 * No dividers between rows — the supporting card uses padding-based
 * rhythm (paddingVertical: spacing.s3 here) rather than hairlines.
 * The card's bg-secondary fill provides the visual container; row
 * dividers would compete with that.
 *
 * Reference: mobile/audits/2x-results-design/decisions.md
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, type } from '../design-tokens/tokens';

export interface FactRowProps {
  /** Left-column label, e.g. "Ads" or "Patterns". */
  label: string;
  /** Right-column value, e.g. "12% of feed" or "Top: Tech". Rendered
   *  in body-strong weight. */
  value: string;
  /** Optional comparative phrase, e.g. "typical" or "2.2x your
   *  typical". Renders in caption register, tertiary gray, preceded
   *  by " · ". Omitted entirely when undefined. */
  anchor?: string;
  testID?: string;
}

export function FactRow({ label, value, anchor, testID }: FactRowProps) {
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={anchor ? `${label}: ${value}, ${anchor}` : `${label}: ${value}`}
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.s3,
        paddingVertical: spacing.s3,
      }}
    >
      <Text
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          fontWeight: type.body.fontWeight,
          color: colors.textPrimary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          flexShrink: 1,
          textAlign: 'right',
          fontSize: type.bodyStrong.fontSize,
          lineHeight: type.bodyStrong.lineHeight,
          fontWeight: type.bodyStrong.fontWeight,
          color: colors.textPrimary,
        }}
      >
        {value}
        {anchor ? (
          <Text
            style={{
              fontSize: type.caption.fontSize,
              fontWeight: type.caption.fontWeight,
              color: colors.textTertiary,
            }}
          >
            {` · ${anchor}`}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}
