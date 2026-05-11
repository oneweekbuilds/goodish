/**
 * Compare result. Reads `anchorScanId` and `source` from the route and
 * renders the anchored comparison:
 *
 *   header back chevron + "Anchor platform · Anchor day vs Comparison label"
 *   hero score (anchor)
 *   delta vs comparison
 *   qualitative interpretation
 *   "What changed" eyebrow + 4-metric DiffRow table
 *   disabled "See full numbers" link
 *
 * `source` is one of 'last-platform' | 'average' | 'fourteen-days'. The
 * actual comparison record is re-derived here from the anchor + the
 * scan history, keeping the picker and result in lockstep without
 * passing data through URL params.
 */
import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Card,
  DiffRow,
  Icon,
  MicroSectionHeader,
} from '../../src/design-system';
import {
  colors,
  layout,
  spacing,
  tap,
  type,
} from '../../src/design-tokens/tokens';
import { useDashboard, type ScanDetail } from '../../src/hooks/useDashboard';
import {
  computeDashboardData,
  type DashboardData,
} from '../../src/lib/computeDashboardData';
import {
  computeAvailability,
  type AverageComparison,
  type ComparisonSource,
} from '../../src/lib/compareDerivation';
import { labelForScore, scoreOfScan } from '../../src/lib/scanScore';
import { platformName } from '../../src/lib/platformLabels';

interface ComparisonValues {
  sourceDiversity: number;
  adPct: number;
  suggestedPct: number;
  politicalPct: number | null;
  score: number;
}

export default function CompareResultScreen() {
  const params = useLocalSearchParams<{
    anchorScanId?: string;
    source?: string;
  }>();
  const anchorScanId = params.anchorScanId ?? '';
  const source = (params.source as ComparisonSource | undefined) ?? null;
  const { scans } = useDashboard();

  const anchor: ScanDetail | null = useMemo(
    () => scans.find((s) => s.id === anchorScanId) ?? null,
    [scans, anchorScanId],
  );

  const availability = useMemo(
    () => (anchor ? computeAvailability(scans, anchor) : null),
    [scans, anchor],
  );

  const comparisonScan: ScanDetail | null = useMemo(() => {
    if (!availability || !source) return null;
    if (source === 'last-platform') return availability.lastPlatform;
    if (source === 'fourteen-days') return availability.fourteenDays;
    return null;
  }, [availability, source]);

  const comparisonAverage: AverageComparison | null =
    source === 'average' && availability ? availability.average : null;

  const anchorValues: ComparisonValues | null = useMemo(
    () => (anchor ? valuesFromScan(anchor) : null),
    [anchor],
  );
  const comparisonValues: ComparisonValues | null = useMemo(() => {
    if (comparisonScan) return valuesFromScan(comparisonScan);
    if (comparisonAverage) return valuesFromAverage(comparisonAverage);
    return null;
  }, [comparisonScan, comparisonAverage]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (!anchor || !anchorValues || !comparisonValues || !source) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      >
        <CompareHeader title="" onBack={handleBack} />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: layout.screenPaddingX,
          }}
        >
          <Text
            style={{
              fontSize: type.body.fontSize,
              lineHeight: type.body.lineHeight,
              fontWeight: type.body.fontWeight,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Comparison not available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const anchorDisplayName = platformName(anchor.platform);
  const anchorRelative = relativePhraseFor(anchor.created_at);
  const comparisonLabel = comparisonLabelFor(
    source,
    comparisonScan,
    comparisonAverage,
  );
  const deltaVsLabel = deltaVsLabelFor(
    source,
    comparisonScan,
  );

  const headerSubtitle = `${anchorDisplayName} · ${anchorRelative} vs ${comparisonLabel}`;
  const deltaScore = Math.round(anchorValues.score - comparisonValues.score);
  const deltaLabel = `${deltaScore > 0 ? '+' : ''}${deltaScore} vs. ${deltaVsLabel}`;
  const deltaColor =
    deltaScore > 0 ? colors.brandAccent : colors.textSecondary;
  const interpretation = interpretationFor(
    anchorValues.score,
    comparisonValues.score,
  );

  const metrics = buildMetricRows(anchorValues, comparisonValues);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <CompareHeader title={headerSubtitle} onBack={handleBack} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPaddingX,
          paddingTop: spacing.s4,
          paddingBottom: spacing.s10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontSize: type.hero.fontSize,
            lineHeight: type.hero.lineHeight,
            fontWeight: type.hero.fontWeight,
            letterSpacing: type.hero.letterSpacing,
            color: colors.brandPrimary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {Math.round(anchorValues.score)}
        </Text>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.bodyStrong.fontWeight,
            color: deltaColor,
            fontVariant: ['tabular-nums'],
            marginTop: spacing.s1,
          }}
        >
          {deltaLabel}
        </Text>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
            marginTop: spacing.s2,
          }}
        >
          {interpretation}
        </Text>

        <View style={{ marginTop: spacing.s7 }}>
          <MicroSectionHeader title="What changed" />
          <Card padding={0}>
            {metrics.map((m, idx) => (
              <React.Fragment key={m.metric}>
                <DiffRow
                  metric={m.metric}
                  valueA={m.valueA}
                  valueB={m.valueB}
                  deltaLabel={m.deltaLabel}
                  deltaTone={m.deltaTone}
                  deltaArrow={m.deltaArrow}
                />
                {idx < metrics.length - 1 ? <Hairline /> : null}
              </React.Fragment>
            ))}
          </Card>
        </View>

        <View
          style={{ marginTop: spacing.s6, alignItems: 'flex-start' }}
        >
          {/* TODO(compare-full-numbers): wire to detailed metrics view when that sub-page ships */}
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel="See full numbers"
            accessibilityState={{ disabled: true }}
            style={{ paddingVertical: spacing.s2 }}
          >
            <Text
              style={{
                fontSize: type.body.fontSize,
                lineHeight: type.body.lineHeight,
                fontWeight: type.bodyStrong.fontWeight,
                color: colors.textSecondary,
              }}
            >
              See full numbers
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MetricRow {
  metric: string;
  valueA: string;
  valueB: string;
  deltaLabel: string;
  deltaTone: 'positive' | 'neutral';
  deltaArrow: 'up' | 'down' | 'flat' | 'none';
}

function buildMetricRows(
  a: ComparisonValues,
  b: ComparisonValues,
): MetricRow[] {
  const rows: MetricRow[] = [];

  rows.push(
    metricRow(
      'Source diversity',
      a.sourceDiversity,
      b.sourceDiversity,
      '',
      'up',
    ),
  );
  rows.push(
    metricRow(
      'Suggested vs followed',
      a.suggestedPct,
      b.suggestedPct,
      '%',
      'down',
    ),
  );
  rows.push(
    metricRow('Ad density', a.adPct, b.adPct, '%', 'down'),
  );

  // Political content. Em-dash glyphs are intentional placeholders for
  // missing data (DESIGN.md carve-out: typographic placeholders are not
  // the prose em-dash). Do not "fix" the literal '—' below.
  if (a.politicalPct === null || b.politicalPct === null) {
    rows.push({
      metric: 'Political content',
      valueA: a.politicalPct === null ? '—' : `${Math.round(a.politicalPct)}%`,
      valueB: b.politicalPct === null ? '—' : `${Math.round(b.politicalPct)}%`,
      deltaLabel: '—',
      deltaTone: 'neutral',
      deltaArrow: 'none',
    });
  } else {
    rows.push(
      metricRow(
        'Political content',
        a.politicalPct,
        b.politicalPct,
        '%',
        'none',
      ),
    );
  }

  return rows;
}

function metricRow(
  metric: string,
  a: number,
  b: number,
  unit: '%' | ' pts' | '',
  improvement: 'up' | 'down' | 'none',
): MetricRow {
  const delta = a - b;
  const threshold = 0.5;
  const arrow: 'up' | 'down' | 'flat' =
    delta > threshold ? 'up' : delta < -threshold ? 'down' : 'flat';
  const tone: 'positive' | 'neutral' =
    (improvement === 'up' && arrow === 'up') ||
    (improvement === 'down' && arrow === 'down')
      ? 'positive'
      : 'neutral';
  const rounded = Math.round(delta);
  const deltaLabel = `${rounded > 0 ? '+' : ''}${rounded}${unit}`;
  return {
    metric,
    valueA: `${Math.round(a)}${unit}`,
    valueB: `${Math.round(b)}${unit}`,
    deltaLabel,
    deltaTone: tone,
    deltaArrow: arrow,
  };
}

function valuesFromScan(scan: ScanDetail): ComparisonValues {
  const data: DashboardData = computeDashboardData(scan);
  return {
    sourceDiversity: 100 - data.top5Pct,
    adPct: data.adPct,
    suggestedPct: data.suggestedPct,
    politicalPct: data.politicalAnalysis?.politicalPct ?? null,
    score: scoreOfScan(scan),
  };
}

function valuesFromAverage(avg: AverageComparison): ComparisonValues {
  return {
    sourceDiversity: avg.sourceDiversity,
    adPct: avg.adPct,
    suggestedPct: avg.suggestedPct,
    politicalPct: avg.politicalPct,
    score: avg.score,
  };
}

function comparisonLabelFor(
  source: ComparisonSource,
  scan: ScanDetail | null,
  avg: AverageComparison | null,
): string {
  if (source === 'average') return 'your average';
  if (source === 'fourteen-days') return '14 days ago';
  if (!scan) return '';
  const d = new Date(scan.created_at);
  if (isNaN(d.getTime())) return '';
  const days = daysBetween(d, new Date());
  if (days === null) return '';
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) {
    return d
      .toLocaleDateString(undefined, { weekday: 'long' })
      .toLowerCase();
  }
  return `${days} days ago`;
}

function deltaVsLabelFor(
  source: ComparisonSource,
  scan: ScanDetail | null,
): string {
  if (source === 'average') return 'your average';
  if (source === 'fourteen-days') return '14 days ago';
  if (!scan) return '';
  const d = new Date(scan.created_at);
  if (isNaN(d.getTime())) return '';
  const days = daysBetween(d, new Date());
  if (days === null) return '';
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) {
    return `last ${d
      .toLocaleDateString(undefined, { weekday: 'long' })
      .toLowerCase()}`;
  }
  return `${days} days ago`;
}

function interpretationFor(scoreA: number, scoreB: number): string {
  const sA = Math.round(scoreA);
  const sB = Math.round(scoreB);
  if (sA >= 70 && sB >= 70) return 'Both balanced.';
  if (sA < 50 && sB < 50) return 'Both worth watching.';
  return `${labelForScore(sA)}, was ${labelForScore(sB).toLowerCase()}.`;
}

function relativePhraseFor(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const days = daysBetween(d, new Date());
  if (days === null) return '';
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return `${days} days ago`;
}

function daysBetween(earlier: Date, later: Date): number | null {
  if (isNaN(earlier.getTime()) || isNaN(later.getTime())) return null;
  const a = new Date(
    earlier.getFullYear(),
    earlier.getMonth(),
    earlier.getDate(),
  ).getTime();
  const b = new Date(
    later.getFullYear(),
    later.getMonth(),
    later.getDate(),
  ).getTime();
  return Math.round((b - a) / 86400000);
}

/* Inline helpers */

function CompareHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.screenPaddingX,
        paddingVertical: spacing.s3,
        gap: spacing.s3,
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
          width: tap.min,
          height: tap.min,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: -spacing.s3,
        })}
      >
        <Icon name="chevron-left" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text
        style={{
          flex: 1,
          fontSize: type.caption.fontSize,
          lineHeight: type.caption.lineHeight,
          fontWeight: type.caption.fontWeight,
          color: colors.textSecondary,
        }}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
    </View>
  );
}

function Hairline() {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginLeft: spacing.s4,
      }}
    />
  );
}
