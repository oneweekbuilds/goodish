/**
 * RevenueCat Service — Native IAP Integration
 *
 * MOCK: Replace with RevenueCat when API keys are configured.
 *
 * This module provides a consistent interface for in-app purchase operations.
 * When EXPO_PUBLIC_REVENUECAT_IOS_API_KEY or EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
 * are present in .env, this should be replaced with the real RevenueCat SDK
 * (react-native-purchases). Until then, this mock implementation uses AsyncStorage
 * to simulate purchase state for development and testing.
 *
 * Interface contract (same for mock and real):
 * - initRevenueCat(userId?) — SDK initialization
 * - checkPlusStatus() — checks for "plus" entitlement
 * - presentPaywall() — shows paywall UI
 * - restorePurchases() — restore for reinstalls
 * - getOfferings() — fetch current subscription offerings
 * - getSubscriptionSource() — returns 'app_store' | 'stripe' | 'none'
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { addBreadcrumb } from '../lib/sentry';

// AsyncStorage keys for mock state
const MOCK_PLUS_KEY = '@algorithmlens_mock_plus_status';
const MOCK_SOURCE_KEY = '@algorithmlens_mock_sub_source';

/** Result from presenting the paywall */
export type PaywallResult = 'purchased' | 'cancelled' | 'error';

/** Subscription source for "Manage Subscription" routing */
export type SubscriptionSource = 'app_store' | 'stripe' | 'none';

/** Offering shape (matches RevenueCat SDK offering structure) */
export interface Offering {
  identifier: string;
  /** Display name for the offering */
  serverDescription: string;
  packages: Package[];
}

export interface Package {
  identifier: string;
  /** e.g. '$rc_monthly', '$rc_annual' */
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    priceString: string;
  };
}

/** Whether the service is running in mock mode */
export const IS_MOCK_MODE = true;

// MOCK: Replace with RevenueCat when API keys are configured

/**
 * Initialize RevenueCat SDK.
 * In mock mode: no-op, just logs initialization.
 * In real mode: would call Purchases.configure() with the platform API key.
 *
 * @param userId - Supabase user ID for cross-platform identity
 */
export async function initRevenueCat(userId?: string): Promise<void> {
  addBreadcrumb('revenueCat', 'Initialized (mock mode)', { userId });
  if (__DEV__) {
    console.log('[RevenueCat Mock] Initialized', userId ? `for user ${userId}` : '(anonymous)');
  }
}

/**
 * Check if the user has an active "plus" entitlement.
 * In mock mode: reads from AsyncStorage (default: false).
 * In real mode: would call Purchases.getCustomerInfo() and check entitlements.
 *
 * @returns true if the user has Plus status via IAP
 */
export async function checkPlusStatus(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(MOCK_PLUS_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Present the paywall to the user.
 * In mock mode: resolves with a special value that tells the UpgradeModal
 * to show a "Simulate Purchase" dev button instead of real IAP.
 * In real mode: would call RevenueCatUI.presentPaywall() or show offerings.
 *
 * @returns 'purchased' if user completed purchase, 'cancelled' if dismissed, 'error' on failure
 */
export async function presentPaywall(): Promise<PaywallResult> {
  // In mock mode, the UpgradeModal handles the UI.
  // This function is called to signal that the paywall should be shown.
  // The actual mock purchase logic is in simulatePurchase().
  addBreadcrumb('revenueCat', 'Present paywall (mock mode)');
  // Return 'cancelled' because the modal handles everything
  // and will call simulatePurchase() directly if the user taps the dev button.
  return 'cancelled';
}

/**
 * Simulate a purchase in mock mode (dev only).
 * Sets the mock Plus status in AsyncStorage.
 *
 * @param purchased - Whether to set Plus as active or inactive
 */
export async function simulatePurchase(purchased: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(MOCK_PLUS_KEY, purchased ? 'true' : 'false');
    await AsyncStorage.setItem(MOCK_SOURCE_KEY, purchased ? 'app_store' : 'none');
    addBreadcrumb('revenueCat', `Mock purchase ${purchased ? 'activated' : 'deactivated'}`);
    if (__DEV__) {
      console.log(`[RevenueCat Mock] Plus status set to ${purchased}`);
    }
  } catch (err) {
    if (__DEV__) {
      console.warn('[RevenueCat Mock] Failed to save mock purchase state:', err);
    }
  }
}

/**
 * Restore purchases for reinstalls.
 * In mock mode: returns current mock status from AsyncStorage.
 * In real mode: would call Purchases.restorePurchases().
 *
 * @returns true if Plus entitlement was restored
 */
export async function restorePurchases(): Promise<boolean> {
  addBreadcrumb('revenueCat', 'Restore purchases (mock mode)');
  return checkPlusStatus();
}

/**
 * Fetch current subscription offerings.
 * In mock mode: returns a static set of mock offerings matching the Stripe plans.
 * In real mode: would call Purchases.getOfferings().
 *
 * @returns Current offerings, or null if unavailable
 */
export async function getOfferings(): Promise<Offering | null> {
  // MOCK: Return static offerings that match the current Stripe pricing
  return {
    identifier: 'default',
    serverDescription: 'AlgorithmLens Plus',
    packages: [
      {
        identifier: '$rc_annual',
        packageType: 'ANNUAL',
        product: {
          identifier: 'com.algorithmlens.plus.annual',
          title: 'AlgorithmLens Plus (Annual)',
          description: 'Full access to all premium features',
          priceString: '$96.00/year',
        },
      },
      {
        identifier: '$rc_monthly',
        packageType: 'MONTHLY',
        product: {
          identifier: 'com.algorithmlens.plus.monthly',
          title: 'AlgorithmLens Plus (Monthly)',
          description: 'Full access to all premium features',
          priceString: '$10.00/month',
        },
      },
    ],
  };
}

/**
 * Get the source of the user's subscription.
 * Used by Settings to determine whether to show App Store management
 * or Stripe billing portal.
 *
 * In mock mode: reads from AsyncStorage.
 * In real mode: would check RevenueCat customer info store.
 *
 * @returns 'app_store' if subscribed via IAP, 'stripe' if via web, 'none' if not subscribed
 */
export async function getSubscriptionSource(): Promise<SubscriptionSource> {
  try {
    const source = await AsyncStorage.getItem(MOCK_SOURCE_KEY);
    if (source === 'app_store' || source === 'stripe') {
      return source;
    }
    return 'none';
  } catch {
    return 'none';
  }
}

/**
 * Reset mock state (for testing/development).
 */
export async function resetMockState(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([MOCK_PLUS_KEY, MOCK_SOURCE_KEY]);
    if (__DEV__) {
      console.log('[RevenueCat Mock] State reset');
    }
  } catch {
    // Non-blocking
  }
}
