/**
 * Sparkline: trend visualization for the Feed Score card.
 *
 * 100%-wide × 56px SVG of 1–12 numeric points on a dashed baseline. The
 * last point renders larger than the others to emphasize the current
 * value. Optional `firstLabel` / `lastLabel` props render axis captions.
 *
 * `emptyVariant` switches the visual to an empty state:
 *   - 'zero': dashed baseline only, no dots (no scans yet)
 *   - 'one':  one filled dot on the left + one ghost dot on the right
 *             (single baseline scan; next slot reserved)
 *
 * Vertical axis auto-fits to the min/max of `values`. Sparklines are
 * trend-led, not absolute. A flat input maps to the chart's centerline.
 */
import React from 'react';
import { View, Text, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Circle } from 'react-native-svg';
import { colors, type, spacing } from '../design-tokens/tokens';

const HEIGHT = 56;
const POINT_R = 2.5;
const LAST_POINT_R = 4;
const GHOST_R = 3.5;
const PADDING_Y = 6;
const PADDING_X = 4;

export interface SparklineProps {
  /** Numeric values for the trend, 1–12 points. */
  values?: number[];
  /** Caption below the leftmost point, e.g. "4 weeks ago". */
  firstLabel?: string;
  /** Caption below the rightmost point, e.g. "Today". */
  lastLabel?: string;
  /**
   * Empty-state variant. `null` (default) renders the data line.
   * 'zero' shows only the dashed baseline; 'one' shows a single filled
   * dot and a ghost dot at the next slot.
   */
  emptyVariant?: null | 'zero' | 'one';
  /** Accessibility label. Defaults to a summary built from `values`. */
  accessibilityLabel?: string;
}

export function Sparkline({
  values,
  firstLabel,
  lastLabel,
  emptyVariant = null,
  accessibilityLabel,
}: SparklineProps) {
  const [width, setWidth] = React.useState(0);
  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const usableWidth = Math.max(0, width - PADDING_X * 2);
  const cy = HEIGHT / 2;

  const a11y =
    accessibilityLabel ??
    (emptyVariant === 'zero'
      ? 'No scans yet'
      : emptyVariant === 'one'
      ? 'One scan recorded so far'
      : `${values?.length ?? 0} scan trend`);

  return (
    <View accessibilityRole="image" accessibilityLabel={a11y}>
      <View onLayout={onLayout} style={{ height: HEIGHT }}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Line
              x1={PADDING_X}
              y1={cy}
              x2={width - PADDING_X}
              y2={cy}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="3 4"
            />
            {emptyVariant === null && values && values.length > 0
              ? renderTrend(values, usableWidth)
              : null}
            {emptyVariant === 'one' ? renderOneState(usableWidth) : null}
          </Svg>
        ) : null}
      </View>
      {firstLabel || lastLabel ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: spacing.s1,
          }}
        >
          <Text style={labelStyle}>{firstLabel ?? ''}</Text>
          <Text style={labelStyle}>{lastLabel ?? ''}</Text>
        </View>
      ) : null}
    </View>
  );
}

function renderTrend(values: number[], usableWidth: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const yMin = PADDING_Y;
  const yMax = HEIGHT - PADDING_Y;

  const xOf = (i: number) =>
    PADDING_X +
    (values.length === 1
      ? usableWidth / 2
      : (i * usableWidth) / (values.length - 1));
  const yOf = (v: number) =>
    span === 0 ? HEIGHT / 2 : yMax - ((v - min) / span) * (yMax - yMin);

  const polylinePoints = values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');

  return (
    <>
      {values.length > 1 ? (
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.brandPrimary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {values.map((v, i) => {
        const isLast = i === values.length - 1;
        return (
          <Circle
            key={i}
            cx={xOf(i)}
            cy={yOf(v)}
            r={isLast ? LAST_POINT_R : POINT_R}
            fill={colors.brandPrimary}
          />
        );
      })}
    </>
  );
}

function renderOneState(usableWidth: number) {
  const cy = HEIGHT / 2;
  const leftX = PADDING_X;
  const rightX = PADDING_X + usableWidth;
  return (
    <>
      <Circle cx={leftX} cy={cy} r={LAST_POINT_R} fill={colors.brandPrimary} />
      <Circle
        cx={rightX}
        cy={cy}
        r={GHOST_R}
        fill="none"
        stroke={colors.brandPrimary}
        strokeWidth={1.5}
        strokeDasharray="2 2"
      />
    </>
  );
}

const labelStyle = {
  fontSize: type.caption.fontSize,
  lineHeight: type.caption.lineHeight,
  fontWeight: type.caption.fontWeight,
  color: colors.textTertiary,
} as const;
