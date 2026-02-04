import React from 'react';
import {
  MasterNumbersLine,
  CompositionBar100WithCounts,
} from '../../../components/dashboard/primitives';
import { aggregateSourceOrigin } from '../../../lib/dashboard/scanAggregator';

/**
 * SuggestedVsFollowedTab - Tab 6 of dashboard
 *
 * Shows the breakdown of feed content by origin:
 * - Suggested: Content algorithmically recommended by the platform
 * - Followed: Content from accounts the user follows
 *
 * Displays:
 * - Top insight card with main percentage
 * - Horizontal stacked bar (overall split)
 * - Platform breakdown (if multiple platforms)
 * - What you can do card
 */
const SuggestedVsFollowedTab = ({ scans, scanDetails }) => {
  // Aggregate data from all filtered scans
  const sourceData = aggregateSourceOrigin(scans, scanDetails);

  const totalPosts = sourceData.totalPosts || 0;
  const scanCount = scans.length;
  const platformCount = Object.keys(sourceData.byPlatform || {}).length;

  // ===========================================
  // COMPUTE UI DATA
  // ===========================================

  const hasData = sourceData.hasData && totalPosts > 0;

  // Main stacked bar segments
  const mainSegments = hasData ? [
    {
      label: 'Followed',
      percentage: sourceData.followedPercentage,
      count: sourceData.totalFollowed,
      color: '#3b82f6', // blue-500
    },
    {
      label: 'Suggested',
      percentage: sourceData.suggestedPercentage,
      count: sourceData.totalSuggested,
      color: '#f59e0b', // amber-500
    },
  ] : [];

  // Platform breakdown segments
  const platformSegments = {};
  if (hasData && platformCount > 1) {
    for (const [platform, data] of Object.entries(sourceData.byPlatform)) {
      if (data.total > 0) {
        platformSegments[platform] = [
          {
            label: 'Followed',
            percentage: data.followedPercent,
            count: data.followed,
            color: '#3b82f6',
          },
          {
            label: 'Suggested',
            percentage: data.suggestedPercent,
            count: data.suggested,
            color: '#f59e0b',
          },
        ];
      }
    }
  }

  // ===========================================
  // RENDER
  // ===========================================

  if (!hasData) {
    return (
      <div className="space-y-8">
        {/* No data message */}
        <section>
          <div className="bg-white border border-slate-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Suggested vs Followed</h2>
            <p className="text-slate-600 mb-4">
              This view shows how much of your feed comes from accounts you follow versus content suggested by the platform.
            </p>
            <p className="text-slate-600">
              AlgorithmLens will be able to compute this in future releases when platform metadata is captured during scans. For now, this analysis is only available in demo mode.
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
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Top Insight Card */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800">
            Suggested content: {sourceData.suggestedPercentage}% of your feed
          </h2>
          <p className="text-sm text-slate-500">
            Based on {scanCount} scan{scanCount !== 1 ? 's' : ''} across {platformCount} platform{platformCount !== 1 ? 's' : ''} and {totalPosts} posts.
          </p>
        </div>
      </section>

      {/* Section 2: Overall Breakdown */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Overall breakdown</h3>
          <CompositionBar100WithCounts segments={mainSegments} />
        </div>
      </section>

      {/* Section 3: Platform Breakdown (if multiple platforms) */}
      {platformCount > 1 && Object.keys(platformSegments).length > 0 && (
        <section>
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-medium text-slate-800">By platform</h3>
            {Object.entries(platformSegments).map(([platform, segments]) => (
              <div key={platform} className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700 capitalize">
                  {platform}
                </h4>
                <CompositionBar100WithCounts segments={segments} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: What You Can Do */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-slate-800">What you can do</h3>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>
                <strong>Follow more accounts:</strong> If suggested content dominates your feed, following more creators in topics you care about can help balance what you see.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>
                <strong>Use chronological feeds:</strong> Some platforms offer a "Following" or "Latest" feed mode that shows only posts from accounts you follow, in chronological order.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>
                <strong>Curate your algorithm:</strong> Engage with (like, share, comment) content from accounts you follow to signal to the algorithm that you want to see more from them.
              </span>
            </li>
          </ul>
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
