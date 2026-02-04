import React from 'react';
import {
  MasterNumbersLine,
  CompositionBar100WithCounts,
  DenominatorLine,
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

  // Helper to extract feed items (matches ToneTab pattern)
  const getFeedItems = (scanDetail) => {
    if (!scanDetail) return [];
    const data = scanDetail.result || scanDetail.scan || scanDetail;
    return data?.feed_items || [];
  };

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
  // COMPUTE TONE BY SOURCE ORIGIN
  // (Matches ToneTab pattern exactly)
  // ===========================================

  const computeToneBySourceOrigin = () => {
    // Count tone for suggested vs followed posts
    let suggestedPos = 0;
    let suggestedNeut = 0;
    let suggestedNeg = 0;

    let followedPos = 0;
    let followedNeut = 0;
    let followedNeg = 0;

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const valence = item.emotions?.valence;
        const origin = item.sourceOrigin;

        if (valence === 'POSITIVE' || valence === 'NEUTRAL' || valence === 'NEGATIVE') {
          if (origin === 'suggested') {
            if (valence === 'POSITIVE') suggestedPos++;
            else if (valence === 'NEUTRAL') suggestedNeut++;
            else if (valence === 'NEGATIVE') suggestedNeg++;
          } else if (origin === 'followed') {
            if (valence === 'POSITIVE') followedPos++;
            else if (valence === 'NEUTRAL') followedNeut++;
            else if (valence === 'NEGATIVE') followedNeg++;
          }
        }
      }
    }

    const suggestedTotal = suggestedPos + suggestedNeut + suggestedNeg;
    const followedTotal = followedPos + followedNeut + followedNeg;

    // Must have at least 10 posts in BOTH groups
    if (suggestedTotal < 10 || followedTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages for suggested posts
    let sugPosPercent = Math.round((suggestedPos / suggestedTotal) * 100);
    let sugNeutPercent = Math.round((suggestedNeut / suggestedTotal) * 100);
    let sugNegPercent = Math.round((suggestedNeg / suggestedTotal) * 100);

    const sugSum = sugPosPercent + sugNeutPercent + sugNegPercent;
    if (sugSum !== 100) {
      const diff = 100 - sugSum;
      if (suggestedPos >= suggestedNeut && suggestedPos >= suggestedNeg) {
        sugPosPercent += diff;
      } else if (suggestedNeut >= suggestedNeg) {
        sugNeutPercent += diff;
      } else {
        sugNegPercent += diff;
      }
    }

    // Calculate percentages for followed posts
    let folPosPercent = Math.round((followedPos / followedTotal) * 100);
    let folNeutPercent = Math.round((followedNeut / followedTotal) * 100);
    let folNegPercent = Math.round((followedNeg / followedTotal) * 100);

    const folSum = folPosPercent + folNeutPercent + folNegPercent;
    if (folSum !== 100) {
      const diff = 100 - folSum;
      if (followedPos >= followedNeut && followedPos >= followedNeg) {
        folPosPercent += diff;
      } else if (followedNeut >= followedNeg) {
        folNeutPercent += diff;
      } else {
        folNegPercent += diff;
      }
    }

    return {
      hasData: true,
      suggested: {
        segments: [
          { label: 'Positive or happy tone', percentage: sugPosPercent, count: suggestedPos, color: '#86EFAC' },
          { label: 'Neutral or balanced tone', percentage: sugNeutPercent, count: suggestedNeut, color: '#CBD5E1' },
          { label: 'Negative or outrage tone', percentage: sugNegPercent, count: suggestedNeg, color: '#FCA5A5' },
        ],
        total: suggestedTotal,
      },
      followed: {
        segments: [
          { label: 'Positive or happy tone', percentage: folPosPercent, count: followedPos, color: '#86EFAC' },
          { label: 'Neutral or balanced tone', percentage: folNeutPercent, count: followedNeut, color: '#CBD5E1' },
          { label: 'Negative or outrage tone', percentage: folNegPercent, count: followedNeg, color: '#FCA5A5' },
        ],
        total: followedTotal,
      },
    };
  };

  const toneBySourceOrigin = computeToneBySourceOrigin();

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

      {/* Section 4: Tone Split by Source Origin (matches ToneTab pattern) */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Tone: suggested vs followed</h2>

        {toneBySourceOrigin.hasData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Suggested Posts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Suggested posts</h3>
              <CompositionBar100WithCounts segments={toneBySourceOrigin.suggested.segments} />
              <DenominatorLine text={`Percent of suggested posts (${toneBySourceOrigin.suggested.total} posts)`} />
            </div>

            {/* Followed Posts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Followed posts</h3>
              <CompositionBar100WithCounts segments={toneBySourceOrigin.followed.segments} />
              <DenominatorLine text={`Percent of followed posts (${toneBySourceOrigin.followed.total} posts)`} />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Not enough posts in both suggested and followed groups to compare tone.
            </p>
          </div>
        )}
      </section>

      {/* Section 6: What You Can Do */}
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
