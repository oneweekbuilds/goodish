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
 */

import React, { useState, useRef, useCallback } from 'react';

// Navigation delays (ms)
const NAVIGATION_DELAY_MS = 300;
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  Twitter,
  Youtube,
  Music,
  Facebook,
  MessageCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TYPOGRAPHY, SPACING, RADIUS, PLATFORMS } from '../../src/lib/theme';
import type { SupportedPlatform } from '../../src/types/broadcast';
import { withAlpha } from '../../src/lib/utils';

const { width } = Dimensions.get('window');

const TOTAL_PAGES = 3;

const PLATFORM_LIST: {
  slug: SupportedPlatform;
  name: string;
  color: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
}[] = [
  { slug: 'instagram', name: 'Instagram', color: PLATFORMS.instagram.color, Icon: Instagram },
  { slug: 'twitter', name: 'Twitter / X', color: PLATFORMS.twitter.color, Icon: Twitter },
  { slug: 'youtube', name: 'YouTube', color: PLATFORMS.youtube.color, Icon: Youtube },
  // Note: TikTok icon uses Music icon as a placeholder. Lucide doesn't have a TikTok icon.
  // Trade-off: Music icon is visually similar and recognizable. Consider custom SVG if branding becomes critical.
  { slug: 'tiktok', name: 'TikTok', color: PLATFORMS.tiktok.color, Icon: Music },
  { slug: 'facebook', name: 'Facebook', color: PLATFORMS.facebook.color, Icon: Facebook },
  { slug: 'reddit', name: 'Reddit', color: PLATFORMS.reddit.color, Icon: MessageCircle },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user, completeOnboarding } = useAuth();
  const { colors, shadows } = useTheme();

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const position = event.nativeEvent.contentOffset.x;
      const page = Math.round(position / width);
      setCurrentPage(page);
    },
    []
  );

  const scrollToPage = useCallback((page: number) => {
    scrollViewRef.current?.scrollTo({
      x: page * width,
      animated: true,
    });
    setCurrentPage(page);
  }, []);

  const handleGetStarted = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      router.replace('/(tabs)');
      // Small delay to let the tab mount before pushing scan
      setTimeout(() => {
        router.push({
          pathname: '/broadcast/[platform]',
          params: { platform: selectedPlatform },
        });
      }, NAVIGATION_DELAY_MS);
    } else {
      router.replace('/(tabs)');
    }
  }, [user, completeOnboarding, selectedPlatform]);

  const handlePlatformTap = useCallback((slug: SupportedPlatform) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlatform((prev) => (prev === slug ? null : slug));
  }, []);

  const isLastPage = currentPage === TOTAL_PAGES - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
      >
        {/* ── Screen 1: Value Prop ── */}
        <View
          style={{
            width,
            paddingHorizontal: SPACING['2xl'],
            justifyContent: 'center',
          }}
        >
          {/* Abstract graphic — layered circles representing feed composition */}
          <View
            style={{
              alignSelf: 'center',
              width: 120,
              height: 120,
              marginBottom: SPACING['4xl'],
            }}
            accessible
            accessibilityLabel="Abstract illustration of feed composition"
          >
            <View
              style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.blue50,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.blue100,
              }}
            />
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

        {/* ── Screen 2: How It Works ── */}
        <View
          style={{
            width,
            paddingHorizontal: SPACING['2xl'],
            justifyContent: 'center',
          }}
        >
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

        {/* ── Screen 3: Start Your First Scan ── */}
        <View
          style={{
            width,
            paddingHorizontal: SPACING['2xl'],
            justifyContent: 'center',
          }}
        >
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
                    width: 88,
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
      </ScrollView>

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
          <TouchableOpacity
            onPress={handleGetStarted}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={selectedPlatform ? `Let's go — scan ${selectedPlatform}` : "Let's go"}
            style={{
              backgroundColor: colors.primary,
              borderRadius: RADIUS.lg,
              paddingVertical: SPACING.lg,
              alignItems: 'center',
              minHeight: 52,
              ...shadows.hero,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.buttonLg,
                color: colors.textInverse,
              }}
            >
              Let's go
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => scrollToPage(currentPage + 1)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Next screen"
            style={{
              backgroundColor: colors.primary,
              borderRadius: RADIUS.lg,
              paddingVertical: SPACING.lg,
              alignItems: 'center',
              minHeight: 52,
              ...shadows.medium,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.buttonLg,
                color: colors.textInverse,
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        )}

        {/* Skip option (screens 1–2 only) */}
        {!isLastPage && (
          <TouchableOpacity
            onPress={() => scrollToPage(TOTAL_PAGES - 1)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            style={{
              marginTop: SPACING.md,
              paddingVertical: SPACING.sm,
              alignItems: 'center',
              minHeight: 44,
            }}
          >
            <Text
              style={{
                ...TYPOGRAPHY.label,
                color: colors.textTertiary,
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
