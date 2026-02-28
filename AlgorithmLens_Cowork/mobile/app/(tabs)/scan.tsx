/**
 * Scan Tab — Precision Mode Entry Point
 *
 * This is the existing WebView-based scanning flow, now rebranded as
 * "Precision Mode." It's accessed from the Home screen's platform picker
 * when the user selects Precision mode, or directly via navigation.
 *
 * The tab is hidden from the tab bar (href: null in _layout.tsx) but
 * the route remains accessible for programmatic navigation.
 */

import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { triggerImpactLight } from '../../src/lib/haptics';
import { Instagram, Youtube, Music, Facebook, MessageCircle, Type } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { GL_TYPOGRAPHY } from '../../src/lib/gluestackTheme';
import { SPACING, RADIUS, PLATFORMS, MIN_TOUCH_TARGET } from '../../src/lib/theme';
import { Text } from '../../src/components/glue';
import { XPlatformIcon } from '../../src/components/icons/XPlatformIcon';

const PLATFORM_ICONS: Record<string, React.FC<{ size: number; color: string; strokeWidth?: number }>> = {
  instagram: Instagram,
  twitter: XPlatformIcon,
  youtube: Youtube,
  tiktok: Music,
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
  const { colors, shadows } = useTheme();

  const handlePlatformSelect = (platform: string) => {
    triggerImpactLight();
    router.push({
      pathname: '/scanner/[platform]',
      params: { platform },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <ScrollView
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING['6xl'] }}
      >
        {/* Header */}
        <View style={{ marginBottom: SPACING.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: RADIUS.lg,
                backgroundColor: colors.blue50,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Type size={14} color={colors.primaryBlue} strokeWidth={2} />
            </View>
            <Text
              variant="h1"
              color={colors.textMain}
              accessibilityRole="header"
            >
              Precision Mode
            </Text>
          </View>
          <Text
            variant="body"
            color={colors.textMuted}
          >
            Text-only analysis using the built-in browser. Choose a platform to scan.
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
                accessibilityRole="button"
                accessibilityLabel={`Scan ${platform.name} with Precision Mode`}
                style={{
                  width: '48%',
                  backgroundColor: colors.bgCard,
                  borderRadius: RADIUS.lg,
                  padding: SPACING.lg,
                  minHeight: MIN_TOUCH_TARGET,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.primaryBlue,
                  ...shadows.soft,
                }}
              >
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
                  variant="h3"
                  color={colors.textMain}
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
            variant="label"
            color={colors.textSecondary}
            align="center"
            style={{ lineHeight: 20 }}
          >
            Precision Mode scrolls through the built-in browser for text-only analysis. For richer insights including video and image content, use Broadcast mode from the Home screen.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
