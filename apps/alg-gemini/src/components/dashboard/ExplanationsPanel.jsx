import React, { useState } from 'react';

/**
 * ExplanationsPanel - Evidence Explanations Trust Layer (Prompt 7)
 *
 * Renders explanations that help users understand:
 * - Which signals fired
 * - Which signals couldn't be checked (and why)
 * - Which signals weren't found
 * - What's driving confidence up/down
 * - What this doesn't mean (epistemic boundaries)
 * - What actions users can take
 *
 * Contract:
 * - Plain English only, no technical jargon
 * - Soften "not found" language when coverage is weak
 * - Always show what couldn't be evaluated due to missing modalities
 */

/**
 * Direction badge styles for confidence drivers
 */
const DIRECTION_CONFIG = {
  up: {
    icon: '+',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-500',
  },
  down: {
    icon: '-',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-500',
  },
};

/**
 * Signal status badge styles
 */
const SIGNAL_STATUS_CONFIG = {
  fired: {
    label: 'Detected',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-400',
  },
  not_evaluated: {
    label: 'Could Not Check',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
  not_found: {
    label: 'Not Detected',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-400',
  },
};

/**
 * SignalStatusBadge - Small status indicator for signals
 */
const SignalStatusBadge = ({ status }) => {
  const config = SIGNAL_STATUS_CONFIG[status] || SIGNAL_STATUS_CONFIG.not_evaluated;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bgColor} ${config.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

/**
 * SignalCard - Individual signal display
 */
const SignalCard = ({ signal, status }) => {
  const config = SIGNAL_STATUS_CONFIG[status] || SIGNAL_STATUS_CONFIG.not_evaluated;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`rounded-lg p-3 border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SignalStatusBadge status={status} />
          </div>
          <p className="text-sm font-medium text-slate-700">{signal.label}</p>
        </div>
        {signal.why && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            {isExpanded ? 'Less' : 'Why?'}
          </button>
        )}
      </div>

      {isExpanded && signal.why && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600 leading-relaxed">{signal.why}</p>
          {signal.evidence_ref && signal.evidence_ref.length > 0 && (
            <p className="text-[10px] text-slate-400 mt-1">
              Source: {signal.evidence_ref.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * SignalsSection - Groups signals by status
 */
const SignalsSection = ({ title, signals, status, emptyText }) => {
  if (!signals || signals.length === 0) {
    if (!emptyText) return null;
    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {title}
        </h4>
        <p className="text-xs text-slate-400 italic">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {title} ({signals.length})
      </h4>
      <div className="space-y-2">
        {signals.map((signal, i) => (
          <SignalCard key={signal.id || i} signal={signal} status={status} />
        ))}
      </div>
    </div>
  );
};

/**
 * ConfidenceDriverCard - Shows what's affecting confidence
 */
const ConfidenceDriverCard = ({ driver }) => {
  const config = DIRECTION_CONFIG[driver.direction] || DIRECTION_CONFIG.down;

  return (
    <div className={`flex items-start gap-2 rounded-lg p-2.5 border ${config.bgColor} ${config.borderColor}`}>
      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${config.bgColor} ${config.iconColor}`}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">{driver.label}</p>
        {driver.detail && (
          <p className="text-xs text-slate-500 mt-0.5">{driver.detail}</p>
        )}
      </div>
    </div>
  );
};

/**
 * ConfidenceDriversSection - Shows all confidence drivers
 */
const ConfidenceDriversSection = ({ drivers }) => {
  if (!drivers || drivers.length === 0) return null;

  const upDrivers = drivers.filter((d) => d.direction === 'up');
  const downDrivers = drivers.filter((d) => d.direction === 'down');

  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Confidence Factors
      </h4>
      <div className="space-y-2">
        {upDrivers.map((driver, i) => (
          <ConfidenceDriverCard key={`up-${i}`} driver={driver} />
        ))}
        {downDrivers.map((driver, i) => (
          <ConfidenceDriverCard key={`down-${i}`} driver={driver} />
        ))}
      </div>
    </div>
  );
};

/**
 * EpistemicBoundariesSection - What this doesn't mean
 */
const EpistemicBoundariesSection = ({ boundaries }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!boundaries || boundaries.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          What This Does Not Mean
        </h4>
        <span className="text-xs text-slate-400">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {isExpanded && (
        <ul className="mt-2 space-y-1.5">
          {boundaries.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <span className="text-amber-400 mt-0.5 shrink-0">!</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * NextActionsSection - What users can do
 */
const NextActionsSection = ({ actions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!actions || actions.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          What You Can Try
        </h4>
        <span className="text-xs text-slate-400">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {isExpanded && (
        <ul className="mt-2 space-y-1.5">
          {actions.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <span className="text-blue-400 mt-0.5 shrink-0">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * SummaryCard - Main summary display
 */
const SummaryCard = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4 mb-4">
      <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
    </div>
  );
};

/**
 * EmptyExplanationsState - Shown when no explanations available
 */
const EmptyExplanationsState = () => (
  <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center">
    <p className="text-sm text-slate-500 mb-2">
      Signal explanations are not available for this scan.
    </p>
    <p className="text-xs text-slate-400">
      Try scanning more content to see detailed signal analysis.
    </p>
  </div>
);

/**
 * ExplanationsPanel - Main explanations display component
 *
 * @param {Object} explanations - Explanations object from the API
 * @param {string} tabName - Name of the tab (for display purposes)
 * @param {boolean} defaultExpanded - Whether sections start expanded (default: false)
 * @param {boolean} showSummary - Whether to show the summary card (default: true)
 */
const ExplanationsPanel = ({
  explanations,
  tabName = 'Signals',
  defaultExpanded = false,
  showSummary = true,
}) => {
  const [showDetails, setShowDetails] = useState(defaultExpanded);

  // No explanations or missing required fields
  if (!explanations || typeof explanations !== 'object') {
    return <EmptyExplanationsState />;
  }

  const {
    summary,
    signals_fired = [],
    signals_not_evaluated = [],
    signals_not_found = [],
    confidence_drivers = [],
    what_this_does_not_mean = [],
    next_best_actions = [],
  } = explanations;

  // Count totals
  const firedCount = signals_fired.length;
  const notEvaluatedCount = signals_not_evaluated.length;
  const notFoundCount = signals_not_found.length;
  const hasAnySignals = firedCount + notEvaluatedCount + notFoundCount > 0;

  if (!summary && !hasAnySignals) {
    return <EmptyExplanationsState />;
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            Signal Transparency
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {firedCount > 0 && `${firedCount} detected`}
            {notEvaluatedCount > 0 && ` • ${notEvaluatedCount} could not check`}
            {notFoundCount > 0 && ` • ${notFoundCount} not found`}
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-1.5">
          {firedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              {firedCount}
            </span>
          )}
          {notEvaluatedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              {notEvaluatedCount}
            </span>
          )}
          {notFoundCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-500">
              <span className="w-1 h-1 rounded-full bg-blue-400" />
              {notFoundCount}
            </span>
          )}
        </div>
      </div>

      {/* Summary card */}
      {showSummary && <SummaryCard summary={summary} />}

      {/* Toggle details button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1"
      >
        {showDetails ? 'Hide' : 'Show'} signal details
        <span className="text-slate-400">{showDetails ? '▲' : '▼'}</span>
      </button>

      {/* Expanded details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {/* Signals fired */}
          <SignalsSection
            title="Signals Detected"
            signals={signals_fired}
            status="fired"
          />

          {/* Signals not evaluated (important for transparency) */}
          <SignalsSection
            title="Could Not Check"
            signals={signals_not_evaluated}
            status="not_evaluated"
            emptyText="All signal types were available for analysis."
          />

          {/* Signals not found */}
          <SignalsSection
            title="Not Detected"
            signals={signals_not_found}
            status="not_found"
          />

          {/* Confidence drivers */}
          <ConfidenceDriversSection drivers={confidence_drivers} />

          {/* Epistemic boundaries */}
          <EpistemicBoundariesSection boundaries={what_this_does_not_mean} />

          {/* Next actions */}
          <NextActionsSection actions={next_best_actions} />
        </div>
      )}
    </div>
  );
};

export default ExplanationsPanel;
