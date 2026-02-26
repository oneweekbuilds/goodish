import React from 'react';
import {
  MasterNumbersLine,
  DenominatorLine,
  ConcentrationSummary,
} from '../../../components/dashboard/primitives';
import InsightHero from '../../../components/dashboard/InsightHero';
import TrendsCTA from '../../../components/dashboard/TrendsCTA';
import TrendsPanel from '../../../components/dashboard/TrendsPanel';
import { buildSourcesHero } from '../../../lib/dashboard/insightBuilders';
import { SimpleTable } from '../../../components/dashboard/charts';
import { aggregateCreators, aggregateAds } from '../../../lib/dashboard/scanAggregator';
import EvidenceBundleTeaser from '../../../components/plan/EvidenceBundleTeaser';
import FreeAskTeaser from '../../../components/dashboard/FreeAskTeaser';

/**
 * Generate plain-English summary bullets for sources
 * @param {Object} params
 * @returns {Array<string>} Array of summary bullets
 */
function generateSourcesSummary({
  topSourcesTableData,
  top5Percent,
  uniqueCreatorCount,
  totalPosts,
}) {
  const summaries = [];

  if (!topSourcesTableData || topSourcesTableData.length === 0) {
    return summaries;
  }

  // 1. Concentration bullet (top 5)
  if (top5Percent != null && top5Percent > 0) {
    summaries.push(
      `Your top 5 sources accounted for ${Math.round(top5Percent)}% of posts.`
    );
  }

  // 2. Dominant source bullet
  const topSource = topSourcesTableData[0];
  if (topSource) {
    const topSourcePercent = (topSource.postCount / totalPosts) * 100;

    // Edge case: no single dominant source (< 10%)
    if (topSourcePercent < 10) {
      summaries.push('No single source dominated this scan.');
    } else {
      summaries.push(
        `Your top source was ${topSource.handle} (${topSourcePercent.toFixed(1)}%).`
      );
    }
  }

  // 3. Long tail bullet (total unique sources)
  if (uniqueCreatorCount != null && uniqueCreatorCount > 0) {
    summaries.push(
      `You saw posts from ${uniqueCreatorCount.toLocaleString('en-US')} source${uniqueCreatorCount !== 1 ? 's' : ''} overall.`
    );
  }

  return summaries;
}

/**
 * SourcesTab - Tab 2 of locked spec
 *
 * Provides a breakdown of source concentration with:
 * - Sources summary (plain-English bullets)
 * - Section 2.1: Top sources table (Top 10)
 * - Section 2.2: Concentration summary
 * - Section 2.3: Suggested vs Followed share (HIDDEN - capability missing)
 * - Section 2.4: Master numbers line
 */
const SourcesTab = ({
  scans,
  scanDetails,
  onOpenTrends,
  isPlusUser,
  showTrendsPanel,
  onCloseTrendsPanel,
}) => {

  // Aggregate data from all filtered scans
  const creatorsData = aggregateCreators(scans, scanDetails);
  const adsData = aggregateAds(scans, scanDetails);

  const totalPosts = adsData.totalPosts || 0;
  const scanCount = scans.length;
  const platformCount = Object.keys(adsData.byPlatform || {}).length || 1;

  // Denominator text (exact spec)
  const denominatorText = `Percent of posts in the selected date range (${totalPosts} posts)`;

  // ===========================================
  // COMPUTE TOP SOURCES DATA
  // ===========================================

  const hasSourcesData = totalPosts > 0 && creatorsData.uniqueCreatorCount > 0;

  let topSourcesTableData = [];
  let top5Percent = 0;
  let top10Percent = 0;
  let othersPercent = 0;

  if (hasSourcesData) {
    // Sort creators by post count
    const sortedCreators = Object.entries(creatorsData.creators)
      .map(([id, creator]) => ({ id, ...creator }))
      .sort((a, b) => b.totalPosts - a.totalPosts);

    // Premium users see top 10, free users see top 5
    const tableLimit = isPlusUser ? 10 : 5;
    const top10 = sortedCreators.slice(0, tableLimit);

    // Build table data (sorted by post count descending)
    topSourcesTableData = top10.map((creator, index) => {
      const sharePercent = (creator.totalPosts / totalPosts) * 100;
      return {
        rank: index + 1,
        handle: `@${creator.id}`, // Use id (normalized handle) with @ prefix
        sharePercent: sharePercent.toFixed(1) + '%', // Decimal precision (e.g., "12.3%")
        postCount: creator.totalPosts,
      };
    });

    // Calculate concentration percentages
    const top5 = sortedCreators.slice(0, 5);
    const top5PostCount = top5.reduce((sum, c) => sum + c.totalPosts, 0);
    top5Percent = (top5PostCount / totalPosts) * 100;

    const top10PostCount = top10.reduce((sum, c) => sum + c.totalPosts, 0);
    top10Percent = (top10PostCount / totalPosts) * 100;

    othersPercent = 100 - top10Percent;

    // Round percentages
    top5Percent = Math.round(top5Percent);
    top10Percent = Math.round(top10Percent);
    othersPercent = Math.round(othersPercent);

    // Ensure top10Percent + othersPercent = 100 (top5 is informational, overlaps with top10)
    const sum = top10Percent + othersPercent;
    if (sum !== 100) {
      const diff = 100 - sum;
      // Adjust the larger value
      if (top10Percent >= othersPercent) {
        top10Percent += diff;
      } else {
        othersPercent += diff;
      }
    }
  }

  // ===========================================
  // BUILD INSIGHT HERO
  // ===========================================

  const hero = buildSourcesHero({
    top5Percent,
    totalPosts,
    platformCount,
    hasData: hasSourcesData,
  });

  // ===========================================
  // GENERATE SOURCES SUMMARY
  // ===========================================

  const sourcesSummary = hasSourcesData
    ? generateSourcesSummary({
        topSourcesTableData,
        top5Percent,
        uniqueCreatorCount: creatorsData.uniqueCreatorCount,
        totalPosts,
      })
    : [];

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="space-y-10">
      {/* Insight Hero */}
      <InsightHero {...hero} />

      {/* Trends CTA or Panel */}
      <TrendsCTA
        onClick={() => onOpenTrends({ tab: 'sources', placement: 'hero_trends' })}
        isPlusUser={isPlusUser}
        tabName="sources"
        scanCount={scans.length}
      />

      {/* Trends Panel (auto-show for Plus users or when manually opened) */}
      {(isPlusUser || showTrendsPanel) && (
        <TrendsPanel
          scans={scans}
          scanDetails={scanDetails}
          onClose={onCloseTrendsPanel}
          embedded={isPlusUser}
        />
      )}

      {/* Sources Summary - Stat Cards */}
      {sourcesSummary.length > 0 && (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Top 5 Concentration Card */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Top 5 Concentration</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round(top5Percent)}%</p>
              <p className="text-sm text-slate-500 mt-1">of all posts</p>
            </div>
            
            {/* Top Source Card */}
            {topSourcesTableData.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Top Source</p>
                <p className="text-lg font-bold text-slate-900">{topSourcesTableData[0].handle}</p>
                <p className="text-sm text-slate-500 mt-1">{topSourcesTableData[0].sharePercent} of posts</p>
              </div>
            )}
            
            {/* Total Sources Card */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Sources</p>
              <p className="text-2xl font-bold text-slate-900">{creatorsData.uniqueCreatorCount}</p>
              <p className="text-sm text-slate-500 mt-1">unique accounts</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-4">Based on posts in this scan.</p>
        </section>
      )}

      {/* Section 2.1 - Top Sources Table */}
      <section>
        {hasSourcesData ? (
          <>
            {/* Denominator line */}
            <div className="mb-4">
              <DenominatorLine text={denominatorText} />
            </div>

            {/* Table */}
            <SimpleTable
              columns={[
                { key: 'rank', label: 'Rank', width: '15%', align: 'left' },
                { key: 'handle', label: 'Source handle', width: '40%', align: 'left' },
                { key: 'sharePercent', label: 'Share', width: '25%', align: 'right' },
                { key: 'postCount', label: 'Posts', width: '20%', align: 'right' },
              ]}
              rows={topSourcesTableData}
            />

            {/* Upgrade teaser for free users */}
            {!isPlusUser && creatorsData.uniqueCreatorCount > 5 && (
              <div className="mt-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                <p className="text-xs text-slate-500">
                  Showing top 5 of {creatorsData.uniqueCreatorCount} sources.{' '}
                  <a href="/plus" className="text-primary-blue font-medium hover:underline">
                    Upgrade to Premium
                  </a>{' '}
                  to see the full list.
                </p>
              </div>
            )}

            {/* For Plus users, show how many sources are being displayed */}
            {isPlusUser && creatorsData.uniqueCreatorCount > 10 && (
              <div className="mt-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                <p className="text-xs text-slate-500">
                  Showing top {topSourcesTableData.length} of {creatorsData.uniqueCreatorCount} sources.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-sm text-slate-500">
              Source data will appear here once your scan captures post authors. Try scanning again.
            </p>
          </div>
        )}
      </section>

      {/* Section 2.2 - Concentration Summary */}
      {hasSourcesData && (
        <section>
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <ConcentrationSummary
              top5Percent={top5Percent}
              top10Percent={top10Percent}
              othersPercent={othersPercent}
            />
            <p className="text-xs text-slate-500 italic">Higher values for top sources indicate a more concentrated feed. Sources are identified by account handle. Counts are approximate and based on metadata captured during scans.</p>
          </div>
        </section>
      )}

      {/* Evidence Bundle + Ask Your Feed Teasers (free users only) */}
      {!isPlusUser && (
        <>
          <EvidenceBundleTeaser
            tabName="sources"
            teaserText="Plus shows detailed creator analysis — who dominates your feed, concentration patterns, and how your source mix compares over time."
          />
          <FreeAskTeaser
            tabName="sources"
            exampleQuestion="Which creators appear most in my feed and how concentrated are my sources?"
          />
        </>
      )}

      {/* Section 2.4 - Master Numbers Line */}
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

export default SourcesTab;
