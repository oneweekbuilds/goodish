import React from 'react';
import { CheckCircle, Sparkles, X } from 'lucide-react';
import { PLAN_TIERS, setStoredPlanTier } from '../../lib/plan';
import { fetchEntitlements } from '../../lib/plan/entitlements';
import { authenticatedFetch } from '../../lib/api/authenticatedFetch';
import { getApiBaseUrl } from '../../lib/apiConfig';
import { logError } from '../../lib/errorLogger.js';

/**
 * CheckoutBanners - Displays checkout success/pending/error messages
 *
 * Shows when user completes checkout with Plus plan
 */
const CheckoutBanners = ({ checkoutSuccess, setCheckoutSuccess, planTier, setPlanTier }) => {
  if (!checkoutSuccess) return null;

  return (
    <>
      {checkoutSuccess === 'plus_unlocked' && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-900">Plus is unlocked. Trends are now available.</p>
          </div>
          <button
            onClick={() => setCheckoutSuccess(null)}
            className="text-emerald-600 hover:text-emerald-700"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {checkoutSuccess === 'pending' && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Sparkles size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 mb-2">Checkout completed, but Plus is not active yet. Refresh in a moment.</p>
            <button
              onClick={async () => {
                try {
                  const apiBase = getApiBaseUrl();
                  const verifyResponse = await authenticatedFetch(`${apiBase}/api/stripe/verify-checkout`, {
                    method: 'POST',
                  });
                  if (verifyResponse.ok) {
                    const verifyData = await verifyResponse.json();
                    if (verifyData.is_plus) {
                      setStoredPlanTier(PLAN_TIERS.PLUS);
                      setPlanTier(PLAN_TIERS.PLUS);
                      setCheckoutSuccess('plus_unlocked');
                      return;
                    }
                  }
                  const entitlements = await fetchEntitlements();
                  if (entitlements && entitlements.is_plus) {
                    setStoredPlanTier(PLAN_TIERS.PLUS);
                    setPlanTier(PLAN_TIERS.PLUS);
                    setCheckoutSuccess('plus_unlocked');
                  }
                } catch (err) {
                  logError('CheckoutBanners', 'Refresh failed:', err);
                }
              }}
              className="text-xs text-blue-700 hover:text-blue-800 underline"
            >
              Refresh now
            </button>
          </div>
          <button
            onClick={() => setCheckoutSuccess(null)}
            className="text-blue-600 hover:text-blue-700"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
};

export default CheckoutBanners;
