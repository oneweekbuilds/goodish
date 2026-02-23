import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, BarChart3 } from 'lucide-react';
import { TABS } from './dashboardCatalog';
import { useDashboardData } from '../../lib/dashboard/useDashboardData';
import { generateDemoData } from '../../lib/dashboard/demoData';
import { getCurrentPlanTier, PLAN_TIERS, isAnon, setStoredPlanTier } from '../../lib/plan';
import { LockedOverlayCard } from '../../components/plan';
import { usePaywall } from '../../lib/plan/PaywallProvider';
import { ResultsGate } from '../../components/auth';
import SignInPrompt from '../../components/auth/SignInPrompt';
import { useAuth } from '../../lib/auth/useAuth';
import { track, EVENTS } from '../../lib/analytics';
import { fetchEntitlements } from '../../lib/plan/entitlements';
import PastDueBanner from '../../components/plan/PastDueBanner';
import ScanWalkthrough from '../../components/onboarding/ScanWalkthrough';
import DashboardTour from '../../components/onboarding/DashboardTour';
import EmptyDashboard from '../../components/onboarding/EmptyDashboard';
import SEO from '../../components/SEO';
import { logWarning } from '../../lib/errorLogger.js';

// Extracted components and hooks
import useDashboardState from './useDashboardState';
import PremiumFiltersBar from './PremiumFiltersBar';
import DashboardHeader from './DashboardHeader';
import CheckoutBanners from './CheckoutBanners';
import TabRenderer from './TabRenderer';
import TabNavigation from './TabNavigation';
import DemoPreview from './DemoPreview';
import PageFooter from './PageFooter';
import MasterCountLine from './MasterCountLine';
import useCheckoutSync from './useCheckoutSync';
import useInsightData from './useInsightData';
import useDashboardInitialization from './useDashboardInitialization';

// Main dashboard orchestrator with layout, state management, data fetching, and auth gates
const DashboardPage = () => {
  const navigate = useNavigate();
  const { authReady, session } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const tabContainerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [tourForceKey, setTourForceKey] = useState(0);

  // Extract dashboard state management
  const dashboardState = useDashboardState();
  const {
    platformFilter,
    setPlatformFilter,
    dateRange,
    setDateRange,
    datePreset,
    handlePresetChange,
    filtersActive,
    resetFilters,
    activeFilters,
    formatDateRange,
    deriveWindowLabel,
    heroEvidenceExpanded,
    setHeroEvidenceExpanded,
  } = dashboardState;

  // Handle arrow key navigation for tabs (WAI-ARIA tabs pattern)
  const handleTabKeyDown = (e) => {
    const currentIndex = TABS.findIndex(tab => tab.id === activeTab);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = TABS.length - 1;
    } else {
      return; // No matching key, do nothing
    }

    setActiveTab(TABS[nextIndex].id);
    const nextTabEl = document.getElementById(`tab-${TABS[nextIndex].id}`);
    if (nextTabEl) nextTabEl.focus();
  };

  // Premium gating: wired to real plan tier from auth context
  const currentTier = getCurrentPlanTier();
  const isPremiumUser = currentTier === PLAN_TIERS.PLUS;
  const userTier = isPremiumUser ? 'plus' : 'free';

  // Initialize plan tier and demo mode
  const { isDemoMode, planTier, setPlanTier } = useDashboardInitialization({ authReady });

  // Checkout success state via hook
  const { checkoutSuccess, setCheckoutSuccess } = useCheckoutSync({
    authReady,
    isDemoMode,
    setPlanTier,
  });

  // Paywall modal management
  const { openPaywall } = usePaywall();

  // Trends panel state
  const [trendsOpenTab, setTrendsOpenTab] = useState(null);

  // Determine if user is Plus
  const isPlusUser = planTier === PLAN_TIERS.PLUS;

  // Handle trends CTA click
  const handleOpenTrends = ({ tab, placement }) => {
    if (!isDemoMode) {
      track(EVENTS.UPGRADE_CTA_CLICKED, {
        tab,
        placement,
        planTier,
        isDemo: false,
      });
    }

    if (isPlusUser) {
      setTrendsOpenTab(trendsOpenTab === tab ? null : tab);
    } else {
      openPaywall(`${tab}_${placement}`);
    }
  };

  // Close trends panel when switching tabs
  useEffect(() => {
    if (trendsOpenTab && trendsOpenTab !== activeTab) {
      setTrendsOpenTab(null);
    }
  }, [activeTab, trendsOpenTab]);

  // Update tab indicator position when active tab changes
  useEffect(() => {
    if (tabContainerRef.current) {
      const activeButton = tabContainerRef.current.querySelector('[data-tab-active="true"]');
      if (activeButton) {
        const { offsetLeft, offsetWidth } = activeButton;
        setIndicatorStyle({
          left: offsetLeft,
          width: offsetWidth,
        });
      }
    }
  }, [activeTab]);

  // Reset date preset to valid option for free users
  useEffect(() => {
    if (userTier === 'free') {
      const allowedPresets = ['today', '7days', 'all'];
      if (!allowedPresets.includes(datePreset)) {
        handlePresetChange('all');
      }
    }
  }, [userTier, datePreset, handlePresetChange]);

  // Generate demo data only once
  const demoData = useMemo(() => {
    if (isDemoMode) {
      return generateDemoData();
    }
    return null;
  }, [isDemoMode]);

  // Use real data hook
  const realData = useDashboardData(
    !isDemoMode && filtersActive
      ? { filters: activeFilters, skipFetch: isDemoMode }
      : { skipFetch: isDemoMode }
  );

  // Select data source based on mode
  const {
    scans,
    scanDetails,
    loading,
    error,
    errorMessage,
    fetchScans,
    fetchAllScanDetails,
    hasScans,
    platforms,
    totalScanCount,
    unfilteredScanCount,
  } = isDemoMode ? demoData : realData;

  // Set first-scan flag when user has scans
  useEffect(() => {
    if (hasScans && !localStorage.getItem('alg_first_scan_completed')) {
      localStorage.setItem('alg_first_scan_completed', 'true');
    }
  }, [hasScans]);

  // Calculate remaining scans for free tier quota
  const remainingScans = Math.max(0, 5 - scans.length);

  // Auto-select most-used platform for free users
  useEffect(() => {
    if (userTier !== 'free' || !scans || scans.length === 0) return;
    const platformCounts = {};
    for (const scan of scans) {
      const p = (scan.platform || 'other').toLowerCase();
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    }
    const sorted = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && platformFilter === 'all' && sorted.length > 1) {
      setPlatformFilter(sorted[0][0]);
    }
  }, [userTier, scans, platformFilter, setPlatformFilter]);

  // Results ready state
  const resultsReady = !loading && !error && scans.length > 0;

  // Gate anonymous users from viewing results
  const shouldShowGate = !isDemoMode && authReady && isAnon(planTier) && resultsReady;

  // Analytics: Track gate shown and results viewed
  const gateShownFired = React.useRef(false);
  const resultsViewedFired = React.useRef(false);

  useEffect(() => {
    if (shouldShowGate && !gateShownFired.current && !isDemoMode) {
      track(EVENTS.RESULTS_GATE_SHOWN, {
        scanCount: scans.length,
      });
      gateShownFired.current = true;
    }
  }, [shouldShowGate, isDemoMode, scans.length]);

  useEffect(() => {
    if (resultsReady && !shouldShowGate && !resultsViewedFired.current && !isDemoMode) {
      track(EVENTS.RESULTS_VIEWED, {
        scanCount: scans.length,
      });
      resultsViewedFired.current = true;
    }
  }, [resultsReady, shouldShowGate, isDemoMode, scans.length]);

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

  // Compute insight data via hook
  const {
    masterCounts,
    currentViews,
    viewDataResults,
    heroViewId,
    heroView,
    resolvedHeroViewId,
    heroDataResult,
    isHeroEvidenceExpanded,
    toggleHeroEvidence,
    tabScopeLabel,
  } = useInsightData({
    activeTab,
    scans,
    scanDetails,
    detailsLoaded,
    totalScanCount,
    isPremiumUser,
    heroEvidenceExpanded,
    setHeroEvidenceExpanded,
    deriveWindowLabel,
  });

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
  if (error && !isDemoMode) {
    const isNetworkError = error === 'network';
    const isAuthError = error === 'auth';

    if (isAuthError && authReady) {
      return (
        <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16">
          <SignInPrompt
            title="Sign in to view your results"
            body="Your scans are saved to your account. Sign in to see your dashboard."
            source="dashboard_401"
            onBack={() => window.location.href = '/'}
            backLabel="Back to home"
          />
        </div>
      );
    }

    if (isNetworkError) {
      return (
        <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16 px-4 md:px-6">
          <div className="max-w-2xl mx-auto px-2 sm:px-4 md:px-6">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 sm:p-8 md:p-12 text-center">
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
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl mb-8"
              >
                Start Your First Scan
              </Link>

              <details className="mt-8 text-left max-w-lg mx-auto">
                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700 mb-2">
                  Troubleshooting: Backend not responding
                </summary>
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-2">
                  <p>
                    If you have scans but they are not showing, the backend server may not be running.
                  </p>
                  <p className="font-mono text-xs bg-white p-2 rounded border border-slate-200">
                    cd apps/alg-gemini/backend && python -m uvicorn app:app --reload --port 8000
                  </p>
                  <button
                    onClick={() => {
                      setDetailsLoaded(false);
                      fetchScans();
                    }}
                    className="mt-3 px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-bg-page pt-24 md:pt-28 pb-16 px-4 md:px-6">
        <div className="max-w-2xl mx-auto px-2 sm:px-4 md:px-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold mb-2 text-text-main">
              Unable to Load Dashboard
            </h2>
            <p className="mb-6 text-text-muted">{errorMessage || 'Something went wrong. Please try again.'}</p>
            <button
              onClick={() => {
                setDetailsLoaded(false);
                fetchScans();
              }}
              className="px-6 py-3 rounded-xl font-semibold transition-colors bg-primary-blue text-white hover:bg-blue-700"
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
    return <EmptyDashboard />;
  }

  const isOnAlgorithmTab = activeTab === 'algorithm';

  return (
    <>
      <SEO title="Dashboard" description="Your algorithmic profile dashboard. See what ads appear, political content patterns, content sources, and more." path="/dashboard" noIndex={true} />
      <div className="bg-bg-page pt-24 md:pt-28 pb-6 px-4 md:px-6">
        {shouldShowGate && <ResultsGate scanCount={scans.length} />}

        <DashboardTour forceTour={tourForceKey > 0} key={`tour-${tourForceKey}`} />

        <ScanWalkthrough />

        <div className="max-w-7xl mx-auto px-0 sm:px-2 md:px-6">
          <CheckoutBanners checkoutSuccess={checkoutSuccess} setCheckoutSuccess={setCheckoutSuccess} planTier={planTier} setPlanTier={setPlanTier} />

          <PastDueBanner />

          <DashboardHeader
            isOnAlgorithmTab={isOnAlgorithmTab}
            datePreset={datePreset}
            handlePresetChange={handlePresetChange}
            userTier={userTier}
            dateRange={dateRange}
            setDateRange={setDateRange}
            filtersActive={filtersActive}
            totalScanCount={totalScanCount}
            unfilteredScanCount={unfilteredScanCount}
            remainingScans={remainingScans}
            detailsLoading={detailsLoading}
            fetchScans={fetchScans}
            setDetailsLoaded={setDetailsLoaded}
            tourForceKey={tourForceKey}
            setTourForceKey={setTourForceKey}
          />

          {/* Premium Filters Bar */}
          {isPremiumUser ? (
            <PremiumFiltersBar
              platformFilter={platformFilter}
              setPlatformFilter={setPlatformFilter}
              dateRange={dateRange}
              setDateRange={setDateRange}
              filtersActive={filtersActive}
              resetFilters={resetFilters}
            />
          ) : platforms.length > 1 ? (
            <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Platform</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-800 capitalize">
                    {platformFilter === 'all' ? platforms[0] : platformFilter}
                  </span>
                  <span className="text-xs text-slate-500">
                    You have scans from {platforms.length} platforms.{' '}
                    <a href="/plus" className="text-primary-blue font-medium hover:underline">
                      Upgrade to Premium
                    </a>{' '}
                    to analyze all platforms together.
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleTabKeyDown={handleTabKeyDown}
            tabContainerRef={tabContainerRef}
            isOnAlgorithmTab={isOnAlgorithmTab}
          />

          <TabRenderer
            activeTab={activeTab}
            scans={scans}
            scanDetails={scanDetails}
            handleOpenTrends={handleOpenTrends}
            isPlusUser={isPlusUser}
            trendsOpenTab={trendsOpenTab}
            setTrendsOpenTab={setTrendsOpenTab}
            detailsLoading={detailsLoading}
            currentViews={currentViews}
            viewDataResults={viewDataResults}
            heroView={heroView}
            heroDataResult={heroDataResult}
            isHeroEvidenceExpanded={isHeroEvidenceExpanded}
            toggleHeroEvidence={toggleHeroEvidence}
            tabScopeLabel={tabScopeLabel}
            totalScanCount={totalScanCount}
            platforms={platforms}
            resolvedHeroViewId={resolvedHeroViewId}
          />

          <MasterCountLine activeTab={activeTab} masterCounts={masterCounts} />

          <DemoPreview isDemoMode={isDemoMode} planTier={planTier} openPaywall={openPaywall} />

          <PageFooter />
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
