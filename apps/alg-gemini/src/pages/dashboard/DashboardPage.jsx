import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, BarChart3, Clock, Globe, Database, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { TABS, getViewsForTab, getVisibleViewCount, EMPTY_STATE_TYPES, TAB_TRUST_SENTENCES } from './dashboardCatalog';
import ViewCard from '../../components/dashboard/ViewCard';
import { useDashboardData } from '../../lib/dashboard/useDashboardData';
import * as dataHelpers from '../../lib/dashboard/dataHelpers';

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
 * SectionHeader - UI Refoundation: Subtle accent from semantic color lane
 */
const SectionHeader = ({ title, subtitle, accentColor = 'blue' }) => (
  <div className="flex items-center gap-4">
    <div className={`w-1 h-4 rounded-full ${accentColor === 'green' ? 'bg-emerald-400' : 'bg-primary-blue'}`} />
    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
      {title}
    </h3>
    <div className="flex-1 h-px bg-slate-100" />
    {subtitle && (
      <span className="text-xs text-slate-400">{subtitle}</span>
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
    <div className="border-t border-slate-100 first:border-t-0">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-600">
            {view.title}
          </h4>
          {!isExpanded && takeawayText && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {takeawayText}
            </p>
          )}
        </div>
        <span className={`text-xs font-medium transition-colors ${accentColor === 'green' ? 'text-emerald-600' : 'text-primary-blue'}`}>
          {isExpanded ? 'Show less' : 'Show more'}
        </span>
      </button>
      {isExpanded && (
        <div className="px-5 pb-5 pt-1">
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
 * ViewsGridWithCollapsing - UI Refoundation: Enforced section structure
 *
 * Structure per tab:
 * - PRIMARY CARD: Full width
 * - SECONDARY ROW: 2 cards, equal width
 * - EXPANDABLE SECTION: Inline collapsed details
 * - SUMMARY CARD: Full width, muted
 *
 * Semantic color lanes (logo consistent):
 * - Ads & Influence → blue
 * - Politics & Worldview → green
 * - Patterns → blue
 * - Creators → green
 * - Algorithm → blue
 */
const ViewsGridWithCollapsing = ({ views, viewDataResults, scanCount, platformCount, tabName, tabId }) => {
  // Track which collapsedByDefault views have been expanded
  const [expandedViews, setExpandedViews] = useState(new Set());

  // Semantic color lanes - alternating blue/green by tab
  const accentColor = ['politics', 'creators'].includes(tabId) ? 'green' : 'blue';

  const handleToggle = (viewId) => {
    setExpandedViews((prev) => {
      const next = new Set(prev);
      if (next.has(viewId)) {
        next.delete(viewId);
      } else {
        next.add(viewId);
      }
      return next;
    });
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

    // Check if this view should be collapsed by default
    if (view.collapsedByDefault) {
      targetGroup.collapsed.push(view);
    } else {
      targetGroup.withData.push(view);
    }
  });

  // Get views for each section
  const primaryCards = groupedViews.primary.withData;
  const secondaryCards = groupedViews.supporting.withData.slice(0, 2); // Max 2
  const collapsedCards = [
    ...groupedViews.primary.collapsed,
    ...groupedViews.supporting.collapsed,
    ...groupedViews.supporting.withData.slice(2), // Overflow goes to collapsed
  ];
  const summaryCards = groupedViews.summary.withData;

  // Check if sections have content
  const hasPrimaryContent = primaryCards.length > 0;
  const hasSecondaryContent = secondaryCards.length > 0;
  const hasCollapsedContent = collapsedCards.length > 0;
  const hasSummaryContent = summaryCards.length > 0;

  return (
    <div className="space-y-8">
      {/* PRIMARY CARD - Full width */}
      {hasPrimaryContent && (
        <section>
          <SectionHeader title="Key Insight" accentColor={accentColor} />
          <div className="mt-4">
            {primaryCards.map((view) => (
              <ViewCard
                key={view.id}
                view={view}
                dataResult={viewDataResults[view.id]}
                scanCount={scanCount}
                platformCount={platformCount}
                accentColor={accentColor}
                isFullWidth={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECONDARY ROW - Exactly 2 cards, equal width */}
      {hasSecondaryContent && (
        <section>
          <SectionHeader title="Details" accentColor={accentColor} />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {secondaryCards.map((view) => (
              <ViewCard
                key={view.id}
                view={view}
                dataResult={viewDataResults[view.id]}
                scanCount={scanCount}
                platformCount={platformCount}
                accentColor={accentColor}
              />
            ))}
          </div>
        </section>
      )}

      {/* EXPANDABLE SECTION - Inline collapsed */}
      {hasCollapsedContent && (
        <section>
          <SectionHeader title="More Details" accentColor={accentColor} />
          <div className="mt-4 bg-slate-50/50 border border-slate-100 rounded-xl overflow-hidden">
            {collapsedCards.map((view) => (
              <ExpandableDetailRow
                key={view.id}
                view={view}
                dataResult={viewDataResults[view.id]}
                isExpanded={expandedViews.has(view.id)}
                onToggle={() => handleToggle(view.id)}
                accentColor={accentColor}
              />
            ))}
          </div>
        </section>
      )}

      {/* SUMMARY CARD - Full width, muted */}
      {hasSummaryContent && (
        <section>
          <SectionHeader title="Summary" accentColor={accentColor} />
          <div className="mt-4">
            {summaryCards.map((view) => (
              <ViewCard
                key={view.id}
                view={view}
                dataResult={viewDataResults[view.id]}
                scanCount={scanCount}
                platformCount={platformCount}
                accentColor={accentColor}
                isFullWidth={true}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

/**
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

        {/* Tab Navigation - UI Refoundation: Semantic color lanes */}
        <div className="mb-8 border-b border-border-card">
          <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Dashboard tabs">
            {TABS.map((tab) => {
              // Semantic color lanes: green for politics/creators, blue for others
              const isGreenTab = ['politics', 'creators'].includes(tab.id);
              const activeColor = isGreenTab ? 'border-emerald-500 text-emerald-600' : 'border-primary-blue text-primary-blue';

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                    border-b-2 -mb-px
                    ${activeTab === tab.id
                      ? activeColor
                      : 'border-transparent text-text-muted hover:text-text-main hover:border-border-card'
                    }
                  `}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                >
                  {tab.label}
                </button>
              );
            })}
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

          {/* Views Grid with enforced section structure */}
          <ViewsGridWithCollapsing
            views={currentViews}
            viewDataResults={viewDataResults}
            scanCount={scans.length}
            platformCount={platforms.length}
            tabName={TABS.find((t) => t.id === activeTab)?.label || 'insights'}
            tabId={activeTab}
          />
        </div>

        {/* Phase 8: Minimal footer */}
        <div className="text-center py-6 mt-8 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            These insights show patterns in what you're shown, not who you are.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
