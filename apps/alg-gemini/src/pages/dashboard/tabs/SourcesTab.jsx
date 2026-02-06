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

    // Top 10 (or fewer if less than 10 exist)
    const top10 = sortedCreators.slice(0, 10);

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
    <div className="space-y-8">
      {/* Insight Hero */}
      <InsightHero {...hero} />

      {/* Trends CTA */}
      <TrendsCTA
        onClick={() => onOpenTrends({ tab: 'sources', placement: 'hero_trends' })}
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

      {/* Sources Summary */}
      {sourcesSummary.length > 0 && (
        <section>
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Sources summary
              </h3>
              <p className="text-xs text-slate-500">
                Based on posts in this scan.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-slate-700" role="list">
              {sourcesSummary.map((summary, index) => (
                <li key={index} className="leading-relaxed">
                  • {summary}
                </li>
              ))}
            </ul>
          </div>
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
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-sm text-slate-400 italic">
              No sources were available in this window.
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
            <p className="text-xs text-slate-500 italic">Higher values for top sources indicate a more concentrated feed.</p>
          </div>
        </section>
      )}

      {/* Section 2.3 - Suggested vs Followed share */}
      {/* HIDDEN: Capability does not exist yet */}
      {/* This section will be implemented in Phase 3 */}

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
