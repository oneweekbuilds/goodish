import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

/**
 * PaywallModal - Pricing modal with 14-day free trial framing
 *
 * Props:
 * - open: boolean
 * - onClose: callback
 * - onStartTrial: callback when user clicks start trial (later wired to Stripe)
 * - source: optional metadata string for analytics
 */
const PaywallModal = ({ open, onClose, onStartTrial, source }) => {
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
          {/* Promise sentence - Trends-specific or generic */}
          {isTrendsSource ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900">
                See how your feed changes over time
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Compare two saved scans side by side</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>See what changed between scans</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary-blue mt-0.5 flex-shrink-0" />
                  <span>Track shifts in ads, topics, and sources over time</span>
                </li>
              </ul>

              {/* Label-only preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-slate-600 mb-3">
                  What you'd see with Trends
                </p>
                <div className="space-y-1.5" role="presentation" aria-hidden="true">
                  <div className="flex items-center justify-between text-xs text-slate-400 py-1.5 px-2 bg-white/50 rounded">
                    <span>Total posts</span>
                    <span className="text-[10px] italic">(locked)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 py-1.5 px-2 bg-white/50 rounded">
                    <span>Ad content share</span>
                    <span className="text-[10px] italic">(locked)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 py-1.5 px-2 bg-white/50 rounded">
                    <span>Political content share</span>
                    <span className="text-[10px] italic">(locked)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 py-1.5 px-2 bg-white/50 rounded">
                    <span>Unique creators</span>
                    <span className="text-[10px] italic">(locked)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-lg text-slate-700 leading-relaxed">
              See how your feed changes over time, what shifted, and why it likely happened.
            </p>
          )}

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
                <span className="text-3xl font-bold text-slate-900">$10</span>
                <span className="text-sm text-slate-600">/month</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                14-day free trial
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
                <span className="text-3xl font-bold text-slate-900">$96</span>
                <span className="text-sm text-slate-600">/year</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                14-day free trial
              </p>
              <p className="text-xs text-emerald-600 font-medium">
                (equivalent $8/month)
              </p>
            </div>
          </div>

          {/* Calm framing */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              Your snapshot is free. Plus adds trends, changes, and explanations across scans.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleStartTrial}
              className="w-full py-3 px-6 bg-primary-blue text-white rounded-full font-semibold text-base hover:bg-blue-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2"
            >
              Start 14-day free trial
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-white text-slate-600 rounded-full font-medium text-base hover:bg-slate-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
            >
              Not now
            </button>
          </div>

          {/* Footer microcopy */}
          <div className="text-center space-y-2 pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Cancel anytime.
            </p>
            <p className="text-xs text-slate-500">
              We only use your data to provide your analysis.
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
