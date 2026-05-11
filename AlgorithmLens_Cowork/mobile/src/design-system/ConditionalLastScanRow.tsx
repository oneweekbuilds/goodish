/**
 * ConditionalLastScanRow: last-scan disclosure row for Home.
 *
 * Renders only when the most recent scan was 1+ days ago. Layout:
 * platform avatar, two-line label, chevron. At 14+ days the row's
 * background shifts to the caution token, mirroring GreetingHeader's
 * subtitle treatment for the same threshold.
 *
 *   null / today (0 days) returns null
 *   1 to 13 days          renders neutral background
 *   14+ days              renders caution-tinted background
 *
 * The platform avatar uses a neutral `bgSecondary` surface with a
 * two-letter abbreviation in `textPrimary`. Decorative platform colors
 * are not used here, since DESIGN.md forbids decorative color.
 *
 * Platform abbreviation and display-name lookups come from the shared
 * lib/platformLabels module (also used by Compare).
 */
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, type, spacing, radius, tap } from '../design-tokens/tokens';
import { platformAbbrev, platformName } from '../lib/platformLabels';

/**
 * The minimal shape the row needs. The app's `ScanDetail` / `ScanRecord`
 * types satisfy this structurally, so no need to import them here.
 */
export interface LastScanRecord {
  /** Platform identifier, e.g. "instagram". Case-insensitive. */
  platform: string;
  /** ISO timestamp of when the scan was created. */
  created_at: string;
}

export interface ConditionalLastScanRowProps {
  lastScan: LastScanRecord | null;
  /** Tap handler. Usually navigates to the dashboard. */
  onPress?: () => void;
  /** Override for "now". Defaults to `new Date()`. */
  now?: Date;
}

export function ConditionalLastScanRow({
  lastScan,
  onPress,
  now,
}: ConditionalLastScanRowProps) {
  if (!lastScan) return null;
  const current = now ?? new Date();
  const scanDate = new Date(lastScan.created_at);
  const days = daysBetween(scanDate, current);
  if (days === null || days <= 0) return null;

  const isCaution = days >= 14;
  const abbrev = platformAbbrev(lastScan.platform);
  const displayName = platformName(lastScan.platform);
  const relative = relativePhrase(days, scanDate);

  const inner = (
    <View
      style={{
        minHeight: tap.min + spacing.s3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s3,
        paddingVertical: spacing.s3,
        paddingHorizontal: spacing.s4,
        backgroundColor: isCaution ? colors.caution12 : colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.tap,
          backgroundColor: colors.bgSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: type.caption.fontSize,
            lineHeight: type.caption.lineHeight,
            fontWeight: '600',
            color: colors.textPrimary,
          }}
        >
          {abbrev}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: type.subheading.fontSize,
            lineHeight: type.subheading.lineHeight,
            fontWeight: type.subheading.fontWeight,
            color: colors.textPrimary,
          }}
          numberOfLines={1}
        >
          Last scan: {displayName}
        </Text>
        <Text
          style={{
            fontSize: type.caption.fontSize,
            lineHeight: type.caption.lineHeight,
            fontWeight: type.caption.fontWeight,
            color: colors.textSecondary,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {relative}
        </Text>
      </View>
      <Icon
        name="chevron-right"
        size={14}
        color={colors.textTertiary}
        strokeWidth={2.25}
      />
    </View>
  );

  if (!onPress) return inner;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Last scan: ${displayName}, ${relative}`}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {inner}
    </Pressable>
  );
}

/**
 * Calendar-day distance from `earlier` to `later`, in local time.
 * Returns `null` if either Date is invalid (NaN getTime), so callers can
 * route the malformed-input case to their existing no-data path. Defends
 * against a corrupt `created_at` string slipping past the route boundary.
 */
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

function relativePhrase(days: number, scanDate: Date): string {
  if (days === 1) return 'Yesterday';
  if (days < 7) return scanDate.toLocaleDateString(undefined, { weekday: 'long' });
  return `${days} days ago`;
}
