import React, { useState } from 'react';
import {
  MasterNumbersLine,
  CompositionBar100WithCounts,
  DenominatorLine,
} from '../../../components/dashboard/primitives';
import InsightHero from '../../../components/dashboard/InsightHero';
import SectionHeader from '../../../components/dashboard/SectionHeader';
import TrendsCTA from '../../../components/dashboard/TrendsCTA';
import TrendsPanel from '../../../components/dashboard/TrendsPanel';
import { buildSuggestedVsFollowedHero } from '../../../lib/dashboard/insightBuilders';
import {
  aggregateSourceOrigin,
  aggregateTopicsBySourceOrigin,
  aggregateAdsBySourceOrigin,
  aggregateCreatorFamiliarityBySourceOrigin,
  aggregateContentTypeBySourceOrigin,
} from '../../../lib/dashboard/scanAggregator';
import EvidenceBundleTeaser from '../../../components/plan/EvidenceBundleTeaser';
import FreeAskTeaser from '../../../components/dashboard/FreeAskTeaser';

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
 * - Creator novelty analysis
 * - Commercial content comparison
 * - Tone comparison (suggested vs followed)
 * - Collapsible details: Topics, Content Type
 * - What you can do card
 */
const SuggestedVsFollowedTab = ({
  scans,
  scanDetails,
  onOpenTrends,
  isPlusUser,
  showTrendsPanel,
  onCloseTrendsPanel,
}) => {

  const [showDetails, setShowDetails] = useState(false);

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

    if (suggestedTotal < 10 || followedTotal < 10) {
      return { hasData: false };
    }

    let sugPosPercent = Math.round((suggestedPos / suggestedTotal) * 100);
    let sugNeutPercent = Math.round((suggestedNeut / suggestedTotal) * 100);
    let sugNegPercent = Math.round((suggestedNeg / suggestedTotal) * 100);

    const sugSum = sugPosPercent + sugNeutPercent + sugNegPercent;
    if (sugSum !== 100) {
      const diff = 100 - sugSum;
      if (suggestedPos >= suggestedNeut && suggestedPos >= suggestedNeg) sugPosPercent += diff;
      else if (suggestedNeut >= suggestedNeg) sugNeutPercent += diff;
      else sugNegPercent += diff;
    }

    let folPosPercent = Math.round((followedPos / followedTotal) * 100);
    let folNeutPercent = Math.round((followedNeut / followedTotal) * 100);
    let folNegPercent = Math.round((followedNeg / followedTotal) * 100);

    const folSum = folPosPercent + folNeutPercent + folNegPercent;
    if (folSum !== 100) {
      const diff = 100 - folSum;
      if (followedPos >= followedNeut && followedPos >= followedNeg) folPosPercent += diff;
      else if (followedNeut >= followedNeg) folNeutPercent += diff;
      else folNegPercent += diff;
    }

    const deltas = [
      { type: 'positive', value: folPosPercent - sugPosPercent, label: 'positive or happy' },
      { type: 'neutral', value: folNeutPercent - sugNeutPercent, label: 'neutral or balanced' },
      { type: 'negative', value: folNegPercent - sugNegPercent, label: 'negative or conflict-focused' },
    ];
    const largestDelta = deltas.reduce((max, current) =>
      Math.abs(current.value) > Math.abs(max.value) ? current : max
    );

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
          { label: 'Positive', percentage: sugPosPercent, count: suggestedPos, color: '#93C5B8' },
          { label: 'Neutral', percentage: sugNeutPercent, count: suggestedNeut, color: '#CBD5E1' },
          { label: 'Negative', percentage: sugNegPercent, count: suggestedNeg, color: '#A3B1C6' },
        ],
        total: suggestedTotal,
      },
      followed: {
        segments: [
          { label: 'Positive', percentage: folPosPercent, count: followedPos, color: '#93C5B8' },
          { label: 'Neutral', percentage: folNeutPercent, count: followedNeut, color: '#CBD5E1' },
          { label: 'Negative', percentage: folNegPercent, count: followedNeg, color: '#A3B1C6' },
        ],
        total: followedTotal,
      },
    };
  };

  const toneBySourceOrigin = computeToneBySourceOrigin();

  // ===========================================
  // COMPUTE NEW CROSS-CUTTING ANALYSES
  // ===========================================

  const creatorFamiliarity = aggregateCreatorFamiliarityBySourceOrigin(scans, scanDetails);
  const adComparison = aggregateAdsBySourceOrigin(scans, scanDetails);
  const topicComparison = aggregateTopicsBySourceOrigin(scans, scanDetails);
  const contentTypeComparison = aggregateContentTypeBySourceOrigin(scans, scanDetails);

  // ===========================================
  // BUILD INSIGHT HERO
  // ===========================================

  const hero = buildSuggestedVsFollowedHero({
    sourceData,
    toneBySourceOrigin,
    totalPosts,
    platformCount,
    creatorFamiliarity,
    adComparison,
  });

  // ===========================================
  // RENDER
  // ===========================================

  if (!hasData) {
    return (
      <div className="space-y-10">
        {/* No data message */}
        <section>
          <div className="bg-white border border-slate-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Suggested vs Followed</h2>
            <p className="text-slate-600 mb-4">
              This view shows how much of your feed comes from accounts you follow versus content suggested by the platform.
            </p>
            <p className="text-slate-600">
              <strong>Coming Soon.</strong> This analysis will be available once platform metadata capture is enabled during scans. It will show how much of your feed comes from accounts you follow versus content the algorithm suggests for you.
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

      {/* Trends CTA */}
      <TrendsCTA
        onClick={() => onOpenTrends({ tab: 'suggested_vs_followed', placement: 'hero_trends' })}
        isPlusUser={isPlusUser}
      />

      {/* Trends Panel (Plus users only) */}
      {showTrendsPanel && (
        <TrendsPanel
          scans={scans}
          scanDetails={scanDetails}
          onClose={onCloseTrendsPanel}
        />
      )}

      {/* Section: Overall Breakdown */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <SectionHeader>Overall breakdown</SectionHeader>
          <CompositionBar100WithCounts segments={mainSegments} />
          <p className="text-xs text-slate-500 italic">Each segment shows what percentage of posts come from that source type.</p>
        </div>
      </section>

      {/* Section: Platform Breakdown (if multiple platforms) */}
      {platformCount > 1 && Object.keys(platformSegments).length > 0 && (
        <section>
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
            <SectionHeader>By platform</SectionHeader>

            <div className="space-y-4">
              {sortPlatforms(Object.keys(platformSegments)).map((platform) => {
                const segments = platformSegments[platform];
                return (
                  <div key={platform} className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-700">
                      {normalizePlatformName(platform)}
                    </h4>

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

      {/* Section: Are These New Voices? (Creator Novelty) */}
      {creatorFamiliarity.hasData && (
        <section>
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <SectionHeader>Are these new voices?</SectionHeader>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{creatorFamiliarity.noveltyPercent}%</span>
              <span className="text-sm text-slate-600">of algorithm picks are from creators you don't follow</span>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-800">{creatorFamiliarity.suggestedCreatorCount}</div>
                <div className="text-xs text-slate-500">Creators in suggestions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-800">{creatorFamiliarity.overlapCount}</div>
                <div className="text-xs text-slate-500">Also in your follows</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-800">{creatorFamiliarity.followedCreatorCount}</div>
                <div className="text-xs text-slate-500">Followed creators</div>
              </div>
            </div>

            <p className="text-sm text-slate-600 pt-2">
              {creatorFamiliarity.noveltyPercent >= 60
                ? 'Most suggested content came from creators you don\'t follow — lots of new voices in the mix.'
                : creatorFamiliarity.noveltyPercent >= 40
                ? 'A mix of new and familiar creators appear in suggested content.'
                : 'Most suggested content came from creators you already follow.'
              }
            </p>
          </div>
        </section>
      )}

      {/* Section: Commercial Content Comparison */}
      {adComparison.hasData && (
        <section>
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <SectionHeader>Commercial content comparison</SectionHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Suggested */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Suggested posts</h4>
                <CompositionBar100WithCounts segments={[
                  { label: 'Ads', percentage: adComparison.suggestedAdPercent, count: adComparison.suggestedAds, color: '#F59E0B' },
                  { label: 'Not ads', percentage: 100 - adComparison.suggestedAdPercent, count: adComparison.suggestedTotal - adComparison.suggestedAds, color: '#94A3B8' },
                ]} />
                <DenominatorLine text={`${adComparison.suggestedTotal} suggested posts`} />
              </div>

              {/* Followed */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Followed posts</h4>
                <CompositionBar100WithCounts segments={[
                  { label: 'Ads', percentage: adComparison.followedAdPercent, count: adComparison.followedAds, color: '#F59E0B' },
                  { label: 'Not ads', percentage: 100 - adComparison.followedAdPercent, count: adComparison.followedTotal - adComparison.followedAds, color: '#94A3B8' },
                ]} />
                <DenominatorLine text={`${adComparison.followedTotal} followed posts`} />
              </div>
            </div>

            {adComparison.deltaInsight && (
              <p className="text-sm text-slate-600 pt-2">
                {adComparison.deltaInsight}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Section: Tone Split by Source Origin */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <SectionHeader>Tone: suggested vs followed</SectionHeader>

          {toneBySourceOrigin.hasData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700">Suggested posts</h4>
                  <CompositionBar100WithCounts segments={toneBySourceOrigin.suggested.segments} />
                  <DenominatorLine text={`Percent of suggested posts (${toneBySourceOrigin.suggested.total} posts)`} />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700">Followed posts</h4>
                  <CompositionBar100WithCounts segments={toneBySourceOrigin.followed.segments} />
                  <DenominatorLine text={`Percent of followed posts (${toneBySourceOrigin.followed.total} posts)`} />
                </div>
              </div>

              <p className="text-xs text-slate-500 italic">Compares emotional tone between suggested and followed content in your feed.</p>

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

      {/* Collapsible Details Toggle */}
      {(topicComparison.hasData || contentTypeComparison.hasData) && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
            {showDetails ? 'Hide details' : 'See more details'}
          </button>
        </div>
      )}

      {/* Collapsible Detail Sections */}
      {showDetails && (
        <>
          {/* Section: Topics the Algorithm Favors */}
          {topicComparison.hasData && (
            <section>
              <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                <SectionHeader>Top topics in suggested content</SectionHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Algorithm Top Topics */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Top suggested topics</h4>
                    <div className="space-y-2">
                      {topicComparison.topAlgorithmTopics.map((t, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{t.topic}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(t.percent, 100)}%`, backgroundColor: '#f59e0b' }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-8 text-right">{t.percent}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <DenominatorLine text={`% of ${topicComparison.suggestedTotal} suggested posts with topic data`} />
                  </div>

                  {/* Followed Top Topics */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Top followed topics</h4>
                    <div className="space-y-2">
                      {topicComparison.topFollowedTopics.map((t, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{t.topic}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(t.percent, 100)}%`, backgroundColor: '#3b82f6' }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-8 text-right">{t.percent}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <DenominatorLine text={`% of ${topicComparison.followedTotal} followed posts with topic data`} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section: Content Format Preferences */}
          {contentTypeComparison.hasData && (
            <section>
              <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                <SectionHeader>Content format preferences</SectionHeader>

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Format</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Suggested</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Followed</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const allTypes = new Set([
                          ...Object.keys(contentTypeComparison.suggested),
                          ...Object.keys(contentTypeComparison.followed),
                        ]);
                        const rows = Array.from(allTypes)
                          .map(type => ({
                            type: type.charAt(0) + type.slice(1).toLowerCase(),
                            sugPercent: contentTypeComparison.suggested[type]?.percent || 0,
                            folPercent: contentTypeComparison.followed[type]?.percent || 0,
                          }))
                          .sort((a, b) => b.sugPercent - a.sugPercent);

                        return rows.map((row, idx) => {
                          const delta = row.sugPercent - row.folPercent;
                          return (
                            <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                              <td className="px-4 py-3 text-sm text-slate-800">{row.type}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-right">{row.sugPercent}%</td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-right">{row.folPercent}%</td>
                              <td className="px-4 py-3 text-sm text-right">
                                {delta === 0 ? (
                                  <span className="text-slate-400">—</span>
                                ) : (
                                  <span className={delta > 0 ? 'text-amber-600' : 'text-blue-600'}>
                                    {delta > 0 ? '+' : ''}{delta}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {contentTypeComparison.dominantDelta && (
                  <p className="text-sm text-slate-600">
                    {contentTypeComparison.dominantDelta.insight}
                  </p>
                )}

                <DenominatorLine text={`Based on ${contentTypeComparison.suggestedTotal} suggested and ${contentTypeComparison.followedTotal} followed posts`} />
              </div>
            </section>
          )}
        </>
      )}

      {/* Section: What You Can Do */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>
          <SectionHeader>What you can do</SectionHeader>
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
                <strong>Engage with what you value:</strong> Platforms often describe engagement (likes, shares, comments) as a factor in feed ranking, though the exact effect is not publicly documented.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Evidence Bundle + Ask Your Feed Teasers (free users only) */}
      {!isPlusUser && (
        <>
          <EvidenceBundleTeaser
            tabName="suggested"
            teaserText="Plus analyzes the balance between content you chose and content the platform suggested, with detailed breakdowns."
          />
          <FreeAskTeaser
            tabName="suggested"
            exampleQuestion="How much of my feed was content I chose to follow versus suggestions?"
          />
        </>
      )}

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
