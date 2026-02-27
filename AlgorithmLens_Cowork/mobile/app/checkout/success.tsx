/**
 * Checkout Success — Deep-Link Return Handler
 *
 * Handles the algorithmlens://checkout/success deep link after a user
 * completes Stripe Checkout in the system browser.
 *
 * Flow:
 * 1. Stripe redirects to algorithmlens://checkout/success
 * 2. Expo Router opens this screen
 * 3. We refresh entitlements from the backend
 * 4. Show a success state with trial info
 * 5. Navigate to the dashboard
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../src/lib/theme';
import { Check } from 'lucide-react-native';
import { triggerNotificationSuccess } from '../../src/lib/haptics';

// Navigation delay after successful checkout (ms)
const CHECKOUT_SUCCESS_REDIRECT_DELAY_MS = 2500;

export default function CheckoutSuccessScreen() {
  const { refreshEntitlements, subscription } = useAuth();
  const { colors, shadows } = useTheme();
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const syncAndRedirect = async () => {
      try {
        // Re-fetch entitlements from backend to pick up the new subscription
        await refreshEntitlements();
      } catch (err) {
        if (__DEV__) {
          console.warn('Post-checkout entitlements refresh failed:', err);
        }
        // Not blocking — entitlements will sync on next app open
      }

      if (!mounted) return;
      setSyncing(false);
      triggerNotificationSuccess();

      // Auto-navigate to dashboard after a brief success display
      setTimeout(() => {
        if (mounted) {
          router.replace('/(tabs)');
        }
      }, CHECKOUT_SUCCESS_REDIRECT_DELAY_MS);
    };

    syncAndRedirect();
    return () => { mounted = false; };
  }, [refreshEntitlements]);

  const trialDays = subscription?.trial_days_remaining;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage, justifyContent: 'center', alignItems: 'center' }}>
      {syncing ? (
        <View style={{ alignItems: 'center', gap: SPACING.lg }}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted }}>
            Activating your subscription...
          </Text>
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingHorizontal: SPACING['3xl'], gap: SPACING.lg }}>
          {/* Success icon */}
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: colors.green50,
            justifyContent: 'center', alignItems: 'center',
            ...shadows.soft,
          }}>
            <Check size={32} color={colors.accentGreen} strokeWidth={2.5} />
          </View>

          <Text style={{ ...TYPOGRAPHY.heroTitle, color: colors.textMain, textAlign: 'center' }}>
            Welcome to Plus
          </Text>

          <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
            {trialDays && trialDays > 0
              ? `Your ${trialDays}-day free trial has started. You won't be charged until the trial ends.`
              : 'Your subscription is active. Trend analysis and premium features are now unlocked.'
            }
          </Text>

          <Text style={{ ...TYPOGRAPHY.small, color: colors.textSecondary, textAlign: 'center' }}>
            Redirecting to your dashboard...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
