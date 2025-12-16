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
 * TabTrustSentence - Phase 8: Simplified, less prominent
 * A subtle trust note that doesn't dominate the tab
 */
const TabTrustSentence = ({ tabId }) => {
  const sentence = TAB_TRUST_SENTENCES[tabId];
  if (!sentence) return null;

  return (
    <div className="mb-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        {sentence}
      </p>
    </div>
  );
};

/**
 * SectionHeader - Phase 8: Very subtle divider, more whitespace
 */
const SectionHeader = ({ title, subtitle }) => (
  <div className="col-span-full pt-8 pb-3 first:pt-0">
    <div className="flex items-center gap-3">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        {title}
      </h3>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
    {subtitle && (
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
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
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
      <Database size={14} className="text-slate-400" />
      <span>
        Using <span className="font-medium">{stats.scanCount}</span> scan{stats.scanCount !== 1 ? 's' : ''},
        {' '}<span className="font-medium">{stats.platformCount}</span> platform{stats.platformCount !== 1 ? 's' : ''},
        {' '}<span className="font-medium">{stats.totalItems}</span> posts
      </span>
    </div>
  );
};

/**
 * PoliticalLeaningToggle - Opt-in toggle for political leaning estimates
 * PHASE 6A: Political leaning requires explicit opt-in
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
        backgroundColor: enabled ? '#3B82F6' : '#E5E7EB',
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
 * CollapsedByDefaultCard - A collapsed view that can be expanded
 * PHASE 6B: Views with collapsedByDefault show a compact preview
 */
const CollapsedByDefaultCard = ({ view, dataResult, onExpand }) => {
  const hasData = dataResult?.hasData;

  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-600 truncate">
            {view.title}
          </h3>
          {hasData && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {typeof view.takeaway === 'function'
                ? view.takeaway(dataResult?.data)
                : 'Data available'}
            </p>
          )}
        </div>
        <button
          onClick={onExpand}
          className="ml-3 px-3 py-1.5 text-xs font-medium text-primary-blue hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
        >
          See details
        </button>
      </div>
    </div>
  );
};

/**
 * ViewsGridWithCollapsing - Renders views grid with collapsed empty states and narrative sections
 * PHASE 6B Updates:
 * - Hidden views are already filtered out by getViewsForTab
 * - collapsedByDefault views show compact preview with "See details" button
 * - When 3+ cards share the same empty state reason, they're collapsed into one placeholder
 */
const ViewsGridWithCollapsing = ({ views, viewDataResults, scanCount, platformCount, tabName }) => {
  // Track which collapsedByDefault views have been expanded
  const [expandedViews, setExpandedViews] = useState(new Set());

  const handleExpand = (viewId) => {
    setExpandedViews((prev) => new Set([...prev, viewId]));
  };

  // Group views by sortOrder AND data availability
  const groupedViews = {
    primary: { withData: [], empty: [], collapsed: [] },
    supporting: { withData: [], empty: [], collapsed: [] },
    future: { withData: [], empty: [], collapsed: [] },
    summary: { withData: [], empty: [], collapsed: [] },
  };

  const emptyByType = {
    [EMPTY_STATE_TYPES.NEEDS_MORE_SCANS]: [],
    [EMPTY_STATE_TYPES.NEEDS_BROADER_BEHAVIOR]: [],
    [EMPTY_STATE_TYPES.FUTURE_FEATURE]: [],
  };

  views.forEach((view) => {
    const result = viewDataResults[view.id] || { hasData: false };
    const group = view.sortOrder || 'supporting';
    const targetGroup = groupedViews[group] || groupedViews.supporting;

    // Check if this view should be collapsed by default (and hasn't been expanded)
    const isCollapsedByDefault = view.collapsedByDefault && !expandedViews.has(view.id);

    if (result.hasData) {
      if (isCollapsedByDefault) {
        targetGroup.collapsed.push(view);
      } else {
        targetGroup.withData.push(view);
      }
    } else {
      targetGroup.empty.push(view);
      // Track by empty state type for collapsing
      const type = view.emptyStateType || EMPTY_STATE_TYPES.NEEDS_MORE_SCANS;
      if (emptyByType[type]) {
        emptyByType[type].push(view);
      }
    }
  });

  // Determine which empty states to collapse (3+ cards of same type)
  const collapsedEmptyTypes = new Set();
  Object.entries(emptyByType).forEach(([type, emptyViews]) => {
    if (emptyViews.length >= 3) {
      collapsedEmptyTypes.add(type);
    }
  });

  // Helper to check if view should be hidden (collapsed into placeholder)
  const isEmptyCollapsed = (view) => {
    const result = viewDataResults[view.id] || { hasData: false };
    if (result.hasData) return false;
    const type = view.emptyStateType || EMPTY_STATE_TYPES.NEEDS_MORE_SCANS;
    return collapsedEmptyTypes.has(type);
  };

  // Render a view card
  const renderViewCard = (view) => (
    <ViewCard
      key={view.id}
      view={view}
      dataResult={viewDataResults[view.id] || { hasData: false, data: null, missing: 'Loading...' }}
      scanCount={scanCount}
      platformCount={platformCount}
    />
  );

  // Render a collapsed-by-default card
  const renderCollapsedCard = (view) => (
    <CollapsedByDefaultCard
      key={view.id}
      view={view}
      dataResult={viewDataResults[view.id] || { hasData: false, data: null }}
      onExpand={() => handleExpand(view.id)}
    />
  );

  // Get views for each section
  const primaryWithData = groupedViews.primary.withData;
  const primaryCollapsed = groupedViews.primary.collapsed;
  const supportingWithData = groupedViews.supporting.withData;
  const supportingCollapsed = groupedViews.supporting.collapsed;
  const futureWithData = groupedViews.future.withData;
  const summaryWithData = groupedViews.summary.withData;

  // Individual empty views (not collapsed into placeholder)
  const individualEmptyPrimary = groupedViews.primary.empty.filter(v => !isEmptyCollapsed(v));
  const individualEmptySupporting = groupedViews.supporting.empty.filter(v => !isEmptyCollapsed(v));

  // Collapsed placeholder cards to show at the end
  const collapsedPlaceholders = [];
  collapsedEmptyTypes.forEach((type) => {
    const count = emptyByType[type].length;
    collapsedPlaceholders.push({ type, count });
  });

  // Check if sections have content
  const hasPrimaryContent = primaryWithData.length > 0 || individualEmptyPrimary.length > 0;
  const hasSupportingContent = supportingWithData.length > 0 || supportingCollapsed.length > 0 || individualEmptySupporting.length > 0;
  const hasCollapsedContent = primaryCollapsed.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* PRIMARY INSIGHTS - The key insight */}
      {hasPrimaryContent && (
        <>
          <SectionHeader title="Key Insight" />
          {primaryWithData.map(renderViewCard)}
          {individualEmptyPrimary.map(renderViewCard)}
        </>
      )}

      {/* SUPPORTING DETAILS - Additional context */}
      {hasSupportingContent && (
        <>
          <SectionHeader title="Details" />
          {supportingWithData.map(renderViewCard)}
          {supportingCollapsed.map(renderCollapsedCard)}
          {individualEmptySupporting.map(renderViewCard)}
        </>
      )}

      {/* COLLAPSED BY DEFAULT CARDS */}
      {hasCollapsedContent && (
        <>
          <SectionHeader title="More" />
          {primaryCollapsed.map(renderCollapsedCard)}
        </>
      )}

      {/* FUTURE FEATURES */}
      {futureWithData.length > 0 && (
        <>
          <SectionHeader title="Coming Soon" />
          {futureWithData.map(renderViewCard)}
        </>
      )}

      {/* COLLAPSED EMPTY STATE PLACEHOLDERS */}
      {collapsedPlaceholders.length > 0 && (
        <>
          {collapsedPlaceholders.map(({ type, count }) => (
            <CollapsedEmptyStateCard
              key={`collapsed-${type}`}
              emptyStateType={type}
              count={count}
              tabName={tabName}
            />
          ))}
        </>
      )}

      {/* SUMMARY CARD */}
      {summaryWithData.length > 0 && (
        <>
          <SectionHeader title="Summary" />
          {summaryWithData.map(renderViewCard)}
        </>
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

        {/* Tab Navigation */}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-main">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <span className="text-sm text-text-muted">
              {currentViews.length} insight{currentViews.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* PHASE 7: Tab-level trust sentence */}
          <TabTrustSentence tabId={activeTab} />

          {/* PHASE 6A: Data Coverage Bar */}
          <div className="mb-4">
            <DataCoverageBar
              scans={scans}
              scanDetails={scanDetails}
              tabId={activeTab}
            />
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

          {/* Views Grid with empty state collapsing */}
          <ViewsGridWithCollapsing
            views={currentViews}
            viewDataResults={viewDataResults}
            scanCount={scans.length}
            platformCount={platforms.length}
            tabName={TABS.find((t) => t.id === activeTab)?.label || 'insights'}
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
