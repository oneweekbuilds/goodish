/**
 * PlatformPicker — Circular platform icons for the Calm Home Screen.
 *
 * Shows all supported platforms as tappable circular icons.
 * When a platform is selected, the ModeToggle appears below it
 * for scan mode selection before navigating.
 *
 * Design: Card-like platform items with press animations, upgraded icons,
 * and enhanced visual hierarchy. Tapping a platform triggers haptic feedback
 * and highlights the selection with smooth spring animations.
 */

import { triggerImpactLight, triggerImpactMedium } from '../../lib/haptics';
import React, { useState, useCallback } from 'react';
import { View, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Constants from 'expo-constants';
import { Instagram, Youtube, Music, Facebook, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, PLATFORMS, ThemeColors, ThemeShadows } from '../../lib/theme';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { Text } from '../glue';
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

interface PlatformItemProps {
  platform: { slug: SupportedPlatform; name: string; color: string };
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

/**
 * PlatformItem — Individual platform card with press animation
 */
function PlatformItem({ platform, isSelected, onPress, colors, shadows }: PlatformItemProps) {
  const IconComponent = PLATFORM_ICONS[platform.slug];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, {
      damping: 15,
      stiffness: 150,
    });
  };

  return (
    <View
      style={{
        borderRadius: RADIUS.lg,
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.borderLight,
        padding: SPACING.sm,
        alignItems: 'center',
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Scan ${platform.name}${isSelected ? ', selected — tap again to start scan' : ''}`}
        accessibilityHint={isSelected ? 'Tap again to start scanning this platform' : `Select ${platform.name} for scanning`}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ alignItems: 'center' }}
      >
        <Animated.View
          style={[
            {
              width: 64,
              height: 64,
              borderRadius: RADIUS['2xl'],
              backgroundColor: isSelected ? withAlpha(platform.color, 0.15) : withAlpha(platform.color, 0.10),
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? platform.color : colors.borderSoft,
              justifyContent: 'center',
              alignItems: 'center',
              ...(isSelected ? shadows.card : {}),
            },
            animatedStyle,
          ]}
        >
          {IconComponent && (
            <IconComponent
              size={32}
              color={isSelected ? platform.color : colors.textMuted}
              strokeWidth={1.8}
            />
          )}
        </Animated.View>
      </Pressable>

      <Text
        style={{
          ...GL_TYPOGRAPHY.captionSmall,
          fontWeight: isSelected ? '600' : '500',
          color: isSelected ? colors.textMain : colors.textMuted,
          marginTop: SPACING.sm,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {platform.name}
      </Text>
    </View>
  );
}

/**
 * StartScanButton — Animated start scan button with press feedback (S-01 FIX)
 */
function StartScanButton({ onPress, colors, shadows }: { onPress: () => void; colors: ThemeColors; shadows: ThemeShadows }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <View style={{ marginTop: SPACING.xl }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Start Scan"
        accessibilityHint="Begins your feed scan"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View
          style={[{
            backgroundColor: colors.accentGreen,
            borderRadius: RADIUS.md,
            paddingVertical: SPACING.lg,
            alignItems: 'center',
            minHeight: 48,
            ...shadows.soft,
          }, animatedStyle]}
        >
          <Text
            style={{
              ...GL_TYPOGRAPHY.buttonMd,
              color: colors.textInverse,
            }}
          >
            Start Scan
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function PlatformPickerComponent({ onScanStart }: PlatformPickerProps) {
  const { colors, shadows } = useTheme();
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform | null>(null);
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
      {/* Platform grid — 3 columns of card-based platform items */}
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
          const isSelected = selectedPlatform === platform.slug;

          return (
            <PlatformItem
              key={platform.slug}
              platform={platform}
              isSelected={isSelected}
              onPress={() => handlePlatformTap(platform.slug)}
              colors={colors}
              shadows={shadows}
            />
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
        <StartScanButton onPress={handleStartScan} colors={colors} shadows={shadows} />
      )}
    </View>
  );
}

export const PlatformPicker = React.memo(PlatformPickerComponent);
