import React from 'react';
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
import { buildOverviewHero } from '../../../lib/dashboard/insightBuilders';
import { aggregateCreators, aggregateAds, aggregatePolitics, aggregateEmotions, summarizeInfluence, aggregateAiDisclosures } from '../../../lib/dashboard/scanAggregator';

/**
 * OverviewTab - Tab 1 of locked spec
 *
 * Provides a one-screen "receipt" of the selected window with:
 * - Section 1.1: 4 topline cards (source concentration, commercial composition, political share, tone composition)
 * - Section 1.2: 2 mini calculators (ad minutes, political minutes)
 * - Section 1.3: Experiment suggestions
 * - Section 1.4: Master numbers line
 */
const OverviewTab = ({ scans, scanDetails }) => {
  // TODO: Replace with actual Plus subscription check
  const isPlusUser = false;

  // Aggregate data from all filtered scans
  const creatorsData = aggregateCreators(scans, scanDetails);
  const adsData = aggregateAds(scans, scanDetails);
  const politicsData = aggregatePolitics(scans, scanDetails);
  const emotionsData = aggregateEmotions(scans, scanDetails);
  const influenceData = summarizeInfluence(scans, scanDetails);
  const aiDisclosureData = aggregateAiDisclosures(scans, scanDetails);

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
        { label: 'Ads clearly labeled as ads', percentage: labeledAdsPercent, count: labeledAdsCount, color: '#2563EB' },
        { label: 'Likely selling, not labeled as an ad', percentage: likelySellingPercent, count: likelySellingCount, color: '#F59E0B' },
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
        .filter(([_, creator]) => creator.political > 0)
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
        { label: 'Positive or happy tone', percentage: posPercent, count: posCount, color: '#86EFAC' },
        { label: 'Neutral or balanced tone', percentage: neutPercent, count: neutCount, color: '#CBD5E1' },
        { label: 'Negative or outrage tone', percentage: negPercent, count: negCount, color: '#FCA5A5' },
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
      return ["Try a scan after you've used the app normally for 10–15 minutes, then check again."];
    }

    const suggestions = [];

    // Priority 1: High source concentration
    if (sourceConcentration.hasData && sourceConcentration.top5Percent >= 60) {
      suggestions.push('Try following 5 new accounts in a different niche, then run another scan and compare whether Top 5 concentration drops.');
    } else if (sourceConcentration.hasData && sourceConcentration.top1Percent >= 25) {
      suggestions.push('Try muting or unfollowing the top source for one day, then run another scan to see how your source mix changes.');
    }

    // Priority 2: High ad percentage
    if (adMinutesPercent !== null && adMinutesPercent >= 25) {
      suggestions.push('Try using "Hide ad" or "Not interested" on 3 ads today, then run another scan to see if ad minutes decrease.');
    } else if (influenceData.possibleInfluence > 0 && totalPosts > 0) {
      const unlabeledPromoPercent = (influenceData.possibleInfluence / totalPosts) * 100;
      if (unlabeledPromoPercent >= 10) {
        suggestions.push('Try tapping into 3 posts flagged as "Likely selling" and checking the captions for affiliate links, then rescan to see if this pattern persists.');
      }
    }

    // Priority 3: High political share
    if (politicalShare.hasData && politicalShare.politicalPercent >= 15) {
      suggestions.push('Try interacting with 3 non-political accounts you enjoy today, then run another scan to see if political share shifts.');
    }

    // Priority 4: High negative/outrage tone
    if (toneComposition.hasData) {
      const negSegment = toneComposition.segments.find(s => s.label === 'Negative or outrage tone');
      if (negSegment && negSegment.percentage >= 30) {
        suggestions.push('Try spending 5 minutes engaging with calmer content (music, art, nature, humor), then run another scan to see if tone balance changes.');
      }
    }

    // Return top 2 suggestions, or 1 if only 1 applies, or fallback
    if (suggestions.length === 0) {
      return ["Try a scan after you've used the app normally for 10–15 minutes, then check again."];
    }

    return suggestions.slice(0, 2);
  };

  const suggestions = generateSuggestions();

  // ===========================================
  // BUILD INSIGHT HERO
  // ===========================================

  const hero = buildOverviewHero({
    sourceConcentration,
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

      {/* AI-Labeled Visuals (Platform-Disclosed) Section */}
      <section>
        <SectionHeader>AI-labeled visuals (platform-disclosed)</SectionHeader>

        {aiDisclosureData.hasEnoughData ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            {/* Data-grounded headline */}
            <p className="text-sm font-medium text-slate-700">
              {aiDisclosureData.rawCounts.aiLabelPresent + aiDisclosureData.rawCounts.c2paPresent > 0
                ? `AI disclosures were observed on ${Math.round(((aiDisclosureData.rawCounts.aiLabelPresent + aiDisclosureData.rawCounts.c2paPresent) / aiDisclosureData.totalVisualPosts) * 100)}% of visual posts`
                : `No AI disclosures were observed in these scans`}
            </p>

            {/* Plus awareness for free users */}
            {!isPlusUser && (
              <p className="text-xs text-slate-500 mt-1">
                🔒 See how AI disclosure rates shift scan-to-scan with AlgorithmLens Plus.
              </p>
            )}

            <CompositionBar100WithCounts segments={aiDisclosureData.segments} />

            <div className="mt-3">
              <DenominatorLine text={`Based on ${aiDisclosureData.totalVisualPosts} visual posts`} />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-medium text-slate-700">
                What this means
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                We only report AI labels and Content Credentials that platforms explicitly disclose. Lack of disclosure is itself meaningful: most platforms do not require creators to label AI-generated content, so many AI-made visuals have no label at all.
              </p>

              <p className="text-xs font-medium text-slate-700 mt-3">
                Why you should care
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Platform disclosures help you understand what content creators and platforms are choosing to label as AI-generated. The absence of labels tells you how rare transparency is, not that content is authentic.
              </p>

              <p className="text-xs font-medium text-slate-700 mt-3">
                How this works
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Captured from on-screen text in mobile video scans using platform-specific phrase matching. This is not AI detection or cryptographic verification. Posts with both an AI label and a Content Credentials indicator are counted in the Content Credentials segment.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center space-y-2">
            <p className="text-sm text-slate-400 italic">
              Not enough visual posts to show AI disclosure analysis.
            </p>
            <p className="text-xs text-slate-500">
              This section requires at least 20 image or video posts. Current count: {aiDisclosureData.totalVisualPosts}
            </p>
          </div>
        )}
      </section>

      {/* Section 1.1 - Topline Summary (4 cards in 2x2 grid) */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Source Concentration */}
          <ToplineMetricCard
            headline={
              sourceConcentration.hasData
                ? `Top 5 sources accounted for ${sourceConcentration.top5Percent}% of posts`
                : "Top 5 sources accounted for X% of posts"
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
            denominatorText={denominatorText}
            fallbackText="No dominant pattern emerged during this window."
            hasData={sourceConcentration.hasData}
          />

          {/* Card B: Commercial Composition */}
          <ToplineMetricCard
            headline="Commercial composition"
            microLine={undefined}
            valueNode={
              commercialComposition.hasData ? (
                <div className="space-y-2">
                  <CompositionBar100WithCounts segments={commercialComposition.segments} />
                  <p className="text-xs text-slate-500 italic">Each segment shows what percentage of posts fall into that category.</p>
                </div>
              ) : null
            }
            denominatorText={denominatorText}
            fallbackText="Not enough posts in this window."
            hasData={commercialComposition.hasData}
          />

          {/* Card C: Political Share */}
          <ToplineMetricCard
            headline={
              politicalShare.hasData
                ? `Political posts: ${politicalShare.politicalPercent}% of feed`
                : "Political posts: X% of feed"
            }
            microLine={
              politicalShare.hasData && politicalShare.topPoliticalSource
                ? `Top political source: @${politicalShare.topPoliticalSource} (${politicalShare.topPoliticalSourcePercent}% of political posts)`
                : undefined
            }
            valueNode={
              politicalShare.hasData ? (
                <div className="text-4xl font-bold text-slate-900">
                  {politicalShare.politicalPercent}%
                </div>
              ) : null
            }
            denominatorText={denominatorText}
            fallbackText="Political exposure was light in this window."
            hasData={politicalShare.hasData}
          />

          {/* Card D: Tone Composition */}
          <ToplineMetricCard
            headline="Tone composition"
            microLine={undefined}
            valueNode={
              toneComposition.hasData ? (
                <div className="space-y-2">
                  <CompositionBar100WithCounts segments={toneComposition.segments} />
                  <p className="text-xs text-slate-500 italic">Each segment shows what percentage of posts fall into that emotional category.</p>
                </div>
              ) : null
            }
            denominatorText={denominatorText}
            fallbackText="No dominant pattern emerged during this window."
            hasData={toneComposition.hasData}
          />
        </div>
      </section>

      {/* Section 1.2 - Mini Calculators (2 side-by-side) */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2">
            <MiniCalculator
              label="Minutes per day advertised to"
              percent={adMinutesPercent}
              disabledMessage="Not available for this window."
            />
            {adMinutesPercent !== null && (
              <p className="text-xs text-slate-500 italic">Estimates time spent on commercial content if you scroll 60 minutes per day.</p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2">
            <MiniCalculator
              label="Minutes per day on political content"
              percent={politicalMinutesPercent}
              disabledMessage="Not available for this window."
            />
            {politicalMinutesPercent !== null && (
              <p className="text-xs text-slate-500 italic">Estimates time spent on political content if you scroll 60 minutes per day.</p>
            )}
          </div>
        </div>
      </section>

      {/* Section 1.3 - Experiment Suggestions */}
      <section>
        <ExperimentSuggestionCard suggestions={suggestions} />
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
