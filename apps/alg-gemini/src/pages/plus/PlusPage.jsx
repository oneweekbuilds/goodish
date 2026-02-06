import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, TrendingUp, Sparkles } from 'lucide-react';
import { usePaywall } from '../../lib/plan/PaywallProvider';
import { track } from '../../lib/analytics/analyticsClient';
import { EVENTS } from '../../lib/analytics/events';
import { getCurrentPlanTier } from '../../lib/plan/planTier';

/**
 * PlusPage - Dedicated /plus conversion page
 *
 * Conversion-optimized page explaining Plus features with pricing cards.
 * Opens PaywallModal when user clicks CTA.
 *
 * Analytics:
 * - upgrade_cta_clicked: When user clicks primary CTA
 * - paywall_viewed: When PaywallModal opens (tracked by PaywallProvider)
 *
 * Demo mode isolation:
 * - No analytics events fire when ?demo=1 is present
 */
const PlusPage = () => {
  const navigate = useNavigate();
  const { openPaywall } = usePaywall();

  // Check for demo mode
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';

  // Get plan tier for analytics
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const planTier = useMemo(
    () => getCurrentPlanTier(isDemoMode, searchParams),
    [isDemoMode, searchParams]
  );

  // Track page view (optional, not required in spec but useful)
  useEffect(() => {
    // Page view tracking could go here if needed
  }, []);

  const handleStartTrial = () => {
    // Track CTA click (skip in demo mode)
    if (!isDemoMode) {
      track(EVENTS.UPGRADE_CTA_CLICKED, {
        tab: 'plus_page',
        placement: 'primary_cta',
        planTier,
        isDemo: false,
      });
    }

    // Open paywall
    openPaywall('plus_page_primary');
  };

  const handleNotNow = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full mb-6">
            <Sparkles size={16} className="text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">AlgorithmLens Plus</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Understand your feed over time
          </h1>

          {/* One-sentence promise (exact from spec) */}
          <p className="text-xl sm:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            See how your feed changes over time, what shifted, and why it likely happened.
          </p>

          {/* Calm framing (exact from spec) */}
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Your snapshot is free. Plus adds trends, changes, and explanations across scans.
          </p>
        </div>

        {/* Free vs Plus Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Free tier */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <X size={24} className="text-slate-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Free</h3>
            </div>
            <p className="text-lg text-slate-600 mb-6">
              See what your feed looks like right now.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-600">Single scan snapshot</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-600">Basic feed composition</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-600">Ad and source analysis</span>
              </li>
            </ul>
          </div>

          {/* Plus tier */}
          <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-300 rounded-2xl p-8 relative overflow-hidden">
            {/* Premium badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full text-xs font-bold text-emerald-700 uppercase tracking-wide">
                <Sparkles size={12} />
                Plus
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={24} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Plus</h3>
            </div>
            <p className="text-lg text-slate-700 mb-6 font-medium">
              Understand how and why it changes over time.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Compare scans side by side</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">See what changed between scans</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Track shifts in ads, topics, and sources</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Understand possible factors</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Choose your plan
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
            {/* Monthly card */}
            <div className="border-2 border-slate-200 rounded-xl p-6 hover:border-emerald-300 transition-colors">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold text-slate-900">$10</span>
                <span className="text-lg text-slate-600">/month</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">14-day free trial</p>
              <p className="text-sm text-slate-500">Cancel anytime</p>
            </div>

            {/* Annual card */}
            <div className="border-2 border-emerald-300 bg-emerald-50/50 rounded-xl p-6 relative">
              <div className="absolute top-3 right-3">
                <span className="inline-block px-2 py-1 bg-emerald-100 border border-emerald-300 rounded text-xs font-bold text-emerald-700">
                  Best value
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold text-slate-900">$96</span>
                <span className="text-lg text-slate-600">/year</span>
              </div>
              <p className="text-sm text-emerald-700 font-medium mb-2">(equivalent $8/month)</p>
              <p className="text-sm text-slate-600 mb-2">14-day free trial</p>
              <p className="text-sm text-slate-500">Cancel anytime</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleStartTrial}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Start 14-day free trial
            </button>
            <button
              onClick={handleNotNow}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-600 border-2 border-slate-200 rounded-full font-semibold text-lg hover:bg-slate-50 transition-all duration-200"
            >
              Not now
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Frequently asked questions
          </h2>

          <div className="space-y-6">
            {/* FAQ 1: Cancel anytime */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Yes. Cancel anytime during your trial or subscription. No questions asked, no hidden fees.
              </p>
            </div>

            {/* FAQ 2: Privacy and data use */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                How do you use my data?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                We only use your data to provide your analysis. Your scans are private by default. We do not sell or share your data with third parties.
              </p>
            </div>

            {/* FAQ 3: Epistemic honesty */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Do you explain why my feed changed?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                We describe what appeared in your feed and what changed between scans. We provide possible factors that could influence feed composition, but we do not speculate about platform intent or make causal claims. Platform algorithms are opaque.
              </p>
            </div>

            {/* FAQ 4: How scans work */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Why do multiple scans matter?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                A single scan shows your feed at one moment in time. Multiple scans let you track how your feed evolves, spot patterns, and understand what changed. Plus gives you the tools to compare scans and see trends.
              </p>
            </div>

            {/* FAQ 5: Extension and uploads */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Do you support the extension and uploads?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Use AlgorithmLens with the Chrome extension, or upload scans from your desktop. Both free and Plus users have access to all scan methods.
              </p>
            </div>

            {/* FAQ 6: What happens after trial */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                What happens after my trial ends?
              </h3>
              <p className="text-slate-600 leading-relaxed">
                After 14 days, your subscription begins. You can cancel before the trial ends to avoid any charges. Your scans and data remain accessible whether you subscribe or not.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 pt-12 border-t border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to track your feed over time?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Start your 14-day free trial today
          </p>
          <button
            onClick={handleStartTrial}
            className="px-8 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Start 14-day free trial
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlusPage;
