import React, { useState } from 'react';
import { TABS, getViewsForTab } from './dashboardCatalog';
import ViewCard from '../../components/dashboard/ViewCard';

/**
 * DashboardPage - Main dashboard with 5 tabs and catalog-driven views.
 * Phase 1: Structure only - all views show empty states.
 */
const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const currentViews = getViewsForTab(activeTab);

  return (
    <div className="min-h-screen bg-bg-page pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-main mb-2">
            Dashboard
          </h1>
          <p className="text-text-muted">
            Explore insights from your scan history across multiple dimensions.
          </p>
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
                data={null} // Phase 1: No real data, all views show empty state
              />
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center py-8 border-t border-border-card">
          <p className="text-sm text-text-muted">
            Views will populate as you run more scans across different platforms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
