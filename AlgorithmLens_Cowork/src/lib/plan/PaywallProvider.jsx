import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import PaywallModal from '../../components/plan/PaywallModal';
import { track } from '../analytics/analyticsClient';
import { EVENTS } from '../analytics/events';
import { getCurrentPlanTier } from './planTier';
import { authenticatedFetch, isUnauthorized } from '../api/authenticatedFetch';
import { getApiBaseUrl } from '../apiConfig';
import { logError } from '../errorLogger.js';

/**
 * PaywallProvider - Global PaywallModal management
 *
 * Provides a single PaywallModal instance managed at app level.
 * Allows any component to open the paywall with a source tracking string.
 *
 * API:
 * - openPaywall(source: string) - Opens paywall with analytics source
 * - closePaywall() - Closes paywall
 * - openBillingPortal() - Redirects to Stripe Customer Portal for subscription management
 * - isPortalLoading - Boolean, true while portal session is being created
 * - portalError - String or null, error message from portal session creation
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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState('');
  const [checkoutError, setCheckoutError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState(null);
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
    setCheckoutError(null); // Reset error when opening
  }, []);

  const closePaywall = useCallback(() => {
    setIsOpen(false);
    setSource('');
    setCheckoutError(null);
    setIsProcessing(false);
  }, []);

  const handleStartTrial = useCallback(async (params) => {
    const { billingCycle } = params;

    // Demo mode: show message, don't call Stripe
    if (isDemoMode) {
      setCheckoutError('Checkout is disabled in demo mode.');
      return;
    }

    setIsProcessing(true);
    setCheckoutError(null);

    try {
      // Get Stripe publishable key
      const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!stripePublishableKey) {
        setCheckoutError('Stripe is not configured. Please contact support.');
        setIsProcessing(false);
        return;
      }

      // Call backend to create checkout session
      const apiBase = getApiBaseUrl();
      const response = await authenticatedFetch(`${apiBase}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingCycle,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/plus?checkout=canceled`,
        }),
      });

      // Handle 401 Unauthorized
      if (isUnauthorized(response)) {
        closePaywall();
        navigate('/dashboard');
        return;
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setCheckoutError(errorData.detail || 'Failed to start checkout. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Parse response
      const data = await response.json();
      const { sessionId } = data;

      if (!sessionId) {
        setCheckoutError('Invalid checkout session. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Redirect to Stripe Checkout
      const stripe = await loadStripe(stripePublishableKey);
      if (!stripe) {
        setCheckoutError('Failed to load Stripe. Please refresh and try again.');
        setIsProcessing(false);
        return;
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        setCheckoutError(error.message || 'Failed to redirect to checkout. Please try again.');
        setIsProcessing(false);
      }
      // If redirect succeeds, user leaves the page (no need to update state)

    } catch (err) {
      logError('PaywallProvider', err);
      setCheckoutError('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  }, [isDemoMode, closePaywall, navigate]);

  // Open Stripe Billing Portal for subscription management
  const openBillingPortal = useCallback(async () => {
    // Demo mode: no portal access
    if (isDemoMode) {
      setPortalError('Subscription management is not available in demo mode.');
      return;
    }

    setIsPortalLoading(true);
    setPortalError(null);

    try {
      const apiBase = getApiBaseUrl();
      const response = await authenticatedFetch(`${apiBase}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/plus`,
        }),
      });

      // Handle 401 Unauthorized
      if (isUnauthorized(response)) {
        navigate('/dashboard');
        setIsPortalLoading(false);
        return;
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setPortalError(errorData.detail || 'Failed to open subscription management. Please try again.');
        setIsPortalLoading(false);
        return;
      }

      const data = await response.json();
      const { url } = data;

      if (!url) {
        setPortalError('Invalid portal session. Please try again.');
        setIsPortalLoading(false);
        return;
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url;
      // User leaves the page — no need to reset loading state

    } catch (err) {
      logError('PaywallProvider', err);
      setPortalError('An unexpected error occurred. Please try again.');
      setIsPortalLoading(false);
    }
  }, [isDemoMode, navigate]);

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
    <PaywallContext.Provider value={{ openPaywall, closePaywall, openBillingPortal, isPortalLoading, portalError }}>
      {children}
      <PaywallModal
        open={isOpen}
        onClose={closePaywall}
        onStartTrial={handleStartTrial}
        source={source}
        checkoutError={checkoutError}
        isProcessing={isProcessing}
      />
    </PaywallContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePaywall = () => {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error('usePaywall must be used within PaywallProvider');
  }
  return context;
};
