import React, { useState } from 'react';
import EmptyState from './EmptyState';
import { DataQualityFooter } from './ConfidenceBadge';
import {
  BarChartSimple,
  StackedBar100,
  LineChartSimple,
  BigNumber,
  SimpleTable,
  StatusCard,
  InsightCard,
} from './charts';

/**
 * FeedbackAffordance - PHASE 7: Non-functional self-correction prompt
 * Displays "Does this feel accurate?" with Yes/Somewhat/Not really options
 * These are trust affordances, not functional inputs - no state or handlers needed
 */
const FeedbackAffordance = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="pt-3 border-t border-slate-100">
      <p className="text-xs text-slate-500 mb-2">Does this feel accurate?</p>
      <div className="flex gap-2">
        {['Yes', 'Somewhat', 'Not really'].map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`
              px-3 py-1 text-xs rounded-full transition-colors
              ${selected === option
                ? 'bg-slate-200 text-slate-700'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }
            `}
          >
            {option}
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-xs text-slate-400 mt-2 italic">
          Thanks for reflecting. Your input helps calibrate your own understanding.
        </p>
      )}
    </div>
  );
};

/**
 * WhyExplanation - PHASE 7: Micro-explanation of how insight was inferred
 */
const WhyExplanation = ({ text }) => {
  if (!text) return null;
  return (
    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
      {text}
    </p>
  );
};

/**
 * CounterfactualNote - PHASE 7: Legitimizes disagreement for primary cards
 */
const CounterfactualNote = ({ text }) => {
  if (!text) return null;
  return (
    <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 px-3 py-2 rounded-lg">
      {text}
    </p>
  );
};

/**
 * ViewCard component - renders a single dashboard view card.
 * Supports multiple output types with takeaways and actions.
 * Phase 4: Added visual hierarchy for primary vs secondary cards.
 * Phase 5: Now uses ACTUAL scansUsed from dataResult for accurate labeling.
 * Phase 7: Added belief calibration and trust framing elements:
 *   - whyExplanation: micro-explanation of how insight was inferred
 *   - counterfactual: legitimizes disagreement (primary cards only)
 *   - FeedbackAffordance: non-functional self-correction prompt (primary cards only)
 *
 * @param {Object} view - View configuration from dashboardCatalog
 * @param {Object} dataResult - Result from data helper function (includes scansUsed, scansWithData)
 * @param {number} scanCount - Total number of scans (for reference only)
 * @param {number} platformCount - Number of platforms scanned
 */
const ViewCard = ({ view, dataResult, scanCount = 0, platformCount = 0 }) => {
  const {
    title,
    description,
    outputType,
    takeaway,
    action,
    emptyStateType,
    isSummaryCard,
    confidenceDisclaimer,
    isPrimary,
    sortOrder,
    whyExplanation,
    counterfactual,
  } = view;
  const hasData = dataResult?.hasData === true;
  const data = dataResult?.data;
  const missing = dataResult?.missing;

  // PHASE 5: Use the ACTUAL scans used for this metric, not total scan count
  // This ensures "Based on X scans" labels are accurate for each view
  const actualScansUsed = dataResult?.scansUsed ?? scanCount;

  // Determine if this is a future/coming soon card
  const isFutureCard = sortOrder === 'future' || emptyStateType === 'future_feature';

  // Compute takeaway text
  const takeawayText = hasData && typeof takeaway === 'function'
    ? takeaway(data)
    : null;

  // Compute action text
  const actionText = hasData && typeof action === 'function'
    ? action(data)
    : null;

  // Render the appropriate chart/content based on outputType
  const renderContent = () => {
    if (!hasData) return null;

    switch (outputType) {
      case 'number':
      case 'number_line':
        return renderNumberLine(data, outputType);
      case 'number_bar':
        return renderNumberBar(data);
      case 'bar':
        return renderBar(data);
      case 'stacked100':
        return renderStacked100(data);
      case 'line':
        return renderLine(data);
      case 'table':
        return renderTable(data);
      case 'list':
        return renderList(data);
      case 'text':
        return renderText(data);
      case 'status':
        return renderStatus(data);
      default:
        return <p className="text-slate-500">Unknown output type: {outputType}</p>;
    }
  };

  // Number + optional line chart
  const renderNumberLine = (data, type) => {
    if (!data) return null;

    // PHASE 6A: Handle possibleInfluencePercent for promotion heuristic
    const value = data.currentPercent ?? data.concentration ?? data.discoveryRate ?? data.top3Percent ?? data.possibleInfluencePercent;
    const showLine = type === 'number_line' && data.trend && data.trend.length >= 2;

    return (
      <div className="space-y-4">
        {value !== undefined && (
          <BigNumber value={`${value}%`} />
        )}
        {showLine && (
          <LineChartSimple
            data={data.trend.map(t => ({ label: t.label, value: t.value })).reverse()}
            valueLabel="%"
          />
        )}
        {/* PHASE 6A: Show top signals for promotion heuristic */}
        {data.topSignals && data.topSignals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Why flagged:</p>
            <ul className="space-y-1">
              {data.topSignals.slice(0, 3).map((signal, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  {signal.signal} ({signal.count})
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* PHASE 6A: Show message if no promotional signals */}
        {data.message && (
          <p className="text-sm text-slate-600">{data.message}</p>
        )}
      </div>
    );
  };

  // Number + bar chart for topic variety
  const renderNumberBar = (data) => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        <BigNumber value={data.topicCount} label="topics detected" />
        {data.topTopics && data.topTopics.length > 0 && (
          <BarChartSimple data={data.topTopics} valueLabel="%" />
        )}
        {data.unclassifiedNote && (
          <p className="text-xs text-slate-400 italic">
            {data.unclassifiedNote}
          </p>
        )}
      </div>
    );
  };

  // Horizontal bar chart
  const renderBar = (data) => {
    if (!data) return null;

    // PHASE 6A: Handle bars field for promo themes
    const bars = data.bars || data;
    if (!Array.isArray(bars)) return null;

    return (
      <div className="space-y-3">
        <BarChartSimple data={bars} valueLabel="%" />
        {/* PHASE 6A: Show note if present */}
        {data.note && (
          <p className="text-xs text-slate-400 italic">{data.note}</p>
        )}
      </div>
    );
  };

  // 100% stacked bar
  const renderStacked100 = (data) => {
    if (!data) return null;
    const segments = data.segments || data;
    if (!Array.isArray(segments)) return null;
    return (
      <div className="space-y-3">
        <StackedBar100 segments={segments} />
        {/* PHASE 6A: Show disclaimer if present (political leaning) */}
        {data.disclaimer && (
          <p className="text-xs text-slate-400 italic">{data.disclaimer}</p>
        )}
      </div>
    );
  };

  // Line chart
  const renderLine = (data) => {
    if (!data) return null;
    const trend = data.trend || data;
    if (!Array.isArray(trend) || trend.length < 2) return null;

    // Reverse to show oldest to newest
    const chartData = [...trend].reverse().map(t => ({
      label: t.label,
      value: t.value,
    }));

    return (
      <div className="space-y-2">
        <LineChartSimple data={chartData} valueLabel="%" />
        {data.direction && (
          <p className="text-sm text-center text-slate-600">
            Trend: <span className="font-medium">{data.direction}</span>
          </p>
        )}
      </div>
    );
  };

  // Table
  const renderTable = (data) => {
    if (!data) return null;

    // PHASE 6A: Handle rows field for creator-topic and creator-tone views
    const rows = data.rows || data;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    // Auto-detect columns from first row
    const firstRow = rows[0];
    const columns = Object.keys(firstRow).map(key => ({
      key,
      label: formatColumnLabel(key),
      align: typeof firstRow[key] === 'number' || key.includes('Percent') || key.includes('posts') || key.includes('count') ? 'right' : 'left',
    }));

    return (
      <div className="space-y-3">
        {/* PHASE 6A: Show takeaway above table if present */}
        {data.takeaway && (
          <p className="text-sm text-slate-700 font-medium bg-blue-50 px-3 py-2 rounded-lg">
            {data.takeaway}
          </p>
        )}
        <SimpleTable columns={columns} rows={rows} />
      </div>
    );
  };

  // List
  const renderList = (data) => {
    if (!data) return null;

    // Handle different data shapes
    let items = [];
    let note = null;

    if (Array.isArray(data)) {
      items = data.map(d => ({
        text: d.topic || d.label || d,
        isUnclassified: d.isUnclassified || false,
        subtext: d.share !== undefined ? `${d.share}%` : null,
      }));
    } else if (data.tips) {
      items = data.tips.map(t => ({ text: t, isUnclassified: false }));
    } else if (data.interests) {
      items = data.interests.map(i => ({ text: i, isUnclassified: false }));
    } else if (data.rareTopics) {
      // PHASE 6A: Handle rare topics format
      items = data.rareTopics.map(t => ({
        text: t.topic,
        isUnclassified: false,
        subtext: `${t.share}% of feed`,
      }));
    } else if (data.topics) {
      // PHASE 6A: Handle topics array (for algo-topics-avoided)
      items = data.topics.map(t => ({
        text: t,
        isUnclassified: false,
      }));
    } else if (data.blindSpots) {
      // PHASE 6A: Handle political blind spots
      items = data.blindSpots.map(b => ({
        text: b,
        isUnclassified: false,
      }));
    }

    // Check for notes
    note = dataResult?.data?.unclassifiedNote || data.note || data.message;

    // PHASE 6A: Show message if no items
    if (items.length === 0) {
      if (data.message) {
        return <p className="text-sm text-slate-600">{data.message}</p>;
      }
      return null;
    }

    return (
      <div className="space-y-3">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-slate-700">
              <span className={item.isUnclassified ? 'text-slate-400 mt-1' : 'text-primary-blue mt-1'}>•</span>
              <span className={item.isUnclassified ? 'text-slate-500 italic' : ''}>
                {typeof item === 'string' ? item : item.text}
                {item.subtext && (
                  <span className="text-xs text-slate-400 ml-2">({item.subtext})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {note && (
          <p className="text-xs text-slate-400 italic">
            {note}
          </p>
        )}
      </div>
    );
  };

  // Text/insight card
  const renderText = (data) => {
    if (!data) return null;

    let content = [];
    if (data.insights) {
      content = data.insights;
    } else if (data.predictions) {
      content = data.predictions;
    } else if (data.interests) {
      content = [`Interests: ${data.interests.join(', ')}`];
    } else if (typeof data === 'string') {
      content = [data];
    }

    if (content.length === 0) return null;

    return <InsightCard content={content} />;
  };

  // Status card
  const renderStatus = (data) => {
    if (!data) return null;

    const status = data.status || data.breadth || data.diversity || data.stability || data.riskLevel || 'Unknown';
    const variant = getStatusVariant(status, data);
    const description = data.factors?.join('. ') || data.description;

    return <StatusCard status={status} variant={variant} description={description} />;
  };

  // Helper to format column labels
  const formatColumnLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Helper to determine status variant
  const getStatusVariant = (status, data) => {
    const s = status.toLowerCase();
    if (s.includes('broad') || s.includes('high') || s.includes('balanced') || s.includes('low') && data?.riskLevel) {
      return data?.riskLevel === 'low' ? 'positive' : 'positive';
    }
    if (s.includes('narrow') || s.includes('skewed') || s.includes('high') && data?.riskLevel) {
      return 'warning';
    }
    if (s.includes('moderate') || s.includes('stable') || s.includes('changing')) {
      return 'neutral';
    }
    return 'neutral';
  };

  // Card container styles based on hierarchy
  const getCardClasses = () => {
    const baseClasses = 'bg-surface-card border rounded-2xl overflow-hidden flex flex-col transition-all';

    if (isSummaryCard) {
      return `${baseClasses} border-primary-blue/30 ring-1 ring-primary-blue/10`;
    }

    if (isPrimary && hasData) {
      // Primary cards with data: stronger visual presence
      return `${baseClasses} border-slate-300 ring-1 ring-slate-200/50 shadow-sm`;
    }

    if (isPrimary && !hasData) {
      // Primary cards without data: subtle emphasis
      return `${baseClasses} border-slate-200 bg-slate-50/30`;
    }

    if (isFutureCard) {
      // Future feature cards: visually muted
      return `${baseClasses} border-slate-100 bg-slate-50/50 opacity-75`;
    }

    // Secondary/supporting cards: lighter borders
    return `${baseClasses} border-slate-100`;
  };

  // Header styles based on hierarchy
  const getHeaderClasses = () => {
    if (isSummaryCard) {
      return 'px-5 py-4 border-b border-primary-blue/20 bg-primary-blue/5';
    }

    if (isPrimary && hasData) {
      return 'px-5 py-4 border-b border-slate-200 bg-slate-50/50';
    }

    if (isFutureCard) {
      return 'px-5 py-3 border-b border-slate-100';
    }

    return 'px-5 py-4 border-b border-border-card';
  };

  return (
    <div className={getCardClasses()}>
      {/* Card Header */}
      <div className={getHeaderClasses()}>
        {isSummaryCard && (
          <span className="inline-block text-xs font-semibold text-primary-blue uppercase tracking-wide mb-1">
            What This Means for You
          </span>
        )}
        {isPrimary && !isSummaryCard && hasData && (
          <span className="inline-block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            Key Insight
          </span>
        )}
        <h3 className={`font-semibold text-text-main mb-1 ${isFutureCard ? 'text-sm text-slate-500' : 'text-base'}`}>
          {title}
        </h3>
        <p className={`text-sm line-clamp-2 ${isFutureCard ? 'text-slate-400' : 'text-text-muted'}`}>
          {description}
        </p>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-5">
        {hasData ? (
          <div className="space-y-4">
            {/* Main visualization */}
            {renderContent()}

            {/* PHASE 7: Why explanation - how insight was inferred */}
            {whyExplanation && (
              <WhyExplanation text={whyExplanation} />
            )}

            {/* Takeaway - styled differently for summary cards */}
            {takeawayText && (
              <div className="pt-4 border-t border-border-card">
                {isSummaryCard && (
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    What does this say about my feed?
                  </p>
                )}
                <p className="text-sm text-slate-700 font-medium">
                  {takeawayText}
                </p>
              </div>
            )}

            {/* PHASE 7: Counterfactual framing for PRIMARY cards only */}
            {isPrimary && counterfactual && (
              <CounterfactualNote text={counterfactual} />
            )}

            {/* Action - styled differently for summary cards */}
            {actionText && (
              <div>
                {isSummaryCard && (
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    What can I do if I want this to change?
                  </p>
                )}
                <p className={`text-sm ${isSummaryCard ? 'text-slate-600' : 'text-slate-500 italic'}`}>
                  {actionText}
                </p>
              </div>
            )}

            {/* Confidence disclaimer for influence-related cards */}
            {/* PHASE 6A: Show actual disclaimer from data if available */}
            {confidenceDisclaimer && hasData && (
              <div className="pt-2 border-t border-slate-100">
                {data?.confidence && (
                  <span className={`inline-block text-xs px-2 py-0.5 rounded mb-1 ${
                    data.confidence === 'LOW' || data.confidence === 'VERY_LOW'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {data.confidence} confidence
                  </span>
                )}
                <p className="text-xs text-slate-400 italic">
                  {data?.disclaimer || 'This insight is based on repeated patterns, not confirmed intent.'}
                </p>
              </div>
            )}

            {/* PHASE 7: Non-functional feedback affordance for PRIMARY cards only */}
            {isPrimary && hasData && (
              <FeedbackAffordance />
            )}

            {/* Data quality footer - shows ACTUAL scan count used for this metric */}
            {/* PHASE 5: Using actualScansUsed for accurate labeling */}
            {hasData && actualScansUsed > 0 && (
              <DataQualityFooter
                scanCount={actualScansUsed}
                platformCount={platformCount}
              />
            )}
          </div>
        ) : (
          <EmptyState emptyStateType={emptyStateType} missing={missing} />
        )}
      </div>
    </div>
  );
};

export default ViewCard;
