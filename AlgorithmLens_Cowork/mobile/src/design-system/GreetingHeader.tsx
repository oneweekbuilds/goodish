/**
 * GreetingHeader: time-of-day greeting + freshness subtitle.
 *
 * Renders "Good morning / afternoon / evening" at display weight, with a
 * contextual subtitle that depends on when the user last scanned:
 *
 *   null              → "Welcome. Run your first scan to see what's in your feed."
 *   today (0 days)    → no subtitle
 *   1 day             → "Your last scan was yesterday. Feeds shift, scan for a fresh read."
 *   2–6 days          → "Your last scan was <weekday>. Feeds shift, scan for a fresh read."
 *   7–13 days         → "Your last scan was N days ago. Feeds shift, scan for a fresh read."
 *   14+ days          → same copy as 7–13, wrapped in a caution-tinted pill
 *
 * `now` is exposed for tests; defaults to `new Date()` at render time.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors, type, spacing, radius } from '../design-tokens/tokens';

export interface GreetingHeaderProps {
  /** When the user's most recent scan occurred. `null` if no scans yet. */
  lastScanDate: Date | null;
  /** Optional override for "now". Defaults to `new Date()`. */
  now?: Date;
}

export function GreetingHeader({ lastScanDate, now }: GreetingHeaderProps) {
  const current = now ?? new Date();
  const greeting = greetingFor(current);
  const subtitle = subtitleFor(lastScanDate, current);

  return (
    <View>
      <Text
        style={{
          fontSize: type.display.fontSize,
          lineHeight: type.display.lineHeight,
          fontWeight: type.display.fontWeight,
          letterSpacing: type.display.letterSpacing,
          color: colors.textPrimary,
        }}
      >
        {greeting}
      </Text>
      {subtitle ? (
        <View style={{ marginTop: spacing.s1 }}>
          {subtitle.caution ? (
            <View
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.s2,
                paddingVertical: spacing.s2,
                paddingHorizontal: spacing.s3,
                backgroundColor: colors.caution12,
                borderRadius: radius.pill,
              }}
            >
              <Icon
                name="alert-triangle"
                size={12}
                color={colors.textPrimary}
                strokeWidth={2}
              />
              <Text style={subtitleTextStyle}>{subtitle.text}</Text>
            </View>
          ) : (
            <Text style={subtitleTextStyle}>{subtitle.text}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const subtitleTextStyle = {
  fontSize: type.body.fontSize,
  lineHeight: type.body.lineHeight,
  fontWeight: type.body.fontWeight,
  color: colors.textSecondary,
} as const;

function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  return 'Good evening';
}

function subtitleFor(
  lastScanDate: Date | null,
  now: Date,
): { text: string; caution: boolean } | null {
  if (!lastScanDate) {
    return {
      text: "Welcome. Run your first scan to see what's in your feed.",
      caution: false,
    };
  }
  const days = daysBetween(lastScanDate, now);
  if (days === null || days <= 0) return null;
  const dayPhrase =
    days === 1
      ? 'yesterday'
      : days < 7
      ? lastScanDate.toLocaleDateString(undefined, { weekday: 'long' })
      : `${days} days ago`;
  return {
    text: `Your last scan was ${dayPhrase}. Feeds shift, scan for a fresh read.`,
    caution: days >= 14,
  };
}

/**
 * Calendar-day distance from `earlier` to `later`, in local time.
 * Returns `null` if either Date is invalid (NaN getTime), so callers can
 * route the malformed-input case to their existing no-data path rather
 * than producing "NaN days ago" copy.
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
