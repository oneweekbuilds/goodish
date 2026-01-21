import React, { useState } from 'react';
import EmptyState, { EMPTY_STATE_TYPES } from './EmptyState';
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
import { QUALITY_FLAGS } from '../../lib/dashboard/dataHelpers';

/**
 * FeedbackAffordance - REMOVED (C10 fix)
 * Non-functional UI removed to avoid confusion
 */

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
 * HowWeMeasureSection - Standardized disclosure block for expanded evidence
 */
const HowWeMeasureSection = ({ what, how, limitations, scope, unclassifiedNote }) => {
  const hasContent = what || how || limitations || scope || unclassifiedNote;
  if (!hasContent) return null;

  const Row = ({ label, text }) => {
    if (!text) return null;
    return (
      <p className="text-xs leading-relaxed text-slate-600">
        <span className="font-semibold text-slate-500 mr-1">{label}</span>
        <span className="text-slate-600">{text}</span>
      </p>
    );
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
        How we measure
      </p>
      <div className="space-y-1.5">
        <Row label="What this measures:" text={what} />
        <Row label="How we measure it:" text={how} />
        <Row label="Limitations:" text={limitations} />
        <Row label="Scope:" text={scope} />
        <Row label="Notes:" text={unclassifiedNote} />
      </div>
    </div>
  );
};

/**
 * ViewCard component - UI Refoundation
 *
 * Card Anatomy Contract:
 * 1. Eyebrow label (small, muted)
 * 2. Title (clear, max 2 lines)
 * 3. Takeaway sentence (LARGEST TEXT)
 * 4. Optional chart (visually de-emphasized, max-height 120px)
 * 5. Why explanation (small)
 *
 * @param {Object} view - View configuration from dashboardCatalog
 * @param {Object} dataResult - Result from data helper function
 * @param {number} scanCount - Total number of scans
 * @param {number} platformCount - Number of platforms scanned
 * @param {string} accentColor - 'blue' or 'green' for semantic color lane
 * @param {boolean} isFullWidth - Full width card (primary/summary)
 * @param {boolean} isInline - Inline card (inside expandable section)
 */
const ViewCard = ({
  view,
  dataResult,
  scanCount = 0,
  platformCount = 0,
  accentColor = 'blue',
  isFullWidth = false,
  isInline = false,
  hideTitle = false,
  hideDescription = false,
  scopeLabel = null,
}) => {
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
  const viewTab = view?.tab;
  const hasData = dataResult?.hasData === true;
  const data = dataResult?.data;
  const missing = dataResult?.missing;
  const chartQuality = dataResult?.chartQuality;
  const suppressInlineHeroTakeaway = isInline && view?.hero;

  // PHASE 11: Quality gating - check if data quality passes threshold
  // Even if hasData is true, we may need to show insufficient data state
  const qualityOk = !chartQuality || chartQuality.quality === QUALITY_FLAGS.OK;
  const showChart = hasData && qualityOk;
  const microVisual = showChart ? (dataResult?.micro || data?.micro) : null;

  // PHASE 5: Use the ACTUAL scans used for this metric, not total scan count
  // This ensures "Based on X scans" labels are accurate for each view
  const actualScansUsed = dataResult?.scansUsed ?? scanCount;

  // Determine if this is a future/coming soon card
  const isFutureCard = sortOrder === 'future' || emptyStateType === 'future_feature';

  // Determine the empty state type based on quality flag
  const effectiveEmptyStateType = chartQuality?.quality && chartQuality.quality !== QUALITY_FLAGS.OK
    ? EMPTY_STATE_TYPES.INSUFFICIENT_DATA
    : emptyStateType;

  // Compute takeaway text
  const takeawayText = (!suppressInlineHeroTakeaway && hasData && typeof takeaway === 'function')
    ? takeaway(data)
    : null;

  // Compute action text
  const actionText = hasData && typeof action === 'function'
    ? action(data)
    : null;

  /**
   * ChartContainer - UI Refoundation: Enforce reduced opacity for chart portions only
   * Contract: opacity 0.8 for visual de-emphasis on secondary cards
   * Max-height is enforced by the chart components themselves (120px for lines)
   */
  const deemphasizeCharts = !isPrimary;

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
  // UI Refoundation: Chart portion de-emphasized on secondary cards
  const renderNumberLine = (data, type) => {
    if (!data) return null;

    // PHASE 6A: Handle possibleInfluencePercent for promotion heuristic
    const value = data.currentPercent ?? data.concentration ?? data.discoveryRate ?? data.top3Percent ?? data.possibleInfluencePercent;
    let showLine = type === 'number_line' && data.trend && data.trend.length >= 2;
    const isAttentionTactics = data?.flaggedCount !== undefined && data?.totalPosts !== undefined && data?.status !== undefined;
    let trendNote = null;

    if (showLine) {
      const labels = new Set(data.trend.map((t) => t.label));
      const values = new Set(data.trend.map((t) => t.value));
      const hasMeaningfulTrend = labels.size > 1 && values.size > 1;
      if (!hasMeaningfulTrend) {
        showLine = false;
        trendNote = viewTab === 'ads'
          ? 'Ad levels were stable across this period.'
          : 'No meaningful day-to-day variation detected in this window.';
      }
    }

    return (
      <div className="space-y-4">
        {value !== undefined && (
          <BigNumber
            value={`${value}%`}
            color={isAttentionTactics ? 'text-slate-700' : 'text-text-main'}
            className={isAttentionTactics ? 'tracking-tight' : ''}
          />
        )}
        {isAttentionTactics && (
          <p className="text-xs text-slate-500 text-center">Flagged in this scan</p>
        )}
        {showLine && (
          <div className={deemphasizeCharts ? 'opacity-80' : ''}>
            <LineChartSimple
              data={data.trend.map(t => ({ label: t.label, value: t.value })).reverse()}
              valueLabel="%"
            />
          </div>
        )}
        {trendNote && (
          <p className="text-xs text-slate-500 text-center">{trendNote}</p>
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
  // UI Refoundation: Chart portion de-emphasized on secondary cards
  const renderNumberBar = (data) => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        <BigNumber value={data.topicCount} label="topics detected" />
        {data.topTopics && data.topTopics.length > 0 && (
          <div className={deemphasizeCharts ? 'opacity-80' : ''}>
            <BarChartSimple data={data.topTopics} valueLabel="%" />
          </div>
        )}
        {data.unclassifiedNote && !isInline && (
          <p className="text-xs text-slate-400 italic">
            {data.unclassifiedNote}
          </p>
        )}
      </div>
    );
  };

  // Horizontal bar chart
  // UI Refoundation: De-emphasized on secondary cards
  const renderBar = (data) => {
    if (!data) return null;

    // PHASE 6A: Handle bars field for promo themes
    const bars = data.bars || data;
    if (!Array.isArray(bars)) return null;

    return (
      <div className="space-y-3">
        <div className={deemphasizeCharts ? 'opacity-80' : ''}>
          <BarChartSimple data={bars} valueLabel="%" />
        </div>
        {/* PHASE 6A: Show note if present */}
        {data.note && (
          <p className="text-xs text-slate-400 italic">{data.note}</p>
        )}
      </div>
    );
  };

  // 100% stacked bar
  // UI Refoundation: De-emphasized on secondary cards
  const renderStacked100 = (data) => {
    if (!data) return null;
    const segments = data.segments || data;
    if (!Array.isArray(segments)) return null;
    return (
      <div className="space-y-3">
        <div className={deemphasizeCharts ? 'opacity-80' : ''}>
          <StackedBar100 segments={segments} />
        </div>
        {/* PHASE 6A: Show disclaimer if present (political leaning) */}
        {data.disclaimer && (
          <p className="text-xs text-slate-400 italic">{data.disclaimer}</p>
        )}
      </div>
    );
  };

  // Line chart
  // UI Refoundation: De-emphasized on secondary cards
  const renderLine = (data) => {
    if (!data) return null;
    const trend = data.trend || data;
    if (!Array.isArray(trend) || trend.length < 2) return null;

    const labels = new Set(trend.map((t) => t.label));
    const values = new Set(trend.map((t) => t.value));
    const hasMeaningfulTrend = labels.size > 1 && values.size > 1;
    if (!hasMeaningfulTrend) {
      return (
        <p className="text-xs text-center text-slate-500">
          {viewTab === 'ads'
            ? 'Ad levels were stable across this period.'
            : 'No meaningful day-to-day variation detected in this window.'}
        </p>
      );
    }

    // Reverse to show oldest to newest
    const chartData = [...trend].reverse().map(t => ({
      label: t.label,
      value: t.value,
    }));

    return (
      <div className="space-y-2">
        <div className={deemphasizeCharts ? 'opacity-80' : ''}>
          <LineChartSimple data={chartData} valueLabel="%" />
        </div>
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
    note = dataResult?.unclassifiedNote || dataResult?.data?.unclassifiedNote || data.note || data.message;

    // PHASE 6A: Show message if no items
    if (items.length === 0) {
      if (data.message) {
        return <p className="text-sm text-slate-600">{data.message}</p>;
      }
      return null;
    }

    const unclassifiedItems = items.filter(item => item.isUnclassified);
    const mainItems = items.filter(item => !item.isUnclassified);

    // UI Refoundation: Bullet color uses semantic accent
    const bulletColor = accentColor === 'green' ? 'text-emerald-500' : 'text-primary-blue';

    return (
      <div className="space-y-3">
        {mainItems.length > 0 && (
          <ul className="space-y-2">
            {mainItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-slate-700">
                <span className={`${bulletColor} mt-1`}>•</span>
                <span>
                  {typeof item === 'string' ? item : item.text}
                  {item.subtext && (
                    <span className="text-xs text-slate-400 ml-2">({item.subtext})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {unclassifiedItems.length > 0 && (
          <p className="text-xs text-slate-400 italic">
            Other / couldn&apos;t categorize: {unclassifiedItems.map(item => (typeof item === 'string' ? item : item.text)).join(', ')}
          </p>
        )}
        {note && !isInline && (
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

    // Special handling for creator concentration with context line and top creators
    if (data.primaryInsight) {
      return (
        <div className="space-y-3">
          {/* Primary insight */}
          <p className="text-slate-700 leading-relaxed">
            {data.primaryInsight}
          </p>
          {/* Oura-style context line */}
          {data.contextLine && (
            <p className="text-sm text-slate-600 leading-relaxed italic">
              {data.contextLine}
            </p>
          )}
          {/* Top creators list - visually secondary */}
          {data.topCreators && data.topCreators.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2 font-medium">Top accounts in this scan:</p>
              <ul className="space-y-1">
                {data.topCreators.slice(0, 5).map((c, idx) => (
                  <li key={idx} className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="text-slate-400">{idx + 1}.</span>
                    <span>{c.creator}</span>
                    <span className="text-slate-400">({c.share}%)</span>
                  </li>
                ))}
                {data.topCreators.length > 5 && (
                  <li className="text-xs text-slate-400 italic">
                    ...and {data.topCreators.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Standard handling for other text types
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

  // Micro visual renderers (Visual Metrics v1)
  const renderMicroVisual = (micro) => {
    if (!micro || !micro.type) return null;
    switch (micro.type) {
      case 'sparkline':
        return renderMicroSparkline(micro);
      case 'bar':
        return renderMicroBar(micro);
      case 'segments':
        return renderMicroSegments(micro);
      default:
        return null;
    }
  };

  const renderMicroSparkline = ({ points = [], color = '#0EA5E9' }) => {
    if (!points || points.length < 2) return null;
    const display = points.slice(-8);
    const values = display.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 72;
    const height = 32;
    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const coords = display.map((p, i) => {
      const x = padding + (i / Math.max(1, display.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((p.value - min) / range) * chartHeight;
      return { x, y };
    });
    const path = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="w-[88px] h-[36px] flex items-center justify-end">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  };

  const renderMicroBar = ({ value = 0, color = '#0EA5E9' }) => {
    const safeValue = Math.max(0, Math.min(100, value));
    return (
      <div className="w-[88px] h-[12px] rounded-full bg-slate-100 overflow-hidden border border-slate-200">
        <div
          className="h-full rounded-full"
          style={{ width: `${safeValue}%`, background: color, transition: 'width 0.2s ease' }}
        />
      </div>
    );
  };

  const renderMicroSegments = ({ segments = [] }) => {
    if (!segments || segments.length === 0) return null;
    const total = segments.reduce((sum, s) => sum + (s.value || 0), 0) || 1;
    const palette = ['#0EA5E9', '#22C55E', '#94A3B8'];
    return (
      <div className="w-[96px] h-[14px] rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex">
        {segments.slice(0, 3).map((s, idx) => {
          const widthPct = Math.max(0, Math.min(100, (s.value / total) * 100));
          return (
            <div
              key={s.label || idx}
              title={s.label}
              style={{ width: `${widthPct}%`, background: palette[idx % palette.length] }}
              className="h-full"
            />
          );
        })}
      </div>
    );
  };

  // Semantic accent classes based on color lane
  const accentBorder = accentColor === 'green' ? 'border-emerald-200' : 'border-primary-blue/20';
  const accentRing = accentColor === 'green' ? 'ring-emerald-100' : 'ring-primary-blue/10';
  const accentBg = accentColor === 'green' ? 'bg-emerald-50/50' : 'bg-primary-blue/5';
  const accentText = accentColor === 'green' ? 'text-emerald-600' : 'text-primary-blue';

  // Card container styles - UI Refoundation: Lighter borders, quieter than hero
  const getCardClasses = () => {
    // Inline cards (inside expandable) have no container styling
    if (isInline) {
      return '';
    }

    const baseClasses = 'bg-white rounded-2xl overflow-hidden flex flex-col transition-all';

    if (isSummaryCard) {
      // Summary: muted, full-width, very subtle
      return baseClasses;
    }

    if (isPrimary && hasData) {
      // Primary: lighter presence than before
      return baseClasses;
    }

    if (isPrimary && !hasData) {
      return `${baseClasses} bg-slate-50/30`;
    }

    if (isFutureCard) {
      return `${baseClasses} bg-slate-50/30 opacity-50`;
    }

    // Secondary: muted background, light border
    return `${baseClasses} bg-slate-50/20`;
  };

  // Card container inline styles for lighter borders
  const getCardStyles = () => {
    if (isInline) return {};

    if (isSummaryCard) {
      return {
        border: '1px solid rgba(226, 232, 240, 0.5)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      };
    }

    if (isPrimary && hasData) {
      return {
        border: '1px solid rgba(148, 163, 184, 0.7)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
      };
    }

    if (isFutureCard) {
      return {
        border: '1px solid rgba(226, 232, 240, 0.4)',
      };
    }

    // Secondary cards
    return {
      border: '1px solid rgba(226, 232, 240, 0.5)',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
    };
  };

  // Header styles - UI Refoundation: Increased padding for readability
  const getHeaderClasses = () => {
    if (isInline) {
      return 'pb-4';
    }

    if (isSummaryCard) {
      return `px-7 py-6 ${accentBg}`;
    }

    if (isPrimary && hasData) {
      return 'px-8 py-7 bg-white border-b border-slate-100';
    }

    if (isFutureCard) {
      return 'px-6 py-4';
    }

    // Secondary: increased padding
    return 'px-6 py-5';
  };

  // Header bottom border styles (lighter)
  const getHeaderBorderStyles = () => {
    if (isInline) return {};
    return {
      borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
    };
  };

  // Content padding based on card type - increased for readability
  const getContentPadding = () => {
    if (isInline) return '';
    if (isPrimary && hasData) return 'p-8';
    if (isSummaryCard) return 'p-7';
    return 'p-6';
  };

  const showSummaryEyebrow = isSummaryCard;
  const showPrimaryEyebrow = isPrimary && !isSummaryCard && hasData && !isInline;
  const showTitle = !hideTitle;
  const showDescription = !hideDescription && !isInline;
  const shouldRenderHeader = showSummaryEyebrow || showPrimaryEyebrow || showTitle || showDescription;
  const unclassifiedNote = dataResult?.unclassifiedNote || data?.unclassifiedNote;

  // Standardized "How we measure" content (only shown when evidence is expanded)
  const measurementTotalItems = chartQuality?.n_items
    ?? data?.totalPosts
    ?? data?.totalItems
    ?? dataResult?.totalItems;
  const measurementScopeParts = [];
  if (!scopeLabel) {
    if (actualScansUsed > 1) {
      measurementScopeParts.push(`Across ${actualScansUsed} scans`);
    } else if (actualScansUsed === 1) {
      measurementScopeParts.push('This scan');
    }
    if (platformCount > 0) {
      measurementScopeParts.push(`${platformCount} platform${platformCount !== 1 ? 's' : ''}`);
    }
    if (measurementTotalItems) {
      measurementScopeParts.push(`${measurementTotalItems} posts analyzed`);
    }
  }
  const measurementScope = scopeLabel || measurementScopeParts.join(' · ') || null;
  const measurementWhat = description;
  const measurementHow = whyExplanation || data?.whyExplanation;
  const measurementLimitations = view?.limitations
    || dataResult?.limitations
    || data?.limitations
    || ((chartQuality?.quality && chartQuality.quality !== QUALITY_FLAGS.OK) ? chartQuality?.quality_reason : null);
  const shouldShowHowWeMeasure = isInline && showChart;
  const shouldShowWhyExplanation = whyExplanation && !shouldShowHowWeMeasure;

  return (
    <div className={getCardClasses()} style={getCardStyles()}>
      {/* Card Header - Anatomy: Eyebrow → Title → Description */}
      {shouldRenderHeader && (
        <div className={`${getHeaderClasses()} ${microVisual ? 'flex items-start gap-3' : ''}`} style={getHeaderBorderStyles()}>
          <div className="flex-1 min-w-0">
            {/* Eyebrow label with semantic accent */}
            {showSummaryEyebrow && (
              <span className={`inline-block text-[10px] font-medium uppercase tracking-widest mb-2 opacity-60 ${accentText}`}>
                Summary
              </span>
            )}
            {showPrimaryEyebrow && (
              <span className={`inline-block text-[10px] font-medium uppercase tracking-widest mb-2 opacity-60 ${accentText}`}>
                Key Insight
              </span>
            )}
            {/* Title */}
            {showTitle && (
              <h3 className={`font-semibold line-clamp-2 ${
                isPrimary && hasData ? 'text-lg text-slate-700' :
                isFutureCard ? 'text-sm text-slate-500' :
                'text-base text-text-main'
              }`}>
                {title}
              </h3>
            )}
            {/* Description - subtle */}
            {showDescription && (
              <p className={`mt-1 line-clamp-2 ${
                isPrimary && hasData ? 'text-sm text-text-muted' :
                'text-xs text-slate-400'
              }`}>
                {description}
              </p>
            )}
          </div>

          {microVisual && (
            <div className="shrink-0 pt-1">{renderMicroVisual(microVisual)}</div>
          )}
        </div>
      )}

      {/* Card Content - Anatomy: Takeaway (largest) → Chart (de-emphasized) → Why */}
      {/* PHASE 11: Use showChart (hasData AND quality OK) instead of just hasData */}
      <div className={`flex-1 ${getContentPadding()}`}>
        {showChart ? (
          <div className="space-y-5">
            {/* Takeaway FIRST for primary cards - makes it visually dominant */}
            {isPrimary && takeawayText && (
              <div className="pb-6 mb-5 border-b border-slate-200">
                <p className="text-xl text-slate-900 font-semibold leading-relaxed tracking-tight">
                  {takeawayText}
                </p>
              </div>
            )}

            {/* Main visualization - reduced emphasis for primary cards */}
            <div className={isPrimary ? 'opacity-75' : ''}>
              {renderContent()}
            </div>

            {/* Standardized measurement disclosure for expanded evidence */}
            {shouldShowHowWeMeasure && (
              <HowWeMeasureSection
                what={measurementWhat}
                how={measurementHow}
                limitations={measurementLimitations}
                scope={measurementScope}
                unclassifiedNote={unclassifiedNote}
              />
            )}

            {/* Why explanation - how insight was inferred */}
            {shouldShowWhyExplanation && (
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
            {confidenceDisclaimer && showChart && (
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

            {/* Data quality footer - shows ACTUAL scan count used for this metric */}
            {/* PHASE 5: Using actualScansUsed for accurate labeling */}
            {/* PHASE 11: Also shows n_items from chartQuality when available */}
            {showChart && actualScansUsed > 0 && (
              <DataQualityFooter
                scanCount={actualScansUsed}
                platformCount={platformCount}
                scopeLabel={scopeLabel}
              />
            )}
          </div>
        ) : (
          <EmptyState
            emptyStateType={effectiveEmptyStateType}
            missing={chartQuality?.quality_reason || missing}
            chartQuality={chartQuality}
          />
        )}
      </div>
    </div>
  );
};

export default ViewCard;
