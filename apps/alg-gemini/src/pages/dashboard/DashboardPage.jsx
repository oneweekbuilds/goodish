import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, BarChart3, Clock, Globe } from 'lucide-react';
import { TABS, getViewsForTab, EMPTY_STATE_TYPES } from './dashboardCatalog';
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
 * SectionHeader - Subtle divider between view groups
 */
const SectionHeader = ({ title, subtitle }) => (
  <div className="col-span-full pt-6 pb-2 first:pt-0">
    <div className="flex items-center gap-3">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
    {subtitle && (
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    )}
  </div>
);

/**
 * ViewsGridWithCollapsing - Renders views grid with collapsed empty states and narrative sections
 * When 3+ cards share the same empty state reason, they're collapsed into one placeholder
 */
const ViewsGridWithCollapsing = ({ views, viewDataResults, scanCount, platformCount, tabName }) => {
  // Group views by sortOrder AND data availability
  const groupedViews = {
    primary: { withData: [], empty: [] },
    supporting: { withData: [], empty: [] },
    future: { withData: [], empty: [] },
    summary: { withData: [], empty: [] },
  };

  const emptyByType = {
    [EMPTY_STATE_TYPES.NEEDS_MORE_SCANS]: [],
    [EMPTY_STATE_TYPES.NEEDS_BROADER_BEHAVIOR]: [],
    [EMPTY_STATE_TYPES.FUTURE_FEATURE]: [],
  };

  views.forEach((view) => {
    const result = viewDataResults[view.id] || { hasData: false };
    const group = view.sortOrder || 'supporting';

    if (result.hasData) {
      if (groupedViews[group]) {
        groupedViews[group].withData.push(view);
      } else {
        groupedViews.supporting.withData.push(view);
      }
    } else {
      if (groupedViews[group]) {
        groupedViews[group].empty.push(view);
      } else {
        groupedViews.supporting.empty.push(view);
      }
      // Also track by empty state type for collapsing
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

  // Helper to check if view should be hidden (collapsed)
  const isCollapsed = (view) => {
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

  // Count total views with data and total empty
  const primaryWithData = groupedViews.primary.withData;
  const supportingWithData = groupedViews.supporting.withData;
  const futureWithData = groupedViews.future.withData;
  const summaryWithData = groupedViews.summary.withData;

  // Individual empty views (not collapsed)
  const individualEmptyPrimary = groupedViews.primary.empty.filter(v => !isCollapsed(v));
  const individualEmptySupporting = groupedViews.supporting.empty.filter(v => !isCollapsed(v));

  // Collapsed placeholder cards to show at the end
  const collapsedPlaceholders = [];
  collapsedEmptyTypes.forEach((type) => {
    const count = emptyByType[type].length;
    collapsedPlaceholders.push({ type, count });
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* PRIMARY INSIGHTS - What is happening */}
      {(primaryWithData.length > 0 || individualEmptyPrimary.length > 0) && (
        <>
          <SectionHeader title="Key Insights" subtitle="What is happening in your feed" />
          {primaryWithData.map(renderViewCard)}
          {individualEmptyPrimary.map(renderViewCard)}
        </>
      )}

      {/* SUPPORTING DETAILS - Why / how this shows up */}
      {(supportingWithData.length > 0 || individualEmptySupporting.length > 0) && (
        <>
          <SectionHeader title="Supporting Details" subtitle="Why and how this shows up" />
          {supportingWithData.map(renderViewCard)}
          {individualEmptySupporting.map(renderViewCard)}
        </>
      )}

      {/* FUTURE FEATURES - Coming soon views */}
      {futureWithData.length > 0 && (
        <>
          <SectionHeader title="Additional Insights" />
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

      {/* SUMMARY CARD - What this means for you */}
      {summaryWithData.length > 0 && (
        <>
          <SectionHeader title="What This Means" subtitle="Summary and actions you can take" />
          {summaryWithData.map(renderViewCard)}
        </>
      )}
    </div>
  );
};

/**
 * DashboardPage - Main dashboard with 5 tabs and catalog-driven views.
 * Phase 4: Hierarchy, density reduction, and narrative flow.
 */
const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
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
  const viewDataResults = useMemo(() => {
    if (!detailsLoaded) return {};

    const results = {};
    for (const view of currentViews) {
      const dataFn = dataHelpers[view.dataFn];
      if (typeof dataFn === 'function') {
        try {
          results[view.id] = dataFn(scans, scanDetails);
        } catch (err) {
          console.error(`Error computing data for ${view.id}:`, err);
          results[view.id] = { hasData: false, data: null, missing: 'Error loading data.' };
        }
      } else {
        results[view.id] = { hasData: false, data: null, missing: 'Data function not found.' };
      }
    }
    return results;
  }, [currentViews, scans, scanDetails, detailsLoaded]);

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

        {/* Global orientation cue (Phase 4F) */}
        {!detailsLoading && (
          <div className="mb-6 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-sm text-slate-600 text-center">
              <span className="font-medium">Start with the highlighted insights.</span>
              {' '}Other views unlock as you scan more content.
            </p>
          </div>
        )}

        {/* Tab Content */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-main">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <span className="text-sm text-text-muted">
              {currentViews.length} views
            </span>
          </div>

          {/* Views Grid with empty state collapsing */}
          <ViewsGridWithCollapsing
            views={currentViews}
            viewDataResults={viewDataResults}
            scanCount={scans.length}
            platformCount={platforms.length}
            tabName={TABS.find((t) => t.id === activeTab)?.label || 'insights'}
          />
        </div>

        {/* Global explanation - shows once per dashboard */}
        <div className="text-center py-8 border-t border-border-card">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-slate-500 mb-2">
              <span className="font-medium">About these insights:</span> AlgorithmLens shows patterns, not truths.
            </p>
            <p className="text-xs text-slate-400">
              Confidence grows as you run more scans across platforms and over time.
              Views will show more data as you scan different platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
