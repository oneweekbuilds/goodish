import React, { Suspense } from 'react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { FeatureMomentWrapper, TabHero, SecondVisualAnchor, ReadingColumnWrapper } from './TabHero';
import ViewsGridWithCollapsing from './ViewsGridWithCollapsing';
import { TABS } from './dashboardCatalog';

// Lazy-load tab components — each loads on demand when the user switches tabs.
// DashboardSkeleton is used as the Suspense fallback (shimmer loading state).
const TalkTabPanel = React.lazy(() => import('./TalkTabPanel'));
const OverviewTab = React.lazy(() => import('./tabs/OverviewTab'));
const SourcesTab = React.lazy(() => import('./tabs/SourcesTab'));
const AdsTab = React.lazy(() => import('./tabs/AdsTab'));
const PoliticsTab = React.lazy(() => import('./tabs/PoliticsTab'));
const ToneTab = React.lazy(() => import('./tabs/ToneTab'));
const SuggestedVsFollowedTab = React.lazy(() => import('./tabs/SuggestedVsFollowedTab'));

/**
 * TabRenderer - Renders the active tab's content
 *
 * Handles the conditional switch between different tab types (Overview, Sources, Ads, etc.)
 * and the generic tab layout with hero views and supporting views.
 */
const TabRenderer = ({
  activeTab,
  scans,
  scanDetails,
  handleOpenTrends,
  isPlusUser,
  trendsOpenTab,
  setTrendsOpenTab,
  detailsLoading,
  currentViews,
  viewDataResults,
  heroView,
  heroDataResult,
  isHeroEvidenceExpanded,
  toggleHeroEvidence,
  tabScopeLabel,
  totalScanCount,
  platforms,
  resolvedHeroViewId,
}) => {
  return (
    <div className="mb-8" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
      <ErrorBoundary
        fallbackTitle="This tab encountered an error"
        fallbackMessage="Something went wrong loading this tab. Try clicking another tab or refreshing the page."
        dashboardTab={activeTab}
        key={activeTab}
      >
      <Suspense fallback={<DashboardSkeleton />}>
      {activeTab === 'talk' ? (
        <TalkTabPanel />
      ) : activeTab === 'overview' ? (
        <OverviewTab
          scans={scans}
          scanDetails={scanDetails}
          onOpenTrends={handleOpenTrends}
          isPlusUser={isPlusUser}
          showTrendsPanel={trendsOpenTab === 'overview'}
          onCloseTrendsPanel={() => setTrendsOpenTab(null)}
        />
      ) : activeTab === 'sources' ? (
        <SourcesTab
          scans={scans}
          scanDetails={scanDetails}
          onOpenTrends={handleOpenTrends}
          isPlusUser={isPlusUser}
          showTrendsPanel={trendsOpenTab === 'sources'}
          onCloseTrendsPanel={() => setTrendsOpenTab(null)}
        />
      ) : activeTab === 'ads' ? (
        <AdsTab
          scans={scans}
          scanDetails={scanDetails}
          onOpenTrends={handleOpenTrends}
          isPlusUser={isPlusUser}
          showTrendsPanel={trendsOpenTab === 'ads'}
          onCloseTrendsPanel={() => setTrendsOpenTab(null)}
        />
      ) : activeTab === 'politics' ? (
        <PoliticsTab
          scans={scans}
          scanDetails={scanDetails}
          onOpenTrends={handleOpenTrends}
          isPlusUser={isPlusUser}
          showTrendsPanel={trendsOpenTab === 'politics'}
          onCloseTrendsPanel={() => setTrendsOpenTab(null)}
        />
      ) : activeTab === 'tone' ? (
        <ToneTab
          scans={scans}
          scanDetails={scanDetails}
          onOpenTrends={handleOpenTrends}
          isPlusUser={isPlusUser}
          showTrendsPanel={trendsOpenTab === 'tone'}
          onCloseTrendsPanel={() => setTrendsOpenTab(null)}
        />
      ) : activeTab === 'suggested_vs_followed' ? (
        <SuggestedVsFollowedTab
          scans={scans}
          scanDetails={scanDetails}
          onOpenTrends={handleOpenTrends}
          isPlusUser={isPlusUser}
          showTrendsPanel={trendsOpenTab === 'suggested_vs_followed'}
          onCloseTrendsPanel={() => setTrendsOpenTab(null)}
        />
      ) : (
        <>
          <FeatureMomentWrapper>
            <TabHero
              tabId={activeTab}
              scans={scans}
              platforms={platforms}
              heroView={heroView}
              heroDataResult={heroDataResult}
              isEvidenceExpanded={isHeroEvidenceExpanded}
              onToggleEvidence={toggleHeroEvidence}
              scopeLabel={tabScopeLabel}
              totalScanCount={totalScanCount}
            />
          </FeatureMomentWrapper>

          <SecondVisualAnchor
            tabId={activeTab}
            className={
              activeTab === 'politics'
                ? 'mt-1 mb-8'
                : activeTab === 'ads'
                  ? 'mt-10'
                  : ''
            }
          />

          <ReadingColumnWrapper>
            {detailsLoading ? (
              <div className="space-y-10">
                <section>
                  <div className="rounded-2xl overflow-hidden bg-white border border-slate-700/80 shadow-md">
                    <div className="p-7 md:p-9">
                      <div className="h-8 bg-slate-200 rounded w-3/4 mb-4 animate-pulse" />
                      <div className="h-4 bg-slate-200 rounded w-full mb-2 animate-pulse" />
                      <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse" />
                    </div>
                  </div>
                </section>
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[1, 2].map((i) => (
                      <div key={i} className="rounded-xl p-4 bg-white border border-slate-200/60">
                        <div className="h-5 bg-slate-200 rounded w-2/3 mb-3 animate-pulse" />
                        <div className="h-4 bg-slate-200 rounded w-full mb-2 animate-pulse" />
                        <div className="h-4 bg-slate-200 rounded w-4/5 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <ViewsGridWithCollapsing
                views={currentViews}
                viewDataResults={viewDataResults}
                scanCount={0}
                platformCount={0}
                tabName={TABS.find((t) => t.id === activeTab)?.label || 'insights'}
                tabId={activeTab}
                heroViewId={resolvedHeroViewId}
                scopeLabel={tabScopeLabel}
              />
            )}
          </ReadingColumnWrapper>
        </>
      )}
      </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default TabRenderer;
