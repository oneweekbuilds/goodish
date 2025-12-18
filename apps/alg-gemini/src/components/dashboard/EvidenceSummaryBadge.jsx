import React from 'react';
import { Database, FileText, Eye, Volume2, AlertTriangle, Info } from 'lucide-react';

/**
 * EvidenceSummaryBadge - Shows what evidence is available for the Talk section
 *
 * Displays:
 * - Total items analyzed
 * - Coverage percentage
 * - Modalities available (text, OCR vision cues, audio transcript)
 * - Low coverage warning when applicable
 *
 * ACCURACY CONTRACT COMPLIANT:
 * - When coverage is weak, explicitly says so
 * - Never claims completeness
 * - All language grounded in "this scan"
 */

// Theme constants
const TALK_THEME = {
  accent: '#10B981',
  accentRgb: '16, 185, 129',
};

/**
 * Compute evidence summary from any evidence bundle type
 * Returns a normalized object with counts and flags
 */
export function computeEvidenceSummary(bundle) {
  if (!bundle) {
    return {
      totalItems: 0,
      coveragePercent: 0,
      hasText: false,
      hasOCR: false,
      hasAudio: false,
      textItems: 0,
      ocrItems: 0,
      audioItems: 0,
      isLowCoverage: true,
      limitations: [],
      missingModalities: ['text', 'OCR', 'audio'],
    };
  }

  const meta = bundle.meta || {};
  const observations = bundle.observations || {};
  const limits = bundle.limits || {};
  const measurements = bundle.measurements || {};

  // Extract basic counts
  const totalItems = meta.n_items || 0;

  // Compute coverage - different bundles have different fields
  let coveragePercent = 100;
  if (observations.commercial_exposure_spectrum?.coverage_percent) {
    coveragePercent = observations.commercial_exposure_spectrum.coverage_percent;
  } else if (observations.political_content_spectrum?.coverage_percent) {
    coveragePercent = observations.political_content_spectrum.coverage_percent;
  } else if (observations.topic_diversity_summary?.coverage_percent) {
    coveragePercent = observations.topic_diversity_summary.coverage_percent;
  } else if (observations.creator_data_coverage?.creator_coverage_percent) {
    coveragePercent = observations.creator_data_coverage.creator_coverage_percent;
  }

  // Check for OCR data
  const hasOCR = (observations.items_with_ocr_text || 0) > 0 ||
                 (observations.ocr_extraction_rate_percent || 0) > 0;
  const ocrItems = observations.items_with_ocr_text || 0;

  // Check for audio data (from audio_analysis in scan results or limits)
  // Audio analyzed is inferred from the absence of audio-related limitations
  const audioLimitations = (limits.ad_detection_limitations || [])
    .filter(l => l.toLowerCase().includes('audio'));
  const hasAudio = audioLimitations.length === 0 &&
    !limits.epistemic_boundaries?.some(b => b.toLowerCase().includes('audio'));

  // Assume all items have text content
  const hasText = totalItems > 0;
  const textItems = totalItems;

  // Determine audio items (approximate - if audio was analyzed, assume all items)
  const audioItems = hasAudio ? totalItems : 0;

  // Low coverage threshold is 60%
  const isLowCoverage = coveragePercent < 60;

  // Collect limitations
  const limitations = [
    ...(limits.sample_size_limitations || []),
    ...(limits.missing_metadata_limitations || []),
    ...(limits.epistemic_boundaries || []),
    ...(limits.classification_limitations || []),
    ...(limits.data_quality_warnings || []),
  ].filter(Boolean).slice(0, 3); // Cap at 3 for UI brevity

  // Determine missing modalities
  const missingModalities = [];
  if (!hasText || textItems < 10) missingModalities.push('text');
  if (!hasOCR) missingModalities.push('OCR');
  if (!hasAudio) missingModalities.push('audio');

  return {
    totalItems,
    coveragePercent,
    hasText,
    hasOCR,
    hasAudio,
    textItems,
    ocrItems,
    audioItems,
    isLowCoverage,
    limitations,
    missingModalities,
  };
}

/**
 * Get prompts that shift based on coverage quality
 * When coverage is weak, prompts focus on what can't be concluded
 */
export function getEvidenceAwarePrompts(tabId, evidenceSummary, defaultPrompts) {
  const { isLowCoverage, coveragePercent, totalItems, missingModalities } = evidenceSummary;

  // If good coverage, use default prompts
  if (!isLowCoverage && totalItems >= 10) {
    return defaultPrompts;
  }

  // Low coverage / weak data prompts - shift to honest uncertainty
  const weakDataPrompts = {
    ads: [
      "What can't be concluded from this scan?",
      "How could I get better ad detection data?",
      "Why might some promotions be missing?",
    ],
    politics: [
      "What can't be concluded from this scan?",
      "What would improve political coverage?",
      "Why might keyword matching miss nuance?",
    ],
    patterns: [
      "What can't be concluded from this scan?",
      "How can I get more topic diversity data?",
      "What's needed for reliable pattern detection?",
    ],
    creators: [
      "What can't be concluded from this scan?",
      "What would capture better creator data?",
      "Why might creator coverage be incomplete?",
    ],
    algorithm: [
      "What can't be concluded from this scan?",
      "How can I get higher-confidence signals?",
      "What would a desktop scan capture differently?",
    ],
  };

  // If very low items, use weak prompts entirely
  if (totalItems < 10) {
    return weakDataPrompts[tabId] || weakDataPrompts.algorithm;
  }

  // If medium coverage, mix default and weak prompts
  if (coveragePercent >= 40 && coveragePercent < 60) {
    const mixed = [...defaultPrompts.slice(0, 2)];
    mixed.push(weakDataPrompts[tabId]?.[0] || "What can't be concluded yet?");
    return mixed;
  }

  // Low coverage: prioritize uncertainty prompts
  return weakDataPrompts[tabId] || weakDataPrompts.algorithm;
}

/**
 * ModalityBadge - Small badge showing a modality status
 */
const ModalityBadge = ({ icon: Icon, label, count, available }) => (
  <div
    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
    style={{
      background: available ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
      color: available ? '#059669' : '#94A3B8',
      border: `1px solid ${available ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)'}`,
    }}
  >
    <Icon size={12} />
    <span className="font-medium">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="text-slate-400">({count})</span>
    )}
    {!available && (
      <span className="text-slate-400 italic">—</span>
    )}
  </div>
);

/**
 * EvidenceSummaryBadge - Main component showing evidence availability
 */
const EvidenceSummaryBadge = ({ bundle, showDetails = false }) => {
  const summary = computeEvidenceSummary(bundle);
  const {
    totalItems,
    coveragePercent,
    hasText,
    hasOCR,
    hasAudio,
    textItems,
    ocrItems,
    audioItems,
    isLowCoverage,
    limitations,
    missingModalities,
  } = summary;

  // Don't render if no data
  if (!bundle || totalItems === 0) {
    return (
      <div
        className="rounded-lg p-3"
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            No scan data available yet. Run a scan to see evidence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: isLowCoverage
          ? 'rgba(245, 158, 11, 0.08)'
          : `rgba(${TALK_THEME.accentRgb}, 0.06)`,
        border: `1px solid ${isLowCoverage
          ? 'rgba(245, 158, 11, 0.15)'
          : `rgba(${TALK_THEME.accentRgb}, 0.12)`}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Database size={14} style={{ color: isLowCoverage ? '#F59E0B' : TALK_THEME.accent }} />
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: isLowCoverage ? '#B45309' : TALK_THEME.accent }}
          >
            Evidence available
          </span>
        </div>
        {/* Coverage badge */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: isLowCoverage ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            color: isLowCoverage ? '#B45309' : '#059669',
          }}
        >
          {coveragePercent}% coverage
        </div>
      </div>

      {/* Items count */}
      <p className="text-xs text-slate-600 mb-2">
        <span className="font-medium">{totalItems} items</span> analyzed in this scan
      </p>

      {/* Modality badges */}
      <div className="flex flex-wrap gap-2 mb-2">
        <ModalityBadge
          icon={FileText}
          label="Text"
          count={textItems}
          available={hasText}
        />
        <ModalityBadge
          icon={Eye}
          label="OCR cues"
          count={ocrItems}
          available={hasOCR}
        />
        <ModalityBadge
          icon={Volume2}
          label="Audio"
          count={audioItems}
          available={hasAudio}
        />
      </div>

      {/* Low coverage warning */}
      {isLowCoverage && (
        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-amber-200/50">
          <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <span className="font-medium">Low coverage:</span> Some conclusions may be limited.
            {missingModalities.length > 0 && (
              <> Missing: {missingModalities.join(', ')}.</>
            )}
          </p>
        </div>
      )}

      {/* Limitations (if showDetails) */}
      {showDetails && limitations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200/50">
          <div className="flex items-start gap-2">
            <Info size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500">
              <span className="font-medium">Limitations:</span>
              <ul className="mt-1 space-y-0.5">
                {limitations.map((limit, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-slate-400">•</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceSummaryBadge;
