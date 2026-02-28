/**
 * ALRadarChart — Six-axis radar chart for at-a-glance dimension overview.
 *
 * Custom SVG implementation since react-native-gifted-charts doesn't include
 * a radar chart. Uses react-native-svg for clean vector rendering with
 * animated fill area, labeled axes, and theme-aware colors.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../lib/gluestackTheme';
import { Text, Skeleton, EmptyState } from '../glue';

// ─── Types ──────────────────────────────────────────────

export interface ALRadarChartAxis {
  label: string;
  value: number; // 0-100
  shortLabel?: string; // Shorter label for small screens
}

export interface ALRadarChartProps {
  /** Six axes of data */
  axes: ALRadarChartAxis[];
  /** Whether data is still loading */
  loading?: boolean;
  /** Message when data is empty */
  emptyMessage?: string;
  /** Fill color */
  fillColor?: string;
  /** Stroke color */
  strokeColor?: string;
  /** Chart size (diameter) */
  size?: number;
  /** Accessibility summary */
  accessibilitySummary?: string;
}

// ─── Helpers ────────────────────────────────────────────

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// ─── Component ──────────────────────────────────────────

function ALRadarChartComponent({
  axes,
  loading = false,
  emptyMessage = 'No dimension data available yet.',
  fillColor,
  strokeColor,
  size: propSize,
  accessibilitySummary,
}: ALRadarChartProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fill = fillColor ?? (colors.primary as string);
  const stroke = strokeColor ?? (colors.primary as string);
  const size = propSize ?? Math.min(screenWidth - 80, 260);
  const center = size / 2;
  const maxRadius = size / 2 - 30; // Leave room for labels
  const n = axes.length || 6;
  const angleStep = 360 / n;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // ─── Loading State ──────────────────────────────────
  if (loading) {
    return (
      <View style={{ alignItems: 'center' }}>
        <Skeleton width={size} height={size} borderRadius={size / 2} />
      </View>
    );
  }

  // ─── Empty State ────────────────────────────────────
  if (!axes || axes.length < 3) {
    return <EmptyState icon="radar" message={emptyMessage} />;
  }

  // ─── Grid Lines ─────────────────────────────────────
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridColor = colors.borderSubtle as string;

  // ─── Data Points ────────────────────────────────────
  const dataPoints = axes.map((axis, i) => {
    const r = (Math.min(Math.max(axis.value, 0), 100) / 100) * maxRadius;
    return polarToCartesian(center, center, r, i * angleStep);
  });
  const dataPolygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // ─── Axis Endpoints ─────────────────────────────────
  const axisEndpoints = axes.map((_, i) =>
    polarToCartesian(center, center, maxRadius, i * angleStep),
  );

  // ─── Label Positions ────────────────────────────────
  const labelPositions = axes.map((_, i) =>
    polarToCartesian(center, center, maxRadius + 18, i * angleStep),
  );

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilitySummary
          ? `Radar chart showing ${accessibilitySummary}`
          : `Radar chart with ${axes.length} dimensions`
      }
    >
      <Animated.View style={{ alignItems: 'center', opacity: fadeAnim }}>
        <Svg width={size} height={size}>
          {/* Grid polygons */}
          {gridLevels.map((level) => {
            const points = Array.from({ length: n }, (_, i) => {
              const p = polarToCartesian(center, center, maxRadius * level, i * angleStep);
              return `${p.x},${p.y}`;
            }).join(' ');
            return (
              <Polygon
                key={`grid-${level}`}
                points={points}
                fill="none"
                stroke={gridColor}
                strokeWidth={0.5}
                strokeDasharray="3,3"
              />
            );
          })}

          {/* Axis lines */}
          {axisEndpoints.map((ep, i) => (
            <Line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={ep.x}
              y2={ep.y}
              stroke={gridColor}
              strokeWidth={0.5}
            />
          ))}

          {/* Data polygon */}
          <Polygon
            points={dataPolygonPoints}
            fill={fill}
            fillOpacity={0.15}
            stroke={stroke}
            strokeWidth={2}
          />

          {/* Data points */}
          {dataPoints.map((p, i) => (
            <Circle
              key={`dp-${i}`}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={stroke}
            />
          ))}

          {/* Labels */}
          {labelPositions.map((p, i) => (
            <SvgText
              key={`label-${i}`}
              x={p.x}
              y={p.y}
              fontSize={10}
              fill={colors.textSecondary as string}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontFamily="Geist-Regular"
            >
              {axes[i]?.shortLabel ?? axes[i]?.label ?? ''}
            </SvgText>
          ))}
        </Svg>
      </Animated.View>

      {/* Values legend below chart */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: SPACING.md,
          marginTop: SPACING.md,
        }}
      >
        {axes.map((axis, index) => (
          <View
            key={`radar-legend-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.xs,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: stroke,
              }}
            />
            <Text
              style={{
                ...GL_TYPOGRAPHY.captionSmall,
                color: colors.textSecondary as string,
              }}
            >
              {axis.shortLabel ?? axis.label}: {Math.round(axis.value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const ALRadarChart = React.memo(ALRadarChartComponent);
