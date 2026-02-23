import { useMemo } from 'react';
import { getViewsForTab } from './dashboardCatalog';
import * as dataHelpers from '../../lib/dashboard/dataHelpers';
import { HERO_VIEW_ID_BY_TAB } from './dashboardConstants';
import { logError } from '../../lib/errorLogger.js';

/**
 * useInsightData - Computes data for all views, hero selection, and ads window scope
 *
 * Returns computed values for rendering:
 * - masterCounts: scan count, platform count, post count
 * - currentViews: views available for active tab
 * - viewDataResults: computed data for each view
 * - heroViewId, heroView, heroDataResult: hero card selection
 * - heroEvidenceExpanded state
 * - adsScanWindow: scope info for ads tab
 * - tabScopeLabel: label for scope
 */
const useInsightData = ({
  activeTab,
  scans,
  scanDetails,
  detailsLoaded,
  totalScanCount,
  isPremiumUser,
  heroEvidenceExpanded,
  setHeroEvidenceExpanded,
  deriveWindowLabel,
}) => {
  // Master count computation
  const masterCounts = useMemo(() => {
    if (!scans || scans.length === 0 || !scanDetails) {
      return {
        scanCount: 0,
        platformCount: 0,
        postCount: 0,
      };
    }

    let totalPosts = 0;
    const platformSet = new Set();

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (detail) {
        const data = detail.result || detail.scan || detail;
        const items = data?.feed_items || [];
        totalPosts += items.length;
      }
      if (scan.platform) {
        platformSet.add(scan.platform.toLowerCase());
      }
    }

    return {
      scanCount: totalScanCount || 0,
      platformCount: platformSet.size,
      postCount: totalPosts,
    };
  }, [scans, scanDetails, totalScanCount]);

  // Get views for current tab
  const currentViews = useMemo(() => getViewsForTab(activeTab, { isPlusUser: isPremiumUser }), [activeTab, isPremiumUser]);

  // Compute data for all views in current tab
  const viewDataResults = useMemo(() => {
    if (!detailsLoaded) return {};

    const results = {};
    for (const view of currentViews) {
      const dataFn = dataHelpers[view.dataFn];
      if (typeof dataFn === 'function') {
        try {
          results[view.id] = dataFn(scans, scanDetails);
          if (!results[view.id] || typeof results[view.id] !== 'object') {
            results[view.id] = { hasData: false, data: null, missing: 'Invalid data structure.' };
          } else if (results[view.id].hasData === undefined) {
            results[view.id] = { ...results[view.id], hasData: false };
          }
        } catch (err) {
          logError('useInsightData', `Error computing data for ${view.id}:`, err, err.stack);
          results[view.id] = { hasData: false, data: null, missing: 'Error loading data.' };
        }
      } else {
        results[view.id] = { hasData: false, data: null, missing: 'Data function not found.' };
      }
    }
    return results;
  }, [currentViews, scans, scanDetails, detailsLoaded]);

  // Hero view selection
  const heroViewId = HERO_VIEW_ID_BY_TAB[activeTab];
  const heroView =
    currentViews.find((v) => v.id === heroViewId) ||
    currentViews.find((v) => v.hero === true) ||
    null;
  const resolvedHeroViewId = heroView?.id || heroViewId;
  const heroDataResult = resolvedHeroViewId ? viewDataResults[resolvedHeroViewId] : null;

  const heroEvidenceKey = `${activeTab}:${resolvedHeroViewId || 'unknown'}`;
  const isHeroEvidenceExpanded = heroEvidenceExpanded[heroEvidenceKey] === true;
  const toggleHeroEvidence = () => {
    setHeroEvidenceExpanded((prev) => {
      if (!prev || typeof prev !== 'object') {
        return { [heroEvidenceKey]: true };
      }
      if (!heroEvidenceKey || typeof heroEvidenceKey !== 'string') {
        return prev;
      }
      return {
        ...prev,
        [heroEvidenceKey]: !prev[heroEvidenceKey],
      };
    });
  };

  const adsScanWindow = useMemo(() => {
    if (activeTab !== 'ads') return null;
    const windowStart = heroDataResult?.chartQuality?.windowStart;
    const windowEnd = heroDataResult?.chartQuality?.windowEnd;
    const scansUsed = heroDataResult?.scansUsed || heroDataResult?.scansWithData?.length || 0;
    const humanLabel = deriveWindowLabel(windowStart, windowEnd, scansUsed);
    return {
      startDate: windowStart || null,
      endDate: windowEnd || null,
      scansUsed,
      humanLabel,
    };
  }, [activeTab, heroDataResult, deriveWindowLabel]);

  const tabScopeLabel = activeTab === 'ads' ? adsScanWindow?.humanLabel : null;

  return {
    masterCounts,
    currentViews,
    viewDataResults,
    heroViewId,
    heroView,
    resolvedHeroViewId,
    heroDataResult,
    isHeroEvidenceExpanded,
    toggleHeroEvidence,
    adsScanWindow,
    tabScopeLabel,
  };
};

export default useInsightData;
