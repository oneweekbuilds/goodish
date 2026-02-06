import React from 'react';
import {
  MasterNumbersLine,
  DenominatorLine,
  ConcentrationSummary,
} from '../../../components/dashboard/primitives';
import InsightHero from '../../../components/dashboard/InsightHero';
import TrendsCTA from '../../../components/dashboard/TrendsCTA';
import TrendsStubPanel from '../../../components/dashboard/TrendsStubPanel';
import { buildSourcesHero } from '../../../lib/dashboard/insightBuilders';
import { SimpleTable } from '../../../components/dashboard/charts';
import { aggregateCreators, aggregateAds } from '../../../lib/dashboard/scanAggregator';

/**
 * SourcesTab - Tab 2 of locked spec
 *
 * Provides a breakdown of source concentration with:
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

    // Build table data
    topSourcesTableData = top10.map((creator, index) => ({
      rank: index + 1,
      handle: `@${creator.id}`, // Use id (normalized handle) with @ prefix
      sharePercent: Math.round((creator.totalPosts / totalPosts) * 100),
      postCount: creator.totalPosts,
    }));

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
        <TrendsStubPanel
          scanCount={scans.length}
          onClose={onCloseTrendsPanel}
        />
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
                { key: 'rank', label: 'Rank', width: '15%' },
                { key: 'handle', label: 'Source handle', width: '40%' },
                { key: 'sharePercent', label: 'Share of posts (%)', width: '25%' },
                { key: 'postCount', label: 'Posts (count)', width: '20%' },
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
