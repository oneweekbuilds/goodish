/**
 * ModeToggle — Toggle between Broadcast (primary) and Precision Mode (WebView).
 *
 * Broadcast is the recommended default. Precision mode is available for
 * users who want zero-cost, text-only analysis through the built-in browser.
 *
 * The toggle appears after a user taps a platform icon, as a contextual
 * sub-selection before the scan starts.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Radio, Type } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../lib/theme';
import type { ScanMode } from '../../types/broadcast';

interface ModeToggleProps {
  selectedMode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
}

function ModeToggleComponent({ selectedMode, onModeChange }: ModeToggleProps) {
  const { colors, shadows } = useTheme();

  const handleModePress = (mode: ScanMode) => {
    if (mode === selectedMode) return;
    Haptics.selectionAsync();
    onModeChange(mode);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
      }}
      accessibilityRole="radiogroup"
      accessible={true}
    >
      {/* Broadcast mode option */}
      <TouchableOpacity
        onPress={() => handleModePress('broadcast')}
        activeOpacity={0.7}
        accessibilityRole="radio"
        accessibilityState={{ selected: selectedMode === 'broadcast' }}
        accessibilityLabel="Broadcast mode — scroll your real app"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          flex: 1,
          backgroundColor: selectedMode === 'broadcast' ? colors.primaryBlue : colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: selectedMode === 'broadcast' ? colors.primaryBlue : colors.borderSoft,
          minHeight: 44,
          ...(selectedMode === 'broadcast' ? shadows.soft : {}),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
          <Radio
            size={14}
            color={selectedMode === 'broadcast' ? colors.textInverse : colors.textMuted}
            strokeWidth={2}
          />
          <Text
            style={{
              ...TYPOGRAPHY.labelBold,
              color: selectedMode === 'broadcast' ? colors.textInverse : colors.textMain,
            }}
          >
            Broadcast
          </Text>
        </View>
        <Text
          style={{
            ...TYPOGRAPHY.captionSmall,
            color: selectedMode === 'broadcast' ? colors.whiteOverlay85 : colors.textSecondary,
          }}
        >
          Scroll your real app
        </Text>
        {selectedMode !== 'broadcast' && (
          <View
            style={{
              marginTop: SPACING.sm,
              backgroundColor: colors.accentGreen,
              borderRadius: RADIUS.sm,
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xxs,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ ...TYPOGRAPHY.captionSmall, fontWeight: '700', color: colors.white }}>
              RECOMMENDED
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Precision mode option */}
      <TouchableOpacity
        onPress={() => handleModePress('precision')}
        activeOpacity={0.7}
        accessibilityRole="radio"
        accessibilityState={{ selected: selectedMode === 'precision' }}
        accessibilityLabel="Precision mode — text-only analysis in built-in browser"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          flex: 1,
          backgroundColor: selectedMode === 'precision' ? colors.primaryBlue : colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: selectedMode === 'precision' ? colors.primaryBlue : colors.borderSoft,
          minHeight: 44,
          ...(selectedMode === 'precision' ? shadows.soft : {}),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
          <Type
            size={14}
            color={selectedMode === 'precision' ? colors.textInverse : colors.textMuted}
            strokeWidth={2}
          />
          <Text
            style={{
              ...TYPOGRAPHY.labelBold,
              color: selectedMode === 'precision' ? colors.textInverse : colors.textMain,
            }}
          >
            Precision
          </Text>
        </View>
        <Text
          style={{
            ...TYPOGRAPHY.captionSmall,
            color: selectedMode === 'precision' ? colors.whiteOverlay85 : colors.textSecondary,
          }}
        >
          Text-only via browser
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export const ModeToggle = React.memo(ModeToggleComponent);
