import React, { useState } from 'react';
import {
  MasterNumbersLine,
  DenominatorLine,
  CompositionBar100WithCounts,
  MiniCalculator,
  ToplineMetricCard,
  ExperimentSuggestionCard,
} from '../../../components/dashboard/primitives';
import InsightHero from '../../../components/dashboard/InsightHero';
import SectionHeader from '../../../components/dashboard/SectionHeader';
import TrendsCTA from '../../../components/dashboard/TrendsCTA';
import TrendsPanel from '../../../components/dashboard/TrendsPanel';
import { buildOverviewHero } from '../../../lib/dashboard/insightBuilders';
import { aggregateCreators, aggregateAds, aggregatePolitics, aggregateEmotions, summarizeInfluence, aggregateAiDisclosures, aggregateSourceOrigin, aggregateTopics } from '../../../lib/dashboard/scanAggregator';
import { getFeedItems } from '../../../lib/dashboard/dataHelpers';
import { Lock, TrendingUp, RefreshCw } from 'lucide-react';

/**
 * Generate plain-English feed summary bullets for overview
 * @param {Object} params
 * @returns {Array<string>} Array of summary bullets
 */
function generateOverviewSummary({
  totalPosts,
  sourceConcentration,
  commercialComposition,
  politicalShare,
  sourceOriginData,
}) {
  const summaries = [];

  // Edge case: not enough data
  if (totalPosts === 0) {
    return summaries;
  }

  // 1. Source concentration (top 5)
  if (sourceConcentration.hasData && sourceConcentration.top5Percent != null) {
    summaries.push(
      `Your top 5 sources accounted for ${sourceConcentration.top5Percent}% of posts.`
    );
  }

  // 2. Ad content
  if (commercialComposition.hasData) {
    const labeledAdsSegment = commercialComposition.segments.find(s => s.label === 'Labeled ads');
    if (labeledAdsSegment && labeledAdsSegment.percentage > 0) {
      summaries.push(
        `Ad content made up ${labeledAdsSegment.percentage}% of posts.`
      );
    } else {
      summaries.push('No ad content was detected.');
    }
  }

  // 3. Suggested content (if available)
  if (sourceOriginData && sourceOriginData.scansUsed > 0 && sourceOriginData.suggestedPercentage != null) {
    const suggestedPercent = Math.round(sourceOriginData.suggestedPercentage);
    if (suggestedPercent > 0) {
      summaries.push(
        `Suggested posts made up ${suggestedPercent}% of your feed.`
      );
    }
  }

  // 4. Political content
  if (politicalShare.hasData && politicalShare.politicalPercent > 0) {
    summaries.push(
      `Political content made up ${politicalShare.politicalPercent}% of posts.`
    );
  }

  // 5. Volume (always show if we have posts)
  summaries.push(
    `This scan included ${totalPosts.toLocaleString('en-US')} post${totalPosts !== 1 ? 's' : ''} total.`
  );

  return summaries;
}

/**
 * OverviewTab - Tab 1 of locked spec
 *
 * Provides a one-screen "receipt" of the selected window with:
 * - Section 1.1: 4 topline cards (source concentration, commercial composition, political share, tone composition)
 * - Section 1.2: 2 mini calculators (ad minutes, political minutes)
 * - Section 1.3: Experiment suggestions
 * - Section 1.4: Master numbers line
 */
const OverviewTab = ({
  scans,
  scanDetails,
  onOpenTrends,
  isPlusUser,
  showTrendsPanel,
  onCloseTrendsPanel,
}) => {

  const isPremium = isPlusUser;
  // Aggregate data from all filtered scans
  const creatorsData = aggregateCreators(scans, scanDetails);
  const adsData = aggregateAds(scans, scanDetails);
  const politicsData = aggregatePolitics(scans, scanDetails);
  const emotionsData = aggregateEmotions(scans, scanDetails);
  const influenceData = summarizeInfluence(scans, scanDetails);
  const aiDisclosureData = aggregateAiDisclosures(scans, scanDetails);
  const sourceOriginData = aggregateSourceOrigin(scans, scanDetails);

  const totalPosts = adsData.totalPosts || 0;
  const scanCount = scans.length;
  const platformCount = Object.keys(adsData.byPlatform || {}).length || 1;

  // Denominator text (exact spec)
  const denominatorText = `Percent of posts in the selected date range (${totalPosts} posts)`;

  // ===========================================
  // SECTION 1.1A - Source Concentration Card
  // ===========================================

  const computeSourceConcentration = () => {
    if (totalPosts === 0 || creatorsData.uniqueCreatorCount === 0) {
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

    // Top 1
    const top1 = sortedCreators[0];
    const top1Percent = Math.round((top1.totalPosts / totalPosts) * 100);
    // Use id (normalized handle) not displayName
    const top1Handle = top1.id;

    return {
      hasData: true,
      top5Percent,
      top1Percent,
      top1Handle,
    };
  };

  const sourceConcentration = computeSourceConcentration();

  // ===========================================
  // SECTION 1.1B - Commercial Composition Card
  // ===========================================

  const computeCommercialComposition = () => {
    if (totalPosts < 10) {
      return { hasData: false };
    }

    const labeledAds = influenceData.labeledAds || 0;
    const likelySellingUnlabeled = influenceData.possibleInfluence || 0;
    const notAds = totalPosts - labeledAds - likelySellingUnlabeled;

    // Ensure no negative values
    const notAdsCount = Math.max(0, notAds);
    const labeledAdsCount = Math.max(0, labeledAds);
    const likelySellingCount = Math.max(0, likelySellingUnlabeled);

    const total = notAdsCount + labeledAdsCount + likelySellingCount;
    if (total === 0) {
      return { hasData: false };
    }

    // Calculate percentages with rounding
    let notAdsPercent = Math.round((notAdsCount / total) * 100);
    let labeledAdsPercent = Math.round((labeledAdsCount / total) * 100);
    let likelySellingPercent = Math.round((likelySellingCount / total) * 100);

    // Ensure percentages sum to exactly 100 by adjusting largest segment
    const sum = notAdsPercent + labeledAdsPercent + likelySellingPercent;
    if (sum !== 100) {
      const diff = 100 - sum;
      // Find largest segment and adjust it
      if (notAdsCount >= labeledAdsCount && notAdsCount >= likelySellingCount) {
        notAdsPercent += diff;
      } else if (labeledAdsCount >= likelySellingCount) {
        labeledAdsPercent += diff;
      } else {
        likelySellingPercent += diff;
      }
    }

    return {
      hasData: true,
      segments: [
        { label: 'Not ads', percentage: notAdsPercent, count: notAdsCount, color: '#94A3B8' },
        { label: 'Labeled ads', percentage: labeledAdsPercent, count: labeledAdsCount, color: '#2563EB' },
        { label: 'Unlabeled promos', percentage: likelySellingPercent, count: likelySellingCount, color: '#10B981' },
      ],
    };
  };

  const commercialComposition = computeCommercialComposition();

  // ===========================================
  // SECTION 1.1C - Political Share Card
  // ===========================================

  const computePoliticalShare = () => {
    if (totalPosts === 0 || politicsData.totalPolitical === 0) {
      return { hasData: false };
    }

    const politicalPercent = Math.round((politicsData.totalPolitical / totalPosts) * 100);

    // Find top political source
    let topPoliticalSource = null;
    let topPoliticalSourcePercent = 0;

    if (creatorsData.creators) {
      const politicalCreators = Object.entries(creatorsData.creators)
        .filter(([, creator]) => creator.political > 0)
        .map(([id, creator]) => ({ id, ...creator }))
        .sort((a, b) => b.political - a.political);

      if (politicalCreators.length > 0) {
        const top = politicalCreators[0];
        // Use id (normalized handle) not displayName
        topPoliticalSource = top.id;
        // Y% uses political posts denominator, not total posts
        topPoliticalSourcePercent = Math.round((top.political / politicsData.totalPolitical) * 100);
      }
    }

    return {
      hasData: true,
      politicalPercent,
      topPoliticalSource,
      topPoliticalSourcePercent,
    };
  };

  const politicalShare = computePoliticalShare();

  // ===========================================
  // SECTION 1.1D - Tone Composition Card
  // ===========================================

  const computeToneComposition = () => {
    // Only use known valence: POSITIVE, NEUTRAL, NEGATIVE
    // Exclude MIXED and any unknown valences
    const posCount = emotionsData.valenceDistribution.POSITIVE || 0;
    const neutCount = emotionsData.valenceDistribution.NEUTRAL || 0;
    const negCount = emotionsData.valenceDistribution.NEGATIVE || 0;

    // Total of known valence posts only
    const knownValenceTotal = posCount + neutCount + negCount;

    // Fallback if totalPosts is 0 OR fewer than 10 posts have known valence
    if (totalPosts === 0 || knownValenceTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages with rounding
    let posPercent = Math.round((posCount / knownValenceTotal) * 100);
    let neutPercent = Math.round((neutCount / knownValenceTotal) * 100);
    let negPercent = Math.round((negCount / knownValenceTotal) * 100);

    // Ensure percentages sum to exactly 100 by adjusting largest segment
    const sum = posPercent + neutPercent + negPercent;
    if (sum !== 100) {
      const diff = 100 - sum;
      // Find largest segment and adjust it
      if (posCount >= neutCount && posCount >= negCount) {
        posPercent += diff;
      } else if (neutCount >= negCount) {
        neutPercent += diff;
      } else {
        negPercent += diff;
      }
    }

    return {
      hasData: true,
      segments: [
        { label: 'Positive', percentage: posPercent, count: posCount, color: '#10B981' },
        { label: 'Neutral', percentage: neutPercent, count: neutCount, color: '#94A3B8' },
        { label: 'Negative', percentage: negPercent, count: negCount, color: '#2563EB' },
      ],
    };
  };

  const toneComposition = computeToneComposition();

  // ===========================================
  // SECTION 1.2 - Mini Calculators
  // ===========================================

  const computeAdMinutesPercent = () => {
    if (totalPosts < 10) return null;
    const labeledAds = influenceData.labeledAds || 0;
    const unlabeledPromo = influenceData.possibleInfluence || 0;
    const adPercent = ((labeledAds + unlabeledPromo) / totalPosts) * 100;
    return adPercent;
  };

  const computePoliticalMinutesPercent = () => {
    if (totalPosts < 10 || !politicalShare.hasData) return null;
    return politicalShare.politicalPercent;
  };

  const adMinutesPercent = computeAdMinutesPercent();
  const politicalMinutesPercent = computePoliticalMinutesPercent();

  // ===========================================
  // SECTION 1.3 - Experiment Suggestions
  // ===========================================

  const generateSuggestions = () => {
    if (totalPosts < 10) {
      return ["Try a scan after you've used the app normally for 10\u201315 minutes, then check again."];
    }

    const suggestions = [];

    // Detect platform names from scan data
    const platforms = Object.keys(adsData.byPlatform || {});
    const isSinglePlatform = platforms.length === 1;
    const platformName = isSinglePlatform
      ? platforms[0].charAt(0).toUpperCase() + platforms[0].slice(1)
      : 'your';
    // When multi-platform, templates use "your feed" directly;
    // when single-platform, they use e.g. "your Instagram feed"
    const feedLabel = isSinglePlatform ? `${platformName} feed` : 'feed';

    // Get top source handle if available
    const topHandle = sourceConcentration.hasData && sourceConcentration.top1Handle
      ? `@${sourceConcentration.top1Handle}`
      : null;

    // For "on [platform]" phrasing: single platform uses name, multi uses "across platforms"
    const onPlatform = isSinglePlatform ? `on ${platformName}` : 'across platforms';

    // Priority 1: High source concentration
    if (sourceConcentration.hasData && sourceConcentration.top5Percent >= 60) {
      const suggestion = topHandle
        ? `Try following 5 new accounts outside your usual topics ${onPlatform}. Right now ${topHandle} alone accounts for ${sourceConcentration.top1Percent}% of your feed. Scan again afterward to see if concentration drops.`
        : `Try following 5 new accounts in a different niche ${onPlatform}, then run another scan to see if your top 5 concentration drops below ${sourceConcentration.top5Percent}%.`;
      suggestions.push(suggestion);
    } else if (sourceConcentration.hasData && sourceConcentration.top1Percent >= 25) {
      const suggestion = topHandle
        ? `Try muting ${topHandle} for one day ${onPlatform} (they make up ${sourceConcentration.top1Percent}% of your feed), then scan again to see how your source mix changes.`
        : `Try muting your top source for one day, then run another scan to see how your source mix changes.`;
      suggestions.push(suggestion);
    }

    // Priority 2: High ad percentage
    if (adMinutesPercent !== null && adMinutesPercent >= 25) {
      suggestions.push(`Try using "Hide ad" or "Not interested" on 3 ads today ${onPlatform}. Your feed is currently ${Math.round(adMinutesPercent)}% commercial content. Scan again to see if that drops.`);
    } else if (influenceData.possibleInfluence > 0 && totalPosts > 0) {
      const unlabeledPromoPercent = (influenceData.possibleInfluence / totalPosts) * 100;
      if (unlabeledPromoPercent >= 10) {
        suggestions.push(`${Math.round(unlabeledPromoPercent)}% of your ${feedLabel} appears promotional but isn't labeled as an ad. Try tapping into a few of these posts and checking for affiliate links or discount codes.`);
      }
    }

    // Priority 3: High political share
    if (politicalShare.hasData && politicalShare.politicalPercent >= 15) {
      suggestions.push(`Political content is ${politicalShare.politicalPercent}% of your ${feedLabel}. Try engaging with 3 non-political accounts you enjoy today, then scan again to see if the balance shifts.`);
    }

    // Priority 4: High negative tone
    if (toneComposition.hasData) {
      const negSegment = toneComposition.segments.find(s => s.label === 'Negative');
      if (negSegment && negSegment.percentage >= 30) {
        suggestions.push(`${negSegment.percentage}% of your ${feedLabel} has negative tone. Try spending 5 minutes engaging with calmer content (music, art, nature), then scan again to see if the emotional balance shifts.`);
      }
    }

    if (suggestions.length === 0) {
      return [`Your ${feedLabel} looks balanced. Try scanning again after a few days of normal use to see if patterns emerge.`];
    }

    return suggestions.slice(0, 2);
  };

  const suggestions = generateSuggestions();

  // ===========================================
  // SECTION: ALGORITHMIC PROFILE (Gap 7)
  // Synthesizes existing data into a profile-style view
  // ===========================================

  const computeAlgorithmicProfile = () => {
    if (totalPosts < 10) return { hasData: false };

    const topicsData = aggregateTopics(scans, scanDetails);
    const profile = {};

    // Top interests (from topic distribution)
    const sortedTopics = Object.entries(topicsData.topicCounts || {})
      .map(([topic, count]) => ({ topic, count, percent: Math.round((count / totalPosts) * 100) }))
      .sort((a, b) => b.count - a.count)
      .filter(t => t.topic.toLowerCase() !== 'other' && t.topic.toLowerCase() !== 'unclassified')
      .slice(0, 3);

    if (sortedTopics.length > 0) {
      profile.topInterests = sortedTopics.map(t => t.topic);
      profile.topInterestsWithPercent = sortedTopics;
    }

    // Emotional pattern (from tone data)
    if (toneComposition.hasData) {
      const posSegment = toneComposition.segments.find(s => s.label === 'Positive');
      const negSegment = toneComposition.segments.find(s => s.label === 'Negative');
      const neutSegment = toneComposition.segments.find(s => s.label === 'Neutral');

      if (negSegment && negSegment.percentage >= 35) {
        profile.emotionalPattern = 'High intensity';
      } else if (posSegment && posSegment.percentage >= 50) {
        profile.emotionalPattern = 'Positive-leaning';
      } else if (neutSegment && neutSegment.percentage >= 50) {
        profile.emotionalPattern = 'Balanced';
      } else {
        profile.emotionalPattern = 'Mixed signals';
      }
    }

    // Content style (from source origin data)
    if (sourceOriginData && sourceOriginData.scansUsed > 0 && sourceOriginData.suggestedPercentage != null) {
      const suggestedPct = Math.round(sourceOriginData.suggestedPercentage);
      if (suggestedPct >= 60) {
        profile.contentStyle = 'Discovery-driven';
      } else if (suggestedPct <= 30) {
        profile.contentStyle = 'Following-driven';
      } else {
        profile.contentStyle = 'Balanced discovery';
      }
    }

    // Political exposure level
    if (politicalShare.hasData) {
      if (politicalShare.politicalPercent >= 20) {
        profile.politicalExposure = 'High engagement';
      } else if (politicalShare.politicalPercent >= 8) {
        profile.politicalExposure = 'Moderate';
      } else if (politicalShare.politicalPercent > 0) {
        profile.politicalExposure = 'Light';
      } else {
        profile.politicalExposure = 'Minimal';
      }
    }

    // Source diversity
    if (sourceConcentration.hasData) {
      if (sourceConcentration.top5Percent >= 70) {
        profile.sourceDiversity = 'Concentrated';
      } else if (sourceConcentration.top5Percent >= 40) {
        profile.sourceDiversity = 'Moderate';
      } else {
        profile.sourceDiversity = 'Diverse';
      }
    }

    return {
      hasData: Object.keys(profile).length >= 2,
      ...profile,
    };
  };

  const algorithmicProfile = computeAlgorithmicProfile();

  // ===========================================
  // SECTION: BRANDS & INFLUENCERS (Gap 6)
  // ===========================================

  const computeBrandsAndInfluencers = () => {
    if (totalPosts < 10) return { hasData: false };

    const creatorPostCounts = {};
    const adCreatorCounts = {};

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;
      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const creator = item.creator?.handle || item.account?.username || item.creator?.name || '';
        if (!creator) continue;
        const normalized = creator.toLowerCase().replace(/^@/, '');
        creatorPostCounts[normalized] = (creatorPostCounts[normalized] || 0) + 1;
        if (item.is_ad) {
          adCreatorCounts[normalized] = (adCreatorCounts[normalized] || 0) + 1;
        }
      }
    }

    const brandAccounts = [];
    const influencerAccounts = [];

    for (const [handle, totalCount] of Object.entries(creatorPostCounts)) {
      const adCount = adCreatorCounts[handle] || 0;
      const adRatio = adCount / totalCount;
      if (adCount >= 2 && adRatio >= 0.5) {
        brandAccounts.push({ handle, posts: totalCount, adPosts: adCount });
      } else if (totalCount >= 3 && adRatio < 0.5) {
        influencerAccounts.push({ handle, posts: totalCount, adPosts: adCount });
      }
    }

    brandAccounts.sort((a, b) => b.adPosts - a.adPosts);
    influencerAccounts.sort((a, b) => b.posts - a.posts);

    const commercialCreatorCount = brandAccounts.length + influencerAccounts.filter(i => i.adPosts > 0).length;
    const commercialPercent = totalPosts > 0
      ? Math.round(((brandAccounts.reduce((s, b) => s + b.posts, 0) + influencerAccounts.filter(i => i.adPosts > 0).reduce((s, i) => s + i.posts, 0)) / totalPosts) * 100)
      : 0;

    return {
      hasData: brandAccounts.length > 0 || influencerAccounts.length > 0,
      brands: brandAccounts.slice(0, 3),
      influencers: influencerAccounts.slice(0, 3),
      commercialCreatorCount,
      commercialPercent,
    };
  };

  const brandsAndInfluencers = isPlusUser ? computeBrandsAndInfluencers() : { hasData: false };

  // ===========================================
  // BUILD INSIGHT HERO
  // ===========================================

  const hero = buildOverviewHero({
    sourceConcentration,
    totalPosts,
    platformCount,
  });

  // ===========================================
  // GENERATE OVERVIEW SUMMARY
  // ===========================================

  const overviewSummary = generateOverviewSummary({
    totalPosts,
    sourceConcentration,
    commercialComposition,
    politicalShare,
    sourceOriginData,
  });

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="space-y-10">
      {/* Insight Hero */}
      <InsightHero {...hero} />

      {/* Trends CTA or Panel */}
      <TrendsCTA
        onClick={() => onOpenTrends({ tab: 'overview', placement: 'hero_trends' })}
        isPlusUser={isPlusUser}
        tabName="overview"
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

      {/* Section: Your Feed in Minutes (ELEVATED) */}
      <section>
        <SectionHeader>Your feed in minutes</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 space-y-2">
            <MiniCalculator
              label="Minutes per day seeing ads"
              percent={adMinutesPercent}
              disabledMessage="Not available for this window."
            />
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-5 space-y-2">
            <MiniCalculator
              label="Minutes per day on political content"
              percent={politicalMinutesPercent}
              disabledMessage="Not available for this window."
            />
          </div>
        </div>
      </section>

      {/* Section 1.1 - Topline Summary (4 cards in 2x2 grid) */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Source Concentration */}
          <ToplineMetricCard
            headline={
              sourceConcentration.hasData
                ? `Top 5 sources: ${sourceConcentration.top5Percent}% of posts`
                : "Top 5 sources: X% of posts"
            }
            microLine={
              sourceConcentration.hasData && sourceConcentration.top1Handle
                ? `Top source: @${sourceConcentration.top1Handle} (${sourceConcentration.top1Percent}%)`
                : undefined
            }
            valueNode={
              sourceConcentration.hasData ? (
                <div className="text-4xl font-bold text-slate-900">
                  {sourceConcentration.top5Percent}%
                </div>
              ) : null
            }
            denominatorText={`Based on ${totalPosts} posts`}
            fallbackText="No dominant pattern emerged during this window."
            hasData={sourceConcentration.hasData}
          />

          {/* Card B: Commercial Composition */}
          <ToplineMetricCard
            headline="Commercial composition"
            microLine={undefined}
            valueNode={
              commercialComposition.hasData ? (
                <CompositionBar100WithCounts segments={commercialComposition.segments} />
              ) : null
            }
            denominatorText={`Based on ${totalPosts} posts`}
            fallbackText="Not enough posts in this window."
            hasData={commercialComposition.hasData}
          />

          {/* Card C: Political Share */}
          <ToplineMetricCard
            headline={
              politicalShare.hasData
                ? `Political posts: ${politicalShare.politicalPercent}%`
                : "Political posts: X%"
            }
            microLine={
              politicalShare.hasData && politicalShare.topPoliticalSource
                ? `Top political source: @${politicalShare.topPoliticalSource}`
                : undefined
            }
            valueNode={
              politicalShare.hasData ? (
                <div className="text-4xl font-bold text-slate-900">
                  {politicalShare.politicalPercent}%
                </div>
              ) : null
            }
            denominatorText={`Based on ${totalPosts} posts`}
            fallbackText="Political exposure was light in this window."
            hasData={politicalShare.hasData}
          />

          {/* Card D: Tone Composition */}
          <ToplineMetricCard
            headline="Emotional tone"
            microLine={undefined}
            valueNode={
              toneComposition.hasData ? (
                <CompositionBar100WithCounts segments={toneComposition.segments} />
              ) : null
            }
            denominatorText={`Based on ${totalPosts} posts`}
            fallbackText="No dominant pattern emerged during this window."
            hasData={toneComposition.hasData}
          />
        </div>
      </section>

      {/* Algorithmic Profile (Gap 7) */}
      {algorithmicProfile.hasData && (
        <section>
          <SectionHeader>Content patterns observed</SectionHeader>
          <p className="text-xs text-slate-500 mb-4">
            Based on observable patterns in your scans. This is not your identity — it reflects what content appeared during your scans.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {algorithmicProfile.topInterests && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Top interests</div>
                <div className="text-sm font-semibold text-slate-800">
                  {algorithmicProfile.topInterests.join(', ')}
                </div>
                {algorithmicProfile.topInterestsWithPercent && (
                  <div className="flex gap-1 mt-1.5">
                    {algorithmicProfile.topInterestsWithPercent.map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{t.percent}%</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {algorithmicProfile.emotionalPattern && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Emotional signal</div>
                <div className="text-sm font-semibold text-slate-800">{algorithmicProfile.emotionalPattern}</div>
              </div>
            )}
            {algorithmicProfile.politicalExposure && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Political exposure</div>
                <div className="text-sm font-semibold text-slate-800">{algorithmicProfile.politicalExposure}</div>
              </div>
            )}
            {algorithmicProfile.contentStyle && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Content style</div>
                <div className="text-sm font-semibold text-slate-800">{algorithmicProfile.contentStyle}</div>
              </div>
            )}
            {algorithmicProfile.sourceDiversity && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Source diversity</div>
                <div className="text-sm font-semibold text-slate-800">{algorithmicProfile.sourceDiversity}</div>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 italic">
            These labels are inferred from feed content only. Actual platform categorization may differ.
          </p>
        </section>
      )}

      {/* Brands & Influencers (Gap 6) - Premium only */}
      {isPlusUser && brandsAndInfluencers.hasData && (
        <section>
          <SectionHeader>Brands and influencers in your feed</SectionHeader>
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            {brandsAndInfluencers.brands.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Brand accounts</h4>
                <div className="space-y-2">
                  {brandsAndInfluencers.brands.map((brand, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-slate-800 font-medium">@{brand.handle}</span>
                      <span className="text-xs text-slate-500">{brand.adPosts} ad post{brand.adPosts !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {brandsAndInfluencers.influencers.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Top influencers</h4>
                <div className="space-y-2">
                  {brandsAndInfluencers.influencers.map((inf, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-slate-800 font-medium">@{inf.handle}</span>
                      <span className="text-xs text-slate-500">{inf.posts} post{inf.posts !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 italic">
              Brand accounts are those where most posts were labeled ads. Influencers are accounts with high post volume.
            </p>
          </div>
        </section>
      )}

      {/* Brands & Influencers teaser for free users */}
      {!isPlusUser && totalPosts >= 10 && (
        <section>
          <div className="relative bg-slate-50 border border-slate-200 rounded-lg p-5 overflow-hidden">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="text-center space-y-2">
                <Lock className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-600">See which brands and influencers shape your feed</p>
                <a href="/plus" className="text-xs text-primary-blue font-medium hover:underline">Upgrade to Premium</a>
              </div>
            </div>
            <div className="opacity-40">
              <SectionHeader>Brands and influencers in your feed</SectionHeader>
              <div className="h-24 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </section>
      )}

      {/* Trends Comparison Preview (Gap 5) - Prominent Premium feature */}
      {isPlusUser && scans.length >= 2 && !showTrendsPanel && (
        <section>
          <div
            className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onOpenTrends({ tab: 'overview', placement: 'comparison_preview' })}
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-indigo-900">Compare across time periods</h3>
            </div>
            <p className="text-xs text-indigo-700">
              You have {scans.length} scans. Open trend analysis to see how your feed composition has changed over time.
            </p>
          </div>
        </section>
      )}

      {/* Trends comparison teaser for free users */}
      {!isPlusUser && scans.length >= 2 && (
        <section>
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-600">Compare tone, topics, and sources across time</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              You have {scans.length} scans. See how your feed has changed over time with Premium trend analysis.
            </p>
            <a href="/plus" className="text-xs text-primary-blue font-medium hover:underline">Upgrade to Premium</a>
          </div>
        </section>
      )}

      {/* Section 1.3 - Experiment Suggestions */}
      <section>
        <ExperimentSuggestionCard suggestions={suggestions} />
      </section>

      {/* Feed Summary + AI Likelihood (collapsed details) */}
      <section className="space-y-3">
        {overviewSummary.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-slate-700">Feed summary</h3>
            </div>
            <div className="px-5 pb-4 space-y-2">
              <ul className="space-y-2 text-sm text-slate-700" role="list">
                {overviewSummary.map((summary, index) => (
                  <li key={index} className="leading-relaxed">
                    {summary}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {aiDisclosureData.hasEnoughData && (
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-5 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-slate-700">AI-made content analysis</h3>
            </div>
            <div className="px-5 pb-4 space-y-3">
              {(() => {
                const likelyAiCount = aiDisclosureData.rawCounts.aiLabelPresent + aiDisclosureData.rawCounts.c2paPresent;
                const likelyAiPercent = Math.round((likelyAiCount / aiDisclosureData.totalVisualPosts) * 100);
                return (
                  <p className="text-sm text-slate-700">
                    {likelyAiPercent === 0
                      ? 'Very little content shows strong signs of being AI-made.'
                      : `About ${likelyAiPercent}% of images and videos show strong signs of being AI-made.`}
                  </p>
                );
              })()}
              <CompositionBar100WithCounts segments={aiDisclosureData.segmentsSimplified} />
              <p className="text-xs text-text-muted">Based on {aiDisclosureData.totalVisualPosts} visual posts</p>
            </div>
          </div>
        )}
      </section>

      {/* How the Feedback Loop Works (Gap 8) */}
      <section>
        <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">How the feedback loop works</h3>
            </div>
          <div className="px-5 pb-5 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Your feed is shaped by a cycle. Understanding this cycle is the first step to making informed choices about your media diet.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
                <div>
                  <div className="text-xs font-semibold text-slate-700">Your behavior</div>
                  <div className="text-xs text-slate-500">What you pause on, like, share, and skip sends signals.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
                <div>
                  <div className="text-xs font-semibold text-slate-700">Patterns accumulate</div>
                  <div className="text-xs text-slate-500">Over time, recurring topics and content types form observable patterns.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">3</span>
                <div>
                  <div className="text-xs font-semibold text-slate-700">Content is tailored</div>
                  <div className="text-xs text-slate-500">Your feed composition reflects what has appeared — we cannot know why specific content was selected.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">4</span>
                <div>
                  <div className="text-xs font-semibold text-slate-700">Your media diet evolves</div>
                  <div className="text-xs text-slate-500">Each interaction reinforces or shifts the cycle. Small changes can move the needle.</div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              AlgorithmLens shows you step 3 — what content actually appeared. The experiment suggestions above help you test step 1.
            </p>
          </div>
        </div>
      </section>

      {/* Section 1.4 - Master Numbers Line */}
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

export default OverviewTab;
