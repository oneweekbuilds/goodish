/**
 * Home tab. Four-element vertical composition per the locked redesign:
 *   1. GreetingHeader (greeting + freshness subtitle)
 *   2. Feed Score hero card (trend-led; switches on scan count: 0 / 1 / 2+).
 *      Static-informational in every state; the card never owns a CTA.
 *   3. Primary scan button (renders in every non-loading state, with the
 *      label adapting to scan count: "Run your first scan" / "Scan again"
 *      / "Scan your feed"). One CTA per screen, owned by this element.
 *   4. ConditionalLastScanRow (hidden when the last scan is today or absent)
 *
 * Data comes from useDashboard. The legacy useStreak and useHabitFeatures
 * hooks fed only the cut components and are no longer wired in here.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Card,
  ConditionalLastScanRow,
  GreetingHeader,
  Sparkline,
} from '../../src/design-system';
import {
  colors,
  type,
  spacing,
  radius,
  layout,
} from '../../src/design-tokens/tokens';
import { useDashboard } from '../../src/hooks/useDashboard';
import { labelForScore, scoreOfScan } from '../../src/lib/scanScore';
import { ContentFadeIn } from '../../src/components/glue';

type FeedState =
  | { kind: 'loading' }
  | { kind: 'zero' }
  | { kind: 'one'; score: number }
  | {
      kind: 'multi';
      score: number;
      label: string;
      delta: number;
      sparklineValues: number[];
      trendLine: string;
    };

export default function HomeScreen() {
  const { scans, latestScan, loading, refresh } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const feedState = useMemo<FeedState>(() => {
    if (loading && scans.length === 0) return { kind: 'loading' };
    if (scans.length === 0) return { kind: 'zero' };
    if (scans.length === 1) {
      const onlyScan = scans[0];
      return { kind: 'one', score: onlyScan ? scoreOfScan(onlyScan) : 0 };
    }
    const window = [...scans.slice(0, 6)].reverse();
    const sparklineValues = window.map(scoreOfScan);
    const score = sparklineValues[sparklineValues.length - 1] ?? 0;
    const priorScores = sparklineValues.slice(0, -1);
    const average =
      priorScores.reduce((sum, v) => sum + v, 0) /
      Math.max(priorScores.length, 1);
    const delta = Math.round(score - average);
    return {
      kind: 'multi',
      score,
      label: labelForScore(score),
      delta,
      sparklineValues,
      trendLine: trendLineFor(delta),
    };
  }, [scans, loading]);

  const lastScanDate = latestScan ? new Date(latestScan.created_at) : null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleDashboardPress = useCallback(() => {
    router.push({ pathname: '/(tabs)/dashboard' });
  }, []);

  const handleOpenScanPicker = useCallback(() => {
    router.push('/scan');
  }, []);

  const buttonLabel = scanButtonLabel(feedState);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ContentFadeIn
        ready={!loading || scans.length > 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.screenPaddingX,
            paddingTop: layout.screenPaddingY,
            paddingBottom: spacing.s10,
            gap: spacing.s7,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brandPrimary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <GreetingHeader lastScanDate={lastScanDate} />
          <FeedScoreHeroCard state={feedState} />
          {buttonLabel ? (
            <PrimaryScanButton label={buttonLabel} onPress={handleOpenScanPicker} />
          ) : null}
          <ConditionalLastScanRow
            lastScan={latestScan}
            onPress={handleDashboardPress}
          />
        </ScrollView>
      </ContentFadeIn>
    </SafeAreaView>
  );
}

/* Feed Score hero card. Static-informational. Never owns a CTA. */

function FeedScoreHeroCard({ state }: { state: FeedState }) {
  if (state.kind === 'loading') {
    return null;
  }
  if (state.kind === 'zero') {
    return (
      <Card
        padding={0}
        style={{
          paddingTop: spacing.s5 + spacing.s2,
          paddingHorizontal: spacing.s5,
          paddingBottom: spacing.s5,
        }}
      >
        <HeroPlaceholderGlyph />
        <Text style={labelTextStyle}>No scans yet</Text>
        <Text style={bodyTextStyle}>
          Your score appears after your first scan. It compares each new scan
          against your own running average, not a universal grade.
        </Text>
        <Text style={[bodyTextStyle, { marginTop: spacing.s3 }]}>
          About 60 seconds of scrolling is enough.
        </Text>
      </Card>
    );
  }
  if (state.kind === 'one') {
    return (
      <Card
        padding={0}
        style={{
          paddingTop: spacing.s5 + spacing.s2,
          paddingHorizontal: spacing.s5,
          paddingBottom: spacing.s5,
        }}
      >
        <HeroNumber value={state.score} />
        <Text style={labelTextStyle}>Baseline</Text>
        <View style={{ marginTop: spacing.s4 }}>
          <Sparkline
            emptyVariant="one"
            firstLabel="Today"
            lastLabel="Next scan"
          />
        </View>
        <Text style={[bodyTextStyle, { marginTop: spacing.s4 }]}>
          One scan is a snapshot, not a trend. The second tells you whether
          what you saw is stable or shifting.
        </Text>
      </Card>
    );
  }
  return (
    <Card
      padding={0}
      style={{
        paddingTop: spacing.s5 + spacing.s2,
        paddingHorizontal: spacing.s5,
        paddingBottom: spacing.s5,
      }}
    >
      <HeroNumber value={state.score} />
      <Text style={labelTextStyle}>{state.label}</Text>
      <Text style={deltaTextStyle(state.delta)}>
        {formatDelta(state.delta)}
      </Text>
      <View style={{ marginTop: spacing.s4 }}>
        <Sparkline
          values={state.sparklineValues}
          firstLabel="4 weeks ago"
          lastLabel="Today"
        />
      </View>
      <Text style={[bodyTextStyle, { marginTop: spacing.s4 }]}>
        {state.trendLine}
      </Text>
    </Card>
  );
}

function HeroNumber({ value }: { value: number }) {
  return (
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
      {value}
    </Text>
  );
}

/**
 * Em-dash glyph rendered at hero size as a typographic placeholder for the
 * absent score. Reads as "your score will appear here," not as a loading
 * skeleton. The no-em-dashes rule in DESIGN.md applies to copy, not to
 * single-glyph typographic placeholders.
 */
function HeroPlaceholderGlyph() {
  return (
    <Text
      allowFontScaling={false}
      accessibilityLabel="No score yet"
      style={{
        fontSize: type.hero.fontSize,
        lineHeight: type.hero.lineHeight,
        fontWeight: type.hero.fontWeight,
        letterSpacing: type.hero.letterSpacing,
        color: colors.brandPrimary,
        fontVariant: ['tabular-nums'],
      }}
    >
      {'—'}
    </Text>
  );
}

/* Primary scan button */

function PrimaryScanButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        backgroundColor: colors.brandPrimary,
        opacity: pressed ? 0.9 : 1,
        borderRadius: radius.button,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text
        style={{
          fontSize: type.subheading.fontSize,
          lineHeight: type.subheading.lineHeight,
          fontWeight: type.subheading.fontWeight,
          color: colors.textOnBrand,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* Helpers */

function scanButtonLabel(state: FeedState): string | null {
  switch (state.kind) {
    case 'loading':
      return null;
    case 'zero':
      return 'Run your first scan';
    case 'one':
      return 'Scan again';
    case 'multi':
      return 'Scan your feed';
  }
}

function trendLineFor(delta: number): string {
  if (delta > 5) return 'Your latest scan is above your running average.';
  if (delta < -5) return 'Your latest scan is below your running average.';
  return 'Your latest scan is near your running average.';
}

function formatDelta(delta: number): string {
  if (delta === 0) return 'Even with your average';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta} vs. your average`;
}

const labelTextStyle = {
  fontSize: type.subheading.fontSize,
  lineHeight: type.subheading.lineHeight,
  fontWeight: type.subheading.fontWeight,
  color: colors.textPrimary,
  marginTop: spacing.s3,
} as const;

const bodyTextStyle = {
  fontSize: type.body.fontSize,
  lineHeight: type.body.lineHeight,
  fontWeight: type.body.fontWeight,
  color: colors.textSecondary,
  marginTop: spacing.s3,
} as const;

function deltaTextStyle(delta: number): TextStyle {
  return {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: type.bodyStrong.fontWeight,
    color: delta > 0 ? colors.brandAccent : colors.textSecondary,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.s1,
  };
}
