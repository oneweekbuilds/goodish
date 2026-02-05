import React from 'react';
import {
  MasterNumbersLine,
  CompositionBar100WithCounts,
  DenominatorLine,
} from '../../../components/dashboard/primitives';
import InsightHero from '../../../components/dashboard/InsightHero';
import { buildSuggestedVsFollowedHero } from '../../../lib/dashboard/insightBuilders';
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

  // Platform name normalization for display
  const normalizePlatformName = (platform) => {
    const normalized = {
      'instagram': 'Instagram',
      'tiktok': 'TikTok',
      'youtube': 'YouTube',
      'x': 'X',
      'twitter': 'X',
    };
    return normalized[platform.toLowerCase()] || platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  // Platform sort order (Instagram first, TikTok second, then alphabetical)
  const sortPlatforms = (platforms) => {
    const order = ['instagram', 'tiktok'];
    return platforms.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aIndex = order.indexOf(aLower);
      const bIndex = order.indexOf(bLower);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return aLower.localeCompare(bLower);
    });
  };

  // ===========================================
  // COMPUTE UI DATA
  // ===========================================

  const hasData = sourceData.hasData && totalPosts > 0;

  // Get platform list for hero card
  const platformList = Object.keys(sourceData.byPlatform || {});
  const sortedPlatforms = sortPlatforms([...platformList]);
  const platformDisplayText = sortedPlatforms.length > 0
    ? sortedPlatforms.map(normalizePlatformName).join(' + ')
    : '';

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

    // Compute tone deltas (followed - suggested)
    const deltaPositive = folPosPercent - sugPosPercent;
    const deltaNeutral = folNeutPercent - sugNeutPercent;
    const deltaNegative = folNegPercent - sugNegPercent;

    // Find the largest absolute delta
    const deltas = [
      { type: 'positive', value: deltaPositive, label: 'positive or happy' },
      { type: 'neutral', value: deltaNeutral, label: 'neutral or balanced' },
      { type: 'negative', value: deltaNegative, label: 'negative or outrage' },
    ];
    const largestDelta = deltas.reduce((max, current) =>
      Math.abs(current.value) > Math.abs(max.value) ? current : max
    );

    // Generate insight sentence
    let deltaInsight = '';
    if (Math.abs(largestDelta.value) >= 5) {
      const absDelta = Math.abs(largestDelta.value);
      const points = absDelta === 1 ? 'point' : 'points';
      if (largestDelta.value > 0) {
        deltaInsight = `Biggest difference: Followed posts are +${absDelta} ${points} more ${largestDelta.label}.`;
      } else {
        deltaInsight = `Biggest difference: Suggested posts are +${absDelta} ${points} more ${largestDelta.label}.`;
      }
    }

    return {
      hasData: true,
      deltaInsight,
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
  // BUILD INSIGHT HERO
  // ===========================================

  const hero = buildSuggestedVsFollowedHero({
    sourceData,
    toneBySourceOrigin,
    totalPosts,
    platformCount,
  });

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
    <div className="space-y-8 lg:pr-24">
      {/* Insight Hero */}
      <InsightHero {...hero} />

      {/* Section 2: Overall Breakdown */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Overall breakdown</h3>
          <CompositionBar100WithCounts segments={mainSegments} />
          <p className="text-xs text-slate-500 italic">Each segment shows what percentage of posts come from that source type.</p>
        </div>
      </section>

      {/* Section 3: Platform Breakdown (if multiple platforms) */}
      {platformCount > 1 && Object.keys(platformSegments).length > 0 && (
        <section>
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
            <h3 className="text-lg font-medium text-slate-800">By platform</h3>

            {/* Platform bars */}
            <div className="space-y-4">
              {sortPlatforms(Object.keys(platformSegments)).map((platform) => {
                const segments = platformSegments[platform];
                return (
                  <div key={platform} className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700">
                      {normalizePlatformName(platform)}
                    </h4>

                    {/* Bar only (no legend) */}
                    <div className="h-8 bg-slate-100 rounded-full overflow-hidden flex">
                      {segments.map((segment, index) => (
                        <div
                          key={index}
                          className="h-full transition-all duration-300 flex items-center justify-center"
                          style={{
                            width: `${segment.percentage}%`,
                            backgroundColor: segment.color,
                            minWidth: segment.percentage > 0 ? '2px' : '0',
                          }}
                          title={`${segment.label}: ${Math.round(segment.percentage)}% (${segment.count})`}
                        >
                          {segment.percentage >= 10 && (
                            <span className="text-xs font-medium text-white drop-shadow-sm">
                              {Math.round(segment.percentage)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Simple count line */}
                    <p className="text-xs text-slate-600">
                      {segments.map((seg, i) => (
                        <span key={i}>
                          {i > 0 && ' · '}
                          {seg.label.split(' ')[0]}: {seg.count} ({Math.round(seg.percentage)}%)
                        </span>
                      ))}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Single legend at bottom */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
                {mainSegments.map((segment, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-[13px] leading-relaxed text-slate-700 font-medium">
                      {segment.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 4: Tone Split by Source Origin (matches ToneTab pattern) */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Tone: suggested vs followed</h3>

          {toneBySourceOrigin.hasData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Suggested Posts */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700">Suggested posts</h4>
                  <CompositionBar100WithCounts segments={toneBySourceOrigin.suggested.segments} />
                  <DenominatorLine text={`Percent of suggested posts (${toneBySourceOrigin.suggested.total} posts)`} />
                </div>

                {/* Followed Posts */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700">Followed posts</h4>
                  <CompositionBar100WithCounts segments={toneBySourceOrigin.followed.segments} />
                  <DenominatorLine text={`Percent of followed posts (${toneBySourceOrigin.followed.total} posts)`} />
                </div>
              </div>

              <p className="text-xs text-slate-500 italic">Compares emotional tone between suggested and followed content in your feed.</p>

              {/* Delta Insight */}
              {toneBySourceOrigin.deltaInsight && (
                <p className="text-sm text-slate-600 pt-2">
                  {toneBySourceOrigin.deltaInsight}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-4">
              Not enough posts in both suggested and followed groups to compare tone.
            </p>
          )}
        </div>
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
