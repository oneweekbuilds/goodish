/**
 * Checkout Cancel — Deep-Link Return Handler
 *
 * Handles the algorithmlens://checkout/cancel deep link when a user
 * cancels Stripe Checkout in the system browser.
 *
 * Simply navigates back to the settings screen.
 */

import { useEffect } from 'react';
import { router } from 'expo-router';

export default function CheckoutCancelScreen() {
  useEffect(() => {
    // Navigate back to settings — the user cancelled checkout.
    // Using replace so pressing back doesn't return to this transient screen.
    router.replace('/(tabs)/settings');
  }, []);

  // Render nothing — this is a transient redirect screen
  return null;
}
