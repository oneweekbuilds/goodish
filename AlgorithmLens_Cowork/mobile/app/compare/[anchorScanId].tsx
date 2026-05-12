/**
 * Compare picker. Reads `anchorScanId` from the route and offers up to
 * three smart-default comparison choices plus a disabled cross-platform
 * escape hatch.
 *
 * Selection lives in the URL (`selected` query param) so that
 * back-navigation from the result screen preserves the user's choice.
 * "Your last [platform] scan" is the default when available.
 *
 * Tapping the primary "Compare" button navigates to /compare/result
 * with the anchor scan ID and the selected source key. The actual
 * comparison data is re-resolved on the result screen from those two
 * params, keeping picker and result in lockstep.
 */
import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon, PickerRow } from '../../src/design-system';
import {
  colors,
  layout,
  radius,
  spacing,
  tap,
  type,
} from '../../src/design-tokens/tokens';
import { useDashboard, type ScanDetail } from '../../src/hooks/useDashboard';
import {
  platformAbbrev,
  platformName,
} from '../../src/lib/platformLabels';
import {
  computeAvailability,
  type ComparisonSource,
} from '../../src/lib/compareDerivation';
import { scoreOfScan } from '../../src/lib/scanScore';
import { daysBetween, relativeDayPhrase } from '../../src/lib/relativeDate';

export default function CompareScreen() {
  const params = useLocalSearchParams<{
    anchorScanId?: string;
    selected?: string;
  }>();
  const anchorScanId = params.anchorScanId ?? '';
  const selectedRaw = params.selected;
  const { scans, loading } = useDashboard();

  const anchor: ScanDetail | null = useMemo(
    () => scans.find((s) => s.id === anchorScanId) ?? null,
    [scans, anchorScanId],
  );

  const availability = useMemo(
    () => (anchor ? computeAvailability(scans, anchor) : null),
    [scans, anchor],
  );

  const anchorDisplayName = anchor ? platformName(anchor.platform) : '';
  const anchorRelative = anchor ? relativePhraseFor(anchor.created_at) : '';

  // Derive the active selection. URL param wins when valid; otherwise
  // fall back to the smart default (last-platform), then average, then
  // fourteen-days. Returns null only when no option is available.
  const selected = useMemo<ComparisonSource | null>(() => {
    const valid = new Set<ComparisonSource>();
    if (availability?.lastPlatform) valid.add('last-platform');
    if (availability?.average) valid.add('average');
    if (availability?.fourteenDays) valid.add('fourteen-days');
    if (
      selectedRaw &&
      (valid as Set<string>).has(selectedRaw)
    ) {
      return selectedRaw as ComparisonSource;
    }
    if (valid.has('last-platform')) return 'last-platform';
    if (valid.has('average')) return 'average';
    if (valid.has('fourteen-days')) return 'fourteen-days';
    return null;
  }, [availability, selectedRaw]);

  const handleSelect = useCallback(
    (key: ComparisonSource) => {
      router.setParams({ selected: key });
    },
    [],
  );

  const handleCompare = useCallback(() => {
    if (!selected || !anchor) return;
    router.push({
      pathname: '/compare/result',
      params: {
        anchorScanId,
        source: selected,
      },
    });
  }, [anchorScanId, selected, anchor]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <CompareHeader
        title="Compare with"
        onBack={handleBack}
        onCancel={handleBack}
      />
      {anchor ? (
        <AnchorSubtitleRow
          platformAbbrev={platformAbbrev(anchor.platform)}
          text={`${anchorDisplayName} · ${anchorRelative}`}
        />
      ) : null}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPaddingX,
          paddingTop: spacing.s4,
          paddingBottom: spacing.s4,
          gap: spacing.s2,
        }}
        showsVerticalScrollIndicator={false}
      >
        {anchor && availability?.lastPlatform ? (
          <PickerRow
            label={`Your last ${platformName(anchor.platform)} scan`}
            subtitle={subtitleForLastPlatform(availability.lastPlatform)}
            selected={selected === 'last-platform'}
            showDefaultPill
            onPress={() => handleSelect('last-platform')}
          />
        ) : null}
        {anchor && availability?.average ? (
          <PickerRow
            label="Your average"
            subtitle={`Last ${availability.average.count} ${platformName(anchor.platform)} scans · avg ${Math.round(availability.average.score)}`}
            selected={selected === 'average'}
            onPress={() => handleSelect('average')}
          />
        ) : null}
        {anchor && availability?.fourteenDays ? (
          <PickerRow
            label="14 days ago"
            subtitle={subtitleForFourteenDays(availability.fourteenDays)}
            selected={selected === 'fourteen-days'}
            onPress={() => handleSelect('fourteen-days')}
          />
        ) : null}

        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
            marginVertical: spacing.s3,
          }}
        />

        {/* TODO(compare-cross-platform): wire to flat scan list when cross-platform compare ships */}
        <PickerRow
          label="Pick another scan"
          subtitle="From any platform"
          disabled
        />
      </ScrollView>
      <View
        style={{
          paddingHorizontal: layout.screenPaddingX,
          paddingTop: spacing.s4,
          paddingBottom: spacing.s4,
        }}
      >
        <PrimaryButton
          label="Compare"
          disabled={!selected || loading}
          onPress={handleCompare}
        />
      </View>
    </SafeAreaView>
  );
}

function subtitleForLastPlatform(scan: ScanDetail): string {
  const score = scoreOfScan(scan);
  return `${relativePhraseFor(scan.created_at)} · score ${score}`;
}

function subtitleForFourteenDays(scan: ScanDetail): string {
  const score = scoreOfScan(scan);
  const d = new Date(scan.created_at);
  if (isNaN(d.getTime())) return `score ${score}`;
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  return `${weekday} · score ${score}`;
}

function relativePhraseFor(iso: string): string {
  return relativeDayPhrase(new Date(iso));
}

/* Inline helpers */

function CompareHeader({
  title,
  onBack,
  onCancel,
}: {
  title: string;
  onBack: () => void;
  onCancel: () => void;
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
          fontSize: type.subheading.fontSize,
          lineHeight: type.subheading.lineHeight,
          fontWeight: type.subheading.fontWeight,
          color: colors.textPrimary,
          textAlign: 'center',
        }}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        hitSlop={8}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.brandPrimary,
          }}
        >
          Cancel
        </Text>
      </Pressable>
    </View>
  );
}

function AnchorSubtitleRow({
  platformAbbrev: abbrev,
  text,
}: {
  platformAbbrev: string;
  text: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s2,
        paddingHorizontal: layout.screenPaddingX,
        paddingBottom: spacing.s3,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          backgroundColor: colors.bgSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 10,
            lineHeight: 14,
            fontWeight: '600',
            color: colors.textPrimary,
          }}
        >
          {abbrev}
        </Text>
      </View>
      <Text
        style={{
          fontSize: type.caption.fontSize,
          lineHeight: type.caption.lineHeight,
          fontWeight: type.caption.fontWeight,
          color: colors.textSecondary,
        }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: true }}
        style={{
          backgroundColor: colors.brandPrimary,
          opacity: 0.4,
          borderRadius: radius.button,
          paddingVertical: 14,
          alignItems: 'center',
          justifyContent: 'center',
        }}
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
      </View>
    );
  }
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
