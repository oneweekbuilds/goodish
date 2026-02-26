import React from 'react';
import { MessageCircleQuestion, Lock } from 'lucide-react';
import { usePaywall } from '../../lib/plan/PaywallProvider';
import { PRICING } from '../../lib/plan/pricingConfig';

/**
 * FreeAskTeaser - Teaser card for the "Ask your feed" AI conversation feature
 *
 * Shows an example question relevant to the current tab and invites free users
 * to upgrade for unlimited AI-powered Q&A.
 *
 * All copy follows epistemic restraint: frames questions as exploratory, not accusatory.
 *
 * Props:
 * - tabName: string — which tab this appears on (for analytics)
 * - exampleQuestion: string — an example question users could ask about this tab
 */
const FreeAskTeaser = ({ tabName, exampleQuestion }) => {
  const { openPaywall } = usePaywall();

  const handleUpgrade = () => {
    openPaywall(`ask_teaser_${tabName}`);
  };

  return (
    <section className="mt-6">
      <div
        className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.12)',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <MessageCircleQuestion size={18} className="text-accent-green" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              Ask your feed
              <Lock size={12} className="text-slate-400" aria-label="Plus feature" />
            </p>
            <p className="text-sm text-slate-500 truncate">
              {exampleQuestion}
            </p>
          </div>
        </div>
        <button
          onClick={handleUpgrade}
          className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/60 focus-visible:ring-offset-2 hover:shadow-md hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
          }}
        >
          Try free for {PRICING.trial.days} days
        </button>
      </div>
    </section>
  );
};

export default FreeAskTeaser;
