import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePaywall } from '../../lib/plan/PaywallProvider';
import { getStoredSubscriptionStatus } from '../../lib/plan/planTier';

/**
 * PastDueBanner - Shows a warning when the user's payment has failed.
 *
 * B6 fix: When subscription status is "past_due", Stripe is retrying the payment
 * (typically 3 times over ~2 weeks). The user keeps Plus access during this window,
 * but we show this banner so they know to update their payment method.
 *
 * Only renders when subscription status is "past_due".
 */
const PastDueBanner = () => {
  const { openBillingPortal, isPortalLoading } = usePaywall();
  const status = getStoredSubscriptionStatus();

  if (status !== 'past_due') return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3 mb-4">
      <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">
          Your last payment didn't go through.
        </p>
        <p className="text-sm text-amber-700 mt-1">
          Your Plus access is still active while we retry. To avoid interruption, please update your payment method.
        </p>
      </div>
      <button
        onClick={openBillingPortal}
        disabled={isPortalLoading}
        className="text-sm font-semibold text-amber-700 hover:text-amber-900 underline whitespace-nowrap disabled:opacity-50"
      >
        {isPortalLoading ? 'Loading...' : 'Update payment'}
      </button>
    </div>
  );
};

export default PastDueBanner;
