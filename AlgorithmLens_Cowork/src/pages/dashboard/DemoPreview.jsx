import React from 'react';
import { PLAN_TIERS } from '../../lib/plan';
import { LockedOverlayCard } from '../../components/plan';

/**
 * DemoPreview - Demo-mode UI preview section
 *
 * Shows only when in demo mode (?demo=1). Displays plan tier UI
 * and a sample locked card preview.
 */
const DemoPreview = ({ isDemoMode, planTier, openPaywall }) => {
  if (!isDemoMode) return null;

  // Debug panel only shows with ?debug=1 alongside ?demo=1
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1';

  return (
    <div className="mt-12 mb-8 max-w-4xl mx-auto px-4">
      {isDebugMode && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-xs text-amber-800 font-medium">
              Debug Mode: Plan UI Preview (only visible with ?demo=1&amp;debug=1)
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Current plan tier: <span className="font-mono font-semibold">{planTier}</span>
            </p>
          </div>

          <LockedOverlayCard
            locked={planTier !== PLAN_TIERS.PLUS}
            title="Trends over time"
            body="Your snapshot is free. Plus adds trends, changes, and explanations across scans."
            ctaLabel="Start Plus free trial"
            onUpgrade={() => openPaywall('demo_preview')}
          >
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Sample Trend Chart
              </h3>
              <div className="h-40 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                [Trend visualization preview]
              </div>
              <p className="text-sm text-slate-600 mt-3">
                This card shows {planTier === PLAN_TIERS.PLUS ? 'unlocked' : 'locked'} state
              </p>
            </div>
          </LockedOverlayCard>

          <div className="mt-4 text-center">
            <button
              onClick={() => openPaywall('demo_preview')}
              className="text-sm text-primary-blue hover:underline"
            >
              Open Paywall Modal (test)
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DemoPreview;
