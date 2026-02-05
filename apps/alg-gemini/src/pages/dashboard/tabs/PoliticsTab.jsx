import React from 'react';
import {
  MasterNumbersLine,
  DenominatorLine,
  CompositionBar100WithCounts,
} from '../../../components/dashboard/primitives';
import InsightHero from '../../../components/dashboard/InsightHero';
import SectionHeader from '../../../components/dashboard/SectionHeader';
import { buildPoliticsHero } from '../../../lib/dashboard/insightBuilders';
import { aggregatePolitics, aggregateCreators, aggregateAds } from '../../../lib/dashboard/scanAggregator';

/**
 * PoliticsTab - Tab 4 of locked spec
 *
 * Provides political content analysis with:
 * - Section 4.1: Political share
 * - Section 4.2: Top political source
 * - Section 4.3: Ideological distribution (100% split)
 * - Section 4.5: Master numbers line
 */
const PoliticsTab = ({ scans, scanDetails }) => {
  // Aggregate data from all filtered scans
  const politicsData = aggregatePolitics(scans, scanDetails);
  const creatorsData = aggregateCreators(scans, scanDetails);
  const adsData = aggregateAds(scans, scanDetails);

  const totalPosts = adsData.totalPosts || 0;
  const scanCount = scans.length;
  const platformCount = Object.keys(adsData.byPlatform || {}).length || 1;

  const politicalPostsCount = politicsData.totalPolitical || 0;

  // ===========================================
  // SECTION 4.1 - Political Share
  // ===========================================

  const computePoliticalShare = () => {
    if (totalPosts === 0 || politicalPostsCount === 0) {
      return { hasData: false };
    }

    const politicalPercent = Math.round((politicalPostsCount / totalPosts) * 100);

    return {
      hasData: true,
      politicalPercent,
    };
  };

  const politicalShare = computePoliticalShare();

  // ===========================================
  // SECTION 4.2 - Top Political Source
  // ===========================================

  const computeTopPoliticalSource = () => {
    if (politicalPostsCount < 10) {
      return { hasData: false };
    }

    // Find top political creator
    if (!creatorsData.creators) {
      return { hasData: false };
    }

    const politicalCreators = Object.entries(creatorsData.creators)
      .filter(([_, creator]) => creator.political > 0)
      .map(([id, creator]) => ({ id, ...creator }))
      .sort((a, b) => b.political - a.political);

    if (politicalCreators.length === 0) {
      return { hasData: false };
    }

    const top = politicalCreators[0];
    const handle = top.id; // Use id (normalized handle)
    const politicalPostsFromSource = top.political;
    const percentOfPolitical = Math.round((politicalPostsFromSource / politicalPostsCount) * 100);

    return {
      hasData: true,
      handle,
      percentOfPolitical,
      politicalPostsFromSource,
    };
  };

  const topPoliticalSource = computeTopPoliticalSource();

  // ===========================================
  // SECTION 4.3 - Ideological Distribution
  // ===========================================

  const computeIdeologicalDistribution = () => {
    if (politicalPostsCount < 10) {
      return { hasData: false };
    }

    // Count ideology from feed items directly
    let leftCount = 0;
    let neutralCount = 0;
    let rightCount = 0;

    // Helper to extract feed items
    const getFeedItems = (scanDetail) => {
      if (!scanDetail) return [];
      const data = scanDetail.result || scanDetail.scan || scanDetail;
      return data?.feed_items || [];
    };

    // Iterate through all scans and count ideologies
    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        if (item.political?.is_political) {
          const stance = (item.political?.stance_or_alignment || '').toLowerCase();
          if (stance === 'left') {
            leftCount++;
          } else if (stance === 'neutral') {
            neutralCount++;
          } else if (stance === 'right') {
            rightCount++;
          }
          // Skip unknown/unclear/empty
        }
      }
    }

    const knownAlignmentTotal = leftCount + neutralCount + rightCount;

    // Must have at least 10 political posts with known alignment
    if (knownAlignmentTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages with rounding
    let leftPercent = Math.round((leftCount / knownAlignmentTotal) * 100);
    let neutralPercent = Math.round((neutralCount / knownAlignmentTotal) * 100);
    let rightPercent = Math.round((rightCount / knownAlignmentTotal) * 100);

    // Ensure percentages sum to exactly 100
    const sum = leftPercent + neutralPercent + rightPercent;
    if (sum !== 100) {
      const diff = 100 - sum;
      // Adjust largest segment
      if (leftCount >= neutralCount && leftCount >= rightCount) {
        leftPercent += diff;
      } else if (neutralCount >= rightCount) {
        neutralPercent += diff;
      } else {
        rightPercent += diff;
      }
    }

    return {
      hasData: true,
      segments: [
        { label: 'Left leaning', percentage: leftPercent, count: leftCount, color: '#3B82F6' },
        { label: 'Neutral or balanced', percentage: neutralPercent, count: neutralCount, color: '#94A3B8' },
        { label: 'Right leaning', percentage: rightPercent, count: rightCount, color: '#EF4444' },
      ],
      knownAlignmentTotal,
    };
  };

  const ideologicalDistribution = computeIdeologicalDistribution();

  // ===========================================
  // BUILD INSIGHT HERO
  // ===========================================

  const hero = buildPoliticsHero({
    politicalShare,
    totalPosts,
    platformCount,
  });

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="space-y-8">
      {/* Insight Hero */}
      <InsightHero {...hero} />

      {/* Section 4.1 - Political Share */}
      <section>
        <SectionHeader>Political share</SectionHeader>

        {politicalShare.hasData ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="text-sm text-slate-700 font-medium">
              Political posts: {politicalShare.politicalPercent}% of feed
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {politicalShare.politicalPercent}%
            </div>
            <DenominatorLine text={`Percent of posts in the selected date range (${totalPosts} posts)`} />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Political exposure was light in this window.
            </p>
          </div>
        )}
      </section>

      {/* Section 4.2 - Top Political Source */}
      <section>
        <SectionHeader>Top political source</SectionHeader>

        {topPoliticalSource.hasData ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="text-2xl font-semibold text-slate-900">
              @{topPoliticalSource.handle}
            </div>
            <div className="text-sm text-slate-700">
              Accounts for {topPoliticalSource.percentOfPolitical}% of political posts
            </div>
            <div className="text-xs text-slate-500">
              {topPoliticalSource.politicalPostsFromSource} political posts
            </div>
            <DenominatorLine text={`Percent of political posts (${politicalPostsCount} political posts)`} />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Not enough political posts in this window.
            </p>
          </div>
        )}
      </section>

      {/* Section 4.3 - Ideological Distribution */}
      <section>
        <SectionHeader>Ideological distribution</SectionHeader>

        {ideologicalDistribution.hasData ? (
          <div className="space-y-3">
            <CompositionBar100WithCounts segments={ideologicalDistribution.segments} />
            <p className="text-xs text-slate-500 italic">Each segment shows what percentage of political posts lean in that direction.</p>
            <DenominatorLine text={`Percent of political posts in the selected date range (${ideologicalDistribution.knownAlignmentTotal} political posts)`} />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Political content volume was too low to show a reliable distribution.
            </p>
          </div>
        )}
      </section>

      {/* Section 4.5 - Master Numbers Line */}
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

export default PoliticsTab;
