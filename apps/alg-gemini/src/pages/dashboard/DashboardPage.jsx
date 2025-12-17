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
 */
const SectionHeader = ({ title, subtitle }) => (
  <div className="flex items-center gap-3 mb-3">
    <div
      className="w-1 h-4 rounded-full"
      style={{
        background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.5), rgba(37, 99, 235, 0.2))',
      }}
    />
    <h3
      className="text-xs font-semibold uppercase tracking-wider"
      style={{ color: 'rgba(37, 99, 235, 0.7)' }}
    >
      {title}
    </h3>
    {subtitle && (
      <span className="text-xs text-slate-400 ml-auto">{subtitle}</span>
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
 * ViewsGridWithCollapsing - Part 3: Editorial Stack Redesign
 *
 * Structure per tab (magazine-style, not dashboard):
 * - KEY INSIGHT: Declarative statement + collapsible evidence
 * - DETAILS: Softer backgrounds, headline + takeaway, 2 columns
 * - MORE DETAILS: Editorial drawer "Where this is heading"
 * - SUMMARY: Paragraph + 3 "Try this" actions max
 *
 * Part 1 Rule A: ALL tabs use BLUE accent
 */
const ViewsGridWithCollapsing = ({ views, viewDataResults, scanCount, platformCount, tabName, tabId }) => {
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    keyInsightEvidence: false,
    moreDetails: false,
    summaryMore: false,
  });

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
      {hasPrimaryContent && (
        <section>
          <SectionHeader title="Key Insight" />
          <div className="mt-4">
            {primaryCards.map((view) => {
              const dataResult = viewDataResults[view.id];
              const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                ? view.takeaway(dataResult?.data)
                : null;

              return (
                <div
                  key={view.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.02) 100%)',
                    border: '1px solid rgba(37, 99, 235, 0.1)',
                  }}
                >
                  {/* Declarative insight header */}
                  <div className="p-6 md:p-8">
                    {takeawayText && (
                      <p
                        className="text-xl md:text-2xl font-semibold text-text-main leading-snug mb-4"
                        style={{ maxWidth: '640px' }}
                      >
                        {takeawayText}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 mb-4">{view.description}</p>

                    {/* Evidence toggle */}
                    <button
                      onClick={() => toggleSection('keyInsightEvidence')}
                      className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                      style={{ color: 'rgba(37, 99, 235, 0.8)' }}
                    >
                      {expandedSections.keyInsightEvidence ? (
                        <>
                          <ChevronUp size={16} />
                          Hide evidence
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          How we know this
                        </>
                      )}
                    </button>
                  </div>

                  {/* Collapsible evidence section */}
                  {expandedSections.keyInsightEvidence && (
                    <div
                      className="px-6 pb-6 md:px-8 md:pb-8 pt-0"
                      style={{
                        borderTop: '1px solid rgba(37, 99, 235, 0.08)',
                        background: 'rgba(248, 250, 252, 0.5)',
                      }}
                    >
                      <div className="pt-5">
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
      {hasSecondaryContent && (
        <section>
          <SectionHeader title="Details" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {secondaryCards.map((view) => {
              const dataResult = viewDataResults[view.id];
              const takeawayText = dataResult?.hasData && typeof view.takeaway === 'function'
                ? view.takeaway(dataResult?.data)
                : null;

              return (
                <div
                  key={view.id}
                  className="rounded-xl p-5"
                  style={{
                    background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.025) 0%, rgba(248, 250, 252, 0.8) 100%)',
                    border: '1px solid rgba(226, 232, 240, 0.7)',
                  }}
                >
                  <h4 className="text-base font-semibold text-slate-700 mb-2">{view.title}</h4>
                  {takeawayText && (
                    <p className="text-sm text-slate-600 mb-3">{takeawayText}</p>
                  )}
                  <div className="opacity-80">
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
              );
            })}
          </div>
        </section>
      )}

      {/* MORE DETAILS - Part 3 Module Type 2: Editorial Drawer */}
      {hasCollapsedContent && (
        <section>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(248, 250, 252, 0.6)',
              border: '1px solid rgba(226, 232, 240, 0.6)',
            }}
          >
            <button
              onClick={() => toggleSection('moreDetails')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-1 h-4 rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.4), rgba(37, 99, 235, 0.15))',
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

            {expandedSections.moreDetails && (
              <div
                className="px-6 pb-6 space-y-4"
                style={{ borderTop: '1px solid rgba(226, 232, 240, 0.5)' }}
              >
                {collapsedCards.map((view) => (
                  <div key={view.id} className="pt-4">
                    <h5 className="text-sm font-medium text-slate-600 mb-2">{view.title}</h5>
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
        </section>
      )}

      {/* SUMMARY - Part 3 Module Type 3: Paragraph + Actions */}
      {hasSummaryContent && (
        <section>
          <SectionHeader title="What You Could Try" />
          <div className="mt-4">
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
                  className="rounded-xl p-6"
                  style={{
                    background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.03) 0%, rgba(248, 250, 252, 0.5) 100%)',
                    border: '1px solid rgba(226, 232, 240, 0.6)',
                  }}
                >
                  {/* Summary paragraph */}
                  {takeawayText && (
                    <p className="text-base text-slate-700 leading-relaxed mb-5">
                      {takeawayText}
                    </p>
                  )}

                  {/* Action items - max 3 */}
                  {listData.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Try this
                      </p>
                      {listData.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 text-sm text-slate-600"
                        >
                          <span
                            className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{
                              background: 'rgba(37, 99, 235, 0.1)',
                              color: 'rgba(37, 99, 235, 0.8)',
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span>{typeof item === 'string' ? item : item.text || item.topic || item}</span>
                        </div>
                      ))}
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
                      className="mt-4 text-sm font-medium flex items-center gap-1"
                      style={{ color: 'rgba(37, 99, 235, 0.7)' }}
                    >
                      {expandedSections.summaryMore ? (
                        <>
                          <ChevronUp size={14} />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          More ideas ({dataResult.data.length - 3} more)
                        </>
                      )}
                    </button>
                  )}

                  {expandedSections.summaryMore && Array.isArray(dataResult?.data) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {dataResult.data.slice(3).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-slate-500">
                          <span className="text-slate-300">•</span>
                          <span>{typeof item === 'string' ? item : item.text || item.topic || item}</span>
                        </div>
                      ))}
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
 * Part 2: Enhanced hero dominance with:
 * - Increased vertical padding (15-25%)
 * - Larger headline (text-4xl equivalent)
 * - Constrained max-width for better wrap
 * - Improved line height
 * - More spacing between hero and supporting cards
 * - Quieter supporting cards (reduced contrast)
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
    <div className="mb-10">
      {/* Hero Insight Card - Enhanced dominance with more padding and larger headline */}
      <div
        className="w-full rounded-2xl mb-8"
        style={{
          background: 'linear-gradient(160deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.15) 35%, rgba(37, 99, 235, 0.1) 100%)',
          border: '1px solid rgba(37, 99, 235, 0.18)',
          padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 3.5rem)',
          boxShadow: '0 6px 32px rgba(37, 99, 235, 0.08)',
        }}
      >
        {/* Provenance marker */}
        <p
          className="mb-6"
          style={{ fontSize: '13px', color: '#2563EB', opacity: 0.8, letterSpacing: '0.04em', fontWeight: 500 }}
        >
          Based on patterns across {platformCount} platform{platformCount !== 1 ? 's' : ''}
        </p>

        {/* Main interpretive headline - Increased size (text-4xl equivalent) and constrained width */}
        <h2
          className="font-bold text-text-main mb-6"
          style={{
            fontFamily: 'var(--font-headline, system-ui)',
            letterSpacing: '-0.03em',
            fontSize: 'clamp(1.875rem, 5vw, 2.75rem)',
            lineHeight: 1.3,
            maxWidth: '680px',
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

        {/* Supporting interpretation - Enhanced readability with increased line height */}
        <p
          className="text-text-muted"
          style={{
            fontSize: '17px',
            lineHeight: 1.85,
            maxWidth: '560px',
          }}
        >
          This is our best interpretation based on what we've observed.
          Algorithms don't explain themselves—we're reading between the lines.
        </p>
      </div>

      {/* Two supporting context cards - Quieter, more secondary appearance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Feed narrowness card - reduced contrast */}
        <div
          className="rounded-xl"
          style={{
            background: 'rgba(37, 99, 235, 0.025)',
            border: '1px solid rgba(37, 99, 235, 0.08)',
            padding: 'clamp(1.25rem, 3vw, 1.5rem)',
          }}
        >
          <h4 className="text-sm font-medium text-slate-600 mb-2">Narrowing focus</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your feed appears <span className="font-medium text-slate-600">{breadth}</span>—
            {breadth === 'narrow'
              ? ' a few topics dominate while others rarely appear.'
              : breadth === 'broad'
              ? ' you see a good variety of different topics.'
              : ' some topics get more attention than others.'}
          </p>
        </div>

        {/* Pattern persistence card - reduced contrast */}
        <div
          className="rounded-xl"
          style={{
            background: 'rgba(37, 99, 235, 0.025)',
            border: '1px solid rgba(37, 99, 235, 0.08)',
            padding: 'clamp(1.25rem, 3vw, 1.5rem)',
          }}
        >
          <h4 className="text-sm font-medium text-slate-600 mb-2">Sticky patterns</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            These themes have been <span className="font-medium text-slate-600">persistent</span>.
            Once the algorithm identifies an interest, it reinforces it—
            changing direction typically requires sustained effort.
          </p>
        </div>
      </div>
    </div>
  );
};

// DEV WATERMARK - Visible banner to prove which app is running
const DevWatermark = () => (
  <div
    style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(37, 99, 235, 0.95)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 9999,
      fontFamily: 'monospace',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}
  >
    <div>ALG-GEMINI RUNNING</div>
    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
      {import.meta.url.split('/').slice(-3).join('/')}
    </div>
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
              <TalkToAlgorithmSection
                feedData={{
                  scans,
                  scanDetails,
                  viewDataResults,
                }}
              />
            </FeatureMomentWrapper>
          )}

          {/* Views Grid with enforced section structure */}
          <ViewsGridWithCollapsing
            views={currentViews}
            viewDataResults={viewDataResults}
            scanCount={scans.length}
            platformCount={platforms.length}
            tabName={TABS.find((t) => t.id === activeTab)?.label || 'insights'}
            tabId={activeTab}
          />

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

      {/* DEV WATERMARK - Remove before production */}
      <DevWatermark />
    </div>
  );
};

export default DashboardPage;
