/**
 * PlatformPicker — Circular platform icons for the Calm Home Screen.
 *
 * Shows all supported platforms as tappable circular icons.
 * When a platform is selected, the ModeToggle appears below it
 * for scan mode selection before navigating.
 *
 * Design: Clean, minimal circles with platform colors. Tapping a
 * platform triggers a light haptic and highlights the selection.
 */

import { triggerImpactLight, triggerImpactMedium } from '../../lib/haptics';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Instagram, Youtube, Music, Facebook, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY, PLATFORMS } from '../../lib/theme';
import { ModeToggle } from './ModeToggle';
import type { ScanMode, SupportedPlatform } from '../../types/broadcast';
import { withAlpha } from '../../lib/utils';
import { XPlatformIcon } from '../icons/XPlatformIcon';

// Platform icon mapping
const PLATFORM_ICONS: Record<string, React.FC<{ size: number; color: string; strokeWidth?: number }>> = {
  instagram: Instagram,
  twitter: XPlatformIcon,
  youtube: Youtube,
  tiktok: Music,
  facebook: Facebook,
  reddit: MessageCircle,
};

const PLATFORM_LIST: { slug: SupportedPlatform; name: string; color: string }[] = [
  { slug: 'instagram', name: 'Instagram', color: PLATFORMS.instagram.color },
  { slug: 'twitter', name: 'X', color: PLATFORMS.twitter.color },
  { slug: 'youtube', name: 'YouTube', color: PLATFORMS.youtube.color },
  { slug: 'tiktok', name: 'TikTok', color: PLATFORMS.tiktok.color },
  { slug: 'facebook', name: 'Facebook', color: PLATFORMS.facebook.color },
  { slug: 'reddit', name: 'Reddit', color: PLATFORMS.reddit.color },
];

interface PlatformPickerProps {
  onScanStart?: (platform: SupportedPlatform, mode: ScanMode) => void;
}

function PlatformPickerComponent({ onScanStart }: PlatformPickerProps) {
  const { colors, shadows } = useTheme();
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform | null>(null);
  // Screen Capture hidden — default to precision (Quick Scan) for all users.
  // Original logic preserved for when Screen Capture ships:
  // const isExpoGo = Constants.appOwnership === 'expo';
  // const isAndroid = Platform.OS === 'android';
  // const defaultMode: ScanMode = (!isExpoGo && !isAndroid && Platform.OS === 'ios') ? 'broadcast' : 'precision';
  const [scanMode, setScanMode] = useState<ScanMode>('precision');

  const handlePlatformTap = useCallback((slug: SupportedPlatform) => {
    triggerImpactLight();

    if (selectedPlatform === slug) {
      // Second tap on same platform — start the scan
      if (onScanStart) {
        onScanStart(slug, scanMode);
      } else {
        // Default navigation behavior
        if (scanMode === 'broadcast') {
          router.push({
            pathname: '/broadcast/[platform]',
            params: { platform: slug },
          });
        } else {
          router.push({
            pathname: '/scanner/[platform]',
            params: { platform: slug },
          });
        }
      }
    } else {
      setSelectedPlatform(slug);
    }
  }, [selectedPlatform, scanMode, onScanStart]);

  const handleModeChange = useCallback((mode: ScanMode) => {
    setScanMode(mode);
  }, []);

  const handleStartScan = useCallback(() => {
    if (!selectedPlatform) return;
    triggerImpactMedium();

    if (onScanStart) {
      onScanStart(selectedPlatform, scanMode);
    } else {
      if (scanMode === 'broadcast') {
        router.push({
          pathname: '/broadcast/[platform]',
          params: { platform: selectedPlatform },
        });
      } else {
        router.push({
          pathname: '/scanner/[platform]',
          params: { platform: selectedPlatform },
        });
      }
    }
  }, [selectedPlatform, scanMode, onScanStart]);

  return (
    <View>
      {/* Platform grid — 3 columns of circles */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: SPACING.lg,
          paddingHorizontal: SPACING.md,
        }}
      >
        {PLATFORM_LIST.map((platform) => {
          const IconComponent = PLATFORM_ICONS[platform.slug];
          const isSelected = selectedPlatform === platform.slug;

          return (
            <TouchableOpacity
              key={platform.slug}
              onPress={() => handlePlatformTap(platform.slug)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Scan ${platform.name}${isSelected ? ', selected — tap again to start scan' : ''}`}
              accessibilityHint={isSelected ? 'Tap again to start scanning this platform' : `Select ${platform.name} for scanning`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ alignItems: 'center', width: 80, minHeight: 80 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: RADIUS['2xl'],
                  // L-04 FIX: Brand colors at reduced opacity for unselected state
                  backgroundColor: isSelected ? withAlpha(platform.color, 0.15) : withAlpha(platform.color, 0.06),
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? platform.color : colors.borderSoft,
                  justifyContent: 'center',
                  alignItems: 'center',
                  ...(isSelected ? shadows.soft : {}),
                }}
              >
                {IconComponent && (
                  <IconComponent
                    size={24}
                    color={isSelected ? platform.color : colors.textMuted}
                    strokeWidth={1.8}
                  />
                )}
              </View>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.captionSmall.fontSize,
                  fontWeight: isSelected ? '600' : '500',
                  color: isSelected ? colors.textMain : colors.textMuted,
                  marginTop: SPACING.sm,
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                {platform.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Screen Capture mode toggle — hidden until feature is ready */}
      {false && selectedPlatform && (
        <View style={{ marginTop: SPACING.xl }}>
          <ModeToggle
            selectedMode={scanMode}
            onModeChange={handleModeChange}
          />
        </View>
      )}

      {/* Start button — shown when a platform is selected */}
      {selectedPlatform && (
        <View style={{ marginTop: SPACING.xl }}>
          <TouchableOpacity
            onPress={handleStartScan}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Start Scan"
            accessibilityHint="Begins your feed scan"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              backgroundColor: colors.accentGreen,
              borderRadius: RADIUS.md,
              paddingVertical: SPACING.lg,
              alignItems: 'center',
              minHeight: 48,
              ...shadows.soft,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.buttonMd,
                color: colors.textInverse,
              }}
            >
              Start Scan
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export const PlatformPicker = React.memo(PlatformPickerComponent);
