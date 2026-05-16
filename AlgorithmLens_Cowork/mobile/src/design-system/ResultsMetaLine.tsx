/**
 * ResultsMetaLine: scan metadata strip at the top of the Results
 * screen, above the verdict eyebrow. Renders three small brand-blue
 * progress segments (decorative, reading as a completed progress bar)
 * followed by uppercase micro-type text such as:
 *
 *   ANALYZED 5 MIN AGO · 49 POSTS · 1:26 SESSION
 *
 * The component accepts the data and renders unconditionally. The
 * "drops to null on dense outcomes" decision lives in the parent
 * (the Results screen) per the design spec — this component just
 * renders when asked.
 *
 * Reference: mobile/audits/2x-results-design/decisions.md
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, type } from '../design-tokens/tokens';

// Decorative progress segments. Three short brand-blue rectangles
// reading as a completed progress bar. Dimensions tuned to sit
// visually with micro-type line height.
const SEGMENT_COUNT = 3;
const SEGMENT_WIDTH = 8;
const SEGMENT_HEIGHT = 3;
const SEGMENT_GAP = 2;

export interface ResultsMetaLineProps {
  /** When the scan was analyzed. Used to compute the leading
   *  relative-time segment. Accepts a Date or an ISO string. */
  analyzedAt: Date | string;
  /** Number of posts captured in the scan. Pluralizes the label. */
  postCount: number;
  /** Session duration. Accepts seconds (number, formatted as M:SS)
   *  or a pre-formatted string passed through verbatim. */
  sessionDuration: string | number;
  testID?: string;
}

export function ResultsMetaLine({
  analyzedAt,
  postCount,
  sessionDuration,
  testID,
}: ResultsMetaLineProps) {
  const relative = formatRelativeTime(analyzedAt);
  const analyzedSegment = relative ? `Analyzed ${relative}` : 'Analyzed';
  const postsSegment = `${postCount} ${postCount === 1 ? 'post' : 'posts'}`;
  const durationStr =
    typeof sessionDuration === 'number'
      ? formatDuration(sessionDuration)
      : sessionDuration;
  const durationSegment = `${durationStr} session`;
  const text = `${analyzedSegment} · ${postsSegment} · ${durationSegment}`;

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s2,
      }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ flexDirection: 'row', gap: SEGMENT_GAP }}
      >
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <View
            key={i}
            style={{
              width: SEGMENT_WIDTH,
              height: SEGMENT_HEIGHT,
              backgroundColor: colors.brandPrimary,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          fontSize: type.micro.fontSize,
          lineHeight: type.micro.lineHeight,
          fontWeight: type.micro.fontWeight,
          letterSpacing: type.micro.letterSpacing,
          textTransform: 'uppercase',
          color: colors.textTertiary,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// ============================================
// Format helpers
// ============================================

/**
 * Format a Date or ISO string as a short relative phrase: "just now",
 * "5 min ago", "3h ago", "2d ago". Returns the empty string when the
 * input can't be parsed or is in the future. Sentence-case in source;
 * the component uppercases via textTransform.
 */
function formatRelativeTime(when: Date | string): string {
  const date = typeof when === 'string' ? new Date(when) : when;
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    return '';
  }
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return '';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/**
 * Format seconds as M:SS. Negative or non-finite input returns "0:00".
 */
function formatDuration(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const total = Math.floor(secs);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
