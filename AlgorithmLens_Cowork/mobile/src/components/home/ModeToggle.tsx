/**
 * ModeToggle — Toggle between Broadcast (primary) and Precision Mode (WebView).
 *
 * Broadcast is the recommended default. Precision mode is available for
 * users who want zero-cost, text-only analysis through the built-in browser.
 *
 * The toggle appears after a user taps a platform icon, as a contextual
 * sub-selection before the scan starts.
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Radio, Type, Check } from 'lucide-react-native';
import { triggerSelection } from '../../lib/haptics';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, MIN_TOUCH_TARGET } from '../../lib/theme';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { Text } from '../glue';
import { isBroadcastModuleAvailable } from '../../lib/broadcastSessionManager';
import type { ScanMode } from '../../types/broadcast';

interface ModeToggleProps {
  selectedMode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
}

function ModeToggleComponent({ selectedMode, onModeChange }: ModeToggleProps) {
  const { colors, shadows } = useTheme();

  // Runtime check: can the native broadcast module actually load?
  // Returns true in dev builds / production builds with native modules.
  // Returns false in Expo Go (native modules not compiled in).
  const broadcastAvailable = useMemo(() => isBroadcastModuleAvailable(), []);

  const handleModePress = (mode: ScanMode) => {
    if (mode === selectedMode) return;
    // Build #37: gate Alert removed. Mode change is unconditional now —
    // selecting Screen Capture on a build where the native module did not
    // register will surface as a fail-state in the broadcast diagnostics
    // (DebugCheckpointTrail row 4) once the user enters the broadcast flow,
    // which is what we want for diagnosing TestFlight launches. The
    // "COMING SOON" badge under Screen Capture is preserved as a soft hint.
    triggerSelection();
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
        accessibilityLabel="Screen Capture mode — record your real feed as you scroll"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          flex: 1,
          backgroundColor: selectedMode === 'broadcast' ? colors.primaryBlue : colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: selectedMode === 'broadcast' ? colors.primaryBlue : colors.borderSoft,
          minHeight: MIN_TOUCH_TARGET,
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
              ...GL_TYPOGRAPHY.labelBold,
              color: selectedMode === 'broadcast' ? colors.textInverse : colors.textMain,
              flex: 1,
            }}
          >
            Screen Capture
          </Text>
          {/* M-12 FIX: Checkmark on selected mode card */}
          {selectedMode === 'broadcast' && (
            <Check size={16} color={colors.textInverse} strokeWidth={2.5} />
          )}
        </View>
        <Text
          style={{
            ...GL_TYPOGRAPHY.captionSmall,
            color: selectedMode === 'broadcast' ? colors.whiteOverlay85 : colors.textSecondary,
          }}
        >
          Record your real feed as you scroll
        </Text>
        {selectedMode !== 'broadcast' && (
          <View
            style={{
              marginTop: SPACING.sm,
              backgroundColor: broadcastAvailable ? colors.accentGreen : colors.textTertiary,
              borderRadius: RADIUS.sm,
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xxs,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ ...GL_TYPOGRAPHY.captionSmall, fontWeight: '700', color: colors.white }}>
              {broadcastAvailable ? 'RECOMMENDED' : 'COMING SOON'}
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
        accessibilityLabel="Quick Scan mode — analyze content via built-in browser"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          flex: 1,
          backgroundColor: selectedMode === 'precision' ? colors.primaryBlue : colors.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: selectedMode === 'precision' ? colors.primaryBlue : colors.borderSoft,
          minHeight: MIN_TOUCH_TARGET,
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
              ...GL_TYPOGRAPHY.labelBold,
              color: selectedMode === 'precision' ? colors.textInverse : colors.textMain,
              flex: 1,
            }}
          >
            Quick Scan
          </Text>
          {/* M-12 FIX: Checkmark on selected mode card */}
          {selectedMode === 'precision' && (
            <Check size={16} color={colors.textInverse} strokeWidth={2.5} />
          )}
        </View>
        <Text
          style={{
            ...GL_TYPOGRAPHY.captionSmall,
            color: selectedMode === 'precision' ? colors.whiteOverlay85 : colors.textSecondary,
          }}
        >
          Analyze content via built-in browser
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export const ModeToggle = React.memo(ModeToggleComponent);
