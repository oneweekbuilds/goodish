import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PaywallModal from '../../components/plan/PaywallModal';
import { track } from '../analytics/analyticsClient';
import { EVENTS } from '../analytics/events';
import { getCurrentPlanTier } from './planTier';

/**
 * PaywallProvider - Global PaywallModal management
 *
 * Provides a single PaywallModal instance managed at app level.
 * Allows any component to open the paywall with a source tracking string.
 *
 * API:
 * - openPaywall(source: string) - Opens paywall with analytics source
 * - closePaywall() - Closes paywall
 *
 * Usage:
 * const { openPaywall } = usePaywall();
 * openPaywall('plus_page_primary');
 *
 * Analytics:
 * - Tracks paywall_viewed when modal opens (once per session)
 * - Respects demo mode isolation (no events when ?demo=1)
 */

const PaywallContext = createContext(null);

export const PaywallProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState('');
  const paywallViewedRef = useRef(false);

  // Check for demo mode
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';

  // Get plan tier for analytics
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const planTier = useMemo(
    () => getCurrentPlanTier(isDemoMode, searchParams),
    [isDemoMode, searchParams]
  );

  const openPaywall = useCallback((sourceString) => {
    setSource(sourceString || '');
    setIsOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsOpen(false);
    setSource('');
  }, []);

  const handleStartTrial = useCallback((params) => {
    // Placeholder for future Stripe integration
    console.log('Trial started:', params);
    closePaywall();
  }, [closePaywall]);

  // Track paywall viewed when modal opens (fire once per session, skip in demo mode)
  useEffect(() => {
    if (isOpen && !isDemoMode && source && !paywallViewedRef.current) {
      track(EVENTS.PAYWALL_VIEWED, {
        source,
        planTier,
        isDemo: false,
      });
      paywallViewedRef.current = true;
    }

    // Reset the ref when modal closes
    if (!isOpen && paywallViewedRef.current) {
      paywallViewedRef.current = false;
    }
  }, [isOpen, isDemoMode, source, planTier]);

  return (
    <PaywallContext.Provider value={{ openPaywall, closePaywall }}>
      {children}
      <PaywallModal
        open={isOpen}
        onClose={closePaywall}
        onStartTrial={handleStartTrial}
        source={source}
      />
    </PaywallContext.Provider>
  );
};

export const usePaywall = () => {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error('usePaywall must be used within PaywallProvider');
  }
  return context;
};
