/**
 * InfluencerRow — handle on the left (subheading, near-black, may wrap),
 * "N posts · M ads" metadata on the right (caption, gray, tabular-nums).
 *
 * Per spec, no avatars: "User-influencer rows show the @handle as text,
 * not avatars."
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors, type, spacing } from '../design-tokens/tokens';

export interface InfluencerRowProps {
  handle: string;
  posts: number;
  ads: number;
  /** Suppress the bottom hairline when this is the last row in a stack. */
  last?: boolean;
}

export function InfluencerRow({ handle, posts, ads, last }: InfluencerRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.s3,
        paddingVertical: spacing.s4 - 2, // 14
        paddingHorizontal: spacing.s4,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: type.subheading.fontSize,
          lineHeight: type.subheading.lineHeight,
          fontWeight: type.subheading.fontWeight,
          color: colors.textPrimary,
        }}
      >
        {handle}
      </Text>
      <Text
        style={{
          fontSize: type.caption.fontSize,
          lineHeight: type.caption.lineHeight,
          fontWeight: type.caption.fontWeight,
          color: colors.textSecondary,
          fontVariant: ['tabular-nums'],
        }}
      >
        {posts} {posts === 1 ? 'post' : 'posts'} · {ads} {ads === 1 ? 'ad' : 'ads'}
      </Text>
    </View>
  );
}
