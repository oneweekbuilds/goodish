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

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Instagram, Twitter, Youtube, Music, Facebook, MessageCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, PLATFORMS } from '../../lib/theme';
import { ModeToggle } from './ModeToggle';
import type { ScanMode, SupportedPlatform } from '../../types/broadcast';

// Platform icon mapping
const PLATFORM_ICONS: Record<string, React.FC<{ size: number; color: string; strokeWidth?: number }>> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music,
  facebook: Facebook,
  reddit: MessageCircle,
};

const PLATFORM_LIST: { slug: SupportedPlatform; name: string; color: string }[] = [
  { slug: 'instagram', name: 'Instagram', color: PLATFORMS.instagram.color },
  { slug: 'twitter', name: 'Twitter / X', color: PLATFORMS.twitter.color },
  { slug: 'youtube', name: 'YouTube', color: PLATFORMS.youtube.color },
  { slug: 'tiktok', name: 'TikTok', color: PLATFORMS.tiktok.color },
  { slug: 'facebook', name: 'Facebook', color: PLATFORMS.facebook.color },
  { slug: 'reddit', name: 'Reddit', color: PLATFORMS.reddit.color },
];

interface PlatformPickerProps {
  onScanStart?: (platform: SupportedPlatform, mode: ScanMode) => void;
}

export function PlatformPicker({ onScanStart }: PlatformPickerProps) {
  const { colors, shadows } = useTheme();
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('broadcast');

  const handlePlatformTap = useCallback((slug: SupportedPlatform) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
              style={{ alignItems: 'center', width: 80 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: isSelected ? `${platform.color}18` : colors.bgCard,
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
                  fontSize: 11,
                  fontWeight: isSelected ? '600' : '500',
                  color: isSelected ? colors.textMain : colors.textMuted,
                  marginTop: 6,
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

      {/* Mode toggle + start button — shown when a platform is selected */}
      {selectedPlatform && (
        <View style={{ marginTop: SPACING.xl }}>
          <ModeToggle
            selectedMode={scanMode}
            onModeChange={handleModeChange}
          />

          <TouchableOpacity
            onPress={handleStartScan}
            activeOpacity={0.7}
            style={{
              marginTop: SPACING.lg,
              backgroundColor: colors.accentGreen,
              borderRadius: RADIUS.md,
              paddingVertical: 14,
              alignItems: 'center',
              ...shadows.soft,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: '#FFFFFF',
              }}
            >
              {scanMode === 'broadcast' ? 'Start Broadcasting' : 'Start Scanning'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
