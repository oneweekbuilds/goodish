/**
 * Scan picker. Top-level Stack route that replaces the legacy hidden
 * /(tabs)/scan tab and the PlatformBottomSheet modal. Renders a vertical
 * stack of PlatformTile rows; tapping a tile selects it, the bottom CTA
 * navigates to /broadcast/[platform]. A secondary text link routes to
 * /scanner/[platform] for the legacy Precision Mode flow.
 *
 * Platform is preselected on mount (Instagram) so the primary CTA is
 * meaningfully labeled from the start. This is a conservative call;
 * flag if you'd rather start with no selection.
 */
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PlatformTile, PrimaryButton } from '../src/design-system';
import {
  colors,
  layout,
  spacing,
  type,
} from '../src/design-tokens/tokens';
import { platformName } from '../src/lib/platformLabels';

const PLATFORMS = [
  'instagram',
  'twitter',
  'youtube',
  'tiktok',
  'facebook',
  'reddit',
];

const DEFAULT_PLATFORM = 'instagram';

export default function ScanPickerScreen() {
  const [selected, setSelected] = useState<string>(DEFAULT_PLATFORM);

  const handleBroadcast = useCallback(() => {
    router.push({
      pathname: '/broadcast/[platform]',
      params: { platform: selected },
    });
  }, [selected]);

  const handlePrecision = useCallback(() => {
    router.push({
      pathname: '/scanner/[platform]',
      params: { platform: selected },
    });
  }, [selected]);

  const selectedName = platformName(selected) || selected;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPaddingX,
          paddingTop: layout.screenPaddingY,
          paddingBottom: spacing.s10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontSize: type.display.fontSize,
            lineHeight: type.display.lineHeight,
            fontWeight: type.display.fontWeight,
            letterSpacing: type.display.letterSpacing,
            color: colors.textPrimary,
          }}
        >
          Scan your feed
        </Text>
        <Text
          style={{
            fontSize: type.body.fontSize,
            lineHeight: type.body.lineHeight,
            fontWeight: type.body.fontWeight,
            color: colors.textSecondary,
            marginTop: spacing.s1,
          }}
        >
          Choose a platform
        </Text>

        <View style={{ marginTop: spacing.s7, gap: spacing.s2 }}>
          {PLATFORMS.map((p) => (
            <PlatformTile
              key={p}
              platform={p}
              selected={selected === p}
              onPress={() => setSelected(p)}
            />
          ))}
        </View>

        <View style={{ marginTop: spacing.s7 }}>
          <PrimaryButton
            label={`Scan ${selectedName}`}
            onPress={handleBroadcast}
          />
          <Pressable
            onPress={handlePrecision}
            accessibilityRole="button"
            accessibilityLabel="Use the built-in browser instead"
            style={({ pressed }) => ({
              alignSelf: 'center',
              marginTop: spacing.s4,
              paddingVertical: spacing.s2,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{
                fontSize: type.body.fontSize,
                lineHeight: type.body.lineHeight,
                fontWeight: type.body.fontWeight,
                color: colors.brandPrimary,
              }}
            >
              Use the built-in browser instead
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

