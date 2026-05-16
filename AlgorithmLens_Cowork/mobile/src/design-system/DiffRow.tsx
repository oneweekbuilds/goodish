/**
 * DiffRow: 4-column metric comparison row used in the Compare result
 * screen.
 *
 *   [metric label] [A value] [B value] [delta]
 *
 * All three value columns render in tabular nums so digits align vertically
 * across rows. The delta column uses brand green when the change is
 * favorable (per-metric direction is the caller's responsibility: pass
 * `deltaTone: 'positive'` to mark improvement), and textSecondary
 * otherwise. An optional arrow glyph accompanies the delta.
 *
 * Em-dash glyphs ("—") passed as value strings are an intentional
 * typographic placeholder, per the DESIGN.md carve-out: the no-em-dashes
 * rule applies to copy, not to single-glyph placeholders used to indicate
 * absent values. Pass `deltaArrow: 'none'` alongside an em-dash delta
 * label to suppress the directional glyph.
 */
import React from 'react';
import { View, Text, type TextStyle } from 'react-native';
import { Icon } from './Icon';
import { colors, type, spacing } from '../design-tokens/tokens';

export interface DiffRowProps {
  metric: string;
  valueA: string;
  valueB: string;
  deltaLabel: string;
  /** 'positive' paints the delta brand-green; 'neutral' uses textSecondary. */
  deltaTone: 'positive' | 'neutral';
  /** 'none' suppresses the arrow (for em-dash placeholders or flat zero). */
  deltaArrow: 'up' | 'down' | 'flat' | 'none';
}

export function DiffRow({
  metric,
  valueA,
  valueB,
  deltaLabel,
  deltaTone,
  deltaArrow,
}: DiffRowProps) {
  const deltaColor =
    deltaTone === 'positive' ? colors.brandAccent : colors.textSecondary;

  return (
    <View
      accessible
      accessibilityLabel={`${metric}: ${valueA} now, was ${valueB}, change ${deltaLabel}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.s4,
        paddingVertical: spacing.s3,
        gap: spacing.s3,
      }}
    >
      <Text
        style={{
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          fontWeight: type.body.fontWeight,
          color: colors.textPrimary,
          flex: 1,
          minWidth: 0,
        }}
        numberOfLines={1}
      >
        {metric}
      </Text>
      <Text style={valueAStyle} numberOfLines={1}>
        {valueA}
      </Text>
      <Text style={valueBStyle} numberOfLines={1}>
        {valueB}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          minWidth: 56,
          justifyContent: 'flex-end',
        }}
      >
        {deltaArrow === 'up' ? (
          <Icon
            name="arrow-up"
            size={12}
            color={deltaColor}
            strokeWidth={2.25}
          />
        ) : null}
        {deltaArrow === 'down' ? (
          <Icon
            name="arrow-down"
            size={12}
            color={deltaColor}
            strokeWidth={2.25}
          />
        ) : null}
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.bodyStrong.fontWeight,
            color: deltaColor,
            fontVariant: ['tabular-nums'],
          }}
        >
          {deltaLabel}
        </Text>
      </View>
    </View>
  );
}

const valueAStyle: TextStyle = {
  fontSize: type.body.fontSize,
  lineHeight: type.body.lineHeight,
  fontWeight: type.bodyStrong.fontWeight,
  color: colors.textPrimary,
  fontVariant: ['tabular-nums'],
  minWidth: 56,
  textAlign: 'right',
};

const valueBStyle: TextStyle = {
  fontSize: type.body.fontSize,
  lineHeight: type.body.lineHeight,
  fontWeight: type.body.fontWeight,
  color: colors.textSecondary,
  fontVariant: ['tabular-nums'],
  minWidth: 56,
  textAlign: 'right',
};
