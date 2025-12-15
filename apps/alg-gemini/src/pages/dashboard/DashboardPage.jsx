import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, BarChart3 } from 'lucide-react';
import { TABS, getViewsForTab } from './dashboardCatalog';
import ViewCard from '../../components/dashboard/ViewCard';
import { useDashboardData } from '../../lib/dashboard/useDashboardData';
import * as dataHelpers from '../../lib/dashboard/dataHelpers';

/**
 * DashboardPage - Main dashboard with 5 tabs and catalog-driven views.
 * Phase 2: Real data integration with honest empty states.
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

          {/* Views Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentViews.map((view) => (
              <ViewCard
                key={view.id}
                view={view}
                dataResult={viewDataResults[view.id] || { hasData: false, data: null, missing: 'Loading...' }}
                scanCount={scans.length}
                platformCount={platforms.length}
              />
            ))}
          </div>
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
