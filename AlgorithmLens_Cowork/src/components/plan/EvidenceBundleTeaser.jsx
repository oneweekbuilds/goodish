import React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { usePaywall } from '../../lib/plan/PaywallProvider';
import { PRICING } from '../../lib/plan/pricingConfig';

/**
 * EvidenceBundleTeaser - Blurred preview of evidence bundle analysis for free users
 *
 * Shows placeholder analysis text behind a blur overlay with a CTA to upgrade.
 * Reuses the LockedOverlayCard visual pattern but is purpose-built for evidence bundles.
 *
 * All copy follows epistemic restraint: describes what Plus provides, never infers algorithmic intent.
 *
 * Props:
 * - tabName: string — which tab this teaser is on (for analytics source tracking)
 * - teaserText: string — description of what the evidence bundle covers
 */
const EvidenceBundleTeaser = ({ tabName, teaserText }) => {
  const { openPaywall } = usePaywall();

  const handleUpgrade = () => {
    openPaywall(`evidence_teaser_${tabName}`);
  };

  return (
    <section className="mt-10">
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred placeholder content */}
        <div className="filter blur-sm pointer-events-none select-none" aria-hidden="true">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-slate-300" />
              <span className="text-sm font-semibold text-slate-300">Evidence-based analysis</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
              <div className="h-3 bg-slate-100 rounded w-4/6" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          </div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200">
          <div className="max-w-sm text-center px-6 py-6 space-y-3">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center">
                <Sparkles size={20} className="text-primary-blue" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              There's more to this data
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {teaserText}
            </p>
            <div className="pt-1 space-y-2">
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-blue to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary-blue/20 hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/60 focus-visible:ring-offset-2"
              >
                Unlock with a free trial
              </button>
              <p className="text-xs text-slate-400">No credit card charged for {PRICING.trial.days} days</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EvidenceBundleTeaser;
