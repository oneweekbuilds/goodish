/**
 * Stripe Checkout — Mobile Deep-Link Flow
 *
 * Opens Stripe Checkout in the system browser (not a WebView) with return URLs
 * that deep-link back to the app. This is the recommended mobile pattern:
 *
 * 1. App requests a Checkout Session from the backend
 * 2. Backend creates a Stripe Checkout Session with deep-link success/cancel URLs
 * 3. App opens the checkout URL in the system browser
 * 4. User completes payment in the browser
 * 5. Stripe redirects to the deep-link URL
 * 6. OS routes the deep link back to the app
 * 7. App refreshes entitlements and shows success/cancel state
 *
 * The deep-link scheme is "algorithmlens://" (configured in app.json).
 */

import { Linking, Alert } from 'react-native';
import { api } from './api';
import { captureError, addBreadcrumb } from './sentry';

/** Deep-link URLs that Stripe will redirect to after checkout. */
const DEEP_LINK_SUCCESS = 'algorithmlens://checkout/success';
const DEEP_LINK_CANCEL = 'algorithmlens://checkout/cancel';

export type PlanType = 'monthly' | 'annual';

/**
 * Plan display labels — kept in one place so they update alongside
 * Stripe pricing changes. Prices here are display-only; Stripe is
 * the source of truth for actual charges.
 */
const PLAN_LABELS: Record<PlanType, string> = {
  monthly: 'Monthly — $10/month',
  annual: 'Annual — $96/year (save 20%)',
};

interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

/**
 * Start a Stripe Checkout session for the given plan.
 *
 * Requests a checkout session from the backend, then opens the checkout URL
 * in the system browser. The backend creates the session with deep-link
 * success/cancel URLs so the user returns to the app after payment.
 *
 * @param plan - 'monthly' or 'annual'
 * @throws If the backend request fails or the browser cannot be opened.
 */
export async function startCheckout(plan: PlanType): Promise<void> {
  try {
    const data: CheckoutSessionResponse = await api.post(
      '/api/stripe/create-checkout-session',
      {
        plan_type: plan,
        success_url: DEEP_LINK_SUCCESS,
        cancel_url: DEEP_LINK_CANCEL,
      }
    );

    if (!data.checkout_url) {
      throw new Error('No checkout URL returned from server');
    }

    // Open in system browser — NOT a WebView.
    // The system browser handles Stripe's 3D Secure, Apple Pay, etc. correctly.
    const canOpen = await Linking.canOpenURL(data.checkout_url);
    if (!canOpen) {
      throw new Error('Cannot open checkout URL');
    }

    await Linking.openURL(data.checkout_url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not start checkout. Please try again.';
    captureError(err instanceof Error ? err : new Error(message), 'checkout:stripe', { plan });
    Alert.alert('Checkout Error', message);
    throw err;
  }
}

/**
 * Present plan selection and start checkout.
 *
 * Shows an Alert with monthly/annual options, then starts checkout
 * for the selected plan.
 */
export function presentPlanSelection(): void {
  Alert.alert('Choose Your Plan', 'Both plans include a 14-day free trial.', [
    {
      text: PLAN_LABELS.monthly,
      onPress: () => startCheckout('monthly'),
    },
    {
      text: PLAN_LABELS.annual,
      onPress: () => startCheckout('annual'),
    },
    {
      text: 'Cancel',
      style: 'cancel',
    },
  ]);
}
