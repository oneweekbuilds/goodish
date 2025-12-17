import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, BarChart3, Clock, Globe, Database, Info, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { TABS, getViewsForTab, getVisibleViewCount, EMPTY_STATE_TYPES, TAB_TRUST_SENTENCES } from './dashboardCatalog';
import ViewCard from '../../components/dashboard/ViewCard';
import TalkToAlgorithmSection from '../../components/dashboard/TalkToAlgorithmSection';
import { useDashboardData } from '../../lib/dashboard/useDashboardData';
import * as dataHelpers from '../../lib/dashboard/dataHelpers';

/**
 * THEME CONSTANTS - Part 1 Color System
 * Rule A: All 5 dashboard tabs use BLUE theme
 * Rule B: Talk to Your Algorithm module uses GREEN theme everywhere
 */
export const THEME = {
  // Blue theme for all tabs (consistent, calm editorial product)
  blue: {
    accent: '#2563EB',
    accentLight: 'rgba(37, 99, 235, 0.1)',
    accentMedium: 'rgba(37, 99, 235, 0.15)',
    gradient: 'linear-gradient(180deg, rgba(37, 99, 235, 0.03) 0%, rgba(37, 99, 235, 0.06) 50%, rgba(37, 99, 235, 0.02) 100%)',
    border: 'rgba(37, 99, 235, 0.12)',
    shadow: '0 4px 24px rgba(37, 99, 235, 0.06)',
  },
  // Green theme ONLY for Talk to Your Algorithm module (premium standout)
  green: {
    accent: '#10B981',
    accentLight: 'rgba(16, 185, 129, 0.1)',
    accentMedium: 'rgba(16, 185, 129, 0.15)',
    gradient: 'linear-gradient(165deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(16, 185, 129, 0.07) 100%)',
    border: 'rgba(16, 185, 129, 0.15)',
    shadow: '0 4px 32px rgba(16, 185, 129, 0.1)',
  },
};

/**
 * SOLID SURFACE TOKENS - Solid Surfaces Strategy
 * Replace translucent everywhere with solid, intentional surfaces
 */
export const SURFACES = {
  // Hero chapter - solid light blue background
  HERO_BLUE: {
    background: '#EFF6FF', // solid light blue
    border: '1px solid #BFDBFE',
    shadow: '0 4px 24px rgba(37, 99, 235, 0.08)',
  },
  // Support cards in hero - solid white with clear border
  SUPPORT_WHITE: {
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  // Talk chapter - solid light green background
  TALK_GREEN: {
    background: '#ECFDF5', // solid light green
    border: '1px solid #A7F3D0',
    shadow: '0 4px 24px rgba(16, 185, 129, 0.1)',
  },
  // Content sections - solid white with border
  SECTION_WHITE: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    shadow: 'none',
  },
  // Alternating tint for visual rhythm
  SECTION_TINT: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    shadow: 'none',
  },
};

/**
 * CollapsedEmptyStateCard - Shows a composite placeholder when 3+ cards share the same empty state
 */
const CollapsedEmptyStateCard = ({ emptyStateType, count, tabName }) => {
  const configs = {
    [EMPTY_STATE_TYPES.NEEDS_MORE_SCANS]: {
      icon: <BarChart3 size={24} className="text-slate-400" />,
      title: `${count} More Insights Available`,
      message: `More insights about ${tabName.toLowerCase()} will appear as you scan more content.`,
      cta: { label: 'Run Another Scan', to: '/start' },
    },
    [EMPTY_STATE_TYPES.NEEDS_BROADER_BEHAVIOR]: {
      icon: <Globe size={24} className="text-slate-400" />,
      title: `${count} Cross-Platform Insights`,
      message: `These insights appear when you scan across more platforms.`,
      cta: { label: 'Scan Another Platform', to: '/start' },
    },
    [EMPTY_STATE_TYPES.FUTURE_FEATURE]: {
      icon: <Clock size={24} className="text-slate-400" />,
      title: `${count} Features Coming Soon`,
      message: `These insights require features that are still in development.`,
      cta: null,
    },
  };

  const config = configs[emptyStateType] || configs[EMPTY_STATE_TYPES.NEEDS_MORE_SCANS];

  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 col-span-full">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-600 mb-1">
            {config.title}
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            {config.message}
          </p>
          {config.cta && (
            <Link
              to={config.cta.to}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-blue hover:underline"
            >
              {config.cta.label}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * TabTrustSentence - Phase 10: Quiet, integrated trust note
 */
const TabTrustSentence = ({ tabId }) => {
  const sentence = TAB_TRUST_SENTENCES[tabId];
  if (!sentence) return null;

  return (
    <div className="mb-5">
      <p className="text-xs text-slate-400 leading-relaxed italic">
        {sentence}
      </p>
    </div>
  );
};

/**
 * SectionHeader - Part 3: Editorial section headers
 * More magazine-like, less dashboard-like
 * Always uses blue accent (Part 1 Rule A)
 *
 * Improvement 5:
 * - Increased title size by one step
 * - Taller, thicker accent bar
 * - Faint horizontal divider line extending right
 * - Enhanced visual prominence
 */
const SectionHeader = ({ title, subtitle, label, subtext }) => (
  <div className="mb-5 mt-12 first:mt-0"> {/* Increased top margin */}
    <div className="flex items-start gap-4">
      {/* Improvement 5: Taller, thicker blue vertical accent bar */}
      <div
        className="rounded-full flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, #2563EB, rgba(37, 99, 235, 0.35))',
          width: label ? '5px' : '4px', /* Thicker */
          height: label ? '56px' : '28px', /* Taller */
          marginTop: '2px',
        }}
      />
      <div className="flex-1 min-w-0">
        {/* Uppercase label */}
        {label && (
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: 'rgba(37, 99, 235, 0.65)' }}
          >
            {label}
          </p>
        )}
        {/* Main title - Improvement 5: Increased size */}
        <h3
          className={label ? "text-xl font-semibold text-slate-800 mb-1.5" : "text-sm font-semibold uppercase tracking-wider"}
          style={!label ? { color: 'rgba(37, 99, 235, 0.7)' } : undefined}
        >
          {title}
        </h3>
        {/* Subtext */}
        {subtext && (
          <p className="text-sm text-slate-500 leading-relaxed">
            {subtext}
          </p>
        )}
        {subtitle && !subtext && (
          <span className="text-xs text-slate-400">{subtitle}</span>
        )}
      </div>
    </div>
    {/* Improvement 5: Faint horizontal divider extending right */}
    {label && (
      <div
        className="mt-4 ml-9"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.15) 0%, rgba(226, 232, 240, 0.4) 30%, transparent 100%)',
        }}
      />
    )}
  </div>
);

/**
 * DataCoverageBar - Shows data coverage stats for a tab
 * PHASE 6A: Tab-level data coverage line
 */
const DataCoverageBar = ({ scans, scanDetails, tabId }) => {
  // Calculate aggregate stats
  const stats = useMemo(() => {
    if (!scans || scans.length === 0) return null;

    let totalItems = 0;
    const platformSet = new Set();

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (detail) {
        const data = detail.result || detail.scan || detail;
        const items = data?.feed_items || [];
        totalItems += items.length;
      }
      if (scan.platform) {
        platformSet.add(scan.platform.toLowerCase());
      }
    }

    return {
      scanCount: scans.length,
      platformCount: platformSet.size,
      platforms: Array.from(platformSet),
      totalItems,
    };
  }, [scans, scanDetails]);

  if (!stats) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-400">
      <Database size={12} className="text-slate-300" />
      <span>
        {stats.scanCount} scan{stats.scanCount !== 1 ? 's' : ''} · {stats.platformCount} platform{stats.platformCount !== 1 ? 's' : ''} · {stats.totalItems} posts
      </span>
    </div>
  );
};

/**
 * PoliticalLeaningToggle - Opt-in toggle for political leaning estimates
 * PHASE 6A: Political leaning requires explicit opt-in
 * UI Refoundation: Uses green accent (politics tab semantic color lane)
 */
const PoliticalLeaningToggle = ({ enabled, onToggle }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-lg border border-amber-100">
    <Info size={16} className="text-amber-600 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm text-amber-800">
        <span className="font-medium">Political leaning estimates</span> use keyword matching and are LOW confidence.
      </p>
      <p className="text-xs text-amber-600 mt-0.5">
        These are rough estimates, not facts about content or creators.
      </p>
    </div>
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
      style={{
        backgroundColor: enabled ? '#10B981' : '#E5E7EB',
        color: enabled ? 'white' : '#64748B',
      }}
    >
      {enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
      {enabled ? 'Enabled' : 'Enable'}
    </button>
  </div>
);

/**
 * HowToUnlockBox - Shows when a tab has insufficient data
 * PHASE 6A: Friendly guidance for sparse data
 */
const HowToUnlockBox = ({ tabId }) => {
  const tips = {
    ads: [
      'Run more scans to see promotional patterns',
      'Scan different platforms to compare ad loads',
      'Scan feeds with sponsored content for better detection',
    ],
    politics: [
      'Scan feeds that contain political content',
      'Run multiple scans over time to see trends',
      'Enable political leaning estimates for detailed analysis',
    ],
    patterns: [
      'Run at least 2-3 scans to see patterns emerge',
      'Scan different platforms to compare topic variety',
      'Give it time - patterns become clearer with more data',
    ],
    creators: [
      'Scan feeds with diverse creator content',
      'Run multiple scans to track which creators appear most',
      'Scan multiple platforms to find cross-platform creators',
    ],
    algorithm: [
      'Run more scans to build a clearer algorithmic profile',
      'Scan consistently over days/weeks for best results',
      'Diverse platform scans reveal more about targeting',
    ],
  };

  const tabTips = tips[tabId] || tips.patterns;

  return (
    <div className="col-span-full px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
      <p className="text-sm font-medium text-blue-800 mb-2">How to unlock more insights:</p>
      <ul className="text-sm text-blue-700 space-y-1">
        {tabTips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * ExpandableDetailRow - Inline expandable row replacing "View" buttons
 * UI Refoundation: No "View" buttons allowed - use inline expand
 */
const ExpandableDetailRow = ({ view, dataResult, isExpanded, onToggle, accentColor }) => {
  const hasData = dataResult?.hasData;
  const takeawayText = hasData && typeof view.takeaway === 'function'
    ? view.takeaway(dataResult?.data)
    : null;

  return (
    <div
      className="first:border-t-0"
      style={{ borderTop: '1px solid rgba(226, 232, 240, 0.4)' }}
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-600">
            {view.title}
          </h4>
          {!isExpanded && takeawayText && (
            <p className="text-xs text-slate-400 mt-1 truncate">
              {takeawayText}
            </p>
          )}
        </div>
        <span
          className="text-xs font-medium transition-colors"
          style={{
            color: accentColor === 'green'
              ? 'rgba(16, 185, 129, 0.75)'
              : 'rgba(37, 99, 235, 0.7)',
          }}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </span>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 pt-2">
          <ViewCard
            view={view}
            dataResult={dataResult}
            scanCount={0}
            platformCount={0}
            accentColor={accentColor}
            isInline={true}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Story-driven section header config for Algorithm tab
 * These headers guide the reader through a narrative
 */
const ALGORITHM_TAB_HEADERS = {
  keyInsight: {
    label: 'The pattern',
    title: 'What keeps showing up',
    subtext: 'The topic cluster your feed returns to most often.',
  },
  details: {
    label: 'Why it happens',
    title: 'How the pattern takes hold',
    subtext: 'Signals that reinforce the loop, even when you are not trying to.',
  },
  moreDetails: {
    label: 'What it leads to',
    title: 'Where this is heading',
    subtext: 'What you are likely to see more of if nothing changes.',
  },
  summary: {
    label: 'Shift it gently',
    title: 'What you could try',
    subtext: 'Small actions that nudge the system without turning your life upside down.',
  },
};

/**
 * ViewsGridWithCollapsing - Part 3: Editorial Stack Redesign
 *
 * Structure per tab (magazine-style, not dashboard):
 * - KEY INSIGHT: Declarative statement + collapsible evidence
 * - DETAILS: Softer backgrounds, headline + takeaway, 2 columns
 * - MORE DETAILS: Editorial drawer "Where this is heading"
 * - SUMMARY: Paragraph + 3 "Try this" actions max
 *
 * Part 1 Rule A: ALL tabs use BLUE accent
 *
 * Change 1: Stronger borders on all non-feature cards
 * Change 2: Story-driven headers for Algorithm tab
 * Change 3: "Where this is heading" uncollapsed by default
 */
const ViewsGridWithCollapsing = ({ views, viewDataResults, scanCount, platformCount, tabName, tabId }) => {
  // Check if we're on the Algorithm tab for story-driven headers
  const isAlgorithmTab = tabId === 'algorithm';

  // Track which sections are expanded
  // Change 3: moreDetails expanded by default on Algorithm tab
  const [expandedSections, setExpandedSections] = useState({
    keyInsightEvidence: false,
    moreDetails: false,
    summaryMore: false,
  });

  // Reset expanded state when tab changes
  useEffect(() => {
    setExpandedSections({
      keyInsightEvidence: false,
      moreDetails: false, // On Algorithm tab, content is always visible, not dependent on this state
      summaryMore: false,
    });
  }, [tabId]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Group views by sortOrder AND data availability
  const groupedViews = {
    primary: { withData: [], collapsed: [] },
    supporting: { withData: [], collapsed: [] },
    summary: { withData: [] },
  };

  views.forEach((view) => {
    const result = viewDataResults[view.id] || { hasData: false };
    const group = view.sortOrder || 'supporting';

    // Skip views without data entirely (cleaner UI)
    if (!result.hasData) return;

    const targetGroup = groupedViews[group] || groupedViews.supporting;

    if (view.collapsedByDefault) {
      targetGroup.collapsed.push(view);
    } else {
      targetGroup.withData.push(view);
    }
  });

  // Get views for each section
  const primaryCards = groupedViews.primary.withData;
  const secondaryCards = groupedViews.supporting.withData.slice(0, 2);
  const collapsedCards = [
    ...groupedViews.primary.collapsed,
    ...groupedViews.supporting.collapsed,
    ...groupedViews.supporting.withData.slice(2),
  ];
  const summaryCards = groupedViews.summary.withData;

  // Check if sections have content
  const hasPrimaryContent = primaryCards.length > 0;
  const hasSecondaryContent = secondaryCards.length > 0;
  const hasCollapsedContent = collapsedCards.length > 0;
  const hasSummaryContent = summaryCards.length > 0;

  return (
    <div className="space-y-14">
      {/* KEY INSIGHT - Part 3 Module Type 1: Declarative + Collapsible Evidence */}
      {/* Improvements 6 & 7: Mini-lede area, "In plain terms" label, pill-style disclosure */}
      {hasPrimaryContent && (
        <section>
          {isAlgorithmTab ? (
            <SectionHeader
              label={ALGORITHM_TAB_HEADERS.keyInsight.label}
              title={ALGORITHM_TAB_HEADERS.keyInsight.title}
              subtext={ALGORITHM_TAB_HEADERS.keyInsight.subtext}
            />
          ) : (
            <SectionHeader title="Key Insight" />
          )}
          <div className="mt-5">
            {primaryCards.map((view) => {
              const dataResult = viewDataResults[view.id];
              const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                ? view.takeaway(dataResult?.data)
                : null;

              return (
                <div
                  key={view.id}
                  className="rounded-2xl overflow-hidden transition-colors"
                  style={{
                    background: 'white',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  {/* Improvement 6: Mini-lede area */}
                  <div className="p-6 md:p-8">
                    {/* Improvement 6: "In plain terms" label */}
                    {isAlgorithmTab && takeawayText && (
                      <p
                        className="mb-3"
                        style={{
                          fontSize: '11px',
                          color: 'rgba(37, 99, 235, 0.55)',
                          letterSpacing: '0.1em',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        In plain terms
                      </p>
                    )}

                    {/* Improvement 6: Main takeaway in larger type */}
                    {takeawayText && (
                      <p
                        className="text-xl md:text-2xl font-semibold text-text-main leading-snug mb-4"
                        style={{ maxWidth: '600px' }} /* Narrower column */
                      >
                        {takeawayText}
                      </p>
                    )}

                    {/* Improvement 6: Subtext in narrower column */}
                    <p
                      className="text-sm text-slate-500 leading-relaxed"
                      style={{ maxWidth: '500px' }}
                    >
                      {view.description}
                    </p>
                  </div>

                  {/* Improvement 7: "How we know this" at bottom, pill-style disclosure */}
                  <div
                    className="px-6 pb-6 md:px-8 md:pb-6 flex justify-end"
                    style={{ borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}
                  >
                    <button
                      onClick={() => toggleSection('keyInsightEvidence')}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium transition-all rounded-full"
                      style={{
                        color: 'rgba(37, 99, 235, 0.8)',
                        background: 'rgba(37, 99, 235, 0.06)',
                        border: '1px solid rgba(37, 99, 235, 0.12)',
                        padding: '0.5rem 1rem',
                      }}
                    >
                      {/* Improvement 7: Chevron that rotates */}
                      <ChevronDown
                        size={16}
                        className="transition-transform"
                        style={{
                          transform: expandedSections.keyInsightEvidence ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                      {expandedSections.keyInsightEvidence ? 'Hide evidence' : 'How we know this'}
                    </button>
                  </div>

                  {/* Improvement 7: Evidence in tinted inset area */}
                  {expandedSections.keyInsightEvidence && (
                    <div
                      className="px-6 pb-6 md:px-8 md:pb-8"
                      style={{
                        background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.04) 0%, rgba(248, 250, 252, 0.8) 100%)',
                        borderTop: '1px solid rgba(37, 99, 235, 0.08)',
                      }}
                    >
                      <div className="pt-5">
                        <p
                          className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4"
                        >
                          Supporting evidence
                        </p>
                        <ViewCard
                          view={view}
                          dataResult={dataResult}
                          scanCount={scanCount}
                          platformCount={platformCount}
                          accentColor="blue"
                          isInline={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* DETAILS - Part 3: Softer backgrounds, headline + takeaway */}
      {/* Improvement 8: Format takeaway prominently, reduce duplicate headings, proper spacing */}
      {hasSecondaryContent && (
        <section>
          {isAlgorithmTab ? (
            <SectionHeader
              label={ALGORITHM_TAB_HEADERS.details.label}
              title={ALGORITHM_TAB_HEADERS.details.title}
              subtext={ALGORITHM_TAB_HEADERS.details.subtext}
            />
          ) : (
            <SectionHeader title="Details" />
          )}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {secondaryCards.map((view, idx) => {
              const dataResult = viewDataResults[view.id];
              const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                ? view.takeaway(dataResult?.data)
                : null;

              return (
                <div
                  key={view.id}
                  className="rounded-xl p-5 hover:border-slate-300 transition-colors"
                  style={{
                    background: 'white',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {/* Improvement 8: Card title - keep but don't duplicate inside */}
                  <h4 className="text-base font-semibold text-slate-700 mb-3">{view.title}</h4>

                  {/* Improvement 8: Bold one-line takeaway at top */}
                  {takeawayText && (
                    <p className="text-sm font-medium text-slate-700 mb-3 leading-relaxed">
                      {takeawayText}
                    </p>
                  )}

                  {/* Improvement 8: Supporting explanation - hide duplicate title if present */}
                  <div className="text-sm text-slate-500">
                    <ViewCard
                      view={view}
                      dataResult={dataResult}
                      scanCount={scanCount}
                      platformCount={platformCount}
                      accentColor="blue"
                      isInline={true}
                      hideTitle={true} /* Improvement 8: Hide duplicate title */
                    />
                  </div>

                  {/* Improvement 8: Small "based on" line - only show once per section */}
                  {idx === 0 && isAlgorithmTab && (
                    <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                      Based on {scanCount} scan{scanCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MORE DETAILS - Part 3 Module Type 2: Editorial Drawer */}
      {/* Improvement 9: Structured Forecast module with bullet-like lines and labels */}
      {hasCollapsedContent && (
        <section>
          {/* Story-driven header for Algorithm tab */}
          {isAlgorithmTab && (
            <SectionHeader
              label={ALGORITHM_TAB_HEADERS.moreDetails.label}
              title={ALGORITHM_TAB_HEADERS.moreDetails.title}
              subtext={ALGORITHM_TAB_HEADERS.moreDetails.subtext}
            />
          )}

          <div
            className="rounded-xl overflow-hidden mt-5"
            style={{
              background: 'white',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Non-algorithm tabs: Show collapsible header */}
            {!isAlgorithmTab && (
              <button
                onClick={() => toggleSection('moreDetails')}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-1 h-4 rounded-full"
                    style={{
                      background: 'linear-gradient(180deg, #2563EB, rgba(37, 99, 235, 0.4))',
                    }}
                  />
                  <span className="text-sm font-semibold text-slate-600">
                    Where this is heading
                  </span>
                  <span className="text-xs text-slate-400">
                    ({collapsedCards.length} more {collapsedCards.length === 1 ? 'insight' : 'insights'})
                  </span>
                </div>
                {expandedSections.moreDetails ? (
                  <ChevronUp size={18} className="text-slate-400" />
                ) : (
                  <ChevronDown size={18} className="text-slate-400" />
                )}
              </button>
            )}

            {/* Content: Always visible on Algorithm tab, collapsible on others */}
            {(isAlgorithmTab || expandedSections.moreDetails) && (
              <div
                className="px-6 pb-6"
                style={!isAlgorithmTab ? { borderTop: '1px solid #E2E8F0' } : { paddingTop: '1.5rem' }}
              >
                {/* Structured Forecast module for Algorithm tab */}
                {isAlgorithmTab ? (
                  <div className="space-y-0">
                    {/* Show up to 3 insights as structured forecast lines with pill labels */}
                    {collapsedCards.slice(0, 3).map((view, idx) => {
                      const dataResult = viewDataResults[view.id];
                      const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                        ? view.takeaway(dataResult?.data)
                        : null;

                      // Forecast label pills
                      const forecastLabels = [
                        { text: 'Likely next', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
                        { text: 'If this continues', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
                        { text: 'What may shift it', bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
                      ];
                      const label = forecastLabels[idx] || { text: 'Also', bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' };

                      return (
                        <div
                          key={view.id}
                          className="py-5 flex items-start gap-4"
                          style={{
                            borderBottom: idx < Math.min(collapsedCards.length, 3) - 1 ? '1px solid #E2E8F0' : 'none',
                          }}
                        >
                          {/* Pill label badge */}
                          <div
                            className="flex-shrink-0 text-[11px] font-semibold rounded-full px-3 py-1"
                            style={{
                              background: label.bg,
                              color: label.color,
                              border: `1px solid ${label.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {label.text}
                          </div>

                          {/* Forecast line text */}
                          <div className="flex-1 pt-0.5">
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {takeawayText || view.title}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* "More" link if there are additional insights */}
                    {collapsedCards.length > 3 && (
                      <button
                        onClick={() => toggleSection('moreDetails')}
                        className="text-sm font-medium flex items-center gap-1 mt-3 pt-4"
                        style={{ color: '#2563EB', borderTop: '1px solid #E2E8F0' }}
                      >
                        <ChevronDown
                          size={14}
                          className="transition-transform"
                          style={{
                            transform: expandedSections.moreDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                        {expandedSections.moreDetails
                          ? 'Show less'
                          : `${collapsedCards.length - 3} more insight${collapsedCards.length - 3 === 1 ? '' : 's'}`
                        }
                      </button>
                    )}

                    {/* Show additional insights when expanded */}
                    {expandedSections.moreDetails && collapsedCards.length > 3 && (
                      <div className="pt-2">
                        {collapsedCards.slice(3).map((view) => {
                          const dataResult = viewDataResults[view.id];
                          const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                            ? view.takeaway(dataResult?.data)
                            : null;

                          return (
                            <div
                              key={view.id}
                              className="py-4 flex items-start gap-4"
                              style={{
                                borderTop: '1px solid #E2E8F0',
                              }}
                            >
                              <div
                                className="flex-shrink-0 text-[11px] font-semibold rounded-full px-3 py-1"
                                style={{
                                  background: '#F1F5F9',
                                  color: '#64748B',
                                  border: '1px solid #E2E8F0',
                                }}
                              >
                                Also
                              </div>
                              <div className="flex-1 pt-0.5">
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {takeawayText || view.title}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Non-algorithm tabs: Original layout */
                  <div className="space-y-4 pt-4">
                    {collapsedCards.map((view) => (
                      <div
                        key={view.id}
                        className="pt-4 first:pt-0"
                        style={{ borderTop: '1px solid #F1F5F9' }}
                      >
                        <h5 className="text-sm font-medium text-slate-700 mb-2">{view.title}</h5>
                        <ViewCard
                          view={view}
                          dataResult={viewDataResults[view.id]}
                          scanCount={scanCount}
                          platformCount={platformCount}
                          accentColor="blue"
                          isInline={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SUMMARY - Calm Closing Chapter with Action Cards */}
      {hasSummaryContent && (
        <section>
          {isAlgorithmTab ? (
            <SectionHeader
              label={ALGORITHM_TAB_HEADERS.summary.label}
              title={ALGORITHM_TAB_HEADERS.summary.title}
              subtext={ALGORITHM_TAB_HEADERS.summary.subtext}
            />
          ) : (
            <SectionHeader title="What You Could Try" />
          )}
          <div className="mt-5">
            {summaryCards.map((view) => {
              const dataResult = viewDataResults[view.id];
              const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                ? view.takeaway(dataResult?.data)
                : null;
              const actionText = dataResult?.hasData && typeof view.action === 'function'
                ? view.action(dataResult?.data)
                : null;

              // For list data, show max 3 items as actions
              const listData = Array.isArray(dataResult?.data)
                ? dataResult.data.slice(0, 3)
                : dataResult?.data?.tips?.slice(0, 3) || [];

              return (
                <div
                  key={view.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: SURFACES.SECTION_WHITE.background,
                    border: SURFACES.SECTION_WHITE.border,
                  }}
                >
                  <div className="p-6 md:p-8">
                    {/* Summary paragraph */}
                    {takeawayText && (
                      <p className="text-base text-slate-700 leading-relaxed mb-6" style={{ maxWidth: '600px' }}>
                        {takeawayText}
                      </p>
                    )}

                    {/* Action Cards - max 3, styled as intentional steps */}
                    {listData.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                          Try this
                        </p>
                        <div className="grid gap-3">
                          {listData.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-slate-50"
                              style={{
                                background: '#FAFBFC',
                                border: '1px solid #E2E8F0',
                              }}
                            >
                              {/* Numbered chip */}
                              <span
                                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                style={{
                                  background: '#EFF6FF',
                                  color: '#2563EB',
                                  border: '1px solid #BFDBFE',
                                }}
                              >
                                {idx + 1}
                              </span>
                              {/* Action text */}
                              <p className="text-sm text-slate-700 leading-relaxed pt-1">
                                {typeof item === 'string' ? item : item.text || item.topic || item}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback to action text if no list */}
                    {listData.length === 0 && actionText && (
                      <p className="text-sm text-slate-500 italic">{actionText}</p>
                    )}

                    {/* Show more collapse for additional items */}
                    {Array.isArray(dataResult?.data) && dataResult.data.length > 3 && (
                      <button
                        onClick={() => toggleSection('summaryMore')}
                        className="mt-5 text-sm font-medium flex items-center gap-1"
                        style={{ color: '#2563EB' }}
                      >
                        <ChevronDown
                          size={14}
                          className="transition-transform"
                          style={{
                            transform: expandedSections.summaryMore ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                        {expandedSections.summaryMore
                          ? 'Show less'
                          : `More ideas (${dataResult.data.length - 3} more)`
                        }
                      </button>
                    )}

                    {expandedSections.summaryMore && Array.isArray(dataResult?.data) && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                        {dataResult.data.slice(3).map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm text-slate-500">
                            <span className="text-slate-300">•</span>
                            <span>{typeof item === 'string' ? item : item.text || item.topic || item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calm Closing Chapter - Light blue band with calming message */}
                  {isAlgorithmTab && (
                    <div
                      className="px-6 py-6 md:px-8"
                      style={{
                        background: '#EFF6FF', /* Solid light blue */
                        borderTop: '1px solid #BFDBFE',
                      }}
                    >
                      <p
                        className="text-sm text-slate-600 leading-relaxed"
                        style={{ maxWidth: '560px' }}
                      >
                        <span className="font-medium text-slate-700">Remember:</span> small shifts matter. This is about awareness, not blame—your feed is shaped by invisible systems, and even gentle changes can make a difference over time.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

/**
 * PRIMARY APP - alg-gemini
 *
 * DashboardPage - Main dashboard with 5 tabs and catalog-driven views.
 * Phase 8: UX Simplification and Product Judgment
 *
 * Key features:
 * - ONE primary card per tab - the clearest, calmest answer
 * - At most 2 secondary cards
 * - Everything else collapsed behind "See details"
 * - Increased whitespace for visual breathing room
 * - Simplified language throughout
 */

/**
 * FeatureMomentWrapper - Premium editorial wrapper for Algorithm tab centerpiece
 * Part 2: Enhanced to feel more premium with subtle gradient, increased border radius,
 * soft shadow, and increased visual breathing room
 */
const FeatureMomentWrapper = ({ children }) => (
  <div
    className="relative mb-20 -mx-6 md:-mx-8"
    style={{
      background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.025) 0%, rgba(37, 99, 235, 0.055) 40%, rgba(37, 99, 235, 0.035) 70%, rgba(37, 99, 235, 0.015) 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(37, 99, 235, 0.1)',
      boxShadow: '0 8px 40px rgba(37, 99, 235, 0.06), 0 2px 12px rgba(0, 0, 0, 0.02)',
      marginTop: '2rem',
      padding: 'clamp(2rem, 5vw, 3.5rem) clamp(2rem, 5vw, 3rem)',
    }}
  >
    {/* Subtle decorative element at top */}
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2"
      style={{
        width: '60px',
        height: '4px',
        background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.4), rgba(37, 99, 235, 0.15))',
        borderRadius: '0 0 4px 4px',
      }}
    />
    {/* Premium inner glow effect */}
    <div
      className="absolute inset-0 rounded-[20px] pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at top center, rgba(37, 99, 235, 0.04) 0%, transparent 60%)',
      }}
    />
    <div className="relative">{children}</div>
  </div>
);

/**
 * AlgorithmTabHero - Editorial "spike" for "What the Algorithm Thinks" tab
 *
 * Solid Surfaces Strategy:
 * - Hero uses solid light blue background (not translucent)
 * - Full-width text layout (no narrow left column)
 * - Support cards use solid white with strong borders
 */
const AlgorithmTabHero = ({ scans, viewDataResults }) => {
  // Get top topics from the primary view data
  const topicsData = viewDataResults?.['algo-topics-liked']?.data || [];
  const topTopic = topicsData[0]?.topic || 'certain themes';
  const secondTopic = topicsData[1]?.topic || '';

  // Get profile breadth
  const breadthData = viewDataResults?.['algo-profile-breadth']?.data;
  const breadth = breadthData?.breadth?.toLowerCase() || 'moderate';

  const platformCount = scans?.length > 0
    ? [...new Set(scans.map(s => s.platform))].length
    : 0;

  return (
    <div className="mb-8">
      {/* Hero Insight Card - SOLID SURFACE */}
      <div
        className="w-full rounded-2xl mb-6"
        style={{
          background: SURFACES.HERO_BLUE.background,
          border: SURFACES.HERO_BLUE.border,
          padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 3.5rem)',
          boxShadow: SURFACES.HERO_BLUE.shadow,
        }}
      >
        {/* Editorial kicker line */}
        <p
          className="mb-3"
          style={{
            fontSize: '11px',
            color: '#2563EB',
            letterSpacing: '0.12em',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          Your algorithmic portrait
        </p>

        {/* Provenance marker */}
        <p
          className="mb-5"
          style={{ fontSize: '13px', color: '#1D4ED8', letterSpacing: '0.04em', fontWeight: 500 }}
        >
          Based on patterns across {platformCount} platform{platformCount !== 1 ? 's' : ''}
        </p>

        {/* Main headline - FULL WIDTH, not narrow column */}
        <div
          className="relative mb-6"
          style={{
            marginLeft: '-1rem',
            paddingLeft: '1rem',
          }}
        >
          {/* Blue accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 rounded-r-lg"
            style={{
              width: '5px',
              background: 'linear-gradient(180deg, #2563EB 0%, #60A5FA 100%)',
            }}
          />
          {/* Main interpretive headline - EXPANDED WIDTH */}
          <h2
            className="font-extrabold text-slate-900"
            style={{
              fontFamily: 'var(--font-headline, system-ui)',
              letterSpacing: '-0.03em',
              fontSize: 'clamp(1.875rem, 5vw, 2.75rem)',
              lineHeight: 1.2,
              maxWidth: '100%', /* Full width - no narrow constraint */
            }}
          >
            Your feed keeps returning to{' '}
            <span style={{ color: '#2563EB' }}>{topTopic}</span>
            {secondTopic && (
              <>
                {' '}and <span style={{ color: '#2563EB' }}>{secondTopic}</span>
              </>
            )}
            —even when you don't ask for it.
          </h2>
        </div>

        {/* Supporting interpretation - comfortable reading width */}
        <p
          className="text-slate-600"
          style={{
            fontSize: '17px',
            lineHeight: 1.75,
            maxWidth: '680px', /* Comfortable reading but not narrow */
          }}
        >
          This is our best interpretation based on what we've observed.
          Algorithms don't explain themselves—we're reading between the lines.
        </p>
      </div>

      {/* Two supporting context cards - SOLID WHITE SURFACES with strong borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Narrowing focus card - promoted styling */}
        <div
          className="rounded-xl relative overflow-hidden"
          style={{
            background: SURFACES.SUPPORT_WHITE.background,
            border: SURFACES.SUPPORT_WHITE.border,
            boxShadow: SURFACES.SUPPORT_WHITE.shadow,
            padding: 'clamp(1.5rem, 3vw, 2rem)',
          }}
        >
          {/* Strong blue left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
            style={{ background: 'linear-gradient(180deg, #2563EB 0%, #3B82F6 100%)' }}
          />
          <div className="pl-4">
            {/* Promoted typography - larger title */}
            <h4 className="text-base font-bold text-slate-800 mb-2">Narrowing focus</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your feed appears <span className="font-semibold text-slate-700">{breadth}</span>—
              {breadth === 'narrow'
                ? ' a few topics dominate while others rarely appear.'
                : breadth === 'broad'
                ? ' you see a good variety of different topics.'
                : ' some topics get more attention than others.'}
            </p>
          </div>
        </div>

        {/* Sticky patterns card - promoted styling */}
        <div
          className="rounded-xl relative overflow-hidden"
          style={{
            background: SURFACES.SUPPORT_WHITE.background,
            border: SURFACES.SUPPORT_WHITE.border,
            boxShadow: SURFACES.SUPPORT_WHITE.shadow,
            padding: 'clamp(1.5rem, 3vw, 2rem)',
          }}
        >
          {/* Strong blue left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
            style={{ background: 'linear-gradient(180deg, #2563EB 0%, #3B82F6 100%)' }}
          />
          <div className="pl-4">
            {/* Promoted typography - larger title */}
            <h4 className="text-base font-bold text-slate-800 mb-2">Sticky patterns</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              These themes have been <span className="font-semibold text-slate-700">persistent</span>.
              Once the algorithm identifies an interest, it reinforces it—
              changing direction typically requires sustained effort.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


/**
 * SecondVisualAnchor - Chapter opener that transitions into the analysis
 * Appears after the Talk module to prevent "glaze over" effect
 * Provides a clear second anchor point in the story
 */
const SecondVisualAnchor = () => (
  <div
    className="mb-10 mt-4"
    style={{
      paddingLeft: '1rem',
      borderLeft: '4px solid #2563EB',
    }}
  >
    <p
      className="text-lg font-medium text-slate-700 leading-relaxed"
      style={{ maxWidth: '600px' }}
    >
      Now let's make the pattern concrete. This is what the feed keeps reinforcing, and why.
    </p>
  </div>
);

/**
 * ReadingColumnWrapper - Constrains content to a comfortable reading width
 * Used for sections after the Talk module to prevent "huge empty slabs"
 */
const ReadingColumnWrapper = ({ children }) => (
  <div
    className="mx-auto"
    style={{ maxWidth: '1024px' }} /* max-w-5xl equivalent */
  >
    {children}
  </div>
);

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  // PHASE 6A: Political leaning toggle state (default OFF)
  const [politicalLeaningEnabled, setPoliticalLeaningEnabled] = useState(false);
  const {
    scans,
    scanDetails,
    loading,
    error,
    fetchScans,
    fetchAllScanDetails,
    hasScans,
    platforms,
  } = useDashboardData();

  // Track which scan details we've loaded
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);

  // Load scan details when scans are available
  useEffect(() => {
    const loadDetails = async () => {
      if (scans.length > 0 && !detailsLoaded && !detailsLoading) {
        setDetailsLoading(true);
        await fetchAllScanDetails(scans);
        setDetailsLoading(false);
        setDetailsLoaded(true);
      }
    };
    loadDetails();
  }, [scans, detailsLoaded, detailsLoading, fetchAllScanDetails]);

  // Get views for current tab
  const currentViews = getViewsForTab(activeTab);

  // Compute data for all views in current tab
  // PHASE 6A: Pass options like politicalLeaningEnabled to relevant data functions
  const viewDataResults = useMemo(() => {
    if (!detailsLoaded) return {};

    const results = {};
    for (const view of currentViews) {
      const dataFn = dataHelpers[view.dataFn];
      if (typeof dataFn === 'function') {
        try {
          // Pass options for views that require opt-in
          if (view.requiresOptIn && activeTab === 'politics') {
            results[view.id] = dataFn(scans, scanDetails, { enabled: politicalLeaningEnabled });
          } else {
            results[view.id] = dataFn(scans, scanDetails);
          }
        } catch (err) {
          console.error(`Error computing data for ${view.id}:`, err);
          results[view.id] = { hasData: false, data: null, missing: 'Error loading data.' };
        }
      } else {
        results[view.id] = { hasData: false, data: null, missing: 'Data function not found.' };
      }
    }
    return results;
  }, [currentViews, scans, scanDetails, detailsLoaded, activeTab, politicalLeaningEnabled]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page pt-28 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary-blue mx-auto mb-4" />
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-bg-page pt-28 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setDetailsLoaded(false);
                fetchScans();
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No scans state
  if (!hasScans) {
    return (
      <div className="min-h-screen bg-bg-page pt-28 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 size={40} className="text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-text-main mb-2">No Scans Yet</h1>
            <p className="text-text-muted mb-8 max-w-md mx-auto">
              Run your first scan to see insights about your social media feeds.
              The dashboard will populate as you scan different platforms.
            </p>
            <Link
              to="/start"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Your First Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-main mb-2">
              Dashboard
            </h1>
            <p className="text-text-muted">
              Explore insights from your {scans.length} scan{scans.length !== 1 ? 's' : ''} across {[...new Set(scans.map(s => s.platform))].length} platform{[...new Set(scans.map(s => s.platform))].length !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDetailsLoaded(false);
                fetchScans();
              }}
              disabled={detailsLoading}
              className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text-main hover:bg-white rounded-lg transition-colors border border-slate-200"
            >
              <RefreshCw size={18} className={detailsLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              to="/start"
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              New Scan
            </Link>
          </div>
        </div>

        {/* Tab Navigation - Part 1 Rule A: All tabs use BLUE theme */}
        <div className="mb-8 border-b border-border-card">
          <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Dashboard tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                  border-b-2 -mb-px
                  ${activeTab === tab.id
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-text-muted hover:text-text-main hover:border-border-card'
                  }
                `}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Loading details indicator */}
        {detailsLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 text-text-muted">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading scan details...</span>
          </div>
        )}

        {/* Global orientation - Phase 8: Removed, less clutter */}

        {/* Tab Content */}
        <div className="mb-8">
          {/* Tab header with trust sentence integrated */}
          <div className="mb-6">
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <h2 className="text-xl font-semibold text-text-main">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
              <DataCoverageBar
                scans={scans}
                scanDetails={scanDetails}
                tabId={activeTab}
              />
            </div>
            {/* PHASE 10: Trust sentence directly under title */}
            <TabTrustSentence tabId={activeTab} />
          </div>

          {/* PHASE 6A: Political Leaning Toggle (only on politics tab) */}
          {activeTab === 'politics' && (
            <div className="mb-4">
              <PoliticalLeaningToggle
                enabled={politicalLeaningEnabled}
                onToggle={() => setPoliticalLeaningEnabled(!politicalLeaningEnabled)}
              />
            </div>
          )}

          {/* Feature Moment - Editorial centerpiece for Algorithm Tab */}
          {activeTab === 'algorithm' && (
            <FeatureMomentWrapper>
              {/* Editorial Hero */}
              <AlgorithmTabHero
                scans={scans}
                viewDataResults={viewDataResults}
              />

              {/* Talk to Your Algorithm - Premium invitation (GREEN theme) */}
              <div className="mt-10">
                <TalkToAlgorithmSection
                  feedData={{
                    scans,
                    scanDetails,
                    viewDataResults,
                  }}
                />
              </div>
            </FeatureMomentWrapper>
          )}

          {/* Second Visual Anchor - Chapter opener after Talk (Algorithm tab only) */}
          {activeTab === 'algorithm' && <SecondVisualAnchor />}

          {/* Views Grid with enforced section structure */}
          {/* Wrapped in ReadingColumnWrapper for Algorithm tab to constrain width */}
          {activeTab === 'algorithm' ? (
            <ReadingColumnWrapper>
              <ViewsGridWithCollapsing
                views={currentViews}
                viewDataResults={viewDataResults}
                scanCount={scans.length}
                platformCount={platforms.length}
                tabName={TABS.find((t) => t.id === activeTab)?.label || 'insights'}
                tabId={activeTab}
              />
            </ReadingColumnWrapper>
          ) : (
            <ViewsGridWithCollapsing
              views={currentViews}
              viewDataResults={viewDataResults}
              scanCount={scans.length}
              platformCount={platforms.length}
              tabName={TABS.find((t) => t.id === activeTab)?.label || 'insights'}
              tabId={activeTab}
            />
          )}

          {/* Part 4: Talk to Your Algorithm on ALL non-algorithm tabs (GREEN theme) */}
          {activeTab !== 'algorithm' && (
            <div className="mt-14">
              <TalkToAlgorithmSection
                feedData={{
                  scans,
                  scanDetails,
                  viewDataResults,
                }}
              />
            </div>
          )}
        </div>

        {/* Phase 8: Minimal footer - Softer, less competing */}
        <div className="text-center py-8 mt-12">
          <p
            className="text-[11px] italic"
            style={{ color: 'rgba(148, 163, 184, 0.7)' }}
          >
            These insights show patterns in what you're shown, not who you are.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
