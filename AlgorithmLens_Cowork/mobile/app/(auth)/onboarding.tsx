/**
 * Onboarding — 3-screen flow designed to take 15 seconds max.
 *
 * Screen 1: "See what's really in your feed" — value prop with abstract graphic
 * Screen 2: "How it works" — 3 steps with icons
 * Screen 3: "Start your first scan" — platform selection with "Let's go" button
 *
 * Design principles:
 * - No walls of text — every screen scannable in 2 seconds
 * - CTA is always the most visually prominent element
 * - Epistemically restrained: describes, never accuses
 *
 * REFACTORED:
 * - State-based rendering (O-1, O-2) — replaces horizontal ScrollView with conditional rendering
 * - Fade transitions between screens
 * - Back button on screens 1-2 (O-5)
 * - Platform labels fixed: increased width to 100, using "X" instead of "Twitter / X" (O-3)
 * - Centered content blocks with maxWidth constraints (O-7)
 * - Fixed vertical whitespace with flex layout (O-8)
 * - Increased opacity of concentric circles (O-9)
 */

import React, { useState, useCallback } from 'react';

const NAVIGATION_DELAY_MS = 300;
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
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
} from 'lucide-react-native';
import { triggerImpactMedium, triggerImpactLight } from '../../src/lib/haptics';
import { TYPOGRAPHY, SPACING, RADIUS, PLATFORMS } from '../../src/lib/theme';
import Constants from 'expo-constants';
import type { SupportedPlatform } from '../../src/types/broadcast';
import { withAlpha } from '../../src/lib/utils';
import { XPlatformIcon } from '../../src/components/icons/XPlatformIcon';
import { Button } from '../../src/components/ui/Button';

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
  // O-4 FIX: TikTok uses Music2 icon — slightly more recognizable than Music.
  // Lucide doesn't have a TikTok icon. Consider custom SVG if branding becomes critical.
  { slug: 'tiktok', name: 'TikTok', color: PLATFORMS.tiktok.color, Icon: Music2 },
  { slug: 'facebook', name: 'Facebook', color: PLATFORMS.facebook.color, Icon: Facebook },
  { slug: 'reddit', name: 'Reddit', color: PLATFORMS.reddit.color, Icon: MessageCircle },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const { user, completeOnboarding } = useAuth();
  const { colors, shadows } = useTheme();

  const animatePageTransition = useCallback((nextPage: number) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Update page
      setCurrentPage(nextPage);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

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
    completeOnboarding(true);

    // Navigate to main app, optionally starting a scan
    if (selectedPlatform) {
      // In Expo Go or on Android, use precision mode (scanner) instead of broadcast
      const isExpoGo = Constants.appOwnership === 'expo';
      const useScanner = isExpoGo || Platform.OS === 'android';
      router.replace('/(tabs)');
      // Small delay to let the tab mount before pushing scan
      setTimeout(() => {
        router.push({
          pathname: useScanner ? '/scanner/[platform]' : '/broadcast/[platform]',
          params: { platform: selectedPlatform },
        });
      }, NAVIGATION_DELAY_MS);
    } else {
      router.replace('/(tabs)');
    }
  }, [user, completeOnboarding, selectedPlatform]);

  const handlePlatformTap = useCallback((slug: SupportedPlatform) => {
    triggerImpactLight();
    setSelectedPlatform((prev) => (prev === slug ? null : slug));
  }, []);

  const isLastPage = currentPage === TOTAL_PAGES - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
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
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
        }}
      >
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
            {/* Abstract graphic — layered circles representing feed composition */}
            <View
              style={{
                width: 120,
                height: 120,
                marginBottom: SPACING['4xl'],
              }}
              accessible
              accessibilityLabel="Abstract illustration of feed composition"
            >
              {/* Outer circle */}
              <View
                style={{
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: withAlpha(colors.blue50, 0.7),
                }}
              />
              {/* Middle circle */}
              <View
                style={{
                  position: 'absolute',
                  top: 20,
                  left: 20,
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: withAlpha(colors.blue100, 0.8),
                }}
              />
              {/* Inner circle with icon */}
              <View
                style={{
                  position: 'absolute',
                  top: 36,
                  left: 36,
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Eye size={24} color={colors.textInverse} strokeWidth={1.8} />
              </View>
            </View>

            <View style={{ maxWidth: MAX_CONTENT_WIDTH }}>
              <Text
                style={{
                  ...TYPOGRAPHY.display,
                  color: colors.textMain,
                  textAlign: 'center',
                  marginBottom: SPACING.lg,
                }}
                accessibilityRole="header"
              >
                See what's in{'\n'}your feed
              </Text>

              <Text
                style={{
                  ...TYPOGRAPHY.bodyLarge,
                  color: colors.textMuted,
                  textAlign: 'center',
                }}
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
                style={{
                  ...TYPOGRAPHY.display,
                  color: colors.textMain,
                  textAlign: 'center',
                  marginBottom: SPACING['4xl'],
                }}
                accessibilityRole="header"
              >
                How it works
              </Text>

              <View style={{ gap: SPACING['2xl'] }}>
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
                ].map((item) => (
                  <View
                    key={item.step}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: SPACING.lg,
                    }}
                    accessible
                    accessibilityLabel={`Step ${item.step}: ${item.label} — ${item.detail}`}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: RADIUS['2xl'],
                        backgroundColor: colors.blue50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <item.Icon
                        size={22}
                        color={colors.primary}
                        strokeWidth={1.8}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          ...TYPOGRAPHY.h3,
                          color: colors.textMain,
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          ...TYPOGRAPHY.bodySmall,
                          color: colors.textMuted,
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
            <View style={{ maxWidth: MAX_CONTENT_WIDTH, width: '100%' }}>
              <Text
                style={{
                  ...TYPOGRAPHY.display,
                  color: colors.textMain,
                  textAlign: 'center',
                  marginBottom: SPACING.md,
                }}
                accessibilityRole="header"
              >
                Start your first scan
              </Text>

              <Text
                style={{
                  ...TYPOGRAPHY.body,
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginBottom: SPACING['3xl'],
                }}
              >
                Pick a platform to begin
              </Text>

              {/* Platform grid */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: SPACING.lg,
                }}
              >
                {PLATFORM_LIST.map((platform) => {
                  const isSelected = selectedPlatform === platform.slug;

                  return (
                    <TouchableOpacity
                      key={platform.slug}
                      onPress={() => handlePlatformTap(platform.slug)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${platform.name}${isSelected ? ', selected' : ''}`}
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        alignItems: 'center',
                        width: 100,
                        minHeight: 44,
                      }}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: RADIUS['2xl'],
                          backgroundColor: isSelected
                            ? withAlpha(platform.color, 0.09)
                            : colors.bgCard,
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
                          size={24}
                          color={isSelected ? platform.color : colors.textMuted}
                          strokeWidth={1.8}
                        />
                      </View>
                      <Text
                        style={{
                          ...TYPOGRAPHY.captionSmall,
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
        {/* Dot indicators */}
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
            <View
              key={idx}
              style={{
                width: currentPage === idx ? 24 : 8,
                height: 8,
                backgroundColor:
                  currentPage === idx ? colors.primary : colors.borderSlate300,
                borderRadius: RADIUS.full,
              }}
            />
          ))}
        </View>

        {/* CTA button */}
        {isLastPage ? (
          <Button
            title="Let's go"
            onPress={handleGetStarted}
            variant="primary"
            size="lg"
            accessibilityLabel={selectedPlatform ? `Let's go — scan ${selectedPlatform}` : "Let's go"}
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

        {/* Skip option (screens 1–2 only) */}
        {!isLastPage && (
          <Button
            title="Skip"
            onPress={() => handleGoToPage(TOTAL_PAGES - 1)}
            variant="ghost"
            size="md"
            accessibilityLabel="Skip onboarding"
            style={{ marginTop: SPACING.md }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
