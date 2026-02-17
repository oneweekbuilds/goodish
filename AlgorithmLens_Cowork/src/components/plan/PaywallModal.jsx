import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Clock, Shield } from 'lucide-react';
import { PRICING } from '../../lib/plan/pricingConfig';

/**
 * PaywallModal - Pricing modal with 14-day free trial framing
 *
 * Props:
 * - open: boolean
 * - onClose: callback
 * - onStartTrial: callback when user clicks start trial
 * - source: optional metadata string for analytics
 * - checkoutError: optional error message to display
 * - isProcessing: optional boolean to show loading state
 */
const PaywallModal = ({ open, onClose, onStartTrial, source, checkoutError, isProcessing }) => {
  const [billingCycle, setBillingCycle] = useState('annual');
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Focus management
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      // Focus the modal container after a brief delay
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else if (previousActiveElement.current) {
      // Return focus when closing
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [open]);

  // Basic focus trap
  useEffect(() => {
    if (!open) return;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [open]);

  if (!open) return null;

  const handleStartTrial = () => {
    if (onStartTrial) {
      onStartTrial({ billingCycle, source });
    }
  };

  // Detect if this paywall was opened from a Trends CTA
  const isTrendsSource = source && source.includes('_hero_trends');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="paywall-title" className="text-2xl font-bold text-slate-900">Unlock Plus</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 rounded"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Contextual hook — varies by source */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">
              {isTrendsSource
                ? 'See how your feed changes over time'
                : 'Go deeper into what shaped your feed'}
            </h3>
            <p className="text-sm text-slate-500">
              {isTrendsSource
                ? 'One scan shows a moment. Multiple scans reveal patterns — shifting ad volume, narrowing sources, or content spikes around events.'
                : 'Your scan captured the headlines. Plus adds the analysis, context, and AI-powered Q&A to understand what it all means.'}
            </p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <Check size={18} className="text-primary-blue mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-slate-900">Evidence-based analysis</span>
                  <span className="text-slate-600"> — Detailed breakdowns of ad patterns, source concentration, and content composition on every tab.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check size={18} className="text-primary-blue mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-slate-900">Ask your feed questions</span>
                  <span className="text-slate-600"> — Get answers grounded in your actual scan data, like &ldquo;Why am I seeing so many ads from the same companies?&rdquo;</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check size={18} className="text-primary-blue mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-slate-900">Track changes over time</span>
                  <span className="text-slate-600"> — Compare scans side by side and spot shifts in your feed composition across weeks.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Billing cycle toggle */}
          <div className="flex justify-center">
            <div className="bg-slate-100 rounded-full p-1 flex items-center relative" role="group" aria-label="Billing cycle">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative z-10 ${
                  billingCycle === 'monthly'
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={billingCycle === 'monthly'}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative z-10 ${
                  billingCycle === 'annual'
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={billingCycle === 'annual'}
              >
                Annual
              </button>
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary-blue rounded-full transition-all duration-300 ease-in-out ${
                  billingCycle === 'annual'
                    ? 'left-[calc(50%+2px)]'
                    : 'left-1'
                }`}
              />
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly card */}
            <div
              className={`border-2 rounded-xl p-5 transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'border-primary-blue bg-primary-blue/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-slate-900">{PRICING.monthly.display}</span>
                <span className="text-sm text-slate-600">/{PRICING.monthly.interval}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {PRICING.trial.label}
              </p>
            </div>

            {/* Annual card */}
            <div
              className={`border-2 rounded-xl p-5 transition-all cursor-pointer relative ${
                billingCycle === 'annual'
                  ? 'border-primary-blue bg-primary-blue/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setBillingCycle('annual')}
            >
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-slate-900">{PRICING.annual.display}</span>
                <span className="text-sm text-slate-600">/{PRICING.annual.interval}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {PRICING.trial.label}
              </p>
              <p className="text-xs text-emerald-600 font-medium">
                (equivalent {PRICING.annual.monthlyEquivalent})
              </p>
            </div>
          </div>

          {/* Error message */}
          {checkoutError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{checkoutError}</p>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleStartTrial}
              disabled={isProcessing}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-primary-blue to-blue-600 text-white rounded-full font-semibold text-base hover:shadow-lg hover:shadow-primary-blue/20 hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Loading...' : `Start ${PRICING.trial.label} — ${billingCycle === 'annual' ? PRICING.annual.label : PRICING.monthly.label}`}
            </button>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock size={12} className="text-primary-blue" /> No charge for {PRICING.trial.days} days</span>
              <span className="flex items-center gap-1"><Shield size={12} className="text-emerald-500" /> Cancel anytime</span>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-full py-2.5 px-6 text-slate-400 font-medium text-sm hover:text-slate-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Maybe later
            </button>
          </div>

          {/* Footer microcopy */}
          <div className="text-center space-y-1.5 pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Your data stays private. We only use it to power your analysis.
            </p>
            <a
              href="https://algorithmlens.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-blue hover:underline"
            >
              algorithmlens.com/privacy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
