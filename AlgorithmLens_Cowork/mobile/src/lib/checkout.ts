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
 * The deep-link scheme is "algorithmlens://" (configured in app.config.ts).
 *
 * BACKEND REQUIREMENT:
 * The endpoint POST /api/stripe/create-checkout must exist on the backend
 * (Vercel serverless function at api/stripe/create-checkout.js). It must:
 *   - Accept: { billingCycle: 'monthly' | 'annual', successUrl: string, cancelUrl: string }
 *   - Create a Stripe Checkout Session with trial_period_days: 14
 *   - Return: { sessionId: string, url: string }
 *   - The `url` field is the Stripe-hosted checkout page URL
 *
 * When successUrl/cancelUrl are deep links (algorithmlens://...), Stripe
 * will redirect the browser there after payment, which the OS routes
 * back into the app.
 */

import { Linking, Alert } from 'react-native';
import { api } from './api';
import { captureError, addBreadcrumb } from './sentry';
import { showAppError } from './errorHandler';

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

/** Maps mobile plan names to the billingCycle values the backend expects. */
const PLAN_TO_BILLING_CYCLE: Record<PlanType, string> = {
  monthly: 'monthly',
  annual: 'annual',
};

/**
 * Response shape from POST /api/stripe/create-checkout.
 * Must match the web app's backend contract.
 */
interface CheckoutSessionResponse {
  /** Stripe Checkout session ID. */
  sessionId: string;
  /** Stripe-hosted checkout page URL — opened in the system browser on mobile. */
  url: string;
}

/**
 * Start a Stripe Checkout session for the given plan.
 *
 * Requests a checkout session from the backend, then opens the checkout URL
 * in the system browser. The backend creates the session with deep-link
 * success/cancel URLs so the user returns to the app after payment.
 *
 * Uses the same endpoint as the web app (/api/stripe/create-checkout) so
 * a single backend function serves both platforms.
 *
 * @param plan - 'monthly' or 'annual'
 * @throws If the backend request fails or the browser cannot be opened.
 */
export async function startCheckout(plan: PlanType): Promise<void> {
  addBreadcrumb('checkout', 'Starting checkout', { plan });

  try {
    const data: CheckoutSessionResponse = await api.post(
      '/api/stripe/create-checkout',
      {
        billingCycle: PLAN_TO_BILLING_CYCLE[plan],
        successUrl: DEEP_LINK_SUCCESS,
        cancelUrl: DEEP_LINK_CANCEL,
      }
    );

    if (!data.url) {
      throw new Error('No checkout URL returned from server');
    }

    addBreadcrumb('checkout', 'Checkout session created', {
      plan,
      sessionId: data.sessionId,
    });

    // Open in system browser — NOT a WebView.
    // The system browser handles Stripe's 3D Secure, Apple Pay, etc. correctly.
    const canOpen = await Linking.canOpenURL(data.url);
    if (!canOpen) {
      throw new Error('Cannot open checkout URL');
    }

    await Linking.openURL(data.url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not start checkout. Please try again.';

    // C-04 FIX: Translate raw network errors into user-friendly messages
    let userMessage = message;
    if (message.includes('Network request failed') || message.includes('network')) {
      userMessage =
        'Unable to connect to payment server. Please check your internet connection and try again.';
    } else if (message.includes('timeout') || message.includes('abort')) {
      userMessage =
        'The payment server took too long to respond. Please try again in a moment.';
    } else if (message.includes('API POST') && message.includes('failed')) {
      userMessage =
        'The payment server returned an error. Please try again or contact support if the issue persists.';
    }

    captureError(err instanceof Error ? err : new Error(message), 'checkout:stripe', { plan });
    // Let the calling component (UpgradeModal) handle error display via its inline error state.
    // Previously showAppError was called here, but it created a native Alert that appeared behind
    // the Modal, making the button look unresponsive. The UpgradeModal now shows inline errors.
    throw new Error(userMessage);
  }
}

/**
 * @deprecated H-16 FIX: Use UpgradeModal component instead.
 * This function used a generic native Alert which was unbranded
 * and unsuitable for the critical revenue conversion moment.
 */
export function _legacyPlanSelection(): void {
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
