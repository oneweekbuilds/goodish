import React, { useState } from 'react';
import EmptyState, { EMPTY_STATE_TYPES } from './EmptyState';
import { QUALITY_FLAGS } from '../../lib/dashboard/dataHelpers';
import {
  NumberLineRenderer,
  NumberBarRenderer,
  BarRenderer,
  StackedBarRenderer,
  TrendSummaryRenderer,
  TableRenderer,
  ListRenderer,
  TextRenderer,
  StatusRenderer,
  renderMicroVisual,
} from './renderers';

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
    <p className="text-sm text-text-muted mt-3 leading-relaxed">
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
    <p className="text-sm text-text-muted italic mt-2 bg-primary-blue/5 px-3 py-2 rounded-lg">
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

  // FIX C5, PA8: Improve readability with better spacing and text size
  const Row = ({ label, text }) => {
    if (!text) return null;
    return (
      <p className="text-[13px] leading-relaxed text-text-muted">
        <span className="font-semibold text-text-main mr-1.5">{label}</span>
        <span className="text-text-muted">{text}</span>
      </p>
    );
  };

  return (
    <div className="mt-4 rounded-xl border border-border-light bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-3">
        How we measure
      </p>
      <div className="space-y-2.5">
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
  // Guard: Prevent crash if view is missing or malformed (defensive check for evidence rendering)
  if (!view || typeof view !== 'object') {
    return null;
  }

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

    const commonProps = {
      data,
      view,
      deemphasizeCharts: !isPrimary,
      isPrimary,
      isInline,
      accentColor,
      dataResult,
    };

    switch (outputType) {
      case 'number':
      case 'number_line':
        return <NumberLineRenderer {...commonProps} outputType={outputType} />;
      case 'number_bar':
        return <NumberBarRenderer {...commonProps} />;
      case 'bar':
        return <BarRenderer {...commonProps} />;
      case 'stacked100':
        return <StackedBarRenderer {...commonProps} />;
      case 'line':
        return <TrendSummaryRenderer {...commonProps} />;
      case 'table':
        return <TableRenderer {...commonProps} />;
      case 'list':
        return <ListRenderer {...commonProps} />;
      case 'text':
        return <TextRenderer {...commonProps} />;
      case 'status':
        return <StatusRenderer {...commonProps} />;
      default:
        return <p className="text-text-muted">Unknown output type: {outputType}</p>;
    }
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
      // Primary: lighter presence than before, with subtle accent border
      return `${baseClasses} border-l-3 ${accentBorder}`;
    }

    if (isPrimary && !hasData) {
      return `${baseClasses} bg-primary-blue/5`;
    }

    if (isFutureCard) {
      return `${baseClasses} bg-primary-blue/5 opacity-50`;
    }

    // Secondary: muted background, light border
    return `${baseClasses} bg-primary-blue/5`;
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
        borderLeft: 'none', // Left border handled by border-l-3 class
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
      return 'px-8 py-7 bg-white border-b border-border-light pl-9'; // Extra left padding for accent border
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
    if (isPrimary && hasData) return 'px-8 py-8 pl-9'; // Extra left padding for accent border
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
  // Counts removed - single master count displayed at tab bottom
  const measurementScope = scopeLabel || null;
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
                isPrimary && hasData ? 'text-lg text-text-main' :
                isFutureCard ? 'text-sm text-text-muted' :
                'text-base text-text-main'
              }`}>
                {title}
              </h3>
            )}
            {/* Description - subtle */}
            {showDescription && (
              <p className={`mt-1 line-clamp-2 ${
                isPrimary && hasData ? 'text-sm text-text-muted' :
                'text-xs text-text-muted'
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
              <div className="pb-6 mb-5 border-b border-border-light">
                <p className="text-xl text-text-main font-semibold leading-relaxed tracking-tight">
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

            {/* Takeaway for non-primary cards - emphasized for hierarchy */}
            {!isPrimary && takeawayText && (
              <div className="pt-3 border-t border-border-light">
                {isSummaryCard && (
                  <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
                    Summary
                  </p>
                )}
                <p className="text-sm font-medium text-text-main">
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
                  <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-2">
                    Something you could try
                  </p>
                )}
                <p className={`text-sm ${isSummaryCard ? 'text-text-muted' : 'text-text-muted'}`}>
                  {actionText}
                </p>
              </div>
            )}

            {/* Confidence disclaimer for influence-related cards */}
            {/* PHASE 6A: Show actual disclaimer from data if available */}
            {confidenceDisclaimer && showChart && (
              <div className="pt-2 border-t border-border-light">
                {data?.confidence && (
                  <span className={`inline-block text-[11px] px-2 py-0.5 rounded mb-1 ${
                    data.confidence === 'LOW' || data.confidence === 'VERY_LOW'
                      ? 'bg-status-warning/10 text-status-warning'
                      : 'bg-primary-blue/10 text-text-muted'
                  }`}>
                    {data.confidence} confidence
                  </span>
                )}
                <p className="text-sm text-text-muted italic">
                  {data?.disclaimer || 'This insight is based on repeated patterns, not confirmed intent.'}
                </p>
              </div>
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
