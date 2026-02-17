import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Instagram, Twitter, Youtube, Clapperboard, Facebook, MessageCircle } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, PLATFORMS } from '../../src/lib/theme';

// M8: Platform icons
const PLATFORM_ICONS: Record<string, React.FC<{ size: number; color: string; strokeWidth?: number }>> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Clapperboard,
  facebook: Facebook,
  reddit: MessageCircle,
};

const PLATFORM_LIST = [
  { slug: 'instagram', ...PLATFORMS.instagram },
  { slug: 'twitter', ...PLATFORMS.twitter },
  { slug: 'youtube', ...PLATFORMS.youtube },
  { slug: 'tiktok', ...PLATFORMS.tiktok },
  { slug: 'facebook', ...PLATFORMS.facebook },
  { slug: 'reddit', ...PLATFORMS.reddit },
];

export default function ScanScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const handlePlatformSelect = (platform: string) => {
    // M2 & M6: Haptic feedback
    Haptics.selectionAsync();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/scanner/[platform]',
      params: { platform },
    });
  };

  // L5: Pull-to-refresh (just a visual refresh since this is a static screen)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 400));
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgPage }}>
      <ScrollView
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: SPACING.lg }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryBlue} />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: SPACING['3xl'] }}>
          <Text
            style={{
              ...TYPOGRAPHY.heroTitle,
              fontSize: 24,
              color: COLORS.textMain,
              marginBottom: 6,
            }}
          >
            Start a Scan
          </Text>
          <Text
            style={{
              ...TYPOGRAPHY.body,
              color: COLORS.textMuted,
            }}
          >
            Choose a platform to analyze your feed
          </Text>
        </View>

        {/* Platform Grid — 2 columns */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
          {PLATFORM_LIST.map((platform) => {
            const IconComponent = PLATFORM_ICONS[platform.slug];
            return (
              <TouchableOpacity
                key={platform.slug}
                onPress={() => handlePlatformSelect(platform.slug)}
                activeOpacity={0.7}
                style={{
                  width: '48%',
                  backgroundColor: COLORS.bgCard,
                  borderRadius: RADIUS.lg,
                  padding: SPACING.lg,
                  borderWidth: 1,
                  borderColor: COLORS.borderLight,
                  borderLeftWidth: 3,
                  borderLeftColor: COLORS.accentGreen,
                  ...SHADOWS.soft,
                }}
              >
                {/* M8: Platform icon with tinted background */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.sm,
                    backgroundColor: `${platform.color}14`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: SPACING.md,
                  }}
                >
                  {IconComponent && (
                    <IconComponent size={20} color={platform.color} strokeWidth={1.8} />
                  )}
                </View>
                <Text
                  style={{
                    ...TYPOGRAPHY.h3,
                    color: COLORS.textMain,
                  }}
                >
                  {platform.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom note */}
        <View style={{ marginTop: SPACING['3xl'], paddingBottom: SPACING.xl }}>
          <Text
            style={{
              ...TYPOGRAPHY.label,
              color: COLORS.textSecondary,
              textAlign: 'center',
            }}
          >
            Just scroll your feed like you normally would. AlgorithmLens quietly captures what appears. When you've scrolled enough, tap Done.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
