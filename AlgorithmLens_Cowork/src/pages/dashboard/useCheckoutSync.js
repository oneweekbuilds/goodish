import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLAN_TIERS, setStoredPlanTier } from '../../lib/plan';
import { fetchEntitlements } from '../../lib/plan/entitlements';
import { authenticatedFetch } from '../../lib/api/authenticatedFetch';
import { getApiBaseUrl } from '../../lib/apiConfig';
import { logError, logWarning } from '../../lib/errorLogger.js';

/**
 * useCheckoutSync - Handles checkout success state and entitlements polling
 *
 * Detects checkout=success query param, marks plan tier as Plus, and polls
 * backend to confirm entitlements are updated.
 *
 * Returns: { checkoutSuccess, setCheckoutSuccess, checkoutErrorMessage }
 */
const useCheckoutSync = ({ authReady, isDemoMode, setPlanTier }) => {
  const navigate = useNavigate();
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState(null);
  const checkoutSyncedRef = useRef(false);

  useEffect(() => {
    if (checkoutSyncedRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hasCheckoutSuccess = params.get('checkout') === 'success';

    if (!hasCheckoutSuccess) {
      return;
    }

    if (isDemoMode) {
      checkoutSyncedRef.current = true;
      params.delete('checkout');
      const newSearch = params.toString();
      navigate({
        search: newSearch ? `?${newSearch}` : '',
      }, { replace: true });
      return;
    }

    if (!authReady) {
      return;
    }

    checkoutSyncedRef.current = true;

    setStoredPlanTier(PLAN_TIERS.PLUS);
    setPlanTier(PLAN_TIERS.PLUS);
    setCheckoutSuccess('plus_unlocked');

    const syncEntitlements = async () => {
      try {
        const apiBase = getApiBaseUrl();
        try {
          const verifyResponse = await authenticatedFetch(`${apiBase}/api/stripe/verify-checkout`, {
            method: 'POST',
          });
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.is_plus) {
              return;
            }
          }
        } catch (networkErr) {
          logWarning('useCheckoutSync', '[checkout] Backend unreachable for verify-checkout, using optimistic activation:', networkErr);
          return;
        }

        const delays = [2000, 4000, 8000];
        for (let attempt = 0; attempt < delays.length; attempt++) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          try {
            const entitlements = await fetchEntitlements();
            if (entitlements && entitlements.is_plus) {
              return;
            }
          } catch {
            return;
          }
        }

        logWarning('useCheckoutSync', '[checkout] Backend could not confirm Plus yet, keeping optimistic activation');

      } catch (err) {
        logError('useCheckoutSync', '[checkout] Unexpected error during sync:', err);
      } finally {
        params.delete('checkout');
        const newSearch = params.toString();
        navigate({
          search: newSearch ? `?${newSearch}` : '',
        }, { replace: true });
      }
    };

    syncEntitlements();
  }, [authReady, isDemoMode, navigate, setPlanTier]);

  return { checkoutSuccess, setCheckoutSuccess, checkoutErrorMessage };
};

export default useCheckoutSync;
