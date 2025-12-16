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
 * FeedbackAffordance - Phase 10: Very minimal, almost invisible
 * Only appears on interaction - doesn't compete for attention
 */
const FeedbackAffordance = () => {
  const [selected, setSelected] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  if (selected) {
    return (
      <div className="pt-2">
        <p className="text-[11px] text-slate-400 italic">
          Thanks for the feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-3">
      {!showOptions ? (
        <button
          onClick={() => setShowOptions(true)}
          className="text-[11px] text-slate-400 hover:text-slate-500 transition-colors"
        >
          Does this match your experience?
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Match?</span>
          {['Yes', 'Somewhat', 'No'].map((option) => (
            <button
              key={option}
              onClick={() => setSelected(option)}
              className="px-2 py-0.5 text-[11px] rounded bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
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
 * Phase 8: UX Simplification
 *   - Increased whitespace for visual breathing room
 *   - Takeaways visually dominant over data/charts
 *   - Reduced emphasis on charts
 *   - Simplified feedback affordance
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

  // Card container styles based on hierarchy - Phase 10: assertive visual hierarchy
  const getCardClasses = () => {
    const baseClasses = 'bg-surface-card border rounded-2xl overflow-hidden flex flex-col transition-all';

    if (isSummaryCard) {
      return `${baseClasses} border-primary-blue/20 ring-1 ring-primary-blue/10 shadow-sm`;
    }

    if (isPrimary && hasData) {
      // Primary cards with data: unmistakable presence, larger shadow
      return `${baseClasses} border-slate-200 shadow-md ring-1 ring-slate-100`;
    }

    if (isPrimary && !hasData) {
      // Primary cards without data: subtle
      return `${baseClasses} border-slate-100 bg-slate-50/30`;
    }

    if (isFutureCard) {
      // Future feature cards: visually muted
      return `${baseClasses} border-slate-100 bg-slate-50/30 opacity-50`;
    }

    // Secondary/supporting cards: clearly secondary, muted
    return `${baseClasses} border-slate-100/80 bg-slate-50/20`;
  };

  // Header styles based on hierarchy - Phase 10: clear visual distinction
  const getHeaderClasses = () => {
    if (isSummaryCard) {
      return 'px-7 py-6 border-b border-primary-blue/10 bg-primary-blue/5';
    }

    if (isPrimary && hasData) {
      // Primary: generous padding, clean background
      return 'px-7 py-6 border-b border-slate-100 bg-white';
    }

    if (isFutureCard) {
      return 'px-5 py-3 border-b border-slate-100';
    }

    // Secondary: smaller, lighter
    return 'px-5 py-4 border-b border-slate-50 bg-slate-50/30';
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
          <span className="inline-block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
            Key Insight
          </span>
        )}
        <h3 className={`font-semibold text-text-main ${
          isPrimary && hasData ? 'text-lg mb-1.5' :
          isFutureCard ? 'text-sm text-slate-500 mb-1' :
          'text-base mb-1'
        }`}>
          {title}
        </h3>
        <p className={`line-clamp-2 ${
          isPrimary && hasData ? 'text-sm text-text-muted' :
          isFutureCard ? 'text-xs text-slate-400' :
          'text-xs text-slate-400'
        }`}>
          {description}
        </p>
      </div>

      {/* Card Content - Phase 10: clear hierarchy in content area */}
      <div className={`flex-1 ${isPrimary && hasData ? 'p-7' : 'p-5'}`}>
        {hasData ? (
          <div className="space-y-5">
            {/* Takeaway FIRST for primary cards - makes it visually dominant */}
            {isPrimary && takeawayText && (
              <div className="pb-5 mb-3 border-b border-slate-100">
                <p className="text-xl text-slate-800 font-semibold leading-relaxed tracking-tight">
                  {takeawayText}
                </p>
              </div>
            )}

            {/* Main visualization - reduced emphasis for primary cards */}
            <div className={isPrimary ? 'opacity-90' : ''}>
              {renderContent()}
            </div>

            {/* Why explanation - how insight was inferred */}
            {whyExplanation && (
              <WhyExplanation text={whyExplanation} />
            )}

            {/* Takeaway for non-primary cards - smaller, muted */}
            {!isPrimary && takeawayText && (
              <div className="pt-3 border-t border-slate-50">
                {isSummaryCard && (
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Summary
                  </p>
                )}
                <p className={`${isSummaryCard ? 'text-sm text-slate-700 font-medium' : 'text-sm text-slate-600'}`}>
                  {takeawayText}
                </p>
              </div>
            )}

            {/* Counterfactual framing for PRIMARY cards only */}
            {isPrimary && counterfactual && (
              <CounterfactualNote text={counterfactual} />
            )}

            {/* Action - gentle, optional tone */}
            {actionText && (
              <div className="pt-3">
                {isSummaryCard && (
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Something you could try
                  </p>
                )}
                <p className={`text-sm ${isSummaryCard ? 'text-slate-600' : 'text-slate-500'}`}>
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
