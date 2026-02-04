import React from 'react';
import {
  MasterNumbersLine,
  DenominatorLine,
  CompositionBar100WithCounts,
} from '../../../components/dashboard/primitives';
import { aggregateEmotions, aggregateAds, aggregatePolitics, summarizeInfluence } from '../../../lib/dashboard/scanAggregator';

/**
 * ToneTab - Tab 5 of locked spec
 *
 * Provides emotional tone analysis with:
 * - Section 5.1: Tone distribution (100% split) with top 5 handles by positive/negative volume
 * - Section 5.2: Tone split: political vs non-political
 * - Section 5.3: Tone split: selling vs not selling
 * - Section 5.4: Master numbers line
 */
const ToneTab = ({ scans, scanDetails }) => {
  // Aggregate data from all filtered scans
  const emotionsData = aggregateEmotions(scans, scanDetails);
  const adsData = aggregateAds(scans, scanDetails);
  const politicsData = aggregatePolitics(scans, scanDetails);
  const influenceData = summarizeInfluence(scans, scanDetails);

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
  // SECTION 5.1 - Tone Distribution
  // ===========================================

  const computeToneDistribution = () => {
    // Only use known valence: POSITIVE, NEUTRAL, NEGATIVE
    const posCount = emotionsData.valenceDistribution.POSITIVE || 0;
    const neutCount = emotionsData.valenceDistribution.NEUTRAL || 0;
    const negCount = emotionsData.valenceDistribution.NEGATIVE || 0;

    const knownValenceTotal = posCount + neutCount + negCount;

    if (totalPosts === 0 || knownValenceTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages with rounding
    let posPercent = Math.round((posCount / knownValenceTotal) * 100);
    let neutPercent = Math.round((neutCount / knownValenceTotal) * 100);
    let negPercent = Math.round((negCount / knownValenceTotal) * 100);

    // Ensure percentages sum to exactly 100
    const sum = posPercent + neutPercent + negPercent;
    if (sum !== 100) {
      const diff = 100 - sum;
      if (posCount >= neutCount && posCount >= negCount) {
        posPercent += diff;
      } else if (neutCount >= negCount) {
        neutPercent += diff;
      } else {
        negPercent += diff;
      }
    }

    // Find top 5 handles by positive post volume
    const creatorPositiveCounts = {};
    const creatorNegativeCounts = {};

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const creator = item.creator_username || item.author_handle;
        if (!creator) continue;

        const normalizedCreator = creator.toLowerCase().replace(/^@/, '');
        const valence = item.emotions?.valence;

        if (valence === 'POSITIVE') {
          creatorPositiveCounts[normalizedCreator] = (creatorPositiveCounts[normalizedCreator] || 0) + 1;
        } else if (valence === 'NEGATIVE') {
          creatorNegativeCounts[normalizedCreator] = (creatorNegativeCounts[normalizedCreator] || 0) + 1;
        }
      }
    }

    // Sort and get top 5 positive
    const topPositive = Object.entries(creatorPositiveCounts)
      .map(([handle, count]) => ({ handle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort and get top 5 negative
    const topNegative = Object.entries(creatorNegativeCounts)
      .map(([handle, count]) => ({ handle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      hasData: true,
      segments: [
        { label: 'Positive or happy tone', percentage: posPercent, count: posCount, color: '#86EFAC' },
        { label: 'Neutral or balanced tone', percentage: neutPercent, count: neutCount, color: '#CBD5E1' },
        { label: 'Negative or outrage tone', percentage: negPercent, count: negCount, color: '#FCA5A5' },
      ],
      knownValenceTotal,
      topPositive,
      topNegative,
    };
  };

  const toneDistribution = computeToneDistribution();

  // ===========================================
  // SECTION 5.2 - Political vs Non-Political Tone
  // ===========================================

  const computePoliticalVsNonPoliticalTone = () => {
    // Count tone for political vs non-political posts
    let politicalPos = 0;
    let politicalNeut = 0;
    let politicalNeg = 0;

    let nonPoliticalPos = 0;
    let nonPoliticalNeut = 0;
    let nonPoliticalNeg = 0;

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const valence = item.emotions?.valence;
        const isPolitical = item.political?.is_political;

        if (valence === 'POSITIVE' || valence === 'NEUTRAL' || valence === 'NEGATIVE') {
          if (isPolitical) {
            if (valence === 'POSITIVE') politicalPos++;
            else if (valence === 'NEUTRAL') politicalNeut++;
            else if (valence === 'NEGATIVE') politicalNeg++;
          } else {
            if (valence === 'POSITIVE') nonPoliticalPos++;
            else if (valence === 'NEUTRAL') nonPoliticalNeut++;
            else if (valence === 'NEGATIVE') nonPoliticalNeg++;
          }
        }
      }
    }

    const politicalTotal = politicalPos + politicalNeut + politicalNeg;
    const nonPoliticalTotal = nonPoliticalPos + nonPoliticalNeut + nonPoliticalNeg;

    // Must have at least 10 posts in BOTH groups
    if (politicalTotal < 10 || nonPoliticalTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages for political posts
    let polPosPercent = Math.round((politicalPos / politicalTotal) * 100);
    let polNeutPercent = Math.round((politicalNeut / politicalTotal) * 100);
    let polNegPercent = Math.round((politicalNeg / politicalTotal) * 100);

    const polSum = polPosPercent + polNeutPercent + polNegPercent;
    if (polSum !== 100) {
      const diff = 100 - polSum;
      if (politicalPos >= politicalNeut && politicalPos >= politicalNeg) {
        polPosPercent += diff;
      } else if (politicalNeut >= politicalNeg) {
        polNeutPercent += diff;
      } else {
        polNegPercent += diff;
      }
    }

    // Calculate percentages for non-political posts
    let nonPolPosPercent = Math.round((nonPoliticalPos / nonPoliticalTotal) * 100);
    let nonPolNeutPercent = Math.round((nonPoliticalNeut / nonPoliticalTotal) * 100);
    let nonPolNegPercent = Math.round((nonPoliticalNeg / nonPoliticalTotal) * 100);

    const nonPolSum = nonPolPosPercent + nonPolNeutPercent + nonPolNegPercent;
    if (nonPolSum !== 100) {
      const diff = 100 - nonPolSum;
      if (nonPoliticalPos >= nonPoliticalNeut && nonPoliticalPos >= nonPoliticalNeg) {
        nonPolPosPercent += diff;
      } else if (nonPoliticalNeut >= nonPoliticalNeg) {
        nonPolNeutPercent += diff;
      } else {
        nonPolNegPercent += diff;
      }
    }

    return {
      hasData: true,
      political: {
        segments: [
          { label: 'Positive or happy tone', percentage: polPosPercent, count: politicalPos, color: '#86EFAC' },
          { label: 'Neutral or balanced tone', percentage: polNeutPercent, count: politicalNeut, color: '#CBD5E1' },
          { label: 'Negative or outrage tone', percentage: polNegPercent, count: politicalNeg, color: '#FCA5A5' },
        ],
        total: politicalTotal,
      },
      nonPolitical: {
        segments: [
          { label: 'Positive or happy tone', percentage: nonPolPosPercent, count: nonPoliticalPos, color: '#86EFAC' },
          { label: 'Neutral or balanced tone', percentage: nonPolNeutPercent, count: nonPoliticalNeut, color: '#CBD5E1' },
          { label: 'Negative or outrage tone', percentage: nonPolNegPercent, count: nonPoliticalNeg, color: '#FCA5A5' },
        ],
        total: nonPoliticalTotal,
      },
    };
  };

  const politicalVsNonPoliticalTone = computePoliticalVsNonPoliticalTone();

  // ===========================================
  // SECTION 5.3 - Selling vs Not Selling Tone
  // ===========================================

  const computeSellingVsNotSellingTone = () => {
    // Count tone for selling vs not selling posts
    let sellingPos = 0;
    let sellingNeut = 0;
    let sellingNeg = 0;

    let notSellingPos = 0;
    let notSellingNeut = 0;
    let notSellingNeg = 0;

    for (const scan of scans) {
      const detail = scanDetails[scan.id];
      if (!detail) continue;

      const feedItems = getFeedItems(detail);
      for (const item of feedItems) {
        const valence = item.emotions?.valence;
        const isSelling = item.influence?.is_ad || item.influence?.likely_influence;

        if (valence === 'POSITIVE' || valence === 'NEUTRAL' || valence === 'NEGATIVE') {
          if (isSelling) {
            if (valence === 'POSITIVE') sellingPos++;
            else if (valence === 'NEUTRAL') sellingNeut++;
            else if (valence === 'NEGATIVE') sellingNeg++;
          } else {
            if (valence === 'POSITIVE') notSellingPos++;
            else if (valence === 'NEUTRAL') notSellingNeut++;
            else if (valence === 'NEGATIVE') notSellingNeg++;
          }
        }
      }
    }

    const sellingTotal = sellingPos + sellingNeut + sellingNeg;
    const notSellingTotal = notSellingPos + notSellingNeut + notSellingNeg;

    // Must have at least 10 posts in BOTH groups
    if (sellingTotal < 10 || notSellingTotal < 10) {
      return { hasData: false };
    }

    // Calculate percentages for selling posts
    let sellPosPercent = Math.round((sellingPos / sellingTotal) * 100);
    let sellNeutPercent = Math.round((sellingNeut / sellingTotal) * 100);
    let sellNegPercent = Math.round((sellingNeg / sellingTotal) * 100);

    const sellSum = sellPosPercent + sellNeutPercent + sellNegPercent;
    if (sellSum !== 100) {
      const diff = 100 - sellSum;
      if (sellingPos >= sellingNeut && sellingPos >= sellingNeg) {
        sellPosPercent += diff;
      } else if (sellingNeut >= sellingNeg) {
        sellNeutPercent += diff;
      } else {
        sellNegPercent += diff;
      }
    }

    // Calculate percentages for not selling posts
    let notSellPosPercent = Math.round((notSellingPos / notSellingTotal) * 100);
    let notSellNeutPercent = Math.round((notSellingNeut / notSellingTotal) * 100);
    let notSellNegPercent = Math.round((notSellingNeg / notSellingTotal) * 100);

    const notSellSum = notSellPosPercent + notSellNeutPercent + notSellNegPercent;
    if (notSellSum !== 100) {
      const diff = 100 - notSellSum;
      if (notSellingPos >= notSellingNeut && notSellingPos >= notSellingNeg) {
        notSellPosPercent += diff;
      } else if (notSellingNeut >= notSellingNeg) {
        notSellNeutPercent += diff;
      } else {
        notSellNegPercent += diff;
      }
    }

    return {
      hasData: true,
      selling: {
        segments: [
          { label: 'Positive or happy tone', percentage: sellPosPercent, count: sellingPos, color: '#86EFAC' },
          { label: 'Neutral or balanced tone', percentage: sellNeutPercent, count: sellingNeut, color: '#CBD5E1' },
          { label: 'Negative or outrage tone', percentage: sellNegPercent, count: sellingNeg, color: '#FCA5A5' },
        ],
        total: sellingTotal,
      },
      notSelling: {
        segments: [
          { label: 'Positive or happy tone', percentage: notSellPosPercent, count: notSellingPos, color: '#86EFAC' },
          { label: 'Neutral or balanced tone', percentage: notSellNeutPercent, count: notSellingNeut, color: '#CBD5E1' },
          { label: 'Negative or outrage tone', percentage: notSellNegPercent, count: notSellingNeg, color: '#FCA5A5' },
        ],
        total: notSellingTotal,
      },
    };
  };

  const sellingVsNotSellingTone = computeSellingVsNotSellingTone();

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="space-y-8">
      {/* Section 5.1 - Tone Distribution */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Tone distribution</h2>

        {toneDistribution.hasData ? (
          <div className="space-y-4">
            <CompositionBar100WithCounts segments={toneDistribution.segments} />
            <DenominatorLine text={`Percent of posts in the selected date range (${toneDistribution.knownValenceTotal} posts)`} />

            {/* Top 5 Positive Sources */}
            {toneDistribution.topPositive.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 5 sources by positive post volume</h3>
                <div className="space-y-2">
                  {toneDistribution.topPositive.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-800">@{item.handle}</span>
                      <span className="text-slate-600">{item.count} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 5 Negative Sources */}
            {toneDistribution.topNegative.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 5 sources by negative post volume</h3>
                <div className="space-y-2">
                  {toneDistribution.topNegative.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-800">@{item.handle}</span>
                      <span className="text-slate-600">{item.count} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Not enough posts with known tone in this window.
            </p>
          </div>
        )}
      </section>

      {/* Section 5.2 - Tone: Political vs Non-Political */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Tone: political vs non-political</h2>

        {politicalVsNonPoliticalTone.hasData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Political Posts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Political posts</h3>
              <CompositionBar100WithCounts segments={politicalVsNonPoliticalTone.political.segments} />
              <DenominatorLine text={`Percent of political posts (${politicalVsNonPoliticalTone.political.total} posts)`} />
            </div>

            {/* Non-Political Posts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Non-political posts</h3>
              <CompositionBar100WithCounts segments={politicalVsNonPoliticalTone.nonPolitical.segments} />
              <DenominatorLine text={`Percent of non-political posts (${politicalVsNonPoliticalTone.nonPolitical.total} posts)`} />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Not enough posts in both political and non-political groups to compare tone.
            </p>
          </div>
        )}
      </section>

      {/* Section 5.3 - Tone: Selling vs Not Selling */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Tone: selling vs not selling</h2>

        {sellingVsNotSellingTone.hasData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selling Posts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Selling posts</h3>
              <CompositionBar100WithCounts segments={sellingVsNotSellingTone.selling.segments} />
              <DenominatorLine text={`Percent of selling posts (${sellingVsNotSellingTone.selling.total} posts)`} />
            </div>

            {/* Not Selling Posts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Not selling posts</h3>
              <CompositionBar100WithCounts segments={sellingVsNotSellingTone.notSelling.segments} />
              <DenominatorLine text={`Percent of not selling posts (${sellingVsNotSellingTone.notSelling.total} posts)`} />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 italic">
              Not enough posts in both selling and not selling groups to compare tone.
            </p>
          </div>
        )}
      </section>

      {/* Section 5.4 - Master Numbers Line */}
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

export default ToneTab;
