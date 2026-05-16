/**
 * Settings tab. iOS grouped-list surface composed of four sections plus
 * a Goodish attribution footer:
 *
 *   1. Scans   (Default platform, Default scan duration)
 *   2. Privacy (Frame retention, Diagnostics)
 *   3. Data    (Manage your data)
 *   4. About   (How AlgorithmLens works, Terms and privacy, Open source
 *              notices, Version, Sign out)
 *
 * All rows except Version and Sign out are disabled in this pass: their
 * picker / sub-page destinations are not yet wired. Each disabled row that
 * displays a value carries the `TODO(settings-persistence)` marker so the
 * eventual useUserPreferences wiring can be located by grep.
 *
 * Sign out is the one interactive-affordance use of brand blue on this
 * surface; it triggers a native confirmation Alert before delegating to
 * useAuth.signOut.
 */
import React, { useCallback } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  Card,
  SettingsRow,
  SettingsSectionHeader,
} from '../../src/design-system';
import {
  colors,
  layout,
  spacing,
  type,
} from '../../src/design-tokens/tokens';
import { useAuth } from '../../src/context/AuthContext';

const APP_VERSION = Constants.expoConfig?.version ?? 'Unknown';

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const confirmSignOut = useCallback(() => {
    Alert.alert(
      'Sign out?',
      "You'll need to sign back in to scan.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch {
              Alert.alert('Error', 'Could not sign out. Please try again.');
            }
          },
        },
      ],
    );
  }, [signOut]);

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
          Settings
        </Text>

        <View style={{ marginTop: spacing.s7 }}>
          <SettingsSectionHeader title="Scans" />
          <Card padding={0}>
            {/* TODO(settings-persistence): wire to useUserPreferences when picker sub-pages ship */}
            <SettingsRow label="Default platform" value="Facebook" disabled />
            <Hairline />
            {/* TODO(settings-persistence): wire to useUserPreferences when picker sub-pages ship */}
            <SettingsRow label="Default scan duration" value="2 min" disabled />
          </Card>
        </View>

        <View style={{ marginTop: spacing.s7 }}>
          <SettingsSectionHeader title="Privacy" />
          <Card padding={0}>
            {/* TODO(settings-persistence): wire to useUserPreferences when picker sub-pages ship */}
            <SettingsRow label="Frame retention" value="7 days" disabled />
            <Hairline />
            {/* TODO(settings-persistence): wire to useUserPreferences when picker sub-pages ship */}
            <SettingsRow
              label="Diagnostics"
              subtitle="Anonymous error reports only"
              value="On"
              disabled
            />
          </Card>
        </View>

        <View style={{ marginTop: spacing.s7 }}>
          <SettingsSectionHeader title="Data" />
          <Card padding={0}>
            <SettingsRow
              label="Manage your data"
              subtitle="Export, delete scans, delete account"
              disabled
            />
          </Card>
        </View>

        <View style={{ marginTop: spacing.s7 }}>
          <SettingsSectionHeader title="About" />
          <Card padding={0}>
            <SettingsRow label="How AlgorithmLens works" disabled />
            <Hairline />
            <SettingsRow label="Terms and privacy" disabled />
            <Hairline />
            <SettingsRow label="Open source notices" disabled />
            <Hairline />
            <SettingsRow
              label="Version"
              value={APP_VERSION}
              showChevron={false}
            />
            <Hairline />
            <SettingsRow
              label="Sign out"
              labelColor="brand"
              showChevron={false}
              onPress={confirmSignOut}
            />
          </Card>
        </View>

        <Text
          style={{
            fontSize: type.caption.fontSize,
            lineHeight: type.caption.lineHeight,
            fontWeight: type.caption.fontWeight,
            color: colors.textTertiary,
            textAlign: 'center',
            paddingTop: spacing.s6,
          }}
        >
          Part of Goodish
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Hairline separator drawn between rows inside a Card. Left-inset matches
 * SettingsRow's internal horizontal padding so the line begins at the row
 * label's x-position and flushes to the card's right edge, per iOS
 * grouped-list convention.
 */
function Hairline() {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginLeft: spacing.s4,
      }}
    />
  );
}
