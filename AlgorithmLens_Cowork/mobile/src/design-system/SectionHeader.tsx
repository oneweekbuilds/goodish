/**
 * SectionHeader — 3px brand-primary vertical bar + heading text.
 * Used to label distinct sections on the Overview screen
 * (e.g. "Explore your data", "Top influencers").
 *
 * Per SKILL.md spacing: 32px between distinct sections.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors, type, spacing } from '../design-tokens/tokens';

export interface SectionHeaderProps {
  children: React.ReactNode;
}

export function SectionHeader({ children }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s3 - 2, // 10
        paddingHorizontal: spacing.s1,
        marginBottom: spacing.s3 - 2, // 10
      }}
    >
      <View
        style={{
          width: 3,
          height: 18,
          backgroundColor: colors.brandPrimary,
          borderRadius: 2,
        }}
      />
      <Text
        style={{
          fontSize: type.subheading.fontSize,
          lineHeight: type.subheading.lineHeight,
          fontWeight: type.subheading.fontWeight,
          color: colors.textPrimary,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
