import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, ChevronDown, Bug, Database, Shield, TrendingUp, Tag, Building2 } from 'lucide-react';
import { useAdsEvidenceBundle, checkEvidenceBundleQuality } from '../../hooks/useEvidenceBundle';
import StackedBar100 from './charts/StackedBar100';

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
      <span className="inline-flex items-center gap-1 text-sm px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        <CheckCircle2 size={12} aria-hidden="true" />
        Data available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <AlertCircle size={12} aria-hidden="true" />
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
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-600 transition-colors"
          >
            <Info size={12} aria-hidden="true" />
            <span>Data sources</span>
            <ChevronDown
              size={12}
              className={`transition-transform ${showCitations ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
          {showCitations && (
            <div className="mt-2 text-xs text-slate-500">
              {citedFields.map(f => f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Commercial Exposure Spectrum - 100% stacked bar with 3 categories
// PRIMARY VISUALIZATION for Ads tab per spec
const CommercialExposureSpectrum = ({ observations, meta }) => {
  const spectrum = observations?.commercial_exposure_spectrum;
  if (!spectrum?.stacked_bar) return null;

  const { stacked_bar, excluded, coverage_percent, high_confidence_items, total_items } = spectrum;
  const sourceType = meta?.source_type;

  // Build segments for StackedBar100 - exactly 3 buckets per spec
  const segments = [
    {
      label: 'Non-Commercial',
      value: stacked_bar.non_commercial,
      color: '#10B981', // green
    },
    {
      label: 'Labeled Ads',
      value: stacked_bar.labeled_ads,
      color: '#F59E0B', // amber
    },
    {
      label: 'Unlabeled Promotion',
      value: stacked_bar.unlabeled_promotion,
      color: '#EF4444', // red
    },
  ].filter(s => s.value > 0);

  // Calculate excluded count
  const excludedCount = (excluded?.ambiguous || 0) + (excluded?.unlabeled_promotion_medium_confidence || 0);

  // If no data, show empty state
  if (segments.length === 0 || stacked_bar.total === 0) {
    return (
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-slate-500" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-700">Commercial Exposure</h4>
        </div>
        <p className="text-sm text-slate-500 italic">Not enough data to reliably identify ad content in this scan.</p>
        {sourceType === 'MOBILE_VIDEO' && (
          <p className="text-sm text-amber-600 mt-2">
            Mobile video scans may miss ad labels. Use desktop extension for more complete detection.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-700">Commercial Exposure Spectrum</h4>
        </div>
      </div>

      <StackedBar100 segments={segments} showLegend={true} />

      {/* Coverage line - REQUIRED directly under chart per spec */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-sm text-slate-600">
          <span className="font-medium">Coverage:</span> {coverage_percent}% of posts confidently classified ({high_confidence_items} of {total_items}).
          {excludedCount > 0 && (
            <span className="text-slate-500"> {excludedCount} posts excluded as ambiguous.</span>
          )}
        </p>
      </div>

      {/* Source-specific note */}
      {sourceType === 'MOBILE_VIDEO' && coverage_percent < 80 && (
        <p className="text-sm text-amber-600 mt-2">
          Mobile video scan: ad detection relies on OCR of visible disclosure labels. Some ads may be missed.
        </p>
      )}
    </div>
  );
};

// Promotion Topics section - derived ONLY from promotional content per spec
const PromotionTopics = ({ measurements }) => {
  const topicsData = measurements?.promotion_topics;
  if (!topicsData) return null;

  const { value, quality, threshold_rule, detected_but_excluded_count, notes, _full_breakdown } = topicsData;
  const topics = Array.isArray(value) ? value : [];

  // Format topic names for display
  const formatTopic = (topic) => topic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-purple-600" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-700">Promotion Topics</h4>
        </div>
        <span className={`text-sm px-2 py-0.5 rounded-full ${
          quality === 'ok' ? 'bg-green-100 text-green-700' :
          quality === 'not_applicable' ? 'bg-slate-100 text-slate-600' :
          'bg-amber-100 text-amber-700'
        }`}>
          {quality === 'ok' ? 'Surfaced' :
           quality === 'not_applicable' ? 'N/A' :
           'Not enough data'}
        </span>
      </div>

      {topics.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
              >
                {formatTopic(topic)}
              </span>
            ))}
          </div>
          {/* Threshold shown per spec */}
          <p className="mt-3 text-sm text-slate-500">
            <span className="font-medium">Showing:</span> {threshold_rule || 'Topics appearing at least twice with strong detection'}
            {detected_but_excluded_count > 0 && (
              <span className="text-slate-500"> · {detected_but_excluded_count} topics excluded</span>
            )}
          </p>
        </>
      ) : (
        <div>
          <p className="text-sm text-slate-500 italic">
            {quality === 'not_applicable'
              ? 'No promotional content detected during this window.'
              : detected_but_excluded_count > 0
              ? `${detected_but_excluded_count} topic${detected_but_excluded_count > 1 ? 's' : ''} detected but appeared too rarely to display reliably.`
              : 'No topic keywords matched in promotional content.'}
          </p>
          {threshold_rule && quality !== 'not_applicable' && (
            <p className="mt-2 text-sm text-slate-500">
              Showing: {threshold_rule}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Top Companies section - strict surfacing rules per spec
const TopCompanies = ({ observations, meta }) => {
  const companies = observations?.top_companies || [];
  const note = observations?.top_companies_note;
  const uniqueCount = observations?.unique_companies_surfaced || 0;
  const sourceType = meta?.source_type;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-blue-600" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-700">Top Companies</h4>
        </div>
        {uniqueCount > 0 && (
          <span className="text-sm px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            {uniqueCount} surfaced
          </span>
        )}
      </div>

      {companies.length > 0 ? (
        <>
          <div className="space-y-2">
            {companies.map((company, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg"
              >
                <span className="text-sm font-medium text-blue-800">{company.name}</span>
                <span className="text-sm text-blue-600">
                  {company.count} appearances
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            <span className="font-medium">Showing:</span> Companies appearing at least twice with strong detection
          </p>
        </>
      ) : (
        <div>
          <p className="text-sm text-slate-500 italic">
            {note || 'No companies appeared frequently enough to display reliably.'}
          </p>
          {sourceType === 'MOBILE_VIDEO' && (
            <p className="text-sm text-amber-600 mt-2">
              Mobile video scans lack advertiser metadata. Use desktop extension for company data.
            </p>
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
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded bg-slate-50"
          >
            <Bug size={12} aria-hidden="true" />
            {showDebug ? 'Hide Debug' : 'Show Evidence Bundle'}
          </button>
        </div>
      )}

      {/* Debug panel */}
      {showDebug && debugInfo && (
        <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-96">
          <div className="flex items-center gap-2 mb-3">
            <Database size={14} className="text-emerald-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
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
            <Shield size={20} className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-amber-800">Limited data available</p>
              <p className="text-sm text-amber-600">{reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Commercial Exposure Spectrum - Primary visualization */}
      <CommercialExposureSpectrum observations={bundle.observations} meta={bundle.meta} />

      {/* Two-column grid for Topics and Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <PromotionTopics measurements={bundle.measurements} />
        <TopCompanies observations={bundle.observations} meta={bundle.meta} />
      </div>

      {/* Analysis insights */}
      <div className="grid gap-4 mt-4">
        {/* Primary insight - Summary text */}
        {analysis.primary_insight && (
          <InsightCard
            title="Commercial exposure in your feed"
            analysis={analysis.primary_insight}
            citedFields={analysis.primary_insight.cited_fields}
          />
        )}

        {/* Unlabeled promo insight - Important for disclosure compliance */}
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
              <Info size={16} className="text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Limitations
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {analysis.limitations_summary.text}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Bundle metadata footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Database size={12} aria-hidden="true" />
          <span>
            {bundle.meta.n_items} posts analyzed
            {bundle.meta.platform && ` on ${bundle.meta.platform}`}
          </span>
        </div>
        <div className="text-sm text-slate-500">
          Generated {new Date(bundle.meta.generated_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default AdsEvidenceAnalysis;
