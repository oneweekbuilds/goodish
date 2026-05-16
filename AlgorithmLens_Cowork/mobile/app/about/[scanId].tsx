/**
 * About this analysis. Static informational route describing the
 * methodology behind a specific scan.
 *
 * Layout:
 *   ScanHeader (title "About this analysis", subtitle "Platform · relative day")
 *   Methodology eyebrow + 4-row stats table (Card padding=0)
 *   Paragraph 1: how the Feed Score is computed and what it compares against
 *   Paragraph 2: why small changes are not meaningful and where Compare fits
 *
 * The stats table's first row label adapts to scan source type:
 * "Frames captured" for broadcast scans (raw_data.broadcast_capture),
 * "Posts captured" for Precision Mode scans (no frame capture). The
 * `derivedSourceType` logic is currently inlined in History as well;
 * a future commit will extract it once a third consumer arrives.
 *
 * Em-dash glyphs ("—") in the stats table values are intentional
 * typographic placeholders when a data point is missing, per the
 * DESIGN.md carve-out (the rule covers prose copy, not single-glyph
 * placeholders).
 */
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Card,
  MicroSectionHeader,
  ScanHeader,
  SettingsRow,
} from '../../src/design-system';
import {
  colors,
  layout,
  spacing,
  type,
} from '../../src/design-tokens/tokens';
import { useDashboard } from '../../src/hooks/useDashboard';
import { platformName } from '../../src/lib/platformLabels';
import { relativeDayPhrase } from '../../src/lib/relativeDate';

const GEMINI_MODEL_LABEL = 'Google Gemini 2.5 Flash';

export default function AboutScreen() {
  const params = useLocalSearchParams<{ scanId?: string }>();
  const scanId = params.scanId ?? '';
  const { scans } = useDashboard();

  const scan = useMemo(
    () => scans.find((s) => s.id === scanId) ?? null,
    [scans, scanId],
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (!scan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <ScanHeader
          title="About this analysis"
          onBack={handleBack}
        />
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
            Scan not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const platformLabel = platformName(scan.platform) || scan.platform;
  const scanDate = new Date(scan.created_at);
  const relative = relativeDayPhrase(scanDate);
  const subtitle = relative
    ? `${platformLabel} · ${relative}`
    : platformLabel;

  // Source-type derivation. Mirrors the inline pattern in History; not
  // extracted to a shared lib until a third consumer exists.
  const rawData = (scan.raw_data as Record<string, unknown> | undefined) ?? {};
  const broadcastCapture = rawData.broadcast_capture as
    | Record<string, unknown>
    | undefined;
  const derivedSourceType =
    (rawData.source_type as string | undefined) ||
    (broadcastCapture ? 'MOBILE_BROADCAST' : 'MOBILE_APP');
  const isBroadcast = derivedSourceType === 'MOBILE_BROADCAST';

  const framesLabel = isBroadcast ? 'Frames captured' : 'Posts captured';
  const framesValue = isBroadcast
    ? formatNumber(broadcastCapture?.frames_captured as number | undefined)
    : formatNumber(scan.post_count);

  const durationSecs = isBroadcast
    ? (broadcastCapture?.duration_seconds as number | undefined)
    : (rawData.duration_seconds as number | undefined);
  const durationValue = formatDuration(durationSecs);

  const itemsValue = formatNumber(scan.post_count);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScanHeader
        title="About this analysis"
        subtitle={subtitle}
        onBack={handleBack}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPaddingX,
          paddingTop: spacing.s4,
          paddingBottom: spacing.s10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <MicroSectionHeader title="Methodology" />
        <Card padding={0}>
          <SettingsRow
            label={framesLabel}
            value={framesValue}
            showChevron={false}
          />
          <Hairline />
          <SettingsRow
            label="Capture duration"
            value={durationValue}
            showChevron={false}
          />
          <Hairline />
          <SettingsRow
            label="Items analyzed"
            value={itemsValue}
            showChevron={false}
          />
          <Hairline />
          <SettingsRow
            label="Model"
            value={GEMINI_MODEL_LABEL}
            showChevron={false}
          />
        </Card>

        <Text style={[paragraphStyle, { marginTop: spacing.s6 }]}>
          The Feed Score is a number from 0 to 100. It compares each scan
          against your own running average on the same platform, weighted
          by ad density, suggested versus followed ratio, and sample size.
          It is your number, not a universal grade.
        </Text>

        <Text style={[paragraphStyle, { marginTop: spacing.s4 }]}>
          Feed composition varies scan to scan. Changes under three points
          are inside normal variation. To see whether a shift is real or
          random, open Compare from History.
        </Text>
      </ScrollView>
    </SafeAreaView>
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

function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return '—';
  return n.toString();
}

function formatDuration(secs: number | undefined | null): string {
  if (!secs || secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const paragraphStyle = {
  fontSize: type.body.fontSize,
  lineHeight: type.body.lineHeight,
  fontWeight: type.body.fontWeight,
  color: colors.textSecondary,
} as const;
