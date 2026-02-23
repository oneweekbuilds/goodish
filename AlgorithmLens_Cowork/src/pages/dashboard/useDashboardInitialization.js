import { useState, useEffect, useMemo } from 'react';
import { PLAN_TIERS, setStoredPlanTier } from '../../lib/plan';
import { fetchEntitlements } from '../../lib/plan/entitlements';
import { logWarning } from '../../lib/errorLogger.js';

/**
 * useDashboardInitialization - Initializes plan tier and entitlements
 *
 * Handles:
 * - Demo mode detection
 * - Initial plan tier state
 * - Entitlements syncing from backend
 *
 * Returns: { isDemoMode, planTier, setPlanTier }
 */
const useDashboardInitialization = ({ authReady }) => {
  // Check for demo mode via ?demo=1 query parameter
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';

  // Plan tier state (foundation for gating, not yet enforced)
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);

  const [planTier, setPlanTier] = useState(() => {
    const { getCurrentPlanTier } = require('../../lib/plan');
    const tier = getCurrentPlanTier(isDemoMode, searchParams);
    return isDemoMode && tier === PLAN_TIERS.PLUS ? PLAN_TIERS.FREE : tier;
  });

  // Re-sync planTier from backend when auth becomes ready
  useEffect(() => {
    if (!authReady || isDemoMode) return;

    let cancelled = false;
    const sync = async () => {
      try {
        const entitlements = await fetchEntitlements();
        if (cancelled) return;
        if (entitlements && entitlements.is_plus) {
          setStoredPlanTier(PLAN_TIERS.PLUS);
          setPlanTier(PLAN_TIERS.PLUS);
        }
      } catch (err) {
        logWarning('useDashboardInitialization', '[DashboardPage] Entitlements sync failed:', err);
      }
    };
    sync();
    return () => { cancelled = true; };
  }, [authReady, isDemoMode]);

  return { isDemoMode, planTier, setPlanTier };
};

export default useDashboardInitialization;
