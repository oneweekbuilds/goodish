import React from 'react';

/**
 * MasterCountLine - Summary of scans, platforms, and posts analyzed
 *
 * Only shows for generic tabs (not overview, sources, ads, politics, tone, suggested_vs_followed)
 */
const MasterCountLine = ({ activeTab, masterCounts }) => {
  // List of special tabs that don't show this line
  const specialTabs = ['talk', 'overview', 'sources', 'ads', 'politics', 'tone', 'suggested_vs_followed'];

  if (specialTabs.includes(activeTab)) {
    return null;
  }

  return (
    <div className="mt-8 mb-4 text-center">
      {masterCounts.postCount > 0 ? (
        <p className="text-sm text-slate-500">
          Based on {masterCounts.scanCount} scan{masterCounts.scanCount !== 1 ? 's' : ''} across {masterCounts.platformCount} platform{masterCounts.platformCount !== 1 ? 's' : ''} and {masterCounts.postCount.toLocaleString()} posts.
        </p>
      ) : (
        <p className="text-sm text-slate-500">
          Based on the selected date range, no posts were available for this tab.
        </p>
      )}
    </div>
  );
};

export default MasterCountLine;
