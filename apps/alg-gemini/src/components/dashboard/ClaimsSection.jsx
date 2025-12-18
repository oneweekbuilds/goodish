import React, { useState } from 'react';

/**
 * ClaimsSection - Evidence-Backed Claims Display (Prompt 6)
 *
 * Renders claim objects with evidence, limitations, and actionable insights.
 * Claims are confidence-gated and always show coverage limitations when relevant.
 *
 * Contract:
 * - Shows 3-6 claims maximum per tab
 * - Each claim must display evidence and limitations
 * - Low confidence claims are visually distinguished
 * - Insufficient evidence shows "We can't conclude..." messaging
 */

/**
 * Confidence badge styles and labels
 */
const CONFIDENCE_CONFIG = {
  high: {
    label: 'High Confidence',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-400',
  },
  medium: {
    label: 'Medium Confidence',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-400',
  },
  low: {
    label: 'Limited Evidence',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
};

/**
 * ClaimConfidenceBadge - Small confidence indicator
 */
const ClaimConfidenceBadge = ({ confidence }) => {
  const config = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.low;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

/**
 * CoverageIndicator - Shows what coverage was required for the claim
 */
const CoverageIndicator = ({ coverageRequired }) => {
  if (!coverageRequired) return null;

  const issues = [];

  if (!coverageRequired.ocr_coverage_sufficient) {
    issues.push(`OCR: ${coverageRequired.ocr_coverage_percent?.toFixed(0) || 0}% (low)`);
  }

  if (!coverageRequired.audio_analyzed) {
    issues.push('Audio: Not analyzed');
  }

  if (!coverageRequired.sample_size_sufficient) {
    issues.push('Sample size: Insufficient');
  }

  if (issues.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {issues.map((issue, i) => (
        <span
          key={i}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500"
        >
          {issue}
        </span>
      ))}
    </div>
  );
};

/**
 * EvidenceList - Compact evidence display
 */
const EvidenceList = ({ evidence }) => {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1.5">
        Evidence
      </p>
      <ul className="space-y-1">
        {evidence.slice(0, 4).map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
            <span className="text-emerald-500 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * LimitationsList - Shows caveats and limitations
 */
const LimitationsList = ({ limitations }) => {
  if (!limitations || limitations.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-slate-50">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">
        Limitations
      </p>
      <ul className="space-y-0.5">
        {limitations.slice(0, 3).map((item, i) => (
          <li key={i} className="text-[11px] text-slate-500 italic">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * ClaimCard - Individual claim display
 */
const ClaimCard = ({ claim, isExpanded, onToggle }) => {
  const config = CONFIDENCE_CONFIG[claim.confidence] || CONFIDENCE_CONFIG.low;
  const isLowConfidence = claim.confidence === 'low';

  return (
    <div
      className={`rounded-xl p-4 border transition-all ${
        isLowConfidence
          ? 'bg-slate-50/50 border-slate-200'
          : `${config.bgColor} ${config.borderColor}`
      }`}
    >
      {/* Header row: confidence badge */}
      <div className="flex items-center justify-between mb-2">
        <ClaimConfidenceBadge confidence={claim.confidence} />
        <button
          onClick={onToggle}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {isExpanded ? 'Less' : 'More'}
        </button>
      </div>

      {/* Main claim text */}
      <p className={`text-sm font-medium leading-relaxed ${
        isLowConfidence ? 'text-slate-600' : 'text-slate-800'
      }`}>
        {claim.claim_text}
      </p>

      {/* Coverage issues indicator */}
      {isLowConfidence && (
        <CoverageIndicator coverageRequired={claim.coverage_required} />
      )}

      {/* Expandable details */}
      {isExpanded && (
        <div className="mt-3 space-y-1">
          <EvidenceList evidence={claim.evidence} />
          <LimitationsList limitations={claim.limitations} />

          {/* Why it matters */}
          {claim.why_it_matters && (
            <div className="mt-3 pt-2 border-t border-slate-100">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                Why This Matters
              </p>
              <p className="text-xs text-slate-600">{claim.why_it_matters}</p>
            </div>
          )}

          {/* Next action */}
          {claim.next_best_action && (
            <div className="mt-2 pt-2 border-t border-slate-50">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                What You Can Try
              </p>
              <p className="text-xs text-slate-600">{claim.next_best_action}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * EmptyClaimsState - Shown when no claims could be generated
 */
const EmptyClaimsState = () => (
  <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center">
    <p className="text-sm text-slate-500 mb-2">
      Not enough evidence to make claims from this scan.
    </p>
    <p className="text-xs text-slate-400">
      Try scanning more content to enable evidence-backed insights.
    </p>
  </div>
);

/**
 * ClaimsSection - Main claims display component
 *
 * @param {Array} claims - Array of claim objects from the API
 * @param {string} tabName - Name of the tab (for display purposes)
 * @param {boolean} defaultExpanded - Whether claims start expanded (default: false)
 */
const ClaimsSection = ({ claims, tabName = 'Evidence', defaultExpanded = false }) => {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showAll, setShowAll] = useState(false);

  // No claims or empty array
  if (!claims || claims.length === 0) {
    return <EmptyClaimsState />;
  }

  // Toggle individual claim expansion
  const toggleClaim = (claimId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(claimId)) {
        next.delete(claimId);
      } else {
        next.add(claimId);
      }
      return next;
    });
  };

  // Determine which claims to show (limit to 3 unless "show all" is clicked)
  const visibleClaims = showAll ? claims : claims.slice(0, 3);
  const hasMore = claims.length > 3;

  // Count by confidence
  const highCount = claims.filter((c) => c.confidence === 'high').length;
  const mediumCount = claims.filter((c) => c.confidence === 'medium').length;
  const lowCount = claims.filter((c) => c.confidence === 'low').length;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            Evidence-Backed Insights
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {claims.length} claim{claims.length !== 1 ? 's' : ''} from this scan
            {highCount > 0 && ` • ${highCount} high confidence`}
          </p>
        </div>

        {/* Confidence summary badges */}
        <div className="flex items-center gap-1.5">
          {highCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              {highCount}
            </span>
          )}
          {mediumCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-600">
              <span className="w-1 h-1 rounded-full bg-amber-400" />
              {mediumCount}
            </span>
          )}
          {lowCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              {lowCount}
            </span>
          )}
        </div>
      </div>

      {/* Claims list */}
      <div className="space-y-3">
        {visibleClaims.map((claim) => (
          <ClaimCard
            key={claim.id}
            claim={claim}
            isExpanded={expandedIds.has(claim.id) || defaultExpanded}
            onToggle={() => toggleClaim(claim.id)}
          />
        ))}
      </div>

      {/* Show more button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-50 rounded-lg transition-colors"
        >
          Show {claims.length - 3} more insight{claims.length - 3 !== 1 ? 's' : ''}
        </button>
      )}

      {/* Collapse button when showing all */}
      {hasMore && showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-50 rounded-lg transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
};

export default ClaimsSection;
