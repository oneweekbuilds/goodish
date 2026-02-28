/**
 * PlatformBottomSheet — Smooth bottom sheet for platform selection.
 *
 * Appears when the user taps "Scan Your Feed" on the home screen.
 * Shows platform icons in a clean grid with mode toggle,
 * keeping the home screen free of clutter.
 *
 * Design: Slides up from the bottom with a subtle overlay using @gorhom/bottom-sheet.
 * Tapping a platform immediately starts the scan in the default mode.
 */

import { triggerImpactLight, triggerImpactMedium, triggerSelection } from '../../lib/haptics';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import Constants from 'expo-constants';
import {
  Instagram,
  Youtube,
  Music,
  Facebook,
  MessageCircle,
  X,
} from 'lucide-react-native';
import {
  BottomSheet,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Animated, {
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, PLATFORMS, MIN_TOUCH_TARGET } from '../../lib/theme';
import { GL_TYPOGRAPHY } from '../../lib/gluestackTheme';
import { Text } from '../glue';
import { ModeToggle } from './ModeToggle';
import type { ScanMode, SupportedPlatform } from '../../types/broadcast';
import { withAlpha } from '../../lib/utils';
import { XPlatformIcon } from '../icons/XPlatformIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLATFORM_ICONS: Record<
  string,
  React.FC<{ size: number; color: string; strokeWidth?: number }>
> = {
  instagram: Instagram,
  twitter: XPlatformIcon,
  youtube: Youtube,
  tiktok: Music,
  facebook: Facebook,
  reddit: MessageCircle,
};

const PLATFORM_LIST: {
  slug: SupportedPlatform;
  name: string;
  color: string;
}[] = [
  { slug: 'instagram', name: 'Instagram', color: PLATFORMS.instagram.color },
  { slug: 'twitter', name: 'X', color: PLATFORMS.twitter.color },
  { slug: 'youtube', name: 'YouTube', color: PLATFORMS.youtube.color },
  { slug: 'tiktok', name: 'TikTok', color: PLATFORMS.tiktok.color },
  { slug: 'facebook', name: 'Facebook', color: PLATFORMS.facebook.color },
  { slug: 'reddit', name: 'Reddit', color: PLATFORMS.reddit.color },
];

interface PlatformBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onScanStart: (platform: SupportedPlatform, mode: ScanMode) => void;
  /** M-24 FIX: Most recently scanned platform — used as default selection. */
  lastPlatform?: SupportedPlatform | null;
}

function PlatformBottomSheetComponent({
  visible,
  onClose,
  onScanStart,
  lastPlatform,
}: PlatformBottomSheetProps) {
  const { colors, shadows } = useTheme();
  // Expo Go detection: broadcast requires native modules only in dev builds.
  const isExpoGo = Constants.appOwnership === 'expo';
  const isAndroid = Platform.OS === 'android';
  // Screen Capture hidden — default to precision (Quick Scan) for all users.
  // Original logic preserved for when Screen Capture ships:
  // const defaultMode: ScanMode = (!isExpoGo && !isAndroid && Platform.OS === 'ios') ? 'broadcast' : 'precision';
  const [scanMode, setScanMode] = useState<ScanMode>('precision');
  const [selectedPlatform, setSelectedPlatform] =
    useState<SupportedPlatform | null>(null);

  // Bottom sheet ref for imperative control
  const bottomSheetRef = useRef<any>(null);
  const snapPoints = ['60%', '85%'];

  // Update sheet state when visible changes
  useEffect(() => {
    if (visible) {
      // M-24 FIX: Default to most recently scanned platform, or 'instagram' if no history
      setSelectedPlatform(lastPlatform || 'instagram');
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, lastPlatform]);

  const handlePlatformTap = useCallback(
    (slug: SupportedPlatform) => {
      triggerImpactLight();
      setSelectedPlatform(slug);
    },
    []
  );

  const handleStartScan = useCallback(() => {
    if (!selectedPlatform) return;
    triggerImpactMedium();
    onScanStart(selectedPlatform, scanMode);
  }, [selectedPlatform, scanMode, onScanStart]);

  const handleClose = useCallback(() => {
    triggerSelection();
    onClose();
  }, [onClose]);

  // Backdrop component with useCallback
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      animationConfigs={{
        damping: 50,
        stiffness: 500,
      }}
      backgroundStyle={{
        backgroundColor: colors.bgCard,
        borderTopLeftRadius: RADIUS['2xl'],
        borderTopRightRadius: RADIUS['2xl'],
        borderTopWidth: 1,
        borderTopColor: colors.borderDefault,
        ...shadows.xl,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.borderSlate300,
      }}
      handleStyle={{
        paddingVertical: SPACING.md,
      }}
    >
      <BottomSheetScrollView
        bounces={false}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingHorizontal: SPACING.xl,
          paddingBottom: SPACING['5xl'],
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: SPACING['2xl'],
          }}
        >
          <Text
            style={{
              ...GL_TYPOGRAPHY.h2,
              color: colors.textMain,
            }}
          >
            Choose a platform
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close platform picker"
            accessibilityRole="button"
            style={{
              width: 44,
              height: 44,
              minHeight: MIN_TOUCH_TARGET,
              minWidth: 44,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <X size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Platform grid — 3 columns */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: SPACING.lg,
            marginBottom: SPACING['2xl'],
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
                accessibilityLabel={`${platform.name}${isSelected ? ', selected' : ''}`}
                accessibilityState={{ selected: isSelected }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  alignItems: 'center',
                  width: 88,
                  minHeight: 100,
                  transform: [{ scale: 1 }],
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: RADIUS['2xl'],
                    backgroundColor: isSelected
                      ? withAlpha(platform.color, 0.15)
                      : withAlpha(platform.color, 0.06),
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected
                      ? platform.color
                      : colors.borderSoft,
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
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Screen Capture mode toggle — hidden until feature is ready */}
        {false && selectedPlatform && (
          <View style={{ marginBottom: SPACING.lg }}>
            <ModeToggle
              selectedMode={scanMode}
              onModeChange={setScanMode}
            />
          </View>
        )}

        {/* Start button */}
        <TouchableOpacity
          onPress={handleStartScan}
          activeOpacity={0.7}
          disabled={!selectedPlatform}
          accessibilityRole="button"
          accessibilityLabel={
            selectedPlatform
              ? `Start scanning ${selectedPlatform}`
              : 'Select a platform first'
          }
          accessibilityState={{ disabled: !selectedPlatform }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            backgroundColor: selectedPlatform
              ? colors.primary
              : colors.borderSlate200,
            borderRadius: RADIUS.lg,
            paddingVertical: SPACING.lg,
            alignItems: 'center',
            minHeight: 52,
            ...shadows.soft,
          }}
        >
          <Text
            style={{
              ...GL_TYPOGRAPHY.buttonLg,
              color: selectedPlatform
                ? colors.textInverse
                : colors.textTertiary,
            }}
          >
            {selectedPlatform ? 'Start Scan' : 'Select a platform'}
          </Text>
        </TouchableOpacity>

        {/* Helper text when no platform is selected */}
        {!selectedPlatform && (
          <Text
            style={{
              ...GL_TYPOGRAPHY.caption,
              color: colors.textTertiary,
              textAlign: 'center',
              marginTop: SPACING.sm,
            }}
          >
            Choose a platform above to get started
          </Text>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

export const PlatformBottomSheet = React.memo(PlatformBottomSheetComponent);
