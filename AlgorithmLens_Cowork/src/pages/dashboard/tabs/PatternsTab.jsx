import React from 'react';
import {
  MasterNumbersLine,
} from '../../../components/dashboard/primitives';
import { aggregateCreators, aggregateAds } from '../../../lib/dashboard/scanAggregator';

// Minimum percentage a topic must represent to be displayed.
// Topics below this threshold are excluded to avoid showing noise.
const MIN_TOPIC_DISPLAY_PERCENT = 20;

/**
 * PatternsTab - Tab 6 of locked spec
 *
 * Provides feed pattern analysis with:
 * - Section 6.1: Source concentration
 * - Section 6.2: Repetition of topics
 * - Section 6.3: Repeated accounts in short windows
 * - Section 6.4: What this suggests
 * - Section 6.5: Master numbers line
 */
const PatternsTab = ({ scans, scanDetails }) => {
  // Aggregate data from all filtered scans
  const creatorsData = aggregateCreators(scans, scanDetails);
  const adsData = aggregateAds(scans, scanDetails);

  const totalPosts = adsData.totalPosts || 0;
  const scanCount = scans.length;
  const platformCount = Object.keys(adsData.byPlatform || {}).length || 1;

  // Helper to extract feed items
  const getFeedItems = (scanDetail) => {
    if (!scanDetail) return [];
    const data = scanDetail.result || scanDetail.scan || scanDetail;
    return data?.feed_items || [];
  };

  // ===========================================
  // SECTION 6.1 - Source Concentration
  // ===========================================

  const computeSourceConcentration = () => {
    if (totalPosts < 10 || creatorsData.uniqueCreatorCount === 0) {
      return { hasData: false };
    }

    // Sort creators by post count
    const sortedCreators = Object.entries(creatorsData.creators)
      .map(([id, creator]) => ({ id, ...creator }))
      .sort((a, b) => b.totalPosts - a.totalPosts);

    if (sortedCreators.length === 0) {
      return { hasData: false };
    }

    // Top 5 (or fewer if less than 5 exist)
    const top5 = sortedCreators.slice(0, 5);
    const top5PostCount = top5.reduce((sum, c) => sum + c.totalPosts, 0);
    const top5Percent = Math.round((top5PostCount / totalPosts) * 100);

    // Check if any single source is dominant (>= 25% of total)
    const top1 = sortedCreators[0];
    const top1Percent = Math.round((top1.totalPosts / totalPosts) * 100);
    const hasDominantSource = top1Percent >= 25;

    return {
      hasData: true,
      top5Percent,
      hasDominantSource,
    };
  };

  const sourceConcentration = computeSourceConcentration();

  // ===========================================
  // SECTION 6.2 - Repetition of Topics
  // ===========================================

  const computeTopicRepetition = () => {
    if (totalPosts < 10) {
      return { hasData: false };
    }

    // Count occurrences of each primary category
    const topicCounts = {};
    let totalCategorized = 0;

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const category = item.topics?.primary_category;
        if (category && category.trim() !== '') {
          topicCounts[category] = (topicCounts[category] || 0) + 1;
          totalCategorized++;
        }
      }
    }

    if (totalCategorized === 0) {
      return { hasData: false };
    }

    // Find top category
    const sortedTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    if (sortedTopics.length === 0) {
      return { hasData: false };
    }

    const topTopic = sortedTopics[0];
    const topicPercent = Math.round((topTopic.count / totalCategorized) * 100);

    // Only show if topic appears in >= threshold of posts
    if (topicPercent < MIN_TOPIC_DISPLAY_PERCENT) {
      return { hasData: false };
    }

    return {
      hasData: true,
      topic: topTopic.topic,
      percent: topicPercent,
      count: topTopic.count,
    };
  };

  const topicRepetition = computeTopicRepetition();

  // ===========================================
  // SECTION 6.3 - Repeated Accounts
  // ===========================================

  const computeRepeatedAccounts = () => {
    if (totalPosts < 10 || creatorsData.uniqueCreatorCount === 0) {
      return { hasData: false };
    }

    // Sort creators by post count
    const sortedCreators = Object.entries(creatorsData.creators)
      .map(([id, creator]) => ({ id, ...creator }))
      .sort((a, b) => b.totalPosts - a.totalPosts);

    if (sortedCreators.length === 0) {
      return { hasData: false };
    }

    const top = sortedCreators[0];

    // Must appear at least 5 times
    if (top.totalPosts < 5) {
      return { hasData: false };
    }

    const handle = top.id;
    const postCount = top.totalPosts;
    const percent = Math.round((postCount / totalPosts) * 100);

    return {
      hasData: true,
      handle,
      postCount,
      percent,
    };
  };

  const repeatedAccounts = computeRepeatedAccounts();

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="space-y-8">
      {/* Section 6.1 - Source Concentration */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Source concentration</h2>

        {sourceConcentration.hasData ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="text-2xl font-semibold text-slate-900">
              Top 5 sources accounted for {sourceConcentration.top5Percent}% of posts
            </div>
            {!sourceConcentration.hasDominantSource && (
              <div className="text-sm text-slate-600 italic">
                No dominant pattern emerged during this window.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Not enough data to identify feed patterns.
            </p>
          </div>
        )}
      </section>

      {/* Section 6.2 - Repetition of Topics */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Repetition of topics</h2>

        {topicRepetition.hasData ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="text-sm text-slate-700 font-medium">
              Most common topic
            </div>
            <div className="text-2xl font-semibold text-slate-900">
              {topicRepetition.topic}
            </div>
            <div className="text-sm text-slate-600">
              Appeared in {topicRepetition.percent}% of posts
            </div>
            <div className="text-xs text-slate-500">
              {topicRepetition.count} posts
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              {totalPosts < 10
                ? "Not enough data to identify feed patterns."
                : "Topics were broadly distributed in this window."}
            </p>
          </div>
        )}
      </section>

      {/* Section 6.3 - Repeated Accounts */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Repeated accounts in short windows</h2>

        {repeatedAccounts.hasData ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="text-sm text-slate-700 font-medium">
              Most repeated account
            </div>
            <div className="text-2xl font-semibold text-slate-900">
              @{repeatedAccounts.handle}
            </div>
            <div className="text-sm text-slate-600">
              {repeatedAccounts.postCount} posts ({repeatedAccounts.percent}% of feed)
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              {totalPosts < 10
                ? "Not enough data to identify feed patterns."
                : "No accounts repeated frequently in this window."}
            </p>
          </div>
        )}
      </section>

      {/* Section 6.4 - What This Suggests */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">What this suggests</h2>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <p className="text-sm text-slate-600">
            These are patterns observed during your scans. They reflect what appeared in your feed during this period, not a fixed preference or identity.
          </p>
        </div>
      </section>

      {/* Section 6.5 - Master Numbers Line */}
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

export default PatternsTab;
