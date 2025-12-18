import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, ChevronDown, Bug, Database, Shield } from 'lucide-react';
import { useAdsEvidenceBundle, checkEvidenceBundleQuality } from '../../hooks/useEvidenceBundle';

/**
 * AdsEvidenceAnalysis - Renders analysis copy for the Ads & Influence tab
 * using ONLY the Evidence Bundle. Never uses raw feed text or generic explanations.
 *
 * Per accuracy_contract.md:
 * - Anchors claims to "in this scan / in this sample"
 * - Avoids identity, belief, intent, or causal claims
 * - States uncertainty when limits indicate missingness or low sample
 */

// Quality indicator component
const QualityBadge = ({ quality }) => {
  if (quality === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        <CheckCircle2 size={12} />
        Data available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <AlertCircle size={12} />
      Limited data
    </span>
  );
};

// Analysis insight card component
const InsightCard = ({ title, analysis, citedFields }) => {
  const [showCitations, setShowCitations] = useState(false);

  if (!analysis) return null;

  const isInsufficient = analysis.quality === 'insufficient_data';

  return (
    <div
      className={`rounded-xl p-5 transition-all ${
        isInsufficient
          ? 'bg-slate-50 border border-slate-200'
          : 'bg-white border border-slate-200 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <QualityBadge quality={analysis.quality} />
      </div>

      {/* Main text */}
      <p
        className={`text-sm leading-relaxed ${
          isInsufficient ? 'text-slate-500 italic' : 'text-slate-700'
        }`}
      >
        {analysis.text}
      </p>

      {/* Citations (expandable) */}
      {citedFields && citedFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Info size={12} />
            <span>Evidence source</span>
            <ChevronDown
              size={12}
              className={`transition-transform ${showCitations ? 'rotate-180' : ''}`}
            />
          </button>
          {showCitations && (
            <div className="mt-2 text-xs text-slate-400 font-mono">
              {citedFields.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main component
const AdsEvidenceAnalysis = ({ scanId }) => {
  const { bundle, analysis, loading, error, debugInfo } = useAdsEvidenceBundle(scanId);
  const [showDebug, setShowDebug] = useState(false);

  // Check if we have enough data
  const { hasEnoughData, reason } = checkEvidenceBundleQuality(bundle);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-slate-100 rounded-xl" />
        <div className="h-24 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Unable to load analysis</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bundle || !analysis) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Debug toggle (dev only) */}
      {debugInfo && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded bg-slate-50"
          >
            <Bug size={12} />
            {showDebug ? 'Hide Debug' : 'Show Evidence Bundle'}
          </button>
        </div>
      )}

      {/* Debug panel */}
      {showDebug && debugInfo && (
        <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-96">
          <div className="flex items-center gap-2 mb-3">
            <Database size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
              Evidence Bundle (Debug)
            </span>
          </div>
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
            {JSON.stringify(debugInfo.raw_bundle, null, 2)}
          </pre>
        </div>
      )}

      {/* Insufficient data warning */}
      {!hasEnoughData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Limited data available</p>
              <p className="text-sm text-amber-600">{reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis insights */}
      <div className="grid gap-4">
        {/* Primary insight - Commercial Exposure Spectrum */}
        {analysis.primary_insight && (
          <InsightCard
            title="Commercial exposure in your feed"
            analysis={analysis.primary_insight}
            citedFields={analysis.primary_insight.cited_fields}
          />
        )}

        {/* Topic insight - What kinds of things are being promoted */}
        {analysis.topic_insight && (
          <InsightCard
            title="Promotion topics"
            analysis={analysis.topic_insight}
            citedFields={analysis.topic_insight.cited_fields}
          />
        )}

        {/* Concentration insight - Brand/Advertiser presence */}
        {analysis.concentration_insight && (
          <InsightCard
            title="Brand presence"
            analysis={analysis.concentration_insight}
            citedFields={analysis.concentration_insight.cited_fields}
          />
        )}

        {/* Unlabeled promo insight */}
        {analysis.unlabeled_promo_insight && (
          <InsightCard
            title="Unlabeled promotions"
            analysis={analysis.unlabeled_promo_insight}
            citedFields={analysis.unlabeled_promo_insight.cited_fields}
          />
        )}

        {/* Limitations summary */}
        {analysis.limitations_summary && (
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Limitations
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {analysis.limitations_summary.text}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Bundle metadata footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Database size={12} />
          <span>
            {bundle.meta.n_items} posts analyzed
            {bundle.meta.platform && ` on ${bundle.meta.platform}`}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Generated {new Date(bundle.meta.generated_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default AdsEvidenceAnalysis;
