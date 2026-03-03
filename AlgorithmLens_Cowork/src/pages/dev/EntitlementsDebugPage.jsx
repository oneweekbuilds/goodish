import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchEntitlements } from '../../lib/plan/entitlements';
import { getCurrentPlanTier } from '../../lib/plan/planTier';

/**
 * EntitlementsDebugPage - Dev-only entitlements viewer
 *
 * Accessible at /dev/entitlements?dev=1 or in development mode
 * Shows backend entitlements and local plan tier for debugging conversion flow
 */
const EntitlementsDebugPage = () => {
  const [entitlements, setEntitlements] = useState(null);
  const [localPlanTier, setLocalPlanTier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if dev mode is enabled
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    setIsAuthorized(isDev);
  }, []);

  // Load local plan tier on mount
  useEffect(() => {
    if (isAuthorized) {
      const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
      const searchParams = new URLSearchParams(window.location.search);
      const tier = getCurrentPlanTier(isDemoMode, searchParams);
      setLocalPlanTier(tier);
    }
  }, [isAuthorized]);

  const handleFetchEntitlements = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchEntitlements();

      if (data === null) {
        setError('Not authenticated (401)');
        setEntitlements(null);
      } else {
        setEntitlements(data);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to fetch entitlements');
      setEntitlements(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[100dvh] bg-bg-page pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Not available</h1>
          <p className="text-slate-600">
            This page is only accessible in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg-page pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Entitlements Debug</h1>
          <p className="text-slate-600">
            Backend entitlements and local plan tier state
          </p>
          <p className="text-xs text-amber-600 mt-2">
            Dev only. Do not rely on this in production.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleFetchEntitlements}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Fetch entitlements
          </button>
        </div>

        {/* Local plan tier */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Local Plan Tier</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-32">Current tier:</span>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                localPlanTier === 'plus' ? 'bg-emerald-100 text-emerald-700' :
                localPlanTier === 'free' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {localPlanTier || 'unknown'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Stored in localStorage. Used for frontend gating.
            </p>
          </div>
        </div>

        {/* Backend entitlements */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Backend Entitlements</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!entitlements && !error && !loading && (
            <p className="text-sm text-slate-500">
              Click "Fetch entitlements" to load data from backend.
            </p>
          )}

          {entitlements && (
            <div className="space-y-4">
              {/* is_plus */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-40">is_plus:</span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  entitlements.is_plus ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {entitlements.is_plus ? 'true' : 'false'}
                </span>
              </div>

              {/* Subscription details */}
              {entitlements.subscription && (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-40">status:</span>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                      {entitlements.subscription.status || 'null'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-40">plan_type:</span>
                    <span className="text-sm text-slate-900 font-mono">
                      {entitlements.subscription.plan_type || 'null'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-40">trial_end:</span>
                    <span className="text-sm text-slate-900 font-mono">
                      {entitlements.subscription.trial_end
                        ? new Date(entitlements.subscription.trial_end * 1000).toLocaleString()
                        : 'null'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-40">current_period_end:</span>
                    <span className="text-sm text-slate-900 font-mono">
                      {entitlements.subscription.current_period_end
                        ? new Date(entitlements.subscription.current_period_end * 1000).toLocaleString()
                        : 'null'}
                    </span>
                  </div>
                </>
              )}

              {/* Raw JSON */}
              <details className="mt-4">
                <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                  Raw JSON
                </summary>
                <pre className="mt-2 p-3 bg-slate-50 rounded text-xs font-mono overflow-x-auto">
                  {JSON.stringify(entitlements, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntitlementsDebugPage;
