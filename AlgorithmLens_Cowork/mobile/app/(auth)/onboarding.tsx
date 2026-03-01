/**
 * Onboarding — 3-screen flow designed to take 15 seconds max.
 *
 * Screen 1: "See what's really in your feed" — value prop with polished illustration
 * Screen 2: "How it works" — 3 steps with animated vertical connector
 * Screen 3: "Start your first scan" — platform selection with spring animations
 *
 * Design principles:
 * - No walls of text — every screen scannable in 2 seconds
 * - CTA is always the most visually prominent element
 * - Epistemically restrained: describes, never accuses
 * - Smooth 200ms transitions with subtle 4px translateY slide (reanimated)
 * - Platform picker with 64x64 icons, 10% opacity backgrounds, spring scale (0.95/1.02)
 * - Progress dots with smooth width animation
 * - AI consent notice: small, trustworthy, not a wall
 *
 * IMPROVEMENTS (Phase 6 Part A):
 * - Replaced Animated.timing with react-native-reanimated for smoother transitions
 * - Screen 1: New "phone frame" visual with layered analysis icons (Eye, BarChart3, Shield)
 * - Screen 2: Added vertical connector line between steps, larger icon containers (48px)
 * - Screen 3: Upgraded platform picker (64x64 icons, 10% opacity, spring scale animation)
 * - Added AI consent notice with Shield icon
 * - Progress dots with smooth width animation using reanimated
 * - All text maintains epistemic restraint
 */

import React, { useState, useCallback, useEffect } from 'react';

const NAVIGATION_DELAY_MS = 300;
import {
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import {
  Eye,
  Smartphone,
  ScrollText,
  BarChart3,
  Instagram,
  Youtube,
  Music2,
  Facebook,
  MessageCircle,
  ChevronLeft,
  Shield,
} from 'lucide-react-native';
import { triggerImpactMedium, triggerImpactLight } from '../../src/lib/haptics';
import { GL_TYPOGRAPHY, SPACING, RADIUS } from '../../src/lib/gluestackTheme';
import { PLATFORMS, ICON_SIZES, MIN_TOUCH_TARGET, type ThemeColors, type ThemeShadows } from '../../src/lib/theme';
import Constants from 'expo-constants';
import type { SupportedPlatform } from '../../src/types/broadcast';
import { withAlpha } from '../../src/lib/utils';
import { XPlatformIcon } from '../../src/components/icons/XPlatformIcon';
import { Button, Text } from '../../src/components/glue';

const { width } = Dimensions.get('window');

const TOTAL_PAGES = 3;
const MAX_CONTENT_WIDTH = 340;

const PLATFORM_LIST: {
  slug: SupportedPlatform;
  name: string;
  color: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
}[] = [
  { slug: 'instagram', name: 'Instagram', color: PLATFORMS.instagram.color, Icon: Instagram },
  { slug: 'twitter', name: 'X', color: PLATFORMS.twitter.color, Icon: XPlatformIcon },
  { slug: 'youtube', name: 'YouTube', color: PLATFORMS.youtube.color, Icon: Youtube },
  { slug: 'tiktok', name: 'TikTok', color: PLATFORMS.tiktok.color, Icon: Music2 },
  { slug: 'facebook', name: 'Facebook', color: PLATFORMS.facebook.color, Icon: Facebook },
  { slug: 'reddit', name: 'Reddit', color: PLATFORMS.reddit.color, Icon: MessageCircle },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform | null>(null);

  // Reanimated shared values for cross-fade + slide transitions
  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);

  // Screen-level exit animation for smooth transition to home
  const screenOpacity = useSharedValue(1);
  const screenScale = useSharedValue(1);

  const { user, completeOnboarding } = useAuth();
  const { colors, shadows } = useTheme();

  const animatePageTransition = useCallback((nextPage: number) => {
    // Fade out + slide up
    fadeAnim.value = withTiming(0, { duration: 200 });
    slideAnim.value = withTiming(4, { duration: 200 });

    setTimeout(() => {
      setCurrentPage(nextPage);
      // Fade in + slide down
      fadeAnim.value = withTiming(1, { duration: 200 });
      slideAnim.value = withTiming(0, { duration: 200 });
    }, 200);
  }, [fadeAnim, slideAnim]);

  const handleGoToPage = useCallback((page: number) => {
    if (page !== currentPage && page >= 0 && page < TOTAL_PAGES) {
      animatePageTransition(page);
    }
  }, [currentPage, animatePageTransition]);

  const handleBack = useCallback(() => {
    if (currentPage > 0) {
      handleGoToPage(currentPage - 1);
    }
  }, [currentPage, handleGoToPage]);

  const performNavigation = useCallback(() => {
    completeOnboarding(true);

    if (selectedPlatform) {
      const isExpoGo = Constants.appOwnership === 'expo';
      const useScanner = isExpoGo || Platform.OS === 'android';
      router.replace('/(tabs)');
      setTimeout(() => {
        router.push({
          pathname: useScanner ? '/scanner/[platform]' : '/broadcast/[platform]',
          params: { platform: selectedPlatform },
        });
      }, NAVIGATION_DELAY_MS);
    } else {
      router.replace('/(tabs)');
    }
  }, [completeOnboarding, selectedPlatform]);

  const handleGetStarted = useCallback(async () => {
    triggerImpactMedium();
    try {
      if (user?.id) {
        await supabase
          .from('user_profiles')
          .upsert(
            {
              user_id: user.id,
              has_completed_onboarding: true,
              ai_analysis_consent: true,
            },
            { onConflict: 'user_id' }
          );
      }
    } catch {
      // Non-blocking — continue to the app
    }

    // Smooth exit: fade out + subtle scale down before navigating
    screenOpacity.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) });
    screenScale.value = withTiming(0.97, { duration: 250, easing: Easing.out(Easing.quad) });
    setTimeout(() => {
      runOnJS(performNavigation)();
    }, 260);
  }, [user, performNavigation, screenOpacity, screenScale]);

  const handlePlatformTap = useCallback((slug: SupportedPlatform) => {
    triggerImpactLight();
    setSelectedPlatform((prev) => (prev === slug ? null : slug));
  }, []);

  const isLastPage = currentPage === TOTAL_PAGES - 1;

  // Animated styles for main content (per-page transition)
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  // Screen-level exit animation style
  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ scale: screenScale.value }],
  }));

  // Entrance animation for Screen 1 illustration
  const illustrationScale = useSharedValue(0.85);
  const illustrationOpacity = useSharedValue(0);

  useEffect(() => {
    if (currentPage === 0) {
      illustrationScale.value = withSpring(1, { damping: 12, stiffness: 80 });
      illustrationOpacity.value = withTiming(1, { duration: 400 });
    }
  }, [currentPage]);

  const illustrationStyle = useAnimatedStyle(() => ({
    opacity: illustrationOpacity.value,
    transform: [{ scale: illustrationScale.value }],
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
    <Animated.View style={[{ flex: 1 }, screenAnimatedStyle]}>
      {/* ── Header: Back button ── */}
      <View
        style={{
          height: 44,
          paddingHorizontal: SPACING.lg,
          justifyContent: 'center',
        }}
      >
        {currentPage > 0 && currentPage < TOTAL_PAGES && (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={colors.textMain} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Main content (animated) ── */}
      <Animated.View style={[{ flex: 1 }, contentAnimatedStyle]}>
        {/* ── Screen 1: Value Prop ── */}
        {currentPage === 0 && (
          <View
            style={{
              flex: 1,
              paddingHorizontal: SPACING['2xl'],
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Polished phone frame with overlapping analysis icons — animated entrance */}
            <Animated.View
              style={[{
                width: 140,
                height: 140,
                marginBottom: SPACING['4xl'],
                position: 'relative',
              }, illustrationStyle]}
              accessible
              accessibilityLabel="Phone frame with analysis icons illustration"
            >
              {/* Outer blue circle (background) */}
              <View
                style={{
                  position: 'absolute',
                  width: 140,
                  height: 140,
                  borderRadius: RADIUS.full,
                  backgroundColor: withAlpha(colors.blue50, 0.6),
                  top: 0,
                  left: 0,
                }}
              />

              {/* Middle blue circle */}
              <View
                style={{
                  position: 'absolute',
                  width: 110,
                  height: 110,
                  borderRadius: RADIUS.full,
                  backgroundColor: withAlpha(colors.blue100, 0.8),
                  top: 15,
                  left: 15,
                }}
              />

              {/* Inner primary blue circle (phone frame base) */}
              <View
                style={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  borderRadius: RADIUS.full,
                  backgroundColor: colors.primary,
                  top: 30,
                  left: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Eye icon center */}
                <Eye size={32} color={colors.textInverse} strokeWidth={1.5} />
              </View>

              {/* Overlapping BarChart3 icon (bottom-right) */}
              <View
                style={{
                  position: 'absolute',
                  width: 44,
                  height: 44,
                  borderRadius: RADIUS.lg,
                  backgroundColor: withAlpha(colors.primary, 0.9),
                  bottom: 12,
                  right: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <BarChart3 size={20} color={colors.textInverse} strokeWidth={2} />
              </View>

              {/* Overlapping Shield icon (top-right) */}
              <View
                style={{
                  position: 'absolute',
                  width: 44,
                  height: 44,
                  borderRadius: RADIUS.lg,
                  backgroundColor: withAlpha(colors.secondary, 0.85),
                  top: 8,
                  right: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Shield size={20} color={colors.textInverse} strokeWidth={2} />
              </View>
            </Animated.View>

            <View style={{ maxWidth: MAX_CONTENT_WIDTH }}>
              <Text
                variant="display"
                color={colors.textMain}
                align="center"
                style={{
                  marginBottom: SPACING.lg,
                }}
                accessibilityRole="header"
              >
                See what's in{'\n'}your feed
              </Text>

              <Text
                variant="bodyLarge"
                color={colors.textMuted}
                align="center"
              >
                A clear picture of what appears — sources, ads, tone, and more.
              </Text>
            </View>
          </View>
        )}

        {/* ── Screen 2: How It Works ── */}
        {currentPage === 1 && (
          <View
            style={{
              flex: 1,
              paddingHorizontal: SPACING['2xl'],
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ maxWidth: MAX_CONTENT_WIDTH, width: '100%' }}>
              <Text
                variant="display"
                color={colors.textMain}
                align="center"
                style={{
                  marginBottom: SPACING['4xl'],
                }}
                accessibilityRole="header"
              >
                How it works
              </Text>

              <View style={{ gap: 0, position: 'relative' }}>
                {/* Vertical connector line (2px width, positioned absolutely) */}
                <View
                  style={{
                    position: 'absolute',
                    left: 23, // Align with center of icon container
                    top: 60,
                    bottom: 60,
                    width: 2,
                    backgroundColor: colors.borderLight,
                    zIndex: 0,
                  }}
                />

                {[
                  {
                    Icon: Smartphone,
                    step: '1',
                    label: 'Open',
                    detail: 'Pick a platform',
                  },
                  {
                    Icon: ScrollText,
                    step: '2',
                    label: 'Scroll',
                    detail: 'Browse like you normally would',
                  },
                  {
                    Icon: BarChart3,
                    step: '3',
                    label: 'Discover',
                    detail: 'See what appeared in your feed',
                  },
                ].map((item, idx) => (
                  <View
                    key={item.step}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: SPACING.lg,
                      marginBottom: idx < 2 ? SPACING['2xl'] : 0,
                      position: 'relative',
                      zIndex: 1,
                    }}
                    accessible
                    accessibilityLabel={`Step ${item.step}: ${item.label} — ${item.detail}`}
                  >
                    {/* Step number in primary blue circle */}
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: RADIUS['2xl'],
                        backgroundColor: colors.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Text
                        variant="h3"
                        color={colors.textInverse}
                        align="center"
                      >
                        {item.step}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        variant="h3"
                        color={colors.textMain}
                      >
                        {item.label}
                      </Text>
                      <Text
                        variant="bodySmall"
                        color={colors.textMuted}
                        style={{
                          marginTop: SPACING.xxs,
                        }}
                      >
                        {item.detail}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Screen 3: Start Your First Scan ── */}
        {currentPage === 2 && (
          <View
            style={{
              flex: 1,
              paddingHorizontal: SPACING['2xl'],
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ maxWidth: MAX_CONTENT_WIDTH, width: '100%', flex: 1, justifyContent: 'center' }}>
              <Text
                variant="display"
                color={colors.textMain}
                align="center"
                style={{
                  marginBottom: SPACING.md,
                }}
                accessibilityRole="header"
              >
                Start your first scan
              </Text>

              <Text
                variant="body"
                color={colors.textMuted}
                align="center"
                style={{
                  marginBottom: SPACING['3xl'],
                }}
              >
                Pick a platform to begin
              </Text>

              {/* Platform grid with upgraded styling */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: SPACING.lg,
                  marginBottom: SPACING['3xl'],
                }}
              >
                {PLATFORM_LIST.map((platform) => {
                  const isSelected = selectedPlatform === platform.slug;

                  return (
                    <PlatformCard
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

              {/* AI Consent Notice */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                  backgroundColor: withAlpha(colors.blue50, 0.4),
                  borderRadius: RADIUS.md,
                }}
                accessible
                accessibilityLabel="AlgorithmLens analyzes your feed locally using AI. Your data stays on your device."
              >
                <Shield size={16} color={colors.primary} strokeWidth={2} />
                <Text
                  variant="bodySmall"
                  color={colors.textMuted}
                  align="left"
                  style={{ flex: 1 }}
                >
                  AlgorithmLens analyzes your feed locally using AI. Your data stays on your device.
                </Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── Footer ── */}
      <View
        style={{
          paddingHorizontal: SPACING.xl,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING['2xl'],
        }}
      >
        {/* Dot indicators with smooth width animation */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: SPACING.sm,
            marginBottom: SPACING.xl,
          }}
          accessible
          accessibilityLabel={`Page ${currentPage + 1} of ${TOTAL_PAGES}`}
        >
          {Array.from({ length: TOTAL_PAGES }).map((_, idx) => (
            <AnimatedDot
              key={idx}
              isActive={currentPage === idx}
              colors={colors}
            />
          ))}
        </View>

        {/* CTA button */}
        {isLastPage ? (
          <Button
            title={selectedPlatform ? "Let's go" : "Get Started"}
            onPress={handleGetStarted}
            variant="primary"
            size="lg"
            accessibilityLabel={selectedPlatform ? `Let's go — scan ${selectedPlatform}` : "Get started — explore the app"}
          />
        ) : (
          <Button
            title="Next"
            onPress={() => handleGoToPage(currentPage + 1)}
            variant="primary"
            size="lg"
            accessibilityLabel="Next screen"
          />
        )}

        {/* Skip option — subtle but accessible on all screens */}
        {!isLastPage ? (
          <Button
            title="Skip"
            onPress={() => handleGoToPage(TOTAL_PAGES - 1)}
            variant="ghost"
            size="md"
            accessibilityLabel="Skip to platform selection"
            style={{ marginTop: SPACING.md }}
          />
        ) : !selectedPlatform ? (
          <Pressable
            onPress={handleGetStarted}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Skip platform selection and go to home screen"
            style={{ marginTop: SPACING.md, alignSelf: 'center', paddingVertical: SPACING.sm }}
          >
            <Text
              variant="bodySmall"
              color={colors.textSecondary}
              align="center"
            >
              Skip for now
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
    </SafeAreaView>
  );
}

/**
 * PlatformCard — Upgraded platform picker with spring scale animation
 *
 * Features:
 * - 64x64 icon container with 10% opacity background
 * - Spring scale on selection (1.02)
 * - Press scale feedback (0.95)
 */
interface PlatformCardProps {
  platform: (typeof PLATFORM_LIST)[0];
  isSelected: boolean;
  onPress: () => void;
  colors: ThemeColors;
  shadows: ThemeShadows;
}

function PlatformCard({
  platform,
  isSelected,
  onPress,
  colors,
  shadows,
}: PlatformCardProps) {
  const scaleAnim = useSharedValue(1);
  const pressAnim = useSharedValue(0);

  const handlePressIn = () => {
    pressAnim.value = withSpring(0.95, { damping: 8, mass: 1 });
  };

  const handlePressOut = () => {
    pressAnim.value = withSpring(1, { damping: 8, mass: 1 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressAnim.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${platform.name}${isSelected ? ', selected' : ''}`}
      accessibilityState={{ selected: isSelected }}
      style={{
        alignItems: 'center',
        width: 100,
        minHeight: MIN_TOUCH_TARGET,
      }}
    >
      <Animated.View style={animatedStyle}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: RADIUS.lg,
            backgroundColor: isSelected
              ? withAlpha(platform.color, 0.1)
              : withAlpha(colors.textMuted, 0.04),
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected
              ? platform.color
              : colors.borderSoft,
            justifyContent: 'center',
            alignItems: 'center',
            ...(isSelected ? shadows.soft : {}),
          }}
        >
          <platform.Icon
            size={28}
            color={isSelected ? platform.color : colors.textMuted}
            strokeWidth={1.8}
          />
        </View>
      </Animated.View>

      <Text
        variant="captionSmall"
        color={isSelected ? colors.textMain : colors.textMuted}
        align="center"
        style={{
          fontWeight: isSelected ? '600' : '500',
          marginTop: SPACING.sm,
        }}
      >
        {platform.name}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * AnimatedDot — Progress indicator with smooth width animation
 */
interface AnimatedDotProps {
  isActive: boolean;
  colors: ThemeColors;
}

function AnimatedDot({ isActive, colors }: AnimatedDotProps) {
  const widthAnim = useSharedValue(isActive ? 24 : 8);

  React.useEffect(() => {
    widthAnim.value = withTiming(isActive ? 24 : 8, { duration: 300 });
  }, [isActive, widthAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: widthAnim.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: 8,
          backgroundColor: isActive ? colors.primary : colors.borderSlate300,
          borderRadius: RADIUS.full,
        },
        animatedStyle,
      ]}
    />
  );
}
