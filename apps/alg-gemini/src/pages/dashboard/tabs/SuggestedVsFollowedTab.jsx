import React from 'react';
import { MasterNumbersLine } from '../../../components/dashboard/primitives';
import { aggregateAds } from '../../../lib/dashboard/scanAggregator';

/**
 * SuggestedVsFollowedTab - Tab 6 placeholder
 *
 * This tab is a placeholder for future functionality that will compare
 * content suggested by the platform with content from accounts you follow.
 */
const SuggestedVsFollowedTab = ({ scans, scanDetails }) => {
  // Aggregate data for master numbers line
  const adsData = aggregateAds(scans, scanDetails);

  const totalPosts = adsData.totalPosts || 0;
  const scanCount = scans.length;
  const platformCount = Object.keys(adsData.byPlatform || {}).length || 1;

  return (
    <div className="space-y-8">
      {/* Placeholder content */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Suggested vs Followed</h2>
          <p className="text-slate-600 mb-4">
            This section will show how much of your feed comes from accounts you follow versus content suggested by the platform.
          </p>
          <p className="text-slate-600">
            Right now, AlgorithmLens can't reliably tell which posts were suggested and which came from accounts you follow, so this view is intentionally unavailable.
          </p>
        </div>
      </section>

      {/* Master Numbers Line */}
      <section className="pt-4 border-t border-slate-200">
        <MasterNumbersLine
          scanCount={scanCount}
          platformCount={platformCount}
          postCount={totalPosts}
        />
      </section>
    </div>
  );
};

export default SuggestedVsFollowedTab;
