/**
 * Checkout Cancel — Deep-Link Return Handler
 *
 * Handles the algorithmlens://checkout/cancel deep link when a user
 * cancels Stripe Checkout in the system browser.
 *
 * Simply navigates back to the settings screen.
 */

import { useEffect } from 'react';
import { View, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { GL_TYPOGRAPHY } from '../../src/lib/gluestackTheme';
import { SPACING } from '../../src/lib/theme';
import { Text } from '../../src/components/glue';

export default function CheckoutCancelScreen() {
  const { colors } = useTheme();

  useEffect(() => {
    // Navigate back to settings — the user cancelled checkout.
    // Using replace so pressing back doesn't return to this transient screen.
    router.replace('/(tabs)/settings');
  }, []);

  // Render a brief loading state for accessibility
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ alignItems: 'center', gap: SPACING.lg }}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
        <Text
          variant="body"
          color={colors.textMuted}
          accessibilityRole="header"
        >
          Returning to settings...
        </Text>
      </View>
    </SafeAreaView>
  );
}
