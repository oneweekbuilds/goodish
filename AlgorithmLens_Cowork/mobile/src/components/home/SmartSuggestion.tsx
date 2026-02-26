/**
 * SmartSuggestion — Contextual scan suggestion card.
 *
 * Shows gentle, helpful suggestions based on scanning patterns:
 * - Try scanning a different platform
 * - You haven't scanned in a while
 * - Try scanning at a different time of day
 *
 * Tone: Warm and inviting, never pushy or guilt-inducing.
 * Follows epistemic restraint — describes observable patterns,
 * never implies the user is doing something wrong.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Compass, Clock, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../lib/theme';
import type { ScanSuggestion } from '../../lib/achievements';

interface SmartSuggestionProps {
  suggestion: ScanSuggestion;
  /** Called when the user taps the suggestion CTA. */
  onAction?: () => void;
}

function SmartSuggestionComponent({ suggestion, onAction }: SmartSuggestionProps) {
  const { colors, shadows } = useTheme();

  const Icon = suggestion.type === 'time_check' ? Clock : Compass;
  const iconBgColor = suggestion.type === 'time_check'
    ? colors.gradientWarmStart
    : colors.blue50;
  const iconColor = suggestion.type === 'time_check'
    ? colors.warning
    : colors.primaryBlue;

  return (
    <TouchableOpacity
      onPress={onAction}
      activeOpacity={0.7}
      disabled={!onAction}
      accessibilityRole={onAction ? 'button' : 'text'}
      accessibilityLabel={`Suggestion: ${suggestion.message}`}
      hitSlop={onAction ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined}
    >
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: SPACING.md,
          ...shadows.card,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: iconBgColor,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: SPACING.xxs,
          }}
        >
          <Icon size={14} color={iconColor} strokeWidth={2} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...TYPOGRAPHY.overline,
              color: colors.textTertiary,
              marginBottom: SPACING.xs,
            }}
          >
            Suggestion
          </Text>
          <Text
            style={{
              ...TYPOGRAPHY.bodySmall,
              color: colors.textSecondary,
              lineHeight: TYPOGRAPHY.bodySmall.lineHeight,
            }}
          >
            {suggestion.message}
          </Text>
        </View>

        {/* Arrow indicator */}
        {onAction && (
          <View
            style={{
              justifyContent: 'center',
              alignSelf: 'center',
            }}
          >
            <ArrowRight size={14} color={colors.textTertiary} strokeWidth={2} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export const SmartSuggestion = React.memo(SmartSuggestionComponent);
